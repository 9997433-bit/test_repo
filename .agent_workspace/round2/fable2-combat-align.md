# Round 2 · fable-2 战斗规格 vs 实现 对齐清单（opus-3 逐条执行版）

MODEL_SLUG: claude-fable-5-thinking-xhigh

> 依据 R2 裁定：**战斗模型保持已实现的「回合速度重排」**（ATB 规格 WONTFIX）；
> 事件名保持 `start|action|skill|damage|kill|end`（含 wave/round/heal/buff/status/dot/shield），可加别名；
> 技能 id **统一为 data/skills.js 与 combat 现用的 snake_case**。
> 本清单只描述对齐动作，代码由 opus-3 落地。凡改变 rng 消耗次序的条目，执行时必须 `ENGINE_VERSION` +1 并重录 golden。

---

## 0. 权威 id 域（先冻结，再谈映射）

从本轮起，全仓合法技能 id 只有两族，均已是 snake_case：

| 域 | 所在文件 | 形态 | 例 |
| --- | --- | --- | --- |
| 战斗原型库 | `js/combat/skills.js` `SKILL_LIBRARY` | 无前缀 snake_case，13 个（含 `basic_attack`） | `blaze_slash` `frost_lock` `thunder_chain` `whirlwind` `pierce_shot` `blood_drink` `guard_stance` `double_strike` `soul_resonance` `thorn_armor` `execute` `forge_mend` `gale_lead` |
| 数据层兵器/敌人技 | `js/data/skills.js` | `sk_` 前缀 snake_case，53 个主动 + 16 个 `bond_*` 被动 | `sk_liehuo_zhan` `sk_e_jiuyou_fen` |

规则：
- **R0-1** fable-2 规格里的 camelCase id（`flameSlash` 等 12 个）不得进入任何代码、存档或数据文件；只允许以别名形式出现在 `SKILL_ALIASES`。
- **R0-2** `js/ui/mock/data.js` 里的第四套 `sk_flame_slash/sk_frost_edge/...` 属于待删除的 mock（R1 遗留缺陷 #1），**不做映射**；opus-4 删 mock 时随之消失，期间禁止泄漏进真实存档。
- **R0-3** `bond_*` 被动不走 `getSkill`，由 `js/combat/lineup.js` 的 `computeBonds` 体系承接（bond id 采用 `type:xxx` / `element:xxx` / `mythic:soul` / `element:trinity`），维持现状，不对齐 data 层 `bond_type_*` id——数值权威在 fable-3/balance，不在本清单范围。

---

## 1. 旧 id → 新 id 映射表

### 1.1 fable-2 规格 §5 十二技（camelCase → 权威 id）

执行动作：把下表整体追加进 `js/combat/skills.js` 的 `SKILL_ALIASES`（值必须能被 `getSkill` 解析）。已存在的键（如 `heal`、`reflect`）不重复添加。

| 旧 id（fable-2 规格） | 规格名 | 新 id | 处置说明 |
| --- | --- | --- | --- |
| `flameSlash` | 烈焰斩 | `blaze_slash` | 语义等价；倍率以实现为准（175% 非 180%，burn 3 回合非 2） |
| `frostPierce` | 寒霜刺 | `frost_lock` | 规格 slow → 实现 `chill`；低血概率冻结为实现新增，保留 |
| `thunderChain` | 引雷链 | `thunder_chain` | 等价（别名已存在，核对即可）；衰减取实现值 22% |
| `whirlwindAxe` | 旋风裂空 | `whirlwind` | AoE 等价；「目标越多单体越低」取实现公式 |
| `quakeHammer` | 崩山震 | `pierce_shot` | 最近似（高倍单体重击）；stun 机制 WONTFIX（见 §4） |
| `windFanMend` | 清风归元 | `forge_mend` | 治疗最残血友军等价；附加护盾 WONTFIX，实现以 `regen` 持续回复替代 |
| `warFlute` | 龙吟战意 | `soul_resonance` | 全队 atkUp；数值取实现 +22%/3 回合 |
| `jadeUmbrella` | 玉骨伞盾 | `guard_stance` | 自身护盾 + 全队减伤，逐项对应，等价 |
| `galeArrow` | 追风连珠 | `double_strike` | 2 hit 单体等价；倍率取实现 105%/65% |
| `bladeDance` | 血刃舞 | `blood_drink` | 吸血强化一击等价；吸血率取实现 45% |
| `halberdSweep` | 横扫千军 | `whirlwind` | 前排 2 目标 → 全体 AoE 就近归并；自身叠 atkUp WONTFIX |
| `dragonInferno` | 真龙炎狱 | `sk_zhulong_kaimu` | 神话·火全体+burn，与数据层烛龙开目同位，映射到 data id |
| `basicAttack` | 普攻 | `basic_attack` | 等价 |

