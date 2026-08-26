# API 契约（实施级 · Round 3 终稿）

> 与 `ARCHITECTURE.md` 配套。签名与行为以 **HEAD `12a0312` 的落地代码为基准**（Round 3 两波收官已对账：第一波 `337bc37` offline-smoke 口径、`cdbdf5e` 冬饲 import + enqueueJob 按 buildingId 吃 buff、`f95afa2` 离线生长封顶 + 枯萎日志 + `OFFLINE_CAP_MS` 去重、`ea9ffec` 掉落校准两级保底 + 节拍补位 + 家具收敛 core + cook 翻车率 buff、`c92b795`/`74bbc8b`/`8708517` 测试解封与改口径；第二波 `228af0c` 开局工具 1/0/0 + 等级表单源化 + 时速三档 + hydrate 地块补形、`1f64876` 温室 UI 入口 + 种子门置灰 + 投喂价按钮 + queries 注入 + 收获飘字/村景剪影、`411a27e` 撤温室补罩只留形状补齐；`9ada6e4` 纯 CSS 不涉契约）。
> **本版定性**：落地代码即契约。Round 2 工单已全部标 **DONE / DEAD**（§10.2；第二波把首波判 DEAD 的 R2-3/R2-7/R2-15 翻案为 DONE），不再有 TODO；被废方案集中 §10.3；剩余真实缺口冻结在 **§11 Final**——后续任何轮次从 §11 开工即可，无需考古。Round 3 落地点标 `【R3】`。

## 0. 约定与术语

### 0.1 函数三类（返回形状唯一化）

| 类别 | 返回 | 例 |
| --- | --- | --- |
| 命令（玩家动作） | 信封 `Envelope`（唯一例外 `till`，§3.2） | `plant` `enqueueJob` `deliverWish` `stallSell` `placeFurniture` |
| 查询（selector，只读无副作用） | 裸值，**永不**返回信封 | `canCraft` `canPlant` `seasonFactor` `feedCost` `guestCapacity` `wishSlots` `kitchenMenu` `furnitureWarmth` |
| 节拍（tick / 离线结算驱动） | 裸完整 nextState | `tickPlots` `tickProduction` `tickVillage` `catchUpPlots` `advanceTime`（含元组）`refreshWishes` |
| 编排（唯一一个） | 三元组 `{ state, offlineMs, capped }` | `applyOfflineCatchup`（§2.2，`core/offline.js`） |

### 0.2 信封 `Envelope` 与 reason 终裁

```js
// 成功
{ ok: true, state: State /* 完整 nextState */, ...extras }
// 失败（state 必须 === 传入引用）
{ ok: false, reason: string /* 中文文案，冻结 §7 */, state: State, ...extras }
```

| 字段 | 规则 |
| --- | --- |
| `reason` | **中文玩家文案本身就是冻结的机器契约**：全表见 §7，只加不改不删；UI 直接飘 `result.reason`；测试直接断言原文 |
| `extras` | 仅限可序列化原始值/小对象（`cook` 的 `dark/favorite/crit/qty`、`harvestAll` 的 `count`、`deliverWish` 的 `coins/gifts`、`stallSell/petPlay` 的 `coin`、`placeFurniture` 的 `warmth`）；禁止塞函数 |

**终裁（R2-1 DEAD）**：Round 2 拟议的「机器码 `域.代码` + `message` 双轨 + D0–D3 四步双读迁移」整体作废——零代码落地、7 处测试断言与全部系统文案已按中文原文冻结，改造收益不抵全库翻搅风险。两条**动态插值文案**以现状为准冻结（数值就在文案里，不再静态化进 extras）：`inviteGuest` 超员「屋里只坐得下 N 位，先添间客房」、`build` 缺人「人手不够，要 N 个人才张罗得起来」。今后新增失败路径：继续写中文文案并登记 §7。

### 0.3 参数演进与注入约定

| 规则 | 内容 |
| --- | --- |
| 追加参数 | 新参数只能追加到末位且带默认值（`nowMs = Date.now()`）；已有位置参数的顺序与含义永不变；payload 对象内加可选键允许 |
| 注入双轨（冻结） | farm/production 用**末位参数**注入时间；village 用**payload 字段**注入（`deliverWish/cook` 的 `rng`、`petPlay` 的 `now`）。新函数默认走末位参数 |
| rng 语义 | `rollWith(rng, ...parts)`：注入了 `rng` 用注入值（钳 [0, 0.999999]）；未注入时由 parts 派生 FNV 哈希，同一存档同一参数结果恒定 |
| payload 兜底 | 命令函数解构 payload 一律带 `= {}`（三系统均已齐） |

## 1. State Schema v1（唯一定义处，= `createInitialState()` + 懒建字段）

| 路径 | 类型 | 初值 | 时基 | 写者 |
| --- | --- | --- | --- | --- |
| `meta.name` | string | `"新村长"` | — | 预留 |
| `meta.level` | int 1–10 | 1 | — | 仅 `meta/tick` 第 5 步（派生自 xp） |
| `meta.xp` | int ≥0 | 0 | — | farm/production/village |
| `meta.hourMs` | `3000 \| 6000 \| 12000`（白名单 `HOUR_MS_CHOICES`） | 6000 | — | `meta/settings`（顶栏时速按钮循环切档，R2-15 翻案 DONE【R3 `228af0c`/`1f64876`】）；hydrate 过 `normalizeHourMs`，读取端 `\|\| 6000` 双保险 |
| `meta.gameMinutes` | float [0,1440) | 480 | A | advanceTime |
| `meta.day` | int ≥1 | 1 | A | advanceTime |
| `meta.season` | `"spring"\|"summer"\|"autumn"\|"winter"` | `"spring"` | A | advanceTime |
| `meta.muted` | boolean | false | — | `meta/mute` |
| `meta.tutorialStep` | int 0–4 | 0 | — | main.js（advanceTutorial / `meta/tutorial`） |
| `resources.coin` | int ≥0 | 80 | — | 全体 |
| `resources.pearl` | int ≥0 | 0 | — | village |
| `resources.happiness / warmth` | int ≥0 | 40 / 20 | — | village（`normalizeMood` 取整钳非负；warmth 另有家具保底盘 §5.9） |
| `resources.pop / popCap` | int | 2 / 4 | — | village(build) |
| `resources.shovel / axe / saw` | int ≥0 | **1 / 0 / 0** ✅【R3 `228af0c`】（保底掉落 = 唯一工具来源，旧 2/1/1 白送口径销账） | — | farm(扣) / village(掉落、建造扣) |
| `inv` | `Record<itemId, int ≥1>`（0 即删键） | `{ chili: 2 }` | — | addInv 系 |
| `plots[]` | `{ id, status, cropId, plantedAt, doneAt, wiltAt, greenhouse }` | 2 块（p1 empty、p2 untilled），全键齐【R3 `228af0c`】 | B | farm |
| `plots[].status` | `untilled\|empty\|growing\|ready\|wilted` | — | — | farm |
| `plots[].wiltAt` | epoch ms；0 = 无枯萎倒计时 | 0（旧档缺键由 hydrate `hydratePlots` 补 0【R3】，§2.3） | B | farm |
| `plots[].greenhouse` | boolean；温室地块判定 = `greenhouse === true` 或 id 形如 `g1/g2…`（§3.0） | false（旧档缺键由 hydrate 补 false【R3】） | — | farm(expandGreenhousePlot) |
| `buildings` | `Record<id, { built: true, slots: [], slotCount?: int }>`（未建 = 无键） | mushroom、wish | — | village(build) / production(unlockSlot) |
| `jobs[]` | `{ id, buildingId, recipeId, kind: "craft"\|"livestock", status: "running"\|"done", doneAt, slot, productId, qty, xp }` | `[]` | B | production |
| `production.livestockCarry` | `Record<productId, float ≥0>` 分桶（喂鸡的零头不补牛奶）；旧档为单个 number，读作下一次投喂的起始零头 | **懒建** | — | production |
| `production.winterFeedCarry` | float ≥0（冬饲 0.2/次 记账桶） | **懒建** | — | production |
| `village` | `{ wishSeq, nextWishAt, cooked, darkDishes, lastDay, pityStep, drought }` → 见下行明细 | **懒建**（villageMeta 逐键缺省） | B（nextWishAt） | village |
| `village.wishSeq / cooked / darkDishes / lastDay` | int | 0 / 0 / 0 / meta.day | — | village |
| `village.nextWishAt` | epoch ms；**0 = 停表**（板满时归零，空位从空出那刻起算）【R3】 | 0 | B | village |
| `village.pityStep`【R3 新增】 | int 0–3：开局保底序列（斧→锯→锹）走到第几步 | 0 | — | village(deliverWish) |
| `village.drought`【R3 新增】 | int ≥0：连续多少单没掉工具（≥6 触发必掉） | 0 | — | village(deliverWish) |
| `wishes[]` | `{ ...池条目, wishId, needs(缩放后), coin, xp, tier, status: "open"\|"accepted", createdDay }` | `[]`（首 tick 补满） | A（createdDay） | village |
| `guests[]` | `{ id, sinceDay, untilDay }` | `[]` | A | village |
| `pets[]` | `{ id, name, kind: "dog"\|"cat", readyAt }` | 小花/小团 | B | village |
| `furniture[]` | **`string[]`（家具 id）**——唯一写入方 `core/furniture.placeFurniture`；village 旧的 `{id,…}` 对象写入端与双形状兼容读**均已删除**【R3 `ea9ffec`】 | `[]`（懒建） | — | core/furniture(placeFurniture) |
| `log[]` | string，≤40 条，新的在前 | 1 条开场白 | — | 全体经 pushLog |
| `ui` | `{ seed, selected, toast, fx, rerolls, sellId, sellQty, serveTo }`；toast/fx 落盘置 null；`fx = { kind, n, text?, at?, tone? }`（n 递增去重；text/at 驱动收获飘字【R3】，`ARCHITECTURE.md §8.2`）；`sellId`(string\|null)/`sellQty`(int ≥1) = 摊位选中货与件数、`serveTo`(guestId\|null) = 厨房点名端菜对象 | `createInitialUi()` | — | main.js/UI 动作（`meta/sell` `meta/serve` §6） |

