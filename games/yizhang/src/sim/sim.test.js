// sim 自测。tests/ 目录归 GPT-sol-1，这里只放 sim 内部单测（vite.config 已 include src/**/*.test.js）。

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, beforeEach } from "vitest";

import * as realCombat from "../combat/index.js";
import { normalizeSkillId } from "../combat/skills.js";
import * as realData from "../data/gloves.js";
import {
  GLOVES as REAL_GLOVES,
  GLOVE_BY_ID as REAL_GLOVE_BY_ID,
} from "../data/gloves.js";
import * as bridge from "./combat-bridge.js";
import { combatSkillId } from "./combat-bridge.js";
import {
  getDeps,
  createMatch,
  step,
  getView,
  isMatchOver,
  getPlayer,
  getMatchConfig,
  getGloves,
  getHubLayout,
  damageTileAt,
  hasFloorUnder,
  applyKnockback,
  enterArena,
  enterHub,
  installHubLayout,
  playerInHub,
  resetDeps,
  installData,
  installCombat,
  HUB_ZERO_INPUT,
  ZERO_INPUT,
  PHYSICS,
} from "./index.js";

const DT = 1 / 60;
const HERE = dirname(fileURLToPath(import.meta.url));

/** 面向 +X 的 yaw（约定 yaw=0 面向 -Z） */
const FACE_PLUS_X = -Math.PI / 2;

function input(over = {}) {
  return { ...ZERO_INPUT, ...over };
}

function run(state, inputs, seconds, dt = DT) {
  const n = Math.round(seconds / dt);
  for (let i = 0; i < n; i++) step(state, inputs, dt);
  return state;
}

function place(p, x, y, z, yaw = 0) {
  p.x = x;
  p.y = y;
  p.z = z;
  p.yaw = yaw;
  p.vx = 0;
  p.vy = 0;
  p.vz = 0;
  p.grounded = y <= 0;
}

beforeEach(() => {
  resetDeps();
});

