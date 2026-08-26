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
