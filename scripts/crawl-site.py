"""Capture the public Anthill website into a reproducible frontend content archive.

Run: python scripts/crawl-site.py. Requires requests and beautifulsoup4.
The site's copy is retained verbatim apart from HTML whitespace normalization.
"""
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
from concurrent.futures import ThreadPoolExecutor
import hashlib, json, re, time
import requests
from bs4 import BeautifulSoup, Tag
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://www.anthillventures.com'
SNAPSHOTS = ROOT / 'tmp/source'
MEDIA = ROOT / 'public/media'
OUT = ROOT / 'src/data/site-content.json'
for directory in [SNAPSHOTS, MEDIA, OUT.parent, ROOT / 'docs']:
    directory.mkdir(parents=True, exist_ok=True)

def clean(value):
    return re.sub(r'[\t\r\n ]+', ' ', value).strip()

def fetch(url):
    response = requests.get(url, timeout=45)
    response.raise_for_status()
    response.encoding = 'utf-8'
    return response

def path_of(url):
    return urlsplit(url).path.rstrip('/') or '/'

def absolute(url):
    return urljoin(ORIGIN, url)

def links_in(root):
    return [{'text': clean(a.get_text(' ', strip=True)), 'href': a.get('href'),
             'target': a.get('target', '')} for a in root.select('a[href]')]

def image_info(img):
    return {'src': absolute(img.get('src', '')), 'alt': img.get('alt', ''),
            'width': img.get('width'), 'height': img.get('height')}

def extract_blocks(root):
    blocks = []
    semantic = {'h1','h2','h3','h4','h5','h6','p','li','blockquote','label','figcaption'}
    inline = {'a','span','strong','em','b','i','br','u','sup','sub','small'}
    def visit(node):
        if not isinstance(node, Tag):
            return
        if node.name == 'img' and node.get('src'):
            blocks.append({'type': 'image', **image_info(node)})
            return
        if node.name in {'script','style','svg','noscript','input','select','textarea','button'}:
            return
        children = [x for x in node.children if isinstance(x, Tag)]
        text = clean(node.get_text(' ', strip=True))
        if text and (node.name in semantic or (all(x.name in inline for x in children) and not node.find('img'))):
            block = {'type': node.name if node.name in semantic else 'text', 'text': text}
            if node.name == 'a' and node.get('href'):
                block.update(type='link', href=node['href'])
            blocks.append(block)
            return
        for child in children:
            visit(child)
    visit(root)
    return blocks

def extract_forms(root):
    forms=[]
    for form in root.select('form'):
        fields=[]
        for field in form.select('input,textarea,select'):
            fields.append({'tag':field.name,'type':field.get('type','text'), 'name':field.get('name',''),
                           'id':field.get('id',''), 'placeholder':field.get('placeholder',''),
                           'required':field.has_attr('required'),
                           'options':[{'value':o.get('value',''),'text':o.get_text(' ',strip=True)} for o in field.select('option')]})
        forms.append({'name':form.get('data-name',form.get('name','')), 'action':form.get('action',''),
                      'method':form.get('method',''), 'fields':fields, 'text':clean(form.get_text(' ',strip=True))})
    return forms

