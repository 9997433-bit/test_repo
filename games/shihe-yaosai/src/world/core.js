// Opus-2 世界 · 中央星核。
// 满血时是一颗暖白金的炉心，随着 coreHp 掉落逐渐「冷却」：颜色偏蓝、发光变弱、外壳变淡。

import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { CreateIcoSphere } from "@babylonjs/core/Meshes/Builders/icoSphereBuilder.js";
import { CreateTorus } from "@babylonjs/core/Meshes/Builders/torusBuilder.js";
import { PointLight } from "@babylonjs/core/Lights/pointLight.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";

import { CORE_RADIUS, NAMES, PALETTE } from "./constants.js";
import { createEmissive, createMetal, mixRgb, setColor } from "./materials.js";
import { decor, place, weld } from "./geometry.js";

const INNER_RADIUS = CORE_RADIUS * 0.78;
const CAGE_RADIUS = CORE_RADIUS * 1.22;

export function buildCore(scene, parent) {
  const root = new TransformNode(NAMES.core, scene);
  root.parent = parent;

  const innerMat = createEmissive(scene, "mat-core-inner", PALETTE.coreHot, 2.6, {
    albedo: [0.05, 0.03, 0.02],
    roughness: 0.75,
    metallic: 0,
  });
  const inner = CreateIcoSphere(NAMES.coreInner, { radius: INNER_RADIUS, subdivisions: 3, flat: true }, scene);
  inner.material = innerMat;
  inner.parent = root;
  decor(inner);

  const shellMat = createEmissive(scene, "mat-core-shell", PALETTE.coreShellHot, 1.5, {
    albedo: [0.02, 0.03, 0.05],
    roughness: 0.35,
    metallic: 0,
    alpha: 0.32,
    backFaceCulling: false,
  });
  const shell = CreateIcoSphere(NAMES.coreShell, { radius: CORE_RADIUS, subdivisions: 5, flat: false }, scene);
  shell.material = shellMat;
  shell.parent = root;
  decor(shell);

  const cageMat = createMetal(scene, "mat-core-cage", PALETTE.metalTrim, {
    metallic: 0.95,
    roughness: 0.28,
    emissive: PALETTE.seam,
    emissiveIntensity: 0.35,
  });
  const cageParts = [
    place(CreateTorus("cage-a", { diameter: CAGE_RADIUS * 2, thickness: 0.38, tessellation: 48 }, scene), {}),
    place(CreateTorus("cage-b", { diameter: CAGE_RADIUS * 2 * 0.94, thickness: 0.3, tessellation: 48 }, scene), {
      rot: [Math.PI / 2, 0, 0],
    }),
    place(CreateTorus("cage-c", { diameter: CAGE_RADIUS * 2 * 0.88, thickness: 0.26, tessellation: 48 }, scene), {
      rot: [0, 0, Math.PI / 2],
    }),
  ];
  const cage = weld(cageParts, NAMES.coreCage, cageMat, { flat: false });
  const cageNode = new TransformNode(`${NAMES.coreCage}-pivot`, scene);
  cageNode.parent = root;
  if (cage) {
    cage.parent = cageNode;
    decor(cage);
  }

  const light = new PointLight(NAMES.coreLight, Vector3.Zero(), scene);
  light.parent = root;
  light.diffuse = shellMat.emissiveColor.clone();
  light.specular = shellMat.emissiveColor.clone();
  light.intensity = 2600;
  light.range = 220;

  return {
    root,
    inner,
    shell,
    cage: cageNode,
    light,
    innerMat,
    shellMat,
    _hot: [...PALETTE.coreHot],
  };
}

/**
 * @param {object} core buildCore 的返回值
 * @param {number} ratio coreHp / coreMax，0..1
 * @param {number} clock 世界时钟（秒）
 */
export function syncCore(core, ratio, clock) {
  const t = ratio < 0 ? 0 : ratio > 1 ? 1 : ratio;

  // 越接近熄灭，脉动越急促、越微弱——像一颗喘不上气的炉心。
  const beatHz = 0.45 + (1 - t) * 1.35;
  const beat = Math.sin(clock * Math.PI * 2 * beatHz);
  const breath = 1 + beat * (0.012 + (1 - t) * 0.022);

  const innerRgb = mixRgb(PALETTE.coreCold, PALETTE.coreHot, t);
  const shellRgb = mixRgb(PALETTE.coreShellCold, PALETTE.coreShellHot, t);

  setColor(core.innerMat.emissiveColor, innerRgb);
  core.innerMat.emissiveIntensity = 0.45 + t * 2.35 + beat * 0.12 * t;

  setColor(core.shellMat.emissiveColor, shellRgb);
  core.shellMat.emissiveIntensity = 0.35 + t * 1.35;
  core.shellMat.alpha = 0.14 + t * 0.24;

  core.inner.scaling.setAll(breath);
  core.shell.scaling.setAll(1 + (breath - 1) * 0.45);

  core.cage.rotation.y = clock * 0.12;
  core.cage.rotation.x = Math.sin(clock * 0.07) * 0.22;

  setColor(core.light.diffuse, shellRgb);
  setColor(core.light.specular, shellRgb);
  core.light.intensity = 700 + t * 2600;
}
