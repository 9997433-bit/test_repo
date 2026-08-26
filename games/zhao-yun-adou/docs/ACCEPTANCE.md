# 验收记录

由 Fable-4 在各轮结束后回写实测结果。基线由主调度器在 Round 0 脚手架中预留。

---

## Round 1 · SOTA 验收审计（Fable-4）

- **审计时间**：2026-08-26 07:25 UTC
- **分支**：`cursor/zhao-yun-adou-673d`
- **审计基准提交**：`04d65d3`（test(zhao-yun-adou): merge cloud probe, bench, and invariants）
- **环境**：Node v22.14.0 / npm 10.9.7 / Vitest 3.2.7 / Vite 6.4.3（Linux 云端 VM）
- **审计范围**：只读审查 `games/zhao-yun-adou` 全树 + 实跑 `npm test` / `npm run probe` / `npm run bench` + 4180 端口 dev server 冒烟 + 头less 满载压测

> ⚠️ **审计期间工作树非静态**：并行的写码 Agent 在审计过程中持续提交（`604262a`、`04d65d3`）并留有未提交改动（`src/ai/opponent.js`、`src/board/merge.js`、`src/core/game.js`、新增 `src/board/hand.js` 等，共 8+ 个脏文件，方向为谓词层/存档版本/固定步长重构）。下方三条命令输出取自 **同一次连续运行**（07:25 UTC，HEAD=`04d65d3`），运行前后 HEAD 未变。UI 层文件（`main.js`、`ui/render.js`、`ui/lane.js`、`styles/ink.css`、`audio/sfx.js`）在审计时无未提交改动，UI 差距结论稳定。两次 bench 之间 `playerWins` 出现 23→24 漂移，原因是写码 Agent 在两次运行间改动了 `src/ai/opponent.js`（同一状态下同种子可复现，见 `tests/state.test.js` 确定性用例）。

### 1. `npm test` — ✅ 通过（4 文件 / 20 用例全绿，退出码 0）

```text
> zhao-yun-adou@0.1.0 test
> vitest run

 RUN  v3.2.7 /workspace/games/zhao-yun-adou

 ✓ tests/awaken.test.js (7 tests) 5ms
 ✓ tests/game.test.js (8 tests) 7ms
 ✓ tests/state.test.js (2 tests) 13ms
 ✓ tests/merge.test.js (3 tests) 2ms

 Test Files  4 passed (4)
      Tests  20 passed (20)
   Start at  07:25:00
   Duration  322ms (transform 74ms, setup 0ms, collect 163ms, tests 26ms, environment 0ms, prepare 221ms)
```

覆盖点核对：合并（merge.test.js）、拼字觉醒（awaken.test.js，7 例）、漏怪扣心+馒头补偿（game.test.js）、双损平局判负（game.test.js）、征兵费用递增/满手拒绝、铲子扩地、神兵符、存档形状快照与同种子 AI 确定性（state.test.js）。

### 2. `npm run probe` — ✅ 通过（六条玩法路径全 pass，不变量 0 违例，退出码 0）

```json
{
  "seed": 99,
  "paths": {
    "recruit": { "passed": true, "cardKind": "unit", "cost": 10 },
    "place": { "passed": true, "cell": 5 },
    "merge": { "passed": true, "from": 6, "to": 5, "level": 2 },
    "awaken": { "passed": true, "hero": "zhaoyun" },
    "shovel": { "passed": true, "cell": 0 },
    "leak": { "passed": true, "heartsBefore": 3, "heartsAfter": 2, "compensation": 10 }
  },
  "invariants": {
    "checks": 7, "maxHearts": 3, "minMantou": 38, "maxHand": 1,
    "violations": [], "passed": true
  },
  "failedChecks": [],
  "passed": true
}
```

### 3. `npm run bench` — ✅ 通过（36/36 局收敛，无不变量违例，退出码 0）

```json
{
  "matches": 36,
  "settled": 36,
  "settledRate": 1,
  "playerWins": 24,
  "winRate": 0.6667,
  "avgDurationSeconds": 153.41,
  "avgTicks": 3068.25,
  "totalSimTimeMs": 547.67,
  "avgSimTimeMs": 15.21,
  "p95SimTimeMs": 32.53,
  "maxSimTimeMs": 49.14,
  "thresholds": { "minSettledRate": 0.8, "maxMatchSimTimeMs": 2000 },
  "invariantViolations": [],
  "passed": true
}
```

平均一局 153 秒（GDD 目标 3–5 分钟 ✅ 下沿）；启发式玩家胜率 ~2/3，说明 AI 镜像半区有真实对抗强度。

### 4. 补充证据 A：dev server 冒烟（端口 4180）— ✅

```text
VITE v6.4.3  ready in 115 ms
➜  Local:   http://localhost:4180/

curl /                     → http=200 bytes=744
curl /src/main.js          → http=200 bytes=18915（Vite dev 变换后）
curl /src/styles/ink.css   → http=200 bytes=6407
<title>赵云与阿斗 · 汉字塔防</title>
```

（审计后已停掉 dev server，释放 4180 供写码 Agent 使用；`strictPort: true`。）

### 5. 补充证据 B：满载模拟压测（审计员临时脚本，未入库）— 模拟层 ✅

