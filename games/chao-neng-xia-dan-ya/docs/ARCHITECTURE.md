# 超能下蛋鸭 · 系统架构（Round 1 契约 v1.0）

- 所有者：Fable-1（架构）。配套：`docs/API_CONTRACT.md`（签名/事件/存档）、`docs/OWNERSHIP.md`（文件所有权）。
- 地位：本文件与 API_CONTRACT 是全体代理的**编码依据**。实现与契约冲突时，先改契约（走变更流程，见 API_CONTRACT §0），再改代码。
- 基线事实：本文档与仓库现有代码及 G1 已合入测试（`tests/*.test.js`）逐条核对过，不与任何已锁定断言冲突。

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
| ui | √(展示) | √ | √(仅 predictTrajectory) | — | — | √(只读查询) | √ | 内部 | — |
| audio | — | √(events) | — | — | — | — | — | — | 内部 |
| main.js | 组合根：可 import 所有 index.js |

注 1：heroes 不直接改 `world`；生成蛋、造伤等能力全部经 `HeroApi`（modes 注入的能力面），见 API_CONTRACT §8。
注 2：`core` 是零游戏逻辑的底座（总线/随机/存档/主循环驱动），不 import 任何上层。
注 3：physics 完全自包含（自带常量与数学），保证可单文件夹拷走复用。

## 3. 一帧的生命周期（主管线）

```
requestAnimationFrame(t):
  dtFrame = clamp((t - last)/1000, 0, 1/30)        // 掉帧上限，防积分螺旋
  acc += dtFrame
  steps = 0
  while acc >= FIXED_DT && steps < MAX_STEPS_PER_FRAME(4):
    session.step(FIXED_DT)                          // ← 唯一推进游戏状态的地方
    acc -= FIXED_DT; steps++
  alpha = acc / FIXED_DT
  renderer.render(session.getSnapshot(), alpha)     // 蛋按 prevX/prevY↔x/y 插值
```

`session.step` 内部顺序（战斗类模式）：

1. 消费输入指令队列（fire / castUltimate / switchHero —— UI 只入队，不直接改状态）；
2. `stepWorld(world, FIXED_DT)`（物理推进，产出 `world.events`）；
3. 排空 `world.events` → 战斗桥接：contact→`resolveHit`→应用伤害/状态→英雄 hook→总线事件；
4. 状态 DoT tick、连击计时、能量回复、模式计时（讨伐 60s 等）；
5. 回合/波次/胜负状态机迁移（见 §7.1）。

**顺序即契约**：渲染永远读快照 + 插值，绝不在 rAF 里直接推物理；总线事件在第 3 步集中发出，同一固定步内先物理后战斗后 UI 通知。

## 4. 物理架构（`src/physics`，Opus-1）

### 4.1 坐标与单位

- 逻辑世界 480×800，原点左上，x 向右，y 向下（与 Canvas 一致）；单位 px、秒。重力 `GRAVITY = 1680 px/s²` 向下。
- 发射台位于 (240, 60)；瞄准角以正下方为 0，左负右正，钳制 ±70°；初速 220–720 px/s（蓄力线性映射）。

### 4.2 实体

- **Egg（动态圆）**：`radius` 10–14（默认 12），`restitution` 0.78–0.92（默认 0.85），空气阻力极低（`EGG_DRAG = 0.02/s`）。带 `prevX/prevY` 供渲染插值、`generation`（0 主蛋，分裂 +1，**上限 2**）、`bounces` 累计反弹数（碰撞流读取）、`pierce` 剩余穿透。字段全表见 API_CONTRACT §6.2。
- **StaticBody（静态体）**：`shape ∈ {segment, circle, aabb}` 描述几何，`kind` 描述玩法材质（wall/ramp/brick/peg/bomb-brick/ice/portal/pad/enemy…）。segment 为胶囊线段（`x1,y1,x2,y2,radius=半厚,oneWay`），aabb 以中心 + 半宽高（`x,y,hw,hh`），circle 为 `x,y,r`。`sensor:true` 只触发事件不反弹（传送门/触发区）。敌人以 `kind:'enemy'` 的 circle 挂进 statics，经 `entityId` 关联战斗实体——蛋飞行期间敌人不动，回合间隔才移动。
- **Field（力场）**：不参与碰撞，积分前按区域叠加加速度/阻尼：风扇、磁铁（朝最近敌人加速）、减速区。

### 4.3 固定步进管线（`stepWorld` 内部，顺序固定）

```
0. 清空 world.events（上一步事件必须已被调用方排空）
1. 力场采样：对每蛋叠加 field 加速度 + 重力
2. 半隐式欧拉：v += a·dt → 阻尼/限速(MAX_SPEED=2600) → 位移
3. 子步 CCD：单子步位移 > radius×0.5 时细分（最多 MAX_SUBSTEPS=8），防高速穿隧
4. 碰撞：蛋 vs 静态（宽相网格→窄相 圆vs线段/AABB/圆）→ 位置修正 + 反射
5. 蛋 vs 蛋：≤24 蛋两两（≤276 对）暴力检测，等质量弹性交换
6. 事件入队：contact / egg-egg / sensor（含命中点、法线、冲击速度）
7. 睡眠：|v| < 8 px/s 连续 0.6s（发射后 0.2s 保护期内不判）→ sleep 事件
8. 回收：y > 820 或越侧界或 sleep → 从 world.eggs 移除、对象回池、recycle 事件
```

