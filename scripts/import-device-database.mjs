#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const input = process.argv[2];
const output = process.argv[3] || "database-import.sql";
if (!input) {
  console.error("Usage: node scripts/import-device-database.mjs <devices.json> [output.sql]");
  process.exit(1);
}

const esc = (v) => `'${String(v ?? "").replaceAll("'", "''")}'`;
const nullable = (v) => v == null || v === "" ? "NULL" : esc(v);
const data = JSON.parse(fs.readFileSync(path.resolve(input), "utf8"));
if (!Array.isArray(data)) throw new Error("Input must be a JSON array");

const seenTac = new Set();
const sql = ["BEGIN TRANSACTION;"];

for (const [index, item] of data.entries()) {
  if (!item?.brand || !item?.model) throw new Error(`Row ${index}: brand and model are required`);
  const tacs = Array.isArray(item.tacs) ? item.tacs : [];
  for (const tac of tacs) {
    if (!/^\d{8}$/.test(String(tac))) throw new Error(`Row ${index}: invalid TAC ${tac}`);
    if (seenTac.has(String(tac))) throw new Error(`Duplicate TAC in import: ${tac}`);
    seenTac.add(String(tac));
  }

  sql.push(`INSERT INTO devices (brand,model,marketing_name,model_number,release_year,device_type,display_size,display_type,processor,ram,battery,main_camera,os,dimensions,weight,sim,network,source,source_url,verified_at) VALUES (${esc(item.brand)},${esc(item.model)},${nullable(item.marketingName)},${nullable(item.modelNumber)},${item.releaseYear ? Number(item.releaseYear) : "NULL"},${esc(item.deviceType || "smartphone")},${nullable(item.displaySize)},${nullable(item.displayType)},${nullable(item.processor)},${nullable(item.ram)},${nullable(item.battery)},${nullable(item.mainCamera)},${nullable(item.os)},${nullable(item.dimensions)},${nullable(item.weight)},${nullable(item.sim)},${nullable(item.network)},${nullable(item.source)},${nullable(item.sourceUrl)},${nullable(item.verifiedAt)});`);
  const deviceId = "(SELECT id FROM devices ORDER BY id DESC LIMIT 1)";

  for (const tac of tacs) sql.push(`INSERT INTO tac_allocations (tac,device_id,allocation_source,confidence) VALUES (${esc(tac)},${deviceId},${nullable(item.tacSource || item.sourceUrl)},${esc(item.tacConfidence || "verified")});`);
  for (const [i, value] of (item.storageOptions || []).entries()) sql.push(`INSERT INTO device_storage_options (device_id,value,sort_order) VALUES (${deviceId},${esc(value)},${i});`);
  for (const [i, c] of (item.colors || []).entries()) {
    if (!c?.name) throw new Error(`Row ${index}: color name required`);
    sql.push(`INSERT INTO device_colors (device_id,name,image_url,hex_value,sort_order,verified,source_url) VALUES (${deviceId},${esc(c.name)},${nullable(c.imageUrl)},${nullable(c.hex)},${i},${c.verified ? 1 : 0},${nullable(c.sourceUrl)});`);
  }
  for (const [i, m] of (item.media || []).entries()) {
    if (!m?.kind || !m?.label || !m?.imageUrl) throw new Error(`Row ${index}: media kind, label and imageUrl required`);
    sql.push(`INSERT INTO device_media (device_id,kind,label,image_url,sort_order,verified,source_url) VALUES (${deviceId},${esc(m.kind)},${esc(m.label)},${esc(m.imageUrl)},${i},${m.verified ? 1 : 0},${nullable(m.sourceUrl)});`);
  }
  for (const [category, entries] of Object.entries(item.specs || {})) {
    for (const [i, [key, value]] of Object.entries(entries).entries()) sql.push(`INSERT INTO device_specs (device_id,category,spec_key,spec_value,sort_order) VALUES (${deviceId},${esc(category)},${esc(key)},${esc(value)},${i});`);
  }
}

sql.push("COMMIT;");
fs.writeFileSync(path.resolve(output), sql.join("\n") + "\n");
console.log(`Validated ${data.length} devices / ${seenTac.size} TACs -> ${output}`);
