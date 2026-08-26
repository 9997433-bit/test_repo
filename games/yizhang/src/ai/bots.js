// 异掌 · Bot 大脑（CONTRACT `src/ai/bots.js`）
//
//   think(view, botId, rng) -> Input { moveX, moveZ, yaw, slap, skill, switchGlove, dash, jump }
//
// 三种性格写在 bot 的 `persona` 字段：
//   brute  硬冲 —— 贴脸直推，冷却一好就扇，远了就冲刺缩距
//   fox    绕边 —— 保持外圈环绕，抓间隙点一下就撤
//   bully  欺软 —— 挑最快出局的目标，抢背后 / 抢内侧，把人往外扇
//
// 只读 view（getView 的纯 JSON 快照），不写 state，不 import three / DOM。
// view 字段缺失时全部退化到保守默认，保证 Bot 永远在动、永远会扇。

import { FALLBACK_GLOVE_BY_ID, ARENA } from "../combat/constants.js";
import {
  clamp,
  clamp01,
  forwardFromYaw,
  localToWorld,
  num,
  wrapAngle,
  worldToLocal,
  yawTo,
} from "../combat/util.js";

export const BOT_PERSONAS = ["brute", "fox", "bully"];

const NEUTRAL = () => ({
  moveX: 0,
  moveZ: 0,
  yaw: 0,
  slap: false,
  skill: false,
  switchGlove: false,
  dash: false,
  jump: false,
});

const CONFIG = {
  // moveX/moveZ 的坐标系：'local' = 相对自身 yaw（契约默认），'world' = 世界轴。
  // think() 会用「命令 vs 实际位移」在线校准，猜错也能在十来帧内自己纠回来。
  moveSpace: "local",
  autoDetectMoveSpace: true,
  reactionJitter: 0.12,
};

export function configureBots(patch = {}) {
  Object.assign(CONFIG, patch);
  return { ...CONFIG };
}

const MEM = new Map();

export function resetBots(botId) {
  if (botId == null) MEM.clear();
  else MEM.delete(botId);
}

function memoryOf(botId) {
  let m = MEM.get(botId);
  if (!m) {
    m = {
      lastT: null,
      lastPos: null,
      lastCmd: null,
      lastYaw: 0,
      spaceScore: 0,
      strafeSign: 1,
      timers: { dash: 0, jump: 0, switch: 2, commit: 0, skill: 0, strafe: 0, aim: 0 },
      aimNoise: 0,
      targetId: null,
      committing: false,
    };
    MEM.set(botId, m);
  }
  return m;
}

// ---------------------------------------------------------------- view 归一化

function viewPlayers(view) {
  if (!view) return [];
  const p = view.players;
  if (Array.isArray(p)) return p;
  if (p && typeof p === "object") return Object.values(p);
  if (Array.isArray(view.entities)) return view.entities;
  return [];
}

function isFightable(p) {
  return !!p && p.alive !== false && num(p.respawnT) <= 0;
}

function viewTiles(view) {
  if (!view) return [];
  if (Array.isArray(view.tiles)) return view.tiles;
  if (view.arena && Array.isArray(view.arena.tiles)) return view.arena.tiles;
  return [];
}

function arenaR(view) {
  return num(view && view.arena && view.arena.radius, num(view && view.arenaRadius, ARENA.radius));
}

function gloveOf(me) {
  const slot = num(me.activeSlot, 0);
  const id = (slot === 1 ? me.offhandId : me.gloveId) || me.gloveId || "cotton";
  const g = FALLBACK_GLOVE_BY_ID[id] || FALLBACK_GLOVE_BY_ID.cotton;
  return {
    id,
    slapRange: num(me.slapRange, g.slapRange),
    slapAngleDeg: num(me.slapAngleDeg, g.slapAngleDeg),
    skillId: me.skillId || g.skillId,
    skillCooldown: num(me.skillCooldown, g.skillCooldown),
  };
}

function personaFor(me, botId) {
  const p = me && me.persona;
  if (BOT_PERSONAS.includes(p)) return p;
  let h = 0;
  const s = String(botId ?? "bot");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return BOT_PERSONAS[h % BOT_PERSONAS.length];
}

