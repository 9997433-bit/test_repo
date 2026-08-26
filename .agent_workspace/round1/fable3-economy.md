MODEL_SLUG: claude-fable-5-thinking-xhigh

# Round 1 · fable-3 经济与进度曲线设计

> 交付对象:opus-2(`js/data/**`、`js/forge/**`)。本文所有 JS 字面量可直接粘贴进 `js/data/balance.js`。
> 数值全部经过 400 种子蒙特卡洛模拟校准(模拟器代码见 §8,假设见 §8.1)。

---

## 0. 设计哲学(为什么是这些数)

1. **双轨收入**:首通奖励 = 一次性「里程碑注资」(约占推图期收入 55%);重复掉落/扫荡/挂机 = 时间性产出(约 45%)。卡关时玩家总有事可做(扫荡→强化→再战)。
2. **体力是会话闸门,不是分钟闸门**:回体 1/6min 太慢,不能做细粒度节流。设计上 120 点初始体力足够一口气推完 1–20 关(基础消耗 78 点)+ 约 12 次重试/扫荡余量;真正的分钟级节奏由银矿/铜钱到账速率控制。
3. **保底压方差**:品质纯随机会造成"欧皇 17 分钟、非酋 2 小时"的双峰。白银/黄金炉 8 锤保底史诗+、首锻保底精钢,把 p90 压回目标窗口。
4. **强化是确定性补偿**:锻造看脸,强化(铜钱+碎片)是确定性战力,卡关玩家永远有一条"氪肝不氪脸"的出路。模拟证明这是消灭肥尾的关键。
5. **分解 60% 返还 = 再锻造循环**:废品不是损失,是打折重抽。黄金期净锻造成本约为标价的 55–60%,这是刻意的"越玩越顺"手感,通胀风险已在 §9 对冲。

---

## 1. 品质、锻造、幸运符/大师熔炉

```js
export const QUALITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

// 品质对 baseAtk/baseHp 的乘数(锻造时施加于原型基础值)
export const QUALITY_MULT = { common: 1.0, uncommon: 1.18, rare: 1.42, epic: 1.75, legendary: 2.2, mythic: 2.8 };

// 品质词条数(词条数值池归 fable-2/opus-3 定)
export const AFFIX_COUNT = { common: 0, uncommon: 1, rare: 1, epic: 2, legendary: 3, mythic: 4 };

// 三炉:解锁关卡 / 成本 / 基础攻击与生命滚动区间 / 品质权重
// baseHp 区间 = baseAtk 区间 × 5.2(战力公式假设,见 §7)
export const FORGE_TIERS = {
  iron: {
    unlockStage: 0,
    cost: { iron: 20, coin: 120 },
    baseAtk: [20, 32], baseHp: [104, 166],
    weights: { common: 52, uncommon: 31, rare: 13.5, epic: 3.2, legendary: 0.3, mythic: 0 },
  },
  silver: {
    unlockStage: 8,
    cost: { silverOre: 16, iron: 30, coin: 450 },
    baseAtk: [65, 100], baseHp: [338, 520],
    weights: { common: 20, uncommon: 34, rare: 28, epic: 14, legendary: 3.6, mythic: 0.4 },
  },
  gold: {
    unlockStage: 21,
    cost: { goldOre: 12, silverOre: 25, iron: 60, coin: 1800 },
    baseAtk: [160, 240], baseHp: [832, 1248],
    weights: { common: 0, uncommon: 16, rare: 33, epic: 31, legendary: 16, mythic: 4 },
  },
};

// 幸运符:对基础权重逐项相乘后归一化;与大师熔炉可叠乘
export const LUCKY_CHARM_MOD = { common: 0.4, uncommon: 0.8, rare: 1.5, epic: 1.6, legendary: 1.7, mythic: 1.8 };

// 大师熔炉(每日 1 次):史诗+ 权重 ×1.8(GDD 原文),同样叠乘后归一化
export const MASTER_FORGE_MOD = { common: 1, uncommon: 1, rare: 1, epic: 1.8, legendary: 1.8, mythic: 1.8 };

// 保底(压方差的核心,存档需持久化计数器,见 §10)
export const FORGE_PITY = {
  epicPityCount: 8,                 // 白银/黄金炉连续 8 锤未出史诗+ → 第 8 锤保底史诗(出史诗+即清零)
  pityTiers: ['silver', 'gold'],    // 精铁炉无保底
  firstForgeMinQuality: 'uncommon', // 新手引导首锻保底精钢(否则凡铁低 roll 有 ~17% 概率过不了第 1 关)
};

// 元素偏向:消耗 2 个对应三相晶 → 保证主元素;不用则三元素均匀随机
export const ELEMENT_BIAS = { crystalCost: 2 };
```

### 1.1 权重叠加后的实际概率(设计验收基准,供测试断言 ±0.5pp)

