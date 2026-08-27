// 异掌 · Bot 人格参数（行为语义见 docs/GDD.md §10；ai/bots.js 按此驱动）
// 所有 0..1 系数：越高该倾向越强。reactionSeconds 是感知延迟，mistakeRate 保证可战胜。
//
// skinId（契约 §3.2 规则 3，ADR-26）：纯装饰、不挂数值。三人互异且不等于
// DEFAULT_SKIN_ID（'drifter'）——Bot 不得全员同一造型。id 取皮肤词表 v1 的冻结值
// （wildhorn 荒角 / crane 鹤羽 / nuo 傩面）；`src/data/skins.js` 真表落地前，
// 壳层 `core/skins.js assignSkins` 对表里不存在的 id 会安全回落轮转，不会破功。

export const BOT_PERSONAS = [
  {
    id: "brute",
    name: "蛮古",
    desc: "直线硬冲，贪掌不惜身。",
    skinId: "wildhorn", // 兽角蛮客：宽肩 + 兽角，撞脸即认出「莽的那个」
    aggression: 0.9, // 进逼倾向
    circling: 0.15, // 绕侧倾向
    backstabBias: 0.1, // 绕背意愿
    edgeCaution: 0.35, // 距边自保（低=敢贴边也容易被送）
    reactionSeconds: 0.28,
    mistakeRate: 0.18, // 随机挥空/走错方向概率（每决策）
    punishRead: 0.2, // 抓对手后摇的能力
    skillEagerness: 0.9, // 技能转好就放
    dashEagerness: 0.7,
    targetBias: { nearest: 1.0, edgeDistance: 0.2, hitstun: 0.3, lastAttacker: 0.6 },
    gloves: ["granite", "meteor"], // 主/副掌
  },
  {
    id: "fox",
    name: "狸缘",
    desc: "沿边游走，等你挥空再进掌。",
    skinId: "crane", // 鹤羽：瘦高背旗，沿边绕走时剪影拉长、一眼可辨
    aggression: 0.45,
    circling: 0.85,
    backstabBias: 0.4,
    edgeCaution: 0.75,
    reactionSeconds: 0.2,
    mistakeRate: 0.08,
    punishRead: 0.85, // 主要伤害来自惩罚后摇
    skillEagerness: 0.5,
    dashEagerness: 0.5,
    targetBias: { nearest: 0.5, edgeDistance: 0.6, hitstun: 0.8, lastAttacker: 0.3 },
    gloves: ["gale", "frost"],
  },
  {
    id: "bully",
    name: "欺霸",
    desc: "专挑背身、硬直和贴边的下手。",
    skinId: "nuo", // 傩面：面具客（原创民俗剪影），配「专挑软柿子」的阴气质
    aggression: 0.7,
    circling: 0.5,
    backstabBias: 0.8,
    edgeCaution: 0.55,
    reactionSeconds: 0.24,
    mistakeRate: 0.12,
    punishRead: 0.5,
    skillEagerness: 0.7,
    dashEagerness: 0.6,
    // 无血条，「残血」映射为台权劣势：贴边 / 硬直目标权重最高
    targetBias: { nearest: 0.4, edgeDistance: 1.0, hitstun: 1.0, lastAttacker: 0.2 },
    gloves: ["magnet", "afterimage"],
  },
];

export const BOT_PERSONA_BY_ID = Object.fromEntries(
  BOT_PERSONAS.map((p) => [p.id, p]),
);
