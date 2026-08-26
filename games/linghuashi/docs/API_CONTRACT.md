# 模块契约（Round 2 复审版）

> 复审基线：分支 `cursor/linghuashi-sota-a345`，commit `565e333` + 复审时点的未提交工作树
> （工作树仍在并行演进，新增 `progression/settle.js`、`audio/bus.js`、`ui/audio-bridge.js`、
> `tests/contract.test.js`、`tests/gallery.test.js`、`tests/audio.test.js` 等尚未提交）。
> 复审终点 `vitest run` 为 9 文件 62 用例全绿（复审期间树持续演进，计数以终点为准）。
>
> 记法：
> - **[现状]**：已逐一对照源码核实的真实签名与行为，类型用 TS 记法，实现仍是 JS + JSDoc。
> - **[待接线]**：模块已在树中、有测试，但生产代码零调用方。
> - **[漂移]**：契约/文档/兄弟模块之间互相矛盾之处，汇总见 §9（本轮核心交付）。
> - 破坏性变更规则见 §10。

## 0. 共享类型

```ts
type StrokeType = "line" | "curve" | "circle" | "zigzag" | "spiral" | "cloud" | "scribble";
type ElementId  = "metal" | "wood" | "water" | "fire" | "earth" | "thunder";
type ClassId    = "jian" | "ti" | "fa" | "dao" | "yao" | "qi" | "mo";
type TalentTree = "atk" | "def" | "sup";

interface Point { x: number; y: number; t?: number /* ms，performance.now 时基 */ }

// classifyStroke 的返回值（[现状]，全部字段必有）
interface Stroke {
  type: StrokeType;
  precision: number;   // [0.12,1]；scribble 时 [0.1,0.4]；短/小笔迹固定 0.15
  pressure: number;    // [0.15,1]，由中位速度反推；无时间戳时 0.95
  length: number;      // 原始折线长度 px
  bounds: { minX; minY; maxX; maxY; w; h };
  raw: Point[];        // sanitize 后的原始点（画阁 raw 回放的数据源）
  scores: Partial<Record<StrokeType, number>>;  // 六型得分；早退路径为 {} 或 {line:1}
}

// 画阁条目（[现状]，store.sanitizeGalleryEntry 的输出）
interface GalleryEntry {
  type: string;
  precision: number;        // 夹到 [0,1]
  at: number;               // Date.now()
  points?: {x,y}[];         // 归一化 [0,1]²，≤32 点；旧档可缺省 → 画阁用标准字形占位
}
```

## 1. data（叶子层，只读表）

```ts
// data/classes.js
CLASSES: { id: ClassId; name; motto; bonus: Partial<Record<StrokeType, number>>;
           element: ElementId; role; hidden?: boolean; unlock?: string }[]   // 7 职业，加权预算 0.31~0.35（见表内注释）
COUNTER: Record<ClassId, ClassId>   // 七职业闭环 剑→妖→气→法→体→道→墨→剑；克 ×1.18 / 被克 ×0.88
classById(id): Class | null

// data/realms.js
REALMS: { id; name; xp /* 末级 Infinity */; idlePerMin; hp; atk; qi }[]      // 9 境界
realmById(id): Realm    // 未知 id 回退 REALMS[0]
nextRealm(id): Realm    // 末级返回自身

// data/stages.js — 13 关；tier 仅供 UI 提示，战斗代码不读
STAGES: { id; name; enemyId; tier; reward: { xp; qiPills } }[]

// data/enemies.js — 14 敌；hp/atk 锚点见表内注释
ENEMIES: { id; name; classId: ClassId; hp; atk; element: ElementId; lore }[]

// data/talismans.js — scribble 已重定价为 qi=9（防「刷余墨最优」）
TALISMANS: Record<StrokeType, { id; name; qi: number; tags: string[] }>

// data/beasts.js — 6 灵兽；同被动 value 全表一致（crit 0.08 / qiRegen 2 / shield 12）
BEASTS: { id; name; passive: "crit"|"qiRegen"|"shield"; value: number; lore }[]
```

约束：data 层无函数副作用、无上层 import（现状合规）。旧版 D10 的 `COUNTER` 断环问题已修复。
**[漂移 →§9-7]** `progression/beasts.js` 期望 data 层提供 `CATCH_COST`、`PASSIVE_BASE`、`PASSIVES`，
data 层均未导出：`CATCH_COST` 有代码兜底（6 包子/8 丹），后两者直接是未定义标识符。

## 2. drawing

### 2.1 识别 `drawing/recognizer.js` [现状]

