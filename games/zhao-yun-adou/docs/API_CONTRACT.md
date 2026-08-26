# API 契约(模块边界 · Round 1 审计版)

> 与代码逐行核对的精确签名。基线 commit `04d65d3`;并行 Round-1 加固 agent 的**在途工作区改动**覆盖 `core/{game,engine,events,rng}`、`board/{merge,grid,awaken,hand}`、`ai/opponent`、`main`,其已定型的新 API 面在本文以【在途·R1】列出。
> 标记:**【已实现】** 基线现行为;**【在途·R1】** 工作区已实现、未提交,提交后即成契约;**【缺口·R2】** 声明的下一轮变更,当前不存在。未标记即【已实现】。
> 类型标注为 TS 风格伪码,实际全部是无类型 ESM JS。

## 1. 总则

1. **突变所有权**:`state` 只允许被 `core/game.js` 的动词(start/recruit/place/merge/useShovel/tick)与其调入的规则层函数突变。UI 只读 `state` + 订阅事件;AI 只经 `api` 动词行动(现状例外:`stepAi` 挂 `side._acc`,R2 清除)。
2. **规则层纯净**:`board/*`、`combat/path.js` 必须是纯函数;`combat/sim.js`、`combat/skills.js` 允许突变**传入的** side/enemy,但不得触碰 DOM/window/全局(现状例外:`enemySeq`,R2 清除)。
3. **随机纪律**:禁止 `Math.random`,一律 `state.rng`。规则层函数需要随机时以参数显式接收 rng。
4. **事件只读**:总线同步派发,监听器在 tick 突变中途执行,严禁在回调中改 state 或再调 api 动词。
5. **返回值语义**:动词类 API 用返回值报告成败(boolean 或 `{error}`),**失败必须零副作用**(不扣资源、不消耗手牌)。已知违例:place 神兵符打不可强化目标仍消耗手牌(P9,R2 修)。

## 2. 共享类型

```ts
type SideId = "player" | "ai";
type UnitId = "dao" | "qiang" | "gong" | "qi";
type PieceKind = "unit" | "glyph" | "hero" | "token" | "shovel";

// 手牌卡与棋盘棋子同构;token/shovel 永不驻留棋盘(CARD_ONLY_KINDS)
type Card =
  | { kind: "unit";   id: UnitId; glyph: string; level: number }       // 抽出恒 level 1
  | { kind: "glyph";  glyph: string; level: 1 }                        // 武将单字
  | { kind: "shovel"; glyph: "铲"; level: 1 }
  | { kind: "token";  id: "shenbing"; glyph: "符"; level: 1 };

type Piece =
  | { kind: "unit"; id: UnitId; glyph: string; level: 1|2|3|4|5; cd: number; cooldown: number }
  | { kind: "glyph"; glyph: string; level: 1; cd: 0; cooldown: 0 }     // place 落格时补 cd 字段
  | { kind: "hero"; id: string; glyph: string /*武将全名*/; level: 5;
      cooldown: number /*技能CD*/; cd?: number /*普攻CD*/; atkBonus: 0 /*占位,未消费*/ };

interface Cell { index: number; col: number; row: number; unlocked: boolean; unit: Piece | null }

interface Enemy {
  id: number;            // ⚠ 模块级自增,跨对局不复位(P5)
  t: number;             // 路径进度 0..1,≥1 判漏
  hp: number; maxHp: number;
  speed: number;         // 虚拟像素/秒,除以魔数 520 得 dt 进度
  reward: number; boss: boolean;
  skill: null | "haste" | "shield" | "split";   // 仅 Boss
  stun: number;          // 剩余眩晕秒
  shield: number;        // 仅 shield Boss:开局 25% maxHp 吸收
  glyph: string;         // "兵" | "卒"(分裂) | "将"(Boss)
}

interface SpawnQueueEntry { remain: number; acc: number; spec: WaveSpec; bossLeft: 0 | 1 }

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
  _acc?: number;         // ⚠ stepAi 节流泄漏,非契约字段(R2 删除)
}

interface GameState {
  phase: "menu" | "playing" | "over"; winner: null | SideId;
  time: number; wave: number; seed: number; rng: Rng;
  sides: Record<SideId, Side>;
  log: Array<{ t: number; type: EventType; payload: object }>;  // 环形 ≤200
}
```

