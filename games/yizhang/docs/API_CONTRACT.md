# 异掌 · 公共 API 契约 v4（安全区大厅轮 Round 1 · Fable-1，冻结）

> 基座 = v3（收官轮冻结面，ADR-16…24），已列条目一字不改。本版新增**安全区选掌大厅**的契约面（ADR-25…28）：`Input.interact`（§2）、`HUB` 布局表（§3.2）、`createMatch` 的 `startPhase / unlockedGloveIds`（§4.1）、`state.phase / state.hub`（§4.2）、`view.phase / view.hub`（§4.3）、大厅交互与传送语义（§4.4）、事件词表新增 `hubEquip / hubDeny / phaseChange`（§10）、音名新增 `equip / deny / portal`（§11）、hub HUD 契约（§13）、不变量 14–19（§14）。**兼容基线**：`startPhase` 缺省 `'arena'`，缺省路径下 v3 的全部语义与既有测试逐位不变。
>
> **变更规则**：已列出的导出（名字、参数、返回形状）不得改动或删除；追加新导出/新可选字段允许，但必须先在本文登记再写代码。类型用 TS 记法描述形状，实现是纯 JS。

## 1. 总则与硬性不变量

1. `src/sim`、`src/data`、`src/combat`、`src/ai` 禁止 import `three`、禁止触碰 DOM / `window` / `document` / `performance` / `Math.random`。
2. `MatchState` 只含 plain object / array / number / string / boolean / null——`structuredClone(state)` 无损，克隆后继续 `step` 与原件逐位一致。
3. `getView(state)` 返回全新纯 JSON 快照（无函数、无 `undefined`、无 `Infinity`/`NaN`），调用不改 state。外壳层只准持有快照。
4. `GLOVES` / `MATCH` 等 data 表只读；觉醒等数值覆盖走 `applyAwaken` 的派生副本。
5. 确定性（只约束 sim）：同 `seed` + 同输入序列 + 同 `dt` ⇒ 逐位复现。
6. 事件（§10）是模拟核对外唯一「已发生」通道，**只由 sim 发射**（ADR-22）；音效名（§11）是 main→audio 的唯一词表。
7. 存档 key 唯一：`yizhang-save-v1`，只有 `src/core/storage.js` 读写 localStorage。
8. **朝向约定全局唯一**（ADR-17）：`yaw = 0` 面向 **-Z**，`forward(yaw) = (-sin yaw, -cos yaw)`，`right(yaw) = (cos yaw, -sin yaw)`；three 侧 `mesh.rotation.y = yaw` 直用。
9. **人类玩家 id 全局唯一**（ADR-16）：`'p0'`；bot 为 `'b0' | 'b1' | 'b2'`。

## 2. 通用类型

```ts
type PlayerId = 'p0' | `b${number}`;   // p0 = 人类；b0..b2 = bot（botCount 默认 3）
type GloveId  = 'cotton'|'granite'|'gale'|'frost'|'spring'|'afterimage'|'magnet'|'meteor';
type Tier     = 'high'|'mid'|'low';
type Persona  = 'brute'|'fox'|'bully';
// 技能 id 两套词表（翻译表见 §3.1，ADR-23）
type SkillDataId    = 'quake_slam'|'wind_rush'|'frost_arc'|'coil_counter'|'phantom_swap'|'iron_pull'|'sky_fall';
type SkillHandlerId = 'groundPound'|'dashSlap'|'frostArc'|'parry'|'blinkSwap'|'magnetPull'|'meteorSlam';

interface Input {
  moveX: number;          // -1..1，世界系（input 层已按 cameraYaw 换算），√(x²+z²) ≤ 1
  moveZ: number;          // -1..1，世界系
  yaw: number | null;     // 期望面朝角（世界系弧度，ADR-17 约定）；null = 保持当前朝向
  slap: boolean;          // 可长按（sim 冷却/相位机闸门）
  skill: boolean;         // 可长按（sim 边沿检测 + 冷却）
  switchGlove: boolean;   // ↓ 四个由 sim 做上升沿检测，长按不连发
  dash: boolean;
  jump: boolean;
  interact: boolean;      // HUB-R1 新增（ADR-28）：hub = 装备聚焦展掌；arena = no-op（R2 回程预留）。
                          // 键鼠 E 同时置位 skill(hold) 与 interact(edge)，sim 按 phase 只消费其一。
  moveSpace?: 'world'|'local';   // 缺省 'world'；'local' 按玩家 yaw 旋转，仅测试用
}
// 缺省玩家视为 ZERO_INPUT：{ moveX:0, moveZ:0, yaw:null, 其余 false（含 interact）}
```

**摇杆→世界系换算**（input 层职责，θ = cameraYaw，`sx` 屏幕右为正、`sy` 屏幕前为正）：

```
moveX = sx·cos(θ) − sy·sin(θ)
moveZ = −sx·sin(θ) − sy·cos(θ)
Input.yaw = θ
```

## 3. `src/data`（Fable-3 所有）

汇总出口 `src/data/index.js`；sim 静态 import 它（ADR-19）。

```ts
// gloves.js（运行时权威表）
export const GLOVES: GloveDef[];                       // 8 只，顺序即图鉴顺序
export const GLOVE_BY_ID: Record<GloveId, GloveDef>;
export const MATCH: MatchConst;
export function isGloveUnlocked(gloveId: GloveId, progress?: Record<string, number>): boolean;
// unlock === 'default' 恒 true（cotton）；未知 gloveId 恒 false；
// 否则查 UNLOCK_BY_GLOVE[gloveId]，progress[unlock.id] >= unlock.count 才 true。
// progress 缺省 {} ⇒ 除 default 外全锁。契约测 tests/glove-data.test.js 以此为准。

interface GloveDef {
  id: GloveId; name: string;        // 中文名（木棉/磐石/…）
  role: string; desc: string;       // 职能一词 + 一句话说明（UI 用）
  color: string;                    // 识别色 hex，全局唯一饱和点
  slapRange: number; slapAngleDeg: number;
  slapPower: number;                // 水平击退冲量基准（m/s）
  slapCooldown: number; windup: number; recovery: number;   // 秒
  moveSpeedMul: number;             // 持掌移速倍率
  skillId: SkillDataId | 'none';    // 'none' = 无主动技（cotton）。哨兵字符串、禁 null——
                                    // 契约测试要求全字段非空；与 combat 的翻译见 §3.1
  skillCooldown: number;
  unlock: 'default' | string;       // 字符串 = unlocks.js 的挑战 id（R1 的对象形式已废除）
  awakenModifiers: {                // 觉醒 8s 覆盖，applyAwaken 消费
    slapPowerMul: number; slapRangeMul: number; slapCooldownMul: number;
    special: string; params?: Record<string, number>;
  };
}

interface MatchConst {
  dt: number;                       // 1/60
  arenaRadius: 20; playerRadius: 0.7; playerHeight: 2;
  fallY: -8; respawnDelay: 1.2; invulnTime: 1.0;
  matchSeconds: 240; killsToWin: 7;
  switchLock: 0.4; awakenDuration: 8;
}

// 其余表（同为只读；消费方注明）
export const SKILLS, SKILL_IDS;                  // skills.js —— 数据 id 词表（§3.1 左列）的详参
export const BOT_PERSONAS, BOT_PERSONA_BY_ID;    // bots.js —— ai 消费
export const UNLOCKS, UNLOCK_BY_ID, UNLOCK_BY_GLOVE;  // unlocks.js —— shell/main 消费
export const MOVEMENT, KNOCKBACK, METER, RULES;  // tuning.js —— 参考值；运动手感的运行时权威是 sim.PHYSICS
export const TILE;                               // tiles.js —— 仅伤害调参语义；拓扑字段不具约束力（ADR-18）
export const HUB;                                // hub.js —— 安全区大厅布局（§3.2，HUB-R1 新增）；sim/render/ui 消费
// SKILL_COMBAT_ALIASES（skills.js）是 §3.1 别名表的 R2 过渡副本，R3 删除（ADR-23）
```

