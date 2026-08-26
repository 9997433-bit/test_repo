# 架构（Round 3 终审版）

> 终审基线：分支 `cursor/linghuashi-sota-a345`，commit `6361f70` + 终审时点工作树
> （Round 3 收口改动——migrate 链与备份、settle 接线、灵兽四门 UI、轨迹几何单源化、
> `combat/mods.js` 删除、`reaction.crit` 消费、pointercancel 丢弃、减动效开关——均已落树）。
> 接口精确签名见 `docs/API_CONTRACT.md`（下称"契约"）；已收口对照见契约 §9-A，
> 剩余漂移与死代码裁定见契约 §9-B。
> 记法：**[现状]** = 代码已如此并经门禁核实；**[残余]** = 与目标形态仍有差距，指向契约 §9-B 条目。
> 终审门禁实测：`vitest run` 14 文件 105 用例全绿；`npm run probe` exit 0（乱涂硬误报 2%，
> 红线口径含 cloud）；`npm run bench` exit 0（p95 ≤0.16ms、3000 笔 0 误配）；
> `vite build` 49 模块，JS gzip ≈34.6KB + CSS gzip ≈5.3KB。

## 1. 总览与设计原则

独立 Vite + 原生 ES Module，零框架。原则按优先级：

1. **纯函数域逻辑**：combat / drawing(识别·几何·合成·回放) / progression / classes 全部是无 DOM、
   无全局副作用的纯函数或封闭状态机，vitest 直测 + node 直跑
   （`scripts/probe.mjs`、`bench.mjs`、`scribble-probe.mjs`）。
2. **DOM 只出现在**：`src/ui/**`、`src/drawing/canvas.js`（画布 IO 适配器）、
   `src/drawing/replay.js`（回放画布，只写不读输入）。`src/audio/**` 只碰 WebAudio 与手势监听。
   `ui/motion-bridge.js` 是唯一写 `<html>` 属性的模块（`data-reduced-motion`）。
3. **单向数据流**：输入（笔迹/按键/点击）→ 域函数产出新 save/战斗状态 → `store.set`（对象或函数补丁）
   → 显式 `navigate`/局部 paint 渲染。UI 不内联规则——**[已收口]** 战斗结算走
   `progression/settle.js` 的 `beginBattle/settleBattle`，`screen-battle.finish` 的内联结算已删；
   灵兽四门（收伏/合成/洗练/放生）UI 只调 `progression/beasts.js`，不自己定价。
4. **副作用有拥有者、有析构**：每屏 render 返回 dispose，由 `ui/screens.js` 的 WeakMap 统一在
   切屏/重绘/卸载前执行；战斗 interval、keydown、教程弹层、画阁回放 rAF/timer、放生确认态均入 dispose。
5. **确定性**：识别、墨刷、合成轨迹、战斗 RNG 全部种子化（mulberry32 / hash01），
   域层禁 `Math.random`/`Date.now`（默认参形式提供，调用方注入）——
   **[残余]** beast-panel 调 `catchBeast/rerollPassive` 未注入 rng（契约 §9-B-7），
   战斗种子 `stage.id.length + save.xp` 偏弱（契约 §9-B-6）。
6. **数据驱动**：`src/data/` 是数值唯一来源，表内自带平衡方法论注释——**[已收口]** 灵兽养成定价
   （收 36 包子/洗 18 丹/合 30 丹×星）已上移 data 层；**[残余]** 收兽丹替付价 8、
   hub 的天赋成本本地双写仍在代码里（契约 §9-B-8/9）。

## 2. 分层与模块边界

```
第4层 presentation  src/ui/**（screens 注册表 + 6 屏 + keycast/tutorial/painter-host/beast-panel
                              + audio-bridge/motion-bridge）  src/styles/**  src/audio/**
第3层 application   src/core/engine.js（boot） core/store.js（v2+migrate） core/loop.js[startLoop 残余]
                    core/events.js[死→删]
第2层 domain        src/combat/{battle,elements,ai}.js
                    src/drawing/{geometry,features,recognizer,ink,synth,templates,replay}.js
                    src/progression/{idle,realm,beasts,settle}.js  src/classes/{talents,unlock}.js
第1层 data          src/data/**
边界件 io-adapter   src/drawing/canvas.js（指针事件 → Stroke 的唯一输入适配器）
```

