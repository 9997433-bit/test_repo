# 时尚百货城 · SOTA 架构说明（Round 2 / F1 复评修订）

本文档是 `games/fashion-mall/` 的**可执行架构契约**：每一节先陈述现状（含文件与行为证据），再给出目标形态与落地改法。Round 2+ 的任何代码改动应服从本文；若需突破，先改本文再改代码。

Round 2 复评结论：Round 1 把 settle 统一结算、v2 存档迁移管线、动作层、单泵调度、dispose 协议全部落了地（各节已改标 ✅），但呈**「data 层与测试先行、运行路径滞后」**的模式性断层——负期望经济表、被动阅历、伙伴叠加衰减、新成本曲线都建成了却没接进运行代码，五个小游戏视图仍是基线版。当前实测 48/72（复评全表见 `SOTA_RUBRIC.md`）。Round 2 主题只有一个：**接线与钳制，不新开玩法**（§10）。

配套文档：

- `docs/SOTA_RUBRIC.md` — 可打分验收表与基线缺口。
- `docs/MODULE_CONTRACT.md` — 模块所有权、公开接口冻结面、Round 2 分工防冲突规则。

---

## 1. 不变式（硬约束，任何 Round 不得违反）

1. **目录隔离**：全部代码、资源、文档只存在于 `games/fashion-mall/` 内；不 import 仓库根或其他游戏的任何文件；不修改仓库根文件。同仓库将并列放置其他游戏（见 §7）。
2. **零构建**：纯 ES Modules + 原生 CSS，`python3 -m http.server` 直接可玩。禁止 React/Vue/打包器/运行时依赖；`package.json` 仅承载 scripts。
3. **测试栈**：`node --test`（Node 原生 runner），核心逻辑必须能脱离 DOM 在 Node 中运行。
4. **无外部资源**：音效用 Web Audio 合成；图形用 CSS/emoji/inline SVG；不引用原作素材。
5. **单存档键**：localStorage 键固定为 `fashion-mall-save-v1`，版本升级靠信封内 `v` 字段迁移（§5），**不换键名**，避免玩家静默丢档。
6. **内容安全**：所有来自玩家或存档的字符串（`state.name`、导入 JSON 内任意字段）进入 DOM 时必须走 `textContent` 或统一转义函数，禁止直接模板插值进 `innerHTML`。✅ Round 1 已修复：`ui/dom.js` 提供 `esc()/setText()`，`mall/mallView.js` 的 `<h1>` 已转义、toast 统一走 `setText`，且脏档消毒有单测。新增视图沿用，不得回退。

---

## 2. 分层与模块地图

### 2.1 目标分层（依赖只允许自上而下引用下层）

```
┌────────────────────────────────────────────────────┐
│ app.js            组合根：装配、路由、tick 泵、全局定时器 │
├────────────────────────────────────────────────────┤
│ ui/  mall/  minigames/  fashion/  home/            │
│ partners/  research/  events/     —— 视图层（DOM）    │
├────────────────────────────────────────────────────┤
│ core/actions.js   动作层：唯一允许写 state 的入口（已建成）│
├────────────────────────────────────────────────────┤
│ core/state.js  core/economy.js   —— 纯逻辑（无 DOM）   │
├────────────────────────────────────────────────────┤
│ data/balance.js  data/copy.js    —— 静态配置（无依赖）  │
├────────────────────────────────────────────────────┤
│ 边界适配器：core/save.js(localStorage)  core/audio.js  │
└────────────────────────────────────────────────────┘
```

依赖规则（`MODULE_CONTRACT.md` 有 import 白名单表）：

- `data/**` 不 import 任何东西；只导出常量与**纯函数公式**。
- `core/**` 只 import `data/**` 与 core 内部；**禁止 import 视图层、禁止触碰 `document`/`window`**（`save.js`、`audio.js` 作为边界适配器例外，但必须保持"环境缺失时静默降级"，现状已做到 `typeof localStorage === "undefined"` 守卫，保住 Node 可测性）。
- 视图层可 import `core` 与 `data`，**不得互相 import**（例如 `minigames/fastfood.js` 不得 import `mall/mallView.js`）。
- `app.js` 是唯一装配点：路由表、tick 泵、视图注册表都只在这里拼装。

### 2.2 符合度（Round 2 复评）

目录划分与目标一致（保持）。`core/actions.js` 已建成且 mallView/roster/labs/intro/events 均已改走动作层 ✅。仍越界与新发现的断层：

