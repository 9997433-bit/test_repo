/**
 * 物理层公共入口（Opus-1 所有权）。
 *
 * 稳定契约（其他模块只依赖这些）：
 *   createWorld / stepWorld / predictTrajectory / WORLD_W / WORLD_H / GRAVITY / FIXED_DT
 * 其余导出供关卡数据、战斗结算与 UI 使用，全部 headless、无 DOM 依赖。
 *
 * 切到本目录时（Round 2 的 O4）关心这几组：
 *   - 同源：`stepWorld` 与 `predictTrajectory` 都只经 `advanceEgg` 推进
 *   - 命中：`predictTrajectoryDetailed().firstEnemyHit` / 步进事件 `contact`
 *     一律在 reflect **之前**落账，事后重叠检测必然 miss
 *   - 敌人：`makeEnemy` / `enemyBodies` / `eggEnemyOverlaps`
 *   - 对拍：`createSimBridge` / `compareTrajectories`（见 compat.js）
 *   - 确定性：`hashWorld` / `cloneWorld` / `checkDeterminism`（见 determinism.js）
 *   - 传送门：`makePortalPair(a, b, { oneWay })`、`isPortalEntry`（见 portals.js）
 */

export {
  WORLD_W,
  WORLD_H,
  GRAVITY,
  FIXED_DT,
  createWorld,
  stepWorld,
} from "./world.js";

export {
  activeEggCount,
  addArenaWalls,
  addField,
  addStatic,
  advanceEgg,
  advanceWorld,
  aimToVelocity,
  createEgg,
  createStepContext,
  damageStatic,
  drainBlasts,
  drainEvents,
  emit,
  getStatic,
  isSettled,
  lastHitTimeOf,
  launchEgg,
  markStaticsDirty,
  nextRandom,
  noteContact,
  normalizeEgg,
  removeField,
  removeStatic,
  recycleEgg,
  renderPosition,
  resetEggContacts,
  resetEggIds,
  resetStepContext,
  resetWorld,
  reviveWorld,
  spawnEgg,
  stepEgg,
  syncStatics,
} from "./world.js";

export {
  checkCloneSafety,
  checkDeterminism,
  cloneWorld,
  hashWorld,
  hydrateWorld,
  restoreWorld,
  runSteps,
  snapshotWorld,
  worldDigest,
} from "./determinism.js";

export {
  computePortalExit,
  createPortalExit,
  isPortalBody,
  isPortalEntry,
  portalCooldownOf,
  portalDestination,
} from "./portals.js";

export { predictAim, predictTrajectory, predictTrajectoryDetailed } from "./trajectory.js";

export {
  bodyCenter,
  distanceToBody,
  eggEnemyOverlaps,
  enemiesOverlapping,
  enemyBodies,
  explode,
  nearestEgg,
  overlapCircleBody,
  queryAABB,
  queryCircle,
  resolveBlasts,
  splitEgg,
} from "./queries.js";

export {
  computeAABB,
  fieldContains,
  isEnemyBody,
  makeBombBrick,
  makeBrick,
  makeBrickField,
  makeBumper,
  makeEnemy,
  makeFan,
  makeGravityField,
  makeIce,
  makePeg,
  makePegGrid,
  makePortalPair,
  makeRamp,
  makeSegment,
  makeSlowField,
  makeWall,
  makeWind,
  moveBody,
  normalizeBody,
  resetBodyIds,
} from "./shapes.js";

export {
  compareTrajectories,
  createSimBridge,
  normalizePoints,
  toSimPrediction,
} from "./compat.js";

export {
  circleVsAABB,
  circleVsCircle,
  circleVsSegment,
  collideCircleBody,
  createManifold,
  resolveEggPair,
  resolveStaticContact,
} from "./collide.js";

export {
  CONTACT_COOLDOWN,
  EGG_RADIUS,
  EGG_RESTITUTION,
  MATERIAL,
  MAX_FRAME_STEPS,
  MAX_FRAME_TIME,
  MAX_SPEED,
  MIN_CONTACT_IMPACT,
  PORTAL_COOLDOWN,
  PORTAL_EXIT_CLEARANCE,
  PREDICT_MAX_BOUNCES,
  SLEEP_SPEED,
  SLEEP_TIME,
  SPLIT_SPEED_SCALE,
} from "./constants.js";

export {
  TAU,
  clamp,
  closestPointOnSegment,
  distance,
  lerp,
  mulberry32,
  normalizeAngle,
  reflect,
} from "./math.js";
