# API 契约（实施级 · Round 2 定稿）

> 与 `ARCHITECTURE.md` 配套。签名与行为以 **`918239d` 提交的落地代码为基准**（Round 1 收尾 + Round 2 两波并行落地已对账：首波 `baf4247..4b97e21` 冬饲/作物门槛/温室地块制/心愿过滤；第二波 `9d68a4e`+`918239d` 离线接线/厨房菜单/摊位与家具 UI/全部收获/levels.js/经济校准数据）：已落地的行为在本版即契约（标 ✅），余下变更点标 `【R2-n】`（工单编号见 §10.2）并指名所有者。实现者不得偏离本文的签名、reason 码、公式与字段名。Round 1 草案中被落地代码推翻的条目集中在 §10.3，一律作废。

## 0. 约定与术语

### 0.1 函数三类（返回形状唯一化）

| 类别 | 返回 | 例 |
| --- | --- | --- |
| 命令（玩家动作） | 信封 `Envelope` | `plant` `enqueueJob` `deliverWish` `stallSell` `placeFurniture` |
| 查询（selector，只读无副作用） | 裸值，**永不**返回信封 | `canCraft` `canPlant` `seasonFactor` `feedCost` `guestCapacity` `wishSlots` `kitchenMenu` `furnitureWarmth` |
| 节拍（tick / 离线结算驱动） | 裸完整 nextState | `tickPlots` `tickProduction` `tickVillage` `catchUpPlots` `advanceTime`（含元组）`refreshWishes` |
| 编排（唯一一个） | 三元组 `{ state, offlineMs, capped }` | `applyOfflineCatchup`（§2.2，✅ 落地于 `core/offline.js`） |

### 0.2 信封 `Envelope` 与 reason 机器码双读期（本节即迁移时刻表）

```js
// 成功
{ ok: true, state: State /* 完整 nextState */, ...extras }
// 失败（state 必须 === 传入引用）
{ ok: false, reason: string, message: string, state: State, ...extras }
```

| 字段 | 规则 |
| --- | --- |
| `reason` | 稳定机器码，格式 `域.代码`（如 `farm.coin_short`）。**§7 总表自本版起冻结：只加不改不删**，测试断言它 |
| `message` | 中文文案 = `REASONS[reason]`，UI/日志显示它；测试**不得**断言它 |
| `extras` | 仅限可序列化原始值/小对象（`cook` 的 `dark/favorite/crit/qty`、`harvestAll` 的 `count`、`deliverWish` 的 `coins/gifts`、`stallSell/petPlay` 的 `coin`、`placeFurniture` 的 `warmth`）；禁止塞函数 |

**现状**：全系统仍把中文原文直接写在 `reason` 里，无 `message`；且测试**精确断言中文 reason**，D1 改造前的完整影响面（改系统前先核对此表）：

| 测试位置 | 断言 | 形式 |
| --- | --- | --- |
| invariants.test.js（spendInv 超扣） | “材料不够” | `toEqual` 整信封（加 message 字段即炸） |
| invariants.test.js（enqueueJob 缺料） | “原料不够” | `toEqual` 整信封 |
| invariants.test.js（deliverWish 缺货） | “东西还没收齐” | 逐字段 |
| invariants.test.js（stallSell 非法数量） | “至少也得摆一件出去” | 逐字段 |
| economy.test.js（plant 作物等级门） | “小镇等级不够” | `toBe` |
| economy.test.js（collectJob 未完工） | “还在忙” | `toMatchObject` |
| economy.test.js（acceptWish 重复接） | “这单已经接下了” | 逐字段 |

迁移必须按以下次序分四步走，每步独立绿：

| 步 | 所有者 | 动作 | 为什么先做 |
| --- | --- | --- | --- |
| D0 | Opus-4 | 落地 `core/reasons.js`（§2.2）：`REASONS` 全表 + `msg(code)` + `fail(state, reason, extras)`。同时把 `main.js` 的 `applyResult` 飘字改为 `result.message \|\| msg(result.reason)`——`msg` 对未知码原样返回，所以中文 reason（未知码）与机器码都能正确显示 | UI 先兼容双格式，系统才能分批迁移而不把机器码怼到玩家脸上 |
| D1 | GPT-sol-1 | 测试改双读：新增助手 `expectReason(result, code)` ≙ 断言 `result.ok === false && result.state === 入参 && (result.reason === code \|\| result.reason === REASONS[code])`；把上表 `toEqual` 整信封断言拆成逐字段断言 | 测试先松，系统改动才不会一夜全红 |
| D2 | Opus-1/2/3 + Opus-4(store.js + core/furniture.js) | 各系统按任意顺序、任意批次迁移：失败路径统一 `return fail(state, "域.代码", extras)`。动态插值文案（如“屋里只坐得下 N 位”）改为 §7 静态文案，动态数值放 extras。注意 `core/furniture.js` 的 5 条中文 reason 也在迁移面内 | D0/D1 已就位，随时可并行 |
| D3 | GPT-sol-1 | 全系统迁移完成后收紧：`expectReason` 只认机器码；新增静态断言——`systems/**` 与 `core/store.js` 源码中 `reason:` 后不得出现汉字（正则 `reason:\s*"[^"]*[\u4e00-\u9fff]`） | 关闭双读期，防回潮 |

双读期起点 = D0 合入，终点 = D3 合入。期间任何新代码**直接写机器码**（不允许再新增中文 reason）。

### 0.3 参数演进与注入约定

| 规则 | 内容 |
| --- | --- |
| 追加参数 | 新参数只能追加到末位且带默认值（`nowMs = Date.now()`）；已有位置参数的顺序与含义永不变；payload 对象内加可选键允许 |
| 注入双轨（裁决） | farm/production 用**末位参数**注入时间（production 已补齐 ✅）；village 用**payload 字段**注入（`deliverWish/cook` 的 `rng`、`petPlay` 的 `now`），保持现状不改。新函数默认走末位参数 |
| rng 语义 | `rollWith(rng, ...parts)`：注入了 `rng` 用注入值（钳 [0, 0.999999]）；未注入时由 parts 派生 FNV 哈希，同一存档同一参数结果恒定 |
| payload 兜底 | 命令函数解构 payload 一律带 `= {}`（三系统均已补齐 ✅） |

## 1. State Schema v1（唯一定义处，= `createInitialState()` + 懒建字段）

| 路径 | 类型 | 初值 | 时基 | 写者 |
| --- | --- | --- | --- | --- |
| `meta.name` | string | `"新村长"` | — | 预留 |
| `meta.level` | int 1–10 | 1 | — | 仅 `meta/tick` 第 5 步（派生自 xp） |
| `meta.xp` | int ≥0 | 0 | — | farm/production/village |
| `meta.hourMs` | 3000\|6000\|12000 | 6000 | — | `meta/settings`【R2-15】 |
| `meta.gameMinutes` | float [0,1440) | 480 | A | advanceTime |
| `meta.day` | int ≥1 | 1 | A | advanceTime |
| `meta.season` | `"spring"\|"summer"\|"autumn"\|"winter"` | `"spring"` | A | advanceTime |
| `meta.muted` | boolean | false | — | `meta/mute` |
| `meta.tutorialStep` | int 0–4 | 0 | — | main.js（advanceTutorial / `meta/tutorial`） |
| `resources.coin` | int ≥0 | 80 | — | 全体 |
| `resources.pearl` | int ≥0 | 0 | — | village |
| `resources.happiness / warmth` | int ≥0 | 40 / 20 | — | village（`normalizeMood` 取整钳非负；warmth 另有家具保底盘 §5.9） |
| `resources.pop / popCap` | int | 2 / 4 | — | village(build) |
| `resources.shovel / axe / saw` | int ≥0 | **2 / 1 / 1** | — | farm(扣) / village(掉落、建造扣) |
| `inv` | `Record<itemId, int ≥1>`（0 即删键） | `{ chili: 2 }` | — | addInv 系 |
| `plots[]` | `{ id, status, cropId, plantedAt, doneAt, wiltAt?, greenhouse }` | 2 块（p1 empty、p2 untilled） | B | farm |
| `plots[].status` | `untilled\|empty\|growing\|ready\|wilted` | — | — | farm |
| `plots[].wiltAt` | epoch ms；0/缺失 = 无枯萎倒计时 | 初始缺失，hydrate 补 0【R2-16】 | B | farm |
| `plots[].greenhouse` | boolean；温室地块判定 = `greenhouse === true` 或 id 形如 `g1/g2…`（§3.0） | false | — | farm(expandGreenhousePlot) |
| `buildings` | `Record<id, { built: true, slots: [], slotCount?: int }>`（未建 = 无键） | mushroom、wish | — | village(build) / production(unlockSlot) |
| `jobs[]` | `{ id, buildingId, recipeId, kind: "craft"\|"livestock", status: "running"\|"done", doneAt, slot, productId, qty, xp }` | `[]` | B | production |
| `production.livestockCarry` | `Record<productId, float ≥0>` 分桶（喂鸡的零头不补牛奶）；旧档为单个 number，读作下一次投喂的起始零头 | **懒建** | — | production |
| `production.winterFeedCarry` | float ≥0（冬饲 0.2/次 记账桶） | **懒建** | — | production |
| `village` | `{ wishSeq: int, nextWishAt: epoch ms, cooked: int, darkDishes: int, lastDay: int }` | **懒建**，hydrate 补齐【R2-16】 | B（nextWishAt） | village |
| `wishes[]` | `{ ...池条目, wishId, needs(缩放后), coin, xp, tier, status: "open"\|"accepted", createdDay }` | `[]`（首 tick 补满） | A（createdDay） | village |
| `guests[]` | `{ id, sinceDay, untilDay }` | `[]` | A | village |
| `pets[]` | `{ id, name, kind: "dog"\|"cat", readyAt }` | 小花/小团 | B | village |
| `furniture[]` | **`string[]`（家具 id）**——`core/furniture.placeFurniture` 写入（`village/furnish` 接线 ✅）；village 读取端兼容旧 `{id,…}` 对象条目（无存量，R2-21 去重后删兼容） | `[]`（懒建，hydrate 补【R2-16】） | — | core/furniture(placeFurniture) |
| `log[]` | string，≤40 条，新的在前 | 1 条开场白 | — | 全体经 pushLog |
| `ui` | `{ seed, selected, toast, fx, rerolls, sellId, sellQty, serveTo }`；toast/fx 落盘置 null；`sellId`(string\|null)/`sellQty`(int ≥1) = 摊位选中货与件数、`serveTo`(guestId\|null) = 厨房点名端菜对象 ✅ | `createInitialUi()` | — | main.js/UI 动作（`meta/sell` `meta/serve` §6） |

