# 异掌 · 公共 API 契约 v1（Round 1 · Fable-1，冻结）

> 本文把 `.agent_workspace/yizhang/CONTRACT.md` 的导出面**冻结成可实现的完整类型与不变量**。类型用 TS 记法描述形状，实现是纯 JS（可配 JSDoc）。
>
> **变更规则**：已列出的导出（名字、参数、返回形状）不得改动或删除；**追加**新导出/新可选字段允许，但必须先在本文登记再写代码。标注〔追加〕的条目是本契约在种子基础上的增量，同样冻结。

## 1. 总则与硬性不变量

1. `src/sim`、`src/data`、`src/combat`、`src/ai` 禁止 import `three`、禁止触碰 DOM / `window` / `document` / `performance` / `Math.random`。
2. `MatchState` 只含 plain object / array / number / string / boolean / null——**`structuredClone(state)` 必须无损**，克隆后继续 `step` 结果与原件逐位一致。
3. `getView(state)` 返回**全新的纯 JSON 快照**（无函数、无类实例、无 `undefined`、无 `Infinity`/`NaN`），调用不改 state。外壳层只准持有快照，绝不持有 state 引用。
4. `GLOVES` / `MATCH` / `ARENA` 是只读表；运行期任何模块不得改写（觉醒等数值覆盖走 `applyAwaken` 返回的派生副本）。
5. 同 `seed` + 同输入序列 + `dt = MATCH.dt` ⇒ 确定性复现整局。
6. 事件（§10）是模拟核对外的唯一「已发生」通道；音效名（§11）是 main→audio 的唯一词表。
7. 存档 key 唯一：**`yizhang-save-v1`**，只有 `src/ui` 读写 localStorage。

## 2. 通用类型

```ts
type PlayerId = string;          // 'p1'（人类）、'bot_brute' | 'bot_fox' | 'bot_bully'
type GloveId  = 'cotton'|'granite'|'gale'|'frost'|'spring'|'afterimage'|'magnet'|'meteor';
type Tier     = 'high'|'mid'|'low';

interface Input {
  moveX: number;        // -1..1，世界系（input 层已按 cameraYaw 换算），√(x²+z²) ≤ 1
  moveZ: number;        // -1..1，世界系
  yaw: number;          // 期望面朝角，世界系弧度
  slap: boolean;        // ↓ 五个布尔全部是「单 tick 脉冲」；sim 侧用冷却/锁再闸一道
  skill: boolean;
  switchGlove: boolean;
  dash: boolean;
  jump: boolean;
}
// 缺省玩家视为零输入：{ moveX:0, moveZ:0, yaw:玩家当前 yaw, 其余 false }
```

## 3. `src/data`（Fable-3 所有）

```ts
export const GLOVES: GloveDef[];                       // 8 只，顺序即图鉴顺序
export const GLOVE_BY_ID: Record<GloveId, GloveDef>;
export const MATCH: MatchConst;
export const ARENA: ArenaConst;                        // 〔追加〕台面拓扑与护栏参数

interface GloveDef {
  id: GloveId; name: string;                 // 中文名（木棉/磐石/…）
  role: string;                              // 职能一词：教学/重击/切入/控/反制/欺诈/强制接近/清场
  color: string;                             // 识别色 hex，全局唯一饱和点（视觉手册纪律）
  slapRange: number; slapAngleDeg: number;   // 扇击扇形
  slapPower: number;                         // 水平击退冲量基准
  slapCooldown: number; windup: number; recovery: number;   // 秒
  skillId: string; skillCooldown: number;    // skillId 与 combat 技能注册表对齐（§5）
  unlock: { kind: 'default' } | { kind: 'challenge'; challengeId: string; goal: number };
  awaken: Record<string, number|boolean>;    // 该掌觉醒覆盖参数，applyAwaken 消费
  heavy?: boolean;                           // 该掌扇击是否算重击（无视护栏、可伤台面）
  tileDamage?: number;                       // 对台面伤害（磐石/陨掌类才有）
}

interface MatchConst {
  dt: 0.016666...;            // 1/60
  arenaRadius: 20; playerRadius: 0.7; playerHeight: 2;
  fallY: -8; respawnDelay: 1.2; invulnTime: 1.0;
  matchSeconds: 240; killsToWin: 7;
  switchLock: 0.4; awakenDuration: 8;
  // 〔追加〕掌意增量（数值 Fable-3 定）
  meterOnSlapHit: number; meterOnSlapped: number; meterOnSkillHit: number;
  // 〔追加〕通用运动参数
  moveSpeed: number; moveAccel: number; friction: number;
  dashSpeed: number; dashTime: number; dashCooldown: number;
  jumpVel: number; gravity: number;
  hitstopHeavy: number;       // 重击命中顿帧秒数（渲染表现用，sim 不停）
}

interface ArenaConst {        // 〔追加〕
  coreRadius: number;         // 不可破坏内核半径（建议 6）
  ringRadii: [number, number]; // 环带两条内部分割半径（建议 [11, 16]），外沿 = arenaRadius
  seamAngle: number;          // 中缝朝向（弧度）
  tileHp: [number, number, number];  // 内/中/外环每块 HP
  railHeight: number; railStopSpeed: number;  // 护栏拦截的最大水平速度
  crackThresholds: number[];  // hp 比例阈值，跌破发 tile_crack（建议 [0.66, 0.33]）
}
```

