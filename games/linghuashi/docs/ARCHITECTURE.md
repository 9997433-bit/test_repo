# 架构（Round 2 复审版）

> 基线：分支 `cursor/linghuashi-sota-a345`，commit `565e333` + 复审时点未提交的工作树
> （画阁 raw 回放、音频总线、`progression/settle.js`、契约/画阁测试等尚未提交，树仍在并行演进）。
> 接口精确签名见 `docs/API_CONTRACT.md`（下称"契约"），漂移定案见契约 §9。
> 记法：**[现状]** = 代码已如此；**[残余]** = 与目标形态仍有差距，指向契约 §9 条目。
> Round 1 审计版列出的 D1（上帝文件）、D2（结算无限刷）、D4（painter 泄漏）、
> D5（天赋未接入）、D7（六式误判）、D9（相位判定）均已在现码中消除，本版不再赘述。

## 1. 总览与设计原则

独立 Vite + 原生 ES Module，零框架。原则按优先级：

1. **纯函数域逻辑**：combat / drawing(识别·几何·合成·回放) / progression / classes 全部是无 DOM、
   无全局副作用的纯函数或封闭状态机，vitest 直测（`tests/`，复审终点 9 文件 62 用例全绿）
   + node 直跑（`scripts/probe.mjs`、`bench.mjs`、`scribble-probe.mjs`）。
2. **DOM 只出现在**：`src/ui/**`、`src/drawing/canvas.js`（画布 IO 适配器）、
   `src/drawing/replay.js`（回放画布，只写不读输入）。`src/audio/**` 只碰 WebAudio 与手势监听。
3. **单向数据流**：输入（笔迹/按键/点击）→ 域函数产出新 save/战斗状态 → `store.set`（对象或函数补丁）
   → 显式 `navigate`/局部 paint 渲染。UI 不内联规则——**[残余]** 战斗胜负结算仍内联在
   `screen-battle.finish`，`progression/settle.js` 已备好未接线（契约 §9-3）。
4. **副作用有拥有者、有析构**：每屏 render 返回 dispose，由 `ui/screens.js` 的 WeakMap 统一在
   切屏/重绘/卸载前执行；战斗 interval、keydown、教程弹层、画阁回放 rAF/timer 均已入 dispose。
5. **确定性**：识别、墨刷、合成轨迹、战斗 RNG 全部种子化（mulberry32 / hash01），
   域层禁 `Math.random`/`Date.now`——**[残余]** hub 调 `catchBeast` 未注入 rng（契约 §9-8），
   战斗种子 `stage.id.length + save.xp` 偏弱（契约 §9-17）。
6. **数据驱动**：`src/data/` 是数值唯一来源，表内自带平衡方法论注释（职业加成预算、境界曲线、
   敌人锚点、符箓定价）——**[残余]** 收兽定价兜底、天赋成本 12 仍写在代码里（契约 §9-7/12）。

## 2. 分层与模块边界

```
第4层 presentation  src/ui/**（screens 注册表 + 6 屏 + keycast/tutorial/painter-host/audio-bridge）
                    src/styles/**   src/audio/**（bus + sfx + index）
第3层 application   src/core/engine.js（boot）  core/store.js  core/events.js[死]  core/loop.js[待接线]
第2层 domain        src/combat/**   src/drawing/{geometry,features,recognizer,ink,synth,templates,replay}.js
                    src/progression/**   src/classes/**
第1层 data          src/data/**
边界件 io-adapter   src/drawing/canvas.js（指针事件 → Stroke 的唯一输入适配器）
```

### 2.1 依赖方向白名单

