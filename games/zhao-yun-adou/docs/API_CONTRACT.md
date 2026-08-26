# API 契约（模块边界 · Round 3 回签版）

> 与代码逐行核对的精确签名。基线 commit `60c85e7`：Round 2 十路工作全部合入，原【在途·R2】标记一律回签为现行契约（无标记即已实现）；Round 3 已落地的课程计数修复与孤儿对拍测试一并回签。
> 标记：**【在途·R3】** Round 3 并行 agent 工作区已有、未提交，提交后须回签；**【缺口】** 声明的后续变更，当前不存在。
> 类型标注为 TS 风格伪码，实际全部是无类型 ESM JS。

## 1. 总则

1. **突变所有权**：`state` 只允许被 `core/game.js` 的动词（start/restart/reset/pause/resume/recruit/place/merge/useShovel/tick/load）与其调入的规则层函数突变。UI 只读 `state` + 订阅事件；AI 只经 `api` 动词行动（残留例外：`stepAi` 挂 `side._acc`，默认快照已剔除，待彻底移出状态树）。
2. **规则层纯净**：`board/*`、`combat/path.js`、`combat/geometry.js`、`combat/tuning.js` 必须是纯函数（tuning 单例的写入口仅测试/调参可用）；`combat/sim.js`、`combat/skills.js`、`combat/damage.js`、`combat/pressure.js` 允许突变**传入的** side/enemy，但不得触碰 DOM/window。~~残留例外 enemySeq~~ 已收编进 side 状态（§6 sim）。
3. **随机纪律**：禁止 `Math.random`，一律 `state.rng`。规则层函数需要随机时以参数显式接收 rng；驱动层需要抖动时用定数散列（`lane.hash01`）。
4. **事件只读**：总线同步派发，监听器在 tick 突变中途执行，严禁在回调中改 state 或再调 api 动词（`ui/juice.js` 全部监听器只写自己的模块队列/DOM 图层，达标）。
5. **返回值语义**：动词类 API 用返回值报告成败（boolean 或 `{error}`），**失败必须零副作用**（不扣资源、不消耗手牌）。无已知违例。
6. **调参单例**：`configureBalance/configureReach/configurePressure`（及对应 `resetX`）是模块级全局旋钮，跨 `createGame` 实例共享且不入存档——只允许测试与调参脚本调用。对局内平衡改动必须走 `data/*`：tuning 三层机制（默认值 < data 表可选导出 < 运行时补丁）就是为让数值轮不碰战斗代码而设（§6 tuning）。

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
      atkBonus: 0 /*⚠占位，无消费者（接入口已在 awaken.js 注明）*/ };

interface Cell { index: number; col: number; row: number; unlocked: boolean; unit: Piece | null }

interface Enemy {
  id: number;            // 每侧独立自增（side.enemySeq），回放安全；只在本侧内唯一，
                         // 跨侧使用必须连同 side 一起（kill/skill 事件都带 side）
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
  enemySeq?: number;       // 敌人号段指针（首次出兵才写；serialize 带走、load 还回）
  _acc?: number;           // stepAi 节流：默认快照剔除、回放档带走；非契约字段（待清）
}

