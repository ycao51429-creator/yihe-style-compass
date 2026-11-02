import assert from'node:assert/strict';import{build}from'vite';import{mkdtemp,rm}from'node:fs/promises';import{tmpdir}from'node:os';import{join}from'node:path';import{pathToFileURL}from'node:url';
const temp=await mkdtemp(join(tmpdir(),'yihe-session-'));let checks=0;
try{
 await build({configFile:false,logLevel:'silent',build:{outDir:temp,emptyOutDir:false,lib:{entry:['lib/styling-session.ts','lib/product-link.ts'],formats:['es'],fileName:(_f,n)=>n+'.mjs'}}});
 const {sessionReply,editPlan,emptySession,planTotal}=await import(pathToFileURL(join(temp,'styling-session.mjs')));const{parseProductLink,assessProduct}=await import(pathToFileURL(join(temp,'product-link.mjs')));
 const p={height:'168',weight:'58',bust:'86',waist:'70',hip:'94',face:'不确定',hair:'',appearance:'',fit:'合身',presentation:'不限'},f={budget:800,styles:['简约通勤'],occasion:'日常通勤',season:'春秋',colors:'中性色',avoid:''};
 let r=sessionReply('预算800，面试',emptySession(),p,f);assert.equal(r.session.plan.occasion,'正式场合');checks++;
 const original=structuredClone(r.session.plan);
 r=sessionReply('保留裤子，只换上衣',r.session,r.profile,r.prefs);assert.equal(r.session.plan.items[1].name,original.items[1].name);assert.equal(r.session.plan.items[1].locked,true);assert.notEqual(r.session.plan.items[0].name,original.items[0].name);assert.equal(r.session.plan.items[0].locked,false);assert.deepEqual(r.session.plan.items[2],original.items[2]);checks+=5;
 r=sessionReply('撤销上一步',r.session,r.profile,r.prefs);assert.deepEqual(r.session.plan,original);checks++;
 r=sessionReply('我有黑色直筒裤和白色平底鞋',r.session,r.profile,r.prefs);assert.equal(r.session.plan.items[1].name,'黑色直筒裤');assert.equal(r.session.plan.items[2].name,'白色平底鞋');assert.equal(r.session.plan.items[1].amount,0);assert.equal(r.session.plan.items[2].amount,0);assert.ok(r.session.plan.items[1].locked);checks+=5;
 const owned=r.session.plan.items.filter(i=>i.owned).map(i=>({...i}));r=sessionReply('太正式了',r.session,r.profile,r.prefs);assert.equal(r.prefs.styles[0],'松弛休闲');assert.deepEqual(r.session.plan.items.filter(i=>i.owned),owned);checks+=2;
 r=sessionReply('再便宜一点',r.session,r.profile,r.prefs);assert.equal(r.session.plan.budget,640);assert.equal(r.prefs.budget,640);assert.ok(planTotal(r.session.plan)<=640);checks+=3;
 const locked=editPlan(r.session,'lock',p,r.prefs,'top');const blocked=editPlan(locked,'swap',p,r.prefs,'top');assert.equal(blocked.plan.items[0].name,locked.plan.items[0].name);checks++;
 const reduced=editPlan(locked,'cheaper',p,{...f,budget:200});assert.equal(reduced.plan.items[0].amount,locked.plan.items[0].amount);checks++;
 const noOwned=sessionReply('有没有合适的裤子',emptySession(),p,f);assert.ok(!noOwned.session.plan||noOwned.session.plan.items.every(i=>!i.owned));checks++;
 const weekend=sessionReply('现在改为周末出游',r.session,r.profile,r.prefs);assert.equal(weekend.session.plan.occasion,'周末出游');assert.deepEqual(weekend.session.plan.items.filter(i=>i.owned),owned);checks+=2;
 for(let n=0;n<12;n++)r={...r,session:editPlan(r.session,'swap',p,f,'top')};assert.ok(r.session.history.length<=8);checks++;
 const known=parseProductLink('推荐 https://www.uniqlo.cn/product-detail.html?productCode=u0000000070386&spm=tracking。');assert.equal(known.matchedId,'linen-box');assert.ok(!known.url.includes('spm='));checks+=2;
 assert.equal(parseProductLink('https://item.jd.com/123456.html').productId,'123456');assert.equal(parseProductLink('https://detail.tmall.com/item.htm?id=123').productId,'123');assert.equal(parseProductLink('https://xhslink.com/a/test').shortLink,true);checks+=3;
 for(const s of ['javascript:alert(1)','http://item.jd.com/123.html','https://jd.com.evil.test/x','https://jd.com@evil.test/x','https://evil@jd.com/x','https://127.0.0.1/x']){assert.throws(()=>parseProductLink(s));checks++;}
 assert.match(assessProduct({name:'衬衫',price:'900',material:'棉麻',size:''},800).join(''),/超过整套预算/);assert.match(assessProduct({name:'衬衫',price:'',material:'',size:''},800).join(''),/还缺完整面料/);assert.throws(()=>assessProduct({name:'x',price:'NaN',material:'',size:''},800));checks+=3;
 const baseSession=sessionReply('预算800',emptySession(),p,f).session;
 assert.equal(sessionReply('降预算',baseSession,p,f).session.plan.budget,640);
 assert.equal(sessionReply('想便宜一点',emptySession(),p,f).session.plan.budget,640);
 assert.equal(sessionReply('预算降到600',baseSession,p,f).session.plan.budget,600);
 const combined=sessionReply('保留裤子换上衣',baseSession,p,f);assert.ok(combined.session.plan.items[1].locked);assert.equal(combined.session.plan.items[0].locked,false);checks+=5;
 const skirt=editPlan(emptySession(),'new',p,{...f,styles:['温柔清新']});assert.match(skirt.plan.items[1].name,/裙/);
 const exclude=sessionReply('不穿裙子',skirt,p,{...f,styles:['温柔清新']});assert.ok(!exclude.session.plan.items[1].name.includes('裙'));
 const keptSkirt=editPlan(skirt,'lock',p,f,'bottom');assert.match(sessionReply('不穿裙子',keptSkirt,p,f).session.plan.note,/冲突/);checks+=3;
 console.log(checks+' session and product link checks passed.');
}finally{await rm(temp,{recursive:true,force:true});}
