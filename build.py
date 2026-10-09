from pathlib import Path
import base64,json
root=Path(__file__).resolve().parent
places=json.loads((root/'places.json').read_text(encoding='utf-8'))
html=(root/'template.html').read_text(encoding='utf-8')
html=html.replace('__DATA__',json.dumps(places,ensure_ascii=False)).replace('__MAP__','data:image/png;base64,'+base64.b64encode((root/'tube-map.png').read_bytes()).decode())
(root/'index.html').write_text(html,encoding='utf-8')
print(f'Built {len(places)} places.')
