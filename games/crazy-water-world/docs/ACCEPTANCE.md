# 验收记录

由 Fable-4 在各轮回写。未验收项保持空复选框。

## Round 1（SOTA 差距审计 · claude-fable-5-thinking-xhigh）

审计基线：分支 `cursor/crazy-water-world-c895`，提交 `019b230`。
方法：全量读码 + `npm test` / `probe` / `bench` / `stress` / `build` + Node/jsdom 复现脚本。未改动任何源码与测试。

### 1. 工程门槛实测（全部退出码 0）

| 命令 | 结果 | 备注 |
| --- | --- | --- |
| `npm test` | 绿：3 文件 9 用例全过 | combat 确定性、放置规则、探索三线纯函数 |
| `npm run probe` | 绿：5/5 PASS | 但 `isolation path` 检查是 `|| true` 恒真，属虚测 |
| `npm run bench` | 绿：tickMs 0.019 / spawnMs 0.002 / battleMs 0.049 | 但 `buildings: 0`，负载虚测（见红4） |
| `npm run stress` | 绿：placed 12 / raft 16×15 / 2000 tick 后 hp>0 | placed 仅每类 1 座，非 40+ |
| `npm run build` | 绿：JS 30.6kB（gzip 12.6kB） | 生产构建可用 |

### 2. 已绿项（可信）

- 隔离性：独立 npm 工程、独占 4174 端口、`rg "from ['\"](\.\./)*\.\./\.\./" src` 零跨界 import、不碰仓库根。
- 战斗确定性：同 seed + 阵容 `toEqual` 字节稳定；嘲讽/治疗/AOE/爆发/铁钩/连珠六种技能在战报日志中真实触发。
- 放置规则纯函数：越界/重叠/唯一 HQ 拒绝且给 reason；`footprint` 支持旋转；升级/扩建扣资源。
- 存档基线：4 秒自动存档 + 标题屏「继续漂流」，刷新不丢（正常档）。
- 昼夜 + 五档天气：产率/拾荒率/伤害/天空色随天气变化，夜晚画面加暗。
- 全中文 UI、M 静音、1/2/4 变速、Esc 返回；数据密度基线达标（12 建筑 / 7 英雄 / 6 鱼 / 30 关 / 16 资源）。

### 3. 红项与复现步骤

**红1（P0）钓鱼计时输入失效，半数鱼种不可获取。**
`render()` 每 rAF 帧对 `#left` 做 `innerHTML` 全量重建，`#timing` 滑杆每帧被重置为 50。
复现（jsdom）：`render(root, store)` → `#timing.value = '30'` → 再 `render` → 值回到 50、元素已是新实例（实测输出：`同一元素? false | 重渲染后滑杆值: 50`）。
后果实测：时机恒 0.5 时 6 鱼种只有 sardine/mackerel/clown 的窗口含 0.5；tuna、angler（唯一钓鱼蓝图来源）、boot 永不可命中。且 UI 直接把窗口数字亮给玩家，无节奏条无技巧。

**红2（P0）潜水是「盲玩文字游戏」。**
`paintSea` 无 dive 分支，潜水时 canvas 仍画木筏海面；鲨鱼（2 条）与资源点（3 个，含蓝图）位置对玩家不可见，只有一行「氧 X · 深度 X · 战利品 X」。`diveStep` 在渲染循环里以硬编码 `dt=0.032` 步进、`diveInput` 每帧清零，移动依赖键盘自动重复，触屏完全无法操作。
复现：造潜水船坞（需 4 级 + wood16/scrap10/plastic8）→ 潜水屏点「下潜」→ 按 WASD 观察：画面无任何潜水表现，移动一顿一顿。

**红3（P0）升星永久死路。**
`starUp` 消耗 `shard`（星级×10），但全代码库 `shard` 只有消耗无产出（关卡奖励是 hourglass+badge，钓鱼/潜水/拾荒/订单均不掉 shard）。
复现：`rg shard src/` 仅命中 resources 定义与 roster 消耗两处；新档无论怎么玩，英雄屏「升星」永远无效。

**红4（P0）bench/probe 双虚测。**
`bench.mjs`：初始 wood=24，`expandRaft` 第一次花 21 wood 后连续 7 次静默失败，随后 hq/fish_chair/still 全因资源不足放置失败 → 实测 `buildings: 0`，报告的 tick 耗时是空木筏；清单声称的「建筑 40+」门槛从未被测过，且 Node 纯函数耗时与 60fps 渲染无关。
`probe.mjs`：`ok("isolation path", !cwd.endsWith("workspace") || true)` 恒真。
复现：`npm run bench` 看 `"buildings": 0`；Node 单跑 expand×8 实测仅成功 1 次、hq 放置 false。

