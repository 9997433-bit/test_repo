// 异掌 · 解锁挑战（存档 key `yizhang-save-v1` 由 UI/core 层负责，这里只定义规格）
//
// 两种 scope：
// - "match"  单局内完成：event 是 sim 侧可机判的事件类型，params 为判定参数。
// - "career" 生涯累计（P2 内容轮）：不发局内事件，stat 指向存档 stats 的累计字段
//   （src/core/storage.js DEFAULTS.stats），isGloveUnlocked 直接对照 count。
//   core 的单局 progressMeets 不认识 career 规格（无 event ⇒ 落 default false），
//   生涯掌不会被局内结算误报「本局新解锁」。
/**
 * 事件类型约定（sim 结算时发出，挑战系统计数；仅 scope:"match" 用）：
 * - slap_hit        每次扇击命中
 * - kill            击杀（带 context: { afterDashSeconds, victimRimDistance, sinceLastKillSeconds, sinceTakenHitSeconds, victimWasAttacker }）
 * - match_win       胜场（带 context: { deaths }）
 * - awaken          进入觉醒
 */

export const UNLOCKS = [
  {
    id: "unlock_granite",
    gloveId: "granite",
    name: "百掌不倦",
    desc: "单局内命中 15 次扇击",
    scope: "match",
    event: "slap_hit",
    count: 15,
    params: {},
  },
  {
    id: "unlock_gale",
    gloveId: "gale",
    name: "追风",
    desc: "冲刺结束后 2 秒内完成 1 次击杀",
    scope: "match",
    event: "kill",
    count: 1,
    params: { afterDashSeconds: 2 },
  },
  {
    id: "unlock_frost",
    gloveId: "frost",
    name: "稳如寒潭",
    desc: "取得一场零坠落的胜利",
    scope: "match",
    event: "match_win",
    count: 1,
    params: { maxDeaths: 0 },
  },
  {
    id: "unlock_spring",
    gloveId: "spring",
    name: "受身反杀",
    desc: "被扇中后 3 秒内击杀扇你的人",
    scope: "match",
    event: "kill",
    count: 1,
    params: { withinSecondsOfTakenHit: 3, victimWasAttacker: true },
  },
  {
    id: "unlock_afterimage",
    gloveId: "afterimage",
    name: "残影连斩",
    desc: "8 秒内完成 2 次击杀",
    scope: "match",
    event: "kill",
    count: 2,
    params: { chainWindowSeconds: 8 },
  },
  {
    id: "unlock_magnet",
    gloveId: "magnet",
    name: "引狼入渊",
    desc: "单局 3 次外环击杀（受害者起飞点距边 ≤3m）",
    scope: "match",
    event: "kill",
    count: 3,
    params: { victimRimDistanceMax: 3 },
  },
  {
    id: "unlock_meteor",
    gloveId: "meteor",
    name: "掌意如虹",
    desc: "单局内 2 次觉醒",
    scope: "match",
    event: "awaken",
    count: 2,
    params: {},
  },

  // ---- 生涯累计解锁（P2 内容轮；stat = 存档 stats 字段名，见文件头注释）----
  {
    id: "unlock_cocoon",
    gloveId: "cocoon",
    name: "百炼成茧",
    desc: "生涯累计命中 300 次扇击",
    scope: "career",
    stat: "totalSlapHits",
    count: 300,
    params: {},
  },
  {
    id: "unlock_raven",
    gloveId: "raven",
    name: "掠门之羽",
    desc: "生涯累计穿过传送门 20 次",
    scope: "career",
    stat: "portalCrossings",
    count: 20,
    params: {},
  },
  {
    id: "unlock_victor",
    gloveId: "victor",
    name: "十胜成名",
    desc: "生涯累计取得 10 场胜利",
    scope: "career",
    stat: "wins",
    count: 10,
    params: {},
  },
  {
    id: "unlock_tumbler",
    gloveId: "tumbler",
    name: "屡仆屡起",
    desc: "生涯累计打满 25 场对局",
    scope: "career",
    stat: "matches",
    count: 25,
    params: {},
  },
];

export const UNLOCK_BY_ID = Object.fromEntries(UNLOCKS.map((u) => [u.id, u]));
export const UNLOCK_BY_GLOVE = Object.fromEntries(
  UNLOCKS.map((u) => [u.gloveId, u]),
);