兼容注记：`itemId` 全集 = `data/wishes.js` 的 `ITEM_NAMES` 键集，新物品先登记该表再登记 `data/items.js` 的 `BASE_PRICES`；家具 id 不进 `inv`，只进 `state.furniture`。

## 2. core 契约（`src/core/**`，Opus-4）

### 2.1 导出面（签名冻结）

| 模块 | 签名 | 说明 |
| --- | --- | --- |
| store.js | `createStore(initial, reducer)` | `ARCHITECTURE.md §3.1`；构造时 structuredClone |
| store.js | `merge(state, patch): State` | 顶层浅合并，仅模块内部用 |
| store.js | `addInv(state, id, qty): State` | qty 可负；≤0 删键 |
| store.js | `hasInv(state, needs): boolean` | `needs: Record<itemId, int>` |
| store.js | `spendInv(state, needs): Envelope` | 失败「材料不够」；原子性：不足时不动任何键。非正数 qty 校验缺失（唯一测试 skip 跟踪，§11-5） |
| engine.js | `createInitialState(): State`、`createInitialUi()` | §1 初值列 |
| engine.js | `advanceTime(state, dtMs): { state, crossedDay, crossedSeason }` | 只动 meta 三字段 |
| engine.js | `LEVELS`、`levelFor(xp)`、`levelProgress(xp)`、`TUTORIAL_TOTAL = 4` | **单源化**【R3 `228af0c`，R2-3 翻案 DONE】：`LEVELS = data/levels.XP_TABLE`、`levelFor = levelForXp` 薄再导出；`levelProgress` 基于同表计算。导出面不变，消费方零改动（§2.4） |
| engine.js | 常量 `HOUR_MS_DEFAULT / HOUR_MS_CHOICES / DAY_HOURS / DAYS_PER_SEASON / OFFLINE_CAP_MS` | 6000 / `[3000, 6000, 12000]`【R3】 / 24 / 7 / 28_800_000；`OFFLINE_CAP_MS` 唯一事实源（farm 再导出【R3】） |
| engine.js | `normalizeHourMs(value): number`、`nextHourMs(value): number`【R3 `228af0c`】 | 白名单校验（非法值回 6000）与循环切档（3000 → 6000 → 12000 → 3000）；消费方 = save.hydrate 与 main `cycleSpeed` |
| engine.js | `absGameMinutes(meta)` | **冻结的无害死代码**：全库零调用方；删除工单（R2-19）DEAD，禁止新增调用 |
| offline.js | `offlineSpan(savedAt, nowMs = Date.now()): { elapsed, offlineMs, capped }`、`humanGap(ms): string`、`applyOfflineCatchup`（§2.2） | `humanGap` 输出「N 分钟 / N 小时 N 分钟」中文时长 |
| furniture.js | `placedFurniture(state): string[]`、`isPlaced(state, furnitureId): boolean`、`furnitureWarmth(state): number`、`applyFurnitureWarmth(state): State`、`placeFurniture(state, { furnitureId }): Envelope`（§5.9） | 家具**唯一**实现；`applyFurnitureWarmth` 在 main.js `finalize` 里每 tick/offline 收尾兜温馨下限；village 读取端为其再导出【R3】 |
| save.js | `SAVE_KEY`、`serialize(state)`、`deserialize(raw)`、`hydrate(saved, base?)`、`writeSave(state)`、`readSave()`、`clearSave()` | `deserialize` 返回 `{savedAt, state} \| null`，内部已过 hydrate；只认 `v === 1`（版本管线作废，§2.3）。hydrate 内含 `hydratePlots` 补键与 `normalizeHourMs` 白名单【R3】 |
| events.js | `createBus()` | 冻结不用，禁新增依赖 |
| index.js | 桶导出 `events / store / save / engine / offline / furniture` | |

### 2.2 `applyOfflineCatchup`（`core/offline.js`，冻结）

```js
export function applyOfflineCatchup(state, savedAt, nowMs = Date.now(), systems = {})
  : { state, offlineMs, capped }
```

`systems = { catchUpPlots?, tickProduction?, tickVillage? }` 由组合根注入——core 不反向依赖 systems，缺哪个函数就跳过哪一步。编排 = `ARCHITECTURE.md §4.4` 六步；`offlineMs <= 0`（含 savedAt 非有限数）→ `{ state 原引用, offlineMs: 0, capped: false }`；成功时自带一条离线 log（capped 注明「超过 8 小时的部分不另算」）。

**拟议 core 新模块的终裁**：`core/buffs.js`（R2-4 收敛项）与 `core/reasons.js`（R2-1）**均 DEAD 不建**；`save.js` 的 `SAVE_VERSION`/`MIGRATIONS`（R2-16）**DEAD 不建**——v1 冻结纪律见 §2.3。

### 2.3 hydrate 与读取端防御（现状即契约；逐条目归一表作废）

`hydrate(saved, base = createInitialState())` 做**顶层形状合并**：meta/resources/buildings 深一层展开，`inv` 整体替换，数组类（plots/jobs/wishes/guests/pets/log）原样替换缺则用 base，`ui` 与 `createInitialUi()` 合并且 toast/fx 置 null。另有**仅有的两处写侧形状补齐**【R3 `228af0c`/`411a27e`】：① `hydratePlots` 给缺 `wiltAt`/`greenhouse` 键的地块补 `0`/`false`（纯补键，不改语义）；② `meta.hourMs` 过 `normalizeHourMs`（非白名单值回 6000）。其余缺失字段由读取端兜住（对照表 = `ARCHITECTURE.md §5.2`）：`guestUntil` 回退 `sinceDay + 2`、`collectJob` 三级回退链、`productionState`/`villageMeta`/`placedFurniture` 懒建（含 `pityStep/drought` 缺省 0【R3】）、farm 对 `wiltAt/greenhouse` 的 falsy 语义双保险。

温室旧档免费补罩迁移（Round 2 拟议）**DEAD 且已实操撤销**（`411a27e`）：v1 存档无 schema 版本号，「盖了温室建筑却没罩地的旧档」与「刚花钱盖完温室的新档」不可区分，补罩等于白送三块地——hydrate 只许补键、不许补语义，此为判例。v1 冻结期字段**只增不改不删**；新增字段必须自带 undefined 语义化缺省并登记 §1。

### 2.4 `src/data/levels.js`（冻结）

```js
export const XP_TABLE = [0, 40, 100, 180, 280, 420, 600, 820, 1100, 1450]; // 下标 i = Lv.(i+1) 门槛
export function levelForXp(xp): number;    // 1..10；线性扫表，xp < 0 落在 Lv.1
export function xpForNext(level): number;  // = XP_TABLE[level] ?? Infinity（满级 Infinity）
```

**终裁（R2-3 翻案 DONE【R3 `228af0c`】）**：本模块是**唯一事实源**——engine 的 `LEVELS`/`levelFor` 已迁为薄再导出（`LEVELS = XP_TABLE`、`levelFor = levelForXp`），`levelProgress` 留在 engine 但基于同一张表计算。运行时消费方（main.js / screens.js）继续走 `core/engine.js`，导出面零变化。**维护规则**：改等级数值只改本文件 + 跑 `npm test`（economy 套件断言 XP 门槛）；`xpForNext` 当前无运行时消费方，契约冻结保留。

## 3. Farm 契约（`src/systems/farm/index.js`，Opus-1）

### 3.0 导出常量与查询 ✅

| 导出 | 值 / 签名 | 说明 |
| --- | --- | --- |
| `OFF_SEASON_FACTOR` | 0.55 | 错季倍速 |
| `WILT_GRACE_MS` | 45_000 | 枯萎宽限（真实 ms） |
| `OFFLINE_CAP_MS` | 28_800_000 | 【R3 `f95afa2`】`core/engine.js` 的再导出（`export { OFFLINE_CAP_MS }`），导出面不变、事实源唯一 |
| `GREENHOUSE_PLOT_CAP / GREENHOUSE_COIN / GREENHOUSE_SAW` | 3 / 80 / 1 | 温室地块上限与单块改造费 |
| `isGreenhousePlot(plot): boolean` | `plot.greenhouse === true` 或 id 匹配 `/^g\d+$/` | 温室建筑本身不让全村免疫 |
| `greenhousePlotCount(state): number` | 已罩进温室的地块数 | 卡 CAP 用 |
| `canPlant(state, cropId): boolean` | `crop.unlockLevel` 非有限数 → true；否则 `meta.level >= unlockLevel` | 系统门槛在 `plant` 内生效 ✅；**UI 置灰已接线**（R2-7 翻案 DONE【R3 `1f64876`】）：种子条经组合根注入的 `queries.canPlant` 置灰（disabled + `Lv.N` 价签），键盘 1–6 同口径拦截并飘「××要小镇 Lv.N。」 |
| `applyGuestFarmBuff(state, growMs = 1): number` | farm buff 连乘、钳 [0.5, 2] 后乘到 growMs | 本地实现冻结（core/buffs 作废，`ARCHITECTURE.md §7`） |

