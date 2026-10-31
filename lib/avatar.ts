import * as THREE from "three";

export type Body = { height: number; bust: number; waist: number; hip: number };
export type LookKind = "tailored" | "knit" | "skirt" | "sport";
export type AvatarOptions = { body: Body; kind: LookKind; color: string; skin: string; ease: number };
export const wardrobe: { id: LookKind; title: string; subtitle: string; tag: string; color: string; bottom: string; style: string }[] = [
  { id: "tailored", title: "都市的从容", subtitle: "西装外套 / 直筒长裤", tag: "CITY ESSENTIALS", color: "#626c80", bottom: "#444c5f", style: "简约通勤" },
  { id: "knit", title: "把周末放慢", subtitle: "落肩针织 / 奶油长裤", tag: "SLOW WEEKEND", color: "#89987c", bottom: "#e5ddd0", style: "松弛休闲" },
  { id: "skirt", title: "午后的浪漫", subtitle: "短袖上衣 / 百褶半裙", tag: "A LITTLE ROMANCE", color: "#b77766", bottom: "#b77766", style: "法式复古" },
  { id: "sport", title: "自由地出发", subtitle: "连帽卫衣 / 束脚长裤", tag: "OFF DUTY", color: "#aaa0c1", bottom: "#454753", style: "街头运动" },
];

