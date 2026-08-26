# API 契约（实施级 · Round 2 定稿）

> 与 `ARCHITECTURE.md` 配套。签名与行为以 **`548e6c6` 提交的落地代码为基准**：已落地的行为在本版即契约（标 ✅），Round 2 变更点标 `【R2-n】`（工单编号见 §10.2）并指名所有者。实现者不得偏离本文的签名、reason 码、公式与字段名。Round 1 草案中被落地代码推翻的条目集中在 §10.3，一律作废。

## 0. 约定与术语

### 0.1 函数三类（返回形状唯一化）

| 类别 | 返回 | 例 |
| --- | --- | --- |
| 命令（玩家动作） | 信封 `Envelope` | `plant` `enqueueJob` `deliverWish` `stallSell` |
| 查询（selector，只读无副作用） | 裸值，**永不**返回信封 | `canCraft` `seasonFactor` `freeSlots` `guestCapacity` `happinessMult` `levelForXp` |
| 节拍（tick / 离线结算驱动） | 裸完整 nextState | `tickPlots` `tickProduction` `tickVillage` `catchUpPlots` `advanceTime`（含元组）`refreshWishes` |

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
| `extras` | 仅限可序列化原始值/小对象（`cook` 的 `dark/favorite`、`harvestAll` 的 `count`、`deliverWish` 的 `coins/gifts`、`stallSell/petPlay` 的 `coin`）；禁止塞函数 |

**现状**：全系统仍把中文原文直接写在 `reason` 里，无 `message`；且 `tests/invariants.test.js` / `tests/economy.test.js` **精确断言中文 reason**（`spendInv`→“材料不够”、`enqueueJob`→“原料不够”、`deliverWish`→“东西还没收齐”、`collectJob`→“还在忙”），其中三处是 `toEqual` 整信封断言——**加 `message` 字段都会炸测试**。因此迁移必须按以下次序分四步走，每步独立绿：

| 步 | 所有者 | 动作 | 为什么先做 |
| --- | --- | --- | --- |
| D0 | Opus-4 | 落地 `core/reasons.js`（§2.2）：`REASONS` 全表 + `msg(code)` + `fail(state, reason, extras)`。同时把 `main.js` 的 `applyResult` 飘字改为 `result.message \|\| msg(result.reason)`——`msg` 对未知码原样返回，所以中文 reason（未知码）与机器码都能正确显示 | UI 先兼容双格式，系统才能分批迁移而不把机器码怼到玩家脸上 |
| D1 | GPT-sol-1 | 测试改双读：新增助手 `expectReason(result, code)` ≙ 断言 `result.ok === false && result.state === 入参 && (result.reason === code \|\| result.reason === REASONS[code])`；把三处 `toEqual` 整信封断言拆成逐字段断言（否则新增 `message` 字段必炸） | 测试先松，系统改动才不会一夜全红 |
| D2 | Opus-1/2/3 + Opus-4(store.js) | 各系统按任意顺序、任意批次迁移：失败路径统一 `return fail(state, "域.代码", extras)`。动态插值文案（如“屋里只坐得下 N 位”）改为 §7 静态文案，动态数值放 extras | D0/D1 已就位，随时可并行 |
| D3 | GPT-sol-1 | 全系统迁移完成后收紧：`expectReason` 只认机器码；新增静态断言——`systems/**` 与 `core/store.js` 源码中 `reason:` 后不得出现汉字（正则 `reason:\s*"[^"]*[\u4e00-\u9fff]`） | 关闭双读期，防回潮 |

双读期起点 = D0 合入，终点 = D3 合入。期间任何新代码**直接写机器码**（不允许再新增中文 reason）。

### 0.3 参数演进与注入约定

| 规则 | 内容 |
| --- | --- |
| 追加参数 | 新参数只能追加到末位且带默认值（`nowMs = Date.now()`）；已有位置参数的顺序与含义永不变；payload 对象内加可选键允许 |
| 注入双轨（裁决） | farm/production 用**末位参数**注入时间；village 已落地**payload 字段**注入（`deliverWish/cook` 的 `rng`、`petPlay` 的 `now`），保持现状不改（改了要动测试与调用方，收益为零）。新函数默认走末位参数 |
| rng 语义 | `rollWith(rng, ...parts)`：注入了 `rng` 用注入值（钳 [0, 0.999999]）；未注入时由 parts 派生 FNV 哈希，同一存档同一参数结果恒定 |
| payload 兜底 | 命令函数解构 payload 须带 `= {}`（production/village ✅；farm 未做，Opus-1 顺手补齐，无行为差异） |

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
| `resources.happiness / warmth` | int ≥0 | 40 / 20 | — | village（`normalizeMood` 取整钳非负） |
| `resources.pop / popCap` | int | 2 / 4 | — | village(build) |
| `resources.shovel / axe / saw` | int ≥0 | **2 / 1 / 1** | — | farm(expand 扣) / village(掉落、建造扣) |
| `inv` | `Record<itemId, int ≥1>`（0 即删键） | `{ chili: 2 }` | — | addInv 系 |
| `plots[]` | `{ id, status, cropId, plantedAt, doneAt, wiltAt?, greenhouse }` | 2 块（p1 empty、p2 untilled） | B | farm |
| `plots[].status` | `untilled\|empty\|growing\|ready\|wilted` | — | — | farm |
| `plots[].wiltAt` | epoch ms；0/缺失 = 无枯萎倒计时 | 初始缺失，hydrate 补 0【R2-16】 | B | farm |
| `buildings` | `Record<id, { built: true, slots: [], slotCount?: int }>`（未建 = 无键） | mushroom、wish | — | village(build) / production(unlockSlot) |
| `jobs[]` | `{ id, buildingId, recipeId, kind: "craft"\|"livestock", status: "running"\|"done", doneAt, slot, productId, qty, xp }` | `[]` | B | production |
| `production` | `{ livestockCarry: float ≥0, winterFeedCarry?: float ≥0【R2-5】 }` | **懒建**（首次投喂才出现），hydrate 补齐【R2-16】 | — | production |
| `village` | `{ wishSeq: int, nextWishAt: epoch ms, cooked: int, darkDishes: int, lastDay: int }` | **懒建**，hydrate 补齐【R2-16】 | B（nextWishAt） | village |
| `wishes[]` | `{ ...池条目, wishId, needs(缩放后), coin, xp, tier, status: "open"\|"accepted", createdDay }` | `[]`（首 tick 补满 3） | A（createdDay） | village |
| `guests[]` | `{ id, sinceDay, untilDay }` | `[]` | A | village |
| `pets[]` | `{ id, name, kind: "dog"\|"cat", readyAt }` | 小花/小团 | B | village |
| `furniture` 【R2-12 新增】 | `string[]`（已摆放家具 id 集合） | `[]` | — | village(placeFurniture) |
| `log[]` | string，≤40 条，新的在前 | 1 条开场白 | — | 全体经 pushLog |
| `ui` | `{ seed, selected, toast, fx, rerolls }`；toast/fx 落盘置 null | `createInitialUi()` | — | main.js/UI 动作 |

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
| engine.js | `LEVELS`、`levelFor(xp)`、`levelProgress(xp)`、`TUTORIAL_TOTAL = 4` | 【R2-3】改为 data/levels.js 的薄再导出，签名不变 |
| engine.js | 常量 `HOUR_MS_DEFAULT / DAY_HOURS / DAYS_PER_SEASON` | 6000 / 24 / 7 |
| save.js | `SAVE_KEY`、`serialize(state)`、`deserialize(raw)`、`hydrate(saved, base?)`、`writeSave(state)`、`readSave()`、`clearSave()` | `deserialize` 返回 `{savedAt, state} \| null`，内部已过 hydrate |
| events.js | `createBus()` | 冻结不用，禁新增依赖 |

