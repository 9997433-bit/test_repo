# 造化仙府 · 架构（v1.1 · Round 1 复审版）

> 本版为对照实际实现（基线 commit `419f9d7`，全部 16 项单测通过）逐文件核对后的复审稿。
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
core/        时钟、存档、事件、不可变式状态补丁
mansion/     地块、邻接、产量
disciples/   招募、派遣、训练
combat/      自动战、塔、兽潮、法器触发
progression/ 境界与突破
data/        纯数据表（无副作用）
```

### 2.1 依赖矩阵（按实际 import 核对）

| 模块 | 允许依赖 | 实际依赖（核对结果） |
| --- | --- | --- |
| `data/` | 无 | 无 ✓ |
| `mansion/` | `data/` | `data/buildings`、`disciples/assign`（跨域例外 E-1） |
| `disciples/` | `data/` | `data/heroes` ✓ |
| `progression/` | `data/` | `data/realms` ✓ |
| `combat/` | `data/`、`combat/` | `data/*`、`mansion/production`（跨域例外 E-2） |
| `core/store` | 所有 domain + `data/` | 组合根，见 2.2 ✓ |
| `core/engine` `core/save` `core/events` | 无 domain 依赖 | 无 ✓ |
| `ui/` | `core/store`（注入）、只读纯函数、`data/` | `data/*`、`mansion/{layout,production}`、`progression/realm` ✓ |

**跨域例外登记**（均为只读纯函数调用，允许存在，但必须登记）：

- E-1 `mansion/production.js` → `disciples/assign.js#yieldMultiplier`（产量按驻守弟子加成）
- E-2 `combat/battle.js` → `mansion/production.js#combatBuildingBonus`（丹房/锻造房加攻）

新增跨域依赖必须在此表登记，且只允许指向**无副作用纯函数**；禁止 domain 之间互相
读写对方状态切片。

### 2.2 组合根

`core/store.js` 是唯一的业务编排点：所有跨模块规则（扣费、守卫、日志、奖励发放）
集中在 `reduce(state, action)`。domain 模块只导出纯函数，不持有状态。
`ui/` 只做三件事：`dispatch(action)`、读 `store.get()`、调用只读纯函数做展示换算
（如 `produce(state, 1)` 显示每秒产量、`breakthroughChance` 显示破境率）——
UI 内不得出现独立的数值公式副本。

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
  equipped:  artifactId[],                // ≤ 4，FIFO（槽位约束见 AD-8）
  realm:     { index: 0..9, layer: ≥1, exp: ≥0, heartDemon: ≥0 },
  tower:     { floor: ≥1, best: ≥0 },
  wave:      { wave: ≥1, best: ≥0 },
  combat:    null | { kind: "tower"|"wave", result: SimResult & 元数据 },
  offline:   { pending: null | YieldMap },
  log:       [{ at: ms, text: string }],  // 最多 40 条，新在前
}
```

### 3.2 不变式（reducer 必须维持）

1. 每格 ≤ 1 建筑；`mansion` 全局唯一；建筑总数 ≤ `4 + 2 × mansionLevel`。
2. 非 mansion 建筑等级 ≤ mansion 等级；mansion 等级 ≤ 12（上限目前硬编码，见 AD-11）。
3. 每建筑 ≤ 1 驻守弟子（`ASSIGN` 抢占式：新派遣者顶替原驻守者）。
4. `equipped ⊆ ownedArtifacts` 且 `|equipped| ≤ 4`。
5. `party ⊆ unlockedHeroes` 且 `|party| ≤ 6`；主角（id 前缀 `mc-`）若已解锁必在阵中。
6. 资源不透支：扣费原子化（`pay` 全额成功或整体拒绝）；兽潮败战税 clamp 到 0。
7. 任何 reducer 分支返回的对象不得与输入 state 共享被修改的子树（写路径全浅拷贝）。

## 4. 状态机

### 4.1 应用门态

```
[gate]  meta.faction == null ──CHOOSE_FACTION──▶ [running]
```

- `gate` 态下 `TICK`、`BUILD` 直接拒绝（返回原 state）；`CHOOSE_FACTION` 幂等
  （已有阵营时 no-op）。`RESET` 从任意态回到 `gate`。

### 4.2 战斗（登天塔 / 兽潮共用）

```
combat == null ──START_TOWER / START_WAVE──▶ combat = { kind, result }
                 （dispatch 当帧即完成全程模拟，result 已含胜负与 frames）
combat != null ──RESOLVE_COMBAT──▶ combat = null
                 （唯一发奖/惩罚点；推进 floor/wave/best；发法器解锁）
combat != null ──START_*──▶ 覆盖旧 result（旧战斗作废、无奖励）※ 未守卫，见 AD-13
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

### 4.4 离线结算

```
BOOT ─▶ elapsed = clamp((now − meta.lastTick)/1000, 0, 8h)
     ─▶ yieldAdd = produce(loadedState, elapsed)      // 只按建筑产量，不模拟战斗
     ─▶ elapsed > 8s ? offline.pending = yieldAdd（入挂机匣，等 COLLECT_OFFLINE）
                     : resources 直接入账
```

## 5. 时钟

`engine` 以 `requestAnimationFrame` 驱动渲染，逻辑 tick 固定 `100ms`：

- 每帧 dt clamp ≤ 0.25s，累加器整步消费；`TICK` reducer 内再次 clamp dt ≤ 2s（双保险）。
- `TICK` 只推进产量（`produce`）与藏经楼经验（`scriptureXp`），不做战斗。
- 后台标签页 rAF 停摆：恢复时首帧 dt 被钳到 0.25s，其间时间**丢失**（无
  `visibilitychange` 补结算），见 AD-7。

离线：`min(elapsed, 8h)` 按建筑产量结算，不模拟逐帧战斗（见 4.4 精确流程）。

## 6. 存档

`localStorage["zaohua-xianfu-v1"]`，磁盘格式为信封结构：

```
{ schemaVersion: 1, state: <3.1 状态树>, savedAt: ms }
```

- 信封与 `state.schemaVersion` 双写；`loadSave` 只校验信封版本，版本不符或 JSON
  损坏一律返回 `null` → BOOT 回退默认档。**「记 saveCorrupt 事件」尚未实现**（AD-6）。
- 持久化节流：非 `TICK` action 每次 dispatch 后立即写盘；`TICK` 至多每 4s 写一次。
- 迁移策略：升 schema 版本时必须提供 `migrate[v] : stateV → stateV+1` 链，禁止直接
  弃档（现状是弃档，见 AD-14）。
- 已知隐患：`state.combat.result.frames`（≤240 帧 × 全单位快照）随存档整体写入
  localStorage，见 AD-2。

## 7. 战斗

纯函数 `simulate(input)`（输入/输出 schema 见 `API_CONTRACT.md` §4）。
UI 只回放 `frames[]`。测试可对同一 seed 断言确定性（`tests/combat.test.js` 已断言）。

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
3. 存储层全部 try/catch 吞错：`loadSave → null`、`writeSave → false`、`clearSave`
   静默；localStorage 不可用（隐私模式）时游戏以纯内存态继续运行。
4. reducer 纯度豁免清单（除此以外禁止副作用）：
   - `BOOT` 未携带 `loaded` 字段时读 localStorage（可注入 `loaded` 保持纯净，测试用）；
   - `RESET` 调 `clearSave()`；
   - `pushLog` 用 `Date.now()` 打时间戳（待改为取 `action.now`，见 AD-3）。

## 9. 架构债登记簿（可执行修订清单）

复审中逐项核对实现后立案。每项含证据、影响、修订动作与所有者（所有权表见
`/.agent_workspace/PROGRESS.md`）。**本轮只立案不改码**；修复后在本表勾销。

| # | 债项 | 证据 | 影响 | 修订动作 | Owner |
| --- | --- | --- | --- | --- | --- |
| AD-1 | 建筑 ID 用模块级计数器 `bid`，刷新后从 1 重数 | `core/store.js`（`let bid = 1`；`CHOOSE_FACTION` 置 10）。运行时已验证：老档含 `b-10`，新进程第 10 次建造再发 `b-10` → ID 碰撞，派遣/升级错乱 | 高：老玩家必踩 | ID 改由 state 派生：追加 `meta.nextBuildingId`（BOOT 时若缺则取 `max(现有 id)+1` 回填），弃用模块变量；`disciples/roster.js` 的 `seq` 同理 | Opus-1 |
| AD-2 | `combat.result.frames` 全量持久化 | `START_*` 后 dispatch 立即 `writeSave`，240 帧 × 单位快照进 localStorage | 中：存档膨胀、写盘变慢 | `writeSave` 前剥离 `combat.result.frames`（回放帧仅内存持有）；存档只留 `{kind, seed, winner, floor/wave, ticks}`，BOOT 后若需回放可用 seed 重算 | Opus-1 |
| AD-3 | reducer 内非注入副作用：`pushLog` 用 `Date.now()` | `core/store.js#pushLog` | 中：同一 action 序列重放得到不同 log 时间戳，破坏时间旅行断言 | `pushLog(state, text, at)`，`at` 从 `action.now` 传入；BOOT/RESET 的存储副作用移入 store shell 或维持豁免清单（§8.4） | Opus-1 |
| AD-4 | `core/events.js#createBus` 与 `combat/artifacts.js#applyTriggers` 均为死代码；法器触发全部硬编码在 `battle.js` 的 `hasArtifact` 分支 | 全仓 grep 无调用点 | 中：加新法器要改战斗内核，违背 data 驱动分层 | battle 主循环发事件（start/tick/hit/skill/death/lowhp）经 `applyTriggers` 数据驱动结算；`createBus` 接到 store→UI 通知（如 saveCorrupt、法器解锁 toast），或明确标注「预留」 | Opus-3 |
| AD-5 | `passives.ultHaste` 无效：技能节奏被固定「每 5 tick」覆盖 | `battle.js` 先按 `ultCd/haste` 计算 `skill` 又立即覆写；运行时验证：装备太虚金丹鼎与否，同 seed 逐帧 HP 完全一致 | 高：红品法器「太虚金丹鼎」与九天玄女技能均为摆设 | 删除覆写行，让 `Math.round(ultCd/haste)` 生效并补单测（装备 taixu 后同 seed 结果必须不同） | Opus-3 |
| AD-6 | 存档损坏静默回退，未记 `saveCorrupt` | `core/save.js` catch 后返回 null，无任何事件/日志 | 低：玩家丢档无感知、无法排障 | `loadSave` 返回 `{ state, corrupt }`；BOOT 时 corrupt 则 `pushLog("存档受损，已回退新档")` 并经 bus 发 `saveCorrupt` | Opus-1 |
| AD-7 | 切后台无补结算 | `engine.js` dt clamp 0.25s；无 `visibilitychange` 钩子 | 中：挂机游戏切标签页即停产 | `document.visibilitychange`（hidden→visible）触发一次 BOOT 同款离线结算（复用 4.4 流程，走已有 action，无新 action） | Opus-1 |
| AD-8 | 法器槽位未实施：`EQUIP_ARTIFACT` 忽略 `slot`，4 件 FIFO，可 4 件攻击法器同佩 | `core/store.js` EQUIP 分支；数据表每件已有 `slot` 字段 | 中：与 GDD「攻/防/通/通」四槽冲突，数值失衡 | reducer 按 `slot` 落位（attack×1、defend×1、util×2），同槽替换而非 FIFO；契约 payload 的 `slot` 字段从「忽略」升级为「生效」（追加语义，不改字段名） | Opus-3 + Opus-1 |
| AD-9 | 5 件法器无获取途径：yinyang、zhenyue、huagu、taixu、qinglong | 掉落点仅塔 best 5/10/15（zhumo/wanhun/zhuque）与兽潮 best 5/8（canyang/yaoguang），初始 qixing/lundao | 中：内容缺口，图鉴永远集不齐 | 在塔 20/25/30 层与兽潮 12/16 波追加掉落位，或锻造房合成配方 | Fable-3（数据）+ Opus-3（发放） |
| AD-10 | 英雄技能与数据表描述不符：猪八戒嘲讽、玉面公主降命中未实现（无命中属性）；九天玄女大招冷却 -20% 因 AD-5 无效；后羿「对后排 +35% 伤害」实现为「优先攻击后排」 | `battle.js` 对照 `data/heroes.js` skillDesc | 中：文案欺骗玩家 | 每个 heroId 的实现语义在 GDD 中如实改写，或补实现（嘲讽=强制目标 3s、命中=miss 概率）；AD-5 修复后玄女自动生效 | Opus-3 / Fable-3 |
| AD-11 | mansion 等级上限 12 硬编码在 reducer | `core/store.js` UPGRADE 分支 | 低 | 上限迁入 `data/buildings.js`（如 `BUILDING_TYPES.mansion.maxLevel`），reducer 读表 | Opus-1 + Fable-3 |
| AD-12 | 兽潮败战税基与 GDD 不符：GDD 写「损失当波 30% **未收取**资源」，实现按**库存** herb/wood/ore 各扣 30% | `combat/wave.js#waveReward` + RESOLVE 分支 | 中：库存越多惩罚越重，与「守门保收成」的设计动机相反 | 二选一并同步文档：a) 税基改为本波挑战期间的产出快照；b) GDD 改为「库存三成」。推荐 a | Fable-3 定案，Opus-3 实施 |
| AD-13 | `START_TOWER` / `START_WAVE` 无守卫：未选阵营、空阵容、已有未结算战斗时均可发起并覆盖旧结果 | `core/store.js` 两分支无任何前置检查 | 低-中：误触丢奖励 | 追加守卫：`meta.faction && party.length > 0 && combat == null`，违反则 pushLog 拒绝；契约同步（不改 action 名） | Opus-1 |
| AD-14 | schema 版本不符直接弃档，无迁移链 | `core/save.js#loadSave` | 低（v1 期）→ 高（升 v2 时） | 建 `migrations = { 1: v1→v2, ... }`，loadSave 逐级迁移；信封与 state 双写版本保持一致性校验 | Opus-1 |
| AD-15 | 招募 UI 文案固定「礼聘 6仙玉」，实际 dps 为 8 仙玉 + 40 灵石；且 reducer 不限制跨阵营招募（UI 过滤了，dispatch 可绕过） | `ui/screens.js#disciplesView` vs `core/store.js` RECRUIT | 低 | UI 读 `recruitCost(hero)`（新导出纯函数）渲染真实价格；reducer 追加同阵营守卫或在 GDD 明确允许跨阵营 | Opus-4 + Fable-3 |
| AD-16 | 离线挂机匣阈值 8 秒过低：离开 >8s 即弹匣，短暂刷新也走「待领取」路径 | `core/store.js` BOOT 分支 `elapsed > 8` | 低：体验噪音 | 阈值提为 ≥60s（60s 内直接入账）；数值由 Fable-3 定案后改常量 | Opus-1 |
| AD-17 | 藏经楼经验发给「任意已派遣弟子」（不必驻藏经楼），且升满自动免费升专业，绕过 `TRAIN` 的丹药消耗 | `disciples/train.js#scriptureXp`：只要存在藏经楼，所有 `buildingId != null` 的弟子共享速率 | 中：训练消耗体系被架空 | 语义定案：a) 只有驻藏经楼弟子得经验；b) 经验满只解锁「可传功」状态，仍需 TRAIN 付费。推荐 b | Opus-4 定实现，Fable-3 定数值 |

### 9.1 修订优先级建议

- **P0（正确性）**：AD-1（ID 碰撞）、AD-5（红品法器无效）、AD-2（存档膨胀）
- **P1（设计一致性）**：AD-8、AD-12、AD-17、AD-10、AD-13
- **P2（健壮性/体验）**：AD-3、AD-6、AD-7、AD-14、AD-16、AD-9、AD-11、AD-15

每项修复必须附带回归单测（GPT-sol-1 在 `tests/` 补探针），并保持
`npm test` / `npm run probe` / `npm run bench` 全绿（`docs/ACCEPTANCE.md`）。
