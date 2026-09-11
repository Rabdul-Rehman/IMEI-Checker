"use server";

import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase environment variables");
  return createClient(url, key);
}

function cleanTac(value) {
  const tac = String(value || "").replace(/\D/g, "");
  return tac.length === 8 ? tac : null;
}

async function deterministicLocalTac(phone) {
  const seed = [
    phone.phone_id,
    phone.brands?.name || "",
    phone.model_name || "",
    phone.slug || "",
  ].join("|");

  const bytes = new TextEncoder().encode(seed);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const view = new Uint8Array(digest);

  let n = 0;
  for (let i = 0; i < 6; i++) n = (n * 256 + view[i]) % 1000000;

  return "99" + String(n).padStart(6, "0");
}

function luhnDigit(number14) {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = Number(number14[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return String((10 - (sum % 10)) % 10);
}

function generateImei(tac) {
  const clean = cleanTac(tac);
  if (!clean) throw new Error("Invalid TAC");

  const random = new Uint32Array(1);
  crypto.getRandomValues(random);
  const serial = String(random[0] % 1000000).padStart(6, "0");
  const first14 = clean + serial;

  return first14 + luhnDigit(first14);
}

async function getTacForPhone(supabase, phone) {
  const phoneId = Number(phone.phone_id);

  const { data: direct, error: directError } = await supabase
    .from("tac_allocations")
    .select("tac,match_status,match_confidence")
    .eq("phone_id", phoneId)
    .not("tac", "is", null)
    .order("match_confidence", { ascending: false, nullsFirst: false })
    .limit(100);

  if (directError) throw directError;

  const exact = (direct || [])
    .map((row) => ({ ...row, tac: cleanTac(row.tac) }))
    .filter((row) => row.tac);

  if (exact.length) {
    const preferred = exact.find((row) =>
      ["auto_matched", "manual_matched"].includes(
        String(row.match_status || "").toLowerCase()
      )
    );

    return { tac: preferred?.tac || exact[0].tac, local: false };
  }

  try {
    const { data: legacy } = await supabase
      .from("imei_lookups")
      .select("tac")
      .eq("phone_id", phoneId)
      .not("tac", "is", null)
      .limit(100);

    for (const row of legacy || []) {
      const tac = cleanTac(row.tac);
      if (tac) return { tac, local: false };
    }
  } catch {}

  return { tac: await deterministicLocalTac(phone), local: true };
}

function json(data, status = 200) {
  return Response.json(data, { status });
}

export async function GET(request, { params }) {
  try {
    const supabase = getSupabase();
    const parts = params.path || [];

    if (parts.length === 1 && parts[0] === "brands") {
      const { data, error } = await supabase
        .from("brands")
        .select("brand_id,name")
        .order("name");

      if (error) throw error;
      return json({ success: true, data: data || [] });
    }

    if (
      parts.length === 3 &&
      parts[0] === "brands" &&
      /^\d+$/.test(parts[1]) &&
      parts[2] === "models"
    ) {
      const brandId = Number(parts[1]);

      const { data, error } = await supabase
        .from("phones")
        .select("phone_id,model_name,slug,brand_id,brands(name)")
        .eq("brand_id", brandId)
        .order("model_name");

      if (error) throw error;

      const rows = (data || []).map((row) => ({
        ...row,
        brand_name: row.brands?.name || null,
      }));

      return json({ success: true, data: rows });
    }

    if (
      parts.length === 2 &&
      parts[0] === "phones" &&
      /^\d+$/.test(parts[1])
    ) {
      const phoneId = Number(parts[1]);

      const { data: phone, error } = await supabase
        .from("phones")
        .select("phone_id,model_name,slug,brand_id,brands(brand_id,name)")
        .eq("phone_id", phoneId)
        .single();

      if (error || !phone) {
        return json({ success: false, error: "Phone not found" }, 404);
      }

      const tacResult = await getTacForPhone(supabase, phone);

      return json({
        success: true,
        data: {
          phone_id: phone.phone_id,
          model_name: phone.model_name,
          slug: phone.slug,
          brand: phone.brands,
          tac: tacResult.tac,
          local_tac: tacResult.local,
          can_generate: Boolean(tacResult.tac),
        },
      });
    }

    return json({ success: false, error: "Not found" }, 404);
  } catch (error) {
    console.error("IMEI generator GET error", error);
    return json(
      { success: false, error: error?.message || "IMEI generator request failed" },
      500
    );
  }
}

export async function POST(request, { params }) {
  try {
    const parts = params.path || [];

    if (!(parts.length === 1 && parts[0] === "generate")) {
      return json({ success: false, error: "Not found" }, 404);
    }

    const body = await request.json();
    const phoneId = Number(body?.phone_id);
    const requestedCount = Math.min(
      Math.max(Number(body?.count) || 1, 1),
      10
    );

    if (!Number.isInteger(phoneId)) {
      return json({ success: false, error: "phone_id is required" }, 400);
    }

    const supabase = getSupabase();

    const { data: phone, error } = await supabase
      .from("phones")
      .select("phone_id,model_name,slug,brand_id,brands(brand_id,name)")
      .eq("phone_id", phoneId)
      .single();

    if (error || !phone) {
      return json({ success: false, error: "Phone not found" }, 404);
    }

    const tacResult = await getTacForPhone(supabase, phone);

    const imeis = new Set();
    let safety = 0;

    while (imeis.size < requestedCount && safety < 100) {
      imeis.add(generateImei(tacResult.tac));
      safety++;
    }

    return json({
      success: true,
      data: {
        phone_id: phone.phone_id,
        brand: phone.brands?.name || null,
        model_name: phone.model_name,
        tac: tacResult.tac,
        local_tac: tacResult.local,
        count: imeis.size,
        imeis: Array.from(imeis),
      },
    });
  } catch (error) {
    console.error("IMEI generator POST error", error);
    return json(
      { success: false, error: error?.message || "Failed to generate IMEIs" },
      500
    );
  }
}
