# API 契约（v1.3 · Round 3 终审版）

> 与实现逐 action 核对后的精确契约。**终审基线 HEAD `538162e`**：Round 3 修复批次
> （AD-17 修业接线、AD-21 rng 注入、AD-16 阈值 60s、AD-22 等级 clamp、D-21 死分支
> 删除、R2-6 回归补回、`3e376be` 终盘数据增补、`538162e` ACCEPTANCE/SOTA 销案）
> 落地后，终审对每笔勾销**运行时复核**：`npm test` **37 项全绿**（34+3 补回）、
> `npm run probe` 全 ok、`npm run bench` 全 ok 且 checksum 1011.25 未漂；§6 各偏差
> 按复核结果打勾或更新证据，本版并收编本轮新增/变更的 API 面（`core/study.js`、
> `disciples/train.js` 重写、`waveReward` 签名收窄、`OFFLINE_DIRECT_SEC=60`、
> `RECRUIT.rng`、法器第 21 件与掉落第 19 节点等）。
> 终审未开出新偏差，**编号序列冻结在 D-21**（只追加原则下的空追加）。
> v1.2（Round 2 复审版）历史：复审基线 `923d026`（含 `21a7ff8` 存档/离线/守卫合并
> 与 `07dae75` 离线效率·槽型·兽潮税、`12ff624` applyTriggers 接线、`dbd7c96` 修业
> 口径、`41048af` 万魂灯移通用槽 + GDD 对齐槽型/兽潮税、`f777a31` UI 可点性等批次）；
> Round 1 版本（v1.1，基线 `419f9d7`）起的偏差编号全部保留，只追加不删除。
> Round 2 曾出现兽潮败战税基与法器槽型方案「实现与 GDD 各自拍板、互斥」的冲突，
> 已由 `41048af` 定案收敛（均取实现侧口径，GDD 改述）且该定案仍为现行口径；
> 残余同步项见 D-20/D-21 与 ARCHITECTURE AD-8/AD-12。
> **兼容政策**：action 名永不改；payload 字段与存档字段只增不删；新字段一律可选
> 且带默认值；语义变更必须在 §6「契约偏差与修订清单」立案。
> 实现与本契约不一致处已在 §6 逐条标注，代码修订由对应模块所有者执行。

## 1. Store API

```js
const store = createStore(options?);
// options（全部可选，Round 2 追加，测试注入用）：
//   { storage?: localStorage 替身, events?: createBus() 实例, persistMs?: 4000 }
store.get();            // → 当前 state（只读视角，禁止调用方修改）
store.dispatch(action); // → 新 state；同步执行 reduce → 持久化 → 事件播报 → 通知订阅者
store.subscribe(fn);    // fn(state, action)；返回退订函数
store.events;           // → core/events 总线（getter）；事件名见 §1.1
store.version();        // → 单调递增的状态版本号（渲染门控用；状态未变不递增）
store.flush();          // → 立即把节流窗口内的脏状态落盘（关页/切后台兜底）
```

- dispatch 是同步的：返回时 reducer、持久化尝试与订阅回调均已完成。
- 持久化节流与重试：非 `TICK` action 每次写盘；`TICK` 距上次写盘 >4s 才写；
  写失败（配额等）保留脏标记并在下个节流窗口自动重试。
- **拒绝信号**：守卫不通过时 reducer 返回原 state（引用相等 `prev === next` 即被拒），
  部分拒绝会附带一条府报 log（见各 action「守卫与拒绝」列）。reducer 永不 throw。
- 订阅回调抛错被捕获并播 `subscriber:error`，不影响其余订阅者。

### 1.1 事件总线（Round 2 接线，`core/events.js#EVENTS`）

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `save:written` / `save:failed` | `{ at, bytes, error? }` | 每次落盘成功 / 失败（失败会自动重试） |
| `save:corrupt` | `{ status, reason }` | BOOT 读到 corrupt/unsupported 档（原档已备份旁路键） |
| `save:cleared` | `{ at }` | RESET 清盘 |
| `offline:banked` / `offline:applied` / `offline:collected` | 产出与秒数 | 离线结算入匣 / 直接入账 / 领取 |
| `subscriber:error` | `{ error, action }` | 订阅回调抛错 |

## 2. Store actions

原契约表保留并补全为「实际生效 payload」。约定：`?` = 可选；`now?` 缺省取
`Date.now()`；标 ⚠ 的字段见 §6 偏差清单。

