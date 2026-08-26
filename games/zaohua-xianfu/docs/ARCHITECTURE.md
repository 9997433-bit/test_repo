# 造化仙府 · 架构（v1.3 · Round 3 终审版）

> **终审基线：HEAD `538162e`**。本轮（Round 3）落地了一批修复提交：`cc73d8b`/
> `47a7f1e`/`277e937`（AD-17 修业接线，新增 `core/study.js`）、`b1950b4`（AD-21
> RECRUIT rng 注入）、`bfb6aa6`（AD-16 阈值提至 60s）、`127e6f3`/`fa12a27`/
> `b14705d`（AD-22 读档与结算双侧 clamp）、`c9068c0`（D-21 loseTax 死分支删除）、
> `df4fc78`（R2-6 三组回归断言补回）、`66b204b`/`66b05da`/`274b40e`（UI 钩子与
> 修业文案）、`3e376be`（终盘平衡：还魂幡入表、掉落 19 节点、飞升基准上调——纯
> data/GDD，不触架构面）、`538162e`（ACCEPTANCE/SOTA 定案前残文销案）等。
> 终审对每笔勾销**运行时复核**：`npm test` 37 项全绿（34+3 补回）、`npm run probe`
> 全 ok（端口 4174 与模块导出契约）、`npm run bench` 全 ok（200 场 `simulate`
> < 800ms 预算，产量 checksum 1011.25 未漂——修业接线、等级 clamp 与终盘数值改动
> 均未碰在线产量口径）。仍开项（AD-13、AD-14、AD-11 余项与各残留）均在本基线
> **重新复现**并更新证据；终审未开出新债项，**编号序列冻结在 AD-22**
> （只追加原则下的空追加，新发现全部并入既有编号的证据栏）。
> Round 3 终审快照见 §9.2。
>
> v1.2（Round 2 复审版）历史：复审基线 `923d026`，含 `21a7ff8`（离线结算 / 存档加固 /
> reducer 守卫合并）、`07dae75`（离线效率接线、槽型、兽潮税）、`12ff624`/
> `97b32e2`（applyTriggers 接线、万魂灯口径）、`dbd7c96`（修业口径落地）、`893d94f`
> （GDD 拍板）、`9a8b443`/`f777a31`（UI 槽位口径与可点性）、`41048af`（万魂灯移通用
> 槽 + GDD 对齐已实装槽型/兽潮税）等批次。Round 2 曾发现两处**实现与 GDD 各自拍板、
> 方向相反**的冲突（AD-8 槽型方案、AD-12 兽潮税基），已在轮内由 `41048af` 定案收敛
> （均取实现侧口径，GDD 改述 + 万魂灯移槽保住校准锚点），该定案仍为现行口径；
> 残余文档同步项见 §9 对应条目。
> v1.1（Round 1 复审版，基线 `419f9d7`）起的立案编号全部保留，只追加不删除。
> 本文与 `API_CONTRACT.md` 共同构成实现的唯一架构契约；发现实现与文档冲突时，先在
> 第 9 节「架构债登记簿」立案，再由模块所有者修代码或修文档，禁止静默漂移。
> 修订原则：与现有 action 名保持兼容；契约与存档字段**只增不删**。

## 1. 隔离

- 根：`games/zaohua-xianfu/`
- 禁止改仓库根业务文件；禁止引用其他 `games/*` 源码
- 端口 4174（`dev` 与 `preview` 均是；`scripts/probe.mjs` 会校验 `package.json` 与 `vite.config.js`）
- 共享只读文件（`package.json` / `vite.config.js` / `README.md` / `docs/OWNERSHIP.md`）的修改规则见 `/.agent_workspace/PROGRESS.md` 所有权表

## 2. 分层

```
ui/          渲染与输入（无数值公式）
core/        时钟、存档、事件、离线结算、状态收敛与不可变式补丁
mansion/     地块、邻接、产量
disciples/   招募、派遣、训练
combat/      自动战、塔、兽潮、法器触发
progression/ 境界与突破
data/        纯数据表（无副作用）
```

`core/` 在 `21a7ff8` 拆为六件：`store.js`（reducer + dispatch 外壳）、`state.js`
（缺省档、`normalizeState` 收敛、`snapshotForSave` 落盘快照、记账原语）、
`offline.js`（离线窗口与结算）、`save.js`（信封读写 + 坏档旁路）、`events.js`
（总线，已接线）、`engine.js`（时钟）；Round 3（`cc73d8b`）补第七件 `study.js`
（修业接线：TICK 经 `grantScriptureXp` 照 mansion 侧 `scriptureXpAward` 的账发放，
只涨 `xp` 且满条即止，永不自行 `profession + 1`——AD-17 的核心侧边界）。

### 2.1 依赖矩阵（按实际 import 核对）

| 模块 | 允许依赖 | 实际依赖（核对结果） |
| --- | --- | --- |
| `data/` | 无 | 无 ✓ |
| `mansion/` | `data/` | `data/buildings`（经 `mansion/buildings.js` 归一化包装 + 缓存）、`disciples/assign`（跨域例外 E-1） |
| `disciples/` | `data/`、跨域例外 E-5 | `data/heroes`、`mansion/production`（`train.js` 照仙府账发修业，Round 3 新增） |
| `progression/` | `data/` | `data/realms` ✓ |
| `combat/` | `data/`、`combat/` | `data/*`、`mansion/production`（跨域例外 E-2）；法器数值经 `artifactLoadout` 全量取自 `data/artifacts.js`，英雄技能集中在 `KITS` 表 |
| `core/store` | 所有 domain + `data/` | 组合根，见 2.2 ✓ |
| `core/state` | `data/`、`core/save` | `data/{buildings,heroes,artifacts,realms}`（收敛与快照是组合根的拆分件） ✓ |
| `core/offline` | `core/state`、组合根例外 E-3 | `mansion/production#produce`（离线结算编排，随 store 拆出） |
| `core/study` | `core/state`、组合根例外 E-4 | `mansion/production#scriptureXpAward`、`disciples/train`（修业接线，Round 3 随 store 拆出） |
| `core/engine` `core/save` `core/events` | 无 domain 依赖 | 无 ✓ |
| `ui/` | `core/store`（注入）、只读纯函数、`data/` | `data/*`、`mansion/{layout,production,buildings}`、`progression/realm`；展示换算集中在 `ui/adapters.js` ✓ |

