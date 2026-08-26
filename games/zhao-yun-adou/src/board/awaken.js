import { findHeroByGlyphs } from "../data/heroes.js";
import { MAX_LEVEL } from "../data/units.js";
import { cellAt, isAdjacent, neighbors } from "./grid.js";
import { isGlyph } from "./merge.js";

/** 觉醒后的武将棋子形状（等级拉满，落地即带 35% 技能冷却）。 */
function heroUnit(hero) {
  return {
    kind: "hero",
    id: hero.id,
    glyph: hero.name,
    level: MAX_LEVEL,
    cooldown: hero.skill.cd * 0.35,
    atkBonus: 0,
  };
}

/** 单字要参与拼字，必须待在已解锁格上且确实是单字。 */
function awakenableGlyph(cell) {
  return !!cell && cell.unlocked === true && isGlyph(cell.unit) && typeof cell.unit.glyph === "string";
}

/**
 * 扫描可觉醒的单字对。
 *
 * 规则：
 * - 只认**正交相邻**的两枚单字（不含斜向、不跨格）。
 * - 两枚字必须凑成同一位武将的姓名（顺序不限，见 `findHeroByGlyphs`）。
 * - 一枚单字在一次扫描里最多被消耗一次：保留格与丢弃格都会记入 `used`，
 *   所以三字连排只会成一对，剩下那枚继续「睡大觉」。
 * - 拼不成的单字不动，占格但不攻击。
 *
 * 扫描顺序按格索引升序、邻格索引升序，结果确定可复现。
 *
 * @returns {{keepIndex:number, dropIndex:number, hero:object}[]} 保留格变武将，丢弃格清空。
 */
export function scanAwaken(cells) {
  if (!Array.isArray(cells)) return [];
  const used = new Set();
  const plan = [];
  const ordered = cells.filter(Boolean).sort((a, b) => a.index - b.index);

  for (const cell of ordered) {
    if (used.has(cell.index) || !awakenableGlyph(cell)) continue;
    for (const ni of neighbors(cell.index)) {
      if (used.has(ni)) continue;
      const other = cellAt(cells, ni);
      if (!awakenableGlyph(other)) continue;
      const hero = findHeroByGlyphs(cell.unit.glyph, other.unit.glyph);
      if (!hero) continue;
      used.add(cell.index);
      used.add(ni);
      plan.push({ keepIndex: cell.index, dropIndex: ni, hero });
      break;
    }
  }
  return plan;
}

/**
 * 执行觉醒计划：`keepIndex` 变武将，`dropIndex` 清空。
 *
 * 每一步都重新校验（两格仍是相邻的、已解锁的、能拼成同一位武将的单字），
 * 并按格记账，因此重复调用同一份计划不会二次吞字，伪造的计划也无法生效。
 *
 * @returns {object[]} 真正被召唤出来的武将，顺序与生效步骤一致。
 */
export function applyAwaken(cells, plan) {
  if (!Array.isArray(cells) || !Array.isArray(plan)) return [];
  const consumed = new Set();
  const awakened = [];

  for (const step of plan) {
    if (!step) continue;
    const { keepIndex, dropIndex } = step;
    if (keepIndex === dropIndex) continue;
    if (consumed.has(keepIndex) || consumed.has(dropIndex)) continue;
    if (!isAdjacent(keepIndex, dropIndex)) continue;

    const keep = cellAt(cells, keepIndex);
    const drop = cellAt(cells, dropIndex);
    if (!awakenableGlyph(keep) || !awakenableGlyph(drop)) continue;

    const hero = findHeroByGlyphs(keep.unit.glyph, drop.unit.glyph);
    if (!hero) continue;
    if (step.hero && step.hero.id !== hero.id) continue;

    keep.unit = heroUnit(hero);
    drop.unit = null;
    consumed.add(keepIndex);
    consumed.add(dropIndex);
    awakened.push(hero);
  }
  return awakened;
}
