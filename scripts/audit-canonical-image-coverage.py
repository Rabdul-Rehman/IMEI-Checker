#!/usr/bin/env python3
"""Audit canonical device-image coverage from generated repository data.
Run from repository root: python scripts/audit-canonical-image-coverage.py
"""
import re, csv
from pathlib import Path
from collections import defaultdict
ROOT=Path(__file__).resolve().parents[1]
INDEX=ROOT/"src/data/modelPhoneImageIndex.js"
OUT=ROOT/"image-coverage-report"
NOISE=re.compile(r"\b(?:5g|4g|3g|lte|td|uw|dual|sim|global|na|jp|ca|cn|eu|uk|apac|emea|latam)\b",re.I)
MODELNO=re.compile(r"\ba\d{4}\b",re.I)
CAP=re.compile(r"\b\d+(?:\.\d+)?\s*(?:gb|tb|mb)\b",re.I)
def canonical(k):
    b,m=k.split("|",1)
    m=NOISE.sub(" ",m);m=MODELNO.sub(" ",m);m=CAP.sub(" ",m)
    m=re.sub(r"\s+"," ",m).strip()
    return f"{b}|{m}"
text=INDEX.read_text(encoding="utf-8",errors="replace")
rows=re.findall(r'^\s*"([^"]+\|[^"]+)":\s*"([^"]+)"',text,re.M)
families=defaultdict(lambda:{"keys":[],"images":set()})
image_families=defaultdict(set)
for k,img in rows:
    c=canonical(k); families[c]["keys"].append(k); families[c]["images"].add(img); image_families[img].add(c)
shared={i:fs for i,fs in image_families.items() if len(fs)>1}
OUT.mkdir(exist_ok=True)
with (OUT/"canonical-models.csv").open("w",newline="",encoding="utf-8-sig") as f:
    w=csv.writer(f);w.writerow(["canonical_model","identity_rows","unique_images","images"])
    for k,v in sorted(families.items()):w.writerow([k,len(v["keys"]),len(v["images"])," | ".join(sorted(v["images"]))])
with (OUT/"shared-image-risks.csv").open("w",newline="",encoding="utf-8-sig") as f:
    w=csv.writer(f);w.writerow(["image","canonical_family_count","canonical_families"])
    for i,fs in sorted(shared.items(),key=lambda x:-len(x[1])):w.writerow([i,len(fs)," | ".join(sorted(fs))])
summary=[
f"Exact identity mappings: {len(rows)}",
f"Approx canonical model families: {len(families)}",
f"Unique referenced image assets: {len(image_families)}",
f"Image assets shared across multiple canonical families: {len(shared)}",
"",
"NOTE: This audits the generated image index currently committed to the repo.",
"Having a mapping does not prove the photograph is correct; shared-image risks need verification.",
]
(OUT/"SUMMARY.txt").write_text("\n".join(summary)+"\n",encoding="utf-8")
print("\n".join(summary))
