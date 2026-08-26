# SOTA 验收清单（可勾选 · 可度量）

> 维护者：Fable-4 SOTA 验收官。评测命令与手测步骤见 `docs/ACCEPTANCE.md`。
>
> **Round 2 快照**：2026-08-26 08:24 UTC，工作树实测（Round 2 并发角色仍在改码，本表为该时刻状态）。
> **Round 1 基线**：2026-08-26 07:17 UTC（HEAD `0265040`），供对照。
> 复评时以 `docs/ACCEPTANCE.md` 的命令重新跑一遍并更新状态列。
>
> 图例：✅ 已过 ｜ ❌ 未过 ｜ ⚠️ 部分通过/有保留 ｜ 每项都写明「度量方法 + 阈值」。
> 状态后括号内为轮次变动：（R1❌→R2✅）表示本轮修复。

## A. 绘符识别精度

- [x] **A1 六式金标准识别率 ≥ 98%** ✅
  度量：对 line/curve/circle/zigzag/spiral/cloud 各生成 ≥200 个带噪声（noise ≤0.016·size）、旋转（0–π）、尺寸（90–288px）变体，`classifyStroke` 混淆矩阵对角线 ≥98%。
  R2 实测：**六类全部 200/200（100%）**（R1 为 98–100%）。
- [x] **A2 识别 precision 均值 ≥ 0.85** ✅
  度量：A1 命中样本的 `precision` 均值。R2 实测：0.923–1.000。
- [x] **A3 水平/垂直/斜向直线均识别为 line** ✅ 度量：`tests/stroke.test.js` 三个 line 用例。R2：通过。
- [x] **A4 噪声闭合圆识别为 circle** ✅ 度量：noisyCircle 用例。R2：通过。
- [x] **A5 过短/过少采样点判为 scribble** ✅ 度量：<6 点或长度 <28px 必须返回 scribble。R2：通过（含"点数够但长度不足"用例）。
- [x] **A6 乱涂不误爆大招：误报率 < 5%** ✅（R1❌ 26.5% → R2 **3.5%**）⚠️ 有保留
  度量：≥200 个 `synthesizeStroke("scribble")` 被判为 cloud（治疗）/circle（护盾）/spiral（AoE）的比率 <5%。
  R2 实测：ACCEPTANCE §2 矩阵 falseBigSpellRate=**0.035**（cloud 7/200，circle 0，spiral 0）；probe 自带 400 样本硬误报（line/circle/spiral）率 0。
  **保留意见（Round 3 收口）**：自动红线 `scripts/scribble-probe.mjs` 的 `HARD_FALSE_POSITIVE_TYPES` 只含 line/circle/spiral，**不含 cloud（治疗）**——当前达标全靠识别器现状，cloud 误爆回归不会被门禁拦下。需把 cloud（或整个 falseBigSpellRate 口径）纳入 probe/bench 红线。
- [x] **A7 金标准轨迹与识别器不漂移，probe/bench 门禁绿** ✅（R1❌ exit 1/2 → R2 exit 0/0）⚠️ 有保留
  度量：`npm run probe` 与 `npm run bench` 均 exit 0。R2 实测：probe ok；bench 3000 笔 **0 mismatches**。
  **保留意见（Round 3 收口）**："单一来源"未达成——标准轨迹现有 **三份平行实现**：`src/drawing/synth.js`（识别/键盘施法用）、`src/drawing/templates.js`（教程/字形/回放测试用）、`scripts/trajectories.mjs`（probe/bench 用，仍是 Round 1 的旧几何）。当前靠识别器同时兼容三者才全绿；任何一份改动都可能再漂移。需合并为一处。
- [ ] **A8 真机手绘样本回归集** ❌ 未建（≥10 人次/式，raw 点列入 `tests/fixtures/`，识别率 ≥90%）。目录不存在。
- [x] **A9 伪压感 pressure ∈ [0.15,1] 且随速度反比** ✅ R2：通过（`pressureOf` 单调递减、边界钳制，probe 界内）。

## B. 战斗公平

