# 赵云与阿斗 SOTA 复刻 · 编排进度

- 目标：在独立目录 `games/zhao-yun-adou/` 实现抖音/微信爆款《赵云与阿斗》的 SOTA 级网页复刻（汉字合成 + 水墨塔防 + 对称竞技）。
- 隔离原因：同仓库还会并行其他游戏（如 `games/linghuashi/`、`games/bingqi-wangzhe/`），禁止污染仓库根目录与其他游戏目录。
- 工作分支：`cursor/zhao-yun-adou-673d`（系统前缀） / 逻辑名 `agent/zhao-yun-adou`
- 模型映射（严禁静默降级）：
  - fable → `claude-fable-5-thinking-xhigh`
  - opus-fast → `claude-opus-5-thinking-high-fast`
  - gpt-sol → `gpt-5.6-sol-xhigh-fast`

## 玩法锚点（调研基线）

蜜獾工坊《赵云与阿斗》：Random Dice 本土化魔改。消耗「馒头」征兵，随机刷出刀/枪/弓/骑、武将单字或铲子；同种同级合并升级；拼出武将姓名召唤名将；敌军沿固定路线进逼「斗」字阿斗（三颗心）；1v1 上下半区对称对抗，先破阿斗者胜。水墨汉字即单位，开战时字体变形攻杀。

## 文件所有权（并发防冲突）

| 角色 | 模型 | 可写路径 |
| --- | --- | --- |
| Fable-1 架构 | fable | `games/zhao-yun-adou/docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md` |
| Fable-2 美术 UX | fable | `games/zhao-yun-adou/docs/ART_DIRECTION.md`, `src/styles/**` |
| Fable-3 玩法数值 | fable | `games/zhao-yun-adou/docs/GDD.md`, `src/data/**` |
| Fable-4 SOTA 验收 | fable | `games/zhao-yun-adou/docs/SOTA_CHECKLIST.md`, `docs/ACCEPTANCE.md` |
| Opus-1 引擎主循环 | opus-fast | `games/zhao-yun-adou/src/core/**`, `src/main.js` |
| Opus-2 棋盘合成 | opus-fast | `games/zhao-yun-adou/src/board/**` |
| Opus-3 战斗与技能 | opus-fast | `games/zhao-yun-adou/src/combat/**` |
| Opus-4 UI 与 AI | opus-fast | `games/zhao-yun-adou/src/ui/**`, `src/ai/**`, `index.html` |
| GPT-sol-1 单测探针 | gpt-sol | `games/zhao-yun-adou/tests/**` |
| GPT-sol-2 基准脚本 | gpt-sol | `games/zhao-yun-adou/scripts/**` |

共享只读（由主调度器维护）：`package.json`, `vite.config.js`, `docs/OWNERSHIP.md`, `src/audio/**`。需要改共享文件时只追加、不删他人段落，并在本文件记录。

## Round 状态

- Round 1：10/10 已回收并合入父分支
- Round 2：进行中（注入本简报）
- Round 3：未开始

## 基线实测（主调度器 Round 0）

```
npm test     8/8 pass
npm run probe  settled wave 12, winner ai, 190.5s, player kills 120
npm run bench 20/20 settled, playerWins 6/20, 9.9ms/match
```

## 《Round 1 结论简报》

### 已实现功能

- 独立目录可玩闭环：征兵 / 放置 / 合并 / 拼字觉醒 / 铲子 / 波次 / 镜像 AI / 胜负结算
- 棋盘：自合并崩溃修复、觉醒计划重放校验、铲子外扩、手牌工具模块
- 战斗：格-路径真实射程、六武将技能 juice 契约、击杀压力波、护盾走统一伤害
- 引擎：停止整页 innerHTML 重建、拖拽/棋盘合并/暂停/键盘、pause-load-restart
- 视觉：水墨 token 拆分、HUD/教程文案、路线 Boss 标记
- 数据：前期保底兵种、更平合并曲线、13 波教程-高压结构
- 测试：67 项单测全绿；probe 6 路径通过

### 遗留缺陷

- 技能/击杀 juice 未接到画面（飘字、泼墨、投射物仍缺）
- 教程仍是静态说明，无强制引导与首局记忆
- AI 仍按旧 `cellDistToPath` 布阵，未用新 `coverageWindows`
- `enemySeq` 仍在模块级，严格回放会漂
- 字体走 Google CDN，微信/离线会回退
- 无障碍与触控防滚仍不完整

### 性能瓶颈

- 模拟层充裕（bench 单局约 26ms）
- 渲染已从全量 DOM 重建改为增量 diff，画布仍 30Hz 刷新 HUD
- 真实射程降低清线效率，需与数值一起重校

### 下轮攻坚重点

1. 把技能返回的 juice 接到 UI（飘字、震屏、泼墨）
2. 数据重校：合入新战斗后 headless 胜率升到 91%，目标拉回 45–55%
3. AI 改用覆盖窗口；补强制教程与 `touch-action`
4. `enemySeq` 入 state；字体自托管或系统字体栈
5. 交叉验收并补测试

### Round 1 合入后实测

```
npm test     67/67 pass
npm run probe  passed（首征兵 cost=8）
npm run bench  36/36 settled, playerWins 33/36 (91%)
```
