// Opus-2 世界
//
// 蚀核要塞的场景层：全部几何、材质、灯光都在运行时程序化生成，
// 没有任何下载模型 / 贴图 / CDN 资源，也不引用仓库内其它游戏。
//
// 对外只有六个入口：
//   buildWorld(scene, getView?)  搭场景，可选地每帧自取 view
//   syncWorld(scene, view)       把一帧 view 画出来
//   pickSocket(scene, pickInfo)  命中测试 -> 插座下标
//   socketWorldPos(i)            插座世界坐标
//   socketMuzzle(i)              插座炮口位置（combat 画曳光的起点口径）
//   polarToWorld(radius, θ, y)   极坐标换算
//
// 世界层不计算任何玩法数值，只消费 getView() 给出的 JSON。
// 弹道不归世界层：view.shots 一律由 src/combat 绘制，这里连读都不读，避免同一发子弹被画两遍。
// 辉光层也不归世界层：GlowLayer 由 src/engine 按质量档建立与销毁，这里只借用它排除天空。

import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
// scene.pick 依赖 Ray 的副作用注册，pickSocket 走无参分支时必须先装上。
import "@babylonjs/core/Culling/ray.js";

import {
  CORE_RADIUS,
  DECK_OUTER_RADIUS,
  LANE_RING_RADIUS,
  LANE_Y,
  NAMES,
  SOCKET_COUNT,
  SOCKET_RADIUS,
  TAU,
  TURRET_KINDS,
} from "./constants.js";
import { polarToWorld, socketTheta, socketWorldPos, socketYaw, nearestSocket, worldToPolar, laneHeight } from "./polar.js";
import { normalizeView, resolveTurretKind } from "./view.js";
import { createProceduralEnvironment } from "./materials.js";
import { buildLighting, buildSky } from "./sky.js";
import { buildDeck, buildLaneRings, syncLaneRings } from "./deck.js";
import { buildCore, syncCore } from "./core.js";
import { buildSockets, disposeSockets, socketMuzzle, syncSockets } from "./sockets.js";
import { buildEnemies, syncEnemies } from "./enemies.js";

const WORLDS = new WeakMap();

const DEFAULTS = {
  // glow 只决定「要不要认领引擎的辉光层做天空排除」，世界层自己不建层。
  glow: true,
  sky: true,
  environment: true,
  lights: true,
  camera: true,
  autoSync: true,
};

/** 场景还没喂过 view 时先用它渲染一帧，避免开局黑屏。 */
const IDLE_VIEW = { coreHp: 1, coreMax: 1, sockets: [], enemies: [] };

function readOptions(getView, options) {
  const fn = typeof getView === "function" ? getView : null;
  const raw = typeof getView === "object" && getView !== null ? getView : options;
  return { getView: fn, options: { ...DEFAULTS, ...(raw ?? {}) } };
}

function ensureCamera(scene, opts) {
  if (!opts.camera || scene.activeCamera) return null;
  const camera = new ArcRotateCamera(NAMES.camera, -Math.PI / 2.2, 1.02, 128, Vector3.Zero(), scene);
  camera.lowerRadiusLimit = 34;
  camera.upperRadiusLimit = 260;
  camera.lowerBetaLimit = 0.12;
  camera.upperBetaLimit = Math.PI / 2 - 0.04;
  camera.wheelDeltaPercentage = 0.02;
  camera.panningSensibility = 0;
  camera.minZ = 0.6;
  camera.maxZ = 1400;
  scene.activeCamera = camera;
  const canvas = scene.getEngine().getRenderingCanvas?.();
  if (canvas) camera.attachControl(canvas, true);
  return camera;
}

const GLOW_EFFECT_NAME = "GlowLayer";

function isGlowLayer(layer) {
  if (!layer || typeof layer.addExcludedMesh !== "function" || typeof layer.removeExcludedMesh !== "function") {
    return false;
  }
  const effect = layer.getEffectName?.();
  return effect === undefined || effect === GLOW_EFFECT_NAME;
}