### 2.1 依赖方向白名单 [现状合规]

| 模块 | 允许 import | 明确禁止 |
| --- | --- | --- |
| `data/**` | 无 | 一切上层 |
| `combat/**` | `data/**`、combat 内部（mods.js 已删，跨层入口只剩 `normalizeModifiers` 白名单） | `ui`、store、drawing、progression、classes、DOM |
| `drawing/*`（除 canvas/replay） | drawing 内部 | DOM、combat、store |
| `drawing/canvas.js` `replay.js` | drawing 内部；DOM 仅限于此 | combat、store |
| `progression/**`、`classes/**` | `data/**`、彼此（settle→classes/unlock） | ui、DOM、store |
| `core/store.js` `loop.js` | 无（store 触 localStorage） | 域层、UI |
| `core/engine.js` | `ui/screens`、`ui/audio-bridge`、`ui/motion-bridge` | 域层直调 |
| `audio/**` | audio 内部 | store、域层（静音由 ui/audio-bridge 单向推入） |
| `ui/**` | 所有下层 | 被任何下层 import；跨游戏 import |

`ui/screen-battle.js` import `talentMult`/`beastBonus` 组装 modifiers 属预期
（presentation 组装、domain 经 `normalizeModifiers` 消费）；Round 2 的反例
`combat/mods.js`（combat 反向吃 classes/progression）已随该文件删除而消失。

### 2.2 单一职责速览

- `drawing/`：点序列 → `Stroke`。识别 = features.js 三分辨率特征 + recognizer.js 打分门控
  （统一信任度 trust=coherence×(1−0.65·chaos)、SCRIBBLE_FLOOR 0.64 降级，契约 §2.1）；
  **synth.js 是标准轨迹几何唯一来源**，templates.js 与 `scripts/trajectories.mjs` 只是取景层
  （契约 §2.5，禁止第四处再造几何）；replay.js 归一化存储与画阁回放；ink.js 增量墨刷；
  canvas.js 指针适配 + 纸纹烘焙 + cancel 丢弃语义。
- `combat/`：`createBattle` 封闭状态机——cast（连击/暴击[含金雷引 reaction.crit]/克制/五行/破甲乘区）、
  tick（冷却累计推进敌方节拍、回气、控场冻结）、intent 同步。modifiers 经
  `normalizeModifiers` 白名单进入（扁平键 + talent/beast 嵌套糖，契约 §3.2）。
- `progression/`：save→save 纯变换（idle 幂等结算[产包子]、breakthrough、beasts 收/合/洗/放、
  settle 恰好一次结算[settledBattleId 令牌]）。`classes/`：天赋乘区与墨客解锁（unlockMo 唯一权威）。
- `core/`：store（函数补丁、TRANSIENT_KEYS、migrate 链 + `.bak` 备份、画阁清洗）、
  engine（boot/navigate/持久化钩子/双桥接线）、loop（createTicker 在测，startLoop 残余）。
- `ui/`：屏幕注册表 + disposer 生命周期；painter 单例宿主（release 即 cancel）；键盘施法通路；
  灵兽栏（两步放生确认）；教程弹层；音频桥 + 动效桥。

## 3. 状态管理

### 3.1 状态分层 [现状]

| 层 | 内容 | 落盘 |
| --- | --- | --- |
| save 核心 | `defaultSave()` 全字段，version:2（新增 strokeStats、battleSeq；契约 §5.1/§8） | ✅ `linghuashi.save.v1`（键名冻结，版本认 JSON 内 version） |
| 运行时追加 | screen、stageId、lastResult、lastStage、lastReward | ✅（**[残余]** 契约 §9-B-11；entryScreen 消毒 + 未登记键保留使其无害） |
| 会话提示 | idleClaim、idleClaimed、idleNoticeShown、notice、inkJustUnlocked、**battleId、settledBattleId** | ❌ persist 与 migrate 均按 TRANSIENT_KEYS 剔除 |
| runtime | BattleState、painter/interval/rAF 句柄、教程弹层、放生确认选中态 | 永不入 store，屏幕闭包持有，dispose 释放 |

