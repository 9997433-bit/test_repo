# R1-FABLE-1 — 架构 / SOTA 审计报告 · Architecture & SOTA Audit

MODEL_SLUG: claude-fable-5-thinking-xhigh

- 审计基线 Audit snapshot: commit `35a732c`（"Repaint renderer with cached painterly terrain and layered WebAudio"）+ 未提交的 `js/hud.js` 修改（其他子代理进行中）。
- 注意 Note: 本轮多个子代理并行提交。审计期间 `main.js`、`hud.js`、`render.js`、`audio.js`、`data.js`、`game.js` 均被大幅重写；下述结论均已对最新代码复核。Multiple sub-agents commit concurrently; every finding below was re-verified against the latest code, not the round-start snapshot.

---

## 1. 审计方法 · Method

**zh**：通读全部源码（7 个 JS 文件 + CSS + index.html + tests）；运行 `node tests/run.mjs`（45 通过）、`node tests/edges.mjs`（6 通过）、`node tests/bench.mjs`（40 塔 / 80 怪 ≈ 0.175 ms/tick，纯模拟约等效 5700 FPS）；headless Chrome 以 `file://` 打开 `index.html`，无未捕获异常，开始界面渲染正常；另编写三个一次性无头「机器人」脚本（/tmp，不入库）对四个难度做 30 波全程平衡探测。

**en**: Read all sources end-to-end; ran the full test suite (45 pass), edge suite (6 pass), and bench (40 towers / 80 creeps ≈ 0.175 ms/tick headless). Smoke-tested `file://` boot in headless Chrome (no uncaught errors, start screen renders). Wrote three throwaway headless "bot" scripts (kept in /tmp, not committed) that autoplay all 30 waves per difficulty with different strategies.

## 2. 平衡性证据 · Balance evidence (P0)

机器人 30 波全程实测（最新代码，含伐木场科技 + 英雄光环）
Bot playthroughs against current code, lumber tech + hero auras enabled:

| 难度 Difficulty | T1 铺塔 spam | 三阶速升 T3-focus | 混合 balanced |
|---|---|---|---|
| Easy   | 26 波败 defeat @26 | **30 波胜 VICTORY (19 lives)** | 25 波败 defeat @25 |
| Normal | 8 波败 defeat @8   | 10 波败 defeat @10 | 10 波败 defeat @10 |
| Hard   | —（前轮实测 3 波败） | — | — |
| Insane | —（前轮实测 1 波败） | — | — |

**结论 zh**：Easy 仅有一条狭窄的最优策略可通关（首次玩家几乎必败）；Normal 在 6–10 波（骑士重甲5 / 飞龙 / 城甲投石车 / 石像鬼 / 末日守卫首领）被所有策略击穿；Hard/Insane 实际不可玩。根因：击杀赏金 `4 + ⌊i/2⌋` 线性缓增，而波次 EHP `28 + 18i`（再乘难度 1.45/2.1）超线性增长；Normal 起始 120 金只够 1.5 座塔。
**en**: Easy is only winnable via one narrow tier-3-rush line; Normal collapses at waves 6–10 for every strategy (armor-5 knights, flyers, fortified catapults, boss); Hard/Insane are effectively unplayable. Root cause: bounty `4 + ⌊i/2⌋` grows linearly while wave EHP `28 + 18i` × count × difficulty multiplier grows super-linearly; 120 starting gold buys ~1.5 towers.

违反 DESIGN「SOTA 验收 #5：Easy 可通关、Hard 有挑战」。Fails SOTA bar #5.

## 3. 差距清单 · Gap list（按主题 by theme）

### HUD 真实感 HUD authenticity
- 已达标 done：资源条 / 头像 / 命令卡（快捷键以命令卡为唯一事实源）/ 小地图（点击拖动导航）/ 日志与盟友面板 / 倍率表 tooltip / 克制提示行 / F10 菜单、F9 日志、F11 盟友、F1 选英雄。
- 缺口 gaps：**伐木场升级无任何 UI 入口**（`game.js` 有 `spendLumber`/`lumberUpgradeState`，HUD 无调用——玩家攒了木材花不掉）；`wavePreview()` API 无人消费（顶栏无下一波预告芯片、小地图无出怪预警）；无自定义光标（默认/建造/无效/攻击）；悬停塔不显示射程圈（仅选中）；无 250ms tooltip 延迟；英雄护甲面板值 "4 hero" 为硬编码假数据；高分记录写入 localStorage 但无处展示。

