import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, key);
}

function json(data, status = 200) {
  return Response.json(data, { status });
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(value) {
  return new Set(
    normalizeText(value)
      .split(" ")
      .filter((token) => token.length > 1)
  );
}

function textSimilarity(a, b) {
  const aa = normalizeText(a);
  const bb = normalizeText(b);

  if (!aa || !bb) return 0;
  if (aa === bb) return 1;
  if (aa.includes(bb) || bb.includes(aa)) return 0.92;

  const aTokens = tokenSet(aa);
  const bTokens = tokenSet(bb);

  if (!aTokens.size || !bTokens.size) return 0;

  let common = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) common++;
  }

  return common / Math.max(aTokens.size, bTokens.size);
}

function brandScore(a, b) {
  const aa = normalizeText(a);
  const bb = normalizeText(b);

  if (!aa || !bb) return 0;
  if (aa === bb) return 1;

  const aliases = [
    ["apple", "iphone"],
    ["xiaomi", "redmi", "mi"],
    ["google", "pixel"],
    ["motorola", "moto"],
    ["oneplus", "one plus"],
    ["vivo", "iqoo", "i qoo"],
    ["realme", "real me"]
  ];

  for (const group of aliases) {
    if (group.includes(aa) && group.includes(bb)) return 1;
  }

  return textSimilarity(aa, bb);
}

async function findBestPhoneForTacRow() {
  // Disabled for public IMEI lookups: fuzzy matching can confuse
  // closely related models (for example Pro vs Pro Max).
  return null;
}

function modelsAgree(reportedModel, phoneModel, reportedNumber = "") {
  const reported = normalizeText(reportedModel);
  const phone = normalizeText(phoneModel);
  const number = normalizeText(reportedNumber);

  if (!reported && !number) return true;
  if (!phone) return false;

  if (reported && reported === phone) return true;
  if (number && (phone === number || phone.includes(number) || number.includes(phone))) {
    return true;
  }

  // Never accept substring-only matches between sibling models such as
  // "iphone 12 pro" and "iphone 12 pro max".
  return false;
}