### 3.2 store 语义 [现状 — 原§9-4/5 收口]

- `set(patch)`：顶层浅合并；**patch 可为函数** `(state) => patch`（返回空则不变更）——
  开战登记、结算、画阁追加均用此形式避免闭包旧值。嵌套对象必须整体替换。
- `subscribe`：两个真实订阅方——`ui/audio-bridge`（settings.mute → 音频总线）、
  `ui/motion-bridge`（settings.reducedMotion → `<html data-reduced-motion>`）。
  渲染仍由显式 navigate 驱动，非响应式。
- `hydrate`：读盘 → `migrate(raw)` 纯函数迁移链（v0→v1 画阁字符串条目升级、v1→v2 灵兽补 uid）
  → normalizeSave 逐字段夹值 + 未登记键保留。盘上非当前版本/坏 JSON/更高版本 ⇒
  **先抄原始串到 `SAVE_BACKUP_KEY` 再继续**；migrate 返回 null ⇒ 保持内存态不炸（已留备份）。
  Round 2 的"下次 persist 覆盖旧盘"风险已由备份闭环消除。
- **迁移三件套硬约束**（契约 §8/§10）：任何字段增删改 ⇒ SAVE_VERSION+1 + MIGRATIONS 补一步
  + 往返单测；v2 即样例（`tests/save-migrate.test.js` 16 用例）。
- 画阁预算：`GALLERY_LIMIT=24` 笔 × `GALLERY_POINTS=32` 点，满档 JSON <64KB（测试锁定）。

### 3.3 结算幂等（关键不变量）

- 战斗内：`finished` 后 `tick/cast` 全 no-op（t 不推进、end 日志恰一条），契约测试锁定。
- 屏幕层 **[已收口 原§9-3]**：挂载时 `store.set(prev => beginBattle(prev, stage))` 登记
  battleId（battleSeq 落盘防跨会话撞号）；`finish()` 调 `settleBattle`——同 battleId 已结算
  ⇒ 原引用返回，跨屏/再入均有令牌兜底；UI 只留局部 `settled` 标志防重复 navigate。
  覆盖：`tests/round3.test.js`「同一 battleId 只发一次奖励」。
- 挂机：`tickIdle` 自身幂等（同 nowMs 二次调用零产出），hub 横幅另有 `idleNoticeShown` 会话闸门。
- 墨客解锁：`unlockMo` 幂等（已解锁原样返回同一引用），settle.js 统一走一次并以引用比较
  判定"本次新解锁"再置一次性 `inkJustUnlocked`。
- 灵兽放生：uid 定位，找不到（重复点击/坏档）只写 notice——返还不可重复领；
  返还 18 包子 < 收价 36 包子，收放循环恒亏。

## 4. 状态机

### 4.1 屏幕状态机 [现状]

```
splash ─开卷入世→ class ─以此入世[需 classId]→ hub ⇄ gallery
splash ─续写残卷→ (classId? hub : class)
hub ─选秘境[set stageId + beginBattle]→ battle ─finished(settleBattle 恰好一次)→ result ─回枢纽→ hub
battle ─收笔撤退/Esc→ hub          result ─再战→ battle   result ─画阁→ gallery
启动恢复：battle 深链降级 hub；未知屏降级 splash（core/engine.entryScreen）
```

守卫现状：进入 class 确认按钮有 classId 闸门；battle 缺 stageId 静默落 `STAGES[0]`；
result 深链渲染持久化的 lastResult（语义为"上一场结果"，非假数据）。无集中守卫表——
可接受，因所有入口按钮本身受状态控制。

**转移副作用归属**：hub 进屏执行一次 `tickIdle`；battle 挂载 `beginBattle`、结束 `settleBattle`；
除此之外渲染函数不改 save。