场景：双方棋盘 40 格全满 5 级兵 + 每侧 120 个在途敌人（同屏 240+ 单位），以 60fps 步长连续 600 帧：

```json
{
  "framesSimulated": 600,
  "enemiesPerSide": 120,
  "unitsOnBoard": 40,
  "avgTickMs": 0.02,
  "p95TickMs": 0.2178,
  "maxTickMs": 3.378,
  "budgetPerFrameAt60fpsMs": 16.67
}
```

**结论**：模拟层远低于 16.67ms 帧预算，「同屏 80+ 单位」在逻辑层完全无压力。**但渲染层未达标**——`src/main.js` 把 `render()` 节流到 30Hz（`acc >= 1/30`），且每次渲染用 `root.innerHTML = ...` 整页重建 DOM 并重绑全部事件监听。视觉帧率被设计上限在 ~30fps，「60fps 目标」在渲染侧不成立；真机浏览器 profiling 本轮未做（无 GUI 环境）。

---

## 与已上线微信/抖音小游戏的差距清单（Gap List）

按验收指定六轴排列，`P0` = 不补齐无法过审/留存必崩，`P1` = 明显低于爆款水准，`P2` = 打磨项。

### A. Juice / 打击感

| 级 | 差距 | 证据 |
| --- | --- | --- |
| P0 | 无伤害飘字：`ink.css` 定义了 `.fx-float` + `rise` 动画，但 JS 全树 0 处实例化；ART_DIRECTION 承诺的「数字飘字」未落地 | `src/styles/ink.css` vs `src/ui/*.js` |
| P0 | 攻击/击杀完全不可见：单位无攻击动画，无投射物（弓/武将都是瞬时扣血），敌人死亡直接从 canvas 消失，无墨点飞溅 | `src/combat/sim.js` `harm()`、`src/ui/lane.js` |
| P0 | 技能无视觉表现：武将大招只有 toast 文案 + 240Hz 蜂鸣，无 ART_DIRECTION 承诺的「泼墨扩散」 | `src/main.js` `bus.on("skill")` |
| P1 | ARCHITECTURE.md 承诺状态字段 `projectiles` / `fx`，审计基准提交中均不存在 | `src/core/game.js` state 定义 |
| P1 | 合并/觉醒无动画（格子字符瞬变），无卡牌入手动画，无连击反馈 | `src/ui/render.js` |
| P1 | 阿斗受击无「字身颤抖」（只有玩家半区整体 shake，且 AI 侧受击无任何反馈） | `src/main.js` leak 处理、`.shake` |
| P1 | 音频为裸振荡器 beep，无 BGM、无静音开关、无音量设置 | `src/audio/sfx.js` |
| P2 | 无触觉反馈（小游戏标配 `wx.vibrateShort` 类震动） | 全树无对应抽象 |

### B. Tutorial / 新手引导（FTUE）

| 级 | 差距 | 证据 |
| --- | --- | --- |
| P0 | 无分步强引导：爆款标配「蒙层高亮 → 强制点征兵 → 强制拖放 → 强制合并 → 觉醒庆祝」，现状仅开局面板一段静态规则文字 + toast 静态提示 | `src/ui/render.js` overlay/panel、toast 默认文案 |
| P1 | 无首次进入检测（全树无 localStorage/任何持久化），每局体验与首局相同 | 全树 grep 无 storage |
| P1 | 卡牌无说明（「符」「铲」对新手不可解释），无武将图鉴/拼字目标提示（哪些单字能拼谁） | `src/ui/render.js` 手牌渲染 |

### C. Drag-merge on-board / 盘上拖拽合并

| 级 | 差距 | 证据 |
| --- | --- | --- |
| P0 | **玩家无法主动合并盘上两枚棋子**：`api.merge(side, from, to)` 存在且 AI 在用，但 UI 没有任何「拾起盘上单位」的入口 | `src/main.js` 只对 `[data-hand]` 做选中 |
| P0 | `tryDrop` 兜底逻辑是缺陷而非功能：手牌放到不可合并的占用格失败后，会从「第一个有单位的格子」向目标格发起 merge——而 `merge()` 不可合并时会**交换**两格，等于随机挪动玩家棋子 | `src/main.js` `tryDrop()` + `src/core/game.js` `merge()` swap 分支 |
| P0 | 非真拖拽：交互是「点选手牌 → 点格子」，无跟随指针的 ghost、无有效落点高亮（仅 hover 描边）、无拖拽取消；`render()` 每 33ms 重建 DOM 会摧毁 `setPointerCapture` 的元素，长按拖动天然断裂 | `src/main.js` `frame()`/`bind()`、`src/ui/render.js` `innerHTML` |
| P1 | 无可合并目标提示（爆款会在拖起时高亮所有同种同级格） | `src/ui/render.js` |

### D. 60fps / 性能

| 级 | 差距 | 证据 |
| --- | --- | --- |
| P0 | 渲染帧率设计上限 ~30fps：`acc >= 1/30` 节流 + 每帧 `innerHTML` 全量重建 + 全量事件重绑（约 40 格 + 5 手牌 + 按钮），低端安卓上 GC/布局抖动风险高 | `src/main.js` 96–110 行区域、`src/ui/render.js` |
| P1 | 无 fps 计数器/性能 HUD，无法在真机验证「同屏 80+ 不掉 30」；本轮仅验证模拟层（0.02ms/tick @240 敌，✅） | 补充证据 B |
| P1 | Google Fonts CDN 阻塞首屏（`fonts.googleapis.com` 在微信 webview/大陆网络不可达），上线形态必须本地打包字体子集 | `index.html` 8–13 行 |
| P2 | 模拟层已达标可不动；lane canvas 绘制轻量，不是瓶颈 | `src/ui/lane.js` |

