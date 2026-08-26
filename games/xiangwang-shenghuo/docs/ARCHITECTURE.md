# 架构（实施级 · Round 3 终稿）

> 本文与 `API_CONTRACT.md` 共同构成实现契约。基准 = **HEAD `12a0312` 的落地代码**（Round 3 两波收官：第一波 `337bc37` 探针口径、`cdbdf5e` 冬饲事实源 + weavery 工时 buff、`f95afa2` 离线生长封顶 + 枯萎日志 + 常量去重、`ea9ffec` 掉落校准两级保底 + 节拍补位 + 家具去重 + 翻车率 buff、`c92b795`/`74bbc8b`/`8708517` 测试解封与改口径；第二波 `228af0c` 开局工具 1/0/0 + 等级表单源化 + 时速三档 + hydrate 地块补形、`1f64876` 温室 UI 入口 + 种子门置灰 + 投喂价按钮 + queries 注入 + 收获飘字/村景剪影、`411a27e` 撤温室补罩只留形状补齐；`9ada6e4` 纯 CSS 不涉契约）。
> **本轮定性**：Round 2 工单队列已清空——逐条标 DONE / DEAD（台账 `API_CONTRACT.md §10.2`；第二波把此前判 DEAD 的 R2-3/R2-7/R2-15 翻案落地为 DONE），不再派发新工单、不再拟新迁移；落地代码即契约，残余真实缺口冻结于 `API_CONTRACT.md §11`。Round 3 落地点标 `【R3】`。

## 0. 铁律（六条，违反即打回）

| # | 铁律 | 检查方式 | 终态 |
| --- | --- | --- | --- |
| 1 | 单一 store。系统模块（`src/systems/**`）是纯函数，**禁止**触碰 `document` / `window` / `localStorage` / Audio / import 任何 `src/ui/**`、`src/audio/**`（import `src/core/**` 纯助手允许） | code review（静态哨兵测试作废，R2-20 DEAD） | ✅ 全部合规 |
| 2 | 命令函数一律返回信封 `{ ok, reason, state, ...extras }`；节拍/查询返回裸值。跨模块边界禁止返回裸 patch | 单测断言返回形状 | ✅ **唯一冻结例外**：`farm.till` 返回裸 state，前置检查在 main.js 预检（信封化工单 R2-10 DEAD，现状即契约） |
| 3 | 时间与随机必须可注入：末位默认参数 `nowMs = Date.now()`，或 payload 内 `now` / `rng` 字段（village 惯例）。函数体内不得直接调用 `Date.now()` / `Math.random()`（默认参数位除外）；未注入 rng 时用 `village/rng.js` 的状态派生哈希（天然确定） | code review + 单测 | ✅ `systems/**` 零内嵌时钟/随机 |
| 4 | 失败路径必须返回**传入的同一个 state 引用**（`state` 字段 `===` 入参），不得部分改写 | `expect(r.state).toBe(s)` | ✅ |
| 5 | state 必须 JSON 可序列化：无函数 / Date / Map / Set / NaN / Infinity / undefined 值 | 存档 roundtrip 测试 | ✅ |
| 6 | 数值唯一事实源在 `src/data/**`。`GDD.md` 的表格只是镜像，冲突时以 data 为准 | code review | ✅ **全面成立**：心愿掉落/保底/补位间隔（`data/wishes.js`）、冬饲加价（`data/animals.js`）已接线【R3】；等级表也已单源化【R3 `228af0c`】——`engine.LEVELS = data/levels.XP_TABLE`、`levelFor = levelForXp` 薄再导出（R2-3 翻案 DONE），改等级数值只改 `data/levels.js` 一处（§6） |

## 1. 目录与所有权