兼容注记：`itemId` 全集 = `data/wishes.js` 的 `ITEM_NAMES` 键集，新物品先登记该表再登记 `data/items.js` 的 `BASE_PRICES`；家具 id 不进 `inv`，只进 `state.furniture`。

## 2. core 契约（`src/core/**`，Opus-4）

### 2.1 现有导出（签名冻结 ✅）

| 模块 | 签名 | 说明 |
| --- | --- | --- |
| store.js | `createStore(initial, reducer)` | `ARCHITECTURE.md §3.1`；构造时 structuredClone |
| store.js | `merge(state, patch): State` | 顶层浅合并，仅模块内部用 |
| store.js | `addInv(state, id, qty): State` | qty 可负；≤0 删键 |
| store.js | `hasInv(state, needs): boolean` | `needs: Record<itemId, int>` |
| store.js | `spendInv(state, needs): Envelope` | 失败 `core.inv_short`（D2 前为“材料不够”）；原子性：不足时不动任何键 |
| engine.js | `createInitialState(): State`、`createInitialUi()` | §1 初值列 |
| engine.js | `advanceTime(state, dtMs): { state, crossedDay, crossedSeason }` | 只动 meta 三字段 |
| engine.js | `LEVELS`、`levelFor(xp)`、`levelProgress(xp)`、`TUTORIAL_TOTAL = 4` | 【R2-3 残留】改为 data/levels.js 的薄再导出，签名不变（levels.js 已落地 §2.4） |
| engine.js | 常量 `HOUR_MS_DEFAULT / DAY_HOURS / DAYS_PER_SEASON / OFFLINE_CAP_MS` | 6000 / 24 / 7 / 28_800_000（✅ 第二波上收 engine；farm 本地重复待去重） |
| engine.js | `absGameMinutes(meta)` | **死代码**：第二波误重新引入、全库零调用方（§10.3 早已作废），【R2-19】一并删除 |
| offline.js ✅ | `offlineSpan(savedAt, nowMs = Date.now()): { elapsed, offlineMs, capped }`、`humanGap(ms): string`、`applyOfflineCatchup`（§2.2） | 第二波新模块；`humanGap` 输出「N 分钟 / N 小时 N 分钟」中文时长 |
| furniture.js ✅ | `placedFurniture(state): string[]`、`isPlaced(state, furnitureId): boolean`、`furnitureWarmth(state): number`、`applyFurnitureWarmth(state): State`、`placeFurniture(state, { furnitureId }): Envelope`（§5.9） | 第二波新模块，家具**唯一**接线实现；`applyFurnitureWarmth` 在 main.js `finalize` 里每 tick/offline 收尾兜温馨下限 |
| save.js | `SAVE_KEY`、`serialize(state)`、`deserialize(raw)`、`hydrate(saved, base?)`、`writeSave(state)`、`readSave()`、`clearSave()` | `deserialize` 返回 `{savedAt, state} \| null`，内部已过 hydrate；hydrate 的 `ui` 已与 `createInitialUi()` 合并（新键 sellId/sellQty/serveTo 自动补齐 ✅） |
| events.js | `createBus()` | 冻结不用，禁新增依赖 |
| index.js | 桶导出 `events / store / save / engine / offline / furniture` ✅ | |

### 2.2 core 新增导出（✅ = 第二波已落地；其余本文即规格）

| 模块 | 签名 | 规格 |
| --- | --- | --- |
| engine.js ✅ | `export const OFFLINE_CAP_MS = 28_800_000` | 8 真实小时，已落地。【R2-2 残留】farm 仍持本地同值常量（offline-smoke 在用），改为 `export { OFFLINE_CAP_MS } from "../../core/engine.js"` 再导出去重，farm 导出面不变（Opus-1） |
| **offline.js** ✅ | `export function applyOfflineCatchup(state, savedAt, nowMs = Date.now(), systems = {}): { state, offlineMs, capped }` | 落点从拟议的 engine.js 改为独立模块（§10.3）：`systems = { catchUpPlots?, tickProduction?, tickVillage? }` 由组合根注入——core 不反向依赖 systems，缺哪个函数就跳过哪一步。编排 = `ARCHITECTURE.md §4.4` 六步；`offlineMs <= 0`（含 savedAt 非有限数）→ `{ state 原引用, offlineMs: 0, capped: false }`；成功时自带一条离线 log（capped 注明「超过 8 小时的部分不另算」） |
| buffs.js 【R2-4】 | `export function buffFactor(state, target): number` | 遍历 `state.guests`，`guestById(g.id)?.buff.target === target` 的 `factor` 连乘（非有限/≤0 跳过），结果 `Math.min(2, Math.max(0.5, x))`；无匹配 = 1。**语义已由三个系统的本地实现统一落地** ✅（farm `applyGuestFarmBuff`、production 内部 `guestBuffFactor`、village 导出 `guestBuffFactor` 均为连乘 + 钳 [0.5, 2]）；本模块的意义只剩去重：三处改薄封装，导出名保留 |
| reasons.js 【R2-1/D0】 | `export const REASONS: Record<code, string>` | 全量码表 = §7，冻结 |
| reasons.js 【R2-1/D0】 | `export const msg = (code) => REASONS[code] ?? code` | 未知码原样返回（双读期关键） |
| reasons.js 【R2-1/D0】 | `export const fail = (state, reason, extras = {}) => ({ ok: false, reason, message: msg(reason), state, ...extras })` | D2 起所有失败路径统一走它 |
| save.js 【R2-16】 | `export const SAVE_VERSION = 1`、`MIGRATIONS`（模块内） | `ARCHITECTURE.md §5.2`；`deserialize` 的版本判断从 `v !== 1` 改为 `1 <= v <= SAVE_VERSION` + 循环迁移 |

### 2.3 `hydrate(saved, base = createInitialState())` 增补表（R2-16；落地版只做顶层形状合并，缺以下逐条目归一）

| 缺失字段 | 补 |
| --- | --- |
| `plots[].wiltAt` | `0`；`plots[].greenhouse` → `false` |
| `jobs[].kind` | `recipeById(recipeId)` 存在 → `"craft"`，否则 `"livestock"`；`qty` 缺 → craft 取 `recipe.outputQty`、livestock 取 1；`xp` 缺 → 0 |
| `guests[].untilDay` | `sinceDay + 2` |
| `production` | 与 `{ livestockCarry: {}, winterFeedCarry: 0 }` 合并；旧档 number 型 `livestockCarry` **保留原样**（production 自兼容，读作下一次投喂的起始零头） |
| `village` | 与 `{ wishSeq: 0, nextWishAt: 0, cooked: 0, darkDishes: 0, lastDay: meta.day }` 合并 |
| `furniture` | `[]` |
| `meta.hourMs` 非法值（∉ {3000, 6000, 12000}） | `6000` |
| 温室旧档迁移【R2-11 联动】 | `buildings.greenhouse.built` 且无任何温室地块 → 按数组序**免费**补 `greenhouse: true` 至 `GREENHOUSE_PLOT_CAP`(3) 块——温室从“全场免疫”收紧为“地块制”，老档不因规则收紧净损失 |

### 2.4 `src/data/levels.js`（R2-3；模块已落地 ✅ `918239d`，经 `data/index.js` 桶再导出）

```js
// —— 已落地 ✅（签名冻结）——
export const XP_TABLE = [0, 40, 100, 180, 280, 420, 600, 820, 1100, 1450]; // 下标 i = Lv.(i+1) 门槛
export function levelForXp(xp): number;    // 1..10；线性扫表，xp < 0 落在 Lv.1
export function xpForNext(level): number;  // = XP_TABLE[level] ?? Infinity（满级 Infinity）
// —— R2-3 残留（Fable-3 + Opus-4）——
export function levelProgress(xp): { level, base, next, pct }; // 从 engine 迁入，行为与 engine 落地版逐位一致；满级 { next: null, pct: 100 }
```

R2-3 残留：`levelProgress` 迁入本模块 + engine.js 改薄再导出（`export { XP_TABLE as LEVELS, levelForXp as levelFor, levelProgress } from "../data/levels.js"`）+ 删除 engine 本地重复表（现状双份数值靠人肉同步，改一处漏一处即翻车）。UI/main 改 import 后删除再导出。旧规格中的 `MAX_LEVEL` 常量作废——落地版未导出、无使用方（§10.3）。

## 3. Farm 契约（`src/systems/farm/index.js`，Opus-1）

### 3.0 导出常量与查询 ✅

