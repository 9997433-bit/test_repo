# 三国：冰河时代 — 编排进度

- **任务名**: sanguo-ice-age
- **工作分支**: `cursor/sanguo-ice-age-e5a4`（系统分支规范；任务隔离目录见下）
- **游戏目录**: `/workspace/games/sanguo-ice-age/`（与仓库内其他游戏隔离）
- **编排角色**: Parent Orchestrator
- **循环**: Round 1 → 2 → 3，每轮 10 并发子代理（4 fable / 4 opus-fast / 2 gpt-sol）

## 目标

在独立目录中实现一款可玩的网页 SLG，模仿《三国：冰河时代》：

- 火炉为核心的极寒生存城建
- 肉 / 木 / 煤 / 铁资源循环
- 周期性寒潮、温度、民心、人口
- 魏蜀吴群武将养成与阵营加成
- 步骑弓克制自动战斗（讨伐 / 防守）
- 小人走动、雪粒子、暖冷光对比的 SOTA 视觉打磨

## 参考机制（公开资料归纳）

- 火炉决定其他建筑等级上限，消耗燃料维持温度
- 建筑：伐木场、猎人小屋、煤矿、铁矿、民居、仓库、厨房、兵营、军医所、太学院、招贤馆、城墙、使节馆
- 寒潮：温度骤降 → 民心下跌、减产、人口流失
- 武将：蓝/紫/橙/红（精英/史诗/传奇），阵营克制 吴克蜀、蜀克魏、魏克吴
- 兵种：步兵抗伤、弓兵输出、骑兵收割

## 测试策略

1. **自动化**: Node 无浏览器依赖的纯逻辑单测（经济、气候、战斗、存档）
2. **探针/基准**: 长时间模拟寒潮压力、资源溢出、存档往返
3. **手工**: 静态服务器 + 浏览器走完新手引导、升级火炉、招募、讨伐

## Round 状态

| Round | 状态 | 简报 |
|-------|------|------|
| 1 初始构建与基线探索 | 进行中 | 见下文 |
| 2 靶向重构与深度优化 | 未开始 | — |
| 3 SOTA 打磨与最终验收 | 未开始 | — |

### Round 1 文件归属（避免冲突）

| 代理 | 模型 | 独占路径 |
|------|------|----------|
| fable-arch | claude-fable-5-thinking-xhigh | `docs/ARCHITECTURE.md`, `docs/DESIGN.md` |
| fable-ux | claude-fable-5-thinking-xhigh | `docs/UX.md`, `css/tokens.css` |
| fable-balance | claude-fable-5-thinking-xhigh | `js/data/*.js`（只写数据，不改系统） |
| fable-accept | claude-fable-5-thinking-xhigh | `docs/ACCEPTANCE.md`, `docs/SOTA.md` |
| opus-engine | claude-opus-5-thinking-high-fast | `js/engine/*`, `js/state.js`, `js/config.js` |
| opus-city | claude-opus-5-thinking-high-fast | `js/systems/city.js`, `economy.js`, `climate.js`, `population.js` |
| opus-war | claude-opus-5-thinking-high-fast | `js/systems/heroes.js`, `combat.js`, `quests.js` |
| opus-ui | claude-opus-5-thinking-high-fast | `index.html`, `css/layout.css`, `css/panels.css`, `js/ui/*`, `js/render/*`, `js/main.js` |
| gpt-tests | gpt-5.6-sol-xhigh-fast | `tests/unit/*`, `tests/runner.mjs` |
| gpt-bench | gpt-5.6-sol-xhigh-fast | `tests/bench.mjs`, `tests/probes.mjs` |

---

## Round 1 结论简报

（待 10 子代理回收后由主调度器填写）
