// 异掌 · 冲量 / 掌意 / 碎地 / 反击 的底层写入层。
// combat/index.js 与 combat/skills.js 共用，避免循环依赖。

import { ARENA, HIT, IMPACT, METER } from "./constants.js";
import { applyStatus, refreshDerived } from "./statuses.js";
import {
  clamp,
  clamp01,
  clockOf,
  gloveIdFor,
  horizDir,
  inCone,
  isTileAlive,
  num,
  pushEvent,
  tileList,
  tileRadius,
} from "./util.js";

export function gainMeter(player, amount) {
  if (!player || !amount) return 0;
  const before = clamp01(num(player.meter));
  player.meter = clamp01(before + amount);
  return player.meter - before;
}

/** 被扇越多 impact 越高，后续击退越远（0..IMPACT.max）。 */
export function addImpact(target, power) {
  if (!target) return 0;
  const next = clamp(num(target.impact) + num(power) * IMPACT.perPower, 0, IMPACT.max);
  target.impact = next;
  return next;
}

export function knockbackScale(target) {
  if (!target) return 1;
  return (1 + num(target.impact)) * num(target.knockbackTakenMul, 1) * IMPACT.knockbackMul;
}

/**
 * 记一次「被打飞」：归属、时间戳、失控窗口。不动速度，
 * 磁掌拉近这类直接改写速度的技能也走这里，保证宿主看到同一套记账。
 *
 * 字段有两套名字：combat 契约用 `knockbackT` / `lastHitAt`，`src/sim` 的
 * physics/step 用 `kbT` / `lastHitT`。两边都写，冲量才不会当帧被地面摩擦吃光，
 * 掉下台时也才找得到击杀归属。
 */
export function markKnockback(state, target, speed, opts = {}) {
  if (!target) return 0;
  const now = num(opts.now, clockOf(state));
  target.lastHitBy = opts.srcId ?? target.lastHitBy ?? null;
  target.lastHitAt = now;
  if (typeof target.lastHitT === "number") target.lastHitT = now;
  if (opts.window === false) return 0;
  const window = clamp(num(speed) * HIT.knockbackTimePerSpeed, HIT.knockbackTimeMin, HIT.knockbackTimeMax);
  target.knockbackT = Math.max(num(target.knockbackT), window);
  if (typeof target.kbT === "number") target.kbT = Math.max(target.kbT, window);
  return window;
}

/**
 * 给目标一个水平冲量 + 抬升，直接写进速度。
 * @returns {{x:number,y:number,z:number}} 实际施加的冲量
 */
export function applyKnockback(state, target, dirX, dirZ, mag, lift = 0, opts = {}) {
  const scale = opts.raw ? 1 : knockbackScale(target);
  const impulse = { x: dirX * mag * scale, y: lift * (opts.raw ? 1 : Math.min(1.6, scale)), z: dirZ * mag * scale };
  if (!target) return impulse;
  target.vx = num(target.vx) + impulse.x;
  target.vz = num(target.vz) + impulse.z;
  if (impulse.y) {
    target.vy = num(target.vy) + impulse.y;
    if (target.grounded === true) target.grounded = false;
    if (target.onGround === true) target.onGround = false;
    if (typeof target.coyoteT === "number") target.coyoteT = 0;
  }
  markKnockback(state, target, Math.hypot(impulse.x, impulse.z), {
    srcId: opts.srcId,
    now: num(opts.now, clockOf(state)),
    window: opts.knockbackWindow !== false,
  });
  return impulse;
}

/** 单块台面掉血；破了就 broken=true 并发事件。 */
export function damageTile(state, tile, damage, srcId = null) {
  if (!tile || !isTileAlive(tile) || damage <= 0) return null;
  const maxHp = num(tile.maxHp, num(tile.hp, ARENA.tileHp));
  if (tile.maxHp == null) tile.maxHp = maxHp;
  const hp = Math.max(0, num(tile.hp, maxHp) - damage);
  tile.hp = hp;
  const broke = hp <= 0;
  if (broke) {
    tile.broken = true;
    if ("alive" in tile) tile.alive = false;
    pushEvent(state, { type: "tileBreak", tileId: tile.id ?? null, x: num(tile.x), z: num(tile.z), by: srcId });
  }
  return { tileId: tile.id ?? null, hp, broke, x: num(tile.x), z: num(tile.z) };
}

/**
 * 圆 / 圆环范围碎地。inner>0 时只打圆环（陨掌觉醒的裂圈）。
 * 伤害按到中心的距离线性衰减到 falloffMin 倍。
 */
export function damageTilesInRadius(state, cx, cz, radius, damage, opts = {}) {
  const out = [];
  if (!(radius > 0) || !(damage > 0)) return out;
  const inner = num(opts.inner, 0);
  const falloffMin = num(opts.falloffMin, 0.55);
  for (const tile of tileList(state)) {
    if (!isTileAlive(tile)) continue;
    const tr = tileRadius(tile, state);
    const d = Math.hypot(num(tile.x) - cx, num(tile.z) - cz);
    const reach = radius + tr;
    if (d > reach) continue;
    if (inner > 0 && d + tr < inner) continue;
    const k = radius > 0 ? clamp01(1 - d / reach) : 1;
    const dmg = damage * (falloffMin + (1 - falloffMin) * k);
    const res = damageTile(state, tile, dmg, opts.srcId ?? null);
    if (res) out.push(res);
  }
  return out;
}

