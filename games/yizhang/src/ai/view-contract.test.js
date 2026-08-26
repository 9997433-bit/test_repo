// Bot 只吃 getView 的快照。这份测试把 think() 接到真正的 src/sim 上跑，
// 断言字段名对得上（time / skillCd / statuses / arena.tiles）、坐标系对得上、
// 三种人格在同一局里依然是三种打法。

import { beforeEach, describe, expect, it } from "vitest";

import "../combat/index.js"; // 副作用：把真实战斗解算装进 sim
import { think, resetBots, configureBots, BOT_PERSONAS } from "./bots.js";
import { createMatch, getView, step, ZERO_INPUT } from "../sim/index.js";

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

function match(seed = 900, botCount = 3) {
  const state = createMatch({ seed, gloveId: "cotton", offhandId: "spring", botCount });
  return state;
}

function bots(state) {
  return state.players.filter((p) => p.kind === "bot");
}

/** 让 bot 们互相打，人类站着不动。返回过程统计。 */
function runBots(state, { seconds = 6, rng = counter(7), botIds = null } = {}) {
  const ids = botIds || bots(state).map((b) => b.id);
  const log = { slaps: 0, skills: 0, moveFrames: 0, minGap: Infinity, samples: [] };
  for (let i = 0; i < Math.round(seconds / DT); i++) {
    const view = getView(state);
    const inputs = {};
    for (const id of ids) {
      const inp = think(view, id, rng);
      inputs[id] = inp;
      if (Math.hypot(inp.moveX, inp.moveZ) > 0.05) log.moveFrames += 1;
      if (inp.slap) log.slaps += 1;
      if (inp.skill) log.skills += 1;
    }
    step(state, inputs, DT);
    log.samples.push(state.players.map((p) => ({ id: p.id, x: p.x, z: p.z })));
  }
  return log;
}

