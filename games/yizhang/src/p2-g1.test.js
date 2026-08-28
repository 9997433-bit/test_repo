// P2 内容轮 G1 验收锁：只覆盖跨模块结果，不复制各模块的内部时序测试。

import { beforeEach, describe, expect, it } from "vitest";

import { resolveSlap } from "./combat/index.js";
import { makePlayer, makeState, stepSim } from "./combat/testkit.js";
import { ENTRY, skipHubFor } from "./core/entry.js";
import {
  STORY_TRIGGER,
  createStoryDirector,
  pickBeat,
  storyTriggerForEvent,
} from "./core/story-flow.js";
import { GLOVE_BY_ID, STORY, isGloveUnlocked } from "./data/index.js";
import {
  ZERO_INPUT,
  createMatch,
  enterArena,
  getPlayer,
  resetDeps,
  respawnPlayer,
  statusMods,
  step,
} from "./sim/index.js";

const DT = 1 / 60;
const FACE_PLUS_X = -Math.PI / 2;
const COTTON = GLOVE_BY_ID.cotton;

function advance(state, seconds, inputs = {}) {
  const frames = Math.ceil(seconds / DT);
  for (let i = 0; i < frames; i++) step(state, inputs, DT);
}

function place(player, x, z, yaw = 0) {
  player.x = x;
  player.y = 0;
  player.z = z;
  player.yaw = yaw;
  player.vx = 0;
  player.vy = 0;
  player.vz = 0;
  player.grounded = true;
}

function slapOnce(state, attacker, target) {
  place(attacker, 0, 0, FACE_PLUS_X);
  place(target, 2, 0);
  attacker.invulnT = 0;
  attacker.attack.phase = "idle";
  attacker.attack.t = 0;
  attacker.slapCd = 0;

  const before = target.hitsTaken;
  advance(
    state,
    COTTON.windup + 2 * DT,
    { [attacker.id]: { ...ZERO_INPUT, slap: true, yaw: FACE_PLUS_X } },
  );
  expect(target.hitsTaken).toBe(before + 1);
}

beforeEach(() => {
  resetDeps();
});

describe("P2-G1：重生 / 过门无敌帧不会变成永久无敌", () => {
  it("重生后等 invulnTime + ε，下一记扇击可以命中", () => {
    const state = createMatch({ seed: 201, botCount: 1, phase: "arena" });
    const attacker = getPlayer(state, "p0");
    const target = getPlayer(state, "b0");

    respawnPlayer(state, target);
    expect(target.invulnT).toBe(state.config.invulnTime);
    advance(state, state.config.invulnTime + DT);
    expect(target.invulnT).toBe(0);

    slapOnce(state, attacker, target);
  });

  it("过门后等 invulnTime + ε，下一记扇击可以命中", () => {
    const state = createMatch({ seed: 202, botCount: 1, phase: "hub" });
    const target = getPlayer(state, "p0");
    const attacker = getPlayer(state, "b0");

    enterArena(state, target);
    expect(target.invulnT).toBe(state.config.invulnTime);
    advance(state, state.config.invulnTime + DT);
    expect(target.invulnT).toBe(0);

    slapOnce(state, attacker, target);
  });
});

describe("P2-G1：扇击硬直只封动作，不封位移", () => {
  it("命中挂 stun、canAct=false，目标仍被击退持续推动", () => {
    const attacker = makePlayer("A", { gloveId: "granite", x: 0, z: 0 });
    const target = makePlayer("B", { x: 0, z: 2.2 });
    const state = makeState([attacker, target]);

    expect(resolveSlap(state, attacker, undefined, 0)).toHaveLength(1);
    expect(target.statuses.some((status) => status.kind === "stun")).toBe(true);
    expect(target.canAct).toBe(false);
    expect(statusMods(target).canMove).toBe(true);

    const before = target.z;
    stepSim(state, { B: { moveZ: -1, yaw: target.yaw } }, DT);
    expect(target.z).toBeGreaterThan(before);
    expect(target.statuses.some((status) => status.kind === "stun")).toBe(true);
  });
});

describe("P2-G1：story 不阻断直进 / 再来一局", () => {
  it("skipHub 直通裂岛，大厅三拍未放也不挡岛上/结算拍", () => {
    const state = createMatch({ seed: 203, botCount: 1, skipHub: true });
    expect(state.phase).toBe("arena");
    expect(skipHubFor(ENTRY.RESTART)).toBe(true);
    expect(skipHubFor(ENTRY.HUB)).toBe(false);

    // 拍 1–3 是走道挂点；skipHub 从不发它们。拍 4–5 按 trigger 独立取，不挡。
    const seen = [];
    expect(pickBeat(STORY, STORY_TRIGGER.FIRST_KILL_OR_FALL, seen).id).toBe("first_blood");
    expect(pickBeat(STORY, STORY_TRIGGER.MATCH_FIRST_WIN, seen).id).toBe("first_win");
    expect(storyTriggerForEvent({ type: "ko", killerId: "p0", victimId: "b0" }, "p0")).toBe(
      STORY_TRIGGER.FIRST_KILL_OR_FALL,
    );

    const director = createStoryDirector({ story: STORY, toast: () => {} });
    const blood = director.fire(STORY_TRIGGER.FIRST_KILL_OR_FALL);
    expect(blood).not.toBeNull();
    expect(typeof blood.then).toBe("undefined");
    expect(blood.id).toBe("first_blood");
    // 「再来一局」清掉没念完的句子，下一场立刻能领首胜拍
    director.reset();
    expect(director.pending).toEqual([]);
    expect(director.take(STORY_TRIGGER.MATCH_FIRST_WIN).id).toBe("first_win");
  });
});

describe("P2-G1：生涯四掌只按存档 stats 里程碑解锁", () => {
  const CASES = [
    ["cocoon", "totalSlapHits", 300],
    ["raven", "portalCrossings", 20],
    ["victor", "wins", 10],
    ["tumbler", "matches", 25],
  ];

  it.each(CASES)("%s 从 stats.%s 读取阈值 %i", (gloveId, stat, threshold) => {
    expect(isGloveUnlocked(gloveId, { [stat]: threshold })).toBe(false);
    expect(isGloveUnlocked(gloveId, { stats: { [stat]: threshold - 1 } })).toBe(false);
    expect(isGloveUnlocked(gloveId, { stats: { [stat]: threshold } })).toBe(true);
  });
});
