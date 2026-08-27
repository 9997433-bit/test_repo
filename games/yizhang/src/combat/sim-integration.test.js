// combat 装进 `src/sim` 之后的端到端断言。
//
// 这里刻意走 sim.createMatch / sim.step（而不是 testkit）：契约的真正读者是 step.js 的
// applyHits，命中必须带 targetId、applied，冲量必须已经写进速度。
//
// 只用真实模块：`src/sim` 已经静态 import 真实 data + combat，测试**不**注入任何替身，
// sim 侧的兜底解算（旧的 `sim/fallback-combat.js`）已经删除，不存在「跑没跑真货」的分叉。
//
// 朝向按冻结契约算：sim 的 yaw=0 面向 **-Z**（`src/sim/math.js` 的 FACE）。
// combat 内部按 yaw=0 面向 +Z 记账，两者的 π 相位差只在 `src/sim/combat-bridge.js`
// 与本目录的 `sim-bridge.js` 两层适配器里换算，测试一律按 sim 的约定摆位。

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SKILL_HANDLERS, normalizeSkillId } from "./skills.js";
import { SIM_ADAPTER } from "./sim-bridge.js";
import { GLOVES, GLOVE_BY_ID } from "../data/gloves.js";
import { SKILLS as DATA_SKILLS } from "../data/skills.js";
import {
  createMatch,
  forwardX,
  forwardZ,
  getDeps,
  getView,
  installCombat,
  resetDeps,
  step,
} from "../sim/index.js";

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
  const attacker = state.players.find((p) => p.id === "p0");
  const target = state.players.find((p) => p !== attacker);
  return { state, attacker, target };
}

function reset(p) {
  p.vx = 0;
  p.vy = 0;
  p.vz = 0;
  p.alive = true;
  p.invulnT = 0;
  p.respawnT = 0;
  p.awakenedT = 0;
  p.meter = 0;
  p.statuses.length = 0;
}

/** 攻击者站原点朝 yaw=0（即 -Z），目标摆在他正前方 distance 米、偏 angle 弧度处。 */
function place(attacker, target, distance, angle = 0) {
  reset(attacker);
  reset(target);
  attacker.x = 0;
  attacker.y = 0;
  attacker.z = 0;
  attacker.yaw = 0;
  target.x = Math.sin(angle) * distance;
  target.y = 0;
  target.z = -Math.cos(angle) * distance;
  target.yaw = Math.PI;
}

function equip(player, gloveId, offhandId = "cotton") {
  player.gloveId = gloveId;
  player.offhandId = offhandId;
  player.activeSlot = 0;
}

/** step 每帧都会清空 state.events，跨帧断言得自己攒。 */
function advance(state, seconds, inputs = {}) {
  const frames = Math.ceil(seconds / DT);
  const events = [];
  for (let i = 0; i < frames; i++) {
    step(state, inputs, DT);
    events.push(...state.events);
  }
  return events;
}