```
games/xiangwang-shenghuo/
├─ src/main.js              组合根：reducer + 启动 + 循环 + 键盘 + 存档定时 + queries 只读注入【R3】（Opus-4）
├─ src/core/                store / engine / save / offline / furniture / events(冻结)（Opus-4；拟议 buffs/reasons 作废）
├─ src/data/                crops/animals/recipes/buildings/guests/wishes/items/dishes/furniture/levels（Fable-3 校数，Round 3 全部接线）
├─ src/systems/farm/        开垦、播种、生长、收获、枯萎、扩地、温室地块、离线折算（Opus-1）
├─ src/systems/production/  工厂队列、畜牧投喂、工位（Opus-2）
├─ src/systems/village/     心愿、嘉宾、烹饪、建造、宠物、摊位、rng.js（Opus-3；家具已收敛 core，R3 写入端删除）
├─ src/ui/screens.js        骨架 + 增量渲染 + 事件委托 + 收获飘字/村景剪影【R3】（Opus-4）
├─ src/styles/  src/audio/  四季皮肤与音效（Fable-2 / Opus-4）
├─ tests/                   vitest 6 文件，58 过 / 1 skip（GPT-sol-1）
└─ scripts/                 probe / bench / chain-smoke / offline-smoke / wish-board，全部 ok:true（GPT-sol-2）
```

## 2. 数据流（落地版，唯一环路）

```
用户输入(ui data-act 委托 → handlers)          rAF 循环(main.js, 累积 ≥100ms)
        │dispatch(action)                        │dispatch({type:"meta/tick",payload:{dt}})
        ▼                                        ▼
   store.dispatch ──► reducer = try { applyAction } catch { 记错 + 飘字 }
        │  applyAction: action.type 分派（映射表 = API_CONTRACT.md §6）
        │  命令失败 → toast 写入 ui.toast（不进 log）；成功 → withFx 写 ui.fx（可带 {text, at} 收获飘字【R3】）
        ▼
   next !== state ? 通知订阅者 : 静默
        ▼
   订阅者只置 dirty 标记 → rAF 帧内 paint()（增量渲染 §8）+ 音效（读 ui.fx）
```

- 事件通道只有一个：`store.subscribe`。`core/events.js` 的 `createBus` 冻结导出但**禁止用于游戏逻辑**。
- 副作用（`writeSave`、WebAudio、rAF、键盘监听）只出现在 `main.js` 与 `src/ui/**`；reducer 与系统函数零副作用。
- 失败呈现（终态）：命令失败**只飘字**（`ui.toast`），不写 `state.log`；`log` 留给成功事件与村里闲话。飘字文案 = `result.reason` 原文——**reason 的中文文案本身就是冻结契约**（机器码 + message 双轨方案作废，`API_CONTRACT.md §0.2/§7`）。
- 异常兜底：`applyAction` 抛错时 reducer 捕获——`meta/tick` 返回原 state，其余动作飘「刚才那下没成」；同一 action.type 只 console.error 一次。

## 3. Store 与 reducer

### 3.1 `createStore(initial, reducer)`（冻结）

| API | 语义 |
| --- | --- |
| `getState()` | 返回当前 state（调用方只读） |
| `dispatch(action)` | reducer 返回值 truthy 且 `!== state` 才替换并通知；返回最新 state |
| `subscribe(fn)` | `fn(state, action)`，返回取消函数 |
| `replace(next)` | 整体替换，派发 `{ type: "meta/replace" }`（当前无调用方，保留） |
| 构造时 | `structuredClone(initial)`——读档对象与 store 内部状态隔离 |

### 3.2 patch vs nextState（冻结）

| 位置 | 允许形式 |
| --- | --- |
| 系统命令函数返回值 | 完整 nextState（包在信封 `state` 字段里；例外 `till` 见铁律 2） |
| 节拍函数（`tick*` / `catchUpPlots`）返回值 | 完整 nextState（裸返回） |
| 模块内部 | `merge(state, patch)` 顶层浅合并；嵌套对象手工展开 |
| reducer 返回值 | 完整 nextState 或原 state 引用（= 不通知订阅） |

### 3.3 reducer 结构（冻结）

