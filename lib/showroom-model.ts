import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";

export type ShowroomGender = "male" | "female";
export type ShowroomMeasurements = { height: number; bust: number; waist: number; hip: number; shoulderWidth: number; armLength: number; inseam: number; thigh: number; calf: number; neck: number };
export type ShowroomGarment = { kind: "shirt" | "coat" | "dress" | "hoodie" | "pants"; color: string };
export const showroomDefaults: Record<ShowroomGender, ShowroomMeasurements> = {
  female: { height: 168, bust: 86, waist: 68, hip: 94, shoulderWidth: 38, armLength: 55, inseam: 78, thigh: 52, calf: 34, neck: 32 },
  male: { height: 180, bust: 96, waist: 78, hip: 96, shoulderWidth: 44, armLength: 61, inseam: 83, thigh: 55, calf: 37, neck: 38 },
};
export const showroomLimits: Record<keyof ShowroomMeasurements, [number, number]> = {
  height: [140, 205], bust: [65, 135], waist: [50, 125], hip: [70, 140], shoulderWidth: [30, 56], armLength: [42, 75], inseam: [60, 105], thigh: [35, 80], calf: [25, 55], neck: [26, 48],
};
export const showroomLabels: Record<keyof ShowroomMeasurements, string> = {
  height: "身高", bust: "胸围", waist: "腰围", hip: "臀围", shoulderWidth: "肩宽", armLength: "臂长", inseam: "内侧腿长", thigh: "大腿围", calf: "小腿围", neck: "颈围",
};
// Aliases make these metadata usable by forms without coupling to the renderer.
export const measurementDefaults = showroomDefaults;
export const measurementLimits = showroomLimits;
export const measurementLabels = showroomLabels;

const assetNames = { shirt: "clothing_shirt", coat: "clothing_trenchcoat", dress: "clothing_dress", hoodie: "clothing_hoodie", pants: "clothing_jeans" } as const;
const loader = new GLTFLoader();
const cache = new Map<string, Promise<THREE.Group>>();
function load(name: string) {
  if (!cache.has(name)) cache.set(name, loader.loadAsync(new URL(`./models/${name}.glb`, document.baseURI).href).then(g => g.scene).catch(error => { cache.delete(name); throw error; }));
  return cache.get(name)!;
}
type Surface = { mesh: THREE.Mesh; rest: Float32Array; arms: Float32Array; index: number[]; kind: "body" | "head" | ShowroomGarment["kind"] };
type State = { gender: ShowroomGender; surfaces: Surface[]; sourceHeight: number; shoulderY: number; shoulderX: number; crotchY: number; headBottom: number; disposed: boolean };
const states = new WeakMap<THREE.Group, State>();
const clamp = THREE.MathUtils.clamp;
const smooth = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b);
const mix = THREE.MathUtils.lerp;

function aim(part: THREE.Object3D, boneName: string, childName: string, target: THREE.Vector3) {
  const bone = part.getObjectByName(boneName), child = part.getObjectByName(childName);
  if (!bone?.parent || !child) return;
  part.updateMatrixWorld(true);
  const from = child.getWorldPosition(new THREE.Vector3()).sub(bone.getWorldPosition(new THREE.Vector3())).normalize();
  const world = bone.getWorldQuaternion(new THREE.Quaternion()).premultiply(new THREE.Quaternion().setFromUnitVectors(from, target.normalize()));
  bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world));
  part.updateMatrixWorld(true);
}

function prepare(asset: THREE.Group, gender: ShowroomGender) {
  const part = clone(asset);
  part.traverse(object => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh || !mesh.morphTargetInfluences || !mesh.morphTargetDictionary) return;
    mesh.morphTargetInfluences.fill(0);
    for (const [name, weight] of [[`gender_${gender}`, 1], ["proportions_ideal", .24]] as const) {
      const index = mesh.morphTargetDictionary[name]; if (index !== undefined) mesh.morphTargetInfluences[index] = weight;
    }
  });
  for (const [side, sign] of [["l", 1], ["r", -1]] as const) {
    aim(part, `upperarm_${side}`, `lowerarm_${side}`, new THREE.Vector3(sign * .34, -1, .02));
    aim(part, `lowerarm_${side}`, `hand_${side}`, new THREE.Vector3(sign * .13, -1, .10));
  }
  part.updateMatrixWorld(true);
  part.traverse(object => { if ((object as THREE.SkinnedMesh).isSkinnedMesh) (object as THREE.SkinnedMesh).skeleton.update(); });
  return part;
}

