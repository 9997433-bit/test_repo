# ACCEPTANCE.md — 功能验收与测试合同

> 作者：fable-accept（Round 1 补派）。本文件是**验收合同**：交付判定以本文勾选项为准。
> 数值与美术合同见 `DESIGN.md`，模块边界见 `ARCHITECTURE.md`，可读性打磨线见 `SOTA.md`。
> 所有「现状」标注基于 2026-08-26 代码快照实测（`npm test` / `npm run probe` / `npm run bench` /
> 全量 `node --check` / import 图静态校验 / `python3 -m http.server` 200 探测）。

---

## 0. 使用说明与现状图例

每条验收项格式：`[ ] 编号 标题 ｜ 现状 ｜ Given/When/Then ｜ 失败判定`。

| 标注 | 含义 |
|---|---|
| ✅ 已实现 | 代码存在且有测试 / 静态证据支撑，走查通过即可勾选 |
| 🟡 已实现·未打通 | 逻辑在 `js/systems/*` 或 `js/data/*` 中完整存在（多数有单测），但**运行中的游戏不消费它**（见 §1 双内核断层） |
| ⬜ 未实现 | 两侧都没有 |
| ❌ 红灯 | 当前有可复现的失败证据（测试或行为） |

回归命令（任何改动后必须全跑）：

```bash
cd games/sanguo-ice-age
npm test        # tests/runner.mjs 单元测试（当前 15 过 / 1 败 / 2 挂起）
npm run probe   # tests/probes.mjs 边界探针（当前 7/7 过）
npm run bench   # tests/bench.mjs 性能基准（当前 ~0.27ms/tick）
npm start       # 127.0.0.1:4173 人工走查
```

---

## 1. 集成现状快照（验收前提，读懂再验）

### 1.1 双状态树断层（当前最大验收风险）

本作目前存在**两套互不相通的模拟内核**：

| | UI 扁平内核（实际在跑） | systems 嵌套引擎（在跑测试，不在跑游戏） |
|---|---|---|
| 位置 | `js/main.js` 内置 FALLBACK CORE（约 850 行） | `js/state.js` + `js/systems/{city,economy,climate,population,heroes,combat,quests}.js` |
| 状态形状 | 扁平：`resources` / `buildings:[{key,level,workers}]` / `population.total` / `troops`(单标量) / `heroes:[]` | 嵌套：`meta` / `city.buildings{}` / `people` / `army{infantry,cavalry,archer,wounded}` / `heroes.roster` |
| 建筑 id | `furnace,house,lumber,hunter,coal,iron,kitchen,storage,barracks,clinic,recruit,academy,wall`（13 座） | `config.BUILDING_IDS`（9 个，含 `lumberyard/coalmine/warmhouse`）与 `data/buildings.js`（17 座，`lumber/coal_mine/house/tavern…`），靠 `city.js ID_ALIASES` 勉强互认 |
| 升级模型 | 即时扣费即时升级 | 扣费 → 施工工期（`buildTicks`/`progress`）→ 完工 |
| 战斗模型 | 单标量兵力 + 胜率掷骰（`Math.random`） | 三兵种 12 回合确定性战斗 + 技能 5 类 + 伤兵 |
| 存档键 | `sanguo-ice-age-save-v1-ui`（`core.serialize`） | `sanguo-ice-age-save-v1`（`engine/save.js` 信封 + `assertState` 校验） |
| 失败判定 | 无（人口下限 1、民心 0 只发日志） | `flags.gameOver = "morale" / "extinct"`（无 UI 消费） |

`main.js` 的 `probeBridge()` 要求外部 `createInitialState()` 返回 `Array.isArray(state.buildings) && state.resources && state.population` 才交权；嵌套 state 三项全不满足（`buildings` 在 `city` 下且是对象、人口叫 `people`），因此**桥接永远不激活**，浏览器里跑的永远是 UI 内核。控制台可见证据：`[三国·冰河时代] 已检测到 4 个 systems，但状态结构与 UI 内核不同…`。

