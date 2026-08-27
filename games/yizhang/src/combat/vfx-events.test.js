// combat 侧的 VFX 分派键（ADR-27 / 契约 §5.1-8、§10、§14-19）。
//
// O2 要按事件上的 `gloveId` 分派八掌可辨特效、按 `skillId` 分派技能表现，所以这里钉死：
//   1. 任何战斗来源的事件（扇击 / 命中 / 技能 / 弹反 / 陨掌落地 / 残影假掌 / 觉醒）
//      都带 `gloveId`，且值取自**出招那一刻**的掌，不是按事件类型猜的；
//   2. 命中记录（HitRecord）同样带 `gloveId`，延迟结算（陨掌落地、冲刺接触）也不丢；
//   3. `state.combat.ghosts` 是 `view.combat.ghosts` 的唯一来源，逐具带
//      ownerId / 位姿 / ttl+ttl0 / gloveId；
//   4. 安全区照旧一掌不接（`inSafeZone` 闸），大厅里不该有任何战斗事件或残影。
//
// 朝向按 combat 自己的方言摆位：yaw=0 面向 +Z（出桥后由 sim/combat-bridge.js 换回 -Z）。

import { beforeEach, describe, expect, it } from "vitest";

import { AWAKEN, applyStatus, beginSlap, registerGloves, resolveSkill, resolveSlap, tickStatuses } from "./index.js";
import { FALLBACK_GLOVE_BY_ID, GHOSTS } from "./constants.js";
import { normalizeSkillId } from "./skills.js";
import { makePlayer, makeState, makeTiles, stepSim } from "./testkit.js";
import { HUB } from "../data/hub.js";

/** 8 只掌的 id 词表（契约 §2 GloveId）。 */
const GLOVE_IDS = ["cotton", "granite", "gale", "frost", "spring", "afterimage", "magnet", "meteor"];

/** 这些事件是 O2 的分派入口，每一条都必须自带 gloveId。 */
const VFX_EVENT_TYPES = [
  "slap",
  "slapWhiff",
  "slapWindup",
  "skillCast",
  "skillHit",
  "parry",
  "meteorImpact",
  "ghostSlap",
  "awaken",
  "awakenEnd",
];

function face(a, b) {
  a.yaw = Math.atan2(b.x - a.x, b.z - a.z);
}

function duel(gloveId = "cotton", gap = 1.6, opts = {}) {
  const a = makePlayer("A", { gloveId, offhandId: "cotton", x: 0, z: 0, ...(opts.a || {}) });
  const b = makePlayer("B", { gloveId: opts.bGlove || "cotton", x: 0, z: gap, ...(opts.b || {}) });
  face(a, b);
  face(b, a);
  const state = makeState([a, b], opts.state);
  return { state, a, b };
}

/** 推进若干秒（testkit 负责积分，combat 的延迟结算才会到点）。 */
function advance(state, seconds, inputs = {}, pin = []) {
  const frames = Math.round(seconds * 60);
  const anchors = pin.map((p) => ({ p, x: p.x, z: p.z }));
  for (let i = 0; i < frames; i++) {
    stepSim(state, inputs, 1 / 60, { moveSpace: "world" });
    for (const anchor of anchors) {
      anchor.p.x = anchor.x;
      anchor.p.z = anchor.z;
      anchor.p.y = 0;
      anchor.p.vx = 0;
      anchor.p.vy = 0;
      anchor.p.vz = 0;
    }
  }
}

function eventsOfType(state, type) {
  return state.events.filter((e) => e.type === type);
}

function firstEvent(state, type) {
  return state.events.find((e) => e.type === type);
}

/** 安全区状态：hub 阶段 + 真实布局，两个人都站在走道上。 */
function hubDuel(gloveId = "granite", gap = 1.6) {
  const spawn = HUB.spawn;
  const a = makePlayer("A", { gloveId, offhandId: "cotton", x: spawn.x, y: HUB.floorY, z: spawn.z });
  const b = makePlayer("B", { gloveId: "cotton", x: spawn.x, y: HUB.floorY, z: spawn.z - gap });
  face(a, b);
  face(b, a);
  const state = makeState([a, b]);
  state.phase = "hub";
  state.hub = { layout: HUB };
  return { state, a, b };
}

beforeEach(() => {
  registerGloves(null);
});