| 越界/断层现状 | 证据 | 目标改法 |
|---|---|---|
| 五个小游戏视图仍是基线版：赏金硬编码 + 直写 state + 盲盒/占卜正期望在线上可刷 | `fastfood.js` 的 `28 + done.length * 12`、`fresh.js` 的 `18 * score`、`boutique.js` 的 `40 + score * 35`、`blindbox.js` 的旧 `POOL`（期望 90.2 金/60 花费）、`fortune.js` 的 `90/20`（期望 66.7/30） | 改查 `balance.js#MINIGAME_PAYOUTS` 与 `fastfoodTip/freshPayout/boutiquePayout/blindboxRoll/fortuneSpin`，经 `actions.payFee/reward` 走账（P0-1，Round 2 第一优先级） |
| `actions.js#fromBalance` 死接线：新成本曲线静默回退基线公式 | `shopUpgradeCost` 只传 `lv`，balance 签名是 `(shop, level)` → NaN → 回退 `80×1.45^n`；`shopHireCost` 在 balance 里叫 `hireCost` → 找不到 → 回退 `50×1.5^n` | 补 `shop` 参数 / 对齐导出名；给「balance 导出已被 actions 实际调用」补一致性断言，杜绝静默回退再次发生（P0-2） |
| `home/mansion.js` 绕过动作层且用倒挂定价 | 私有 `costOf = 200/bonus`（加成越高越便宜）+ `state.gold -= cost` 直写 | 改走 `actions.buyFurniture`（内部已用 `balance.furnitureCost = bonus×40000`）（P0-2） |
| `wardrobe.js`/`intro.js` 直写 `state.outfit` | `state.outfit[slot] = item` | 低危（无扣费）；顺手改 `actions.wearOutfit`，不单列 P0 |
| 文案散落视图 | `copy.js` 已扩至 8 块但 HUD/FAIL/GOALS/OFFLINE/SYSTEM 标注「待接线」未接；五小游戏/商场/伙伴/研发视图仍硬编码 | HUD 与失败 toast 优先接线（P0-5）；新增文案必须直接进 copy.js |

---

## 3. 状态模型与数据流

### 3.1 单一 state 树（保持）

`core/state.js#defaultState()` 是唯一的 state 形状定义处。规则：

1. **存 id，不存派生对象**。✅ 已落地在存档层：`save.js#toSaveData` 白名单序列化，outfit 降为 id 字符串、partners 只留 `{ id, owned, level, assigned }`，`fromSaveData` 按 `OUTFITS/PARTNERS` 当前表回填静态部分（老档吃到最新数值与文案，有单测）。运行时 state 仍持有整对象（渲染便利），属可接受形态——规则约束的是**档内形状**。
2. **单一事实来源**。✅ 已落地：收益只认 `partner.assigned`（`economy.js#partnersAt/shopBonusMap`），`shops[].assignees` 降级为 `syncUnlocks` 重建的派生缓存且不入档；伪造 assignees 不影响收益有单测。
3. **瞬态不入档**。✅ 已落地：`toSaveData` 白名单剔除 `toast/assignees`，`fromSaveData` 强置 `toast=""`，有单测（"save file stores ids only and drops transients"）。

### 3.2 数据流（已落地，残留见各条 ✅ 后注）

```
用户输入 → 视图 handler → core/actions.* (唯一写点)
                              │ 返回 {ok, toast?}
                              ▼
                        state 变更 + dirty 标记
                              ▼
tick 泵(app.js) → core/state.tick() → 同样只经 actions/grant* 写
                              ▼
        渲染：全量 paint()（路由切换时） + HUD 订阅式局部刷新（每 tick）
```

渲染契约（视图层全员遵守）：

- 每个视图导出 `render(root, state, ctx)`，**返回 dispose 函数**（无资源可清理时返回 `undefined`）。✅ 已落地：`app.js#disposeStage` 在替换 `#stage` 前统一调用上一视图的返回值与 `root._cleanup`（双协议兼容），fresh/mall/labs/roster 均已注册，基线的 fresh 计时器泄漏已关。残留：`fortune.js` 转盘的 1.2s 瞬时 interval 未注册（自终止、低危，P0-1 改造时顺手收进 dispose）。
- 每 tick 的 HUD 刷新走**局部更新**。✅ 已落地：四个 pill 各有 `id`，`paintHud` 只改文本节点（`ui/dom.js#setText`），每 tick 零建节点。
- 全量 `paint()` 只发生在路由切换、intro 完成、存档导入三类事件 ✅。残留缺口（RUBRIC C2/D2）：**交互内重绘仍是整视图 `innerHTML` 重建**——mallView 升级/招聘、roster 派驻后，刚点击的按钮焦点必丢。Round 2 目标：交互后只更新受影响的行/卡片，或重绘后把焦点还给等位节点。

