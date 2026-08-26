# 超能下蛋鸭 · 系统架构（Round 3 契约 v1.2）

- 所有者：Fable-1（架构）。配套：`docs/API_CONTRACT.md`（签名/事件/存档）、`docs/OWNERSHIP.md`（文件所有权）。
- 地位：本文件与 API_CONTRACT 是全体代理的**编码依据**。实现与契约冲突时，先改契约（走变更流程，见 API_CONTRACT §0），再改代码。
- 基线事实：本文档与仓库现有代码及 G1 已合入测试（`tests/*.test.js`）逐条核对过，不与任何已锁定断言冲突。
- v1.1 修订（按实码核对，Round 2 BRIEF 四项）：
  1. **单一物理源**（§4.0）：`src/physics` 为唯一权威积分器（v1.2 已落地定稿，见下）；
  2. **BONDS = SYNERGIES 别名**（§5.4）：羁绊权威数据表为 `data/synergies.js` 的 `SYNERGIES`，`data/index.js` 须追加 `BONDS` 别名导出；
  3. **18 英雄权威表**（§6）：`data/heroes.js` 落地 18 只为权威口径，云朵雀 / 倒霉鸭进 `RESERVED_HERO_IDS` 预留；
  4. **存档字段**（§8）：schema 按 `core/store.js` + `progression/save.js` 实码重写，settings 双键 + `pref()` 缺省即开启语义。
- v1.2 修订（Round 3，按 O4 已合入的物理切换实码定稿）：
  1. **单一物理源落地**（§4.0）：战斗已切到 `src/physics`（预测/实弹 9308 采样点误差 0），`core/sim.js` 重铸为其**游戏侧适配层**（零积分代码）；v1.1 的「过渡实现 / 冻结 / 对拍先行 / 退役路线」表述全部删除；
  2. §3 / §4.1–§4.7 按实码勘误：两级步进管线、敌人碰撞盒为 AABB、NaN 蛋就地修复不回收、分裂走世界内建随机、事件词汇更新（详见 API_CONTRACT §14 v1.2）。

## 1. 设计原则（六条铁律）

1. **UI 之下皆纯逻辑**：`physics / combat / heroes / progression / data` 不得 import DOM、Canvas、localStorage 之外的宿主 API；全部可在 Node headless 里 import 并跑通（`tests/`、`scripts/probe.mjs`、`scripts/bench.mjs` 依赖此性质）。
2. **单向依赖 + 唯一出口**：跨模块 import 只允许走对方目录的 `index.js`；目录内部文件视为私有。依赖方向见 §2，禁止反向与环。
3. **事件总线只做通知**：`core/events` 总线用于 UI / 音频 / 飘字 / 统计的单向广播。**禁止**任何订阅者通过事件回写物理或战斗状态；改状态只能调用模块公开 API。
4. **数据驱动**：技能 = `skill` id → hook 注册表；敌人 = `behavior` id；关卡 = layout 表；羁绊/神器 = 效果描述对象。`src/data/**` 只有常量，零逻辑。
5. **确定性**：一切玩法随机走注入的 `createRng(seed)`（见 API_CONTRACT §3）；`src/{physics,combat,heroes,progression,modes,data}` 内**禁用 `Math.random`**。固定步长 1/120s ⇒ 同 seed 同输入必然同结果（回放、单测、基准依赖此性质）。
6. **热路径零分配**：蛋、粒子、飘字、接触事件全部池化复用；固定步进内不 new 对象、不产生闭包垃圾（详见 §9）。

## 2. 分层与依赖

```
L4  ui ─────────────┐        audio ──┐          （只订阅总线 + 读快照，
     │              │                │            调用 battle/mode 公开方法）
L3  modes（冒险/肉鸽/爬塔/讨伐/钓鱼 = 编排层，唯一可组合下层的地方）
     │
L2  heroes（技能 hook 运行时）   progression（养成/奖励纯公式）
     │                            │
L1  physics（纯数学，零依赖）     combat（纯函数，仅依赖 data 枚举）
     │                            │
L0  data（纯常量表）      core（events / rng / store / loop —— 全层可用的底座）
```

依赖矩阵（行 = 模块，√ = 允许 import 列模块的 `index.js`）：

| import → | data | core | physics | combat | heroes | progression | modes | ui | audio |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| data | 内部 | — | — | — | — | — | — | — | — |
| core | — | 内部 | — | — | — | — | — | — | — |
| physics | — | — | 内部 | — | — | — | — | — | — |
| combat | √ | √(rng) | — | 内部 | — | — | — | — | — |
| heroes | √ | √ | —(注1) | √(类型) | 内部 | — | — | — | — |
| progression | √ | √ | — | — | — | 内部 | — | — | — |
| modes | √ | √ | √ | √ | √ | √ | 内部 | — | — |
| ui | √(展示) | √ | —(注4) | — | — | √(只读查询) | √ | 内部 | — |
| audio | — | √(events) | — | — | — | — | — | — | 内部 |
| main.js | 组合根：可 import 所有 index.js |

