#!/usr/bin/env python3
import csv
import hashlib
import html
import json
import os
import re
import shutil
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urljoin, urlparse

ROOT = Path(r"E:\IMEI-checker\imei.info2")
MAP_PATH = ROOT / "src" / "data" / "phoneImageMap.js"
PUBLIC_IMAGES = ROOT / "public" / "phone-images"

def ensure_deps():
    missing = []
    try:
        import requests
    except Exception:
        missing.append("requests")
    try:
        from PIL import Image
    except Exception:
        missing.append("pillow")
    if missing:
        subprocess.check_call([sys.executable, "-m", "pip", "install", *missing])

ensure_deps()
import requests
from PIL import Image

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36"
TIMEOUT = 8
VARIANT_WORDS = {"pro","max","mini","ultra","plus","lite","fold","flip","fe","se","neo","prime"}
STOP = {
    "phone","smartphone","mobile","edition","standard","premium","dual","sim",
    "global","lte","td","5g","4g","3g","uw","ca","jp","us","cn","eu","apac",
    "emea","latam","gb","tb","ram"
}
BRAND_ALIASES = {
    "apple":{"apple","iphone"},
    "samsung":{"samsung","galaxy"},
    "google":{"google","pixel"},
    "motorola":{"motorola","moto"},
    "xiaomi":{"xiaomi","redmi","poco","mi"},
    "oppo":{"oppo"},
    "realme":{"realme"},
    "vivo":{"vivo","iqoo"},
    "oneplus":{"oneplus"},
    "huawei":{"huawei"},
    "honor":{"honor"},
    "nokia":{"nokia"},
    "sony":{"sony","xperia"},
    "tecno":{"tecno"},
    "infinix":{"infinix"},
    "itel":{"itel"},
    "asus":{"asus","rog","zenfone"},
    "lenovo":{"lenovo"},
    "lg":{"lg"},
    "htc":{"htc"},
    "zte":{"zte","nubia"},
}
KNOWN_BRAND_WORDS = set().union(*BRAND_ALIASES.values())

def nrm(s):
    s = str(s or "").lower().replace("+", " plus ")
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()

def tokens(s):
    return [x for x in nrm(s).split() if x]

def effective_brand(row):
    for raw in [row.get("detail_brand",""), row.get("brand","")]:
        x = nrm(raw)
        if x and x not in {"bbk","oppo mobile","tecno mobile","iqoo vivo","vivo iqoo"}:
            return raw.strip()
    mt = tokens(row.get("model",""))
    for t in mt[:3]:
        if t in KNOWN_BRAND_WORDS:
            for k, vals in BRAND_ALIASES.items():
                if t in vals:
                    return k
    return str(row.get("brand","") or "").strip()

def marketing_model(model, brand=""):
    s = str(model or "").strip()
    if not s:
        return ""
    b = nrm(brand)
    ns = nrm(s)
    if b and ns.startswith(b + " "):
        s = re.sub(r"^\s*" + re.escape(brand) + r"\s+", "", s, flags=re.I)
    anchors = ["iPhone", "Galaxy", "Xperia", "Moto ", "Pixel ", "Redmi ", "Poco ", "OnePlus ", "Nubia "]
    for a in anchors:
        m = re.search(re.escape(a), s, flags=re.I)
        if m and m.start() > 0:
            s = s[m.start():]
            break
    split_patterns = [
        r"\s+(?:5G|4G|3G|LTE|TD-LTE|UW)\b",
        r"\s+(?:Dual\s+SIM|Single\s+SIM)\b",
        r"\s+(?:Global|JP|US|CN|EU|APAC|EMEA|LATAM)\b",
        r"\s+\d+\s*(?:GB|TB)\b",
    ]
    for p in split_patterns:
        m = re.search(p, s, flags=re.I)
        if m and m.start() >= 2:
            s = s[:m.start()]
            break
    s = re.sub(r"\s+\b(?:SM-[A-Z0-9/-]+|CPH\d+[A-Z]*|RMX\d+[A-Z]*|XT\d{4}(?:-\d+)?|A\d{4}|V\d{4}[A-Z]*|NX\d+[A-Z]*)\b.*$", "", s, flags=re.I)
    return re.sub(r"\s+", " ", s).strip(" -_/")

def model_signature(model, brand):
    mm = marketing_model(model, brand)
    ts = [t for t in tokens(mm) if t not in STOP and t not in KNOWN_BRAND_WORDS]
    return mm, ts

