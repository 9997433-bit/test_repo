# API 契约（实施级 · Round 1 定稿）

> 与 `ARCHITECTURE.md` 配套。签名以**现有 `src/systems/**` 实现为基准**，Round 2 变更点逐条标注 `【R2】` 并指名所有者。实现者不得偏离本文的签名、reason 码、公式与字段名。

## 0. 约定与术语

### 0.1 函数三类（返回形状唯一化）

| 类别 | 返回 | 例 |
| --- | --- | --- |
| 命令（玩家动作） | 信封 `Envelope` | `plant` `enqueueJob` `deliverWish` |
| 查询（selector，无副作用只读） | 裸值（boolean/number/…），**永不**返回信封 | `canCraft` `seasonFactor` `buffFactor` `levelForXp` |
| 节拍（tick 驱动） | 裸 **完整 nextState** | `tickPlots` `tickProduction` `tickVillage` `advanceTime`（含元组） |

### 0.2 信封 `Envelope`

```js
// 成功
{ ok: true, state: State /* 完整 nextState */, ...extras }
// 失败（state 必须 === 传入引用；reason 稳定机器码；message 中文 UI 文案）
{ ok: false, reason: string, message: string, state: State }
```

| 字段 | 规则 |
| --- | --- |
| `reason` | 稳定字符串码，格式 `域.代码`（`farm.coin_short`），**只加不改不删**，测试断言它 |
| `message` | 中文文案，取自 `core/reasons.js` 的 `REASONS[reason]`，UI/日志显示它；测试**不得**断言它 |
| `extras` | 仅限可序列化原始值/小对象（如 `cook` 的 `dark: boolean`）；禁止塞函数 |

【R2】现状系统直接把中文写在 `reason` 里且无 `message`。迁移规则：中文原文进 `REASONS` 表成为 `message`（§7 已逐条给出映射），`reason` 换成机器码。`applyResult` 日志取 `r.message ?? r.reason`，因此分批迁移不炸 UI。现有测试只断 `ok`，安全。

### 0.3 参数演进规则（保测试不烂）

新参数**只能追加到末位且带默认值**：`nowMs = Date.now()`、`rand = Math.random`。已有位置参数的顺序与含义永不变。payload 对象内加可选键允许。

## 1. State Schema v1（唯一定义处）

| 路径 | 类型 | 初值 | 时基 | 写者 |
| --- | --- | --- | --- | --- |
| `meta.name` | string | `"新村长"` | — | village |
| `meta.level` | int 1–10 | 1 | — | **仅 finalize**（派生自 xp） |
| `meta.xp` | int ≥0 | 0 | — | farm/production/village |
| `meta.hourMs` | 3000\|6000\|12000 | 6000 | — | meta/settings |
| `meta.gameMinutes` | float [0,1440) | 480 | A 游戏 | advanceTime |
| `meta.day` | int ≥1 | 1 | A 游戏 | advanceTime |
| `meta.season` | `"spring"\|"summer"\|"autumn"\|"winter"` | `"spring"` | A 游戏 | advanceTime |
| `meta.muted` | boolean | false | — | meta/mute |
| `meta.tutorialStep` | int | 0 | — | UI 经 meta/settings |
| `resources.coin` | int ≥0 | 80 | — | 全体 |
| `resources.pearl` | int ≥0 | 0 | — | village |
| `resources.happiness` | int ≥0 | 40 | — | village |
| `resources.warmth` | int ≥0 | 20 | — | village |
| `resources.pop` / `popCap` | int | 2 / 4 | — | village(build) |
| `resources.shovel/axe/saw` | int ≥0 | 1/0/0 | — | farm/village |
| `inv` | `Record<itemId, int ≥1>`（0 即删键） | `{ chili: 2 }` | — | addInv 系 |
| `plots[]` | `{ id, status, cropId, plantedAt, doneAt, greenhouse }` | 2 块（p1 empty、p2 untilled） | B 纪元 | farm |
| `plots[].status` | `untilled\|empty\|growing\|ready\|wilted` | — | — | farm |
| `buildings` | `Record<buildingId, { built: true, slots: [], slotCount?: int }>`（未建 = 无键） | mushroom、wish | — | village(build)/production(unlockSlot) |
| `jobs[]` | `{ id, buildingId, recipeId, status: "running"\|"done", doneAt, kind?: "livestock", productId?, qty?, xp? }` | `[]` | B 纪元 | production |
| `wishes[]` | `{ id, wishId, name, needs, coin, xp, maxLevel, status: "open" }` | `[]`（首 tick 补满 3） | — | village |
| `guests[]` | `{ id, sinceDay, leaveDay? }`【leaveDay R2】 | `[]` | A 游戏 | village |
| `pets[]` | `{ id, name, kind, readyAt }` | 小花/小团 | B 纪元 | village |
| `log[]` | string，≤40 条，新的在前 | 1 条开场白 | — | 全体经 applyResult/finalize |
| `ui` | `{ seed?: cropId }` 易变 UI 态，可不落盘 | `{}` | — | meta/seed |
| `acc` 【R2 新增】 | `{ livestockYield: float, winterFeed: float }` 余数累积器 | `{0,0}` | — | production |
| `wishNextAt` 【R2 新增】 | float，绝对游戏分钟 | 0 | A 游戏 | village |

