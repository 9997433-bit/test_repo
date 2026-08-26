import { describe, expect, it } from "vitest";
import { createBattle } from "../src/combat/battle.js";
import { reaction } from "../src/combat/elements.js";
import { computeMods, defaultMods } from "../src/combat/mods.js";
import { defaultSave } from "../src/core/store.js";

function battle(overrides = {}) {
  return createBattle({
    player: { id: "p", name: "徒", classId: "jian", element: "metal", hp: 200, atk: 40, qi: 200 },
    enemy: { id: "e", name: "蛾", classId: "yao", element: "wood", hp: 80, atk: 5, atkMs: 2000 },
    seed: 7,
    ...overrides,
  });
}

describe("battle casts", () => {
  it("line cast reduces enemy hp", () => {
    const b = battle();
    b.cast({ type: "line", precision: 0.9, pressure: 0.6 });
    expect(b.getState().enemy.hp).toBeLessThan(80);
  });
  it("circle grants shield", () => {
    const b = battle();
    b.cast({ type: "circle", precision: 1, pressure: 0.5 });
    expect(b.getState().player.shield).toBeGreaterThan(0);
  });
  it("cloud heals", () => {
    const b = battle();
    b.getState().player.hp = 40;
    b.cast({ type: "cloud", precision: 1, pressure: 0.5 });
    expect(b.getState().player.hp).toBeGreaterThan(40);
  });
  it("refuses to cast without qi", () => {
    const b = createBattle({
      player: { id: "p", name: "p", classId: "jian", element: "metal", hp: 100, atk: 20, qi: 3 },
      enemy: { id: "e", name: "e", classId: "yao", element: "wood", hp: 80, atk: 5 },
    });
    b.cast({ type: "spiral", precision: 1, pressure: 0.5 });
    expect(b.getState().enemy.hp).toBe(80);
    expect(b.getState().log[0].kind).toBe("warn");
  });
  it("wins and records duration when enemy falls", () => {
    const b = battle();
    for (let i = 0; i < 10 && !b.getState().finished; i += 1) {
      b.tick(100);
      b.cast({ type: "line", precision: 1, pressure: 0.8 });
    }
    expect(b.getState().finished).toBe("win");
    expect(b.getState().stats.durationMs).toBeGreaterThan(0);
  });
  it("builds combo on rapid consecutive casts", () => {
    const b = battle({ enemy: { id: "e", name: "e", classId: "yao", element: "wood", hp: 9999, atk: 0 } });
    b.cast({ type: "line", precision: 0.8, pressure: 0.5 });
    b.tick(200);
    b.cast({ type: "line", precision: 0.8, pressure: 0.5 });
    b.tick(200);
    b.cast({ type: "line", precision: 0.8, pressure: 0.5 });
    expect(b.getState().combo).toBe(3);
    expect(b.getState().stats.maxCombo).toBe(3);
  });
});

describe("battle tick reliability", () => {
  function enemyHits(b) {
    return b.getState().log.filter((l) => l.kind === "enemy").length;
  }
  it("one big tick and many small ticks land the same number of enemy attacks", () => {
    const big = battle({ enemy: { id: "e", name: "e", classId: "yao", element: "wood", hp: 999, atk: 1, atkMs: 2000 } });
    const small = battle({ enemy: { id: "e", name: "e", classId: "yao", element: "wood", hp: 999, atk: 1, atkMs: 2000 } });
    big.tick(6000);
    for (let i = 0; i < 30; i += 1) small.tick(200);
    expect(enemyHits(big)).toBe(3);
    expect(enemyHits(small)).toBe(3);
  });
  it("odd tick sizes never drop attacks", () => {
    const b = battle({ enemy: { id: "e", name: "e", classId: "yao", element: "wood", hp: 999, atk: 1, atkMs: 1000 } });
    [333, 333, 333, 1, 999, 1001, 500, 500].forEach((dt) => b.tick(dt));
    expect(enemyHits(b)).toBe(4);
  });
  it("bound enemies cannot attack", () => {
    const b = battle({ enemy: { id: "e", name: "e", classId: "yao", element: "wood", hp: 9999, atk: 10, atkMs: 1000 } });
    b.cast({ type: "curve", precision: 1, pressure: 0.5 }); // 束缚 ≥1.6s
    b.tick(1500);
    expect(enemyHits(b)).toBe(0);
  });
  it("regenerates qi over time", () => {
    const b = battle();
    b.getState().player.qi = 0;
    b.tick(1000);
    expect(b.getState().player.qi).toBeGreaterThanOrEqual(8);
  });
});

