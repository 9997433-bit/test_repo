# 模块契约（Round 1 审计版）

> 与 `docs/ARCHITECTURE.md` 配套。记法：
> - **[v1 现状]**：当前源码的真实签名（本轮已逐一核对源码，修正了旧契约与实现的漂移——旧文写 `createBattle(seed, player, enemy)`，实际是单对象参数）。
> - **[v2 提案]**：Round 2 应实现的目标接口，负责人见 `ARCHITECTURE.md` §10 与所有权表。
> - 类型用 TS 记法描述，实现仍是 JS + JSDoc；`?` 为可选，默认值写在注释。
> - §7 的不变量必须转成 `tests/contract.test.js` 断言。

## 0. 共享类型

```ts
type StrokeType = "line" | "curve" | "circle" | "zigzag" | "spiral" | "cloud" | "scribble";
type ElementId  = "metal" | "wood" | "water" | "fire" | "earth" | "thunder";
type ClassId    = "jian" | "ti" | "fa" | "dao" | "yao" | "qi" | "mo";

interface Point { x: number; y: number; t?: number /* performance.now() ms */ }

interface Stroke {
  type: StrokeType;
  precision: number;        // [0.12, 1] 置信×规整度；scribble 可低至 0.075
  pressure: number;         // [0.15, 1] 速度反推伪压感
  length: number;           // 原始折线长度 px
  bounds: { minX; minY; maxX; maxY; w; h };
  raw: Point[];             // 原始采样点（未重采样）
  // [v2 新增]
  scores?: Record<StrokeType, number>;  // 各类型得分，调参/测试用
  durationMs?: number;                  // 起笔到收笔
}
```

## 1. data（叶子层，只读表）

```ts
// data/classes.js
CLASSES: { id: ClassId; name; motto; bonus: Partial<Record<StrokeType, number>>;
           element: ElementId; role; hidden?: boolean }[]
COUNTER: Record<ClassId, ClassId>          // 攻方 class 克制受方 class ⇒ ×1.18 / 被克 ×0.88
classById(id): Class | null

// data/realms.js
REALMS: { id; name; xp: number /* 突破所需，最后一级 Infinity */;
          idlePerMin; hp; atk; qi }[]
realmById(id): Realm            // 未知 id 回退 REALMS[0]
nextRealm(id): Realm            // 已是最后一级则返回自身

// data/stages.js
STAGES: { id; name; enemyId; reward: { xp: number; qiPills: number } }[]

// data/enemies.js
ENEMIES: { id; name; classId: ClassId; hp; atk; element: ElementId; lore }[]

// data/talismans.js
TALISMANS: Record<StrokeType, { id; name; qi: number /* 消耗 */; tags: string[] }>

// data/beasts.js
BEASTS: { id; name; passive: "crit" | "qiRegen" | "shield"; value: number }[]
```

约束：data 层无函数副作用、无上层 import；数值改动属 Fable-3 所有权。**已知不一致**：`COUNTER.jian = "yao"` 不在 GDD 克制环内且无人克制 jian（ARCHITECTURE §10-D10），Round 2 由 Fable-3 定案后 Opus-2 跟改。

## 2. drawing

### 2.1 识别 `drawing/recognizer.js`

```ts
classifyStroke(rawPoints: Point[]): Stroke
// [v1 现状] 纯函数、同步；<6 点或 length<28px ⇒ scribble；
//           最高分 <0.42 ⇒ 降级 scribble（precision 减半）。
// [v2] 阈值改为归一化：minLen = 0.06 × 画布短边（由调用方经 options 传入
//      classifyStroke(raw, { unit: number })），消除 DPI/尺寸依赖。

createStrokeRecognizer(): {
  consume(point: Point): void;      // [v1 现状] 空壳 no-op —— 契约违约点
  finalize(points: Point[]): Stroke;
}
// [v2] consume 实装为增量特征累积（长度/包围盒/转角滑窗），
//      finalize(points?) 不传参时用 consume 累积的点；
//      新增 reset(): void 供 pointercancel 丢弃。
```

### 2.2 墨刷 `drawing/ink.js`

```ts
createInkBrush(ctx: CanvasRenderingContext2D): {
  stroke(points: Point[], opts?: { color?: string /* #1a120b */, pressure?: number /* 0.5 */ }): void;
  bloom(x, y, color, r?: number /* 28 */): void;
}
```

### 2.3 画布适配器 `drawing/canvas.js`（DOM 边界件）