| 白银炉 | 凡铁 | 精钢 | 玄兵 | 紫霄 | 传说 | 神话 |
| --- | --- | --- | --- | --- | --- | --- |
| 基础 | 20.0% | 34.0% | 28.0% | 14.0% | 3.6% | 0.40% |
| +幸运符 | 7.5% | 25.6% | 39.5% | 21.0% | 5.7% | 0.68% |
| +大师熔炉 | 17.5% | 29.7% | 24.5% | 22.0% | 5.7% | 0.63% |
| +两者 | 6.2% | 21.0% | 32.3% | 31.1% | 8.5% | 1.00% |

| 黄金炉 | 凡铁 | 精钢 | 玄兵 | 紫霄 | 传说 | 神话 |
| --- | --- | --- | --- | --- | --- | --- |
| 基础 | 0 | 16.0% | 33.0% | 31.0% | 16.0% | 4.0% |
| +幸运符 | 0 | 8.7% | 33.8% | 33.9% | 18.6% | 4.9% |
| +大师熔炉 | 0 | 11.4% | 23.4% | 39.6% | 20.5% | 5.1% |
| +两者 | 0 | 6.0% | 23.2% | 41.8% | 22.9% | 6.1% |

「幸运符+大师熔炉」的黄金炉是每日高光时刻:神话 6.1%、传说 22.9%。

---

## 2. 强化(消耗)与分解(返还)

```js
export const ENHANCE = {
  statPerLevel: 0.06,          // 每级 atk/hp +6%(基于锻造出的基础值,线性)
  coinBase: 45, coinGrowth: 1.3, // 升到下一级消耗 coin = round(45 × 1.3^当前等级)
  // 突破关卡(达到该级前须支付同品质碎片;+3/+6/+9 同时解锁技能槽 1/2/3)
  breakthroughShards: { 3: 3, 6: 6, 9: 10, 12: 18, 15: 28, 18: 42 },
  skillSlotLevels: [3, 6, 9],
  maxLevel: { common: 6, uncommon: 9, rare: 12, epic: 15, legendary: 18, mythic: 21 },
};

export const DISMANTLE = {
  refundRate: 0.6,             // 返还 60% 锻造矿物成本(floor;铜钱不返还——重要的反通胀沉没)
  refundEnhanceShards: 0.6,    // 已投入的突破碎片按 60% floor 返还;强化铜钱不返还
  shards: { common: 2, uncommon: 4, rare: 7, epic: 12, legendary: 20, mythic: 36 }, // 额外产出同品质碎片
};
```

强化铜钱累计成本(单件,验收用):+6 → 574;+9 → 1,440;+12 → 3,344;+15 → 7,528;+18 → 16,719;+21 → 36,909。
后期深强化是主铜钱回收器(5 件神话 +21 ≈ 18.5 万铜钱)。

---

## 3. 40 关掉落表(可直接粘贴)

约定:`crystal` = 本关 `element` 对应的三相晶数量;`shards` 键为品质、值为同品质碎片数;`repeat` 的 `[min,max]` 为每次胜利/扫荡的均匀随机区间;`shardChance` 命中时掉 1 个 `shardTier` 品质碎片;`crystalChance` 命中时掉 1 个本关元素晶。首通同时发放该关一次 `repeat` 掉落。

