MODEL_SLUG: claude-fable-5-thinking-xhigh

# Round 2 · fable-3 经济对齐差异清单（balance.js / stages.js / core idleRates）

> 收件人：**opus-2**（`js/data/**`、`js/forge/**`）、**opus-1**（`js/core/state.js` 存档与挂机）。
> 权威来源：`.agent_workspace/round1/fable3-economy.md`（400 种子蒙特卡洛校准，休闲档到 20 关 p50≈41min）。
> 本文只列**差异**与**裁定**；未列出的常量维持现状。所有「新值」字面量可直接粘贴。

---

## 0. 四项裁定（先读这个）

1. **首锻保底精钢**：新增 `FORGE_PITY.firstForgeMinQuality = 'uncommon'`。触发条件 `state.forge.totalForged === 0`（已持久化，锻后置 `flags.firstForgeDone`）。理由：凡铁低 roll（atk 20）对第 1 关只有 17% 胜率，首战失败是最差新手体验；保底精钢最低 roll 单件战力 43 > 第 1 关敌方 40，**必胜**。3 分钟新手闭环依赖此项。
2. **FORGE_PITY 阈值**：改为**白银/黄金炉 8 锤史诗保底**（第 8 锤时若前 7 锤未出史诗+，本锤强制史诗+；出史诗+即清零）。精铁炉无保底；**删除传说保底**（旧 iron 25/160、silver 14/80、gold 8/40 全部作废）。理由：8 锤保底是把休闲档 p90 压进 48min 的关键杠杆，400 种子按此校准；传说保底未建模且会推高后期战力方差。
3. **IDLE_RATES 权威归属**：**`js/data/balance.js` 的 `IDLE_RATES` 为唯一权威**（每分钟制，fable-3 新值见 §C1）。core `js/core/state.js` 的 `idleRatesPerHour` 是 R1 占位（其注释自己已声明），R2 由 opus-1 改为 **import balance 值换算 ×60**；若 core 层不允许依赖 data 层，则**复制同值**并由 gpt-sol 加同步断言测试（见 §E）。同时全局只允许**一条结算入账路径**（core `tickIdle` 或 forge `collectIdle` 二选一，另一个退化为纯读取），杜绝双计。
4. **碎片资源**：**本轮落地 6 个资源 ID + 基础进出流**（掉落发放、突破消耗、分解产出）；**洗练系统（词条重 roll 沉没）本轮不做**，留 R3。理由：强化突破碎片是「氪肝不氪脸」的确定性补偿通道，20 关墙的张力就是史诗碎片紧平衡（§8.3），砍掉碎片流会让校准失效；洗练只是后期反通胀沉没，不影响 0–20 关验收。ID 固定为：`shardCommon / shardUncommon / shardRare / shardEpic / shardLegendary / shardMythic`。

---

## A. 锻造与品质（opus-2 · balance.js + forge.js）

### A1. `QUALITY_WEIGHTS`（权重值改，schema 不变，×100 整数缩放）

| 炉 | 旧值（% 折算） | 新值（%） | 新字面量 |
| --- | --- | --- | --- |
| iron | 52 / 30 / 13 / 4.2 / 0.75 / **0.05** | 52 / 31 / 13.5 / 3.2 / 0.3 / **0** | `{ common: 5200, uncommon: 3100, rare: 1350, epic: 320, legendary: 30, mythic: 0 }` |
| silver | 22 / 33 / 27 / 14 / 3.6 / 0.4 | 20 / 34 / 28 / 14 / 3.6 / 0.4 | `{ common: 2000, uncommon: 3400, rare: 2800, epic: 1400, legendary: 360, mythic: 40 }` |
| gold | 6 / 18 / 30 / 30 / 14 / 2 | **0** / 16 / 33 / 31 / 16 / 4 | `{ common: 0, uncommon: 1600, rare: 3300, epic: 3100, legendary: 1600, mythic: 400 }` |

