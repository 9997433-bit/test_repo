# SOTA 验收清单（分级可勾选版）

> Round 2 由 Fable-4 验收官在合并树（`4c98f8f`，Round 1 十路全合入）上重验后重写。
> 勾选状态 = Round 2 开局实测结果（证据与复现步骤见 `ACCEPTANCE.md` Round 2 节）。
> 规则：P0 全绿才允许对外宣称可玩；P1 全绿才允许宣称 SOTA；P2 是打磨项。
> 每项附「验证」方法，后续改完必须按验证方法回归后才能勾选。
> **Round 2 开局快照：P0 全绿（Round 1 的 6 项 P0 红全部翻绿）。剩余缺口集中在 P1
> 「数据表接线」与「战斗/经营纵深」，见各节新增项与 ACCEPTANCE §4。**

## A. 手感（Game Feel）

- [x] **P0** 钓鱼计时输入真实有效：收杆时机取自节奏条指针实时位置并传入 `resolveHook`，不被渲染循环重置。
  验证：e2e `smoke.mjs`「节奏条指针在扫动 / 窗口内收杆命中 / 一秒后指针仍在跑」3 项 PASS；指针状态在 `ctx.ui.fish` 而非 DOM，面板重建不清零。
- [x] **P0** 钓鱼是节奏交互而非「读数字填空」：窗口只画成高亮区（`FISHING_RULES.windowHidden`），中央金条是完美区。
  验证：e2e「面板不泄底窗口数字」PASS；`castLine` 每竿窗口随 tick 漂移（实测 8 竿 8 个不同窗口），`gradeCast` 三档判定；`cast.tip` 的调试数字未被 UI 使用。
- [x] **P0** 潜水场景可见：DOM 舞台渲染潜水员、氧气条、鲨鱼、资源点（稀有金圈）、贴脸红圈警告。
  验证：e2e「潜水舞台出现 / 氧气 HUD 有读数 / 氧气在消耗」PASS；截图 `07_dive.png`。注：实现为海面层上的 DOM 舞台而非 canvas 绘制，按「可见可躲」口径通过。
- [x] **P0** 潜水用真实帧时长且按住方向键连续移动：`ctx.held` 集合 + `diveStep(dt)` 内部 0.05s 子步。
  验证：Node 实测按住 1 秒位移 18.00 单位（`SWIM_SPEED=18` 积分）；直线撞鲨在 0.9s 处会话终止（碰撞判定生效）；触控十字键 `data-hold` 走 pointer 事件。
- [x] **P1** 建筑可拖拽移动：建造屏「移动」模式两步走（点建筑拿起 → 点新位置放下），非法位置给 reason。
  验证：`ui/screens/build.js` move 模式 + `canMove`/`moveBuilding`；`tests/world.test.js` 覆盖移动+旋转落位。
- [x] **P1** 建筑可旋转（0/90）：R 键或「旋转」按钮，放置与移动共用。
  验证：单测「rotates a moved building by 90 degrees」通过；UI 显示当前朝向。
- [x] **P1** 放置有幽灵预览与失败反馈：悬停绿/红占位 + 标签直接写 `can*().reason` 文案；触控两次点击确认。
  验证：e2e `fresh.mjs`「空木筏上预览是 2×2 绿格 / 未解锁建筑给出等级原因」PASS。
- [x] **P1** 拾荒点击命中判定用二维距离：`hitTestFlotsam` 与 canvas 绘制共用 `flotsamScreenPos` 几何。
  验证：`tests/explore.test.js` 覆盖；点同一竖列远处海面不再误捡。
- [ ] **P2** 拾荒「点击即捞」在全部六屏生效（`onSea` 拾荒优先），与原验收口径「仅主屏可捡」不一致。属故意设计（漂浮物在所有屏可见），保留观察：若造成误触（如建造模式点格子先捡走漂浮物）再收紧。
  验证：建造/英雄屏各点 20 次格子与按钮，统计误捡次数。