**红5（P0）无障碍三连缺。**
(a) `settings.reduceMotion` 无任何 UI/按键入口（canvas 已支持该开关，纯粹没门）；(b) 载入存档后 `muted` 不同步——`setMuted` 只在按 M 时调用，静音玩家刷新后音效恢复出声；(c) 三条状态条无文字标签，仅绿/蓝/红色相区分，色盲不可辨；canvas 拾荒无键盘替代。
复现：全局 `rg reduceMotion src/` 无 setter；静音→刷新→点启航听到 blip；看 `#meters` 的 HTML。

**红6（P1）旧档缺字段导致天气永久锁死。**
`loadState` 直接 JSON.parse 顶层覆盖，无深合并/迁移。缺 `world.weatherTimer` 的档 `weatherTimer -= dt` 得 NaN，`NaN <= 0` 恒 false，天气永远 clear。
复现（Node 实测）：删掉默认档的 `weatherTimer` 跑 `tickWorld(s, 5)` → 输出 `weatherTimer: NaN`。

**红7（P1）建造手感缺半。**
无拖拽（`moveBuilding` 导出但 UI 零调用）、无旋转入口（UI 恒 rot=0）、无幽灵预览、放置失败静默（`canPlace().reason` 被丢弃）、菜单不显示成本、无拆除、邻接加成完全未实现（GDD 第 5 节明确要求）。升级/委任藏在 Shift/Alt+点击，README 未写。
复现：建造屏点已占用格 → 无任何反馈；`rg moveBuilding src/ui/` 零结果。

**红8（P1）战斗表现层缺失。**
出战即瞬间结算，`BattleResult.log` 只取最后一行进日志；无 5v5 阵容选择（heroes 全量上阵）、无战斗播放/跳过（GDD 要求 10 秒后可跳过）、微醺之龙 `buff` 技能无实现分支、`multishot` 的 `value: 2` 未使用（写死 ×1.15）。
复现：招 7 英雄打关卡，无任何取舍与观战画面。

**红9（P1）经营纵深断层。**
居民恒 1 人（radio 不招居民、house 的 `pop` 字段无消费方）；订单第二单起永远 `meal×1`（`fulfillOrder` 硬编码）；workshop 在 `tickWorld` 无产出规则；coins/diamonds/salt 无任何用途；`world.event` 恒 null（无海盗/鲨鱼事件）；无离线补算（`idleSince` 只加不用）；软目标（HQ8 级/30 关/浮动城邦）无追踪 UI；解锁用 `player.level` 而非 GDD 说的 HQ 等级；`seaSeed` 定义后未使用。

**红10（P2）杂项。**
拾荒点击只按 x 距离判定（点同一竖列任意高度都能捡，任何屏都能点）；Google Fonts CDN 外链断网退化；每帧 innerHTML 重建 4 容器造成 DOM churn 与 hover 闪烁（与红1同根因）；无 beforeunload 落盘（最多丢 4 秒）；无 favicon/manifest。

### 4. 给后续轮次的优先修复序

1. **UI 渲染架构**：面板/滑杆/dock 改为按需更新（state diff 或屏幕切换时重建），一举修复红1输入失效、红10 DOM churn，为一切手感打底。
2. **钓鱼重做成真节奏条** + **潜水 canvas 场景化**（可见鲨鱼/资源点/氧气条、真实 dt、按住连续移动、触控），关掉「三线探索不是空按钮」的最大两个洞（红1/红2）。
3. **shard 获取链路**（建议：Boss 关首通掉落 + 潜水稀有点），打通升星成长闭环（红3）。
4. **bench/probe 去虚测**：bench 给足资源真实放 40+ 建筑再测 tick、probe 隔离断言写真、补 jsdom UI 冒烟测试（红4），否则后续轮次的「全绿」没有公信力。
5. **存档健壮性 + 无障碍入口**：load 深合并默认值/版本迁移（红6）、reduceMotion 可见开关、启动时同步 muted、状态条加文字标签（红5）。
6. 建造手感包（拖拽/旋转/预览/失败提示/成本显示/邻接加成，红7）。
7. 战斗表现层（阵容选择、战报回放/跳过、补 buff 技能，红8）。
8. 经营纵深（多居民与订单轮换、事件系统、workshop 产出、离线补算、目标追踪，红9）。

### 5. Round 1 结论

