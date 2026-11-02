import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import type { AvatarOptions, LookKind } from "./avatar";

const loader = new GLTFLoader();
const cache = new Map<string, Promise<THREE.Group>>();
const garments: Record<LookKind, string[]> = {
  tailored: ["trenchcoat", "tshirt", "jeans", "boots"],
  knit: ["shirt", "jeans", "shoes"],
  skirt: ["dress", "boots"],
  sport: ["hoodie", "jeans", "shoes"],
};
function load(name: string) {
  if (!cache.has(name)) cache.set(name, loader.loadAsync(new URL(`./models/${name}.glb`, document.baseURI).href).then(g => g.scene).catch(e => { cache.delete(name); throw e; }));
  return cache.get(name)!;
}
export async function createRetailModel(kind: LookKind, gender: "male" | "female" = "female") {
  const names = ["base_body", ...garments[kind].map(n => `clothing_${n}`), gender === "male" ? "hair_short04" : "hair_long01"];
  // Show the assembled, dressed figure only after every garment has loaded.
  const assets = await Promise.all(names.map(load));
  const root = new THREE.Group(); root.name = "retail-mannequin"; root.userData.kind = kind; root.userData.gender = gender;
  assets.forEach((asset, i) => {
    const part = clone(asset); part.userData.part = names[i];
    part.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true; object.receiveShadow = true; object.frustumCulled = false;
      const originals = Array.isArray(object.material) ? object.material : [object.material];
      const materials = originals.map(old => {
        if (i === 0 || names[i].startsWith("hair_")) { const material=old.clone() as THREE.MeshStandardMaterial; material.roughness=names[i].startsWith("hair_")?.75:.72; material.metalness=0; if(names[i].startsWith("hair_")){material.side=THREE.DoubleSide;material.alphaTest=.35;material.depthWrite=true;} return material; }
        const source = old as THREE.MeshStandardMaterial;
        const material = new THREE.MeshPhysicalMaterial({ map: names[i] === "clothing_jeans" ? null : source.map, normalMap: source.normalMap, roughnessMap: source.roughnessMap, roughness: .84, sheen: .3, sheenRoughness: .8, sheenColor: new THREE.Color("#ded4c4"), side: THREE.DoubleSide });
        return material;
      });
      object.material = Array.isArray(object.material) ? materials : materials[0];
      if(names[i]==="clothing_trenchcoat"){
        const g=object.geometry.clone(),pos=g.getAttribute('position');
        for(let v=0;v<pos.count;v++){if(pos.getY(v)>=.95)continue;pos.setY(v,.95-(.95-pos.getY(v))*.68);for(const morph of g.morphAttributes.position||[])morph.setY(v,morph.getY(v)*.68);}
        pos.needsUpdate=true;g.computeVertexNormals();object.geometry=g;object.userData.ownGeometry=true;
      }

      object.userData.part = names[i];
      if (/Teeth|Tongue/i.test(object.name)) object.visible = false;
      if (i === 0 && /^(Body|base_body)$/i.test(object.name)) {
        // Hide the covered body. The displayed surface belongs to the garment,
        // preventing accidental skin exposure or clipping while morphs change.
        const geometry = object.geometry.clone(), position = geometry.getAttribute("position"), index = geometry.index;
        if (index) {
          const keep: number[] = [];
          const hidden = (v: number) => { const x = Math.abs(position.getX(v)), y = position.getY(v); return (y > .60 && y < 1.36 && x < .245) || (kind !== "skirt" && y < .9 && y > .08); };
          for (let k = 0; k < index.count; k += 3) { const a=index.getX(k),b=index.getX(k+1),c=index.getX(k+2); if (!(hidden(a)&&hidden(b)&&hidden(c))) keep.push(a,b,c); }
          geometry.setIndex(keep);
        }
        object.geometry = geometry; object.userData.ownGeometry = true;
      }
    });
    part.updateMatrixWorld(true);
    for(const [name,angle] of [["upperarm_l",-.52],["upperarm_r",.48]] as const){
      const bone=part.getObjectByName(name);if(!bone||!bone.parent)continue;
      const q=bone.getWorldQuaternion(new THREE.Quaternion());q.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),angle));
      bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));part.updateMatrixWorld(true);
    }
    root.add(part);
  });
  return root;
}
export function updateRetailModel(root: THREE.Group, options: AvatarOptions) {
  const girth = (options.body.bust / 86 + options.body.waist / 70 + options.body.hip / 94) / 3;
  root.scale.set(1, options.body.height / 166, 1);
  root.children.forEach(part=>{const factor=part.userData.part === "base_body"?1:1+(options.ease-1)*.008;part.scale.x=factor;part.scale.z=factor;});
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const mesh = object as THREE.SkinnedMesh;
    if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
      mesh.morphTargetInfluences.fill(0);
      const values: Record<string, number> = { gender_female: options.modelGender === "male" ? 0 : 1, gender_male: options.modelGender === "male" ? 1 : 0, weight_max: Math.max(0, Math.min(.7,(girth-1)*1.8)), weight_min: Math.max(0, Math.min(.45,(1-girth)*2)), proportions_ideal: .3 };
      Object.entries(values).forEach(([key,value]) => { const index=mesh.morphTargetDictionary![key]; if(index!==undefined)mesh.morphTargetInfluences![index]=value; });
    }
    const part: string = object.userData.part || "";
    const mats = Array.isArray(object.material) ? object.material : [object.material];
    mats.forEach(m => {
      const material = m as THREE.MeshPhysicalMaterial;
      if (part === "base_body") { if (/^Body$/i.test(object.name)) material.color.set(options.skin); }
      else if (part.startsWith("hair_")) material.color.set("#332921");
      else if (/jacket|trenchcoat|shirt|hoodie|dress/.test(part) && part !== "clothing_tshirt") material.color.set(options.color);
      else material.color.set(part === "clothing_tshirt" ? "#e5dfd4" : part === "clothing_jeans" ? (options.bottomColor||"#343331") : "#332c28");
    });
  });
  // Girth is a visual morph only; no real garment size is inferred.
  root.updateMatrixWorld(true);
}
export function disposeRetailModel(root: THREE.Object3D) {
  root.traverse(o => { if (o instanceof THREE.Mesh) { if(o.userData.ownGeometry)o.geometry.dispose(); (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose()); } });
}
