/* Creep archetypes + per-wave stat scaling. DOM-free. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});

  function t(zh, en) { return { zh, en }; }

  const TYPES = {
    footman: {
      id: 'footman', name: t('步兵', 'Footman'), armorType: 'medium', armorBase: 2,
      hpMul: 1.00, speed: 1.90, bountyMul: 1.0, radius: 0.34, body: '#c9d4e6', trim: '#4a6fa5'
    },
    ghoul: {
      id: 'ghoul', name: t('食尸鬼', 'Ghoul'), armorType: 'unarmored', armorBase: 0,
      hpMul: 0.70, speed: 2.85, bountyMul: 0.85, radius: 0.30, body: '#b9c7ae', trim: '#5c6b4a'
    },
    grunt: {
      id: 'grunt', name: t('兽人步兵', 'Grunt'), armorType: 'heavy', armorBase: 3,
      hpMul: 1.38, speed: 1.70, bountyMul: 1.15, radius: 0.38, body: '#7ba05b', trim: '#4a2f1c'
    },
    huntress: {
      id: 'huntress', name: t('女猎手', 'Huntress'), armorType: 'light', armorBase: 1,
      hpMul: 0.85, speed: 2.45, bountyMul: 0.95, radius: 0.32, body: '#8fd6c0', trim: '#2f5f52'
    },
    siege: {
      id: 'siege', name: t('攻城车', 'Siege Engine'), armorType: 'fortified', armorBase: 5,
      hpMul: 1.95, speed: 1.30, bountyMul: 1.45, radius: 0.46, body: '#8a7250', trim: '#3a2c1c'
    },
    wyvern: {
      id: 'wyvern', name: t('风蛇飞龙', 'Wind Wyrm'), armorType: 'light', armorBase: 1,
      hpMul: 0.82, speed: 2.60, bountyMul: 1.1, radius: 0.36, flying: true, body: '#d8a05a', trim: '#6b3f1c'
    },
    gargoyle: {
      id: 'gargoyle', name: t('石像鬼', 'Gargoyle'), armorType: 'heavy', armorBase: 4,
      hpMul: 1.30, speed: 2.05, bountyMul: 1.25, radius: 0.38, flying: true, body: '#8e93a8', trim: '#42465a'
    },
    treant: {
      id: 'treant', name: t('远古树人', 'Ancient Treant'), armorType: 'heavy', armorBase: 3,
      hpMul: 1.62, speed: 1.55, bountyMul: 1.3, radius: 0.44, spellImmune: true, body: '#6f8f4a', trim: '#3b4a26'
    },
    fiend: {
      id: 'fiend', name: t('混沌魔血卫士', 'Chaos Fiend'), armorType: 'unarmored', armorBase: 6,
      hpMul: 1.45, speed: 2.20, bountyMul: 1.35, radius: 0.40, regen: 0.012, body: '#c05a4a', trim: '#5a1f18'
    },
    banshee: {
      id: 'banshee', name: t('女妖', 'Banshee'), armorType: 'unarmored', armorBase: 1,
      hpMul: 0.9, speed: 2.3, bountyMul: 1.1, radius: 0.32, flying: true, spellImmune: true,
      body: '#b39ae0', trim: '#4b2f70'
    },

    // ---- bosses ----
    boss_warlord: {
      id: 'boss_warlord', name: t('钢铁督军', 'Iron Warlord'), armorType: 'heavy', armorBase: 6,
      hpMul: 9, speed: 1.45, bountyMul: 9, radius: 0.66, boss: true, aura: { armor: 2, radius: 4 },
      body: '#9aa4b8', trim: '#2c3550'
    },
    boss_cryptlord: {
      id: 'boss_cryptlord', name: t('地穴领主', 'Crypt Sovereign'), armorType: 'hero', armorBase: 7,
      hpMul: 10, speed: 1.5, bountyMul: 10, radius: 0.68, boss: true, regen: 0.008,
      body: '#7d6ba8', trim: '#2b1f4a'
    },
    boss_corrupted: {
      id: 'boss_corrupted', name: t('腐化古树', 'Corrupted Ancient'), armorType: 'hero', armorBase: 8,
      hpMul: 11, speed: 1.35, bountyMul: 11, radius: 0.72, boss: true, spellImmune: true,
      body: '#6a7a3a', trim: '#2e3a18'
    },
    boss_skywyrm: {
      id: 'boss_skywyrm', name: t('腐翼双足飞龙', 'Blightwing Skywyrm'), armorType: 'hero', armorBase: 7,
      hpMul: 10, speed: 2.0, bountyMul: 11, radius: 0.7, boss: true, flying: true,
      body: '#c07a3a', trim: '#4a2410'
    },
    boss_destroyer: {
      id: 'boss_destroyer', name: t('毁灭者', 'Destroyer'), armorType: 'fortified', armorBase: 9,
      hpMul: 12, speed: 1.6, bountyMul: 12, radius: 0.72, boss: true, regen: 0.006,
      body: '#6f5a7f', trim: '#291a33'
    },
    boss_abyss: {
      id: 'boss_abyss', name: t('深渊领主·维尔萨克', 'Abyss Lord Vurthak'), armorType: 'hero', armorBase: 11,
      hpMul: 18, speed: 1.5, bountyMul: 20, radius: 0.85, boss: true, regen: 0.01,
      aura: { armor: 3, radius: 5 }, body: '#b0392f', trim: '#2a0c08'
    }
  };

  /* The HP and bounty curves share a growth rate on purpose: gold income has
   * to compound at the same speed the creeps do, or the campaign becomes
   * unwinnable no matter how well the player plays. */
  const GROWTH = 1.135;
  function baseHp(wave) {
    return 42 * Math.pow(GROWTH, wave - 1) * NS.Config.balance.creepHp;
  }
  function baseBounty(wave) {
    return 9 * Math.pow(GROWTH, wave - 1) * NS.Config.balance.bounty;
  }

  /** Rolled-out stat block for one creep. */
  function statsFor(typeId, wave, diff) {
    const ty = TYPES[typeId];
    if (!ty) throw new Error('unknown creep type: ' + typeId);
    const d = diff || { hp: 1, bounty: 1, speed: 1 };
    const hp = Math.round(baseHp(wave) * ty.hpMul * d.hp);
    return {
      type: ty,
      typeId: typeId,
      name: ty.name,
      maxHp: hp,
      hp: hp,
      armorType: ty.armorType,
      armorValue: ty.armorBase + Math.floor(wave / 4),
      speed: ty.speed * d.speed,
      bounty: Math.max(1, Math.round(baseBounty(wave) * ty.bountyMul * d.bounty)),
      flying: !!ty.flying,
      spellImmune: !!ty.spellImmune,
      boss: !!ty.boss,
      radius: ty.radius,
      regen: ty.regen ? ty.regen * hp : 0,
      aura: ty.aura || null
    };
  }

  NS.CreepData = { TYPES, statsFor, baseHp, baseBounty };
})(typeof globalThis !== 'undefined' ? globalThis : this);
