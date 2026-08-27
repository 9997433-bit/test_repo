// 固定人物视角（ADR-38）落到 sim 这一侧的三件事：Input.yaw 的两种喂法、朝向驱动的
// 扇形判定、过门 / 重生的出生朝向。
//
// sim **不感知 lookMode**（契约 §1-11）：模式差异全在壳层怎么产出 `Input.yaw`，
// 这里只钉死 sim 认的那份语义——有限值直赋、非有限值保持。测试一律用 sim 空间的角
// （yaw=0 面向 -Z），不把相机系方位角引进来。
//
// 用户反馈「打别人打不到」的落点在下半场：出掌锥的前向必须就是 `p.yaw`，而且本 tick
// 转的身本 tick 就作数，不然看到的朝向和打出去的扇形对不上。
//
// locked 的「背后硬顶」不改 sim：那道钳位是相机层的事（`src/render/camera.js` 的
// behindHold），sim 既不认 lookMode 也不认硬顶，只看见壳层钳完之后送进来的那个有限
// `Input.yaw`，照样直赋。硬顶怎么调都不该在本目录留下 diff——要动的是壳层的产出口径，
// 不是 `step.js` 里那一行赋值。

import { beforeEach, afterEach, describe, expect, it } from "vitest";

import { GLOVE_BY_ID as REAL_GLOVE_BY_ID } from "../data/gloves.js";
import {
  createMatch,
  enterArena,
  enterHub,
  forwardX,
  forwardZ,
  getPlayer,
  getHubLayout,
  installHubLayout,
  playerInHub,
  resetDeps,
  rightX,
  rightZ,
  step,
  wrapAngle,
  yawFromDir,
  HUB_ZERO_INPUT,
  ZERO_INPUT,
} from "./index.js";

const DT = 1 / 60;
const COTTON = REAL_GLOVE_BY_ID.cotton;

/** 面向 +X 的 yaw（约定 yaw=0 面向 -Z） */
const FACE_PLUS_X = -Math.PI / 2;

function input(over = {}) {
  return { ...ZERO_INPUT, ...over };
}

/** 移动矢量的「算不算在走」阈值，与壳层 `input/index.js` 的 MOVE_EPS 同值 */
const MOVE_EPS = 1e-6;

/**
 * 手搓的 free 分派（契约 §14-34 free 半边的封闭表）：有位移送走向角、零位移送 null。
 * 这里**不** import `src/input`——sim 的测试不许把壳层拽进依赖图；真 `sample()` 的闭环
 * 由 `tests/look-round2-lk04.test.js` 与 probe 端到端跑，本文件只钉 sim 收到这两种值之后
 * 的行为。
 */
function freeInput(moveX, moveZ, over = {}) {
  const moving = Math.hypot(moveX, moveZ) > MOVE_EPS;
  return input({ moveX, moveZ, yaw: moving ? yawFromDir(moveX, moveZ) : null, ...over });
}

function hubInput(over = {}) {
  return { ...HUB_ZERO_INPUT, ...over };
}

function run(state, inputs, seconds, dt = DT) {
  const n = Math.round(seconds / dt);
  for (let i = 0; i < n; i++) step(state, inputs, dt);
  return state;
}