理由：精铁炉神话必须为 0（新手期不发神话）；黄金炉去掉凡铁、抬传说/神话，是 21–40 关配速与「幸运符+大师熔炉=神话 6.1%」每日高光的基础。§1.1 概率表是测试断言基准（±0.5pp）。

### A2. `LUCKY_CHARM_MULTIPLIER`

- 旧：`{ common: 0.45, uncommon: 0.8, rare: 1.25, epic: 1.6, legendary: 2.0, mythic: 2.4 }`
- 新：`{ common: 0.4, uncommon: 0.8, rare: 1.5, epic: 1.6, legendary: 1.7, mythic: 1.8 }`
- 理由：旧值把传说/神话抬得过高（黄金炉+双 buff 神话会破 8%），新值经校准使白银+符 = 神话 0.68%、黄金+双 buff = 神话 1.00%→6.1%（见 fable-3 §1.1 表）。

### A3. `MASTER_FORGE_MULTIPLIER` — **无差异**，保留 `{1,1,1,1.8,1.8,1.8}`。`MASTER_FORGE.dailyUses: 1` 保留。

### A4. `FORGE_PITY`（schema + 值全换，见裁定 2）

- 旧：`{ iron: { epic: 25, legendary: 160 }, silver: { epic: 14, legendary: 80 }, gold: { epic: 8, legendary: 40 } }`
- 新：

```js
export const FORGE_PITY = Object.freeze({
  epicPityCount: 8,                        // 白银/黄金炉：连续 8 锤未出史诗+ → 第 8 锤保底史诗
  pityTiers: Object.freeze(['silver', 'gold']), // 精铁炉无保底
  firstForgeMinQuality: 'uncommon',        // 全局首锻保底精钢（totalForged === 0 时生效）
});
```

- `pityFloorFor` 改写：iron 恒返 null；silver/gold 当 `pity + 1 >= epicPityCount` 返 `'epic'`（现有 `p.epic + 1 >= th` 语义正确，保留）；首锻检查置于最前，返回 `'uncommon'` 下限（与史诗保底同用 `applyPityFloor`）。
- 存档形状：`forge.pity = { silver: 0, gold: 0 }`（纯计数器，替代旧 `{ epic, legendary }` 对象）。旧档迁移：取原 `.epic` 值，iron 计数丢弃。

### A5. `QUALITY_STAT_MULTIPLIER`：仅 mythic **2.9 → 2.8**，其余不变。理由：第 40 关「玩家裸上限 13,900 vs BOSS 14,491 必须靠克制+图鉴」的终局解谜按 2.8 配平。

### A6. `QUALITY_AFFIX_COUNT`

- 旧：`{ common: 1, uncommon: 1, rare: 2, epic: 3, legendary: 3, mythic: 4 }`
- 新：`{ common: 0, uncommon: 1, rare: 1, epic: 2, legendary: 3, mythic: 4 }`
- 理由：凡铁 0 词条（垃圾感要真实，衬托首锻精钢）；玄兵 1 / 紫霄 2 拉开 8 锤保底的爽点差。词条数值池仍归 fable-2/opus-3，`QUALITY_AFFIX_POWER` 不动。

### A7. `FORGE_COST`

| 炉 | 旧值 | 新值 |
| --- | --- | --- |
| iron | `{ coin: 120, iron: 12 }` | `{ coin: 120, iron: 20 }` |
| silver | `{ coin: 480, iron: 20, silverOre: 8 }` | `{ coin: 450, iron: 30, silverOre: 16 }` |
| gold | `{ coin: 1600, silverOre: 16, goldOre: 6 }` | `{ coin: 1800, iron: 60, silverOre: 25, goldOre: 12 }` |

理由：白银/黄金炉吃铁是精铁溢出的反通胀对策（§9-1）；黄金炉赤金标 12（非面值 8）是因分解 60% 返还使有效成本 ≈55%，按有效值校准（§9-2）。开局 60 铁 = 恰好 3 锤精铁炉（20×3），新手引导依赖。

