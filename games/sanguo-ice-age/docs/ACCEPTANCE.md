# ACCEPTANCE.md — 功能验收与测试合同

> 作者：fable-accept（Round 1 补派）。本文件是**验收合同**：交付判定以本文勾选项为准。
> 数值与美术合同见 `DESIGN.md`，模块边界见 `ARCHITECTURE.md`，可读性打磨线见 `SOTA.md`。
>
> **Round 3 复核（2026-08-26，MODEL_SLUG: claude-fable-5-thinking-xhigh）**：
> 复核基准 = **提交 e70b4cd**（`feat(ui): 资源/战力数字滚动、熄火暗场、招贤高光与寒潮余日四拍`，
> 干净 worktree 检出实测）。⚠️ 复核期间实现者仍在同一工作树**并行施工**（README、
> `bridge/actions.js`、`data/{buildings,heroes}.js`、`main.js`、`render/canvas.js`、`ui/hud.js`
> 及新增 `docs/PLAYGUIDE.md`、仓库根 `.pw-ui.mjs` Playwright 脚本均未提交）——
> 合并对象必须是收口后的提交，收口后须在该提交上重跑本文全部红线。
>
> **Round 3 勾选政策**：`[x]` = 本轮**实测通过**（`npm test`/`probe`/`bench`、全量 `node --check`、
> HTTP 200 探测、以及沿 `main.js` 装配路径的 Node 运行时脚本——用与浏览器完全相同的
> `createContext(autoClaimQuests:false)` 参数驱动 systems 引擎逐 tick 验证）。
> 纯浏览器视觉/交互项**一律不勾**，标注「待走查」（本轮无浏览器执行环境；实现者的
> `.pw-ui.mjs` 在途，走查证据以其录屏/截图为准）。

---

## 0. 使用说明与现状图例

每条验收项格式：`[ ] 编号 标题 ｜ 现状 ｜ Given/When/Then ｜ 失败判定`。

| 标注 | 含义 |
|---|---|
| ✅ 已实现 | 代码存在且有测试 / 静态证据支撑 |
| ✅✅ 已实测 | Round 3 自动化 / Node 运行时实测通过（配合 `[x]` 勾选） |
| 🟡 部分 | 主链路通，列明的子项缺失 |
| ⬜ 未实现 | 无 |
| ❌ 红灯 | 当前有可复现的失败证据（测试或行为） |
| 👁 待走查 | 逻辑已实测/接线，浏览器视觉与点击流待人工或 Playwright 终验 |

回归命令（任何改动后必须全跑）：

```bash
cd games/sanguo-ice-age
npm test        # e70b4cd 实测：24/24 全绿（含新增 bridge 套件 2 条）
npm run probe   # e70b4cd 实测：9 过 / 1 败 ❌（bridge-project-view，见 §7 红线一）
npm run bench   # e70b4cd 实测：2000 tick ≈ 506ms ≈ 0.25ms/tick，无 NaN/负数，同 seed 50 tick 差值 0
npm start       # 127.0.0.1:4176 人工走查（index/main.js HTTP 200 已探测）
```

---

## 1. 集成现状快照（Round 3 改写）

### 1.1 双内核断层：**已收敛**（Round 1/2 的最大风险解除）

`fba3e34` + `e70b4cd` 后，`main.js` 的选择逻辑为：`bridgeReady`（`state.createInitialState` +
`city.tickCity` + `view.projectView` + `actions.tickAll` 四项齐备）→ **systems 引擎为唯一在跑内核**；
旧 850 行 FALLBACK CORE 已删，只剩约 190 行「不白屏」极简兜底（无战斗/招募/任务，仅在模块
404 时接管）。R3 于 Node 中按同样判据实测 `bridgeReady === true`，并驱动同一引擎完成
400 tick（25 天，寒潮 3 场）无 NaN、无负数。Round 1 的「已检测到 N 个 systems，但状态结构
与 UI 内核不同」日志已随旧内核一并删除。

遗留一颗**合同红灯**：e70b4cd 同时加严了 `bridge-project-view` 探针，要求 `projectView` 把
`flags.gameOver="morale"`（字符串）归一为布尔 `gameOver === true`；现实现原样透传字符串
（UI 按真值消费、功能正常），探针判 fail → `npm run probe` 退出码 1。修法二选一：view 归一
布尔，或改探针合同。见 §7 红线一。

