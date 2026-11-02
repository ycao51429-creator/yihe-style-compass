import assert from 'node:assert/strict';
import {weatherItems,weatherAdvice,fetchWeather,amapSearchUrl} from '../lib/weather.ts';
import {recommend} from '../lib/style-engine.ts';
const w={place:'测试城市',date:'2026-11-02',low:4,high:15,feels:6,rain:80,wind:30,code:61,fetchedAt:new Date().toISOString()};
const items=weatherItems(['衬衫','长裤','乐福鞋','包'],w);assert.match(items[0],/防风.*保暖/);assert.match(items[2],/防滑/);assert.match(items[3],/伞/);assert.ok(weatherAdvice(w).length>=3);
const p={height:'168',weight:'58',bust:'86',waist:'70',hip:'94',face:'不确定',hair:'',appearance:'',fit:'合身',presentation:'女装'},f={budget:800,styles:['简约通勤'],occasion:'日常通勤',season:'夏季',colors:'中性色',avoid:'伞',weather:w};
for(const o of recommend(p,f)){assert.ok(o.total<=800);assert.match(o.items[0].name,/保暖/);assert.ok(o.items.every(i=>!i.name.includes('伞')));assert.match(o.fitNote,/温差/);}
const u=new URL(amapSearchUrl('上海',{lat:31.2,lon:121.4}));assert.equal(u.searchParams.get('center'),'121.4,31.2');assert.equal(u.searchParams.get('coordinate'),'wgs84');assert.match(amapSearchUrl('北京 国贸',null),/keyword=/);
const oldFetch=globalThis.fetch;let requested;
globalThis.fetch=async u=>{requested=new URL(u);return new Response(JSON.stringify({current:{apparent_temperature:0,wind_speed_10m:0,weather_code:0},daily:{time:['2026-11-02'],temperature_2m_min:[-2],temperature_2m_max:[4],precipitation_probability_max:[0]}}));};
const data=await fetchWeather({lat:31.234567,lon:121.456789,label:'上海'},new AbortController().signal);assert.equal(data.feels,0);assert.equal(data.rain,0);assert.equal(requested.searchParams.get('latitude'),'31.23');assert.equal(requested.searchParams.get('longitude'),'121.46');
globalThis.fetch=async()=>new Response(JSON.stringify({current:{apparent_temperature:null},daily:{}}));await assert.rejects(()=>fetchWeather({lat:1,lon:2},new AbortController().signal),/不完整/);
globalThis.fetch=async()=>new Response('{}',{status:503});await assert.rejects(()=>fetchWeather({lat:1,lon:2},new AbortController().signal),/不可用/);globalThis.fetch=oldFetch;
console.log('25 weather checks passed: outfit changes, exclusions, budget, coordinate precision, zero values and invalid provider data.');
