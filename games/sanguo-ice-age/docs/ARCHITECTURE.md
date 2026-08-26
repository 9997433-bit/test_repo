# ARCHITECTURE.md — 三国：冰河时代（网页致敬作）

> 作者：fable-arch（Round 1）。本文件是**执行合同**：其他代理实现任何模块前必须先读本文；
> 与本文冲突的实现视为缺陷。数值调参合同见同目录 `DESIGN.md`。
> 已有基线（不得破坏）：`js/config.js`、`js/engine/bus.js`、`js/engine/README.md` 中
> `loop.js` / `save.js` 的既定签名、`package.json` 脚本、开发端口 `4173`。

---

## 0. 设计原则（约束一切实现）

1. **纯 ESM、零依赖、零二进制**：无打包器、无 npm 依赖、无图片/音频二进制文件；美术全部程序化绘制（Canvas 2D + CSS/inline SVG）。`python3 -m http.server 4173` 直接可玩。
2. **单一状态树**：全部模拟数据放在一个可 JSON 序列化的 POJO `state` 里。系统函数签名统一为 `sys(state, bus)`，直接原地修改 `state`。
3. **模拟与表现严格分离**：`systems/` 与 `engine/` 不得 import 任何 DOM / Canvas 代码；必须能在 Node ≥18 无浏览器环境下跑通（`save.js` 内部对 `localStorage` 做存在性守卫）。
4. **单向数据流**：事件总线 `bus` **只用于「模拟 → 表现」的通知**；「表现 → 模拟」唯一入口是 `actions.js` 的显式函数。UI 严禁直接改 `state`。
5. **确定性模拟**：所有模拟随机数走 `engine/rng.js`（种子存于 state）；同种子 + 同操作序列 ⇒ 每 tick 后 state 完全一致。渲染层的纯视觉随机（雪粒子抖动等）允许用 `Math.random`。
6. **数据驱动内容**：建筑/武将/兵种/敌人/事件/科技全部是 `data/` 下的纯数据表；加一个武将 = 加一行数据，不改系统代码。
7. **常量单一来源**：可调数值只允许出现在 `js/config.js` 与 `js/data/*.js`；系统代码中出现魔法数字即缺陷。

---

## 1. 文件树（合同：路径与命名不得偏离）

```
games/sanguo-ice-age/
├── index.html                  ⬜ 页面骨架：#scene canvas、#hud、#dock、#toasts、#modal
├── package.json                ✅ 已有（scripts: start/test/bench/probe）
├── README.md                   ✅ 已有
├── docs/
│   ├── ARCHITECTURE.md         ✅ 本文件
│   └── DESIGN.md               ✅ 美术/数值/验收合同
├── css/
│   ├── base.css                ⬜ reset、design tokens（色板变量，见 DESIGN §14）
│   ├── ui.css                  ⬜ 窗格面板、按钮、列表、modal
│   └── hud.css                 ⬜ 顶栏 HUD、温度计、速度控件、toast
├── js/
│   ├── config.js               ✅ 已有；只允许**追加** COMBAT / ECONOMY / POPULATION 块，不得改已有键值
│   ├── main.js                 ⬜ 组合根：boot → 读档或新档 → 装配 systems/render/ui → 启动 loop
│   ├── state.js                ⬜ createInitialState(seed)、全部 JSDoc typedef（§3 为准）
│   ├── actions.js              ⬜ UI→模拟唯一入口（§6）
│   ├── selectors.js            ⬜ 只读派生查询（§7）
│   ├── engine/
│   │   ├── bus.js              ✅ 已有 createBus() { on, emit }
│   │   ├── loop.js             ⬜ createLoop({ tickMs, onTick, onFrame })（§4）
│   │   ├── save.js             ⬜ saveGame / loadGame / exportSave / importSave（§9）
│   │   └── rng.js              ⬜ mulberry32：createRng(u32state) → { next(), int(n), pick(arr), u32() }（§10）
│   ├── data/
│   │   ├── strings.js          ⬜ 全部 UI 文案集中（便于日后 i18n）
│   │   ├── buildings.js        ⬜ 14 建筑定义（schema §11.1，数值 DESIGN §6）
│   │   ├── heroes.js           ⬜ 16 武将定义（schema §11.2，数值 DESIGN §8）
│   │   ├── troops.js           ⬜ 步/骑/弓定义（schema §11.3）
│   │   ├── enemies.js          ⬜ 讨伐 8 关 + 劫掠敌军（schema §11.4）
│   │   ├── events.js           ⬜ 随机/脚本事件 ≥8（schema §11.5）
│   │   └── techs.js            ⬜ 太学院 6 科技（schema §11.6）
│   ├── systems/
│   │   ├── index.js            ⬜ export const SYSTEMS = [climate, economy, population, morale, construction, military, combat, events, progress]（顺序即合同 §4.2）
│   │   ├── climate.js          ⬜ 寒潮排程、燃料、温度、温度带
│   │   ├── economy.js          ⬜ 生产、消耗、仓储上限截断
│   │   ├── population.js       ⬜ 增长/逃亡/冻毙/饿毙、工人合法性回收
│   │   ├── morale.js           ⬜ 民心增减、崩溃计时
│   │   ├── construction.js     ⬜ 建造队列推进、完工
│   │   ├── military.js         ⬜ 练兵、伤兵痊愈、劫掠排程
│   │   ├── combat.js           ⬜ 讨伐行军 + 自动战斗结算（公式 DESIGN §9）
│   │   ├── events.js           ⬜ 事件抽取与挂起
│   │   └── progress.js         ⬜ 失败/结局判定、自动存档触发
│   ├── render/
│   │   ├── scene.js            ⬜ Canvas 合成器：层序、相机、DPR、脏区不做（整帧重绘）
│   │   ├── iso.js              ⬜ 网格↔屏幕坐标（2:1 dimetric，TILE_W 64 / TILE_H 32）
│   │   ├── sprites.js          ⬜ 14 建筑的程序化画法（每建筑一个 paint 函数）
│   │   ├── citizens.js         ⬜ 通勤小人（纯视觉，不写 state）
│   │   ├── snow.js             ⬜ 三层视差雪粒子 + 暴雪风迹
│   │   └── fx.js               ⬜ 火炉光晕、烟囱烟、霜霰晕影
│   └── ui/
│       ├── dom.js              ⬜ el()/h() 辅助、事件委托
│       ├── hud.js              ⬜ 顶栏（资源/日增、温度计、民心、人口、寒潮倒计时、速度）
│       ├── panels.js           ⬜ 右侧 dock 的 tab 路由：城建/武将/军务/政务/系统
│       ├── panelBuildings.js   ⬜ 建筑升级、工人增减
│       ├── panelHeroes.js      ⬜ 名册、招募、加经验
│       ├── panelArmy.js        ⬜ 练兵、编队、讨伐、战报 modal
│       ├── panelGov.js         ⬜ 事件志/抉择、科技、贸易
│       └── toast.js            ⬜ 订阅 bus "toast" 与关键事件
└── tests/
    ├── runner.mjs              ⬜ 单元测试（§13.1）
    ├── bench.mjs               ⬜ 性能基准（§13.2）
    └── probes.mjs              ⬜ 不变量模糊测试（§13.3）
```

