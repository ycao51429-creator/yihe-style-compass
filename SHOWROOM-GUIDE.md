# 白模橱窗、图片试穿与比价接入

## 当前版本

前端已在 GitHub Pages 构建中接入。访客不需要登录，即可使用男女纯白无五官人台、拖入衣服卡片或本地 JPG/PNG/WebP、十项尺寸调整、通用服装预览、面料资料、敏感项文字匹配、商品链接与展示卡导出。手机使用“选择衣服 / 上传图片”和“试穿”按钮。

顾问“当前搭配”的“送入试衣橱窗”会带入文字计划；精选商品卡可“加入试衣橱窗”。文字计划不附造假的商品图、成分或款号。3D 中的衣服是通用款式，不复刻商品，不执行布料物理仿真。鞋包可加入清单，但尚无本地 3D 网格。AI 服务未接入时显示明确状态，不生成假结果。

可调整：身高、胸围、腰围、臀围、肩宽、臂长、内侧腿长、大腿围、小腿围、颈围。数值用于视觉比例，未经过人体扫描或裁缝精度校准。极端组合由模型约束到可展示范围。切换男女模特会恢复对应示例尺寸；切换网站栏目保留本次试衣内容；刷新页面会清空。清除个人数据同时清除上传图、试衣内容和尺寸。

四类信息在网页中与人台并列，导出 PNG 时围绕人台排列。信息针对当前选中单品，切换衣服查看对应资料。PNG 不提供可点击购物链接，链接保留在网页中。

## AI 试穿：已经实现接口，尚未启用生产服务

前端 `lib/showroom-client.ts`，服务端 `lib/showroom-service.ts`。支持创建任务、签名任务凭证、轮询、错误提示、取消等待、改动时丢弃旧结果、多件衣服逐件生成。取消等待不会撤销已经提交给供应商的任务，可能仍消耗额度。

适配的是 [FASHN Try-On Max 官方 API](https://docs.fashn.ai/api-reference/tryon-max)：`POST /v1/run` 使用 `model_name: tryon-max`，传入人台截图和商品图，然后请求 `/v1/status/:id`。输出为二维图片，不能在生成图中旋转。模型主要针对人物照片；**纯白人台的保留程度和逐件叠穿准确率尚需真实账号试验，当前未进行付费实测**。不能承诺精确复制图案、真实合身或完整保留之前衣服。

部署方式：

1. 使用现有 Node 依赖，或先 `npm ci`。
2. 在 `wrangler.showroom.jsonc` 检查 Worker 名称、允许访问的站点 Origin、速率限制 namespace。保留 `TRYON_ENABLED: false`，直到密钥、消费额度和测试准备就绪。
3. 使用 Cloudflare 登录和 Secret：

   ```powershell
   node node_modules/wrangler/bin/wrangler.js login
   node node_modules/wrangler/bin/wrangler.js secret put FASHN_API_KEY --config wrangler.showroom.jsonc
   node node_modules/wrangler/bin/wrangler.js deploy --config wrangler.showroom.jsonc
   ```

4. 在部署环境将 `TRYON_ENABLED` 改为字符串 `true`。没有 Key、开关或限流绑定时，接口返回 503。
5. 将前端 `public/runtime-config.json` 的 `tryOnEndpoint` 设置为实际 HTTPS 地址，例如 `https://YOUR-WORKER.YOUR-ACCOUNT.workers.dev/api/tryon`，重新 `node scripts/build-pages.mjs`，提交发布 `docs`。
6. 使用一件清晰商品图先测：接受数据发送 → 生成 → 返回结果 → 修改尺寸应清除旧结果；拒绝、超时、服务失败不能显示为成功。

现有 Cloudflare 应用也可直接使用 `app/api/tryon/route.ts` 与 `app/api/offers/route.ts`，并提供相同的环境绑定。GitHub Pages 本身不能执行服务端接口。

当前限流为每个来源 IP 每分钟约 6 次提交。该绑定是分地区的近似限流，不是全局账单硬上限；共享出口也可能一起受限。[Cloudflare 文档](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)说明了其限制。公开付费服务应配合供应商预算上限、用户身份与全局额度；Origin 校验不等于身份认证。

## 自动比价：需要真实授权报价源

实现了查询和排序，尚没有商家数据账号。设置服务端 `PRICE_FEED_URL`（你拥有或获授权的 HTTPS 查询服务）及可选 `PRICE_FEED_TOKEN` Secret。前端 `offersEndpoint` 指向 `/api/offers`。输入仅含商品名、款号、尺码、颜色，不发送身材、图像和聊天。

服务端向报价源 GET 发送 `name`、`sku`、`size`、`variant` 参数，期望响应：

```json
{
  "offers": [{
    "platform": "授权商家名称",
    "title": "完整商品名称",
    "sku": "实际款号",
    "size": "M",
    "variant": "09 黑色",
    "price": 199,
    "shipping": 0,
    "currency": "CNY",
    "url": "https://YOUR-MERCHANT.example/product/123",
    "checkedAt": "2026-11-03T09:00:00Z",
    "match": "exact"
  }]
}
```

以上仅为协议示例，不是商品报价。运费不明确填 `null`，类似款填 `similar`。只有款号、颜色、尺码完全一致、价格有效、运费已知、更新时间在过去 24 小时内的人民币报价才能排名。条件不齐或已过期仍展示但不参与排名。文案为“本次可比报价最低”，不宣称全网最低价；实际库存、优惠资格和结算价需在商家核对。

品牌商品页为已有资料链接。淘宝、京东、抖音按钮是搜索入口，不是自动抓取、找到同款或现货证明。未接入数据时不得把预算金额、旧价格或搜索链接当作自动比价结果。

## 数据和素材

- 上传图片限定 3MB，浏览器重新编码、缩放到最长边 1280px，未开启 AI 时不上传、不写入 localStorage。
- AI 只有在访客勾选同意并点击生成后发送人台截图和服装图片；不发送定位或聊天。多件衣服逐件调用可能增加消耗。中间结果作为下一次输入。
- 供应商处理和保留政策参阅 [FASHN 数据隐私说明](https://docs.fashn.ai/api-overview/data-retention-privacy)。不得承诺取消等待即删除服务商数据。上线前应核实供应商当时的条款。
- 服务器不主动记录图像或对话，任务凭证 15 分钟过期；实际部署平台访问日志需由运营方检查。
- 服装图片来自可追溯品牌系列资料，部分并非该 SKU 专属照片。优先上传清晰单品图进行 AI 试穿。
- 面料提醒根据资料和用户避开项作文字匹配，不能从照片判断成分或诊断过敏。“没有匹配”不意味着安全保证。
- 人台基于 CC0 网格，改为无五官头部、白色表面、柔化细节与黑色底座。来源与许可见 [models/SOURCES.md](public/models/SOURCES.md)。参考截图没有被作为网站商品图发布。

## 验证

`node --experimental-strip-types tests/showroom-checks.mjs` 验证拖入数据、服装互斥、同款报价筛选、Origin、同意状态、未配置服务、签名任务、限流、上游失败和响应校验。供应商调用采用模拟响应，不证明生产服务已连通。`node scripts/build-pages.mjs` 构建公开前端。启用前还必须用真实账号测试白模兼容性、商品保真和费用。