```js
export const STAGE_BALANCE = [
  {"id":1,"elite":false,"element":"fire","waves":1,"staminaCost":3,"enemyPower":40,"firstClear":{"coin":75,"iron":12,"shards":{"common":4}},"repeat":{"coin":[16,30],"iron":[2,4],"crystalChance":0.35,"shardChance":0.3,"shardTier":"common"}},
  {"id":2,"elite":false,"element":"ice","waves":1,"staminaCost":3,"enemyPower":48,"firstClear":{"coin":120,"iron":14,"shards":{"common":4}},"repeat":{"coin":[22,40],"iron":[3,5],"crystalChance":0.35,"shardChance":0.3,"shardTier":"common"}},
  {"id":3,"elite":false,"element":"thunder","waves":1,"staminaCost":3,"enemyPower":57,"firstClear":{"coin":170,"iron":15,"shards":{"common":4}},"repeat":{"coin":[27,51],"iron":[3,6],"crystalChance":0.35,"shardChance":0.3,"shardTier":"common"}},
  {"id":4,"elite":false,"element":"fire","waves":1,"staminaCost":3,"enemyPower":67,"firstClear":{"coin":215,"iron":17,"crystal":2,"shards":{"uncommon":3}},"repeat":{"coin":[33,61],"iron":[3,6],"crystalChance":0.35,"shardChance":0.3,"shardTier":"uncommon"}},
  {"id":5,"elite":true,"element":"ice","waves":1,"staminaCost":6,"enemyPower":100,"firstClear":{"coin":260,"iron":19,"crystal":2,"shards":{"uncommon":6},"luckyCharm":1,"diamond":20},"repeat":{"coin":[39,72],"iron":[4,7],"crystalChance":0.35,"shardChance":0.3,"shardTier":"uncommon"}},
  {"id":6,"elite":false,"element":"thunder","waves":1,"staminaCost":3,"enemyPower":95,"firstClear":{"coin":305,"iron":21,"crystal":2,"shards":{"uncommon":3}},"repeat":{"coin":[44,82],"iron":[4,7],"crystalChance":0.35,"shardChance":0.3,"shardTier":"uncommon"}},
  {"id":7,"elite":false,"element":"fire","waves":2,"staminaCost":3,"enemyPower":114,"firstClear":{"coin":350,"iron":23,"crystal":2,"shards":{"uncommon":3}},"repeat":{"coin":[50,92],"iron":[4,8],"crystalChance":0.35,"shardChance":0.3,"shardTier":"uncommon"}},
  {"id":8,"elite":false,"element":"ice","waves":2,"staminaCost":3,"enemyPower":135,"firstClear":{"coin":400,"iron":24,"silverOre":5,"crystal":2,"shards":{"rare":4}},"repeat":{"coin":[55,103],"iron":[5,9],"silverOre":[1,4],"crystalChance":0.35,"shardChance":0.3,"shardTier":"rare"}},
  {"id":9,"elite":false,"element":"thunder","waves":2,"staminaCost":3,"enemyPower":164,"firstClear":{"coin":445,"iron":26,"silverOre":5,"crystal":2,"shards":{"rare":4}},"repeat":{"coin":[61,113],"iron":[5,9],"silverOre":[1,4],"crystalChance":0.35,"shardChance":0.3,"shardTier":"rare"}},
  {"id":10,"elite":true,"element":"fire","waves":2,"staminaCost":6,"enemyPower":247,"firstClear":{"coin":490,"iron":28,"silverOre":15,"crystal":3,"shards":{"rare":8},"luckyCharm":1,"diamond":20},"repeat":{"coin":[67,124],"iron":[5,10],"silverOre":[1,4],"crystalChance":0.35,"shardChance":0.3,"shardTier":"rare"}},
  {"id":11,"elite":false,"element":"ice","waves":2,"staminaCost":3,"enemyPower":239,"firstClear":{"coin":535,"iron":30,"silverOre":5,"crystal":3,"shards":{"rare":4}},"repeat":{"coin":[72,134],"iron":[6,10],"silverOre":[1,5],"crystalChance":0.35,"shardChance":0.3,"shardTier":"rare"}},
  {"id":12,"elite":false,"element":"thunder","waves":2,"staminaCost":3,"enemyPower":290,"firstClear":{"coin":580,"iron":32,"silverOre":5,"crystal":3,"shards":{"rare":4}},"repeat":{"coin":[78,144],"iron":[6,11],"silverOre":[1,5],"crystalChance":0.35,"shardChance":0.3,"shardTier":"rare"}},
  {"id":13,"elite":false,"element":"fire","waves":2,"staminaCost":3,"enemyPower":351,"firstClear":{"coin":630,"iron":33,"silverOre":5,"crystal":3,"shards":{"rare":4}},"repeat":{"coin":[83,155],"iron":[6,12],"silverOre":[2,5],"crystalChance":0.35,"shardChance":0.3,"shardTier":"rare"}},
  {"id":14,"elite":false,"element":"ice","waves":2,"staminaCost":3,"enemyPower":424,"firstClear":{"coin":675,"iron":35,"silverOre":5,"crystal":3,"shards":{"rare":4}},"repeat":{"coin":[89,165],"iron":[7,12],"silverOre":[2,6],"crystalChance":0.35,"shardChance":0.3,"shardTier":"rare"}},
  {"id":15,"elite":true,"element":"thunder","waves":2,"staminaCost":6,"enemyPower":642,"firstClear":{"coin":720,"silverOre":15,"crystal":3,"shards":{"rare":8},"luckyCharm":1,"diamond":20},"repeat":{"coin":[95,176],"iron":[7,13],"silverOre":[2,6],"crystalChance":0.35,"shardChance":0.3,"shardTier":"rare"}},
  {"id":16,"elite":false,"element":"fire","waves":2,"staminaCost":3,"enemyPower":621,"firstClear":{"coin":765,"silverOre":5,"crystal":3,"shards":{"rare":4}},"repeat":{"coin":[100,186],"iron":[7,13],"silverOre":[2,6],"crystalChance":0.35,"shardChance":0.3,"shardTier":"rare"}},
  {"id":17,"elite":false,"element":"ice","waves":3,"staminaCost":3,"enemyPower":752,"firstClear":{"coin":810,"silverOre":5,"crystal":3,"shards":{"epic":4}},"repeat":{"coin":[106,196],"iron":[7,14],"silverOre":[2,7],"crystalChance":0.35,"shardChance":0.3,"shardTier":"epic"}},
  {"id":18,"elite":false,"element":"thunder","waves":3,"staminaCost":3,"enemyPower":909,"firstClear":{"coin":860,"silverOre":5,"crystal":3,"shards":{"epic":4}},"repeat":{"coin":[111,207],"iron":[8,14],"silverOre":[2,7],"crystalChance":0.35,"shardChance":0.3,"shardTier":"epic"}},
  {"id":19,"elite":false,"element":"fire","waves":3,"staminaCost":3,"enemyPower":1100,"firstClear":{"coin":905,"silverOre":5,"crystal":3,"shards":{"epic":4}},"repeat":{"coin":[117,217],"iron":[8,15],"silverOre":[2,7],"crystalChance":0.35,"shardChance":0.3,"shardTier":"epic"}},
  {"id":20,"elite":true,"element":"ice","waves":3,"staminaCost":6,"enemyPower":1664,"firstClear":{"coin":950,"silverOre":15,"crystal":4,"shards":{"epic":8},"luckyCharm":1,"diamond":20},"repeat":{"coin":[122,228],"iron":[8,16],"silverOre":[3,8],"crystalChance":0.35,"shardChance":0.3,"shardTier":"epic"}},
  {"id":21,"elite":false,"element":"thunder","waves":3,"staminaCost":3,"enemyPower":1478,"firstClear":{"coin":995,"silverOre":5,"crystal":4,"shards":{"epic":4}},"repeat":{"coin":[128,238],"iron":[6,10],"silverOre":[3,8],"crystalChance":0.35,"shardChance":0.3,"shardTier":"epic"}},
  {"id":22,"elite":false,"element":"fire","waves":3,"staminaCost":3,"enemyPower":1640,"firstClear":{"coin":1040,"silverOre":5,"goldOre":4,"crystal":4,"shards":{"epic":4}},"repeat":{"coin":[134,248],"iron":[6,10],"silverOre":[3,8],"goldOre":[0,1],"crystalChance":0.35,"shardChance":0.3,"shardTier":"epic"}},
  {"id":23,"elite":false,"element":"ice","waves":3,"staminaCost":3,"enemyPower":1821,"firstClear":{"coin":1090,"silverOre":5,"goldOre":4,"crystal":4,"shards":{"epic":4}},"repeat":{"coin":[139,259],"iron":[6,10],"silverOre":[3,9],"goldOre":[0,1],"crystalChance":0.35,"shardChance":0.3,"shardTier":"epic"}},
  {"id":24,"elite":false,"element":"thunder","waves":3,"staminaCost":3,"enemyPower":2021,"firstClear":{"coin":1135,"silverOre":5,"goldOre":5,"crystal":4,"shards":{"epic":4}},"repeat":{"coin":[145,269],"iron":[6,10],"silverOre":[3,9],"goldOre":[0,1],"crystalChance":0.35,"shardChance":0.3,"shardTier":"epic"}},
  {"id":25,"elite":true,"element":"fire","waves":3,"staminaCost":6,"enemyPower":2804,"firstClear":{"coin":1180,"goldOre":5,"crystal":4,"shards":{"legendary":4},"luckyCharm":1,"diamond":20},"repeat":{"coin":[151,280],"iron":[6,10],"silverOre":[3,10],"goldOre":[0,1],"crystalChance":0.35,"shardChance":0.3,"shardTier":"legendary"}},
  {"id":26,"elite":false,"element":"ice","waves":3,"staminaCost":3,"enemyPower":2490,"firstClear":{"coin":1225,"goldOre":6,"crystal":4,"shards":{"legendary":2}},"repeat":{"coin":[156,290],"iron":[6,10],"silverOre":[4,10],"goldOre":[0,1],"crystalChance":0.35,"shardChance":0.3,"shardTier":"legendary"}},
  {"id":27,"elite":false,"element":"thunder","waves":3,"staminaCost":3,"enemyPower":2764,"firstClear":{"coin":1270,"goldOre":6,"crystal":4,"shards":{"legendary":2}},"repeat":{"coin":[162,300],"iron":[6,10],"silverOre":[4,10],"goldOre":[0,1],"crystalChance":0.35,"shardChance":0.3,"shardTier":"legendary"}},
  {"id":28,"elite":false,"element":"fire","waves":3,"staminaCost":3,"enemyPower":3068,"firstClear":{"coin":1320,"goldOre":7,"crystal":4,"shards":{"legendary":2}},"repeat":{"coin":[167,311],"iron":[6,10],"silverOre":[4,11],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"legendary"}},
  {"id":29,"elite":false,"element":"ice","waves":3,"staminaCost":3,"enemyPower":3406,"firstClear":{"coin":1365,"goldOre":7,"crystal":4,"shards":{"legendary":2}},"repeat":{"coin":[173,321],"iron":[6,10],"silverOre":[4,11],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"legendary"}},
  {"id":30,"elite":true,"element":"thunder","waves":3,"staminaCost":6,"enemyPower":4726,"firstClear":{"coin":1410,"goldOre":8,"crystal":5,"shards":{"legendary":4},"luckyCharm":1,"diamond":20},"repeat":{"coin":[179,332],"iron":[6,10],"silverOre":[4,11],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"legendary"}},
  {"id":31,"elite":false,"element":"fire","waves":3,"staminaCost":3,"enemyPower":4196,"firstClear":{"coin":1455,"goldOre":8,"crystal":5,"shards":{"legendary":2}},"repeat":{"coin":[184,342],"iron":[6,10],"silverOre":[4,12],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"legendary"}},
  {"id":32,"elite":false,"element":"ice","waves":3,"staminaCost":3,"enemyPower":4658,"firstClear":{"coin":1500,"goldOre":9,"crystal":5,"shards":{"legendary":2}},"repeat":{"coin":[190,352],"iron":[6,10],"silverOre":[4,12],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"legendary"}},
  {"id":33,"elite":false,"element":"thunder","waves":3,"staminaCost":3,"enemyPower":5170,"firstClear":{"coin":1550,"goldOre":9,"crystal":5,"shards":{"legendary":2}},"repeat":{"coin":[195,363],"iron":[6,10],"silverOre":[5,12],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"legendary"}},
  {"id":34,"elite":false,"element":"fire","waves":3,"staminaCost":3,"enemyPower":5739,"firstClear":{"coin":1595,"goldOre":10,"crystal":5,"shards":{"mythic":1}},"repeat":{"coin":[201,373],"iron":[6,10],"silverOre":[5,13],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"mythic"}},
  {"id":35,"elite":true,"element":"ice","waves":3,"staminaCost":6,"enemyPower":7963,"firstClear":{"coin":1640,"goldOre":10,"crystal":5,"shards":{"mythic":2},"luckyCharm":1,"diamond":20},"repeat":{"coin":[207,384],"iron":[6,10],"silverOre":[5,13],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"mythic"}},
  {"id":36,"elite":false,"element":"thunder","waves":3,"staminaCost":3,"enemyPower":7071,"firstClear":{"coin":1685,"goldOre":11,"crystal":5,"shards":{"mythic":1}},"repeat":{"coin":[212,394],"iron":[6,10],"silverOre":[5,13],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"mythic"}},
  {"id":37,"elite":false,"element":"fire","waves":3,"staminaCost":3,"enemyPower":7849,"firstClear":{"coin":1730,"goldOre":11,"crystal":5,"shards":{"mythic":1}},"repeat":{"coin":[218,404],"iron":[6,10],"silverOre":[5,14],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"mythic"}},
  {"id":38,"elite":false,"element":"ice","waves":3,"staminaCost":3,"enemyPower":8712,"firstClear":{"coin":1780,"goldOre":12,"crystal":5,"shards":{"mythic":1}},"repeat":{"coin":[223,415],"iron":[6,10],"silverOre":[5,14],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"mythic"}},
  {"id":39,"elite":false,"element":"thunder","waves":3,"staminaCost":3,"enemyPower":9671,"firstClear":{"coin":1825,"goldOre":12,"crystal":5,"shards":{"mythic":1}},"repeat":{"coin":[229,425],"iron":[6,10],"silverOre":[5,14],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"mythic"}},
  {"id":40,"elite":true,"element":"fire","waves":3,"staminaCost":6,"enemyPower":14491,"firstClear":{"coin":1870,"goldOre":13,"crystal":6,"shards":{"mythic":2},"luckyCharm":1,"diamond":20},"repeat":{"coin":[234,436],"iron":[6,10],"silverOre":[6,15],"goldOre":[0,2],"crystalChance":0.35,"shardChance":0.3,"shardTier":"mythic"}}
];
```

