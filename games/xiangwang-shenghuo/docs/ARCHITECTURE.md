# 架构（实施级 · Round 2 定稿）

> 本文与 `API_CONTRACT.md` 共同构成实现契约。基准 = **`4b97e21` 提交的落地代码**（Round 1 收尾 + Round 2 首波并行落地：冬饲/作物门槛/温室地块制/心愿过滤/家具/确定性 id）。与 Round 1 契约草案冲突之处，本版一律以落地代码为准重新裁决；被废弃的旧条目集中列在 `API_CONTRACT.md §10.3`，不再散落。Round 2 变更点标 `【R2】` 并指名所有者（见 `OWNERSHIP.md`）。

## 0. 铁律（六条，违反即打回）

| # | 铁律 | 检查方式 | 现状 |
| --- | --- | --- | --- |
| 1 | 单一 store。系统模块（`src/systems/**`）是纯函数，**禁止**触碰 `document` / `window` / `localStorage` / Audio / import 任何 `src/ui/**`、`src/audio/**` | 边界静态测试（R2-20） | ✅ 全部合规 |
| 2 | 命令函数一律返回信封 `{ ok, reason, message?, state, ...extras }`；节拍/查询返回裸值。跨模块边界禁止返回裸 patch | 单测断言返回形状 | ⚠️ 唯一例外 `farm.till` 返回裸 state（R2-10 信封化） |
| 3 | 时间与随机必须可注入：末位默认参数 `nowMs = Date.now()`，或 payload 内 `now` / `rng` 字段（village 落地惯例）。函数体内不得直接调用 `Date.now()` / `Math.random()`（默认参数位除外）；未注入 rng 时允许用 `village/rng.js` 的状态派生哈希（天然确定） | 边界静态测试（R2-20） | ✅ 全部合规（production 首波已补 nowMs 并去掉 `makeJobId` 的 Math.random） |
| 4 | 失败路径必须返回**传入的同一个 state 引用**（`state` 字段 `===` 入参），不得部分改写 | `expect(r.state).toBe(s)` | ✅ |
| 5 | state 必须 JSON 可序列化：无函数 / Date / Map / Set / NaN / Infinity / undefined 值 | 存档 roundtrip 测试 | ✅ |
| 6 | 数值唯一事实源在 `src/data/**`。`GDD.md` 的表格只是镜像，冲突时以 data 为准 | code review | ⚠️ 等级表仍在 `core/engine.js`（R2-3 移入 `data/levels.js`） |

## 1. 目录与所有权

```
games/xiangwang-shenghuo/
├─ src/main.js              组合根：reducer + 启动 + 循环 + 键盘 + 存档定时（Opus-4）
├─ src/core/                store / engine / save / events(冻结)；【R2】+ buffs / reasons（Opus-4）
├─ src/data/                crops/animals/recipes/buildings/guests/wishes/items/dishes/furniture；【R2】+ levels（Fable-3）
├─ src/systems/farm/        开垦、播种、生长、收获、枯萎、扩地、离线折算（Opus-1）
├─ src/systems/production/  工厂队列、畜牧投喂、工位（Opus-2）
├─ src/systems/village/     心愿、嘉宾、烹饪、建造、宠物、摊位、rng.js；【R2】+ 家具（Opus-3）
├─ src/ui/screens.js        骨架 + 增量渲染 + 事件委托（Opus-4）
├─ src/styles/  src/audio/  四季皮肤与音效（Fable-2 / Opus-4）
├─ tests/                   vitest 6 个文件（GPT-sol-1）
└─ scripts/                 probe / bench / chain-smoke / offline-smoke / wish-board（GPT-sol-2）
```

## 2. 数据流（落地版，唯一环路）

```
用户输入(ui data-act 委托 → handlers)          rAF 循环(main.js, 累积 ≥100ms)
        │dispatch(action)                        │dispatch({type:"meta/tick",payload:{dt}})
        ▼                                        ▼
   store.dispatch ──► reducer = try { applyAction } catch { 记错 + 飘字 }
        │  applyAction: action.type 分派（映射表 = API_CONTRACT.md §6）
        │  命令失败 → toast 写入 ui.toast（不进 log）；成功 → withFx 写 ui.fx
        ▼
   next !== state ? 通知订阅者 : 静默
        ▼
   订阅者只置 dirty 标记 → rAF 帧内 paint()（增量渲染 §8）+ 音效（读 ui.fx）
```