| 导出 | 值 / 签名 | 说明 |
| --- | --- | --- |
| `OFF_SEASON_FACTOR` | 0.55 | 错季倍速 |
| `WILT_GRACE_MS` | 45_000 | 枯萎宽限（真实 ms） |
| `OFFLINE_CAP_MS` | 28_800_000 | 【R2-2 残留】engine 已有同值常量 ✅，farm 改为再导出去重 |
| `GREENHOUSE_PLOT_CAP / GREENHOUSE_COIN / GREENHOUSE_SAW` | 3 / 80 / 1 | 温室地块上限与单块改造费 |
| `isGreenhousePlot(plot): boolean` | `plot.greenhouse === true` 或 id 匹配 `/^g\d+$/` | **温室建筑本身不再让全村免疫**（Round 1 行为已废） |
| `greenhousePlotCount(state): number` | 已罩进温室的地块数 | 卡 CAP 用 |
| `canPlant(state, cropId): boolean` | `crop.unlockLevel` 非有限数 → true；否则 `meta.level >= unlockLevel` | 供 UI 灰掉种子按钮（【R2-7】UI 侧接线，Opus-4） |
| `applyGuestFarmBuff(state, growMs = 1): number` | farm buff 连乘、钳 [0.5, 2] 后乘到 growMs | 【R2-4】内部改调 `buffFactor(state, "farm")`，导出保留 |

内部常量：`MIN_GROW_MS = 1_000`、`EXPAND_COIN = 40`、`EXPAND_SHOVEL = 1`。

### 3.1 `seasonFactor(crop, season, greenhouse = false): number` — 查询 ✅

greenhouse 为 true 或 crop 缺失 → 1；当季 → 1；错季 → 0.55。

### 3.2 `till(state, { plotId } = {}): Envelope` 【R2-10 改返回形状】

现状返回裸 state、无效操作静默（前置检查在 main.js 预检）；改为信封。**协同点**：Opus-4 同一批次把 main.js 的 `farm/till` 分支改为 `applyResult(state, till(state, payload), "till")` + 成功时 `advanceTutorial(…, 1)`，删除 main.js 预检，否则双重包裹。

| 前置 | 失败码 |
| --- | --- |
| plot 存在 | `farm.plot_not_found` |
| `status ∈ {untilled, wilted}` | `farm.till_invalid` |

成功：该 plot → `{ status: "empty", cropId: null, plantedAt: 0, doneAt: 0, wiltAt: 0 }`。

### 3.3 `plant(state, { plotId, cropId } = {}, now = Date.now()): Envelope` ✅（含作物等级门）

| 前置（按序短路） | 失败码 |
| --- | --- |
| `cropById(cropId)` 存在 | `farm.crop_unknown` |
| `canPlant(state, cropId)` | `farm.crop_locked` |
| plot 存在 | `farm.plot_not_found` |
| `status === "empty"` | `farm.plot_unavailable` |
| `coin >= crop.seedCost` | `farm.coin_short` |

成功效果（快照式，唯一公式 ✅）：

```
factor = seasonFactor(crop, meta.season, isGreenhousePlot(plot))
grow   = max(MIN_GROW_MS, round(applyGuestFarmBuff(state, crop.growMs / factor)))
coin  -= crop.seedCost
plot   = { status: "growing", cropId, plantedAt: now, doneAt: now + grow,
           wiltAt: factor === 1 ? 0 : doneAt + WILT_GRACE_MS }
```

`seasonFactor` 在分母（错季 0.55 → 时长 ×1.82）；farm buff 在分子。播种后换季/嘉宾离店不回溯 `doneAt`。

### 3.4 `harvest(state, { plotId } = {}, now = Date.now()): Envelope` ✅

失败码：`farm.not_ready`（非 ready 且未到 doneAt）/ `farm.plot_empty`（crop 不存在）。成功：`inv[yieldId] += yieldQty`；`xp += crop.xp`；plot 复位；log 一条。

### 3.5 `harvestAll(state, now = Date.now()): Envelope` ✅（R2-14 已收官：`farm/harvest_all` action + 工具条「全部收获（N）」按钮 + H 快捷键 + 成功推进教程步 3）

逐块尝试 `harvest`。全失败 → `{ ok: false, reason: "farm.nothing_ready", state, count: 0 }`；否则 `{ ok: true, state, count }`。

### 3.6 `wilt(state, { plotId } = {}): Envelope` ✅ — 强制枯萎，调试/剧情用

失败码：`farm.plot_not_found` / `farm.wilt_invalid`（status ∉ {growing, ready}）。成功转 wilted + log。

### 3.7 `tickPlots(state, dtMs, now = Date.now()): State` — 节拍 ✅ +【R2-17】

| 规则 | 行为 |
| --- | --- |
| 熟化 | `growing && now >= doneAt` → `ready`（先于枯萎判定） |
| 当季（factor === 1，含温室地块） | 清 `wiltAt = 0` |
| 错季 | 无倒计时则起算 `wiltAt = max(doneAt, now) + WILT_GRACE_MS`；`now >= wiltAt` → 枯萎。【R2-17】枯萎时 pushLog 一条（现状静默，玩家不知道苗没了） |
| 无变化 | 返回原 state 引用（短路订阅通知） |

### 3.8 `expandPlot(state): Envelope` ✅

| 前置（按序） | 失败码 | 公式 |
| --- | --- | --- |
| `plots.length < pop × 2` | `farm.pop_short` | 一人照看两块地 |
| `plots.length < 1 + meta.level` | `farm.level_low` | 等级放开上限 |
| `coin >= 40 && shovel >= 1` | `farm.expand_cost` | |

成功：扣 40 金 + 1 锹；追加 `{ id: "p" + (历史最大编号 + 1), status: "untilled", ... }`。

### 3.9 `expandGreenhousePlot(state, { plotId } = {}): Envelope` ✅（温室地块制）

`plotId` 缺省 → 自动挑第一块未罩进温室的地。

| 前置（按序） | 失败码 |
| --- | --- |
| `buildings.greenhouse?.built` | `farm.no_greenhouse` |
| 目标地块存在（缺省时还有未覆盖地块） | 指定：`farm.plot_not_found`；缺省无地可罩：`farm.greenhouse_all` |
| 目标未在温室里 | `farm.greenhouse_dup` |
| `greenhousePlotCount < GREENHOUSE_PLOT_CAP`(3) | `farm.greenhouse_full` |
| `coin >= 80 && saw >= 1` | `farm.greenhouse_cost` |

成功：扣 80 金 + 1 锯；`plot.greenhouse = true` 且 `wiltAt = 0`（罩上玻璃当场免枯萎）；log 一条。不可撤销。UI：温室详情面板列地块与「罩进温室」按钮（【R2-11】Opus-4）。

### 3.10 `catchUpPlots(state, savedAt, now = Date.now()): State` — 节拍（读档后一次，`applyOfflineCatchup` 已实际调用 ✅）

落地版 ✅：

```
away = clamp(now - savedAt, 0, OFFLINE_CAP_MS)；savedAt 非有限数按 now 处理
away === 0 → tickPlots(state, 0, now)
否则：所有 wiltAt > savedAt 的地块 wiltAt = max(wiltAt, now + WILT_GRACE_MS)   // 人不在家不判枯
      然后 tickPlots(state, away, now)
```

【R2-2b 裁决变更，Opus-1】落地版把 `now` 直传 tickPlots，`doneAt <= now` 的地块**不论离线多久都熟**——`scripts/offline-smoke.mjs` 因此 `ok:false`（SOTA A6 缺口实证）。本版裁决与探针/验收口径对齐，补生长封顶：

```
overflow = max(0, (now - savedAt) - away)                    // 超出封顶窗口的真实时长
对 status === "growing" 且 doneAt > savedAt + away 的地块：   // 封顶窗口内本来就熟不了的
  plantedAt += overflow；doneAt += overflow；wiltAt 若 >0 同步 += overflow
其余地块照旧自然到期；然后按上面的赦免 + tickPlots 流程走
```

语义：离线最多白得 8 小时生长进度，剩余时长回来接着长（探针两断言：封顶窗口内 → ready；窗口外 → 仍 growing）。jobs/pets/心愿计时**不**封顶（见 `ARCHITECTURE.md §4.4`——它们是一次性且有界的）。

## 4. Production 契约（`src/systems/production/index.js`，Opus-2）

### 4.0 导出常量与查询 ✅

| 导出 | 值 / 签名 | 说明 |
| --- | --- | --- |
| `MAX_SLOTS` | 6 | 单建筑生产位上限 |
| `WINTER_FEED_SURCHARGE` | 0.2 | 冬饲加价（记账桶，见 §4.4） |
| `canCraft(state, recipeId): boolean` | recipe 存在 && level ≥ unlockLevel && 已建 && hasInv | |
| `buildingSlots(state, buildingId): number` | `slotCount ?? def.slots`，钳 [0, 6]；都缺 → 0 | 无 slots 定义的建筑不能生产 |
| `freeSlots(state, buildingId): number` | `buildingSlots − 占位 job 数`，最低 0 | |
| `livestockYieldMultiplier(state): number` | = 内部 `guestBuffFactor(state, "livestock")`（连乘、钳 [0.5, 2]）✅ | 【R2-4】改调 core/buffs，导出保留 |
| `feedCost(state, buildingId): number` | 下一次投喂要扣几份饲料（冬天攒满零头那次是 2）；非畜牧建筑 → 0 | 供 UI 显示投喂价 |
| `winterFeedCarry(state): number` | 冬饲记账桶余额 | |
| `livestockCarry(state, productId): number` | 该畜产品的产量零头（分桶；旧档 number 视为公共零头） | |

内部：`CARRY_EPSILON = 1e-9`；job 占位规则：`status !== "collected"` 即占位，收取即移除释放；`makeJobId(state, prefix, nowMs)` ✅ 确定性（`${prefix}_${nowMs.toString(36)}_${n}` 线性探测防撞，无 Math.random）。

### 4.1 `enqueueJob(state, { buildingId, recipeId } = {}, nowMs = Date.now()): Envelope` ✅