### 事件表(EventType → payload)

`start {seed}` · `recruit {side, card, cost}` · `place {side, cellIndex, unit⚠活引用}` · `merge {side, cellIndex, level}` · `token {side, cellIndex}` · `expand {side, cellIndex}` · `hero-awaken {side, names: string[]}` · `skill {side, hero:中文名, skill:技能名}` · `kill {side, reward, boss}` · `leak {side, hearts}` · `wave {wave}` · `game-over {winner}`。
详细发射点/订阅矩阵见 `ARCHITECTURE.md` §5。

## 3. `core/game.js` — `createGame(opts?) → GameAPI`

```ts
createGame(opts?: { seed?: number }): GameAPI   // 默认 seed 20260623

interface GameAPI {
  state: GameState;                    // 活引用,可读;写权见总则 1
  bus: { on(type, fn): () => void };   // 退订函数
  start(): void;                       // 任意 phase 可调:重置双侧、入列第 1 波、emit "start"
                                       // ⚠ 不重置 rng 游标与 enemySeq(P5,R2)
  recruit(sideId?: SideId /*默认"player"*/):
    | { card: Card; cost: number }     // 成功:扣馒头、recruitCount+1、入手牌、emit "recruit"
    | { error: "hand-full" | "no-mantou" }   // 失败:零副作用
    | null;                            // phase !== "playing"
  place(sideId: SideId, handIndex: number, cellIndex: number): boolean;
    // shovel → false(必须走 useShovel)
    // token  → 目标格有子:applyShenbing + 消耗 + emit "token" + tryAwaken;空格 → false
    //          ⚠ 目标为 glyph/hero 时无效果但仍消耗(P9,R2 接 canApplyShenbing)
    // 目标有子:canMerge ? 并入升级 + emit "merge" + tryAwaken : false
    // 目标空且 unlocked:落子 {…card, cd:0, cooldown:0} + emit "place" + tryAwaken
  merge(sideId: SideId, fromIndex: number, toIndex: number): boolean;
    // 两格皆有子才继续;canMerge → 合并到 to、from 置空、emit "merge"(⚠此分支不 tryAwaken)
    // from 为 token → 死代码分支(token 不驻留棋盘,P11)
    // 其余 → 无条件交换 + tryAwaken(⚠不发事件、不查 unlocked)
  useShovel(sideId: SideId, handIndex: number, cellIndex: number): boolean;
    // 卡必须是 shovel 且目标格 locked;解锁 + 消耗 + emit "expand"
  tryAwaken(sideId: SideId): HeroDef[];  // scanAwaken+applyAwaken,有觉醒则 emit "hero-awaken"
  tick(dt: number): void;              // 顺序:time → 玩家侧 → AI 侧 → checkWinner → maybeAdvanceWave
                                       // ⚠ 不钳制 dt,钳制责任在调用方(main.js 内联 0.05)
  serialize(): object;                 // JSON 深拷贝,剥离 rng;丢 rng 游标/enemySeq,混入 _acc
  // load(snapshot): void              // 基线未实现;【在途·R1】已落地,见下
}
```

### 【在途·R1】`createGame` 扩展面(工作区已实现,提交后即成契约)

