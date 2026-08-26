MODEL_SLUG: claude-fable-5-thinking-xhigh

# Round 2 · fable-1 架构复审与 `game.api` 接口冻结

> 范围：只冻结接口与组装规范，不改实现代码。
> 依据：`.agent_workspace/round1/BRIEF.md` 遗留缺陷 1（UI 走 mock）、2（多套漂移）、5（存档缺口）。
> 冻结增量已同步写入 `.agent_workspace/ARCHITECTURE.md` 的 `## Round 2 补丁` 段。
> 本文中「必须 / 禁止」为 Round 2 验收条款；「建议」为非阻塞项。

---

## 0. 复审结论（一句话版）

mock 的对外形状就是六视图的**事实契约**（约 40 处调用点已按它编码），而 data/forge/combat 的原生返回
形状与之存在系统性偏差（字段名、数组 vs 计数、快照 vs 数目、reason 码 vs 中文 error）。
**裁定：UI 契约按 mock 形状冻结；全部形状映射集中到一个新的编排模块 `js/api.js`（组合根扩展，opus-1 所有权）**。
逻辑层（forge/combat/data/core）Round 1 的导出签名全部维持不变，不为 UI 改一行。

---

## 1. 三环模型：`mountApp(root, game)` 收到的 `game` 全表面

UI 唯一对话对象是 `createUiGame(injected)` 的返回值。`injected` 必须同时满足三环：

```
Ring-A  core 运行时       —— createGame() 原生提供（state/bus/tick/save/reset…）
Ring-B  编排动词（本轮冻结）—— js/api.js 以顶层函数挂到 facade 上
Ring-C  模块命名空间       —— game.register('data'|'forge'|'combat', …) 喂给能力探测
```

### 1.1 Ring-B 冻结签名总表（29 个动词，全部同步、全部不抛预期错误）

统一约定：

- **Result 型**动词（会写 state）返回 `{ ok:true, ... }` 或 `{ ok:false, error:string }`；
  `error` 为**中文人话**，由 `data/strings.js` 的 `REASON[reason]` 映射，UI 直接 toast，不再翻译。
- **Getter 型**动词（纯读）直接返回视图模型（VM），不包 `ok`。
- 所有时间参数可省略，缺省取 `game.clock.nowMs()`；**动词内部禁止 `Date.now()`**。

```js
/* ---- 战斗 / 试炼 ---- */
challengeStage(stageId: string)
  → { ok:false, error }                                  // 前置未通关 / 体力不足 / 空阵 / 关卡不存在
  | { ok:true, stage: StageVM, result: BattleResultVM }  // 已扣体力、已发奖励、已推进 campaign

arenaFight(foeId: string)
  → { ok:false, error }                                  // 次数用尽 / 空阵 / 对手不存在
  | { ok:true, foe: ArenaFoeVM,
      result: BattleResultVM & { rankChange: number } }  // 已扣次数、已结算积分/名次、已写 arena.log

estimatePower(uids?: (string|null)[]) → number           // 省略取 state.lineup；委托 combat.estimatePower

/* ---- 竞技 ---- */
arena()          → ArenaVM
arenaOpponents() → ArenaFoeVM[]                           // 同 state+seed 必须返回同一张表（本日内稳定）

/* ---- 战阵 ---- */
lineup()             → (string|null)[]                    // 长度恒为 5
lineupUnlocked()     → number                             // 1..5，委托 core.unlockedLineupSlots()
lineupUnlockHint(slot: number) → string
setLineup(slot: number, uid: string) → { ok:true } | { ok:false, error }
                                                          // 同 uid 已在他槽则先移除（去重语义冻结）
clearSlot(slot: number) → { ok:true }
bonds(uids?: (string|null)[]) → BondVM[]                  // 省略取 state.lineup

/* ---- 兵器 / 图鉴 ---- */
weapons()            → WeaponVM[]                         // 全背包
weapon(uid: string)  → WeaponVM | null
codexEntries()       → CodexEntryVM[]                     // 41 条原型全量，含未发现
prototypeCount()     → number
levelCap()           → number                             // 全局最大（神话上限）；单件上限看 WeaponVM.levelCap

/* ---- 锻造 ---- */
previewForge(opts: ForgeOpts) → ForgePreviewVM            // 纯读，不耗 rng
forgeWeapon(opts: ForgeOpts)
  → { ok:false, error }
  | { ok:true, weapon: WeaponVM, isNew: boolean,
      reveal: RevealStep[], resultLine: string }          // reveal 直通 forge 层返回
enhanceWeapon(uid: string)
  → { ok:false, error }
  | { ok:true, weapon: WeaponVM, unlockedSlot: number,    // 0 = 本次未开槽
      cost: CostMap }
enhanceCost(uid: string) → CostMap | null                 // 必须逐字段等于 forge.enhanceCostFor()
dismantleWeapon(uid: string)
  → { ok:false, error } | { ok:true, refund: CostMap }

/* ---- 挂机 / 资源 ---- */
peekIdle(now?: number)    → IdlePeekVM                    // 纯读
collectIdle(now?: number) → { ok:false, error } | ({ ok:true } & IdlePeekVM)
staminaCap()              → number                        // = RESOURCE_CAPS.stamina (120)
staminaEtaSeconds()       → number                        // 距下一点体力的秒数；满体力返回 0

/* ---- 数据表（视图版） ---- */
stages()      → StageVM[]                                 // 40 条
regions()     → RegionVM[]                                // 8 章
forgeStages() → ForgeStageVM[]                            // iron/silver/gold 三条
```

