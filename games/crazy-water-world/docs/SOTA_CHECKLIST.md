# SOTA 验收清单（分级可勾选版）

> Round 3 由 Fable-4 验收官在合并树（`53a1438`，Round 2 四路全合入）上终验后重写。
> 勾选状态 = Round 3 开局实测结果（证据与复现步骤见 `ACCEPTANCE.md` Round 3 节）。
> 规则：P0 全绿才允许对外宣称可玩；P1 全绿才允许宣称 SOTA；P2 是打磨项。
> 每项附「验证」方法，后续改完必须按验证方法回归后才能勾选。
> **Round 3 开局快照：P0 保持全绿；Round 2 点名的 5 项 P1 关掉 3 项半（表驱动、
> 5v5 取舍、伤病接线、战斗契约测试；事件+居民未动）。剩余 P1 集中在一个模式：
> 「引擎侧已完工、UI/存档层没收口」——潜水海区、图鉴、钓鱼旁路、存档丢字段、
> B30 倒挂。见 ACCEPTANCE §4 本轮必关 5 项。**

## A. 手感（Game Feel）

- [x] **P0** 钓鱼计时输入真实有效：收杆时机取自节奏条指针实时位置并传入 `resolveHook`，不被渲染循环重置。
  验证：R3 重跑 e2e `smoke.mjs` 37/37 PASS（含「指针在扫动 / 窗口内收杆命中 / 一秒后指针仍在跑」）。
- [x] **P0** 钓鱼是节奏交互而非「读数字填空」：窗口只画成高亮区（`FISHING_RULES.windowHidden`），中央金条是完美区。
  验证：e2e「面板不泄底窗口数字」PASS；窗口随 tick 漂移、`gradeCast` 三档、天气咬钩率换算窗口宽窄与指针速度（`castLine` 的 `WEATHER_PAD`/`WEATHER_SWEEP`）。
- [x] **P0** 潜水场景可见：DOM 舞台渲染潜水员、氧气条、鲨鱼、资源点（稀有金圈）、贴脸红圈警告。
  验证：e2e「潜水舞台出现 / 氧气 HUD 有读数 / 氧气在消耗」PASS；切屏警告与氧气继续掉由 `wiring.mjs` 断言。
- [x] **P0** 潜水用真实帧时长且按住方向键连续移动：`ctx.held` 集合 + `diveStep(dt)` 内部 0.05s 子步。
  验证：R2 实测口径保持；`SHARK_MIN_Y` 保证上浮永远是活路。
- [x] **P1** 建筑可拖拽移动 / 可旋转（0/90）/ 幽灵预览与失败 reason / 菜单成本与状态。
  验证：`tests/world.test.js` + e2e `fresh.mjs` 11/11（「2×2 绿格 / 等级原因提示」）。
- [x] **P1** 拾荒点击命中判定用二维距离：`hitTestFlotsam`/`pickFlotsam` 与 canvas 绘制共用几何。
  验证：`tests/explore.test.js` 覆盖。
- [x] **P1** 潜水双表已合一：`data/dive.js` 是唯一真源（explore 侧写死的那份已删），海区解锁
  （dockLevel/stage 双门槛）、氧耗、掉落、`diveO2` 天气禁潜全部引擎侧接通，`diveZones(state)`
  海区面板数据现成。
  验证：`explore/dive.js` 头注释 + `canDive` 四段前置；R3 读码确认单一 `DIVE_ZONES`。
- [ ] **P1**（收口件）潜水海区选择无 UI：`ui/screens/dive.js:210` 写死 `startDive(ctx.state, "wreck")`，
  `diveZones()` 零 UI 消费方——city/trench 的解锁、稀有率、氧量玩家永远看不见也选不了。
  验证：潜水屏出现海区列表（锁定项显示 reason），选 trench 下潜后掉落表与氧量随区变化。