防御：任何蛋出现非有限坐标/速度 → 立即按 `reason:'oob'` 回收，世界时钟保持有限（已被 `tests/physics.test.js` 锁定）。

### 4.4 宽相

静态体 ≤80：入世界时登记进均匀网格（cell 80px，480×800 → 6×10），砖破碎调 `removeStatic` 时增量摘除；蛋查询自身包围盒覆盖的 cell。蛋 vs 蛋不进网格（数量小，暴力更快且零维护）。每个 body 缓存 `aabb{minX..maxX}`，改坐标必须调 `computeAABB`。

### 4.5 分裂蛋

`spawnSplitEggs(world, parent, {count, spread, rng})`：子蛋继承父蛋 **0.7 倍速度**、`generation+1`（≥2 不再分裂）、扇形展开角 `spread`；受 `MAX_EGGS = 24` 硬上限约束——超额直接不生成并记入 world 统计（不排队、不报错）。分裂只由 heroes/combat 层经 HeroApi 触发，物理不自发分裂。

### 4.6 弹道预测

`predictTrajectory(origin, velocity, world, steps, opts)`：与 `stepWorld` **共用同一套积分与碰撞代码**（预览必须与实弹轨迹逐像素一致），但：纯函数不写 world、忽略动态蛋、跳过一切随机抖动、命中敌人或达 `maxBounces`（默认 3）提前截断。每固定步一个采样点，空世界恰好返回 `steps` 个（Round 2 解锁测试锁定）。预算 ≤0.6ms/次；UI 瞄准时每帧最多调用一次（节流）。

### 4.7 确定性与测试接缝

- body 自增 id 提供 `resetBodyIds()` 供测试复位；
- `stepWorld` 自身零随机；需要随机的行为（分裂散布）由调用方传 `rng`；
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

职责切割：**combat 全纯函数**（可单测穷举）；**修改敌人/砖状态只发生在 battle 控制器**（modes 层）。`resolveHit` 已锁定行为：伤害对 `power`、`combo` 单调不减；`power` 缺省 10；`comboDelta` 恒 1；Round 2 起 `power === 0 → damage === 0`。

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

### 5.4 羁绊

组队时 `computeBonds(members)` 统计五流派（combo/brute/elemental/collide/support）人数 → 阈值 2/3/4 激活小/大/禽王级；效果以声明式 `BondEffect`（`data/bonds.js`，F3 所有）注入 `HitContext.bonds` 与 TeamModifiers，combat 只读。

## 6. 英雄技能挂钩（`src/heroes`，Opus-3）

- 数据（`data/heroes.js`）只声明 `skill: "dash_crit"` 等 id；`heroes/skills/` 注册表把 id 映射到 hook 实现。20 个 skill id 与 hook 类型全表见 API_CONTRACT §8.3。
- Hook 生命周期：`aura`（开战静态计算一次）→ `modifyShot` → `onShotFired` → `onEggContact` → `onHitResolved` → `onEggRecycled` → `onTurnEnd` → `onBattleStart` / `onUltimate`。
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

## 8. 存档与迁移（`core/store`）

- 唯一 key：`localStorage["cnyd-save-v1"]`；schema 全量见 API_CONTRACT §5。
- 读：`loadSave()` → JSON 解析失败/缺失 → `defaultSave()`（已锁定）；`normalizeSave(raw)` 对嵌套对象（settings/stats/dex…）做**深合并**，未知字段丢弃，非法值回默认——旧档只增不炸。
- 写：只在「结算 / 养成操作 / 设置变更」三类时机 `writeSave`，战斗中绝不逐帧写；UI 侧 300ms 去抖。
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
- Round 2 解锁测试（`describe.skip`）即契约排期：物理积分回收、预测逐点采样、`power:0→0`、18 英雄全员——各所有者落地后由 G1 摘 skip。
- probe/bench 只允许 import 各模块 `index.js`（出口即契约的自动校验）。

## 12. 已知开放项（Round 2 输入）

1. 传送门配对与风扇力场曲线：契约只定形状（sensor circle / Field），参数由 O1 实测校准后回填 API_CONTRACT §6.1。
2. BOSS 技能脚本：behavior id 枚举已定，逐 BOSS 的行动表由 F3 落 `data/enemies.js` 后 O4 消费。
3. `defaultSave().settings` 扩展会碰 G1 现有 `toEqual` 断言——O3 落地时 G1 需同步更新（OWNERSHIP §4 协调项）。
4. 降级阶梯阈值（§9.3）待 G2 真机基准回填修正。