**跨域例外登记**（均为只读纯函数调用，允许存在，但必须登记）：

- E-1 `mansion/production.js` → `disciples/assign.js#yieldMultiplier`（产量按驻守弟子加成）
- E-2 `combat/battle.js` → `mansion/production.js#combatBuildingBonus`（丹房/锻造房加攻）
- E-3 `core/offline.js` → `mansion/production.js#offlineProduce / produce`（Round 2
  新增：离线结算从 store 拆出后带走的组合根依赖；`07dae75` 起按能力探测优先调
  `offlineProduce`，契约缺席时退回满效率而不是崩在导入上）
- E-4 `core/study.js` → `mansion/production.js#scriptureXpAward` +
  `disciples/train.js`（Round 3 新增 `cc73d8b`：修业接线的组合根依赖，
  与 E-3 同一套能力探测写法——仙府侧缺席时退回弟子层同口径兜底）
- E-5 `disciples/train.js` → `mansion/production.js#scriptureXpAward /
  scriptureXpPerSec / scriptureXpFor`（Round 3 新增 `47a7f1e`：弟子层照仙府账
  发修业、不复算速率；仙府侧缺席时才用本地 `fallbackAward` 兜底。与 E-1 反向
  但不同文件，无模块环：`production → assign`、`train → production`）

新增跨域依赖必须在此表登记，且只允许指向**无副作用纯函数**；禁止 domain 之间互相
读写对方状态切片。

### 2.2 组合根

`core/store.js` 是唯一的业务编排点：所有跨模块规则（扣费、守卫、日志、奖励发放）
集中在 `reduce(state, action)`；dispatch 外壳额外承担四件事——BOOT 前注入读档结果
（`prepareBoot`）、RESET 后清盘、持久化节流与失败重试、经 `core/events` 总线对外
播报（存档异常、离线结算，见 §6）。domain 模块只导出纯函数，不持有状态。
`ui/` 只做三件事：`dispatch(action)`、读 `store.get()`、调用只读纯函数做展示换算
（如 `produce(state, 1)` 显示每秒产量、`breakthroughChance` 显示破境率）——
UI 内不得出现独立的数值公式副本（现存一处违例：`ui/util.js#recruitCost` 复制了
RECRUIT 费用公式，见 AD-15 残留）。

## 3. 状态

单一 `store`：`get()` / `dispatch(action)` / `subscribe(fn)`。
所有写操作走 action → reducer 风格补丁，便于单测时间旅行。

### 3.1 状态树 Schema（schemaVersion = 1，按实现核对）

```
state = {
  schemaVersion: 1,
  meta:      { faction: "mortal"|"divine"|"demon"|null, name: string,
               startedAt: ms, lastTick: ms },
  resources: { qi, herb, wood, ore, stone, pills, jade },       // 浮点，≥ 0
  buildings: [{ id: string, type: BuildingTypeId, level: ≥1,
                x: 0..5, y: 0..5 }],
  disciples: [{ id, heroId, name, diligent, force, profession: ≥1,
                xp, buildingId: string|null, unlocked: true }],
  unlockedHeroes: heroId[],
  party:     heroId[],                    // ≤ 6，惯例 party[0] 为主角 mc-*
  ownedArtifacts: artifactId[],
  equipped:  artifactId[],                // ≤ 4：1 攻 + 1 防 + 2 通，同槽 FIFO
                                          // （GDD 已对齐此口径 `41048af`，见 AD-8）
  realm:     { index: 0..9, layer: ≥1, exp: ≥0, heartDemon: ≥0 },
  tower:     { floor: ≥1, best: ≥0 },
  wave:      { wave: ≥1, best: ≥0 },
  combat:    null | { kind: "tower"|"wave", result: SimResult & 元数据 },
  offline:   { pending: null | YieldMap, seconds: ≥0, at: ms },  // Round 2 追加 seconds/at
  log:       [{ at: ms, text: string }],  // 最多 40 条，新在前
}
```

落盘时经 `snapshotForSave` 处理：`combat.result.frames` 只保留**末帧**（AD-2 已修，
存档约 1.4KB）；载入时经 `normalizeState` 全量收敛（见 3.2 第 8 条）。

### 3.2 不变式（reducer 必须维持）

1. 每格 ≤ 1 建筑；`mansion` 全局唯一；建筑总数 ≤ `mansionCap(lv).plots = 4 + 2 × lv`
   （已改读 `data/buildings.js#mansionCap`）。
2. 非 mansion 建筑等级 ≤ mansion 等级（UPGRADE 走 `mansionCap(lv).maxBuildingLevel`）；
   mansion 等级 ≤ 12（常数仍复制两处，见 AD-11）。Round 3 起本条在读档路径同样强制
   （AD-22 已修 `127e6f3`：`normalizeBuildings` 尾部过 `capBuildingLevels`），仙府层
   另有 `effectiveLevel`/`normalizeLevel` 硬顶 `LEVEL_MAX=12` 兜底（`fa12a27`/
   `b14705d`），三条产量/邻接/修业链都只按合法等级结算。
3. 每建筑 ≤ 1 驻守弟子（`ASSIGN` 抢占式：新派遣者顶替原驻守者；读档时
   `normalizeDisciples` 同样去重）。
4. `equipped ⊆ ownedArtifacts` 且逐槽 ≤ 容量（`ARTIFACT_SLOT_CAPS`：attack 1 /
   defend 1 / util 2，合计 ≤ 4）；读档 `normalizeEquipped` 同样按槽收敛，超出丢弃。
