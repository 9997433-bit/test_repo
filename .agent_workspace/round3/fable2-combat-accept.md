MODEL_SLUG: claude-fable-5-thinking-xhigh

# Round 3 · fable-2 战斗/内容 SOTA 复审 — timeline 补字段验收单（opus-3 执行）

> 复审对象：`js/combat/**`、`js/data/skills.js`、`js/ui/fx/battleStage.js`（分支 `cursor/bingqi-wangzhe-c054` 现头）。
> 本单只冻结**数据契约**（opus-3 所有权 `js/combat/**`）；图标 SVG、弹道演出、BOSS 镜头属 opus-4（`js/ui/**`），不在本单。
> 结论先行：R2 清单八步已全部落地（详见 §0），R3 只欠 **3 组 emit payload 增键**，全部不动 rng 消耗次序，`ENGINE_VERSION` 保持 2。

---

## 0. R2 落地核验（勿重做）

| R2 条目 | 核验结果 |
| --- | --- |
| §1.1 别名表（12+3 神话模板） | `combat/skills.js` `LEGACY_SKILL_ALIASES`/`SKILL_ALIASES` 已含全部条目 |
| §1.3 `DATA_SKILL_ARCHETYPES` 53 条显式映射 | 已落地，`getSkill` 解析顺序 LIBRARY→ALIASES→DATA→synthesize 正确 |
| A2 resolver 元素跟随 `ctx.skill.element` | `castElement()` 已实现，blaze/frost/chain 三处硬编码已消除 |
| §3.2 `EVENT_ALIASES` + 6 值规范 `type` | `engine.js` 已实现（`type`/`subtype`/`t` 三写，emit 后置防覆写），`index.js` 转出 |
| `ENGINE_VERSION` 1→2 | 已升版，注释含 v2 变更说明 |
| §2 `elementMultiplier` 导出面 | `engine.js` 与 `index.js` 均可按名 import，`tests/run.mjs` 探针绿 |
| I-4/I-13 相关不变量 | `seq` 严格 +1、`kill` 置 `alive=false` 后不可重杀，代码路径成立 |

尚缺（= 本单 §1–§3）：`status`/`dot` 事件无图标数据、`skill` 事件无 AOE/targeting 信息、boss 标记只存在于 start/wave 的 `unitSnapshot`（`battleStage.makeChip` 靠它加 `is-boss` class，但逐事件演出无从特判）。

---

## 1. 必补字段 F1 — 状态图标 id（status icon id）

现状：`STATUS_INFO` 只有 `{id, name, kind, bad}`；`emit('status')` 载荷为 `statusId/status/turns/value/bad`，`element` 在 emit 处被丢弃；`ui/icons.js` 无任何状态图标；`battleStage.applyEngineEvent` 对 `status` 子类型无演出分支——图标行完全无数据可驱动。

### 1.1 `STATUS_INFO` 增加 `icon` 字段（冻结表）

icon 是**稳定 slug 标识符**，不是渲染资产（SVG 归 opus-4 `ui/icons.js` 新建 `STATUS_ICON` 映射）。首版取恒等映射，日后 statusId 若改名，icon 不随动，UI 资产键永不漂移：

| statusId | icon（冻结） | 视觉母题（仅供 opus-4 参考，不约束） |
| --- | --- | --- |
| `burn` | `burn` | 火苗 |
| `chill` | `chill` | 雪花 |
| `freeze` | `freeze` | 冰晶锁 |
| `shock` | `shock` | 电弧 |
| `mark` | `mark` | 裂纹靶心 |
| `weaken` | `weaken` | 断剑下箭 |
| `atkUp` | `atkUp` | 剑上箭 |
| `guard` | `guard` | 盾 |
| `thorns` | `thorns` | 棘环 |
| `regen` | `regen` | 药葫芦/回环 |
| `haste` | `haste` | 风纹 |

### 1.2 emit 点改动（三处，均为增键）

1. `combat/skills.js` `status()` 工厂：返回对象带 `icon: STATUS_INFO[id]?.icon ?? id`。
2. `combat/engine.js` `applyStatus` 的 `emit('status', ...)`：增 `icon: applied.icon ?? statusId 兜底` 与 `element: applied.element ?? null`（后者现被丢弃，UI 需要按元素染色）。兜底必须在 engine 侧，覆盖非工厂来源的状态对象。
3. `combat/engine.js` `takeTurn` 的 `emit('dot', ...)`：增 `icon: st.icon ?? st.id`。

### 1.3 `action` 事件带状态快照（到期对账）