interface GameState {
  phase: "menu" | "playing" | "paused" | "over"; winner: null | SideId;
  tie: boolean; reason: "hearts" | "survived" | null;
                          // 建局即预置（读档有稳定回填位）；终局由 sim 写入；
                          // 默认快照不含、回放档才带（§3 serialize）
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
发射点/订阅矩阵见 `ARCHITECTURE.md` §6；kill/leak/skill 三种的完整键序被 `tests/round3-regressions.test.js` 逐键锁定。**新增视觉事件须先登记本表。**

## 3. `core/game.js` — `createGame(opts?) → GameAPI`

```ts
export const SIDE_IDS = ["player", "ai"];
// ⚠ 仍无 SAVE_VERSION 导出：快照没有版本字段（缺口，见 §10 第 3 条）。

createGame(opts?: { seed?: number; maxDt?: number; fixedStep?: number }): GameAPI
  // 默认 seed 20260623；fixedStep>0 时启用 engine.createStepper 固定步长
  //（默认 1/60、单帧最多 8 步），否则逐帧推进、内部 clampDt(maxDt，默认 0.05)。

interface GameAPI {
  state: GameState;         // 活引用，可读；写权见总则 1
  bus: Bus;                 // 完整总线（on/once/onAny/off/emit/clear），见 §4
  start(o?: {seed?}): true; // 任意 phase 可调：rng.reseed 回序列起点、resetRecruitRolls
                            // 清课程计数、重置双侧与 log、清 tie/reason、
                            // 入列第 1 波、emit "start"。同种子重开完整复现。
  restart(o?: {seed?}): true;          // = start
  reset(): true;                       // 回标题页（phase "menu"），同样清课程计数，emit "reset"
  pause(): boolean;                    // 仅 playing→paused；stepper 清积累；emit "pause"
  resume(): boolean;                   // 仅 paused→playing；emit "resume"
  setPaused(flag: boolean): boolean;  togglePause(): boolean;
  get paused(): boolean;               // = phase === "paused"

  recruit(sideId?: SideId /*默认"player"*/):
    | { card: Card; cost: number }     // 成功：扣馒头、recruitCount+1、入手牌、emit "recruit"
    | { error: "hand-full" | "no-mantou" | "roll-failed" }   // 失败零副作用
    | null;                            // phase !== "playing" 或 sideId 非法
    // 课程阶段判据 = recruitRolls()（双侧 recruitCount 之和，天然入档），
    // 以 rollRecruit(state.rng, recruitRolls()) 显式传序号——WeakMap 不再参与判相。
    // ⚠ 死代码：内部还留着一枚无人调用的 drawRecruitCard 辅助（合流残留，待删）。

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
    // ⚠ 判定树与 board/merge.classifyDrop 是手写的两份（drop.test.js 已逐分支对拍等价），
    //   接入或删除见 §10 第 4 条。

  useShovel(sideId: SideId, handIndex: number, cell: CellRef): boolean;
    // 卡必须是 shovel 且目标格 locked；解锁+消耗+emit "expand"。
    // ⚠ 不查 board/grid.canShovel 的连通性（经 api 可开孤岛格；内置 AI 只挑连通格）。

  tryAwaken(sideId: SideId): HeroDef[];  // scanAwaken+applyAwaken，有觉醒则 emit "hero-awaken"

  tick(dt: number): number;   // 返回本帧推进步数；非 playing 返回 0 并清 stepper 积累。
                              // 每步顺序：time → 玩家侧 → AI 侧 → checkWinner → maybeAdvanceWave

  serialize(o?: { rng?: boolean; replay?: boolean }): Snapshot;
    // 默认：白名单 {phase, winner, time, wave, seed, sides, log} 深拷贝，
    //   sides 剔除 _acc（INTERNAL_SIDE_KEYS）、保留 enemySeq。
    // {replay: true}（兼容旧名 {rng: true}）：附 rngState、tie、reason、
    //   stepPending（有 stepper 时），且 sides 连 _acc 一起带走——精确续跑档。
    // ⚠ 默认档仍不含 tie/reason；两种档都无版本字段。

  load(snapshot, o?: { log?: boolean; silent?: boolean }): boolean;
    // 逐侧校验回填（hand 截上限、cells 长度不符弃用、缺侧补空侧），
    // 恢复 tie/reason、rng.reseed(seed) + 可选 setState(rngState)、
    // setRecruitRolls 对齐课程计数、stepper 复位 + 可选 setPending(stepPending)。
    // 事件：默认 emit "load"（写 log）；{log:false} 只派发总线（存-读-存逐字节一致）；
    // {silent:true} 总线与 log 都不动。缺 enemySeq 的旧档按存活最大 id+1 续号。

  recruitCost(sideId?: SideId): number;   // 只读报价（= data 的 recruitCost），UI 不自算
}
```

- sideId 经 `hasOwnProperty` 白名单校验，原型链键（`__proto__` 等）一律拒绝。
- 【在途·R3】战斗层快照 NaN 卫生（坏血量/坏进度当「已出局/回默认」处理）在工作区未提交，提交后回签 §6。

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

// core/engine.js —— game.js 与 main.js 双消费
FIXED_STEP = 1/60;  MAX_FRAME_DT = 0.05;
clampDt(dt, max = MAX_FRAME_DT): number            // 非有限/负数 → 0
createStepper(opts?: {step?, maxDt?, maxSteps? /*默认8*/}):
  { get step; get pending; reset();
    setPending(v): number;             // 【已实现·R2】回填未消化余量（读档续跑不丢半步）
    advance(dt, fn: (step)=>boolean|void): number }
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
                                      // ⚠ 战斗与 AI 都已不用它；仅 placement.js 的
                                      //   格子退化模式与内外圈微调项还在引用
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
//   0c1afb4 起：文件头列出 game.js 三处 push/splice 的等价替换清单，
//   hand.test.js（16 例）与 game 的 recruit/place 逐条对拍——接入是等价替换。
//   签名：isValidCard/isPlaceableCard/handSize/handSpace/isHandFull/isValidHandIndex/
//   canAddCard/addCard/insertCard/peekCard/removeCard/moveCard/findCardIndex，
//   re-export HAND_LIMIT。

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
classifyDrop(source, target, opts?: { from?: "hand" | "board" }):
  { action: "merge"|"token"|"place"|"swap"|"invalid"; reason: string }
  // 【已实现·R3】新增 {from:"hand"}：手牌拖出的牌不能换座（游戏没有「收回手牌」），
  //   本该判 swap 的情形改判 invalid；缺省 board 与旧行为逐字一致。
  // ⚠ 仍无运行时消费者：game.place/merge 与 main.js 的 refuseReason 各写了一份判定
  //   （drop.test.js 48 例对拍证明等价，含两处已知不同调：棋盘符分支不可达、
  //    未知 kind 本模块拒收/引擎照收）。接入见 §10 第 4 条。

// board/awaken.js
scanAwaken(cells): Array<{ keepIndex, dropIndex, hero: HeroDef }>
  // 只认正交相邻单字对，findHeroByGlyphs 双序匹配；used 集合防一字两用；
  // 格索引升序扫描，结果确定可复现
applyAwaken(cells, plan): HeroDef[]
  // 每步重校验（相邻/解锁/可拼同将），重放或伪造计划不二次吞字；
  // keep 格变 hero{level:5, cooldown: skill.cd*0.35, atkBonus:0}，drop 格清空

// board/placement.js ——【已实现·R2 落地，⚠仍无运行时消费者】覆盖打分摆位助手
//   （UI 高亮与 AI 选点通用，只读棋盘、零突变；AI 现走 opponent 自家 seatValue，见 §7）。
LANE_SAMPLES = 64
usesLaneCoverage(): boolean           // 战斗几何是否接上（否则全线退化格子启发式）
placementWeights(): {coverage:100, fresh:70, exclusive:60, awaken:40,
                     merge:9, ring:6, kin:2, room:1}   // 默认权重副本
roleRange(): { melee, ranged }        // 由 UNIT_TABLE 派生的档位射程
specOf(input): { role, range, id, level }
  // 手牌/棋子/兵种id/"melee"|"ranged"/射程数字/{role,range} 统一成打分规格；
  // 认不出 → range 0（不攻击）
rangeOf(piece): number;  roleOf(piece): "melee"|"ranged"|null
gridCoverage(index, range): number    // 无战斗几何时的粗估（只保单调性）
coverageWindowsFor(index, range, opts?): {from,to}[]   // 透传 geometry，UI 画提示直接用
cellCoverage(index, range, opts?): number              // 0..1
boardCoverage(cells, opts?): { lane, samples, ratio: number|null, gaps: {from,to}[] }
coverageGaps(cells, opts?): {from,to}[]
marginalCoverage(cells, index, card, opts?): number    // 新增覆盖（边际收益）
outerRing / innerRing(cells): number[]                 // 贴路一圈 / 里圈，索引升序
explainPlacement(cells, index, card, opts?): Evaluation | null   // 全分项，可作悬浮提示
rankPlacements(cells, card, opts?: {limit?, samples?, lane?, weights?}): Evaluation[]
  // 只收可落子空格；分数降序、同分索引升序（确定可复现）
recommendCells(cells, card, opts?): number[]           // 默认前 3
recommendMelee / recommendRanged(cells, opts?): number[]
bestCell(cells, card, opts?): number                   // 无处可落 → -1
placementHeat(cells, card, opts?): {index, score, heat: 0..1}[]  // UI 热力
```

## 6. `combat/*` 战斗

```ts
// combat/tuning.js ——【已实现·R2 落地】战斗层可调常量的统一基座（纯函数）
createTuning({ defaults, table?, coerce? }):
  { live,                    // 稳定引用，热循环直接读字段
    read(): copy, baseline(): copy,
    patch(next): copy,       // 运行时补丁（configureX 的实现）
    reset(): copy }          // 只丢运行时补丁，保留 data 表覆盖
tableFrom(moduleNs, names: string[]): object | null
  // 从模块命名空间挑第一个存在的表导出；覆盖按 defaults 的键与类型过滤，
  // 错键/错型/NaN 一律丢弃不污染
// 表侧覆盖键（当前 data 表均未写，走默认值；数值轮加导出即可调参）：
//   waves.BALANCE | COMBAT_BALANCE   → sim 的 {towerDamage}
//   waves.PRESSURE | PRESSURE_TUNING → pressure 的 CONFIG
//   units.REACH | REACH_TUNING | RANGE_TUNING → geometry 的 {scale, pad, graze}

// combat/sim.js —— 突变传入 side；emit 由 game.js 注入。
// 内部常量：PATH_SCALE=520、SPAWN_CATCHUP=8/帧、BOSS_DELAY=0.6s、
//           MAX_ENEMIES=120/侧、CD_BANK=0.5s（冷却最多预支）
balanceConfig(): {towerDamage};  configureBalance(patch): 同;  resetBalance(): 同
  // 默认 1.35（射程收窄补偿）；三层调参见 tuning
enemySeqOf(side): number       // 【已实现·R2】下一个会发的敌人编号（不消耗）；
                               //   side 缺字段时按存活最大 id+1 推（旧档兼容）
resetEnemySeq(side, next = 1): number   // 挪号段指针（重开/测试用；非法值回 1）
spawnEnemy(side, spec, isBoss, extra?: {hpMul?, speedMul?, glyph?, pressure?}): Enemy | null
  // 满 120 或无 side 返回 null——先挡上限再取号，被拒的出兵不烧编号（回放无空号）；
  // 编号取自 side.enemySeq（首次出兵才写字段，开局快照形状不受影响）；
  // shield Boss 带 25% maxHp 护盾
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
//                          configurePressure/pressureConfig/resetPressure

// combat/damage.js —— 唯一伤害入口（普攻与技能共用，护盾语义一致）
applyDamage(enemy, amount, opts?: {ignoreShield?}):
  { dealt, absorbed, killed, shieldBroken }        // 先破盾再扣血
execute(enemy, hpRatio): boolean                   // 血线以下直接斩杀
applyStun(enemy, seconds): number                  // 取更长
applySlow(enemy, mul /*0.1..1*/, seconds): void    // 倍率取更狠、时长取更长
knockback(enemy, deltaT): number                   // 返回实际退距，最多退回起点
// 【在途·R3】读档 NaN 卫生（非有限血量/进度按「已出局/回默认」处理）未提交，提交后回签