---

## 4. 时间系统：tick、追帧、离线

### 4.1 落地状态（Round 2 复评）

✅ **时间戳驱动的统一结算已落地**，与 4.2 目标设计一致：

- `core/state.js#settle(state, now)` 是唯一推进 `lastTick` 与时间收益的函数：`dt ≤ ONLINE_GAP_MAX_SEC(30s)` 按在线全额走 `tick`，超过按离线 65%/8h 封顶走 `settleOffline`；时钟回拨钳 0 并对齐。节流不丢收益（5s/跳 vs 250ms/跳 差 <1%）、回拨、边界、封顶全有单测。
- `persist()` 不再触碰 `lastTick` ✅（有单测 "tick does not touch lastTick"）。
- 单泵派生全部调度 ✅：`app.js#pump` 一个 interval 派生结算/落盘/事件（基线 3 个常驻 interval 已收敛）；`visibilitychange` 隐藏即 settle+persist、恢复即 settle+弹回执，`pagehide` 兜底。
- tick 管线顺序固定为 `收入 → 目标进度(advanceGoal) → 等级/解锁 → 通知收集` ✅。

残留钳制缺口（boundary.mjs 实证，归 Round 2 P0-3）：

1. **`nan-current-time` hazard**：`settle(state, NaN)` 时 `dtSec=NaN` 两个分支都不命中，落进离线路径把 `state.lastTick` 写成 NaN、回执 `gold/hours` 为 NaN（账目本身被 `grantGold` 的有限性守卫保住）。修法：入口 `Number.isFinite(now)` 早退。
2. **`saturated-goal-loop` hazard**：`advanceGoal` 的 32 次守卫耗尽时单 tick 刷 32 条通知且目标追不上营收。修法：守卫耗尽时直接把目标定到 `goldEarned` 之上并合并通知。
3. `hydrate` 的离线 toast 金额未走 `formatGold`（回执口径不一致，归 P0-5）。

### 4.2 设计基准（保持，供回归对照）

核心原则：**在线 tick 与离线结算是同一个函数的两种参数**；`lastTick` 只由 `settle` 写；离开超过 `ONLINE_GAP_MAX` 自动降为离线倍率，堵死"挂后台优于离线"和"挂后台劣于离线"两个方向的不公平。现实现签名：`settle(state, now) -> { gold, hours, mode: "none"|"online"|"offline", notes[] }`，改动须先改本节。

### 4.3 限时目标成环 ✅

已落地：`advanceGoal` 达标发奖升档、超时降档续期（含离线跨多档的循环结算），曲线由 `balance.js#rollNextGoal` 接管（区间自缩放 + tier 0–6 自适应，见 ECONOMY §3），core 侧留保守兜底曲线。旧档无 tier / 已完成目标零奖励续期均有单测。残留即 §4.1 的守卫耗尽 hazard。

---

## 5. 存档与迁移

### 5.1 信封与现状 ✅

信封格式（保持）：`{ v: <int>, savedAt: <ms>, data: <state> }`，`CURRENT_VERSION = 2`。

基线四缺陷全部关闭（`tests/save.test.js` 全覆盖）：

1. ✅ 迁移管线真实在跑：`readSaveData → migrate(MIGRATIONS 逐版升)` → `fromSaveData` 按 `SHOPS/PARTNERS/OUTFITS` 当前表深回填。
2. ✅ 加店不炸老档：`fromSaveData` 按配置表逐 id 补默认值，有单测（"adding a shop to SHOPS cannot break an old save"）——**向 `SHOPS` 加店的禁令解除**（§6.4）。
3. ✅ 档内只存 id（§3.1），再平衡可触达老档。
4. ✅ 导入与加载共用 `migrate + fromSaveData` 消毒管线（`actions.importState`），脏档字段全量钳制有单测；坏档备份到 `.corrupt` 键不清档。

### 5.2 迁移管线（已实现，保持为规范）

```js
// core/save.js（示意；实现见源码，v1→v2 额外处理了老档 goal.done 的零奖励续期）
const CURRENT_VERSION = 2;
const MIGRATIONS = {
  // 每个函数：把 vN 的 data 原地升到 vN+1，纯函数、可单测
  1: (d) => ({ ...d,
    outfit: mapValues(d.outfit, (item) => item.id ?? item), // 对象 → id
    partners: d.partners.map(({ id, owned, level, assigned }) => ({ id, owned, level, assigned })),
  }),
};

export function migrate(raw) {
  if (!raw?.v || !raw.data) return null;          // 认不出 → 交给坏档流程
  let { v, data } = raw;
  while (v < CURRENT_VERSION) { data = MIGRATIONS[v](data); v += 1; }
  return data;
}
```

