// 异掌 · 八掌主动技实现。
// 每个 handler 收 ctx（state / attacker / 生效手套 / 技能数值 / now），
// 就地改 state 并返回 { ok, skillId, hits, tiles, ... }。

import { METER, SKILLS } from "./constants.js";
import { applyStatus, refreshDerived } from "./statuses.js";
import {
  addImpact,
  applyKnockback,
  damageTilesInRadius,
  gainMeter,
  landHit,
  markKnockback,
} from "./impact.js";
import {
  arenaRadius,
  clamp,
  clamp01,
  combatOf,
  forwardFromYaw,
  horizDir,
  inCone,
  lerp,
  nextId,
  num,
  opponentsOf,
  pushEvent,
} from "./util.js";

const VERTICAL_REACH = 3.5;

/**
 * 同一个技能在三张表里有三个名字：`src/data/gloves.js` 的中式蛇形（iron_pull）、
 * sim 兜底表的连字符（magnet-pull）、combat 自己的驼峰（magnetPull）。
 * 手套数据从哪来都得能派发到同一个 handler，所以在入口统一折叠。
 */
export const SKILL_ALIASES = {
  none: "none",

  groundPound: "groundPound",
  quake_slam: "groundPound",
  "granite-quake": "groundPound",
  ground_slam: "groundPound",
  slam: "groundPound",

  dashSlap: "dashSlap",
  wind_rush: "dashSlap",
  "gale-dash": "dashSlap",
  dash_attack: "dashSlap",
  rush: "dashSlap",

  frostArc: "frostArc",
  frost_arc: "frostArc",
  "frost-arc": "frostArc",
  cone: "frostArc",

  parry: "parry",
  coil_counter: "parry",
  "spring-guard": "parry",
  counter_stance: "parry",
  riposte: "parry",

  blinkSwap: "blinkSwap",
  phantom_swap: "blinkSwap",
  "afterimage-swap": "blinkSwap",
  decoy_blink: "blinkSwap",
  decoy_swap: "blinkSwap",

  magnetPull: "magnetPull",
  iron_pull: "magnetPull",
  "magnet-pull": "magnetPull",
  pull: "magnetPull",

  meteorSlam: "meteorSlam",
  sky_fall: "meteorSlam",
  "meteor-drop": "meteorSlam",
  leap_slam: "meteorSlam",
  sky_drop: "meteorSlam",
};