`itemId` 全集 = `data/wishes.js` 的 `ITEM_NAMES` 键集；新物品必须先登记该表。

## 2. core 契约（`src/core/**`，Opus-4）

### 2.1 现有导出（签名冻结）

| 模块 | 签名 | 说明 |
| --- | --- | --- |
| store.js | `createStore(initial, reducer)` | 见 `ARCHITECTURE.md §3.1` |
| store.js | `merge(state, patch): State` | 顶层浅合并助手，仅模块内部用 |
| store.js | `addInv(state, id, qty): State` | qty 可负；≤0 删键 |
| store.js | `hasInv(state, needs): boolean` | `needs: Record<itemId, int>` |
| store.js | `spendInv(state, needs): Envelope` | 失败 `core.inv_short`；成功 `{ok:true,state}` |
| engine.js | `createInitialState(): State` | §1 初值列 |
| engine.js | `advanceTime(state, dtMs): { state, crossedDay, crossedSeason }` | 只动 meta 三字段；跨多日自处理 |
| engine.js | 常量 `HOUR_MS_DEFAULT / DAY_HOURS / DAYS_PER_SEASON` | 6000 / 24 / 7 |
| save.js | `SAVE_KEY` `serialize(state)` `deserialize(raw)` `writeSave(state)` `readSave()` `clearSave()` | `deserialize` 返回 `{savedAt,state}\|null` |
| events.js | `createBus()` | 冻结不用，禁新增依赖 |

### 2.2 【R2 新增】core 导出（Opus-4 实现，本文即规格）

| 模块 | 签名 | 规格 |
| --- | --- | --- |
| engine.js | `OFFLINE_CAP_MS = 28_800_000` | 8 真实小时 |
| engine.js | `absGameMinutes(meta): number` | `(meta.day - 1) * 1440 + meta.gameMinutes` |
| engine.js | `applyOfflineCatchup(state, savedAt, nowMs): { state, offlineMs, capped }` | 算法六步见 `ARCHITECTURE.md §4.4`；`EPOCH_FIELDS = plots[].plantedAt, plots[].doneAt, jobs[].doneAt, pets[].readyAt` |
| buffs.js | `buffFactor(state, target): number` | 在座嘉宾（`state.guests`）查 `data/guests.js`，匹配 `buff.target === target` 的 `factor` 连乘，`Math.min(2, Math.max(0.5, x))`；空 = 1 |
| reasons.js | `REASONS: Record<code, string>`、`msg(code): string` | 全量码表 = 本文 §7；`msg` 未知码回退返回码本身 |
| save.js | `SAVE_VERSION = 1`、`MIGRATIONS`、`hydrate(state): State` | 见 `ARCHITECTURE.md §5.2`；hydrate 默认值见 §2.3 |

### 2.3 `hydrate` 默认值表（读档后必跑；新字段一律在此登记）