注 1：heroes 不直接改 `world`；生成蛋、造伤等能力全部经 `HeroApi`（modes 注入的能力面），见 API_CONTRACT §8。
注 2：`core` 是零游戏逻辑的底座（总线/随机/存档/主循环驱动），不 import 任何上层。
注 3：physics 完全自包含（自带常量与数学），保证可单文件夹拷走复用。
注 4：实码定案（v1.2）：battle / ui / modes 对物理的一切访问统一经 `core/sim.js` 适配层（含弹道预测与发射台常量），不直接 import `src/physics`——见 §4.0 铁律 1。

## 3. 一帧的生命周期（主管线，v1.2 按实码）

```
requestAnimationFrame(t):
  dtFrame = clamp((t - last)/1000, 0, 0.05)         // 掉帧上限，防积分螺旋
  battle.update(dtFrame)                             // ← 唯一推进游戏状态的地方
    └─ stepWorld(world, dtFrame, hooks)              //   core/sim.js：内部按 FIXED_DT=1/120
                                                     //   累积固定步，≤8 步/帧
  renderer.render(battle, alpha)                     // 蛋按 prevX/prevY↔x/y 插值
```

`battle.update` 内部顺序（战斗类模式，实码 `core/battle.js`）：

1. 消费输入指令（fire / castUltimate / switchHero —— UI 只入队/调公开方法，不直接改状态）；
2. 顿帧闸门：`hitStop > 0` 时本帧只衰减特效不推物理（手感契约，上限 0.16s）；
3. `stepWorld(world, dt, hooks)`（`core/sim.js`）：每个固定步内部完成「实体镜像 → 预步力 →
   `physics.stepWorld` → 停滞回收 → 排空 `world.events` 并翻译成命中钩子」；
4. 钩子内战斗结算：`onEnemy` → `adapters.baseHit`（上游 `combat.resolveHit`）→ 扣血/元素/
   连击/能量 → 英雄 hook → UI/音频通知；
5. 状态 DoT tick、连击计时、敌人漂移、模式计时（讨伐 60s 等）；
6. 回合/波次/胜负状态机迁移（见 §7.1）。

**顺序即契约**：渲染永远读状态 + 插值，绝不在 rAF 里直接推物理；同一固定步内先物理后战斗后 UI 通知（命中钩子在第 3–4 步集中翻译与结算）。

## 4. 物理架构（`src/physics`，Opus-1）

### 4.0 单一物理源（v1.2 定稿：切换已完成）

Round 2 的「双物理收敛」P0 已落地（O4 合入）：**全仓只剩一套积分器**。

| 模块 | 所有者 | 角色（实码） |
| --- | --- | --- |
| `src/physics/**` | O1 | **唯一权威积分器**：积分 / 碰撞 / CCD / 力场 / 传送门 / 睡眠与回收全在这里；本节 §4.1–§4.7 全部描述此实现 |
| `core/sim.js` | O4 | **游戏侧适配层（非积分器）**：自身零积分代码，全部物理能力 import 自 `physics/index.js`。职责：① 关卡实体（钉/砖/敌人/斜面/风扇/冰面/传送门）镜像成物理静态体与力场（`syncStage`）；② 物理事件翻译成战斗命中钩子（`onWall/onSlope/onPeg/onBrick/onEnemy/onPortal/onRecycle`）；③ 施加实弹与预测共用的预步力（冰面阻力、追踪转向）；④ 游戏节奏裁决（停滞回收 45px/s×0.6s、蛋寿命 12s、每帧 ≤8 固定步）；⑤ 承载发射台常量。契约见 API_CONTRACT §6.4 |
| `core/adapters.js` | O4 | 能力探测与如实报告（`describeCaps`）。物理链路**无降级分支**——探测只用于菜单标注真实链路；combat 仍是「上游可用则用、异常时内置兜底」 |

定稿铁律（取代 v1.1 的切换计划）：

1. **唯一消费入口**：battle / ui / modes 对物理的一切访问经 `core/sim.js`（`core/battle.js`、`ui/render.js`、`ui/screens/battle.js` 均从它 import 常量与函数）；除 `core/sim.js` 与 `core/adapters.js` 外，`src/core`、`src/ui`、`src/modes` 不得直接 import `src/physics`。
2. **预测与实弹同源**：`stepWorld` 与弹道预测都只经 physics 的 `advanceEgg` 推进（幽灵蛋与实弹同一份积分/碰撞/冷却代码）；sim 层预步力（冰面/追踪）也由 `prepareEgg` 双路共用。**禁止**任何一侧另起积分分支。
3. **禁止第二积分器**：任何目录不得再出现自带的 step / 碰撞实现；积分与碰撞的行为改动只准发生在 `src/physics`（O1），sim 层只准做镜像、翻译与游戏裁决（OWNERSHIP §3.6）。
4. 对拍与桥接工具（`physics/compat.js` 的 `createSimBridge` / `compareTrajectories`）保留为 O1 的回归工具；Round 2 对拍结论：同 `(seed, 发射序列)` 9308 采样点误差 0。
5. v1.1 的过渡条款（sim 冻结、退役路线、发射台常量迁往 `src/data`）**全部作废**——`core/sim.js` 是长期存在的游戏侧适配层，发射台常量（`LAUNCH_X/LAUNCH_Y/NEST_Y/MAX_AIM_DEG/MIN_SPEED/MAX_SPEED/MAX_EGG_SPEED`）定居于此（O4 所有）。