- [ ] **P1**（新增）钓鱼 UI 走旁路，天气巡检层整层死代码：`ui/screens/fish.js` 直连
  `castLine`+`resolveHook`，竿子存 `ctx.ui.fish` 不入档；`beginCast`/`hookCast`/
  `syncExploreWeather` 零调用，`stepSim` 也没挂。实测后果（探针 B）：海啸天挂着的竿子 20 个
  量子不收、`resolveHook` 不查天气照样上鱼；UI 还自抄了一份 perfect 判定（与 `gradeCast` 公式
  重复）。
  验证：fish 屏改走 `beginCast`/`hookCast`；`stepSim` 每量子过 `syncExploreWeather`；海啸天
  已抛的竿子被强制收杆且不上鱼。
- [ ] **P2** 拾荒「点击即捞」在全部六屏生效，与原验收口径「仅主屏可捡」不一致。属故意设计，保留观察。
  验证：建造/英雄屏各点 20 次格子与按钮，统计误捡次数。
- [ ] **P2** 收集飞入动画与画布粒子未落地：`ART_DIRECTION.md` §「待落地」明列水彩木纹、拾取吸入
  粒子、泡沫粒子带（雨丝已有，实测 `drawWeatherOverlay` 只有雨线与暗幕；甲板是纯色交替块+一条中线）。
  验证：按 ART_DIRECTION §208–209 粒子预算（≤120 活跃、生命 ≤1.2s、reduceMotion 全关）落地后截图对照。

## B. 信息层次（UI/UX Hierarchy）

- [x] **P0** 三条状态条有文字标签与数值 + `role="meter"` + `aria-valuenow`。
  验证：R3 e2e 重跑 PASS。
- [x] **P1** 建造菜单展示成本、占地、当前状态；升级/委任有可发现入口；战报可读（逐行播放、跳过、
  横幅、残血名单）。
  验证：e2e smoke/wiring 对应断言 PASS；「战报播完跳过自己收起」新断言 PASS。
- [x] **P2** 新手引导：`nextGoal` 主线指引常驻 +「带我去」跳屏。
  验证：e2e `fresh.mjs` 全链 11/11 PASS；指引横幅 sticky 由 wiring 断言。
- [ ] **P2** 软目标追踪 UI 缺失：HQ 8 级 / 30 关 / 浮动城邦（`RAFT_RULES.cityGoal`）无进度展示，
  `cityGoal` 仍无消费方。
  验证：主屏或菜单可见三目标进度条。

## C. 存档（Persistence）

- [x] **P0** 本地自动存档，刷新不丢：4 秒间隔 + `beforeunload` 落盘，标题屏「继续漂流」。
  验证：R3 e2e 以存档启动全程无 JS 报错。
- [x] **P0** 旧档/缺字段容错：`normalize` 深合并 + 全字段钳回合法域，坏 JSON 走新档。
  验证：R2 实测口径保持（weatherTimer/脏档钳域）。
- [x] **P1** 离线补算：`savedAt` 差值→`idleSince`→`settleOffline`（8h 封顶）。
  验证：R2 实测保持；`stepSim` 首步仍先 `settleOffline`。
- [ ] **P1**（新增）存档往返丢字段，首钓奖励可无限重刷：`normalize` 白名单重建 `explore.fishing`
  只留 `lastCatch`，`codex` 与 `cast` 全丢。实测（探针 A）：钓一条→存→载，图鉴 1→0、
  `newEntry` 再次为 true——首钓 coins/diamonds 刷新即可重领，图鉴功能上线前这就是无限货币口子。
  验证：normalize 保留（并钳域）`explore.fishing.codex/cast`；存→载→重钓同鱼 `newEntry=false`；
  补一条「存档往返幂等」单测。
- [ ] **P2** 存档版本迁移与导出/导入（文本串）。
  验证：迁移函数有单测；导出串清档后可导入还原。
- [x] **P2** `beforeunload` 时落盘。

## D. 无障碍（Accessibility）

- [x] **P0** 减弱动态有 UI 开关 + 尊重 `prefers-reduced-motion`；canvas 读 `settings.reduceMotion`。
  验证：R3 e2e「减弱动态钩子 / 动效开关刷新后仍在」PASS。
- [x] **P0** 静音状态载入即生效 + 可见按钮 + M 键。
  验证：R3 e2e「静音切换」PASS。