| 前置（按序） | 失败码 |
| --- | --- |
| recipe 存在且 `recipe.buildingId === buildingId` | `prod.recipe_mismatch` |
| `buildings[buildingId]?.built` | `prod.not_built` |
| `meta.level >= recipe.unlockLevel` | `prod.level_low` |
| 有空槽（`pickSlot` 取最小空闲槽号） | `prod.slots_full` |
| `spendInv(inputs)` 成功 | `prod.input_short` |

成功入队（工时 buff ✅ 已落地，现为 kitchen 字面量；【R2-4】改为按 buildingId 查 buff，一行顺带覆盖 weavery 苇姐 0.85）：

```
timeMs = max(1, round(recipe.timeMs × buffFactor(state, buildingId)))   // 灶台叔叔 kitchen 0.8；无匹配 = 1
job = { id: makeJobId(state, "job", nowMs), buildingId, recipeId, kind: "craft",
        status: "running", doneAt: nowMs + timeMs, slot,
        productId: recipe.outputId, qty: recipe.outputQty, xp: recipe.xp || 0 }
```

### 4.2 `collectJob(state, { buildingId, slot } = {}): Envelope` ✅

`slot` 匹配序：字符串 → 按 `job.id`（规范用法）；整数 → 先按 `job.slot` 再按数组下标；缺省 → 该建筑第一单 done。畜牧单可正常收取；main.js 的 `collectLivestock` 兜底为死代码（【R2-19】删除）。

| 前置 | 失败码 |
| --- | --- |
| job 找到 | `prod.job_not_found` |
| `status === "done"` | `prod.job_running` |
| productId 可解析（回退链 `job.productId → recipe.outputId → animal.productId`）且 qty ≥ 1 | `prod.job_corrupt` |

成功：`inv[productId] += qty`；xp 取 `collectXp` 回退链（job 快照 → recipe.xp → 畜牧 animal.xp，旧档 0 也不让玩家白干）✅；按数组位置移除该 job。

### 4.3 `feedAnimal(state, { buildingId, slot } = {}, nowMs = Date.now()): Envelope` ✅（冬饲 +20% 已落地）

| 前置（按序） | 失败码 |
| --- | --- |
| `animalByBuilding(buildingId)` 存在 | `prod.no_livestock` |
| `buildings[buildingId]?.built` | `prod.not_built` |
| 有空圈（`pickSlot`，可传 `slot` 指定偏好圈位） | `prod.pen_full` |
| 库存饲料 ≥ `need` | `prod.feed_short` |

饲料量（✅ `drawFeedCost`；扣料失败时两个记账桶都不动）：

```
accrued = winterFeedCarry + (meta.season === "winter" ? 0.2 : 0)
need    = 1 + floor(accrued + ε)
成功后:  winterFeedCarry = accrued - floor(accrued + ε)
```

产量（✅ `drawYield`，按 productId 分桶，长期期望精确等于倍率）：

```
total = livestockCarry[animal.productId] + 1 × livestockYieldMultiplier(state)
qty   = max(1, floor(total + ε))
成功后: livestockCarry[animal.productId] = max(0, total - qty)   // ≤ε 时删键
```

成功入队：`{ id: makeJobId(…, "live", nowMs), buildingId, recipeId: animal.id, kind: "livestock", status: "running", doneAt: nowMs + animal.cycleMs, slot: 圈位, productId, qty, xp: animal.xp }`，写回两个记账桶。

### 4.4 `unlockSlot(state, { buildingId } = {}): Envelope` ✅

失败码按序：`prod.not_built` / `prod.no_slots`（def 无 slots）/ `prod.slot_max`（≥6）/ `prod.coin_short`。费用 `40 + 当前位 × 20`；成功 `slotCount = 当前位 + 1`。费用序列（从 2 位起）：80、100、120、140 → 累计 440 金到 6 位。

### 4.5 `tickProduction(state, dtMs, now = Date.now()): State` — 节拍 ✅

过滤假值与 `status === "collected"` 残单；`running && now >= doneAt` → `done`。

## 5. Village 契约（`src/systems/village/index.js` + `rng.js`，Opus-3）

导出常量 ✅：`WISH_SLOTS = 3`、`WISH_REFRESH_HOURS = 2`、`WISH_EXPIRE_DAYS = 3`、`PET_COOLDOWN_MS = 20_000`。
模块内常量 ✅：`WISH_TOOL_CHANCE = 0.35`（权重锹 0.4 / 斧 0.35 / 锯 0.25）、`WISH_PEARL_CHANCE = 0.04`、`BASE_DARK_CHANCE = 0.08`、`FAVORITE_WARMTH = 8`、`GUEST_BASE_STAY_DAYS = 2`、`GUEST_MAX_STAY_DAYS = 4`、`GUEST_STAY_PER_WARMTH = 20`、`CAP_POP_PER_BUILDING = 4`、`COOK_CRIT_WARMTH = 60`、`COOK_CRIT_CHANCE = 0.1`、`WISH_BONUS_SLOT_WARMTH = 100`、幸福加成（步长 10、每步 +4%、封顶 +100%）。

村落元数据 `state.village`（懒建 ✅，hydrate 补齐见 §2.3）：`wishSeq`（心愿流水号）、`nextWishAt`（补位计时，纪元 ms）、`cooked` / `darkDishes`（烹饪计数，兼作确定性 rng 种子）、`lastDay`（日结哨兵）。

### 5.0 查询函数 ✅

| 签名 | 返回 |
| --- | --- |
| `happinessMult(state): number` | `1 + min(1, floor(happiness / 10) × 0.04)` |
| `guestCapacity(state): number` | `1 + (level >= 4 ? 1 : 0) + (guestroom 已建 ? 2 : 0)`（最大 4）。**裁决**：Lv1 即有 1 位为准（GDD 口径按本表回写，Fable-3/4） |
| `guestBuffFactor(state, target): number` | 在座嘉宾同 target 连乘、钳 [0.5, 2]（与 §2.2 buffFactor 同语义）；【R2-4】改薄封装，导出保留 |
| `wishCandidates(state): WishDef[]` | `minLevel ≤ level ≤ maxLevel` 过滤 ✅；滤空两级兜底：先只按 minLevel，再全池（数据表改坏时宁可给旧单不空墙） |
| `wishSlots(state): number` | `3 + (warmth >= 100 ? 1 : 0)`——温馨 ≥100 常驻第 4 心愿格 ✅ |
| `kitchenRecipe(recipeId): Recipe \| null` | 接受配方 id / 菜品 id / 产物 id 三种写法，只认 kitchen 出品 ✅ |
| `kitchenMenu(state): 菜单行[]` | 全部厨房菜谱 + 呈现层数据（name/inputs/warmth/happiness/desc/unlocked/unlockLevel），供 UI 直接铺菜单 ✅ |
| `placedFurniture(state)` / `hasFurniture(state, id)` / `furnitureWarmth(state)` | village 本地副本（双形状兼容），仅 `rolloverDays` 保底在用；规范实现在 `core/furniture.js`（§5.9），【R2-21】改 import 去重 |

### 5.1 心愿生成与补位 ✅

`refreshWishes(state, nowMs = Date.now()): State` — 节拍：把板补满到 `wishSlots(state)`（3 或 4）单（清除 status "done" 残单），并重置 `nextWishAt = nowMs + wishIntervalMs(state)`。

| 机制 | 公式 / 规则 |
| --- | --- |
| 选单（确定性，禁随机） | `candidates = wishCandidates(state)`；空位起始下标 `start = wrap(meta.day + 板上已有数, len)`，板上已有同 id 则向后线性探测；`wishId = `${base.id}_d${day}_${seq}``，seq = `village.wishSeq` 递增 |
| tier 缩放 | `tier = min(3, 1 + max(0, floor((level - 4) / 3)))`（Lv1–6 = 1，Lv7–9 = 2，Lv10 = 3）；`needs ×tier`；`coin = round(base.coin × tier × (tier > 1 ? 1.1 : 1))`；`xp = round(base.xp × tier)` |
| 补位间隔 | `wishIntervalMs = max(1000, round(2 游戏时 × meta.hourMs × guestBuffFactor(state, "wish")))`——灯哥 0.85 在此生效（默认 12s 真实 → 10.2s）。数值事实源已上收 `data/wishes.js` 的 `WISH_REFRESH_MIN = 120`（=2 游戏时）✅，village 本地 `WISH_REFRESH_HOURS = 2` 改读数据表【R2-22】 |
| 补位节拍（`refillWishSlot`，tickVillage 调用） | open ≥ wishSlots → 原 state；板空 → 立即补满；`nextWishAt` 未设 → 设定后等待；`nowMs >= nextWishAt` → 补 1 单 |
| 过期 | `rolloverDays`：`day - createdDay >= 3` 的 open 单撤下 + log |

【R2-9 行为变更】`deliverWish` 成功后**删除末尾的 `refreshWishes(next)` 立即补满**，空位交给补位节拍——否则 2 游戏时节奏与灯哥 buff 只在过期/换单路径生效（SOTA A4 要求实测生效）。**联动**：GPT-sol-1 同批次改 `tests/economy.test.js` 的送达后 `toHaveLength(3)` 断言（改为断言 open 数 −1，补位另测）。

### 5.2 `acceptWish(state, { wishId } = {}): Envelope` ✅（已实装，非 no-op）

失败码：`village.wish_missing` / `village.wish_taken`（已是 accepted）。成功：该单 `status: "accepted"`，extras 带 `wish`。当前无 UI 入口（心愿默认全可交付），导出冻结供测试；不接 action。

### 5.3 `deliverWish(state, { wishId, rng } = {}): Envelope` ✅（rng 走 payload，见 §0.3）

匹配：`w.wishId === wishId || w.id === wishId`。