### E. A11y / 无障碍

| 级 | 差距 | 证据 |
| --- | --- | --- |
| P0 | 键盘完全不可用：棋盘格/手牌均为无 `tabindex`/`role` 的 div；且 30Hz `innerHTML` 重建每秒摧毁焦点 30 次 | `src/ui/render.js` |
| P1 | 无任何 ARIA：toast 无 `aria-live`，心数用「♥♡」字形无文本替代，锁定格「锁」无语义 | `src/ui/render.js` `hearts()`/toast |
| P1 | 无 `prefers-reduced-motion` 适配（shake/rise 动画无条件播放） | `src/styles/ink.css` |
| P2 | 品级色（tier-1 灰 #8a8174 落在宣纸底上）对比度未验证 | `src/styles/ink.css` |

### F. Mobile / 移动端

| 级 | 差距 | 证据 |
| --- | --- | --- |
| P0 | 无 `touch-action: none`/手势守卫：触屏拖动会滚动页面而非拖牌；只有 `user-select: none` 在格子上 | `src/styles/ink.css` |
| P1 | `viewport-fit=cover` 声明了却无 `env(safe-area-inset-*)` 使用，刘海屏底部手牌可能被遮挡 | `index.html` + `ink.css` `#app` |
| P1 | GDD 承诺「可离线」但字体走 CDN、无 Service Worker/manifest，实际离线白字 | `index.html`、GDD「一句话」段 |
| P1 | 非真小游戏形态：无 wx/tt 适配层（登录、分享、震动、激励视频桩），当前为 Web 复刻——按 GDD 设定属「非目标」，但对照「已上线小游戏」仍是形态差距 | GDD「非目标」段 |
| P2 | 720px 以下断点仅把 lane 与棋盘改为上下堆叠，小屏格子/手牌点击目标可能 <44px，未做真机核验 | `ink.css` `@media (max-width: 720px)` |

### G. 引擎/契约层其他发现（不属六轴但影响验收）

1. **射程机制退化**：`rangeOk(enemy)` 完全没用 `enemy` 参数；5×4 棋盘上 `cellDistToPath` 的 edge ∈ {0,1}，`edge <= reach + 0.15` 对射程 1 的近战恒真 → **任何单位可打路线上任何位置的任何敌人**，「近战打相邻格、弓打两格」的 GDD 规则和内外圈站位博弈实际不存在（`src/combat/sim.js` 65–69 行区域）。
2. **API 契约缺口**：`API_CONTRACT.md` 要求 `load(snapshot)`，审计基准提交只有 `serialize()`；写码 Agent 的未提交改动正在补 `SAVE_VERSION`/`load`，下轮复验。
3. 审计基准提交存在死代码：`engine.js clampDt`、`path.js nearestPathT` 无调用方（未提交改动正在接入 `clampDt`）。
4. toast 永不自清（`flash()` 只写不清，旧提示常驻到被覆盖）。
5. 仓库根有游离未跟踪文件 `/workspace/package-lock.json`（某次在错误 cwd 执行 npm 生成），**不得随游戏提交入库**；游戏目录自身的隔离性良好（全部提交仅触及 `games/zhao-yun-adou/**` 与 `.agent_workspace/**`）。

---

## Round 1 结论

**引擎/测试/脚本层：通过。** 三条验收命令全绿、不变量零违例、模拟层性能余量巨大（0.02ms/tick @ 240 同屏单位）、单局时长落在 GDD 区间。

**产品层：距「已上线微信/抖音小游戏」尚有 8 项 P0**：伤害飘字、攻击可视化、技能特效（juice ×3）；分步强引导（tutorial ×1）；盘上拖拽合并缺失 + tryDrop 误交换缺陷 + 真拖拽手势（drag ×3，其中 tryDrop 是必须修的正确性 bug）；触屏手势守卫（mobile ×1）。渲染层 30fps 设计上限使「60fps 目标」当前不可能达成，需改为增量 DOM 更新或 canvas 化后用真机复测。

下轮建议优先序：修 `tryDrop` 误交换 → 盘上拖拽合并 → 渲染层增量化（解锁 60fps 与拖拽手势的共同前提） → 飘字/墨溅 → 分步引导。

---

## Round 2 · SOTA 验收审计（Fable-4）

- **审计时间**：2026-08-26 07:53–07:59 UTC
- **分支**：`cursor/zhao-yun-adou-673d`
- **实测基准提交**：`4f85dd3`（feat: replay-safe snapshots and per-side enemy ids）；审计结束时 HEAD 已推进到 `1b84a90`（coverage-aware board placement helpers）
- **环境**：Node v22.14.0 / npm 10.9.7 / Vitest 3.2.7 / Vite 6.4.3（Linux 云端 VM）
- **审计范围**：只读复查 R1 六轴差距 + 实跑 `npm test` / `npm run probe` / `npm run bench` + 4180 冒烟 + 头less 满载压测（模拟层 + 渲染层）

