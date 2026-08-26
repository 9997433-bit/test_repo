/**
 * 冒险模式静态表：6 章 × 4 关 = 24 关（每章第 4 关为 BOSS 关）。
 *
 * 字段约定：
 * - id          "章-关"，与存档 adventureStage（1..24 顺序号）换算：order = (chapter-1)*4 + index
 * - hpMult / dmgMult  普通敌人数值倍率（乘 enemies.js 基准值；BOSS 用绝对值不乘）
 * - layout.summary    砖/钉布局摘要（关卡生成器按 features 拼装，摘要供 UI 与文档）
 * - layout.features   布局特征标签，legend 见 LAYOUT_FEATURES
 * - waves             敌人波次；{ units:[{id,n,elite?}], formation } 或 { boss:"bossId" }
 * - reward.gold       重复通关金币；firstClear 为首通额外奖励（金币 + 指定英雄碎片）
 */
export const CHAPTERS = [
  { id: 1, name: "农场晨曦", theme: "farm_dawn", bossId: "scarecrow_roc", skyColor: "#FFE8A3", desc: "干草与晨光，禽类天团的新手村。" },
  { id: 2, name: "夜市霓虹", theme: "night_market", bossId: "bbq_king", skyColor: "#2B2D42", desc: "灯牌闪烁的宵夜战场，小心烤串的香味。" },
  { id: 3, name: "火山温泉", theme: "volcano_spring", bossId: "magma_bathmaster", skyColor: "#D64933", desc: "蒸汽与岩浆齐飞，冰系英雄的主场。" },
  { id: 4, name: "冰川港", theme: "glacier_port", bossId: "sea_god_statue", skyColor: "#A9D6E5", desc: "低摩擦冰面与集装箱迷宫，弹道会漂移。" },
  { id: 5, name: "电路都市", theme: "circuit_city", bossId: "mecha_incubator", skyColor: "#10002B", desc: "传送门与磁浮轨道，碰撞流的乐园。" },
  { id: 6, name: "魔王厨房", theme: "demon_kitchen", bossId: "demon_fryer", skyColor: "#3C1518", desc: "最终章：把魔王油锅掀个底朝天。" },
];

/** 布局特征 legend（O1/O4 生成关卡时的语义约定，仅描述不含逻辑）。 */
export const LAYOUT_FEATURES = {
  pegTriangle: "三角钉阵（小型分流）",
  pegGrid: "矩阵钉网（密集反弹区）",
  pegDiamond: "菱形钉阵（中央聚流）",
  pegArc: "弧形钉排（导轨式引导）",
  slopeLeft: "左侧斜面（向中导流）",
  slopeRight: "右侧斜面（向中导流）",
  brickRow: "横排可碎砖（1-2 行）",
  brickWall: "高血量砖墙（需绕后或炸开）",
  bombBrick: "炸弹砖（击碎后半径 90 爆炸，伤害 60）",
  movingBrickRow: "水平往返移动砖排",
  icePatch: "低摩擦冰面（蛋滑行不减速）",
  fanUp: "上吹风扇（竖直加速度场，托举蛋）",
  fanSide: "侧吹风扇（水平加速度场，弯曲弹道）",
  portalPair: "成对传送门（进 A 出 B，保留速度）",
  nest: "中央巢穴砖堆（包裹目标的环形掩体）",
};

