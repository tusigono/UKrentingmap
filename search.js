// Station locations come from TfL; label boxes are extracted from the supplied PDF.
const STATIONS=__STATIONS__;
const SEARCH_ALIASES={'雷丁':'Reading','牛津':'Oxford','巴斯':'Bath','布里斯托':'Bristol','劍橋':'Cambridge','坎特伯里':'Canterbury','科茲窩':'Cotswolds','科茲沃爾德':'Cotswolds','吉爾福德':'Guildford','吉爾福':'Guildford','牛津圓環':'Oxford Circus','國王十字':'Kings Cross St Pancras','帕丁頓':'Paddington','滑鐵盧':'Waterloo','尤斯頓':'Euston','利物浦街':'Liverpool Street','北格林威治':'North Greenwich','金絲雀碼頭':'Canary Wharf','史特拉福':'Stratford'};
const EXTRA_AREAS=[{id:'lookup-guildford',name:'Guildford',zh:'吉爾福德',geo:[-.5704,51.2362]}];
const normalize=s=>s.toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9\u3400-\u9fff]/g,'');
let lookup=null,searchTimer,searchAbort,searchRevision=0,searchResults=[];
function queryText(){const q=$('search').value.trim();return SEARCH_ALIASES[q]||q}
function localResults(){const q=normalize(queryText());if(!q)return [];const areas=[...DATA,...EXTRA_AREAS].filter(p=>[p.name,p.zh].some(s=>normalize(s||'').includes(q))).map(p=>({type:'area',place:p,name:p.name,exact:[p.name,p.zh].some(s=>normalize(s||'')===q)}));const stations=STATIONS.filter(s=>normalize(s.name).includes(q)).map(s=>({type:'station',station:s,name:s.name,exact:normalize(s.name)===q}));return [...areas,...stations].sort((a,b)=>Number(b.exact)-Number(a.exact)||(a.type===b.type? a.name.localeCompare(b.name):a.type==='station'?-1:1)).slice(0,12)}
function showResults(results,message=''){searchResults=results;const q=$('search').value.trim();$('searchResults').hidden=!q;$('searchResults').innerHTML=(message?`<p class="search-status" role="status">${esc(message)}</p>`:'')+results.map((r,i)=>`<button class="search-result" data-result="${i}"><span>${esc(r.name)}${r.place?.zh?` · ${esc(r.place.zh)}`:''}</span><small>${r.type==='station'?'車站 · '+r.station.lines.join(' / '):r.type==='remote'?(r.category||'地區／小鎮')+' · '+r.context:'已收錄地區／目的地'}</small></button>`).join('')+(!results.length&&!message?'<p class="search-status">按「搜尋定位」查詢英國街道、郵遞區號、地區或小鎮。</p>':'');$('searchResults').querySelectorAll('[data-result]').forEach(b=>b.onclick=()=>chooseResult(searchResults[Number(b.dataset.result)]))}
function distance(a,b){const rad=Math.PI/180,dlat=(b[1]-a[1])*rad,dlon=(b[0]-a[0])*rad;return 6371*2*Math.asin(Math.sqrt(Math.sin(dlat/2)**2+Math.cos(a[1]*rad)*Math.cos(b[1]*rad)*Math.sin(dlon/2)**2))}
function nearestStations(geo){return STATIONS.map(s=>({...s,distance:distance(geo,s.geo)})).sort((a,b)=>a.distance-b.distance).slice(0,5)}
function stationCenter(s){if(view==='geo')return coords(s);if(!s.rects.length)return null;const r=s.rects[0];return{x:r[0]+r[2]/2,y:r[1]+r[3]/2}}
function lookupStations(){return !lookup?[]:lookup.type==='station'?[lookup.station]:lookup.nearby.filter(s=>s.distance<=5&&s.rects.length)}
function focusLookup(){const points=view==='tube'?lookupStations().map(stationCenter).filter(Boolean):[coords(lookup)].filter(Boolean);if(!points.length)return;const r=$('viewport').getBoundingClientRect(),xs=points.map(p=>p.x),ys=points.map(p=>p.y),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;const usable=r.width>900?r.width-370:r.width;scale=Math.min(3,usable/(Math.max(...xs)-Math.min(...xs)+100),(r.height-80)/(Math.max(...ys)-Math.min(...ys)+100));scale=Math.max(.6,scale);tx=usable/2-cx*scale;ty=r.height/2-cy*scale;applyTransform()}
function chooseResult(r){clearTimeout(searchTimer);searchAbort?.abort();searchRevision++;if(r.type==='area'&&DATA.some(p=>p.id===r.place.id)){// Keep the existing living/travel/safety notes in the search popup.
 lookup={type:'area',name:r.place.name,geo:r.place.geo,place:r.place,nearby:nearestStations(r.place.geo)};
 }else if(r.type==='station')lookup={type:'station',name:r.station.name,geo:r.station.geo,station:r.station};else {const p=r.place||r;lookup={type:'area',name:p.name,geo:p.geo,place:r.place,context:r.context,category:r.category,precisionNote:r.precisionNote,source:r.source,nearby:nearestStations(p.geo)}}
 popupOpen=true;const onTube=lookup.type==='station'?lookup.station.rects.length:lookupStations().length;setView(onTube?'tube':'geo',false);if(r.type!=='remote')showResults(localResults());focusLookup();if(matchMedia('(max-width:850px)').matches)$('viewport').scrollIntoView({behavior:'smooth',block:'start'});if(!onTube)flash('已在旅行方位圖標記位置。')}