### 2.2 【R2 新增】core 导出（本文即规格，精确签名）

| 模块 | 签名 | 规格 |
| --- | --- | --- |
| engine.js 【R2-2】 | `export const OFFLINE_CAP_MS = 28_800_000` | 8 真实小时；farm 本地同名常量改为从此 import（Opus-1 配合） |
| engine.js 【R2-2】 | `export function applyOfflineCatchup(state, savedAt, nowMs = Date.now()): { state, offlineMs: number, capped: boolean }` | 编排算法 = `ARCHITECTURE.md §4.4` 六步；`savedAt` 非有限数 → `{ state, offlineMs: 0, capped: false }`（state 原引用）；plots 域委托 farm 的 `catchUpPlots`（§3.10） |
| buffs.js 【R2-4】 | `export function buffFactor(state, target): number` | 遍历 `state.guests`，`guestById(g.id)?.buff.target === target` 的 `factor` 连乘（非有限/≤0 的 factor 跳过），结果 `Math.min(2, Math.max(0.5, x))`；无匹配 = 1。target 任意字符串（未知 target 天然返回 1） |
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
| `production` | 与 `{ livestockCarry: 0, winterFeedCarry: 0 }` 合并 |
| `village` | 与 `{ wishSeq: 0, nextWishAt: 0, cooked: 0, darkDishes: 0, lastDay: meta.day }` 合并 |
| `furniture` | `[]` |
| `meta.hourMs` 非法值（∉ {3000, 6000, 12000}） | `6000` |
| 温室旧档迁移【R2-11 联动】 | `buildings.greenhouse.built` 且无任何 `plot.greenhouse` → 按数组序给前 4 块地 `greenhouse: true`（旧档不静默失去温室效果） |

### 2.4 `src/data/levels.js`（R2-3，Fable-3 实现，本文即规格）

```js
export const XP_TABLE = [0, 40, 100, 180, 280, 420, 600, 820, 1100, 1450]; // 下标 i = Lv.(i+1) 门槛
export const MAX_LEVEL = XP_TABLE.length;                                   // 10
export function levelForXp(xp): number;    // 1..MAX_LEVEL；xp < 0 按 0 处理
export function xpForNext(level): number;  // 升到 level+1 的累计门槛；level >= MAX_LEVEL → Infinity
export function levelProgress(xp): { level, base, next, pct }; // 满级 { next: null, pct: 100 }（与 engine 落地版行为逐位一致）
```

engine.js 双读期薄再导出：`export { XP_TABLE as LEVELS, levelForXp as levelFor, levelProgress } from "../data/levels.js"`。UI/main 改 import 后删除再导出。

## 3. Farm 契约（`src/systems/farm/index.js`，Opus-1）

模块常量：`OFF_SEASON_FACTOR = 0.55`、`WILT_GRACE_MS = 45_000`、`MIN_BUFF_FACTOR = 0.5`、`MIN_GROW_MS = 1_000`、`OFFLINE_CAP_MS`（【R2-2】改 import）、【R2-11】`GREENHOUSE_COVERS = 4`。

温室判定【R2-11 变更】：`isGreenhouse(state, plot)` 现状 = `plot.greenhouse || buildings.greenhouse?.built`（建成即全场）；改为**只看 `plot.greenhouse`**——GDD 与 SOTA_CHECKLIST 口径均为“温室地块”，全场免疫在 Lv8 直接消灭季节机制。覆盖由 `setGreenhouse`（§3.11）管理，旧档迁移见 §2.3。

### 3.1 `seasonFactor(crop, season, greenhouse = false): number` — 查询 ✅

| 条件 | 返回 |
| --- | --- |
| `greenhouse === true` 或 `!crop` | 1 |
| `crop.seasons.includes(season)` | 1 |
| 否则（错季） | 0.55 |

### 3.2 `applyGuestFarmBuff(state, growMs = 1): number` — 查询 ✅

farm buff（林婶 0.85）连乘后乘到 `growMs`；【R2-4】内部改调 `buffFactor(state, "farm")` 统一钳制 [0.5, 2]，导出保留。

### 3.3 `till(state, { plotId }): Envelope` 【R2-10 改返回形状】

现状返回裸 state、无效操作静默（前置检查散落在 main.js）；改为信封。**协同点**：Opus-4 同一批次把 main.js 的 `farm/till` 分支改为 `applyResult(state, till(state, payload), "till")` + 成功时 `advanceTutorial(…, 1)`，删除 main.js 里的 plot 状态预检，否则双重包裹。

| 前置 | 失败码 |
| --- | --- |
| plot 存在 | `farm.plot_not_found` |
| `status ∈ {untilled, wilted}` | `farm.till_invalid` |

