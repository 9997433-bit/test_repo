/*
 * Ornate minimap: a downscaled bake of the terrain plus live unit blips and
 * the camera viewport rectangle. Click or drag to jump the camera.
 */
(function (global) {
  'use strict';

  function Minimap(canvas, game, camera) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;
    this.camera = camera;
    this.thumb = null;
    this.dragging = false;
    this.bind();
  }

  Minimap.prototype.setTerrain = function (baked) {
    this.thumb = global.WC3.Terrain.thumbnail(baked, this.canvas.width, this.canvas.height);
  };

  Minimap.prototype.setGame = function (game) {
    this.game = game;
  };

  Minimap.prototype.toWorld = function (ev) {
    var r = this.canvas.getBoundingClientRect();
    var x = (ev.clientX - r.left) / r.width;
    var y = (ev.clientY - r.top) / r.height;
    return { x: x * this.game.worldW, y: y * this.game.worldH };
  };

  Minimap.prototype.bind = function () {
    var self = this;
    var jump = function (ev) {
      var w = self.toWorld(ev);
      self.camera.centerOn(w.x, w.y);
    };
    this.canvas.addEventListener('pointerdown', function (ev) {
      ev.preventDefault();
      self.dragging = true;
      self.canvas.setPointerCapture(ev.pointerId);
      jump(ev);
    });
    this.canvas.addEventListener('pointermove', function (ev) {
      if (self.dragging) jump(ev);
    });
    this.canvas.addEventListener('pointerup', function () { self.dragging = false; });
    this.canvas.addEventListener('pointercancel', function () { self.dragging = false; });
  };

  Minimap.prototype.draw = function () {
    var g = this.game;
    var ctx = this.ctx;
    var W = this.canvas.width;
    var H = this.canvas.height;
    var sx = W / g.worldW;
    var sy = H / g.worldH;

    if (this.thumb) ctx.drawImage(this.thumb, 0, 0, W, H);
    else { ctx.fillStyle = '#233318'; ctx.fillRect(0, 0, W, H); }

    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, 0, W, H);

    var i;
    // Portal & keep landmarks.
    dot(ctx, g.portal.x * sx, g.portal.y * sy, 3.5, '#c79bff');
    dot(ctx, g.keep.x * sx, g.keep.y * sy, 4, '#7fc6ff');

    ctx.fillStyle = '#6fe08a';
    for (i = 0; i < g.towers.length; i++) {
      ctx.fillRect(g.towers[i].x * sx - 1.5, g.towers[i].y * sy - 1.5, 3, 3);
    }
    for (i = 0; i < g.creeps.length; i++) {
      var c = g.creeps[i];
      dot(ctx, c.x * sx, c.y * sy, c.boss ? 3.5 : 2, c.flying ? '#ffb469' : '#e0524a');
    }
    if (g.hero) dot(ctx, g.hero.x * sx, g.hero.y * sy, 3.2, '#ffe37a');

    // Camera rectangle.
    var b = this.camera.bounds(0);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      Math.round(b.x0 * sx) + 0.5, Math.round(b.y0 * sy) + 0.5,
      Math.round((b.x1 - b.x0) * sx), Math.round((b.y1 - b.y0) * sy)
    );
  };

  function dot(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  global.WC3.Minimap = Minimap;
})(typeof globalThis !== 'undefined' ? globalThis : this);
