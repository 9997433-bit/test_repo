# SOTA 验收量规（Round 3 / F1 复评 · 可打分）

## 0. 打分方法

- 每条目 **0 / 1 / 2** 分：`0` 缺失或坏损；`1` 存在但有明确缺陷（缺陷须可指认）；`2` 达到验收标准且有证据。
- 五个维度：**A 体验 20 分、B 数值 16 分、C 性能 12 分、D 无障碍 12 分、E 测试 12 分**，满分 **72**。
- 评分线：**SOTA ≥ 65（90%）；可发布 ≥ 54（75%）；基线实测 30（42%）；Round 1 后 48（67%）；Round 2 后实测 57（79%）**。
- 每轮交付必须重打全表并更新分数列；打 2 分的条目必须给出证据（命令输出、录屏、代码位置）。
- **打分对象是线上运行的代码**：机制只存在于 data 层 / 测试而未接进运行路径的，按"存在但有明确缺陷"计 1 分，不计 2 分。
- 本轮复评证据环境：Node v22.14.0，`npm test` **91/91 通过**（save 40 + minigames 30 + economy 18 + contracts 3），`npm run bench` 实测 **747,247 ticks/s**（地板已上调至 **50,000** 并有断言），`node scripts/boundary.mjs` **7 guarded / 0 hazards**，`node scripts/simulate.mjs` 半活跃/纯挂机 3600s 双轨可复跑（2026-08 快照）。

## 0.1 Round 2 结论简报逐条校对（对照现行 src 实证）

| 简报断言 | 核实结果 | 证据 |
|---|---|---|
| 核心帽已合入 | **属实** | `core/limits.js`（`SHOP_LEVEL_MAX`/`PARTNER_LEVEL_MAX`/`PARTNERS_PER_SHOP_MAX`/`capAdd`）在动作层、读档、`economy.js` 三处生效；boundary `unbounded-shop-level` guarded |
| settle 已合入 | **属实** | `settle` 拒非有限 `now`、回拨钳 0、30s 在线/离线边界、8h 封顶；boundary `nan-current-time` guarded |
| 被动 XP 已合入 | **属实** | `state.js#tick`（在线全额）与 `settle`（离线 0.65 折、随 8h 封顶）都接线；simulate 实测纯挂机 38.6 分过 Lv7 阅历门 |
| 赏金适配已合入 | **属实** | `minigames/payouts.js` 别名/换算/归一三层把 `MINIGAME_PAYOUTS` 投影到视图键位，RTP≤0.85 体检越线整表拒收；五视图全部查表并经 `chargeFee/grantReward` 走账 |
| token CSS 已合入 | **属实** | `main.css` 裸值清零、全局 `:focus-visible`、`--tap-target` 落地、reduced-motion 双层兜底（DESIGN_SYSTEM §11 项 2/4/6 ✅） |
| HUD 文案已合入 | **属实** | `app.js` 接 `HUD/OFFLINE/SYSTEM/FAIL` + `A11Y`，`mallView` 接 `GOALS/SHOPS_COPY/SHOP_LOCKED_HINT/FAIL`，contracts.test 守键 |
| 91 测已合入 | **属实** | `npm test` → `# tests 91 / # pass 91 / # fail 0` |
| 仍开：豪宅倒挂旧价 | **属实** | `home/mansion.js#costOf` 仍 `200/bonus`（加成越高越便宜）且 `buy()` 直写 `state.gold/furniture` 绕过 `actions.buyFurniture`；契约测试只守住了动作层（ECONOMY §8.4） |
| 仍开：core toast 硬编码 | **属实** | `state.js#hydrate` 离线到账与坏档两条 toast 硬编码且裸 `Math.floor`，绕过 `copy.js#OFFLINE/SYSTEM` 与 `formatGold` |
| 仍开：1280 双栏 | **属实** | `main.css` 1280 断点只放宽容器/网格；无 `minmax(0,1fr)`+336px 侧栏，导航未并入顶栏（DESIGN_SYSTEM §11 项 5 ◐、§11.1-1） |
| 仍开：legacy 别名 | **属实，两处** | tokens.css 第 10 段 legacy 别名被 JS 注入样式引用约 88 处删不掉（DESIGN_SYSTEM §11 项 7 ◐）；`actions.js#PARTNER_SHARD_COST` 与 `balance.PARTNER_SIGN_SHARDS` 平行双源（现同为 3，改一处即分叉） |
| 仍开：离线回执仍是 toast | **属实** | `app.js#applySettle` → `showToast(offlineReceipt(...))`；短/常规/封顶三档文案已接 `OFFLINE`，但无结算面板 |