内部常量：`MIN_GROW_MS = 1_000`、`EXPAND_COIN = 40`、`EXPAND_SHOVEL = 1`。

### 3.1 `seasonFactor(crop, season, greenhouse = false): number` — 查询 ✅

greenhouse 为 true 或 crop 缺失 → 1；当季 → 1；错季 → 0.55。

### 3.2 `till(state, { plotId } = {}): State` — 命令（**冻结的唯一信封例外**，R2-10 DEAD）

返回裸 state：plot 存在且 `status ∈ {untilled, wilted}` → 该 plot 复位为 `{ status: "empty", cropId: null, plantedAt: 0, doneAt: 0, wiltAt: 0 }`；否则返回原 state 引用（静默）。**用户可见的失败语义在 main.js 预检**（契约的一部分）：`farm/till` 分支先查 plot——非 tillable 飘「这块地不用再翻了」，成功走 `applyResult(state, { ok: true, state: till(state, payload) }, "till")` + `advanceTutorial(…, 1)`。

### 3.3 `plant(state, { plotId, cropId } = {}, now = Date.now()): Envelope` ✅（含作物等级门）

| 前置（按序短路） | 失败文案 |
| --- | --- |
| `cropById(cropId)` 存在 | 没有这种作物 |
| `canPlant(state, cropId)` | 小镇等级不够 |
| plot 存在 | 没有这块地 |
| `status === "empty"` | 这块地还不能种 |
| `coin >= crop.seedCost` | 金币不够买种子 |

成功效果（快照式，唯一公式）：

```
factor = seasonFactor(crop, meta.season, isGreenhousePlot(plot))
grow   = max(MIN_GROW_MS, round(applyGuestFarmBuff(state, crop.growMs / factor)))
coin  -= crop.seedCost
plot   = { status: "growing", cropId, plantedAt: now, doneAt: now + grow,
           wiltAt: factor === 1 ? 0 : doneAt + WILT_GRACE_MS }
```

`seasonFactor` 在分母（错季 0.55 → 时长 ×1.82）；farm buff 在分子。播种后换季/嘉宾离店不回溯 `doneAt`。

### 3.4 `harvest(state, { plotId } = {}, now = Date.now()): Envelope` ✅

失败文案：「还没熟」（非 ready 且未到 doneAt）/「地里空着」（crop 不存在）。成功：`inv[yieldId] += yieldQty`；`xp += crop.xp`；plot 复位；log 一条。

### 3.5 `harvestAll(state, now = Date.now()): Envelope` ✅

逐块尝试 `harvest`。全失败 → `{ ok: false, reason: "还没有能收的地", state, count: 0 }`；否则 `{ ok: true, state, count }`。接线：`farm/harvest_all` action + 工具条「全部收获（N）」+ H 键 + 成功推进教程步 3。

### 3.6 `wilt(state, { plotId } = {}): Envelope` ✅ — 强制枯萎，调试/剧情用

失败文案：「没有这块地」/「这块地没种东西」（status ∉ {growing, ready}）。成功转 wilted + log。

### 3.7 `tickPlots(state, dtMs, now = Date.now()): State` — 节拍 ✅【R3 补日志】

| 规则 | 行为 |
| --- | --- |
| 熟化 | `growing && now >= doneAt` → `ready`（先于枯萎判定） |
| 当季（factor === 1，含温室地块） | 清 `wiltAt = 0` |
| 错季 | 无倒计时则起算 `wiltAt = max(doneAt, now) + WILT_GRACE_MS`；`now >= wiltAt` → 枯萎并 **pushLog「××没扛住这个季节，蔫了。」**【R3 `f95afa2`】 |
| 无变化 | 返回原 state 引用（短路订阅通知） |

### 3.8 `expandPlot(state): Envelope` ✅

| 前置（按序） | 失败文案 | 公式 |
| --- | --- | --- |
| `plots.length < pop × 2` | 人手不够，先盖房子添人 | 一人照看两块地 |
| `plots.length < 1 + meta.level` | 小镇等级不够，再攒些经验 | 等级放开上限 |
| `coin >= 40 && shovel >= 1` | 扩建要 40 金币和 1 把锹 | |

成功：扣 40 金 + 1 锹；追加 `{ id: "p" + (历史最大编号 + 1), status: "untilled", ... }`。

### 3.9 `expandGreenhousePlot(state, { plotId } = {}): Envelope` ✅（温室地块制，**UI 全链已接**【R3 `1f64876`】）

`plotId` 缺省 → 自动挑第一块未罩进温室的地。

| 前置（按序） | 失败文案 |
| --- | --- |
| `buildings.greenhouse?.built` | 先把温室盖起来 |
| 目标地块存在（缺省时还有未覆盖地块） | 指定：没有这块地；缺省无地可罩：所有地都在温室里了 |
| 目标未在温室里 | 这块地已经在温室里了 |
| `greenhousePlotCount < GREENHOUSE_PLOT_CAP`(3) | 温室罩不下更多地了 |
| `coin >= 80 && saw >= 1` | 改温室要 80 金币和 1 把锯 |

成功：扣 80 金 + 1 锯；`plot.greenhouse = true` 且 `wiltAt = 0`（罩上玻璃当场免枯萎）；log 一条。不可撤销。**接线终态**【R3 `1f64876`，原 §11-1 销账】：action `farm/cover` `{ plotId? }` 走 `applyResult`（§6）；温室详情面板（`detailGreenhouse`）逐地块列「罩进温室」按钮——已罩/满 3 块/钱料不够时置灰并写明缘由，口径全部读组合根注入的 queries（`isGreenhousePlot`/`greenhousePlotCount`/`greenhouseCap/Coin/Saw`），缺项退契约默认值。

### 3.10 `catchUpPlots(state, savedAt, now = Date.now()): State` — 节拍 ✅【R3 `f95afa2` 生长封顶落地】

```
from = Number.isFinite(savedAt) ? savedAt : now
away = clamp(now - from, 0, OFFLINE_CAP_MS)
away === 0 → tickPlots(state, 0, now)
否则：
  effectiveNow = from + away                       // 封顶时刻
  overflow     = max(0, now - effectiveNow)        // 超出封顶窗口的真实时长
  对每块地：
    ① status === "growing" 且 doneAt > effectiveNow（封顶窗口内熟不了的）：
       plantedAt 非 0 时 += overflow；doneAt += overflow；wiltAt 非 0 时 += overflow
    ② wiltAt > from 的：wiltAt = max(wiltAt, now + WILT_GRACE_MS)   // 人不在家不判枯
  然后 tickPlots(state', away, now)
```

语义：离线最多白得 8 小时生长进度，剩余时长逐 ms 保留、回来接着长；jobs/pets/心愿计时**不**封顶（一次性且有界，`ARCHITECTURE.md §4.4`）。验收：`scripts/offline-smoke.mjs` `ok:true`（`withinCapSettled` / `beyondCapDeferred` / `beyondCapRemainingPreserved` 三断言）+ `tests/time.test.js` 封顶用例已解封转绿【R3 `74bbc8b`】。

## 4. Production 契约（`src/systems/production/index.js`，Opus-2）

### 4.0 导出常量与查询 ✅

| 导出 | 值 / 签名 | 说明 |
| --- | --- | --- |
| `MAX_SLOTS` | 6 | 单建筑生产位上限 |
| `WINTER_FEED_SURCHARGE` | 0.2 | 【R3 `cdbdf5e`】改为 `data/animals.js` 的 import 再导出，事实源唯一 |
| `canCraft(state, recipeId): boolean` | recipe 存在 && level ≥ unlockLevel && 已建 && hasInv | |
| `buildingSlots(state, buildingId): number` | `slotCount ?? def.slots`，钳 [0, 6]；都缺 → 0 | 无 slots 定义的建筑不能生产 |
| `freeSlots(state, buildingId): number` | `buildingSlots − 占位 job 数`，最低 0 | |
| `livestockYieldMultiplier(state): number` | = 内部 `guestBuffFactor(state, "livestock")`（连乘、钳 [0.5, 2]） | 本地实现冻结（core/buffs 作废） |
| `feedCost(state, buildingId): number` | 下一次投喂要扣几份饲料（冬天攒满零头那次是 2）；非畜牧建筑 → 0 | **UI 已消费**【R3 `1f64876`，原缺陷 UI-2/§11-2 销账】：投喂按钮经 `queries.feedCost` 写真实份数——「投喂（饲料×N）/ 差 饲料×M / 圈里满了」，`have < need` 即置灰 |
| `winterFeedCarry(state): number` | 冬饲记账桶余额 | |
| `livestockCarry(state, productId): number` | 该畜产品的产量零头（分桶；旧档 number 视为公共零头） | |

内部：`CARRY_EPSILON = 1e-9`；job 占位规则：`status !== "collected"` 即占位，收取即移除释放；`makeJobId(state, prefix, nowMs)` 确定性（`${prefix}_${nowMs.toString(36)}_${n}` 线性探测防撞）。

### 4.1 `enqueueJob(state, { buildingId, recipeId } = {}, nowMs = Date.now()): Envelope` ✅

