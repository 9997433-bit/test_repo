# SOTA 验收清单

> Round 1 审计（Fable-4，2026-08-26 07:25 UTC，HEAD=`04d65d3`，分支 `cursor/zhao-yun-adou-673d`）。
> 完整命令输出与差距清单见 `ACCEPTANCE.md`。图例：✅ 通过 / ⚠️ 部分通过 / ❌ 未通过。
> 注意：审计期间写码 Agent 有未提交的引擎重构在途（谓词层/存档/固定步长），下轮需复验。

- [x] ✅ 独立目录可 `npm install && npm run dev`，端口 4180
  - 证据：`VITE v6.4.3 ready in 115 ms`，`curl http://localhost:4180/` → 200（index 744B、main.js 200、ink.css 200）；`vite.config.js` `strictPort: true`。
- [x] ✅ 不改仓库根业务、不写其他 `games/*`
  - 证据：`git show --stat` 全部游戏提交（`0e421e1`/`604262a`/`04d65d3`）仅触及 `games/zhao-yun-adou/**`，`1330ff8` 仅触及 `.agent_workspace/**`。
  - ⚠️ 遗留：仓库根有游离未跟踪 `/workspace/package-lock.json`（错误 cwd 的 npm 产物），不得入库。
- [ ] ⚠️ 征兵 / 拖放 / 合并 / 拼字觉醒 / 铲子扩地 全可玩
  - 引擎层 ✅：`npm run probe` 六路径全 pass（recruit cost=10、place cell5、merge→L2、awaken=zhaoyun、shovel cell0、leak 3→2 补偿10）。
  - UI 层 ⚠️：征兵按钮 ✅、点选-点放 ✅、手牌→盘上同种合并 ✅、觉醒自动 ✅、铲子 ✅；但**盘上两枚棋子无法由玩家主动合并**（无拾起入口），且 `main.js tryDrop()` 兜底会从任意首个占用格发起 merge/交换（正确性 bug）。
- [x] ✅ 双方阿斗、路线行军、漏怪扣心
  - 证据：双半区镜像状态机 + `lane.js` canvas 双路线绘制；probe leak 路径 pass；`game.test.js` 漏怪补偿（wave4 → +16 馒头）与双损判负用例绿。
- [x] ✅ AI 镜像半区会征兵布阵
  - 证据：`stepAi` 合并→道具→拼字→按职业站位→征兵的启发式；`state.test.js` 断言 AI recruit 事件且同种子确定；bench 36 局 AI 胜 12 局（玩家胜率 0.667），对抗真实。
- [ ] ⚠️ 水墨视觉与技能反馈
  - 视觉 ✅：宣纸/焦墨/朱砂 token 齐全（`ink.css` 符合 ART_DIRECTION 色板），单位即汉字。
  - 反馈 ❌：技能仅 toast + 蜂鸣；无伤害飘字（`.fx-float` 定义了但 0 处使用）、无墨点飞溅、无泼墨大招特效、无投射物；ARCHITECTURE 承诺的 `projectiles`/`fx` 状态字段缺失。
- [ ] ⚠️ 教程 + 胜负结算 + 再来一局
  - 结算 ✅：胜负 overlay 含斩获/余心 + 「再战」按钮可重开。
  - 教程 ❌：仅开局静态规则文字 + 静态 toast 提示，无分步强引导、无首次进入检测（无任何持久化）。
- [ ] ⚠️ 桌面拖拽 + 触屏
  - 实际为「点选手牌→点格子」两段式，桌面/触屏均可完成放置；但非真拖拽：无跟随 ghost、无落点合法性高亮；30Hz `innerHTML` 全量重建摧毁 `setPointerCapture` 元素，长按拖动断裂；无 `touch-action: none`，触屏拖动会滚动页面。
- [x] ✅ `npm test` 覆盖合并、拼字、漏怪、胜负
  - 证据：4 文件 20 用例全绿（322ms，退出码 0）：merge 3、awaken 7、game 8（漏怪补偿/双损判负/征兵/铲子/神兵符）、state 2（序列化形状 + AI 确定性）。
- [x] ✅ `npm run bench` / `npm run probe` 可跑
  - 证据：probe 退出码 0，`passed: true`，不变量 0 违例；bench 退出码 0，36/36 settled，avg 15.21ms/局，p95 32.53ms，`invariantViolations: []`。
- [ ] ⚠️ 60fps 目标，同屏 80+ 单位不掉到 30
  - 模拟层 ✅：审计压测（盘上 40 单位 + 每侧 120 敌 = 同屏 240+）avg tick 0.02ms / p95 0.22ms / max 3.38ms，远低于 16.67ms 帧预算。
  - 渲染层 ❌：`main.js` 将渲染节流到 30Hz 且每帧 `innerHTML` 全量重建 + 全量重绑事件，视觉帧率设计上限 ~30fps，「60fps」不可能达成；真机浏览器帧率本轮未测（无 GUI）。

## Round 1 审计追加项（源自差距清单，下轮验收对象）

- [ ] ❌ 修复 `tryDrop` 误合并/误交换（P0 正确性 bug）
- [ ] ❌ 盘上单位可拾起、拖拽合并/换位（P0）
- [ ] ❌ 伤害飘字 + 攻击/击杀可视化 + 技能泼墨特效（P0 juice）
- [ ] ❌ 分步强引导 FTUE（P0）
- [ ] ❌ 渲染层增量更新（去 `innerHTML` 全量重建），解锁 60fps 并保住指针捕获（P0 前置）
- [ ] ❌ `touch-action`/安全区/本地字体子集（微信 webview 不可达 Google Fonts）（P0/P1 mobile）
- [ ] ❌ 键盘可达 + ARIA（`aria-live` toast、心数文本替代、格子 role/tabindex）+ `prefers-reduced-motion`（a11y）
- [ ] ❌ 射程机制真实化：`rangeOk` 需考虑敌人位置，5×4 盘 edge∈{0,1} 使内外圈站位无意义（GDD 偏离）
- [ ] ❌ `load(snapshot)` 落地（API_CONTRACT 缺口；写码 Agent 在途改动待复验）
- [ ] ❌ BGM/静音开关、toast 自动消隐、暂停（P1 打磨）