- 事件通道只有一个：`store.subscribe`。`core/events.js` 的 `createBus` 冻结导出但**禁止用于游戏逻辑**。
- 副作用（`writeSave`、WebAudio、rAF、键盘监听）只出现在 `main.js` 与 `src/ui/**`；reducer 与系统函数零副作用。
- 失败呈现裁决（改自 Round 1 草案）：命令失败**只飘字**（`ui.toast`），不写 `state.log`；`log` 留给成功事件与村里闲话。`toast` 文案取 `result.message || msg(result.reason)`（双读期见 `API_CONTRACT.md §0.2`）。
- 异常兜底：`applyAction` 抛错时 reducer 捕获——`meta/tick` 返回原 state，其余动作飘“刚才那下没成”；同一 action.type 只 console.error 一次。

## 3. Store 与 reducer

### 3.1 `createStore(initial, reducer)`（现状即契约）

| API | 语义 |
| --- | --- |
| `getState()` | 返回当前 state（调用方只读） |
| `dispatch(action)` | reducer 返回值 truthy 且 `!== state` 才替换并通知；返回最新 state |
| `subscribe(fn)` | `fn(state, action)`，返回取消函数 |
| `replace(next)` | 整体替换，派发 `{ type: "meta/replace" }`（当前无调用方，保留） |
| 构造时 | `structuredClone(initial)`——读档对象与 store 内部状态隔离 |

### 3.2 patch vs nextState：裁决（不变）

| 位置 | 允许形式 |
| --- | --- |
| 系统命令函数返回值 | 完整 nextState（包在信封 `state` 字段里） |
| 节拍函数（`tick*` / `catchUp*`）返回值 | 完整 nextState（裸返回） |
| 模块内部 | `merge(state, patch)` 顶层浅合并；嵌套对象手工展开 |
| reducer 返回值 | 完整 nextState 或原 state 引用（= 不通知订阅） |

### 3.3 reducer 结构（落地版，取代旧“三段式”）

Round 1 草案的 `route/applyResult/finalize` 三段管线**作废**，落地形态为：

| 组件 | 职责 |
| --- | --- |
| `applyAction(state, action)` | 按 type 分派到系统函数；未知 type 返回原 state 引用（**必须**） |
| `applyResult(state, result, fxKind)` | `result.ok === false` → `toast(message/reason)`；成功 → 采用 `result.state` 并写 `ui.fx` |
| `advanceTutorial(state, minStep)` | 引导只前进不后退；播种/收获等动作成功时推进 |
| 等级重算 | 仅在 `meta/tick` 分支末尾：`level = levelFor(meta.xp)`，升级时加 log + fx。**裁决**：等级派生允许滞后至多一个 tick（≤100ms 真实），系统内等级门槛判定读 `meta.level` 即可，不需要 finalize 每 dispatch 重算 |

## 4. 时钟

### 4.1 双时基（最重要的一张表）

| 时基 | 载体字段 | 驱动 | 使用者 |
| --- | --- | --- | --- |
| A. 游戏日历 | `meta.gameMinutes`（0–1439）、`meta.day`（1 起）、`meta.season` | `advanceTime(state, dtMs)` 按 `dtMs / hourMs * 60` 累加 | 昼夜氛围、季节判定、嘉宾停留（按 day）、心愿过期（按 day）、温馨日衰减 |
| B. 绝对纪元 ms | `EPOCH_FIELDS` 清单（§4.4） | 命令注入的 `nowMs` 快照 | 作物生长/枯萎、生产队列、宠物 CD、心愿补位计时 |

规则：新计时字段必须二选一并登记。选 B 的必须加入 `EPOCH_FIELDS` 并声明离线语义。Round 1 草案的 `absGameMinutes` 换算**作废**（心愿计时已落地为纪元 ms，无使用方）。

