/* Creep path: polyline walk for ground units, straight bypass for flyers. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});

  function Path(points) {
    this.points = points.map((p) => ({ x: p.x, y: p.y }));
    this.segments = [];
    let acc = 0;
    for (let i = 0; i < this.points.length - 1; i++) {
      const a = this.points[i], b = this.points[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      this.segments.push({ a, b, dx, dy, len, ux: dx / len, uy: dy / len, start: acc });
      acc += len;
    }
    this.length = acc;
  }

  /** World position at arc-length `d` along the road. Clamped at both ends. */
  Path.prototype.positionAt = function (d) {
    if (d <= 0) { const s = this.segments[0]; return { x: s.a.x, y: s.a.y }; }
    if (d >= this.length) { const s = this.segments[this.segments.length - 1]; return { x: s.b.x, y: s.b.y }; }
    for (let i = 0; i < this.segments.length; i++) {
      const s = this.segments[i];
      if (d <= s.start + s.len) {
        const k = d - s.start;
        return { x: s.a.x + s.ux * k, y: s.a.y + s.uy * k };
      }
    }
    const last = this.segments[this.segments.length - 1];
    return { x: last.b.x, y: last.b.y };
  };

  /** Unit heading at arc-length `d`. */
  Path.prototype.directionAt = function (d) {
    const dd = Math.max(0, Math.min(this.length - 0.001, d));
    for (let i = 0; i < this.segments.length; i++) {
      const s = this.segments[i];
      if (dd <= s.start + s.len) return { x: s.ux, y: s.uy };
    }
    const last = this.segments[this.segments.length - 1];
    return { x: last.ux, y: last.uy };
  };

  /** Shortest distance from a point to the road centre-line. */
  Path.prototype.distanceTo = function (x, y) {
    let best = Infinity;
    for (let i = 0; i < this.segments.length; i++) {
      const s = this.segments[i];
      let tt = ((x - s.a.x) * s.dx + (y - s.a.y) * s.dy) / (s.len * s.len);
      tt = Math.max(0, Math.min(1, tt));
      const px = s.a.x + s.dx * tt, py = s.a.y + s.dy * tt;
      const d = Math.hypot(x - px, y - py);
      if (d < best) best = d;
    }
    return best;
  };

  /** Straight-line "air corridor" used by flying creeps. */
  function FlyPath(from, to) {
    return new Path([from, to]);
  }

  NS.Path = Path;
  NS.FlyPath = FlyPath;
})(typeof globalThis !== 'undefined' ? globalThis : this);
