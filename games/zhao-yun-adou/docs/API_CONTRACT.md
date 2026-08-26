# API 契约（模块边界 · Round 2 回签版）

> 与代码逐行核对的精确签名。基线 commit `a73875e`（代码至 `4ac3f8c`）：Round 1 全部十路工作已合入，原【在途·R1】标记一律回签为现行契约（无标记即已实现）。
> 标记：**【在途·R2】** Round 2 并行 agent 工作区已有、未提交，提交后须回签；**【缺口】** 声明的后续变更，当前不存在。
> 类型标注为 TS 风格伪码，实际全部是无类型 ESM JS。

## 1. 总则

1. **突变所有权**：`state` 只允许被 `core/game.js` 的动词（start/restart/reset/pause/resume/recruit/place/merge/useShovel/tick/load）与其调入的规则层函数突变。UI 只读 `state` + 订阅事件；AI 只经 `api` 动词行动（残留例外：`stepAi` 挂 `side._acc`，待清）。
2. **规则层纯净**：`board/*`、`combat/path.js`、`combat/geometry.js` 必须是纯函数（geometry 的 `configureReach` 仅测试/调参可写）；`combat/sim.js`、`combat/skills.js`、`combat/damage.js`、`combat/pressure.js` 允许突变**传入的** side/enemy，但不得触碰 DOM/window（残留例外：`enemySeq`，回放专线在途）。
3. **随机纪律**：禁止 `Math.random`，一律 `state.rng`。规则层函数需要随机时以参数显式接收 rng。
4. **事件只读**：总线同步派发，监听器在 tick 突变中途执行，严禁在回调中改 state 或再调 api 动词。
5. **返回值语义**：动词类 API 用返回值报告成败（boolean 或 `{error}`），**失败必须零副作用**（不扣资源、不消耗手牌）。Round 1 已知违例（token 消耗）已修复；无已知违例。
6. **调参单例**：`configureBalance/configureReach/configurePressure` 是模块级全局旋钮，跨 `createGame` 实例共享且不入存档——只允许测试与调参脚本调用，对局内平衡改动必须走 `data/*`。

## 2. 共享类型

```ts
type SideId = "player" | "ai";
type UnitId = "dao" | "qiang" | "gong" | "qi";
type PieceKind = "unit" | "glyph" | "hero" | "token" | "shovel";
/** 单元格引用：索引数字、数字串或 {index} 对象均可。 */
type CellRef = number | string | { index: number };

// 手牌卡与棋盘棋子同构；token/shovel 永不驻留棋盘
type Card =
  | { kind: "unit";   id: UnitId; glyph: string; level: number }   // 抽出恒 level 1
  | { kind: "glyph";  glyph: string; level: 1 }                    // 武将单字
  | { kind: "shovel"; glyph: "铲"; level: 1 }
  | { kind: "token";  id: "shenbing"; glyph: "符"; level: 1 };

type Piece =
  | { kind: "unit"; id: UnitId; glyph: string; level: 1|2|3|4|5; cd: number; cooldown: number }
  | { kind: "glyph"; glyph: string; level: 1; cd: 0; cooldown: 0 }
  | { kind: "hero"; id: string; glyph: string /*武将全名*/; level: 5;
      cooldown: number /*技能CD，觉醒时=cd*0.35*/; cd?: number /*普攻CD*/;
      atkBonus: 0 /*⚠占位，无消费者*/ };

interface Cell { index: number; col: number; row: number; unlocked: boolean; unit: Piece | null }

interface Enemy {
  id: number;            // ⚠ sim 模块级自增，跨对局不复位（回放专线在途）
  t: number;             // 路径进度 0..1，≥1 判漏
  hp: number; maxHp: number;
  speed: number;         // 点/秒，除以 PATH_SCALE=520 得每秒进度
  reward: number; boss: boolean;
  skill: null | "haste" | "shield" | "split";   // 仅 Boss
  stun: number;          // 剩余眩晕秒
  slowT: number; slowMul: number;   // 减速剩余秒 / 倍率（叠加取更狠）
  shield: number;        // 仅 shield Boss：开局 25% maxHp 吸收
  pressure: boolean;     // 压力援兵标记（死亡不再给对手充能）
  glyph: "兵" | "卒" | "将" | "援";
}

interface SpawnQueueEntry {
  remain: number; acc: number; spec: WaveSpec; bossLeft: 0 | 1;
  pressure?: true;                                   // 压力波条目
  extra?: { hpMul?: number; speedMul?: number; glyph?: string; pressure?: boolean };
}

interface WaveSpec {
  wave: number; count: number; hp: number; speed: number; reward: number;
  boss: null | { hp: number; speed: number; skill: "haste" | "shield" | "split" };
  interval: number;
}

interface Side {
  id: SideId; mantou: number; hearts: number; recruitCount: number;
  cells: Cell[]; /*长度20*/ hand: Card[]; /*≤HAND_LIMIT*/
  enemies: Enemy[]; spawnQueue: SpawnQueueEntry[];
  kills: number; haste: number; wave: number;
  rally?: number;          // 仁德增伤剩余秒（首次施放后出现）
  leaks?: number;          // 漏怪计数，平局裁定第 3 键
  pressureCharge?: number; // 压力充能
  pressure?: { wave: number; received: number; sent: number };  // 压力台账
  _acc?: number;           // ⚠ stepAi 节流泄漏，非契约字段（待清）
}

interface GameState {
  phase: "menu" | "playing" | "paused" | "over"; winner: null | SideId;
  tie?: boolean; reason?: "hearts" | "survived" | null;   // 终局由 sim 写入；不入默认快照
  time: number; wave: number; seed: number; rng: Rng;
  sides: Record<SideId, Side>;
  log: Array<{ t: number; type: EventType; payload: object }>;  // 环形 ≤200
}
```

