import assert from 'node:assert/strict';
import {build} from 'vite';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const temp=await mkdtemp(join(tmpdir(),'yihe-stylist-'));
try{
 await build({configFile:false,logLevel:'silent',build:{outDir:temp,emptyOutDir:false,lib:{entry:'lib/stylist.ts',formats:['es'],fileName:()=> 'stylist.mjs'}}});
 const {advise,selectProducts}=await import(pathToFileURL(join(temp,'stylist.mjs')));
 const p={height:'168',weight:'58',bust:'86',waist:'70',hip:'94',face:'不确定',hair:'',appearance:'',fit:'合身',presentation:'不限'};
 const f={budget:800,styles:['温柔清新'],occasion:'日常通勤',season:'春秋',colors:'中性色',avoid:''};
 const a=advise('预算500到900元，男装，周末出游，不穿裙子',p,f);
 assert.equal(a.prefs.budget,900);assert.equal(a.profile.presentation,'男装');assert.equal(a.prefs.occasion,'周末出游');assert.equal(a.prefs.avoid,'裙子');assert.equal(f.avoid,'');assert.equal(p.presentation,'不限');
 assert.ok(selectProducts(a.profile,a.prefs).every(x=>x.gender.includes('男')||x.gender.includes('中性')));
 const b=advise('身高172，体重120斤，腰围72',p,f);assert.equal(b.profile.weight,'60');assert.equal(b.profile.height,'172');assert.equal(b.profile.waist,'72');
 const c=advise('身高999，体重999',p,f);assert.equal(c.profile.height,'168');assert.equal(c.profile.weight,'58');assert.match(c.text,/暂未写入/);
 const d=advise('不接受明显褶皱',p,f);assert.ok(selectProducts(d.profile,d.prefs).every(x=>x.fabric!=='亚麻'));
 assert.equal(advise('我想查看精选衣橱',p,f).action,'catalog');assert.equal(advise('打开附近好店',p,f).action,'stores');assert.equal(advise('3D人台',p,f).action,'studio');assert.match(advise('羊绒测评',p,f).text,/历史/);
 assert.equal(advise('预算100元',p,f).prefs.budget,200);assert.equal(advise('想便宜一点',p,f).prefs.budget,640);
 console.log('20 stylist checks passed: state extraction, units, invalid inputs, exclusion, navigation, source scope.');
}finally{await rm(temp,{recursive:true,force:true});}
