export const TOWER_CHAPTER_SIZE = 10;

export function towerEnemy(floor) {
  const chapter = Math.ceil(floor / TOWER_CHAPTER_SIZE);
  const layer = ((floor - 1) % TOWER_CHAPTER_SIZE) + 1;
  const boss = layer === 5 || layer === 10;
  const n = boss ? 4 : 3;
  const hpMul = boss ? 2.1 : 1;
  const name = boss ? (layer === 10 ? "章主" : "护塔妖将") : "巡塔妖兵";
  return {
    floor,
    chapter,
    layer,
    boss,
    foes: Array.from({ length: n }, (_, i) => ({
      id: `t-${floor}-${i}`,
      name: `${name}${i + 1}`,
      faction: ["demon", "mortal", "divine"][(chapter + i) % 3],
      role: i === 0 ? "tank" : "dps",
      atk: Math.round((16 + floor * 7.2) * (boss ? 1.25 : 1)),
      hp: Math.round((220 + floor * 95) * hpMul),
      def: Math.round((6 + floor * 2.4) * (boss ? 1.3 : 1)),
      boss,
    })),
  };
}

export function waveEnemy(wave) {
  const n = Math.min(6, 2 + Math.floor((wave + 1) / 2));
  return {
    wave,
    foes: Array.from({ length: n }, (_, i) => ({
      id: `w-${wave}-${i}`,
      name: wave % 5 === 0 ? "潮元首领" : "兽潮妖物",
      faction: "demon",
      role: i === 0 ? "tank" : "dps",
      atk: Math.round(14 + wave * 6.4),
      hp: Math.round((200 + wave * 80) * (wave % 5 === 0 ? 1.8 : 1)),
      def: Math.round(5 + wave * 2),
      boss: wave % 5 === 0 && i === 0,
    })),
  };
}