### 1.2 已打通 / 未打通一览

| 模块 | 状态 | 说明 |
|---|---|---|
| `engine/loop.js` | ✅ 已打通 | `main.js` 优先采用（定步长 + 追帧上限 8），失败才回退内置 rAF |
| `data/heroes.js`（20 将：红4/橙7/紫6/蓝3） | ✅ 已打通 | UI 招贤名录直接映射（品质基准战力 ± 同品质相对浮动） |
| `data/buildings.js`（17 座） | 🟡 半打通 | UI 只采纳 `desc` 文案，机制字段（工期/工位/保温/前置）全部闲置 |
| `systems/city`（施工队列、火炉前置 `furnacePrereqFor`、canUpgrade 门槛） | 🟡 未打通 | probes 全过，但 UI 不调用 |
| `systems/economy`（驻守武将加成、民心系数、仓储、净收支） | 🟡 未打通 | 同上 |
| `systems/climate`（热惯性、寒潮烈度递增、封火、烧煤优先） | 🟡 未打通 | 同上；UI 用另一套公式驱动寒潮 |
| `systems/population`（疾病/治疗/死亡/增长、gameOver 判定） | 🟡 未打通 | 同上 |
| `systems/heroes`（星级/碎片/经验/编队5人/驻防） | 🟡 未打通 | UI 用「重复=升级、上限10级」的另一套养成 |
| `systems/combat`（三兵种/技能/伤兵/劫掠生成 `makeRaidEncounter`） | 🟡 未打通 | UI 用简化胜率模型 |
| `systems/quests` + `data/quests.js`（12 条主线链） | 🟡 未打通 | 单测通过，**无任何 UI 入口** |
| `engine/save.js`（信封 + 校验 + 导入导出） | 🟡 未打通 | 仅在桥接激活时才会被 UI 使用（即从未） |
| `engine/rng.js`（可复现随机） | 🟡 未打通 | UI 内核招贤/战斗全用 `Math.random`，违反 ARCHITECTURE §10 确定性合同 |
| `engine/bus.js` | 🟡 未打通 | 仅桥接时传入 systems，无订阅者 |
| `data/troops.js` | ⬜ 完全未消费 | 兵种三分尚无宿主 |
| 事件/贸易/使节馆/劫掠防守（DESIGN §11–12） | ⬜ 未实现 | 两侧皆无 |

### 1.3 自动化测试基线（2026-08-26 实测）

| 套件 | 结果 | 备注 |
|---|---|---|
| `npm test` | ❌ 15 过 / **1 败** / 2 挂起 | 败：`quests/production: furnace level gates non-furnace building upgrades` — 探针用**扁平** state 调 `city.canUpgrade`，而实现只认嵌套 `state.city.buildings`。这颗红灯就是 §1.1 断层的机读信号 |
| `npm run probe` | ✅ 7/7 | 资源全 0 tick、火炉 30 级封顶、寒潮天数异常大、0 令抽卡、空阵容讨伐、兵力 1e6、坏档缺字段 |
| `npm run bench` | ✅ 无 NaN/负数 | 2000 tick / ~550ms ≈ **0.27ms/tick**（满足 ≤2ms/tick 预算；但按此吞吐 10k tick ≈ 2.7s，`DESIGN §17`「10k tick < 250ms」**未达标**，需裁决目标或优化） |
| 静态 | ✅ | 全部 js `node --check` 通过；import 图无断链；index/main HTTP 200 |

---

## 2. P0 验收 — 可玩闭环、生存张力、不崩（全绿才可交付）

### 2.1 启动与时间