| 前置（按序） | 失败文案 |
| --- | --- |
| recipe 存在且 `recipe.buildingId === buildingId` | 配方不对 |
| `buildings[buildingId]?.built` | 还没建这座作坊 |
| `meta.level >= recipe.unlockLevel` | 小镇等级不够 |
| 有空槽（`pickSlot` 取最小空闲槽号） | 生产位满了 |
| `spendInv(inputs)` 成功 | 原料不够 |

成功入队（工时 buff **按 buildingId 通吃** ✅【R3 `cdbdf5e`】——buff target 与 buildingId 同名，一行同时管住灶台叔叔 kitchen 0.8 与苇姐 weavery 0.85；无人对口 = 1）：

```
timeMs = max(1, round(recipe.timeMs × guestBuffFactor(state, buildingId)))
job = { id: makeJobId(state, "job", nowMs), buildingId, recipeId, kind: "craft",
        status: "running", doneAt: nowMs + timeMs, slot,
        productId: recipe.outputId, qty: recipe.outputQty, xp: recipe.xp || 0 }
```

### 4.2 `collectJob(state, { buildingId, slot } = {}): Envelope` ✅

`slot` 匹配序：字符串 → 按 `job.id`（规范用法）；整数 → 先按 `job.slot` 再按数组下标；缺省 → 该建筑第一单 done。畜牧单正常收取。main.js 的 `collectLivestock` 兜底为**冻结的不可达死代码**（R2-19 DEAD：collectJob 已认畜牧单，try/catch 分支不会触发；无害保留，禁止扩展）。

| 前置 | 失败文案 |
| --- | --- |
| job 找到 | 没有这单活 |
| `status === "done"` | 还在忙 |
| productId 可解析（回退链 `job.productId → recipe.outputId → animal.productId`）且 qty ≥ 1 | 这单活坏了 |

成功：`inv[productId] += qty`；xp 取 `collectXp` 回退链（job 快照 → recipe.xp → 畜牧 animal.xp）；按数组位置移除该 job。

### 4.3 `feedAnimal(state, { buildingId, slot } = {}, nowMs = Date.now()): Envelope` ✅

| 前置（按序） | 失败文案 |
| --- | --- |
| `animalByBuilding(buildingId)` 存在 | 这里不养牲口 |
| `buildings[buildingId]?.built` | 还没建 |
| 有空圈（`pickSlot`，可传 `slot` 指定偏好圈位） | 圈里满了 |
| 库存饲料 ≥ `need` | 饲料不够 |

饲料量（`drawFeedCost`；扣料失败时两个记账桶都不动）：

```
accrued = winterFeedCarry + (meta.season === "winter" ? 0.2 : 0)
need    = 1 + floor(accrued + ε)
成功后:  winterFeedCarry = accrued - floor(accrued + ε)
```

产量（`drawYield`，按 productId 分桶，长期期望精确等于倍率）：

```
total = livestockCarry[animal.productId] + 1 × livestockYieldMultiplier(state)
qty   = max(1, floor(total + ε))
成功后: livestockCarry[animal.productId] = max(0, total - qty)   // ≤ε 时删键
```

成功入队：`{ id: makeJobId(…, "live", nowMs), buildingId, recipeId: animal.id, kind: "livestock", status: "running", doneAt: nowMs + animal.cycleMs, slot: 圈位, productId, qty, xp: animal.xp }`，写回两个记账桶。

### 4.4 `unlockSlot(state, { buildingId } = {}): Envelope` ✅

失败文案按序：「还没建」/「这里没有工位」（def 无 slots）/「已经满了」（≥6）/「金币不够」。费用 `40 + 当前位 × 20`；成功 `slotCount = 当前位 + 1`。费用序列（从 2 位起）：80、100、120、140 → 累计 440 金到 6 位。

### 4.5 `tickProduction(state, dtMs, now = Date.now()): State` — 节拍 ✅

过滤假值与 `status === "collected"` 残单；`running && now >= doneAt` → `done`。

## 5. Village 契约（`src/systems/village/index.js` + `rng.js`，Opus-3）

导出常量 ✅：`WISH_SLOTS = 3`、`WISH_REFRESH_HOURS = WISH_REFRESH_MIN / 60`（= 2，事实源 `data/wishes.js`【R3 `ea9ffec`】）、`WISH_EXPIRE_DAYS = 3`、`PET_COOLDOWN_MS = 20_000`。
模块内常量 ✅：`BASE_DARK_CHANCE = 0.08`、`FAVORITE_WARMTH = 8`、`GUEST_BASE_STAY_DAYS = 2`、`GUEST_MAX_STAY_DAYS = 4`、`GUEST_STAY_PER_WARMTH = 20`、`CAP_POP_PER_BUILDING = 4`、`COOK_CRIT_WARMTH = 60`、`COOK_CRIT_CHANCE = 0.1`、`WISH_BONUS_SLOT_WARMTH = 100`、幸福加成（步长 10、每步 +4%、封顶 +100%）。掉落相关常量（掉率/权重/保底）**已全部改读 `data/wishes.js`**【R3】，本地副本删除。

村落元数据 `state.village`（懒建，villageMeta 逐键缺省）：`wishSeq`、`nextWishAt`（0 = 停表）、`cooked` / `darkDishes`（兼作确定性 rng 种子）、`lastDay`（日结哨兵）、`pityStep` / `drought`（工具保底计数【R3】）。

### 5.0 查询函数 ✅

| 签名 | 返回 |
| --- | --- |
| `happinessMult(state): number` | `1 + min(1, floor(happiness / 10) × 0.04)` |
| `guestCapacity(state): number` | `1 + (level >= 4 ? 1 : 0) + (guestroom 已建 ? 2 : 0)`（最大 4）；Lv1 即有 1 位 |
| `guestBuffFactor(state, target): number` | 在座嘉宾同 target 连乘、钳 [0.5, 2]；本地实现冻结（core/buffs 作废） |
| `wishCandidates(state): WishDef[]` | `minLevel ≤ level ≤ maxLevel` 过滤；滤空两级兜底：先只按 minLevel，再全池 |
| `wishSlots(state): number` | `3 + (warmth >= 100 ? 1 : 0)`——温馨 ≥100 常驻第 4 心愿格 |
| `kitchenRecipe(recipeId): Recipe \| null` | 接受配方 id / 菜品 id / 产物 id 三种写法，只认 kitchen 出品 |
| `kitchenMenu(state): 菜单行[]` | 全部厨房菜谱 + 呈现层数据（name/inputs/warmth/happiness/desc/unlocked/unlockLevel） |
| `placedFurniture` / `furnitureWarmth` / `hasFurniture` | 【R3 `ea9ffec`】= `core/furniture.js` 的再导出（`hasFurniture` 是 `isPlaced` 别名）；village 本地实现与双形状兼容已删（R2-21 DONE） |

### 5.1 心愿生成与补位 ✅【R3 节拍收官】

`refreshWishes(state, nowMs = Date.now()): State` — 节拍：把板补满到 `wishSlots(state)`（3 或 4）单（清除 status "done" 残单），并重置 `nextWishAt = nowMs + wishIntervalMs(state)`。

| 机制 | 公式 / 规则 |
| --- | --- |
| 选单（确定性，禁随机） | `candidates = wishCandidates(state)`；空位起始下标 `start = wrap(meta.day + 板上已有数, len)`，板上已有同 id 则向后线性探测；`wishId = `${base.id}_d${day}_${seq}``，seq = `village.wishSeq` 递增 |
| tier 缩放 | `tier = min(3, 1 + max(0, floor((level - 4) / 3)))`（Lv1–6 = 1，Lv7–9 = 2，Lv10 = 3）；`needs ×tier`；`coin = round(base.coin × tier × (tier > 1 ? 1.1 : 1))`；`xp = round(base.xp × tier)` |
| 补位间隔 | `wishIntervalMs = max(1000, round(WISH_REFRESH_HOURS × meta.hourMs × guestBuffFactor(state, "wish")))`——2 游戏时（默认档 6000 时 12s 真实，灯哥 0.85 → 10.2s）；间隔在排定瞬间按当时 `meta.hourMs` 快照进 `nextWishAt`，切时速档不回溯（`ARCHITECTURE.md §4.1`）；事实源 `data/wishes.js` 的 `WISH_REFRESH_MIN = 120`【R3】 |
| 补位节拍（`refillWishSlot`，tickVillage 调用）【R3 停表语义】 | open ≥ wishSlots → **`nextWishAt = 0` 停表**（不停的话满板期间计时一路过期，交完单下一帧就立刻补位 = 变相恢复「交付即补满」）；板空 → 立即补满；`nextWishAt` 未设 → 设定后等待；`nowMs >= nextWishAt` → 补 1 单 |
| 过期 | `rolloverDays`：`day - createdDay >= 3` 的 open 单撤下 + log |

**交付不再立即补满**（R2-9 DONE【R3 `ea9ffec`】）：`deliverWish` 成功后板上留空格，交给补位节拍——灯哥 buff 与 2 游戏时节奏在主路径生效。配套断言已改（`8708517`：送达唯一一单后 `wishes` 长度 0）。已知漏洞：`village/skip` 的 `refreshWishes` 会顺带补满**所有**空位（§6 注记 + §11-3）。

### 5.2 `acceptWish(state, { wishId } = {}): Envelope` ✅（实装未接线，冻结）

