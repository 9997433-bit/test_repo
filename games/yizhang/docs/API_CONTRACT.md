# 异掌 · 公共 API 契约 v4（手感轮 R1 · Fable-1，冻结）

> v3（R3）基线全部沿用；本版（手感轮）改四处：**① 渲染朝向零补偿**——`RENDER_YAW_OFFSET` 冻结为 0，朝向换算点从三处收敛到两处（ADR-25，§1-8）；**② 皮肤契约**——`src/data/skins.js` 词表与 SkinDef（§3.2）、`createMatch.skinId / botSkinIds`（§4.1）、`view.players[].skinId`（§4.3）、存档 `skinId`（§12）、大厅选择器（§13）；**③ 每掌 VFX 事件**——`hit` 补 `gloveId/skillId`、桥代发事件补齐 id、`view.combat.ghosts` 导出（§4.3、§5.1、§10，ADR-27）；**④ hit-stop 语义**（ADR-28，只登记边界、不改导出面）。
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
8. **朝向约定全局唯一**（ADR-17，手感轮修订）：`yaw = 0` 面向 **-Z**，`forward(yaw) = (-sin yaw, -cos yaw)`，`right(yaw) = (cos yaw, -sin yaw)`；three 侧 `mesh.rotation.y = yaw` 直用。**render 零补偿（ADR-25）**：`core/view.js` 的 `RENDER_YAW_OFFSET` 恒为 0，`toRenderView` 对 yaw 恒等透传。朝向换算点全项目只有两处：`sim/combat-bridge.js`（combat ±π，含 `ghostsView` 的 yaw 还原）与 `core/view.js cameraYawToSimYaw / simYawToCameraYaw`（相机方位角）。键鼠语义验收线：**W = 镜头水平前方、A = 屏幕左、鼠标右移 = 右转**（锚点公式见 ARCHITECTURE §5.1.1 与本文 §14-15/16）。
9. **人类玩家 id 全局唯一**（ADR-16）：`'p0'`；bot 为 `'b0' | 'b1' | 'b2'`。
10. **皮肤纯装饰**（ADR-26）：`skinId` 只影响外观，禁止挂数值；sim 视其为不透明字符串，合法性由消费端 `resolveSkin` 兜底。

## 2. 通用类型