- [ ] **P0-01 开箱即玩** ｜ ✅（静态证据齐，需浏览器终验）
  - Given 本地 `python3 -m http.server 4173`、现代浏览器、无缓存
  - When 打开 `http://127.0.0.1:4173/`
  - Then 1s 内出现城市场景与 HUD 且可交互；控制台 **0 error**；`data-boot="ready"` 生效、boot 遮罩消失
  - 失败判定：任何未捕获异常 / 模块 404 / 白屏超过 3s / 控制台出现红色 error（`[sanguo]` 前缀的降级 warn 不算失败但须记录）

- [ ] **P0-02 时间流速与暂停** ｜ ✅
  - Given 游戏运行中
  - When 点击 ⏸/1x/2x/4x 或按 `空格`/`1`/`2`/`3`
  - Then 逻辑 tick 停止/按倍率推进（`engine/loop.setSpeed`），HUD 高亮当前档；暂停时雪与炉焰仍有微动态（视觉不冻结）
  - 失败判定：暂停后资源仍变化；倍速切换后「/日」净增数值失真；切后台 30s 回来一次性狂补 tick（追帧上限 8/帧失效）

### 2.2 火炉、燃料与气候（生存主轴）

- [ ] **P0-03 火炉供热与升级** ｜ ✅（UI 内核）
  - Given 火炉 N 级、燃料充足
  - When 打开火炉面板并升级
  - Then 面板展示 供热 now→next、建筑等级上限 now→next、暖光半径 now→next；升级后城内温度上升、场景暖光半径变大
  - 失败判定：升级扣费与面板造价不符；温度不随等级变化；达 `hardMax=20` 后按钮未禁用或无「火炉已达极限」文案

- [ ] **P0-04 燃料三策略** ｜ ✅
  - Given 木、炭均有库存
  - When 切换 木柴/石炭/自动
  - Then 立即改变消耗资源（炭热值 ×1.35）；`auto` 在寒潮中自动烧炭、平时烧柴；HUD「燃料可支 N 日」随之重算
  - 失败判定：策略切换后仍烧旧燃料；`fuelDays` 出现负数或 NaN

- [ ] **P0-05 燃料断供不崩局** ｜ ✅（另见边界 B1）
  - Given 木 = 0 且 炭 = 0
  - When 持续 tick
  - Then 火炉熄灭（供热 0、场景光晕暗掉）、民心 −3.2/日、日志「燃料告罄，火炉将熄」、dock 火炉按钮脉冲告警；游戏继续可操作
  - 失败判定：抛异常 / 资源变负 / 温度 NaN / 无任何告警呈现

- [ ] **P0-06 寒潮周期与预警** ｜ ✅（UI 公式驱动：每 7 天一次、持续 2 天、−14°）
  - Given 非寒潮期
  - When 天数推进
  - Then HUD 天气条显示「N 日后寒潮」倒计时；寒潮开始当天弹横幅「冰河寒潮」+ 全屏结霜 + 日志；潮退有「寒潮退去」日志
  - 失败判定：寒潮无预警直接开始；横幅不消失；`blizzardDaysLeft`/`blizzardIn` 与实际相位不符
  - ⚠️ 与 systems 侧差异待统一：`systems/climate.js` 有烈度逐场递增（+0.06/场）与持续天数增长，UI 公式没有；DESIGN §4 要求的「第 57 天甲子极寒」两侧皆 ⬜

- [ ] **P0-07 温度对经济与人口的传导** ｜ ✅
  - Given 城内温度跌破 0° / −6°
  - When 持续 tick
  - Then <0°：产出打折（UI `coldPenalty`）+ 民心 −0.8/日；≤−6°：民心 −2.4/日 + 人口冻损（医馆派工可减免最多 55%）；HUD 温度计变色并显示「严寒/冰封」档位
  - 失败判定：温度带文案与阈值（−6/0/8）不符；冻损无日志

### 2.3 城建与派工