function gap(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

/** 沿 attacker 正前方（-Z）的速度分量。 */
function speedForward(p, yaw = 0) {
  return p.vx * forwardX(yaw) + p.vz * forwardZ(yaw);
}

beforeEach(() => {
  resetDeps();
});

afterEach(() => {
  resetDeps();
});

describe("sim 的默认接线", () => {
  it("裸 createMatch/step 就跑真实 data + 真实 combat，不需要任何 install", () => {
    const deps = getDeps();
    expect(deps.usingRealData).toBe(true);
    expect(deps.usingRealCombat).toBe(true);
    expect(deps.combat.resolveSlap).toBeTypeOf("function");
    expect(deps.combat.resolveSkill).toBeTypeOf("function");
    expect(deps.combat.tickStatuses).toBeTypeOf("function");
    expect(deps.GLOVES).toHaveLength(GLOVES.length);
    expect(deps.GLOVE_BY_ID.granite.slapCooldown).toBe(GLOVE_BY_ID.granite.slapCooldown);
  });

  it("import combat 不会把 sim 的换算层顶掉", () => {
    // ./sim-bridge.js 在 import 本模块时就跑过了；它必须让位给 sim 的静态接线。
    expect(getDeps().usingRealCombat).toBe(true);
  });
});

describe("扇击经 sim.step", () => {
  it("命中沿背离方向加速，并记进 sim 的计分与受击窗口", () => {
    const { state, attacker, target } = duel({ seed: 402, gloveId: "cotton", offhandId: "spring" });
    const cotton = GLOVE_BY_ID.cotton;
    equip(attacker, "cotton", "spring");
    place(attacker, target, cotton.slapRange * 0.7);

    step(state, { [attacker.id]: input({ slap: true }) }, DT);
    let peakKbT = 0;
    const frames = Math.ceil((cotton.windup + cotton.recovery + 0.1) / DT);
    for (let i = 0; i < frames; i++) {
      step(state, {}, DT);
      peakKbT = Math.max(peakKbT, target.kbT);
    }

    // 攻击者朝 -Z，目标被推得更 -Z。
    expect(target.vz).toBeLessThan(-0.1);
    expect(speedForward(target)).toBeGreaterThan(0.1);
    // 受击窗口：sim 在这段时间里削弱摩擦与操控，冲量才滑得出去。
    expect(peakKbT).toBeGreaterThan(0);
    expect(target.lastHitBy).toBe(attacker.id);
    expect(attacker.hitsDealt).toBeGreaterThan(0);
    expect(state.stats.hits).toBeGreaterThan(0);
  });

  it("冲量当帧就已经写进速度，sim 不再重复施加一次", () => {
    const { state, attacker, target } = duel({ seed: 4021, gloveId: "cotton", offhandId: "spring" });
    const cotton = GLOVE_BY_ID.cotton;
    equip(attacker, "cotton", "spring");
    place(attacker, target, cotton.slapRange * 0.6);

    step(state, { [attacker.id]: input({ slap: true }) }, DT);
    const events = advance(state, cotton.windup + 0.02);

    const hit = events.find((e) => e.type === "hit" && e.targetId === target.id);
    expect(hit).toBeTruthy();
    expect(hit.id).toBe(attacker.id);
    expect(target.hitsTaken).toBe(1);
    expect(Math.hypot(target.vx, target.vz)).toBeGreaterThan(1);
  });

  it("扇形外的目标扇不到", () => {
    const { state, attacker, target } = duel({ seed: 403, gloveId: "cotton", offhandId: "spring" });
    const cotton = GLOVE_BY_ID.cotton;
    equip(attacker, "cotton", "spring");
    place(
      attacker,
      target,
      cotton.slapRange * 0.7,
      (cotton.slapAngleDeg / 2 + 12) * (Math.PI / 180),
    );

    step(state, { [attacker.id]: input({ slap: true }) }, DT);
    advance(state, cotton.windup + cotton.recovery + 0.1);

    expect(Math.hypot(target.vx, target.vz)).toBeLessThan(0.05);
    expect(target.hitsTaken).toBe(0);
  });
});

describe("磁掌经 sim.step", () => {
  it("按下 E 之后真的把人拉近了", () => {
    const { state, attacker, target } = duel({ seed: 404, gloveId: "magnet", offhandId: "cotton" });
    equip(attacker, "magnet", "cotton");
    equip(target, "cotton", "spring");
    place(attacker, target, 4);
    const before = gap(attacker, target);

    step(state, { [attacker.id]: input({ skill: true }) }, DT);
    // 目标在 -Z，被拽向 +Z（攻击者那边）。
    expect(target.vz).toBeGreaterThan(5);
    expect(speedForward(target)).toBeLessThan(-5);
    expect(attacker.skillCd).toBeGreaterThan(0); // sim 吃到了 combat 返回的 cooldown

    advance(state, 0.5);
    expect(gap(attacker, target)).toBeLessThan(before - 0.1);
    expect(state.stats.hits).toBeGreaterThan(0);
  });

  it("冷却期间再按无效，冷却走完可以再拉一次", () => {
    const { state, attacker, target } = duel({ seed: 405, gloveId: "magnet", offhandId: "cotton" });
    equip(attacker, "magnet", "cotton");
    place(attacker, target, 5);

    step(state, { [attacker.id]: input({ skill: true }) }, DT);
    const cd = attacker.skillCd;
    expect(cd).toBeGreaterThan(0);

    // 冷却里再点（先松手一帧才算新的边沿）：既不出事件，也不重置冷却。
    step(state, {}, DT);
    place(attacker, target, 5);
    step(state, { [attacker.id]: input({ skill: true }) }, DT);
    expect(state.events.some((e) => e.type === "skill")).toBe(false);
    expect(Math.hypot(target.vx, target.vz)).toBeLessThan(0.05);
    expect(attacker.skillCd).toBeLessThan(cd);

    // 冷却走完再点：又能拉一次。
    step(state, {}, DT);
    attacker.skillCd = 0;
    place(attacker, target, 5);
    step(state, { [attacker.id]: input({ skill: true }) }, DT);
    expect(state.events.some((e) => e.type === "skill" && e.skillId === "magnetPull")).toBe(true);
    expect(target.vz).toBeGreaterThan(5);
  });
});

describe("弹簧架招经 sim.step", () => {
  it("窗口期内挨扇，攻击者被弹回去，防守方这一掌不算受击", () => {
    const { state, attacker, target: defender } = duel({
      seed: 406,
      gloveId: "cotton",
      offhandId: "spring",
    });
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
    expect(defender.statuses.some((s) => s.kind === "parryWindow" && s.t > 0)).toBe(true);

    advance(state, Math.min(0.45, cotton.windup + 0.2));

    // 攻击者从 +Z 侧打过来（防守方在 -Z），被弹回去就是 +Z 方向。
    expect(attacker.vz).toBeGreaterThan(0.1);
    expect(speedForward(attacker)).toBeLessThan(-0.1);
    expect(defender.vz).toBeCloseTo(0, 6);
    expect(defender.hitsTaken).toBe(0); // 被架住的那一掌不算命中
  });

  it("窗口过期之后照常挨打", () => {
    const { state, attacker, target: defender } = duel({
      seed: 4061,
      gloveId: "cotton",
      offhandId: "spring",
    });
    const cotton = GLOVE_BY_ID.cotton;
    equip(attacker, "cotton", "magnet");
    equip(defender, "spring", "cotton");
    place(attacker, defender, cotton.slapRange * 0.65);

    step(state, { [defender.id]: input({ yaw: Math.PI, skill: true }) }, DT);
    advance(state, 1.2); // parry window 只有 0.5s
    place(attacker, defender, cotton.slapRange * 0.65);

    step(state, { [attacker.id]: input({ slap: true }) }, DT);
    advance(state, cotton.windup + cotton.recovery + 0.1);

    expect(defender.hitsTaken).toBe(1);
    expect(defender.vz).toBeLessThan(-0.1);
  });
});

describe("技能 id 两套词表都认", () => {
  it("data 的 skillId、data 技能表的 type、combat 的 handler id 都派发到同一个 handler", () => {
    const expected = {
      cotton: "none",
      granite: "groundPound",
      gale: "dashSlap",
      frost: "frostArc",
      spring: "parry",
      afterimage: "blinkSwap",
      magnet: "magnetPull",
      meteor: "meteorSlam",
    };

    for (const glove of GLOVES) {
      const canon = normalizeSkillId(glove.skillId);
      expect(canon, `${glove.id} 的 skillId=${glove.skillId}`).toBe(expected[glove.id]);
      expect(SKILL_HANDLERS[canon]).toBeTypeOf("function");
      // handler id 自身、以及大小写/分隔符的其它写法都必须折回同一个 key
      expect(normalizeSkillId(canon)).toBe(canon);
      expect(normalizeSkillId(glove.skillId.replace(/_/g, "-"))).toBe(canon);
      expect(normalizeSkillId(glove.skillId.toUpperCase())).toBe(canon);
    }

    // src/data/skills.js 的 key 与 type 两列也不能有认不出来的
    for (const [id, skill] of Object.entries(DATA_SKILLS)) {
      expect(normalizeSkillId(id), `data skill ${id}`).not.toBe("none");
      if (skill && skill.type) {
        expect(normalizeSkillId(skill.type), `data skill type ${skill.type}`).toBe(
          normalizeSkillId(id),
        );
      }
    }
  });

  it("八掌各自的主动技都能经 step 打出 skill 事件", () => {
    for (const glove of GLOVES) {
      if (normalizeSkillId(glove.skillId) === "none") continue;
      const { state, attacker, target } = duel({
        seed: 500,
        gloveId: glove.id,
        offhandId: "cotton",
      });
      equip(attacker, glove.id, "cotton");
      place(attacker, target, 3);

      step(state, { [attacker.id]: input({ skill: true }) }, DT);
      const fired = state.events.find((e) => e.type === "skill" && e.id === attacker.id);
      expect(fired, `${glove.id} 的 ${glove.skillId} 没进局`).toBeTruthy();
      expect(fired.skillId).toBe(normalizeSkillId(glove.skillId));
      expect(attacker.skillCd).toBeGreaterThan(0);
    }
  });

  it("陨掌的延迟落地命中也经 step 记账", () => {
    const { state, attacker, target } = duel({ seed: 501, gloveId: "meteor", offhandId: "cotton" });
    equip(attacker, "meteor", "cotton");
    place(attacker, target, 2.5);

    step(state, { [attacker.id]: input({ skill: true }) }, DT);
    expect(attacker.vy).toBeGreaterThan(0); // 先腾空
    advance(state, 1.4); // delay 0.85s 之后砸下

    expect(state.stats.hits).toBeGreaterThan(0);
    expect(target.lastHitBy).toBe(attacker.id);
    // 砸地也吃进了 sim 的台面 HP（一发砸不碎，但必须掉血）
    expect(state.arena.tiles.some((t) => t.hp < t.maxHp)).toBe(true);
  });
});

describe("显式注入路径", () => {
  it("必须注入 combat 的宿主注入 SIM_ADAPTER，结果与静态接线逐帧一致", () => {
    const run = () => {
      const { state, attacker, target } = duel({
        seed: 606,
        gloveId: "magnet",
        offhandId: "spring",
      });
      equip(attacker, "magnet", "spring");
      equip(target, "spring", "cotton");
      place(attacker, target, 4);
      for (let i = 0; i < 120; i++) {
        step(state, { [attacker.id]: input({ slap: true, skill: i === 0 }) }, DT);
      }
      return state.players.map((p) => [p.x, p.y, p.z, p.vx, p.vy, p.vz, p.yaw, p.hitsTaken]);
    };

    const viaStatic = run();
    installCombat(SIM_ADAPTER);
    const viaAdapter = run();
    expect(viaAdapter).toEqual(viaStatic);
  });

  // 装配层 / 探针会把 combat 的裸命名空间原样 installCombat 进来。sim 的 deps 认得出真身
  // 并折回自己的 combat-bridge；这条守住那个折回：绕过换算层的话，全场朝向会整体反 180°。
  it("宿主把裸命名空间塞进 installCombat，朝向也不许整体反 180°", async () => {
    const bare = await import("./index.js");
    installCombat(bare);

    const { state, attacker, target } = duel({ seed: 607, gloveId: "magnet", offhandId: "cotton" });
    equip(attacker, "magnet", "cotton");
    place(attacker, target, 4);
    const before = gap(attacker, target);

    step(state, { [attacker.id]: input({ skill: true }) }, DT);
    expect(target.vz).toBeGreaterThan(5); // 目标在 -Z，被拽回 +Z
    advance(state, 0.5);
    expect(gap(attacker, target)).toBeLessThan(before - 0.1);

    // 扇击也一样：正前方（-Z）的人打得到，身后的人打不到
    const cotton = GLOVE_BY_ID.cotton;
    equip(attacker, "cotton", "magnet");
    place(attacker, target, cotton.slapRange * 0.7);
    step(state, { [attacker.id]: input({ slap: true }) }, DT);
    advance(state, cotton.windup + cotton.recovery + 0.1);
    expect(target.hitsTaken).toBeGreaterThan(0);
    expect(target.vz).toBeLessThan(-0.1);

    attacker.hitsDealt = 0;
    target.hitsTaken = 0;
    place(attacker, target, cotton.slapRange * 0.7, Math.PI); // 挪到背后
    step(state, { [attacker.id]: input({ slap: true }) }, DT);
    advance(state, cotton.windup + cotton.recovery + 0.1);
    expect(target.hitsTaken).toBe(0);
  });
});

describe("残影经 sim.step 进 view", () => {
  it("分身放技能后 view.combat.ghosts 不再是空的，每一具都带 afterimage 与淡出基准", () => {
    const { state, attacker, target } = duel({ seed: 700, gloveId: "afterimage", offhandId: "cotton" });
    equip(attacker, "afterimage", "cotton");
    place(attacker, target, 3);

    expect(getView(state).combat.ghosts).toEqual([]);
    step(state, { [attacker.id]: input({ skill: true }) }, DT);

    const ghosts = getView(state).combat.ghosts;
    expect(ghosts.length).toBeGreaterThan(0);
    for (const ghost of ghosts) {
      // O2 的分派键：不带 gloveId 的残影只能按类型猜特效（Round 1 遗留 3）
      expect(ghost.gloveId).toBe("afterimage");
      expect(ghost.ttl).toBeGreaterThan(0);
      expect(ghost.ttl0).toBeGreaterThanOrEqual(ghost.ttl);
      expect(Number.isFinite(ghost.x + ghost.y + ghost.z + ghost.yaw)).toBe(true);
      // 桥把 yaw wrap 回 (-π, π] 再 round4，所以只留 round4 的余量
      expect(Math.abs(ghost.yaw)).toBeLessThanOrEqual(Math.PI + 1e-4);
    }
    expect(ghosts.map((g) => g.ownerId)).toContain(attacker.id);

    // ttl 走完就出场，view 不会越攒越长
    advance(state, 3);
    expect(getView(state).combat.ghosts).toEqual([]);
  });
});

describe("安全区经 sim.step 仍然免战", () => {
  it("走道上按住扇击 + 技能 180 帧：不出招、不受击、不留残影", () => {
    const state = createMatch({ seed: 701, botCount: 3, phase: "hub", unlocked: "all" });
    const p0 = state.players.find((p) => p.id === "p0");
    const before = { x: p0.x, z: p0.z, slaps: state.stats.slaps, hitsTaken: p0.hitsTaken, deaths: p0.deaths };

    // 只有 p0 在走道上（Bot 留在裂岛坐标，按 ADR-33 不受闸），所以只喂 p0。
    const events = advance(state, 3, { p0: input({ slap: true, skill: true }) });

    expect(state.phase).toBe("hub");
    expect(p0.attack.phase).toBe("idle");
    expect(state.stats.slaps).toBe(before.slaps);
    expect(events.some((e) => e.id === "p0" && ["slapStart", "slap", "skill", "hit"].includes(e.type))).toBe(false);
    expect(getView(state).combat.ghosts).toEqual([]);
    expect(p0.x).toBeCloseTo(before.x, 6);
    expect(p0.z).toBeCloseTo(before.z, 6);
    expect(p0.hitsTaken).toBe(before.hitsTaken);
    expect(p0.deaths).toBe(before.deaths);
  });
});

describe("整局稳定性", () => {
  it("跑满 240 帧仍然可 structuredClone，且没有 NaN", () => {
    const { state, attacker } = duel({
      seed: 407,
      gloveId: "meteor",
      offhandId: "gale",
      botCount: 3,
    });
    for (let i = 0; i < 240; i++) {
      step(state, { [attacker.id]: input({ slap: true, skill: i % 90 === 0 }) }, DT);
    }
    expect(() => structuredClone(state)).not.toThrow();
    for (const p of state.players) {
      expect(Number.isFinite(p.x + p.y + p.z + p.vx + p.vy + p.vz + p.meter)).toBe(true);
    }
  });
});