/** 找出引擎挂在这个场景上的辉光层；没有引擎（预览页、NullEngine 测试）就返回 null。 */
function findSceneGlow(scene) {
  // scene.effectLayers 在销毁时会被 removeEffectLayer 摘掉，用它校验句柄是否还活着。
  const layers = Array.isArray(scene.effectLayers) ? scene.effectLayers : null;
  const engineGlow = scene.metadata?.shihe?.glow ?? scene.metadata?.shEngine?.glow ?? null;
  if (isGlowLayer(engineGlow) && (!layers || layers.includes(engineGlow))) return engineGlow;
  if (layers) {
    for (const layer of layers) {
      if (isGlowLayer(layer)) return layer;
    }
  }
  return null;
}

/** 松开对辉光层的引用：只撤回自己加的排除项，绝不销毁别人的层。 */
function releaseGlow(world) {
  const layer = world.glow;
  if (layer) {
    for (const mesh of world.glowExcluded) {
      try {
        layer.removeExcludedMesh(mesh);
      } catch {
        // 层可能已经被引擎换档销毁，排除项跟着它一起没了，无需处理。
      }
    }
  }
  world.glow = null;
  world.glowExcluded = [];
}

/**
 * 借用引擎的辉光层，把天穹与星点排除在外——否则整片背景会被辉光糊成灰白。
 * 引擎换质量档会重建 GlowLayer，所以每帧比对一次句柄，换了就重新排除。
 */
function adoptGlow(world) {
  const layer = world.options.glow ? findSceneGlow(world.scene) : null;
  if (layer === world.glow) return layer;

  releaseGlow(world);
  if (!layer) return null;

  for (const mesh of [world.sky?.dome, world.sky?.stars]) {
    if (!mesh) continue;
    try {
      layer.addExcludedMesh(mesh);
      world.glowExcluded.push(mesh);
    } catch {
      // 正在被销毁的层会抛，下一帧重新认领即可。
    }
  }
  world.glow = layer;
  return layer;
}

/**
 * 搭建整座要塞。重复调用会先销毁旧世界，方便热重载。
 * @param {import("@babylonjs/core/scene.js").Scene} scene
 * @param {(() => object)|object} [getView] 每帧取 view 的函数；也可以直接传 options
 * @param {object} [options]
 * @returns {object} 世界句柄
 */
export function buildWorld(scene, getView, options) {
  if (!scene) throw new Error("buildWorld(scene): scene is required");
  if (WORLDS.has(scene)) disposeWorld(scene);

  const { getView: viewFn, options: opts } = readOptions(getView, options);

  const root = new TransformNode(NAMES.root, scene);

  const world = {
    scene,
    root,
    options: opts,
    getView: viewFn,
    clock: 0,
    frame: 0,
    lastView: null,
    env: null,
    glow: null,
    glowExcluded: [],
  };

  if (opts.environment) {
    try {
      world.env = createProceduralEnvironment(scene);
      scene.environmentTexture = world.env;
      scene.environmentIntensity = 0.5;
    } catch {
      world.env = null;
    }
  }

  world.lights = opts.lights ? buildLighting(scene) : null;
  world.sky = opts.sky ? buildSky(scene, root) : null;
  world.deck = buildDeck(scene, root);
  world.laneRings = buildLaneRings(scene, root);
  world.core = buildCore(scene, root);
  world.sockets = buildSockets(scene, root);
  world.enemies = buildEnemies(scene, root);
  world.camera = ensureCamera(scene, opts);
  adoptGlow(world);

  WORLDS.set(scene, world);
  if (!scene.metadata || typeof scene.metadata !== "object") scene.metadata = {};
  scene.metadata.world = world;

  // 先按空场景渲染一次，保证 syncWorld 还没被调用时画面也是完整的。
  syncWorld(scene, IDLE_VIEW);

  world.observer = scene.onBeforeRenderObservable.add(() => {
    const deltaMs = scene.getEngine()?.getDeltaTime?.();
    const dt = Number.isFinite(deltaMs) && deltaMs > 0 ? Math.min(deltaMs / 1000, 0.1) : 1 / 60;
    world.clock += dt;
    world.frame += 1;
    adoptGlow(world);
    if (world.options.autoSync && world.getView) {
      syncWorld(scene, world.getView());
    }
  });

  return world;
}

