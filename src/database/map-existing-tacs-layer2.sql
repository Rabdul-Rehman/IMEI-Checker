-- TAC mapping Layer 2: manufacturer-prefix normalization.
-- Run AFTER map-existing-tacs.sql.
-- Only currently-unmapped TACs are considered. A mapping is applied only when
-- exactly one canonical phone in the already-resolved brand matches.
-- No UI/result-page files are involved.

BEGIN;

-- Reuse/create normalization helper in case this migration is run independently.
CREATE OR REPLACE FUNCTION public.normalize_device_identity(value text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT trim(regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', ' ', 'g'));
$$;

-- Remove only a LEADING manufacturer/brand token from a normalized reported model.
-- Repeated prefixes are intentionally not stripped; conservative matching is preferred.
CREATE OR REPLACE FUNCTION public.normalize_reported_model_layer2(value text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT trim(regexp_replace(
    public.normalize_device_identity(value),
    '^(apple|samsung|xiaomi|redmi|poco|oppo|realme|vivo|oneplus|google|motorola|nokia|huawei|honor|sony|lg|htc|zte|tecno|infinix|itel|asus|lenovo|alcatel|tcl|blu)[ ]+',
    '',
    'i'
  ));
$$;

CREATE INDEX IF NOT EXISTS idx_tac_allocations_reported_model_l2
  ON public.tac_allocations(public.normalize_reported_model_layer2(reported_model_name));

-- Build unique candidates within the canonical brand already assigned by Layer 1.
CREATE TEMP TABLE _layer2_candidates ON COMMIT DROP AS
SELECT
  t.tac_id,
  min(p.phone_id) AS phone_id,
  min(p.brand_id) AS brand_id,
  count(DISTINCT p.phone_id) AS candidate_count
FROM public.tac_allocations t
JOIN public.phones p
  ON p.brand_id = t.brand_id
 AND public.normalize_device_identity(p.model_name) = public.normalize_reported_model_layer2(t.reported_model_name)
WHERE t.phone_id IS NULL
  AND t.brand_id IS NOT NULL
  AND nullif(public.normalize_reported_model_layer2(t.reported_model_name), '') IS NOT NULL
  -- Layer 2 must actually transform the model; otherwise Layer 1 already covered it.
  AND public.normalize_reported_model_layer2(t.reported_model_name)
      <> public.normalize_device_identity(t.reported_model_name)
GROUP BY t.tac_id;
CREATE INDEX ON _layer2_candidates(tac_id);

-- Audit before mutation. The audit table was created by Layer 1.
INSERT INTO public.tac_mapping_audit
  (tac_id, tac, old_phone_id, new_phone_id, old_brand_id, new_brand_id,
   mapping_method, previous_status, previous_confidence)
SELECT
  t.tac_id, t.tac, t.phone_id, c.phone_id, t.brand_id, c.brand_id,
  'prefix_stripped_exact_brand_model', t.match_status, t.match_confidence
FROM public.tac_allocations t
JOIN _layer2_candidates c ON c.tac_id = t.tac_id
WHERE t.phone_id IS NULL
  AND c.candidate_count = 1
ON CONFLICT DO NOTHING;

-- Deterministic automatic matches use the production-allowed auto_matched status.
UPDATE public.tac_allocations t
SET phone_id = c.phone_id,
    brand_id = c.brand_id,
    match_status = 'auto_matched',
    match_confidence = GREATEST(coalesce(t.match_confidence, 0), 0.92),
    updated_at = now()
FROM _layer2_candidates c
WHERE t.tac_id = c.tac_id
  AND t.phone_id IS NULL
  AND c.candidate_count = 1;

COMMIT;

-- Layer-2 result.
SELECT
  count(*) FILTER (WHERE mapping_method = 'prefix_stripped_exact_brand_model') AS layer2_newly_mapped
FROM public.tac_mapping_audit;

-- Overall production coverage after Layer 2.
SELECT
  count(*) AS total_tacs,
  count(*) FILTER (WHERE phone_id IS NOT NULL) AS mapped_tacs,
  count(*) FILTER (WHERE phone_id IS NULL) AS unmapped_tacs,
  round(100.0 * count(*) FILTER (WHERE phone_id IS NOT NULL) / nullif(count(*), 0), 2) AS mapped_percent,
  count(*) FILTER (WHERE match_status = 'auto_matched') AS auto_matched,
  count(*) FILTER (WHERE match_status = 'manual_matched') AS manual_matched,
  count(*) FILTER (WHERE match_status = 'ambiguous') AS ambiguous,
  count(*) FILTER (WHERE match_status = 'unmatched') AS unmatched_status
FROM public.tac_allocations;
