// 视角轮 Round 2 的 Bot 侧硬门：**think() 送出去的 `yaw` 帧帧是有限数**。
//
// Round 2 之后玩家那一路的 `Input.yaw` 可以是 `null` —— free（自由视角）静止帧不写朝向，
// sim 把「非有限值」读作「保持当前朝向」（`src/sim/step.js` 的 ZERO_INPUT 注释、ADR-38）。
// 那个口子是给**本机玩家**开的。Bot 站在另一条路上：它没有相机，没有 lookMode，
// 唯一的朝向来源是快照里的 `p.yaw` 与目标的相对位置。
//
// 于是多出一条以前没有的失效模式：Bot 漏一个 null / NaN 出去，sim 不报错、不告警，
// 只是从此不再给这只 Bot 转身 —— 表现成「它站着不动，每一掌都扇向旧朝向」，
// 也就是 Round 1 那条「打别人打不到」的另一副面孔。所以这里把两件事一起钉死：
//
//   1. think() 的每一条返回路径（hub / 无人可打 / 已出局 / 不认识的 id / 空快照 /
//      被写坏的快照 / 病态随机源）都给有限的 yaw、有限的 moveX/moveZ；
//   2. 本机玩家真的用 free 采样（`input.sample()` 帧帧可能返回 `yaw: null`）跑一整局时，
//      Bot 那一路照旧：yaw 帧帧有限、身照转、掌照扇；快照上再挂 lookMode / 相机角，
//      逐帧输入与终局一字不差（R1 的「Bot 不感知 lookMode」在 free 落地后复验一遍）。
//
// 朝向按 sim 冻结契约验：yaw=0 面向 -Z（`src/sim/math.js` 的 FACE）。

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import "../combat/index.js"; // 副作用：把真实战斗解算装进 sim
import { configureBots, resetBots, think } from "./bots.js";
import { createInput } from "../input/index.js";
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

/** input 层只用得到 addEventListener / removeEventListener，这里给个最小替身。 */
function fakeNode() {
  const handlers = new Map();
  return {
    addEventListener(type, fn) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      handlers.get(type)?.delete(fn);
    },
    emit(type, event = {}) {
      for (const fn of handlers.get(type) || []) fn({ preventDefault() {}, ...event });
    },
  };
}

function arena(seed = 810, botCount = 3) {
  return createMatch({ seed, gloveId: "cotton", offhandId: "spring", botCount, phase: "arena" });
}

function botIds(state) {
  return state.players.filter((p) => p.kind === "bot").map((p) => p.id);
}

/** 一帧 Bot 输入的形状闸：yaw 不许是 null / NaN / ±Infinity，位移也一样。 */
function expectFinite(inp, tag) {
  expect(inp.yaw, `${tag}: yaw = ${String(inp.yaw)}`).not.toBeNull();
  expect(typeof inp.yaw, `${tag}: yaw 的类型`).toBe("number");
  expect(Number.isFinite(inp.yaw), `${tag}: yaw = ${String(inp.yaw)}`).toBe(true);
  expect(Number.isFinite(inp.moveX), `${tag}: moveX = ${String(inp.moveX)}`).toBe(true);
  expect(Number.isFinite(inp.moveZ), `${tag}: moveZ = ${String(inp.moveZ)}`).toBe(true);
}

/** 往快照上到处挂视角字段；`mode` 为 null 时原样返回（对照支）。 */
function decorate(view, mode) {
  if (mode == null) return view;
  const v = structuredClone(view);
  const cameraYaw = mode === "free" ? 2.4331 : -1.1207;
  v.lookMode = mode;
  v.config.lookMode = mode;
  v.look = { yaw: cameraYaw, pitch: mode === "free" ? 0.42 : -0.18, lookMode: mode };
  v.camera = { yaw: cameraYaw, pitch: 0.3 };
  for (const p of v.players) {
    p.lookMode = mode;
    p.cameraYaw = cameraYaw;
    p.pitch = mode === "free" ? 0.42 : -0.18;
  }
  return v;
}

