// Opus-2 世界 · 预览用假 view 源。
//
// 仅供 src/world/preview 这个开发页使用：世界层需要一份「长得像 getView() 输出」的
// 数据才能被单独看见，而真正的 view 由 sim 产出。这里的数字没有任何玩法含义，
// 也不会被 src/main.js 引用。
// 不造 shots：世界层不画弹道，预览页也就不需要假曳光。

import { LANE_Y, SOCKET_COUNT, TAU } from "../constants.js";

const CORE_MAX = 20;

/** 固定的布阵：五种剪影各来一座，外加过载与过热样本。 */
const LAYOUT = [
  { socket: 0, towerId: "rail", tier: 2 },
  { socket: 2, towerId: "prism" },
  { socket: 4, towerId: "scatter" },
  { socket: 6, towerId: "well" },
  { socket: 8, towerId: "star", tier: 3 },
  { socket: 11, towerId: "rail", overclock: true },
  { socket: 13, towerId: "prism", overclock: true },
  { socket: 15, towerId: "scatter", overheated: true },
  { socket: 17, towerId: "well", overheated: true },
  { socket: 19, towerId: "star" },
  { socket: 21, towerId: "rail" },
  { socket: 22, towerId: "prism", tier: 2 },
];

const ENEMY_COUNT = 33;

export function demoView(time, opts = {}) {
  const t = Number.isFinite(time) ? time : 0;
  const hpRatio = opts.hp !== undefined ? opts.hp : 0.5 + 0.5 * Math.cos(t * 0.22);

  const sockets = new Array(SOCKET_COUNT).fill(null).map((_, i) => ({ index: i, towerId: null }));
  for (const entry of LAYOUT) {
    sockets[entry.socket] = {
      index: entry.socket,
      towerId: entry.towerId,
      tier: entry.tier ?? 1,
      overclock: Boolean(entry.overclock),
      overheated: Boolean(entry.overheated),
    };
  }

  const enemies = [];
  for (let i = 0; i < ENEMY_COUNT; i += 1) {
    const lane = i % LANE_Y.length;
    const kind = ["drone", "hulk", "wisp"][(i * 5) % 3];
    const speed = 0.09 + lane * 0.03;
    const theta = ((i / ENEMY_COUNT) * TAU + t * speed) % TAU;
    const travel = ((t * (2.6 + lane * 0.7) + i * 1.7) % 40) / 40;
    enemies.push({
      id: i,
      lane,
      kind: i % 11 === 0 ? "elite" : kind,
      elite: i % 11 === 0,
      theta,
      radius: 52 - travel * 34,
      hp: 6 - (i % 5),
      hpMax: 6,
    });
  }

  return {
    backend: "preview",
    wave: 3 + Math.floor(t / 12),
    scrap: 180,
    coreHp: Math.max(0, hpRatio) * CORE_MAX,
    coreMax: CORE_MAX,
    sockets,
    enemies,
    // 没有 shots：弹道由 src/combat 画，预览页只看世界层。
    events: [],
    hoverSocket: opts.hover ?? null,
    selectedSocket: opts.selected ?? null,
  };
}