- [ ] **P0-08 13 座建筑可建可升、火炉封顶双侧生效** ｜ ✅ UI ／ 🟡 systems ／ ❌ 测试红灯
  - Given 火炉 N 级、资源充足
  - When 升级任意非火炉建筑到 N 级后再点升级
  - Then 按钮禁用、文案「需先将火炉升至 N+1 级」；升火炉后立即解锁
  - 失败判定：任何路径绕过封顶（含直接调 `window.__sanguo.game.upgrade`）；**`npm test` 的 `quests/production` 红灯未消**（探针要求升级门槛函数对扁平 state 形状也能给出 blocked/allowed 判定，当前 `city.canUpgrade` 只认嵌套形状）
  - ⚠️ systems 侧还有「火炉升级反向前置」（`furnacePrereqFor`：升火炉需指定建筑先达标）与施工工期两套机制，UI 完全未接（🟡）

- [ ] **P0-09 资源不足禁止升级且原因可见** ｜ ✅
  - Given 某资源不足以支付造价
  - When 打开建筑面板
  - Then 缺口资源 chip 标红、升级按钮禁用、footer 显示「物资不足」；资源攒够的一瞬（面板不关）按钮自动恢复可用
  - 失败判定：能点但静默失败；扣费后等级未变

- [ ] **P0-10 派工与丁口守恒** ｜ ✅
  - Given 闲置丁口 ≥1、目标建筑有空工位
  - When ±1 派工
  - Then 工人数、pip 点阵、HUD「闲置 N」同步变化；Σ工人 ≤ ⌊人口⌋ 恒成立；人口下降时自动从工人最少的建筑回收超编
  - 失败判定：闲置为 0 仍可加派；守恒被破坏；工位上限（`maxW`）被突破

- [ ] **P0-11 仓储上限与截断** ｜ ✅ UI（静默截断）／ 🟡 systems（有「仓库已满」日志，每日限一条）
  - Given 某资源接近上限
  - When 产出持续
  - Then 资源停在上限不溢出；HUD 储量条满格变色（`is-full`）
  - 失败判定：资源超上限或变负；升级仓库后上限未即时上调

### 2.4 民生与败局

- [ ] **P0-12 民心闭环** ｜ ✅（增减）
  - Given 温饱且 ≥8°
  - When 持续 tick
  - Then 民心缓涨（+0.35/日 × 厨房/医馆派工加成）；断粮时 −3.5/日 且日志「粮秣将尽」
  - 失败判定：民心越界 [0,100]；饥饿/寒冷/断供多重扣减互相吞并

- [ ] **P0-13 失败判定 D1 民变 / D2 绝户** ｜ ⬜ UI ／ 🟡 systems（`flags.gameOver="morale"/"extinct"` 已实现且有 probe 覆盖）
  - Given 民心 ≤15（systems 侧即时；DESIGN 要求连续 2 天）或 人口归 0
  - When 判定触发
  - Then 弹全屏结算（存活天数 + 关键 stats + 重开按钮）；模拟停止推进；存档保留供回看
  - 失败判定：**当前 UI 内核人口下限写死 1、民心 0 只发日志，永远不会输**——对一款 Frostpunk 致敬作这是 P0 缺陷；两侧任一未打通即不勾选

- [ ] **P0-14 结局 E1（60 天「春回」或明确的无尽宣告）** ｜ ⬜ 两侧皆无
  - Given 存活至第 60+2 天（甲子极寒撑过）
  - When 判定触发
  - Then 结算画卷 + 「继续治县」入口
  - 失败判定：游戏无任何「一局」的概念（当前状态）；若本轮裁决降级为 P1，需在交付说明中写明理由

### 2.5 武将与讨伐

- [ ] **P0-15 招贤抽卡** ｜ ✅（UI：令消耗、单抽/十连、以资换令）
  - Given 招募令 ≥1
  - When 单抽 / 十连
  - Then 扣令准确；十连若前 9 抽全蓝则末抽保底 ≥紫；重复武将转等级（≤10 级）并明示「重复 → 升至 LvN」；橙/红将入邸报
  - 失败判定：0 令可抽（另见边界 B5）；概率表（62/28.4/8.2/1.4）与实现漂移；名录未从 `data/heroes.js` 加载（控制台打印来源应为 `data/heroes.js`）
  - ⚠️ systems 侧另有 星级/碎片/保底权重 60/26/11/3 一套（🟡）；DESIGN §8.2 的 pity 10/40 保底两侧皆 ⬜——三套规则须裁决归一

