# 我的花园世界 — 多代理编排进度

- **Goal**: 在独立目录 `games/my-garden-world/` 中，SOTA 级仿写《我的花园世界》（国风花艺师模拟经营）。
- **Branch**: `agent/my-garden-world`
- **隔离原则**: 不污染仓库根目录与其他未来游戏。
- **循环**: Round 1 → 2 → 3，每轮 10 并发子代理（4 fable + 4 opus-fast + 2 gpt-sol）。

## 原作核心循环（调研摘要）

《我的花园世界》是国风治愈向花坊模拟经营：穿越花艺师打理荒园 → 种植/浇水/施肥/收获 → 花艺作坊插花 → 居民/定制/组团订单赚金币经验 → 庭院装扮 → 花灵增益 → 好友互访偷花（本仿写以单机 NPC 花园代替）。

SOTA 验收条：

1. 可玩完核心循环（种-养-收-插花-交单-装扮-升级解锁）。
2. 国风手绘气质 UI、粒子与时节光影，60fps 预算。
3. 数值自洽、存档可靠、教程完整、移动端可用。
4. 自动化测试覆盖经济/生长/订单/存档；有性能探针。
5. 文档与代码对齐，目录自包含。

## Round 状态

| Round | 状态 | 结论简报 |
|-------|------|----------|
| 1 初始构建与基线探索 | 完成 | 见下方《Round 1 结论简报》 |
| 2 靶向重构与深度优化 | 完成 | 见下方《Round 2 结论简报》 |
| 3 SOTA 打磨与最终验收 | 进行中 | — |

---

## 《Round 1 结论简报》

主调度器汇总 10 子代理（模型均已首行声明 slug，无静默降级）：

| 槽位 | 模型 slug | 主产出 |
|------|-----------|--------|
| Fable-1 云端 | `claude-fable-5-thinking-xhigh` | SOTA 审计、增量渲染、教程门控、订单事务化、SVG 花卉、光影 |
| Fable-2 | `claude-fable-5-thinking-xhigh` | 墨分五色令牌、四季远山、磁青纸夜色、花笺面板、VISUAL.md |
| Fable-3 | `claude-fable-5-thinking-xhigh` | 花种 24 / 订单 20 / 装扮 12 / 花灵 5，GDD 数值守则 |
| Fable-4 | `claude-fable-5-thinking-xhigh` | 六折门槛教程、Esc 仅尾声、UX.md |
| Opus-1 | `claude-opus-5-thinking-high-fast` | 拖拽浇水、存档防抖设计（部分未合入主支） |
| Opus-2 | `claude-opus-5-thinking-high-fast` | 分种花冠/湿度点/凋残（部分被云端 SVG 方案覆盖） |
| Opus-3 | `claude-opus-5-thinking-high-fast` | 事务化扣料、廉价优先、时钟跳跃防刷（语义已合入） |
| Opus-4 | `claude-opus-5-thinking-high-fast` | HUD/作坊多选/音频恢复（增量面板已合入主支） |
| GPT-Sol-1 | `gpt-5.6-sol-xhigh-fast` | `tests/unit/garden-flows.test.ts` 16 例 |
| GPT-Sol-2 | `gpt-5.6-sol-xhigh-fast` | 仿真/风暴/存档探针 + `docs/PERF.md` |

### 已实现功能

- 可玩核心循环：播种、浇水（含拖拽）、施肥、收获、插花、交单、装扮购买、花灵出战、扩建、本地存档。
- 教程六折行为门控 + dock 渐进解锁 + 保底雏菊单 + 尾声 Esc。
- 国风视觉：宣纸远山、四季/昼夜、程序化 SVG 花卉、花瓣粒子、印章 dock。
- 订单：点名花材 + 任意补枝、廉价优先、定制按作品评分、事务化扣料。
- 内容量：24 花种 / 20 订单模板 / 12 装扮 / 5 花灵。
- 测试：55 通过（含 jsdom 教程冒烟、500 tick 仿真 8.5ms、存档 20KB）。

### 遗留缺陷