- [x] **B1 战斗 RNG 确定性** ✅ 度量：同 seed 50 回合敌伤序列逐位一致、异 seed 不同。R2 实测：`sameSeed:true, diffSeed:true`。
- [x] **B2 灵气不足不吞笔** ✅ R2：通过（events 空、状态不变、warn 日志）。
- [x] **B3 护盾先于 HP 扣减** ✅ R2：通过。
- [x] **B4 任意 dt 的 tick 结算正确** ✅ R2：通过（累计冷却制 + `MAX_CATCHUP_STRIKES=64` 上限；`core/loop.js` 固定步长 ticker 另有 4 用例）。
- [x] **B5 职业克制双向系数生效**（×1.18 / ×0.88）✅ R2：通过。
- [x] **B6 五行反应伤害系数生效**（蒸发 ×1.35 / 压制 ×1.2 / 受制 ×0.82）✅ R2：通过。
- [ ] **B7 金雷引暴击 +15% 生效** ❌（R1❌→R2 仍❌）**Round 3 必收口**
  `reaction("thunder","metal")` 返回 `crit: 0.15`，但 `battle.cast` 的 `rollCrit()` 只读 `mods.crit`，**react.crit 仍是死字段**。契约（API_CONTRACT §3.1）明言"消费或删除，二选一，不许悬空"。
  度量：thunder→metal 组合暴击率统计偏移 +15%，或字段删除 + 契约更新。
- [x] **B8 天赋/灵兽加成接入实战** ✅（R1❌→R2✅）**P0 已修**
  度量：点 1 层「符咒威能」后同 seed 同笔伤害 ×1.06；带 crit 灵兽后暴击率 >0。
  R2 实测：`screen-battle.js` 的 `createBattle` 传入 `modifiersFor(save)`（talent/beast 嵌套 → `normalizeModifiers`）；harness 实测伤害比 **1.0600**、带 crit=0.2 灵兽 50 笔出 7 次暴击（无灵兽 0 次）。
- [x] **B9 胜负结算幂等，奖励只发一次** ✅（R1❌ xp 40→280 → R2✅）**P0 已修**
  度量：胜利后等待 ≥2s，xp/qiPills 不变；活跃 interval 归零。
  R2 实测：jsdom 全 UI 战斗胜利后 2.2s，xp 40→40、丹 8→8（`rewardIdempotent:true`）；`finish()` 有 `settled` 闸 + `stopClock()`，`battle.tick` 对已结束战斗为 no-op（contract.test 断言 end 日志恰一条、t 不再推进）。
- [x] **B10 敌人出手 telegraph 可见** ✅（R1❌→R2✅）
  R2：战斗侧栏「意图」实时显示 被缚/蓄势/观势（`enemyIntent` 改用真实冷却口径，`ENEMY_TELEGRAPH_MS=400`），strike 前 ≥400ms 出「蓄势」。真机可见性待 Round 3 目测复核。
- [x] **B11 战斗日志上限 24 条、关键事件都有记录** ✅ R2：通过（probe 断言 log ≤24；UI 侧增量 append、DOM 上限 40）。
- [x] **B12 无付费强度通道** ✅ R2：通过。
- [x] **B13 墨客解锁规则单一实现** ✅（R1❌→R2✅）
  R2：`screens` 侧内联判断已删，胜利结算走 `unlockMo`（6 种**不同**笔法、scribble 不计、幂等）；hub/class/gallery 统一用 `moProgress`。contract.test 断言"5 式 + 重复直线不解锁、补第 6 式解锁"。

## C. 存档

- [x] **C1 persist→hydrate 往返不丢关键字段** ✅ R2 实测：classId/realmId/xp/gallery（含 points 点列）逐字段相等。
- [x] **C2 损坏 JSON 与版本不符容错** ✅ R2：通过；另 `sanitizeGallery` 对坏画阁条目（缺 type、越界坐标、超长点列）有清洗用例。
- [x] **C3 离线收益上限 8h（480 分钟）** ✅ R2：通过（1920 丹 / 288 包子）。
- [x] **C4 挂机结算幂等** ✅ R2：通过（`idleClaimed` 标记；同 nowMs 二次调用零产出，contract.test 断言）。
- [x] **C5 quota 超限不崩溃** ✅ R2：通过。
- [x] **C6 瞬态字段不入档** ⚠️→基本通过（R1⚠️→R2 改善）
  R2：`TRANSIENT_KEYS`（idleClaim/idleClaimed/idleNoticeShown/notice/inkJustUnlocked）写盘时剔除（实测盘上无）；boot 时 `entryScreen` 把 battle 消毒为 hub，刷新不再落进半场战斗。
  保留：`screen/lastResult/lastStage/lastReward/stageId` 仍落盘（实测盘上有 screen/lastResult）——因 entryScreen 消毒而无害，但建议 Round 3 白名单化或在 schema 注释里定性为会话字段。