```ts
type PlayerId = 'p0' | `b${number}`;   // p0 = 人类；b0..b2 = bot（botCount 默认 3）
type GloveId  = 'cotton'|'granite'|'gale'|'frost'|'spring'|'afterimage'|'magnet'|'meteor';
type Tier     = 'high'|'mid'|'low';
type Persona  = 'brute'|'fox'|'bully';
type SkinId   = 'drifter'|'mason'|'crane'|'reed'|'nuo'|'wildhorn';   // 皮肤词表 v1（§3.2）；新皮肤先登记再写代码
// 技能 id 两套词表（翻译表见 §3.1，ADR-23）
type SkillDataId    = 'quake_slam'|'wind_rush'|'frost_arc'|'coil_counter'|'phantom_swap'|'iron_pull'|'sky_fall';
type SkillHandlerId = 'groundPound'|'dashSlap'|'frostArc'|'parry'|'blinkSwap'|'magnetPull'|'meteorSlam';

interface Input {
  moveX: number;          // -1..1，世界系（input 层已按 cameraYaw 换算），√(x²+z²) ≤ 1
  moveZ: number;          // -1..1，世界系
  yaw: number | null;     // 期望面朝角（世界系弧度，ADR-17 约定）；null = 保持当前朝向
  slap: boolean;          // 可长按（sim 冷却/相位机闸门）
  skill: boolean;         // 可长按（sim 边沿检测 + 冷却）
  switchGlove: boolean;   // ↓ 三个由 sim 做上升沿检测，长按不连发
  dash: boolean;
  jump: boolean;
  moveSpace?: 'world'|'local';   // 缺省 'world'；'local' 按玩家 yaw 旋转，仅测试用
}
// 缺省玩家视为 ZERO_INPUT：{ moveX:0, moveZ:0, yaw:null, 其余 false }
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
  vfx?: {                           // 手感轮新增（可选，纯数据调参）：颜色/粒子数/半径/时长等，
    slap?: Record<string, number|string>;    // O2 消费；缺省时 O2 用内建参数。
    skill?: Record<string, number|string>;   // 注意：VFX 分派键永远是事件上的 gloveId/skillId
    hit?: Record<string, number|string>;     //（ADR-27），本字段只调参、不参与分派。
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
export const BOT_PERSONAS, BOT_PERSONA_BY_ID;    // bots.js —— ai 消费；手感轮起每个 persona 必带
                                                 // skinId: SkinId（三人互异，main 传给 createMatch）
export const UNLOCKS, UNLOCK_BY_ID, UNLOCK_BY_GLOVE;  // unlocks.js —— shell/main 消费
export const MOVEMENT, KNOCKBACK, METER, RULES;  // tuning.js —— 参考值；运动手感的运行时权威是 sim.PHYSICS
export const TILE;                               // tiles.js —— 仅伤害调参语义；拓扑字段不具约束力（ADR-18）

// skins.js（手感轮新增，F3 所有；shell/render/main 消费，sim 不 import）
export const SKINS: SkinDef[];                   // ≥ 6 套，顺序即大厅选择器顺序
export const SKIN_BY_ID: Record<SkinId, SkinDef>;
export const DEFAULT_SKIN_ID: SkinId;            // 'drifter'
export function resolveSkin(id?: string|null): SkinDef;   // 未知/缺省 → SKIN_BY_ID[DEFAULT_SKIN_ID]
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

### 3.2 皮肤契约（手感轮新增，冻结，ADR-26）

`src/data/skins.js`（F3 所有）。皮肤 = **剪影（体型+头部+背部配件）× 配色**的纯数据组合：O2 对每个枚举值各实现一次几何/材质件，F3 填组合表，两边不看对方代码即可并行。

```ts
interface SkinDef {
  id: SkinId;
  name: string;                       // 中文名（≤3 字，大厅主标题）
  desc: string;                       // 一句话（≤18 字，大厅副标题）
  build: 'slim'|'stock'|'broad';      // 体型档：O2 映射为躯干/四肢比例与肩宽
  headgear: 'hood'|'bare'|'topknot'|'strawHat'|'mask'|'horns';   // 头部剪影件
  back: 'panel'|'banner'|'pack';      // 背部识别色载体的形状（语义见下）
  palette: {                          // hex；只配衣料底色，饱和识别色仍归手套
    cloth: string; clothDim: string; leather: string; accent: string; skin: string;
  };
  trim?: Record<string, number|string>;   // 可选附加调参（F3/O2 协商，先登记再用）
}
```

**皮肤表 v1（id 词表冻结；name/palette 等终值由 F3 定稿）**：

| id | 中文名 | build | headgear | back | 定位 |
| --- | --- | --- | --- | --- | --- |
| `drifter` | 行脚 | stock | hood | panel | 缺省；现役造型的正名 |
| `mason` | 石契 | broad | bare | pack | 宽肩工匠 |
| `crane` | 鹤羽 | slim | topknot | banner | 瘦高背旗 |
| `reed` | 苇笠 | stock | strawHat | panel | 斗笠蓑客 |
| `nuo` | 傩面 | slim | mask | banner | 傩戏面客（原创民俗，无版权素材） |
| `wildhorn` | 荒角 | broad | horns | pack | 兽角蛮客 |

规则：

1. **识别色载体不可少**：每套皮肤的 `back` 件（背板/背旗/行囊盖布）必须承载**当前激活掌识别色**——换掌可读性是视觉契约（VISUAL_HANDBOOK §5.11），皮肤只能换载体形状，不能取消它。
2. **兜底链**（消费端统一）：`resolveSkin(p.skinId ?? BOT_PERSONA_BY_ID[p.persona]?.skinId)`，未知/缺省一律落 `DEFAULT_SKIN_ID`。sim 不参与校验。
3. Bot 皮肤：`BOT_PERSONAS` 每个 persona 带 `skinId`（建议 brute→`wildhorn`、fox→`crane`、bully→`nuo`，终值 F3 定），三人互异且不与 `DEFAULT_SKIN_ID` 相同——**Bot 不得全员同一造型**。
4. 新皮肤 / 新枚举值（headgear、back、build 扩档）= 先在本表登记，再写代码。禁止贴图包、禁止下载素材，全部低面数几何 + 程序化材质。
5. 枚举值的视觉终稿归 F2/O2（`docs/ART_DIRECTION.md` 补规范），本表只冻结 id 与形状语言的语义。

## 4. `src/sim`（Opus-1 所有；入口 `src/sim/index.js`）

### 4.0 依赖接线（ADR-19/24，冻结）

`src/sim/deps.js` **静态 import** `../data/gloves.js`（运行时权威掌表）与 `./combat-bridge.js`（其内静态 import `../combat/index.js`）——生产路径零动态注入，**import sim 即已接线**。`getDeps()` 返回 `{ MATCH, GLOVES, GLOVE_BY_ID, combat, usingRealData, usingRealCombat }`：

- **`usingRealCombat === true ⇔ 未装替身（combatMod === null）⇔ 生产静态桥在岗**。`installCombat(mod)` 传任何非 null 模块都置 false——即使传真实 `src/combat` 命名空间，因为绕过桥（朝向换算、命中翻译、事件消化）就不是产线路径（ADR-24）。**false 读作「测试替身在场」，不是「combat 缺席」**。
- `usingRealData` 同理（仅当替身给出非空 `GLOVES` 才为 false）。`installData` 会经 `normalizeGlove` 用真实 cotton 补全替身缺字段，防 sim 吃 NaN。
- `installData / installCombat / resetDeps` 仅供测试隔离；`resetDeps()` 回到真实模块。用过 install* 的测试必须收尾 `resetDeps()`。
- 产线与探针的断言姿势：**什么都不装**，直接断言两布尔为 true；为假 = 替身泄漏，main 亮降级横幅。`autoWireOptionalDeps` 已删除。
- deps 每次 rebuild 会调 `bridge.syncGloveTable(GLOVE_BY_ID)`：combat 内部延迟结算路径与 sim 共用同一张掌表（技能 id 已按 §3.1 翻译）。