成功：该 plot → `{ status: "empty", cropId: null, plantedAt: 0, doneAt: 0, wiltAt: 0 }`。

### 3.4 `plant(state, { plotId, cropId }, now = Date.now()): Envelope` ✅ +【R2-7】

| 前置（按序短路） | 失败码 | 状态 |
| --- | --- | --- |
| `cropById(cropId)` 存在 | `farm.crop_unknown` | ✅ |
| 【R2-7】`meta.level >= crop.unlockLevel` | `farm.crop_locked` | ❌ 新增（数据早已备好，UI 种子条同步置灰，Opus-4） |
| plot 存在 | `farm.plot_not_found` | ✅ |
| `status === "empty"` | `farm.plot_unavailable` | ✅ |
| `coin >= crop.seedCost` | `farm.coin_short` | ✅ |

成功效果（快照式，唯一公式，✅ 已落地）：

```
factor = seasonFactor(crop, meta.season, isGreenhouse(state, plot))
grow   = max(MIN_GROW_MS, round(applyGuestFarmBuff(state, crop.growMs / factor)))
coin  -= crop.seedCost
plot   = { status: "growing", cropId, plantedAt: now, doneAt: now + grow,
           wiltAt: factor === 1 ? 0 : doneAt + WILT_GRACE_MS }
```

`seasonFactor` 在分母（错季 0.55 → 时长 ×1.82）；farm buff 在分子（林婶 0.85 → 时长 ×0.85）。播种后换季/嘉宾离店不回溯 `doneAt`；季节变化对 `wiltAt` 的影响由 `tickPlots` 持续管理。

### 3.5 `harvest(state, { plotId }, now = Date.now()): Envelope` ✅

| 前置 | 失败码 |
| --- | --- |
| plot 存在且（ready 或 growing 且 `now >= doneAt`） | `farm.not_ready` |
| `cropById(plot.cropId)` 存在 | `farm.plot_empty` |

成功：`inv[crop.yieldId] += crop.yieldQty`；`meta.xp += crop.xp`；plot 复位；log 一条。

### 3.6 `harvestAll(state, now = Date.now()): Envelope` ✅（函数已落地，【R2-14】接线 action + 工具条按钮，Opus-4）

逐块尝试 `harvest`。全失败 → `{ ok: false, reason: "farm.nothing_ready", state, count: 0 }`；否则 `{ ok: true, state, count }`。

### 3.7 `wilt(state, { plotId }): Envelope` ✅ — 强制枯萎，调试/剧情用

失败码：`farm.plot_not_found` / `farm.wilt_invalid`（status ∉ {growing, ready}）。成功转 wilted + log。

### 3.8 `tickPlots(state, dtMs, now = Date.now()): State` — 节拍 ✅ +【R2-17】

| 规则 | 行为 |
| --- | --- |
| 熟化 | `growing && now >= doneAt` → `ready`（先于枯萎判定） |
| 当季（factor === 1，含温室地块） | 清 `wiltAt = 0` |
| 错季 | 无倒计时则起算 `wiltAt = max(doneAt, now) + WILT_GRACE_MS`；`now >= wiltAt` → 枯萎。【R2-17】枯萎时 pushLog 一条（现状静默，玩家不知道苗没了） |
| 无变化 | 返回原 state 引用（短路订阅通知） |

### 3.9 `expandPlot(state): Envelope` ✅

| 前置（按序） | 失败码 | 公式 |
| --- | --- | --- |
| `plots.length < pop × 2` | `farm.pop_short` | 一人照看两块地 |
| `plots.length < 1 + meta.level` | `farm.level_low` | 等级放开上限 |
| `coin >= 40 && shovel >= 1` | `farm.expand_cost` | |

成功：扣 40 金 + 1 锹；追加 `{ id: "p" + (历史最大编号 + 1), status: "untilled", ... }`。

### 3.10 `catchUpPlots(state, savedAt, now = Date.now()): State` — 节拍 ✅（读档后一次，由 `applyOfflineCatchup` 调用）

```
away = clamp(now - savedAt, 0, OFFLINE_CAP_MS)；savedAt 非有限数按 now 处理
away === 0 → tickPlots(state, 0, now)
否则：所有 wiltAt > savedAt 的地块 wiltAt = max(wiltAt, now + WILT_GRACE_MS)   // 人不在家不判枯
      然后 tickPlots(state, away, now)
```

### 3.11 【R2-11 新增】`setGreenhouse(state, { plotId, on = true }): Envelope`

| 前置（按序） | 失败码 |
| --- | --- |
| `buildings.greenhouse?.built` | `farm.no_greenhouse` |
| plot 存在 | `farm.plot_not_found` |
| `on === true` 时：已覆盖数 < `GREENHOUSE_COVERS`(4) | `farm.greenhouse_full` |

成功：`plot.greenhouse = on`（可自由开关，不收费）；`on` 转 true 且 plot 正错季生长时，下一次 `tickPlots` 自然清 `wiltAt`（无需特判）。UI：温室详情面板列地块开关（Opus-4）。

## 4. Production 契约（`src/systems/production/index.js`，Opus-2）

模块常量：`MAX_SLOTS = 6`（导出）、`CARRY_EPSILON = 1e-9`。job 占位规则：`status !== "collected"` 即占位（collected 仅存在于旧档），收取即从数组移除释放。

### 4.1 查询函数 ✅

| 签名 | 返回 |
| --- | --- |
| `canCraft(state, recipeId): boolean` | recipe 存在 && level ≥ unlockLevel && 建筑已建 && hasInv(inputs) |
| `buildingSlots(state, buildingId): number` | `slotCount ?? def.slots`，钳 [0, 6]；两者都缺 → 0（无 slots 定义的建筑不能生产） |
| `freeSlots(state, buildingId): number` | `buildingSlots − 占位 job 数`，最低 0 |
| `livestockYieldMultiplier(state): number` | livestock buff 连乘（竹仔 1.1）；【R2-4】改调 `buffFactor(state, "livestock")` 统一钳制，导出保留 |

### 4.2 `enqueueJob(state, { buildingId, recipeId } = {}, nowMs = Date.now()): Envelope` 【R2-6 追加末位 nowMs】【R2-4 工时 buff】