复评新增两处备忘（低危，未单列 P0）：

1. `wardrobe.js#syncHud` / `mansion.js#syncHud` 用文本匹配直改 HUD pill 并丢掉 `HUD.gold/rate` 标签词，pill 文案瞬时不一致（下一 tick 被 `paintHud` 纠正）。P0-2 顺手收：改为调组合根暴露的刷新入口。
2. `copy.js` 事件数据里的 `reward.charm` 在 `randomEvents.js` 结算时被静默丢弃（ECONOMY §8.7），发放或删字段二选一。

## A. 体验（20 分：基线 11 → R1 14 → 本轮 14）

| # | 条目 | 2 分标准 | 验收方法 | R1 | R2 | R3 | 复评证据 / 缺口 |
|---|---|---|---|---|---|---|---|
| A1 | 60 秒首单 | 新档从加载到完成第一份快餐订单 ≤ 60s，且路径无死角 | 清档实玩计时（录屏） | 2 | 2 | 2 | 开场三幕（`ui/intro.js`）收尾即 `go("shop","fastfood")`，订单 2–4 件即成 |
| A2 | 五店玩法差异化 | 五店各有机制上不同的小游戏，且玩法与店铺主题强关联 | 逐店实玩对照 spec P0 #4–7 | 1 | 1 | 1 | 五视图重写且全查表：快餐连击/连胜/耐心、生鲜接物命数/加速刷怪、服装需求推理、盲盒保底/连开/图鉴档位、占卜吉兆计数/三同象。残留：盲盒与占卜仍是零操作付费抽随机（占卜三格按 `stopMs` 自动停轮，无时机技巧），缺操作深度 |
| A3 | 商场地图 | 2D 俯视百货城布局，店铺空间感 + 灰态锁定 + 解锁条件展示 | 目测 + 对照 spec P0 #2 | 1 | 1 | 1 | 仍卡片网格（`mall/mallView.js`）；灰态与解锁条件在，无俯视地图 |
| A4 | 养成即时反馈 | 换装/家装/委派后 HUD 与相关数值**当帧**更新 | 换装后观察 HUD 魅力与 /秒 | 1 | 2 | 2 | HUD 四 pill 每 tick 文本级刷新（`app.js#paintHud`）；换装/家装当帧回写并 bump。备注：syncHud 文本匹配直改 pill 丢标签词（§0.1 备忘 1） |
| A5 | 限时目标成环 | 目标完成或超时后自动续期下一档，形成核心循环第一环 | 完成一次目标后观察 | 1 | 2 | 2 | `advanceGoal` 达标升档/超时降档续期接进 settle 管线；饱和守卫已修——营收加不动时停手不再刷 32 条通知（boundary `saturated-goal-loop` guarded，`notificationsInOneTick: 1`；save.test "a saturated goal stops the loop"） |
| A6 | 突发事件 | ≥3 类事件、有代价的选择或微交互（如抓小偷 QTE），节奏可控 | 挂机 5 分钟观察 + 触发交互 | 1 | 1 | 1 | 6 类事件、原生 dialog、18s 倒计时（切后台暂停）、婉拒退避节奏、误触遮罩 nudge；但仍二选一且接受无风险必得奖——严格占优，无真实抉择、无微交互；`reward.charm` 被丢弃 |
| A7 | 离线回执 | 回归弹结算面板：时长、倍率、来源、格式化金额 | 改 `lastTick` 后刷新 | 1 | 1 | 1 | 仍 toast。改善：`app.js#offlineReceipt` 已接 `OFFLINE` 短离开/常规/封顶三档变体 + `formatGold`；缺口：无结算面板（倍率/来源明细都没有），`hydrate` 路径完全绕过 copy 且裸 `Math.floor` |
| A8 | 微动效与反馈 | 关键动作有 240–360ms 动效：金币飘字、升级庆祝、按压反馈；符合设计 spec §5 | 录屏逐项走查 | 1 | 1 | 1 | 五小游戏全有 `floatText` 飘字（`--anim-coin`），按压态全局落地（`.btn:active`/nav/line/choices），入场动效+stagger 齐；缺口：主角升级无任何庆祝、商场升级/招聘无飘字、locked 店卡无 shake（DESIGN_SYSTEM §11 项 3 ◐） |
| A9 | 音效完备 | 全部关键动作有合成音、失误音正常、有静音开关 | 实玩 + 点错订单听失误音 | 1 | 2 | 2 | `sfx.beep` 失误音在五视图生效；「更多」页静音开关，`muted` 入 v2 存档并在启动/导入时恢复 |
| A10 | 文案与叙事 | 开场叙事完整、文案集中可维护、口吻统一 | 读 `data/copy.js` 覆盖率 | 1 | 1 | 1 | HUD/FAIL/GOALS/OFFLINE/SYSTEM/INTRO/EVENTS/SHOPS_COPY/FASHION_CLIENTS 已接线（app/mall/intro/events/boutique）；但快餐/生鲜/盲盒/占卜/伙伴/研发/衣橱/豪宅视图内仍大量硬编码中文，core hydrate 两条 toast 硬编码 |