- [ ] **P1** 键盘可完成核心循环：钓鱼/潜水/切屏/变速已可键盘；**拾荒与建造落位仍必须指针**
  （R3 复核 `app.js` 无变化）。
  验证：拔掉鼠标走通「捡资源→建小屋→交订单」。
- [ ] **P1** 色盲友好：海面漂浮物仍是纯色圆点 + 稀有金圈，无形状/图标区分。
  验证：灰度截图区分木/塑料/蓝图漂浮物。
- [ ] **P2** aria 覆盖与触控目标：未跑 Lighthouse。
  验证：Lighthouse a11y ≥ 90。
- [x] **P1** 触控可玩三线：潜水虚拟十字键、建造两次点击确认、钓鱼/拾荒点按。
  验证：e2e「方向热区能下潜」PASS。

## E. 性能（Performance）

- [x] **P0** 渲染循环不重建 DOM：一次建树，每帧只改 text/style/class。
  验证：R3 e2e「空闲 2 秒左面板节点级重建 < 20 次」PASS。
- [x] **P0** bench 测真实负载：24×24 木筏、64 建筑（12 类全覆盖）、**64 座全部委任英雄**、
  8 邻接围栏、海啸天气、30 关 Boss 战。
  验证：R3 实测 tick p95 0.133ms（预算 2）/ stepSim 0.117ms（预算 4）/ battle 0.099ms（预算 8），
  `denseAssignments`/`adjacentFences` checks 为 true。
- [x] **P1** `tickWorld` 无整状态 `structuredClone`；建筑表编译一次（`compileBuildings`），tick 内
  零 `Object.entries`。
  验证：表驱动改造后 64 建筑全委任 p95 仍 0.133ms。
- [x] **P2**（原「邻接/委任扫描防退化」）bench 已加委任密集场景：64 座建筑全部挂英雄 + 邻接
  围栏，预算未破。委任查找已走 `heroIndex` Map、邻接走 `adjacencyIndex`。
  验证：R3 bench `assignedBuildings: 64` 输出。
- [x] **P2** 生产构建可用：`npm run build` 通过，JS gzip 55.92kB（< 100kB），**R2 遗留的
  `engine.js` 动态 import vite 告警已消失**（render 由壳层注入，core 对 ui 零依赖）。
  验证：R3 实测构建输出无告警。
- [ ] **P1** 浏览器侧 fps 探针缺失：无 `?fps=1` 或调试面板（R3 复核仍无）。
  验证：主场景 40+ 建筑 + 满漂浮物显示实时 fps，低于 30 报警。

## F. 内容密度（Content Density）

- [x] **P0** 升星链路可达：Boss 首通 shard（合计 140）+ 潜水掉落双来源。
  验证：R3 e2e wiring「Boss 首通后 #bag-shard 40→50 / 手账写明碎片到账」PASS。
- [x] **P1**（R2-1 关掉）建筑职能全面表驱动：`sim.js` 经 `compileBuildings` 消费
  `BUILDINGS.output/input/converts/adjacency`；`upgradeCost` 消费 `upgradeGrowth/upgradeExtra`
  （升级成本随级涨、稀缺件固定）；still 产盐、salvage 产废铁、farm 耗淡水、车间
  「浮木2+废铁1→工具1」——**tool 有来源有去向**（`upgradeExtra fromLevel:2 add tool`）；
  天气新轴 hunger/thirst/durationSec/stillBonus/fishing/diveO2 全部有消费方；
  `WEATHER_SCHEDULE` 按 HQ 分档（开荒 HQ1–2 档无海啸）；`UNLOCK_HQ` 进 `unlockCheck`。
  验证：R3 读码逐字段对账 + bench/stress 12 类建筑全覆盖 + 探针 D 长跑资源曲线正常。
- [x] **P2** 关卡多样性：六 Boss 机制各异、5v5 满编、杂兵曲线经真实仿真校准。
  验证：stress 30 关 × 128 seed 全过、`fiveEnemiesPerStage`/`allBattlesFiveVsFive` true。
