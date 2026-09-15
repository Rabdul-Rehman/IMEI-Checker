#!/usr/bin/env python3
"""Build production curated media from safe canonical mappings.

Creates one exact physical-model hero per safe canonical family. It never
fabricates color/view photos. Existing hand-curated entries win.
"""
import re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/"src/data/canonicalPhoneImageIndex.js"
OUT=ROOT/"src/data/generatedCanonicalMedia.js"
text=SRC.read_text(encoding="utf-8",errors="replace")
rows=re.findall(r'^\s*"([^"]+\|[^"]+)":\s*"([^"]+)"',text,re.M)
lines=[
"// AUTO-GENERATED from the safe canonical image index.",
"// Hero-only: no fabricated color/view associations.",
"const GENERATED_CANONICAL_MEDIA = Object.freeze({",
]
for k,img in rows:
 lines.append(f'  {k!r}: {{ hero: {img!r}, images: [{{ src: {img!r}, label: "Product image", kind: "hero" }}] }},'.replace("'","\""))
lines += ["});","",
"function normalize(value){return String(value||\"\").toLowerCase().replace(/[^a-z0-9]+/g,\" \").replace(/\\s+/g,\" \").trim();}",
"const NOISE=new Set([\"5g\",\"4g\",\"3g\",\"lte\",\"td\",\"uw\",\"dual\",\"sim\",\"global\",\"na\",\"jp\",\"ca\",\"cn\",\"eu\",\"uk\",\"apac\",\"emea\",\"latam\",\"ram\"]);",
"function canonicalModel(value){return normalize(value).split(\" \").filter(t=>t&&!NOISE.has(t)&&!/^a\\d{4}$/.test(t)&&!/^\\d+(?:gb|tb|mb)$/.test(t)).join(\" \");}",
"export function getGeneratedCanonicalMedia(brand,model){return GENERATED_CANONICAL_MEDIA[normalize(brand)+\"|\"+canonicalModel(model)]||null;}",
"export default getGeneratedCanonicalMedia;",""]
OUT.write_text("\n".join(lines),encoding="utf-8")
print(f"Generated hero media for {len(rows)} safe canonical families")