### 4.1 坐标与单位

- 逻辑世界 480×800，原点左上，x 向右，y 向下（与 Canvas 一致）；单位 px、秒。重力 `GRAVITY = 1680 px/s²` 向下。
- 发射台位于 (240, 92)（`core/sim.js` 的 `LAUNCH_X = WORLD_W/2`、`LAUNCH_Y = 92`；巢/回收线 `NEST_Y = 648`）；瞄准角以正下方为 0，左负右正，钳制 ±70°（物理层收弧度，游戏层 `aimVector` 收角度制）；初速 220–720 px/s（蓄力线性映射）。
- 飞行限速：物理默认 `MAX_SPEED = 2600`，游戏世界建为 `MAX_EGG_SPEED = 1900`（sim 的 `createWorld` 覆盖）。

### 4.2 实体

- **Egg（动态圆）**：半径字段 `r`（v1.1 勘误：实码是 `r` 非 `radius`），合法域 10–14（默认 12）；`restitution` 0.78–0.92（默认 0.85，物理夹取 0..1.4 以容 bumper），空气阻力极低（`EGG_DRAG = 0.02/s`，冰面上 sim 切到 0.006）。带 `prevX/prevY` 供渲染插值、`generation`（0 主蛋，分裂 +1）、`splitsLeft` 分裂预算、`pierce` 剩余穿透、`bounces` 累计反弹 + `wallHits/pegHits/brickHits/eggHits/portalUses` 分类计数，以及**接触账本**（`contacts/enemyContacts/firstContact/firstEnemyContact/lastContact/hitLog`——一律在 reflect **之前**落账，见 §4.3）。字段全表见 API_CONTRACT §6.2。
- **StaticBody（静态体）**：`shape ∈ {segment, circle, aabb}` 描述几何，`kind` 描述玩法材质（wall/ramp/brick/peg/bumper/ice/rubber/portal/enemy…，缺省物性取 `MATERIAL[kind]`）。segment 为胶囊线段（`x1,y1,x2,y2`，半厚字段 `halfThickness`——v1.2 勘误：非 `radius`；`oneWay` 单向），aabb 以中心 + 半宽高（`x,y,hw,hh`；工厂可收 `anchor:'topleft'` 构造期转换一次），circle 为 `x,y,r`。`sensor:true` 只触发事件不反弹。传送门 = sensor 圆对（`link` 指向另一端、`facing` 旋转出射、`exitSpeed` 出口保底速度）；关卡单向门由 sim 把出口端降级为 `portalExit` 纯出口。**敌人以 `kind:'enemy'` 的 AABB 挂进 statics**（v1.2 勘误：非 circle），`body.data` 反向指回战斗实体；敌人可在蛋飞行期间漂移——sim 每固定步把物理体拉回实体位置并刷新宽相（`followBox`）。
- **Field（力场）**：不参与碰撞，积分前按区域叠加加速度/阻尼，判别字段 `type`：`fan`（区域恒定加速度，带沿风向线性衰减 `falloff`）、`wind`（全图恒定）、`gravity`（区域覆盖世界重力）、`slow`（区域阻尼）。追踪转向（磁铁语义）不是物理力场，是 sim 层预步力（`egg.homing`）。

### 4.3 步进管线（v1.2 按实码：两级步进，顺序固定）

**游戏帧层**（`core/sim.stepWorld(world, dtFrame, hooks)`，battle 每帧调一次）：按 1/120 累积固定步（≤8 步/帧；场上无蛋时清零余量，防止下一发首帧多跑）。每个固定步依次：

```
1. syncStage      关卡实体增删改镜像到物理体（新建/移除/followBox 跟随），有移动即重建宽相
2. prepareEgg     对每枚活蛋施加预步力：冰面阻力切换、追踪转向（实弹与幽灵蛋共用同一函数）
3. physics.stepWorld   ← 物理固定步，见下
4. reapStalled    游戏侧停滞回收：|v| < 45px/s 持续 0.6s（发射 0.25s 保护期），reason:'stalled'
5. dispatch       drainEvents 排空 world.events → 翻译成命中钩子（同蛋对同敌 0.08s 去重）
6. pushTrails     拖尾采样（渲染用）
```

