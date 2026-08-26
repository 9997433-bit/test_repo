import { canMerge } from "../board/merge.js";
import { neighbors, cellDistToPath } from "../board/grid.js";
import { UNIT_TABLE, MAX_LEVEL, COLS, recruitCost, HAND_LIMIT } from "../data/units.js";
import { HEROES, findHeroByGlyphs } from "../data/heroes.js";

const STEP_INTERVAL = 0.28;
// 姓名残卷不会攻击：宁可留在手上等另一半，也不要摆满棋盘。
const PARK_GLYPH_CAP = 2;
const PARK_MIN_OPEN = 3;
const PARK_HAND_PRESSURE = 4;
// 空地还够时，铺新兵比合并更划算；地紧或已能冲高阶才合并。
const MERGE_OPEN_SLACK = 1;
const MERGE_FORCE_LEVEL = 3;

const HERO_BY_GLYPH = new Map();
for (const hero of HEROES) for (const g of hero.glyphs) HERO_BY_GLYPH.set(g, hero);

// 全屏/贯穿技能的武将优先：赵云「七进七出」、黄忠「百步穿杨」。
const HERO_VALUE = { zhaoyun: 10, huangzhong: 9, guanyu: 7, zhangfei: 6, machao: 5, liubei: 3 };

const heroValue = (hero) => (hero ? (HERO_VALUE[hero.id] ?? 4) : 0);
const isUnit = (u) => !!u && u.kind === "unit";
const isGlyph = (u) => !!u && u.kind === "glyph";
const isRanged = (id) => UNIT_TABLE[id]?.role === "ranged";

function unitPower(u) {
  const row = UNIT_TABLE[u?.id];
  if (!row) return 0;
  return row.atk[Math.min(MAX_LEVEL, u.level) - 1] * row.rate;
}

function manhattan(a, b) {
  return Math.abs((a % COLS) - (b % COLS)) + Math.abs(Math.floor(a / COLS) - Math.floor(b / COLS));
}

function boardStats(side) {
  const open = [];
  const glyphs = [];
  let units = 0;
  for (const cell of side.cells) {
    if (!cell.unlocked) continue;
    if (!cell.unit) open.push(cell);
    else if (isGlyph(cell.unit)) glyphs.push(cell);
    else units += 1;
  }
  return { open, glyphs, units };
}

function partnerOnBoard(side, glyph) {
  const hero = HERO_BY_GLYPH.get(glyph);
  if (!hero) return null;
  const want = hero.glyphs[0] === glyph ? hero.glyphs[1] : hero.glyphs[0];
  const cell = side.cells.find((c) => c.unlocked && isGlyph(c.unit) && c.unit.glyph === want);
  return cell ? { cell, hero } : null;
}

function wantsMerge(level, open) {
  return open <= MERGE_OPEN_SLACK || level >= MERGE_FORCE_LEVEL;
}

/** 相邻同字同级 → 合并升阶，优先高级别。 */
function findBoardMerge(side, open) {
  let best = null;
  for (const cell of side.cells) {
    const a = cell.unit;
    if (!isUnit(a)) continue;
    for (const ni of neighbors(cell.index)) {
      if (!canMerge(a, side.cells[ni].unit)) continue;
      if (!wantsMerge(a.level, open.length)) continue;
      const score = 58 + a.level * 6 + unitPower(a) * 0.05;
      if (!best || score > best.score) {
        best = { score, run: (api) => api.merge("ai", cell.index, ni) };
      }
    }
  }
  return best;
}

// 引擎若支持「挪子到空格」（api.merge 到空格），凑字就只要一步；不支持则退回换位。
let boardMoveSupported = true;

function moveToEmpty(api, from, to) {
  const ok = api.merge("ai", from, to);
  if (!ok) boardMoveSupported = false;
  return ok;
}

function emptyNeighborOf(side, index) {
  return neighbors(index).find((ni) => side.cells[ni]?.unlocked && !side.cells[ni].unit);
}

