# SOTA 验收清单

> Round 2 审计（Fable-4，2026-08-26 07:53–07:59 UTC，实测基准 HEAD=`4f85dd3`，分支 `cursor/zhao-yun-adou-673d`）。
> 完整命令输出、差距复评与证据见 `ACCEPTANCE.md`。图例：✅ 通过 / ⚠️ 部分通过 / ❌ 未通过。
> 注意：审计期间工作树持续在动（审计中 HEAD 从 `a73875e` 推进到 `1b84a90`，另有未提交的样式改动与未跟踪的 `src/ui/juice.js` 在途），带「在途」标记的项下轮需复验。

## 基础验收项

- [x] ✅ 独立目录可 `npm install && npm run dev`，端口 4180
  - 证据：审计时 4180 已有并行 Agent 的 dev server 在跑，直接冒烟：`/`=200（2654B）、`/src/main.js`=200、`/src/styles/ink.css`=200、`/src/ui/render.js`=200，`<title>赵云与阿斗 · 汉字塔防</title>`。
- [x] ✅ 不改仓库根业务、不写其他 `games/*`
  - 证据：R1 后全部提交（`326ff27`…`1b84a90`）仅触及 `games/zhao-yun-adou/**` 与 `.agent_workspace/**`。
  - ⚠️ 遗留：仓库根游离未跟踪 `/workspace/package-lock.json` 仍在（R1 已警告），不得入库。
- [x] ✅ 征兵 / 拖放 / 合并 / 拼字觉醒 / 铲子扩地 全可玩
  - 引擎层：`npm run probe` 六路径全 pass（首征兵 cost=8、place cell5、merge→L2、awaken=zhaoyun、shovel cell0、leak 3→2 补偿10），不变量 8 项 0 违例。
  - UI 层：真拖拽（ghost 跟随 + DRAG_SLOP + 落点脉动高亮）；盘上棋子可拾起拖拽（R1 P0 缺口已补）；`merge()` 语义显式化为 合并/挪空格/贴符/换位 四分支，R1 的 `tryDrop` 误合并/误交换 bug 已随重写消失；失败落子有明确文案（「同兵同级方可合并」等）。
- [x] ✅ 双方阿斗、路线行军、漏怪扣心
  - 证据：probe leak 路径 pass；`sim.test.js`/`game.test.js` 覆盖漏怪补偿、心数下夹 0、双破防按 斩获→漏怪→存粮 依次裁定。
- [x] ✅ AI 镜像半区会征兵布阵
  - 证据：`stepAi` 配对觉醒→盘面合并→手牌→征兵→阵型调整的打分启发式；bench 36 局全收敛。
  - ⚠️ 但 AI 布阵仍按旧 `cellDistToPath`，未接新覆盖模型（见下方攻坚项 3）。
- [ ] ⚠️ 水墨视觉与技能反馈
  - 视觉 ✅：token 化样式体系（tokens/base/board/pieces/cards/hud/overlay/motion 八件套）；lane 画布新增血条、护盾环、眩晕标、Boss 光晕、起终点「营/斗」标记。
  - 反馈 ❌（在途）：引擎已发全量 juice 契约（`skill` 带 fx/hits/damage/targets/juice，新增 `kill` 事件），`motion.css` 备好 `.fx-merge`/`.fx-awaken`/`.fx-float` 关键帧——但实测基准 HEAD 上无任何 JS 消费：无飘字、无泼墨、无投射物、无击杀墨溅。未跟踪的 `src/ui/juice.js`（409 行，WAAPI 飘字 + 画布特效队列）审计中出现，尚未接入 `main.js`。
- [ ] ⚠️ 教程 + 胜负结算 + 再来一局
  - 结算 ✅：胜负 overlay 六项战报 + 「再战」；键盘 Enter/R 可重开。
  - 教程 ⚠️：新增 `coachHtml` 情境教练条（按局面点亮 征兵→选牌→落子 三步，前 2 波显示）+ 开局三步图解 + 全量 title 悬浮说明（含「还差哪个字觉醒谁」）。仍无蒙层强引导、无首局记忆（全树 0 处 localStorage）。
