# SOTA 验收清单（最终版）

> Round 3 终验（Fable-4，2026-08-26 08:14–08:28 UTC，实测基准 HEAD=`60c85e7`，分支 `cursor/zhao-yun-adou-673d`）。
> 完整命令输出与证据见 `ACCEPTANCE.md` Round 3 章节。图例：✅ 通过 / ⚠️ 部分通过 / ❌ 未通过。
> 审计期间写码 Agent 仍在推进（审计中 HEAD 从 `7c25933` 走到 `60c85e7`，共 6 个提交在途落地）；
> 三条验收命令在 `7c25933`、`2364b9e`、`60c85e7` 三个基准上各跑一轮，**全部全绿**，结论按最终基准 `60c85e7` 回签。

## 基础验收项（终态）

- [x] ✅ 独立目录可 `npm install && npm run dev`，端口 4180
  - 证据：`npm ci` 干净安装后 Vite 6.4.3 起服 121ms；`/`=200（2638B）、`/src/main.js`=200、`/src/styles/ink.css`=200、`/src/ui/juice.js`=200、`/src/styles/fx.css`=200；`<title>赵云与阿斗 · 汉字塔防</title>`；`strictPort: true`。
- [x] ✅ 不改仓库根业务、不写其他 `games/*`
  - 证据：R1 至今全部提交仅触及 `games/zhao-yun-adou/**` 与 `.agent_workspace/**`。
  - ⚠️ 遗留：仓库根游离未跟踪 `/workspace/package-lock.json`（R1 起三轮均警告），始终未入库也不得入库，建议人工删除。
- [x] ✅ 征兵 / 拖放 / 合并 / 拼字觉醒 / 铲子扩地 全可玩
  - 引擎层：`npm run probe` 八路径全 pass（recruit cost=8、place cell5、merge→L2、awaken=zhaoyun、shovel cell0、leak 3→2 补偿10、gameOver winner=player、telemetry），不变量 8 项 0 违例。
  - UI 层：真拖拽（ghost + DRAG_SLOP + 落点高亮 + 拖出取消）、盘上棋子可拾起、`merge()` 四分支语义（合并/挪空格/贴符/换位）；`main.js` 落子判定与 `board/merge.js` 谓词的一致性由 `drop.test.js` 39 项对拍矩阵锁死（`60c85e7`）。
- [x] ✅ 双方阿斗、路线行军、漏怪扣心
  - 证据：probe leak 路径 pass；`kill`/`leak` 事件载荷契约由 `round3-regressions.test.js` 锁形状；压力援军跨存档续跑有测试。
- [x] ✅ AI 镜像半区会征兵布阵
  - 证据：`opponent.js` 已切换到路线覆盖窗口模型（`coverageWindows`/`coverageRatio`，`7d3429e`），弃用 `cellDistToPath`；`opponent.test.js` 8 项（seatValue 换算 + stepAi 布阵）。R2 攻坚项 3 结清。
- [x] ✅ 水墨视觉与技能反馈（R1/R2 最大欠账，本轮结清）
  - 视觉：token 化八件套样式 + lane 画布血条/护盾环/眩晕标/Boss 光晕/起终点标记。
  - 反馈：`ui/juice.js`（`d140bd3`）消费 `skill`/`kill`/`leak`/`merge` 全量载荷——WAAPI 飘字（伤害/招式名/Lv 升阶）、墨晕环、棋子弹跳、半区震颤、画布泼墨（splat/leak/skill 六形状）；上限护栏（画布 24 / 飘字 12）；reduced-motion 降级；13 项单测 + 事件载荷契约测试。
  - ⚠️ 遗留（P2 技债）：演出层双轨——`fx.css` 契约类（`#fx-layer`/`.fx-splash`/`.fx-quake`）与 `motion.css` 的 `.fx-merge`/`.fx-awaken` 无任何 JS 消费，是随包死 CSS；实际走 `juice.js` 自注入 `zy-*` 通道。已在 ART_DIRECTION §5.2 记为「待合流」的有意状态（`b67fdc0`），见下方 R3 冲刺项 1。