### 事件表（EventType → payload，共 19 种）

`start {seed}` · `reset {seed}` · `pause {}` · `resume {}` · `load {seed, phase}` ·
`recruit {side, card, cost}` · `place {side, cellIndex, unit ⚠活引用}` · `merge {side, cellIndex, level}` ·
`token {side, cellIndex, level}` · `move {side, from, to}` · `swap {side, from, to}` · `expand {side, cellIndex}` ·
`hero-awaken {side, names: string[]}` ·
`skill {side, hero, skill, fx, hits, damage, kills, targets: number[], cooldown, cellIndex, juice}`（见 §6 SkillResult） ·
`kill {side, reward, boss, pressure, id}` · `pressure {from, to, count, wave, hp}` ·
`leak {side, hearts, boss}` · `wave {wave}` · `game-over {winner, tie, reason}`。
发射点/订阅矩阵见 `ARCHITECTURE.md` §6。

## 3. `core/game.js` — `createGame(opts?) → GameAPI`

```ts
export const SIDE_IDS = ["player", "ai"];
// ⚠ 无 SAVE_VERSION 导出：Round 1 契约声明过 SAVE_VERSION=1，合入时被裁，
//   快照没有版本字段（回放专线【在途·R2】处理）。

createGame(opts?: { seed?: number; maxDt?: number; fixedStep?: number }): GameAPI
  // 默认 seed 20260623；fixedStep>0 时启用 engine.createStepper 固定步长
  //（默认 1/60、单帧最多 8 步），否则逐帧推进、内部 clampDt(maxDt，默认 0.05)。

interface GameAPI {
  state: GameState;         // 活引用，可读；写权见总则 1
  bus: Bus;                 // 完整总线（on/once/onAny/off/emit/clear），见 §4
  start(o?: {seed?}): true; // 任意 phase 可调：rng.reseed 回序列起点、重置双侧与 log、
                            // 入列第 1 波、emit "start"。⚠ 不重置 sim.enemySeq 与
                            // recruit 课程计数器（确定性缺口，见 §9 与架构 §7）
  restart(o?: {seed?}): true;          // = start
  reset(): true;                       // 回标题页（phase "menu"），emit "reset"
  pause(): boolean;                    // 仅 playing→paused；stepper 清积累；emit "pause"
  resume(): boolean;                   // 仅 paused→playing；emit "resume"
  setPaused(flag: boolean): boolean;  togglePause(): boolean;
  get paused(): boolean;               // = phase === "paused"

  recruit(sideId?: SideId /*默认"player"*/):
    | { card: Card; cost: number }     // 成功：扣馒头、recruitCount+1、入手牌、emit "recruit"
    | { error: "hand-full" | "no-mantou" | "roll-failed" }   // 失败零副作用
    | null;                            // phase !== "playing" 或 sideId 非法

  place(sideId: SideId, handIndex: number, cell: CellRef): boolean;
    // 目标格必须 unlocked。shovel → false（必须走 useShovel）
    // token → 目标可强化（canApplyShenbing）才消耗+升级+emit "token"+tryAwaken；否则 false 零消耗
    // 目标有子：canMerge ? 并入升级（保留目标格 cd/cooldown）+ emit "merge" + tryAwaken : false
    // 目标空：落子 {…card, cd:0, cooldown:0} + emit "place" + tryAwaken

  merge(sideId: SideId, from: CellRef, to: CellRef): boolean;
    // 板对板动词。两格必须都 unlocked、from 有子、from≠to。
    // to 空 → 移动（emit "move"）；canMerge → 合并到 to、from 置空（emit "merge"）；
    // 任一为 token → 双向识别 applyShenbing（emit "token"；token 实际永不驻留棋盘，防御分支）；
    // 其余 → 无条件交换（emit "swap"，不查 canSwap——两格既有子即互换，含单字/武将）。
    // 全部成功分支收尾 tryAwaken。

  useShovel(sideId: SideId, handIndex: number, cell: CellRef): boolean;
    // 卡必须是 shovel 且目标格 locked；解锁+消耗+emit "expand"。
    // ⚠ 不查 board/grid.canShovel 的连通性（经 api 可开孤岛格；内置 AI 只挑连通格）。

  tryAwaken(sideId: SideId): HeroDef[];  // scanAwaken+applyAwaken，有觉醒则 emit "hero-awaken"

  tick(dt: number): number;   // 返回本帧推进步数；非 playing 返回 0 并清 stepper 积累。
                              // 每步顺序：time → 玩家侧 → AI 侧 → checkWinner → maybeAdvanceWave

  serialize(o?: { rng?: boolean }): Snapshot;
    // 字段白名单 {phase, winner, time, wave, seed, sides, log} 深拷贝；
    // o.rng 时附 rngState。⚠ 不含 tie/reason/enemySeq/课程计数器；含 side._acc 污染。
  load(snapshot): boolean;    // 逐侧校验回填（hand 截上限、cells 长度不符弃用），
                              // rng.reseed(seed) + 可选 setState(rngState)，emit "load"

  recruitCost(sideId?: SideId): number;   // 只读报价（= data 的 recruitCost），UI 不自算
}
```

