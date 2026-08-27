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
//
// 唯一的例外是安全区：`view.phase === 'hub'` 时 think() 直接返回零输入（见 isHubView），
// 玩家在走道选掌期间 Bot 不动、不扇、不放技能，`phase` 回到 'arena' 才恢复正常。
//
// view 的字段名以 `src/sim/view.js` 为准：时钟是 `time`、冷却是 `slapCd`/`skillCd`、
// 状态是 `statuses[{id,t,mag}]`、台面在 `arena.tiles[{x,z,alive}]`。
// combat 的 testkit state 用另一套名字（`t` / `cd.skillAt` / `moveScale`），两套都读。
//
// 朝向也是两套：`src/sim` 冻结 yaw=0 面向 **-Z**（`src/sim/math.js` 的 FACE），
// combat 的 testkit 仍按 yaw=0 面向 +Z 记账。think() 每帧先认一次方言（见 faceOf），
// 之后所有「朝向 / 背后 / 局部移动向量」都走同一组函数，emit 出去的 yaw 才是真的对着人。
//
// 视角模式（lookMode: locked / free）不进这一层，一个字段都不读。它只决定**本机玩家**
// 那一路输入：壳层拿相机方位角换出 `Input.yaw`（`src/core/look.js`），sim 不感知（ADR-38），
// getView 也不透出它。所以 think() 认的角永远只有 `p.yaw` 这一个 sim 空间的值 ——
// 快照上多出 lookMode / pitch / 相机角，Bot 的输出一个字节都不该变
// （`look-mode-blind.test.js` 把这条钉死）。
//
// 反过来，玩家那一路的产出约定也别渗进来：free 静止帧送 `yaw: null`，sim 见非有限值
// 就「保持朝向」。Bot 走的是另一条路 —— 它**帧帧送有限角**。漏一个 null / NaN 出去
// sim 不会报错，只会让这只 Bot 闷头不转身，之后每一掌都扇向旧朝向，
// 表现成「打别人打不到」。emit() 的 finiteYaw 是这条的最后一道闸
// （`bot-yaw-finite.test.js`）。

import { GLOVE_BY_ID as DATA_GLOVE_BY_ID } from "../data/gloves.js";
import { BOT_PERSONA_BY_ID } from "../data/bots.js";
import { FALLBACK_GLOVE_BY_ID, ARENA } from "../combat/constants.js";
import { normalizeSkillId } from "../combat/skills.js";
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
import { FACE, forwardX, forwardZ, yawFromDir } from "../sim/math.js";

export const BOT_PERSONAS = ["brute", "fox", "bully"];

/** 人格系数来自 `src/data/bots.js`；data 缺席时退回这里的保守默认。 */
function tuningOf(persona) {
  const t = BOT_PERSONA_BY_ID[persona] || {};
  return {
    edgeCaution: num(t.edgeCaution, 0.5),
    reactionSeconds: num(t.reactionSeconds, 0.24),
    skillEagerness: num(t.skillEagerness, 0.7),
    dashEagerness: num(t.dashEagerness, 0.6),
    mistakeRate: num(t.mistakeRate, 0.12),
  };
}

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
      timers: { dash: 0, jump: 0, switch: 2, commit: 0, skill: 0, strafe: 0, aim: 0, detour: 0 },
      detourSign: 1,
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

/** getView 的方格台面只在 arena 上记边长；testkit 的圆块自带 r。 */
function tileR(tile, view) {
  const own = num(tile.r, num(tile.radius, num(tile.size, 0) / 2));
  if (own > 0) return own;
  const size = num(view && view.arena && view.arena.tileSize, 0);
  return size > 0 ? size / 2 : 1.5;
}

/** 时钟：getView 给 `time`，combat testkit 给 `t`。 */
function viewClock(view, fallback) {
  const t = num(view && view.time, num(view && view.t, NaN));
  return Number.isFinite(t) ? t : fallback;
}

// ---------------------------------------------------------------- 朝向方言