function dist2d(a, b) {
  return Math.hypot(num(b.x) - num(a.x), num(b.z) - num(a.z));
}

function dirTo(from, to) {
  const dx = num(to.x) - num(from.x);
  const dz = num(to.z) - num(from.z);
  const d = Math.hypot(dx, dz);
  if (d < 1e-5) return { x: 0, z: 1, dist: 0 };
  return { x: dx / d, z: dz / d, dist: d };
}

function normalize(x, z) {
  const d = Math.hypot(x, z);
  if (d < 1e-6) return { x: 0, z: 0, len: 0 };
  return { x: x / d, z: z / d, len: d };
}

// ---------------------------------------------------------------- 坐标系在线校准

function calibrateMoveSpace(mem, me, dt) {
  if (!CONFIG.autoDetectMoveSpace) return;
  if (!mem.lastPos || !mem.lastCmd || dt <= 0) return;
  const cmdLen = Math.hypot(mem.lastCmd.x, mem.lastCmd.z);
  if (cmdLen < 0.3) return;
  const moved = normalize(num(me.x) - mem.lastPos.x, num(me.z) - mem.lastPos.z);
  if (moved.len < 0.01) return;

  const asWorld = normalize(mem.lastCmd.x, mem.lastCmd.z);
  const rotated = localToWorld(mem.lastCmd.x, mem.lastCmd.z, mem.lastYaw);
  const asLocal = normalize(rotated.x, rotated.z);
  const sw = moved.x * asWorld.x + moved.z * asWorld.z;
  const sl = moved.x * asLocal.x + moved.z * asLocal.z;
  if (Math.abs(sw - sl) < 0.25) return;
  mem.spaceScore = clamp(mem.spaceScore + (sw > sl ? 1 : -1) * Math.min(1, moved.len * 4), -6, 6);
}

function moveSpaceFor(view, mem) {
  const hint = (view && (view.moveSpace || view.inputSpace)) || (view && view.config && view.config.moveSpace);
  if (hint === "world" || hint === "local") return hint;
  if (mem.spaceScore > 1.5) return "world";
  if (mem.spaceScore < -1.5) return "local";
  return CONFIG.moveSpace;
}

// ---------------------------------------------------------------- 目标评估

/** 越接近出局越「残血」：吃过的击退、离台缘的距离、是否背对我。 */
function vulnerability(me, foe, R) {
  const edge = clamp01(Math.hypot(num(foe.x), num(foe.z)) / Math.max(1, R));
  const impact = clamp01(num(foe.impact) / 1.6);
  const ff = forwardFromYaw(num(foe.yaw));
  const toMe = dirTo(foe, me);
  const facingAway = clamp01(-(ff.x * toMe.x + ff.z * toMe.z));
  const frozen = foe.frozen === true || num(foe.moveScale, 1) < 0.7 ? 0.5 : 0;
  const awakePenalty = num(foe.awakenedT) > 0 ? 0.8 : 0;
  return edge * 2 + impact * 1.5 + facingAway * 1.2 + frozen - awakePenalty;
}

function pickTarget(me, foes, persona, R) {
  if (!foes.length) return null;
  let best = null;
  let bestScore = -Infinity;
  for (const foe of foes) {
    const d = dist2d(me, foe);
    let score;
    if (persona === "bully") score = vulnerability(me, foe, R) * 2.2 - d * 0.22;
    else if (persona === "fox") score = -d * 0.5 - (num(foe.awakenedT) > 0 ? 3 : 0) + clamp01(num(foe.impact)) * 1.2;
    else score = -d;
    if (score > bestScore) {
      bestScore = score;
      best = foe;
    }
  }
  return best;
}

// ---------------------------------------------------------------- 走位

/**
 * 台缘与碎块的排斥力，避免 Bot 自己走下去。
 * 碎块除了往外推还给一份切向分量，让 Bot 绕着洞走而不是顶着洞边发抖。
 */
