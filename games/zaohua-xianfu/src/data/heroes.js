export const FACTIONS = {
  mortal: { id: "mortal", name: "人族", motto: "稳扎稳打，仁心破妄", color: "pine" },
  divine: { id: "divine", name: "神族", motto: "天威赫赫，成型即碾", color: "gold" },
  demon: { id: "demon", name: "魔族", motto: "以暴制暴，一击破军", color: "cinnabar" },
};

export const HEROES = [
  { id: "mc-mortal", name: "人族主角", faction: "mortal", role: "flex", tags: ["主角"], atk: 28, hp: 420, def: 16, skill: "仁心诀", skillDesc: "普攻附带 8% 治疗最低生命队友" },
  { id: "cihang", name: "慈航真人", faction: "mortal", role: "heal", tags: ["辅助"], atk: 22, hp: 380, def: 14, skill: "慈航普度", skillDesc: "每 4 秒群体治疗" },
  { id: "houyi", name: "后羿", faction: "mortal", role: "dps", tags: ["输出"], atk: 40, hp: 300, def: 10, skill: "九日矢", skillDesc: "对后排额外 35% 伤害" },
  { id: "tongtian", name: "通天教主", faction: "mortal", role: "aoe", tags: ["法术"], atk: 36, hp: 340, def: 12, skill: "诛仙剑气", skillDesc: "全体 70% 攻击" },
  { id: "jiangziya", name: "姜子牙", faction: "mortal", role: "support", tags: ["辅助"], atk: 20, hp: 320, def: 12, skill: "封神榜", skillDesc: "降低敌方防御 18%" },
  { id: "mc-divine", name: "神族主角", faction: "divine", role: "flex", tags: ["主角"], atk: 30, hp: 400, def: 15, skill: "天道印", skillDesc: "开场全队攻击 +10%" },
  { id: "yangjian", name: "杨戬", faction: "divine", role: "dps", tags: ["输出"], atk: 42, hp: 360, def: 14, skill: "三尖两刃", skillDesc: "暴击时再追击一次 40%" },
  { id: "nezha", name: "哪吒", faction: "divine", role: "tank", tags: ["前排"], atk: 26, hp: 520, def: 22, skill: "火尖枪反击", skillDesc: "受击反击 50% 攻击" },
  { id: "zhenwu", name: "真武大帝", faction: "divine", role: "tank", tags: ["前排"], atk: 24, hp: 560, def: 26, skill: "玄天盾", skillDesc: "开场护盾 20% 生命" },
  { id: "xuannv", name: "九天玄女", faction: "divine", role: "support", tags: ["辅助"], atk: 28, hp: 340, def: 12, skill: "玄女锦囊", skillDesc: "大招冷却 -20%" },
  { id: "nvwa", name: "女娲", faction: "divine", role: "dps", tags: ["输出"], atk: 38, hp: 360, def: 13, skill: "补天石", skillDesc: "暴击伤害 +40%" },
  { id: "mc-demon", name: "魔族主角", faction: "demon", role: "flex", tags: ["主角"], atk: 34, hp: 360, def: 12, skill: "魔心", skillDesc: "生命越低攻击越高，最高 +28%" },
  { id: "wukong", name: "孙悟空", faction: "demon", role: "dps", tags: ["输出"], atk: 46, hp: 340, def: 12, skill: "金箍棒", skillDesc: "开场 6 秒攻速 +40%" },
  { id: "bajie", name: "猪八戒", faction: "demon", role: "tank", tags: ["前排"], atk: 28, hp: 540, def: 20, skill: "九齿钉耙", skillDesc: "嘲讽当前攻击者 3 秒" },
  { id: "shen", name: "申公豹", faction: "demon", role: "aoe", tags: ["法术"], atk: 37, hp: 300, def: 10, skill: "雷部令", skillDesc: "随机 3 目标雷击" },
  { id: "yumian", name: "玉面公主", faction: "demon", role: "support", tags: ["辅助"], atk: 24, hp: 300, def: 10, skill: "狐媚", skillDesc: "降低敌方命中 12%" },
];

export const STARTER = {
  mortal: ["mc-mortal", "cihang", "houyi"],
  divine: ["mc-divine", "nezha", "nvwa"],
  demon: ["mc-demon", "wukong", "bajie"],
};

export function heroById(id) {
  return HEROES.find((h) => h.id === id) ?? null;
}

export function factionAdvantage(a, b) {
  if (a === b) return 1;
  if ((a === "divine" && b === "demon") || (a === "demon" && b === "mortal") || (a === "mortal" && b === "divine")) {
    return 1.18;
  }
  return 0.92;
}