- [ ] **P2** 收集飞入动画缺失（稀有闪光 shimmer 已有、reduceMotion 静态替代已有）。
  验证：捡取时资源图标飞向仓库；reduceMotion 下跳过。
- [ ] **P1**（新增）潜水只有 wreck 一图可下：`explore/dive.js` 与 `data/dive.js` 各有一份 `DIVE_ZONES`（zone 集合、字段、解锁语义全不同），UI 玩法走 explore 表、文案读 data 表，且无海域选择 UI。
  验证：两表合一（保留一份 SSOT），船坞 2/3 级解锁 city/trench 类深区，UI 出现海域选择且深度标尺随 `maxDepth` 缩放。
- [ ] **P2**（新增）天气轴未接探索：`WEATHERS[*].fishing`（tsunami=0 应禁钓，现仅文案「鱼今天罢工」）与 `diveO2` 氧耗倍率均无消费方。
  验证：tsunami 天抛竿被拒；storm 天氧耗 ×1.5。

## B. 信息层次（UI/UX Hierarchy）

- [x] **P0** 三条状态条有文字标签与数值：「饱食 68 / 口渴 59 / 生命 100」+ `role="meter"` + `aria-valuenow`。
  验证：`app.js meter()` 实现 + e2e 截图可辨认。
- [x] **P1** 建造菜单展示成本、占地、当前状态：每卡片显示 `名称 w×h`、成本行、「可建/材料不够/需 N 级/已建成」。
  验证：`build.js mount/update`；资源不足时卡片置灰。
- [x] **P1** 升级/委任有可发现入口：升级是建造屏四模式之一（点建筑显示费用与新等级）；委任是英雄卡上的下拉框。
  验证：e2e「委任写回 state / 升星消耗碎片」PASS；不再有 Shift/Alt 隐藏操作。
- [x] **P1** 战报可读：逐行播放（技能行高亮）、跳过按钮、胜负横幅、双方残血名单（血条+数值）。
  验证：e2e「战报有内容 / 战报横幅有结论 / 残血名单出现」PASS。
- [x] **P2** 新手引导：`nextGoal` 主线指引常驻左栏 +「带我去」跳屏，覆盖 HQ→钓鱼椅→吃饭→招募→推图→净水→广播→船坞。
  验证：e2e `fresh.mjs` 全链 11 项 PASS。
- [ ] **P2** 软目标追踪 UI 缺失：HQ 8 级 / 30 关 / 浮动城邦（`RAFT_RULES.cityGoal`：18 格 + 8 种建筑）无进度展示，`cityGoal` 无消费方。
  验证：主屏或菜单可见三目标进度条。

## C. 存档（Persistence）

- [x] **P0** 本地自动存档，刷新不丢：4 秒间隔 + `beforeunload` 落盘，标题屏「继续漂流」。
  验证：`engine.js` flush 双通道；e2e 走查以存档启动。
- [x] **P0** 旧档/缺字段容错：`normalize` 深合并 + 全字段钳回合法域，坏 JSON 走新档。
  验证：Node 实测删 `world.weatherTimer` 后载入 `weatherTimer=85`（不再 NaN 锁死）；脏档 `tick:-5` 钳回 0。
- [x] **P1** 离线补算：`hydrateSave` 把 `savedAt` 差值折进 `idleSince`（8h 封顶），`stepSim` 先 `settleOffline` 再走帧，产出真实入账并留「离线 N 分钟」摘要日志。
  验证：Node 实测 +1h 载入 rawFish 2→38.75；8h 与 80h 结果一致（封顶生效）。注：摘要只落手账，无弹窗，观感项后补。
- [ ] **P2** 存档版本迁移与导出/导入（文本串）。`normalize` 已能兜住缺字段，但无 v1→v2 迁移函数与导入导出入口。
  验证：迁移函数有单测；导出串清档后可导入还原。
- [x] **P2** `beforeunload` 时落盘。
  验证：`engine.js` 事件监听存在。

## D. 无障碍（Accessibility）

