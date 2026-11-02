"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createRetailModel, updateRetailModel, disposeRetailModel } from "../lib/retail-model";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ArrowUpRight, ArrowRight, Check, RotateCcw, Download, Move, Pause, Play, Maximize, Sparkles, SlidersHorizontal, Shirt } from "lucide-react";
import { wardrobe, type AvatarOptions, type Body, type LookKind } from "../lib/avatar";
import type { Profile } from "../lib/style-engine";
import Look from "./look";
import "./fitting-room.css";
import "./fashion-edit.css";

type ViewerApi = { view: (angle: number) => void; reset: () => void; capture: () => void; zoom: (delta: number) => void };
function AvatarViewer({ options, spin, api, onStatus }: { options: AvatarOptions; spin: boolean; api: React.RefObject<ViewerApi | null>; onStatus: (s: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const state = useRef<{ scene: THREE.Scene; avatar: THREE.Group; renderer: THREE.WebGLRenderer; controls: OrbitControls; fit: () => void; render: () => void } | null>(null);
  const optionsRef = useRef(options); optionsRef.current = options;
  const spinRef = useRef(spin); spinRef.current = spin;
  const [failed, setFailed] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState(false);
  const requestVersion=useRef(0);
  useEffect(() => {
    const element = host.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); }
    catch { setFailed(true); onStatus("当前浏览器不支持 3D。可换用系统浏览器，其他搭配功能仍可使用。"); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .95;
    element.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-label", "可拖动旋转的三维穿搭人物；使用下方按钮也可切换视角和缩放");
    renderer.domElement.setAttribute("role", "img");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, .05, 40);
    camera.position.set(.72, 1.05, 3.05);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0,.91,0); controls.enableDamping = true; controls.dampingFactor = .09; controls.enablePan = false;
    controls.minDistance = 2.4; controls.maxDistance = 6.7; controls.minPolarAngle = .55; controls.maxPolarAngle = 1.85; controls.autoRotateSpeed = .65;
    scene.add(new THREE.HemisphereLight(0xfff9f0, 0x897d70, 1.5));
    const key = new THREE.DirectionalLight(0xfff6e6, 1.6); key.position.set(3,5,4); key.castShadow = true;
    key.shadow.mapSize.set(1024,1024); key.shadow.camera.left=-2; key.shadow.camera.right=2; key.shadow.camera.top=3; key.shadow.camera.bottom=-2; key.shadow.normalBias=.025;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xf1e9dc,1.0); fill.position.set(-3,2,-2); scene.add(fill);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(4,80),new THREE.ShadowMaterial({ color: 0x4d4558, opacity:.09 })); floor.rotation.x=-Math.PI/2; floor.position.y=-.014; floor.receiveShadow=true; scene.add(floor);
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(.46,.49,.055,80),new THREE.MeshStandardMaterial({color:0xf3eee6,roughness:.85})); pedestal.position.y=-.041; pedestal.receiveShadow=true; pedestal.castShadow=true; scene.add(pedestal);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.53,.0014,6,100),new THREE.MeshBasicMaterial({color:0xbdb1c8})); ring.rotation.x=Math.PI/2; ring.position.y=-.012; scene.add(ring);
    const environment=new RoomEnvironment();const pmrem=new THREE.PMREMGenerator(renderer);const env=pmrem.fromScene(environment,.04);scene.environment=env.texture;scene.environmentIntensity=.65;environment.dispose();pmrem.dispose();
    const avatar = new THREE.Group(); scene.add(avatar);
    const render = () => renderer.render(scene,camera);
    const fit=()=>{const target=state.current?.avatar||avatar;if(!target.children.length)return;target.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(target,true),size=bounds.getSize(new THREE.Vector3());if(!Number.isFinite(size.y)||!size.y)return;const center=bounds.getCenter(new THREE.Vector3());controls.target.set(center.x,center.y,0);const distance=Math.max(size.y,size.x/camera.aspect)/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)))*1.14;const direction=camera.position.clone().sub(controls.target).normalize();camera.position.copy(controls.target).addScaledVector(direction,distance);controls.update();render();};
    state.current = { scene, avatar, renderer, controls, fit, render };
    const resize = () => {
      const w=element.clientWidth, h=element.clientHeight;
      if (!w || !h) return;
      // Keep the full body visible on a narrow phone canvas.
      camera.aspect=w/h; camera.fov=w/h<.72 ? 38 : 32; camera.updateProjectionMatrix(); renderer.setSize(w,h); fit(); render();
    };
    const observer=new ResizeObserver(resize); observer.observe(element); resize();
    let visible = true;
    const intersection=new IntersectionObserver(entries => {visible=entries[0].isIntersecting;}); intersection.observe(element);
    let raf=0; let last=0;
    const tick=(time:number) => { raf=requestAnimationFrame(tick); if(document.hidden || !visible || time-last<30) return; const dt=Math.min((time-last)/1000,.1); last=time; controls.autoRotate=spinRef.current; controls.update(dt); render(); };
    raf=requestAnimationFrame(tick);
    const defaultView=() => {camera.position.set(.72,1.05,3.45); controls.target.set(0,.91,0); fit(); controls.update(); render();};
    api.current={
      view: angle => {const distance=camera.position.distanceTo(controls.target);camera.position.set(Math.sin(angle)*distance,1.22,Math.cos(angle)*distance);controls.update();render();},
      reset:defaultView,
      zoom: delta => {const dir=camera.position.clone().sub(controls.target);dir.setLength(THREE.MathUtils.clamp(dir.length()+delta,controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(dir);controls.update();render();},
      capture: () => {
        try {
          render(); const output=document.createElement("canvas"); output.width=1000;output.height=1300; const ctx=output.getContext("2d")!;
          ctx.fillStyle="#f1ede8";ctx.fillRect(0,0,1000,1300);ctx.fillStyle="#30302e";ctx.font="32px sans-serif";ctx.fillText("衣合 · 3D 穿搭手记",70,90);
          const src=renderer.domElement; const ratio=1050/src.height;ctx.drawImage(src,(1000-src.width*ratio)/2,125,src.width*ratio,src.height*ratio);
          ctx.font="20px sans-serif";ctx.fillStyle="#716a75";ctx.fillText("款式与比例示意 · 不代表真实尺码或面料效果",70,1230);
          output.toBlob(blob=>{if(!blob){onStatus("保存失败，请重试。");return;}const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="衣合-3D穿搭手记.png";a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);onStatus("穿搭图片已生成，可在浏览器下载中查看。");},"image/png");
        }catch {onStatus("图片暂时无法保存，请重试或使用浏览器截图。");}
      }
    };
    const lost=(e:Event)=>{e.preventDefault();setFailed(true);onStatus("3D 显示已中断，请刷新页面重试。其他搭配功能仍可使用。");};
    renderer.domElement.addEventListener("webglcontextlost",lost);
    onStatus("");
    return ()=>{cancelAnimationFrame(raf);observer.disconnect();intersection.disconnect();controls.dispose();renderer.domElement.removeEventListener("webglcontextlost",lost);disposeRetailModel(state.current?.avatar || avatar);[floor,pedestal,ring].forEach(m=>{m.geometry.dispose();m.material.dispose();});env.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();state.current=null;api.current=null;};
  }, [api,onStatus]);
  useEffect(()=>{
    const s=state.current;if(!s)return;
    const version=++requestVersion.current;
    if(s.avatar.userData.kind===options.kind&&s.avatar.userData.gender===options.modelGender){updateRetailModel(s.avatar,options);s.fit();s.render();setModelLoading(false);setModelError(false);return;}
    setModelLoading(true);setModelError(false);
    createRetailModel(options.kind,options.modelGender).then(next=>{
      if(version!==requestVersion.current || state.current!==s){disposeRetailModel(next);return;}
      updateRetailModel(next,optionsRef.current);s.scene.remove(s.avatar);disposeRetailModel(s.avatar);s.scene.add(next);s.avatar=next;s.fit();s.renderer.domElement.dataset.look=next.userData.kind;s.renderer.domElement.dataset.model=next.userData.gender;s.render();setModelLoading(false);
    }).catch(()=>{if(version===requestVersion.current){setModelLoading(false);setModelError(true);}});
  },[options]);
  return <div ref={host} className="avatar-canvas" data-testid="avatar-viewer">{modelLoading&&!failed&&<div className="model-loading">正在准备立体人台与服装…</div>}{modelError&&<div className="model-loading">模型暂时未加载成功，请刷新重试。仍可查看商品实拍。</div>}{failed&&<div className="webgl-fallback"><Look/><b>当前设备暂时无法显示 3D</b><p>试试系统浏览器，或继续使用搭配方案。</p><small>上图为二维配色参考</small></div>}</div>;
}