| 模块 | 允许 import | 明确禁止 |
| --- | --- | --- |
| `data/**` | 无 | 一切上层 |
| `combat/**` | `data/**`、combat 内部、`classes/talents`+`progression/beasts`（仅 `combat/mods.js`，该模块待删，契约 §9-1） | `ui`、store、drawing、DOM |
| `drawing/*`（除 canvas/replay） | drawing 内部 | DOM、combat、store |
| `drawing/canvas.js` `replay.js` | drawing 内部；DOM 仅限于此 | combat、store |
| `progression/**`、`classes/**` | `data/**`、彼此（settle→classes/unlock） | ui、DOM、store |
| `core/store.js` `events.js` `loop.js` | 无（store 触 localStorage） | 域层、UI |
| `core/engine.js` | `ui/screens`、`ui/audio-bridge` | 域层直调 |
| `audio/**` | audio 内部 | store、域层（静音由 ui/audio-bridge 单向推入） |
| `ui/**` | 所有下层 | 被任何下层 import；跨游戏 import |

现状合规。`ui/screen-battle.js` 同时 import `talentMult`/`beastBonus` 组装 modifiers 属预期
（presentation 组装、domain 消费）。

### 2.2 单一职责速览

- `drawing/`：点序列 → `Stroke`。识别 = features.js 三分辨率特征 + recognizer.js 打分门控；
  synth.js 合成标准轨迹（键盘施法/字形/探针共用）；replay.js 归一化存储与画阁回放；
  ink.js 增量墨刷（提按/飞白，begin/extend/end）；canvas.js 指针适配 + 纸纹烘焙。
- `combat/`：`createBattle` 封闭状态机——cast（连击/暴击/克制/五行/破甲乘区）、
  tick（冷却累计推进敌方节拍、回气、控场冻结）、intent 同步。modifiers 经
  `normalizeModifiers` 白名单进入（契约 §3.2）。
- `progression/`：save→save 纯变换（idle 幂等结算、breakthrough、beasts 收兽/合成/洗练、
  settle 恰好一次结算[待接线]）。`classes/`：天赋乘区与墨客解锁（unlockMo 唯一权威）。
- `core/`：store（函数补丁、TRANSIENT_KEYS、画阁清洗）、engine（boot/navigate/持久化钩子）、
  loop（固定步长时钟，待接线）、events（死代码）。
- `ui/`：屏幕注册表 + disposer 生命周期；painter 单例宿主；键盘施法通路；教程弹层；音频桥。

## 3. 状态管理

### 3.1 状态分层 [现状]

| 层 | 内容 | 落盘 |
| --- | --- | --- |
| save 核心 | `defaultSave()` 全字段（version/classId/realmId/xp/qiPills/buns/talents/beasts/gallery/clearedStages/时间戳/settings/tutorialDone/inkUnlocked） | ✅ `linghuashi.save.v1` |
| 运行时追加 | screen、stageId、lastResult、lastStage、lastReward | ✅（**[残余]** 会话态混入存档，契约 §9-4） |
| 会话提示 | idleClaim、idleClaimed、idleNoticeShown、notice、inkJustUnlocked | ❌ persist 时按 TRANSIENT_KEYS 剔除 |
| runtime | BattleState、painter/interval/rAF 句柄、教程弹层 | 永不入 store，屏幕闭包持有，dispose 释放 |

### 3.2 store 语义 [现状]

- `set(patch)`：顶层浅合并；**patch 可为函数** `(state) => patch`（返回空则不变更）——
  战斗结算与画阁追加均用此形式避免闭包旧值。嵌套对象必须整体替换。
- `subscribe`：有真实订阅方——`ui/audio-bridge` 监听 `settings.mute` 单向推给音频总线。
  渲染仍由显式 navigate 驱动，非响应式。
- `hydrate`：version===1 时 defaultSave 打底深度补默认（settings/talents 合并、数组校验、
  gallery 走 sanitizeGallery 清洗坏档）；version≠1 / JSON 损坏保持内存态不炸。
  **[残余]** 无 migrate 链与覆盖前备份，下次 persist 会覆盖旧盘（契约 §9-5）；
  在 migrate 落地前冻结 version 与字段删除。
