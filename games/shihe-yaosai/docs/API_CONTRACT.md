# 蚀核要塞 · API 契约（API_CONTRACT v1 · Round 1 冻结）

> 维护者：Fable-1 架构。系统视角见 [`ARCHITECTURE.md`](./ARCHITECTURE.md)。
> 本文是 10 个代理并行实现的**唯一真源**。签名、字段名、枚举值、事件名、理由码全部冻结；
> 数值中标注 **[可调]** 的由 F3 在 `src/data` 内调整，其余为 **[冻结]**。
> 变更需 F1 升版（v1→v2 + CHANGELOG），禁止代码先行。

**用语**：`MUST` 必须；`SHOULD` 建议；`RESERVED` 本轮占位、实现方 MUST 容忍其存在且可静默忽略。
类型用 TypeScript 风格书写，实际代码为 ESM JavaScript + JSDoc（`@typedef` 照抄本文即可）。

---

## 1. 全局约定 **[冻结]**

- 时间一律**秒**（浮点）；角度一律**弧度**；距离一律世界单位。
- 所有 id 为正整数，单局内单调递增、永不复用；`enemies` 与 `shots` 使用**各自独立**的计数器。
- `getView` 返回值 MUST 为 JSON-pure：可 `structuredClone` / `JSON.stringify`，无函数、无类实例、无 `NaN/Infinity`、无 `undefined` 字段值（可选字段要么缺省要么给合法值；契约标了 `|null` 的字段用 `null`）。
- 坐标换算（全员共用）：`θᵢ = i/24 × 2π`；`x = cos(θ)·r`，`z = sin(θ)·r`，`y = laneY[lane]`；`heading = atan2(dz,dx)`，`heading=0` 朝 `+X`。
- 消费方 MUST 忽略未知事件类型与未知字段（前向兼容）。
- 模块入口文件路径冻结：`src/sim/index.js`、`src/data/index.js`、`src/engine/index.js`、`src/world/index.js`、`src/combat/index.js`、`src/ui/index.js`、`src/input/index.js`。跨模块 import 一律走这些入口。

## 2. 共享类型 **[冻结]**

```ts
type SocketIndex = number;                     // 整数 0..23
type LaneIndex   = 0 | 1 | 2;                  // 下/中/上，y = [0,4,9][lane]
type TowerId     = 'rail' | 'prism' | 'scatter' | 'well' | 'star';
type ArmorKind   = 'none' | 'shell' | 'shield' | 'swarm';
type SizeClass   = 'small' | 'medium' | 'elite' | 'boss';
type ShotKind    = 'tracer' | 'beam' | 'pellet' | 'arc' | 'pulse';
type QualityTier = 'high' | 'mid' | 'low';
type BackendId   = 'webgpu' | 'webgl2';
type MatchStatus = 'playing' | 'won' | 'lost';
type Vec3        = { x: number; y: number; z: number };   // 普通对象，非 Babylon Vector3

/** 塔原型 → 弹道视觉映射（combat 按 kind 画）：
 *  rail→'tracer' 曳光直线 | prism→'beam' 光束(1..2 段) | scatter→'pellet' 散射粒
 *  star→'arc' 抛物线      | well→'pulse' 原地脉冲环                                */
```

### 2.1 SimInput（`input/read()` 产出、`sim/step` 消费）

```ts
interface SimInput {
  place?:           { socket: SocketIndex; towerId: TowerId };
  overclockSocket?: SocketIndex;      // 对该插座的塔过载
  selectedSocket?:  SocketIndex | null; // 绝对置位；null = 取消选中
  pause?:           boolean;          // 绝对置位（true=暂停），不是 toggle
  // ---- RESERVED（R1 sim 静默忽略，MUST 不抛错）----
  callWave?:        boolean;          // 提前唤下一波
  upgradeSocket?:   SocketIndex;      // 升级
  sellSocket?:      SocketIndex;      // 出售
}
```