### 1.2 已打通 / 未打通一览（R3 实测更新）

| 模块 | 状态 | 说明 |
|---|---|---|
| `engine/loop.js` | ✅ 已打通 | main.js 主循环（console.info 报「主循环：engine/loop.js」） |
| `engine/save.js` | ✅✅ 已打通 | 单键 `sanguo-ice-age-save-v1`；export→import→adoptState 往返实测 |
| `engine/rng.js` | ✅ 已打通 | 战斗/招募走 `meta.seed`（bench 同 seed 50 tick 资源差 0 实测）；fallback 内核与 `makeRaidEncounter` 默认参数仍有 `Math.random` |
| `engine/bus.js` | ⬜ 未消费 | main/bridge 均不 import，无订阅者 |
| `state.js`（嵌套权威状态） | ✅✅ 已打通 | 唯一事实源；`migrateBuildingIds` 迁旧档 |
| `systems/{climate,city,economy,population}` | ✅✅ 已打通 | `actions.tickAll` 流水线驱动游戏（climate→city→economy→population→quests） |
| `systems/quests` + `data/quests.js` | ✅✅ 已打通 | 12 条主线上托盘；`autoClaimQuests:false` 手动领赏实测；`q_sawmill_3→q_lumber_3` id 已修 |
| `systems/combat` | ✅✅ 已打通 | `raid` 走 `resolveBattle`/`applyBattleResult`，伤兵写回 `army.woundedByType` 实测 |
| `systems/heroes` | 🟡 部分 | 招募/名录去重/羁绊已接；星级/碎片/驻防（`garrisonBuildingId` 仅字段）未上桌 |
| `data/heroes.js`（20 将） | ✅ 已打通 | 与 FALLBACK 按人物合并去重（`dedupeHeroCatalog`） |
| `data/buildings.js`（17 座） | ✅ 已打通 | `mergeCatalog` 后机制字段（工期/工位/前置）由 city 消费 |
| `data/troops.js` | ⬜ 未消费 | 三兵种数据由 combat 内部常量承担 |
| 练兵/伤兵康复/太学/燃料策略 | 🟡 桥内实现 | 在 `bridge/actions.js` 内实现，systems 尚未覆盖（actions.js 头注自认） |
| 事件抉择/贸易/使节馆/劫掠防守（DESIGN §11–12） | ⬜ 未实现 | 两侧皆无 |

### 1.3 自动化测试基线（Round 3 实测，2026-08-26）

| 快照 | `npm test` | `npm run probe` | `npm run bench` |
|---|---|---|---|
| 27bfac5（R1 基线，R2 记录） | 15 过/1 败/2 挂起 ❌ | 7/7 | ~0.29ms/tick |
| fba3e34（桥接收敛，R3 早间实测） | 22/22 ✅ | 10/10 ✅ | ~0.25ms/tick |
| **e70b4cd（当前提交，干净检出实测）** | **24/24 ✅** | **9 过/1 败 ❌**（`bridge-project-view`，退出码 1） | 2000 tick/506ms ≈ 0.25ms/tick，无 NaN/负数，同 seed 差 0 ✅ |

静态：全部 js `node --check` 通过；`index.html`/`js/main.js` HTTP 200。
⚠️ e70b4cd 在加测试（+2 条 bridge 单测、探针加严）同时引入这颗红灯——是「探针合同领先于实现」
的诚实红灯，不是假绿；但退出码非 0 即命中测试红线，合并前必须转绿。
bench 吞吐 0.25ms/tick 满足 ≤2ms 预算；DESIGN §17「10k tick < 250ms」按此吞吐 ≈ 2.5s 仍未达标（§7 红线八）。

---

## 2. P0 验收 — 可玩闭环、生存张力、不崩（全绿才可交付）

### 2.1 启动与时间

- [ ] **P0-01 开箱即玩** ｜ ✅ 静态证据齐（HTTP 200、`node --check` 全过、`data-boot` 流程在）｜ 👁 待走查
  - Then 1s 内出现城市场景与 HUD 且可交互；控制台 **0 error**；boot 遮罩消失
  - 失败判定：未捕获异常 / 模块 404 / 白屏 >3s / 控制台红色 error；**console.info 必须报
    「systems 接管：climate → city → economy → population → quests」与「主循环：engine/loop.js」**
    ——出现「内置最小内核」字样即整体不通过

