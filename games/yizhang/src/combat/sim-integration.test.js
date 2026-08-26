// combat 装进 src/sim 之后的端到端断言。
// 这里刻意走 sim.createMatch / sim.step（而不是 testkit），因为契约的真正读者是
// step.js 的 applyHits：命中必须带 targetId、applied，冲量必须已经写进速度。

import { beforeEach, describe, expect, it } from "vitest";

// 先 import combat：它的 sim-bridge 会把自己装进 sim 的依赖表。
import { resolveSkill, resolveSlap } from "./index.js";
import { installIntoSim } from "./sim-bridge.js";
import { GLOVE_BY_ID } from "../data/gloves.js";
import { resolveSlap as fallbackResolveSlap } from "../sim/fallback-combat.js";
import { createMatch, getDeps, step } from "../sim/index.js";

const DT = 1 / 60;

function input(overrides = {}) {
  return {
    moveX: 0,
    moveZ: 0,
    yaw: 0,
    slap: false,
    skill: false,
    switchGlove: false,
    dash: false,
    jump: false,
    ...overrides,
  };
}

function duel(opts) {
  const state = createMatch({ botCount: 1, ...opts });
  const [attacker, target] = state.players;
  return { state, attacker, target };
}

/** 契约约定 yaw=0 面向 +Z：攻击者站原点，目标正前方 distance 米处。 */
function place(attacker, target, distance) {
  for (const p of [attacker, target]) {
    p.vx = 0;
    p.vy = 0;
    p.vz = 0;
    p.alive = true;
    p.invulnT = 0;
    p.respawnT = 0;
    p.awakenedT = 0;
    p.statuses = [];
  }
  attacker.x = 0;
  attacker.y = 1;
  attacker.z = 0;
  attacker.yaw = 0;
  target.x = 0;
  target.y = 1;
  target.z = distance;
  target.yaw = Math.PI;
}

function equip(player, gloveId, offhandId) {
  player.gloveId = gloveId;
  player.offhandId = offhandId;
  player.activeSlot = 0;
}

function advance(state, seconds, inputs = {}) {
  for (let i = 0; i < Math.ceil(seconds / DT); i++) step(state, inputs, DT);
}

