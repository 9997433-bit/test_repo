# 架构（Round 1 审计版 · SOTA 基线）

> 本文档由 Round1 架构审计升级，基于对 `src/` 全量源码的通读（commit 所在分支 `cursor/linghuashi-sota-a345`）。
> 记法约定：**[现状]** = 当前代码已如此；**[缺陷]** = 当前代码与本架构相悖，Round 2 必须修复；**[目标]** = Round 2 应实现的形态。
> 接口签名的精确定义见 `docs/API_CONTRACT.md`，本文只讲边界、状态机、路由、预算与隔离。

## 1. 总览与设计原则

独立 Vite + 原生 ES Module，零框架。原则按优先级排序：

1. **纯函数域逻辑**：combat / drawing(识别) / progression / classes 的全部规则必须是无 DOM、无全局副作用的纯函数或纯状态机，可被 vitest 直接测试（`tests/`）与 node 直跑（`scripts/probe.mjs`、`scripts/bench.mjs`）。
2. **DOM 只出现在两处**：`src/ui/**`（屏幕渲染）与 `src/drawing/canvas.js`（画布输入/墨迹绘制）。`src/audio/` 允许 WebAudio。其余模块 import `window`/`document` 即架构违规。
3. **单向数据流**：输入(笔迹/点击) → 域函数产出新状态/事件 → store 提交 → UI 渲染。UI 不得内联游戏规则（数值结算、解锁判定）。**[缺陷]** 当前 `ui/screens.js` 内联了胜利奖励结算与墨客解锁判定（见 §10-D1/D7）。
4. **一切副作用有拥有者、有析构**：定时器、事件监听、AudioContext、painter 必须由创建者持有句柄并在屏幕卸载时释放。**[缺陷]** 当前战斗 interval 与 resize 监听无人释放（§10-D2/D4）。
5. **数据驱动**：`src/data/` 是唯一数值来源，代码不写魔法数值（伤害系数、消耗等应逐步迁入表）。

## 2. 分层与模块边界

```
第4层  presentation   src/ui/**  src/styles/**  src/audio/**
第3层  application    src/core/engine.js（boot/loop）  src/core/store.js  src/core/events.js  src/main.js
第2层  domain         src/combat/**  src/drawing/geometry|recognizer|ink.js  src/progression/**  src/classes/**
第1层  data           src/data/**
边界件 io-adapter     src/drawing/canvas.js（DOM 输入 → 域内 Stroke 事件的唯一适配器）
```

### 2.1 依赖方向规则（import 白名单）

| 模块 | 允许 import | 明确禁止 |
| --- | --- | --- |
| `data/**` | 无（叶子层，仅常量与查表函数） | 一切上层 |
| `combat/**` | `data/**`、combat 内部 | `ui`、`core/store`、`drawing`、DOM |
| `drawing/geometry.js` `recognizer.js` `ink.js` | drawing 内部、无 DOM | `combat`、`ui`、store |
| `drawing/canvas.js` | drawing 内部；DOM 事件仅限于此 | `combat`、store |
| `progression/**`、`classes/**` | `data/**` | `ui`、DOM、store |
| `core/store.js`、`core/events.js` | 无 | 域层、UI |
| `core/engine.js` | `core/*`、`ui/router`（[目标]） | 域层直接调用（结算应经 progression 纯函数） |
| `ui/**` | 所有下层 | 被任何下层 import；被其他游戏 import |
| `audio/**` | 无 | 一切域层 |

**违规判定**：任何"下层 import 上层"或"域层触 DOM"即 review 打回。当前源码符合此矩阵（`ui/screens.js` 违规点在职责内聚而非 import 方向）。

### 2.2 各模块单一职责