| type | payload（实际生效） | 效果 | 守卫与拒绝 |
| --- | --- | --- | --- |
| `BOOT` | `{ now?, loaded? }` | 载入（经 `normalizeState` 收敛）或建档，结算离线（详见 2.1） | 无档/损档 → 全新默认档（损档先备份旁路键并播 `save:corrupt`） |
| `RESUME` | `{ now? }`（Round 2 追加） | 切后台/掉帧后的补结算：与 BOOT 共用 `settleOffline`（详见 2.3）。engine 墙钟跳变 >5s 与 `visibilitychange` 自动派发 | 未选阵营/窗口为 0 → no-op |
| `CHOOSE_FACTION` | `{ faction, name?, now? }` | 人/神/魔 + 道号；发 3 初始弟子、3 初始建筑、初始阵容 | 已有阵营/阵营非法 → no-op |
| `TICK` | `{ now?, dt }` | 资源与修炼推进；dt clamp ≤ 2s；`lastTick` 单调前进 | 未选阵营/dt ≤ 0 → no-op |
| `BUILD` | `{ buildingType, x, y, now? }` ⚠D-1（旧文档写 `type`，从未生效） | 占地建造；id 由现存建筑派生（`b-<max+1>`） | 类型非法/未选阵营/坐标非法/unique 已有 → 静默拒；格被占/洞府级不足/地块满/资源不足 → 拒（附 log） |
| `UPGRADE` | `{ id, now? }` | 建筑升级 | 无此建筑 → 静默拒；mansion 达 12 级上限/非 mansion 达 `mansionCap(lv).maxBuildingLevel`/资源不足 → 拒（附 log） |
| `ASSIGN` | `{ discipleId, buildingId }` | 派遣；`buildingId: null` = 撤回；抢占式（顶替原驻守者） | 弟子不存在/建筑不存在/目标与现状相同 → 静默无效果（建筑校验为 Round 2 追加守卫） |
| `RECRUIT` | `{ heroId, now?, rng? }`（`rng` Round 3 追加，`b1950b4`） | 解锁仙友入府，建确定性 id（`d-<heroId>`）弟子并自动入阵（<6 席时）。资质由 reducer 内 `rollAptitude(action.rng)` 掷点（可注入重放一致；缺省 `Math.random` 保持手感），费用 `jade: 6(+2 若 dps), stone: 40` | 英雄不存在/已解锁/未选阵营/**跨阵营**（Round 2 追加守卫，AD-15 已修）→ no-op；资源不足 → 拒（附 log）。D-17 已修 |
| `TRAIN` | `{ discipleId, now? }` | 消耗丹药+灵草升专业。费用 `pills: 2+3·prof, herb: 8+6·prof` | 弟子不存在 → 静默拒；资源不足 → 拒（附 log） |
| `CULTIVATE` | `{}` | 吞吐灵气涨修为：-4 qi，+`6+realm.index` exp | qi < 4 → no-op |
| `BREAKTHROUGH` | `{ now?, rng? }` | 尝试破境（成功/失败语义见 ARCHITECTURE §4.3）；`rng` 注入点（测试用），`now` 打府报时间戳 | exp 未满 → 拒（附 log） |
| `SET_PARTY` | `{ heroIds }` | 设阵容：去重、过滤未解锁、截断 6 席、主角（`mc-*`）强制居首 | 永远成功（自动纠正） |
| `EQUIP_ARTIFACT` | `{ artifactId, slot? }` ⚠D-2 更新：槽型已生效但取自**数据表** `slot` 字段而非 payload（payload `slot` 仍不被读取，保留字段）。落位规则：attack×1 / defend×1 / util×2，同槽 FIFO 顶掉最早；再点已佩戴 = 卸下；未知槽型归 util | 佩戴/卸下法器 | 未拥有/槽容量为 0 → no-op（UI 按试算结果禁用按钮并标注「槽暂未开放」，`f777a31`）。槽型方案已获 GDD 背书（`41048af`），见 D-20/AD-8 |
| `START_TOWER` | `{ now? }` | 挑战当前层；seed = `(now ^ floor×9973) >>> 0`；结果即刻算出存入 `state.combat` | 未选阵营/空阵容 → 静默拒（Round 2 追加）。⚠仍会覆盖未结算战斗（AD-13 余项） |
| `START_WAVE` | `{ now? }` | 兽潮下一波；seed = `(now ^ wave×7919) >>> 0`；同上 | 同上 |
| `RESOLVE_COMBAT` | `{ now? }`（`now` 打府报时间戳，D-4 已收编） | 结算当前战斗：唯一发奖点；推进 floor/wave/best；按 best 里程碑解锁法器；败战惩罚（见 2.2） | `combat == null` → no-op |
| `COLLECT_OFFLINE` | `{ now? }`（`now` 写入 `offline.at` 与府报，D-4 已收编） | 领取挂机匣：`offline.pending` 入账并清空、`seconds` 归零 | 无待领 → no-op |
| `RESET` | `{ now? }` | 回到选阵营门态；localStorage 清盘由 dispatch 外壳执行并播 `save:cleared` | 永远成功 |

### 2.1 `BOOT` 细则

1. `loaded` 字段：注入已加载的 state 以绕过 localStorage（单测/迁移工具用）；
   经 `createStore` dispatch 时外壳的 `prepareBoot` 总会注入 `readSave().state`，
   reducer 内的直接读盘只是裸调 `reduce` 时的兜底。
2. 载入的档先过 `normalizeState` 全量收敛（非法引用剔除、数值 clamp，见
   ARCHITECTURE §3.2 第 8 条），再结算离线。
3. 离线结算走 `core/offline.js#settleOffline`：
   `seconds = clamp((now − meta.lastTick)/1000, 0, 8×3600)`；时钟回拨与首开档收敛
   到 0（纯建筑产量 + 境界灵气，不模拟战斗）。
4. `seconds > 60`（秒；阈值 `OFFLINE_DIRECT_SEC=60`，Round 3 由 8 提至 60，
   AD-16 已修 `bfb6aa6`）→ 产出按 `offlineProduce` **折算**（底 50% +
   6%/聚灵阵级，封顶 90%；D-15/AD-18 已修），与上一笔未领取的 `offline.pending`
   **合并**（`mergeYield`），`offline.seconds` 累加，府报注明折算百分比并播
   `offline:banked`（payload 带 `efficiency`）；`seconds ≤ 60` → 满效率直接入账
   （「没离开」，有意不折算）并播 `offline:applied`。`meta.lastTick` 无条件推进到
   `now`。

### 2.2 `RESOLVE_COMBAT` 细则

- **塔胜**：`towerReward(floor, win)` 入账；`floor+1`；`best = max(best, floor)`。
- **塔败**：安慰奖 `{stone:4, qi:8}`；层数不掉。
- **潮胜**：`waveReward(wave, win)` 入账；`wave+1`。
- **潮败**（`07dae75` 起）：只没收**未收取产出**（`waveLossTax`）——挂机匣
  `offline.pending` 全数散失清空 + 上次入账至今 ≤2s 的未入账尾巴作废
  （`lastTick` 推进到 now）；**库存分毫不动**，府报逐项列明散失内容。
  该税基已获 GDD 背书（`41048af` 改述「以挂机匣为赌注」并废弃库存三成抄家税），
  见 D-21/AD-12；`combat/wave.js#waveReward` 的败战 `loseTax`（库存 30%）已成
  死代码，GDD 点名待机制所有者删除。
- **掉落**：胜后按 `best` 里程碑发放，节点全部读
  `data/artifacts.js#ARTIFACT_DROPS`（**19 节点**：塔 5/10/15/20/24/25/28/30/32/
  35/**38**/40、潮 5/8/10/12/14/16/20；AD-9 已修，store 不再自留硬编码表；
  塔 38 为 Round 3 `3e376be` 增补的「九转还魂幡」，只增节点、旧节点未改）。