/** combat / testkit 的老约定：yaw=0 面向 +Z。 */
const FACE_COMBAT = {
  convention: "yaw0:+Z",
  forward: forwardFromYaw,
  yawTo,
  toLocal: worldToLocal,
  toWorld: localToWorld,
};

/** sim 冻结的约定：yaw=0 面向 -Z，局部系与 `src/sim/physics.js` 的 readMoveVector 同源。 */
const FACE_SIM = {
  convention: FACE.convention,
  forward: (yaw) => ({ x: forwardX(yaw), z: forwardZ(yaw) }),
  yawTo: yawFromDir,
  toLocal(wx, wz, yaw) {
    const fx = forwardX(yaw);
    const fz = forwardZ(yaw);
    return { x: wx * -fz + wz * fx, z: wx * fx + wz * fz };
  },
  toWorld(mx, mz, yaw) {
    const fx = forwardX(yaw);
    const fz = forwardZ(yaw);
    return { x: -fz * mx + fx * mz, z: fx * mx + fz * mz };
  },
};

/**
 * 这份快照是 `src/sim/view.js` 出的吗。
 * 显式声明优先（`view.face`），否则按 sim 独有的形状认：`tick` + `config.arenaRadius`。
 */
function isSimSnapshot(view) {
  if (!view) return false;
  const hint = view.face || view.faceConvention || (view.config && view.config.face);
  if (hint) return String(hint) === FACE.convention;
  return Number.isFinite(view.tick) && !!view.config && Number.isFinite(view.config.arenaRadius);
}

function faceOf(view) {
  return isSimSnapshot(view) ? FACE_SIM : FACE_COMBAT;
}

// ---------------------------------------------------------------- 安全区守卫

/**
 * 这份快照是不是「玩家还在安全区选掌」。
 *
 * 认法按可信度排：
 *   1. `view.phase` 显式写了 'hub' / 'arena'（`src/sim/view.js` 的常态）——直接采信；
 *   2. 没有 phase 但带着 `view.hub` 大厅数据——按 hub 算（fail-safe 偏向不出手）；
 *   3. 两样都没有（combat testkit、老快照）——按裂岛算，Bot 照常打。
 */
export function isHubView(view) {
  if (!view || typeof view !== "object") return false;
  const phase = view.phase ?? (view.config && view.config.phase);
  if (phase === "hub") return true;
  if (phase != null) return false;
  return !!view.hub;
}

/**
 * 进安全区时把「跨帧连续量」清掉：时钟基准、上一帧位置、上一帧命令。
 * 大厅可能停留几十秒，留着旧基准会让传送回裂岛的第一帧算出一个假的 dt / 假的位移，
 * 把移动坐标系自校准带偏。人格、绕行旋向这些不受时间影响的记忆保留。
 */
function hibernate(botId) {
  const mem = MEM.get(botId);
  if (!mem) return;
  mem.lastT = null;
  mem.lastPos = null;
  mem.lastCmd = null;
  mem.targetId = null;
  mem.committing = false;
}

function statusesOf(p) {
  return Array.isArray(p && p.statuses) ? p.statuses : [];
}

function hasStatusId(p, id) {
  return statusesOf(p).some((s) => s && (s.id === id || s.kind === id) && num(s.t) > 0);
}

/** 能不能出招：优先信 combat 写的派生字段，只有快照时按状态自己判。 */
function canAct(p) {
  if (typeof p.canAct === "boolean") return p.canAct;
  return !hasStatusId(p, "freeze");
}

function moveScaleOf(p) {
  if (Number.isFinite(p.moveScale)) return p.moveScale;
  let scale = 1;
  for (const s of statusesOf(p)) {
    if (!s || num(s.t) <= 0) continue;
    const id = s.id || s.kind;
    if (id === "slow" || id === "sticky") scale *= 1 - Math.min(0.9, num(s.mag, 0.4));
    else if (id === "freeze") scale = 0;
  }
  return scale;
}

/**
 * 「快出局了」的程度。combat 记在 impact 上，getView 只透出 sim 的 knockScale
 * （1 起步，越挨打越大），两者换算到同一个 0..1.6 量纲。
 */
