# API 契约（v1.1 · Round 1 复审版）

> 与实现（基线 commit `419f9d7`）逐 action 核对后的精确契约。
> **兼容政策**：action 名永不改；payload 字段与存档字段只增不删；新字段一律可选
> 且带默认值；语义变更必须在 §6「契约偏差与修订清单」立案。
> 实现与本契约不一致处已在 §6 逐条标注，代码修订由对应模块所有者执行。

## 1. Store API

```js
const store = createStore();
store.get();            // → 当前 state（只读视角，禁止调用方修改）
store.dispatch(action); // → 新 state；同步执行 reduce → 持久化 → 通知订阅者
store.subscribe(fn);    // fn(state, action)；返回退订函数
```

- dispatch 是同步的：返回时 reducer 与订阅回调均已完成。
- 持久化节流：非 `TICK` action 每次写盘；`TICK` 距上次写盘 >4s 才写。
- **拒绝信号**：守卫不通过时 reducer 返回原 state（引用相等 `prev === next` 即被拒），
  部分拒绝会附带一条府报 log（见各 action「守卫与拒绝」列）。reducer 永不 throw。

## 2. Store actions

原契约表保留并补全为「实际生效 payload」。约定：`?` = 可选；`now?` 缺省取
`Date.now()`；标 ⚠ 的字段见 §6 偏差清单。

| type | payload（实际生效） | 效果 | 守卫与拒绝 |
| --- | --- | --- | --- |
| `BOOT` | `{ now?, loaded? }` | 载入或建档，结算离线（详见 2.1） | 无档/损档 → 全新默认档 |
| `CHOOSE_FACTION` | `{ faction, name?, now? }` | 人/神/魔 + 道号；发 3 初始弟子、3 初始建筑、初始阵容 | 已有阵营 → no-op |
| `TICK` | `{ now?, dt }` | 资源与修炼推进；dt clamp ≤ 2s | 未选阵营 → no-op |
| `BUILD` | `{ buildingType, x, y }` ⚠D-1（旧文档写 `type`，从未生效） | 占地建造 | 类型非法/未选阵营/格被占/unique 已有/地块满/洞府级不足/资源不足 → 拒（后四种附 log） |
| `UPGRADE` | `{ id }` | 建筑升级 | 无此建筑/达洞府等级上限（mansion 上限 12）/资源不足 → 拒（附 log） |
| `ASSIGN` | `{ discipleId, buildingId }` | 派遣；`buildingId: null` = 撤回；抢占式（顶替原驻守者） | 弟子不存在 → 静默无效果 |
| `RECRUIT` | `{ heroId }` | 解锁仙友入府，建同名弟子并自动入阵（<6 席时）。费用 `jade: 6(+2 若 dps), stone: 40` | 英雄不存在/已解锁 → no-op；资源不足 → 拒（附 log）。⚠不限阵营，见 AD-15 |
| `TRAIN` | `{ discipleId }` | 消耗丹药+灵草升专业。费用 `pills: 2+3·prof, herb: 8+6·prof` | 弟子不存在/资源不足 → 拒（附 log） |
| `CULTIVATE` | `{}` | 吞吐灵气涨修为：-4 qi，+`6+realm.index` exp | qi < 4 → no-op |
| `BREAKTHROUGH` | `{ now?, rng? }` ⚠D-3（`now` 当前未被读取；`rng` 为追加的注入点，测试用） | 尝试破境（成功/失败语义见 ARCHITECTURE §4.3） | exp 未满 → 拒（附 log） |
| `SET_PARTY` | `{ heroIds }` | 设阵容：过滤未解锁、截断 6 席、主角（`mc-*`）强制在场 | 永远成功（自动纠正） |
| `EQUIP_ARTIFACT` | `{ artifactId, slot? }` ⚠D-2（`slot` 当前被忽略；佩戴为 4 件 FIFO） | 佩戴法器 | 未拥有 → no-op |
| `START_TOWER` | `{ now? }` | 挑战当前层；seed = `(now ^ floor×9973) >>> 0`；结果即刻算出存入 `state.combat` | ⚠无守卫（AD-13）：会覆盖未结算战斗 |
| `START_WAVE` | `{ now? }` | 兽潮下一波；seed = `(now ^ wave×7919) >>> 0`；同上 | 同上 |
| `RESOLVE_COMBAT` | `{ now? }`（`now` 当前未被读取） | 结算当前战斗：唯一发奖点；推进 floor/wave/best；按 best 里程碑解锁法器；败战惩罚（见 2.2） | `combat == null` → no-op |
| `COLLECT_OFFLINE` | `{ now? }`（`now` 当前未被读取） | 领取挂机匣：`offline.pending` 入账并清空 | 无待领 → no-op |
| `RESET` | `{}` | 清档（含 localStorage）回到选阵营门态 | 永远成功 |

### 2.1 `BOOT` 细则

1. `loaded` 字段（追加）：注入已加载的 state 以绕过 localStorage（单测/迁移工具用）；
   缺省走 `loadSave()`。