- 任意分支结束后 `combat = null`，同一场战斗不可重复领奖。

### 2.3 `RESUME` 细则（Round 2 追加）

- 与 BOOT 共用 `settleOffline`（含 8h 封顶、60s 直入账阈值、pending 合并）；区别是作用于
  **当前内存态**而非读档结果，且窗口为 0 或产出为空时严格 no-op（引用相等）。
- 派发来源：engine 帧间墙钟跳变 > 5s（`RESUME_GAP_MS`）；`main.js` 的
  `visibilitychange`（hidden → `store.flush()`；visible → `RESUME`）。UI 不手工派发。

## 3. 纯函数导出

原六条保留（签名按实现修正），新增补登实际存在的导出。**返回值不得改输入对象**
（`simulate` 内部对自建 unit 副本可变，输入 `state`/`foes` 不受影响——已核对）。

| 模块 | 导出 | 说明 |
| --- | --- | --- |
| `mansion/production.js` | `produce(state, dtSec, opts?) → YieldMap` | 全建筑每秒产量 × dt；含驻守弟子、等级曲线、邻接规则表、府邸光环（+3%/级）、境界灵气；`opts.efficiency` 供离线折算 |
| | `productionRates(state)`、`produceBreakdown(state, dtSec?, opts?)`（补登） | HUD 速率 / 逐建筑乘区拆解（含邻接来源明细；`rows` 只列资源建筑，修业建筑走 `xp` 段） |
| | `offlineEfficiency(state 或 buildings)`、`offlineEfficiencyDetail`、`offlineProduce(state, elapsed, opts?)`、`offlineReport`、常量 `OFFLINE_BASE/OFFLINE_PER_ARRAY_LEVEL/OFFLINE_CAP/OFFLINE_ARRAY_TYPE`（Round 2 扩） | 离线折算：底 50%、每级聚灵阵 +6%、封顶 90%。✅已被 `settleOffline` banked 路径调用（D-15/AD-18 已修） |
| | `xpAt(type, level)`、`producesXp/producesResources(type)`、`xpBuildings(state)`、`scriptureXpRows/scriptureXpPerSec/scriptureXpFor/scriptureXpAward`、`normalizeLevel`、`DEFAULT_XP_PER_SEC`（Round 2 新增，`dbd7c96`） | 修业通道（AD-17 仙府侧口径：只驻藏经楼者领、按楼级线性、不吃邻接/光环、满修业仅「可晋阶」不发免费晋阶）。✅已接线（Round 3 `cc73d8b`/`47a7f1e`）：store TICK 经 `core/study.js#grantScriptureXp` 消费 `scriptureXpAward`，`disciples/train.js` 亦照此账发放——AD-17 已修 |
| | `applyYield(resources, add) → resources'`（补登） | 记账合并（跳过非有限数值） |
| | `combatBuildingBonus(buildings) → { atk }`、`combatBonusSources(buildings)`（补登） | 丹房 +4·lv、锻造房 +3·lv、演武场 +5·lv（读建筑定义 `combatBonus`） |
| `mansion/layout.js` | `adjacencyBonus(buildings, x, y, typeHint?) → number` ⚠D-5：首参是**建筑数组**，旧文档误写 `grid` | 按 `ADJACENCY_RULES` 规则表：跨类型加成、负面邻接（炉火燎田）、随邻居等级追加、乘区下限 0.5 |
| | `ADJACENCY_RULES`、`adjacencyDetail`、`adjacencyOnGrid`、`adjacencyDetailOnGrid`（补登） | 规则表与来源明细（UI 解释「为什么这块地产得多」） |
| | `occupancy(buildings) → grid[y][x]`（补登） | 6×6 占位矩阵 |
| | `canPlace`、`countType`、`buildingAt`、`inBounds`、`mansionLevel`、`neighbors`、`emptyPlots`、`plotUsage`、`bestPlotFor`、`layoutReport`（补登） | 布局查询 + 0-100 风水评分 |
| `mansion/buildings.js` | `buildingDef(type)`、`buildingList()`、`yieldAt(type, level)`、`levelScale(level)`、`normalizeLevel(level)`、`maxLevelFor`、`effectiveLevel(building, mansionLevel?)`、`canUpgrade`、`cumulativeUpgradeCost`、`canAfford`、`costShortfall`、`isUnlocked`、`catalog(mansionLevel, ctx)`、`MANSION_MAX_LEVEL`、`LEVEL_MAX`（Round 3 扩 `b14705d`/`fa12a27`） | 数据表归一化包装（冻结 + 缓存）；`catalog` 给营造面板带解锁/预算/拦截原因。`normalizeLevel` Round 3 起收敛到 `[1, LEVEL_MAX=12]` 的整数（Infinity/大数/小数一并压回）；`effectiveLevel` 再按洞府上限夹一道，产量/邻接/修业结算共用（AD-22 双保险之一） |
| `combat/battle.js` | `simulate(input) → SimResult` | 见 §4 |
| `combat/artifacts.js` | `artifactLoadout(equippedIds) → loadout`（补登） | 把佩戴法器解析成战斗只读配置（护盾/减伤/复活[带 `charges`，缺省每人 1 次]/自救/斩杀/灼烧/赌伤/晕眩/被动），每个效果槽为 `resolved()` 注记、`sources` 汇总，战斗内核唯一法器入口 |
| | `applyTriggers(ctx, event) → notes[]` D-6 ✅已接线（`12ff624`）：`battle.js#fire` 按 `event.kind` 过滤 `loadout.sources`，产出战报署名（帧日志 `by` 字段 + `result.artifacts` 汇总） | |
| | `collectPassives(equippedIds)`、`hasArtifact(equipped, id)`（补登） | passive 聚合 / 判存 |
| `combat/tower.js` | `challengeTower(state, now)`、`towerReward(floor, win)`（补登） | store 编排用 |
| `combat/wave.js` | `challengeWave(state, now)`、`waveReward(wave, win)`（Round 3 签名收窄 `c9068c0`：第三参 `resources` 随死分支一并删除，旧调用点多传的实参被忽略、无破坏） | 胜利奖励生效；败战返回空账 `{}` 并注释指路 `core/store.js#waveLossTax`——`loseTax` 死分支已删（D-21 已修） |
| `core/store.js` | `reduce(state, action)`、`defaultState`、`waveLossTax(state, now) → { pending, unbanked, unbankedSec, total }`（Round 2 新增）、常量 `MAX_TICK_SEC/PERSIST_INTERVAL_MS` | `waveLossTax` = 潮败税基（挂机匣 + ≤2s 未入账尾巴），UI 战前风险提示可复用 |
| `progression/realm.js` | `breakthroughChance(state) → 0 或 [0.08, 0.92]` | `0.42 − 0.03·index + min(0.4, 0.08·heartDemon) + min(0.2, pills/80)`；exp 未满恒 0 |
| | `canCultivate`、`applyCultivate`、`applyBreakthrough(state, rng)`（补登） | |
| `disciples/assign.js` | `yieldMultiplier(disciple, building) → number` | 采集看勤勉、工坊看武力、皆吃专业 |
| `disciples/roster.js` | `makeDisciple`、`trainCost`、`canTrain`、`applyTrain`、`trainShortfall`、`professionTitle`、`discipleFlavor`（Round 2 补登后三条） | `makeDisciple` 缺省资质仍走 `Math.random`，但仅剩兜底——store 调用点已全部显式传值（RECRUIT 掷点在 reducer 内完成，D-17 已修） |
| `disciples/train.js` | `scriptureXp(state, dtSec) → disciples'`、`xpNeeded(profession)`、`scriptureRate(state)`、`scriptureAward(state, dtSec)`、`scriptureRateFor(state, disciple)`、`xpReady(disciple)`、`xpProgress(state, disciple)`（Round 3 重写 `47a7f1e`，补登后四条） | 弟子侧修业通道：一律照仙府账（`scriptureXpAward`）发放、不复算速率，仙府侧缺席才走同口径本地兜底；`scriptureXp` 只涨 xp、满格即止、**永不 `profession + 1`**（AD-17 语义争议已消解）；`xpProgress` 供面板取进度/速率/ETA |
| `core/study.js` | `xpCap(profession)`、`scriptureAward(state, dtSec) → { [discipleId]: xp }`、`grantScriptureXp(state, dtSec) → disciples'`（Round 3 新模块 `cc73d8b`） | 修业接线（AD-17）：TICK 的唯一修业入口；能力探测优先 `mansion.scriptureXpAward`，缺席退 `train.scriptureAward`；只涨 xp 且封在 `xpNeeded`，无人领取时原引用返回（不空转重绘） |
| `core/state.js` | `defaultState`、`normalizeState(raw) → state`、`snapshotForSave(state) → state'`、`nextBuildingId(buildings)`、`normalizeParty(raw, unlocked, faction)`、`mainHeroId`、`equipArtifact(equipped, id) → equipped'`、`artifactSlot(id)`/`slotCapacity(slot)`/`slotUsage(equipped)`/`normalizeEquipped(raw, owned)`、`pay`/`addRes`/`spendRes`、`mergeYield`/`normalizeYield`/`hasGain`/`emptyYield`、`num`/`nonNeg`/`int`/`clamp`、常量 `RESOURCE_KEYS`/`PARTY_SIZE`/`ARTIFACT_SLOT_CAPS`/`ARTIFACT_SLOTS`/`MAX_LOG`/`MANSION_MAX_LEVEL`（Round 2 新模块，`07dae75` 扩槽型族） | 组合根拆分件：缺省档 / 读档收敛 / 落盘快照（末帧裁剪）/ 槽型佩戴 / 记账原语。`normalizeState` Round 3 起在读档路径强制不变式 2（`127e6f3` 内部 `capBuildingLevels`，AD-22 已修）。⚠`MANSION_MAX_LEVEL` 与 `mansion/buildings.js` 重复，见 AD-11（终审复认仍开） |
| `core/offline.js` | `settleOffline(state, now) → { mode, efficiency, gain, resources, offline, seconds, rawSec, capped }`、`offlineWindow(lastTick, now)`、`offlineEfficiency(state)`/`offlineGain(state, seconds)`（能力探测包装，契约缺席退满效率）、`offlineSummary(offline)`、常量 `OFFLINE_CAP_SEC=8h`/`OFFLINE_DIRECT_SEC=60`（Round 3 由 8 提至 60，AD-16 已修 `bfb6aa6`）/`OFFLINE_MODE`（Round 2 新模块） | BOOT/RESUME 共用的离线结算；banked 走 `offlineProduce` 折算（AD-18 已修），direct 满效率 |
| `core/save.js` | `readSave(storage?) → { status, state, savedAt, reason }`、`writeSaveDetailed(state, storage?) → { ok, bytes, error }`、`backupCorrupt(storage?)`、`loadSave`、`writeSave`、`clearSave`、`SAVE_KEY`、`CORRUPT_KEY`、`SCHEMA`、`SAVE_STATUS`（Round 2 扩） | 信封格式见 §5；`loadSave`/`writeSave` 为兼容包装保留 |
| `core/engine.js` | `startEngine({ store, render, tickMs=100, schedule?, cancel?, clock?, wall? }) → stop()`、常量 `DEFAULT_TICK_MS`/`MAX_CATCHUP_TICKS=20`/`RESUME_GAP_MS=5000`（Round 2 扩：注入点与常量） | 补帧上限 20 tick；墙钟跳变 >5s 自动派发 `RESUME`；按 `store.version()` 门控渲染 |
| `core/events.js` | `createBus() → { on, once, off, emit, listenerCount, clear }`、`EVENTS`（Round 2 扩） | ✅已接线（AD-4 bus 部分）：store 外壳播 §1.1 事件，`main.js` 监听 |
| `data/*` | 常量表 + `heroById`/`artifactById`/`artifactsBySlot`/`ARTIFACT_DROPS`/`realmAt`/`realmPower`/`factionAdvantage`/`towerEnemy`/`waveEnemy`/`upgradeCost`/`buildCost`/`mansionCap`/`COST_SCALE`/`STARTER`/`STARTER_ARTIFACTS`（补登） | 纯数据，零依赖。`ARTIFACT_DROPS` 现 **19 节点**（Round 3 `3e376be` 增补塔 38，法器扩为 21 件）且 ✅被 store `dropTable` 读取为发放单一事实源（AD-9 已修；只增节点、旧节点 id/via/at 未改，符合只增不删）。数据值变更：`41048af` **万魂灯 `slot` defend→util**（保基准四件套在 1/1/2 制下合法；`simulate` 不读 slot，战斗数值不变，旧档由 `normalizeEquipped` 重新落位）；`3e376be` 新增「九转还魂幡」（util 槽，`effect.reviveCharges: 2`——`reviveCharges` 契约缺省 1、挂每名我方单位，与万魂灯同 trigger 时按 loadout 争槽规则取后装）+ 塔 41+ 倍率回落 + 飞升基准上调（纯数值，契约面无涉） |