空对象 `{}` 是合法输入（多数帧如此）。同帧多次操作由 input 层「后者覆盖前者」归并成一个 SimInput。

### 2.2 MatchView（`getView` 返回）

```ts
interface MatchView {
  backend: string;          // sim 恒返回 'sim'；main MUST 覆写为 renderer.backend 后再分发
  wave: number;             // 已开始的最新波序号 1..20；开局备战期为 0
  waveTotal: number;        // = CONFIG.waveCount = 20
  scrap: number;            // 当前屑晶（整数）
  coreHp: number;           // 星核当前血
  coreMax: number;          // = CONFIG.coreHp = 20
  time: number;             // 累计模拟时间（秒，暂停不走）
  paused: boolean;
  status: MatchStatus;
  interWaveT: number;       // 距下一波开始的秒数；波进行中为 0
  selectedSocket: SocketIndex | null;
  sockets: SocketView[];    // 恒 24 项，下标 === i
  enemies: EnemyView[];
  shots: ShotView[];
  events: SimEvent[];       // 最近一次 step 的事件镜像（帧内聚合请用 step 返回值，见架构 §5）
}

interface SocketView {
  i: SocketIndex;
  towerId: TowerId | null;  // null = 空插座
  level: number;            // 1..3；R1 恒 1（升级 RESERVED）
  overclockT: number;       // 过载剩余秒，未过载为 0
  overheatT: number;        // 停火剩余秒，未停火为 0
  cooldownT: number;        // 开火冷却剩余秒（HUD 可视化用）
  hp: number;               // 塔血量；空插座为 0。R1 敌人不攻塔，恒 = 满血
}

interface EnemyView {
  id: number;
  kind: string;             // ENEMIES 表键，如 'mite' / 'etch-lord'
  lane: LaneIndex;
  theta: number;            // [必备] 环向角（弧度）。渲染位置 = (cosθ·radius, y, sinθ·radius)
  radius: number;           // 52 → 8 递减
  y: number;                // = CONFIG.laneY[lane]（冗余给渲染层，MUST 一致）
  hp: number;
  maxHp: number;
  armor: ArmorKind;
  size: SizeClass;
  slow: number;             // 当前减速乘数，1 = 无减速（坠井光环生效时 <1）
}

interface ShotView {
  id: number;
  kind: ShotKind;
  from: Vec3;               // 世界坐标（sim 用 §1 公式算好）
  to: Vec3;
  t: number;                // 归一化生命 0..1；≥1 时 sim 已移除
  radius?: number;          // 仅 kind==='pulse'：脉冲最大半径（= 塔 range）
}
```

### 2.3 SimEvent（名称冻结，payload 冻结）

```ts
type SimEvent =
  | { type: 'place';     socket: SocketIndex; towerId: TowerId; cost: number }
  | { type: 'deny';      reason: DenyReason; socket?: SocketIndex; towerId?: TowerId }
  | { type: 'kill';      id: number; kind: string; scrap: number; socket?: SocketIndex } // socket=击杀主责塔，AoE 可省略
  | { type: 'leak';      id: number; kind: string; damage: number; coreHp: number }
  | { type: 'overclock'; socket: SocketIndex }
  | { type: 'overheat';  socket: SocketIndex }
  | { type: 'win';       wave: number }
  | { type: 'lose';      wave: number }
  // ---- 扩展事件（本轮即实现，消费方按未知类型容忍原则处理亦可）----
  | { type: 'waveStart'; wave: number }
  | { type: 'waveClear'; wave: number; bonus: number };

type DenyReason =
  | 'badSocket'   // 索引非整数或越界 [0,23]
  | 'badTower'    // towerId 不在 TOWERS
  | 'occupied'    // 插座已有塔
  | 'noScrap'     // 屑晶不足
  | 'noTower'     // 过载目标为空插座
  | 'cooling'     // 过载中(overclockT>0) 或停火中(overheatT>0) 再次过载
  | 'ended';      // 对局已结束（won/lost）后仍尝试 place/overclock
```