`✅` = 已存在；`⬜` = 待实现。**禁止**新增顶层目录；assets 目录不允许出现（零二进制原则）。

---

## 2. 模块分层与依赖规则

```
        ┌────────────────────────── main.js（组合根，可 import 一切）─────────────────────────┐
        │                                                                                    │
  表现层│   ui/*  ──调用──▶ actions.js ──修改──▶ state ◀──读── selectors.js ◀──读── render/*  │
        │    ▲                                    │                                  ▲       │
        │    └───────────── bus.emit（通知） ◀────┘（systems 内 emit）───────────────┘       │
        ├────────────────────────────────────────────────────────────────────────────────────┤
  模拟层│   systems/*  →  import: config.js, data/*, selectors.js（只读辅助）                 │
        ├────────────────────────────────────────────────────────────────────────────────────┤
  引擎层│   engine/{bus,loop,save,rng}.js  →  import: config.js（仅此）                       │
        ├────────────────────────────────────────────────────────────────────────────────────┤
  数据层│   config.js（无 import）   data/*.js（只可 import config.js；纯数据+纯函数）        │
        └────────────────────────────────────────────────────────────────────────────────────┘
```

**import 白名单（违反即缺陷）**

| 模块 | 允许 import |
|---|---|
| `config.js` | 无 |
| `data/*` | `config.js` |
| `engine/*` | `config.js` |
| `state.js` / `selectors.js` | `config.js`, `data/*` |
| `actions.js` | `config.js`, `data/*`, `selectors.js`, `engine/rng.js` |
| `systems/*` | `config.js`, `data/*`, `selectors.js`, `engine/rng.js` |
| `render/*` | `config.js`, `data/*`, `selectors.js`（**只读 state，禁止修改**） |
| `ui/*` | `actions.js`, `selectors.js`, `data/strings.js`, `ui/dom.js` |
| `main.js` | 一切 |

---

## 3. 状态树（存档即此对象；JSDoc typedef 落在 `state.js`）