## 4. `simulate` 输入 / 输出 Schema

```js
// 输入
{
  seed: uint32,            // 必填；同版本同输入 ⇒ 逐字段相同输出
  heroIds: heroId[],       // 我方（side "a"），按 party 序
  foes: Foe[],             // 敌方（side "b"）；Foe = { id, name, faction, role,
                           //   atk, hp, def, boss? }
  state,                   // 只读：realm（境界加成）与 buildings（丹房/锻造加攻）
  equipped?: artifactId[], // 生效法器，默认 []
  maxTicks?: number,       // 默认 240（0.25s/tick ⇒ 60s 上限）
}

// 输出（SimResult）
{
  winner: "a" | "b",       // 超时判定：存活多者胜，平手判 "a"
  ticks: number,
  seed: uint32,            // 回传，便于战报存档复现
  frames: [{
    tick, winner,          // winner 在终局帧前为 null
    log: [{ t: "hit"|"skill"|"aoe"|"heal"|"shred"|"burn"|"chase"|"counter"
             |"taunt"|"blind"|"miss"|"stun"|"revive"|"rescue"|"execute",
            src?, target?, dmg?, crit?, hits?,     // hits: aoe 命中的 id 列表
            by? }],        // Round 2 追加：生效法器署名（revive/rescue 等）
    units: [{ id, name, side, hp, maxHp, shield, alive, boss,
              revived }],  // Round 2 追加 revived
  }],
  artifacts: [{ id, name, kind, count, … }],  // Round 2 追加：法器生效汇总
                                              // （applyTriggers 注记 × 次数）
}
```