### A8. 元素偏向：`ELEMENT_BIAS_COST` 与 `ELEMENT_BIAS_WEIGHT`

- 旧：分炉 `{ iron: 2, silver: 3, gold: 4 }` 晶 + 权重 ×6（不保证）。
- 新：**统一 2 晶，100% 保证主元素**。`ELEMENT_BIAS_COST = 2`（或保留对象但三值全 2），**删除 `ELEMENT_BIAS_WEIGHT`**。
- 理由：三相晶预算按「2 晶保证」校准（关卡 crystalChance 0.35 的产量只够确定性用法）；概率偏向会让玩家在元素墙前反复空耗晶体，是坏挫折。

### A9. 新增 `FORGE_UNLOCK_STAGES`（当前代码无炉子解锁门槛）

```js
export const FORGE_UNLOCK_STAGES = Object.freeze({ iron: 0, silver: 8, gold: 21 });
```

理由：白银 8 关解锁与秘银首掉（第 8 关）对齐；黄金 21 关与赤金首掉（第 22 关首通预发 4）对齐。

### A10. 兵器原型区间约束（weapons.js 校验，不是新常量）

各原型 `baseAtk` 必须落进所属炉的 roll 区间：iron `[20, 32]`、silver `[65, 100]`、gold `[160, 240]`；`baseHp = baseAtk × 5.2`（±5% 容差）。建议 gpt-sol 加数据完整性断言。

---

## B. 强化与分解（opus-2）

### B1. `ENHANCE_COST` → 整体替换为 fable-3 `ENHANCE`

| 项 | 旧 | 新 |
| --- | --- | --- |
| 铜钱曲线 | `60 × level^1.35 × 品质系数(1~3.6)` | `round(45 × 1.3^当前等级)`，**无品质系数** |
| 属性成长 | `LEVEL_GROWTH { atk: 0.12, hp: 0.10 }` | `statPerLevel: 0.06`（atk/hp 同为每级 +6%，基于锻造基础值线性） |
| 等级上限 | `QUALITY_LEVEL_CAP {20,30,40,50,60,70}` | `maxLevel { common:6, uncommon:9, rare:12, epic:15, legendary:18, mythic:21 }` |
| 技能槽 | `SKILL_SLOT_LEVELS [1,3,6]` | `skillSlotLevels [3,6,9]` |
| 突破材料 | 每级矿石（`oreDivisor:3`）+ 每 10 级 1 玄晶 | `breakthroughShards { 3:3, 6:6, 9:10, 12:18, 15:28, 18:42 }`（同品质碎片）；**删除矿石/玄晶消耗** |

理由：强化是消灭肥尾的确定性补偿通道，铜钱几何曲线 + 碎片突破是校准核心；旧的 70 级上限与玄晶淬火完全在校准外。验收锚点（累计铜钱，±1 取整容差）：+6→574、+9→1,440、+12→3,344、+15→7,528、+18→16,719、+21→36,909。

### B2. `DISMANTLE` → 整体替换

| 项 | 旧 | 新 |
| --- | --- | --- |
| 矿物返还 | `refundRatio 0.6`（含铜钱一起返） | `refundRate 0.6`，**仅返矿物（floor），锻造铜钱不返还** |
| 强化投入返还 | `enhanceRefundRatio 0.45`（返铜钱） | 仅返**已付突破碎片**的 60%（floor）；**强化铜钱不返还** |
| 品质附赠 | `qualityBonus`（铜钱 20~4000 + 幸运符 + 玄晶） | `shards { common:2, uncommon:4, rare:7, epic:12, legendary:20, mythic:36 }`（同品质碎片）；**删除铜钱/幸运符/玄晶附赠** |

理由：铜钱不返还是关键反通胀沉没（§9 全靠它兜底）；分解产玄晶/幸运符会击穿玄晶日预算（~40/天）与幸运符稀缺性。60% 矿物返还率本身是核心爽点，不许下调。

---

## C. 挂机、体力、开局、图鉴（opus-2 + opus-1）

### C1. `IDLE_RATES`（每分钟制，schema 增加 `offsetStage`）

