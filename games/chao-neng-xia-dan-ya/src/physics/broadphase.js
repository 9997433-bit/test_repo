/**
 * 静态体宽相：均匀网格。
 *
 * 480×800 @ 48px = 10×17 个单元。静态体只在拓扑变化时重建，
 * 每步查询只做整型索引运算，不产生临时数组。
 */

import { GRID_CELL, WORLD_H, WORLD_W } from "./constants.js";

export function createGrid(cell = GRID_CELL, width = WORLD_W, height = WORLD_H) {
  const cols = Math.max(1, Math.ceil(width / cell));
  const rows = Math.max(1, Math.ceil(height / cell));
  const cells = new Array(cols * rows);
  for (let i = 0; i < cells.length; i++) cells[i] = [];
  return {
    cell,
    cols,
    rows,
    cells,
    /** 越界（含负坐标）的静态体统一放这里，查询时总是纳入 */
    overflow: [],
    count: 0,
    stamp: 0,
  };
}

export function clearGrid(grid) {
  for (let i = 0; i < grid.cells.length; i++) grid.cells[i].length = 0;
  grid.overflow.length = 0;
  grid.count = 0;
}

function cellRange(grid, minX, minY, maxX, maxY) {
  return {
    c0: Math.floor(minX / grid.cell),
    r0: Math.floor(minY / grid.cell),
    c1: Math.floor(maxX / grid.cell),
    r1: Math.floor(maxY / grid.cell),
  };
}

export function insertBody(grid, body) {
  const box = body.aabb;
  const { c0, r0, c1, r1 } = cellRange(grid, box.minX, box.minY, box.maxX, box.maxY);
  grid.count++;
  if (c0 < 0 || r0 < 0 || c1 >= grid.cols || r1 >= grid.rows) {
    // 部分或完全落在网格外：放进溢出桶，保证不会漏检
    grid.overflow.push(body);
    if (c1 < 0 || r1 < 0 || c0 >= grid.cols || r0 >= grid.rows) return;
  }
  const cc0 = Math.max(0, c0);
  const rr0 = Math.max(0, r0);
  const cc1 = Math.min(grid.cols - 1, c1);
  const rr1 = Math.min(grid.rows - 1, r1);
  for (let r = rr0; r <= rr1; r++) {
    const base = r * grid.cols;
    for (let c = cc0; c <= cc1; c++) grid.cells[base + c].push(body);
  }
}

export function rebuildGrid(grid, bodies) {
  clearGrid(grid);
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    if (b.active === false) continue;
    insertBody(grid, b);
  }
  return grid;
}

/**
 * 查询与给定 AABB 相交单元中的静态体，结果写入 out（会被清空）。
 * 通过自增戳去重，跨单元的大物体只返回一次。
 */
export function queryGrid(grid, minX, minY, maxX, maxY, out) {
  out.length = 0;
  const stamp = ++grid.stamp;
  const { c0, r0, c1, r1 } = cellRange(grid, minX, minY, maxX, maxY);
  const cc0 = Math.max(0, c0);
  const rr0 = Math.max(0, r0);
  const cc1 = Math.min(grid.cols - 1, c1);
  const rr1 = Math.min(grid.rows - 1, r1);
  for (let r = rr0; r <= rr1; r++) {
    const base = r * grid.cols;
    for (let c = cc0; c <= cc1; c++) {
      const bucket = grid.cells[base + c];
      for (let i = 0; i < bucket.length; i++) {
        const body = bucket[i];
        if (body._stamp === stamp) continue;
        body._stamp = stamp;
        out.push(body);
      }
    }
  }
  for (let i = 0; i < grid.overflow.length; i++) {
    const body = grid.overflow[i];
    if (body._stamp === stamp) continue;
    body._stamp = stamp;
    out.push(body);
  }
  return out;
}
