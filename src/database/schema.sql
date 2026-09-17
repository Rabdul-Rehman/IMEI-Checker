-- IMEI Checker database schema
-- Database layer only. No UI/result-page changes.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  marketing_name TEXT,
  model_number TEXT,
  release_year INTEGER,
  device_type TEXT DEFAULT 'smartphone',
  display_size TEXT,
  display_type TEXT,
  processor TEXT,
  ram TEXT,
  battery TEXT,
  main_camera TEXT,
  os TEXT,
  dimensions TEXT,
  weight TEXT,
  sim TEXT,
  network TEXT,
  source TEXT,
  source_url TEXT,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(brand, model, model_number)
);

CREATE INDEX IF NOT EXISTS idx_devices_brand_model ON devices(brand, model);

CREATE TABLE IF NOT EXISTS tac_allocations (
  tac TEXT PRIMARY KEY CHECK(length(tac) = 8 AND tac NOT GLOB '*[^0-9]*'),
  device_id INTEGER NOT NULL,
  allocation_source TEXT,
  confidence TEXT NOT NULL DEFAULT 'verified',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(device_id) REFERENCES devices(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tac_device ON tac_allocations(device_id);

CREATE TABLE IF NOT EXISTS device_storage_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER NOT NULL,
  value TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(device_id, value),
  FOREIGN KEY(device_id) REFERENCES devices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS device_colors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  hex_value TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  verified INTEGER NOT NULL DEFAULT 0 CHECK(verified IN (0,1)),
  source_url TEXT,
  UNIQUE(device_id, name),
  FOREIGN KEY(device_id) REFERENCES devices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS device_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  label TEXT NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  verified INTEGER NOT NULL DEFAULT 0 CHECK(verified IN (0,1)),
  source_url TEXT,
  UNIQUE(device_id, label, image_url),
  FOREIGN KEY(device_id) REFERENCES devices(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_media_device ON device_media(device_id);

CREATE TABLE IF NOT EXISTS device_specs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  spec_key TEXT NOT NULL,
  spec_value TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(device_id, category, spec_key),
  FOREIGN KEY(device_id) REFERENCES devices(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_specs_device_category ON device_specs(device_id, category);