- [ ] **P0-16 讨伐闭环** ｜ ✅（UI 简化模型）
  - Given 至少 1 名武将、兵力 ≥10
  - When 选目标 → 点将（≤3）→ 点兵滑条 → 出征
  - Then 出征前实时胜算条 + 「我军 X vs 敌军 Y · 克制注记」；战后战报（逐回合文案、缴获、阵亡、经验）；兵力扣损、战利品受仓储上限截断、清剿目标标记「已平定」
  - 失败判定：空编队可出征（另见边界 B4）；胜算与战报结果系统性背离（胜算 90%+ 连败 5 次以上须复查）；战利品溢出上限

- [ ] **P0-17 克制关系可感知** ｜ ✅ UI（预览 ±%、战报「（克制）」标注）／ 🟡 systems（乘区 1.25/1.15 完整实现且有单测）
  - Given 编队含克制敌方兵种/阵营的武将
  - When 预览与开战
  - Then 胜算注记出现「兵种克制/阵营克制」；战报伤害行带克制标记
  - 失败判定：克制方向与 `config.FACTION_BEATS`（吴克蜀、蜀克魏、魏克吴）/ `TROOP_BEATS`（步克骑、骑克弓、弓克步）不符

### 2.6 存档与测试

- [ ] **P0-18 存档往返**（细则见 §5） ｜ ✅ UI 自动存档 ／ 🟡 engine/save
- [ ] **P0-19 自动化测试全绿** ｜ ❌（1 红灯）
  - Given 本仓库任意提交
  - When `npm test && npm run probe && npm run bench`
  - Then 退出码全 0；bench 无 NaN/负数
  - 失败判定：当前 `quests/production` 红灯即失败；**修法二选一**：让升级门槛函数兼容扁平探针形状（参照 `quests.js readBuildingLevel` 的宽容读取），或完成状态树统一后探针自然转绿

---

## 3. P1 验收 — 深度系统打通与完整养成（缺失需在交付说明列明理由）

- [ ] **P1-01 状态树统一（整合断层的正式验收）** ｜ ⬜
  - Given 裁决后的唯一状态树（建议：嵌套 `state.js` 为事实源，UI 的 `view()` 变成从嵌套 state 派生的只读投影）
  - When 游戏运行任意 10 分钟
  - Then `main.js` 不再包含独立模拟内核；`window.__sanguo.bridge.active === true` 或桥接概念删除；四系统 tick（climate→economy→city→population）驱动 HUD
  - 失败判定：两套内核并存超过本轮；控制台仍打印「状态结构与 UI 内核不同」

- [ ] **P1-02 建筑 id 三方归一** ｜ ⬜（现状：config 9 个 / data 17 个 / UI 13 个，靠别名互认）
  - Then `config.BUILDING_IDS`、`data/buildings.js`、渲染 `CITY_LAYOUT`、存档四方同名；`ID_ALIASES` 仅为旧档迁移保留
  - 失败判定：同一建筑在任务文案（`q_sawmill_3` 引用了不存在的 `sawmill`！）、UI、数据表中出现第三种名字

- [ ] **P1-03 任务链上线** ｜ 🟡 systems+data 齐备（12 条主线、`initQuests/tickQuests/claimQuest` 有单测），⬜ UI
  - Given 新档
  - When 完成「伐木过冬 → … → 炉暖全城」链上条件
  - Then 有任务面板/托盘显示进度条与可领取红点；领奖入账（资源/招募令/heroId 赠将）；`q_main_11` 首胜赠赵云可达成
  - 失败判定：奖励重复领取；`unlockAfter`/`next` 链断裂；赠将 id 在名录中查不到时未走 `pendingHeroGrants` 兜底

