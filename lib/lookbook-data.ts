/**
 * Official editorial photographs, visually checked in Edge on 2026-11-02.
 * Remote originals remain on UNIQLO / Fast Retailing hosts; no images are rehosted.
 * These are styling references, not matched SKU stock, prices or fit guarantees.
 * SG stories are overseas examples: mainland availability must be checked separately.
 */
export type LookbookLook = {
  id: string;
  title: string;
  gender: "男装" | "女装";
  style: string;
  season: string;
  image: string;
  source: string;
  note: string;
  fabric: string;
  sourceDate: string;
  sourceLabel: string;
};

const winter = "https://www.uniqlo.com/cn/news/sp/topics/2026101301/";
const linen = "https://www.uniqlo.com/sg/en/news/sp/topics/2026032601/";
const knit = "https://www.uniqlo.com/cn/news/sp/topics/2025091801/";
const cnLinen = "https://www.uniqlo.com/cn/news/sp/topics/2026040801/";
const staff = (region: string, photo: string) => `https://api.fastretailing.com/ugc/v1/uq/${region}/SR_IMAGES/ugc_stylehint_uq_${region}_photo_${photo}_c-480-640`;
const winterSource = {source: winter, sourceDate: "2026-10-13", sourceLabel: "UNIQLO 中国 · 冬日造型"};
const linenSource = {source: linen, sourceDate: "2026-03-26", sourceLabel: "UNIQLO 新加坡 · 海外实穿参考"};