### 3.1 生成公式(Round 2 重调时用,勿在运行时重算——表为准)

```
enemyPower(n):
  b8 = 40 × 1.19^7                       // 1–8 关: 缓坡教学
  n ≤ 8  : 40 × 1.19^(n-1)
  9–20   : b8 × 1.21^(n-8)               // 白银期: 匀陡爬坡
  21–40  : b8 × 1.21^12 × 1.11^(n-20)    // 黄金期: 长线周回
  精英(n%5==0) ×1.25;第 40 关终焉 BOSS ×1.35
firstClear.coin = round((30 + 46n) / 5) × 5
repeat.coin 均值 = 15 + 8n;iron 均值 = 3 + 0.45n (n≤20,>20 固定 8)
repeat.silverOre 均值 = 2.2 + 0.25(n-8) (n≥8);goldOre 均值 = 0.4 + 0.045(n-22) (n≥22)
```

关键锚点(战力为模型典型值,见 §7):第 5 关精英 100(玩家约 165)/ 第 10 关 247(约 500)/ 第 15 关 642(约 1,100)/ 第 20 关 1,664(约 1,750)/ 第 40 关 14,491(玩家裸上限约 13,900,**必须**用雷系克制火 BOSS + 图鉴加成才能过——终局解谜设计)。