function fingerprint(state) {
  return {
    players: state.players.map((p) => ({ id: p.id, x: p.x, y: p.y, z: p.z, yaw: p.yaw, kills: p.kills, deaths: p.deaths })),
    stats: { ...state.stats },
  };
}

/** 真·输入层：本机玩家按 `lookMode` 采样，free 静止帧会送 `yaw: null`。 */
function humanRig(lookMode, phase = "arena") {
  const doc = fakeNode();
  doc.hidden = false;
  doc.pointerLockElement = null;
  const canvas = fakeNode();
  globalThis.window = fakeNode();
  const input = createInput(doc, canvas, { pointerLock: false, yaw: -Math.PI / 2, pitch: 0, lookMode, phase });
  input.setPhase(phase);
  return input;
}

/**
 * 跑一局「真人 + 三只 Bot」。真人走走停停（静止段专门用来喂 free 的 `yaw: null`），
 * Bot 每帧吃 `decorate(getView(state), deco)`。
 */
function runWithHuman({ deco = null, lookMode = "free", seed = 810, rngSeed = 19, seconds = 5 } = {}) {
  resetBots();
  const state = arena(seed);
  const ids = botIds(state);
  const rng = counter(rngSeed);
  const input = humanRig(lookMode);
  const bot = [];
  const human = [];
  try {
    for (let i = 0; i < Math.round(seconds / DT); i++) {
      if (i % 90 === 0) globalThis.window.emit("keydown", { code: "KeyW" });
      if (i % 90 === 45) globalThis.window.emit("keyup", { code: "KeyW" });
      const sampled = input.sample(input.getLook().yaw);
      human.push(sampled.yaw);
      const view = decorate(getView(state), deco);
      const inputs = { p0: sampled };
      for (const id of ids) {
        const inp = think(view, id, rng);
        inputs[id] = inp;
        bot.push({ id, ...inp });
      }
      step(state, inputs, DT);
    }
  } finally {
    input.dispose();
  }
  return { bot, human, end: fingerprint(state), state };
}

beforeEach(() => {
  resetBots();
  configureBots({ moveSpace: "local", autoDetectMoveSpace: true, reactionJitter: 0.12 });
});

afterEach(() => {
  delete globalThis.window;
});