- [ ] **P0-02 时间流速与暂停** ｜ ✅（`engine/loop.setSpeed` 接线、追帧上限）｜ 👁 待走查
  - 失败判定：暂停后资源仍变化；倍速后「/日」失真；切后台 30s 回来狂补 tick

### 2.2 火炉、燃料与气候（生存主轴）

- [ ] **P0-03 火炉供热与升级** ｜ ✅（view 带 `furnaceHeat/furnaceHeatNext`；火炉单列 `city.furnaceLevel`）｜ 👁 面板展示待走查
- [ ] **P0-04 燃料三策略** ｜ ✅（`setFuelMode` 桥内实现；`fuelDays` 由 `view.fuelDaysLeft` 计算）｜ 👁 待走查
  - ⚠️ 燃料策略目前实现于 bridge 而非 systems/climate（§1.2），统一归属需裁决
- [ ] **P0-05 燃料断供不崩局** ｜ ✅✅ 系统侧（probe `zero-resources-tick` 通过；同内核即游戏行为）｜ 👁 熄火暗场（e70b4cd 已交付 `.blackout` 单拍）视效待走查
  - 失败判定：抛异常 / 资源变负 / 温度 NaN / 无告警呈现
  - ⚠️ 原 Then 中「民心 −3.2/日」等数字出自已删除的旧 UI 内核，应以 systems 数值改写并同步 DESIGN
- [ ] **P0-06 寒潮周期与预警** ｜ ✅✅ 节拍实测（Node 400 tick/25 天出寒潮 3 场，`blizzard`/`clear` 事件抵达 main）；烈度递增/上限由 `climate.blizzardSeverity`（step 0.06、max 2）承担 ｜ 👁 横幅/结霜/余日四拍（e70b4cd 交付）待走查
- [ ] **P0-07 温度传导与全局温度色** ｜ ✅ R2 硬性 4 已交付：`hud.applyClimateTheme` 每帧写
  `documentElement.dataset.temp（comfort/mild/cold/freeze）` 与 `dataset.crisis（blizzard/collapse，
  含民心≤15 预警态）`，退出时清除 ｜ 👁 换色/三闪/`prefers-reduced-motion` 待走查
  - ⚠️ 边界微瑕：t=0 时 band 判 `mild` 而档位文案判「严寒」（`<=0`），单点不同帧；建议统一为同一比较符
- [x] **P0-08 建筑可建可升、火炉封顶单源生效** ｜ ✅✅ 已实测
  - 证据：`quests/production: furnace level gates…` 单测过；probe `building-cap`（30 级拒绝）过；
    Node 实测 `actions.upgrade` 返回「受火炉等级限制，伐木场最高 2 级」精确原因文案，升火炉后解锁——
    UI 按钮消费同一 `canUpgrade` 返回值，单内核下不存在第二套实现
  - 👁 按钮禁用态视觉待走查；systems 侧「反向前置 `furnacePrereqFor`」仍未接 UI（降 P1 项）
- [ ] **P0-09 资源不足禁止升级且原因可见** ｜ ✅（`canUpgrade` 返回 `{ok,text,missing[]}` 单源）｜ 👁 chips 标红/自动恢复待走查
- [ ] **P0-10 派工与丁口守恒** ｜ ✅（`addWorker` 原因文案单源；`trimWorkforce` 系统裁员）｜ 👁 pip/徽章同步待走查
- [ ] **P0-11 仓储上限与截断** ｜ ✅✅ 截断逻辑实测（economy tick 与 `raid` 战利品均按 `warehouseCap` clamp，bench 2000 tick 无溢出）｜ 👁 `is-full` 变色待走查
- [ ] **P0-12 民心闭环** ｜ ✅✅ 边界实测（morale 恒在 [0,100]，400 tick 健康局稳定 70）｜ 速率细则与 DESIGN 数值对账未做

### 2.4 民生与败局