配套规则（现实现与此一致，`deepFill` 的职责由 `state.js#fromSaveData` 按配置表回填承担）：

- **加载序**：`readSaveData(migrate) → fromSaveData(按表回填+钳制) → settle 追帧 → 挂载`。✅
- **坏档不清档**：迁移或解析失败时原始串备份到 `fashion-mall-save-v1.corrupt`，开新档并提示；`clearSave` 不动备份。✅
- **写档白名单**：`toSaveData` 按 schema 序列化，瞬态字段出不了档。✅
- **每次 state 形状变更必须**：`CURRENT_VERSION + 1`、补一个 `MIGRATIONS[n]`、在 `tests/save.test.js` 加"旧档原文 → 迁移 → 断言新形状"用例（旧档原文用字符串常量固化，防止用当前代码生成"伪旧档"；`LEGACY_V1` 即范本）。**Round 2 接线若不改档内形状（被动XP/叠加衰减均为纯计算），不需要 bump 版本。**
- 导出/导入沿用信封；导入走与加载完全相同的管线，v1 导出档可直接导入（有单测）。✅

---

## 6. 插件点 A：扩展新店铺

目标是把"加一家店"收敛为**两处声明 + 一个新文件**，零散改动为零：

1. **`data/balance.js`**：向 `SHOPS` 追加一条（id/name/specialty/unlockLevel/base/growth/staffSlots/color/emoji/blurb）。经济系统（`shopRate`、`totalOnlinePerSec`、升级/招聘成本、商场网格、伙伴派驻列表）全部遍历 `SHOPS`，自动生效——基线这部分已经做对。
2. **`minigames/<id>.js`**：新建视图，遵守渲染契约（§3.2）：`export function render(root, state, ctx): dispose?`，赏金查 `MINIGAME_PAYOUTS[id]`。
3. **注册表**：基线在 `app.js` 硬编码 `SHOP_VIEW = { fastfood: renderFastfood, … }`，可接受但要求与 `SHOPS` 一致性有测试兜底。目标形态：`minigames/index.js` 导出 `SHOP_VIEWS` 注册表，`app.js` 只 import 注册表；`node --test` 断言 `SHOPS 每个 id 在注册表中存在`，防止"配置加了店、视图忘了注册"上线才发现。
4. **存档兼容**：✅ `fromSaveData` 按 `SHOPS` 补齐老档缺失店铺且有单测——**加店禁令解除**。但 Round 2 主题是接线与钳制，不加店。

伙伴、家具、研发节点、换装件、突发事件的扩展方式同构：只增配置行（`PARTNERS`/`FURNITURE`/`RESEARCH_NODES`/`OUTFITS`/`EVENTS`），逻辑层全部按表遍历，不新增代码分支。

---

## 7. 插件点 B：同仓库扩展新游戏

- 每个游戏 = `games/<slug>/` 一个自包含目录，内含自己的 `index.html`、`src/`、`tests/`、`docs/`、`package.json`（仅 scripts）。**游戏之间零 import、零共享运行时**。
- 仓库根不放游戏代码；如未来需要游戏大厅/索引页，做成独立的 `games/index.html` 静态清单，只放链接，不引任何游戏模块。
- 共享代码策略：当前**禁止**建 `games/_shared/`。两个游戏出现雷同代码时先容忍复制；只有 ≥3 个游戏需要同一能力（如存档信封、合成音效）时，才提取 `games/_shared/<pkg>/` 并要求各游戏按副本拷贝（vendor）而非跨目录 import，保证"删掉任一游戏目录，其余游戏不受影响"这一根不变式。
- 本游戏对外的全部约定就是目录边界本身；`window.__FASHION_MALL__` 调试句柄仅供测试/演示（§9），不构成对其他游戏的 API。

---

## 8. 视图层横切规范（安全 / 无障碍 / 动效）