```ts
createGame(opts?: { seed?: number; maxDt?: number; fixedStep?: number }): GameAPI
  // fixedStep>0 时启用 engine.createStepper 固定步长(回放/联机稳定);默认逐帧、内部 clampDt(maxDt)
export const SAVE_VERSION = 1;
export const SIDE_IDS = ["player", "ai"];

// 新增动词与访问器
restart(opts?: {seed?}): boolean;  reset(): boolean;          // reset 回标题页,emit "reset"
pause(): boolean; resume(): boolean; setPaused(f): boolean; togglePause(): boolean;
get paused(): boolean;                                        // phase 新增 "paused"
recruitCost(sideId?: SideId): number;                         // 只读报价,UI 不再自算

// 行为变化(相对基线)
// - place/merge/useShovel 的 cellIndex 参数升级为 CellRef = number | 数字串 | {index};
//   sideId 经 hasOwnProperty 白名单校验,防原型链注入。
// - place(token→不可强化目标) 返回 false 且不消耗手牌(修复基线 P9);token 事件 payload 增 level。
// - merge(from,to):双格必须 unlocked;目标空格 = 移动(emit "move");交换 emit "swap";
//   token 分支双向识别;合并保留目标格 cd/cooldown(不再洗 CD);全部成功分支 tryAwaken。
// - start/restart 会 rng.reseed(seed) 并清空 log:同种子重开必复现同局。
// - tick(dt): number 返回本帧推进步数;内部自钳 dt,不再依赖调用方。
// - emit 顺序改为「先写 log,后派发总线」。
// - serialize(opts?: {rng?: boolean}) 显式字段白名单;opts.rng 时附 rngState。
// - load(snapshot): boolean 逐侧校验回填,rng.reseed + 可选 setState(rngState),emit "load"。

// 新增事件:reset {seed} · pause {} · resume {} · load {seed, phase}
//          move {side, from, to} · swap {side, from, to}
```

## 4. `core/*` 基础设施

```ts
// core/events.js
createBus(): { on(type: string, fn: (payload) => void): () => void;
               emit(type: string, payload?): void }   // 基线:同步、无通配、无错误隔离
// 【在途·R1】增强版:once(type,fn) · onAny((type,payload)=>) · off(type,fn) · clear(type?)
//   emit 对监听列表做快照(回调内订阅/退订安全),单监听器抛错被捕获打日志,不中断游戏循环

// core/rng.js — Mulberry32
createRng(seed?: number): Rng
interface Rng {
  seed: number;
  next(): number;                     // [0,1)
  int(max: number): number;           // 【在途·R1】max≤0/非有限 → 0
  range(min: number, max: number): number;       // 【在途·R1】
  pick<T>(arr: T[]): T | undefined;   // 【在途·R1】空数组 → undefined
  weighted<T>(pairs: {w: number, v: T}[]): T | undefined;
  getState(): number;                 // 【在途·R1】存档/回放
  setState(v: number): Rng;           // 【在途·R1】
  reseed(newSeed?: number): Rng;      // 【在途·R1】重置到序列起点
  clone(): Rng;                       // 【在途·R1】独立副本,推演不污染主流
}

// core/engine.js —— 基线为孤儿(P12);【在途·R1】已被 game.js 消费并扩展:
clampDt(dt: number, max = MAX_FRAME_DT): number
FIXED_STEP = 1/60;  MAX_FRAME_DT = 0.05                       // 【在途·R1】
createStepper(opts?: {step?, maxDt?, maxSteps? /*默认8*/}):   // 【在途·R1】固定步长切片器
  { step; pending; reset(); advance(dt, fn: (step)=>boolean|void): number /*步数*/ }
createLoop(onFrame, opts?): { start(); stop(); ... }          // 【在途·R1】可注入 raf/now 的主循环
```

## 5. `board/*` 规则(纯函数)