describe("扇击事件的 gloveId", () => {
  it("八掌各自命中：slap 事件与命中记录都报自己那只掌", () => {
    for (const id of GLOVE_IDS) {
      const { state, a } = duel(id, 1.6);
      const hits = resolveSlap(state, a, undefined, 0);
      expect(hits, `${id} 应该扇得到`).toHaveLength(1);
      expect(hits[0].gloveId, `${id} 的命中记录`).toBe(id);
      expect(hits[0].skillId).toBe(null);

      const ev = firstEvent(state, "slap");
      expect(ev, `${id} 没发 slap 事件`).toBeTruthy();
      expect(ev.gloveId).toBe(id);
      expect(ev.skillId).toBe(null);
      expect(ev.attackerId).toBe("A");
      expect(ev.targetId).toBe("B");
    }
  });

  it("空挥与前摇也带 gloveId：打空同样要有八掌可辨的掌风", () => {
    const { state, a } = duel("gale", 12);
    resolveSlap(state, a, undefined, 0);
    const whiff = firstEvent(state, "slapWhiff");
    expect(whiff.gloveId).toBe("gale");
    expect(whiff.skillId).toBe(null);

    const { state: s2, a: a2 } = duel("meteor", 12);
    beginSlap(s2, a2, undefined, 0);
    const windup = firstEvent(s2, "slapWindup");
    expect(windup.gloveId).toBe("meteor");
  });

  it("副掌槽出手报的是副掌，不是主掌", () => {
    const { state, a } = duel("cotton", 1.6, { a: { offhandId: "granite" } });
    a.activeSlot = 1;
    const hits = resolveSlap(state, a, undefined, 0);
    expect(hits[0].gloveId).toBe("granite");
    expect(firstEvent(state, "slap").gloveId).toBe("granite");
  });
});

describe("技能事件的 gloveId 与 skillId", () => {
  it("七只有主动技的掌：skillCast 带 gloveId + handler skillId", () => {
    for (const id of GLOVE_IDS) {
      const skillId = normalizeSkillId(FALLBACK_GLOVE_BY_ID[id].skillId);
      const { state, a } = duel(id, 2.5);
      const res = resolveSkill(state, a, undefined, 0);
      if (skillId === "none") {
        expect(res.ok, "木棉没有主动技").toBe(false);
        continue;
      }
      expect(res.ok, `${id} 的 ${skillId} 没放出来`).toBe(true);

      const cast = firstEvent(state, "skillCast");
      expect(cast, `${id} 没发 skillCast`).toBeTruthy();
      expect(cast.gloveId).toBe(id);
      expect(cast.skillId).toBe(skillId);

      for (const hit of res.hits) {
        expect(hit.gloveId, `${id} 的技能命中`).toBe(id);
        expect(hit.skillId).toBe(skillId);
      }
      for (const ev of eventsOfType(state, "skillHit")) {
        expect(ev.gloveId).toBe(id);
        expect(ev.skillId).toBe(skillId);
      }
    }
  });

  it("磐石砸地 / 冰霜霜弧：命中事件逐条带掌", () => {
    for (const [id, skillId] of [
      ["granite", "groundPound"],
      ["frost", "frostArc"],
      ["magnet", "magnetPull"],
    ]) {
      const { state, a } = duel(id, 3);
      const res = resolveSkill(state, a, undefined, 0);
      expect(res.hits.length).toBeGreaterThan(0);
      expect(res.hits.every((h) => h.gloveId === id && h.skillId === skillId)).toBe(true);
      expect(eventsOfType(state, "skillHit").every((e) => e.gloveId === id)).toBe(true);
    }
  });

  it("疾风冲刺的接触命中（延迟结算）也带 gale", () => {
    const { state, a, b } = duel("gale", 4);
    resolveSkill(state, a, undefined, 0);
    advance(state, 0.35, {}, [b]);
    const hits = eventsOfType(state, "skillHit").filter((e) => e.skillId === "dashSlap");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((e) => e.gloveId === "gale")).toBe(true);
  });

  it("陨掌落地：meteorImpact 与落地命中都带 meteor + meteorSlam", () => {
    const { state, a, b } = duel("meteor", 2.5);
    resolveSkill(state, a, undefined, 0);
    advance(state, 1.2, {}, [b]);

    const impact = firstEvent(state, "meteorImpact");
    expect(impact).toBeTruthy();
    expect(impact.gloveId).toBe("meteor");
    expect(impact.skillId).toBe("meteorSlam");
    const hits = eventsOfType(state, "skillHit").filter((e) => e.skillId === "meteorSlam");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((e) => e.gloveId === "meteor")).toBe(true);
  });

  it("残影假掌：ghostSlap 带 afterimage + blinkSwap", () => {
    const { state, a } = duel("afterimage", 2);
    a.awakenedT = AWAKEN.duration;
    resolveSkill(state, a, undefined, 0);
    advance(state, 0.6);

    const ghostSlap = firstEvent(state, "ghostSlap");
    expect(ghostSlap).toBeTruthy();
    expect(ghostSlap.gloveId).toBe("afterimage");
    expect(ghostSlap.skillId).toBe("blinkSwap");
  });

  it("弹反：gloveId 是弹反者的掌，来袭掌另记一列", () => {
    const { state, a, b } = duel("cotton", 1.6, { b: { gloveId: "spring" } });
    resolveSkill(state, b, undefined, 0);
    resolveSlap(state, a, undefined, 0.05);

    const parry = firstEvent(state, "parry");
    expect(parry).toBeTruthy();
    expect(parry.parrierId).toBe("B");
    expect(parry.gloveId).toBe("spring");
    expect(parry.skillId).toBe("parry");
    expect(parry.attackerGloveId).toBe("cotton");
  });

  it("觉醒起落：awaken / awakenEnd 报的是觉醒时那只掌", () => {
    const { state, a } = duel("frost", 1.6);
    a.meter = 1;
    tickStatuses(state, 1 / 60);
    const awaken = firstEvent(state, "awaken");
    expect(awaken).toBeTruthy();
    expect(awaken.gloveId).toBe("frost");

    // 觉醒中途换掌，落幕仍按起手那只掌收尾（特效首尾必须是同一套）
    a.gloveId = "cotton";
    for (let i = 0; i < Math.ceil(AWAKEN.duration * 60) + 2; i++) {
      state.t += 1 / 60;
      tickStatuses(state, 1 / 60);
    }
    const end = firstEvent(state, "awakenEnd");
    expect(end).toBeTruthy();
    expect(end.gloveId).toBe("frost");
  });
});