`ForgeOpts = { stage:'iron'|'silver'|'gold', elementBias?: 'fire'|'ice'|'thunder'|null, useLucky?: boolean, useMasterForge?: boolean }`
`CostMap = Record<resourceId, number>`（整数，resourceId ∈ core.RESOURCE_IDS）。

### 1.2 Ring-A（core 直通，已由 gameAdapter 全量分支接好，维持冻结）

```js
get state()                 // 只读；UI 禁止写
subscribe(fn: (type: string, payload: any) => void) → unsubscribe
emit(type, payload)
tick(now?: number)          // 心跳；main.js 每秒调一次
resources() → Record<resourceId, number>
save() / reset()
// 适配器元数据（设置页展示）：
hasCore: boolean, source: string,
capabilities: [{ key, label, ready }], pendingLabels: string[]
```

### 1.3 视图模型（VM）形状冻结

以下形状**只增不改**。映射规则一并冻结（右侧注明数据来源）。

```js
WeaponVM = {
  uid, protoId, quality, level, locked, obtainedAt,       // 实例字段直通
  affixes: [{ id, name, value, text }],                   // name/text 由 data/affixes.js 装配
  name, title, type, element, lore, tags,                 // ← WEAPON_BY_ID[protoId]
  skill: SkillVM,                                         // ← SKILL_BY_ID[proto.skillId]
  skillSlots: number,                                     // 已解锁槽数（forge.skillSlotsFor(level)）
  stats: { atk, hp, speed, crit, ... },                   // ← forge.computeWeaponStats(weapon)
  power: number,                                          // ← combat.estimatePower(state, [uid])
  levelCap: number,                                       // ← forge.levelCapFor(quality)
  equippedSlot: number,                                   // state.lineup.indexOf(uid)，-1 = 未上阵
}

StageVM = {                                               // ← data/stages.js STAGES 映射
  id, index, name, element, isElite, staminaCost,
  regionId: stage.chapterId,      regionName: stage.chapterName,
  powerReq: stage.recommendPower,                         // 字段改名，UI 已按 powerReq 编码
  waves: stage.waves.length,                              // UI 只要计数；原始波次数组不出 VM
  bossName: isElite ? chapter.bossName : null,
  rewards: { coin, ...materials },                        // 胜利奖励拍平为 CostMap
}

RegionVM = { id, name, subtitle, element, bossName }      // ← data CHAPTER_LIST

ForgeStageVM = { id, name, hint, unlockCleared }          // name/hint ← strings.FORGE_STAGE_NAME/DESC
                                                          // unlockCleared ← balance.FORGE_STAGE_UNLOCK（见 §4.2）

ForgePreviewVM = {                                        // ← forge.previewForge 映射
  stage, stageName, hint,
  locked: boolean, lockHint: string,                      // campaign.highestStage < unlockCleared
  costs: [{ id, need, have, ok }],                        // cost map + state.resources 拼装
  odds: Record<quality, number>,                          // ← qualityChances[].chance（0..1，含保底修正）
  masterForgeReady: boolean,                              // ← masterForge.available
  canForge: boolean,                                      // = !locked && canAfford && bag 未满
  pity: { epic, legendary, epicThreshold,
          legendaryThreshold, guaranteed },               // 直通，UI 可做保底进度条
}

BattleResultVM = {
  winner: 'player'|'enemy'|'draw',
  rounds: number, stars: 0|1|2|3,
  survivors: number, total: number,                       // ← engine.survivors.length / players.length（数目！）
  timeline: TimelineRowVM[],
  rewards: CostMap,                                       // 实发数（零值剔除）
  engine: <simulateBattle 原始返回>,                       // 原样保留：golden 测试、fx、战报回放共用
}

TimelineRowVM = {                                         // ← engine 事件映射
  round: number,                                          // event.round
  kind: 'ally'|'foe'|'sys',                               // side 'player'→'ally'，'enemy'→'foe'，无 side→'sys'
  element: string|null,
  text: string,                                           // 允许 <b>/<span class="dmg|crit"> 白名单标记；
}                                                         // 其余源字段一律不当 HTML 注入

ArenaVM = {
  rank: number, points: number,                           // points ← state.arena.rating
  ticketsLeft: number,                                    // = ARENA_DAILY_ATTACKS(5) - arena.daily.attacks
  log: [{ at, foe, win, rankChange }],                    // ≤ 8 条，新在前
}

ArenaFoeVM = {                                            // ← combat.generateArenaOpponents 映射
  id: string, rank: number,                               // id = `foe_${序号}`；rank = 表内序号+梯度
  name, title, element, power, points,
  difficulty: 'easy'|'even'|'hard',                       // power/我方战力 <0.88 / >1.12 / 其余
  squad: string[],                                        // ← opponent.lineup（protoId 列表）
  engine: <原始 opponent>,                                 // arenaFight 内转 arenaOpponentToWaves 用
}

BondVM = {                                                // ← combat.computeBonds 映射
  id, name, desc,
  active: boolean,                                        // count 达标即 active
  detail: string,                                         // 「刀×2 / 尚未成型」类人话
  value: number,                                          // 聚合主数值（展示用）
  engine: <原始 bond>,                                     // kind/tier/effects/members 全保留
}

CodexEntryVM = { ...proto, skill: SkillVM,
  found: boolean, count: number, bestQuality: string|null }
  // found/count ← state.codex.discovered[protoId]；bestQuality ← state.codex.bestQuality[protoId]

IdlePeekVM = {                                            // ← forge.previewIdle 映射
  loot: CostMap,                                          // ← gains
  seconds: number,                                        // ← floor(cappedMs / 1000)
  capped: boolean, empty: boolean,                        // empty = !ready || loot 全空
}

SkillVM = data/skills.js 的原条目（id 为 snake_case，冻结为唯一技能命名法）
RevealStep = forge 返回的 { step, text, reveals, quality? } 直通
```