/** 折掉大小写与分隔符：`magnet-pull` / `magnet_pull` / `MagnetPull` 折成同一个 key。 */
function foldSkillKey(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** 折叠后的别名索引，`SKILL_ALIASES` 里没逐条列出的写法也能命中。 */
const FOLDED_ALIASES = (() => {
  const map = new Map();
  for (const [alias, canon] of Object.entries(SKILL_ALIASES)) map.set(foldSkillKey(alias), canon);
  return map;
})();

/**
 * 任意来源的 skillId → combat 注册表的 key（认不出就当无主动技）。
 * data 的蛇形 id（`iron_pull`）、data 技能表的 `type`（`pull`）、combat 自己的驼峰
 * handler id（`magnetPull`）三种写法都得认，装配层没对齐时也不能把技能吞掉。
 */
export function normalizeSkillId(skillId) {
  if (skillId == null) return "none";
  const key = String(skillId);
  if (SKILL_HANDLERS[key]) return key;
  if (SKILL_ALIASES[key]) return SKILL_ALIASES[key];
  return FOLDED_ALIASES.get(foldSkillKey(key)) || "none";
}

/** 取技能数值；觉醒时用 awakened 段浅覆盖。 */
export function skillConfig(skillId, awakened) {
  const base = SKILLS[skillId] || SKILLS.none;
  if (!awakened || !base.awakened) return { ...base, awakened: !!awakened };
  return { ...base, ...base.awakened, awakened: true };
}

function inVerticalReach(a, b, reach = VERTICAL_REACH) {
  return Math.abs(num(b.y) - num(a.y)) <= reach;
}

function radialTargets(state, attacker, radius) {
  return opponentsOf(state, attacker)
    .map((p) => ({ p, dir: horizDir(attacker, p) }))
    .filter((e) => e.dir.dist <= radius && inVerticalReach(attacker, e.p))
    .sort((a, b) => a.dir.dist - b.dir.dist);
}

function coneTargets(state, attacker, range, angleDeg) {
  return radialTargets(state, attacker, range).filter((e) => inCone(attacker, e.p, angleDeg));
}

function lockSelf(attacker, now, seconds) {
  if (seconds > 0) {
    attacker.busyUntil = Math.max(num(attacker.busyUntil), now + seconds);
    attacker.rootUntil = Math.max(num(attacker.rootUntil), now + seconds);
  }
}

// ---------------------------------------------------------------- 木棉 · 无主动

function noSkill(ctx) {
  return { ok: false, skillId: "none", reason: "no-skill", hits: [], tiles: [] };
}

// ---------------------------------------------------------------- 磐石 · 砸地

function groundPound(ctx) {
  const { state, attacker, cfg, now } = ctx;
  lockSelf(attacker, now, cfg.selfRoot);
  attacker.vx = num(attacker.vx) * 0.2;
  attacker.vz = num(attacker.vz) * 0.2;

  const hits = [];
  for (const { p, dir } of radialTargets(state, attacker, cfg.radius)) {
    const k = clamp01(1 - dir.dist / cfg.radius);
    const power = lerp(cfg.impulseMin, cfg.impulse, k);
    const hit = landHit(state, attacker, p, {
      power,
      lift: cfg.lift * (0.6 + 0.4 * k),
      now,
      kind: "skill",
      skillId: "groundPound",
      dirOverride: dir,
      meterDealt: METER.onSkillHit,
    });
    hits.push(hit);
  }

  const tiles = damageTilesInRadius(state, num(attacker.x), num(attacker.z), cfg.radius, cfg.tileDamage, {
    srcId: attacker.id,
  });

  pushEvent(state, {
    type: "skillCast",
    skillId: "groundPound",
    attackerId: attacker.id,
    x: num(attacker.x),
    z: num(attacker.z),
    radius: cfg.radius,
    awakened: !!cfg.awakened,
    t: now,
  });
  return { ok: true, skillId: "groundPound", hits, tiles, radius: cfg.radius };
}

// ---------------------------------------------------------------- 疾风 · 冲刺扇

function dashSlap(ctx) {
  const { state, attacker, cfg, now } = ctx;
  const f = forwardFromYaw(num(attacker.yaw));
  attacker.vx = f.x * cfg.speed;
  attacker.vz = f.z * cfg.speed;
  attacker.dashing = true;
  attacker.dashUntil = now + cfg.duration;

  const c = combatOf(state);
  c.dashes = c.dashes.filter((d) => d.ownerId !== attacker.id);
  c.dashes.push({
    id: nextId(state, "dash"),
    ownerId: attacker.id,
    until: now + cfg.duration,
    speed: cfg.speed,
    dirX: f.x,
    dirZ: f.z,
    hitRadius: cfg.hitRadius,
    impulse: cfg.impulse,
    lift: cfg.lift,
    hitsPerTarget: cfg.hitsPerTarget,
    turnsLeft: num(cfg.turns),
    hitIds: [],
  });

  pushEvent(state, {
    type: "skillCast",
    skillId: "dashSlap",
    attackerId: attacker.id,
    speed: cfg.speed,
    duration: cfg.duration,
    canTurn: num(cfg.turns) > 0,
    awakened: !!cfg.awakened,
    t: now,
  });
  return { ok: true, skillId: "dashSlap", hits: [], tiles: [], duration: cfg.duration, speed: cfg.speed };
}

/** 觉醒疾风：冲刺途中允许改一次朝向。sim 在收到转向输入时调用。 */
export function steerDash(state, attackerId, yaw, now) {
  const c = combatOf(state);
  const d = c.dashes.find((x) => x.ownerId === attackerId && x.until > now);
  if (!d || d.turnsLeft <= 0) return false;
  const f = forwardFromYaw(num(yaw));
  d.dirX = f.x;
  d.dirZ = f.z;
  d.turnsLeft -= 1;
  return true;
}

// ---------------------------------------------------------------- 冰霜 · 霜弧

function frostArc(ctx) {
  const { state, attacker, cfg, now } = ctx;
  const hits = [];
  const statuses = [];
  if (cfg.freezeTime > 0) statuses.push({ kind: "freeze", t: cfg.freezeTime, mag: 1 });
  statuses.push({ kind: "slow", t: cfg.slowTime, mag: cfg.slowMag });

  for (const { p, dir } of coneTargets(state, attacker, cfg.range, cfg.angleDeg)) {
    const hit = landHit(state, attacker, p, {
      power: cfg.impulse,
      lift: cfg.lift,
      now,
      kind: "skill",
      skillId: "frostArc",
      dirOverride: dir,
      meterDealt: METER.onSkillHit,
      statuses,
    });
    hits.push(hit);
  }

  pushEvent(state, {
    type: "skillCast",
    skillId: "frostArc",
    attackerId: attacker.id,
    range: cfg.range,
    angleDeg: cfg.angleDeg,
    freeze: cfg.freezeTime > 0,
    awakened: !!cfg.awakened,
    t: now,
  });
  return { ok: true, skillId: "frostArc", hits, tiles: [], slowTime: cfg.slowTime, freezeTime: cfg.freezeTime };
}

// ---------------------------------------------------------------- 弹簧 · 反击

function parry(ctx) {
  const { state, attacker, cfg, now } = ctx;
  applyStatus(attacker, "parryWindow", cfg.window, {
    srcId: attacker.id,
    meta: {
      reflectMul: cfg.reflectMul,
      reflectBase: cfg.reflectBase,
      reflectLift: cfg.reflectLift,
      hop: num(cfg.hop),
    },
  });
  attacker.vx = num(attacker.vx) * 0.5;
  attacker.vz = num(attacker.vz) * 0.5;

  pushEvent(state, {
    type: "skillCast",
    skillId: "parry",
    attackerId: attacker.id,
    window: cfg.window,
    awakened: !!cfg.awakened,
    t: now,
  });
  return { ok: true, skillId: "parry", hits: [], tiles: [], window: cfg.window };
}

// ---------------------------------------------------------------- 分身 · 残影换位

function blinkSwap(ctx) {
  const { state, attacker, cfg, now } = ctx;
  const from = { x: num(attacker.x), y: num(attacker.y), z: num(attacker.z), yaw: num(attacker.yaw) };
  const candidates = coneTargets(state, attacker, cfg.range, 160);
  const target = candidates.length ? candidates[0].p : null;

  if (target) {
    const tx = num(target.x);
    const ty = num(target.y);
    const tz = num(target.z);
    attacker.x = tx;
    attacker.y = ty;
    attacker.z = tz;
    target.x = from.x;
    target.y = from.y;
    target.z = from.z;
    attacker.yaw = Math.atan2(from.x - tx, from.z - tz);
    gainMeter(attacker, METER.onSkillHit);
  } else {
    const f = forwardFromYaw(from.yaw);
    const r = arenaRadius(state) * 0.95;
    let nx = from.x + f.x * cfg.blinkDistance;
    let nz = from.z + f.z * cfg.blinkDistance;
    const d = Math.hypot(nx, nz);
    if (d > r) {
      nx = (nx / d) * r;
      nz = (nz / d) * r;
    }
    attacker.x = nx;
    attacker.z = nz;
  }

  applyStatus(attacker, "invuln", cfg.invulnTime, { srcId: attacker.id });

  const c = combatOf(state);
  const ghost = {
    id: nextId(state, "ghost"),
    ownerId: attacker.id,
    x: from.x,
    y: from.y,
    z: from.z,
    yaw: from.yaw,
    ttl: cfg.ghostTtl,
    fake: num(cfg.fakeSlapAt) > 0,
  };
  c.ghosts.push(ghost);

  if (num(cfg.fakeSlapAt) > 0) {
    c.pending.push({
      kind: "ghostSlap",
      at: now + cfg.fakeSlapAt,
      ownerId: attacker.id,
      ghostId: ghost.id,
      x: from.x,
      y: from.y,
      z: from.z,
      yaw: from.yaw,
      range: cfg.fakeSlapRange,
      impulse: cfg.fakeSlapImpulse,
    });
  }

  pushEvent(state, {
    type: "skillCast",
    skillId: "blinkSwap",
    attackerId: attacker.id,
    swappedWith: target ? target.id : null,
    ghostId: ghost.id,
    awakened: !!cfg.awakened,
    t: now,
  });
  return {
    ok: true,
    skillId: "blinkSwap",
    hits: [],
    tiles: [],
    swappedWith: target ? target.id : null,
    ghostId: ghost.id,
  };
}

// ---------------------------------------------------------------- 磁掌 · 拉近

function magnetPull(ctx) {
  const { state, attacker, cfg, now } = ctx;
  const picked = coneTargets(state, attacker, cfg.range, cfg.angleDeg).slice(0, Math.max(1, cfg.targets));
  const hits = [];

  for (const { p, dir } of picked) {
    const pull = clamp(dir.dist * cfg.pullPerMeter, cfg.pullMin, cfg.pullMax);
    // 拉近是「改写」速度而不是叠加，否则对手正在外冲时会被自己的惯性抵消。
    p.vx = -dir.x * pull;
    p.vz = -dir.z * pull;
    p.vy = Math.max(num(p.vy), 1.5);
    if (p.grounded === true) p.grounded = false;
    if (p.onGround === true) p.onGround = false;
    markKnockback(state, p, pull, { srcId: attacker.id, now });
    addImpact(p, pull * 0.25);
    gainMeter(attacker, METER.onSkillHit);
    gainMeter(p, METER.onHitTaken * 0.5);
    if (num(cfg.stickyTime) > 0) {
      applyStatus(p, "sticky", cfg.stickyTime, { mag: cfg.stickyMag, srcId: attacker.id });
    }
    hits.push({
      id: p.id,
      targetId: p.id,
      applied: true,
      impulse: { x: -dir.x * pull, y: 0, z: -dir.z * pull },
      power: pull,
      kind: "skill",
      skillId: "magnetPull",
      distance: dir.dist,
      pulled: true,
      hitX: num(p.x),
      hitZ: num(p.z),
      attackerId: attacker.id,
    });
    pushEvent(state, {
      type: "skillHit",
      attackerId: attacker.id,
      targetId: p.id,
      skillId: "magnetPull",
      power: pull,
      t: now,
    });
  }

  pushEvent(state, {
    type: "skillCast",
    skillId: "magnetPull",
    attackerId: attacker.id,
    pulled: hits.map((h) => h.id),
    awakened: !!cfg.awakened,
    t: now,
  });
  return { ok: true, skillId: "magnetPull", hits, tiles: [], pulled: hits.map((h) => h.id) };
}

// ---------------------------------------------------------------- 陨掌 · 高空砸下

function meteorSlam(ctx) {
  const { state, attacker, cfg, now } = ctx;
  attacker.vy = num(attacker.vy) + cfg.launchVy;
  attacker.grounded = false;
  if ("onGround" in attacker) attacker.onGround = false;
  attacker.airborneBy = "meteorSlam";
  applyStatus(attacker, "invuln", cfg.selfInvuln, { srcId: attacker.id });

  const c = combatOf(state);
  c.pending = c.pending.filter((q) => !(q.kind === "meteorSlam" && q.ownerId === attacker.id));
  c.pending.push({
    kind: "meteorSlam",
    at: now + cfg.delay,
    ownerId: attacker.id,
    radius: cfg.radius,
    impulse: cfg.impulse,
    impulseMin: cfg.impulseMin,
    lift: cfg.lift,
    tileDamage: cfg.tileDamage,
    ringInner: num(cfg.ringInner),
    ringOuter: num(cfg.ringOuter),
    ringTileDamage: num(cfg.ringTileDamage),
    awakened: !!cfg.awakened,
  });

  pushEvent(state, {
    type: "skillCast",
    skillId: "meteorSlam",
    attackerId: attacker.id,
    launchVy: cfg.launchVy,
    delay: cfg.delay,
    awakened: !!cfg.awakened,
    t: now,
  });
  return { ok: true, skillId: "meteorSlam", hits: [], tiles: [], pending: true, slamAt: now + cfg.delay };
}

/** 陨掌落地结算，由 tickStatuses 的 pending 队列驱动。 */
export function resolveMeteorImpact(state, owner, q, now) {
  if (!owner) return { hits: [], tiles: [] };
  owner.vy = Math.min(num(owner.vy), -28);
  owner.airborneBy = null;

  const hits = [];
  for (const { p, dir } of radialTargets(state, owner, q.radius)) {
    const k = clamp01(1 - dir.dist / q.radius);
    const power = lerp(q.impulseMin, q.impulse, k);
    hits.push(
      landHit(state, owner, p, {
        power,
        lift: q.lift * (0.55 + 0.45 * k),
        now,
        kind: "skill",
        skillId: "meteorSlam",
        dirOverride: dir,
        meterDealt: METER.onSkillHit,
      }),
    );
  }

  const tiles = damageTilesInRadius(state, num(owner.x), num(owner.z), q.radius, q.tileDamage, { srcId: owner.id });
  if (q.ringOuter > 0 && q.ringTileDamage > 0) {
    const ring = damageTilesInRadius(state, num(owner.x), num(owner.z), q.ringOuter, q.ringTileDamage, {
      srcId: owner.id,
      inner: q.ringInner,
      falloffMin: 0.85,
    });
    tiles.push(...ring);
  }

  pushEvent(state, {
    type: "meteorImpact",
    attackerId: owner.id,
    x: num(owner.x),
    z: num(owner.z),
    radius: q.radius,
    ring: q.ringOuter > 0,
    t: now,
  });
  return { hits, tiles };
}

/** 觉醒分身残影的假挥掌，由 pending 队列驱动。 */
export function resolveGhostSlap(state, owner, q, now) {
  const hits = [];
  if (!owner) return hits;
  const ghostPose = { x: q.x, y: q.y, z: q.z, yaw: q.yaw, id: owner.id };
  for (const p of opponentsOf(state, owner)) {
    const dir = horizDir(ghostPose, p);
    if (dir.dist > q.range || !inVerticalReach(ghostPose, p)) continue;
    if (!inCone(ghostPose, p, 140)) continue;
    const impulse = q.impulse > 0 ? applyKnockback(state, p, dir.x, dir.z, q.impulse, 0, { srcId: owner.id, now }) : { x: 0, y: 0, z: 0 };
    gainMeter(owner, METER.onHitDealt * 0.5);
    hits.push({
      id: p.id,
      targetId: p.id,
      applied: true,
      impulse,
      power: q.impulse,
      kind: "ghost",
      skillId: "blinkSwap",
      decoy: true,
      attackerId: owner.id,
    });
    pushEvent(state, { type: "ghostSlap", attackerId: owner.id, targetId: p.id, t: now });
  }
  refreshDerived(owner);
  return hits;
}

export const SKILL_HANDLERS = {
  none: noSkill,
  groundPound,
  dashSlap,
  frostArc,
  parry,
  blinkSwap,
  magnetPull,
  meteorSlam,
};

export const SKILL_IDS = Object.keys(SKILL_HANDLERS);
