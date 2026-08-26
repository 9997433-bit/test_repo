import { describe, expect, it } from "vitest";
import { HEROES } from "../data/heroes.js";
import { SKILL_FX, castSkill } from "./skills.js";
import { makeEnemy, makeSide } from "./testkit.js";

function heroUnit(id) {
  return { kind: "hero", id, glyph: "将", cd: 0, cooldown: 0 };
}

describe("skills", () => {
  it("gives every hero a distinct fx plus a complete juice payload", () => {
    const fx = new Set();
    for (const hero of HEROES) {
      const side = makeSide();
      const enemies = [makeEnemy({ t: 0.9 }), makeEnemy({ t: 0.5 }), makeEnemy({ t: 0.1 })];
      const r = castSkill(side, heroUnit(hero.id), enemies);
      expect(r.id).toBe(hero.skill.id);
      expect(r.name).toBe(hero.skill.name);
      expect(r.fx).toBe(SKILL_FX[hero.skill.id]);
      expect(fx.has(r.fx)).toBe(false);
      fx.add(r.fx);
      for (const key of ["shake", "color", "sfx", "duration", "shape", "text"]) {
        expect(r.juice[key]).toBeDefined();
      }
      expect(r.juice.text).toBe(hero.skill.name);
      expect(r.cooldown).toBe(hero.skill.cd);
      expect(r.hits).toBeGreaterThan(0);
    }
    expect(fx.size).toBe(HEROES.length);
  });

  it("still works with the legacy 3-argument call and arms the cooldown", () => {
    const side = makeSide();
    const unit = heroUnit("zhaoyun");
    const r = castSkill(side, unit, [makeEnemy({ t: 0.2 })]);
    expect(unit.cooldown).toBe(12);
    expect(r.targets).toHaveLength(1);
  });

  it("routes skill damage through shields instead of ignoring them", () => {
    const side = makeSide();
    const boss = makeEnemy({ hp: 300, maxHp: 300, shield: 100, boss: true, t: 0.8 });
    castSkill(side, heroUnit("huangzhong"), [boss]);
    expect(boss.shield).toBeLessThan(100);
    expect(boss.hp).toBeLessThanOrEqual(300);
    // 42 * 1.65 = 69.3 全部被 100 点护盾吃掉，血量不该掉。
    expect(boss.hp).toBe(300);
    expect(boss.shield).toBeCloseTo(30.7, 4);
  });

  it("dangyang only shoves the enemies past the halfway mark", () => {
    const side = makeSide();
    const far = makeEnemy({ t: 0.8 });
    const near = makeEnemy({ t: 0.2 });
    const r = castSkill(side, heroUnit("zhangfei"), [far, near]);
    expect(r.targets).toEqual([far.id]);
    expect(far.t).toBeCloseTo(0.72, 5);
    expect(far.stun).toBe(1.2);
    expect(near.t).toBe(0.2);
    expect(near.stun).toBe(0);
    expect(r.juice.shake).toBe(1);
  });

  it("rende buffs the side without dealing damage", () => {
    const side = makeSide();
    const e = makeEnemy({ t: 0.5 });
    const r = castSkill(side, heroUnit("liubei"), [e]);
    expect(e.hp).toBe(100);
    expect(side.haste).toBe(6);
    expect(side.rally).toBe(4);
    expect(r.juice.buff).toEqual({ haste: 6, rally: 4 });
  });

  it("xiliang charges the leader and tramples whoever is right behind", () => {
    const side = makeSide();
    const front = makeEnemy({ t: 0.9 });
    const trailing = makeEnemy({ t: 0.86 });
    const behind = makeEnemy({ t: 0.4 });
    const r = castSkill(side, heroUnit("machao"), [front, trailing, behind]);
    expect(r.targets).toEqual([front.id, trailing.id]);
    expect(front.hp).toBeLessThan(trailing.hp);
    expect(behind.hp).toBe(100);
    expect(front.t).toBeCloseTo(0.85, 5);
  });

  it("wenjiu beheads the nearly dead", () => {
    const side = makeSide();
    const chunky = makeEnemy({ hp: 900, maxHp: 900, t: 0.7 });
    const bleeding = makeEnemy({ hp: 900, maxHp: 5000, t: 0.6 });
    const r = castSkill(side, heroUnit("guanyu"), [chunky, bleeding]);
    expect(bleeding.hp).toBe(0);
    expect(chunky.hp).toBeGreaterThan(0);
    expect(r.juice.beheaded).toBe(1);
    expect(r.kills).toBe(1);
  });

  it("qijin sweeps everyone and leaves them slowed", () => {
    const side = makeSide();
    const enemies = [makeEnemy({ t: 0.1 }), makeEnemy({ t: 0.6 })];
    const r = castSkill(side, heroUnit("zhaoyun"), enemies);
    expect(r.hits).toBe(2);
    for (const e of enemies) {
      expect(e.hp).toBeLessThan(100);
      expect(e.slowT).toBeGreaterThan(0);
      expect(e.slowMul).toBeLessThan(1);
    }
  });
});
