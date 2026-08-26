# 架构契约与文件所有权

## 运行方式

```
games/bingqi-wangzhe/   # 独立游戏根，勿污染仓库根或其他未来游戏
  index.html
  css/main.css
  js/main.js            # 入口，只做 boot
  js/core/              # 状态、存档、事件、RNG、时钟
  js/data/              # 纯数据：兵器、关卡、技能、文案
  js/forge/             # 锻造、强化、分解、挂机产出
  js/combat/            # 战斗模拟、AI、竞技
  js/ui/                # 渲染、路由、画布特效
  tests/                # Node 可跑的纯逻辑测试（不依赖 DOM）
  bench/                # 基准与压力探针
  README.md
```

技术约束：

- **零构建依赖**即可游玩：纯 HTML/CSS/ES module。
- 逻辑层（`core/forge/combat/data`）必须可在 Node 中 `import`，禁止直接读 `window`。
- UI 层可使用 `window`，但必须通过 `createGame(api)` 注入。
- 随机数一律走 `core/rng.js` 的 mulberry32。

## 公共 API（冻结，Round 1 必须遵守）

### `core/rng.js`

```js
export function createRng(seed = 1)
// { next(), nextFloat(), pick(arr), weighted(pairs), int(min,max) }
```

### `core/state.js`

```js
export function createInitialState()
export function hydrate(raw)
export function serialize(state)
export function tickIdle(state, nowMs)
export function addResource(state, id, n)
export function spend(state, costMap) // boolean
```

存档字段最低集：`version, seed, createdAt, resources, weapons[], lineup[], campaign, arena, codex, flags, idle`。

### `core/events.js`

```js
export function createBus()
// { on(type, fn), off(type, fn), emit(type, payload) }
```

### `data/weapons.js` / `skills.js` / `stages.js` / `strings.js`

全部 `export const ...`，无副作用。

### `forge/forge.js`

```js
export function previewForge(state, opts)
export function forgeWeapon(state, opts, rng)
export function enhanceWeapon(state, weaponId)
export function dismantleWeapon(state, weaponId)
export function collectIdle(state, nowMs)
```

`opts = { stage: 'iron'|'silver'|'gold', elementBias, useLucky, useMasterForge }`

### `combat/engine.js`

```js
export function estimatePower(state, lineupIds)
export function simulateBattle({ playerWeapons, enemyWaves, rng, speed })
// 返回 { winner, rounds, timeline[], rewards }
export function generateArenaOpponents(state, rng)
```

### `ui/app.js`

```js
export function mountApp(root, game)
```

## Round 文件所有权（严格）

### 常驻规划区（fable 可写）

| 代理 | 可写路径 |
| --- | --- |
| fable-1 架构 | `.agent_workspace/roundN/fable1-architecture.md` 以及本文件的**增量补丁段**（只追加 `## Round N 补丁`） |
| fable-2 战斗审计 | `.agent_workspace/roundN/fable2-combat.md` |
| fable-3 经济数值 | `.agent_workspace/roundN/fable3-economy.md` 与 `games/bingqi-wangzhe/js/data/balance.js`（若尚未被 opus 占用） |
| fable-4 UX/SOTA | `.agent_workspace/roundN/fable4-ux.md` |

### 实现区（opus-fast 可写）

| 代理 | 可写路径 |
| --- | --- |
| opus-1 核心 | `games/bingqi-wangzhe/js/core/**` `games/bingqi-wangzhe/js/main.js` |
| opus-2 锻造+数据 | `games/bingqi-wangzhe/js/forge/**` `games/bingqi-wangzhe/js/data/**` |
| opus-3 战斗 | `games/bingqi-wangzhe/js/combat/**` |
| opus-4 UI | `games/bingqi-wangzhe/index.html` `games/bingqi-wangzhe/css/**` `games/bingqi-wangzhe/js/ui/**` `games/bingqi-wangzhe/assets/**` `games/bingqi-wangzhe/README.md` |

### 探针区（gpt-sol 可写）

| 代理 | 可写路径 |
| --- | --- |
| gpt-sol-1 测试 | `games/bingqi-wangzhe/tests/**` |
| gpt-sol-2 基准 | `games/bingqi-wangzhe/bench/**` |