- [ ] **P1-04 兵种三分与正式战斗** ｜ 🟡 systems/combat 完整（12 回合、技能 5 类、伤兵、确定性 rng 注入，有单测），⬜ 接入
  - Given `army{infantry,cavalry,archer}` 入档、兵营分兵种练兵
  - When 讨伐 / 遭遇劫掠
  - Then 用 `resolveBattle` 结算并以 `applyBattleResult` 写回（伤兵进 `army.wounded` 待医馆回役）；战报展示回合伤害与技能触发事件
  - 失败判定：UI 标量 `troops` 与三分兵种并存两套账

- [ ] **P1-05 确定性模拟** ｜ 🟡 `engine/rng.js` 齐备，⬜ 接入
  - Given `?seed=123` 两次新开局、相同操作序列
  - When 各推进 1000 tick
  - Then 两局状态哈希一致（招贤结果、战斗结果、寒潮相位全同）
  - 失败判定：模拟层（招贤/战斗/事件）残留 `Math.random`

- [ ] **P1-06 施工工期体验** ｜ 🟡 systems/city 有完整队列（`progressTicks/buildTicks`、取消返还 70%），⬜ UI
  - Then 升级不再瞬发：场景有脚手架/进度表现，可取消
  - 失败判定：读档后在建进度丢失（`ensureBuildingEntry` 已处理反推，验回归）

- [ ] **P1-07 武将驻防与经济加成** ｜ 🟡 systems（`garrisonHero`/`garrisonFactor` 有实现），⬜ UI
  - Then 面板可驻防武将并看到产出乘区变化（`1 + intel/200 + garrisonBonus×品质系数`）

- [ ] **P1-08 新手引导与空态** ｜ ✅（7 步聚光引导、可跳过、`H` 重播、完成记 localStorage）
  - 失败判定：引导指向的建筑被拖出屏外时聚光框错位（`getBuildingRect` 每帧跟随，验回归）

- [ ] **P1-09 劫掠防守战** ｜ 🟡 `makeRaidEncounter(day)` 已实现按天数分档生成敌军（12 档几何增长），⬜ 排程与 UI
  - Then 第 10/20/30… 天（或裁决后的节奏）提前 1 天预警、到期触发守城战

- [ ] **P1-10 事件志容量与回看** ｜ ✅ UI 保留 200 条、侧栏倒序 40 条渲染
  - ⚠️ systems 侧 `LOG_LIMIT` 取 min(80, LOG_MAX)=80 条，统一后以谁为准需裁决

---

## 4. P2 验收 — 加分项

- [ ] **P2-01 事件抉择系统**（DESIGN §12，≥8 事件 + 2 脚本事件） ｜ ⬜
- [ ] **P2-02 使节馆贸易与结盟减压阀**（DESIGN §11） ｜ ⬜
- [ ] **P2-03 太学科技扩展为多分支树**（当前 6 项单线 ✅，扩展 ⬜）
- [ ] **P2-04 `?difficulty=` 三档 / `?fx=off` 低特效** ｜ ⬜
- [ ] **P2-05 WebAudio 程序化风声/炉火（默认关）** ｜ ⬜
- [ ] **P2-06 结局「春回」结算画卷** ｜ ⬜
- [ ] **P2-07 甲子极寒脚本化终局（57 天预警、60–62 天 −26°）** ｜ ⬜

---

## 5. 存档往返专项

- [ ] **S-01 刷新续玩（UI 自动存档）** ｜ ✅
  - Given 游玩至第 N 日（N≥3）、升过建筑、招过将、打过仗、改过燃料策略
  - When 刷新页面
  - Then toast「读取存档 · 第 N 日」；资源/建筑等级/工人分配/武将（等级与战力）/兵力/招募令/已研科技/日志/清剿标记/燃料策略全部还原；已完成教程不再弹出
  - 失败判定：任何字段回退默认值；读档后科技乘区未生效（`recomputeTech` 必须在 hydrate 后调用——已实现，验回归）
  - 机制：每 8s 定时 + `beforeunload` 写 `localStorage["sanguo-ice-age-save-v1-ui"]`