工程骨架合格（纯函数分层、确定性战斗、隔离性、全套脚本绿），但当前更接近「可测的系统 demo」而非「可玩的 SOTA 网页游戏」：三线探索有两线（钓鱼计时、潜水可视）在真实 UI 里是坏的，成长链（升星）是死路，两个质量门槛（bench 负载、probe 隔离）是虚测。P0 共 6 项红，未达可对外宣称可玩的标准。

## Round 2（合并树复验 · claude-fable-5-thinking-xhigh）

审计基线：分支 `cursor/crazy-water-world-c895`，提交 `4c98f8f`（Round 1 十路全部合入后的整树）。
方法：全量读码 + `npm test` / `probe` / `bench` / `stress` / `build` + 真 Chrome 端到端（仓库自带
`src/ui/e2e/`）+ 自制 Node 复验探针（14 项，脚本在 /tmp，未入库未改 src/tests）。未改动任何源码与测试。

### 1. 工程门槛实测（全部退出码 0）

| 命令 | 结果 | 备注 |
| --- | --- | --- |
| `npm test` | 绿：4 文件 17 用例全过 | combat 幂等、reason 码、旋转落位、探索三线、stepSim 纯度 |
| `npm run probe` | 绿：7/7 PASS | 隔离断言已改真（realpath 比对），本绿开始算数 |
| `npm run bench` | 绿：24×24 木筏 · **64 建筑 · 12 全类型** | tick p95 0.021ms / stepSim 0.024 / spawn 0.006 / battle 0.134，全预算内；负载虚测已修 |
| `npm run stress` | 绿：密铺 + 30 关×128 seed | 3840 场同输入 **0 错配**（digest `4f427faa…`），weatherFinite 等 6 项 checks 全 true |
| `npm run build` | 绿：JS 128.7kB（gzip 49.1kB） | < 100kB gzip；仍有 `engine.js` 动态 import `ui/app.js` 的 vite 告警（无害，待清） |
| e2e `smoke.mjs` | 绿：36/36（真 Chrome + dev 4174） | 六屏走查：节奏条、潜水舞台、委任、升星、战报、静音、动效、无 JS 报错 |
| e2e `fresh.mjs` | 绿：11/11 | 空档新手链：指引→建造预览绿格→HQ 落成→解锁原因提示 |
| Node 复验探针 | 绿：14/14 | 逐条复测 Round 1 红项，明细见 §2/§3 |

### 2. Round 1 红项复验：已翻绿（附实测证据）

**红1（P0）钓鱼计时输入 → 绿。** UI 重做为一次建 DOM + 按需更新，指针状态在 `ctx.ui.fish` 不在
DOM；e2e 实测「一秒后指针仍在跑（面板没被重建）」「空闲 2 秒左面板 childList 变更 1 次」（基线是每帧数千）。
节奏条不泄底：窗口只画高亮区 + 中央完美金条（`windowHidden` 口径），`castLine` 窗口随 tick 漂移
（实测 8 竿 8 个不同窗口），收杆时机 = 指针实时位置传 `resolveHook`，`gradeCast` 三档。蓝图鱼
（灯笼鱼 0.20–0.34）靠技巧可钓。

**红2（P0）潜水盲玩 → 绿。** 潜水有可见舞台（潜水员/2 鲨/资源点稀有金圈/水面收工条/贴脸红圈），
氧气条带百分比文字。真实 dt：按住 1 秒位移实测 18.00 单位（0.05s 子步积分），`ctx.held` 集合按住
连续移动，触控十字键（`data-hold`）同通路。附带发现：直线闭眼下潜 0.9 秒即被鲨鱼咬死——碰撞判定
真实在工作。会话入 `state.explore.dive` 可序列化，切屏冻结回来接着潜。

**红3（P0）升星死路 → 绿。** shard 双来源接通：① Boss 关首通 `firstClear`（10/15/20/25/30/40，
合计 140）经 `campaign.grant` 真实入 `resources.shard`；② 潜水 wreck 区掉落表含 shard。开局阵容
（默认赠送米娅 1 星）第 1 关实测 2 回合胜，第 5 关首通 10 shard 恰好一次升星（星 1→2 需 10）；
e2e「升星消耗碎片」PASS。

**红4（P0）bench/probe 双虚测 → 绿。** bench 真实放置 64 建筑（12 类全覆盖）再测，输出
`buildings: 64` + `buildingsAbove20: true`；probe 隔离断言改为 `realpathSync(cwd) === gameRoot`。
stress 另扫 24×24 密铺、全 30 关 × 128 seed、3840 场字节级确定性。