- sideId 经 `hasOwnProperty` 白名单校验，原型链键（`__proto__` 等）一律拒绝。
- 【在途·R2】回放专线：Side 增 `nextEnemyId` 号段（game 层 tick 后收编新敌人 id）、state 预置 `tie/reason` 并入档、`serialize({replay: true})` 写出内部字段。提交后回签本节。

## 4. `core/*` 基础设施

```ts
// core/events.js
createBus(): Bus
interface Bus {
  on(type, fn): () => void;            // 返回退订函数
  once(type, fn): () => void;
  onAny(fn: (type, payload) => void): () => void;
  off(type, fn): boolean;
  emit(type, payload?): void;          // 对监听列表做快照派发；单监听器抛错被捕获打日志
  clear(type?): void;                  // 无参清全部（含 onAny）
}

// core/rng.js — Mulberry32
createRng(seed = 20260623): Rng
interface Rng {
  seed: number;
  next(): number;                      // [0,1)
  int(max): number;                    // max≤0/非有限 → 0
  range(min, max): number;
  pick<T>(arr: T[]): T | undefined;    // 空数组 → undefined
  weighted<T>(pairs: {w, v}[]): T | undefined;   // 过滤 w≤0；全非法取末项
  getState(): number;  setState(v): Rng;         // 存档/回放游标
  reseed(newSeed?): Rng;               // 重置到序列起点（start/restart 用）
  clone(): Rng;                        // 独立副本，推演不污染主流
}

// core/engine.js —— game.js 与 main.js 双消费（不再是孤儿）
FIXED_STEP = 1/60;  MAX_FRAME_DT = 0.05;
clampDt(dt, max = MAX_FRAME_DT): number            // 非有限/负数 → 0
createStepper(opts?: {step?, maxDt?, maxSteps? /*默认8*/}):
  { get step; get pending; reset(); advance(dt, fn: (step)=>boolean|void): number }
  // fn 返回 false（如胜负已分）提前收敛并清积累
createLoop(onFrame: (dt, stamp)=>void, opts?: {raf?, cancelFrame?, now?, maxDt?}):
  { get running; start(): boolean; stop(): void }   // 可注入 raf/now 便于测试
```