### 平衡 Balance
- 见第 2 节。另外：`data.js` 塔的 `slow: 0.25/0.35`、`poison: 3/4` 数值被 `game.js _hitCreep` 硬编码覆盖（统一 0.65×/1.6s 减速、6dps/2.4s 中毒）——塔差异化失效，平衡旋钮全部失灵。
- 闪电链可在第 2 跳弹回原目标（仅排除 `from`），且按桶序而非最近取目标。

### 视觉 Visuals
- `35a732c` 已重绘：缓存地形、道路、尸体淡出、粒子、按高度排序、四族塔体/怪物体型/英雄体型分绘。**未在真实浏览器验证 60 FPS**（SOTA #6 仅模拟侧达标 0.175ms/tick）；日夜循环与胜负「过场」效果仍待确认/补强。

### 测试 Tests
- 51 断言全绿（45+6），覆盖伤害表/护甲公式/路径/经济/空中/魔免/溅射/链电/确定性/边界。
- 缺：**平衡回归测试**（机器人通关 Easy 作为 CI 门槛）、首领技能（践踏眩晕/寒冰光环/邪影护罩/再生）、英雄倒地重生、伐木场科技效果、赏金难度缩放；测试文件布局与 DESIGN §Technical Architecture 的五文件方案不一致（见 DESIGN 附录裁定）。

### 可访问性 a11y
- 已有 `aria-disabled`、`aria-hidden` 装饰角标、物理键位（非拉丁键盘可用）。
- 缺：遮罩层无 `role="dialog"`/`aria-modal`；画布无 `aria-label`；无 `:focus-visible` 样式；无 `prefers-reduced-motion`（震屏/闪烁不可关）；DESIGN §9 要求的色盲选项缺失；触屏仅有 mousedown 无 touch 事件。

### file:// 兼容
- **通过 PASS**：经典脚本无模块、无网络请求、localStorage 全部 try/catch、AudioContext 在手势内创建。headless Chrome `file://` 实测无报错。

### 其他 Other
- IP 卫生：英雄使用暴雪专有名词（乌瑟尔/Uther、Grom、伊利丹/Illidan、阿尔萨斯/Arthas），超出 DESIGN「职业名」授权范围，建议改原创名。
- `sim-core.js` 伤害表 `magic×heavy = 2.0` 与 DESIGN 主表 1.50 不一致——代码与真实 TFT 一致，属 DESIGN 笔误（已在 DESIGN 附录勘误，以代码为准）。
- README/PROGRESS 过时（34→51 断言；伐木场、首领技能、新快捷键未记载）。

## 4. Round 2 优先修复清单 · Prioritized fix list（12 项，含文件与验收标准）

| # | P | 修复项 Fix | 文件 Files | 验收标准 Acceptance check |
|---|---|---|---|---|
| 1 | P0 | 经济/波次曲线重调：赏金随 EHP 增长（≈hp/12 或波清奖励），Normal 6–10 波削峰，难度改缩量+缩血 | `js/data.js`, `js/sim-core.js` | 新增 `tests/balance.mjs`：混合策略机器人 Easy 通关且 ≥10 命；T3 机器人 Normal 通关；Hard 机器人 ≥18 波；全套 <60s |
| 2 | P0 | 伐木场升级 UI：空选时命令卡增设 4 个升级槽（或盟友面板购买按钮），走既有 `handleAction` | `js/hud.js`, `js/main.js` | 鼠标+快捷键均可购满 4 项科技；不足/满级时红闪+日志提示；zh/en 文案；单测覆盖 act 分发 |
| 3 | P0 | 让 `slow/poison/root` 读取塔数据而非硬编码 | `js/game.js` | 单测：u_zig(0.35) 减速强于 h_arcane(0.25)；o_burrow 毒 dps 取自数据；root 时长取自数据 |
| 4 | P1 | 顶栏下一波预告芯片 + 小地图出怪点脉冲（消费现成 `wavePreview()`） | `js/hud.js`, `js/render.js`, `index.html` | 波间显示 名称×数量/护甲/飞行/克制建议，首领显示 ★；小地图传送门首领红脉冲 |
| 5 | P1 | 浏览器端 60 FPS 实证 + 性能护栏 | `js/render.js`, `tests/` | headless Chrome 80 怪+40 塔实测平均 FPS≥60（1280×720）；确认地形缓存不整图重绘；数据记入 README |
| 6 | P1 | 每英雄补 R 大招（DESIGN §5 Q/W/E/R） | `js/data.js`, `js/game.js`, `js/hud.js` | 命令卡出现 R 槽（冷却/耗蓝可视）；R 经 `resolveHotkey` 生效；≥2 个大招单测 |
| 7 | P1 | 链电不回跳已击目标、按最近跳跃 | `js/game.js` | 单测：4 怪一线，弹跳集合无重复、按距离序 |
| 8 | P2 | a11y/i18n 加固：overlay `role=dialog`+`aria-modal`、画布 aria-label、`:focus-visible`、`prefers-reduced-motion`、色盲配色选项 | `index.html`, `css/wc3.css`, `js/hud.js`, `js/render.js` | 纯键盘完成 开局→建→升→卖→暂停→菜单 全流程；色盲开关改变怪物/血条配色；动效可减 |
| 9 | P2 | 自定义光标（默认/建造/无效/攻击）+ 悬停塔显示射程圈 | `css/wc3.css`, `js/main.js`, `js/render.js` | 光标随上下文切换（data-URI，无外部资源）；悬停未选中塔即显示射程 |
| 10 | P2 | 高分榜展示 + 胜负收尾演出 | `js/main.js`, `js/hud.js`, `css/wc3.css` | 开始/结算界面显示 localStorage 最佳（波次/难度/金）；胜利有横幅+号角式收尾；无 storage 时不崩 |
| 11 | P2 | 测试布局对齐 DESIGN 并扩覆盖：拆 damageTable/path/economy/combat/waves + 共享 harness；补首领技能、英雄倒地/重生、科技效果 | `tests/` | `node tests/run.mjs` ≥80 断言全绿；bench/edges 保留 |
| 12 | P2 | IP 卫生与文档：英雄改原创名；README/PROGRESS 补新系统与快捷键 | `js/data.js`, `README.md`, `.agent_workspace/PROGRESS.md` | 字符串中无 Uther/Grom/Illidan/Arthas 等专名；README(zh) 记载伐木场/首领技/F1/F9/F10/F11/±速 |

