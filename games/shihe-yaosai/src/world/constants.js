// Opus-2 世界 · 尺寸与配色常量
// 这里只放纯数据，不引用 Babylon，方便被 node 侧测试直接读取。

export const TAU = Math.PI * 2;

/** 环上插座数量。socket-0 .. socket-23。 */
export const SOCKET_COUNT = 24;
/** 插座所在极径。 */
export const SOCKET_RADIUS = 40;
/** 插座中心高度，与 socketWorldPos 返回的 y 一致。 */
export const SOCKET_Y = 1;
/** 插座基座（六棱台）高度，底面正好落在甲板面上。 */
export const SOCKET_HEIGHT = 2;

/** 星核半径。 */
export const CORE_RADIUS = 8;

/** 三条来袭轨道的高度。 */
export const LANE_Y = [0, 4, 9];
/** 轨道导引环的极径，与 data 层 spawnRadius 对齐。 */
export const LANE_RING_RADIUS = 52;

// 六边形甲板：外缘六个角正好落在导引环半径上，让环轨看起来是被甲板的六个角托住的。
export const DECK_INNER_RADIUS = 22;
export const DECK_OUTER_RADIUS = LANE_RING_RADIUS;
export const DECK_TOP_Y = -0.2;
export const DECK_BOTTOM_Y = -3.2;
export const DECK_SIDES = 6;
/** 甲板旋转 30°，让 socket-0 落在棱面正中而不是棱角上。 */
export const DECK_PHASE = Math.PI / DECK_SIDES;

/** 天穹半径（星尘背景）。 */
export const SKY_RADIUS = 460;

/** 五种炮塔剪影。towerId 最终都会归一到这五个之一。 */
export const TURRET_KINDS = ["rail", "prism", "scatter", "well", "star"];

/** 敌人体型，view.enemies[].kind 归一到这三种。 */
export const ENEMY_SHAPES = ["drone", "hulk", "wisp"];

/** 网格命名前缀，供 UI / 输入层做 name 匹配。 */
export const NAMES = {
  root: "world-root",
  core: "core-star",
  coreInner: "core-inner",
  coreShell: "core-shell",
  coreCage: "core-cage",
  deck: "deck-hex",
  deckRimInner: "deck-rim-inner",
  deckRimOuter: "deck-rim-outer",
  deckSeams: "deck-seams",
  deckSpokes: "deck-spokes",
  socket: (i) => `socket-${i}`,
  socketRim: (i) => `socket-${i}-rim`,
  turret: (i) => `socket-${i}-turret`,
  turretBody: (i) => `socket-${i}-turret-body`,
  turretGlow: (i) => `socket-${i}-turret-glow`,
  laneRing: (lane) => `lane-ring-${lane}`,
  enemy: (shape, lane) => `enemy-${shape}-lane${lane}`,
  skyDome: "sky-dome",
  skyStars: "sky-stars",
  sun: "world-sun",
  hemi: "world-hemi",
  coreLight: "core-light",
  camera: "world-camera",
};

/** 全局配色（线性 0..1 三元组，转 Color3 时直接展开）。 */
export const PALETTE = {
  background: [0.016, 0.021, 0.037],
  fog: [0.03, 0.042, 0.072],

  // 星核：满血偏暖白金，濒危偏冷蓝。
  coreHot: [1.0, 0.68, 0.26],
  coreCold: [0.16, 0.36, 0.92],
  coreShellHot: [1.0, 0.84, 0.55],
  coreShellCold: [0.32, 0.56, 1.0],

  metalDark: [0.09, 0.105, 0.135],
  metalMid: [0.135, 0.155, 0.192],
  metalTrim: [0.24, 0.27, 0.33],
  seam: [0.12, 0.5, 0.78],

  socketIdle: [0.24, 0.72, 0.95],
  socketArmed: [0.12, 0.26, 0.34],
  socketHover: [0.72, 0.95, 1.0],
  socketSelected: [1.0, 0.86, 0.4],

  lane: [
    [1.0, 0.55, 0.2],
    [0.3, 0.82, 1.0],
    [0.72, 0.46, 1.0],
  ],

  enemyBody: [0.055, 0.035, 0.05],
  enemyRim: [
    [1.0, 0.42, 0.2],
    [0.35, 0.86, 1.0],
    [0.78, 0.5, 1.0],
  ],

  overheat: [1.0, 0.4, 0.09],
};

/** 每种炮塔的发光色与基础发光强度。 */
export const TURRET_STYLE = {
  rail: { glow: [0.36, 0.86, 1.0], intensity: 0.9 },
  prism: { glow: [0.74, 0.45, 1.0], intensity: 0.82 },
  scatter: { glow: [1.0, 0.66, 0.24], intensity: 0.8 },
  well: { glow: [0.28, 1.0, 0.72], intensity: 0.85 },
  star: { glow: [1.0, 0.4, 0.72], intensity: 0.88 },
};

/** 过载 / 过热的发光改写参数。 */
export const HEAT = {
  overclockIntensity: 2.1,
  overclockWhiten: 0.42,
  overclockPulseHz: 4.4,
  overheatIntensity: 0.34,
  overheatColor: PALETTE.overheat,
  idlePulseHz: 0.55,
  idlePulseAmount: 0.14,
};
