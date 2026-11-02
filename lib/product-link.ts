import {products} from './shop-catalog';
export type LinkResult={url:string;platform:string;productId:string|null;matchedId:string|null;shortLink:boolean;message:string};
export function parseProductLink(input:string):LinkResult{
  const found=input.match(/https?:\/\/[^\s<>"'【】]+/i);if(!found)throw new Error('请粘贴包含 https:// 的完整商品链接或分享文字。');
  const raw=found[0].replace(/[，。；！？、）》）]+$/g,'');let u:URL;try{u=new URL(raw);}catch{throw new Error('这个链接格式不完整，请重新复制。');}
  if(u.protocol!=='https:'||u.username||u.password)throw new Error('请使用不含账号密码的 HTTPS 商品链接。');
  const h=u.hostname.toLowerCase();const matches=(domain:string)=>h===domain||h.endsWith('.'+domain);
  const platforms:[string,string][]=[['uniqlo.cn','优衣库'],['uniqlo.com','优衣库'],['jd.com','京东'],['tmall.com','天猫'],['taobao.com','淘宝'],['tb.cn','淘宝分享'],['douyin.com','抖音'],['xiaohongshu.com','小红书'],['xhslink.com','小红书分享'],['pinduoduo.com','拼多多'],['yangkeduo.com','拼多多']];
  const platform=platforms.find(([domain])=>matches(domain));if(!platform)throw new Error('暂支持优衣库、淘宝/天猫、京东、抖音、小红书和拼多多的官方域名。可以直接粘贴商品说明文字进行分析。');
  const shortLink=['tb.cn','xhslink.com'].some(matches)||h==='v.douyin.com';
  const productId=(matches('uniqlo.cn')?u.searchParams.get('productCode'):matches('jd.com')?u.pathname.match(/\/(\d+)\.html/)?.[1]:matches('tmall.com')||matches('taobao.com')?u.searchParams.get('id'):matches('yangkeduo.com')?u.searchParams.get('goods_id'):null)||null;
  const matched=products.find(p=>{const a=new URL(p.url);return matches('uniqlo.cn')&&a.searchParams.get('productCode')===productId&&!!productId;});
  ['spm','scm','utm_source','utm_medium','utm_campaign','share_token','shareToken'].forEach(k=>u.searchParams.delete(k));u.hash='';
  return {url:u.href,platform:platform[1],productId,matchedId:matched?.id||null,shortLink,message:matched?'匹配到精选库中的官方资料；价格与库存仍需核实。':shortLink?'已识别分享链接。短链接尚未展开，请打开原平台后补充商品说明。':'已识别平台与链接信息，尚未读取商品页面。请补充下方资料后分析。'};
}
export function assessProduct(input:{name:string;material:string;price:string;size:string},budget:number){
  const price=input.price.trim()?Number(input.price):null;
  if(price!==null&&(!Number.isFinite(price)||price<0||price>1000000))throw new Error('请填写有效的单件价格。');
  const lines:string[]=[];
  if(price!==null)lines.push(price>budget?`这件的录入价格 ¥${price} 已超过整套预算 ¥${budget}，建议先调整预算或找替代款。`:`这件的录入价格约占整套预算 ${Math.round(price/budget*100)}%，购买后还剩 ¥${Math.max(0,budget-price)} 安排其他单品。`);
  if(/麻/.test(input.material))lines.push('资料提到麻：试穿时重点看自然褶皱与透光情况，不能只凭“麻”判断厚度和手感。');
  if(/羊毛|羊绒/.test(input.material))lines.push('资料提到羊毛/羊绒：核对完整纤维比例和洗标，查看穿洗后的起球反馈；贴身穿前确认触感。');
  if(/聚酯|涤纶|锦纶/.test(input.material))lines.push('资料提到化纤：结合织法、厚度和里料看实际触感，不把纤维名称直接当作质量等级。');
  if(!input.material.trim())lines.push('还缺完整面料成分。建议复制商品成分标签，避免仅凭宣传名称判断。');
  if(!input.size.trim())lines.push('还缺尺码表。肩宽、衣长、胸围或腰臀围比单看 S/M/L 更有参考意义。');
  else lines.push('已记录尺码说明；请确认它是衣服的平铺尺寸还是建议人体尺寸，两者不能直接混用。');
  lines.push('以上依据你手动提供的资料，未独立核验商家页面、实时售价或库存。');return lines;
}