规格 §5 备注里的另 3 把神话模板同样入别名表：

| 旧描述 | 新 id |
| --- | --- |
| 冰神话（frostPierce 强化版） | `sk_xuanming_fengyuan` |
| 雷神话（thunderChain 强化版） | `sk_leize_tianwen` |
| 无属性神话（warFlute 强化版） | `soul_resonance` |

### 1.2 规格 buff/状态枚举 → 实现 `STATUS_INFO` id

规格 §5 的 buff 白名单与实现的状态 id 有漂移，权威取 `js/combat/skills.js` `STATUS_INFO`：

| 旧 kind（规格） | 新 id（实现） | 说明 |
| --- | --- | --- |
| `atkUp` | `atkUp` | 一致 |
| `atkDown` | `weaken` | 改名 |
| `drUp` | `guard` | 改名 |
| `slow` | `chill` | 改名（作用于 `effSpeed`） |
| `speedUp` | `haste` | 改名 |
| `stun` | `freeze` | 实现的硬控是冻结；`shock` 是雷系 DOT 不是麻痹 |
| `burn` | `burn` | 一致 |
| `shield` | （挂 `unit.shield` 字段） | 一致 |

执行动作：data 层 `effects.kind` 里出现的 `speedDown/defDown/bleed` 等由 opus-3 在战斗层落 effect 解释器时按此表精神归并（`speedDown→chill`、`defDown→mark`、`bleed→burn 同管线`），未知 kind 走稳定兜底而非抛错（与实现的容错路线一致）。

### 1.3 data 层 `sk_*` → 战斗原型 显式映射（替换哈希兜底）

现状：`getSkill` 对未知 `sk_*` 用 FNV 哈希随机挑 8 原型之一（`synthesize`）。id 已统一，但**行为映射是掷骰子**：元素、CD、目标模式全部失真。执行动作：

- **A1** 在 `js/combat/skills.js` 新增 `export const DATA_SKILL_ARCHETYPES`，按下表逐条登记；`getSkill` 命中该表时构造 `{ ...archetype, id, name, element, cd, desc }`（element/cd/name/desc 取 `data/skills.js` 原定义），**先查此表，查不到才走 synthesize**。synthesize 保留为最后兜底。
- **A2** 五个硬编码元素的 resolver（`resolveBlazeSlash`→'fire'、`resolveFrostLock`→'ice'、`resolveThunderChain`→'thunder'）改为 `ctx.skill.element ?? 原默认`，否则火系多段技借 `thunder_chain` 原型会打出雷伤。
- **A3** 本条改变现有 `sk_*` 的解算路径 = 改变 rng 消耗次序：`ENGINE_VERSION` 1 → 2，通知 gpt-sol 重录 golden。

映射表（玩家侧 41 技 + 敌方 12 技）：