5. `party ⊆ unlockedHeroes` 且 `|party| ≤ 6`；主角（id 前缀 `mc-`）若已解锁必在阵中。
6. 资源不透支：扣费原子化（`pay` 全额成功或整体拒绝）；兽潮败战税经 `spendRes`
   clamp 到 0。
7. 任何 reducer 分支返回的对象不得与输入 state 共享被修改的子树（写路径全浅拷贝）。
8. **载入收敛**（Round 2 新增）：BOOT 对任意（可能被篡改/半损坏）的存档过
   `normalizeState`——未知阵营/建筑/英雄/法器剔除、坐标越界剔除、格位与 unique 去重、
   重复建筑 id 重发、派遣引用自洽、数值 clamp 回合法域。Round 2 遗留的例外
   （不变式 2 未在此路径强制）已由 AD-22 修复补齐（`127e6f3`），本路径现已无例外。

## 4. 状态机

### 4.1 应用门态

```
[gate]  meta.faction == null ──CHOOSE_FACTION──▶ [running]
```

- `gate` 态下 `TICK`、`BUILD`、`RESUME`、`START_*`、`RECRUIT` 直接拒绝（返回原
  state）；`CHOOSE_FACTION` 幂等（已有阵营时 no-op）。`RESET` 从任意态回到 `gate`
  （清盘副作用在 dispatch 外壳执行，reducer 本身保持纯净）。

### 4.2 战斗（登天塔 / 兽潮共用）

```
combat == null ──START_TOWER / START_WAVE──▶ combat = { kind, result }
                 （守卫：已开府且阵容非空，违反则静默拒绝——Round 2 已加）
                 （dispatch 当帧即完成全程模拟，result 已含胜负与 frames）
combat != null ──RESOLVE_COMBAT──▶ combat = null
                 （唯一发奖/惩罚点；推进 floor/wave/best；发法器解锁）
combat != null ──START_*──▶ 仍覆盖旧 result（旧战斗作废、无奖励）※ AD-13 余项，
                 Round 3 终审复现（`274b40e`）：连发两次 START_TOWER，
                 第二次 seed（1501）顶掉第一次（13693）
```

关键性质：**战斗结果在 START 时刻已确定**，`RESOLVE_COMBAT` 只做记账；UI 中间的
逐帧播放是对 `result.frames[]` 的纯回放，不影响结果。奖励只能领取一次
（RESOLVE 置 `combat = null`）。

### 4.3 修炼与突破

```
[累积] ──CULTIVATE（-4 qi，+6+realm.index exp）──▶ exp ≥ REALMS[index].exp ⇒ [可破境]
[可破境] ──BREAKTHROUGH 成功──▶ layer+1（超 layers 则 index+1、layer=1）；exp=0、heartDemon=0、pills-1
[可破境] ──BREAKTHROUGH 失败──▶ 境界不变；pills×0.4（折损 60%）；heartDemon+1（下次 +8%，封顶 +40%）
```

### 4.4 离线结算（BOOT 与 RESUME 共用 `core/offline.js#settleOffline`）

```
BOOT / RESUME
  ─▶ window  = offlineWindow(meta.lastTick, now)
               // seconds = min((now − lastTick)/1000, 8h)；时钟回拨与首开档收敛到 0
  ─▶ seconds ≤ 60s ? gain = produce(state, seconds) 满效率直接入账
                    （mode=direct，「没离开」不折算；阈值 OFFLINE_DIRECT_SEC=60，
                     Round 3 由 8s 提至 60s，AD-16 已修 `bfb6aa6`）
                  : gain = offlineProduce(state, seconds)   // 按聚灵阵折算
                    offline.pending = mergeYield(旧 pending, gain)，seconds 累加，
                    府报注明折算百分比（mode=banked，等 COLLECT_OFFLINE）
  ─▶ meta.lastTick 无条件推进到 now；bus 播 offlineBanked（带 efficiency）/ offlineApplied
```

- 未领取的挂机匣**跨多次 BOOT/RESUME 合并**而非覆盖（Round 2 新行为）。
- **AD-18 已修**（`07dae75`）：banked 路径经 `offlineGain` 调 `offlineProduce`
  （底 50%、每级聚灵阵 +6%、封顶 90%）。运行时复验：离线 1h、效率 0.56 的档，
  pending 灵气 = 2207.5（折算值），府报「按聚灵阵折算 56% 收妥产出」。
  残留：挂机匣面板未展示效率百分比（仅府报与事件携带；Round 3 终审复认仍开）。

## 5. 时钟

`engine` 以 `requestAnimationFrame` 驱动渲染，逻辑 tick 固定 `100ms`：

- 每帧 dt clamp ≤ 0.25s，累加器整步消费、单帧最多补 20 tick（`MAX_CATCHUP_TICKS`，
  卡顿不滚雪球）；`TICK` reducer 内再次 clamp dt ≤ 2s（双保险），且 `lastTick`
  只单调前进（`max(action.now, lastTick)`）。
- `TICK` 只推进产量（`produce`）与藏经楼修业（`core/study.js#grantScriptureXp`，
  Round 3 改口径：只发给驻藏经楼者、满条即止、永不免费晋阶——AD-17 已修），不做战斗。
- 渲染按 `store.version()` 门控：状态没变不重绘。
- **切后台补结算已接线**（AD-7 已修）：engine 检测帧间墙钟跳变 > 5s
  （`RESUME_GAP_MS`）即 dispatch `RESUME`；`main.js` 另挂 `visibilitychange`
  （hidden → `store.flush()` 落盘；visible → `RESUME`）与 `pagehide` → `flush()`。

离线：`min(elapsed, 8h)` 按建筑产量结算，不模拟逐帧战斗（见 4.4 精确流程）。

## 6. 存档

`localStorage["zaohua-xianfu-v1"]`，磁盘格式为信封结构：

```
{ schemaVersion: 1, state: snapshotForSave(<3.1 状态树>), savedAt: ms }
```

