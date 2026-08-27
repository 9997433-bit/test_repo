// 视角轮的 Bot 侧不变量：lookMode 是**本机玩家**一个人的事。
//
// locked / free 只改壳层怎么把相机方位角换成 `Input.yaw`（`src/core/look.js`），
// sim 不感知（ADR-38），getView 也不透出这个字段。Bot 站在链路更下游：它只吃
// getView 的快照，认的角只有 `p.yaw` 这一个 sim 空间的值。
//
// 这份用例钉三件事：
//   1. getView 的快照上根本没有视角 / 相机字段（缺字段的那一支）；
//   2. 就算有人往快照上塞 lookMode / pitch / 相机角，think() 的输出一字不差
//      —— 单帧、整局、hub 期都不变（有字段的那一支）；
//   3. 没有这些字段时 think() 本身是稳的：同一 view + 同一 rng 出同一个输入。
//
// 朝向按 sim 冻结契约验：yaw=0 面向 -Z（`src/sim/math.js` 的 FACE）。

import { beforeEach, describe, expect, it } from "vitest";

import "../combat/index.js"; // 副作用：把真实战斗解算装进 sim
import { configureBots, resetBots, think } from "./bots.js";
import { createMatch, forwardX, forwardZ, getPlayer, getView, step } from "../sim/index.js";

const DT = 1 / 60;