- `drawing/`：点序列 → `Stroke`（类型/精度/笔势）。识别是纯几何评分（`geometry.js` 特征 + `recognizer.js` 打分排序），无 ML、无异步。
- `combat/`：`createBattle` 状态机，`cast`（玩家笔迹入招）与 `tick`（时间推进/敌方行动）。**[目标]** 输出结构化事件流而非仅文本日志（§10-D3、契约 §3.4）。
- `progression/`：存档 → 存档 的纯变换（挂机、突破、灵兽、[目标]战斗结算 `settleBattle`、修正聚合 `deriveModifiers`）。
- `classes/`：职业/天赋数值修正。**[缺陷]** `talentMult` 目前无任何调用方，天赋点了没有战斗效果（§10-D5）。
- `core/`：store（三层状态，§3）、事件总线（**[缺陷]** `createBus` 当前是死代码）、boot 与路由宿主。
- `ui/`：屏幕模块与路由。**[缺陷]** 当前是单个 259 行上帝文件 `screens.js`（§10-D1）。

## 3. 状态管理

### 3.1 三层状态（[目标]，当前混在一起）

| 层 | 内容 | 持久化 | 归属 |
| --- | --- | --- | --- |
| `save`（持久） | version、playerName、classId、realmId、xp、qiPills、buns、talents、beasts、gallery、lastSeenAt、idleUntil、settings、tutorialDone、inkUnlocked | localStorage `linghuashi.save.v<N>` | store |
| `session`（会话） | screen、stageId、lastResult、lastStage、notice、idleClaim | 不持久化（刷新丢弃可接受；battle 深链恢复见 §5.4） | store |
| `runtime`（瞬态） | 进行中的 BattleState、painter 句柄、定时器 | 永不入 store | 各屏幕闭包持有，unmount 释放 |

**[缺陷]** 现状：`screen/stageId/notice/lastResult/idleClaim` 全部写进持久化 save（`store.persist` 序列化整个 state），瞬态 UI 状态污染存档；`defaultSave()` 甚至未声明这些字段，存档 shape 不封闭（§10-D6）。

### 3.2 store 语义

- `set(patch)` 浅合并。**规则**：嵌套对象（`settings`、`talents`、`idleClaim`）必须整体替换、不得部分传入，否则浅合并会静默丢字段。域函数（`tickIdle` 等）返回完整新 save 对象，与 patch 语义混用是允许的（整对象也是合法 patch），但调用方要保证不裁剪字段。
- `subscribe(fn)`：**[现状]** 从未被订阅，渲染靠 `navigate` 手动触发。**[目标]** 路由器订阅 store 只为持久化节流（写盘防抖 ≥1s），渲染仍由显式 navigate 驱动——本游戏无需响应式框架。
- 迁移：`hydrate` 遇到 `version !== 1` **直接丢档**。**[目标]** 引入 `migrate(oldSave): Save` 链（v1→v2→…），任何存档字段变更必须 bump version 并补迁移函数与往返单测（SOTA 清单"存档往返不丢境界/画阁"）。

### 3.3 结算幂等（关键不变量）

任何"发奖励"路径（战斗胜利、挂机领取、突破）必须是**恰好一次**语义：
- 战斗结算 **[目标]** 收敛为纯函数 `settleBattle(save, stageId, result)`，由路由在 `battle → result` 转移时调用**一次**；BattleSession 的 `finished` 事件只允许触发一次转移（session 内部置 `settled` 标志）。
- **[缺陷]** 现状是灾难级违规：战斗结束后 interval 不清理，`paint()` 每 200ms 重复执行 `xp += reward.xp` 并重复 `navigate("result")`，胜一场后修为/丹药无限增长，且从 result 回 hub 会被 200ms 后的下一次 tick 强行拽回 result（§10-D2）。

## 4. 状态机

### 4.1 屏幕状态机（AppScreen FSM）

```
                 ┌────────────────────────────────────────────┐
                 │                    splash                   │
                 └──────┬──────────────────────────┬──────────┘
              开卷入世   │                          │ 续写残卷 [guard: classId 已设]
                        ▼                          ▼
                 ┌───────────┐   以此入世    ┌───────────┐
                 │   class   │ ────────────▶ │    hub    │◀──────────────┐
                 └───────────┘ [guard:       └─┬───┬───┬─┘               │
                        ▲       classId 已选]  │   │   │                 │
                 返卷首 │                      │   │   │ 画阁            │
                        └── splash            │   │   ▼                 │
                                              │   │  ┌─────────┐  返回  │
                          选秘境 [set stageId] │   │  │ gallery │────────┤
                                              ▼   │  └─────────┘        │
                                        ┌────────┐│                     │
                          收笔撤退       │ battle ││ 突破/收兽/天赋       │
                        ┌───────────────┤        ││ (自转移 hub→hub)     │
                        │               └───┬────┘└─────────────────────┤
                        │       finished(一次)│                          │
                        │                   ▼                           │
                        │             ┌──────────┐        回画阁         │
                        └──── hub ◀── │  result  │────────────────────▶ hub
                                      └────┬─────┘
                                     再战   │ [guard: lastStage 有效]
                                           └──▶ battle
```