function renderLookup(){const el=$('lookupPins');if(!lookup){el.innerHTML='';return}let html='';if(view==='tube'){html=lookupStations().map(s=>s.rects.map(r=>`<div class="station-highlight" style="left:${r[0]/pw*100}%;top:${r[1]/ph*100}%;width:${r[2]/pw*100}%;height:${r[3]/ph*100}%" title="${esc(s.name)}"></div>`).join('')).join('');const s=lookupStations()[0],c=s&&stationCenter(s);if(c)html+=`<button class="lookup-marker" style="left:${c.x/pw*100}%;top:${c.y/ph*100}%" aria-label="查看搜尋結果 ${esc(lookup.name)}"><span>⌖ ${esc(lookup.name)}</span></button>`}else{const c=coords(lookup);html=`<button class="lookup-marker geo-marker" style="left:${c.x/pw*100}%;top:${c.y/ph*100}%" aria-label="查看搜尋結果 ${esc(lookup.name)}">⌖<span>${esc(lookup.name)}</span></button>`}el.innerHTML=html;el.querySelector('button')?.addEventListener('click',e=>{e.stopPropagation();popupOpen=true;renderDetail()})}
function renderLookupDetail(){const l=lookup,p=l.place;let content;if(l.type==='station'){const s=l.station;content=`<p class="detail-reason">${view==='tube'?'黃色框標出原地鐵圖上的車站名稱。':'原圖未能定位這個站名，已標出車站地理位置。'}</p><h4>可搭乘路線</h4><p>${s.lines.map(esc).join(' · ')||'請查官方車站資訊'}</p><p class="subtitle">${s.modes.map(m=>({'tube':'地鐵','dlr':'DLR 輕軌','overground':'London Overground','elizabeth-line':'Elizabeth line','tram':'電車','national-rail':'National Rail'}[m]||m)).map(esc).join(' · ')}</p>`}else{const nearby=l.nearby.filter(s=>s.distance<=5);content=`${l.precisionNote?`<p class="safety-notes">${esc(l.precisionNote)}</p>`:''}<p class="detail-reason">${nearby.length?'附近可比較以下車站；點站名就能在地鐵圖定位。':'這裡沒有 5 公里內的 TfL 地鐵／市郊鐵路站。前往倫敦通常要搭 National Rail，請從當地火車站查班次。'}</p>${view==='tube'?'<p class="subtitle">黃色框是鄰近車站，代表地區的交通位置；不是行政區邊界。</p>':''}${nearby.length?`<div class="nearby-stations">${nearby.map(s=>`<button class="search-result" data-station="${s.id}"><span>${esc(s.name)} <small>${s.distance<1?Math.round(s.distance*1000)+' 公尺':s.distance.toFixed(1)+' 公里'}</small></span><small>${s.lines.map(esc).join(' / ')}</small></button>`).join('')}</div><p class="subtitle">距離是地區定位點到車站的直線距離，實際步行須依住址確認。</p>`:''}${p&&p.reason?`<p class="detail-reason">${esc(p.reason)}</p><div class="detail-grid"><div><h4>生活與找房</h4><p>${esc(p.life)}</p></div><div><h4>旅行與交通</h4><p>${esc(p.travel)}</p></div></div>${safetyHTML(p)}${p.budget?`<div class="budget">${esc(p.budget)}</div>`:''}`:'<p class="subtitle">此定位結果沒有居住推薦或治安評等。</p>'}`}
 $('details').innerHTML=`<div class="detail-head"><div><h2>${esc(l.name)}</h2><div class="subtitle">${l.type==='station'?'搜尋車站':'搜尋'+(l.category||'地區／小鎮')}${l.context?' · '+esc(l.context):''}</div></div><div class="detail-actions">${p&&DATA.some(x=>x.id===p.id)?`<button class="button" id="detailFav">${isFav(p.id)?'★ 已收藏':'☆ 收藏比較'}</button>`:''}<button class="detail-close" id="closeDetail" aria-label="關閉地點說明">✕</button></div></div>${content}${p?.source?`<p><a href="${esc(p.source)}" target="_blank" rel="noopener noreferrer">原有推薦來源／查詢房源 ↗</a></p>`:''}<div class="detail-bottom"><a href="https://tfl.gov.uk/plan-a-journey/" target="_blank" rel="noopener noreferrer">TfL 路線規劃 ↗</a><a href="https://www.nationalrail.co.uk/" target="_blank" rel="noopener noreferrer">National Rail ↗</a></div><p class="subtitle">車站：TfL；定位：${esc(l.source||'已收錄地點或 OpenStreetMap／Photon')}。</p>`;$('closeDetail').onclick=closeDetail;if($('detailFav'))$('detailFav').onclick=()=>toggleFav(p.id);$('details').querySelectorAll('[data-station]').forEach(b=>b.onclick=()=>chooseResult({type:'station',station:STATIONS.find(s=>s.id===b.dataset.station)}))}