- [ ] **C7 版本迁移路径** ❌（R1❌→R2 仍❌）**Round 3 必收口**
  `hydrate` 仍是 `version !== 1` 直接弃档回默认；Round 2 已给 gallery 扩了 `points` 字段（旧档由 sanitize 兼容），下一次字段变更没有迁移链兜底。度量：migrate 函数 + 旧档升级单测 +（契约要求的）旧档备份。
- [ ] **C8 存档导出/导入入口** ❌ 未实现（复制 JSON 即可迁移设备）。

## D. 移动端

- [x] **D1 触摸可画** ✅ R2：代码具备（touch-action:none、preventDefault、getCoalescedEvents）；真机复核见 ACCEPTANCE §6。
- [x] **D2 viewport/theme-color/安全区 meta 齐全** ✅ R2：通过（viewport-fit=cover）。
- [x] **D3 响应式断点** ✅ R2：通过。
- [x] **D4 DPR 适配上限 2** ✅ R2：通过。
- [ ] **D5 pointer/touch 双注册去重** ⚠️（R1❌→R2 部分修复）
  R2：`start` 有 `drawing` 闸门、`end` 有同款防重入——**起笔/收笔不再双触发**（R1 的"点列被重置"已消除）。
  保留：pointer 与 touch 两栈仍**同时注册**，支持 PointerEvent 的触屏浏览器上 `pointermove` 与 `touchmove` 都会进 `move()`（touch 事件无 pointerId、绕过闸门），同一手指**每帧双采样**（点列翻倍、笔刷重复描画）。建议：检测 `window.PointerEvent` 时不挂 touch 栈。度量：单次触摸 move 采样数与事件数 1:1。
- [x] **D6 多点触控与 pointercancel 防护** ✅（R1❌→R2✅）
  R2：跟踪 `pointerId` + `setPointerCapture`，第二指（pointer 或 touch）被闸门拒收；`pointercancel`/`pointerleave` 触发 end 收笔。保留：结论来自代码审查与 jsdom，真机行为归 D7。
- [ ] **D7 真机冒烟**（iOS Safari + Android Chrome 各完成一场教程战）❌ 未执行。
- [x] **D8（新增）挂机页签回来不被秒** ✅ `MAX_CATCHUP_STRIKES=64` + `core/loop.js` clamp（大 dt 只补 5 tick 用例）。

## E. 无障碍

- [x] **E1 键盘可走完教程战斗** ✅（R1❌→R2✅）**P0 已修**
  度量：仅用 Tab/Enter/数字键 1-6 从卷首到结算全程可达。
  R2 实测：jsdom 全 UI harness **只按数字键 "1" 即打赢教程战并正确结算**；战斗屏有符键条（aria-keyshortcuts、按型禁用态）、Escape 撤退；选职屏 radiogroup + 方向键。保留：真浏览器 Tab 走查目测留 Round 3 复核。
- [x] **E2 战斗日志 aria-live 播报** ✅（R1❌→R2✅）日志区 `role=log aria-live=polite aria-relevant=additions`；全局 `announce()`（polite/assertive 双通道）接入切屏/施法/结算/静音/解锁。
- [x] **E3 血条/灵气条 progressbar 语义** ✅（R1❌→R2✅）`meter()` 全面接入（战斗四条 + 修为 + 六式收集），带 aria-valuenow/valuetext。
- [x] **E4 屏切换焦点管理** ✅（R1❌→R2✅）`renderApp` 每屏调 `focusScreen`（data-autofocus 标题 tabindex=-1）；教程弹层 trapFocus + 关闭还焦。
- [x] **E5 静音与减动效开关** ⚠️→静音已过、减动效留尾巴（R1❌→R2 大部分修复）
  R2：静音开关（hub/battle/gallery 均有，aria-pressed）经 `audio-bridge` 单向推给音频总线，**管住全部音效**（audio.test 6 用例：总线路由/静音全哑/中途切换/无 WebAudio 不炸）；`prefers-reduced-motion` 在 CSS、键盘笔迹回显、画阁回放中均被尊重。
  保留：`settings.reducedMotion` 字段有效（画阁回放读它）但**无 UI 开关**。