## B. 数值（16 分：基线 6 → R1 10 → 本轮 14）

| # | 条目 | 2 分标准 | 验收方法 | R1 | R2 | R3 | 复评证据 / 缺口 |
|---|---|---|---|---|---|---|---|
| B1 | 公式集中 data 层 | 所有产出/成本/赏金公式在 `data/balance.js`，视图零数字字面量 | `rg '\d+ \*|\* \d+' src/minigames src/mall` | 1 | 1 | 1 | 五小游戏零私价（全查 `payouts()`），商场升级/招聘走 `actions`→balance 曲线且签名已修（`shop` 实参、`hireCost` 对齐；contracts.test "action costs read the balance curve"）。**唯一残留**：`mansion.js#costOf` 私价 `200/bonus` 倒挂 + 直写 state（ECONOMY §8.4） |
| B2 | 曲线经模拟验证 | 升级回本时间、每级停留时长有模拟脚本与文档结论 | 读 `docs/ECONOMY.md` + 跑模拟 | 0 | 1 | 2 | `scripts/simulate.mjs` 入库可复跑（dt=1s×3600s 双轨，驻店帽/衰减/研发前置全入模）；ECONOMY §7 已按实测回填节奏基准；回本增速窗口 (1.05,1.20) 有断言。备注：脚本内 `ECONOMY_REFERENCE` 对照表存 Round 1 旧值（记录性、不断言，§8.5 待同步） |
| B3 | XP 供给设计 | 等级双门槛（金+XP）下，纯挂机与主动玩两条路径都有明确的升级节奏 | 模拟两种玩法到 Lv5 | 1 | 1 | 2 | `passiveXpPerSec` 已进 tick/settle（离线 0.65 折、随 8h 封顶）；单测 "tick accrues passive xp / offline settle accrues discounted passive xp / passive xp unblocks idle leveling slower than active play"；simulate 实测纯挂机 38.6 分、半活跃 29.3 分过 Lv7 阅历门，双路径达标 |
| B4 | 离线/在线一致性 | 离线 65%、8h 封顶正确；后台标签不劣于离线；时钟回拨安全 | 单测 + 挂后台 10 分钟对照 | 1 | 2 | 2 | `settle` 统一记账：节流不丢收益、回拨钳 0、30s 边界、8h 封顶、拒 NaN now 全有单测；`visibilitychange`/`pagehide` 双保险 |
| B5 | 委派策略深度 | 特长匹配收益显著、驻店有槽位约束、培训有边际递减 | 读公式 + 实测全员堆一店 | 1 | 1 | 2 | 特长匹配（mismatch 拿不到加成有单测）；驻店帽 2/店三道防线（动作层拒、读档兜底、economy 取前 N）；培训 40×1.6^n；`combinePartnerBonuses` 衰减已进 `economy.js#shopBonusMap`（"stacked partner bonuses go through the decay curve"）——全员堆一店不再是最优解，simulate 亦证实中后期乘区被压回 |
| B6 | 无印钞漏洞 | 所有付费随机玩法期望值为负（付出>期望回报），随机奖励只承载碎片/惊喜 | 期望值笔算 + 万次蒙特卡洛 | 0 | 1 | 2 | 五视图查表走账（`chargeFee/grantReward` 全经动作层，视图零直写 state）；RTP≤0.85 红线 + 越线整表拒收 + 换表行为本身有单测；盲盒期望按含保底口径核（41.7+保底修正 < 60×0.85）、占卜运行时 RTP 51%，两视图都向玩家公示期望；旧正期望印钞机已下线 |
| B7 | 数值回归测试 | 期望值、回本曲线、封顶行为均有断言 | `npm test` | 1 | 2 | 2 | economy.test 18 条 + minigames.test 30 条：期望/RTP、保底口径、回本窗口、双门槛逐级、封顶、目标升降档、被动XP、家具定价单调、叠加衰减、赏金单调/硬上限 |
| B8 | 大数与格式化 | 万/亿格式化全 UI 一致，浮点累积无可见误差 | 全 UI 走查 | 1 | 1 | 1 | 商场/伙伴/研发/豪宅/回执（app 路径）已走 `formatGold`；残留：`hydrate` 离线 toast 裸 `Math.floor`，wardrobe/mansion `syncHud` 直改 pill 丢 HUD 标签词 |