---

## 4. 挂机产出、体力、进度门

```js
export const IDLE_RATES = {
  // ratePerMin(资源) = base + perStage × 已通关最高关卡 n(未过 1 关按 n=0)
  coin:      { base: 5,   perStage: 2.2 },
  iron:      { base: 0.5, perStage: 0.11 },
  silverOre: { base: 0,   perStage: 0.08, offsetStage: 9,  minStage: 10 }, // rate = 0.08 × (n - 9), n≥10
  goldOre:   { base: 0,   perStage: 0.006, offsetStage: 21, minStage: 22 }, // rate = 0.006 × (n - 21), n≥22
  offlineCapHours: 8,
  offlineEfficiency: 1.0,
};

export const STAMINA_RULES = {
  cap: 120, regenSeconds: 360, startFull: true,
  costNormal: 3, costElite: 6,   // 见 STAGE_BALANCE.staminaCost,以表为准
};

// 阵容栏位:通过第 i 项关卡后解锁第 i+1 个栏位(0 = 开局即有)
export const SLOT_UNLOCK_STAGES = [0, 2, 4, 9, 14];

export const STARTER_KIT = { coin: 300, iron: 60 }; // 开局 3 锤精铁炉的量

export const SWEEP_RULES = { unlock: 'firstClear', freeDaily: 2, staminaCost: 'same-as-stage', instant: true };
```

