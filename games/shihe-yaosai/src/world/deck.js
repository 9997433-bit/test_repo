// Opus-2 世界 · 六边形甲板、环形压条与三条轨道导引环。

import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { CreateLathe } from "@babylonjs/core/Meshes/Builders/latheBuilder.js";
import { CreateTorus } from "@babylonjs/core/Meshes/Builders/torusBuilder.js";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder.js";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder.js";

import {
  DECK_BOTTOM_Y,
  DECK_INNER_RADIUS,
  DECK_OUTER_RADIUS,
  DECK_SIDES,
  DECK_TOP_Y,
  LANE_RING_RADIUS,
  LANE_Y,
  NAMES,
  PALETTE,
  SOCKET_COUNT,
  SOCKET_RADIUS,
  TAU,
} from "./constants.js";
import { createAdditive, createEmissive, createMetal, setColor } from "./materials.js";
import { decor, place, weld } from "./geometry.js";

const PYLON_RADIUS = LANE_RING_RADIUS;
const PYLON_TOP_Y = LANE_Y[LANE_Y.length - 1] + 2.4;

function deckProfile() {
  const mid = (DECK_TOP_Y + DECK_BOTTOM_Y) * 0.5;
  return [
    new Vector3(DECK_INNER_RADIUS, DECK_TOP_Y, 0),
    new Vector3(DECK_OUTER_RADIUS, DECK_TOP_Y, 0),
    new Vector3(DECK_OUTER_RADIUS, mid, 0),
    new Vector3(DECK_OUTER_RADIUS - 5, DECK_BOTTOM_Y, 0),
    new Vector3(DECK_INNER_RADIUS + 5, DECK_BOTTOM_Y, 0),
    new Vector3(DECK_INNER_RADIUS, mid, 0),
    new Vector3(DECK_INNER_RADIUS, DECK_TOP_Y, 0),
  ];
}

export function buildDeck(scene, parent) {
  const root = new TransformNode("deck-root", scene);
  root.parent = parent;

  const plateMat = createMetal(scene, "mat-deck-plate", PALETTE.metalDark, {
    metallic: 0.86,
    roughness: 0.52,
  });
  const trimMat = createMetal(scene, "mat-deck-trim", PALETTE.metalTrim, {
    metallic: 0.95,
    roughness: 0.24,
    emissive: PALETTE.seam,
    emissiveIntensity: 0.25,
  });
  const seamMat = createEmissive(scene, "mat-deck-seam", PALETTE.seam, 1.1, {
    albedo: [0.02, 0.05, 0.08],
    roughness: 0.5,
  });

  // 六棱环甲板：把剖面绕 Y 轴以 6 等分旋成，得到中间镂空的硬边平台。
  const plate = CreateLathe(
    NAMES.deck,
    {
      shape: deckProfile(),
      tessellation: DECK_SIDES,
      closed: true,
      sideOrientation: Mesh.DOUBLESIDE,
    },
    scene
  );
  // 转 30°，让 socket-0 落在一条棱面的正中而不是棱角上。
  plate.rotation.y = Math.PI / DECK_SIDES;
  plate.convertToFlatShadedMesh();
  plate.material = plateMat;
  plate.parent = root;
  plate.isPickable = false;
  plate.receiveShadows = true;

  const rimInner = CreateTorus(
    NAMES.deckRimInner,
    { diameter: (DECK_INNER_RADIUS + 2) * 2, thickness: 0.6, tessellation: 64 },
    scene
  );
  place(rimInner, { pos: [0, DECK_TOP_Y + 0.05, 0] });
  rimInner.material = trimMat;
  rimInner.parent = root;
  decor(rimInner);

  const rimOuter = CreateTorus(
    NAMES.deckRimOuter,
    { diameter: (DECK_OUTER_RADIUS - 10) * 2, thickness: 0.8, tessellation: 96 },
    scene
  );
  place(rimOuter, { pos: [0, DECK_TOP_Y + 0.05, 0] });
  rimOuter.material = trimMat;
  rimOuter.parent = root;
  decor(rimOuter);

  const socketRail = CreateTorus(
    "deck-socket-rail",
    { diameter: SOCKET_RADIUS * 2, thickness: 0.9, tessellation: 96 },
    scene
  );
  place(socketRail, { pos: [0, DECK_TOP_Y + 0.1, 0] });
  socketRail.material = trimMat;
  socketRail.parent = root;
  decor(socketRail);

  // 24 条径向缝线，把甲板按插座数切成可读的扇区。
  const seamParts = [];
  const seamInner = DECK_INNER_RADIUS + 3;
  const seamOuter = DECK_OUTER_RADIUS - 9;
  for (let i = 0; i < SOCKET_COUNT; i += 1) {
    const theta = (i / SOCKET_COUNT) * TAU;
    const length = seamOuter - seamInner;
    const mid = (seamOuter + seamInner) * 0.5;
    const bar = CreateBox(`deck-seam-${i}`, { width: i % 4 === 0 ? 0.3 : 0.14, height: 0.08, depth: length }, scene);
    place(bar, {
      pos: [Math.cos(theta) * mid, DECK_TOP_Y + 0.05, Math.sin(theta) * mid],
      rot: [0, Math.PI / 2 - theta, 0],
    });
    seamParts.push(bar);
  }
  const seams = weld(seamParts, NAMES.deckSeams, seamMat, { flat: false });
  if (seams) {
    seams.parent = root;
    decor(seams);
  }

  // 甲板下方的 6 根主梁，把平台与星核在视觉上连起来。
  const spokeParts = [];
  for (let i = 0; i < DECK_SIDES; i += 1) {
    const theta = (i / DECK_SIDES) * TAU;
    const beam = CreateBox(`deck-spoke-${i}`, { width: 2.6, height: 1.4, depth: DECK_INNER_RADIUS + 2 }, scene);
    place(beam, {
      pos: [Math.cos(theta) * 12, DECK_BOTTOM_Y + 1.1, Math.sin(theta) * 12],
      rot: [0, Math.PI / 2 - theta, 0],
    });
    spokeParts.push(beam);
  }
  const spokes = weld(spokeParts, NAMES.deckSpokes, plateMat, { flat: true });
  if (spokes) {
    spokes.parent = root;
    decor(spokes);
  }

  // 6 根立柱撑起三层环轨，顺带给场景一个可读的高度尺度。
  const pylonParts = [];
  const pylonGlowParts = [];
  for (let i = 0; i < DECK_SIDES; i += 1) {
    const theta = ((i + 0.5) / DECK_SIDES) * TAU;
    const x = Math.cos(theta) * PYLON_RADIUS;
    const z = Math.sin(theta) * PYLON_RADIUS;
    const height = PYLON_TOP_Y - DECK_TOP_Y;
    const column = CreateCylinder(
      `deck-pylon-${i}`,
      { diameterTop: 1.1, diameterBottom: 2.2, height, tessellation: 6 },
      scene
    );
    place(column, { pos: [x, DECK_TOP_Y + height * 0.5, z], rot: [0, Math.PI / 2 - theta, 0] });
    pylonParts.push(column);

    const cap = CreateCylinder(`deck-pylon-cap-${i}`, { diameter: 1.9, height: 0.5, tessellation: 6 }, scene);
    place(cap, { pos: [x, PYLON_TOP_Y, z] });
    pylonParts.push(cap);

    for (const bandY of LANE_Y) {
      const band = CreateCylinder(`deck-pylon-band-${i}-${bandY}`, { diameter: 1.7, height: 0.22, tessellation: 6 }, scene);
      place(band, { pos: [x, bandY, z] });
      pylonGlowParts.push(band);
    }
  }
  const pylons = weld(pylonParts, "deck-pylons", plateMat, { flat: true });
  if (pylons) {
    pylons.parent = root;
    decor(pylons);
  }
  const pylonGlow = weld(pylonGlowParts, "deck-pylon-bands", seamMat, { flat: true });
  if (pylonGlow) {
    pylonGlow.parent = root;
    decor(pylonGlow);
  }

  return { root, plate, seams, seamMat, trimMat, plateMat };
}

