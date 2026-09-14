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

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function brandCompatible(a, b) {
  const aa = normalizeText(a);
  const bb = normalizeText(b);
  if (!aa || !bb) return true;
  if (aa === bb) return true;
  const groups = [
    ["apple", "iphone"],
    ["xiaomi", "mi", "redmi", "poco"],
    ["google", "pixel"],
    ["motorola", "moto"],
    ["vivo", "iqoo"],
    ["realme", "oppo"],
  ];
  return groups.some((g) => g.includes(aa) && g.includes(bb));
}

function variants(value) {
  const set = new Set(normalizeText(value).split(" "));
  return ["pro", "max", "mini", "ultra", "plus", "lite", "fold", "flip", "fe", "se", "neo"]
    .filter((v) => set.has(v));
}

function numericTokens(value) {
  return normalizeText(value)
    .split(" ")
    .filter((t) => /\d/.test(t));
}

const BRAND_PREFIXES = [
  "apple", "google", "xiaomi", "samsung", "motorola", "oneplus",
  "oppo", "realme", "vivo", "iqoo", "huawei", "honor", "nokia",
  "sony", "tecno", "infinix", "itel", "lg", "htc", "zte", "asus"
];

function canonicalModel(value) {
  const parts = normalizeText(value).split(" ").filter(Boolean);

  while (parts.length && BRAND_PREFIXES.includes(parts[0])) {
    parts.shift();
  }

  return parts.join(" ");
}

function modelsAgree(reportedModel, phoneModel, reportedNumber = "") {
  const reported = canonicalModel(reportedModel);
  const phone = canonicalModel(phoneModel);
  const number = normalizeText(reportedNumber);

  if (!reported && !number) return true;
  if (!phone) return false;

  // Exact marketing-model equality after removing manufacturer prefixes.
  // This safely handles:
  // "Apple iPhone 12 Mini" -> "iPhone 12 mini"
  // "Google Pixel 7"       -> "Pixel 7"
  // "Xiaomi Mi 11 Lite"    -> "Mi 11 Lite"
  if (reported && reported === phone) return true;

  const rv = variants(reported);
  const pv = variants(phone);
  if (rv.join("|") !== pv.join("|")) return false;

  const rn = numericTokens(reported);
  const pn = numericTokens(phone);
  if (rn.length && pn.length && rn.join("|") !== pn.join("|")) return false;

  // Model-number match is useful only when the internal model string actually
  // contains the identifier. Do not let it override sibling-model checks.
  if (
    number &&
    (phone === number || phone.includes(number) || number.includes(phone))
  ) {
    return true;
  }

  return false;
}

async function getPhoneById(supabase, phoneId) {
  const { data, error } = await supabase
    .from("phones")
    .select("phone_id,model_name,slug,specs_json,images,brand_id,brands(brand_id,name)")
    .eq("phone_id", phoneId)
    .single();
  return error ? null : data;
}

async function findStrictPhoneByReportedIdentity(supabase, row) {
  const reportedBrand = row?.reported_brand || row?.brand_name || "";
  const reportedModel = row?.reported_model_name || row?.model_name || "";
  const reportedNumber = row?.reported_model_number || row?.model_number || "";

  const canonicalReportedModel = canonicalModel(reportedModel);

  const terms = [
    reportedModel,
    canonicalReportedModel,
    reportedNumber,
    // IMPORTANT: search useful multi-token model phrases, not only the whole
    // reported string. Supabase ILIKE "%Apple iPhone 12 Mini%" will not find
    // an internal model stored as "iPhone 12 mini".
    ...(() => {
      const tokens = canonicalReportedModel.split(" ").filter(Boolean);
      const phrases = [];
      for (let size = Math.min(4, tokens.length); size >= 2; size -= 1) {
        for (let i = 0; i <= tokens.length - size; i += 1) {
          phrases.push(tokens.slice(i, i + size).join(" "));
        }
      }
      return phrases;
    })(),
    ...canonicalReportedModel
      .split(" ")
      .filter((token) => token.length >= 2)
  ]
    .map((x) => String(x || "").trim())
    .filter((x) => x.length >= 3);

  const uniqueTerms = [...new Set(terms)];

  const candidates = new Map();

  for (const term of uniqueTerms) {
    const { data, error } = await supabase
      .from("phones")
      .select("phone_id,model_name,slug,specs_json,images,brand_id,brands(brand_id,name)")
      .ilike("model_name", `%${term}%`)
      .limit(100);

    if (!error) {
      for (const phone of data || []) candidates.set(phone.phone_id, phone);
    }
  }

  for (const phone of candidates.values()) {
    if (!brandCompatible(phone?.brands?.name, reportedBrand)) continue;
    if (modelsAgree(reportedModel, phone.model_name, reportedNumber)) return phone;
  }

  return null;
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
    brand_name: phone.brands?.name || extra.reported_brand || null,
    reported_brand: extra.reported_brand || phone.brands?.name || null,
    reported_model_name: extra.reported_model_name || phone.model_name || null,
    image_match_verified: true,
  };
}

