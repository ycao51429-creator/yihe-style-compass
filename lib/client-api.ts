declare const __YIHE_STATIC__: boolean;
export const isStaticDeployment = typeof __YIHE_STATIC__ !== "undefined" && __YIHE_STATIC__;

/** Pages builds run locally in the browser and never send profiles to a remote API. */
export async function discoveryRequest(body: Record<string, unknown>, signal?: AbortSignal): Promise<Response> {
  if (isStaticDeployment) {
    const message = body.action === "inspiration"
      ? "当前为独立网页版。自动检索尚未接通，请使用下方百度或小红书入口查找穿搭参考。"
      : body.action === "stores"
        ? "当前为独立网页版。请使用高德地图入口查询附近服装店，评价和库存请在原平台或向门店核对。"
        : "当前为独立网页版，尚未连接商家授权数据，请联系门店核对评价与库存。";
    return new Response(JSON.stringify({ message, code: "STATIC_SITE_NO_BACKEND" }), { status: 503, headers: { "Content-Type": "application/json" } });
  }
  return fetch("/api/discover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
}
