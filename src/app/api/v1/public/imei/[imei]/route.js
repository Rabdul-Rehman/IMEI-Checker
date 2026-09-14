import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase environment variables");
  return createClient(url, key);
}

function json(data, status = 200) {
  return Response.json(data, { status });
}

async function getPhoneById(supabase, phoneId) {
  const { data, error } = await supabase
    .from("phones")
    .select("phone_id,model_name,slug,specs_json,images,brand_id,brands(brand_id,name)")
    .eq("phone_id", phoneId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function GET(request, { params }) {
  try {
    const supabase = getSupabase();
    const imei = String((await params).imei || "").replace(/\D/g, "");

    if (!/^\d{15}$/.test(imei)) {
      return json({ success: false, error: "Invalid IMEI. IMEI must contain exactly 15 digits." }, 400);
    }

    const tac = imei.slice(0, 8);

    // Cloudflare-local TAC: 99 + six-digit phone_id.
    if (/^99\d{6}$/.test(tac)) {
      const phoneId = Number(tac.slice(2));
      const phone = await getPhoneById(supabase, phoneId);

      if (phone) {
        return json({
          success: true,
          data: {
            tac_id: null,
            tac,
            phone_id: phone.phone_id,
            brand_id: phone.brand_id,
            reported_brand: phone.brands?.name || null,
            reported_model_name: phone.model_name,
            reported_model_number: null,
            reported_region: null,
            reported_year: null,
            device_type: null,
            match_status: "local_tac_match",
            match_confidence: 1,
            source: "cloudflare_local_tac",
            model_name: phone.model_name,
            slug: phone.slug,
            specs_json: phone.specs_json,
            images: phone.images,
            brand_name: phone.brands?.name || null,
            imei,
          },
        });
      }
    }

    const { data: allocations, error: allocError } = await supabase
      .from("tac_allocations")
      .select("tac_id,tac,phone_id,match_status,match_confidence")
      .eq("tac", tac)
      .order("match_confidence", { ascending: false, nullsFirst: false })
      .limit(20);

    if (allocError) throw allocError;

    const mapped = (allocations || []).find((row) => row.phone_id);

    if (mapped) {
      const phone = await getPhoneById(supabase, mapped.phone_id);

      if (phone) {
        return json({
          success: true,
          data: {
            ...mapped,
            tac,
            imei,
            phone_id: phone.phone_id,
            brand_id: phone.brand_id,
            model_name: phone.model_name,
            slug: phone.slug,
            specs_json: phone.specs_json,
            images: phone.images,
            brand_name: phone.brands?.name || null,
            reported_brand: phone.brands?.name || null,
            reported_model_name: phone.model_name,
            match_status: mapped.match_status || "matched",
            match_confidence: mapped.match_confidence ?? 1,
          },
        });
      }
    }

    const { data: tacRows, error: tacError } = await supabase
      .from("v_tac_lookup")
      .select("*")
      .eq("tac", tac)
      .order("match_confidence", { ascending: false, nullsFirst: false })
      .limit(20);

    if (tacError) throw tacError;

    if (!tacRows || tacRows.length === 0) {
      return json({ success: false, error: "Device not found" }, 404);
    }

    const best = tacRows.find((row) => row.phone_id) || tacRows[0];

    if (best.phone_id) {
      const phone = await getPhoneById(supabase, best.phone_id);
      if (phone) {
        return json({
          success: true,
          data: {
            ...best,
            tac,
            imei,
            phone_id: phone.phone_id,
            brand_id: phone.brand_id,
            model_name: phone.model_name,
            slug: phone.slug,
            specs_json: phone.specs_json,
            images: phone.images,
            brand_name: phone.brands?.name || best.reported_brand || null,
          },
        });
      }
    }

    return json({
      success: true,
      data: {
        ...best,
        tac,
        imei,
      },
    });
  } catch (error) {
    console.error("Public IMEI lookup error", error);
    return json({ success: false, error: error?.message || "IMEI lookup failed" }, 500);
  }
}
