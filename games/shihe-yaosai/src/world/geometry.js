// Opus-2 世界 · 低多边形拼装小工具。

import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { CreateLathe } from "@babylonjs/core/Meshes/Builders/latheBuilder.js";

/**
 * 环状体。Babylon 的 CreateTorus 用同一个 tessellation 同时控制环向与管壁，
 * 一个半径 52 的光滑圆环要几万顶点。这里改用 lathe 分别控制：
 * segments 管环向精度，sides 管管壁精度，顺带能直接旋出六边形轮廓。
 */
export function createRing(scene, name, radius, thickness, segments = 96, sides = 6) {
  const shape = [];
  for (let i = 0; i <= sides; i += 1) {
    const a = (i / sides) * Math.PI * 2;
    shape.push(new Vector3(radius + Math.cos(a) * thickness, Math.sin(a) * thickness, 0));
  }
  return CreateLathe(name, { shape, tessellation: segments, closed: true, sideOrientation: Mesh.DOUBLESIDE }, scene);
}

/** 摆放一个零件：局部位移 / 欧拉旋转 / 缩放。 */
export function place(mesh, { pos, rot, scale } = {}) {
  if (pos) mesh.position.set(pos[0] ?? 0, pos[1] ?? 0, pos[2] ?? 0);
  if (rot) mesh.rotation.set(rot[0] ?? 0, rot[1] ?? 0, rot[2] ?? 0);
  if (scale) {
    if (typeof scale === "number") mesh.scaling.set(scale, scale, scale);
    else mesh.scaling.set(scale[0] ?? 1, scale[1] ?? 1, scale[2] ?? 1);
  }
  return mesh;
}

/**
 * 把一组零件烘成单一网格，顺带转成平面着色，得到干净的低面数硬边。
 * 传入的零件必须是未挂父节点的临时网格（局部坐标即世界坐标）。
 */
export function weld(parts, name, material, { flat = true } = {}) {
  const alive = parts.filter(Boolean);
  if (alive.length === 0) return null;

  let mesh;
  if (alive.length === 1) {
    mesh = alive[0];
    mesh.name = name;
    mesh.bakeCurrentTransformIntoVertices();
  } else {
    mesh = Mesh.MergeMeshes(alive, true, true, undefined, false, false);
    if (!mesh) return null;
    mesh.name = name;
  }

  if (flat) mesh.convertToFlatShadedMesh();
  if (material) mesh.material = material;
  mesh.position.copyFrom(Vector3.Zero());
  mesh.rotation.set(0, 0, 0);
  mesh.scaling.set(1, 1, 1);
  return mesh;
}

/** 依据位置给网格写顶点色（天穹渐变用）。 */
export function paintVertices(mesh, shade) {
  const positions = mesh.getVerticesData("position");
  if (!positions) return mesh;
  const colors = new Float32Array((positions.length / 3) * 4);
  for (let i = 0, c = 0; i < positions.length; i += 3, c += 4) {
    const rgba = shade(positions[i], positions[i + 1], positions[i + 2]);
    colors[c] = rgba[0];
    colors[c + 1] = rgba[1];
    colors[c + 2] = rgba[2];
    colors[c + 3] = rgba[3] ?? 1;
  }
  mesh.setVerticesData("color", colors, false, 4);
  return mesh;
}

/** 可复现的伪随机序列，保证每次开局星空一致。 */
export function makeRandom(seed = 1337) {
  let s = seed >>> 0;
  return function random() {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

/** 关掉拾取与阴影投射，纯装饰件统一走这条。 */
export function decor(mesh) {
  if (!mesh) return mesh;
  mesh.isPickable = false;
  mesh.doNotSyncBoundingInfo = true;
  return mesh;
}
