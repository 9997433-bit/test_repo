import { heroById } from "../data/heroes.js";

export function castSkill(side, heroUnit, enemies) {
  const hero = heroById(heroUnit.id);
  if (!hero) return { hits: 0, fx: heroUnit.id };
  const id = hero.skill.id;
  let hits = 0;
  if (id === "baibu" || id === "qijin") {
    for (const e of enemies) {
      e.hp -= hero.atk * (id === "baibu" ? 1.15 : 0.95);
      hits += 1;
    }
  } else if (id === "dangyang") {
    for (const e of enemies) {
      if (e.t > 0.45) {
        e.hp -= hero.atk * 0.8;
        e.t = Math.max(0, e.t - 0.08);
        e.stun = Math.max(e.stun || 0, 1.2);
        hits += 1;
      }
    }
  } else if (id === "wenjiu") {
    const sorted = [...enemies].sort((a, b) => b.t - a.t).slice(0, 6);
    for (const e of sorted) {
      e.hp -= hero.atk * 1.4;
      hits += 1;
    }
  } else if (id === "rende") {
    side.haste = Math.max(side.haste || 0, 6);
    hits = 1;
  } else if (id === "xiliang") {
    const front = [...enemies].sort((a, b) => b.t - a.t)[0];
    if (front) {
      front.hp -= hero.atk * 1.8;
      front.t = Math.max(0, front.t - 0.05);
      hits = 1;
    }
  }
  heroUnit.cooldown = hero.skill.cd;
  return { hits, fx: id, name: hero.skill.name };
}