**转移守卫（[目标]，现状仅 splash→hub 有 classId 守卫）**：

| 目标屏 | 守卫 | 失败回退 |
| --- | --- | --- |
| `hub` | `classId != null` | `class` |
| `battle` | `classId && stageId 在 STAGES 中` | `hub` |
| `result` | `session.lastResult ∈ {win,lose}` | `hub`（现状：深链 result 会展示假"败"，§10-D8） |

**转移副作用归属**：`hub` 进入时执行 `tickIdle`（现状如此，保留）；`battle → result` 转移时执行一次 `settleBattle`；除此之外屏幕渲染函数不得改 save。

### 4.2 战斗会话状态机（BattleSession FSM · [目标]）

```
init ──start──▶ running ──(hp≤0 任一方)──▶ finished(win|lose) ──dispose──▶ disposed
                  │ ▲
   running 子状态: │ │
     awaiting_input ─cast─▶ resolving（同步，单帧内完成）─▶ awaiting_input
     enemy_cycle: watch(1400ms) → strike(400ms 窗口) → watch …
     bound: controlMs > 0 时敌方循环挂起，随 tick 递减
```

不变量（可直接转为单测断言，契约 §7）：
- `finished` 后 `cast`/`tick` 均为幂等 no-op（现状 battle.js 已满足——`if (state.finished) return`，问题出在 UI 层不停 tick+结算）。
- `finished` 事件对外**恰好发射一次**；session `dispose()` 清掉内部 rAF/interval，可重复调用。
- 敌方攻击节拍以**逻辑累积时间**判定（记录 `nextEnemyAt`），不得用 `t % 1800 < dtMs` 相位判定——**[缺陷]** 现状相位式判定在 dt 抖动（后台标签 setInterval 被钳到 ≥1000ms）时会丢拍或连击（§10-D9）。
- 同一 `{player, enemy, seed}` + 相同 cast/tick 序列 ⇒ 逐字节相同的终局状态（可回放性；`mulberry(seed)` 已保证 RNG 确定，但 **[缺陷]** seed 取 `stage.id.length + save.xp` 过弱且随 xp 漂移）。

### 4.3 笔迹状态机（Stroke FSM）

```
idle ─pointerdown─▶ inking ─pointermove(≥1px)─▶ inking（增量渲墨、consume 特征）
inking ─pointerup/pointerleave─▶ recognizing ─classifyStroke─▶ resolved(Stroke) ─onStroke─▶ idle
inking ─pointercancel─▶ idle（丢弃，**[缺陷]** 现状未处理 pointercancel）
```

- **[缺陷]** 现状 `canvas.js` 同时注册 pointer 与 touch 两套事件，混合输入设备上可能双触发 start/end；`destroy()` 只移除 4 个 pointer 监听，touch 3 个与 `window.resize` 永久泄漏（§10-D4）。
- **[目标]** 只用 Pointer Events + `touch-action: none`；resize 用 `ResizeObserver` 并纳入 destroy；识别阈值（现状 `length < 28`、`size/160` 等绝对像素）归一化到画布短边，消除 DPI/尺寸手感差异。

## 5. 屏幕路由

### 5.1 路由器契约（[目标]，替代现状 engine.js 里的裸 navigate）

现状：`navigate(screen)` 字符串直改 store + 全量 `innerHTML` 重建，**没有卸载生命周期**——这是战斗 interval 泄漏这一类 bug 的结构性根因。目标形态（签名细节见契约 §5.2）：