> ⚠️ **审计期间工作树高度活跃**：写码/测试 Agent 在 6 分钟内推了 5 个提交（`998fdba` 契约测试、`a76fb1b` bench 遥测、`4f85dd3` 回放安全存档、`1b84a90` 覆盖布阵模块），另有未提交样式改动（竖幅立轴排版，Fable-2 在途）与未跟踪 `src/ui/juice.js`（409 行 juice 接线层，Opus-4 在途）。07:53 首跑曾出现 1 例失败（当时未跟踪的 `game-contract.test.js` 断言口径），数分钟后被测试 Agent 自行修正，复跑全绿——该失败不计入结论。下方三条命令输出取自 `4f85dd3` 的**同一轮连续运行**。

### 1. `npm test` — ✅ 通过（10 文件 / 92 用例全绿，退出码 0）

```text
 ✓ src/combat/sim.test.js (22 tests)      ✓ tests/game-contract.test.js (4 tests)
 ✓ tests/state.test.js (2 tests)          ✓ src/combat/pressure.test.js (11 tests)
 ✓ src/board/placement.test.js (21 tests) ✓ tests/game.test.js (8 tests)
 ✓ src/combat/geometry.test.js (6 tests)  ✓ tests/awaken.test.js (7 tests)
 ✓ src/combat/skills.test.js (8 tests)    ✓ tests/merge.test.js (3 tests)

 Test Files  10 passed (10)
      Tests  92 passed (92)
   Duration  720ms
```

对比 R1 合入后（67/67）：新增契约 4 项（暂停恢复、盘面合并、征兵成本一致性、存档→读档精确续跑）与覆盖布阵 21 项。

### 2. `npm run probe` — ✅ 通过（六路径全 pass，不变量 8 项 0 违例，退出码 0）

```json
{
  "seed": 99,
  "paths": {
    "recruit": { "passed": true, "cardKind": "unit", "cost": 8 },
    "place":   { "passed": true, "cell": 5 },
    "merge":   { "passed": true, "from": 6, "to": 5, "level": 2 },
    "awaken":  { "passed": true, "hero": "zhaoyun" },
    "shovel":  { "passed": true, "cell": 0 },
    "leak":    { "passed": true, "heartsBefore": 3, "heartsAfter": 2, "compensation": 10 }
  },
  "invariants": { "checks": 8, "violations": [], "passed": true },
  "passed": true
}
```

首征兵 cost=8 对应新曲线 `recruitCost = 8 + 5n`（R1 为 10+4n）。

### 3. `npm run bench` — ✅ 脚本通过 / ❌ 胜率未达标（36/36 收敛，退出码 0）

```json
{
  "matches": 36, "settled": 36, "settledRate": 1,
  "playerWins": 33, "winRate": 0.9167,
  "avgAwakenedHeroesTotal": 0.0833,
  "avgDurationSeconds": 182, "avgTicks": 3639.94,
  "avgSimTimeMs": 23.89, "p95SimTimeMs": 47.73, "maxSimTimeMs": 69.98,
  "invariantViolations": [], "passed": true
}
```

- **胜率 33/36 = 91.67%，两次运行一致，与 R1 合入后（33/36）持平**。平衡提交 `4ac3f8c`（recruit 曲线/波次/DPS 重调）没有把 headless 胜率拉向 45–55% 目标。
- 新遥测给出线索：`avgAwakenedHeroesTotal = 0.083`/局——headless 对局里武将几乎从不觉醒，胜负几乎全由兵种 DPS 曲线决定；leaksByWave 前 3 波双方零漏。下轮调参应以此遥测为准绳。
- 单局时长 avg 182s（分布 156–228s），仍落在 GDD 3–5 分钟区间下沿。

### 4. 补充证据 A：dev server 冒烟（端口 4180）— ✅

并行 Agent 的 dev server 已在 4180 运行，直接复用冒烟：`/`=200（2654B）、`/src/main.js`=200（91KB dev 变换后）、`/src/styles/ink.css`=200、`/src/ui/render.js`=200；`<title>赵云与阿斗 · 汉字塔防</title>`。审计未占用/未重启该服务。

### 5. 补充证据 B：满载压测（审计员临时脚本 `/tmp/r2-stress.mjs`，未入库）

场景同 R1：双方 20 格全满 5 级兵（40 单位）+ 每侧 120 敌（同屏 240+），60fps 步长 600 帧；另测 `render()` 全量调用成本（jsdom，120 次）：

```json
{
  "simTickMs":          { "avg": 0.422, "p95": 1.039, "max": 3.256 },
  "renderCallMs_jsdom": { "avg": 3.576, "p95": 5.614, "max": 24.261 },
  "budgetPerFrameAt60fpsMs": 16.67
}
```

- 模拟层：真实射程改成 O(格×敌) 的逐对判定后，tick 成本从 R1 的 0.02ms 涨到 0.42ms（×20），但仍只占帧预算 2.5%，**同屏 240 单位无压力**。
- 渲染层：`main.js` 已改为「离屏 `render()` → `morphChildren` 同构 diff → 签名短路」，事件只绑一次，lane 画布每帧全速重绘。`render()` 全量调用在 jsdom 下 3.6ms——且只在签名变化时触发，不是每帧成本（morph 部分未导出、未单测）。**R1「30fps 设计上限」已解除**；遗留：DOM 补丁仍有 1/30s 节流兜底（HUD 文本 30Hz）、无 fps HUD、真机帧率未测。