### 4.2 战斗会话 [现状]

```
mount ─beginBattle 登记─(教程未读? 弹层暂停 : startClock)→ running(setInterval 200ms 驱动 battle.tick)
running ─cast(手绘 onStroke / 键盘 keyboardStroke)─ 同步单帧完成
running ─finished→ settled(stopClock, settleBattle 令牌结算, navigate result)
任意态 ─dispose→ 清 interval/rAF/keydown/painter 回调(含 cancel)/教程弹层
敌方节拍：battle 内部 cooldownMs 冷却累计（非相位），被控冻结，单 tick 追击 ≤64 刀；
intent(观势/蓄势 400ms/被缚) 由 battle 每步同步，UI 渲染预警。
```

不变量（契约 §7）：finished 幂等 ✅、结算恰好一次 ✅、金雷引暴击抬升 ✅ 均已入测；
同 `{player,enemy,seed}`+同操作序列可回放（crit 掷骰仅在 critChance>0 时消耗 rng，
默认配置旧序列不变）✅ 结构成立。
**[残余]** 时钟为裸 setInterval，后台标签被钳 ≥1s（battle 自身抗抖动，但违反单时钟原则），
`core/loop.startLoop` 接线或删除，不许再悬空一轮（契约 §9-B-3）。

### 4.3 笔迹状态机 [现状 — 原§9-13 收口]

```
idle ─pointerdown/touchstart─▶ inking（coalesced 采样、recognizer.consume、brush.extend 增量出墨）
inking ─pointerup/pointerleave/touchend─▶ finalize → Stroke → onStroke → 墨迹淡出(fadeMs 520)
inking ─pointercancel/touchcancel/painter.cancel()─▶ 丢弃（不 finalize、不回调、reset 缓冲、墨迹淡出）
```

- destroy 全量解绑（pointer×5 + touch×4 + window.resize）。
- cancel 丢弃语义有 6 用例锁定（半截笔不施法、不拼进下一笔、cancel 后可复画）。
- painter 是跨战斗单例（`ui/painter-host`）：canvas 节点搬进搬出、release 时解回调 + `cancel()`
  ——刻意设计，规避重复挂载与重烤纸纹成本。**[残余]** 其头注释关于 resize 泄漏的说法已过期
  （契约 §9-B-12）；pointer+touch 双栈并存、识别阈值绝对像素（契约 §9-B-10）。

## 5. 渲染与可达性

- 屏幕级：`el()` 构建节点树一次性挂载；切屏走 disposer → 清 root → 重建。
- 战斗高频区走**节点引用局部更新**：血/气/盾/敌血四条 meter、意图、连击、符键 aria-disabled
  逐字段 set；战斗日志增量 append（对账 lastLogTop，DOM 上限 40 条）。
- 可达性 [现状]：live region 双通道播报（polite/assertive）、meter=progressbar+valuetext、
  符键条 `aria-keyshortcuts` + 数字键 1-6 施法、Esc 撤退、教程模态焦点陷阱、
  选职 radiogroup 方向键巡航、日志 `role=log aria-live=polite`、灵兽栏按钮态 aria-pressed。
- 减动效 **[已收口 验收 E5]** 双通路等价：系统 `prefers-reduced-motion`（styles/ink.css + ui.css
  媒体查询）与游戏内 `motionToggle`（settings.reducedMotion → motion-bridge →
  `<html data-reduced-motion="true">`，ui.css 复述同一批动效关停）；画阁回放与键盘施法回显
  均尊重 `motionReduced()`。boot 时 `bindMotionSettings` 先于渲染，减动效存档不先看一遍入场动画。
- 用户文本（playerName）经 `el(..., {text})` 走 textContent，无 innerHTML 拼接注入面。

## 6. 游戏循环与时基

- 战斗逻辑时间只认 `state.t`（tick 注入 dt），域层不读 Date.now。
- 挂机走 `tickIdle(save, nowMs)` 时间戳差，与战斗时基完全隔离。
- **[残余 →契约 §9-B-3]** UI 驱动层：battle 屏 setInterval(200) 应迁 `startLoop`
  （rAF+accumulator，visibilitychange 暂停），或删 startLoop 只留 createTicker。