| 缺失字段 | 补 |
| --- | --- |
| `state.acc` | `{ livestockYield: 0, winterFeed: 0 }` |
| `state.wishNextAt` | `0`（0 = 冷启动，允许一次性补满 3 单） |
| `state.ui` | `{}` |
| `state.guests[].leaveDay` | `sinceDay + 2` |
| `state.pets` / `state.wishes` / `state.jobs` / `state.log` | `[]`（log 补开场白可省） |
| `meta.hourMs` 非法值 | `6000` |

## 3. Farm 契约（`src/systems/farm/index.js`，Opus-1）

### 3.1 `seasonFactor(crop, season, greenhouse = false): number` — 查询

| 条件 | 返回 |
| --- | --- |
| `greenhouse === true` 或 `!crop` | 1 |
| `crop.seasons.includes(season)` | 1 |
| 否则（错季） | 0.55 |

### 3.2 `till(state, { plotId }): Envelope` 【R2 改返回形状】

现状返回裸 state 且无效操作静默；改为信封。**协同点**：Opus-4 须同步把 `main.js` 中 `applyResult(state, { ok: true, state: till(...) })` 改为 `applyResult(state, till(state, payload))`，同一 Round 内完成，否则双重包裹。

| 前置 | 失败码 |
| --- | --- |
| plot 存在 | `farm.plot_not_found` |
| `status ∈ {untilled, wilted}` | `farm.till_invalid` |

成功：该 plot → `{ status: "empty", cropId: null, plantedAt: 0, doneAt: 0 }`。

### 3.3 `plant(state, { plotId, cropId }, nowMs = Date.now()): Envelope` 【R2 追加 nowMs；删除函数体内 Date.now() 与 24–31 行死代码】

| 前置（按序短路） | 失败码 |
| --- | --- |
| `cropById(cropId)` 存在 | `farm.crop_unknown` |
| plot 存在且 `status === "empty"` | `farm.plot_unavailable` |
| `resources.coin >= crop.seedCost` | `farm.coin_short` |

成功效果（快照式，唯一公式）：

```
grow   = round(crop.growMs * buffFactor(state, "farm") / seasonFactor(crop, meta.season, plot.greenhouse))
coin  -= crop.seedCost
plot   = { status: "growing", cropId, plantedAt: nowMs, doneAt: nowMs + grow }
```

注意：`seasonFactor` 在**分母**（错季 0.55 → 时长 ×1.82）；`buffFactor("farm")` 在**分子**（林婶 0.85 → 时长 ×0.85）。播种后换季/嘉宾离店都不回溯 `doneAt`。

### 3.4 `harvest(state, { plotId }): Envelope`

| 前置 | 失败码 |
| --- | --- |
| plot 存在且 `status === "ready"` | `farm.not_ready` |

成功：`inv[crop.yieldId] += crop.yieldQty`；`meta.xp += crop.xp`；plot 复位为 `empty`（cropId null、时间戳 0）。

### 3.5 `expandPlot(state): Envelope`

| 前置 | 失败码 |
| --- | --- |
| `resources.pop >= min(2 + plots.length, popCap)` | `farm.pop_short` |
| `coin >= 40 && shovel >= 1` | `farm.expand_cost` |

成功：`coin -= 40`、`shovel -= 1`、追加 `{ id: "p" + (n+1), status: "untilled", greenhouse: false, ... }`。

### 3.6 `tickPlots(state, dtMs, nowMs = Date.now()): State` — 节拍

`growing && nowMs >= doneAt` → `ready`。不动 wilted。dtMs 目前无用但**保留参数位**。

### 3.7 `wiltOffSeason(state): State` 【R2 新增】 — 节拍（仅 crossedSeason 时由 reducer 调）

`status === "growing" && !greenhouse && !crop.seasons.includes(meta.season)` → `{ status: "wilted", plantedAt: 0, doneAt: 0 }`，**保留 cropId**（UI 显示"枯萎的番茄"）；每株追加 log 可合并为一条。

## 4. Production 契约（`src/systems/production/index.js`，Opus-2）

### 4.1 `canCraft(state, recipeId): boolean` — 查询