状态到期由 `tickStatusDurations` 静默移除、死亡由 `checkDeath` 清空，**没有任何事件**——UI 图标行若只靠 status 事件加、无事件减，必然残留。裁定不加新事件类型（见 W1），改为对账：

- `takeTurn` 的两处 `emit('action', ...)`（正常出手与 freeze 跳过）增 `statuses: unit.statuses.map((s) => ({ id: s.id, icon: s.icon ?? s.id, turns: s.turns, value: s.value, bad: s.bad }))`（emit 时刻快照，可为空数组）。
- UI 每收到一条 action 就整行重建该单位的图标条，天然自愈，无需到期事件。

---

## 2. 必补字段 F2 — AOE flag

现状：`emit('skill')` 载荷只有 `skillId/skill/element/cd/desc`，技能定义里现成的 `targeting` 没有上车；`battleStage` 对 AOE 只能按 damage 事件逐发单体弹道，全体技与单体技演出无差异（R2 简报点名项）。

### 2.1 `skill` 事件增键（`takeTurn` 内 `emit('skill')` 一处）

| 新键 | 取值 | 说明 |
| --- | --- | --- |
| `targeting` | `skill.targeting`（`enemy`/`enemyAll`/`allyAll`/`allyLowest`/`self`/`mixed`） | 定义里现成，直接透传 |
| `aoe` | `skill.targeting === 'enemyAll'` | 布尔；数据层全部 `target:'all'` 的 `sk_*` 均映射到 `whirlwind` 原型（targeting=enemyAll），自动继承，无需逐技登记 |
| `tags` | `skill.tags`（数组直传，已 frozen） | 供 UI/测试分类，零成本 |

### 2.2 `damage` 子命中 tag 口径

- `aoe=true` 技能的每条 damage 必须 `tag:'aoe'`——`resolveWhirlwind` 已传，且所有 enemyAll 数据技都走此 resolver，现状即满足；本条为**验收断言防回归**，不是新改动。
- `thunder_chain` 保持 `aoe:false`：链跳是顺序单体弹道，表现语义不同（见 W7）；可选给子命中加 `tag:'chain'`（P2，不阻塞验收）。

UI 聚合方式（写给 opus-4，不约束 opus-3）：见到 `aoe:true` 的 skill 事件后，聚合**紧随其后、同 `actorUid`、seq 连续**的 damage 事件做同帧扇形/全屏弹道；不需要引擎预告目标列表（见 W2）。

---

## 3. 必补字段 F3 — BOSS flag

现状：`unitSnapshot` 已带 `isBoss`，start/wave 的单位列表可用（`makeChip` 已消费）；但 skill/kill 逐事件无 boss 标记，BOSS 施法横幅、击破加长慢动作、登场 stinger 均无数据钩子（R2 简报「BOSS 无专属镜头」的数据侧根因）。

### 3.1 增键（三处 emit）

| 事件 | 新键 | 取值 |
| --- | --- | --- |
| `wave` | `hasBoss`、`bossUids` | `battle.enemies` 中 `isBoss` 单位有无 / uid 列表（无则 `false` / `[]`） |
| `skill` | `boss` | `unit.isBoss === true`（施法者是 BOSS → 施法横幅/震屏） |
| `kill` | `boss` | `unit.isBoss === true`（被击破者是 BOSS → 加长 KO 慢动作、专属结算节拍） |

`damage`/`action` 不加：UI 的 `chips` Map 按 uid 持有单位（含 boss class），受击方是否 BOSS 可查本地，不必逐事件重复。

### 3.2 数据层现成钩子（无需改 data）

`data/skills.js` `ENEMY_SKILLS` 已有 4 条 `tags:['enemy','boss']` 技（`sk_e_taotie_shi`/`sk_e_wuxiang_beng`/`sk_e_jiuyou_fen`/`sk_e_tianwen_ni`）；F2 的 `tags` 透传后 UI 可再按 `boss` tag 叠加技能级演出。数据层本轮零改动。

---

## 4. 工程约束（红线）