- [x] **P0-13 失败判定 D1 民变 / D2 绝户** ｜ ✅✅ 全链路 Node 实测（R2 硬性 2 已交付）
  - 证据：民心压至 0 → `tickAll` 发 `gameover(reason=morale)` 事件 → `view.gameOver` 真值 →
    `hud.readDefeat` 解析「民心崩溃」文案 → **败亡后 32 tick day 不再推进（模拟真停摆）** →
    `actions.restart` 清局重开；读入已败存档时 `tickAll` 补报事件（防漏通知）代码在且首 tick 走查通过；
    人口下限写死 1 的旧逻辑已随旧内核删除；`#gameover-root` 失败幕 + 「东山再起」`onRestart` +
    键盘 N 均已接线（e70b4cd）
  - 👁 待走查：失败幕视觉、`data-crisis="collapse"` 去饱和、点击重开
  - ⚠️ 裁决未落：systems 为 `morale <= 15` **即时**判负，DESIGN 要求「连续 2 天」——见 §7 红线八
- [ ] **P0-14 结局 E1（60 天「春回」或无尽宣告）** ｜ ⬜ 仍无（`flags.victory` 仅占位，无任何写 true 的代码；R3 维持）
  - 失败幕容器已在（P0-13），胜利画卷可复用；若裁决降级 P1 须在交付说明写明

### 2.5 武将与讨伐

- [ ] **P0-15 招贤抽卡** ｜ ✅✅ 主链路实测（3 连招募成功、令扣减、`dedupeHeroCatalog` 防双刘备）｜ 概率表/十连保底未专项验证；👁 翻牌/橙红高光（e70b4cd 交付 `is-epic` 全屏亮相）待走查
- [ ] **P0-16 讨伐闭环** ｜ ✅✅ systems 结算实测（`raid`：胜负/回合/缴获受 cap 截断/伤兵入 `woundedByType`/民心 ±5/−4/清剿标记 `stats.clear_t{n}`）｜ 👁 点将/滑条/战报面板待走查
- [ ] **P0-17 克制关系可感知（R2 硬性 3）** ｜ ❌ **未达成，R3 实测坐实**（§7 红线三）
  - 实测证据：① `previewRaid` 注记只有「兵种克制/兵种被克/阵营克制」**纯文字、无 ±% 数值**
    （仅同阵营羁绊带 %）；② `resolveBattle` 结果**无 `counters`/`troopAdvantage`/`factionAdvantage`
    数值字段**（顶层键实测：win,winner,rounds,reason,log,losses,wounded,…,attacker,defender），
    panels.js 的「克制乘区」区块因此只能显示同阵营 `factionBonus`，×1.25/×1.15 永远不出现；
    ③ 战报回合行「斩敌 221；我军受创 …」无克制标注
  - 已具备：systems 乘区常量 `COUNTER.strong=1.25`/`FACTION_COUNTER.strong=1.15`（单测钉死）、
    UI 侧 `COUNTER_LABELS`+`counterSection` 渲染骨架——**只差 combat/actions 把乘区数值塞进
    result 与 bonusText**
  - 失败判定：外显数字与 systems 乘区不一致；方向与 `FACTION_BEATS`/`TROOP_BEATS` 不符

### 2.6 存档与测试

- [ ] **P0-18 存档往返**（细则见 §5）｜ ✅✅ 引擎侧实测 ｜ 👁 浏览器刷新续玩待走查
- [ ] **P0-19 自动化测试全绿** ｜ ❌ **e70b4cd 实测 1 红灯**（§7 红线一）
  - `npm test` 24/24 ✅、bench ✅，但 `npm run probe` 退出码 1：`bridge-project-view` 要求
    `projectView` 把字符串 `flags.gameOver` 归一为布尔 `true`+`gameOverReason`，实现透传字符串
  - 修法二选一：view 归一布尔（推荐，同时消掉 P0-13 消费方对真值/布尔的双轨兼容），或改探针合同
  - 勾选条件：合并候选提交上三套件退出码全 0，且非靠删探针达成

---

## 3. P1 验收 — 深度系统打通与完整养成

- [ ] **P1-01 状态树统一（正式验收）** ｜ 🟡 架构已收敛（§1.1：单内核、fallback 仅极简兜底、
  `bridgeReady` 实测 true、旧「状态结构不同」日志已删）——**唯欠机读标志**：`bridge-project-view`
  探针须 pass（当前 fail，即 P0-19 同一颗红灯）+ 浏览器控制台确认 systems 接管日志（👁）