### 3.1 技能 id 别名表（冻结，ADR-23）

数据 id（`GloveDef.skillId`、图鉴、GDD 的公共词表）与 combat handler id（`src/combat/skills.js` 的分派键）是两套词表，之间**只有这一张翻译表**——运行时唯一翻译点是 `src/sim/combat-bridge.js` 的 `SKILL_ALIAS` / `combatSkillId()`：

| 掌 | 数据 id（公共词表） | handler id（combat 分派 / 线上 skillId） |
| --- | --- | --- |
| cotton 木棉 | `none`（哨兵，无主动技） | `none`（觉醒三段被动链） |
| granite 磐石 | `quake_slam` | `groundPound` |
| gale 疾风 | `wind_rush` | `dashSlap` |
| frost 冰霜 | `frost_arc` | `frostArc` |
| spring 弹簧 | `coil_counter` | `parry` |
| afterimage 分身 | `phantom_swap` | `blinkSwap` |
| magnet 磁掌 | `iron_pull` | `magnetPull` |
| meteor 陨掌 | `sky_fall` | `meteorSlam` |

规则：

1. `combatSkillId(id)`：falsy → `'none'`，命中 `SKILL_ALIAS` 取右列，否则原样透传。桥在 `resolveSlap/resolveSkill/applyAwaken` 的入参掌与 `syncGloveTable`（combat 内部掌表）上统一翻译，别处不得再各自换算。
2. **线上（`skill` 事件与 `HitRecord`）的 `skillId` 是 handler id**（右列，桥返回值优先）。消费方按技能分派表现（VFX / 音效 / 播报）时对右列词表编程。
3. 重复副本一律删除（R3 必改）：`data/skills.js` 的 `SKILL_COMBAT_ALIASES`（F3）、`core/modules.js` 的 `SKILL_ALIASES / alignSkillIds`（O4）。`combat/skills.js` 内部的宽容归一化（旧别名仍可命中）是防御性细节，不具规范地位、不得新增依赖。
4. 新掌 / 新技能 = 先在本表登记一行，再写代码。

### 3.2 `HUB` 安全区大厅布局表（HUB-R1 新增，Fable-3 所有；`src/data/hub.js`）

大厅布局是**数据不是代码**（ADR-26）：具体数值归 F3，本节只冻结形状与硬约束。sim 经 `deps.js` 静态引入并在 `createMatch` 时快照进 `state.hub.layout`；render/ui 从 `view.hub` 读，**禁止任何模块硬编码第二份坐标**。

```ts
export const HUB: HubLayout;

interface HubLayout {
  floorY: number;                       // 大厅地面高度（y）
  spawn: { x: number; z: number; yaw: number };   // p0 出生点（走道一端），yaw 面向门
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
                                        // 可走范围 AABB，sim 硬钳制（安全区走不出去、掉不下去）
  interactRadius: number;               // 靠近交互半径，1.6..2.2
  portal: {
    x: number; z: number; yaw: number;  // 门中心与朝向（渲染/说明牌用）
    aabb: { minX: number; maxX: number; minZ: number; maxZ: number };   // 传送触发区
  };
  pedestals: HubPedestal[];             // 恰好 8 条，走道两侧各 4 座
}
interface HubPedestal {
  gloveId: GloveId;                     // 8 只掌一一对应，gloveId 全表唯一
  x: number; z: number; yaw: number;    // 台座位置与展掌朝向（yaw 遵守 ADR-17）
  y?: number;                           // 展掌悬浮高度，缺省 HUB.floorY + 台座高（F3 定）
}
```

硬约束（F4 验收 / G1 契约测引用）：

1. `pedestals.length === 8`，`gloveId` 覆盖全部 8 只掌且不重复；顺序 = `GLOVES` 图鉴顺序。
2. `interactRadius ∈ [1.6, 2.2]`；相邻台座间距 > `2 × interactRadius`（聚焦无歧义）。
3. 大厅全部几何（bounds ∪ portal.aabb ∪ 各台座）与裂岛圆盘（半径 20 + 2m 缓冲）**不重叠**——O2 双场景同世界摆放不穿帮。建议走道沿 -Z 推进：spawn 在 +Z 端、门在 -Z 端，与 yaw=0 → -Z 同向（开局镜头即面向走道纵深）。
4. `spawn`、全部台座、`portal.aabb` 都在 `bounds` 内；门 AABB 不与任何台座的交互半径相交。

## 4. `src/sim`（Opus-1 所有；入口 `src/sim/index.js`）

### 4.0 依赖接线（ADR-19/24，冻结）

`src/sim/deps.js` **静态 import** `../data/gloves.js`（运行时权威掌表）、`../data/hub.js`（大厅布局，HUB-R1 新增）与 `./combat-bridge.js`（其内静态 import `../combat/index.js`）——生产路径零动态注入，**import sim 即已接线**。`getDeps()` 返回 `{ MATCH, GLOVES, GLOVE_BY_ID, HUB, combat, usingRealData, usingRealCombat }`：

