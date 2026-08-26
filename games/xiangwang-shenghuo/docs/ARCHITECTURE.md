# 架构（实施级 · Round 1 定稿）

> 本文与 `API_CONTRACT.md` 共同构成实现契约。farm / production / village / UI / tests 各所有者以本文裁决为准，禁止自行发明语义。基线版本中的模糊表述（patch、nowMs、离线折算）在本文全部收口。所有权见 `OWNERSHIP.md`。

## 0. 铁律（六条，违反即打回）

| # | 铁律 | 检查方式 |
| --- | --- | --- |
| 1 | 单一 store。系统模块（`src/systems/**`）是纯函数，**禁止** 触碰 `document` / `window` / `localStorage` / Audio / `import` 任何 `src/ui/**`、`src/audio/**` | 边界测试 grep import 图 |
| 2 | 命令函数一律返回信封 `{ ok, reason?, message?, state, ...extras }`；节拍/查询函数返回裸值。**跨模块边界禁止返回裸 patch**（详见 §3.2） | 单测断言返回形状 |
| 3 | 时间与随机必须可注入：`nowMs = Date.now()`、`rand = Math.random` 一律作为**末位默认参数**追加，函数体内不得直接调用 `Date.now()` / `Math.random()` | 单测传固定值可复现 |
| 4 | 失败路径必须返回**传入的同一个 state 引用**（`state` 字段 `===` 入参），不得部分改写 | `expect(r.state).toBe(s)` |
| 5 | state 必须 JSON 可序列化：无函数 / Date / Map / Set / NaN / Infinity / undefined 值 | 存档 roundtrip 测试 |
| 6 | 数值唯一事实源在 `src/data/**`（等级表、价格、心愿刷新间隔、buff 系数）。`GDD.md` 的表格只是文档镜像，冲突时以 data 为准 | code review |

## 1. 目录与所有权

```
games/xiangwang-shenghuo/
├─ src/main.js            组合根：唯一允许同时接触 store+save+raf+audio 的文件（Opus-4）
├─ src/core/              store / engine / save / events / buffs / reasons（Opus-4）
├─ src/data/              静态数值表 + levels + prices（Fable-3）
├─ src/systems/farm/      开垦、播种、生长、收获、枯萎、扩地（Opus-1）
├─ src/systems/production/ 工厂队列、畜牧投喂、生产位（Opus-2）
├─ src/systems/village/   心愿、嘉宾、烹饪、建造、宠物、摊位（Opus-3）
├─ src/ui/                纯渲染 + 事件委托，只 subscribe/dispatch（Opus-4）
├─ src/styles/  src/audio/ 皮肤与音效（Fable-2 / Opus-4）
├─ tests/                 vitest（GPT-sol-1）
└─ scripts/               probe / bench（GPT-sol-2）
```

## 2. 数据流（唯一环路）

```
用户输入(ui 事件委托)                    requestAnimationFrame(main.js)
        │dispatch(action)                        │dispatch({type:"meta/tick",payload:{dt,now}})
        ▼                                        ▼
   store.dispatch ──► rootReducer(state, action) ──► nextState
        │  ①route: action.type → 系统命令/节拍管线
        │  ②applyResult: 信封归一化（失败→只追加 log）
        │  ③finalize: level 重算 + log 截断
        ▼
   next !== state ? 通知订阅者 (state, action) : 静默
        ▼
   paint()(整屏渲染) + 音效决策（UI 侧读 action.type）
```

- 事件通道只有一个：`store.subscribe((state, action) => ...)`。`core/events.js` 的 `createBus` 保留导出但**禁止用于游戏逻辑**（Round 2 评估删除）。
- 副作用（`writeSave`、WebAudio、`requestAnimationFrame`）只允许出现在 `main.js` 与 `src/ui/**` 事件处理器；reducer 与系统函数零副作用。

## 3. Store 与 reducer 组合

### 3.1 `createStore(initial, reducer)` 语义（现状即契约）

