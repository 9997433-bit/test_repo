// Opus-2 世界 · 灯光、雾与程序化星空背景。

import { Scene } from "@babylonjs/core/scene.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color.js";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight.js";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight.js";
import { CreateIcoSphere } from "@babylonjs/core/Meshes/Builders/icoSphereBuilder.js";

import { NAMES, PALETTE, SKY_RADIUS } from "./constants.js";
import { color3, createUnlitVertexColor } from "./materials.js";
import { decor, makeRandom, paintVertices } from "./geometry.js";

export function buildLighting(scene) {
  scene.clearColor = new Color4(...PALETTE.background, 1);
  scene.ambientColor = new Color3(0.04, 0.05, 0.08);

  const hemi = new HemisphericLight(NAMES.hemi, new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.42;
  hemi.diffuse = new Color3(0.42, 0.55, 0.78);
  hemi.groundColor = new Color3(0.05, 0.04, 0.07);
  hemi.specular = new Color3(0.1, 0.12, 0.18);

  const sun = new DirectionalLight(NAMES.sun, new Vector3(0.52, -0.72, 0.44), scene);
  sun.position = new Vector3(-90, 120, -76);
  sun.intensity = 1.6;
  sun.diffuse = new Color3(0.82, 0.87, 1.0);
  sun.specular = new Color3(1.0, 0.95, 0.86);

  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogColor = color3(PALETTE.fog);
  scene.fogDensity = 0.0062;

  return { hemi, sun };
}

/** 星尘天穹：一颗朝内渲染的巨大二十面体，顶点色现算出渐变与暗星云。 */
function buildDome(scene, parent) {
  const dome = CreateIcoSphere(
    NAMES.skyDome,
    { radius: SKY_RADIUS, subdivisions: 8, flat: false, sideOrientation: Mesh.BACKSIDE },
    scene
  );
  paintVertices(dome, (x, y, z) => {
    const inv = 1 / SKY_RADIUS;
    const ny = y * inv;
    const nx = x * inv;
    const nz = z * inv;
    const up = Math.max(0, Math.min(1, ny * 0.5 + 0.5));

    const base = 0.008 + up * up * 0.05;
    // 三层低频噪声当作星云，靠地平线一侧留一点点暖色。
    const cloud =
      0.5 +
      0.5 *
        Math.sin(nx * 4.1 + nz * 2.7 + ny * 3.3) *
        Math.cos(nz * 3.4 - nx * 2.2) *
        Math.sin(ny * 5.2 + 1.1);
    const veil = Math.pow(cloud, 3) * 0.055;
    const warm = Math.pow(Math.max(0, 1 - Math.abs(ny + 0.12) * 2.6), 3) * 0.028;

    return [base * 0.55 + veil * 0.75 + warm, base * 0.8 + veil * 0.55 + warm * 0.55, base * 1.5 + veil * 1.15 + warm * 0.3, 1];
  });
  dome.material = createUnlitVertexColor(scene, "mat-sky-dome", { backFaceCulling: false });
  dome.parent = parent;
  dome.applyFog = false;
  dome.infiniteDistance = false;
  decor(dome);
  return dome;
}

/** 星点：一组固定种子的点云，保证每次开局星空一致。 */
function buildStars(scene, parent, count = 1400) {
  const random = makeRandom(0x5eed);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 4);
  const indices = new Uint32Array(count);

  for (let i = 0; i < count; i += 1) {
    // 均匀分布在球面上，再往外推一点点，避免和天穹共面。
    const u = random() * 2 - 1;
    const phi = random() * Math.PI * 2;
    const s = Math.sqrt(Math.max(0, 1 - u * u));
    const r = SKY_RADIUS * 0.93;
    positions[i * 3] = Math.cos(phi) * s * r;
    positions[i * 3 + 1] = u * r;
    positions[i * 3 + 2] = Math.sin(phi) * s * r;

    const bright = Math.pow(random(), 3.2);
    const tint = random();
    colors[i * 4] = 0.35 + bright * (0.65 + tint * 0.35);
    colors[i * 4 + 1] = 0.42 + bright * 0.58;
    colors[i * 4 + 2] = 0.6 + bright * 0.4;
    colors[i * 4 + 3] = 0.25 + bright * 0.75;
    indices[i] = i;
  }

  const mesh = new Mesh(NAMES.skyStars, scene);
  const data = new VertexData();
  data.positions = positions;
  data.colors = colors;
  data.indices = indices;
  data.applyToMesh(mesh, false);

  mesh.material = createUnlitVertexColor(scene, "mat-sky-stars", { pointsCloud: true, pointSize: 2 });
  mesh.parent = parent;
  mesh.applyFog = false;
  decor(mesh);
  mesh.alwaysSelectAsActiveMesh = true;
  return mesh;
}

export function buildSky(scene, parent) {
  const dome = buildDome(scene, parent);
  const stars = buildStars(scene, parent);
  return { dome, stars };
}
