// FT-07 受击硬直时序（验收线 FJ-04）。
//
// 一条硬直的完整一生：**挂载 → 期间只锁出招 → 到期精确清除**，每一步都钉死。
//
//   1. 挂载点在 `impact.js` 的 `landHit`，只有扇击这条路走。八掌主动技各带自己的
//      控制（冻结 / 减速 / 黏附 / 拉拽），再叠一层硬直就是双重上锁。
//   2. 时长 `HIT.hitstun` 与 `src/data/tuning.js` 的 `KNOCKBACK.hitstun` 同源，
//      ≤ `HIT.hitstunMax` 0.5s，且**严格短于最快那只掌的扇击冷却**——
//      挨打的人总要有一个能还手的空档，否则贴脸就是无限连。
//   3. 硬直只锁 `canAct`：`moveScale` 一点不动，击退位移照常把人送出岛。
//      这条与 `src/sim/physics.js` 的 `statusMods`（stun → canAct=false，canMove 照旧）
//      是同一口径，本文件直接拿 sim 那个函数复核，不在两边各写一套判读。
//
// 朝向按 combat 自己的方言摆位：yaw=0 面向 +Z；末尾那段走真 sim，按 sim 的 -Z 摆。

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { KNOCKBACK } from "../data/tuning.js";
import { statusMods } from "../sim/physics.js";
import { createMatch, resetDeps, step } from "../sim/index.js";
import {
  canSkill,
  canSlap,
  registerGloves,
  resolveSkill,
  resolveSlap,
  respawn,
  statusSnapshot,
  tickStatuses,
} from "./index.js";
import { FALLBACK_GLOVES, FALLBACK_GLOVE_BY_ID, HIT, STATUS_DEFAULT, STATUS_KINDS } from "./constants.js";
import { makePlayer, makeState, stepSim } from "./testkit.js";

const DT = 1 / 60;

/** 让 a 面朝 b（yaw=0 面向 +Z 的约定）。 */
function face(a, b) {
  a.yaw = Math.atan2(b.x - a.x, b.z - a.z);
}

function duel(gloveId = "cotton", gap = 1.6, bGlove = "cotton") {
  const a = makePlayer("A", { gloveId, x: 0, z: 0 });
  const b = makePlayer("B", { gloveId: bGlove, x: 0, z: gap });
  face(a, b);
  face(b, a);
  return { state: makeState([a, b]), a, b };
}

function stunOf(p) {
  return (p.statuses || []).find((s) => s && s.kind === "stun") || null;
}

/** 推进 n 帧固定步长，宿主时钟一起走（combat 的 tickStatuses 认 state.t）。 */
function tick(state, frames, dt = DT) {
  for (let i = 0; i < frames; i++) {
    state.t += dt;
    tickStatuses(state, dt);
  }
}

beforeEach(() => {
  registerGloves(null);
});

describe("FT-07 硬直数值：同源、够短、够温和", () => {
  it("时长与 tuning 的 KNOCKBACK.hitstun 同源，且守住 ≤0.5s 的验收线", () => {
    expect(HIT.hitstun).toBe(KNOCKBACK.hitstun);
    expect(HIT.hitstun).toBe(0.32);
    expect(HIT.hitstun).toBeLessThanOrEqual(HIT.hitstunMax);
    expect(HIT.hitstunMax).toBe(0.5);
  });

  it("硬直严格短于最快那只掌的扇击冷却：挨打的人总有还手的空档", () => {
    const fastest = Math.min(...FALLBACK_GLOVES.map((g) => g.slapCooldown));
    expect(fastest).toBe(FALLBACK_GLOVE_BY_ID.gale.slapCooldown);
    expect(HIT.hitstun).toBeLessThan(fastest);
    // 空档不是一线之差：最快的掌也要等 0.02s 才能扇下一记，慢掌更宽
    expect(fastest - HIT.hitstun).toBeGreaterThan(0);
  });

  it("stun 是一等状态：进 STATUS_KINDS、默认时长与 HIT.hitstun 同数、带 sim 读的 id", () => {
    expect(STATUS_KINDS).toContain("stun");
    expect(STATUS_DEFAULT.stun.t).toBe(HIT.hitstun);

    const { state, a, b } = duel();
    expect(resolveSlap(state, a, undefined, 0)).toHaveLength(1);
    // `src/sim/view.js` 与 HUD 的状态条读的是 `id`（hud.js 的 STATUS_LABEL.stun = 硬直）
    expect(stunOf(b).id).toBe("stun");
    expect(statusSnapshot(b).find((s) => s.kind === "stun").t).toBe(HIT.hitstun);
  });
});