| data id | 原型 | data id | 原型 |
| --- | --- | --- | --- |
| `sk_liehuo_zhan` | `blaze_slash` | `sk_yanwu_zhan` | `blaze_slash` |
| `sk_hanfeng_ci` | `frost_lock` | `sk_shuangfeng_lian` | `frost_lock` |
| `sk_leiting_tu` | `pierce_shot` | `sk_binghe_ci` | `whirlwind` |
| `sk_hanyu_she` | `execute` | `sk_xingluo_ji` | `whirlwind` |
| `sk_pishan` | `pierce_shot` | `sk_liehuo_nu` | `blaze_slash` |
| `sk_leiming_ji` | `whirlwind` | `sk_lianzhu_lei` | `thunder_chain` |
| `sk_qingfeng_fu` | `forge_mend` | `sk_bingpo_zhan` | `frost_lock` |
| `sk_liyin_zhen` | `whirlwind` | `sk_ronghuo_za` | `whirlwind` |
| `sk_zhepeng` | `guard_stance` | `sk_yanwei_shan` | `whirlwind` |
| `sk_beici` | `execute` | `sk_jiuxiao_yin` | `soul_resonance` |
| `sk_hengsao` | `whirlwind` | `sk_xuemu` | `guard_stance` |
| `sk_shouye_nu` | `double_strike` | `sk_linguang_ci` | `blood_drink` |
| `sk_qiuhong_she` | `frost_lock` | `sk_poxiao_yijian` | `execute` |
| `sk_wangchuan_zhan` | `blood_drink` | `sk_tunri_ci` | `blaze_slash` |
| `sk_jiuli_hengsao` | `whirlwind` | `sk_shechen` | `execute` |
| `sk_zhenchao` | `guard_stance` | `sk_duanlong` | `pierce_shot` |
| `sk_fenji` | `whirlwind` | `sk_zhaohun` | `forge_mend` |
| `sk_zhetian` | `guard_stance` | `sk_wanji` | `thunder_chain` |
| `sk_chanyi` | `blood_drink` | `sk_zhulong_kaimu` | `whirlwind` |
| `sk_xuanming_fengyuan` | `whirlwind` | `sk_leize_tianwen` | `execute` |
| `sk_taixu_xingyun` | `thunder_chain` | `sk_e_zaowo_hui` | `blaze_slash` |
| `sk_e_suibing` | `whirlwind` | `sk_e_maidian` | `pierce_shot` |
| `sk_e_tiepi` | `guard_stance` | `sk_e_kuangnu` | `soul_resonance` |
| `sk_e_fenshen_zhan` | `whirlwind` | `sk_e_hanyuan_suo` | `whirlwind` |
| `sk_e_leiting_pu` | `whirlwind` | `sk_e_taotie_shi` | `blood_drink` |
| `sk_e_wuxiang_beng` | `whirlwind` | `sk_e_jiuyou_fen` | `whirlwind` |
| `sk_e_tianwen_ni` | `pierce_shot` | | |

> 长线（本轮可选）：把 `A(...)` 数据形状（power/hits/target/effects）做成通用声明式解释器，替代原型映射；做了则删本表，但 id 域与 §1.1/§1.2 结论不变。

---

## 2. 必须 export 的 `elementMultiplier`

契约（已实现，本条为**冻结**而非新增）：

```js
// js/combat/elements.js
export function elementMultiplier(attackerElement, defenderElement)
// → 1.35（克制）| 0.75（被克）| 1.0（同属/无属/未知），入参过 normalizeElement 宽容归一
```

- **E1** `js/combat/engine.js` 与 `js/combat/index.js` 必须持续**按此名**转出 `elementMultiplier`。`tests/run.mjs` 的「元素克制倍率」探针直接 import `../js/combat/engine.js` 并按名探测——重命名或只留在 index.js 都会导致 skip/红灯。
- **E2** 同时保持导出：`STRONG_MULTIPLIER (1.35)`、`WEAK_MULTIPLIER (0.75)`、`NEUTRAL_MULTIPLIER (1)`、`elementRelation`、`normalizeElement`、`ELEMENT_CYCLE`。
- **E3** 规格 §3 的函数名 `elemMod` WONTFIX，不新增；规格「elemBonus 计入倍率并封顶 1.55」WONTFIX——实现将词条/羁绊元素增伤拆为独立因子 `(1 + unit.elemDmg)` 乘入伤害管线，`elementMultiplier` 保持纯三值，不得掺入词条。
- **E4** 三元素九组合的断言口径 = I-5：`fire→ice 1.35`、`ice→fire 0.75`、同属 1.0，以 `elements.js` 常量为唯一事实源；balance.js 若另配倍率，必须改这三个常量而不是旁路新表。

---

## 3. timeline 字段最低集