- [ ] ⚠️ 教程 + 胜负结算 + 再来一局
  - 结算 ✅：胜负 overlay 六项战报 + 「再战」+ Enter/R 重开。
  - 教程 ⚠️：情境教练条（按局面点亮 征兵→选牌→落子 三步，前 2 波显示）+ 开局三步图解 + 全量 title 说明。**仍无蒙层强制引导、全树 0 处 localStorage 无首局记忆**（R3 冲刺项 3 未动，连续三轮遗留）。
- [x] ✅ 桌面拖拽 + 触屏
  - 真拖拽 + `touch-action: none`（棋盘/手牌）+ 根容器 `manipulation` + `env(safe-area-inset-bottom)` + 键盘 1-5/E/Space/Esc/R。
  - ⚠️ 真机触屏三轮未验（无 GUI 环境）；拾起时仅高亮悬停格（`.drop`），不高亮全部可合并目标（P1）。
- [x] ✅ `npm test` 覆盖合并、拼字、漏怪、胜负
  - 证据：**194/194 全绿（17 文件，1.11s，退出码 0）**；R1 20 → R2 92 → R3 194。新增：drop 对拍矩阵 39、hand 谓词 16、tuning 10、replay 11、opponent 8、juice 13、round3 回归 5（juice 载荷契约 / 压力续跑 / 课程计数生命周期）。
- [x] ✅ `npm run bench` / `npm run probe` 可跑
  - 证据：probe 退出码 0 八路径全 pass；bench 36/36 收敛、0 不变量违例，且**脚本本身新增胜率闸门 [0.40, 0.60]**（`2364b9e`）——平衡回归从此挡在 CI 层。
- [x] ✅ 胜率 45–55%（R1 67%、R2 92% 后本轮达标）
  - 证据：四次 bench（跨三个基准 HEAD）**全部 17/36 = 47.22%**；`a7cc5bb` 拉陡后期波次后漏怪集中在 9–12 波（player 56 / ai 19），前 8 波零漏。单局 avg 207s（171–242s），GDD 3–5 分钟区间内。觉醒率 0.22/局（R2 0.08 的 2.7 倍，仍偏低，头less 对局武将罕见——留作后续调参线索，不阻塞验收）。
- [x] ✅ 60fps 目标，同屏 80+ 单位不掉到 30（逻辑层与渲染架构达标）
  - 模拟：满载压测（40 个 5 级兵 + 240 同屏敌，双侧逐帧）avg 0.302ms / p95 0.417ms / max 3.98ms —— 帧预算 16.67ms 的 1.8%。
  - 渲染：离屏 render → 同构 diff → 签名短路，事件单绑，lane 画布 rAF 全速；`9e152b4` 加固战斗层遇畸形状态不抛异常（掉帧不崩帧）。
  - ⚠️ 遗留：HUD 文本仍有 1/30s 节流兜底（口径已声明）；无 fps HUD；真机浏览器帧率三轮未测（云端无 GUI，需真机或 CI 无头浏览器）。

## Round 3 冲刺项对账（R2 简报六项）

| # | 冲刺项 | 终态 | 证据 |
| --- | --- | --- | --- |
| 1 | `juice.js` 迁 `fx.css` 契约类，消双轨 | ❌ 未迁 | 双轨照旧：`fx.css`（9KB dev）+ `.fx-merge`/`.fx-awaken` 零 JS 消费；`juice.js` 走自注入 `zy-*`。仅 `b67fdc0` 在 ART_DIRECTION §5.2 把双轨记为「待合流」。降级为 P2 技债：功能已在屏、纯实现重复 |
| 2 | `rollRecruit` 课程计数入 serialize/load | ✅ | `2364b9e`：计数改由两侧 `recruitCount` 之和推导（本就随档走），start/reset/load 同步 WeakMap；`7da2994` 清掉过渡死代码；回归测试锁「读档续阶段、重开归零」 |
| 3 | 强制三步教程 + localStorage 首局标记 | ❌ | 教练条与 R2 完全一致（情境式、不阻断、每局重现）；全树 0 处 localStorage |
| 4 | 系统字体回退，不再依赖 Google Fonts 成败 | ⚠️ | `tokens.css` 双字体栈各带 7+ 层系统兜底、CDN 链接带 `display=swap`——CDN 挂了游戏照常渲染（「不依赖成败」达成）；但 `index.html` 仍挂 `fonts.googleapis.com`，微信 webview/大陆网络下首屏字形不稳（自托管子集仍未做，P1） |
| 5 | test / probe / bench 全绿，胜率 45–55% | ✅ | 194/194；probe 八路径 + 8 不变量；bench 47.22% 且脚本自带 40–60% 闸门 |
| 6 | 文档与 SOTA 清单回签最终版 | ✅ | 本文档 + ACCEPTANCE.md Round 3 章节 |

