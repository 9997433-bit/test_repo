// 英雄表。字段语义见 docs/GDD.md §7。
// 兼容约束：{key,name,rarity,role,lane,base,skill{name,star,kind,value},blurb}
// 与 RARITY_MULT 被 combat/battle.js、heroes/roster.js、ui 直接消费，禁止改名；
// 原 7 个 key（sam/yilong/mia/kan/rambo/drunk_dragon/butcher）保持不变。
//
// skill 字段完整语义（battle.js 现行实现 + Round 2 应读表的常数）：
//   kind    taunt 开场嘲讽（star ≥ skill.star 时生效）
//           multishot 每次普攻分裂（现行写死 ×1.15，应改为 1 + value*0.1 → value=2 时 ×1.2）
//           heal 每 period 回合治疗血量比例最低的队友，量 = value × star
//           burst 每 period 回合造成 value 倍伤害
//           aoe 每 period 回合对敌全体造成本次伤害 × value
//           hook 首回合把敌方后排钩到前排
//           buff 每 period 回合自身攻击 ×(1+value)，最多叠 3 层（现行未实现，Round 2 必接）
//   period  技能触发的回合间隔（与现行 t%4/t%3/t%5 常数对齐；0 = 仅首回合，null = 被动常驻）
//   target  self / ally-lowest / enemy / enemy-all / enemy-back
//   desc    战报与英雄卡展示文案
//
// 新增字段（Round 2 接线）：
//   growth      每星战斗属性成长（battle.js 现行写死 0.18，应改读表）
//   assign      委任规格：{ likes: 建筑id, mult: 擅长建筑的加成倍率 }。
//               现行 sim 写死 1 + star*0.12；应改为 1 + star*ASSIGN_RULES.basePerStar
//               ×（委任到 likes 建筑时再乘 assign.mult）。
//   recruitCost 广播站招募成本（null = 剧情赠送/免费；现行 recruit 免费，应改读表）
//   unlockHint  招募入口的引导文案

