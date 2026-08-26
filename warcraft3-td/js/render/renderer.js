/*
 * Canvas renderer. Draws the baked terrain under a faux-isometric camera
 * transform, then every sprite in painter order (sorted by world Y so tall
 * things overlap correctly), then ground decals, ranges and the day/night tint.
 *
 * Positions are interpolated between the last two fixed ticks using the
 * accumulator remainder, so motion is smooth even though the sim is locked
 * to 60 Hz.
 */
(function (global) {
  'use strict';

  var Config = global.WC3.Config;
  var Sprites = global.WC3.Sprites;
  var Terrain = global.WC3.Terrain;
  var TAU = Math.PI * 2;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function Renderer(canvas, camera) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.camera = camera;
    this.terrain = null;
    this.dpr = 1;
    this.time = 0;
    this._entries = [];
    this._count = 0;
    this.showAllRanges = false;
    this.showDamageText = true;
    this.colorblind = false;
    this.quality = 1;
  }

  Renderer.prototype.setGame = function (game) {
    this.game = game;
    this.terrain = Terrain.bake(game);
    this.minimapTerrain = null;
  };

  Renderer.prototype.resize = function (w, h) {
    var dpr = Math.min(2, (global.devicePixelRatio || 1));
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.camera.resize(w, h);
  };

  Renderer.prototype._entry = function () {
    var e = this._entries[this._count];
    if (!e) {
      e = { y: 0, kind: 0, ref: null, x: 0, sy: 0 };
      this._entries[this._count] = e;
    }
    this._count++;
    return e;
  };

  /** @param {number} alpha 0..1 interpolation factor from the fixed loop */
  Renderer.prototype.render = function (game, alpha, dtReal, ui) {
    var ctx = this.ctx;
    var cam = this.camera;
    this.time += dtReal;
    ui = ui || {};

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#0a0d08';
    ctx.fillRect(0, 0, cam.vw, cam.vh);

    // ---- terrain -------------------------------------------------------
    ctx.save();
    ctx.translate(cam.vw / 2 + cam.shakeX, cam.vh / 2 + cam.offsetY + cam.shakeY);
    ctx.scale(cam.zoom, cam.zoom * cam.tilt);
    ctx.translate(-cam.x, -cam.y);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.terrain.canvas, 0, 0);
    ctx.restore();

    var b = cam.bounds(180);
    var s = cam.zoom;

    // ---- ground decals (under sprites) ---------------------------------
    this.drawGroundDecals(game, ui);

    // ---- sorted sprite pass --------------------------------------------
    this._count = 0;
    var i, e;

    for (i = 0; i < game.decor.length; i++) {
      var d = game.decor[i];
      if (d.x < b.x0 || d.x > b.x1 || d.y < b.y0 || d.y > b.y1) continue;
      e = this._entry(); e.y = d.y; e.kind = 1; e.ref = d;
    }
    e = this._entry(); e.y = game.portal.y; e.kind = 2; e.ref = null;
    e = this._entry(); e.y = game.keep.y; e.kind = 3; e.ref = null;

    for (i = 0; i < game.towers.length; i++) {
      var tw = game.towers[i];
      if (tw.x < b.x0 || tw.x > b.x1 || tw.y < b.y0 || tw.y > b.y1) continue;
      e = this._entry(); e.y = tw.y; e.kind = 4; e.ref = tw;
    }
    for (i = 0; i < game.creeps.length; i++) {
      var c = game.creeps[i];
      if (c.x < b.x0 || c.x > b.x1 || c.y < b.y0 || c.y > b.y1) continue;
      e = this._entry(); e.y = c.y; e.kind = 5; e.ref = c;
    }
    for (i = 0; i < game.fx.length; i++) {
      var f = game.fx[i];
      if (f.kind !== 'corpse') continue;
      e = this._entry(); e.y = f.y - 1; e.kind = 6; e.ref = f;
    }
    if (game.hero) {
      e = this._entry(); e.y = game.hero.y; e.kind = 7; e.ref = game.hero;
    }

    var list = this._entries.slice(0, this._count);
    list.sort(function (a, z) { return a.y - z.y; });

    for (i = 0; i < list.length; i++) {
      var it = list[i];
      switch (it.kind) {
        case 1:
          Sprites.drawDoodad(ctx, it.ref, cam.toScreenX(it.ref.x), cam.toScreenY(it.ref.y),
            s * it.ref.scale, cam.tilt);
          break;
        case 2:
          Sprites.drawPortal(ctx, cam.toScreenX(game.portal.x), cam.toScreenY(game.portal.y),
            s, this.time, cam.tilt);
          break;
        case 3:
          Sprites.drawKeep(ctx, cam.toScreenX(game.keep.x), cam.toScreenY(game.keep.y),
            s, this.time, cam.tilt);
          break;
        case 4:
          Sprites.drawTower(ctx, it.ref, cam.toScreenX(it.ref.x), cam.toScreenY(it.ref.y),
            s, this.time, cam.tilt);
          break;
        case 5: {
          var cr = it.ref;
          var cx = lerp(cr.px !== undefined ? cr.px : cr.x, cr.x, alpha);
          var cy = lerp(cr.py !== undefined ? cr.py : cr.y, cr.y, alpha);
          var cz = lerp(cr.pz !== undefined ? cr.pz : cr.z, cr.z, alpha);
          Sprites.drawCreep(ctx, cr, cam.toScreenX(cx), cam.toScreenY(cy, cz), s,
            this.time, cam.tilt, { showBars: true });
          break;
        }
        case 6:
          Sprites.drawFx(ctx, it.ref, cam.toScreenX(it.ref.x), cam.toScreenY(it.ref.y), s, cam);
          break;
        case 7: {
          var h = it.ref;
          var hx = lerp(h.px !== undefined ? h.px : h.x, h.x, alpha);
          var hy = lerp(h.py !== undefined ? h.py : h.y, h.y, alpha);
          Sprites.drawHero(ctx, h, cam.toScreenX(hx), cam.toScreenY(hy), s, this.time, cam.tilt);
          break;
        }
        default:
          break;
      }
    }

    // ---- projectiles ----------------------------------------------------
    for (i = 0; i < game.projectiles.length; i++) {
      var p = game.projectiles[i];
      if (p.x < b.x0 || p.x > b.x1 || p.y < b.y0 || p.y > b.y1) continue;
      var px = lerp(p.px !== undefined ? p.px : p.x, p.x, alpha);
      var py = lerp(p.py !== undefined ? p.py : p.y, p.y, alpha);
      var pz = lerp(p.pz !== undefined ? p.pz : p.z, p.z, alpha);
      Sprites.drawProjectile(ctx, p, cam.toScreenX(px), cam.toScreenY(py, pz), s);
    }

    // ---- airborne fx -----------------------------------------------------
    for (i = 0; i < game.fx.length; i++) {
      var fx = game.fx[i];
      if (fx.kind === 'corpse') continue;
      if (fx.kind === 'bolt') { Sprites.drawBolt(ctx, fx, cam); continue; }
      if (fx.kind === 'dmgtext' && !this.showDamageText) continue;
      if (fx.x < b.x0 || fx.x > b.x1 || fx.y < b.y0 || fx.y > b.y1) continue;
      Sprites.drawFx(ctx, fx, cam.toScreenX(fx.x), cam.toScreenY(fx.y, fx.z), s, cam);
    }

    // ---- selection & build overlay ---------------------------------------
    this.drawOverlay(game, ui);

    // ---- day / night ------------------------------------------------------
    this.drawTint(game);
  };

  Renderer.prototype.rangeEllipse = function (wx, wy, r, stroke, fill) {
    var ctx = this.ctx;
    var cam = this.camera;
    var x = cam.toScreenX(wx);
    var y = cam.toScreenY(wy);
    ctx.beginPath();
    ctx.ellipse(x, y, r * cam.zoom, r * cam.zoom * cam.tilt, 0, 0, TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  Renderer.prototype.drawGroundDecals = function (game, ui) {
    var ctx = this.ctx;
    var cam = this.camera;
    var i;

    if (this.showAllRanges) {
      for (i = 0; i < game.towers.length; i++) {
        this.rangeEllipse(game.towers[i].x, game.towers[i].y, game.towers[i].def.range,
          'rgba(120,220,140,0.18)', null);
      }
    }

    var sel = ui.selected;
    if (sel && sel.def && sel.def.range && sel.alive) {
      this.rangeEllipse(sel.x, sel.y, sel.def.range, 'rgba(120,255,150,0.75)', 'rgba(90,220,130,0.07)');
    }
    if (ui.hoverTower && ui.hoverTower !== sel && ui.hoverTower.alive) {
      this.rangeEllipse(ui.hoverTower.x, ui.hoverTower.y, ui.hoverTower.def.range,
        'rgba(220,230,255,0.4)', null);
    }

    // Build placement ghost.
    if (ui.buildDef && ui.hoverTile) {
      var tx = ui.hoverTile.tx;
      var ty = ui.hoverTile.ty;
      var ok = game.canBuildAt(tx, ty) && game.gold >= ui.buildDef.gold && game.lumber >= ui.buildDef.lumber;
      var cx = (tx + 0.5) * game.tile;
      var cy = (ty + 0.5) * game.tile;
      this.rangeEllipse(cx, cy, ui.buildDef.range,
        ok ? 'rgba(255,236,150,0.8)' : 'rgba(255,110,90,0.8)',
        ok ? 'rgba(255,236,150,0.08)' : 'rgba(255,80,60,0.10)');

      ctx.save();
      ctx.translate(cam.vw / 2 + cam.shakeX, cam.vh / 2 + cam.offsetY + cam.shakeY);
      ctx.scale(cam.zoom, cam.zoom * cam.tilt);
      ctx.translate(-cam.x, -cam.y);
      ctx.lineWidth = 3 / cam.zoom;
      ctx.strokeStyle = ok ? '#ffe98a' : '#ff6a5a';
      ctx.fillStyle = ok ? 'rgba(255,233,138,0.18)' : 'rgba(255,90,74,0.2)';
      ctx.beginPath();
      ctx.rect(tx * game.tile + 2, ty * game.tile + 2, game.tile - 4, game.tile - 4);
      ctx.fill();
      ctx.stroke();
      if (!ok) {
        ctx.beginPath();
        ctx.moveTo(tx * game.tile + 8, ty * game.tile + 8);
        ctx.lineTo((tx + 1) * game.tile - 8, (ty + 1) * game.tile - 8);
        ctx.moveTo((tx + 1) * game.tile - 8, ty * game.tile + 8);
        ctx.lineTo(tx * game.tile + 8, (ty + 1) * game.tile - 8);
        ctx.stroke();
      }
      ctx.restore();

      ctx.globalAlpha = 0.6;
      Sprites.drawTower(ctx, {
        def: ui.buildDef, angle: 0, fireAnim: 0, buildAnim: 1
      }, cam.toScreenX(cx), cam.toScreenY(cy), cam.zoom, this.time, cam.tilt);
      ctx.globalAlpha = 1;
    }
  };

  Renderer.prototype.drawOverlay = function (game, ui) {
    var ctx = this.ctx;
    var cam = this.camera;
    var sel = ui.selected;
    if (sel && sel.alive) {
      var isCreep = !!sel.def && sel.def.armor !== undefined;
      var r = (sel.radius || 22) * 1.5;
      ctx.strokeStyle = isCreep ? 'rgba(255,90,80,0.95)' : 'rgba(110,255,140,0.95)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(cam.toScreenX(sel.x), cam.toScreenY(sel.y),
        r * cam.zoom, r * cam.zoom * cam.tilt, 0, 0, TAU);
      ctx.stroke();
    }
    if (ui.orderFlash && ui.orderFlash.t > 0) {
      var f = ui.orderFlash;
      ctx.strokeStyle = 'rgba(120,255,160,' + f.t + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cam.toScreenX(f.x), cam.toScreenY(f.y),
        (1 - f.t) * 26 * cam.zoom, (1 - f.t) * 26 * cam.zoom * cam.tilt, 0, 0, TAU);
      ctx.stroke();
    }
  };

  /** Day/night cycle: one full loop every 2 * DAY_NIGHT_WAVES waves. */
  Renderer.prototype.nightFactor = function (game) {
    var period = Config.DAY_NIGHT_WAVES * 2;
    var w = game.waveIndex + (game.waveState === 'prep' ? 0.5 : 0);
    var t = ((w % period) + period) % period / period;
    return (1 - Math.cos(t * TAU)) / 2;
  };

  Renderer.prototype.drawTint = function (game) {
    var n = this.nightFactor(game);
    if (n < 0.02) return;
    var ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(' + Math.round(255 - 105 * n) + ',' +
      Math.round(255 - 95 * n) + ',' + Math.round(255 - 30 * n) + ',1)';
    ctx.fillRect(0, 0, this.camera.vw, this.camera.vh);
    ctx.restore();
    if (n > 0.35) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(40,55,120,' + (0.08 * n) + ')';
      ctx.fillRect(0, 0, this.camera.vw, this.camera.vh);
      ctx.restore();
    }
  };

  global.WC3.Renderer = Renderer;
})(typeof globalThis !== 'undefined' ? globalThis : this);
