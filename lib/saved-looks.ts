import type {StylingPlan, StylingSession} from './styling-session';

export const LOOKS_KEY='yihe-saved-looks-v1';
export const MAX_LOOKS=12;
export type SavedLook={id:string;name:string;savedAt:string;plan:StylingPlan};
const copy=(p:StylingPlan):StylingPlan=>({...p,items:p.items.map(i=>({...i}))});
const short=(v:unknown,max:number):v is string=>typeof v==='string'&&v.length<=max;
export function validPlan(v:unknown):v is StylingPlan{
  if(!v||typeof v!=='object')return false;
  const p=v as StylingPlan;
  return Number.isFinite(p.budget)&&p.budget>=200&&p.budget<=50000&&short(p.occasion,80)&&short(p.style,80)&&short(p.note,600)&&Number.isInteger(p.revision)&&p.revision>=0&&Array.isArray(p.items)&&p.items.length===4&&['top','bottom','shoes','accessory'].every((slot,n)=>{
    const i=p.items[n];return !!i&&i.slot===slot&&short(i.label,20)&&short(i.name,120)&&short(i.reason,600)&&typeof i.owned==='boolean'&&typeof i.locked==='boolean'&&Number.isInteger(i.variant)&&i.variant>=0&&Number.isFinite(i.amount)&&i.amount>=0&&i.amount<=50000&&(!i.owned||(i.amount===0&&i.locked));
  });
}
export function readLooks(raw:string|null):SavedLook[]{
  if(!raw||raw.length>150000)return [];
  try{const data=JSON.parse(raw);if(data.version!==1||!Array.isArray(data.looks))return [];
    const ids=new Set<string>();return data.looks.filter((s:SavedLook)=>{if(!s||!short(s.id,80)||!s.id||ids.has(s.id)||!short(s.name,32)||!s.name.trim()||!short(s.savedAt,40)||!Number.isFinite(Date.parse(s.savedAt))||!validPlan(s.plan))return false;ids.add(s.id);return true;}).slice(0,MAX_LOOKS).map((s:SavedLook)=>({id:s.id,name:s.name,savedAt:s.savedAt,plan:copy(s.plan)}));
  }catch{return [];}
}
export function writeLooks(looks:SavedLook[]){return JSON.stringify({version:1,looks:looks.map(s=>({id:s.id,name:s.name,savedAt:s.savedAt,plan:copy(s.plan)}))});}
export function restoreLook(session:StylingSession,plan:StylingPlan):StylingSession{
  return {plan:copy(plan),history:session.plan?[...session.history,copy(session.plan)].slice(-8):session.history};
}
