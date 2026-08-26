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
