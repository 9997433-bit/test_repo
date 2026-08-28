// Opus-3 纯模拟。禁止 import Babylon / DOM。
export function createMatch() {
  throw new Error("sim not implemented");
}
export function step() {
  return { events: [] };
}
export function getView() {
  return { backend: "sim", wave: 0, scrap: 0, coreHp: 0, coreMax: 0, sockets: [], enemies: [], shots: [], events: [] };
}