// Remove small anatomical detail from the neutral sculpt while retaining its overall silhouette.
// This is performed only once on immutable source vertices, never incrementally on slider updates.
function softenRetailSurface(rest: Float32Array, indices: number[], height: number, gender: ShowroomGender) {
  const count = rest.length / 3, neighbors = Array.from({ length: count }, () => new Set<number>());
  for (let k = 0; k < indices.length; k += 3) { const [a, b, c] = indices.slice(k, k + 3); neighbors[a].add(b).add(c); neighbors[b].add(a).add(c); neighbors[c].add(a).add(b); }
  const weights = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const x = Math.abs(rest[i * 3]), t = rest[i * 3 + 1] / height, z = rest[i * 3 + 2];
    const bustDetail = smooth(.055, .075, x) * (1 - smooth(.15, .19, x)) * smooth(.68, .705, t) * (1 - smooth(.775, .8, t)) * smooth(.015, .06, z);
    const crotchDetail = (1 - smooth(.045, .10, x)) * smooth(.43, .46, t) * (1 - smooth(.535, .56, t)) * smooth(-.025, .015, z);
    const shoulderBlend = smooth(.055, .09, x) * (1 - smooth(.22, .28, x)) * smooth(.78, .81, t) * (1 - smooth(.845, .87, t));
    weights[i] = Math.max(bustDetail, crotchDetail * .94, shoulderBlend * .55);
  }
  for (let pass = 0; pass < 38; pass++) {
    const previous = rest.slice();
    for (let i = 0; i < count; i++) {
      const weight = weights[i]; if (weight < .001 || !neighbors[i].size) continue;
      let x = 0, y = 0, z = 0;
      for (const n of neighbors[i]) { x += previous[n * 3]; y += previous[n * 3 + 1]; z += previous[n * 3 + 2]; }
      const n = neighbors[i].size;
      const t = previous[i * 3 + 1] / height;
      const planarWeight = t > .66 && t < .80 ? 0 : weight;
      rest[i * 3] = mix(previous[i * 3], x / n, planarWeight);
      rest[i * 3 + 1] = mix(previous[i * 3 + 1], y / n, planarWeight);
      rest[i * 3 + 2] = mix(previous[i * 3 + 2], z / n, weight);
    }
  }

}

function whiteMaterial() { return new THREE.MeshPhysicalMaterial({ color: "#f5f3ee", roughness: .43, metalness: 0, clearcoat: .12, clearcoatRoughness: .52 }); }