- **`usingRealCombat === true ⇔ 未装替身（combatMod === null）⇔ 生产静态桥在岗**。`installCombat(mod)` 传任何非 null 模块都置 false——即使传真实 `src/combat` 命名空间，因为绕过桥（朝向换算、命中翻译、事件消化）就不是产线路径（ADR-24）。**false 读作「测试替身在场」，不是「combat 缺席」**。
- `usingRealData` 同理（仅当替身给出非空 `GLOVES` 才为 false）。`installData` 会经 `normalizeGlove` 用真实 cotton 补全替身缺字段，防 sim 吃 NaN。替身可携 `HUB` 覆盖布局（测试用），缺席回落真实表。
- `installData / installCombat / resetDeps` 仅供测试隔离；`resetDeps()` 回到真实模块。用过 install* 的测试必须收尾 `resetDeps()`。
- 产线与探针的断言姿势：**什么都不装**，直接断言两布尔为 true；为假 = 替身泄漏，main 亮降级横幅。`autoWireOptionalDeps` 已删除。
- deps 每次 rebuild 会调 `bridge.syncGloveTable(GLOVE_BY_ID)`：combat 内部延迟结算路径与 sim 共用同一张掌表（技能 id 已按 §3.1 翻译）。

### 4.1 契约四件套 + 附属导出

```ts
export function createMatch(opts: {
  seed: number;
  gloveId: GloveId; offhandId: GloveId;     // 人类主/副掌；非法 id 回落 cotton。
                                            // startPhase:'hub' 时是「预选」：进局即持有，但未算「已选」
                                            // （chosen 位 false，portalReady false，见 §4.4）
  botCount?: number;                         // 默认 3
  botPersonas?: Persona[];                   // 默认 brute→fox→bully 循环
  config?: Partial<MatchConst>;              // 测试用覆盖
  startPhase?: 'hub'|'arena';                // HUB-R1 新增（ADR-25）。缺省 'arena'——既有测试/探针零回归；
                                             // 产品路径（shell.startMatch）必须传 'hub'（F4 验收线）
  unlockedGloveIds?: GloveId[];              // HUB-R1 新增（ADR-26）：hub 装备许可集，缺省 ['cotton']
                                             // （fail-closed）；cotton 恒解锁；未知 id 忽略；sim 不读存档，
                                             // shell 用 data.isGloveUnlocked + 存档换算后传入
}): MatchState;

export function step(state: MatchState, inputs: Partial<Record<PlayerId, Partial<Input>>>, dt: number): MatchState;
// 就地更新并返回同一引用。dt 缺省/非法用 config.dt；> 1/60 自动切等长子步；上限 0.25。
// 顺序（冻结）：清 events（每 step 一次，子步共用缓冲）→ 每子步：combat.tickStatuses（含
// 延迟命中回执）→ 计时器/重生 → 动作（换掌/冲刺/跳/扇击前摇/技能）→ 位移积分 → 互推
// → 地面/护栏 → 前摇到帧的扇击结算 → 掉落 ko（y<fallY 或出盘无支撑）→ updateMatch。

export function getView(state: MatchState): MatchView;   // §4.3

export function isMatchOver(state: MatchState): { over: boolean; winnerId?: PlayerId|null; reason?: 'kills'|'time' };
```

**`isMatchOver` 语义（ADR-20，冻结；HUB-R1 修订计时域，ADR-27）**：

- **纯读的活谓词，不要求先 `step`**。调用不改 state、不发事件。
- `over ⇔ state.match.over ∨ ∃p: p.kills ≥ config.killsToWin ∨ arenaTime ≥ config.matchSeconds`，
  其中 **`arenaTime = phase === 'arena' ? state.time − state.hub.enteredArenaAt : 0`**——
  时间判据只在格斗区计时域内成立，逛大厅不吃对局时间；`phase === 'hub'` 恒 `over: false`。
  `startPhase: 'arena'` 时 `enteredArenaAt = 0`，`arenaTime ≡ state.time`，v3 语义逐位一致。
  调用方直接改 `player.kills`（如契约测试）后**立即**得到 `over: true`。
- `winnerId/reason`：已缓存则回缓存；否则杀数达标 ⇒ 该玩家（按 players 序取先者）+ `'kills'`；时间到 ⇒ 杀数最多者（平杀比死数少、再平按 players 序）+ `'time'`。本版无 `'draw'`。
- `step` 内的 `updateMatch` 仍负责把结果写入 `state.match` 并发 `matchOver` 事件——**事件与缓存需要 step，布尔真值不需要**。`isMatchOver` 与 `updateMatch` 共用 `decideMatch(state)`（现算、不写 state），保证「直接改 kills 再问」与「跑满 step」两条路答案一致。

附属导出（现有名单冻结，不得删除；节选常用面）：

```ts
export { installData, installCombat, resetDeps, getDeps, resolveGlove };   // 接线（测试用）
export function getMatchConfig(): MatchConst;        // 生效中的 MATCH 副本（main 传 shell 用这份）
export function getGloves(): GloveDef[];             // 生效中的掌表副本
export function damageTileAt(state, x: number, z: number, amount: number): { tile, broken } | null;
                                                     // 台面伤害唯一入口：发事件、计 stats
export function hasFloorUnder(state, x: number, z: number): boolean;
export const ZERO_INPUT: Input;
export function applyHits(state, attacker, hits: HitRecord[], source: 'slap'|'skill'): number;
export { getPlayer, activeGlove, activeGloveId, respawnPlayer };
export { forwardX, forwardZ, rightX, rightZ, yawFromDir, wrapAngle, FACE };
                                                     // ADR-17 约定的朝向 helper，测试必用；
                                                     // FACE.combatOffset = π 是桥的换算相位差
export { PHYSICS, ARENA, SIM_VERSION };              // sim 自有物理/台面常量（不由 data 覆盖）
export { applyKnockback, statusMods, isSupported, tileAt, crackOf };
export { decideMatch, leaderOf };                    // isMatchOver / updateMatch 共用的判据
export { createRngState, nextFloat, nextRange, nextU32 };
// combat 同名转发：resolveSlap / resolveSkill / tickStatuses / applyAwaken
// （经 getDeps().combat，即 §5 的生产桥）
```

### 4.2 MatchState（冻结字段；O1 可加内部字段，需登记）

```ts
interface MatchState {
  version: 1; seed: number;
  rng: { a: number; b: number; c: number; d: number };   // sfc32，纯整数
  time: number; tick: number;
  config: MatchConst;                 // createMatch 时快照（含 opts.config 覆盖）
  phase: 'hub'|'arena';               // HUB-R1 新增（ADR-25）：双区状态机，R1 单向 hub → arena
  hub: HubState;                      // HUB-R1 新增：大厅簿记（两个 phase 下都存在）
  arena: ArenaState;
  players: PlayerState[];             // [0] 恒为 p0
  events: SimEvent[];                 // 本 step 产生，开头清空，≤ 96 条
  match: { over: boolean; winnerId: PlayerId|null; reason: 'kills'|'time'|null; secondsLeft: number };
  stats: { slaps: number; hits: number; kos: number; tilesBroken: number };
}

interface HubState {                  // HUB-R1 新增；纯数据，随 state 一起 structuredClone
  mainChosen: boolean;                // 主掌是否已在走道确认（portalReady 的判据）
  offChosen: boolean;
  focusGloveId: GloveId|null;         // 当前聚焦展掌（interactRadius 内最近；arena 阶段恒 null）
  nearPortal: boolean;                // p0 是否在门 AABB 外扩提示区/门内（HUD 提示用）
  enteredArenaAt: number|null;        // 传送发生时的 state.time；startPhase:'arena' ⇒ 0；hub 中 ⇒ null
  unlocked: GloveId[];                // createMatch 注入的装备许可集（恒含 'cotton'，已去重排序）
  layout: HubLayout;                  // data.HUB 的快照（§3.2），运行期只读
}