- [ ] **P1**（新增）B30 难度倒挂，终局考试不成立：`tide_lord` 无倍率覆写（落默认 hp×3.8/atk×1.3、
  护卫 ×0.7），被 `combat-contract` 快照冻结。实测（探针 E）：**2 星×5 阵容在 B20/B25 全败
  0/128，却 117/128 拿下 B30**；面板 B30（hp 4241/atk 77）血量低于 B20（4795）、攻击比 B25
  （124）低 38%。
  验证：重录快照后把 B30 倍率抬到 hp≥×6/atk≥×2.6，2 星阵容胜率归零、4 星里程碑阵容可过。
- [ ] **P1** 居民系统半成：订单轮换已表驱动（`rollOrder` 按 HQ 档抽池、量随 HQ 放大），但
  `RESIDENT_POOL`（radioLevel 门槛 + coins/meal 招募成本全备）零消费方——实测（探针 D）造电台后
  400 模拟秒居民恒 1 人，`ORDER_RULES.maxOpenOrders = residents.length` 因此恒 1 单。
  验证：电台按级招募 `RESIDENT_POOL` 居民（扣 cost）；多居民各挂订单；perk 进对应建筑产率。
- [ ] **P1** 随机事件未上线：`data/events.js`（海盗/鲨群/商栈，minStage/minHq/weight 全备）仍零
  消费方——实测（探针 D）400 模拟秒 `world.event` 恒 null；风暴对建筑无后果。
  验证：加速 10 分钟至少触发一次事件且画面/日志有表现；商栈事件可用 coins 交易。
- [ ] **P2** 货币闭环缺半：coins 多路获取（订单/关卡/首通/首钓）仍零消费（`rg "coins -" src` 零
  结果）。去向设计已现成：`RESIDENT_POOL[*].recruit.cost` 与 `EVENTS.trader.trades`，随上两项
  接线即闭环。
  验证：完成一次用 coins 的交易或招募。
- [ ] **P2** 鱼类图鉴半成收口：数据层完整且**首钓奖励/xp 字段本轮已接线**（`resolveHook` 读
  `fish.firstCatch/xp`，探针 A 实测首钓 +5 coins），`fishCodex()` 面板数据现成，但无图鉴屏
  （`rg fishCodex src/ui` 零结果）；且存档丢 codex（见 C 节新 P1，先修那个再上屏）。
  验证：图鉴屏显示 18 鱼已解锁/剪影；重登不丢收录。

## G. 原作还原度（《疯狂水世界》Fidelity）

- [x] **P1** 七位预设英雄技能全实现，且全部进契约测试：7 种 kind 逐一断言「星级达标有数值后果、
  差一星与无技能字节相同」。
  验证：`tests/combat-contract.test.js` skillCases 7/7。
- [x] **P2** 微醺之龙「酒劲」生效；`data/heroes.js` 过时注释已清（R3 复核零命中「未实现」）。
- [x] **P1**（R2-2 关掉）5v5 阵容取舍 UI：关卡屏勾选出战（超编拦截）、前/后排分栏、自动配队/
  全部下场，`lineupOf` 收敛到 `heroes/lineup.js selectLineup`（UI 不再自己 slice），伤员由
  `readyHeroes` 挡在门外并单列「养伤中」+ 倒计时。
  验证：e2e `wiring.mjs`「阵容与 selectLineup 逐位一致 / 不等于 slice(0,5) / 勾选 / 超编拦截 /
  前后排分栏」PASS。
- [x] **P1**（R2-3 关掉）伤病接线：campaign 战后调 `applyBattleInjuries`（阵亡挂 300s + 自动
  离岗），英雄屏「养伤中」标签 + 禁委任 + 逐帧倒计时。
  验证：e2e wiring「阵亡进养伤分栏、倒计时、不可委任」PASS。**尾巴：`tickInjuries` 未挂
  `stepSim`——痊愈无归队日志、`injuredUntil` 残留（探针 C，功能性恢复正常），归入 A 节钓鱼
  旁路那条 P1 一并挂钩。**
