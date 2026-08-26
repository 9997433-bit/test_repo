# 模块契约（Round 3 终审版）

> 终审基线：分支 `cursor/linghuashi-sota-a345`，commit `6361f70` + 终审时点工作树
> （Round 3 收口改动——migrate 链、灵兽放生/合成/洗练 UI、轨迹单源化、`combat/mods.js` 删除、
> `reaction.crit` 消费、pointercancel 丢弃、减动效开关——均已落树，本文以逐文件核读后的终态为准）。
> 终审门禁实测：`vitest run` **14 文件 105 用例全绿**；`npm run probe` exit 0
> （乱涂 400 样本硬误报 8/400 = **2%**，红线口径已含 cloud）；`npm run bench` exit 0
> （3000 笔 0 误配、全类型 p95 ≤ 0.16ms）；`vite build` 49 模块、JS gzip ≈ 34.6KB。
>
> 记法：
> - **[现状]**：已逐一对照源码核实的真实签名与行为；类型用 TS 记法，实现仍是 JS + JSDoc。
> - **[已收口]**：Round 2 契约 §9 挂账、本轮已按处置落地的条目（正文只述终态，对照见 §9-A）。
> - **[死代码→删]**：零调用方，本契约裁定删除；细则见 §9-B。
> - **[残余]**：与目标形态仍有差距的既存行为，见 §9-B。
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
  precision: number;   // 主打分路径 [0.12,1]；直线早退 [0.6,1]；降级 scribble [0.1,0.4]；短/小笔迹固定 0.15
  pressure: number;    // [0.15,1]，由中位速度反推（拐点 0.85px/ms）；无时间戳时 0.95
  length: number;      // 原始折线长度 px
  bounds: { minX; minY; maxX; maxY; w; h };
  raw: Point[];        // sanitize 后的原始点（画阁 raw 回放的数据源）
  scores: Partial<Record<StrokeType, number>>;
  // 主路径含六型得分 + scribble（乱涂正证据 chaos）；早退路径为 {} 或 {line:1}
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

// data/enemies.js — 13 敌（旧契约误记 14，已更正）；hp/atk 锚点见表内注释
ENEMIES: { id; name; classId: ClassId; hp; atk; element: ElementId; lore }[]

// data/talismans.js — scribble 定价 qi=9（防「刷余墨最优」）
TALISMANS: Record<StrokeType, { id; name; qi: number; tags: string[] }>

// data/beasts.js — 6 灵兽；同被动 value 全表一致（crit 0.08 / qiRegen 2 / shield 12）
BEASTS: { id; name; passive: "crit"|"qiRegen"|"shield"; value: number; lore }[]
// [已收口] 灵兽养成定价上移 data 层（原 §9-7 的一部分）：
BEAST_CATCH_COST = 36            // 收兽，货币包子（≈ 挂机 60 分钟产出）
BEAST_REROLL_COST = 18           // 洗练，货币灵气丹
BEAST_EVOLVE_COST_PER_STAR = 30  // 合成 = 该值 × 当前星级，货币灵气丹
```

约束：data 层无函数副作用、无上层 import（现状合规）。
**[残余 →§9-B-9]** 收兽的灵气丹替付价（8 丹）仍是 `progression/beasts.js` 的代码兜底，
data 层缺 `BEAST_CATCH_QI_COST` 表项。

## 2. drawing

### 2.1 识别 `drawing/recognizer.js` [现状 — 本轮打分管线重写，签名不变]

```ts
classifyStroke(rawPoints: Point[]): Stroke
// 纯函数、同步、确定性。管线（终态）：
//   sanitize → extractFeatures（features.js）
//   → 短笔早退：<6 点或 length<28px ⇒ scribble(precision 0.15, scores {})
//   → 直线早退：cornerCount===0 且 turnAbsTurns<TURN_BUDGET(1.1 圈)
//       且（perpRatio≤0.038 ∧ straightness≥0.965，或 stray≤4px ∧ straightness≥0.9）
//       ⇒ line，precision = clamp(0.72+0.28·purity, 0.6, 1)，scores {line:1}
//   → 六型打分 scores，乘统一信任度 trust = coherence × (1 − 0.65·chaos)
//       coherence = fall(crossings,2,8) × fall(cornerSpread,0.55,0.95)
//       chaos = scoreScribble(f) = 0.56·aimless + 0.30·tangled + 0.14·ragged
//         （aimless = 1 − max(spineOrder, spinOrder)：既不沿脊线推进也不绕心旋转，是乱涂的正证据）
//   → best = top·trust；margin = (top−second)·trust
//     precision = clamp(best·(0.78+0.22·clamp01(margin/0.26)), 0.12, 1)
//   → best < SCRIBBLE_FLOOR(0.64) ⇒ 降级 scribble，precision = clamp(precision·0.55, 0.1, 0.4)
//   → scores.scribble = chaos（主路径必带）
// 阈值仍为绝对像素（MIN_LENGTH 28px、NOISE_PX 4px 噪声地板，[残余 →§9-B-10]）。

