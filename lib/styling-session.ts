import {recommend, type Profile, type Preferences} from './style-engine';
import {advise} from './stylist';

export type Slot='top'|'bottom'|'shoes'|'accessory';
export type PlanItem={slot:Slot;label:string;name:string;amount:number;locked:boolean;owned:boolean;variant:number;reason:string};
export type StylingPlan={items:PlanItem[];budget:number;occasion:string;style:string;note:string;revision:number};
export type StylingSession={plan:StylingPlan|null;history:StylingPlan[]};
export const emptySession=():StylingSession=>({plan:null,history:[]});
const slots:Slot[]=['top','bottom','shoes','accessory'];
const labels=['上装','下装','鞋履','配件'];
const alternatives:Record<Slot,string[]>={top:['简洁棉质衬衫','无明显装饰的开衫与内搭','轻便短外套','圆领棉质上衣'],bottom:['黑色直筒长裤','深蓝直筒牛仔裤','垂坠阔腿长裤','浅灰休闲长裤'],shoes:['简洁平底鞋','低帮休闲鞋','轻便乐福鞋','便于步行的运动鞋'],accessory:['简约帆布包','小巧斜挎包','轻便通勤背包','素色手提包']};
const reasons=['上装决定场合感，优先检查肩线与衣长。','下装负责稳定整体轮廓，试坐后再判断腰臀空间。','按步行需要选鞋，舒适度与整套风格一起考虑。','配件控制数量，尽量与已有单品重复使用。'];
const slotPattern:Record<Slot,RegExp>={top:/上衣|上装|衬衫|外套|开衫|卫衣|针织|T恤|短袖/i,bottom:/裤|裙|下装/,shoes:/鞋|靴/,accessory:/包|配件|帽/};
const copy=(p:StylingPlan):StylingPlan=>({...p,items:p.items.map(i=>({...i}))});
export const planTotal=(p:StylingPlan)=>p.items.reduce((n,i)=>n+i.amount,0);
function allocate(p:StylingPlan){
  const fixed=p.items.filter(i=>i.locked&&!i.owned).reduce((n,i)=>n+i.amount,0);
  const open=p.items.filter(i=>!i.locked&&!i.owned);
  const weights:Record<Slot,number>={top:.4,bottom:.3,shoes:.23,accessory:.07};
  const sum=open.reduce((n,i)=>n+weights[i.slot],0);let remaining=Math.max(0,p.budget-fixed);
  p.items.forEach(i=>{if(i.owned)i.amount=0;});
  open.forEach((i,index)=>{const amount=index===open.length-1?remaining:Math.floor(Math.max(0,p.budget-fixed)*weights[i.slot]/sum);i.amount=amount;remaining-=amount;});
  if(fixed>p.budget)p.note='保留单品的计划金额已超过新预算。请先解锁一件再分配；这里没有偷偷改动你的保留项。';
  else if(!open.length&&fixed<p.budget)p.note='所有单品均已保留或已有，未使用的预算可以留下，不必花完。';
  return p;
}
export function createPlan(p:Profile,f:Preferences):StylingPlan{
  const base=recommend(p,f)[0];return allocate({budget:Math.max(200,Math.min(50000,f.budget)),occasion:f.occasion,style:f.styles[0]||'简约通勤',note:'金额是新购预算分配，不是商家报价。已有单品不计入新购预算。',revision:1,items:base.items.map((i,n)=>({slot:slots[n],label:labels[n],name:i.name,amount:i.price,locked:false,owned:false,variant:0,reason:reasons[n]}))});
}
function push(s:StylingSession,p:StylingPlan):StylingSession{return {plan:p,history:s.plan?[...s.history,copy(s.plan)].slice(-8):s.history};}
export function editPlan(s:StylingSession,action:'lock'|'owned'|'swap'|'cheaper'|'casual'|'undo'|'new',p:Profile,f:Preferences,slot?:Slot):StylingSession{
  if(action==='undo')return s.history.length?{plan:copy(s.history.at(-1)!),history:s.history.slice(0,-1)}:s;
  if(action==='new')return push(s,createPlan(p,f));
  const plan=copy(s.plan||createPlan(p,f));plan.revision++;plan.note='只调整了当前选择；金额为新购预算计划。';
  const item=plan.items.find(i=>i.slot===slot);
  if(action==='lock'&&item)item.locked=!item.locked;
  if(action==='owned'&&item){item.owned=!item.owned;item.locked=item.owned;allocate(plan);}
  if(action==='swap'&&item){
    if(item.locked||item.owned){plan.note='这件已保留。先取消保留或取消“我已有”，再换款。';return push(s,plan);}
    const avoid=f.avoid.split(/[，,、\s]+/).filter(Boolean);let options=alternatives[item.slot];
    if(f.season==='冬季'&&item.slot==='top')options=['保暖外套与棉质内搭','保暖棉服与圆领内搭'];
    options=options.filter(x=>!avoid.some(a=>x.includes(a)||(a.includes('裙')&&x.includes('裙'))));
    if(!options.length){plan.note='当前备选都可能触及避开条件，请补充可接受的单品描述。';return push(s,plan);}
    item.variant++;item.name=options.filter(x=>x!==item.name)[item.variant%Math.max(1,options.filter(x=>x!==item.name).length)]||options[0];item.reason='在保持其他单品与预算不变的前提下，换一个款式方向。';
  }
  if(action==='cheaper'){plan.budget=Math.max(200,Math.round(plan.budget*.8));allocate(plan);}
  if(action==='casual'){
    plan.style='松弛休闲';plan.note='保留你锁定或已有的单品，其他部分减少正式感。';
    const avoid=f.avoid.split(/[，,、\s]+/).filter(Boolean);
    plan.items.forEach(i=>{if(!i.locked&&!i.owned){const available=alternatives[i.slot].filter(x=>!avoid.some(a=>x.includes(a)));i.name=available[i.slot==='top'?1:0]||available[0]||`按避开条件另选的${i.label}`;i.reason='用更轻松的单品弱化正式感，仍需按实际场合试穿。';}});
  }
  return push(s,plan);
}
export function sessionReply(input:string,s:StylingSession,profile:Profile,prefs:Preferences){
  const q=input.trim();const relaxed=/太正式|别太正式|不要太正式|不想太成熟|太成熟/.test(q);
  const reply=advise(relaxed?q.replace(/正式|成熟/g,'拘谨'):q,profile,prefs);
  let next=s;const mentions=slots.filter(slot=>slotPattern[slot].test(q));const changes:string[]=[];
  const clauses=q.split(/[，。,；;\n]|(?=只换|替换|换|保留|锁定)/);
  const actionSlots=(re:RegExp)=>slots.filter(slot=>clauses.some(c=>re.test(c)&&slotPattern[slot].test(c)));
  if(/撤销|上一步|恢复上一套/.test(q)){
    next=editPlan(s,'undo',profile,prefs);reply.text=next===s?'还没有可以撤销的调整。':'已恢复上一步的搭配和预算。';
  }else{
    const actionable=relaxed||/保留|锁定|换|已有|已经有|我有|便宜|省一点|预算|搭配|生成|通勤|面试|约会|周末|上班|冬季|夏季/.test(q);
    if(actionable&&!next.plan)next={...next,plan:createPlan(reply.profile,reply.prefs)};
    if(next.plan){
      if(s.plan&&!relaxed&&/通勤|面试|约会|周末|上班|冬季|夏季|重新生成|重新搭配/.test(q)){
        const fresh=createPlan(reply.profile,reply.prefs);fresh.items=fresh.items.map(i=>{const prior=next.plan!.items.find(x=>x.slot===i.slot)!;return prior.locked||prior.owned?{...prior}:i;});next=push(next,allocate(fresh));changes.push(`按${fresh.occasion}更新未保留的单品`);
      }
      if(/预算|不超过|控制在/.test(q)&&!/便宜一点|省一点|降预算/.test(q)&&next.plan!.budget!==reply.prefs.budget){const plan=copy(next.plan!);plan.budget=reply.prefs.budget;allocate(plan);next=push(next,plan);changes.push(`预算改为 ¥${plan.budget}`);}
      if(/我有|已经有|已有|^有/.test(q)&&!/(?:没有|还没|未有|有没有)/.test(q)){
        const plan=copy(next.plan!);let touched=false;
        for(const slot of mentions){const item=plan.items.find(i=>i.slot===slot)!;const pieces=q.split(/[，。,；;\n和]/);const piece=pieces.find(x=>slotPattern[slot].test(x));if(!piece)continue;
          const name=piece.replace(/^.*?(?:已经有|已有|我有|有)/,'').replace(/和.*$/,'').trim();
          item.name=(name.length>1&&name.length<36&&slotPattern[slot].test(name)?name:item.name);item.owned=true;item.locked=true;item.amount=0;item.reason='你已拥有，优先继续使用；不用重复购买。';touched=true;changes.push(`沿用已有${item.label}`);
        }
        if(touched)next=push(next,allocate(plan));
      }
      if(/保留|锁定/.test(q)){const plan=copy(next.plan!);actionSlots(/保留|锁定/).forEach(slot=>{const i=plan.items.find(x=>x.slot===slot)!;i.locked=true;changes.push(`保留${i.label}`);});next=push(next,plan);}
      if(relaxed){next=editPlan(next,'casual',reply.profile,reply.prefs);reply.prefs.styles=['松弛休闲'];changes.push('减少正式感');}
      if(/便宜一点|省一点|降预算/.test(q)&&!/预算\s*\d/.test(q)){if(s.plan)next=editPlan(next,'cheaper',reply.profile,prefs);changes.push('降低未保留单品的预算');}
      if(/换|替换/.test(q)){const selected=actionSlots(/换|替换/);for(const slot of selected)next=editPlan(next,'swap',reply.profile,reply.prefs,slot);if(selected.length)changes.push(`仅尝试更换${selected.map(x=>labels[slots.indexOf(x)]).join('、')}`);}
      if(changes.length){reply.text=`${changes.join('，')}。\n\n${next.plan!.items.map(i=>`${i.label}：${i.name}${i.owned?'（已有）':i.locked?'（保留）':''}`).join('\n')}\n\n${next.plan!.note}`;reply.questions=['保留裤子，只换上衣','再便宜一点','撤销上一步'];reply.action=undefined;}
      else if(actionable){reply.text+='\n\n我把当前方案放在“这套，继续一起选”里了。你已经有哪些裤子或鞋？告诉我，我会优先沿用。';}
    }
  }
  if(next.plan&&!/撤销|上一步|恢复上一套/.test(q)){
    const avoids=reply.prefs.avoid.split(/[，,、\s]+/).filter(Boolean);
    const conflicts=(name:string)=>avoids.some(a=>name.includes(a)||(a.includes('裙')&&name.includes('裙')));
    const plan=copy(next.plan);let changed=false;
    plan.items.forEach(i=>{if(!conflicts(i.name))return;changed=true;if(i.locked||i.owned){plan.note=`保留的${i.label}与新避开条件可能冲突，请先确认要保留还是替换。`;return;}i.name=alternatives[i.slot].find(x=>!conflicts(x))||`按新条件另选的${i.label}`;i.reason='已按你新提出的避开条件调整，实际成分仍需看标签。';});
    if(changed){next={...next,plan};reply.text+='\n\n已对照新的避开条件检查当前搭配；冲突的保留项会在方案中提示。';}
  }
  if(next!==s&&!/撤销|上一步|恢复上一套/.test(q)){next={plan:next.plan,history:s.plan?[...s.history,copy(s.plan)].slice(-8):s.history};}
  if(next.plan){reply.prefs.budget=next.plan.budget;reply.prefs.styles=[next.plan.style];reply.prefs.occasion=next.plan.occasion;}
  return {...reply,session:next};
}