冲突规则：

1. 禁止修改他人目录。发现接口不足，写入 `.agent_workspace/roundN/REQUESTS.md`（追加）。
2. `index.html` 只允许 opus-4 改。
3. 测试只能 import 逻辑层，禁止改生产逻辑（缺陷写入 REQUESTS）。
4. 每名代理提交前必须保证自己目录 `node --check` / 测试可解析。

## 提交约定

- 只提交自己所有权内的文件。
- 提交信息：`feat(bqwz): <scope> — <summary>`
- 输出报告首行：`MODEL_SLUG: <实际 slug>`

## Round 1 补丁

> 追加式契约细化（fable-1），不改写上文冻结 API；详细论证见 `.agent_workspace/round1/fable1-architecture.md`。Round 1 实现代理必须遵守。

### P1. 组合根与 `game` 形状（opus-1 / opus-4 对齐）

`createGame(deps)` 定义在 `js/main.js`（可下沉 `core/game.js` 并 re-export）。`mountApp(root, game)` 的 `game`：

```js
{ state, bus, rng, clock: { now() },
  api: { forge:  { preview, forge, enhance, dismantle, collectIdle },
         combat: { estimatePower, fight, applyResult, arenaOpponents },
         lineup: { assign, remove, swap },
         save:   { persist, exportString, importString, reset } } }
```

UI 一切写操作只走 `game.api`；只读预览可直调领域函数。逻辑层禁止 `Date.now()`，时间一律经 `clock.now()` 传参。

### P2. 追加公共 API（additive）

```js
// core/state.js
export const SAVE_VERSION = 1;
export const migrations = {};             // { [目标版本]: (raw) => raw }
export function canAfford(state, costMap) // { ok, lacking: {id: n} }
// combat/engine.js
export function applyBattleResult(state, result, ctx)
// ctx = { kind: 'campaign'|'arena', stageId?, opponentId? }
```

`createRng` 的 `weighted(pairs)` 形状冻结为 `[[value, weight], ...]`；权重和为 0 抛异常。

### P3. 状态与挂机语义裁定

- 状态采用**就地变更 + 事件广播**；UI 只读 `state`，靠事件重渲染。
- `tickIdle(state, nowMs)`：幂等推进（体力回复、挂机计时锚点），**不发奖励**；`collectIdle(state, nowMs)`：计算并发放挂机奖励（封顶 8h）、重置锚点。`nowMs` 小于锚点（时钟回拨）按 0 elapsed 钳制。
- 预期失败（材料不足等）返回 `{ ok:false, reason:'snake_case_key' }` 不抛异常；`reason` 文案查 `data/strings.js`。程序员错误才 `throw`。

### P4. 存档与兵器实例形状

存档键 `bqwz.save.v1`；`hydrate` 管线：空档新建 → 未来版本抛错（不覆盖） → 顺序跑 `migrations` → 以 `createInitialState()` 补默认且**保留未知字段** → 修复性校验（悬空 uid 置 null、负资源归零）。损坏档先备份 `bqwz.save.v1.corrupt` 再重建。写入：防抖 800ms + 锻造/战斗结算/`pagehide` 强制。

```js
// WeaponInstance（入档；派生值如战力一律不入档）
{ uid, protoId, quality, level, element,
  affixes: [{ id, value }], skillSlots: [null,null,null], locked }
```

### P5. 标准事件名（只增不改）

`state:changed` `resource:changed` `forge:result` `weapon:enhanced` `weapon:dismantled`
`battle:start` `battle:end` `idle:collected` `codex:unlocked` `toast` `save:persisted` `save:failed`

### P6. 其余裁定

- `forge/` 与 `combat/` 互不 import；共享逻辑下沉 `core/`。
- `simulateBattle` 硬上限 `MAX_ROUNDS = 60`（入 `balance.js`），超限判负且返回带 `timeout: true`。
- Round 1 内 `data/balance.js` 归 fable-3 独占，opus-2 只 import 不创建。
- `tests/run.mjs` 与 `bench/run.mjs` 为唯一入口，失败以非 0 退出码结束。
- `timeline[]` 条目：`{ t, actorUid, side, action, targetUid, value, element, mod, crit, hpAfter }`。