- [x] **P1-02 建筑 id 三方归一** ｜ ✅✅ 已实测
  - 证据：`config.BUILDING_IDS` 16 个权威 id（火炉单列 `city.furnaceLevel`）+ `BUILDING_ID_ALIASES`
    17 条旧名迁移 + `resolveBuildingId()`；probe `canonical-initial-building-ids` 过；Node 实测
    `data/quests.js` 全部 9 处建筑 require.id 均在权威目录；`systems/quests.js` FALLBACK 链
    `q_sawmill_3→q_lumber_3`（id `sawmill→lumber`）已修（e70b4cd），导出表实测无孤儿 id
- [x] **P1-03 任务链上线（R2 硬性 1）** ｜ ✅✅ 已实测
  - 证据：`autoClaimQuests:false`（main.js 实参）下 ready 任务**停住等玩家领取**；手动
    `claimQuest` 奖励入账（资源实测 +80 食/+120 木）；重复领取拒绝（「此功业已录」）；
    `q_main_11` 领取后 **赵云实测入编 roster**（`rewards.heroes=["zhao_yun"]`）；托盘
    `#quest-tray` 渲染 + `readQuests` 投影 12 条实测；HUD/panels 双入口均接 `onClaimQuest`
  - 👁 待走查：红点视觉、领奖 toast；⚠️ 全链 12 条在真实局内逐条推进未端到端验（中段有正常门控）
- [ ] **P1-04 兵种三分与正式战斗** ｜ ✅✅ 讨伐侧已通（P0-16 证据：`resolveBattle`+`applyBattleResult`+伤兵写回）｜ 🟡 练兵为桥内实现、伤兵回役闭环未专项验证；`data/troops.js` 仍无人消费
- [ ] **P1-05 确定性模拟** ｜ 🟡 半达成：bench 同 seed 50 tick 资源差 0 实测、combat/招募走 `meta.seed`；
  ⬜ `?seed=` URL 参数不存在；fallback 内核与 `makeRaidEncounter` 默认参数残留 `Math.random`
- [ ] **P1-06 施工工期体验** ｜ ✅✅ 逻辑实测（升级走 `startUpgrade→buildTicks→progress`，Node 中等待完工后等级才 +1；tooltip「营建中 N%」在）｜ 👁 脚手架视觉/取消（返还 70%）待走查
- [ ] **P1-07 武将驻防与经济加成** ｜ ⬜ 仅 `garrisonBuildingId` 字段占位，无 action、无 UI（R3 维持）
- [ ] **P1-08 新手引导与空态** ｜ ✅ 9 步（e70b4cd 增至含「导出/导入」讲解步）｜ 👁 聚光跟随待走查
- [ ] **P1-09 劫掠防守战** ｜ 🟡 `makeRaidEncounter` 分档生成在（probe `million-troops` 借道验过），⬜ 排程与守城 UI 无
- [ ] **P1-10 事件志容量与回看** ｜ ✅ 单源化后由 `pushLog` 统一限长；侧栏倒序 40 条渲染

---

## 4. P2 验收 — 加分项

- [ ] **P2-01 事件抉择系统** ｜ ⬜
- [ ] **P2-02 使节馆贸易与结盟** ｜ ⬜（`embassy` 已入权威 id 表，机制无）
- [ ] **P2-03 太学科技多分支树** ｜ 单线 6 项 ✅（桥内实现），扩展 ⬜
- [ ] **P2-04 `?difficulty=` / `?fx=off`** ｜ ⬜（讨伐目标的难度标签非此项）
- [ ] **P2-05 WebAudio 风声/炉火** ｜ ⬜
- [ ] **P2-06 结局「春回」结算画卷** ｜ ⬜（同 P0-14）
- [ ] **P2-07 甲子极寒脚本化终局** ｜ ⬜（climate 无 57 天脚本钩子，R3 复核维持）

---

## 5. 存档往返专项