1. 装扮可购买但**未绘制到庭院场景**，缺摆放模式。
2. 花灵只有数值 buff，**无形象/入驻仪式**。
3. 插花评分易顶满 100，缺品质档与协同。
4. 订单池可连续刷同款。
5. **无离线结算**；切后台冻结 `now`。
6. 存档仍是 1.5s 硬写，缺防抖/visibility flush（Opus-1 实现在旁支）。
7. `reputationBonus` 未接入口碑；旧存档不回填新花种（`unlockLevel ===`）。
8. 音频仅短促合成音，无四季环境层。
9. 无 NPC 好友花园互访。

### 性能瓶颈

- 热路径已可接受（500 tick ≤ 100ms，风暴 23ms）。
- 风险在同步 `JSON.stringify` 全量存档与安排/装饰无上限（预算 64KB，当前探针 20KB）。
- 历史 P0「每帧 innerHTML 重建」已由增量 diff 修复。

### 下轮攻坚重点（Round 2）

1. 庭院装扮落位 + 摆放模式（最大玩法缺口）。
2. 花灵程序化形象与驻园存在感。
3. 插花品质档、订单去重、离线结算、存档 schema+防抖、解锁回填。
4. 四季环境音与交互 foley。
5. 单机「邻家花园」互访（偷花/赠水的本地模拟）。
6. 测试跟上新系统；保持 `tsc` + `npm test` 全绿。

**工作纪律（Round 2 强制）**：只在 `games/my-garden-world/` 工作；**禁止** `git checkout` 把 `/workspace` 切到别的分支；需要隔离请用 `git worktree`；提交推送到 `agent/my-garden-world`。

---

## 《Round 2 结论简报》

相对 Round 1：玩法缺口从「装扮不可见 / 花灵无形 / 无离线」推进到「庭院可赏、花灵可请、离线可结算」。主支 `agent/my-garden-world` 现 **140 测全绿**，tsc 干净。云端 Fable-1 平行实现留在 `cursor/fable1-round2-sota-563e`，**不要整支合并**（会与主支双实现打架）。

### 演进对比

| 项 | Round 1 | Round 2 |
|----|---------|---------|
| 装扮 | 只进库存 | 程序化 SVG 入景 + 挂牌聚焦 + 夜灯 |
| 花灵 | 纯数值 | SVG 形象、HUD 印、驻园灵玉、四季底噪 |
| 评分 | 易满 100 | 凡/雅/精/神，神品极稀 |
| 订单 | 可连刷同款 | 在场+刚离场去重；数据层已有 weight |
| 时间 | 切后台冻结 | 墙钟补算封顶 2h，盛放不枯、订单顺延 |
| 存档 | 1.5s 硬写 | 去抖 + 隐藏刷盘 + schema v2 回填 |
| 口碑 | spirit bonus 死字段 | 接入 moodBonus |
| 邻访 | 无 | UX 设计稿 + 番外折 API，**尚未可玩** |

### 潜在边界风险

- `pickWeighted` 与花种 `hue`/`role` **尚未接入** `spawnOrders` / `scoreArrangement`（GDD Round 3 清单）。
- `root.dataset.theme` 未写，主题令牌未真正切换。
- 邻家花园与锚位摆放只在文档；`renderSideStory` 无人调用。
- 两套离线/陈设实现曾并行，主支以 `engine/offline.ts` + `scene/decor-art.ts` 为准。
- 旧档 `lastSeenAt` 以加载为准，不会补发；测试曾依赖「不回填」语义，已改。

### SOTA 验收差距（Round 3 必须收敛）

1. **可玩邻家花园**：访邻、帮浇、摘花、回园小结（见 UX.md 六）。
2. **摆放模式**：锚位 tap-tap，购买即可见可调。
3. **接线**：`pickWeighted`、色系/章法评分、`dataset.theme`、番外折。
4. 音量持久化；教程后一次性提示。
5. README / GDD / UX / VISUAL / SOTA_AUDIT 与代码对齐。
6. 全量 `tsc` + `npm test` + 构建；交叉核验无回归。

**Round 3 纪律**：只推 `agent/my-garden-world`；禁止切走 `/workspace`；禁止再开平行实现分支往主支硬并。