export const STAGES = [
  /* ============ 第 1 章 · 农场晨曦 ============ */
  {
    id: "1-1", chapter: 1, index: 1, name: "破壳晨光", boss: false,
    hpMult: 1.0, dmgMult: 1.0,
    layout: { summary: "两行干草砖打底，中央 4 钉小三角，视野开阔的教学关。", features: ["brickRow", "pegTriangle"] },
    waves: [
      { formation: "bottom_line", units: [{ id: "slime_brick", n: 3 }] },
      { formation: "bottom_line", units: [{ id: "slime_brick", n: 4 }] },
    ],
    reward: { gold: 30, firstClear: { gold: 60, shards: { pep_chick: 4 } } },
  },
  {
    id: "1-2", chapter: 1, index: 2, name: "谷仓弹跳", boss: false,
    hpMult: 1.12, dmgMult: 1.0,
    layout: { summary: "左右谷仓斜面向中导流，3×3 钉网居中，两列干草砖。", features: ["slopeLeft", "slopeRight", "pegGrid", "brickRow"] },
    waves: [
      { formation: "bottom_line", units: [{ id: "slime_brick", n: 3 }, { id: "pigeon_bandit", n: 1 }] },
      { formation: "scatter", units: [{ id: "slime_brick", n: 3 }, { id: "pigeon_bandit", n: 2 }] },
    ],
    reward: { gold: 35, firstClear: { gold: 70, shards: { drum_chick: 4 } } },
  },
  {
    id: "1-3", chapter: 1, index: 3, name: "稻草人的注视", boss: false,
    hpMult: 1.24, dmgMult: 1.0,
    layout: { summary: "一行移动干草车砖来回巡逻，2 颗炸弹南瓜藏在钉弧下。", features: ["movingBrickRow", "bombBrick", "pegArc"] },
    waves: [
      { formation: "scatter", units: [{ id: "slime_brick", n: 4 }, { id: "pigeon_bandit", n: 1 }] },
      { formation: "bottom_line", units: [{ id: "armor_pig", n: 1 }, { id: "slime_brick", n: 2 }] },
      { formation: "brick_nest", units: [{ id: "heal_totem", n: 1 }, { id: "slime_brick", n: 3 }] },
    ],
    reward: { gold: 40, firstClear: { gold: 80, shards: { pep_chick: 4 } } },
  },
  {
    id: "1-4", chapter: 1, index: 4, name: "大鹏之巢", boss: true,
    hpMult: 1.3, dmgMult: 1.0,
    layout: { summary: "中央巢穴砖堆护住 BOSS，上吹风扇托举弹道，需借斜角入巢。", features: ["nest", "fanUp", "brickWall"] },
    waves: [
      { formation: "top_drop", units: [{ id: "pigeon_bandit", n: 3 }] },
      { boss: "scarecrow_roc" },
    ],
    reward: { gold: 60, firstClear: { gold: 120, shards: { drum_chick: 6 } } },
  },

  /* ============ 第 2 章 · 夜市霓虹 ============ */
  {
    id: "2-1", chapter: 2, index: 1, name: "霓虹开市", boss: false,
    hpMult: 1.6, dmgMult: 1.25,
    layout: { summary: "菱形霓虹钉阵居中聚流，灯牌砖悬挂两侧。", features: ["pegDiamond", "brickRow"] },
    waves: [
      { formation: "scatter", units: [{ id: "slime_brick", n: 4 }, { id: "neon_moth", n: 2 }] },
      { formation: "top_drop", units: [{ id: "neon_moth", n: 3 }, { id: "pigeon_bandit", n: 2 }] },
    ],
    reward: { gold: 45, firstClear: { gold: 90, shards: { hiphop_duck: 4 } } },
  },
  {
    id: "2-2", chapter: 2, index: 2, name: "烤串巷", boss: false,
    hpMult: 1.79, dmgMult: 1.25,
    layout: { summary: "两侧斜面油槽向中导流，3 颗炸弹辣椒砖等着连锁。", features: ["slopeLeft", "slopeRight", "bombBrick"] },
    waves: [
      { formation: "bottom_line", units: [{ id: "armor_pig", n: 2 }, { id: "slime_brick", n: 3 }] },
      { formation: "scatter", units: [{ id: "neon_moth", n: 4 }, { id: "heal_totem", n: 1 }] },
    ],
    reward: { gold: 50, firstClear: { gold: 100, shards: { ninja_goose: 6 } } },
  },
  {
    id: "2-3", chapter: 2, index: 3, name: "厨子狐的摊位", boss: false,
    hpMult: 1.98, dmgMult: 1.25,
    layout: { summary: "摊位砖墙挡住正面弹道，需绕后或用炸弹砖开路；精英厨子狐坐镇。", features: ["brickWall", "pegGrid", "bombBrick"] },
    waves: [
      { formation: "scatter", units: [{ id: "slime_brick", n: 4 }, { id: "pigeon_bandit", n: 2 }] },
      { formation: "brick_nest", units: [{ id: "chef_fox", n: 1 }, { id: "neon_moth", n: 2 }] },
    ],
    reward: { gold: 58, firstClear: { gold: 116, shards: { hiphop_duck: 4 } } },
  },
  {
    id: "2-4", chapter: 2, index: 4, name: "烤炉之王", boss: true,
    hpMult: 2.08, dmgMult: 1.25,
    layout: { summary: "双传送门连通左右烤炉，钎子钉排成串，弹道可无限循环蓄连击。", features: ["portalPair", "pegGrid"] },
    waves: [
      { formation: "top_drop", units: [{ id: "neon_moth", n: 3 }] },
      { boss: "bbq_king" },
    ],
    reward: { gold: 90, firstClear: { gold: 180, shards: { ninja_goose: 8 } } },
  },

  /* ============ 第 3 章 · 火山温泉 ============ */
  {
    id: "3-1", chapter: 3, index: 1, name: "温泉迷雾", boss: false,
    hpMult: 2.5, dmgMult: 1.5,
    layout: { summary: "两台上吹风扇制造蒸汽气流，岩石砖散布，弹道被热气托举。", features: ["fanUp", "pegGrid", "brickRow"] },
    waves: [
      { formation: "bottom_line", units: [{ id: "magma_snail", n: 2 }, { id: "slime_brick", n: 3 }] },
      { formation: "scatter", units: [{ id: "armor_pig", n: 2 }, { id: "magma_snail", n: 1 }] },
    ],
    reward: { gold: 62, firstClear: { gold: 124, shards: { grace_goose: 4 } } },
  },
  {
    id: "3-2", chapter: 3, index: 2, name: "岩浆滑梯", boss: false,
    hpMult: 2.8, dmgMult: 1.5,
    layout: { summary: "连续三段斜面滑梯逐级导流，底部埋炸弹岩浆包。", features: ["slopeLeft", "slopeRight", "bombBrick", "pegArc"] },
    waves: [
      { formation: "scatter", units: [{ id: "magma_snail", n: 3 }, { id: "pigeon_bandit", n: 2 }] },
      { formation: "bottom_line", units: [{ id: "spike_crab", n: 2 }, { id: "slime_brick", n: 3 }] },
    ],
    reward: { gold: 70, firstClear: { gold: 140, shards: { mech_goose: 6 } } },
  },
  {
    id: "3-3", chapter: 3, index: 3, name: "汤池守卫", boss: false,
    hpMult: 3.1, dmgMult: 1.5,
    layout: { summary: "两座回复图腾藏在岩壁砖后，钉盾蟹排成前排肉墙。", features: ["brickWall", "pegTriangle"] },
    waves: [
      { formation: "bottom_line", units: [{ id: "spike_crab", n: 3 }, { id: "heal_totem", n: 1 }] },
      { formation: "brick_nest", units: [{ id: "armor_pig", n: 2 }, { id: "heal_totem", n: 1 }, { id: "magma_snail", n: 2 }] },
    ],
    reward: { gold: 80, firstClear: { gold: 160, shards: { grace_goose: 4 } } },
  },
  {
    id: "3-4", chapter: 3, index: 4, name: "岩浆浴霸", boss: true,
    hpMult: 3.25, dmgMult: 1.5,
    layout: { summary: "浴池中央 BOSS 泡汤，两侧岩浆瀑布封路，顶部钉弧是唯一安全导轨。", features: ["pegArc", "brickRow"] },
    waves: [
      { formation: "scatter", units: [{ id: "magma_snail", n: 2 }, { id: "spike_crab", n: 1 }] },
      { boss: "magma_bathmaster" },
    ],
    reward: { gold: 125, firstClear: { gold: 250, shards: { mech_goose: 8 } } },
  },

  /* ============ 第 4 章 · 冰川港 ============ */
  {
    id: "4-1", chapter: 4, index: 1, name: "破冰航道", boss: false,
    hpMult: 3.8, dmgMult: 1.8,
    layout: { summary: "底部大面积低摩擦冰面，集装箱砖堆立在两侧航道口。", features: ["icePatch", "brickWall", "pegGrid"] },
    waves: [
      { formation: "bottom_line", units: [{ id: "frost_seal", n: 2 }, { id: "slime_brick", n: 3 }] },
      { formation: "scatter", units: [{ id: "frost_seal", n: 2 }, { id: "pigeon_bandit", n: 2 }, { id: "armor_pig", n: 1 }] },
    ],
    reward: { gold: 84, firstClear: { gold: 168, shards: { emperor_penguin: 6 } } },
  },
  {
    id: "4-2", chapter: 4, index: 2, name: "浮冰跳台", boss: false,
    hpMult: 4.26, dmgMult: 1.8,
    layout: { summary: "一行移动浮冰砖载着敌人漂流，两座冰锥钉三角制造乱反射。", features: ["movingBrickRow", "pegTriangle", "icePatch"] },
    waves: [
      { formation: "scatter", units: [{ id: "frost_seal", n: 3 }, { id: "spike_crab", n: 1 }] },
      { formation: "brick_nest", units: [{ id: "heal_totem", n: 1 }, { id: "frost_seal", n: 2 }, { id: "slime_brick", n: 2 }] },
    ],
    reward: { gold: 95, firstClear: { gold: 190, shards: { deer_chick: 6 } } },
  },
  {
    id: "4-3", chapter: 4, index: 3, name: "港口冷库", boss: false,
    hpMult: 4.71, dmgMult: 1.8,
    layout: { summary: "冷库铁门砖墙极厚，侧吹风扇把弹道往货架间隙里弯。", features: ["brickWall", "fanSide", "pegGrid"] },
    waves: [
      { formation: "bottom_line", units: [{ id: "armor_pig", n: 3 }, { id: "frost_seal", n: 2 }] },
      { formation: "brick_nest", units: [{ id: "chef_fox", n: 1 }, { id: "frost_seal", n: 2 }] },
    ],
    reward: { gold: 108, firstClear: { gold: 216, shards: { emperor_penguin: 6 } } },
  },
  {
    id: "4-4", chapter: 4, index: 4, name: "海神像前", boss: true,
    hpMult: 4.94, dmgMult: 1.8,
    layout: { summary: "雕像基座砖阶梯层层设防，冰面 + 双钉弧让走位漂移不定。", features: ["icePatch", "pegArc", "brickRow"] },
    waves: [
      { formation: "top_drop", units: [{ id: "frost_seal", n: 3 }] },
      { boss: "sea_god_statue" },
    ],
    reward: { gold: 165, firstClear: { gold: 330, shards: { deer_chick: 8 } } },
  },

  /* ============ 第 5 章 · 电路都市 ============ */
  {
    id: "5-1", chapter: 5, index: 1, name: "霓虹电路板", boss: false,
    hpMult: 5.5, dmgMult: 2.2,
    layout: { summary: "成对传送门模拟电流走线，钉网按电路布线排列，芯片砖可碎。", features: ["portalPair", "pegGrid", "brickRow"] },
    waves: [
      { formation: "scatter", units: [{ id: "volt_drone", n: 3 }, { id: "neon_moth", n: 2 }] },
      { formation: "bottom_line", units: [{ id: "volt_drone", n: 2 }, { id: "armor_pig", n: 2 }] },
    ],
    reward: { gold: 108, firstClear: { gold: 216, shards: { bird_of_paradise: 6 } } },
  },
  {
    id: "5-2", chapter: 5, index: 2, name: "磁悬浮轨道", boss: false,
    hpMult: 6.16, dmgMult: 2.2,
    layout: { summary: "两行磁浮移动砖交错运行，侧吹风扇让弹道走 S 形。", features: ["movingBrickRow", "fanSide", "pegDiamond"] },
    waves: [
      { formation: "top_drop", units: [{ id: "volt_drone", n: 3 }, { id: "pigeon_bandit", n: 3 }] },
      { formation: "scatter", units: [{ id: "spike_crab", n: 2 }, { id: "volt_drone", n: 2 }, { id: "heal_totem", n: 1 }] },
    ],
    reward: { gold: 122, firstClear: { gold: 244, shards: { dandy_pigeon: 6 } } },
  },
  {
    id: "5-3", chapter: 5, index: 3, name: "服务器机房", boss: false,
    hpMult: 6.82, dmgMult: 2.2,
    layout: { summary: "服务器机柜砖墙组成迷宫，3 颗炸弹电容是拆墙捷径。", features: ["brickWall", "bombBrick", "pegGrid"] },
    waves: [
      { formation: "scatter", units: [{ id: "volt_drone", n: 4 }, { id: "slime_brick", n: 2 }] },
      { formation: "brick_nest", units: [{ id: "chef_fox", n: 1 }, { id: "volt_drone", n: 3 }] },
    ],
    reward: { gold: 138, firstClear: { gold: 276, shards: { bird_of_paradise: 6 } } },
  },
  {
    id: "5-4", chapter: 5, index: 4, name: "孵化器核心", boss: true,
    hpMult: 7.15, dmgMult: 2.2,
    layout: { summary: "BOSS 外围两个护盾节点砖需先行拆除，传送门制造循环弹道。", features: ["portalPair", "brickWall"] },
    waves: [
      { formation: "top_drop", units: [{ id: "volt_drone", n: 3 }] },
      { boss: "mecha_incubator" },
    ],
    reward: { gold: 210, firstClear: { gold: 420, shards: { dandy_pigeon: 8 } } },
  },

  /* ============ 第 6 章 · 魔王厨房 ============ */
  {
    id: "6-1", chapter: 6, index: 1, name: "后厨突袭", boss: false,
    hpMult: 7.5, dmgMult: 2.6,
    layout: { summary: "锅碗瓢盆砖阵叮当作响，后厨鼠成群从传菜口冲刺。", features: ["brickRow", "pegGrid", "bombBrick"] },
    waves: [
      { formation: "swarm", units: [{ id: "kitchen_rat", n: 5 }, { id: "slime_brick", n: 2 }] },
      { formation: "swarm", units: [{ id: "kitchen_rat", n: 4 }, { id: "armor_pig", n: 2 }] },
    ],
    reward: { gold: 135, firstClear: { gold: 270, shards: { shark_eagle: 8 } } },
  },
  {
    id: "6-2", chapter: 6, index: 2, name: "冰火双灶", boss: false,
    hpMult: 8.4, dmgMult: 2.6,
    layout: { summary: "半场冷冻库冰面、半场灶台热浪，上吹与侧吹风扇对流。", features: ["icePatch", "fanUp", "fanSide", "brickRow"] },
    waves: [
      { formation: "scatter", units: [{ id: "frost_seal", n: 2 }, { id: "magma_snail", n: 2 }] },
      { formation: "swarm", units: [{ id: "kitchen_rat", n: 4 }, { id: "heal_totem", n: 1 }, { id: "spike_crab", n: 1 }] },
    ],
    reward: { gold: 152, firstClear: { gold: 304, shards: { fallen_crow: 8 } } },
  },
  {
    id: "6-3", chapter: 6, index: 3, name: "主厨走廊", boss: false,
    hpMult: 9.3, dmgMult: 2.6,
    layout: { summary: "双厨子狐精英把守走廊两端，移动餐车砖穿梭遮挡弹道。", features: ["movingBrickRow", "brickWall", "pegArc"] },
    waves: [
      { formation: "bottom_line", units: [{ id: "chef_fox", n: 1 }, { id: "kitchen_rat", n: 3 }] },
      { formation: "scatter", units: [{ id: "chef_fox", n: 1 }, { id: "volt_drone", n: 2 }, { id: "kitchen_rat", n: 2 }] },
    ],
    reward: { gold: 170, firstClear: { gold: 340, shards: { shark_eagle: 8 } } },
  },
  {
    id: "6-4", chapter: 6, index: 4, name: "魔王油锅", boss: true,
    hpMult: 9.75, dmgMult: 2.6,
    layout: { summary: "油锅在场地中央沸腾，锅沿钉弧环绕一周，两侧传送门是投料口也是奇袭通道。", features: ["pegArc", "portalPair", "bombBrick"] },
    waves: [
      { formation: "swarm", units: [{ id: "kitchen_rat", n: 4 }, { id: "chef_fox", n: 1 }] },
      { boss: "demon_fryer" },
    ],
    reward: { gold: 280, firstClear: { gold: 560, shards: { fallen_crow: 10 } } },
  },
];

/** 章节缩放一览（与 STAGES 内已烘焙的倍率一致，供 UI 展示曲线）。 */
export const CHAPTER_SCALING = [
  { chapter: 1, hpMult: 1.0, dmgMult: 1.0, goldMult: 1.0 },
  { chapter: 2, hpMult: 1.6, dmgMult: 1.25, goldMult: 1.5 },
  { chapter: 3, hpMult: 2.5, dmgMult: 1.5, goldMult: 2.1 },
  { chapter: 4, hpMult: 3.8, dmgMult: 1.8, goldMult: 2.8 },
  { chapter: 5, hpMult: 5.5, dmgMult: 2.2, goldMult: 3.6 },
  { chapter: 6, hpMult: 7.5, dmgMult: 2.6, goldMult: 4.5 },
];