- 音频时基：AudioContext 懒建 + 首手势 resume + master 增益统一静音（`audio/bus.js`）。

## 7. 性能预算（终审实测）

| 项 | 预算 | 现状/测量 |
| --- | --- | --- |
| classifyStroke 单笔 | p95 ≤4ms | ✅ bench exit 2 红线；实测全类型 p95 ≤0.16ms、3000 笔 0 误配 |
| 乱涂硬误报 | <5%（line/circle/spiral/cloud 口径） | ✅ probe exit 2 红线；实测 8/400 = 2% |
| battle.tick+cast | ≤0.5ms | bench 有计时上报（perRound ≈0.016ms）但**无阈值红线**（契约 §7-18 残余） |
| 笔迹跟手 | pointermove→上屏 ≤1 帧 | 增量墨刷 + coalesced 采样；未做 long task 实测 |
| 屏幕切换 | ≤50ms | 未打 mark |
| 战斗每逻辑步 UI | ≤2ms，无变化 0 DOM 写 | 节点引用 + 日志增量已达构；未量测 |
| 存档 | 序列化 ≤5ms、JSON <64KB | 64KB 有测试锁定 |
| 句柄泄漏 | battle↔hub 往返 N 次不增长 | 结构上闭环（disposer+单例 painter）；无自动化测试（契约 §7-17） |
| Canvas | DPR≤2；纸纹离屏烤一次、种子噪点 | ✅（回放画布另有 WeakMap 防位图反复翻倍） |
| 打包 | js+css gzip ≤150KB | ✅ 实测 JS 34.6KB + CSS 5.3KB ≈ 40KB（49 模块） |

## 8. 多游戏隔离（`games/<slug>/`，硬约束不变）

1. 每游戏独立 `package.json`/`node_modules`/`vite.config.js`/`index.html`/`dist`；跨游戏 import（含 `../` 穿越）一律禁止。
2. localStorage 前缀 `<slug>.`（本游戏 `linghuashi.save.v1` + `linghuashi.save.bak`，合规）。
3. 端口独占登记（本游戏 dev/preview 4173）。
4. 设计令牌走 `src/styles/tokens.css` 的 `:root` 变量；无共享 DOM。
5. 共享代码：初期禁止；≥2 游戏重复的工具提级 `games/_shared/<pkg>/` 显式版本化。
6. 每游戏自带 test/bench/probe scripts，根目录不聚合——**[残余]** 仓库根残留未跟踪
   `package-lock.json` 与 `test.js`，提交前删除、不得随本游戏提交（契约 §9-B-17）。
7. 文档 `docs/` 自治；跨游戏进度只写 `/.agent_workspace/PROGRESS.md`。

## 9. 测试策略分层 [现状：14 文件 105 用例全绿]

| 层 | 载体 | 现状 |
| --- | --- | --- |
| 纯函数单测 | `tests/{stroke,combat,progression,store,loop,templates}.test.js` | ✅ Round 2 的 62 用例扩到 105 |
| 契约测试 | `contract.test.js`（finished/unlockMo/tickIdle 幂等）+ `round3.test.js`（结算令牌、金雷引对照、放生经济） | ✅ 关键不变量 15/18 已入测（缺口见契约 §7-16~18） |
| 迁移测试 | `save-migrate.test.js`（v0/v1 升级、夹值、幂等、备份、天赋定价，16 用例） | ✅ 本轮新增 |
| UI 集成 | `hub-beasts.test.js`（jsdom 挂真实 hub，四门 11 用例）、`pointer-cancel.test.js`（6）、`motion.test.js`（5） | ✅ 本轮新增 |
| 画阁回放 | `gallery.test.js`（raw 往返判型、清洗、上限、64KB 预算，18 用例） | ✅ |
| 音频 | `audio.test.js`（总线静音/懒建/手势 resume，6 用例） | ✅ |
| 冒烟探针 | `scripts/probe.mjs`（识别→战斗链路 + 乱涂红线，exit 2 熔断） | ✅ |
| 性能红线 | `scripts/bench.mjs`（p95≤4ms exit 2 + 0 误配）、`scribble-probe.mjs`（硬误报口径含 cloud） | ✅；tick/cast 阈值项缺 |
| 手动/E2E | 触屏、键盘全流程、60fps | 未自动化 |