function safetySteer(me, view, R, desire) {
  let sx = 0;
  let sz = 0;
  const r = Math.hypot(num(me.x), num(me.z));
  const soft = R * 0.78;
  if (r > soft && r > 0.001) {
    const w = clamp01((r - soft) / Math.max(0.001, R - soft));
    sx += (-num(me.x) / r) * w * 2.4;
    sz += (-num(me.z) / r) * w * 2.4;
  }
  for (const tile of viewTiles(view)) {
    if (!tile) continue;
    const broken = tile.broken === true || tile.destroyed === true || tile.alive === false || num(tile.hp, 1) <= 0;
    if (!broken) continue;
    const d = dist2d(me, tile);
    const rad = num(tile.r, num(tile.radius, num(tile.size, 3) / 2)) + 2;
    if (d >= rad || d < 0.001) continue;
    const w = (rad - d) / rad;
    const ox = (num(me.x) - num(tile.x)) / d;
    const oz = (num(me.z) - num(tile.z)) / d;
    let tx = -oz;
    let tz = ox;
    if (desire && tx * desire.x + tz * desire.z < 0) {
      tx = -tx;
      tz = -tz;
    }
    sx += ox * 2.8 * w + tx * 2.2 * w;
    sz += oz * 2.8 * w + tz * 2.2 * w;
  }
  return { x: sx, z: sz };
}

/** 站到目标与台心之间：从内侧扇，把人往外推。 */
function innerSidePoint(target, R, offset) {
  const r = Math.hypot(num(target.x), num(target.z));
  if (r < 0.5) return { x: num(target.x), z: num(target.z) - offset };
  return { x: num(target.x) - (num(target.x) / r) * offset, z: num(target.z) - (num(target.z) / r) * offset };
}

function behindPoint(target, offset) {
  const f = forwardFromYaw(num(target.yaw));
  return { x: num(target.x) - f.x * offset, z: num(target.z) - f.z * offset };
}

// ---------------------------------------------------------------- 性格

function bruteBrain(ctx) {
  const { me, target, glove, mem, rng, dist } = ctx;
  const reach = glove.slapRange * 0.9;
  const seek = dirTo(me, target);
  let mx = seek.x;
  let mz = seek.z;

  // 贴到脸上后左右蹭一点，别站成木桩。
  if (dist < reach * 1.15) {
    mx += -seek.z * mem.strafeSign * 0.55;
    mz += seek.x * mem.strafeSign * 0.55;
  }

  const wantDash = dist > 7 && mem.timers.dash <= 0 && ctx.canDash;
  const wantSlap = dist <= reach + 0.35 && Math.abs(ctx.aimError) < 0.7;
  const wantSkill = ctx.skillReady && dist <= skillRange(glove.skillId, 5.2);
  return {
    mx,
    mz,
    slap: wantSlap,
    skill: wantSkill,
    dash: wantDash,
    jump: mem.timers.jump <= 0 && (num(target.y) - num(me.y) > 1.4 || rng() < 0.015),
  };
}

function foxBrain(ctx) {
  const { me, target, glove, mem, rng, dist } = ctx;
  const reach = glove.slapRange * 0.9;
  const orbit = reach + 2.4;
  const seek = dirTo(me, target);

  // 提交窗口内才切进去点一下，其余时间保持环绕。
  if (mem.timers.commit <= 0) {
    mem.committing = !mem.committing;
    mem.timers.commit = mem.committing ? 0.55 + rng() * 0.5 : 1.1 + rng() * 1.4;
  }
  const scared = num(me.impact) > 0.9 || num(target.awakenedT) > 0;
  const wantRadius = mem.committing && !scared ? reach * 0.8 : orbit + (scared ? 2.5 : 0);
  const radial = dist - wantRadius;

  let mx = seek.x * clamp(radial * 0.6, -1, 1);
  let mz = seek.z * clamp(radial * 0.6, -1, 1);
  const tangential = mem.committing ? 0.35 : 1;
  mx += -seek.z * mem.strafeSign * tangential;
  mz += seek.x * mem.strafeSign * tangential;

  const wantSlap = mem.committing && dist <= reach + 0.3 && Math.abs(ctx.aimError) < 0.6;
  const wantSkill = ctx.skillReady && (dist <= skillRange(glove.skillId, 6) || scared);
  const wantDash = ctx.canDash && mem.timers.dash <= 0 && dist > 11 && !scared;
  return {
    mx,
    mz,
    slap: wantSlap,
    skill: wantSkill,
    dash: wantDash,
    jump: mem.timers.jump <= 0 && rng() < 0.01,
  };
}