`recipe 存在 && meta.level >= recipe.unlockLevel && buildings[recipe.buildingId]?.built && hasInv(inputs)`。

### 4.2 `enqueueJob(state, { buildingId, recipeId }, nowMs = Date.now()): Envelope` 【R2 追加 nowMs】

| 前置（按序） | 失败码 |
| --- | --- |
| recipe 存在且 `recipe.buildingId === buildingId` | `prod.recipe_mismatch` |
| `buildings[buildingId]?.built` | `prod.not_built` |
| `meta.level >= recipe.unlockLevel` | `prod.level_low` |
| 该建筑 jobs 数 < 生产位 | `prod.slots_full` |
| `spendInv(inputs)` 成功 | `prod.input_short` |

生产位 = `buildings[id].slotCount ?? buildingDef.slots ?? 2`；占位 = 该建筑下**所有** jobs（running+done），收取后释放。

成功（时长快照，kitchen buff 在此应用）：

```
timeMs = recipe.timeMs * (buildingId === "kitchen" ? buffFactor(state, "kitchen") : 1)
job = { id: `job_${nowMs}_${rand4}`, buildingId, recipeId, status: "running", doneAt: nowMs + round(timeMs) }
```

### 4.3 `collectJob(state, { buildingId, slot }): Envelope` 【R2 必修：畜牧分支】

`slot`：规范传 **job.id 字符串**；数字下标兼容保留（按该建筑 jobs 过滤后的序号），新代码禁用。

| 前置 | 失败码 |
| --- | --- |
| job 找到 | `prod.job_not_found` |
| `status === "done"` | `prod.job_running` |

成功分支（**现状 bug**：畜牧 job 的 `recipeId` 是动物 id，`recipeById` 返回 undefined 直接崩，必须按下表修）：

| 分支 | 产出 | XP |
| --- | --- | --- |
| `job.kind === "livestock"` | `inv[job.productId] += job.qty` | `meta.xp += job.xp ?? 0` |
| 其他（工厂） | `inv[recipe.outputId] += recipe.outputQty` | 0（R2 暂不加工给 XP） |

之后从 `jobs` 移除该 job。

### 4.4 `feedAnimal(state, { buildingId, slot }, nowMs = Date.now()): Envelope` 【R2 追加 nowMs、槽位上限、两个累积器】

| 前置（按序） | 失败码 |
| --- | --- |
| `animalByBuilding(buildingId)` 存在 | `prod.no_livestock` |
| `buildings[buildingId]?.built` | `prod.not_built` |
| 该建筑 jobs 数 < 生产位【R2 新增检查】 | `prod.slots_full` |
| 库存饲料 ≥ `need`（见下） | `prod.feed_short` |

饲料量（冬季 +20%，确定性余数累积；失败时 acc **不动**）：

```
accW'  = acc.winterFeed + (meta.season === "winter" ? 0.2 : 0)
need   = 1 + floor(accW')
成功后: acc.winterFeed = accW' - floor(accW')
```

产量（竹仔 ×1.1，同法）：

```
f      = buffFactor(state, "livestock")            // 1.1 或 1
accY'  = acc.livestockYield + (f - 1)
qty    = 1 + floor(accY')
成功后: acc.livestockYield = accY' - floor(accY')
```

成功：消耗 `need` 份 `animal.feedId`，入队
`{ id: `live_${nowMs}_${rand4}`, buildingId, recipeId: animal.id, kind: "livestock", status: "running", doneAt: nowMs + animal.cycleMs, productId: animal.productId, qty, xp: animal.xp }`。
【R2】id 由 `live_${now}_${slot||0}` 改为随机后缀防同 ms 冲突。

### 4.5 `unlockSlot(state, { buildingId }): Envelope`

| 前置 | 失败码 |
| --- | --- |
| 已建 | `prod.not_built` |
| 当前生产位 < 6 | `prod.slot_max` |
| `coin >= 40 + 当前位 × 20` | `prod.coin_short` |

成功：扣费，`slotCount = 当前位 + 1`。费用序列（从 2 位起）：80、100、120、140 → 累计 440 金到 6 位。

