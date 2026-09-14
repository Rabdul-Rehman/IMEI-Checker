#!/usr/bin/env python3
import csv, re, shutil, sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(r"E:\IMEI-checker\imei.info2")
MAP = ROOT / "src" / "data" / "phoneImageMap.js"

ALIASES = {
    "oppo mobile":"oppo","tecno mobile":"tecno","samaung":"samsung",
    "vivo iqoo":"vivo","iqoo vivo":"vivo","vivo / iqoo":"vivo","iqoo / vivo":"vivo",
    "real me":"realme"
}
NETWORK = re.compile(r"\s+(?:5G|4G|3G|LTE|TD-LTE|UW|Dual SIM|Single SIM|Global|JP|US|CN|EU|APAC|EMEA|LATAM)\b.*$", re.I)

def norm(s):
    return re.sub(r"[^a-z0-9]+"," ",str(s or "").lower()).strip()

def brand(s):
    x=norm(s)
    return ALIASES.get(x,x)

def model(s,b=""):
    x=str(s or "").strip()
    nb=norm(b)
    nx=norm(x)
    if nb and nx.startswith(nb+" "):
        parts=x.split()
        bp=str(b).split()
        x=" ".join(parts[len(bp):])
    x=NETWORK.sub("",x)
    return norm(x)

def target(row):
    sev=str(row.get("severity","")).upper()
    reasons=str(row.get("reasons",""))
    image=str(row.get("image",""))
    mdl=norm(row.get("model",""))
    if sev in {"CRITICAL","HIGH"}: return True
    if any(x in reasons for x in [
        "ONE_IMAGE_USED_FOR_DIFFERENT_MODELS",
        "MODEL_METADATA_CONFLICT",
        "VERY_SMALL_IMAGE_FILE",
        "IDENTICAL_IMAGE_BINARY_ACROSS_BRANDS",
    ]): return True
    if image.endswith("/group-1229.webp") or "iphone 12 pro max" in mdl: return True
    return False

def read_csv(path):
    with path.open("r",encoding="utf-8-sig",newline="",errors="replace") as f:
        return list(csv.DictReader(f))

def main():
    if len(sys.argv)<4:
        raise SystemExit("Usage: script AUDIT_DIR BACKUP_DIR REPORT_DIR")
    audit=Path(sys.argv[1]); backup=Path(sys.argv[2]); report=Path(sys.argv[3])
    backup.mkdir(parents=True,exist_ok=True); report.mkdir(parents=True,exist_ok=True)
    rows=read_csv(audit/"ALL-MAPPINGS-AUDIT.csv")

    low=[r for r in rows if str(r.get("severity","")).upper()=="LOW"]
    suspects=[r for r in rows if target(r)]

    exact=defaultdict(list)
    for r in low:
        k=(brand(r.get("brand","")), model(r.get("model",""),r.get("brand","")))
        if k[0] and k[1]:
            exact[k].append(r)

    shutil.copy2(MAP,backup/"phoneImageMap.js")
    text=MAP.read_text(encoding="utf-8-sig",errors="replace")

    accepted=[]; unresolved=[]; changed=0
    for r in suspects:
        k=(brand(r.get("brand","")), model(r.get("model",""),r.get("brand","")))
        candidates=[x for x in exact.get(k,[]) if x.get("image") and x.get("image")!=r.get("image")]
        # require consensus on image path among LOW-risk records, or a single unique LOW-risk record
        paths={}
        for x in candidates:
            paths[x["image"]]=paths.get(x["image"],0)+1
        if not paths:
            unresolved.append({"phone_id":r.get("phone_id",""),"brand":r.get("brand",""),"model":r.get("model",""),"old_image":r.get("image",""),"reason":"NO_EXACT_LOW_RISK_MATCH"})
            continue
        ranked=sorted(paths.items(),key=lambda kv:(-kv[1],kv[0]))
        new_image,count=ranked[0]
        if len(ranked)>1 and ranked[0][1]==ranked[1][1]:
            unresolved.append({"phone_id":r.get("phone_id",""),"brand":r.get("brand",""),"model":r.get("model",""),"old_image":r.get("image",""),"reason":"AMBIGUOUS_LOW_RISK_IMAGES"})
            continue
        pid=str(r.get("phone_id","")).strip()
        pat=re.compile(rf'(^\s*{re.escape(pid)}\s*:\s*)["\'][^"\']+["\']',re.M)
        text,n=pat.subn(lambda m:m.group(1)+f'"{new_image}"',text,count=1)
        if n:
            changed+=1
            accepted.append({"phone_id":pid,"brand":r.get("brand",""),"model":r.get("model",""),"old_image":r.get("image",""),"new_image":new_image,"low_risk_support":count})

    MAP.write_text(text,encoding="utf-8")

    def write(path,rows):
        if not rows:
            path.write_text("",encoding="utf-8"); return
        with path.open("w",encoding="utf-8-sig",newline="") as f:
            w=csv.DictWriter(f,fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)

    write(report/"ACCEPTED.csv",accepted); write(report/"UNRESOLVED.csv",unresolved)
    summary=[
        "="*78,
        "EXACT LOW-RISK IMAGE REUSE SUMMARY",
        "="*78,
        f"Audit mappings                  : {len(rows)}",
        f"Strong target mappings          : {len(suspects)}",
        f"Mappings corrected              : {changed}",
        f"Still unresolved                : {len(unresolved)}",
        "",
        "SAFETY:",
        "Only exact same normalized brand + model LOW-risk records were reused.",
        "No internet images were downloaded.",
        "No existing image files were overwritten.",
        "Ambiguous exact-model image sets were skipped."
    ]
    (report/"SUMMARY.txt").write_text("\n".join(summary),encoding="utf-8")
    print("\n".join(summary))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
