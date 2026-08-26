/** 极限挑战（肉鸽）：无尽波次 + 每 2 波三选一。 */
import { createRng, hashSeed } from "../core/rng.js";
import { makeEnemy } from "../core/bestiary.js";
import { HERO_CATALOG } from "../core/catalog.js";

export const ARTIFACTS = [
  { id: "yolk_core", name: "蛋黄核心", desc: "全队攻击 +18%", apply: (b) => b.heroes.forEach((h) => (h.atk *= 1.18)) },
  { id: "rubber_shell", name: "橡胶壳", desc: "蛋弹性提高，反弹更久", apply: (b) => (b.modifiers.restitution += 0.06) },
  { id: "double_yolk", name: "双黄蛋", desc: "每回合额外 1 枚蛋", apply: (b) => (b.bonusEggs += 1) },
  { id: "sharp_shell", name: "锋利蛋壳", desc: "暴击率 +12%", apply: (b) => (b.critBonus += 0.12) },
  { id: "iron_nest", name: "铁巢", desc: "生命上限 +40 并回满", apply: (b) => { b.playerMaxHp += 40; b.playerHp = b.playerMaxHp; } },
  { id: "static_field", name: "静电场", desc: "命中附带 1 层感电", apply: (b) => (b.modifiers.shockOnHit = true) },
  { id: "magma_yolk", name: "岩浆蛋黄", desc: "命中附带 1 层灼烧", apply: (b) => (b.modifiers.burnOnHit = true) },
  { id: "guardian_egg", name: "守护蛋", desc: "获得 2 层护盾", apply: (b) => (b.shields += 2) },
  { id: "combo_metronome", name: "连击节拍器", desc: "连击窗口 +1.2 秒", apply: (b) => (b.comboWindow += 1.2) },
  { id: "gravity_tuner", name: "重力调谐器", desc: "重力降低 12%，滞空更久", apply: (b) => (b.world.gravity *= 0.88) },
];

const POOL_BY_WAVE = (wave) => {
  if (wave <= 2) return ["slime", "pigeon"];
  if (wave <= 5) return ["slime", "pigeon", "pig"];
  if (wave <= 9) return ["pig", "crab", "pigeon", "totem"];
  return ["pig", "crab", "totem", "chef_fox"];
};

function spawnWave(battle, wave) {
  const rng = battle.rng;
  const scale = 1 + (wave - 1) * 0.42;
  const pool = POOL_BY_WAVE(wave);
  const rows = Math.min(3, 1 + Math.floor(wave / 3));
  for (let r = 0; r < rows; r++) {
    const count = rng.int(3, 5);
    for (let i = 0; i < count; i++) {
      const en = makeEnemy(
        rng.pick(pool),
        44 + i * ((480 - 110) / Math.max(1, count - 1 || 1)) + rng.range(-8, 8),
        180 + r * 82,
        scale,
      );
      en.baseX = en.x;
      battle.world.enemies.push(en);
    }
  }
  if (wave % 5 === 0) {
    const boss = makeEnemy("boss_pot", 178, 168, scale * 0.8);
    boss.baseX = boss.x;
    battle.world.enemies.push(boss);
    battle.announce(`第 ${wave} 波 · 精英魔王`);
  }
  if (wave > 1 && wave % 2 === 1) battle.pendingDraft = true;
}

export function createRogueLevel() {
  return {
    id: "rogue",
    name: "极限挑战",
    theme: "night",
    intro: "无尽波次 · 养成不生效",
    playerHp: 120,
    descend: 20,
    scale: 1,
    endless: true,
    enemies: [],
    pegs: [
      ...[0, 1, 2].flatMap((r) =>
        Array.from({ length: 5 + (r % 2) }, (_, i) => ({
          x: 60 + i * ((360) / (4 + (r % 2))),
          y: 450 + r * 70,
          r: 9,
          type: "peg",
        })),
      ),
      { x: 240, y: 660, r: 12, type: "bomb" },
    ],
    bricks: [],
    slopes: [
      { x1: 0, y1: 650, x2: 130, y2: 706, thickness: 8 },
      { x1: 480, y1: 650, x2: 350, y2: 706, thickness: 8 },
    ],
    nextWave: spawnWave,
    decorate(world, rng) {
      void world;
      void rng;
    },
    onStart: spawnWave,
  };
}

/** 三选一：英雄替换 或 神器。 */
export function rollDraft(battle, ownedIds, seed) {
  const rng = createRng(hashSeed(`${seed}-${battle.wave}`));
  const options = [];
  const heroPool = HERO_CATALOG.filter((h) => !battle.heroes.some((x) => x.id === h.id));
  const artifactPool = ARTIFACTS.filter((a) => !(battle.takenArtifacts ?? []).includes(a.id));
  void ownedIds;

  const picks = rng.shuffle([...heroPool.slice(0, 14).map((h) => ({ kind: "hero", hero: h })), ...artifactPool.map((a) => ({ kind: "artifact", artifact: a }))]);
  for (const p of picks) {
    if (options.length >= 3) break;
    options.push(p);
  }
  return options;
}

export function applyDraft(battle, option, loadout) {
  battle.takenArtifacts = battle.takenArtifacts ?? [];
  if (option.kind === "artifact") {
    battle.takenArtifacts.push(option.artifact.id);
    battle.modifiers = battle.modifiers ?? { restitution: 0 };
    option.artifact.apply(battle);
    battle.announce(`获得神器：${option.artifact.name}`);
    return;
  }
  const hero = option.hero;
  const base = loadout.heroes[0];
  battle.heroes.push({
    ...hero,
    slot: battle.heroes.length,
    level: 1,
    star: 1,
    atk: Math.round(hero.atk * (base ? base.atk / Math.max(1, base.baseAtk ?? base.atk) : 1) * 1.4 * 10) / 10,
    energy: 0,
    maxEnergy: hero.ult?.cost ?? 100,
  });
  battle.announce(`${hero.name} 加入队伍`);
}