export const HEROES = {
  sam: {
    key: "sam",
    name: "大嘴山姆",
    rarity: "legend",
    role: "tank",
    lane: "front",
    base: { hp: 420, atk: 42, def: 28, spd: 88 },
    skill: { name: "嘲讽全场", star: 3, kind: "taunt", value: 1, period: null, target: "self",
      desc: "三星起开场嘲讽：全场敌人只许打我。" },
    growth: 0.2,
    assign: { likes: "wall", mult: 2 },
    recruitCost: { hourglass: 6 },
    unlockHint: "广播站一开张就在呼救的老实人。",
    blurb: "零氪开荒最稳前排。三星之后全场都得打我。",
  },
  yilong: {
    key: "yilong",
    name: "一龙",
    rarity: "legend",
    role: "archer",
    lane: "back",
    base: { hp: 260, atk: 68, def: 12, spd: 110 },
    skill: { name: "连珠", star: 1, kind: "multishot", value: 2, period: 1, target: "enemy",
      desc: "普攻分裂两支，稳定持续输出。" },
    growth: 0.18,
    assign: { likes: "fish_chair", mult: 2 },
    recruitCost: { badge: 4 },
    unlockHint: "推过 4 关攒够徽章即可招募。",
    blurb: "远程持续输出，推图稳定工兵。",
  },
  mia: {
    key: "mia",
    name: "米娅",
    rarity: "legend",
    role: "support",
    lane: "back",
    base: { hp: 240, atk: 28, def: 14, spd: 102 },
    skill: { name: "潮汐守护", star: 1, kind: "heal", value: 36, period: 3, target: "ally-lowest",
      desc: "每 3 回合治疗血线最低的队友，量随星级提升。" },
    growth: 0.18,
    assign: { likes: "still", mult: 2 },
    recruitCost: null,
    unlockHint: "启航赠送，命运钦点的秘书长。",
    blurb: "推进主线就送的超强辅助。",
  },
  kan: {
    key: "kan",
    name: "巫师老侃",
    rarity: "epic",
    role: "mage",
    lane: "back",
    base: { hp: 220, atk: 58, def: 10, spd: 96 },
    skill: { name: "盐雾诅咒", star: 2, kind: "aoe", value: 0.45, period: 5, target: "enemy-all",
      desc: "每 5 回合对敌全体泼一轮咸雾，二星解锁。" },
    growth: 0.18,
    assign: { likes: "seed", mult: 2 },
    recruitCost: { badge: 5 },
    unlockHint: "自称会法术的老头，选种是真有一手。",
    blurb: "减益 + 群体，打工人法师本法师。",
  },
  rambo: {
    key: "rambo",
    name: "兰博",
    rarity: "legend",
    role: "carry",
    lane: "front",
    base: { hp: 300, atk: 82, def: 16, spd: 108 },
    skill: { name: "狂浪连斩", star: 2, kind: "burst", value: 2.2, period: 4, target: "enemy",
      desc: "每 4 回合一记 2.2 倍重斩，二星解锁。" },
    growth: 0.2,
    assign: { likes: "salvage", mult: 2 },
    recruitCost: { badge: 8 },
    unlockHint: "肌肉即正义。徽章攒到 8 枚请他上筏。",
    blurb: "爆发主 C。山姆嘲讽，兰博收割。",
  },
  drunk_dragon: {
    key: "drunk_dragon",
    name: "微醺之龙",
    rarity: "legend",
    role: "warrior",
    lane: "front",
    base: { hp: 340, atk: 64, def: 20, spd: 94 },
    skill: { name: "酒劲", star: 2, kind: "buff", value: 0.35, period: 3, target: "self",
      desc: "每 3 回合上头一层，自身攻击 +35%，最多叠 3 层（Round 2 必接）。" },
    growth: 0.2,
    assign: { likes: "workshop", mult: 2 },
    recruitCost: { badge: 10 },
    unlockHint: "闻到工坊木屑味就走不动道的龙。",
    blurb: "越打越醉，越醉越勇。",
  },
  butcher: {
    key: "butcher",
    name: "机器屠夫",
    rarity: "epic",
    role: "hook",
    lane: "front",
    base: { hp: 280, atk: 60, def: 18, spd: 100 },
    skill: { name: "铁钩", star: 1, kind: "hook", value: 1, period: 0, target: "enemy-back",
      desc: "开战即把敌方后排钩到脸上集火。" },
    growth: 0.18,
    assign: { likes: "fish_plant", mult: 2 },
    recruitCost: { badge: 6 },
    unlockHint: "切鱼厂梦之临时工，钩子比刀快。",
    blurb: "先手钩人集火，对角线站位克他。",
  },

  // ── 开荒补充英雄（低品质，让广播站早期就有梯度）──────
  tin_can: {
    key: "tin_can",
    name: "铁皮罐头",
    rarity: "common",
    role: "tank",
    lane: "front",
    base: { hp: 320, atk: 36, def: 26, spd: 84 },
    skill: { name: "硬壳", star: 2, kind: "taunt", value: 1, period: null, target: "self",
      desc: "二星起开场嘲讽。平民版山姆，皮实耐造。" },
    growth: 0.16,
    assign: { likes: "salvage", mult: 2 },
    recruitCost: { hourglass: 4 },
    unlockHint: "第一批呼救里嗓门最大的。",
    blurb: "被海泡了三年的老兵罐头，开荒挡刀专用。",
  },
  coco: {
    key: "coco",
    name: "椰子妹",
    rarity: "rare",
    role: "archer",
    lane: "back",
    base: { hp: 230, atk: 56, def: 10, spd: 112 },
    skill: { name: "双椰快投", star: 1, kind: "multishot", value: 2, period: 1, target: "enemy",
      desc: "两颗椰子一起扔，普攻分裂。" },
    growth: 0.16,
    assign: { likes: "farm", mult: 2 },
    recruitCost: { hourglass: 8 },
    unlockHint: "扔椰子百发百中，种地也是一把好手。",
    blurb: "开荒期最实惠的后排输出。",
  },
  doc_shui: {
    key: "doc_shui",
    name: "水博士",
    rarity: "rare",
    role: "support",
    lane: "back",
    base: { hp: 250, atk: 30, def: 12, spd: 98 },
    skill: { name: "净水喷雾", star: 1, kind: "heal", value: 24, period: 3, target: "ally-lowest",
      desc: "每 3 回合一瓶自研补剂，治疗血线最低队友。" },
    growth: 0.16,
    assign: { likes: "still", mult: 2 },
    recruitCost: { hourglass: 8 },
    unlockHint: "论文全淹了，人还很乐观。",
    blurb: "米娅忙不过来时的第二奶妈。",
  },
};

export const RARITY_MULT = { common: 1, rare: 1.08, epic: 1.16, legend: 1.28 };

// 委任规则（Round 2 接线：sim.assignedBonus 改读本表）。
// 现行公式 1 + star*0.12 保持为基准；委任到 assign.likes 指定建筑时，
// 星级加成部分乘 assign.mult（如二星山姆守围栏：1 + 2*0.12*2 = 1.48）。
export const ASSIGN_RULES = { basePerStar: 0.12, specialtyField: "assign" };

// 升星消耗（roster.starUp 现行写死 star*10，本表为唯一口径；shard 收入见 stages/dive 表）。
export const STAR_RULES = { maxStar: 5, shardCost: (star) => star * 10 };
