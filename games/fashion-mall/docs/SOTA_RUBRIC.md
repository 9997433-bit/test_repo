# SOTA 验收量规（Round 2 / F1 复评 · 可打分）

## 0. 打分方法

- 每条目 **0 / 1 / 2** 分：`0` 缺失或坏损；`1` 存在但有明确缺陷（缺陷须可指认）；`2` 达到验收标准且有证据。
- 五个维度：**A 体验 20 分、B 数值 16 分、C 性能 12 分、D 无障碍 12 分、E 测试 12 分**，满分 **72**。
- 评分线：**SOTA ≥ 65（90%）；可发布 ≥ 54（75%）；基线实测 30（42%）；Round 1 后实测 48（67%）**。
- 每轮交付必须重打全表并更新分数列；打 2 分的条目必须给出证据（命令输出、录屏、代码位置）。
- **打分对象是线上运行的代码**：机制只存在于 data 层 / 测试而未接进运行路径的，按"存在但有明确缺陷"计 1 分，不计 2 分。
- 本轮复评证据环境：Node v22.14.0，`npm test` **47/47 通过**，`npm run bench` 实测 **2,082,703 ticks/s**（地板仍 2,000），`node scripts/boundary.mjs` **4 guarded / 3 hazards**（2026-08 快照）。

## 0.05 Parent 续评（复评快照之后已合入）

F1 复评基于较早工作树。其后父分支已合入，下列 P0 视为关闭，勿按上表再开重复工：

- **P0-1**：五店小游戏视图 + `minigames/payouts.js` 已合入，可接管 `MINIGAME_PAYOUTS`。
- **P0-2 / P0-3 / P0-4**：`limits.js`、settle 拒 NaN、等级/驻店帽、被动 XP、研发前置、`combinePartnerBonuses`、成本签名对齐；`npm test` **58**；`boundary.mjs` **hazards: 0**。
- **P0-5 样式**：`main.css` 已 token 化，focus-visible / reduced-motion / 44px 触控已上。
- **仍开**：HUD/商场/事件 copy+a11y 接线、小游戏单测入库、豪宅改走 `buyFurniture`、bench 地板上调。

## 0.1 Round 1 简报（全文收录，本次复评的对照基准）

> 十席均已合入。架构/存档v2/settle/动作层、token+纸娃娃豪宅、负期望经济表、五店小游戏、伙伴研发事件、copy/a11y、47 单测、boundary 3 个数值炸弹。
> 遗留：main.css 未接 token；HUD 未接 copy；被动XP/驻店上限/研发前置未进 core；店铺无等级帽可 Infinity；NaN now；小游戏单测未入库。
> Round 2 重点：接线与钳制，不新开玩法。

### 简报逐条校对结论（对照 src 实证）

| 简报断言 | 核实结果 | 证据 |
|---|---|---|
| 架构/存档v2/settle/动作层 | **属实** | `core/state.js#settle` 统一在线/离线；`core/save.js` v2 信封 + `migrate` + 白名单写档 + 坏档备份；`core/actions.js` 动作层 |
| token+纸娃娃豪宅 | **属实** | `styles/tokens.css`（含 motion.css 已接 index.html）；`fashion/dollArt.js` 分层 SVG；`home/roomArt.js` 三房 |
| 负期望经济表 | **属实但仅 data 层** | `data/balance.js#MINIGAME_PAYOUTS`（盲盒 RTP 73%、占卜 79%）；**视图未查表，线上仍是旧正期望**（见 B6） |
| 五店小游戏 | **有出入** | 五个视图 `src/minigames/*.js` 仍是基线版：硬编码赏金、直写 state、盲盒/占卜正期望。合入的只有赏金表与纯函数 |
| 伙伴研发事件 | **属实** | `partners/roster.js`（试算/派驻/培训）、`research/labs.js`（顺序产线）、`events/randomEvents.js`（dialog 弹窗+节奏退避） |
| copy/a11y | **属实但接线不全** | `data/copy.js` 8 块 + `data/a11y.js`；HUD/FAIL/GOALS/OFFLINE/SYSTEM 标注"待接线"且确未接 |
| 47 单测 | **属实** | `npm test` → `# tests 47 / # pass 47 / # fail 0` |
| boundary 3 个数值炸弹 | **属实** | `scripts/boundary.mjs` → hazards：`nan-current-time`、`unbounded-shop-level`、`saturated-goal-loop` |
| 遗留六项 | **全部属实** | 逐项见下表对应条目（A10/B3/B5/B6/E4、boundary 输出） |

