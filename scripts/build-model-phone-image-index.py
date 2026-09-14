#!/usr/bin/env python3
import csv, re, sys
from pathlib import Path

ROOT = Path(r"E:\IMEI-checker\imei.info2")
CAT = ROOT / "image-audit-input" / "images.csv"
MAP = ROOT / "src" / "data" / "phoneImageMap.js"
OUT = ROOT / "src" / "data" / "modelPhoneImageIndex.js"

def norm(v):
    return re.sub(r"\s+"," ",re.sub(r"[^a-z0-9]+"," ",str(v or "").lower())).strip()

ALIASES = {
    "iphone":"apple","mi":"xiaomi","redmi":"xiaomi","poco":"xiaomi",
    "pixel":"google","moto":"motorola","iqoo":"vivo","one plus":"oneplus","real me":"realme"
}
PREFIXES = {
    "apple","google","xiaomi","samsung","motorola","oneplus","oppo","realme",
    "vivo","iqoo","huawei","honor","nokia","sony","tecno","infinix","itel",
    "lg","htc","zte","asus"
}
def nbrand(v):
    n=norm(v)
    return ALIASES.get(n,n)
def nmodel(v):
    p=norm(v).split()
    while p and p[0] in PREFIXES:
        p.pop(0)
    return " ".join(p)

if not CAT.exists():
    raise SystemExit(f"Missing catalog: {CAT}")
if not MAP.exists():
    raise SystemExit(f"Missing map: {MAP}")

map_text=MAP.read_text(encoding="utf-8-sig",errors="replace")
pairs={int(pid):img for pid,img in re.findall(r'^\s*(\d+)\s*:\s*["\']([^"\']+)["\']',map_text,re.M)}

with CAT.open("r",encoding="utf-8-sig",newline="",errors="replace") as f:
    rows=list(csv.DictReader(f))

idx={}
collisions=0
for r in rows:
    try: pid=int(r.get("phone_id") or "")
    except: continue
    image=pairs.get(pid)
    if not image: continue
    b=nbrand(r.get("brand"))
    m=nmodel(r.get("model_name"))
    if not m: continue
    key=f"{b}|{m}"
    old=idx.get(key)
    if old and old!=image:
        collisions+=1
        continue
    idx[key]=image

lines=[
"// AUTO-GENERATED. DO NOT EDIT MANUALLY.",
"// Exact normalized brand+model -> verified local image.",
"",
"const MODEL_PHONE_IMAGE_INDEX = Object.freeze({"
]
for k in sorted(idx):
    kk=k.replace("\\","\\\\").replace('"','\\"')
    vv=idx[k].replace("\\","\\\\").replace('"','\\"')
    lines.append(f'  "{kk}": "{vv}",')
lines += [
"});",
"",
"""function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\\s+/g, " ")
    .trim();
}""",
"",
"""const BRAND_ALIASES = {
  iphone: "apple",
  mi: "xiaomi",
  redmi: "xiaomi",
  poco: "xiaomi",
  pixel: "google",
  moto: "motorola",
  iqoo: "vivo",
  "one plus": "oneplus",
  "real me": "realme",
};""",
"",
"""function normalizeBrand(value) {
  const n = normalize(value);
  return BRAND_ALIASES[n] || n;
}""",
"",
"""function normalizeModel(value) {
  const parts = normalize(value).split(" ").filter(Boolean);
  const removable = new Set([
    "apple","google","xiaomi","samsung","motorola","oneplus","oppo","realme",
    "vivo","iqoo","huawei","honor","nokia","sony","tecno","infinix","itel",
    "lg","htc","zte","asus"
  ]);
  while (parts.length && removable.has(parts[0])) parts.shift();
  return parts.join(" ");
}""",
"",
"""export function getMappedPhoneImageByIdentity(brand, model) {
  const b = normalizeBrand(brand);
  const m = normalizeModel(model);
  if (!m) return "";
  return MODEL_PHONE_IMAGE_INDEX[\`\${b}|\${m}\`] || "";
}""",
]
OUT.write_text("\n".join(lines)+"\n",encoding="utf-8")
print(f"Generated exact identity image mappings: {len(idx)}")
print(f"Ambiguous collisions skipped: {collisions}")