### 4.6 `tickProduction(state, dtMs, nowMs = Date.now()): State` — 节拍

`running && nowMs >= doneAt` → `done`。

## 5. Village 契约（`src/systems/village/index.js`，Opus-3）

### 5.1 `refreshWishes(state): State` — 节拍（由 `tickVillage` 调用）

基线签名 `refreshWishes(state, nowMs)` **废弃**：刷新计时改用绝对游戏分钟（时基 A），不需要 nowMs。现有测试 `refreshWishes(createInitialState())` 兼容。

【R2 目标语义】（现状"瞬间补满"作废）：

```
absNow = absGameMinutes(meta)
若 open 心愿 >= 3           → 原 state
若 wishNextAt === 0（冷启动）→ 一次补满到 3，然后 wishNextAt = absNow + interval
否则 absNow >= wishNextAt   → 只补 1 单，wishNextAt = absNow + interval
interval = round(WISH_REFRESH_MIN * buffFactor(state, "wish"))   // 120 × 0.85(灯哥) = 102 游戏分钟
```

选单确定性（禁随机）：`pool = WISH_POOL.filter(w => w.maxLevel >= meta.level)`（【R2 修 bug】现状 `>= 1` 恒真）；`idx0 = (meta.day * 7 + open.length) % pool.length`，若该 base id 已在 open 中则向后线性探测 ≤ pool.length 次；`wishId = `${base.id}_${meta.day}_${open.length}``，`status: "open"`。

### 5.2 `acceptWish(state, { wishId }): Envelope` — 预留

恒 `{ ok: true, state }`（心愿自动接取）。保留导出兼容基线；Round 2 不实现接取流程。

### 5.3 `deliverWish(state, { wishId }): Envelope` 【R2 追加 `rand = Math.random` 末位参数（掉落用）】

匹配规则：`w.wishId === wishId || w.id === wishId`。

| 前置 | 失败码 |
| --- | --- |
| 心愿存在 | `village.wish_missing` |
| `hasInv(needs)` | `village.wish_short` |

成功：

```
coins = round(wish.coin * (1 + floor(resources.happiness / 10) * 0.04))   // 幸福每 10 点 +4%
扣 needs；coin += coins；xp += wish.xp；移除该单；log 一条
掉落【R2】：r1 = rand()
  r1 < 0.03            → pearl += 1
  0.03 <= r1 < 0.13    → 工具 +1，取 ["shovel","axe","saw"][floor(rand() * 3)]
  信封 extras: { bonus?: { itemId, qty: 1 } }
```

【R2 行为变更】成功后**不再**立即 `refreshWishes` 补满，改由 `tickVillage` 按 §5.1 计时补位。

### 5.4 `inviteGuest(state, { guestId }): Envelope` 【R2 加等级门槛与容量】

| 前置（按序） | 失败码 |
| --- | --- |
| guest 存在 | `village.guest_unknown` |
| 未在座 | `village.guest_present` |
| `meta.level >= 4`【R2】 | `village.level_low` |
| 在座数 < `1 + (buildings.guestroom?.built ? 1 : 0)`【R2】 | `village.guest_full` |

成功：`guests += { id, sinceDay: meta.day, leaveDay: meta.day + 2 }`；`warmth += 4`；log 一条。离店：跨日检查 `leaveDay <= day` 即移除（`ARCHITECTURE.md §4.3` 第 4 步）。

### 5.5 `cook(state, { recipeId, guestId }, rand = Math.random): Envelope` 【R2 追加 rand、厨房已建检查】

| 前置（按序） | 失败码 |
| --- | --- |
| recipe 存在且 `buildingId === "kitchen"` | `village.not_kitchen` |
| `buildings.kitchen?.built`【R2】（UI 须在未建时隐藏做菜按钮，Opus-4） | `village.not_built` |
| `spendInv(inputs)` 成功 | `village.food_short` |

成功（`dark = rand() < 0.08`）：