失败文案：「心愿不见了」/「这单已经接下了」（已是 accepted）。成功：该单 `status: "accepted"`，extras 带 `wish`。无 UI 入口（心愿默认全可交付），导出冻结供测试；不接 action。

### 5.3 `deliverWish(state, { wishId, rng } = {}): Envelope` ✅【R3 掉落校准 + 两级保底落地，双口径期终结】

匹配：`w.wishId === wishId || w.id === wishId`。

| 前置 | 失败文案 |
| --- | --- |
| 心愿存在 | 心愿不见了 |
| 状态非 done | 这单已经交过了 |
| `hasInv(needs)` | 东西还没收齐 |

成功（唯一公式；掉落常量事实源 = `data/wishes.js`，0.35 旧口径作废）：

```
coins = max(1, round(wish.coin × happinessMult(state)))
扣 needs；coin += coins；happiness += 1；xp += wish.xp；移除该单（不补位）；log 一条
工具掉落 drawTool（两级保底，rollWith 确定性）：
  ① pityStep < 3            → 必掉 TOOL_PITY_ORDER[pityStep]（斧 → 锯 → 锹，解锁 L2 磨坊/L3 饲料厂/L3 鸡舍），pityStep+1，drought 清零
  ② drought >= 6            → 必掉（按 TOOL_DROP_WEIGHTS 权重：锹 0.4 / 锯 0.35 / 斧 0.25），drought 清零
  ③ roll("wish-gift") < WISH_TOOL_DROP(0.25) → 按权重掉一件，drought 清零
  ④ 否则不掉，drought += 1
珍珠：roll("wish-pearl") < WISH_PEARL_DROP(0.04) → pearl += 1
pityStep/drought 写回 state.village
extras: { coins, gifts: string[] }
```

有效工具掉率 ≈ 0.29；通关 70–90 单期望 23–29 件，对上全程工具汇 ≈ 28 件（量算见 `data/wishes.js` 注释与 GDD「工具经济」）。开局工具已收敛 **1/0/0** ✅【R3 `228af0c`，原 §11-4 销账】——保底序列（斧→锯→锹）就是斧/锯的唯一首件来源，「保底 + 白送」双份富余期终结。锹/斧/锯**只**产自开局 1 锹与心愿掉落——概率/权重/保底改动属经济表变更须过 Fable-3。

### 5.4 `inviteGuest(state, { guestId } = {}): Envelope` ✅

| 前置（按序） | 失败文案 |
| --- | --- |
| guest 存在 | 村里没这个人 |
| 未在座 | 已经在屋里坐着 |
| 在座数 < `guestCapacity(state)` | 屋里只坐得下 N 位，先添间客房（动态插值，冻结） |

成功：`guests += { id, sinceDay: day, untilDay: day + stayDays }`，`stayDays = 2 + floor(warmth / 20)`（邀请瞬间快照）；`warmth += 4`；log 一条。离店：`rolloverDays` 日结时 `untilDay < day` 即收拾行李 + log。无邀请等级门槛（容量曲线控节奏）。

### 5.5 `cook(state, { recipeId, dishId, guestId, rng } = {}): Envelope` ✅【R3 翻车率 buff 落地】

配方解析走 `kitchenRecipe(recipeId || dishId)`（接受配方/菜品/产物 id）。

| 前置（按序） | 失败文案 |
| --- | --- |
| `kitchenRecipe` 命中 | 厨房不会做这个 |
| `buildings.kitchen?.built` | 厨房还没盖起来 |
| `meta.level >= recipe.unlockLevel` | 小镇等级不够 |
| `spendInv(inputs)` 成功 | 食材不够，别让客人饿着 |

判定（确定性种子 = [recipe.id, guestId, day, floor(gameMinutes), village.cooked]）：

```
dark = rollWith(rng, "cook", ...seed) < BASE_DARK_CHANCE × guestBuffFactor(state, "kitchen")
       // 灶台叔叔在场 8% → 6.4% ✅【R3 ea9ffec】；kitchen buff 的另一半（工单时长 ×0.8）在 enqueueJob，两处互不重叠
crit = !dark && warmth >= 60 && rollWith(rng, "cook-crit", ...seed) < 0.1
favorite = !dark && guest?.favorite === recipe.outputId
```

| 项 | 正常 | crit 额外 | favorite 额外 | 黑暗料理 |
| --- | --- | --- | --- | --- |
| warmth | + `dish.warmth`（未登记 +6） | — | 再 +8 | −1 |
| happiness | + `dish.happiness`（未登记 +3） | — | 再 +2 | −2 |
| 产物 | `inv[outputId] += outputQty` | 数量 ×2 | — | 同正常 |
| 嘉宾停留 | — | — | `untilDay += 1`，封顶 `sinceDay + 4` | — |
| 计数 | `cooked += 1` | 同左 | 同左 | 另 `darkDishes += 1` |
| extras | `{ dark, favorite, crit, qty }` | | | |

### 5.6 `build(state, { buildingId } = {}): Envelope` ✅

| 前置（按序） | 失败文案 |
| --- | --- |
| 建筑定义存在 | 没有这种建筑 |
| 未建过 | 已经有了 |
| `meta.level >= def.unlockLevel` | 小镇等级不够 |
| `def.popNeed` 满足（可选字段，当前数据未用） | 人手不够，要 N 个人才张罗得起来（动态插值，冻结） |
| `def.kind === "pop"` 时 `pop < popCap` | 人口到顶了，先盖社区 |
| 资源类花费（键在 `resources` 上的走资源）足够 | 建材或金币不够 |
| 库存类花费（其余 itemId 走 `inv`）足够 | 库存不够 |

成功：扣两类花费；`buildings[id] = { built: true, slots: [], slotCount: def.slots || 0 }`；`kind === "pop"` → `pop = min(popCap, pop + 1)`；`kind === "cap"` → `popCap += 4`；log 一条。

### 5.7 `petPlay(state, { petId, now = Date.now() } = {}): Envelope` ✅（now 走 payload，落地惯例）

失败文案：「它跑去田埂了」/「它还想再躺会儿」（`readyAt > now`）。
成功：`coin += 3 + (petyard 已建 ? 2 : 0)`；`happiness += (kind === "cat" ? 2 : 1)`；`readyAt = now + 20_000`；log 一条；extras `{ coin }`。

### 5.8 `stallSell(state, { itemId, qty = 1 } = {}): Envelope` ✅

| 前置（按序） | 失败文案 |
| --- | --- |
| `buildings.stall?.built` | 摊位还没支起来 |
| `floor(Number(qty)) >= 1` | 至少也得摆一件出去 |
| `inv[itemId] >= qty` | 货不够 |
| `priceOf(itemId) > 0` | 这个卖不出价 |

成功：`coin += round(stallPrice(itemId, qty) × guestBuffFactor(state, "stall"))`（茶婆婆 1.1；`stallPrice = round(基准价 × qty × 1.15)`，事实源 `data/items.js`）；`inv[itemId] -= qty`；log 一条；extras `{ coin }`。

摊位 UI（冻结）：`ui.sellId/sellQty` 由纯 UI 动作 `meta/sell` 维护（选货从 1 件重数、`step: ±1` 加减、`qty: "max"` 全库存、件数恒钳 [1, 库存]、库存 0 清选中）；reducer 的 `village/stall` 失败走 `applyResult`、**成功不走**（写回 sellId/sellQty + toast「摊上收进 N 金币」）；委托 `sellpick/sellstep/sellmax/sell`；`detailStall` 货架按单价降序、`priceOf === 0` 归入「没人收」脚注；无工位建筑走 `detailPlainBuilding`。

### 5.9 家具：`placeFurniture(state, { furnitureId } = {}): Envelope` ✅（唯一实现 = `core/furniture.js`；R2-21 DONE【R3】）

村落侧写入端（`place`/`placeFurniture` 导出）与双形状兼容读**已删除**【R3 `ea9ffec`】；village 只再导出 core 的读取端（§5.0）。落盘 = 家具 id 字符串数组。

| 前置（按序） | 失败文案 |
| --- | --- |
| `furnitureById(furnitureId)` 存在 | 没有这件家具 |
| `!isPlaced(state, furnitureId)` | 这件已经摆上了 |
| `meta.level >= def.unlockLevel` | 小镇等级不够 |
| 资源类花费（coin/pearl）足够 | 金币或材料不够 |
| 库存类花费（cloth/wool）足够 | 库存不够 |

成功：`splitCost` 扣两类花费；`furniture += def.id`（string，不进 `inv`）；`warmth += def.warmth`；log 一条；extras `{ warmth }`。不可拆除（v1 裁决：只加不减）。

温馨保底双闸 ✅：① `core/furniture.applyFurnitureWarmth` 在 main.js `finalize`（tick 与 offline 收尾）把 `resources.warmth` 兜到 `furnitureWarmth(state)` 之上；② village `rolloverDays` 日衰减为 `warmth = max(furnitureWarmth(state), warmth - 跨日数)`——家具是温馨的地板。

UI ✅：蘑菇屋面板「屋里摆什么」区（`furnitureSection`）——按 room 分组（堂屋/灶间/院子/客房），每件列温馨值/造价/描述，按钮态 = 已摆上 / 等 Lv.N / 差 X / 摆上，`data-act="place"`（action 名 `village/furnish`）；区头显示「已摆 n/总数 · 温馨保底 N」。

### 5.10 `tickVillage(state, dtMs, nowMs = Date.now()): State` — 节拍 ✅

