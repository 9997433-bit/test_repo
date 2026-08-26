/*
 * Faux-isometric camera: uniform zoom on X, squashed on Y (tilt), plus an
 * optional per-sprite height lift. Handles pan (keys / drag / screen edge),
 * wheel zoom anchored at the cursor, clamping and screen<->world transforms.
 */
(function (global) {
  'use strict';

  var Config = global.WC3.Config;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  function Camera(worldW, worldH) {
    var c = Config.CAMERA;
    this.worldW = worldW;
    this.worldH = worldH;
    this.tilt = c.tilt;
    this.zoom = c.startZoom;
    this.minZoom = c.minZoom;
    this.maxZoom = c.maxZoom;
    this.x = worldW / 2;
    this.y = worldH / 2;
    this.vw = 1280;
    this.vh = 720;
    this.shake = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.edgePan = true;
  }

  Camera.prototype.resize = function (w, h) {
    this.vw = w;
    this.vh = h;
    // Never let the viewport show more than the world plus a small margin.
    var fitX = w / (this.worldW + 160);
    var fitY = h / ((this.worldH + 160) * this.tilt);
    this.minZoom = Math.max(Config.CAMERA.minZoom, Math.min(fitX, fitY));
    this.zoom = clamp(this.zoom, this.minZoom, this.maxZoom);
    this.clamp();
  };

  Camera.prototype.clamp = function () {
    var halfW = this.vw / (2 * this.zoom);
    var halfH = this.vh / (2 * this.zoom * this.tilt);
    var margin = 90;
    var minX = -margin + halfW;
    var maxX = this.worldW + margin - halfW;
    var minY = -margin + halfH;
    var maxY = this.worldH + margin - halfH;
    this.x = (minX > maxX) ? this.worldW / 2 : clamp(this.x, minX, maxX);
    this.y = (minY > maxY) ? this.worldH / 2 : clamp(this.y, minY, maxY);
  };

  Camera.prototype.setZoom = function (z, anchorSx, anchorSy) {
    var newZoom = clamp(z, this.minZoom, this.maxZoom);
    if (newZoom === this.zoom) return;
    if (anchorSx === undefined) {
      this.zoom = newZoom;
      this.clamp();
      return;
    }
    var before = this.toWorld(anchorSx, anchorSy);
    this.zoom = newZoom;
    var after = this.toWorld(anchorSx, anchorSy);
    this.x += before.x - after.x;
    this.y += before.y - after.y;
    this.clamp();
  };

  Camera.prototype.zoomBy = function (factor, sx, sy) {
    this.setZoom(this.zoom * factor, sx, sy);
  };

  Camera.prototype.moveBy = function (dx, dy) {
    this.x += dx;
    this.y += dy;
    this.clamp();
  };

  Camera.prototype.centerOn = function (wx, wy) {
    this.x = wx;
    this.y = wy;
    this.clamp();
  };

  Camera.prototype.toScreenX = function (wx) {
    return (wx - this.x) * this.zoom + this.vw / 2 + this.shakeX;
  };

  Camera.prototype.toScreenY = function (wy, lift) {
    return ((wy - this.y) * this.tilt - (lift || 0)) * this.zoom + this.vh / 2 + this.shakeY;
  };

  Camera.prototype.toScreen = function (wx, wy, lift) {
    return { x: this.toScreenX(wx), y: this.toScreenY(wy, lift) };
  };

  Camera.prototype.toWorld = function (sx, sy) {
    return {
      x: (sx - this.vw / 2 - this.shakeX) / this.zoom + this.x,
      y: (sy - this.vh / 2 - this.shakeY) / (this.zoom * this.tilt) + this.y
    };
  };

  /** World-space AABB currently visible, padded for tall sprites. */
  Camera.prototype.bounds = function (pad) {
    var p = pad || 0;
    var halfW = this.vw / (2 * this.zoom);
    var halfH = this.vh / (2 * this.zoom * this.tilt);
    return {
      x0: this.x - halfW - p,
      x1: this.x + halfW + p,
      y0: this.y - halfH - p,
      y1: this.y + halfH + p
    };
  };

  Camera.prototype.addShake = function (amount) {
    this.shake = Math.min(14, this.shake + amount);
  };

  /**
   * Frame update. Uses real (unscaled) frame time so camera feel is unaffected
   * by game speed or pause.
   */
  Camera.prototype.update = function (dtReal, input) {
    var pan = Config.CAMERA.panSpeed * dtReal / this.zoom;
    var dx = 0;
    var dy = 0;
    if (input) {
      if (input.isDown('KeyA') || input.isDown('ArrowLeft')) dx -= 1;
      if (input.isDown('KeyD') || input.isDown('ArrowRight')) dx += 1;
      if (input.isDown('KeyW') || input.isDown('ArrowUp')) dy -= 1;
      if (input.isDown('KeyS') || input.isDown('ArrowDown')) dy += 1;
      if (this.edgePan && input.pointerInside && !input.dragging) {
        var m = Config.CAMERA.edgePanMargin;
        if (input.sx <= m) dx -= 1;
        if (input.sx >= this.vw - m) dx += 1;
        if (input.sy <= m) dy -= 1;
        if (input.sy >= this.vh - m) dy += 1;
      }
    }
    if (dx || dy) {
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      this.moveBy((dx / len) * pan, (dy / len) * pan / this.tilt);
    }

    if (this.shake > 0.01) {
      this.shake *= Math.pow(0.02, dtReal);
      var a = (Math.random() * Math.PI * 2);
      this.shakeX = Math.cos(a) * this.shake;
      this.shakeY = Math.sin(a) * this.shake * 0.6;
    } else {
      this.shake = 0;
      this.shakeX = 0;
      this.shakeY = 0;
    }
  };

  global.WC3.Camera = Camera;

  if (typeof module === 'object' && module.exports) module.exports = Camera;
})(typeof globalThis !== 'undefined' ? globalThis : this);