## 最终遗留清单（按优先级，交付后待办）

- [ ] **P0** 蒙层强制 FTUE（征兵→拖放→合并三步阻断式引导）+ localStorage 首局记忆——对照已上线小游戏，这是留存侧唯一硬缺口（连续三轮未动）。
- [ ] **P1** ARIA/键盘可达：toast 无 `aria-live`、心数「♥♡」无文本替代、格子无 role/tabindex 键盘无法选格落子（`prefers-reduced-motion` 已 ✅，juice 层已 `aria-hidden`）。
- [ ] **P1** 字体子集自托管（撤 CDN 链接）+ 离线能力（GDD 承诺「可离线」）。
- [ ] **P1** BGM 与静音开关（`sfx.js` 仍是裸振荡器 beep，无音量/静音）。
- [ ] **P1** 真机验证：触屏手势 + 浏览器帧率（云端无 GUI，三轮未测）。
- [ ] **P1** 拾起棋子时高亮全部可合并目标格（现仅悬停格 `.drop`）。
- [ ] **P2** HUD 文案数据脱节：`render.js` 仍写「征兵 10+4×已征次数」，实际 `recruitCost = 8 + 5n`（一行修复，R2 起遗留）。
- [ ] **P2** 演出层双轨合流：`juice.js` DOM 通道改挂 `fx.css` 契约类，撤自注入样式；或反向裁决删死 CSS。
- [ ] **P2** `API_CONTRACT.md` 漂移：§`serialize` 注释仍称 replay 档「不含 tie/reason/enemySeq/课程计数」——`game.js` 现三者皆含、课程计数已由 `recruitCount` 推导（`2364b9e` 后未回写文档）；§10 待办 4/5 已完成未勾。
- [ ] **P2** `board/placement.js`（479 行）仍是孤儿模块：AI 走 `combat/geometry.js` 直连，placement 仅被自测与 `0c1afb4` 对拍测试引用——接入或裁撤。
- [ ] **P2** bench 觉醒率 0.22/局仍偏低：头less 胜负基本由兵种曲线决定，武将系统在自动对局中存在感不足（遥测已备，调参留后）。

## 最终裁定

**引擎 / 测试 / 性能 / 平衡：通过，签字生效。** 三轮累计把测试从 20 项拉到 194 项且全绿；确定性回放（同种子逐字节一致、存档续跑不漂移，含本轮补齐的课程计数）成立；模拟层满载 240+ 单位仅占帧预算 1.8%；胜率 47.22% 落进 45–55% 目标带并由 bench 闸门守住。R1 定下的三大结构性欠账（渲染增量化、盘上拖拽、回放安全存档）与 R2 的三项 P0（juice 上屏、AI 覆盖布阵、数值重校）全部结清。

**产品层对照已上线微信/抖音小游戏：有条件通过。** 打击感、拖拽手感、性能三轴已达或接近爆款水准；差距收敛为 1 项 P0（强制 FTUE + 首局记忆）+ 5 项 P1（ARIA、字体自托管/离线、BGM/静音、真机验证、合并目标高亮）+ 4 项 P2 打磨。上述项不涉结构返工，均为增量补齐。
