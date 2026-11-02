# 云端穿搭顾问接入

本仓库现有 GitHub Pages 部署只运行静态前端。新增 `/api/advisor` 是可部署的服务端代码，**提交到 GitHub 不会自动启用云端 AI 或检索**。未配置时接口返回 503，前端应继续提供本地顾问并明确标识。

## 服务端配置

沿用项目的 Cloudflare Worker / Vinext 服务端部署。仅在服务端配置以下变量；不要放入 `VITE_*` 变量、GitHub Pages 文件、浏览器设置或聊天消息。

| 变量 | 内容 |
| --- | --- |
| `ADVISOR_API_KEY` | 所选兼容服务的 API 密钥，作为部署平台 Secret 保存 |
| `ADVISOR_MODEL` | 该服务账号当前可用、支持 JSON 输出的模型 ID；不内置可能过期的模型名称 |
| `ADVISOR_BASE_URL` | 可选，默认 `https://api.deepseek.com`；兼容服务例如 `https://provider.example/v1`，代码追加 `/chat/completions` |
| `ADVISOR_ALLOWED_ORIGIN` | 跨域前端的完整 origin，例如 `https://ycao51429-creator.github.io`，不含仓库路径或末尾斜杠 |
| `TAVILY_API_KEY` | 可选的搜索服务 Secret；没有时云端仍可对话，但清楚显示检索未配置 |

服务端应通过托管平台设置请求频率、每日额度与费用上限；CORS 仅控制浏览器跨域读取，不能替代鉴权或防滥用。对公众开放前需设置平台级限流。本适配器不创建账号、不产生自动定时调用、不把密钥写进代码，也不提供未经配置的公共共享密钥。

## 请求与响应

前端必须先说明发送范围，并取得用户对本轮云端处理的确认。传入 `cloudConsent: true` 表示 UI 已取得确认；服务端无法替代 UI 判断真实同意。

```json
{
  "cloudConsent": true,
  "messages": [
    {"role":"user","content":"预算800，保留我的黑色长裤，换一件不太正式的上衣"}
  ],
  "profile": {"fit":"合身","presentation":"不限"},
  "prefs": {"budget":800,"occasion":"通勤","avoid":"扎皮肤"},
  "search": {"query":"优衣库 法国麻 衬衫 洗后 测评"}
}
```

`search` 为可选字段，只在用户明确查商品或测评时提交品牌、款号、面料等关键词。禁止把完整对话、身高体重三围、地址或联系方式拼成查询；服务端也会拒绝可识别的个人数据与链接。用户粘贴的商品链接不会被服务端直接抓取。

成功响应包含 `mode: "cloud"`、纯文本 `text`、经过 URL 校验的 `sources` 数组、`searchStatus` 与 `capabilities`。来源记录包含 `id/title/url/excerpt/fetchedAt`。`searchStatus` 为 `not-requested/unconfigured/available/unavailable`；`available` 表示搜索服务成功返回，可能没有结果，不代表全文核实。`capabilities.livePrice` 和 `liveInventory` 始终为 `false`。

服务只将搜索服务实际返回且被回复引用的来源传给前端；不信任模型自行生成的 URL。界面须把回复作为文本渲染，把来源链接单独呈现，不使用 `dangerouslySetInnerHTML`。搜索摘录是第三方内容，不能等同于读完小红书笔记、抖音视频或商品详情。模型提示规则降低无依据断言风险，但不能保证模型永不出错；前端应保留“生成建议，重要信息请核对原来源”的提示。

错误返回 `{code,message}`，常见状态：400 输入/同意无效；403 来源不允许；415 非 JSON；503 未配置；502 上游失败或回复结构不完整。前端不要把 502/503 当作正常 AI 答案，允许切回本地规则顾问。

## 数据与请求边界

- 最多 12 条 user/assistant 历史，每条 2000 字，总计 12000 字；整体请求不超过 32 KB。拒绝客户端 system/tool 角色。
- 档案与偏好按白名单发送给模型，不发送照片、定位或任意附加字段。对话中用户主动输入的个人信息仍会随对话发送，所以 UI 应允许先移除不必要内容。
- 仅当明确提交 `search` 时调用 Tavily；搜索请求不包含档案或对话。模型请求与搜索请求在服务端处理；**对话会发送给配置的模型提供商**，不应宣称所有资料仅保留本地。
- 不自行存储对话、不记录正文或密钥。部署平台与模型/搜索提供商可能有其自身日志及数据政策，部署方需按实际配置说明。
- 模型请求 25 秒超时，检索 10 秒超时；禁止自动跟随重定向，限制上游响应体积。两者顺序执行，前端总超时建议 40 秒。
- 供应商地址只来自服务端配置，限定公网 HTTPS；拒绝用户控制的抓取 URL。来源 URL 只作为链接返回，未验证目标页面是否仍可访问。

## 验证

运行 `node --experimental-strip-types tests/advisor-checks.mjs`。测试通过模拟上游验证配置缺失时不联网、请求与来源约束、敏感数据不进入搜索、失败降级、CORS、无效响应。没有使用付费密钥执行线上模型测试。部署者需要用自己配置的账号进行一次实际对话和检索验收，再打开前端云端入口。

协议依据（2026-11-02 核对）：[DeepSeek Chat Completions 官方文档](https://api-docs.deepseek.com/api/create-chat-completion/)、[Tavily Search 官方文档](https://docs.tavily.com/documentation/api-reference/endpoint/search)。

## 连接已发布的 GitHub Pages 前端

1. 用所有者的服务端托管账号部署本项目的 Worker/Vinext 版本，在部署平台录入上述 Secrets，并配置允许来源和限流/费用上限。先验证服务端路由返回正常。
2. 将 `public/runtime-config.json` 的 `advisorEndpoint` 改为部署后的完整 HTTPS 地址，例如 `https://your-service.example/api/advisor`。这只是接口地址，不是密钥。
3. 运行 `npm run build:pages`，提交生成的 docs 内容。发布后前端读取 `runtime-config.json`，显示发送对话与档案的同意开关；默认不勾选。
4. 用户勾选后才调用云端。对话最多发送近期 8 条消息，以及当前计划的单品/保留状态；每条历史截断，照片与定位不进入请求。生成建议不会自动购买。
5. 在商品分析结果中点击“联网查这件的测评”时才传入显式搜索 query。未配置 Tavily、检索失败和模型故障都有清楚的回退状态。外部平台链接继续可用。
6. 关闭或删除 advisorEndpoint 后，前端恢复本地模式。访客也可以随时关闭云端同意开关，取消正在进行的请求。

本轮已完成：类型检查、模拟模型/搜索接口的 66 项服务端测试，以及浏览器中的同意、上下文传递和故障回退测试。尚未完成真实账号生产调用，不能把模拟验证描述为真实 AI 已上线。