```ts
// board/grid.js
createCells(): Cell[]                // 20 格,START_UNLOCKED=[5..12] 解锁
neighbors(index: number): number[]   // 四邻,越界裁剪
cellDistToPath(index: number): number  // = min 到棋盘边缘距离;5×4 上仅 {0,1}(P1:射程判定因此恒真)
// 【在途·R1】新增查询助手(全部纯函数):inBounds/toIndex/toCoord/isAdjacent/cellAt/
//   isUnlockedEmpty/isOccupied/unlockedEmptyCells/occupiedCells/firstUnlockedEmpty/
//   countUnlocked/unlockedNeighbors/emptyNeighbors/canShovel/shovelTargets/unlockCell
//   并 re-export CELL_COUNT/COLS/ROWS

// board/hand.js —— 【在途·R1】全新模块:手牌纯函数
//   isValidCard/isPlaceableCard/handSize/handSpace/isHandFull/isValidHandIndex/
//   canAddCard/addCard/insertCard/peekCard/removeCard/moveCard/findCardIndex
//   并 re-export HAND_LIMIT

// board/merge.js —— 谓词层全部【在途·R1】,canMerge/mergeUnits/applyShenbing 语义已生效
UNIT_KINDS / CARD_ONLY_KINDS: readonly string[]
isUnit/isGlyph/isHero/isToken/isShovel(piece): boolean
occupiesCell(piece): boolean         // unit|glyph|hero
isCombatant(piece): boolean          // unit|hero(glyph 沉睡)
isKnownUnitId(id): boolean; isMaxLevel(piece): boolean; canLevelUp(piece): boolean
canMerge(a, b): boolean              // 不同对象、同为 unit、同 id 同级、已知 id、level<5
mergeUnits(a, b): Piece | null       // level+1;cd/cooldown 取两者较大(防合并洗 CD)
canApplyShenbing(piece): boolean     // = canLevelUp
applyShenbing(piece): Piece          // 无效目标原样返回,绝不返回 null
canSwap(a, b): boolean
classifyDrop(source, target):        // 【在途·R1】拖放意图判定,game/main 尚未接入(R2 P10)
  { action: "merge"|"token"|"place"|"swap"|"invalid"; reason: string }

// board/awaken.js
scanAwaken(cells): Array<{ keepIndex, dropIndex, hero: HeroDef }>
  // 扫相邻 glyph 对,findHeroByGlyphs 双序匹配;used 集合防一子两用
applyAwaken(cells, plan): HeroDef[]
  // keep 格变 hero{level:5, cooldown: skill.cd*0.35, atkBonus:0},drop 格清空
```

## 6. `combat/*` 战斗

```ts
// combat/sim.js —— 突变传入 side;emit 由 game.js 注入
spawnEnemy(side, spec: WaveSpec, isBoss: boolean, extra?: {speedMul?, glyph?}): void
enqueueWave(side, wave: number): void
tickSideCombat(side, dt: number, emit): void
  // 出兵 → 行军(t += speed*dt/520,stun 冻结)→ 逐格攻击 → 死亡(赏金/split 分裂×2)
  // → 漏怪(hearts-1,补偿 leakCompensation(side.wave))
  // 普攻走 harm()(先破 shield);枪 pierce=1 打最前 2 个;英雄技能 CD 只在有目标时递减(P8)
maybeAdvanceWave(state, emit): void  // 双侧全清才推波;≥MAX_WAVE 转 finishByHearts
checkWinner(state, emit): void       // 心归零判负;双归零比 kills,平局玩家胜(P14,产品决定)
MAX_WAVE: 12(re-export)

// combat/skills.js
castSkill(side, heroUnit, enemies /*已过滤 hp>0,未过滤射程*/):
  { hits: number; fx: string; name?: string }
  // qijin ×0.95 全体 | baibu ×1.15 全体 | dangyang ×0.8 击退0.08+晕1.2s(仅 t>0.45)
  // wenjiu ×1.4 最前 6 | rende side.haste=max(,6)(攻速×1.2) | xiliang ×1.8 最前+击退0.05
  // ⚠ 直接 e.hp-=,绕过护盾(P7);结束置 heroUnit.cooldown = skill.cd

// combat/path.js —— 纯几何,仅 ui/lane.js 消费
pathPoints(width, height, flipY: boolean): {x,y}[]   // 「几」字 6 点折线
pathLength(pts): number
pointAt(pts, t: 0..1): {x, y}
nearestPathT(pts, x, y): { t: number; dist: number } // ⚠ 现无人调用,P1 修复的原料
```

## 7. `ai/opponent.js`

```ts
stepAi(api: GameAPI, dt: number): void
  // 0.28s 节流(⚠状态存 side._acc,P6),每次至多一动作,优先级:
  // 板上相邻合并 > 铲开锁格 > 符升级(找 level<5 的 unit)> 手牌并入同种同级
  // > 单字放到「任意不同字」邻格(⚠不查 findHeroByGlyphs,会错配,P6)
  // > preferredCell 落子(ranged 靠内圈,其余靠外圈——受 P1 影响实际无收益)> 征兵
  // 【在途·R1】opponent.js 正被重写(81→300+ 行);签名 stepAi(api, dt) 不变,
  //   _acc 节流仍在(P6 未清),内部策略以提交后代码为准,须回签本节
```