---

## 2. 组合根规范：让 `inspectCapabilities(game).ready === true`

### 2.1 能力探测的逐项要求（读 `gameAdapter.js` 得出，勿改探测逻辑）

| 位 | 判定条件 | 满足方式 |
| --- | --- | --- |
| `core` | `injected.state && injected.bus && isFn(injected.tick)` | `createGame()` 原生满足 |
| `data` | `Array.isArray(modules.data.weapons) && Array.isArray(modules.data.stages)` | 注册**小写别名**命名空间（data 层导出是大写 `WEAPONS/STAGES`，直接 `import *` 不过检） |
| `forge` | `modules.forge` 有 `previewForge/forgeWeapon/enhanceWeapon/dismantleWeapon/collectIdle` 五函数 | `import * as forge from './forge/index.js'` 整体注册即满足 |
| `combat` | `modules.combat` 有 `estimatePower/simulateBattle/generateArenaOpponents` 三函数 | `import * as combat from './combat/index.js'` 整体注册即满足 |

### 2.2 `main.js` 组合根伪代码（冻结；opus-1 实现）

新文件 **`games/bingqi-wangzhe/js/api.js`**（所有权：opus-1，与 main.js 同级同主）。
main.js 保持"只做 boot"，全部编排逻辑住在 api.js。

