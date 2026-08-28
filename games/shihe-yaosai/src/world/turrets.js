// Opus-2 世界 · 五种低多边形炮塔剪影。
// 每座塔烘成三块网格：静止底座 / 可转动的本体 / 可转动的发光件。
// 发光件的材质是每座塔独立的实例，过载与过热只改这一份，互不串色。

import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder.js";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder.js";
import { CreateTorus } from "@babylonjs/core/Meshes/Builders/torusBuilder.js";
import { CreateIcoSphere } from "@babylonjs/core/Meshes/Builders/icoSphereBuilder.js";
import { CreatePolyhedron } from "@babylonjs/core/Meshes/Builders/polyhedronBuilder.js";

import { HEAT, NAMES, PALETTE, TAU, TURRET_KINDS, TURRET_STYLE } from "./constants.js";
import { createEmissive, createMetal, mixRgb, setColor } from "./materials.js";
import { place, weld } from "./geometry.js";
import { socketTheta } from "./polar.js";

/** 圆锥/圆柱默认沿 +Y，这里给出「偏航 θ、离铅垂 a」的欧拉角。 */
function radialTilt(theta, tilt) {
  return [0, -theta, -tilt];
}

function buildRail(scene) {
  const mount = [
    place(CreateCylinder("t-base", { diameterTop: 2.0, diameterBottom: 2.5, height: 0.6, tessellation: 8 }, scene), {
      pos: [0, 0.3, 0],
    }),
  ];
  const body = [
    place(CreateCylinder("t-ring", { diameter: 1.8, height: 0.3, tessellation: 8 }, scene), { pos: [0, 0.75, 0] }),
    place(CreateBox("t-yoke", { width: 2.0, height: 1.0, depth: 1.4 }, scene), { pos: [0, 1.3, 0] }),
    place(CreateBox("t-breech", { width: 1.5, height: 1.2, depth: 1.7 }, scene), { pos: [0, 1.45, -0.9] }),
    place(CreateBox("t-rail-l", { width: 0.2, height: 0.26, depth: 5.4 }, scene), { pos: [-0.48, 1.45, 2.0] }),
    place(CreateBox("t-rail-r", { width: 0.2, height: 0.26, depth: 5.4 }, scene), { pos: [0.48, 1.45, 2.0] }),
    place(CreateBox("t-brace-0", { width: 1.35, height: 0.18, depth: 0.24 }, scene), { pos: [0, 1.45, 0.7] }),
    place(CreateBox("t-brace-1", { width: 1.35, height: 0.18, depth: 0.24 }, scene), { pos: [0, 1.45, 2.3] }),
    place(CreateBox("t-brace-2", { width: 1.35, height: 0.18, depth: 0.24 }, scene), { pos: [0, 1.45, 3.9] }),
    place(CreateBox("t-fin-l", { width: 0.14, height: 0.9, depth: 1.1 }, scene), { pos: [-0.9, 1.9, -0.8] }),
    place(CreateBox("t-fin-r", { width: 0.14, height: 0.9, depth: 1.1 }, scene), { pos: [0.9, 1.9, -0.8] }),
  ];
  const glow = [
    place(CreateBox("t-arc", { width: 0.6, height: 0.1, depth: 4.9 }, scene), { pos: [0, 1.45, 1.8] }),
    place(CreateTorus("t-muzzle", { diameter: 1.25, thickness: 0.13, tessellation: 12 }, scene), {
      pos: [0, 1.45, 4.5],
      rot: [Math.PI / 2, 0, 0],
    }),
    place(CreateBox("t-vent", { width: 1.0, height: 0.14, depth: 0.12 }, scene), { pos: [0, 2.02, -0.9] }),
  ];
  return { mount, body, glow };
}