/** Bakes the licensed anatomical mesh once. Later measurements always start from these neutral vertices. */
export async function createShowroomModel(gender: ShowroomGender): Promise<THREE.Group> {
  const kinds = Object.keys(assetNames) as ShowroomGarment["kind"][];
  const assets = await Promise.all([load("base_body"), ...kinds.map(k => load(assetNames[k]))]);
  const parts = assets.map(asset => prepare(asset, gender));
  const root = new THREE.Group(); root.name = "white-showroom-mannequin"; root.userData.gender = gender;
  const bodyMesh = parts[0].getObjectByName("Body") as THREE.Mesh;
  if (!bodyMesh?.isMesh) throw new Error("人体模型缺少 Body 网格");
  const bodyBox = new THREE.Box3().setFromObject(bodyMesh, true);
  const sourceHeight = bodyBox.max.y - bodyBox.min.y;
  const floor = bodyBox.min.y;
  const state: State = { gender, surfaces: [], sourceHeight, shoulderY: sourceHeight * .815, shoulderX: sourceHeight * .112, crotchY: sourceHeight * .475, headBottom: sourceHeight * .875, disposed: false };
  states.set(root, state);
  const vertex = new THREE.Vector3();
  parts.forEach((part, partIndex) => {
    const kind: Surface["kind"] = partIndex === 0 ? "body" : kinds[partIndex - 1];
    part.traverse(object => {
      const original = object as THREE.SkinnedMesh;
      if (!original.isMesh || (kind === "body" && object.name !== "Body")) return;
      const count = original.geometry.getAttribute("position").count;
      const rest = new Float32Array(count * 3), arms = new Float32Array(count);
      const skinIndex = original.geometry.getAttribute("skinIndex"), skinWeight = original.geometry.getAttribute("skinWeight");
      for (let i = 0; i < count; i++) {
        original.getVertexPosition(i, vertex).applyMatrix4(original.matrixWorld); vertex.y -= floor;
        if (kind === "body" && vertex.y / sourceHeight > .825 && Math.abs(vertex.x) < sourceHeight * .085) {
          const taper = 1 - .75 * smooth(.825, .86, vertex.y / sourceHeight);
          vertex.x *= taper; vertex.z = .016 + (vertex.z - .016) * taper;
        }
        rest.set(vertex.toArray(), i * 3);
        if (original.isSkinnedMesh && skinIndex && skinWeight) {
          for (let n = 0; n < 4; n++) {
            const bone = original.skeleton.bones[skinIndex.getComponent(i, n)];
            if (bone && /upperarm|lowerarm|hand|thumb|index|middle|ring|pinky/i.test(bone.name)) arms[i] += skinWeight.getComponent(i, n);
          }
        }
      }
      const originalIndex = original.geometry.index;
      const indices = originalIndex ? Array.from(originalIndex.array) : Array.from({ length: count }, (_, i) => i);
      if (kind === "body") softenRetailSurface(rest, indices, sourceHeight, gender);
      // Remove all facial anatomy rather than merely painting eyes white. A continuous featureless shell replaces it.
      const index = kind === "body" ? indices.filter((_, i) => {
        const start = i - i % 3;
        return !indices.slice(start, start + 3).some(v => rest[v * 3 + 1] > state.headBottom);
      }) : indices;
      const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.BufferAttribute(rest.slice(), 3)); geometry.setIndex(index); geometry.computeVertexNormals();
      const material = kind === "body" ? whiteMaterial() : new THREE.MeshPhysicalMaterial({ color: "#c8b9a2", roughness: .88, sheen: .22, sheenRoughness: .85, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geometry, material); mesh.name = `showroom-${kind}`; mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; mesh.visible = kind === "body";
      root.add(mesh); state.surfaces.push({ mesh, rest, arms, index, kind });
    });
  });
  // Lathed head: narrow chin, gently fuller cranium, no ears, nose, eyes or hair.
  const h = sourceHeight;
  const points = [[.055, .812], [.052, .829], [.044, .851], [.045, .871], [.057, .893], [.069, .922], [.071, .944], [.065, .968], [.052, .985], [.032, .996], [0, 1]].map(([radius, y]) => new THREE.Vector2(radius * h / 1.68, y * h));
  const curve = new THREE.SplineCurve(points);
  const headGeometry = new THREE.LatheGeometry(curve.getPoints(48), 64);
  const head = new THREE.Mesh(headGeometry, whiteMaterial()); head.position.z = .016; head.updateMatrix(); head.geometry.applyMatrix4(head.matrix); head.position.z = 0;
  head.name = "featureless-head"; head.castShadow = true; root.add(head);
  const hp = head.geometry.getAttribute("position"); state.surfaces.push({ mesh: head, rest: new Float32Array(hp.array), arms: new Float32Array(hp.count), index: Array.from(head.geometry.index!.array), kind: "head" });
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(.46, .018, .37), new THREE.MeshStandardMaterial({ color: "#292c2a", roughness: .45, metalness: .22 }));
  pedestal.position.set(0, -.012, .015); pedestal.name = "showroom-pedestal"; pedestal.receiveShadow = true; root.add(pedestal);
  updateShowroomModel(root, showroomDefaults[gender], []);
  return root;
}

