# SOTA 验收清单（可勾选 · 可度量）

> 维护者：Fable-4 SOTA 验收官。评测命令与手测步骤见 `docs/ACCEPTANCE.md`。
>
> **基线快照**：2026-08-26 07:17 UTC，HEAD `0265040` + 未提交工作树（状态摘要 `d1df6630ecc6`）。
> Round 1 并发角色（Opus-1/2/3/4、GPT-sol-1/2）仍在改代码，本基线为该时刻的实测结果；
> 复评时以 `docs/ACCEPTANCE.md` 的命令重新跑一遍并更新状态列。
>
> 图例：✅ 已过 ｜ ❌ 未过 ｜ ⚠️ 部分通过/有保留 ｜ 每项都写明「度量方法 + 阈值」。

## A. 绘符识别精度

- [x] **A1 六式金标准识别率 ≥ 98%** ✅
  度量：对 line/curve/circle/zigzag/spiral/cloud 各生成 ≥200 个带噪声（noise ≤0.016·size）、旋转（0–π）、尺寸（90–288px）变体，`classifyStroke` 混淆矩阵对角线 ≥98%。
  基线：`src/drawing/synth.js` 轨迹 6 类准确率 98–100%（zigzag 98%，其余 100%）。
- [x] **A2 识别 precision 均值 ≥ 0.85** ✅
  度量：A1 命中样本的 `precision` 均值。基线：0.92–1.00。
- [x] **A3 水平/垂直/斜向直线均识别为 line** ✅
  度量：`tests/stroke.test.js` 三个 line 用例全绿。基线：通过。
- [x] **A4 噪声闭合圆识别为 circle** ✅
  度量：`tests/stroke.test.js` noisyCircle 用例。基线：通过。
- [x] **A5 过短/过少采样点判为 scribble** ✅
  度量：<6 点或长度 <28px 必须返回 scribble（阈值常量 `MIN_POINTS`/`MIN_LENGTH`）。基线：通过。
- [ ] **A6 乱涂不误爆大招：误报率 < 5%** ❌ **P0**
  度量：≥200 个随机游走 scribble（`synthesizeStroke("scribble")`），被判为 cloud（治疗）/circle（护盾）/spiral（AoE）的比率 <5%。
  基线：**26.5%**（cloud 32、spiral 5、circle 1 / 200；仅 6.5% 保持 scribble）。乱涂可白嫖治疗与护盾。
- [ ] **A7 金标准轨迹单一来源，probe/bench 与识别器不漂移** ❌ **P0**
  度量：`scripts/trajectories.mjs` 与 `src/drawing/synth.js` 合并或逐类对齐；`node scripts/probe.mjs` 与 `node scripts/bench.mjs` 均 exit 0。
  基线：**probe exit 1、bench exit 2**——trajectories 的 curve（12 点正弦）被重写后的识别器判为 zigzag（bench 中 500/500 全错）。
- [ ] **A8 真机手绘样本回归集**（≥10 人次/式，录制 raw 点列入 `tests/fixtures/`，识别率 ≥90%）❌ 未建
- [x] **A9 伪压感 pressure ∈ [0.15,1] 且随速度反比** ✅ 度量：`pressureOf(speed)` 单调递减、边界钳制。基线：通过（probe 报告中 precision/pressure 均在界内）。

## B. 战斗公平

- [x] **B1 战斗 RNG 确定性** ✅
  度量：同一 seed 的 `createBattle` 重放 50 回合，敌方伤害序列逐位一致。基线：mulberry32 种子化，bench 50 回合结果可复现（enemyDamage 固定）。
- [x] **B2 灵气不足不吞笔** ✅ 度量：qi<cost 时 events 为空、qi/敌 HP 不变、出 warn 日志。基线：`tests/combat.test.js` 通过。
- [x] **B3 护盾先于 HP 扣减** ✅ 度量：combat.test「uses shield before reducing player hp」。基线：通过。
- [x] **B4 任意 dt 的 tick 结算正确** ✅ 度量：18×200ms 与 2×1800ms 敌方出手次数一致（冷却累计制）。基线：通过。
- [x] **B5 职业克制双向系数生效**（克制 ×1.18 / 被克 ×0.88）✅ 度量：同 stroke 不同职业组合的伤害比值。基线：battle.js 实现且 probe 覆盖。
- [x] **B6 五行反应伤害系数生效**（蒸发 ×1.35 / 压制 ×1.2 / 受制 ×0.82）✅ 度量：`reaction()` 单测 + 战斗日志出反应文案。基线：通过。
- [ ] **B7 金雷引暴击 +15% 生效** ❌ `reaction()` 返回 `crit: 0.15` 但 `battle.cast` 从不消费该字段（死字段）。度量：thunder→metal 组合暴击率统计偏移 +15%。
- [ ] **B8 天赋/灵兽加成接入实战** ❌ **P0**
  度量：点满 1 层「符咒威能」后同 seed 同笔伤害 ×1.06；带墨狐后暴击率 >0。
  基线：`battleModifiers`/`talentMult`/`beastBonus` 已实现，但 `src/ui/screens.js` 的 `createBattle` **不传 modifiers**——花灵气丹点天赋对战斗零影响，养成闭环断裂。