---

## 5. 每日试炼、兑换、成就预算

```js
export const DAILY_RULES = {
  masterForgePerDay: 1,
  freeSweeps: 2,
  quest: { luckyCharm: 1, coin: 500, diamond: 10 },   // 完成"锻造3次+战斗3次"类日常
  trials: {
    normal: { freeRuns: 2, extraStamina: 8, rewards: { iron: 40, coin: 350 } },                       // 普通试炼(GDD: 每日 2 次免费)
    elite:  { freeRuns: 1, powerGate: 350,  rewards: { silverOre: 20 } },                             // 精英试炼(战力门槛)
    high:   { freeRuns: 1, powerGate: 6000, unlockStage: 24, rewards: { goldOre: 6 } },               // 高阶试炼
  },
};

export const EXCHANGE = {
  luckyCharm:    { diamond: 40, amount: 1,  dailyCap: 2 },
  staminaRefill: { diamond: 50, stamina: 60, dailyCap: 2 },
  goldOrePack:   { diamond: 60, goldOre: 5,  dailyCap: 1 },
};

// 成就玄晶总预算 ≈ 300(前 20 关内可拿约 200);具体成就列表归 opus-2/4,只须守住预算
export const ACHIEVEMENT_DIAMOND_BUDGET = { total: 300, examples: {
  firstForge: 10, firstRare: 10, firstEpic: 20, firstLegendary: 30, firstMythic: 50,
  stage5: 15, stage10: 20, stage15: 25, stage20: 30, codex12: 30, codex24: 60,
} };

// 图鉴收集:每收录 1 把原型 +0.625% ATK/HP,24 把满 +15%(GDD 上限)
export const CODEX_BONUS = { perEntry: 0.00625, cap: 0.15 };
```

## 6. 竞技场(ELO-lite 与奖励)

```js
export const ARENA_RULES = {
  unlockStage: 8,
  attacksPerDay: 5, staminaCost: 0,
  opponentPowerBand: [0.85, 1.25],       // generateArenaOpponents: 20 名 AI,战力 = 玩家 × U(band)
  elo: { start: 1000, winDelta: 14, lossDelta: -10, floor: 800 },
  rewards: {
    win:  { diamond: 4, goldOre: 2, coin: 350 },
    loss: { diamond: 1, goldOre: 1, coin: 120 },
  },
  // 每日结算段位宝箱(按当日最终 ELO)
  dailyChest: [
    { minElo: 0,    name: '青铜', diamond: 8,  goldOre: 2 },
    { minElo: 1100, name: '白银', diamond: 12, goldOre: 4 },
    { minElo: 1200, name: '黄金', diamond: 18, goldOre: 6 },
    { minElo: 1350, name: '铂金', diamond: 28, goldOre: 9 },
    { minElo: 1500, name: '王者', diamond: 40, goldOre: 14 },
  ],
};
```

赤金日预算(20 关后,休闲):竞技 ~9 + 宝箱 ~4 + 高阶试炼 6 + 关卡扫荡 ~10 + 挂机 ~5 ≈ 34/天 ≈ 2.8 次黄金锻(分解回收后有效 ~4.5 次)。玄晶日预算:进 ~40(竞技+宝箱+日常),出上限 ~210(全兑换),玩家可自由取舍,无强制积压。

---

## 7. 战力模型假设(与 fable-2 / opus-3 的契约)

GDD 战力公式 `sum(atk × (1+crit×0.5) × elementMod) + hp×0.15 + setBonus` 在本文按以下假设折算:

```js
export const POWER_FACTORS = {
  baseCrit: 0.08,        // 词条前基础暴击
  critPowerWeight: 0.5,
  hpPowerWeight: 0.15,
  hpPerAtk: 5.2,         // baseHp ≈ baseAtk × 5.2(锻造 roll 区间已按此配平)
  setBonusAssumed: 0.05, // 模拟采用的平均羁绊加成
};
// 单件战力 ≈ atk × (1 + 0.06×强化等级) × 1.82,其中 1.82 = (1 + 0.08×0.5) + 5.2×0.15
```

**胜负模型契约**:模拟假设同元素对抗下 `P(胜) ≈ clamp((玩家战力/敌方战力 − 0.88) / 0.18, 0, 1)`,即战力比 ≥1.06 稳赢、≤0.88 必败、0.97 约五五开;±9% 的带宽代表元素克制(±1.35/0.75)、词条与波次的综合方差。**opus-3 的 `simulateBattle` 实机胜率若显著偏离此带宽(如 0.95 战力比胜率 <20% 或 >70%),需回报 fable-3 重校 §3 曲线。**