- 每个屏幕是一个模块 `ui/screens/<name>.js`，导出 `{ id, guard?, mount(ctx): unmount }`。
- `mount(ctx)` 收到 `{ root, store, navigate, params }`，返回 `unmount()`；屏幕创建的一切定时器、监听、painter、AudioContext 引用都在 `unmount` 释放。
- 路由器职责：查守卫 → 调用上一屏 `unmount()` → 清空 root → `mount` 新屏 → 持久化 session.screen（仅 session，不入 save）。
- `navigate` 必须防重入：转移进行中收到的 navigate 排队到转移完成后执行（防 `finished` 事件与用户点击竞态）。

### 5.2 渲染策略

全量 `innerHTML` 重建 + 事件重绑是**本项目的既定选择**（屏幕小、零框架、切屏预算 §7 内），不引入 vdom。约束：
- 高频局部更新（血条、灵气条、战斗日志）必须走**节点引用 + 脏标记**，禁止整屏重建；日志用增量 `insertAdjacentHTML`/节点复用，禁止每 tick 重拼 24 条 innerHTML（现状每 200ms 全量重拼，违反 §7 预算）。
- 用户可控文本（`playerName`）插入 DOM 必须走 `textContent`，禁止模板串拼接（现状拼进 innerHTML，未来开放改名即 XSS）。

### 5.3 深链/刷新恢复

- 刷新落在 `hub/gallery/class/splash`：直接恢复。
- 刷新落在 `battle`：战斗 runtime 不持久化，按守卫**降级到 hub**（现状会用持久化的 stageId 静默开一场新战斗，语义可以但属于未声明行为；Round 2 明确为降级 hub + notice"战斗中断"）。
- 刷新落在 `result`：`lastResult` 属 session 已丢失，守卫回退 hub。

## 6. 游戏循环与时基

- **单时钟原则**：整个应用最多一个 rAF 驱动循环（BattleSession 内部），逻辑用固定步长 accumulator（`LOGIC_DT = 100ms`，渲染插值可后置）。禁止散落的 `setInterval` 游戏逻辑——**[缺陷]** 现状 `screens.js` 用 200ms setInterval 直驱 `battle.tick`，后台标签被钳制、切屏泄漏、finished 后空转三害俱全。
- `document.visibilitychange → hidden`：暂停 session（战斗不吃后台时间；挂机收益由 `tickIdle` 的时间戳差负责，两套时基不得混用）。
- 时间来源：战斗内只认累计 `state.t`（tick 注入 dt），禁止域层读 `Date.now()`；`tickIdle`/`catchBeast` 的 `nowMs`/`rng` 已经/必须走参数注入（现状 `catchBeast` 默认 `Math.random`，测试需注入种子）。

## 7. 性能预算（可执行 · 附测量方式）

| 项 | 预算 | 测量 |
| --- | --- | --- |
| 笔迹跟手：pointermove → 墨段上屏 | ≤ 1 帧（16.6ms），脚本部分 ≤ 2ms | DevTools Performance，长按连画 5s 无 long task |
| `classifyStroke` 单笔 | ≤ 4ms（p95，64 重采样点） | `npm run bench`（`scripts/bench.mjs` 已内建 >4ms exit 2 的红线，保留） |
| `battle.tick` + `cast` 单次 | ≤ 0.5ms | bench 扩展项（Round 2 在 `scripts/bench.mjs` 追加） |
| 屏幕切换（unmount+mount+首帧） | ≤ 50ms | Performance mark `screen:<id>` |
| 战斗中每逻辑步 UI 更新（血条+日志） | ≤ 2ms，且无变化时 0 次 DOM 写 | 脏标记；日志增量渲染 |
| 冷启动 → 可交互（本地 preview） | ≤ 1.5s | Lighthouse TTI |
| 打包体积（js+css，gzip，不含字体） | ≤ 150KB（零框架，现状远低于此，作为天花板防腐） | `vite build` 产物 |
| 存档序列化 | ≤ 5ms，JSON ≤ 64KB（gallery 上限 24 条已保证） | 单测 |
| 内存/句柄 | battle↔hub 往返 10 次后：活跃 interval=0、canvas 相关监听不随往返增长 | DevTools（现状**必败**：resize 监听与 interval 线性泄漏） |
| Canvas | 单画布 DPR ≤ 2（已实现）；纸纹层与墨迹层分离，纸纹只画一次（现状每笔后整幅随机重绘，违规） |