**物理固定步**（`physics.stepWorld(world, dt)`，每次调用恰推进一步）：

```
1. 逐蛋 advanceEgg：数值兜底（sanitizeEgg）→ 记录 prevX/prevY 插值起点 →
   stepEgg 子步 CCD（单子步位移 > r×0.5 细分，≤ MAX_SUBSTEPS=8，防高速穿隧）：
   半隐式欧拉（力场+重力 → 阻尼 → 限速 → 位移）
   → 蛋 vs 静态（网格宽相 → 窄相 圆vs线段/AABB/圆；noteContact 在 reflect **之前**落账
     → 位置修正 + 反射；传送门 / 传感器 / 穿透走各自分支）
   → 蛋 vs 解析式边界（左右墙 / 顶板反弹；底部默认开放用于回收）
2. 蛋 vs 蛋：两两暴力检测，质量加权弹性冲量（≤24 蛋由 battle 投放策略保证，≤276 对）
3. finalizeStep：出界（y > 820 / 越侧界 / 越顶界，reason:'out'）、
   睡眠（|v| < 8px/s 持续 0.6s，发射 0.2s 保护期，reason:'sleep'）、
   寿命到期（reason:'expired'）→ recycle 事件 → compactEggs 从 world.eggs 移除
```

事件统一经 `emit` 入 `world.events`（盖 `time/step` 戳，上限 512 丢最旧），词汇见 API_CONTRACT §6.2。

防御（v1.2 勘误，`tests/physics.test.js` 锁定）：蛋出现非有限坐标/速度 → **就地修复**（速度归零、坐标回退 prev/发射台），**不删蛋**；世界时钟保持有限。v1.1「按 `reason:'oob'` 回收」表述作废。

### 4.4 宽相

静态体 ≤80（battle 层投放策略）：惰性建均匀网格（实码 `GRID_CELL = 48`px，480×800 → 10×17）；增删或移动静态体后 `markStaticsDirty(world)`，下一次查询整体重建。蛋按扫掠包围盒查询覆盖的 cell。蛋 vs 蛋不进网格（数量小，暴力更快且零维护）。每个 body 缓存 `aabb{minX..maxX}`，改坐标用 `moveBody`（内部重算）或改后手调 `computeAABB`。

### 4.5 分裂蛋

`splitEgg(world, egg, opts)`（v1.1 勘误：实码导出名为 `splitEgg`，非 `spawnSplitEggs`）：默认 `count` 2、扇形张角 `spread`（默认 `SPLIT_SPREAD = π/3`）、子蛋继承父蛋 **0.7 倍速度**（`SPLIT_SPEED_SCALE`，下限 120px/s）、半径 ×0.8、`power` ×0.6、`generation+1`；分裂预算走 `egg.splitsLeft`（≤0 不分裂，`force` 可越过）；散布抖动走世界内建确定性随机 `nextRandom(world)`（v1.2 勘误：不再由调用方传 `rng`）。同屏 24 蛋硬上限由 battle 层投放策略把守——超额直接不生成并记统计（不排队、不报错）。分裂只由 heroes/combat/battle 层触发（`splitBudget/splitOnHit` 语义），物理不自发分裂。

### 4.6 弹道预测

- 权威实现是 `physics.predictTrajectoryDetailed`：幽灵蛋**不入 `world.eggs`**，经与实弹完全相同的 `advanceEgg` 推进（同一份积分/碰撞/冷却代码，虚线与落点逐像素一致）；自带独立时间轴，穿透/命中冷却与实弹同节奏；命中点取 reflect 之前的接触账本（`firstEnemyHit`）；对 world **零副作用**（`structuredClone` 相等已被测试锁定）。
- `predictTrajectory(origin, velocity, world, stepsOrOpts)` 为稳定契约版，只返回点序列：第 4 参为数字 = 逐步采样，空世界恰好返回 `steps` 个（Round 2 解锁测试锁定）；为对象 = 瞄准 UI 抽稀形态（`maxSteps=360, maxBounces=3, sampleEvery=3`）。
- 游戏侧 `core/sim.predictTrajectory` 复用同一 `prepareEgg`（冰面/追踪）+ `physics.stepEgg`，返回准星所需的 `{points, bounces, hitsEnemy, impact, target}`；停滞截断与实弹 `reapStalled` 同参数。battle 用「这一发真的会射出去的蛋」的参数（半径/弹性/穿透/追踪）做探针，瞄准变化时调用（每帧至多一次）。
- 预算 ≤0.6ms/次；`aimAssist` 关闭时 `maxBounces` 降为 1。

### 4.7 确定性与测试接缝

