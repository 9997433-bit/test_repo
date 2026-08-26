/*
 * Tower catalogue: 4 races x 3 lines x 3 tiers = 36 buildable towers.
 * Every entry is a plain data object; the tower entity only reads from it.
 */
(function (global) {
  'use strict';

  var Damage = global.WC3.Damage;

  var RACES = [
    { id: 'human',    nameZh: '人族',   nameEn: 'Human',      color: '#7fb4ff', accent: '#e6d7a8' },
    { id: 'orc',      nameZh: '兽族',   nameEn: 'Orc',        color: '#c96a3d', accent: '#f0c27a' },
    { id: 'nightelf', nameZh: '暗夜',   nameEn: 'Night Elf',  color: '#8fe3c0', accent: '#cfa6ff' },
    { id: 'undead',   nameZh: '亡灵',   nameEn: 'Undead',     color: '#a98fd6', accent: '#8ce6d8' }
  ];

  // Shared shape of a line: [tierName, gold, lumber, dmgMin, dmgMax, range, cooldown]
  var LINES = [
    {
      id: 'human_guard', race: 'human', attackType: 'pierce', icon: 'arrow',
      projectile: { kind: 'arrow', speed: 720 },
      descZh: '快速的穿刺箭塔，克制轻甲与无甲。',
      descEn: 'Fast pierce tower; shreds light and unarmored.',
      tiers: [
        { nameZh: '守卫箭塔', nameEn: 'Guard Tower',   gold: 60,  lumber: 0, dmg: [11, 15], range: 212, cd: 0.85 },
        { nameZh: '长弓箭塔', nameEn: 'Longbow Tower', gold: 160, lumber: 0, dmg: [25, 33], range: 232, cd: 0.75 },
        { nameZh: '皇家弩台', nameEn: 'Royal Ballista', gold: 380, lumber: 1, dmg: [58, 74], range: 266, cd: 0.66 }
      ]
    },
    {
      id: 'human_cannon', race: 'human', attackType: 'siege', icon: 'cannon',
      projectile: { kind: 'shell', speed: 480, arc: 46 },
      splash: [62, 76, 92],
      descZh: '攻城溅射，对护甲建筑与重甲高效，无法攻击空中。',
      descEn: 'Siege splash. Great vs fortified, cannot hit air.',
      tiers: [
        { nameZh: '火炮塔',   nameEn: 'Cannon Tower', gold: 92,  lumber: 0, dmg: [26, 34],   range: 198, cd: 1.50 },
        { nameZh: '攻城炮',   nameEn: 'Siege Cannon', gold: 240, lumber: 0, dmg: [58, 74],   range: 216, cd: 1.45 },
        { nameZh: '巨型臼炮', nameEn: 'Great Mortar', gold: 520, lumber: 1, dmg: [128, 162], range: 246, cd: 1.40 }
      ]
    },
    {
      id: 'human_arcane', race: 'human', attackType: 'magic', icon: 'orb',
      projectile: { kind: 'orb', speed: 560 },
      effects: [
        { kind: 'slow', factor: 0.70, duration: 2.0 },
        { kind: 'slow', factor: 0.60, duration: 2.5 },
        { kind: 'slow', factor: 0.48, duration: 3.0 }
      ],
      descZh: '奥术冲击并减速目标，克制重甲。',
      descEn: 'Arcane bolt slows the target. Strong vs heavy armor.',
      tiers: [
        { nameZh: '秘法尖塔', nameEn: 'Arcane Spire',   gold: 104, lumber: 0, dmg: [18, 24],  range: 222, cd: 1.00 },
        { nameZh: '大法师塔', nameEn: 'Magus Tower',    gold: 265, lumber: 0, dmg: [40, 50],  range: 242, cd: 0.95 },
        { nameZh: '奥术圣殿', nameEn: 'Arcanum Sanctum', gold: 560, lumber: 2, dmg: [92, 112], range: 272, cd: 0.90 }
      ]
    },

    {
      id: 'orc_watch', race: 'orc', attackType: 'normal', icon: 'spear',
      projectile: { kind: 'spear', speed: 640 },
      descZh: '普通攻击，对中甲成群小怪效率极高。',
      descEn: 'Normal attack — excellent against medium armor swarms.',
      tiers: [
        { nameZh: '瞭望塔',   nameEn: 'Watch Tower', gold: 52,  lumber: 0, dmg: [14, 18], range: 192, cd: 0.90 },
        { nameZh: '战争箭塔', nameEn: 'War Tower',   gold: 150, lumber: 0, dmg: [32, 40], range: 208, cd: 0.82 },
        { nameZh: '战争图腾', nameEn: 'War Totem',   gold: 360, lumber: 1, dmg: [74, 92], range: 236, cd: 0.74 }
      ]
    },
    {
      id: 'orc_troll', race: 'orc', attackType: 'pierce', icon: 'poison',
      projectile: { kind: 'dart', speed: 700 },
      effects: [
        { kind: 'poison', dps: 7,  duration: 3.0 },
        { kind: 'poison', dps: 16, duration: 3.5 },
        { kind: 'poison', dps: 38, duration: 4.0 }
      ],
      descZh: '毒飞镖，持续伤害可叠加刷新。',
      descEn: 'Poison darts apply stacking damage over time.',
      tiers: [
        { nameZh: '巨魔地洞',   nameEn: 'Troll Burrow',    gold: 82,  lumber: 0, dmg: [9, 13],  range: 216, cd: 0.70 },
        { nameZh: '猎头者哨塔', nameEn: 'Headhunter Post', gold: 215, lumber: 0, dmg: [20, 26], range: 236, cd: 0.62 },
        { nameZh: '蝙蝠骑士巢', nameEn: 'Batrider Nest',   gold: 470, lumber: 1, dmg: [46, 58], range: 260, cd: 0.56 }
      ]
    },
    {
      id: 'orc_spirit', race: 'orc', attackType: 'magic', icon: 'chain',
      projectile: { kind: 'bolt', speed: 900 },
      effects: [
        { kind: 'chain', jumps: 2, falloff: 0.62, radius: 130 },
        { kind: 'chain', jumps: 3, falloff: 0.66, radius: 145 },
        { kind: 'chain', jumps: 4, falloff: 0.70, radius: 162 }
      ],
      descZh: '闪电链在附近敌人之间弹跳。',
      descEn: 'Chain lightning bounces between nearby enemies.',
      tiers: [
        { nameZh: '灵魂小屋',   nameEn: 'Spirit Lodge',       gold: 116, lumber: 0, dmg: [20, 26],  range: 210, cd: 1.15 },
        { nameZh: '巫医祭坛',   nameEn: 'Witch Doctor Altar', gold: 290, lumber: 0, dmg: [44, 56],  range: 230, cd: 1.10 },
        { nameZh: '先知图腾',   nameEn: 'Farseer Totem',      gold: 610, lumber: 2, dmg: [96, 118], range: 256, cd: 1.05 }
      ]
    },

    {
      id: 'ne_protector', race: 'nightelf', attackType: 'normal', icon: 'root',
      projectile: { kind: 'thorn', speed: 680 },
      effects: [
        { kind: 'root', chance: 0.12, duration: 0.6 },
        { kind: 'root', chance: 0.15, duration: 0.85 },
        { kind: 'root', chance: 0.18, duration: 1.15 }
      ],
      descZh: '古树之刺，有几率缠绕定身目标。',
      descEn: 'Thorns with a chance to entangle the target.',
      tiers: [
        { nameZh: '远古守护者', nameEn: 'Ancient Protector', gold: 70,  lumber: 0, dmg: [16, 22],  range: 200, cd: 0.95 },
        { nameZh: '战争古树',   nameEn: 'Ancient of War',    gold: 175, lumber: 0, dmg: [36, 46],  range: 220, cd: 0.88 },
        { nameZh: '世界树苗',   nameEn: 'Worldtree Sapling', gold: 400, lumber: 1, dmg: [82, 102], range: 250, cd: 0.80 }
      ]
    },
    {
      id: 'ne_roost', race: 'nightelf', attackType: 'siege', icon: 'acid',
      projectile: { kind: 'acid', speed: 500, arc: 40 },
      splash: [66, 80, 96],
      effects: [
        { kind: 'poison', dps: 8,  duration: 3.0 },
        { kind: 'poison', dps: 18, duration: 3.0 },
        { kind: 'poison', dps: 40, duration: 3.5 }
      ],
      descZh: '腐蚀液溅射并留下酸性腐蚀，无法攻击空中。',
      descEn: 'Corrosive splash that leaves acid burn. Ground only.',
      tiers: [
        { nameZh: '奇美拉栖木', nameEn: 'Chimaera Roost', gold: 100, lumber: 0, dmg: [30, 38],   range: 204, cd: 1.60 },
        { nameZh: '酸液栖木',   nameEn: 'Acid Roost',     gold: 250, lumber: 0, dmg: [66, 82],   range: 224, cd: 1.55 },
        { nameZh: '双头巨龙巢', nameEn: 'Twinhead Aerie', gold: 540, lumber: 1, dmg: [140, 176], range: 250, cd: 1.50 }
      ]
    },
    {
      id: 'ne_moonwell', race: 'nightelf', attackType: 'magic', icon: 'star',
      projectile: { kind: 'star', speed: 620 },
      splash: [40, 48, 58],
      descZh: '坠星魔法，小范围溅射，克制重甲空军。',
      descEn: 'Starfall magic with a small splash. Great vs heavy air.',
      tiers: [
        { nameZh: '月亮井',     nameEn: 'Moon Well',      gold: 108, lumber: 0, dmg: [22, 28],   range: 226, cd: 1.05 },
        { nameZh: '星辰法阵',   nameEn: 'Starfall Circle', gold: 275, lumber: 0, dmg: [48, 60],  range: 246, cd: 1.00 },
        { nameZh: '精灵龙庭院', nameEn: 'Faerie Court',   gold: 590, lumber: 2, dmg: [104, 128], range: 276, cd: 0.95 }
      ]
    },

    {
      id: 'ud_spirit', race: 'undead', attackType: 'pierce', icon: 'skull',
      projectile: { kind: 'shard', speed: 760 },
      attackTypeByTier: ['pierce', 'pierce', 'chaos'],
      descZh: '幽魂穿刺；三级升华为混沌攻击，无视一切护甲类型。',
      descEn: 'Spirit pierce; tier 3 becomes chaos and ignores armor types.',
      tiers: [
        { nameZh: '幽魂塔',     nameEn: 'Spirit Tower',   gold: 56,  lumber: 0, dmg: [12, 16], range: 206, cd: 0.80 },
        { nameZh: '骸骨尖塔',   nameEn: 'Bone Spire',     gold: 155, lumber: 0, dmg: [28, 36], range: 226, cd: 0.72 },
        { nameZh: '诅咒方尖碑', nameEn: 'Damned Obelisk', gold: 430, lumber: 2, dmg: [70, 86], range: 254, cd: 0.66 }
      ]
    },
    {
      id: 'ud_zigg', race: 'undead', attackType: 'magic', icon: 'web',
      projectile: { kind: 'web', speed: 540 },
      effects: [
        { kind: 'slow', factor: 0.65, duration: 2.5 },
        { kind: 'slow', factor: 0.54, duration: 3.0 },
        { kind: 'slow', factor: 0.42, duration: 3.5 }
      ],
      descZh: '蛛网魔法大幅减速，同样可命中空中单位。',
      descEn: 'Webs heavily slow the target; also hits air.',
      tiers: [
        { nameZh: '蛛魔金字塔', nameEn: 'Nerubian Ziggurat', gold: 95,  lumber: 0, dmg: [16, 22],  range: 218, cd: 1.00 },
        { nameZh: '冰霜金字塔', nameEn: 'Frost Ziggurat',    gold: 245, lumber: 0, dmg: [36, 46],  range: 238, cd: 0.95 },
        { nameZh: '天灾之井',   nameEn: 'Well of Blight',    gold: 530, lumber: 1, dmg: [84, 104], range: 266, cd: 0.90 }
      ]
    },
    {
      id: 'ud_slaughter', race: 'undead', attackType: 'siege', icon: 'meat',
      projectile: { kind: 'corpse', speed: 430, arc: 54 },
      splash: [70, 84, 100],
      bonus: { heavy: 1.20, fortified: 1.25 },
      descZh: '腐尸投掷，巨额溅射并额外克制重甲/护甲，无法攻击空中。',
      descEn: 'Corpse lobs: huge splash with bonus vs heavy/fortified. Ground only.',
      tiers: [
        { nameZh: '屠宰场',     nameEn: 'Slaughterhouse',    gold: 112, lumber: 0, dmg: [34, 42],   range: 194, cd: 1.70 },
        { nameZh: '瘟疫车',     nameEn: 'Plague Wagon',      gold: 285, lumber: 0, dmg: [74, 92],   range: 214, cd: 1.65 },
        { nameZh: '天灾投石车', nameEn: 'Scourge Trebuchet', gold: 620, lumber: 2, dmg: [158, 196], range: 244, cd: 1.60 }
      ]
    }
  ];

  var TOWERS = {};
  var TOWER_LIST = [];
  var LINE_BY_ID = {};

  LINES.forEach(function (line) {
    LINE_BY_ID[line.id] = line;
    var race = RACES.filter(function (r) { return r.id === line.race; })[0];
    line.tiers.forEach(function (t, i) {
      var tier = i + 1;
      var attackType = (line.attackTypeByTier && line.attackTypeByTier[i]) || line.attackType;
      var def = {
        id: line.id + '_t' + tier,
        line: line.id,
        race: line.race,
        raceColor: race.color,
        raceAccent: race.accent,
        icon: line.icon,
        tier: tier,
        nameZh: t.nameZh,
        nameEn: t.nameEn,
        descZh: line.descZh,
        descEn: line.descEn,
        gold: t.gold,
        lumber: t.lumber || 0,
        dmgMin: t.dmg[0],
        dmgMax: t.dmg[1],
        range: t.range,
        cooldown: t.cd,
        attackType: attackType,
        targetsAir: Damage.canHitAir(attackType),
        splash: line.splash ? { radius: line.splash[i], near: 1.0, mid: 0.55, far: 0.28 } : null,
        effect: line.effects ? line.effects[i] : null,
        bonus: line.bonus || null,
        projectile: line.projectile,
        next: (tier < 3) ? (line.id + '_t' + (tier + 1)) : null,
        prev: (tier > 1) ? (line.id + '_t' + (tier - 1)) : null
      };
      def.dps = ((def.dmgMin + def.dmgMax) / 2) / def.cooldown;
      TOWERS[def.id] = def;
      TOWER_LIST.push(def);
    });
  });

  function byRace(raceId) {
    return TOWER_LIST.filter(function (d) { return d.race === raceId && d.tier === 1; });
  }

  var API = {
    RACES: RACES,
    LINES: LINES,
    TOWERS: TOWERS,
    TOWER_LIST: TOWER_LIST,
    byRace: byRace,
    get: function (id) { return TOWERS[id]; }
  };

  global.WC3.TowerData = API;

  if (typeof module === 'object' && module.exports) module.exports = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