| API | 语义 |
| --- | --- |
| `getState()` | 返回当前 state（调用方**只读**，禁止修改） |
| `dispatch(action)` | `action = { type: string, payload?: object }`。reducer 返回值 truthy 且 `!== state` 才替换并通知；否则静默。返回最新 state |
| `subscribe(fn)` | `fn(state, action)`，返回取消函数 |
| `replace(next)` | 整体替换（仅存档载入用），派发 `{ type: "meta/replace" }` |

### 3.2 patch vs nextState：裁决

| 位置 | 允许形式 | 说明 |
| --- | --- | --- |
| 系统命令函数返回值 | **完整 nextState**（包在信封 `state` 字段里） | 基线的 "patch \| nextState" 二义性废除 |
| 节拍函数（`tick*`）返回值 | **完整 nextState**（裸返回，不包信封） | |
| 模块内部 | 可用 `merge(state, patch)` 做顶层浅合并 | `merge` 只处理**第一层**，嵌套对象须手工展开 |
| reducer 返回值 | 完整 nextState 或原 state 引用 | 返回原引用 = 不通知订阅 |

理由：`dispatch` 用引用相等短路 + 存档要求整树可序列化，裸 patch 会让调用方猜合并深度。

### 3.3 rootReducer 三段式（`main.js`，Opus-4 实现）

```js
function rootReducer(state, action) {
  const routed = route(state, action);        // §API_CONTRACT.6 的映射表，未命中返回原 state
  const applied = applyResult(state, routed); // 信封归一化，见下
  return finalize(applied);                   // level 重算 + log 截断
}
```

| 阶段 | 规则 |
| --- | --- |
| `route` | 严格按 `API_CONTRACT.md §6` 的 action↔函数表调用；`meta/tick` 走 §4.3 管线 |
| `applyResult(state, r)` | `r` 为假值 → 原 state；`r.ok === false` → `{ ...state, log: [r.message ?? r.reason, ...state.log] }`（只加日志，其余不动）；`r.ok === true` → `r.state`；`r` 是裸 state（节拍）→ 直接采用 |
| `finalize(s)` | `meta.level = levelForXp(meta.xp)`（见 §6）；`log = log.slice(0, 40)`；dev 模式断言 resources 与 inv 无负数 |

## 4. 时钟

### 4.1 双时基（最重要的一张表）

| 时基 | 载体字段 | 驱动 | 使用者 |
| --- | --- | --- | --- |
| A. 游戏日历 | `meta.gameMinutes`（0–1439，日内）、`meta.day`（1 起）、`meta.season` | `advanceTime(state, dtMs)` 按 `dtMs / hourMs * 60` 累加 | 昼夜氛围、季节判定、心愿刷新计时、嘉宾离店 |
| B. 绝对纪元 ms | `plots[].plantedAt/doneAt`、`jobs[].doneAt`、`pets[].readyAt` | 命令函数注入的 `nowMs` 快照 | 作物生长、生产队列、宠物 CD |

规则：**新计时字段必须二选一并登记**。选 B 的字段必须加入 `EPOCH_FIELDS` 清单（§4.4 离线重排依赖它）。绝对游戏分钟用 `absGameMinutes(meta) = (meta.day - 1) * 1440 + meta.gameMinutes` 换算，不落盘。

### 4.2 常量（`src/core/engine.js` 导出，改值即改这里）

| 常量 | 值 | 含义 |
| --- | --- | --- |
| `HOUR_MS_DEFAULT` | `6000` | 1 游戏时 = 6s 真实（设置可改 3000/12000，其余值忽略） |
| `DAY_HOURS` | `24` | 1 游戏日 = 24 游戏时 ≈ 144s 真实 |
| `DAYS_PER_SEASON` | `7` | 1 季 = 7 日 ≈ 16.8min 真实；春→夏→秋→冬循环 |
| `OFFLINE_CAP_MS` | `28_800_000` | 离线补偿上限 = 8 **真实**小时（新增，见 §4.4） |
| 帧 dt 钳制 | `200` ms | `main.js` 循环 `dt = min(200, now - last)`，卡顿不补时 |
| 自动存档 | `15_000` ms | `setInterval(writeSave)`；另在 `pagehide`/`visibilitychange:hidden` 立即写（Round 2 补） |