- 玩法随机走注入的 `createRng(seed)`（契约 §3）；物理内部随机走 `world.seed → world.rngState` 的 `nextRandom(world)`（无闭包 mulberry32，分裂散布用）——随机状态是纯数据，跟着世界一起快照/比对；
- `stepWorld` 步进自身零随机、不读挂钟；蛋/body 自增 id 提供 `resetEggIds()` / `resetBodyIds()` 供测试与回放复位；
- 同一 `(seed, 输入序列)` 在任何机器上产生相同世界状态——回放与基准的根基。

## 5. 战斗管线（`src/combat`，Opus-2）

### 5.1 五段管线：命中 → 元素 → 反应 → 羁绊 → 飘字事件

```
world.events(contact, kind∈{enemy,brick,…})
  │ battle 桥接（modes 层）
  ▼
resolveHit(egg, target, ctx)          ← 纯函数，绝不改 egg/target/ctx
  ① computeBaseDamage   基伤×流派×暴击×护甲×抗性×BUFF×狂热
  ② applyElement        egg.element ≠ none → 目标叠层（每元素 0..3）
  ③ resolveReaction     异元素反应优先（蒸发/超导/超载），同元素 3 层强效
  ④ applyBonds          连击层暴伤、碰撞流反弹加成、直殴主蛋增伤…
  ⑤ emitFxEvents        纯数据 FxEvent[]（飘字/震屏/顿帧），不触 DOM
  ▼
HitResult { damage, crit, comboDelta, effects, reactions, splash, events, energyGain }
  │ battle 应用（唯一可变点）
  ▼
扣 HP / 上状态 / 结算 splash 二次伤害 / 英雄 onHitResolved hook
  → 总线：hit:resolved, damage:applied, element:stack, reaction:trigger,
          combo:change, enemy:die / brick:break, fx:floater …
```

职责切割：**combat 全纯函数**（可单测穷举）；**修改敌人/砖状态只发生在 battle 控制器**（modes 层）。`resolveHit` 锁定行为（v1.1 按实码修正）：伤害对 `power`、`combo` 单调不减；`power` **字段缺失**时才按 `DEFAULT_EGG_POWER = 10` 兜底，显式 `power ≤ 0` 按 0 结算；**`power === 0 → damage === 0` 已实现**（`computeDamage` 对 value ≤ 0 直接出 0，正值才走下限 1）；`comboDelta` **不是恒 1**——常规命中 1、连击流主蛋 2（`SCHOOL_MODIFIER.combo.comboGain`）、目标无敌/已死 0。对应 skip 测试可由 G1 摘除（§12.6）。

### 5.2 元素状态机（挂在敌人身上）

```
ElementState { fire:0..3, ice:0..3, thunder:0..3 }
StatusState  { burnUntil, burnDps, frozenUntil, shockUntil, armorBreakUntil, chainCharges }
```

| 反应 | 触发 | 效果（默认值，F3 可在 data 调） | 消耗 |
| --- | --- | --- | --- |
| 蒸发 | 火 ∧ 冰 | 本次伤害 ×1.4，移除冻结 | 各 -1 层 |
| 超导 | 雷 ∧ 冰 | 破甲 8s（护甲按 0 计） | 各 -1 层 |
| 超载 | 雷 ∧ 火 | 半径 60 小爆炸，伤害 = 本次 50%（入 `splash`） | 各 -1 层 |
| 灼烧 | 火 ×3 | 4s DoT，每秒 15% 触发伤 | 清 3 层 |
| 冻结 | 冰 ×3 | 冻结 1.2s（跳过行动，受伤 +25%） | 清 3 层 |
| 感电 | 雷 ×3 | 连锁跳 2 个最近敌人，各 60% 伤（入 `splash`） | 清 3 层 |

DoT 由 `tickStatuses(target, now)` 结算（battle 在 resolving 阶段每 0.1s 调一次）。

### 5.3 连击与狂热

- 连击窗口 2.5s，逐击刷新；超时归零并发 `combo:break{peak}`。云朵雀被动可冻结衰减 4s。
- 连击流大羁绊（3 同派）激活「每层 +6% 暴伤」；满 **20 层**触发**爆蛋时刻**（fever 4s，全伤害 ×1.5，期间连击不衰减），发 `fever:start/end`。
- 能量：命中 +3、破砖 +1.5（`HitResult.energyGain`），上限 100，大招消耗 100。

### 5.4 羁绊（v1.1：单一数据源在 `data/synergies.js`，`BONDS`/`BOND_TABLE` 为其战斗投影别名——已落地）

BRIEF 缺陷 2「数据契约分裂」已按下述实码闭环（`data/synergies.js` + `combat/bonds.js` + `heroes/squad.js`，Round 2 已合入）：