**红5（P0）无障碍三连缺 → 绿。** ① 顶栏「动效」按钮切 `settings.reduceMotion`，`motion.css` 全动画
包在 `prefers-reduced-motion: no-preference` 内、reduce 时静态替代，canvas 波浪读该开关；② `createApp`
启动即 `setMuted(settings.muted)` 且 `syncHooks` 持续同步，🔊/🔇 可见按钮；③ 状态条带文字标签
「饱食 68 / 口渴 59 / 生命 100」+ `role=meter` + `aria-valuenow`。e2e 三项对应断言 PASS。

**红6（P1）旧档天气锁死 → 绿。** `normalize` 深合并 + 全字段钳域。实测：删 `world.weatherTimer`
载入后 tick 5 秒 `weatherTimer=85`（正常轮转）；脏档 `{seed:"垃圾", tick:-5}` 钳回合法域；
`tickWorld` 另有 `Number.isFinite` 双保险。

**红7（P1）建造手感 → 基本绿。** 放置/移动/升级/拆除四模式、R 旋转、绿红幽灵预览带 reason 标签、
菜单成本 + 「材料不够/需 N 级/已建成」、拆除两次确认退一半、扩建显成本、触控两次点击确认。e2e
fresh「2×2 绿格 / 等级原因提示」PASS。**剩余：邻接加成未实现（归入 R2-1 表驱动）。**

**红8（P1）战斗表现层 → 大半绿。** 战报逐行播放（技能行高亮）+ 跳过 + 胜负横幅 + 双方残血血条；
酒劲 buff 已实现（实测 3 星出「酒劲上到第 N 层」×3，1 星被 star:2 门槛拦截）；连珠段数读
`skill.value`；重试盐 `hashSeed(seed:stage:attempts)` 已接（败 +1 胜清零）。**剩余：无 5v5 阵容
取舍 UI（见 R2-2）。**

**红9（P1）经营纵深 → 部分绿。** 订单轮换修复：`rollOrder` 按 HQ 档位抽池、不连抽同单、量随 HQ
放大——实测连续 6 单出 5 种需求（fillet×2/rawFish×5/freshWater×3/meal×2/rawFish×6）；离线补算全链
接通：`savedAt` 差值→`idleSince`→`settleOffline`（8h 封顶，实测 +1h rawFish 2→38.75，80h 与 8h
等值）；workshop/fish_plant 在 sim 有转化产出；coins 多路获取。**剩余：居民恒 1 人、事件恒 null、
表驱动缺口、软目标 UI（见 R2-1/R2-4）。**

**红10（P2）杂项 → 大半绿。** 拾荒二维命中（渲染/命中共用几何）、DOM churn 根除（同红1）、
`beforeunload` 落盘已加。**剩余：Google Fonts CDN 外链仍在；「点击即捞」在全部六屏生效属故意
设计但与原口径不符（观察项）。**

### 3. Round 2 开局仍开的洞（按优先级，附复现步骤）

**R2-1（P1·最高优）sim/build 不读数据表，Fable-3 的调参是空调。**
`world/sim.js` 硬编码产率，`BUILDINGS.output/input/converts/adjacency/upgradeGrowth/upgradeExtra`
全部零消费。后果实测：still 不产盐、salvage 不产废铁、farm 不耗淡水、workshop 造的是绳索而表里
配方是「浮木2+废铁1→工具1」——**tool 全游戏无来源**（幸而 `upgradeExtra` 也没接线才不构成死路）；
升级成本恒定不随级涨；邻接加成 0 实现。同族：`UNLOCK_HQ`（含「不建 HQ 只能建 HQ」的原作约束）与
`WEATHER_SCHEDULE`/新天气轴（hunger/thirst/fishing/diveO2/stillBonus/durationSec/warnSec）全无
消费方，海啸天禁钓禁潜只停留在文案。
复现：`rg "output|converts|UNLOCK_HQ|WEATHER_SCHEDULE" src/world src/core src/explore` 仅命中
data 定义与注释；对照 `sim.js` 75–115 行的写死 switch。

**R2-2（P1）5v5 只有上限没有取舍。**
`campaign.teamOf = heroes.slice(0, 5)` 按入队顺序取前 5；`heroes/lineup.js` 的
`selectLineup/readyHeroes/heroPower`（战力排序、保前排、排伤员）**零调用**。招满 7 人时后 2 人
永远坐板凳且玩家无法干预，前/后排不可选。
复现：招 6+ 英雄进关卡屏，「我方 5/5」名单不可编辑；`rg "selectLineup|readyHeroes" src/ui` 零结果。