### 4.3 `meta/tick` 管线（顺序固定，禁止重排）

| 步 | 调用 | 说明 |
| --- | --- | --- |
| 1 | `advanceTime(state, dt)` → `{ state, crossedDay, crossedSeason }` | 只动 meta 三字段；跨多日循环内自动处理 |
| 2 | `tickPlots(state, dt, now)` | growing 且 `now >= doneAt` → ready。**先于枯萎**：同帧既到期又换季的作物判熟不判枯 |
| 3 | `crossedSeason` 时 `wiltOffSeason(state)` | growing、非温室、新季不在 `crop.seasons` → `wilted`（保留 cropId 供 UI 显示，`plantedAt/doneAt = 0`） |
| 4 | `crossedDay` 时嘉宾离店检查 | `guests[].leaveDay <= day` → 移除 + log（Round 2） |
| 5 | `tickProduction(state, dt, now)` | running 且 `now >= doneAt` → done |
| 6 | `tickVillage(state)` | 心愿按绝对游戏分钟补位（`API_CONTRACT.md §5.1`） |
| 7 | `finalize` | 见 §3.3 |

### 4.4 离线补偿（新增 `applyOfflineCatchup`，语义唯一）

启动流程（`main.js`）：读档得 `{ savedAt, state }` → `hydrate(state)` → `dispatch({ type: "meta/offline", payload: { savedAt, now: Date.now() } })`。

算法（`core/engine.js` 的 `applyOfflineCatchup(state, savedAt, nowMs)`）：

| 步 | 操作 | 公式 |
| --- | --- | --- |
| 1 | 计流逝 | `elapsed = max(0, nowMs - savedAt)` |
| 2 | 封顶 | `effective = min(elapsed, OFFLINE_CAP_MS)`；`shift = elapsed - effective` |
| 3 | 时间戳重排 | `shift > 0` 时，`EPOCH_FIELDS` 中每个 **> 0** 的字段一律 `+= shift`。重排后各计时器恰好只前进 `effective` |
| 4 | 推进日历 | `advanceTime(state, effective)` |
| 5 | 结算 | 依次跑 §4.3 的第 2/3/5/6 步（`now = nowMs`，`dt = effective`）；枯萎按最终季节判一次 |
| 6 | 汇报 | 追加一条 log 摘要；返回 `{ state, offlineMs: effective, capped: shift > 0 }` |

`EPOCH_FIELDS`（v1）：`plots[].plantedAt`、`plots[].doneAt`、`jobs[].doneAt`、`pets[].readyAt`。

数值示例（默认 `hourMs = 6000`）：

| 离线真实时长 | effective | 游戏日历前进 | 结果 |
| --- | --- | --- | --- |
| 30 min | 30 min | 12.5 游戏日 | 全部到期作物/工单转 ready/done；心愿补满 |
| 8 h | 8 h | 200 游戏日 | 同上；季节按最终日期取模 |
| 24 h | **8 h**（封顶） | 200 游戏日 | `capped = true`；计时器只走 8h，多余 16h 通过 +shift 抹掉 |

设计取舍：离线不自动续产（工单收取、再投喂都需玩家操作），所以放开日历快进无经济风险；封顶只为防时间戳溢出性滚雪球与"离线一周全熟"的挂机膨胀。

### 4.5 跨日 / 跨季事件效果表

