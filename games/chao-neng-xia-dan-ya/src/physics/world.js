/** 物理世界脚手架。Opus-1 负责完整实现。 */
export const WORLD_W = 480;
export const WORLD_H = 800;
export const GRAVITY = 1680;
export const FIXED_DT = 1 / 120;

export function createWorld() {
  return {
    eggs: [],
    statics: [],
    fields: [],
    time: 0,
  };
}

export function stepWorld(world, dt = FIXED_DT) {
  world.time += dt;
  return world;
}

export function predictTrajectory() {
  return [];
}