- [x] **P0** 减弱动态有 UI 开关（顶栏「动效」按钮）+ 尊重 `prefers-reduced-motion`（`motion.css` 全动画包在 no-preference 内，reduce 时静态替代），canvas 波浪/漂浮读 `settings.reduceMotion`。
  验证：e2e「减弱动态钩子」PASS；`motion.css` 两个媒体查询块。
- [x] **P0** 静音状态载入即生效：`createApp` 启动调 `setMuted(settings.muted)`，`syncHooks` 持续同步，顶栏 🔊/🔇 可见按钮 + M 键。
  验证：e2e「静音切换」PASS；代码路径读档→setMuted 无缺口。
- [ ] **P1** 键盘可完成核心循环：钓鱼（空格/F）、潜水（WASD）、切屏（B/F/V/H/C）、变速（1/2/4）已可键盘；**拾荒与建造落位仍必须指针**（无一键打捞、无键盘选格）。
  验证：拔掉鼠标走通「捡资源→建小屋→交订单」。
- [ ] **P1** 色盲友好：状态条/仓库已有文字，但海面漂浮物仍是纯色圆点 + 稀有金圈，无形状/图标区分。
  验证：灰度截图区分木/塑料/蓝图漂浮物。
- [ ] **P2** aria 覆盖与触控目标：状态条有 `aria-label`、toast 有 `role="status"`，但按钮 aria 不全、未跑 Lighthouse。
  验证：Lighthouse a11y ≥ 90。
- [x] **P1** 触控可玩三线：潜水虚拟十字键（`data-hold` pointer 长按）、建造两次点击确认、钓鱼/拾荒本就是点按。
  验证：e2e「方向热区能下潜」PASS（与触控同一 pointer 通路）；真机触屏回归待做但实现完整。

## E. 性能（Performance）

- [x] **P0** 渲染循环不重建 DOM：一次建树，每帧只改 text/style/class；`rebuildIf` 按签名重建。
  验证：e2e「空闲 2 秒左面板节点级重建 < 20 次」实测 1 次 childList 变更；滑杆/hover 不闪烁。
- [x] **P0** bench 测真实负载：24×24 木筏、64 座建筑、12 种全类型、30 关 Boss 战。
  验证：`npm run bench` 输出 `buildings: 64`，tick p95 0.021ms / stepSim 0.024ms / battle 0.134ms，全预算内。
- [ ] **P1** 浏览器侧 fps 探针缺失：无 `?fps=1` 或调试面板。
  验证：主场景 40+ 建筑 + 满漂浮物显示实时 fps，低于 30 报警。
- [x] **P1** `tickWorld` 无整状态 `structuredClone`：改为浅拷贝分支；`structuredClone` 只剩 `defaultState` 一处。
  验证：bench 64 建筑下 tick p95 0.021ms << 1ms。
- [x] **P2** 生产构建可用：`npm run build` 通过，JS gzip 49.11kB（< 100kB）。
  验证：R2 实测。注：`engine.js` 兜底动态 import `ui/app.js` 与 main.js 静态 import 并存，vite 告警（无害但该清）。
- [ ] **P2**（新增）邻接/委任扫描防退化：`assignedBonus` 每建筑 `heroes.find`、风暴 `adjacentWalls` 全表过滤，当前量级无感（bench p95 健康），建筑/英雄上限提高前需建索引。
  验证：bench 加「委任密集」场景后预算不破。

## F. 内容密度（Content Density）

- [x] **P0** 升星链路可达：shard 双来源已接——Boss 关首通 `firstClear`（5/10/15/20/25/30 关 → 10/15/20/25/30/40，合计 140）经 `campaign.grant` 真实入库；潜水 wreck 区掉落表含 shard（普通点 w4、沉船舱室 w30）。
  验证：Node 实测六 Boss shard 合计 140；开局阵容（米娅 1 星）第 1 关 2 回合可胜；e2e「升星消耗碎片」PASS。