type Ring = [number, number, number]; // height, horizontal radius, depth radius
export function makeAvatar(options: AvatarOptions) {
  const { body, kind, color, skin, ease } = options;
  const root = new THREE.Group();
  root.name = "dressed-avatar";
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const mat = (c: string, roughness = .83) => {
    const key = `${c}/${roughness}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color: c, roughness, side: THREE.DoubleSide }));
    return materials.get(key)!;
  };
  const add = (geometry: THREE.BufferGeometry, c: string, pos = [0, 0, 0], scale = [1, 1, 1], roughness = .83) => {
    const mesh = new THREE.Mesh(geometry, mat(c, roughness));
    mesh.position.set(pos[0], pos[1], pos[2]); mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh); return mesh;
  };
  const ellipsoid = (x: number, y: number, z: number, sx: number, sy: number, sz: number, c: string) => add(new THREE.SphereGeometry(1, 32, 24), c, [x, y, z], [sx, sy, sz]);
  const limb = (a: number[], b: number[], ra: number, rb: number, c: string) => {
    const start = new THREE.Vector3(...a as [number, number, number]), end = new THREE.Vector3(...b as [number, number, number]);
    const d = end.clone().sub(start);
    const mesh = add(new THREE.CylinderGeometry(rb, ra, d.length(), 32, 1), c);
    mesh.position.copy(start.add(end).multiplyScalar(.5)); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return mesh;
  };
  // Smooth surfaces of revolution. Pleats are actual geometry, visible from all sides.
  const surface = (rings: Ring[], c: string, pleats = 0, cx = 0, cz = 0) => {
    const curve = new THREE.CatmullRomCurve3(rings.map(([y, x, z]) => new THREE.Vector3(x, y, z)), false, "catmullrom", .25);
    const vertices: number[] = [], uv: number[] = [], indices: number[] = [];
    const rows = 56, cols = 96;
    for (let j = 0; j <= rows; j++) {
      const p = curve.getPoint(j / rows);
      for (let i = 0; i <= cols; i++) {
        const a = i / cols * Math.PI * 2;
        const wave = 1 + pleats * Math.sin(a * 24) * (1 - j / rows * .7);
        vertices.push(cx + Math.cos(a) * p.x * wave, p.y, cz + Math.sin(a) * p.z * wave); uv.push(i / cols, j / rows);
        if (j < rows && i < cols) { const k = j * (cols + 1) + i; indices.push(k, k + cols + 1, k + 1, k + 1, k + cols + 1, k + cols + 2); }
      }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(indices); geo.computeVertexNormals();
    return add(geo, c);
  };
  const seam = (points: number[][], c: string, radius = .0017) => {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p as [number, number, number])));
    return add(new THREE.TubeGeometry(curve, 32, radius, 5, false), c);
  };
  let projectFront = (x: number, y: number, z: number) => [x,y,z];
  let patchLayer=0;
  const patch = (points: number[][], c: string) => {
    const offset=++patchLayer*.002;
    const contour=points.map(p=>new THREE.Vector2(p[0],p[1]));
    const triangles=THREE.ShapeUtils.triangulateShape(contour,[]), vertices:number[]=[];
    const steps=12;
    for(const [ia,ib,ic] of triangles){
      const a=points[ia],b=points[ib],c=points[ic];
      const point=(u:number,v:number)=>{const p=projectFront(a[0]+(b[0]-a[0])*u+(c[0]-a[0])*v,a[1]+(b[1]-a[1])*u+(c[1]-a[1])*v,0);p[2]+=offset;return p;};
      for(let i=0;i<steps;i++)for(let j=0;j<steps-i;j++){
        vertices.push(...point(i/steps,j/steps),...point((i+1)/steps,j/steps),...point(i/steps,(j+1)/steps));
        if(i+j<steps-1)vertices.push(...point((i+1)/steps,j/steps),...point((i+1)/steps,(j+1)/steps),...point(i/steps,(j+1)/steps));
      }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();return add(geo,c);
  };
  const chest = body.bust / 520, waist = body.waist / 520, hip = body.hip / 520;
  const shoulder = Math.max(chest * 1.15, .185);
  const loose = .012 + ease * .017;
  const upper = color, lower = wardrobe.find(x => x.id === kind)!.bottom;
  const shoe = kind === "tailored" || kind === "skirt" ? "#35322f" : "#f6f1e8";
  // A deliberately stylised dress-form: no face reconstruction or fit estimation.
  // Omit the covered torso to prevent skin penetrating the illustrative garments.
  limb([0,1.43,0], [0,1.56,0], .048, .047, skin);
  ellipsoid(0,1.64,.005,.086,.119,.08,skin);
  ellipsoid(0,1.61,.079,.013,.021,.017,skin);
  for (const side of [-1,1]) ellipsoid(side*.082,1.632,0,.013,.024,.015,skin);
  // Sculpted cap and chignon, with a clean side part.
  const hair = add(new THREE.SphereGeometry(1,40,24,0,Math.PI*2,0,Math.PI*.49), "#39322f", [0,1.657,-.009],[.091,.112,.086]); hair.rotation.x=-.16;
  ellipsoid(0,1.66,-.074,.075,.08,.038,"#39322f");
  ellipsoid(0,1.63,-.112,.043,.046,.036,"#39322f");
  const bottomY = kind === "sport" ? .99 : kind === "knit" ? 1.01 : kind === "skirt" ? 1.065 : .92;
  const outerChest = chest + loose, outerWaist = waist + loose;
  // Legs, arms and hands share the same dimensions with all wardrobe variants.
  for (const side of [-1,1]) {
    const x = side * hip * .49;
    if(kind === "skirt") {
    limb([x,.88,0],[side*.105,.51,.012],.078,.051,skin);
    ellipsoid(side*.105,.51,.012,.050,.052,.050,skin);
    limb([side*.105,.51,.012],[side*.115,.12,0],.048,.031,skin);
    }
    const sh = [side*shoulder,1.39,0], elbow = [side*(shoulder+.061),1.13,.01], wrist = [side*(shoulder+.091),.91,.035];
    limb(sh,elbow,.052,.039,skin); ellipsoid(elbow[0],elbow[1],elbow[2],.039,.040,.039,skin); limb(elbow,wrist,.039,.026,skin);
    ellipsoid(wrist[0],.865,.04,.031,.061,.020,skin);
    ellipsoid(side*.115,.064,.055,.055,.046,.116,shoe);
    ellipsoid(side*.115,.035,.056,.058,.014,.117,kind === "tailored" || kind === "skirt" ? "#1d1c1b" : "#d9d6cf");
    // Soft sleeve sections meet at a rounded elbow; short sleeve for the skirt set.
    const sleeveColor = kind === "skirt" ? "#efe9da" : upper;
    const sleeveR = .057 + ease*.009;
    ellipsoid(sh[0],sh[1]-.011,0,sleeveR,sleeveR,sleeveR,sleeveColor);
    if (kind === "skirt") {
      const end = [side*(shoulder+.028),1.26,.006]; limb(sh,end,sleeveR,sleeveR*.85,sleeveColor);
    } else {
      limb(sh,elbow,sleeveR,sleeveR*.82,sleeveColor); ellipsoid(elbow[0],elbow[1],elbow[2],sleeveR*.82,sleeveR*.85,sleeveR*.82,sleeveColor);
      const end = [side*(shoulder+.083),.965,.028]; limb(elbow,end,sleeveR*.82,kind === "sport" ? .037 : sleeveR*.68,sleeveColor);
      limb(end,[side*(shoulder+.087),.935,.031],kind === "sport" ? .037 : sleeveR*.68,.035,sleeveColor);
    }
    if (kind !== "skirt") {
      const legR = hip*.49 + loose*.10;
      // Each continuous trouser leg blends into half of the waist ellipse.
      // Shared inner walls avoid a separate pelvis mesh or visible overlap at the crotch.
      const profile=new THREE.CatmullRomCurve3([
        new THREE.Vector3(.044,.095,.048), new THREE.Vector3(kind === "sport" ? .043 : legR*.73,.14,.056),
        new THREE.Vector3(legR*.84,.48,.071),new THREE.Vector3(legR,.73,.082),new THREE.Vector3(hip,.88,hip*.70),
        new THREE.Vector3(hip*.97,.96,hip*.69),new THREE.Vector3(waist+.012,1.035,waist*.73)
      ],false,"catmullrom",.2);
      const vertices:number[]=[],indices:number[]=[];const rows=64,cols=64;
      for(let j=0;j<=rows;j++){
        const p=profile.getPoint(j/rows);const t=THREE.MathUtils.smoothstep(p.y,.73,.89);
        const r=p.y>.73?legR:p.x;
        for(let i=0;i<=cols;i++){
          const angle=i/cols*Math.PI*2,c=Math.cos(angle),s=Math.sin(angle);
          const legX=hip*.49+c*r, waistX=Math.max(0,c)*(p.y<.90?hip:p.x);
          vertices.push(side*THREE.MathUtils.lerp(legX,waistX,t),p.y,s*p.z);
          if(j<rows&&i<cols){const k=j*(cols+1)+i;indices.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2);}
        }
      }
      const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();add(geo,lower);
      seam([[x,.16,.058],[x,.48,.073],[x,.79,.088]],kind === "tailored" ? "#697184" : lower,.0011);
    }
  }
  if (kind === "skirt") {
    surface([[.43,hip*1.45,.195],[.64,hip*1.31,.17],[.87,hip*1.10,hip*.76],[1.055,waist+.014,waist*.74]],color,.035);
    surface([[1.04,waist+.017,waist*.76],[1.065,waist+.017,waist*.76]],"#815145");
  }
  const shirt = kind === "skirt" ? "#efe9da" : upper;
  const torsoRings:Ring[] = [[bottomY,kind === "tailored" ? hip+.023 : outerWaist*1.08,kind === "tailored" ? hip*.75 : outerWaist*.76], [1.08,outerWaist,outerWaist*.76],[1.30,outerChest,outerChest*.73],[1.425,shoulder+.018,.105],[1.475,.052,.050]];
  surface(torsoRings,shirt);
  const torsoCurve=new THREE.CatmullRomCurve3(torsoRings.map(([y,x,z])=>new THREE.Vector3(x,y,z)),false,"catmullrom",.25);
  const samples=torsoCurve.getPoints(300);
  projectFront=(x,y)=>{let p=samples[0];for(const q of samples){if(Math.abs(q.y-y)<Math.abs(p.y-y))p=q;}return [x,y,p.z*Math.sqrt(Math.max(0,1-(x/p.x)**2))+.004];};
  if (kind === "tailored") {
    // Cream inset, lapels, welt pockets, brass buttons and waist belt.
    patch([[-.055,1.437,.063],[.055,1.437,.063],[.067,1.29,outerChest*.74], [.026,1.06,outerWaist*.78],[-.026,1.06,outerWaist*.78],[-.067,1.29,outerChest*.74]],"#f2ecdf");
    for (const s of [-1,1]) {
      patch([[s*.057,1.44,.071],[s*.112,1.385,.106],[s*.088,1.31,outerChest*.78],[s*.117,1.285,outerChest*.71],[s*.019,1.09,outerWaist*.79]],"#788298");
      seam([projectFront(s*.065,1.055,0),projectFront(s*.135,1.07,0)],"#a1a6b1",.0024);
      ellipsoid(s*.024,1.068,outerWaist*.79,.006,.006,.003,"#bdab7c");
    }
  }
  if (kind === "knit" || kind === "skirt") {
    surface([[1.466,.057,.054],[1.485,.053,.051]],kind === "skirt" ? "#d6ccba" : color);
    if(kind === "knit") for(let i=-5;i<=5;i++) {
      const x=i*.019;
      if(Math.abs(x)<outerWaist*.88) seam([[x,bottomY+.012,outerWaist*.76*Math.sqrt(1-(x/(outerWaist*1.08))**2)+.001],[x,bottomY+.041,outerWaist*.76*Math.sqrt(1-(x/(outerWaist*1.08))**2)+.001]],color,.001);
    }
  }
  if (kind === "sport") {
    ellipsoid(0,1.42,-.052,.107,.071,.077,color);
    for (const s of [-1,1]) seam([[s*.044,1.438,.063],[s*.049,1.35,outerChest*.75],[s*.042,1.28,outerChest*.75]],"#eee9ed",.0025);
    seam([[-outerWaist*.7,1.14,outerWaist*.65],[-outerWaist*.56,1.06,outerWaist*.74],[outerWaist*.56,1.06,outerWaist*.74],[outerWaist*.7,1.14,outerWaist*.65]],"#cbc2da",.002);
  }
  root.scale.y = body.height / 175;
  return root;
}

export function disposeObject(group: THREE.Object3D) {
  const materials = new Set<THREE.Material>();
  group.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m)); } });
  materials.forEach(m => m.dispose());
}