- 画阁预算：`GALLERY_LIMIT=24` 笔 × `GALLERY_POINTS=32` 点，满档 JSON <64KB（测试锁定）。

### 3.3 结算幂等（关键不变量）

- 战斗内：`finished` 后 `tick/cast` 全 no-op（t 不推进、end 日志恰一条），契约测试锁定。
- 屏幕层：`finish()` 由局部 `settled` 标志 + stopClock 保证只跑一次，随即 navigate("result")；
  旧版"每 200ms 重复发奖"已根除。**[残余]** 恰好一次目前是 UI 局部保证，
  `settleBattle` 的 `settledBattleId` 令牌机制未接线（契约 §9-3）——跨屏/再入场景无令牌兜底。
- 挂机：`tickIdle` 自身幂等（同 nowMs 二次调用零产出），hub 的横幅另有 `idleNoticeShown`
  会话闸门防重复弹播。
- 墨客解锁：`unlockMo` 幂等（已解锁原样返回同一引用），battle-finish 与 settle.js 均以
  引用比较判定"本次新解锁"再置一次性 `inkJustUnlocked`。

## 4. 状态机

### 4.1 屏幕状态机 [现状]

```
splash ─开卷入世→ class ─以此入世[需 classId]→ hub ⇄ gallery
splash ─续写残卷→ (classId? hub : class)
hub ─选秘境[set stageId]→ battle ─finished(一次)→ result ─回枢纽→ hub
battle ─收笔撤退/Esc→ hub          result ─再战→ battle   result ─画阁→ gallery
启动恢复：battle 深链降级 hub；未知屏降级 splash（core/engine.entryScreen）
```

守卫现状:进入 class 确认按钮有 classId 闸门；battle 缺 stageId 静默落 `STAGES[0]`；
result 深链渲染持久化的 lastResult（语义为"上一场结果"，非假数据）。无集中守卫表——
可接受，因所有入口按钮本身受状态控制;深链硬化属低优先级。

**转移副作用归属**：hub 进屏执行一次 `tickIdle`；battle 结束 `finish()` 内联结算
（目标：移交 settleBattle）；除此之外渲染函数不改 save。

### 4.2 战斗会话 [现状]

```
mount ─(教程未读? 弹层暂停 : startClock)→ running(setInterval 200ms 驱动 battle.tick)
running ─cast(手绘 onStroke / 键盘 keyboardStroke)─ 同步单帧完成
running ─finished→ settled(stopClock, 一次性结算, navigate result)
任意态 ─dispose→ 清 interval/rAF/keydown/painter 回调/教程弹层
敌方节拍：battle 内部 cooldownMs 冷却累计（非相位），被控冻结，单 tick 追击 ≤64 刀；
intent(观势/蓄势 400ms/被缚) 由 battle 每步同步，UI 渲染预警。
```

不变量（契约 §7）：finished 幂等 ✅ 已测；同 `{player,enemy,seed}`+同操作序列可回放
（RNG 确定，crit=0 时不掷骰保证旧序列不变）✅ 结构成立、未加深比较测试；
**[残余]** 时钟为裸 setInterval，后台标签被钳 ≥1s（battle 自身抗抖动，但违反单时钟原则），
`core/loop.startLoop` 待接线（契约 §9-16）。

### 4.3 笔迹状态机 [现状]

```
idle ─pointerdown/touchstart─▶ inking（coalesced 采样、recognizer.consume、brush.extend 增量出墨）
inking ─pointerup/cancel/leave/touchend─▶ finalize → Stroke → onStroke → 墨迹淡出(fadeMs 520)
```

- destroy 全量解绑（pointer×5 + touch×3 + window.resize），旧 D4 已修。
- **[残余]** pointercancel 按收笔处理而非丢弃（契约 §9-13）；pointer+touch 双栈并存，
  混合设备理论上可双触发；识别阈值绝对像素（契约 §9-14）。
