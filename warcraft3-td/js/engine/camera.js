/* Faux-isometric camera: tile space -> screen space, panning and clamping. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});

  const Z_SCALE = 26; // pixels of screen lift per tile of altitude

  function Camera() {
    const g = NS.Config.grid, tl = NS.Config.tile;
    this.hw = tl.hw; this.hh = tl.hh; this.zScale = Z_SCALE;
    this.zoom = 1.1;
    this.vw = 1280; this.vh = 720;
    // iso extents of the whole board
    this.minSx = -g.rows * this.hw; this.maxSx = g.cols * this.hw;
    this.minSy = 0; this.maxSy = (g.cols + g.rows) * this.hh;
    this.x = (this.minSx + this.maxSx) / 2;
    this.y = (this.minSy + this.maxSy) / 2;
  }

  Camera.prototype.resize = function (w, h) { this.vw = w; this.vh = h; this.clamp(); };

  Camera.prototype.isoX = function (wx, wy) { return (wx - wy) * this.hw; };
  Camera.prototype.isoY = function (wx, wy, wz) { return (wx + wy) * this.hh - (wz || 0) * this.zScale; };

  /** Tile/world coordinates -> canvas pixels. */
  Camera.prototype.toScreen = function (wx, wy, wz) {
    return {
      x: (this.isoX(wx, wy) - this.x) * this.zoom + this.vw / 2,
      y: (this.isoY(wx, wy, wz) - this.y) * this.zoom + this.vh / 2
    };
  };

  /** Canvas pixels -> ground-plane world coordinates. */
  Camera.prototype.toWorld = function (sx, sy) {
    const u = (sx - this.vw / 2) / this.zoom + this.x;
    const v = (sy - this.vh / 2) / this.zoom + this.y;
    return { x: (u / this.hw + v / this.hh) / 2, y: (v / this.hh - u / this.hw) / 2 };
  };

  /** Depth key for painter's-algorithm sorting. */
  Camera.prototype.depth = function (wx, wy) { return wx + wy; };

  Camera.prototype.pan = function (dx, dy) { this.x += dx; this.y += dy; this.clamp(); };

  Camera.prototype.centerOn = function (wx, wy) {
    this.x = this.isoX(wx, wy);
    this.y = this.isoY(wx, wy, 0);
    this.clamp();
  };

  Camera.prototype.clamp = function () {
    const halfW = this.vw / (2 * this.zoom), halfH = this.vh / (2 * this.zoom);
    const padX = 120, padY = 90;
    const loX = this.minSx - padX + halfW, hiX = this.maxSx + padX - halfW;
    const loY = this.minSy - padY + halfH, hiY = this.maxSy + padY - halfH;
    this.x = loX > hiX ? (loX + hiX) / 2 : Math.max(loX, Math.min(hiX, this.x));
    this.y = loY > hiY ? (loY + hiY) / 2 : Math.max(loY, Math.min(hiY, this.y));
  };

  /** Rectangle of the board currently on screen, in world tiles (for the minimap). */
  Camera.prototype.viewRect = function () {
    const a = this.toWorld(0, 0), b = this.toWorld(this.vw, 0);
    const c = this.toWorld(this.vw, this.vh), d = this.toWorld(0, this.vh);
    return [a, b, c, d];
  };

  NS.Camera = Camera;
  NS.Z_SCALE = Z_SCALE;
})(typeof globalThis !== 'undefined' ? globalThis : this);