function counter(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

/** 视角 / 相机字段的黑名单：这些名字一个都不该出现在 Bot 读的快照里。 */
const LOOK_KEYS = [
  "lookMode",
  "lookYaw",
  "cameraYaw",
  "simYaw",
  "pitch",
  "invertY",
  "look",
  "camera",
  "spectator",
];

/** 递归收集所有键名（数组下标不算键）。 */
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
 * 往快照上到处塞视角字段：顶层、config、每个 player，外加一整个相机块。
 * `mode` 为 null 时原样返回 —— 那就是「没有该字段」的对照支。
 */
function decorate(view, mode) {
  if (mode == null) return view;
  const v = structuredClone(view);
  const cameraYaw = mode === "free" ? 2.4331 : -1.1207;
  v.lookMode = mode;
  v.config.lookMode = mode;
  v.look = { yaw: cameraYaw, pitch: mode === "free" ? 0.42 : -0.18, lookMode: mode, invertY: mode === "free" };
  v.camera = { yaw: cameraYaw, pitch: 0.3, spectator: mode === "free" };
  v.spectator = mode === "free";
  for (const p of v.players) {
    p.lookMode = mode;
    p.lookYaw = cameraYaw;
    p.cameraYaw = cameraYaw;
    p.pitch = mode === "free" ? 0.42 : -0.18;
  }
  return v;
}

function match(seed = 700, botCount = 3) {
  return createMatch({ seed, gloveId: "cotton", offhandId: "spring", botCount, phase: "arena" });
}

function botIds(state) {
  return state.players.filter((p) => p.kind === "bot").map((p) => p.id);
}

/** 整局跑完的可比指纹：位置 / 朝向 / 战绩 —— 视角字段不该动其中任何一个。 */
function fingerprint(state) {
  return {
    players: state.players.map((p) => ({ id: p.id, x: p.x, y: p.y, z: p.z, yaw: p.yaw, kills: p.kills, deaths: p.deaths })),
    stats: { ...state.stats },
  };
}

/** 三只 Bot 互殴 seconds 秒，每帧把 `mode` 塞进它们看到的快照。 */
function runMatch(mode, { seed = 700, seconds = 5, rngSeed = 7 } = {}) {
  resetBots();
  const state = match(seed);
  const ids = botIds(state);
  const rng = counter(rngSeed);
  const emitted = [];
  for (let i = 0; i < Math.round(seconds / DT); i++) {
    const view = decorate(getView(state), mode);
    const inputs = {};
    for (const id of ids) {
      inputs[id] = think(view, id, rng);
      emitted.push({ ...inputs[id] });
    }
    step(state, inputs, DT);
  }
  return { emitted, end: fingerprint(state) };
}

beforeEach(() => {
  resetBots();
  configureBots({ moveSpace: "local", autoDetectMoveSpace: true, reactionJitter: 0.12 });
});

describe("Bot 不感知 lookMode", () => {
  it("getView 的快照里压根没有视角 / 相机字段：Bot 想读也无从读起", () => {
    for (const phase of ["hub", "arena"]) {
      const state = createMatch({ seed: 701, botCount: 3, phase, unlocked: "all" });
      step(state, {}, DT);
      const present = LOOK_KEYS.filter((k) => allKeys(getView(state)).has(k));
      expect(present, `phase=${phase} 的快照透出了视角字段`).toEqual([]);
    }
  });

  it("think() 的输出里也没有视角字段：Input 就是 sim 那八个键", () => {
    const state = match(702, 1);
    const inp = think(getView(state), botIds(state)[0], counter(3));
    expect(Object.keys(inp).sort()).toEqual(
      ["dash", "jump", "moveX", "moveZ", "skill", "slap", "switchGlove", "yaw"],
    );
  });

  it("同一 view 下把 lookMode 从 locked 改成 free：三只 Bot 单帧输出一字不差", () => {
    const state = match(703);
    const view = getView(state);
    for (const id of botIds(state)) {
      resetBots();
      const bare = think(view, id, counter(11));
      resetBots();
      const locked = think(decorate(view, "locked"), id, counter(11));
      resetBots();
      const free = think(decorate(view, "free"), id, counter(11));
      expect(locked, `${id} locked`).toEqual(bare);
      expect(free, `${id} free`).toEqual(bare);
    }
  });

  it("整局 5 秒逐帧塞 lookMode：每一帧的输入与最终局面都对得上", () => {
    const bare = runMatch(null);
    const locked = runMatch("locked");
    const free = runMatch("free");

    expect(locked.emitted).toEqual(bare.emitted);
    expect(free.emitted).toEqual(bare.emitted);
    expect(locked.end).toEqual(bare.end);
    expect(free.end).toEqual(bare.end);
    // 这一局确实打起来了，不是「两边都空转所以相等」。看的是 Bot 自己的输出
    // （走位 / 起手 / 转向都有），不拿场上战绩当哨兵 —— 那是配平的事，不是视角的事。
    expect(bare.emitted.filter((inp) => inp.slap).length).toBeGreaterThan(20);
    expect(bare.emitted.some((inp) => Math.hypot(inp.moveX, inp.moveZ) > 0.5)).toBe(true);
    expect(new Set(bare.emitted.map((inp) => inp.yaw)).size).toBeGreaterThan(50);
    expect(bare.end.stats.hits).toBeGreaterThan(0);
  });

  it("emit 的 yaw 始终是 sim 空间的角：塞进相机角也照样对着人", () => {
    const state = match(704, 1);
    const bot = state.players.find((p) => p.kind === "bot");
    const human = getPlayer(state, "p0");
    bot.x = 0;
    bot.z = 0;
    bot.yaw = 0;

    for (const [tx, tz] of [
      [4, 0],
      [-4, 0],
      [0, 4],
      [0, -4],
    ]) {
      human.x = tx;
      human.z = tz;
      const view = getView(state);
      for (const mode of [null, "locked", "free"]) {
        resetBots();
        const { yaw } = think(decorate(view, mode), bot.id, counter(17));
        const len = Math.hypot(tx, tz);
        const dot = forwardX(yaw) * (tx / len) + forwardZ(yaw) * (tz / len);
        expect(dot, `目标在 (${tx},${tz})，lookMode=${mode}`).toBeGreaterThan(0.9);
      }
    }
  });

  it("hub 期不吃视角字段的影响：塞了 free 也还是零输入", () => {
    const state = createMatch({ seed: 705, botCount: 3, phase: "hub", unlocked: "all" });
    const ids = botIds(state);
    const rng = counter(23);
    for (let i = 0; i < 120; i++) {
      const view = decorate(getView(state), i % 2 === 0 ? "free" : "locked");
      const inputs = {};
      for (const id of ids) {
        const inp = think(view, id, rng);
        inputs[id] = inp;
        expect(inp).toMatchObject({
          moveX: 0,
          moveZ: 0,
          slap: false,
          skill: false,
          switchGlove: false,
          dash: false,
          jump: false,
        });
      }
      step(state, inputs, DT);
    }
    expect(state.stats).toMatchObject({ slaps: 0, hits: 0, kos: 0 });
  });
});

describe("没有视角字段时 Bot 输出仍然稳定", () => {
  it("同一 view + 同一 rng 种子，两次 think 完全一致", () => {
    const state = match(706);
    const view = getView(state);
    for (const id of botIds(state)) {
      resetBots();
      const first = think(view, id, counter(5));
      resetBots();
      const second = think(view, id, counter(5));
      expect(second, id).toEqual(first);
    }
  });

  it("整局重跑两遍：逐帧输入与最终局面都可复现", () => {
    const a = runMatch(null, { seed: 707, rngSeed: 13 });
    const b = runMatch(null, { seed: 707, rngSeed: 13 });
    expect(b.emitted).toEqual(a.emitted);
    expect(b.end).toEqual(a.end);
  });
});
