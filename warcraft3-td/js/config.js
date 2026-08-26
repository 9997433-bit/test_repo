/*
 * Ironoath Keep TD — global configuration & balance constants.
 * Classic script (file:// safe) + CommonJS export for the node test runner.
 */
(function (global) {
  'use strict';

  var TILE = 48;
  var GRID_W = 34;
  var GRID_H = 22;

  // Ground road, in tile coordinates. Rendered/simulated as a polyline.
  var PATH_TILES = [
    [-1.0, 3], [8, 3], [8, 9], [2, 9], [2, 16], [13, 16],
    [13, 6], [20, 6], [20, 18], [27, 18], [27, 11], [32.4, 11]
  ];

  // Flying bypass: air creeps ignore the road and sweep across the map.
  var AIR_PATH_TILES = [[-1.0, 3], [9, 5], [16, 9.5], [24, 6.5], [32.4, 11]];

  var PORTAL_TILE = [0.6, 3];
  var KEEP_TILE = [31.6, 11];

  var Config = {
    // ---- world -------------------------------------------------------
    TILE: TILE,
    GRID_W: GRID_W,
    GRID_H: GRID_H,
    WORLD_W: TILE * GRID_W,
    WORLD_H: TILE * GRID_H,
    PATH_TILES: PATH_TILES,
    AIR_PATH_TILES: AIR_PATH_TILES,
    PORTAL_TILE: PORTAL_TILE,
    KEEP_TILE: KEEP_TILE,
    // Half-width of the unbuildable road corridor, in world units.
    ROAD_CLEARANCE: TILE * 1.02,
    ROAD_WIDTH: TILE * 1.45,

    // ---- simulation --------------------------------------------------
    TICK_RATE: 60,
    DT: 1 / 60,
    // Hard cap on catch-up steps per frame. Prevents the classic
    // "spiral of death" soft-lock when a tab is backgrounded.
    MAX_STEPS_PER_FRAME: 5,
    MAX_FRAME_MS: 250,
    SPEEDS: [1, 1.5, 2],
    seed: 20030703, // arbitrary fixed value: the default deterministic sim seed

    // ---- spatial hash ------------------------------------------------
    HASH_CELL: TILE * 2,

    // ---- camera ------------------------------------------------------
    CAMERA: {
      minZoom: 0.55,
      maxZoom: 1.9,
      startZoom: 1.0,
      panSpeed: 780,      // world units / second at zoom 1
      edgePanMargin: 14,  // px from viewport edge that triggers edge scroll
      zoomStep: 1.12,
      tilt: 0.78          // vertical squash: faux-isometric look
    },

    // ---- economy -----------------------------------------------------
    INTEREST_PERIOD: 15,
    INTEREST_START: 0.02,
    INTEREST_CAP: 0.08,
    INTEREST_STEP: 0.01,     // +1% per INTEREST_WAVE_STEP cleared waves
    INTEREST_WAVE_STEP: 4,
    LUMBER_EVERY: 5,
    SELL_RATE: 0.75,
    AUTO_WAVE_DELAY: 12,
    EARLY_CALL_BONUS: 0.6,   // gold per remaining second when calling early

    // ---- difficulty --------------------------------------------------
    DIFFICULTY: {
      easy:   { id: 'easy',   hp: 0.72, bounty: 1.25, gold: 200, lives: 30, speed: 0.92 },
      normal: { id: 'normal', hp: 1.00, bounty: 1.00, gold: 120, lives: 20, speed: 1.00 },
      hard:   { id: 'hard',   hp: 1.38, bounty: 0.85, gold: 100, lives: 12, speed: 1.06 },
      insane: { id: 'insane', hp: 1.95, bounty: 0.72, gold: 85,  lives: 8,  speed: 1.14 }
    },

    // ---- combat ------------------------------------------------------
    ARMOR_REDUCTION_K: 0.06,   // WC3 armor formula constant
    PROJECTILE_SPEED_DEFAULT: 560,
    MAX_CREEPS_SOFT: 220,      // safety valve; wave spawner never exceeds this

    // ---- presentation ------------------------------------------------
    DAY_NIGHT_WAVES: 4,
    FLOAT_TEXT_TTL: 0.95,
    STORAGE_KEY: 'ironoath-keep-td.v1'
  };

  global.WC3 = global.WC3 || {};
  global.WC3.Config = Config;

  if (typeof module === 'object' && module.exports) module.exports = Config;
})(typeof globalThis !== 'undefined' ? globalThis : this);
