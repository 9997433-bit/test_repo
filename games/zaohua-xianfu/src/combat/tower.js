import { towerEnemy } from "../data/enemies.js";
import { simulate } from "./battle.js";

export function challengeTower(state, now = Date.now()) {
  const floor = state.tower?.floor ?? 1;
  const pack = towerEnemy(floor);
  const result = simulate({
    seed: (now ^ (floor * 9973)) >>> 0,
    heroIds: state.party,
    foes: pack.foes,
    state,
    equipped: state.equipped,
  });
  return { ...result, floor, boss: pack.boss, chapter: pack.chapter, layer: pack.layer };
}

export function towerReward(floor, win) {
  if (!win) return { stone: 4, qi: 8 };
  const boss = floor % 5 === 0;
  return {
    stone: 18 + floor * 2,
    qi: 24 + floor * 3,
    jade: boss ? 2 + Math.floor(floor / 10) : 0,
    pills: boss ? 1 : 0,
  };
}