## 5. `board/*` 规则（纯函数）

```ts
// board/grid.js
createCells(): Cell[]                 // 20 格，START_UNLOCKED=[5..12] 解锁
inBounds(i) / toIndex(col,row) / toCoord(i)
neighbors(i): number[]                // 正交四邻，升序（扫描顺序确定）
isAdjacent(a,b): boolean
cellDistToPath(i): number             // min 到棋盘四边距离；越界 Infinity
                                      // ⚠ 战斗已不用它判射程（geometry 接管）；AI 布阵仍在用（缺口 R5）
cellAt(cells, i): Cell | null         // 按 cell.index 取格，不假设下标即索引
isUnlockedEmpty / isOccupied(cell): boolean
unlockedEmptyCells / occupiedCells(cells): Cell[]   // 索引升序
firstUnlockedEmpty(cells): Cell | null
countUnlocked(cells): number
unlockedNeighbors / emptyNeighbors(cells, i): number[]
canShovel(cells, i): boolean          // 锁定格且至少一个已解锁正交邻格（禁孤岛开地）
shovelTargets(cells): Cell[]
unlockCell(cells, i): boolean         // 不满足 canShovel 不动棋盘
                                      // ⚠ game.useShovel 未走此谓词（契约 §3）

// board/hand.js —— ⚠ 全模块孤儿：无任何 src 消费者（game.js 直接操作 side.hand）。
//   接入或删除待定（缺口 R9）。签名：isValidCard/isPlaceableCard/handSize/handSpace/
//   isHandFull/isValidHandIndex/canAddCard/addCard/insertCard/peekCard/removeCard/
//   moveCard/findCardIndex，re-export HAND_LIMIT。

// board/merge.js
isUnit/isGlyph/isHero/isToken/isShovel(piece): boolean
occupiesCell(piece): boolean          // unit|glyph|hero
isCombatant(piece): boolean           // unit|hero（glyph 沉睡）
isSleepingGlyph(piece): boolean
isKnownUnitId(id) / isMaxLevel(piece) / canLevelUp(piece): boolean
canMerge(a, b): boolean               // 不同对象、同为 unit、同 id 同级、已知 id、level<5
mergeUnits(a, b): Piece | null        // level+1；cd/cooldown 取两者较大（防合并洗 CD）
canApplyShenbing(piece): boolean      // = canLevelUp
applyShenbing(piece): Piece           // 无效目标原样返回，绝不返回 null
canSwap(a, b): boolean                // ⚠ 无运行时消费者（game.merge 无条件交换）
classifyDrop(source, target):
  { action: "merge"|"token"|"place"|"swap"|"invalid"; reason: string }
  // ⚠ 无运行时消费者：main.js 的 resolveDrop/refuseReason 自建判定（缺口 R9）

// board/awaken.js
scanAwaken(cells): Array<{ keepIndex, dropIndex, hero: HeroDef }>
  // 只认正交相邻单字对，findHeroByGlyphs 双序匹配；used 集合防一字两用；
  // 格索引升序扫描，结果确定可复现
applyAwaken(cells, plan): HeroDef[]
  // 每步重校验（相邻/解锁/可拼同将），重放或伪造计划不二次吞字；
  // keep 格变 hero{level:5, cooldown: skill.cd*0.35, atkBonus:0}，drop 格清空

// board/placement.js ——【在途·R2】覆盖打分摆位助手（UI 高亮与 AI 选点共用，只读棋盘）。
//   主面：specOf/rangeOf/roleOf、cellCoverage/boardCoverage/coverageGaps/marginalCoverage、
//   rankPlacements/recommendCells/bestCell/placementHeat、explainPlacement；
//   战斗几何不可用时退化为格子启发式。尚无消费者，提交后回签精确签名。
```

