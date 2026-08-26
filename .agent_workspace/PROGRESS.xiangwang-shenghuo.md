# 向往的生活 SOTA 复刻 · 编排进度

- 目标：在独立目录 `games/xiangwang-shenghuo/` 实现《向往的生活》同构田园经营网页游戏（蘑菇屋、种植、养殖、工厂加工链、心愿订单、嘉宾烹饪、村落扩建、四季昼夜）。
- 隔离原因：同仓库还会并行其他游戏，禁止污染仓库根目录业务代码。
- 工作分支：`cursor/xiangwang-shenghuo-1e47`（系统前缀） / 逻辑名 `agent/xiangwang-shenghuo`
- 开发端口：`4175`
- 模型映射（严禁静默降级）：
  - fable → `claude-fable-5-thinking-xhigh`
  - opus-fast → `claude-opus-5-thinking-high-fast`
  - gpt-sol → `gpt-5.6-sol-xhigh-fast`

## Round 状态

- Round 1：已完成（2026-08-26）
- Round 2：已完成（2026-08-26）
- Round 3：已完成（2026-08-26）

## 《Round 3 结论简报》与全局收口

- 离线生长 8h 封顶转绿，枯萎写中文日志。
- 工具 25%+保底、交付后空位按 2 游戏时补 1 格；开局工具 锹1/斧0/锯0。
- 温室改造入口、种子等级置灰、投喂读 `feedCost`、时速 3/6/12、收获飘字、院子剪影。
- 门禁：vitest 58 passed / 1 skip；probe / bench / 三链 / wish-board / offline-smoke 全绿。

仍开放：`village/skip` 绕过补位节拍；库存非正数校验仍 skip；环境音未做。

```bash
cd games/xiangwang-shenghuo && npm install && npm test && npm run dev
```