```ts
classifyStroke(rawPoints: Point[]): Stroke
// 纯函数、同步、确定性。管线：sanitize → extractFeatures（features.js）→
//   直线早退（perpRatio≤0.038 且 straightness≥0.965，或 stray≤4px）→
//   六型打分 × coherence（自交/转角离散度门控）→ 最高分 <0.46 降级 scribble。
// 阈值：<6 点或 length<28px ⇒ scribble(precision 0.15)。仍为绝对像素（[漂移 →§9-14]）。

createStrokeRecognizer(): {
  consume(p: Point | Point[]): void;   // 已实装：增量缓冲（旧契约标注的"空壳违约"已修复）
  reset(): void;                       // pointercancel/新笔起手时清缓冲
  peek(): Point[];
  finalize(points?: Point[]): Stroke;  // 传参优先；不传用 consume 缓冲；调用后清缓冲
}

// 再导出：synthesizeStroke, SYNTH_TYPES（见 §2.5）
TYPES: StrokeType[]
```

### 2.2 特征 `drawing/features.js` / 几何 `drawing/geometry.js` [现状]

```ts
extractFeatures(rawPoints: Point[]): Features
// 三分辨率描述子（shape 96 点低通 / dense 全细节 / raw 原始）；
// 关键字段：straightness、perpRatio、bend*、circleSweep、radialErr、lobes、
// sweepTurns、cornerCount/cornerAngle/alternation、crossings、rhythm、waviness…
// geometry.js 导出 resample/simplify/cornersOf/fitCircle/lineFit/whiten/trimHooks 等纯几何函数。
```

约束：识别域无 DOM、无 Math.random、无 Date.now（时间只来自入参 t）。

### 2.3 墨刷 `drawing/ink.js` [现状 — 签名较旧契约扩展]

```ts
createInkBrush(ctx, brushOptions?: { color?; width?; pressure?; alpha?; seed?; … }): {
  begin(options?): void;      // 增量三段式：起笔（bristle 布局、seed 定相位）
  extend(point: Point): void; //   逐点出墨（提按宽度、飞白干笔）
  end(): void;                //   收笔（尾端收锋）
  stroke(points, options?): void;        // 一次性整笔（回放/预览用）
  bloom(x, y, color?, radius?, options?): void;  // 落款墨晕，multiply 合成
}
// 全部随机性来自 seed 哈希，无 Math.random；同 seed 同输入 ⇒ 同像素。
```

### 2.4 画布适配器 `drawing/canvas.js`（DOM 边界件）[现状]

```ts
mountPainter(canvas, opts?: { onStroke?(s: Stroke): void; ink?: string; fadeMs?: number }): {
  resize(): void;   // 重量 DPR(≤2)、重烤纸纹（纸纹离屏烤一次，seeded hash，不随笔迹重绘）
  clear(): void;
  preview(points, options?): Stroke | null;  // 无指针回放一笔（教程/测试用）
  destroy(): void;  // 已全量解绑：pointer×5 + touch×3 + window.resize（旧 D4 已修）
}
// 事件栈：pointerdown/move/up/cancel/leave + touchstart/move/end 双注册；
//   pointercancel 现按"收笔"处理（会 finalize 并回调 onStroke），不是丢弃（[漂移 →§9-13]）。
// getCoalescedEvents 采样；触控笔真实压感透传（mouse 的 0.5/0 视为无压感）。
```

### 2.5 标准轨迹 `drawing/synth.js` [现状] 与 `drawing/templates.js` [漂移]

```ts
// synth.js — 生产路径（键盘施法、符键条/教程字形、scribble 误报探针共用）
synthesizeStroke(type, options?: { cx; cy; size; rotation; count; dt; noise; wobble; seed;
  teeth; turns; lobes; sweep; bulge; gap; decay; amplitude }): Point[]
SYNTH_TYPES: StrokeType[]      // 含 scribble
mulberry32(a): () => number

// templates.js — 仅测试引用（tests/templates|gallery.test.js），生产零调用方
templatePoints(type, { w=480, h=320 }): Point[]
TEMPLATE_TYPES: StrokeType[]   // 不含 scribble
// [漂移 →§9-6] 两套"理想轨迹"并存，须收敛为一套或声明分工。
```

### 2.6 画阁回放 `drawing/replay.js` [现状 — 已接线]

```ts
normalizeForStorage(points: Point[], n = 32): {x,y}[]  // 降采样并归一化 [0,1]²，保长宽比，3 位小数
toUnitTrace(points): {x,y}[]     // 收进单位空间但点数不变；包围盒已在 [0,1]² 内则原样透传
fitToCanvas(norm, w, h, pad = 0.14): Point[]           // 铺回目标画幅保长宽比，t 缺省按 24ms/点合成
replayOnCanvas(canvas, trace, { reducedMotion?, color?, durationMs = 620, pressure = 0.6, seed = 7 })
  : () => void   // 返回 stop()；trace 收存档单位点位或原始像素点位皆可
// 回放走墨刷增量三段式（一次 begin、逐点 extend、一次 end——分段 stroke 会把飞白行程清零）；
// reducedMotion / 无 rAF 时整笔即出；DPR≤2，CSS 尺寸量不到时用 WeakMap 记忆防位图反复翻倍。
// 接线：screen-battle 写入（normalizeForStorage → pushGallery），
//       screen-gallery 逐笔重放（replayOnCanvas，stop 会收笔防半截墨）。
// Round 1 遗留"画阁无 raw 回放"已消除；回放确定性由 tests/gallery.test.js 锁定
// （存档往返后 classifyStroke 仍判回本型）。
```