```js
// rate/min = base + perStage × max(0, n − offsetStage)；n < unlockStage 时为 0
export const IDLE_RATES = Object.freeze({
  coin:      Object.freeze({ base: 5,   perStage: 2.2,   unlockStage: 0,  offsetStage: 0 }),
  iron:      Object.freeze({ base: 0.5, perStage: 0.11,  unlockStage: 0,  offsetStage: 0 }),
  silverOre: Object.freeze({ base: 0,   perStage: 0.08,  unlockStage: 10, offsetStage: 9 }),
  goldOre:   Object.freeze({ base: 0,   perStage: 0.006, unlockStage: 22, offsetStage: 21 }),
});
```

| 资源 | 旧（/min） | 新（/min） |
| --- | --- | --- |
| coin | `6 + 2.4n` | `5 + 2.2n` |
| iron | `1.2 + 0.35n` | `0.5 + 0.11n` |
| silverOre | `0.12n`（n≥10） | `0.08 × (n−9)`（n≥10） |
| goldOre | `0.05n`（n≥25） | `0.006 × (n−21)`（n≥22） |
| 三相晶 ×3 | `0.035n`（n≥4/12/20） | **删除**（无挂机晶体收入） |

理由：旧铁速率是校准值 ~3 倍（精铁溢出恶化）；旧赤金 `0.05×25=1.25/min` 开闸即约 18 赤金/时，黄金锻会被挂机白送（校准值满进度也只 0.114/min）；三相晶只从关卡掉落（`crystalChance 0.35`），否则 2 晶保证元素的稀缺性归零。

### C2. `IDLE` 杂项

- `offlineRatio`：**0.8 → 1.0**（fable-3 `offlineEfficiency: 1.0`，在线离线同率——收入表按此校准）。
- `offlineCapMs` 8h、`minCollectMs` 60s：保留。
- `codexBonusCap` 作用于挂机：**移除**。图鉴加成按 GDD 作用于 ATK/HP（战力），不作用于挂机收入（400 种子收入表不含此加成）。`forge/idle.js` 中 `× (1 + codexBonus)` 一并删除。

### C3. `CODEX_BONUS`

- 旧：`perProto: 0.0045`（24 把满 +10.8%）→ 新：`perEntry: 0.00625`（24 把满 +15%，GDD 上限）。`cap: 0.15` 保留。
- 理由：第 40 关终局解谜要求图鉴满收集 +15% 参与破墙，10.8% 不够过 14,491。

### C4. `STAMINA` / 开局资源（opus-1 的 `defaultResources` + opus-2 的 stages）

| 项 | 旧 | 新 | 归属 |
| --- | --- | --- | --- |
| 体力上限/回速 | 120 / 6min — 无差异 | 保留 | — |
| 开局体力 | `stamina: 60` | `120`（`startFull: true`） | opus-1 |
| 开局铜钱/铁 | `coin: 200, iron: 30` | `coin: 300, iron: 60`（= 3 锤精铁炉） | opus-1 |
| 开局幸运符 | `luckyCharm: 1` | `0`（首枚由第 5 关精英首通发放） | opus-1 |
| 关卡体力消耗 | `isElite ? 12 : 6` | **普通 3 / 精英 6** | opus-2 (stages.js) |

理由：120 体力一口气推 1–20 关（基础消耗 78）+ ~12 次重试余量是「40–60 分钟达 20 关」的前提；旧 6/12 使 1–20 关基础消耗 144 > 120，开局就硬卡体力，直接击穿验收目标。新增导出 `STARTER_KIT = { coin: 300, iron: 60 }`。

### C5. `LINEUP_UNLOCK_STAGES` / `SLOT_UNLOCK_STAGES`（**双处都要改**）