| 前置（按序） | 失败码 |
| --- | --- |
| recipe 存在且 `recipe.buildingId === buildingId` | `prod.recipe_mismatch` |
| `buildings[buildingId]?.built` | `prod.not_built` |
| `meta.level >= recipe.unlockLevel` | `prod.level_low` |
| 有空槽（`pickSlot` 取最小空闲槽号） | `prod.slots_full` |
| `spendInv(inputs)` 成功 | `prod.input_short` |

成功入队（【R2-4】新增第一行，通吃 kitchen ×0.8 与 weavery ×0.85 两个工时 buff）：

```
timeMs = round(recipe.timeMs * buffFactor(state, buildingId))   // 无匹配 buff 时 = 1，等价现状
job = { id: makeJobId(state, "job", nowMs), buildingId, recipeId, kind: "craft",
        status: "running", doneAt: nowMs + timeMs, slot,
        productId: recipe.outputId, qty: recipe.outputQty, xp: recipe.xp || 0 }
```

【R2-6】`makeJobId(state, prefix, nowMs)`：id = `` `${prefix}_${nowMs.toString(36)}_${n}` ``，n 从 0 起对已占 id 线性探测——删除现有 `Math.random` 段，碰撞循环已保证唯一。

### 4.3 `collectJob(state, { buildingId, slot } = {}): Envelope` ✅

`slot` 匹配序：字符串 → 按 `job.id`（规范用法）；整数 → 先按 `job.slot` 再按数组下标（兼容）；缺省 → 该建筑第一单 done。畜牧单已可正常收取（回退链 `job.productId → recipe.outputId → animal.productId`），main.js 的 `collectLivestock` 兜底为死代码（【R2-19】删除）。

| 前置 | 失败码 |
| --- | --- |
| job 找到 | `prod.job_not_found` |
| `status === "done"` | `prod.job_running` |
| productId 可解析且 qty ≥ 1 | `prod.job_corrupt` |

成功：`inv[productId] += qty`；`meta.xp += job.xp`；按数组位置移除该 job（旧档可能重复 id）。

### 4.4 `feedAnimal(state, { buildingId, slot } = {}, nowMs = Date.now()): Envelope` 【R2-6 nowMs】【R2-5 冬饲】

| 前置（按序） | 失败码 |
| --- | --- |
| `animalByBuilding(buildingId)` 存在 | `prod.no_livestock` |
| `buildings[buildingId]?.built` | `prod.not_built` |
| 有空圈（`pickSlot`，可传 `slot` 指定偏好圈位） | `prod.pen_full` |
| 库存饲料 ≥ `need` | `prod.feed_short` |

饲料量（现状恒 1；【R2-5】冬季 +20%，确定性余数累积；失败时 carry **不动**）：

```
carryW' = (production.winterFeedCarry ?? 0) + (meta.season === "winter" ? 0.2 : 0)
need    = 1 + floor(carryW' + CARRY_EPSILON)
成功后:  production.winterFeedCarry = carryW' - floor(carryW' + CARRY_EPSILON)
```

产量（✅ `drawYield`，长期期望精确等于倍率）：

```
total = livestockCarry + 1 × livestockYieldMultiplier(state)
qty   = max(1, floor(total + CARRY_EPSILON))
成功后: livestockCarry = max(0, total - qty)
```

成功入队：`{ id: makeJobId(state, "live", nowMs), buildingId, recipeId: animal.id, kind: "livestock", status: "running", doneAt: nowMs + animal.cycleMs, slot: 圈位, productId: animal.productId, qty, xp: animal.xp }`，写回两个 carry。

### 4.5 `unlockSlot(state, { buildingId } = {}): Envelope` ✅

| 前置（按序） | 失败码 |
| --- | --- |
| 已建 | `prod.not_built` |
| `def.slots` 存在 | `prod.no_slots` |
| 当前生产位 < 6 | `prod.slot_max` |
| `coin >= 40 + 当前位 × 20` | `prod.coin_short` |

成功：扣费，`slotCount = 当前位 + 1`。费用序列（从 2 位起）：80、100、120、140 → 累计 440 金到 6 位。

### 4.6 `tickProduction(state, dtMs, now = Date.now()): State` — 节拍 ✅

过滤假值与 `status === "collected"` 残单；`running && now >= doneAt` → `done`。

## 5. Village 契约（`src/systems/village/index.js` + `rng.js`，Opus-3）

导出常量 ✅：`WISH_SLOTS = 3`、`WISH_REFRESH_HOURS = 2`、`WISH_EXPIRE_DAYS = 3`、`PET_COOLDOWN_MS = 20_000`。
模块内常量 ✅：`WISH_TOOL_CHANCE = 0.35`（权重锹 0.4 / 斧 0.35 / 锯 0.25）、`WISH_PEARL_CHANCE = 0.04`、`BASE_DARK_CHANCE = 0.08`、`FAVORITE_WARMTH = 8`、`GUEST_BASE_STAY_DAYS = 2`、`GUEST_STAY_PER_WARMTH = 20`、`CAP_POP_PER_BUILDING = 4`、幸福加成（步长 10、每步 +4%、封顶 +100%）。

村落元数据 `state.village`（懒建 ✅，hydrate 补齐见 §2.3）：`wishSeq`（心愿流水号）、`nextWishAt`（补位计时，纪元 ms）、`cooked` / `darkDishes`（烹饪计数，兼作确定性 rng 种子）、`lastDay`（日结哨兵）。

### 5.0 查询函数 ✅

| 签名 | 返回 |
| --- | --- |
| `happinessMult(state): number` | `1 + min(1, floor(happiness / 10) × 0.04)` |
| `guestCapacity(state): number` | `1 + (level >= 4 ? 1 : 0) + (guestroom 已建 ? 2 : 0)`（最大 4）。**裁决**：Lv1 即有 1 位为准（GDD “Lv4 开 1 位”与“客房 +1”按本表回写，Fable-3/4） |
| `wishCandidates(state): WishDef[]` | 现状只滤 `maxLevel >= level`；【R2-8】改为 `minLevel <= level && level <= maxLevel`，滤空则回退全池（防呆） |
| 【R2-12】`furnitureWarmth(state): number` | 已摆家具的 `warmth` 之和（温馨保底盘） |