- [ ] **S-02 旧档前向兼容** ｜ ✅（UI `hydrate` 以 `newState()` 为底板深合并；新加建筑自动补槽位）
  - Given 手工删除存档 JSON 中某建筑条目 / 某资源键
  - When 读档
  - Then 缺失字段以初始值补齐、不崩、不出现 NaN
  - 证据：probes `missing-save-fields` ✅（engine 侧）；UI 侧同逻辑代码走查 ✅

- [ ] **S-03 坏档拒绝** ｜ ✅ 引擎侧（`importSave` 抛中文错误、`loadGame` 返回 null 按新档处理，有单测）／ UI 侧 `hydrate` 返回 false 静默开新档
  - Given 非法 JSON / 结构不可救的对象
  - When 读取
  - Then 不崩溃、按新游戏处理并有告知（UI 侧目前无告知 toast，统一后需补）

- [ ] **S-04 导出 / 导入 UI** ｜ ⬜（`exportSave/importSave` 引擎函数 ✅ 且有测试，无任何按钮暴露给玩家）
  - Then 系统面板可导出 JSON（文件名含天数）、粘贴导入；导入坏档弹明确错误且不影响当前局

- [ ] **S-05 双存档键合一（整合项）** ｜ ⬜
  - Given 状态树统一（P1-01）完成
  - Then 只保留 `sanguo-ice-age-save-v1` 一个键（信封格式 `{format,version,savedAt,state}` + `assertState` 校验）；提供一次性迁移读取 `-ui` 旧档并转换，迁移后删除旧键
  - 失败判定：统一后玩家旧进度丢失

- [ ] **S-06 localStorage 不可用兜底** ｜ ✅（UI 全部 try/catch；引擎 `memoryStorage()` 探测回退，有单测）
  - Given Safari 无痕等 setItem 抛错环境
  - Then 游戏可玩、仅存档功能降级，不崩

- [ ] **S-07 往返深等（引擎合同）** ｜ ✅ 有单测（`save/production: memoryStorage round-trip preserves state`）
  - Then `loadGame(saveGame(state))` 与原 state 结构深等；`JSON.parse(JSON.stringify(state))` 无函数/undefined/NaN

---

## 6. 边界用例专项（每条必须双侧验证：UI 行为 + systems 探针）

- [ ] **B-01 资源全为 0** ｜ ✅（probes `zero-resources-tick` 全系统 tick 无 NaN 无负数；UI 侧 `clamp(x,0,cap)` 全路径走查 ✅）
  - Given food=wood=coal=iron=0
  - When 连续推进 ≥3 天（含一次寒潮）
  - Then 火炉熄灭链路（P0-05）触发；民心按 饥饿+断供+低温 叠加下降；无异常、无负库存；所有花钱按钮禁用且原因可见
  - 失败判定：任何 `resources[k] < 0`；升级/招募/研习在 0 资源下成功

- [ ] **B-02 寒潮重叠 / 异常寒潮参数** ｜ ✅（probes `huge-cold-wave`：`blizzardDaysLeft` 异常大时 tick 耗时 0.1ms 级、无非有限数）
  - Given（systems）寒潮进行中再次到达排程点；或存档中 `blizzardDaysLeft=400`、`nextBlizzardIn=0`
  - When tick
  - Then 不产生叠加的双寒潮：`advanceDay` 在寒潮期内暂停下一场倒计时；跨天补结算有 400 次 guard，不死循环；烈度被 clamp 在 `blizzardSeverityMax=2`
  - Given（UI）改速 4x 连续跨越两个寒潮周期
  - Then 横幅每场只弹一次、结霜遮罩正确开关、`blizzardIn` 不出现负数
  - 失败判定：温度叠加出 <−45 或 NaN；寒潮永不结束