1. **全部改动 = emit payload 增键**：不新增事件类型、不动 `EVENT_TYPES`/`EVENT_SUBTYPES`/`EVENT_TYPE_OF`、不消耗任何 rng → **`ENGINE_VERSION` 保持 2**（升版条件是 rng 消耗次序变化，本单不触发）。
2. 新键名不得与 emit 的保留三键 `type`/`subtype`/`t` 冲突（`icon`/`element`/`statuses`/`targeting`/`aoe`/`tags`/`hasBoss`/`bossUids`/`boss` 均安全；emit 把三键放在展开之后，冲突会被静默覆写，务必避开）。
3. 新键全部**可 JSON 序列化**，不得把活的 unit 引用塞进 timeline（`resolveSoulResonance` 注释既有口径）。
4. 测试影响：仓库**尚无落盘 golden**，`tests/run.mjs` 的一致性探针是同进程双跑 `deepEqual`，增键两侧对称、自动通过。gpt-sol 若本轮落盘 golden，必须**在本补丁合入之后**录制；T3 口径（speed∈{1,2,4} 剥 `at`/`speed` 后一致）不受影响——新键均不含时间量。
5. `index.js` 导出面无需改：`export * from './skills.js'` 已透出 `STATUS_INFO`（含新 icon 字段）。

---

## 5. WONTFIX 清单（R3 裁定）

| # | 条目 | 裁定理由 | 替代 |
| --- | --- | --- | --- |
| W1 | 独立 `statusEnd`/`expire` 事件类型 | 6 值规范 `type` R2 已冻结；每状态每到期一条事件使 timeline 膨胀且到期发生在 `tickStatusDurations`/`checkDeath` 两处、时序语义含混 | §1.3 的 `action.statuses` 快照对账，UI 整行重建、天然自愈 |
| W2 | `skill` 事件预带 `targets[]` | 目标选择在 resolver 内消耗 rng；预抽 = 改变 rng 消耗次序 → 强制 `ENGINE_VERSION`+1 + 全量回放漂移，收益仅省 UI 一次聚合 | UI 按 skill 事件后同 actorUid、seq 连续的 damage 聚合 |
| W3 | 合并式多目标 damage 事件（一条带目标数组） | 破坏 per-target `hp/maxHp` 包络、`kill` 每 uid 至多一次（I-4）与 seq 断言口径 | 保持每目标一条 damage + F2 的 `aoe` flag |
| W4 | §9 BOSS 词缀机制（enrage/guard/elemShield/swift）进 timeline | 机制本体 R2 起挂起未裁定实现；R3 验收线只到 boss flag + 展示层差异 | F3 三键先行；词缀留后续轮次，不阻塞 |
| W5 | 镜头/音效指令字段（shake/sfx/camera）进 timeline | R1 规格 §12「引擎不含任何渲染字段」；演出决策归 UI | UI 由 `type`/`tags`/`aoe`/`boss` 派生 |
| W6 | 状态图标 SVG 资产入 combat 层 | 同上所有权边界；icon 仅为稳定 slug | SVG 归 opus-4 `ui/icons.js` 新建 `STATUS_ICON` |
| W7 | `thunder_chain` 判 `aoe:true` | 链跳是带衰减的顺序单体（每跳独立 damage 事件），与全体同帧 AOE 表现语义不同 | 保持 `aoe:false`；可选 `tag:'chain'`（P2） |
| W8 | `damage`/`action` 事件带 `targetIsBoss` | UI `chips` Map 已按 uid 持有 boss 态，逐事件重复无增益 | 查本地 chips |

---

## 6. 验收断言（opus-3 自测 / gpt-sol 加测）

1. 任意 `status` 事件：`typeof icon === 'string'` 且 icon ∈ §1.1 冻结表；带 `element`（可 null）。
2. 任意 `dot` 事件：带 `icon` 且与 `statusId` 恒等映射一致。
3. 任意 `action` 事件：`Array.isArray(statuses)`（可为空），元素形如 `{id, icon, turns, value, bad}`。
4. 用任一 `target:'all'` 的 `sk_*`（如 `sk_hengsao`）开打：对应 `skill` 事件 `aoe===true && targeting==='enemyAll'`，其后同 actorUid 的每条 `damage` `tag==='aoe'`；`thunder_chain` 的 skill 事件 `aoe===false`。
5. 含 `isBoss` 敌人的关卡：`wave` 事件 `hasBoss===true` 且 `bossUids` 含该 uid；该敌施法的 `skill` 事件 `boss===true`；其被击破的 `kill` 事件 `boss===true`；无 BOSS 波次 `hasBoss===false && bossUids.length===0`。
6. `ENGINE_VERSION === 2` 不变；`tests/run.mjs` 6/6 PASS；同种子双跑 `deepEqual` 全等；speed∈{1,2,4} 按 T3 口径剥 `at`/`speed` 后一致。
7. `JSON.stringify(result.timeline)` 不抛错（无循环引用/活引用）。
