"use client";
import{useEffect,useState}from'react';
import{Bookmark,Check,ArrowUpRight,Trash2,Scale}from'lucide-react';
import{LOOKS_KEY,MAX_LOOKS,readLooks,writeLooks,type SavedLook}from'../lib/saved-looks';
import{planTotal,type StylingPlan}from'../lib/styling-session';

export default function SavedLooks({plan,onRestore}:{plan:StylingPlan|null;onRestore:(p:StylingPlan)=>void}){
 const[looks,setLooks]=useState<SavedLook[]>([]),[name,setName]=useState(''),[status,setStatus]=useState(''),[selected,setSelected]=useState<string[]>([]),[pending,setPending]=useState<string|null>(null),[ready,setReady]=useState(false);
 useEffect(()=>{const refresh=()=>{try{setLooks(readLooks(localStorage.getItem(LOOKS_KEY)));}catch{setStatus('浏览器不允许本地保存，仍可导出当前搭配。');}setReady(true);};refresh();const sync=(e:StorageEvent)=>{if(e.key===LOOKS_KEY||e.key===null)refresh();};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[]);
 function persist(next:SavedLook[]){try{localStorage.setItem(LOOKS_KEY,writeLooks(next));setLooks(next);return true;}catch{setStatus('没有保存成功：浏览器存储不可用或空间不足。请使用“导出这套”保留方案。');return false;}}
 function save(){if(!plan)return;let latest:SavedLook[];try{latest=readLooks(localStorage.getItem(LOOKS_KEY));}catch{setStatus('浏览器不允许本地保存，请导出方案。');return;}if(latest.length>=MAX_LOOKS){setLooks(latest);setStatus('最多保存12套。先删除一套不需要的，再保存新方案。');return;}
 const label=name.trim()||`${plan.occasion} · ${plan.style}`.slice(0,32);const next={id:crypto.randomUUID(),name:label,savedAt:new Date().toISOString(),plan:structuredClone(plan)};
 if(persist([next,...latest])){setStatus(`“${label}”已保存到当前设备。`);setName('');}}
 function remove(id:string){try{const latest=readLooks(localStorage.getItem(LOOKS_KEY));if(persist(latest.filter(l=>l.id!==id))){setSelected(s=>s.filter(x=>x!==id));setPending(null);setStatus('已删除这套保存记录，当前搭配不受影响。');}}catch{setStatus('删除失败，请稍后重试。');}}
 function toggle(id:string){setSelected(s=>{if(s.includes(id))return s.filter(x=>x!==id);if(s.length===2){setStatus('一次比较两套，请先取消一套。');return s;}return [...s,id];});}
 const compared=selected.map(id=>looks.find(l=>l.id===id)).filter((l):l is SavedLook=>!!l);
 return <div className="saved-looks"><div className="looks-intro"><Bookmark size={22}/><div><h3>把喜欢的留下，下次接着选。</h3><p>主动保存后留在当前浏览器，最多12套。不包含照片、位置、身材档案或聊天记录，也不会跨设备同步。</p></div></div>
 {plan?<div className="save-look-form"><label>给当前搭配起个名字<input aria-label="搭配保存名称" value={name} maxLength={32} onChange={e=>setName(e.target.value)} placeholder={`${plan.occasion}，例如：周一见客户`}/></label><button className="analyze-button" disabled={!ready} onClick={save}><Bookmark size={15}/>保存到此设备</button></div>:<p className="looks-empty">先在“当前搭配”选一套，或在下方恢复一套已保存的方案。</p>}
 {status&&<p className="looks-status" role="status">{status}</p>}
 <div className="looks-list-heading"><b>我的搭配 · {looks.length} / {MAX_LOOKS}</b><span>选中两套，比较新购预算与单品</span></div>
 {!looks.length&&<div className="looks-empty"><Bookmark size={25}/><p>还没有保存的搭配。通勤、周末、约会，各留一套，出门前少纠结一点。</p></div>}
 <div className="looks-list">{looks.map(l=><article key={l.id} className="saved-look"><div className="saved-look-title"><h3>{l.name}</h3><button aria-label={`比较${l.name}`} aria-pressed={selected.includes(l.id)} onClick={()=>toggle(l.id)}>{selected.includes(l.id)?<Check size={15}/>:<Scale size={15}/>}对比</button></div><p className="saved-look-meta">{l.plan.occasion} · 新购计划 ¥{planTotal(l.plan)}<br/>保存于 {new Date(l.savedAt).toLocaleDateString('zh-CN')}</p><ul>{l.plan.items.map(i=><li key={i.slot}><span>{i.label}</span>{i.name}{i.owned&&<small>已有</small>}</li>)}</ul><div className="saved-look-actions"><button onClick={()=>{onRestore(l.plan);setStatus(`已恢复“${l.name}”，可以继续调整。`);}}>恢复并继续调整 <ArrowUpRight size={14}/></button><button aria-label={`删除${l.name}`} onClick={()=>setPending(l.id)}><Trash2 size={14}/></button></div>{pending===l.id&&<div className="look-delete-confirm"><p>删除这套保存记录？</p><button onClick={()=>remove(l.id)}>确认删除</button><button onClick={()=>setPending(null)}>取消</button></div>}</article>)}</div>
 {compared.length>0&&<section className="looks-comparison" aria-label="两套搭配对比"><h3>哪一套更适合这次出门？</h3>{compared.length===1?<p>再选一套，即可并排比较。</p>:<><p>新购计划相差 ¥{Math.abs(planTotal(compared[0].plan)-planTotal(compared[1].plan))}。金额为预算分配，已有衣物不重复计价。</p><div className="looks-table-wrap"><table><thead><tr><th>对比项</th>{compared.map(l=><th key={l.id}>{l.name}</th>)}</tr></thead><tbody><tr><th>场景 / 风格</th>{compared.map(l=><td key={l.id}>{l.plan.occasion}<br/>{l.plan.style}</td>)}</tr><tr><th>新购 / 上限</th>{compared.map(l=><td key={l.id}>¥{planTotal(l.plan)} / ¥{l.plan.budget}{planTotal(l.plan)>l.plan.budget&&<small>已超预算</small>}</td>)}</tr>{[0,1,2,3].map(n=><tr key={n}><th>{compared[0].plan.items[n].label}</th>{compared.map(l=><td key={l.id}>{l.plan.items[n].name}<small>{l.plan.items[n].owned?'已有 · ¥0':`计划 ¥${l.plan.items[n].amount}`}</small></td>)}</tr>)}</tbody></table></div></>}</section>}
 </div>;
}
