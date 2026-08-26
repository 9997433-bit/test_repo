/**
 * 阵营与仙友表。
 * - 三角克制见 factionAdvantage：神克魔、魔克人、人克神，占优 ×1.18、被克 ×0.92。
 * - 前 16 位仙友在战斗层（combat/battle.js 的 KITS）有专属机制，skill/skillDesc 与之一一对应。
 * - 其余仙友为「通用技」仙友：秘技为单体 155% 攻击，输出位攻速 1.05 秒/击（他位 1.25 秒），
 *   辅助位秘技 4 秒一转（他位 6 秒）。他们靠更高的裸三维与站位价值立足。
 * - `tier` 为推荐度（S/A/B），`lore` 为出典，仅供 UI 与图鉴，不进战斗公式。
 * 兼容性：id 永不删除；只增字段与新条目。
 */
export const FACTIONS = {
  mortal: {
    id: "mortal",
    name: "人族",
    motto: "稳扎稳打，仁心破妄",
    color: "pine",
    style: "治疗 + 破甲的消耗流：慈航奶、姜子牙削防，越拖越强。",
    beats: "divine",
    losesTo: "demon",
  },
  divine: {
    id: "divine",
    name: "神族",
    motto: "天威赫赫，成型即碾",
    color: "gold",
    style: "护盾 + 反击 + 增伤的中军流：开场光环与玄天盾，站桩互换血最赚。",
    beats: "demon",
    losesTo: "mortal",
  },
  demon: {
    id: "demon",
    name: "魔族",
    motto: "以暴制暴，一击破军",
    color: "cinnabar",
    style: "爆发 + 嘲讽的速攻流：悟空前 6 秒定胜负，拖入后期反而乏力。",
    beats: "mortal",
    losesTo: "divine",
  },
};

