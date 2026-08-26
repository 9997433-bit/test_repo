// sim 自测。tests/ 目录归 GPT-sol-1，这里只放 sim 内部单测（vite.config 已 include src/**/*.test.js）。

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, beforeEach } from "vitest";

import {
  createMatch,
  step,
  getView,
  isMatchOver,
  getPlayer,
  getMatchConfig,
  getGloves,
  damageTileAt,
  hasFloorUnder,
  applyKnockback,
  resetDeps,
  installData,
  installCombat,
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
  it("sim 不 import three，也不碰 DOM", () => {
    const files = readdirSync(HERE).filter((f) => f.endsWith(".js") && !f.endsWith(".test.js"));
    expect(files.length).toBeGreaterThan(5);
    for (const f of files) {
      const src = readFileSync(join(HERE, f), "utf8");
      expect(src, `${f} 不能 import three`).not.toMatch(/from\s+["']three/);
      expect(src, `${f} 不能用 document`).not.toMatch(/\bdocument\./);
      expect(src, `${f} 不能用 window`).not.toMatch(/\bwindow\./);
      expect(src, `${f} 不能用 requestAnimationFrame`).not.toMatch(/requestAnimationFrame/);
    }
  });

  it("data / combat 缺席时用兜底，注入后自动切换", () => {
    expect(getMatchConfig().arenaRadius).toBe(20);
    expect(getGloves().some((g) => g.id === "cotton")).toBe(true);

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
    const s = createMatch({ seed: 7, botCount: 1 });
    run(s, { p0: input({ slap: true }) }, 0.5);
    expect(called).toBeGreaterThan(0);
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

  it("所有人开局站在台上，脚下有台", () => {
    const s = createMatch({ seed: 9 });
    for (const p of s.players) {
      expect(p.alive).toBe(true);
      expect(Math.hypot(p.x, p.z)).toBeLessThan(s.config.arenaRadius);
      expect(hasFloorUnder(s, p.x, p.z)).toBe(true);
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

    run(s, { p0: input({ slap: true, yaw: FACE_PLUS_X }) }, 0.1);
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
    run(s, { p0: input({ slap: true, yaw: FACE_PLUS_X }) }, 0.12);
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
    run(s, { p0: input({ slap: true, yaw: FACE_PLUS_X }) }, 0.15);
    expect(a.awakenedT).toBeGreaterThan(7);
    expect(a.awakenedT).toBeLessThanOrEqual(s.config.awakenDuration);
    expect(a.meter).toBe(0);
    run(s, {}, s.config.awakenDuration + 0.2);
    expect(a.awakenedT).toBe(0);
  });
});

describe("换掌", () => {
  it("Q 切换主副掌，0.4s 收掌锁", () => {
    const s = createMatch({ seed: 2, botCount: 0, gloveId: "cotton", offhandId: "granite" });
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
    const s = createMatch({ seed: 2, botCount: 0, offhandId: "granite" });
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

  it("重击手套能砸出裂纹", () => {
    const s = createMatch({ seed: 6, botCount: 1, gloveId: "granite" });
    const a = getPlayer(s, "p0");
    const b = getPlayer(s, "b0");
    place(a, 0, 0, 0, FACE_PLUS_X);
    place(b, 2, 0, 0);
    a.invulnT = 0;
    b.invulnT = 0;
    run(s, { p0: input({ slap: true, yaw: FACE_PLUS_X }) }, 0.5);
    expect(s.events.length).toBeGreaterThanOrEqual(0);
    const damaged = s.arena.tiles.some((t) => t.hp < t.maxHp);
    expect(damaged).toBe(true);
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

  it("先到击杀数结束对局", () => {
    const s = createMatch({ seed: 13, botCount: 1 });
    getPlayer(s, "p0").kills = s.config.killsToWin;
    expect(isMatchOver(s).over).toBe(false);
    step(s, {}, DT);
    const r = isMatchOver(s);
    expect(r.over).toBe(true);
    expect(r.winnerId).toBe("p0");
    expect(r.reason).toBe("kills");
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
