/* Tower catalogue: 4 races × 3 lines × 3 tiers = 36 buildings.
 * DOM-free. `gold`/`lumber` on tier N is the cost to REACH that tier
 * (T1 = build price, T2/T3 = upgrade price). Sell value = 75% of the sum. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});

  const RACES = [
    { id: 'human',  name: { zh: '人类王庭', en: 'Kingdom' },     color: '#6fa8dc', accent: '#dfe9f5', hotkey: '1' },
    { id: 'orc',    name: { zh: '兽人部族', en: 'Warband' },     color: '#c0704a', accent: '#f0c9a0', hotkey: '2' },
    { id: 'elf',    name: { zh: '月夜精灵', en: 'Moonwardens' }, color: '#8ad6b8', accent: '#d8fff0', hotkey: '3' },
    { id: 'undead', name: { zh: '不朽亡军', en: 'Deathless' },   color: '#a98cd8', accent: '#e6dcff', hotkey: '4' }
  ];

  function t(zh, en) { return { zh, en }; }

  /* Compact tier authoring helper. */
  function tier(o) { return o; }

  const LINES = [
    // ---------------------------------------------------------------- HUMAN
    {
      id: 'h_arrow', race: 'human', icon: 'arrow', hotkey: 'Q',
      name: t('箭塔序列', 'Guard Tower Line'),
      blurb: t('穿刺单体，射速快，可对空。克轻甲。', 'Fast single-target pierce. Hits air. Shreds light armour.'),
      tiers: [
        tier({
          name: t('哨戒箭塔', 'Guard Tower'), gold: 55, lumber: 0,
          damage: [11, 15], attackType: 'pierce', cooldown: 0.85, range: 6.2,
          targets: ['ground', 'air'], projectile: { kind: 'arrow', speed: 22, color: '#ffe9b0' }
        }),
        tier({
          name: t('精锐箭塔', 'Elven Guard Tower'), gold: 150, lumber: 0,
          damage: [30, 40], attackType: 'pierce', cooldown: 0.75, range: 6.8,
          targets: ['ground', 'air'], projectile: { kind: 'arrow', speed: 26, color: '#fff3c8' }
        }),
        tier({
          name: t('长弓要塞', 'Longbow Bastion'), gold: 380, lumber: 1,
          damage: [88, 116], attackType: 'pierce', cooldown: 0.62, range: 7.6,
          targets: ['ground', 'air'], crit: { chance: 0.2, mult: 2.0 },
          projectile: { kind: 'arrow', speed: 32, color: '#fffbe0' }
        })
      ]
    },
    {
      id: 'h_cannon', race: 'human', icon: 'cannon', hotkey: 'W',
      name: t('火炮序列', 'Cannon Line'),
      blurb: t('攻城溅射，只能打地面。克重甲建筑。', 'Siege splash, ground only. Excels versus fortified.'),
      tiers: [
        tier({
          name: t('火炮塔', 'Cannon Tower'), gold: 80, lumber: 0,
          damage: [18, 26], attackType: 'siege', cooldown: 1.5, range: 5.6,
          targets: ['ground'], splash: { full: 0.7, mid: 1.2, outer: 1.8 },
          projectile: { kind: 'ball', speed: 13, arc: 1.6, color: '#5b5b5b' }
        }),
        tier({
          name: t('攻城炮台', 'Siege Battery'), gold: 200, lumber: 0,
          damage: [52, 72], attackType: 'siege', cooldown: 1.4, range: 6.0,
          targets: ['ground'], splash: { full: 0.85, mid: 1.45, outer: 2.1 },
          projectile: { kind: 'ball', speed: 14, arc: 1.7, color: '#4a4a4a' }
        }),
        tier({
          name: t('皇家臼炮', 'Royal Mortar'), gold: 480, lumber: 1,
          damage: [150, 206], attackType: 'siege', cooldown: 1.3, range: 7.2,
          targets: ['ground'], splash: { full: 1.1, mid: 1.9, outer: 2.8 },
          bonusVsArmor: { fortified: 30 },
          projectile: { kind: 'ball', speed: 15, arc: 2.0, color: '#3b3b3b' }
        })
      ]
    },
    {
      id: 'h_arcane', race: 'human', icon: 'arcane', hotkey: 'E',
      name: t('奥术序列', 'Arcane Line'),
      blurb: t('魔法伤害并减速，可对空。克重甲。', 'Magic damage that slows. Hits air. Strong versus heavy.'),
      tiers: [
        tier({
          name: t('奥术塔', 'Arcane Tower'), gold: 80, lumber: 0,
          damage: [14, 18], attackType: 'magic', cooldown: 1.0, range: 6.0,
          targets: ['ground', 'air'], effects: [{ type: 'slow', amount: 0.25, duration: 2.0 }],
          projectile: { kind: 'orb', speed: 17, color: '#9fd6ff' }
        }),
        tier({
          name: t('秘法尖塔', 'Sorcerer Spire'), gold: 210, lumber: 0,
          damage: [38, 50], attackType: 'magic', cooldown: 0.95, range: 6.5,
          targets: ['ground', 'air'], effects: [{ type: 'slow', amount: 0.35, duration: 2.5 }],
          projectile: { kind: 'orb', speed: 19, color: '#bfe6ff' }
        }),
        tier({
          name: t('大魔导师圣殿', 'Archmage Sanctum'), gold: 500, lumber: 1,
          damage: [110, 144], attackType: 'magic', cooldown: 0.9, range: 7.2,
          targets: ['ground', 'air'], effects: [{ type: 'slow', amount: 0.5, duration: 3.0 }],
          splash: { full: 0.6, mid: 1.0, outer: 1.5 },
          projectile: { kind: 'orb', speed: 21, color: '#e2f4ff' }
        })
      ]
    },

    // ------------------------------------------------------------------ ORC
    {
      id: 'o_watch', race: 'orc', icon: 'axe', hotkey: 'Q',
      name: t('瞭望序列', 'Watch Tower Line'),
      blurb: t('普通攻击重击，只能打地面。克中甲。', 'Heavy normal hits, ground only. Great versus medium armour.'),
      tiers: [
        tier({
          name: t('兽人瞭望塔', 'Watch Tower'), gold: 50, lumber: 0,
          damage: [16, 22], attackType: 'normal', cooldown: 1.05, range: 5.4,
          targets: ['ground'], projectile: { kind: 'spear', speed: 18, color: '#d9b382' }
        }),
        tier({
          name: t('战争之塔', 'War Tower'), gold: 145, lumber: 0,
          damage: [48, 64], attackType: 'normal', cooldown: 1.0, range: 5.8,
          targets: ['ground'], projectile: { kind: 'spear', speed: 20, color: '#e0bd8c' }
        }),
        tier({
          name: t('血吼堡垒', 'Bloodroar Fortress'), gold: 400, lumber: 1,
          damage: [150, 200], attackType: 'normal', cooldown: 0.95, range: 6.4,
          targets: ['ground'], crit: { chance: 0.22, mult: 2.2 },
          projectile: { kind: 'spear', speed: 24, color: '#f0cd9c' }
        })
      ]
    },
    {
      id: 'o_troll', race: 'orc', icon: 'spear', hotkey: 'W',
      name: t('巨魔序列', 'Troll Burrow Line'),
      blurb: t('穿刺毒素，射速极快，可对空。', 'Rapid pierce with stacking poison. Hits air.'),
      tiers: [
        tier({
          name: t('巨魔箭巢', 'Troll Burrow'), gold: 65, lumber: 0,
          damage: [9, 13], attackType: 'pierce', cooldown: 0.7, range: 6.0,
          targets: ['ground', 'air'], effects: [{ type: 'poison', dps: 6, duration: 3 }],
          projectile: { kind: 'dart', speed: 24, color: '#a8d07a' }
        }),
        tier({
          name: t('猎头者巢穴', 'Headhunter Nest'), gold: 180, lumber: 0,
          damage: [26, 34], attackType: 'pierce', cooldown: 0.65, range: 6.4,
          targets: ['ground', 'air'],
          effects: [{ type: 'poison', dps: 22, duration: 4 }, { type: 'slow', amount: 0.15, duration: 2 }],
          projectile: { kind: 'dart', speed: 27, color: '#9ad06a' }
        }),
        tier({
          name: t('瘟疫蝠巢', 'Plaguebat Roost'), gold: 430, lumber: 1,
          damage: [72, 96], attackType: 'pierce', cooldown: 0.6, range: 7.0,
          targets: ['ground', 'air'],
          effects: [{ type: 'poison', dps: 78, duration: 5 }, { type: 'slow', amount: 0.25, duration: 2.5 }],
          projectile: { kind: 'dart', speed: 30, color: '#8ce05a' }
        })
      ]
    },
    {
      id: 'o_spirit', race: 'orc', icon: 'totem', hotkey: 'E',
      name: t('灵魂序列', 'Spirit Lodge Line'),
      blurb: t('闪电连锁，跳跃衰减，可对空。', 'Chain lightning that arcs between targets. Hits air.'),
      tiers: [
        tier({
          name: t('灵魂小屋', 'Spirit Lodge'), gold: 85, lumber: 0,
          damage: [15, 21], attackType: 'magic', cooldown: 1.2, range: 5.8,
          targets: ['ground', 'air'], chain: { bounces: 2, range: 3.0, decay: 0.75 },
          projectile: { kind: 'bolt', speed: 30, color: '#9ad8ff' }
        }),
        tier({
          name: t('先知图腾', 'Farseer Totem'), gold: 230, lumber: 0,
          damage: [42, 56], attackType: 'magic', cooldown: 1.1, range: 6.2,
          targets: ['ground', 'air'], chain: { bounces: 3, range: 3.4, decay: 0.8 },
          projectile: { kind: 'bolt', speed: 34, color: '#b6e5ff' }
        }),
        tier({
          name: t('雷霆图腾', 'Thunderlord Totem'), gold: 520, lumber: 1,
          damage: [118, 152], attackType: 'magic', cooldown: 1.0, range: 6.8,
          targets: ['ground', 'air'], chain: { bounces: 5, range: 3.8, decay: 0.85 },
          projectile: { kind: 'bolt', speed: 40, color: '#dff3ff' }
        })
      ]
    },

    // ------------------------------------------------------------ NIGHT ELF
    {
      id: 'e_ancient', race: 'elf', icon: 'tree', hotkey: 'Q',
      name: t('远古序列', 'Ancient Protector Line'),
      blurb: t('普通攻击并有概率缠绕定身，只能打地面。', 'Normal damage with a chance to root. Ground only.'),
      tiers: [
        tier({
          name: t('远古守护者', 'Ancient Protector'), gold: 65, lumber: 0,
          damage: [20, 26], attackType: 'normal', cooldown: 1.2, range: 5.2,
          targets: ['ground'], effects: [{ type: 'root', chance: 0.12, duration: 0.8 }],
          projectile: { kind: 'thorn', speed: 19, color: '#c8e6a0' }
        }),
        tier({
          name: t('战争古树', 'Ancient of War'), gold: 175, lumber: 0,
          damage: [58, 76], attackType: 'normal', cooldown: 1.15, range: 5.6,
          targets: ['ground'], effects: [{ type: 'root', chance: 0.18, duration: 1.1 }],
          projectile: { kind: 'thorn', speed: 21, color: '#b8e68a' }
        }),
        tier({
          name: t('世界树守卫', 'Worldtree Warden'), gold: 440, lumber: 1,
          damage: [170, 220], attackType: 'normal', cooldown: 1.1, range: 6.2,
          targets: ['ground'], effects: [{ type: 'root', chance: 0.25, duration: 1.6 }],
          projectile: { kind: 'thorn', speed: 24, color: '#a8f07a' }
        })
      ]
    },
    {
      id: 'e_chimaera', race: 'elf', icon: 'acid', hotkey: 'W',
      name: t('奇美拉序列', 'Chimaera Roost Line'),
      blurb: t('酸液攻城溅射并附带腐蚀，只能打地面。', 'Acid siege splash with corrosion. Ground only.'),
      tiers: [
        tier({
          name: t('奇美拉巢穴', 'Chimaera Roost'), gold: 85, lumber: 0,
          damage: [20, 28], attackType: 'siege', cooldown: 1.45, range: 5.8,
          targets: ['ground'], splash: { full: 0.75, mid: 1.3, outer: 1.9 },
          effects: [{ type: 'poison', dps: 5, duration: 3 }],
          projectile: { kind: 'acid', speed: 15, arc: 1.4, color: '#b6f06a' }
        }),
        tier({
          name: t('酸液巢穴', 'Corrosive Roost'), gold: 220, lumber: 0,
          damage: [58, 78], attackType: 'siege', cooldown: 1.35, range: 6.2,
          targets: ['ground'], splash: { full: 0.9, mid: 1.5, outer: 2.2 },
          effects: [{ type: 'poison', dps: 20, duration: 4 }],
          projectile: { kind: 'acid', speed: 16, arc: 1.5, color: '#a4f050' }
        }),
        tier({
          name: t('双头巨兽巢', 'Twinmaw Aerie'), gold: 510, lumber: 1,
          damage: [162, 214], attackType: 'siege', cooldown: 1.25, range: 6.9,
          targets: ['ground'], splash: { full: 1.15, mid: 1.95, outer: 2.9 },
          effects: [{ type: 'poison', dps: 70, duration: 5 }],
          projectile: { kind: 'acid', speed: 17, arc: 1.6, color: '#8cf03c' }
        })
      ]
    },
    {
      id: 'e_moon', race: 'elf', icon: 'moon', hotkey: 'E',
      name: t('月神序列', 'Moon Well Line'),
      blurb: t('星辰魔法，同时锁定多个目标，可对空。', 'Star magic that strikes several targets at once. Hits air.'),
      tiers: [
        tier({
          name: t('月亮井', 'Moon Well'), gold: 75, lumber: 0,
          damage: [13, 19], attackType: 'magic', cooldown: 0.95, range: 6.2,
          targets: ['ground', 'air'], multishot: 1,
          projectile: { kind: 'star', speed: 20, color: '#cfe9ff' }
        }),
        tier({
          name: t('星辰祭坛', 'Starfall Altar'), gold: 205, lumber: 0,
          damage: [40, 52], attackType: 'magic', cooldown: 0.9, range: 6.6,
          targets: ['ground', 'air'], multishot: 2,
          projectile: { kind: 'star', speed: 22, color: '#e0f0ff' }
        }),
        tier({
          name: t('艾露恩神殿', 'Temple of the Moon'), gold: 495, lumber: 1,
          damage: [112, 148], attackType: 'magic', cooldown: 0.85, range: 7.4,
          targets: ['ground', 'air'], multishot: 3,
          splash: { full: 0.6, mid: 1.1, outer: 1.6 },
          projectile: { kind: 'star', speed: 25, color: '#f2f8ff' }
        })
      ]
    },

    // --------------------------------------------------------------- UNDEAD
    {
      id: 'u_spirit', race: 'undead', icon: 'ghost', hotkey: 'Q',
      name: t('幽魂序列', 'Spirit Tower Line'),
      blurb: t('远程穿刺，射程最远，可对空。', 'Long-ranged pierce. Hits air.'),
      tiers: [
        tier({
          name: t('幽魂塔', 'Spirit Tower'), gold: 60, lumber: 0,
          damage: [12, 16], attackType: 'pierce', cooldown: 0.9, range: 6.4,
          targets: ['ground', 'air'], projectile: { kind: 'soul', speed: 21, color: '#b9ffe6' }
        }),
        tier({
          name: t('尖啸之塔', 'Shrieking Tower'), gold: 160, lumber: 0,
          damage: [33, 43], attackType: 'pierce', cooldown: 0.8, range: 6.9,
          targets: ['ground', 'air'], projectile: { kind: 'soul', speed: 24, color: '#c8fff0' }
        }),
        tier({
          name: t('冥狱之塔', 'Damnation Spire'), gold: 395, lumber: 1,
          damage: [95, 125], attackType: 'pierce', cooldown: 0.7, range: 7.7,
          targets: ['ground', 'air'], projectile: { kind: 'soul', speed: 28, color: '#e0fff8' }
        })
      ]
    },
    {
      id: 'u_zigg', race: 'undead', icon: 'web', hotkey: 'W',
      name: t('蛛族序列', 'Arachnid Ziggurat Line'),
      blurb: t('蛛网减速；有概率把飞行单位拉到地面。', 'Webs slow, and can drag flyers to the ground.'),
      tiers: [
        tier({
          name: t('蛛族神庙', 'Arachnid Ziggurat'), gold: 80, lumber: 0,
          damage: [14, 20], attackType: 'magic', cooldown: 1.05, range: 6.0,
          targets: ['ground', 'air'],
          effects: [{ type: 'slow', amount: 0.2, duration: 2.0 }, { type: 'web', chance: 0.25, duration: 1.5 }],
          projectile: { kind: 'web', speed: 18, color: '#dcd3ff' }
        }),
        tier({
          name: t('蛛网高塔', 'Silkweb Spire'), gold: 215, lumber: 0,
          damage: [40, 54], attackType: 'magic', cooldown: 1.0, range: 6.5,
          targets: ['ground', 'air'],
          effects: [{ type: 'slow', amount: 0.3, duration: 2.5 }, { type: 'web', chance: 0.4, duration: 2.0 }],
          projectile: { kind: 'web', speed: 20, color: '#e6dfff' }
        }),
        tier({
          name: t('蛛后圣殿', 'Broodmother Sanctum'), gold: 505, lumber: 1,
          damage: [118, 154], attackType: 'magic', cooldown: 0.95, range: 7.1,
          targets: ['ground', 'air'],
          effects: [{ type: 'slow', amount: 0.45, duration: 3.0 }, { type: 'web', chance: 0.6, duration: 3.0 }],
          projectile: { kind: 'web', speed: 22, color: '#f2eeff' }
        })
      ]
    },
    {
      id: 'u_meat', race: 'undead', icon: 'meat', hotkey: 'E',
      name: t('绞肉序列', 'Slaughterhouse Line'),
      blurb: t('攻城溅射，对重甲/加固护甲有额外加成。', 'Siege splash with flat bonus damage versus heavy and fortified.'),
      tiers: [
        tier({
          name: t('屠宰场', 'Slaughterhouse'), gold: 80, lumber: 0,
          damage: [17, 25], attackType: 'siege', cooldown: 1.5, range: 5.5,
          targets: ['ground'], splash: { full: 0.7, mid: 1.25, outer: 1.85 },
          bonusVsArmor: { heavy: 6, fortified: 8 },
          projectile: { kind: 'corpse', speed: 12, arc: 1.8, color: '#9a6a5a' }
        }),
        tier({
          name: t('腐尸投石车', 'Rotting Trebuchet'), gold: 215, lumber: 0,
          damage: [50, 70], attackType: 'siege', cooldown: 1.4, range: 6.0,
          targets: ['ground'], splash: { full: 0.9, mid: 1.5, outer: 2.2 },
          bonusVsArmor: { heavy: 18, fortified: 24 },
          projectile: { kind: 'corpse', speed: 13, arc: 1.9, color: '#8a5f52' }
        }),
        tier({
          name: t('瘟疫绞肉机', 'Plague Grinder'), gold: 500, lumber: 1,
          damage: [145, 195], attackType: 'siege', cooldown: 1.3, range: 7.0,
          targets: ['ground'], splash: { full: 1.1, mid: 1.9, outer: 2.85 },
          bonusVsArmor: { heavy: 55, fortified: 75 },
          effects: [{ type: 'poison', dps: 40, duration: 4 }],
          projectile: { kind: 'corpse', speed: 14, arc: 2.0, color: '#7a5045' }
        })
      ]
    }
  ];

  // ---- index build -------------------------------------------------------
  const TOWERS = {};
  const LINE_BY_ID = {};
  LINES.forEach((line) => {
    LINE_BY_ID[line.id] = line;
    let investGold = 0, investLumber = 0;
    line.tiers.forEach((tw, i) => {
      investGold += tw.gold;
      investLumber += tw.lumber || 0;
      tw.id = line.id + '_t' + (i + 1);
      tw.line = line.id;
      tw.race = line.race;
      tw.tier = i + 1;
      tw.icon = line.icon;
      tw.lumber = tw.lumber || 0;
      tw.targets = tw.targets || ['ground'];
      tw.effects = tw.effects || [];
      tw.multishot = tw.multishot || 1;
      tw.bonusVsArmor = tw.bonusVsArmor || null;
      tw.splash = tw.splash || null;
      tw.chain = tw.chain || null;
      tw.crit = tw.crit || null;
      const power = NS.Config.balance.towerDamage;
      tw.damage = [tw.damage[0] * power, tw.damage[1] * power];
      tw.investedGold = investGold;
      tw.investedLumber = investLumber;
      tw.next = i < line.tiers.length - 1 ? line.id + '_t' + (i + 2) : null;
      tw.prev = i > 0 ? line.id + '_t' + i : null;
      tw.avgDamage = (tw.damage[0] + tw.damage[1]) / 2;
      tw.dps = tw.avgDamage / tw.cooldown * (tw.crit ? (1 + tw.crit.chance * (tw.crit.mult - 1)) : 1) * tw.multishot;
      TOWERS[tw.id] = tw;
    });
  });

  function linesOfRace(raceId) { return LINES.filter((l) => l.race === raceId); }
  function get(id) { return TOWERS[id]; }
  function canTargetAir(def) {
    return def.targets.indexOf('air') !== -1 && NS.DamageTable.attackTypeHitsAir(def.attackType);
  }
  function sellValue(def) {
    return Math.floor(def.investedGold * (NS.Config ? NS.Config.sellRatio : 0.75));
  }

  NS.TowerData = { RACES, LINES, TOWERS, LINE_BY_ID, linesOfRace, get, canTargetAir, sellValue };
})(typeof globalThis !== 'undefined' ? globalThis : this);
