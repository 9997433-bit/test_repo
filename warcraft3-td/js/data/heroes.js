/* Four commanders. Each has an auto-attack, two actives, a passive and an
 * ultimate bound to Q / W / E / R. DOM-free. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});

  function t(zh, en) { return { zh, en }; }

  const HEROES = [
    {
      id: 'paladin', name: t('圣光使者', 'Lightbringer'), title: t('圣骑士', 'Paladin'),
      color: '#f2d98c', accent: '#fff8dc', icon: 'hammer',
      attack: { damage: [26, 34], cooldown: 1.1, range: 4.6, attackType: 'hero',
        projectile: { kind: 'holy', speed: 20, color: '#ffe9a8' } },
      abilities: [
        { key: 'Q', id: 'smite', name: t('圣光审判', 'Holy Smite'), kind: 'nuke',
          mana: 55, cooldown: 6, radius: 1.7, damage: 90, perLevel: 62, attackType: 'spells',
          desc: t('在目标处降下圣光，造成范围法术伤害。', 'Calls down light for area spell damage.') },
        { key: 'W', id: 'devotion', name: t('虔诚光环', 'Devotion Aura'), kind: 'aura', passive: true,
          radius: 6.5, towerDamage: 0.08, perLevel: 0.015,
          desc: t('被动：附近防御塔伤害提升。', 'Passive: nearby towers deal extra damage.') },
        { key: 'E', id: 'holylight', name: t('圣疗术', 'Holy Light'), kind: 'heal',
          mana: 40, cooldown: 12, amount: 200, perLevel: 85,
          desc: t('立即治疗自身。', 'Instantly heals the commander.') },
        { key: 'R', id: 'divinestorm', name: t('神圣风暴', 'Divine Storm'), kind: 'storm', ultimate: true,
          mana: 120, cooldown: 45, duration: 4, radius: 3.2, dps: 120, perLevel: 72, attackType: 'spells',
          desc: t('持续在周身释放圣光风暴。', 'A sustained storm of light around the hero.') }
      ]
    },
    {
      id: 'blademaster', name: t('剑刃宗师', 'Bladelord'), title: t('剑圣', 'Blademaster'),
      color: '#d96b4a', accent: '#ffd7b0', icon: 'blade',
      attack: { damage: [34, 46], cooldown: 0.85, range: 1.7, attackType: 'hero',
        projectile: { kind: 'slash', speed: 40, color: '#ffd9a0' } },
      abilities: [
        { key: 'Q', id: 'bladestorm', name: t('剑刃风暴', 'Bladestorm'), kind: 'storm',
          mana: 100, cooldown: 30, duration: 5, radius: 2.4, dps: 150, perLevel: 92, attackType: 'normal',
          desc: t('旋风斩杀周围所有地面敌人。', 'Whirls, shredding everything nearby.') },
        { key: 'W', id: 'critical', name: t('致命一击', 'Critical Strike'), kind: 'passiveCrit', passive: true,
          chance: 0.2, mult: 2.5,
          desc: t('被动：普通攻击有概率造成暴击。', 'Passive: chance to strike critically.') },
        { key: 'E', id: 'windwalk', name: t('疾风步', 'Wind Walk'), kind: 'selfbuff',
          mana: 45, cooldown: 18, duration: 6, moveMul: 1.8, damageMul: 1.5,
          desc: t('提升移动速度与攻击力。', 'Boosts movement speed and damage.') },
        { key: 'R', id: 'mirror', name: t('镜像幻影', 'Mirror Image'), kind: 'selfbuff', ultimate: true,
          mana: 130, cooldown: 50, duration: 8, attackSpeedMul: 2.2, images: 2,
          desc: t('召唤幻影协同作战，攻速大幅提升。', 'Phantom copies raise the attack rate massively.') }
      ]
    },
    {
      id: 'demonhunter', name: t('黄昏之刃', 'Duskblade'), title: t('恶魔猎手', 'Demon Hunter'),
      color: '#9b6bd9', accent: '#e0ccff', icon: 'glaive',
      attack: { damage: [30, 38], cooldown: 0.95, range: 2.1, attackType: 'hero',
        projectile: { kind: 'glaive', speed: 34, color: '#c6a4ff' } },
      abilities: [
        { key: 'Q', id: 'manaburn', name: t('法力燃烧', 'Mana Burn'), kind: 'nuke',
          mana: 50, cooldown: 8, radius: 1.1, damage: 130, perLevel: 84, attackType: 'spells',
          slow: { amount: 0.4, duration: 3 },
          desc: t('灼烧单一目标并使其减速。', 'Scorches a single target and slows it.') },
        { key: 'W', id: 'immolation', name: t('献祭', 'Immolation'), kind: 'toggleAura',
          manaPerSecond: 6, radius: 2.3, dps: 30, perLevel: 21, attackType: 'spells',
          desc: t('开关：燃烧周身敌人，持续消耗法力。', 'Toggle: burns nearby foes while draining mana.') },
        { key: 'E', id: 'evasion', name: t('迅捷', 'Swiftness'), kind: 'passiveHaste', passive: true,
          attackSpeed: 0.18, perLevel: 0.025,
          desc: t('被动：提升自身攻击速度。', 'Passive: increases attack rate.') },
        { key: 'R', id: 'metamorphosis', name: t('恶魔变形', 'Metamorphosis'), kind: 'selfbuff', ultimate: true,
          mana: 150, cooldown: 60, duration: 12, damageMul: 2.0, rangeAdd: 3.2, attackType: 'chaos',
          desc: t('化身恶魔：混沌伤害无视护甲类型。', 'Become a demon: chaos damage ignores armour types.') }
      ]
    },
    {
      id: 'deathknight', name: t('霜寒领主', 'Frostlord'), title: t('死亡骑士', 'Death Knight'),
      color: '#7fd4e6', accent: '#dff6ff', icon: 'skull',
      attack: { damage: [28, 36], cooldown: 1.0, range: 4.1, attackType: 'hero',
        projectile: { kind: 'frost', speed: 22, color: '#a8ecff' } },
      abilities: [
        { key: 'Q', id: 'deathcoil', name: t('死亡缠绕', 'Death Coil'), kind: 'nuke',
          mana: 45, cooldown: 7, radius: 1.3, damage: 110, perLevel: 74, attackType: 'spells',
          desc: t('射出一道亡灵能量，造成范围伤害。', 'Hurls unholy energy for area damage.') },
        { key: 'W', id: 'frostaura', name: t('冰霜光环', 'Frost Aura'), kind: 'slowAura', passive: true,
          radius: 5.0, slow: 0.2, perLevel: 0.03,
          desc: t('被动：附近敌人持续减速。', 'Passive: chills nearby enemies, slowing them.') },
        { key: 'E', id: 'frenzy', name: t('邪恶狂热', 'Unholy Frenzy'), kind: 'selfbuff',
          mana: 50, cooldown: 20, duration: 8, attackSpeedMul: 2.0,
          desc: t('攻击速度翻倍。', 'Doubles the attack rate.') },
        { key: 'R', id: 'decay', name: t('死亡凋零', 'Death and Decay'), kind: 'storm', ultimate: true,
          mana: 140, cooldown: 55, duration: 6, radius: 3.6, dps: 140, perLevel: 84, attackType: 'spells',
          desc: t('腐蚀脚下大地，持续伤害所有敌人。', 'Rots the ground, damaging all enemies over time.') }
      ]
    }
  ];

  const BY_ID = {};
  HEROES.forEach((h) => { BY_ID[h.id] = h; });

  NS.HeroData = { HEROES, BY_ID };
})(typeof globalThis !== 'undefined' ? globalThis : this);