/** 场上两枚姓名字：挪到相邻即刻觉醒，挪不动就借换位一步步凑近。 */
function findPairing(side, glyphCells) {
  let best = null;
  for (let i = 0; i < glyphCells.length; i++) {
    for (let j = i + 1; j < glyphCells.length; j++) {
      const a = glyphCells[i];
      const b = glyphCells[j];
      const hero = findHeroByGlyphs(a.unit.glyph, b.unit.glyph);
      if (!hero || manhattan(a.index, b.index) <= 1) continue;
      let gap = null;
      if (boardMoveSupported) {
        const nearB = emptyNeighborOf(side, b.index);
        const nearA = emptyNeighborOf(side, a.index);
        if (nearB != null) gap = { from: a.index, to: nearB };
        else if (nearA != null) gap = { from: b.index, to: nearA };
      }
      const step = gap || swapStep(side, a.index, b.index) || swapStep(side, b.index, a.index);
      if (!step) continue;
      const score = 90 + heroValue(hero) * 3 - manhattan(a.index, b.index) + (gap ? 4 : 0);
      if (!best || score > best.score) {
        best = {
          score,
          run: (api) => (gap ? moveToEmpty(api, step.from, step.to) : api.merge("ai", step.from, step.to)),
        };
      }
    }
  }
  return best;
}

/** 弓手往内圈、近战往外圈补位（只挪进空格，不拆阵）。 */
function findFormationMove(side, open) {
  if (!boardMoveSupported || !open.length) return null;
  for (const cell of side.cells) {
    if (!cell.unlocked || !isUnit(cell.unit)) continue;
    const wantsInner = isRanged(cell.unit.id);
    if ((cellDistToPath(cell.index) >= 1) === wantsInner) continue;
    const seat = open.find((c) => (cellDistToPath(c.index) >= 1) === wantsInner);
    if (!seat) continue;
    return { score: 12, run: (api) => moveToEmpty(api, cell.index, seat.index) };
  }
  return null;
}

function swapStep(side, from, to) {
  const dist = manhattan(from, to);
  let best = null;
  for (const ni of neighbors(from)) {
    const cell = side.cells[ni];
    if (!cell.unlocked || !cell.unit) continue;
    if (manhattan(ni, to) >= dist) continue;
    const cost = isGlyph(cell.unit) || cell.unit.kind === "hero" ? 1 : 0;
    if (!best || cost < best.cost) best = { from, to: ni, cost };
  }
  return best;
}

/** 铲子开地：挑与已开垦区域相连、且更靠内圈的锁地。 */
function findShovel(side, handIndex, open) {
  let best = null;
  for (const cell of side.cells) {
    if (cell.unlocked) continue;
    const touching = neighbors(cell.index).filter((ni) => side.cells[ni].unlocked).length;
    if (!touching) continue;
    const score = touching * 3 + cellDistToPath(cell.index) * 2;
    if (!best || score > best.score) best = { score, index: cell.index };
  }
  if (!best) return null;
  const urgency = open.length <= 1 ? 12 : open.length <= 3 ? 6 : 0;
  return {
    score: 50 + urgency + best.score * 0.1,
    run: (api) => api.useShovel("ai", handIndex, best.index),
  };
}

/** 神兵符：喂给最接近满级的兵，尽快推到 Lv5。 */
function findToken(side, handIndex) {
  let best = null;
  for (const cell of side.cells) {
    if (!cell.unlocked || !isUnit(cell.unit) || cell.unit.level >= MAX_LEVEL) continue;
    const score = cell.unit.level * 8 + unitPower(cell.unit) * 0.1;
    if (!best || score > best.score) best = { score, index: cell.index };
  }
  if (!best) return null;
  return { score: 55 + best.score * 0.2, run: (api) => api.place("ai", handIndex, best.index) };
}

function placementScore(side, card, cell, glyphCells) {
  let score = 0;
  const inner = cellDistToPath(cell.index) >= 1;
  if (isRanged(card.id) === inner) score += 6; // 弓手居内圈，近战守外圈
  for (const ni of neighbors(cell.index)) {
    const other = side.cells[ni];
    if (!other.unlocked || !other.unit) continue;
    score += 1;
    if (isUnit(other.unit) && other.unit.id === card.id) score += 2;
  }
  // 填在两枚成对姓名字之间，下一步即可换位觉醒。
  for (let i = 0; i < glyphCells.length; i++) {
    for (let j = i + 1; j < glyphCells.length; j++) {
      if (!findHeroByGlyphs(glyphCells[i].unit.glyph, glyphCells[j].unit.glyph)) continue;
      const linksBoth =
        neighbors(cell.index).includes(glyphCells[i].index) &&
        neighbors(cell.index).includes(glyphCells[j].index);
      if (linksBoth) score += 8;
    }
  }
  return score;
}