- 未知 `heroIds` 条目被静默过滤（`unitFromHero` 返回 null 即剔除）。
- 英雄技能语义由 `battle.js` 的 `KITS` 表定义，与 `data/heroes.js` 的 `skillDesc`
  一一对应；新增英雄必须同时补两处。

战斗常数（数值归 Fable-3/GDD，此处登记为契约现状）：伤害 `max(1, raw − 0.35·def·defMul)`；
基础暴击 我方 8% / 敌方 6%，暴伤 ×1.5（+ 单位 `critDmgBonus`，如女娲 +0.4）；
攻速 dps 1.05s / 其余 1.25s；大招独立冷却 治疗与辅助 4s / 其余 6s / 敌方 7s，
到点顶掉当次普攻，`ultHaste` 开场压缩周期；灼烧为真实伤害（无视防御）；
阵营克制 神→魔、魔→人、人→神 ×1.18，逆向 ×0.92。

确定性契约：`simulate` 内禁止 `Date.now` / 未播种 `Math.random` / 无序容器遍历；
`tests/combat.test.js` 以同 seed 双跑断言 `winner`、`ticks`、终帧 HP 全等。
跨版本回放以 `frames[]` 为工件，seed 仅同版本有效（见 ARCHITECTURE §7）。

## 5. 存档契约