## 3. combat

### 3.1 元素 `combat/elements.js` [现状]

```ts
ELEMENTS: ElementId[]
reaction(src, dst): { id: "evaporate"|"vine"|"conduct"|"suppress"|"resist"|"none";
                      label: string; damage: number; control?: number; crit?: number }
// vine 追加 control 400ms；conduct 的 crit:0.15 仍无消费方（[漂移 →§9-9]）。
```

### 3.2 战斗工厂 `combat/battle.js` [现状]

```ts
interface ActorSpec { id; name; classId?; element?; realmId?; hp?; atk?; qi? }  // 缺省查 realm 表
interface Actor { id; name; classId; element; maxHp; hp; maxQi; qi; atk;
                  shield; controlMs; shred /* ≤SHRED_CAP */; cooldownMs; intent }

// ===== modifiers 契约（本轮重点核对） =====
DEFAULT_MODIFIERS = {
  atkMult: 1,        // 天赋 atk 树 → 符咒伤害倍率
  defMult: 1,        // 天赋 def 树 → circle 护盾量倍率
  supMult: 1,        // 天赋 sup 树 → cloud 治疗量 与 curve 束缚时长倍率
  incomingMult: 1,   // 敌方对玩家伤害倍率（减伤 <1）
  crit: 0,           // 暴击率 [0,1]；为 0 时不掷骰（保证默认配置 rng 序列不变）
  critMult: 1.6,     // 暴击伤害倍率（≥1）
  qiRegen: 0,        // 每秒额外回气（叠加在基础 QI_REGEN_PER_MS=0.008/ms 之上）
  shield: 0,         // 每次护盾符的固定额外护盾
  comboWindowMs: 1200, comboStep: 0.06, comboMax: 5,   // 连击
  enemyIntervalMs: ENEMY_ATTACK_INTERVAL_MS,           // 1800
}

normalizeModifiers(input?): Modifiers
// 白名单合并：只认 DEFAULT_MODIFIERS 里的扁平键 + 两个嵌套糖：
//   input.talent.{atk,def,sup}  → atkMult/defMult/supMult   （直接吃 talentMult(save, tree)）
//   input.beast.{crit,qiRegen,shield} → crit/qiRegen/shield （直接吃 beastBonus(save)）
// 扁平键优先于嵌套；非有限数字一律忽略；出参逐项夹取（crit∈[0,1]、critMult≥1…）。
// ⚠ 未知键静默丢弃 —— 这是 §9-1/§9-2 两个死聚合器"传了也白传"的根源。

createBattle(cfg: { player: ActorSpec; enemy: ActorSpec;
                    seed?: number /* 默认 1，mulberry32 */;
                    modifiers?: object /* 过 normalizeModifiers */ }): {
  cast(stroke: Pick<Stroke,"type"|"precision"|"pressure">, elementHint?: ElementId)
    : { events: BattleEvent[]; state: BattleState };
  tick(dtMs: number): BattleState;
  getState(): BattleState;        // 返回内部可变引用；测试可直改，UI 必须只读（约定，未冻结）
  getModifiers(): Modifiers;      // 归一化后的副本
  intent(): "bound" | "strike" | "watch";
}

interface BattleState {
  player: Actor; enemy: Actor;
  log: { t; msg; kind }[];        // ≤24 条，新在前；仍是 UI 文案的主输出
  finished: null | "win" | "lose";
  t: number;                      // 逻辑累计 ms；finished 后 tick/cast 均为 no-op（t 不再推进）
  rng; modifiers; combo; comboMult; lastCastAt;
}

// events：目前每次成功施法恰好 1 条
type BattleEvent = { type: "cast"; talisman; stroke; damage: number; combo: number;
                     comboMult: number; crit: boolean };
// 灵气不足 ⇒ events 为空数组（UI 以 events.length 判定"是否真正成符"，决定画阁留痕）。
// 旧契约 §3.4 的全量结构化事件流（damage/shield/heal/control/finished…）未实现（[漂移 →§9-10]）。
```

数值管线（cast，按序乘算）：
`atk × (0.65+prec×1.15) × (1+职业bonus) × (0.85+press×0.3) × atkMult × reaction.damage
 × 克制(1.18/0.88) × (1+敌方shred) × comboMult × (crit? critMult)`；
分支：circle 盾 `(18+prec×42×(1+bonus))×defMult+shield`；cloud 疗 `(16+prec×36×(1+bonus))×supMult`；
curve 控 `(700+prec×900+react.control)×supMult` 且伤害 ×0.55；zigzag 伤害 ×1.15 且
`shred += 0.04 + prec×0.12（上限 0.35）`——破甲已精度敏感（Round 1 遗留已修）；spiral ×1.25。

