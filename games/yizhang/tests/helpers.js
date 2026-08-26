import { expect } from "vitest";

export const DT = 1 / 60;

export function input(overrides = {}) {
  return {
    moveX: 0,
    moveZ: 0,
    yaw: 0,
    slap: false,
    skill: false,
    switchGlove: false,
    dash: false,
    jump: false,
    ...overrides,
  };
}

export function playersOf(state) {
  const players = state.players;

  if (Array.isArray(players)) return players;
  if (players instanceof Map) return [...players.values()];
  if (players && typeof players === "object") return Object.values(players);

  throw new TypeError("createMatch state must expose players as a collection");
}

export function duelists(state) {
  const players = playersOf(state);
  const attacker = players.find((player) => player.kind === "human") ?? players[0];
  const target = players.find((player) => player.id !== attacker?.id);

  expect(attacker, "createMatch should create the human player").toBeDefined();
  expect(target, "these tests request one bot target").toBeDefined();
  return { attacker, target };
}

export function equip(player, gloveId, offhandId = "cotton") {
  player.gloveId = gloveId;
  player.offhandId = offhandId;
  player.activeSlot = 0;
}

export function placeDuel(attacker, target, { distance = 2, angle = 0 } = {}) {
  resetPlayer(attacker);
  resetPlayer(target);

  attacker.x = 0;
  attacker.y = 1;
  attacker.z = 0;
  attacker.yaw = 0;

  // Contract convention: yaw 0 faces +Z; positive yaw rotates toward +X.
  target.x = Math.sin(angle) * distance;
  target.y = 1;
  target.z = Math.cos(angle) * distance;
  target.yaw = Math.PI;
}

export function resetPlayer(player) {
  player.vx = 0;
  player.vy = 0;
  player.vz = 0;
  player.alive = true;
  player.invulnT = 0;
  player.respawnT = 0;
  player.awakenedT = 0;
  player.statuses = [];
}

export function advance(step, state, seconds, inputs = {}) {
  const frames = Math.ceil(seconds / DT);
  for (let frame = 0; frame < frames; frame += 1) {
    step(state, inputs, DT);
  }
}

export function horizontalDistance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function horizontalSpeed(player) {
  return Math.hypot(player.vx, player.vz);
}

export function speedAlong(player, directionX, directionZ) {
  return player.vx * directionX + player.vz * directionZ;
}