| 组件 | 职责 |
| --- | --- |
| `applyAction(state, action)` | 按 type 分派到系统函数；未知 type 返回原 state 引用（**必须**） |
| `applyResult(state, result, fxKind, fxInfo?)` | `result.ok === false` → `toast(result.reason)`；成功 → 采用 `result.state` 并写 `ui.fx = { kind, n, ...fxInfo }`——`fxInfo` 可带 `{ text, at }`（收获在扣地前快照作物算「+2 稻谷」挂到那块地上）【R3 `1f64876`】 |
| `advanceTutorial(state, minStep)` | 引导只前进不后退；播种/收获等动作成功时推进 |
| `finalize(state)` | `meta/tick` 与 `meta/offline` 共用收尾（仅此两分支）：① `applyFurnitureWarmth`（core/furniture）把温馨兜到家具保底之上；② `level = levelFor(meta.xp)` 重算，升级时加 log + fx。**裁决不变**：等级派生允许滞后至多一个 tick（≤100ms 真实），系统内等级门槛判定读 `meta.level` 即可 |

## 4. 时钟

### 4.1 双时基（最重要的一张表）

| 时基 | 载体字段 | 驱动 | 使用者 |
| --- | --- | --- | --- |
| A. 游戏日历 | `meta.gameMinutes`（0–1439）、`meta.day`（1 起）、`meta.season` | `advanceTime(state, dtMs)` 按 `dtMs / hourMs * 60` 累加 | 昼夜氛围、季节判定、嘉宾停留（按 day）、心愿过期（按 day）、温馨日衰减 |
| B. 绝对纪元 ms | `EPOCH_FIELDS` 清单（§4.4） | 命令注入的 `nowMs` 快照 | 作物生长/枯萎、生产队列、宠物 CD、心愿补位计时 |

终裁：新计时字段必须二选一并登记；选 B 的必须入 `EPOCH_FIELDS` 并声明离线语义。`village.nextWishAt` **冻结为纪元 ms**（0 = 停表，见 §4.3 注），GDD 契约表 #13 的「迁绝对游戏分钟」**作废**。时速三档落地后（R2-15 翻案 DONE【R3 `228af0c`/`1f64876`】）此裁决不变：凡用 `hourMs` 换算的间隔（心愿补位）在**排定瞬间**按当时档位快照进纪元时刻，切档不回溯已排定的 `nextWishAt`——与 buff 快照原则（§7）同一条纪律；B 时基本身（作物/工单/宠物）按真实 ms 走，不受档位影响。

### 4.2 常量（改值即改这里）

| 常量 | 值 | 位置 | 含义 |
| --- | --- | --- | --- |
| `HOUR_MS_DEFAULT` / `HOUR_MS_CHOICES` | `6000` / `[3000, 6000, 12000]` | core/engine | 1 游戏时 = 3/6/12s 真实，三档白名单【R3 `228af0c`】。玩家入口 = 顶栏时速按钮（`meta/settings`，`nextHourMs` 循环切档）；读档过 `normalizeHourMs`（非法值回默认档）。切档只影响 A 时基与后续以 hourMs 排定的间隔，不回溯已排定时刻（§4.1） |
| `DAY_HOURS` / `DAYS_PER_SEASON` | `24` / `7` | core/engine | 1 日 ≈ 144s；1 季 ≈ 16.8min，春夏秋冬循环 |
| `TICK_MS` | `100` | main.js | rAF 累积 ≥100ms 才派发一次 `meta/tick` |
| 帧 dt 钳制 | `500` ms | main.js | `dt = min(500, now - last)`，卡顿不补时 |
| `AUTOSAVE_MS` | `15_000` | main.js | 定时写档；另有 `visibilitychange:hidden` 与 `pagehide` 立即写 |
| `WILT_GRACE_MS` | `45_000` | farm | 错季枯萎宽限（真实 ms） |
| `OFFLINE_CAP_MS` | `28_800_000` | **唯一事实源 core/engine**；farm 再导出【R3 `f95afa2`】 | 离线折算上限 = 8 真实小时 |
| `WISH_REFRESH_HOURS` | `2`（= `data/wishes.js` 的 `WISH_REFRESH_MIN = 120` ÷ 60 换算）【R3 `ea9ffec`】 | village（换算），事实源 data | 心愿补位间隔 = 2 游戏时 × hourMs × wish buff |
| `PET_COOLDOWN_MS` | `20_000` | village | 摸宠物 CD |

### 4.3 `meta/tick` 管线（顺序固定，禁止重排）