- painter 是跨战斗单例（`ui/painter-host`）：canvas 节点搬进搬出、只解回调不 destroy——
  刻意设计，规避重复挂载成本；其头注释关于 resize 泄漏的说法已过期（契约 §9-18）。

## 5. 渲染与可达性

- 屏幕级：`el()` 构建节点树一次性挂载；切屏走 disposer → 清 root → 重建。
- 战斗高频区走**节点引用局部更新**：血/气/盾/敌血四条 meter、意图、连击、符键 aria-disabled
  逐字段 set；战斗日志增量 append（对账 lastLogTop，DOM 上限 40 条）——旧版整屏重拼已根除。
- 可达性 [现状]：live region 双通道播报（polite/assertive）、meter=progressbar+valuetext、
  符键条 `aria-keyshortcuts` + 数字键 1-6 施法、Esc 撤退、教程模态焦点陷阱、
  选职 radiogroup 方向键巡航、日志 `role=log aria-live=polite`、画阁回放尊重
  `prefers-reduced-motion` 与 `settings.reducedMotion`。
- 用户文本（playerName）经 `el(..., {text})` 走 textContent，无 innerHTML 拼接注入面。

## 6. 游戏循环与时基

- 战斗逻辑时间只认 `state.t`（tick 注入 dt），域层不读 Date.now。
- 挂机走 `tickIdle(save, nowMs)` 时间戳差，与战斗时基完全隔离。
- **[残余]** UI 驱动层：battle 屏 setInterval(200) 应迁 `startLoop`（rAF+accumulator，
  visibilitychange 暂停）；`createTicker` 已有测试。
- 音频时基：AudioContext 懒建 + 首手势 resume + master 增益统一静音（`audio/bus.js`）。

## 7. 性能预算（沿用，附现状）

| 项 | 预算 | 现状/测量 |
| --- | --- | --- |
| classifyStroke 单笔 | p95 ≤4ms | `npm run bench` 内建 exit 2 红线；另有识别准确率统计与 scribble 硬误报 ≤5% 探针 |
| battle.tick+cast | ≤0.5ms | 未入 bench（契约 §7-13 残余） |
| 笔迹跟手 | pointermove→上屏 ≤1 帧 | 增量墨刷 + coalesced 采样；未做 long task 实测 |
| 屏幕切换 | ≤50ms | 未打 mark |
| 战斗每逻辑步 UI | ≤2ms，无变化 0 DOM 写 | 节点引用 + 日志增量已达构；未量测 |
| 存档 | 序列化 ≤5ms、JSON <64KB | 64KB 有测试锁定 |
| 句柄泄漏 | battle↔hub 往返 N 次不增长 | 结构上已闭环（disposer+单例 painter）；无自动化测试（契约 §7-12） |
| Canvas | DPR≤2；纸纹离屏烤一次、种子噪点 | ✅ 已实现（旧"每笔重绘+Math.random"已根除） |
| 打包 | js+css gzip ≤150KB | 天花板防腐，未复测 |

## 8. 多游戏隔离（`games/<slug>/`，硬约束不变）

1. 每游戏独立 `package.json`/`node_modules`/`vite.config.js`/`index.html`/`dist`；跨游戏 import（含 `../` 穿越）一律禁止。
2. localStorage 前缀 `<slug>.`（本游戏 `linghuashi.save.v1`，合规）。
3. 端口独占登记（本游戏 dev/preview 4173）。
4. 设计令牌走 `src/styles/tokens.css` 的 `:root` 变量；无共享 DOM。
5. 共享代码：初期禁止；≥2 游戏重复的工具提级 `games/_shared/<pkg>/` 显式版本化。
6. 每游戏自带 test/bench/probe scripts，根目录不聚合。
7. 文档 `docs/` 自治；跨游戏进度只写 `/.agent_workspace/PROGRESS.md`。

## 9. 测试策略分层 [现状]

