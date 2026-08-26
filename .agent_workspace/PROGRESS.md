# 造化仙府 SOTA 复刻 · 编排进度

- 目标：在独立目录 `games/zaohua-xianfu/` 实现《造化仙府》SOTA 级网页复刻（洞府经营 + 弟子养成 + 人/神/魔阵营战斗 + 登天塔/兽潮 + 法器 + 放置挂机）。
- 隔离原因：同仓库还会并行其他游戏（如 `games/linghuashi/`、`games/bingqi-wangzhe/`），禁止污染仓库根目录业务代码。
- 工作分支：`cursor/zaohua-xianfu-e1bf`（系统前缀） / 逻辑名 `agent/zaohua-xianfu`
- 开发端口：`4174`（避免与灵化石 `4173` 冲突）
- 模型映射（严禁静默降级）：
  - fable → `claude-fable-5-thinking-xhigh`
  - opus-fast → `claude-opus-5-thinking-high-fast`
  - gpt-sol → `gpt-5.6-sol-xhigh-fast`

## 文件所有权（并发防冲突）

| 角色 | 模型 | 可写路径 |
| --- | --- | --- |
| Fable-1 架构 | fable | `games/zaohua-xianfu/docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md` |
| Fable-2 美术 UX | fable | `games/zaohua-xianfu/docs/ART_DIRECTION.md`, `src/styles/**` |
| Fable-3 玩法数值 | fable | `games/zaohua-xianfu/docs/GDD.md`, `src/data/**` |
| Fable-4 SOTA 验收 | fable | `games/zaohua-xianfu/docs/SOTA_CHECKLIST.md`, `docs/ACCEPTANCE.md` |
| Opus-1 核心循环 | opus-fast | `games/zaohua-xianfu/src/core/**`, `src/main.js` |
| Opus-2 仙府经营 | opus-fast | `games/zaohua-xianfu/src/mansion/**` |
| Opus-3 战斗养成 | opus-fast | `games/zaohua-xianfu/src/combat/**`, `src/progression/**` |
| Opus-4 UI 弟子 | opus-fast | `games/zaohua-xianfu/src/ui/**`, `src/disciples/**`, `index.html` |
| GPT-sol-1 单测探针 | gpt-sol | `games/zaohua-xianfu/tests/**` |
| GPT-sol-2 基准脚本 | gpt-sol | `games/zaohua-xianfu/scripts/**` |

共享只读：`package.json`, `vite.config.js`, `docs/OWNERSHIP.md`, `README.md`。需要改共享文件时只追加、不删他人段落，并在本文件记录。

## Round 状态

- Round 1：已完成（见 `.agent_workspace/ROUND1_BRIEF.md`）
- Round 2：已完成（见 `.agent_workspace/ROUND2_BRIEF.md`）
- Round 3：进行中（SOTA 打磨，简报已注入）

## 结论简报

### Round 1
可玩基线 + 经营/战斗/核心/UI/美术/数值均已落地，24 测 + probe/bench 绿。
P0 页签不重绘、建筑撞 id 已修。遗留：离线效率未进 BOOT、法器槽型、兽潮税口径、藏经楼白给专业、掉落表未接、魔族终盘、场外断言未入库。
详见 `ROUND1_BRIEF.md`。

### Round 2
离线折算、1/1/2 槽型、未收取兽潮税、掉落表、applyTriggers、槽位 UI 已定案落地。
仍开：藏经楼 TICK 未消费新口径、loseTax 死代码、魔族 F40、8s/60s 阈值、误删回归、塔 45 文案。
详见 `ROUND2_BRIEF.md`。
