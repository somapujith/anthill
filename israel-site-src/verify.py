import os
import re, html

import sys
ORIG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "original", "Anthill_Israel_2.original.html")
NEW = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "israel-site", "index.html")
o = open(ORIG, encoding="utf-8").read()
n = open(NEW, encoding="utf-8").read()

def text(s):
    s = re.sub(r"data:[a-z]+/[a-z+]+;base64,[A-Za-z0-9+/=]+", "", s)
    s = re.sub(r"<script.*?</script>|<style.*?</style>", "", s, flags=re.S)
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", html.unescape(s)).strip()

nt = text(n)
ok = True

# every sentence that carries a figure, disclaimer or contact detail must survive verbatim
must = [
    "Anthill’s reported historical track record, as shown in the reference materials. These figures relate to Anthill’s existing activity and are not results or forecasts for the proposed joint AgriTech fund. Past performance does not guarantee future returns.",
    "Through holding-company structures and Indian joint ventures, the platform aims to capture value from local commercialization and expansion, with potential to serve global markets. These arrangements remain subject to final investment and partnership terms.",
    "For investors, the opportunity lies in identifying AgriTech companies that can translate these needs into proven solutions, customer adoption and scalable revenue.",
    "By testing technical performance and customer demand early, we aim to focus growth capital on companies that demonstrate practical value and a credible path to adoption across the Indian market.",
    "We invite qualified investors, fund managers and family offices to join us in bringing agricultural innovation to scale in India.",
    "Ben@greenroad-innovation.com", "+972 54 8071444", "For qualified investors, fund managers and family offices.",
]
# the three legal paragraphs, verbatim from the original footer
legal = re.findall(r"<p>(.*?)</p>", re.search(r"</summary>(.*?)</details>", o, re.S).group(1), re.S)
must += [html.unescape(re.sub(r"<[^>]+>", "", p)).strip() for p in legal]
# full bios, verbatim
bios = re.findall(r'<p class="clamp">(.*?)</p>', o, re.S)
must += [html.unescape(re.sub(r"<[^>]+>", "", b)).strip() for b in bios]

for m in must:
    if m not in nt:
        ok = False
        print("MISSING:", m[:90])

# links and media
for href in re.findall(r'href="(https://www\.linkedin\.com[^"]+)"', o):
    if href not in n:
        ok = False; print("MISSING LINK", href)
print("linkedin links:", len(re.findall(r"linkedin\.com", n)), "(original %d)" % len(re.findall(r"linkedin\.com", o)))
print("youtube id present:", "JhWDfMMaue0" in n)
print("unresolved placeholders:", re.findall(r"\{\{\w+\}\}", n))
print("figures present:", all(x in nt for x in ["60+", "33%", "5.4×"]), "| exits '10':", 'data-count="10"' in n)
print("images:", len(re.findall(r"data:image/", n)), "size KB:", len(n.encode()) // 1024, "(original %d)" % (len(o.encode()) // 1024))
print("ALL CONTENT CHECKS PASS" if ok else "CHECK FAILURES ABOVE")