| 前置 | 失败码 |
| --- | --- |
| 心愿存在 | `village.wish_missing` |
| 状态非 done | `village.wish_done` |
| `hasInv(needs)` | `village.wish_short` |

成功（✅ 落地公式；掉落数值处于双口径期，见下）：

```
coins = max(1, round(wish.coin × happinessMult(state)))
扣 needs；coin += coins；happiness += 1；xp += wish.xp；移除该单；log 一条
掉落（rollWith 确定性）——现状落地口径：
  rollWith(rng, "wish-gift", …)  < 0.35 → 工具 +1（pickWeighted：锹 0.4 / 斧 0.35 / 锯 0.25，直接进 resources）
  rollWith(rng, "wish-pearl", …) < 0.04 → pearl += 1
extras: { coins, gifts: string[] }
```

【R2-22 掉落校准，Opus-3 + Opus-4】`918239d` 已把校准后的数值事实源落进 `data/wishes.js`（未接线，village 仍用本地 0.35 口径）：`WISH_TOOL_DROP = 0.25`、`WISH_PEARL_DROP = 0.04`、`TOOL_DROP_WEIGHTS`（锹 0.4 / **锯 0.35 / 斧 0.25**，权重按全程需求比反转）、保底 `TOOL_PITY_ORDER = ["axe","saw","shovel"]`（新档前 3 次交单按序必掉）+ `TOOL_PITY_DROUGHT = 6`（连续 6 单未掉工具，下一单按权重必掉）。接线时同步：village 本地常量改 import 数据表；engine 开局工具 2/1/1 → **1/0/0**（保底取代「开局白送」权宜）；保底计数需在 `state.village` 增字段（pityStep/drought，hydrate 补 0）。接线前后 T0/T1/T2 数值不同，验收按双口径记录（`ACCEPTANCE.md`）。

锹/斧/锯**只**产自心愿掉落——这是后续作坊建材的唯一来源，概率改动属经济表变更须过 Fable-3。【R2-9】移除末尾立即补满（§5.1）。

### 5.4 `inviteGuest(state, { guestId } = {}): Envelope` ✅

| 前置（按序） | 失败码 |
| --- | --- |
| guest 存在 | `village.guest_unknown` |
| 未在座 | `village.guest_present` |
| 在座数 < `guestCapacity(state)` | `village.guest_full`（extras 带 `{ cap }`） |

成功：`guests += { id, sinceDay: day, untilDay: day + stayDays }`，`stayDays = 2 + floor(warmth / 20)`（邀请瞬间快照）；`warmth += 4`；log 一条。离店：`rolloverDays` 日结时 `untilDay < day` 即收拾行李 + log。无邀请等级门槛（容量曲线控节奏，旧草案 level≥4 门槛作废）。

### 5.5 `cook(state, { recipeId, dishId, guestId, rng } = {}): Envelope` ✅ +【R2-4 翻车率 buff】

配方解析走 `kitchenRecipe(recipeId || dishId)`（接受配方/菜品/产物 id）✅。

| 前置（按序） | 失败码 |
| --- | --- |
| `kitchenRecipe` 命中 | `village.not_kitchen` |
| `buildings.kitchen?.built` | `village.not_built` |
| `meta.level >= recipe.unlockLevel` | `village.level_low` |
| `spendInv(inputs)` 成功 | `village.food_short` |

判定（✅ 确定性种子 = [recipe.id, guestId, day, floor(gameMinutes), village.cooked]）：

```
dark = rollWith(rng, "cook", ...seed) < BASE_DARK_CHANCE × buffFactor(state, "kitchen")
       // 【R2-4】灶台叔叔在场 8% → 6.4%。现状无 buff 项——落地注释以旧契约"4 应用点"为由拒绝，
       // 本版裁决推翻：SOTA_CHECKLIST A4 (P0) 明确断言翻车率 ×0.8，一行确定性改动，Opus-3 落实
crit = !dark && warmth >= 60 && rollWith(rng, "cook-crit", ...seed) < 0.1   // ✅ 温馨暴击
favorite = !dark && guest?.favorite === recipe.outputId                      // ✅
```

| 项 | 正常 | crit 额外 | favorite 额外 | 黑暗料理 |
| --- | --- | --- | --- | --- |
| warmth | + `dish.warmth`（未登记 +6） | — | 再 +8 | −1 |
| happiness | + `dish.happiness`（未登记 +3） | — | 再 +2 | −2 |
| 产物 | `inv[outputId] += outputQty` | 数量 ×2 | — | 同正常 |
| 嘉宾停留 | — | — | `untilDay += 1`，封顶 `sinceDay + 4` ✅ | — |
| 计数 | `cooked += 1` | 同左 | 同左 | 另 `darkDishes += 1` |
| extras | `{ dark, favorite, crit, qty }` | | | |

厨房嘉宾 buff 对 `cook` 只作用于翻车率；工时 ×0.8 作用于 `enqueueJob` 的 kitchen 工单（§4.1）。

### 5.6 `build(state, { buildingId } = {}): Envelope` ✅

| 前置（按序） | 失败码 |
| --- | --- |
| 建筑定义存在 | `village.building_unknown` |
| 未建过 | `village.already_built` |
| `meta.level >= def.unlockLevel` | `village.level_low` |
| `def.popNeed` 满足（可选字段，当前数据未用） | `village.pop_short`（extras `{ need }`） |
| `def.kind === "pop"` 时 `pop < popCap` | `village.pop_capped` |
| 资源类花费（键在 `resources` 上的走资源）足够 | `village.res_short` |
| 库存类花费（其余 itemId 走 `inv`）足够 | `village.inv_short` |

成功：扣两类花费；`buildings[id] = { built: true, slots: [], slotCount: def.slots || 0 }`；`kind === "pop"` → `pop = min(popCap, pop + 1)`；`kind === "cap"` → `popCap += 4`；log 一条。

### 5.7 `petPlay(state, { petId, now = Date.now() } = {}): Envelope` ✅（now 走 payload，落地惯例）

失败码：`village.pet_missing` / `village.pet_rest`（`readyAt > now`）。
成功：`coin += 3 + (petyard 已建 ? 2 : 0)`；`happiness += (kind === "cat" ? 2 : 1)`；`readyAt = now + 20_000`；log 一条；extras `{ coin }`。

### 5.8 `stallSell(state, { itemId, qty = 1 } = {}): Envelope` ✅（R2-13 已收官：系统 + UI 全落地）

| 前置（按序） | 失败码 |
| --- | --- |
| `buildings.stall?.built` | `village.stall_missing` |
| `floor(Number(qty)) >= 1` | `village.qty_invalid` |
| `inv[itemId] >= qty` | `village.stock_short` |
| `priceOf(itemId) > 0` | `village.worthless` |

成功：`coin += round(stallPrice(itemId, qty) × guestBuffFactor(state, "stall"))`（茶婆婆 1.1；`stallPrice = round(基准价 × qty × 1.15)`，事实源 `data/items.js`）；`inv[itemId] -= qty`；log 一条；extras `{ coin }`。

摊位 UI 落地版 ✅（本表即契约，实现者按此对账；旧拟稿的 `data-qty` 属性与「成功走 applyResult」作废 §10.3）：

| 件 | 落地形态 |
| --- | --- |
| UI 态 | `ui.sellId / ui.sellQty` 由纯 UI 动作 `meta/sell` 维护：payload `{ itemId }` = 选货（换货从 1 件重数）；`{ step: ±1 }` = 加减件数；`{ qty: "max" }` = 全库存。件数恒钳 `[1, 库存]`，库存为 0 时清选中 |
| reducer | `village/stall` 失败走 `applyResult`；**成功不走** `applyResult`——写回 `ui.sellId/sellQty`（卖光清选中、未卖光钳到剩余），toast「摊上收进 N 金币」（tone good，fx collect） |
| handlers | `pickSell(itemId)` / `sellQty(step)` / `sellMax()` / `sell(itemId, qty)`——`sell` 在 handler 层补全参数（缺 itemId 取 `ui.sellId`，无选中飘「先在货架上挑一样东西」；qty 缺省取 `ui.sellQty`，`"max"` 取全库存，钳 [1, 库存]） |
| 委托 data-act | `sellpick`(data-id=货) / `sellstep`(data-id=±1) / `sellmax` / `sell`(data-id=货, data-b="max"\|件数) |
| 面板 | `detailStall(state, ui)`：未建 → `unbuiltPanel`；货架列 `priceOf > 0` 的库存按单价降序（`data-act="sellpick"`，行内标 `stallPrice(id,1)` 金/个）；选中后出成交行（− / 件数 / + / 全都要 / 「卖出 N 件 · 约 M 金」）；`priceOf === 0` 的物品归入脚注「没人收：…」；页眉注明摊价 = 基准价 115% 且有嘉宾加成 |
| 假工位 bug ✅ | 已修：无 slots/无配方/无牲口/无工单的建筑（stall、社区、民居……）走 `detailPlainBuilding`（`KIND_NOTE` 一句话文案），不再落进 `def.slots \|\| 2` 兜底的假工位面板 |

### 5.9 家具：`placeFurniture(state, { furnitureId } = {}): Envelope` ✅（R2-12 已收官；**规范实现 = `core/furniture.js`**，仲裁见下）

**双实现仲裁**：第二波出现两套并行实现——village 的 `place`（落盘 `{id, room, day}` 对象）与 `core/furniture.js` 的 `placeFurniture`（落盘 `string` id）。main.js 的 `village/furnish` 接的是 **core 版**，本版裁定 core 版为唯一契约；village 侧写入端（`place` / `placeFurniture` 导出）为死代码【R2-21 删除，api.test 未断言可安全删】。village 读取端（`furnitureWarmth` 等，rolloverDays 日衰减保底在用）暂保留双形状兼容，R2-21 改 import core/furniture 后删兼容。