const defaults:Body={height:168,bust:86,waist:70,hip:94};
const limits:Record<keyof Body,[number,number]>={height:[140,200],bust:[65,130],waist:[50,125],hip:[70,140]};
const labels:Record<keyof Body,string>={height:"身高",bust:"胸围",waist:"腰围",hip:"臀围"};
const colors=["#b4a28a","#e8dfcf","#303e53","#713c43","#687360","#343331"];
const colorNames=["暖沙色","象牙白","午夜蓝","酒红","橄榄绿","炭黑"];
export default function FittingRoom({profile,onProfile,onExplore}:{profile:Profile;onProfile:()=>void;onExplore:(style:string)=>void}) {
  const [modelGender,setModelGender]=useState<"male"|"female">(profile.presentation==="男装"?"male":"female");
  const [kind,setKind]=useState<LookKind>("tailored");
  const [color,setColor]=useState(colors[0]); const [skin,setSkin]=useState("#cda78b");
  const [body,setBody]=useState<Body>(profile.presentation==="男装"?{height:178,bust:96,waist:78,hip:96}:defaults);const [bodySource,setBodySource]=useState("示例身材");
  const [ease,setEase]=useState(1);const [spin,setSpin]=useState(false);
  const [status,setStatus]=useState("");const api=useRef<ViewerApi|null>(null);
  const selected=wardrobe.find(x=>x.id===kind)!;
  const options=useRef<AvatarOptions>(null!);
  // Stable options prevent rebuilding the meshes for notifications or camera actions.
  const bottomColor=modelGender==="male"?"#655b4d":"#3c302b";
  const key=JSON.stringify({body,kind,color,skin,ease,modelGender,bottomColor});
  const lastKey=useRef(""); if(lastKey.current!==key){options.current={body,kind,color,skin,ease,modelGender,bottomColor};lastKey.current=key;}
  function selectModel(gender:"male"|"female"){setModelGender(gender);setSpin(false);if(bodySource==="示例身材")setBody(gender==="male"?{height:178,bust:96,waist:78,hip:96}:defaults);setStatus(gender==="male"?"已切换男生模特，当前服装与自定义尺寸仍可继续调整。":"已切换女生模特，当前服装与自定义尺寸仍可继续调整。");}
  function useProfile(){
    const next=modelGender==="male"?{height:178,bust:96,waist:78,hip:96}:{...defaults};let count=0;let clamped=false;
    (Object.keys(defaults) as (keyof Body)[]).forEach(k=>{const n=Number(profile[k]);if(Number.isFinite(n)&&n>0){next[k]=Math.max(limits[k][0],Math.min(limits[k][1],n));count++;if(next[k]!==n)clamped=true;}});
    if(!count){setStatus("还没有身材档案。可以先填写档案，也可以直接拖动下方滑块。");return;}
    setBody(next);setBodySource(count===4&&!clamped?"已导入档案":"档案 + 示例补全");
    setStatus(clamped?"部分数据超出模型可调范围，已使用边界值；不会修改你的原档案。":count<4?"已导入已填写的数据，缺少的尺寸暂用示例值。":"已按你的身高与三围调整示意模型。体重不会用于推算尺码。");
  }
  return <div className="fitting-room">
    <section className="studio-intro"><div><div className="studio-kicker"><span/> YOUR STYLE, IN A NEW DIMENSION</div><h1>穿搭，不必靠<span>想象。</span><i>3D</i></h1><p>换一套衣服，转一个角度。让风格在你眼前发生。</p></div><button className="studio-cta" onClick={()=>onExplore(selected.style)}>为我规划整套搭配 <ArrowUpRight size={18}/></button></section>
    <div className="model-selector" aria-label="选择展示模特"><button aria-pressed={modelGender==="female"} onClick={()=>selectModel("female")}><span>WOMEN</span><b>女生模特</b><small>柔和廓形 · 利落层次</small></button><button aria-pressed={modelGender==="male"} onClick={()=>selectModel("male")}><span>MEN</span><b>男生模特</b><small>干净线条 · 松弛质感</small></button></div>
    <div className="studio-layout">
      <aside className="wardrobe-panel"><div className="studio-panel-heading"><span>01 / WARDROBE</span><Shirt size={17}/></div><h2>今日，想怎么穿？</h2><p className="studio-muted">四套风格，随心切换</p>
        <div className="wardrobe-list">{wardrobe.map((look,i)=><button key={look.id} className={`wardrobe-card ${kind===look.id?"is-selected":""}`} aria-pressed={kind===look.id} onClick={()=>{setKind(look.id);setColor(look.color);}}><div className={`garment-thumb thumb-${look.id}`} style={{"--garment":look.color,"--bottom":look.bottom} as React.CSSProperties}><span className="mini-top"/><span className="mini-bottom"/></div><div><small>LOOK 0{i+1}</small><b>{look.title}</b><span>{look.subtitle}</span></div>{kind===look.id&&<Check size={15}/>}</button>)}</div>
        <div className="wardrobe-note"><Sparkles size={17}/><p>从一套喜欢的轮廓开始，<br/>慢慢找到自己的风格。</p></div>
      </aside>
      <section className="model-stage" aria-label="3D试衣区域"><div className="stage-heading"><span><i/> LIVE FITTING</span><b>{modelGender==="male"?"男生模特":"女生模特"} · 360°</b></div><div className="stage-watermark" aria-hidden="true">yihe.</div><div className="stage-halo"/>
        <AvatarViewer options={options.current} spin={spin} api={api} onStatus={setStatus}/>
        <div className="stage-label"><span>{selected.tag}</span><h2>{selected.title}</h2><p>{bodySource} · {body.height} cm</p></div>
        <div className="zoom-controls"><button aria-label="放大人物" onClick={()=>api.current?.zoom(-.4)}>＋</button><button aria-label="缩小人物" onClick={()=>api.current?.zoom(.4)}>−</button><button aria-label="重置视角" onClick={()=>{setSpin(false);api.current?.reset();}}><Maximize size={16}/></button></div>
        <div className="stage-controls"><div className="angle-buttons">{[["正面",0],["侧面",Math.PI/2],["背面",Math.PI]].map(([title,angle])=><button key={title} onClick={()=>{setSpin(false);api.current?.view(Number(angle));}}>{title}</button>)}</div><button className={spin?"spin active":"spin"} aria-pressed={spin} onClick={()=>setSpin(!spin)}>{spin?<Pause size={15}/>:<Play size={15}/>}<span>{spin?"暂停":"自动旋转"}</span></button></div>
        <div className="stage-help"><Move size={12}/><span>拖动旋转 · 双指或按钮缩放</span></div>
      </section>
      <aside className="studio-settings"><div className="studio-panel-heading"><span>02 / MAKE IT YOURS</span><SlidersHorizontal size={16}/></div><h2>把细节调到喜欢</h2>
        <div className="setting-section"><div className="setting-label"><b>服装配色</b><span>{colorNames[colors.indexOf(color)]||"自选"}</span></div><div className="color-options">{colors.map((c,i)=><button key={c} aria-label={`${colorNames[i]}配色`} aria-pressed={color===c} style={{background:c}} className={color===c?"picked":""} onClick={()=>setColor(c)}>{color===c&&<Check size={13}/>}</button>)}</div><p className="setting-hint">{kind==="skirt"?"调整连衣裙颜色":"调整上装颜色"}</p></div>
        <div className="setting-section"><div className="setting-label"><b>穿着轮廓</b><span>示意松量</span></div><div className="ease-control">{["修身","合身","宽松"].map((s,i)=><button key={s} aria-pressed={ease===i} className={ease===i?"picked":""} onClick={()=>setEase(i)}>{s}</button>)}</div></div>
        <div className="setting-section body-settings"><div className="setting-label"><b>身材比例</b><button onClick={useProfile}>导入我的档案 <ArrowUpRight size={12}/></button></div>{(Object.keys(defaults) as (keyof Body)[]).map(k=><label className="body-slider" key={k}><span>{labels[k]}<output>{body[k]} <small>cm</small></output></span><input type="range" min={limits[k][0]} max={limits[k][1]} value={body[k]} aria-label={`模型${labels[k]}`} onChange={e=>{setBody({...body,[k]:Number(e.target.value)});setBodySource("自定义身材");}}/></label>)}<button className="reset-body" onClick={()=>{setBody(modelGender==="male"?{height:178,bust:96,waist:78,hip:96}:defaults);setBodySource("示例身材");setEase(1);}}><RotateCcw size={12}/> 恢复示例比例</button></div>
        <div className="setting-section skin-row"><b>肤色调整</b><div className="color-options">{["#eed0b3","#cda78b","#946d52","#583e31"].map((c,i)=><button key={c} aria-label={`肤色调整${i+1}`} aria-pressed={skin===c} style={{background:c}} className={skin===c?"picked":""} onClick={()=>setSkin(c)}>{skin===c&&<Check size={12}/>}</button>)}</div></div>
        <button className="save-look" onClick={()=>api.current?.capture()}><Download size={16}/> 保存这套穿搭</button><p className="setting-hint">模型参数仅用于本次预览，不修改档案</p>
      </aside>
    </div>
    {status&&<p className="studio-status" role="status">{status}</p>}
    <div className="studio-bottom"><p><span>体验版</span>实体人台风格 · 服装为通用展示模型，并非精选衣橱中商品的复刻；体型调整不代表真实尺码。</p><button onClick={onProfile}>完善我的身材档案 <ArrowRight size={15}/></button></div>
    <section className="studio-next"><div className="next-number">NEXT<br/><b>01—03</b></div><div><h2>好看的下一步，是适合你的生活。</h2><p>把身材、风格和预算放在一起，再去附近的店里试一试。</p></div><button onClick={()=>onExplore(selected.style)}>开始我的搭配 <ArrowUpRight size={21}/></button></section>
  </div>;
}