## 8. 多游戏隔离原则（`games/<slug>/`）

本仓库将并行放多款游戏，隔离是硬约束（见 `docs/OWNERSHIP.md` 与 `/.agent_workspace/PROGRESS.md`）：

1. **目录**：每款游戏一个 `games/<slug>/`，含独立 `package.json`、`node_modules`、`vite.config.js`、`index.html`、`dist/`。跨游戏 `import` 一律禁止（含相对路径穿越 `../`）。
2. **存档命名空间**：localStorage key 必须以 `<slug>.` 前缀（本游戏 `linghuashi.save.v1`，已合规）。禁止读写他游戏前缀。
3. **端口**：dev/preview 端口在 `games/README.md` 登记独占（本游戏 4173）；新游戏顺延 4174+，`strictPort: true` 防串。
4. **样式**：每游戏是独立 HTML 入口，天然隔离；但设计令牌一律走 `:root` 自定义属性（`src/styles/tokens.css`），类名不加库式前缀但**不得**注入到共享 DOM（本项目无共享 DOM，维持现状即可）。
5. **共享代码**：初期禁止共享。若 ≥2 款游戏出现相同工具（如 geometry），提升到 `games/_shared/<pkg>/`，以显式版本化子包引入，禁止源码级 copy-paste 之外的隐式共享。
6. **CI/脚本**：每游戏自带 `test/bench/probe` npm scripts，根目录不聚合、不感知。
7. **文档**：每游戏 `docs/` 自治；跨游戏进度只写 `/.agent_workspace/PROGRESS.md`。

## 9. 测试策略分层

| 层 | 范围 | 载体 | 现状 |
| --- | --- | --- | --- |
| 纯函数单测 | recognizer 几何、battle 数值、progression 变换、store 迁移 | `tests/*.test.js`（vitest+jsdom） | 有（3 文件），缺 store 迁移与结算幂等用例 |
| 冒烟探针 | 识别→战斗跨模块最小链路 | `scripts/probe.mjs` | 有 |
| 性能红线 | classifyStroke ≤4ms | `scripts/bench.mjs` | 有；Round 2 加 tick/cast 项 |
| 契约测试 | `API_CONTRACT.md` §7 不变量逐条断言（结算恰好一次、finished 幂等、unmount 零泄漏） | 新增 `tests/contract.test.js` | 无 |
| 手动/E2E | 触屏可画、键盘教程战、60fps 墨迹 | SOTA_CHECKLIST | 未跑 |

## 10. 已知缺陷审计（Round 1 定案 · 按严重度排序）

责任模块对应 `/.agent_workspace/PROGRESS.md` 所有权表；本轮**只记录不改码**。