// combat/geometry.js —— 真实射程几何（棋盘与「几」字路线同坐标系，单位=格）
LANE_LENGTH: number
reachConfig(): {scale, pad, graze};  configureReach(patch): 同;  resetReach(): 同
  // 默认 {1.2, 0.55, 1.6}；可被 units.REACH 表覆盖（见 tuning）
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
// 【已实现·R2】coverage 系列现有运行时消费者：ai/opponent.seatValue（§7）；
//   placement.js 也消费但自身仍无人接（§5）

// combat/pressure.js —— 镜像压力波
pressureConfig(): CONFIG;  configurePressure(patch): 同;  resetPressure(): 同
// CONFIG 默认：killsPerPressure 5、bossCharge 3、perWaveCap 2（承压方每波上限）、
//              count 1、hpMul 0.55、speedMul 1.1、rewardMul 0.5、interval 0.5、
//              glyph "援"、enabled true；可被 waves.PRESSURE 表覆盖（见 tuning）
linkArena(state): boolean             // 幂等登记 player↔ai 到模块 WeakMap（不挂 side 字段防循环引用）
linkSides(a, b): boolean              // 手动登记（测试/未来多人）
opponentOf(side): Side | null
pressureSpec(wave, opts?): WaveSpec   // 弱化版当前波：无 boss、interval 0.5、hp≥8
sendPressure(side, otherSide?, opts?: {count?, cap?, force?, hpMul?, rewardMul?, speedMul?, glyph?, interval?}):
  { from, to, count, wave, hp } | null   // 未触发（禁用/封顶/无对手）为 null