| 步 | 调用 | 说明 |
| --- | --- | --- |
| 1 | `advanceTime(state, dt)` | 只动 meta 三字段；跨多日循环内自处理。返回的 `crossedDay/crossedSeason` **丢弃**——日结由第 4 步 `rolloverDays` 用 `village.lastDay` 自检（对离线大跨度天然健壮），换季呈现由 UI 读 `meta.season` |
| 2 | `tickPlots(state, dt, now)` | ① growing 且 `now >= doneAt` → ready；② 当季清 `wiltAt`，错季起算/推进 `wiltAt`，超时 → wilted **并 pushLog 一条**【R3 `f95afa2`】 |
| 3 | `tickProduction(state, dt, now)` | running 到期转 done；顺带清旧档 `collected` 残单 |
| 4 | `tickVillage(state, dt, nowMs)` | `rolloverDays`（嘉宾离店 + 心愿 3 日过期 + 温馨每日 −1）→ `refillWishSlot`。补位计时**带停表**【R3】：板满时 `nextWishAt = 0`，空位从空出的那一刻起算——交付即补满的旧行为不会借满板过期计时借尸还魂（`API_CONTRACT.md §5.10`） |
| 5 | `finalize` | 家具温馨兜底 + 等级重算 `levelFor(meta.xp)`；升级 → log + fx |

第 2–4 步各自默认 `Date.now()`——`meta/tick` 透传 `payload.now` 的工单（R2-18）**作废**：确定性测试直接调系统函数注入时间，reducer 级重放无使用方。跨季不做一次性批量枯萎：错季惩罚完全由 `tickPlots` 的 `wiltAt` 宽限机制持续处理。

### 4.4 离线补偿（全链落地 ✅，含生长封顶【R3 `f95afa2`】）

启动流程（`main.js`——离线结算**必须**抢在首个 tick 前，否则人不在家的枯萎倒计时先被判死）：

```js
const loaded = readSave();
const store = createStore(loaded?.state || createInitialState(), reducer);
if (loaded) {
  const before = store.getState();
  store.dispatch({ type: "meta/offline", payload: { savedAt: loaded.savedAt, now: Date.now() } });
  if (store.getState() === before) /* 刚存完就刷新 → 结算无事发生 */ toast("接着上次的日子过。");
}
store.dispatch({ type: "meta/tick", payload: { dt: 0 } });
```

算法（`core/offline.js` 的 `applyOfflineCatchup(state, savedAt, nowMs, systems)`，精确签名见 `API_CONTRACT.md §2.2`；`systems` 由组合根注入 `{ catchUpPlots, tickProduction, tickVillage }`——core 不反向依赖 systems，缺哪个跳过哪步）：

| 步 | 操作 | 公式 / 语义 |
| --- | --- | --- |
| 1 | 计流逝 | `offlineSpan(savedAt, nowMs)`：`elapsed = max(0, nowMs - savedAt)`；`savedAt` 非有限数按 nowMs 处理；`offlineMs <= 0` → 原引用返回 `{ state, offlineMs: 0, capped: false }` |
| 2 | 封顶 | `offlineMs = min(elapsed, OFFLINE_CAP_MS)`；`capped = elapsed > offlineMs` |
| 3 | 推进日历 | `advanceTime(state, offlineMs)`——上限作用于游戏日历 |
| 4 | 农田结算 | `catchUpPlots(state, savedAt, nowMs)`：**生长只按封顶时刻 `effectiveNow = savedAt + offlineMs` 结算**——封顶窗口内熟不了的 growing 地块把 `plantedAt/doneAt/wiltAt` 顺延 `overflow = nowMs - effectiveNow`，回来接着长【R3】；离线不判枯萎，`wiltAt > savedAt` 的顺延为 `≥ nowMs + WILT_GRACE_MS` 重新起算（完整算法 `API_CONTRACT.md §3.10`，`offline-smoke` `ok:true` 即验收） |
| 5 | 生产/村落结算 | `tickProduction(state, offlineMs, nowMs)` → `tickVillage(state, offlineMs, nowMs)`（rolloverDays 自动处理离线跨日的嘉宾离店/心愿过期/温馨衰减；nextWishAt 过期则补 1 单，板空则补满） |
| 6 | 汇报 | `applyOfflineCatchup` 自带一条 log「你出门 N 小时…」（capped 注明「超过 8 小时的部分不另算」）；main.js 的 `meta/offline` 分支再走 `finalize` 并 toast 摘要（几块地熟了/几件活做好了） |