---

## R1 六轴差距复评（Gap List 逐项对账）

### A. Juice / 打击感 — ❌ 未合格（在途）

| R1 差距 | R2 状态 | 证据 |
| --- | --- | --- |
| 无伤害飘字 | ❌ 在途 | `.fx-float` 关键帧就绪（`motion.css`），JS 仍 0 处实例化 |
| 攻击/击杀不可见 | ⚠️ 部分 | lane 画布新增血条/护盾环/眩晕标/Boss 光晕（受击可读了）；但死亡仍瞬间消失，无墨溅、无投射物 |
| 技能无视觉 | ❌ 在途 | 引擎侧 `skill` 事件已带全量 juice 载荷（fx/hits/damage/targets/juice），并新增 `kill` 事件——`main.js` 只做 beep+toast，载荷全部丢弃 |
| `projectiles`/`fx` 状态字段缺失 | ⚠️ 改道 | 契约改走事件载荷而非 state 字段；未跟踪 `src/ui/juice.js`（WAAPI 飘字层 + 画布特效队列，绕开 diff 的正确设计）审计中出现，**尚未接入** |
| 合并/觉醒无动画 | ❌ 在途 | `.fx-merge`/`.fx-awaken` 关键帧就绪，无 JS 挂类 |
| 音频裸 beep、无 BGM/静音 | ❌ | `sfx.js` 未变 |

### B. Tutorial / 新手引导 — ⚠️ 部分合格

- ✅ 新增情境教练条 `coachHtml`：按局面点亮「征兵→选牌→落子」三步，前 2 波常驻；开局面板升级为三步图解 + 快捷键表；所有格子/手牌带完整 title 说明（含「还差哪个字觉醒谁」配对提示）。
- ❌ 仍无蒙层强引导（不阻断操作）；全树 0 处 localStorage，无首局检测，每局教练条重复出现。

### C. Drag-merge on-board — ✅ 合格（R1 三项 P0 全清）

- ✅ 盘上棋子可拾起：`onPointerDown` 对 `[data-cell]` 启动拖拽，`resolveDrop → api.merge`。
- ✅ `tryDrop` 误合并/误交换缺陷随重写消失：`merge()` 显式四分支（挪空格发 `move` / 合并发 `merge` / 贴符发 `token` / 换位发 `swap`，换位是有意语义），手牌落错格只报原因不再乱动棋子。
- ✅ 真拖拽：ghost 跟随指针、DRAG_SLOP 区分点选/拖动、落点脉动高亮、拖出棋盘取消、增量 diff 保住拖拽节点、contextmenu 守卫；`onLegacyClick` 兜底老浏览器。
- ⚠️ P1 遗留：拾起时不高亮全部可合并目标格。

### D. 60fps / 性能 — ⚠️ 大幅改善，未完全闭环

- ✅ `innerHTML` 全量重建已废（R1 P0）；签名短路让静止帧零 DOM 操作；lane 画布 rAF 全速。
- ⚠️ DOM 补丁仍有 `UI_INTERVAL=1/30` 节流兜底；无 fps 计数器；真机未测（无 GUI）。
- ❌ Google Fonts CDN 仍在 `index.html`（微信 webview/离线回退风险，R1 P1 原样）。

### E. A11y / 无障碍 — ❌ 基本未动

- ✅ `prefers-reduced-motion` 已落地（`motion.css` 全局降级）。
- ⚠️ 键盘：1-5 选牌 / E 征兵 / Space·P 暂停 / R 重开 / Esc 取消已可用，但**格子无 tabindex/role，键盘无法选格落子**，主玩法键盘不可达。
- ❌ ARIA 全缺：toast 无 `aria-live`，心数仍是「♥♡」字形无文本替代，锁格「锁」无语义（title 只服务指针用户）。

### F. Mobile / 触屏 — ⚠️ 部分合格

- ✅ `touch-action: none` 注入棋盘与手牌、根容器 `manipulation`（`main.js decorate()` + `board.css`/`cards.css`）；`env(safe-area-inset-bottom)` 进了 `#app` padding（`base.css`）。
- ❌ 字体 CDN、无离线能力未动；真机触屏未验；在途样式改动正在做竖幅小游戏构图（未提交，不计入本轮结论）。

### G. 引擎/契约层对账