## 4. `src/sim`（Opus-1 所有）

```ts
export function createMatch(opts: {
  seed: number;
  gloveId: GloveId;            // 人类主掌
  offhandId: GloveId;          // 人类副掌
  botCount?: number;           // 默认 3，上限 3（R1）；性格按 brute→fox→bully 顺序分配
}): MatchState;

export function step(state: MatchState, inputs: Record<PlayerId, Input>, dt: number): MatchState;
// 就地更新并返回同一引用。步内顺序：清 events → 应用输入（移动/跳/冲刺/换掌）→ 物理积分
// → combat.resolveSlap / resolveSkill（窗口到帧才结算）→ combat.tickStatuses → 觉醒结算
// → 台面/护栏/掉落 → 重生与计分 → isMatchOver 缓存进 state.over

export function getView(state: MatchState): MatchView;   // 纯 JSON 快照，见下

export function isMatchOver(state: MatchState): { over: boolean; winnerId?: PlayerId|null; reason?: 'kills'|'time'|'draw' };
```

### 4.1 MatchState（冻结字段；Opus-1 可再加内部字段，需登记）

```ts
interface MatchState {
  version: 1; seed: number;
  rng: { a: number; b: number; c: number; d: number };   // sfc32 状态，纯整数
  time: number; tick: number;
  players: PlayerState[];
  arena: ArenaState;
  events: SimEvent[];          // 本 tick 产生，step 开头清空
  over: { over: boolean; winnerId: PlayerId|null; reason: 'kills'|'time'|'draw'|null };
}

interface PlayerState {
  // —— 种子契约最低集 ——
  id: PlayerId; kind: 'human'|'bot';
  x: number; y: number; z: number; yaw: number;
  vx: number; vy: number; vz: number;
  gloveId: GloveId; offhandId: GloveId; activeSlot: 0|1;
  meter: number;               // 0..1
  awakenedT: number;           // >0 觉醒中（秒）
  statuses: Status[];
  alive: boolean; invulnT: number; respawnT: number;
  kills: number; deaths: number;
  // —— 〔追加〕冻结命名 ——
  persona?: 'brute'|'fox'|'bully';      // 仅 bot
  streak: number;                       // 连续击杀，自己死亡清零
  lastHitBy: PlayerId|null; lastHitT: number;   // 3s 击杀归属窗口
  switchLockT: number;                  // >0 收掌中：禁扇/技能
  slapCdT: [number, number];            // 冷却按槽位持久化，换掌不洗
  skillCdT: [number, number];
  dashCdT: number; dashT: number;
  knockHeavyT: number;                  // >0 期间护栏不拦
  phase: 'idle'|'windup'|'recover'|'skill'|'dead';
  phaseT: number;                       // 当前 phase 剩余秒
  grounded: boolean;
}

interface Status {
  id: 'slow'|'frozen'|'counter'|'magnet'|'airborne'|'decoy';
  t: number;                   // 剩余秒
  src: PlayerId|null;
  data?: Record<string, number>;
}

interface ArenaState {
  radius: number; seamAngle: number;
  tiles: TileState[];          // 14 块，顺序固定：core_n, core_s, plate_0_0 … plate_3_2
}
interface TileState {
  id: string;                  // 'core_n' | 'core_s' | `plate_${sector 0..3}_${ring 0..2}`
  destructible: boolean;
  hp: number; maxHp: number;   // 不可破坏块两者均为 -1
  brokenT: number;             // -1 未碎；否则碎裂时的 state.time
}
```

