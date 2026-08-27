import { beforeEach, describe, expect, it } from "vitest";

import { think, resetBots, configureBots, isHubView, BOT_PERSONAS, personaFor } from "./bots.js";
import { makePlayer, makeState, makeTiles, stepSim, counter } from "../combat/testkit.js";

const INPUT_KEYS = ["moveX", "moveZ", "yaw", "slap", "skill", "switchGlove", "dash", "jump"];

function run(state, botIds, { seconds = 6, moveSpace = "local", rng = counter(7), dummies = {}, pin = [] } = {}) {
  const frames = Math.round(seconds * 60);
  const log = { slaps: 0, skills: 0, moveFrames: 0, dashes: 0, samples: [], maxImpact: 0 };
  // pin：把训练木桩钉在原地，方便观察 Bot 自己的走位而不是被击退拖着跑。
  const pinned = pin.map((id) => {
    const p = state.players.find((q) => q.id === id);
    return { p, x: p.x, z: p.z };
  });
  for (let i = 0; i < frames; i++) {
    const inputs = { ...dummies };
    for (const id of botIds) {
      const inp = think(state, id, rng);
      inputs[id] = inp;
      if (Math.hypot(inp.moveX, inp.moveZ) > 0.05) log.moveFrames += 1;
      if (inp.slap) log.slaps += 1;
      if (inp.skill) log.skills += 1;
      if (inp.dash) log.dashes += 1;
    }
    stepSim(state, inputs, 1 / 60, { moveSpace });
    for (const { p, x, z } of pinned) {
      log.maxImpact = Math.max(log.maxImpact, p.impact);
      p.x = x;
      p.z = z;
      p.y = 0;
      p.vx = 0;
      p.vy = 0;
      p.vz = 0;
    }
    log.samples.push(state.players.map((p) => ({ id: p.id, x: p.x, z: p.z, alive: p.alive })));
  }
  return log;
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

beforeEach(() => {
  resetBots();
  configureBots({ moveSpace: "local", autoDetectMoveSpace: true, reactionJitter: 0.12 });
});

describe("Input 契约", () => {
  it("返回完整 Input，且全是有限数值 / 布尔", () => {
    const bot = makePlayer("bot1", { persona: "brute", x: -4, z: 0 });
    const foe = makePlayer("P", { x: 4, z: 0 });
    const state = makeState([bot, foe]);
    const inp = think(state, "bot1", counter(3));
    expect(Object.keys(inp).sort()).toEqual([...INPUT_KEYS].sort());
    expect(Number.isFinite(inp.moveX) && Number.isFinite(inp.moveZ) && Number.isFinite(inp.yaw)).toBe(true);
    expect(Math.abs(inp.moveX)).toBeLessThanOrEqual(1);
    expect(Math.abs(inp.moveZ)).toBeLessThanOrEqual(1);
    for (const k of ["slap", "skill", "switchGlove", "dash", "jump"]) expect(typeof inp[k]).toBe("boolean");
  });

  it("view 里没有自己 / 自己已阵亡时返回中立输入，不抽风", () => {
    const bot = makePlayer("bot1", { persona: "fox" });
    const state = makeState([bot]);
    expect(think(state, "nobody", counter(1)).slap).toBe(false);
    bot.alive = false;
    const inp = think(state, "bot1", counter(1));
    expect(inp.moveX).toBe(0);
    expect(inp.slap).toBe(false);
  });

  it("缺字段的残缺 view 也不炸", () => {
    expect(() => think(undefined, "bot1", counter(1))).not.toThrow();
    expect(() => think({ players: [{ id: "bot1" }, { id: "P" }] }, "bot1")).not.toThrow();
    const inp = think({ players: [{ id: "bot1" }, { id: "P", x: 3 }] }, "bot1");
    expect(Number.isFinite(inp.moveX)).toBe(true);
  });

  it("persona 缺省时按 id 稳定散列，不会每帧漂移", () => {
    const a = personaFor({}, "bot-7");
    expect(BOT_PERSONAS).toContain(a);
    expect(personaFor({}, "bot-7")).toBe(a);
    expect(personaFor({ persona: "bully" }, "bot-7")).toBe("bully");
  });
});

describe("三种性格都真的在动、在扇", () => {
  for (const persona of BOT_PERSONAS) {
    it(`${persona}：6 秒内产生移动与扇击，并把距离拉到射程内`, () => {
      const bot = makePlayer("B1", { persona, gloveId: persona === "brute" ? "granite" : "cotton", x: -9, z: -6 });
      const dummy = makePlayer("P", { x: 5, z: 4 });
      const state = makeState([bot, dummy], { tiles: makeTiles(10, 6) });
      const start = dist(bot, dummy);
      const log = run(state, ["B1"], { seconds: 6 });

      expect(log.moveFrames).toBeGreaterThan(300);
      expect(log.slaps).toBeGreaterThan(0);
      expect(state.events.filter((e) => e.type === "slap").length + state.events.filter((e) => e.type === "slapWhiff").length).toBeGreaterThan(0);
      const closest = Math.min(...log.samples.map((s) => Math.hypot(s[0].x - s[1].x, s[0].z - s[1].z)));
      expect(closest).toBeLessThan(3.2);
      expect(closest).toBeLessThan(start);
    });
  }

  it("brute 真的打到人（命中事件而不只是挥空）", () => {
    const bot = makePlayer("B1", { persona: "brute", gloveId: "cotton", x: -6, z: 0 });
    const dummy = makePlayer("P", { x: 2, z: 0 });
    const state = makeState([bot, dummy]);
    const log = run(state, ["B1"], { seconds: 8, pin: ["P"] });
    const landed = state.events.filter((e) => e.type === "slap" && e.attackerId === "B1");
    expect(landed.length).toBeGreaterThan(5);
    expect(log.maxImpact).toBeGreaterThan(0.3);
  });

  it("会放主动技（磐石 bot 砸出 skillCast）", () => {
    const bot = makePlayer("B1", { persona: "brute", gloveId: "granite", offhandId: "granite", x: -4, z: 0 });
    const dummy = makePlayer("P", { x: 1.5, z: 0 });
    const state = makeState([bot, dummy], { tiles: makeTiles(4, 6, 60) });
    run(state, ["B1"], { seconds: 10 });
    expect(state.events.some((e) => e.type === "skillCast" && e.skillId === "groundPound")).toBe(true);
  });
});

describe("性格差异", () => {
  it("fox 的平均交战距离明显大于 brute", () => {
    const mk = (persona) => {
      resetBots();
      const bot = makePlayer("B1", { persona, gloveId: "cotton", x: -7, z: 0 });
      const dummy = makePlayer("P", { x: 0, z: 0 });
      const state = makeState([bot, dummy]);
      const log = run(state, ["B1"], { seconds: 10, rng: counter(11), pin: ["P"] });
      const late = log.samples.slice(180);
      return late.reduce((s, f) => s + Math.hypot(f[0].x - f[1].x, f[0].z - f[1].z), 0) / late.length;
    };
    const brute = mk("brute");
    const fox = mk("fox");
    expect(fox).toBeGreaterThan(brute + 0.8);
  });

  it("bully 挑更容易出局的目标（贴边 + 吃过击退的那个）", () => {
    const bot = makePlayer("B1", { persona: "bully", x: 0, z: 0 });
    const healthy = makePlayer("SAFE", { x: 2.5, z: 0 });
    const weak = makePlayer("WEAK", { x: 0, z: 14 });
    weak.impact = 1.2;
    const state = makeState([bot, healthy, weak], { arenaRadius: 20 });
    const log = run(state, ["B1"], { seconds: 5, rng: counter(5), pin: ["SAFE", "WEAK"] });
    const last = log.samples[log.samples.length - 1];
    const me = last.find((p) => p.id === "B1");
    const dWeak = Math.hypot(me.x - weak.x, me.z - weak.z);
    const dSafe = Math.hypot(me.x - healthy.x, me.z - healthy.z);
    expect(dWeak).toBeLessThan(dSafe);
    expect(state.events.some((e) => e.type === "slap" && e.targetId === "WEAK")).toBe(true);
  });

  it("bully 打贴边目标时站内侧，往外扇", () => {
    const bot = makePlayer("B1", { persona: "bully", gloveId: "granite", x: 0, z: 0 });
    const victim = makePlayer("V", { x: 0, z: 15 });
    const state = makeState([bot, victim], { arenaRadius: 20 });
    run(state, ["B1"], { seconds: 6, rng: counter(9) });
    const pushed = state.events.filter((e) => e.type === "slap" && e.targetId === "V");
    expect(pushed.length).toBeGreaterThan(0);
    // 冲量沿 +Z（向台外）为主
    expect(pushed.some((e) => e.impulse.z > 0)).toBe(true);
  });
});

describe("走位安全", () => {
  it("追着贴边的目标打，也不会自己走下台", () => {
    const bot = makePlayer("B1", { persona: "brute", gloveId: "cotton", x: 0, z: 0 });
    const bait = makePlayer("P", { x: 0, z: 18.5 });
    const state = makeState([bot, bait], { arenaRadius: 20 });
    const log = run(state, ["B1"], { seconds: 12, rng: counter(41), pin: ["P"] });
    const maxR = Math.max(...log.samples.map((s) => Math.hypot(s[0].x, s[0].z)));
    expect(maxR).toBeLessThan(20);
    expect(state.players[0].alive).toBe(true);
  });

  it("混战中出界的只可能是被扇出去的（自己不走空）", () => {
    const bots = BOT_PERSONAS.map((persona, i) =>
      makePlayer(`B${i}`, {
        persona,
        gloveId: ["granite", "gale", "magnet"][i],
        x: Math.cos((i / 3) * Math.PI * 2) * 12,
        z: Math.sin((i / 3) * Math.PI * 2) * 12,
      }),
    );
    const state = makeState(bots, { arenaRadius: 20 });
    const log = run(state, bots.map((b) => b.id), { seconds: 20, rng: counter(23) });
    for (const p of state.players) {
      expect(Number.isFinite(p.x) && Number.isFinite(p.z)).toBe(true);
      if (Math.hypot(p.x, p.z) >= 20) expect(p.lastHitBy).toBeTruthy();
    }
    expect(log.slaps).toBeGreaterThan(30);
  });

  it("躲开碎掉的台块", () => {
    const bot = makePlayer("B1", { persona: "brute", x: -8, z: 0 });
    const dummy = makePlayer("P", { x: 8, z: 0 });
    const hole = { id: "hole", x: 0, z: 0, r: 3, hp: 0, maxHp: 100, broken: true };
    const state = makeState([bot, dummy], { tiles: [hole] });
    const log = run(state, ["B1"], { seconds: 5, rng: counter(31), pin: ["P"] });
    const closest = Math.min(...log.samples.map((s) => Math.hypot(s[0].x, s[0].z)));
    expect(closest).toBeGreaterThan(2.8);
  });
});

describe("moveX/moveZ 坐标系自校准", () => {
  for (const moveSpace of ["local", "world"]) {
    it(`sim 用 ${moveSpace} 解释移动输入时，bot 依然能贴上去`, () => {
      const bot = makePlayer("B1", { persona: "brute", x: -12, z: 5 });
      const dummy = makePlayer("P", { x: 6, z: -4 });
      const state = makeState([bot, dummy]);
      const log = run(state, ["B1"], { seconds: 8, moveSpace, rng: counter(13) });
      const closest = Math.min(...log.samples.map((s) => Math.hypot(s[0].x - s[1].x, s[0].z - s[1].z)));
      expect(closest).toBeLessThan(3);
    });
  }

  it("view 显式声明 moveSpace 时直接采信", () => {
    const bot = makePlayer("B1", { persona: "brute", x: -6, z: 0, yaw: 0 });
    const dummy = makePlayer("P", { x: 6, z: 0 });
    const state = makeState([bot, dummy]);
    state.moveSpace = "world";
    const inp = think(state, "B1", counter(2));
    expect(inp.moveX).toBeGreaterThan(0.8); // 世界坐标下目标在 +X
  });
});

describe("安全区守卫（phase=hub 时 Bot 休眠）", () => {
  /**
   * 手搭一份 `src/sim/view.js` 形状的快照：目标就贴在 Bot 脸上、冷却全好、有副掌可换，
   * 换句话说 arena 下这一帧必定出手。phase 一改成 hub 就必须一个动作都不出。
   */
  function snapshot(phase, over = {}) {
    return {
      version: 4,
      seed: 1,
      time: 12.5,
      tick: 750,
      phase,
      hub: { portalReady: false, focusGloveId: null, pedestals: [] },
      config: { dt: 1 / 60, arenaRadius: 20 },
      arena: { radius: 20, tileSize: 3, tiles: [] },
      players: [
        {
          id: "B1",
          kind: "bot",
          persona: "brute",
          x: 0,
          y: 0,
          z: 0,
          yaw: 1.25,
          alive: true,
          respawnT: 0,
          gloveId: "granite",
          offhandId: "frost",
          activeSlot: 0,
          slapCd: 0,
          skillCd: 0,
          dashCd: 0,
          dashT: 0,
          statuses: [],
          knockScale: 1,
        },
        { id: "p0", kind: "human", x: 0.8, y: 0, z: 0, yaw: 0, alive: true, respawnT: 0, statuses: [], knockScale: 1 },
      ],
      events: [],
      ...over,
    };
  }

  const ZEROED = { moveX: 0, moveZ: 0, slap: false, skill: false, switchGlove: false, dash: false, jump: false };

  it("isHubView：显式 phase 优先，缺 phase 时看有没有 hub 数据", () => {
    expect(isHubView({ phase: "hub" })).toBe(true);
    expect(isHubView({ phase: "arena", hub: { pedestals: [] } })).toBe(false);
    expect(isHubView({ hub: { pedestals: [] } })).toBe(true);
    expect(isHubView({ hub: null })).toBe(false);
    expect(isHubView({ players: [] })).toBe(false);
    expect(isHubView(null)).toBe(false);
  });

  it("phase='hub'：键集不变、全是零，yaw 保持自己当前朝向", () => {
    const view = snapshot("hub");
    const inp = think(view, "B1", counter(3));
    expect(Object.keys(inp).sort()).toEqual([...INPUT_KEYS].sort());
    expect(inp).toMatchObject(ZEROED);
    expect(inp.yaw).toBe(1.25); // 不是 0：sim 会照单写回 p.yaw，别让 Bot 齐刷刷扭头
  });

  it("在安全区里连站 10 秒也一次都不出手", () => {
    const view = snapshot("hub");
    const rng = counter(17);
    for (let i = 0; i < 600; i++) {
      view.time += 1 / 60;
      view.tick += 1;
      const inp = think(view, "B1", rng);
      expect(inp).toMatchObject(ZEROED);
    }
  });

  it("缺 phase 但带 view.hub 也按安全区处理（fail-safe 偏向不出手）", () => {
    const view = snapshot("hub");
    delete view.phase;
    expect(think(view, "B1", counter(5))).toMatchObject(ZEROED);
  });

  /** 按 sim 的口径回写 yaw：think 出的朝向下一帧就是 p.yaw。 */
  function drive(view, frames, rng) {
    const log = { move: 0, slap: 0 };
    for (let i = 0; i < frames; i++) {
      view.time += 1 / 60;
      view.tick += 1;
      const inp = think(view, "B1", rng);
      view.players[0].yaw = inp.yaw;
      if (Math.hypot(inp.moveX, inp.moveZ) > 0.5) log.move += 1;
      if (inp.slap) log.slap += 1;
    }
    return log;
  }

  it("同一份快照换成 phase='arena' 就恢复正常：会走、会扇", () => {
    const view = snapshot("arena");
    delete view.hub;
    const log = drive(view, 12, counter(3));
    expect(log.move).toBe(12);
    expect(log.slap).toBeGreaterThan(0);
  });

  it("hub → arena 切换后第一帧就正常出手，不带安全区里的陈旧记忆", () => {
    const hub = snapshot("hub");
    const rng = counter(23);
    for (let i = 0; i < 300; i++) {
      hub.time += 1 / 60;
      think(hub, "B1", rng);
    }
    const arena = snapshot("arena", { time: hub.time + 1 / 60, tick: hub.tick + 1 });
    delete arena.hub;
    const inp = think(arena, "B1", rng);
    expect(Number.isFinite(inp.moveX) && Number.isFinite(inp.moveZ) && Number.isFinite(inp.yaw)).toBe(true);
    expect(Math.hypot(inp.moveX, inp.moveZ)).toBeGreaterThan(0.5);
  });

  it("没有 phase 也没有 hub 的老快照（combat testkit）不受守卫影响", () => {
    // testkit 的朝向方言是 yaw=0 面向 +Z，把目标摆到正前方 1.2m
    const bot = makePlayer("B1", { persona: "brute", x: 0, z: 0, yaw: 0 });
    const foe = makePlayer("P", { x: 0, z: 1.2 });
    const state = makeState([bot, foe]);
    expect(isHubView(state)).toBe(false);
    expect(think(state, "B1", counter(3)).slap).toBe(true);
  });
});

describe("三 Bot 混战", () => {
  it("30 秒混战：有命中、有击退、有出局，且状态保持有限值", () => {
    const bots = BOT_PERSONAS.map((persona, i) =>
      makePlayer(`B${i}`, {
        persona,
        gloveId: ["granite", "gale", "magnet"][i],
        offhandId: ["frost", "spring", "meteor"][i],
        x: Math.cos((i / 3) * Math.PI * 2) * 5,
        z: Math.sin((i / 3) * Math.PI * 2) * 5,
      }),
    );
    const state = makeState(bots, { arenaRadius: 9, tiles: makeTiles(6, 8, 80) });
    run(state, bots.map((b) => b.id), { seconds: 30, rng: counter(101) });

    const slaps = state.events.filter((e) => e.type === "slap").length;
    const kills = state.players.reduce((s, p) => s + p.kills, 0);
    expect(slaps).toBeGreaterThan(20);
    expect(kills).toBeGreaterThan(0);
    for (const p of state.players) {
      expect(Number.isFinite(p.x + p.z + p.vx + p.vz + p.meter + p.impact)).toBe(true);
      expect(p.meter).toBeLessThanOrEqual(1);
    }
  });
});