| 项 | 正常 | 黑暗料理 |
| --- | --- | --- |
| warmth | +6 | −1 |
| happiness | +3 | −2 |
| 投喂对象 favorite 命中（`guest.favorite === recipe.outputId`） | warmth 再 +8；【R2】`leaveDay += 1`（上限 `sinceDay + 4`） | 同左不适用 |
| 产物 | `inv[outputId] += outputQty` | 同左 |
| 信封 extras | `dark: false` | `dark: true` |

厨房嘉宾 buff **不作用于** `cook`（瞬时动作），只作用于 `enqueueJob` 的 kitchen 工单（§4.2）。

### 5.6 `build(state, { buildingId }): Envelope`

| 前置（按序） | 失败码 |
| --- | --- |
| 建筑定义存在 | `village.building_unknown` |
| 未建过 | `village.already_built` |
| `meta.level >= def.unlockLevel` | `village.level_low` |
| 资源类花费（coin/pearl/shovel/axe/saw 走 `resources`）足够 | `village.res_short` |
| 库存类花费（其余 itemId 走 `inv`，如客房要 cloth）足够 | `village.inv_short` |

成功：扣两类花费；`buildings[id] = { built: true, slots: [], slotCount: def.slots ?? 0 }`；`def.kind === "pop"` → `pop += 1`；`kind === "cap"` → `popCap += 4`；log 一条。

### 5.7 `petPlay(state, { petId }, nowMs = Date.now()): Envelope` 【R2 追加 nowMs】

| 前置 | 失败码 |
| --- | --- |
| pet 存在 | `village.pet_missing` |
| `readyAt <= nowMs` | `village.pet_rest` |

成功：`coin += 3`、`happiness += 1`、`readyAt = nowMs + 20_000`（真实 ms，时基 B）、log 一条。

### 5.8 `stallSell(state, { itemId, qty = 1 }): Envelope`

| 前置 | 失败码 |
| --- | --- |
| `buildings.stall?.built` | `village.stall_missing` |
| `inv[itemId] >= qty` | `village.stock_short` |

成功：`inv[itemId] -= qty`；`coin += round((PRICES[itemId] ?? 8) * qty * 1.15)`。
【R2】`PRICES` 来自新模块 `src/data/prices.js`（Fable-3，见 §9）；现状扁平 8 金是占位。

### 5.9 `tickVillage(state): State` — 节拍

当前实现 = `refreshWishes(state)`；【R2】= 心愿计时补位（§5.1）。嘉宾离店在 reducer 的 crossedDay 步处理，不在此。

## 6. Action ↔ 函数映射（rootReducer 的 route 表）

| action.type | payload schema | 调用 | 备注 |
| --- | --- | --- | --- |
| `farm/till` | `{ plotId }` | `till` | 【R2】直接 `applyResult(state, till(...))` |
| `farm/plant` | `{ plotId, cropId }` | `plant(state, p, now)` | |
| `farm/harvest` | `{ plotId }` | `harvest` | |
| `farm/expand` | `{}` | `expandPlot(state)` | |
| `prod/enqueue` | `{ buildingId, recipeId }` | `enqueueJob(state, p, now)` | |
| `prod/collect` | `{ buildingId, slot }` | `collectJob` | slot 传 job.id |
| `prod/feed` | `{ buildingId, slot }` | `feedAnimal(state, p, now)` | |
| `prod/unlock` | `{ buildingId }` | `unlockSlot` | |
| `village/wish` | `{ wishId }` | `acceptWish` | 预留 no-op |
| `village/deliver` | `{ wishId }` | `deliverWish` | |
| `village/invite` | `{ guestId }` | `inviteGuest` | |
| `village/cook` | `{ recipeId, guestId }` | `cook` | |
| `village/build` | `{ buildingId }` | `build` | |
| `village/pet` | `{ petId }` | `petPlay(state, p, now)` | |
| `village/stall` | `{ itemId, qty }` | `stallSell` | 【R2】reducer 接线（现缺） |
| `meta/tick` | `{ dt, now? }`（now 缺省 `Date.now()`） | `ARCHITECTURE.md §4.3` 管线 | 唯一节拍入口 |
| `meta/offline` | `{ savedAt, now }` | `applyOfflineCatchup` | 启动时一次 |
| `meta/mute` | `{}` | `meta.muted` 取反 | |
| `meta/seed` | `{ cropId }` | 写 `ui.seed` | |
| `meta/settings` | `{ hourMs?, tutorialStep? }` | 白名单校验后写 meta；非法值忽略返回原 state | |
| `meta/save` `meta/load` | — | **保留字**：组合根直接调 `writeSave`/`replace`，不进 reducer | |
| `meta/replace` | — | `store.replace` 内部派发，reducer 勿处理 | |