**R2-3（P1）伤病系统整链零消费。**
`applyBattleInjuries/clearHealed/isInjured` 实现完整且合逻辑（阵亡挂 300s 养伤 + 自动离岗），但
campaign 战后**不调用**，UI 无养伤展示，`lineup.isReady` 的排伤员逻辑也因 R2-2 一起悬空。战败无
任何代价（attempts+1 换种子反而是纯收益）。
复现：`rg "applyBattleInjuries" src/ui src/core` 零结果；打输任意关卡后英雄状态无变化。

**R2-4（P1）事件与居民增长未上线。**
`data/events.js`（海盗/鲨群，minStage/minHq/weight 全备）无消费方，`world.event` 恒 null；风暴只
扣玩家 hp，`wall.guardAdj`（邻接减伤 25%）无消费方，建筑永不受损。radio「每级招募 1 名居民」只在
perks 文案里，全代码无居民增员路径（居民恒 1 人，`house.pop` 只影响心情回复）。
复现：`rg "EVENTS" src/ --glob '!src/data/*'` 零结果；4x 速挂机 10 分钟 `world.event` 仍 null。

**R2-5（P1）测试门禁两缺口。**
① 战斗黄金快照未落：`tests/combat.test.js` 仅 stringify 幂等，改 rng 消费顺序不会红；技能门槛/
铁钩钩后排/委任互斥/伤病无逐项断言。② e2e（47 断言全过）不在 `npm test` 内，需手动 dev server +
`npm i --no-save playwright-core`，一键回归缺位。
复现：读 `tests/combat.test.js`（37 行 2 用例）；`npm test` 不含 UI。

**R2-6（P2）契约/双表漂移。**
双 `DIVE_ZONES`：`explore/dive.js`（shallow/reef/wreck/trench，玩法真身）与 `data/dive.js`
（wreck/city/trench，unlock/rareChance 语义）字段互不兼容，UI 玩法走前者、文案读后者，且永远只潜
wreck（无海域选择，深度标尺写死 90）。`STAGE_RULES.seedFormula` 文案与实现不符；`combat.battleSeed`
导出与 campaign 私有实现两套公式（线上是后者）；`data/heroes.js`「buff 未实现」注释已过时且数值口径
与实现有出入；`FISH[*].xp/firstCatch`、`fishCodex()` 图鉴数据层就绪但无 UI。
复现：对照两份 `DIVE_ZONES` 的 zone 集合；`rg "fishCodex" src/ui` 零结果。

**R2-7（P2）零散。** 键盘不能拾荒/建造落位（D-P1）；漂浮物色盲区分靠色相；无 fps 探针；coins 无
消费方；软目标（HQ8/30 关/`cityGoal`）无追踪 UI；Google Fonts CDN；`engine.js` 动态 import 告警；
存档无版本迁移/导出导入。

### 4. Round 2 必须关掉的 5 项（验收官口径）

1. **表驱动接线**（R2-1）：sim/build/explore 改读 `BUILDINGS`/`UNLOCK_HQ`/`WEATHER_SCHEDULE`/新
   天气轴/`FISHING_RULES.weatherField`，tool 有来源、邻接生效、海啸禁钓禁潜。这是 Fable-3 全部
   数值工作的生效前提。
2. **5v5 阵容取舍 UI**（R2-2）：接 `selectLineup`/`readyHeroes`，出战 5 人可勾选、前后排可调。
3. **伤病接线**（R2-3）：campaign 战后调 `applyBattleInjuries`，UI 展示养伤倒计时并禁出战/禁委任。
4. **事件 + 居民增员**（R2-4）：`EVENTS` 表接 tick（海盗/风暴有建筑后果），radio 按级招居民、多
   居民多订单。
5. **测试门禁补强**（R2-5）：战斗黄金快照 + 技能门槛/铁钩/委任/伤病断言；e2e 一键化（`test:ui`
   自起 dev server）纳入回归。

### 5. Round 2 开局结论

**P0 已全绿：Round 1 的 6 项 P0 红全部翻绿且经运行时证据复验，游戏首次达到「可对外宣称可玩」线。**
三线探索手感真实（节奏条、可躲鲨鱼的潜水舞台、二维拾荒）、升星链路通、五门 + 47 项浏览器断言 +
14 项复验探针全绿，且 bench/probe 去虚测后这些绿开始有公信力。距 SOTA 的差距全部集中在 P1：
数据表接线（最大单项，决定 Fable-3 调参是否生效）、5v5 取舍、伤病/事件/居民三条纵深线、测试门禁。
无新增 P0。性能侧无回归（64 建筑 p95 全预算内），唯一结构性风险仍是邻接/委任的全表扫描，建索引
即可，未到需立刻处理的量级。