describe("think() 的 yaw 永远是有限数", () => {
  it("每一条返回路径都给有限角：hub / 无人可打 / 已出局 / 不认识的 id / 空快照", () => {
    const live = arena(811);
    const liveView = getView(live);
    const hub = createMatch({ seed: 812, botCount: 3, phase: "hub", unlocked: "all" });
    const hubView = getView(hub);
    const id = botIds(live)[0];

    const alone = structuredClone(liveView);
    alone.players = alone.players.filter((p) => p.id === id);

    // 台心 + 无人可打 = 巡逻向量正好是零：这一帧 Bot 不走位，`yaw` 也照样得是个数。
    // 「不动就别写朝向」是玩家 free 那一路的约定，Bot 不许照抄。
    const parked = structuredClone(alone);
    parked.players[0].x = 0;
    parked.players[0].z = 0;

    const dead = structuredClone(liveView);
    for (const p of dead.players) {
      if (p.id === id) {
        p.alive = false;
        p.respawnT = 1.4;
      }
    }

    const cases = [
      ["常态裂岛", liveView, id],
      ["安全区", hubView, botIds(hub)[0]],
      ["场上只剩自己", alone, id],
      ["场上只剩自己且停在台心", parked, id],
      ["自己已出局", dead, id],
      ["不认识的 id", liveView, "nobody"],
      ["空对象", {}, id],
      ["空名册", { players: [] }, id],
      ["null 快照", null, id],
      ["undefined 快照", undefined, id],
    ];

    for (const [tag, view, who] of cases) {
      resetBots();
      expectFinite(think(view, who, counter(3)), tag);
    }

    // 哨兵：台心那一帧确实是零位移，上面那条才不是空转。
    resetBots();
    const idle = think(parked, id, counter(3));
    expect(Math.hypot(idle.moveX, idle.moveZ), "台心巡逻帧本该零位移").toBe(0);
  });

  it("快照被写坏也不漏：yaw 是 null / NaN、坐标是 NaN、目标与自己重合", () => {
    const base = getView(arena(813));
    const id = base.players.find((p) => p.id !== "p0").id;

    const nullYaw = structuredClone(base);
    for (const p of nullYaw.players) p.yaw = null;

    const nanYaw = structuredClone(base);
    for (const p of nanYaw.players) p.yaw = Number.NaN;

    const noYaw = structuredClone(base);
    for (const p of noYaw.players) delete p.yaw;

    const nanPos = structuredClone(base);
    for (const p of nanPos.players) {
      p.x = Number.NaN;
      p.z = Number.NaN;
    }

    const stacked = structuredClone(base);
    for (const p of stacked.players) {
      p.x = 3.5;
      p.z = -1.25;
    }

    const infinite = structuredClone(base);
    for (const p of infinite.players) {
      p.yaw = Number.POSITIVE_INFINITY;
      p.x = Number.NEGATIVE_INFINITY;
    }

    const cases = [
      ["yaw = null", nullYaw],
      ["yaw = NaN", nanYaw],
      ["没有 yaw 字段", noYaw],
      ["坐标 = NaN", nanPos],
      ["所有人站同一格", stacked],
      ["yaw / 坐标 = Infinity", infinite],
    ];

    for (const [tag, view] of cases) {
      resetBots();
      // 连跑三帧：跨帧记忆（lastYaw / 自校准）也不该把非数攒起来。
      for (let i = 0; i < 3; i++) expectFinite(think(view, id, counter(9)), `${tag} 第 ${i + 1} 帧`);
    }
  });

  it("随机源与 reactionJitter 病态时也不漏", () => {
    const state = arena(814);
    const view = getView(state);
    const id = botIds(state)[0];
    for (const jitter of [0.12, Number.NaN, Number.POSITIVE_INFINITY]) {
      for (const [tag, rng] of [
        ["NaN 随机源", () => Number.NaN],
        ["Infinity 随机源", () => Number.POSITIVE_INFINITY],
        ["常态随机源", counter(5)],
      ]) {
        resetBots();
        configureBots({ reactionJitter: jitter });
        for (let i = 0; i < 3; i++) expectFinite(think(view, id, rng), `jitter=${jitter} / ${tag}`);
      }
    }
  });
});