describe("mods integration (talents + beasts)", () => {
  it("computeMods folds talents and beasts into battle modifiers", () => {
    const save = {
      ...defaultSave(),
      talents: { might: 2, spring: 1, control: 3, dodge: 2, ward: 1 },
      beasts: [
        { id: "ink_fox", passive: "crit", value: 0.08 },
        { id: "paper_carp", passive: "qiRegen", value: 2 },
        { id: "shan_deer", passive: "shield", value: 12 },
      ],
    };
    const m = computeMods(save);
    expect(m.dmgMult).toBeCloseTo(1.12);
    expect(m.healMult).toBeCloseTo(1.12);
    expect(m.controlMult).toBeCloseTo(1.3);
    expect(m.dodgeChance).toBeCloseTo(0.08);
    expect(m.critChance).toBeCloseTo(0.13);
    expect(m.qiRegenPerSec).toBe(2);
    expect(m.openingShield).toBe(12);
    expect(m.shieldMult).toBeCloseTo(1.1);
  });
  it("dmgMult scales stroke damage", () => {
    const enemy = { id: "e", name: "e", classId: "yao", element: "wood", hp: 999, atk: 1 };
    const base = battle({ mods: { ...defaultMods(), critChance: 0 }, enemy });
    const buffed = battle({ mods: { ...defaultMods(), critChance: 0, dmgMult: 2 }, enemy });
    base.cast({ type: "line", precision: 0.8, pressure: 0.5 });
    buffed.cast({ type: "line", precision: 0.8, pressure: 0.5 });
    const baseDmg = 999 - base.getState().enemy.hp;
    const buffedDmg = 999 - buffed.getState().enemy.hp;
    expect(buffedDmg).toBeGreaterThan(baseDmg * 1.8);
  });
  it("opening shield from beasts protects the player", () => {
    const b = battle({
      mods: { ...defaultMods(), openingShield: 50 },
      enemy: { id: "e", name: "e", classId: "yao", element: "wood", hp: 999, atk: 10, atkMs: 1000 },
    });
    expect(b.getState().player.shield).toBe(50);
    b.tick(1000);
    expect(b.getState().player.hp).toBe(200);
  });
  it("dodge avoids some enemy attacks deterministically by seed", () => {
    const b = battle({
      mods: { ...defaultMods(), dodgeChance: 1 },
      enemy: { id: "e", name: "e", classId: "yao", element: "wood", hp: 999, atk: 50, atkMs: 500 },
    });
    b.tick(5000);
    expect(b.getState().player.hp).toBe(200);
    expect(b.getState().stats.dodges).toBeGreaterThan(0);
  });
});

describe("enemy traits", () => {
  it("armored enemies start with a shield and zigzag shreds it double", () => {
    const b = battle({ enemy: { id: "e", name: "e", classId: "ti", element: "earth", hp: 200, atk: 5, traits: ["armored"] } });
    const s = b.getState();
    expect(s.enemy.shield).toBe(40);
    b.cast({ type: "zigzag", precision: 0.9, pressure: 0.5 });
    expect(s.enemy.shield).toBeLessThan(40);
  });
  it("spiky enemies reflect part of stroke damage", () => {
    const b = battle({
      mods: { ...defaultMods(), critChance: 0 },
      enemy: { id: "e", name: "e", classId: "ti", element: "earth", hp: 999, atk: 5, traits: ["spiky"] },
    });
    b.cast({ type: "line", precision: 0.9, pressure: 0.5 });
    expect(b.getState().player.hp).toBeLessThan(200);
  });
  it("regen enemies heal over time but not while bound", () => {
    const b = battle({ enemy: { id: "e", name: "e", classId: "yao", element: "wood", hp: 1000, atk: 0, atkMs: 99999, traits: ["regen"] } });
    b.getState().enemy.hp = 500;
    b.getState().enemy.controlMs = 2000;
    b.tick(1000);
    b.tick(1000); // 束缚期间不回复
    expect(b.getState().enemy.hp).toBe(500);
    b.tick(2000); // 束缚解除后回复
    expect(b.getState().enemy.hp).toBeGreaterThan(500);
  });
  it("swift enemies attack more often", () => {
    const slow = battle({ enemy: { id: "e", name: "e", classId: "yao", element: "wood", hp: 999, atk: 1, atkMs: 2000 } });
    const fast = battle({ enemy: { id: "e", name: "e", classId: "yao", element: "wood", hp: 999, atk: 1, atkMs: 2000, traits: ["swift"] } });
    slow.tick(6000);
    fast.tick(6000);
    const hits = (b) => b.getState().log.filter((l) => l.kind === "enemy").length;
    expect(hits(fast)).toBeGreaterThan(hits(slow));
  });
});

describe("intent telegraph", () => {
  it("reports bound / gather / strike states", () => {
    const b = battle({ enemy: { id: "e", name: "e", classId: "yao", element: "wood", hp: 999, atk: 1, atkMs: 2000 } });
    expect(b.getIntent().id).toBe("gather");
    b.tick(1600);
    expect(b.getIntent().id).toBe("strike");
    b.cast({ type: "curve", precision: 1, pressure: 0.5 });
    expect(b.getIntent().id).toBe("bound");
  });
});

describe("elements", () => {
  it("water evaporates fire", () => {
    expect(reaction("water", "fire").id).toBe("evaporate");
  });
  it("thunder conducts through metal with crit bonus", () => {
    expect(reaction("thunder", "metal").crit).toBeGreaterThan(0);
  });
});