function buildPrism(scene) {
  const mount = [
    place(CreateCylinder("t-base", { diameterTop: 1.7, diameterBottom: 2.3, height: 0.55, tessellation: 6 }, scene), {
      pos: [0, 0.28, 0],
    }),
  ];
  const body = [
    place(CreateCylinder("t-collar", { diameter: 1.35, height: 0.4, tessellation: 6 }, scene), { pos: [0, 0.72, 0] }),
    place(CreateTorus("t-frame", { diameter: 2.4, thickness: 0.17, tessellation: 6 }, scene), { pos: [0, 2.2, 0] }),
  ];
  for (let i = 0; i < 3; i += 1) {
    const theta = (i / 3) * TAU + 0.35;
    body.push(
      place(CreateBox(`t-strut-${i}`, { width: 0.22, height: 2.05, depth: 0.22 }, scene), {
        pos: [Math.cos(theta) * 0.72, 1.4, Math.sin(theta) * 0.72],
        rot: radialTilt(theta, -0.16),
      })
    );
  }
  const glow = [
    place(CreatePolyhedron("t-crystal", { type: 1, size: 0.62 }, scene), { pos: [0, 2.2, 0], scale: [1, 1.55, 1] }),
    place(CreateCylinder("t-spike", { diameterTop: 0, diameterBottom: 0.36, height: 1.0, tessellation: 6 }, scene), {
      pos: [0, 3.35, 0],
    }),
    place(CreateTorus("t-halo", { diameter: 1.8, thickness: 0.08, tessellation: 24 }, scene), { pos: [0, 0.62, 0] }),
  ];
  return { mount, body, glow };
}

function buildScatter(scene) {
  const mount = [
    place(CreateCylinder("t-base", { diameterTop: 2.3, diameterBottom: 2.7, height: 0.5, tessellation: 8 }, scene), {
      pos: [0, 0.25, 0],
    }),
  ];
  const body = [
    place(CreateCylinder("t-table", { diameter: 2.0, height: 0.4, tessellation: 8 }, scene), { pos: [0, 0.68, 0] }),
    place(CreateBox("t-head", { width: 1.7, height: 1.1, depth: 1.4 }, scene), { pos: [0, 1.2, 0.15] }),
    place(CreateCylinder("t-drum", { diameter: 1.6, height: 1.0, tessellation: 10 }, scene), {
      pos: [0, 1.2, -0.85],
      rot: [0, 0, Math.PI / 2],
    }),
  ];
  const glow = [
    place(CreateTorus("t-drum-band", { diameter: 1.65, thickness: 0.11, tessellation: 20 }, scene), {
      pos: [0, 1.2, -0.85],
      rot: [0, 0, Math.PI / 2],
    }),
  ];
  const offsets = [
    [-0.45, 0.9, -0.1],
    [0.45, 0.9, 0.1],
    [-0.45, 1.5, -0.1],
    [0.45, 1.5, 0.1],
  ];
  offsets.forEach(([x, y, yaw], i) => {
    body.push(
      place(CreateCylinder(`t-barrel-${i}`, { diameter: 0.38, height: 2.3, tessellation: 8 }, scene), {
        pos: [x, y, 1.5],
        rot: [Math.PI / 2, yaw, 0],
      })
    );
    body.push(
      place(CreateCylinder(`t-choke-${i}`, { diameterTop: 0.62, diameterBottom: 0.42, height: 0.4, tessellation: 8 }, scene), {
        pos: [x + yaw * 2.4, y, 2.6],
        rot: [Math.PI / 2, yaw, 0],
      })
    );
    glow.push(
      place(CreateCylinder(`t-flash-${i}`, { diameter: 0.42, height: 0.14, tessellation: 8 }, scene), {
        pos: [x + yaw * 2.6, y, 2.78],
        rot: [Math.PI / 2, yaw, 0],
      })
    );
  });
  return { mount, body, glow };
}