## C. 性能（12 分：基线 3 → R1 8 → 本轮 8）

| # | 条目 | 2 分标准 | 验收方法 | R1 | R2 | R3 | 复评证据 / 缺口 |
|---|---|---|---|---|---|---|---|
| C1 | sim 吞吐 | bench ≥ 50,000 ticks/s 且脚本以此为地板 | `npm run bench` | 2 | 2 | 2 | 实测 747,247 ticks/s（1M ticks / 1338ms）；`THROUGHPUT_FLOOR = 50_000` + assert（bench.mjs:22,49），实测为地板 15 倍 |
| C2 | 渲染策略 | 无每 tick 全量重绘；交互重绘限于子树；不丢焦点 | 代码走查 + 打字时观察焦点 | 0 | 1 | 1 | 每 tick 仅四 pill diff 后 `textContent` 落笔（`paintPill`）；但交互重绘仍整视图/整列表 `innerHTML` 重建，升级/招聘/培训后焦点必丢（`mallView#repaint`、`roster#paintList`） |
| C3 | 定时器治理 | 单一 tick 泵派生全部调度；视图 dispose 协议落实 | 切页后 `getEventListeners`/断点观察 | 0 | 2 | 2 | 单泵派生结算/落盘/事件（`app.js#pump`）；`disposeStage` 统一收尾；五小游戏全走 `createDisposer`（interval/timeout/rAF/监听统一登记），disposer 自身有 3 条单测 |
| C4 | 后台/可见性 | `visibilitychange` 恢复时统一结算；后台不空转 | 挂后台回来看回执 | 0 | 2 | 2 | 隐藏即 settle+persist、恢复即 settle+回执、`pagehide` 兜底；事件弹窗倒计时后台暂停；接物小游戏 dt 上限 50ms 防瞬移 |
| C5 | 内存与节点规模 | 长时挂机 DOM 节点数稳定、无脱离节点堆积 | DevTools Memory 快照对比 | 1 | 1 | 1 | 泄漏路径全关、每 tick 零建节点、飘字/掉落物自删；但 Memory 快照实测证据仍未做，按"2 分须有证据"规则保守计 1 |
| C6 | 帧率证据 | 主界面 60fps、小游戏 ≥30fps，附 DevTools/录屏证据 | Performance 面板录制 | 0 | 0 | 0 | 仍无任何帧率测量与证据 |

## D. 无障碍（12 分：基线 4 → R1 7 → 本轮 10）