describe("gloveId 取自出招那一刻，不按事件类型猜", () => {
  it("陨掌起跳后换掌，落地事件仍报起跳时的掌", () => {
    const { state, a, b } = duel("meteor", 2.5, { a: { offhandId: "cotton" } });
    resolveSkill(state, a, undefined, 0);
    a.activeSlot = 1; // 空中换成木棉
    advance(state, 1.2, {}, [b]);

    expect(firstEvent(state, "meteorImpact").gloveId).toBe("meteor");
    const hits = eventsOfType(state, "skillHit").filter((e) => e.skillId === "meteorSlam");
    expect(hits.every((e) => e.gloveId === "meteor")).toBe(true);
  });

  it("换一张掌表：陨掌技能挂在别的掌上时，事件报的是那只掌而不是 'meteor'", () => {
    const gloveById = {
      ...FALLBACK_GLOVE_BY_ID,
      granite: { ...FALLBACK_GLOVE_BY_ID.granite, skillId: "meteorSlam" },
    };
    const { state, a, b } = duel("granite", 2.5, { state: { gloveById } });
    const res = resolveSkill(state, a, undefined, 0);
    expect(res.skillId).toBe("meteorSlam");
    expect(firstEvent(state, "skillCast").gloveId).toBe("granite");

    advance(state, 1.2, {}, [b]);
    expect(firstEvent(state, "meteorImpact").gloveId).toBe("granite");
    expect(firstEvent(state, "meteorImpact").skillId).toBe("meteorSlam");
  });

  it("换一张掌表：残影假掌挂在别的掌上时，ghostSlap 也跟着改口", () => {
    const gloveById = {
      ...FALLBACK_GLOVE_BY_ID,
      gale: { ...FALLBACK_GLOVE_BY_ID.gale, skillId: "blinkSwap" },
    };
    const { state, a } = duel("gale", 2, { state: { gloveById } });
    a.awakenedT = AWAKEN.duration;
    resolveSkill(state, a, undefined, 0);
    advance(state, 0.6);

    const ghostSlap = firstEvent(state, "ghostSlap");
    expect(ghostSlap).toBeTruthy();
    expect(ghostSlap.gloveId).toBe("gale");
    expect(state.combat.ghosts.every((gh) => gh.gloveId === "gale")).toBe(true);
  });
});