| 层 | 载体 | 现状 |
| --- | --- | --- |
| 纯函数单测 | `tests/{stroke,combat,progression,store,loop,templates}.test.js` | ✅ Round 1 的 35 用例已扩到复审终点 62 |
| 契约测试 | `tests/contract.test.js`（finished 幂等 / unlockMo 六式 / tickIdle 幂等） | ✅ 已建，覆盖 3/13 条不变量（缺口见契约 §7） |
| 画阁回放 | `tests/gallery.test.js`（raw 往返判型、清洗、上限、64KB 预算） | ✅ 18 用例 |
| 音频 | `tests/audio.test.js`（总线静音/懒建/手势 resume） | ✅ 复审终点新增 |
| 冒烟探针 | `scripts/probe.mjs`（识别→战斗链路 + scribble 误报） | ✅ |
| 性能红线 | `scripts/bench.mjs`（p95≤4ms exit 2 + 准确率）、`scribble-probe.mjs`（硬误报 ≤5%） | ✅；tick/cast 项缺 |
| 手动/E2E | 触屏、键盘全流程、60fps | 未自动化 |

## 10. 残余缺陷与死代码（Round 2 复审定案）

全部细节与处置见契约 §9，此处按危害排序摘要：

| # | 问题 | 位置 | 契约条目 |
| --- | --- | --- | --- |
| R1 | 三套 modifiers 聚合并存：battle 只认 `normalizeModifiers` 白名单，`computeMods`/`battleModifiers` 传入即整体静默失效（且 ACCEPTANCE 还在推荐后者） | `combat/mods.js`、`classes/talents.js` | §9-1/2 |
| R2 | `settle.js` 恰好一次结算未接线，UI 内联双轨 | `screen-battle.finish` | §9-3 |
| R3 | `beastValue/rerollPassive/evolveBeast` 引用未定义 `PASSIVE_BASE/PASSIVES`，一经调用即 ReferenceError（现 UI 不可达，潜伏雷） | `progression/beasts.js` | §9-7 |
| R4 | 会话字段落盘、无 migrate 链、version≠1 下次 persist 覆盖旧盘 | `core/store.js` | §9-4/5 |
| R5 | `startLoop` 未接线（裸 setInterval）、弱战斗种子、catchBeast 未注入 rng | `screen-battle`、`core/loop.js` | §9-8/16/17 |
| R6 | 双轨标准轨迹（synth vs templates）、unlock shim 残留、createBus 死代码、reaction().crit 死字段 | drawing/progression/core/combat | §9-6/9/11/15 |
| R7 | pointercancel 语义（收笔≠丢弃）、pointer+touch 双栈、识别阈值绝对像素 | `drawing/canvas.js`、`recognizer.js` | §9-13/14 |
| R8 | 契约测试缺口：结算跨屏恰好一次、modifiers 生效对照、零泄漏、tick/cast bench | `tests/`、`scripts/` | §7-10~13 |

## 11. 现行文件结构（对照 Round 1 目标，已达成拆分）

```
src/core/         store.js  engine.js  loop.js[待接线]  events.js[死]
src/ui/           screens.js(注册表+disposer)  screen-{splash,class,hub,battle,result,gallery}.js
                  keycast.js  painter-host.js  tutorial.js  audio-bridge.js  dom.js  components.js  ui.css
src/combat/       battle.js  elements.js  ai.js  mods.js[待删]  index.js
src/progression/  idle.js  realm.js  beasts.js  settle.js[待接线]  unlock.js[shim]
src/classes/      talents.js  unlock.js(墨客解锁权威)
src/drawing/      canvas.js  recognizer.js  features.js  geometry.js  ink.js  synth.js
                  templates.js[仅测试]  replay.js  index.js
src/audio/        bus.js  sfx.js  index.js
```

推进顺序建议：R1（收敛 modifiers 单一实现）→ R2（settle 接线 + 契约测试）→ R3（beasts 常量补齐）
→ R4（migrate 链）→ 其余并行。
