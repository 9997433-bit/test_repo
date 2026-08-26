/** 试炼之塔：30 层，通过的层可扫荡快速结算。 */
import { createRng, hashSeed } from "../core/rng.js";

export const TOWER_FLOORS = 30;

const THEMES = ["farm", "night", "volcano", "glacier", "circuit", "kitchen"];

export function towerTheme(floor) {
  return THEMES[Math.min(THEMES.length - 1, Math.floor((floor - 1) / 5))];
}

export function createTowerLevel(floor) {
  const rng = createRng(hashSeed(`tower-${floor}`));
  const scale = 1 + (floor - 1) * 0.34;
  const isBoss = floor % 10 === 0;
  const pool = floor < 6 ? ["slime", "pigeon"] : floor < 14 ? ["slime", "pig", "pigeon"] : floor < 22 ? ["pig", "crab", "totem"] : ["crab", "totem", "chef_fox"];
  const enemies = [];
  if (isBoss) {
    const boss = floor >= 30 ? "boss_hatcher" : floor >= 20 ? "boss_statue" : "boss_pot";
    enemies.push({ type: boss, x: 178, y: 172, scale: scale * 0.8 });
  }
  const rows = isBoss ? 1 : Math.min(3, 2 + Math.floor(floor / 12));
  for (let r = 0; r < rows; r++) {
    const count = rng.int(3, 5);
    for (let i = 0; i < count; i++) {
      enemies.push({
        type: rng.pick(pool),
        x: 50 + i * ((480 - 120) / Math.max(1, count - 1 || 1)) + rng.range(-6, 6),
        y: (isBoss ? 330 : 190) + r * 82,
      });
    }
  }
  const pegs = [];
  for (let r = 0; r < 3; r++) {
    const count = rng.int(4, 6);
    for (let i = 0; i < count; i++) {
      pegs.push({ x: 60 + i * (360 / Math.max(1, count - 1)), y: 450 + r * 68, r: 9, type: rng.chance(0.12) ? "bomb" : "peg" });
    }
  }
  return {
    id: `tower-${floor}`,
    name: `试炼之塔 ${floor} 层`,
    theme: towerTheme(floor),
    intro: isBoss ? "守层魔王" : `第 ${floor} 层`,
    playerHp: 100 + floor * 4,
    descend: 16 + floor,
    scale,
    boss: isBoss,
    enemies,
    pegs,
    bricks: [],
    slopes: [
      { x1: 0, y1: 656, x2: 130, y2: 706, thickness: 8 },
      { x1: 480, y1: 656, x2: 350, y2: 706, thickness: 8 },
    ],
    rewards: { gold: Math.round(70 + floor * 26), shards: Math.round(4 + floor * 1.6) },
  };
}

export function sweepReward(floor) {
  return { gold: Math.round((70 + floor * 26) * 0.6), shards: Math.round((4 + floor * 1.6) * 0.5) };
}