```js
/**
 * @typedef {Object} GameState
 * @property {number}   v            // = SAVE_VERSION（config.js）
 * @property {number}   seed         // 建档时随机种子（u32）
 * @property {number}   rngState     // 当前 RNG 内部状态（u32，随模拟推进）
 * @property {number}   tick         // 累计逻辑 tick（0 起）
 * @property {number}   day          // 当前天（1 起；tick % TICKS_PER_DAY === 0 时进位）
 * @property {{name:string,title:string}} lord            // 初值 = config.DEFAULT_LORD
 *
 * @property {Object}   climate
 * @property {number}   climate.temp                      // 当前城内温度（每 tick 重算，保留 1 位小数）
 * @property {"freeze"|"cold"|"chill"|"comfort"} climate.band
 * @property {{active:boolean,index:number,delta:number,startDay:number,endsDay:number,nextStartDay:number}} climate.blizzard
 * @property {{mode:"auto"|"wood"|"coal"|"off", lit:boolean}} climate.furnace
 *
 * @property {{food:number,wood:number,coal:number,iron:number}} resources   // ≥0，超仓储截断
 *
 * @property {Object}   population
 * @property {number}   population.total       // 平民总数（不含士兵）
 * @property {Object.<string,number>} population.assigned // buildingId → 工人数（仅生产建筑）
 * @property {number}   population.soldiers    // 现役士兵合计（= 三兵种之和）
 * @property {number}   population.wounded     // 伤兵（军医所每日治愈回 soldiers）
 *
 * @property {number}   morale                 // [0,100]，初值 MORALE.base
 * @property {number}   moraleCollapseTicks    // morale < collapseAt 的连续 tick 数
 *
 * @property {Object.<string,{level:number, up:null|{toLevel:number,ticksLeft:number}}>} buildings
 *           // 14 个固定 key：furnace,lumberCamp,hunterHut,coalMine,ironMine,house,
 *           //               warehouse,kitchen,barracks,clinic,academy,recruitHall,wall,embassy
 *
 * @property {Object}   heroes
 * @property {Array<{uid:number,defId:string,level:number,exp:number}>} heroes.roster
 * @property {number}   heroes.pullCount       // 累计抽卡次数（保底用）
 * @property {number}   heroes.pityOrange      // 距上次 ≥orange 的抽数
 * @property {number}   heroes.pityRed         // 距上次 red 的抽数
 *
 * @property {Object}   army
 * @property {{infantry:number,cavalry:number,archer:number}} army.troops        // 各兵种现役数
 * @property {null|{troop:string,left:number,ticksPerUnit:number,ticksLeft:number}} army.training
 * @property {Array<null|{heroUid:number,troop:"infantry"|"cavalry"|"archer",count:number}>} army.squads // 长度恒为 3
 * @property {null|{enemyId:string,phase:"march"|"battle"|"return",ticksLeft:number,report:null|CombatReport}} army.expedition
 * @property {number}   army.nextRaidDay       // 下次流寇劫掠日（10,20,30,…）
 *
 * @property {Object}   research
 * @property {string[]} research.done          // 已完成 techId
 * @property {null|{techId:string,ticksLeft:number}} research.current
 *
 * @property {Object}   events
 * @property {null|{eventId:string,firedDay:number}} events.pending   // 挂起待抉择（挂起时不再抽新事件）
 * @property {Array<{day:number,text:string}>}       events.log       // 事件志（尾部追加，UI 倒序显示，上限 200 条修剪）
 * @property {Object.<string,number>}                events.lastFired // eventId → 上次触发日（冷却用）
 *
 * @property {Object}   trade
 * @property {number}   trade.usedToday        // 今日已用贸易额度（day:start 清零）
 *
 * @property {Object}   progress
 * @property {"playing"|"defeat"|"ending"} progress.status
 * @property {null|string} progress.defeatId   // "revolt" | "extinct"
 * @property {boolean}  progress.endlessMode   // 「春回」后继续
 * @property {{blizzardsSurvived:number,raidsRepelled:number,heroesRecruited:number,peakPopulation:number}} progress.stats
 *
 * @property {Object}   flags                  // 一次性开关：如 tutorialStep:number, greatColdWarned:boolean
 */
```

**初始状态（`createInitialState(seed)` 合同）**