### 4.2 常量（改值即改这里）

| 常量 | 值 | 位置 | 含义 |
| --- | --- | --- | --- |
| `HOUR_MS_DEFAULT` | `6000` | core/engine | 1 游戏时 = 6s 真实（设置可改 3000/12000，R2-15 接线） |
| `DAY_HOURS` / `DAYS_PER_SEASON` | `24` / `7` | core/engine | 1 日 ≈ 144s；1 季 ≈ 16.8min，春夏秋冬循环 |
| `TICK_MS` | `100` | main.js | rAF 累积 ≥100ms 才派发一次 `meta/tick` |
| 帧 dt 钳制 | `500` ms | main.js | `dt = min(500, now - last)`，卡顿不补时 |
| `AUTOSAVE_MS` | `15_000` | main.js | 定时写档；另有 `visibilitychange:hidden` 与 `pagehide` 立即写（已落地 ✅） |
| `WILT_GRACE_MS` | `45_000` | farm | 错季枯萎宽限（真实 ms） |
| `OFFLINE_CAP_MS` | `28_800_000` | farm 本地【R2-2】上收 core/engine | 离线折算上限 = 8 真实小时（farm 改 import 去重） |
| `WISH_REFRESH_HOURS` | `2` | village | 心愿补位间隔 = 2 游戏时 × hourMs × wish buff |
| `PET_COOLDOWN_MS` | `20_000` | village | 摸宠物 CD |

### 4.3 `meta/tick` 管线（顺序固定，禁止重排）

| 步 | 调用 | 说明 |
| --- | --- | --- |
| 1 | `advanceTime(state, dt)` | 只动 meta 三字段；跨多日循环内自处理。返回的 `crossedDay/crossedSeason` 当前**丢弃**——日结改由第 4 步 `rolloverDays` 用 `village.lastDay` 自检（对离线大跨度天然健壮），换季呈现由 UI 读 `meta.season` |
| 2 | `tickPlots(state, dt, now)` | ① growing 且 `now >= doneAt` → ready；② 当季清 `wiltAt`，错季起算/推进 `wiltAt`，超时 → wilted。【R2-17】枯萎时补一条 log |
| 3 | `tickProduction(state, dt, now)` | running 到期转 done；顺带清旧档 `collected` 残单 |
| 4 | `tickVillage(state, dt, nowMs)` | `rolloverDays`（嘉宾离店 + 心愿 3 日过期 + 温馨每日 −1）→ `refillWishSlot`（补位计时，`API_CONTRACT.md §5.10`） |
| 5 | 等级重算 | `levelFor(meta.xp)`；升级 → log + fx |

【R2-18】`meta/tick` 的 payload 增加可选 `now`，管线透传 `payload.now ?? Date.now()`，使 reducer 级重放可确定（现状第 2–4 步各自默认 `Date.now()`）。

跨季不做一次性批量枯萎：错季惩罚完全由 `tickPlots` 的 `wiltAt` 宽限机制持续处理。

### 4.4 离线补偿（R2-2，语义唯一；farm 的 `catchUpPlots` 已落地 ✅，编排与接线缺失）

启动流程（`main.js`，落地后取代现状的“直接开跑”）：

```js
const loaded = readSave();
const store = createStore(loaded?.state || createInitialState(), reducer);
if (loaded) store.dispatch({ type: "meta/offline", payload: { savedAt: loaded.savedAt } });
store.dispatch({ type: "meta/tick", payload: { dt: 0 } });
```

算法（`core/engine.js` 新增 `applyOfflineCatchup`，精确签名见 `API_CONTRACT.md §2.2`）：

