// 视角轮的 combat 侧不变量。战斗层在视角这件事上只有一个立场：不参与。
//
// 钉四件事：
//   1. 扇击判定是一片**水平**锥 —— 只吃 yaw 与水平位移，俯仰 / 相机角 / lookMode
//      塞进来一个字节都不改命中；上下够不够得着只由 `HIT.reachHeight` 这一道高度闸管。
//   2. reach 数字冻结 —— 视角轮不许拿 slapRange / slapAngleDeg / reachHeight
//      去「修打不中」：打不中是朝向算错，不是够不着。
//   3. 空挥闸是 `playerInHub` 那道**空间**闸 —— combat 的 `inSafeZone` 与 sim 的
//      `playerInHub` 逐格同答案，退化成「phase==='hub' 就不打」是回归。
//   4. combat / ai 里没有相机代码 —— 观战 orbit 是 render 的活，战斗解算既不读
//      也不写任何相机字段，跑完一整套也不会在 state 上留下相机面。
//
// 朝向：本文件直接调 combat，按它内部的约定摆位（yaw=0 面向 +Z）。

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { GLOVE_BY_ID, inSafeZone, resolveSkill, resolveSlap, tickStatuses } from "./index.js";
import { ARENA, FALLBACK_GLOVE_BY_ID, HIT } from "./constants.js";
import { makePlayer, makeState, makeTiles, stepSim } from "./testkit.js";
import { createMatch, getPlayer, playerInHub } from "../sim/index.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const DT = 1 / 60;

/** 视角 / 相机字段的黑名单：战斗层既不读也不写。 */
const LOOK_KEYS = ["lookMode", "lookYaw", "cameraYaw", "simYaw", "pitch", "invertY", "look", "camera", "spectator"];

/** 一整套视角噪声。往攻方 / 守方 / state 上到处抹，命中结果必须纹丝不动。 */
const LOOK_NOISE = {
  lookMode: "free",
  lookYaw: -1.3117,
  cameraYaw: 2.4409,
  simYaw: 1.0203,
  pitch: 0.8721,
  invertY: true,
  spectator: true,
  look: { yaw: 2.4409, pitch: 0.8721, lookMode: "free" },
  camera: { yaw: 2.4409, pitch: 0.8721, distance: 6.5 },
};

function allKeys(node, out = new Set(), depth = 0) {
  if (!node || typeof node !== "object" || depth > 8) return out;
  if (Array.isArray(node)) {
    for (const item of node) allKeys(item, out, depth + 1);
    return out;
  }
  for (const [k, v] of Object.entries(node)) {
    out.add(k);
    allKeys(v, out, depth + 1);
  }
  return out;
}

/**
 * A 站原点朝 yaw=0（combat 内部 = 面向 +Z），B 摆在偏 `deg`、水平 `dist` 米、
 * 高差 `dy` 处。`noise` 非空时把视角字段抹到双方与 state 上。
 * 返回一份可直接比对的命中摘要（不是布尔，连力度与冲量都要一样）。
 */
function shot({ deg = 0, dist = 1.6, dy = 0, gloveId = "cotton", noise = null } = {}) {
  const rad = (deg * Math.PI) / 180;
  const a = makePlayer("A", { gloveId, x: 0, z: 0, yaw: 0 });
  const b = makePlayer("B", { gloveId: "cotton", x: Math.sin(rad) * dist, z: Math.cos(rad) * dist, y: dy });
  const state = makeState([a, b]);
  if (noise) {
    Object.assign(a, structuredClone(noise));
    Object.assign(b, structuredClone(noise));
    Object.assign(state, structuredClone(noise));
  }
  return resolveSlap(state, a, undefined, 0).map((h) => ({
    id: h.id,
    power: h.power,
    behind: h.behind,
    impulse: { ...h.impulse },
  }));
}