- [x] ✅ 桌面拖拽 + 触屏
  - 真拖拽落地：pointer 事件挂 window、增量 diff 不再摧毁拖拽节点；`touch-action: none` 注入棋盘与手牌、根容器 `manipulation`；点选→点放保留为老浏览器兜底；键盘 1-5/E/Space/Esc/R 快捷键。
  - ⚠️ 真机触屏未验（无 GUI 环境）；拾起时不高亮全部可合并目标（P1）。
- [x] ✅ `npm test` 覆盖合并、拼字、漏怪、胜负
  - 证据：92/92 全绿（10 文件，退出码 0）：R1 的 67 项 + 契约 4 项（暂停恢复/盘面合并/征兵成本/存档读档）+ 覆盖布阵 21 项。
- [x] ✅ `npm run bench` / `npm run probe` 可跑
  - 证据：probe 退出码 0 全 pass；bench 36/36 settled、0 不变量违例、单局模拟 avg≈24ms / p95≈48ms，新增 leaksByWave / 觉醒率 / 时长分布遥测。
- [ ] ⚠️ 60fps 目标，同屏 80+ 单位不掉到 30
  - 架构 ✅：`innerHTML` 全量重建已废，改为离屏渲染 + 同构 diff + 签名短路；事件只绑一次；lane 画布每帧全速重绘（rAF 原生 60fps）。
  - 模拟 ✅：满载压测（40 单位 + 240 同屏敌，真实射程 O(格×敌) 判定）avg 0.42ms / p95 1.04ms / max 3.26ms，远低于 16.67ms 帧预算（比 R1 的 0.02ms 涨 20 倍但余量仍巨大）。
  - 遗留 ⚠️：DOM 补丁仍有 `UI_INTERVAL = 1/30` 节流（HUD 文本 30Hz，可接受但与「60fps」口径要说清）；无 fps 计数器；真机浏览器帧率未测；字体走 CDN 有首屏抖动风险。

## Round 1 攻坚项复评（BRIEF 六轴）

| # | R1 攻坚项 | R2 状态 | 一句话证据 |
| --- | --- | --- | --- |
| 1 | juice 上屏（飘字/震屏/泼墨） | ❌ 在途 | 事件契约与 CSS 关键帧两头齐备，中间 0 处接线；`juice.js` 未跟踪未接入 |
| 2 | 胜率 91% → 45–55% | ❌ | bench 两次实测均 33/36 = **91.67%**，与 R1 合入后持平；觉醒率仅 0.083/局 |
| 3 | AI 改用覆盖窗口 | ❌ | `placement.js`（479 行 + 21 测试）已备好 coverage 打分，`opponent.js` 未 import，仍用 `cellDistToPath` |
| 4 | 教程/触控 | ⚠️ | 教练条 + touch-action + 安全区落地；无强引导、无首局记忆、真机未验 |
| 5 | `enemySeq` 入 state | ✅ | `4f85dd3`：每侧 `nextEnemyId` 入 state、tick 后收编重编号、`serialize({replay:true})` 存读档字节一致（契约测试绿） |
| 6 | 字体自托管/系统字体栈 | ❌ | `index.html` 仍指 `fonts.googleapis.com` |

## Round 2 审计追加项（下轮验收对象）

- [ ] ❌ 把 `juice.js` 接入 `main.js` 并消费 `kill`/`skill` 载荷（P0，在途）
- [ ] ❌ 数值重校到 45–55%：优先排查 AI 不用覆盖布阵吃的暗亏与觉醒率过低（bench 遥测已备好）（P0）
- [ ] ❌ `opponent.js` 切换到 `placement.js` 的 coverage 打分（P0，与上一条联动）
- [ ] ❌ 蒙层强引导 FTUE + localStorage 首局记忆（P0）
- [ ] ❌ ARIA 全缺：toast 无 `aria-live`、心数「♥♡」无文本替代、格子无 role/tabindex、键盘无法选格落子（P1，`prefers-reduced-motion` 已 ✅）
- [ ] ❌ 字体子集自托管或系统字体栈（P1）
- [ ] ❌ BGM/静音开关（P1；toast 自清与暂停已 ✅）
- [ ] ❌ 文案数据脱节：HUD 提示「征兵 10+4×已征次数」，实际 `recruitCost = 8 + 5n`（P2 小缺陷，`render.js`）
- [ ] ❌ 真机/浏览器帧率与触屏实测（P1，需 GUI 环境或 fps HUD）
- [ ] ❌ 拾起棋子时高亮全部可合并目标格（P1 打磨）