notePressureKill(side, enemy): 同上 | null   // 击杀回调：攒满自动施压；压力兵之死不充能
// 充能与台账都在 side 上（pressureCharge/pressure），随快照迁移——读档续跑照常施压

// combat/skills.js —— 大招层，全部伤害走 damage.js
castSkill(side, heroUnit, enemies /*调用方传全部存活敌军*/, ctx?: {cellIndex?, reach?}): SkillResult
  // 结束置 heroUnit.cooldown = skill.cd。
  // ⚠ ctx.reach 六个 handler 均未消费：大招按「全路线」结算是现行事实语义（缺口，§10 第 7 条）。
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
  // phase !== "playing" 直接返回。0.28s 节流（⚠状态存 side._acc，待移出），
  // 每次至多执行一个动作：候选打分取最大——
  //   单字配对（findHeroByGlyphs 双序，含挪空格/借换位凑近，90+ 分）
  //   > 单字落到场上另一半旁（100/95 分）> 板上相邻合并（58+，空地富余时抑制）
  //   > 手牌并入（60+）> 神兵符喂最接近满级（55+）> 铲连通锁格（50+，地紧加急，
  //     新地按近战/远射两档 seatValue 掂量——只有弓手够得着的角落不值一张铲）
  //   > 落子（40+，主项 seatValue×20 + 远程覆盖比 + 邻同种 + 补在成对单字之间）
  //   > 征兵（15–45，按手牌饥饿度）> 阵型换座（≤18 分：把兵挪进覆盖更好的空格，
  //     乘法门槛 MOVE_GAIN=1.3 防两个座位来回蹦）
  // 单字寄存有闸门：手牌≥4 才寄存、场上残卷≤2、绝不铺满棋盘，
  //   且寄存在 seatValue 最不值钱的角落（好座位留给会出手的兵）。
  // 模块级 boardMoveSupported 探测「merge 到空格=移动」，不支持自动退回换位。