时间戳重排裁决（终态）：jobs/pets/心愿计时是一次性且有界的（收取/再投喂都要玩家操作），自然到期，**不**重排；农田生长会被反复利用刷进度，按 8h 封顶顺延；`wiltAt` 用「离线赦免 + 回来重算」。

`EPOCH_FIELDS`（v3 登记表；新 B 时基字段必须补进此表并声明离线语义）：

| 字段 | 离线语义 |
| --- | --- |
| `plots[].plantedAt` / `plots[].doneAt` | 封顶窗口内自然成熟；窗口外顺延 overflow ✅【R3】 |
| `plots[].wiltAt` | 先随 overflow 顺延（若 >0），再赦免为 `≥ nowMs + WILT_GRACE_MS` ✅ |
| `jobs[].doneAt` | 自然到期（转 done 等收取） |
| `pets[].readyAt` | 自然到期（CD 20s，必然可摸） |
| `village.nextWishAt` | 自然到期（回来后按 refillWishSlot 规则补位）；`0` = 停表【R3】 |
| `village.pityStep` / `village.drought`【R3 新增】 | 非时间戳计数器（工具保底），离线无语义 |
| `ui.toast.at` | 易变视图态，写档时置 null，不参与离线 |

数值示例（`hourMs = 6000`）：

| 离线真实时长 | offlineMs | 游戏日历前进 | 结果 |
| --- | --- | --- | --- |
| 30 min | 30 min | 12.5 游戏日 | 到期作物/工单转 ready/done；心愿补位；嘉宾按 untilDay 离店；枯萎倒计时顺延 |
| 8 h | 8 h | 200 游戏日 | 同上；季节按最终日期取模 |
| 24 h | **8 h**（封顶） | 200 游戏日 | `capped = true`；工单/宠物/心愿计时自然到期；8h 内熟不了的作物顺延 16h 回来接着长 ✅（`offline-smoke`：`beyondCapDeferred: true`，剩余时长逐 ms 保留） |

## 5. 存档 v1 与迁移

### 5.1 载体（冻结）

| 项 | 值 |
| --- | --- |
| 介质 / key | `localStorage` / `SAVE_KEY = "xwsh.save.v1"` |
| 文档结构 | `{ "v": 1, "savedAt": <epoch ms>, "state": <State v1> }`（`tests/save.test.js` 冻结此形状） |
| serialize 特例 | `ui.toast` / `ui.fx` 落盘前置 null（瞬时视图态不回放） |
| 写档时机 | 15s 定时 + 「记下这一天」按钮/S 键 + `visibilitychange:hidden` + `pagehide` |
| 读档时机 | 仅启动一次：`readSave` → `deserialize`（内部 `hydrate`）→ `meta/offline`（先于首个 tick） |
| 坏档兜底 | JSON 解析失败 / `v !== 1` / 无 state → 返回 null，新开局，零报错 |

### 5.2 v1 冻结纪律（取代拟议的 SAVE_VERSION/MIGRATIONS 管线，R2-16 DEAD）

`SAVE_VERSION`/`MIGRATIONS` 机制与 hydrate 逐条目归一表**作废**：hydrate 保持顶层形状合并（meta/resources/buildings 深一层，数组类原样替换，ui 与 `createInitialUi()` 合并），另加**两处窄化的写侧形状补齐**【R3 `228af0c`/`411a27e`】——`hydratePlots` 给缺 `wiltAt`/`greenhouse` 键的地块补 `0`/`false`（纯补键，非语义迁移），`meta.hourMs` 过 `normalizeHourMs` 白名单。其余缺失字段仍由**读取端防御**兜住——这是现状，也是契约：