---

## 3. `src/sim`（O3 实现；无 Babylon、无 DOM）

### 3.1 冻结签名

```ts
/**
 * 创建对局。seed 非有限数或缺省 → 1，否则 seed>>>0。
 * opts 供测试注入：waves 整体替换波表；config 浅合并 CONFIG（只许覆盖已有键）。
 * MUST 不抛错（坏参数一律归一化/忽略）。返回的 match 为不透明对象，外部 MUST NOT 读写其内部。
 */
function createMatch(seed?: number, opts?: { waves?: WaveDef[]; config?: Partial<Config> }): Match;

/**
 * 推进一步。dtSec MUST 被内部 clamp 到 [0, CONFIG.simMaxDt=0.1]。
 * 执行顺序严格按 ARCHITECTURE §6 tick 顺序。不可重入。
 * MUST 不因任何 input 内容抛错（非法 → deny 事件或静默忽略）。
 * 返回本次调用产生的事件（新数组，调用方可自由持有）。
 */
function step(match: Match, input: SimInput, dtSec: number): { events: SimEvent[] };

/**
 * 纯读快照。MUST NOT 改变 match；可每帧多次调用；返回 JSON-pure MatchView。
 * view.events 为最近一次 step 的事件镜像。
 */
function getView(match: Match): MatchView;
```

### 3.2 放置规则

- 校验顺序（决定 deny reason 的唯一性）：`badSocket → badTower → ended → occupied → noScrap`。**[冻结]**
- 成功：`scrap -= TOWERS[towerId].cost`；socket 置 `{towerId, level:1, hp:TOWERS[towerId].hp, cooldownT:0, overclockT:0, overheatT:0}`；emit `place`。
- 暂停中允许放置与选中（QoL）；终局后拒绝（`ended`）。

### 3.3 过载规则 **[冻结数值]**

- 触发：`input.overclockSocket`。校验顺序：`badSocket → ended → noTower → cooling`。
- 效果：`overclockT = CONFIG.overclock.duration = 4`；期间该塔伤害 × `CONFIG.overclock.mult = 2.2`。
- 结束：`overclockT` 触底瞬间 `overheatT = CONFIG.overclock.cooldown = 3` 并 emit `overheat`；期间该塔不开火。
- 免费，不耗屑晶。计时器仅在未暂停时递减。暂停中可以下达过载指令（立即置 `overclockT=4`，但暂停期间不走表）。

### 3.4 目标选择 **[冻结默认]**

- 塔按 `socket 0→23` 顺序处理；每塔在 `range`（3D 欧氏距离，自炮口 `muzzleY` 到敌人位置）内选 **radius 最小**者，平局取 **id 最小**。
- `TOWERS[t].lanes` 存在时只考虑这些轨道的敌人；缺省全轨道可命中。

### 3.5 各塔机制（R1 冻结语义；数值全部走 data）

| 塔 | 机制 | shots 产出 |
| --- | --- | --- |
| `rail` 轨炮 | 单体 hitscan，高伤低射速。`pierce` 字段 RESERVED（R1 单体） | 1 × `tracer`（炮口→目标） |
| `prism` 棱镜 | 直线光束 + 折射，见 §3.6 | 1..2 × `beam` |
| `scatter` 霰星 | 每次开火命中至多 `pellets` 个射程内敌人（radius 最小优先），每目标各吃一次 `damage` | ≤pellets × `pellet` |
| `well` 坠井 | 无目标选择。常驻光环：射程内敌人 `slow = TOWERS.well.slow`（多井取最小乘数，不叠乘）；每 `1/rate` 秒对射程内全体结算一次 `damage` | 每脉冲 1 × `pulse`（from=to=塔位，`radius`=range） |
| `star` 星弩 | 取主目标（§3.4），以其当前位置为落点，对落点 `splash` 半径内全体各结算 `damage` | 1 × `arc`（炮口→落点，combat 画抛物线） |