- [x] **P0** 战斗纯函数可复现：同 seed 字节稳定；重试盐已接且 UI 真用 `combat.battleSeed`。
  验证：stress 3840 场 0 错配（digest `7b022e47…`，随 5v5 关卡重校自然更换）；e2e wiring
  「种子 == combat.battleSeed / 败一场后换种子」PASS；黄金快照 3 份锁行为。
- [x] **P1** 科技解锁接 HQ：`unlockCheck` 双口径（player.level **或** `UNLOCK_HQ`，旧档兼容的
  故意设计）；`WEATHER_SCHEDULE` 按 HQ 分档生效（HQ1–2 档无海啸）。
  验证：R3 读码 `world/build.js:59` + `world/sim.js weatherWeights`。**尾巴（P2 见下）。**
- [ ] **P2**（新增）解锁与天气两处原作口径尾巴：① 双口径 OR 使「不立 HQ 只能建 HQ」的原作约束
  不成立（player.level 通道绕过）；② `hqLevel=0`（没建 HQ）不匹配任何档位、回退全局
  `WEATHER_WEIGHTS`（含海啸 4）——开荒裸筏反而可能比 HQ1–2 更早挨海啸；③ `warnSec`
  （风暴 12s/海啸 25s 预警）零消费方，天气仍瞬切无撤离窗口。
  验证：新档不建 HQ 只能建 HQ 且无海啸；转风暴/海啸前有预警条。
- [x] **P1** 昼夜 + 五档天气改变海面颜色与产率，夜晚加暗；新天气轴全线消费（见 F 表驱动项）。
- [x] **P2** 「老大」口吻覆盖主要交互。

## H. 隔离性（Isolation）

- [x] **P0** 独立目录、独立 package.json/lock、零跨界 import、独占端口 4174。
  验证：R3 独立 `npm install && npm test` 实测；dev server 4174 HTTP 200。
- [x] **P1** probe 隔离检查为真实断言（realpath 比对）。
  验证：R3 实测输出 `cwd=/workspace/games/crazy-water-world`。
- [ ] **P2** Google Fonts CDN 外链仍在（R3 复核 `index.html:16–19` 未变）。
  验证：离线模式刷新无阻塞请求、字体退化可接受。

## I. 工程门槛（Gates）

- [x] **P0** `npm test` 全绿。
  验证：R3 实测 5 文件 37 用例全过。
- [x] **P0** `npm run probe` 全绿。
  验证：R3 实测 7/7 PASS。
- [x] **P1** `npm run bench` / `npm run stress` 退出码 0 且负载真实。
  验证：R3 实测 bench 64 建筑全委任全预算内；stress 32×32 密铺 240 建筑 + 30 关 × 128 seed +
  3840 场 0 错配 + 12 项 checks 全 true。
- [x] **P1**（R2-5① 关掉）战斗契约测试落地：`tests/combat-contract.test.js` 20 用例——黄金 JSON
  快照 ×3（含 B30 满编全战报，锁 rng 消费顺序）、七技能星级门槛（差一星 == 无技能字节等价）、
  铁钩钩后排 ×6 seed、委任/招募/升星三向引用契约 ×4。
  验证：R3 实测全过。**尾巴：`applyBattleInjuries`/`tickInjuries` 仍零单测（wiring e2e 有 UI 层
  断言兜着），下轮补。**
- [ ] **P1**（R2-5② 仍开）e2e 未入门禁：smoke 37 + fresh 11 + wiring 41 = **89 断言 R3 全过**，
  但仍需手动 dev server + `npm i --no-save playwright-core`，无 `test:ui` 一键命令。
  验证：`npm run test:ui` 一条命令跑通（自起 dev server）。
- [x] **P2**（R2-6 关掉）契约漂移收口：`STAGE_RULES.seedFormula` 已与实现一致；campaign 改用
  `combat.battleSeed` 导出（私有副本已删）；双 `DIVE_ZONES` 已合一（data 侧唯一真源）；
  `data/heroes.js` 过时注释已清。
  验证：R3 逐条读码复核。