敌方节拍（tick）：**冷却累计制**，非相位判定——`cooldownMs -= 可行动时间`，
被控期间冷却冻结；单 tick 追击上限 `MAX_CATCHUP_STRIKES=64`（后台标签一次性大 dt 不会秒杀）。
连击：距上次成功施法 ≤comboWindowMs 叠层（≤comboMax），tick 超窗清零。

### 3.3 AI `combat/ai.js` [现状 — 已接入]

```ts
ENEMY_ATTACK_INTERVAL_MS = 1800; ENEMY_TELEGRAPH_MS = 400;
enemyIntent(t, controlMs = 0, opts?: { cooldownMs?; intervalMs?; telegraphMs? })
  : "bound" | "strike" | "watch"
// battle 内部每次 cast/tick 后按真实 cooldownMs 同步到 state.enemy.intent；
// 只传 (t, controlMs) 时退回旧相位估算（兼容层，UI 兜底用）。
// 战斗屏据 intent 渲染"被缚/蓄势/观势"预警。
```

### 3.4 `combat/mods.js#computeMods` **[漂移 →§9-1，禁用]**

```ts
computeMods(save): { dmgMult; shieldMult; healMult; controlMult; critChance;
                     dodgeChance; qiRegenPerSec; openingShield }
// 生产零调用方，且所有键都不在 normalizeModifiers 白名单内：
// 传入 createBattle({ modifiers: computeMods(save) }) 会被整体静默忽略。
// dodgeChance / openingShield 在 battle 中也无消费点。禁止新代码引用；处置见 §9-1。
```

### 3.5 `combat/index.js` barrel

`createBattle, createActor, DEFAULT_MODIFIERS, normalizeModifiers, QI_REGEN_PER_MS,
reaction, ELEMENTS, enemyIntent, ENEMY_ATTACK_INTERVAL_MS, ENEMY_TELEGRAPH_MS`。

## 4. progression / classes

### 4.1 挂机 `progression/idle.js` [现状]

```ts
IDLE_CAP_MIN = 480; IDLE_MIN_CLAIM_MIN = 0.05; IDLE_BUNS_PER_MIN = 0.6;
idlePreview(save, nowMs = Date.now()): { minutes; pills; buns; claimed }
tickIdle(save, nowMs = Date.now()): Save
// 纯函数、幂等：同 nowMs 重复调用只发一次（第二次 idleClaimed=false、claim 全 0）；
// 未达最小结算时不推进 idleUntil（零头继续累积）；产出：灵气丹按境界 idlePerMin，
// 包子按 IDLE_BUNS_PER_MIN（包子是挂机专属产物）。
// 写入：qiPills/buns/idleUntil/lastSeenAt + 会话字段 idleClaim{minutes,pills,buns}/idleClaimed。
```

### 4.2 境界 `progression/realm.js` [现状]

```ts
breakthrough(save): Save   // xp 不足/已飞升只写 notice；成功则 realmId 晋级、xp 扣减
```

### 4.3 灵兽 `progression/beasts.js` [现状 + 缺陷]

```ts
BEAST_CAP = 3; MAX_STAR = 3; STAR_MULT = [0, 1, 1.65, 2.6];
EVOLVE_COST = 30; REROLL_COST = 18;
CATCH_COST: { buns: 6, qiPills: 8 }        // data 未定价时的代码兜底（应上移 data，§9-7）
catchPayment(save): { currency; amount; label } | null   // 包子优先，其次灵气丹
catchBeast(save, rng = Math.random, nowMs = Date.now()): Save
// 纯变换：栏满/付不起只写 notice；成功扣资源、入栏一星兽。
// buns 至此有了消费出口（Round 1 遗留已修）。
// ⚠ hub 调用未注入 rng/nowMs，生产路径非种子化（[漂移 →§9-8]）。
beastBonus(save): { crit; qiRegen; shield }   // 按 beasts[].value 累加；已接入战斗（经 §5.4 嵌套糖）
beastValue(passive, star): number             // ⚠ 引用未定义 PASSIVE_BASE ⇒ ReferenceError
evolveBeast(save, uidA, uidB): Save           // ⚠ 经 beastValue 必炸；生产零调用方
rerollPassive(save, uid, rng?): Save          // ⚠ 引用未定义 PASSIVES ⇒ 必炸；生产零调用方
// 三者详见 [漂移 →§9-7]。beastBonus 仅在 b.value 非有限数时才触雷（现图鉴全有 value）。
```

### 4.4 天赋 `classes/talents.js` [现状]