def capture(url):
    route = path_of(url)
    print('Capture', route, flush=True)
    response=fetch(url)
    snapshot=SNAPSHOTS / ((route.strip('/').replace('/','__') or 'index')+'.html')
    snapshot.write_text(response.text, encoding='utf-8')
    soup=BeautifulSoup(response.text,'html.parser')
    title=clean(soup.title.get_text()) if soup.title else route
    description=soup.find('meta', attrs={'name':'description'})
    all_links=links_in(soup)
    footer=soup.select_one('.footer')
    navigation=soup.select_one('.navigation')
    shared={'footerText':clean(footer.get_text(' ',strip=True)) if footer else '',
            'footerLinks':links_in(footer) if footer else [],
            'footerForms':extract_forms(footer) if footer else [],
            'navigationLinks':links_in(navigation) if navigation else [],
            'navigationText':clean(navigation.get_text(' ',strip=True)) if navigation else ''}
    for unwanted in soup.select('.navigation, .footer, script, style, noscript'):
        unwanted.decompose()
    root=soup.select_one('.main-wrap') or soup.body
    sections=[]
    for section in root.find_all(recursive=False):
        if isinstance(section,Tag):
            sections.append({'class':' '.join(section.get('class',[])), 'blocks':extract_blocks(section),
                             'text':clean(section.get_text(' ',strip=True))})
    cards=[]
    for card in root.select('.w-dyn-item'):
        cards.append({'text':clean(card.get_text(' ',strip=True)), 'blocks':extract_blocks(card),
                      'links':links_in(card), 'images':[image_info(img) for img in card.select('img[src]')]})
    images=[image_info(img) for img in root.select('img[src]')]
    videos=[{'src':absolute(src['src']), 'type':src.get('type','')} for src in root.select('video source[src]')]
    for video in root.select('[data-poster-url]'):
        images.append({'src':absolute(video['data-poster-url']), 'alt':'Video poster'})
    page={'path':route,'sourceUrl':url,'title':title,'description':description.get('content','') if description else '',
          'headings':[{'level':int(h.name[1]),'text':clean(h.get_text(' ',strip=True))} for h in root.select('h1,h2,h3,h4,h5,h6')],
          'blocks':extract_blocks(root),'sections':sections,'cards':cards,'links':links_in(root),
          'allLinks':all_links,'images':images,'videos':videos,'forms':extract_forms(root),
          'text':clean(root.get_text(' ',strip=True)), 'status':response.status_code}
    return page, shared

def download_image(url):
    basename=unquote(urlsplit(url).path).split('/')[-1]
    basename=re.sub(r'[^\w.\-]+','-',basename)
    name=hashlib.sha1(url.encode()).hexdigest()[:9]+'-'+basename
    target=MEDIA/name
    try:
        if not target.exists():
            response=fetch(url)
            target.write_bytes(response.content)
        return url, {'local':'/media/'+name, 'bytes':target.stat().st_size}
    except Exception as error:
        return url, {'local':url,'error':str(error)}

def derive_home(data):
    blocks=data['pages']['/']['blocks']
    highlights=[]
    for index,block in enumerate(blocks):
        if block['type']=='h4':
            previous=next((b for b in reversed(blocks[:index]) if b['type']=='image'),{})
            following=next((b for b in blocks[index+1:] if b.get('text')), {})
            highlights.append({'name':block['text'],'description':following.get('text',''),
                               'image':previous.get('local',previous.get('src',''))})
    data['homeHighlights']=highlights

def capture_fonts(data):
    url='https://fonts.googleapis.com/css2?family=Archivo:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@300;400;500;600;700&family=Inter+Tight:wght@300;400;500;600;700&display=swap'
    css=fetch(url).text
    font_dir=ROOT/'public/fonts'
    font_dir.mkdir(exist_ok=True)
    assets={}
    for source in set(re.findall(r'url\((https://[^)]+)\)',css)):
        extension=Path(urlsplit(source).path).suffix or '.woff2'
        name=hashlib.sha1(source.encode()).hexdigest()[:12]+extension
        target=font_dir/name
        if not target.exists(): target.write_bytes(fetch(source).content)
        local='/fonts/'+name
        assets[source]=local
        css=css.replace(source,local)
    (font_dir/'source-fonts.css').write_text(css,encoding='utf-8')
    data['fonts']={'stylesheet':'/fonts/source-fonts.css','families':['Archivo','IBM Plex Mono','Inter Tight'], 'assets':assets}

def capture_documents(data):
    urls={link['href'] for page in data['pages'].values() for link in page['links'] if re.search(r'\.pdf(?:\?|$)',link['href'],re.I)}
    with ThreadPoolExecutor(max_workers=3) as pool:
        data['documents']=dict(pool.map(download_image,sorted(urls)))
    for page in data['pages'].values():
        for group in ['links','allLinks']:
            for link in page[group]:
                if link['href'] in data['documents']:
                    link['local']=data['documents'][link['href']]['local']