```ts
// [v1 现状]
mountPainter(canvas: HTMLCanvasElement, opts?: { onStroke?(s: Stroke): void }): {
  resize(): void;
  clear(): void;
  destroy(): void;   // 缺陷：只解绑 4 个 pointer 监听；touch×3 与 window.resize 泄漏
}

// [v2 目标]
mountPainter(canvas, opts?: {
  onStroke?(s: Stroke): void;
  onInkStart?(): void;             // 起笔（供音效/特效）
  reducedMotion?: boolean;         // 关 bloom 动效
}): { resize; clear; destroy }
// destroy 契约：幂等；解绑全部监听（仅 Pointer Events 单栈 + pointercancel）、
// 断开 ResizeObserver、丢弃未完成笔迹。unmount 后无任何该 canvas 的活跃引用。
// 渲染契约：纸纹层（离屏或底 canvas，只画一次）与墨迹层分离；
// 纸纹噪点用种子 RNG，禁止 Math.random。
```

## 3. combat

### 3.1 元素 `combat/elements.js`

```ts
ELEMENTS: ElementId[]
reaction(src: ElementId, dst: ElementId): {
  id: "evaporate" | "vine" | "conduct" | "suppress" | "resist" | "none";
  label: string;        // 空串表示无播报
  damage: number;       // 伤害乘区
  control?: number;     // 追加控制 ms（vine=400）
  crit?: number;        // [v1 现状] conduct=0.15 但战斗层未消费 —— 死字段
}
// [v2] battle 消费 crit（暴击率乘区），或由 Fable-3 删除该字段；二选一，不许悬空。
```

### 3.2 战斗工厂 `combat/battle.js`

```ts
interface ActorSpec { id; name; classId?: ClassId; element?: ElementId;
                      realmId?: string; hp?; atk?; qi? }  // 缺省从 realm 表补
interface Actor { id; name; classId; element; maxHp; hp; maxQi; qi; atk;
                  shield: number; controlMs: number; shred: number /* ≤0.35 */ }

// [v1 现状] —— 注意：旧契约写 createBattle(seed, player, enemy)，与实现不符，以下为准
createBattle(cfg: { player: ActorSpec; enemy: ActorSpec; seed?: number /* 1 */ }): {
  cast(stroke: Pick<Stroke,"type"|"precision"|"pressure">, elementHint?: ElementId)
    : { events: BattleEvent[]; state: BattleState };
  tick(dtMs: number): BattleState;
  getState(): BattleState;   // 返回内部可变引用（测试在直改 hp——v2 收紧为只读约定）
}

interface BattleState {
  player: Actor; enemy: Actor;
  log: { t: number; msg: string; kind: string }[];  // 最多 24 条，新在前
  finished: null | "win" | "lose";
  t: number;                 // 逻辑累计 ms
}

// [v2 变更]
createBattle(cfg: {
  player: ActorSpec; enemy: ActorSpec;
  seed: number;                       // 必填；由调用方生成并存入 session 供回放
  modifiers?: Modifiers;              // §4.2，打通天赋/灵兽/境界加成
}): BattleApi
// 数值接入点（Opus-2）：
//   atkMult → 伤害乘区; shieldMult → circle 护盾量; healMult → cloud 回复;
//   controlMult → curve 束缚时长; critChance/critMult → 暴击（消费 reaction.crit）;
//   qiRegenPerSec → tick 回气; enemyAtkMult → 承伤(防御树)。
// 敌方节拍：内部维护 nextEnemyAt 绝对时刻（首击 1800ms，之后 +1800ms），
//   禁止 t % 1800 相位判定。
```

### 3.3 AI `combat/ai.js`

```ts
enemyIntent(t: number, controlMs: number): "bound" | "strike" | "watch"
// [v1 现状] 无调用方（死代码）。
// [v2] battle.tick 用它决定节拍并在 BattleEvent 中携带 intent，
//      UI 据此渲染敌方"蓄力"预警条（400ms strike 窗口）。
```

### 3.4 结构化事件 `BattleEvent`（[v2 新增]，替代字符串日志作为主输出）

```ts
type BattleEvent =
  | { type: "cast";    talisman: Talisman; stroke: Stroke; caster: "player" }
  | { type: "damage";  target: "player"|"enemy"; amount: number; absorbed: number; crit: boolean }
  | { type: "shield";  target: "player"; amount: number }
  | { type: "heal";    target: "player"; amount: number }
  | { type: "control"; target: "enemy"; addedMs: number }
  | { type: "shred";   target: "enemy"; total: number }
  | { type: "react";   reaction: ReactionId; label: string }
  | { type: "warn";    reason: "no_qi" }
  | { type: "enemyHit"; amount: number; absorbed: number }
  | { type: "finished"; result: "win" | "lose" };   // 每场恰好一次
// cast/tick 均返回本次产生的 events；state.log 降级为便捷调试字段，
// UI 文案由 ui/widgets/log.js 从 events 格式化（含 aria-live 播报）。
```