| 潜在缺失 | 兜底位置 |
| --- | --- |
| `guests[].untilDay` | 读取端：village `guestUntil` 回退 `sinceDay + 2` |
| `jobs[].kind/qty/xp/productId` | 读取端：production `collectJob` 回退链（快照 → recipe → animal） |
| `production` / `village` / `furniture` 整键 | 读取端：各系统懒建（`productionState` / `villageMeta` / `placedFurniture` 空态兜底）；`village.pityStep/drought` 缺省 0【R3】 |
| `plots[].wiltAt` / `plots[].greenhouse` | 写侧：hydrate `hydratePlots` 补 0/false【R3】；读取端 falsy 语义（无倒计时 / 非温室）双保险 |
| `meta.hourMs` 非白名单值 | 写侧：hydrate `normalizeHourMs` 回默认档【R3】；读取端 `advanceTime` / village `\|\| 6000` 双保险 |

**温室补罩终裁**（`411a27e` 撤销，永久 DEAD）：不给「盖了温室建筑却没有温室地块」的档补罩——v1 存档没有 schema 版本号，这种档与刚花钱盖完温室、还没罩地的新档**不可区分**，补了等于白送三块地。这就是 hydrate 只许「补键」不许「补语义」的活例。

版本纪律（v1 冻结期）：**字段只增不改不删**。新增字段必须满足「读取端对 undefined 有语义化缺省」，并登记 `API_CONTRACT.md §1`；任何改名/改形状/删除都超出 v1 冻结范围，须先重启版本裁决——本轮不预设该机制（不发明用不上的迁移设施）。

## 6. 等级与 XP

| 项 | 终裁 |
| --- | --- |
| 现状（冻结） | **单源化落地**【R3 `228af0c`，R2-3 翻案 DONE】：`data/levels.js`（`XP_TABLE`/`levelForXp`/`xpForNext`）是唯一事实源；`core/engine.js` 的 `LEVELS = XP_TABLE`、`levelFor = levelForXp` 是薄再导出，`levelProgress` 基于同一张表计算。运行时消费方（main/screens）继续走 engine，导出面零变化 |
| 维护规则 | 改等级数值 = **只改 `data/levels.js` 一处** + `npm test`（economy 套件断言 XP 门槛）；旧「两处同改」规则随单源化作废 |
| 派生规则 | `meta.level` = `levelFor(meta.xp)`，由 `meta/tick` 第 5 步重算（滞后 ≤1 tick，§3.3 裁决）；任何系统禁止手写 `meta.level` |
| XP 授予点 | 收获 `crop.xp` ✅；心愿 `wish.xp`（含 tier 缩放）✅；生产收取 `job.xp`（快照 → recipe.xp → animal.xp 回退链）✅ |
| 解锁判定 | 一律读 data，全部生效 ✅：`building.unlockLevel` / `recipe.unlockLevel` / `crop.unlockLevel`（plant + `canPlant` 查询）/ `wish.minLevel·maxLevel`（wishCandidates）/ `furniture.unlockLevel`（placeFurniture） |

## 7. 嘉宾 buff 架构

| 原则 | 内容 |
| --- | --- |
| 数据源 | `data/guests.js` 的 `buff: { target, factor }`；target 全集 = `farm / kitchen / wish / livestock / stall / weavery`（6 个） |
| 计算器（终态） | **三处本地实现冻结**，口径完全一致（在座嘉宾匹配 target 的 factor 连乘，钳 `[0.5, 2]`，无匹配 = 1）：farm `applyGuestFarmBuff`、production 内部 `guestBuffFactor`、village 导出 `guestBuffFactor`。拟议的 `core/buffs.js` 单模块（R2-4 收敛项）DEAD——纯去重收益不抵三处导出面的搬动风险 |
| 快照原则 | buff 在动作发生瞬间读取并固化进时长/数量/概率（种植时长、工单 doneAt、投喂 qty、翻车率）。嘉宾中途离店不回溯已开始的计时。**禁止**在 tick 里每帧读 buff 重算 doneAt |
| 应用点 | **恰好 7 处，全部生效** ✅【R3 补齐最后两处：weavery 工时（`cdbdf5e`，enqueueJob 按 buildingId 通吃）与 cook 翻车率（`ea9ffec`）】。公式逐条见 `API_CONTRACT.md §8`；除该表外任何代码不得读 `guest.buff`。`cook` 的 favorite 加成走 `guest.favorite`，不属 buff 体系 |