- [ ] **P1** 居民系统半成：订单轮换已修（`rollOrder` 按 HQ 档位从 `ORDER_POOL` 抽、不连抽同单、数量随 HQ 放大——实测连续 6 单 5 种需求），但**居民恒 1 人**：radio 的「每级招募 1 名居民」只在 perks 文案里，全代码无增员路径；`house.pop` 仅影响心情恢复。
  验证：造广播站居民 +1；多居民各挂订单（`ORDER_RULES.maxOpenOrders`）。
- [ ] **P1** 随机事件未上线：`data/events.js`（海盗/鲨群等表已备好）无任何消费方，`world.event` 恒 null；风暴只扣玩家 hp，对建筑无后果（`wall.guardAdj` 无消费方）。
  验证：加速 10 分钟至少触发一次事件且画面/日志有表现；风暴损坏未加固建筑。
- [ ] **P1** 建筑职能表驱动缺口：`sim.js` 仍硬编码产率，不读 `BUILDINGS.output/input/converts/adjacency/upgradeGrowth/upgradeExtra`。后果实测：still 不产盐（表里 salt 0.006）、salvage 不产废铁（表里 scrap 0.01）、farm 不耗淡水、workshop 在 sim 造绳索而表里是「浮木+废铁→工具」——**tool 资源全游戏无来源**（幸而 `upgradeExtra` 也未接线才没成死路）、fish_plant 配方与表不符、邻接加成全未实现、升级成本恒定不随等级涨。
  验证：sim 改读表后逐一对照 `BUILDINGS` 字段生效；tool 有产出且围栏高级升级消耗它。
- [ ] **P2** 鱼类图鉴半成：数据层完整（`resolveHook` 记录 codex、「图鉴 +1」日志、`fishCodex()` 现成），但无图鉴屏；`FISH[*].firstCatch` 首钓奖励未接线；`xp` 字段未读（写死 6/12）。
  验证：图鉴屏显示 18 鱼已解锁/剪影；首钓发 coins/diamonds。
- [ ] **P2** 货币闭环缺半：coins/diamonds 有多路获取（订单回礼、关卡、首通），但全游戏无一处消费（`rg "coins -"` 零结果）。
  验证：完成一次用 coins 的交易（如商栈/加速/招募档）。
- [x] **P2** 关卡多样性：六 Boss 机制各异（撕咬 burst / 拖锚 hook / 挽歌 heal / 横扫 aoe / 锈甲 taunt / 潮涌 burst 强化），`mechanics` 战前文案入 intro；杂兵曲线经真实仿真校准，10 关起 5 敌编队（21/30 关满编）。
  验证：stress 逐关扫描全过；打 5/10 关战报出现独有技能行。

## G. 原作还原度（《疯狂水世界》Fidelity）

- [x] **P1** 七位预设英雄技能全实现：嘲讽/连珠/治疗/AOE/爆发/铁钩/酒劲七 kind 走统一 `planFor`（星级门槛 + skill.value），连珠段数读 `value`。
  验证：单测 + 战报技能行；见下条酒劲实测。
- [x] **P2** 微醺之龙「酒劲」生效：每行动叠层（上限 2+星级），层数换攻击与减伤。
  验证：Node 实测 3 星出「酒劲上到第 N 层」×3，1 星被 star:2 门槛拦截（无层数日志）。注：`data/heroes.js` 注释「现行未实现」已过时，且数据口径（每 period 回合 ×(1+value) 叠 3 层）与实现（每行动 atk +value/3/层）有漂移，收契约时对齐。
- [ ] **P1** 5v5 半成：上限 5 已强制（`STAGE_RULES.teamCap` + battle `MAX_SIDE`，超编截断实测生效）、跳过按钮已有（出战即结算、跳过只影响播放，结果天然同 seed）；但**无阵容取舍 UI**——`teamOf` 按名单序取前 5，`heroes/lineup.js` 的 `selectLineup/readyHeroes`（战力排序+保前排+排伤员）无人调用，前/后排不可选。
  验证：拥有 6+ 英雄时可勾选出战 5 人并调整前后排；伤员不可选。
