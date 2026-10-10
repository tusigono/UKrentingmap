const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../search.js'), 'utf8');
const helpers = source.slice(source.indexOf('function parsePostcode'), source.indexOf('async function searchLocation'));
const context = vm.createContext({URL, URLSearchParams, normalize: s=>s.toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]/g,''),distance:null});
vm.runInContext(source.slice(source.indexOf('function distance'),source.indexOf('function nearestStations')),context);
vm.runInContext(helpers, context);
for (const [input,kind,value] of [['SW12','district','SW12'],['SW19','district','SW19'],['SW1 9','sector','SW1 9'],['sw12  9','sector','SW12 9'],['SW129','sector','SW12 9'],['SW12 9L','prefix','SW12 9L'],['sw129lp','full','SW12 9LP'],[' E15 2RF ','full','E15 2RF']]) {
 const result=context.parsePostcode(input);assert.equal(result.kind,kind,input);assert.equal(result.value,value,input);
}
assert.equal(context.parsePostcode('Culverden Road'),null);
const features=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'photon-streets.json'),'utf8'));
const streets=context.photonResults(features,'culverden road');
assert.equal(streets.length,2,'Keep same-name streets, discard fuzzy matches');
assert.equal(streets[0].category,'街道');assert.match(streets[0].context,/Balham.*London.*SW12 9LP/);
(async()=>{
 let urls=[];context.fetch=async(url,options)=>{urls.push(String(url));return {ok:true,status:200,json:async()=>({result:[{postcode:'SW12 9AA',longitude:-.15,latitude:51.44,admin_district:'Wandsworth'},{postcode:'SW12 9LP',longitude:-.14,latitude:51.43,admin_district:'Wandsworth'},{postcode:'SW12 8AA',longitude:-1,latitude:50},{postcode:'SW12 9ZZ',longitude:null,latitude:null}]})}};
 const result=await context.findPostcodes(context.parsePostcode('SW12 9'));
 assert.equal(result.length,1);assert.equal(result[0].category,'郵遞區號區段');assert.ok(Math.abs(result[0].geo[0]+.145)<1e-9);assert.match(result[0].precisionNote,/2 個.*最多 100/);assert.match(urls[0],/q=SW12\+9/);
 context.fetch=async()=>({ok:true,status:200,json:async()=>({result:{postcode:'SW12 9LP',longitude:-.143,latitude:51.439,admin_ward:'Balham',admin_district:'Wandsworth'}})});
 assert.equal((await context.findPostcodes(context.parsePostcode('SW12 9LP')))[0].name,'SW12 9LP');
 context.fetch=async()=>({ok:false,status:404});assert.equal((await context.findPostcodes(context.parsePostcode('SW12 9ZZ'))).length,0);
 console.log('Passed postcode formatting, street disambiguation, prefix approximation, full postcode and missing-postcode checks.');
})().catch(e=>{console.error(e);process.exitCode=1});