function buildWell(scene) {
  const mount = [
    place(CreateCylinder("t-base", { diameterTop: 2.1, diameterBottom: 2.7, height: 0.6, tessellation: 6 }, scene), {
      pos: [0, 0.3, 0],
    }),
  ];
  const body = [
    place(CreateCylinder("t-stalk", { diameterTop: 0.6, diameterBottom: 0.95, height: 1.4, tessellation: 8 }, scene), {
      pos: [0, 1.05, 0],
    }),
    place(CreateTorus("t-gyro-a", { diameter: 3.3, thickness: 0.24, tessellation: 32 }, scene), { pos: [0, 2.3, 0] }),
    place(CreateTorus("t-gyro-b", { diameter: 2.8, thickness: 0.2, tessellation: 32 }, scene), {
      pos: [0, 2.3, 0],
      rot: [Math.PI / 2, 0, 0],
    }),
    place(CreateTorus("t-gyro-c", { diameter: 2.4, thickness: 0.16, tessellation: 32 }, scene), {
      pos: [0, 2.3, 0],
      rot: [0, 0, Math.PI / 2],
    }),
  ];
  for (let i = 0; i < 3; i += 1) {
    const theta = (i / 3) * TAU;
    body.push(
      place(CreateBox(`t-claw-${i}`, { width: 0.3, height: 1.3, depth: 0.3 }, scene), {
        pos: [Math.cos(theta) * 0.9, 1.6, Math.sin(theta) * 0.9],
        rot: radialTilt(theta, 0.5),
      })
    );
  }
  const glow = [
    place(CreateIcoSphere("t-singularity", { radius: 0.52, subdivisions: 2, flat: true }, scene), { pos: [0, 2.3, 0] }),
    place(CreateTorus("t-accretion", { diameter: 1.7, thickness: 0.07, tessellation: 28 }, scene), { pos: [0, 2.3, 0] }),
    place(CreateTorus("t-foot", { diameter: 2.0, thickness: 0.09, tessellation: 24 }, scene), { pos: [0, 0.66, 0] }),
  ];
  return { mount, body, glow };
}

function buildStar(scene) {
  const mount = [
    place(CreateCylinder("t-base", { diameterTop: 2.0, diameterBottom: 2.6, height: 0.55, tessellation: 5 }, scene), {
      pos: [0, 0.28, 0],
    }),
  ];
  const body = [
    place(CreateCylinder("t-spire", { diameterTop: 0.16, diameterBottom: 1.05, height: 3.5, tessellation: 5 }, scene), {
      pos: [0, 2.05, 0],
    }),
  ];
  const glow = [
    place(CreateIcoSphere("t-tip", { radius: 0.3, subdivisions: 2, flat: true }, scene), { pos: [0, 3.95, 0] }),
    place(CreateTorus("t-collar", { diameter: 1.45, thickness: 0.1, tessellation: 20 }, scene), { pos: [0, 0.72, 0] }),
  ];
  for (let i = 0; i < 5; i += 1) {
    const theta = (i / 5) * TAU;
    const tilt = 0.95;
    body.push(
      place(CreateCylinder(`t-spike-${i}`, { diameterTop: 0, diameterBottom: 0.36, height: 1.7, tessellation: 4 }, scene), {
        pos: [Math.cos(theta) * 0.92, 1.75, Math.sin(theta) * 0.92],
        rot: radialTilt(theta, tilt),
      })
    );
    glow.push(
      place(CreateIcoSphere(`t-spike-tip-${i}`, { radius: 0.14, subdivisions: 1, flat: true }, scene), {
        pos: [Math.cos(theta) * (0.92 + Math.sin(tilt) * 0.85), 1.75 + Math.cos(tilt) * 0.85, Math.sin(theta) * (0.92 + Math.sin(tilt) * 0.85)],
      })
    );
  }
  return { mount, body, glow };
}

const BUILDERS = {
  rail: buildRail,
  prism: buildPrism,
  scatter: buildScatter,
  well: buildWell,
  star: buildStar,
};