function impactOf(p) {
  if (Number.isFinite(p.impact)) return p.impact;
  return Math.max(0, num(p.knockScale, 1) - 1);
}

const GLOVE_TABLE = { ...FALLBACK_GLOVE_BY_ID, ...DATA_GLOVE_BY_ID };

function gloveOf(me) {
  const slot = num(me.activeSlot, 0);
  const id = me.activeGloveId || (slot === 1 ? me.offhandId : me.gloveId) || me.gloveId || "cotton";
  const g = GLOVE_TABLE[id] || GLOVE_TABLE.cotton || FALLBACK_GLOVE_BY_ID.cotton;
  return {
    id,
    slapRange: num(me.slapRange, g.slapRange),
    slapAngleDeg: num(me.slapAngleDeg, g.slapAngleDeg),
    skillId: normalizeSkillId(me.skillId || g.skillId),
    skillCooldown: num(me.skillCooldown, num(g.skillCooldown, 6)),
  };
}

/**
 * 主动技转好了没有。三种来源按可信度排：
 * getView 的剩余冷却 `skillCd` > combat 的绝对时间 `cd.skillAt` > 自己按下时的估算。
 */
function skillReadyFor(me, mem, now) {
  if (Number.isFinite(me.skillCd)) return me.skillCd <= 0;
  const at = me.cd && me.cd.skillAt;
  if (typeof at === "number") return now >= at;
  return mem.timers.skill <= 0;
}