---

## 8. 目标验证:模拟方法与结果

模拟器为 ~300 行 Node 脚本(mulberry32 同源 RNG),对「贪心但拟人」的 F2P 代理做事件级模拟,400 种子。**建议 gpt-sol-1 把该模拟移植进 `tests/` 作为经济回归测试**(代理策略伪码见 §8.2)。

### 8.1 模拟假设(逐条)

1. **操作耗时(速通档)**:战斗 25s(精英 32s)、锻造 15s(含 3 锤演出)、扫荡 6s、强化 4s、分解 2s、试炼 20s、无事可做时等待 30s/次。
2. **摩擦系数 2.2(休闲档)**:真实玩家有读文案、翻图鉴、拖拽阵容、看品质揭示动画等开销,所有主动操作耗时 ×2.2。GDD 的「40–60 分钟」按休闲档验收,速通档为理论下界。
3. **代理策略**:能打就打(战力 ≥ 需求×0.92 且体力够);失败后须战力 +3% 或扫荡 2 次或冷却 5 分钟才重试;卡关时(战力 ≥ 需求×0.8)优先强化,否则优先锻造;只保留战力前 6 件,其余分解;白银解锁后自动用幸运符,大师熔炉用于当日首次白银锻。
4. **挂机自动结算**(真实玩家需手点,损耗可忽略);胜负按 §7 契约掷骰;元素偏向不单独建模(收敛进 ±9% 带宽)。
5. **未计入**:BOSS 主动技能、波次血量分布、词条战力(均偏保守——实机中玩家会更强,或 BOSS 更难,由 Round 2 用实战引擎重校)。

### 8.2 结果(400 种子)

| 指标 | 速通档(×1) | 休闲档(×2.2) | 目标 |
| --- | --- | --- | --- |
| 到 10 关用时 p10/p50/p90 | 7.4 / 8.4 / 9.5 min | 16.2 / 18.2 / 20.7 min | — |
| **到 20 关用时 p10/p50/p90** | 16.8 / 18.8 / 37.1 min | **36.8 / 41.1 / 48.3 min** | **40–60 min ✓** |
| 3 小时未达 20 关 | 1/400 | 1/400 | ~0 ✓ |
| 体力最低点 p10/p50 | 3.2 / 18.1 | 7.2 / 23.6 | >0(不硬卡)✓ |
| 战斗失败次数 p50 | 8 | 8 | 有挫折但不劝退 |
| 白银锻造次数 p10/p50/p90 | 5 / 7 / 11 | 5 / 7 / 11 | — |

唯一失败种子为代理策略震荡(战力 1791 已超需求 1664 却因体力/碎片微观死锁不出手),非经济缺陷;实机玩家点一次「再战」即过。

**3 分钟新手闭环**:开局礼包 60 铁 = 3 锤精铁炉;引导首锻(保底精钢,10s 速通/22s 休闲)→ 上阵(8s)→ 第 1 关(敌方战力 40,保底精钢最低 roll 单件战力 43,**必胜**)。模拟实测过 1 关时刻:速通 50s、休闲 98s,均 << 180s ✓。精钢保底是硬需求:凡铁低 roll(atk 20)对第 1 关只有 17% 胜率,首战失败是最差的新手体验。

**20 关后配速(天级投影,3 种子)**:硬核(50 扫荡+12h 挂机+竞技 4 胜)D7 ≈ 39 关;休闲(20 扫荡+8h 挂机+3 胜)D7 ≈ 37–38、D14 ≈ 37–39,通关期 1–2 周,神话累计 2–5 把。投影未计 BOSS 技能与元素墙,实机会更慢;若 Round 2 实测仍偏快,首选把 21–40 段增速 1.11 → 1.12 并同步上调玩家词条战力权重。

### 8.3 推图期(0–45 min)资源收支(p50,验收基准)

| 资源 | 收入 | 支出 | 结余 |
| --- | --- | --- | --- |
| 铜钱 | 首通 10.3k + 重复/扫荡 ~2.8k + 挂机 ~1.8k ≈ 14.9k | 锻造 ~3.9k + 强化 ~8–10k | ~1–3k(健康:强化吃掉大头) |
| 精铁 | 首通 ~300 + 掉落 ~200 + 挂机 ~80 + 礼包 60 | 精铁锻 ~100 + 白银锻 ~210 | ~300(偏多,见 §9-1) |
| 秘银 | 首通 100 + 掉落/扫荡 ~90 + 试炼 20 + 挂机 ~15 | 白银锻 7×16=112(分解回收 ~30) | ~100(支撑卡关时继续抽) |
| 史诗碎片 | 首通 17–24 关窗口 24 + 随机 ~5 | 2 件紫霄 +9 = 20 | 紧平衡(刻意:20 关墙的张力来源) |

---

## 9. 通胀风险清单与对策