- [ ] **B9 胜负结算幂等，奖励只发一次** ❌ **P0**
  度量：胜利后等待 ≥2s，xp/qiPills 不再变化；活跃 interval 数归零。
  基线：**实测胜利后 1.2s 内 xp 40→280、丹 8→56**（200ms interval 不清理，`navigate("result")` 每 tick 重入并重复发奖）。
- [ ] **B10 敌人出手 telegraph 可见** ❌ `battle` 已计算 `enemy.intent`（bound/strike/watch）但 UI 不显示，玩家无预警。度量：strike 前 ≥400ms 界面出现预警标记。
- [x] **B11 战斗日志上限 24 条、关键事件（施法/反应/被控/反噬）都有记录** ✅ 基线：通过（probe 断言 log ≤24）。
- [x] **B12 无付费强度通道** ✅ 度量：代码中无内购/充值字段。基线：通过。
- [ ] **B13 墨客解锁规则单一实现** ❌ `src/classes/unlock.js` 要求 6 种**不同**笔法，`screens.js` 内联判断却是 `gallery.length >= 6`（24 笔窗口内任意 6 条即触发），且 `unlockMo/moProgress` 未被 UI 调用。度量：两处逻辑合一，画 6 笔同型直线不解锁。

## C. 存档

- [x] **C1 persist→hydrate 往返不丢关键字段** ✅
  度量：写入 classId/realmId/xp/gallery 后 persist，新 store hydrate 后逐字段相等。
  基线：jsdom harness 实测 `{ok:true}`，key=`linghuashi.save.v1`。
- [x] **C2 损坏 JSON 与版本不符容错** ✅ 度量：`tests/store.test.js` 两用例（malformed / version 99 均保留当前态）。基线：通过。
- [x] **C3 离线收益上限 8h（480 分钟）** ✅ 度量：离线 20h 只结算 480 分钟。基线：`tests/progression.test.js` 通过（1920 丹 / 288 包子）。
- [x] **C4 挂机结算幂等** ✅ 度量：同一 nowMs 连续 `tickIdle` 只发一次（`idleClaim.claimed` 标记）。基线：idle.js 重构后通过。
- [x] **C5 quota 超限不崩溃** ✅ 度量：persist 的 try/catch。基线：通过（代码审查）。
- [ ] **C6 瞬态字段不入档** ⚠️ `screen/stageId/lastResult/notice/idleClaim` 全部随 persist 落盘；刷新会直接回到 battle 屏但战斗实例不恢复。度量：存档 JSON 仅含白名单字段，或明确 schema 注释。
- [ ] **C7 版本迁移路径**（v1→v2 时旧档升级而非丢弃）❌ 当前 `version !== 1` 直接弃档回默认。度量：migrate 函数 + 单测。
- [ ] **C8 存档导出/导入入口**（复制 JSON 即可迁移设备）❌ 未实现。

## D. 移动端

- [x] **D1 触摸可画**（touchstart/move/end 注册、`touch-action:none`、preventDefault）✅ 基线：代码具备；jsdom 无法仿真真触摸，真机复核见 ACCEPTANCE §6。
- [x] **D2 viewport/theme-color/安全区 meta 齐全** ✅ 基线：index.html 通过。
- [x] **D3 响应式断点**（≤860px 战斗单列、≤800px 枢纽单列）✅ 基线：layout.css 通过。
- [x] **D4 DPR 适配上限 2** ✅ 基线：canvas.js 通过。
- [ ] **D5 pointer/touch 双注册去重** ❌ 支持 PointerEvent 的移动浏览器上 pointerdown 与 touchstart 会**双触发** `start()`（点列被重置），需以 pointer 为主、touch 仅作降级。度量：单次触摸只产生一次 start/end。
- [ ] **D6 多点触控与 pointercancel 防护** ❌ 未跟踪 pointerId、未 setPointerCapture、未监听 pointercancel；双指绘制会把两指坐标串成一条乱笔。度量：第二指按下不污染当前笔迹；系统手势打断触发 end/丢弃。
- [ ] **D7 真机冒烟**（iOS Safari + Android Chrome 各完成一场教程战）❌ 未执行。

## E. 无障碍

- [ ] **E1 键盘可走完教程战斗** ❌ **P0**
  度量：仅用 Tab/Enter/数字键 1-6，从卷首→选职→枢纽→战斗→胜利→结算全程可达。
  基线：**实测 keydown "1" 无任何施法效果**——`src/ui/keycast.js`（键盘合成笔法）与 `src/ui/dom.js`（焦点/aria 基建）已写但 `screens.js` 未接线。