`refillWishSlot(rolloverDays(state), nowMs)`。`rolloverDays` 日结（以 `village.lastDay` 自检跨了几天，离线大跨度天然正确）：

| 项 | 规则 |
| --- | --- |
| 嘉宾离店 | `guestUntil(g) < day` → 移除 + log（`guestUntil` 缺 untilDay 时回退 `sinceDay + 2`） |
| 心愿过期 | `day - createdDay >= WISH_EXPIRE_DAYS(3)` 的 open 单撤下 + log |
| 温馨衰减 | `warmth = max(furnitureWarmth(state), warmth - 跨过的天数)` |

`refillWishSlot` 停表语义见 §5.1【R3】。

## 6. Action ↔ 函数映射（main.js `applyAction` 分派表，终态）

| action.type | payload | 调用 | 状态 |
| --- | --- | --- | --- |
| `farm/till` | `{ plotId }` | main 预检 + `till`（裸 state 包 `{ok:true}` 走 applyResult） | ✅ 冻结（§3.2）；成功推进教程步 1 |
| `farm/plant` | `{ plotId, cropId }` | `plant` | ✅ 成功推进教程步 2 |
| `farm/harvest` | `{ plotId }` | `harvest` | ✅ 成功推进教程步 3 |
| `farm/harvest_all` | `{}` | `harvestAll` | ✅ 工具条按钮 + H 键；成功推进教程步 3 |
| `farm/expand` | `{}` | `expandPlot` | ✅ |
| `farm/cover` | `{ plotId? }`（缺省挑第一块未罩地） | `expandGreenhousePlot` | ✅【R3 `1f64876`】温室面板逐地块按钮（§3.9） |
| `prod/enqueue` | `{ buildingId, recipeId }` | `enqueueJob` | ✅ |
| `prod/collect` | `{ buildingId, slot }` | `collectJob`（slot 传 job.id；collectLivestock 兜底 = 冻结死代码） | ✅ |
| `prod/feed` | `{ buildingId, slot }` | `feedAnimal` | ✅ 按钮经 `queries.feedCost` 写真实份数并置灰【R3 `1f64876`】 |
| `prod/unlock` | `{ buildingId }` | `unlockSlot` | ✅ |
| `village/deliver` | `{ wishId }` | `deliverWish` | ✅ 交付后留空格【R3】 |
| `village/skip` | `{ wishId }` | 撕单 + `refreshWishes` 立即补（借 `ui.rerolls` 移位抽签，日期改回） | ✅ 换单立即补是有意为之；**已知漏洞**：会顺带补满交付留下的其他空位，绕过补位节拍（§11-3） |
| `village/invite` | `{ guestId }` | `inviteGuest` | ✅ |
| `village/cook` | `{ recipeId, guestId }` | `cook` | ✅ guestId 由 handler 的 `serveTarget` 补全：点名（ui.serveTo）→ 爱吃这道菜的 → 屋里第一位 |
| `village/build` | `{ buildingId }` | `build` | ✅ |
| `village/pet` | `{ petId }` | `petPlay` | ✅ |
| `village/stall` | `{ itemId, qty }` | `stallSell` | ✅ 成功路径特例（不走 applyResult，§5.8） |
| `village/furnish` | `{ furnitureId }` | `placeFurniture`（core/furniture） | ✅ |
| `meta/tick` | `{ dt }` | `ARCHITECTURE.md §4.3` 管线 | ✅（`payload.now` 透传作废，R2-18 DEAD） |
| `meta/offline` | `{ savedAt, now }` | `applyOfflineCatchup`（注入 catchUpPlots/tickProduction/tickVillage）→ `finalize` → 摘要 toast | ✅ 启动仅一次、**先于**首个 `meta/tick`；`offlineMs = 0` 时返回原引用（main 补「接着上次的日子过」toast） |
| `meta/mute` | `{}` | `meta.muted` 取反 | ✅ |
| `meta/settings` | `{ hourMs }` | 白名单校验（`HOUR_MS_CHOICES` 之外或与现值相同 → 原引用静默）后写 `meta.hourMs` + toast「一个游戏时改成 N 秒。」 | ✅【R3 `1f64876`】顶栏时速按钮（`cycleSpeed` → `nextHourMs`）；R2-15 翻案 DONE |
| `meta/seed` | `{ cropId }` | 写 `ui.seed`（键盘 1–6 入口先过 `canPlant`，锁种拦截飘字【R3】） | ✅ |
| `meta/sell` | `{ itemId?, step?, qty?: "max" }` | 纯 UI 态：维护 `ui.sellId/sellQty`（§5.8） | ✅ |
| `meta/serve` | `{ guestId }` | 纯 UI 态：切换 `ui.serveTo`（点同一人取消点名） | ✅ |
| `meta/select` | `{ id }` | 写 `ui.selected`；教程末步联动 | ✅ |
| `meta/tutorial` | `{}` | 跳过教程（step = 4） | ✅ |
| `meta/toast` | `{ text, tone?, fx? }` | 组合根内部飘字 | ✅ |
| `meta/save` `meta/load` `meta/replace` | — | 保留字：组合根直接调 save/replace，不进 reducer | ✅ |

reducer 对未知 type **必须**返回原 state 引用（静默）。**唯一不存在的拟议 action**：`village/wish`（`acceptWish` 实装不接线，冻结）——原先同列的 `meta/settings` 与 `farm/cover` 已于【R3 `1f64876`】落地转正。

## 7. 失败文案总表（reason 冻结表：只加不改不删；机器码列作废）

组合根预检/handler 层飘字（不走信封）：「这块地不用再翻了」「还在长，别催它。」「还没有做好的东西。」「各处炉子都空着。」「菜谱上没这道菜。」「先在货架上挑一样东西。」「刚才那下没成，先干点别的。」「××要小镇 Lv.N。」（键盘选锁定种子，动态插值【R3】）——同样冻结。

| 抛出者 | reason 文案（= UI 飘字原文） |
| --- | --- |
| core `spendInv` | 材料不够 |
| farm `plant` | 没有这种作物 / 小镇等级不够 / 没有这块地 / 这块地还不能种 / 金币不够买种子 |
| farm `harvest` | 还没熟 / 地里空着 |
| farm `harvestAll` | 还没有能收的地 |
| farm `wilt` | 没有这块地 / 这块地没种东西 |
| farm `expandPlot` | 人手不够，先盖房子添人 / 小镇等级不够，再攒些经验 / 扩建要 40 金币和 1 把锹 |
| farm `expandGreenhousePlot` | 先把温室盖起来 / 没有这块地 / 所有地都在温室里了 / 这块地已经在温室里了 / 温室罩不下更多地了 / 改温室要 80 金币和 1 把锯 |
| production `enqueueJob` | 配方不对 / 还没建这座作坊 / 小镇等级不够 / 生产位满了 / 原料不够 |
| production `collectJob` | 没有这单活 / 还在忙 / 这单活坏了 |
| production `feedAnimal` | 这里不养牲口 / 还没建 / 圈里满了 / 饲料不够 |
| production `unlockSlot` | 还没建 / 这里没有工位 / 已经满了 / 金币不够 |
| village `acceptWish` | 心愿不见了 / 这单已经接下了 |
| village `deliverWish` | 心愿不见了 / 这单已经交过了 / 东西还没收齐 |
| village `inviteGuest` | 村里没这个人 / 已经在屋里坐着 / 屋里只坐得下 N 位，先添间客房（动态 N，冻结） |
| village `cook` | 厨房不会做这个 / 厨房还没盖起来 / 小镇等级不够 / 食材不够，别让客人饿着 |
| village `build` | 没有这种建筑 / 已经有了 / 小镇等级不够 / 人手不够，要 N 个人才张罗得起来（动态 N，冻结） / 人口到顶了，先盖社区 / 建材或金币不够 / 库存不够 |
| village `petPlay` | 它跑去田埂了 / 它还想再躺会儿 |
| village `stallSell` | 摊位还没支起来 / 至少也得摆一件出去 / 货不够 / 这个卖不出价 |
| core/furniture `placeFurniture` | 没有这件家具 / 这件已经摆上了 / 小镇等级不够 / 金币或材料不够 / 库存不够 |

注：`feedAnimal/unlockSlot` 的「还没建」与 `enqueueJob` 的「还没建这座作坊」是两条并存文案，各自冻结（归一方案随机器码迁移一并作废）。

## 8. 嘉宾 buff 应用点（恰好 7 处，**全部生效** ✅；`bf = guestBuffFactor(state, target)`）

| target | 嘉宾/系数 | 应用函数（唯一） | 时机 | 公式 | 状态 |
| --- | --- | --- | --- | --- | --- |
| `farm` | 林婶 0.85 | `plant` | 播种瞬间快照进 doneAt | `grow = max(1000, round(bf × growMs / seasonFactor))` | ✅ |
| `kitchen`(工时) | 灶台叔叔 0.8 | `enqueueJob`（buildingId === "kitchen"） | 入队瞬间快照进 doneAt | `timeMs = max(1, round(recipe.timeMs × bf))` | ✅ 按 buildingId 通吃【R3】 |
| `kitchen`(翻车) | 灶台叔叔 0.8 | `cook` | 开火瞬间 | `dark = roll < 0.08 × bf` | ✅【R3 `ea9ffec`】 |
| `weavery` | 苇姐 0.85 | `enqueueJob`（buildingId === "weavery"） | 入队瞬间快照进 doneAt | 同 kitchen 工时行 | ✅【R3 `cdbdf5e`】 |
| `wish` | 灯哥 0.85 | `wishIntervalMs`（refillWishSlot 计时） | 计算下次补位时间 | `interval = round(2 游戏时 × hourMs × bf)` | ✅ 交付主路径生效【R3】 |
| `livestock` | 竹仔 1.1 | `feedAnimal` | 投喂瞬间快照进 job.qty | 余数分桶累积（§4.3） | ✅ |
| `stall` | 茶婆婆 1.1 | `stallSell` | 成交瞬间 | `coin = round(stallPrice × bf)` | ✅ |