function findUnitCardAction(side, card, handIndex, open, glyphCells) {
  let merge = null;
  for (const cell of side.cells) {
    if (!cell.unlocked || !canMerge(cell.unit, card)) continue;
    if (!wantsMerge(cell.unit.level, open.length)) continue;
    const score = 60 + cell.unit.level * 6;
    if (!merge || score > merge.score) {
      merge = { score, run: (api) => api.place("ai", handIndex, cell.index) };
    }
  }
  if (merge) return merge;

  let spot = null;
  for (const cell of open) {
    const score = placementScore(side, card, cell, glyphCells);
    if (!spot || score > spot.score) spot = { score, index: cell.index };
  }
  if (!spot) return null;
  return {
    score: 40 + spot.score * 0.3 + unitPower(card) * 0.02,
    run: (api) => api.place("ai", handIndex, spot.index),
  };
}

function findGlyphCardAction(side, card, handIndex, hand, open, glyphCells) {
  const match = partnerOnBoard(side, card.glyph);
  if (match) {
    const slot = emptyNeighborOf(side, match.cell.index);
    if (slot != null) {
      return {
        score: 100 + heroValue(match.hero) * 3,
        run: (api) => api.place("ai", handIndex, slot),
      };
    }
    // 另一半四周挤满了：先落在最近的空地，下一手再挪过去凑字。
    if (boardMoveSupported && open.length) {
      const near = open.reduce((a, b) =>
        manhattan(a.index, match.cell.index) <= manhattan(b.index, match.cell.index) ? a : b,
      );
      return {
        score: 95 + heroValue(match.hero) * 3,
        run: (api) => api.place("ai", handIndex, near.index),
      };
    }
  }

  // 手里已握着成对的两个字：先落一枚在有空邻格的位置。
  const twin = hand.find((c, i) => i !== handIndex && c.kind === "glyph" && findHeroByGlyphs(c.glyph, card.glyph));
  if (twin && open.length >= 2) {
    const hero = findHeroByGlyphs(twin.glyph, card.glyph);
    const seat = open.find((cell) =>
      neighbors(cell.index).some((ni) => side.cells[ni].unlocked && !side.cells[ni].unit),
    );
    if (seat) {
      return { score: 70 + heroValue(hero), run: (api) => api.place("ai", handIndex, seat.index) };
    }
  }

  // 无从配对：先攥在手里等另一半，手牌快满了才寄存，且绝不让残卷占满棋盘。
  if (!open.length || hand.length < PARK_HAND_PRESSURE) return null;
  const crowded = glyphCells.length >= PARK_GLYPH_CAP || open.length < PARK_MIN_OPEN;
  let seat = null;
  for (const cell of open) {
    const room = neighbors(cell.index).filter(
      (ni) => side.cells[ni].unlocked && !side.cells[ni].unit,
    ).length;
    const near = neighbors(cell.index).filter((ni) => isGlyph(side.cells[ni].unit)).length;
    const score = room * 2 + near - cellDistToPath(cell.index);
    if (!seat || score > seat.score) seat = { score, index: cell.index };
  }
  const hero = HERO_BY_GLYPH.get(card.glyph);
  return {
    score: crowded ? 6 : 18 + heroValue(hero) * 0.5,
    run: (api) => api.place("ai", handIndex, seat.index),
  };
}

function findHandAction(side, open, glyphCells) {
  let best = null;
  const consider = (action) => {
    if (action && (!best || action.score > best.score)) best = action;
  };
  for (let h = 0; h < side.hand.length; h++) {
    const card = side.hand[h];
    if (card.kind === "shovel") consider(findShovel(side, h, open));
    else if (card.kind === "token") consider(findToken(side, h));
    else if (card.kind === "unit") consider(findUnitCardAction(side, card, h, open, glyphCells));
    else if (card.kind === "glyph")
      consider(findGlyphCardAction(side, card, h, side.hand, open, glyphCells));
  }
  return best;
}

function findRecruit(side) {
  const cost = recruitCost(side.recruitCount);
  if (side.hand.length >= HAND_LIMIT || side.mantou < cost) return null;
  const hunger = side.hand.length <= 1 ? 45 : side.mantou >= cost * 3 ? 35 : 15;
  return { score: hunger, run: (api) => api.recruit("ai") };
}

export function stepAi(api, dt) {
  const side = api.state.sides.ai;
  if (api.state.phase !== "playing") return;
  side._acc = (side._acc || 0) + dt;
  if (side._acc < STEP_INTERVAL) return;
  side._acc = 0;

  const { open, glyphs } = boardStats(side);
  const candidates = [
    findPairing(side, glyphs),
    findBoardMerge(side, open),
    findHandAction(side, open, glyphs),
    findRecruit(side),
    findFormationMove(side, open),
  ];

  let best = null;
  for (const action of candidates) {
    if (action && (!best || action.score > best.score)) best = action;
  }
  if (best) best.run(api);
}
