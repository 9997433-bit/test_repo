# Round 3 SOTA 验收（fable-1 · 最终架构）

MODEL_SLUG: claude-fable-5-thinking-xhigh

**当前判定：NO-GO。** 除 Round 2 简报列出的残留外，本轮交叉核验在真实 UI 链路上实锤了一个**比经济更优先的进度阻断 P0**（双编排路径 + 两套 campaign 形状互相踩踏），浏览器里游戏会永久卡在第 1 关。以下全部结论来自实跑复现（Node 走与浏览器完全相同的 `createBoundGame() → createLiveGame()` 装配），不是静态推断。

基线核验（本机实跑，全绿）：`node tests/run.mjs` 6/6 PASS；`node js/forge/selfcheck.mjs` 15/15 PASS；`node bench/economy-sim.mjs` 输出 `METRIC economy reached_stage=9 … pass=false`。

---

## A. 本轮新发现（Round 2 简报未覆盖）

### A0（P0 · 进度阻断）：双编排路径互相踩踏，真实 UI 卡死第 1 关

**根因**：同一批动词现在有两套实现——`core/api.js` 的 `installGameApi()`（挂在 runtime 上）与 `ui/live/liveGame.js` 的本地 fallback。`liveGame` 的 `override_()` 优先委托 runtime 动词（生产装配下恒成立），但它自己的 `ensureShape()`、`campaign()`、`arena()` 仍按**另一套** state 形状读写：

- core 权威形状（`core/state.js hydrate`）：`campaign.cleared` 是**数字**、`campaign.stars` 是 map；
- liveGame 本地形状：`campaign.cleared` 是**对象 map**、进度看 `highestStage`。

`liveGame.ensureShape()` 第 111–112 行：`if (typeof s.campaign.cleared !== 'object') s.campaign.cleared = {}` —— 每次界面重绘（`campaign()/previewForge()/arena()/peekIdle()` 都会触发）把 core 刚写入的数值型 `cleared` 抹成 `{}`。而 core 的 `challengeStage` 前置门是 `num(state.campaign.cleared, 0)`，`num({},0) = 0`。

**复现输出**（走 `createBoundGame + createLiveGame`，与浏览器同路径）：

```
--- 打第 1 关 ---
stage_1 ok/winner: true player
战后 campaign.cleared = 1  stars = {"stage_01":3}
--- 模拟一次 UI 重绘（live.campaign() 会跑 ensureShape）---
live.campaign() = {"cleared":1,"stars":{}}
重绘后 campaign.cleared = {}
--- 打第 2 关 ---
stage_2 ok: false error: 前置关卡未通关
```

**连带断裂**（同根因）：

1. **星级恒 0**：core 把星写进 `campaign.stars`，`liveGame.campaign()` 却从（已被抹掉的）`campaign.cleared` map 里读，`views/campaign.js:63` 永远拿到 0 星。
2. **首通提示失效**：core 的 `challengeStage` 把 `firstClear` 放在返回值**顶层**，`views/campaign.js:140` 读的是 `res.result.firstClear`（liveGame 本地实现的形状）→ 首通 toast 永不弹。
3. **Round 2 的战斗演出在真实链路整体退化**：core 的 `viewBattle()` 把事件 `t` 改名 `type`、丢弃 `players/enemies`、预转义文本；`fx/battleStage.js:36` 的 `isEngineResult()` 检查 `e?.t` → 恒 false → 弹道 / KO / 血条 / 飞币全部退化为 mock 式播放。Round 2 验收过的 FX 实际上在生产路径没在跑。

**为什么 Round 2 没发现**：`tests/run.mjs` 只测 core 原语与 `createBoundGame` 动词，`bench/economy-sim.mjs` 用原语自拼循环，两者都没有经过 `liveGame` 这一层。**Round 3 测试链必须补 live-path 集成测试（见 F-1）。**

### A1（P1 · 所见非所打）：竞技场两套对手池

UI 列表来自 `liveGame.rawOpponents()`（种子 `${seed}:${bucket}:${rating}` + `createCombatRng`，`count:20, basePower:max(600,myPower)`）；点击挑战委托 core 的 `arenaFight`，core 用**另一套**种子（`normalizeSeed(seed:arena:day:lastRefreshAt)`）和缺省 opts 重新生成。id 均为位置型 `arena-N`，所以战斗能打响，但同 id 不同人。复现输出：