- 读档走 `readSave` 状态机：`empty / ok / corrupt / unsupported / unavailable`。
  corrupt 与 unsupported 时 dispatch 外壳把原始坏档**备份到旁路键**
  `zaohua-xianfu-v1:corrupt`（`backupCorrupt`），经 bus 播 `saveCorrupt` 事件
  （`main.js` 落 console.warn），然后回退默认档——「记 saveCorrupt 事件」已实现
  （AD-6 已修；残留：仅 console，未进府报 log）。
- 落盘经 `snapshotForSave`：`combat.result.frames` 只留末帧（AD-2 已修）；载入经
  `normalizeState` 全量收敛（§3.2 第 8 条）。
- 持久化节流与重试：非 `TICK` action 每次 dispatch 后写盘；`TICK` 至多每 4s 写一次；
  写失败（配额等）保留 dirty 标记、播 `saveFailed`，下个节流窗口自动重试；
  `store.flush()` 供关页/切后台兜底。
- 迁移策略：升 schema 版本时必须提供 `migrate[v] : stateV → stateV+1` 链，禁止直接
  弃档（现状 unsupported 仍弃档回退，仅多了旁路备份，见 AD-14）。

## 7. 战斗

纯函数 `simulate(input)`（输入/输出 schema 见 `API_CONTRACT.md` §4）。
UI 只回放 `frames[]`。测试可对同一 seed 断言确定性（`tests/combat.test.js` 已断言）。

战斗内核结构（`c57957e` 重建后）：

- 英雄技能全部收敛在 `KITS` 表（每条与 `data/heroes.js` 的 skillDesc 一一对应），
  主循环不散落按 id 的 if 判断。
- 法器数值经 `artifactLoadout(equipped)` 解析成只读配置（护盾/减伤/复活/自救/
  斩杀/灼烧/赌伤/晕眩/被动），战斗循环不硬编码任何法器常数。
- `applyTriggers` 已接线（`12ff624`，AD-4 勾销）：`fire(ctx, kind)` 在效果生效时
  记「哪件法器起了作用」，署名进当帧日志（`by` 字段）并汇总为 `result.artifacts`；
  只按战况计数、不掷骰，不影响确定性。
- 普攻与大招各走独立计时器：普攻 dps 1.05s / 其余 1.25s；大招 治疗与辅助 4s /
  其余 6s / 敌方 7s，`ultHaste`（太虚金丹鼎、九天玄女）在开场按比例压缩大招周期。
- `applyDamage` 是唯一伤害入口：护盾 → 扣血 → 万魂灯复活 → 阴阳镜自救 →
  镇岳钟斩杀 → 反击，顺序即契约。复活口径已拍板（GDD/`97b32e2`）：**每名上阵者
  各 `reviveCharges`（缺省 1）次**；自救为全队合计一场一次，两者不混。

确定性规则（simulate 内部强制）：

1. 唯一随机源 `mulberry32(seed >>> 0)`；禁止 `Date.now` / 未播种 `Math.random`。
2. 逻辑步长固定 0.25s/tick，`maxTicks` 默认 240（60 秒战斗上限）。
3. 超时判定：存活单位多者胜，平手判 `a`（我方）胜。
4. 单位遍历序 = 数组构造序（我方 party 序在前、敌方 foes 序在后），不得改用无序容器。
5. RNG 消耗序即代码路径：任何战斗逻辑改动都会改变同 seed 的结果——**跨版本回放
   以 `frames[]` 为准，seed 只保证同版本内可复现**。

seed 来源（store 层，非 simulate 责任）：`(now ^ (floor×9973)) >>> 0`（塔）、
`(now ^ (wave×7919)) >>> 0`（兽潮）。`now` 取 dispatch 时刻 ⇒ 结果对玩家不可预演；
`result.seed` 已随战果保存，同版本可完整复现。

## 8. 错误处理约定

1. **reducer 永不 throw**。非法/不满足守卫的 action 返回原 state（引用相等可用作
   「被拒绝」信号），或返回 `state + log` 追加一条用户可见的失败文案（府报通道）。
2. 未知 action type 原样返回 state（前向兼容：旧代码遇到新 action 不崩）。
3. 存储层全部 try/catch 吞错：`readSave` 返回带原因的状态对象（`loadSave → null`
   兼容保留）、`writeSaveDetailed` 返回 `{ ok, bytes, error }`、`clearSave` 静默；
   localStorage 不可用（隐私模式）时游戏以纯内存态继续运行，写失败自动重试（§6）。
4. 订阅者与总线监听器抛错被捕获（`subscriberError` 事件 / console），不拖垮 dispatch。
5. reducer 纯度豁免清单（除此以外禁止副作用；Round 2 起 BOOT 读盘与 RESET 清盘
   已移入 dispatch 外壳，reducer 侧显著收窄）：
   - `BOOT` 未携带 `loaded` 时兜底读 localStorage（`createStore` 的 `prepareBoot`
     总会注入 `loaded`，此兜底仅在直接调用 `reduce` 时触发）；
   - `pushLog(state, text, at)` 已改为取 `action.now`（AD-3 已修），仅在调用方
     未传 `now` 时回落 `Date.now()`；
   - `BREAKTHROUGH` 未注入 `rng` 时回落 `Math.random`（测试均注入）；
   - `RECRUIT` 未注入 `rng` 时回落 `Math.random`（Round 3 `b1950b4` 起与
     BREAKTHROUGH 同规矩：`rollAptitude(action.rng)` 可注入，AD-21 已修——
     缺省随机属有意保留的手感）。

## 9. 架构债登记簿（可执行修订清单）