function gap(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

beforeEach(() => {
  resetBots();
  configureBots({ moveSpace: "local", autoDetectMoveSpace: true, reactionJitter: 0.12 });
});

describe("think() 吃 getView 快照", () => {
  it("Input 键集与 sim 的 ZERO_INPUT 完全一致", () => {
    const state = match(901, 1);
    const bot = bots(state)[0];
    const inp = think(getView(state), bot.id, counter(3));
    expect(Object.keys(inp).sort()).toEqual(Object.keys(ZERO_INPUT).sort());
    for (const k of ["moveX", "moveZ", "yaw"]) expect(Number.isFinite(inp[k])).toBe(true);
    for (const k of ["slap", "skill", "switchGlove", "dash", "jump"]) {
      expect(typeof inp[k]).toBe("boolean");
    }
  });

  it("认得出 getView 是世界系快照：第一帧就朝目标走，不用等自校准", () => {
    const state = match(902, 1);
    const bot = bots(state)[0];
    const human = state.players[0];
    bot.x = -8;
    bot.z = 0;
    bot.yaw = 0;
    human.x = 6;
    human.z = 0;

    const inp = think(getView(state), bot.id, counter(2));
    expect(inp.moveX).toBeGreaterThan(0.7); // 目标在 +X
    expect(Math.abs(inp.moveZ)).toBeLessThan(0.7);
  });

  it("读 getView 的 skillCd 判断技能好没好", () => {
    const state = match(903, 1);
    const bot = bots(state)[0];
    const human = state.players[0];
    bot.gloveId = "granite";
    bot.offhandId = "granite";
    bot.persona = "brute";
    bot.x = 0;
    bot.z = 0;
    human.x = 0;
    human.z = 2.5;

    bot.skillCd = 5;
    const cooling = think(getView(state), bot.id, counter(4));
    expect(cooling.skill).toBe(false);

    resetBots();
    bot.skillCd = 0;
    let fired = false;
    for (let i = 0; i < 30 && !fired; i++) fired = think(getView(state), bot.id, counter(4 + i)).skill;
    expect(fired).toBe(true);
  });

  it("冻结状态（statuses[{id:'freeze'}]）时不出招", () => {
    const state = match(904, 1);
    const bot = bots(state)[0];
    state.players[0].x = 0;
    state.players[0].z = 2;
    bot.x = 0;
    bot.z = 0;
    bot.statuses = [{ id: "freeze", kind: "freeze", t: 1.5, mag: 1 }];
    bot.skillCd = 0;
    const inp = think(getView(state), bot.id, counter(6));
    expect(inp.skill).toBe(false);
  });

  it("绕开碎掉的台块（getView 的 tile.alive=false）", () => {
    const state = match(905, 1);
    const bot = bots(state)[0];
    const human = state.players[0];
    bot.x = -8;
    bot.z = 0;
    human.x = 8;
    human.z = 0;
    for (const tile of state.arena.tiles) {
      if (Math.hypot(tile.x, tile.z) <= 3) {
        tile.alive = false;
        tile.hp = 0;
      }
    }

    let closestToHole = Infinity;
    for (let i = 0; i < 300; i++) {
      const view = getView(state);
      step(state, { [bot.id]: think(view, bot.id, counter(31)) }, DT);
      closestToHole = Math.min(closestToHole, Math.hypot(bot.x, bot.z));
    }
    expect(bot.alive).toBe(true);
    expect(closestToHole).toBeGreaterThan(1.5);
  });

  it("6 秒混战：三只 bot 都在动、在扇，并且贴上了人", () => {
    const state = match(906, 3);
    const log = runBots(state, { seconds: 6 });
    expect(log.moveFrames).toBeGreaterThan(600);
    expect(log.slaps).toBeGreaterThan(20);
    expect(state.stats.hits).toBeGreaterThan(0);
    const closest = Math.min(
      ...log.samples.map((frame) => {
        let best = Infinity;
        for (let i = 0; i < frame.length; i++) {
          for (let j = i + 1; j < frame.length; j++) best = Math.min(best, gap(frame[i], frame[j]));
        }
        return best;
      }),
    );
    expect(closest).toBeLessThan(3);
  });

  it("追着贴边的人打也不会自己走下台", () => {
    const state = match(907, 1);
    const bot = bots(state)[0];
    const bait = state.players[0];
    bot.persona = "brute";
    bot.x = 0;
    bot.z = 0;
    const R = state.config.arenaRadius;
    let maxR = 0;
    for (let i = 0; i < 600; i++) {
      bait.x = 0;
      bait.z = R - 1.5;
      bait.vx = 0;
      bait.vz = 0;
      bait.y = 0;
      const view = getView(state);
      step(state, { [bot.id]: think(view, bot.id, counter(41)) }, DT);
      maxR = Math.max(maxR, Math.hypot(bot.x, bot.z));
    }
    expect(maxR).toBeLessThan(R);
    expect(bot.deaths).toBe(0);
  });

  it("三种人格的交战距离仍然分得开：fox 站得比 brute 远", () => {
    const avgGap = (persona) => {
      resetBots();
      const state = match(908, 1);
      const bot = bots(state)[0];
      const dummy = state.players[0];
      bot.persona = persona;
      bot.gloveId = "cotton";
      bot.x = -7;
      bot.z = 0;
      const rng = counter(11);
      let total = 0;
      let counted = 0;
      for (let i = 0; i < 600; i++) {
        dummy.x = 0;
        dummy.z = 0;
        dummy.vx = 0;
        dummy.vz = 0;
        dummy.y = 0;
        const view = getView(state);
        step(state, { [bot.id]: think(view, bot.id, rng) }, DT);
        if (i >= 180) {
          total += Math.hypot(bot.x - dummy.x, bot.z - dummy.z);
          counted += 1;
        }
      }
      return total / counted;
    };

    const brute = avgGap("brute");
    const fox = avgGap("fox");
    expect(fox).toBeGreaterThan(brute + 0.8);
    expect(BOT_PERSONAS).toEqual(["brute", "fox", "bully"]);
  });
});