describe("FT-07 时序：挂载 → 期间 canAct=false → 到期清除", () => {
  it("命中当帧就挂上，时长正好是 HIT.hitstun", () => {
    const { state, a, b } = duel();
    expect(stunOf(b)).toBe(null);

    const hits = resolveSlap(state, a, undefined, 0);
    expect(hits).toHaveLength(1);
    expect(stunOf(b).t).toBe(HIT.hitstun);
    expect(stunOf(b).srcId).toBe("A");
    expect(b.stunned).toBe(true);
    expect(b.canAct).toBe(false);
    // 扇的人自己不吃硬直
    expect(stunOf(a)).toBe(null);
    expect(a.stunned).not.toBe(true);
  });

  it("硬直期间扇不出也放不出：canSlap / canSkill 双闸都关", () => {
    // B 拿疾风（有主动技）才测得到技能那一路
    const { state, a, b } = duel("cotton", 1.6, "gale");
    resolveSlap(state, a, undefined, 0);

    expect(canSlap(state, b, undefined, 0)).toBe(false);
    expect(resolveSlap(state, b, undefined, 0)).toHaveLength(0);
    expect(canSkill(state, b, undefined, 0)).toBe(false);
    expect(resolveSkill(state, b, undefined, 0)).toMatchObject({ ok: false, reason: "cannot-act" });
    // 出招锁上了，冲刺这类动作也跟着锁（canDash 由 canAct 派生）
    expect(b.canDash).toBe(false);
    // A 一记也没挨，速度没被 B 反推
    expect(a.vz).toBe(0);
  });

  it("到期精确清除：0.32s 前那一帧还在，跨过那一刻状态从表里消失", () => {
    const { state, a, b } = duel();
    resolveSlap(state, a, undefined, 0);

    // 0.32s / (1/60) = 19.2 帧：第 19 帧还剩一点点，第 20 帧越线
    const last = Math.floor(HIT.hitstun / DT);
    expect(last).toBe(19);

    tick(state, last);
    expect(stunOf(b)).not.toBe(null);
    expect(stunOf(b).t).toBeCloseTo(HIT.hitstun - last * DT, 9);
    expect(b.canAct).toBe(false);
    expect(canSlap(state, b, undefined, state.t)).toBe(false);

    tick(state, 1);
    // 到期是**清除**不是留个 t<=0 的空壳：statuses 里连痕迹都不留
    expect(stunOf(b)).toBe(null);
    expect(statusSnapshot(b).some((s) => s.kind === "stun")).toBe(false);
    expect(b.stunned).toBe(false);
    expect(b.canAct).toBe(true);
    expect(b.canDash).toBe(true);
    expect(canSlap(state, b, undefined, state.t)).toBe(true);
  });

  it("再挨一记按「取更长的那个」续期，不叠成两层", () => {
    const { state, a, b } = duel();
    resolveSlap(state, a, undefined, 0);
    tick(state, 10);
    expect(stunOf(b).t).toBeCloseTo(HIT.hitstun - 10 * DT, 9);

    // 冷却过了再补一记（木棉 0.42s）
    state.t = 0.5;
    expect(resolveSlap(state, a, undefined, state.t)).toHaveLength(1);
    expect((b.statuses || []).filter((s) => s.kind === "stun")).toHaveLength(1);
    expect(stunOf(b).t).toBe(HIT.hitstun);
  });

  it("阵亡 / 重生把硬直一起清干净", () => {
    const { state, a, b } = duel();
    resolveSlap(state, a, undefined, 0);
    expect(stunOf(b)).not.toBe(null);

    respawn(state, b, 0.1);
    expect(stunOf(b)).toBe(null);
    expect(b.stunned).toBe(false);
    // 重生给的是无敌帧，不是硬直：人能立刻动
    expect(b.canAct).toBe(true);
  });
});