- 键：`localStorage["zaohua-xianfu-v1"]`；坏档旁路键 `zaohua-xianfu-v1:corrupt`
  （Round 2 追加：corrupt/unsupported 档回退前先原样备份至此）
- 信封：`{ schemaVersion: 1, state: snapshotForSave(state), savedAt }`；`state`
  全字段见 ARCHITECTURE §3.1，`combat.result.frames` 落盘只留末帧（AD-2 已修）
- 读档：`readSave` 返回 `{ status, state, savedAt, reason }`，status ∈
  empty/ok/corrupt/unsupported/unavailable；corrupt 与 unsupported 由 store 外壳
  备份旁路键并播 `save:corrupt`（AD-6 已修），随后回退默认档
- 载入的 state 一律过 `normalizeState` 收敛（ARCHITECTURE §3.2 第 8 条）
- 版本不符仍无迁移链（⚠AD-14 未修，旁路备份仅是缓解）
- 字段演进规则：只增不删；新增字段必须在 `normalizeState` 给缺省值（老档载入不崩）；
  Round 2 已按此追加 `offline.seconds` / `offline.at`

## 6. 契约偏差与修订清单（Round 2 核对结果）

「方向」列：**改文档** = 契约从实（本版已改）；**改代码** = 实现按契约修，对应
ARCHITECTURE §9 架构债编号。Round 2 已逐条复核 HEAD：勾销附证据，仍开更新证据；
编号只追加不删除。**Round 3 终审（基线 `538162e`）**：修复批次落地后逐条运行时
复核——D-17、D-21 经复核**打勾**，D-20 残留随 `538162e` 销案；D-13 余项重新复现
仍开，证据更新为终审探针实测值（探针执行于 `274b40e`，其后尾部提交仅触
data/docs/styles，不影响探针覆盖路径；测试链已在 `538162e` 复跑全绿）；
零新立案，序列冻结在 D-21。