R1 全塔伤害在开火 tick 即时结算（hitscan 模型）；弹道飞行纯视觉。

### 3.6 棱镜折射 **[冻结裁决——实现以此为准]**

```
段1：prism P1 → 主目标敌 A（§3.4 选出），A 吃全额伤害。
折射条件：存在另一插座上的 prism 塔 P2（P2 ≠ P1），dist3D(A的位置, P2炮口) ≤ TOWERS.prism.refractRange = 18。
        多个候选取距 A 最近者。R1 只做距离判定，不做视线遮挡/角度（R2 再收紧）。
段2：A 的位置 → 次目标敌 B。B = 满足 dist3D(P2炮口, B) ≤ TOWERS.prism.range 且 B ≠ A 的敌人中
     radius 最小者（平局 id 最小）。B 吃 damage × TOWERS.prism.refractRatio。
     若无 B，则无段2（只出 1 条 beam）。
上限：每次开火最多 2 段（1 次折射）。两段各生成一条 kind:'beam' 的 ShotView。
```

### 3.7 伤害公式 **[冻结]**

```
final = TOWERS[t].damage
      × DAMAGE_MATRIX[t][enemy.armor]
      × (socket.overclockT > 0 ? CONFIG.overclock.mult : 1)
      × levelMult                      // R1 恒 1；R2 由 upgrades.mult 生效
      × (段2 折射 ? TOWERS.prism.refractRatio : 1)
```

击杀：`hp ≤ 0` → tick 第 7 步统一结算（`kill` 事件 + `ENEMIES[kind].scrap` 入账）。
漏敌扣核 **[冻结]**：`CONFIG.leakDamage = { small:1, medium:3, elite:8, boss:20 }`。

### 3.8 生成（spawn）与随机 **[冻结]**

- 波 n（1..20）读 `WAVES[n-1].entries`；每条 entry 自波开始 `delay` 秒起，每隔 `gap` 秒生成 1 个，共 `count` 个。
- 生成态：`radius = CONFIG.spawnRadius(52)`，`lane = entry.lane`，`hp = ENEMIES[kind].hp`，
  `theta = entry.thetaBase !== undefined ? entry.thetaBase + (rng()-0.5) × (entry.thetaSpread ?? π/6) : rng() × 2π`。
- 首波于 `CONFIG.firstWaveDelay` 秒后开始；波清后 `CONFIG.interWaveDelay` 秒开下一波。
- 唯一随机源 mulberry32（参考实现，sim 照抄）：