/** 三条来袭轨道的导引环：y = 0 / 4 / 9，弱加色发光，不参与光照。 */
export function buildLaneRings(scene, parent) {
  const root = new TransformNode("lane-rings", scene);
  root.parent = parent;

  const rings = LANE_Y.map((y, lane) => {
    const mat = createAdditive(scene, `mat-lane-${lane}`, PALETTE.lane[lane], { alpha: 1 });
    const ring = CreateTorus(
      NAMES.laneRing(lane),
      { diameter: LANE_RING_RADIUS * 2, thickness: 0.22 + lane * 0.02, tessellation: 128 },
      scene
    );
    place(ring, { pos: [0, y, 0] });
    ring.material = mat;
    ring.parent = root;
    ring.applyFog = false;
    decor(ring);

    // 内侧一圈更细的伴随环，读起来像有厚度的轨道而不是一根线。
    const innerMat = createAdditive(scene, `mat-lane-${lane}-inner`, PALETTE.lane[lane], { alpha: 0.45 });
    const inner = CreateTorus(
      `${NAMES.laneRing(lane)}-inner`,
      { diameter: (LANE_RING_RADIUS - 1.6) * 2, thickness: 0.1, tessellation: 128 },
      scene
    );
    place(inner, { pos: [0, y, 0] });
    inner.material = innerMat;
    inner.parent = root;
    inner.applyFog = false;
    decor(inner);

    return { lane, y, ring, inner, mat, innerMat };
  });

  return { root, rings };
}

/** 轨道环随时钟做极弱的呼吸，避免静止画面显得死板。 */
export function syncLaneRings(laneRings, clock, view) {
  for (const entry of laneRings.rings) {
    const occupied = view.enemies.some((enemy) => enemy.lane === entry.lane);
    const pulse = 0.5 + 0.5 * Math.sin(clock * 1.1 + entry.lane * 2.1);
    const level = (occupied ? 0.55 : 0.22) + pulse * (occupied ? 0.3 : 0.08);
    const rgb = PALETTE.lane[entry.lane];
    setColor(entry.mat.emissiveColor, [rgb[0] * level, rgb[1] * level, rgb[2] * level]);
    setColor(entry.innerMat.emissiveColor, [rgb[0] * level * 0.6, rgb[1] * level * 0.6, rgb[2] * level * 0.6]);
    entry.ring.rotation.y = clock * (0.02 + entry.lane * 0.012);
  }
}