```
UI 看到  : arena-1 柳朔风   power= 854
core 实战: arena-1 慕容朔风 power= 860
```

竞技战报同样走 core 的 `viewBattle` → FX 退化同 A0-3。

### A2（P2 · 冗余但无害，须清理）：存档镜像与挂机排水已过时

Round 2 时 `serialize()` 不认识 `state.forge`，liveGame 用 `flags.forgeState` 镜像绕行；现在 `core/state.js serialize()` 第 279 行已直接白名单化 `forge`，镜像成了每次 commit 的双份深拷贝。`drainCorePending()` 同理：组合根已传 `idleResources:false`，core 的 pending 恒为 0。两者删除即可（挂机记账本身已收敛为 forge 单账本，需测试锁死，见 F-1）。

---

## B. Round 2 残留核验（逐条实证）

| # | 残留项 | 现状（实测） | 结论 |
| --- | --- | --- | --- |
| B1 | 经济 60min 只到 9 关 | `bench/economy-sim.mjs`：积极策略 60min 到第 **9** 关，战力 498，等待 24min，体力剩 4。1–20 关体力合计 **72**，开局 60 + 60min 回复 10 = **70** | 未修，且**战力墙比体力墙更硬**：第 20 关精英门 `powerGate=1718`、推荐 2386，光加体力到不了（见 E-2） |
| B2 | 栏位解锁三处漂移 | core `[0,3,8,16,28]`（state.js:37，比 R2 简报又漂了一次）；combat `[1,3,8,15,25]`（lineup.js:29）；balance `[0,2,4,9,14]`（balance.js:372） | 未修，三表各不相同 |
| B3 | shard 未进 RESOURCE_IDS | `SHARD_RESOURCE` 6 个 id 齐备，40 关掉落表全部含 shard；`addResource` 无白名单、`hydrate` 保留未知资源，**不丢数值**；但 `RESOURCE_IDS`（state.js:14）与 `defaultResources()` 均未登记 | 半修：账不丢，登记缺失（影响归一化/展示口径） |
| B4 | 双挂机路径 | 结构已收敛：`idleResources:false` + forge 单账本 + `staminaAt` 锚点对齐；残留 A2 的两处冗余 + 无「只入账一次」测试 | 基本修复，缺测试锁死 |
| B5 | 无 WebAudio | 全仓 `rg -i audio` 仅命中 `flags.sound: true`；设置页只有动效与数据来源 | 未修 |
| B6 | STARTER_KIT | `balance.js:352` 已定义（360 铜钱/60 精铁，selfcheck 验证正好 3 锤），`STAMINA_RULES.startFull:true` 也在；但 core `defaultResources()` 仍硬编码 200/30/60，**未消费** | 数据侧就绪，core 未接线 |
| B7 | 扫荡 | `SWEEP_RULES`（balance.js:357）、`sweepUnlockClears`（stages.js:326）、`campaign.daily.sweep` 计数器（state.js:494）都在；**动词、UI 入口全无** | 未修 |
| B8 | 无 mock 成功路径 | `gameAdapter` 探测失败时**静默**退回 mock（仅设置页一行小字），玩家可在假数据上「成功」游玩 | 需常驻横幅 + 动词点名（见 R3-P8） |

---

## C. Round 3 裁定

冻结裁定全文见 `ARCHITECTURE.md` 新增 `## Round 3 补丁`（R3-P1…P8）。一句话版：