```json
{
  "v": 1, "seed": "<入参>", "rngState": "<seed>", "tick": 0, "day": 1,
  "lord": { "name": "流民县令", "title": "汉末县令" },
  "climate": { "temp": 7.2, "band": "chill",
    "blizzard": { "active": false, "index": 0, "delta": 0, "startDay": 0, "endsDay": 0, "nextStartDay": 7 },
    "furnace": { "mode": "auto", "lit": true } },
  "resources": { "food": 150, "wood": 120, "coal": 0, "iron": 0 },
  "population": { "total": 20, "assigned": { "lumberCamp": 2, "hunterHut": 2 }, "soldiers": 0, "wounded": 0 },
  "morale": 70, "moraleCollapseTicks": 0,
  "buildings": { "furnace": {"level":1,"up":null}, "lumberCamp": {"level":1,"up":null},
    "hunterHut": {"level":1,"up":null}, "house": {"level":1,"up":null},
    "coalMine": {"level":0,"up":null}, "ironMine": {"level":0,"up":null},
    "warehouse": {"level":0,"up":null}, "kitchen": {"level":0,"up":null},
    "barracks": {"level":0,"up":null}, "clinic": {"level":0,"up":null},
    "academy": {"level":0,"up":null}, "recruitHall": {"level":0,"up":null},
    "wall": {"level":0,"up":null}, "embassy": {"level":0,"up":null} },
  "heroes": { "roster": [ { "uid": 1, "defId": "liaohua", "level": 1, "exp": 0 } ],
    "pullCount": 0, "pityOrange": 0, "pityRed": 0 },
  "army": { "troops": { "infantry": 0, "cavalry": 0, "archer": 0 }, "training": null,
    "squads": [null, null, null], "expedition": null, "nextRaidDay": 10 },
  "research": { "done": [], "current": null },
  "events": { "pending": null, "log": [], "lastFired": {} },
  "trade": { "usedToday": 0 },
  "progress": { "status": "playing", "defeatId": null, "endlessMode": false,
    "stats": { "blizzardsSurvived": 0, "raidsRepelled": 0, "heroesRecruited": 1, "peakPopulation": 20 } },
  "flags": { "tutorialStep": 0, "greatColdWarned": false }
}
```

规则：state 内**不得**出现函数、类实例、`undefined`、`NaN`、`Infinity`、循环引用；
`JSON.parse(JSON.stringify(state))` 必须与原 state 深等。派生量（仓储上限、住房上限、
温度带效果等）一律走 `selectors.js`，**不存**入 state（`climate.temp/band` 例外：作为
上一 tick 计算结果缓存，供渲染层免重算）。

---

## 4. 主循环与 tick 时序

### 4.1 `engine/loop.js` 合同（沿用 engine/README 既定签名）

```js
createLoop({ tickMs, onTick, onFrame }) → {
  start(), stop(), setSpeed(n /*1|2|4*/), getSpeed(), setPaused(bool), isPaused()
}
```

- 固定步长累加器：`acc += rAF帧间隔 × speed`；`while (acc ≥ tickMs) { onTick(); acc -= tickMs }`。
- **追帧上限 8 tick/帧**，超出则丢弃剩余 `acc`（防死亡螺旋；切后台回来不会疯狂快进）。
- `onFrame(dtMs, alpha)` 每 rAF 调一次（`alpha = acc / tickMs`，供渲染插值）；暂停时仍调 `onFrame`（场景继续下雪），但不调 `onTick`。
- Node 环境下 `onFrame` 可为空函数，loop 需在无 `requestAnimationFrame` 时不抛错（测试直接手动 for 循环调 systems，不依赖 loop）。

### 4.2 每 tick 系统流水线（顺序即合同，`systems/index.js` 固化）

```
tick 开始（progress.status !== "playing" 时：跳过 1–9，只发 tick:end）
 0. 时间推进：state.tick++；若 tick % TICKS_PER_DAY === 0 → state.day++ → emit "day:start"
 1. climate       寒潮排程/预警 → 燃料扣减与 lit 判定 → temp/band 重算
 2. economy       生产（工人×费率×天气系数）→ 消耗（口粮）→ 仓储截断
 3. population    仅在 day:start 当 tick 结算：增长/逃亡/冻毙/饿毙 → 回收超编工人
 4. morale        按 band/饥饿增减 → clamp → 崩溃计时
 5. construction  队列 ticksLeft-- → 完工升级 → emit
 6. military      练兵推进、伤兵痊愈（按日）、劫掠日触发 raid 战斗请求
 7. combat        讨伐行军推进；battle 相位一次性结算（含 raid）
 8. events        无挂起事件时按节奏抽取 → emit "event:fired"
 9. progress      失败/结局判定；自动存档（每 day:start 且 status==="playing"）
10. emit "tick:end" { tick, day }   ← UI/渲染以此为唯一重读信号
```

任何系统**不得**跨阶段调用其他系统；跨系统通信只有两条路：写 state（下游读）、emit 事件（表现层读）。

---

## 5. 系统边界（读 / 写 / emit 权属表）

| 系统 | 读 | 写（独占） | emit |
|---|---|---|---|
| climate | buildings.furnace, research.done, resources.{wood,coal} | climate.\*；resources.{wood,coal}（仅燃料扣减） | climate:blizzard:warn/start/end, climate:band, climate:fuel:out |
| economy | population.assigned, buildings, climate.band, research.done | resources.\*（生产/口粮/截断） | res:empty, res:full |
| population | morale, climate, resources.food, buildings.{house,clinic} | population.{total,assigned 回收}, progress.stats.peakPopulation | pop:growth, pop:fled, pop:frozen, pop:starved |
| morale | climate.band, resources.food, buildings.{kitchen,clinic} | morale, moraleCollapseTicks | morale:collapse:warn |
| construction | resources（完工不退款；扣款在 action 时） | buildings.\*.{level,up} | build:done |
| military | buildings.{barracks,clinic}, army | army.{troops,training,nextRaidDay}, population.{soldiers,wounded} | army:trained, raid:incoming |
| combat | army, heroes, research.done, buildings.wall, data/enemies | army.{expedition,squads,troops}, resources（战利品/劫掠损失）, population.{soldiers,wounded}, morale（劫掠败 −8） | combat:start/round/end |
| events | events.\*, day, rng | events.\*；effect 可写 resources/population/morale/heroes（数据表内声明） | event:fired, event:resolved |
| progress | morale, population, day, moraleCollapseTicks | progress.\* | game:over, game:ending, save:done |