- [ ] **S-01 刷新续玩** ｜ ✅ 接线（8s 定时 + `beforeunload` 走 `engine/save.js` 单键；启动 `loadGame` + 「读取存档 · 第 N 日」toast）｜ 👁 浏览器刷新实测待走查
- [x] **S-02 旧档前向兼容** ｜ ✅✅ probe `missing-save-fields` 过 + Node 实测缺字段信封归一补默认值不崩
- [x] **S-03 坏档拒绝** ｜ ✅✅ 实测：非法 JSON 抛「存档不是合法 JSON」、非对象抛「存档结构无法识别」
  （中文报错）；`engine.importSave` 包装为 `{ok:false,reason}` 且**当前局不变**；`loadGame` 失败按新档
- [ ] **S-04 导出 / 导入 UI（R2 硬性 5）** ｜ 🟡 主链路已通、两处小项不符
  - ✅✅ 已实测：顶栏 `#btn-export`/`#btn-import` + 失败幕导出按钮全部接线（`onExport/onImport`
    经 `engine.canExport/canImport` 判断显隐）；export→import→adoptState 往返 day 一致；导入后立即
    落盘防刷新回旧档
  - ❌ 小项一：导出文件名为时间戳 `sanguo-ice-age-<ISO时间>.json`，验收要求**含天数**
  - ⚠️ 小项二（边界，须裁决）：**结构无关但合法的对象 JSON**（如 `{"format":"nope"}`）会被
    `importSave` 宽容归一成第 1 天新档并**静默替换当前局**（实测）——误选文件即丢进度；
    建议改为 `assertState` 严格拒绝或加确认弹窗
- [ ] **S-05 双存档键合一** ｜ 🟡 单键 `sanguo-ice-age-save-v1` 已达成（config 单源实测）；
  ⬜ 旧 `-ui` 键**无迁移代码**（全 js 无引用，R3 grep 实测）——Round 1 玩家进度直接丢弃，需裁决豁免或补一次性迁移
- [x] **S-06 localStorage 不可用兜底** ｜ ✅✅ `memoryStorage` 探测回退有单测（本轮 24/24 内）
- [x] **S-07 往返深等（引擎合同）** ｜ ✅✅ `save/production: memoryStorage round-trip` 单测过 + R3 往返实测

---

## 6. 边界用例专项

> 单内核收敛后「双侧验证」简化为：systems 探针 = 游戏行为（同一代码），仅视觉呈现另需走查。

- [x] **B-01 资源全为 0** ｜ ✅✅ probe `zero-resources-tick` 过；400/2000 tick 无负数无 NaN
- [x] **B-02 寒潮重叠 / 异常参数** ｜ ✅✅ probe `huge-cold-wave` 过（`blizzardDaysLeft` 异常大不卡死）；烈度 clamp（max 2）与十四度寒潮单测过
- [x] **B-03 满级火炉** ｜ ✅✅ probe `building-cap` 过（火炉 30 级时其他建筑升级显式拒绝、等级不变、造价有限数）
- [x] **B-04 空编队 / 不足额出征** ｜ ✅✅ probe `empty-formation` 过（空阵容判负含 `attacker-empty` 记录）；`previewRaid` 原因文案实测（「至少点将 1 人」「兵力不足 10，无法出征」「兵力不足」）
- [x] **B-05 0 招募令抽卡** ｜ ✅✅ probe `zero-token-recruit` 过（roster 不变）｜ ⚠️「9 令十连整体拒绝」子项未专项验
- [x] **B-06 超大兵力（1e6）** ｜ ✅✅ probe 过（1.2ms 完成、无非有限数）
- [x] **B-07 人口/工人竞态** ｜ ✅✅ `trimWorkforce` 在 population tick 内（integration 十全 tick 套件过）｜ ⚠️ 撤工无感知提示（SOTA §2b 缓冲 8 未交付，仅体验项不阻验收）
- [ ] **B-08 仓储降级** ｜ 🟡 economy/raid 路径 clamp 实测；「读旧档资源高于新上限」专项未验

---

## 7. 最终验收红线（Round 3 · 可合并判定，8 条全过才可合并）

> 每条给出当前实测状态。「✔」= 本轮已测过且通过；「❌」= 已测且不通过；「👁」= 逻辑已测过、
> 浏览器证据待采。**合并候选提交上须逐条重验**——本轮复核期间工作树持续变动，下述状态只对
> e70b4cd + 当轮 Node 实测负责。

