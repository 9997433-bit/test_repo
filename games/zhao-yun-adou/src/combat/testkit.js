import { createCells } from "../board/grid.js";

/** 战斗单测用的最小 side，与 game.js 的 createSide 字段保持一致。 */
export function makeSide(id = "player", patch = {}) {
  return {
    id,
    mantou: 0,
    hearts: 3,
    recruitCount: 0,
    cells: createCells(),
    hand: [],
    enemies: [],
    spawnQueue: [],
    kills: 0,
    haste: 0,
    wave: 1,
    ...patch,
  };
}

export function makeArena() {
  return { phase: "playing", winner: null, wave: 1, sides: { player: makeSide("player"), ai: makeSide("ai") } };
}

let seq = 1000;

export function makeEnemy(patch = {}) {
  return {
    id: seq++,
    t: 0,
    hp: 100,
    maxHp: 100,
    speed: 0,
    reward: 2,
    boss: false,
    skill: null,
    stun: 0,
    slowT: 0,
    slowMul: 1,
    shield: 0,
    pressure: false,
    glyph: "兵",
    ...patch,
  };
}

export function putUnit(side, index, unit) {
  side.cells[index].unit = { kind: "unit", id: "dao", glyph: "刀", level: 1, cd: 0, cooldown: 0, ...unit };
  return side.cells[index].unit;
}

export function collect() {
  const events = [];
  const emit = (type, payload) => events.push({ type, payload });
  emit.events = events;
  emit.of = (type) => events.filter((e) => e.type === type);
  return emit;
}