export const HEROES = [
  // ─── 人族 ───
  { id: "mc-mortal", name: "人族主角", faction: "mortal", role: "flex", tags: ["主角"], tier: "S", atk: 28, hp: 420, def: 16, skill: "仁心诀", skillDesc: "普攻附带 8% 治疗最低生命队友", lore: "凡躯问道，以仁心补天资。" },
  { id: "cihang", name: "慈航真人", faction: "mortal", role: "heal", tags: ["辅助", "治疗"], tier: "S", atk: 22, hp: 380, def: 14, skill: "慈航普度", skillDesc: "每 4 秒群体治疗（55% 攻击）", lore: "普陀落伽岩潮音洞主。" },
  { id: "houyi", name: "后羿", faction: "mortal", role: "dps", tags: ["输出", "狙后排"], tier: "A", atk: 40, hp: 300, def: 10, skill: "九日矢", skillDesc: "锁定后排，命中后排额外 35% 伤害", lore: "射九日者，弦不虚发。" },
  { id: "tongtian", name: "通天教主", faction: "mortal", role: "aoe", tags: ["法术", "群伤"], tier: "S", atk: 36, hp: 340, def: 12, skill: "诛仙剑气", skillDesc: "秘技对全体敌人造成 70% 攻击", lore: "截教之主，有教无类。" },
  { id: "jiangziya", name: "姜子牙", faction: "mortal", role: "support", tags: ["辅助", "破甲"], tier: "A", atk: 20, hp: 320, def: 12, skill: "封神榜", skillDesc: "秘技削减全体敌人 18% 防御，持续 6 秒", lore: "直钩钓周，封神执榜。" },
  { id: "lijing", name: "李靖", faction: "mortal", role: "tank", tags: ["前排"], tier: "A", atk: 26, hp: 560, def: 24, skill: "玲珑宝塔", skillDesc: "通用技（155% 攻击）；气血浑厚，宜站首位扛线", lore: "陈塘关总兵，托塔天王。" },
  { id: "leizhenzi", name: "雷震子", faction: "mortal", role: "dps", tags: ["输出", "速攻"], tier: "A", atk: 44, hp: 300, def: 10, skill: "风雷双翅", skillDesc: "通用技（155% 攻击）；输出位攻速 1.05 秒/击", lore: "燕山雷雨中拾得的雷部先锋。" },
  { id: "yunzhongzi", name: "云中子", faction: "mortal", role: "support", tags: ["辅助", "快转"], tier: "B", atk: 26, hp: 330, def: 11, skill: "通天神火柱", skillDesc: "通用技（155% 攻击）；辅助位秘技 4 秒一转", lore: "终南山玉柱洞炼器名家。" },
  // ─── 神族 ───
  { id: "mc-divine", name: "神族主角", faction: "divine", role: "flex", tags: ["主角", "光环"], tier: "S", atk: 30, hp: 400, def: 15, skill: "天道印", skillDesc: "开场全队攻击 +10%", lore: "神裔临凡，先天道体。" },
  { id: "yangjian", name: "杨戬", faction: "divine", role: "dps", tags: ["输出", "追击"], tier: "S", atk: 42, hp: 360, def: 14, skill: "三尖两刃", skillDesc: "暴击时追击一次 40% 攻击", lore: "清源妙道真君，第三只眼窥破虚妄。" },
  { id: "nezha", name: "哪吒", faction: "divine", role: "tank", tags: ["前排", "反击"], tier: "A", atk: 26, hp: 520, def: 22, skill: "火尖枪反击", skillDesc: "受击反击 50% 攻击", lore: "莲花化身，三头六臂。" },
  { id: "zhenwu", name: "真武大帝", faction: "divine", role: "tank", tags: ["前排", "护盾"], tier: "A", atk: 24, hp: 560, def: 26, skill: "玄天盾", skillDesc: "开场护盾 20% 生命", lore: "北方玄武，披发跣足。" },
  { id: "xuannv", name: "九天玄女", faction: "divine", role: "support", tags: ["辅助", "加速"], tier: "A", atk: 28, hp: 340, def: 12, skill: "玄女锦囊", skillDesc: "全队秘技冷却 -20%", lore: "授兵符于轩辕的战争女神。" },
  { id: "nvwa", name: "女娲", faction: "divine", role: "dps", tags: ["输出", "暴击"], tier: "S", atk: 38, hp: 360, def: 13, skill: "补天石", skillDesc: "暴击伤害 +40%", lore: "抟土造人，炼石补天。" },
  { id: "taiyi", name: "太乙真人", faction: "divine", role: "support", tags: ["辅助", "快转"], tier: "B", atk: 25, hp: 350, def: 12, skill: "九龙神火罩", skillDesc: "通用技（155% 攻击）；辅助位秘技 4 秒一转", lore: "乾元山金光洞，哪吒之师。" },
  { id: "guangchengzi", name: "广成子", faction: "divine", role: "dps", tags: ["输出"], tier: "A", atk: 43, hp: 310, def: 11, skill: "番天印", skillDesc: "通用技（155% 攻击）；输出位攻速 1.05 秒/击", lore: "九仙山桃源洞，十二金仙之首。" },
  { id: "chang-e", name: "嫦娥", faction: "divine", role: "support", tags: ["辅助", "快转"], tier: "B", atk: 27, hp: 320, def: 10, skill: "广寒月华", skillDesc: "通用技（155% 攻击）；辅助位秘技 4 秒一转", lore: "月宫仙子，清辉照夜。" },
  // ─── 魔族 ───
  { id: "mc-demon", name: "魔族主角", faction: "demon", role: "flex", tags: ["主角", "残血反杀"], tier: "S", atk: 34, hp: 360, def: 12, skill: "魔心", skillDesc: "生命越低攻击越高，最高 +28%", lore: "魔染道心，向死而生。" },
  { id: "wukong", name: "孙悟空", faction: "demon", role: "dps", tags: ["输出", "开场爆发"], tier: "S", atk: 46, hp: 340, def: 12, skill: "金箍棒", skillDesc: "开场 6 秒攻速 +40%", lore: "花果山美猴王，大闹天宫。" },
  { id: "bajie", name: "猪八戒", faction: "demon", role: "tank", tags: ["前排", "嘲讽"], tier: "A", atk: 28, hp: 540, def: 20, skill: "九齿钉耙", skillDesc: "嘲讽当前攻击者 3 秒", lore: "天蓬元帅错投猪胎。" },
  { id: "shen", name: "申公豹", faction: "demon", role: "aoe", tags: ["法术", "群伤"], tier: "A", atk: 37, hp: 300, def: 10, skill: "雷部令", skillDesc: "秘技随机雷击 3 个目标（70% 攻击）", lore: "道友请留步。" },
  { id: "yumian", name: "玉面公主", faction: "demon", role: "support", tags: ["辅助", "致盲"], tier: "A", atk: 24, hp: 300, def: 10, skill: "狐媚", skillDesc: "秘技降低全体敌人 12% 命中，持续 6 秒", lore: "积雷山万岁狐王之女。" },
  { id: "niumo", name: "牛魔王", faction: "demon", role: "tank", tags: ["前排"], tier: "A", atk: 30, hp: 600, def: 24, skill: "混天霸体", skillDesc: "通用技（155% 攻击）；魔族最厚的前排", lore: "平天大圣，七兄弟之首。" },
  { id: "baigujing", name: "白骨精", faction: "demon", role: "dps", tags: ["输出", "速攻"], tier: "A", atk: 45, hp: 290, def: 9, skill: "白骨幡", skillDesc: "通用技（155% 攻击）；输出位攻速 1.05 秒/击", lore: "三戏禅心的白骨夫人。" },
  { id: "tieshan", name: "铁扇公主", faction: "demon", role: "support", tags: ["辅助", "快转"], tier: "B", atk: 28, hp: 320, def: 10, skill: "芭蕉扇", skillDesc: "通用技（155% 攻击）；辅助位秘技 4 秒一转", lore: "翠云山芭蕉洞罗刹女。" },
];

export const STARTER = {
  mortal: ["mc-mortal", "cihang", "houyi"],
  divine: ["mc-divine", "nezha", "nvwa"],
  demon: ["mc-demon", "wukong", "bajie"],
};

export function heroById(id) {
  return HEROES.find((h) => h.id === id) ?? null;
}

export function heroesOf(faction) {
  return HEROES.filter((h) => h.faction === faction);
}

/** 三角克制：神克魔、魔克人、人克神。占优 ×1.18，被克 ×0.92，同族 ×1。 */
export const ADVANTAGE_MUL = 1.18;
export const DISADVANTAGE_MUL = 0.92;

export function factionAdvantage(a, b) {
  if (a === b) return 1;
  if ((a === "divine" && b === "demon") || (a === "demon" && b === "mortal") || (a === "mortal" && b === "divine")) {
    return ADVANTAGE_MUL;
  }
  return DISADVANTAGE_MUL;
}