interface PlayerState {
  id: PlayerId; kind: 'human'|'bot'; persona: Persona|null;
  spawnSlot: number; spawnAngle: number;
  x: number; y: number; z: number; yaw: number;          // yaw 按 ADR-17 约定
  vx: number; vy: number; vz: number;
  gloveId: GloveId; offhandId: GloveId; activeSlot: 0|1; switchLockT: number;
  meter: number; awakenedT: number;
  statuses: { id: string; t: number; mag?: number; src?: PlayerId|null }[];
  alive: boolean; invulnT: number; respawnT: number;
  kills: number; deaths: number; streak: number; bestStreak: number;
  grounded: boolean; coyoteT: number; jumpHeld: boolean;
  dashT: number; dashCd: number; dashDirX: number; dashDirZ: number;
  slapCd: number; skillCd: number;                       // 玩家级标量，双掌共享（ADR-8 已废除）
  attack: { phase: 'idle'|'windup'|'strike'|'recovery'; t: number; gloveId: GloveId; struck: boolean };
  combo: number; comboT: number;
  knockScale: number; kbT: number;                       // kbT>0 = 击退失控窗口（重击穿栏）
  lastHitBy: PlayerId|null; lastHitT: number;            // 击杀归属窗口 = PHYSICS.killCreditWindow (5s)
  hitsDealt: number; hitsTaken: number;
  prev: { slap; skill; switchGlove; dash; jump; interact: boolean };  // sim 内部边沿检测
                                                            // （interact 为 HUB-R1 新增位）
}

interface ArenaState {                // 方格拓扑（ADR-18）
  radius: number; tileSize: number;   // 20 / 2.5
  cols: number; origin: number;       // grid 方阵参数；几何由此推导
  grid: number[];                     // iz*cols+ix → tiles 下标；-1 = 盘外
  tiles: TileState[];                 // ~208 块
  brokenCount: number; floorY: number;
}
interface TileState {
  i: number; ix: number; iz: number;  // 下标与格坐标
  x: number; z: number;               // 块中心（世界系）
  zone: 0|1|2|3;                      // 象限
  seam: boolean;                      // 中缝带（|x| < 1.9），HP 更低
  hp: number; maxHp: number; alive: boolean;
}
```

### 4.3 MatchView（`getView` 返回；渲染/AI/HUD 唯一输入）

```ts
interface MatchView {
  version: number; seed: number;
  time: number; tick: number;
  config: Pick<MatchConst, 'dt'|'arenaRadius'|'playerRadius'|'playerHeight'|'fallY'|
    'respawnDelay'|'invulnTime'|'matchSeconds'|'killsToWin'|'switchLock'|'awakenDuration'>;
  phase: 'hub'|'arena';               // HUB-R1 新增；渲染/HUD/AI 的分区开关
  hub: HubView | null;                // HUB-R1 新增；真实 sim 恒为对象（两个 phase 下都给，
                                      // 几何静态、体积小）；null 仅允许出现在降级件，消费方须容错
  match: { over: boolean; winnerId: PlayerId|null; reason: 'kills'|'time'|null; secondsLeft: number };
                                      // hub 阶段 secondsLeft ≡ matchSeconds（计时冻结，ADR-27）
  arena: {
    radius: number; tileSize: number; cols: number; origin: number;
    floorY: number; brokenCount: number;
    tiles: ViewTile[];
  };
  players: ViewPlayer[];
  events: SimEvent[];
  stats: { slaps: number; hits: number; kos: number; tilesBroken: number };
}