| # | 偏差 | 方向 | 修订 |
| --- | --- | --- | --- |
| D-1 | `BUILD` 旧契约 payload 写 `{ type, x, y }`，与 `action.type` 冲突，实现读的是 `buildingType`（UI 亦然） | 改文档（本版已按实标注；`type` 字段名保留在历史记录，不复用） | — |
| D-2 | `EQUIP_ARTIFACT` 的 `slot` 字段被实现忽略；佩戴为 4 件 FIFO 无槽位约束 | 改代码 → **✅机制已落地**（`07dae75`：attack×1/defend×1/util×2、同槽 FIFO、读档按槽收敛、测试与 UI 同步；「再点即卸下」切换语义一并收编）。注意：payload `slot` 仍不被读取（槽型取数据表），字段保留 | AD-8。槽型方案冲突已定案收敛，见 D-20 |
| D-3 | `BREAKTHROUGH` 的 `now` 未被读取；实现另接受 `rng` 注入（原契约未记） | 改文档 → **✅已消解**（`21a7ff8` 起 `now` 用于府报时间戳；`rng` 已收编为契约字段） | — |
| D-4 | `RESOLVE_COMBAT` / `COLLECT_OFFLINE` 的 `now` 未被读取 | 改文档 → **✅已消解**（`now` 现用于府报时间戳；COLLECT 另写入 `offline.at`，§2 表已按实更新） | — |
| D-5 | `adjacencyBonus` 首参实为 `buildings` 数组，旧文档写 `grid` | 改文档（本版已修正签名） | — |
| D-6 | `applyTriggers` 在契约中承诺、战斗内核未接线（触发硬编码） | 改代码 → **✅已完成**（`c57957e` 数值数据驱动；`12ff624` `applyTriggers` 经 `fire()` 接线，负责战报署名与 `result.artifacts` 汇总，触发条件单源于 `loadout.sources`） | AD-4 已修 |
| D-7 | `taixu`/玄女的 `ultHaste` 被固定技能节奏覆盖，passive 无效（运行时验证同 seed 结果不变） | 改代码 → **✅已完成**（`c57957e`：大招独立计时器；HEAD 运行时复验通过） | AD-5 |
| D-8 | 旧契约漏记大量实际导出（`applyYield`、`occupancy`、`challengeTower`… ） | 改文档（本版 §3 已补登，Round 2 续补 `core/state`、`core/offline`、`readSave` 家族） | — |
| D-9 | 「返回值不得改输入对象」在 reducer 侧存在豁免（BOOT 读盘、RESET 清盘、pushLog 取 Date.now） | 改文档 + 改代码 → **✅大体消解**（`21a7ff8`：BOOT 读盘经外壳 `prepareBoot` 注入、RESET 清盘移入外壳、pushLog 取 `action.now`；豁免清单更新至 ARCHITECTURE §8.5）。余留随机性另立 D-17 | AD-3 已修 |
| D-10 | `TRAIN` 旧描述「消耗丹药」，实际消耗丹药+灵草 | 改文档（本版已按实标注费用公式） | — |
| D-11 | 架构文档曾承诺「存档损坏记 saveCorrupt 事件」，未实现 | 改代码 → **✅已完成**（`readSave` 状态机 + `backupCorrupt` 旁路键 + `save:corrupt` 事件；残留：仅 console，未进府报） | AD-6 已修 |
| D-12 | 兽潮败战税基（库存 30%）与 GDD（当波未收取资源 30%）不一致 | **✅已定案收敛**：实现（`07dae75`）改走「未收取产出」税（`waveLossTax`：挂机匣 + ≤2s 尾巴，库存不动）且测试锁定；GDD 曾于 `893d94f` 反向拍板「库存三成」（声明失真，轮内短暂互斥），后由 `41048af` 改述实现侧口径并给出废弃抄家税的决策理由——GDD/实现/测试/府报四方同口径。Round 3 终审补记：玩家提示尚差一句——`ui/screens.js` 兽潮页仍写「失败将散失三成灵草/灵木/灵矿」（战前提示与实际结算不符，归 Opus-4，见 ARCHITECTURE AD-12 残留③） | AD-12 已定案；死代码收口见 D-21（已删） |
| D-13 | `START_TOWER`/`START_WAVE` 缺守卫（空阵容/未选阵营/覆盖未结算战斗） | 改代码 → **部分完成**（阵营/空阵容静默守卫已加；覆盖未结算战斗仍放行——Round 3 终审于 `274b40e` 复现：连发两次 START_TOWER，第二次 seed 1501 顶掉第一次 13693，旧战斗作废无奖励；本轮修复批次未含此项） | AD-13 余项 |
| D-14 | `RECRUIT` 不限阵营（UI 过滤但 reducer 放行）、UI 价格文案与真实费用不符 | 改代码 → **✅已完成**（reducer 跨阵营静默拒绝；UI 经 `recruitCost` 渲染真实价格。残留：该函数是 `ui/util.js` 内的公式副本，应下沉 domain） | AD-15 已修 |
| D-15 | 离线折算函数（`offlineEfficiency`/`offlineProduce`）已在 mansion 落地，但离线结算仍按全效率 | 改代码 → **✅已完成**（`07dae75`：`settleOffline` banked 路径调 `offlineProduce`；运行时复验效率 0.56 档 pending 灵气 = 2207.5 折算值，府报/事件带效率百分比；回归测锁定） | AD-18 已修 |
| D-16 | 邻接规则已扩为规则表（跨类型、负面、随等级、下限 0.5）+ 府邸光环，GDD 建筑章节未同步 | 改文档（GDD）→ **✅已完成**（GDD 已补邻接规则小节，数值与 `ADJACENCY_RULES` 逐条一致） | AD-19 已修 |
| D-17 | `RECRUIT` 弟子资质由 `makeDisciple` 内 `Math.random` 生成，无 `rng` 注入点：同一 action 序列重放资质漂移（Round 2 新立） | 改代码 → **✅已完成**（Round 3 `b1950b4`：payload 收 `rng?`，reducer 内 `rollAptitude(action.rng)` 掷点后显式传给 `makeDisciple`；终审探针：注入同一 rng 序列双跑 RECRUIT 资质均为 15/18 重放一致，缺省仍 `Math.random` 属契约允许的手感保留） | AD-21 已修 |
| D-18 | RESOLVE 兽潮败战府报文案「散失三成**未入库**资源」与当时实现（库存税）矛盾（Round 2 新立） | **✅已消解**（`07dae75` 把机制改为未收取税后，府报与机制同口径且逐项列明；税基本身的定案冲突归 D-12/D-21） | AD-20 已消解 |
| D-19 | Round 2 新增 API 面未曾在契约中：`RESUME` action、`store.events`/`version()`/`flush()`、`createStore(options)`、`readSave`/`writeSaveDetailed`/`backupCorrupt`、事件名表、EQUIP 切换语义、`offline.seconds/at` 字段、`waveLossTax`、槽型族（`equipArtifact` 等）、修业族（`scriptureXpAward` 等）、`SimResult.artifacts`/`units.revived`/`log.by` | 改文档（**本版已收编**：§1、§1.1、§2、§2.3、§3、§4、§5） | — |
| D-20 | 法器槽型**方案**冲突：实现/测试/UI 为 攻×1/防×1/通×2 同槽淘汰；GDD「槽型口径」曾拍板 攻×1/防×1/通×1/**万用×1** 且要求基准四件套（含双防）可同佩——当时复验四件套只装得下 3 件，进度墙校准锚点破坏（Round 2 新立） | **✅已定案收敛**（`41048af`，改 GDD + 改数据）：GDD 改认 1/1/2 制；数据侧万魂灯 defend→util，基准四件套（七星灯防+万魂灯通+论道图通+朱雀弓攻）恰好占满四槽合法，锚点保住且 `simulate` 不读 slot 故墙表数值不变；UI 可点性随槽容量试算（`f777a31`）。残留（ACCEPTANCE G5.4 / SOTA R2-1 定案前残文）已随 `538162e` 销案——G5.4 记「四方一致已核，本条通过」，Round 3 终审全线闭环 | AD-8 已定案+已销案 |
| D-21 | `combat/wave.js#waveReward` 败战分支 `loseTax`（库存 30%）成死代码：store 潮败改用 `waveLossTax`，无调用方（Round 2 新立） | 改代码 → **✅已删除**（Round 3 `c9068c0`：分支删除、签名收窄为 `waveReward(wave, win)` 且注释指路 `waveLossTax`；终审探针 `waveReward(3, false)` 返回 `{}`、无 `loseTax` 键。收尾小注：store 潮胜调用点仍多传第三参 `state.resources`，被忽略无害，可顺手清理） | AD-12 残留① 已销 |

### 6.1 契约验证探针

- `npm test`：**37 项**单测覆盖确定性（含全量战报逐字段全等）、邻接、扣费、存档
  拒载、突破跨境、槽型佩戴、离线折算、兽潮败战税等契约点（Round 3 终审在
  `538162e` 重跑全绿：5 文件 37 用例）。
- `npm run probe`：模块导出与端口 4174 契约（终审重跑全 ok）。
- `npm run bench`：200 场 `simulate` < 800ms 性能契约（终审重跑 18.83ms；产量
  checksum 1011.25 与期望值逐位相同——本轮修业接线与等级 clamp 改动未碰在线
  产量口径）。
- 修复 §6 任何「改代码」项时，GPT-sol-1 须在 `tests/` 补对应探针后方可勾销。
- Round 1 固化待修行为的「法器 FIFO 逐出」断言已随 D-2/AD-8 改写为槽型断言
  （同槽淘汰、跨槽不挤占、1/1/2 容量）；「败仗只失未收取产出」断言随 D-12/D-21
  定案（`41048af`）**已转正**——两组断言锁定的口径均已获 GDD 背书，保持即可。
- **回归缺口（SOTA R2-6）✅已补回**（Round 3 `df4fc78`）：`07dae75` 重写回归测时
  删掉的三组断言已恢复——坏档备份旁路键并发 `save:corrupt` 事件、建筑 id 取现存
  最大编号 +1 且全表唯一、离线 8h 封顶（恰 8h 与超 8h 的 pending 相同）；
  终审确认三条用例在 `tests/regressions.test.js` 中且全绿（34 → 37）。
- 场外断言（核心 101 项、UI 39 项）仍未收编进 `tests/`（ROUND1_BRIEF 第 9 号
  遗留项，Round 3 终审仍开），归 GPT-sol-1。
