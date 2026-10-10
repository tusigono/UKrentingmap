import json,re,pymupdf,sys
from pathlib import Path
root=Path(__file__).resolve().parent
if len(sys.argv)!=3:raise SystemExit('Usage: python3 build_station_index.py /path/to/tube-map.pdf /path/to/tfl-stops.json')
p=pymupdf.open(sys.argv[1])[0]
norm=lambda s:re.sub(r'[^a-z0-9]','',s.lower().replace('&','and'))
groups={}
for s in json.load(open(sys.argv[2]))['stopPoints']:
 if s['stopType'] not in ('NaptanMetroStation','NaptanRailStation'):continue
 name=re.sub(r' (Underground|DLR|Rail|Tram) Station$','',s['commonName'])
 if name.endswith(' Tram Stop'):name=name[:-10]
 name=re.sub(r' \((London|Berks|for ExCel|for Maritime Greenwich|Bakerloo|Circle Line|Dist&Picc Line|H&C Line|Central)\)$','',name)
 name=name.replace(' (H&C Line)-Underground','').replace('New Cross ELL','New Cross')
 if name in ('London Euston','London Liverpool Street','London Paddington'):name=name[7:]
 key=norm(name)
 if key not in groups:groups[key]={'name':name,'geo':[s['lon'],s['lat']],'lines':set(),'modes':set()}
 groups[key]['lines'].update(l['name'] for l in s['lines']);groups[key]['modes'].update(s['modes'])
alias={"King's Cross St. Pancras":"King’s Cross & St Pancras International",'Heathrow Terminals 2 & 3':'Heathrow Terminals 2 & 3','Bank':'Bank','Walthamstow Queens Road':'Walthamstow Queen’s Road','Shepherds Bush':'Shepherd’s Bush'}
for k,s in groups.items():
 name=alias.get(s['name'],s['name']).replace("'",'’').replace('St. ','St ')
 hits=p.search_for(name,flags=18)
 if not hits: hits=p.search_for(name.replace('’',"'"),flags=18)
 rects=[]
 for r in hits:
  if r.x0>1040 or r.y0<60 or r.y1>784:continue
  if rects and abs(r.y0-rects[-1].y1)<5 and r.x0<rects[-1].x1+3 and r.x1>rects[-1].x0-3:rects[-1]|=r
  else:rects.append(pymupdf.Rect(r))
 if not rects:
  # Recover labels separated into PDF text blocks, without guessing map positions.
  lines=[(l['bbox'],''.join(sp['text'] for sp in l['spans'])) for b in p.get_text('dict',flags=0)['blocks'] if 'lines' in b for l in b['lines'] if l['bbox'][0]<1040 and 60<l['bbox'][1]<784]
  target=norm(name)
  for box,text in lines:
   if not target.startswith(norm(text)) or not norm(text):continue
   r=pymupdf.Rect(box);joined=norm(text)
   for _ in range(4):
    if joined==target:rects.append(r);break
    candidates=[(b,t) for b,t in lines if 1<b[1]-r.y0<20 and abs(b[1]-r.y1)<6 and b[0]<r.x1+3 and b[2]>r.x0-3 and target.startswith(joined+norm(t)) and norm(t)]
    if not candidates:break
    b,t=min(candidates,key=lambda z:abs(z[0][1]-r.y1));r|=pymupdf.Rect(b);joined+=norm(t)
 s['rects']=rects
# Eliminate partial labels such as Stratford within Stratford International.
for k,s in groups.items():
 s['rects']=[r for r in s['rects'] if not any(k!=k2 and k in k2 and len(k2)>len(k) and any(r2.contains(r) for r2 in t['rects']) for k2,t in groups.items())]
for i,s in enumerate(sorted(groups.values(),key=lambda s:s['name'])):
 s['id']='station-'+norm(s['name']);s['lines']=sorted(s['lines']);s['modes']=sorted(s['modes']);s['rects']=[[round(r.x0-2,2),round(r.y0-62,2),round(r.width+4,2),round(r.height+4,2)] for r in s['rects']]
out=sorted(groups.values(),key=lambda s:s['name'])
(root/'stations.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print('Stations',len(out),'on map',sum(bool(s['rects']) for s in out));print('Unmatched:',[s['name'] for s in out if not s['rects']])