1. **单编排权威**：`core/api.js` 是唯一会改 state 的编排层；liveGame 删除全部本地编排 fallback 与 `ensureShape()`，降级为「严格委托 + 纯只读视图模型」。
2. **战报形状以引擎形状冻结**（liveGame `normalizeResult` 的现状），core 的 `viewBattle` 改为输出该形状；转义责任移到 UI 渲染层（组件本来就用 text 节点）。
3. **campaign 形状冻结**：`cleared:number / stars:map / highestStage:number`（hydrate 现状），任何层不得再造第二种形状。
4. **权威表统一**：栏位解锁唯一权威 = `balance.SLOT_UNLOCK_STAGES [0,2,4,9,14]`，经组合根注入 core 与 combat；shard 六 id 进 `RESOURCE_IDS`。
5. **开局即满体力 + STARTER_KIT**，经 `createGame(options.starter)` 注入（core 不 import data 的约束不破）。
6. **新增动词** `sweepStage(stageId, times=1)`，并把 `setWeaponLock / refreshArena` 补进 core/api.js。
7. **WebAudio** 由 opus-4 落地 `js/ui/audio.js`（合成音，无外部资产）。
8. **无 mock 成功路径**：正常 boot 必须 `source==='core'`；任何 mock 兜底必须带常驻可见横幅；`gameAdapter` 点名单扩到编排动词全表。

---

## D. GO / NO-GO 清单（合流前逐项打勾，任一不过即 NO-GO）

| # | 验收项 | 命令 / 方法 | 通过标准 |
| --- | --- | --- | --- |
| G1 | 核心测试链 | `node tests/run.mjs` | 全绿，且**新增**以下用例全部在列：live-path 集成（见 F-1）、空体力拒绝、首锻保底、pity 存档往返、challengeStage 进度/星级/首通、挂机只入账一次、三表一致、扫荡 |
| G2 | 锻造自检 | `node js/forge/selfcheck.mjs` | ≥15 项全绿（含既有 STARTER_KIT 3 锤断言） |
| G3 | 经济达标 | `node bench/economy-sim.mjs`（改为驱动 `createBoundGame()` 动词，见 F-2） | `METRIC economy` 积极策略 **40–60 分钟内到第 20 关 pass=true**；对照组「无操作 60min」到达关卡 **<10**（防止一刀放水） |
| G4 | 性能预算 | `node bench/run.mjs` | 战斗 500 次 <500ms、锻造 1000 次预算内（维持 R2 水位） |
| G5 | 进度阻断回归 | G1 中 live-path 用例：打 1 关 → 调 `campaign()` 重绘 → 打 2 关 | 第 2 关 `ok:true`；重绘后 `typeof state.campaign.cleared === 'number'`；`campaign().stars` 非空 |
| G6 | 竞技一致性 | G1 中 live-path 用例：`arenaOpponents()[0]` 与 `arenaFight()` 实战对手 | 同 id 同名同战力（单一对手池） |
| G7 | 战斗演出真实路径 | live-path 用例断言 `challengeStage().result`：`timeline[0].t` 存在、`players/enemies` 为数组、`skillNames` 为 map；浏览器冒烟目视弹道/KO/飞币 | 引擎战报形状不缺字段；FX 走引擎分支 |
| G8 | 3 分钟新手闭环 | `python3 -m http.server 4173 --directory games/bingqi-wangzhe`，新档冒烟 | 开局 3 锤即锻→上阵→过 1–2 关→星级点亮→首通 toast→扫荡入口出现，全程无 mock 横幅 |
| G9 | 音效 | 冒烟：设置页开关 + 锻造锤击 / 克制暴击 / 胜负音 | 开关持久化到 `flags.sound`，关档重开仍生效；关闭后静音 |
| G10 | 无 mock 成功路径 | 冒烟 + `rg -n "createMockGame" js/ui`（mock import 只允许出现在 gameAdapter 兜底分支与 `?demo=1`） | 正常 boot `window.__BQWZ__.game` 在场且界面 `source==='core'`；人为破坏一个模块后重载，页面出现**常驻**「演示数据」横幅 |
| G11 | 文档对齐 | 人工核对 `README.md` / `PROGRESS.md` | 启动方式、扫荡/音效/开局礼包描述与实现一致 |

---

## E. 各实现代理必须改的文件级指令

### E-1 opus-1（core/** + main.js）——本轮最重