| 步 | 操作 | 公式 / 语义 |
| --- | --- | --- |
| 1 | 计流逝 | `elapsed = max(0, nowMs - savedAt)`；`savedAt` 非有限数 → 原样返回 `{ state, offlineMs: 0, capped: false }` |
| 2 | 封顶 | `effective = min(elapsed, OFFLINE_CAP_MS)`；`capped = elapsed > effective` |
| 3 | 推进日历 | `advanceTime(state, effective)`——上限只作用于游戏日历 |
| 4 | 农田结算 | `catchUpPlots(state, savedAt, nowMs)`：作物照常成熟（doneAt 为绝对时间戳）；离线不判枯萎，`wiltAt > savedAt` 的顺延为 `≥ nowMs + WILT_GRACE_MS` 重新起算（已落地语义，原样采用） |
| 5 | 生产/村落结算 | `tickProduction(state, effective, nowMs)` → `tickVillage(state, effective, nowMs)`（rolloverDays 自动处理离线跨日的嘉宾离店/心愿过期/温馨衰减；nextWishAt 过期则补 1 单，板空则补满） |
| 6 | 汇报 | log 追加一条离线摘要（capped 时注明“按 8 小时结算”）；返回 `{ state, offlineMs: effective, capped }` |

不做时间戳重排（+shift）：B 时基计时器都是一次性的（收取/再投喂/再播种都要玩家操作），自然到期即可；唯一会惩罚玩家的 `wiltAt` 用“离线赦免 + 回来重算”。

`EPOCH_FIELDS`（v2 登记表；新 B 时基字段必须补进此表并声明离线语义）：

| 字段 | 离线语义 |
| --- | --- |
| `plots[].plantedAt` / `plots[].doneAt` | 自然到期（照常成熟） |
| `plots[].wiltAt` | 赦免：顺延为 `nowMs + WILT_GRACE_MS`（catchUpPlots） |
| `jobs[].doneAt` | 自然到期（转 done 等收取） |
| `pets[].readyAt` | 自然到期（CD 20s，必然可摸） |
| `village.nextWishAt` | 自然到期（回来后按 refillWishSlot 规则补位） |
| `ui.toast.at` | 易变视图态，写档时置 null，不参与离线 |

数值示例（默认 `hourMs = 6000`）：

| 离线真实时长 | offlineMs | 游戏日历前进 | 结果 |
| --- | --- | --- | --- |
| 30 min | 30 min | 12.5 游戏日 | 到期作物/工单转 ready/done；心愿补位；嘉宾按 untilDay 离店；枯萎倒计时顺延 |
| 8 h | 8 h | 200 游戏日 | 同上；季节按最终日期取模 |
| 24 h | **8 h**（封顶） | 200 游戏日 | `capped = true`；日历只走 8h 等量，B 时基计时器仍自然到期 |

## 5. 存档 v1 与迁移

### 5.1 载体（落地 ✅）

| 项 | 值 |
| --- | --- |
| 介质 / key | `localStorage` / `SAVE_KEY = "xwsh.save.v1"`（key 内 v1 指格式族，版本迁移不改 key） |
| 文档结构 | `{ "v": 1, "savedAt": <epoch ms>, "state": <State v1> }`（`tests/save.test.js` 冻结此形状） |
| serialize 特例 | `ui.toast` / `ui.fx` 落盘前置 null（瞬时视图态不回放） |
| 写档时机 | 15s 定时 + “记下这一天”按钮/S 键 + `visibilitychange:hidden` + `pagehide` |
| 读档时机 | 仅启动一次：`readSave` → `deserialize`（内部 `hydrate`）→【R2-2】`meta/offline` |
| 坏档兜底 | JSON 解析失败 / `v !== 1` / 无 state → 返回 null，新开局，零报错（落地 ✅） |

### 5.2 迁移管线（Opus-4，R2-16）

```js
export const SAVE_VERSION = 1;   // 当前结构版本；deserialize 改为接受 1..SAVE_VERSION
const MIGRATIONS = {
  // [fromV]: (doc) => doc'，必须把 v 提到 fromV+1
};
```

版本纪律：

| 变更类型 | 动作 |
| --- | --- |
| 新增字段（如 `production.winterFeedCarry`、`furniture`） | 不升版本，`hydrate` 填默认值（默认值表 = `API_CONTRACT.md §2.3`，新字段一律在该表登记） |
| 字段改名 / 改形状 / 删除 | `SAVE_VERSION += 1`，写 `MIGRATIONS[旧版]`，禁止在系统代码里长期兼容旧形状 |
| 任何情况 | `serialize` 永远写 `v: SAVE_VERSION` |