## 6. `combat/*` 战斗

```ts
// combat/sim.js —— 突变传入 side；emit 由 game.js 注入。
// 内部常量：PATH_SCALE=520、SPAWN_CATCHUP=8/帧、BOSS_DELAY=0.6s、
//           MAX_ENEMIES=120/侧、CD_BANK=0.5s（冷却最多预支）
balanceConfig(): {towerDamage};  configureBalance(patch): 同   // 默认 1.35（射程收窄补偿，调参单例）
spawnEnemy(side, spec, isBoss, extra?: {hpMul?, speedMul?, glyph?, pressure?}): Enemy | null
  // 满 120 或无 side 返回 null；shield Boss 带 25% maxHp 护盾
enqueueWave(side, wave): void
tickSideCombat(side, dt, emit): void
  // haste/rally 衰减（haste 生效=攻速×1.2，rally 生效=伤害×1.15）
  // → 出兵（间隔减法防抖）→ 行军（stun 冻结、slow 叠狠）→ 逐格攻击 → 死亡/漏怪
  // 攻击为即时命中（无投射物）。射程 = 格心↔敌人路线坐标真实距离（geometry.falloffFor）：
  //   核心圈满伤、graze 外沿线性衰减；先打核心圈内领头者，再按 t 降序。
  // 英雄：cooldown 与是否有目标无关地递减；≤0 时 castSkill（对全部存活敌军，见 skills ⚠）
  //   并发 "skill" 事件；普攻打 targets[0]。兵种：unitAttack*rally*BALANCE*factor，
  //   枪 pierce=1 打衰减序前 2 个。
  // 死亡：赏金+kills+"kill"；split 分裂 2×卒（速×1.15）；notePressureKill → "pressure"。
  // 漏怪：hearts 钳 0、leaks+1、补偿 leakCompensation(side.wave)、"leak"。
maybeAdvanceWave(state, emit): void   // 每帧 linkArena；双侧全清才推波；≥MAX_WAVE 转 finishByHearts
checkWinner(state, emit): void        // 每帧 linkArena；开局清过期 tie/reason；
                                      // 任一侧 0 心 → gameOver（写 state.tie/reason，发 "game-over"）
// 平局裁定链（decide）：心多者胜 → 斩获多者胜 → 漏怪少者胜 → 存粮多者胜 → 全平判玩家胜（tie: true 如实标记）
MAX_WAVE = 13（re-export 自 data/waves）
// re-export 自 pressure.js：sendPressure/linkArena/opponentOf/notePressureKill/
//                          configurePressure/pressureConfig

// combat/damage.js —— 唯一伤害入口（普攻与技能共用，护盾语义一致）
applyDamage(enemy, amount, opts?: {ignoreShield?}):
  { dealt, absorbed, killed, shieldBroken }        // 先破盾再扣血
execute(enemy, hpRatio): boolean                   // 血线以下直接斩杀
applyStun(enemy, seconds): number                  // 取更长
applySlow(enemy, mul /*0.1..1*/, seconds): void    // 倍率取更狠、时长取更长
knockback(enemy, deltaT): number                   // 返回实际退距，最多退回起点

// combat/geometry.js —— 真实射程几何（棋盘与「几」字路线同坐标系，单位=格）
LANE_LENGTH: number
reachConfig(): {scale, pad, graze};  configureReach(patch): 同   // 默认 {1.2, 0.55, 1.6}（调参单例）
cellCenter(index): {x, y}
cellAnchor(index): {t, dist}          // 该格最贴近的路线进度与垂距（AI/UI 用）
lanePoint(t): {x, y}
reachOf(range): number                // range*scale + pad
grazeOf(range): number                // reachOf * graze，掠射外沿
distanceToProgress(index, t): number
inReach(index, t, range): boolean
hitFactorAt(distance, range): number  // 核心圈 1，外沿线性衰减到 0
hitFactor(index, t, range): number
falloffFor(range): { reach, outer, outer2, factor(distance) }   // 热循环预计算
coverageWindows(index, range, samples=96): {from, to}[]   // 该格覆盖的路线区间（可多段）
coverageRatio(index, range, samples=96): number            // 0..1
// ⚠ coverage/cellAnchor 目前仅测试与【在途·R2】placement.js 消费，AI 未接（缺口 R5）

// combat/pressure.js —— 镜像压力波
pressureConfig(): CONFIG;  configurePressure(patch): 同
// CONFIG 默认：killsPerPressure 5、bossCharge 3、perWaveCap 2（承压方每波上限）、
//              count 1、hpMul 0.55、speedMul 1.1、rewardMul 0.5、glyph "援"、enabled true
linkArena(state): boolean             // 幂等登记 player↔ai 到模块 WeakMap（不挂 side 字段防循环引用）
linkSides(a, b): boolean              // 手动登记（测试/未来多人）
opponentOf(side): Side | null
pressureSpec(wave, opts?): WaveSpec   // 弱化版当前波：无 boss、interval 0.5、hp≥8
sendPressure(side, otherSide?, opts?: {count?, cap?, force?, hpMul?, rewardMul?, speedMul?, glyph?}):
  { from, to, count, wave, hp } | null   // 未触发（禁用/封顶/无对手）为 null
notePressureKill(side, enemy): 同上 | null   // 击杀回调：攒满自动施压；压力兵之死不充能

// combat/skills.js —— 大招层，全部伤害走 damage.js
castSkill(side, heroUnit, enemies /*调用方传全部存活敌军*/, ctx?: {cellIndex?, reach?}): SkillResult
  // 结束置 heroUnit.cooldown = skill.cd。
  // ⚠ ctx.reach 六个 handler 均未消费：大招按「全路线」结算是现行事实语义（缺口 R8）。
interface SkillResult {
  id; name; fx: string;               // fx 稳定演出标识（= SKILL_FX[id]）
  hits; damage; kills; targets: number[];   // 结算摘要 + 命中敌人 id
  cooldown: number;
  juice: { shake: 0..1; color; sfx; duration; focusT: number|null;
           shape: "sweep"|"rain"|"ring"|"arc"|"aura"|"dash"|"none"; text;
           push?; beheaded?; buff? };
}
SKILL_FX: Record<skillId, fx>
// 六式语义：qijin ×0.95 全体+踉跄减速 | baibu ×1.15 全体（最远者 ×1.65）
// | dangyang ×0.8 仅 t>0.45，击退 0.08+晕 1.2s | wenjiu ×1.4 最前 6，残血 18% 直接斩
// | rende side.haste=max(,6) + side.rally=max(,4) | xiliang ×1.8 撞最前+晕 0.5s，践踏身后 0.07 段 ×0.6

// combat/path.js —— 纯几何；ui/lane.js 与 geometry.js 消费
pathPoints(width, height, flipY): {x,y}[]      // 「几」字 6 点折线
measurePath(pts): {pts, seg, cum, total}       // 预计算，热循环复用
pathLength(pts): number
pointOn(measured, t) / pointAt(pts, t): {x, y}
nearestOn(measured, x, y) / nearestPathT(pts, x, y): {t, dist}   // nearestPathT 无运行时调用方
```