## 10. 死代码删除建议与残余（Round 3 终审定案）

细则与处置全文见契约 §9-B，此处按类别摘要。**死代码六项全部零生产调用方，删除即净赚**：

| # | 死代码 | 位置 | 裁定 | 契约条目 |
| --- | --- | --- | --- | --- |
| D1 | `battleModifiers`（含私有 sumTalent/round3）——三套 modifiers 聚合器最后的残留，键名不入 normalizeModifiers 白名单，传入即整体静默失效 | `classes/talents.js` | **删除函数**，GDD 提法同步更正 | §9-B-1 |
| D2 | `createBus` 事件总线，两轮零调用 | `core/events.js` | **删除整文件**（v3 结构化事件流届时重写） | §9-B-2 |
| D3 | 兼容 shim（re-export + recordStroke/masteredTypes/checkInkUnlock），整模块零 import | `progression/unlock.js` | **删除整文件**；`strokeStats` 字段处置随附 | §9-B-4 |
| D4 | 桶文件零 import（调用方全部直捣具体模块；audio/index.js 在用，不在此列） | `combat/index.js`、`drawing/index.js` | **删除两个桶**（或改"跨层只许走桶"约定，二选一） | §9-B-5 |
| D5 | `startLoop` 零调用（createTicker 有测试、留用） | `core/loop.js` | 接线 screen-battle 或删除，禁止悬空 | §9-B-3 |
| D6 | `releaseFallback/resolveReleaseBeast/releaseRefund` 能力探测层，生产分支不可达 | `ui/beast-panel.js` | 收拢为直接 import，删探测函数 | §9-B-13 |

非死代码残余（按危害排序）：弱战斗种子与 catchBeast 未注入 rng（§9-B-6/7）、
天赋成本双写与收兽丹价兜底（§9-B-8/9）、双栈指针与绝对像素阈值（§9-B-10）、
会话字段落盘（§9-B-11）、painter-host 过期注释（§9-B-12）、结构化事件流 v3（§9-B-14）、
`getState` 可变引用（§9-B-15）、ACCEPTANCE/SOTA_CHECKLIST 两文档滞后于终态（§9-B-16）、
仓库根杂物（§9-B-17）。

## 11. 现行文件结构（终审快照）

```
src/core/         store.js(v2+migrate+备份)  engine.js  loop.js[startLoop→接线或删]  events.js[删]
src/ui/           screens.js(注册表+disposer)  screen-{splash,class,hub,battle,result,gallery}.js
                  keycast.js  painter-host.js  beast-panel.js  tutorial.js
                  audio-bridge.js  motion-bridge.js  dom.js  components.js  ui.css
src/combat/       battle.js  elements.js  ai.js  index.js[删]          （mods.js 已删除）
src/progression/  idle.js  realm.js  beasts.js  settle.js(已接线)  unlock.js[删]
src/classes/      talents.js[battleModifiers 删]  unlock.js(墨客解锁权威)
src/drawing/      canvas.js  recognizer.js  features.js  geometry.js  ink.js
                  synth.js(几何唯一源)  templates.js(取景层)  replay.js  index.js[删]
src/audio/        bus.js  sfx.js  index.js(在用)
scripts/          probe.mjs  bench.mjs  scribble-probe.mjs  trajectories.mjs(取景层)
tests/            14 文件 105 用例（清单见 §9）
```

推进顺序建议：D1~D4+D6（纯删除，零风险先清）→ D5/§9-B-6/7（时钟与种子，一并收敛确定性）
→ §9-B-8/9（定价单源）→ §9-B-16（文档同步）→ 其余并行。