同一子树若两系统都要写（如 resources），以流水线顺序裁决且各写各的语义段（表中括注）；测试 `probes.mjs` 对此做不变量校验。

---

## 6. `actions.js` — UI→模拟唯一入口

全部为同步纯副作用函数，签名 `fn(state, bus, ...args) → { ok:boolean, reason?:string }`。
失败必须返回 `reason`（取自 `data/strings.js` 键），**不得** throw、不得 emit toast（UI 依据返回值自行 toast）。

| action | 语义与校验 |
|---|---|
| `setFuelMode(state,bus,mode)` | mode ∈ auto/wood/coal/off |
| `queueUpgrade(state,bus,buildingId)` | 校验：无在建、目标等级 ≤ maxLevel、（非火炉时）目标等级 ≤ furnace.level、前置火炉等级满足、资源足够 → **立即扣资源**、写 `up:{toLevel,ticksLeft}` → emit build:queued |
| `assignWorker(state,bus,buildingId,delta)` | delta=±1；校验空闲工人（selectors.idle）与槽位上限 |
| `recruitHero(state,bus)` | 校验招贤馆≥1、资源足够 → 扣费 → rng 按品阶权重+保底抽取 → 重复武将转经验 → emit hero:recruited |
| `addHeroExp(state,bus,uid)` | 太学院≥1 时可用；扣资源换经验，升级按 DESIGN §8 曲线 |
| `trainTroops(state,bus,troop,count)` | 校验兵营容量、空闲人口、资源 → 扣人口与资源、写 army.training |
| `setSquad(state,bus,slot,cfg\|null)` | slot ∈ 0..2；校验 heroUid 存在且未重复上阵、count ≤ 该兵种存量减去其他队占用 |
| `startExpedition(state,bus,enemyId)` | 校验：无进行中远征、非暴雪、至少一队非空 → 写 expedition march |
| `resolveEventChoice(state,bus,choiceId)` | 结算 events.pending 的选项 effect → 清 pending → emit event:resolved |
| `startResearch(state,bus,techId)` | 校验太学院等级、前置、资源 → 扣费 → 写 research.current |
| `trade(state,bus,giveType,getType,units)` | 使节馆≥1；按 DESIGN §11 汇率与每日额度 |
| `renameLord(state,bus,name)` | 长度 1..12，仅改 lord.name |
| `restartGame(state,bus)` | 仅 status ≠ "playing" 或用户在系统面板确认后：用新种子重建 state（main.js 提供回调实现整树替换） |

---

## 7. `selectors.js` — 只读派生查询（渲染/UI 共用）

`caps(state)`（仓储上限四元组）、`housingCap(state)`、`idleWorkers(state)`、
`slotCap(state,buildingId)`、`upgradeCost(state,buildingId)`、`canUpgrade(state,buildingId)→{ok,reason}`、
`dailyNet(state)`（四资源的“每日净增”预测，HUD 显示用）、`tempBandOf(temp)`、
`furnaceFuelPerDay(state)`、`blizzardCountdown(state)`（天数，含预警文案键）、
`squadPower(state,squad,ctx)`（战力预览，与 combat 同源公式）、`rosterByFaction(state)`、
`techAvailable(state)`。选择器**必须无副作用**，可被每帧调用（O(1) 或 O(建筑数)）。

---

## 8. 事件总线事件清单（合同：kind 与 payload 不得偏离）

> 方向恒为 模拟→表现。UI 的常规刷新只订阅 `tick:end` 后整体重读 state；
> 下表其余事件用于 toast、动效、音效触发点。

