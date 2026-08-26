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
| 1 初始构建与基线探索 | 完成 | 2026-08-26 |
| 2 靶向重构与深度优化 | 完成 | 2026-08-26 |
| 3 SOTA 打磨与最终验收 | 完成 | 2026-08-26 |

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

**模型实际使用（无静默降级）**

| 代理 | 声明 slug |
|------|-----------|
| fable-arch / fable-ux / fable-balance / fable-accept | claude-fable-5-thinking-xhigh |
| opus-engine / opus-city / opus-war / opus-ui | claude-opus-5-thinking-high-fast |
| gpt-tests / gpt-bench | gpt-5.6-sol-xhigh-fast |
| 云端平行 fable | claude-fable-5-thinking-xhigh（后台进行中） |

**已实现功能**

- 可玩静态网页：Canvas 2.5D 霜夜城、雪粒子、小人通勤、火炉暖光、寒潮霜雾标题
- HUD / 建筑升级 / 招贤 / 讨伐战报 / 太学占位 / 新手引导 / 1x2x4x / 存档
- 纯逻辑引擎：loop（后台不爆 tick）、save（memoryStorage）、rng、嵌套 `createInitialState`
- 城建生存四系统 + 武将/自动战/任务三系统，Node ESM 可测
- 数据表：17 建筑、20 武将、步骑弓、12 环主线
- 文档：ARCHITECTURE / DESIGN / UX / ACCEPTANCE / SOTA
- 测试：15 pass / 1 fail / 2 pending；bench ~3250 tick/s 无 NaN；probes 7/7

**遗留缺陷（按杀伤力）**

1. **P0 双核分裂**：`main.js` 的 `probeBridge()` 要求扁平 `state.buildings[]`，`state.js` 是嵌套 `city.buildings{}`，桥永远不激活。浏览器跑的是 UI 内置内核，systems 只被测试消费。
2. **P0 建筑 id 三套**：`config`=`lumberyard/coalmine/ironmine/warmhouse/barracks`；`data`=`lumber/coal_mine/iron_mine/house/barracks_inf`；UI 另有 `coal/iron/storage`。
3. **P0 无失败结局 UI**：systems 可写 `flags.gameOver='morale'`，UI 人口下限 1、永不失败。
4. **P1 任务/三兵种/伤兵未接 UI**；招贤/战斗用 `Math.random`。
5. **P1 双存档键**：UI `-ui` 与 engine `SAVE_KEY` 并存。
6. **P1 单测红灯**：`canUpgrade` 签名与 `quests/production` 探针不兼容。
7. **P2 开局资源 / 抽卡权重 / 火炉级数** 文档与实现三套数。

**性能瓶颈**

- 模拟层充足（0.3ms/tick）。软件渲染约 54fps，主要压力在 Canvas 全城重绘 + 粒子。
- DESIGN「10k tick < 250ms」未达标（约 3s/10k），属文档过严而非可玩性卡顿。

**Round 2 攻坚重点**

1. 嵌套 `state.js` 定为唯一事实源；`js/bridge/view.js` 投影给 HUD/Canvas；`main.js` 内置内核降为无 systems 时的 stub。
2. 建筑 id 统一到 data 表：`furnace, lumber, hunter, coal_mine, iron_mine, house, warehouse, kitchen, barracks_inf, barracks_arch, barracks_cav, hospital, academy, tavern, wall, embassy, clinic`。`ID_ALIASES` 只服务旧档。
3. 接通 tick 顺序：`climate → city → economy → population → quests`；动作走 systems。
4. 任务托盘 + 失败/重开 + 步骑弓分兵 + 战报克制 + `engine/rng`。
5. 修红灯单测，生产断言不再 pending。
6. Canvas 补齐三分兵营/仓库/城墙等地块。

---

## Round 2 结论简报

**演进对比**

| 项 | Round 1 | Round 2 |
|----|---------|---------|
| 模拟权 | UI 内置扁平内核 | `createInitialState` + systems 接管（能力探测） |
| 建筑 id | 三套并存 | config/state 切权威 id，旧档 migrateBuildingIds |
| 测试 | 15/1/2 | **22/0/0**；probes **10/10**（含 projectView） |
| 场景 | 地块不全 | 17 建筑 + alias 同对象，level0 废墟 |
| HUD | 无任务/失败/导入导出 | 托盘/霜幕失败/三兵种/导入导出 DOM 已齐 |

**仍在的边界风险**

1. `main.js` 创建 HUD 时未传入 `onExport/onImport/onRestart/onClaimQuest`，新控件在实机默认隐藏或 toast「尚未接通」。
2. `systems/quests.js` FALLBACK 仍有 `sawmill` 幽灵 id（data 层已禁）。
3. 武将 id `huatuo` vs `hua_tuo` 靠桥接归一，config.START_HERO_IDS 未改。
4. AUDIT 指出旧 `runTick` 曾双核叠加——需确认新 main 已拆掉 `core.tick()` 无条件调用。
5. 抽卡 pity、数字跳字、熄火暗场等 Juice 未做完。

**SOTA 验收差距**

- 桥接真绿已达（projectView pass，不再要求扁平 buildings[]）
- 失败幕/任务/存档按钮缺最后一厘米接线
- Frostpunk 级「燃料因果」与战报克制数字需实机确认
- 文档 INTEGRATION/ROUND2_AUDIT 已成合同

**Round 3 冲刺**

1. 接通 HUD 回调 + 修 sawmill + 统一英雄 id
2. Juice：熄火、寒潮四拍、抽卡高光、战力滚动
3. README/验收勾选与测试链全绿
4. 浏览器走完引导→升炉→招贤→讨伐→寒潮→失败/重开

---

## Round 3 结论简报与全局总结

**已收敛**

- HUD 回调接通：导出/导入/领赏/东山再起；`autoClaimQuests: false`
- `START_HERO_IDS` 改为 `liu_bei/zhang_fei/hua_tuo`；FALLBACK `sawmill` → `lumber`
- 双核叠加已拆除（`selectEngine` 二选一）
- Juice：资源滚动、橙红招贤高光、熄火/冰点暗场、寒潮四拍
- 17 地块 + 粒子预算 + 炉心禁行
- `projectView.quests` / 布尔 `gameOver` + `gameOverReason`；导入走结构门槛
- 战报带 `troopAdvantage` / `factionAdvantage`
- 测试：**24/24**、probes **10/10**、bench 同 seed 差 0、~3300 tick/s
- 文档：README、PLAYGUIDE、ACCEPTANCE/SOTA/ROUND3_AUDIT 对齐

**残留（非阻塞）**

- 坏档备份键、pity 数值未做系统层、DESIGN 火炉 6 级 vs 实现 20 级文档差
- 读档失败无 `${SAVE_KEY}-corrupt-backup`

**交付位置**：`/workspace/games/sanguo-ice-age/`（与其他游戏隔离）
