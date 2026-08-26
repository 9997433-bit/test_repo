# 向往的生活 SOTA 复刻 · 编排进度

- 目标：在独立目录 `games/xiangwang-shenghuo/` 实现《向往的生活》同构田园经营网页游戏（蘑菇屋、种植、养殖、工厂加工链、心愿订单、嘉宾烹饪、村落扩建、四季昼夜）。
- 隔离原因：同仓库还会并行其他游戏，禁止污染仓库根目录业务代码。
- 工作分支：`cursor/xiangwang-shenghuo-1e47`（系统前缀） / 逻辑名 `agent/xiangwang-shenghuo`
- 模型映射（严禁静默降级）：
  - fable → `claude-fable-5-thinking-xhigh`
  - opus-fast → `claude-opus-5-thinking-high-fast`
  - gpt-sol → `gpt-5.6-sol-xhigh-fast`

## 文件所有权（并发防冲突）

| 角色 | 模型 | 可写路径 |
| --- | --- | --- |
| Fable-1 架构 | fable | `games/xiangwang-shenghuo/docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md` |
| Fable-2 美术 UX | fable | `games/xiangwang-shenghuo/docs/ART_DIRECTION.md`, `src/styles/**` |
| Fable-3 玩法数值 | fable | `games/xiangwang-shenghuo/docs/GDD.md`, `src/data/**` |
| Fable-4 SOTA 验收 | fable | `games/xiangwang-shenghuo/docs/SOTA_CHECKLIST.md`, `docs/ACCEPTANCE.md` |
| Opus-1 农耕土地 | opus-fast | `games/xiangwang-shenghuo/src/systems/farm/**` |
| Opus-2 畜牧工厂 | opus-fast | `games/xiangwang-shenghuo/src/systems/production/**` |
| Opus-3 村落心愿嘉宾厨 | opus-fast | `games/xiangwang-shenghuo/src/systems/village/**` |
| Opus-4 UI 与主循环 | opus-fast | `games/xiangwang-shenghuo/src/ui/**`, `src/core/**`, `src/main.js`, `src/audio/**`, `index.html` |
| GPT-sol-1 单测探针 | gpt-sol | `games/xiangwang-shenghuo/tests/**` |
| GPT-sol-2 基准脚本 | gpt-sol | `games/xiangwang-shenghuo/scripts/**` |

共享只读（由主调度器维护）：`package.json`, `vite.config.js`, `docs/OWNERSHIP.md`, `games/README.md`, `.agent_workspace/PROGRESS.md`。需要改共享文件时只追加、不删他人段落，并在本文件记录。

## Round 状态

- Round 1：进行中（初始构建与基线探索）
- Round 2：未开始
- Round 3：未开始

## 结论简报

（各轮结束后由主调度器回写）
