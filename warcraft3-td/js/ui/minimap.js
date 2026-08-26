/* Ornate minimap: terrain, road, towers, creeps, hero and the camera rect. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});

  function Minimap(app) {
    this.app = app;
    this.canvas = root.document.getElementById('minimap');
    this.ctx = this.canvas.getContext('2d');
    this.base = null;
    this.bake();
    const self = this;
    const jump = function (e) {
      const r = self.canvas.getBoundingClientRect();
      const p = self.toWorld(
        (e.clientX - r.left) * (self.canvas.width / r.width),
        (e.clientY - r.top) * (self.canvas.height / r.height)
      );
      app.cam.centerOn(p.x, p.y);
    };
    this.canvas.addEventListener('mousedown', function (e) { jump(e); self.dragging = true; });
    root.addEventListener('mouseup', function () { self.dragging = false; });
    this.canvas.addEventListener('mousemove', function (e) { if (self.dragging) jump(e); });
  }

  Minimap.prototype.scale = function () {
    const g = NS.Config.grid;
    return Math.min(this.canvas.width / g.cols, this.canvas.height / g.rows);
  };
  Minimap.prototype.toScreen = function (wx, wy) {
    const s = this.scale(), g = NS.Config.grid;
    return {
      x: wx * s + (this.canvas.width - g.cols * s) / 2,
      y: wy * s + (this.canvas.height - g.rows * s) / 2
    };
  };
  Minimap.prototype.toWorld = function (sx, sy) {
    const s = this.scale(), g = NS.Config.grid;
    return {
      x: (sx - (this.canvas.width - g.cols * s) / 2) / s,
      y: (sy - (this.canvas.height - g.rows * s) / 2) / s
    };
  };

  Minimap.prototype.bake = function () {
    const g = NS.Config.grid, game = this.app.game;
    const cv = root.document.createElement('canvas');
    cv.width = this.canvas.width; cv.height = this.canvas.height;
    const ctx = cv.getContext('2d');
    const s = this.scale();
    ctx.fillStyle = '#0a0e08';
    ctx.fillRect(0, 0, cv.width, cv.height);
    for (let y = 0; y < g.rows; y++) {
      for (let x = 0; x < g.cols; x++) {
        const d = game.path.distanceTo(x + 0.5, y + 0.5);
        const p = this.toScreen(x, y);
        const n = NS.noise.valueNoise(x * 0.6, y * 0.6, 11);
        ctx.fillStyle = d < NS.Config.pathWidth
          ? NS.noise.rgb(NS.noise.mix([120, 94, 60], [92, 72, 46], n))
          : NS.noise.rgb(NS.noise.mix([44, 74, 38], [76, 106, 52], n));
        ctx.fillRect(p.x, p.y, s + 0.6, s + 0.6);
      }
    }
    game.decor.forEach((d) => {
      const p = this.toScreen(d.x - 0.5, d.y - 0.5);
      ctx.fillStyle = d.kind === 'rock' ? 'rgba(140,145,150,0.8)' : 'rgba(30,60,26,0.85)';
      ctx.fillRect(p.x, p.y, s, s);
    });
    this.base = cv;
  };

  Minimap.prototype.draw = function () {
    const ctx = this.ctx, app = this.app, game = app.game;
    const s = this.scale();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.base, 0, 0);

    // portal + keep
    const pp = this.toScreen(NS.Config.portalTile.x, NS.Config.portalTile.y);
    ctx.fillStyle = '#b07cff';
    ctx.beginPath(); ctx.arc(pp.x, pp.y, 3.5, 0, 6.283); ctx.fill();
    const kp = this.toScreen(NS.Config.keepTile.x, NS.Config.keepTile.y);
    ctx.fillStyle = '#ffd24a';
    ctx.fillRect(kp.x - 3.5, kp.y - 3.5, 7, 7);

    for (let i = 0; i < game.towers.length; i++) {
      const tw = game.towers[i];
      const p = this.toScreen(tw.x, tw.y);
      ctx.fillStyle = NS.Sprites.RACE_TRIM[tw.def.race] || '#fff';
      ctx.fillRect(p.x - 1.6, p.y - 1.6, 3.2, 3.2);
    }
    for (let i = 0; i < game.creeps.length; i++) {
      const c = game.creeps[i];
      if (!c.alive) continue;
      const p = this.toScreen(c.x, c.y);
      ctx.fillStyle = c.boss ? '#ff4d3d' : (c.flying ? '#ffa64d' : '#ff6a5a');
      const r = c.boss ? 3.2 : 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.283); ctx.fill();
    }
    if (game.hero && !game.hero.dead) {
      const p = this.toScreen(game.hero.x, game.hero.y);
      ctx.fillStyle = '#ffe07a';
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 6.283); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
    }

    // camera rectangle
    const rect = app.cam.viewRect();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    rect.forEach((pt, i) => {
      const p = this.toScreen(pt.x, pt.y);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.stroke();
    void s;
  };

  NS.Minimap = Minimap;
})(typeof globalThis !== 'undefined' ? globalThis : this);