```js
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

- 确定性：同 seed + 同 `(input, dtSec)` 序列 → `getView` 深度相等。`src/sim`、`src/data` 禁用 `Math.random / Date / performance`。

### 3.9 shots 生命周期

- `t` 由 0 增至 1：`t += dt / CONFIG.shotLife[kind]`；`t ≥ 1` 移除。
- 存量上限 128：超限丢弃最旧（纯视觉，不影响结算）。
- combat 对 `pellet`/`arc` 按 `t` 在 from→to 间插值位置（arc 另加抛物高度，视觉参数归 combat）。

---

## 4. `src/data`（F3 实现；纯常量，只允许 `src/data` 内部相互 import）

### 4.1 冻结导出

```ts
export const CONFIG: Config;
export const TOWERS: Record<TowerId, TowerDef>;         // 恰好 5 键：rail/prism/scatter/well/star
export const ENEMIES: Record<string, EnemyDef>;         // 至少含 boss 'etch-lord'
export const WAVES: WaveDef[];                          // 长度 20；WAVES[19] 含 etch-lord
export const DAMAGE_MATRIX: Record<TowerId, Record<ArmorKind, number>>;  // 克制表，缺省视为 1
```

### 4.2 Config

```ts
interface Config {
  socketCount: 24;            // [冻结]
  coreHp: 20;                 // [冻结]
  startScrap: 180;            // [冻结]
  lanes: [0, 1, 2];           // [冻结]
  laneY: [0, 4, 9];           // [冻结]
  spawnRadius: 52;            // [冻结]
  coreRadius: 8;              // [冻结]
  socketRadius: 40;           // [冻结] 插座环半径（现有 stub 需补此键）
  waveCount: 20;              // [冻结]
  simMaxDt: 0.1;              // [冻结] step 的 dt 上限
  overclock: { mult: 2.2; duration: 4; cooldown: 3 };            // [冻结]
  leakDamage: { small: 1; medium: 3; elite: 8; boss: 20 };       // [冻结]
  firstWaveDelay: number;     // [可调] 建议 3
  interWaveDelay: number;     // [可调] 建议 5
  shotLife: { tracer: number; beam: number; pellet: number; arc: number; pulse: number };
                              // [可调] 建议 0.12 / 0.18 / 0.35 / 0.9 / 0.5
}
```

### 4.3 TowerDef / EnemyDef / WaveDef

```ts
interface TowerDef {
  id: TowerId;
  name: string;               // 中文显示名（HUD dock 用）
  cost: number;               // 屑晶 [可调]
  archetype: ShotKind;        // rail:'tracer' prism:'beam' scatter:'pellet' well:'pulse' star:'arc' [冻结映射]
  damage: number;             // 基础伤害/次（pellet 为单目标；pulse 为每脉冲）[可调]
  rate: number;               // 次/秒 [可调]
  range: number;              // 3D 射程 [可调]
  muzzleY: number;            // 炮口高度（sim 算 from 用）[可调]
  hp: number;                 // SocketView.hp 初值 [可调]
  lanes?: LaneIndex[];        // 可命中轨道，缺省全部 [可调]
  pellets?: number;           // scatter 必填，建议 4 [可调]
  splash?: number;            // star 必填：落点 AoE 半径 [可调]
  slow?: number;              // well 必填：减速乘数 0..1，建议 0.55 [可调]
  refractRatio?: number;      // prism 必填：折射段伤害比，建议 0.6 [可调]
  refractRange?: 18;          // prism 必填 [冻结 =18]
  pierce?: number;            // RESERVED（rail R2 穿透）
  upgrades: { cost: number; mult: { damage?: number; rate?: number; range?: number } }[];
                              // 长度 ≤2（→Lv2、→Lv3）；R1 sim 不消费但 MUST 写全 [可调]
}

interface EnemyDef {
  kind: string;               // 与 ENEMIES 键一致
  name: string;
  size: SizeClass;
  hp: number;                 // [可调]
  speed: number;              // radius 递减速率（单位/秒）[可调]
  armor: ArmorKind;
  scrap: number;              // 击杀奖励 [可调]
  drift?: number;             // θ 漂移 rad/s，缺省 0 [可调]
  lanes?: LaneIndex[];        // 允许出现的轨道（波表校验用）[可调]
  special?: string;           // RESERVED（etch-lord R2 特技标记，R1 sim 忽略）
}

interface WaveEntry {
  delay: number;              // 自波开始的秒数
  kind: string;               // ENEMIES 键
  lane: LaneIndex;
  count: number;
  gap: number;                // 个体间隔秒
  thetaBase?: number;         // 见 §3.8
  thetaSpread?: number;
}
interface WaveDef { wave: number; entries: WaveEntry[]; bonus?: number }  // bonus=波清奖励屑晶
```

约束：R1 模拟层至少消费前 5 波；20 波 + Boss 数据 MUST 齐全。数值平衡细节归 `docs/GDD.md`（F3）。

---

## 5. `src/engine`（O1 实现）

```ts
/**
 * 探测顺序 [冻结]：WebGPU（navigator.gpu 且 WebGPUEngine.init 成功）→ WebGL2 → reject。
 * 错误 [冻结]：canvas 无效 → reject Error('shihe:no-canvas')；双后端失败 → reject Error('shihe:no-backend')。
 * 内部创建：Scene、ArcRotateCamera（attachControl，目标(0,4,0)）、Bloom 管线、GlowLayer、
 *           阴影光源+ShadowGenerator（仅 high）、resize 监听。写 scene.metadata.shEngine。
 * MUST NOT：启动 renderLoop（归 main）、创建游戏内容网格（归 world）。
 */