function bullyBrain(ctx) {
  const { me, target, glove, mem, rng, dist, R } = ctx;
  const reach = glove.slapRange * 0.9;
  const targetEdge = Math.hypot(num(target.x), num(target.z)) / Math.max(1, R);
  // 目标已经在外圈就抢内侧（往外扇），否则抢背后。
  const anchor = targetEdge > 0.55 ? innerSidePoint(target, R, reach * 0.75) : behindPoint(target, reach * 0.8);
  const toAnchor = dirTo(me, anchor);
  const seek = dirTo(me, target);

  let mx = toAnchor.x;
  let mz = toAnchor.z;
  if (toAnchor.dist < 0.7) {
    mx = seek.x;
    mz = seek.z;
  }

  const lined = toAnchor.dist < reach * 0.9 || targetEdge > 0.7;
  const wantSlap = dist <= reach + 0.3 && Math.abs(ctx.aimError) < 0.75 && (lined || rng() < 0.35);
  const wantSkill = ctx.skillReady && dist <= skillRange(glove.skillId, 5.5) && (targetEdge > 0.45 || num(target.impact) > 0.8);
  const wantDash = ctx.canDash && mem.timers.dash <= 0 && dist > 8.5;
  return {
    mx,
    mz,
    slap: wantSlap,
    skill: wantSkill,
    dash: wantDash,
    jump: mem.timers.jump <= 0 && rng() < 0.008,
  };
}

function skillRange(skillId, fallback) {
  switch (skillId) {
    case "groundPound":
      return 4.6;
    case "dashSlap":
      return 12;
    case "frostArc":
      return 5.8;
    case "parry":
      return 3.2;
    case "blinkSwap":
      return 9;
    case "magnetPull":
      return 7.5;
    case "meteorSlam":
      return 6;
    default:
      return fallback;
  }
}

const BRAINS = { brute: bruteBrain, fox: foxBrain, bully: bullyBrain };

// ---------------------------------------------------------------- 主入口

/**
 * @param {object} view getView() 快照
 * @param {string} botId 该 bot 的 player id
 * @param {() => number} rng 0..1 随机源（sim 提供以保证可复现）
 * @returns {{moveX:number,moveZ:number,yaw:number,slap:boolean,skill:boolean,switchGlove:boolean,dash:boolean,jump:boolean}}
 */
