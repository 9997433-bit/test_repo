// Opus-2 世界 · 六边形甲板、环形压条与三条轨道导引环。
//
// 甲板是一圈六棱环：六个角正好顶在导引环半径上，棱面中点则退到 45 左右，
// 于是 r=40 的插座永远踩在实地上，而三条环轨看起来是被六个角托住的。

import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { CreateLathe } from "@babylonjs/core/Meshes/Builders/latheBuilder.js";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder.js";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder.js";

import {
  DECK_BOTTOM_Y,
  DECK_INNER_RADIUS,
  DECK_OUTER_RADIUS,
  DECK_PHASE,
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
import { createRing, decor, place, weld } from "./geometry.js";

const PYLON_RADIUS = LANE_RING_RADIUS;
const PYLON_TOP_Y = LANE_Y[LANE_Y.length - 1] + 2.6;
const TERRACE_INNER = DECK_INNER_RADIUS + 4;
const TERRACE_OUTER = DECK_INNER_RADIUS + 13;

function deckProfile() {
  return [
    new Vector3(DECK_INNER_RADIUS, DECK_TOP_Y, 0),
    new Vector3(DECK_OUTER_RADIUS - 4, DECK_TOP_Y, 0),
    new Vector3(DECK_OUTER_RADIUS, DECK_TOP_Y - 0.9, 0),
    new Vector3(DECK_OUTER_RADIUS, DECK_TOP_Y - 1.9, 0),
    new Vector3(DECK_OUTER_RADIUS - 5, DECK_BOTTOM_Y, 0),
    new Vector3(DECK_INNER_RADIUS + 5, DECK_BOTTOM_Y, 0),
    new Vector3(DECK_INNER_RADIUS, DECK_TOP_Y - 1.2, 0),
    new Vector3(DECK_INNER_RADIUS, DECK_TOP_Y, 0),
  ];
}

function terraceProfile() {
  const top = DECK_TOP_Y + 0.55;
  return [
    new Vector3(TERRACE_INNER, DECK_TOP_Y, 0),
    new Vector3(TERRACE_INNER + 1, top, 0),
    new Vector3(TERRACE_OUTER - 1, top, 0),
    new Vector3(TERRACE_OUTER, DECK_TOP_Y, 0),
    new Vector3(TERRACE_INNER, DECK_TOP_Y, 0),
  ];
}

function hexLathe(scene, name, shape, sides = DECK_SIDES) {
  const mesh = CreateLathe(name, { shape, tessellation: sides, closed: true, sideOrientation: Mesh.DOUBLESIDE }, scene);
  mesh.rotation.y = DECK_PHASE;
  mesh.convertToFlatShadedMesh();
  return mesh;
}

export function buildDeck(scene, parent) {
  const root = new TransformNode("deck-root", scene);
  root.parent = parent;

  const plateMat = createMetal(scene, "mat-deck-plate", PALETTE.metalDark, {
    metallic: 0.72,
    roughness: 0.45,
  });
  const trimMat = createMetal(scene, "mat-deck-trim", PALETTE.metalTrim, {
    metallic: 0.95,
    roughness: 0.22,
    emissive: PALETTE.seam,
    emissiveIntensity: 0.2,
  });
  const seamMat = createEmissive(scene, "mat-deck-seam", PALETTE.seam, 0.9, {
    albedo: [0.02, 0.05, 0.08],
    roughness: 0.5,
  });

  const plate = hexLathe(scene, NAMES.deck, deckProfile());
  plate.material = plateMat;
  plate.parent = root;
  plate.isPickable = false;

  const terrace = hexLathe(scene, "deck-terrace", terraceProfile());
  terrace.material = plateMat;
  terrace.parent = root;
  decor(terrace);

  // 沿六边形外缘的一圈发光轮廓，让「六棱甲板」这件事一眼可读。
  const hexTrim = createRing(scene, "deck-hex-trim", DECK_OUTER_RADIUS - 2.6, 0.3, DECK_SIDES, 4);
  hexTrim.rotation.y = DECK_PHASE;
  hexTrim.position.y = DECK_TOP_Y + 0.16;
  hexTrim.material = seamMat;
  hexTrim.parent = root;
  decor(hexTrim);

  const rimInner = createRing(scene, NAMES.deckRimInner, DECK_INNER_RADIUS + 1.4, 0.34, 72, 6);
  rimInner.position.y = DECK_TOP_Y + 0.1;
  rimInner.material = trimMat;
  rimInner.parent = root;
  decor(rimInner);

  const rimOuter = createRing(scene, NAMES.deckRimOuter, TERRACE_OUTER + 2.4, 0.3, 96, 6);
  rimOuter.position.y = DECK_TOP_Y + 0.1;
  rimOuter.material = trimMat;
  rimOuter.parent = root;
  decor(rimOuter);

  const socketRail = createRing(scene, "deck-socket-rail", SOCKET_RADIUS, 0.55, 96, 6);
  socketRail.position.y = DECK_TOP_Y + 0.2;
  socketRail.material = trimMat;
  socketRail.parent = root;
  decor(socketRail);

  // 24 条径向缝线，把甲板按插座数切成可读的扇区。
  const seamParts = [];
  const seamInner = DECK_INNER_RADIUS + 2.4;
  const seamOuter = SOCKET_RADIUS - 3.2;
  for (let i = 0; i < SOCKET_COUNT; i += 1) {
    const theta = (i / SOCKET_COUNT) * TAU;
    const length = seamOuter - seamInner;
    const mid = (seamOuter + seamInner) * 0.5;
    const bar = CreateBox(`deck-seam-${i}`, { width: i % 4 === 0 ? 0.34 : 0.16, height: 0.1, depth: length }, scene);
    place(bar, {
      pos: [Math.cos(theta) * mid, DECK_TOP_Y + 0.06, Math.sin(theta) * mid],
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
    const theta = ((i + 0.5) / DECK_SIDES) * TAU;
    const beam = CreateBox(`deck-spoke-${i}`, { width: 3.0, height: 1.6, depth: DECK_INNER_RADIUS + 3 }, scene);
    place(beam, {
      pos: [Math.cos(theta) * 11, DECK_BOTTOM_Y + 1.3, Math.sin(theta) * 11],
      rot: [0, Math.PI / 2 - theta, 0],
    });
    spokeParts.push(beam);
  }
  const spokes = weld(spokeParts, NAMES.deckSpokes, plateMat, { flat: true });
  if (spokes) {
    spokes.parent = root;
    decor(spokes);
  }

  // 6 根立柱立在六边形的角上，正好托住三条环轨。
  const pylonParts = [];
  const pylonGlowParts = [];
  for (let i = 0; i < DECK_SIDES; i += 1) {
    const theta = ((i + 0.5) / DECK_SIDES) * TAU;
    const x = Math.cos(theta) * PYLON_RADIUS;
    const z = Math.sin(theta) * PYLON_RADIUS;
    const height = PYLON_TOP_Y - DECK_BOTTOM_Y;
    const column = CreateCylinder(
      `deck-pylon-${i}`,
      { diameterTop: 1.5, diameterBottom: 3.4, height, tessellation: 6 },
      scene
    );
    place(column, { pos: [x, DECK_BOTTOM_Y + height * 0.5, z], rot: [0, Math.PI / 2 - theta, 0] });
    pylonParts.push(column);

    const cap = CreateCylinder(`deck-pylon-cap-${i}`, { diameter: 2.6, height: 0.6, tessellation: 6 }, scene);
    place(cap, { pos: [x, PYLON_TOP_Y, z] });
    pylonParts.push(cap);

    // 从立柱伸向甲板的斜撑。
    const brace = CreateBox(`deck-brace-${i}`, { width: 0.8, height: 0.8, depth: 9 }, scene);
    place(brace, {
      pos: [Math.cos(theta) * (PYLON_RADIUS - 4), DECK_TOP_Y - 1.6, Math.sin(theta) * (PYLON_RADIUS - 4)],
      rot: [0.42, Math.PI / 2 - theta, 0],
    });
    pylonParts.push(brace);

    for (const bandY of LANE_Y) {
      const band = CreateCylinder(`deck-pylon-band-${i}-${bandY}`, { diameter: 2.4, height: 0.3, tessellation: 6 }, scene);
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
    const ring = createRing(scene, NAMES.laneRing(lane), LANE_RING_RADIUS, 0.26 + lane * 0.03, 120, 5);
    ring.position.y = y;
    ring.material = mat;
    ring.parent = root;
    ring.applyFog = false;
    decor(ring);

    // 内侧一圈更细的伴随环，读起来像有厚度的轨道而不是一根线。
    const innerMat = createAdditive(scene, `mat-lane-${lane}-inner`, PALETTE.lane[lane], { alpha: 0.5 });
    const inner = createRing(scene, `${NAMES.laneRing(lane)}-inner`, LANE_RING_RADIUS - 2.2, 0.1, 96, 4);
    inner.position.y = y;
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
    const level = (occupied ? 0.46 : 0.2) + pulse * (occupied ? 0.2 : 0.06);
    const rgb = PALETTE.lane[entry.lane];
    setColor(entry.mat.emissiveColor, [rgb[0] * level, rgb[1] * level, rgb[2] * level]);
    setColor(entry.innerMat.emissiveColor, [rgb[0] * level * 0.55, rgb[1] * level * 0.55, rgb[2] * level * 0.55]);
    entry.ring.rotation.y = clock * (0.02 + entry.lane * 0.012);
  }
}
