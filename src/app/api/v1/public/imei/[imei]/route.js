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
          return json({
            success: true,
            data: buildPhoneResponse(
              phone,
              imei,
              tac,
              {
                ...mapped,
                match_status:
                  mapped.match_status ||
                  "matched",
                match_confidence:
                  mapped.match_confidence ??
                  1,
                source:
                  "tac_allocations",
              }
            ),
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
          return json({
            success: true,
            data: buildPhoneResponse(
              phone,
              imei,
              tac,
              best
            ),
          });
        }
      }

      /*
       * TAC exists but there is no matched internal phone.
       * Still return the TAC information instead of throwing.
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