## 7. `ai/opponent.js`

```ts
stepAi(api: GameAPI, dt): void
  // phase !== "playing" 直接返回。0.28s 节流（⚠状态存 side._acc，缺口 R4），
  // 每次至多执行一个动作：候选打分取最大——
  //   单字配对（findHeroByGlyphs 双序，含挪空格/借换位凑近，90+ 分）
  //   > 单字落到场上另一半旁（100/95 分）> 板上相邻合并（58+，空地富余时抑制）
  //   > 手牌并入（60+）> 神兵符喂最接近满级（55+）> 铲连通锁格（50+，地紧加急）
  //   > 落子（40+，弓内圈/近战外圈 + 邻同种 + 补在成对单字之间）
  //   > 征兵（15–45，按手牌饥饿度）> 阵型补位（12，挪进空格不拆阵）
  // 单字寄存有闸门：手牌≥4 才寄存、场上残卷≤2、绝不铺满棋盘。
  // 模块级 boardMoveSupported 探测「merge 到空格=移动」，不支持自动退回换位。
  // ⚠ 布阵仍用 cellDistToPath 内外圈经验，未接 geometry 覆盖 / placement.js（缺口 R5）。
```

## 8. `ui/*`、`audio/*` 与 `main.js` 运行时（驱动层，只读 state）

