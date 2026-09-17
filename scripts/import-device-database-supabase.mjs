#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const input = process.argv[2];
const output = process.argv[3] || "supabase-device-import.sql";
if (!input) {
  console.error("Usage: node scripts/import-device-database-supabase.mjs <devices.json> [output.sql]");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(path.resolve(input), "utf8"));
if (!Array.isArray(data)) throw new Error("Input must be a JSON array");

const q = (value) => value == null ? "NULL" : `'${String(value).replaceAll("'", "''")}'`;
const json = (value) => q(JSON.stringify(value ?? {}));
const slugify = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const seenTac = new Set();
const sql = [
  "BEGIN;",
  "-- Generated import for the existing Supabase schema used by the IMEI Checker API.",
  "-- Only import TACs you are licensed/authorized to use. Synthetic/local TACs are never marked as real allocations."
];

for (const [index, item] of data.entries()) {
  if (!item?.brand || !item?.model) throw new Error(`Row ${index}: brand and model are required`);
  const slug = item.slug || slugify(`${item.brand}-${item.model}`);
  const tacs = Array.isArray(item.tacs) ? item.tacs : [];
  for (const rawTac of tacs) {
    const tac = String(rawTac);
    if (!/^\d{8}$/.test(tac)) throw new Error(`Row ${index}: invalid TAC ${tac}`);
    if (seenTac.has(tac)) throw new Error(`Duplicate TAC in import: ${tac}`);
    seenTac.add(tac);
  }

  sql.push(`INSERT INTO brands (name) SELECT ${q(item.brand)} WHERE NOT EXISTS (SELECT 1 FROM brands WHERE lower(name)=lower(${q(item.brand)}));`);
  sql.push(`INSERT INTO phones (brand_id, model_name, slug, specs_json, images) SELECT b.brand_id, ${q(item.model)}, ${q(slug)}, ${json(item.specs)}, ${json(item.images || [])} FROM brands b WHERE lower(b.name)=lower(${q(item.brand)}) AND NOT EXISTS (SELECT 1 FROM phones p WHERE p.slug=${q(slug)});`);

  for (const rawTac of tacs) {
    const tac = String(rawTac);
    sql.push(`INSERT INTO tac_allocations (tac, phone_id, reported_brand, reported_model_name, reported_model_number, reported_region, reported_year, device_type, match_status, match_confidence, source) SELECT ${q(tac)}, p.phone_id, ${q(item.brand)}, ${q(item.model)}, ${q(item.modelNumber)}, ${q(item.region)}, ${item.releaseYear ? Number(item.releaseYear) : "NULL"}, ${q(item.deviceType || "smartphone")}, 'manual_matched', 1, ${q(item.tacSource || item.source || "curated_import")} FROM phones p WHERE p.slug=${q(slug)} AND NOT EXISTS (SELECT 1 FROM tac_allocations t WHERE t.tac=${q(tac)});`);
  }
}

sql.push("COMMIT;");
fs.writeFileSync(path.resolve(output), sql.join("\n") + "\n");
console.log(`Validated ${data.length} devices / ${seenTac.size} TACs -> ${output}`);