2. 离线结算：`elapsed = clamp((now − loaded.meta.lastTick)/1000, 0, 8×3600)` 秒；
   产出 = `produce(loaded, elapsed)`（纯建筑产量 + 境界灵气趵息，不模拟战斗）。
3. `elapsed > 8`（秒，⚠阈值见 AD-16）→ 产出入 `offline.pending` 等 `COLLECT_OFFLINE`；
   否则直接入账。`meta.lastTick` 无条件推进到 `now`。

### 2.2 `RESOLVE_COMBAT` 细则

- **塔胜**：`towerReward(floor, win)` 入账；`floor+1`；`best = max(best, floor)`；
  best 达 5/10/15 分别解锁 `zhumo` / `wanhun` / `zhuque`。
- **塔败**：安慰奖 `{stone:4, qi:8}`；层数不掉。
- **潮胜**：`waveReward(wave, win)` 入账；`wave+1`；best 达 5/8 解锁 `canyang` / `yaoguang`。
- **潮败**：库存 `herb/wood/ore` 各扣 30%（clamp ≥0）。⚠与 GDD「未收取资源」表述
  不符，见 AD-12。
- 任意分支结束后 `combat = null`，同一场战斗不可重复领奖。

## 3. 纯函数导出

原六条保留（签名按实现修正），新增补登实际存在的导出。**返回值不得改输入对象**
（`simulate` 内部对自建 unit 副本可变，输入 `state`/`foes` 不受影响——已核对）。

| 模块 | 导出 | 说明 |
| --- | --- | --- |
| `mansion/production.js` | `produce(state, dtSec) → YieldMap` | 全建筑每秒产量 × dt；含驻守弟子、等级、灵脉邻接、境界灵气 |
| | `applyYield(resources, add) → resources'`（补登） | 记账合并（忽略 `loseTax` 键） |
| | `combatBuildingBonus(buildings) → { atk }`（补登） | 丹房 +4·lv、锻造房 +3·lv |
| `mansion/layout.js` | `adjacencyBonus(buildings, x, y) → number` ⚠D-5：首参是**建筑数组**，旧文档误写 `grid` | 每条邻接灵脉 +0.15 |
| | `occupancy(buildings) → grid[y][x]`（补登） | 6×6 占位矩阵 |
| | `canPlace(buildings, x, y) → bool`、`countType(buildings, type) → number`（补登） | |
| `combat/battle.js` | `simulate(input) → SimResult` | 见 §4 |
| `combat/artifacts.js` | `applyTriggers(ctx, event) → notes[]` ⚠D-6：**尚未接线**（战斗内核硬编码触发），保留为数据驱动化目标接口 | |
| | `collectPassives(equippedIds)`、`hasArtifact(equipped, id)`（补登） | passive 聚合 / 判存 |
| `combat/tower.js` | `challengeTower(state, now)`、`towerReward(floor, win)`（补登） | store 编排用 |
| `combat/wave.js` | `challengeWave(state, now)`、`waveReward(wave, win, resources)`（补登） | 败战返回 `{ loseTax }` |
| `progression/realm.js` | `breakthroughChance(state) → 0 或 [0.08, 0.92]` | `0.42 − 0.03·index + min(0.4, 0.08·heartDemon) + min(0.2, pills/80)`；exp 未满恒 0 |
| | `canCultivate`、`applyCultivate`、`applyBreakthrough(state, rng)`（补登） | |
| `disciples/assign.js` | `yieldMultiplier(disciple, building) → number` | 采集看勤勉、工坊看武力、皆吃专业 |
| `disciples/roster.js` | `makeDisciple`、`trainCost`、`canTrain`、`applyTrain`（补登） | |
| `disciples/train.js` | `scriptureXp(state, dtSec) → disciples'`（补登） | ⚠语义争议见 AD-17 |
| `core/save.js` | `loadSave`、`writeSave`、`clearSave`、`SAVE_KEY`、`SCHEMA`（补登） | 信封格式见 §5 |
| `core/engine.js` | `startEngine({ store, render, tickMs=100 }) → stop()`（补登） | |
| `core/events.js` | `createBus() → { on, emit }`（补登） | ⚠当前无调用方（AD-4），预留 |
| `data/*` | 常量表 + `heroById`/`artifactById`/`realmAt`/`realmPower`/`factionAdvantage`/`towerEnemy`/`waveEnemy`/`upgradeCost`/`buildCost`/`mansionCap`/`STARTER`/`STARTER_ARTIFACTS`（补登） | 纯数据，零依赖 |

## 4. `simulate` 输入 / 输出 Schema

```js
// 输入
{
  seed: uint32,            // 必填；同版本同输入 ⇒ 逐字段相同输出
  heroIds: heroId[],       // 我方（side "a"），按 party 序
  foes: Foe[],             // 敌方（side "b"）；Foe = { id, name, faction, role,
                           //   atk, hp, def, boss? }
  state,                   // 只读：realm（境界加成）与 buildings（丹房/锻造加攻）
  equipped?: artifactId[], // 生效法器，默认 []
  maxTicks?: number,       // 默认 240（0.25s/tick ⇒ 60s 上限）
}

// 输出（SimResult）
{
  winner: "a" | "b",       // 超时判定：存活多者胜，平手判 "a"
  ticks: number,
  seed: uint32,            // 回传，便于战报存档复现
  frames: [{
    tick, winner,          // winner 在终局帧前为 null
    log: [{ t: "hit"|"skill"|"aoe"|"heal"|"shred"|"burn"|"chase",
            src?, target?, dmg?, crit? }],
    units: [{ id, name, side, hp, maxHp, shield, alive, boss }],
  }],
}
```

