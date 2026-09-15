#!/usr/bin/env python3
"""Resolve low-risk canonical image ambiguities without guessing.

Policy:
- group identity rows by canonical physical model
- if one candidate image is used by a plain/base model row, prefer it
- otherwise if one image has a strict majority of identity rows, prefer it
- ties remain unresolved
- emit a review CSV; never modify source mappings
"""
import csv,re
from pathlib import Path
from collections import defaultdict,Counter
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/"src/data/modelPhoneImageIndex.js"; OUT=ROOT/"image-coverage-report"
NOISE={"5g","4g","3g","lte","td","uw","dual","sim","global","na","jp","ca","cn","eu","uk","apac","emea","latam","ram"}
def canon(k):
 b,m=k.split("|",1); p=[t for t in m.split() if t not in NOISE and not re.fullmatch(r"a\d{4}",t) and not re.fullmatch(r"\d+(?:gb|tb|mb)",t)]
 return b+"|"+" ".join(p)
rows=re.findall(r'^\s*"([^"]+\|[^"]+)":\s*"([^"]+)"',SRC.read_text(encoding="utf-8",errors="replace"),re.M)
g=defaultdict(list)
for k,i in rows:g[canon(k)].append((k,i))
resolved={}; unresolved={}
for ck,items in g.items():
 imgs={i for _,i in items}
 if len(imgs)<=1:continue
 base=[i for k,i in items if k==ck]
 if len(set(base))==1 and base:
  resolved[ck]=(base[0],"plain-model-row")
  continue
 counts=Counter(i for _,i in items); ranked=counts.most_common()
 if len(ranked)>1 and ranked[0][1]>ranked[1][1] and ranked[0][1] > len(items)/2:
  resolved[ck]=(ranked[0][0],"strict-majority")
 else: unresolved[ck]=items
OUT.mkdir(exist_ok=True)
with (OUT/"auto-resolved-ambiguities.csv").open("w",newline="",encoding="utf-8-sig") as f:
 w=csv.writer(f);w.writerow(["canonical_model","selected_image","reason"])
 for k,(i,r) in sorted(resolved.items()):w.writerow([k,i,r])
with (OUT/"manual-review-ambiguities.csv").open("w",newline="",encoding="utf-8-sig") as f:
 w=csv.writer(f);w.writerow(["canonical_model","candidate_images","identity_rows"])
 for k,items in sorted(unresolved.items()):w.writerow([k," | ".join(sorted({i for _,i in items})),len(items)])
print("Auto-resolved:",len(resolved));print("Still manual review:",len(unresolved))
