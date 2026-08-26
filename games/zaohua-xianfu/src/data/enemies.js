/**
 * 敌人表：登天塔与兽潮的战力曲线。
 *
 * 设计目标（与 GDD「登天塔曲线」一节一致）：
 * - 1–20 层线性成长：跟着境界/建筑走位的玩家一路可打；
 * - 21–30 层温和复利（×1.045/层）：需要成型的六人阵与塔掉法器；
 * - 31 层起再叠一段陡峭复利（×1.075/层）：化神以后仍层层有压力。
 * - 每章 10 层：3/8 层精英、5 层护法首领、10 层章主；深层敌人数量增多，
 *   拖满 60 秒按存活数判负，耗不过就是输。
 * 兼容性：导出符号与敌人字段（id/name/faction/role/atk/hp/def/boss）不变，只增字段。
 */
export const TOWER_CHAPTER_SIZE = 10;

/**
 * 章节主题：命名池 + 阵营构成。
 * 普通小队按 factions 轮转（首位为主题倾向阵营，人数超过 3 时重复出现），
 * 三系俱全避免把单一阵营的存档整章克死；章主固定为主题阵营，
 * 克制该阵营的玩家在章主战占优（×1.18），被克阵营要靠数值硬吃。
 */
export const TOWER_CHAPTERS = [
  { id: "huqiu", name: "青丘妖狐林", factions: ["demon", "mortal", "divine"], grunt: "妖狐斥候", elite: "赤尾妖狐", guard: "狐山护法", lord: "九尾狐王" },
  { id: "heifeng", name: "黑风山寨", factions: ["mortal", "demon", "divine"], grunt: "黑风悍匪", elite: "山寨供奉", guard: "黑风二当家", lord: "黑风大王" },
  { id: "youming", name: "幽冥血泽", factions: ["demon", "divine", "mortal"], grunt: "血泽厉鬼", elite: "怨煞骨将", guard: "阴司鬼判", lord: "幽冥鬼帅" },
  { id: "leiyin", name: "雷音废刹", factions: ["divine", "mortal", "demon"], grunt: "堕殿金刚", elite: "伪佛罗汉", guard: "护刹明王", lord: "伪佛金身" },
  { id: "jiuyou", name: "九幽魔渊", factions: ["demon", "divine", "mortal"], grunt: "魔渊修罗", elite: "噬魂魔将", guard: "渊底狱主", lord: "九幽魔尊" },
  { id: "tianwai", name: "域外天魔界", factions: ["divine", "demon", "mortal"], grunt: "域外天魔", elite: "天魔啖道者", guard: "魔界镇守", lord: "天魔祖师" },
];

/** 塔层压力系数：20 层前为 1，之后两段复利叠乘。 */
export function towerPressure(floor) {
  return Math.pow(1.045, Math.max(0, floor - 20)) * Math.pow(1.07, Math.max(0, floor - 30));
}

/** 本层敌人数：普通层 3→4→5，首领层 4→5→6，随深度增加。 */
export function towerPackSize(floor, boss) {
  if (boss) return Math.min(6, 4 + Math.floor(floor / 26));
  return Math.min(5, 3 + Math.floor(floor / 18));
}

export function chapterTheme(chapter) {
  return TOWER_CHAPTERS[(chapter - 1) % TOWER_CHAPTERS.length];
}

export function towerEnemy(floor) {
  const chapter = Math.ceil(floor / TOWER_CHAPTER_SIZE);
  const layer = ((floor - 1) % TOWER_CHAPTER_SIZE) + 1;
  const theme = chapterTheme(chapter);
  const boss = layer === 5 || layer === 10;
  const elite = layer === 3 || layer === 8;
  const lord = layer === 10;
  const n = towerPackSize(floor, boss);

  const pressure = towerPressure(floor);
  const atkBase = (16 + floor * 6.4) * pressure;
  const hpBase = (240 + floor * 102) * pressure;
  const defBase = (5 + floor * 2.0) * pressure;
  const eliteMul = elite ? 1.16 : 1;

  const foes = Array.from({ length: n }, (_, i) => {
    const isLord = boss && i === 0;
    const tank = !isLord && i === (boss ? 1 : 0);
    const name = isLord
      ? lord
        ? theme.lord
        : theme.guard
      : `${elite ? theme.elite : theme.grunt}${i + 1}`;
    const atkMul = isLord ? (lord ? 1.32 : 1.24) : tank ? 0.8 : 1.05;
    const hpMul = isLord ? (lord ? 2.15 : 1.85) : tank ? 1.4 : 0.95;
    const defMul = isLord ? 1.3 : tank ? 1.3 : 1;
    return {
      id: `t-${floor}-${i}`,
      name,
      faction: isLord ? theme.factions[0] : theme.factions[i % theme.factions.length],
      role: isLord || tank ? "tank" : "dps",
      atk: Math.round(atkBase * atkMul * eliteMul),
      hp: Math.round(hpBase * hpMul * eliteMul),
      def: Math.round(defBase * defMul * eliteMul),
      boss: isLord,
      elite,
    };
  });

  return { floor, chapter, layer, boss, elite, theme: theme.name, foes };
}

/** 兽潮波次命名带：每 8 波换一种兽群，循环往复。 */
export const WAVE_BANDS = [
  { grunt: "妖狼", boss: "狼群头王" },
  { grunt: "铁背妖猿", boss: "猿魁" },
  { grunt: "岩甲地龙", boss: "地龙老祖" },
  { grunt: "罡风妖禽", boss: "鹏首领" },
  { grunt: "上古凶兽", boss: "凶兽之主" },
];

/** 兽潮压力系数：10 波前线性，10 波后 ×1.06/波，20 波后再叠 ×1.08/波。 */
export function wavePressure(wave) {
  return Math.pow(1.06, Math.max(0, wave - 10)) * Math.pow(1.08, Math.max(0, wave - 20));
}

export function waveEnemy(wave) {
  const n = Math.min(6, 2 + Math.floor(wave / 3));
  const band = WAVE_BANDS[Math.floor((wave - 1) / 8) % WAVE_BANDS.length];
  const bossWave = wave % 5 === 0;
  const pressure = wavePressure(wave);
  const atkBase = (14 + wave * 6.0) * pressure;
  const hpBase = (210 + wave * 85) * pressure;
  const defBase = (4 + wave * 1.8) * pressure;

  const foes = Array.from({ length: n }, (_, i) => {
    const isBoss = bossWave && i === 0;
    return {
      id: `w-${wave}-${i}`,
      name: isBoss ? band.boss : `${band.grunt}${i + 1}`,
      faction: ["demon", "mortal", "divine"][(wave + i) % 3],
      role: i === 0 ? "tank" : "dps",
      atk: Math.round(atkBase * (isBoss ? 1.25 : 1)),
      hp: Math.round(hpBase * (isBoss ? 2.0 : 1)),
      def: Math.round(defBase * (isBoss ? 1.25 : 1)),
      boss: isBoss,
    };
  });

  return { wave, band: band.grunt, foes };
}
