import assert from 'node:assert/strict';
import {recommend,makeQuery} from '../lib/style-engine.ts';
import {discover} from '../lib/discovery.ts';
const p={height:'168',weight:'58',bust:'86',waist:'70',hip:'94',face:'圆脸',hair:'齐肩发',appearance:'',fit:'合身',presentation:'中性'};
const f={budget:800,styles:['温柔清新'],occasion:'日常通勤',season:'冬季',colors:'中性色',avoid:'裙子'};
let checks=0;
for(const budget of [200,201,599,800,5000,50000])for(const season of ['夏季','春秋','冬季']){
 const outfits=recommend(p,{...f,budget,season});assert.equal(outfits.length,3);
 for(const o of outfits){assert.ok(o.total<=budget);assert.equal(o.total,o.items.reduce((a,b)=>a+b.price,0));assert.ok(o.items.every(i=>i.price>=0));assert.ok(o.items.every(i=>!i.name.includes('裙')));checks++;}
}
assert.ok(!makeQuery(p,f).includes('58'));assert.ok(!makeQuery(p,f).includes('86'));checks++;
assert.equal((await discover({action:'inspiration',query:'通勤穿搭'},{})).status,503);
assert.equal((await discover({action:'stores',city:'上海',radius:3000},{})).status,503);
assert.equal((await discover({action:'stores',coords:{lat:999,lon:120},radius:3000},{})).status,400);
assert.equal((await discover({action:'stores',city:'上海',radius:9999},{})).status,400);checks+=4;
const original=globalThis.fetch;const calls=[];
globalThis.fetch=async(url,init)=>{calls.push(String(url));if(String(url).includes('/geocode/geo'))return Response.json({status:'1',geocodes:[{location:'121.5,31.2',formatted_address:'上海市'}]});if(String(url).includes('/place/around'))return Response.json({status:'1',pois:[{id:'test-only',name:'测试服装门店',location:'121.5,31.2',distance:'150',address:'测试地址',business:{rating:[],tel:[]}}]});return Response.json({results:[{title:'测试参考',url:'https://example.com/fashion',content:'测试摘要'},{title:'invalid',url:'javascript:alert(1)'}]});};
const stores=await discover({action:'stores',city:'上海',radius:3000},{AMAP_WEB_KEY:'test-only'});assert.equal(stores.status,200);assert.equal(stores.data.stores[0].rating,null);assert.equal(stores.data.stores[0].inventoryStatus,'unknown');assert.ok(calls.some(x=>x.includes('types=061100')));checks+=4;
const refs=await discover({action:'inspiration',query:'通勤穿搭'},{TAVILY_API_KEY:'test-only'});assert.equal(refs.data.results.length,1);assert.ok(refs.data.results[0].fetchedAt);checks+=2;
globalThis.fetch=async()=>{throw new Error('network');};assert.equal((await discover({action:'inspiration',query:'通勤穿搭'},{TAVILY_API_KEY:'test-only'})).status,502);checks++;
assert.equal((await discover({action:'merchant',storeId:'valid-store'},{})).status,503);checks++;
for(const age of [0,20*60*1000]){
 globalThis.fetch=async()=>Response.json({store_id:'valid-store',updated_at:new Date(Date.now()-age).toISOString(),source_url:'https://example.com/stock',inventory:[{sku:'abc',name:'测试单品',quantity:3,price:199}],review:{rating:4.5,count:10,source_url:'https://example.com/reviews'}});
 const m=await discover({action:'merchant',storeId:'valid-store'},{MERCHANT_DATA_URL:'https://example.com/feed'});assert.equal(m.status,200);assert.equal(m.data.inventory[0].quantity,age===0?3:null);assert.equal(m.data.review.rating,4.5);checks+=3;
}
globalThis.fetch=async()=>Response.json({store_id:'wrong-store'});assert.equal((await discover({action:'merchant',storeId:'valid-store'},{MERCHANT_DATA_URL:'https://example.com/feed'})).status,502);checks++;
globalThis.fetch=original;console.log(`${checks} assertions passed; provider calls use test fixtures, not live credentials.`);
