# 多游戏编排进度索引

同仓库并行多款游戏。本文件同时保留各任务简报入口，互不覆盖业务代码。

| 游戏 | 目录 | 端口 | 本轮状态 |
| --- | --- | --- | --- |
| 蚀核要塞 | `games/shihe-yaosai/` | 4182 | **Round 2 进行中**（`shihe-yaosai/`） |
| 异掌 | `games/yizhang/` | 4181 | **视角轮进行中**（`yizhang-look/`）；大厅轮已合 main（`yizhang-hub/`）；手感轮见 `yizhang-feel/` |
| 三国：冰河时代 | `games/sanguo-ice-age/` | 4176 | Round 1–3 完成，24 测 / 10 探针全绿 |
| 我的花园世界 | `games/my-garden-world/` | 5173 | Round 1–3 完成，见 `PROGRESS.my-garden-world.md` |
| 超能下蛋鸭 | `games/chao-neng-xia-dan-ya/` | 4174 | Round 1–3 完成，L1 |
| 灵画师 | `games/linghuashi/` | 4173 | Round 1–3 完成 |
| 赵云与阿斗 | `games/zhao-yun-adou/` | 4180 | 见该目录 brief |
| 蘑菇屋·慢生活 | `games/xiangwang-shenghuo/` | 4175 | Round 1–3 完成 |

---

# 蚀核要塞 — 编排进度

- **任务名**: shihe-yaosai
- **工作分支**: `cursor/shihe-yaosai-f69e`（逻辑名 `agent/shihe-yaosai`）
- **游戏目录**: `/workspace/games/shihe-yaosai/`（独立，不引用其它游戏）
- 详见 `shihe-yaosai/PROGRESS.md`

---

# 异掌 — 编排进度

- **任务名**: yizhang-look（固定人物视角 / 修怪机位）
- **工作分支**: `cursor/yizhang-look-db8d`（逻辑名 `agent/yizhang-look`）
- **游戏目录**: `/workspace/games/yizhang/`（不复制第二份游戏目录）
- 详见 `yizhang-look/PROGRESS.md`；大厅轮归档 `yizhang-hub/`；手感轮 `yizhang-feel/`；更早循环 `PROGRESS.yizhang.md`

---

# 三国：冰河时代 — 编排进度

- **任务名**: sanguo-ice-age
- **工作分支**: `cursor/sanguo-ice-age-e5a4`
- **游戏目录**: `/workspace/games/sanguo-ice-age/`（与仓库内其他游戏隔离）
- **编排角色**: Parent Orchestrator
- **循环**: Round 1 → 2 → 3，每轮 10 并发子代理（4 fable / 4 opus-fast / 2 gpt-sol）

## 目标

在独立目录中实现一款可玩的网页 SLG，模仿《三国：冰河时代》：火炉生存城建、四资源、寒潮民心、魏蜀吴群武将、步骑弓自动战、霜夜城视觉。

## Round 状态

| Round | 状态 | 简报 |
|-------|------|------|
| 1 初始构建与基线探索 | 完成 | 可玩 UI + 双核未打通 |
| 2 靶向重构与深度优化 | 完成 | 桥接激活，22/22 |
| 3 SOTA 打磨与最终验收 | 完成 | HUD 接通 + Juice，24/24 |

## 测试

```bash
cd games/sanguo-ice-age
node tests/runner.mjs   # 24/24
node tests/probes.mjs   # 10/10
node tests/bench.mjs
python3 -m http.server 4176 --bind 127.0.0.1
```

## Round 3 全局总结

嵌套 `state.js` 为唯一事实源；`projectView` 投影 HUD；tick 顺序 climate→city→economy→population→quests。17 地块 Canvas、任务托盘、失败重开、导入导出、橙红招贤高光、寒潮四拍、熄火暗场。残留：坏档备份键、pity 未系统化。

---

# 超能下蛋鸭 SOTA 复刻 · 编排进度

- 目录：`games/chao-neng-xia-dan-ya/`
- 工作分支：`cursor/chao-neng-xia-dan-ya-799d`

# 灵画师 SOTA 复刻（main 已归档）

- 目录：`games/linghuashi/`
- 分支：`cursor/linghuashi-sota-a345`