describe("本机玩家 free 视角送 null yaw 时，Bot 那一路照旧", () => {
  it("玩家帧帧可能是 null，Bot 帧帧是有限角，而且身在转、掌在扇", () => {
    const run = runWithHuman({ lookMode: "free", deco: "free" });

    // free 的两支都真的走到了：静止帧 null（保持朝向）、位移帧走向角。
    expect(run.human.some((y) => y === null), "free 静止帧没送出 null").toBe(true);
    expect(run.human.some((y) => Number.isFinite(y)), "free 位移帧没送出走向角").toBe(true);

    run.bot.forEach((inp, i) => expectFinite(inp, `第 ${i} 条 Bot 输入（${inp.id}）`));
    // 不是「全场没动所以恒定」：Bot 的朝向一直在跟着目标走。
    expect(new Set(run.bot.map((inp) => inp.yaw)).size).toBeGreaterThan(50);
    expect(run.bot.filter((inp) => inp.slap).length).toBeGreaterThan(20);
    expect(run.end.stats.hits).toBeGreaterThan(0);
    // sim 里落下来的 Bot 朝向同样有限：没有哪只被「保持朝向」冻在原角度上。
    for (const p of run.state.players) {
      if (p.kind !== "bot") continue;
      expect(Number.isFinite(p.yaw), `${p.id} 的 p.yaw`).toBe(true);
    }
  });

  it("locked 玩家在场是同一副样子：玩家一帧 null 都不送，Bot 仍帧帧有限", () => {
    const run = runWithHuman({ lookMode: "locked", deco: "locked" });
    expect(run.human.every((y) => Number.isFinite(y)), "locked 不该出现 null yaw").toBe(true);
    run.bot.forEach((inp, i) => expectFinite(inp, `第 ${i} 条 Bot 输入（${inp.id}）`));
  });

  it("同一局只换快照上挂的 lookMode：Bot 逐帧输入与终局一字不差", () => {
    // 三次跑的真人输入完全相同（都走 free 采样，含 `yaw: null` 的静止帧），
    // 唯一的差别是 Bot 看到的快照上挂没挂 lookMode / 相机角。
    const bare = runWithHuman({ deco: null });
    const locked = runWithHuman({ deco: "locked" });
    const free = runWithHuman({ deco: "free" });

    expect(locked.bot).toEqual(bare.bot);
    expect(free.bot).toEqual(bare.bot);
    expect(locked.end).toEqual(bare.end);
    expect(free.end).toEqual(bare.end);
    // 哨兵：这一局真的打起来了，也真的走过 free 的 null 支。
    expect(bare.human.some((y) => y === null)).toBe(true);
    expect(bare.bot.filter((inp) => inp.slap).length).toBeGreaterThan(20);
    expect(bare.end.stats.hits).toBeGreaterThan(0);
  });

  it("玩家静止不转身，Bot 照样对着他转：free 的 null 只冻住玩家自己", () => {
    resetBots();
    const state = arena(815, 1);
    const bot = state.players.find((p) => p.kind === "bot");
    const human = getPlayer(state, "p0");
    bot.persona = "brute";
    bot.x = 0;
    bot.z = -6;
    bot.yaw = 0;
    human.yaw = 1.234;
    const rng = counter(27);

    for (let i = 0; i < 180; i++) {
      // 真人钉在原地：free 静止帧送 `yaw: null`，sim 该原样保住他的朝向。
      human.x = 5;
      human.z = 0;
      human.vx = 0;
      human.vz = 0;
      human.y = 0;
      const view = decorate(getView(state), "free");
      const inp = think(view, bot.id, rng);
      expectFinite(inp, `第 ${i} 帧`);
      step(state, { p0: { yaw: null }, [bot.id]: inp }, DT);
    }

    expect(human.yaw, "free 静止帧不该改玩家朝向").toBe(1.234);
    expect(Number.isFinite(bot.yaw)).toBe(true);
    const d = Math.hypot(human.x - bot.x, human.z - bot.z);
    const dot = forwardX(bot.yaw) * ((human.x - bot.x) / d) + forwardZ(bot.yaw) * ((human.z - bot.z) / d);
    expect(dot, "Bot 没对着人").toBeGreaterThan(0.9);
  });

  it("安全区里的空挥闸不因 free 松口：真人按着扇击、Bot 全员零输入", () => {
    resetBots();
    const state = createMatch({ seed: 816, botCount: 3, phase: "hub", unlocked: "all" });
    const ids = botIds(state);
    const rng = counter(31);
    const input = humanRig("free", "hub");
    const seen = [];

    try {
      globalThis.window.emit("keydown", { code: "KeyF" }); // 扇击键按住不放
      for (let i = 0; i < 180; i++) {
        const sampled = input.sample(input.getLook().yaw);
        expect(sampled.slap, "安全区不该输出扇击").toBe(false);
        const view = decorate(getView(state), "free");
        const inputs = { p0: { ...sampled, slap: true } }; // 就算壳层没闸住，空间闸也得兜住
        for (const id of ids) {
          const inp = think(view, id, rng);
          expectFinite(inp, `hub 第 ${i} 帧（${id}）`);
          expect(inp).toMatchObject({ moveX: 0, moveZ: 0, slap: false, skill: false, dash: false, jump: false });
          inputs[id] = inp;
        }
        step(state, inputs, DT);
        seen.push(...state.events.map((e) => e.type));
      }
    } finally {
      input.dispose();
    }

    for (const type of ["slap", "slapStart", "slapWhiff", "hit", "ko"]) {
      expect(seen, `安全区不该有 ${type}`).not.toContain(type);
    }
    expect(state.stats).toMatchObject({ slaps: 0, hits: 0, kos: 0 });
  });
});