### 3.5 战斗会话 `combat/session.js`（[v2 新增]，收编时钟）

```ts
createBattleSession(cfg: {
  battle: BattleApi;
  logicDtMs?: number;            // 默认 100
  onEvent(e: BattleEvent): void; // finished 恰好回调一次
  onFrame?(state: BattleState): void;  // 每渲染帧（rAF）供 UI 刷条
}): {
  start(): void;
  pause(): void;                 // visibilitychange→hidden 时由屏幕调用
  resume(): void;
  dispose(): void;               // 幂等；取消 rAF；此后 onEvent/onFrame 不再触发
}
// 内部：rAF + accumulator 固定步长驱动 battle.tick；
// finished 后自动停摆并置 settled，重复 start/dispose 均安全。
```

## 4. progression / classes

### 4.1 现有纯变换 [v1 现状，签名保留]

```ts
tickIdle(save: Save, nowMs?: number /* Date.now() */): Save
// 结算 (nowMs - idleUntil)，上限 480 分钟；写 idleClaim 摘要；重置 idleUntil/lastSeenAt。

breakthrough(save: Save): Save        // xp 不足/已飞升时只写 notice
catchBeast(save: Save, rng?: () => number /* Math.random */): Save
// [v2] 收兽定价：消耗 buns（数值由 Fable-3 定入 data），rng 必须由调用方注入种子。
beastBonus(save: Save): { crit: number; qiRegen: number; shield: number }
// [v1 现状] 无调用方 —— 经 §4.2 接入。
```

### 4.2 修正聚合 `progression/modifiers.js`（[v2 新增]，天赋/灵兽接入点）

```ts
interface Modifiers {
  atkMult: number;        // talentMult(save,"atk") 起步
  shieldMult: number;     // "def" 树 ward/bastion
  healMult: number;       // "sup" 树 spring
  controlMult: number;    // "sup" 树 control
  enemyAtkMult: number;   // "def" 树减伤（dodge 折算）
  critChance: number;     // beastBonus.crit + reaction.crit
  critMult: number;       // 默认 1.5
  qiRegenPerSec: number;  // 基础 8/s + beastBonus.qiRegen
  startShield: number;    // beastBonus.shield
}
deriveModifiers(save: Save): Modifiers   // 纯函数；单测锚点
```

### 4.3 天赋 `classes/talents.js` [v1 现状，保留]

```ts
TALENTS: { id; name; tree: "atk"|"def"|"sup"; per: number }[]   // 每级加成
talentMult(save, tree): number       // 1 + Σ level×per —— 当前无调用方，经 §4.2 接入
applyTalent(save, id): Save          // 上限 5 级；花费 12 丹；不足时原样返回
// [v2] 不足时返回 { ...save, notice: "灵气丹不足" }（UI 需要反馈）；
//      花费改读 data 表并按级递增（Fable-3 定价）。
```

### 4.4 战斗结算 `progression/settle.js`（[v2 新增]，恰好一次语义的落点）

```ts
settleBattle(save: Save, stageId: string, result: "win" | "lose"): Save
// win：xp += reward.xp; qiPills += reward.qiPills; inkUnlocked ||= hasSixForms(gallery)
// lose：只记 lastResult 相关 session 字段（由调用方写 session，本函数不碰）。
// 纯函数、幂等由调用方保证（路由 battle→result 转移时调用一次，见 ARCHITECTURE §3.3）。
```

### 4.5 解锁判定

```ts
hasSixForms(gallery: { type: StrokeType }[]): boolean
// distinct type 数 ≥ 6（scribble 不计）。替代现状 UI 里的 gallery.length >= 6 错误判定。
```

## 5. core

### 5.1 store `core/store.js`

```ts
defaultSave(): Save          // 见 ARCHITECTURE §3.1 save 层字段
createStore(initial?): {
  get(): State;
  set(patch: Partial<State>): State;   // 浅合并；嵌套对象必须整体替换
  subscribe(fn): () => void;
  persist(): void;           // localStorage "linghuashi.save.v1"；quota 异常吞掉
  hydrate(): State;          // [v1 现状] version!==1 直接丢档
}
// [v2] state 分 { save, session }；persist 只序列化 save；
//      hydrate 走 migrate 链：
migrate(raw: unknown): Save   // v1→v2→…→当前；不可识别时 defaultSave() + 保留旧档为
                              // "linghuashi.save.bak"（不静默销毁玩家数据）
// 存档字段任何增删改 ⇒ version+1 + 迁移函数 + 往返单测，三件套缺一不可。
```