```ts
TALENTS: { id; name; tree: TalentTree; per }[]   // 9 天赋，3 树各 3
talentMult(save, tree): number    // 1 + Σ level×per；已接入战斗（screen-battle → talent 嵌套糖）
applyTalent(save, id): Save
// 上限 5 级、花 12 丹；不足/满级原样返回同一引用（无 notice —— UI 靠引用比较自行播报，
// 成本 12 同时硬编码于此处与 screen-hub 的 TALENT_COST，[漂移 →§9-12]）。
battleModifiers(save): { atk; shield; heal; control; crit; qiRegen; shieldFlat }
// [漂移 →§9-2，禁用] 第三套聚合形态，生产零调用方，键名同样不被 normalizeModifiers 认识。
```

### 4.5 解锁 `classes/unlock.js` [现状 — unlockMo 唯一权威]

```ts
MO_STROKE_TYPES = ["line","curve","circle","zigzag","spiral","cloud"]; MO_REQUIRED_TYPES = 6;
galleryTypes(save): string[]           // 画阁去重笔法（剔 scribble），六式序在前
hasSixForms(gallery): boolean          // 六式判定唯一实现：不同笔法数 ≥6，条目也可为纯字符串
moProgress(save): { types; have; need; missing; unlocked }
unlockMo(save): Save
// 纯函数、幂等：已解锁或未集齐 ⇒ 原样返回同一引用；
// 集齐 ⇒ { ...save, inkUnlocked: true, notice: "画阁六式圆满…" }。
// 调用方：screen-battle.finish（引用比较后另置 inkJustUnlocked）、settle.js、
//         hub/class/gallery 的进度展示。旧 D7（length>=6 误判）已根除。
isClassUnlocked(save, classId): boolean
unlockedClasses(save): Class[]         // 隐藏职业（墨客）仅解锁后可见
```

### 4.6 `progression/unlock.js` [现状 — 兼容 shim]

```ts
export { hasSixForms, moProgress, unlockMo } from "../classes/unlock.js";
INK_TYPES = MO_STROKE_TYPES; INK_MASTERY_THRESHOLD = 0.6;
masteredTypes(strokeStats?, threshold?): string[]   // 仅展示用途，生产零调用方
checkInkUnlock(save): boolean                       // 等价 moProgress(save).unlocked
recordStroke(save, stroke): Save                    // 写 save.strokeStats，生产零调用方（§9-11）
```

### 4.7 结算 `progression/settle.js` **[待接线 →§9-3]**

```ts
resolveStage(stage: string | Stage): Stage | null
battleReward(stage, result): { xp; qiPills } | null   // 败北/未知关卡 null
beginBattle(save, stage, battleId?): Save
// 开战登记：battleSeq 自增、battleId = "<stageId>#<seq>"、清空 settledBattleId/lastResult 等。
// 不读 Date.now / Math.random。
settleBattle(save, { result, stage?, battleId? }): Save
// 恰好一次：同 battleId（显式或 save.battleId）已结算 ⇒ 原样返回；
// 胜发 xp/qiPills/clearedStages，败只记会话字段；末尾统一走一次 unlockMo，
// 解锁时追加 inkJustUnlocked。⚠ 目前生产零调用方 —— screen-battle.finish 仍内联同一套逻辑。
```

## 5. core

### 5.1 store `core/store.js` [现状]

```ts
SAVE_KEY = "linghuashi.save.v1";
GALLERY_LIMIT = 24; GALLERY_POINTS = 32;
TRANSIENT_KEYS（模块私有）= ["idleClaim","idleClaimed","idleNoticeShown","notice","inkJustUnlocked"];

defaultSave(): Save
// { version:1, playerName, classId:null, realmId, xp, qiPills, buns, talents:{}, beasts:[],
//   gallery:[], clearedStages:[], lastSeenAt, idleUntil, settings:{mute,reducedMotion},
//   tutorialDone, inkUnlocked }
// ⚠ 运行时另有 screen/stageId/lastResult/lastStage/lastReward 等字段被 set 进来并随
//   persist 落盘（不在 TRANSIENT_KEYS 内），存档 shape 不封闭（[漂移 →§9-4]）。

createStore(initial = defaultSave()): {
  get(): State;
  set(patch: Partial<State> | ((state: State) => Partial<State> | null)): State;
  // ★ 本轮契约更新：patch 支持函数形式 —— 收到最新 state、返回 patch（返回 null/undefined
  //   则不变更）。用于异步回调里基于最新状态更新（战斗 finish、画阁追加均已用此形式）。
  //   合并语义不变：顶层浅合并；嵌套对象（settings/talents/idleClaim）必须整体替换。
  subscribe(fn: (state) => void): () => void;   // 已有真实订阅方：ui/audio-bridge
  persist(): void;    // 剔除 TRANSIENT_KEYS 后整体序列化；quota 异常吞掉
  hydrate(): State;
  // version !== 1 或 JSON 损坏 ⇒ 保持当前内存 state（不抛错、不主动清盘；
  //   但下一次 persist 会覆盖旧盘数据 —— 仍无 migrate 链与备份，[漂移 →§9-5]）。
  // version === 1 ⇒ defaultSave 打底深度补默认：settings/talents 合并，
  //   beasts/clearedStages 校验为数组，gallery 走 sanitizeGallery。
}

// 画阁工具（纯函数，gallery.test.js 全覆盖）
sanitizeGalleryEntry(entry): GalleryEntry | null   // 夹 precision/at，points 夹 [0,1]²、≤32 点、<2 点丢弃
sanitizeGallery(list): GalleryEntry[]              // 逐条清洗后裁到 GALLERY_LIMIT
pushGallery(list, entry, limit = GALLERY_LIMIT): GalleryEntry[]  // 追加+裁尾，不改入参
// 体积预算：满 24 笔 × 32 点存档 <64KB（有测试锁定）。
```