function createRenderer(
  canvas: HTMLCanvasElement,
  opts?: { preferBackend?: BackendId; quality?: QualityTier }
): Promise<Renderer>;

interface Renderer {
  engine: unknown;            // Babylon Engine | WebGPUEngine
  scene: unknown;             // Babylon Scene（activeCamera 已就绪）
  backend: BackendId;
  setQuality(tier: QualityTier): void;   // 幂等；high=Bloom+Glow+阴影 mid=Bloom+Glow low=全关 [冻结]
  dispose(): void;            // 移除监听、释放引擎
}
```

默认档 **[冻结]**：`opts.quality` 缺省时 webgpu→`high`、webgl2→`mid`；main 负责解析 URL `?quality=` 后传入。

## 6. `src/world`（O2 实现）

```ts
/**
 * 建静态世界 + 可同步实体池：星核、外环、24 插座、三层轨道示意、照明、拾取代理。
 * getView 仅用于初始布局读数，MUST NOT 调 step。句柄写 scene.metadata.shWorld。
 * 每个可拾取的插座网格 MUST 置 mesh.metadata = { ...原值, shSocket: i } [冻结]。
 * 若 scene.metadata.shEngine?.shadow 存在，注册投/受影者。
 */
function buildWorld(scene: unknown, getView: () => MatchView): void;

/**
 * 幂等同步：塔的出现/消失、过载(overclockT>0)/过热(overheatT>0)变色、选中高亮、
 * 敌人位置（thin instance 推荐）、星核受击脉冲（可用 coreHp 差值驱动）。
 * MUST null 安全：空 view / 空数组不抛错。MUST NOT 回写 view。
 */
function syncWorld(scene: unknown, view: MatchView): void;

/**
 * 从 Babylon PickingInfo 解析插座号：命中网格自身或祖先带 metadata.shSocket → 返回该值，否则 null。
 */
function pickSocket(scene: unknown, pickInfo: unknown): SocketIndex | null;
```

## 7. `src/combat`（O3 实现，纯视觉）

```ts
/**
 * 只消费 view.shots（+ 可选 events 做击杀闪光）。对象池上限 128，句柄写 scene.metadata.shCombat。
 * kind 视觉 [冻结]：tracer=曳光线段 beam=粗光束 pellet=飞行粒(from→to 按 t 插值)
 *                  arc=抛物线弹(视觉加高) pulse=扩张环(半径= shot.radius × t)。
 * MUST NOT 计算伤害或改动 view。未知 kind 忽略。
 */
function syncCombat(scene: unknown, view: MatchView, events?: SimEvent[]): void;
```

## 8. `src/ui` 与 `src/input`（O4 实现，DOM only）

```ts
/**
 * 挂到 index.html 既有骨架（见 §12）。渲染 dock（5 塔按钮：name+cost，源自 TOWERS）。
 * callbacks.onTowerSelect(towerId)：dock 点击/再点取消；callbacks.onOverclock()：.sh-overclock 点击。
 */
function mountHud(
  doc?: Document,
  callbacks?: { onTowerSelect?(towerId: TowerId | null): void; onOverclock?(): void }
): HudHandle;                 // HudHandle 对 main 不透明

