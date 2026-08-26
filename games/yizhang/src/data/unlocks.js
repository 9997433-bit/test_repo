// 异掌 · 局内解锁挑战（存档 key `yizhang-save-v1` 由 UI/core 层负责，这里只定义规格）
// event 是 sim 侧可机判的事件类型，params 为判定参数。全部单局内完成（scope: "match"）。

/**
 * 事件类型约定（sim 结算时发出，挑战系统计数）：
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
];

export const UNLOCK_BY_ID = Object.fromEntries(UNLOCKS.map((u) => [u.id, u]));
export const UNLOCK_BY_GLOVE = Object.fromEntries(
  UNLOCKS.map((u) => [u.gloveId, u]),
);