describe("整局扫描：没有一条分派事件缺 gloveId", () => {
  it("八掌各打三秒，VFX 事件全带合法 gloveId", () => {
    const seen = new Set();
    for (const id of GLOVE_IDS) {
      const { state, a, b } = duel(id, 2.2, { b: { gloveId: "spring" } });
      a.meter = 1; // 顺带把觉醒线也走一遍
      const inputs = { A: { slap: true, skill: true }, B: { skill: true } };
      advance(state, 3, inputs, [b]);

      for (const ev of state.events) {
        if (!VFX_EVENT_TYPES.includes(ev.type)) continue;
        seen.add(ev.type);
        expect(typeof ev.gloveId, `${id} 的 ${ev.type} 缺 gloveId`).toBe("string");
        expect(GLOVE_IDS, `${id} 的 ${ev.type} gloveId=${ev.gloveId} 不在词表里`).toContain(ev.gloveId);
      }
    }
    // 扫描确实覆盖到了主要几条线，而不是一条事件都没发
    for (const type of ["slap", "slapWhiff", "skillCast", "skillHit", "parry", "awaken"]) {
      expect(seen, `扫描没覆盖 ${type}`).toContain(type);
    }
  });
});

describe("残影：view.combat.ghosts 的源", () => {
  it("分身换位两端各留一具：ownerId / 位姿 / ttl+ttl0 / gloveId 齐全", () => {
    const { state, a, b } = duel("afterimage", 4);
    const pose = { x: a.x, z: a.z, yaw: a.yaw };
    const foePose = { x: b.x, z: b.z, yaw: b.yaw };

    const res = resolveSkill(state, a, undefined, 0);
    expect(res.ok).toBe(true);
    expect(res.ghostIds).toHaveLength(2);

    const ghosts = state.combat.ghosts;
    expect(ghosts).toHaveLength(2);
    for (const gh of ghosts) {
      expect(gh.gloveId).toBe("afterimage");
      expect(gh.ttl).toBeGreaterThan(0);
      expect(gh.ttl0).toBeGreaterThanOrEqual(gh.ttl);
      expect(Number.isFinite(gh.x + gh.y + gh.z + gh.yaw)).toBe(true);
    }
    // 位姿是「换位之前」的，且 yaw 还是 combat 自己的 +Z 基（换算归桥）
    expect(ghosts[0].ownerId).toBe("A");
    expect(ghosts[0].x).toBeCloseTo(pose.x, 6);
    expect(ghosts[0].z).toBeCloseTo(pose.z, 6);
    expect(ghosts[0].yaw).toBeCloseTo(pose.yaw, 6);
    expect(ghosts[1].ownerId).toBe("B");
    expect(ghosts[1].z).toBeCloseTo(foePose.z, 6);
  });

  it("无目标的短闪也留一具残影，留在起跳点", () => {
    const a = makePlayer("A", { gloveId: "afterimage", x: 1, z: -2, yaw: Math.PI / 3 });
    const state = makeState([a]);
    resolveSkill(state, a, undefined, 0);

    expect(state.combat.ghosts).toHaveLength(1);
    const [gh] = state.combat.ghosts;
    expect(gh.ownerId).toBe("A");
    expect(gh.gloveId).toBe("afterimage");
    expect(gh.x).toBeCloseTo(1, 6);
    expect(gh.z).toBeCloseTo(-2, 6);
    expect(gh.yaw).toBeCloseTo(Math.PI / 3, 6);
    expect(a.z).not.toBeCloseTo(-2, 3); // 人已经闪走了，残影留在原地
  });

  it("ttl 逐帧递减、ttl0 不动，寿命耗尽就出场", () => {
    const { state, a } = duel("afterimage", 4);
    resolveSkill(state, a, undefined, 0);
    const ttl0 = state.combat.ghosts[0].ttl0;
    expect(ttl0).toBeGreaterThan(0);

    tickStatuses(state, 0.25);
    expect(state.combat.ghosts[0].ttl).toBeLessThan(ttl0);
    expect(state.combat.ghosts[0].ttl0).toBe(ttl0);

    for (let i = 0; i < 60 * 3; i++) {
      state.t += 1 / 60;
      tickStatuses(state, 1 / 60);
    }
    expect(state.combat.ghosts).toHaveLength(0);
  });

  it("快照里塞回来的残影缺 ttl0：第一帧补上淡出基准，view 拿不到 ttl0 < ttl", () => {
    const { state, a } = duel("afterimage", 4);
    resolveSkill(state, a, undefined, 0); // 先把 state.combat 建出来
    // 存档 / structuredClone 回灌的老残影可能只有 ttl（ttl0 是后加的字段）
    state.combat.ghosts = [
      { id: "g-restored", ownerId: "A", gloveId: "afterimage", x: 1, y: 0, z: 2, yaw: 0, ttl: 0.9 },
    ];

    tickStatuses(state, 1 / 60);
    const [gh] = state.combat.ghosts;
    expect(gh.ttl0).toBe(0.9);
    expect(gh.ttl).toBeLessThan(gh.ttl0);
    expect(gh.ttl).toBeGreaterThan(0);
  });

  it("残影是纯 JSON，数量有上限", () => {
    const { state, a, b } = duel("afterimage", 4);
    for (let i = 0; i < GHOSTS.max * 2; i++) {
      a.cd = { slapAt: 0, skillAt: 0 };
      a.busyUntil = 0;
      a.statuses = [];
      b.statuses = [];
      resolveSkill(state, a, undefined, 0);
      face(a, b);
    }
    expect(state.combat.ghosts.length).toBeLessThanOrEqual(GHOSTS.max);
    expect(() => structuredClone(state)).not.toThrow();
  });
});

