"""Check source text preservation, page-route coverage and local source assets."""
from pathlib import Path
from urllib.parse import urlsplit
import json

root=Path(__file__).resolve().parents[1]
data=json.loads((root/'src/data/site-content.json').read_text(encoding='utf-8'))
problems=[]
for path,page in data['pages'].items():
    reconstructed=' '.join(block['text'] for block in page['blocks'] if block.get('text'))
    if reconstructed!=page['text']:
        problems.append(f'{path}: block text differs from captured main-content text')
    for link in page['links']:
        href=link['href']
        if href.startswith('/') and not href.startswith('//'):
            target=urlsplit(href).path.rstrip('/') or '/'
            if target not in data['pages']:
                problems.append(f'{path}: missing local target {href}')
    for image in page['images']:
        local=image.get('local','')
        if local.startswith('/') and not (root/'public'/local.lstrip('/')).is_file():
            problems.append(f'{path}: missing local image {local}')
for url,document in data.get('documents',{}).items():
    local=document.get('local','')
    if not local.startswith('/') or not (root/'public'/local.lstrip('/')).is_file():
        problems.append(f'Missing local document {url}')
if data['failures']:
    problems.append('Source page fetch failures: '+str(data['failures']))
for source,asset in data['assets'].items():
    if asset.get('error'): problems.append('Source asset download failure: '+source)
assert not problems, '\n'.join(problems)
print(f"Verified {len(data['pages'])} pages: complete text preservation, local route coverage, {len(data['assets'])} images and {len(data.get('documents',{}))} documents.")