复评新增两处简报未提的**死接线**（危害同级，并入 P0）：

1. `core/actions.js#fromBalance` 调 `BALANCE.shopUpgradeCost(lv)` 少传 `shop` 参数 → `shop.base` 取 undefined → NaN → 静默回退基线公式 `80×1.45^n`；`shopHireCost` 在 balance 里叫 `hireCost`，名字不符同样回退 `50×1.5^n`。**F3 的升级/招聘新成本曲线在线上是死代码**。
2. `home/mansion.js#costOf` 私有 `200/bonus` 倒挂定价并直写 state，完全绕过 `actions.buyFurniture` 与 `balance.furnitureCost`（bonus×40000）。

## A. 体验（20 分：基线 11 → 本轮 14）

| # | 条目 | 2 分标准 | 验收方法 | R1 | R2 | 复评证据 / 缺口 |
|---|---|---|---|---|---|---|
| A1 | 60 秒首单 | 新档从加载到完成第一份快餐订单 ≤ 60s，且路径无死角 | 清档实玩计时（录屏） | 2 | 2 | 开场三幕（`ui/intro.js`）收尾即 `go("shop","fastfood")`，订单 2–4 件即成 |
| A2 | 五店玩法差异化 | 五店各有机制上不同的小游戏，且玩法与店铺主题强关联 | 逐店实玩对照 spec P0 #4–7 | 1 | 1 | 五视图未动：盲盒与占卜仍同质"付费抽随机"（`minigames/blindbox.js`、`fortune.js`），缺操作深度 |
| A3 | 商场地图 | 2D 俯视百货城布局，店铺空间感 + 灰态锁定 + 解锁条件展示 | 目测 + 对照 spec P0 #2 | 1 | 1 | 仍卡片网格（`mall/mallView.js`）；灰态与解锁条件在，无俯视地图 |
| A4 | 养成即时反馈 | 换装/家装/委派后 HUD 与相关数值**当帧**更新 | 换装后观察 HUD 魅力与 /秒 | 1 | 2 | HUD 四 pill 每 tick 文本级刷新（`app.js#paintHud`）；换装当帧回写魅力/速率 pill 并 bump（`wardrobe.js#syncHud`），家装当帧回写金币（`mansion.js#syncHud`） |
| A5 | 限时目标成环 | 目标完成或超时后自动续期下一档，形成核心循环第一环 | 完成一次目标后观察 | 1 | 2 | `core/state.js#advanceGoal` 达标发奖升档、超时降档续期，接进 settle 管线；续期/降档/老档零奖励续期均有单测。残留：目标饱和时 32 次守卫耗尽一口气刷 32 条通知（boundary `saturated-goal-loop`，P0-3） |
| A6 | 突发事件 | ≥3 类事件、有代价的选择或微交互（如抓小偷 QTE），节奏可控 | 挂机 5 分钟观察 + 触发交互 | 1 | 1 | 6 类事件、dialog 弹窗、18s 倒计时自动错过、婉拒退避节奏（`events/randomEvents.js`）；但仍二选一且接受无风险必得奖——严格占优，无真实抉择、无微交互 |
| A7 | 离线回执 | 回归弹结算面板：时长、倍率、来源、格式化金额 | 改 `lastTick` 后刷新 | 1 | 1 | 仍 toast；`app.js#applySettle` 已 `formatGold` 但 `core/state.js#hydrate` 路径仍裸 `Math.floor`；`copy.js#OFFLINE` 回执面板文案已备未接 |
| A8 | 微动效与反馈 | 关键动作有 240–360ms 动效：金币飘字、升级庆祝、按压反馈；符合设计 spec §5 | 录屏逐项走查 | 1 | 1 | motion.css 已接入 index.html；衣橱/豪宅/伙伴/研发有飘字与入场动效；但主循环（五小游戏、商场升级）无金币飘字、无升级庆祝，`main.css` 按钮无按压态 |
| A9 | 音效完备 | 全部关键动作有合成音、失误音正常、有静音开关 | 实玩 + 点错订单听失误音 | 1 | 2 | `core/audio.js` 补 `sfx.beep` 转发，快餐失误音生效；「更多」页静音开关，`muted` 入 v2 存档并在启动/导入时恢复（`app.js`） |
| A10 | 文案与叙事 | 开场叙事完整、文案集中可维护、口吻统一 | 读 `data/copy.js` 覆盖率 | 1 | 1 | `copy.js` 扩至 8 块 + `a11y.js`，intro/events/boutique 已接线；但 HUD/FAIL/GOALS/OFFLINE/SYSTEM 未接，五小游戏/商场/伙伴/研发视图仍大量硬编码中文 |

