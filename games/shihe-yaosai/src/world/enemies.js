// Opus-2 世界 · 来袭体。
// 3 种体型 × 3 条轨道 = 9 个 thin-instance 池，一波几百个也只有 9 次 draw call。

import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { CreatePolyhedron } from "@babylonjs/core/Meshes/Builders/polyhedronBuilder.js";
import { CreateIcoSphere } from "@babylonjs/core/Meshes/Builders/icoSphereBuilder.js";
import { CreateTorus } from "@babylonjs/core/Meshes/Builders/torusBuilder.js";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder.js";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder.js";
import "@babylonjs/core/Meshes/thinInstanceMesh.js";

import { ENEMY_SHAPES, LANE_Y, NAMES, PALETTE } from "./constants.js";
import { createMetal } from "./materials.js";
import { place, weld } from "./geometry.js";
import { polarToWorld } from "./polar.js";

const INITIAL_CAPACITY = 64;

const SHAPE_BUILDERS = {
  drone(scene) {
    return [
      CreatePolyhedron("e-core", { type: 1, size: 0.62 }, scene),
      place(CreateBox("e-fin-l", { width: 1.5, height: 0.08, depth: 0.4 }, scene), { pos: [0, 0, 0] }),
      place(CreateBox("e-fin-r", { width: 0.4, height: 0.08, depth: 1.5 }, scene), { pos: [0, 0, 0] }),
    ];
  },
  hulk(scene) {
    return [
      CreateIcoSphere("e-core", { radius: 0.95, subdivisions: 1, flat: true }, scene),
      place(CreateTorus("e-belt", { diameter: 2.0, thickness: 0.2, tessellation: 8 }, scene), { pos: [0, 0, 0] }),
      place(CreateBox("e-horn", { width: 0.28, height: 1.5, depth: 0.28 }, scene), { pos: [0, 0.7, 0] }),
    ];
  },
  wisp(scene) {
    return [
      place(CreatePolyhedron("e-core", { type: 0, size: 0.6 }, scene), { pos: [0, 0.1, 0] }),
      place(CreateCylinder("e-tail", { diameterTop: 0, diameterBottom: 0.5, height: 1.6, tessellation: 4 }, scene), {
        pos: [0, -0.75, 0],
        rot: [Math.PI, 0, 0],
      }),
    ];
  },
};

const SHAPE_SCALE = { drone: 1, hulk: 1.15, wisp: 0.95 };

function poolKey(shape, lane) {
  return `${shape}:${lane}`;
}

export function buildEnemies(scene, parent) {
  const root = new TransformNode("enemies-root", scene);
  root.parent = parent;

  const pools = new Map();
  for (const shape of ENEMY_SHAPES) {
    for (let lane = 0; lane < LANE_Y.length; lane += 1) {
      const rim = PALETTE.enemyRim[lane];
      const mat = createMetal(scene, `mat-enemy-${shape}-${lane}`, PALETTE.enemyBody, {
        metallic: 0.5,
        roughness: 0.45,
        emissive: [rim[0] * 0.35, rim[1] * 0.35, rim[2] * 0.35],
        emissiveIntensity: 1.1,
      });

      const mesh = weld(SHAPE_BUILDERS[shape](scene), NAMES.enemy(shape, lane), mat);
      mesh.parent = root;
      mesh.isPickable = false;
      mesh.doNotSyncBoundingInfo = true;
      mesh.alwaysSelectAsActiveMesh = true;
      mesh.setEnabled(false);

      const data = new Float32Array(INITIAL_CAPACITY * 16);
      mesh.thinInstanceSetBuffer("matrix", data, 16, false);
      mesh.thinInstanceCount = 0;

      pools.set(poolKey(shape, lane), { mesh, data, capacity: INITIAL_CAPACITY, count: 0 });
    }
  }

  return {
    root,
    pools,
    _scale: new Vector3(1, 1, 1),
    _rot: new Quaternion(),
    _pos: new Vector3(),
    _mat: new Matrix(),
  };
}

function ensureCapacity(pool, needed) {
  if (needed <= pool.capacity) return;
  let capacity = pool.capacity;
  while (capacity < needed) capacity *= 2;
  pool.data = new Float32Array(capacity * 16);
  pool.capacity = capacity;
  pool.mesh.thinInstanceSetBuffer("matrix", pool.data, 16, false);
}

/**
 * 按 view.enemies 重排所有 thin instance。
 * 位置严格走极坐标：x = cosθ·r，z = sinθ·r，y = 轨道高度。
 */
export function syncEnemies(enemies, view, clock) {
  for (const pool of enemies.pools.values()) pool.count = 0;

  // 先数一遍，一次性把容量补够，避免边写边扩。
  const demand = new Map();
  for (const enemy of view.enemies) {
    const key = poolKey(enemy.shape, enemy.lane);
    demand.set(key, (demand.get(key) ?? 0) + 1);
  }
  for (const [key, needed] of demand) {
    const pool = enemies.pools.get(key);
    if (pool) ensureCapacity(pool, needed);
  }

  const scale = enemies._scale;
  const rot = enemies._rot;
  const pos = enemies._pos;
  const mat = enemies._mat;

  for (const enemy of view.enemies) {
    const pool = enemies.pools.get(poolKey(enemy.shape, enemy.lane));
    if (!pool) continue;

    const phase = enemy.seed * 0.618;
    const bob = Math.sin(clock * 1.8 + phase * 6.283) * 0.28;
    const world = polarToWorld(enemy.radius, enemy.theta, enemy.y + bob);
    pos.set(world.x, world.y, world.z);

    const s = SHAPE_SCALE[enemy.shape] * enemy.scale * (0.82 + 0.18 * enemy.hpRatio);
    scale.set(s, s, s);

    Quaternion.RotationYawPitchRollToRef(
      clock * (0.9 + (enemy.seed % 7) * 0.13) + phase,
      Math.sin(clock * 0.8 + phase) * 0.3,
      // 让来袭体的「上方向」始终背离星核，读起来像贴着轨道跑。
      Math.cos(clock * 0.6 + phase) * 0.22,
      rot
    );

    Matrix.ComposeToRef(scale, rot, pos, mat);
    mat.copyToArray(pool.data, pool.count * 16);
    pool.count += 1;
  }

  for (const pool of enemies.pools.values()) {
    if (pool.count > 0) {
      pool.mesh.thinInstanceCount = pool.count;
      pool.mesh.thinInstanceBufferUpdated("matrix");
      pool.mesh.setEnabled(true);
    } else {
      pool.mesh.thinInstanceCount = 0;
      pool.mesh.setEnabled(false);
    }
  }
}
