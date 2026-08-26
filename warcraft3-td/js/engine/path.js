/*
 * Polyline path used by ground creeps, plus the straight-line "flying bypass"
 * used by air creeps. Distances are pre-integrated so sampling is O(log n).
 */
(function (global) {
  'use strict';

  function Path(points) {
    if (!points || points.length < 2) {
      throw new Error('Path needs at least two points');
    }
    this.points = points.map(function (p) {
      return Array.isArray(p) ? { x: p[0], y: p[1] } : { x: p.x, y: p.y };
    });
    this.segments = [];
    this.cum = [0];
    var total = 0;
    for (var i = 0; i < this.points.length - 1; i++) {
      var a = this.points[i];
      var b = this.points[i + 1];
      var dx = b.x - a.x;
      var dy = b.y - a.y;
      var len = Math.sqrt(dx * dx + dy * dy);
      if (len <= 1e-9) continue;
      this.segments.push({
        ax: a.x, ay: a.y, bx: b.x, by: b.y,
        dx: dx, dy: dy, len: len,
        ux: dx / len, uy: dy / len,
        angle: Math.atan2(dy, dx),
        start: total
      });
      total += len;
      this.cum.push(total);
    }
    if (this.segments.length === 0) throw new Error('Path has zero length');
    this.length = total;
  }

  /** Convenience: build a path from [tx,ty] tile coords at a given tile size. */
  Path.fromTiles = function (tiles, tileSize) {
    var half = tileSize / 2;
    return new Path(tiles.map(function (t) {
      return { x: t[0] * tileSize + half, y: t[1] * tileSize + half };
    }));
  };

  /** Straight two-point path — the flying bypass. */
  Path.straight = function (from, to) {
    return new Path([from, to]);
  };

  Path.prototype.segmentIndexAt = function (dist) {
    if (dist <= 0) return 0;
    if (dist >= this.length) return this.segments.length - 1;
    var lo = 0;
    var hi = this.segments.length - 1;
    while (lo < hi) {
      var mid = (lo + hi + 1) >> 1;
      if (this.segments[mid].start <= dist) lo = mid; else hi = mid - 1;
    }
    return lo;
  };

  /**
   * Sample the polyline. `out` is reused to keep the hot loop allocation-free.
   * Distances past the end clamp to the final point (the keep).
   */
  Path.prototype.sample = function (dist, out) {
    var o = out || { x: 0, y: 0, angle: 0, seg: 0 };
    var d = dist;
    if (d < 0) d = 0;
    if (d > this.length) d = this.length;
    var i = this.segmentIndexAt(d);
    var s = this.segments[i];
    var t = d - s.start;
    o.x = s.ax + s.ux * t;
    o.y = s.ay + s.uy * t;
    o.angle = s.angle;
    o.seg = i;
    return o;
  };

  Path.prototype.pointAt = function (dist) {
    return this.sample(dist, null);
  };

  Path.prototype.progress = function (dist) {
    return Math.max(0, Math.min(1, dist / this.length));
  };

  Path.prototype.start = function () { return this.pointAt(0); };
  Path.prototype.end = function () { return this.pointAt(this.length); };

  /** Shortest distance from an arbitrary point to the polyline. */
  Path.prototype.distanceTo = function (px, py) {
    var best = Infinity;
    for (var i = 0; i < this.segments.length; i++) {
      var s = this.segments[i];
      var t = ((px - s.ax) * s.dx + (py - s.ay) * s.dy) / (s.len * s.len);
      if (t < 0) t = 0; else if (t > 1) t = 1;
      var qx = s.ax + s.dx * t;
      var qy = s.ay + s.dy * t;
      var ddx = px - qx;
      var ddy = py - qy;
      var d2 = ddx * ddx + ddy * ddy;
      if (d2 < best) best = d2;
    }
    return Math.sqrt(best);
  };

  /** Path distance of the nearest point on the polyline (for ordering). */
  Path.prototype.projectDistance = function (px, py) {
    var best = Infinity;
    var bestDist = 0;
    for (var i = 0; i < this.segments.length; i++) {
      var s = this.segments[i];
      var t = ((px - s.ax) * s.dx + (py - s.ay) * s.dy) / (s.len * s.len);
      if (t < 0) t = 0; else if (t > 1) t = 1;
      var qx = s.ax + s.dx * t;
      var qy = s.ay + s.dy * t;
      var d2 = (px - qx) * (px - qx) + (py - qy) * (py - qy);
      if (d2 < best) { best = d2; bestDist = s.start + s.len * t; }
    }
    return bestDist;
  };

  /** Every tile whose centre lies within `clearance` of the road. */
  Path.prototype.coveredTiles = function (tileSize, gridW, gridH, clearance) {
    var out = [];
    var half = tileSize / 2;
    for (var ty = 0; ty < gridH; ty++) {
      for (var tx = 0; tx < gridW; tx++) {
        if (this.distanceTo(tx * tileSize + half, ty * tileSize + half) <= clearance) {
          out.push({ tx: tx, ty: ty });
        }
      }
    }
    return out;
  };

  global.WC3 = global.WC3 || {};
  global.WC3.Path = Path;

  if (typeof module === 'object' && module.exports) module.exports = Path;
})(typeof globalThis !== 'undefined' ? globalThis : this);