/**
 * 用 view 刷新核血/屑晶/波次/后端/过载按钮态；用 events（帧聚合，见架构 §5）出 toast：
 * deny→理由文案、leak/kill/waveStart/waveClear/overclock/overheat/win/lose→提示。
 * MUST null 安全、幂等、每帧调用不重复弹同一事件（事件数组每帧都是新内容）。
 */
function syncHud(hud: HudHandle, view: MatchView, events?: SimEvent[]): void;
```

```ts
/**
 * 键鼠 → SimInput 队列。opts.resolveSocket 由 main 注入（内部 scene.pick + pickSocket）。
 * 绑定 [冻结]：数字 1..5 = 依序 rail/prism/scatter/well/star（武装放置）；
 *              左键点插座：已武装→place，未武装→selectedSocket；Esc/右键=解除武装；
 *              F 或 queueOverclock() = overclockSocket(最近选中/放置的插座)；空格 = pause 切换（发绝对值）。
 * 点击 vs 拖镜头：pointerup 且位移 < 6px 才算点击，其余留给 ArcRotateCamera [冻结]。
 * read()：返回自上次 read 以来归并的 SimInput 并清空（后者覆盖前者）；无操作返回 {}。
 */
function createInput(
  canvas: HTMLCanvasElement,
  opts: { resolveSocket(clientX: number, clientY: number): SocketIndex | null }
): {
  read(): SimInput;
  setArmedTower(towerId: TowerId | null): void;   // dock 点击经 main 转发到这里
  queueOverclock(): void;                          // .sh-overclock 按钮经 main 转发
  dispose(): void;
};
```

## 9. `src/main.js` 装配责任（O1）**[冻结]**

启动序列与帧循环逐条见 `ARCHITECTURE.md` §5，要点复述：

1. `SIM_DT = 1/60` 固定步长累加器，每帧 ≤5 子步；输入只喂第一个子步。
2. **事件帧聚合**：`frameEvents` 收齐所有子步的 `step().events`，传给 `syncCombat` / `syncHud`。
3. **backend 覆写**：`view = getView(match); view.backend = renderer.backend;` —— 这是全项目唯一允许改写 view 的位置。
4. 接线：`hud.onTowerSelect → inp.setArmedTower`；`hud.onOverclock → inp.queueOverclock`；`resolveSocket = (x,y) => pickSocket(scene, scene.pick(x,y))`。
5. seed：URL `?seed=` 整数，缺省 `Date.now() % 2**31`；quality：URL `?quality=high|mid|low` 传入 `createRenderer`。
6. `createRenderer` reject 时在 `.sh-toast` 显示错误文案（不留白屏）。

## 10. 事件总表 **[冻结]**

| type | 触发点（tick 步） | payload |
| --- | --- | --- |
| `place` | 1c 放置成功 | `socket, towerId, cost` |
| `deny` | 1c/1d 校验失败 | `reason(+socket?, towerId?)` |
| `waveStart` | 4 开波 | `wave` |
| `kill` | 7 死亡结算 | `id, kind, scrap, socket?` |
| `leak` | 8 漏敌 | `id, kind, damage, coreHp` |
| `overclock` | 1d 过载生效 | `socket` |
| `overheat` | 6a 过载转停火 | `socket` |
| `waveClear` | 10 波清 | `wave, bonus` |
| `win` | 10（第 20 波清） | `wave` |
| `lose` | 8（coreHp≤0；同 tick 先于 win 判定） | `wave` |

每种事件单次 `step` 内可出现多条（如多杀）；顺序 = tick 步序 + 同步内结算序（kill 按敌 id 升序）。

## 11. 错误策略总表 **[冻结]**

| 层 | 策略 |
| --- | --- |
| sim | 运行期 MUST 不抛：非法 place/overclock → `deny`；非法 selectedSocket/pause/RESERVED 输入 → 静默忽略；坏 seed → 归一化；坏 dt → clamp |
| data | 纯常量不抛；probe/tests 负责静态校验（键齐全、波表 20、矩阵 5×4） |
| engine | `Promise.reject(Error)`，message 前缀 `shihe:`：`shihe:no-canvas` / `shihe:no-backend` |
| world/combat/ui | sync 系列 MUST null 安全、MUST 容忍未知枚举、MUST NOT 抛错中断渲染帧 |
| 全员 | 未知事件类型 / 未知字段一律忽略（前向兼容） |

## 12. HUD DOM 冻结表（F2 CSS / O4 HTML 共用）

class **[冻结]**：`.sh-hud` `.sh-core` `.sh-scrap` `.sh-wave` `.sh-dock` `.sh-toast` `.sh-backend` `.sh-overclock`
id（`index.html` 既有，**[冻结]**）：`#sh-canvas` `#sh-hud` `#sh-backend` `#sh-core` `#sh-scrap` `#sh-wave` `#sh-dock` `#sh-toast` `#sh-overclock`
交互性：`.sh-hud { pointer-events:none }`，仅 `.sh-dock` 与 `.sh-overclock` 恢复 `pointer-events:auto`（已在 stub CSS，保持）。
O4 可在 dock 内自造子元素（建议 `button.sh-dock-item[data-tower=<TowerId>]`），F2 按此选择器写皮肤。