| kind | payload | 触发点 |
|---|---|---|
| `tick:end` | `{tick, day}` | 每 tick 流水线末尾 |
| `day:start` | `{day}` | 日进位 |
| `climate:blizzard:warn` | `{startsDay, delta}` | 寒潮前 1 天 |
| `climate:blizzard:start` | `{index, delta, endsDay}` | 寒潮开始 |
| `climate:blizzard:end` | `{index}` | 寒潮结束 |
| `climate:band` | `{band, temp}` | 温度带变化时（非每 tick） |
| `climate:fuel:out` | `{}` | 燃料耗尽熄火沿（每次断供只发一次） |
| `res:empty` / `res:full` | `{type}` | 资源归零 / 触顶沿 |
| `build:queued` | `{id, toLevel}` | action 入队 |
| `build:done` | `{id, level}` | 完工 |
| `pop:growth` / `pop:fled` / `pop:frozen` / `pop:starved` | `{n}` | 每日人口结算 |
| `morale:collapse:warn` | `{ticksLeft}` | 崩溃倒计时开始/每半天 |
| `hero:recruited` | `{uid, defId, quality, dup:boolean}` | 抽卡 |
| `hero:levelup` | `{uid, level}` | 升级 |
| `army:trained` | `{troop, n}` | 一批练兵完成 |
| `raid:incoming` | `{day, enemyId}` | 劫掠预警（提前 1 天） |
| `combat:start` | `{kind:"expedition"\|"raid", enemyId}` | 开战 |
| `combat:round` | `{round, log:string}` | 每回合（供战报） |
| `combat:end` | `{kind, victory, losses, loot, report}` | 结算 |
| `event:fired` | `{eventId}` | 事件挂起 |
| `event:resolved` | `{eventId, choiceId}` | 抉择完成 |
| `game:over` | `{defeatId, reason}` | 失败 |
| `game:ending` | `{id:"spring"}` | 六十日「春回」结局 |
| `save:done` | `{auto:boolean}` | 存档写入 |
| `save:loaded` | `{v}` | 读档完成 |
| `toast` | `{kind:"info"\|"warn"\|"good", text}` | 系统级通用提示 |

新增事件必须先补进本表再实现。payload 一律可 JSON 序列化。

---

## 9. 存档 schema 与迁移（`engine/save.js`）

- 键：`config.SAVE_KEY = "sanguo-ice-age-save-v1"`（localStorage）。
- 载体：`{ v: SAVE_VERSION, savedAt: <epoch ms>, state: <GameState 全树> }`。
- `saveGame(state)`：序列化写入；写失败（配额/隐私模式）静默返回 false，由调用方 toast。
- `loadGame()`：无档/解析失败/`v > SAVE_VERSION` → 返回 `null`；`v < SAVE_VERSION` → 逐版 `MIGRATIONS[v](save)` 链式迁移后返回 state。
- `exportSave(state)`：返回 JSON 字符串（UI 触发 Blob 下载 `sanguo-ice-age-<day>.json`）。
- `importSave(json)`：解析 + 结构校验（必备顶层键、数值域 clamp）→ 返回 state 或 `null`。
- 自动存档：`progress` 系统在每个 `day:start` 及 `game:over/ending` 时调用；另 main.js 挂 `visibilitychange(hidden)` 兜底。
- **v 升级规则**：改动 GameState 结构必须 `SAVE_VERSION+1` 并补迁移函数与迁移测试。

---

## 10. 确定性与 RNG（`engine/rng.js`）

- 算法：mulberry32。`createRng(u32)` 返回 `{ next():[0,1), int(n):0..n-1, pick(arr), u32():当前内部状态 }`。
- 模拟侧用法合同：系统/action 内每次取随机前 `const rng = createRng(state.rngState)`，用完立刻 `state.rngState = rng.u32()` 回写。禁止在模拟层出现 `Math.random` / `Date.now`。
- 保证：同 `seed` + 同 action 序列（含发生 tick 位置）⇒ 任意 tick 后 `hash(state)` 一致。`probes.mjs` 以稳定序列化（按 key 排序的 JSON）+ FNV-1a 哈希校验。

---

## 11. 数据文件 schema（数值填充见 DESIGN）

### 11.1 `data/buildings.js`
```js
export const BUILDINGS = { [id]: {
  id, name, desc,                    // 中文名/一句话说明
  maxLevel,                          // 火炉 6，其余 5
  unlockFurnace,                     // 建到 L1 所需火炉等级
  plot: [col, row],                  // 城区 9×9 格坐标（DESIGN §14.2 布局表）
  cost(toLevel) → {food?,wood?,coal?,iron?},
  buildTicks(toLevel) → number,
  slots(level) → number,             // 生产建筑工人槽；非生产建筑返回 0
  yields?: { res, perWorkerPerTick },// 生产建筑
  outdoor: boolean,                  // 受天气减产
} }
```

### 11.2 `data/heroes.js`
```js
export const HEROES = { [defId]: {
  defId, name, faction /*wei|shu|wu|qun*/, quality /*blue|purple|orange|red*/,
  troop,                             // 天赋兵种（带队该兵种享 skill）
  atk, def, lead,
  skill: { name, desc, mod: { type, when?, value } },   // mini-DSL，见 DESIGN §8.3
} }
```

