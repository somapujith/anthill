"""Assemble the Israel page from src/ (shell.html + base.css + parts/*.part).

Usage:
  python build.py --out <path.html>   build to a path of your choice (default: out/main.html)
  python build.py --deploy            also write israel-site/index.html (and the ignored working copy)
"""
import re, io, os, sys, math, json, base64, html, shutil, argparse, urllib.parse
from PIL import Image

SP = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(SP, "src")
ORIG = os.path.join(SP, "original", "Anthill_Israel_2.original.html")
PROJECT = os.path.dirname(SP)  # repo root

ap = argparse.ArgumentParser()
ap.add_argument("--out", default=os.path.join(SP, "out", "main.html"))
ap.add_argument("--deploy", action="store_true")
args = ap.parse_args()
os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)

orig = open(ORIG, encoding="utf-8").read()
shell = open(os.path.join(SRC, "shell.html"), encoding="utf-8").read()
base_css = open(os.path.join(SRC, "base.css"), encoding="utf-8").read()

# ---------- parts ----------
parts_dir = os.path.join(SRC, "parts")
css_parts, html_parts, js_parts, problems, secp_ids = [], [], [], [], []
for fn in sorted(os.listdir(parts_dir)):
    if not fn.endswith(".part"):
        continue
    txt = open(os.path.join(parts_dir, fn), encoding="utf-8").read()
    m = re.match(r"@@CSS\n(.*?)\n@@HTML\n(.*?)\n@@JS\n(.*)\Z", txt, re.S)
    if not m:
        problems.append("%s: missing @@CSS / @@HTML / @@JS markers" % fn)
        continue
    c, h, j = m.group(1), m.group(2), m.group(3)
    if c.count("{") != c.count("}"):
        problems.append("%s: unbalanced CSS braces (%d open, %d close)" % (fn, c.count("{"), c.count("}")))
    for tag in ("section", "div", "article", "ul", "ol", "svg", "aside", "details"):
        o = len(re.findall(r"<%s[\s>]" % tag, h)); cl = len(re.findall(r"</%s>" % tag, h))
        if o != cl:
            problems.append("%s: <%s> opens %d, closes %d" % (fn, tag, o, cl))
    if "--sec-p" in c:  # this part reads the scroll-progress variable: its section must be updated by the scroll helper
        ms = re.search(r'<section[^>]*\sid="([^"]+)"', h)
        if ms:
            secp_ids.append(ms.group(1))
        else:
            problems.append("%s: reads --sec-p but has no <section id=...>" % fn)
    css_parts.append("/* ===== %s ===== */\n%s" % (fn, c))
    html_parts.append(h)
    if j.strip():
        js_parts.append("  /* ===== %s ===== */\n%s" % (fn, j.rstrip("\n")))

# ---------- images ----------
uris = re.findall(r"data:(image/[a-z]+);base64,([A-Za-z0-9+/=]+)", orig)
assert len(uris) == 10