- **单一数值源**：`src/data/synergies.js`（F3 所有）同文件导出两张同源表——
  - `SYNERGIES`：设计语汇原始表，`{ [school]: { school, tiers:[{count:2|3|4, name, desc, mod}] } }`，四流派 `combo/brute/elemental/collide`；`mod` 用设计键（`teamAtkPct/eggBurstMult/stacksToProc/…`，键表见文件头注释）。
  - `BONDS`：combat 消费的**战斗投影**，`{ schools:{…}, races:{…} }`，每档 `{count, name, desc, mods}`，`mods` 只用 combat `MOD_SPEC` 词汇；`schools` 额外保留 `support` 档位表（预留流派，18 只无人携带，仅保证枚举完备）；`races` 里 `chicken`/`chick` 双键指同一对象（兼容 combat 的 RACE 枚举口径）；两表冲突时**以 `BONDS` 为战斗事实源**。`BOND_TABLE = BONDS` 等价别名，供历史读取链。
  - `data/index.js` 一并 re-export `SYNERGIES / BONDS / BOND_TABLE`——契约层面 BONDS 就是 SYNERGIES 的别名投影，**禁止**在 data 之外再出现流派数值表当数据源。
- **消费链（实码）**：
  - `combat/bonds.js`（O2）：主读 `SYNERGIES`，经 `synergyBondTable()` + `SYNERGY_MOD_MAP`/`translateSynergyMod` 把设计键显式翻译成 `{mods(MOD_SPEC), flags(布尔开关), raw(物理/经济域自取)}` 三份；数据第 3 档本身就是「禽王光环·X」（`crownIncluded`），不再叠通用 CROWN_AURA。历史键 `DATA.BONDS/BOND_TABLE` 以计算属性访问兼容（build 不再报「引不到 BONDS」警告）。内置 `DEFAULT_SCHOOL_BONDS` 只作打底合并（补 data 没有的 support）与缺表兜底。
  - 种族场上羁绊：读 `DATA.BONDS.races`，缺失回退内置 `DEFAULT_RACE_BONDS`。`RACE_TECH` 是**图鉴科技**（按已拥有数永久激活，肉鸽隔离），与场上人数羁绊是两个系统，不可混淆。
  - `heroes/squad.js`（O3）：`buildBonds()` 主读 `DATA.BONDS.schools`（次选 `BOND_TABLE.schools`，再回退 `SYNERGIES`），内置常量已降级为缺表兜底，不再对外充当数值源。
- **改数规则**：羁绊数值只准改 `data/synergies.js`（SYNERGIES 与 BONDS 同步维护，F3 责任）；改 combat/heroes 内置兜底表数值 = 越权（OWNERSHIP §3.7）。
- 组队时 `computeBonds(members)` 统计流派人数 → 阈值 2/3/4 激活小/大/禽王级；聚合结果注入 `HitContext.bonds` 与 TeamModifiers，combat 只读。

## 6. 英雄技能挂钩（`src/heroes`，Opus-3）

- **18 英雄权威口径（v1.1，消灭 BRIEF 缺陷 3）**：`data/heroes.js` 落地的 **18 只**为全仓唯一口径——连击 4 / 直殴 4 / 属性 5 / 碰撞 5；GDD 的云朵雀（`lark`）、倒霉鸭（`unlucky_duck`）进 `RESERVED_HERO_IDS` 预留，本版本**不进 HEROES 表、不上场、不进图鉴统计**。权威全表见 API_CONTRACT §8.3。任何「20 只」口径的文案、注释、测试一律按 18 修正；扩表 = F3 把预留 id 移入 `HEROES` 并走契约变更。
- catalog / 图鉴 / 组队等展示层必须吃 `data/heroes.js`（经 `HERO_LIST` / `HEROES`），不得自带第二份英雄名册；`core/catalog.js` 只做表现归一化（race 别名、palette 转换），不改数值。
- 数据（`data/heroes.js`）只声明 `skill: "dash_crit"` 等 id（19 个：18 招牌 + 通用大招 `golden_smash`，静态表在 `data/skills.js`）；`heroes/skills.js` 注册表把 id（经 `SKILL_ALIASES` 容错旧名）映射到 hook 实现。
- Hook 触发时机 = `heroes/constants.js` 的 `TRIGGERS`（实码）：`onBattleStart / onLaunch / onHit / onBrickBreak / onPegHit / onKill / onCombo / onEggRecycled / onTurnEnd / onUltimate / aura`；`data/skills.js` 的 `trigger` 字段（`active/onFire/onHit/onCollide/onTurnEnd/onRecall/onBattleStart/aura`）由 heroes 层映射到 TRIGGERS。
- 能力面：hook 收 `HeroApi`（生成蛋、造伤、上元素、治疗、护盾、给能量、回合修正、受限 emit），**拿不到 world / battle 内部引用**，越权即编译期可查。
- 失败隔离：battle 用 try/catch 包裹每次 hook 调用，同一 hook 连错 3 次自动禁用并 console.warn 一次——单只英雄的 bug 不允许拖死整场战斗。

## 7. 模式层（`src/modes`，Opus-4）