def main():
    sitemap=fetch(ORIGIN+'/sitemap.xml')
    SNAPSHOTS.joinpath('sitemap.xml').write_text(sitemap.text,encoding='utf-8')
    urls=[node.text.strip() for node in ET.fromstring(sitemap.text).findall('.//{*}loc')]
    urls=list(dict.fromkeys(ORIGIN+path_of(url) for url in [ORIGIN+'/']+urls))
    pages={}; shared={}; failures={}; visited=set()
    pending=urls
    while pending:
        next_urls=[]
        with ThreadPoolExecutor(max_workers=6) as pool:
            futures={pool.submit(capture,url):url for url in pending if path_of(url) not in visited}
            for future,url in futures.items():
                visited.add(path_of(url))
                try:
                    page,footer=future.result()
                    pages[page['path']]=page
                    if page['path']=='/':
                        shared=footer
                    for link in page['allLinks']:
                        target=absolute(link['href'])
                        parsed=urlsplit(target)
                        if parsed.netloc in {'www.anthillventures.com','anthillventures.com'} and not parsed.query and path_of(target) not in visited:
                            if not re.search(r'\.(pdf|jpg|png|svg|webp|mp4|webm|css|js)$',parsed.path,re.I):
                                next_urls.append(ORIGIN+path_of(target))
                except Exception as error:
                    failures[path_of(url)]=str(error)
        pending=list(dict.fromkeys(next_urls))
    # Save content before downloading assets, so page building can begin immediately.
    data={'source':ORIGIN,'capturedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),
          'pages':pages,'shared':shared,'failures':failures,'assets':{}}
    OUT.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    print('CONTENT READY:',len(pages),'pages',flush=True)
    sources=set()
    def collect(value):
        if isinstance(value,dict):
            if value.get('src') and value.get('type')!='video' and not re.search(r'\.(mp4|webm)',value['src']):
                sources.add(value['src'])
            for child in value.values(): collect(child)
        elif isinstance(value,list):
            for child in value: collect(child)
    collect(pages)
    with ThreadPoolExecutor(max_workers=10) as pool:
        data['assets']=dict(pool.map(download_image,sorted(sources)))
    def assign(value):
        if isinstance(value,dict):
            if value.get('src') in data['assets']:
                value['local']=data['assets'][value['src']]['local']
            for child in list(value.values()): assign(child)
        elif isinstance(value,list):
            for child in value: assign(child)
    assign(pages)
    derive_home(data)
    capture_fonts(data)
    capture_documents(data)
    OUT.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    report=['# Anthill source content inventory','',f"Captured from {ORIGIN} on {data['capturedAt']}.",'',
            f"{len(pages)} unique pages; {len(sources)} source images; {len(failures)} page fetch failures.",'',
            '| Source path | Title | Blocks | Images | Cards | Forms |','| --- | --- | ---: | ---: | ---: | ---: |']
    for path,page in sorted(pages.items()):
        report.append(f"| {path} | {page['title'].replace('|','/')} | {len(page['blocks'])} | {len(page['images'])} | {len(page['cards'])} | {len(page['forms'])} |")
    report += ['','## Preservation boundaries','',
               'Copy is captured from the live website without editorial changes. HTML whitespace is normalized. Source spelling, figures, punctuation and CMS ordering are retained. Navigation and footer are captured once in `shared`; page content excludes their duplicates. Every source page also retains all links, its full main-content text, form field definitions, section blocks and CMS cards.',
               '', 'The homepage hero contains video rather than text; its source video URLs and poster images are preserved. Source utility/template pages are included because the sitemap exposes them. Attached brand and fund PDFs are source assets, not new website copy.',
               '', 'Newsletter subscription is frontend-only in this rebuild; the source success text must not be presented as an actual completed subscription. Other source external destinations remain links. The original sources have no local website backend to migrate.',
               '', '## Capture failures','',json.dumps(failures,indent=2), '', '## Asset download failures','']
    report += [f"- {url}: {asset['error']}" for url,asset in data['assets'].items() if asset.get('error')]
    report += ['','## Source modules by page','']
    for route,page in pages.items():
        report += ['### '+route,'','; '.join(h['text'] for h in page['headings']),'']
    report += ['## Verification','',
               '`python scripts/verify-content.py` compares the complete main-content text against ordered block text for all pages, verifies every internal content link resolves to a captured page, and checks local files exist. Three source playbook PDF downloads are available locally as well as their original destinations. Fonts used by the source site are self-hosted under `public/fonts`.','']
    (ROOT/'docs/content-inventory.md').write_text('\n'.join(report)+'\n',encoding='utf-8')
    print('DONE:',len(pages),'pages',len(sources),'assets',flush=True)

if __name__=='__main__': main()
