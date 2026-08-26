// 裂岛台面：圆盘上的方块网格，每块有 HP，重击可打碎，碎了脚下就没台。

import { ARENA } from "./constants.js";
import { nextRange } from "./rng.js";

/**
 * 生成台面。tiles 是纯数据数组，grid 存 tiles 下标（-1 表示该格不在圆盘内）。
 * zone 0..3 为四块可破坏区，seam 为中缝（HP 更低，更容易先塌）。
 */
export function createArena(radius, rng, tileSize = ARENA.tileSize) {
  const cols = Math.ceil((radius * 2) / tileSize);
  const origin = -(cols * tileSize) / 2;
  const tiles = [];
  const grid = new Array(cols * cols).fill(-1);

  for (let iz = 0; iz < cols; iz++) {
    for (let ix = 0; ix < cols; ix++) {
      const x = origin + (ix + 0.5) * tileSize;
      const z = origin + (iz + 0.5) * tileSize;
      const r = Math.sqrt(x * x + z * z);
      if (r > radius) continue;

      const seam = Math.abs(x) < ARENA.seamHalfWidth;
      const baseHp = seam ? ARENA.seamTileHp : ARENA.tileHp;
      // 边缘略脆一点，rng 抖动保证同 seed 一致
      const edgeMul = 0.75 + 0.25 * (1 - r / radius);
      const jitter = nextRange(rng, 0.92, 1.08);
      const maxHp = Math.max(24, Math.round(baseHp * edgeMul * jitter));

      grid[iz * cols + ix] = tiles.length;
      tiles.push({
        i: tiles.length,
        ix,
        iz,
        x,
        z,
        zone: (x < 0 ? 0 : 1) + (z < 0 ? 0 : 2),
        seam,
        hp: maxHp,
        maxHp,
        alive: true,
      });
    }
  }

  return {
    radius,
    tileSize,
    cols,
    origin,
    tiles,
    grid,
    brokenCount: 0,
    floorY: ARENA.floorY,
  };
}

/** 世界坐标 -> tile 下标；不在盘上返回 -1 */
export function tileIndexAt(arena, x, z) {
  const ix = Math.floor((x - arena.origin) / arena.tileSize);
  const iz = Math.floor((z - arena.origin) / arena.tileSize);
  if (ix < 0 || iz < 0 || ix >= arena.cols || iz >= arena.cols) return -1;
  return arena.grid[iz * arena.cols + ix];
}

export function tileAt(arena, x, z) {
  const i = tileIndexAt(arena, x, z);
  return i < 0 ? null : arena.tiles[i];
}

/** 脚下是否有台：格子存在且没碎，且没飞出盘外 0.2 的宽容边 */
export function isSupported(arena, x, z) {
  if (Math.sqrt(x * x + z * z) > arena.radius + 0.2) return false;
  const t = tileAt(arena, x, z);
  return !!(t && t.alive);
}

/**
 * 砸地。返回 { tile, broken } 或 null。
 * combat / sim 都走这里，保证 brokenCount 与事件一致。
 */
export function damageTile(arena, x, z, amount) {
  const t = tileAt(arena, x, z);
  if (!t || !t.alive || !(amount > 0)) return null;
  t.hp -= amount;
  if (t.hp <= 0) {
    t.hp = 0;
    t.alive = false;
    arena.brokenCount++;
    return { tile: t, broken: true };
  }
  return { tile: t, broken: false };
}

export function crackOf(tile) {
  return tile.alive ? 1 - tile.hp / tile.maxHp : 1;
}