### 7.1 共享战斗状态机（createBattle）

```
intro → aiming ⇄ paused
          │ fire()
          ▼
        flying（蛋在场）
          │ 全蛋回收
          ▼
        resolving（DoT 结清、onTurnEnd、敌人行动/推进、漏怪扣血）
          │
          ├─ 敌全灭 & 无后续波 → won
          ├─ playerHp ≤ 0     → lost
          ├─ 有后续波          → 布下一波 → aiming
          └─ 否则              → aiming
```

冒险/肉鸽/爬塔/讨伐共用 `createBattle(config)`，差异全部收敛进 `BattleConfig`（波次表、规则、种子、修正器），模式文件只做「配置 + 结算 + 界面流转」，**禁止重写物理或战斗循环**。

### 7.2 五模式编排职责

| 模式 | 工厂 | 特有规则 | 结算 |
| --- | --- | --- | --- |
| 冒险 24 关 | `createAdventureRun(save, stageId)` | 6 章 ×4 关（章末 BOSS），layout/波次来自 `data/stages.js` | 星级（剩余生命/用时/连击峰值/清扫率）+ 金币碎片，解锁下一关 |
| 极限挑战（肉鸽） | `createRogueRun(seed)` | 隔离养成；每 2 波 `rogue:offer` 三选一（英雄/神器）；波次无尽成长 hp×1.12^wave | `bestRogueWave`，本地排行 |
| 试炼之塔 | `createTowerRun(save, floor)` / `sweepTower(save)` | 30 层；扫荡 = 对已通层调 progression 纯公式即时发奖，**不模拟战斗** | `towerFloor` 前进 |
| 讨伐魔王 | `createRaidRun(save)` | 60s 倒计时；魔王死后成长重生 hp×1.25^kills；`raid:tick` 每秒广播 | 总伤对表发档位奖，`bestRaidDamage` |
| 佛系钓鱼 | `createFishingSession(zone)` | 节奏判定小游戏（无物理世界）；3 海域 | 产出临时战斗 BUFF（攻/暴/蛋数，`battlesLeft` 计次），写入存档 |

分工再明确一次：**progression（O3）出纯公式**（肉鸽奖池生成、扫荡收益、钓鱼 BUFF роll、升级/升星成本）；**modes（O4）做编排与状态机**并调用这些公式。两者以 API_CONTRACT §10/§11 的签名为界。

### 7.3 种子策略

肉鸽 run seed = 玩家可见（可分享复现）；关卡内布局微扰 seed = `hashSeed(stageId)`；战斗结果携带 seed 供回放与 bug 报告。

## 8. 存档与迁移（`core/store`）（v1.1 按实码重写）

- 唯一 key：`localStorage["cnyd-save-v1"]`；schema 全量见 API_CONTRACT §5（已按 `core/store.js` + `progression/save.js` 实码核对）。
- 读：`loadSave()` → 缺失 / JSON 解析失败 → `defaultSave()`（已锁定，`tests/store.test.js`）；`normalizeSave(raw)` 对 settings/stats 浅合并、对 shards/heroLevels/heroStars/stageStars/dex/owned/roster 做类型校验回默认，并按 `owned` 回填 `dex`——旧档只增不炸。**注意实码语义**：`normalizeSave` 保留未知字段（`{...base, ...raw}` 展开），并不丢弃——扩展字段（如 progression 命名空间）依赖此性质存活。
- **分层所有权**：`defaultSave()` 的基础字段归 O4（`core/store.js`）；养成扩展字段（`progressionVersion / dexEntries / fishing / rogue`）由 O3 的 `ensureProgression(save)` **只增补齐**，不覆盖基础字段语义（`progression/save.js` 头注释即此约定）。
- **settings 契约（实码定案，取代 Round 1 开放项 3）**：`defaultSave().settings` 恒为 `{shake:true, reduceMotion:false}` 两键——G1 的 `toEqual` 断言锁定。`sfx / music / aimAssist` 等布尔设置走 `pref(save, key)`「**缺省即开启**」读取：玩家改动后才写入该键，默认档快照因此永不膨胀。新增布尔设置一律沿用此模式，禁止改 `defaultSave()` 快照。
- 写：`writeSave(save)` 同步整体序列化（**不发总线事件**，实码无 `save:written`）；只在「结算 / 养成操作 / 设置变更」三类时机调用，战斗中绝不逐帧写；UI 侧去抖。`resetSave()` 删 key 并返回默认档。
- 升版：字段**只增不改语义**可留 v1；破坏性变更 → `cnyd-save-v2` 新 key + `migrateV1toV2`，v1 原档保留不删。

## 9. 性能预算（480×800 · 60fps）

### 9.1 帧预算（16.6ms）