1. **转义**：✅ `ui/dom.js#esc/setText/el` 已建成并接进 mallView/roster/labs/events/intro；新增视图沿用。
2. **无障碍底线**（详细验收在 RUBRIC D 维）：✅ toast `role="status" aria-live="polite"`、nav `aria-current="page"`、事件弹窗原生 `dialog.showModal()`（焦点陷阱）+ labelledby/describedby + Esc。未完成（P0-5）：接物小游戏键盘左右键等效操作；`:focus-visible` 焦点环只在伙伴/事件/研发注入样式中，`main.css` 全局缺失；`.choices button.on` 仍用 outline 表达选中（改 box-shadow）；nav 触控目标 ~30px < `--tap-target` 44px。
3. **动效**：✅ motion.css 已接 index.html，token 级 `prefers-reduced-motion` 降级 + 四个注入样式各自降级。未完成（P0-5）：`main.css` 的 `pop/fall`/卡片 hover 位移未走 token、不降级（`fall` 是生鲜玩法动画，降级需保可玩的等效呈现）。
4. **音频**：✅ `sfx.beep` 转发补齐（失误音生效）、静音开关上线且 `muted` 入 v2 档。

---

## 9. 测试接缝与性能预算

- **纯逻辑层可测**是本架构最重要的接缝：`data/` + `core/`（除两个边界适配器的浏览器分支）必须在 Node 裸跑。✅ 47 条单测全绿；但注意 E4 教训：**测的必须是线上跑的代码**——小游戏纯函数已被测试覆盖却未被视图调用，测试绿不代表线上对。
- `window.__FASHION_MALL__ = { state, paint, actions, settle, stopPump }` ✅ 已扩容，作为浏览器端冒烟/录屏注入点。
- 性能预算（bench 兜底线，写死在 `scripts/bench.mjs`）：sim 吞吐 ≥ 50,000 ticks/s（本轮实测 2,082,703，**现行 2,000 地板仍形同虚设，P0-6 上调**）；单次 `settle` 含 8h 离线路径 < 1ms。浏览器侧预算（人工/录屏验收）：主界面 60fps、小游戏 ≥30fps、切页交互 < 100ms 可见反馈——至今无任何帧率取证（RUBRIC C6=0）。
- `scripts/boundary.mjs` 是数值炸弹雷达（本轮 4 guarded / 3 hazards），P0-3 修完后挂进 `npm test` 作为回归门。
- DOM 层测试不强制自动化（约束 §1.3），但每个 Round 交付需附录屏证据走查 RUBRIC 的 A/D 维条目。

---

## 10. Round 2 P0 索引（接线与钳制，不新开玩法）

基线七大缺口中 1–4 与 7 的大部分已在 Round 1 关闭（§4/§5/§3.2/§1.6/§8 各节 ✅）。剩余全部是**接线与钳制**，按危害排序（完整打分与分值预估见 `SOTA_RUBRIC.md` 汇总节）：

1. **P0-1 关印钞洞**：五小游戏视图查表接线——盲盒/占卜改 `MINIGAME_PAYOUTS + blindboxRoll/fortuneSpin`，经 `actions.payFee/reward` 走账；快餐/生鲜/服装查对应纯函数；禁直写 state（§2.2）。线上盲盒净 +30.2/盒、占卜净 +36.7/转，是唯一在营的经济事故。
2. **P0-2 修死接线**：`actions.shopUpgradeCost/shopHireCost` 与 balance 的签名/命名对齐（现静默回退基线公式）；`mansion.js` 改走 `actions.buyFurniture`（弃 `200/bonus` 倒挂价）；补"balance 导出被 actions 实际调用"的一致性断言（§2.2）。
3. **P0-3 数值钳制**：店铺/伙伴等级帽（`unbounded-shop-level` → Infinity）；`settle` 非有限 `now` 守卫；`advanceGoal` 守卫耗尽降噪（§4.1 残留三项）；boundary 挂进 `npm test`。
4. **P0-4 core 接线**（简报遗留三件）：`passiveXpPerSec` 进 tick/settle（离线 0.65 折）；`combinePartnerBonuses` 进 `economy.js#shopBonusMap`；研发顺序前置从 `labs.js` 下沉进 `actions.buyResearch`。
5. **P0-5 UI/样式接线**：HUD/FAIL/GOALS/OFFLINE/SYSTEM 接 `copy.js` + `a11y.js`；`main.css` 迁语义 token、全局 `:focus-visible`、`.choices` 选中态弃 outline、nav 触控 `--tap-target`、`pop/fall` 纳入减动效降级；`hydrate` 离线 toast 走 `formatGold`（§8）。
6. **P0-6 门槛与取证**：bench 地板 2,000 → 50,000；帧率与长挂机 Memory 快照取证留档（§9）。

P1（本轮不做）：俯视商场地图、事件微交互、盲盒/占卜玩法差异化、离线回执面板化、五店推进模拟、经济模拟脚本入库（ECONOMY §8）。
