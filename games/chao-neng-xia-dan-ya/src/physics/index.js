/**
 * 物理层公共入口（Opus-1 所有权）。
 *
 * 稳定契约（其他模块只依赖这些）：
 *   createWorld / stepWorld / predictTrajectory / WORLD_W / WORLD_H / GRAVITY / FIXED_DT
 * 其余导出供关卡数据、战斗结算与 UI 使用，全部 headless、无 DOM 依赖。
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
  launchEgg,
  markStaticsDirty,
  nextRandom,
  normalizeEgg,
  removeField,
  removeStatic,
  recycleEgg,
  renderPosition,
  resetEggIds,
  resetWorld,
  spawnEgg,
  stepEgg,
  syncStatics,
} from "./world.js";

export { predictAim, predictTrajectory, predictTrajectoryDetailed } from "./trajectory.js";

export {
  bodyCenter,
  distanceToBody,
  explode,
  nearestEgg,
  queryAABB,
  queryCircle,
  resolveBlasts,
  splitEgg,
} from "./queries.js";

export {
  computeAABB,
  fieldContains,
  makeBombBrick,
  makeBrick,
  makeBrickField,
  makeBumper,
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
  normalizeBody,
  resetBodyIds,
} from "./shapes.js";

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
  EGG_RADIUS,
  EGG_RESTITUTION,
  MATERIAL,
  MAX_SPEED,
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
