/** 讨伐魔王：60 秒限时，魔王无限重生且逐形态成长，按总伤害发档位奖励。 */
export const RAID_SECONDS = 60;

export const RAID_TIERS = [
  { min: 0, label: "见习讨伐", gold: 60, shards: 4 },
  { min: 800, label: "铜锅勇士", gold: 140, shards: 10 },
  { min: 2000, label: "银勺骑士", gold: 260, shards: 18 },
  { min: 4200, label: "金铲统帅", gold: 420, shards: 30 },
  { min: 8000, label: "禽王传说", gold: 700, shards: 48 },
];

export function raidTier(damage) {
  let tier = RAID_TIERS[0];
  for (const t of RAID_TIERS) if (damage >= t.min) tier = t;
  return tier;
}

export function createRaidLevel(bossType = "boss_pot") {
  return {
    id: "raid",
    name: "讨伐魔王",
    theme: "kitchen",
    intro: `${RAID_SECONDS} 秒内打出最高伤害`,
    playerHp: 200,
    descend: 0,
    scale: 1.2,
    endless: true,
    respawnBoss: true,
    bossType,
    timeLimit: RAID_SECONDS,
    timeoutWin: true,
    enemies: [{ type: bossType, x: 182, y: 190, scale: 1.2 }],
    pegs: [
      ...Array.from({ length: 6 }, (_, i) => ({ x: 50 + i * 76, y: 452, r: 9, type: "peg" })),
      ...Array.from({ length: 5 }, (_, i) => ({ x: 88 + i * 76, y: 528, r: 9, type: "peg" })),
      { x: 240, y: 620, r: 13, type: "bomb" },
    ],
    bricks: [],
    slopes: [
      { x1: 0, y1: 646, x2: 140, y2: 706, thickness: 8 },
      { x1: 480, y1: 646, x2: 340, y2: 706, thickness: 8 },
    ],
  };
}