复审中逐项核对实现后立案；Round 2 已对照 `9a8b443`..`923d026` 逐提交核对更新
「状态」列。**Round 3 终审（基线 `538162e`）**：本轮修复批次落地后，对每笔勾销
**运行时复核**（探针重放 + 37 项单测 / probe / bench 全绿，checksum 1011.25 未漂；
下表探针执行于 `274b40e`，其后至基线的三笔尾部提交 `3e376be`/`2819afe`/`538162e`
仅触 data/docs/styles、不含探针覆盖的任何代码路径，且测试链已在 `538162e` 复跑
全绿，故探针结论对终审基线成立）
——AD-16/17/21/22 与 AD-12 残留①（loseTax 死代码）经复核打勾；仍开各项
（AD-11 余项、AD-13 余项、AD-14 与各 ✅ 行的残留）在本基线重新复现并把证据栏更新为
终审探针实测值。编号只追加不删除，修复后保留条目供审计；本轮零新立案，序列冻结在
AD-22。每项含证据、影响、修订动作与所有者（所有权表见
`/.agent_workspace/PROGRESS.md`）。本文档只立案不改码。

| # | 债项 | 证据 | 影响 | 修订动作 | Owner | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| AD-1 | 建筑 ID 用模块级计数器 `bid`，刷新后从 1 重数 | Round 1：`core/store.js`（`let bid = 1`）运行时验证 ID 碰撞 | 高：老玩家必踩 | ID 改由 state 派生；`disciples/roster.js` 的 `seq` 同理 | Opus-1 | ✅已修（`21a7ff8`：`core/state.js#nextBuildingId` 取现存 `b-N` 最大值 +1；`normalizeState` 读档对撞号 id 重发；弟子 id 改确定性 `d-<heroId>`。残留：roster 的 `seq` 兜底仍在，但 store 全部调用点显式传 id，不入档） |
| AD-2 | `combat.result.frames` 全量持久化 | Round 1：`START_*` 后 240 帧 × 单位快照进 localStorage | 中：存档膨胀、写盘变慢 | `writeSave` 前剥离回放帧 | Opus-1 | ✅已修（`core/state.js#snapshotForSave` 落盘只留**末帧**，存档约 1.4KB；写失败播 `saveFailed` 并自动重试，`flush()` 关页兜底） |
| AD-3 | reducer 内非注入副作用：`pushLog` 用 `Date.now()` | Round 1：`core/store.js#pushLog` | 中：重放 log 时间戳漂移 | `pushLog(state, text, at)` 取 `action.now`；存储副作用移入 store shell | Opus-1 | ✅已修（`pushLog` 第三参取 `action.now`，仅缺省时兜底 `Date.now()`；RESET 清盘与 BOOT 读盘移入 dispatch 外壳，见 §8.5。同类余留：RECRUIT 的 `Math.random`，另立 AD-21） |
| AD-4 | 法器触发硬编码在战斗内核；`applyTriggers` / `createBus` 死代码 | HEAD：法器数值已数据驱动；`createBus` 已被 store 外壳接线（save/offline 事件，`main.js` 监听）；`applyTriggers` 经 `battle.js#fire` 接线，负责战报署名（`by` 字段 + `result.artifacts` 汇总） | 已消解 | — | Opus-3 + Opus-1 | ✅已修（bus `21a7ff8`；applyTriggers `12ff624`，触发条件单源于 `loadout.sources`，不再两处各写一份） |
| AD-5 | `passives.ultHaste` 无效：技能节奏被固定「每 5 tick」覆盖 | 基线 `battle.js` 覆写 `skill` 变量；运行时验证：装备太虚金丹鼎与否同 seed 逐帧全等 | 高：红品法器「太虚金丹鼎」与九天玄女技能均为摆设 | 大招独立计时器 + 开场按 `1+ultHaste` 压缩周期 | Opus-3 | ✅已修（`c57957e`，HEAD 运行时复验：装备 taixu 同 seed 结果已不同） |
| AD-6 | 存档损坏静默回退，未记 `saveCorrupt` | Round 1：`core/save.js` catch 后返回 null，无事件/日志 | 低：玩家丢档无感知 | 读档区分状态并播事件 | Opus-1 | ✅已修（`readSave` 状态机 empty/ok/corrupt/unsupported/unavailable；坏档 `backupCorrupt` 备份到旁路键 `zaohua-xianfu-v1:corrupt`；bus 播 `saveCorrupt`。事件发射的回归用例已由 `df4fc78` 补回（备份旁路键 + emit + 回退默认档三断言）。残留：`main.js` 仅 console.warn，未进府报 log——Round 3 终审复认仍开） |
| AD-7 | 切后台无补结算 | Round 1：`engine.js` 无 `visibilitychange` 钩子 | 中：挂机游戏切标签页即停产 | 复用 4.4 流程补结算 | Opus-1 | ✅已修（新 `RESUME` action：engine 帧间墙钟跳变 >5s 自动 dispatch；`main.js` 挂 `visibilitychange`（hidden→`flush`，visible→`RESUME`）与 `pagehide`→`flush`） |
| AD-8 | 法器槽位未实施：`EQUIP_ARTIFACT` 忽略 `slot`，4 件 FIFO，可 4 件攻击法器同佩 | HEAD 复核：**机制已落地**（`07dae75`：`core/state.js#equipArtifact` 按数据表槽型落位 attack×1/defend×1/util×2、同槽 FIFO 顶掉最早、`normalizeEquipped` 读档收敛；测试改写为槽型断言、UI 按同槽淘汰口径展示 `9a8b443`）。轮内曾开出方案冲突：GDD `893d94f` 拍板 攻/防/通/**万用** 制且要求双防基准四件套可同佩，与实现互斥。**二次定案已落**（`41048af`）：GDD 改认 1/1/2 制（改述 `equipArtifact`/`normalizeEquipped` 口径），数据侧把**万魂灯 defend→util**（复活属命数容错不占防位）——移槽后基准四件套（七星灯防+万魂灯通+论道图通+朱雀弓攻）恰好占满四槽合法，`simulate` 不读 slot 故进度墙数值不受影响，**校准锚点保住**；UI 随槽容量试算决定可点性（`f777a31`） | 定案前：高（实现/测试/UI 与 GDD 互斥）；定案后余项：低（跨文档残文） | 已定案（b 路线 + 万魂灯移槽），无需改实现。残留（ACCEPTANCE G5.4 / SOTA R2-1 定案前残文）**已销**——Round 3 `538162e` 按 1/1/2 口径改写：G5.4 记「口径四方一致已核，本条通过」、R2-1 勾选闭环。终审复认：`3e376be` 新增的还魂幡亦按 util 槽入表，槽型口径未被扰动 | Fable-3 + Opus-1 + GPT-sol-1 | ✅已修+已定案+残留已销（`41048af` 定案，`538162e` 销案，Round 3 终审全线闭环） |
| AD-9 | 大量法器无获取途径 | HEAD 复核：`ARTIFACT_DROPS` 单一事实源在位；Round 3 `3e376be` 增补第 21 件法器「九转还魂幡」（util 槽、塔 38 首通），表扩为 **19 节点**（塔 5..40 共 12、潮 5..20 共 7，覆盖 21 件中非初始的 19 件）——只增节点、已发放节点 id/via/at 未改，兼容政策成立；store 的 `dropTable(via)` 派生发放不变，回归测断言按 data 表发放 | 已消解 | — | Fable-3 + Opus-1 | ✅已修（单一事实源接线完成，Round 3 增补节点亦经该表发放，机制无回潮） |
| AD-10 | 英雄技能与数据表描述不符：猪八戒嘲讽、玉面公主降命中、玄女大招冷却、后羿后排增伤 | 基线 `battle.js` 对照 `data/heroes.js` skillDesc | 中：文案欺骗玩家 | KITS 技能表实现嘲讽（taunt 3s）、致盲（miss 12%）、teamUltHaste 20%、后排 ×1.35 | Opus-3 | ✅已修（`c57957e` KITS 表） |
| AD-11 | mansion 等级上限 12 硬编码在 reducer | Round 3 终审（`274b40e`）复现：非 mansion 上限读 `data/buildings.js#mansionCap` ✓；`MANSION_MAX_LEVEL=12` 仍复制**两处**（`core/state.js` 与 `mansion/buildings.js` 各一份，运行时双导入核对均为 12，store 读前者），`b14705d` 又在 `mansion/buildings.js` 加别名 `LEVEL_MAX = MANSION_MAX_LEVEL`（同文件转引，不算新副本）；第三处影子副本 `ui/adapters.js#maxLevelFor` 的兜底字面量 `?? 12` 仍在 | 低 | 保留单一常数源（建议 `mansion/buildings.js`），`core/state` 转引，adapters 兜底改转引 | Opus-1 | 部分修复（Round 3 复认仍开：cap 接线 ✓，两显式副本 + 一兜底字面量） |
| AD-12 | 兽潮败战税基两套口径 | HEAD 复核：实现（`07dae75`，Opus-1）走 **a 路线**——`core/store.js#waveLossTax` 只没收「未收取产出」（挂机匣 pending 全失 + ≤2s 未入账尾巴作废），库存分毫不动，府报同口径，`tests/regressions.test.js` 已锁定（运行时复验：herb 库存 100 保持、pending 清空）。轮内曾开出反向冲突：GDD `893d94f` 拍板 **b 路线**库存三成并声称「现实现即为准」（写下时实现已是 a——声明失真）。**二次定案已落**（`41048af`）：GDD 败仗税小节与兽潮节改述 a 路线（「以挂机匣为赌注、先收匣再推潮」并给出废弃抄家税的决策理由），资源表删去「兽潮败仗折损」消耗项——GDD/实现/测试/府报四方同口径 | 定案前：高（GDD 与实现/测试直接矛盾）；定案后余项：低（死代码 + 跨文档残文） | 已定案（a 路线），无需改实现。残留销案进度：① `combat/wave.js#waveReward` 败战 `loseTax` 分支（库存 30%）**已删**（Round 3 `c9068c0`：签名收窄为 `waveReward(wave, win)`，败战返回空账并注释指路 `waveLossTax`；终审探针 `waveReward(3, false)` 返回 `{}`、无 `loseTax` 键 ✓）；② ACCEPTANCE G5.2 / SOTA R2-2 定案前残文**已改写**（`538162e`，按 a 路线记「税基已定案、三方已齐」）；③ 四方一致仅剩最后一句：`ui/screens.js` 兽潮页仍写「失败将散失三成灵草/灵木/灵矿」（Round 3 终审复认在位），与实际结算不符，G5.2 记未过直至清除——归 Opus-4 | Fable-3 + Opus-1 + GPT-sol-1 | ✅已定案（`41048af`；残留①② Round 3 已销，残留③ UI 一句旧文案归 Opus-4） |
| AD-13 | `START_TOWER` / `START_WAVE` 无守卫：未选阵营、空阵容、已有未结算战斗时均可发起并覆盖旧结果 | Round 3 终审（`274b40e`，本轮修复批次落地后复测）：`!meta.faction \|\| !party.length` 静默守卫在位 ✓；`combat == null` 覆盖守卫仍缺——探针连发两次 START_TOWER（now=5000/9000），第二次 seed 1501 顶掉第一次 13693，旧战斗作废无奖励 | 低-中：误触丢奖励 | 补 `combat == null` 守卫，违反则 pushLog 拒绝（不改 action 名） | Opus-1 | 部分修复（Round 3 复认仍开：阵营/空阵容 ✓，覆盖守卫缺——本轮修复批次未含此项） |
| AD-14 | schema 版本不符直接弃档，无迁移链 | Round 3 终审（`274b40e`）复认：`core/save.js` 本轮未动，`readSave` 对 `schemaVersion !== 1` 仍返回 unsupported（reason `schema:<v>`）弃档，全仓无 `migrations` 表；缓解不变——坏档/旧档先 `backupCorrupt` 备份旁路键再回退（该备份+事件路径已被 `df4fc78` 补回的回归测锁定） | 低（v1 期）→ 高（升 v2 时） | 建 `migrations = { 1: v1→v2, ... }`，逐级迁移；升版时可从旁路键找回 | Opus-1 | 未修（Round 3 复认仍开；旁路备份缓解在位且有测锁） |
| AD-15 | 招募 UI 价格文案与真实费用不符；reducer 不限制跨阵营招募 | HEAD 复核：RECRUIT 已加 `hero.faction !== meta.faction` 静默守卫 ✓；UI 经 `recruitCost(hero)` 渲染真实价格（`8 仙玉 + 40 灵石` 级差生效）✓ | 低 | — | Opus-4 + Fable-3 | ✅已修（残留：`recruitCost` 落在 `ui/util.js`，是 §2.2 禁止的 UI 公式副本，应下沉 domain/data 并让 store 同源——Round 3 复认残留仍开） |
| AD-16 | 离线挂机匣阈值 8 秒过低：离开 >8s 即弹匣，短暂刷新也走「待领取」路径 | Round 3 修复（`bfb6aa6`）：`core/offline.js#OFFLINE_DIRECT_SEC` 8 → **60**，注释明书取验收 G6.3 的「≥60s」口径且阈值只此一处。终审探针（`274b40e`）：59s/60s 空窗 mode=direct、61s 空窗 mode=banked ✓ | 已消解 | — | Opus-1 | ✅已修（Round 3 `bfb6aa6`，终审运行时复核通过；ACCEPTANCE G6.3 亦已随 `538162e` 改记「阈值 = 60 秒，R2-5 已闭环」，全线销案。小注：60s 边界值本身尚无专属回归用例，SOTA 建议随 R2-7 补钉） |
| AD-17 | 藏经楼经验发给「任意已派遣弟子」（不必驻藏经楼），且升满自动免费升专业，绕过 `TRAIN` 的丹药消耗 | Round 3 修复三件套：`cc73d8b` store TICK 改调新增的 `core/study.js#grantScriptureXp`（照 `scriptureXpAward` 的账发放，只涨 xp、满条即止、永不改 profession）；`47a7f1e` `disciples/train.js#scriptureXp` 重写为照仙府账发放（仙府侧缺席才走同口径本地兜底），删除 `profession + 1` 分支；`277e937` UI 规则页探针扩为四处境（满条驻楼/空条驻楼/驻田/闲云），`scriptureRule` 返回 `{ autoPromote, accrues, hallOnly }` 自适应展示。终审探针（`274b40e`）：TICK 240s 后驻**灵田**弟子 xp=0、profession=1（不再普发）；驻**藏经楼**弟子 xp 封在 32（=xpNeeded）、profession=1（**免费晋阶不再发生**，晋阶只剩 TRAIN 付费一途） | 已消解 | — | Opus-1 + Opus-4 + GPT-sol-1 | ✅已修（Round 3 `cc73d8b`+`47a7f1e`+`277e937`，终审运行时复核通过；UI 修业文案随 `66b204b` 改口） |
| AD-18 | 离线效率未接线：BOOT/RESUME 结算曾走全效率 `produce` | HEAD 复核：`core/offline.js#settleOffline`（`07dae75`）banked 路径经 `offlineGain` 调 `mansion/production.js#offlineProduce`；direct 路径（阈值现为 60s，见 AD-16）**有意**满效率（「视为没离开」）。运行时复验：离线 1h、效率 0.56 档，pending 灵气 = 2207.5（折算值），府报「按聚灵阵折算 56% 收妥产出」，`offline:banked` 事件携带 efficiency；回归测锁定 | 已消解 | — | Opus-1 | ✅已修（ROUND1_BRIEF 第 1 号攻坚项落地。残留：挂机匣面板未展示效率百分比——Round 3 复认仍开：`ui/app.js` 挂机匣卡片无百分比字段，且为此备好的 `mansion/production.js#offlineEfficiencyDetail` 与 `ui/adapters.js#offlineEfficiency` 在 UI 层均零调用方，展示管线断在最后一米） |
| AD-19 | 邻接规则表与府邸光环扩充后 GDD 未同步 | HEAD 复核：GDD 已补「邻接规则」小节与产量四段乘区公式，数值与 `ADJACENCY_RULES` 逐条一致（滋田 15%+2%/级、润坊 10%、脉阵 12%、灌注 8%、荫庇 5%、燎田 -8%、熏苗 -5%），法器/建筑新表亦同步 | 已消解 | — | Fable-3 | ✅已修（残留：风水评分 `layoutReport` 未在 GDD 单列，属锦上添花） |
| AD-20 | 兽潮败战府报文案与税基矛盾（立案时：log 写「未入库」、实现收库存税） | HEAD 复核：`07dae75` 把实现改成未收取税后，府报已同口径（「未收取的产出尽数散失…库存分毫未动」并逐项列明），文案与机制不再矛盾 | 已消解（本条口径矛盾上移为 GDD vs 实现，统一在 AD-12 跟踪） | — | — | ✅已消解（Round 2 新增当轮即闭环；上游税基定案见 AD-12） |
| AD-21 | `RECRUIT` 无 rng 注入：`makeDisciple` 缺省用 `Math.random` 生成勤勉/武力，同一 action 序列重放弟子资质漂移（AD-3 勾销后 reducer 内仅剩的随机副作用） | Round 3 修复（`b1950b4`）：reducer 新增 `rollAptitude(action.rng)`——掷点在 reducer 内做完再传给 `makeDisciple`，与 BREAKTHROUGH 同规矩（可注入、缺省 `Math.random` 保持手感）。终审探针（`274b40e`）：注入同一 rng 序列双跑 RECRUIT，资质均为 diligent 15 / force 18（重放一致 ✓）；不注入时仍随机（缺省手感保留，属契约允许）。`makeDisciple` 自身的 `Math.random` 缺省仅剩兜底，store 调用点已全部显式传值 | 已消解 | — | Opus-1 + Opus-2 | ✅已修（Round 3 `b1950b4`，终审运行时复核通过） |
| AD-22 | 读档不强制不变式 2：`normalizeBuildings` 对非 mansion 等级只 clamp 到 999，篡改档可带「超洞府等级」建筑入局且产量按超限等级结算 | Round 3 修复双保险：`127e6f3` `normalizeBuildings` 尾部过 `capBuildingLevels`（非 mansion 等级压到 `mansionCap(mansionLevel).maxBuildingLevel`）；`fa12a27`/`b14705d` 仙府层 `normalizeLevel` 加硬顶 `LEVEL_MAX=12`（Infinity/大数/小数一并收敛）且结算路径改走 `effectiveLevel`（逐 tick 再压洞府上限）。终审探针（`274b40e`）：篡改档灵田 level=50（洞府 1 级）读档后 clamp 到 1，每秒灵草 0.58 与合法档逐位相同（此前 4.82，约 8.4 倍膨胀已堵死） | 已消解 | — | Opus-1 | ✅已修（Round 3 `127e6f3`+`fa12a27`+`b14705d`，终审运行时复核通过；§3.2 第 8 条例外注记已删） |

### 9.1 修订优先级建议（Round 2 版）

- **P0（本轮已清零）**：轮内曾开出的两处定案冲突（AD-8 槽型、AD-12 兽潮税）均已由
  `41048af` 唯一定案收敛（取实现侧口径、GDD 改述、万魂灯移槽保锚点），不再阻塞。
- **P1（设计一致性/正确性）**：AD-17 接线（`scriptureXpAward` 零调用方，仿 AD-18
  一处接线即可）、AD-13 余项（覆盖守卫）、AD-21（RECRUIT 注入）
- **P2（健壮性/体验/清理）**：AD-14、AD-16、AD-22、AD-11 余项（常数双份）、
  AD-15 残留（recruitCost 下沉）、AD-12 残留（`waveReward.loseTax` 死代码删除，
  GDD 已明文点名待机制所有者收口）
- **P3（跨文档同步——非本文档管辖，此处仅登记）**：`docs/ACCEPTANCE.md` G5.2/G5.4
  与 `docs/SOTA_CHECKLIST.md` R2-1/R2-2 仍按定案前状态记「未过/相撞」（`923d026`
  的复核基线 `893d94f` 早于 `41048af`），待其所有者按已定案口径改写销案
- **已完成（Round 2 勾销）**：AD-1、AD-2、AD-3、AD-4、AD-6、AD-7、AD-8（含轮内
  二次定案）、AD-9、AD-12（定案收敛）、AD-15、AD-18、AD-19、AD-20（消解）；
  **Round 1 已完成**：AD-5、AD-10

### 9.2 Round 3 终审快照（基线 `538162e`）

- 本轮修复批次经终审运行时复核后**打勾**：AD-16（阈值 60s，`bfb6aa6`；G6.3/R2-5
  随 `538162e` 销案）、AD-17（修业接线三件套 `cc73d8b`+`47a7f1e`+`277e937`，新增
  `core/study.js`）、AD-21（RECRUIT rng 注入，`b1950b4`）、AD-22（读档 + 结算双侧
  等级 clamp，`127e6f3`+`fa12a27`+`b14705d`）、AD-12 残留①②（loseTax 死代码删除
  `c9068c0` + G5.2/R2-2 残文改写 `538162e`）、AD-8 残留（G5.4/R2-1 残文销案
  `538162e`，全线闭环）。ROUND2_BRIEF 的 R2-6 回归缺口（bid 唯一 / `saveCorrupt`
  事件 / 8h 封顶）已由 `df4fc78` 补回三组断言——测试链 34 → **37 项全绿**，
  probe/bench 绿，checksum 1011.25 未漂（修业接线、clamp 与 `3e376be` 终盘数值
  改动均未碰在线产量口径）。
- **仍开清单**与所有权：
  **P1** AD-13 余项（`combat == null` 覆盖守卫，Opus-1——本轮修复批次未含，
  终审复现依旧）；
  **P2** AD-14 迁移链（Opus-1）、AD-11 余项（常数两显式副本 + adapters 兜底
  字面量，Opus-1）、AD-15 残留（recruitCost 仍在 `ui/util.js` 待下沉，Opus-4）、
  AD-18 残留（挂机匣面板仍无效率百分比，`offlineEfficiencyDetail` 管线在 UI 层
  仍零调用方，Opus-4）、AD-6 残留（saveCorrupt 仅 console 未进府报，Opus-1/Opus-4）、
  AD-12 残留③（`ui/screens.js` 兽潮页「散失三成」旧文案一句，四方一致的最后
  一方，Opus-4——G5.2 记未过直至清除）。
- 场外注记（非本文档管辖）：`3e376be` 已按 SOTA R2-4/R2-8 收口终盘平衡（还魂幡
  塔 38、飞升基准上调、41+ 倍率回落），纯 data/GDD 改动，架构与契约面无涉；
  60s 阈值边界与 UI 冒烟收编仍挂 SOTA R2-7。
- 本轮架构面变化已收编：`core/` 第七件 `study.js`（§2）、跨域例外 E-4/E-5（§2.1）、
  不变式 2 读档路径补齐（§3.2）、离线阈值 60s（§4.4）、掉落表 19 节点（AD-9 行）。
  零新立案，编号序列冻结在 AD-22。

每项修复必须附带回归单测（GPT-sol-1 在 `tests/` 补探针），并保持
`npm test` / `npm run probe` / `npm run bench` 全绿（`docs/ACCEPTANCE.md`；Round 3
终审时三者均绿，37 项单测通过）。
注意：Round 1 固化待修行为的「法器 FIFO 逐出」断言已随 AD-8 改写为槽型断言（简报
第 10 条完成）；「败仗只失未收取产出」「1/1/2 槽容量」两组断言锁定的口径已随
`41048af` 获得 GDD 背书，测试与设计自此同源，无需再改写。