reducer 对未知 type **必须**返回原 state 引用（静默）。

## 7. 错误码总表（= `core/reasons.js` 的 `REASONS`；message 沿用现有中文文案）

| reason | message | 抛出者 |
| --- | --- | --- |
| `core.inv_short` | 材料不够 | spendInv |
| `farm.plot_not_found` | 这块地不存在 | till/harvest |
| `farm.till_invalid` | 这块地不用开垦 | till |
| `farm.crop_unknown` | 没有这种作物 | plant |
| `farm.plot_unavailable` | 这块地还不能种 | plant |
| `farm.coin_short` | 金币不够买种子 | plant |
| `farm.not_ready` | 还没熟 | harvest |
| `farm.pop_short` | 人手不够，先盖房子 | expandPlot |
| `farm.expand_cost` | 扩建要 40 金币和 1 把锹 | expandPlot |
| `prod.recipe_mismatch` | 配方不对 | enqueueJob |
| `prod.not_built` | 还没建这座作坊 | enqueueJob/feedAnimal/unlockSlot |
| `prod.level_low` | 小镇等级不够 | enqueueJob |
| `prod.slots_full` | 生产位满了 | enqueueJob/feedAnimal |
| `prod.input_short` | 原料不够 | enqueueJob |
| `prod.job_not_found` | 没有这单活 | collectJob |
| `prod.job_running` | 还在忙 | collectJob |
| `prod.no_livestock` | 这里不养牲口 | feedAnimal |
| `prod.feed_short` | 饲料不够 | feedAnimal |
| `prod.slot_max` | 已经满了 | unlockSlot |
| `prod.coin_short` | 金币不够 | unlockSlot |
| `village.wish_missing` | 心愿不见了 | deliverWish |
| `village.wish_short` | 东西还没收齐 | deliverWish |
| `village.guest_unknown` | 村里没这个人 | inviteGuest |
| `village.guest_present` | 已经在屋里坐着 | inviteGuest |
| `village.level_low` | 小镇等级不够 | inviteGuest/build |
| `village.guest_full` | 客堂坐满了 | inviteGuest |
| `village.not_kitchen` | 厨房不会做这个 | cook |
| `village.not_built` | 厨房还没建 | cook |
| `village.food_short` | 食材不够，别让客人饿着 | cook |
| `village.building_unknown` | 没有这种建筑 | build |
| `village.already_built` | 已经有了 | build |
| `village.res_short` | 建材或金币不够 | build |
| `village.inv_short` | 库存不够 | build |
| `village.pet_missing` | 它跑去田埂了 | petPlay |
| `village.pet_rest` | 它还想再躺会儿 | petPlay |
| `village.stall_missing` | 摊位还没支起来 | stallSell |
| `village.stock_short` | 货不够 | stallSell |

## 8. 嘉宾 buff 应用点（恰好 4 处，公式即规格）

| target | 嘉宾/系数 | 应用函数（唯一） | 时机 | 公式 |
| --- | --- | --- | --- | --- |
| `farm` | 林婶 0.85 | `plant` | 播种瞬间快照进 doneAt | `grow = round(growMs * bf("farm") / seasonFactor)` |
| `kitchen` | 灶台叔叔 0.8 | `enqueueJob`（仅 `buildingId === "kitchen"`） | 入队瞬间快照进 doneAt | `timeMs = round(recipe.timeMs * bf("kitchen"))` |
| `wish` | 灯哥 0.85 | `refreshWishes` 计时 | 计算下次补位时间 | `interval = round(120 * bf("wish"))` 游戏分钟 |
| `livestock` | 竹仔 1.1 | `feedAnimal` | 投喂瞬间快照进 job.qty | 余数累积：`acc += bf−1; qty = 1 + floor(acc); acc −= floor(acc)` |