### 4.1 契约四件套 + 附属导出

```ts
export function createMatch(opts: {
  seed: number;
  gloveId: GloveId; offhandId: GloveId;     // 人类主/副掌；非法 id 回落 cotton
  botCount?: number;                         // 默认 3
  botPersonas?: Persona[];                   // 默认 brute→fox→bully 循环
  skinId?: string;                           // 手感轮新增：人类皮肤。sim 视为不透明字符串原样存取，
                                             // 不校验、不 import skins.js（ADR-26）；缺省存 null
  botSkinIds?: (string|null)[];              // 手感轮新增：与 bot 序号对齐（b0 取 [0]…）。
                                             // 编排层从 BOT_PERSONA_BY_ID[persona].skinId 取值传入
  config?: Partial<MatchConst>;              // 测试用覆盖
}): MatchState;

export function step(state: MatchState, inputs: Partial<Record<PlayerId, Partial<Input>>>, dt: number): MatchState;
// 就地更新并返回同一引用。dt 缺省/非法用 config.dt；> 1/60 自动切等长子步；上限 0.25。
// 顺序（冻结）：清 events（每 step 一次，子步共用缓冲）→ 每子步：combat.tickStatuses（含
// 延迟命中回执）→ 计时器/重生 → 动作（换掌/冲刺/跳/扇击前摇/技能）→ 位移积分 → 互推
// → 地面/护栏 → 前摇到帧的扇击结算 → 掉落 ko（y<fallY 或出盘无支撑）→ updateMatch。

export function getView(state: MatchState): MatchView;   // §4.3

export function isMatchOver(state: MatchState): { over: boolean; winnerId?: PlayerId|null; reason?: 'kills'|'time' };
```

**`isMatchOver` 语义（ADR-20，冻结）**：

- **纯读的活谓词，不要求先 `step`**。调用不改 state、不发事件。
- `over ⇔ state.match.over ∨ ∃p: p.kills ≥ config.killsToWin ∨ state.time ≥ config.matchSeconds`。
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
  arena: ArenaState;
  players: PlayerState[];             // [0] 恒为 p0
  events: SimEvent[];                 // 本 step 产生，开头清空，≤ 96 条
  match: { over: boolean; winnerId: PlayerId|null; reason: 'kills'|'time'|null; secondsLeft: number };
  stats: { slaps: number; hits: number; kos: number; tilesBroken: number };
}