| # | 条目 | 2 分标准 | 验收方法 | R1 | R2 | R3 | 复评证据 / 缺口 |
|---|---|---|---|---|---|---|---|
| D1 | 键盘可达 | 全部关键操作（含接物小游戏、弹窗关闭）键盘可完成 | 拔鼠标全流程通关 | 1 | 1 | 2 | 生鲜接物已上键盘（`fresh.js`：stage `tabindex=0 role=application` + 方向键按 `keyStep` 移筐）；快餐 1–4 键、事件弹窗 Esc/autofocus/Tab 环、intro 全键盘；豪宅 SVG 热区不可聚焦但右侧按钮列表提供全量等价路径 |
| D2 | 焦点管理 | 重绘不丢焦点；`:focus-visible` 焦点环；选中态不占用 outline | Tab 走查 | 0 | 1 | 1 | 全局 `:focus-visible` 焦点环（`--ring-focus`，main.css:69）+ 各组件叠加；`.choices button.on` 已改 inset box-shadow 不占 outline；残留：交互重绘丢焦点（同 C2，标准明文含"重绘不丢焦点"） |
| D3 | 语义与 ARIA | toast=`role=status`、弹窗=`role=dialog`+焦点陷阱、nav=`aria-current` | 读屏软件/审计工具 | 1 | 2 | 2 | toast `role=status aria-live=polite`；nav `aria-current=page` + `A11Y.nav` 完整语义；事件弹窗原生 `showModal()` + `aria-labelledby/describedby` + 降级焦点环；HUD pill 带 `aria-label` 动态更新 |
| D4 | 对比度 AA | 全部文本 ≥4.5:1（大字 3:1），审计报告留档 | axe/Lighthouse 审计 | 1 | 1 | 1 | tokens 注明文本安全色及比值（`--rose-700` 白底 6.3:1 等）；仍无审计报告留档，渐变底上的小字未测 |
| D5 | 动效偏好 | `prefers-reduced-motion` 全局降级 | 系统开减动效走查 | 0 | 1 | 2 | motion.css token 级压 1ms + main.css §18 关入场/位移 + 六处 JS 注入样式各自带降级块（events/minigames/partners/fashion/research/home）；生鲜掉落保留为玩法必需位置信息（§18 注释明示取舍） |
| D6 | 触控目标 | 交互目标 ≥44×44px 或等效间距 | 量测 nav 与小游戏按钮 | 1 | 1 | 2 | `--tap-target: 44px` 落地：nav/`.btn`/`.choices` `min-height` 全接，流水线键 56px（`--line-key-height`），注入面板按钮以更高特异性拉齐（DESIGN_SYSTEM §11 项 4 ✅） |

## E. 测试（12 分：基线 6 → R1 9 → 本轮 11）

| # | 条目 | 2 分标准 | 验收方法 | R1 | R2 | R3 | 复评证据 / 缺口 |
|---|---|---|---|---|---|---|---|
| E1 | 经济单测深度 | 覆盖公式 + 期望值 + 曲线性质（回本单调性、封顶） | `npm test` 读断言 | 1 | 2 | 2 | economy.test 18 条：期望/RTP、回本增速窗口、门槛逐级精确/差一拒绝、封顶、目标升降档、被动XP 双路径、家具定价反倒挂、叠加衰减 |
| E2 | 存档迁移测试 | 固化旧档原文 → 迁移 → 断言新形状；坏档回退有测试 | `npm test` | 1 | 2 | 2 | save.test 40 条：v1 原文迁移逐字段断言、脏档消毒、坏档备份不清档、加店不炸老档、v1 导出档导入、settle 全边界、动作层守卫、等级帽、被动XP、饱和目标 |
| E3 | 进程推进测试 | 模拟推到五店全解锁 + 目标续期若干轮 | `npm test` | 1 | 1 | 1 | 仍仅 Lv1→2 解锁 fresh 一例 + 目标升/降档各一轮；`simulate.mjs` 能推到五店全开但只是脚本、不在 `npm test` 断言 |
| E4 | 小游戏逻辑可测 | 赏金/判定逻辑为纯函数并有 Node 断言 | `npm test` | 0 | 1 | 2 | minigames.test 30 条，且被测函数就是视图运行的代码（视图查同一 `payouts()`/纯函数）：死键禁令、别名投影、坏值兜底、B6 拒收换表、保底跨抽结转、加权边界、disposer 契约 |
| E5 | bench 门槛有效 | 地板设为 50,000 ticks/s，回归即红 | 读 `scripts/bench.mjs` | 1 | 1 | 2 | `THROUGHPUT_FLOOR = 50_000` + `assert.ok(ticksPerSec >= THROUGHPUT_FLOOR)`，另有单长 tick 相对误差与 ultraGold 探针。残留（不扣本条）：`boundary.mjs`/`simulate.mjs` 未挂 npm scripts，探针不拦 CI |
| E6 | 零依赖可 CI | `npm test`/`npm run bench` 零安装直跑 | 干净环境执行 | 2 | 2 | 2 | 本轮复验：Node 原生 runner 零安装，test 91/91、bench、boundary、simulate 全部直跑通过 |

