#!/usr/bin/env python3
"""Build the CMV site: templates/ + content/*.json + static/ -> _site/
Text lives in content/*.json (one entry per sentence, four languages). Templates hold the layout.
Usage: python3 build.py [out_dir]"""
import html, json, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "_site"))
TOKEN = re.compile("⟦([0-9a-f]{8}):([eqrj])⟧")
FALLBACK = {"vi": ["en", "zh", "ko"], "zh": ["en", "vi", "ko"], "en": ["vi", "zh", "ko"], "ko": ["en", "vi", "zh"]}

# ---- content
strings, problems = {}, []
for f in sorted(os.listdir(os.path.join(HERE, "content"))):
    if not f.endswith(".json") or f in ("company.json", "images.json"):
        continue
    try:
        data = json.load(open(os.path.join(HERE, "content", f), encoding="utf-8"))
    except Exception as ex:
        sys.exit(f"content/{f} is not valid JSON: {ex}")
    for row in data.get("strings", []):
        if row.get("id"):
            strings[row["id"]] = row


def text_for(sid, lang):
    row = strings.get(sid)
    if row is None:
        problems.append(sid)
        return ""
    v = (row.get(lang) or "").strip("\n")
    if not v.strip():
        for alt in FALLBACK[lang]:
            if (row.get(alt) or "").strip():
                return row[alt]
    return v


def render(tpl, lang):
    def sub(m):
        t, mode = text_for(m.group(1), lang), m.group(2)
        if mode == "e":
            return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        if mode == "q":
            return html.escape(t, quote=True)
        if mode == "j":
            return json.dumps(t, ensure_ascii=False)[1:-1].replace("</", "<\\/") if "</" in t else json.dumps(t, ensure_ascii=False)[1:-1]
        return t
    return TOKEN.sub(sub, tpl)


# ---- company details and image swaps: plain find-and-replace over every page
def load(name):
    p = os.path.join(HERE, "content", name)
    return json.load(open(p, encoding="utf-8")) if os.path.exists(p) else {}


swaps = []
for row in load("company.json").get("details", []):
    old, new = row.get("original", ""), (row.get("value") or "").strip()
    if old and new and new != old:
        swaps.append((old, new))
img_swaps = []
for row in load("images.json").get("images", []):
    old, new = row.get("original", ""), (row.get("image") or "").strip().lstrip("/")
    if old and new and new != old:
        img_swaps.append((old, new))


def img_size(path):
    try:
        from PIL import Image
        with Image.open(path) as im:
            return im.size
    except Exception:
        return None


def apply_images(doc):
    for old, new in img_swaps:
        if old not in doc and old.replace(".webp", "-s.webp") not in doc:
            continue
        size = img_size(os.path.join(HERE, "static", new))
        for o in (old.replace(".webp", "-s.webp"), old):
            def fix(m):
                tag = m.group(0).replace(o, new)
                if size:
                    tag = re.sub(r'width="\d+"', f'width="{size[0]}"', tag)
                    tag = re.sub(r'height="\d+"', f'height="{size[1]}"', tag)
                return tag
            doc = re.sub(r"<img\b[^>]*" + re.escape(o) + r"[^>]*>", fix, doc)
            doc = doc.replace(o, new)
    return doc


# ---- build
if os.path.isdir(OUT):
    shutil.rmtree(OUT)
shutil.copytree(os.path.join(HERE, "static"), OUT)
pages = json.load(open(os.path.join(HERE, "templates", "_pages.json")))
for rel, lang in pages.items():
    doc = render(open(os.path.join(HERE, "templates", rel), encoding="utf-8").read(), lang)
    for old, new in swaps:
        doc = doc.replace(old, new)
    doc = apply_images(doc)
    dst = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, "w", encoding="utf-8").write(doc)
for extra in ("llms.txt", "data/products.json"):
    p = os.path.join(OUT, extra)
    if os.path.exists(p) and swaps:
        t = open(p, encoding="utf-8").read()
        for old, new in swaps:
            t = t.replace(old, new)
        open(p, "w", encoding="utf-8").write(t)
if problems:
    print(f"warning: {len(set(problems))} text ids used by the templates are missing from content/: {sorted(set(problems))[:10]}")
print(f"built {len(pages)} pages -> {OUT}")
