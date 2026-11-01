export type Product = { id:string; name:string; brand:string; category:string; gender:string; season:string[]; styles:string[]; fabric:string; composition:string; advantage:string; caution:string; care:string; pairing:string; image:string; imagePosition:string; imageLabel:string; imageSource?:string; url:string; source:string; sourceDate:string; query:string; checkedAt:string };
const linen="https://www.uniqlo.com/cn/news/topics/2026040801/";
const knit="https://www.uniqlo.com/cn/news/sp/topics/2025091801/";
const cashmere="https://www.uniqlo.com/cn/news/topics/2026102801/";
const product=(id:string)=>`https://www.uniqlo.cn/product-detail.html?productCode=${id}`;
const shared={brand:"UNIQLO 优衣库",checkedAt:"2026-11-01",imageLabel:"品牌官方系列模特图",composition:"专题未披露完整纤维比例；下单前核对商品成分标签。"};
export const products:Product[]=[
  {...shared,id:"linen-box",name:"法国麻半开领箱型衬衫",category:"衬衫",gender:"女装 / 中性",season:["夏季","春秋"],styles:["松弛休闲","利落中性"],fabric:"亚麻",advantage:"箱型轮廓与双口袋，适合把衬衫穿得轻松一些。",caution:"亚麻的自然褶皱会参与整体观感；追求一整天平整时，先确认自己是否接受。",care:"按洗标清洗；浅色款试穿时观察透光与内搭颜色。",pairing:"下装选直筒裤，领口留一点呼吸感；不必再叠加复杂配饰。",image:linen+"img/850T_260408CXMEHk.jpg",imagePosition:"53% center",url:product("u0000000070386"),source:linen,sourceDate:"2026-04-08",query:"优衣库 法国麻 半开领 箱型 衬衫 短袖 测评"},
  {...shared,id:"linen-blazer",name:"UNIQLO:C 法国麻西装",category:"外套",gender:"女装",season:["夏季","春秋"],styles:["简约通勤","法式复古"],fabric:"亚麻",advantage:"把外套的利落轮廓与亚麻的休闲感放在一起，适合不需要正装的通勤。",caution:"不把这种松弛感当作正式礼服的替代；实际挺括度、里料和厚度需看实物。",care:"先读洗标，尤其确认西装是否可水洗；不要直接套用衬衫洗护方式。",pairing:"用纯色内搭和同色系长裤收住层次，一件细配饰已经足够。",image:linen+"img/850T_260408C7xQP1.jpg",imagePosition:"24% center",url:product("u0000000069732"),source:linen,sourceDate:"2026-04-08",query:"优衣库 C 法国麻 西装 测评"},
  {...shared,id:"linen-shirt",name:"法国麻衬衫 · 长袖",category:"衬衫",gender:"男装",season:["夏季","春秋"],styles:["松弛休闲","简约通勤"],fabric:"亚麻",advantage:"适合用一件衬衫完成干净的日常搭配，也可以敞开作轻外搭。",caution:"肩线、袖长比只看 S/M/L 更有用；浅色与深色的透光观感可能不同。",care:"洗后整理衣领与门襟，是否熨烫及温度请按实际洗标。",pairing:"藏青配米白裤，白色配深色裤；鞋子保持干净简洁。",image:linen+"img/850T_260408hYb6wZ.jpg",imagePosition:"82% center",url:product("u0000000068866"),source:linen,sourceDate:"2026-04-08",query:"优衣库 男装 法国麻 长袖 衬衫 测评"},
  {...shared,id:"linen-pants",name:"UNIQLO:C 法国麻长裤",category:"裤装",gender:"女装",season:["夏季","春秋"],styles:["简约通勤","松弛休闲"],fabric:"亚麻",advantage:"同材质套装能让整身更连贯，也适合单独搭简洁上衣。",caution:"重点试坐下、抬腿和走路；腰臀空间与裤长要分别确认。",care:"裤脚是否拖地、浅色是否透，都需要在自然光下看。",pairing:"短一点的上衣或轻轻塞入前衣角，让腰线更清楚。",image:linen+"img/850T_260408C7xQP1.jpg",imagePosition:"35% center",url:product("u0000000069761"),source:linen,sourceDate:"2026-04-08",query:"优衣库 C 法国麻 长裤 测评"},
  {...shared,id:"cashmere-w",name:"羊绒圆领针织衫 · 女装",category:"针织",gender:"女装",season:["冬季","春秋"],styles:["温柔清新","简约通勤"],fabric:"羊绒",advantage:"优先考虑轻暖的叠穿体验，圆领方便与衬衫或外套组合。",caution:"不能仅凭“羊绒”二字判断耐磨程度。试穿时留意扎感，并查看长期起球反馈。",care:"以商品洗标为准，避免把所有羊绒一律当作可机洗。",pairing:"选择安静的中性色，再用一件有结构的下装平衡柔软感。",imageSource:knit,image:knit+"img/mimg_1_m.jpg",imagePosition:"65% center",imageLabel:"品牌针织系列模特图 · 非该 SKU 专属上身图",url:product("u0000000075617"),source:cashmere,sourceDate:"2026-10-28",query:"优衣库 羊绒 圆领 针织衫 女装 起球 测评"},
  {...shared,id:"cashmere-m",name:"羊绒圆领针织衫 · 男装",category:"针织",gender:"男装",season:["冬季","春秋"],styles:["简约通勤","利落中性"],fabric:"羊绒",advantage:"可以用作衬衫之外的通勤选择，外套内的层次更柔和。",caution:"厚薄与版型会随款号和年份变化；旧视频不能直接证明当季质量。",care:"按洗标护理；先检查袖长、下摆与肩部活动空间。",pairing:"深棕或藏青针织配灰色长裤，颜色克制，靠材质形成层次。",imageSource:"https://www.uniqlo.com/cn/news/topics/2026101301/",image:"https://www.uniqlo.com/cn/news/topics/2026101301/img/880T_261012rYsVH6.jpg",imagePosition:"50% center",imageLabel:"品牌羊绒系列上身图 · 具体货号请与商家核对",url:product("u0000000066272"),source:cashmere,sourceDate:"2026-10-28",query:"优衣库 羊绒 圆领 针织衫 男装 测评"},
];
export const editorial={image:knit+"img/mimg_1_m.jpg",source:knit,label:"UNIQLO 官方针织系列造型图 · 2025"};
export const reviewSources=[
  {id:"dy-fabric",platform:"抖音",title:"服装面料与价位选购讨论",author:"Tina面料测评",date:"2024-09-24",url:"https://www.douyin.com/video/7418023472753937721",scope:"旧系列 / 未匹配具体货号",summary:"公开索引包含秋季服装与价格讨论。未取得完整视频及评论，不能据此给当前商品下质量结论。",tags:["亚麻","羊绒","针织"]},
  {id:"bili-cashmere",platform:"哔哩哔哩",title:"羊绒大比拼：不同品牌与价位的区别",author:"闹小姐Tina",date:"2020-01-28",url:"https://www.bilibili.com/video/BV1y7411r711/",scope:"羊绒品类 / 历史资料",summary:"作者简介列出手感、厚度、剪裁与价格等比较维度。可用来建立试穿清单，不能当作本季货号的检测结果。",tags:["羊绒"]},
];
export function searchLinks(query:string){const q=query.trim().slice(0,160);return [
  {label:"小红书",url:`https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(q)}`,hint:"到原平台查笔记与买家体验"},
  {label:"抖音",url:`https://www.douyin.com/search/${encodeURIComponent(q)}`,hint:"到原平台查试穿视频"},
  {label:"全网",url:`https://www.baidu.com/s?wd=${encodeURIComponent(q)}`,hint:"对比不同来源"},
  {label:"哔哩哔哩",url:`https://search.bilibili.com/all?keyword=${encodeURIComponent(q)}`,hint:"查长视频测评"},
];}