除本表外任何代码不得读 `guest.buff`；`cook` 的 favorite 加成走 `guest.favorite`，不属 buff 体系。多嘉宾同 target 连乘、钳 [0.5, 2]——三个系统的本地实现冻结（core/buffs 单模块作废，`ARCHITECTURE.md §7`）。

## 9. 冻结导出面（api.test.js + probe.mjs + 脚本断言，删改即红）

| 模块 | 冻结导出 |
| --- | --- |
| farm | `till` `plant` `harvest` `expandPlot` `tickPlots` `seasonFactor`；probe 可选位 `catchUpPlots` `harvestAll`；另契约冻结 `wilt` `applyGuestFarmBuff` `canPlant` `isGreenhousePlot` `greenhousePlotCount` `expandGreenhousePlot` 与常量 `OFF_SEASON_FACTOR` `WILT_GRACE_MS` `OFFLINE_CAP_MS`（再导出）`GREENHOUSE_PLOT_CAP` `GREENHOUSE_COIN` `GREENHOUSE_SAW` |
| production | `enqueueJob` `collectJob` `feedAnimal` `unlockSlot` `tickProduction` `canCraft`；另 `buildingSlots` `freeSlots` `livestockYieldMultiplier` `feedCost` `winterFeedCarry` `livestockCarry` `MAX_SLOTS` `WINTER_FEED_SURCHARGE`（再导出【R3】） |
| village | `acceptWish` `deliverWish` `refreshWishes` `inviteGuest` `cook` `build` `petPlay` `stallSell` `tickVillage`；另 `guestCapacity` `guestBuffFactor` `wishCandidates` `wishSlots` `happinessMult` `kitchenRecipe` `kitchenMenu` 与 4 个常量；家具读取端 `placedFurniture` `furnitureWarmth` `hasFurniture`（= core 再导出【R3】；写入端 `place`/`placeFurniture` 已删） |
| core/engine | `createInitialState` `createInitialUi` `advanceTime` `LEVELS` `levelFor`（= data/levels 再导出【R3】）`levelProgress` `TUTORIAL_TOTAL` `HOUR_MS_DEFAULT` `HOUR_MS_CHOICES` `normalizeHourMs` `nextHourMs`【R3】 `DAY_HOURS` `DAYS_PER_SEASON` `OFFLINE_CAP_MS`（`absGameMinutes` = 冻结死代码，禁新增调用） |
| core/offline | `applyOfflineCatchup` `offlineSpan` `humanGap`（main.js 与 §6 `meta/offline` 在用） |
| core/furniture | `placeFurniture` `placedFurniture` `isPlaced` `furnitureWarmth` `applyFurnitureWarmth`（main.js + screens.js + village 再导出在用） |
| data | `CROPS` `RECIPES` `BUILDINGS` `ANIMALS`（另 `GUESTS` `WISH_POOL` `ITEM_NAMES` `BASE_PRICES` `stallPrice` `priceOf` `STALL_MARKUP` `DISHES` `dishByRecipe` `FURNITURE` 及各 `xxxById`） |
| data/levels | `XP_TABLE` `levelForXp` `xpForNext`（唯一事实源，engine 再导出其表【R3 `228af0c`】，§2.4） |
| data/wishes（数值事实源，**已全部接线** ✅【R3】） | `WISH_REFRESH_MIN` `WISH_TOOL_DROP` `WISH_PEARL_DROP` `TOOL_DROP_WEIGHTS` `TOOL_PITY_ORDER` `TOOL_PITY_DROUGHT`；data/animals 的 `WINTER_FEED_SURCHARGE`（production 消费） |

## 10. 差异台账（Round 1 → 2 → 3）

### 10.1 已落地（DONE 收编；★ = R2 首波，★★ = R2 第二波，★★★ = Round 3 收官波）

| 项 | 落点 |
| --- | --- |
| 可玩闭环 + 增量 UI（骨架/签名比对/每帧通道/事件委托）+ 4 步教程 + fx 音效通道 | main.js / ui/screens.js |
| 心愿重写：tier 缩放、3 日过期、补位计时器、幸福加成封顶、`village/skip` 换单；★ minLevel+maxLevel 双向过滤（两级兜底）、温馨 ≥100 第 4 心愿格 | village |
| 确定性 RNG（rng.js 状态哈希）替代 Math.random（village 全域）；production `makeJobId` 确定性 ★ | village/rng.js、production |
| 嘉宾容量 / 温馨定停留 / untilDay 离店 / 温馨日衰减；★ favorite 续住封顶 `sinceDay + 4` | village |
| cook：厨房建成 + 等级门槛 + 9 道菜谱 + 菜品加成表 + 确定性翻车；★ 温馨 ≥60 暴击 ×2、kitchenRecipe/kitchenMenu | village + data/dishes |
| ★ 家具系统（placeFurniture + 温馨保底盘）→ ★★ core/furniture 收敛 + UI 面板 → **★★★ village 写入端删除、读取端再导出（R2-21 收官）** | core/furniture + village + ui |
| stallSell 全量（价格表 / qty 校验 / worthless / 茶婆婆 buff）+ ★★ 摊位 UI（meta/sell、货架、成交行、假工位修复） | village + data/items + ui |
| build：popNeed / 人口上限 / 社区 +4；petPlay：宠物院 +2、猫狗差异 | village |
| 农耕全量（季节 / 枯萎宽限 / 扩建三重门 / harvestAll / catchUpPlots）；★ crop.unlockLevel + canPlant；★ 温室地块制；**★★★ 离线生长 8h 封顶（超窗顺延 overflow）+ tickPlots 枯萎日志 + OFFLINE_CAP_MS 再导出（R2-2/2b/17 收官，`f95afa2`）** | farm |
| 工位 / 畜牧收取 + collectXp 回退链；★ 冬饲 +20% 记账 + feedCost 查询；★ 畜牧余数分桶；★ 注入 nowMs；**★★★ WINTER_FEED_SURCHARGE 改 import data/animals + enqueueJob 按 buildingId 吃 buff（weavery 生效，`cdbdf5e`）** | production |
| ★ 三系统 buff 口径统一（连乘 + 钳 [0.5, 2]）；**★★★ cook 翻车率 ×kitchen buff（第 7 应用点收官，`ea9ffec`）** | farm/production/village |
| 自动存档三通道 + hydrate 骨架 + 坏档兜底 | main.js / core/save |
| ★★ 离线折算全链：core/offline + `meta/offline` 启动派发（先于首 tick）+ 摘要 toast/log | core/offline + engine + main.js |
| ★★ 厨房整本菜单 + 「端给谁」点名；★★ `farm/harvest_all` + H 键；★★ finalize 收尾统一 | main.js + ui |
| ★★ `data/levels.js` + 经济校准数据契约；**★★★ 校准接线收官（R2-22 主体，`ea9ffec`）：掉率 0.25 + 权重 锹40/锯35/斧25 + 两级保底（pityStep/drought 入档）+ `WISH_REFRESH_MIN` 换算 + 交付不补满/满板停表（R2-9）** | data + village |
| 12 套四季×昼夜皮肤（+ `9ada6e4` 夜间对比度/枯地/触区打磨）；**★★★ 测试收口：58 过 / 1 skip，5 个 skip 清 4 个；offline-smoke `ok:true`** | styles / tests / scripts |
| **★★★ 开局工具 1/0/0 + 等级表单源化（LEVELS/levelFor 薄再导出）+ 时速三档（HOUR_MS_CHOICES/normalizeHourMs/nextHourMs）+ hydrate 地块补键（`228af0c`，补罩撤销 `411a27e`）** | core/engine + core/save |
| **★★★ UI 收官（`1f64876`）：queries 只读注入（render 第 4 参）、温室面板 + `farm/cover`、种子门置灰 + 键盘拦截、投喂价按钮读 feedCost、`meta/settings` 时速按钮、收获飘字（fx.text/at → `.xw-fx`）、村景剪影挂点（`.xw-yard`/`.xw-npc`）** | main.js + ui/screens.js |

### 10.2 Round 2 工单终局台账（**全部 DONE / DEAD，无 TODO 遗留**）

