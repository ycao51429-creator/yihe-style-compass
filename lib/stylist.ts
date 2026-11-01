import type { Profile, Preferences } from "./style-engine";
import {products, type Product} from "./shop-catalog";
export type StylistReply={text:string;questions:string[];productIds:string[];action?:"profile"|"outfits"|"stores"|"studio"|"catalog";profile:Profile;prefs:Preferences};
export function selectProducts(p:Profile,f:Preferences):Product[]{
  const avoid=f.avoid.split(/[，,、\s]+/).filter(Boolean);
  if(/褶皱|皱/.test(f.avoid))avoid.push("亚麻");
  return products.filter(x=>!avoid.some(a=>a.length>1&&`${x.name} ${x.fabric}`.includes(a))).filter(x=>p.presentation!=="男装"||x.gender.includes("男")||x.gender.includes("中性")).filter(x=>p.presentation!=="女装"||x.gender.includes("女")||x.gender.includes("中性")).map(x=>({x,score:x.styles.filter(s=>f.styles.includes(s)).length*3+(x.season.includes(f.season)?2:0)})).sort((a,b)=>b.score-a.score).map(x=>x.x);
}
export function advise(input:string,profile:Profile,prefs:Preferences):StylistReply {
  const q=input.trim().slice(0,1000),p={...profile},f={...prefs,styles:[...prefs.styles]};const changes:string[]=[];
  const budget=q.match(/(?:预算|最多|不超过|控制在|大概|大约)\s*[¥￥]?\s*(\d{2,5})(?:\s*[-到至~]\s*(\d{2,5}))?/i)||q.match(/(\d{2,5})\s*(?:元|块|人民币)/);
  if(budget){const n=Number(budget[2]||budget[1]);f.budget=Math.min(50000,Math.max(200,n));changes.push(`整套预算 ¥${f.budget}${n<200?"（当前方案最低按 ¥200 规划）":""}`);}
  const rules:[keyof Profile,RegExp][]=[["height",/身高\s*(\d{3}(?:\.\d+)?)/],["weight",/体重\s*(\d{2,3}(?:\.\d+)?)/],["bust",/胸围\s*(\d{2,3})/],["waist",/腰围\s*(\d{2,3})/],["hip",/臀围\s*(\d{2,3})/]];
  const invalid:string[]=[];
  const ranges:Record<string,[number,number]>={height:[100,230],weight:[25,250],bust:[40,200],waist:[35,200],hip:[40,220]};
  rules.forEach(([field,re])=>{const m=q.match(re);if(m){const label=field==="height"?"身高":field==="weight"?"体重":field==="bust"?"胸围":field==="waist"?"腰围":"臀围";let n=Number(m[1]);if(field==="weight"&&/体重\s*\d+(?:\.\d+)?\s*斤/.test(q))n/=2;const [min,max]=ranges[field];if(n<min||n>max){invalid.push(label);return;}p[field]=String(n);changes.push(`${label} ${n} ${field==="weight"?"kg":"cm"}`);}});
  if(/男装|男生|男士/.test(q)){p.presentation="男装";changes.push("男装方向");}else if(/女装|女生|女士/.test(q)){p.presentation="女装";changes.push("女装方向");}
  const occasions:[[RegExp,string,string],...Array<[RegExp,string,string]>]=[[/通勤|上班|办公室/,"日常通勤","简约通勤"],[/面试|正装|正式/,"正式场合","简约通勤"],[/约会|聚会/,"约会聚会","温柔清新"],[/校园|上课|学生/,"校园学习","松弛休闲"],[/旅行|出游|周末/,"周末出游","松弛休闲"]];
  for(const [re,occasion,style] of occasions)if(re.test(q)){f.occasion=occasion;f.styles=[style];changes.push(occasion);break;}
  if(/法式|复古/.test(q))f.styles=["法式复古"];
  if(/运动|街头/.test(q))f.styles=["街头运动"];
  if(/中性|利落/.test(q))f.styles=["利落中性"];
  if(/夏天|夏季|怕热|透气/.test(q))f.season="夏季";else if(/冬天|冬季|保暖|怕冷/.test(q))f.season="冬季";
  const rejects=[...q.matchAll(/(?:不要|不穿|不喜欢|避开|不想要|不接受)([^，。,；;！!？?\n]{1,14})/g)].map(m=>m[1].replace(/(?:的衣服|的款式|款式)$/,""));
  if(rejects.length){f.avoid=[...new Set([...f.avoid.split(/[，,、]/).filter(Boolean),...rejects])].join("、");changes.push(`避开 ${rejects.join("、")}`);}
  if(/宽松/.test(q)&&!/不要宽松|不喜欢宽松/.test(q))p.fit="宽松";
  if(/便宜一点|降预算|省一点/.test(q)){f.budget=Math.max(200,Math.round(f.budget*.8));changes.push(`预算调至 ¥${f.budget}`);}
  const selected=selectProducts(p,f).slice(0,3).map(x=>x.id);
  let text="",questions:string[]=[],action:StylistReply["action"];
  if(/精选衣橱|品牌模特图|试穿清单/.test(q)){text="一起看精选衣橱吧。每件都能查看品牌图片、面料说明和测评出处；喜欢的可以收藏，对比后导出试穿清单。当前没有实时售价，因此不会把参考商品当作已确认的预算内现货。";questions=["按预算重新搭配","帮我看面料","打开附近好店"];action="catalog";}
  else if(/面料|材质|扎|起球|羊绒|羊毛|亚麻|棉/.test(q)&&!changes.length&&!/测评|评价|口碑/.test(q)){
    if(/羊绒|羊毛|起球|扎/.test(q)){text="我会先看你是不是要贴身穿，再看洗护习惯。羊绒和羊毛的名称本身，不能证明它一定不扎或不起球。\n\n选的时候看三件事：完整成分标签、穿几次后的反馈、洗护要求。怕扎的话，先用薄内搭隔开，并在颈侧和手臂试触。下面的官方资料能核实材质名称，但完整比例与实时售价仍需到商品页确认。";questions=["我怕扎，想要好打理","帮我看真实测评","预算800元，想要保暖通勤"];}else{text="如果你喜欢松弛的纹理，亚麻可以考虑；如果你希望衣服整天都平整，我会先问清楚你对褶皱的接受程度。棉、混纺或羊毛也不能只凭名字判断厚度和触感。\n\n点开商品，我把已核实的材质信息、需要留意的地方和试穿检查项放在一起了。纤维比例未披露时，我不会替商家补一个数字。";questions=["不接受明显褶皱","我想看面料和洗护","更适合通勤的款式"];} }
  else if(/测评|评价|小红书|抖音|口碑/.test(q)){text="我建议先按“品牌＋具体款名或货号＋起球／缩水／试穿”查，再对比不同身材的反馈。\n\n精选卡里有官方出处、已找到的历史参考和小红书／抖音搜索入口。历史同系列视频不等于当季同款测评；尚未读到的笔记与评论，我不会概括成好评率。你可以把具体商品名称发给我，或者在详情里直接切换检索重点。";questions=["看看羊绒的测评出处","我想查看精选衣橱","帮我列试穿检查项"];}
  else if(/尺码|显瘦|显高|梨形|合身|试穿检查/.test(q)){text=`我会把重点放在比例和活动空间上。${p.height?`你记录的身高是 ${p.height} cm，`:'身高还没填写，'}单凭身高体重都不能确定尺码。\n\n上衣检查肩线、扣上后的胸围和抬手是否拉扯；裤子试坐、抬腿，分别检查腰和臀。若想线条更清楚，可以试试适度收短的上衣与垂直感下装，不需要把自己塞进偏小尺码。`;questions=["去完善身材档案","查看3D人台","按这些条件生成搭配"];action="profile";}
  else if(/附近|门店|商圈|位置|库存/.test(q)){text="可以。先在“附近好店”里选城市或使用当前位置，再用地图查看门店。带上喜欢的款号，电话确认尺码、颜色和库存，会比只看评分更省时间。\n\n目前没有商家授权的实时库存数据，我不会把未确认的库存写成有货。";questions=["打开附近好店","先整理我的试穿清单"];action="stores";}
  else if(/3d|人台|模特|立体/i.test(q)){text="我把展示换成了细节更完整的实体人台风格，可以转到侧面和背面看轮廓。商品详情里另有品牌官方模特图。\n\n三维服装是通用展示模型，不能当作某件商品的精确复刻，也不预测实际尺码是否合身。";questions=["打开3D试衣间","先看品牌模特图"];action="studio";}
  else {
    const seasonal=f.season==="冬季"?"优先留出外套和内搭的预算，厚度与叠穿空间比装饰更重要。":f.season==="夏季"?"先把透气与活动余量安排好，再用配色完成整体。":"先用一件轮廓清楚的上装配简单下装，颜色控制在两到三种。";
    text=`${changes.length?`记下了：${changes.join("，")}。`:`我按你当前的 ${f.occasion}、整套 ¥${f.budget} 来考虑。`}\n\n${seasonal}${p.fit==="宽松"?"你偏好宽松，我会保留肩线、袖口或裤脚其中一处的利落感。":"合身以抬手、坐下都自在为前提。"}${f.avoid?`你提到的 ${f.avoid} 会作为避开条件。`:""}\n\n我会先给你少量方向，说明为什么选。精选商品暂未核实实时售价，不能声称它们一定在预算内；整套搭配页则会按你的预算拆分购买计划。`;
    questions=["按这些条件生成搭配","想便宜一点","先看看面料和测评"];action="outfits";
  }
  if(invalid.length)text=`${invalid.join("、")}的数值超出当前档案范围，暂未写入。请检查单位：身高三围用厘米，体重可用公斤或斤。\n\n${text}`;
  return {text,questions,productIds:selected,action,profile:p,prefs:f};
}