### 4.2 MatchView（`getView` 返回；渲染/AI/HUD 唯一输入）

```ts
interface MatchView {
  time: number; tick: number;
  timeLeft: number; killsToWin: number;
  players: ViewPlayer[];
  tiles: ViewTile[];
  events: SimEvent[];
  over: MatchState['over'];
}
interface ViewPlayer {
  id: PlayerId; kind: 'human'|'bot';
  x: number; y: number; z: number; yaw: number;
  vx: number; vy: number; vz: number;          // 渲染倾斜/拖尾用
  gloveId: GloveId; offhandId: GloveId; activeSlot: 0|1;
  meter: number; awakened: boolean; awakenedT: number;
  alive: boolean; invulnT: number; respawnT: number;
  kills: number; deaths: number; streak: number;
  switchLockT: number; dashCdT: number;
  slapCd: number; skillCd: number;             // 当前激活槽的剩余冷却（HUD 直接用）
  phase: PlayerState['phase']; phaseT: number;
  statuses: { id: string; t: number }[];
  grounded: boolean;
  teleported: boolean;                          // 本 tick 发生瞬移（重生/换位/被拉），渲染跳过插值
}
interface ViewTile {
  id: string; destructible: boolean;
  hpRatio: number;             // 0..1；不可破坏恒 1
  broken: boolean; brokenAge: number;   // 碎后经过秒数（坠落动画驱动），未碎 -1
}
// loop 在传给 render.sync 前附加：{ alpha: number /*0..1*/, events: 跨子步合流后的 SimEvent[] }
```

## 5. `src/combat`（Opus-3 所有；仅被 sim 调用，禁反向依赖）

```ts
export function resolveSlap(state: MatchState, attacker: PlayerState, glove: GloveDef, now: number): HitRecord[];
// now = state.time。就地施加：命中方冲量（含 heavy 标记→knockHeavyT）、双方掌意、状态；
// 重击掌调用 sim 提供的 damageTile。返回命中列表（可空 = 空挥），sim 据此发事件。

export function resolveSkill(state: MatchState, attacker: PlayerState, glove: GloveDef, now: number): HitRecord[];
// 按 glove.skillId 走内部技能注册表：
//   'none'(cotton) 'slam'(granite) 'rush'(gale) 'frost_arc'(frost) 'riposte'(spring)
//   'decoy_swap'(afterimage) 'pull'(magnet) 'sky_drop'(meteor)
// 持续型技能（rush/sky_drop/riposte）由 resolveSkill 启动，后续帧经 tickStatuses / sim phase 推进。

export function tickStatuses(state: MatchState, dt: number): void;   // 递减/到期移除，结算持续效果

export function applyAwaken(attacker: PlayerState, glove: GloveDef): GloveDef;
// attacker.awakenedT > 0 时返回按 glove.awaken 覆盖后的派生副本；否则原样返回。禁止改 GLOVES。

interface HitRecord {
  targetId: PlayerId;
  impulse: [number, number, number];
  heavy: boolean;
  kind: 'slap'|'skill';
  statusApplied?: Status['id'];
}
```

## 6. `src/ai`（Opus-3 所有）

```ts
export function think(view: MatchView, botId: PlayerId, rng: () => number): Input;
// 纯函数：只读 view（loop 传的是 t-1 tick 快照）+ rng（loop 按 seed⊕botId 派生的 sfc32，
// 不碰 state.rng）。性格取 view 内该 bot 的 persona：
//   brute 直线硬冲高频扇；fox 沿边绕走、卡碎裂边线；bully 优先残血/背身/刚落地目标。
// loop 以 10Hz（每 6 tick）调用，间隔期沿用上次返回的 Input（脉冲位由 loop 清零）。
```

## 7. `src/render`（Opus-2 所有；three 仅存在于此目录）