- [x] **P0** 战斗纯函数可复现：同 seed 字节稳定；重试盐已接（`hashSeed(seed:stage:attempts)`，败 +1 胜清零）。
  验证：单测 + stress 3840 场同输入 0 错配（digest `4f427f…`）。
- [ ] **P1** 科技解锁仍挂玩家等级：`build.js` 只读 `UNLOCK_LEVEL`（player.level），`UNLOCK_HQ` 表（含「不建 HQ 视为 0 级」的原作约束）与 `WEATHER_SCHEDULE`（HQ 分档天气）均无消费方。
  验证：不建 HQ 只有 hq 可建；HQ 升级扩解锁列表；开荒期不出海啸。
- [x] **P1** 昼夜（4 分钟/天）+ 五档天气改变海面颜色与产率，夜晚加暗。
  验证：单测 + `WEATHERS[*].prod/salvage` 在 sim/salvage 生效。注：新天气轴（hunger/thirst/durationSec/warnSec/stillBonus/quip）仍未消费，风暴无预警窗口。
- [x] **P2** 「老大」口吻覆盖主要交互：toast/日志/指引/战报横幅全线台词化（交单、天气、离线、升星、潜水、战败 quip 轮换）。
  验证：e2e 走查各屏截图。

## H. 隔离性（Isolation）

- [x] **P0** 独立目录 `games/crazy-water-world`，独立 package.json/lock，零跨界 import。
  验证：`rg "from ['\"](\.\./)*\.\./\.\./" src` 零结果；子目录独立 `npm install && npm test` 可跑（R2 实测）。
- [x] **P0** 独占端口 4174（strictPort）。
  验证：R2 实测 dev server 4174 HTTP 200。
- [x] **P1** probe 隔离检查为真实断言：`realpathSync(cwd) === realpathSync(gameRoot)`，恒真式已删。
  验证：读 `scripts/probe.mjs` 第 15–17 行；输出带 `cwd=` 证据。
- [ ] **P2** Google Fonts CDN 外链仍在（`index.html` preconnect + css2 两族字体），断网阻塞风险低（display=swap）但未自托管。
  验证：离线模式刷新无阻塞请求、字体退化可接受。

## I. 工程门槛（Gates）

- [x] **P0** `npm test` 全绿。
  验证：R2 实测 4 文件 17 用例全过。
- [x] **P0** `npm run probe` 全绿。
  验证：R2 实测 7/7 PASS（隔离断言已真测，本绿有效）。
- [x] **P1** `npm run bench` / `npm run stress` 退出码 0 且负载真实。
  验证：R2 实测 bench 64 建筑全预算内；stress 24×24 密铺 + 30 关 × 128 seed 扫描 + 3840 场确定性 0 错配。
- [ ] **P1** UI 自动化冒烟未入门禁：`src/ui/e2e/`（smoke 36 断言 + fresh 11 断言，R2 实测全过）依赖手动 dev server + `npm i --no-save playwright-core` + 本机 Chrome，不在 `npm test` 里，一键回归缺位。
  验证：`npm run test:ui` 一条命令跑通（自起 dev server），或最小 jsdom 冒烟入 vitest。
- [ ] **P1**（新增）战斗快照与三向断言不足：`tests/combat.test.js` 仅 2 用例（stringify 幂等 + 招募/委任/升星基线）。缺：黄金战报快照（锁 log 全文）、技能星级门槛逐英雄断言、铁钩钩后排断言、委任互斥/伤病三向断言（`applyBattleInjuries` 全套逻辑零测试且零消费方）。
  验证：新增快照测试；改 rng 消费顺序时快照必须红。
- [ ] **P2**（新增）契约漂移收口：`STAGE_RULES.seedFormula` 文案（"seed + stage*99"）与实现（hashSeed 三元组）不符；`combat/battle.js` 导出的 `battleSeed` 与 `ui/screens/campaign.js` 私有 `battleSeed` 公式不同（后者才是线上行为）；双 `DIVE_ZONES`（见 A 节）。
  验证：一处定义、多处引用，文档与代码一致。