function parsePostcode(q){
 const input=q.trim().toUpperCase().replace(/\s+/g,' '),compact=input.replace(/ /g,'');
 const outward='([A-Z]{1,2}\\d[A-Z\\d]?|GIR)';
 const spaced=input.includes(' '),kinds=spaced?['full','sector','prefix']:['full','district','sector','prefix'];
 const suffixes={full:'(\\d[A-Z]{2})',sector:'(\\d)',prefix:'(\\d[A-Z])',district:''};
 for(const kind of kinds){
  const match=(spaced?input:compact).match(new RegExp('^'+outward+(spaced?' ':'')+suffixes[kind]+'$'));
  if(match)return {kind,outcode:match[1],value:match[1]+(match[2]?' '+match[2]:'')};
 }
 return null;
}
async function fetchSearchJSON(url,signal){const res=await fetch(url,{signal});if(res.status===404||res.status===400)return null;if(!res.ok)throw Error('network');return res.json()}
function postcodeResult(p){return {type:'remote',category:'完整郵遞區號',name:p.postcode,geo:[p.longitude,p.latitude],context:[p.admin_ward,p.admin_district,p.region].filter((v,i,a)=>v&&a.indexOf(v)===i).join(' · '),source:'Postcodes.io',precisionNote:'定位是這個完整郵遞區號的代表座標，不是特定房屋的門口。附近車站距離為直線距離。'}}
async function findPostcodes(postcode,signal){
 if(postcode.kind==='full'){const json=await fetchSearchJSON('https://api.postcodes.io/postcodes/'+encodeURIComponent(postcode.value),signal);const p=json?.result;return p&&Number.isFinite(p.longitude)&&Number.isFinite(p.latitude)?[postcodeResult(p)]:[]}
 if(postcode.kind==='district'){const json=await fetchSearchJSON('https://api.postcodes.io/outcodes/'+encodeURIComponent(postcode.outcode),signal);const p=json?.result;return p&&Number.isFinite(p.longitude)&&Number.isFinite(p.latitude)?[{type:'remote',category:'郵遞區號分區',name:postcode.value,geo:[p.longitude,p.latitude],context:(p.admin_district||[]).join(' · '),source:'Postcodes.io',precisionNote:postcode.value+' 是較大郵區，此處為郵區代表位置。填完整郵遞區號可比較房源附近的車站；這裡不是郵區邊界或房屋位置。'}]:[]}
 const url=new URL('https://api.postcodes.io/postcodes');url.search=new URLSearchParams({q:postcode.value,limit:'100'});
 const json=await fetchSearchJSON(url,signal),points=(json?.result||[]).filter(p=>p.postcode.replace(/\s/g,'').startsWith(postcode.value.replace(/\s/g,''))&&Number.isFinite(p.longitude)&&Number.isFinite(p.latitude));
 if(!points.length)return [];
 const geo=[points.reduce((sum,p)=>sum+p.longitude,0)/points.length,points.reduce((sum,p)=>sum+p.latitude,0)/points.length];
 return [{type:'remote',category:postcode.kind==='sector'?'郵遞區號區段':'部分郵遞區號',name:postcode.value,geo,context:[...new Set(points.map(p=>p.admin_district).filter(Boolean))].join(' · '),source:'Postcodes.io',precisionNote:postcode.value+' 不是完整郵遞區號。這個標記取查詢返回的 '+points.length+' 個郵遞區號的平均位置（最多 100 個），僅供概略定位，不能當作整區中心或房源位置。請填完整郵遞區號，例如 '+points[0].postcode+'，再比較附近車站。'}];
}
function photonResults(json,q){
 const results=(json?.features||[]).filter(f=>f.geometry?.type==='Point'&&(['city','town','village','hamlet','suburb','quarter','neighbourhood','borough','district','county','locality','administrative','street','house'].includes(f.properties.type||f.properties.osm_value))).map(f=>{
  const p=f.properties,street=p.type==='street'||p.osm_key==='highway'&&p.osm_value!=='bus_stop',house=p.type==='house';
  return {type:'remote',category:street?'街道':house?'地址／地點':'地區／小鎮',name:house&&p.housenumber&&p.street?[p.housenumber,p.street].join(' '):p.name||p.street,geo:f.geometry.coordinates,context:[p.locality,p.district,p.city,p.county,p.state,p.postcode].filter((x,i,a)=>x&&x!==p.name&&a.indexOf(x)===i).join(' · '),source:'OpenStreetMap／Photon',precisionNote:street?'此處是街道代表位置，附近車站的距離不是從妳的房屋門口計算。若有完整郵遞區號，搜尋它會更精確。':null};
 }).filter(r=>r.name).filter((r,i,a)=>a.findIndex(t=>t.name===r.name&&distance(t.geo,r.geo)<.5)===i);
 const exact=results.filter(r=>normalize(r.name)===normalize(q));
 return (exact.length?exact:results).sort((a,b)=>distance(a.geo,[-.127,51.507])-distance(b.geo,[-.127,51.507]));
}
async function searchLocation(){
 const q=queryText();if(!q)return;
 const postcode=parsePostcode(q),local=localResults(),exact=local.filter(r=>r.exact);
 if(!postcode&&exact.length){chooseResult(exact[0]);return}
 if(!postcode&&local.length){showResults(local,'請點選要定位的地區或車站；完整名稱可直接定位。');return}
 searchAbort?.abort();const controller=searchAbort=new AbortController(),revision=++searchRevision;
 const timer=setTimeout(()=>controller.abort(),12000);$('searchGo').disabled=true;showResults([],postcode?'正在查詢郵遞區號…':'正在查詢英國街道、地區／小鎮…');
 try{
  let results;
  if(postcode)results=await findPostcodes(postcode,controller.signal);
  else {const url=new URL('https://photon.komoot.io/api/');url.search=new URLSearchParams({q,countrycode:'GB',limit:'8',lang:'en',lat:'51.507',lon:'-0.127'});results=photonResults(await fetchSearchJSON(url,controller.signal),q)}
  if(revision!==searchRevision)return;
  showResults(results,results.length?(results.length===1?'已定位；附近車站顯示於地圖說明。':'有同名或相似結果，請核對所在城市與郵遞區號，再點選定位。'):(postcode?'找不到這個郵遞區號。請核對拼字；可輸入 SW12、SW12 9 或完整 SW12 9LP。':'找不到這個地點。請試英文名稱，或在街名後加 London／所在城市。'));
  if(results.length===1)chooseResult(results[0]);
 }catch(e){if(revision===searchRevision)showResults([],'線上定位暫時無法連線。已收錄地點與車站仍可搜尋；請稍後重試。')}
 finally{clearTimeout(timer);if(revision===searchRevision||searchAbort===controller)$('searchGo').disabled=false}
}
$('search').oninput=()=>{searchAbort?.abort();searchRevision++;$('searchGo').disabled=false;lookup=null;closeDetail();render();showResults(localResults());clearTimeout(searchTimer);searchTimer=setTimeout(()=>{const exact=localResults().find(r=>r.exact);if(exact)chooseResult(exact);else if(!localResults().length&&queryText().length>=4)searchLocation()},800)};
$('search').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();clearTimeout(searchTimer);searchLocation()}if(e.key==='Escape'){clearTimeout(searchTimer);searchAbort?.abort();searchRevision++;$('searchResults').hidden=true;closeDetail()}};
$('searchGo').onclick=()=>{clearTimeout(searchTimer);searchLocation()};
