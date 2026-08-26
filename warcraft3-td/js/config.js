/* Emberhold TD — global balance constants.
 * Classic script (no modules) so that file:// works. Everything hangs off WC3TD. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});

  const Config = {
    version: '1.0.0',
    seed: 20260826,

    // ---- simulation ----
    tickHz: 60,
    dt: 1 / 60,
    maxFrameSkip: 5,
    speeds: [1, 1.5, 2],

    // ---- map ----
    grid: { cols: 28, rows: 22 },
    tile: { hw: 32, hh: 16 }, // isometric half-width / half-height in px
    pathWidth: 1.35,          // tiles; blocks building
    // winding dirt road, tile coordinates
    waypoints: [
      { x: -0.5, y: 4 }, { x: 8, y: 4 }, { x: 8, y: 10 }, { x: 3, y: 10 },
      { x: 3, y: 17 }, { x: 13, y: 17 }, { x: 13, y: 7 }, { x: 19, y: 7 },
      { x: 19, y: 14 }, { x: 24, y: 14 }, { x: 24, y: 19 }, { x: 28.5, y: 19 }
    ],
    // flyers cut the corners of the road instead of teleporting across the map
    airWaypoints: [
      { x: -0.5, y: 4 }, { x: 3, y: 10 }, { x: 13, y: 7 }, { x: 24, y: 14 }, { x: 28.5, y: 19 }
    ],
    keepTile: { x: 26.5, y: 19 },
    portalTile: { x: 0.2, y: 4 },
    flyHeight: 2.1, // tiles of visual altitude for flying creeps

    // ---- economy ----
    interestPeriod: 15,      // seconds
    interestStart: 0.02,
    interestCap: 0.08,
    interestStep: 0.005,     // +0.5% per boss wave cleared
    lumberEveryWaves: 5,
    lumberPerBoss: 1,
    sellRatio: 0.75,
    autoWaveDelay: 12,       // seconds after a clear
    firstWaveDelay: 25,

    /* Global balance scalars. These are the knobs to turn when the campaign
     * curve needs to move; per-tower and per-creep numbers stay readable. */
    balance: {
      towerDamage: 1.45,
      creepHp: 1.0,
      bounty: 1.0
    },

    // ---- combat ----
    armorReductionPerPoint: 0.06,
    // Only these attack types may strike a flying target (DESIGN.md §3).
    flyingAttackTypes: ['pierce', 'magic', 'chaos'],
    splashFalloff: { full: 1.0, mid: 0.5, outer: 0.25 },
    critMultiplierDefault: 2.0,
    // damage-over-time ticks
    dotTickInterval: 0.5,

    // ---- hero ----
    hero: {
      baseHp: 900, hpPerLevel: 140,
      baseMana: 300, manaPerLevel: 60,
      manaRegen: 2.2, hpRegen: 3.0,
      xpPerWave: 1, maxLevel: 10,
      leakLifeCost: 3,
      respawnTime: 25
    },

    difficulties: {
      easy:   { key: 'easy',   hp: 0.72, bounty: 1.25, gold: 200, lives: 30, leak: 1, speed: 0.94 },
      normal: { key: 'normal', hp: 1.00, bounty: 1.00, gold: 120, lives: 20, leak: 1, speed: 1.00 },
      hard:   { key: 'hard',   hp: 1.38, bounty: 0.85, gold: 90,  lives: 12, leak: 1, speed: 1.06 },
      insane: { key: 'insane', hp: 1.68, bounty: 0.78, gold: 130, lives: 10, leak: 1, speed: 1.12 }
    },

    ui: {
      tooltipDelay: 250,
      floatTextLife: 1.1,
      rangeCircleAlpha: 0.22
    }
  };

  NS.Config = Config;
})(typeof globalThis !== 'undefined' ? globalThis : this);