/**
 * 用一帧 view 刷新世界。view 的字段缺失、别名、越界都会被容错处理。
 * view.shots 被刻意忽略：曳光 / 光束 / 力场归 src/combat 的 syncCombat。
 * @param {import("@babylonjs/core/scene.js").Scene} scene
 * @param {object} view getView() 的返回值
 * @returns {object|null} 归一化后的 view，场景未搭建时返回 null
 */
export function syncWorld(scene, view) {
  const world = getWorld(scene);
  if (!world) return null;

  const normalized = normalizeView(view);
  world.lastView = normalized;

  syncCore(world.core, normalized.coreRatio, world.clock);
  syncSockets(scene, world.sockets, normalized, world.clock);
  syncLaneRings(world.laneRings, world.clock, normalized);
  syncEnemies(world.enemies, normalized, world.clock);

  return normalized;
}

function socketFromMesh(mesh) {
  let node = mesh;
  let hops = 0;
  while (node && hops < 8) {
    const meta = node.metadata;
    if (meta && typeof meta === "object" && Number.isInteger(meta.socket)) return meta.socket;
    const match = /^socket-(\d+)(?:$|-)/.exec(node.name ?? "");
    if (match) {
      const index = Number(match[1]);
      if (Number.isInteger(index) && index >= 0 && index < SOCKET_COUNT) return index;
    }
    node = node.parent;
    hops += 1;
  }
  return null;
}

const SOCKET_PREDICATE = (mesh) => mesh.isPickable && socketFromMesh(mesh) !== null;

/**
 * 从一次拾取里读出插座下标。
 * pickInfo 可以是 PickingInfo、PointerInfo、{x,y} 屏幕坐标，或者省略（用当前指针位置）。
 * @returns {number|null}
 */
export function pickSocket(scene, pickInfo) {
  if (!scene) return null;

  let info = pickInfo;
  if (info && typeof info === "object" && info.pickInfo) info = info.pickInfo;

  if (!info) {
    info = scene.pick(scene.pointerX, scene.pointerY, SOCKET_PREDICATE);
  } else if (typeof info === "object" && !("pickedMesh" in info) && ("x" in info || "y" in info)) {
    info = scene.pick(Number(info.x) || 0, Number(info.y) || 0, SOCKET_PREDICATE);
  }

  if (!info || !info.hit || !info.pickedMesh) return null;
  return socketFromMesh(info.pickedMesh);
}

/** 取回某个场景的世界句柄。 */
export function getWorld(scene) {
  if (!scene) return null;
  return WORLDS.get(scene) ?? scene.metadata?.world ?? null;
}

/** 拆掉世界，释放所有网格与材质。 */
export function disposeWorld(scene) {
  const world = getWorld(scene);
  if (!world) return false;

  if (world.observer) scene.onBeforeRenderObservable.remove(world.observer);
  disposeSockets(world.sockets);
  // 辉光层是引擎的资产，世界只退还排除项。
  releaseGlow(world);
  world.root.dispose(false, true);
  if (world.lights) {
    world.lights.hemi.dispose();
    world.lights.sun.dispose();
    world.lights.fill.dispose();
  }
  if (world.env) {
    if (scene.environmentTexture === world.env) scene.environmentTexture = null;
    world.env.dispose();
  }

  WORLDS.delete(scene);
  if (scene.metadata?.world === world) scene.metadata.world = null;
  return true;
}

export {
  polarToWorld,
  socketWorldPos,
  // combat 画曳光时需要和世界层同一套炮口口径，别再各算各的。
  socketMuzzle,
  socketTheta,
  socketYaw,
  nearestSocket,
  worldToPolar,
  laneHeight,
  resolveTurretKind,
  normalizeView,
};

/** 世界层的尺寸口径，UI / 输入 / 调试都从这里读，避免各处硬编码。 */
export const WORLD_METRICS = {
  socketCount: SOCKET_COUNT,
  socketRadius: SOCKET_RADIUS,
  coreRadius: CORE_RADIUS,
  laneY: LANE_Y,
  laneRingRadius: LANE_RING_RADIUS,
  deckOuterRadius: DECK_OUTER_RADIUS,
  turretKinds: TURRET_KINDS,
  tau: TAU,
  names: NAMES,
};