`bf = buffFactor(state, target)`（core/buffs.js，多嘉宾连乘、钳 [0.5, 2]）。**除这 4 处外任何代码不得读 `guest.buff`**；`cook` 的 favorite 加成走 `guest.favorite`，不属 buff 体系。

## 9. 新增待实现模块清单（本文即规格，实现不再讨论）

| 模块 | 导出 | 所有者 |
| --- | --- | --- |
| `src/data/levels.js` | `XP_TABLE = [0,40,100,180,280,420,600,820,1100,1450]`、`levelForXp(xp)`、`xpForNext(level)`（满级 `Infinity`） | Fable-3 |
| `src/data/prices.js` | `PRICES: Record<itemId, int>`；建议定价 ≈ `round(直接材料成本 × 1.6 + timeMs/2000)`，缺省回退 8 | Fable-3 |
| `src/data/wishes.js` 追加 | `WISH_REFRESH_MIN = 120` | Fable-3 |
| `src/core/buffs.js` | `buffFactor(state, target)` | Opus-4 |
| `src/core/reasons.js` | `REASONS`（§7 全表）、`msg(code)` | Opus-4 |
| `src/core/engine.js` 追加 | `OFFLINE_CAP_MS`、`absGameMinutes`、`applyOfflineCatchup` | Opus-4 |
| `src/core/save.js` 追加 | `SAVE_VERSION`、`MIGRATIONS`、`hydrate` | Opus-4 |
| `src/systems/farm/` 追加 | `wiltOffSeason(state)` | Opus-1 |

## 10. 现状 → 契约差异清单（Round 2 工单，按所有者分组）

| # | 差异（现状 → 契约） | 所有者 |
| --- | --- | --- |
| 1 | `collectJob` 畜牧 job 崩溃（`recipeById(动物id)` undefined）→ §4.3 分支 + 畜牧 XP | Opus-2 |
| 2 | `feedAnimal` 无槽位上限、无冬季 +20%、无产量 buff → §4.4 | Opus-2 |
| 3 | `plant/enqueueJob/feedAnimal/petPlay` 内嵌 `Date.now()` → 末位 `nowMs` 参数 | Opus-1/2/3 |
| 4 | `cook` 内嵌 `Math.random()` → 末位 `rand` 参数；补厨房已建检查 | Opus-3 |
| 5 | `till` 裸 state 返回 → 信封（与 main.js 接线联动） | Opus-1 + Opus-4 |
| 6 | 中文 reason → 机器码 + `REASONS` 表（§7） | Opus-1/2/3/4 |
| 7 | 心愿瞬间补满 → 2 游戏时计时补位 + `maxLevel` 过滤修复 + 灯哥 buff | Opus-3 |
| 8 | 嘉宾 buff 全部未接线 → §8 四点 | Opus-1/2/3 |
| 9 | `LEVELS` 硬编码 main.js → `data/levels.js` | Fable-3 + Opus-4 |
| 10 | 无离线补偿 → `meta/offline` + `applyOfflineCatchup`（8h 封顶） | Opus-4 |
| 11 | 无 `hydrate`/`MIGRATIONS` → §2.2/2.3 | Opus-4 |
| 12 | `village/stall`、`village/wish`、`meta/offline`、`meta/settings` 未接 reducer | Opus-4 |
| 13 | 摊位扁平 8 金 → `data/prices.js` | Fable-3 + Opus-3 |
| 14 | 嘉宾无离店/容量/等级门槛 → §5.4 | Opus-3 |
| 15 | 换季不枯萎 → `wiltOffSeason` + tick 管线第 3 步 | Opus-1 + Opus-4 |
| 16 | `plant` 死代码（spendInv 试探块）清理 | Opus-1 |
| 17 | 心愿掉落（珍珠 3% / 工具 10%）未实现 → §5.3 | Opus-3 |
| 18 | 边界静态测试（无 DOM/Date.now/Math.random 于 systems） | GPT-sol-1 |