```js
// ---------- js/api.js ----------
import * as core   from './core/index.js';
import * as forge  from './forge/index.js';
import * as combat from './combat/index.js';
import * as data   from './data/index.js';

/** Ring-C：把三个模块命名空间挂到 game.modules（供能力探测与测试直取）。 */
export function registerModules(game) {
  game.register('data', {
    weapons: data.WEAPONS, stages: data.STAGES,            // ← 探测必需的小写别名
    skills: data.SKILLS, strings: { REASON: data.REASON }, // 便捷别名
    raw: data,                                             // 全量命名空间兜底
  });
  game.register('forge', forge);
  game.register('combat', combat);
  return game;
}

/** Ring-B：返回 facade = Object.create(game) + 29 个编排动词（own property）。
 *  用原型链而非展开/改写：
 *  - 不污染 core 运行时（core 自己的 collectIdle 语义保留在原型上，测试仍可调）；
 *  - facade.state / .bus / .tick 经原型透传，hasCoreRuntime 探测照常通过；
 *  - 动词重名（collectIdle）由 own property 覆盖，displaced 而非 mutated。 */
export function createGameFacade(game) {
  const g = Object.create(game);
  const now = () => game.clock.nowMs();
  const err = (reason) => ({ ok: false, error: data.REASON[reason] ?? String(reason) });

  Object.assign(g, {
    /* 每个动词：①校验 → ②调领域函数（就地改 state）→ ③映射 VM → ④bus.emit → ⑤save 调度 */
    challengeStage(stageId) { /* §3.1 流程 */ },
    arenaFight(foeId)       { /* §3.2 流程 */ },
    setLineup(slot, uid)    { /* 去重 + 槽位校验 */ },
    clearSlot(slot)         { /* … */ },
    bonds:        (uids) => mapBonds(combat.computeBonds(units(uids))),
    peekIdle:     (at = now()) => mapIdle(forge.previewIdle(game.state, at)),
    collectIdle:  (at = now()) => mapCollect(forge.collectIdle(game.state, at)),
    weapons:      () => game.state.weapons.map((w) => toWeaponVM(game.state, w)),
    weapon:       (uid) => { const w = forge.findWeapon(game.state, uid);
                             return w ? toWeaponVM(game.state, w) : null; },
    campaign:     () => toCampaignVM(game.state),
    arena:        () => toArenaVM(game.state),
    enhanceCost:  (uid) => { const w = forge.findWeapon(game.state, uid);
                             return w ? forge.enhanceCostFor(w) : null; },
    previewForge: (opts) => toPreviewVM(forge.previewForge(game.state, opts), game.state),
    forgeWeapon:  (opts) => mapForge(forge.forgeWeapon(game.state, opts, game.rng)),
    enhanceWeapon:(uid)  => mapEnhance(forge.enhanceWeapon(game.state, uid)),
    dismantleWeapon: (uid) => mapDismantle(forge.dismantleWeapon(game.state, uid)),
    estimatePower: (uids) => combat.estimatePower(game.state, uids ?? game.state.lineup),
    arenaOpponents: () => mapFoes(combat.generateArenaOpponents(game.state, arenaSeedRng())),
    stages:        () => STAGE_VMS,        // 模块级一次性预映射（纯数据，无需每次重算）
    regions:       () => REGION_VMS,
    forgeStages:   () => FORGE_STAGE_VMS,
    codexEntries:  () => data.WEAPONS.map((p) => toCodexVM(game.state, p)),
    prototypeCount:() => data.WEAPONS.length,
    lineup:        () => game.state.lineup,
    lineupUnlocked:() => game.unlockedLineupSlots(),
    lineupUnlockHint: (slot) => `通关第 ${core.LINEUP_UNLOCK_STAGES[slot]} 关解锁`,
    levelCap:      () => forge.levelCapFor('mythic'),
    staminaCap:    () => core.RESOURCE_CAPS.stamina,
    staminaEtaSeconds() { /* 由 state.idle.staminaCarryMs 推算 */ },
  });
  return g;
}

// ---------- js/main.js（改动最小化）----------
import { registerModules, createGameFacade } from './api.js';

function boot() {
  const game = createGame({ now: () => Date.now(), storage: createAutoAdapter(),
                            saveKey: SAVE_KEY, tzOffsetMinutes: ... });
  const facade = createGameFacade(registerModules(game));
  if (root) mountApp(root, facade);                        // ← 传 facade，不再传裸 game
  const timer = setInterval(() => game.tick(), TICK_MS);
  // visibilitychange / pagehide / beforeunload 存档钩子维持 Round 1 原样
  window.__BQWZ__ = { game, facade, stop: ... };
}
```

