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

- Round 1：已完成（2026-08-26）
- Round 2：进行中（靶向重构与深度优化）
- Round 3：未开始

## 《Round 1 结论简报》

### 已实现功能

- 可玩闭环：翻土 → 播种 → 收获 → 磨坊 → 心愿交单；12 分钟无人值守可到约 Lv.7。
- 农耕：季节系数 0.55、温室、嘉宾林婶生长 buff、枯萎宽限 45s、离线追赶函数（尚未接线）、扩建门闩。
- 工厂/畜牧：工位上限 6、未收取占位、畜牧 collect 不再按配方查动物、竹仔余数产量。
- 村落：3 心愿板、确定性烹饪、嘉宾席位、幸福加价、摊位防负数量、心愿 35% 掉工具。
- UI：增量渲染（不再每帧 innerHTML）、教程 4 步、快捷键 1-6/S/M/Esc、toast、图纸本、完成徽章。
- 美术：12 套四季×昼夜 CSS 村景、蘑菇屋、木纹面板、粒子。
- 工程：vitest 48 通过 / 3 todo；probe 21/21 导出；三条产业链 smoke 绿；bench ~0.0004 ms/tick。

### 遗留缺陷（Round 2 必打）

1. **离线未接线**：`catchUpPlots` 存在，`main.js` 丢弃 `savedAt`，离线生长无 8h 封顶。
2. **心愿 `minLevel` 未过滤**：Lv.1 可能抽出豆奶/暖锅；过滤会撞 `economy.test.js` 首屏锁。须 Opus-3 与 GPT-sol-1 同轮改。
3. **作物 `unlockLevel` 未生效**（Opus-1）。
4. **冬季饲料 +20% 未做**（Opus-2）；畜牧余数是全局桶，须按物种拆。
5. **厨房/心愿嘉宾 buff 未接线**；做饭 UI 几乎只有面包；摊位无界面。
6. **温室语义**：当前建成即全场免疫，GDD 要单块温室田。
7. **扩建早期卡死**：人口门闩 vs 只有 2 田；工具靠心愿掉落 + 开局赠送斧锯（权宜，须正规来源）。
8. **家具未落地**；枯萎地块中文标签；收获飘字 / NPC 剪影缺 DOM 钩子。
9. **reason 仍是中文散串**，契约要求机器码 + `core/reasons.js`（Fable-1 规格，Opus 落地）。

### 性能瓶颈

- 旧每帧整页重绘已由 Opus-4 改为 10Hz 模拟 + 签名差分；CSS 动画应恢复。
- 仍需盯：打开面板后的重绘抖动、390px 顶栏热区、4× CPU 节流 60fps 条。

### 下轮攻坚重点

1. 把契约缺口接线：offline、minLevel、unlockLevel、冬饲、厨房菜单、摊位、家具。
2. 修正温室/扩建/工具节奏，去掉 UI 侧心愿换一个的 day-offset 权宜。
3. 补测：解 skip/todo、离线 8h、心愿等级过滤、畜牧余数分桶。
4. 体验：枯萎中文、飘字、嘉宾/动物剪影、静音与教程残留。
5. Fable-4 按现树重打 ACCEPTANCE，标出与 SOTA 的真实差距。
