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
- Round 2：已完成（2026-08-26）
- Round 3：已完成（2026-08-26）

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

## 《Round 2 结论简报》

### 演进对比

| 项 | Round 1 | Round 2 |
| --- | --- | --- |
| 离线 | catchUpPlots 未接线 | `meta/offline` 已接线；生长 8h 封顶仍无效（只护枯萎） |
| 心愿 | 无等级过滤 | minLevel 落地；Lv1 板=白菜/泡豆子/麦子 |
| 作物 | 可种茶棉 | unlockLevel 生效 |
| 温室 | 建成即全场 | 按地块改造 |
| 畜牧 | 全局余数 | 分物种 + 冬饲 +20% |
| 厨房/摊位/家具 | 几乎不可用 | 面板已接线 |
| 美术 | 12 套皮肤，夜景按钮看不见 | 夜间对比度、枯地、toast、390 热区 |
| 测试 | 48 pass / 3 todo | 54 pass / 5 skip；offline-smoke 仍红 |

### 潜在边界风险

- 8h 离线按日历推进约 200 游戏日：嘉宾退房、温馨清零，长休惩罚过重。
- 工具掉率常量 25%+保底已写入 data，village 仍可能按 35%；开局仍赠斧锯。
- 家具双实现（core vs village），契约指定 core 为唯一，village 写入端待删。
- deliverWish 仍立即补满 3 格，与 2 游戏时补 1 位冲突。
- 枯萎无日志；投喂按钮不读 `feedCost`；温室改造无 UI。

### SOTA 验收差距（Round 3 必收）

1. farm：离线生长封顶与 overflow 顺延；枯萎写日志；`OFFLINE_CAP_MS` 与 engine 去重。
2. village：接线 `WISH_TOOL_DROP`/保底；开局工具 1/0/0；停止交付即补满；删家具写入死代码。
3. production：import `WINTER_FEED_SURCHARGE`；weavery 嘉宾 buff；解 skip 测试。
4. UI：温室改造入口、种子等级置灰、`feedCost`、收获飘字 `.xw-fx`、`meta/settings` 时速、NPC 剪影钩子。
5. 测试：解封 minLevel 首板、冬饲、分品种结转、8h 生长封顶；offline-smoke 转绿。
6. Fable-4 终验：T0–T11 按现树重写通过条件；Fable-1 把 R2 工单标 DONE/DEAD。

## 《Round 3 结论简报》与全局收口

### 本轮落地

- 离线生长 8h 封顶转绿（`offline-smoke ok:true`），枯萎写中文日志。
- 工具 25%+保底、交付后空位按 2 游戏时补 1 格；开局工具 锹1/斧0/锯0。
- 温室改造入口、种子等级置灰、投喂读 `feedCost`、时速 3/6/12、收获飘字、院子剪影。
- 契约 22 项工单 DONE/DEAD；手测脚本对齐现树。
- 门禁：vitest 58 passed / 1 skip；probe / bench / 三链 / wish-board / offline-smoke 全绿。

### 仍开放的小口

- `village/skip`（换一个）会绕过补位节拍。
- 库存非正数校验仍 skip。
- 环境音未做；交单庆祝飘字未发。

### 运行

```bash
cd games/xiangwang-shenghuo && npm install && npm test && npm run dev
```

默认端口 `4175`（避开同仓库其他游戏占用的 4173/4174）。游戏只存在于该目录，不污染仓库根或其他游戏。