### 5.1 心愿生成与补位 ✅（本节为落地行为的契约化）

`refreshWishes(state, nowMs = Date.now()): State` — 节拍：把板补满到 3 单（清除 status "done" 残单），并重置 `nextWishAt = nowMs + wishIntervalMs(state)`。

| 机制 | 公式 / 规则 |
| --- | --- |
| 选单（确定性，禁随机） | `candidates = wishCandidates(state)`；第 k 个空位的起始下标 `start = (meta.day + 板上已有数) % len`，板上已有同 id 则向后线性探测；`wishId = `${base.id}_d${day}_${seq}``，seq = `village.wishSeq` 递增 |
| tier 缩放 | `tier = min(3, 1 + max(0, floor((level - 4) / 3)))`（Lv1–6 = 1，Lv7–9 = 2，Lv10 = 3）；`needs ×tier`；`coin = round(base.coin × tier × (tier > 1 ? 1.1 : 1))`；`xp = round(base.xp × tier)` |
| 补位间隔 | `wishIntervalMs = max(1000, round(2 游戏时 × meta.hourMs × buffFactor(state, "wish")))`——灯哥 0.85 在此生效（默认 12s 真实 → 10.2s） |
| 补位节拍（`refillWishSlot`，tickVillage 调用） | open ≥ 3 → 原 state；板空 → 立即补满；`nextWishAt` 未设 → 设定后等待；`nowMs >= nextWishAt` → 补 1 单 |
| 过期 | `rolloverDays`：`day - createdDay >= 3` 的 open 单撤下 + log（防低级单永久占板） |

【R2-9 行为变更】`deliverWish` 成功后**删除末尾的 `refreshWishes(next)` 立即补满**，空位交给补位节拍——否则 2 游戏时节奏与灯哥 buff 只在过期路径生效（SOTA A4 断言实测生效）。**联动**：GPT-sol-1 同批次改 `tests/economy.test.js` 的 `toHaveLength(3)` 断言（改为断言送达后 open 数 −1，补位另测）。

### 5.2 `acceptWish(state, { wishId } = {}): Envelope` ✅（已实装，非 no-op）

失败码：`village.wish_missing` / `village.wish_taken`（已是 accepted）。成功：该单 `status: "accepted"`，extras 带 `wish`。当前无 UI 入口（心愿默认全可交付），导出冻结供测试；不接 action。

### 5.3 `deliverWish(state, { wishId, rng } = {}): Envelope` ✅（rng 走 payload，见 §0.3）

匹配：`w.wishId === wishId || w.id === wishId`。

| 前置 | 失败码 |
| --- | --- |
| 心愿存在 | `village.wish_missing` |
| 状态非 done | `village.wish_done` |
| `hasInv(needs)` | `village.wish_short` |

成功（✅ 落地公式）：

```
coins = max(1, round(wish.coin × happinessMult(state)))
扣 needs；coin += coins；happiness += 1；xp += wish.xp；移除该单；log 一条
掉落（rollWith 确定性）：
  rollWith(rng, "wish-gift", …)  < 0.35 → 工具 +1（pickWeighted：锹 0.4 / 斧 0.35 / 锯 0.25，直接进 resources）
  rollWith(rng, "wish-pearl", …) < 0.04 → pearl += 1
extras: { coins, gifts: string[] }
```

锹/斧/锯**只**产自心愿掉落——这是后续作坊建材的唯一来源，概率改动属经济表变更须过 Fable-3。【R2-9】移除末尾立即补满（§5.1）。

### 5.4 `inviteGuest(state, { guestId } = {}): Envelope` ✅

| 前置（按序） | 失败码 |
| --- | --- |
| guest 存在 | `village.guest_unknown` |
| 未在座 | `village.guest_present` |
| 在座数 < `guestCapacity(state)` | `village.guest_full`（extras 带 `{ cap }`） |

成功：`guests += { id, sinceDay: day, untilDay: day + stayDays }`，`stayDays = 2 + floor(warmth / 20)`（邀请瞬间快照）；`warmth += 4`；log 一条。离店：`rolloverDays` 日结时 `untilDay < day` 即收拾行李 + log。无邀请等级门槛（容量曲线已控节奏，旧草案 level≥4 门槛作废）。

### 5.5 `cook(state, { recipeId, guestId, rng } = {}): Envelope` ✅ +【R2-4 翻车率 buff】

| 前置（按序） | 失败码 |
| --- | --- |
| recipe 存在且 `buildingId === "kitchen"` | `village.not_kitchen` |
| `buildings.kitchen?.built` | `village.not_built` |
| `meta.level >= recipe.unlockLevel` | `village.level_low` |
| `spendInv(inputs)` 成功 | `village.food_short` |

翻车判定（✅ 确定性：种子含 recipeId/guestId/day/gameMinutes/village.cooked）：

```
dark = rollWith(rng, "cook", …) < BASE_DARK_CHANCE × buffFactor(state, "kitchen")
                                  // 【R2-4】灶台叔叔在场 8% → 6.4%；现状无 buff 项
favorite = !dark && guest?.favorite === recipe.outputId
```

| 项 | 正常 | favorite 额外 | 黑暗料理 |
| --- | --- | --- | --- |
| warmth | + 菜品表 `dish.warmth`（未登记 +6） | 再 +8 | −1 |
| happiness | + 菜品表 `dish.happiness`（未登记 +3） | 再 +2 | −2 |
| 嘉宾停留 | — | `untilDay += 1`（无上限，旧草案 cap 作废；每次续住都耗食材，自平衡） | — |
| 产物 | `inv[outputId] += outputQty` | 同左 | 同左（黑暗料理也出菜） |
| 计数 | `village.cooked += 1` | 同左 | 另 `darkDishes += 1` |
| extras | `{ dark: false, favorite }` | | `{ dark: true, favorite: false }` |

厨房嘉宾 buff 对 `cook` 只作用于翻车率；工时 ×0.8 作用于 `enqueueJob` 的 kitchen 工单（§4.2）。

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

### 5.8 `stallSell(state, { itemId, qty = 1 } = {}): Envelope` ✅（逻辑齐全，缺 UI —【R2-13】）

