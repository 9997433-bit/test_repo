/* World renderer: baked terrain blit + height-sorted sprite pass + effects. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});
  const TAU = Math.PI * 2;

  function Renderer(game, canvas, camera) {
    this.game = game;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cam = camera;
    this.baker = new NS.TerrainBaker(game, camera);
    this.terrain = this.baker.bake();
    this.showRange = true;
    this.hover = null;       // {x,y} tile under the cursor
    this.buildDef = null;    // tower definition being placed
    this.selection = null;
    this.time = 0;
  }

  Renderer.prototype.rebake = function () { this.terrain = this.baker.bake(); };

  /** Day/night tint cycles every 4 waves (DESIGN.md §7). */
  Renderer.prototype.tint = function () {
    const w = Math.max(1, this.game.wave);
    const phase = ((w - 1) % 8) / 8; // 0..1 across two 4-wave cycles
    const night = 0.5 - 0.5 * Math.cos(phase * TAU);
    return { a: night * 0.42, r: 20, g: 30, b: 70, night };
  };

  Renderer.prototype.draw = function () {
    const ctx = this.ctx, cam = this.cam, game = this.game;
    const w = this.canvas.width, h = this.canvas.height;
    this.time = game.time;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (!this._void || this._void.w !== w) {
      const bgg = ctx.createRadialGradient(w * 0.5, h * 0.42, 40, w * 0.5, h * 0.5, Math.max(w, h) * 0.8);
      bgg.addColorStop(0, '#141d2b');
      bgg.addColorStop(0.55, '#0a0f18');
      bgg.addColorStop(1, '#04060a');
      this._void = { w: w, grad: bgg };
    }
    ctx.fillStyle = this._void.grad;
    ctx.fillRect(0, 0, w, h);

    // --- terrain -----------------------------------------------------
    const ox = -cam.x * cam.zoom + w / 2 - this.baker.originX * cam.zoom;
    const oy = -cam.y * cam.zoom + h / 2 - this.baker.originY * cam.zoom;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.terrain, ox, oy, this.terrain.width * cam.zoom, this.terrain.height * cam.zoom);
    ctx.restore();

    // --- ground decals: range circles, build ghost, selection ---------
    this.drawGroundDecals();

    // --- sorted entity pass -------------------------------------------
    const items = [];
    const kp = NS.Config.keepTile, pt = NS.Config.portalTile;
    items.push({ d: pt.x + pt.y - 0.4, kind: 'portal' });
    items.push({ d: kp.x + kp.y, kind: 'keep' });
    for (let i = 0; i < game.towers.length; i++) items.push({ d: game.towers[i].x + game.towers[i].y, kind: 'tower', o: game.towers[i] });
    for (let i = 0; i < game.creeps.length; i++) items.push({ d: game.creeps[i].x + game.creeps[i].y, kind: 'creep', o: game.creeps[i] });
    if (game.hero) items.push({ d: game.hero.x + game.hero.y, kind: 'hero', o: game.hero });
    items.sort((a, b) => a.d - b.d);

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.kind === 'portal') {
        const p = cam.toScreen(pt.x, pt.y, 0);
        if (this.onScreen(p, 160)) NS.Sprites.drawPortal(ctx, p.x, p.y, this.time);
      } else if (it.kind === 'keep') {
        const p = cam.toScreen(kp.x, kp.y, 0);
        if (this.onScreen(p, 200)) NS.Sprites.drawKeep(ctx, p.x, p.y, this.time, game.lives, game.maxLives);
      } else if (it.kind === 'tower') {
        const tw = it.o;
        const p = cam.toScreen(tw.x, tw.y, 0);
        if (!this.onScreen(p, 120)) continue;
        NS.Sprites.drawTower(ctx, p.x, p.y, tw, this.time);
        if (this.selection === tw) this.selectionRing(p.x, p.y, 26, '#4ade80');
      } else if (it.kind === 'creep') {
        const c = it.o;
        const p = cam.toScreen(c.x, c.y, 0);
        if (!this.onScreen(p, 120)) continue;
        NS.Sprites.drawCreep(ctx, p.x, p.y, c, this.time);
        if (c.alive) {
          NS.Sprites.drawCreepStatus(ctx, p.x, p.y, c, game.time);
          NS.Sprites.drawHealthBar(ctx, p.x, p.y, c);
          if (this.selection === c) this.selectionRing(p.x, p.y, 16 + c.radius * 14, '#ef4444');
        }
      } else if (it.kind === 'hero') {
        const hro = it.o;
        const p = cam.toScreen(hro.x, hro.y, 0);
        if (!this.onScreen(p, 120)) continue;
        NS.Sprites.drawHero(ctx, p.x, p.y, hro, this.time);
        if (this.selection === hro) this.selectionRing(p.x, p.y, 20, '#4ade80');
      }
    }

    // --- projectiles ---------------------------------------------------
    for (let i = 0; i < game.projectiles.length; i++) {
      const pr = game.projectiles[i];
      const p = cam.toScreen(pr.x, pr.y, pr.z);
      if (!this.onScreen(p, 60)) continue;
      if (pr.trail.length > 1) {
        ctx.strokeStyle = pr.color;
        ctx.globalAlpha = 0.22;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let j = 0; j < pr.trail.length; j++) {
          const tp = cam.toScreen(pr.trail[j].x, pr.trail[j].y, pr.trail[j].z);
          if (j === 0) ctx.moveTo(tp.x, tp.y); else ctx.lineTo(tp.x, tp.y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      NS.Sprites.drawProjectile(ctx, p.x, p.y, pr);
    }

    this.drawFx();

    // --- day / night ----------------------------------------------------
    const tn = this.tint();
    if (tn.a > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(' + (255 - tn.a * 180) + ',' + (255 - tn.a * 160) + ',255,1)';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = tn.a * 0.5;
      ctx.fillStyle = 'rgba(30,40,110,1)';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
    // vignette keeps the eye on the board
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  };

  Renderer.prototype.onScreen = function (p, pad) {
    return p.x > -pad && p.x < this.canvas.width + pad && p.y > -pad && p.y < this.canvas.height + pad;
  };

  Renderer.prototype.isoEllipse = function (cx, cy, radiusTiles) {
    const ctx = this.ctx, cam = this.cam;
    ctx.beginPath();
    ctx.ellipse(cx, cy, radiusTiles * cam.hw * cam.zoom, radiusTiles * cam.hh * cam.zoom, 0, 0, TAU);
  };

  Renderer.prototype.selectionRing = function (x, y, r, color) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.lineDashOffset = -this.time * 14;
    ctx.beginPath();
    ctx.ellipse(x, y + 1, r, r * 0.5, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  };

  Renderer.prototype.drawGroundDecals = function () {
    const ctx = this.ctx, cam = this.cam, game = this.game;

    // range circle for the selected / hovered tower
    const showFor = this.selection && this.selection.def && this.selection.def.range ? this.selection : null;
    if (this.showRange && showFor) {
      const p = cam.toScreen(showFor.x, showFor.y, 0);
      ctx.save();
      ctx.fillStyle = 'rgba(120,200,255,' + NS.Config.ui.rangeCircleAlpha * 0.5 + ')';
      this.isoEllipse(p.x, p.y, showFor.def.range); ctx.fill();
      ctx.strokeStyle = 'rgba(160,220,255,0.85)'; ctx.lineWidth = 2;
      this.isoEllipse(p.x, p.y, showFor.def.range); ctx.stroke();
      ctx.restore();
    }

    // build ghost
    if (this.buildDef && this.hover) {
      const tx = this.hover.x, ty = this.hover.y;
      const ok = game.isBuildable(tx, ty) && game.canAfford(this.buildDef);
      const p = cam.toScreen(tx + 0.5, ty + 0.5, 0);
      ctx.save();
      ctx.fillStyle = ok ? 'rgba(90,220,120,0.20)' : 'rgba(230,70,60,0.22)';
      this.isoEllipse(p.x, p.y, this.buildDef.range); ctx.fill();
      ctx.strokeStyle = ok ? 'rgba(130,255,160,0.9)' : 'rgba(255,110,90,0.9)';
      ctx.lineWidth = 2;
      this.isoEllipse(p.x, p.y, this.buildDef.range); ctx.stroke();

      // tile marker
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - cam.hh * cam.zoom);
      ctx.lineTo(p.x + cam.hw * cam.zoom, p.y);
      ctx.lineTo(p.x, p.y + cam.hh * cam.zoom);
      ctx.lineTo(p.x - cam.hw * cam.zoom, p.y);
      ctx.closePath();
      ctx.fillStyle = ok ? 'rgba(90,230,120,0.35)' : 'rgba(235,80,60,0.35)';
      ctx.fill();
      ctx.strokeStyle = ok ? '#8cffb0' : '#ff8a70';
      ctx.stroke();

      ctx.globalAlpha = 0.75;
      const ghost = { def: this.buildDef, x: tx + 0.5, y: ty + 0.5, angle: 0, recoil: 0, buildAnim: 0 };
      NS.Sprites.drawTower(ctx, p.x, p.y, ghost, this.time);
      ctx.globalAlpha = 1;
      if (!ok) {
        ctx.strokeStyle = '#ff5544'; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(p.x - 14, p.y - 34); ctx.lineTo(p.x + 14, p.y - 6);
        ctx.moveTo(p.x + 14, p.y - 34); ctx.lineTo(p.x - 14, p.y - 6);
        ctx.stroke();
      }
      ctx.restore();
    } else if (this.hover && game.isBuildable(this.hover.x, this.hover.y)) {
      const p = cam.toScreen(this.hover.x + 0.5, this.hover.y + 0.5, 0);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,235,160,0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - cam.hh * cam.zoom);
      ctx.lineTo(p.x + cam.hw * cam.zoom, p.y);
      ctx.lineTo(p.x, p.y + cam.hh * cam.zoom);
      ctx.lineTo(p.x - cam.hw * cam.zoom, p.y);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    // hero ability areas
    if (game.hero && game.hero.storm && !game.hero.dead) {
      const p = cam.toScreen(game.hero.x, game.hero.y, 0);
      ctx.save();
      ctx.fillStyle = 'rgba(255,220,150,0.12)';
      this.isoEllipse(p.x, p.y, game.hero.storm.radius); ctx.fill();
      ctx.restore();
    }
  };

  Renderer.prototype.drawFx = function () {
    const ctx = this.ctx, cam = this.cam, fx = this.game.fx;

    for (let i = 0; i < fx.bolts.length; i++) {
      const b = fx.bolts[i];
      const a = cam.toScreen(b.ax, b.ay, (b.az || 0) + 0.5);
      const c = cam.toScreen(b.bx, b.by, (b.bz || 0) + 0.5);
      const k = 1 - b.age / b.life;
      ctx.save();
      ctx.globalAlpha = k;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 3.2;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      const steps = 6;
      for (let s = 1; s < steps; s++) {
        const tt = s / steps;
        const jx = (Math.sin(b.seed + s * 3.1) * 12) * (1 - Math.abs(tt - 0.5) * 2);
        const jy = (Math.cos(b.seed + s * 2.3) * 8) * (1 - Math.abs(tt - 0.5) * 2);
        ctx.lineTo(a.x + (c.x - a.x) * tt + jx, a.y + (c.y - a.y) * tt + jy);
      }
      ctx.lineTo(c.x, c.y);
      ctx.stroke();
      ctx.restore();
    }

    for (let i = 0; i < fx.rings.length; i++) {
      const r = fx.rings[i];
      const k = r.age / r.life;
      const p = cam.toScreen(r.x, r.y, r.z);
      ctx.save();
      ctx.globalAlpha = (1 - k) * 0.8;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 3 * (1 - k) + 1;
      this.isoEllipse(p.x, p.y, r.r0 + (r.r1 - r.r0) * k);
      ctx.stroke();
      ctx.restore();
    }

    for (let i = 0; i < fx.particles.length; i++) {
      const pa = fx.particles[i];
      const p = cam.toScreen(pa.x, pa.y, pa.z);
      const k = 1 - pa.age / pa.life;
      ctx.globalAlpha = Math.max(0, k);
      ctx.fillStyle = pa.color;
      ctx.fillRect(p.x - pa.size / 2, p.y - pa.size / 2, pa.size, pa.size);
    }
    ctx.globalAlpha = 1;

    for (let i = 0; i < fx.texts.length; i++) {
      const t = fx.texts[i];
      const p = cam.toScreen(t.x, t.y, t.z);
      const k = 1 - t.age / t.life;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, k * 1.6));
      ctx.font = 'bold ' + t.size + 'px "Trebuchet MS", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.strokeText(t.str, p.x, p.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, p.x, p.y);
      ctx.restore();
    }
  };

  NS.Renderer = Renderer;
})(typeof globalThis !== 'undefined' ? globalThis : this);
