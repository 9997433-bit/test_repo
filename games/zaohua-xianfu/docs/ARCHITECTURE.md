# 造化仙府 · 架构（v1.2 · Round 2 复审版）

> 复审基线：HEAD `9a8b443`。含两批 Round 2 提交：`21a7ff8`（离线结算 / 存档加固 /
> reducer 守卫合并）与其后的 `07dae75`（离线效率接线、槽型、兽潮税）、`12ff624`/
> `97b32e2`（applyTriggers 接线、万魂灯口径）、`dbd7c96`（修业口径落地）、`893d94f`
> （GDD 拍板）、`9a8b443`（UI 槽位口径）等。已对照 `.agent_workspace/ROUND1_BRIEF.md`
> 遗留清单逐项**运行时复核**（34 项单测、probe、bench 全绿），并更新第 9 节登记簿。
> ⚠ 本轮发现两处**实现与 GDD 各自拍板、方向相反**的冲突（AD-8 槽型方案、AD-12 兽潮
> 税基），见 §9 与 §9.1 P0。
> v1.1（Round 1 复审版，基线 `419f9d7`）的立案编号全部保留，只追加不删除。
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
（总线，已接线）、`engine.js`（时钟）。

### 2.1 依赖矩阵（按实际 import 核对）

| 模块 | 允许依赖 | 实际依赖（核对结果） |
| --- | --- | --- |
| `data/` | 无 | 无 ✓ |
| `mansion/` | `data/` | `data/buildings`（经 `mansion/buildings.js` 归一化包装 + 缓存）、`disciples/assign`（跨域例外 E-1） |
| `disciples/` | `data/` | `data/heroes` ✓ |
| `progression/` | `data/` | `data/realms` ✓ |
| `combat/` | `data/`、`combat/` | `data/*`、`mansion/production`（跨域例外 E-2）；法器数值经 `artifactLoadout` 全量取自 `data/artifacts.js`，英雄技能集中在 `KITS` 表 |
| `core/store` | 所有 domain + `data/` | 组合根，见 2.2 ✓ |
| `core/state` | `data/`、`core/save` | `data/{buildings,heroes,artifacts,realms}`（收敛与快照是组合根的拆分件） ✓ |
| `core/offline` | `core/state`、组合根例外 E-3 | `mansion/production#produce`（离线结算编排，随 store 拆出） |
| `core/engine` `core/save` `core/events` | 无 domain 依赖 | 无 ✓ |
| `ui/` | `core/store`（注入）、只读纯函数、`data/` | `data/*`、`mansion/{layout,production,buildings}`、`progression/realm`；展示换算集中在 `ui/adapters.js` ✓ |

**跨域例外登记**（均为只读纯函数调用，允许存在，但必须登记）：

- E-1 `mansion/production.js` → `disciples/assign.js#yieldMultiplier`（产量按驻守弟子加成）
- E-2 `combat/battle.js` → `mansion/production.js#combatBuildingBonus`（丹房/锻造房加攻）
- E-3 `core/offline.js` → `mansion/production.js#offlineProduce / produce`（Round 2
  新增：离线结算从 store 拆出后带走的组合根依赖；`07dae75` 起按能力探测优先调
  `offlineProduce`，契约缺席时退回满效率而不是崩在导入上）

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
                                          // （⚠方案与 GDD 拍板冲突，见 AD-8）
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
   mansion 等级 ≤ 12（常数仍复制两处，见 AD-11；读档路径不校验本条，见 AD-22）。
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
   重复建筑 id 重发、派遣引用自洽、数值 clamp 回合法域。例外：不变式 2 的
   「非 mansion 等级 ≤ mansion 等级」未在此路径强制（AD-22）。

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
                 运行时复验（HEAD）：连发两次 START_TOWER，第二次 seed 顶掉第一次
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
  ─▶ seconds ≤ 8s ? gain = produce(state, seconds) 满效率直接入账
                    （mode=direct，「没离开」不折算，有意为之）
                  : gain = offlineProduce(state, seconds)   // 按聚灵阵折算
                    offline.pending = mergeYield(旧 pending, gain)，seconds 累加，
                    府报注明折算百分比（mode=banked，等 COLLECT_OFFLINE）
  ─▶ meta.lastTick 无条件推进到 now；bus 播 offlineBanked（带 efficiency）/ offlineApplied