- 旧：balance.js `[0, 3, 8, 16, 28]`；core state.js `[0, 3, 8, 15, 25]`（R1 已互相漂移）。
- 新：**两处统一为 `[0, 2, 4, 9, 14]`**（导出名建议统一 `SLOT_UNLOCK_STAGES`，core 读同值）。
- 理由：模拟以 14 关 5 栏全开为前提，20 关玩家战力锚点 ~1,750 依赖 5 件成型；旧值 28 关才开第 5 栏，21–40 段配速全错。stages.js 的 `LINEUP_UNLOCK_AT = {3:2, 8:3, 16:4, 28:5}` 同步改 `{2:2, 4:3, 9:4, 14:5}`。

---

## D. 关卡表（opus-2 · stages.js 数值列全部换源）

**裁定：fable-3 `STAGE_BALANCE`（40 条 JSON 字面量，见 fable-3 文档 §3）原样粘贴进 `balance.js` 导出；`stages.js` 保留章节/关名/波次/敌人配置等叙事层，数值列按 `id` 从 `STAGE_BALANCE` 合并，删除自身生成公式。**

| 列 | 旧（stages.js 生成公式） | 新（STAGE_BALANCE 表值） | 理由 |
| --- | --- | --- | --- |
| `staminaCost` | 6 / 12 | 3 / 6 | 见 §C4 |
| 敌方战力 | `120 × r^(n−1)` 到 30,000，精英 ×1.35 | `enemyPower` 40 → 14,491（表值，勿运行时重算） | 与 §7 战力模型/±9% 胜率带宽配平；量纲若与 opus-3 `estimatePower` 不合，按 §7 折算并回报 fable-3 |
| `firstClear` | `120 + 55n` 铜钱 + 奇数关幸运符 + 精英 5~9 玄晶 | 表值：铜钱 75→1,870 + 矿/晶/碎片；**精英关固定 `luckyCharm 1 + diamond 20`**，非精英关不发幸运符 | 首通=55% 推图收入的里程碑注资；幸运符/玄晶 faucet 收口 |
| 重复掉落 | `rewards`（均值公式 ×2.4 精英）+ `dropTable`（含幸运符 8%+ 随机掉） | 表值 `repeat`：`coin/iron/silverOre/goldOre [min,max]` + `crystalChance 0.35` + `shardChance 0.3`；**删除幸运符随机掉落** | 幸运符只走精英首通/日常/兑换三个口，否则白银期符件泛滥 |
| `rewards.exp` | `10 + 6n` | **删除**（无 exp 资源） | GDD 资源表无此项 |
| 精英 `powerGate` | `0.72 × power` | **删除（置 0）** | 校准代理在 0.92× 需求即可尝试，硬门槛改变重试节奏，未建模 |
| 碎片掉落 | 无 | `firstClear.shards` + `repeat.shardTier/shardChance`（表值） | 碎片流本轮落地，见裁定 4 |

结算规则（forge/关卡结算共用）：首通发 `firstClear` **+ 一次 `repeat`**；重复胜利/扫荡只发 `repeat`；`crystal`/`crystalChance` 映射 `ELEMENT_CRYSTAL[element]`。

---

## E. core `idleRatesPerHour` 对齐（opus-1 · state.js）

**裁定（重复一遍避免歧义）：`data/balance.js` 的 `IDLE_RATES` 权威；core 读取或复制同值。** core 若复制，换算成每小时制如下（`n` = 已通关最高关）：

| 资源 | 旧占位（/h） | 新（/h = balance ×60） |
| --- | --- | --- |
| coin | `60 + 28n` | `300 + 132n` |
| iron | `24 + 9n` | `30 + 6.6n` |
| silverOre | `1.2 + 0.45(n−6)`，n≥6 | `4.8 × (n−9)`，n≥10 |
| goldOre | `0.6 + 0.22(n−16)`，n≥16 | `0.36 × (n−21)`，n≥22 |
| fire/ice/thunderCrystal | `0.5 + 0.16(n−4)`，n≥4 | **0（删除）** |

配套要求：