/** Measurement-driven proportion preview, not a tailoring/cloth-physics or size-prediction system. */
export function updateShowroomModel(root: THREE.Group, body: ShowroomMeasurements, garments: ShowroomGarment[]): void {
  const state = states.get(root); if (!state || state.disposed) return;
  const defaults = showroomDefaults[state.gender];
  const m = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof ShowroomMeasurements)[]) { const value = body[key]; m[key] = clamp(Number.isFinite(value) ? value : defaults[key], ...showroomLimits[key]); }
  // Keep valid anatomical segment ordering even when sliders are at incompatible extremes.
  const height = m.height / 100, legY = clamp(m.inseam / 100, height * .37, height * .57);
  const shoulderY = height - .29, neckY = height - .235;
  const source = state.sourceHeight, crotch = state.crotchY;
  const upperScale = (shoulderY - legY) / (state.shoulderY - crotch);
  const mapY = (y: number) => y < crotch ? y * legY / crotch : y < state.shoulderY ? legY + (y - crotch) * upperScale : shoulderY + (y - state.shoulderY) * (height - shoulderY) / (source - state.shoulderY);
  const shoulderRatio = m.shoulderWidth / defaults.shoulderWidth;
  const armRatio = m.armLength / defaults.armLength;
  const active = new Map(garments.map(g => [g.kind, g.color]));
  // One outer upper garment at a time keeps nested meshes from intersecting.
  const top = (["coat", "hoodie", "dress", "shirt"] as const).find(k => active.has(k));
  for (const surface of state.surfaces) {
    const { mesh, rest, arms, kind } = surface;
    mesh.visible = kind === "body" || kind === "head" || (kind === "pants" ? active.has("pants") && top !== "dress" : kind === top);
    if (kind !== "body" && kind !== "head") (mesh.material as THREE.MeshPhysicalMaterial).color.set(active.get(kind) || "#c8b9a2");
    const p = mesh.geometry.getAttribute("position");
    for (let i = 0; i < p.count; i++) {
      const x = rest[i * 3], y = rest[i * 3 + 1], z = rest[i * 3 + 2], t = y / source;
      let ratio = m.hip / defaults.hip;
      if (t > .57) ratio = mix(m.waist / defaults.waist, m.bust / defaults.bust, smooth(.62, .76, t));
      else if (t > .50) ratio = mix(m.hip / defaults.hip, m.waist / defaults.waist, smooth(.50, .62, t));
      if (t > .78) ratio = mix(ratio, shoulderRatio, smooth(.78, .83, t));
      if (t > .835) ratio = mix(shoulderRatio, m.neck / defaults.neck, smooth(.835, .865, t));
      if (t > .89) ratio = 1;
      if (kind === "head") ratio = mix(m.neck / defaults.neck, 1, smooth(.855, .895, t));
      let nx = x * ratio, ny = mapY(y), nz = z * ratio;
      if (t < .49) {
        const center = Math.sign(x) * (.10 + .08 * (1 - smooth(.06, .49, t)));
        const thighRatio = m.thigh / defaults.thigh, calfRatio = m.calf / defaults.calf;
        const limbRatio = mix(1, mix(calfRatio, thighRatio, smooth(.27, .40, t)), smooth(.04, .15, t));
        nx = center * m.hip / defaults.hip + (x - center) * limbRatio; nz = z * limbRatio;
        // A dress/coat hem is one connected fabric panel; keep it continuous across both legs.
        if (kind === "dress" || kind === "coat") { nx = x * m.hip / defaults.hip; nz = z * m.hip / defaults.hip; }
      }
      const arm = smooth(.12, .85, arms[i]);
      if (arm > 0) {
        const sign = Math.sign(x), anchor = sign * state.shoulderX;
        const armX = anchor * shoulderRatio + (x - anchor) * Math.sqrt(armRatio);
        const armY = shoulderY + (y - state.shoulderY) * armRatio;
        nx = mix(nx, armX, arm); ny = mix(ny, armY, arm); nz = mix(nz, z * Math.sqrt(armRatio), arm);
      }
      // A small fabric allowance keeps the illustrative garment outside the white body.
      if (kind !== "body" && kind !== "head") { nx *= 1.018; nz *= 1.025; }
      p.setXYZ(i, nx, ny, nz);
    }
    p.needsUpdate = true;
    if (kind === "body") {
      const hidden = (v: number) => {
        const t = rest[v * 3 + 1] / source, arm = arms[v];
        if (top && arm > .5 && t > .52 && t < .83) return true;
        if (top && arm < .35 && t > (top === "dress" ? .32 : .54) && t < .823) return true;
        if (active.has("pants") && arm < .35 && t > .06 && t < .60) return true;
        return false;
      };
      const visible: number[] = [];
      for (let k = 0; k < surface.index.length; k += 3) { const a = surface.index[k], b = surface.index[k + 1], c = surface.index[k + 2]; if (!(hidden(a) && hidden(b) && hidden(c))) visible.push(a, b, c); }
      mesh.geometry.setIndex(visible);
    }
    mesh.geometry.computeVertexNormals(); mesh.geometry.computeBoundingBox(); mesh.geometry.computeBoundingSphere();
  }
  root.userData.measurements = { ...m }; root.userData.previewOnly = true; root.userData.neckY = neckY;
  root.updateMatrixWorld(true);
}

export function disposeShowroomModel(root: THREE.Group): void {
  const state = states.get(root); if (state?.disposed) return; if (state) state.disposed = true;
  root.traverse(object => { const mesh = object as THREE.Mesh; if (mesh.isMesh) { mesh.geometry.dispose(); (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(material => material.dispose()); } });
  states.delete(root);
}