describe("扇击判定是水平锥，与视角无关", () => {
  it("俯仰 / 相机角 / lookMode 抹满全场，命中结果一字不差", () => {
    const seen = [];
    for (const deg of [-70, -50, -45, -25, 0, 25, 45, 50, 70]) {
      for (const dist of [1, 1.8, 2.6, 3.4]) {
        const bare = shot({ deg, dist });
        expect(shot({ deg, dist, noise: LOOK_NOISE }), `${deg}° @ ${dist}m`).toEqual(bare);
        seen.push(bare.length);
      }
    }
    // 采样里既有命中也有落空，比对才不是空转
    expect(seen).toContain(1);
    expect(seen).toContain(0);
  });

  it("高度闸只认 HIT.reachHeight：攻方指天指地都是同一条线", () => {
    expect(HIT.reachHeight).toBe(2.2);
    const up = { ...LOOK_NOISE, pitch: 1.4 };
    const down = { ...LOOK_NOISE, pitch: -1.4 };
    for (const noise of [null, up, down]) {
      const tag = noise ? `pitch=${noise.pitch}` : "无俯仰";
      expect(shot({ dy: 2.1, noise }), `${tag} 齐头够得着`).toHaveLength(1);
      expect(shot({ dy: -2.1, noise }), `${tag} 脚下够得着`).toHaveLength(1);
      expect(shot({ dy: 2.3, noise }), `${tag} 窜太高够不着`).toHaveLength(0);
      expect(shot({ dy: -2.3, noise }), `${tag} 掉太低够不着`).toHaveLength(0);
    }
  });

  it("横向张角只由 slapAngleDeg 定：木棉半角 50°，出了边就是空挥", () => {
    // 兜底表的木棉 slapAngleDeg=100 → 半角 50°
    expect(FALLBACK_GLOVE_BY_ID.cotton.slapAngleDeg).toBe(100);
    for (const deg of [-49, -25, 0, 25, 49]) expect(shot({ deg }), `${deg}°`).toHaveLength(1);
    for (const deg of [-51, 51, 90, 180]) expect(shot({ deg }), `${deg}°`).toHaveLength(0);
  });
});

/**
 * 生效手套表（`src/data/gloves.js` 覆到兜底常量上）的够得着数字。
 * 这张表是配平决定，不是「打不中」的止痛药：朝向算错该去修朝向，
 * 谁要改这里的数请连同 GDD 一起改，别在视角轮顺手加半米。
 */
const REACH_FREEZE = {
  cotton: { slapRange: 2.6, slapAngleDeg: 110 },
  granite: { slapRange: 2.9, slapAngleDeg: 75 },
  gale: { slapRange: 2.4, slapAngleDeg: 95 },
  frost: { slapRange: 2.6, slapAngleDeg: 90 },
  spring: { slapRange: 2.5, slapAngleDeg: 90 },
  afterimage: { slapRange: 2.5, slapAngleDeg: 100 },
  magnet: { slapRange: 2.7, slapAngleDeg: 85 },
  meteor: { slapRange: 2.8, slapAngleDeg: 80 },
};

describe("reach 数字冻结", () => {
  it("八只掌的 slapRange / slapAngleDeg 与高度闸都没动过", () => {
    expect(Object.keys(GLOVE_BY_ID).sort()).toEqual(Object.keys(REACH_FREEZE).sort());
    for (const [id, want] of Object.entries(REACH_FREEZE)) {
      expect({ slapRange: GLOVE_BY_ID[id].slapRange, slapAngleDeg: GLOVE_BY_ID[id].slapAngleDeg }, id).toEqual(want);
    }
    expect(HIT.reachHeight).toBe(2.2);
    expect(ARENA.playerRadius).toBe(0.7);
  });

  it("量出来的够得着就是 slapRange + playerRadius，一厘米不多", () => {
    const probe = (gloveId, dist) => {
      const a = makePlayer("A", { gloveId, x: 0, z: 0, yaw: 0 });
      const b = makePlayer("B", { gloveId: "cotton", x: 0, z: dist });
      return resolveSlap(makeState([a, b], { gloveById: GLOVE_BY_ID }), a, undefined, 0).length;
    };
    for (const [id, want] of Object.entries(REACH_FREEZE)) {
      const reach = want.slapRange + ARENA.playerRadius;
      expect(probe(id, reach - 0.02), `${id} 该够到 ${reach}m`).toBe(1);
      expect(probe(id, reach + 0.02), `${id} 不该够到 ${reach}m 以外`).toBe(0);
    }
  });
});

/** phase=hub 的一局，combat 与 sim 共用同一份 `state.hub.layout`。 */
function hubDuel(seed = 610) {
  const state = createMatch({ seed, botCount: 1, phase: "hub", unlocked: "all" });
  const a = getPlayer(state, "p0");
  const b = state.players.find((p) => p !== a);
  return { state, a, b };
}