### 3.1 事件公共包络（每条事件必带）

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| `seq` | int | 从 0 严格 +1（不变量 I-13 保留） |
| `at` | int(ms) | 播放时钟，单调不减；**只有它**受 `speed` 影响 |
| `t` | string | 事件类型，见 3.2；字段名就叫 `t`（规格的 `type` WONTFIX） |
| `round` | int | 单调不减 |
| `wave` | int | 当前波次（1 起；start 事件为 0） |
| `text` | string | 人读战报行（UI 降级与 `formatBattleReport` 依赖，保持必带） |

规格的 `tick` 字段 WONTFIX（无 ATB 即无 tick）。

### 3.2 事件类型（冻结）与别名

权威集合 = `EVENT_TYPES` 现值：`start, wave, round, action, skill, damage, heal, buff, status, dot, shield, kill, end`。

执行动作：在 `js/combat/engine.js` 新增并从 `index.js` 转出：

```js
export const EVENT_ALIASES = Object.freeze({
  battleStart: 'start', waveStart: 'wave', turnStart: 'action',
  battleEnd: 'end', ko: 'kill', shieldGain: 'shield', debuff: 'status',
});
```

只做读侧别名（供按规格旧名筛事件的调用方换算），**不改 emit 的事件名，不双写**。

### 3.3 各类型最低 payload（在包络之外必带的键）

| t | 最低 payload |
| --- | --- |
| `start` | `engineVersion, mode, speed, seed, maxRounds, players[], waves[], bonds[]`（players/enemies 项为 `unitSnapshot` 形状） |
| `wave` | `waveIndex, name, enemies[]` |
| `round` | （仅包络；回合分隔符） |
| `action` | `actorUid, actor, side, skillId, skill, speed`；被冻结跳过时改为 `actorUid, actor, side, skipped:true, reason` |
| `skill` | `actorUid, actor, side, skillId, skill, element, cd` |
| `damage` | `actorUid, targetUid, actor, target, side, label, tag, element, damage, absorbed, crit, relation, multiplier, hp, maxHp` |
| `heal` | `targetUid, target, side, label, amount, hp, maxHp` |
| `shield` | `targetUid, target, side, label, amount, shield` |
| `status` | `targetUid, target, side, statusId, status, turns, value, bad` |
| `dot` | `targetUid, target, side, statusId, status, damage, hp, maxHp`（`element` 可空） |
| `buff` | `actor 或 target 至少其一, label, text`（自由载荷事件，供 `soul_resonance` 类整体宣告） |
| `kill` | `targetUid, target, side, actorUid(可 null), actor` |
| `end` | `winner, rounds, timeout`；正常路径另带 `clearedWaves, survivors[]` |

约束：
- **T1** 首事件恒为 `start`，末事件恒为 `end`；`kill` 每 uid 至多一次（I-4 保留）。
- **T2** `winner ∈ {'player','enemy','draw'}`——规格「超时完全相等判 enemy」WONTFIX，实现的 ±0.05 血量比平局带保留；所有消费方（UI/竞技结算/测试）必须处理 `draw`。
- **T3** 不变量 I-11 修订版：`speed ∈ {1,2,4}` 三次模拟，剥离各事件 `at` 与 start 事件/返回值中的 `speed` 字段后逐字节一致。golden（I-14）按修订口径录制，基于 ENGINE_VERSION 2。
- **T4** rewards 不进 timeline（与规格一致）；掷点保持在 `end` 之后的 `finalize/computeRewards`。

---

## 4. fable-2 规格项 WONTFIX 清单（R2 裁定 + 随附归并）