## Round 2 补丁

> 追加式契约（fable-1），全文与 VM 形状详见 `.agent_workspace/round2/fable1-architecture.md`。
> 与 Round 1 补丁冲突处以本段为准（P1 的 `game.api` 嵌套命名空间方案作废，改为扁平 facade 动词，
> 与 `ui/gameAdapter.js` 已实现的探测/守卫机制对齐）。

### R2-P1. 组合根（opus-1）

新文件 `games/bingqi-wangzhe/js/api.js`（所有权 opus-1）导出：

```js
export function registerModules(game)   // game.register('data'|'forge'|'combat', …)
export function createGameFacade(game)  // Object.create(game) + 29 个扁平编排动词
```

`main.js`：`mountApp(root, createGameFacade(registerModules(createGame(...))))`。
`modules.data` 必须含小写 `weapons`/`stages` 数组别名（数据层导出为大写常量，直接整体注册不过
`inspectCapabilities` 探测）；`modules.forge`、`modules.combat` 整体命名空间注册即可。
验收：`inspectCapabilities(facade).ready === true`，且 29 个动词全部为函数。

### R2-P2. Ring-B 编排动词（冻结签名，Result 型返回 `{ok:true,…}|{ok:false,error}`）

```
challengeStage(stageId)  arenaFight(foeId)  setLineup(slot,uid)  clearSlot(slot)
bonds(uids?)  peekIdle(now?)  collectIdle(now?)  weapons()  weapon(uid)
campaign()  arena()  arenaOpponents()  enhanceCost(uid)  estimatePower(uids?)
previewForge(opts)  forgeWeapon(opts)  enhanceWeapon(uid)  dismantleWeapon(uid)
stages()  regions()  forgeStages()  codexEntries()  prototypeCount()
lineup()  lineupUnlocked()  lineupUnlockHint(slot)  levelCap()
staminaCap()  staminaEtaSeconds()
```

- 全部返回**视图模型（VM）**，形状按 mock 的既有输出冻结（六视图的事实契约）；
  data/forge/combat 的 Round 1 导出签名不变，映射只发生在 `api.js`。
- `error` 为中文人话（`data/strings.js` `REASON` 映射）；reason 码不出 facade。
- 战斗种子冻结为纯数值公式（见 fable1 文档 §3.1/3.2），字符串哈希不进热路径。

### R2-P3. gameAdapter（opus-4）

`ORCHESTRATION_VERBS` 扩到 R2-P2 全表；全量分支凡 facade 已提供的动词一律优先
`injected[verb]`（`...guards` 移到对象字面量最后）；内联的 `stages()/codexEntries()/collectIdle()`
直通映射（对真实 core/data 形状是错的）删除或降级为无 facade 兜底。mock 保留给 `?demo=1`。

### R2-P4. 存档增量（opus-1，additive）

`createInitialState`/`hydrate`/`serialize` 补：`state.forge{pity,masterForge,serial,totalForged,log}`、
`state.idle.lastCollectAt/lastAt/totalCollected`（与 `lastCollectMs` 互相兜底）、
`state.arena.log[≤8]`。`SAVE_VERSION` 维持 1，缺失字段按骨架补默认。

### R2-P5. 经济出处（opus-2 / fable-3）

`data/balance.js` 新增冻结键：`FORGE_STAGE_UNLOCK = {iron:0, silver:6, gold:18}`（暂定值）、
`ARENA.dailyAttacks = 5`。挂机速率唯一权威 = `forge/idle.js` + `balance.IDLE_RATES`；
core 的 `idleRatesPerHour` 退役为内部估算，UI 挂机只走 facade 的 `peekIdle/collectIdle`。

### R2-P6. 命名落锤

技能 id snake_case 以 `data/skills.js` `SKILL_BY_ID` 为唯一命名法；战斗事件类型以 combat 实现的
`start|wave|round|action|skill|damage|heal|buff|status|dot|shield|kill|end` 为准，不设别名；
品质字段 `quality`、品质序 `QUALITY_ORDER`（combat/units.js）。

## Round 3 补丁

