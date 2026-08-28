// 蚀核要塞 · 护甲克制表（Fable-3 冻结，Round 1）
// 三种护甲：shell 甲壳（物理镀层）/ shield 力场（能量护盾）/ swarm 蜂群（多而小）。
// 每种护甲有明确的克制塔与被克制塔；well 是万金油但基础 DPS 最低。

export const ARMOR_TYPES = ["shell", "shield", "swarm"];

export const ARMOR_INFO = {
  shell: { name: "甲壳", hint: "怕轨炮 / 坠井，扛棱镜" },
  shield: { name: "力场", hint: "怕棱镜 / 星弩，扛轨炮与霰星" },
  swarm: { name: "蜂群", hint: "怕霰星 / 坠井，扛轨炮与星弩" },
};

// 行 = towerId，列 = armor。伤害 = 基础伤害 × 表值 ×（过载时再 ×2.2）。
export const ARMOR_MULT = {
  rail: { shell: 1.6, shield: 0.6, swarm: 0.75 },
  prism: { shell: 0.75, shield: 1.6, swarm: 1.0 },
  scatter: { shell: 1.0, shield: 0.75, swarm: 1.6 },
  well: { shell: 1.25, shield: 1.0, swarm: 1.25 },
  star: { shell: 1.0, shield: 1.25, swarm: 0.6 },
};

/**
 * 查克制倍率。towerId 未知抛错（开发期尽早暴露）；armor 未知按 1.0（Boss 相位切换护甲时容错）。
 * @param {string} towerId rail|prism|scatter|well|star
 * @param {string} armor shell|shield|swarm
 * @returns {number}
 */
export function armorMultiplier(towerId, armor) {
  const row = ARMOR_MULT[towerId];
  if (!row) throw new Error(`armorMultiplier: unknown towerId "${towerId}"`);
  return row[armor] ?? 1.0;
}
