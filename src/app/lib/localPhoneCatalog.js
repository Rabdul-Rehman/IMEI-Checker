import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "..", "..", "IMEI-Phone-Images", "runs");
const IMAGE_CATALOG = path.join(ROOT, "FINAL-ALL-11192-PHONE-IMAGES.csv");
const DETAILS_CATALOG = path.resolve(
  process.cwd(),
  "..",
  "..",
  "IMEI-DB-Migration",
  "LIVE_BACKUP_20260828_112910",
  "LOCAL_PHONES_FOR_LIVE.csv"
);

let cachedCatalog;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  if (value || row.length) {
    row.push(value.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}

function readObjects(file) {
  const [rawHeader, ...rows] = parseCsv(fs.readFileSync(file, "utf8"));
  const header = rawHeader.map((key) => key.replace(/^\uFEFF/, ""));
  return rows
    .filter((row) => row.length === header.length)
    .map((row) => Object.fromEntries(header.map((key, index) => [key, row[index]])));
}

export function getLocalPhoneCatalog() {
  if (cachedCatalog) return cachedCatalog;

  const specsBySlug = new Map(
    readObjects(DETAILS_CATALOG).map((row) => {
      let specs = {};
      try {
        specs = JSON.parse(row.specs_json || "{}");
      } catch {
        specs = {};
      }
      return [row.slug, specs];
    })
  );

  cachedCatalog = readObjects(IMAGE_CATALOG).map((row) => {
    const specs = specsBySlug.get(row.slug) || {
      General: { brand: row.brand, model_name: row.model_name },
    };
    return {
      phone_id: Number(row.phone_id),
      model_name: row.model_name,
      slug: row.slug,
      specs_json: specs,
      brand_id: null,
      brand: row.brand,
    };
  });

  return cachedCatalog;
}

export function getLocalPhoneBySlug(slug) {
  return getLocalPhoneCatalog().find((phone) => phone.slug === slug) || null;
}

export function queryLocalPhones({ search = "", offset = 0, limit = 100 } = {}) {
  const normalizedSearch = String(search).trim().toLowerCase();
  const phones = normalizedSearch
    ? getLocalPhoneCatalog().filter((phone) =>
        `${phone.model_name} ${phone.slug} ${phone.brand}`
          .toLowerCase()
          .includes(normalizedSearch)
      )
    : getLocalPhoneCatalog();
  const sorted = [...phones].sort((left, right) =>
    left.model_name.localeCompare(right.model_name)
  );
  return {
    total: sorted.length,
    data: sorted.slice(offset, offset + limit),
  };
}