1. `IDLE_RESOURCE_IDS` 移除三种晶体（或保留 ID 但速率恒 0，建议直接移除避免 pending 脏键）。
2. gpt-sol 加同步断言：`n ∈ {0, 10, 22, 40}` 时 `core 每小时速率 === balance 每分钟速率 × 60`（±1e-9）。
3. **单一入账路径**：core `tickIdle` 与 `forge/idle.js` 的收集函数只能有一个往 `resources` 加钱；裁定由接管 `game.api` 的一侧（opus-1）持有入账，另一侧退化为速率查询。双计会把挂机收入翻倍，直接摧毁校准。

---

## F. 存档与资源 ID（opus-1 · state.js）

1. `RESOURCE_IDS` 追加 6 个碎片 ID（见裁定 4），hydrate 旧档默认 0。
2. `forge.pity` 形状改 `{ silver: 0, gold: 0 }`（数字计数器）；迁移取旧 `.epic`。
3. `forge.firstForgeDone` 等价信息用 `forge.totalForged === 0` 判定即可，`flags.firstForgeDone` 保留给 UI 引导。
4. 每日重置字段（R1 遗留缺口）：`daily = { masterForgeUsed, freeSweepsUsed, trialRuns, arenaAttacks, questClaimed, lastResetDay }` 进 hydrate/serialize；现 `forge.masterForge { dayKey, used }` 并入或映射。
5. `SAVE_VERSION` +1，`BALANCE_VERSION` 1 → 2。

---

## G. balance.js 缺失导出（opus-2 新增，字面量直接从 fable-3 文档复制）

`STAGE_BALANCE`（§3）、`STARTER_KIT`、`SLOT_UNLOCK_STAGES`、`SWEEP_RULES`（§4）、`DAILY_RULES`、`EXCHANGE`、`ACHIEVEMENT_DIAMOND_BUDGET`（§5）、`ARENA_RULES`（§6）、`POWER_FACTORS`（§7）、`FORGE_UNLOCK_STAGES`（本文 §A9）。

已有且无差异、确认保留：`QUALITIES`、`QUALITY_RANK`、`ELEMENTS`、`ELEMENT_BEATS`、`ELEMENT_MULTIPLIER`（1.35/1.0/0.75）、`ELEMENT_CRYSTAL`、`WEAPON_TYPES`、`FORGE_STAGES`、`MASTER_FORGE(_MULTIPLIER)`、`LUCKY_CHARM_COST`、`QUALITY_AFFIX_POWER`、`BOND_RULES`、`BAG`、`STAMINA`（上限/回速）、`MAX_LINEUP`。`POWER_FORMULA` 的 `critWeight 0.5 / hpWeight 0.15` 与 `POWER_FACTORS` 一致可保留，`bondBonus 0.08` 为实机羁绊值（模拟假设均值 0.05，在 ±9% 带宽内），不改。

---

## H. 验收断言（给 gpt-sol，任何 balance 改动必须重跑）

1. 概率：三炉 ×（无 buff / 幸运符 / 大师炉 / 双 buff）归一化概率对 fable-3 §1.1 表 ±0.5pp。
2. 保底：白银炉 mock 连续 7 锤非史诗后第 8 锤必 ≥ epic；新档首锤必 ≥ uncommon；精铁炉 1000 锤无保底触发、无 mythic。
3. 强化：累计铜钱锚点 +6→574 … +21→36,909（±1 取整容差）；+3/+6/+9 解锁技能槽；碎片不足时突破被拒。
4. 分解：白银武器分解返 `floor(16×0.6)=9` 秘银 + `floor(30×0.6)=18` 铁，铜钱返还 0。
5. 挂机：n=20 时 coin 49/min、iron 2.7/min、silverOre 0.88/min、goldOre 0、晶体 0；8h 封顶；core/balance 同步断言（§E-2）。
6. 关卡：1–20 关基础体力合计 78；第 1 关敌方 40；第 20 关 1,664；第 40 关 14,491。
7. 经济回归：fable-3 模拟器（§8）移植 `tests/`，休闲档 400 种子到 20 关 p50 ∈ [38, 46] min、p90 < 55 min。
