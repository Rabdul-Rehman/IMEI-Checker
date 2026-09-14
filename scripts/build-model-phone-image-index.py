#!/usr/bin/env python3
import csv, re, sys
from pathlib import Path

ROOT = Path(r"E:export function getMappedPhoneImageByIdentity(brand, model, modelNumber = "") {\n  const b = normalizeBrand(brand);\n  const m = normalizeModel(model);\n  const n = normalize(modelNumber);\n\n  if (!m) return "";\n\n  const exact = MODEL_PHONE_IMAGE_INDEX[b + "|" + m];\n  if (exact) return exact;\n\n  // Random IMEI/TAC results usually return a clean marketing model such as\n  // "iPhone 12 Mini", while our verified catalog keys include region/network/\n  // storage/model-number suffixes. Prefer an exact model-number hit first.\n  const prefix = b + "|" + m;\n  const matches = [];\n\n  for (const [key, image] of Object.entries(MODEL_PHONE_IMAGE_INDEX)) {\n    if (!key.startsWith(prefix)) continue;\n\n    // Prevent sibling devices such as Pixel 7 Pro, iPhone 12 Pro/Pro Max, etc.\n    const remainder = key.slice(prefix.length).trim();\n    if (remainder && /^(pro|max|mini|ultra|plus|lite|fold|flip|fe|se|neo)\b/.test(remainder)) {\n      continue;\n    }\n\n    matches.push([key, image]);\n  }\n\n  if (n) {\n    const byNumber = matches.filter(([key]) =>\n      key.split(" ").includes(n) || key.includes(" " + n + " ")\n    );\n\n    if (byNumber.length) {\n      const counts = new Map();\n      for (const [, image] of byNumber) {\n        counts.set(image, (counts.get(image) || 0) + 1);\n      }\n      return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];\n    }\n  }\n\n  if (!matches.length) return "";\n\n  // If all exact-marketing-model variants use the same verified image, it is\n  // safe to use it regardless of storage/region/network suffixes.\n  const uniqueImages = [...new Set(matches.map(([, image]) => image))];\n  if (uniqueImages.length === 1) return uniqueImages[0];\n\n  // Prefer the least-specific catalog entry (e.g. "Pixel 7 5G") when several\n  // regional/storage variants exist. This gives a correct physical model image\n  // without crossing into sibling Pro/Max/Mini devices.\n  matches.sort((a, b) => a[0].length - b[0].length);\n  return matches[0][1] || "";\n}IMEI-checker\imei.info2")
CAT = ROOT / "image-audit-input" / "images.csv"
MAP = ROOT / "src" / "data" / "phoneImageMap.js"
OUT = ROOT / "src" / "data" / "modelPhoneImageIndex.js"


def norm(v):
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", str(v or "").lower())).strip()


ALIASES = {
    "iphone": "apple",
    "mi": "xiaomi",
    "redmi": "xiaomi",
    "poco": "xiaomi",
    "pixel": "google",
    "moto": "motorola",
    "iqoo": "vivo",
    "one plus": "oneplus",
    "real me": "realme",
}

PREFIXES = {
    "apple", "google", "xiaomi", "samsung", "motorola", "oneplus", "oppo", "realme",
    "vivo", "iqoo", "huawei", "honor", "nokia", "sony", "tecno", "infinix", "itel",
    "lg", "htc", "zte", "asus",
}


def nbrand(v):
    n = norm(v)
    return ALIASES.get(n, n)


def nmodel(v):
    p = norm(v).split()
    while p and p[0] in PREFIXES:
        p.pop(0)
    return " ".join(p)


if not CAT.exists():
    raise SystemExit(f"Missing catalog: {CAT}")
if not MAP.exists():
    raise SystemExit(f"Missing map: {MAP}")

map_text = MAP.read_text(encoding="utf-8-sig", errors="replace")
pairs = {
    int(pid): img
    for pid, img in re.findall(r'^\s*(\d+)\s*:\s*["\']([^"\']+)["\']', map_text, re.M)
}

with CAT.open("r", encoding="utf-8-sig", newline="", errors="replace") as f:
    rows = list(csv.DictReader(f))

idx = {}
collisions = 0
for r in rows:
    try:
        pid = int(r.get("phone_id") or "")
    except Exception:
        continue

    image = pairs.get(pid)
    if not image:
        continue

    b = nbrand(r.get("brand"))
    m = nmodel(r.get("model_name"))
    if not m:
        continue

    key = f"{b}|{m}"
    old = idx.get(key)
    if old and old != image:
        collisions += 1
        continue

    idx[key] = image