1. **`js/core/api.js`**：
   - `viewBattle()` 重写为引擎战报形状（R3-P2 字段表）：保留 `timeline` 原始事件（含 `t`）、`players`、`enemies`、`bonds`、`skillNames`（从注入的 `data.SKILL_BY_ID` 构建）、`stats/durationMs/engineVersion`，`survivors` 为数字；**删除 `escapeHtml/namedSkills` 预处理**（UI 用 text 节点渲染）。`challengeStage` 把 `firstClear` 同时放进 `result.firstClear`。
   - `challengeStage` 的 `enemyWaves` 注意与 combat 期望的形状对齐（liveGame 现在包了一层 `{name, units}`，统一后以 combat 实际签名为准，写进测试）。
   - 新增动词：`setWeaponLock(uid, locked)`（委托 `forge.setWeaponLock` + commit）、`refreshArena()`（更新 `arena.lastRefreshAt`）、`sweepStage(stageId, times=1)`（按 R3-P6：需首通、耗体力同关、`campaign.daily.sweep` 前 `SWEEP_RULES.freeDaily` 次免体力、掉落用 `game.rng` 实抽 `stage.dropTable`、即时入账、返回 `{ok, loot, times}`）。
   - `generateArenaOpponents` 的种子推导与 opts（`count/basePower`）收编 liveGame 现行实现（含 30 分钟 bucket 缓存键），成为唯一对手池；`arenaOpponents()` 输出补 `counterHint/squad` 等 UI 字段（照抄 liveGame 的 decorate 逻辑）。
   - `campaign()` 动词返回 UI 形状 `{cleared:number, stars:map}`（而不是裸 state）。
2. **`js/core/state.js`**：
   - `RESOURCE_IDS` 追加 `shardCommon/shardUncommon/shardRare/shardEpic/shardLegendary/shardMythic`；`defaultResources()` 补 0 值。
   - `createInitialState(options)` / `createGame(options)` 接受 `options.starter = {coin, iron, stamina}` 与 `options.lineupUnlockStages`，缺省维持现值；`LINEUP_UNLOCK_STAGES` 常量改为与 balance 同值 `[0,2,4,9,14]` 并允许被注入覆盖（`unlockedLineupSlots` 读实例配置）。
3. **`js/main.js`**：`createBoundGame()` 注入 `starter: { ...data.STARTER_KIT, stamina: data.STAMINA.max }`（startFull）与 `lineupUnlockStages: data.SLOT_UNLOCK_STAGES`——测试与 bench 都走 `createBoundGame`，注入即全链一致。

### E-2 opus-2（forge/** + data/**）——经济收敛

1. **`js/data/balance.js` / `js/data/stages.js`**：B1 的硬墙是战力不是体力。60 分钟实跑战力 498 vs 第 20 关 gate 1718，需组合调参（改后必须让 G3 双阈值同时成立，selfcheck/G2 仍绿）：
   - 把 10–20 关的 `powerGate` 系数从当前推荐值比例下调（例如 gate ≈ recommend×0.55），或压平 10–20 段 recommendPower 曲线；
   - 提高 1–15 关首通/重复掉落中的精铁与银矿（支撑更高锻造/强化频次）；
   - 放缓 `enhanceCostFor` 中段成本曲线或提高强化面板收益。
   以上是杠杆清单不是全做清单——以 G3 的 sim 结果为准迭代，每次调参跑一遍 `bench/economy-sim.mjs`。
2. **`js/forge/selfcheck.mjs`**：新增断言「三表一致」：`balance.SLOT_UNLOCK_STAGES` 与 core、combat 实际生效表逐项相等（core 侧经 `createBoundGame` 取 `unlockedLineupSlots` 行为验证）；新增「shard 全部在 RESOURCE_IDS 内」。
3. 扫荡的数值出处只认 `SWEEP_RULES` 与 `stage.dropTable`，不新造表。

### E-3 opus-3（combat/**）——最小改动

1. **`js/combat/lineup.js`**：`SLOT_UNLOCK_STAGES` 从 `[1,3,8,15,25]` 改为 balance 权威值 `[0,2,4,9,14]`（combat 不 import data，常量同表 + 测试锁死即可）；`unlockedSlots()` 语义与 core `unlockedLineupSlots` 对齐（0 = 开局即有）。
2. **`js/combat/engine.js`**：`timeline` 事件的 `t`/`subtype` 字段冻结不动（R3-P2 依赖）；`generateArenaOpponents(state, rng, opts)` 签名不变（`toRng` 已兼容种子/rng 双形态）。

