# 灵画师 SOTA 复刻 · 编排进度

- 目标：在独立目录 `games/linghuashi/` 实现《灵画师》SOTA 级网页复刻（以笔绘符、水墨国风、职业克制、养成与挂机）。
- 隔离原因：同仓库后续还会跑其他游戏，禁止污染仓库根目录业务代码。
- 工作分支：`cursor/linghuashi-sota-a345`（系统前缀） / 逻辑名 `agent/linghuashi`
- 模型映射（严禁静默降级）：
  - fable → `claude-fable-5-thinking-xhigh`
  - opus-fast → `claude-opus-5-thinking-high-fast`
  - gpt-sol → `gpt-5.6-sol-xhigh-fast`

## 文件所有权（并发防冲突）

| 角色 | 模型 | 可写路径 |
| --- | --- | --- |
| Fable-1 架构 | fable | `games/linghuashi/docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md` |
| Fable-2 美术 UX | fable | `games/linghuashi/docs/ART_DIRECTION.md`, `src/styles/**` |
| Fable-3 玩法数值 | fable | `games/linghuashi/docs/GDD.md`, `src/data/**` |
| Fable-4 SOTA 验收 | fable | `games/linghuashi/docs/SOTA_CHECKLIST.md`, `docs/ACCEPTANCE.md` |
| Opus-1 绘符引擎 | opus-fast | `games/linghuashi/src/drawing/**` |
| Opus-2 战斗系统 | opus-fast | `games/linghuashi/src/combat/**` |
| Opus-3 养成职业 | opus-fast | `games/linghuashi/src/progression/**`, `src/classes/**` |
| Opus-4 UI 与主循环 | opus-fast | `games/linghuashi/src/ui/**`, `src/core/**`, `src/main.js`, `index.html` |
| GPT-sol-1 单测探针 | gpt-sol | `games/linghuashi/tests/**` |
| GPT-sol-2 基准脚本 | gpt-sol | `games/linghuashi/scripts/**` |

共享只读：`package.json`, `vite.config.js`, `docs/OWNERSHIP.md`。需要改共享文件时只追加、不删他人段落，并在本文件记录。

## Round 状态

- Round 1：进行中
- Round 2：未开始
- Round 3：未开始

## 结论简报

（各轮结束后由主调度器回写）