## B. 数值（16 分：基线 6 → 本轮 10）

| # | 条目 | 2 分标准 | 验收方法 | R1 | R2 | 复评证据 / 缺口 |
|---|---|---|---|---|---|---|
| B1 | 公式集中 data 层 | 所有产出/成本/赏金公式在 `data/balance.js`，视图零数字字面量 | `rg '\d+ \*|\* \d+' src/minigames src/mall` | 1 | 1 | 赏金表/成本曲线/目标曲线/被动XP 全部入 balance.js；但五小游戏视图零查表（`28 + done.length*12` 等原样在），mansion 私价 `200/bonus`，actions 升级/招聘两处死接线回退基线公式（§0.1） |
| B2 | 曲线经模拟验证 | 升级回本时间、每级停留时长有模拟脚本与文档结论 | 读 `docs/ECONOMY.md` + 跑模拟 | 0 | 1 | ECONOMY.md 全量重写：回本增速窗口 (1.05, 1.20) 有测试守护、3min/15min/1h 节奏基准入档；模拟脚本未入库（ECONOMY §8.7），结论不可复跑 |
| B3 | XP 供给设计 | 等级双门槛（金+XP）下，纯挂机与主动玩两条路径都有明确的升级节奏 | 模拟两种玩法到 Lv5 | 1 | 1 | `passiveXpPerSec` 曲线 + 单测已备（纯挂机每级 17–52 分钟）；**未接进 tick/settle**（`core/state.js#tick` 只 grantGold），线上纯挂机仍永久卡级 |
| B4 | 离线/在线一致性 | 离线 65%、8h 封顶正确；后台标签不劣于离线；时钟回拨安全 | 单测 + 挂后台 10 分钟对照 | 1 | 2 | `settle` 统一记账：节流 5s/跳 vs 250ms/跳 收益差 <1%、回拨钳 0 并对齐、30s 在线/离线边界、8h 封顶全有单测（`tests/save.test.js`）；`visibilitychange`/`pagehide` 双保险（`app.js`） |
| B5 | 委派策略深度 | 特长匹配收益显著、驻店有槽位约束、培训有边际递减 | 读公式 + 实测全员堆一店 | 1 | 1 | 培训成本已指数化生效（actions → `balance.partnerTrainCost` 40×1.6^n）；但 `combinePartnerBonuses` 衰减未接进 `economy.js#shopBonusMap`（仍直接求和），全员堆最贵店仍是最优解 |
| B6 | 无印钞漏洞 | 所有付费随机玩法期望值为负（付出>期望回报），随机奖励只承载碎片/惊喜 | 期望值笔算 + 万次蒙特卡洛 | 0 | 1 | 负期望表 + RTP≤85% 断言已锁（balance + economy.test）；**但线上视图仍硬编码旧表**：盲盒 60 花费 → 期望 90.2 金 + 0.69 碎片（净 +30.2/盒），占卜 30 → 66.7 金（净 +36.7/转）——印钞机照常营业，唯一在营的线上经济事故 |
| B7 | 数值回归测试 | 期望值、回本曲线、封顶行为均有断言 | `npm test` | 1 | 2 | economy.test.js 17 条：期望/RTP、盲盒权重边界、回本窗口、双门槛逐级、封顶、目标升降档、被动XP 速率带、家具定价单调、叠加衰减 |
| B8 | 大数与格式化 | 万/亿格式化全 UI 一致，浮点累积无可见误差 | 全 UI 走查 | 1 | 1 | 商场/伙伴/研发/回执（app 路径）已走 `formatGold`；`hydrate` 离线 toast 与五小游戏赏金 toast 仍裸数字 |

