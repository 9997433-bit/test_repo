import { describe, expect, it, beforeEach } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  AWAKEN,
  applyAwaken,
  applyStatus,
  beginSlap,
  canSlap,
  effectiveGlove,
  registerGloves,
  resolveSkill,
  resolveSlap,
  statusSnapshot,
  steerDash,
  tickStatuses,
} from "./index.js";
import { FALLBACK_GLOVE_BY_ID } from "./constants.js";
import { makePlayer, makeState, makeTiles, stepSim } from "./testkit.js";
import { forwardFromYaw } from "./util.js";

const HERE = dirname(fileURLToPath(import.meta.url));

/** 让 a 面朝 b（yaw=0 面向 +Z 的约定）。 */
function face(a, b) {
  a.yaw = Math.atan2(b.x - a.x, b.z - a.z);
}

function duel(gloveId = "cotton", gap = 1.6, opts = {}) {
  const a = makePlayer("A", { gloveId, x: 0, z: 0, ...(opts.a || {}) });
  const b = makePlayer("B", { gloveId: opts.bGlove || "cotton", x: 0, z: gap, ...(opts.b || {}) });
  face(a, b);
  face(b, a);
  const state = makeState([a, b], opts.state);
  return { state, a, b };
}

function speed(p) {
  return Math.hypot(p.vx, p.vz);
}

beforeEach(() => {
  registerGloves(null);
});