### 5.2 引导 `core/engine.js` [现状]

```ts
boot(root: HTMLElement, store): { navigate(screen): void; destroy(): void }
// 序列：hydrate → entryScreen（battle 深链降级 hub、未知屏降级 splash）→
//        bindAudioSettings(store)（读档即同步静音）→ renderApp。
// navigate = set({screen}) + persist + renderApp（无守卫表；result 深链仍会渲染，
//   但 lastResult 落盘后语义为"上一场结果"，非旧版假"败"）。
// destroy 解绑 beforeunload/pagehide/visibilitychange、解绑音频、卸载屏幕、末次 persist。
```

### 5.3 事件总线 `core/events.js` **[死代码 →§9-15]**

```ts
createBus(): { on(type, fn): () => void; emit(type, payload): void }   // 零调用方
```

### 5.4 固定步长时钟 `core/loop.js` **[待接线 →§9-16]**

```ts
createTicker(stepMs = 200, maxCatchUpMs = 1000): { advance(nowMs): number; reset(): void }
// 累加器折算整数 tick；负 dt 归零、超长 dt 钳到 maxCatchUpMs。tests/loop.test.js 覆盖。
startLoop({ stepMs = 200, onTick(stepMs), onFrame? }): () => void   // rAF 驱动，退化 setInterval
// ⚠ 生产零调用方：screen-battle 直接用 window.setInterval(200ms) 驱动 battle.tick。
//   伤害有限（battle 内部冷却累计已抗 dt 抖动），但违反"单时钟"原则且后台被钳到 ≥1s。
```

## 6. audio 与 UI 接线

### 6.1 总线 `audio/bus.js` [现状]

```ts
withBus(fn: (ctx: AudioContext, out: GainNode) => void): boolean
// AudioContext 懒建单例（静音时连建都不建）；首个用户手势 resume 后自动解绑手势监听；
// 建失败转 unavailable 静默。所有音源接 master 增益，静音=总线归零（含已排程尾音）。
isMuted(): boolean; setMuted(next): boolean; toggleMuted(): boolean;
resumeAudio(): void; closeAudio(): void   // 卸载释放；再次 withBus 重建
```

### 6.2 音效 `audio/sfx.js` / barrel `audio/index.js` [现状]

```ts
playStroke(type: StrokeType, mute?: boolean): void  // mute 为旧调用兼容位；缺省交总线判断
playCue(name: "win" | "lose" | "unlock"): void      // result 屏胜/负/解锁提示音
// index.js 再导出 sfx 与 bus 全部公开 API。
```

### 6.3 桥 `ui/audio-bridge.js` [现状]

```ts
bindAudioSettings(store): () => void
// settings.mute → setMuted 的唯一单向推送（audio 层不认识 store）；
// 返回的解绑函数同时 closeAudio。boot 中读档后立即接线。
```

### 6.4 UI 层契约 [现状]

```ts
// ui/screens.js — 屏幕注册表 + 生命周期宿主
SCREENS: string[]   // splash | class | hub | battle | result | gallery
renderApp(root, store, navigate): void
// 义务：先跑上一屏 disposer（WeakMap<root, dispose>，异常吞并续行）→ 清空 root →
//   view.render({root, store, navigate, screen}) → 若返回函数则登记为新 disposer →
//   focusScreen + document.title + aria 播报。
destroyApp(root): void
// 屏幕模块契约：render(ctx) => (() => void) | null；mount 期间创建的 interval/rAF/
//   keydown/painter 回调/教程弹层必须全部在返回的 dispose 中释放（battle/gallery 已遵守）。

// ui/painter-host.js — 画布单例宿主（刻意不 destroy，跨战斗复用同一 canvas）
acquirePainter({ onStroke?, label? }): { canvas; painter; onStroke }
releasePainter(): void          // 只解回调；painter.destroy 从不调用（单例设计）
canvasBox(): { width; height }
previewStroke(points, opts?): void   // 键盘施法回显：描线 + 420ms 淡出，尊重 reduced-motion
refreshPainter(): void               // canvas 入文档后按真实尺寸重初始化

// ui/keycast.js — 键盘/点击施法（第二输入通路）
STROKE_KEYS: { key: "1".."6"; type; name; effect; talisman; qi }[]
strokeKeyByKey(key) / strokeKeyByType(type)
strokePoints(type, { width, height, fill }): Point[]   // synthesizeStroke 包装，教程字形共用
keyboardStroke(type, box): Stroke & { source: "keyboard"; matched: boolean } | null
// 走真实 classifyStroke 核形；precision 固定 0.7（判型不符 ×0.8），pressure 固定 0.6。

// ui/tutorial.js
shouldShowTutorial(save): boolean          // !tutorialDone
openTutorial({ mount, store, onClose?, markDone = true }): () => void
// 模态 + 焦点陷阱 + Esc；弹层期间战斗时钟不启动。
```