/**
 * 弹簧反击判定：target 处于 parryWindow 且大致面朝来袭方向时，
 * 打击被吃掉并按倍率弹回 attacker 身上。
 * @param {string|null} [incomingGloveId] 来袭掌，只用于事件上的 `attackerGloveId`
 * @returns {object|null} 反击结果，null 表示没挡住
 */
export function tryParry(state, attacker, target, incomingPower, now, incomingGloveId = null) {
  if (!target || !attacker) return null;
  const list = Array.isArray(target.statuses) ? target.statuses : [];
  const st = list.find((s) => s && s.kind === "parryWindow" && num(s.t) > 0);
  if (!st) return null;
  if (!inCone(target, attacker, 200)) return null;

  const meta = st.meta || {};
  const mul = num(meta.reflectMul, 1.35);
  const base = num(meta.reflectBase, 4);
  const lift = num(meta.reflectLift, 1.5);
  const hop = num(meta.hop, 0);

  const away = horizDir(target, attacker);
  const mag = num(incomingPower) * mul + base;
  const impulse = applyKnockback(state, attacker, away.x, away.z, mag, lift, { srcId: target.id, now });
  addImpact(attacker, mag * 0.5);
  gainMeter(target, METER.onParry);
  if (hop > 0) {
    target.vy = num(target.vy) + hop;
    if (target.grounded === true) target.grounded = false;
  }
  st.t = 0;
  target.statuses = list.filter((s) => s !== st);
  applyStatus(target, "invuln", 0.18, { srcId: target.id });
  refreshDerived(target);
  pushEvent(state, {
    type: "parry",
    parrierId: target.id,
    attackerId: attacker.id,
    // 分派键是**弹反者**结算时的生效掌（契约 §5.1-8）；来袭掌另记一列，两边都不用猜。
    gloveId: gloveIdFor(target),
    skillId: "parry",
    attackerGloveId: gloveIdFor(attacker, incomingGloveId),
    power: mag,
    hop: hop > 0,
    t: num(now),
  });
  return { parrierId: target.id, attackerId: attacker.id, impulse, power: mag };
}

/**
 * 扇击/技能命中的通用落地：算方向、算倍率、写冲量、加掌意、发事件。
 * 命中被弹返时返回 { parried:true }。
 */
export function landHit(state, attacker, target, cfg) {
  const {
    power,
    lift = 0,
    now = 0,
    kind = "slap",
    skillId = null,
    gloveId = null,
    dirOverride = null,
    behindBonus = true,
    meterDealt = METER.onHitDealt,
    meterTaken = METER.onHitTaken,
    extraMul = 1,
    statuses = null,
  } = cfg || {};

  // 出招掌：调用方（doSlap / 各技能 / 延迟结算队列）记下来的那只优先。
  const gid = gloveIdFor(attacker, gloveId);

  const parried = tryParry(state, attacker, target, power, now, gid);
  if (parried) {
    // 这一掌被吃掉了：targetId 留空，宿主就不会把它记成一次落地的命中。
    return {
      id: target.id,
      targetId: null,
      applied: true,
      parried: true,
      impulse: { x: 0, y: 0, z: 0 },
      kind,
      skillId,
      gloveId: gid,
      reflect: parried,
    };
  }

  const dir = dirOverride || horizDir(attacker, target);
  const behind = behindBonus && cfg.behind === true ? HIT.behindMul : 1;
  const mag = power * extraMul * behind;
  const impulse = applyKnockback(state, target, dir.x, dir.z, mag, lift, { srcId: attacker.id, now });
  addImpact(target, mag);
  gainMeter(attacker, meterDealt);
  gainMeter(target, meterTaken);

  if (Array.isArray(statuses)) {
    for (const s of statuses) {
      if (!s || !s.kind) continue;
      applyStatus(target, s.kind, s.t, { mag: s.mag, srcId: attacker.id, meta: s.meta });
    }
  }

  const hit = {
    id: target.id,
    // sim.step 的 applyHits 按 targetId 找人，applied 表示冲量已经写进速度、
    // 宿主只需要记账（连击、掌意、击杀归属），不要再施加一次。
    targetId: target.id,
    applied: true,
    impulse,
    power: mag,
    kind,
    skillId,
    // HitRecord.gloveId（契约 §5.2）：sim 发 hit 事件时的分派键，
    // 延迟命中（陨掌落地 / 冲刺接触）期间攻击者可能已经换掌，所以由 combat 填。
    gloveId: gid,
    distance: num(dir.dist, 0),
    behind: behind > 1,
    hitX: num(target.x),
    hitZ: num(target.z),
    attackerId: attacker.id,
  };
  pushEvent(state, {
    type: kind === "slap" ? "slap" : "skillHit",
    attackerId: attacker.id,
    targetId: target.id,
    gloveId: gid,
    skillId,
    power: mag,
    impulse,
    t: num(now),
  });
  return hit;
}