| # | 缺陷 | 位置 | 责任 | 修复方向（接口见契约） |
| --- | --- | --- | --- | --- |
| D1 | `ui/screens.js` 上帝文件：路由表、6 屏、战斗循环、奖励结算、解锁判定、天赋购买全内联；无卸载生命周期；文末 `void REALMS;` 死引用 | `ui/screens.js` 全文 | Opus-4 | 拆 `ui/screens/*.js` + `ui/router.js`，屏幕契约 `mount→unmount`（契约 §5） |
| D2 | **战斗 interval 永不清理**：胜/负后每 200ms 重复发奖（xp/丹无限刷）并反复 `navigate("result")`，从 result 回 hub 会被拽回；"再战"再叠一个 interval | `ui/screens.js` renderBattle/paint | Opus-4 | BattleSession 收编时钟 + `settleBattle` 恰好一次（契约 §3.5/§4.4） |
| D3 | 战斗输出是字符串日志，`cast` 的 `events` 只有一个笼统 `cast` 项；UI 无法做伤害飘字/特效/无障碍播报 | `combat/battle.js` push/cast | Opus-2 | 结构化 `BattleEvent` 流（契约 §3.4），log 由 UI 格式化 |
| D4 | painter 泄漏：`destroy` 不移除 touch×3 与 `window.resize`；胜/负路径根本不调用 destroy；pointer+touch 双注册可能双触发；无 pointercancel | `drawing/canvas.js` | Opus-1 | 契约 §2.3：Pointer Events 单栈 + ResizeObserver + 全量析构 |
| D5 | **天赋未接入**：`talentMult` 零调用方，点天赋花 12 丹无任何效果；同族死代码：`beastBonus`（灵兽被动无效）、`enemyIntent`（AI 未用）、`createBus`（总线未用）、`reaction().crit`（暴击未实装） | `classes/talents.js`、`progression/beasts.js`、`combat/ai.js`、`core/events.js`、`combat/elements.js` | Opus-2/3 | `deriveModifiers(save)` 注入 `createBattle({modifiers})`（契约 §3.2/§4.2） |
| D6 | 存档污染与脆弱：`screen/stageId/notice/lastResult/idleClaim` 持久化入 save；`version≠1` 直接丢档无迁移；`set` 浅合并对嵌套对象有静默丢字段风险 | `core/store.js`、`core/engine.js` | Opus-4 | save/session 分层 + `migrate` 链（§3、契约 §5.1） |
| D7 | 墨客解锁条件错误：`gallery.length >= 6`（任意 6 笔）≠ GDD"集齐六式"（6 种 distinct 轨迹） | `ui/screens.js` paint 内 | Opus-3/4 | `hasSixForms(gallery)` 纯函数（契约 §4.5），并从 UI 移入 progression |
| D8 | 路由无守卫：深链 `result` 显示假"败"；`battle` 缺 stageId 时静默落 `STAGES[0]`；navigate 字符串无校验 | `core/engine.js`、`ui/screens.js` | Opus-4 | §4.1 守卫表 + §5.3 降级规则 |
| D9 | 战斗时基脆弱：200ms setInterval（后台钳制/漂移）；敌方攻击 `t % 1800 < dtMs` 相位判定 dt 抖动即错拍；seed=`stage.id.length+xp` 弱种子 | `ui/screens.js`、`combat/battle.js` tick | Opus-2/4 | rAF+accumulator、`nextEnemyAt` 绝对时刻、seed 显式传入（契约 §3.2） |
| D10 | 数据/规则不一致：`COUNTER` 含 `jian→yao` 但 GDD 克制环无剑修且无人克制剑修；雷→金特殊反应 1.12+死 crit 实际弱于普通压制 1.2；`buns` 无任何消耗出口；`catchBeast` 无成本、默认非种子 RNG；识别阈值绝对像素依赖 DPI | `data/classes.js`、`combat/elements.js`、`progression/beasts.js`、`drawing/recognizer.js` | Fable-3 + Opus-1/2/3 | 数据表对齐 GDD（或修 GDD），crit 实装或删字段，buns 定为收兽成本，阈值归一化 |

次级问题（不占 Top10，Round 2 顺手修）：战斗画布无键盘替代输入（SOTA 清单无障碍项必挂）；战斗日志无 `aria-live`；`settings.mute/reducedMotion` 无 UI 开关；纸纹重绘用 `Math.random` 不可复现；`API_CONTRACT.md` 旧版写的 `createBattle(seed, player, enemy)` 与实际对象参数不符（本轮已在契约中修正为实际签名）。

## 11. Round 2 目标文件结构

```
src/core/    store.js（+migrate） events.js（启用） engine.js（瘦身为 boot）
src/ui/      router.js  screens/{splash,class,hub,battle,result,gallery}.js  widgets/log.js
src/combat/  battle.js  session.js（新增：时钟+事件泵） elements.js  ai.js（接入）
src/progression/  idle.js  realm.js  beasts.js  settle.js（新增）  modifiers.js（新增，聚合 talents+beasts+realm）
src/drawing/ canvas.js（重写析构/分层） recognizer.js（consume 实装+归一化） geometry.js  ink.js
```

迁移顺序建议：先 D2（止血：session+unmount）→ D1（拆屏）→ D5（modifiers 打通天赋/灵兽）→ D3（事件流）→ 其余并行。
