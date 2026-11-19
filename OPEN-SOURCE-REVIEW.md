# GitHub 开源项目调研与采用记录

核查日期：2026-11-19。用途：改进衣合现有 React/TypeScript 网页，为未来商业运营选择可评估的技术方向。

## 本轮实际采用

参考 Sardrobe 的“已有衣物 → 出行清单 → 装箱状态”流程，为衣合独立编写 `components/packing-list.tsx` 与样式。没有复制其实现、图片、组件库、后端或模型权重，没有执行其安装脚本。

衣合的实现沿用现有衣橱数据：仅选已有衣物；按类别显示；日期顺序校验；装箱计数；删除衣橱单品后同步移除；切换栏目保留本次清单；导出 UTF-8 文本；最多 8 件交给现有顾问。清单不写入云端或本地持久存储，刷新前需导出，清除数据会重置清单。出行文本只在用户点击顾问按钮后进入现有对话流程；若已同意云端顾问，则遵循该开关。

## 查看的源码与取舍

| 项目 | 核查内容 | 与衣合的关系 |
|---|---|---|
| [Sardrobe](https://github.com/omarkawach/sardrobe/tree/ae283fdbf40280bcce32aef2def995b9101c0660) | MIT；阅读 `apps/frontend/src/features/packing/domain.ts` 和 `PackingView.tsx` 的数据结构、装箱状态及清单操作 | 本轮参考其功能流程，独立实现浏览器内版本，适合目前静态托管 |
| [AI Closet](https://github.com/zebangeth/ai-closet/tree/bff94bb050add8d579dbe76bd0259b8fb50b23ca) | README 和 MIT LICENSE；移动端数字衣橱及虚拟试衣方向 | 作为后续产品参考；未移植 React Native 客户端，也未照搬 README 中的费用估算 |
| [Google model-viewer](https://github.com/google/model-viewer) | 官方 README、package.json 与 Apache-2.0 LICENSE | 适合展示现成 3D/AR 模型；不能自动完成衣服照片到贴合人体的仿真。本轮保留已有 Three.js 可调比例人台，未引入重复渲染依赖 |
| [IDM-VTON](https://github.com/yisol/IDM-VTON/tree/06ad89ba2f78d77a5ba21d7f7fd392254971fda2) | 官方 README 的推理准备及许可证说明：代码和 checkpoints 为 CC BY-NC-SA 4.0 | 非商业限制不适合直接纳入准备收费的产品；本轮未下载、部署或集成。若未来采用，需另行取得适用商业授权并验证部署和实际效果 |

Sardrobe 源码链接：
- [出行数据结构](https://github.com/omarkawach/sardrobe/blob/ae283fdbf40280bcce32aef2def995b9101c0660/apps/frontend/src/features/packing/domain.ts)
- [清单交互组件](https://github.com/omarkawach/sardrobe/blob/ae283fdbf40280bcce32aef2def995b9101c0660/apps/frontend/src/features/packing/PackingView.tsx)
- [项目许可证](https://github.com/omarkawach/sardrobe/blob/ae283fdbf40280bcce32aef2def995b9101c0660/LICENSE)

## 以后接入时的边界

仓库代码许可证、模型权重许可证、图片/数据集授权分别核对。源码可使用不表示其依赖服务免费、商品资料可商用或模型质量已验证。当前没有新增付费服务、后台密钥、云端账户或真实 AI 试穿调用。
