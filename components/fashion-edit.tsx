"use client";
import{ArrowUpRight,Check}from'lucide-react';
import './fashion-edit.css';

const edits=[
 {gender:'女装',key:'women',tag:'WOMEN / 01',title:'柔和，也有分寸。',description:'燕麦短外套 × 奶油白内搭 × 深咖阔腿裤',note:'上短下长，让宽松有清晰的比例。',colors:['#c3b39d','#eee8da','#4a382d']},
 {gender:'男装',key:'men',tag:'MEN / 02',title:'简单，穿出质感。',description:'午夜蓝外套 × 象牙白针织 × 灰褐直筒裤',note:'深浅分明，用低饱和配色留住层次。',colors:['#242d3d','#eee8da','#a09585']},
];
export default function FashionEdit({presentation,onChoose,onChat}:{presentation:string;onChoose:(gender:string)=>void;onChat:()=>void}){
 return <section className="fashion-edit" aria-label="男女造型精选"><header><div><span>THE CONSIDERED EDIT</span><h1>把日常，穿得更好看。</h1><p>男生与女生分别呈现，先选喜欢的造型，再一起调整。</p></div><button onClick={onChat}>聊聊我的穿搭 <ArrowUpRight size={16}/></button></header><div className="fashion-edit-grid">{edits.map(e=><article key={e.key} className={`fashion-story ${presentation===e.gender?'is-active':''}`}><div className={`fashion-portrait ${e.key}`}><img src="./editorial/style-duo.png" alt={`${e.gender}模特的完整造型，AI生成风格示意`} fetchPriority="high"/><span className="editorial-disclosure">AI 造型示意 · 非商品实拍</span><span className="fashion-story-tag">{e.tag}</span></div><div className="fashion-story-copy"><div className="fashion-story-title"><h2>{e.title}</h2><span className="fashion-palette" aria-label="造型配色">{e.colors.map(c=><i key={c} style={{background:c}}/>)}</span></div><p>{e.description}</p><small>{e.note}</small><button onClick={()=>onChoose(e.gender)}>{presentation===e.gender&&<Check size={14}/>}以{e.gender==='女装'?'女生':'男生'}造型为起点 <ArrowUpRight size={15}/></button></div></article>)}</div><p className="fashion-edit-note">造型图用于表达配色与比例；下面的搭配会结合你的预算、场景与避开条件重新规划。商家模特图和面料资料在精选衣橱中查看。</p></section>;
}