### E-4 opus-4（ui/** + index.html + README）

1. **`js/ui/live/liveGame.js`**（大删）：
   - 删除 `ensureShape()`、`flags.forgeState` 镜像、`drainCorePending()`、`opponentCache` 与 `rawOpponents()`；
   - 删除全部本地编排实现：`challengeStage/arenaFight/setLineup/clearSlot/forgeWeapon/enhanceWeapon/dismantleWeapon/setWeaponLock/collectIdle/refreshArena` 一律 **严格委托** `runtime.*`，缺失即 `throw new Error('[bqwz/ui] 缺少编排动词 <name>')`（由 gameAdapter 捕获转横幅，杜绝静默 mock）；
   - `campaign()/arena()/arenaOpponents()/bonds()` 改为调 runtime 同名动词；保留纯只读视图职责（`viewWeapon/stages/regions/codexEntries/staminaEtaSeconds/forgeStages` 等，或与 opus-1 商定后也下沉——以「同一形状只有一个构造点」为红线）。
2. **`js/ui/gameAdapter.js`**：`REQUIRED` 增加 runtime 编排动词点名（`ORCHESTRATION_VERBS` 全表 + `setWeaponLock/refreshArena/sweepStage`）；探测失败或接线抛错时，除设置页标签外在 `app.js` 外壳顶部渲染**常驻**「演示数据（逻辑层未接入）」横幅。
3. **新文件 `js/ui/audio.js`**：WebAudio 合成音（锤击 / 克制暴击 / 胜 / 负 / 按钮点击五种即可），`AudioContext` 首次用户手势惰性创建；读 `game.state.flags.sound`，设置页（`views/bag.js`）加开关并经 runtime 落档。在 `views/forge.js`（锤击）、`fx/battleStage.js`（克制/KO）、`components/feedback.js`（胜负）挂钩。
4. **`views/campaign.js`**：首通 toast 改读统一后的 `result.firstClear`；已通关行加「扫荡」按钮（调 `game.sweepStage`，弹飞币 + loot toast）；新档首进试炼页给一次性引导 toast（3 分钟闭环）。
5. **`README.md`**：补扫荡、音效、开局礼包（360/60/满体力）与 G8 冒烟步骤。

### F. 探针代理（gpt-sol）

**F-1 gpt-sol-1（tests/**）**：`tests/run.mjs` 新增（全部经 `createBoundGame()`，其中 live-path 用例再包一层 `createLiveGame`）：
1. live-path 集成：锻造→上阵→过 1 关→**调 `campaign()` 模拟重绘**→过 2 关成功；断言 `typeof state.campaign.cleared === 'number'`、星级/`result.firstClear`、战报含 `timeline[].t + players + enemies`；
2. 竞技一致性：`arenaOpponents()[0]` 与 `arenaFight` 返回的 `foe` 同 id 同名同 power；
3. 空体力：体力清零后 `challengeStage` 返回 `{ok:false}` 且不消耗次数；
4. 首锻保底 + pity 存档往返（把 selfcheck 关键断言收编进主测试链）；
5. 挂机只入账一次：`tick()` 若干次 + `collectIdle()` 两连发，第二次 `ok:false` 或 loot 全 0；
6. 三表一致 + shard ∈ RESOURCE_IDS；
7. `sweepStage`：未首通拒绝、免费次数、体力扣减、掉落非空可复现。

**F-2 gpt-sol-2（bench/**）**：`economy-sim.mjs` 改为驱动 `createBoundGame()` 的动词（`challengeStage/forgeWeapon/enhanceWeapon/collectIdle/sweepStage`），策略加入扫荡；输出保持 `METRIC economy` 行，判定阈值按 G3；`bench/run.mjs` 维持性能预算断言。

---

## G. 合流顺序建议（父编排器）

opus-1（单权威 + 注入）→ opus-3（栏位常量，独立可并行）→ opus-2（调参需要 opus-1 的注入先就位才能跑真实 sim）→ opus-4（liveGame 大删依赖 opus-1 动词齐全）→ gpt-sol-1/2 收口。每步合流后跑 G1–G4，全绿再进下一步。