lines = [
    "// AUTO-GENERATED. DO NOT EDIT MANUALLY.",
    "// Exact normalized brand+model -> verified local image.",
    "",
    "const MODEL_PHONE_IMAGE_INDEX = Object.freeze({",
]

for k in sorted(idx):
    kk = k.replace("\\", "\\\\").replace('"', '\\"')
    vv = idx[k].replace("\\", "\\\\").replace('"', '\\"')
    lines.append(f'  "{kk}": "{vv}",')

lines += [
    "});",
    "",
    "function normalize(value) {",
    "  return String(value || \"\")",
    "    .toLowerCase()",
    "    .replace(/[^a-z0-9]+/g, \" \")",
    "    .replace(/\\s+/g, \" \")",
    "    .trim();",
    "}",
    "",
    "const BRAND_ALIASES = {",
    "  iphone: \"apple\",",
    "  mi: \"xiaomi\",",
    "  redmi: \"xiaomi\",",
    "  poco: \"xiaomi\",",
    "  pixel: \"google\",",
    "  moto: \"motorola\",",
    "  iqoo: \"vivo\",",
    "  \"one plus\": \"oneplus\",",
    "  \"real me\": \"realme\",",
    "};",
    "",
    "function normalizeBrand(value) {",
    "  const n = normalize(value);",
    "  return BRAND_ALIASES[n] || n;",
    "}",
    "",
    "function normalizeModel(value) {",
    "  const parts = normalize(value).split(\" \").filter(Boolean);",
    "  const removable = new Set([",
    "    \"apple\",\"google\",\"xiaomi\",\"samsung\",\"motorola\",\"oneplus\",\"oppo\",\"realme\",",
    "    \"vivo\",\"iqoo\",\"huawei\",\"honor\",\"nokia\",\"sony\",\"tecno\",\"infinix\",\"itel\",",
    "    \"lg\",\"htc\",\"zte\",\"asus\"",
    "  ]);",
    "  while (parts.length && removable.has(parts[0])) parts.shift();",
    "  return parts.join(\" \");",
    "}",
    "",
    "const NOISE = new Set([\"5g\",\"4g\",\"lte\",\"td\",\"dual\",\"sim\",\"global\",\"us\",\"na\",\"jp\",\"ca\",\"cn\",\"emea\",\"latam\",\"gb\",\"ram\"]);",
    "const VARIANTS = new Set([\"pro\",\"max\",\"mini\",\"ultra\",\"plus\",\"lite\",\"fold\",\"flip\",\"fe\",\"se\",\"neo\"]);",
    "",
    "function coreTokens(model) {",
    "  return normalizeModel(model).split(\" \").filter((t) => t && !NOISE.has(t) && !/^a\\d{4}$/.test(t) && !/^\\d+gb$/.test(t));",
    "}",
    "",
    "export function getMappedPhoneImageByIdentity(brand, model) {",
    "  const b = normalizeBrand(brand);",
    "  const m = normalizeModel(model);",
    "  if (!m) return \"\";",
    "  const exact = MODEL_PHONE_IMAGE_INDEX[b + \"|\" + m];",
    "  if (exact) return exact;",
    "  const wanted = coreTokens(m);",
    "  const wantedVariants = wanted.filter((t) => VARIANTS.has(t)).join(\"|\");",
    "  const wantedNums = wanted.filter((t) => /\\d/.test(t) && !/^\\d+gb$/.test(t)).join(\"|\");",
    "  const hits = [];",
    "  for (const [key, image] of Object.entries(MODEL_PHONE_IMAGE_INDEX)) {",
    "    const split = key.indexOf(\"|\");",
    "    if (split < 0 || key.slice(0, split) !== b) continue;",
    "    const candidate = coreTokens(key.slice(split + 1));",
    "    const cv = candidate.filter((t) => VARIANTS.has(t)).join(\"|\");",
    "    const cn = candidate.filter((t) => /\\d/.test(t) && !/^\\d+gb$/.test(t)).join(\"|\");",
    "    if (cv !== wantedVariants || cn !== wantedNums) continue;",
    "    if (!wanted.every((t) => candidate.includes(t))) continue;",
    "    hits.push(image);",
    "  }",
    "  const unique = [...new Set(hits)];",
    "  return unique.length === 1 ? unique[0] : \"\";",
    "}",
]

OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"Generated exact identity image mappings: {len(idx)}")
print(f"Ambiguous collisions skipped: {collisions}")