## C. 性能（12 分：基线 3 → 本轮 8）

| # | 条目 | 2 分标准 | 验收方法 | R1 | R2 | 复评证据 / 缺口 |
|---|---|---|---|---|---|---|
| C1 | sim 吞吐 | bench ≥ 50,000 ticks/s 且脚本以此为地板 | `npm run bench` | 2 | 2 | 实测 2,082,703 ticks/s（1M ticks / 480ms）；地板仍 2,000，扣分继续记在 E5 |
| C2 | 渲染策略 | 无每 tick 全量重绘；交互重绘限于子树；不丢焦点 | 代码走查 + 打字时观察焦点 | 0 | 1 | 每 tick 仅四 pill `textContent` 更新（`app.js#paintHud`）；但交互重绘仍整视图 `innerHTML` 重建，升级/招聘/派驻后按钮焦点必丢（`mallView` repaint、`roster#paintList`） |
| C3 | 定时器治理 | 单一 tick 泵派生全部调度；视图 dispose 协议落实 | 切页后 `getEventListeners`/断点观察 | 0 | 2 | 单泵派生结算/落盘/事件（`app.js#pump`，3 interval → 1）；`disposeStage` 统一调 dispose/`_cleanup`，fresh/mall/labs/roster 均注册。占卜转盘 1.2s 瞬时 interval 未注册但自终止（低危，P0-3 顺手收） |
| C4 | 后台/可见性 | `visibilitychange` 恢复时统一结算；后台不空转 | 挂后台回来看回执 | 0 | 2 | 隐藏即 settle+persist、恢复即 settle+弹回执、`pagehide` 兜底（`app.js`）；配 B4 节流单测 |
| C5 | 内存与节点规模 | 长时挂机 DOM 节点数稳定、无脱离节点堆积 | DevTools Memory 快照对比 | 1 | 1 | 已知泄漏路径全关、每 tick 零建节点、飘字/掉落物均自删；但 Memory 快照实测证据未做，按"2 分须有证据"规则保守计 1（P0-6 取证即 +1） |
| C6 | 帧率证据 | 主界面 60fps、小游戏 ≥30fps，附 DevTools/录屏证据 | Performance 面板录制 | 0 | 0 | 无任何帧率测量与证据 |

## D. 无障碍（12 分：基线 4 → 本轮 7）