1. ✅ **射程机制真实化**（R1 G1）：`runBoard` 改为格心↔敌人路线坐标的真实距离 + 衰减圈，`geometry.js` 提供 `coverageWindows`/`coverageRatio`（6 项测试）；战斗层留 `BALANCE.towerDamage=1.35` 覆盖补偿并可调。
2. ✅ **`load(snapshot)`**（R1 G2）：落地且过契约测试（存档→读档→征兵结果逐字段一致）。
3. ✅ **`enemySeq` 入 state**（R2 简报项）：`4f85dd3` 每侧 `nextEnemyId` 入 state、tick 后收编重编号、`serialize({replay:true})` 存读档字节一致、`stepper.setPending` 回填步长余量。`sim.js` 模块级 `enemySeq` 仍在但已被中和。
4. ❌ **AI 未用覆盖窗口**：`board/placement.js`（479 行，coverage 打分 + 21 项测试，`1b84a90`）已备好，但 `ai/opponent.js` 未 import，布阵仍按 `cellDistToPath`——AI 在真实射程下按错误模型站位，疑似 91% 胜率主因之一。
5. ✅ toast 自动消隐（TTL）、暂停（Space/P + 切后台自动暂停）、`clampDt` 接入、双破防平局裁定（斩获→漏怪→存粮）均已落地。
6. ❌ 新发现小缺陷：HUD 提示写「征兵 10+4×已征次数」，实际 `recruitCost = 8 + 5n`（`render.js` 文案未随 `4ac3f8c` 调参更新）。
7. ⚠️ 仓库根游离 `/workspace/package-lock.json` 仍未清（R1 已警告）。

---

## Round 2 结论

**引擎/测试/脚本层：通过且显著变厚。** 92/92 测试全绿（R1 的 67 → 92）、probe 六路径 pass、bench 36/36 收敛零违例；R1 的三项结构性欠账——渲染增量化、盘上拖拽合并（含 tryDrop 正确性 bug）、回放安全存档——已全部还清，真实射程 + 覆盖几何 + 契约测试补齐了 R1 的机制退化。

**R2 简报五项攻坚：完成 1.5 / 5。** ✅ enemySeq 入 state；⚠️ 教程/触控半程（教练条 + touch-action 落地，强引导/首局记忆/真机缺）；❌ juice 上屏（两头就绪、中间断线，`juice.js` 在途未接）；❌ 胜率仍 91.67%（调参未见效，觉醒率 0.083/局是新线索）；❌ AI 覆盖窗口（模块就绪、AI 未切换）。

下轮建议优先序：接通 `juice.js`（在途，最接近完成）→ `opponent.js` 切 `placement.js` 覆盖打分 → 以 bench 遥测（觉醒率/leaksByWave）为准绳重校数值到 45–55% → 蒙层 FTUE + localStorage → ARIA/键盘选格 + 字体自托管。

---

## Round 3 · SOTA 终验（Fable-4，最终回签）

- **审计时间**：2026-08-26 08:14–08:28 UTC
- **分支**：`cursor/zhao-yun-adou-673d`
- **实测基准提交**：`60c85e7`（test: drive the drop parity matrix off named cases）
- **环境**：Node v22.14.0 / npm 10.9.7 / Vitest 3.2.7 / Vite 6.4.3（Linux 云端 VM，`npm ci` 干净安装）
- **审计范围**：R2 差距逐项对账 + R3 冲刺六项对账 + 实跑 `npm test` / `npm run probe` / `npm run bench`（各基准一轮，共三轮）+ 4180 dev server 冒烟 + 头less 满载压测

> ⚠️ **审计期间工作树持续在动（与前两轮同款）**：开跑时 HEAD=`7c25933`，14 分钟内写码 Agent 推了 6 个提交——`2364b9e`（课程计数入档 + bench 胜率闸门）、`0c1afb4`（孤儿板块谓词对拍测试）、`0103233`（飘字描边）、`7da2994`（清过渡死代码）、`9e152b4`（战斗层畸形状态加固）、`60c85e7`（对拍矩阵具名化）。三条验收命令在 `7c25933`、`2364b9e`、`60c85e7` 三个基准各完整跑过一轮，**三轮全绿**；下方输出取自最终基准 `60c85e7`。审计结束后二次 fetch 45 秒无新提交，基准视为已静止。

### 1. `npm test` — ✅ 通过（17 文件 / 194 用例全绿，退出码 0）

```text
 ✓ src/combat/tuning.test.js (10)     ✓ src/board/placement.test.js (21)
 ✓ src/combat/replay.test.js (11)     ✓ src/ai/opponent.test.js (8)
 ✓ tests/state.test.js (2)            ✓ src/board/drop.test.js (39)
 ✓ src/combat/sim.test.js (22)        ✓ tests/round3-regressions.test.js (5)
 ✓ src/board/hand.test.js (16)        ✓ src/ui/juice.test.js (13)
 ✓ src/combat/pressure.test.js (11)   ✓ tests/game.test.js (8)
 ✓ src/combat/skills.test.js (8)      ✓ tests/awaken.test.js (7)
 ✓ tests/game-contract.test.js (4)    ✓ tests/merge.test.js (3)
 ✓ src/combat/geometry.test.js (6)

 Test Files  17 passed (17)
      Tests  194 passed (194)
   Duration  1.11s
```

三轮轨迹：R1 20 → R2 92 → R3 **194**。本轮新增大项：`drop.test.js` 39 项对拍矩阵（`main.js` 落子判定 vs `board/merge.js` 谓词逐格一致）、`hand.test.js` 16 项（孤儿模块钉住而非删除）、`round3-regressions.test.js` 5 项（`kill`/`leak`/`skill` 载荷契约逐键锁形、压力充能跨存档续跑、课程计数「读档续阶段 / 重开归零」）。

### 2. `npm run probe` — ✅ 通过（八路径全 pass，不变量 8 项 0 违例，退出码 0）

