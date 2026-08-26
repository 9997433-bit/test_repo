export {
  recruit,
  assignHero,
  starUp,
  canRecruit,
  canAssign,
  canStarUp,
  applyBattleInjuries,
  clearHealed,
  tickInjuries,
  injuryRemaining,
  findHero,
  hasRecruitStation,
  isInjured,
  nowSeconds,
  MAX_STAR,
  SHARD_PER_STAR,
  INJURY_SECONDS,
  TICK_SECONDS,
  RECRUIT_BUILDING,
} from "./roster.js";
export { selectLineup, readyHeroes, heroPower, toBattleUnit, isReady, MAX_LINEUP } from "./lineup.js";
// 海盗袭击结算住在 combat/raid.js（它同时要 simulateBattle 和 selectLineup），
// 这里只做门面转发：core/engine.js 只许 import heroes 门面，世界 tick 要用得着。
// 转发的是 combat 的叶子文件、且 heroes 的实现文件依旧不 import combat，故无环。
export {
  canResolveRaid,
  previewRaid,
  runRaid,
  resolveRaid,
  raidEnemies,
  raidSeed,
  RAID_CHOICES,
  RAID_EVENT_ID,
  RAID_TEAM_CAP,
} from "../combat/raid.js";