export const looks: LookbookLook[] = [
  {
    ...linenSource, id: "blue-linen-work", title: "浅蓝衬衫的轻通勤", gender: "女装", style: "简约通勤", season: "夏季",
    image: "https://im.uniqlo.com/global-cms/spa/res6f3520b81e8675993c3fc1d2cd3bb8fcfr.jpg?1774541403902",
    note: "浅蓝与奶油白形成干净层次，深色平底鞋收住整身。空调房可保留长袖。",
    fabric: "亚麻衬衫、麻混纺长裤；具体成分和洗护以当地商品洗标为准。",
  },
  {
    ...winterSource, id: "harbour-knit-layers", title: "把粉色穿得很从容", gender: "男装", style: "简约通勤", season: "春秋",
    image: winter + "img/880T_261012QbRr3R.jpg",
    note: "短外套配宽松牛仔裤，用肩上针织与内搭呼应。粉色只占局部，更容易驾驭。",
    fabric: "舒芙蕾针织、高密度梭织外套、牛仔裤；纤维比例需核对各件洗标。",
  },
  {
    id: "soft-knit-weekend", title: "针织，让周末柔软一点", gender: "女装", style: "温柔清新", season: "冬季",
    image: knit + "img/mimg_1_m.jpg", source: knit, sourceDate: "2025-09-18", sourceLabel: "UNIQLO 中国 · 2025 针织系列",
    note: "米白、浅蓝与棕色都能成为冬季基底。搭牛仔裤轻松，搭同色下装更完整。",
    fabric: "官方针织系列合照，包含多种针织方向；不可仅凭图片确认每件纤维成分。",
  },
  {
    ...winterSource, id: "butter-cashmere-city", title: "城市里的奶油黄", gender: "男装", style: "松弛休闲", season: "冬季",
    image: winter + "img/880T_261012rYsVH6.jpg",
    note: "柔和黄色放在上半身，深色长裤和包袋保持利落。降温时再加外套。",
    fabric: "羊绒针织衫、摇粒绒内里针织裤；此图是系列造型，需核对实际款号。",
  },
  {
    ...linenSource, id: "sand-boxy-weekend", title: "沙色衬衫，松弛有度", gender: "女装", style: "松弛休闲", season: "夏季",
    image: staff("sg", "260305_1849927"),
    note: "敞开短袖衬衫露出白色内搭，长裤把线条接下来。短上装与宽下装互相平衡。",
    fabric: "亚麻箱型衬衫与麻混纺长裤；浅色透光、自然褶皱建议试穿确认。",
  },
  {
    ...linenSource, id: "ivory-grey-clean", title: "白与灰的干净日常", gender: "男装", style: "利落中性", season: "夏季",
    image: staff("sg", "260307_1851077"),
    note: "白衬衫叠白内搭，灰色宽裤自然接住。黑色鞋子给浅色整身一个落点。",
    fabric: "亚麻箱型衬衫、卫裤；上下装材质不同，具体比例见商品标签。",
  },
  {
    ...linenSource, id: "navy-layered-dress", title: "深蓝外搭与白裙", gender: "女装", style: "利落中性", season: "春秋",
    image: staff("kr", "260307_1850336"),
    note: "深蓝短外搭让白裙更有层次，裤装叠穿增加变化。天气温暖时可以减少一层。",
    fabric: "棉麻衬衫式外套、麻混纺连衣裙；不同地区款号和成分可能不同。",
  },
  {
    ...winterSource, id: "coastal-canvas", title: "海边散步的深色层次", gender: "男装", style: "松弛休闲", season: "冬季",
    image: winter + "img/880T_2610123G50DR.jpg",
    note: "用浅色内搭打开深色外套，裤子留一点松量。海边有风时另外确认防风能力。",
    fabric: "棉质帆布外套，领袖有灯芯绒细节；内搭为针织摇粒绒方向。",
  },
  {
    ...linenSource, id: "lilac-sage-dress", title: "淡紫与鼠尾草绿", gender: "女装", style: "温柔清新", season: "夏季",
    image: staff("sg", "260202_1821109"),
    note: "两种低饱和颜色相遇，用腰带整理比例。白色鞋袜让配色保持轻盈。",
    fabric: "亚麻衬衫搭 AIRism 连衣裙；仅作系列组合参考，成分需核对洗标。",
  },
  {
    ...winterSource, id: "library-earth-tones", title: "图书馆里的大地色", gender: "男装", style: "法式复古", season: "冬季",
    image: winter + "img/880T_261013E3Wa5F.jpg",
    note: "棕色裤子与深色针织靠质感区分层次，领口留出内搭。适合慢一点的周末。",
    fabric: "羊毛混纺开衫、美利奴羊毛内搭、灯芯绒裤；各单品成分分别确认。",
  },
  {
    ...linenSource, id: "pink-boxy-shorts", title: "玫瑰粉的夏日活力", gender: "女装", style: "松弛休闲", season: "夏季",
    image: staff("ph", "260312_1854843"),
    note: "粉色外搭与深棕短裤形成对比，白色内搭和运动鞋保持清爽。",
    fabric: "亚麻箱型衬衫与麻混纺短裤；不能把系列图当作当前库存证明。",
  },
  {
    ...linenSource, id: "pink-linen-holiday", title: "淡粉衬衫的假日感", gender: "男装", style: "松弛休闲", season: "夏季",
    image: staff("sg", "260227_1844446"),
    note: "淡粉配深卡其，鞋与手提袋保持白色。长袖随意挽起，让整身少一点拘束。",
    fabric: "亚麻衬衫、麻混纺短裤；手感、透光度和护理方式需实物确认。",
  },
  {
    id: "linen-colour-studio", title: "箱型衬衫的两种表情", gender: "女装", style: "利落中性", season: "夏季",
    image: cnLinen + "img/850T_260408CXMEHk.jpg", source: cnLinen, sourceDate: "2026-04-08", sourceLabel: "UNIQLO 中国 · 亚麻系列",
    note: "沙色适合同色系，玫红适合搭深色下装。宽松箱型可塞一角，也可以自然放下。",
    fabric: "法国麻半开领箱型衬衫；图片含商品与模特拼图，实际成分以款号洗标为准。",
  },
  {
    ...linenSource, id: "blue-shirt-weekend", title: "蓝衬衫与卡其短裤", gender: "男装", style: "松弛休闲", season: "夏季",
    image: staff("sg", "260306_1850700"),
    note: "浅蓝外搭露出深蓝内搭，卡其裤和复古运动鞋自然衔接。适合轻松走走。",
    fabric: "棉麻短袖衬衫与麻混纺短裤；厚度和防晒能力不能仅凭照片判断。",
  },
];