| 前置（按序） | 失败码 |
| --- | --- |
| `buildings.stall?.built` | `village.stall_missing` |
| `floor(Number(qty)) >= 1` | `village.qty_invalid` |
| `inv[itemId] >= qty` | `village.stock_short` |
| `priceOf(itemId) > 0` | `village.worthless` |

成功：`coin += round(stallPrice(itemId, qty) × buffFactor(state, "stall"))`（茶婆婆 1.1；`stallPrice = round(基准价 × qty × 1.15)`，事实源 `data/items.js`）；`inv[itemId] -= qty`；log 一条；extras `{ coin }`。

【R2-13】UI 接线（Opus-4，精确规格）：

| 件 | 规格 |
| --- | --- |
| reducer | `village/stall` → `applyResult(state, stallSell(state, payload), "collect")` |
| handlers | `sell(itemId, qty = 1)` → `dispatch({ type: "village/stall", payload: { itemId, qty } })` |
| 委托 | `mount()` 增 `else if (act === "sell") call(h.sell, id, Number(btn.dataset.qty) || 1)` |
| 面板 | `detailBuilding` 对 `id === "stall"` 分支到新 `detailStall(state)`：列出 `inv` 中 `priceOf > 0` 的物品，每行显示单价（`stallPrice(id, 1)`）与「卖 1」/「卖全部」（`data-act="sell" data-id data-qty`）；`priceOf === 0` 的物品不出现；茶婆婆在座时标注 ×1.1。**现状 bug 一并修**：stall 无 `slots` 定义却落进工位面板（`def.slots || 2` 兜底显示假工位） |

### 5.9 【R2-12 新增】`placeFurniture(state, { furnitureId } = {}): Envelope`

| 前置（按序） | 失败码 |
| --- | --- |
| `furnitureById(furnitureId)` 存在 | `village.furniture_unknown` |
| `!state.furniture?.includes(furnitureId)` | `village.furniture_owned` |
| `meta.level >= def.unlockLevel` | `village.level_low` |
| 资源类花费（coin/pearl）足够 | `village.res_short` |
| 库存类花费（cloth/wool）足够 | `village.inv_short` |

成功：复用 `splitCost` 扣两类花费；`furniture = [...furniture, furnitureId]`；`warmth += def.warmth`；log 一条。家具不进 `inv`、不可拆除（v1 裁决：只加不减，省一套摆放 UI）。
温馨保底联动：`rolloverDays` 的日衰减改为 `warmth = max(furnitureWarmth(state), warmth - elapsed)`——家具是温馨的地板。
UI（Opus-4）：蘑菇屋详情面板新增「添置家什」区，按 room 分组列出未摆家具，`data-act="furnish"`。

### 5.10 `tickVillage(state, dtMs, nowMs = Date.now()): State` — 节拍 ✅

`refillWishSlot(rolloverDays(state), nowMs)`。`rolloverDays` 日结（以 `village.lastDay` 自检跨了几天，离线大跨度天然正确）：

| 项 | 规则 |
| --- | --- |
| 嘉宾离店 | `guestUntil(g) < day` → 移除 + log（`guestUntil` 缺 untilDay 时回退 `sinceDay + 2`，hydrate 补齐后可删） |
| 心愿过期 | `day - createdDay >= WISH_EXPIRE_DAYS(3)` 的 open 单撤下 + log |
| 温馨衰减 | `warmth -= 跨过的天数`，下限 0（【R2-12】改为下限 `furnitureWarmth(state)`） |

## 6. Action ↔ 函数映射（main.js `applyAction` 分派表）

| action.type | payload | 调用 | 状态 |
| --- | --- | --- | --- |
| `farm/till` | `{ plotId }` | `till` | ✅（【R2-10】改直传信封） |
| `farm/plant` | `{ plotId, cropId }` | `plant` | ✅ 成功推进教程步 2 |
| `farm/harvest` | `{ plotId }` | `harvest` | ✅ 成功推进教程步 3 |
| `farm/harvest_all` | `{}` | `harvestAll` | 【R2-14】+ 工具条按钮 |
| `farm/expand` | `{}` | `expandPlot` | ✅ |
| `farm/cover` | `{ plotId, on? }` | `setGreenhouse` | 【R2-11】 |
| `prod/enqueue` | `{ buildingId, recipeId }` | `enqueueJob` | ✅ |
| `prod/collect` | `{ buildingId, slot }` | `collectJob`（slot 传 job.id） | ✅（【R2-19】删 collectLivestock 死兜底） |
| `prod/feed` | `{ buildingId, slot }` | `feedAnimal` | ✅ |
| `prod/unlock` | `{ buildingId }` | `unlockSlot` | ✅ |
| `village/deliver` | `{ wishId }` | `deliverWish` | ✅ |
| `village/skip` | `{ wishId }` | 撕单 + `refreshWishes` 立即补 1（借 `ui.rerolls` 移位抽签，日期改回） | ✅ 换单立即补是有意为之（区别于交付，§5.1） |
| `village/invite` | `{ guestId }` | `inviteGuest` | ✅ |
| `village/cook` | `{ recipeId, guestId }` | `cook` | ✅ 菜谱可选（UI 传 recipeId） |
| `village/build` | `{ buildingId }` | `build` | ✅ |
| `village/pet` | `{ petId }` | `petPlay` | ✅ |
| `village/stall` | `{ itemId, qty }` | `stallSell` | 【R2-13】 |
| `village/furnish` | `{ furnitureId }` | `placeFurniture` | 【R2-12】 |
| `meta/tick` | `{ dt, now? }` | `ARCHITECTURE.md §4.3` 管线 | ✅（【R2-18】透传 now） |
| `meta/offline` | `{ savedAt, now? }` | `applyOfflineCatchup` | 【R2-2】启动时一次 |
| `meta/mute` | `{}` | `meta.muted` 取反 | ✅ |
| `meta/seed` | `{ cropId }` | 写 `ui.seed` | ✅ |
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
| `farm.plot_not_found` | 没有这块地 | till/plant/wilt/setGreenhouse | 同 |
| `farm.till_invalid` | 这块地不用再翻了 | till | 同（现在 main.js 预检里） |
| `farm.crop_unknown` | 没有这种作物 | plant | 同 |
| `farm.crop_locked` | 这种作物还没解锁，等小镇再升级 | plant【R2-7】 | — |
| `farm.plot_unavailable` | 这块地还不能种 | plant | 同 |
| `farm.coin_short` | 金币不够买种子 | plant | 同 |
| `farm.not_ready` | 还没熟 | harvest | 同 |
| `farm.plot_empty` | 地里空着 | harvest | 同 |
| `farm.nothing_ready` | 还没有能收的地 | harvestAll | 同 |
| `farm.wilt_invalid` | 这块地没种东西 | wilt | 同 |
| `farm.pop_short` | 人手不够，先盖房子添人 | expandPlot | 同 |
| `farm.level_low` | 小镇等级不够，再攒些经验 | expandPlot | 同 |
| `farm.expand_cost` | 扩建要 40 金币和 1 把锹 | expandPlot | 同 |
| `farm.no_greenhouse` | 温室还没盖起来 | setGreenhouse【R2-11】 | — |
| `farm.greenhouse_full` | 温室只罩得住 4 块地 | setGreenhouse【R2-11】 | — |
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
| `village.level_low` | 小镇等级不够 | cook/build/placeFurniture | 同 |
| `village.food_short` | 食材不够，别让客人饿着 | cook | 同 |
| `village.building_unknown` | 没有这种建筑 | build | 同 |
| `village.already_built` | 已经有了 | build | 同 |
| `village.pop_short` | 人手不够，还张罗不起来 | build | 现为动态「人手不够，要 N 个人…」→ 静态化，need 进 extras |
| `village.pop_capped` | 人口到顶了，先盖社区 | build | 同 |
| `village.res_short` | 建材或金币不够 | build/placeFurniture | 同 |
| `village.inv_short` | 库存不够 | build/placeFurniture | 同 |
| `village.pet_missing` | 它跑去田埂了 | petPlay | 同 |
| `village.pet_rest` | 它还想再躺会儿 | petPlay | 同 |
| `village.stall_missing` | 摊位还没支起来 | stallSell | 同 |
| `village.qty_invalid` | 至少也得摆一件出去 | stallSell | 同 |
| `village.stock_short` | 货不够 | stallSell | 同 |
| `village.worthless` | 这东西没人收 | stallSell | 同（旧草案拟名「这个卖不出价」作废） |
| `village.furniture_unknown` | 没有这件家具 | placeFurniture【R2-12】 | — |
| `village.furniture_owned` | 已经摆上了 | placeFurniture【R2-12】 | — |