seatValue(index, range): number   // 【已实现·R2】座位价值 0~1：coverageWindows 按
  // 48 段路线求和，末段权重线性抬升（×4）——罩住阿斗跟前那段是最后一道拦截。
  // 按 (格, 射程) 记忆化（模块级 seatCache）。静态表：实测「按已有 DPS 饱和度
  // 补空档」反而更差，覆盖重叠不浪费，稀缺的是开火时间。
  // ⚠ cellDistToPath 在 AI 里已无引用；board/placement.js 也未接入（AI 走自家打分）。
```

## 8. `ui/*`、`audio/*` 与 `main.js` 运行时（驱动层，只读 state）

```ts
// ui/juice.js ——【已实现·R2 落地】事件 → 看得见的反馈。零 src 依赖，无 DOM 时自动降级。
attachJuice(api, opts?: {clock?: () => seconds}): Binding | null
  // 挂总线（kill/leak/merge/skill + start/reset/load 清场）。同一 api 重复调用
  // 是空操作——render() 每帧调它也不会重复订阅。测试可注入时钟。
detachJuice(): void               // 退订+清场+复位时钟+摘除图层
resetJuice(): void                // 换局清场（特效不跨局残留）
takeLaneEffects(sideId): Fx[]     // 取走该侧存活画布特效（顺带淘汰过期项）；
                                  // 返回内部数组本身，调用方只读、只在本帧内使用
fxProgress(fx, at?): 0..1         // 播放进度，绘制层换算关键帧
noteEnemies(sideId, enemies): void  // 每帧记 id→路线进度（kill 只带 id，落墨靠上一帧位置；
                                    // 没见过的 id 宁可不落墨也不乱落）
juiceStats(): { attached, lane: {player, ai}, floats }   // 调试与单测
// 两条通道：DOM 飘字/墨晕/半区震颤挂 document.body 的 #zy-juice fixed 图层
//   （WAAPI 自播自清，FLOAT_CAP=12，样式自注入 #zy-juice-css ——
//    ⚠与 styles/fx.css 的契约类双轨，合流见 §10 第 1 条）；
// 画布特效入 laneFx 队列（LANE_CAP=24/侧），由 drawLane 每帧取走。
// prefers-reduced-motion：飘字缩短上飘、墨晕缩时、弹格与震颤取消。

// ui/render.js
render(root: HTMLElement, api, ui: {selected, selectedCell, hover, toast, shake}): void
  // 把整个界面写进传入容器（main 传离屏 scratch，diff 后回写真实 DOM，见下）；
  // 每帧幂等调 attachJuice(api)；data-cell 仅玩家棋盘、data-hand 手牌；
  // 首调注入 #zy-ui-ext 补充样式（模块级一次）；canvas 仅在 isConnected 且有宽度时直画。
  // HUD 含波次/馒头/战力/来敌/斩获/心（⚠馒头悬浮文案「10+4×已征次数」与
  // recruitCost=8+5n 不符，待改）；每格 title 悬浮说明；menu 面板含三步教程
  // （静态 zy-tutor 列表 + 开局 coach 条，无强制引导、无 localStorage 首局标记，
  //  见 §10 第 2 条）；over 面板含战报。

// ui/lane.js
drawLane(canvas, enemies: Enemy[], flipY): void
  // DPR≤2；路线双描边 + 营/斗 起终点标记；敌字按 t 升序绘制（领头压顶层）；
  // Boss 金晕、护盾蓝环+盾条、眩晕「眩」字、血条。签名由主循环调用，勿改。
  // 【已实现·R2】顺带 noteEnemies 记位 + takeLaneEffects 画 juice：
  //   splat 墨溅（kill）/ leak 破阵圈 / 技能形状 sweep|rain|ring|arc|aura|dash；
  //   抖动用 (id,i) 散列 hash01 定数生成——同一发特效每帧溅在同一处，禁 Math.random。

// audio/sfx.js — WebAudio 合成，fire-and-forget，失败静默
sfx.unlock/recruit/merge/awaken/leak/skill/win/lose(): void

// main.js 运行时契约（组合根，非导出 API）
window.__zhaoyun = {
  api, ui,
  save(): Snapshot,        // = api.serialize({replay:true})，可精确续跑的档
  restore(snap): boolean,  // = api.load(snap, {log:false})，存-读-存逐字节一致
}
// ?seed=<number> URL 参数定种子；UI_INTERVAL=1/30s、DRAG_SLOP=6px
// 增量渲染：signature()（phase/资源/棋面/手牌/指针态拼接）不变则跳帧；
//   morphChildren 同构 diff —— style 属性不删（运行时注入）、CANVAS 整棵跳过、
//   指针态 class 由 decorate() 在 diff 后补挂
// 键盘：空格/P 暂停切换、Esc 取消选中、Enter/E 征兵（menu/over 时=开局）、
//   R 重开、1–5 选手牌；visibilitychange 自动暂停/恢复
// 事件订阅矩阵见 ARCHITECTURE.md §6（⚠ pressure 事件仍零订阅）
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
// 可选表覆盖出口：REACH | REACH_TUNING | RANGE_TUNING → geometry（现未写）

// data/heroes.js（普攻 DPS 38~48 ≈ 1 枚橙兵，溢价在技能；CD 12~18s）
HEROES: HeroDef[6]   // {id, name, glyphs:[a,b], quality:"gold", atk, rate, range, skill:{id,name,cd,desc}}
                     // 赵云 r2/cd12 · 张飞 r1/cd14 · 黄忠 r3/cd16 · 关羽 r1/cd15 · 刘备 r1/cd18 · 马超 r1/cd14
GLYPH_POOL: string[12]               // 由 HEROES.glyphs 派生
findHeroByGlyphs(a, b): HeroDef | undefined   // 双序匹配
heroById(id): HeroDef | null

// data/recruit.js
RECRUIT_WEIGHTS   // 弓22 刀23 枪22 骑19 单字10 铲3 符1
CURRICULUM_ROLLS = 20   // 一局前 20 抽（双方合计）屏蔽工具牌（课程化掉落）
rollRecruit(rng, rollIndex?): Card
  // 【已实现·R3】显式传 rollIndex 时按该序号选表且不动 WeakMap（game.recruit 用
  //   recruitRolls() = 双侧 recruitCount 之和传入，重开/读档天然对齐）；
  //   不传则沿用「WeakMap 按 rng 实例计数」的旧行为（独立调用方兼容）。
resetRecruitRolls(rng): void          // start/reset 清计数
setRecruitRolls(rng, n): void         // load 对表（n 夹到 ≥0 整数）

// data/waves.js（Round 2 平衡版：血量斜率 12→18、lateRamp 6→12/波，
//   决胜段必须掉心，bench 胜率 33/36 → 17/36；任何再调整必须重跑 npm run bench）
MAX_WAVE = 13
waveSpec(w): WaveSpec
  // 常规：count=4+w, hp=19+18w(+第10波起 lateRamp 12/波), speed=22+1.44w,
  //        reward=2+⌊w/2⌋, interval=max(0.65, 1.2-0.045w)
  // Boss 波 w%4===0：hp=70+24w, speed=16+0.8w, skill = w8:shield | 其余:haste
  // 终章 w13「长坂坡决战」：8 精锐(hp210, speed34, reward9) + 分裂大 Boss(hp520, split)
leakCompensation(w): number = 8 + 2w   // 卖血换经济
// 可选表覆盖出口：BALANCE | COMBAT_BALANCE → sim；PRESSURE | PRESSURE_TUNING → pressure（现未写）
```

## 10. Round 3 回签结果与后续变更清单（先改文档、后改代码，改前回签本文件）

Round 2 清单处置：~~胜率窗口~~（0.4722，bench 自带 0.40–0.60 闸门）、~~juice 上屏~~（skill/kill/leak/merge 全接线）、~~回放确定性·enemySeq~~（per-side 号段+全局对拍）、~~课程计数器修复~~（start/reset 清零、load 按 recruitCount 对齐）、~~AI 接覆盖~~（seatValue 直连 coverageWindows）全部**已实现并回签**（§3–§8）。仍缺项如下：

1. **juice 双轨合流**（R3 冲刺第 1 项，未动）：`ui/juice.js` 迁到 `styles/fx.css` 契约类（`#fx-layer/.fx-float/.fx-splash/.fx-quake`，形状类名与 `juice.shape` 一字不差、CSS 侧已就绪零消费者），弃用自注入 `#zy-juice-css`；顺带订阅 `pressure` 事件补「援兵将至」提示。
2. **强制三步教程 + localStorage 首局标记**（R3 冲刺第 3 项，未动）：现状是静态 menu 面板 + coach 条，src 内 `localStorage` 零引用；无障碍（aria/焦点管理）一并欠着。
3. **存档版本**：导出 `SAVE_VERSION` 并写入两种快照；默认档补 `tie/reason`。
4. **孤儿接入或删除**（对拍已证明等价替换，改起来是低风险机械活）：`board/hand.js` 按文件头清单换掉 game.js 三处 push/splice；`classifyDrop` 接进 `game.place/merge` 与 `main.js refuseReason`（顺带删不可达的棋盘符分支）；`board/placement.js` 接 UI 落点热力（`placementHeat`）或删；`nearestPathT`、`atkBonus` 定生死。
5. **per-side rng** 流拆分（`rng.clone()` 已具备）；`_acc` 节流器移出状态树。
6. **place.unit 事件活引用改快照**；`useShovel` 接 `canShovel` 连通性。
7. **`castSkill` 的 `ctx.reach` 语义定稿**：删参或让大招吃射程。
8. **UI 层测试**：启用 jsdom（devDeps 已装），覆盖 morphChildren diff、拖拽手势、signature 跳帧。
9. **小卫生**：删 `game.js` 里无人调用的 `drawRecruitCard`；HUD 馒头文案改成 `8+5n`；字体自托管 woff2（可选，系统字栈兜底已达标）。
10. 【在途·R3】战斗层读档 NaN 卫生（damage/geometry/path/pressure/sim/skills）提交后，由文档负责人回签 §6 并把本条销项。