### 11.3 `data/troops.js`：`{ [id]: { id, name, trainCost:{food,iron}, trainTicksPerUnit, upkeepFoodPerTick } }`
### 11.4 `data/enemies.js`：`{ [id]: { id, name, tier, comp:[{troop,count,heroLike:{atk,def,lead}|null}], loot:{...}, expReward, marchTicks } }` + `raidWaveFor(day)`
### 11.5 `data/events.js`：`{ [id]: { id, title, text, when(state)→bool, weight, cooldownDays, choices:[{id,label,effect(state,bus)}] } }`（effect 是数据表内声明的纯副作用，只许写 §5 中 events 行允许的子树）
### 11.6 `data/techs.js`：`{ [id]: { id, name, desc, requiresAcademy, cost, days, mod:{type,value} } }`

---

## 12. 渲染管线合同（`render/`）

- 单 `<canvas id="scene">`，Canvas 2D，`devicePixelRatio` 缩放，整帧重绘。
- 帧内层序（自底向上）：天空/地面色调（按 band 插值）→ 等距地块与积雪 → 建筑（按 `col+row` 深度排序 painter's algorithm）→ 通勤小人 → fx（炉焰光晕加法混合、烟）→ 雪粒子三层 → 暴雪风迹与霜霰晕影 → 选中高亮描边。
- 相机：拖拽平移、滚轮缩放 0.75–2.0，双击建筑居中；相机与粒子状态**不入存档**。
- 渲染只在 `onFrame` 里跑；从 `tick:end` 拿脏标记 + 直接读 state/selectors；`alpha` 用于小人移动与烟粒插值。
- 性能预算：模拟 tick ≤ 2ms；渲染一帧 ≤ 6ms（1080p、暴雪 1200 粒子 + 48 小人）。粒子与小人一律对象池，帧内零 GC 分配（复用数组/对象）。

---

## 13. 测试合同（Node ≥18，零依赖，进程退出码非 0 即失败）

### 13.1 `tests/runner.mjs`（单元，≥25 断言）
覆盖：温度公式与 band 边界（−6/0/8 恰点）、燃料 auto 模式优先煤、民心增减与 clamp、
仓储截断、升级校验矩阵（等级上限/火炉上限/资源不足/在建互斥）、人口日结算、
战斗公式（克制乘区、6 回合上限、伤兵拆分）、抽卡权重与保底、存档 roundtrip 深等、
importSave 拒绝坏档、事件冷却。

### 13.2 `tests/bench.mjs`
无渲染跑 10,000 tick（含 3 次寒潮 + 2 次战斗脚本化 action）：耗时 < 250ms（打印实测值）；全程零异常。

### 13.3 `tests/probes.mjs`
200 组随机种子 × 随机合法 action 序列 × 500 tick，模糊校验不变量：
资源/人口/民心 ∈ 合法域、无 NaN/Infinity/undefined、assigned 之和 ≤ total、
squads 引用的 heroUid 存在、`JSON roundtrip` 深等、同种子重放哈希一致（确定性）。

---

## 14. 扩展点

1. **同仓库多游戏**：每个游戏完全自包含于 `games/<slug>/`；**禁止跨游戏 import**、禁止共享全局；localStorage 键必须以游戏 slug 前缀命名；各游戏 README 声明独占开发端口（本作 4173）。公共代码复用采取「复制固化」而非提取共享库。
2. **新内容零改码**：新建筑 = `data/buildings.js` 一条 + `sprites.js` 一个 paint 函数；新武将/敌人/事件/科技 = 数据表一行。系统按数据表自动生效。
3. **难度/Mod**：`main.js` 支持 URL 参数 `?seed=<u32>&difficulty=easy|normal|hard`；difficulty 仅作为对 CLIMATE/MORALE 的只读乘区覆盖对象传入 systems（不改 config.js 源值）。
4. **i18n 预留**：全部 UI 文案经 `data/strings.js` 键访问；后续加语言 = 换表。
5. **存档演进**：§9 的版本迁移链即向后兼容通道。
6. **表现层可替换**：render/ 与 ui/ 只依赖 selectors + bus，可整体换成 WebGL 或 DOM 实现而不动模拟层。

---

## 15. 分工建议（Parent Orchestrator 调度参考）

| 代理 | 交付 | 依赖 |
|---|---|---|
| opus-engine | `engine/loop.js` `engine/save.js` `engine/rng.js` | 本文 §4/§9/§10 |
| sim 代理 | `state.js` `actions.js` `selectors.js` `systems/*` `config.js 追加块` | 本文 §3–§7 + DESIGN 数值 |
| data 代理 | `data/*` 六表 | 本文 §11 + DESIGN §6–§12 |
| render 代理 | `render/*` `index.html` | 本文 §12 + DESIGN §14 |
| ui 代理 | `ui/*` `css/*` | 本文 §6/§8 + DESIGN §14/§16 |
| test 代理 | `tests/*` | 本文 §13 + DESIGN §17 验收 |

集成顺序：engine → state/data → systems → render/ui → tests 全绿 → 对照 DESIGN §17 验收。

---

## 16. 附录：与并行实现的差异裁决（Round 1 结束时快照）