interface PlayerState {
  id: PlayerId; kind: 'human'|'bot'; persona: Persona|null;
  skinId: string|null;                                    // 手感轮新增：不透明装饰标签（ADR-26）
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
  prev: { slap; skill; switchGlove; dash; jump: boolean };  // sim 内部边沿检测
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
  match: { over: boolean; winnerId: PlayerId|null; reason: 'kills'|'time'|null; secondsLeft: number };
  arena: {
    radius: number; tileSize: number; cols: number; origin: number;
    floorY: number; brokenCount: number;
    tiles: ViewTile[];
  };
  players: ViewPlayer[];
  combat: { ghosts: ViewGhost[] };     // 手感轮新增（ADR-27）：分身残影，render 必画
  events: SimEvent[];
  stats: { slaps: number; hits: number; kos: number; tilesBroken: number };
}
interface ViewGhost {                  // 来源 state.combat.ghosts，经 combat-bridge.ghostsView
  id: string; ownerId: PlayerId;       // 翻译导出：yaw 已还原为 -Z 约定（ADR-17/25）、纯 JSON
  x: number; y: number; z: number; yaw: number;
  ttl: number; ttl0: number;           // 剩余/初始秒；render 用 ttl/ttl0 做淡出（O3 建 ghost 时写 ttl0）
  fake: boolean;                       // true = 觉醒残影，会假挥掌（ghostSlap 事件）
}
interface ViewTile {
  i: number; x: number; z: number; zone: 0|1|2|3; seam: boolean;
  hp: number; maxHp: number; alive: boolean;
  crack: number;                       // 0..1 裂纹程度；碎块恒 1
}
interface ViewPlayer {
  id: PlayerId; kind: 'human'|'bot'; persona: Persona|null;
  skinId: string|null;                 // 手感轮新增：原样透传，消费端 resolveSkin 兜底（§3.2）
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
```

## 5. `src/combat`（Opus-3 所有）与生产桥 `src/sim/combat-bridge.js`（Opus-1 所有）

分工（冻结）：`src/combat/**` 自带一套内部约定（yaw=0 朝 +Z、命中 `{ id, … }` 且冲量已就地写进目标速度、事件直 push、自带 `cd/busyUntil` 台账）；**sim 只经生产桥调用 combat**，桥把内部约定翻译成本节契约，桥外不可见。**除桥（与 O3 自测）外任何文件不得 import `src/combat`**。

### 5.1 桥的翻译职责（冻结）

1. **朝向**：进 combat 前全体玩家 `yaw += FACE.combatOffset (π)`，返回时还原/换算回 -Z 约定（ADR-17 的唯一 combat 侧换算点）。
2. **闸门**：sim 独占动作闸门（`attack` 相位机、`slapCd/skillCd` 标量、`switchLockT`、`kbT`）。桥每次调用前清掉 combat 的 `cd/busyUntil`，combat **必须解算**、不得二次拦截 sim 已闸过的调用；combat 的 `beginSlap`/pending 前摇机制不进产线路径（sim 的 windup 相位机是唯一前摇实现）。
3. **命中**：combat 的 `{ id, impulse, … }` 翻译成 `{ targetId, attackerId, power, impulse, applied: true, skillId }`；`parried` 命中剔除（combat 已把冲量反打回攻击者，不再记一次受击）。
4. **事件（ADR-22）**：combat push 的事件先进桥的暂存缓冲，翻译成 §10 词表（`awaken / awakenEnd / parry / meteorImpact / ghostSlap`；`tileBreak` 顺带补 `brokenCount / stats` 记账）后由 sim 代发；其余暂存事件丢弃（sim 已发等价事件）。
5. **字段回写**：combat 自有字段同步到 sim 读的字段（`knockbackT → kbT`、`lastHitAt → lastHitT`）。
6. **技能 id**：入参掌与 combat 内部掌表（`syncGloveTable`）按 §3.1 翻译，桥是唯一翻译点。
7. **残影导出（手感轮新增，ADR-27）**：桥新增导出 `ghostsView(state): ViewGhost[]`——把 `state.combat.ghosts`（yaw 是 combat 的 +Z 基，因为 ghost 快照在 `inCombatFrame` 内落笔）逐条翻译成 §4.3 的 ViewGhost：`yaw` 按 `FACE.combatOffset` 还原回 -Z 并 wrap、数值 round、缺 `ttl0` 时以 `ttl` 兜底。`sim/view.js getView` 调它填 `view.combat.ghosts`——combat 基的朝向换算依旧只住在桥。
8. **代发事件补 id（手感轮新增，ADR-27）**：桥 `digestEvents` 代发的三个事件补齐分派键——`parry` 补 `gloveId`（弹反者结算时激活掌）与 `skillId: 'parry'`；`meteorImpact` 补 `gloveId: 'meteor'`、`skillId: 'meteorSlam'`；`ghostSlap` 补 `gloveId: 'afterimage'`、`skillId: 'blinkSwap'`。词表见 §10。

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
  gloveId?: GloveId;                      // 手感轮新增（可选）：出招掌。延迟命中（陨掌落地等）时
                                          // 攻击者可能已换掌，combat 知道就填；sim 发 hit 事件时
                                          // 优先用它，缺省回落 attacker 当下 activeGloveId
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
// players（yaw 直接 rotation.y——ADR-25：收到的就是 -Z 基 sim yaw，零补偿）、
// events（§10 词表触发 VFX）。字段缺失容错不抛错。
// 手感轮新增消费面（ADR-26/27）：
//   · players[].skinId → resolveSkin 建外观变体（build/headgear/back/palette，§3.2）；
//     skinId 变化时重建/换件该角色，识别色背件语义不变
//   · view.combat.ghosts → 半透明分身残影，按 ttl/ttl0 淡出，必须在画面上可见
//   · VFX 分派纪律：扇击按事件 gloveId 八套可辨、技能按 skillId 分派（含 parry/
//     meteorImpact/ghostSlap）；禁止 8 掌共用光球/描边；GloveDef.vfx 只是调参输入

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
// 每模拟步一次。按 §2 公式把摇杆/WASD 换算成世界系 moveX/moveZ。
// input 内部保留自己的相机方位角 θ（forward = (cos θ, sin θ)），换算收敛在 core/view.js 的
// cameraYawToSimYaw / simYawToCameraYaw（两处合法换算点之一，ADR-17/25）；sample 返回的
// Input.yaw = cameraYawToSimYaw(θ)，即 ADR-17 约定下的期望面朝。换算不得散布到其它文件。
// 键鼠语义锚点（G1 锁死，ARCHITECTURE §5.1.1）：纯 W ⇒ (moveX,moveZ) = (cos θ, sin θ)
//（= 相机水平前向）；纯 D ⇒ (−sin θ, cos θ)（屏幕右）；cameraYawToSimYaw 对 θ 单调递减
//（鼠标 +dx ⇒ θ 增大 ⇒ sim yaw 减小 ⇒ 从上方看顺时针 = 右转）。
export function setEnabled(enabled: boolean): void;   // false：动作清零、移动归零
export function getLook(): { yaw: number; pitch: number };   // 相机朝向权威源（ADR-4/17）
// 句柄追加（冻结命名）：setLook(yaw, pitch)、setSensitivity(v)、setPointerLock(on)、
// releasePointerLock()、setTouchButton(name, down)
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
      gloveId: GloveId;                          // 手感轮新增：HitRecord.gloveId 优先，
                                                 // 缺省回落攻击者结算时 activeGloveId
      skillId: SkillHandlerId|null;              // 手感轮新增：null = 素掌扇击
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
  | { type: 'parry';     id: PlayerId; targetId: PlayerId; power: number;
      gloveId: GloveId; skillId: 'parry' }                          // id = 弹反者（手感轮补 id）
  | { type: 'meteorImpact'; id: PlayerId; x: number; z: number; radius: number;
      gloveId: 'meteor'; skillId: 'meteorSlam' }                    // 手感轮补 id
  | { type: 'ghostSlap'; id: PlayerId; targetId: PlayerId;
      gloveId: 'afterimage'; skillId: 'blinkSwap' }                 // 残影假掌骗中（手感轮补 id）
  | { type: 'tileCrack'; i: number; x: number; z: number; hp: number; maxHp: number }
  | { type: 'tileBreak'; i: number; x: number; z: number; hp: number; maxHp: number }
  | { type: 'matchOver'; winnerId: PlayerId|null; reason: 'kills'|'time' }
);
```

注：

- `awaken / awakenEnd / parry / meteorImpact / ghostSlap` 由 combat 触发、经桥翻译后 sim 代发（ADR-22）；其余全部 sim 直发。
- `skill` 事件与 `HitRecord` 的 `skillId` 是 **handler id**（§3.1 右列）。
- **VFX 分派键（ADR-27）**：O2 按事件的 `gloveId` 分派扇击表现、按 `skillId` 分派技能表现——`slapStart/slap/hit/switch/skill/parry/meteorImpact/ghostSlap` 都带 `gloveId`，禁止按 type 猜或全掌共用一套。
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
| 局面切换（ui 直接调） | `matchStart` / `ui_click` / `ui_hover` |

未列出的事件（`parry / meteorImpact / ghostSlap / slapStart / awakenEnd`）暂不发声；要加音效先在本表登记。

## 12. 存档 schema（key = `yizhang-save-v1`，`src/core/storage.js` 独占读写）

```ts
interface SaveV1 {
  version: 1;
  unlocked: GloveId[];                       // 恒含 'cotton'
  loadout: { main: GloveId; off: GloveId };
  skinId: SkinId;                            // 手感轮新增：默认 DEFAULT_SKIN_ID（'drifter'）。
                                             // 追加字段不换 key：旧档缺失 ⇒ loadSave 补默认；
                                             // 非法值 ⇒ 消费端 resolveSkin 兜底
  quality: 'auto'|Tier;                      // 默认 'auto'
  muted: boolean;
  lookSensitivity: number;                   // 0.2..3，默认 1
  invertY: boolean;
  pointerLock?: boolean; touch?: boolean;    // 可选偏好
  stats: { matches: number; kills: number; deaths: number; wins: number; bestKills: number };
}
```

规则：读失败/版本不符 → 默认值并覆写；未知字段写回保留；破坏性变更换 key `yizhang-save-v2` + 迁移。解锁判定用 `data` 的 `UNLOCKS/UNLOCK_BY_GLOVE/isGloveUnlocked`，结果落 `unlocked`。

## 13. `src/ui/shell.js` 与 `src/core/loop.js`（Opus-4 所有；最小面）

```ts
// ui/shell —— 主菜单（双掌选择 + 皮肤选择，读解锁位）、HUD、结算、暂停、触控控件 DOM。
// HUD 类名走 F2 的 .yz-* 契约（src/styles），shell 自带样式只做 critical fallback。
// 手感轮新增：大厅皮肤选择器（SKINS 顺序渲染、样式类 .yz-skin-*，F2 出契约；
// 选中写 save.skinId）；onStart 的 loadout 扩为 { main, off, skinId }——main 把
// skinId 传 createMatch、botSkinIds 从 BOT_PERSONA_BY_ID[persona].skinId 取。
export function createShell(opts: { root, gloves, gloveById, save, audio, input, matchConfig,
  callbacks: { onStart(loadout: { main: GloveId; off: GloveId; skinId: SkinId });
               onResume(); onRestart(); onQuit(); onPauseRequest(); onSettingsChange(next) };
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
14. **渲染零补偿（ADR-25）**：`RENDER_YAW_OFFSET === 0`；`toRenderView(view)` 后 `players[].yaw` 与入参逐位相等（`core/view.test.js` 原「补 π」断言按此改写）。
15. **键鼠映射（ADR-17/25，ARCHITECTURE §5.1.1）**：对任意相机方位角 θ，纯 W 时 `sample(θ)` 的 `(moveX, moveZ) ≈ (cos θ, sin θ)`、纯 D 时 `≈ (−sin θ, cos θ)`、A/S 取反；`Input.yaw === cameraYawToSimYaw(θ)` 且 `forward(Input.yaw) ≈ (cos θ, sin θ)`。
16. **右转方向（ADR-17/25）**：`cameraYawToSimYaw` 对 θ 单调递减（wrap 意义下 `ds/dθ = −1`）——鼠标 +dx ⇒ sim yaw 减小 ⇒ 从上方（+Y 向下）看 `forward(simYaw)` 顺时针转 ⇒ 右转。
17. **皮肤表（ADR-26，§3.2）**：`SKINS.length ≥ 6`、id 唯一且属 SkinId 词表、字段齐全（build/headgear/back/palette 全非空）；`resolveSkin(未知 id)` 与 `resolveSkin(null)` 都返回 `SKIN_BY_ID[DEFAULT_SKIN_ID]`；`BOT_PERSONAS` 每项带 `skinId` 且三人互异。
18. **皮肤透传（ADR-26）**：`createMatch({ skinId: 'x' })` 后 `getView().players[0].skinId === 'x'`（sim 不校验）；缺省为 null；`botSkinIds` 按序落到 b0…；存档 `skinId` 经 `loadSave/updateSave` 往返保留，旧档缺失补 `DEFAULT_SKIN_ID`。
19. **VFX 事件形状（ADR-27）**：任一 `hit` 事件带 `gloveId`（属 GloveId 词表）与 `skillId`（handler id 或 null）；`view.combat.ghosts` 恒存在（无残影时空数组）；分身放技能后 ghosts 出现 `{ ownerId, ttl0 > 0, yaw 为 -Z 基 }` 条目并在 ttl 耗尽后消失。
