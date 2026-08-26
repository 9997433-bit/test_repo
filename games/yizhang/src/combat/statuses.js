// 异掌 · 状态机：slow / freeze / sticky / parryWindow / invuln
// 状态挂在 player.statuses[]，每项 { kind, t, mag, srcId, meta }。
// tickStatuses 每帧递减并把结果折算成 player.moveScale / player.canAct 等派生字段。

import { STATUS_DEFAULT, STATUS_KINDS } from "./constants.js";
import { num, simDrivenPlayer } from "./util.js";

/**
 * combat 用 `kind` 命名状态，`src/sim`（physics.statusMods / view.playerView）读 `id`。
 * 两个字段并存，sim 才能在自己的积分里吃到减速与冻结。sticky 在 sim 侧等价于减速。
 */
const SIM_STATUS_ID = {
  slow: "slow",
  sticky: "slow",
  freeze: "freeze",
  parryWindow: "parryWindow",
  invuln: "invuln",
};

export function ensureStatuses(player) {
  if (!Array.isArray(player.statuses)) player.statuses = [];
  return player.statuses;
}

/**
 * 叠加一个状态。同 kind 取「更长时间 + 更强强度」，不无限叠层。
 * @returns {object|null} 实际生效的状态项
 */
export function applyStatus(player, kind, t, opts = {}) {
  if (!player || !STATUS_KINDS.includes(kind)) return null;
  const def = STATUS_DEFAULT[kind] || { mag: 1, t: 1 };
  const dur = num(t, def.t);
  if (dur <= 0) return null;
  const mag = num(opts.mag, def.mag);
  const list = ensureStatuses(player);
  let cur = list.find((s) => s && s.kind === kind);
  if (!cur) {
    cur = { kind, id: SIM_STATUS_ID[kind] || kind, t: 0, mag: 0, srcId: opts.srcId ?? null };
    list.push(cur);
  }
  cur.t = Math.max(num(cur.t), dur);
  cur.mag = Math.max(num(cur.mag), mag);
  if (opts.srcId != null) cur.srcId = opts.srcId;
  if (opts.meta) cur.meta = { ...(cur.meta || {}), ...opts.meta };
  if (kind === "invuln") player.invulnT = Math.max(num(player.invulnT), dur);
  refreshDerived(player);
  return cur;
}

export function clearStatus(player, kind) {
  if (!player || !Array.isArray(player.statuses)) return;
  player.statuses = player.statuses.filter((s) => !s || s.kind !== kind);
  if (kind === "invuln") player.invulnT = 0;
  refreshDerived(player);
}

export function clearAllStatuses(player) {
  if (!player) return;
  player.statuses = [];
  player.invulnT = 0;
  refreshDerived(player);
}

/**
 * 把当前状态折算成派生字段，sim / render / ai 都直接读这几个：
 *  - moveScale 0..1 移动速度倍率
 *  - canAct    能否扇击 / 放技能 / 冲刺
 *  - frozen / sticky / parrying / invulnerable 布尔快照
 *  - knockbackTakenMul 受击退倍率（冻结时更飘）
 */
export function refreshDerived(player) {
  if (!player) return player;
  const list = Array.isArray(player.statuses) ? player.statuses : [];
  let moveScale = 1;
  let frozen = false;
  let sticky = false;
  let parrying = false;
  let invulnerable = num(player.invulnT) > 0;

  for (const s of list) {
    if (!s || num(s.t) <= 0) continue;
    switch (s.kind) {
      case "slow":
        moveScale *= 1 - Math.min(0.9, num(s.mag, STATUS_DEFAULT.slow.mag));
        break;
      case "sticky":
        moveScale *= 1 - Math.min(0.95, num(s.mag, STATUS_DEFAULT.sticky.mag));
        sticky = true;
        break;
      case "freeze":
        frozen = true;
        break;
      case "parryWindow":
        parrying = true;
        break;
      case "invuln":
        invulnerable = true;
        break;
      default:
        break;
    }
  }

  if (frozen) moveScale = 0;
  player.moveScale = Math.max(0, moveScale);
  player.frozen = frozen;
  player.sticky = sticky;
  player.parrying = parrying;
  player.invulnerable = invulnerable;
  player.canAct = !frozen && player.alive !== false;
  player.canDash = player.canAct && !sticky;
  player.knockbackTakenMul = frozen ? 1.25 : 1;
  return player;
}

/** 递减一个玩家的所有状态。返回本帧到期的 kind 列表。 */
export function tickPlayerStatuses(player, dt) {
  const expired = [];
  if (!player) return expired;
  const list = Array.isArray(player.statuses) ? player.statuses : [];
  if (list.length) {
    const keep = [];
    for (const s of list) {
      if (!s || !STATUS_KINDS.includes(s.kind)) continue;
      s.t = num(s.t) - dt;
      if (s.t > 0) keep.push(s);
      else expired.push(s.kind);
    }
    player.statuses = keep;
  }
  if (simDrivenPlayer(player)) {
    // sim.step 的 tickTimers 已经在减 invulnT，这里只把 combat 自己发的无敌帧补上去。
    const st = (player.statuses || []).find((s) => s && s.kind === "invuln" && num(s.t) > 0);
    if (st) player.invulnT = Math.max(num(player.invulnT), num(st.t));
  } else if (num(player.invulnT) > 0) {
    player.invulnT = Math.max(0, num(player.invulnT) - dt);
  }
  refreshDerived(player);
  return expired;
}

export function statusSnapshot(player) {
  const list = Array.isArray(player && player.statuses) ? player.statuses : [];
  return list
    .filter((s) => s && num(s.t) > 0)
    .map((s) => ({ kind: s.kind, t: Math.round(num(s.t) * 1000) / 1000, mag: num(s.mag) }));
}