- [x] **E6 焦点可见样式** ✅（R1❌→R2✅）`:focus-visible` 全局朱磦环（tokens `--focus-ring` 3px）。
- [ ] **E7 文本对比度 ≥ 4.5:1** ⚠️（已测量）
  R2 实测：`--ink-mute #5a4933` 对宣纸 #efe3c8 = **6.77:1** ✅、对纸脚 #e4d3ae = 5.84:1 ✅；但 `ui.css` 中 `.stat-label` 与 `.cast-key-cost` 用 `opacity: 0.6`，实效色 #6f6657 对宣纸 = **4.44:1**，小号字（0.76rem）微低于 4.5:1。改为 `color: var(--ink-mute)` 实色即达标。

## F. 性能基准

- [x] **F1 识别性能：p95 < 4ms/笔（node 端）** ✅ R2 实测：3000 笔 p50 0.135ms / p95 **0.212ms**（门禁本身也已 exit 0，R1 的红灯已消）。
- [x] **F2 战斗结算：< 1ms/回合** ✅ R2 实测：0.0155ms/回合。
- [x] **F3 生产构建通过且 JS gzip < 100KB** ✅ R2 实测：46 模块，JS 75.3KB（gzip **31.0KB**）。
- [x] **F4 preview 服务器可用** ✅ R2 实测：HTTP 200。
- [ ] **F5 60fps 墨迹（桌面 Chrome）** ❌ 仍无实机实证。度量：Performance 面板录制 10s 连续绘制 ≥58fps、无 >50ms 长任务。
- [x] **F6 零计时器/监听器泄漏** ✅（R1❌→R2✅）
  R2 实测：battle↔hub 往返 5 次后活跃 interval 恒为 **0**、window resize 监听恒为 **1**（painter-host 单例设计如此，不随场次增长）、document keydown 归零；`screens.js` disposer 机制保证切屏必清理。
  保留（微）：`app.destroy()` 不回收 painter 单例那 1 个 resize 监听（常量级、非增长型）。
- [ ] **F7 战斗页 rAF 驱动渲染** ⚠️（R1⚠️→R2 改善但未达 SOTA）
  R2：战斗时钟仍是 200ms `setInterval`，但渲染已从"整段 innerHTML 重写"改为**增量 DOM**（meter 宽度/文本节点/日志 append），且 `cast` 后立即 `paint()`（输入→上屏不等 tick）。达 SOTA 需改 rAF + accumulator。

## G. 目录隔离

> 本轮验收禁用 git 命令，G 组按文件系统快照核查；提交前请按 ACCEPTANCE §8 用 git 复核一遍。

- [x] **G1 游戏代码全部位于 `games/linghuashi/`** ✅ 快照：目录外无本游戏文件。
- [x] **G2 不改仓库根业务文件** ✅ 快照：`test.js`、根 `package-lock.json`（已提交版内容）未动。
- [ ] **G3 根目录不新增未跟踪文件** ⚠️（R1⚠️→R2 仍在）
  工作区根仍有**未跟踪 `package-lock.json`**（88B，环境安装副产物），且根目录无 `.gitignore`。**严禁提交该文件**；Round 3 删除或经根 .gitignore 覆盖（注意根 .gitignore 本身也算根改动，优先直接删除）。
- [x] **G4 独立 npm 依赖树**（devDependencies 仅 vite/vitest/jsdom）✅ R2：通过。
- [x] **G5 构建产物隔离**（node_modules/dist/.vite 在本目录 .gitignore）✅ R2：通过。
- [x] **G6 分支纪律**（仅在 `cursor/linghuashi-sota-a345` 工作）✅ 沿用（本轮禁 git，未复核）。

## H. 工程与文档

- [x] **H1 vitest 全绿** ✅ R2 实测：**9 文件 62 用例全过**（stroke 8 / combat 7 / templates 11 / gallery 18 / audio 6 / contract 3 / store 2 / progression 3 / loop 4；R1 为 20 用例）。
- [x] **H2 probe 门禁 exit 0** ✅（R1❌→R2✅）含六式识别 + 400 乱涂硬误报红线 + 50 回合战斗冒烟。
- [x] **H3 bench 门禁 exit 0** ✅（R1❌→R2✅）3000 笔 0 误配、p95 0.21ms。
- [ ] **H4 单测覆盖新增纯函数** ⚠️（R1⚠️→R2 改善）
  已补：unlockMo/tickIdle 幂等/ticker/templates/replay 归一化/pushGallery/sanitizeGallery/音频总线。
  仍缺：`normalizeModifiers`（扁平/嵌套/越界钳制）、`keyboardStroke`（精度封顶/型不符降级）、`moProgress.missing`、`catchPayment/evolveBeast/rerollPassive`、combo 窗口/上限分支。