## 8. 嘉宾 buff 应用点（恰好 7 处，公式即规格；`bf = buffFactor(state, target)`）

| target | 嘉宾/系数 | 应用函数（唯一） | 时机 | 公式 | 状态 |
| --- | --- | --- | --- | --- | --- |
| `farm` | 林婶 0.85 | `plant` | 播种瞬间快照进 doneAt | `grow = max(1000, round(bf × growMs / seasonFactor))` | ✅（applyGuestFarmBuff，R2-4 收敛口径） |
| `kitchen`(工时) | 灶台叔叔 0.8 | `enqueueJob`（buildingId === "kitchen"） | 入队瞬间快照进 doneAt | `timeMs = round(recipe.timeMs × bf)` | 【R2-4】Opus-2 |
| `kitchen`(翻车) | 灶台叔叔 0.8 | `cook` | 开火瞬间 | `dark = roll < 0.08 × bf` | 【R2-4】Opus-3 |
| `weavery` | 苇姐 0.85 | `enqueueJob`（buildingId === "weavery"） | 入队瞬间快照进 doneAt | 同 kitchen 工时行（§4.2 一行通吃） | 【R2-4】Opus-2 |
| `wish` | 灯哥 0.85 | `wishIntervalMs`（refillWishSlot 计时） | 计算下次补位时间 | `interval = round(2 游戏时 × hourMs × bf)` | ✅ |
| `livestock` | 竹仔 1.1 | `feedAnimal` | 投喂瞬间快照进 job.qty | 余数累积 `livestockCarry`（§4.4） | ✅（R2-4 收敛口径） |
| `stall` | 茶婆婆 1.1 | `stallSell` | 成交瞬间 | `coin = round(stallPrice × bf)` | ✅（R2-4 收敛口径） |

除本表外任何代码不得读 `guest.buff`。多嘉宾同 target 连乘、全局钳 [0.5, 2]（R2-4 后统一）。

## 9. 冻结导出面（api.test.js + probe.mjs 断言，删改即红）

| 模块 | 冻结导出 |
| --- | --- |
| farm | `till` `plant` `harvest` `expandPlot` `tickPlots` `seasonFactor`（另有 `harvestAll` `wilt` `catchUpPlots` `applyGuestFarmBuff` 契约冻结） |
| production | `enqueueJob` `collectJob` `feedAnimal` `unlockSlot` `tickProduction` `canCraft`（另 `buildingSlots` `freeSlots` `livestockYieldMultiplier` `MAX_SLOTS`） |
| village | `acceptWish` `deliverWish` `refreshWishes` `inviteGuest` `cook` `build` `petPlay` `stallSell` `tickVillage`（另 `guestCapacity` `wishCandidates` `happinessMult` 与 4 个常量） |
| core/engine | `createInitialState` `advanceTime`（另 §2.1 全部） |
| data | `CROPS` `RECIPES` `BUILDINGS` `ANIMALS`（另 `GUESTS` `WISH_POOL` `ITEM_NAMES` `BASE_PRICES` `stallPrice` `priceOf` `DISHES` `FURNITURE` 及各 `xxxById`） |

## 10. Round 1 → Round 2 差异台账

### 10.1 已落地（DONE，本版契约已同步收编）