export function think(view, botId, rng) {
  const random = typeof rng === "function" ? rng : Math.random;
  const out = NEUTRAL();
  const players = viewPlayers(view);
  const me = players.find((p) => p && p.id === botId);
  const mem = memoryOf(botId);

  const now = num(view && view.t, mem.lastT == null ? 0 : mem.lastT + 1 / 60);
  const dt = clamp(mem.lastT == null ? 1 / 60 : now - mem.lastT, 0, 0.25) || 1 / 60;
  mem.lastT = now;
  for (const k of Object.keys(mem.timers)) mem.timers[k] = Math.max(0, mem.timers[k] - dt);

  if (!me) {
    mem.lastCmd = null;
    mem.lastPos = null;
    return out;
  }
  out.yaw = num(me.yaw);
  calibrateMoveSpace(mem, me, dt);
  mem.lastPos = { x: num(me.x), z: num(me.z) };
  mem.lastCmd = null;

  if (!isFightable(me)) return out;

  const R = arenaR(view);
  const persona = personaFor(me, botId);
  const glove = gloveOf(me);
  const foes = players.filter((p) => p && p.id !== botId && isFightable(p));

  // 无人可打：回台心巡逻，别站着不动。
  if (!foes.length) {
    const home = normalize(-num(me.x), -num(me.z));
    const wander = mem.strafeSign;
    const wx = home.x * 0.6 - home.z * 0.4 * wander;
    const wz = home.z * 0.6 + home.x * 0.4 * wander;
    return emit(out, mem, view, me, wx, wz, num(me.yaw), { slap: false, skill: false, dash: false, jump: false, switchGlove: false });
  }

  const target = pickTarget(me, foes, persona, R) || foes[0];
  mem.targetId = target.id;
  const dist = dist2d(me, target);

  if (mem.timers.strafe <= 0) {
    mem.strafeSign = random() < 0.5 ? -1 : 1;
    mem.timers.strafe = 1.4 + random() * 1.8;
  }
  if (mem.timers.aim <= 0) {
    mem.aimNoise = (random() * 2 - 1) * CONFIG.reactionJitter;
    mem.timers.aim = 0.18 + random() * 0.22;
  }

  const aimYaw = wrapAngle(yawTo(num(target.x) - num(me.x), num(target.z) - num(me.z)) + mem.aimNoise);
  const aimError = wrapAngle(aimYaw - num(me.yaw));

  // view 给了真实冷却就信 view，没给就用自己按下技能后的估算计时。
  const cd = me.cd || {};
  const viewSkillReady = typeof cd.skillAt === "number" ? now >= cd.skillAt : null;
  const skillReady =
    glove.skillId !== "none" && (viewSkillReady == null ? mem.timers.skill <= 0 : viewSkillReady);

  const ctx = {
    me,
    target,
    glove,
    mem,
    rng: random,
    dist,
    aimError,
    R,
    now,
    skillReady: skillReady && (me.canAct !== false),
    canDash: me.canDash !== false && me.sticky !== true,
  };

  const brain = BRAINS[persona] || bruteBrain;
  const plan = brain(ctx);

  const safety = safetySteer(me, view, R, normalize(plan.mx, plan.mz));
  let wx = plan.mx + safety.x;
  let wz = plan.mz + safety.z;
  const mv = normalize(wx, wz);
  const speed = clamp(mv.len, 0, 1) > 0.15 ? 1 : 0;
  wx = mv.x * speed;
  wz = mv.z * speed;

  // 台缘极近时不许再往外冲。
  const rNow = Math.hypot(num(me.x), num(me.z));
  const outward = rNow > 0.001 ? (wx * num(me.x) + wz * num(me.z)) / rNow : 0;
  let dash = plan.dash;
  if (rNow > R * 0.88 && outward > 0) dash = false;
  if (dash) mem.timers.dash = 2.4 + random() * 1.6;

  const jump = !!plan.jump;
  if (jump) mem.timers.jump = 1.2 + random() * 1.4;
  if (plan.skill) mem.timers.skill = Math.max(mem.timers.skill, glove.skillCooldown);

  // 主动技长时间点不出来（木棉无主动 / 一直在冷却）就换副掌。
  let switchGlove = false;
  if (mem.timers.switch <= 0) {
    const stale = glove.skillId === "none" || (typeof cd.skillAt === "number" && cd.skillAt - now > glove.skillCooldown * 0.6);
    if (stale && me.offhandId && me.offhandId !== glove.id) {
      switchGlove = true;
      mem.timers.switch = 4 + random() * 4;
    } else {
      mem.timers.switch = 1.5;
    }
  }

  return emit(out, mem, view, me, wx, wz, aimYaw, {
    slap: !!plan.slap,
    skill: !!plan.skill,
    dash,
    jump,
    switchGlove,
  });
}

function emit(out, mem, view, me, wx, wz, yaw, flags) {
  const space = moveSpaceFor(view, mem);
  const vec = space === "local" ? worldToLocal(wx, wz, yaw) : { x: wx, z: wz };
  out.moveX = clamp(vec.x, -1, 1);
  out.moveZ = clamp(vec.z, -1, 1);
  out.yaw = yaw;
  out.slap = !!flags.slap;
  out.skill = !!flags.skill;
  out.switchGlove = !!flags.switchGlove;
  out.dash = !!flags.dash;
  out.jump = !!flags.jump;
  mem.lastCmd = { x: out.moveX, z: out.moveZ };
  mem.lastYaw = yaw;
  return out;
}

export { personaFor };
export default { think, resetBots, configureBots, BOT_PERSONAS, personaFor };