/** step 每帧清 events，攒一段时间的事件得自己收 */
function collect(state, inputs, seconds, dt = DT) {
  const out = [];
  const n = Math.round(seconds / dt);
  for (let i = 0; i < n; i++) {
    step(state, inputs, dt);
    out.push(...state.events);
  }
  return out;
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

/** 单位前向 · 两个 yaw 的夹角余弦，判「同向 / 背对」用 */
function facingDot(yaw, dx, dz) {
  const l = Math.hypot(dx, dz);
  return forwardX(yaw) * (dx / l) + forwardZ(yaw) * (dz / l);
}

beforeEach(() => {
  resetDeps();
});

afterEach(() => {
  resetDeps();
});

describe("locked：有限 Input.yaw 每 tick 直赋 p.yaw", () => {
  it("逐位相等，不平滑也不 wrap", () => {
    const s = createMatch({ seed: 3, botCount: 0, phase: "arena" });
    const p = getPlayer(s, "p0");

    // 含超出 (-PI, PI] 的角：locked 要的是「喂什么是什么」，收敛是壳层的事
    for (const yaw of [0, 0.3, -1.25, Math.PI, -Math.PI / 2, 4.5, -7.125, 0]) {
      step(s, { p0: input({ yaw }) }, DT);
      expect(p.yaw).toBe(yaw);
    }
  });

  it("一帧切成多子步也只留最后一次输入的值", () => {
    const s = createMatch({ seed: 3, botCount: 0, phase: "arena" });
    const p = getPlayer(s, "p0");
    step(s, { p0: input({ yaw: 1.5, moveX: 1 }) }, DT * 4);
    expect(p.yaw).toBe(1.5);
  });

  it("移动不改写朝向：横着走时面向仍是喂进来的角", () => {
    const s = createMatch({ seed: 3, botCount: 0, phase: "arena" });
    const p = getPlayer(s, "p0");
    place(p, 0, 0, 0, FACE_PLUS_X);
    run(s, { p0: input({ moveX: 0, moveZ: 1, yaw: FACE_PLUS_X }) }, 0.5);
    expect(p.yaw).toBe(FACE_PLUS_X); // 走的是 +Z，脸还朝 +X
    expect(p.z).toBeGreaterThan(0.5);
  });

  it("安全区里照样能转向：空挥闸只拦出招，不拦看", () => {
    const s = createMatch({ seed: 0x4f31, botCount: 0 });
    const p = getPlayer(s, "p0");
    expect(playerInHub(s, p)).toBe(true);

    const seen = [];
    for (const yaw of [0.4, 1.1, -2.2]) {
      step(s, { p0: hubInput({ yaw, slap: true }) }, DT);
      seen.push(...s.events.map((e) => e.type));
      expect(p.yaw).toBe(yaw);
    }
    expect(seen).not.toContain("slapStart");
    expect(seen).not.toContain("slap");
    expect(s.stats.slaps).toBe(0);
    expect(p.attack.phase).toBe("idle");
  });
});

describe("free：yaw 为空时不覆盖朝向", () => {
  it("yaw: null 且一路推移动键，p.yaw 一动不动", () => {
    const s = createMatch({ seed: 3, botCount: 0, phase: "arena" });
    const p = getPlayer(s, "p0");
    place(p, 0, 0, 0, 1.234);
    run(s, { p0: input({ moveX: 1, moveZ: -1, yaw: null }) }, 1);
    expect(p.yaw).toBe(1.234);
    expect(Math.hypot(p.x, p.z)).toBeGreaterThan(1); // 人确实走了
  });

  it("干脆不给 yaw 键也一样（ZERO_INPUT 补的就是 null）", () => {
    const s = createMatch({ seed: 3, botCount: 0, phase: "arena" });
    const p = getPlayer(s, "p0");
    place(p, 0, 0, 0, -0.75);
    run(s, { p0: { moveX: 1 } }, 0.5);
    expect(p.yaw).toBe(-0.75);
  });

  it("非有限值（NaN / undefined / 字符串）一律当没给", () => {
    const s = createMatch({ seed: 3, botCount: 0, phase: "arena" });
    const p = getPlayer(s, "p0");
    place(p, 0, 0, 0, 0.5);
    for (const yaw of [NaN, undefined, "1.2", Infinity, null]) {
      step(s, { p0: input({ yaw }) }, DT);
      expect(p.yaw).toBe(0.5);
    }
  });

  it("壳层按位移方向送 yawFromDir 时，人就面朝走向", () => {
    const s = createMatch({ seed: 3, botCount: 0, phase: "arena" });
    const p = getPlayer(s, "p0");
    place(p, 0, 0, 0, 0);

    for (const [mx, mz] of [[1, 0], [0, 1], [-1, -1], [0.6, -0.8]]) {
      const yaw = yawFromDir(mx, mz);
      step(s, { p0: input({ moveX: mx, moveZ: mz, yaw }) }, DT);
      expect(p.yaw).toBe(yaw);
      expect(facingDot(p.yaw, mx, mz)).toBeCloseTo(1, 6);
    }
  });
});

// 上面几条是单帧语义；这一组是 free 的**整段**行为：壳层每帧按走向 / 静止分派，连着喂进
// step 之后，人物面向要一路贴着实际走向，松手之后停在最后那个角上（LK-04 的 sim 半边）。
describe("free 集成：按走向分派连着喂，朝向一路跟到位", () => {
  it("一路直走：每帧 p.yaw 都是走向角，走出来的位移方向就是面向", () => {
    const s = createMatch({ seed: 3, botCount: 0, phase: "arena" });
    const p = getPlayer(s, "p0");
    place(p, 0, 0, 0, 2.5); // 起手朝向与走向无关，free 下由壳层的走向角接管

    const cmd = freeInput(0.6, -0.8);
    const from = { x: p.x, z: p.z };
    for (let i = 0; i < 60; i++) {
      step(s, { p0: cmd }, DT);
      expect(p.yaw).toBe(cmd.yaw); // 逐帧逐位相等：sim 直赋，不平滑
    }

    expect(Math.hypot(p.x - from.x, p.z - from.z)).toBeGreaterThan(1);
    expect(facingDot(p.yaw, p.x - from.x, p.z - from.z)).toBeCloseTo(1, 6);
  });

  it("拐弯：换走向那一帧朝向就跟着换，速度随后收敛到新面向", () => {
    const s = createMatch({ seed: 3, botCount: 0, phase: "arena" });
    const p = getPlayer(s, "p0");
    place(p, 0, 0, 0, 0);

    const east = freeInput(1, 0);
    const north = freeInput(0, 1);
    run(s, { p0: east }, 0.5);
    expect(p.yaw).toBe(east.yaw);

    step(s, { p0: north }, DT);
    expect(p.yaw).toBe(north.yaw); // 惯性还在往 +X 滑，面向已经先转过去了
    run(s, { p0: north }, 1);
    expect(facingDot(p.yaw, p.vx, p.vz)).toBeGreaterThan(0.99);
  });

  it("松手：零位移送 null，朝向停在最后的走向上，不回弹也不归零", () => {
    const s = createMatch({ seed: 3, botCount: 0, phase: "arena" });
    const p = getPlayer(s, "p0");
    place(p, 0, 0, 0, -2.1);

    const cmd = freeInput(-0.4, -0.9);
    run(s, { p0: cmd }, 0.5);
    const travelYaw = p.yaw;
    expect(travelYaw).toBe(cmd.yaw);

    const at = { x: p.x, z: p.z };
    run(s, { p0: freeInput(0, 0) }, 1.5);
    expect(p.yaw).toBe(travelYaw);
    expect(Math.hypot(p.x - at.x, p.z - at.z)).toBeGreaterThan(0); // 惯性滑了一段，脸没动
    expect(Math.hypot(p.vx, p.vz)).toBeLessThan(0.05); // 也确实停住了
  });

  it("按键对冲的零矢量必须落回 null：yawFromDir(0,0) 是 -PI，喂进来就是原地翻身", () => {
    expect(yawFromDir(0, 0)).toBe(-Math.PI); // 分派表要挡的就是这个值
    expect(freeInput(0, 0).yaw).toBe(null);

    const s = createMatch({ seed: 3, botCount: 0, phase: "arena" });
    const p = getPlayer(s, "p0");
    place(p, 0, 0, 0, 0.9);
    run(s, { p0: freeInput(0, 0) }, 0.5);
    expect(p.yaw).toBe(0.9);

    // 对照组：真把 -PI 喂进来，人就翻过去了——所以零位移只能送 null
    step(s, { p0: input({ yaw: yawFromDir(0, 0) }) }, DT);
    expect(p.yaw).toBe(-Math.PI);
  });

  it("走出来的朝向就是出掌前向：打得到人，且 reach 一分没多", () => {
    const reach = COTTON.slapRange + createMatch({ seed: 1, botCount: 0 }).config.playerRadius;

    /** 先在 free 下朝 +X 走一段，把面向交给走向；停稳后按 dist 摆靶再出掌 */
    function travelThenSlap(dist) {
      const s = createMatch({ seed: 5, botCount: 1, phase: "arena" });
      const a = getPlayer(s, "p0");
      const b = getPlayer(s, "b0");
      place(b, 0, 0, -12); // 先停在台面上远处等着：摆到台外它会掉下去 KO
      a.invulnT = 0;
      b.invulnT = 0;

      place(a, 0, 0, 0, Math.PI); // 起手背对 +X
      const walk = freeInput(1, 0);
      run(s, { p0: walk }, 0.5);
      expect(a.yaw).toBe(walk.yaw);
      place(a, a.x, 0, a.z, a.yaw); // 停稳，避免前摇里的滑步偷偷改距离

      place(b, a.x + forwardX(a.yaw) * dist, 0, a.z + forwardZ(a.yaw) * dist);
      b.invulnT = 0;
      // 静止出掌：yaw 送 null，靠的就是刚才走出来的那个面向
      run(s, { p0: freeInput(0, 0, { slap: true }) }, COTTON.windup + 0.05);
      expect(a.yaw).toBe(walk.yaw);
      return { s, a, b };
    }

    const near = travelThenSlap(reach - 0.3);
    expect(near.b.hitsTaken, "面朝走向的人应当打得到").toBeGreaterThan(0);

    const far = travelThenSlap(reach + 0.3);
    expect(far.b.hitsTaken, "free 不许靠放大 reach 来「打得到」").toBe(0);
  });

  it("大厅的空挥闸对 free 一视同仁：静止不出招，朝向也不被闸门改", () => {
    const s = createMatch({ seed: 0x4f31, botCount: 0 });
    const p = getPlayer(s, "p0");
    expect(playerInHub(s, p)).toBe(true);
    const yaw0 = p.yaw;

    const seen = collect(s, { p0: hubInput({ ...freeInput(0, 0), slap: true }) }, 0.5);
    expect(seen.map((e) => e.type)).not.toContain("slapStart");
    expect(s.stats.slaps).toBe(0);
    expect(p.attack.phase).toBe("idle");
    expect(p.yaw).toBe(yaw0);
  });
});

describe("扇击前向 = p.yaw（sim 空间）", () => {
  const REACH_PAD = 0.3;

  function duel(seed = 5) {
    const s = createMatch({ seed, botCount: 1, phase: "arena" });
    const a = getPlayer(s, "p0");
    const b = getPlayer(s, "b0");
    place(a, 0, 0, 0, FACE_PLUS_X);
    place(b, 40, 0, 40); // 先挪远，各用例自己摆位
    a.invulnT = 0;
    b.invulnT = 0;
    return { s, a, b };
  }

  /** 把 target 摆到 attacker 前向绕 `deg`（正数朝 right 一侧）、距离 dist 的位置 */
  function placeInSweep(target, attacker, deg, dist) {
    const t = (deg * Math.PI) / 180;
    const fx = forwardX(attacker.yaw);
    const fz = forwardZ(attacker.yaw);
    const rx = rightX(attacker.yaw);
    const rz = rightZ(attacker.yaw);
    const x = attacker.x + (fx * Math.cos(t) + rx * Math.sin(t)) * dist;
    const z = attacker.z + (fz * Math.cos(t) + rz * Math.sin(t)) * dist;
    place(target, x, 0, z);
    target.invulnT = 0;
  }

  function slapOnce(s, yaw) {
    run(s, { p0: input({ slap: true, yaw }) }, COTTON.windup + 0.05);
  }

  it("横扫范围内（含 right 一侧）打得到", () => {
    const half = COTTON.slapAngleDeg / 2;
    for (const deg of [0, half * 0.5, half * 0.9, -half * 0.9]) {
      const { s, a, b } = duel();
      placeInSweep(b, a, deg, 2.2);
      slapOnce(s, a.yaw);
      expect(b.hitsTaken, `偏 ${deg}° 应命中`).toBeGreaterThan(0);
      expect(s.stats.hits).toBeGreaterThan(0);
    }
  });

  it("正后方打不着，出的是空掌", () => {
    const { s, a, b } = duel();
    placeInSweep(b, a, 180, 2.2);
    const events = collect(s, { p0: input({ slap: true, yaw: a.yaw }) }, COTTON.windup + 0.05);
    expect(b.hitsTaken).toBe(0);
    expect(Math.hypot(b.vx, b.vz)).toBeLessThan(0.01);
    const slaps = events.filter((e) => e.type === "slap");
    expect(slaps.length).toBeGreaterThan(0);
    expect(slaps.every((e) => e.hits === 0)).toBe(true);
    expect(events.some((e) => e.type === "hit")).toBe(false);
  });

  it("锥外一点点也打不着：扇形半角就是 slapAngleDeg / 2", () => {
    const half = COTTON.slapAngleDeg / 2;
    for (const deg of [half + 8, -(half + 8)]) {
      const { s, a, b } = duel();
      placeInSweep(b, a, deg, 2.2);
      slapOnce(s, a.yaw);
      expect(b.hitsTaken, `偏 ${deg}° 不该命中`).toBe(0);
    }
  });

  it("够不着就是够不着：reach = slapRange + playerRadius，不许偷偷放大", () => {
    const reach = COTTON.slapRange + createMatch({ seed: 1, botCount: 0 }).config.playerRadius;

    const near = duel();
    placeInSweep(near.b, near.a, 0, reach - REACH_PAD);
    slapOnce(near.s, near.a.yaw);
    expect(near.b.hitsTaken).toBeGreaterThan(0);

    const far = duel();
    placeInSweep(far.b, far.a, 0, reach + REACH_PAD);
    slapOnce(far.s, far.a.yaw);
    expect(far.b.hitsTaken).toBe(0);
  });

  it("本 tick 转的身本 tick 就作数：转过去才打得到，不转就是空掌", () => {
    const target = { x: 2.2, z: 0 };
    const toward = yawFromDir(target.x, target.z); // 面向目标
    const away = yawFromDir(-target.x, -target.z); // 背对目标

    const miss = duel();
    place(miss.b, target.x, 0, target.z);
    miss.b.invulnT = 0;
    slapOnce(miss.s, away);
    expect(miss.b.hitsTaken).toBe(0);

    const hit = duel();
    place(hit.b, target.x, 0, target.z);
    hit.b.invulnT = 0;
    // 背对着起手，前摇里把镜头转回来（locked 每 tick 都在喂新角）
    step(hit.s, { p0: input({ slap: true, yaw: away }) }, DT);
    expect(hit.a.attack.phase).toBe("windup");
    slapOnce(hit.s, toward);
    expect(hit.b.hitsTaken).toBeGreaterThan(0);
    expect(hit.a.yaw).toBe(toward); // 出招那帧过了 combat 的 ±PI 换算，回来仍逐位相等
  });
});

// reach 的口径其实不住在 sim 里：combat 的 slapTargets 拿 `glove.slapRange` 加上**平铺在
// state 顶层**的 `state.playerRadius`——那是 createMatch 从 `config.playerRadius` 镜像过去的
// 一个字段，认不出就退回 combat 自己的 `ARENA.playerRadius`（0.7）。默认配置下这两个数正好
// 都是 0.7，所以上面那两条 ±0.3 的近 / 远用例在镜像被摘掉之后照样全绿：reach 真回退了也没人
// 报警（同目录早先就有过「删掉 combat 不读的 state.playerHeight 镜像」这种清理）。
// 这一组把口径钉死：边界精确到 1e-4，且 reach 必须跟着 sim 的 config 走。
describe("reach 不回退：sim 的 playerRadius 说了算，边界一分不多", () => {
  /** 面朝 yaw 站在原点，把靶子摆到正前方 dist 处，出一掌 */
  function slapAt(dist, { yaw = FACE_PLUS_X, playerRadius } = {}) {
    const s = createMatch({
      seed: 5,
      botCount: 1,
      phase: "arena",
      ...(playerRadius === undefined ? {} : { config: { playerRadius } }),
    });
    const a = getPlayer(s, "p0");
    const b = getPlayer(s, "b0");
    place(a, 0, 0, 0, yaw);
    place(b, forwardX(yaw) * dist, 0, forwardZ(yaw) * dist);
    a.invulnT = 0;
    b.invulnT = 0;
    run(s, { p0: input({ slap: true, yaw }) }, COTTON.windup + 0.05);
    return { s, a, b };
  }

  it("createMatch 把 config.playerRadius 镜像到 state 顶层给 combat 读", () => {
    for (const playerRadius of [undefined, 0.7, 1.4]) {
      const s = createMatch({
        seed: 1,
        botCount: 0,
        ...(playerRadius ? { config: { playerRadius } } : {}),
      });
      expect(s.playerRadius, "combat 的扇形判定读的就是这个平铺字段").toBe(s.config.playerRadius);
      if (playerRadius) expect(s.config.playerRadius).toBe(playerRadius);
    }
  });

  it("边界就落在 slapRange + playerRadius 上：里 1e-4 命中，外 1e-4 落空", () => {
    const reach = COTTON.slapRange + createMatch({ seed: 1, botCount: 0 }).config.playerRadius;
    const EPS = 1e-4; // 比上面那条 ±0.3 的粗锁紧三千倍，放大一毫米都会红

    // 换几个朝向：reach 是标量，不许随机位或象限漂
    for (const yaw of [0, 0.3, -1.25, Math.PI, FACE_PLUS_X, 2.4]) {
      expect(slapAt(reach - EPS, { yaw }).b.hitsTaken, `yaw=${yaw} 差一丝也该够得着`).toBeGreaterThan(0);
      expect(slapAt(reach + EPS, { yaw }).b.hitsTaken, `yaw=${yaw} 多一丝就该落空`).toBe(0);
    }
  });

  it("reach 跟着 sim 的 config 走，不是 combat 的兜底常量", () => {
    // 把身位加倍：reach 2.6+1.4=4.0。镜像掉了的话 combat 会退回 0.7 → 3.3，3.6 这一档就打不到了
    const wide = { playerRadius: 1.4 };
    expect(slapAt(3.6, wide).b.hitsTaken, "config 说 1.4 就得按 1.4 算").toBeGreaterThan(0);
    expect(slapAt(4.3, wide).b.hitsTaken, "超出 4.0 仍旧够不着，不许连带放大").toBe(0);

    // 对照组：同一个距离在默认身位（0.7 → reach 3.3）下必须落空，
    // 说明上面那一发是 config 抬起来的，不是本来就够得着
    expect(slapAt(3.6).b.hitsTaken).toBe(0);
  });
});

describe("过门 / 重生的出生朝向", () => {
  it("enterArena 后朝台心，不是背对", () => {
    for (const seed of [1, 7, 99]) {
      const s = createMatch({ seed, botCount: 1, gloveId: "cotton" });
      const p = getPlayer(s, "p0");
      enterArena(s, p);
      expect(Math.hypot(p.x, p.z)).toBeGreaterThan(0.5);
      expect(facingDot(p.yaw, -p.x, -p.z)).toBeCloseTo(1, 6);
    }
  });

  it("enterHub 后面向传送门，走道纵深在正前方", () => {
    const s = createMatch({ seed: 11, botCount: 1, gloveId: "cotton" });
    const p = getPlayer(s, "p0");
    enterArena(s, p);
    enterHub(s, p);

    const portal = s.hub.layout.portal;
    expect(facingDot(p.yaw, portal.x - p.x, portal.z - p.z)).toBeGreaterThan(0.99);
  });

  it("来回过门朝向稳定，不会随机拧 180°", () => {
    const s = createMatch({ seed: 5, botCount: 1, gloveId: "cotton" });
    const p = getPlayer(s, "p0");
    const portal = s.hub.layout.portal;
    const hubYaws = [];
    const arenaYaws = [];

    for (let i = 0; i < 3; i++) {
      enterArena(s, p);
      arenaYaws.push(p.yaw);
      expect(facingDot(p.yaw, -p.x, -p.z)).toBeCloseTo(1, 6);
      enterHub(s, p);
      hubYaws.push(p.yaw);
      expect(facingDot(p.yaw, portal.x - p.x, portal.z - p.z)).toBeGreaterThan(0.99);
    }

    // 走道出生点固定：每次回程都是同一个角
    expect(new Set(hubYaws).size).toBe(1);
    // 裂岛出生点带一点位置抖动，朝向跟着微调即可——绝不能出现翻面级别的跳变
    for (const yaw of arenaYaws) {
      expect(Math.abs(wrapAngle(yaw - arenaYaws[0]))).toBeLessThan(0.35);
    }
  });

  it("台面碎光的兜底落点（正压台心）保留原朝向，不钉成 -Z", () => {
    const s = createMatch({ seed: 2, botCount: 0, phase: "arena" });
    const p = getPlayer(s, "p0");
    for (const t of s.arena.tiles) t.alive = false;
    p.yaw = 1.234;
    enterArena(s, p);
    expect(p.x).toBe(0);
    expect(p.z).toBe(0);
    expect(p.yaw).toBe(1.234);
  });

  it("数据表没给 spawn.yaw：补出来的朝向面向传送门", () => {
    // 故意把门摆在出生点的 +Z 一侧（与内置走道反着来）
    installHubLayout({
      id: "hub-portal-plus-z",
      origin: { x: 0, y: 0, z: -60 },
      spawn: { x: 0, y: 0, z: -74 },
      portal: { x: 0, y: 0, z: -48, radius: 3 },
      walkway: { halfWidth: 7.5, minZ: -80, maxZ: -42 },
      pedestals: [{ gloveId: "cotton", x: -3, y: 0, z: -60, yaw: 0, row: "left" }],
    });

    const layout = getHubLayout();
    expect(facingDot(layout.spawn.yaw, 0, layout.portal.z - layout.spawn.z)).toBeCloseTo(1, 6);

    const s = createMatch({ seed: 4, botCount: 0, gloveId: "cotton" });
    const p = getPlayer(s, "p0");
    const portal = s.hub.layout.portal;
    expect(facingDot(p.yaw, portal.x - p.x, portal.z - p.z)).toBeGreaterThan(0.99);
  });

  it("数据表给了 spawn.yaw 就听数据表的", () => {
    installHubLayout({
      id: "hub-explicit-yaw",
      origin: { x: 0, y: 0, z: -60 },
      spawn: { x: 0, y: 0, z: -48, yaw: 0.6 },
      portal: { x: 0, y: 0, z: -74, radius: 3 },
      pedestals: [{ gloveId: "cotton", x: -3, y: 0, z: -55, yaw: 0, row: "left" }],
    });
    expect(getHubLayout().spawn.yaw).toBe(0.6);
  });
});
