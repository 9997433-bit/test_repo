/**
 * Static game data: strings, towers, heroes, waves, map path.
 */
(function (root) {
  "use strict";
  const S = root.SimCore;

  const STR = {
    zh: {
      title: "艾泽拉斯要塞塔防",
      subtitle: "魔兽争霸 III · 自定义塔防致敬作",
      start: "开始战役",
      resume: "继续",
      difficulty: "难度",
      hero: "指挥官",
      easy: "简单",
      normal: "普通",
      hard: "困难",
      insane: "疯狂",
      gold: "黄金",
      lumber: "木材",
      food: "人口 / 生命",
      menu: "菜单",
      allies: "盟友",
      log: "日志",
      settings: "设置",
      pause: "暂停",
      speed: "速度",
      nextWave: "下一波",
      sell: "出售",
      upgrade: "升级",
      build: "建造",
      victory: "胜利！天灾被击退了。",
      defeat: "失败……要塞陷落。",
      restart: "再来一局",
      lang: "语言",
      dmgNumbers: "伤害数字",
      showRange: "显示射程",
      volume: "音量",
      wave: "波次",
      idle: "空闲工人",
      pickHero: "选择英雄",
      paladin: "圣骑士",
      blademaster: "剑圣",
      demonhunter: "恶魔猎手",
      deathknight: "死亡骑士",
      howTo: "在道路旁建造防御塔，阻止从黑暗之门涌出的敌军。漏怪会扣除生命。每 5 波获得 1 木材。黄金会每 15 秒产生利息。",
      human: "人类",
      orc: "兽族",
      nightelf: "暗夜精灵",
      undead: "亡灵",
    },
    en: {
      title: "Azeroth Keep TD",
      subtitle: "A Warcraft III custom-TD tribute",
      start: "Begin Campaign",
      resume: "Resume",
      difficulty: "Difficulty",
      hero: "Commander",
      easy: "Easy",
      normal: "Normal",
      hard: "Hard",
      insane: "Insane",
      gold: "Gold",
      lumber: "Lumber",
      food: "Food / Lives",
      menu: "Menu",
      allies: "Allies",
      log: "Log",
      settings: "Settings",
      pause: "Pause",
      speed: "Speed",
      nextWave: "Next Wave",
      sell: "Sell",
      upgrade: "Upgrade",
      build: "Build",
      victory: "Victory! The invasion is broken.",
      defeat: "Defeat… the keep has fallen.",
      restart: "Play Again",
      lang: "Language",
      dmgNumbers: "Damage numbers",
      showRange: "Show range",
      volume: "Volume",
      wave: "Wave",
      idle: "Idle",
      pickHero: "Choose Hero",
      paladin: "Paladin",
      blademaster: "Blademaster",
      demonhunter: "Demon Hunter",
      deathknight: "Death Knight",
      howTo: "Build towers beside the road. Leaks cost lives. +1 lumber every 5 waves. Gold earns interest every 15s.",
      human: "Human",
      orc: "Orc",
      nightelf: "Night Elf",
      undead: "Undead",
    },
  };

  const TILE = 48;
  const MAP_W = 24;
  const MAP_H = 16;

  // Winding dirt road in tile centers (classic WC3 TD lane).
  const PATH_TILES = [
    [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3],
    [6, 4], [6, 5], [6, 6], [6, 7], [6, 8],
    [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8],
    [12, 7], [12, 6], [12, 5], [12, 4], [12, 3], [12, 2],
    [13, 2], [14, 2], [15, 2], [16, 2], [17, 2],
    [17, 3], [17, 4], [17, 5], [17, 6], [17, 7], [17, 8], [17, 9], [17, 10],
    [16, 10], [15, 10], [14, 10], [13, 10], [12, 10], [11, 10], [10, 10],
    [10, 11], [10, 12], [10, 13],
    [11, 13], [12, 13], [13, 13], [14, 13], [15, 13], [16, 13], [17, 13],
    [18, 13], [19, 13], [20, 13], [21, 13], [22, 13], [23, 13],
  ];

  function pathPoints() {
    return PATH_TILES.map(function (t) {
      return { x: t[0] * TILE + TILE / 2, y: t[1] * TILE + TILE / 2 };
    });
  }

  function pathSet() {
    const set = Object.create(null);
    PATH_TILES.forEach(function (t) {
      set[t[0] + "," + t[1]] = true;
    });
    return set;
  }

  const TOWERS = [
    { id: "h_guard", race: "human", line: 0, name: { zh: "哨塔", en: "Guard Tower" },
      attackType: "pierce", canHitFlying: true, splash: 0, cost: [70, 110, 180],
      dmg: [9, 16, 28], rate: [0.7, 0.65, 0.55], range: [140, 155, 170], armor: 4,
      color: "#6aa4e8", desc: { zh: "穿刺箭矢，克制轻甲与无甲。", en: "Pierce arrows. Strong vs light/unarmored." } },
    { id: "h_cannon", race: "human", line: 1, name: { zh: "炮塔", en: "Cannon Tower" },
      attackType: "siege", canHitFlying: false, splash: 48, cost: [110, 170, 260],
      dmg: [18, 32, 54], rate: [1.15, 1.05, 0.95], range: [130, 140, 155], armor: 6,
      color: "#c4a35a", desc: { zh: "攻城溅射，克制城甲。无法打空中。", en: "Siege splash vs fortified. Cannot hit air." } },
    { id: "h_arcane", race: "human", line: 2, name: { zh: "奥术塔", en: "Arcane Tower" },
      attackType: "magic", canHitFlying: true, splash: 0, slow: 0.25, cost: [95, 150, 230],
      dmg: [11, 20, 34], rate: [0.85, 0.75, 0.65], range: [135, 150, 165], armor: 3,
      color: "#7ec8ff", desc: { zh: "魔法攻击并减速，克制重甲。", en: "Magic + slow. Strong vs heavy." } },
    { id: "o_watch", race: "orc", line: 0, name: { zh: "了望塔", en: "Watch Tower" },
      attackType: "normal", canHitFlying: false, splash: 0, cost: [65, 100, 160],
      dmg: [12, 21, 36], rate: [0.8, 0.72, 0.62], range: [125, 140, 155], armor: 5,
      color: "#c45a2a", desc: { zh: "普通攻击，克制中甲。", en: "Normal attacks. Strong vs medium." } },
    { id: "o_burrow", race: "orc", line: 1, name: { zh: "巨魔地洞", en: "Troll Burrow" },
      attackType: "pierce", canHitFlying: true, splash: 0, poison: 4, cost: [90, 145, 220],
      dmg: [8, 14, 24], rate: [0.6, 0.52, 0.44], range: [145, 160, 175], armor: 4,
      color: "#8bc34a", desc: { zh: "毒矛穿刺，可打飞空。", en: "Poison pierce spears. Hits air." } },
    { id: "o_spirit", race: "orc", line: 2, name: { zh: "灵魂塔", en: "Spirit Lodge" },
      attackType: "magic", canHitFlying: true, chain: 3, cost: [120, 190, 280],
      dmg: [10, 17, 29], rate: [1.0, 0.9, 0.8], range: [130, 145, 160], armor: 3,
      color: "#b388ff", desc: { zh: "闪电链，弹跳 3 个目标。", en: "Chain lightning, 3 bounces." } },
    { id: "n_ancient", race: "nightelf", line: 0, name: { zh: "远古守护者", en: "Ancient Protector" },
      attackType: "normal", canHitFlying: false, root: 0.6, cost: [80, 125, 200],
      dmg: [14, 24, 40], rate: [1.05, 0.95, 0.85], range: [120, 135, 150], armor: 8,
      color: "#5d8a4a", desc: { zh: "投石并短暂定身。", en: "Rocks that root briefly." } },
    { id: "n_chimaera", race: "nightelf", line: 1, name: { zh: "奇美拉栖木", en: "Chimaera Roost" },
      attackType: "siege", canHitFlying: true, splash: 40, poison: 3, cost: [130, 200, 300],
      dmg: [16, 28, 46], rate: [1.2, 1.1, 1.0], range: [150, 165, 180], armor: 4,
      color: "#9ccc65", desc: { zh: "腐蚀吐息，对城甲特效且可打空。", en: "Corrosive siege breath, hits air." } },
    { id: "n_moon", race: "nightelf", line: 2, name: { zh: "月井炮台", en: "Moonwell Battery" },
      attackType: "magic", canHitFlying: true, splash: 0, cost: [100, 160, 240],
      dmg: [13, 22, 38], rate: [0.75, 0.68, 0.58], range: [140, 155, 170], armor: 3,
      color: "#81d4fa", desc: { zh: "星光箭，高速魔法。", en: "Starbolts. Fast magic." } },
    { id: "u_spirit", race: "undead", line: 0, name: { zh: "幽魂之塔", en: "Spirit Tower" },
      attackType: "pierce", canHitFlying: true, splash: 0, cost: [75, 120, 190],
      dmg: [10, 18, 30], rate: [0.65, 0.58, 0.5], range: [135, 150, 165], armor: 5,
      color: "#80deea", desc: { zh: "幽魂穿刺，克制轻甲。", en: "Ghost pierce. Strong vs light." } },
    { id: "u_zig", race: "undead", line: 1, name: { zh: "蛛网通灵塔", en: "Nerubian Ziggurat" },
      attackType: "magic", canHitFlying: true, slow: 0.35, cost: [105, 165, 250],
      dmg: [9, 16, 27], rate: [0.9, 0.8, 0.7], range: [130, 145, 160], armor: 6,
      color: "#4dd0e1", desc: { zh: "蛛网减速，魔法伤害。", en: "Web slow + magic." } },
    { id: "u_wagon", race: "undead", line: 2, name: { zh: "绞肉车炮", en: "Meat Wagon" },
      attackType: "siege", canHitFlying: false, splash: 56, cost: [125, 195, 290],
      dmg: [20, 36, 60], rate: [1.25, 1.15, 1.05], range: [145, 160, 175], armor: 5,
      color: "#8d6e63", desc: { zh: "腐尸溅射，克制城甲与重甲。", en: "Disease splash vs fort/heavy." } },
  ];

  const HEROES = [
    { id: "paladin", name: { zh: "乌瑟尔", en: "Uther" }, title: { zh: "圣骑士", en: "Paladin" },
      color: "#f5e6a8", attackType: "hero", dmg: 22, rate: 0.85, range: 90, hp: 420, mana: 180,
      q: { zh: "圣光术", en: "Holy Light", mana: 40, cd: 8, dmg: 90 },
      w: { zh: "虔诚光环", en: "Devotion Aura", mana: 0, cd: 0, aura: 4 },
      e: { zh: "神圣护盾", en: "Divine Shield", mana: 50, cd: 20, dur: 4 } },
    { id: "blademaster", name: { zh: "格罗玛什", en: "Grom" }, title: { zh: "剑圣", en: "Blademaster" },
      color: "#e07030", attackType: "hero", dmg: 28, rate: 0.7, range: 70, hp: 380, mana: 140,
      q: { zh: "致命一击", en: "Crit Stance", mana: 25, cd: 6, crit: 2.2 },
      w: { zh: "镜像", en: "Mirror Image", mana: 35, cd: 14, dur: 6 },
      e: { zh: "疾步风", en: "Wind Walk", mana: 30, cd: 12, dur: 3 } },
    { id: "demonhunter", name: { zh: "伊利丹", en: "Illidan" }, title: { zh: "恶魔猎手", en: "Demon Hunter" },
      color: "#7e57c2", attackType: "hero", dmg: 26, rate: 0.72, range: 75, hp: 360, mana: 200,
      q: { zh: "法力燃烧", en: "Mana Burn", mana: 20, cd: 7, dmg: 70 },
      w: { zh: "献祭", en: "Immolation", mana: 8, cd: 1, aura: 8 },
      e: { zh: "变身", en: "Metamorphosis", mana: 80, cd: 24, dur: 8 } },
    { id: "deathknight", name: { zh: "阿尔萨斯", en: "Arthas" }, title: { zh: "死亡骑士", en: "Death Knight" },
      color: "#90caf9", attackType: "hero", dmg: 24, rate: 0.8, range: 80, hp: 400, mana: 190,
      q: { zh: "死亡缠绕", en: "Death Coil", mana: 35, cd: 7, dmg: 85 },
      w: { zh: "邪恶光环", en: "Unholy Aura", mana: 0, cd: 0, aura: 0.18 },
      e: { zh: "亡者复生", en: "Animate Dead", mana: 60, cd: 22, dur: 6 } },
  ];

  const CREEP_ARCH = [
    { key: "footman", name: { zh: "步兵", en: "Footman" }, armorType: "heavy", armor: 2, flying: false, speed: 46, color: "#6a8cbf" },
    { key: "grunt", name: { zh: "步兵（兽族）", en: "Grunt" }, armorType: "heavy", armor: 3, flying: false, speed: 44, color: "#b5522a" },
    { key: "ghoul", name: { zh: "食尸鬼", en: "Ghoul" }, armorType: "light", armor: 0, flying: false, speed: 58, color: "#8d9e6a" },
    { key: "huntress", name: { zh: "女猎手", en: "Huntress" }, armorType: "unarmored", armor: 1, flying: false, speed: 54, color: "#5a7a4a" },
    { key: "catapult", name: { zh: "投石车", en: "Catapult" }, armorType: "fortified", armor: 4, flying: false, speed: 32, color: "#6d5c45" },
    { key: "wyvern", name: { zh: "双足飞龙", en: "Wyvern" }, armorType: "light", armor: 1, flying: true, speed: 62, color: "#7cb342" },
    { key: "gargoyle", name: { zh: "石像鬼", en: "Gargoyle" }, armorType: "medium", armor: 3, flying: true, speed: 56, color: "#78909c" },
    { key: "acolyte", name: { zh: "侍僧", en: "Acolyte" }, armorType: "unarmored", armor: 0, flying: false, speed: 48, color: "#b0bec5" },
    { key: "knight", name: { zh: "骑士", en: "Knight" }, armorType: "heavy", armor: 5, flying: false, speed: 50, color: "#c0c8d8" },
    { key: "ancient", name: { zh: "远古树魔", en: "Ancient" }, armorType: "fortified", armor: 6, flying: false, spellImmune: true, speed: 28, color: "#33691e" },
    { key: "doom", name: { zh: "末日守卫", en: "Doom Guard" }, armorType: "heavy", armor: 5, flying: false, speed: 40, color: "#4a148c" },
    { key: "infernal", name: { zh: "地狱火", en: "Infernal" }, armorType: "hero", armor: 6, flying: false, speed: 36, color: "#1b5e20" },
  ];

  function arch(key) {
    for (let i = 0; i < CREEP_ARCH.length; i++) if (CREEP_ARCH[i].key === key) return CREEP_ARCH[i];
    return CREEP_ARCH[0];
  }

  function makeWaves() {
    const plan = [];
    const seq = [
      ["footman", 8], ["ghoul", 10], ["grunt", 10], ["huntress", 12], ["footman", 14],
      ["knight", 6], ["wyvern", 8], ["catapult", 6], ["gargoyle", 10], ["doom", 4],
      ["acolyte", 16], ["grunt", 16], ["wyvern", 12], ["ancient", 5], ["infernal", 2],
      ["huntress", 18], ["catapult", 10], ["gargoyle", 14], ["knight", 12], ["doom", 6],
      ["wyvern", 16], ["ancient", 7], ["footman", 22], ["ghoul", 24], ["infernal", 3],
      ["catapult", 14], ["gargoyle", 18], ["doom", 8], ["ancient", 8], ["infernal", 5],
    ];
    for (let i = 0; i < 30; i++) {
      const pair = seq[i];
      const a = arch(pair[0]);
      const n = pair[1] + Math.floor(i / 6);
      const boss = (i + 1) % 5 === 0;
      const hp = 28 + i * 18 + (boss ? 220 + i * 20 : 0);
      const bounty = 4 + Math.floor(i / 2) + (boss ? 18 : 0);
      plan.push({
        index: i + 1,
        boss: boss,
        count: boss ? Math.max(1, Math.floor(n / 3)) : n,
        hp: hp,
        bounty: bounty,
        armor: a.armor + Math.floor(i / 10),
        armorType: boss && i >= 24 ? "hero" : a.armorType,
        flying: a.flying,
        spellImmune: !!a.spellImmune || (boss && i === 19),
        speed: a.speed,
        color: a.color,
        name: a.name,
        key: a.key,
      });
    }
    return plan;
  }

  root.GameData = {
    STR: STR,
    TILE: TILE,
    MAP_W: MAP_W,
    MAP_H: MAP_H,
    PATH_TILES: PATH_TILES,
    pathPoints: pathPoints,
    pathSet: pathSet,
    TOWERS: TOWERS,
    HEROES: HEROES,
    CREEP_ARCH: CREEP_ARCH,
    makeWaves: makeWaves,
    towerById: function (id) {
      for (let i = 0; i < TOWERS.length; i++) if (TOWERS[i].id === id) return TOWERS[i];
      return null;
    },
    heroById: function (id) {
      for (let i = 0; i < HEROES.length; i++) if (HEROES[i].id === id) return HEROES[i];
      return null;
    },
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