- [ ] **H5 API_CONTRACT.md 与实现同步** ❌（R1⚠️→R2 恶化为整体过期）**Round 3 必收口**
  契约仍是"Round 1 审计版"：v2 提案的 `router.js/session.js/settle.js/progression/modifiers.js` **均未按提案落地**，实际方案是 screens disposer + `battle.normalizeModifiers` + painter-host 单例 + `entryScreen` 消毒；`consume()` 已实装、`destroy()` 已修但契约仍标注旧缺陷；audio 契约缺总线；store 契约缺 gallery points/sanitize。且 **modifiers 聚合现有三轨**：`combat/battle.js normalizeModifiers`（在用）、`combat/mods.js computeMods`（死代码）、`classes/talents.js battleModifiers`（死代码）——契约"禁止留双轨"条款被违反。需改写为 v2 现状版并删除死代码。
- [ ] **H6 六职业手感差异可感知** ⚠️ 数据差异 + 天赋生效（B8）+ telegraph（B10）齐了，5 人盲测区分 ≥4 职业仍未做。

---

## 与 SOTA 的剩余差距（Round 2 快照结论）

**已达 SOTA 水位**：识别精度与性能（100% 六式 / 乱涂 3.5% / p95 0.21ms）、战斗公平内核（确定性、幂等结算、养成接入、telegraph）、存档健壮性（容错/清洗/幂等）、无障碍主干（键盘施法、aria-live、progressbar、焦点管理、全局静音总线）、资源零泄漏、画阁笔路回放、构建体积。

**未达 SOTA 的差距**（按严重度）：

| # | 差距 | 清单项 | 级别 |
| --- | --- | --- | --- |
| 1 | `reaction().crit` 死字段：金雷引暴击不生效，契约悬空 | B7 | **P0** |
| 2 | 乱涂红线口径缺 cloud（治疗），达标无门禁保护 | A6 | **P0** |
| 3 | 金标准轨迹三处平行实现，随时可再漂移 | A7 | **P0** |
| 4 | 契约文档整体过期 + modifiers 三轨死代码 | H5 | **P0** |
| 5 | 存档无版本迁移链（本轮刚扩过字段，风险升高） | C7 | **P0** |
| 6 | pointer+touch 双栈 move 双采样；真机冒烟未做 | D5/D7 | P1 |
| 7 | reducedMotion 无 UI 开关；opacity 小字对比度 4.44:1 | E5/E7 | P1 |
| 8 | 60fps 无实证；战斗时钟未上 rAF | F5/F7 | P1 |
| 9 | 根目录未跟踪 package-lock.json 未处理 | G3 | P1 |
| 10 | 真机手绘回归集、存档导出/导入、盲测、Google Fonts 离线退化 | A8/C8/H6 | P2 |

## Round 3 必收口项（退出条件）

1. **B7 crit 定案**：`battle.cast` 暴击率消费 `reaction().crit`（`mods.crit + react.crit` 后钳制），或删除字段并同步契约与 GDD；两种取向都要加单测（thunder→metal 暴击率偏移可测）。
2. **A6 红线补口径**：`scribble-probe.mjs` 把 cloud 纳入硬误报集（或新增 falseBigSpellRate<5% 断言进 bench），阈值仍 5%，六式 accuracy 不得跌破 98%。
3. **A7 金标准合一**：probe/bench 改用 `src/drawing/synth.js`（或 `templates.js`）生成轨迹，删除 `scripts/trajectories.mjs` 的独立几何；三选一后另两处只许 re-export。
4. **C7 迁移链**：`migrate(raw)` v1→现行 + 未知版本备份至 `linghuashi.save.bak` 不静默销档 + 往返/升级单测。
5. **H5 契约重写 + 死代码清理**：API_CONTRACT.md 改为 v2 现状版；删除 `combat/mods.js` 与 `talents.battleModifiers`（或收编为唯一聚合器并接线）。
6. **D5 触摸单栈**：`window.PointerEvent` 存在时不注册 touch 监听；D7 真机各过一场教程战（顺带复核 B10 目测、E1 Tab 走查、F5 帧率录制）。
7. **G3 清根**：删除工作区根未跟踪 `package-lock.json`，提交前 `git status --short` 在 `games/linghuashi/` 之外为空。
8. **收尾打磨（有余力）**：E7 两处 opacity 改实色；E5 补减动效开关；H4 补 `normalizeModifiers/keyboardStroke` 等单测；C8 导出/导入。
