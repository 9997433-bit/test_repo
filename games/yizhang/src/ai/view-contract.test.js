// Bot 只吃 getView 的快照。这份测试把 think() 接到真正的 src/sim 上跑，
// 断言字段名对得上（time / skillCd / statuses / arena.tiles）、坐标系对得上、
// 三种人格在同一局里依然是三种打法，以及安全区里全员休眠、传送进岛后立刻回血。

import { beforeEach, describe, expect, it } from "vitest";

import "../combat/index.js"; // 副作用：把真实战斗解算装进 sim
import { think, resetBots, configureBots, BOT_PERSONAS } from "./bots.js";
import {
  createMatch,
  enterArena,
  enterHub,
  forwardX,
  forwardZ,
  getPlayer,
  getView,
  playerInHub,
  step,
  ZERO_INPUT,
} from "../sim/index.js";

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

/** 裂岛局。`createMatch` 缺省开在安全区，格斗行为的用例一律显式要 arena。 */
function match(seed = 900, botCount = 3) {
  const state = createMatch({ seed, gloveId: "cotton", offhandId: "spring", botCount, phase: "arena" });
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

  it("emit 的 yaw 按 sim 冻结约定（yaw=0 面向 -Z）对准目标", () => {
    const state = match(9021, 1);
    const bot = bots(state)[0];
    const human = state.players[0];
    bot.x = 0;
    bot.z = 0;
    bot.yaw = 0;

    // 四个方位各测一次：朝向必须指向目标，而不是背对它。
    for (const [tx, tz] of [
      [4, 0],
      [-4, 0],
      [0, 4],
      [0, -4],
    ]) {
      resetBots();
      human.x = tx;
      human.z = tz;
      const { yaw } = think(getView(state), bot.id, counter(17));
      const want = Math.hypot(tx, tz);
      const dot = forwardX(yaw) * (tx / want) + forwardZ(yaw) * (tz / want);
      expect(dot, `目标在 (${tx},${tz})`).toBeGreaterThan(0.9);
    }
  });

  it("扇出去的掌真打得到人：命中率不能只是擦边", () => {
    for (const seed of [900, 906, 9022]) {
      resetBots();
      const state = match(seed, 3);
      runBots(state, { seconds: 10, rng: counter(7) });
      expect(state.stats.slaps, `seed ${seed}`).toBeGreaterThan(10);
      // 朝向反了的时候这个比值是 0.00~0.32，对着人扇稳定在 0.44 以上。
      expect(state.stats.hits / state.stats.slaps, `seed ${seed}`).toBeGreaterThan(0.4);
    }
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
    // 台心一个左右对称的圆洞：单纯的「离洞越近推得越狠」在这种形状上会左右抵消，
    // Bot 必须靠前视绕行才不会从正中间踩空。
    for (const tile of state.arena.tiles) {
      if (Math.hypot(tile.x, tile.z) <= 5) {
        tile.alive = false;
        tile.hp = 0;
      }
    }

    let closestToHole = Infinity;
    const rng = counter(31);
    for (let i = 0; i < 300; i++) {
      const view = getView(state);
      step(state, { [bot.id]: think(view, bot.id, rng) }, DT);
      closestToHole = Math.min(closestToHole, Math.hypot(bot.x, bot.z));
    }
    expect(bot.deaths).toBe(0);
    expect(closestToHole).toBeGreaterThan(3);
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

  it("安全区里的人不该被 Bot 惦记：phase=hub 时 think 一律零输入", () => {
    const state = createMatch({ seed: 941, botCount: 3, phase: "hub", unlocked: "all" });
    expect(getView(state).phase).toBe("hub");
    const ids = bots(state).map((b) => b.id);
    const before = bots(state).map((b) => ({ x: b.x, z: b.z, yaw: b.yaw }));
    const seen = [];
    const rng = counter(7);

    for (let i = 0; i < 300; i++) {
      const view = getView(state);
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
      seen.push(...state.events.map((e) => e.type));
    }

    for (const type of ["slapStart", "slap", "slapWhiff", "hit", "skill", "ko", "tileBreak"]) {
      expect(seen, `hub 期不该有 ${type}`).not.toContain(type);
    }
    expect(state.stats).toMatchObject({ slaps: 0, hits: 0, kos: 0, tilesBroken: 0 });
    // yaw 也没被 think 拧过：Bot 站在裂岛上原地待命，不是齐刷刷扭到 yaw=0
    // （回给 sim 的是快照里那个 round4 过的 yaw，只差一次量化，不会持续漂）
    bots(state).forEach((b, i) => {
      expect(Math.hypot(b.x - before[i].x, b.z - before[i].z)).toBeLessThan(1e-6);
      expect(b.yaw).toBeCloseTo(before[i].yaw, 4);
      expect(b.yaw).not.toBe(0);
    });
  });

  it("hub 开局 Bot 不进走道：真人在台座间来回走，三只 Bot 一步都不挪窝", () => {
    const state = createMatch({ seed: 945, botCount: 3, phase: "hub", unlocked: "all" });
    const p0 = getPlayer(state, "p0");
    const R = state.config.arenaRadius;
    const ids = bots(state).map((b) => b.id);
    const rng = counter(13);

    // 开局就该是「真人在走道、Bot 在裂岛」这一对
    expect(playerInHub(state, p0)).toBe(true);
    for (const b of bots(state)) expect(playerInHub(state, b)).toBe(false);
    const before = bots(state).map((b) => ({ x: b.x, z: b.z }));

    const strayed = [];
    for (let i = 0; i < 600; i++) {
      const view = getView(state);
      const inputs = {};
      for (const id of ids) inputs[id] = think(view, id, rng);
      // 真人在走道里晃：Bot 的目标评估一旦醒着，最近的那只就会朝他走过来
      inputs.p0 = { moveX: Math.sin(i * 0.03), moveZ: -1 };
      step(state, inputs, DT);
      for (const b of bots(state)) {
        if (playerInHub(state, b) || Math.hypot(b.x, b.z) > R) strayed.push(`${b.id}@${i}`);
      }
    }

    expect(strayed).toEqual([]);
    expect(state.phase).toBe("hub"); // 还没进门，整段都在安全区里
    bots(state).forEach((b, i) => {
      expect(Math.hypot(b.x - before[i].x, b.z - before[i].z), `${b.id} 挪了窝`).toBeLessThan(1e-6);
    });
  });

  it("回安全区之后 Bot 也立刻停手：留在裂岛上的三只不再走、不再扇", () => {
    const state = createMatch({ seed: 946, botCount: 3, phase: "hub", unlocked: "all" });
    enterArena(state);
    runBots(state, { seconds: 3, rng: counter(3) });
    expect(state.stats.slaps).toBeGreaterThan(0); // 裂岛上确实打起来了

    enterHub(state);
    expect(getView(state).phase).toBe("hub");
    const slapsAtReturn = state.stats.slaps;
    const rng = counter(5);
    const strayed = [];

    for (let i = 0; i < 300; i++) {
      const view = getView(state);
      const inputs = {};
      for (const b of bots(state)) {
        const inp = think(view, b.id, rng);
        inputs[b.id] = inp;
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
      for (const b of bots(state)) if (playerInHub(state, b)) strayed.push(`${b.id}@${i}`);
    }

    expect(state.stats.slaps).toBe(slapsAtReturn); // 一记新的扇击都没起手
    expect(strayed).toEqual([]); // 也没人跟着真人回走道
  });

  it("选掌不走 combat 判定：E 在大厅里只装掌，不放技能、不打人、不碎地", () => {
    const state = createMatch({ seed: 942, botCount: 3, phase: "hub", unlocked: "all" });
    const p0 = getPlayer(state, "p0");
    const ped = state.hub.pedestals.find((x) => x.gloveId === "granite");

    // 站到磐石台座旁（交互圈内、台座实体外），主掌还没挑
    p0.x = ped.x > 0 ? ped.x - 1.3 : ped.x + 1.3;
    p0.z = ped.z;
    expect(state.hub.mainGloveId).toBe(null);

    const seen = [];
    // 键鼠 E 是双义键：sim 同时看到 skill 与 interact，只有 interact 该生效
    for (let i = 0; i < 30; i++) {
      step(state, { p0: { skill: i % 2 === 0, interact: i % 2 === 0, yaw: 0 } }, DT);
      seen.push(...state.events.map((e) => e.type));
    }

    expect(state.hub.mainGloveId).toBe("granite");
    expect(seen).toContain("hubEquip");
    for (const type of ["skill", "hit", "tileBreak", "meteorImpact", "awaken"]) {
      expect(seen, `选掌不该触发 ${type}`).not.toContain(type);
    }
    expect(state.arena.tiles.every((t) => t.alive && t.hp === t.maxHp)).toBe(true);
    expect(state.stats).toMatchObject({ hits: 0, tilesBroken: 0 });
    // 技能的自推进 / 位移也没发生：人还站在台座旁
    expect(Math.hypot(p0.vx, p0.vz)).toBeLessThan(0.05);
    expect(p0.skillCd).toBe(0);
  });

  it("大厅里对着人乱挥也打不到：没有 hit、没有击退、没有掌意", () => {
    const state = createMatch({ seed: 944, botCount: 3, phase: "hub", unlocked: "all" });
    const p0 = getPlayer(state, "p0");
    const victim = getPlayer(state, "b0");
    // 把一只 bot 也搬进走道，正面站在人前 1.5m（yaw=0 面向 -Z）
    victim.x = p0.x;
    victim.z = p0.z - 1.5;
    victim.y = 0;
    victim.invulnT = 0;
    p0.invulnT = 0;

    const seen = [];
    for (let i = 0; i < 120; i++) {
      step(state, { p0: { slap: true, yaw: 0 } }, DT);
      seen.push(...state.events.map((e) => e.type));
    }

    for (const type of ["hit", "slapWhiff", "ko"]) {
      expect(seen, `安全区不该有 ${type}`).not.toContain(type);
    }
    expect(state.stats.hits).toBe(0);
    expect(victim.hitsTaken).toBe(0);
    expect(victim.knockScale).toBe(1);
    expect(victim.meter).toBe(0);
    expect(p0.meter).toBe(0);
    expect(Math.hypot(victim.vx, victim.vz)).toBeLessThan(0.05);
  });

  it("传送进裂岛后战斗立刻回归：同一批 Bot 开始扇人", () => {
    const state = createMatch({ seed: 943, botCount: 3, phase: "hub", unlocked: "all" });
    const p0 = getPlayer(state, "p0");
    const ped = state.hub.pedestals.find((x) => x.gloveId === "granite");

    p0.x = ped.x > 0 ? ped.x - 1.3 : ped.x + 1.3;
    p0.z = ped.z;
    step(state, { p0: { interact: true } }, DT);
    expect(state.hub.portalReady).toBe(true);

    // 走进门（唯一一条切区路径：portalReady ∧ 进门触发区）
    p0.x = state.hub.layout.portal.x;
    p0.z = state.hub.layout.portal.z;
    step(state, { p0: {} }, DT);
    expect(state.phase).toBe("arena");
    expect(getView(state).phase).toBe("arena");

    const log = runBots(state, { seconds: 8, rng: counter(29) });
    expect(log.moveFrames).toBeGreaterThan(600);
    expect(log.slaps).toBeGreaterThan(10);
    expect(state.stats.hits).toBeGreaterThan(0);
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