注：`guests[].leaveDay → untilDay` 的改名发生在字段落盘前，无旧档存量，不升版本；`guestUntil` 的 `sinceDay + 2` 回退在 hydrate 补齐后（R2-16）即可移除。

## 6. 等级与 XP（单一事实源）

| 项 | 裁决 |
| --- | --- |
| 现状 | `core/engine.js` 导出 `LEVELS = [0,40,100,180,280,420,600,820,1100,1450]`、`levelFor(xp)`、`levelProgress(xp)`；main.js 与 screens.js 从 engine import |
| 目标（R2-3） | 新模块 `src/data/levels.js`（Fable-3）持有 `XP_TABLE` 与派生函数（精确签名 `API_CONTRACT.md §2.4`）；`core/engine.js` 改为薄再导出（`LEVELS = XP_TABLE`、`levelFor = levelForXp`、`levelProgress`），main.js/screens.js **不改 import**——这是等级表的双读期，UI 迁移 import 后删再导出 |
| 派生规则 | `meta.level` = `levelForXp(meta.xp)`，由 `meta/tick` 第 5 步重算（滞后 ≤1 tick，见 §3.3 裁决）；任何系统禁止手写 `meta.level` |
| XP 授予点 | 收获 `crop.xp` ✅；心愿 `wish.xp`（含 tier 缩放）✅；生产收取 `job.xp`（快照 → recipe.xp → animal.xp 回退链 ✅） |
| 解锁判定 | 一律读 data，全部生效 ✅：`building.unlockLevel` / `recipe.unlockLevel` / `crop.unlockLevel`（plant + `canPlant` 查询）/ `wish.minLevel·maxLevel`（wishCandidates）/ `furniture.unlockLevel`（placeFurniture） |

## 7. 嘉宾 buff 架构

| 原则 | 内容 |
| --- | --- |
| 数据源 | `data/guests.js` 的 `buff: { target, factor }`；target 全集 = `farm / kitchen / wish / livestock / stall / weavery`（6 个，Round 1 草案“恰好 4 处”作废） |
| 计算器（R2-4） | `core/buffs.js` 的 `buffFactor(state, target)`：在座嘉宾匹配 target 的 factor **连乘**，钳 `[0.5, 2]`；无匹配 = 1。精确签名 `API_CONTRACT.md §2.2` |
| 过渡期 | 三个系统的本地实现**口径已统一** ✅（首波落地：均为连乘 + 钳 [0.5, 2]）：farm `applyGuestFarmBuff`、production 内部 `guestBuffFactor`、village 导出 `guestBuffFactor`。R2-4 剩余工作 = `core/buffs.js` 落地后三处改薄封装（纯去重），导出名保留（api.test 冻结） |
| 快照原则 | buff 在动作发生瞬间读取并固化进时长/数量/概率（种植时长、工单 doneAt、投喂 qty、翻车率）。嘉宾中途离店不回溯已开始的计时。**禁止**在 tick 里每帧读 buff 重算 doneAt |
| 应用点 | 恰好 7 处，公式逐条见 `API_CONTRACT.md §8`；除该表外任何代码不得读 `guest.buff`。`cook` 的 favorite 加成走 `guest.favorite`，不属 buff 体系 |

## 8. UI 边界

### 8.1 import 允许矩阵（行 = 谁，列 = 可 import 什么）

| | `core/store` | `core/save` | `core/engine` | `core/buffs·reasons` | `data/**` | `systems/**` | `ui/**` | `audio/**` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `main.js`（组合根） | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `ui/**` | ❌ | ❌ | ✅ 只读（levelProgress、TUTORIAL_TOTAL） | ✅ 只读 | ✅ 展示用 | ❌ | ✅ | ❌ |
| `systems/**` | ✅ 纯助手 | ❌ | ✅ 常量 | ✅ | ✅ | ⚠️ 禁互引 | ❌ | ❌ |
| `data/**` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

### 8.2 渲染契约（落地版，取代“整屏 innerHTML”旧描述）