**验收断言（gpt-sol 必测）**：

```js
import { inspectCapabilities } from '../js/ui/gameAdapter.js';
const facade = createGameFacade(registerModules(createGame({ now: () => 0 })));
assert.deepEqual(inspectCapabilities(facade),
  { core: true, data: true, forge: true, combat: true, ready: true });
for (const v of ORCHESTRATION_VERBS) assert(typeof facade[v] === 'function');
```

### 2.3 gameAdapter 侧的配套义务（opus-4）

1. 全量分支中**凡 facade 已提供的 Ring-B 动词，一律优先取 `injected[verb]`**；
   现有的内联映射（`stages: () => dataApi.stages`、`collectIdle: forgeApi.collectIdle` 直通、
   `codexEntries` 读 `state.codex[proto.id]`——这三处对着真实 core/data 形状是**错的**）降级为
   无 facade 时的兜底或直接删除。实操最小改法：把 `...guards` 展开移到对象字面量**最后**，
   并把 §1.1 全部 29 个动词纳入 `ORCHESTRATION_VERBS`。
2. `subscribe` 回调签名 `(type, payload)` 维持不变。
3. mock 保留（`?demo=1` 视觉走查仍需要），但 `ready===true` 路径禁止触碰 mock 的任何数据。

---

## 3. 编排动词内部流程冻结（防止奖励/种子逻辑散落 UI）

### 3.1 `challengeStage(stageId)`

```
① stage = STAGE_BY_ID[stageId]；无 → err('invalid_stage')
   stage.index > campaign.highestStage + 1 → { ok:false, error:'前置关卡未通关' }
② lineup 空 → error；canAfford({stamina}) 失败 → error
③ battleSeed = (normalizeSeed(state.seed) + stage.index * 7919
                + state.campaign.attempts * 104729) >>> 0        ← 冻结公式（纯数值，绕开
                                                                    core/combat 两套字符串哈希）
④ result = combat.simulateBattle({ playerWeapons: 上阵实例, enemyWaves: stage.waves,
                                    rng: createRng(battleSeed), mode:'campaign' })
⑤ spend stamina；attempts += 1
⑥ 胜：发 stage.rewards（+首通 firstClear）→ addResource（走 core tracked 版本）
      stars 取 max；highestStage 推进
⑦ emit 'battle:end' { kind:'campaign', stageId, result }；save()
⑧ 返回 { ok:true, stage: StageVM, result: BattleResultVM }
```

### 3.2 `arenaFight(foeId)`

对位流程；种子 `(normalizeSeed(state.seed) ^ 0x51ed270b) + foe.rank * 7919 + arena.daily.attacks * 104729) >>> 0`；
敌方波次经 `combat.arenaOpponentToWaves(foe.engine)`；胜负结算积分/名次/`arena.log`（unshift、截 8）；
emit `'battle:end' { kind:'arena', ... }`。**同一 battleSeed 重放必须复现同一 timeline**（golden 测试依赖）。

### 3.3 每日重置归属

`core.resetDaily`（心跳内已调）负责清零 `campaign.daily` / `arena.daily` / masterForge 日键；
api.js 只读这些字段派生 `ticketsLeft`，**不得自设第二套日界线**（时区一律 `flags.tzOffsetMinutes`）。

---

## 4. 存档与经济的接口级裁定

### 4.1 存档 schema 增量（opus-1，`SAVE_VERSION` 维持 1，字段为 additive 补默认）

`core/state.js` 的 `createInitialState`/`hydrate`/`serialize` 必须补齐：

```js
state.forge = {                    // forge 层运行时已就地写这些字段，hydrate 丢弃 = 保底/序列号丢档
  pity: { iron:{epic,legendary}, silver:{...}, gold:{...} },
  masterForge: { dayKey, used },
  serial: number, totalForged: number, log: string[≤N],
}
state.idle.lastCollectAt / lastAt / totalCollected   // forge/idle.js 使用的锚点，需与
                                                     // core 的 lastCollectMs 在 hydrate 中互相兜底
state.arena.log = [{ at, foe, win, rankChange }]     // ≤8；ArenaVM.log 的存储面
```