| # | 规格条目 | 裁定 | 已实现替代 |
| --- | --- | --- | --- |
| W1 | §2 ATB 行动条全节：`GAUGE_MAX=1000`、tick 循环、溢出量排序、`unit.gauge` 字段、`MAX_TICKS` | **WONTFIX（R2 明示）** | 每回合按 `effSpeed` 降序重排；同速用战斗 rng 抽先手签（镜像公平），slot/uid 兜底全序 |
| W2 | §2.1 与 gauge 绑定的回合管线（先减寿后行动、独立 cd-- 步骤） | WONTFIX | 实现顺序：DOT/HOT → freeze 判定 → `pickSkill` → 结算 → `tickStatusDurations` → `tickCooldowns` |
| W3 | timeline `tick` 字段与 `type` 字段名 | WONTFIX | `at`（ms 播放时钟）与 `t` |
| W4 | §4 反击机制（counter 40% 回打）及其 rng 席位 | WONTFIX | `thorns` 棘甲反伤（无 rng、按实伤比例弹回）；「crit/variance 每 hit 无条件掷」这一条实现已遵守，保留 |
| W5 | §5 十二技表的 camelCase id、精确倍率、`cdInit`、`hits[]` 逐段定义、`proc` 席位 | WONTFIX | `SKILL_LIBRARY` 13 原型 + §1 映射；全部技能开局即可用（无 cdInit），施放时置 `cooldowns[id]=cd` |
| W6 | §5 buff 白名单「未知 kind 必须抛错」 | WONTFIX | 容错归一 + 稳定兜底（synthesize/别名），战斗永不因数据拼写崩溃 |
| W7 | §6 决策纯函数、目标选择零 rng | WONTFIX | 5 种 AI 性格加权 + rng 抖动打分；种子内完全可复现（I-1 口径不变），I-9 改为「同 seed 同快照输出全等」 |
| W8 | §7 超时完全相等判 enemy 胜 | WONTFIX | ±0.05 血量比判 `draw`（T2） |
| W9 | §8 羁绊数值表（bondAtkPct 0.10/三相 +0.10 入克制倍率/兵魂 +5%） | WONTFIX | `lineup.js` 分档羁绊（同源共鸣/三相同辉/兵魂/三相归一），数值权威归 fable-3 balance 对齐轮 |
| W10 | §11 竞技场 20 名·0.70–1.46 战力带·ELO-lite 常数 | WONTFIX（结构性替代） | `generateArenaOpponents` 0.65–1.45 因子 + AI 性格 + rank 奖励表；ELO 归 state 层 |
| W11 | 不变量 I-11 原文（byte-identical 含时间戳） | 修订 | 按 T3 剥离 `at`/`speed` 后比较 |
| W12 | `stun` 状态名 | WONTFIX | `freeze`（§1.2 映射表） |

**非 WONTFIX、挂起待排期**（规格仍有效，R2 未裁定砍掉，本轮不阻塞）：§9 BOSS 词缀（enrage/guard/elemShield/swift——`isBoss` 字段已就位）、磨战衰减常量核对（规格 round>30 与实现 `FATIGUE_START=30` 已一致，仅需 golden 覆盖）、§7 波次续场细则（实现为过波回复 20% + 清负面，规格为保留 hp/cd/清全部 buff——差异记入 REQUESTS.md 由 fable-3 定数值）。

---

## 5. opus-3 执行顺序（可勾选）

1. [ ] `combat/skills.js`：`SKILL_ALIASES` 追加 §1.1 两张表（12+3 条，跳过已存在键）。
2. [ ] `combat/skills.js`：新增 `DATA_SKILL_ARCHETYPES`（§1.3 全表）；`getSkill` 解析顺序改为 `SKILL_LIBRARY → SKILL_ALIASES → DATA_SKILL_ARCHETYPES → synthesize`。
3. [ ] `combat/skills.js`：resolver 元素改读 `ctx.skill.element ?? 默认`（A2，涉及 blaze_slash/frost_lock/thunder_chain 三处硬编码）。
4. [ ] `combat/engine.js`：新增 `EVENT_ALIASES`（§3.2），`index.js` 转出。
5. [ ] `combat/engine.js`：`ENGINE_VERSION` 1 → 2（第 2/3 步改变 rng 消耗次序）。
6. [ ] 核对导出面：`elementMultiplier` 及 §2-E2 清单在 `engine.js` 与 `index.js` 均可 import（现状已满足，勿回退）。
7. [ ] 通知 gpt-sol：golden 以 v2 重录；I-5/I-11/I-13 按 §2-E4、§3-T3、§3.1 口径写断言；`winner:'draw'` 纳入用例。
8. [ ] 跑 `tests/run.mjs` 与 `bench/run.mjs`，确认「元素克制倍率」「simulateBattle 同种子结果一致」两探针绿灯、500 场 ≤500ms 预算未破。