interface HubView {                    // HUB-R1 新增（ADR-26/27）
  focusGloveId: GloveId|null;          // 聚焦展掌；HUD 说明牌与 render 高亮的唯一依据
  portalReady: boolean;                // ⇔ mainChosen；门可用
  nearPortal: boolean;                 // p0 在门提示区内（§4.4 定义）
  mainChosen: boolean; offChosen: boolean;
  interactRadius: number;
  spawn: { x: number; z: number; yaw: number };
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  floorY: number;
  portal: { x: number; z: number; yaw: number;
            aabb: { minX: number; maxX: number; minZ: number; maxZ: number } };
  pedestals: HubPedestalView[];        // 恒 8 条，GLOVES 图鉴顺序
}
interface HubPedestalView {
  gloveId: GloveId;
  x: number; y: number; z: number; yaw: number;
  unlocked: boolean;                   // 装备许可（unlockedGloveIds 注入的结果）
  selected: 'main'|'off'|null;         // 已确认落位的槽；未 chosen 的预选不算
  focused: boolean;                    // === (gloveId === focusGloveId)
}
interface ViewTile {
  i: number; x: number; z: number; zone: 0|1|2|3; seam: boolean;
  hp: number; maxHp: number; alive: boolean;
  crack: number;                       // 0..1 裂纹程度；碎块恒 1
}
interface ViewPlayer {
  id: PlayerId; kind: 'human'|'bot'; persona: Persona|null;
  x: number; y: number; z: number; yaw: number;
  vx: number; vy: number; vz: number; speed: number;
  gloveId: GloveId; offhandId: GloveId; activeSlot: 0|1;
  activeGloveId: GloveId; gloveName: string; gloveColor: string;   // HUD/render 直用
  switchLockT: number;
  meter: number; awakenedT: number; awakened: boolean;
  statuses: { id: string; kind: string; t: number; mag: number|null }[];   // kind === id，双词兼容
  alive: boolean; invulnT: number; respawnT: number;
  kills: number; deaths: number; streak: number;
  grounded: boolean; dashT: number; dashCd: number;
  slapCd: number; skillCd: number;
  attackPhase: PlayerState['attack']['phase']; attackT: number;
  combo: number; knockScale: number;
}
// 编排层用 core/interp.js lerpView(prev, cur, alpha) 产出插值快照后再交 renderer（ADR-12 修订）。
// HUB-R1：prev.phase !== cur.phase（传送帧）⇒ lerpView 整帧跳插值直接返回 cur（ADR-27）。
```

### 4.4 双区与大厅交互语义（HUB-R1 新增，ADR-25/26/27，冻结）

**安全区四禁（`phase === 'hub'` 时 sim 的行为面）**：

1. **不进 combat 管线**：不调 `tickStatuses / resolveSlap / resolveSkill`，扇击相位机不启动（`slap` 按住无效、不发 `slapStart/slap` 事件），无击退、无 meter 收支、无状态、无觉醒。
2. **无掉落**：支撑不查 `arena` 台面；p0 位置逐子步被 `hub.layout.bounds` AABB 硬钳制（贴墙滑动，不反弹）；`fallY` 与出盘 ko 判定跳过。移动/冲刺/跳照常（手感与 arena 一致）。
3. **Bot 静默**：bot 保持 `createMatch` 时的裂岛站位不动。编排层 hub 阶段不调 `ai.think`（ADR-28）；即使被喂输入，sim 在 hub 阶段也只对 p0 结算动作（双保险）。
4. **计时冻结**：`match.secondsLeft ≡ matchSeconds`；`isMatchOver` 恒 `over: false`（§4.1 计时域）。

**聚焦（focus）**：每子步计算 `focusGloveId` = 与 p0 的 **xz 距离 ≤ `interactRadius`** 的最近展掌；并列取 `pedestals` 表序靠前者；半径内无展掌 ⇒ `null`；`phase === 'arena'` ⇒ 恒 `null`。`nearPortal` ⇔ p0 的 xz 位置落在 `portal.aabb` 各边**外扩 `interactRadius`** 的矩形内（提示区复用交互半径，不加新调参项）。

**`interact` 上升沿的装备结算**（仅 hub；对象 = 当前聚焦展掌，无聚焦 ⇒ no-op）：

| 前置状态（自上而下取首条命中） | 结果 | 事件 |
| --- | --- | --- |
| 展掌未解锁（∉ `hub.unlocked`） | 拒绝，配装不变 | `hubDeny { reason: 'locked' }` |
| 该掌已**确认**落位（`selected ≠ null`；预选不算） | no-op（HUD 显示「已装备」） | 无 |
| `!mainChosen` | 写主槽：`gloveId = 该掌`、`activeSlot = 0`、`mainChosen = true` ⇒ `portalReady` | `hubEquip { slot: 'main' }` |
| `mainChosen && !offChosen` | 写副槽：`offhandId = 该掌`、`offChosen = true` | `hubEquip { slot: 'off' }` |
| 双槽已满 | 替换副槽（主掌不被覆盖） | `hubEquip { slot: 'off' }` |

**hub 内 `switchGlove`** = 主副槽**交换**（`gloveId ↔ offhandId`，chosen 位与 selected 标记随行，`activeSlot` 归 0，无 switchLock 代价，发既有 `switch` 事件 `slot: 0`）。要换主掌：新掌先落副槽，再按一次换掌交换。arena 阶段维持既有 activeSlot 切换语义，互不影响。

**传送**：`portalReady ∧ p0 的 xz 进入 portal.aabb` 的同一 tick 完成——`phase = 'arena'`、`enteredArenaAt = state.time`、p0 走既有出生点链路（`spawnSlot 0 → spawnPointFor → findSpawnSpot`，速度清零、`grounded = true`、朝台心、`invulnT = invulnTime`）、**loadout 原样保留**、`activeSlot = 0`，发 `phaseChange`（携落点坐标，相机瞬移用）。未 ready 进 AABB 不传送、不发事件——「先选一只掌」提示由 HUD 从 `nearPortal ∧ !portalReady` 状态读出（状态驱动，非事件驱动）。穿门即传送，无需 interact，键鼠触控同一路径。

**选掌预选与存档**：`createMatch(opts.gloveId/offhandId)` 在 hub 开局下只是「预选」（角色手上可先渲染为空手，O2 自便），chosen 位从 false 起步；`hubEquip` 成功后 **O4 负责把配装写回存档**（`updateSave({ loadout })`，存档 schema §12 不变）。

**确定性**：hub 全部判定（聚焦/装备/传送）是 state + inputs 的纯函数，不引入新随机数；`structuredClone` 与逐位复现契约（§1-2/§1-5）对 `phase/hub` 字段同样成立。

## 5. `src/combat`（Opus-3 所有）与生产桥 `src/sim/combat-bridge.js`（Opus-1 所有）

分工（冻结）：`src/combat/**` 自带一套内部约定（yaw=0 朝 +Z、命中 `{ id, … }` 且冲量已就地写进目标速度、事件直 push、自带 `cd/busyUntil` 台账）；**sim 只经生产桥调用 combat**，桥把内部约定翻译成本节契约，桥外不可见。**除桥（与 O3 自测）外任何文件不得 import `src/combat`**。

### 5.1 桥的翻译职责（冻结）

1. **朝向**：进 combat 前全体玩家 `yaw += FACE.combatOffset (π)`，返回时还原/换算回 -Z 约定（ADR-17 的唯一 combat 侧换算点）。
2. **闸门**：sim 独占动作闸门（`attack` 相位机、`slapCd/skillCd` 标量、`switchLockT`、`kbT`）。桥每次调用前清掉 combat 的 `cd/busyUntil`，combat **必须解算**、不得二次拦截 sim 已闸过的调用；combat 的 `beginSlap`/pending 前摇机制不进产线路径（sim 的 windup 相位机是唯一前摇实现）。
3. **命中**：combat 的 `{ id, impulse, … }` 翻译成 `{ targetId, attackerId, power, impulse, applied: true, skillId }`；`parried` 命中剔除（combat 已把冲量反打回攻击者，不再记一次受击）。
4. **事件（ADR-22）**：combat push 的事件先进桥的暂存缓冲，翻译成 §10 词表（`awaken / awakenEnd / parry / meteorImpact / ghostSlap`；`tileBreak` 顺带补 `brokenCount / stats` 记账）后由 sim 代发；其余暂存事件丢弃（sim 已发等价事件）。
5. **字段回写**：combat 自有字段同步到 sim 读的字段（`knockbackT → kbT`、`lastHitAt → lastHitT`）。
6. **技能 id**：入参掌与 combat 内部掌表（`syncGloveTable`）按 §3.1 翻译，桥是唯一翻译点。

### 5.2 sim 面向的 combat 契约（桥的导出面 = `getDeps().combat`）

```ts
export function resolveSlap(state, attacker: PlayerState, glove: GloveDef, now: number): { hits: HitRecord[] };
// now = state.time。sim 在扇击前摇到帧（attack.phase === 'strike'）调用。

export function resolveSkill(state, attacker: PlayerState, glove: GloveDef, now: number): {
  ok: boolean; reason?: string;
  skillId?: SkillHandlerId;               // 线上词表 = handler id（§3.1）
  cooldown?: number;                      // 缺省用 glove.skillCooldown
  selfImpulse: { x: number; y: number; z: number } | null;
                                          // 生产桥恒为 null：施法者位移由 combat 状态机就地写速度；
                                          // sim 保留非 null 时的加冲量路径供测试替身用
  hits: HitRecord[];
};
// sim 在 skill 上升沿调用；ok:false 不进冷却。持续型技能由 tickStatuses 逐帧推进。

export function tickStatuses(state, dt: number): { hits: HitRecord[] };
// 就地递减/到期移除状态、掌意收支与衰减、满条觉醒、推进持续技能。
// 返回延迟结算命中（陨掌落地 / 疾风冲刺接触 / 残影假掌），每条必带 attackerId，
// sim 按 attackerId 逐条记账（v2「返回值 sim 忽略」已修订）。

export function applyAwaken(attacker: PlayerState, glove: GloveDef): GloveDef;
// awakenedT > 0 时按 glove.awakenModifiers 返回覆盖后的派生副本；否则原样返回。禁止改 GLOVES。

interface HitRecord {
  targetId: PlayerId;
  attackerId?: PlayerId | null;           // tickStatuses 的延迟命中必填
  applied: boolean;                       // true = combat 已就地写入目标速度，sim 只记账不重复推
  impulse: { x: number; y: number; z: number };
  power: number;                          // 水平冲量模长（事件/音效强度用）
  skillId?: SkillHandlerId | null;
  hitX?: number; hitZ?: number;
  tile?: { x: number; z: number; amount: number };      // 对地伤害，sim 转 damageTileAt
  statuses?: { id: string; t: number; mag?: number; src?: PlayerId|null }[];
}
// 生产桥常态只输出前六个字段（状态/碎地由 combat 就地结算、tileBreak 走事件消化）；
// 可选字段是 sim.applyHits 的能力面，测试替身可用。v2 的 kind 字段废除（applyHits 的
// source 参数替代）；behind 背身加成在 combat 内部结算，不出桥。
```

台面伤害一律走 sim 的 `damageTileAt(state, x, z, amount)` 或经 `HitRecord.tile` 由 sim 代转；combat 直改 `tile.alive` 的既有路径由桥的 `tileBreak` 消化补齐记账（`creditTileBreak`），**禁止再添第三条路**。

## 6. `src/ai`（Opus-3 所有；入口 `src/ai/bots.js`）

```ts
export function think(view: MatchView, botId: PlayerId, rng: () => number): Input;
// 纯函数 + 模块内 per-bot 记忆：只读 view（上一 tick 快照）与 rng（0..1，编排层提供，
// 不碰 state.rng）。每个模拟 tick 被调一次；实现必须与调用频率无关（内部自带计时）。
// 性格取 view 内该 bot 的 persona：brute 直线硬冲高频扇；fox 沿边绕走、卡碎裂边线；
// bully 优先残血/背身/刚落地目标。产出的 moveX/moveZ 为世界系、yaw 遵守 ADR-17。
// 编排层实际传入的是经 core/view.js adaptView 整形的超集快照（多 name/color/timeLeft
// 等字段，yaw 未动）；think 只依赖 §4.3 字段即可，不得依赖超集字段。
// HUB-R1（ADR-28）：view.phase === 'hub' ⇒ 立即返回零输入（不动、不出招）。这是防御性
// 双保险——产线编排层在 hub 阶段本就不调 think；缺 phase 字段的旧快照按 'arena' 对待。
```

## 7. `src/render`（Opus-2 所有；three 仅存在于此目录）

模块级单例（ADR-1）：`createRenderer` 初始化并返回句柄，模块级 `sync/resize/setQuality/dispose` 操作该单例（main 经 `bindRenderer` 两种姿势都接受）。

```ts
export function createRenderer(canvas: HTMLCanvasElement, opts?: {
  tier?: Tier; pixelRatio?: number; width?: number; height?: number;
  seed?: number; arenaRadius?: number;
  localId?: PlayerId;      // 本地玩家，缺省 'p0'（ADR-16）；main 传 followId 亦须接受
  [k: string]: unknown;    // 未知 opts 必须容忍
}): RendererHandle;

export function sync(view: MatchView): void;
// 每 rAF 一次，view 已由编排层插值。消费：view.arena 方格台面（ADR-18：由
// origin/tileSize/cols + tiles[].x/z 建板，alive/crack/seam/zone 驱动碎裂与缝隙表现）、
// players（yaw 直接 rotation.y）、events（§10 词表触发 VFX）。字段缺失容错不抛错。
// HUB-R1：view.hub 存在 ⇒ 建大厅场景（走道、台座、门；8 只展掌**手指朝上 +Y**、轻微
// 悬浮/呼吸、每掌可辨识的 idle VFX——霜雾/岩屑/风带/磁弧等，禁纯色光球）；按 view.phase
// 切场景与相机域；pedestals[].focused/selected/unlocked 驱动高亮/落位标记/锁灰态；
// phaseChange 事件 ⇒ 短过渡（淡场或门内粒子，禁加载条）+ 相机瞬移到事件携带的落点。
// view.hub === null（降级件）⇒ 跳过大厅表现，不抛错。

export function resize(width: number, height: number, dpr: number): void;   // dpr 已被 main 封顶 2
export function setQuality(tier: Tier): void;
export function dispose(): void;         // 释放 GL 资源，可重复调用
// 句柄可选追加：render(view, alpha)、setFollow(id) —— 存在则 main 会调用
```

## 8. `src/input`（Opus-4 所有）

模块级单例。**ui 建 DOM（`data-yz-*` 标记），input 绑事件**；canvas 上接管拖动/Pointer Lock 视角。

```ts
export function createInput(dom: HTMLElement|Document, canvas: HTMLCanvasElement, opts?: {
  sensitivity?: number; invertY?: boolean; pointerLock?: boolean;
  onFirstGesture?: () => void; onPause?: () => void;
}): InputHandle;

export function sample(cameraYaw: number): Input;
// 每模拟步一次。按 §2 公式把摇杆/WASD 换算成世界系 moveX/moveZ；Input.yaw = cameraYaw。
// R2 达标方式：input 内部保留自己的相机方位角，换算收敛在 core/view.js 的
// cameraYawToSimYaw / simYawToCameraYaw（唯一适配点）；sample 返回的必须是
// ADR-17 约定下的世界系结果，换算不得散布到其它文件。
// HUB-R1（ADR-28）：键鼠 E 键双义——keydown 同时置 skill(hold) 与 interact(edge)，
// input 不感知 phase，由 sim 按 phase 只消费其一；sample 返回的 Input 含 interact 位。
export function setEnabled(enabled: boolean): void;   // false：动作清零、移动归零
export function getLook(): { yaw: number; pitch: number };   // 相机朝向权威源（ADR-4/17）
// 句柄追加（冻结命名）：setLook(yaw, pitch)、setSensitivity(v)、setPointerLock(on)、
// releasePointerLock()、setTouchButton(name, down)
// HUB-R1：setTouchButton 的 name 词表增加 'interact'（触控「选」按钮，hub 阶段显示；
// DOM 由 ui 建并带 data-yz-interact 标记，input 绑事件——分工不变）。
```

禁止锁敌自动瞄（种子红线）：input 只产出方向与动作位，不做目标吸附。

## 9. `src/audio`（Opus-4 所有）

模块级单例。WebAudio 全合成，无外部音频文件。

```ts
export function createAudio(opts?: { muted?: boolean }): AudioHandle;
export function unlock(): void;    // 首次 pointer 手势调用；重复调用无害
export function play(name: SoundName, opts?: Record<string, number>): void;
// 未知 name 静默忽略（不 throw）；未 unlock 前的 play 丢弃。
// 句柄追加：setMuted(on)、suspend()/resume()（loop 在 hidden/恢复时调用）
```

## 10. 事件分类学（SimEvent，冻结 —— sim 实际发射的词表）

所有事件由 sim 的 `pushEvent` 发出并自动带 `t: number`（模拟秒）。新事件类型先登记再实现。

```ts
type SimEvent = { t: number } & (
  | { type: 'slapStart'; id: PlayerId; gloveId: GloveId }
  | { type: 'slap';      id: PlayerId; gloveId: GloveId; hits: number;   // hits=0 ⇒ 空挥
      x: number; y: number; z: number; yaw: number }
  | { type: 'hit';       id: PlayerId; targetId: PlayerId; source: 'slap'|'skill';
      power: number; x: number; y: number; z: number }
  | { type: 'ko';        id: PlayerId; by: PlayerId|null; reason: string;  // by=null 自坠
      x: number; y: number; z: number }
  | { type: 'respawn';   id: PlayerId; x: number; y: number; z: number }
  | { type: 'jump';      id: PlayerId; x: number; y: number; z: number }
  | { type: 'dash';      id: PlayerId; x: number; y: number; z: number }
  | { type: 'switch';    id: PlayerId; slot: 0|1; gloveId: GloveId }
  | { type: 'skill';     id: PlayerId; gloveId: GloveId; skillId: SkillHandlerId|'none' }
  | { type: 'awaken';    id: PlayerId; gloveId: GloveId|null }      // combat 触发，经桥代发
  | { type: 'awakenEnd'; id: PlayerId }                             // 同上
  | { type: 'parry';     id: PlayerId; targetId: PlayerId; power: number }   // id = 弹反者
  | { type: 'meteorImpact'; id: PlayerId; x: number; z: number; radius: number }
  | { type: 'ghostSlap'; id: PlayerId; targetId: PlayerId }         // 残影假掌骗中
  | { type: 'tileCrack'; i: number; x: number; z: number; hp: number; maxHp: number }
  | { type: 'tileBreak'; i: number; x: number; z: number; hp: number; maxHp: number }
  | { type: 'matchOver'; winnerId: PlayerId|null; reason: 'kills'|'time' }
  // ---- HUB-R1 新增（ADR-26/27，sim 直发）----
  | { type: 'hubEquip'; id: PlayerId; gloveId: GloveId; slot: 'main'|'off' }   // 走道装备成功
  | { type: 'hubDeny';  id: PlayerId; gloveId: GloveId; reason: 'locked' }     // 未解锁拒绝
  | { type: 'phaseChange'; id: PlayerId; from: 'hub'|'arena'; to: 'hub'|'arena';
      x: number; y: number; z: number; yaw: number }   // 传送完成，携落点（R1 仅 hub→arena）
);
```

注：

- `awaken / awakenEnd / parry / meteorImpact / ghostSlap` 由 combat 触发、经桥翻译后 sim 代发（ADR-22）；其余全部 sim 直发。
- hub 内 `switchGlove` 槽位交换复用既有 `switch` 事件（`slot: 0`、`gloveId` = 交换后主掌）；聚焦变化**不是事件**（`view.hub.focusGloveId` 是状态，消费方自行 diff）。
- `skill` 事件与 `HitRecord` 的 `skillId` 是 **handler id**（§3.1 右列）。
- `ko.reason` 现值恒为 `'fell'`（掉落是唯一死法）。
- O4 经 `core/view.js normalizeEvent` 把本词表整形成 shell 内部形状（`ko → killerId/victimId` 等）——线上词表以本节为准，normalizeEvent 的输出形状不冻结。

## 11. 事件 → 音效名对照（main.js 持有；SoundName 词表冻结）

| SimEvent | SoundName |
| --- | --- |
| `slap`（hits>0） / `slap`（hits=0） | `slap` / `slapWhiff` |
| `hit` | `hit`（power 调强度） |
| `skill` | `skill` |
| `switch` | `switchGlove` |
| `dash` / `jump` | `dash` / `jump` |
| `tileCrack` / `tileBreak` | `crack` / `collapse` |
| `ko`（凶手=p0 / 受害=p0 / 其他） | `kill` / `death` / `ringout` |
| `respawn`（仅 p0） | `respawn` |
| `awaken` | `awaken` |
| `matchOver` | `matchEnd` |
| `hubEquip` | `equip`（HUB-R1 新增音名） |
| `hubDeny` | `deny`（HUB-R1 新增音名） |
| `phaseChange` | `portal`（HUB-R1 新增音名）；`to === 'arena'` 时 main 顺带播 `matchStart` |
| `view.hub.focusGloveId` 变为非空（main 侧 diff，非事件） | `ui_hover` |
| 局面切换（ui 直接调） | `matchStart` / `ui_click` / `ui_hover` |

未列出的事件（`parry / meteorImpact / ghostSlap / slapStart / awakenEnd`）暂不发声；要加音效先在本表登记。`equip / deny / portal` 由 O4 在 audio 里合成（未知名静默忽略的契约不变，渐进上线安全）。

## 12. 存档 schema（key = `yizhang-save-v1`，`src/core/storage.js` 独占读写）

```ts
interface SaveV1 {
  version: 1;
  unlocked: GloveId[];                       // 恒含 'cotton'
  loadout: { main: GloveId; off: GloveId };
  quality: 'auto'|Tier;                      // 默认 'auto'
  muted: boolean;
  lookSensitivity: number;                   // 0.2..3，默认 1
  invertY: boolean;
  pointerLock?: boolean; touch?: boolean;    // 可选偏好
  stats: { matches: number; kills: number; deaths: number; wins: number; bestKills: number };
}
```

规则：读失败/版本不符 → 默认值并覆写；未知字段写回保留；破坏性变更换 key `yizhang-save-v2` + 迁移。解锁判定用 `data` 的 `UNLOCKS/UNLOCK_BY_GLOVE/isGloveUnlocked`，结果落 `unlocked`。HUB-R1：schema 不变——`unlocked` 就是 `createMatch(opts.unlockedGloveIds)` 的来源；走道装备成功（`hubEquip`）后 O4 把配装写回 `loadout`（§4.4）。

## 13. `src/ui/shell.js` 与 `src/core/loop.js`（Opus-4 所有；最小面）

```ts
// ui/shell —— 主菜单（双掌选择，读解锁位）、HUD、结算、暂停、触控控件 DOM。
// HUD 类名走 F2 的 .yz-* 契约（src/styles），shell 自带样式只做 critical fallback。
export function createShell(opts: { root, gloves, gloveById, save, audio, input, matchConfig,
  callbacks: { onStart(loadout); onResume(); onRestart(); onQuit(); onPauseRequest(); onSettingsChange(next) };
}): {
  updateHud(view: MatchView, selfId: PlayerId): void;   // main ~30Hz 调，内部脏检查
  showMenu(); showMatch(); showResult(r); showPause(); hideSheet();
  toast(text, ms?); pushKill(entry); setNotes(list); setUnlocked(ids);
  settings; screen; menu;
};

// core/loop —— 固定步进 + 插值 alpha + 暂停；回调注入保证可无头测试
export function createLoop(opts: { dt: number;
  step(dt: number): void; draw(alpha: number, info: { paused: boolean }): void;
  onPauseChange?(isPaused: boolean, why: 'user'|'hidden'|'visible'): void;
}): { start(): void; setPaused(on: boolean): void; isPaused(): boolean };
```

O4 可在二者上追加方法，上表所列名字与语义不得变；`main.js` 只做装配与事件→音效映射，不写业务逻辑。

### 13.1 hub HUD 契约（HUB-R1 新增；数据面归本文，视觉归 F2 的 `.yz-inspect`）

`updateHud(view, selfId)` 在 `view.phase === 'hub'` 时额外驱动三块 DOM（类名由 F2 在 `src/styles/**` 定义，shell 按语义挂类）：

1. **靠近说明牌（`.yz-inspect`）**：`view.hub.focusGloveId` 非空时显示，内容全部来自既有只读表——掌名 `name`、职能 `role`、一句话 `desc`、识别色 `color`（仅当前聚焦掌给饱和色）、槽位状态（`selected` 为 `'main'/'off'` ⇒ 「已装备·主/副」；null ⇒ 「按 E / 点『选』装备」+ 将落入的槽位预告，按 §4.4 装备规则推导）；`unlocked === false` ⇒ 锁态样式 + 解锁条件文案（`UNLOCK_BY_GLOVE[gloveId].desc`）。focus 为 null 时隐藏。
2. **门提示**：`nearPortal ∧ !portalReady` ⇒ 「先选一只掌」；`nearPortal ∧ portalReady` ⇒ 「穿过传送门 · 进入裂岛」。状态驱动（读 view），不依赖事件。
3. **配装指示**：HUD 常驻显示当前主/副掌（未 chosen 的槽显示空位），复用既有掌色/掌名字段。

触控：hub 阶段显示「选」按钮（`data-yz-interact`，`setTouchButton('interact', down)`），仅在 `focusGloveId` 非空时可用态；靠近+确认与键鼠同一套语义（种子验收线）。2D 选掌板 `.yz-home` 降为暂停/设置里的备选入口，默认开局不再作为必经路（GOAL 附则）；开始一局 = `startMatch` 以 `startPhase: 'hub'` 进大厅，配装在走道完成。

## 14. 不变量清单（G1 测试基线 / F4 验收引用）

1. `structuredClone(createMatch({seed:1,...}))` 成功；克隆体与原件各 step 600 tick 后 `getView` 深比较相等。
2. `getView` 结果 `JSON.parse(JSON.stringify(v))` 往返无损；调用前后 state 无变化。
3. 扇形命中：`slapRange + playerRadius` / `slapAngleDeg` 边界内命中、边界外与背身不命中；空挥进 recovery（有后摇）。**helpers 用 ADR-17 约定**（面向 +X ⇔ `yaw = -PI/2`）。
4. 击退：命中者获水平冲量 ≥ `slapPower` 基准且方向正确；`invulnT > 0` 目标免疫。
5. 掉落：脚下无台 ⇒ 下落，`y < fallY` ⇒ `ko` 事件 + `respawnT = respawnDelay`；`killCreditWindow (5s)` 内有 `lastHitBy` ⇒ 记杀且 streak 递增；自坠 streak 清零。水平出盘（无支撑）必须在有限步内 ko；重击退（`kbT > 0` 且速度达标）不得被护栏截停。
6. 换掌：`switchLockT` 从 0.4 递减，期间 slap/skill 无效；边沿触发，长按不连切。
7. 觉醒：meter 累积到 1 自动触发、`awakenedT` 从 8 递减、期间 `applyAwaken` 覆盖生效、死亡清零、重生 meter ≤ 0.35。
8. 碎地：`damageTileAt` 发 `tileCrack`，HP≤0 发 `tileBreak` 且 `hasFloorUnder` 立即为 false；站在其上的玩家开始下落。
9. **`isMatchOver` 活谓词**：直接改 `player.kills ≥ killsToWin` 后不 step 即 `over: true` 且 `winnerId` 正确；步进超过 `matchSeconds` 后 `over: true, reason: 'time'`。
10. 掌表：8 只手套字段齐全（§3 GloveDef）；`isGloveUnlocked('cotton', {}) === true`，其余无进度时 false。
11. sim/combat/ai/data 源码静态扫描无 `three`、`document`、`window`、`Math.random`（G2 probe 断言）。
12. 技能入局：装备 magnet 的玩家对目标放技能并 `step` 若干帧后，两者水平距离必须缩短（真实 combat 接线的回归锚点）。
13. **接线不变量（ADR-24）**：import `src/sim` 后不做任何 install，`getDeps().usingRealData === true && usingRealCombat === true`；probe 的 wiring 断言以此为准、**不得先 install 再测**。`installCombat(任意非 null 模块)` 后 `usingRealCombat` 必须为 false，`resetDeps()` 后恢复 true。
14. **hub 开局形状（ADR-25）**：`createMatch({ startPhase: 'hub', ... })` ⇒ `view.phase === 'hub'`、p0 位于 `HUB.spawn`（yaw 面向门）、`view.hub.pedestals.length === 8`（图鉴顺序、gloveId 唯一）、`portalReady === false`、`secondsLeft === matchSeconds` 且 step 若干秒不减、`isMatchOver().over === false`。**缺省不回归**：不传 `startPhase` ⇒ `phase === 'arena'`、`enteredArenaAt === 0`，不变量 1–13 原样成立。
15. **靠近聚焦（ADR-26）**：把 p0 置于某展掌 `interactRadius` 内并 step ⇒ `focusGloveId` 为该掌；移出半径 ⇒ `null`；两座之间时取最近者。
16. **interact 装备（ADR-26）**：聚焦已解锁掌 + `interact` 上升沿 ⇒ 按 §4.4 表落主槽（`hubEquip{slot:'main'}`、`portalReady === true`）；再聚焦另一已解锁掌 interact ⇒ 落副槽；**长按 interact 不连发**（边沿检测）；hub 内 `switchGlove` ⇒ 主副交换。
17. **未解锁拒绝（ADR-26）**：聚焦 `unlockedGloveIds` 之外的掌 + interact ⇒ 配装与 chosen 位不变、发 `hubDeny{reason:'locked'}`、`portalReady` 不变；缺省许可集下除 cotton 外全拒绝（fail-closed）。
18. **传送（ADR-27）**：`portalReady` 后把 p0 推进 `portal.aabb` ⇒ 同 tick `phase === 'arena'`、发 `phaseChange`（落点 = p0 新坐标）、`hasFloorUnder(state, p0.x, p0.z) === true`、loadout 与传送前逐字段相等、`activeSlot === 0`、`invulnT > 0`；未 ready 进 AABB ⇒ 不传送、无事件。传送后 `secondsLeft` 开始递减、扇击/技能/击退/掉落恢复既有语义。
19. **安全区免战（ADR-25）**：hub 阶段对全体玩家喂任意输入组合 step 数秒 ⇒ 事件流无 `slapStart/slap/hit/ko`、全员 `meter` 与 `statuses` 不变、bot 位置不变、p0 始终在 `bounds` 内且 `alive === true`（无掉落、无出局）。
