from pathlib import Path
import json

root = Path(__file__).resolve().parent
places = json.loads((root / 'places.json').read_text(encoding='utf-8'))
svg = (root / 'tube-map.svg').read_text(encoding='utf-8')
html = (root / 'template.html').read_text(encoding='utf-8')
stations = json.loads((root / 'stations.json').read_text(encoding='utf-8'))
search = (root / 'search.js').read_text(encoding='utf-8').replace('__STATIONS__', json.dumps(stations, ensure_ascii=False))
html = html.replace('__SEARCH_JS__', search)
html = html.replace('__DATA__', json.dumps(places, ensure_ascii=False)).replace('__MAP_SVG__', svg)
(root / 'index.html').write_text(html, encoding='utf-8')
print(f'Built {len(places)} places with an inline vector map.')
