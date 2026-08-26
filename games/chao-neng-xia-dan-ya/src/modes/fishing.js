/** 佛系钓鱼：节奏小游戏，钓到的怪物球给下一场战斗临时 BUFF。 */
import { createRng, hashSeed } from "../core/rng.js";

export const SEAS = [
  { id: "pond", name: "鸭池", speed: 0.85, zone: 0.3, casts: 5, theme: "farm", desc: "新手海域，判定宽松" },
  { id: "neon_bay", name: "霓虹湾", speed: 1.25, zone: 0.22, casts: 5, theme: "night", desc: "节奏加快，奖励更好" },
  { id: "abyss", name: "深渊灶台", speed: 1.75, zone: 0.15, casts: 5, theme: "kitchen", desc: "极限判定，传说渔获" },
];

export const FISH = [
  { id: "boiled_ball", name: "白煮怪物球", kind: "atk", value: 0.08, rarity: 1 },
  { id: "spicy_ball", name: "香辣怪物球", kind: "atk", value: 0.15, rarity: 2 },
  { id: "lucky_ball", name: "幸运怪物球", kind: "crit", value: 0.12, rarity: 2 },
  { id: "golden_ball", name: "黄金怪物球", kind: "crit", value: 0.2, rarity: 3 },
  { id: "twin_ball", name: "双生怪物球", kind: "eggs", value: 1, rarity: 3 },
  { id: "legend_ball", name: "传说怪物球", kind: "eggs", value: 2, rarity: 4 },
];

export const BUFF_LABEL = {
  atk: (v) => `全队攻击 +${Math.round(v * 100)}%`,
  crit: (v) => `暴击率 +${Math.round(v * 100)}%`,
  eggs: (v) => `每回合额外 ${v} 枚蛋`,
};

/**
 * 钓鱼状态机：标记在 0..1 之间来回移动，玩家在绿色判定区内收杆。
 */
export function createFishing(seaId, seed = Date.now()) {
  const sea = SEAS.find((s) => s.id === seaId) ?? SEAS[0];
  const rng = createRng(hashSeed(`${seaId}-${seed}`));
  return {
    sea,
    rng,
    marker: 0,
    dir: 1,
    speed: sea.speed,
    zoneStart: 0.5 - sea.zone / 2,
    zoneSize: sea.zone,
    castsLeft: sea.casts,
    score: 0,
    perfect: 0,
    finished: false,
    lastResult: null,
    reroll() {
      this.zoneStart = rng.range(0.08, 0.92 - this.zoneSize);
      this.speed = sea.speed * rng.range(0.9, 1.25);
      this.marker = rng.chance(0.5) ? 0 : 1;
      this.dir = this.marker < 0.5 ? 1 : -1;
    },
    update(dt) {
      if (this.finished) return;
      this.marker += this.dir * this.speed * dt;
      if (this.marker > 1) { this.marker = 1; this.dir = -1; }
      if (this.marker < 0) { this.marker = 0; this.dir = 1; }
    },
    /** @returns {{hit:boolean, perfect:boolean, points:number}} */
    strike() {
      if (this.finished) return { hit: false, perfect: false, points: 0 };
      const center = this.zoneStart + this.zoneSize / 2;
      const dist = Math.abs(this.marker - center);
      const inZone = dist <= this.zoneSize / 2;
      const perfect = dist <= this.zoneSize / 6;
      const points = perfect ? 3 : inZone ? 1 : 0;
      this.score += points;
      if (perfect) this.perfect++;
      this.castsLeft--;
      this.lastResult = { hit: inZone, perfect, points };
      if (this.castsLeft <= 0) this.finished = true;
      else this.reroll();
      return this.lastResult;
    },
  };
}

export function fishReward(session) {
  const max = session.sea.casts * 3;
  const ratio = session.score / max;
  const seaBonus = SEAS.indexOf(session.sea);
  let tier = 0;
  if (ratio >= 0.35) tier = 1;
  if (ratio >= 0.6) tier = 2;
  if (ratio >= 0.85) tier = 3;
  tier = Math.min(4, tier + (seaBonus > 0 && ratio >= 0.5 ? 1 : 0));
  const pool = FISH.filter((f) => f.rarity <= Math.max(1, tier));
  const fish = pool[pool.length - 1] ?? FISH[0];
  return {
    fish,
    tier,
    gold: Math.round(40 + session.score * 14 + seaBonus * 30),
    buff: { kind: fish.kind, value: fish.value, name: fish.name, battles: 3 },
  };
}
