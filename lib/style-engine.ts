export type Profile = { height: string; weight: string; bust: string; waist: string; hip: string; face: string; hair: string; appearance: string; fit: string; presentation: string };
export type Preferences = { budget: number; styles: string[]; occasion: string; season: string; colors: string; avoid: string };
export type Outfit = { id: string; variant: number; style: string; title: string; reason: string; items: { name: string; price: number }[]; total: number; fitNote: string };
const sets: Record<string, string[]> = {
  "简约通勤": ["燕麦短外套与奶油白内搭", "深咖垂坠阔腿裤", "深棕简洁乐福鞋", "小巧结构感肩包"],
  "松弛休闲": ["奶油白宽松衬衫", "浅灰直筒长裤", "米白低帮休闲鞋", "轻便帆布托特包"],
  "法式复古": ["条纹棉质针织衫", "直筒牛仔裤", "复古便鞋", "简约帆布包"],
  "街头运动": ["圆领棉质卫衣", "束脚运动裤", "运动鞋", "棒球帽"],
  "温柔清新": ["棉质开衫", "垂坠半裙", "轻便平底鞋", "轻巧单肩包"],
  "利落中性": ["挺括棉质衬衫", "宽松直筒裤", "简约休闲鞋", "几何斜挎包"]
};
export function makeQuery(p: Profile, f: Preferences) {
  const h = Number(p.height);
  const proportions = Number(p.hip) && Number(p.bust) && Number(p.hip) - Number(p.bust) > 8 ? "下身曲线较明显" : Number(p.waist) && Number(p.hip) && Number(p.hip) - Number(p.waist) > 25 ? "腰臀差较明显" : "";
  return [h >= 100 && h <= 230 ? `${Math.round(h / 5) * 5}cm左右` : "", proportions, p.presentation === "不限" ? "" : p.presentation, p.face === "不确定" ? "" : p.face, p.hair, f.styles.join(" "), f.season, "穿搭参考"].filter(Boolean).join(" ").slice(0, 180);
}
export function recommend(p: Profile, f: Preferences): Outfit[] {
  const budget = Math.min(50000, Math.max(200, Math.floor(Number(f.budget) || 800)));
  const styles = f.styles.filter(s => sets[s]); if (!styles.length) styles.push("简约通勤");
  const palette: Record<string, string> = { "中性色": "米白、灰与深棕", "暖色系": "奶油白、驼色与砖红", "冷色系": "浅灰、雾蓝与藏青", "亮色点缀": "中性底色搭配一件亮色配件" };
  const fit = p.fit === "宽松" ? "选择适度宽松廓形，肩线与袖长仍需合适。" : p.fit === "修身" ? "尝试略收腰的版型，坐下和抬手时保留活动余量。" : "以合身为起点，试穿时检查肩线、胸围和裤腰。";
  const ratio = Number(p.hip) && Number(p.bust) && Number(p.hip) - Number(p.bust) > 8 ? "上下装可以尝试不同尺码，优先保证臀围活动空间。" : Number(p.waist) && Number(p.hip) && Number(p.hip) - Number(p.waist) > 25 ? "优先试穿可调腰围裤装，检查腰臀两处的贴合度。" : "不同品牌尺码不一致，请对照每件商品的尺码表。";
  const face = p.face === "圆脸" ? "可尝试敞开领口形成纵向线条。" : p.face === "长脸" ? "可尝试圆领与适度横向纹理。" : p.face === "方脸" ? "可尝试柔和领口和有垂感的面料。" : "领口形状可根据个人喜好试穿比较。";
  const avoid = f.avoid.split(/[，,、;；\s]+/).filter(Boolean);
  return [0, 1, 2].map(i => {
    const style = styles[i % styles.length]; let items = [...sets[style]];
    if(p.presentation==="男装"&&style==="简约通勤")items=["午夜蓝衬衫式外套与象牙白内搭","灰褐直筒长裤","米白简洁休闲鞋","深色简约通勤包"];
    if (p.presentation === "男装" || p.presentation === "中性") items[1] = items[1].replace("垂坠半裙", "垂坠直筒裤");
    if (f.season === "夏季") items[0] = style === "街头运动" ? "透气棉质短袖" : "透气短袖衬衫";
    if (f.season === "冬季") items[0] = "保暖棉服与棉质打底";
    if (f.occasion === "正式场合") { items[1] = "垂坠西装长裤"; items[2] = "简洁正式便鞋"; if (f.season !== "冬季") items[0] = "合身西装与衬衫"; }
    if (f.occasion === "周末出游" || f.occasion === "校园学习") items[2] = "便于步行的休闲鞋";
    if (i === 1 && styles.length === 1 && f.occasion !== "正式场合") items[1] = "舒适直筒长裤";
    if (i === 2 && styles.length === 1) items[3] = "轻巧通勤背包";
    const defaults = ["按避开条件另选的上装", "按避开条件另选的下装", "按避开条件另选的鞋履", "按避开条件另选的配件"];
    items = items.map((name, n) => avoid.some(term => name.includes(term) || (term.includes("裙") && name.includes("裙"))) ? defaults[n] : name);
    const limit = Math.floor(budget * [0.85, 0.95, 1][i]); const weights = f.season === "冬季" ? [.46, .24, .23, .07] : [.35, .3, .25, .1];
    const prices = weights.map(w => Math.floor(limit * w)); prices[3] += limit - prices.reduce((a, b) => a + b, 0);
    return { id: `look-${i}`, variant: i, style, title: ["把日常穿得刚刚好", "留一点自在的余地", "简单，也可以很出彩"][i], items: items.map((name, j) => ({ name, price: prices[j] })), total: limit,
      reason: `${f.occasion}以${style}为基础，采用${palette[f.colors] || palette["中性色"]}。${Number(p.height) && Number(p.height) < 160 ? "可尝试短上装与高腰线，调整视觉比例。" : "通过上下装的长短关系调整比例。"}${face}`,
      fitNote: `${fit}${ratio}${p.appearance ? ` 你的补充要求：${p.appearance}。可在试穿时逐项核对。` : ""}${avoid.length ? ` 选购时排除：${f.avoid}；请核对实际材质标签。` : ""}` };
  });
}