createStrokeRecognizer(): {
  consume(p: Point | Point[]): void;   // 增量缓冲
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
// 关键字段：straightness、perpRatio、axisMonotone、bend*（C/S 模态拟合）、bendPx、
// circleSweep、radialErr、gapCirc、lobes、sweepTurns、angularMonotone、radialMonotone、
// spinRatio、cornerCount/cornerAngle/cornerSpread/alternation、segRegularity、segMedian、
// crossings（自交计数）、rhythm、waviness、turnAbsTurns、inflections…
// geometry.js 导出 resample/simplify/cornersOf/fitCircle/lineFit/whiten/trimHooks/
//   boxSmooth/turnSeries/unwrapAngles/medianSpeed 等纯几何函数。
```

约束：识别域无 DOM、无 Math.random、无 Date.now（时间只来自入参 t）。

### 2.3 墨刷 `drawing/ink.js` [现状]

```ts
createInkBrush(ctx, brushOptions?: { color?; width?; minWidth?; pressure?; alpha?;
  speedLift?; reload?; bleed?; seed? }): {
  begin(options?): void;      // 增量三段式：起笔（bristle 布局、seed 定相位）
  extend(point: Point): void; //   逐点出墨（提按宽度、飞白干笔）
  end(): void;                //   收笔（尾端收锋）
  stroke(points, options?): void;        // 一次性整笔（回放/预览用）
  bloom(x, y, color?, radius?, options?): void;  // 落款墨晕，multiply 合成
}
// 全部随机性来自 seed 哈希，无 Math.random；同 seed 同输入 ⇒ 同像素。
```

### 2.4 画布适配器 `drawing/canvas.js`（DOM 边界件）[现状 — 本轮 cancel 语义收口]

```ts
mountPainter(canvas, opts?: { onStroke?(s: Stroke): void; ink?: string; fadeMs?: number }): {
  resize(): void;   // 重量 DPR(≤2)、重烤纸纹（离屏烤一次，seeded hash，不随笔迹重绘）
  cancel(): void;   // [已收口] 主动作废未完成的一笔（换屏时由 painter-host 调用）
  clear(): void;
  preview(points, options?): Stroke | null;  // 无指针回放一笔（教程/测试用）
  destroy(): void;  // 全量解绑：pointer×5 + touch×4 + window.resize
}
// [已收口 原§9-13] pointercancel / touchcancel 现按「丢弃」处理：不 finalize、不回调
//   onStroke、recognizer.reset()、墨迹淡出——半截点列不再被误识别成符。
//   覆盖：tests/pointer-cancel.test.js（6 用例，含「废笔不拼进下一笔」「cancel() 后可继续作画」）。
// pointerup / pointerleave / touchend 仍按收笔 finalize。
// [残余 →§9-B-10] pointer 与 touch 双栈并注册，支持 PointerEvent 的触屏 move 可能双采样。
// getCoalescedEvents 采样；触控笔真实压感透传（mouse 的 0.5/0 视为无压感）。
```

### 2.5 标准轨迹（[已收口 原§9-6]：几何单源 = `drawing/synth.js`）

```ts
// synth.js — 唯一的轨迹几何来源
synthesizeStroke(type, options?: { cx; cy; size; rotation; count; dt; noise; wobble; seed;
  teeth; turns; lobes; sweep; bulge; gap; decay; amplitude }): Point[]
SYNTH_TYPES: StrokeType[]      // 含 scribble
mulberry32(a): () => number

// templates.js — synth 的「取景层」，不自造几何：
//   把画幅 {w,h} 折算成 synthesizeStroke 的 cx/cy/size + 每型调形旋钮（FRAME 表）。
templatePoints(type, { w=480, h=320 }): Point[]
TEMPLATE_TYPES = SYNTH_TYPES 去 scribble
// 调用方：tests/templates|gallery.test.js（回归夹具：跨画幅判型、往返回放）。

// scripts/trajectories.mjs — probe/bench 的「取景层」，同样只调 synthesizeStroke：
//   按 variant 平移落笔点（±6/±5px）与采样节拍（10–14ms），产出不同取样。
generateTrajectory(type, variant = 0): Point[]
TRAJECTORY_TYPES = SYNTH_TYPES 去 scribble
```

裁定沿用：**禁止第四处再造轨迹几何**；新取景层只许包装 `synthesizeStroke`。

### 2.6 画阁回放 `drawing/replay.js` [现状]

```ts
normalizeForStorage(points: Point[], n = 32): {x,y}[]  // 降采样并归一化 [0,1]²，保长宽比，3 位小数
toUnitTrace(points): {x,y}[]     // 收进单位空间但点数不变；包围盒已在 [0,1]² 内则原样透传
fitToCanvas(norm, w, h, pad = 0.14): Point[]           // 铺回目标画幅保长宽比，t 缺省按 24ms/点合成
replayOnCanvas(canvas, trace, { reducedMotion?, color?, durationMs = 620, pressure = 0.6, seed = 7 })
  : () => void   // 返回 stop()；trace 收存档单位点位或原始像素点位皆可
// 回放走墨刷增量三段式（一次 begin、逐点 extend、一次 end）；reducedMotion / 无 rAF 时整笔即出；
// DPR≤2，CSS 尺寸量不到时用 WeakMap 记忆防位图反复翻倍；stop() 会收笔防半截墨。
// 接线：screen-battle 写入（normalizeForStorage → pushGallery），screen-gallery 逐笔重放。
```

### 2.7 `drawing/index.js` barrel **[死代码→删 §9-B-5]**

再导出 classifyStroke/createStrokeRecognizer/TYPES/mountPainter/createInkBrush/
extractFeatures/synthesizeStroke/SYNTH_TYPES。src 与 tests 全部直捣具体模块，零 import。

## 3. combat

### 3.1 元素 `combat/elements.js` [现状]

```ts
ELEMENTS: ElementId[]
reaction(src, dst): { id: "evaporate"|"vine"|"conduct"|"suppress"|"resist"|"none";
                      label: string; damage: number; control?: number; crit?: number }
// vine 追加 control 400ms；conduct（雷→金）crit:0.15 已被 battle.cast 消费（[已收口 原§9-9]，
// 见 §3.2 数值管线；tests/round3.test.js 以 400 笔对照断言暴击率抬升 10~20 个百分点）。
```

### 3.2 战斗工厂 `combat/battle.js` [现状]

```ts
interface ActorSpec { id; name; classId?; element?; realmId?; hp?; atk?; qi? }  // 缺省查 realm 表
interface Actor { id; name; classId; element; maxHp; hp; maxQi; qi; atk;
                  shield; controlMs; shred /* ≤SHRED_CAP */; cooldownMs; intent }

QI_REGEN_PER_MS = 0.008
controlDurationMs(precision, reactionControl = 0): number
// = 500 + precision×1100 + reactionControl（束缚时长；满精度 1600ms、最低精度 0.2 为 720ms，
//   底噪压低、斜率抬高——控制随精度真正拉开差距）

// ===== modifiers 契约（唯一权威聚合接口）=====
DEFAULT_MODIFIERS = {
  atkMult: 1,        // 天赋 atk 树 → 符咒伤害倍率
  defMult: 1,        // 天赋 def 树 → circle 护盾量倍率
  supMult: 1,        // 天赋 sup 树 → cloud 治疗量 与 curve 束缚时长倍率
  incomingMult: 1,   // 敌方对玩家伤害倍率（减伤 <1）
  crit: 0,           // 暴击率 [0,1]
  critMult: 1.6,     // 暴击伤害倍率（≥1）
  qiRegen: 0,        // 每秒额外回气（叠加在基础 QI_REGEN_PER_MS 之上）
  shield: 0,         // 每次护盾符的固定额外护盾
  comboWindowMs: 1200, comboStep: 0.06, comboMax: 5,   // 连击
  enemyIntervalMs: ENEMY_ATTACK_INTERVAL_MS,           // 1800
}

normalizeModifiers(input?): Modifiers
// 白名单合并：只认 DEFAULT_MODIFIERS 里的扁平键 + 两个嵌套糖：
//   input.talent.{atk,def,sup}  → atkMult/defMult/supMult   （直接吃 talentMult(save, tree)）
//   input.beast.{crit,qiRegen,shield} → crit/qiRegen/shield （直接吃 beastBonus(save)）
// 扁平键优先于嵌套；非有限数字一律忽略；出参逐项夹取（crit∈[0,1]、critMult≥1…）。
// 未知键静默丢弃。[已收口 原§9-1] 唯一与白名单不交的死聚合器 combat/mods.js 已整文件删除；
// screen-battle.modifiersFor 即调用范式。

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
// 全量结构化事件流（damage/shield/heal/control/finished…）维持 v3 目标（[残余 →§9-B-14]）。
```

数值管线（cast，按序乘算）：
`atk × (0.65+prec×1.15) × (1+职业bonus) × (0.85+press×0.3) × atkMult × reaction.damage
 × 克制(1.18/0.88) × (1+敌方shred) × comboMult × (crit? critMult)`；
暴击掷骰：`critChance = mods.crit + (reaction.crit ?? 0)`，仅 critChance>0 时消耗一次 rng
（默认配置且无金雷引时不掷骰，旧 rng 序列不变）；
分支：circle 盾 `(18+prec×42×(1+bonus))×defMult+shield`；cloud 疗 `(16+prec×36×(1+bonus))×supMult`；
curve 控 `controlDurationMs(prec, react.control)×supMult` 且伤害 ×0.55；zigzag 伤害 ×1.15 且
`shred += 0.04+prec×0.12（上限 0.35）`；spiral ×1.25。

敌方节拍（tick）：**冷却累计制**——`cooldownMs -= 可行动时间`，被控期间冷却冻结；
单 tick 追击上限 `MAX_CATCHUP_STRIKES=64`。连击：距上次成功施法 ≤comboWindowMs 叠层
（≤comboMax），tick 超窗清零。

### 3.3 AI `combat/ai.js` [现状]

```ts
ENEMY_ATTACK_INTERVAL_MS = 1800; ENEMY_TELEGRAPH_MS = 400;
enemyIntent(t, controlMs = 0, opts?: { cooldownMs?; intervalMs?; telegraphMs? })
  : "bound" | "strike" | "watch"
// battle 内部每次 cast/tick 后按真实 cooldownMs 同步到 state.enemy.intent；
// 只传 (t, controlMs) 时退回旧相位估算（兼容层，UI 兜底用）。
```

### 3.4 `combat/mods.js` **[已删除]**

Round 2 契约 §9-1 裁定「删除模块」，本轮已执行：文件不存在、零残留引用。
`computeMods/defaultMods` 及 dodge/openingShield 概念一并消失，禁止复活。

### 3.5 `combat/index.js` barrel **[死代码→删 §9-B-5]**

再导出 createBattle/createActor/controlDurationMs/DEFAULT_MODIFIERS/normalizeModifiers/
QI_REGEN_PER_MS/reaction/ELEMENTS/enemyIntent/ENEMY_ATTACK_INTERVAL_MS/ENEMY_TELEGRAPH_MS。
src 与 tests 全部直捣 battle.js / ai.js / elements.js，零 import。

## 4. progression / classes

### 4.1 挂机 `progression/idle.js` [现状]

```ts
IDLE_CAP_MIN = 480; IDLE_MIN_CLAIM_MIN = 0.05; IDLE_BUNS_PER_MIN = 0.6;
idlePreview(save, nowMs = Date.now()): { minutes; pills; buns; claimed }
tickIdle(save, nowMs = Date.now()): Save
// 纯函数、幂等：同 nowMs 重复调用只发一次（第二次 idleClaimed=false、claim 全 0）；
// 未达最小结算时不推进 idleUntil（零头继续累积）；灵气丹按境界 idlePerMin，
// 包子按 IDLE_BUNS_PER_MIN（包子产自挂机，消耗于收兽）。
// 写入：qiPills/buns/idleUntil/lastSeenAt + 会话字段 idleClaim{minutes,pills,buns}/idleClaimed。
```

### 4.2 境界 `progression/realm.js` [现状]

```ts
breakthrough(save): Save   // xp 不足/已飞升只写 notice；成功则 realmId 晋级、xp 扣减
```

### 4.3 灵兽 `progression/beasts.js` [现状 — 原§9-7 全量收口]

```ts
export { BEASTS } from data   // 养成层是灵兽数值唯一门面，UI 不直捣 data
BEAST_CAP = 3; MAX_STAR = 3; STAR_MULT = [0, 1, 1.65, 2.6];
EVOLVE_COST = BEAST_EVOLVE_COST_PER_STAR(30); REROLL_COST = BEAST_REROLL_COST(18);  // data 转出
CATCH_COST = { buns: BEAST_CATCH_COST(36), qiPills: 8 }   // 丹替付价仍代码兜底（[残余 →§9-B-9]）
RELEASE_REFUND = floor(CATCH_COST.buns / 2) = 18          // 放生只退包子——防收放循环刷丹

catchPayment(save): { currency; amount; label } | null    // 包子优先，其次灵气丹
catchBeast(save, rng = Math.random, nowMs = Date.now()): Save
// 纯变换：栏满/付不起只写 notice；成功扣资源、入栏一星兽（uid = id+时间+随机段）。
// [残余 →§9-B-7] UI（beast-panel）调用未注入 rng/nowMs，生产路径非种子化。
releaseBeast(save, uid): Save          // [已收口] 放生：删条目 + 退 RELEASE_REFUND 包子；
                                       // uid 找不到（重复点击/坏档）只写 notice，返还不可重复领
beastBonus(save): { crit; qiRegen; shield }
// 按 beasts[].value 累加；未知 passive 直接跳过（坏档不长出战斗不认识的键）；
// value 非有限数时按 beastValue(passive, star) 重推。已接入战斗（经 §3.2 嵌套糖）。
beastValue(passive, star = 1): number  // PASSIVE_BASE[passive] × STAR_MULT[star]，3 位小数
// [已收口] PASSIVES=["crit","qiRegen","shield"] 与 PASSIVE_BASE（由 BEASTS 表首见 value 推导）
// 均已定义，原 ReferenceError 潜伏雷排除。
evolveCost(star = 1): number           // EVOLVE_COST × star
evolveBeast(save, uidA, uidB): Save    // 同种同星合成升星，祭品消失；各失败路径只写 notice
rerollPassive(save, uid, rng = Math.random): Save  // 必换一种被动，数值按星级重算
// 三者已由 ui/beast-panel.js 接入生产（收伏/合成/洗练/放生四门），
// 覆盖：tests/hub-beasts.test.js（11 用例，jsdom 挂真实 hub）+ round3/save-migrate 纯函数用例。
```

### 4.4 天赋 `classes/talents.js` [现状 + 死代码]

```ts
TALENTS: { id; name; tree: TalentTree; per }[]   // 9 天赋，3 树各 3
TALENT_COST = 12; TALENT_MAX_LEVEL = 5;          // [已收口] 定价/上限唯一导出源
talentMult(save, tree): number    // 1 + Σ level×per；已接入战斗（screen-battle → talent 嵌套糖）
applyTalent(save, id): Save
// [已收口] 失败带 notice：满级 ⇒ 「已至满级」、丹不足 ⇒ 「参悟需灵气丹 12」，均不扣资源；
// 未知 id 原样返回。覆盖：tests/save-migrate.test.js「天赋定价」。
// [残余 →§9-B-8] screen-hub 仍本地 const TALENT_COST=12 且满级判断硬编码 5，未 import 此处导出。

battleModifiers(save): { atk; shield; heal; control; crit; qiRegen; shieldFlat }
// [死代码→删 §9-B-1] 第三套聚合形态最后的残留：零调用方，键名不被 normalizeModifiers 认识，
// 传入 createBattle 即被整体静默忽略。连同私有 sumTalent/round3 一并删除；
// GDD「灵兽」节的「扩 battleModifiers 消费端」提法同步更正为 normalizeModifiers。
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
// 调用方：settle.js（结算统一走一次）、hub/class/gallery 的进度展示。
isClassUnlocked(save, classId): boolean
unlockedClasses(save): Class[]         // 隐藏职业（墨客）仅解锁后可见
```

### 4.6 `progression/unlock.js` **[死代码→删 §9-B-4]**

```ts
// 整个模块在 src 与 tests 中零 import（终审 rg 核实），是纯粹的兼容 shim 残留：
//   re-export { hasSixForms, moProgress, unlockMo }（权威在 classes/unlock.js）
//   INK_TYPES / INK_MASTERY_THRESHOLD / masteredTypes / checkInkUnlock / recordStroke
// 裁定：整文件删除。save.strokeStats 字段已在 v2 登记且 normalizeSave 会清洗，
// 但当前无任何写入方——若下轮接线「画阁各式最佳精度」展示，把 recordStroke 移入
// classes/unlock.js 或 UI 层重写；否则在下一次 version bump 时随迁移移除该字段。
```

### 4.7 结算 `progression/settle.js` [现状 — 已接线，原§9-3 收口]

```ts
resolveStage(stage: string | Stage): Stage | null
battleReward(stage, result): { xp; qiPills } | null   // 败北/未知关卡 null
beginBattle(save, stage, battleId?): Save
// 开战登记：battleSeq 自增、battleId = "<stageId>#<seq>"、清空 settledBattleId/lastResult 等。
// 不读 Date.now / Math.random。调用方：screen-battle 挂载时 store.set((prev) => beginBattle(prev, stage))。
settleBattle(save, { result, stage?, battleId? }): Save
// 恰好一次：同 battleId（显式或 save.battleId）已结算 ⇒ 原样返回同一引用；
// 胜发 xp/qiPills/clearedStages，败只记会话字段；末尾统一走一次 unlockMo，
// 解锁时追加 inkJustUnlocked。调用方：screen-battle.finish（内联结算已删，UI 只留局部
// settled 标志防重复 navigate）。battleId/settledBattleId 均为 TRANSIENT，不落盘；
// battleSeq 落盘防跨会话撞号。覆盖：tests/round3.test.js「同一 battleId 只发一次奖励」。
```

## 5. core

### 5.1 store `core/store.js` [现状 — 本轮 v2 + migrate 链 + 备份，原§9-4/5 收口]

```ts
SAVE_KEY = "linghuashi.save.v1";        // 历史键名已冻结，版本只认 JSON 里的 version
SAVE_BACKUP_KEY = "linghuashi.save.bak";
SAVE_VERSION = 2;
GALLERY_LIMIT = 24; GALLERY_POINTS = 32;
TRANSIENT_KEYS（模块私有）= ["idleClaim","idleClaimed","idleNoticeShown","notice",
                            "inkJustUnlocked","battleId","settledBattleId"];

defaultSave(): Save
// { version:2, playerName, classId:null, realmId, xp, qiPills, buns, talents:{},
//   strokeStats:{}, beasts:[], gallery:[], clearedStages:[], battleSeq:0,
//   lastSeenAt, idleUntil, settings:{mute,reducedMotion}, tutorialDone, inkUnlocked }

migrate(raw: unknown): Save | null
// 纯函数、不改入参、不碰 localStorage。逐级迁移链 MIGRATIONS：
//   v0→v1：画阁字符串条目升为 {type,precision:0,at:0}（保住史前档六式进度）
//   v1→v2：灵兽补 uid（`<id>-v1-<index>`），放生/合成按 uid 定位
// 之后统一过 normalizeSave：defaultSave 打底、逐字段夹值（whole/levelMap/ratioMap/
//   normalizeBeasts 去重 uid/sanitizeGallery/settings 布尔化）、剔除 TRANSIENT_KEYS、
//   **未登记键原样保留**（新版本写的字段不被旧版本抹掉）。
// 返回 null 的情形：非对象、version > SAVE_VERSION、缺迁移步。
// 迁移姿势（唯一）：SAVE_VERSION+1 → MIGRATIONS 补一步 → 补往返单测。

createStore(initial = defaultSave()): {
  get(): State;
  set(patch: Partial<State> | ((state: State) => Partial<State> | null)): State;
  // patch 支持函数形式（返回 null/undefined 不变更）；顶层浅合并，嵌套对象整体替换。
  subscribe(fn): () => void;   // 订阅方：ui/audio-bridge（mute）、ui/motion-bridge（reducedMotion）
  persist(): void;             // 剔 TRANSIENT_KEYS 后整体序列化；quota 异常吞掉
  hydrate(): State;
  // 读盘 → JSON.parse → migrate；migrate 成功即入内存。
  // 盘上不是当前版本（升级档/坏 JSON/更高版本档）⇒ 先把原始串抄到 SAVE_BACKUP_KEY
  //   再继续（.bak 是 persist 覆盖后唯一可人工救回的东西；备份写失败不拖垮读档）。
  // migrate 返回 null ⇒ 保持内存态（弃档不炸、已留备份）。
  // 覆盖：tests/save-migrate.test.js（16 用例）+ store.test.js + round3.test.js。
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
//   bindAudioSettings(store)（读档即同步静音）→ bindMotionSettings(store)
//   （[已收口] 减动效存档不在首屏先看一遍入场动画）→ renderApp。
// navigate = set({screen}) + persist + renderApp。
// destroy 解绑 beforeunload/pagehide/visibilitychange、解绑音频与动效桥、卸载屏幕、末次 persist。
```

### 5.3 事件总线 `core/events.js` **[死代码→删 §9-B-2]**

```ts
createBus(): { on(type, fn): () => void; emit(type, payload): void }
// 零调用方两轮未变。结构化事件流已降级 v3（§9-B-14），届时按需重写；本文件删除。
```

### 5.4 固定步长时钟 `core/loop.js` **[残余 →§9-B-3]**

```ts
createTicker(stepMs = 200, maxCatchUpMs = 1000): { advance(nowMs): number; reset(): void }
// 累加器折算整数 tick；负 dt 归零、超长 dt 钳到 maxCatchUpMs。tests/loop.test.js 覆盖。
startLoop({ stepMs = 200, onTick(stepMs), onFrame? }): () => void   // rAF 驱动，退化 setInterval
// 生产零调用方：screen-battle 仍用 window.setInterval(200ms) 驱动 battle.tick
//（伤害有限——battle 冷却累计已抗 dt 抖动，但后台标签被钳 ≥1s，违反单时钟原则）。
// 处置：screen-battle 接线 startLoop（推荐，rAF+accumulator+visibilitychange 暂停），
// 或删 startLoop 只留 createTicker；不许第三轮继续悬空。
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
// audio/index.js 是 audio 的公共入口，UI 均从此 import（与 combat/drawing 的死桶不同，此桶在用）。
```

### 6.3 桥 `ui/audio-bridge.js` / `ui/motion-bridge.js` [现状]

```ts
bindAudioSettings(store): () => void
// settings.mute → setMuted 的唯一单向推送（audio 层不认识 store）；解绑同时 closeAudio。

// motion-bridge —— [已收口] 与 audio-bridge 同构的减动效单向接线：
prefersReducedMotion(save): boolean   // 存档设置 ∨ 系统 prefers-reduced-motion
motionReduced(): boolean              // 无 store 调用点用：读接线时缓存 + 系统偏好兜底
bindMotionSettings(store): () => void // settings.reducedMotion → <html data-reduced-motion>；
                                      // 解绑清属性。REDUCED_MOTION_ATTR = "data-reduced-motion"
// 覆盖：tests/motion.test.js（5 用例，含 motionToggle 联动）。
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
//   keydown/painter 回调/教程弹层/回放 timer 必须全部在返回的 dispose 中释放。

// ui/painter-host.js — 画布单例宿主（刻意不 destroy，跨战斗复用同一 canvas 与烤好的纸纹）
acquirePainter({ onStroke?, label? }): { canvas; painter; onStroke }
releasePainter(): void          // 解回调 + painter.cancel()（[已收口] 半截笔不跟着换屏）
canvasBox(): { width; height }
previewStroke(points, opts?): void   // 键盘施法回显：描线 + 420ms 淡出，尊重 motionReduced()
refreshPainter(): void               // canvas 入文档后按真实尺寸重初始化
// [残余 →§9-B-12] 头注释仍称"mountPainter 的 destroy() 不解绑 resize"——canvas.js 已全量
// 解绑，理由过期；单例设计本身保留（规避重复挂载与重烤纸纹），注释需改写成本动机。

// ui/keycast.js — 键盘/点击施法（第二输入通路）
KEYBOARD_PRECISION = 0.7; KEYBOARD_PRESSURE = 0.6;   // 判型不符 ×0.8
STROKE_KEYS: { key: "1".."6"; type; name; effect; talisman; qi }[]
strokeKeyByKey(key) / strokeKeyByType(type)
strokePoints(type, { width, height, fill }): Point[]   // synthesizeStroke 包装，教程字形/SVG 共用
keyboardStroke(type, box): Stroke & { source: "keyboard"; matched: boolean } | null
// 走真实 classifyStroke 核形；笔法以按键意图为准。

// ui/beast-panel.js — [已收口] 灵兽栏（收伏/合成/洗练/放生四门收在一张卡）
beastPanel({ store, navigate }): HTMLElement
passiveLabel(beast) / starText(star)
// 交互契约：点卡选中（≤2 只，第三只顶掉最早）；合成需两只同种同星；洗练/放生单选；
//   放生两步确认（再按同一只才真放，换选即撤销），文案照抄养成层 RELEASE_REFUND。
// 数值全部来自 progression/beasts.js，UI 不自己定价。
// [残余 →§9-B-13] releaseFallback/resolveReleaseBeast/releaseRefund 是对同仓库模块的
//   能力探测层，生产分支不可达（releaseBeast 已导出）——收拢为直接 import。
// 覆盖：tests/hub-beasts.test.js。

// ui/components.js
muteToggle(store) / motionToggle(store, { onChange? })   // aria-pressed、改档即 persist
strokeGlyph(type, { width, height }): SVGElement          // 与键盘施法同一套 synth 点列
pageHeader({ kicker, title, tools })

// ui/tutorial.js
shouldShowTutorial(save): boolean          // !tutorialDone
openTutorial({ mount, store, onClose?, markDone = true }): () => void
// 模态 + 焦点陷阱 + Esc；弹层期间战斗时钟不启动。
```

## 7. 不变量清单 → 测试映射（终审实测：14 文件 105 用例全绿）

| # | 不变量 | 现状 |
| --- | --- | --- |
| 1 | finished 后 `tick/cast` 幂等（t 不推进、end 日志恰一条） | ✅ `contract.test.js` |
| 2 | unlockMo 六式=不同笔法数、已解锁幂等 | ✅ `contract.test.js` |
| 3 | tickIdle 同时刻幂等、480 分钟封顶 | ✅ `contract.test.js` + `progression.test.js` |
| 4 | 画阁：raw 往返判型不变、上限 24、坏档清洗、存档 <64KB | ✅ `gallery.test.js`（18） |
| 5 | 音频：总线静音/懒建/手势 resume | ✅ `audio.test.js`（6） |
| 6 | 灵气不足 ⇒ events 空、状态不变；护盾先于 hp；1800ms 节拍跨 tick 稳定 | ✅ `combat.test.js`（7） |
| 7 | **结算恰好一次**（settledBattleId 令牌：重复结算原引用返回、新 battleId 照发） | ✅ `round3.test.js`（原 §7-10 缺口已补） |
| 8 | **migrate**：v0/v1 升级保进度、坏值夹取、幂等、未登记键保留、不改入参；hydrate 备份 `.bak`、高版本/坏 JSON 保内存态 | ✅ `save-migrate.test.js`（16）+ `store.test.js` + `round3.test.js` |
| 9 | **金雷引**：thunder→metal 暴击率抬升 10~20pp（400 笔同 seed 对照） | ✅ `round3.test.js`（原 §9-9 消费即验证） |
| 10 | **放生/合成/洗练**：uid 定位、返还不可重复领、返还<收价、UI 两步确认、异种拒合成 | ✅ `round3.test.js` + `save-migrate.test.js` + `hub-beasts.test.js`（11，jsdom 挂真实 hub） |
| 11 | **pointercancel 丢弃**：半截笔不施法、不污染下一笔、cancel() 可复画 | ✅ `pointer-cancel.test.js`（6） |
| 12 | **减动效**：设置∨系统偏好、`<html>` 属性接线、开关落盘 | ✅ `motion.test.js`（5） |
| 13 | 识别确定性：轴对齐直线、噪声圆、微小笔迹 scribble | ✅ `stroke.test.js`（8）；缩放不变性仍未测（§9-B-10） |
| 14 | 模板回归：六式跨画幅判回本型、存档往返 | ✅ `templates.test.js`（11） |
| 15 | 固定步长 ticker 折算/钳制 | ✅ `loop.test.js`（4）——`startLoop` 本体仍零调用（§9-B-3） |
| 16 | 天赋/灵兽伤害对照（同 seed 同笔迹，atkMult 生效） | ⚠️ 暴击路径已测（#9/#10）；atk/def/sup 倍率对照仍只在验收 harness，无 vitest 用例 |
| 17 | 资源零泄漏（battle↔hub 往返 N 次句柄不增长） | ❌ 未自动化（验收 harness 实测过恒定） |
| 18 | 性能红线 | `bench`：p95≤4ms exit 2 红线（实测 ≤0.16ms）+ 3000 笔 0 误配；`probe`：乱涂硬误报 <5% exit 2 红线（口径 line/circle/spiral/**cloud**，实测 2%）。battle 段有计时上报（perRound≈0.016ms）但无阈值红线 |

## 8. 存档字段登记（version 2）

- 正式字段 = `defaultSave()` 全字段（§5.1，本版新增 `strokeStats`、`battleSeq`）。
- 会话字段（TRANSIENT，不落盘、migrate 时从盘上剔除）：`idleClaim/idleClaimed/idleNoticeShown/notice/inkJustUnlocked/battleId/settledBattleId`。
- **仍随 persist 落盘的运行时字段**：`screen`、`stageId`、`lastResult`、`lastStage`、`lastReward`
  （[残余 →§9-B-11]；boot 的 entryScreen 消毒使其无害，normalizeSave 的「未登记键保留」策略使其向前兼容）。
- `strokeStats` 已登记但当前无写入方（`recordStroke` 随 §9-B-4 待删；处置见该条）。
- **规则**：任何字段增删改 ⇒ `SAVE_VERSION`+1 + `MIGRATIONS` 补一步 + 往返单测三件套——
  三件套本轮已齐备（v2 即样例），此规则自本版起为硬约束；`SAVE_KEY` 键名永久冻结。

## 9. 漂移定案（Round 3 终审）

### 9-A 已收口对照（Round 2 §9 → 本轮处置结果）

| 旧# | 条目 | 结果 |
| --- | --- | --- |
| 9-1 | `combat/mods.js` 死聚合器 | ✅ 整文件删除，零残留引用 |
| 9-3 | settle 未接线 | ✅ beginBattle/settleBattle 接入 screen-battle，内联结算已删；令牌入 TRANSIENT |
| 9-5 | 无 migrate/备份 | ✅ SAVE_VERSION=2 + 迁移链 + `.bak` 备份 + 16 用例 |
| 9-6 | 双轨标准轨迹 | ✅ 几何单源 synth.js；templates.js 与 scripts/trajectories.mjs 降级为取景层 |
| 9-7 | beasts 常量缺失/定价散落 | ✅ PASSIVES/PASSIVE_BASE 补齐；定价上移 data；evolve/reroll/release 接 UI（丹替付价兜底残余 →9-B-9） |
| 9-9 | reaction.crit 死字段 | ✅ battle.cast 消费（critChance=crit+react.crit）+ 对照单测 |
| 9-12 | applyTalent 无 notice | ✅ 满级/丹不足均带 notice；成本双写残余 →9-B-8 |
| 9-13 | pointercancel 收笔≠丢弃 | ✅ 改为丢弃 + painter.cancel() + 6 用例 |
| （验收 A6） | 乱涂红线不含 cloud | ✅ scribble-probe 口径 line/circle/spiral/cloud，<5% 红线进 probe exit code |
| （验收 E5） | 无减动效开关 | ✅ motionToggle + motion-bridge + `<html>` 属性 + 5 用例 |

### 9-B 剩余清单（按危害排序；处置为本契约裁定）

| # | 条目 | 事实 | 处置 |
| --- | --- | --- | --- |
| 1 | `classes/talents.js#battleModifiers`（含私有 sumTalent/round3） | 三套聚合器最后的死代码：零调用方，键名不入 normalizeModifiers 白名单 | **删除**；同步更正 GDD「灵兽」节提法。权威接口维持：normalizeModifiers 扁平键 + talent/beast 嵌套糖 |
| 2 | `core/events.js#createBus` | 零调用方（两轮） | **删除整文件**；v3 事件流届时重写 |
| 3 | `core/loop.js#startLoop` 零调用；screen-battle 裸 setInterval(200) | 后台标签被钳 ≥1s；battle 自身抗抖动 | screen-battle 接线 startLoop（rAF+accumulator+visibilitychange），或删 startLoop 只留 createTicker；禁止再悬空一轮 |
| 4 | `progression/unlock.js` 整模块零 import | shim 残留（re-export + recordStroke/masteredTypes/checkInkUnlock） | **删除整文件**；`strokeStats` 字段：接线「各式最佳精度」展示则把 recordStroke 迁到权威处，否则下次 version bump 随迁移移除 |
| 5 | `combat/index.js`、`drawing/index.js` 桶文件零 import | 调用方全部直捣具体模块（audio/index.js 在用，不在此列） | **删除两个桶**，或改约定「跨层只许走桶」并改全部调用方——二选一，不许桶与直捣并存 |
| 6 | 弱战斗种子 `seed = stage.id.length + save.xp`（screen-battle） | 随 xp 漂移、碰撞多；beginBattle 未生成/存种子 | beginBattle 显式生成种子并存入会话字段，createBattle 消费，供回放 |
| 7 | `catchBeast` UI 调用未注入 rng/nowMs | 生产收兽走 Math.random | beast-panel 注入种子 RNG；参数形态已支持，仅差调用方 |
| 8 | TALENT_COST/上限双写：talents.js 已导出，screen-hub 仍本地 const 12 与硬编码 5 | 数值恰好一致，纯双写风险 | hub 改 import `TALENT_COST/TALENT_MAX_LEVEL`，删本地常量 |
| 9 | 收兽丹替付价 8 仍是代码兜底 | data 缺 `BEAST_CATCH_QI_COST` | data 补导出后 beasts.js 转出，与包子价同源 |
| 10 | pointer+touch 双栈并存（move 可能双采样）；识别阈值绝对像素（28px/4px） | 现行行为 | PointerEvent 可用时不挂 touch 栈 + `touch-action:none`；阈值归一化到画布短边并补缩放不变性测试（§7-13） |
| 11 | `screen/stageId/lastResult/lastStage/lastReward` 仍随 persist 落盘 | entryScreen 消毒 + 未登记键保留策略下无害 | 短期维持并以 §8 登记为准；长期 save/session 分层 |
| 12 | painter-host 头注释仍称 destroy 不解绑 resize | canvas.js 已全量解绑，理由过期；单例本身是对的 | 更正注释为真实动机（复用画布与纸纹烘焙） |
| 13 | beast-panel 的 releaseFallback/resolveReleaseBeast 探测层 | 对同仓库模块做能力探测，生产分支不可达 | 收拢为直接 import releaseBeast/RELEASE_REFUND，删 fallback 与探测函数（测试同步改写） |
| 14 | 结构化 BattleEvent 流未实现（events 仅单条 cast） | 范围定案 | 维持 v3 目标；本版契约以 §3.2 实际 events 为准 |
| 15 | `getState()` 返回内部可变引用 | 测试专用后门 | 维持裁定：UI/生产代码只读；v3 再议冻结或快照 |
| 16 | `ACCEPTANCE.md`（08:30 快照）与 `SOTA_CHECKLIST.md` 的 R2 保留意见滞后于终态（cloud 已入红线、轨迹已单源、migrate 已落地、mods.js 已删、E5 已有开关） | 文档腐化 | 下轮按本契约 §9-A 同步两文档（本轮授权范围仅限本文件与 ARCHITECTURE.md） |
| 17 | 仓库根残留未跟踪 `package-lock.json`（88B）与 `test.js` | 隔离约束 G3 | 提交前删除根 package-lock.json；不得随本游戏提交 |

## 10. 版本与弃用

- 本文件为 **v3（Round 3 终审版）**：只描述已核实的现状；已收口条目归档 §9-A，剩余目标态一律进 §9-B「处置」栏。
- 破坏性变更（签名/字段删除）：先在此文件标 `@deprecated` 与替代 API，同轮改完全部调用方与测试，禁止双轨。**同一概念只许一份实现**——modifiers 三轨的教训以 §9-A 收尾，`battleModifiers`（§9-B-1）是最后一处待清残留。
- 存档变更走 §8 三件套（version+1 / 迁移步 / 往返单测），`SAVE_KEY` 键名冻结。
- 契约与实现漂移视同 bug：发现即记入 §9-B，先与所有权方定案再改码。
