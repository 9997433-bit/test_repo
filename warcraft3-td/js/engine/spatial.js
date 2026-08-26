/* Uniform-grid spatial hash used for tower targeting and splash queries. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});

  function SpatialHash(cellSize) {
    this.cell = cellSize || 3;
    this.map = new Map();
  }

  SpatialHash.prototype.key = function (cx, cy) { return cx * 73856093 ^ cy * 19349663; };

  SpatialHash.prototype.clear = function () { this.map.clear(); };

  SpatialHash.prototype.insert = function (obj) {
    const cx = Math.floor(obj.x / this.cell), cy = Math.floor(obj.y / this.cell);
    const k = this.key(cx, cy);
    let bucket = this.map.get(k);
    if (!bucket) { bucket = []; this.map.set(k, bucket); }
    bucket.push(obj);
  };

  SpatialHash.prototype.rebuild = function (objects) {
    this.clear();
    for (let i = 0; i < objects.length; i++) this.insert(objects[i]);
  };

  /** Everything within `r` of (x,y). Returns a fresh array. */
  SpatialHash.prototype.query = function (x, y, r) {
    const out = [];
    const minx = Math.floor((x - r) / this.cell), maxx = Math.floor((x + r) / this.cell);
    const miny = Math.floor((y - r) / this.cell), maxy = Math.floor((y + r) / this.cell);
    const r2 = r * r;
    for (let cx = minx; cx <= maxx; cx++) {
      for (let cy = miny; cy <= maxy; cy++) {
        const bucket = this.map.get(this.key(cx, cy));
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i++) {
          const o = bucket[i];
          const dx = o.x - x, dy = o.y - y;
          if (dx * dx + dy * dy <= r2) out.push(o);
        }
      }
    }
    return out;
  };

  NS.SpatialHash = SpatialHash;
})(typeof globalThis !== 'undefined' ? globalThis : this);