模块级单例（ADR-1）：`createRenderer` 初始化并返回句柄，句柄方法与模块级导出同名同义。

```ts
export function createRenderer(canvas: HTMLCanvasElement, opts?: {
  tier?: Tier;
  getLook?: () => { yaw: number; pitch: number };   // main 注入 input.getLook，render 不得 import input
}): RendererHandle;
export function sync(view: MatchView & { alpha: number }): void;
// 每 rAF 一次。renderer 自缓存实体上帧位姿，lerp(prev, cur, alpha)；view.teleported 则直贴。
// 消费 view.events 触发 VFX（碎地尘、命中震、觉醒环）；相机朝向经 opts.getLook 读取。
export function resize(width: number, height: number, dpr: number): void;   // dpr 已被 loop 封顶 2
export function setQuality(tier: Tier): void;   // 档位定义见 ARCHITECTURE §5.2
export function dispose(): void;                // 释放 GL 资源，允许重复调用
```

## 8. `src/input`（Opus-4 所有）

模块级单例（ADR-1）。**ui 建 DOM、input 绑事件**：input 在 `dom` 内查询 `[data-yz-btn]` / `[data-yz-zone]` 接管 pointer 事件；canvas 上接管拖动/Pointer Lock 视角。

```ts
export function createInput(dom: HTMLElement, canvas: HTMLCanvasElement): InputHandle;
export function sample(cameraYaw: number): Input;
// 每 rAF 一次。把摇杆/WASD 矢量按 cameraYaw 转世界系；把 press 事件闩锁成单帧脉冲后清闩。
export function setEnabled(enabled: boolean): void;   // false：脉冲清零、移动归零（菜单/暂停期）
export function getLook(): { yaw: number; pitch: number };   // 〔追加，ADR-4〕相机朝向权威源
```

## 9. `src/audio`（Opus-4 所有）

模块级单例。WebAudio 全合成，无外部音频文件。

```ts
export function createAudio(): AudioHandle;
export function unlock(): void;   // 首次 pointer 手势调用；恢复暂停时再调无害
export function play(name: SoundName, opts?: { gain?: number; pitch?: number; pan?: number }): void;
// 未知 name 静默忽略（不 throw）；未 unlock 前的 play 丢弃。
// 〔追加〕suspend(): void / resume(): void —— loop 在 hidden/恢复时调用
```

## 10. 事件分类学（SimEvent，冻结）

```ts
type SimEvent =
  | { type: 'slap_hit';    attackerId: PlayerId; targetId: PlayerId; heavy: boolean; x: number; z: number }
  | { type: 'slap_whiff';  playerId: PlayerId }
  | { type: 'skill';       playerId: PlayerId; skillId: string }
  | { type: 'switch';      playerId: PlayerId; slot: 0|1 }
  | { type: 'dash';        playerId: PlayerId }
  | { type: 'jump';        playerId: PlayerId }
  | { type: 'land';        playerId: PlayerId }
  | { type: 'rail_block';  playerId: PlayerId }
  | { type: 'status';      targetId: PlayerId; statusId: Status['id']; src: PlayerId|null }
  | { type: 'tile_crack';  tileId: string; hpRatio: number }
  | { type: 'tile_break';  tileId: string }
  | { type: 'fall';        playerId: PlayerId; byId: PlayerId|null }   // byId=null 自坠
  | { type: 'kill';        killerId: PlayerId; victimId: PlayerId; streak: number }
  | { type: 'respawn';     playerId: PlayerId }
  | { type: 'awaken_start';playerId: PlayerId; gloveId: GloveId }
  | { type: 'awaken_end';  playerId: PlayerId }
  | { type: 'match_over';  winnerId: PlayerId|null; reason: 'kills'|'time'|'draw' };
```

## 11. 事件 → 音效名对照（main.js 持有该映射；SoundName 词表冻结）

| SoundName | 触发 |
| --- | --- |
| `slap` / `slap_heavy` | slap_hit（按 heavy 分流） |
| `whiff` | slap_whiff |
| `skill_cast` | skill |
| `switch` | switch |
| `dash` / `jump` / `land` | 同名事件 |
| `rail` | rail_block |
| `crack` / `break` | tile_crack / tile_break |
| `fall` | fall |
| `ko` | kill |
| `respawn` | respawn |
| `awaken` / `awaken_end` | awaken_start / awaken_end |
| `win` / `lose` | match_over（按本地玩家胜负） |
| `ui_click` / `ui_hover` / `count` | ui 直接调用（菜单、倒计时） |