| 事件 | 效果 | 实现点 |
| --- | --- | --- |
| `crossedDay` | 嘉宾离店检查；无其他强制效果 | tick 管线第 4 步 |
| `crossedSeason` | ① `wiltOffSeason`；② UI 换肤（`root.dataset.season` 已有）；③ log 换季文案 | tick 管线第 3 步 / UI |
| 处于冬季（持续态，非事件） | `feedAnimal` 饲料消耗 +20%（余数累积，`API_CONTRACT.md §4.4`） | feedAnimal 内判 `meta.season === "winter"` |

## 5. 存档 v1 与迁移

### 5.1 载体

| 项 | 值 |
| --- | --- |
| 介质 / key | `localStorage` / `SAVE_KEY = "xwsh.save.v1"`（key 内 v1 指**格式族**，版本迁移不改 key） |
| 文档结构 | `{ "v": 1, "savedAt": <epoch ms>, "state": <State v1> }` |
| State v1 全字段 schema | 见 `API_CONTRACT.md §1`（唯一 schema 定义处） |
| 写档时机 | 15s 定时 + "记下这一天"按钮 + `pagehide`（Round 2） |
| 读档时机 | 仅启动时一次，经 `deserialize` → 迁移 → `hydrate` → `applyOfflineCatchup` |

### 5.2 迁移管线（`src/core/save.js`，Opus-4 实现）

```js
export const SAVE_VERSION = 1;                 // 当前结构版本
const MIGRATIONS = {
  // [fromV]: (doc) => doc'，必须把 v 提到 fromV+1。首个结构性变更时填入：
  // 1: (doc) => ({ ...doc, v: 2, state: renameXxx(doc.state) }),
};

export function deserialize(raw) {
  // JSON.parse 失败 / doc.v 不是 1..SAVE_VERSION / 无 doc.state → 返回 null（弃档新开局）
  // while (doc.v < SAVE_VERSION) doc = MIGRATIONS[doc.v](doc);
  // return { savedAt: doc.savedAt ?? Date.now(), state: hydrate(doc.state) };
}
```

版本纪律：

| 变更类型 | 动作 |
| --- | --- |
| **新增字段**（如 `acc`、`wishNextAt`） | 不升版本，`hydrate(state)` 填默认值（默认值表见 `API_CONTRACT.md §2.3`） |
| 字段改名 / 改形状 / 删除 | `SAVE_VERSION += 1`，写 `MIGRATIONS[旧版]`，禁止在系统代码里兼容旧形状 |
| 任何情况 | `serialize` 永远写 `v: SAVE_VERSION` |

## 6. 等级与 XP（单一事实源）

| 项 | 裁决 |
| --- | --- |
| 事实源 | 新模块 `src/data/levels.js`（Fable-3）：`XP_TABLE = [0, 40, 100, 180, 280, 420, 600, 820, 1100, 1450]`（下标 i = 等级 i+1 门槛，封顶 Lv10） |
| 派生函数 | `levelForXp(xp)`、`xpForNext(level)`（满级返回 `Infinity`，UI 显示 MAX） |
| 迁移 | `main.js` 顶部硬编码的 `LEVELS` 数组**删除**，改 import（Opus-4）；`GDD.md` 等级表为镜像文档 |
| 派生规则 | `meta.level` 永远 = `levelForXp(meta.xp)`，由 `finalize` 每次 dispatch 后重算；任何系统**禁止**手写 `meta.level` |
| XP 授予点 | 收获 `crop.xp`；心愿 `wish.xp`；畜牧收取 `job.xp`（当前缺失，Round 2 必修，见 `API_CONTRACT.md §4.3`）。加工收取暂 0 |
| 解锁判定 | 一律读 data：`building.unlockLevel` / `recipe.unlockLevel`，与 `meta.level` 比较 |

## 7. 嘉宾 buff 架构