| 项 | 落点 |
| --- | --- |
| 可玩闭环 + 增量 UI（骨架/签名比对/每帧通道/事件委托）+ 4 步教程 + fx 音效通道 | main.js / ui/screens.js |
| 心愿重写：maxLevel 过滤、tier 缩放、3 日过期、补位计时器骨架、工具 35% / 珍珠 4% 掉落、幸福加成封顶、`village/skip` 换单 | village |
| 确定性 RNG（rng.js 状态哈希）替代 Math.random（village 全域） | village/rng.js |
| 嘉宾容量 / 温馨定停留 / untilDay 离店 / 温馨日衰减 | village |
| cook：厨房建成 + 等级门槛 + 9 道菜谱 + 菜品加成表 + favorite 续住 + 确定性翻车 + 计数 | village + data/dishes |
| stallSell 逻辑全量（价格表 / qty 校验 / worthless / 茶婆婆 buff） | village + data/items |
| build：popNeed / 人口上限 / 社区 +4 | village |
| petPlay：宠物院 +2、猫狗差异、payload now 注入 | village |
| 农耕全量（季节 / 温室判定 / 枯萎宽限 / 扩建三重门 / harvestAll / catchUpPlots 纯函数） | farm |
| 工位 / 畜牧收取修复 / 余数累积 | production |
| 自动存档三通道 + hydrate 骨架 + 坏档兜底 | main.js / core/save |
| 12 套四季×昼夜皮肤；48 tests + probe / bench / chain-smoke 绿 | styles / tests / scripts |

### 10.2 Round 2 工单（TODO，编号被全文引用；依赖：D0→D1→D2→D3 见 §0.2，R2-20 在 R2-6 之后）

| # | 内容 | 所有者 |
| --- | --- | --- |
| R2-1 | `core/reasons.js` + 双读迁移四步（§0.2） | Opus-4 → GPT-sol-1 → Opus-1/2/3 → GPT-sol-1 |
| R2-2 | 离线接线：`OFFLINE_CAP_MS` 上收 engine、`applyOfflineCatchup`（§2.2）、`meta/offline` 启动派发；farm import 去重 | Opus-4 + Opus-1 |
| R2-3 | `data/levels.js`（§2.4）+ engine 薄再导出 | Fable-3 + Opus-4 |
| R2-4 | `core/buffs.buffFactor` + 三处本地实现收敛 + kitchen/weavery 工时 + cook 翻车率（§8） | Opus-4 + Opus-2 + Opus-3 + Opus-1 |
| R2-5 | 冬季饲料 +20%（`winterFeedCarry` 余数累积，§4.4） | Opus-2 |
| R2-6 | production 末位 `nowMs` 注入；`makeJobId` 去 `Math.random`（§4.2） | Opus-2 |
| R2-7 | `plant` 接 `crop.unlockLevel`（`farm.crop_locked`）+ 种子条置灰 | Opus-1 + Opus-4 |
| R2-8 | `wishCandidates` 接 `minLevel`（§5.0） | Opus-3 |
| R2-9 | `deliverWish` 停止立即补满（§5.1，联动 economy.test 断言） | Opus-3 + GPT-sol-1 |
| R2-10 | `till` 信封化（§3.3，联动 main.js 删预检） | Opus-1 + Opus-4 |
| R2-11 | 温室改地块制：`setGreenhouse`（§3.11）+ hydrate 旧档迁移（§2.3）+ 温室面板 | Opus-1 + Opus-4 |
| R2-12 | `placeFurniture` + `state.furniture` + `furnitureWarmth` 保底 + 蘑菇屋家什区（§5.9） | Opus-3 + Opus-4 |
| R2-13 | 摊位 UI：`village/stall` 接线 + `detailStall` 面板 + 假工位 bug（§5.8） | Opus-4 |
| R2-14 | `farm/harvest_all` 接线 + 工具条按钮 | Opus-4 |
| R2-15 | `meta/settings`（hourMs 白名单 3000/6000/12000）+ 设置入口 | Opus-4 |
| R2-16 | hydrate 增补表（§2.3）+ `SAVE_VERSION`/`MIGRATIONS` | Opus-4 |
| R2-17 | `tickPlots` 枯萎写日志 | Opus-1 |
| R2-18 | `meta/tick` 透传 `payload.now` | Opus-4 |
| R2-19 | 删除 main.js `collectLivestock` 死代码 | Opus-4 |
| R2-20 | 边界静态测试（禁 document/localStorage/内嵌 Date.now/Math.random；R2-6 后落地） | GPT-sol-1 |

P2（不阻塞 SOTA，滚入下一轮）：温馨 ≥60 烹饪暴击、≥100 第 4 心愿格（GDD 设计目标）；favorite 续住上限；货运码头 / 节日广场玩法；`prefers-reduced-motion`；环境音；扩建/工具掉落节奏复衡（Fable-3 经济表）。

### 10.3 已废条目（Round 1 草案 → 本版删除，防止实现者按旧文施工）

| 旧条目 | 处置 |
| --- | --- |
| rootReducer 三段式（route/applyResult/finalize）、失败写 log | 落地为 applyAction + toast 飘字，`ARCHITECTURE.md §3.3` |
| `absGameMinutes(meta)`、顶层 `wishNextAt`（游戏分钟） | 作废：心愿计时落地为 `village.nextWishAt`（纪元 ms） |
| `guests[].leaveDay` | 改名 `untilDay`（落盘前改名，不升存档版本） |
| deliverWish 掉落 3% 珍珠 / 10% 工具、末位 `rand` 参数 | 落地为 4% / 35%、payload `rng` + 状态哈希 |
| inviteGuest 的 level ≥ 4 门槛 | 作废：容量曲线（guestCapacity）控节奏 |
| cook favorite 续住上限 `sinceDay + 4` | 作废：食材成本自平衡 |
| “buff 应用点恰好 4 处” | 扩为 7 处（§8），新增 stall / weavery / cook 翻车率 |
| 音效决策读 `action.type` | 落地为 `ui.fx` 信号 |
| 初始工具 1/0/0、帧 dt 钳制 200ms | 落地为 2/1/1、500ms + 100ms 累积 |
| `src/data/prices.js`、`wishes.js` 追加 `WISH_REFRESH_MIN = 120` | 已由 `data/items.js` 与 village 的 `WISH_REFRESH_HOURS = 2` 取代 |
| 心愿选单公式 `(day * 7 + open.length) % pool` | 落地为 `(day + 板上已有数) % candidates` + 线性探测 + wishSeq 流水号 |
| `wiltOffSeason(state)` 批量枯萎 | 早已作废，宽限机制取代 |