describe("模块纪律", () => {
  it("combat 与 ai 不 import three / 不碰 DOM", () => {
    const roots = [HERE, join(HERE, "..", "ai")];
    const banned = /(from\s+["']three|require\(["']three|\bdocument\.|\bwindow\.|localStorage)/;
    let checked = 0;
    for (const root of roots) {
      for (const f of readdirSync(root)) {
        if (!f.endsWith(".js") || f.endsWith(".test.js")) continue;
        const src = readFileSync(join(root, f), "utf8");
        expect(banned.test(src), `${f} 触碰了禁用依赖`).toBe(false);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(5);
  });

  it("战斗写入后 state 仍可 structuredClone（纯 JSON）", () => {
    const { state, a } = duel("meteor");
    resolveSkill(state, a, undefined, 0);
    resolveSlap(state, a, undefined, 0);
    tickStatuses(state, 1 / 60);
    expect(() => structuredClone(state)).not.toThrow();
  });
});

describe("resolveSlap 基础", () => {
  it("正面命中：返回 {id, impulse} 并把冲量写进目标速度", () => {
    const { state, a, b } = duel("cotton", 1.6);
    const hits = resolveSlap(state, a, FALLBACK_GLOVE_BY_ID.cotton, 0);
    expect(hits).toHaveLength(1);
    expect(hits[0].id).toBe("B");
    expect(hits[0].impulse.x).toBeCloseTo(0, 5);
    expect(hits[0].impulse.z).toBeGreaterThan(4);
    expect(b.vz).toBeCloseTo(hits[0].impulse.z, 6);
    expect(b.vy).toBeGreaterThan(0);
  });

  it("超出射程 / 不在扇形里都不命中，并产生 slapWhiff", () => {
    const far = duel("cotton", 6);
    expect(resolveSlap(far.state, far.a, undefined, 0)).toHaveLength(0);
    expect(far.state.events.some((e) => e.type === "slapWhiff")).toBe(true);

    const back = duel("cotton", 1.6);
    back.a.yaw += Math.PI;
    expect(resolveSlap(back.state, back.a, undefined, 0)).toHaveLength(0);
  });

  it("判定是横着的一片扇形：左右张得开，上下只由高度闸门管（与横扇动画同形）", () => {
    // 木棉 slapAngleDeg 100 → 半角 50°，slapRange 2.6 + playerRadius，HIT.reachHeight 2.2。
    // A 站原点、yaw=0（combat 内部约定 = 面向 +Z），目标绕着他摆在扇面上。
    const shot = (deg, dy = 0, dist = 1.6) => {
      const rad = (deg * Math.PI) / 180;
      const a = makePlayer("A", { gloveId: "cotton", x: 0, z: 0, yaw: 0 });
      const b = makePlayer("B", {
        gloveId: "cotton",
        x: Math.sin(rad) * dist,
        z: Math.cos(rad) * dist,
        y: dy,
      });
      return resolveSlap(makeState([a, b]), a, undefined, 0);
    };

    // 横向：正前方与左右各 45° 都在扇面里 —— 一整片横着扫过去
    for (const deg of [-45, -25, 0, 25, 45]) {
      expect(shot(deg), `${deg}°`).toHaveLength(1);
    }
    // 出了张角就打不到：扇面横向是有边的，不是一圈
    for (const deg of [-70, 70, 180]) {
      expect(shot(deg), `${deg}°`).toHaveLength(0);
    }
    // 纵向：同一片扇面里，脚下与齐胸都照打；人窜到三米高就够不着 ——
    // 判定从来不是「从脚扫到头」的竖锥，改成横扇不需要动它
    expect(shot(30, 0)).toHaveLength(1);
    expect(shot(30, 1.4)).toHaveLength(1);
    expect(shot(0, 3)).toHaveLength(0);
    expect(shot(0, -3)).toHaveLength(0);
  });

  it("冷却期内重复调用返回空数组", () => {
    const { state, a } = duel("cotton", 1.6);
    expect(resolveSlap(state, a, undefined, 0)).toHaveLength(1);
    expect(canSlap(state, a, undefined, 0.1)).toBe(false);
    expect(resolveSlap(state, a, undefined, 0.1)).toHaveLength(0);
    expect(resolveSlap(state, a, undefined, 0.6)).toHaveLength(1);
  });

  it("贴脸比够到边缘更疼", () => {
    const close = duel("cotton", 0.9);
    const edge = duel("cotton", 2.5);
    const hClose = resolveSlap(close.state, close.a, undefined, 0)[0];
    const hEdge = resolveSlap(edge.state, edge.a, undefined, 0)[0];
    expect(hClose.power).toBeGreaterThan(hEdge.power);
  });

  it("背后命中有加成，且被扇越多飞得越远", () => {
    const front = duel("cotton", 1.6);
    const behind = duel("cotton", 1.6);
    behind.b.yaw = behind.a.yaw; // B 背对 A
    const hf = resolveSlap(front.state, front.a, undefined, 0)[0];
    const hb = resolveSlap(behind.state, behind.a, undefined, 0)[0];
    expect(hb.power).toBeGreaterThan(hf.power);
    expect(behind.b.impact).toBeGreaterThan(0);

    const again = resolveSlap(behind.state, behind.a, undefined, 1.0)[0];
    expect(Math.hypot(again.impulse.x, again.impulse.z)).toBeGreaterThan(Math.hypot(hb.impulse.x, hb.impulse.z));
  });

  it("无敌 / 阵亡目标不吃刀", () => {
    const { state, a, b } = duel("cotton", 1.6);
    applyStatus(b, "invuln", 1);
    expect(resolveSlap(state, a, undefined, 0)).toHaveLength(0);
    b.statuses = [];
    b.invulnT = 0;
    b.alive = false;
    expect(resolveSlap(state, a, undefined, 1)).toHaveLength(0);
  });

  it("beginSlap 走前摇：先进冷却，windup 之后才由 tickStatuses 判定命中", () => {
    const { state, a, b } = duel("granite", 1.8);
    const started = beginSlap(state, a, undefined, 0);
    expect(started.ok).toBe(true);
    expect(b.vz).toBe(0);
    let hits = [];
    for (let i = 0; i < 20 && hits.length === 0; i++) {
      state.t = (i + 1) / 60;
      hits = tickStatuses(state, 1 / 60).hits;
    }
    expect(hits).toHaveLength(1);
    expect(state.t).toBeGreaterThanOrEqual(FALLBACK_GLOVE_BY_ID.granite.windup);
    expect(b.vz).toBeGreaterThan(0);
  });
});

describe("掌意与觉醒", () => {
  it("命中加掌意（打人 6% / 挨打 9%），满条进 8s 觉醒并放大 range/power", () => {
    const { state, a, b } = duel("cotton", 1.6);
    resolveSlap(state, a, undefined, 0);
    expect(a.meter).toBeCloseTo(0.06, 6);
    expect(b.meter).toBeCloseTo(0.09, 6);

    a.meter = 1;
    const base = FALLBACK_GLOVE_BY_ID.cotton;
    const g = applyAwaken(a, base);
    expect(a.awakenedT).toBe(AWAKEN.duration);
    expect(a.meter).toBe(0);
    expect(g.slapRange).toBeCloseTo(base.slapRange * AWAKEN.rangeMul, 6);
    expect(g.slapPower).toBeCloseTo(base.slapPower * AWAKEN.powerMul, 6);
    expect(g.slapCooldown).toBeLessThan(base.slapCooldown);
  });

  it("觉醒 8s 后自动退档并发 awakenEnd", () => {
    const { state, a } = duel("cotton");
    a.meter = 1;
    applyAwaken(a, FALLBACK_GLOVE_BY_ID.cotton);
    for (let i = 0; i < 60 * 9; i++) {
      state.t += 1 / 60;
      tickStatuses(state, 1 / 60);
    }
    expect(a.awakenedT).toBe(0);
    expect(a.awakened).toBe(false);
    expect(state.events.some((e) => e.type === "awakenEnd")).toBe(true);
    expect(effectiveGlove(state, a).slapPower).toBeCloseTo(FALLBACK_GLOVE_BY_ID.cotton.slapPower, 6);
  });

  it("木棉觉醒：第 3 下强击退（2.2 倍 + 抬飞）", () => {
    const { state, a, b } = duel("cotton", 1.4);
    a.awakenedT = AWAKEN.duration;
    const mags = [];
    for (let i = 0; i < 3; i++) {
      b.vx = 0;
      b.vz = 0;
      b.vy = 0;
      b.impact = 0;
      const h = resolveSlap(state, a, undefined, i * 0.5)[0];
      mags.push(Math.hypot(h.impulse.x, h.impulse.z));
      expect(!!h.thirdHit).toBe(i === 2);
    }
    expect(mags[2]).toBeGreaterThan(mags[1] * 2);
    expect(b.vy).toBeGreaterThan(5);
  });
});

describe("八掌主动技", () => {
  it("木棉没有主动技", () => {
    const { state, a } = duel("cotton");
    const res = resolveSkill(state, a, undefined, 0);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("no-skill");
  });

  it("磐石砸地：范围击飞 + 砸裂台面子块", () => {
    const tiles = makeTiles(2.5, 6, 30);
    const { state, a, b } = duel("granite", 3.2, { state: { tiles } });
    const res = resolveSkill(state, a, undefined, 0);
    expect(res.ok).toBe(true);
    expect(res.skillId).toBe("groundPound");
    expect(res.hits).toHaveLength(1);
    expect(b.vy).toBeGreaterThan(3);
    expect(speed(b)).toBeGreaterThan(4);
    expect(res.tiles.length).toBeGreaterThan(0);
    expect(state.tiles.some((t) => t.broken)).toBe(true);
    expect(state.events.some((e) => e.type === "tileBreak")).toBe(true);
  });

  it("磐石觉醒：范围与碎地伤害都更高", () => {
    const base = duel("granite", 3.2, { state: { tiles: makeTiles(4.5, 6, 200) } });
    const awake = duel("granite", 3.2, { state: { tiles: makeTiles(4.5, 6, 200) } });
    awake.a.awakenedT = AWAKEN.duration;
    const r1 = resolveSkill(base.state, base.a, undefined, 0);
    const r2 = resolveSkill(awake.state, awake.a, undefined, 0);
    expect(r2.radius).toBeGreaterThan(r1.radius);
    const hp1 = base.state.tiles.reduce((s, t) => s + t.hp, 0);
    const hp2 = awake.state.tiles.reduce((s, t) => s + t.hp, 0);
    expect(hp2).toBeLessThan(hp1);
  });

  it("疾风冲刺扇：途中撞到人自动命中，结束后退出冲刺", () => {
    const { state, a, b } = duel("gale", 5, { a: { gloveId: "gale" } });
    const res = resolveSkill(state, a, undefined, 0);
    expect(res.ok).toBe(true);
    expect(Math.hypot(a.vx, a.vz)).toBeCloseTo(26, 3);
    let hits = [];
    for (let i = 0; i < 30; i++) {
      state.t += 1 / 60;
      const out = tickStatuses(state, 1 / 60);
      hits = hits.concat(out.hits);
      a.x += a.vx / 60;
      a.z += a.vz / 60;
    }
    expect(hits.some((h) => h.id === "B" && h.skillId === "dashSlap")).toBe(true);
    expect(a.dashing).toBe(false);
  });

  it("疾风觉醒可中途改向一次", () => {
    const { state, a } = duel("gale", 12);
    a.awakenedT = AWAKEN.duration;
    resolveSkill(state, a, undefined, 0);
    expect(steerDash(state, "A", Math.PI / 2, 0.05)).toBe(true);
    expect(steerDash(state, "A", 0, 0.06)).toBe(false);
    tickStatuses(state, 1 / 60);
    expect(a.vx).toBeGreaterThan(20);
  });

  it("冰霜霜弧：减速 45%/2.2s；觉醒先冻 0.8s", () => {
    const { state, a, b } = duel("frost", 4);
    const res = resolveSkill(state, a, undefined, 0);
    expect(res.ok).toBe(true);
    tickStatuses(state, 1 / 60);
    expect(b.moveScale).toBeCloseTo(0.55, 5);
    expect(b.frozen).toBe(false);
    expect(statusSnapshot(b).some((s) => s.kind === "slow")).toBe(true);

    const aw = duel("frost", 4);
    aw.a.awakenedT = AWAKEN.duration;
    resolveSkill(aw.state, aw.a, undefined, 0);
    tickStatuses(aw.state, 1 / 60);
    expect(aw.b.frozen).toBe(true);
    expect(aw.b.moveScale).toBe(0);
    expect(aw.b.canAct).toBe(false);
    expect(resolveSlap(aw.state, aw.b, undefined, 0)).toHaveLength(0);
  });

  it("状态到期自动清除", () => {
    const { state, a, b } = duel("frost", 4);
    resolveSkill(state, a, undefined, 0);
    for (let i = 0; i < 60 * 3; i++) {
      state.t += 1 / 60;
      tickStatuses(state, 1 / 60);
    }
    expect(b.statuses).toHaveLength(0);
    expect(b.moveScale).toBe(1);
  });

  it("弹簧反击：窗口期内挨打会把冲量弹回攻击者", () => {
    const { state, a, b } = duel("cotton", 1.5, { b: { gloveId: "spring" } });
    b.gloveId = "spring";
    const res = resolveSkill(state, b, undefined, 0);
    expect(res.ok).toBe(true);
    expect(b.parrying).toBe(true);

    const hits = resolveSlap(state, a, undefined, 0.1);
    expect(hits[0].parried).toBe(true);
    expect(hits[0].impulse.z).toBe(0);
    expect(b.vz).toBe(0);
    expect(a.vz).toBeLessThan(-5); // A 被弹开
    expect(b.meter).toBeGreaterThan(0.15);
    expect(state.events.some((e) => e.type === "parry")).toBe(true);
  });

  it("弹簧觉醒：弹回附带小跳；窗口过后不再挡", () => {
    const { state, a, b } = duel("cotton", 1.5, { b: { gloveId: "spring" } });
    b.gloveId = "spring";
    b.awakenedT = AWAKEN.duration;
    resolveSkill(state, b, undefined, 0);
    resolveSlap(state, a, undefined, 0.1);
    expect(b.vy).toBeGreaterThan(4);

    b.vy = 0;
    for (let i = 0; i < 60; i++) {
      state.t += 1 / 60;
      tickStatuses(state, 1 / 60);
    }
    expect(b.parrying).toBe(false);
    const late = resolveSlap(state, a, undefined, state.t);
    expect(late[0].parried).toBeUndefined();
  });

  it("分身：与身前敌人换位并留下残影", () => {
    const { state, a, b } = duel("afterimage", 4);
    const before = { ax: a.x, az: a.z, bx: b.x, bz: b.z };
    const res = resolveSkill(state, a, undefined, 0);
    expect(res.ok).toBe(true);
    expect(res.swappedWith).toBe("B");
    expect(a.z).toBeCloseTo(before.bz, 6);
    expect(b.z).toBeCloseTo(before.az, 6);
    // 换位两端各留一具残影（vfx.js afterimage.skill.ghosts.count = 2）：
    // 施法者的旧位姿一具、被换走那位的旧位姿一具，各自记在自己的 ownerId 上。
    expect(state.combat.ghosts).toHaveLength(2);
    expect(state.combat.ghosts.map((gh) => gh.ownerId)).toEqual(["A", "B"]);
    expect(state.combat.ghosts[0].z).toBeCloseTo(before.az, 6);
    expect(state.combat.ghosts[1].z).toBeCloseTo(before.bz, 6);
    expect(a.invulnT).toBeGreaterThan(0);
  });

  it("分身无目标时向前短闪，残影会过期", () => {
    const a = makePlayer("A", { gloveId: "afterimage", x: 0, z: 0, yaw: 0 });
    const state = makeState([a]);
    const res = resolveSkill(state, a, undefined, 0);
    expect(res.swappedWith).toBe(null);
    expect(a.z).toBeCloseTo(6, 3);
    for (let i = 0; i < 60 * 3; i++) {
      state.t += 1 / 60;
      tickStatuses(state, 1 / 60);
    }
    expect(state.combat.ghosts).toHaveLength(0);
  });

  it("分身觉醒：残影 0.45s 后假挥掌", () => {
    const { state, a } = duel("afterimage", 4);
    a.awakenedT = AWAKEN.duration;
    resolveSkill(state, a, undefined, 0);
    let ghostHits = [];
    for (let i = 0; i < 45; i++) {
      state.t += 1 / 60;
      ghostHits = ghostHits.concat(tickStatuses(state, 1 / 60).hits.filter((h) => h.kind === "ghost"));
    }
    expect(ghostHits.length).toBeGreaterThan(0);
    expect(state.events.some((e) => e.type === "ghostSlap")).toBe(true);
  });

  it("磁掌：把身前的人拽向自己", () => {
    const { state, a, b } = duel("magnet", 6);
    const res = resolveSkill(state, a, undefined, 0);
    expect(res.pulled).toEqual(["B"]);
    expect(b.vz).toBeLessThan(-6); // B 在 +Z，被拉向 -Z
    expect(b.sticky).not.toBe(true);
  });

  it("磁掌觉醒：拽 2 人并黏住", () => {
    const a = makePlayer("A", { gloveId: "magnet", x: 0, z: 0, yaw: 0, awakenedT: AWAKEN.duration });
    const b = makePlayer("B", { x: -1.5, z: 5 });
    const c = makePlayer("C", { x: 1.5, z: 7 });
    const state = makeState([a, b, c]);
    const res = resolveSkill(state, a, undefined, 0);
    expect(res.pulled.sort()).toEqual(["B", "C"]);
    tickStatuses(state, 1 / 60);
    expect(b.sticky).toBe(true);
    expect(b.moveScale).toBeCloseTo(0.65, 5);
    expect(c.sticky).toBe(true);
  });

  it("陨掌：自己腾空 + 0.85s 后砸下清场", () => {
    const { state, a, b } = duel("meteor", 4, { state: { tiles: makeTiles(3, 6, 40) } });
    const res = resolveSkill(state, a, undefined, 0);
    expect(res.ok).toBe(true);
    expect(res.pending).toBe(true);
    expect(a.vy).toBeCloseTo(14, 6);
    expect(a.invulnT).toBeGreaterThan(0);

    let out = { hits: [], tiles: [] };
    for (let i = 0; i < 60; i++) {
      state.t += 1 / 60;
      const r = tickStatuses(state, 1 / 60);
      if (r.hits.length) out = r;
    }
    expect(out.hits.some((h) => h.skillId === "meteorSlam")).toBe(true);
    expect(a.vy).toBeLessThan(-20);
    expect(speed(b)).toBeGreaterThan(6);
    expect(state.events.some((e) => e.type === "meteorImpact")).toBe(true);
  });

  it("陨掌觉醒：落地额外裂一圈台（内圈外的块也掉血）", () => {
    const outer = makeTiles(7, 10, 120);
    const { state, a } = duel("meteor", 30, { state: { tiles: outer } });
    a.awakenedT = AWAKEN.duration;
    resolveSkill(state, a, undefined, 0);
    for (let i = 0; i < 60; i++) {
      state.t += 1 / 60;
      tickStatuses(state, 1 / 60);
    }
    const ringHp = state.tiles.reduce((s, t) => s + t.hp, 0);
    expect(ringHp).toBeLessThan(10 * 120);
    expect(state.events.some((e) => e.type === "meteorImpact" && e.ring === true)).toBe(true);
  });

  it("技能进冷却后再按无效", () => {
    const { state, a } = duel("granite", 3);
    expect(resolveSkill(state, a, undefined, 0).ok).toBe(true);
    expect(resolveSkill(state, a, undefined, 1).reason).toBe("cooldown");
    expect(resolveSkill(state, a, undefined, 9.5).ok).toBe(true);
  });
});

describe("手套数据源", () => {
  it("registerGloves 注入的表优先于兜底常量", () => {
    registerGloves([{ ...FALLBACK_GLOVE_BY_ID.cotton, slapRange: 9, slapPower: 30 }]);
    const a = makePlayer("A", { gloveId: "cotton", z: 0 });
    const b = makePlayer("B", { x: 0, z: 7 });
    face(a, b);
    const state = { t: 0, players: [a, b], tiles: [], events: [] };
    const hits = resolveSlap(state, a, undefined, 0);
    expect(hits).toHaveLength(1);
    expect(hits[0].power).toBeGreaterThan(15);
  });

  it("八掌全部有主动技实现（木棉除外）且数值可用", () => {
    const ids = ["cotton", "granite", "gale", "frost", "spring", "afterimage", "magnet", "meteor"];
    const results = {};
    for (const id of ids) {
      const a = makePlayer("A", { gloveId: id, x: 0, z: 0, yaw: 0 });
      const b = makePlayer("B", { x: 0, z: 3 });
      const state = makeState([a, b], { tiles: makeTiles(3, 4, 60) });
      results[id] = resolveSkill(state, a, undefined, 0);
    }
    expect(results.cotton.ok).toBe(false);
    for (const id of ids.slice(1)) {
      expect(results[id].ok, `${id} 主动技未实现`).toBe(true);
      expect(results[id].skillId).toBe(FALLBACK_GLOVE_BY_ID[id].skillId);
    }
  });
});

describe("端到端：扇出岛", () => {
  it("连续重击可以把人打出台外并记击杀", () => {
    const a = makePlayer("A", { gloveId: "granite", x: 0, z: 16 });
    const b = makePlayer("B", { x: 0, z: 17.4 });
    face(a, b);
    const state = makeState([a, b], { arenaRadius: 20 });
    for (let i = 0; i < 60 * 8; i++) {
      face(a, b);
      stepSim(state, { A: { moveX: 0, moveZ: 0.4, yaw: a.yaw, slap: true } }, 1 / 60);
      if (!b.alive) break;
    }
    expect(b.alive).toBe(false);
    expect(a.kills).toBe(1);
    expect(b.deaths).toBe(1);
    expect(state.events.some((e) => e.type === "kill" && e.killerId === "A")).toBe(true);
  });
});