```ts
// ui/render.js
render(root: HTMLElement, api, ui: {selected, selectedCell, hover, toast, shake}): void
  // 把整个界面写进传入容器（main 传离屏 scratch，diff 后回写真实 DOM，见下）；
  // data-cell 仅玩家棋盘、data-hand 手牌；首调注入 #zy-ui-ext 补充样式（模块级一次）；
  // canvas 仅在 isConnected 且有宽度时直画。HUD 含波次/馒头/战力/来敌/斩获/心，
  // 每格 title 悬浮说明；menu 面板含三步教程；over 面板含战报。

// ui/lane.js
drawLane(canvas, enemies: Enemy[], flipY): void
  // DPR≤2；路线双描边 + 营/斗 起终点标记；敌字按 t 升序绘制（领头压顶层）；
  // Boss 金晕、护盾蓝环+盾条、眩晕「眩」字、血条。签名由主循环调用，勿改。

// audio/sfx.js — WebAudio 合成，fire-and-forget，失败静默
sfx.unlock/recruit/merge/awaken/leak/skill/win/lose(): void

// main.js 运行时契约（组合根，非导出 API）
window.__zhaoyun = { api, ui }        // 调试与 e2e 入口
// ?seed=<number> URL 参数定种子；UI_INTERVAL=1/30s、DRAG_SLOP=6px
// 增量渲染：signature()（phase/资源/棋面/手牌/指针态拼接）不变则跳帧；
//   morphChildren 同构 diff —— style 属性不删（运行时注入）、CANVAS 整棵跳过、
//   指针态 class 由 decorate() 在 diff 后补挂
// 键盘：空格/P 暂停切换、Esc 取消选中、Enter/E 征兵（menu/over 时=开局）、
//   R 重开、1–5 选手牌；visibilitychange 自动暂停/恢复
// 事件订阅矩阵见 ARCHITECTURE.md §6（⚠ skill.juice / kill / pressure 未消费，缺口 R2）
```

## 9. `data/*` 常量（单一数值来源，禁止在别处硬编码）