## 7. 不变量清单 → 测试映射

| # | 不变量 | 现状 |
| --- | --- | --- |
| 1 | finished 后 `tick/cast` 幂等（t 不推进、end 日志恰一条） | ✅ `contract.test.js` |
| 2 | unlockMo 六式=不同笔法数（连画 6 直线不解锁）、已解锁幂等 | ✅ `contract.test.js` |
| 3 | tickIdle 同时刻幂等、480 分钟封顶 | ✅ `contract.test.js` + `progression.test.js` |
| 4 | 画阁：raw 往返判型不变、上限 24、坏档清洗、存档 <64KB | ✅ `gallery.test.js` |
| 4b | 音频：总线静音/懒建/手势 resume 行为 | ✅ `audio.test.js`（复审终点新增） |
| 5 | 灵气不足 ⇒ events 空、状态不变 | ✅ `combat.test.js` |
| 6 | 护盾先于 hp 吸收；敌方 1800ms 节拍跨 tick 稳定 | ✅ `combat.test.js` |
| 7 | hydrate 坏 JSON / 版本不符不炸档（内存态） | ✅ `store.test.js` |
| 8 | 识别确定性：轴对齐直线、噪声圆、微小笔迹 scribble | ✅ `stroke.test.js`；缩放不变性未测 |
| 9 | 固定步长 ticker 折算/钳制 | ✅ `loop.test.js` |
| 10 | **结算恰好一次跨屏**（settledBattleId 语义） | ❌ 未测（settle.js 未接线，UI 只有 `settled` 局部标志） |
| 11 | **天赋/灵兽实际改变伤害**（同 seed 同笔迹对照） | ❌ 未测（normalizeModifiers/连击/暴击分支均无用例） |
| 12 | 资源零泄漏（battle↔hub 往返 N 次监听/句柄不增长） | ❌ 未测 |
| 13 | 性能红线 | `npm run bench`：classifyStroke p95 ≤4ms exit 2 红线 + 识别准确率统计；`npm run probe` 冒烟 + scribble 误报探针（硬误报 line/circle/spiral ≤5%）。tick+cast ≤0.5ms 未入 bench |

## 8. 存档字段登记（version 1）

持久化 = `defaultSave()` 全字段 + 运行时追加且不在 TRANSIENT_KEYS 的字段。
当前实际会落盘的运行时字段：`screen`、`stageId`、`lastResult`、`lastStage`、`lastReward`；
若 settle.js 接线还将追加 `battleSeq/battleId/settledBattleId`；`strokeStats`（recordStroke，当前无人写）。
**规则**：任何字段增删改 ⇒ version+1 + 迁移函数 + 往返单测三件套——当前三件套均缺（§9-5），
在 migrate 链落地前**禁止**改 version 或删字段。

## 9. 漂移清单（契约 vs 实现，本轮定案）

按危害排序；"处置"为本契约的裁定，负责人沿用 OWNERSHIP 表。