| 原则 | 内容 |
| --- | --- |
| 数据源 | `src/data/guests.js` 的 `buff: { target, factor }`；target ∈ `farm / kitchen / wish / livestock` |
| 计算器 | 新模块 `src/core/buffs.js`：`buffFactor(state, target)` = 在座嘉宾中匹配 target 的 `factor` **连乘**，钳制 `[0.5, 2]`；无嘉宾 = 1。放 core 是为让三个系统无环引用 |
| 快照原则 | buff 在**动作发生瞬间**读取并固化进时长/数量（种植时长、工单 doneAt、投喂 qty）。嘉宾中途离店**不回溯**已开始的计时 |
| 应用点 | 恰好 4 处，公式与函数逐条见 `API_CONTRACT.md §8`：farm 生长（×0.85）、kitchen 工单时长（×0.8）、wish 刷新间隔（×0.85）、livestock 产量（×1.1 余数累积） |
| 禁止 | 在 tick 函数里每帧读 buff 重算 doneAt（会导致嘉宾进出反复拉扯计时器） |

## 8. UI 边界

### 8.1 import 允许矩阵（行 = 谁，列 = 可 import 什么）

| | `core/store` | `core/save` | `core/engine` | `core/buffs·reasons` | `data/**` | `systems/**` | `ui/**` | `audio/**` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `main.js`（组合根） | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `ui/**` | ❌ | ❌ | ✅ 只读常量 | ✅ 只读 | ✅ 展示用 | ❌ | ✅ | ❌ |
| `systems/**` | ✅ 纯助手 | ❌ | ✅ 常量 | ✅ | ✅ | ⚠️ 禁互引 | ❌ | ❌ |
| `data/**` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

### 8.2 UI 行为约束

- `ui/**` 只拿到 `(state, handlers)`；handlers 由 `main.js` 注入，内部只做 `store.dispatch` + 音效。UI **不得**自行计算游戏逻辑（如判断能否收获——只读 `plot.status`）。
- 错误呈现：UI 不 try/catch 游戏逻辑；失败信息已由 reducer 写进 `state.log[0]`，照渲染即可。
- 音效决策依据 `subscribe(state, action)` 的 `action.type`，禁止系统层发声。
- 渲染 R1 允许整屏 `innerHTML` 重绘；帧内多次 dispatch 只触发同步多次 paint，Round 2 换 rAF 合帧 + 局部 DOM（见 §10）。

## 9. 确定性与测试策略

| 手段 | 规则 |
| --- | --- |
| 时间注入 | 所有生成时间戳的命令加末位 `nowMs = Date.now()`；tick 已有 `now` 第 3 参。测试传固定值 |
| 随机注入 | `cook`（黑暗料理 0.08）、`deliverWish` 掉落（Round 2）加末位 `rand = Math.random`。测试传 `() => 0.99` 等定值 |
| 余数累积器 | 分数收益不用随机：`state.acc.{livestockYield, winterFeed}` 累积小数、溢出取整（`API_CONTRACT.md §4.4`），长期期望精确等于系数 |
| 必测不变量 | ① 任何失败信封 `state === 入参`；② resources/inv 恒非负；③ `meta.level === levelForXp(meta.xp)`；④ `deserialize(serialize(s)).state` 深等于 s（hydrate 后）；⑤ 离线 24h → `offlineMs === OFFLINE_CAP_MS`；⑥ 产业链三条可跑通（米→鸡、豆→豆腐、麦→面包）；⑦ xp 单调不减 |
| 边界测试 | 静态断言 `systems/**` 源码不含 `document.`、`localStorage`、`Math.random(`、`Date.now()`（除默认参数位）——GPT-sol-1 用正则实现 |

## 10. 性能预算

| 指标 | 预算 | 现状/动作 |
| --- | --- | --- |
| 纯逻辑 tick | < 2 ms（`npm run bench` 已断言） | 达标 |
| log 长度 | ≤ 40 条（finalize 截断） | 达标 |
| 渲染 | 60fps @ 1280 与 390 宽 | R1 整屏 innerHTML 在每帧 tick 下会 O(n) 重建 —— Round 2：paint 走 rAF 节流 + 面板级脏检查（Opus-4） |
| 存档体积 | < 32 KB | plots/jobs 数量有生产位与地块上限，天然封顶 |
