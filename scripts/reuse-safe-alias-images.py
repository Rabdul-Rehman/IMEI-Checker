#!/usr/bin/env python3
import csv, re, shutil, sys
from collections import defaultdict, Counter
from pathlib import Path

ROOT = Path(r"E:\IMEI-checker\imei.info2")
MAP = ROOT / "src" / "data" / "phoneImageMap.js"

BRAND_ALIASES = {
    "oppo mobile":"oppo","tecno mobile":"tecno","samaung":"samsung",
    "vivo iqoo":"vivo","iqoo vivo":"vivo","vivo / iqoo":"vivo","iqoo / vivo":"vivo",
    "real me":"realme","bbk":"vivo"
}
VARIANTS = {"pro","max","mini","ultra","plus","lite","fold","flip","fe","se","neo","prime","power","play"}
REGION = {
    "global","international","apac","emea","latam","china","india","japan","jp","us","usa","eu","europe",
    "canada","korea","kr","in","cn","na"
}
NOISE = {
    "dual","single","sim","td","lte","5g","4g","3g","uw","ca","premium","standard","edition",
    "version","global","international","phone","smartphone","mobile"
}

def norm(s):
    return re.sub(r"[^a-z0-9]+"," ",str(s or "").lower()).strip()

def brand(s):
    x=norm(s)
    return BRAND_ALIASES.get(x,x)

def tokens(s):
    return [x for x in norm(s).split() if x]

def is_year(t):
    return bool(re.fullmatch(r"20(?:1[0-9]|2[0-9])",t))

def is_storage(t):
    return bool(re.fullmatch(r"\d+(?:gb|tb|mb|g|t)",t))

def core_signature(model):
    raw=tokens(model)
    out=[]
    variants=[]
    numeric=[]
    for t in raw:
        if t in REGION or t in NOISE or is_year(t) or is_storage(t):
            continue
        if t in VARIANTS:
            variants.append(t)
            out.append(t)
            continue
        out.append(t)
        if any(c.isdigit() for c in t):
            numeric.append(t)
    return tuple(out), tuple(sorted(set(variants))), tuple(sorted(set(numeric)))

def safe_family_match(a,b):
    ac,av,an=core_signature(a)
    bc,bv,bn=core_signature(b)
    if not ac or not bc:
        return False
    if av != bv:
        return False
    if an != bn:
        return False
    return ac == bc

def read_csv(path):
    with path.open("r",encoding="utf-8-sig",newline="",errors="replace") as f:
        return list(csv.DictReader(f))

def find_latest(pattern):
    items=sorted(ROOT.glob(pattern),key=lambda p:p.stat().st_mtime,reverse=True)
    return items[0] if items else None

def target_ids_from_unresolved():
    latest=find_latest("exact-reuse-report-*")
    if latest and (latest/"UNRESOLVED.csv").exists():
        rows=read_csv(latest/"UNRESOLVED.csv")
        ids={str(r.get("phone_id","")).strip() for r in rows if str(r.get("phone_id","")).strip()}
        if ids:
            return ids, latest
    return set(), latest