```ts
// data/units.js（Round 1 平衡版：四兵种 1 级 DPS 收敛 13.5~16.2，合并每级 ≈×1.42）
UNIT_TABLE = {
  dao:   { role:"melee",  rate:0.9,  range:1, atk:[16,23,33,46,64] },
  qiang: { role:"melee",  rate:0.75, range:1, atk:[18,26,37,52,72], pierce:1 },
  gong:  { role:"ranged", rate:1.1,  range:2, atk:[13,19,27,38,52] },
  qi:    { role:"melee",  rate:1.35, range:1, atk:[12,17,24,34,47] },
}
TIER_NAMES = ["白","绿","蓝","紫","橙"]; MAX_LEVEL=5; HAND_LIMIT=5
COLS=5; ROWS=4; CELL_COUNT=20; START_UNLOCKED=[5..12]; START_MANTOU=60; START_HEARTS=3
recruitCost(n): number = 8 + 5*n      // 首抽便宜、斜率压后期滚雪球
unitAttack(id, level): number         // 查 atk 表，未知 id → 0

// data/heroes.js（普攻 DPS 38~48 ≈ 1 枚橙兵，溢价在技能；CD 12~18s）
HEROES: HeroDef[6]   // {id, name, glyphs:[a,b], quality:"gold", atk, rate, range, skill:{id,name,cd,desc}}
                     // 赵云 r2/cd12 · 张飞 r1/cd14 · 黄忠 r3/cd16 · 关羽 r1/cd15 · 刘备 r1/cd18 · 马超 r1/cd14
GLYPH_POOL: string[12]               // 由 HEROES.glyphs 派生
findHeroByGlyphs(a, b): HeroDef | undefined   // 双序匹配
heroById(id): HeroDef | null

// data/recruit.js
RECRUIT_WEIGHTS   // 弓22 刀23 枪22 骑19 单字10 铲3 符1
CURRICULUM_ROLLS = 20   // 一局前 20 抽（双方合计）屏蔽工具牌（课程化掉落）
rollRecruit(rng): Card
  // ⚠ 课程计数以 rng 实例为键存模块级 WeakMap：restart() 复用同一 rng 实例不清零、
  //   load() 不恢复 —— 重开/读档后掉落表阶段漂移（确定性缺口，见 §10 第 4 条）

// data/waves.js
MAX_WAVE = 13
waveSpec(w): WaveSpec
  // 常规：count=4+w, hp=19+12w(+第10波起 lateRamp 6/波), speed=22+1.44w,
  //        reward=2+⌊w/2⌋, interval=max(0.65, 1.2-0.045w)
  // Boss 波 w%4===0：hp=70+24w, skill = w8:shield | 其余:haste
  // 终章 w13：8 精锐(hp142) + 分裂大 Boss(hp400, split)
leakCompensation(w): number = 8 + 2w   // 卖血换经济
```

## 10. Round 2 回签结果与 Round 3 变更清单（先改文档、后改代码，改前回签本文件）

Round 1 清单处置：~~load/存档闭环~~、~~射程重定义~~、~~token 零副作用~~、~~castSkill 走统一伤害~~、~~技能 CD 无目标递减~~、~~镜像压力波~~、~~渲染增量化~~ 全部**已实现并回签**（§3–§8）。仍缺项如下：

1. **胜率窗口**：headless 胜率 91.7%（36 局实测），拉回 45–55%——数值与 `BALANCE.towerDamage` 联动重校【在途·R2】。
2. **juice 上屏**：消费 `skill.juice`（飘字/震屏/泼墨）并订阅 `kill/pressure` 事件【在途·R2】；新增视觉事件需先登记 §2 事件表。
3. **回放确定性**：`enemySeq` 收编（per-side `nextEnemyId`）、`SAVE_VERSION` 导出、`tie/reason` 入档【在途·R2 回放专线】。
4. **课程计数器修复**（无人认领）：`rollRecruit` 的 WeakMap 计数须随 `start/restart` 清零、随 `serialize/load` 迁移，否则同种子重开/读档续跑的掉落序列漂移。
5. **AI 接覆盖**：`opponent.js` 改用 `board/placement.js`（或直接 `coverageWindows`）选点；`_acc` 节流器移出状态树。
6. **孤儿处置**：`board/hand.js`、`classifyDrop/canSwap`、`nearestPathT`、`atkBonus` ——接入或删除；`castSkill` 的 `ctx.reach` 语义定稿（删参或接入）。
7. **per-side rng** 流拆分（`rng.clone()` 已具备）；`place.unit` 事件活引用改快照；`useShovel` 接 `canShovel` 连通性。
8. **离线与可及性**：字体自托管或系统字栈；强制教程+首局记忆；aria/触控防滚完善。
9. **UI 层测试**：启用 jsdom，覆盖 morphChildren diff、拖拽手势、signature 跳帧。
10. 【在途·R2】各专线提交后，由文档负责人将本文所有【在途·R2】一次性回签为【已实现】。