| # | 内容 | 终局 | 依据 / 处置 |
| --- | --- | --- | --- |
| R2-1 | `core/reasons.js` + 机器码双读迁移 D0–D3 | **DEAD** | 零落地；中文 reason 原文冻结为契约（§0.2/§7） |
| R2-2 | farm `OFFLINE_CAP_MS` 改 engine 再导出 | **DONE** | 【R3 `f95afa2`】 |
| R2-2b | `catchUpPlots` 生长封顶（超窗顺延 overflow） | **DONE** | 【R3 `f95afa2`】offline-smoke `ok:true`、time 用例解封（`74bbc8b`） |
| R2-3 | 等级表单源化（engine 薄再导出 data/levels） | **DONE（翻案）** | 【R3 `228af0c`】`LEVELS = XP_TABLE`、`levelFor = levelForXp`；`levelProgress` 留 engine 用同表（§2.4） |
| R2-4 | buff 收敛 core/buffs.js；enqueueJob 泛化；cook 翻车率 | **泛化/翻车率 DONE【R3 `cdbdf5e`/`ea9ffec`】；core/buffs.js DEAD** | 7/7 应用点生效（§8）；三处本地实现冻结 |
| R2-7 | `canPlant` UI 置灰（种子条等级门） | **DONE（翻案）** | 【R3 `1f64876`】经 queries 注入置灰 + Lv 价签 + 键盘拦截（§3.0） |
| R2-9 | `deliverWish` 停止立即补满 | **DONE** | 【R3 `ea9ffec`】+ 满板停表；断言改口径（`8708517`） |
| R2-10 | `till` 信封化 | **DEAD** | 裸 state + main 预检冻结为唯一例外（铁律 2、§3.2） |
| R2-11 | 温室：系统 ✅ / UI 接线 / hydrate 免费补罩 | **系统 + UI 均 DONE；补罩 DEAD（实操撤销）** | 系统 R2 已收；UI【R3 `1f64876`】`farm/cover` + 温室面板；补罩 `411a27e` 撤销（旧档与新档不可区分，§2.3） |
| R2-15 | `meta/settings`（hourMs 3000/6000/12000） | **DONE（翻案）** | 【R3 `228af0c`/`1f64876`】HOUR_MS_CHOICES 白名单 + 顶栏循环切档 + hydrate 归一；切档不回溯已排定时刻（§6、`ARCHITECTURE.md §4.1`） |
| R2-16 | hydrate 逐条目增补表 + SAVE_VERSION/MIGRATIONS | **DEAD** | 版本管线不建；读取端防御 + 仅有的 `hydratePlots` 补键/`normalizeHourMs` 归一即契约（§2.3）；v1 冻结期字段只增不改 |
| R2-17 | `tickPlots` 枯萎写日志 | **DONE** | 【R3 `f95afa2`】 |
| R2-18 | `meta/tick` 透传 `payload.now` | **DEAD** | reducer 级重放无使用方；测试直调系统函数注入 |
| R2-19 | 删 main `collectLivestock` 兜底 + engine `absGameMinutes` | **DEAD** | 冻结为无害死代码（不可达/零调用），禁止新增调用（§2.1/§4.2） |
| R2-20 | 边界静态哨兵测试 | **DEAD** | 违规现为零；纪律由 code review 维持（`ARCHITECTURE.md §9`） |
| R2-21 | 家具去重（删 village 写入端、读取端改 import） | **DONE** | 【R3 `ea9ffec`】 |
| R2-22 | 经济校准接线（掉率/保底/补位间隔/冬饲源/开局工具） | **全部 DONE** | 掉率/保底/补位/冬饲【R3 `ea9ffec`/`cdbdf5e`】；开局工具 1/0/0 收尾【R3 `228af0c`】（§5.3） |

早前已收编（原编号留档）：R2-5 冬饲 ★、R2-6 production 注入/确定性 id ★、R2-8 心愿 minLevel ★、R2-12 家具（★+★★）、R2-13 摊位 UI ★★、R2-14 全部收获 ★★。

### 10.3 已废条目（历轮草案 → 终稿删除，防止按旧文施工）

| 旧条目 | 处置 |
| --- | --- |
| 机器码 reason（`域.代码`）+ `message` 双轨 + D0–D3 双读迁移 + `expectReason` 助手 + 静态汉字哨兵 | 【R3 终裁】整体作废：中文文案即冻结契约（§0.2/§7） |
| `core/buffs.js` 单模块收敛 | 作废：三处本地实现口径一致冻结（§8） |
| `SAVE_VERSION`/`MIGRATIONS` 版本管线、hydrate 逐条目增补表、温室旧档免费补罩 | 作废：v1 冻结纪律 + 读取端防御，写侧只留 `hydratePlots` 补键（§2.3）；补罩曾短暂落地后实操撤销（`411a27e`） |
| `meta/tick` 透传 `payload.now`、`till` 信封化 | 作废（§10.2 对应行）。注意：同批曾判废的 `meta/settings` 与种子条置灰已在第二波**翻案落地**，勿再当死条目 |
| GDD 契约表 #13「心愿计时迁绝对游戏分钟」 | 作废：`nextWishAt` 冻结纪元 ms + 停表语义（`ARCHITECTURE.md §4.1`） |
| rootReducer 三段式、失败写 log | 落地为 applyAction + toast 飘字（`ARCHITECTURE.md §3.3`） |
| `absGameMinutes(meta)`、顶层 `wishNextAt`（游戏分钟） | 作废；engine 内残留函数 = 冻结死代码 |
| `guests[].leaveDay` | 改名 `untilDay`（落盘前改名，不升存档版本） |
| deliverWish 掉落 3% 珍珠 / 10% 工具、末位 `rand` 参数；0.35 + 锹40/斧35/锯25 旧口径 | 终态 = 0.25 + 锹40/锯35/斧25 + 两级保底（§5.3，双口径期终结【R3】） |
| deliverWish 成功后立即补满 | 【R3】作废：留空格给补位节拍（§5.1） |
| inviteGuest 的 level ≥ 4 门槛 | 作废：容量曲线（guestCapacity）控节奏 |
| 温室「建成即全场免疫」、免费 `setGreenhouse`（cap 4） | 落地为 `expandGreenhousePlot` 付费改造（80 金 + 锯，cap 3，不可撤销） |
| “buff 应用点恰好 4 处” | 扩为 7 处（§8），全部生效 |
| `production.livestockCarry` 单一 number | 落地为按 productId 分桶（旧档 number 兼容读） |
| 音效决策读 `action.type`；帧 dt 钳制 200ms | 落地为 `ui.fx` 信号；500ms + 100ms 累积 |
| 初始工具「落地 2/1/1 即终态」 | 撤销后已按目标落地：1/0/0 + 两级保底取代白送 ✅【R3 `228af0c`】（§5.3） |
| `src/data/prices.js`；心愿选单公式 `(day * 7 + open.length) % pool`；`wiltOffSeason` 批量枯萎；stallSell 文案「这东西没人收」 | 均已由落地实现取代（items.js / wrap+线性探测+wishSeq / 宽限机制 / 「这个卖不出价」） |
| `applyOfflineCatchup` 拟落 engine、三参签名；「B 时基一律自然到期」一揽子裁决 | 落地为 core/offline 四参注入；收窄为「仅 jobs/pets/心愿自然到期，农田封顶顺延」（§3.10 ✅） |
| 家具落盘 `{ id, room, day }` 对象（village 写入端）；读取端双形状兼容 | 【R3】全部删除：string id 数组唯一形状（§5.9） |
| 摊位 UI 拟稿（data-qty / 两按钮 / 成功走 applyResult）；家具 `data-act="furnish"` | 落地为 meta/sell UI 态 + stepper + data-b、成功路径特例；`data-act="place"` |
| `data/levels.js` 拟导出 `MAX_LEVEL` | 作废：未导出、无使用方 |

## 11. Final：剩余真实缺口（冻结清单，后续轮次从这里开工）

> 判据：实读 HEAD `12a0312` 代码确认仍在、且有玩家可感影响或维护风险的，才进本表。**第二波落地销账四条**（编号留档不复用）：~~11-1 温室 UI 入口~~、~~11-2 投喂价按钮~~（均 `1f64876`）、~~11-4 开局工具 1/0/0~~（`228af0c`）、~~11-6① 等级表双份~~（`228af0c` 单源化）。实测欠账（浏览器实跑）归验收文档管辖，不在本表重复。

| # | 缺口 | 现状 | 冻结的修复口径（不扩大范围） |
| --- | --- | --- | --- |
| 11-3 | **`village/skip` 绕过补位节拍**（唯一行为缺口） | 换单路径 `refreshWishes` 会把交付留下的空位一并立即补满——换单本身立即替换符合口径，但可被用来免等补位间隔（无资源增益，纯节奏漏洞） | skip 改「删 1 补 1」：`fillWishes(…, 1)` 语义，不动其他空位（Opus-3） |
| 11-5 | **`spendInv` 非正数校验缺失**（测试套件唯一 skip） | `needs` 里 qty ≤ 0 会被当作免费通过；全部调用点传常量，无实际触发面 | `spendInv` 对非正数 qty 返回失败信封；解封 `invariants.test.js` 对应 skip（Opus-4 + GPT-sol-1） |
| 11-6 | **维护注记（非行为缺口，防翻车备忘）** | ① 冻结死代码：`engine.absGameMinutes`、main `collectLivestock`（不可达兜底）——禁止新增调用；② 仓库根游离 `node_modules/`、`package-lock.json` 不得入库（SOTA C5）；③ `data/wishes.js` 保底注释尾句「开局 1/0/0 仍待 engine 落地」已过期（`228af0c` 已落、注释未随手改）——下次动该文件时顺删，不单开工单 | 无需修复，长期备忘 |

**收束声明**：除上表外，本契约与 `ARCHITECTURE.md` 描述的行为均已在 HEAD `12a0312` 落地并有自动化背书（`npm test` 58 过 / 0 失败 / 1 skip；probe 必需导出 21/21、三链全 true；bench < 2 ms/tick 预算内；offline-smoke / wish-board / chain-smoke 全 `ok`）。任何与本文不符的旧文档表述，以本文与落地代码为准。
