# 模块契约（Round 1 / F1 定稿）

本文件是多人（多 Round 并行 agent）协作的**防冲突契约**：规定文件所有权、import 白名单、冻结接口面。改冻结面必须先改本文件（同一提交内），再改代码。

## 1. import 白名单

| 模块 | 允许 import | 禁止 |
|---|---|---|
| `src/data/**` | （无） | 一切 import；触碰 DOM/localStorage |
| `src/core/state.js` `economy.js` | `data/**`、core 内部 | 视图层；`document`/`window` |
| `src/core/actions.js`（Round 2 新建） | `data/**`、`state.js`、`economy.js`、`save.js` | 视图层；DOM |
| `src/core/save.js` `audio.js`（边界适配器） | `data/**` | 视图层；环境缺失时必须静默降级（保 Node 可测） |
| 视图层 `src/{ui,mall,minigames,fashion,home,partners,research,events}/**` | `core/**`、`data/**`、`ui/dom.js` | 视图目录互相 import |
| `src/app.js`（组合根） | 任意本目录模块 | 被任何模块 import |
| `tests/**` `scripts/**` | `src/data/**`、`src/core/**` | 视图层（DOM 不进 Node 测试） |

跨游戏边界：`games/fashion-mall/**` 不 import 目录外任何文件（见 ARCHITECTURE §7）。

## 2. 冻结接口面

改动下列签名/形状 = 破坏性变更，需先修订本节并评估存档迁移（ARCHITECTURE §5.2）：

- **存档信封**：`{ v:int, savedAt:ms, data:state }`，localStorage 键 `fashion-mall-save-v1` 永不更换。
- **state 形状**：以 `core/state.js#defaultState()` 为准；变更必须同步 `CURRENT_VERSION+1`、新增 `MIGRATIONS[n]`、固化旧档字符串的迁移测试。
- **视图契约**：`render(root: HTMLElement, state, ctx) => dispose | undefined`；`ctx` 至少含 `{ back(), openShop(id), repaint() }`。视图内部计时器/监听器必须经 dispose 释放。
- **动作契约**：`actions.*(state, ...args) => { ok: boolean, reason?: string, toast?: string }`；动作是唯一写 state 的入口（`tick/settle` 内部除外）；动作不触 DOM、不播音效——音效与重绘由调用方视图负责。
- **结算契约**：`settle(state, nowMs)` 是唯一推进 `state.lastTick` 与时间收益的函数；在线/离线共用（ARCHITECTURE §4.2）。
- **注册表一致性**：`SHOPS[].id` ↔ `SHOP_VIEWS` 键一一对应，有测试兜底（ARCHITECTURE §6 第 3 条）。
- **调试句柄**：`window.__FASHION_MALL__ = { state, paint, actions? }`，仅供测试/录屏。

## 3. 文件所有权（Round 2 并行分工的写权限边界）

| 角色 | 独占写权限 | 备注 |
|---|---|---|
| 核心工程（tick/存档/动作层/性能） | `src/app.js`、`src/core/**`、`src/ui/dom.js`（新建）、`tests/save.test.js` | 落地 ARCHITECTURE §3–5、§9；C 维补分 |
| 数值（F3） | `src/data/balance.js`、`docs/ECONOMY.md`、`tests/economy.test.js`、`scripts/bench.mjs`、新增 `scripts/simulate.mjs` | 赏金表 `MINIGAME_PAYOUTS`、`rollNextGoal`、堵 B6 印钞；改公式签名需核心工程会签 |
| 视觉/无障碍（F2） | `src/styles/**`、`docs/DESIGN_SYSTEM.md` | focus-visible、reduced-motion、触控目标、对比度审计；不改 JS 逻辑，视图 class 名变更需通知视图所有者 |
| 叙事/体验（F4） | `src/data/copy.js`、`src/ui/intro.js`、`src/events/randomEvents.js`、`docs/UX_NARRATIVE.md` | 事件微交互、文案收口；奖励数值查 balance 不得内联 |
| 玩法视图 | `src/mall/**`、`src/minigames/**`、`src/fashion/**`、`src/home/**`、`src/partners/**`、`src/research/**` | 改造为契约视图（§2）；赏金一律查表 |

共享文件（`index.html`、`package.json`、`README.md`、`docs/ARCHITECTURE.md`、`docs/SOTA_RUBRIC.md`、本文件）：谁的改动谁提，冲突以架构文档为裁决依据。

## 4. 提交纪律

- 每个逻辑变更单独 commit；提交前 `npm test && npm run bench` 必须通过。
- 新增/修改任何公式 → 同 commit 附断言；新增/修改 state 字段 → 同 commit 附迁移与测试。
- 禁止在视图层出现数值字面量（临时样式尺寸除外）；code review 以 `rg '[0-9]{2,}' src/minigames src/mall` 抽查。
