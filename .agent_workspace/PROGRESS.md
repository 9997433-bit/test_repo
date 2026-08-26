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

- Round 1：进行中（初始构建与基线探索）
- Round 2：未开始
- Round 3：未开始

## 结论简报

（各轮结束后由主调度器回写）