### 5.2 路由 `ui/router.js`（[v2 新增]）+ 屏幕模块契约

```ts
interface ScreenModule {
  id: ScreenId;                          // "splash"|"class"|"hub"|"battle"|"result"|"gallery"
  guard?(ctx): ScreenId | null;          // 返回重定向目标或 null 放行（守卫表见 ARCHITECTURE §4.1）
  mount(ctx: { root: HTMLElement; store: Store; navigate: Navigate;
               params?: Record<string, unknown> }): () => void;   // 返回 unmount
}
createRouter(screens: ScreenModule[], deps: { root; store }): {
  navigate(to: ScreenId, params?): void;   // 防重入：转移中排队
  current(): ScreenId;
}
// 路由器义务：guard → 旧屏 unmount()（捕获异常也必须继续）→ root 清空 → 新屏 mount
//            → session.screen 更新（不入持久化 save）。
// 屏幕义务：mount 内创建的 interval/rAF/监听/painter/session 全部在返回的 unmount 中释放；
//          unmount 幂等。违约判定：battle↔hub 往返 10 次后活跃句柄增长 >0（契约测试）。
```

### 5.3 事件总线 `core/events.js` [v1 现状签名保留，v2 启用]

```ts
createBus(): { on(type, fn): () => void; emit(type, payload): void }
// [v2] 频道注册表（新增频道须登记于此）：
//   "battle:event"   BattleEvent        combat.session → ui/audio
//   "save:changed"   { save }           store → 持久化节流器
//   "screen:changed" { from, to }       router → 埋点/音乐
```

## 6. audio `audio/sfx.js`

```ts
playStroke(type: StrokeType, mute: boolean): void
// WebAudio 合成；autoplay 拒绝时静默吞异常。
// [v2] 追加 playEvent(e: BattleEvent, settings)，订阅 "battle:event"；
//      AudioContext 懒建单例，首次用户手势后 resume。
```

## 7. 不变量清单（→ `tests/contract.test.js`）

1. **结算恰好一次**：同一场 battle 的 `finished` 事件只发一次；`settleBattle` 对同一 `(stageId,result)` 由路由只调一次；胜利后停留 result 屏 3s，save.xp 不再变化（现状必挂，即 D2 的回归锚）。
2. **finished 幂等**：`finished` 非空后任意次 `cast`/`tick` 不改变 state（深比较）。
3. **可回放**：相同 `{player,enemy,seed}` + 相同操作序列 ⇒ `getState()` 深相等。
4. **资源零泄漏**：`mount → unmount` 往返 N 次，activeIntervals=0、canvas/window 监听数不随 N 增长、`dispose()` 后 onEvent 不再触发。
5. **识别确定性**：`classifyStroke` 同输入同输出；缩放整条笔迹 ×k（k∈[0.5,2]）后 type 不变（v2 归一化后生效）。
6. **存档往返**：`migrate(JSON.parse(JSON.stringify(save)))` 深相等；旧版本档迁移后 realmId/gallery/talents 不丢。
7. **数值边界**：`shred ≤ 0.35`；`hp ∈ [0,maxHp]`；`qi ∈ [0,maxQi]`；log ≤ 24；gallery ≤ 24；挂机 ≤ 480 分钟。
8. **天赋生效**（v2）：`deriveModifiers` 下满级 atk 树对同 seed 同笔迹的伤害 > 无天赋伤害；点一级天赋后 qiPills 恰减对应成本。
9. **守卫**：无 classId 深链 hub ⇒ 落 class；无 lastResult 深链 result ⇒ 落 hub。
10. **性能红线**：bench 中 classifyStroke p95 ≤ 4ms（已有 exit 2 红线）、tick+cast ≤ 0.5ms（v2 新增）。

## 8. 版本与弃用

- 本契约为 v1（现状）+ v2（Round 2 目标）双栏；Round 2 落地后删除 [v1 现状] 中被替代的条目并将本文件版本置 v2。
- 破坏性变更（签名/字段删除）必须：先在此文件标注 `@deprecated` 与替代 API，同轮更新全部调用方与测试，禁止留双轨。
- 契约与实现漂移视同 bug（本轮已修正一处：`createBattle` 参数形态）。发现漂移先改文档所有权方确认，再改码。
