export type Services = { AMAP_WEB_KEY?: string; TAVILY_API_KEY?: string; MERCHANT_DATA_URL?: string; MERCHANT_API_TOKEN?: string };
type Result = { status: number; data: any };
const result = (status: number, data: any): Result => ({ status, data });
const string = (v: unknown) => typeof v === "string" ? v : "";
const numeric = (v: unknown) => (typeof v === "string" && v.trim() !== "" || typeof v === "number") && Number.isFinite(Number(v)) ? Number(v) : null;
async function jsonFetch(url: string, init?: RequestInit) {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error("upstream"); return r.json() as Promise<any>;
}
export async function discover(input: any, services: Services): Promise<Result> {
  if (!input || typeof input !== "object") return result(400, { message: "请填写查询条件。" });
  const fetchedAt = new Date().toISOString();
  if (input.action === "merchant") {
    if (typeof input.storeId !== "string" || !/^[a-zA-Z0-9_-]{3,80}$/.test(input.storeId)) return result(400, { message: "门店标识无效。" });
    if (!services.MERCHANT_DATA_URL) return result(503, { message: "尚未连接该门店的授权评价与库存服务，请联系门店核对。", code: "MERCHANT_NOT_CONFIGURED" });
    try {
      const url = new URL(services.MERCHANT_DATA_URL);
      if (url.protocol !== "https:") throw new Error("configuration");
      url.searchParams.set("amap_id", input.storeId);
      const data = await jsonFetch(url.toString(), { headers: services.MERCHANT_API_TOKEN ? { Authorization: `Bearer ${services.MERCHANT_API_TOKEN}` } : {}, redirect: "error" });
      if (data.store_id !== input.storeId) throw new Error("store-mismatch");
      const updatedAt = string(data.updated_at); const time = Date.parse(updatedAt);
      const fresh = Number.isFinite(time) && Date.now() - time <= 15 * 60000 && time <= Date.now() + 60000;
      const sourceUrl = /^https:\/\//.test(string(data.source_url)) ? data.source_url : null;
      const inventory = (Array.isArray(data.inventory) ? data.inventory : []).slice(0, 30).map((item: any) => ({ sku: string(item.sku).slice(0, 100), name: string(item.name).slice(0, 100), size: string(item.size).slice(0, 40), color: string(item.color).slice(0, 40), quantity: fresh && sourceUrl && Number.isInteger(item.quantity) && item.quantity >= 0 ? item.quantity : null, price: numeric(item.price) !== null && Number(item.price) >= 0 ? Number(item.price) : null })).filter((item: any) => item.sku && item.name);
      const rating = numeric(data.review?.rating); const count = numeric(data.review?.count); const reviewUrl = string(data.review?.source_url);
      return result(200, { storeId: input.storeId, inventory, fresh: fresh && !!sourceUrl, updatedAt: Number.isFinite(time) ? updatedAt : null, sourceUrl, review: /^https:\/\//.test(reviewUrl) && rating !== null && rating >= 0 && rating <= 5 ? { rating, count: count !== null && count >= 0 ? Math.floor(count) : null, sourceUrl: reviewUrl } : null, fetchedAt });
    } catch { return result(502, { message: "门店数据暂不可用，尚不能确认库存，请联系商家。" }); }
  }
  if (input.action === "inspiration") {
    if (typeof input.query !== "string" || input.query.trim().length < 2 || input.query.length > 180) return result(400, { message: "穿搭关键词应为 2—180 个字符。" });
    if (!services.TAVILY_API_KEY) return result(503, { message: "自动检索尚未连接搜索服务。你可以先使用下方百度或小红书入口查找真实参考。", code: "SEARCH_NOT_CONFIGURED" });
    try {
      const data = await jsonFetch("https://api.tavily.com/search", { method: "POST", headers: { Authorization: `Bearer ${services.TAVILY_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: input.query.trim(), search_depth: "basic", max_results: 6, include_answer: false, include_images: false }) });
      const results = (Array.isArray(data.results) ? data.results : []).filter((r: any) => /^https?:\/\//i.test(string(r.url))).map((r: any) => ({ title: string(r.title).slice(0, 200), url: r.url, description: string(r.content).slice(0, 280), source: new URL(r.url).hostname, fetchedAt }));
      return result(200, { results, fetchedAt });
    } catch { return result(502, { message: "搜索服务暂时不可用，请稍后重试或使用外部搜索入口。" }); }
  }
  if (input.action !== "stores") return result(400, { message: "不支持的查询类型。" });
  const radius = Number(input.radius); if (![1000, 3000, 5000, 10000].includes(radius)) return result(400, { message: "请选择有效的附近范围。" });
  const city = string(input.city).trim();
  if (city.length > 80) return result(400, { message: "地区名称过长。" });
  if (input.coords && (typeof input.coords.lat !== "number" || typeof input.coords.lon !== "number" || !Number.isFinite(input.coords.lat) || !Number.isFinite(input.coords.lon) || Math.abs(input.coords.lat) > 90 || Math.abs(input.coords.lon) > 180)) return result(400, { message: "位置坐标无效，请重新定位。" });
  if (!input.coords && city.length < 2) return result(400, { message: "请提供城市商圈或当前位置。" });
  if (!services.AMAP_WEB_KEY) return result(503, { message: "门店查询尚未连接地图服务。你可以使用左侧高德地图入口查找门店与评价；库存仍需向商家确认。", code: "MAP_NOT_CONFIGURED" });
  const amap = async (path: string, params: Record<string, string>) => {
    const u = new URL(`https://restapi.amap.com/${path}`); u.search = new URLSearchParams({ ...params, key: services.AMAP_WEB_KEY! }).toString();
    const data = await jsonFetch(u.toString()); if (data.status !== "1") throw new Error("amap"); return data;
  };
  try {
    let location: string; let region = city;
    if (input.coords) {
      // Browser coordinates are WGS84; convert using the same provider before GCJ02 POI queries.
      const converted = await amap("v3/assistant/coordinate/convert", { locations: `${input.coords.lon.toFixed(6)},${input.coords.lat.toFixed(6)}`, coordsys: "gps" });
      location = string(converted.locations).split(";")[0]; if (!location) throw new Error("coordinate");
      try { const reverse = await amap("v3/geocode/regeo", { location, extensions: "base" }); const a = reverse.regeocode?.addressComponent; region = [string(a?.province), string(a?.city), string(a?.district)].filter(Boolean).join(" "); } catch { region = "当前位置"; }
    } else {
      const geo = await amap("v3/geocode/geo", { address: city }); location = string(geo.geocodes?.[0]?.location);
      if (!location) return result(200, { stores: [], region: city, fetchedAt });
      region = string(geo.geocodes?.[0]?.formatted_address) || city;
    }
    const data = await amap("v5/place/around", { location, radius: String(radius), types: "061100", sortrule: "distance", page_size: "20", show_fields: "business" });
    const stores = (Array.isArray(data.pois) ? data.pois : []).map((p: any) => {
      const rawRating = numeric(p.business?.rating); const distance = numeric(p.distance);
      return { id: string(p.id), name: string(p.name), address: [p.pname, p.cityname, p.adname, p.address].map(string).filter(Boolean).join(" "), distance: distance !== null && distance >= 0 ? distance : null, rating: rawRating !== null && rawRating >= 0 && rawRating <= 5 ? rawRating : null, hours: string(p.business?.opentime_today), phone: string(p.business?.tel).split(";")[0], mapUrl: `https://uri.amap.com/marker?position=${encodeURIComponent(string(p.location))}&name=${encodeURIComponent(string(p.name))}&src=yihe&coordinate=gaode&callnative=0`, inventoryStatus: "unknown", source: "高德地图", fetchedAt };
    }).filter((s: any) => s.id && s.name);
    return result(200, { stores, region, fetchedAt });
  } catch { return result(502, { message: "地图服务暂时不可用，请稍后重试，或打开高德地图直接搜索。" }); }
}
