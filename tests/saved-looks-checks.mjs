import assert from'node:assert/strict';
import{build}from'vite';import{mkdtemp,rm}from'node:fs/promises';import{tmpdir}from'node:os';import{join}from'node:path';import{pathToFileURL}from'node:url';
const temp=await mkdtemp(join(tmpdir(),'yihe-looks-'));let checks=0;
try{
 await build({configFile:false,logLevel:'silent',build:{outDir:temp,emptyOutDir:false,lib:{entry:['lib/saved-looks.ts','lib/styling-session.ts'],formats:['es'],fileName:(_f,n)=>n+'.mjs'}}});
 const{readLooks,writeLooks,restoreLook,validPlan}=await import(pathToFileURL(join(temp,'saved-looks.mjs')));const{createPlan,editPlan}=await import(pathToFileURL(join(temp,'styling-session.mjs')));
 const profile={height:'168',weight:'58',bust:'86',waist:'70',hip:'94',face:'不确定',hair:'',appearance:'',fit:'合身',presentation:'不限'},prefs={budget:800,styles:['简约通勤'],occasion:'日常通勤',season:'春秋',colors:'中性色',avoid:''};
 const plan=createPlan(profile,prefs),look={id:'a',name:'周一通勤',savedAt:'2026-11-02T02:00:00Z',plan};
 assert.deepEqual(readLooks(writeLooks([look])),[look]);checks++;
 for(const raw of [null,'garbage','null','[]','{"version":2,"looks":[]}',JSON.stringify({version:1,looks:[null,{}]}),'x'.repeat(150001)]){assert.deepEqual(readLooks(raw),[]);checks++;}
 for(const bad of [{...plan,budget:-1},{...plan,items:[]},{...plan,items:[...plan.items.slice(0,3),plan.items[0]]},{...plan,items:plan.items.map(i=>({...i,owned:true}))},{...plan,revision:NaN},{...plan,items:plan.items.map(i=>({...i,amount:Infinity}))}]){assert.equal(validPlan(bad),false);checks++;}
 const records=Array.from({length:20},(_,n)=>({...look,id:String(n)}));assert.equal(readLooks(writeLooks(records)).length,12);assert.equal(readLooks(writeLooks([look,look])).length,1);checks+=2;
 const fresh=createPlan(profile,{...prefs,budget:600,occasion:'周末出游'}),session={plan:fresh,history:[]};const restored=restoreLook(session,plan);restored.plan.items[0].name='changed';assert.notEqual(plan.items[0].name,'changed');assert.deepEqual(editPlan(restored,'undo',profile,prefs).plan,fresh);checks+=2;
 const history=Array.from({length:8},()=>fresh);assert.equal(restoreLook({plan:fresh,history},plan).history.length,8);checks++;
 assert.equal(writeLooks([{...look,secret:'never persist'}]).includes('secret'),false);checks++;
 console.log(`${checks} saved look checks passed.`);
}finally{await rm(temp,{recursive:true,force:true});}