hydrate 规则沿用 R1 补丁 P4：以 initial 为骨架合并、未知字段保留、非法值修复。

### 4.2 经济常量的唯一出处 = `data/balance.js`（opus-2 按 fable-3 表重写）

本轮**冻结键名**（值由 fable-3 定，未定前沿用现值/mock 值）：

```js
export const FORGE_STAGE_UNLOCK = { iron: 0, silver: 6, gold: 18 };  // ← mock 现值，暂定
export const ARENA = { dailyAttacks: 5, /* 奖励与积分参数 fable-3 补 */ };
```

挂机速率**唯一权威 = forge/idle.js + balance.IDLE_RATES**；
`core/state.js` 的 `idleRatesPerHour` 占位表退役为「core 内部 pending 估算」，
UI 的挂机读写一律走 `peekIdle`/`collectIdle` 两个 facade 动词——**core 的
`game.collectIdle`（资源 pending 版）不再暴露给 UI**（被 facade own property 遮蔽，原型上仍可测）。
Round 3 再做两套挂机记账的物理合并；Round 2 只保证 UI 单一入口，不双发奖励。

### 4.3 命名统一（复述 R1 简报，接口层面落锤）

- 技能 id：**snake_case，以 `data/skills.js` 的 `SKILL_BY_ID` 为唯一命名法**；
  规格文档中 `flameSlash` 类 camelCase 一律视为笔误，不进代码。
- 战斗事件类型：以 combat 已实现的
  `start|wave|round|action|skill|damage|heal|buff|status|dot|shield|kill|end` 为准；不再提供别名。
- 品质字段名 `quality`（已一致）；品质序 `QUALITY_ORDER` 以 combat/units.js 导出为准。
- 字符串种子：接口层**不使用**字符串哈希（见 §3.1 纯数值公式），core `xfnv1a` 与 combat `xmur3`
  的分歧因此不进热路径；测试只锁数值种子路径。

---

## 5. 仍未冻结的风险（按严重度）

1. **timeline 文案的 HTML 白名单（中）**：mock 用 `<b>/<span class="dmg|crit">` 富文本，engine 的
   `text` 是纯文本。VM 映射谁来加富标记冻结给了 api.js（opus-1），但具体标记模板未冻结——
   opus-4 若在 UI 侧二次加工会出现双重加粗。约定：api.js 产出的 `text` 即终稿，UI 只渲染。
2. **经济数值本体（中）**：本文只冻结键名与出处；fable-3 的 8 锤史诗保底（`FORGE_PITY.gold.epic = 8`
   已符合）、首锻精钢保底、竞技奖励曲线等具体值未定，golden 测试在数值落定前只能锁结构不锁数值。
3. **两套挂机记账并存（中）**：§4.2 只做了「UI 单入口」隔离，core 的 `idle.pending` 与 forge 的
   `lastCollectAt` 在存档里同时存在；若 Round 2 有人从 core 路径发奖会双计。测试须断言：
   同一存档跑 1h，`collectIdle` 前后资源增量 = forge 速率表值（而非两表之和）。
4. **`arenaOpponents` 的当日稳定性（低）**：combat 版对手表由传入 rng 驱动，重复调用会消耗主 rng
   使表漂移。api.js 必须用独立派生种子（`seed ^ 0x51ed270b ^ dayIndex`）而非 `game.rng`；
   已写进 §2.2 伪代码（`arenaSeedRng()`），实现漏掉会表现为「每次切 tab 对手洗牌」。
5. **战斗模型之争遗留（低）**：ATB（fable-2 规格）vs 回合速度重排（opus-3 实现）——本轮裁定
   **实现为准**，fable-2 的 12 技公式按 skills.js 的 handler 口径校数值；ATB 提案封存到 Round 3+。
6. **mockGame 的退役时点（低）**：`ready===true` 后 mock 仅剩 `?demo=1` 用途；其 ~1000 行与真实
   逻辑的重复维护成本记账给 Round 3，本轮禁止删除（UI 回退保险）。
7. **碎片资源（fragments）（低）**：简报提到但 data/forge 均无此资源；不冻结、不实现，
   若 fable-3 经济表需要，走 `RESOURCE_IDS` 开放 map 的既有扩展点。