## 8. UI 边界

### 8.1 import 允许矩阵（行 = 谁，列 = 可 import 什么）

| | `core/store` | `core/save` | `core/engine` | `core/offline` | `core/furniture` | `data/**` | `systems/**` | `ui/**` | `audio/**` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `main.js`（组合根） | ✅ | ✅ | ✅ | ✅（唯一消费方） | ✅ | ✅ | ✅ | ✅ | ✅ |
| `ui/**` | ❌ | ❌ | ✅ 只读（levelProgress、TUTORIAL_TOTAL） | ❌ | ✅ 只读查询（placedFurniture/isPlaced/furnitureWarmth 在用） | ✅ 展示用 | ❌ | ✅ | ❌ |
| `systems/**` | ✅ 纯助手 | ❌ | ✅ 常量（farm 的 OFFLINE_CAP_MS 再导出【R3】） | ❌（offline 编排 systems，反向即环） | ✅（village 读取端再导出在用【R3】） | ✅ | ⚠️ 禁互引 | ❌ | ❌ |
| `data/**` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

**queries 注入通道**【R3 `1f64876`】：UI 需要系统口径给按钮置灰时**仍不许 import systems**——由组合根把只读查询打包传入 `render(root, state, handlers, queries, now)`。当前注入面（冻结）：`canPlant`、`feedCost`、`isGreenhousePlot`、`greenhousePlotCount`、`greenhouseCap/greenhouseCoin/greenhouseSaw`。UI 对缺失项一律退回保守默认（种子当可种、饲料按 1 份、温室用契约常量），按钮宁可显示得笨也不撒谎；最终裁决永远在系统函数。

### 8.2 渲染契约（冻结）

| 机制 | 规则 |
| --- | --- |
| 骨架 | `mount(root)` 一次性注入 SKELETON，`data-ref` 建引用表；后续只更新面板 |
| 增量更新 | `setHtml(node, html)` 按签名（`node.__sig`）比对，内容不变不重建——按钮不会在按下与抬起之间被换掉 |
| 每帧通道 | 进度条与倒计时**不写进 HTML**：`data-prog` / `data-time` 节点每帧直接改 style/textContent |
| 事件 | 根节点一个 click 委托，按 `data-act` 分派到 handlers（【R3】新增 `cover`/`speed`）；handlers 由 main.js 注入，内部只 dispatch + 读 getState 做参数补全 |
| 逻辑禁区 | UI 不计算游戏逻辑（能否收获只读 `plot.status`；置灰口径读 data 或注入的 queries——种子门/投喂价/温室【R3】——最终裁决在系统函数） |
| 失败呈现 | 读 `ui.toast` 渲染飘字；不 try/catch 游戏逻辑 |
| 音效与飘字 | `ui.fx = { kind, n, text?, at?, tone? }` 一次性信号（n 递增去重）：main.js 的 `playFx` 消费 kind 发声；`spawnFloat` 消费 text——挂 `.xw-fx` 到 `at` 指向的地块（找不到退村景居中），须在同帧 `setHtml` 重建**之后**追加，1.2s 自收。系统层禁止发声 |
| 村景剪影【R3】 | `renderYard` 按 state 挂 `.xw-npc[data-kind]` 结点（嘉宾/宠物/已建圈舍的牲口）到 `.xw-yard`；纯挂点，观感归样式层（`ART_DIRECTION.md`） |
| 引导 | `meta.tutorialStep`（0–4），`TUTORIAL_TOTAL = 4`；只前进不后退，跳步操作也算完成 |

## 9. 确定性与测试策略