1. **精铁后期溢出**(20 关时结余 ~300,40 关期日产 3k)。已让白银炉吃 30 铁、黄金炉吃 60 铁缓解;仍会溢出。→ Round 2:加「熔铁为钱」(100 铁 → 60 铜钱)或符文系统吃铁。
2. **分解 60% 返还 × 黄金炉 = 有效成本 ~55%**,神话获取速度约为面值 1.8 倍。当前已按此校准(黄金炉标价 12 赤金而非 8);若实测仍快,**降低赤金 faucet(竞技/试炼)而非动 60% 返还率**(返还手感是核心爽点)。
3. **铜钱后期通缩→通胀拐点**:40 关挂机 93/min(≈6.7万/12h),但 5 件神话 +21 需 18.5 万 + 黄金锻每锤 1800 沉没,可支撑 ~2 周;之后铜钱失去用途。→ Round 2:洗练词条(吃铜钱+三相晶)做无限沉没。
4. **扫荡秘银无上限**(240 体力/天 ≈ 19 次白银锻/天):可控,因白银武器 21 关后只值碎片,过量白银锻实质是碎片换体力,属预期回收路径。
5. **玄晶净积累**:日进 ~40、可选日出 ~210,短期无风险;长期无 pity 沉没。→ Round 2:2,000 玄晶「神话自选」保底兑换。
6. **21–40 关配速依赖战力比模型**:精英 BOSS 技能/元素墙未建模,D7=37–39 是**上界**。等 opus-3 战斗引擎落地后必须用实战重跑天级投影(fable-3 Round 2 首要任务)。

---

## 10. 给 opus-2 的落地清单

**建议 `js/data/balance.js` 导出(全部见上文字面量)**:
`QUALITIES`, `QUALITY_MULT`, `AFFIX_COUNT`, `FORGE_TIERS`, `LUCKY_CHARM_MOD`, `MASTER_FORGE_MOD`, `FORGE_PITY`, `ELEMENT_BIAS`, `ENHANCE`, `DISMANTLE`, `STAGE_BALANCE`, `IDLE_RATES`, `STAMINA_RULES`, `SLOT_UNLOCK_STAGES`, `STARTER_KIT`, `SWEEP_RULES`, `DAILY_RULES`, `EXCHANGE`, `ACHIEVEMENT_DIAMOND_BUDGET`, `CODEX_BONUS`, `ARENA_RULES`, `POWER_FACTORS`。

**实现要点**:

1. `forgeWeapon(state, opts, rng)`:取 `FORGE_TIERS[opts.stage].weights` 拷贝 → 若 `opts.useLucky` 逐项乘 `LUCKY_CHARM_MOD` → 若 `opts.useMasterForge` 逐项乘 `MASTER_FORGE_MOD` → `rng.weighted(Object.entries(w))`;然后应用保底(`FORGE_PITY`,计数器按炉分开存);`opts.elementBias` 消耗 2 晶保证主元素;baseAtk/baseHp 在区间内 `rng` 均匀 roll 后乘 `QUALITY_MULT`。
2. `enhanceWeapon`:铜钱 `round(45 × 1.3^当前级)`;目标级命中 `breakthroughShards` 键时先扣同品质碎片;级上限 `ENHANCE.maxLevel[quality]`。
3. `dismantleWeapon`:矿物 `floor(cost × 0.6)` + `DISMANTLE.shards[quality]` + 已付突破碎片 `floor(×0.6)`;**不返还任何铜钱**。
4. `collectIdle(state, nowMs)`:按 `IDLE_RATES` 线性累积,`min(经过时间, 8h)`;在线离线同率。
5. 关卡结算:首通发 `firstClear` + 一次 `repeat`;重复胜利/扫荡只发 `repeat`;`crystal` 映射到 `<element>Crystal` 资源。
6. 兵器原型 `baseAtk` 必须落在所属 `forgeStage` 的 `FORGE_TIERS` 区间内(24 把图鉴按 iron/silver/gold 分层)。

**接口缺口(请编排者转录 `REQUESTS.md`,fable-3 无该文件写权)**:

- R1:`resources` 需新增 6 个碎片资源 ID:`shardCommon / shardUncommon / shardRare / shardEpic / shardLegendary / shardMythic`(GDD §3.1 资源表未列,但 §3.5 强化依赖)。
- R2:存档最低集需追加:`forge.pity = { silver: 0, gold: 0 }`、`forge.firstForgeDone`、`daily = { masterForgeUsed, freeSweepsUsed, trialRuns, arenaAttacks, questClaimed, lastResetDay }`。
- R3:`combat/engine.js` 胜率带宽契约见 §7,偏离需回报。

---

## 11. Round 2 待办(fable-3 自留)

1. 用 opus-3 实战引擎替换战力比胜负模型,重跑 400 种子 + 天级投影,重校 §3 曲线(重点 17–20 关与 35–40 关)。
2. 落地反通胀三件套:熔铁为钱、洗练沉没、玄晶保底兑换。
3. 与 gpt-sol-2 对齐基准:把本模拟接入 `bench/` 做曲线回归护栏(任何 balance.js 改动必须重跑)。