| # | 漂移 | 事实 | 处置 |
| --- | --- | --- | --- |
| 1 | `combat/mods.js#computeMods` 形态与 `normalizeModifiers` 白名单完全不交（dmgMult≠atkMult…），传入即被静默整体忽略；dodge/openingShield 无消费点 | 零调用方 | **删除模块**，或改写为返回 battle 认识的键并补对照单测；禁止新引用 |
| 2 | `classes/talents.js#battleModifiers` 第三套聚合形态（atk/shield/heal/control…），同样不被 battle 认识；`ACCEPTANCE.md` §5 还在教 UI 传它 | 零调用方 | 删除或改造同 #1；同步更正 ACCEPTANCE/GDD 引用。**权威接口 = `normalizeModifiers` 扁平键 + talent/beast 嵌套糖**（screen-battle.modifiersFor 即范式） |
| 3 | `progression/settle.js`（beginBattle/settleBattle 恰好一次）已实现未接线；screen-battle.finish 内联同一套发奖+unlockMo，恰好一次只靠 UI 局部 `settled` 标志 | 零调用方 | screen-battle 迁移到 beginBattle/settleBattle，删内联结算；补 §7-10 契约测试 |
| 4 | 会话字段（screen/stageId/lastResult/lastStage/lastReward）仍随 persist 落盘；TRANSIENT_KEYS 只剔 5 个提示类字段；save/session 分层未做 | 现行行为 | 短期：新增会话字段必须登记 TRANSIENT_KEYS 或 §8；长期：save/session 分层 |
| 5 | 无 migrate 链：version≠1 时内存态安全，但下次 persist 直接覆盖旧盘数据（无 .bak） | 现行行为 | 引入 `migrate(raw): Save` + 覆盖前备份 `linghuashi.save.bak`；在此之前冻结 version |
| 6 | `drawing/templates.js` 与 `drawing/synth.js` 两套理想轨迹并存：生产全走 synth（keycast/字形），templates 仅测试引用；两者形状参数各自演化 | 双源 | 二选一：templates 降级为"synth 的回归夹具"并注明，或让 keycast 改用 templates；禁止第三处再造轨迹 |
| 7 | `progression/beasts.js`：`beastValue` 引用未定义 `PASSIVE_BASE`、`rerollPassive` 引用未定义 `PASSIVES` ⇒ 一经调用 ReferenceError；`evolveBeast` 经 beastValue 必炸；`CATCH_COST` 兜底写在代码而非 data 层 | 潜伏崩溃（当前 UI 不可达；beastBonus 仅在 value 非有限时触雷） | 补上这两个常量（由 BEASTS 表推导或 data 导出）+ 单测；evolve/reroll 接 UI 前不得发布；定价上移 `data/beasts.js` |
| 8 | `catchBeast` 生产调用（hub）未注入 rng/nowMs，走 Math.random | 现行行为 | UI 注入种子 RNG（回放/测试一致性）；参数形态已支持，仅差调用方 |
| 9 | `reaction().crit`（金雷引 0.15）仍无消费方；雷→金 1.12+死 crit 实际弱于普通压制 1.2 | 死字段 | battle 消费（并入 crit 掷骰）或删字段+重定价，二选一，不许悬空（沿旧 D10 裁定） |
| 10 | 结构化 BattleEvent 流（旧契约 §3.4）未实现：events 只有单条 cast，UI 文案仍源自 state.log 字符串 | 范围缩水 | 降级为 v3 目标；本版契约以 §3.2 实际 events 为准 |
| 11 | `progression/unlock.js` 的 `recordStroke/masteredTypes` 零调用方，`strokeStats` 字段无人写；`checkInkUnlock` 与 `moProgress().unlocked` 重复 | shim 残留 | 画阁"最佳精度"展示接线后保留，否则随 shim 一并清理 |
| 12 | 天赋成本 12 双写（talents.js 与 screen-hub TALENT_COST）；applyTalent 失败不带 notice，UI 靠引用比较兜底 | 现行行为 | 成本收敛到 data 或 talents.js 单一导出；失败返回 notice |
| 13 | `pointercancel` 按收笔处理（finalize+onStroke），旧契约要求丢弃；pointer+touch 双栈并存，混合设备理论上可能双触发 | 现行行为 | 改为丢弃（recognizer.reset 已备好）；收敛 Pointer Events 单栈 + `touch-action: none` |
| 14 | 识别阈值（MIN_LENGTH 28px、NOISE_PX 4 等）仍是绝对像素，DPI/画幅相关 | 现行行为 | 归一化到画布短边（调用方经 options 传 unit）；含 §7-8 缩放不变性测试 |
| 15 | `core/events.js#createBus` 零调用方 | 死代码 | 删除，或作为 §9-10 事件流的载体保留并登记频道表 |
| 16 | `core/loop.js#startLoop` 零调用方，battle 屏用裸 setInterval(200ms)（后台钳制 ≥1s） | 待接线 | screen-battle 换 startLoop（rAF+accumulator），visibilitychange 暂停 |
| 17 | 弱种子：screen-battle `seed = stage.id.length + save.xp`（随 xp 漂移、碰撞多） | 现行行为 | beginBattle 接线时一并显式生成并存入会话，供回放 |
| 18 | `painter-host.js` 头注释仍称"mountPainter 的 destroy 不解绑 resize"——canvas.js 已全量解绑，注释过期（单例设计本身保留） | 文档腐化 | 更正注释；单例不 destroy 属刻意设计，已在 §6.4 声明 |
| 19 | `getState()` 返回内部可变引用，测试直改 hp | 现行行为 | 契约裁定：测试专用后门；UI/生产代码必须只读。v3 再议冻结或快照 |

## 10. 版本与弃用

- 本文件为 **v2（Round 2 复审版）**：只描述已核实的现状，目标态一律进 §9"处置"栏，不再维护 v1/v2 双栏。
- 破坏性变更（签名/字段删除）：先在此文件标 `@deprecated` 与替代 API，同轮改完全部调用方与测试，禁止双轨。§9-1/2 的两个死聚合器即双轨反面教材——**同一概念只许一份实现**。
- 契约与实现漂移视同 bug：发现即记入 §9，先与所有权方定案再改码。
- 复审期间工作树仍在演进；合并本轮未提交改动后，须复核 §9-3（settle 接线）与 §7 测试映射是否已变化。