| 前置（按序） | 失败码 |
| --- | --- |
| `furnitureById(furnitureId)` 存在 | `village.furniture_unknown` |
| `!isPlaced(state, furnitureId)` | `village.furniture_owned` |
| `meta.level >= def.unlockLevel` | `village.level_low` |
| 资源类花费（coin/pearl）足够 | `village.res_short` |
| 库存类花费（cloth/wool）足够 | `village.inv_short` |

成功 ✅：复用 `splitCost` 扣两类花费；`furniture += def.id`（**string**，不进 `inv`）；`warmth += def.warmth`；log 一条；extras `{ warmth }`。不可拆除（v1 裁决：只加不减，省一套摆放 UI）。

温馨保底双闸 ✅：① `core/furniture.applyFurnitureWarmth` 在 main.js `finalize`（`meta/tick` 与 `meta/offline` 收尾）把 `resources.warmth` 兜到 `furnitureWarmth(state)` 之上；② village `rolloverDays` 日衰减为 `warmth = max(furnitureWarmth(state), warmth - 跨日数)`——家具是温馨的地板。

UI 落地版 ✅：蘑菇屋面板「屋里摆什么」区（`furnitureSection`）——按 room 分组（堂屋/灶间/院子/客房，`ROOM_NAME`），每件列温馨值/造价/描述，按钮态 = 已摆上 / 等 Lv.N / 差 X / 摆上，`data-act="place"`（旧拟稿 `data-act="furnish"` 作废，action 仍名 `village/furnish`）；区头显示「已摆 n/总数 · 温馨保底 N」。

### 5.10 `tickVillage(state, dtMs, nowMs = Date.now()): State` — 节拍 ✅

`refillWishSlot(rolloverDays(state), nowMs)`。`rolloverDays` 日结（以 `village.lastDay` 自检跨了几天，离线大跨度天然正确）：

| 项 | 规则 |
| --- | --- |
| 嘉宾离店 | `guestUntil(g) < day` → 移除 + log（`guestUntil` 缺 untilDay 时回退 `sinceDay + 2`，hydrate 补齐后可删） |
| 心愿过期 | `day - createdDay >= WISH_EXPIRE_DAYS(3)` 的 open 单撤下 + log |
| 温馨衰减 | `warmth = max(furnitureWarmth(state), warmth - 跨过的天数)` ✅ |

## 6. Action ↔ 函数映射（main.js `applyAction` 分派表）

| action.type | payload | 调用 | 状态 |
| --- | --- | --- | --- |
| `farm/till` | `{ plotId }` | `till` | ✅（【R2-10】改直传信封） |
| `farm/plant` | `{ plotId, cropId }` | `plant` | ✅ 成功推进教程步 2 |
| `farm/harvest` | `{ plotId }` | `harvest` | ✅ 成功推进教程步 3 |
| `farm/harvest_all` | `{}` | `harvestAll` | ✅ 工具条按钮 + H 键；成功推进教程步 3 |
| `farm/expand` | `{}` | `expandPlot` | ✅ |
| `farm/cover` | `{ plotId? }` | `expandGreenhousePlot` | 【R2-11】接线 + 温室面板 |
| `prod/enqueue` | `{ buildingId, recipeId }` | `enqueueJob` | ✅ |
| `prod/collect` | `{ buildingId, slot }` | `collectJob`（slot 传 job.id） | ✅（【R2-19】删 collectLivestock 死兜底） |
| `prod/feed` | `{ buildingId, slot }` | `feedAnimal` | ✅ |
| `prod/unlock` | `{ buildingId }` | `unlockSlot` | ✅ |
| `village/deliver` | `{ wishId }` | `deliverWish` | ✅ |
| `village/skip` | `{ wishId }` | 撕单 + `refreshWishes` 立即补 1（借 `ui.rerolls` 移位抽签，日期改回） | ✅ 换单立即补是有意为之（区别于交付，§5.1） |
| `village/invite` | `{ guestId }` | `inviteGuest` | ✅ |
| `village/cook` | `{ recipeId, guestId }` | `cook` | ✅ guestId 由 handler 的 `serveTarget` 补全：点名（ui.serveTo）→ 爱吃这道菜的 → 屋里第一位 |
| `village/build` | `{ buildingId }` | `build` | ✅ |
| `village/pet` | `{ petId }` | `petPlay` | ✅ |
| `village/stall` | `{ itemId, qty }` | `stallSell` | ✅ 成功路径特例（不走 applyResult，§5.8） |
| `village/furnish` | `{ furnitureId }` | `placeFurniture`（**core/furniture**） | ✅ |
| `meta/tick` | `{ dt, now? }` | `ARCHITECTURE.md §4.3` 管线 | ✅（【R2-18】透传 now） |
| `meta/offline` | `{ savedAt, now }` | `applyOfflineCatchup`（注入 catchUpPlots/tickProduction/tickVillage）→ `finalize` → 摘要 toast（几块地熟了/几件活好了；capped 注明 8h 封顶） | ✅ 启动仅一次、**先于**首个 `meta/tick`；`offlineMs = 0` 时返回原引用（main 补「接着上次的日子过」toast） |
| `meta/mute` | `{}` | `meta.muted` 取反 | ✅ |
| `meta/seed` | `{ cropId }` | 写 `ui.seed` | ✅ |
| `meta/sell` | `{ itemId? , step?, qty?: "max" }` | 纯 UI 态：维护 `ui.sellId/sellQty`（§5.8） | ✅ |
| `meta/serve` | `{ guestId }` | 纯 UI 态：切换 `ui.serveTo`（点同一人取消点名） | ✅ |
| `meta/select` | `{ id }` | 写 `ui.selected`；教程末步联动 | ✅ |
| `meta/tutorial` | `{}` | 跳过教程（step = 4） | ✅ |
| `meta/toast` | `{ text, tone?, fx? }` | 组合根内部飘字 | ✅ |
| `meta/settings` | `{ hourMs }` | 白名单 {3000, 6000, 12000} 校验后写 meta，非法忽略 | 【R2-15】 |
| `meta/save` `meta/load` `meta/replace` | — | 保留字：组合根直接调 save/replace，不进 reducer | ✅ |

reducer 对未知 type **必须**返回原 state 引用（静默）。旧草案的 `village/wish`（acceptWish 接线）作废——导出保留，不接 action。

## 7. 错误码总表（= `core/reasons.js` 的 `REASONS`，自本版冻结：只加不改不删）

「现状原文」列 = 双读期 D1 测试助手要同时接受的落地中文；「同」表示与 message 一字不差。

| reason | message | 抛出者 | 现状原文 |
| --- | --- | --- | --- |
| `core.inv_short` | 材料不够 | spendInv | 同 |
| `farm.plot_not_found` | 没有这块地 | till/plant/wilt/expandGreenhousePlot | 同 |
| `farm.till_invalid` | 这块地不用再翻了 | till | 同（现在 main.js 预检里） |
| `farm.crop_unknown` | 没有这种作物 | plant | 同 |
| `farm.crop_locked` | 小镇等级不够 | plant | 同 |
| `farm.plot_unavailable` | 这块地还不能种 | plant | 同 |
| `farm.coin_short` | 金币不够买种子 | plant | 同 |
| `farm.not_ready` | 还没熟 | harvest | 同 |
| `farm.plot_empty` | 地里空着 | harvest | 同 |
| `farm.nothing_ready` | 还没有能收的地 | harvestAll | 同 |
| `farm.wilt_invalid` | 这块地没种东西 | wilt | 同 |
| `farm.pop_short` | 人手不够，先盖房子添人 | expandPlot | 同 |
| `farm.level_low` | 小镇等级不够，再攒些经验 | expandPlot | 同 |
| `farm.expand_cost` | 扩建要 40 金币和 1 把锹 | expandPlot | 同 |
| `farm.no_greenhouse` | 先把温室盖起来 | expandGreenhousePlot | 同 |
| `farm.greenhouse_all` | 所有地都在温室里了 | expandGreenhousePlot（缺省 plotId 且无地可罩） | 同 |
| `farm.greenhouse_dup` | 这块地已经在温室里了 | expandGreenhousePlot | 同 |
| `farm.greenhouse_full` | 温室罩不下更多地了 | expandGreenhousePlot | 同 |
| `farm.greenhouse_cost` | 改温室要 80 金币和 1 把锯 | expandGreenhousePlot | 同 |
| `prod.recipe_mismatch` | 配方不对 | enqueueJob | 同 |
| `prod.not_built` | 还没建这座作坊 | enqueueJob/feedAnimal/unlockSlot | enqueueJob 同；feed/unlock 现为「还没建」 |
| `prod.level_low` | 小镇等级不够 | enqueueJob | 同 |
| `prod.slots_full` | 生产位满了 | enqueueJob | 同 |
| `prod.input_short` | 原料不够 | enqueueJob | 同 |
| `prod.job_not_found` | 没有这单活 | collectJob | 同 |
| `prod.job_running` | 还在忙 | collectJob | 同 |
| `prod.job_corrupt` | 这单活坏了 | collectJob | 同 |
| `prod.no_livestock` | 这里不养牲口 | feedAnimal | 同 |
| `prod.pen_full` | 圈里满了 | feedAnimal | 同 |
| `prod.feed_short` | 饲料不够 | feedAnimal | 同 |
| `prod.no_slots` | 这里没有工位 | unlockSlot | 同 |
| `prod.slot_max` | 已经满了 | unlockSlot | 同 |
| `prod.coin_short` | 金币不够 | unlockSlot | 同 |
| `village.wish_missing` | 心愿不见了 | acceptWish/deliverWish | 同 |
| `village.wish_taken` | 这单已经接下了 | acceptWish | 同 |
| `village.wish_done` | 这单已经交过了 | deliverWish | 同 |
| `village.wish_short` | 东西还没收齐 | deliverWish | 同 |
| `village.guest_unknown` | 村里没这个人 | inviteGuest | 同 |
| `village.guest_present` | 已经在屋里坐着 | inviteGuest | 同 |
| `village.guest_full` | 屋里坐满了，先添间客房 | inviteGuest | 现为动态「屋里只坐得下 N 位…」→ 静态化，cap 进 extras |
| `village.not_kitchen` | 厨房不会做这个 | cook | 同 |
| `village.not_built` | 厨房还没盖起来 | cook | 同 |
| `village.level_low` | 小镇等级不够 | cook/build（village）、placeFurniture（core/furniture） | 同 |
| `village.food_short` | 食材不够，别让客人饿着 | cook | 同 |
| `village.building_unknown` | 没有这种建筑 | build | 同 |
| `village.already_built` | 已经有了 | build | 同 |
| `village.pop_short` | 人手不够，还张罗不起来 | build | 现为动态「人手不够，要 N 个人…」→ 静态化，need 进 extras |
| `village.pop_capped` | 人口到顶了，先盖社区 | build | 同 |
| `village.res_short` | 建材或金币不够 | build（village）、placeFurniture（core/furniture） | build 同；placeFurniture 现为「金币或材料不够」→ 归一 |
| `village.inv_short` | 库存不够 | build（village）、placeFurniture（core/furniture） | 同 |
| `village.pet_missing` | 它跑去田埂了 | petPlay | 同 |
| `village.pet_rest` | 它还想再躺会儿 | petPlay | 同 |
| `village.stall_missing` | 摊位还没支起来 | stallSell | 同 |
| `village.qty_invalid` | 至少也得摆一件出去 | stallSell | 同 |
| `village.stock_short` | 货不够 | stallSell | 同 |
| `village.worthless` | 这个卖不出价 | stallSell | 同 |
| `village.furniture_unknown` | 没有这件家具 | placeFurniture（core/furniture） | 同 |
| `village.furniture_owned` | 这件已经摆上了 | placeFurniture（core/furniture） | 同 |