```

- 未领取的挂机匣**跨多次 BOOT/RESUME 合并**而非覆盖（Round 2 新行为）。
- **AD-18 已修**（`07dae75`）：banked 路径经 `offlineGain` 调 `offlineProduce`
  （底 50%、每级聚灵阵 +6%、封顶 90%）。HEAD 运行时复验：离线 1h、效率 0.56 的档，
  pending 灵气 = 2207.5（折算值），府报「按聚灵阵折算 56% 收妥产出」。
  残留：挂机匣面板未展示效率百分比（仅府报与事件携带）。

## 5. 时钟

`engine` 以 `requestAnimationFrame` 驱动渲染，逻辑 tick 固定 `100ms`：

- 每帧 dt clamp ≤ 0.25s，累加器整步消费、单帧最多补 20 tick（`MAX_CATCHUP_TICKS`，
  卡顿不滚雪球）；`TICK` reducer 内再次 clamp dt ≤ 2s（双保险），且 `lastTick`
  只单调前进（`max(action.now, lastTick)`）。
- `TICK` 只推进产量（`produce`）与藏经楼经验（`scriptureXp`），不做战斗。
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
   - `RECRUIT` 经 `makeDisciple` 用 `Math.random` 生成弟子资质，**无注入点**——
     新立案 AD-21。

## 9. 架构债登记簿（可执行修订清单）

复审中逐项核对实现后立案；Round 2 已对照 HEAD（`9a8b443`）**运行时复核**一遍
「状态」列：已修项打勾并给出落地证据，仍开项更新为 HEAD 证据。编号只追加不删除，
修复后保留条目供审计。每项含证据、影响、修订动作与所有者
（所有权表见 `/.agent_workspace/PROGRESS.md`）。本文档只立案不改码。

| # | 债项 | 证据 | 影响 | 修订动作 | Owner | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| AD-1 | 建筑 ID 用模块级计数器 `bid`，刷新后从 1 重数 | Round 1：`core/store.js`（`let bid = 1`）运行时验证 ID 碰撞 | 高：老玩家必踩 | ID 改由 state 派生；`disciples/roster.js` 的 `seq` 同理 | Opus-1 | ✅已修（`21a7ff8`：`core/state.js#nextBuildingId` 取现存 `b-N` 最大值 +1；`normalizeState` 读档对撞号 id 重发；弟子 id 改确定性 `d-<heroId>`。残留：roster 的 `seq` 兜底仍在，但 store 全部调用点显式传 id，不入档） |
| AD-2 | `combat.result.frames` 全量持久化 | Round 1：`START_*` 后 240 帧 × 单位快照进 localStorage | 中：存档膨胀、写盘变慢 | `writeSave` 前剥离回放帧 | Opus-1 | ✅已修（`core/state.js#snapshotForSave` 落盘只留**末帧**，存档约 1.4KB；写失败播 `saveFailed` 并自动重试，`flush()` 关页兜底） |
| AD-3 | reducer 内非注入副作用：`pushLog` 用 `Date.now()` | Round 1：`core/store.js#pushLog` | 中：重放 log 时间戳漂移 | `pushLog(state, text, at)` 取 `action.now`；存储副作用移入 store shell | Opus-1 | ✅已修（`pushLog` 第三参取 `action.now`，仅缺省时兜底 `Date.now()`；RESET 清盘与 BOOT 读盘移入 dispatch 外壳，见 §8.5。同类余留：RECRUIT 的 `Math.random`，另立 AD-21） |
| AD-4 | 法器触发硬编码在战斗内核；`applyTriggers` / `createBus` 死代码 | HEAD：法器数值已数据驱动；`createBus` 已被 store 外壳接线（save/offline 事件，`main.js` 监听）；`applyTriggers` 经 `battle.js#fire` 接线，负责战报署名（`by` 字段 + `result.artifacts` 汇总） | 已消解 | — | Opus-3 + Opus-1 | ✅已修（bus `21a7ff8`；applyTriggers `12ff624`，触发条件单源于 `loadout.sources`，不再两处各写一份） |
| AD-5 | `passives.ultHaste` 无效：技能节奏被固定「每 5 tick」覆盖 | 基线 `battle.js` 覆写 `skill` 变量；运行时验证：装备太虚金丹鼎与否同 seed 逐帧全等 | 高：红品法器「太虚金丹鼎」与九天玄女技能均为摆设 | 大招独立计时器 + 开场按 `1+ultHaste` 压缩周期 | Opus-3 | ✅已修（`c57957e`，HEAD 运行时复验：装备 taixu 同 seed 结果已不同） |
| AD-6 | 存档损坏静默回退，未记 `saveCorrupt` | Round 1：`core/save.js` catch 后返回 null，无事件/日志 | 低：玩家丢档无感知 | 读档区分状态并播事件 | Opus-1 | ✅已修（`readSave` 状态机 empty/ok/corrupt/unsupported/unavailable；坏档 `backupCorrupt` 备份到旁路键 `zaohua-xianfu-v1:corrupt`；bus 播 `saveCorrupt`。残留：`main.js` 仅 console.warn，未进府报 log） |
| AD-7 | 切后台无补结算 | Round 1：`engine.js` 无 `visibilitychange` 钩子 | 中：挂机游戏切标签页即停产 | 复用 4.4 流程补结算 | Opus-1 | ✅已修（新 `RESUME` action：engine 帧间墙钟跳变 >5s 自动 dispatch；`main.js` 挂 `visibilitychange`（hidden→`flush`，visible→`RESUME`）与 `pagehide`→`flush`） |
| AD-8 | 法器槽位未实施：`EQUIP_ARTIFACT` 忽略 `slot`，4 件 FIFO，可 4 件攻击法器同佩 | HEAD 复核：**机制已落地**（`07dae75`：`core/state.js#equipArtifact` 按数据表槽型落位 attack×1/defend×1/util×2、同槽 FIFO 顶掉最早、`normalizeEquipped` 读档收敛；测试改写为槽型断言、UI 按同槽淘汰口径展示 `9a8b443`）。**但方案与 GDD 拍板相反**：GDD「槽型口径」（`893d94f`，更晚提交）拍板为 攻×1/防×1/通×1/**万用×1**，明言基准四件套（七星灯+万魂灯双防+论道图+朱雀弓）「必须仍可同时佩戴」——运行时复验：现实现下依序佩戴四件套只剩 3 件（七星灯被万魂灯同槽顶掉），**进度墙校准锚点被破坏** | 高：实现/测试/UI 与 GDD 各自拍板且互斥；仿真锚点失效牵连整张进度墙 | 二次定案唯一方案：a) 实现改为 GDD 的万用槽制（并按 GDD 的重放式存档迁移）；b) GDD 改认 1/1/2 制并重标进度墙。定案后改另一侧 + 测试 | Fable-3 + Opus-1 + GPT-sol-1 **二次定案** | ⚠部分收敛（FIFO 已废、槽型已生效；槽型方案冲突新开，Round 2 复核发现） |
| AD-9 | 大量法器无获取途径 | HEAD 复核：`ARTIFACT_DROPS` 已补全 18 节点（塔 5..40 共 11、潮 5..20 共 7，正好覆盖 20 件中非初始的 18 件）；store 的 `dropTable(via)` 改读该表派生发放（`893d94f` + `07dae75`），回归测断言按 data 表发放 | 已消解 | — | Fable-3 + Opus-1 | ✅已修（单一事实源接线完成。残留：`data/artifacts.js` 表头注释仍写「store 现存硬编码…本轮改读本表后删除」，已过时待清理） |
| AD-10 | 英雄技能与数据表描述不符：猪八戒嘲讽、玉面公主降命中、玄女大招冷却、后羿后排增伤 | 基线 `battle.js` 对照 `data/heroes.js` skillDesc | 中：文案欺骗玩家 | KITS 技能表实现嘲讽（taunt 3s）、致盲（miss 12%）、teamUltHaste 20%、后排 ×1.35 | Opus-3 | ✅已修（`c57957e` KITS 表） |
| AD-11 | mansion 等级上限 12 硬编码在 reducer | HEAD 复核：非 mansion 上限已改读 `data/buildings.js#mansionCap` ✓；但 `MANSION_MAX_LEVEL=12` 现复制**两处**（`core/state.js` 与 `mansion/buildings.js` 各一份，store 读前者），比 Round 1 多了一份副本 | 低 | 保留单一常数源（建议 `mansion/buildings.js`），`core/state` 转引 | Opus-1 | 部分修复（cap 接线 ✓，常数反向漂移成双份） |
| AD-12 | 兽潮败战税基两套口径 | HEAD 复核发现**双方相向而行**：实现（`07dae75`，Opus-1）走 **a 路线**——`core/store.js#waveLossTax` 只没收「未收取产出」（挂机匣 pending 全失 + ≤2s 未入账尾巴作废），库存分毫不动，府报同口径，`tests/regressions.test.js` 已锁定（运行时复验：herb 库存 100 保持、pending 清空）；而 GDD「败仗税口径」小节（`893d94f`，**更晚**提交，Fable-3）拍板 **b 路线**库存三成、声称「现实现即为准」（写下时实现已是 a）、并明文废弃 a 路线且要求把府报改成库存措辞。另：`combat/wave.js#waveReward` 败战分支的 `loseTax`（库存 30%）已成**死代码**（store 不再调用） | 高：GDD 与实现/测试直接矛盾，兽潮节的「推潮前先花掉资源」策略文案误导玩家 | 唯一定案：a) 保留现实现，重写 GDD 败仗税小节与兽潮节文案、删 `waveReward.loseTax` 死代码；b) 采 GDD，实现回退库存税并改测试与府报。任一方向都须同步三处（GDD/实现/测试） | Fable-3 + Opus-1 + GPT-sol-1 **二次定案** | ⚠未收敛（Round 2 反向重开：实现 a、GDD 拍板 b） |
| AD-13 | `START_TOWER` / `START_WAVE` 无守卫：未选阵营、空阵容、已有未结算战斗时均可发起并覆盖旧结果 | HEAD 复核：`!meta.faction || !party.length` 静默守卫已加 ✓；`combat == null` 覆盖守卫仍缺——运行时复验：连发两次 START_TOWER，第二次 seed 顶掉第一次（旧战斗作废无奖励） | 低-中：误触丢奖励 | 补 `combat == null` 守卫，违反则 pushLog 拒绝（不改 action 名） | Opus-1 | 部分修复（阵营/空阵容 ✓，覆盖守卫仍开） |
| AD-14 | schema 版本不符直接弃档，无迁移链 | HEAD 复核：`readSave` 对 unsupported 返回 null 弃档；新增缓解——坏档/旧档先 `backupCorrupt` 备份旁路键再回退 | 低（v1 期）→ 高（升 v2 时） | 建 `migrations = { 1: v1→v2, ... }`，逐级迁移；升版时可从旁路键找回 | Opus-1 | 未修（已缓解：旁路备份到位，迁移链仍缺） |
| AD-15 | 招募 UI 价格文案与真实费用不符；reducer 不限制跨阵营招募 | HEAD 复核：RECRUIT 已加 `hero.faction !== meta.faction` 静默守卫 ✓；UI 经 `recruitCost(hero)` 渲染真实价格（`8 仙玉 + 40 灵石` 级差生效）✓ | 低 | — | Opus-4 + Fable-3 | ✅已修（残留：`recruitCost` 落在 `ui/util.js`，是 §2.2 禁止的 UI 公式副本，应下沉 domain/data 并让 store 同源） |
| AD-16 | 离线挂机匣阈值 8 秒过低：离开 >8s 即弹匣，短暂刷新也走「待领取」路径 | HEAD 复核：阈值仍 8s，现为命名常数 `core/offline.js#OFFLINE_DIRECT_SEC`（改一处即可生效） | 低：体验噪音 | 阈值提为 ≥60s；数值由 Fable-3 定案后改常量 | Opus-1 + Fable-3 | 未修（Round 2 复核仍开，已收敛为单常数） |
| AD-17 | 藏经楼经验发给「任意已派遣弟子」（不必驻藏经楼），且升满自动免费升专业，绕过 `TRAIN` 的丹药消耗 | HEAD 复核：**口径已按 b 路线在 mansion 层落地但未接线**——`mansion/production.js`（`dbd7c96`）新增 `scriptureXpAward/scriptureXpFor/scriptureXpPerSec/xpAt` 并注释明书「AD-17 仙府侧口径：只有驻在该藏经楼的弟子领修业；修业满仅代表可晋阶，晋阶仍由 TRAIN 支付」；但 store 的 TICK 仍调旧 `disciples/train.js#scriptureXp`，`scriptureXpAward` 全仓**零调用方**。运行时复验：驻灵田的弟子修业满仍免费 `profession+1`（AD-18 同款「落地未接线」模式） | 中：训练消耗体系仍被架空；两套修业函数并存易再漂移 | store TICK 改调 `mansion/production.js#scriptureXpAward`（或让 `disciples/train.js` 转发新口径），废弃旧 `scriptureXp`；补「驻楼限定 + 免费晋阶不再发生」回归测 | Opus-1 接线 + GPT-sol-1 | 部分修复（口径落地 ✓，接线仍开——Round 2 复核发现） |
| AD-18 | 离线效率未接线：BOOT/RESUME 结算曾走全效率 `produce` | HEAD 复核：`core/offline.js#settleOffline`（`07dae75`）banked 路径经 `offlineGain` 调 `mansion/production.js#offlineProduce`；≤8s 的 direct 路径**有意**满效率（「视为没离开」）。运行时复验：离线 1h、效率 0.56 档，pending 灵气 = 2207.5（折算值），府报「按聚灵阵折算 56% 收妥产出」，`offline:banked` 事件携带 efficiency；回归测锁定 | 已消解 | — | Opus-1 | ✅已修（ROUND1_BRIEF 第 1 号攻坚项落地。残留：挂机匣面板未展示效率百分比，仅府报/事件） |
| AD-19 | 邻接规则表与府邸光环扩充后 GDD 未同步 | HEAD 复核：GDD 已补「邻接规则」小节与产量四段乘区公式，数值与 `ADJACENCY_RULES` 逐条一致（滋田 15%+2%/级、润坊 10%、脉阵 12%、灌注 8%、荫庇 5%、燎田 -8%、熏苗 -5%），法器/建筑新表亦同步 | 已消解 | — | Fable-3 | ✅已修（残留：风水评分 `layoutReport` 未在 GDD 单列，属锦上添花） |
| AD-20 | 兽潮败战府报文案与税基矛盾（立案时：log 写「未入库」、实现收库存税） | HEAD 复核：`07dae75` 把实现改成未收取税后，府报已同口径（「未收取的产出尽数散失…库存分毫未动」并逐项列明），文案与机制不再矛盾 | 已消解（本条口径矛盾上移为 GDD vs 实现，统一在 AD-12 跟踪） | — | — | ✅已消解（Round 2 新增当轮即闭环；上游税基定案见 AD-12） |
| AD-21 | `RECRUIT` 无 rng 注入：`makeDisciple` 缺省用 `Math.random` 生成勤勉/武力，同一 action 序列重放弟子资质漂移（AD-3 勾销后 reducer 内仅剩的随机副作用） | `disciples/roster.js#makeDisciple` + `core/store.js` RECRUIT 分支；运行时验证：同参双调 `makeDisciple` 资质不同 | 中：破坏时间旅行断言；玩家可刷新档刷资质 | RECRUIT 收 `action.rng` 注入（缺省 Math.random 保持手感），或资质由 heroId + 开档 seed 稳定推导（`discipleFlavor` 已示范 hash 法） | Opus-1 + Opus-2 | 未修（Round 2 新增） |
| AD-22 | 读档不强制不变式 2：`normalizeBuildings` 对非 mansion 等级只 clamp 到 999，篡改档可带「超洞府等级」建筑入局且产量按超限等级结算 | `core/state.js#normalizeBuildings`（`maxLevel = b.type === "mansion" ? 12 : 999`） | 低：单机可容忍，但与 §3.2 不变式 2 冲突，属规范漂移 | clamp 到 `mansionCap(mansionLevel).maxBuildingLevel`；或在 §3.2 明示「该条仅 UPGRADE 路径保证」 | Opus-1 | 未修（Round 2 新增） |

### 9.1 修订优先级建议（Round 2 版）

- **P0（定案冲突——实现与 GDD 各自拍板且互斥，必须先唯一定案再改另一侧）**：
  AD-12（兽潮税：实现走 a「未收取产出」且测试锁定，GDD 更晚拍板 b「库存三成」且
  声称从实——声明失真）、AD-8 余项（槽型：实现/测试/UI 走 1 攻/1 防/2 通同槽淘汰，
  GDD 拍板 攻/防/通/万用且基准四件套双防必须可同佩——现实现下装不下，校准锚点破坏）
- **P1（设计一致性/正确性）**：AD-17 接线（`scriptureXpAward` 零调用方，仿 AD-18
  一处接线即可）、AD-13 余项（覆盖守卫）、AD-21（RECRUIT 注入）
- **P2（健壮性/体验/清理）**：AD-14、AD-16、AD-22、AD-11 余项（常数双份）、
  AD-15 残留（recruitCost 下沉）、`waveReward.loseTax` 死代码与 `ARTIFACT_DROPS`
  过时注释（随 AD-12/AD-9 定案清理）
- **已完成（Round 2 勾销）**：AD-1、AD-2、AD-3、AD-4、AD-6、AD-7、AD-9、AD-15、
  AD-18、AD-19、AD-20（消解）；**Round 1 已完成**：AD-5、AD-10

每项修复必须附带回归单测（GPT-sol-1 在 `tests/` 补探针），并保持
`npm test` / `npm run probe` / `npm run bench` 全绿（`docs/ACCEPTANCE.md`；本轮复核
时三者均绿，34 项单测通过）。
注意：Round 1 固化待修行为的「法器 FIFO 逐出」断言已随 AD-8 改写为槽型断言（简报
第 10 条完成）；现行「败仗只失未收取产出」「1/1/2 槽容量」两组断言锁定的是**与
GDD 拍板相悖的实现**——AD-12 / AD-8 二次定案若倒向 GDD，须连测试一并改写。
