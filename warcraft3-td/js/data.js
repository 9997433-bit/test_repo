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
      lumberShop: "伐木场升级",
      bossIncoming: "首领来袭",
      counter: "建议",
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
      lumberShop: "Lumber Mill Upgrades",
      bossIncoming: "Boss Incoming",
      counter: "Counter",
    },
  };

  // Templated log/announcement lines. `{token}` slots are filled by msg().
  const MSG = {
    opening: {
      zh: "黑暗之门开始集结……第 1 波：{name}。",
      en: "A pack gathers at the dark portal… Wave 1: {name}.",
    },
    waveStart: {
      zh: "第 {n}/{total} 波：{name} ×{count} · {armor}甲{fly} · 建议 {counter}",
      en: "Wave {n}/{total}: {count}× {name} · {armor} armor{fly} · counter with {counter}",
    },
    waveCleared: {
      zh: "第 {n} 波肃清。{secs} 秒后下一波。",
      en: "Wave {n} cleared. Next in {secs}s.",
    },
    waveNext: {
      zh: "下一波预告：{name} ×{count}（{armor}甲{fly}）",
      en: "Up next: {count}× {name} ({armor} armor{fly})",
    },
    bossFar: {
      zh: "★ 侦察兵报告：{waves} 波后 {name} 将降临，携带「{ability}」。",
      en: "★ Scouts report: {name} arrives in {waves} waves, wielding {ability}.",
    },
    bossSoon: {
      zh: "★ 黑暗之门剧烈震颤——{name} 即将穿越！",
      en: "★ The dark portal shudders — {name} is coming through!",
    },
    bossCountdown: {
      zh: "★ {secs} 秒后首领入场，做好准备！",
      en: "★ Boss enters in {secs}s — brace yourselves!",
    },
    bossWave: {
      zh: "★ 首领战 · {name}（{hp} 生命 · {armor}甲） — {ability}",
      en: "★ BOSS · {name} ({hp} HP · {armor} armor) — {ability}",
    },
    bossSpawn: {
      zh: "★ {name} 踏入战场！",
      en: "★ {name} strides onto the field!",
    },
    bossEnrage: {
      zh: "★ {name} 陷入狂暴，移动速度提升！",
      en: "★ {name} enrages and picks up speed!",
    },
    bossStompWarn: {
      zh: "★ {name} 高举武器——战争践踏即将落下！",
      en: "★ {name} raises its weapon — War Stomp incoming!",
    },
    bossStomp: {
      zh: "★ 战争践踏！{n} 座防御塔被震晕。",
      en: "★ War Stomp! {n} tower(s) stunned.",
    },
    countdown: {
      zh: "下一波 {secs} 秒后出发。",
      en: "Next wave in {secs}s.",
    },
    interest: { zh: "金库利息 +{gold}", en: "Treasury interest +{gold}" },
    lumberGain: { zh: "伐木场送来 1 木材（共 {total}）", en: "+1 lumber from the mill (total {total})" },
    lumberBuy: { zh: "木材升级：{name} Lv{level} — {effect}", en: "Lumber upgrade: {name} Lv{level} — {effect}" },
    lumberDenied: { zh: "木材不足或已满级：{name}", en: "Not enough lumber, or maxed: {name}" },
    heroCast: { zh: "{hero} 施放 {spell}！", en: "{hero} casts {spell}!" },
    heroDown: { zh: "{hero} 倒下了，{secs} 秒后重生。", en: "{hero} has fallen — reviving in {secs}s." },
    heroRevive: { zh: "{hero} 在要塞重生。", en: "{hero} revives at the keep." },
    leak: { zh: "敌军漏入要塞！剩余生命 {lives}", en: "A creep leaked into the keep! Lives {lives}" },
  };

  function fmt(text, params) {
    return String(text).replace(/\{(\w+)\}/g, function (all, key) {
      return params && params[key] != null ? params[key] : "";
    });
  }

  function msg(key, lang, params) {
    const row = MSG[key];
    if (!row) return key;
    return fmt(row[lang] || row.zh, params);
  }

  const ARMOR_LABEL = {
    unarmored: { zh: "无", en: "unarmored" },
    light: { zh: "轻", en: "light" },
    medium: { zh: "中", en: "medium" },
    heavy: { zh: "重", en: "heavy" },
    fortified: { zh: "城", en: "fortified" },
    hero: { zh: "英雄", en: "hero" },
    divine: { zh: "神圣", en: "divine" },
  };

  // Which attack type the player should build against a given armor type.
  const COUNTER_HINT = {
    unarmored: { zh: "穿刺", en: "pierce" },
    light: { zh: "穿刺", en: "pierce" },
    medium: { zh: "普通", en: "normal" },
    heavy: { zh: "魔法", en: "magic" },
    fortified: { zh: "攻城", en: "siege" },
    hero: { zh: "英雄/混沌", en: "hero/chaos" },
    divine: { zh: "混沌", en: "chaos" },
  };

  function armorLabel(type, lang) {
    const row = ARMOR_LABEL[type] || ARMOR_LABEL.unarmored;
    return row[lang] || row.zh;
  }

  function counterHint(type, lang) {
    const row = COUNTER_HINT[type] || COUNTER_HINT.unarmored;
    return row[lang] || row.zh;
  }

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

  /**
   * Hero kits. Every ability carries the numbers the sim reads, so each
   * commander plays differently:
   *  - Paladin  : tower damage aura + burst heal-nova, survives melee
   *  - Blademaster: single-target burst, cleave and multi-strike windows
   *  - Demon Hunter: sustained AoE, armor shred, ranged Metamorphosis
   *  - Death Knight: tower attack-speed aura, drain, raises skeletons
   */
  const HEROES = [
    { id: "paladin", name: { zh: "乌瑟尔", en: "Uther" }, title: { zh: "圣骑士", en: "Paladin" },
      color: "#f5e6a8", attackType: "hero", dmg: 22, rate: 0.85, range: 90, hp: 460, mana: 180,
      q: { zh: "圣光术", en: "Holy Light", mana: 40, cd: 8, dmg: 95, nova: 0.5, novaRadius: 70, heal: 150, cast: 260,
        desc: { zh: "对目标造成 95 法术伤害，周围敌人受到一半，并治疗自身。", en: "95 spell damage to a target, half to nearby foes, heals the Paladin." } },
      w: { zh: "虔诚光环", en: "Devotion Aura", mana: 30, cd: 20, affects: "towers", stat: "dmg", aura: 0.15, boost: 0.4, dur: 8, radius: 200,
        desc: { zh: "被动：范围内防御塔 +15% 伤害；激活后 8 秒内提升到 +40%。", en: "Passive: +15% damage to towers in range. Active: +40% for 8s." } },
      e: { zh: "神圣护盾", en: "Divine Shield", mana: 50, cd: 20, dur: 5, hasteMul: 0.5, invuln: true,
        desc: { zh: "5 秒内免疫伤害且攻速翻倍。", en: "5s of damage immunity and double attack speed." } } },
    { id: "blademaster", name: { zh: "格罗玛什", en: "Grom" }, title: { zh: "剑圣", en: "Blademaster" },
      color: "#e07030", attackType: "hero", dmg: 28, rate: 0.7, range: 70, hp: 380, mana: 140,
      q: { zh: "致命一击", en: "Crit Stance", mana: 25, cd: 6, crit: 2.2, dur: 5, cleave: 0.35, cleaveRadius: 52,
        desc: { zh: "5 秒内攻击暴击 2.2 倍并顺劈 35%。", en: "5s of 2.2x crits with 35% cleave." } },
      w: { zh: "镜像", en: "Mirror Image", mana: 35, cd: 14, dur: 6, images: 2, imageDmg: 0.45,
        desc: { zh: "6 秒内镜像同时攻击至多 3 个目标（分身 45% 伤害）。", en: "6s: strike up to 3 targets, images deal 45%." } },
      e: { zh: "疾步风", en: "Wind Walk", mana: 30, cd: 12, dur: 3, speed: 2.1, ambush: 3,
        desc: { zh: "3 秒疾行且不可被攻击，脱离时首次攻击 3 倍伤害。", en: "3s of untouchable sprint; the next strike hits for 3x." } } },
    { id: "demonhunter", name: { zh: "伊利丹", en: "Illidan" }, title: { zh: "恶魔猎手", en: "Demon Hunter" },
      color: "#7e57c2", attackType: "hero", dmg: 26, rate: 0.72, range: 75, hp: 360, mana: 200,
      q: { zh: "法力燃烧", en: "Mana Burn", mana: 20, cd: 7, dmg: 75, cast: 260, shred: 5, shredDur: 8, bossBonus: 60,
        desc: { zh: "75 法术伤害并撕裂 5 点护甲 8 秒，对首领额外伤害。", en: "75 spell damage, shreds 5 armor for 8s, bonus versus bosses." } },
      w: { zh: "献祭", en: "Immolation", mana: 8, cd: 1.5, toggle: true, affects: "creeps", aura: 16, radius: 82, drain: 7,
        desc: { zh: "开关：每秒对周围敌人造成 16 伤害，持续消耗法力。", en: "Toggle: 16 dps around the hero while mana drains." } },
      e: { zh: "变身", en: "Metamorphosis", mana: 80, cd: 24, dur: 8, dmgMul: 1.5, rangeBonus: 70, splash: 58, splashRatio: 0.4, hasteMul: 0.85,
        desc: { zh: "8 秒恶魔形态：+50% 伤害、+70 射程且攻击溅射。", en: "8s demon form: +50% damage, +70 range, splashing attacks." } } },
    { id: "deathknight", name: { zh: "阿尔萨斯", en: "Arthas" }, title: { zh: "死亡骑士", en: "Death Knight" },
      color: "#90caf9", attackType: "hero", dmg: 24, rate: 0.8, range: 80, hp: 400, mana: 190,
      q: { zh: "死亡缠绕", en: "Death Coil", mana: 35, cd: 7, dmg: 90, heal: 130, cast: 270,
        desc: { zh: "90 法术伤害并汲取生命治疗自身。", en: "90 spell damage that drains life back to the hero." } },
      w: { zh: "邪恶光环", en: "Unholy Aura", mana: 25, cd: 18, affects: "towers", stat: "rate", aura: 0.12, boost: 0.35, dur: 8, radius: 200,
        desc: { zh: "被动：范围内防御塔 +12% 攻速；激活后 8 秒 +35%。", en: "Passive: +12% tower attack speed. Active: +35% for 8s." } },
      e: { zh: "亡者复生", en: "Animate Dead", mana: 60, cd: 22, dur: 14, count: 2, dmg: 26, gold: 15,
        desc: { zh: "召唤 2 具骷髅战士作战 14 秒，并从尸体上搜刮黄金。", en: "Raise 2 skeletons for 14s and loot gold from the corpses." } } },
  ];

  // Summoned unit statlines reuse the tower shape so HUD/renderer can draw them.
  const SUMMONS = {
    skeleton: {
      id: "sum_skeleton", race: "undead", line: 0, temp: true,
      name: { zh: "骷髅战士", en: "Skeletal Warrior" },
      attackType: "normal", canHitFlying: false, splash: 0,
      cost: [0, 0, 0], dmg: [18, 18, 18], rate: [1, 1, 1], range: [120, 120, 120], armor: 0,
      color: "#cfd8dc",
      desc: { zh: "亡者复生召唤的临时单位。", en: "Temporary minion raised by Animate Dead." },
    },
  };

  // Lumber sinks (Element TD style). Levels are cumulative and permanent.
  const LUMBER_UPGRADES = [
    { id: "interest", cost: 1, max: 3,
      name: { zh: "金库利息", en: "Treasury Interest" },
      desc: { zh: "每级 +2% 利息，上限 8%", en: "+2% interest per level, capped at 8%" },
      effect: { zh: "利息 {value}", en: "interest {value}" } },
    { id: "armory", cost: 2, max: 3,
      name: { zh: "兵工厂锻造", en: "Armory Forging" },
      desc: { zh: "所有防御塔 +8% 伤害", en: "+8% damage for every tower" },
      effect: { zh: "塔伤害 {value}", en: "tower damage {value}" } },
    { id: "sentry", cost: 2, max: 2,
      name: { zh: "哨戒视野", en: "Sentry Sights" },
      desc: { zh: "所有防御塔 +8% 射程", en: "+8% range for every tower" },
      effect: { zh: "塔射程 {value}", en: "tower range {value}" } },
    { id: "repair", cost: 2, max: 3,
      name: { zh: "要塞修缮", en: "Keep Repairs" },
      desc: { zh: "立即恢复 3 点生命", en: "Instantly restore 3 lives" },
      effect: { zh: "生命 {value}", en: "lives {value}" } },
  ];

  function lumberUpgradeById(id) {
    for (let i = 0; i < LUMBER_UPGRADES.length; i++) {
      if (LUMBER_UPGRADES[i].id === id) return LUMBER_UPGRADES[i];
    }
    return null;
  }

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

  // Boss mechanics. Each is telegraphed in the log before it resolves.
  const BOSS_ABILITIES = {
    stomp: {
      id: "stomp", name: { zh: "战争践踏", en: "War Stomp" },
      desc: { zh: "周期性震晕附近防御塔 1.6 秒", en: "periodically stuns nearby towers for 1.6s" },
      cd: 9, warn: 1.3, radius: 132, stun: 1.6,
    },
    regen: {
      id: "regen", name: { zh: "石肤再生", en: "Stone Regeneration" },
      desc: { zh: "每秒恢复 0.7% 最大生命", en: "regenerates 0.7% max health per second" },
      regen: 0.007,
    },
    frost: {
      id: "frost", name: { zh: "寒冰光环", en: "Frost Aura" },
      desc: { zh: "附近防御塔攻速降低 25%", en: "slows nearby tower attack speed by 25%" },
      radius: 150, slow: 0.25,
    },
    shroud: {
      id: "shroud", name: { zh: "邪影护罩", en: "Shadow Shroud" },
      desc: { zh: "为附近敌军提供 +3 护甲", en: "grants +3 armor to nearby creeps" },
      radius: 132, armor: 3,
    },
  };

  const BOSS_ENRAGE = { at: 0.5, speed: 1.25 };

  const BOSS_PROFILES = [
    { name: { zh: "血蹄督军", en: "Bloodhoof Warlord" }, abilities: ["stomp"] },
    { name: { zh: "腐烂石魔", en: "Rotting Golem" }, abilities: ["regen"] },
    { name: { zh: "寒霜巫王", en: "Frostwake Lich" }, abilities: ["frost"] },
    { name: { zh: "暗影编织者", en: "Shadow Weaver" }, abilities: ["shroud"] },
    { name: { zh: "末日领主", en: "Doomlord" }, abilities: ["stomp", "regen"] },
    { name: { zh: "燃烧军团统帅", en: "Legion Overlord" }, abilities: ["frost", "shroud", "stomp"] },
  ];

  function abilityText(ids, lang) {
    const zh = lang === "zh";
    return (ids || []).map(function (id) {
      const a = BOSS_ABILITIES[id];
      if (!a) return id;
      const name = a.name[lang] || a.name.zh;
      const desc = a.desc[lang] || a.desc.zh;
      return zh ? name + "（" + desc + "）" : name + " (" + desc + ")";
    }).join(zh ? "，" : "; ");
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
      const profile = boss ? BOSS_PROFILES[Math.floor(i / 5) % BOSS_PROFILES.length] : null;
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
        bossName: profile ? profile.name : null,
        abilities: profile ? profile.abilities.slice() : [],
        // Bosses give the player a longer build phase and a portal charge-up.
        prep: boss ? 18 : 12,
        spawnDelay: boss ? 1.8 : 0,
      });
    }
    return plan;
  }

  root.GameData = {
    STR: STR,
    MSG: MSG,
    msg: msg,
    fmt: fmt,
    armorLabel: armorLabel,
    counterHint: counterHint,
    LUMBER_UPGRADES: LUMBER_UPGRADES,
    lumberUpgradeById: lumberUpgradeById,
    SUMMONS: SUMMONS,
    BOSS_ABILITIES: BOSS_ABILITIES,
    BOSS_PROFILES: BOSS_PROFILES,
    BOSS_ENRAGE: BOSS_ENRAGE,
    abilityText: abilityText,
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