describe("FT-07 硬直只锁出招，不锁位移", () => {
  it("moveScale 一点不动（对照冻结：那才是把移动归零的那个）", () => {
    const { state, a, b } = duel();
    resolveSlap(state, a, undefined, 0);
    expect(b.stunned).toBe(true);
    expect(b.moveScale).toBe(1);
    expect(b.frozen).toBe(false);

    const frost = duel("frost", 2.4);
    frost.a.awakenedT = 8; // 冰霜觉醒才带冻结
    resolveSkill(frost.state, frost.a, undefined, 0);
    expect(frost.b.frozen).toBe(true);
    expect(frost.b.moveScale).toBe(0);
  });

  it("与 sim/physics.js 的 statusMods 同口径：canAct=false，canMove / speedMul 原样", () => {
    const { state, a, b } = duel();
    resolveSlap(state, a, undefined, 0);

    const mods = statusMods({ statuses: b.statuses }, 0);
    expect(mods.canAct).toBe(false);
    expect(mods.canMove).toBe(true);
    expect(mods.speedMul).toBe(1);
  });

  it("整段硬直里人一直被击退推着走，位移一帧没被吃掉", () => {
    const { state, a, b } = duel("granite", 2.2);
    resolveSlap(state, a, undefined, 0);
    expect(stunOf(b)).not.toBe(null);
    expect(b.knockbackT).toBeGreaterThan(0);

    // 挨打的人一路顶着「往回走」的输入：硬直不锁位移，但击退窗口本来就没什么操控权，
    // 他还是被推着远离 A
    const inputs = { B: { moveX: 0, moveZ: -1, yaw: b.yaw } };
    let prevZ = b.z;
    let frames = 0;
    while (stunOf(b)) {
      stepSim(state, inputs, DT);
      expect(b.z, `第 ${frames} 帧位移被硬直吃掉了`).toBeGreaterThan(prevZ);
      prevZ = b.z;
      frames += 1;
      expect(frames).toBeLessThan(60);
    }
    expect(frames).toBe(Math.ceil(HIT.hitstun / DT));
    expect(b.z - 2.2).toBeGreaterThan(0.5);
  });
});

describe("FT-07 挂载范围：只有扇击这条路", () => {
  it("被弹反吃掉的那一掌不挂硬直（两边都不挂）", () => {
    const { state, a, b } = duel("cotton", 1.6, "spring");
    expect(resolveSkill(state, b, undefined, 0).ok).toBe(true);
    expect(b.parrying).toBe(true);

    const hits = resolveSlap(state, a, undefined, 0);
    expect(hits).toHaveLength(1);
    expect(hits[0].parried).toBe(true);
    expect(stunOf(b)).toBe(null);
    // 反弹走的是 applyKnockback，不是 landHit：攻击者被弹飞但不被定住
    expect(stunOf(a)).toBe(null);
    expect(canSlap(state, a, undefined, 1)).toBe(true);
  });

  it("主动技命中不叠硬直：各技能自带控制，不双重上锁", () => {
    const pound = duel("granite", 2.2);
    expect(resolveSkill(pound.state, pound.a, undefined, 0).ok).toBe(true);
    expect(pound.b.vy).toBeGreaterThan(0);
    expect(stunOf(pound.b)).toBe(null);

    const arc = duel("frost", 2.6);
    expect(resolveSkill(arc.state, arc.a, undefined, 0).ok).toBe(true);
    expect(statusSnapshot(arc.b).some((s) => s.kind === "slow")).toBe(true);
    expect(stunOf(arc.b)).toBe(null);
  });

  it("挥空不挂：没打着人就没人被定住", () => {
    const { state, a, b } = duel("cotton", 6);
    expect(resolveSlap(state, a, undefined, 0)).toHaveLength(0);
    expect(state.events.some((e) => e.type === "slapWhiff")).toBe(true);
    expect(stunOf(b)).toBe(null);
    expect(canSlap(state, b, undefined, 0)).toBe(true);
  });
});