写作本文期间，并行 engine 代理已向 `config.js` 追加 `TICK_SEC/LOOP/START/START_HERO_IDS/BUILDING_IDS/LOG_MAX/LOG_LEVELS`。以下差异**以本文与 DESIGN 为准**，需在 Round 2 归一：

1. `BUILDING_IDS` 现为 9 项且含 `warmhouse`，**缺** house/warehouse/recruitHall/wall/embassy——与任务规定的 14 建筑不符。必须改为本文 §3 的 14 个 key（命名统一 camelCase：`lumberCamp/hunterHut/coalMine/ironMine/...`），`warmhouse` 删除（保暖归火炉与「保暖冬衣」科技）。
2. `START` 的开局资源（320/420/140/60、pop 12、赠步兵 12、heroTickets 3）与 DESIGN §6.4 教学节拍（150/120/0/0、pop 20、无兵、无券）冲突：开局即有煤铁与士兵会废掉「首寒潮升炉」与「练兵」两条教学线。以 DESIGN §6.4 为准；若 engine 坚持券制招募，需同步改写 DESIGN §8.2 造价条目并重算 §16 平衡基线。
3. `START_HERO_IDS`（liubei/zhangfei/huatuo）与 DESIGN §8.1 的 16 人名册不符：开局仅赠 `liaohua`（蓝）；刘备/张飞/华佗不在首发名册，如需加入须走名册扩表流程（数据行 + 品质配平），不得作为开局橙将赠送。
4. `LOOP/TICK_SEC/LOG_MAX/LOG_LEVELS` 与本文兼容，采纳并视为合同一部分（`LOG_MAX=200` 与 §3 events.log 上限一致；`LOG_LEVELS` 供事件志上色，与 bus `toast.kind` 三值并存不混用）。

---

## 17. 整合（Round 2 增补；细则见 `docs/INTEGRATION.md`）

> 作者：fable-integration（Round 2）。Round 1 交付的实际代码与本文 §3/§4/§16 蓝图
> 存在偏离；Round 2 以**已交付并通过测试的代码**为基线做归一，裁决细则全部落在
> `docs/INTEGRATION.md`（下称 INTEGRATION）。**两文冲突时以 INTEGRATION 为准**，
> 本章只记录让位关系与合同修订点，不重复条款。

### 17.1 对本文蓝图的修订

1. **状态树（替代 §3）**：权威状态树以 `js/state.js` 的 `createInitialState` 实际
   产出为准（`meta / resources / climate / city.buildings{} / people / army /
   heroes / quests / stats / war / research / flags / log`），§3 的
   `v/rngState/buildings 顶层/population.assigned` 等蓝图字段不再执行。
   Round 2 唯一一次 schema 变更（`SAVE_VERSION` 1→2：army 嵌套化、quests 形状
   统一、新增 stats/war/research、武将 id snake_case 迁移）见 INTEGRATION §1.3。
2. **建筑 id（替代 §16.1）**：权威集合为 `data/buildings.js` 的 17 个
   snake_case id（`lumber/coal_mine/iron_mine/warehouse/barracks_inf/...`），
   §3/§16 的 14 建筑 camelCase 方案作废。旧 id 经 `config.BUILDING_ID_ALIASES`
   与 `systems/city.js ID_ALIASES` **仅在读档迁移与 defOf 兜底**中出现。
3. **tick 流水线（收敛 §4.2）**：当前落地为 5 段固定顺序
   `climate → city → economy → population → quests`（INTEGRATION §4）；
   §4.2 的 9 系统蓝图（morale/construction/military/events/progress 独立成段）
   保留为远期方向，本轮 morale/construction 已并入 population/city，combat 为
   动作驱动、无 tick 段。
4. **actions/selectors（落点变更，§6/§7 职责不变）**：`actions.js`、
   `selectors.js` 的职责由 **`js/bridge/actions.js`**（动作表见 INTEGRATION §5）
   与 **`js/bridge/view.js` 的 `projectView(state)`**（字段对照见 INTEGRATION §3）
   承接；`tests/probes.mjs` 的 `bridge-project-view` 探针按该路径验收。
   「UI 严禁直接改 state、失败必返回 reason 并由 UI toast」两条原则不变且升级为
   硬约束（INTEGRATION §8）。
5. **存档（补充 §9）**：唯一键 `config.SAVE_KEY`、唯一通道 `engine/save.js`；
   Round 1 期间 main.js 内置内核私建的 `${SAVE_KEY}-ui` 键只删不写、不迁移。
6. **双核退役**：main.js 的 FALLBACK CORE（内置扁平内核 + probeBridge 桥探测 +
   防御性动态 import）整体删除，systems/engine/data 改为静态 import；
   退役清单见 INTEGRATION §1.4。

### 17.2 验收口径

`node tests/runner.mjs` / `tests/probes.mjs` / `tests/bench.mjs` 全绿，且
`bridge-project-view` 探针由 skip 转 pass；其余验收沿用 DESIGN §17。