```json
{
  "seed": 99,
  "paths": {
    "recruit":  { "passed": true, "cardKind": "unit", "cost": 8 },
    "place":    { "passed": true, "cell": 5 },
    "merge":    { "passed": true, "from": 6, "to": 5, "level": 2 },
    "awaken":   { "passed": true, "hero": "zhaoyun" },
    "shovel":   { "passed": true, "cell": 0 },
    "leak":     { "passed": true, "heartsBefore": 3, "heartsAfter": 2, "compensation": 10 },
    "gameOver": { "passed": true, "winner": "player" },
    "telemetry":{ "passed": true }
  },
  "invariants": { "checks": 8, "violations": [], "passed": true },
  "passed": true
}
```

R2 的六路径扩到八路径（新增 gameOver 裁定与遥测自检）。

### 3. `npm run bench` — ✅ 通过，**胜率达标**（36/36 收敛，退出码 0）

```json
{
  "matches": 36, "settled": 36, "settledRate": 1,
  "playerWins": 17, "winRate": 0.4722,
  "avgAwakenedHeroesTotal": 0.2222,
  "avgDurationSeconds": 207.07,
  "durationDistributionSeconds": { "min": 171.1, "p50": 203.15, "p95": 241.5, "max": 242.1 },
  "avgSimTimeMs": 29.6, "p95SimTimeMs": 61.5, "maxSimTimeMs": 70.1,
  "thresholds": { "minSettledRate": 0.8, "minWinRate": 0.4, "maxWinRate": 0.6, "maxMatchSimTimeMs": 2000 },
  "invariantViolations": [],
  "passed": true
}
```

- **胜率 17/36 = 47.22%，四次运行（跨 `7c25933` / `2364b9e` / `60c85e7` 三个基准）逐次一致**——R1 66.7% → R2 91.7% → R3 **47.22%**，正中 45–55% 目标带。生效手段是 `a7cc5bb` 拉陡后期波次：leaksByWave 显示漏怪全部集中在 9–12 波（player 56 / ai 19），前 8 波双方零漏，「前期教学、后期见真章」的曲线成形。
- **bench 脚本自带胜率闸门 [0.40, 0.60]**（`2364b9e`）：`passed` 现在直接要求胜率在带内，平衡回归从「审计发现」升级为「脚本拦截」。
- 觉醒率 0.22/局（R2 0.083 的 2.7 倍）仍偏低——头less 对局武将罕见登场，胜负主要由兵种曲线决定；遥测已备，留作后续调参线索，不阻塞验收。
- 单局 avg 207s（171–242s），GDD 3–5 分钟区间内；单局模拟 avg 29.6ms，阈值 2000ms 余量巨大。

### 4. 补充证据 A：dev server 冒烟（端口 4180）— ✅

```text
npm ci → Vite v6.4.3 ready in 121 ms（strictPort 4180）
/                    → 200 2638B
/src/main.js         → 200 90966B（dev 变换后）
/src/styles/ink.css  → 200 43099B
/src/ui/juice.js     → 200 76774B
/src/styles/fx.css   → 200 9089B
<title>赵云与阿斗 · 汉字塔防</title>
```

### 5. 补充证据 B：满载压测（审计员临时脚本 `/tmp/r3-stress.mjs`，未入库）— ✅

场景同 R1/R2 口径：双方 20 格全解锁满 5 级兵（40 单位）+ 每侧 120 敌（同屏 240+），60fps 步长双侧连跑 600 帧：

```json
{
  "framesSimulated": 600, "enemiesPerSide": 120, "unitsOnBoard": 40,
  "avgTickMs": 0.302, "p50TickMs": 0.2448, "p95TickMs": 0.4172, "maxTickMs": 3.9754,
  "budgetPerFrameAt60fpsMs": 16.67
}
```

模拟层占帧预算 **1.8%**（R2 为 2.5%，`9e152b4` 加固后反而略降）。「同屏 80+ 单位不掉 30fps」在逻辑层三倍余量成立；渲染层维持 R2 结论（增量 diff + 签名短路 + rAF 画布），真机帧率仍未测（无 GUI）。

---

### R2 审计追加项对账（十项逐一）

| R2 追加项 | 级 | 终态 | 证据 |
| --- | --- | --- | --- |
| `juice.js` 接入并消费 `kill`/`skill` 载荷 | P0 | ✅ | `d140bd3`：render 挂 `attachJuice`、lane 画布耗 `takeLaneEffects`；飘字/墨晕/弹跳/震颤/泼墨六形状全上屏；13 单测 + 载荷契约测试 |
| 数值重校到 45–55% | P0 | ✅ | 47.22%，四次一致；bench 闸门 [0.40, 0.60] 常态化把关 |
| `opponent.js` 切覆盖打分 | P0 | ✅ | `7d3429e` 经 `combat/geometry.js`（`coverageWindows`/`coverageRatio`）直连，弃 `cellDistToPath`；8 项 AI 测试。注：未走 `board/placement.js`，该模块仍为孤儿（见遗留） |
| 蒙层强引导 FTUE + localStorage | P0 | ❌ | 教练条与 R2 一字未动；全树 0 处 localStorage。**三轮唯一未动的 P0** |
| ARIA 全缺 | P1 | ❌ | `render.js` 无一处 aria/role/tabindex；键盘仍无法选格落子（juice 层自带 `aria-hidden` 是唯一进展） |
| 字体子集自托管或系统字栈 | P1 | ⚠️ | 系统字栈 ✅（`tokens.css` 双栈各 7+ 层兜底 + `display=swap`，CDN 挂了不白屏）；CDN 链接仍在 `index.html` |
| BGM/静音开关 | P1 | ❌ | `sfx.js` 原样：裸振荡器、无 BGM、无静音 |
| HUD 文案「10+4」vs 实际 `8+5n` | P2 | ❌ | `render.js` 原样，一行修复遗留三轮 |
| 真机帧率/触屏实测 | P1 | ❌ | 云端无 GUI，三轮未测；建议交人工或接 CI 无头浏览器跑 fps 采样 |
| 拾起时高亮全部可合并目标 | P1 | ❌ | 仅悬停格 `.drop` |