## 12. 存档 schema（key = `yizhang-save-v1`，`src/ui` 独占读写）

```ts
interface SaveV1 {
  v: 1;
  unlocked: GloveId[];                      // 恒含 'cotton'
  challenges: Record<string, number>;       // challengeId → 进度计数
  loadout: { gloveId: GloveId; offhandId: GloveId };
  settings: {
    quality: 'auto'|Tier;                   // 默认 'auto'
    lookSensitivity: number;                // 0.2..3，默认 1
    invertY: boolean;
    volMaster: number; volSfx: number;      // 0..1
  };
  stats: { matches: number; wins: number; kills: number; deaths: number; bestStreak: number };
  updatedAt: number;                        // epoch ms
}
```

规则：读失败/版本不符 → 默认值并覆写；未知字段写回时保留；写入去抖 ≤1 次/s，结算与 hidden 时强制刷盘；破坏性变更换 key `yizhang-save-v2` + 迁移函数。

## 13. `src/ui/shell.js` 与 `src/core/loop.js`（Opus-4 所有；最小面〔追加〕）

```ts
// ui/shell —— 主菜单（双掌选择，读存档解锁位）、HUD、结算、暂停、触控控件 DOM
export function createShell(root: HTMLElement, hooks: {
  onStart(loadout: { gloveId: GloveId; offhandId: GloveId }): void;
  onPause(): void; onResume(): void; onQuit(): void;
}): {
  syncHud(view: MatchView): void;    // 每帧调，内部节流 ≤15Hz
  showMenu(): void;
  showResult(view: MatchView): void;
  showPause(reason: 'user'|'hidden'): void;
  setTouchVisible(v: boolean): void; // 触控壳按 pointer 类型切换
};

// core/loop —— 固定步进 + 插值 + 暂停 + 画质探测；依赖注入保证可无头测试
export function createLoop(deps: { sim, ai, input, render, ui, audio }): {
  start(matchOpts): void; pause(): void; resume(): void; stop(): void;
};
```

Opus-4 可在此二者上追加方法，但上表所列的名字与语义不得变；`main.js` 只做组装与事件→音效映射，不写业务逻辑。

## 14. 不变量清单（GPT-sol-1 测试基线 / Fable-4 验收引用）

1. `structuredClone(createMatch({seed:1,...}))` 成功；克隆体与原件各 step 600 tick 后 `getView` 深比较相等。
2. `getView` 结果 `JSON.parse(JSON.stringify(v))` 往返无损；调用前后 state 无变化。
3. 扇形命中：`slapRange` / `slapAngleDeg` 边界内命中、边界外不命中；空挥进入 recovery（有后摇）。
4. 击退：命中者获得水平冲量 ≥ `slapPower` 基准方向正确；`invulnT > 0` 目标免疫。
5. 掉落：`y < fallY` 或水平出台且脚下无 tile ⇒ `fall` 事件 + `respawnT = respawnDelay`；3s 窗口内有 `lastHitBy` ⇒ `kill` 事件且 streak 递增；自坠 streak 清零。
6. 换掌：`switchLockT` 从 0.4 递减，期间 slap/skill 脉冲无效；槽位冷却切换后保留。
7. 觉醒：meter 单调累积到 1 触发、`awakenedT` 从 8 递减、期间 `applyAwaken` 覆盖生效、死亡清零。
8. 碎地：`damageTile` 达阈值发 `tile_crack`、HP≤0 发 `tile_break` 且 `groundAt` 立即判空；站在其上的玩家开始下落。
9. 护栏：轻击退在外环边线被拦（`rail_block`）；`knockHeavyT > 0` 时不拦；块碎后该段护栏失效。
10. `isMatchOver`：先到 7 杀 / 240s 到点比杀数→比死数→draw。
11. sim/combat/ai 源码静态扫描无 `three`、`document`、`window`、`Math.random`（GPT-sol-2 probe 断言）。