export async function GET(request, { params }) {
  try {
    const supabase = getSupabase();
    const resolvedParams = await params;
    const imei = String(resolvedParams?.imei || "").replace(/\D/g, "");

    if (!/^\d{15}$/.test(imei)) {
      return json({ success: false, error: "Invalid IMEI. IMEI must contain exactly 15 digits." }, 400);
    }

    const tac = imei.slice(0, 8);

    if (/^99\d{6}$/.test(tac)) {
      const phone = await getPhoneById(supabase, Number(tac.slice(2)));
      if (phone) return json({ success: true, data: buildPhoneResponse(phone, imei, tac, { match_status: "local_tac_match", match_confidence: 1, source: "cloudflare_local_tac" }) });
    }

    const { data: allocations } = await supabase
      .from("tac_allocations")
      .select("tac_id,tac,phone_id,match_status,match_confidence")
      .eq("tac", tac)
      .order("match_confidence", { ascending: false, nullsFirst: false })
      .limit(50);

    const mapped = (allocations || []).find((row) => row.phone_id);
    if (mapped) {
      const phone = await getPhoneById(supabase, mapped.phone_id);
      if (phone) {
        const { data: verifyRows } = await supabase
          .from("v_tac_lookup")
          .select("reported_brand,reported_model_name,reported_model_number,reported_region,reported_year,device_type")
          .eq("tac", tac)
          .order("match_confidence", { ascending: false, nullsFirst: false })
          .limit(5);
        const verify = (verifyRows || []).find((row) => row.reported_model_name || row.reported_model_number);
        if (!verify || modelsAgree(verify.reported_model_name, phone.model_name, verify.reported_model_number)) {
          return json({ success: true, data: buildPhoneResponse(phone, imei, tac, { ...mapped, ...(verify || {}), source: "tac_allocations" }) });
        }

        // The TAC row can contain an old/wrong phone_id while the reported
        // marketing identity is correct. Resolve that identity to the phones
        // table so the response gets the correct phone_id and local image.
        const correctedPhone = await findStrictPhoneByReportedIdentity(supabase, verify);
        if (correctedPhone) {
          return json({ success: true, data: buildPhoneResponse(correctedPhone, imei, tac, {
            ...mapped,
            ...(verify || {}),
            match_status: "reported_model_exact_match",
            match_confidence: Math.max(Number(mapped.match_confidence) || 0, 0.9),
            source: "tac_allocation_identity_corrected",
          }) });
        }
      }
    }

    try {
      const { data: legacyRows } = await supabase
        .from("imei_lookups")
        .select("phone_id,tac")
        .eq("tac", tac)
        .not("phone_id", "is", null)
        .limit(50);
      const legacy = (legacyRows || []).find((row) => row.phone_id);
      if (legacy) {
        const phone = await getPhoneById(supabase, legacy.phone_id);
        if (phone) return json({ success: true, data: buildPhoneResponse(phone, imei, tac, { match_status: "legacy_tac_match", match_confidence: 1, source: "imei_lookups" }) });
      }
    } catch {}

    const { data: tacRows, error: tacError } = await supabase
      .from("v_tac_lookup")
      .select("*")
      .eq("tac", tac)
      .order("match_confidence", { ascending: false, nullsFirst: false })
      .limit(50);

    if (!tacError && tacRows?.length) {
      const best = tacRows.find((row) => row.phone_id) || tacRows[0];

      if (best.phone_id) {
        const phone = await getPhoneById(supabase, best.phone_id);
        if (phone && modelsAgree(best.reported_model_name, phone.model_name, best.reported_model_number)) {
          return json({ success: true, data: buildPhoneResponse(phone, imei, tac, best) });
        }
      }

      const strictPhone = await findStrictPhoneByReportedIdentity(supabase, best);
      if (strictPhone) {
        return json({
          success: true,
          data: buildPhoneResponse(strictPhone, imei, tac, {
            ...best,
            match_status: best.match_status || "reported_model_exact_match",
            match_confidence: best.match_confidence ?? 0.9,
            source: "v_tac_lookup_exact_phone_match",
          }),
        });
      }

      return json({
        success: true,
        data: {
          ...best,
          tac,
          imei,
          phone_id: null,
          images: [],
          image_match_verified: false,
        },
      });
    }

    return json({ success: false, error: "No device mapping was found for this IMEI TAC." }, 404);
  } catch (error) {
    console.error("Public IMEI lookup error", error);
    return json({ success: false, error: error?.message || "IMEI lookup failed" }, 500);
  }
}