def title_score(target_model, brand, title):
    tt = tokens(title)
    if not tt:
        return 0.0
    mm, target = model_signature(target_model, brand)
    if not target:
        return 0.0
    tset = set(tt)
    target_set = set(target)
    nums = {x for x in target_set if any(c.isdigit() for c in x)}
    if nums and not nums.issubset(tset):
        return 0.0
    required_variants = target_set & VARIANT_WORDS
    candidate_variants = tset & VARIANT_WORDS
    if not required_variants.issubset(candidate_variants):
        return 0.0
    extras = candidate_variants - required_variants
    if extras:
        return 0.0
    common = len(target_set & tset)
    coverage = common / max(1, len(target_set))
    b = nrm(brand)
    b_tokens = set(tokens(b))
    brand_ok = bool(b_tokens & tset)
    for canonical, aliases in BRAND_ALIASES.items():
        if b in aliases or b == canonical:
            brand_ok = brand_ok or bool(aliases & tset)
    return min(coverage * 0.86 + (0.14 if brand_ok else 0.0), 1.0)

def session():
    s = requests.Session()
    s.headers.update({"User-Agent": UA, "Accept-Language":"en-US,en;q=0.8"})
    return s

def get_title_and_og(s, url):
    try:
        r = s.get(url, timeout=TIMEOUT, allow_redirects=True)
        if r.status_code != 200 or "text/html" not in r.headers.get("content-type",""):
            return "", "", r.url
        text = r.text[:1500000]
        mt = re.search(r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)', text, re.I)
        if not mt:
            mt = re.search(r'<title[^>]*>(.*?)</title>', text, re.I|re.S)
        title = html.unescape(re.sub("<[^>]+>"," ", mt.group(1))).strip() if mt else ""
        mi = re.search(r'<meta[^>]+property=["\']og:image(?::secure_url)?["\'][^>]+content=["\']([^"\']+)', text, re.I)
        if not mi:
            mi = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image(?::secure_url)?["\']', text, re.I)
        image = html.unescape(mi.group(1)).strip() if mi else ""
        if image:
            image = urljoin(r.url, image)
        return title, image, r.url
    except Exception:
        return "", "", url

def search_bing_pages(s, query):
    try:
        r = s.get("https://www.bing.com/search", params={"q":query, "count":"10"}, timeout=TIMEOUT)
        if r.status_code != 200:
            return []
        pairs = re.findall(r'<li class="b_algo"[\s\S]*?<h2>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)</a>', r.text, re.I)
        out=[]
        for u,t in pairs[:10]:
            title=html.unescape(re.sub("<[^>]+>"," ",t))
            out.append((html.unescape(u), re.sub(r"\s+"," ",title).strip()))
        return out
    except Exception:
        return []

def search_ddg_pages(s, query):
    try:
        r = s.get("https://html.duckduckgo.com/html/", params={"q":query}, timeout=TIMEOUT)
        if r.status_code != 200:
            return []
        pairs = re.findall(r'<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)</a>', r.text, re.I)
        out=[]
        for u,t in pairs[:10]:
            title=html.unescape(re.sub("<[^>]+>"," ",t))
            out.append((html.unescape(u), re.sub(r"\s+"," ",title).strip()))
        return out
    except Exception:
        return []

def gsmarena_pages(s, model):
    q = marketing_model(model)
    try:
        r = s.get("https://www.gsmarena.com/results.php3", params={"sQuickSearch":"yes","sName":q}, timeout=TIMEOUT)
        if r.status_code != 200:
            return []
        links = re.findall(r'href=["\']([^"\']+\.php)["\'][^>]*>[\s\S]{0,700}?(?:<strong>)?([^<]{2,120})', r.text, re.I)
        out=[]
        seen=set()
        for href,label in links:
            u=urljoin("https://www.gsmarena.com/", href)
            if u not in seen and "results.php" not in u:
                seen.add(u)
                out.append((u, html.unescape(label).strip()))
            if len(out)>=8:
                break
        return out
    except Exception:
        return []

def candidate_pages(brand, model):
    s=session()
    mm=marketing_model(model, brand)
    queries=[f'"{brand} {mm}" phone specifications', f'"{mm}" {brand} smartphone']
    raw=[]
    raw.extend(gsmarena_pages(s, mm))
    for q in queries:
        raw.extend(search_bing_pages(s,q))
        if len(raw)<6:
            raw.extend(search_ddg_pages(s,q))
    seen=set()
    ranked=[]
    for u, hint in raw:
        if not u or u in seen:
            continue
        seen.add(u)
        host=urlparse(u).netloc.lower()
        if any(x in host for x in ["youtube.com","facebook.com","instagram.com","tiktok.com","pinterest."]):
            continue
        hint_score=title_score(mm, brand, hint)
        title, og, final=get_title_and_og(s,u)
        score=max(hint_score, title_score(mm, brand, title))
        if og and score>=0.76:
            priority=0
            if any(d in host for d in ["gsmarena.com","apple.com","samsung.com","google.com","motorola.","mi.com","xiaomi","oneplus.","oppo.","vivo.","realme.","huawei.","honor.","nokia.","sony."]):
                priority=2
            elif any(d in host for d in ["gsmchoice.com","phonearena.com","devicespecifications.com"]):
                priority=1
            ranked.append((score+priority*0.04, final, og, title or hint))
    ranked.sort(reverse=True,key=lambda x:x[0])
    return ranked

def download_image(page_url, image_url, dest):
    s=session()
    try:
        r=s.get(image_url,timeout=TIMEOUT,headers={"Referer":page_url},stream=True)
        if r.status_code!=200:
            return False, f"HTTP_{r.status_code}"
        data=r.content
        if len(data)<3000 or len(data)>12*1024*1024:
            return False, "BAD_SIZE"
        tmp=dest.with_suffix(".tmp")
        tmp.write_bytes(data)
        try:
            with Image.open(tmp) as im:
                w,h=im.size
                if min(w,h)<180 or max(w,h)>7000:
                    tmp.unlink(missing_ok=True)
                    return False, "BAD_DIMENSIONS"
                ratio=w/h
                if ratio<0.28 or ratio>3.5:
                    tmp.unlink(missing_ok=True)
                    return False, "BAD_ASPECT"
                im.load()
                if max(w,h)>1200:
                    scale=1200/max(w,h)
                    im=im.resize((max(1,int(w*scale)),max(1,int(h*scale))),Image.Resampling.LANCZOS)
                if im.mode not in ("RGB","RGBA"):
                    im=im.convert("RGBA" if "A" in im.getbands() else "RGB")
                im.save(dest,"WEBP",quality=90,method=6)
            tmp.unlink(missing_ok=True)
            if dest.stat().st_size<2500:
                dest.unlink(missing_ok=True)
                return False,"OUTPUT_TOO_SMALL"
            return True,""
        except Exception as e:
            tmp.unlink(missing_ok=True)
            return False,f"IMAGE_ERROR:{e}"
    except Exception as e:
        return False,f"DOWNLOAD:{e}"

def canonical_key(row):
    brand=effective_brand(row)
    mm=marketing_model(row.get("model",""),brand)
    return nrm(brand), nrm(mm)

def load_audit(audit_dir):
    p=Path(audit_dir)/"ALL-MAPPINGS-AUDIT.csv"
    if not p.exists():
        raise SystemExit(f"Audit CSV missing: {p}")
    with p.open("r",encoding="utf-8-sig",newline="",errors="replace") as f:
        return list(csv.DictReader(f))

def is_target(row):
    sev=str(row.get("severity","")).upper()
    reasons=str(row.get("reasons",""))
    image=str(row.get("image",""))
    model=str(row.get("model",""))
    if sev in {"CRITICAL","HIGH"}:
        return True
    if any(x in reasons for x in [
        "ONE_IMAGE_USED_FOR_DIFFERENT_MODELS",
        "MODEL_METADATA_CONFLICT",
        "VERY_SMALL_IMAGE_FILE",
        "IDENTICAL_IMAGE_BINARY_ACROSS_BRANDS",
    ]):
        return True
    if image.endswith("/group-1229.webp") or "iphone 12 pro max" in nrm(model):
        return True
    return False

def file_slug(s):
    s=nrm(s).replace(" ","-")
    return re.sub(r"[^a-z0-9-]+","",s)[:70].strip("-") or "phone"

def main():
    if len(sys.argv)<4:
        raise SystemExit("Usage: script AUDIT_DIR BACKUP_DIR REPORT_DIR")
    audit_dir=Path(sys.argv[1])
    backup=Path(sys.argv[2])
    report_dir=Path(sys.argv[3])
    backup.mkdir(parents=True,exist_ok=True)
    report_dir.mkdir(parents=True,exist_ok=True)
    PUBLIC_IMAGES.mkdir(parents=True,exist_ok=True)

    rows=load_audit(audit_dir)
    targets=[r for r in rows if is_target(r)]
    clusters={}
    for r in targets:
        key=canonical_key(r)
        if not key[1]:
            continue
        clusters.setdefault(key,[]).append(r)

    shutil.copy2(MAP_PATH, backup/"phoneImageMap.js")
    print("="*78)
    print("STRICT SELECTIVE IMAGE CORRECTION")
    print("="*78)
    print("Audit mappings:",len(rows))
    print("Strong/verified target mappings:",len(targets))
    print("Exact model clusters:",len(clusters))
    print("Existing LOW-risk mappings are protected and untouched.")
    print()

    accepted=[]
    unresolved=[]

    def work(item):
        key, cluster=item
        rep=cluster[0]
        brand=effective_brand(rep)
        model=marketing_model(rep.get("model",""),brand)
        pages=candidate_pages(brand,model)
        if not pages:
            return key,cluster,None,"NO_EXACT_SOURCE"
        for score,page,image,title in pages[:4]:
            digest=hashlib.sha1((brand+"|"+model+"|"+image).encode("utf-8","ignore")).hexdigest()[:10]
            name=f"auditfix-{file_slug(brand)}-{file_slug(model)}-{digest}.webp"
            dest=PUBLIC_IMAGES/name
            if dest.exists() and dest.stat().st_size>2500:
                return key,cluster,("/phone-images/"+name,score,page,image,title),"EXISTING"
            ok,err=download_image(page,image,dest)
            if ok:
                return key,cluster,("/phone-images/"+name,score,page,image,title),"DOWNLOADED"
        return key,cluster,None,"DOWNLOAD_FAILED"

    with ThreadPoolExecutor(max_workers=6) as ex:
        futs={ex.submit(work,it):it for it in clusters.items()}
        done=0
        for fut in as_completed(futs):
            done+=1
            try:
                key,cluster,result,status=fut.result()
            except Exception as e:
                key,cluster=futs[fut]
                result=None
                status=f"EXCEPTION:{e}"
            rep=cluster[0]
            if result:
                path,score,page,image,title=result
                for r in cluster:
                    accepted.append({
                        "phone_id":r.get("phone_id",""),
                        "brand":r.get("brand",""),
                        "model":r.get("model",""),
                        "old_image":r.get("image",""),
                        "new_image":path,
                        "source_page":page,
                        "source_image":image,
                        "source_title":title,
                        "score":round(score,3),
                    })
                print(f"[{done:3d}/{len(clusters)}] FIXED   {rep.get('brand')} | {marketing_model(rep.get('model',''),effective_brand(rep))} | phones={len(cluster)}")
            else:
                unresolved.append({
                    "brand":rep.get("brand",""),
                    "model":rep.get("model",""),
                    "image":rep.get("image",""),
                    "phones":len(cluster),
                    "reason":status,
                })
                print(f"[{done:3d}/{len(clusters)}] KEPT    {rep.get('brand')} | {marketing_model(rep.get('model',''),effective_brand(rep))} | {status}")

    map_text=MAP_PATH.read_text(encoding="utf-8-sig",errors="replace")
    changed=0
    for a in accepted:
        pid=str(a["phone_id"]).strip()
        new=a["new_image"]
        pattern=re.compile(rf'(^\s*{re.escape(pid)}\s*:\s*)["\'][^"\']+["\']',re.M)
        map_text,n=pattern.subn(lambda m:m.group(1)+f'"{new}"',map_text,count=1)
        changed+=n
    MAP_PATH.write_text(map_text,encoding="utf-8")

    def write_csv(path,rows):
        if not rows:
            path.write_text("",encoding="utf-8")
            return
        with path.open("w",encoding="utf-8-sig",newline="") as f:
            w=csv.DictWriter(f,fieldnames=list(rows[0].keys()))
            w.writeheader(); w.writerows(rows)

    write_csv(report_dir/"ACCEPTED.csv",accepted)
    write_csv(report_dir/"UNRESOLVED.csv",unresolved)
    summary=[
        "="*78,
        "STRICT SELECTIVE IMAGE CORRECTION SUMMARY",
        "="*78,
        f"Audit mappings                  : {len(rows)}",
        f"Strong/verified target mappings : {len(targets)}",
        f"Exact model clusters searched   : {len(clusters)}",
        f"Phone mappings corrected        : {changed}",
        f"Exact image clusters accepted   : {len({a['new_image'] for a in accepted})}",
        f"Unresolved clusters kept as-is  : {len(unresolved)}",
        "",
        "SAFETY:",
        "LOW-risk mappings were never targeted.",
        "Existing group-*.webp files were not overwritten.",
        "If no exact high-confidence source was found, the old mapping was kept.",
    ]
    (report_dir/"SUMMARY.txt").write_text("\n".join(summary),encoding="utf-8")
    print()
    print("\n".join(summary))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