function gap(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

beforeEach(() => {
  installIntoSim();
});

describe("装进 sim 之后", () => {
  it("import combat 就完成 installCombat，sim 不再跑兜底解算", () => {
    expect(getDeps().usingRealCombat).toBe(true);
    expect(getDeps().combat.resolveSlap).not.toBe(fallbackResolveSlap);
    // 兜底解算会在 state=null 上炸；真实解算返回空命中列表。
    expect(getDeps().combat.resolveSlap(null, null, undefined, 0)).toHaveLength(0);
  });

  it("resolveSlap 的返回值既是命中数组也带 hits（step.js 读 res.hits）", () => {
    const { state, attacker, target } = duel({ seed: 401, gloveId: "cotton", offhandId: "spring" });
    equip(attacker, "cotton", "spring");
    place(attacker, target, GLOVE_BY_ID.cotton.slapRange * 0.6);

    const res = resolveSlap(state, attacker, undefined, state.time);
    expect(Array.isArray(res)).toBe(true);
    expect(res.hits).toBe(res);
    expect(res[0].targetId).toBe(target.id);
    expect(res[0].applied).toBe(true);
    // applied 意味着冲量已经落在速度上，sim 不该再加一次。
    expect(target.vz).toBeCloseTo(res[0].impulse.z, 6);
  });

  it("按住扇击：命中沿背离方向加速，并记进 sim 的计分", () => {
    const { state, attacker, target } = duel({ seed: 402, gloveId: "cotton", offhandId: "spring" });
    const cotton = GLOVE_BY_ID.cotton;
    equip(attacker, "cotton", "spring");
    place(attacker, target, cotton.slapRange * 0.7);

    step(state, { [attacker.id]: input({ slap: true }) }, DT);
    let peakKbT = 0;
    for (let i = 0; i < Math.ceil((cotton.windup + cotton.recovery + 0.1) / DT); i++) {
      step(state, {}, DT);
      peakKbT = Math.max(peakKbT, target.kbT);
    }

    expect(target.vz).toBeGreaterThan(0.1);
    // 受击窗口：sim 在这段时间里削弱摩擦与操控，冲量才滑得出去。
    expect(peakKbT).toBeGreaterThan(0);
    expect(target.lastHitBy).toBe(attacker.id);
    expect(attacker.hitsDealt).toBeGreaterThan(0);
    expect(state.stats.hits).toBeGreaterThan(0);
  });

  it("扇形外的目标扇不到", () => {
    const { state, attacker, target } = duel({ seed: 403, gloveId: "cotton", offhandId: "spring" });
    const cotton = GLOVE_BY_ID.cotton;
    equip(attacker, "cotton", "spring");
    place(attacker, target, cotton.slapRange * 0.7);
    const angle = (cotton.slapAngleDeg / 2 + 12) * (Math.PI / 180);
    target.x = Math.sin(angle) * cotton.slapRange * 0.7;
    target.z = Math.cos(angle) * cotton.slapRange * 0.7;

    step(state, { [attacker.id]: input({ slap: true }) }, DT);
    advance(state, cotton.windup + cotton.recovery + 0.1);

    expect(Math.hypot(target.vx, target.vz)).toBeLessThan(0.05);
  });

  it("磁掌：按下 E 之后 sim.step 真的把人拉近了", () => {
    const { state, attacker, target } = duel({ seed: 404, gloveId: "magnet", offhandId: "cotton" });
    equip(attacker, "magnet", "cotton");
    equip(target, "cotton", "spring");
    place(attacker, target, 4);
    const before = gap(attacker, target);

    step(state, { [attacker.id]: input({ skill: true }) }, DT);
    expect(target.vz).toBeLessThan(-5); // 目标在 +Z，被拽向 -Z
    advance(state, 0.5);

    expect(gap(attacker, target)).toBeLessThan(before - 0.1);
    expect(state.events.length).toBeGreaterThanOrEqual(0);
    expect(attacker.skillCd).toBeGreaterThan(0); // sim 吃到了 combat 返回的 cooldown
  });

  it("磁掌冷却期间再按无效，冷却走完可以再拉一次", () => {
    const { state, attacker, target } = duel({ seed: 405, gloveId: "magnet", offhandId: "cotton" });
    equip(attacker, "magnet", "cotton");
    place(attacker, target, 5);

    expect(resolveSkill(state, attacker, undefined, state.time).ok).toBe(true);
    attacker.skillCd = 4;
    expect(resolveSkill(state, attacker, undefined, state.time).reason).toBe("cooldown");
    attacker.skillCd = 0;
    expect(resolveSkill(state, attacker, undefined, state.time).ok).toBe(true);
  });

  it("弹簧架招：窗口期内挨扇，攻击者被弹回去", () => {
    const { state, attacker, target: defender } = duel({ seed: 406, gloveId: "cotton", offhandId: "spring" });
    const cotton = GLOVE_BY_ID.cotton;
    equip(attacker, "cotton", "magnet");
    equip(defender, "spring", "cotton");
    place(attacker, defender, cotton.slapRange * 0.65);

    step(
      state,
      {
        [attacker.id]: input({ slap: true }),
        [defender.id]: input({ yaw: Math.PI, skill: true }),
      },
      DT,
    );
    advance(state, Math.min(0.45, cotton.windup + 0.2));

    // 攻击者从 -Z 侧打过来，弹回去就是 -Z 方向。
    expect(attacker.vz).toBeLessThan(-0.1);
    expect(defender.vz).toBeCloseTo(0, 6);
    expect(defender.hitsTaken).toBe(0); // 被架住的那一掌不算命中
  });

  it("整局跑下来 state 仍然可 structuredClone，且没有 NaN", () => {
    const { state, attacker } = duel({ seed: 407, gloveId: "meteor", offhandId: "gale", botCount: 3 });
    for (let i = 0; i < 240; i++) {
      step(state, { [attacker.id]: input({ slap: true, skill: i % 90 === 0 }) }, DT);
    }
    expect(() => structuredClone(state)).not.toThrow();
    for (const p of state.players) {
      expect(Number.isFinite(p.x + p.y + p.z + p.vx + p.vy + p.vz + p.meter)).toBe(true);
    }
  });
});