1. **测试红线** ❌ ——`npm test && npm run probe && npm run bench` 退出码全 0。
   当前 `bridge-project-view` 探针红（`projectView` 须把字符串 `flags.gameOver` 归一为布尔
   `gameOver===true`，或修探针合同）。**这是当前唯一一颗自动化红灯，未修不得合并。**
2. **施工收口红线** ❌（在途）——合并对象必须是**干净收口的提交**：当前工作树 7 个文件未提交
   （含 `bridge/actions.js`/`main.js`）+ 未跟踪的 `docs/PLAYGUIDE.md`；仓库根的 `.pw-ui.mjs`
   调试脚本**不得混入合并**。收口后在最终提交上重跑 1–8 全部红线。
3. **克制外显红线（P0-17，R2 硬性 3）** ❌ ——预览注记与战报必须带 systems 乘区数值
   （兵种 ×1.25 / 阵营 ×1.15，方向照 `TROOP_BEATS`/`FACTION_BEATS`）。R3 实测：`resolveBattle`
   结果无乘区数值字段、预览注记无 ±%、回合行无克制标注——UI 渲染骨架已备，缺数据接线。
   R2 定为硬性交付，未完成不得合并（若裁决降级，须在交付说明明写并同步本文）。
4. **败局红线（P0-13）** ✔/👁 ——判定→事件→停摆→失败幕→重开全链路 Node 实测通过；
   合并前补一次浏览器证据：失败幕弹出、「东山再起」点击重开、读入已败存档时补报不漏。
5. **存档红线（S-01/S-03/S-04）** ✔/👁+2 小项 ——引擎往返/坏档中文拒绝/不换局已实测通过；
   合并前须：① 浏览器刷新续玩走查；② 裁决「对象型坏档被静默采纳为新档」边界（建议严格拒绝）；
   ③ 导出文件名补天数或修改验收条款。
6. **数值红线** ✔ ——bench 2000 tick + 400 tick 健康局 + 败亡路径均无 NaN/Infinity/负资源/
   负人口/民心越界；同 seed 差值 0。合并候选提交上重跑 bench 确认仍绿即可。
7. **走查红线（P0-01 + 表意）** 👁 ——最终提交上完成一次浏览器走查并留证（`.pw-ui.mjs` 录屏/
   截图）：控制台 0 error 且见「systems 接管」日志；10 分钟自动游玩（4x，升级×5/招贤×3/讨伐×3/
   存读档×2）无未捕获异常；任务托盘红点、失败幕、导入导出、温度色四项 R2 交付肉眼可见。
8. **合同同步红线** ❌ ——三处实现与 DESIGN/探针合同的冲突须裁决并同步文档，否则验收口径悬空：
   ① 火炉等级上限（实现 20 级 vs DESIGN §6.2 六级）；② bench 目标（实测 0.25ms/tick → 10k tick
   ≈2.5s vs DESIGN §17「10k<250ms」）；③ 民心败局（实现 `≤15` 即时 vs DESIGN「连续 2 天」）。

> **当前结论：不可合并。** 硬阻塞 = 红线 1（探针红灯）、2（未收口）、3（克制外显未交付）、
> 8（合同未裁决）；红线 4/5/7 只差浏览器取证与两处小项，红线 6 已绿。

---

## 8. 交付前回归清单

```text
□ 收口提交后：npm test / probe / bench 退出码全 0（红线 1、2）
□ probes bridge-project-view 为 pass（gameOver 布尔归一），且非靠删探针
□ 克制乘区数值外显：previewRaid bonusText 带 ±%、resolveBattle 结果带乘区字段、
  panels「克制乘区」区块显示 ×1.25/×1.15（红线 3）
□ 浏览器走查留证：0 error 启动日志（systems 接管 + engine/loop.js）、失败幕重开、
  刷新续玩、导入导出（含坏档拒绝）、任务托盘领赏红点、data-temp 四档换色（红线 4/5/7）
□ S-04 两小项：导出文件名含天数；对象型坏档处理裁决
□ DESIGN §17 三处冲突裁决并同步（红线 8）
□ .pw-ui.mjs 等调试脚本不入库；docs/PLAYGUIDE.md 收口
```