async function getPhoneById(supabase, phoneId) {
  const { data, error } = await supabase
    .from("phones")
    .select(
      "phone_id,model_name,slug,specs_json,images,brand_id,brands(brand_id,name)"
    )
    .eq("phone_id", phoneId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

function buildPhoneResponse(phone, imei, tac, extra = {}) {
  return {
    ...extra,
    tac,
    imei,
    phone_id: phone.phone_id,
    brand_id: phone.brand_id,
    model_name: phone.model_name,
    slug: phone.slug,
    specs_json: phone.specs_json,
    images: phone.images,
    brand_name:
      phone.brands?.name ||
      extra.reported_brand ||
      null,
    reported_brand:
      extra.reported_brand ||
      phone.brands?.name ||
      null,
    reported_model_name:
      extra.reported_model_name ||
      phone.model_name ||
      null,
  };
}

export async function GET(request, { params }) {
  try {
    const supabase = getSupabase();

    const resolvedParams = await params;

    const imei = String(
      resolvedParams?.imei || ""
    ).replace(/\D/g, "");

    if (!/^\d{15}$/.test(imei)) {
      return json(
        {
          success: false,
          error:
            "Invalid IMEI. IMEI must contain exactly 15 digits.",
        },
        400
      );
    }

    const tac = imei.slice(0, 8);

    /*
     * -------------------------------------------------------
     * 1. CLOUDFLARE LOCAL TAC
     *
     * Current generator fallback format:
     * 99 + six-digit phone_id
     * -------------------------------------------------------
     */
    if (/^99\d{6}$/.test(tac)) {
      const phoneId = Number(tac.slice(2));

      const phone = await getPhoneById(
        supabase,
        phoneId
      );

      if (phone) {
        return json({
          success: true,
          data: buildPhoneResponse(
            phone,
            imei,
            tac,
            {
              tac_id: null,
              reported_model_number: null,
              reported_region: null,
              reported_year: null,
              device_type: null,
              match_status:
                "local_tac_match",
              match_confidence: 1,
              source:
                "cloudflare_local_tac",
            }
          ),
        });
      }
    }

    /*
     * -------------------------------------------------------
     * 2. EXACT TAC ALLOCATION
     * -------------------------------------------------------
     */
    const {
      data: allocations,
      error: allocationError,
    } = await supabase
      .from("tac_allocations")
      .select(
        "tac_id,tac,phone_id,match_status,match_confidence"
      )
      .eq("tac", tac)
      .order(
        "match_confidence",
        {
          ascending: false,
          nullsFirst: false,
        }
      )
      .limit(50);

    if (!allocationError) {
      const mapped =
        (allocations || []).find(
          (row) => row.phone_id
        );

      if (mapped) {
        const phone = await getPhoneById(
          supabase,
          mapped.phone_id
        );

        if (phone) {
          // Cross-check against TAC-reported identity before attaching
          // our internal phone record/image/specs.
          const { data: verifyRows } = await supabase
            .from("v_tac_lookup")
            .select("reported_brand,reported_model_name,reported_model_number")
            .eq("tac", tac)
            .order("match_confidence", { ascending: false, nullsFirst: false })
            .limit(5);

          const verify = (verifyRows || []).find(
            (row) => row.reported_model_name || row.reported_model_number
          );

          if (
            !verify ||
            modelsAgree(
              verify.reported_model_name,
              phone.model_name,
              verify.reported_model_number
            )
          ) {
            return json({
              success: true,
              data: buildPhoneResponse(
                phone,
                imei,
                tac,
                {
                  ...mapped,
                  ...(verify || {}),
                  match_status:
                    mapped.match_status ||
                    "matched",
                  match_confidence:
                    mapped.match_confidence ??
                    1,
                  source:
                    "tac_allocations",
                  image_match_verified: true,
                }
              ),
            });
          }

          // TAC metadata disagrees with the internal phone mapping.
          // Return the TAC-reported identity without a potentially wrong image.
          return json({
            success: true,
            data: {
              ...mapped,
              ...verify,
              tac,
              imei,
              phone_id: null,
              model_name: null,
              brand_name: verify?.reported_brand || null,
              specs_json: null,
              images: [],
              match_status: "mapping_conflict",
              match_confidence: 0,
              source: "tac_mapping_conflict",
              image_match_verified: false,
            },
          });
        }
      }
    }

    /*
     * -------------------------------------------------------
     * 3. LEGACY imei_lookups
     *
     * The generator itself can use this table as a fallback.
     * Previously the live checker did NOT check it, meaning an
     * IMEI could be generated successfully but fail lookup.
     * -------------------------------------------------------
     */
    try {
      const {
        data: legacyRows,
        error: legacyError,
      } = await supabase
        .from("imei_lookups")
        .select("phone_id,tac")
        .eq("tac", tac)
        .not("phone_id", "is", null)
        .limit(50);

      if (!legacyError) {
        const legacy =
          (legacyRows || []).find(
            (row) => row.phone_id
          );

        if (legacy) {
          const phone =
            await getPhoneById(
              supabase,
              legacy.phone_id
            );

          if (phone) {
            return json({
              success: true,
              data: buildPhoneResponse(
                phone,
                imei,
                tac,
                {
                  match_status:
                    "legacy_tac_match",
                  match_confidence: 1,
                  source:
                    "imei_lookups",
                }
              ),
            });
          }
        }
      }
    } catch {
      // Legacy table is optional.
    }

    /*
     * -------------------------------------------------------
     * 4. v_tac_lookup FALLBACK
     * -------------------------------------------------------
     */
    const {
      data: tacRows,
      error: tacError,
    } = await supabase
      .from("v_tac_lookup")
      .select("*")
      .eq("tac", tac)
      .order(
        "match_confidence",
        {
          ascending: false,
          nullsFirst: false,
        }
      )
      .limit(50);

    if (!tacError && tacRows?.length) {
      const best =
        tacRows.find(
          (row) => row.phone_id
        ) ||
        tacRows[0];

      if (best.phone_id) {
        const phone =
          await getPhoneById(
            supabase,
            best.phone_id
          );

        if (phone) {
          if (
            modelsAgree(
              best.reported_model_name,
              phone.model_name,
              best.reported_model_number
            )
          ) {
            return json({
              success: true,
              data: buildPhoneResponse(
                phone,
                imei,
                tac,
                {
                  ...best,
                  image_match_verified: true,
                }
              ),
            });
          }

          return json({
            success: true,
            data: {
              ...best,
              tac,
              imei,
              phone_id: null,
              model_name: null,
              brand_name: best.reported_brand || null,
              specs_json: null,
              images: [],
              match_status: "mapping_conflict",
              match_confidence: 0,
              source: "v_tac_lookup_conflict",
              image_match_verified: false,
            },
          });
        }
      }

      /*
       * TAC is known but has no direct phone_id.
       * Try to map its reported brand/model to our phone DB.
       * This gives real/random IMEI lookups the same local
       * device image/spec record whenever confidence is safe.
       */
      const matchedPhone =
        await findBestPhoneForTacRow(
          supabase,
          best
        );

      if (matchedPhone) {
        return json({
          success: true,
          data: buildPhoneResponse(
            matchedPhone,
            imei,
            tac,
            {
              ...best,
              match_status:
                best.match_status ||
                "reported_model_matched",
              match_confidence:
                best.match_confidence ?? 0.9,
              source:
                best.source ||
                "v_tac_lookup_model_match",
            }
          ),
        });
      }

      /*
       * TAC exists but we still cannot safely identify one of
       * our internal phones. Return TAC metadata without
       * inventing a device image.
       */
      return json({
        success: true,
        data: {
          ...best,
          tac,
          imei,
        },
      });
    }

    /*
     * No source knows this TAC.
     */
    return json(
      {
        success: false,
        error:
          "No device mapping was found for this IMEI TAC.",
      },
      404
    );

  } catch (error) {
    console.error(
      "Public IMEI lookup error",
      error
    );

    return json(
      {
        success: false,
        error:
          error?.message ||
          "IMEI lookup failed",
      },
      500
    );
  }
}