describe("安全区仍然一掌不接", () => {
  it("大厅里扇不出命中、不发事件、不留残影", () => {
    const { state, a, b } = hubDuel("granite", 1.6);
    const before = { x: b.x, z: b.z, vx: b.vx, vz: b.vz };

    for (let i = 0; i < 180; i++) {
      state.t += 1 / 60;
      expect(resolveSlap(state, a, undefined, state.t)).toHaveLength(0);
      tickStatuses(state, 1 / 60);
    }

    expect(state.events).toHaveLength(0);
    expect(b.x).toBe(before.x);
    expect(b.z).toBe(before.z);
    expect(b.vx).toBe(before.vx);
    expect(b.vz).toBe(before.vz);
    expect(state.combat ? state.combat.ghosts : []).toHaveLength(0);
  });

  it("大厅里放技能一律 no-op（分身也不许留残影）", () => {
    for (const id of GLOVE_IDS) {
      const { state, a } = hubDuel(id, 1.6);
      const res = resolveSkill(state, a, undefined, 0);
      expect(res.ok, `${id} 在大厅里放出来了`).toBe(false);
      expect(["hub", "no-skill"]).toContain(res.reason);
      expect(state.events).toHaveLength(0);
      expect(state.combat ? state.combat.ghosts : []).toHaveLength(0);
    }
  });

  it("大厅里觉醒不自动触发、状态原样冻着", () => {
    const { state, a } = hubDuel("frost", 1.6);
    a.meter = 1;
    applyStatus(a, "slow", 2, { mag: 0.4 });
    for (let i = 0; i < 120; i++) {
      state.t += 1 / 60;
      tickStatuses(state, 1 / 60);
    }
    expect(a.meter).toBe(1);
    expect(a.awakenedT || 0).toBe(0);
    expect(state.events.some((e) => e.type === "awaken")).toBe(false);
  });

  it("phase 是 hub 但人站在裂岛坐标上：照打不误（旧测 / harness 的老路子）", () => {
    const { state, a } = duel("granite", 1.6);
    state.phase = "hub";
    state.hub = { layout: HUB };
    const hits = resolveSlap(state, a, undefined, 0);
    expect(hits).toHaveLength(1);
    expect(hits[0].gloveId).toBe("granite");
  });
});