/** 把两人摆到 (x,z)：B 站在 A 正前方 1.5m（combat 的 yaw=0 面向 +Z）。 */
function placePair(a, b, x, y, z) {
  for (const p of [a, b]) {
    p.y = y;
    p.vx = 0;
    p.vy = 0;
    p.vz = 0;
    p.invulnT = 0;
    p.statuses.length = 0;
    p.knockScale = 1;
    p.impact = 0;
  }
  a.x = x;
  a.z = z;
  a.yaw = 0;
  b.x = x;
  b.z = z + 1.5;
}

describe("空挥闸是 playerInHub 空间闸", () => {
  it("combat 的 inSafeZone 与 sim 的 playerInHub 逐格同答案", () => {
    const { state, a } = hubDuel(611);
    const walkway = { ...state.hub.layout.spawn };
    const spots = [
      ["走道里", walkway.x, walkway.y, walkway.z],
      ["裂岛圆心", 0, 0, 0],
      ["裂岛边上", 8, 0, -6],
    ];
    for (const phase of ["hub", "arena"]) {
      state.phase = phase;
      for (const [tag, x, y, z] of spots) {
        a.x = x;
        a.y = y;
        a.z = z;
        expect(inSafeZone(state, a), `phase=${phase} / ${tag}`).toBe(playerInHub(state, a));
      }
    }
  });

  it("phase=hub 但人站在裂岛坐标上：照常出手，闸门不是 phase 闸", () => {
    const { state, a, b } = hubDuel(612);
    placePair(a, b, 0, 0, 0);
    expect(state.phase).toBe("hub");
    expect(playerInHub(state, a)).toBe(false);
    expect(inSafeZone(state, a)).toBe(false);
    expect(resolveSlap(state, a, undefined, state.time)).toHaveLength(1);
  });

  it("人确实在走道体积里：整只不进战斗管线，连挥空事件都不发", () => {
    const { state, a, b } = hubDuel(613);
    const spawn = state.hub.layout.spawn;
    placePair(a, b, spawn.x, spawn.y, spawn.z);
    expect(playerInHub(state, a)).toBe(true);
    expect(inSafeZone(state, a)).toBe(true);

    state.events.length = 0;
    expect(resolveSlap(state, a, undefined, state.time)).toHaveLength(0);
    expect(resolveSkill(state, a, undefined, state.time).ok).toBe(false);
    expect(state.events.map((e) => e.type)).not.toContain("slapWhiff");
    expect(b.knockScale).toBe(1);
  });

  it("phase=arena 时走道体积不再护人：闸门跟着 phase ∧ 体积一起走", () => {
    const { state, a, b } = hubDuel(614);
    const spawn = state.hub.layout.spawn;
    placePair(a, b, spawn.x, spawn.y, spawn.z);
    state.phase = "arena";
    expect(playerInHub(state, a)).toBe(false);
    expect(inSafeZone(state, a)).toBe(false);
    expect(resolveSlap(state, a, undefined, state.time)).toHaveLength(1);
  });
});

/** 去掉注释，只留可执行的那部分源码。 */
function codeOnly(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
}

describe("战斗层不碰相机", () => {
  it("combat / ai 的源码里没有相机 / 视角面：观战机位归 render 管", () => {
    const banned = /\b(lookMode|lookYaw|cameraYaw|setLook|snapCamera|spectator|PerspectiveCamera|pitch)\b/;
    let checked = 0;
    for (const root of [HERE, join(HERE, "..", "ai")]) {
      for (const f of readdirSync(root)) {
        if (!f.endsWith(".js") || f.endsWith(".test.js")) continue;
        const code = codeOnly(readFileSync(join(root, f), "utf8"));
        expect(banned.test(code), `${f} 里出现了相机 / 视角字段`).toBe(false);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(5);
  });

  it("跑完一整套战斗也不在 state 上留下相机字段", () => {
    const a = makePlayer("A", { gloveId: "meteor", x: 0, z: 0, yaw: 0 });
    const b = makePlayer("B", { gloveId: "gale", x: 0, z: 1.6, yaw: Math.PI });
    const state = makeState([a, b], { tiles: makeTiles() });
    resolveSlap(state, a, undefined, 0);
    resolveSkill(state, a, undefined, 0);
    for (let i = 0; i < 180; i++) {
      stepSim(state, { A: { slap: i % 20 === 0, moveZ: 0.4 }, B: { slap: i % 25 === 0, moveZ: -0.4 } }, DT);
    }
    tickStatuses(state, DT);
    expect(state.events.length).toBeGreaterThan(0);
    expect(LOOK_KEYS.filter((k) => allKeys(state).has(k))).toEqual([]);
  });
});