战斗常数（数值归 Fable-3/GDD，此处登记为契约现状）：伤害 `max(1, raw − 0.35·def)`；
基础暴击 我方 8% / 敌方 6%，暴伤 ×1.5（女娲 ×1.9）；攻速 dps 1.05s / 其余 1.25s；
技能节奏「每 5 tick、非坦克」（⚠应为 `ultCd/haste`，见 AD-5）；阵营克制
神→魔、魔→人、人→神 ×1.18，逆向 ×0.92。

确定性契约：`simulate` 内禁止 `Date.now` / 未播种 `Math.random` / 无序容器遍历；
`tests/combat.test.js` 以同 seed 双跑断言 `winner`、`ticks`、终帧 HP 全等。
跨版本回放以 `frames[]` 为工件，seed 仅同版本有效（见 ARCHITECTURE §7）。

## 5. 存档契约

- 键：`localStorage["zaohua-xianfu-v1"]`
- 信封：`{ schemaVersion: 1, state, savedAt }`；`state` 全字段见 ARCHITECTURE §3.1
- 版本不符/解析失败 → `loadSave()` 返回 `null`（⚠应立案迁移链与 saveCorrupt 事件，
  见 AD-14、AD-6）
- 字段演进规则：只增不删；新增字段必须在 BOOT 路径给缺省值（老档载入不崩）

## 6. 契约偏差与修订清单（Round 1 核对结果）

「方向」列：**改文档** = 契约从实（本版已改）；**改代码** = 实现按契约修，对应
ARCHITECTURE §9 架构债编号。

| # | 偏差 | 方向 | 修订 |
| --- | --- | --- | --- |
| D-1 | `BUILD` 旧契约 payload 写 `{ type, x, y }`，与 `action.type` 冲突，实现读的是 `buildingType`（UI 亦然） | 改文档（本版已按实标注；`type` 字段名保留在历史记录，不复用） | — |
| D-2 | `EQUIP_ARTIFACT` 的 `slot` 字段被实现忽略；佩戴为 4 件 FIFO 无槽位约束 | 改代码 | AD-8：按 attack/defend/util×2 落位，`slot` 升级为生效字段 |
| D-3 | `BREAKTHROUGH` 的 `now` 未被读取；实现另接受 `rng` 注入（原契约未记） | 改文档（`rng` 作为追加字段收编；`now` 保留备用） | — |
| D-4 | `RESOLVE_COMBAT` / `COLLECT_OFFLINE` 的 `now` 未被读取 | 改文档（字段保留，标注现状） | — |
| D-5 | `adjacencyBonus` 首参实为 `buildings` 数组，旧文档写 `grid` | 改文档（本版已修正签名） | — |
| D-6 | `applyTriggers` 在契约中承诺、战斗内核未接线（触发硬编码） | 改代码 | AD-4：战斗事件数据驱动化 |
| D-7 | `taixu`/玄女的 `ultHaste` 被固定技能节奏覆盖，passive 无效（运行时验证同 seed 结果不变） | 改代码 | AD-5 |
| D-8 | 旧契约漏记大量实际导出（`applyYield`、`occupancy`、`challengeTower`… ） | 改文档（本版 §3 已补登） | — |
| D-9 | 「返回值不得改输入对象」在 reducer 侧存在豁免（BOOT 读盘、RESET 清盘、pushLog 取 Date.now） | 改文档 + 改代码 | 豁免清单已写入 ARCHITECTURE §8.4；pushLog 时间戳注入化为 AD-3 |
| D-10 | `TRAIN` 旧描述「消耗丹药」，实际消耗丹药+灵草 | 改文档（本版已按实标注费用公式） | — |
| D-11 | 架构文档曾承诺「存档损坏记 saveCorrupt 事件」，未实现 | 改代码 | AD-6 |
| D-12 | 兽潮败战税基（库存 30%）与 GDD（当波未收取资源 30%）不一致 | 改代码（推荐）或改 GDD | AD-12，Fable-3 定案 |
| D-13 | `START_TOWER`/`START_WAVE` 缺守卫（空阵容/未选阵营/覆盖未结算战斗） | 改代码 | AD-13 |
| D-14 | `RECRUIT` 不限阵营（UI 过滤但 reducer 放行）、UI 价格文案与真实费用不符 | 改代码 | AD-15 |

### 6.1 契约验证探针

- `npm test`：16 项单测覆盖确定性、邻接、扣费、突破补偿等契约点（当前全绿）。
- `npm run probe`：模块导出与端口 4174 契约。
- `npm run bench`：200 场 `simulate` < 800ms 性能契约。
- 修复 §6 任何「改代码」项时，GPT-sol-1 须在 `tests/` 补对应探针后方可勾销。
