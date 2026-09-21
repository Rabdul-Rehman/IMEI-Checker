-- Fast, conservative model-number TAC mapper.
-- Run this file repeatedly in Supabase SQL Editor.
-- Each run handles only the next 5,000 unmapped TAC rows, avoiding hosted-editor timeouts.

CREATE OR REPLACE FUNCTION public.normalize_device_identity(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT trim(regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', '', 'g'));
$$;

CREATE INDEX IF NOT EXISTS idx_tac_allocations_unmapped_id
  ON public.tac_allocations (tac_id)
  WHERE phone_id IS NULL;

-- Materialize normalized catalog identifiers once per run instead of repeatedly
-- evaluating phone JSON for every TAC row.
CREATE TEMP TABLE _phone_model_numbers ON COMMIT DROP AS
SELECT DISTINCT
  p.phone_id,
  p.brand_id,
  public.normalize_device_identity(p.model_name) AS model_name_norm,
  public.normalize_device_identity(coalesce(
    p.specs_json->'General'->>'model_number',
    p.specs_json->'general'->>'model_number',
    ''
  )) AS model_number_norm
FROM public.phones p;

CREATE INDEX ON _phone_model_numbers(model_name_norm);
CREATE INDEX ON _phone_model_numbers(model_number_norm);

CREATE TEMP TABLE _batch ON COMMIT DROP AS
SELECT
  t.tac_id,
  t.tac,
  t.phone_id,
  t.brand_id,
  t.reported_brand,
  t.reported_model_number,
  t.match_status,
  t.match_confidence
FROM public.tac_allocations t
WHERE t.phone_id IS NULL
  AND nullif(trim(t.reported_model_number), '') IS NOT NULL
ORDER BY t.tac_id
LIMIT 5000;

CREATE INDEX ON _batch(tac_id);

CREATE TEMP TABLE _candidates ON COMMIT DROP AS
SELECT
  b.tac_id,
  min(p.phone_id) AS phone_id,
  min(p.brand_id) AS brand_id,
  count(DISTINCT p.phone_id) AS candidate_count
FROM _batch b
JOIN _phone_model_numbers p
  ON public.normalize_device_identity(b.reported_model_number) IN
     (p.model_name_norm, p.model_number_norm)
LEFT JOIN public.brands pb ON pb.brand_id = p.brand_id
WHERE
  nullif(public.normalize_device_identity(b.reported_brand), '') IS NULL
  OR public.normalize_device_identity(b.reported_brand) =
     public.normalize_device_identity(pb.name)
GROUP BY b.tac_id;

CREATE INDEX ON _candidates(tac_id);

INSERT INTO public.tac_mapping_audit
  (tac_id, tac, old_phone_id, new_phone_id, old_brand_id, new_brand_id,
   mapping_method, previous_status, previous_confidence)
SELECT
  b.tac_id, b.tac, b.phone_id, c.phone_id, b.brand_id, c.brand_id,
  'unique_exact_model_number', b.match_status, b.match_confidence
FROM _batch b
JOIN _candidates c ON c.tac_id = b.tac_id
WHERE c.candidate_count = 1
ON CONFLICT DO NOTHING;

UPDATE public.tac_allocations t
SET phone_id = c.phone_id,
    brand_id = coalesce(t.brand_id, c.brand_id),
    match_status = 'auto_matched',
    match_confidence = greatest(coalesce(t.match_confidence, 0), 0.97),
    updated_at = now()
FROM _candidates c
WHERE t.tac_id = c.tac_id
  AND t.phone_id IS NULL
  AND c.candidate_count = 1;

SELECT
  (SELECT count(*) FROM _batch) AS batch_examined,
  (SELECT count(*) FROM _candidates WHERE candidate_count = 1) AS newly_mapped_this_batch,
  count(*) FILTER (WHERE phone_id IS NOT NULL) AS mapped_tacs,
  count(*) FILTER (WHERE phone_id IS NULL) AS unmapped_tacs,
  round(100.0 * count(*) FILTER (WHERE phone_id IS NOT NULL) / nullif(count(*),0), 2) AS mapped_percent
FROM public.tac_allocations;
