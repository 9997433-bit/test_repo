/* Bakes the whole board (painted grass, dirt road, cliffs, doodads, portal and
 * keep) into one offscreen canvas that the renderer blits every frame. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});

  function hash2(x, y, seed) {
    let h = x * 374761393 + y * 668265263 + (seed || 0) * 2147483647;
    h = (h ^ (h >> 13)) * 1274126177;
    return ((h ^ (h >> 16)) >>> 0) / 4294967296;
  }

  function valueNoise(x, y, seed) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
    const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  }

  function mix(c1, c2, k) {
    return [
      Math.round(c1[0] + (c2[0] - c1[0]) * k),
      Math.round(c1[1] + (c2[1] - c1[1]) * k),
      Math.round(c1[2] + (c2[2] - c1[2]) * k)
    ];
  }
  function rgb(c) { return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; }

  const GRASS_A = [58, 92, 46];
  const GRASS_B = [92, 126, 62];
  const GRASS_C = [40, 68, 38];
  const DIRT_A = [122, 96, 62];
  const DIRT_B = [96, 74, 48];
  const DIRT_EDGE = [70, 56, 36];

  function TerrainBaker(game, camera) {
    this.game = game;
    this.cam = camera;
    this.canvas = null;
    this.originX = 0;
    this.originY = 0;
  }

  /** Iso diamond for tile (x,y) in baked-canvas pixels. */
  TerrainBaker.prototype.tilePath = function (ctx, x, y) {
    const hw = this.cam.hw, hh = this.cam.hh;
    const cx = (x - y) * hw + this.originX;
    const cy = (x + y) * hh + this.originY;
    ctx.beginPath();
    ctx.moveTo(cx, cy - hh);
    ctx.lineTo(cx + hw, cy);
    ctx.lineTo(cx, cy + hh);
    ctx.lineTo(cx - hw, cy);
    ctx.closePath();
    return { cx, cy };
  };

  TerrainBaker.prototype.bake = function () {
    const g = NS.Config.grid, hw = this.cam.hw, hh = this.cam.hh;
    const w = (g.cols + g.rows) * hw + 4;
    const h = (g.cols + g.rows) * hh + 220;
    const cv = root.document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    this.originX = g.rows * hw;
    this.originY = 120;

    ctx.clearRect(0, 0, w, h);

    const path = this.game.path;
    const pw = NS.Config.pathWidth;

    // cliff skirt so the board reads as a solid slab instead of floating art
    const depth = 30;
    const corners = [[0, 0], [g.cols, 0], [g.cols, g.rows], [0, g.rows]]
      .map((c) => this.project(c[0], c[1], 0));
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.75)';
    ctx.shadowBlur = 26;
    ctx.shadowOffsetY = 12;
    const skirt = ctx.createLinearGradient(0, this.originY, 0, this.originY + (g.cols + g.rows) * hh + depth);
    skirt.addColorStop(0, '#3b3126');
    skirt.addColorStop(0.75, '#241d16');
    skirt.addColorStop(1, '#120e0a');
    ctx.fillStyle = skirt;
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    ctx.lineTo(corners[1].x, corners[1].y);
    ctx.lineTo(corners[1].x, corners[1].y + depth);
    ctx.lineTo(corners[2].x, corners[2].y + depth);
    ctx.lineTo(corners[3].x, corners[3].y + depth);
    ctx.lineTo(corners[3].x, corners[3].y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // rock striations on the cliff face
    ctx.save();
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 260; i++) {
      const tx = hash2(i, 3, 77) * g.cols;
      const ty = hash2(i, 9, 41) * g.rows;
      const edge = Math.min(tx, ty, g.cols - tx, g.rows - ty);
      if (edge > 0.3) continue;
      const p = this.project(tx, ty, 0);
      ctx.fillStyle = hash2(i, 1, 5) > 0.5 ? '#4a3f31' : '#191410';
      ctx.fillRect(p.x - 2, p.y, 3, 4 + hash2(i, 2, 8) * depth);
    }
    ctx.restore();

    for (let y = 0; y < g.rows; y++) {
      for (let x = 0; x < g.cols; x++) {
        const cx = x + 0.5, cy = y + 0.5;
        const d = path.distanceTo(cx, cy);
        const onRoad = d < pw;
        const n = valueNoise(x * 0.55, y * 0.55, 11);
        const n2 = valueNoise(x * 1.9, y * 1.9, 23);

        let base;
        if (onRoad) {
          base = mix(DIRT_A, DIRT_B, n * 0.8 + n2 * 0.2);
        } else {
          base = mix(GRASS_A, GRASS_B, n);
          if (n2 > 0.72) base = mix(base, GRASS_C, 0.5);
          // sun-facing tiles slightly brighter towards the top-left
          base = mix(base, [255, 244, 200], Math.max(0, 0.10 - (x + y) / (g.cols + g.rows) * 0.10));
        }
        // soften the road shoulder
        if (!onRoad && d < pw + 0.9) base = mix(base, DIRT_EDGE, (pw + 0.9 - d) / 0.9 * 0.55);

        const p = this.tilePath(ctx, x, y);
        ctx.fillStyle = rgb(base);
        ctx.fill();

        // painted speckle so tiles never read as flat quads
        const flecks = onRoad ? 5 : 7;
        for (let i = 0; i < flecks; i++) {
          const r1 = hash2(x * 7 + i, y * 13 + i, 5);
          const r2 = hash2(x * 3 + i, y * 5 + i, 9);
          const fx = p.cx + (r1 - 0.5) * hw * 1.5;
          const fy = p.cy + (r2 - 0.5) * hh * 1.5;
          if (Math.abs((fx - p.cx) / hw) + Math.abs((fy - p.cy) / hh) > 0.95) continue;
          const tint = hash2(i, x * y + i, 3);
          ctx.fillStyle = onRoad
            ? 'rgba(' + (tint > 0.5 ? '150,124,86' : '74,58,38') + ',0.35)'
            : 'rgba(' + (tint > 0.55 ? '140,178,92' : '38,60,32') + ',0.35)';
          ctx.fillRect(fx, fy, 2 + tint * 2, 1.5);
        }

        // subtle tile seam
        ctx.strokeStyle = onRoad ? 'rgba(52,40,26,0.20)' : 'rgba(28,44,24,0.18)';
        ctx.lineWidth = 1;
        this.tilePath(ctx, x, y);
        ctx.stroke();
      }
    }

    // wheel ruts along the road
    ctx.save();
    ctx.lineCap = 'round';
    for (let side = -1; side <= 1; side += 2) {
      ctx.beginPath();
      for (let dpos = 0; dpos <= path.length; dpos += 0.35) {
        const p = path.positionAt(dpos);
        const dir = path.directionAt(dpos);
        const nx = -dir.y * side * 0.42, ny = dir.x * side * 0.42;
        const sx = (p.x + nx - (p.y + ny)) * hw + this.originX;
        const sy = (p.x + nx + p.y + ny) * hh + this.originY;
        if (dpos === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = 'rgba(60,46,30,0.35)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();

    this.drawDecor(ctx);
    this.canvas = cv;
    return cv;
  };

  TerrainBaker.prototype.project = function (x, y, z) {
    return {
      x: (x - y) * this.cam.hw + this.originX,
      y: (x + y) * this.cam.hh - (z || 0) * this.cam.zScale + this.originY
    };
  };

  TerrainBaker.prototype.drawDecor = function (ctx) {
    const list = this.game.decor.slice().sort((a, b) => (a.x + a.y) - (b.x + b.y));
    for (let i = 0; i < list.length; i++) {
      const d = list[i];
      const p = this.project(d.x, d.y, 0);
      if (d.kind === 'tree') this.tree(ctx, p.x, p.y, d.scale, d.seed);
      else if (d.kind === 'rock') this.rock(ctx, p.x, p.y, d.scale, d.seed);
      else this.bush(ctx, p.x, p.y, d.scale, d.seed);
    }
  };

  TerrainBaker.prototype.tree = function (ctx, x, y, s, seed) {
    const h = 44 * s;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#0f1a0e';
    ctx.beginPath(); ctx.ellipse(x + 6, y + 3, 16 * s, 7 * s, 0, 0, 6.283); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#4a3620';
    ctx.fillRect(x - 3 * s, y - h * 0.45, 6 * s, h * 0.45);
    ctx.fillStyle = '#3a2a18';
    ctx.fillRect(x - 3 * s, y - h * 0.45, 2.4 * s, h * 0.45);
    const layers = 3;
    for (let i = 0; i < layers; i++) {
      const k = i / (layers - 1);
      const rr = (17 - i * 4) * s;
      const yy = y - h * (0.42 + i * 0.22);
      const g = ctx.createRadialGradient(x - rr * 0.4, yy - rr * 0.4, rr * 0.2, x, yy, rr);
      g.addColorStop(0, i === layers - 1 ? '#6f9c4a' : '#5c8a3e');
      g.addColorStop(1, '#26401f');
      ctx.fillStyle = g;
      ctx.beginPath();
      const wobble = (seed + i) * 6.283;
      for (let a = 0; a < 12; a++) {
        const ang = (a / 12) * 6.283;
        const rad = rr * (0.82 + 0.22 * Math.sin(ang * 3 + wobble));
        const px = x + Math.cos(ang) * rad, py = yy + Math.sin(ang) * rad * 0.72;
        if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      void k;
    }
    ctx.restore();
  };

  TerrainBaker.prototype.rock = function (ctx, x, y, s, seed) {
    ctx.save();
    ctx.globalAlpha = 0.3; ctx.fillStyle = '#0f1a0e';
    ctx.beginPath(); ctx.ellipse(x + 4, y + 2, 13 * s, 6 * s, 0, 0, 6.283); ctx.fill();
    ctx.globalAlpha = 1;
    const g = ctx.createLinearGradient(x - 12 * s, y - 18 * s, x + 12 * s, y);
    g.addColorStop(0, '#9aa0a6'); g.addColorStop(0.55, '#6e747c'); g.addColorStop(1, '#454a51');
    ctx.fillStyle = g;
    ctx.beginPath();
    const pts = 7;
    for (let i = 0; i < pts; i++) {
      const a = (i / pts) * 6.283;
      const r = (11 + Math.sin(a * 2 + seed * 9) * 3.5) * s;
      const px = x + Math.cos(a) * r, py = y - 6 * s + Math.sin(a) * r * 0.62;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(30,34,38,0.7)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  };

  TerrainBaker.prototype.bush = function (ctx, x, y, s, seed) {
    ctx.save();
    ctx.globalAlpha = 0.28; ctx.fillStyle = '#0f1a0e';
    ctx.beginPath(); ctx.ellipse(x + 3, y + 2, 10 * s, 5 * s, 0, 0, 6.283); ctx.fill();
    ctx.globalAlpha = 1;
    for (let i = 0; i < 3; i++) {
      const ox = (i - 1) * 6 * s, oy = -4 * s - (i === 1 ? 4 * s : 0);
      const g = ctx.createRadialGradient(x + ox - 2, y + oy - 3, 1, x + ox, y + oy, 9 * s);
      g.addColorStop(0, '#6b9942'); g.addColorStop(1, '#2c4a22');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(x + ox, y + oy, 8 * s, 6 * s, seed, 0, 6.283); ctx.fill();
    }
    ctx.restore();
  };

  NS.TerrainBaker = TerrainBaker;
  NS.noise = { hash2, valueNoise, mix, rgb };
})(typeof globalThis !== 'undefined' ? globalThis : this);
