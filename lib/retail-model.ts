import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import type { AvatarOptions, LookKind } from "./avatar";

const loader = new GLTFLoader();
const cache = new Map<string, Promise<THREE.Group>>();
const garments: Record<LookKind, string[]> = {
  tailored: ["jacket", "tshirt", "jeans", "shoes"],
  knit: ["shirt", "jeans", "shoes"],
  skirt: ["dress", "shoes"],
  sport: ["hoodie", "jeans", "shoes"],
};
function load(name: string) {
  if (!cache.has(name)) cache.set(name, loader.loadAsync(new URL(`./models/${name}.glb`, document.baseURI).href).then(g => g.scene).catch(e => { cache.delete(name); throw e; }));
  return cache.get(name)!;
}
export async function createRetailModel(kind: LookKind) {
  const names = ["base_body", ...garments[kind].map(n => `clothing_${n}`)];
  // Show the assembled, dressed figure only after every garment has loaded.
  const assets = await Promise.all(names.map(load));
  const root = new THREE.Group(); root.name = "retail-mannequin"; root.userData.kind = kind;
  assets.forEach((asset, i) => {
    const part = clone(asset); part.userData.part = names[i];
    part.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true; object.receiveShadow = true; object.frustumCulled = false;
      const originals = Array.isArray(object.material) ? object.material : [object.material];
      const materials = originals.map(old => {
        if (i === 0) return new THREE.MeshPhysicalMaterial({ color: "#dfd7c8", roughness: .34, metalness: .04, clearcoat: .15 });
        const source = old as THREE.MeshStandardMaterial;
        const material = new THREE.MeshPhysicalMaterial({ map: source.map, normalMap: source.normalMap, roughnessMap: source.roughnessMap, roughness: .84, sheen: .3, sheenRoughness: .8, sheenColor: new THREE.Color("#ded4c4"), side: THREE.DoubleSide });
        return material;
      });
      object.material = Array.isArray(object.material) ? materials : materials[0];
      object.userData.part = names[i];
      if (/Eyebrow|Eyelash|Teeth|Tongue/i.test(object.name)) object.visible = false;
      if (i === 0 && /base/i.test(object.name)) {
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
    for(const [name,angle] of [["upperarm_l",-.48],["upperarm_r",.48]] as const){
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
      const values: Record<string, number> = { gender_female: .65, weight_max: Math.max(0, Math.min(.7,(girth-1)*1.8)), weight_min: Math.max(0, Math.min(.45,(1-girth)*2)), proportions_ideal: .15 };
      Object.entries(values).forEach(([key,value]) => { const index=mesh.morphTargetDictionary![key]; if(index!==undefined)mesh.morphTargetInfluences![index]=value; });
    }
    const part: string = object.userData.part || "";
    const mats = Array.isArray(object.material) ? object.material : [object.material];
    mats.forEach(m => {
      const material = m as THREE.MeshPhysicalMaterial;
      if (part === "base_body") material.color.set(options.skin === "#cda78b" ? "#e0d8cb" : options.skin);
      else if (/jacket|shirt|hoodie|dress/.test(part) && part !== "clothing_tshirt") material.color.set(options.color);
      else material.color.set(part === "clothing_tshirt" ? "#e5dfd4" : part === "clothing_jeans" ? "#3c4b5c" : "#4b433b");
    });
  });
  // Girth is a visual morph only; no real garment size is inferred.
  root.updateMatrixWorld(true);
}
export function disposeRetailModel(root: THREE.Object3D) {
  root.traverse(o => { if (o instanceof THREE.Mesh) { if(o.userData.ownGeometry)o.geometry.dispose(); (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose()); } });
}
