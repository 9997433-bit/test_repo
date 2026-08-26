/* 30-wave script. Each group spawns `count` creeps `gap` seconds apart,
 * starting `delay` seconds after the wave begins. DOM-free. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});

  function g(type, count, gap, delay) {
    return { type, count, gap: gap === undefined ? 0.9 : gap, delay: delay || 0 };
  }

  const SCRIPT = [
    [g('footman', 8, 1.0)],
    [g('ghoul', 10, 0.75)],
    [g('footman', 8, 0.85), g('huntress', 6, 0.8, 4)],
    [g('wyvern', 10, 0.85)],
    [g('boss_warlord', 1, 1), g('grunt', 6, 1.0, 3)],
    [g('grunt', 12, 0.9)],
    [g('huntress', 14, 0.55)],
    [g('siege', 8, 1.15)],
    [g('wyvern', 10, 0.8), g('ghoul', 10, 0.6, 2)],
    [g('boss_cryptlord', 1, 1), g('treant', 4, 1.2, 4)],
    [g('treant', 10, 1.0)],
    [g('gargoyle', 10, 0.85)],
    [g('fiend', 10, 0.9)],
    [g('siege', 10, 1.0), g('footman', 10, 0.6, 3)],
    [g('boss_corrupted', 1, 1), g('banshee', 6, 0.9, 4)],
    [g('banshee', 12, 0.7)],
    [g('grunt', 14, 0.7), g('huntress', 10, 0.5, 5)],
    [g('gargoyle', 12, 0.7), g('wyvern', 8, 0.7, 4)],
    [g('fiend', 14, 0.7)],
    [g('boss_skywyrm', 1, 1), g('gargoyle', 8, 0.8, 4)],
    [g('siege', 12, 0.85), g('treant', 8, 0.8, 5)],
    [g('ghoul', 24, 0.32)],
    [g('banshee', 10, 0.6), g('fiend', 10, 0.6, 3)],
    [g('grunt', 16, 0.55), g('siege', 8, 1.0, 6)],
    [g('boss_destroyer', 2, 2.5), g('fiend', 8, 0.7, 5)],
    [g('gargoyle', 14, 0.55), g('wyvern', 10, 0.55, 4)],
    [g('treant', 14, 0.6), g('fiend', 10, 0.6, 4)],
    [g('siege', 14, 0.7), g('grunt', 14, 0.5, 5)],
    [g('fiend', 12, 0.5), g('gargoyle', 12, 0.5, 3), g('treant', 10, 0.6, 7)],
    [g('boss_abyss', 1, 1), g('boss_destroyer', 1, 1, 6), g('fiend', 10, 0.6, 10), g('gargoyle', 8, 0.6, 14)]
  ];

  const BOSS_WAVES = [5, 10, 15, 20, 25, 30];

  function wave(index) {
    const groups = SCRIPT[index - 1];
    if (!groups) return null;
    return {
      index,
      groups,
      boss: BOSS_WAVES.indexOf(index) !== -1,
      clearBonus: 15 + index * 5
    };
  }

  /** Distinct creep types in a wave, for the wave-preview tooltip. */
  function preview(index) {
    const w = wave(index);
    if (!w) return [];
    const seen = [];
    w.groups.forEach((grp) => { if (seen.indexOf(grp.type) === -1) seen.push(grp.type); });
    return seen;
  }

  function totalCreeps(index) {
    const w = wave(index);
    return w ? w.groups.reduce((s, grp) => s + grp.count, 0) : 0;
  }

  NS.WaveData = { SCRIPT, BOSS_WAVES, wave, preview, totalCreeps, count: SCRIPT.length };
})(typeof globalThis !== 'undefined' ? globalThis : this);