## 13. 兼容与扩展规则 **[冻结]**

1. 只做**加法**：新增可选字段/事件不升版；改名、删除、改语义必须升版（F1 操作）。
2. RESERVED 项（`callWave/upgradeSocket/sellSocket/pierce/special/level>1`）：R1 谁都不许实现出「半吊子行为」——要么完整实现并在简报声明，要么静默忽略。
3. 消费方对枚举做 `default: 忽略` 分支，禁止 `throw new Error('unknown kind')`。
4. 本文与简报冲突时：简报冻结的名字/数值优先；简报含糊处以本文裁决为准（θ 必备、折射 §3.6、backend 覆写 §9.3、事件帧聚合 §9.2）。

## 14. 测试可依赖的最小断言集（GPT-sol-1 对照实现）

以下断言 O3 交付时 MUST 全绿：

1. **形状**：`createMatch(1)` 后 `getView` 满足：`sockets.length===24` 且 `sockets[i].i===i`；`coreHp===20 && coreMax===20`；`scrap===180`；`wave===0`；`waveTotal===20`；`status==='playing'`；`backend==='sim'`；`paused===false`；JSON-pure（`JSON.parse(JSON.stringify(view))` 深等于自身）。
2. **放置**：合法 place → `scrap` 减 `TOWERS[t].cost`、`sockets[s].towerId===t`、事件含 `place`；重复放同座 → `deny/occupied` 且 scrap 不变；`towerId:'nope'` → `deny/badTower`；`socket:99` → `deny/badSocket`；scrap 不足 → `deny/noScrap`。
3. **确定性**：seed=7 两局跑相同脚本（含放塔与 300 步 `step(m,{},1/60)`）→ 每步 `getView` 深等。
4. **漏敌**：`createMatch(1,{waves:[单只small直冲]})` 不放塔 → 出现 `leak` 且 `coreHp===19`；持续放怪至 `coreHp<=0` → `lose` 且 `status==='lost'`，之后 place → `deny/ended`。
5. **过载**：放塔后 overclock → `overclockT≈4` 递减；4s 后出 `overheat` 且 `overheatT≈3`；期间再 overclock → `deny/cooling`；空座 → `deny/noTower`。
6. **暂停**：`pause:true` 后连续 step，`time` 与 `enemies[].radius` 不变；`pause:false` 恢复。
7. **克制**：用 `opts.config`+`opts.waves` 注入可控场景，验证 `DAMAGE_MATRIX` 乘数生效（击杀所需 step 数不同）。

---

### CHANGELOG

- **v1**（Round 1）：初版冻结。来源：`.agent_workspace/shihe-yaosai/round1/BRIEF.md` + `GOAL.md`；裁决点见 §13.4。
