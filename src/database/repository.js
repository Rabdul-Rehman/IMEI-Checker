// Database repository contract.
// Works with a prepared-statement compatible SQLite/D1 adapter.
// The existing result page is intentionally untouched.

export async function lookupDeviceByTac(db, tac) {
  const normalizedTac = String(tac ?? "").trim();
  if (!/^\d{8}$/.test(normalizedTac)) return null;

  const device = await db.prepare(`
    SELECT
      d.*,
      t.tac,
      t.confidence AS tac_confidence,
      t.allocation_source
    FROM tac_allocations t
    JOIN devices d ON d.id = t.device_id
    WHERE t.tac = ?
    LIMIT 1
  `).bind(normalizedTac).first();

  if (!device) return null;

  const [storageResult, colorResult, mediaResult, specResult] = await Promise.all([
    db.prepare(`SELECT value FROM device_storage_options WHERE device_id = ? ORDER BY sort_order, id`).bind(device.id).all(),
    db.prepare(`SELECT name, image_url, hex_value, verified, source_url FROM device_colors WHERE device_id = ? ORDER BY sort_order, id`).bind(device.id).all(),
    db.prepare(`SELECT kind, label, image_url, verified, source_url FROM device_media WHERE device_id = ? ORDER BY sort_order, id`).bind(device.id).all(),
    db.prepare(`SELECT category, spec_key, spec_value FROM device_specs WHERE device_id = ? ORDER BY category, sort_order, id`).bind(device.id).all(),
  ]);

  const specs = {};
  for (const row of specResult.results || []) {
    if (!specs[row.category]) specs[row.category] = {};
    specs[row.category][row.spec_key] = row.spec_value;
  }

  return {
    ...device,
    storageOptions: (storageResult.results || []).map((row) => row.value),
    colors: colorResult.results || [],
    media: mediaResult.results || [],
    specs,
  };
}

export async function lookupDeviceByImei(db, imei, parseImei) {
  const parsed = parseImei(imei);
  if (!parsed.formatValid || !parsed.checksumValid) {
    return { found: false, reason: "invalid-imei", imei: parsed };
  }

  const device = await lookupDeviceByTac(db, parsed.tac);
  if (!device) return { found: false, reason: "unknown-tac", imei: parsed };

  return { found: true, imei: parsed, device };
}