## 8. `ui/*` 与 `audio/*`(驱动层,只读 state)

```ts
// ui/render.js
render(root: HTMLElement, api: GameAPI, ui: {selected, hover, toast, shake}): void
  // 全量 innerHTML 重建(P2);data-cell / data-hand 供 main.js 绑定;调 drawLane×2

// ui/lane.js
drawLane(canvas, enemies: Enemy[], flipY: boolean): void   // DPR≤2,路径+敌字+血条

// audio/sfx.js — WebAudio 合成,全部 fire-and-forget,失败静默
sfx.unlock/recruit/merge/awaken/leak/skill/win/lose(): void
```

## 9. `data/*` 常量(单一数值来源,禁止在别处硬编码)

```ts
// data/units.js
UNIT_TABLE: Record<UnitId, {id, glyph, role: "melee"|"ranged", rate, range, atk: number[5], pierce?}>
TIER_NAMES = ["白","绿","蓝","紫","橙"]; MAX_LEVEL=5; HAND_LIMIT=5
COLS=5; ROWS=4; CELL_COUNT=20; START_UNLOCKED=[5..12]; START_MANTOU=48; START_HEARTS=3
recruitCost(recruitCount): number    // = 10 + 4*recruitCount
unitAttack(id, level): number        // 查 atk 表,未知 id → 0

// data/heroes.js
HEROES: HeroDef[6]   // {id,name,glyphs:[a,b],quality:"gold",atk,rate,range,skill:{id,name,cd,desc}}
GLYPH_POOL: string[12]
findHeroByGlyphs(a, b): HeroDef | undefined   // 双序匹配
heroById(id): HeroDef | null

// data/recruit.js
RECRUIT_WEIGHTS   // 刀22 枪22 弓22 骑16 单字12 铲4 符2
rollRecruit(rng: Rng): Card

// data/waves.js
MAX_WAVE = 12
waveSpec(wave): WaveSpec   // count=4+w, hp=20+14w, speed=28+1.6w, interval=max(0.35, 0.85-0.03w)
                           // Boss 波 w%4===0:hp=90+28w,skill = w12:split | w8:shield | 其余:haste
leakCompensation(wave): number   // = 8 + 2*wave
```

## 10. Round 2 契约变更清单(先改文档、后改代码,改前须回签本文件)

1. ~~`GameAPI.load(snapshot)` 补全存档闭环~~ →【在途·R1 已基本落地】(load + serialize({rng}) + SAVE_VERSION);R2 余项:`enemySeq` 仍未入档、`_acc` 仍混入快照。
2. 射程语义重定义(P1):`rangeOk` 改用 `nearestPathT` 的格心-路径距离;`UNIT_TABLE.range`/`HeroDef.range` 数值随之重校。**这是当前最大的玩法缺陷,在途改动未触及。**
3. ~~token 无效目标不再消耗~~ →【在途·R1 已修】;余项:`main.tryDrop` 接入 `classifyDrop`(P10),失败零副作用全面回归验证。
4. per-side rng 流(P4)+ `enemySeq` 收编进 state(P5)+ `stepAi` 节流器出树(P6)——在途改动均未触及。
5. `castSkill` 统一走 `harm`(P7);英雄技能 CD 无目标也递减(P8)——`combat/sim.js`、`combat/skills.js` 在途零改动。
6. 镜像压力波与武将邻格 `atkBonus` 消费(P13)——新增事件需先登记 §2 事件表。
7. 渲染层增量化(P2)属 UI 轮次;`main.js` 在途重写中(578 行 diff),提交后须回签 §8 与事件订阅矩阵。
8. 在途改动提交后,本文所有【在途·R1】标记升级为【已实现】,由 R2 文档负责人一次性回签。