## 8. 嘉宾 buff 应用点（恰好 7 处，公式即规格；`bf = buffFactor(state, target)`）

| target | 嘉宾/系数 | 应用函数（唯一） | 时机 | 公式 | 状态 |
| --- | --- | --- | --- | --- | --- |
| `farm` | 林婶 0.85 | `plant` | 播种瞬间快照进 doneAt | `grow = max(1000, round(bf × growMs / seasonFactor))` | ✅ |
| `kitchen`(工时) | 灶台叔叔 0.8 | `enqueueJob`（buildingId === "kitchen"） | 入队瞬间快照进 doneAt | `timeMs = max(1, round(recipe.timeMs × bf))` | ✅（现为 kitchen 字面量） |
| `kitchen`(翻车) | 灶台叔叔 0.8 | `cook` | 开火瞬间 | `dark = roll < 0.08 × bf` | 【R2-4】Opus-3（裁决推翻落地注释，见 §5.5） |
| `weavery` | 苇姐 0.85 | `enqueueJob`（buildingId === "weavery"） | 入队瞬间快照进 doneAt | 同 kitchen 工时行 | 【R2-4】Opus-2：kitchen 字面量改 `bf(state, buildingId)` 一行通吃 |
| `wish` | 灯哥 0.85 | `wishIntervalMs`（refillWishSlot 计时） | 计算下次补位时间 | `interval = round(2 游戏时 × hourMs × bf)` | ✅ |
| `livestock` | 竹仔 1.1 | `feedAnimal` | 投喂瞬间快照进 job.qty | 余数分桶累积（§4.3） | ✅ |
| `stall` | 茶婆婆 1.1 | `stallSell` | 成交瞬间 | `coin = round(stallPrice × bf)` | ✅ |

除本表外任何代码不得读 `guest.buff`；`cook` 的 favorite 加成走 `guest.favorite`，不属 buff 体系。多嘉宾同 target 连乘、钳 [0.5, 2]——三个系统的本地实现口径已统一 ✅，【R2-4】剩余工作 = 收敛到 `core/buffs.js` 单模块去重（三处改薄封装，导出名不变）。

## 9. 冻结导出面（api.test.js + probe.mjs + 脚本断言，删改即红）

| 模块 | 冻结导出 |
| --- | --- |
| farm | `till` `plant` `harvest` `expandPlot` `tickPlots` `seasonFactor`；probe 可选位 `catchUpPlots` `harvestAll`；另契约冻结 `wilt` `applyGuestFarmBuff` `canPlant` `isGreenhousePlot` `greenhousePlotCount` `expandGreenhousePlot` 与常量 `OFF_SEASON_FACTOR` `WILT_GRACE_MS` `OFFLINE_CAP_MS` `GREENHOUSE_PLOT_CAP` `GREENHOUSE_COIN` `GREENHOUSE_SAW` |
| production | `enqueueJob` `collectJob` `feedAnimal` `unlockSlot` `tickProduction` `canCraft`；另 `buildingSlots` `freeSlots` `livestockYieldMultiplier` `feedCost` `winterFeedCarry` `livestockCarry` `MAX_SLOTS` `WINTER_FEED_SURCHARGE` |
| village | `acceptWish` `deliverWish` `refreshWishes` `inviteGuest` `cook` `build` `petPlay` `stallSell` `tickVillage`；另 `guestCapacity` `guestBuffFactor` `wishCandidates` `wishSlots` `happinessMult` `kitchenRecipe` `kitchenMenu` 与 4 个常量。**解冻**：家具五件套（`place`/`placeFurniture`/`placedFurniture`/`hasFurniture`/`furnitureWarmth`）——core/furniture 版胜出（§5.9），api.test 未断言，R2-21 删写入端、读取端改 import |
| core/engine | `createInitialState` `advanceTime` `OFFLINE_CAP_MS`（另 §2.1 全部；`absGameMinutes` 除外——死代码待删） |
| core/offline ✅ | `applyOfflineCatchup` `offlineSpan` `humanGap`（main.js 与 §6 `meta/offline` 在用） |
| core/furniture ✅ | `placeFurniture` `placedFurniture` `isPlaced` `furnitureWarmth` `applyFurnitureWarmth`（main.js + screens.js 在用） |
| data | `CROPS` `RECIPES` `BUILDINGS` `ANIMALS`（另 `GUESTS` `WISH_POOL` `ITEM_NAMES` `BASE_PRICES` `stallPrice` `priceOf` `STALL_MARKUP` `DISHES` `dishByRecipe` `FURNITURE` 及各 `xxxById`） |
| data/levels ✅ | `XP_TABLE` `levelForXp` `xpForNext`（§2.4；engine 再导出后 UI/main 迁移 import） |
| data/wishes（数值事实源，R2-22 接线前即冻结） | `WISH_REFRESH_MIN` `WISH_TOOL_DROP` `WISH_PEARL_DROP` `TOOL_DROP_WEIGHTS` `TOOL_PITY_ORDER` `TOOL_PITY_DROUGHT`；data/animals 另有 `WINTER_FEED_SURCHARGE`（production 本地同值常量改 import，随 R2-22 批次） |

## 10. Round 1 → Round 2 差异台账

### 10.1 已落地（DONE，本版契约已收编；★ = Round 2 首波 `baf4247..4b97e21`，★★ = 第二波 `9d68a4e`+`918239d`）

| 项 | 落点 |
| --- | --- |
| 可玩闭环 + 增量 UI（骨架/签名比对/每帧通道/事件委托）+ 4 步教程 + fx 音效通道 | main.js / ui/screens.js |
| 心愿重写：tier 缩放、3 日过期、补位计时器、工具 35% / 珍珠 4% 掉落、幸福加成封顶、`village/skip` 换单 | village |
| ★ 心愿 minLevel + maxLevel 双向过滤（两级兜底）；温馨 ≥100 第 4 心愿格 | village |
| 确定性 RNG（rng.js 状态哈希）替代 Math.random（village 全域） | village/rng.js |
| 嘉宾容量 / 温馨定停留 / untilDay 离店 / 温馨日衰减；★ favorite 续住封顶 `sinceDay + 4` | village |
| cook：厨房建成 + 等级门槛 + 9 道菜谱 + 菜品加成表 + 确定性翻车；★ 温馨 ≥60 暴击 ×2、kitchenRecipe/kitchenMenu（cook 接受配方/菜品/产物 id） | village + data/dishes |
| ★ 家具系统：placeFurniture + `state.furniture` + furnitureWarmth 温馨保底盘 | village + data/furniture |
| stallSell 逻辑全量（价格表 / qty 校验 / worthless / 茶婆婆 buff） | village + data/items |
| build：popNeed / 人口上限 / 社区 +4；petPlay：宠物院 +2、猫狗差异 | village |
| 农耕全量（季节 / 枯萎宽限 / 扩建三重门 / harvestAll / catchUpPlots 纯函数）；★ crop.unlockLevel 门槛 + canPlant；★ 温室地块制（expandGreenhousePlot 付费改造，cap 3，全场免疫废除） | farm |
| 工位 / 畜牧收取修复 + collectXp 回退链；★ 冬季饲料 +20%（winterFeedCarry 记账 + feedCost 查询）；★ 畜牧余数按产品分桶；★ enqueueJob/feedAnimal 末位 nowMs + makeJobId 确定性（systems 已零内嵌时钟/随机）；★ kitchen 工时 buff（字面量） | production |
| ★ 三系统 buff 口径统一（连乘 + 钳 [0.5, 2]，各自本地实现） | farm/production/village |
| 自动存档三通道 + hydrate 骨架 + 坏档兜底 | main.js / core/save |
| ★★ 离线折算全链：`core/offline.js`（offlineSpan/humanGap/applyOfflineCatchup，systems 注入）+ `meta/offline` 启动派发（先于首 tick）+ 摘要 toast/log + engine `OFFLINE_CAP_MS` | core/offline + engine + main.js |
| ★★ 家具接线：`core/furniture.js`（string id 落盘 + applyFurnitureWarmth 兜底）+ `village/furnish` + 蘑菇屋「屋里摆什么」分间面板 | core/furniture + main.js + ui |
| ★★ 摊位 UI：`detailStall` 货架/成交行 + `meta/sell` UI 态 + `village/stall` 接线；假工位 bug 修复（`detailPlainBuilding`） | main.js + ui |
| ★★ 厨房整本菜单：`detailKitchen`（全菜谱卡片 + 库存对照 + 最爱标注）+「端给谁」点名（`meta/serve` + serveTarget 回退链） | main.js + ui |
| ★★ `farm/harvest_all` 接线 + 工具条「全部收获」+ H 键（R2-14 收官） | main.js + ui |
| ★★ `finalize` 收尾统一（tick 与 offline 共用：家具温馨兜底 + 等级重算）；地块 wilted 态可视化（枯地/要重翻文案） | main.js + ui |
| ★★ `data/levels.js`（XP_TABLE/levelForXp/xpForNext）+ 经济校准数据契约（w_veg 14→10 金/8→5 xp、白菜跨春、掉率 0.25/保底常量——数据落地待接线 R2-22） | data |
| 12 套四季×昼夜皮肤；54 tests 绿；★ production.test.js、offline-smoke、wish-board 脚本 | styles / tests / scripts |