| # | 条目 | 2 分标准 | 验收方法 | R1 | R2 | 复评证据 / 缺口 |
|---|---|---|---|---|---|---|
| D1 | 键盘可达 | 全部关键操作（含接物小游戏、弹窗关闭）键盘可完成 | 拔鼠标全流程通关 | 1 | 1 | intro 全键盘（Enter 提交、h2 焦点接力）、事件弹窗 Esc/autofocus；生鲜接物仍 pointer-only（`fresh.js#pointermove`），豪宅 SVG 购买热区不可聚焦（按钮列表可兜底） |
| D2 | 焦点管理 | 重绘不丢焦点；`:focus-visible` 焦点环；选中态不占用 outline | Tab 走查 | 0 | 1 | `--ring-focus` 焦点环只在伙伴/事件/研发注入样式中生效；`main.css` 全局无（nav/btn/小游戏裸奔）；`.choices button.on` 仍占用 outline；交互重绘丢焦点（同 C2） |
| D3 | 语义与 ARIA | toast=`role=status`、弹窗=`role=dialog`+焦点陷阱、nav=`aria-current` | 读屏软件/审计工具 | 1 | 2 | toast `role=status aria-live=polite`（`app.js#hudMarkup`）；nav `aria-current=page`（`paintNav`）；事件弹窗原生 `dialog.showModal()`（焦点陷阱）+ `aria-labelledby/describedby` + Esc/cancel（`randomEvents.js`），无 dialog 环境有 role/aria-modal 降级 |
| D4 | 对比度 AA | 全部文本 ≥4.5:1（大字 3:1），审计报告留档 | axe/Lighthouse 审计 | 1 | 1 | tokens 注明文本安全色及比值；无审计报告留档，11px nav 小字与渐变底未测 |
| D5 | 动效偏好 | `prefers-reduced-motion` 全局降级 | 系统开减动效走查 | 0 | 1 | motion.css token 级降级 + 伙伴/事件/衣橱/豪宅/研发注入样式各自降级；`main.css` 的 `pop`/`fall`/卡片 hover 位移未走 token、不降级（生鲜掉落 `fall` 是玩法动画，减动效下仍需保可玩的等效呈现） |
| D6 | 触控目标 | 交互目标 ≥44×44px 或等效间距 | 量测 nav 与小游戏按钮 | 1 | 1 | `--tap-target: 44px` 已定义未使用；nav 按钮仍 ~30px 高（`main.css .nav button`：11px 字 + 8px 上下 padding） |

## E. 测试（12 分：基线 6 → 本轮 9）

| # | 条目 | 2 分标准 | 验收方法 | R1 | R2 | 复评证据 / 缺口 |
|---|---|---|---|---|---|---|
| E1 | 经济单测深度 | 覆盖公式 + 期望值 + 曲线性质（回本单调性、封顶） | `npm test` 读断言 | 1 | 2 | 期望值/RTP、回本增速窗口 (1.05,1.20)、门槛逐级精确/差一拒绝、封顶前后、目标曲线、被动XP 速率带全有断言（`tests/economy.test.js`） |
| E2 | 存档迁移测试 | 固化旧档原文 → 迁移 → 断言新形状；坏档回退有测试 | `npm test` | 1 | 2 | `LEGACY_V1` 字符串原文固化 → migrate → 逐字段断言；坏档备份不清档、未来版本拒读、脏档消毒、v1 导出档导入、加店不炸老档全覆盖（`tests/save.test.js`） |
| E3 | 进程推进测试 | 模拟推到五店全解锁 + 目标续期若干轮 | `npm test` | 1 | 1 | 仍仅 Lv1→2 解锁 fresh 一例 + 目标升/降档各一轮；无推到五店全解锁的推进模拟 |
| E4 | 小游戏逻辑可测 | 赏金/判定逻辑为纯函数并有 Node 断言 | `npm test` | 0 | 1 | `fastfoodTip/freshPayout/boutiquePayout/blindboxRoll/fortuneSpin` 纯函数入 balance 且有断言；**但视图未查表，被测代码不是线上跑的代码**（接线后自动升 2） |
| E5 | bench 门槛有效 | 地板设为 50,000 ticks/s，回归即红 | 读 `scripts/bench.mjs` | 1 | 1 | `THROUGHPUT_FLOOR = 2_000` = 实测 0.1%，形同虚设；boundary.mjs 未挂进 npm scripts，3 个 hazard 探针不拦 CI |
| E6 | 零依赖可 CI | `npm test`/`npm run bench` 零安装直跑 | 干净环境执行 | 2 | 2 | 本轮复验：Node 原生 runner 零安装，test 47/47、bench、boundary 全部直跑通过 |