> 追加式契约（fable-1），实证与复现记录见 `.agent_workspace/round3/fable1-acceptance.md`。
> 与 R2 补丁冲突处以本段为准。备注：R2-P1 规划的 `js/api.js` 实际落位 `js/core/api.js`
> （`installGameApi`），以实现为准，不再迁移。

### R3-P1. 单编排权威（opus-1 / opus-4）

会**改 state** 的编排动词只允许存在一份实现：`core/api.js installGameApi()`。
`ui/live/liveGame.js` 删除全部本地编排 fallback（challengeStage / arenaFight / setLineup /
clearSlot / forgeWeapon / enhanceWeapon / dismantleWeapon / collectIdle / setWeaponLock /
refreshArena）与 `ensureShape()`、`flags.forgeState` 镜像、`drainCorePending()`、本地竞技对手池，
一律严格委托 `runtime.*`，缺失即 throw（禁止静默自实现）。core/api.js 补齐动词全表：R2-P2 表
+ `setWeaponLock(uid,locked)` + `refreshArena()` + `sweepStage(stageId,times=1)`。
竞技对手池唯一：种子推导与 `count/basePower` 收编 liveGame 现行实现，`arenaOpponents()` 与
`arenaFight()` 必须出自同一池。

### R3-P2. 战报形状冻结（引擎形状）

`challengeStage/arenaFight` 的 `result` 冻结为：
`{ engine:true, skillNames, engineVersion, winner, rounds, stars, grade, timeline[]（原始事件，含 t/subtype）,
players[], enemies[], bonds, survivors:number, total:number, rewards, seed, timeout, durationMs, stats,
firstClear?, rankChange? }`。逻辑层**不预转义**文本、不改事件字段名；转义/技能名替换是 UI 渲染层
（text 节点 + `skillNames` 字典）的职责。

### R3-P3. campaign 存档形状冻结

`campaign.cleared:number`（已通关最高关序号）、`campaign.stars: { [stageId]: 0..3 }`、
`campaign.highestStage:number`，以 `core/state.js hydrate()` 为唯一权威。任何层不得再造第二种
campaign 形状；形状修补只允许发生在 hydrate。

### R3-P4. 权威表统一

- 栏位解锁唯一权威：`balance.SLOT_UNLOCK_STAGES = [0,2,4,9,14]`（0 = 开局即有）。
  core 经 `createGame(options.lineupUnlockStages)` 由组合根注入；combat/lineup.js 常量改为同表，
  测试断言三处一致。
- `core/state.js RESOURCE_IDS` 追加 `shardCommon|shardUncommon|shardRare|shardEpic|shardLegendary|shardMythic`，
  `defaultResources()` 补 0 值。shard 不进 `IDLE_RESOURCE_IDS`。

### R3-P5. 开局资源注入

`createGame(options.starter = {coin, iron, stamina})`；`js/main.js` 注入
`{ ...balance.STARTER_KIT, stamina: balance.STAMINA.max }`（startFull）。core 缺省值维持现值，
core 不 import data 的约束不变；tests / bench 一律经 `createBoundGame()` 取得同一注入。

### R3-P6. 扫荡动词

`sweepStage(stageId, times=1)`：该关 `campaign.stars[stageId] > 0` 才可用（`SWEEP_RULES.unlock`）；
每日前 `SWEEP_RULES.freeDaily` 次免体力，之后体力同关卡消耗；掉落用 `game.rng` 实抽
`stage.dropTable`（可复现），即时入账并计 `campaign.daily.sweep`；返回 `{ok, loot, times}`，
失败返回 `{ok:false, error}` 中文文案。

### R3-P7. 音效（opus-4）

新文件 `js/ui/audio.js`：WebAudio 合成音（锤击/克制暴击/胜/负/点击），`AudioContext` 首次用户
手势惰性创建，禁止外部音频资产；开关持久化在 `flags.sound`（经 runtime 落档），设置页可切换。

### R3-P8. 无 mock 成功路径

正常 boot（core + data/forge/combat 齐备）必须 `source==='core'`。`gameAdapter.REQUIRED` 点名
扩到编排动词全表（R3-P1）。任何 mock 兜底（探测失败 / 接线抛错 / `?demo=1`）必须在外壳顶部
渲染**常驻**「演示数据」横幅，不允许仅设置页小字。