### 10.2 Round 2 剩余工单（TODO，编号被全文引用；依赖：D0→D1→D2→D3 见 §0.2）

| # | 内容 | 所有者 | 状态 |
| --- | --- | --- | --- |
| R2-1 | `core/reasons.js` + 双读迁移四步（§0.2，D1 影响面 7 处断言；D2 含 core/furniture.js） | Opus-4 → GPT-sol-1 → Opus-1/2/3 → GPT-sol-1 | TODO |
| R2-2 | 离线常量去重：farm `OFFLINE_CAP_MS` 改 engine 再导出（接线主体 ★★ 已收官） | Opus-1 | 残留 |
| R2-2b | `catchUpPlots` 生长封顶：超出封顶窗口的 growing 地块顺延 overflow（§3.10 裁决，offline-smoke 转 ok:true，SOTA A6） | Opus-1 | TODO |
| R2-3 | `levelProgress` 迁入 `data/levels.js` + engine 薄再导出 + 删 engine 重复表（模块与 XP_TABLE ★★ 已落地） | Fable-3 + Opus-4 | 残留 |
| R2-4 | buff 收官：`core/buffs.js` 落地 + 三处本地实现改薄封装（语义已统一，纯去重）；enqueueJob kitchen 字面量 → `buffFactor(state, buildingId)`（覆盖 weavery）；cook 翻车率 ×kitchen（§5.5 裁决） | Opus-4 + Opus-2 + Opus-3 + Opus-1 | 口径 ✅ / 收敛 TODO |
| R2-7 | `canPlant` UI 接线：种子条按等级置灰（系统门槛 ✅；现状种子条只有反季/缺钱两种态） | Opus-4 | UI TODO |
| R2-9 | `deliverWish` 停止立即补满（§5.1，联动 economy.test 断言；现状 L280 仍尾调 refreshWishes） | Opus-3 + GPT-sol-1 | TODO |
| R2-10 | `till` 信封化（§3.2，联动 main.js 删预检） | Opus-1 + Opus-4 | TODO |
| R2-11 | 温室 UI：`farm/cover` 接线 + 温室面板（系统 `expandGreenhousePlot` ✅）+ hydrate 旧档迁移（§2.3） | Opus-4 | UI/迁移 TODO |
| R2-15 | `meta/settings`（hourMs 白名单 3000/6000/12000）+ 设置入口 | Opus-4 | TODO |
| R2-16 | hydrate 增补表（§2.3）+ `SAVE_VERSION`/`MIGRATIONS` | Opus-4 | TODO |
| R2-17 | `tickPlots` 枯萎写日志 | Opus-1 | TODO |
| R2-18 | `meta/tick` 透传 `payload.now` | Opus-4 | TODO |
| R2-19 | 死代码清理：main.js `collectLivestock` 兜底（collectJob 已认畜牧单）+ engine `absGameMinutes`（第二波误重新引入，零调用方） | Opus-4 | TODO |
| R2-20 | 边界静态测试（禁 document/localStorage/内嵌 Date.now/Math.random）——前置违规已清零，随时可落 | GPT-sol-1 | TODO |
| R2-21 | 家具去重：删 village 写入端（`place`/`placeFurniture` 导出，api.test 未断言）；village 读取端改 import core/furniture 并删双形状兼容（§5.9） | Opus-3 | TODO |
| R2-22 | 经济校准接线（数据契约 ★★ 已冻结）：village 掉落改读 `WISH_TOOL_DROP`/`TOOL_DROP_WEIGHTS` + 保底（`TOOL_PITY_ORDER`/`TOOL_PITY_DROUGHT`，village 增计数字段）；`WISH_REFRESH_HOURS` 改读 `WISH_REFRESH_MIN`；engine 开局工具 2/1/1 → 1/0/0；production `WINTER_FEED_SURCHARGE` 改 import data/animals（§5.3） | Opus-3 + Opus-2 + Opus-4 | TODO |

已完成收编（原工单号保留备查）：R2-5 冬饲 ★、R2-6 production 注入/确定性 id ★、R2-7 系统侧作物门槛 ★、R2-8 心愿 minLevel ★、R2-11 系统侧温室地块制 ★、R2-12 家具（系统 ★ + core/UI ★★）、R2-13 摊位 UI ★★、R2-14 全部收获 ★★。

P2（不阻塞 SOTA，滚入下一轮）：favorite 续住与温馨经济复衡（Fable-3）；货运码头 / 节日广场玩法；`prefers-reduced-motion`；环境音。

### 10.3 已废条目（旧草案 → 本版删除，防止实现者按旧文施工）

| 旧条目 | 处置 |
| --- | --- |
| rootReducer 三段式（route/applyResult/finalize）、失败写 log | 落地为 applyAction + toast 飘字，`ARCHITECTURE.md §3.3`（第二波新增的 `finalize` 只是 tick/offline 共用收尾，非旧三段式复活） |
| `absGameMinutes(meta)`、顶层 `wishNextAt`（游戏分钟） | 作废：心愿计时落地为 `village.nextWishAt`（纪元 ms）。注意 `9d68a4e` 把 `absGameMinutes` 重新写进了 engine——零调用方，仍属作废，【R2-19】删除 |
| `guests[].leaveDay` | 改名 `untilDay`（落盘前改名，不升存档版本） |
| deliverWish 掉落 3% 珍珠 / 10% 工具、末位 `rand` 参数 | 落地为 4% / 35%、payload `rng` + 状态哈希；35% 与权重再被数据契约校准为 25% + 保底（R2-22，双口径见 §5.3） |
| inviteGuest 的 level ≥ 4 门槛 | 作废：容量曲线（guestCapacity）控节奏 |
| 温室「建成即全场免疫」；本文上一版拟的 `setGreenhouse` 免费开关（cap 4） | 落地为 `expandGreenhousePlot` 付费改造（80 金 + 锯，cap 3，不可撤销） |
| “buff 应用点恰好 4 处” | 扩为 7 处（§8），新增 stall / weavery / cook 翻车率 |
| `production.livestockCarry` 单一 number | 落地为按 productId 分桶（旧档 number 兼容读） |
| 音效决策读 `action.type` | 落地为 `ui.fx` 信号 |
| 帧 dt 钳制 200ms | 落地为 500ms + 100ms 累积 |
| 初始工具「落地 2/1/1 即终态」 | 撤销：数据契约恢复 1/0/0 为目标（保底掉落取代开局白送，R2-22）；2/1/1 仅为接线前现状 |
| `src/data/prices.js` | 已由 `data/items.js` 取代（`WISH_REFRESH_MIN = 120` 上一版误一并作废——`918239d` 已落进 `wishes.js` 为事实源，恢复有效） |
| 心愿选单公式 `(day * 7 + open.length) % pool` | 落地为 `wrap(day + 板上已有数, len)` + 线性探测 + wishSeq 流水号 |
| `wiltOffSeason(state)` 批量枯萎 | 早已作废，宽限机制取代 |
| stallSell 拒卖文案「这东西没人收」 | 落地改回「这个卖不出价」（§7 以落地为准） |
| `applyOfflineCatchup` 拟落 `core/engine.js`、三参签名 | 落地为 `core/offline.js` 四参（`systems` 注入，core 不反向依赖 systems，§2.2） |
| 家具落盘 `{ id, room, day }` 对象（village 版写入端） | 落地为 string id 数组（core/furniture 版接线胜出，§5.9；village 写入端 R2-21 删除） |
| 摊位 UI 拟稿：`data-qty` 属性、「卖 1 / 卖全部」两按钮、成功走 applyResult | 落地为 `meta/sell` UI 态 + 件数 stepper + `data-b`；成功路径特例（§5.8） |
| 家具 UI 拟稿 `data-act="furnish"` | 落地为 `data-act="place"`（action 名 `village/furnish` 不变） |
| `data/levels.js` 拟导出 `MAX_LEVEL` | 作废：落地版未导出、无使用方（§2.4） |
| 离线「B 时基计时器一律自然到期」的一揽子裁决 | 收窄：仅 jobs/pets/心愿计时自然到期；农田生长按 8h 封顶顺延（R2-2b，§3.10，与 offline-smoke/SOTA A6 对齐） |