## 5. SOTA 验收记分卡 · Scorecard

| # | 验收条 Bar | 状态 Status |
|---|---|---|
| 1 | 15 秒上手 | 部分 PARTIAL（开局说明+快捷键提示；无首建引导） |
| 2 | WC3 玩家一眼认出 HUD | 基本达标 GOOD（缺光标/待浏览器复核新画面） |
| 3 | 4 族×3 系×3 阶 | 达标 PASS |
| 4 | UI 显示攻防倍率 | 达标 PASS（倍率网格+克制行） |
| 5 | Easy 可通/Hard 有挑战 | **未达 FAIL**（见第 2 节实证） |
| 6 | 80 怪+40 塔 60FPS | 部分 PARTIAL（模拟 0.175ms/tick；渲染未实测） |
| 7 | 自动化测试覆盖 | 基本达标 GOOD（51 断言；缺平衡回归） |
| 8 | 无暴雪素材 | 部分 PARTIAL（画音原创；英雄专名建议更换） |
| 9 | zh README | 达标 PASS（需随新系统刷新） |
| 10 | 手绘感非色块 | 待复核 PENDING（35a732c 重绘刚落地，需浏览器验证） |

## 6. 我改了哪些文件 · Files I changed

- `.agent_workspace/notes-r1-fable-1.md`（本文件 this file）
- `warcraft3-td/DESIGN.md`（仅追加 "Architecture Addendum" 一节 append-only）
- `warcraft3-td/js/engine-notes.md`（新增：引擎内部结构/不变量/已知失效旋钮，供 Round 2 工程参考）

未触碰 not touched：`index.html`、`game.js`、`render.js`、`hud.js`、css、tests（遵守文件所有权 file ownership respected）。

## 7. 如何验证 · How to verify

```bash
cd warcraft3-td
node tests/run.mjs      # 45 passed
node tests/edges.mjs    # 6 passed
node tests/bench.mjs    # ~0.175 ms/tick, edge probes ok
# file:// 冒烟：浏览器直接打开 index.html，应无控制台报错并显示开始界面
```

平衡探测脚本为一次性脚本（/tmp/balance-probe*.mjs），未入库；第 4 节第 1 项要求将其固化为 `tests/balance.mjs`。

## 8. 遗留问题 · Open issues

- `hud.js` 在审计结束时仍有未提交改动（其他代理进行中）；第 3 节中 HUD 相关缺口在执行前请先复核是否已被顺手修复（本轮内快捷键错位、命令卡整帧重写、倍率表缺失均已被并行修复）。
- 渲染重绘（35a732c）落地于审计尾声，未做浏览器帧率与视觉回归——对应清单第 5 项。
- 触屏支持（DESIGN 硬约束「Touch-friendly」）本轮未评：命令卡按钮可点，但画布建造依赖 mousedown/mousemove，真机行为未知。
