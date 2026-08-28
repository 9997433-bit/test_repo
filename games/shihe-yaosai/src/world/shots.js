// Opus-2 世界 · 弹道拖影。
// view.shots 里有什么就画什么；上游不给 shots 就整条通道保持关闭，零开销。

import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder.js";
import "@babylonjs/core/Meshes/thinInstanceMesh.js";

import { NAMES, PALETTE } from "./constants.js";
import { createAdditive } from "./materials.js";
import { place, weld } from "./geometry.js";

const INITIAL_CAPACITY = 64;

export function buildShots(scene, parent) {
  const root = new TransformNode("shots-root", scene);
  root.parent = parent;

  const mat = createAdditive(scene, "mat-shot", PALETTE.shot, { alpha: 1 });
  // 基础体是一根沿 +Z、起点在原点的细棒，缩放 z 即可拉成任意长度。
  const bar = place(CreateBox("shot-bar", { width: 0.16, height: 0.16, depth: 1 }, scene), { pos: [0, 0, 0.5] });
  const mesh = weld([bar], NAMES.shots, mat, { flat: false });
  mesh.parent = root;
  mesh.isPickable = false;
  mesh.applyFog = false;
  mesh.doNotSyncBoundingInfo = true;
  mesh.alwaysSelectAsActiveMesh = true;
  mesh.setEnabled(false);

  const data = new Float32Array(INITIAL_CAPACITY * 16);
  mesh.thinInstanceSetBuffer("matrix", data, 16, false);
  mesh.thinInstanceCount = 0;

  return {
    root,
    mesh,
    data,
    capacity: INITIAL_CAPACITY,
    _scale: new Vector3(1, 1, 1),
    _rot: new Quaternion(),
    _pos: new Vector3(),
    _mat: new Matrix(),
  };
}

export function syncShots(shots, view) {
  const list = view.shots;
  if (list.length === 0) {
    shots.mesh.thinInstanceCount = 0;
    shots.mesh.setEnabled(false);
    return;
  }

  if (list.length > shots.capacity) {
    let capacity = shots.capacity;
    while (capacity < list.length) capacity *= 2;
    shots.data = new Float32Array(capacity * 16);
    shots.capacity = capacity;
    shots.mesh.thinInstanceSetBuffer("matrix", shots.data, 16, false);
  }

  let written = 0;
  for (const shot of list) {
    const dx = shot.to.x - shot.from.x;
    const dy = shot.to.y - shot.from.y;
    const dz = shot.to.z - shot.from.z;
    const length = Math.hypot(dx, dy, dz);
    if (length < 1e-4) continue;

    const yaw = Math.atan2(dx, dz);
    const pitch = -Math.asin(Math.max(-1, Math.min(1, dy / length)));
    Quaternion.RotationYawPitchRollToRef(yaw, pitch, 0, shots._rot);

    const width = 0.6 + shot.intensity * 1.1;
    shots._scale.set(width, width, length);
    shots._pos.set(shot.from.x, shot.from.y, shot.from.z);

    Matrix.ComposeToRef(shots._scale, shots._rot, shots._pos, shots._mat);
    shots._mat.copyToArray(shots.data, written * 16);
    written += 1;
  }

  if (written === 0) {
    shots.mesh.thinInstanceCount = 0;
    shots.mesh.setEnabled(false);
    return;
  }

  shots.mesh.thinInstanceCount = written;
  shots.mesh.thinInstanceBufferUpdated("matrix");
  shots.mesh.setEnabled(true);
}