- [ ] **B-03 满级火炉** ｜ ✅（probes `building-cap`：火炉 30 级时其他建筑升级被显式拒绝且等级不变）
  - Given 火炉升至 `hardMax=20`（UI）/ `maxLevel=20`（systems）
  - When 再点火炉升级
  - Then 按钮禁用 + 「火炉已达极限」，不扣资源
  - When 将任意建筑也升至 20 后再点
  - Then 「已达最高等级」而非「需先升火炉」——两种封顶原因文案不得混淆
  - 失败判定：等级溢出 20；造价数值溢出为 Infinity（1.66^19 量级须仍为有限数）
  - ⚠️ DESIGN §6.2 写的是火炉 maxLv 6、其余 5——数值合同与两侧实现（20 级）冲突，需裁决后同步文档

- [ ] **B-04 空编队 / 不足额出征** ｜ ✅（UI 前置校验 + probes `empty-formation` 空阵容判负不抛错）
  - Given 不选将 / 兵 <10 / 兵滑条 > 现有兵力
  - When 点出征
  - Then 按钮禁用且 footer 给出具体原因（「至少点将 1 人」「兵力不足 10，无法出征」）；绕过 UI 直调 `battle()` 也返回 `{ok:false,reason}` 而非异常
  - Given（systems）`resolveBattle` 双方兵力均 0
  - Then 进攻方判负、战报含 `attacker-empty` 记录

- [ ] **B-05 0 招募令抽卡** ｜ ✅（UI 按钮禁用 + `recruit()` 返回 reason；probes `zero-token-recruit` roster 不变）
  - Then 十连在只有 9 令时也被整体拒绝（不是抽 9 次）

- [ ] **B-06 超大兵力（1e6）** ｜ ✅（probes `million-troops`：0.4ms 完成、无非有限数）
  - Then 性能 <2s、伤亡取整不为负

- [ ] **B-07 人口/工人竞态** ｜ ✅（UI tick 内裁减；systems `trimWorkforce` 从工人最多建筑裁起）
  - Given 满派工后人口冻损/饿损
  - Then Σ工人自动回落 ≤ 健康人口；无「幽灵工人」继续产出

- [ ] **B-08 仓储降级** ｜（统一后回归项）
  - Given 资源高于新上限（如取消仓库、读旧档）
  - Then 立即截断到上限而非保留超额

---

## 7. 失败判定总则（任一命中即整体不通过）

1. **崩溃红线**：10 分钟自动游玩（4x、期间完成 升级×5 / 招贤×3 / 讨伐×3 / 存读档×2）出现未捕获异常或控制台 error。
2. **数值红线**：任意时刻 state 出现 NaN / Infinity / 负资源 / 负人口 / 民心越界。
3. **存档红线**：刷新丢进度、坏档导致白屏、读档后出现「半新半旧」混合状态。
4. **测试红线**：`npm test`、`npm run probe`、`npm run bench` 任一退出码非 0。
5. **表意红线**：任何禁用按钮无原因提示；任何资源扣减无对应产出/反馈。
6. **整合红线**（本轮特有）：交付时若双内核仍并存，必须在交付说明中明列 §1.2 表格的最新状态与收敛计划，否则视为验收不通过。

---

## 8. 交付前回归清单

```text
□ npm test / probe / bench 全绿（含 P0-19 红灯已修）
□ 浏览器人工走查 P0-01 ~ P0-18 全部勾选
□ 边界 B-01 ~ B-08 双侧验证
□ 存档 S-01 ~ S-07（含刷新×2、坏档×1、隐私模式×1）
□ 控制台启动日志确认：武将名录来源 = data/heroes.js；主循环 = engine/loop.js
□ DESIGN.md §17 与本文冲突处已裁决并同步（火炉级数、bench 目标、开局资源三套配置）
```