// 装进真 sim 之后的同一条时序：`src/sim/step.js` 出招前读 statusMods.canAct，
// 硬直因此在真管线里也真的挡住了扇击，而积分照跑。
describe("FT-07 装进 src/sim：硬直挡住出招，不挡积分", () => {
  beforeEach(() => {
    resetDeps();
  });

  afterEach(() => {
    resetDeps();
  });

  it("挨打的人整段硬直里按扇击键都出不了招，出招前一刻还在滑行", () => {
    const state = createMatch({ botCount: 1, seed: 707, gloveId: "cotton", offhandId: "spring" });
    const attacker = state.players.find((p) => p.id === "p0");
    const target = state.players.find((p) => p !== attacker);
    for (const p of [attacker, target]) {
      p.x = 0;
      p.y = 0;
      p.z = 0;
      p.vx = 0;
      p.vy = 0;
      p.vz = 0;
      p.invulnT = 0;
      p.statuses.length = 0;
      p.gloveId = "cotton";
      p.offhandId = "spring";
      p.activeSlot = 0;
    }
    // sim 的 yaw=0 面向 -Z：目标摆在攻击者正前方
    attacker.yaw = 0;
    target.z = -1.6;
    target.yaw = Math.PI;

    // 先只让攻击者出手（走完前摇），目标一直空手站着
    let guard = 0;
    while (!target.statuses.some((s) => s.kind === "stun")) {
      step(state, { [attacker.id]: { slap: true } }, DT);
      expect((guard += 1)).toBeLessThan(60);
    }
    expect(target.attack.phase).toBe("idle");

    const stunnedAt = state.time;
    const startZ = target.z;
    const slapsBefore = state.stats.slaps;
    let sawIdleOnly = true;
    let stunFrames = 0;
    // 从这一刻起目标一直按着扇击键（sim 的扇击是按住连发，不是边沿触发）
    while (target.statuses.some((s) => s.kind === "stun")) {
      step(state, { [target.id]: { slap: true } }, DT);
      stunFrames += 1;
      // 硬直就是在这一帧到的期，招该起了——留给循环后面断言
      if (!target.statuses.some((s) => s.kind === "stun")) break;
      if (target.attack.phase !== "idle") sawIdleOnly = false;
      if (state.stats.slaps !== slapsBefore) sawIdleOnly = false;
    }

    // 整段硬直里目标一次招都没起
    expect(sawIdleOnly).toBe(true);
    expect(target.hitsDealt).toBe(0);
    expect(stunFrames).toBe(Math.ceil(HIT.hitstun / DT));
    // 但他一直在被推着走
    expect(Math.abs(target.z - startZ)).toBeGreaterThan(0.2);
    // 时长就是那 0.32s（帧对齐差不到一帧）
    expect(state.time - stunnedAt).toBeGreaterThanOrEqual(HIT.hitstun);
    expect(state.time - stunnedAt).toBeLessThan(HIT.hitstun + DT);

    // 硬直一走，招当帧就起得来
    expect(target.attack.phase).toBe("windup");
    expect(state.stats.slaps).toBe(slapsBefore + 1);
  });
});