/** 每种炮塔共用一份暗金属本体材质，按场景缓存。 */
export function createTurretBodyMaterials(scene) {
  const shared = {};
  for (const kind of TURRET_KINDS) {
    shared[kind] = createMetal(scene, `mat-turret-${kind}`, PALETTE.metalMid, {
      metallic: 0.9,
      roughness: 0.36,
    });
  }
  return shared;
}

/**
 * 造一座炮塔。返回的节点挂在插座网格下，因此已经继承了插座的朝外偏航。
 * @param {import("@babylonjs/core/scene.js").Scene} scene
 * @param {string} kind rail / prism / scatter / well / star
 * @param {number} socketIndex
 * @param {object} bodyMaterials createTurretBodyMaterials 的返回值
 */
export function buildTurret(scene, kind, socketIndex, bodyMaterials) {
  const safeKind = BUILDERS[kind] ? kind : TURRET_KINDS[0];
  const parts = BUILDERS[safeKind](scene);
  const style = TURRET_STYLE[safeKind];

  const root = new TransformNode(NAMES.turret(socketIndex), scene);
  const head = new TransformNode(`${NAMES.turret(socketIndex)}-head`, scene);
  head.parent = root;

  const bodyMat = bodyMaterials[safeKind];
  const glowMat = createEmissive(scene, `mat-turret-${safeKind}-${socketIndex}`, style.glow, style.intensity, {
    albedo: [0.03, 0.035, 0.045],
    roughness: 0.4,
    metallic: 0.15,
  });

  const mount = weld(parts.mount, `${NAMES.turret(socketIndex)}-mount`, bodyMat);
  const body = weld(parts.body, NAMES.turretBody(socketIndex), bodyMat);
  const glow = weld(parts.glow, NAMES.turretGlow(socketIndex), glowMat);

  const meta = { socket: socketIndex, part: "turret" };
  for (const mesh of [mount, body, glow]) {
    if (!mesh) continue;
    mesh.metadata = meta;
    mesh.isPickable = true;
    mesh.doNotSyncBoundingInfo = false;
  }
  if (mount) mount.parent = root;
  if (body) body.parent = head;
  if (glow) glow.parent = head;

  return { root, head, mount, body, glow, glowMat, kind: safeKind, style };
}

/**
 * 刷新一座炮塔的发光状态。
 * 常态：底色缓慢呼吸。过载：更热更白更亮更快。过热：压暗成橙色。
 */
export function syncTurret(turret, socketView, clock) {
  const style = turret.style;
  let rgb = style.glow;
  let intensity = style.intensity;

  if (socketView.overheat) {
    rgb = HEAT.overheatColor;
    intensity = style.intensity * HEAT.overheatIntensity;
    // 过热时留一点点心跳，读起来是「在散热」而不是「坏了」。
    intensity *= 0.85 + 0.15 * Math.sin(clock * Math.PI * 2 * 0.8);
  } else if (socketView.overclock) {
    rgb = mixRgb(style.glow, [1, 1, 1], HEAT.overclockWhiten);
    intensity = HEAT.overclockIntensity * (0.86 + 0.14 * Math.sin(clock * Math.PI * 2 * HEAT.overclockPulseHz));
  } else {
    intensity *= 1 + HEAT.idlePulseAmount * Math.sin(clock * Math.PI * 2 * HEAT.idlePulseHz + turret.root.uniqueId * 0.7);
  }

  setColor(turret.glowMat.emissiveColor, rgb);
  turret.glowMat.emissiveIntensity = intensity;

  if (socketView.aim !== null && socketView.aim !== undefined) {
    // aim 是世界极角，插座本身已经朝外了，这里只补一个相对偏航。
    turret.head.rotation.y = socketTheta(socketView.index) - socketView.aim;
  } else {
    turret.head.rotation.y = 0;
  }

  if (turret.kind === "well") {
    turret.head.rotation.y += Math.sin(clock * 0.6) * 0.05;
  }
}