describe("回安全区：在飞的延迟结算不许落在走道上", () => {
  /**
   * 对局结束的回程（`src/sim/state.js` 的 enterHub）：phase 切 hub、人挪到走道出生点、
   * 速度清零。它**不**清 `state.combat` 的 pending / dashes——那是 combat 自己的暂存区，
   * 所以「出招在裂岛、结算在大厅」这一段只能由 combat 这边闸住。
   */
  function sendHome(state, p) {
    state.phase = "hub";
    state.hub = { layout: HUB };
    p.x = HUB.spawn.x;
    p.y = HUB.floorY;
    p.z = HUB.spawn.z;
    p.vx = 0;
    p.vy = 0;
    p.vz = 0;
    state.events.length = 0;
  }

  /** 只推 combat 的钟：位移归宿主，这里盯的是 combat 往人身上写了什么。 */
  function tick(state, seconds) {
    for (let i = 0; i < Math.round(seconds * 60); i++) {
      state.t += 1 / 60;
      tickStatuses(state, 1 / 60);
    }
  }

  it("疾风冲刺途中回程：不再往身上写冲刺速度，冲刺记录当场作废", () => {
    const { state, a } = duel("gale", 4);
    expect(resolveSkill(state, a, undefined, 0).ok).toBe(true);
    expect(state.combat.dashes).toHaveLength(1);
    expect(a.dashing).toBe(true);

    sendHome(state, a);
    tick(state, 1);

    // 闸不住的话这里是 -22.7 m/s：人顶着冲刺速度从走道一头滑到另一头。
    expect(a.vx).toBe(0);
    expect(a.vz).toBe(0);
    expect(a.dashing).toBe(false);
    expect(state.combat.dashes).toHaveLength(0); // 作废，不是攒着等回裂岛再放
    expect(state.events).toHaveLength(0);
  });

  it("陨掌腾空途中回程：不在走道上砸坑、不发 meteorImpact、不把人按回地面", () => {
    const { state, a, b } = duel("meteor", 2.5, { state: { tiles: makeTiles(3, 8, 60) } });
    expect(resolveSkill(state, a, undefined, 0).ok).toBe(true);
    expect(state.combat.pending.map((q) => q.kind)).toEqual(["meteorSlam"]);

    sendHome(state, a);
    const foe = { vx: b.vx, vz: b.vz, impact: b.impact };
    tick(state, 2);

    expect(state.combat.pending).toHaveLength(0);
    expect(state.events).toHaveLength(0); // meteorImpact 是纯表现事件，O2 照着它在走道上画冲击波
    expect(a.vy).toBe(0); // 落地那一下会写 vy=-28
    expect(state.tiles.every((t) => !t.broken && t.hp === t.maxHp)).toBe(true);
    expect(b.vx).toBe(foe.vx);
    expect(b.vz).toBe(foe.vz);
    expect(b.impact).toBe(foe.impact);
  });

  it("残影假掌途中回程：留在裂岛上的对手不会被走道上的人补一掌", () => {
    const { state, a, b } = duel("afterimage", 2);
    a.awakenedT = AWAKEN.duration;
    expect(resolveSkill(state, a, undefined, 0).ok).toBe(true);

    const queued = state.combat.pending.filter((q) => q.kind === "ghostSlap");
    expect(queued).toHaveLength(1);
    // 残影留在裂岛上，对手就贴在它面前 0.8m —— 回程之前这一掌是实打实打得到的
    b.x = queued[0].x;
    b.z = queued[0].z + 0.8;
    b.vx = 0;
    b.vz = 0;
    b.impact = 0;
    b.invulnT = 0;
    b.statuses = [];

    sendHome(state, a);
    tick(state, 1);

    expect(state.combat.pending.some((q) => q.kind === "ghostSlap")).toBe(false);
    expect(state.events.some((e) => e.type === "ghostSlap")).toBe(false);
    expect(b.vx).toBe(0);
    expect(b.vz).toBe(0);
    expect(b.impact).toBe(0);
  });

  it("前摇里那一掌落在回程之后：人已经在走道上，掌就不落下", () => {
    const { state, a, b } = duel("granite", 1.6);
    expect(beginSlap(state, a, undefined, 0).ok).toBe(true);
    expect(state.combat.pending.map((q) => q.kind)).toEqual(["slap"]);

    sendHome(state, a);
    const foe = { vx: b.vx, vz: b.vz, impact: b.impact };
    tick(state, 1);

    expect(state.combat.pending).toHaveLength(0);
    expect(state.events).toHaveLength(0);
    expect(b.vx).toBe(foe.vx);
    expect(b.vz).toBe(foe.vz);
    expect(b.impact).toBe(foe.impact);
  });

  it("回程前留下的残影照常淡出，不会在走道上冻成一排", () => {
    const { state, a } = duel("afterimage", 4);
    expect(resolveSkill(state, a, undefined, 0).ok).toBe(true);
    const ttl0 = state.combat.ghosts[0].ttl0;
    expect(ttl0).toBeGreaterThan(0);

    sendHome(state, a);
    tickStatuses(state, 0.25);
    expect(state.combat.ghosts[0].ttl).toBeLessThan(ttl0);
    expect(state.combat.ghosts[0].ttl0).toBe(ttl0);

    tick(state, 3);
    expect(state.combat.ghosts).toHaveLength(0);
  });
});