| 机制 | 规则 |
| --- | --- |
| 骨架 | `mount(root)` 一次性注入 SKELETON，`data-ref` 建引用表；后续只更新面板 |
| 增量更新 | `setHtml(node, html)` 按签名（`node.__sig`）比对，内容不变不重建——按钮不会在按下与抬起之间被换掉 |
| 每帧通道 | 进度条与倒计时**不写进 HTML**：`data-prog` / `data-time` 节点每帧直接改 style/textContent |
| 事件 | 根节点一个 click 委托，按 `data-act` 分派到 handlers；handlers 由 main.js 注入，内部只 dispatch + 读 getState 做参数补全 |
| 逻辑禁区 | UI 不计算游戏逻辑（能否收获只读 `plot.status`；能否建造可读 data 做按钮置灰，最终裁决在系统函数） |
| 失败呈现 | 读 `ui.toast` 渲染飘字；不 try/catch 游戏逻辑 |
| 音效 | 依据 `ui.fx = { kind, n }` 信号（n 递增去重），main.js 的 `playFx` 消费；Round 1 草案“读 action.type 发声”作废；系统层禁止发声 |
| 引导 | `meta.tutorialStep`（0–4），`TUTORIAL_TOTAL = 4`；只前进不后退，跳步操作也算完成 |

## 9. 确定性与测试策略

| 手段 | 规则 |
| --- | --- |
| 时间注入 | farm：末位 `now = Date.now()` ✅；village：`refreshWishes/tickVillage` 末位 `nowMs` ✅、`petPlay` 走 payload `now` ✅（落地惯例，保持不改）；production：`enqueueJob/feedAnimal` 末位 `nowMs` ✅ |
| 随机注入 | village 全域用 `rng.js`：`rollWith(rng, ...parts)`——注入了 `rng`（payload 字段）用注入的，否则由状态派生 FNV 哈希，**同一存档同一时刻结果恒定**。测试传 `() => 0.99` 等定值。production 的 `makeJobId` 已确定性（nowMs 进制串 + 线性探测防撞）✅——`systems/**` 现已零内嵌时钟/随机 |
| 余数累积器 | 分数收益不用随机：`production.livestockCarry`（✅ 按 productId 分桶，ε=1e-9）与 `production.winterFeedCarry`（✅ 冬饲 0.2/次记账）累积小数、溢出取整，长期期望精确等于系数 |
| 必测不变量 | ① 失败信封 `state === 入参`；② resources/inv 恒非负；③ tick 后 `meta.level === levelFor(meta.xp)`；④ `deserialize(serialize(s))` 深等于 `{savedAt, state}`；⑤ 离线 24h → `offlineMs === OFFLINE_CAP_MS`（R2-2 后）；⑥ 三链可跑通（米→鸡、豆→豆腐、麦→面包，chain-smoke ✅）；⑦ xp 单调不减；⑧ 同一存档同一参数的 `cook`/`deliverWish` 结果确定 |
| reason 断言 | 双读期规则见 `API_CONTRACT.md §0.2`——测试经 `expectReason` 助手同时接受机器码与中文，迁移完成后收紧为只认机器码 |
| 边界静态测试（R2-20） | `systems/**` 源码禁含 `document.`、`localStorage`、内嵌 `Math.random(` / `Date.now()`（默认参数位除外）——前置违规已清零，随时可落 |

## 10. 性能预算

| 指标 | 预算 | 现状 |
| --- | --- | --- |
| 纯逻辑 tick | < 2 ms（`npm run bench` 断言） | ✅ 0.0004 ms/tick 量级 |
| log 长度 | ≤ 40 条（各系统 pushLog 处截断） | ✅ |
| 渲染 | 60fps @ 1280 与 390 宽 | ✅ 架构上已解决：dirty 标记 + rAF 合帧 + `setHtml` 签名比对 + data-prog/data-time 每帧通道（Round 1 的“逐帧全量 innerHTML”问题已被 `548e6c6` 修复）；实测录制走 `SOTA_CHECKLIST.md` B1 |
| 存档体积 | < 32 KB | ✅ plots/jobs 有上限，天然封顶 |