## 汇总与 Round 2 P0

**本轮得分：A 14 + B 10 + C 8 + D 7 + E 9 = 48 / 72（67%）**。基线 30 → 48（+18）；距可发布线 54 差 6 分，距 SOTA 线 65 差 17 分。

Round 1 的模式性缺陷：**data 层与测试先行、运行路径滞后**——B1/B3/B5/B6/E4 五个条目全部卡在"机制已建成、线上未生效"。因此 Round 2 唯一主题就是简报定的**接线与钳制，不新开玩法**。

### Round 2 必须关闭的 P0（按危害排序，预估 +15 → 63 分）

1. **P0-1 关印钞洞：五小游戏视图查表接线**（B6/B1/A2/E4，约 +4）
   盲盒/占卜改查 `MINIGAME_PAYOUTS` + `blindboxRoll/fortuneSpin`，经 `actions.payFee/reward` 走账；快餐/生鲜/服装改查 `fastfoodTip/freshPayout/boutiquePayout`；五视图禁直写 state、赏金 toast 走 `formatGold`。这是唯一在营的线上经济事故（盲盒净 +30.2/盒、占卜净 +36.7/转，可无限刷）。
2. **P0-2 修死接线：成本曲线真正生效**（B1/B2，约 +1）
   `actions.shopUpgradeCost` 补 `shop` 参数、`shopHireCost` 改调 `hireCost`（或 balance 补同名导出）；`mansion.js` 弃 `200/bonus` 改走 `actions.buyFurniture`（倒挂定价随之修复）；`PARTNER_SHARD_COST` 收敛为 `balance.PARTNER_SIGN_SHARDS`。修完 mallView/mansion 展示价与扣款价自动一致。
3. **P0-3 数值钳制：boundary 三炸弹清零**（简报点名，约 +1）
   店铺/伙伴等级帽（`unbounded-shop-level`：Lv=MAX_SAFE_INTEGER → 收入 Infinity）；`settle` 对非有限 `now` 守卫（`nan-current-time`：lastTick/回执被 NaN 污染）；`advanceGoal` 守卫耗尽降噪（`saturated-goal-loop`：单 tick 32 条通知）。boundary 挂进 `npm test`，7 探针全绿。
4. **P0-4 core 接线：简报遗留三件**（B3/B5，约 +2）
   `passiveXpPerSec` 进 tick/settle（离线按 0.65 折）；`combinePartnerBonuses` 进 `economy.js#shopBonusMap`；研发顺序前置从 `labs.js` 下沉进 `actions.buyResearch`（现在控制台可跳序购买）。
5. **P0-5 UI/样式接线**（A7/A10/D2/D5/D6，约 +4）
   HUD/FAIL/GOALS/OFFLINE/SYSTEM 接 `copy.js` + `a11y.js`（`paintHud` 与失败 toast 优先）；`main.css` 迁语义 token 并补全局 `:focus-visible`（用 `--ring-focus`）、`.choices` 选中态改 box-shadow、nav 触控目标用 `--tap-target`、`pop/fall/hover` 纳入 `prefers-reduced-motion` 降级；`hydrate` 离线 toast 走 `formatGold`。
6. **P0-6 门槛与取证**（C5/C6/E5，约 +3）
   `bench.mjs` 地板 2,000 → 50,000；帧率录制（主界面/生鲜小游戏）与长挂机 Memory 快照对比留档进 docs。

### P1（本轮明确不做，防止范围蔓延）

俯视商场地图（A3）、事件微交互/风险抉择（A6）、盲盒/占卜玩法差异化（A2 玩法侧）、离线回执面板化（A7）、五店推进模拟（E3）、经济模拟脚本入库（B2）、事件奖励随等级缩放（ECONOMY §8.8）。