def data_uri(img, q=84):
    buf = io.BytesIO()
    img.convert("RGB").save(buf, "JPEG", quality=q, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def load(i):
    return Image.open(io.BytesIO(base64.b64decode(uris[i][1])))


def raw(i):
    return "data:%s;base64,%s" % uris[i]


crops = {"PRASAD": (4, 0, 0, 165), "SAILESH": (5, 0, 0, 165), "BEN": (6, 197, 0, 320),
         "SHAFRIR": (7, 58, 0, 290), "AHARON": (8, 0, 0, 165), "MOSHE": (9, 0, 0, 165)}
repl = {}
for key, (idx, x0, y0, side) in crops.items():
    im = load(idx).convert("RGB").crop((x0, y0, x0 + side, y0 + side))
    if side > 240:
        im = im.resize((240, 240), Image.LANCZOS)
    repl["{{PH_%s}}" % key] = data_uri(im, 86)
def logo_png(i, height):
    """Logos are drawn at 24-68px; the source PNGs are 360-500px wide. Re-encode at ~2x the display height."""
    im = load(i).convert("RGBA")
    w = max(1, round(im.width * height / im.height))
    im = im.resize((w, height), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


for n in range(3):
    repl["{{LOGO%d}}" % n] = logo_png(n, 136)     # partnership ledger (drawn up to ~68px high)
    repl["{{LOGO%dS}}" % n] = logo_png(n, 84)     # header (drawn up to ~42px high)
repl["{{HERO}}"] = data_uri(load(3), 80)


# ---------- topographic contours ----------
def contour_svg():
    paths = []
    for k in range(1, 19):
        R = 26 + k * 20
        cx, cy = 400 + k * 2.2, 400 - k * 1.6
        pts = []
        N = 110
        for i in range(N):
            t = 2 * math.pi * i / N
            r = R * (1 + .10 * math.sin(2 * t + .9 + k * .35) + .06 * math.sin(3 * t + 2.1 - k * .28) + .035 * math.sin(5 * t + k * .7))
            pts.append((cx + r * math.cos(t), cy + r * math.sin(t) * .92))
        paths.append("<path d='M%sZ'/>" % "L".join("%.1f %.1f" % p for p in pts))
    svg = ("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'>"
           "<g fill='none' stroke='#ffffff' stroke-opacity='.075' stroke-width='1.3' stroke-linejoin='round'>%s</g></svg>") % "".join(paths)
    return "data:image/svg+xml," + urllib.parse.quote(svg, safe="/:=',.()-_")


repl["{{CONTOURS}}"] = contour_svg()

# ---------- head meta + share tags ----------
title = re.search(r"<title>.*?</title>", orig, re.S).group(0)
desc = re.search(r'<meta name="description"[^>]*>', orig).group(0)
og_title = html.unescape(re.sub(r"<[^>]+>", "", title)).strip()
og_desc = html.unescape(re.search(r'content="([^"]*)"', desc).group(1)).strip()
esc = lambda t: html.escape(t, quote=True)
fav_svg = open(os.path.join(PROJECT, "public", "favicon.svg"), encoding="utf-8").read()
fav_uri = "data:image/svg+xml," + urllib.parse.quote(re.sub(r"\s+", " ", fav_svg).strip(), safe="/:=',.()-_ ")
repl["{{META}}"] = title + "\n" + desc + "\n" + "\n".join([
    '<meta name="robots" content="noindex">',
    '<link rel="canonical" href="https://israel.anthillventures.com/">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Anthill Ventures">',
    '<meta property="og:url" content="https://israel.anthillventures.com/">',
    '<meta property="og:title" content="%s">' % esc(og_title),
    '<meta property="og:description" content="%s">' % esc(og_desc),
    '<meta property="og:image" content="https://israel.anthillventures.com/og-israel.jpg">',
    '<meta property="og:image:type" content="image/jpeg">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:alt" content="Invest in India’s agricultural future: Anthill Ventures and II2W, Israel innovation with India scale">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:image" content="https://israel.anthillventures.com/og-israel.jpg">',
    '<link rel="icon" type="image/svg+xml" href="%s">' % fav_uri,
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
])

# ---------- legal copy, verbatim ----------
legal_block = re.search(r"</summary>(.*?)</details>", orig, re.S).group(1)
repl["{{LEGAL}}"] = "\n".join("    " + p.strip() for p in re.findall(r"<p>.*?</p>", legal_block, re.S))

# ---------- assemble ----------
out = shell.replace("{{CSS}}", base_css + "\n" + "\n".join(css_parts))
out = out.replace("{{SECTIONS}}", "\n\n".join(html_parts))
out = out.replace("{{PART_JS}}", "\n".join(js_parts))
out = out.replace("{{SECP_IDS}}", json.dumps(secp_ids))
for k, v in repl.items():
    out = out.replace(k, v)
left = sorted(set(re.findall(r"\{\{\w+\}\}", out)))
if left:
    problems.append("unresolved placeholders: %s" % left)
if "@@" in out:
    problems.append("stray @@ markers in output")

open(args.out, "w", encoding="utf-8", newline="\n").write(out)
print("built %s (%.0f KB)" % (args.out, len(out.encode("utf-8")) / 1024))
if problems:
    print("PROBLEMS:")
    for p in problems:
        print("  -", p)

if args.deploy:
    deploy = os.path.join(PROJECT, "israel-site")
    os.makedirs(deploy, exist_ok=True)
    open(os.path.join(deploy, "index.html"), "w", encoding="utf-8", newline="\n").write(out)
    open(os.path.join(PROJECT, "Anthill_Israel_2.html"), "w", encoding="utf-8", newline="\n").write(out)
    for f in ("apple-touch-icon.png", "favicon.ico"):
        shutil.copyfile(os.path.join(PROJECT, "public", f), os.path.join(deploy, f))
    print("deployed to working file + israel-site/")
sys.exit(1 if problems else 0)