describe("依赖与纯净性", () => {
  it("sim 不 import three / Babylon，也不碰 DOM", () => {
    const files = readdirSync(HERE).filter((f) => f.endsWith(".js") && !f.endsWith(".test.js"));
    expect(files.length).toBeGreaterThan(5);
    for (const f of files) {
      const src = readFileSync(join(HERE, f), "utf8");
      expect(src, `${f} 不能 import three`).not.toMatch(/from\s+["']three/);
      expect(src, `${f} 不能 import Babylon`).not.toMatch(/@babylonjs/);
      expect(src, `${f} 不能用 document`).not.toMatch(/\bdocument\./);
      expect(src, `${f} 不能用 window`).not.toMatch(/\bwindow\./);
      expect(src, `${f} 不能用 requestAnimationFrame`).not.toMatch(/requestAnimationFrame/);
    }
  });

  it("默认接的是真实 data / combat，install* 只是测试替身", () => {
    expect(getMatchConfig().arenaRadius).toBe(20);
    expect(getGloves()).toHaveLength(REAL_GLOVES.length);
    expect(getGloves().find((g) => g.id === "cotton").slapRange).toBe(
      REAL_GLOVE_BY_ID.cotton.slapRange,
    );

    installData({
      MATCH: { arenaRadius: 12 },
      GLOVES: [{ id: "cotton", name: "测试掌", slapPower: 30 }],
    });
    expect(getMatchConfig().arenaRadius).toBe(12);
    const g = getGloves().find((x) => x.id === "cotton");
    expect(g.slapPower).toBe(30);
    expect(g.slapRange).toBeGreaterThan(0); // 缺失字段被兜底补齐

    let called = 0;
    installCombat({
      resolveSlap: () => {
        called++;
        return { hits: [] };
      },
    });
    // 扇击要真的进 combat：安全区里的空挥闸不启动扇击，得先进裂岛
    const s = createMatch({ seed: 7, botCount: 1, phase: "arena" });
    run(s, { p0: input({ slap: true }) }, 0.5);
    expect(called).toBeGreaterThan(0);

    resetDeps();
    expect(getMatchConfig().arenaRadius).toBe(20);
  });
});

describe("createMatch", () => {
  it("默认 3 个 bot，人类是 p0", () => {
    const s = createMatch({ seed: 3 });
    expect(s.players.map((p) => p.id)).toEqual(["p0", "b0", "b1", "b2"]);
    expect(s.players[0].kind).toBe("human");
    expect(s.players.slice(1).every((p) => p.kind === "bot")).toBe(true);
    expect(s.players.slice(1).map((p) => p.persona)).toEqual(["brute", "fox", "bully"]);
  });

  it("双掌槽位与切换锁字段齐全", () => {
    const s = createMatch({ seed: 3, gloveId: "cotton", offhandId: "granite" });
    const p = getPlayer(s, "p0");
    expect(p.gloveId).toBe("cotton");
    expect(p.offhandId).toBe("granite");
    expect(p.activeSlot).toBe(0);
    expect(p.meter).toBe(0);
    expect(p.awakenedT).toBe(0);
    expect(p.statuses).toEqual([]);
  });

  it("phase:'arena' 时所有人开局站在台上，脚下有台", () => {
    const s = createMatch({ seed: 9, phase: "arena" });
    for (const p of s.players) {
      expect(p.alive).toBe(true);
      expect(Math.hypot(p.x, p.z)).toBeLessThan(s.config.arenaRadius);
      expect(hasFloorUnder(s, p.x, p.z)).toBe(true);
    }
  });

  it("默认开局在安全区：真人在走道上，Bot 留在裂岛等着", () => {
    const s = createMatch({ seed: 9 });
    expect(s.phase).toBe("hub");

    const human = getPlayer(s, "p0");
    expect(playerInHub(s, human)).toBe(true);
    expect(human.alive).toBe(true);

    for (const bot of s.players.filter((p) => p.kind === "bot")) {
      expect(playerInHub(s, bot)).toBe(false);
      expect(hasFloorUnder(s, bot.x, bot.z)).toBe(true);
    }
  });
});

describe("确定性", () => {
  it("同 seed 同输入 = 同结果", () => {
    const script = (i) => ({
      p0: input({
        moveX: Math.sin(i * 0.05),
        moveZ: Math.cos(i * 0.03),
        yaw: i * 0.02,
        slap: i % 40 < 5,
        dash: i % 97 === 0,
        jump: i % 53 === 0,
        switchGlove: i % 131 === 0,
      }),
    });
    const a = createMatch({ seed: 4242, offhandId: "granite" });
    const b = createMatch({ seed: 4242, offhandId: "granite" });
    for (let i = 0; i < 600; i++) {
      step(a, script(i), DT);
      step(b, script(i), DT);
    }
    expect(JSON.stringify(getView(a))).toBe(JSON.stringify(getView(b)));
  });

  it("structuredClone 之后继续 step 结果一致", () => {
    const a = createMatch({ seed: 11 });
    run(a, { p0: input({ moveX: 1, slap: true }) }, 0.5);
    const b = structuredClone(a);
    run(a, { p0: input({ moveZ: 1 }) }, 0.5);
    run(b, { p0: input({ moveZ: 1 }) }, 0.5);
    expect(JSON.stringify(getView(a))).toBe(JSON.stringify(getView(b)));
  });
});

describe("移动与积分", () => {
  it("重力落地停在台面", () => {
    const s = createMatch({ seed: 1, botCount: 0 });
    const p = getPlayer(s, "p0");
    place(p, 0, 4, 0);
    run(s, {}, 1.5);
    expect(p.y).toBe(0);
    expect(p.grounded).toBe(true);
    expect(p.vy).toBe(0);
  });

  it("有惯性：松手后继续滑行再停", () => {
    const s = createMatch({ seed: 1, botCount: 0 });
    const p = getPlayer(s, "p0");
    place(p, 0, 0, 0);
    run(s, { p0: input({ moveX: 1 }) }, 1.0);
    const cruise = Math.hypot(p.vx, p.vz);
    expect(cruise).toBeGreaterThan(6);
    expect(cruise).toBeLessThanOrEqual(PHYSICS.maxSpeed + 0.01);

    step(s, {}, DT);
    const justAfter = Math.hypot(p.vx, p.vz);
    expect(justAfter).toBeGreaterThan(cruise * 0.7); // 不是瞬停
    run(s, {}, 1.5);
    expect(Math.hypot(p.vx, p.vz)).toBeLessThan(0.2);
  });

  it("跳跃离地再落回", () => {
    const s = createMatch({ seed: 1, botCount: 0 });
    const p = getPlayer(s, "p0");
    place(p, 0, 0, 0);
    step(s, { p0: input({ jump: true }) }, DT);
    expect(p.vy).toBeGreaterThan(0);
    expect(p.grounded).toBe(false);
    run(s, {}, 0.3);
    expect(p.y).toBeGreaterThan(0.5);
    run(s, {}, 1.5);
    expect(p.y).toBe(0);
    expect(p.grounded).toBe(true);
  });

  it("冲刺提速且有冷却", () => {
    const s = createMatch({ seed: 1, botCount: 0 });
    const p = getPlayer(s, "p0");
    place(p, 0, 0, 0, FACE_PLUS_X);
    step(s, { p0: input({ dash: true, yaw: FACE_PLUS_X }) }, DT);
    expect(p.dashT).toBeGreaterThan(0);
    expect(p.dashCd).toBeCloseTo(PHYSICS.dashCooldown, 5); // 冷却当帧起算
    expect(p.vx).toBeGreaterThan(PHYSICS.maxSpeed);

    run(s, {}, 0.4);
    const cdBefore = p.dashCd;
    step(s, { p0: input({ dash: true, yaw: FACE_PLUS_X }) }, DT); // 冷却中，无效
    expect(p.dashT).toBe(0);
    expect(p.dashCd).toBeCloseTo(cdBefore - DT, 3);

    run(s, {}, PHYSICS.dashCooldown);
    expect(p.dashCd).toBe(0);
    step(s, { p0: input({ dash: true, yaw: FACE_PLUS_X }) }, DT);
    expect(p.dashT).toBeGreaterThan(0);
  });

  it("边缘低护栏挡住走位失误", () => {
    const s = createMatch({ seed: 1, botCount: 0 });
    const p = getPlayer(s, "p0");
    place(p, 18, 0, 0, FACE_PLUS_X);
    run(s, { p0: input({ moveX: 1, yaw: FACE_PLUS_X }) }, 3);
    expect(p.alive).toBe(true);
    expect(Math.hypot(p.x, p.z)).toBeLessThanOrEqual(s.config.arenaRadius);
  });
});

describe("扇击", () => {
  const COTTON = REAL_GLOVE_BY_ID.cotton;

  function duel(seed = 5) {
    const s = createMatch({ seed, botCount: 1 });
    const a = getPlayer(s, "p0");
    const b = getPlayer(s, "b0");
    place(a, 0, 0, 0, FACE_PLUS_X);
    place(b, 2, 0, 0);
    b.invulnT = 0;
    a.invulnT = 0;
    return { s, a, b };
  }

  it("前摇 -> 命中 -> 后摇", () => {
    const { s, a, b } = duel();
    step(s, { p0: input({ slap: true, yaw: FACE_PLUS_X }) }, DT);
    expect(a.attack.phase).toBe("windup");
    expect(b.vx).toBe(0); // 前摇中还没打到

    run(s, { p0: input({ slap: true, yaw: FACE_PLUS_X }) }, COTTON.windup + 0.02);
    expect(b.vx).toBeGreaterThan(3);
    expect(a.attack.phase).toBe("recovery");

    const hitEvents = [];
    for (let i = 0; i < 30; i++) {
      step(s, {}, DT);
      hitEvents.push(...s.events.filter((e) => e.type === "hit"));
    }
    expect(a.attack.phase).toBe("idle");
    expect(hitEvents.length).toBe(0); // 松手不再出招
  });

  it("背后不吃扇（面向锥体）", () => {
    const { s, a, b } = duel();
    place(b, -2, 0, 0);
    run(s, { p0: input({ slap: true, yaw: FACE_PLUS_X }) }, 0.4);
    expect(Math.hypot(b.vx, b.vz)).toBeLessThan(0.01);
    expect(b.hitsTaken).toBe(0);
  });

  it("击退给水平速度冲量并涨掌意", () => {
    const { s, a, b } = duel();
    run(s, { p0: input({ slap: true, yaw: FACE_PLUS_X }) }, COTTON.windup + 0.02);
    expect(b.vx).toBeGreaterThan(5);
    expect(b.knockScale).toBeGreaterThan(1);
    expect(a.meter).toBeGreaterThan(0);
    expect(b.meter).toBeGreaterThan(0);
    expect(a.hitsDealt).toBe(1);
  });

  it("无敌帧内不吃扇", () => {
    const { s, b } = duel();
    b.invulnT = 1;
    run(s, { p0: input({ slap: true, yaw: FACE_PLUS_X }) }, 0.3);
    expect(b.hitsTaken).toBe(0);
  });

  it("掌意满自动觉醒 8s", () => {
    const { s, a } = duel();
    a.meter = 0.95;
    run(s, { p0: input({ slap: true, yaw: FACE_PLUS_X }) }, COTTON.windup + 0.06);
    expect(a.awakenedT).toBeGreaterThan(7);
    expect(a.awakenedT).toBeLessThanOrEqual(s.config.awakenDuration);
    expect(a.meter).toBe(0);
    run(s, {}, s.config.awakenDuration + 0.2);
    expect(a.awakenedT).toBe(0);
  });
});

describe("换掌", () => {
  // 裂岛语义：activeSlot 切换 + 收掌锁。安全区那套（主副交换、无锁）在 hub-actions.test.js。
  it("Q 切换主副掌，0.4s 收掌锁", () => {
    const s = createMatch({
      seed: 2,
      botCount: 0,
      gloveId: "cotton",
      offhandId: "granite",
      phase: "arena",
    });
    const p = getPlayer(s, "p0");
    step(s, { p0: input({ switchGlove: true }) }, DT);
    expect(p.activeSlot).toBe(1);
    expect(p.switchLockT).toBeCloseTo(s.config.switchLock, 5);

    // 锁内再按无效（松开一帧制造边沿）
    step(s, {}, DT);
    step(s, { p0: input({ switchGlove: true }) }, DT);
    expect(p.activeSlot).toBe(1);

    run(s, {}, 0.5);
    expect(p.switchLockT).toBe(0);
    step(s, { p0: input({ switchGlove: true }) }, DT);
    expect(p.activeSlot).toBe(0);
  });

  it("收掌锁期间不能扇", () => {
    const s = createMatch({ seed: 2, botCount: 0, offhandId: "granite", phase: "arena" });
    const p = getPlayer(s, "p0");
    step(s, { p0: input({ switchGlove: true }) }, DT);
    step(s, { p0: input({ slap: true }) }, DT);
    expect(p.attack.phase).toBe("idle");
  });
});

describe("掉落 / 击杀 / 重组", () => {
  it("被扇出岛 = 击杀，且计分给最后命中者", () => {
    const s = createMatch({ seed: 8, botCount: 1 });
    const a = getPlayer(s, "p0");
    const b = getPlayer(s, "b0");
    place(a, 16.6, 0, 0, FACE_PLUS_X);
    place(b, 19.3, 0, 0);
    a.invulnT = 0;
    b.invulnT = 0;

    let koEvent = null;
    for (let i = 0; i < 60 * 6 && !koEvent; i++) {
      step(s, { p0: input({ slap: true, yaw: FACE_PLUS_X }) }, DT);
      koEvent = s.events.find((e) => e.type === "ko") || null;
    }

    expect(koEvent).not.toBeNull();
    expect(koEvent.id).toBe("b0");
    expect(koEvent.by).toBe("p0");
    expect(b.alive).toBe(false);
    expect(b.deaths).toBe(1);
    expect(a.kills).toBe(1);
    expect(a.streak).toBe(1);
    expect(a.alive).toBe(true);
  });

  it("自己掉下去不算别人击杀，1.2s 后带无敌重组", () => {
    const s = createMatch({ seed: 8, botCount: 1 });
    const p = getPlayer(s, "p0");
    place(p, 0, -1, 0);
    p.vy = -20;

    let koT = -1;
    let respawnT = -1;
    for (let i = 0; i < 60 * 5 && respawnT < 0; i++) {
      step(s, {}, DT);
      for (const e of s.events) {
        if (e.type === "ko" && e.id === "p0" && koT < 0) koT = e.t;
        if (e.type === "respawn" && e.id === "p0" && respawnT < 0) respawnT = e.t;
      }
      if (koT >= 0 && respawnT < 0) {
        expect(p.alive).toBe(false);
        expect(p.respawnT).toBeGreaterThan(0);
      }
    }

    expect(koT).toBeGreaterThan(0);
    expect(p.deaths).toBe(1);
    expect(getPlayer(s, "b0").kills).toBe(0); // 自己摔的不给别人计分
    expect(respawnT - koT).toBeCloseTo(s.config.respawnDelay, 1);
    expect(p.alive).toBe(true);
    expect(p.invulnT).toBeCloseTo(s.config.invulnTime, 5);
    expect(p.knockScale).toBe(1);
    expect(Math.hypot(p.x, p.z)).toBeLessThan(s.config.arenaRadius);
  });

  it("连胜被自己摔断", () => {
    const s = createMatch({ seed: 8, botCount: 1 });
    const p = getPlayer(s, "p0");
    p.streak = 3;
    place(p, 0, -7.9, 0);
    run(s, {}, 0.2);
    expect(p.alive).toBe(false);
    expect(p.streak).toBe(0);
  });

  it("大冲量直接把人打出去", () => {
    const s = createMatch({ seed: 8, botCount: 1 });
    const a = getPlayer(s, "p0");
    const b = getPlayer(s, "b0");
    place(a, 0, 0, 0);
    place(b, 10, 0, 0);
    b.invulnT = 0;
    applyKnockback(s, b, 30, 4, 0, "p0");
    run(s, {}, 4);
    expect(b.deaths).toBe(1);
    expect(a.kills).toBe(1);
  });
});

/**
 * 无敌帧只在 `step.tickTimers` 里递减，combat 的 simDrivenPlayer 分支不再重复扣。
 * 少扣一处就是「重组之后永久无敌」——所有人都被 `isTargetable` 踢出命中列表，
 * 满场只剩 slapWhiff；多扣一处则无敌帧缩水一半。这两条都用「掌真的打中了没」来锁。
 */
describe("无敌帧倒计时", () => {
  const COTTON = REAL_GLOVE_BY_ID.cotton;
  const SLAP = { p0: { ...ZERO_INPUT, slap: true, yaw: FACE_PLUS_X } };

  /** 摆成必中的对扇位。只动位置与攻击者的无敌，挨扇的一方 invulnT 原样保留。 */
  function faceOff(a, b) {
    place(a, 0, 0, 0, FACE_PLUS_X);
    place(b, 2, 0, 0);
    a.invulnT = 0;
    a.attack.phase = "idle";
    a.attack.t = 0;
    a.slapCd = 0;
  }

  it("重组的无敌帧会自己走完：等满 invulnTime 之后同一记掌必须打中", () => {
    const s = createMatch({ seed: 8, botCount: 1 });
    const a = getPlayer(s, "p0");
    const b = getPlayer(s, "b0");

    // 自己摔下去 -> respawnDelay 之后带满额无敌重组
    place(b, 0, -7.9, 0);
    run(s, {}, s.config.respawnDelay + 0.2);
    expect(b.alive).toBe(true);
    expect(b.invulnT).toBeGreaterThan(0);

    // 同一记掌第一次落在无敌帧里：只挥空
    faceOff(a, b);
    run(s, SLAP, COTTON.windup + 0.02);
    expect(b.hitsTaken).toBe(0);
    expect(b.invulnT).toBeGreaterThan(0);

    // 等过 invulnTime + ε，无敌必须真的归零（没人减 = 永久无敌）
    run(s, {}, s.config.invulnTime + 4 * DT);
    expect(b.invulnT).toBe(0);

    // 同一记掌第二次必须打中
    faceOff(a, b);
    run(s, SLAP, COTTON.windup + 0.02);
    expect(b.hitsTaken).toBe(1);
    expect(b.vx).toBeGreaterThan(3);
  });

  it("无敌帧按真实时长走完，不多扣也不少扣", () => {
    const s = createMatch({ seed: 8, botCount: 0, phase: "arena" });
    const p = getPlayer(s, "p0");
    place(p, 0, 0, 0);
    p.invulnT = s.config.invulnTime;

    // 差一帧还在，满一帧就归零
    run(s, {}, s.config.invulnTime - 2 * DT);
    expect(p.invulnT).toBeGreaterThan(0);
    expect(p.invulnT).toBeCloseTo(2 * DT, 5);
    run(s, {}, 3 * DT);
    expect(p.invulnT).toBe(0);
  });

  it("过门落地的无敌同样会结束", () => {
    const s = createMatch({ seed: 8, botCount: 1, phase: "hub" });
    const p = getPlayer(s, "p0");
    const bot = getPlayer(s, "b0");

    enterArena(s, p);
    expect(s.phase).toBe("arena");
    expect(p.invulnT).toBeCloseTo(s.config.invulnTime, 5);

    run(s, {}, s.config.invulnTime + 4 * DT);
    expect(p.invulnT).toBe(0);

    // 归零之后真的能被扇到：bot 站台上照着人扇一记
    place(bot, 0, 0, 0, FACE_PLUS_X);
    place(p, 2, 0, 0);
    bot.invulnT = 0;
    run(s, { b0: { ...ZERO_INPUT, slap: true, yaw: FACE_PLUS_X } }, COTTON.windup + 0.02);
    expect(p.hitsTaken).toBe(1);
  });
});

describe("碎地", () => {
  it("台块 HP 可被削，归零消失，脚下变空", () => {
    const s = createMatch({ seed: 6, botCount: 0 });
    const before = s.arena.tiles.find((t) => t.alive);
    const r1 = damageTileAt(s, before.x, before.z, 10);
    expect(r1.broken).toBe(false);
    expect(before.hp).toBe(before.maxHp - 10);

    const r2 = damageTileAt(s, before.x, before.z, 1e4);
    expect(r2.broken).toBe(true);
    expect(before.alive).toBe(false);
    expect(hasFloorUnder(s, before.x, before.z)).toBe(false);
    expect(s.arena.brokenCount).toBe(1);
    expect(s.stats.tilesBroken).toBe(1);
    expect(s.events.some((e) => e.type === "tileBreak" && e.i === before.i)).toBe(true);
  });

  it("站在洞上会掉下去并算死", () => {
    const s = createMatch({ seed: 6, botCount: 0 });
    const p = getPlayer(s, "p0");
    place(p, 0.1, 0, 0.1);
    // 掏空脚下一片
    for (const t of s.arena.tiles) {
      if (Math.hypot(t.x - p.x, t.z - p.z) < 4) damageTileAt(s, t.x, t.z, 1e4);
    }
    run(s, {}, 1.4);
    expect(p.alive).toBe(false);
    expect(p.deaths).toBe(1);
  });

  it("走出台缘无支撑就判死，不等掉到 fallY", () => {
    const s = createMatch({ seed: 6, botCount: 0 });
    const p = getPlayer(s, "p0");
    place(p, s.config.arenaRadius + 0.21, 0, 0);
    p.invulnT = 0;
    p.grounded = false;

    step(s, {}, DT);
    expect(p.alive).toBe(false);
    expect(p.deaths).toBe(1);
    expect(p.y).toBeGreaterThan(s.config.fallY); // 判死时人还远没掉到 -8
    expect(p.respawnT).toBeCloseTo(s.config.respawnDelay, 5);

    // 站在台上（有支撑）不受这条规则影响
    const q = createMatch({ seed: 6, botCount: 0 });
    const r = getPlayer(q, "p0");
    place(r, 0, 0, 0);
    run(q, {}, 0.5);
    expect(r.alive).toBe(true);
  });

  it("出生点被打碎时改到还有台的地方重组，不会连环摔", () => {
    const s = createMatch({ seed: 6, botCount: 1 });
    const p = getPlayer(s, "p0");
    // 把出生点周围整片掏空
    for (const t of s.arena.tiles) {
      if (Math.hypot(t.x - p.x, t.z - p.z) < 6) damageTileAt(s, t.x, t.z, 1e4);
    }
    p.y = -20;
    run(s, {}, 0.1);
    expect(p.alive).toBe(false);

    run(s, {}, s.config.respawnDelay + 0.1);
    expect(p.alive).toBe(true);
    expect(hasFloorUnder(s, p.x, p.z)).toBe(true);

    run(s, {}, 2);
    expect(p.alive).toBe(true);
    expect(p.deaths).toBe(1); // 没有二次摔死
  });

  it("磐石砸地（quake_slam）能砸出裂纹", () => {
    const s = createMatch({ seed: 6, botCount: 1, gloveId: "granite" });
    const a = getPlayer(s, "p0");
    const b = getPlayer(s, "b0");
    place(a, 0, 0, 0, FACE_PLUS_X);
    place(b, 2, 0, 0);
    a.invulnT = 0;
    b.invulnT = 0;
    step(s, { p0: input({ skill: true, yaw: FACE_PLUS_X }) }, DT);
    expect(s.events.some((e) => e.type === "skill")).toBe(true);
    const damaged = s.arena.tiles.some((t) => t.hp < t.maxHp);
    expect(damaged).toBe(true);
  });

  it("砸碎的台块会记账到 brokenCount / stats，并发 tileBreak", () => {
    const s = createMatch({ seed: 6, botCount: 0, gloveId: "granite" });
    const a = getPlayer(s, "p0");
    place(a, 0, 0, 0);
    // 先把落点附近削到只剩一口气，一次砸地就能塌
    for (const t of s.arena.tiles) {
      if (Math.hypot(t.x, t.z) < 4) damageTileAt(s, t.x, t.z, t.maxHp - 1);
    }
    const brokenBefore = s.arena.brokenCount;
    step(s, { p0: input({ skill: true }) }, DT);

    expect(s.arena.brokenCount).toBeGreaterThan(brokenBefore);
    expect(s.stats.tilesBroken).toBe(s.arena.brokenCount);
    expect(s.events.some((e) => e.type === "tileBreak")).toBe(true);
    expect(hasFloorUnder(s, 0, 0)).toBe(false);
  });
});

describe("getView / isMatchOver", () => {
  it("view 是纯 JSON，无函数", () => {
    const s = createMatch({ seed: 12 });
    run(s, { p0: input({ moveX: 1, slap: true }) }, 0.5);
    const v = getView(s);
    expect(JSON.parse(JSON.stringify(v))).toEqual(v);
    const walk = (o) => {
      for (const k of Object.keys(o)) {
        const val = o[k];
        expect(typeof val).not.toBe("function");
        if (val && typeof val === "object") walk(val);
      }
    };
    walk(v);
    expect(v.players).toHaveLength(4);
    expect(v.arena.tiles.length).toBeGreaterThan(100);
    expect(v.config.arenaRadius).toBe(20);
  });

  it("view 与 state 不共享可变引用", () => {
    const s = createMatch({ seed: 12, botCount: 0 });
    const v = getView(s);
    v.players[0].x = 999;
    v.arena.tiles[0].alive = false;
    expect(s.players[0].x).not.toBe(999);
    expect(s.arena.tiles[0].alive).toBe(true);
  });

  it("先到击杀数结束对局，不等 step 也能读出来", () => {
    const s = createMatch({ seed: 13, botCount: 1 });
    const p = getPlayer(s, "p0");

    p.kills = s.config.killsToWin - 1;
    expect(isMatchOver(s).over).toBe(false);

    p.kills = s.config.killsToWin;
    expect(isMatchOver(s)).toMatchObject({ over: true, winnerId: "p0", reason: "kills" });
    expect(s.match.over).toBe(false); // 还没 step，尚未锁定

    step(s, {}, DT);
    expect(s.match.over).toBe(true); // step 里锁定
    expect(s.match.winnerId).toBe("p0");
    expect(s.events.some((e) => e.type === "matchOver")).toBe(true);
    expect(isMatchOver(s)).toMatchObject({ over: true, winnerId: "p0", reason: "kills" });
  });

  it("时间到按击杀数判胜", () => {
    const s = createMatch({ seed: 13, botCount: 1, config: { matchSeconds: 0.5 } });
    getPlayer(s, "b0").kills = 2;
    run(s, {}, 0.6);
    const r = isMatchOver(s);
    expect(r.over).toBe(true);
    expect(r.winnerId).toBe("b0");
    expect(r.reason).toBe("time");
    expect(getView(s).match.secondsLeft).toBe(0);
  });
});

describe("变长 dt", () => {
  it("大 dt 自动切子步，结果与 60Hz 接近", () => {
    const a = createMatch({ seed: 21, botCount: 0 });
    const b = createMatch({ seed: 21, botCount: 0 });
    const inp = { p0: input({ moveX: 1, moveZ: 0.4 }) };
    for (let i = 0; i < 60; i++) step(a, inp, DT);
    for (let i = 0; i < 10; i++) step(b, inp, DT * 6);
    const pa = getPlayer(a, "p0");
    const pb = getPlayer(b, "p0");
    expect(Math.abs(pa.x - pb.x)).toBeLessThan(0.05);
    expect(Math.abs(pa.z - pb.z)).toBeLessThan(0.05);
  });

  it("dt 缺省用 config.dt，异常 dt 被夹住", () => {
    const s = createMatch({ seed: 21, botCount: 0 });
    step(s, {});
    expect(s.time).toBeCloseTo(DT, 6);
    step(s, {}, 100);
    expect(s.time).toBeLessThan(1);
    step(s, {}, -5);
    expect(Number.isFinite(s.time)).toBe(true);
  });
});

describe("安全区 hub", () => {
  const hubInput = (over = {}) => ({ ...HUB_ZERO_INPUT, ...over });

  function hubMatch(over = {}) {
    return createMatch({ seed: 31, botCount: 1, ...over });
  }

  function pedestalOf(state, gloveId) {
    return state.hub.pedestals.find((ped) => ped.gloveId === gloveId);
  }

  /** 站到台座外侧一步远（台座本身是实体，站不进去） */
  function standBy(p, ped) {
    place(p, ped.x + (ped.x < 0 ? 1.4 : -1.4), 0, ped.z);
  }

  it("默认 phase=hub；skipHub / phase:'arena' 让旧探针直接进岛", () => {
    expect(hubMatch().phase).toBe("hub");
    expect(hubMatch({ phase: "arena" }).phase).toBe("arena");
    expect(hubMatch({ skipHub: true }).phase).toBe("arena");

    const s = hubMatch({ config: { skipHub: true } });
    expect(s.phase).toBe("arena");
    const p = getPlayer(s, "p0");
    expect(playerInHub(s, p)).toBe(false);
    expect(hasFloorUnder(s, p.x, p.z)).toBe(true);
  });

  it("interact 是可选输入键：ZERO_INPUT 形状不变，HUB_ZERO_INPUT 才多两个键", () => {
    expect(Object.keys(ZERO_INPUT)).not.toContain("interact");
    expect(HUB_ZERO_INPUT.interact).toBe(false);
    expect(HUB_ZERO_INPUT.interactSlot).toBe(null);
    for (const k of Object.keys(ZERO_INPUT)) expect(HUB_ZERO_INPUT).toHaveProperty(k);
  });

  it("走道里能走，撞到隐形墙就停，不会掉出去", () => {
    const s = hubMatch();
    const p = getPlayer(s, "p0");
    const from = { x: p.x, z: p.z };

    run(s, { p0: hubInput({ moveZ: -1 }) }, 1.0);
    expect(p.z).toBeLessThan(from.z - 4); // 朝走道深处走出去了
    expect(p.alive).toBe(true);
    expect(p.grounded).toBe(true);

    // 一路撞侧墙：被挡住，人还在
    run(s, { p0: hubInput({ moveX: 1 }) }, 3);
    const layout = s.hub.layout;
    expect(p.x).toBeLessThanOrEqual(layout.origin.x + layout.walkway.halfWidth + 1e-6);
    expect(p.alive).toBe(true);
    expect(p.deaths).toBe(0);
  });

  it("安全区没有掉落 KO：整块裂岛碎光也不掉出局", () => {
    const s = hubMatch();
    const p = getPlayer(s, "p0");
    for (const t of s.arena.tiles) damageTileAt(s, t.x, t.z, 1e4);
    expect(hasFloorUnder(s, p.x, p.z)).toBe(false); // 脚下确实没有台块

    run(s, { p0: hubInput({ moveZ: -1, jump: true }) }, 3);
    expect(p.alive).toBe(true);
    expect(p.deaths).toBe(0);
    expect(p.y).toBe(s.hub.layout.floorY);
  });

  it("安全区不吃击退", () => {
    const s = hubMatch();
    const a = getPlayer(s, "p0");
    const b = getPlayer(s, "b0");
    // 把 bot 也搬进走道，正面站在人前 2m（yaw=0 面向 -Z）
    place(b, a.x, 0, a.z - 2);
    b.invulnT = 0;
    a.invulnT = 0;
    expect(playerInHub(s, b)).toBe(true);

    run(s, { p0: hubInput({ slap: true, yaw: 0 }) }, 0.6);
    expect(Math.hypot(b.vx, b.vz)).toBeLessThan(0.05);
    expect(b.hitsTaken).toBe(0);
    expect(b.knockScale).toBe(1);

    // 直接灌冲量也一样不动
    expect(applyKnockback(s, b, 30, 4, 0, "p0")).toBe(0);
    expect(b.vx).toBe(0);
    expect(b.alive).toBe(true);
  });

  it("安全区不碎地：在走道里砸地，裂岛台面一块没掉血", () => {
    const s = hubMatch({ gloveId: "granite", unlocked: "all" });
    const p = getPlayer(s, "p0");
    expect(playerInHub(s, p)).toBe(true);

    run(s, { p0: hubInput({ skill: true }) }, 0.5);
    expect(s.arena.tiles.every((t) => t.hp === t.maxHp && t.alive)).toBe(true);
    expect(s.stats.tilesBroken).toBe(0);
    expect(s.arena.brokenCount).toBe(0);
  });

  it("靠近台座给焦点，interact 先装主掌再装副掌", () => {
    const s = hubMatch({ unlocked: ["cotton", "frost", "magnet"] });
    const p = getPlayer(s, "p0");

    standBy(p, pedestalOf(s, "frost"));
    step(s, { p0: hubInput() }, DT); // 只靠近，不按键
    expect(getView(s).hub.focusGloveId).toBe("frost");
    expect(s.hub.mainGloveId).toBe(null);
    expect(getView(s).hub.portalReady).toBe(false);

    step(s, { p0: hubInput({ interact: true }) }, DT);
    expect(s.hub.mainGloveId).toBe("frost");
    expect(p.gloveId).toBe("frost");
    expect(s.hub.portalReady).toBe(true);
    expect(s.events.some((e) => e.type === "hubEquip" && e.slot === "main")).toBe(true);

    // 走到另一座：先主后副，第二只掌进副掌槽
    standBy(p, pedestalOf(s, "magnet"));
    step(s, { p0: hubInput() }, DT);
    step(s, { p0: hubInput({ interact: true }) }, DT);
    expect(s.hub.mainGloveId).toBe("frost");
    expect(s.hub.offGloveId).toBe("magnet");
    expect(p.gloveId).toBe("frost");
    expect(p.offhandId).toBe("magnet");

    const view = getView(s);
    expect(view.hub.pedestals.find((x) => x.gloveId === "frost")).toMatchObject({
      selected: true,
      slot: "main",
    });
    expect(view.hub.pedestals.find((x) => x.gloveId === "magnet")).toMatchObject({
      selected: true,
      slot: "off",
    });
    expect(view.hub.pedestals.filter((x) => x.selected)).toHaveLength(2);
  });

  it("再按一次副掌台座就提为主掌，原主掌退到副掌", () => {
    const s = hubMatch({ unlocked: ["cotton", "frost", "magnet"] });
    const p = getPlayer(s, "p0");

    standBy(p, pedestalOf(s, "frost"));
    step(s, { p0: hubInput({ interact: true }) }, DT);
    standBy(p, pedestalOf(s, "magnet"));
    step(s, { p0: hubInput() }, DT);
    step(s, { p0: hubInput({ interact: true }) }, DT);
    expect([s.hub.mainGloveId, s.hub.offGloveId]).toEqual(["frost", "magnet"]);

    step(s, { p0: hubInput() }, DT);
    step(s, { p0: hubInput({ interact: true }) }, DT);
    expect([s.hub.mainGloveId, s.hub.offGloveId]).toEqual(["magnet", "frost"]);
    expect(p.gloveId).toBe("magnet");
    expect(p.offhandId).toBe("frost");
  });

  it("interactSlot 可以直接指定槽位", () => {
    const s = hubMatch({ unlocked: "all" });
    const p = getPlayer(s, "p0");
    standBy(p, pedestalOf(s, "meteor"));
    step(s, { p0: hubInput({ interact: true, interactSlot: "off" }) }, DT);
    expect(s.hub.offGloveId).toBe("meteor");
    expect(s.hub.mainGloveId).toBe(null);
    expect(s.hub.portalReady).toBe(false); // 只有副掌，门还不开
  });

  it("未解锁的掌选不中，只发 hubLocked", () => {
    const s = hubMatch(); // 缺省只解锁 unlock:"default" 的木棉
    const p = getPlayer(s, "p0");
    const granite = pedestalOf(s, "granite");
    expect(granite.unlocked).toBe(false);
    expect(pedestalOf(s, "cotton").unlocked).toBe(true);

    standBy(p, granite);
    step(s, { p0: hubInput({ interact: true }) }, DT);
    expect(s.hub.mainGloveId).toBe(null);
    expect(p.gloveId).not.toBe("granite");
    const locked = s.events.find((e) => e.type === "hubLocked");
    expect(locked).toMatchObject({ gloveId: "granite", unlock: "unlock_granite" });

    // 换到已解锁的台座（松手一帧制造新的边沿）就能选
    standBy(p, pedestalOf(s, "cotton"));
    step(s, { p0: hubInput() }, DT);
    step(s, { p0: hubInput({ interact: true }) }, DT);
    expect(s.hub.mainGloveId).toBe("cotton");
  });

  it("没选主掌时靠近传送门只提示，不进岛", () => {
    const s = hubMatch();
    const p = getPlayer(s, "p0");
    const portal = s.hub.layout.portal;
    place(p, portal.x, 0, portal.z);

    step(s, { p0: hubInput() }, DT);
    expect(s.phase).toBe("hub");
    expect(s.events.find((e) => e.type === "hubPortalNear")).toMatchObject({ ready: false });

    run(s, { p0: hubInput({ interact: true }) }, 1);
    expect(s.phase).toBe("hub");
    expect(getPlayer(s, "p0").kills).toBe(0);
  });

  it("选完主掌走到传送门 -> phase=arena，落在裂岛出生点，loadout 保留", () => {
    const s = createMatch({
      seed: 33,
      botCount: 1,
      gloveId: "frost",
      offhandId: "magnet",
      unlocked: "all",
    });
    const p = getPlayer(s, "p0");
    expect(s.phase).toBe("hub");
    expect(getView(s).hub.portalReady).toBe(true);

    run(s, { p0: hubInput() }, 2); // 在大厅里磨蹭两秒，不该吃掉对局时长

    let entered = null;
    for (let i = 0; i < 60 * 10 && !entered; i++) {
      step(s, { p0: hubInput({ moveZ: -1 }) }, DT);
      entered = s.events.find((e) => e.type === "enterArena") || null;
    }

    expect(entered).not.toBeNull();
    expect(s.phase).toBe("arena");
    expect(playerInHub(s, p)).toBe(false);
    expect(Math.hypot(p.x, p.z)).toBeLessThan(s.config.arenaRadius);
    expect(hasFloorUnder(s, p.x, p.z)).toBe(true);
    expect(p.gloveId).toBe("frost");
    expect(p.offhandId).toBe("magnet");

    const view = getView(s);
    expect(view.phase).toBe("arena");
    expect(view.match.secondsLeft).toBeCloseTo(s.config.matchSeconds, 3);
    expect(view.hub.portalReady).toBe(true);
  });

  it("进岛之后裂岛规则照旧：会吃击退、会掉出局", () => {
    const s = hubMatch({ gloveId: "cotton", unlocked: "all" });
    enterArena(s);
    expect(s.phase).toBe("arena");

    const p = getPlayer(s, "p0");
    p.invulnT = 0;
    place(p, s.config.arenaRadius + 0.21, 0, 0);
    p.grounded = false;
    step(s, {}, DT);
    expect(p.alive).toBe(false);
    expect(p.deaths).toBe(1);
  });

  it("enterHub 能把人送回安全区再选（Round 2 回程）", () => {
    const s = hubMatch({ gloveId: "frost", unlocked: "all" });
    enterArena(s);
    expect(s.phase).toBe("arena");

    enterHub(s);
    const p = getPlayer(s, "p0");
    expect(s.phase).toBe("hub");
    expect(playerInHub(s, p)).toBe(true);
    expect(p.gloveId).toBe("frost"); // 装备保留
    expect(s.events.some((e) => e.type === "enterHub")).toBe(true);
  });

  it("getView 导出 phase / hub.pedestals / focusGloveId / portalReady", () => {
    const s = hubMatch();
    const v = getView(s);

    expect(v.phase).toBe("hub");
    expect(v.hub.focusGloveId).toBe(null);
    expect(v.hub.portalReady).toBe(false);
    expect(v.hub.pedestals).toHaveLength(8);
    expect(new Set(v.hub.pedestals.map((ped) => ped.gloveId)).size).toBe(8);
    expect(v.hub.pedestals.filter((ped) => ped.row === "left")).toHaveLength(4);
    expect(v.hub.pedestals.filter((ped) => ped.row === "right")).toHaveLength(4);

    for (const ped of v.hub.pedestals) {
      expect(Number.isFinite(ped.x + ped.y + ped.z + ped.yaw)).toBe(true);
      expect(typeof ped.selected).toBe("boolean");
      expect(ped.slot).toBe(null);
      expect(ped.name).toBeTruthy();
      expect(ped.color).toMatch(/^#/);
      expect(typeof ped.unlocked).toBe("boolean");
    }

    // 纯 JSON，和 state 不共享引用
    expect(JSON.parse(JSON.stringify(v))).toEqual(v);
    v.hub.pedestals[0].selected = true;
    expect(s.hub.pedestals[0].selected).toBe(null);
  });

  it("hub 状态可 structuredClone，同 seed 同输入结果一致", () => {
    const script = (i) => ({
      p0: hubInput({ moveX: Math.sin(i * 0.04), moveZ: -1, interact: i % 37 === 0 }),
    });
    const a = createMatch({ seed: 77, unlocked: "all" });
    const b = createMatch({ seed: 77, unlocked: "all" });
    for (let i = 0; i < 300; i++) {
      step(a, script(i), DT);
      step(b, script(i), DT);
    }
    expect(JSON.stringify(getView(a))).toBe(JSON.stringify(getView(b)));
    expect(() => structuredClone(a)).not.toThrow();
  });

  it("布局表可由 data 侧接管（src/data/hub.js 合入后走这条路）", () => {
    expect(getHubLayout().source).toBe("sim-default");
    expect(getDeps().usingDataHub).toBe(false);

    installHubLayout({
      id: "hub-from-data",
      origin: { x: 0, y: 0, z: -60 },
      spawn: { x: 0, y: 0, z: -48, yaw: 0 },
      portal: { x: 0, y: 0, z: -74, radius: 3 },
      pedestals: [
        { gloveId: "cotton", x: -3, y: 0, z: -55, yaw: 0, row: "left" },
        { gloveId: "frost", x: 3, y: 0, z: -55, yaw: 0, row: "right" },
      ],
    });
    expect(getDeps().usingDataHub).toBe(true);

    const s = createMatch({ seed: 41, unlocked: "all" });
    expect(s.hub.layout.id).toBe("hub-from-data");
    expect(s.hub.pedestals).toHaveLength(2);
    expect(getPlayer(s, "p0").z).toBeCloseTo(-48, 5);

    resetDeps();
    expect(getHubLayout().source).toBe("sim-default");
  });
});

describe("真身识别", () => {
  it("把真实 combat 再装一遍仍是生产路径：标志为真且走静态桥", () => {
    const before = getDeps().combat;
    installCombat(realCombat);
    const after = getDeps();
    expect(after.usingRealCombat).toBe(true);
    expect(after.combat.resolveSlap).toBe(before.resolveSlap);
    expect(after.combat.resolveSlap).toBe(bridge.resolveSlap);
  });

  it("只做转发的薄适配器也算真身（探针 / 装配层的老写法）", () => {
    const adapter = {
      resolveSlap: (s, a, g, now) => realCombat.resolveSlap(s, a, g, now),
      resolveSkill: (s, a, g, now) => realCombat.resolveSkill(s, a, g, now),
      tickStatuses: (s, dt) => realCombat.tickStatuses(s, dt),
      applyAwaken: (a, g) => realCombat.applyAwaken(a, g),
    };
    installCombat(adapter);
    expect(getDeps().usingRealCombat).toBe(true);
    expect(getDeps().combat.resolveSlap).toBe(bridge.resolveSlap);
  });

  it("认不出的替身才算替身：标志为假且真的被调到", () => {
    let called = 0;
    installCombat({
      resolveSlap: () => {
        called++;
        return { hits: [] };
      },
    });
    expect(getDeps().usingRealCombat).toBe(false);
    const s = createMatch({ seed: 7, botCount: 1, phase: "arena" });
    run(s, { p0: input({ slap: true }) }, 0.5);
    expect(called).toBeGreaterThan(0);
  });

  it("把真实 data（含被翻译过 skillId 的那份）再装一遍，usingRealData 保持真", () => {
    installData(realData);
    expect(getDeps().usingRealData).toBe(true);

    // 装配层 alignSkillIds 的产物：数值一字不差，只有 skillId 换成了 combat 词表
    const translated = REAL_GLOVES.map((g) => ({ ...g, skillId: combatSkillId(g.skillId) }));
    installData({ MATCH: realData.MATCH, GLOVES: translated });
    expect(getDeps().usingRealData).toBe(true);
    expect(getGloves()).toHaveLength(REAL_GLOVES.length);

    // 数值改了就是替身
    installData({ GLOVES: REAL_GLOVES.map((g) => ({ ...g, slapPower: 99 })) });
    expect(getDeps().usingRealData).toBe(false);
  });

  it("技能别名三套词表都认，空值归一成 none", () => {
    expect(combatSkillId("iron_pull")).toBe("magnetPull"); // data 词表
    expect(combatSkillId("magnetPull")).toBe("magnetPull"); // combat 词表
    expect(combatSkillId("pull")).toBe("magnetPull"); // 文档短名
    expect(combatSkillId(null)).toBe("none");
    expect(combatSkillId("none")).toBe("none");
    for (const g of REAL_GLOVES) {
      expect(normalizeSkillId(combatSkillId(g.skillId))).toBe(normalizeSkillId(g.skillId));
    }
  });
});