## 汇总与 Round 3 P0

**本轮得分：A 14 + B 14 + C 8 + D 10 + E 11 = 57 / 72（79%）**。轨迹 30 → 48 → 57（本轮 +9）；**可发布线 54 已过（+3 冗余）**；距 SOTA 线 65 差 8 分。

Round 2 的主题"接线与钳制"基本兑现：B 维从 10 → 14（印钞洞、被动XP、衰减合并、模拟脚本四案全关），D 维从 7 → 10（键盘、减动效、触控三案全关），boundary 7 探针全绿。剩余失分集中在三类：**取证欠账**（C5/C6/D4，纯手工测量留档，+4 分空间）、**重绘焦点**（C2/D2 同根，+2）、**最后一处旧价视图与回执形态**（B1/A7/B8，+3）。玩法侧短板（A2/A3/A6）成本高、每条仅 +1，继续押后。

### Round 3 必须关闭的 P0（按性价比排序，预估 +10~11 → 67–68）

1. **P0-1 豪宅接线：最后一个旧价视图下线**（B1，+1）
   `mansion.js` 删私有 `costOf = 200/bonus`（倒挂：加成越高越便宜，全套实付 21,357 vs 新口径 15,600），展示价与扣款全部改走 `actions.furnitureCost/buyFurniture`；同轮收敛 legacy 双源：`actions.PARTNER_SHARD_COST` 改读 `balance.PARTNER_SIGN_SHARDS`（roster 展示同步）。
2. **P0-2 离线回执面板化 + core 文案去硬编码**（A7/B8，+2）
   回归改弹结算面板：时长、离线倍率、家装加成来源、`formatGold` 金额（`copy.js#OFFLINE` 面板文案已备）；`state.js#hydrate` 两条硬编码 toast 改走 copy + `formatGold`；顺手把 wardrobe/mansion 的 `syncHud` 文本匹配 hack 换成组合根暴露的刷新入口（§0.1 备忘 1）。
3. **P0-3 交互重绘保焦点**（C2/D2，+2）
   `mallView` 升级/招聘、`roster` 培训/派驻改为行内局部更新或重绘后按 `data-*` 恢复焦点；两条目同根，一次修复双收。
4. **P0-4 取证三件**（C5/C6/D4，+4）
   长挂机 30 分钟 Memory 快照对比、主界面/生鲜 Performance 帧率录制、axe/Lighthouse 对比度审计，报告全部留档进 docs。纯手工测量，零代码风险，本轮最大单项分池。
5. **P0-5 推进模拟入测 + 探针挂 CI**（E3，+1）
   headless 推进断言进 `npm test`：模拟推到五店全解锁 + 目标续期若干轮（可复用 simulate 管线）；`boundary.mjs` 挂进 npm scripts，7 探针回归即红。
6. **P0-6 升级庆祝与组件态补完**（A8，+1）
   主角升级庆祝动效（settle notes 已有管线可挂）、商场升级/招聘飘字、locked 店卡点击 shake——DESIGN_SYSTEM §11 项 3 的 JS 挂类名清单照做即可，动效 token 均已备。
7. **P0-7 spec 债两件（简报点名，无直接分值）**
   ① 1280 双栏工作台（DESIGN_SYSTEM §10.2：`minmax(0,1fr)` + 336px 侧栏、hero 压横幅、导航并入顶栏，涉 `app.js` 骨架）；② tokens.css 第 10 段 legacy 别名退役（先迁 JS 注入样式约 88 处引用到语义层，再删别名段，顺带清 `app.js`/`mallView.js` 内联裸值）。不进量规行但服务 A/D 维录屏走查底线，防止桌面端体验在 SOTA 评审时被抓现行。

### P1（本轮明确不做，防止范围蔓延）

俯视商场地图（A3）、事件风险抉择/微交互 + `reward.charm` 发放或删除（A6，ECONOMY §8.7）、盲盒/占卜操作深度（A2 玩法侧）、五小游戏与伙伴/研发/衣橱视图 copy 全量收编（A10）、`simulate.mjs` 内 `ECONOMY_REFERENCE` 对照表同步（§8.5）、抽水随等级缩放（§8.6）、首目标硬编码改走 `rollNextGoal`（§8.8）、tier 0/1 标签口径归一（§8.9）。