function dashReadyFor(me) {
  if (Number.isFinite(me.dashCd) && me.dashCd > 0) return false;
  if (Number.isFinite(me.dashT) && me.dashT > 0) return false;
  if (me.canDash === false) return false;
  return me.sticky !== true && !hasStatusId(me, "sticky");
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

function calibrateMoveSpace(mem, me, dt, face) {
  if (!CONFIG.autoDetectMoveSpace) return;
  if (!mem.lastPos || !mem.lastCmd || dt <= 0) return;
  const cmdLen = Math.hypot(mem.lastCmd.x, mem.lastCmd.z);
  if (cmdLen < 0.3) return;
  const moved = normalize(num(me.x) - mem.lastPos.x, num(me.z) - mem.lastPos.z);
  if (moved.len < 0.01) return;

  const asWorld = normalize(mem.lastCmd.x, mem.lastCmd.z);
  const rotated = face.toWorld(mem.lastCmd.x, mem.lastCmd.z, mem.lastYaw);
  const asLocal = normalize(rotated.x, rotated.z);
  const sw = moved.x * asWorld.x + moved.z * asWorld.z;
  const sl = moved.x * asLocal.x + moved.z * asLocal.z;
  if (Math.abs(sw - sl) < 0.25) return;
  mem.spaceScore = clamp(mem.spaceScore + (sw > sl ? 1 : -1) * Math.min(1, moved.len * 4), -6, 6);
}

function moveSpaceFor(view, mem) {
  const hint = (view && (view.moveSpace || view.inputSpace)) || (view && view.config && view.config.moveSpace);
  if (hint === "world" || hint === "local") return hint;
  // src/sim 的快照：readMoveVector 默认按世界系解释。
  if (isSimSnapshot(view)) return "world";
  if (mem.spaceScore > 1.5) return "world";
  if (mem.spaceScore < -1.5) return "local";
  return CONFIG.moveSpace;
}

// ---------------------------------------------------------------- 目标评估

/** 越接近出局越「残血」：吃过的击退、离台缘的距离、是否背对我。 */
function vulnerability(me, foe, R, face) {
  const edge = clamp01(Math.hypot(num(foe.x), num(foe.z)) / Math.max(1, R));
  const impact = clamp01(impactOf(foe) / 1.6);
  const ff = face.forward(num(foe.yaw));
  const toMe = dirTo(foe, me);
  const facingAway = clamp01(-(ff.x * toMe.x + ff.z * toMe.z));
  const frozen = foe.frozen === true || moveScaleOf(foe) < 0.7 ? 0.5 : 0;
  const awakePenalty = num(foe.awakenedT) > 0 ? 0.8 : 0;
  return edge * 2 + impact * 1.5 + facingAway * 1.2 + frozen - awakePenalty;
}

function pickTarget(me, foes, persona, R, face) {
  if (!foes.length) return null;
  let best = null;
  let bestScore = -Infinity;
  for (const foe of foes) {
    const d = dist2d(me, foe);
    let score;
    if (persona === "bully") score = vulnerability(me, foe, R, face) * 2.2 - d * 0.22;
    else if (persona === "fox") score = -d * 0.5 - (num(foe.awakenedT) > 0 ? 3 : 0) + clamp01(impactOf(foe)) * 1.2;
    else score = -d;
    if (score > bestScore) {
      bestScore = score;
      best = foe;
    }
  }
  return best;
}

// ---------------------------------------------------------------- 走位

/** 视野里所有已经碎掉的台块，带一个统一的半径。 */
function brokenTiles(view) {
  const out = [];
  for (const tile of viewTiles(view)) {
    if (!tile) continue;
    const broken = tile.broken === true || tile.destroyed === true || tile.alive === false || num(tile.hp, 1) <= 0;
    if (!broken) continue;
    out.push({ x: num(tile.x), z: num(tile.z), r: tileR(tile, view) });
  }
  return out;
}

const DETOUR_STEPS = 6;

/** 沿 dir 走，返回踩空之前还能走多远（一路都是实地就是 reach）。 */
function clearRun(holes, me, dirX, dirZ, reach) {
  const step = reach / DETOUR_STEPS;
  for (let i = 1; i <= DETOUR_STEPS; i++) {
    const s = step * i;
    const x = num(me.x) + dirX * s;
    const z = num(me.z) + dirZ * s;
    for (const h of holes) {
      if (Math.hypot(x - h.x, z - h.z) <= h.r + 0.7) return s - step;
    }
  }
  return reach;
}

/**
 * 排斥力算的是「离洞多近」，碎块左右对称时两边的切向分量互相抵消，
 * 于是 Bot 顶着洞正中央直直走下去。这里再加一道前视：
 * 采样一圈候选方向，挑第一个走得通的；一个都走不通就挑能多走几步的那个。
 * 候选按偏角从小到大、并且 spin 那一侧优先，绕行方向才不会每帧翻面。
 */
function detourAround(holes, me, dirX, dirZ, reach, spin) {
  const straight = clearRun(holes, me, dirX, dirZ, reach);
  if (straight >= reach) return { x: dirX, z: dirZ, detoured: false };

  let best = { x: dirX, z: dirZ, run: straight };
  for (const deg of [30, 60, 90, 120, 150, 180]) {
    for (const side of deg === 180 ? [spin] : [spin, -spin]) {
      const a = ((deg * Math.PI) / 180) * side;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const nx = dirX * c - dirZ * s;
      const nz = dirX * s + dirZ * c;
      const run = clearRun(holes, me, nx, nz, reach);
      if (run >= reach) return { x: nx, z: nz, detoured: true };
      if (run > best.run + 0.05) best = { x: nx, z: nz, run };
    }
  }
  return { x: best.x, z: best.z, detoured: true };
}

/**
 * 台缘与碎块的排斥力，避免 Bot 自己走下去。
 * 碎块除了往外推还给一份切向分量，让 Bot 绕着洞走而不是顶着洞边发抖。
 */
function safetySteer(me, holes, R, spin, caution = 0.5) {
  let sx = 0;
  let sz = 0;
  const r = Math.hypot(num(me.x), num(me.z));
  const soft = R * 0.78;
  if (r > soft && r > 0.001) {
    const w = clamp01((r - soft) / Math.max(0.001, R - soft));
    const push = 2.1 + caution * 0.9;
    sx += (-num(me.x) / r) * w * push;
    sz += (-num(me.z) / r) * w * push;
  }
  for (const h of holes) {
    const d = Math.hypot(num(me.x) - h.x, num(me.z) - h.z);
    const rad = h.r + 2;
    if (d >= rad || d < 0.001) continue;
    const w = (rad - d) / rad;
    const ox = (num(me.x) - h.x) / d;
    const oz = (num(me.z) - h.z) / d;
    // 切向统一取同一个旋向：按「想去的方向」逐块决定的话，破洞两侧的块会各推一边，
    // Bot 就卡在洞口左右横跳。
    sx += ox * 2.8 * w + -oz * spin * 2.2 * w;
    sz += oz * 2.8 * w + ox * spin * 2.2 * w;
  }
  return { x: sx, z: sz };
}

/** 站到目标与台心之间：从内侧扇，把人往外推。 */
function innerSidePoint(target, R, offset) {
  const r = Math.hypot(num(target.x), num(target.z));
  if (r < 0.5) return { x: num(target.x), z: num(target.z) - offset };
  return { x: num(target.x) - (num(target.x) / r) * offset, z: num(target.z) - (num(target.z) / r) * offset };
}

function behindPoint(target, offset, face) {
  const f = face.forward(num(target.yaw));
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
  const scared = impactOf(me) > 0.9 || num(target.awakenedT) > 0;
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
  const { me, target, glove, mem, rng, dist, R, face } = ctx;
  const reach = glove.slapRange * 0.9;
  const targetEdge = Math.hypot(num(target.x), num(target.z)) / Math.max(1, R);
  // 目标已经在外圈就抢内侧（往外扇），否则抢背后。
  const anchor = targetEdge > 0.55 ? innerSidePoint(target, R, reach * 0.75) : behindPoint(target, reach * 0.8, face);
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
  const wantSkill = ctx.skillReady && dist <= skillRange(glove.skillId, 5.5) && (targetEdge > 0.45 || impactOf(target) > 0.8);
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

  // 安全区：Bot 全员休眠。不走位、不扇、不放技能、不换掌，连一帧都不许出手——
  // 走道选掌期间不该有任何战斗判定。yaw 原样回给 sim（sim 会照单写回 p.yaw），
  // 免得三只 Bot 在裂岛上齐刷刷扭到 yaw=0。
  if (isHubView(view)) {
    hibernate(botId);
    if (me) out.yaw = num(me.yaw);
    return out;
  }

  const mem = memoryOf(botId);

  const face = faceOf(view);
  const now = viewClock(view, mem.lastT == null ? 0 : mem.lastT + 1 / 60);
  const dt = clamp(mem.lastT == null ? 1 / 60 : now - mem.lastT, 0, 0.25) || 1 / 60;
  mem.lastT = now;
  for (const k of Object.keys(mem.timers)) mem.timers[k] = Math.max(0, mem.timers[k] - dt);

  if (!me) {
    mem.lastCmd = null;
    mem.lastPos = null;
    return out;
  }
  out.yaw = num(me.yaw);
  calibrateMoveSpace(mem, me, dt, face);
  mem.lastPos = { x: num(me.x), z: num(me.z) };
  mem.lastCmd = null;

  if (!isFightable(me)) return out;

  const R = arenaR(view);
  const persona = personaFor(me, botId);
  const tuning = tuningOf(persona);
  const glove = gloveOf(me);
  const foes = players.filter((p) => p && p.id !== botId && isFightable(p));

  // 无人可打：回台心巡逻，别站着不动。
  if (!foes.length) {
    const home = normalize(-num(me.x), -num(me.z));
    const wander = mem.strafeSign;
    const wx = home.x * 0.6 - home.z * 0.4 * wander;
    const wz = home.z * 0.6 + home.x * 0.4 * wander;
    return emit(out, mem, view, face, wx, wz, num(me.yaw), { slap: false, skill: false, dash: false, jump: false, switchGlove: false });
  }

  const target = pickTarget(me, foes, persona, R, face) || foes[0];
  mem.targetId = target.id;
  const dist = dist2d(me, target);

  if (mem.timers.strafe <= 0) {
    mem.strafeSign = random() < 0.5 ? -1 : 1;
    mem.timers.strafe = 1.4 + random() * 1.8;
  }
  if (mem.timers.aim <= 0) {
    // num() 兜的是病态随机源与被写坏的 reactionJitter：瞄准抖动一旦成了 NaN，
    // 整条 aimYaw 都会跟着变非数。
    mem.aimNoise = num((random() * 2 - 1) * CONFIG.reactionJitter);
    mem.timers.aim = tuning.reactionSeconds * 0.75 + random() * 0.22;
  }

  // 朝向按 view 的方言算：sim 快照下 yaw=0 面向 -Z，算错就是每一掌都朝反方向扇。
  const aimYaw = wrapAngle(face.yawTo(num(target.x) - num(me.x), num(target.z) - num(me.z)) + mem.aimNoise);
  const aimError = wrapAngle(aimYaw - num(me.yaw));

  const skillReady = glove.skillId !== "none" && skillReadyFor(me, mem, now) && canAct(me);

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
    face,
    tuning,
    skillReady: skillReady && random() < 0.5 + tuning.skillEagerness * 0.5,
    canDash: dashReadyFor(me) && random() < 0.4 + tuning.dashEagerness * 0.6,
  };

  const brain = BRAINS[persona] || bruteBrain;
  const plan = brain(ctx);

  // 绕行旋向要黏住：每帧按当前朝向重新挑边的话，Bot 会卡在洞口左右横跳。
  const holes = brokenTiles(view);
  if (mem.timers.detour <= 0) mem.detourSign = mem.strafeSign;

  const safety = safetySteer(me, holes, R, mem.detourSign, tuning.edgeCaution);
  let wx = plan.mx + safety.x;
  let wz = plan.mz + safety.z;
  const mv = normalize(wx, wz);
  const speed = clamp(mv.len, 0, 1) > 0.15 ? 1 : 0;
  wx = mv.x * speed;
  wz = mv.z * speed;

  // 前视绕洞：排斥力对左右对称的破洞无能为力，这里兜住。
  if (speed > 0 && holes.length) {
    const detour = detourAround(holes, me, wx, wz, 3.2 + tuning.edgeCaution * 2, mem.detourSign);
    if (detour.detoured) mem.timers.detour = 1.2;
    wx = detour.x;
    wz = detour.z;
  }

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
  const cd = me.cd || {};
  const skillWait = Number.isFinite(me.skillCd)
    ? me.skillCd
    : typeof cd.skillAt === "number"
      ? cd.skillAt - now
      : null;
  let switchGlove = false;
  if (mem.timers.switch <= 0) {
    const stale = glove.skillId === "none" || (skillWait != null && skillWait > glove.skillCooldown * 0.6);
    if (stale && me.offhandId && me.offhandId !== glove.id) {
      switchGlove = true;
      mem.timers.switch = 4 + random() * 4;
    } else {
      mem.timers.switch = 1.5;
    }
  }

  return emit(out, mem, view, face, wx, wz, aimYaw, {
    slap: !!plan.slap,
    skill: !!plan.skill,
    dash,
    jump,
    switchGlove,
  });
}

/**
 * Bot 侧 `Input.yaw` 的最后一道闸：非有限值一律回落到上一帧的朝向（再兜到 0）。
 * sim 把 null / NaN 读作「保持朝向」，是给玩家 free 静止帧留的口子；Bot 一旦借到
 * 这个口子就是静默故障 —— 不报错，只是从此不再转身。宁可少转一帧也不放非数出去。
 */
function finiteYaw(yaw, mem) {
  if (Number.isFinite(yaw)) return yaw;
  return num(mem && mem.lastYaw);
}

function emit(out, mem, view, face, wx, wz, rawYaw, flags) {
  const yaw = finiteYaw(rawYaw, mem);
  const space = moveSpaceFor(view, mem);
  const vec = space === "local" ? face.toLocal(wx, wz, yaw) : { x: wx, z: wz };
  out.moveX = clamp(num(vec.x), -1, 1);
  out.moveZ = clamp(num(vec.z), -1, 1);
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
export default { think, resetBots, configureBots, BOT_PERSONAS, personaFor, isHubView };
