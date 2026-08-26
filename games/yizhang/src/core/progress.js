// 单局挑战进度追踪。只吃归一化事件 + 当帧 view，不碰 sim 内部状态。
// 判定口径与 src/data/unlocks.js 的 params 一一对应，缺信息时宁可不给，
// 不要靠猜把解锁送出去。

import { createMatchProgress } from "./unlocks.js";

const RIM_MARGIN = 3; // 「外环击杀」：受害者起飞点距台缘 ≤3m

function facingAway(target, attacker) {
  if (!target || !attacker) return false;
  // sim 约定 yaw=0 面向 -Z
  const fx = -Math.sin(target.yaw || 0);
  const fz = -Math.cos(target.yaw || 0);
  const dx = attacker.x - target.x;
  const dz = attacker.z - target.z;
  const len = Math.hypot(dx, dz);
  if (len < 1e-4) return false;
  return (fx * dx + fz * dz) / len < -0.2;
}

export function createProgressTracker(opts = {}) {
  const selfId = opts.selfId;
  const chainWindow = opts.chainWindow ?? 8;
  const dashWindow = opts.dashWindow ?? 2;
  const revengeWindow = opts.revengeWindow ?? 3;

  let progress = createMatchProgress();
  let lastDashT = -Infinity;
  let lastTakenHitT = -Infinity;
  let lastTakenHitBy = null;
  let lastKillT = -Infinity;
  const behindFlags = new Map(); // victimId -> 最近一次被我从背后打中

  return {
    get progress() {
      return progress;
    },
    reset() {
      progress = createMatchProgress();
      lastDashT = -Infinity;
      lastTakenHitT = -Infinity;
      lastTakenHitBy = null;
      lastKillT = -Infinity;
      behindFlags.clear();
    },
    /** 本局是否以胜利结束（结算时由 main 告知）。 */
    finish(won) {
      progress.won = !!won;
      return progress;
    },
    /** @param {Array} events 归一化事件 @param {object} view 当帧 view */
    feed(events, view) {
      const now = Number.isFinite(view && view.t) ? view.t : 0;
      const radius = (view && view.arenaRadius) || 20;
      const byId = new Map();
      for (const p of (view && view.players) || []) byId.set(p.id, p);

      for (const e of events) {
        switch (e.type) {
          case "dash":
            if (e.playerId === selfId) {
              progress.dashes += 1;
              lastDashT = now;
            }
            break;
          case "awaken":
            if (e.playerId === selfId) progress.awakens += 1;
            break;
          case "hit": {
            if (e.playerId === selfId) {
              progress.slapHits += 1;
              const behind = facingAway(byId.get(e.targetId), byId.get(selfId));
              behindFlags.set(e.targetId, behind);
            } else if (e.targetId === selfId) {
              lastTakenHitT = now;
              lastTakenHitBy = e.playerId;
            }
            break;
          }
          case "ko": {
            if (e.victimId === selfId) {
              progress.deaths += 1;
              break;
            }
            if (e.killerId !== selfId) break;
            progress.kills += 1;
            if (behindFlags.get(e.victimId)) progress.behindKills += 1;
            behindFlags.delete(e.victimId);

            const victim = byId.get(e.victimId);
            const vx = Number.isFinite(e.x) ? e.x : victim ? victim.x : null;
            const vz = Number.isFinite(e.z) ? e.z : victim ? victim.z : null;
            if (vx != null && vz != null && radius - Math.hypot(vx, vz) <= RIM_MARGIN) {
              progress.rimKills += 1;
            }
            if (now - lastDashT <= dashWindow) progress.dashKills += 1;
            if (now - lastTakenHitT <= revengeWindow && lastTakenHitBy === e.victimId) {
              progress.revengeKills += 1;
            }
            if (now - lastKillT <= chainWindow) progress.chainKills = Math.max(2, progress.chainKills + 1);
            lastKillT = now;
            break;
          }
          default:
            break;
        }
      }
    },
  };
}