| 阶段 | 预算 | 说明 |
| --- | --- | --- |
| 物理（≤2 子步/帧） | ≤ 2.0ms | 满载 24 蛋 + 80 静态 + 12 敌 |
| 战斗桥接 + hooks | ≤ 1.0ms | 事件排空、resolveHit、状态 tick |
| Canvas 渲染 | ≤ 6.0ms | 见 9.3 分层 |
| DOM HUD / 飘字 | ≤ 1.0ms | 池化节点，class 切换不重排 |
| 音频调度 | ≤ 0.3ms | WebAudio 事件驱动 |
| 余量（GC/合成器） | ≥ 6.0ms | 必须留白 |

### 9.2 实体硬上限

同屏：蛋 ≤ **24**、静态体 ≤ **80**、敌人 ≤ 12、粒子 ≤ 200、飘字 DOM ≤ 30。上限行为 = 静默丢弃新增（记统计），绝不报错或排队。

### 9.3 渲染与内存对策

- 单 `<canvas>` 逻辑 480×800，`devicePixelRatio` 封顶 2（最大 960×1600 物理像素）。
- 静态层（墙/砖/钉/斜面）预渲染到 OffscreenCanvas，仅在砖破碎时局部重绘；动态层每帧只画蛋（插值）、敌人、粒子。
- 池化清单：Egg、粒子、飘字节点、`world.events` 元素对象、轨迹采样数组（Float 复用）。固定步内禁 `new` / 闭包 / spread。
- 降级阶梯：连续 30 帧 >20ms → 粒子减半 → 关轨迹残影 → 预测反弹数 3→2。`settings.reduceMotion` 直接进最深档。

### 9.4 基准门槛（G2 `scripts/bench.mjs` 验收线）

| 基准 | 门槛 |
| --- | --- |
| 满载 world 模拟 1s（120 步，24 蛋+80 静态） | ≤ 100ms（Node，≥12× 实时） |
| `predictTrajectory`（240 步）×1000 次 | ≤ 600ms |
| `resolveHit` ×100k 次 | ≤ 150ms |
| 波次压力：连续 50 波布置/清场 | 无内存增长趋势（池化生效） |

## 10. 健壮性与可访问性

- 存档损坏 → 默认档 + 一次性提示；localStorage 不可用（隐私模式）→ 内存档静默运行。
- AudioContext 必须在首次用户手势后惰性创建；创建失败静默禁音。
- 元素信息不只靠色相：火▲ / 冰❄ / 雷⚡ 图标随色（`catalog` 已定），色盲辅助开关加描边。
- 键盘链路完整可达教程关：←/→ 调角（2°/击）、Space 蓄力+发射、1–5 换英雄、Q 大招、Esc 暂停。
- `reduceMotion`：关震屏/顿帧/残影，飘字改淡入淡出。

## 11. 测试接缝（G1/G2 依赖）

- 全部 L0–L3 模块 Node 可 import，无 DOM 垫片需求；`ui/audio` 单测走 jsdom。
- Round 2 解锁测试即契约排期。当前状态（实码）：物理积分回收、预测逐点采样、18 英雄全员**已解锁**（`tests/physics.test.js`、`tests/heroes.test.js`）；`power:0→0` 行为**已实现**但对应 `describe.skip` 尚未摘除（`tests/combat.test.js`，见 §12.6），G1 摘除即可转绿。
- probe/bench 只允许 import 各模块 `index.js`（出口即契约的自动校验）。

## 12. 已知开放项（Round 3 期间维护）

1. ~~传送门配对与风扇力场曲线~~ **已实现**（`makePortalPair` 的 `link/facing/exitSpeed` 旋转出射、`makeFan` 的 `falloff` 线性衰减、单向门由 sim 出口降级）；Round 3 O1 继续按契约收口克隆安全与传送门语义（内部实现，出口面不变）。
2. BOSS 技能脚本：behavior id 枚举已定，逐 BOSS 的行动表由 F3 落 `data/enemies.js` 后 O4 消费。
3. ~~`defaultSave().settings` 扩展~~ **已定案**：settings 双键 + `pref()` 缺省即开启（§8），G1 断言无需再动。
4. 降级阶梯阈值（§9.3）待 G2 真机基准回填修正。
5. ~~物理切换~~ **已结案（v1.2）**：O4 已把 `core/sim.js` 重铸为 `src/physics` 之上的游戏侧适配层，预测/实弹同源（9308 采样点误差 0）；发射台常量定居 `core/sim.js`，v1.1 的迁表方案作废（§4.0）。
6. `power === 0 → damage === 0`：**实码已实现**（O2 Round 2 合入：`baseAttack` 尊重显式 0，`computeDamage` 对非正值出 0）；`tests/combat.test.js` 对应 `describe.skip` 只欠 G1 摘除（Round 3 排期）。
7. 战斗侧目前只消费 `resolveHit().damage`（经 `adapters.baseHit`），`effects/comboDelta` 未接——Round 3 O4 焦点项，接入后按 §5.1 管线补验收。