| 手段 | 规则 |
| --- | --- |
| 时间注入 | farm：末位 `now = Date.now()` ✅；village：`refreshWishes/tickVillage` 末位 `nowMs`、`petPlay` 走 payload `now`（落地惯例，冻结）；production：`enqueueJob/feedAnimal` 末位 `nowMs` ✅ |
| 随机注入 | village 全域用 `rng.js`：`rollWith(rng, ...parts)`——注入了 `rng`（payload 字段）用注入的，否则由状态派生 FNV 哈希，**同一存档同一时刻结果恒定**。测试传 `() => 0.99` 等定值。production 的 `makeJobId` 确定性（nowMs 进制串 + 线性探测防撞）✅ |
| 余数累积器 | 分数收益不用随机：`production.livestockCarry`（按 productId 分桶，ε=1e-9）与 `production.winterFeedCarry`（冬饲 0.2/次记账）累积小数、溢出取整，长期期望精确等于系数。工具保底同理用计数器：`village.pityStep`（开局序列）/ `village.drought`（旱情计数）【R3】 |
| 必测不变量 | ① 失败信封 `state === 入参`；② resources/inv 恒非负；③ tick 后 `meta.level === levelFor(meta.xp)`；④ `deserialize(serialize(s))` 深等于 `{savedAt, state}`；⑤ 离线 24h → `offlineMs === OFFLINE_CAP_MS` **且**超窗 growing 顺延（`offline-smoke` `ok:true` ✅【R3】）；⑥ 三链可跑通（米→鸡、豆→豆腐、麦→面包，chain-smoke ✅）；⑦ xp 单调不减；⑧ 同一存档同一参数的 `cook`/`deliverWish` 结果确定 |
| reason 断言 | 测试**直接断言中文原文**（= 冻结契约，`API_CONTRACT.md §7`）；机器码双读方案（expectReason 助手、D0–D3 时刻表）作废 |
| 边界纪律 | `systems/**` 禁 `document.`、`localStorage`、内嵌 `Math.random(`/`Date.now()`（默认参数位除外）——违规现为零；静态哨兵测试（R2-20）DEAD，纪律由 code review 维持 |
| 终态快照 | `npm test` 58 过 / 0 失败 / 1 skip（唯一 skip 跟踪未落地的 `spendInv` 非正数校验，`API_CONTRACT.md §11`）；probe 必需导出 21/21、三链全 true；offline-smoke / wish-board `ok:true` |

## 10. 性能预算

| 指标 | 预算 | 终态 |
| --- | --- | --- |
| 纯逻辑 tick | < 2 ms（`npm run bench` 断言） | ✅ 0.0005 ms/tick 量级 |
| log 长度 | ≤ 40 条（各系统 pushLog 处截断） | ✅ |
| 渲染 | 60fps @ 1280 与 390 宽 | ✅ 架构上已解决：dirty 标记 + rAF 合帧 + `setHtml` 签名比对 + data-prog/data-time 每帧通道；录制实测归 `SOTA_CHECKLIST.md` B1 |
| 存档体积 | < 32 KB | ✅ plots/jobs 有上限，天然封顶 |

## 11. Final（Round 3 收束）

1. **工单队列清空**：Round 2 全部 22 项工单已逐条标 DONE / DEAD，台账 = `API_CONTRACT.md §10.2`。第二波落地（`228af0c`/`1f64876`）把首波判 DEAD 的三项翻案为 DONE：R2-3 等级表单源化、R2-7 种子门置灰、R2-15 时速三档——其余 DEAD 方案（机器码迁移、core/buffs、SAVE_VERSION 管线、till 信封化、`payload.now` 透传等）列名 `API_CONTRACT.md §10.3`，禁止按旧文复活。
2. **剩余真实缺口冻结**：只剩 2 条行为缺口 + 1 条维护注记，全部登记于 `API_CONTRACT.md §11`（`village/skip` 绕补位节拍、`spendInv` 非正数校验、死代码/游离 node_modules 备忘）。此前冻结的温室 UI 入口、投喂价按钮、开局工具 1/0/0、等级表双份四条已在 `12a0312` 落地销账。任何后续轮次从该表开工，不需要重新考古。
3. **架构级冻结**：单 store + 纯函数系统 + 信封契约 + 双时基（切档不回溯）+ queries 只读注入 + v1 存档只增不改 + 中文 reason 即机器契约。验收与实测口径以 `SOTA_CHECKLIST.md` 与 `ACCEPTANCE.md` 为准。