- [ ] **E2 战斗日志 aria-live 播报** ❌ dom.js 的 `announce()` 未被调用；日志区无 role=log/aria-live。
- [ ] **E3 血条/灵气条 progressbar 语义** ❌ dom.js 的 `meter()` 未被调用；当前为纯视觉 div。
- [ ] **E4 屏切换焦点管理** ❌ `focusScreen()` 未被调用；innerHTML 重渲染后焦点回到 body。
- [ ] **E5 静音与减动效开关** ❌ `settings.mute/reducedMotion` 字段存在但无 UI 开关；未响应 `prefers-reduced-motion`。
- [ ] **E6 焦点可见样式**（:focus-visible 轮廓）❌ ink.css 未定义。
- [ ] **E7 文本对比度 ≥ 4.5:1**（`.muted` opacity 0.65 叠加宣纸底需实测）⚠️ 未测量。

## F. 性能基准

- [x] **F1 识别性能：p95 < 4ms/笔（node 端）** ✅
  度量：`node scripts/bench.mjs` exit 0 且 p95Ms<4。基线：p50≈0.045ms、p95≈0.062ms（3000 笔），余量 60 倍——**但当前 bench 因 A7 识别漂移 exit 2，红灯需先修**。
- [x] **F2 战斗结算：< 1ms/回合** ✅ 基线：50 回合 0.86ms（0.017ms/回合）。
- [x] **F3 生产构建通过且 JS gzip < 100KB** ✅ 基线：29 模块，32.4KB（gzip 13.5KB）。
- [x] **F4 preview 服务器可用** ✅ 基线：`vite preview` HTTP 200。
- [ ] **F5 60fps 墨迹（桌面 Chrome）** ❌ 无实证。度量：Performance 面板录制 10s 连续绘制，主线程帧率 ≥58fps、无 >50ms 长任务；或页内 rAF 采样器输出。
- [ ] **F6 零计时器/监听器泄漏** ❌ 战斗结束 interval 不清理（B9 同源）；painter 的 `resize` 监听 `destroy()` 不摘除。度量：连打 5 场后 `getEventListeners(window).resize` 数量恒定、活跃 interval 为 0。
- [ ] **F7 战斗页 rAF 驱动渲染**（当前 200ms setInterval 轮询整段 innerHTML 日志重写）⚠️ 可接受但非 SOTA；度量：改 rAF + 增量 DOM 后输入→上屏延迟 <32ms。

## G. 目录隔离

- [x] **G1 游戏代码全部位于 `games/linghuashi/`** ✅ 度量：`git status` 无本目录之外的业务改动。基线：通过。
- [x] **G2 不改仓库根业务文件** ✅ 基线：`test.js`、根 `package-lock.json`（已提交版）未动。
- [ ] **G3 根目录不新增未跟踪文件** ⚠️ 工作区根出现**未跟踪 `package-lock.json`**（环境安装副产物）。度量：`git status --short` 在 `games/linghuashi/` 之外为空。**严禁提交该文件**；Round 2 应在根 `.gitignore` 处理或删除。
- [x] **G4 独立 npm 依赖树**（devDependencies 仅 vite/vitest/jsdom，无运行时依赖）✅ 基线：通过。
- [x] **G5 构建产物隔离**（dist/.vite/node_modules 均在本目录 .gitignore）✅ 基线：通过。
- [x] **G6 分支纪律**（仅在 `cursor/linghuashi-sota-a345` 工作）✅ 基线：通过。

## H. 工程与文档

- [x] **H1 vitest 全绿** ✅ 基线：4 文件 20 用例全过（stroke 8 / combat 7 / progression 3 / store 2）。
- [ ] **H2 probe 门禁 exit 0** ❌ 基线 exit 1（见 A7）。
- [ ] **H3 bench 门禁 exit 0** ❌ 基线 exit 2（见 A7）。
- [ ] **H4 单测覆盖新增纯函数** ⚠️ `battleModifiers/normalizeModifiers/unlockMo/moProgress/synthesizeStroke(keycast)` 均无用例；combo/crit 分支无用例。度量：上述导出函数每个 ≥1 断言。
- [ ] **H5 API_CONTRACT.md 与实现同步** ⚠️ 契约缺 `modifiers` 参数、`idlePreview`、`unlock.js`、`keycast.js` 条目；`createBattle(seed, player, enemy)` 签名与实际 `createBattle({player, enemy, seed, modifiers})` 不符。
- [ ] **H6 六职业手感差异可感知** ⚠️ 数据层 bonus 差异存在（±26–35% 对应笔法），但因 B8 天赋不生效、B10 无 telegraph，"手感"仅剩笔法加成一维；待 B8/B10 修复后由 5 人盲测区分 ≥4 职业。
