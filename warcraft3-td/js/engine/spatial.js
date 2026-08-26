/*
 * Uniform-grid spatial hash for tower targeting and splash queries.
 * Rebuilt every tick from the live creep list; buckets are pooled so a full
 * rebuild costs no allocations after warm-up.
 */
(function (global) {
  'use strict';

  function SpatialHash(cellSize, worldW, worldH) {
    this.cell = cellSize || 64;
    this.cols = Math.max(1, Math.ceil(worldW / this.cell));
    this.rows = Math.max(1, Math.ceil(worldH / this.cell));
    this.buckets = new Array(this.cols * this.rows);
    for (var i = 0; i < this.buckets.length; i++) this.buckets[i] = [];
    this.count = 0;
    this._stamp = 0;
    this._seen = new Map();
  }

  SpatialHash.prototype.clear = function () {
    for (var i = 0; i < this.buckets.length; i++) {
      if (this.buckets[i].length) this.buckets[i].length = 0;
    }
    this.count = 0;
  };

  /**
   * Cell index for a world position, clamped to the grid.
   * NaN/Infinity land in cell 0 rather than producing an undefined bucket: one
   * bad coordinate must never be able to kill the tick that rebuilds the hash.
   */
  SpatialHash.prototype._index = function (x, y) {
    var cx = Math.floor(x / this.cell);
    var cy = Math.floor(y / this.cell);
    if (!(cx >= 0)) cx = 0; else if (cx >= this.cols) cx = this.cols - 1;
    if (!(cy >= 0)) cy = 0; else if (cy >= this.rows) cy = this.rows - 1;
    return cy * this.cols + cx;
  };

  SpatialHash.prototype.insert = function (ent) {
    this.buckets[this._index(ent.x, ent.y)].push(ent);
    this.count++;
  };

  SpatialHash.prototype.rebuild = function (entities) {
    this.clear();
    for (var i = 0; i < entities.length; i++) {
      var e = entities[i];
      if (e.alive) this.insert(e);
    }
  };

  /**
   * Collect entities whose centre is within `r` of (x,y).
   * `out` is cleared and reused by the caller to stay allocation-free.
   */
  SpatialHash.prototype.query = function (x, y, r, out) {
    var res = out || [];
    res.length = 0;
    var minCx = Math.floor((x - r) / this.cell);
    var maxCx = Math.floor((x + r) / this.cell);
    var minCy = Math.floor((y - r) / this.cell);
    var maxCy = Math.floor((y + r) / this.cell);
    // `!(v >= 0)` also catches NaN, which would otherwise skip the loop body
    // silently or index an undefined bucket.
    if (!(minCx >= 0)) minCx = 0;
    if (!(minCy >= 0)) minCy = 0;
    if (!(maxCx < this.cols)) maxCx = this.cols - 1;
    if (!(maxCy < this.rows)) maxCy = this.rows - 1;
    var r2 = r * r;
    for (var cy = minCy; cy <= maxCy; cy++) {
      var row = cy * this.cols;
      for (var cx = minCx; cx <= maxCx; cx++) {
        var bucket = this.buckets[row + cx];
        for (var i = 0; i < bucket.length; i++) {
          var e = bucket[i];
          var dx = e.x - x;
          var dy = e.y - y;
          if (dx * dx + dy * dy <= r2) res.push(e);
        }
      }
    }
    return res;
  };

  /**
   * Targeting helper: pick one entity in range using a priority function.
   * Higher score wins; ties broken by entity id so results are deterministic
   * regardless of bucket iteration order.
   */
  SpatialHash.prototype.pick = function (x, y, r, score, scratch) {
    var list = this.query(x, y, r, scratch);
    var best = null;
    var bestScore = -Infinity;
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      var s = score(e);
      if (s === null || s === undefined || s === false) continue;
      if (s > bestScore || (s === bestScore && best && e.id < best.id)) {
        bestScore = s;
        best = e;
      }
    }
    return best;
  };

  global.WC3 = global.WC3 || {};
  global.WC3.SpatialHash = SpatialHash;

  if (typeof module === 'object' && module.exports) module.exports = SpatialHash;
})(typeof globalThis !== 'undefined' ? globalThis : this);
