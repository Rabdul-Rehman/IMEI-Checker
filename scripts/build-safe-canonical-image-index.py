#!/usr/bin/env python3
"""Build a SAFE canonical image index.

This does not download or guess images. It collapses regional/storage/TAC
variants only when every existing mapping for a canonical physical model
agrees on the same local image. Ambiguous families are deliberately excluded.

Run:
  python scripts/build-safe-canonical-image-index.py
"""
import csv,re
from pathlib import Path
from collections import defaultdict
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/"src/data/modelPhoneImageIndex.js"
OUT=ROOT/"src/data/canonicalPhoneImageIndex.js"
REPORT=ROOT/"image-coverage-report"
VARIANTS={"pro","max","mini","ultra","plus","lite","fold","flip","fe","se","neo","prime"}
NOISE={"5g","4g","3g","lte","td","uw","dual","sim","global","na","jp","ca","cn","eu","uk","apac","emea","latam","ram"}
PREFIXES={"apple","iphone","google","pixel","xiaomi","mi","redmi","poco","samsung","galaxy","motorola","moto","oneplus","oppo","realme","vivo","iqoo","huawei","honor","nokia","sony","tecno","infinix","itel","lg","htc","zte","asus"}
def norm(v): return re.sub(r"\s+"," ",re.sub(r"[^a-z0-9]+"," ",str(v or "").lower())).strip()
def canonical_model(m):
    p=norm(m).split()
    while p and p[0] in PREFIXES:p.pop(0)
    out=[]
    for t in p:
        if t in NOISE or re.fullmatch(r"a\d{4}",t) or re.fullmatch(r"\d+(?:gb|tb|mb)",t): continue
        out.append(t)
    return " ".join(out)
text=SRC.read_text(encoding="utf-8",errors="replace")
rows=re.findall(r'^\s*"([^"]+\|[^"]+)":\s*"([^"]+)"',text,re.M)
groups=defaultdict(lambda:{"images":set(),"keys":[]})
for key,img in rows:
    brand,model=key.split("|",1); ck=norm(brand)+"|"+canonical_model(model)
    if ck.endswith("|"):continue
    groups[ck]["images"].add(img);groups[ck]["keys"].append(key)
safe={k:next(iter(v["images"])) for k,v in groups.items() if len(v["images"])==1}
amb={k:v for k,v in groups.items() if len(v["images"])>1}
lines=["// AUTO-GENERATED SAFE CANONICAL IMAGE INDEX.","// Only families whose existing mappings unanimously agree are included.","","const CANONICAL_PHONE_IMAGE_INDEX = Object.freeze({"]
for k,v in sorted(safe.items()):lines.append(f'  "{k}": "{v}",')
lines += ['});','','function normalize(value) {','  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\\s+/g, " ").trim();','}','const PREFIXES = new Set('+repr(sorted(PREFIXES)).replace("'",""")+');','const NOISE = new Set('+repr(sorted(NOISE)).replace("'",""")+');','function canonicalModel(value) {','  const parts = normalize(value).split(" ").filter(Boolean);','  while (parts.length && PREFIXES.has(parts[0])) parts.shift();','  return parts.filter((t) => t && !NOISE.has(t) && !/^a\\d{4}$/.test(t) && !/^\\d+(?:gb|tb|mb)$/.test(t)).join(" ");','}','','export function getSafeCanonicalPhoneImage(brand, model) {','  const key = normalize(brand) + "|" + canonicalModel(model);','  return CANONICAL_PHONE_IMAGE_INDEX[key] || "";','}','']
OUT.write_text("\n".join(lines),encoding="utf-8")
REPORT.mkdir(exist_ok=True)
with (REPORT/"ambiguous-canonical-families.csv").open("w",newline="",encoding="utf-8-sig") as f:
    w=csv.writer(f);w.writerow(["canonical_model","image_count","images","identity_rows"])
    for k,v in sorted(amb.items()):w.writerow([k,len(v["images"])," | ".join(sorted(v["images"])),len(v["keys"])])
print("Canonical families:",len(groups));print("Safe unanimous families:",len(safe));print("Ambiguous excluded:",len(amb))