### R3 冲刺六项对账（R2 简报）

1. **`juice.js` 迁 `fx.css` 契约类** — ❌ 未迁。双轨照旧：`fx.css` 全部契约类与 `motion.css` 的 `.fx-merge`/`.fx-awaken` 零 JS 消费（随包死 CSS ~9KB dev）；`b67fdc0` 在 ART_DIRECTION §5.2 把双轨记为「待合流」的有意状态。功能已在屏，降级 P2 技债。
2. **课程计数入 serialize/load** — ✅ `2364b9e`：全局抽数改由两侧 `recruitCount` 之和推导（字段本就在两种快照里，无需新增），start/reset/load 三处同步 WeakMap；`7da2994` 清掉过渡期死代码 `drawRecruitCard`（审计中发现，数分钟内被写码 Agent 自行清除）；回归测试锁死「读档续阶段 / 重开归零」。**R2 确定性缺口第 4 条结清。**
3. **强制三步教程 + localStorage 首局标记** — ❌ 未动。
4. **系统字体回退** — ⚠️ 回退成立（CDN 失败不碎排版），CDN 链接未撤。
5. **全量交叉核验绿 + 胜率 45–55%** — ✅ 全绿 + 47.22%。
6. **文档与 SOTA 清单回签最终版** — ✅ 本章节 + `SOTA_CHECKLIST.md` 终版。

### 引擎/契约层本轮新发现

1. ✅ `9e152b4` 战斗层防御性加固（sim/skills/pressure/path/geometry 共 217 行插入）：畸形存档/状态不再抛异常，读档路径的健壮性补齐。
2. ✅ `0c1afb4` 对孤儿模块的处置是「钉住」而非删除：`hand.js` 16 项、`classifyDrop/canSwap` 经 39 项 drop 对拍矩阵与 `main.js` 判定逐格对齐——孤儿风险从「语义漂移」降为「纯冗余」。
3. ❌ `API_CONTRACT.md` 漂移（P2，本轮只回签验收文档、未代改契约文档）：`serialize` 注释仍称 replay 档「不含 tie/reason/enemySeq/课程计数」，实际 `game.js` 三者皆写入、课程计数已由 `recruitCount` 推导恢复；§10 待办第 4（课程计数）、第 5（AI 接覆盖）已完成未回勾。
4. ⚠️ `board/placement.js`（479 行 + 21 测试）仍无运行时消费者——AI 覆盖打分走了 `geometry.js` 直连。接入或裁撤，二选一。
5. ⚠️ 仓库根游离未跟踪 `/workspace/package-lock.json` 三轮未清（不影响 git 历史，建议人工删除）。

---

## Round 3 结论（最终回签）

**引擎 / 测试 / 脚本 / 平衡：通过，终验签字。** 194/194 测试全绿（三轮 20→92→194）；probe 八路径 + 8 不变量零违例；bench 36/36 收敛、胜率 47.22% 正中目标带且脚本闸门常态化；确定性回放全链路成立（同种子逐字节一致、存档续跑不漂移，最后一块拼图——课程计数——本轮补齐）；满载 240+ 单位模拟占帧预算 1.8%。R1 三大结构性欠账、R2 三项 P0 攻坚，至此全部结清。

**产品层对照已上线微信/抖音小游戏：有条件通过。** juice/拖拽/性能三轴达标；收敛后的差距为 **1 P0**（蒙层强制 FTUE + localStorage 首局记忆，三轮未动）+ **5 P1**（ARIA/键盘、字体自托管与离线、BGM/静音、真机验证、合并目标高亮）+ **4 P2**（HUD 文案一行修、演出层双轨合流、API_CONTRACT 回写、placement.js 孤儿处置）。全部为增量补齐，无结构性返工。完整清单见 `SOTA_CHECKLIST.md`「最终遗留清单」。

### 回签后追认（终态复核）

回签提交期间又有两个提交落地：`ade1d0a`（`combat/robustness.test.js`，259 行，钉死坏快照下战斗层不抛异常的行为——`9e152b4` 加固的配套测试）与 `bf02c5f`（GDD 按实测数据回签）。在含这两个提交的最终 HEAD 上把三条命令**再跑一轮**：`npm test` **18 文件 / 218 用例全绿**、probe 八路径 + 不变量全 pass、bench 仍 36/36 收敛、胜率仍 **47.22%**、零违例、退出码全 0。上文以 `60c85e7` 为基准的全部结论在终态 HEAD 上原样成立，本追认即最终签字状态。
