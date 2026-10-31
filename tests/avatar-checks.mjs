import assert from 'node:assert/strict';
import {Box3} from 'three';
import {makeAvatar,disposeObject,wardrobe} from '../lib/avatar.ts';
const standard={height:168,bust:86,waist:70,hip:94};
let meshes=0;
for(const look of wardrobe)for(const body of [standard,{height:140,bust:65,waist:50,hip:70},{height:200,bust:130,waist:125,hip:140}]){
 const avatar=makeAvatar({body,kind:look.id,color:look.color,skin:'#cda78b',ease:1});
 avatar.traverse(o=>{if(o.isMesh){meshes++;const positions=o.geometry.getAttribute('position').array;for(const value of positions)assert.ok(Number.isFinite(value),'finite mesh coordinate');}});
 const bounds=new Box3().setFromObject(avatar);assert.ok(bounds.max.y>body.height/100*.95&&bounds.max.y<body.height/100*1.1,'height follows supplied dimensions');assert.ok(bounds.max.x-bounds.min.x<1.2,'bounded width');disposeObject(avatar);
}
const a=makeAvatar({body:standard,kind:'knit',color:'#89987c',skin:'#cda78b',ease:0});
const b=makeAvatar({body:{...standard,bust:120},kind:'knit',color:'#89987c',skin:'#cda78b',ease:2});
assert.ok(new Box3().setFromObject(b).max.x>new Box3().setFromObject(a).max.x,'body and clothing actually widen');disposeObject(a);disposeObject(b);
console.log(`3D geometry verified: four outfits, three body ranges, ${meshes} finite meshes, height/width response.`);
