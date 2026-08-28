// Opus-2 世界 · 24 个铸塔插座。
// 插座网格本身就是可拾取体：socket-0 .. socket-23，metadata = { socket: i }。

import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder.js";
import { CreateTorus } from "@babylonjs/core/Meshes/Builders/torusBuilder.js";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder.js";

import { NAMES, PALETTE, SOCKET_COUNT, SOCKET_HEIGHT } from "./constants.js";
import { createEmissive, createMetal, setColor } from "./materials.js";
import { decor, place, weld } from "./geometry.js";
import { socketWorldPos, socketYaw } from "./polar.js";
import { buildTurret, createTurretBodyMaterials, syncTurret } from "./turrets.js";

const RIM_LOCAL_Y = SOCKET_HEIGHT * 0.5;

export function buildSockets(scene, parent) {
  const root = new TransformNode("sockets-root", scene);
  root.parent = parent;

  const pedestalMat = createMetal(scene, "mat-socket-pedestal", PALETTE.metalMid, {
    metallic: 0.88,
    roughness: 0.42,
  });
  const bodyMaterials = createTurretBodyMaterials(scene);

  const list = [];
  for (let i = 0; i < SOCKET_COUNT; i += 1) {
    const pos = socketWorldPos(i);

    const mesh = CreateCylinder(
      NAMES.socket(i),
      { diameterTop: 3.3, diameterBottom: 4.1, height: SOCKET_HEIGHT, tessellation: 6 },
      scene
    );
    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.rotation.y = socketYaw(i);
    mesh.material = pedestalMat;
    mesh.parent = root;
    mesh.isPickable = true;
    mesh.metadata = { socket: i };
    mesh.convertToFlatShadedMesh();

    const rimMat = createEmissive(scene, `mat-socket-rim-${i}`, PALETTE.socketIdle, 1.2, {
      albedo: [0.02, 0.04, 0.06],
      roughness: 0.4,
    });
    const rimParts = [
      place(CreateTorus(`rim-${i}`, { diameter: 3.45, thickness: 0.12, tessellation: 24 }, scene), {
        pos: [0, RIM_LOCAL_Y, 0],
      }),
      // 朝外的一小段指示条，插座朝向一眼可读。
      place(CreateBox(`rim-mark-${i}`, { width: 0.7, height: 0.1, depth: 0.5 }, scene), {
        pos: [0, RIM_LOCAL_Y + 0.02, 1.45],
      }),
    ];
    const rim = weld(rimParts, NAMES.socketRim(i), rimMat, { flat: false });
    if (rim) {
      rim.parent = mesh;
      decor(rim);
    }

    list.push({ index: i, mesh, rim, rimMat, turret: null, kind: null });
  }

  return { root, list, pedestalMat, bodyMaterials };
}

function disposeTurret(entry) {
  if (!entry.turret) return;
  entry.turret.glowMat.dispose();
  entry.turret.root.dispose(false, false);
  entry.turret = null;
  entry.kind = null;
}

/**
 * 按 view 增删炮塔并刷新插座光圈。
 * 只有 towerId 归一后的种类发生变化时才重建网格。
 */
export function syncSockets(scene, sockets, view, clock) {
  for (let i = 0; i < SOCKET_COUNT; i += 1) {
    const entry = sockets.list[i];
    const socketView = view.sockets[i];
    const wanted = socketView.kind;

    if (wanted !== entry.kind) {
      disposeTurret(entry);
      if (wanted) {
        const turret = buildTurret(scene, wanted, i, sockets.bodyMaterials);
        turret.root.parent = entry.mesh;
        turret.root.position.set(0, RIM_LOCAL_Y, 0);
        entry.turret = turret;
        entry.kind = wanted;
      }
    }

    if (entry.turret) {
      syncTurret(entry.turret, socketView, clock);
      // 塔阶越高，基座抬得越稳：用极小的缩放差表达等级。
      const lift = 1 + Math.min(3, socketView.tier - 1) * 0.06;
      entry.turret.root.scaling.setAll(lift);
    }

    const hovered = view.hoverSocket === i;
    const selected = view.selectedSocket === i;
    let rgb = entry.turret ? PALETTE.socketArmed : PALETTE.socketIdle;
    let intensity = entry.turret ? 0.55 : 0.85 + 0.35 * Math.sin(clock * 1.7 + i * 0.42);
    if (hovered) {
      rgb = PALETTE.socketHover;
      intensity = 2.4;
    }
    if (selected) {
      rgb = PALETTE.socketSelected;
      intensity = 2.9;
    }
    if (socketView.overheat) {
      rgb = PALETTE.overheat;
      intensity = 0.8;
    }
    setColor(entry.rimMat.emissiveColor, rgb);
    entry.rimMat.emissiveIntensity = intensity;
  }
}

/** 第 i 座塔的炮口大致位置，弹道拖影缺 from 字段时用它兜底。 */
export function socketMuzzle(i) {
  const pos = socketWorldPos(i);
  return { x: pos.x, y: pos.y + 2.4, z: pos.z };
}

export function disposeSockets(sockets) {
  for (const entry of sockets.list) disposeTurret(entry);
}
