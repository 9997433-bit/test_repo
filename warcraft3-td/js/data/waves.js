/*
 * Creep archetypes and the 30-wave ladder.
 * Waves are pure data: the wave manager reads them, nothing here mutates.
 */
(function (global) {
  'use strict';

  var BASE_HP = 50;
  var HP_GROWTH = 1.140;
  var BASE_SPEED = 96;      // world units / second
  var AIR_SPEED = 66;

  var CREEPS = {
    skeleton:  { nameZh: '骷髅战士', nameEn: 'Skeleton',    armor: 'unarmored', armorValue: 0, hp: 0.85, speed: 1.00, radius: 13, bounty: 1.00, color: '#d8d2c0', shape: 'skeleton' },
    footman:   { nameZh: '步兵',     nameEn: 'Footman',     armor: 'medium',    armorValue: 2, hp: 1.00, speed: 0.95, radius: 15, bounty: 1.05, color: '#9fc0ee', shape: 'soldier' },
    ghoul:     { nameZh: '食尸鬼',   nameEn: 'Ghoul',       armor: 'unarmored', armorValue: 0, hp: 0.78, speed: 1.38, radius: 13, bounty: 0.95, color: '#b9d48e', shape: 'beast' },
    grunt:     { nameZh: '兽人步兵', nameEn: 'Grunt',       armor: 'heavy',     armorValue: 3, hp: 1.28, speed: 0.90, radius: 16, bounty: 1.15, color: '#d38455', shape: 'brute' },
    huntress:  { nameZh: '弓箭手',   nameEn: 'Huntress',    armor: 'light',     armorValue: 1, hp: 0.92, speed: 1.16, radius: 15, bounty: 1.00, color: '#93e4c4', shape: 'soldier' },
    knight:    { nameZh: '骑士',     nameEn: 'Knight',      armor: 'heavy',     armorValue: 5, hp: 1.55, speed: 1.02, radius: 17, bounty: 1.25, color: '#c8cddd', shape: 'rider' },
    catapult:  { nameZh: '攻城车',   nameEn: 'Siege Engine', armor: 'fortified', armorValue: 4, hp: 2.00, speed: 0.62, radius: 19, bounty: 1.45, color: '#a98b5f', shape: 'engine' },
    ancient:   { nameZh: '远古树人', nameEn: 'Ancient',     armor: 'heavy',     armorValue: 4, hp: 1.75, speed: 0.74, radius: 20, bounty: 1.40, color: '#7fae6a', shape: 'treant', spellImmune: true },
    demon:     { nameZh: '混沌魔',   nameEn: 'Chaos Fiend', armor: 'unarmored', armorValue: 2, hp: 1.18, speed: 1.28, radius: 16, bounty: 1.20, color: '#e2705f', shape: 'demon' },
    wyvern:    { nameZh: '双足飞龙', nameEn: 'Wyvern',      armor: 'light',     armorValue: 1, hp: 0.98, speed: 1.00, radius: 15, bounty: 1.20, color: '#e0b96a', shape: 'wing', flying: true },
    gargoyle:  { nameZh: '石像鬼',   nameEn: 'Gargoyle',    armor: 'heavy',     armorValue: 4, hp: 1.22, speed: 0.94, radius: 15, bounty: 1.30, color: '#9b96b8', shape: 'wing', flying: true },

    boss_ogre:      { nameZh: '食人魔领主', nameEn: 'Ogre Lord',    armor: 'hero',      armorValue: 5,  hp: 8.5,  speed: 0.72, radius: 27, bounty: 8,  color: '#e0a35c', shape: 'brute',  boss: true },
    boss_abom:      { nameZh: '憎恶',       nameEn: 'Abomination',  armor: 'fortified', armorValue: 7,  hp: 11.0, speed: 0.62, radius: 29, bounty: 9,  color: '#c9c07e', shape: 'brute',  boss: true },
    boss_forest:    { nameZh: '森林之王',   nameEn: 'Forest Lord',  armor: 'hero',      armorValue: 8,  hp: 13.0, speed: 0.70, radius: 30, bounty: 10, color: '#8fd08a', shape: 'treant', boss: true },
    boss_dragon:    { nameZh: '青铜巨龙',   nameEn: 'Bronze Dragon', armor: 'hero',     armorValue: 8,  hp: 12.0, speed: 0.80, radius: 30, bounty: 11, color: '#e3c072', shape: 'wing',   boss: true, flying: true },
    boss_lich:      { nameZh: '巫妖',       nameEn: 'Lich King',    armor: 'hero',      armorValue: 9,  hp: 14.5, speed: 0.74, radius: 30, bounty: 12, color: '#8fd8f0', shape: 'demon',  boss: true, spellImmune: true },
    boss_archdemon: { nameZh: '深渊领主',   nameEn: 'Pit Lord',     armor: 'hero',      armorValue: 10, hp: 20.0, speed: 0.66, radius: 34, bounty: 16, color: '#ef6a4a', shape: 'demon',  boss: true }
  };

  // [ [type, count, interval] ... ] per wave.
  var PLAN = [
    [['skeleton', 8, 0.9]],
    [['footman', 10, 0.85]],
    [['ghoul', 12, 0.7]],
    [['grunt', 10, 0.9]],
    [['boss_ogre', 1, 1], ['grunt', 6, 0.9]],
    [['huntress', 14, 0.66]],
    [['wyvern', 12, 0.72]],
    [['catapult', 10, 1.05]],
    [['ghoul', 18, 0.5]],
    [['boss_abom', 1, 1], ['skeleton', 10, 0.7]],
    [['knight', 14, 0.78]],
    [['gargoyle', 12, 0.72]],
    [['ancient', 10, 0.95]],
    [['huntress', 16, 0.55], ['ghoul', 8, 0.5]],
    [['boss_forest', 1, 1], ['huntress', 10, 0.7]],
    [['catapult', 12, 0.95]],
    [['wyvern', 16, 0.58]],
    [['demon', 14, 0.62]],
    [['knight', 16, 0.7], ['grunt', 8, 0.6]],
    [['boss_dragon', 1, 1], ['wyvern', 8, 0.75]],
    [['gargoyle', 16, 0.6]],
    [['ancient', 14, 0.8]],
    [['ghoul', 20, 0.42], ['grunt', 12, 0.6]],
    [['catapult', 14, 0.85], ['wyvern', 8, 0.7]],
    [['boss_lich', 1, 1], ['demon', 10, 0.6]],
    [['knight', 18, 0.6], ['gargoyle', 8, 0.7]],
    [['demon', 20, 0.5]],
    [['ancient', 14, 0.7], ['wyvern', 12, 0.6]],
    [['knight', 14, 0.55], ['demon', 14, 0.55], ['gargoyle', 10, 0.6]],
    [['boss_archdemon', 1, 1], ['demon', 14, 0.55], ['gargoyle', 10, 0.6]]
  ];

  function hpForWave(w) {
    return BASE_HP * Math.pow(HP_GROWTH, w - 1);
  }

  function bountyForWave(w) {
    return 6 + 1.7 * w;
  }

  function buildWaves() {
    return PLAN.map(function (groups, i) {
      var wave = i + 1;
      var boss = false;
      var total = 0;
      var entries = groups.map(function (g) {
        var def = CREEPS[g[0]];
        if (def.boss) boss = true;
        total += g[1];
        return {
          type: g[0],
          def: def,
          count: g[1],
          interval: g[2],
          hp: Math.round(hpForWave(wave) * def.hp * (def.boss ? 1 : 1)),
          speed: (def.flying ? AIR_SPEED : BASE_SPEED) * def.speed,
          bounty: Math.max(3, Math.round(bountyForWave(wave) * def.bounty))
        };
      });
      return {
        wave: wave,
        boss: boss,
        entries: entries,
        totalCreeps: total,
        // Total effective HP, shown in the wave preview tooltip.
        hpPool: entries.reduce(function (s, e) { return s + e.hp * e.count; }, 0)
      };
    });
  }

  var API = {
    CREEPS: CREEPS,
    PLAN: PLAN,
    BASE_HP: BASE_HP,
    HP_GROWTH: HP_GROWTH,
    BASE_SPEED: BASE_SPEED,
    AIR_SPEED: AIR_SPEED,
    TOTAL_WAVES: PLAN.length,
    hpForWave: hpForWave,
    bountyForWave: bountyForWave,
    buildWaves: buildWaves,
    WAVES: buildWaves()
  };

  global.WC3.WaveData = API;

  if (typeof module === 'object' && module.exports) module.exports = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