def main():
    if len(sys.argv)<4:
        raise SystemExit("Usage: script AUDIT_DIR BACKUP_DIR REPORT_DIR")
    audit=Path(sys.argv[1]); backup=Path(sys.argv[2]); report=Path(sys.argv[3])
    backup.mkdir(parents=True,exist_ok=True); report.mkdir(parents=True,exist_ok=True)

    audit_csv=audit/"ALL-MAPPINGS-AUDIT.csv"
    if not audit_csv.exists():
        raise SystemExit(f"Missing {audit_csv}")

    rows=read_csv(audit_csv)
    unresolved_ids, prev_report = target_ids_from_unresolved()
    if unresolved_ids:
        suspects=[r for r in rows if str(r.get("phone_id","")).strip() in unresolved_ids]
    else:
        suspects=[r for r in rows if str(r.get("severity","")).upper() in {"CRITICAL","HIGH","REVIEW"}]

    low=[r for r in rows if str(r.get("severity","")).upper()=="LOW" and r.get("image")]

    by_brand=defaultdict(list)
    for r in low:
        by_brand[brand(r.get("brand",""))].append(r)

    shutil.copy2(MAP,backup/"phoneImageMap.js")
    text=MAP.read_text(encoding="utf-8-sig",errors="replace")

    accepted=[]
    unresolved=[]
    changed=0

    for r in suspects:
        b=brand(r.get("brand",""))
        m=r.get("model","")
        candidates=[]
        for x in by_brand.get(b,[]):
            if x.get("image")==r.get("image"):
                continue
            if safe_family_match(m,x.get("model","")):
                candidates.append(x)

        if not candidates:
            unresolved.append({
                "phone_id":r.get("phone_id",""),
                "brand":r.get("brand",""),
                "model":m,
                "old_image":r.get("image",""),
                "reason":"NO_SAFE_ALIAS_MATCH"
            })
            continue

        counts=Counter(x["image"] for x in candidates)
        ranked=counts.most_common()

        if len(ranked)>1 and ranked[0][1]==ranked[1][1]:
            unresolved.append({
                "phone_id":r.get("phone_id",""),
                "brand":r.get("brand",""),
                "model":m,
                "old_image":r.get("image",""),
                "reason":"AMBIGUOUS_ALIAS_IMAGES"
            })
            continue

        new_image,support=ranked[0]
        # Require either two agreeing LOW-risk records, or a single exact-core record.
        exemplar=next(x for x in candidates if x["image"]==new_image)
        exact_core = core_signature(m)[0] == core_signature(exemplar.get("model",""))[0]
        if support < 2 and not exact_core:
            unresolved.append({
                "phone_id":r.get("phone_id",""),
                "brand":r.get("brand",""),
                "model":m,
                "old_image":r.get("image",""),
                "reason":"INSUFFICIENT_SUPPORT"
            })
            continue

        pid=str(r.get("phone_id","")).strip()
        pat=re.compile(rf'(^\s*{re.escape(pid)}\s*:\s*)["\'][^"\']+["\']',re.M)
        text,n=pat.subn(lambda mm:mm.group(1)+f'"{new_image}"',text,count=1)
        if n:
            changed+=1
            accepted.append({
                "phone_id":pid,
                "brand":r.get("brand",""),
                "model":m,
                "old_image":r.get("image",""),
                "new_image":new_image,
                "support":support,
                "matched_model":exemplar.get("model","")
            })
        else:
            unresolved.append({
                "phone_id":pid,
                "brand":r.get("brand",""),
                "model":m,
                "old_image":r.get("image",""),
                "reason":"MAP_ENTRY_NOT_FOUND"
            })

    MAP.write_text(text,encoding="utf-8")

    def write(path,rows):
        if not rows:
            path.write_text("",encoding="utf-8"); return
        with path.open("w",encoding="utf-8-sig",newline="") as f:
            w=csv.DictWriter(f,fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)

    write(report/"ACCEPTED.csv",accepted)
    write(report/"UNRESOLVED.csv",unresolved)

    summary=[
        "="*78,
        "STRICT ALIAS/FAMILY IMAGE REUSE SUMMARY",
        "="*78,
        f"Audit mappings                  : {len(rows)}",
        f"Starting unresolved mappings    : {len(suspects)}",
        f"Mappings corrected              : {changed}",
        f"Still unresolved                : {len(unresolved)}",
        "",
        "SAFETY:",
        "Only existing LOW-risk images were reused.",
        "Brand must match after conservative alias normalization.",
        "Model core + numeric tokens + Pro/Max/Ultra/etc variant tokens must match exactly.",
        "No internet images were downloaded.",
        "No image files or frontend layout files were changed.",
        "Ambiguous candidates were skipped."
    ]
    (report/"SUMMARY.txt").write_text("\n".join(summary),encoding="utf-8")
    print("\n".join(summary))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
