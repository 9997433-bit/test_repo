/**
 * Painterly canvas renderer for Azeroth Keep TD.
 *
 * Public contract used by main.js / hud.js (do not change):
 *   new Renderer(canvas), .resize(), .draw(game, alpha),
 *   .drawMinimap(canvas, game), .drawPortrait(canvas, sel)
 *
 * Everything else is renderer-local. The heavy terrain painting is done once
 * into a supersampled offscreen canvas and blitted each frame, so the per
 * frame cost is dominated by entities, which are y-sorted for 2.5D depth.
 */
(function (root) {
  "use strict";
  const TILE = 48;
  const TAU = Math.PI * 2;

  /* ------------------------------------------------------------------ */
  /* deterministic hash noise (stable terrain, no per-frame Math.random) */
  /* ------------------------------------------------------------------ */
  function hash2(x, y) {
    let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    n = n ^ (n >>> 16);
    return (n >>> 0) / 4294967296;
  }
  function smoothT(t) { return t * t * (3 - 2 * t); }
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = smoothT(x - xi), fy = smoothT(y - yi);
    const a = hash2(xi, yi), b = hash2(xi + 1, yi);
    const c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  function fbm(x, y) {
    return vnoise(x, y) * 0.65 + vnoise(x * 2.7 + 13.7, y * 2.7 + 91.3) * 0.35;
  }

  function hexToRgb(hex) {
    if (!hex || hex[0] !== "#") return { r: 255, g: 255, b: 255 };
    let h = hex.slice(1);
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgba(hex, a) {
    const c = hexToRgb(hex);
    return "rgba(" + c.r + "," + c.g + "," + c.b + "," + a + ")";
  }
  /* f in [-1, 1]: negative darkens toward black, positive lightens */
  function shade(hex, f) {
    const c = hexToRgb(hex);
    const t = f < 0 ? 0 : 255;
    const p = Math.abs(f);
    return "rgb(" + Math.round((t - c.r) * p + c.r) + "," +
      Math.round((t - c.g) * p + c.g) + "," + Math.round((t - c.b) * p + c.b) + ")";
  }

  /* walk a polyline calling cb(x, y, angle, index) every `step` px */
  function eachAlong(path, step, cb) {
    let carry = 0, idx = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (len < 0.001) continue;
      const ang = Math.atan2(dy, dx);
      let t = carry;
      while (t < len) {
        cb(a.x + (dx * t) / len, a.y + (dy * t) / len, ang, idx++);
        t += step;
      }
      carry = t - len;
    }
  }

  function makeCanvas(w, h) {
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    return cv;
  }

  /* map c.name.en -> species key so the renderer needs no game.js changes */
  const SPECIES = {
    "Footman": "footman", "Grunt": "grunt", "Ghoul": "ghoul",
    "Huntress": "huntress", "Catapult": "catapult", "Wyvern": "wyvern",
    "Gargoyle": "gargoyle", "Acolyte": "acolyte", "Knight": "knight",
    "Ancient": "ancient", "Doom Guard": "doom", "Infernal": "infernal",
  };
  function speciesOf(c) {
    return (c && c.name && SPECIES[c.name.en]) || "generic";
  }

  /* ------------------------------------------------------------------ */
  /* Renderer                                                            */
  /* ------------------------------------------------------------------ */
  function Renderer(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.w = 1152;
    this.h = 768;
    this.shake = 0;
    this.time = 0;
    this._game = null;
    this._dt = 0;
    this._lastGameTime = 0;
    this._night = 0;
    this._terrain = null;
    this._terrainKey = "";
    this._mm = null;
    this._mmKey = "";
    this._vigGrad = null;
    this._vigKey = "";
    this._glows = Object.create(null);
    this.particles = [];
    this.corpses = [];
    this._seen = Object.create(null);
    this._emberAcc = 0;
    this._fireflyAcc = 0;
    this._heroDustAcc = 0;
  }

  Renderer.prototype.resize = function () {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.max(640, r.width) * dpr;
    this.canvas.height = Math.max(360, r.height) * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = r.width;
    this.h = r.height;
  };

  Renderer.prototype.worldToScreen = function (game, x, y) {
    return {
      x: (x - game.cam.x) * game.cam.z + this.w / 2,
      y: (y - game.cam.y) * game.cam.z + this.h / 2,
    };
  };

  /* small cached radial glow sprite per color (cheap fake bloom) */
  Renderer.prototype._glow = function (color) {
    let g = this._glows[color];
    if (!g) {
      g = makeCanvas(64, 64);
      const c = g.getContext("2d");
      const grad = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, rgba(color, 0.85));
      grad.addColorStop(0.35, rgba(color, 0.33));
      grad.addColorStop(1, rgba(color, 0));
      c.fillStyle = grad;
      c.fillRect(0, 0, 64, 64);
      this._glows[color] = g;
    }
    return g;
  };
  Renderer.prototype._drawGlow = function (ctx, x, y, r, color, alpha) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(this._glow(color), x - r, y - r, r * 2, r * 2);
    ctx.restore();
  };

  /* volume / material helpers — light comes from top-left */
  Renderer.prototype._ball = function (ctx, x, y, rx, ry, hex, lit) {
    const g = ctx.createRadialGradient(x - rx * 0.38, y - ry * 0.42, rx * 0.08, x + rx * 0.1, y + ry * 0.15, rx);
    g.addColorStop(0, shade(hex, lit == null ? 0.42 : lit));
    g.addColorStop(0.45, hex);
    g.addColorStop(1, shade(hex, -0.42));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    ctx.fill();
  };
  Renderer.prototype._rim = function (ctx, x, y, rx, ry, hex) {
    ctx.strokeStyle = shade(hex || "#1a140e", -0.55);
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    ctx.stroke();
  };
  Renderer.prototype._spec = function (ctx, x, y, r) {
    ctx.fillStyle = "rgba(255,252,230,0.72)";
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.55, -0.55, 0, TAU);
    ctx.fill();
  };
  Renderer.prototype._plate = function (ctx, x, y, w, h, hex, r) {
    const rad = r == null ? 2.2 : r;
    ctx.fillStyle = shade(hex, -0.22);
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x + 0.8, y + 0.8, w, h, rad); ctx.fill(); }
    else ctx.fillRect(x + 0.8, y + 0.8, w, h);
    const g = ctx.createLinearGradient(x, y, x + w * 0.35, y + h);
    g.addColorStop(0, shade(hex, 0.38));
    g.addColorStop(0.45, hex);
    g.addColorStop(1, shade(hex, -0.28));
    ctx.fillStyle = g;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, rad); ctx.fill(); }
    else ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = shade(hex, -0.5);
    ctx.lineWidth = 1;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, rad); ctx.stroke(); }
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillRect(x + 1.2, y + 1, w * 0.38, Math.max(1.2, h * 0.18));
  };
  Renderer.prototype._head = function (ctx, x, y, r, skin) {
    this._ball(ctx, x, y, r, r * 1.05, skin || "#c9a88a", 0.32);
    this._rim(ctx, x, y, r, r * 1.05, "#5a4030");
    ctx.fillStyle = "#1a120c";
    ctx.beginPath();
    ctx.ellipse(x + r * 0.18, y - r * 0.02, r * 0.16, r * 0.2, 0, 0, TAU);
    ctx.ellipse(x + r * 0.52, y - r * 0.02, r * 0.14, r * 0.18, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.arc(x + r * 0.22, y - r * 0.1, r * 0.07, 0, TAU);
    ctx.fill();
    ctx.fillStyle = shade(skin || "#c9a88a", -0.25);
    ctx.beginPath();
    ctx.ellipse(x + r * 0.28, y + r * 0.42, r * 0.28, r * 0.14, 0, 0, TAU);
    ctx.fill();
  };
  Renderer.prototype._legs = function (ctx, gait, hex, thick) {
    const tw = thick == null ? 2.6 : thick;
    ctx.strokeStyle = shade(hex || "#2c2620", -0.15);
    ctx.lineWidth = tw;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-2.4, -5);
    ctx.lineTo(-2.6 + gait * 3.2, -1.6);
    ctx.lineTo(-2.2 + gait * 3.4, 1.2);
    ctx.moveTo(2.4, -5);
    ctx.lineTo(2.6 - gait * 3.2, -1.6);
    ctx.lineTo(2.2 - gait * 3.4, 1.2);
    ctx.stroke();
    ctx.fillStyle = shade(hex || "#3a3228", -0.1);
    ctx.beginPath();
    ctx.ellipse(-2.2 + gait * 3.4, 1.4, 2.4, 1.15, 0, 0, TAU);
    ctx.ellipse(2.2 - gait * 3.4, 1.4, 2.4, 1.15, 0, 0, TAU);
    ctx.fill();
  };
  Renderer.prototype._hitWash = function (ctx, flash) {
    if (!flash || flash <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = Math.min(0.85, flash * 3.2);
    ctx.fillStyle = "#fff6d0";
    ctx.beginPath();
    ctx.ellipse(0, -8, 11, 14, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  };

  /* ------------------------------------------------------------------ */
  /* main draw                                                           */
  /* ------------------------------------------------------------------ */
  Renderer.prototype.draw = function (game, alpha) {
    const ctx = this.ctx;
    if (this.w < 10) this.resize();
    if (this._game !== game) {
      /* new match: reset per-run render state */
      this._game = game;
      this.particles.length = 0;
      this.corpses.length = 0;
      this._seen = Object.create(null);
      this._lastGameTime = game.time;
      this._night = 0;
    }
    this._dt = Math.max(0, Math.min(0.1, game.time - this._lastGameTime));
    this._lastGameTime = game.time;
    this.time = game.time;

    this._ensureTerrain(game);
    this._trackDeaths(game, alpha);
    this._ambientSpawns(game);
    this._tickParticles(this._dt);

    /* night amount eases toward the current 4-wave phase */
    const targetNight = ((game.waveIndex >> 2) % 2) ? 1 : 0;
    this._night += (targetNight - this._night) * Math.min(1, this._dt * 0.6);

    ctx.clearRect(0, 0, this.w, this.h);
    ctx.save();
    if (this.shake > 0.3) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
      this.shake *= 0.86;
    } else {
      this.shake = 0;
    }
    ctx.translate(this.w / 2, this.h / 2);
    ctx.scale(game.cam.z, game.cam.z);
    ctx.translate(-game.cam.x, -game.cam.y);

    const mw = game.mapW * TILE, mh = game.mapH * TILE;
    /* void beyond map edges */
    ctx.fillStyle = "#0a1007";
    ctx.fillRect(-600, -600, mw + 1200, mh + 1200);
    ctx.drawImage(this._terrain, 0, 0, this._terrain.width, this._terrain.height, 0, 0, mw, mh);

    this._drawCorpses(ctx);
    if (game.buildGhost) this._drawGhost(ctx, game);

    this._drawSorted(ctx, game, alpha);
    this._drawFlying(ctx, game, alpha);
    this._drawProjectiles(ctx, game);

    /* night tint before particles/text so glows and numbers stay readable */
    if (this._night > 0.02) {
      ctx.fillStyle = "rgba(14,20,54," + (0.30 * this._night).toFixed(3) + ")";
      ctx.fillRect(-600, -600, mw + 1200, mh + 1200);
    }
    this._drawParticles(ctx);
    this._drawFx(ctx, game);

    ctx.restore();
    this._drawVignette();
  };

  /* ------------------------------------------------------------------ */
  /* terrain cache                                                       */
  /* ------------------------------------------------------------------ */
  Renderer.prototype._ensureTerrain = function (game) {
    const key = game.seed + ":" + game.mapW + "x" + game.mapH;
    if (this._terrain && this._terrainKey === key) return;
    this._terrainKey = key;
    this._mmKey = "";
    const SS = 2; /* supersample for crisp zoom */
    const w = game.mapW * TILE, h = game.mapH * TILE;
    const cv = makeCanvas(w * SS, h * SS);
    const c = cv.getContext("2d");
    c.scale(SS, SS);

    /* 1) mottled grass wash sampled at half-tile cells so no grid shows */
    const SUB = 2;
    const cell = TILE / SUB;
    for (let sy = 0; sy < game.mapH * SUB; sy++) {
      for (let sx = 0; sx < game.mapW * SUB; sx++) {
        const n = fbm(sx * 0.17, sy * 0.17);
        const dry = fbm(sx * 0.31 + 37.2, sy * 0.31 + 11.8);
        let cr = 55 + n * 22, cg = 96 + n * 38, cb = 32 + n * 11;
        if (dry > 0.6) { /* sun-bleached patch, soft-edged */
          const k = Math.min(1, (dry - 0.6) * 5);
          cr += 30 * k; cg += 9 * k; cb += 3 * k;
        }
        c.fillStyle = "rgb(" + (cr | 0) + "," + (cg | 0) + "," + (cb | 0) + ")";
        c.fillRect(sx * cell, sy * cell, cell + 1, cell + 1);
      }
    }
    /* 2) painterly blobs to break tile edges */
    for (let ty = 0; ty < game.mapH; ty++) {
      for (let tx = 0; tx < game.mapW; tx++) {
        for (let k = 0; k < 2; k++) {
          const r1 = hash2(tx * 5 + k * 131, ty * 7 + k * 17);
          const r2 = hash2(tx * 11 + k * 57, ty * 13 + k * 71);
          const r3 = hash2(tx * 3 + k * 91, ty * 17 + k * 29);
          const bx = tx * TILE + r1 * TILE, by = ty * TILE + r2 * TILE;
          c.fillStyle = r3 < 0.5
            ? "rgba(22,40,14," + (0.05 + r3 * 0.1).toFixed(3) + ")"
            : "rgba(150,196,92," + (0.04 + (r3 - 0.5) * 0.09).toFixed(3) + ")";
          c.beginPath();
          c.ellipse(bx, by, 12 + r1 * 20, 8 + r2 * 14, r3 * 3, 0, TAU);
          c.fill();
        }
      }
    }
    /* 3) macro sunlight patches + shade pools (light from top-left) */
    for (let k = 0; k < 7; k++) {
      const px = hash2(k * 97 + 3, 55) * w, py = hash2(k * 61 + 7, 77) * h;
      const rad = 90 + hash2(k, 999) * 140;
      const g = c.createRadialGradient(px, py, 0, px, py, rad);
      g.addColorStop(0, "rgba(224,240,150,0.10)");
      g.addColorStop(1, "rgba(224,240,150,0)");
      c.fillStyle = g;
      c.fillRect(px - rad, py - rad, rad * 2, rad * 2);
    }
    for (let k = 0; k < 6; k++) {
      const px = hash2(k * 43 + 11, 31) * w, py = hash2(k * 83 + 5, 13) * h;
      const rad = 80 + hash2(k, 555) * 120;
      const g = c.createRadialGradient(px, py, 0, px, py, rad);
      g.addColorStop(0, "rgba(8,20,6,0.12)");
      g.addColorStop(1, "rgba(8,20,6,0)");
      c.fillStyle = g;
      c.fillRect(px - rad, py - rad, rad * 2, rad * 2);
    }
    /* 4) gentle mounds: highlight + drop shadow = faux height */
    const blocked = game.pathBlocked || {};
    for (let k = 0; k < 14; k++) {
      const tx = 1 + ((hash2(k * 19, 401) * (game.mapW - 2)) | 0);
      const ty = 1 + ((hash2(k * 23, 907) * (game.mapH - 2)) | 0);
      if (blocked[tx + "," + ty]) continue;
      const mx = tx * TILE + 24, my = ty * TILE + 24;
      c.fillStyle = "rgba(12,24,8,0.20)";
      c.beginPath();
      c.ellipse(mx + 5, my + 8, 22, 9, 0, 0, TAU);
      c.fill();
      const g = c.createRadialGradient(mx - 6, my - 6, 2, mx, my, 26);
      g.addColorStop(0, "rgba(196,224,120,0.20)");
      g.addColorStop(0.7, "rgba(120,160,70,0.08)");
      g.addColorStop(1, "rgba(120,160,70,0)");
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(mx, my, 24, 15, 0, 0, TAU);
      c.fill();
    }
    /* 5) small detail scatter: tufts, flowers, stones, mushrooms */
    for (let ty = 0; ty < game.mapH; ty++) {
      for (let tx = 0; tx < game.mapW; tx++) {
        if (blocked[tx + "," + ty]) continue;
        const r = hash2(tx * 13 + 5, ty * 17 + 3);
        const jx = tx * TILE + 8 + hash2(tx, ty * 3) * 32;
        const jy = ty * TILE + 8 + hash2(tx * 3, ty) * 32;
        if (r < 0.14) { /* grass tuft */
          c.strokeStyle = "rgba(26,52,18,0.7)";
          c.lineWidth = 1.4;
          for (let b = 0; b < 3; b++) {
            c.beginPath();
            c.moveTo(jx + b * 3 - 3, jy + 3);
            c.quadraticCurveTo(jx + b * 3 - 3 + (b - 1) * 2, jy - 3, jx + b * 4 - 5, jy - 6);
            c.stroke();
          }
        } else if (r < 0.20) { /* flowers */
          const fc = ["#f4f0d8", "#f2d354", "#d8788e"][(hash2(tx, ty) * 3) | 0];
          for (let b = 0; b < 3; b++) {
            c.fillStyle = fc;
            c.beginPath();
            c.arc(jx + hash2(b, tx) * 10 - 5, jy + hash2(b, ty) * 8 - 4, 1.4, 0, TAU);
            c.fill();
          }
        } else if (r < 0.245) { /* stones */
          c.fillStyle = "#6a6458";
          c.beginPath();
          c.ellipse(jx, jy, 4, 2.6, 0.4, 0, TAU);
          c.fill();
          c.fillStyle = "#8a8478";
          c.beginPath();
          c.ellipse(jx - 1, jy - 1, 2, 1.2, 0.4, 0, TAU);
          c.fill();
        } else if (r < 0.26) { /* mushrooms */
          c.fillStyle = "#d8d2c0";
          c.fillRect(jx - 0.8, jy - 3, 1.6, 3.4);
          c.fillStyle = "#b8483a";
          c.beginPath();
          c.arc(jx, jy - 3, 2.6, Math.PI, 0);
          c.fill();
        }
      }
    }
    /* 6) the dirt road: layered body + speckle + ruts + grass overhang */
    this._paintRoad(c, game.path);
    /* 7) dark cliff frame around the map edge */
    const edges = [
      [0, 0, w, 26, 0, 1], [0, h - 26, w, 26, 0, -1],
      [0, 0, 26, h, 1, 0], [w - 26, 0, 26, h, -1, 0],
    ];
    for (let k = 0; k < edges.length; k++) {
      const e = edges[k];
      const g = e[5] !== 0
        ? c.createLinearGradient(0, e[1] + (e[5] > 0 ? 0 : e[3]), 0, e[1] + (e[5] > 0 ? e[3] : 0))
        : c.createLinearGradient(e[0] + (e[4] > 0 ? 0 : e[2]), 0, e[0] + (e[4] > 0 ? e[2] : 0), 0);
      g.addColorStop(0, "rgba(6,12,4,0.55)");
      g.addColorStop(1, "rgba(6,12,4,0)");
      c.fillStyle = g;
      c.fillRect(e[0], e[1], e[2], e[3]);
    }
    this._terrain = cv;
  };

  Renderer.prototype._paintRoad = function (c, path) {
    function strokePath(width, style) {
      c.lineJoin = "round";
      c.lineCap = "round";
      c.strokeStyle = style;
      c.lineWidth = width;
      c.beginPath();
      for (let i = 0; i < path.length; i++) {
        if (i === 0) c.moveTo(path[i].x, path[i].y);
        else c.lineTo(path[i].x, path[i].y);
      }
      c.stroke();
    }
    strokePath(52, "rgba(18,14,6,0.24)");   /* ambient occlusion halo */
    strokePath(44, "#5d4023");              /* dark packed edge */
    strokePath(38, "#77522e");
    strokePath(30, "#8a6236");
    strokePath(14, "rgba(168,126,80,0.5)"); /* trodden center */
    /* speckle noise along the surface */
    eachAlong(path, 6, function (x, y, ang, i) {
      const off = (hash2(i * 7, 13) - 0.5) * 26;
      const px = x + Math.cos(ang + Math.PI / 2) * off;
      const py = y + Math.sin(ang + Math.PI / 2) * off;
      const l = hash2(i, 91);
      c.fillStyle = l < 0.5
        ? "rgba(52,34,14," + (0.10 + l * 0.16).toFixed(3) + ")"
        : "rgba(196,156,104," + (0.06 + (l - 0.5) * 0.14).toFixed(3) + ")";
      c.beginPath();
      c.arc(px, py, 1.2 + hash2(i, 3) * 2.2, 0, TAU);
      c.fill();
    });
    /* cart ruts: dashed twin tracks */
    eachAlong(path, 9, function (x, y, ang, i) {
      for (let s = -1; s <= 1; s += 2) {
        const px = x + Math.cos(ang + Math.PI / 2) * 6 * s;
        const py = y + Math.sin(ang + Math.PI / 2) * 6 * s;
        c.strokeStyle = "rgba(58,38,18,0.30)";
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(px - Math.cos(ang) * 3.5, py - Math.sin(ang) * 3.5);
        c.lineTo(px + Math.cos(ang) * 3.5, py + Math.sin(ang) * 3.5);
        c.stroke();
      }
    });
    /* pebbles */
    eachAlong(path, 26, function (x, y, ang, i) {
      const off = (hash2(i * 3, 77) - 0.5) * 22;
      const px = x + Math.cos(ang + Math.PI / 2) * off;
      const py = y + Math.sin(ang + Math.PI / 2) * off;
      c.fillStyle = "#6f5a40";
      c.beginPath();
      c.ellipse(px, py, 2.4, 1.6, hash2(i, 5) * 3, 0, TAU);
      c.fill();
      c.fillStyle = "rgba(220,196,150,0.5)";
      c.beginPath();
      c.arc(px - 0.7, py - 0.6, 0.8, 0, TAU);
      c.fill();
    });
    /* grass creeping over the road edge */
    eachAlong(path, 13, function (x, y, ang, i) {
      for (let s = -1; s <= 1; s += 2) {
        const j = hash2(i * 11, s * 7 + 50);
        const px = x + Math.cos(ang + Math.PI / 2) * (21 + j * 4) * s;
        const py = y + Math.sin(ang + Math.PI / 2) * (21 + j * 4) * s;
        c.fillStyle = "rgba(66,104,40," + (0.35 + j * 0.35).toFixed(2) + ")";
        c.beginPath();
        c.ellipse(px, py, 3 + j * 4, 2 + j * 2.4, ang, 0, TAU);
        c.fill();
      }
    });
  };

  /* ------------------------------------------------------------------ */
  /* renderer-local particles / corpses                                  */
  /* ------------------------------------------------------------------ */
  Renderer.prototype._spawnP = function (p) {
    if (this.particles.length > 520) this.particles.shift();
    this.particles.push(p);
  };

  Renderer.prototype._hitBurst = function (x, y, color) {
    const n = 8;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + Math.random() * 0.4;
      const sp = 40 + Math.random() * 70;
      this._spawnP({
        kind: "spark", x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7 - 20,
        g: 90, vr: (Math.random() - 0.5) * 18,
        rot: a, life: 0.22 + Math.random() * 0.18, max: 0.4,
        size: 2.2 + Math.random() * 1.6, color: color,
      });
    }
    for (let k = 0; k < 4; k++) {
      const a = Math.random() * TAU;
      this._spawnP({
        kind: "chip", x: x, y: y,
        vx: Math.cos(a) * 30, vy: Math.sin(a) * 18 - 28,
        g: 110, vr: (Math.random() - 0.5) * 10,
        rot: a, life: 0.35, max: 0.35, size: 1.6, color: "#d8c8a0",
      });
    }
    this._spawnP({
      kind: "glow", x: x, y: y, vx: 0, vy: -8, g: 0,
      life: 0.16, max: 0.16, size: 16, color: color,
    });
    this._spawnP({
      kind: "blood", x: x + (Math.random() - 0.5) * 4, y: y + 2,
      vx: (Math.random() - 0.5) * 16, vy: 8, g: 40,
      rot: Math.random(), life: 0.45, max: 0.45, size: 2.4, color: "#7a1c1c",
    });
  };

  Renderer.prototype._tickParticles = function (dt) {
    const ps = this.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life -= dt;
      if (p.life <= 0) { ps[i] = ps[ps.length - 1]; ps.pop(); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.g) p.vy += p.g * dt;
      if (p.vr) p.rot = (p.rot || 0) + p.vr * dt;
    }
    const cs = this.corpses;
    for (let i = cs.length - 1; i >= 0; i--) {
      cs[i].life -= dt;
      if (cs[i].life <= 0) { cs[i] = cs[cs.length - 1]; cs.pop(); }
    }
  };

  Renderer.prototype._trackDeaths = function (game, alpha) {
    const cur = Object.create(null);
    for (let i = 0; i < game.creeps.length; i++) {
      const c = game.creeps[i];
      if (c.hp <= 0) continue;
      cur[c.id] = {
        x: c.px + (c.x - c.px) * alpha,
        y: c.py + (c.y - c.py) * alpha,
        flying: c.flying, boss: c.boss, color: c.color,
      };
    }
    const prev = this._seen;
    for (const id in prev) {
      if (cur[id]) continue;
      const o = prev[id];
      /* dust burst */
      const n = o.boss ? 12 : 6;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * TAU + Math.random() * 0.6;
        const sp = 18 + Math.random() * 26;
        this._spawnP({
          kind: "dust", x: o.x, y: o.y - 4,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.55 - 12,
          g: 34, life: 0.5 + Math.random() * 0.3, max: 0.8,
          size: o.boss ? 4.5 : 3,
        });
      }
      this._spawnP({
        kind: "glow", x: o.x, y: o.y - 4, vx: 0, vy: -6, g: 0,
        life: 0.3, max: 0.3, size: o.boss ? 26 : 14, color: o.color || "#cfd8dc",
      });
      if (!o.flying) {
        if (this.corpses.length > 30) this.corpses.shift();
        this.corpses.push({
          x: o.x, y: o.y, life: 3.2, max: 3.2,
          seed: (o.x * 13 + o.y * 7) | 0, boss: o.boss,
        });
      }
      if (o.boss) this.shake = Math.max(this.shake, 7);
    }
    this._seen = cur;
  };

  Renderer.prototype._ambientSpawns = function (game) {
    const dt = this._dt;
    if (dt <= 0) return;
    /* portal embers */
    const p0 = game.path[0];
    this._emberAcc += dt * 7;
    while (this._emberAcc >= 1) {
      this._emberAcc -= 1;
      this._spawnP({
        kind: "glow",
        x: p0.x + (Math.random() - 0.5) * 26,
        y: p0.y - 6 - Math.random() * 22,
        vx: (Math.random() - 0.5) * 10, vy: -14 - Math.random() * 16, g: 0,
        life: 0.8 + Math.random() * 0.7, max: 1.5,
        size: 4 + Math.random() * 5,
        color: Math.random() < 0.7 ? "#b26aff" : "#ff5ad0",
      });
    }
    /* fireflies at night */
    if (this._night > 0.5) {
      this._fireflyAcc += dt * 2.2;
      while (this._fireflyAcc >= 1) {
        this._fireflyAcc -= 1;
        this._spawnP({
          kind: "glow",
          x: Math.random() * game.mapW * TILE,
          y: Math.random() * game.mapH * TILE,
          vx: (Math.random() - 0.5) * 14, vy: (Math.random() - 0.5) * 8, g: 0,
          life: 2.2 + Math.random() * 1.5, max: 3.7,
          size: 3 + Math.random() * 2.5, color: "#d8f27a",
        });
      }
    }
    /* hero footstep dust */
    const h = game.hero;
    if (h && (Math.abs(h.x - h.px) + Math.abs(h.y - h.py)) > 0.4) {
      this._heroDustAcc += dt * 7;
      while (this._heroDustAcc >= 1) {
        this._heroDustAcc -= 1;
        this._spawnP({
          kind: "dust", x: h.x + (Math.random() - 0.5) * 6, y: h.y + 8,
          vx: (Math.random() - 0.5) * 12, vy: -8 - Math.random() * 8, g: 16,
          life: 0.4, max: 0.4, size: 2.5,
        });
      }
    }
  };

  Renderer.prototype._drawParticles = function (ctx) {
    const ps = this.particles;
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const a = Math.max(0, p.life / p.max);
      if (p.kind === "glow") {
        this._drawGlow(ctx, p.x, p.y, p.size, p.color || "#ffe082", a);
      } else if (p.kind === "dust") {
        ctx.globalAlpha = a * 0.55;
        ctx.fillStyle = "#b3a284";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1.4 - a * 0.4), 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (p.kind === "smoke") {
        ctx.globalAlpha = a * 0.4;
        ctx.fillStyle = "#8a8478";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (2 - a), 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (p.kind === "spark") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot || 0);
        ctx.globalAlpha = a;
        ctx.strokeStyle = p.color || "#ffe082";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-p.size * 1.8, 0);
        ctx.lineTo(p.size * 1.8, 0);
        ctx.stroke();
        ctx.fillStyle = "#fff8d0";
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.45, 0, TAU);
        ctx.fill();
        ctx.restore();
      } else if (p.kind === "chip") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot || 0);
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color || "#c8b890";
        ctx.fillRect(-p.size, -p.size * 0.45, p.size * 2, p.size * 0.9);
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.fillRect(-p.size, -p.size * 0.45, p.size * 0.7, p.size * 0.35);
        ctx.restore();
      } else if (p.kind === "blood") {
        ctx.globalAlpha = a * 0.85;
        ctx.fillStyle = p.color || "#8b1e1e";
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.65, p.rot || 0, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  };

  Renderer.prototype._drawCorpses = function (ctx) {
    const cs = this.corpses;
    for (let i = 0; i < cs.length; i++) {
      const o = cs[i];
      const a = Math.max(0, Math.min(1, o.life / o.max)) * 0.8;
      ctx.globalAlpha = a;
      const s = o.boss ? 1.6 : 1;
      ctx.strokeStyle = "#d8d2bc";
      ctx.lineWidth = 1.6 * s;
      for (let b = 0; b < 3; b++) {
        const r = hash2(o.seed + b, 7);
        const ang = r * TAU;
        ctx.beginPath();
        ctx.moveTo(o.x + Math.cos(ang) * 5 * s, o.y + Math.sin(ang) * 2.5 * s);
        ctx.lineTo(o.x - Math.cos(ang) * 5 * s, o.y - Math.sin(ang) * 2.5 * s);
        ctx.stroke();
      }
      ctx.fillStyle = "#e4dec8";
      ctx.beginPath();
      ctx.arc(o.x + 3 * s, o.y - 1, 2.4 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#1c1812";
      ctx.fillRect(o.x + 2 * s, o.y - 2, 1.2, 1.2);
      ctx.globalAlpha = 1;
    }
  };

  /* ------------------------------------------------------------------ */
  /* build ghost                                                         */
  /* ------------------------------------------------------------------ */
  Renderer.prototype._drawGhost = function (ctx, game) {
    const g = game.buildGhost;
    const pulse = 0.75 + 0.25 * Math.sin(this.time * 6);
    const col = g.ok ? "#7cde6a" : "#e24a3b";
    ctx.save();
    ctx.globalAlpha = 0.16 * pulse;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.range, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([7, 6]);
    ctx.lineDashOffset = -this.time * 22;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.range, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    /* tile plate */
    ctx.globalAlpha = 0.4 * pulse;
    ctx.fillStyle = col;
    ctx.fillRect(g.x - 22, g.y - 22, 44, 44);
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 2;
    const cnr = 10;
    [[-22, -22, 1, 1], [22, -22, -1, 1], [-22, 22, 1, -1], [22, 22, -1, -1]].forEach(function (k) {
      ctx.beginPath();
      ctx.moveTo(g.x + k[0] + cnr * k[2], g.y + k[1]);
      ctx.lineTo(g.x + k[0], g.y + k[1]);
      ctx.lineTo(g.x + k[0], g.y + k[1] + cnr * k[3]);
      ctx.stroke();
    });
    if (!g.ok) {
      ctx.strokeStyle = "#ff5544";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(g.x - 11, g.y - 11);
      ctx.lineTo(g.x + 11, g.y + 11);
      ctx.moveTo(g.x + 11, g.y - 11);
      ctx.lineTo(g.x - 11, g.y + 11);
      ctx.stroke();
    }
    ctx.restore();
  };

  /* ------------------------------------------------------------------ */
  /* y-sorted world pass                                                 */
  /* ------------------------------------------------------------------ */
  Renderer.prototype._drawSorted = function (ctx, game, alpha) {
    const items = [];
    const doodads = game.doodads;
    for (let i = 0; i < doodads.length; i++) {
      items.push([doodads[i].y + 8, 0, doodads[i]]);
    }
    for (let i = 0; i < game.towers.length; i++) {
      items.push([game.towers[i].y + 12, 1, game.towers[i]]);
    }
    for (let i = 0; i < game.creeps.length; i++) {
      const c = game.creeps[i];
      if (c.hp <= 0 || c.flying) continue;
      items.push([c.py + (c.y - c.py) * alpha + 6, 2, c]);
    }
    if (game.hero) items.push([game.hero.py + (game.hero.y - game.hero.py) * alpha + 8, 3, game.hero]);
    const pStart = game.path[0];
    const pEnd = game.path[game.path.length - 1];
    items.push([pStart.y + 12, 4, pStart]);
    items.push([pEnd.y + 16, 5, pEnd]);
    items.sort(function (a, b) { return a[0] - b[0]; });
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      switch (it[1]) {
        case 0: this._drawDoodad(ctx, it[2]); break;
        case 1: this._drawTower(ctx, game, it[2]); break;
        case 2: this._drawCreep(ctx, game, it[2], alpha); break;
        case 3: this._drawHero(ctx, game, it[2], alpha); break;
        case 4: this._drawPortal(ctx, game, it[2]); break;
        case 5: this._drawKeep(ctx, game, it[2]); break;
      }
    }
  };

  Renderer.prototype._drawFlying = function (ctx, game, alpha) {
    for (let i = 0; i < game.creeps.length; i++) {
      const c = game.creeps[i];
      if (c.hp <= 0 || !c.flying) continue;
      this._drawCreep(ctx, game, c, alpha);
    }
  };

  /* ------------------------------------------------------------------ */
  /* doodads                                                             */
  /* ------------------------------------------------------------------ */
  Renderer.prototype._drawDoodad = function (ctx, d) {
    const t = this.time;
    if (d.kind === "tree") {
      const sway = Math.sin(t * 0.9 + d.x * 0.05 + d.y * 0.03) * 1.6;
      ctx.fillStyle = "rgba(8,16,4,0.35)";
      ctx.beginPath();
      ctx.ellipse(d.x + 4, d.y + 9, 14, 5.5, 0, 0, TAU);
      ctx.fill();
      /* trunk with root flare */
      ctx.fillStyle = "#4a3018";
      ctx.beginPath();
      ctx.moveTo(d.x - 5, d.y + 8);
      ctx.lineTo(d.x - 2.4, d.y - 6);
      ctx.lineTo(d.x + 2.4, d.y - 6);
      ctx.lineTo(d.x + 5, d.y + 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#5f3f22";
      ctx.fillRect(d.x - 1, d.y - 6, 2.4, 12);
      /* canopy: dark base, mid tone, lit crown */
      const base = d.tone || "#2e6b2a";
      ctx.fillStyle = shade(base, -0.35);
      ctx.beginPath();
      ctx.arc(d.x + sway * 0.6 + 3, d.y - 10, 12, 0, TAU);
      ctx.arc(d.x + sway * 0.6 - 6, d.y - 13, 10, 0, TAU);
      ctx.fill();
      ctx.fillStyle = base;
      ctx.beginPath();
      ctx.arc(d.x + sway - 2, d.y - 17, 11, 0, TAU);
      ctx.arc(d.x + sway + 6, d.y - 15, 8, 0, TAU);
      ctx.fill();
      ctx.fillStyle = shade(base, 0.28);
      ctx.beginPath();
      ctx.arc(d.x + sway - 5, d.y - 21, 6, 0, TAU);
      ctx.arc(d.x + sway + 2, d.y - 22, 4.5, 0, TAU);
      ctx.fill();
    } else if (d.kind === "rock") {
      ctx.fillStyle = "rgba(8,16,4,0.3)";
      ctx.beginPath();
      ctx.ellipse(d.x + 2, d.y + 6, 12, 4.5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#57534a";
      ctx.beginPath();
      ctx.moveTo(d.x - 11, d.y + 5);
      ctx.lineTo(d.x - 6, d.y - 8);
      ctx.lineTo(d.x + 3, d.y - 10);
      ctx.lineTo(d.x + 11, d.y - 2);
      ctx.lineTo(d.x + 8, d.y + 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#79746a";
      ctx.beginPath();
      ctx.moveTo(d.x - 6, d.y - 8);
      ctx.lineTo(d.x + 3, d.y - 10);
      ctx.lineTo(d.x + 5, d.y - 3);
      ctx.lineTo(d.x - 4, d.y - 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(74,116,49,0.55)";
      ctx.beginPath();
      ctx.ellipse(d.x - 6, d.y + 3, 4, 2, 0.3, 0, TAU);
      ctx.fill();
    } else if (d.kind === "banner") {
      const wave = Math.sin(t * 3 + d.x * 0.2);
      ctx.fillStyle = "rgba(8,16,4,0.3)";
      ctx.beginPath();
      ctx.ellipse(d.x + 2, d.y + 5, 6, 2.5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#3a2a14";
      ctx.fillRect(d.x, d.y - 24, 2.6, 29);
      ctx.fillStyle = "#d4a017";
      ctx.beginPath();
      ctx.arc(d.x + 1.3, d.y - 25, 2, 0, TAU);
      ctx.fill();
      const tone = d.tone || "#8b1e1e";
      ctx.fillStyle = tone;
      ctx.beginPath();
      ctx.moveTo(d.x + 2.6, d.y - 23);
      ctx.quadraticCurveTo(d.x + 12, d.y - 21 + wave * 2, d.x + 19, d.y - 17 + wave * 3);
      ctx.lineTo(d.x + 12, d.y - 14 + wave * 2);
      ctx.quadraticCurveTo(d.x + 8, d.y - 12, d.x + 2.6, d.y - 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = shade(tone, 0.35);
      ctx.beginPath();
      ctx.moveTo(d.x + 2.6, d.y - 23);
      ctx.quadraticCurveTo(d.x + 10, d.y - 21 + wave * 2, d.x + 15, d.y - 18 + wave * 2.4);
      ctx.lineTo(d.x + 10, d.y - 17.4 + wave * 1.6);
      ctx.closePath();
      ctx.fill();
    }
  };

  /* ------------------------------------------------------------------ */
  /* portal + keep                                                       */
  /* ------------------------------------------------------------------ */
  Renderer.prototype._drawPortal = function (ctx, game, p) {
    const t = this.time;
    ctx.save();
    ctx.translate(p.x, p.y);
    /* scorched ground */
    ctx.fillStyle = "rgba(20,8,28,0.5)";
    ctx.beginPath();
    ctx.ellipse(0, 6, 30, 11, 0, 0, TAU);
    ctx.fill();
    this._drawGlow(ctx, 0, 2, 34, "#8a2be2", 0.35 + 0.1 * Math.sin(t * 2.2));
    /* vortex behind the arch */
    ctx.save();
    ctx.translate(0, -16);
    ctx.fillStyle = "#12041c";
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 19, 0, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = "lighter";
    for (let k = 0; k < 3; k++) {
      const ph = t * 1.6 + k * (TAU / 3);
      ctx.strokeStyle = "rgba(" + (150 + k * 30) + ",70,230,0.55)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let a = 0; a < 2.4; a += 0.25) {
        const rr = 3 + a * 6;
        const px = Math.cos(a * 2 + ph) * rr * 0.7;
        const py = Math.sin(a * 2 + ph) * rr;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(190,120,255," + (0.5 + 0.25 * Math.sin(t * 3)) + ")";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 13.5, 19.5, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
    /* stone arch */
    ctx.fillStyle = "#39324a";
    ctx.fillRect(-24, -36, 8, 44);
    ctx.fillRect(16, -36, 8, 44);
    ctx.fillStyle = "#464058";
    ctx.fillRect(-24, -36, 3, 44);
    ctx.fillRect(16, -36, 3, 44);
    ctx.fillStyle = "#2e2840";
    ctx.beginPath();
    ctx.moveTo(-28, -34);
    ctx.lineTo(-20, -46);
    ctx.lineTo(20, -46);
    ctx.lineTo(28, -34);
    ctx.closePath();
    ctx.fill();
    /* glowing runes */
    const runeA = 0.5 + 0.4 * Math.sin(t * 2.6);
    ctx.fillStyle = "rgba(196,120,255," + runeA.toFixed(3) + ")";
    for (let k = 0; k < 3; k++) {
      ctx.fillRect(-21.4, -30 + k * 12, 2.8, 4);
      ctx.fillRect(18.6, -26 + k * 12, 2.8, 4);
    }
    ctx.fillRect(-4, -44, 8, 3);
    /* skulls at the base */
    ctx.fillStyle = "#cfc8b0";
    ctx.beginPath();
    ctx.arc(-26, 7, 3, 0, TAU);
    ctx.arc(27, 5, 2.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#1c1812";
    ctx.fillRect(-27.4, 6, 1.1, 1.4);
    ctx.fillRect(-25.2, 6, 1.1, 1.4);
    ctx.restore();
  };

  Renderer.prototype._drawKeep = function (ctx, game, p) {
    const t = this.time;
    const x = p.x + 4, y = p.y;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(8,16,4,0.4)";
    ctx.beginPath();
    ctx.ellipse(0, 12, 40, 12, 0, 0, TAU);
    ctx.fill();
    /* curtain wall */
    ctx.fillStyle = "#5b5344";
    ctx.fillRect(-30, -22, 60, 32);
    ctx.fillStyle = "#6c6352";
    ctx.fillRect(-30, -22, 60, 7);
    /* stone joints */
    ctx.strokeStyle = "rgba(20,16,10,0.25)";
    ctx.lineWidth = 1;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.moveTo(-30, -12 + k * 8);
      ctx.lineTo(30, -12 + k * 8);
      ctx.stroke();
    }
    /* crenellations */
    ctx.fillStyle = "#6c6352";
    for (let k = 0; k < 5; k++) ctx.fillRect(-28 + k * 13, -28, 7, 7);
    /* flanking towers */
    for (let s = -1; s <= 1; s += 2) {
      ctx.fillStyle = "#665d4c";
      ctx.fillRect(s * 34 - 8, -34, 16, 44);
      ctx.fillStyle = "#79705c";
      ctx.fillRect(s * 34 - 8, -34, 5, 44);
      ctx.fillStyle = "#7e2020";
      ctx.beginPath();
      ctx.moveTo(s * 34 - 11, -34);
      ctx.lineTo(s * 34, -50);
      ctx.lineTo(s * 34 + 11, -34);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#a03030";
      ctx.beginPath();
      ctx.moveTo(s * 34 - 11, -34);
      ctx.lineTo(s * 34, -50);
      ctx.lineTo(s * 34 - 1, -34);
      ctx.closePath();
      ctx.fill();
    }
    /* gate facing the road (left) */
    ctx.fillStyle = "#241a10";
    ctx.beginPath();
    ctx.moveTo(-18, 10);
    ctx.lineTo(-18, -8);
    ctx.arc(-10, -8, 8, Math.PI, 0);
    ctx.lineTo(-2, 10);
    ctx.closePath();
    ctx.fill();
    const warm = 0.5 + 0.16 * Math.sin(t * 7) + 0.1 * Math.sin(t * 13.7);
    this._drawGlow(ctx, -10, 0, 16, "#ffa030", warm * (0.5 + this._night * 0.5));
    /* door planks */
    ctx.strokeStyle = "#4a3418";
    ctx.lineWidth = 1.4;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.moveTo(-15 + k * 5, 10);
      ctx.lineTo(-15 + k * 5, -10);
      ctx.stroke();
    }
    /* waving banner */
    const wave = Math.sin(t * 3.2);
    ctx.fillStyle = "#3a2a14";
    ctx.fillRect(6, -46, 2.4, 24);
    ctx.fillStyle = "#c8a020";
    ctx.beginPath();
    ctx.moveTo(8.4, -45);
    ctx.quadraticCurveTo(20, -43 + wave * 2, 26, -39 + wave * 3);
    ctx.lineTo(19, -35 + wave * 2);
    ctx.quadraticCurveTo(14, -34, 8.4, -32);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#7e2020";
    ctx.beginPath();
    ctx.arc(15 + wave, -39 + wave * 1.5, 2.6, 0, TAU);
    ctx.fill();
    ctx.restore();
  };

  /* ------------------------------------------------------------------ */
  /* towers                                                              */
  /* ------------------------------------------------------------------ */
  Renderer.prototype._drawTower = function (ctx, game, tw) {
    const t = this.time;
    const justFired = tw.cd > 0 && (tw.rate - tw.cd) < 0.1;
    /* range circle for selection */
    if (game.selected === tw) {
      ctx.save();
      ctx.fillStyle = rgba("#50dc78", 0.05);
      ctx.beginPath();
      ctx.arc(tw.x, tw.y, tw.range, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba("#50dc78", 0.45);
      ctx.lineWidth = 1.5;
      ctx.setLineDash([9, 7]);
      ctx.lineDashOffset = -t * 18;
      ctx.beginPath();
      ctx.arc(tw.x, tw.y, tw.range, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      ctx.strokeStyle = "#4cff4c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(tw.x, tw.y + 10, 17, 7.5, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(8,16,4,0.4)";
    ctx.beginPath();
    ctx.ellipse(tw.x + 3, tw.y + 10, 15, 6, 0, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.translate(tw.x, tw.y);
    this._towerBody(ctx, tw.def, tw.tier, t, tw.x * 0.13 + tw.y * 0.07, justFired);
    ctx.restore();
    /* tier pips */
    ctx.fillStyle = "#e8b820";
    ctx.strokeStyle = "#4a3808";
    ctx.lineWidth = 0.8;
    for (let i = 0; i < tw.tier; i++) {
      const gx = tw.x - (tw.tier - 1) * 4 + i * 8;
      ctx.beginPath();
      ctx.moveTo(gx, tw.y - 46);
      ctx.lineTo(gx + 2.8, tw.y - 42.5);
      ctx.lineTo(gx, tw.y - 39);
      ctx.lineTo(gx - 2.8, tw.y - 42.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  };

  /**
   * Body painter shared with the portrait. Draws centered on the ground
   * point (0, 10), reaching up to about y = -40.
   */
  Renderer.prototype._towerBody = function (ctx, def, tier, t, phase, fired) {
    const s = 1 + (tier - 1) * 0.13;
    const col = def.color;
    ctx.save();
    ctx.scale(s, s);
    const id = def.id;
    if (tier === 3) this._drawGlow(ctx, 0, -26, 24, col, 0.22 + 0.08 * Math.sin(t * 3 + phase));

    if (id === "h_guard") {
      this._stoneTube(ctx, 11, -26, 10, "#7d7668");
      ctx.fillStyle = "#8d8678";
      for (let k = 0; k < 3; k++) ctx.fillRect(-12 + k * 9, -33, 6, 7);
      ctx.fillStyle = "#14100c";
      ctx.fillRect(-1.6, -20, 3.2, 9);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(12, -30);
      ctx.lineTo(20, -27);
      ctx.lineTo(12, -23);
      ctx.closePath();
      ctx.fill();
      if (fired) this._drawGlow(ctx, 0, -30, 12, "#fff0b0", 0.8);
    } else if (id === "h_cannon") {
      ctx.fillStyle = "#6e675a";
      ctx.beginPath();
      ctx.moveTo(-16, 10);
      ctx.lineTo(-11, -10);
      ctx.lineTo(11, -10);
      ctx.lineTo(16, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#7f7869";
      ctx.beginPath();
      ctx.moveTo(-16, 10);
      ctx.lineTo(-11, -10);
      ctx.lineTo(-4, -10);
      ctx.lineTo(-7, 10);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(20,16,10,0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(-11, -4, 22, 0.1);
      ctx.fillStyle = "#565045";
      ctx.beginPath();
      ctx.ellipse(0, -11, 12, 4.5, 0, 0, TAU);
      ctx.fill();
      ctx.save();
      ctx.translate(0, -14);
      ctx.rotate(-0.62);
      ctx.fillStyle = "#23211e";
      ctx.fillRect(-3, -3.6, 21, 7.2);
      ctx.fillStyle = "#3a3833";
      ctx.fillRect(-3, -3.6, 21, 2.4);
      ctx.fillStyle = "#141210";
      ctx.beginPath();
      ctx.ellipse(21, 0, 2.2, 3.6, 0, 0, TAU);
      ctx.fill();
      if (fired) this._drawGlow(ctx, 24, 0, 15, "#ffcc66", 0.95);
      ctx.restore();
    } else if (id === "h_arcane") {
      ctx.fillStyle = "#cfd4e2";
      ctx.beginPath();
      ctx.moveTo(-10, 10);
      ctx.lineTo(-3.4, -28);
      ctx.lineTo(3.4, -28);
      ctx.lineTo(10, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#e4e8f2";
      ctx.beginPath();
      ctx.moveTo(-10, 10);
      ctx.lineTo(-3.4, -28);
      ctx.lineTo(0, -28);
      ctx.lineTo(-3, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = col;
      ctx.fillRect(-7.4, -8, 14.8, 3.4);
      ctx.fillRect(-5.4, -19, 10.8, 2.8);
      ctx.fillStyle = "#8896b8";
      ctx.beginPath();
      ctx.moveTo(-5, -28);
      ctx.lineTo(0, -38);
      ctx.lineTo(5, -28);
      ctx.closePath();
      ctx.fill();
      const oa = t * 2.4 + phase;
      const ox = Math.cos(oa) * 10, oy = -33 + Math.sin(oa) * 3.4;
      this._drawGlow(ctx, ox, oy, 9, col, 0.85);
      ctx.fillStyle = "#eaf6ff";
      ctx.beginPath();
      ctx.arc(ox, oy, 2.6, 0, TAU);
      ctx.fill();
    } else if (id === "o_watch") {
      ctx.strokeStyle = "#54381c";
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(-10, 10); ctx.lineTo(-7, -12);
      ctx.moveTo(10, 10); ctx.lineTo(7, -12);
      ctx.stroke();
      this._plankBox(ctx, -13, -24, 26, 14, "#6d4a26");
      ctx.fillStyle = "#54381c";
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.moveTo(-13 + k * 8, -24);
        ctx.lineTo(-9 + k * 8, -34);
        ctx.lineTo(-5 + k * 8, -24);
        ctx.closePath();
        ctx.fill();
      }
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, -20);
      ctx.lineTo(0, -15);
      ctx.lineTo(6, -20);
      ctx.stroke();
      if (fired) this._drawGlow(ctx, 0, -28, 11, "#ffd9a0", 0.8);
    } else if (id === "o_burrow") {
      ctx.fillStyle = "#7a5533";
      ctx.beginPath();
      ctx.arc(0, 4, 15, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#5d3f22";
      ctx.lineWidth = 2;
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.arc(k * 6, 4, 14, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      }
      ctx.fillStyle = "#1c140c";
      ctx.beginPath();
      ctx.arc(0, 4, 6.4, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#e8e0c8";
      ctx.beginPath();
      ctx.moveTo(-5, 4); ctx.lineTo(-3.4, -1); ctx.lineTo(-2.4, 4);
      ctx.moveTo(5, 4); ctx.lineTo(3.4, -1); ctx.lineTo(2.4, 4);
      ctx.closePath();
      ctx.fill();
      const jab = fired ? 3.4 : Math.sin(t * 2 + phase) * 1;
      ctx.strokeStyle = "#8a6236";
      ctx.lineWidth = 1.8;
      for (let k = -1; k <= 1; k++) {
        const ang = -Math.PI / 2 + k * 0.42;
        const tipx = Math.cos(ang) * (20 + jab), tipy = 2 + Math.sin(ang) * (20 + jab);
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * 8, 2 + Math.sin(ang) * 8);
        ctx.lineTo(tipx, tipy);
        ctx.stroke();
        ctx.fillStyle = "#c8d2df";
        ctx.beginPath();
        ctx.moveTo(tipx, tipy);
        ctx.lineTo(tipx - 2.4, tipy + 4);
        ctx.lineTo(tipx + 2.4, tipy + 4);
        ctx.closePath();
        ctx.fill();
      }
    } else if (id === "o_spirit") {
      this._plankBox(ctx, -12, -14, 24, 22, "#6d4a26");
      ctx.fillStyle = "#54381c";
      ctx.beginPath();
      ctx.moveTo(-15, -14);
      ctx.lineTo(0, -25);
      ctx.lineTo(15, -14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#e4dcc4";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-7, -22); ctx.lineTo(-13, -36);
      ctx.moveTo(7, -22); ctx.lineTo(13, -36);
      ctx.stroke();
      const orbY = -32 + Math.sin(t * 2.6 + phase) * 2;
      this._drawGlow(ctx, 0, orbY, 11, col, 0.85);
      ctx.fillStyle = "#e8dcff";
      ctx.beginPath();
      ctx.arc(0, orbY, 3, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(col, 0.85);
      ctx.lineWidth = 1.4;
      for (let k = 0; k < 2; k++) {
        const seedA = Math.sin(t * 21 + k * 5 + phase) * 4;
        const seedB = Math.sin(t * 17 + k * 9) * 4;
        ctx.beginPath();
        ctx.moveTo(0, orbY);
        ctx.lineTo(4 + seedA, orbY + 6 + seedB * 0.5);
        ctx.lineTo(-2 + seedB, orbY + 12 + seedA * 0.4);
        ctx.stroke();
      }
    } else if (id === "n_ancient") {
      ctx.fillStyle = "#4a3320";
      ctx.beginPath();
      ctx.moveTo(-11, 10);
      ctx.lineTo(-6, -18);
      ctx.lineTo(6, -18);
      ctx.lineTo(11, 10);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#39271a";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-4, 8); ctx.lineTo(-2, -14);
      ctx.moveTo(4, 8); ctx.lineTo(3, -10);
      ctx.stroke();
      /* root toes */
      ctx.fillStyle = "#4a3320";
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.ellipse(k * 9, 9, 4, 2.6, 0, 0, TAU);
        ctx.fill();
      }
      /* glowing eyes */
      const eg = 0.6 + 0.3 * Math.sin(t * 3.4 + phase);
      ctx.fillStyle = "rgba(240,220,110," + eg + ")";
      ctx.fillRect(-4.4, -10, 3, 2);
      ctx.fillRect(1.4, -10, 3, 2);
      /* swaying canopy */
      const sway = Math.sin(t * 1.1 + phase) * 1.8;
      ctx.fillStyle = "#24491e";
      ctx.beginPath();
      ctx.arc(sway + 6, -24, 9.4, 0, TAU);
      ctx.arc(sway - 7, -22, 8.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#2f6127";
      ctx.beginPath();
      ctx.arc(sway, -30, 10.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#417f36";
      ctx.beginPath();
      ctx.arc(sway - 3, -33, 5.4, 0, TAU);
      ctx.fill();
    } else if (id === "n_chimaera") {
      ctx.fillStyle = "#6b4d2a";
      ctx.beginPath();
      ctx.ellipse(0, 2, 15, 7, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#1e150c";
      ctx.beginPath();
      ctx.ellipse(0, 1, 9, 4, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "#8a6236";
      ctx.lineWidth = 1.6;
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * TAU + 0.3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 10, 2 + Math.sin(a) * 5);
        ctx.lineTo(Math.cos(a) * 17, 2 + Math.sin(a) * 8 - 2);
        ctx.stroke();
      }
      const wy = -14 + Math.sin(t * 2.8 + phase) * 2.6;
      this._drawGlow(ctx, 0, wy, 12, "#7ddb5a", 0.8);
      ctx.fillStyle = "#c8f2a8";
      ctx.beginPath();
      ctx.ellipse(0, wy, 4, 5.4, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba("#7ddb5a", 0.8);
      ctx.beginPath();
      ctx.arc(-1, wy + 8 + Math.sin(t * 6) * 1.4, 1.4, 0, TAU);
      ctx.fill();
    } else if (id === "n_moon") {
      ctx.fillStyle = "#cfd8e6";
      ctx.beginPath();
      ctx.ellipse(0, 4, 14, 6.4, 0, 0, TAU);
      ctx.fill();
      const pool = ctx.createRadialGradient(0, 3, 1, 0, 3, 11);
      pool.addColorStop(0, "#eaf9ff");
      pool.addColorStop(1, "#5aa8d8");
      ctx.fillStyle = pool;
      ctx.beginPath();
      ctx.ellipse(0, 3, 10.4, 4.4, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "#b8c4d4";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-11, 0);
      ctx.quadraticCurveTo(-13, -16, 0, -21);
      ctx.moveTo(11, 0);
      ctx.quadraticCurveTo(13, -16, 0, -21);
      ctx.stroke();
      this._drawGlow(ctx, 0, -23, 11, "#bfe9ff", 0.9);
      ctx.fillStyle = "#f4fcff";
      ctx.beginPath();
      ctx.arc(0, -23, 4.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#5aa8d8";
      ctx.beginPath();
      ctx.arc(1.6, -24, 3.4, 0, TAU);
      ctx.fill();
      const tw2 = (t * 2 + phase) % TAU;
      ctx.fillStyle = "rgba(234,249,255," + (0.4 + 0.4 * Math.sin(t * 5)) + ")";
      ctx.beginPath();
      ctx.arc(Math.cos(tw2) * 8, -12 + Math.sin(tw2 * 1.7) * 6, 1.2, 0, TAU);
      ctx.fill();
    } else if (id === "u_spirit") {
      ctx.fillStyle = "#3f4a52";
      ctx.beginPath();
      ctx.moveTo(-8.4, 10);
      ctx.lineTo(-4.4, -28);
      ctx.lineTo(4.4, -28);
      ctx.lineTo(8.4, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#4d5a64";
      ctx.beginPath();
      ctx.moveTo(-8.4, 10);
      ctx.lineTo(-4.4, -28);
      ctx.lineTo(-1, -28);
      ctx.lineTo(-3.4, 10);
      ctx.closePath();
      ctx.fill();
      const runeA = 0.55 + 0.35 * Math.sin(t * 3 + phase);
      ctx.strokeStyle = rgba(col, runeA);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-2.4, -18);
      ctx.lineTo(2.4, -14);
      ctx.moveTo(2.4, -18);
      ctx.lineTo(-2.4, -14);
      ctx.moveTo(0, -20);
      ctx.lineTo(0, -12);
      ctx.stroke();
      const sy = -36 + Math.sin(t * 2.2 + phase) * 2.6;
      this._drawGlow(ctx, 0, sy, 10, col, 0.85);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, sy - 5);
      ctx.lineTo(3, sy);
      ctx.lineTo(0, sy + 5);
      ctx.lineTo(-3, sy);
      ctx.closePath();
      ctx.fill();
    } else if (id === "u_zig") {
      const steps = [[-15, -3, 30, 13], [-11, -13, 22, 10], [-6.4, -21, 12.8, 8]];
      for (let k = 0; k < steps.length; k++) {
        const st = steps[k];
        ctx.fillStyle = k % 2 ? "#514a5c" : "#453f50";
        ctx.fillRect(st[0], st[1], st[2], st[3]);
        ctx.fillStyle = "rgba(120,110,140,0.5)";
        ctx.fillRect(st[0], st[1], st[2], 2.4);
        ctx.strokeStyle = rgba(col, 0.5 + 0.3 * Math.sin(t * 2.4 + k));
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(st[0], st[1] + st[3]);
        ctx.lineTo(st[0] + st[2], st[1] + st[3]);
        ctx.stroke();
      }
      this._drawGlow(ctx, 0, -26, 9, col, 0.9);
      ctx.fillStyle = "#d8fbff";
      ctx.beginPath();
      ctx.moveTo(0, -31);
      ctx.lineTo(2.6, -25);
      ctx.lineTo(0, -22);
      ctx.lineTo(-2.6, -25);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(240,248,255,0.28)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-15, 8); ctx.lineTo(-20, 12);
      ctx.moveTo(15, 8); ctx.lineTo(21, 11);
      ctx.moveTo(-11, -13); ctx.lineTo(-17, -18);
      ctx.stroke();
    } else if (id === "u_wagon") {
      ctx.fillStyle = "#2c2420";
      for (let s2 = -1; s2 <= 1; s2 += 2) {
        ctx.beginPath();
        ctx.arc(s2 * 9, 5, 6.4, 0, TAU);
        ctx.fill();
      }
      ctx.strokeStyle = "#57493a";
      ctx.lineWidth = 1.4;
      for (let s2 = -1; s2 <= 1; s2 += 2) {
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI + 0.4;
          ctx.beginPath();
          ctx.moveTo(s2 * 9 - Math.cos(a) * 5.4, 5 - Math.sin(a) * 5.4);
          ctx.lineTo(s2 * 9 + Math.cos(a) * 5.4, 5 + Math.sin(a) * 5.4);
          ctx.stroke();
        }
      }
      this._plankBox(ctx, -15, -11, 30, 13, "#5d4a33");
      ctx.fillStyle = "#4a2c34";
      ctx.beginPath();
      ctx.moveTo(-15, -11);
      ctx.quadraticCurveTo(0, -24, 15, -11);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#8a7a5c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(9, -11);
      ctx.lineTo(13, -27);
      ctx.stroke();
      ctx.strokeStyle = "#b8b0a0";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(15, -25, 3.4, Math.PI * 1.5, Math.PI * 0.6);
      ctx.stroke();
      this._drawGlow(ctx, 0, -16, 15, "#7bcf6a", 0.28 + 0.1 * Math.sin(t * 2 + phase));
      if (fired) this._drawGlow(ctx, 0, -20, 16, "#aef29a", 0.8);
    } else {
      /* fallback */
      ctx.fillStyle = "#3a3228";
      ctx.fillRect(-12, -6, 24, 16);
      ctx.fillStyle = col;
      ctx.fillRect(-9, -20, 18, 18);
    }
    ctx.restore();
  };

  Renderer.prototype._stoneTube = function (ctx, halfW, top, bottom, base) {
    ctx.fillStyle = base;
    ctx.fillRect(-halfW, top, halfW * 2, bottom - top);
    ctx.fillStyle = shade(base, 0.14);
    ctx.fillRect(-halfW, top, halfW * 0.7, bottom - top);
    ctx.fillStyle = shade(base, -0.18);
    ctx.fillRect(halfW * 0.4, top, halfW * 0.6, bottom - top);
    ctx.strokeStyle = "rgba(20,16,10,0.28)";
    ctx.lineWidth = 1;
    const rows = 4;
    for (let k = 1; k < rows; k++) {
      const yy = top + ((bottom - top) * k) / rows;
      ctx.beginPath();
      ctx.moveTo(-halfW, yy);
      ctx.lineTo(halfW, yy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo((k % 2 ? -halfW / 2 : halfW / 3), yy);
      ctx.lineTo((k % 2 ? -halfW / 2 : halfW / 3), yy - (bottom - top) / rows);
      ctx.stroke();
    }
  };

  Renderer.prototype._plankBox = function (ctx, x, y, w, h, base) {
    ctx.fillStyle = base;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = shade(base, 0.16);
    ctx.fillRect(x, y, w, 2.6);
    ctx.strokeStyle = "rgba(20,12,4,0.35)";
    ctx.lineWidth = 1;
    for (let k = 1; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(x + (w * k) / 4, y);
      ctx.lineTo(x + (w * k) / 4, y + h);
      ctx.stroke();
    }
  };

  /* ------------------------------------------------------------------ */
  /* creeps                                                              */
  /* ------------------------------------------------------------------ */
  Renderer.prototype._drawCreep = function (ctx, game, c, alpha) {
    const t = this.time;
    const x = c.px + (c.x - c.px) * alpha;
    const y = c.py + (c.y - c.py) * alpha;
    const s = c.boss ? 1.5 : 1;
    const flyAlt = c.flying ? -15 + Math.sin(t * 5 + c.id) * 2.5 : 0;
    /* facing (mirror) */
    const mdx = c.x - c.px;
    if (Math.abs(mdx) > 0.02) c._face = mdx < 0 ? -1 : 1;
    const face = c._face || 1;

    ctx.fillStyle = "rgba(8,16,4," + (c.flying ? 0.22 : 0.35) + ")";
    ctx.beginPath();
    ctx.ellipse(x + (c.flying ? 4 : 2), y + 7, (c.flying ? 7 : 10) * s, 4 * s, 0, 0, TAU);
    ctx.fill();

    if (c.boss) {
      const ba = 0.4 + 0.2 * Math.sin(t * 4);
      ctx.strokeStyle = "rgba(255,80,60," + ba + ")";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y + 6, 15, 7, 0, 0, TAU);
      ctx.stroke();
      this._drawGlow(ctx, x, y - 4 + flyAlt, 22, "#ff6a3a", 0.18);
    }
    if (game.selected === c) {
      ctx.strokeStyle = "#ff4444";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y + 7, 13 * s, 6 * s, 0, 0, TAU);
      ctx.stroke();
    }

    if (c._hitFlash > 0) c._hitFlash = Math.max(0, c._hitFlash - this._dt);

    ctx.save();
    ctx.translate(x, y + flyAlt);
    ctx.scale(s * face * 1.18, s * 1.18);
    this._creepBody(ctx, speciesOf(c), c, t);
    this._hitWash(ctx, c._hitFlash);
    ctx.restore();

    /* status markers */
    if (c.slow > 0) {
      ctx.fillStyle = "rgba(150,210,255,0.8)";
      for (let k = 0; k < 2; k++) {
        const a = t * 3 + k * 3;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * 9, y - 8 + flyAlt + Math.sin(a) * 3, 1.5, 0, TAU);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(150,210,255,0.4)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(x, y + 6, 11 * s, 5 * s, 0, 0, TAU);
      ctx.stroke();
    }
    if (c.poison > 0) {
      ctx.fillStyle = "rgba(110,220,80,0.85)";
      const dy2 = (t * 26) % 10;
      ctx.beginPath();
      ctx.arc(x - 4, y - 10 + dy2 * 0.5 + flyAlt, 1.5, 0, TAU);
      ctx.arc(x + 5, y - 6 + dy2 * 0.4 + flyAlt, 1.2, 0, TAU);
      ctx.fill();
    }
    if (c.root > 0) {
      ctx.strokeStyle = "#5d4023";
      ctx.lineWidth = 2;
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.moveTo(x + k * 6, y + 7);
        ctx.quadraticCurveTo(x + k * 8, y - 1, x + k * 4, y - 4);
        ctx.stroke();
      }
    }

    /* hp bar */
    const ratio = Math.max(0, c.hp / c.maxHp);
    const bw = c.boss ? 26 : 20;
    const by = y - (c.boss ? 26 : 19) + flyAlt;
    ctx.fillStyle = "rgba(10,8,6,0.85)";
    ctx.fillRect(x - bw / 2 - 1, by - 1, bw + 2, 5);
    ctx.fillStyle = ratio > 0.5 ? "#2ecc40" : ratio > 0.25 ? "#f1c40f" : "#e74c3c";
    ctx.fillRect(x - bw / 2, by, bw * ratio, 3);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(x - bw / 2, by, bw * ratio, 1.2);
  };

  /** species body, centered at feet (0,0), facing +x */
  Renderer.prototype._creepBody = function (ctx, sp, c, t) {
    const walk = (c.dist || 0) * 0.32 + (c.id || 0);
    const gait = Math.sin(walk);
    const bob = Math.abs(gait) * -1.6;
    const col = c.color || "#888";
    const skin = "#c9a88a";

    switch (sp) {
      case "footman": {
        this._legs(ctx, gait, "#3a4250", 2.8);
        this._plate(ctx, -5.4, -14.2 + bob, 10.8, 11, "#9fb0c4", 2.6);
        ctx.fillStyle = "#1e4a8c";
        ctx.fillRect(-5.4, -9.2 + bob, 10.8, 2.4);
        ctx.fillStyle = "#d4a017";
        ctx.fillRect(-1.2, -9 + bob, 2.4, 2);
        this._ball(ctx, 5.2, -8.6 + bob, 4.8, 4.8, "#c8d4e4", 0.4);
        this._rim(ctx, 5.2, -8.6 + bob, 4.8, 4.8, "#6a7888");
        this._spec(ctx, 3.8, -10.2 + bob, 1.3);
        this._head(ctx, 0.4, -16.8 + bob, 3.5, skin);
        ctx.fillStyle = "#2c3340";
        ctx.beginPath();
        ctx.ellipse(0.4, -18.4 + bob, 3.8, 2.2, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = "#d4a017";
        ctx.fillRect(-0.6, -20.2 + bob, 2, 1.6);
        ctx.save();
        ctx.translate(3.2, -4 + bob);
        ctx.rotate(-0.55);
        ctx.fillStyle = "#6a4a22";
        ctx.fillRect(-0.7, -14, 1.5, 14);
        ctx.fillStyle = "#d8dde8";
        ctx.beginPath();
        ctx.moveTo(0, -16); ctx.lineTo(-2.4, -12); ctx.lineTo(2.4, -12);
        ctx.closePath();
        ctx.fill();
        this._spec(ctx, 0, -14.4, 0.8);
        ctx.restore();
        break;
      }
      case "grunt": {
        this._legs(ctx, gait, "#4a2a14", 3.2);
        this._ball(ctx, 0, -9.4 + bob, 7.2, 6.6, shade(col, -0.05), 0.28);
        this._rim(ctx, 0, -9.4 + bob, 7.2, 6.6, "#3a2010");
        ctx.fillStyle = "#5a3010";
        ctx.fillRect(-6.4, -8.4 + bob, 12.8, 2.4);
        ctx.fillStyle = "#8a6236";
        ctx.fillRect(-1.6, -8.2 + bob, 3.2, 2);
        ctx.fillStyle = "#3f2a18";
        ctx.beginPath();
        ctx.moveTo(-7.4, -13 + bob); ctx.lineTo(-5, -20 + bob); ctx.lineTo(-1.2, -13 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = shade("#3f2a18", 0.25);
        ctx.beginPath();
        ctx.moveTo(-6.4, -14 + bob); ctx.lineTo(-5, -18.6 + bob); ctx.lineTo(-3.2, -14 + bob);
        ctx.fill();
        this._ball(ctx, 3.6, -15.2 + bob, 3.8, 3.8, "#6a8a48", 0.25);
        this._rim(ctx, 3.6, -15.2 + bob, 3.8, 3.8, "#2a3a14");
        ctx.fillStyle = "#1a1408";
        ctx.beginPath();
        ctx.arc(4.8, -15.4 + bob, 0.7, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#e8e0c8";
        ctx.fillRect(5.2, -14.2 + bob, 1.5, 2.8);
        ctx.fillRect(2.0, -14.2 + bob, 1.5, 2.8);
        ctx.save();
        ctx.translate(5.4, -6 + bob);
        ctx.rotate(-0.7);
        ctx.fillStyle = "#4a3018";
        ctx.fillRect(-1, -10, 2, 11);
        this._ball(ctx, 0.2, -12, 3.4, 3.4, "#9aa4ac", 0.4);
        this._spec(ctx, -1, -13.2, 1.1);
        ctx.restore();
        break;
      }
      case "ghoul": {
        this._legs(ctx, gait, "#5a6450", 2.2);
        ctx.save();
        ctx.rotate(-0.32);
        this._ball(ctx, 0, -8.4 + bob, 7.6, 5.0, "#8fa070", 0.2);
        this._rim(ctx, 0, -8.4 + bob, 7.6, 5.0, "#3a4428");
        ctx.restore();
        ctx.fillStyle = "#6a7848";
        for (let k = 0; k < 4; k++) {
          this._ball(ctx, -5 + k * 2.8, -12.4 + k * 1.3 + bob, 1.5, 1.5, "#7a8858", 0.15);
        }
        this._ball(ctx, 6.4, -10.8 + bob, 3.6, 3.4, "#aab888", 0.22);
        this._rim(ctx, 6.4, -10.8 + bob, 3.6, 3.4, "#4a5430");
        ctx.fillStyle = "#d43a2a";
        ctx.beginPath();
        ctx.arc(7.4, -11.4 + bob, 1.05, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "rgba(255,80,60,0.55)";
        ctx.beginPath();
        ctx.arc(7.6, -11.6 + bob, 0.4, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = "#8a986a";
        ctx.lineWidth = 2.1;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(4, -7 + bob);
        ctx.lineTo(9 + gait, -0.4);
        ctx.lineTo(11.4 + gait, -2.8);
        ctx.moveTo(9 + gait, -0.4);
        ctx.lineTo(11.6 + gait, 0.6);
        ctx.stroke();
        ctx.fillStyle = "#c8d4a0";
        ctx.beginPath();
        ctx.arc(11.5 + gait, -2.8, 0.9, 0, TAU);
        ctx.fill();
        break;
      }
      case "huntress": {
        this._legs(ctx, gait, "#2a3a2a", 2.2);
        ctx.fillStyle = "#2a3848";
        ctx.beginPath();
        ctx.moveTo(-5.6, -2 + bob);
        ctx.quadraticCurveTo(-9.2, -10, -4.8, -14.4 + bob);
        ctx.lineTo(-1.2, -13 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = shade("#2a3848", 0.2);
        ctx.beginPath();
        ctx.moveTo(-5, -4 + bob);
        ctx.quadraticCurveTo(-7.4, -10, -4.2, -13 + bob);
        ctx.lineTo(-2.4, -12 + bob);
        ctx.fill();
        this._ball(ctx, 0.2, -10 + bob, 4.2, 5.6, col, 0.28);
        this._rim(ctx, 0.2, -10 + bob, 4.2, 5.6, "#243020");
        this._head(ctx, 1.1, -16.6 + bob, 3.0, "#c9a88a");
        ctx.fillStyle = "#e8eef6";
        ctx.beginPath();
        ctx.ellipse(1.1, -18.2 + bob, 3.0, 2.0, 0, Math.PI, 0);
        ctx.fill();
        const spin = t * 9;
        this._drawGlow(ctx, 6.8, -9.4 + bob, 8, "#cfe8f4", 0.35);
        ctx.strokeStyle = "#e8f4fc";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(6.8, -9.4 + bob, 3.8, spin, spin + 4.2);
        ctx.stroke();
        ctx.strokeStyle = "#8ab0c4";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(6.8, -9.4 + bob, 2.4, spin + 1, spin + 3.4);
        ctx.stroke();
        break;
      }
      case "catapult": {
        const roll = (c.dist || 0) * 0.22;
        ctx.fillStyle = "#5d4732";
        ctx.fillRect(-9, -7, 18, 5);
        ctx.fillStyle = "#725840";
        ctx.fillRect(-9, -7, 18, 1.8);
        for (let k = -1; k <= 1; k += 2) {
          ctx.fillStyle = "#33271a";
          ctx.beginPath();
          ctx.arc(k * 6, 0, 4.6, 0, TAU);
          ctx.fill();
          ctx.strokeStyle = "#6e5a40";
          ctx.lineWidth = 1.3;
          for (let sK = 0; sK < 3; sK++) {
            const a = roll + (sK / 3) * Math.PI;
            ctx.beginPath();
            ctx.moveTo(k * 6 - Math.cos(a) * 3.8, -Math.sin(a) * 3.8);
            ctx.lineTo(k * 6 + Math.cos(a) * 3.8, Math.sin(a) * 3.8);
            ctx.stroke();
          }
        }
        ctx.strokeStyle = "#54381c";
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(-4, -7);
        ctx.lineTo(6, -17);
        ctx.stroke();
        ctx.fillStyle = "#6a6458";
        ctx.beginPath();
        ctx.arc(6.6, -17.6, 3, 0, TAU);
        ctx.fill();
        break;
      }
      case "wyvern": {
        const flap = Math.sin(t * 11 + (c.id || 0)) * 0.85;
        ctx.fillStyle = shade(col, -0.28);
        ctx.beginPath();
        ctx.moveTo(-2, -9);
        ctx.quadraticCurveTo(-9 - flap * 2, -18 - flap * 5, -13, -12 - flap * 6);
        ctx.quadraticCurveTo(-8, -10, -3, -7);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = shade(col, -0.2);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-6, -8);
        ctx.quadraticCurveTo(-12, -6.4, -14, -1.4);
        ctx.stroke();
        ctx.fillStyle = shade(col, -0.05);
        ctx.beginPath();
        ctx.ellipse(0, -8, 7.4, 4.2, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = shade(col, 0.22);
        ctx.beginPath();
        ctx.ellipse(1, -9.4, 5, 2.2, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = shade(col, 0.05);
        ctx.beginPath();
        ctx.arc(7.4, -10.4, 3, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#1c140c";
        ctx.beginPath();
        ctx.arc(8.4, -11, 0.8, 0, TAU);
        ctx.fill();
        ctx.fillStyle = shade(col, 0.35);
        ctx.beginPath();
        ctx.moveTo(1, -12);
        ctx.quadraticCurveTo(3 + flap, -19 - flap * 4, 8, -14 - flap * 5);
        ctx.quadraticCurveTo(5, -11.4, 2, -11);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case "gargoyle": {
        const flap = Math.sin(t * 9 + (c.id || 0)) * 0.9;
        ctx.fillStyle = "#5b6770";
        for (let k = -1; k <= 1; k += 2) {
          ctx.beginPath();
          ctx.moveTo(k * 2, -10);
          ctx.lineTo(k * 8, -15 - flap * 4 * (k === 1 ? 1 : 0.85));
          ctx.lineTo(k * 12, -11 - flap * 5);
          ctx.lineTo(k * 8.4, -9.4);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillStyle = "#78909c";
        ctx.beginPath();
        ctx.ellipse(0, -9, 5.4, 4.4, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#8fa4b0";
        ctx.beginPath();
        ctx.arc(4.4, -12, 2.8, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#5b6770";
        ctx.beginPath();
        ctx.moveTo(3, -14.4); ctx.lineTo(4, -16.4); ctx.lineTo(5, -14.4);
        ctx.moveTo(5.4, -14.4); ctx.lineTo(6.4, -16); ctx.lineTo(7, -14);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ff5a4a";
        ctx.fillRect(4, -12.6, 1.2, 1.2);
        break;
      }
      case "acolyte": {
        ctx.fillStyle = "#3f3a4a";
        ctx.beginPath();
        ctx.moveTo(-5.4, 0);
        ctx.quadraticCurveTo(-4, -8, 0, -13 + bob);
        ctx.quadraticCurveTo(4, -8, 5.4, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#57506a";
        ctx.beginPath();
        ctx.moveTo(-5.4, 0);
        ctx.quadraticCurveTo(-4.4, -7, -1, -12 + bob);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#2c2836";
        ctx.beginPath();
        ctx.arc(0, -13.4 + bob, 3.2, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#8de07a";
        ctx.fillRect(-1.6, -13.8 + bob, 1.2, 1.2);
        ctx.fillRect(0.6, -13.8 + bob, 1.2, 1.2);
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-3, -6 + bob);
        ctx.lineTo(3, -7 + bob);
        ctx.stroke();
        break;
      }
      case "knight": {
        /* horse legs */
        ctx.strokeStyle = "#8a94a4";
        ctx.lineWidth = 2;
        for (let k = 0; k < 4; k++) {
          const ph = walk + k * (Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(-6 + k * 4, -5);
          ctx.lineTo(-6 + k * 4 + Math.sin(ph) * 2.6, 0.5);
          ctx.stroke();
        }
        ctx.fillStyle = "#b9c4d4";
        ctx.beginPath();
        ctx.ellipse(0, -8 + bob * 0.6, 9, 4.6, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = col;
        ctx.fillRect(-7, -9.4 + bob * 0.6, 14, 2.6);
        /* neck + head */
        ctx.fillStyle = "#aab6c8";
        ctx.beginPath();
        ctx.moveTo(7, -9);
        ctx.quadraticCurveTo(11, -14, 12.4, -16.4);
        ctx.lineTo(14.4, -14.4);
        ctx.quadraticCurveTo(11, -11, 9, -6.4);
        ctx.closePath();
        ctx.fill();
        /* rider */
        ctx.fillStyle = "#8e99ab";
        ctx.fillRect(-2.4, -17 + bob * 0.6, 4.8, 7);
        ctx.fillStyle = "#c8d2df";
        ctx.beginPath();
        ctx.arc(0, -19 + bob * 0.6, 2.6, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#d43a2a";
        ctx.beginPath();
        ctx.moveTo(0, -21.4 + bob * 0.6);
        ctx.quadraticCurveTo(-3, -24, -5, -22);
        ctx.quadraticCurveTo(-2.4, -22, -1, -20.4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#e4dcc4";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(2, -14 + bob * 0.6);
        ctx.lineTo(13, -20 + bob * 0.6);
        ctx.stroke();
        break;
      }
      case "ancient": {
        const stomp = Math.sin(walk * 0.6) * 1;
        ctx.fillStyle = "#4a3016";
        ctx.beginPath();
        ctx.moveTo(-9, 0);
        ctx.lineTo(-6, -16 + stomp);
        ctx.lineTo(6, -16 + stomp);
        ctx.lineTo(9, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#33200e";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-3, -2); ctx.lineTo(-2, -13 + stomp);
        ctx.moveTo(3, -2); ctx.lineTo(2.4, -10 + stomp);
        ctx.stroke();
        for (let k = -1; k <= 1; k += 2) {
          ctx.fillStyle = "#4a3016";
          ctx.beginPath();
          ctx.ellipse(k * 7, 0.5, 4, 2.4, 0, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = "rgba(255,180,60,0.9)";
        ctx.fillRect(-3.4, -12 + stomp, 2.4, 1.8);
        ctx.fillRect(1.4, -12 + stomp, 2.4, 1.8);
        ctx.fillStyle = "#274d1e";
        ctx.beginPath();
        ctx.arc(-5, -20 + stomp, 5.4, 0, TAU);
        ctx.arc(5, -19 + stomp, 5, 0, TAU);
        ctx.arc(0, -24 + stomp, 6, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#3a7030";
        ctx.beginPath();
        ctx.arc(-1, -26 + stomp, 3.4, 0, TAU);
        ctx.fill();
        break;
      }
      case "doom": {
        ctx.strokeStyle = "#3a1030";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-2.6, -4); ctx.lineTo(-2.6 + gait * 2.4, 0.5);
        ctx.moveTo(2.6, -4); ctx.lineTo(2.6 - gait * 2.4, 0.5);
        ctx.stroke();
        /* folded wings */
        ctx.fillStyle = "#2c0e26";
        ctx.beginPath();
        ctx.moveTo(-3, -13 + bob);
        ctx.lineTo(-10, -18 + bob);
        ctx.lineTo(-7, -6 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = shade(col, 0.06);
        ctx.beginPath();
        ctx.ellipse(0, -9.4 + bob, 6.4, 6, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = shade(col, 0.3);
        ctx.beginPath();
        ctx.arc(2.6, -15 + bob, 3.4, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = "#e0d4c0";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0.6, -17.4 + bob);
        ctx.quadraticCurveTo(-1.4, -21.4, 1, -23 + bob);
        ctx.moveTo(4.6, -17.4 + bob);
        ctx.quadraticCurveTo(6.6, -21.4, 4.6, -23 + bob);
        ctx.stroke();
        ctx.fillStyle = "#ffb040";
        ctx.fillRect(1.4, -15.6 + bob, 1.3, 1.3);
        ctx.fillRect(3.8, -15.6 + bob, 1.3, 1.3);
        break;
      }
      case "infernal": {
        const fl = Math.sin(t * 13 + (c.id || 0) * 3);
        this._drawGlow(ctx, 0, -10, 15, "#7bff5a", 0.5);
        ctx.fillStyle = "rgba(120,255,90,0.75)";
        ctx.beginPath();
        ctx.moveTo(-7, -3);
        ctx.quadraticCurveTo(-8, -14 - fl * 2, -3, -17 - fl * 3);
        ctx.quadraticCurveTo(0, -21 - fl * 2, 3, -17 - fl * 3);
        ctx.quadraticCurveTo(8, -13 + fl * 2, 7, -3);
        ctx.closePath();
        ctx.fill();
        /* rock chunks */
        ctx.fillStyle = "#20262a";
        ctx.fillRect(-5.4, -12, 5, 5);
        ctx.fillRect(1.4, -13.4, 4.4, 4.4);
        ctx.fillRect(-2.4, -7, 5, 4.4);
        ctx.fillStyle = "#39444a";
        ctx.fillRect(-5.4, -12, 5, 1.4);
        ctx.fillRect(1.4, -13.4, 4.4, 1.4);
        ctx.fillStyle = "#d8ffc8";
        ctx.fillRect(-3.4, -11, 1.4, 1.4);
        ctx.fillRect(3, -12, 1.4, 1.4);
        break;
      }
      default: {
        ctx.fillStyle = shade(col, -0.15);
        ctx.beginPath();
        ctx.arc(0, -8 + bob, 7, 0, TAU);
        ctx.fill();
        ctx.fillStyle = shade(col, 0.2);
        ctx.beginPath();
        ctx.arc(-2, -10 + bob, 4, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#1c140c";
        ctx.beginPath();
        ctx.arc(2.6, -9 + bob, 1, 0, TAU);
        ctx.fill();
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* hero                                                                */
  /* ------------------------------------------------------------------ */
  Renderer.prototype._drawHero = function (ctx, game, h, alpha) {
    const t = this.time;
    const x = h.px + (h.x - h.px) * alpha;
    const y = h.py + (h.y - h.py) * alpha;
    ctx.fillStyle = "rgba(8,16,4,0.4)";
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 8, 11, 4.5, 0, 0, TAU);
    ctx.fill();
    if (game.selected === h) {
      ctx.strokeStyle = "#4cff4c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y + 8, 14, 6, 0, 0, TAU);
      ctx.stroke();
    }
    const moving = (Math.abs(h.x - h.px) + Math.abs(h.y - h.py)) > 0.2;
    const mdx = h.x - h.px;
    if (Math.abs(mdx) > 0.02) h._face = mdx < 0 ? -1 : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(h._face || 1, 1);
    this._heroBody(ctx, h, t, moving);
    ctx.restore();
    if (h.shield > 0) {
      const sa = 0.5 + 0.2 * Math.sin(t * 8);
      this._drawGlow(ctx, x, y - 8, 22, "#ffe082", sa * 0.6);
      ctx.strokeStyle = "rgba(255,232,140," + sa + ")";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y - 8, 17, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y - 8, 17, t * 2, t * 2 + 0.8);
      ctx.stroke();
    }
    if (h.immolation) {
      const fa = 0.4 + 0.25 * Math.sin(t * 11);
      this._drawGlow(ctx, x, y - 4, 26, "#ff7a30", fa);
      ctx.strokeStyle = "rgba(255,150,60," + fa + ")";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y + 6, 16, 7, 0, 0, TAU);
      ctx.stroke();
    }
    if (h.metaUntil > t) {
      this._drawGlow(ctx, x, y - 10, 26, "#8a2be2", 0.5);
    }
    /* hp / mana bars */
    const ratio = Math.max(0, h.hp / h.maxHp);
    ctx.fillStyle = "rgba(10,8,6,0.85)";
    ctx.fillRect(x - 13, y - 25, 26, 7);
    ctx.fillStyle = "#2ecc40";
    ctx.fillRect(x - 12, y - 24, 24 * ratio, 3);
    ctx.fillStyle = "#3b7dd8";
    ctx.fillRect(x - 12, y - 20.4, 24 * Math.max(0, h.mana / h.maxMana), 1.8);
  };

  Renderer.prototype._heroBody = function (ctx, h, t, moving) {
    const id = h.def.id;
    const col = h.def.color;
    const gait = moving ? Math.sin(t * 12) : 0;
    const bob = moving ? Math.abs(gait) * -1.4 : Math.sin(t * 2.2) * 0.7;
    const swing = h.attackCd > 0 && (h.def.rate - h.attackCd) < 0.18;
    /* legs */
    ctx.strokeStyle = "#2c2620";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-2.2, -4); ctx.lineTo(-2.2 + gait * 2.6, 0.5);
    ctx.moveTo(2.2, -4); ctx.lineTo(2.2 - gait * 2.6, 0.5);
    ctx.stroke();
    /* cape */
    const capeW = Math.sin(t * 4) * (moving ? 2.6 : 1);
    const capeC = id === "paladin" ? "#3b5dd8" : id === "blademaster" ? "#7e2020"
      : id === "demonhunter" ? "#3a1a4a" : "#1e2c48";
    ctx.fillStyle = capeC;
    ctx.beginPath();
    ctx.moveTo(-2, -14 + bob);
    ctx.quadraticCurveTo(-8 - capeW, -8, -6 - capeW * 1.4, 0);
    ctx.lineTo(-1, -3);
    ctx.closePath();
    ctx.fill();
    /* torso */
    const armor = id === "paladin" ? "#d8d2c4" : id === "blademaster" ? "#a85a30"
      : id === "demonhunter" ? "#6a4a8c" : "#8ca4c4";
    ctx.fillStyle = armor;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-4.6, -13.4 + bob, 9.2, 9.6, 3) : ctx.rect(-4.6, -13.4 + bob, 9.2, 9.6);
    ctx.fill();
    ctx.fillStyle = shade(armor, 0.25);
    ctx.fillRect(-4.6, -13.4 + bob, 3.4, 9.6);
    ctx.fillStyle = col;
    ctx.fillRect(-4.6, -9 + bob, 9.2, 2);
    /* head */
    ctx.fillStyle = "#c9a88a";
    ctx.beginPath();
    ctx.arc(0.6, -16 + bob, 3.2, 0, TAU);
    ctx.fill();
    if (id === "paladin") {
      ctx.fillStyle = "#e4e0d0";
      ctx.beginPath();
      ctx.arc(0.6, -17 + bob, 3.2, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#d4a017";
      ctx.fillRect(-0.4, -20.4 + bob, 2, 2);
      const ha = swing ? -0.9 : Math.sin(t * 2) * 0.12;
      ctx.save();
      ctx.translate(4.4, -9 + bob);
      ctx.rotate(ha);
      ctx.strokeStyle = "#8a6236";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(3, -9);
      ctx.stroke();
      ctx.fillStyle = "#e8e2d2";
      ctx.fillRect(0.4, -12.4, 5.4, 4);
      ctx.fillStyle = "#d4a017";
      ctx.fillRect(0.4, -9.4, 5.4, 1);
      ctx.restore();
      this._drawGlow(ctx, 0, -14 + bob, 13, "#ffe8a0", 0.16 + (swing ? 0.3 : 0));
    } else if (id === "blademaster") {
      ctx.fillStyle = "#7e2020";
      ctx.beginPath();
      ctx.arc(0.6, -17.4 + bob, 3, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fill();
      ctx.fillStyle = "#5d1616";
      ctx.fillRect(-2.4, -16.4 + bob, 6, 1.4);
      const ka = swing ? -1.5 : -0.5 + Math.sin(t * 1.8) * 0.08;
      ctx.save();
      ctx.translate(4.4, -10 + bob);
      ctx.rotate(ka);
      ctx.strokeStyle = "#e8ecf4";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(6, -6, 11, -8);
      ctx.stroke();
      ctx.strokeStyle = "#8a6236";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-1, 1);
      ctx.lineTo(1.4, -1.4);
      ctx.stroke();
      ctx.restore();
      /* back banner */
      ctx.strokeStyle = "#54381c";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-3, -13 + bob);
      ctx.lineTo(-5.4, -24 + bob);
      ctx.stroke();
      ctx.fillStyle = "#d43a2a";
      ctx.beginPath();
      ctx.moveTo(-5.4, -24 + bob);
      ctx.quadraticCurveTo(-9, -22, -10, -19 + Math.sin(t * 5) * 1.4 + bob);
      ctx.lineTo(-5, -20 + bob);
      ctx.closePath();
      ctx.fill();
    } else if (id === "demonhunter") {
      const meta = h.metaUntil > t;
      ctx.fillStyle = "#2c2030";
      ctx.beginPath();
      ctx.arc(0.6, -16 + bob, 3.3, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = meta ? "#b26aff" : "#4de07a";
      ctx.fillRect(-1.6, -16.6 + bob, 4.6, 1.6);
      ctx.strokeStyle = "#3a2a1a";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-1.4, -18.4 + bob);
      ctx.quadraticCurveTo(-3.4, -21.4, -2.4, -23 + bob);
      ctx.moveTo(2.6, -18.4 + bob);
      ctx.quadraticCurveTo(4.6, -21.4, 3.6, -23 + bob);
      ctx.stroke();
      const ga = swing ? 1 : Math.sin(t * 2.4) * 0.14;
      for (let k = -1; k <= 1; k += 2) {
        ctx.save();
        ctx.translate(k * 5, -9 + bob);
        ctx.rotate(k * ga);
        ctx.strokeStyle = meta ? "#c89aff" : "#9ae0b4";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, 4.6, -1.2, 1.6);
        ctx.stroke();
        ctx.restore();
      }
      if (meta) {
        ctx.fillStyle = "rgba(60,20,80,0.75)";
        for (let k = -1; k <= 1; k += 2) {
          ctx.beginPath();
          ctx.moveTo(k * 2, -13 + bob);
          ctx.quadraticCurveTo(k * 12, -22, k * 14, -14 + bob);
          ctx.quadraticCurveTo(k * 9, -13, k * 4, -9 + bob);
          ctx.closePath();
          ctx.fill();
        }
      }
    } else { /* deathknight */
      ctx.fillStyle = "#1e2c48";
      ctx.beginPath();
      ctx.arc(0.6, -16.4 + bob, 3.4, Math.PI * 0.85, Math.PI * 2.15);
      ctx.fill();
      ctx.fillStyle = "#b8d8f4";
      ctx.fillRect(-1.4, -16.4 + bob, 4.4, 1.2);
      const ra = swing ? -1.1 : Math.sin(t * 2) * 0.1;
      ctx.save();
      ctx.translate(4.6, -9 + bob);
      ctx.rotate(ra);
      ctx.strokeStyle = "#bfe6ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 1);
      ctx.lineTo(4, -11);
      ctx.stroke();
      ctx.strokeStyle = "#5d8ab8";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0.6, -2);
      ctx.lineTo(3.4, -9);
      ctx.stroke();
      ctx.restore();
      this._drawGlow(ctx, 6, -14 + bob, 9, "#7ec8ff", 0.4);
    }
  };

  /* ------------------------------------------------------------------ */
  /* projectiles                                                         */
  /* ------------------------------------------------------------------ */
  Renderer.prototype._drawProjectiles = function (ctx, game) {
    const dt = this._dt;
    for (let i = 0; i < game.projectiles.length; i++) {
      const p = game.projectiles[i];
      const ang = Math.atan2(p.vy, p.vx);
      const col = p.color || "#fff3a0";
      /* renderer-only trail budget stamped on the projectile */
      if (p._rtl === undefined) p._rtl = 0;
      p._rtl -= dt;
      if (p.attackType === "magic") {
        if (p._rtl <= 0) {
          p._rtl = 0.045;
          this._spawnP({
            kind: "glow", x: p.x, y: p.y, vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8, g: 0, life: 0.28, max: 0.28,
            size: 5, color: col,
          });
        }
        this._drawGlow(ctx, p.x, p.y, 12, col, 0.9);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2, 0, TAU);
        ctx.fill();
        if (p.chain) {
          ctx.strokeStyle = rgba(col, 0.8);
          ctx.lineWidth = 1.3;
          const j1 = Math.sin(this.time * 31 + i * 7) * 5;
          const j2 = Math.sin(this.time * 41 + i * 3) * 5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + 4 + j1, p.y + j2);
          ctx.lineTo(p.x - j2, p.y + 4 + j1 * 0.5);
          ctx.stroke();
        }
      } else if (p.attackType === "siege") {
        if (p._rtl <= 0) {
          p._rtl = 0.05;
          this._spawnP({
            kind: "smoke", x: p.x, y: p.y, vx: (Math.random() - 0.5) * 6,
            vy: -6, g: -4, life: 0.5, max: 0.5, size: 3,
          });
        }
        ctx.fillStyle = "#26221e";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.2, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "rgba(255,150,60,0.8)";
        ctx.beginPath();
        ctx.arc(p.x - Math.cos(ang) * 1.6, p.y - Math.sin(ang) * 1.6, 1.8, 0, TAU);
        ctx.fill();
      } else if (p.attackType === "pierce") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(ang);
        ctx.strokeStyle = "rgba(230,220,190,0.35)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(-6, 0);
        ctx.stroke();
        ctx.strokeStyle = "#c8b890";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.lineTo(4, 0);
        ctx.stroke();
        ctx.fillStyle = "#e8ecf4";
        ctx.beginPath();
        ctx.moveTo(7, 0);
        ctx.lineTo(2.4, -2);
        ctx.lineTo(2.4, 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(col, 0.9);
        ctx.fillRect(-7.4, -1.6, 2.6, 3.2);
        ctx.restore();
      } else {
        /* normal / anything else: sling stone with speed streak */
        ctx.strokeStyle = "rgba(255,244,200,0.35)";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(p.x - Math.cos(ang) * 9, p.y - Math.sin(ang) * 9);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.fillStyle = "#c8bca4";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.6, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.beginPath();
        ctx.arc(p.x - 0.8, p.y - 0.8, 1, 0, TAU);
        ctx.fill();
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* game fx (text / spark / ring)                                       */
  /* ------------------------------------------------------------------ */
  Renderer.prototype._drawFx = function (ctx, game) {
    const fx = game.fx;
    for (let i = 0; i < fx.length; i++) {
      const f = fx[i];
      const k = Math.max(0, f.life / f.max);
      if (f.kind === "text") {
        const pop = 1 + Math.max(0, k - 0.8) * 2.2;
        ctx.globalAlpha = Math.min(1, k * 2);
        ctx.font = "bold " + (12 * pop).toFixed(1) + "px 'Palatino Linotype', Palatino, Georgia, serif";
        ctx.strokeStyle = "rgba(10,8,4,0.85)";
        ctx.lineWidth = 3;
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillStyle = f.color || "#fff";
        ctx.fillText(f.text, f.x, f.y);
        ctx.globalAlpha = 1;
      } else if (f.kind === "spark") {
        if (!f._burst) {
          f._burst = true;
          this._hitBurst(f.x, f.y, f.color || "#ffe082");
        }
        ctx.globalAlpha = k;
        const seed = ((f.x * 13 + f.y * 7) | 0);
        const spread = (1 - k) * 11 + 2;
        for (let b = 0; b < 5; b++) {
          const a = hash2(seed, b) * TAU;
          ctx.fillStyle = b === 0 ? "#ffffff" : (f.color || "#ffe082");
          ctx.beginPath();
          ctx.arc(f.x + Math.cos(a) * spread, f.y + Math.sin(a) * spread * 0.7,
            (b === 0 ? 2.4 : 1.7) * k + 0.4, 0, TAU);
          ctx.fill();
        }
        this._drawGlow(ctx, f.x, f.y, 9, f.color || "#ffe082", k * 0.7);
        ctx.globalAlpha = 1;
      } else if (f.kind === "ring") {
        ctx.globalAlpha = k;
        const rr = (f.r || 8) * (1 - k + 0.3) * 2;
        ctx.strokeStyle = f.color || "#fff";
        ctx.lineWidth = 1 + 2.4 * k;
        ctx.beginPath();
        ctx.arc(f.x, f.y, rr, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = k * 0.4;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(f.x, f.y, rr * 0.8, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* vignette                                                            */
  /* ------------------------------------------------------------------ */
  Renderer.prototype._drawVignette = function () {
    const ctx = this.ctx;
    const key = this.w + "x" + this.h;
    if (this._vigKey !== key) {
      this._vigKey = key;
      const g = ctx.createRadialGradient(
        this.w / 2, this.h / 2, Math.min(this.w, this.h) * 0.38,
        this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.72);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.75, "rgba(4,8,2,0.18)");
      g.addColorStop(1, "rgba(2,4,1,0.45)");
      this._vigGrad = g;
    }
    ctx.fillStyle = this._vigGrad;
    ctx.fillRect(0, 0, this.w, this.h);
  };

  /* ------------------------------------------------------------------ */
  /* minimap                                                             */
  /* ------------------------------------------------------------------ */
  Renderer.prototype.drawMinimap = function (canvas, game) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const key = w + "x" + h + ":" + this._terrainKey;
    this._ensureTerrain(game);
    if (this._mmKey !== key) {
      this._mmKey = key;
      const mm = makeCanvas(w, h);
      const c = mm.getContext("2d");
      c.fillStyle = "#101c0c";
      c.fillRect(0, 0, w, h);
      c.drawImage(this._terrain, 0, 0, this._terrain.width, this._terrain.height, 0, 0, w, h);
      /* slight darken for HUD contrast */
      c.fillStyle = "rgba(6,10,4,0.18)";
      c.fillRect(0, 0, w, h);
      this._mm = mm;
    }
    ctx.drawImage(this._mm, 0, 0);
    const sx = w / (game.mapW * TILE);
    const sy = h / (game.mapH * TILE);
    /* portal + keep markers */
    const p0 = game.path[0], p1 = game.path[game.path.length - 1];
    const pulse = 0.6 + 0.4 * Math.sin(this.time * 4);
    ctx.fillStyle = "rgba(178,106,255," + pulse + ")";
    ctx.beginPath();
    ctx.arc(p0.x * sx, p0.y * sy, 3.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#e8c040";
    ctx.fillRect(p1.x * sx - 2.6, p1.y * sy - 2.6, 5.2, 5.2);
    /* towers */
    for (let i = 0; i < game.towers.length; i++) {
      const tw = game.towers[i];
      ctx.fillStyle = tw.def.color;
      ctx.fillRect(tw.x * sx - 1.4, tw.y * sy - 1.4, 3, 3);
    }
    /* creeps */
    for (let i = 0; i < game.creeps.length; i++) {
      const c2 = game.creeps[i];
      if (c2.hp <= 0) continue;
      if (c2.boss) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(c2.x * sx - 2, c2.y * sy - 2, 4, 4);
        ctx.fillStyle = "#e24a3b";
        ctx.fillRect(c2.x * sx - 1.2, c2.y * sy - 1.2, 2.4, 2.4);
      } else {
        ctx.fillStyle = c2.flying ? "#7ec8ff" : "#e24a3b";
        ctx.fillRect(c2.x * sx - 1, c2.y * sy - 1, 2, 2);
      }
    }
    if (game.hero) {
      ctx.save();
      ctx.translate(game.hero.x * sx, game.hero.y * sy);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = "#ffe082";
      ctx.fillRect(-2.2, -2.2, 4.4, 4.4);
      ctx.restore();
    }
    /* camera rect */
    ctx.strokeStyle = "rgba(255,250,220,0.75)";
    ctx.lineWidth = 1;
    const vw = this.w / game.cam.z;
    const vh = this.h / game.cam.z;
    ctx.strokeRect((game.cam.x - vw / 2) * sx, (game.cam.y - vh / 2) * sy, vw * sx, vh * sy);
    /* inner frame */
    ctx.strokeStyle = "rgba(180,140,60,0.5)";
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  };

  /* ------------------------------------------------------------------ */
  /* portrait                                                            */
  /* ------------------------------------------------------------------ */
  Renderer.prototype.drawPortrait = function (canvas, sel) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const t = this.time;
    const col = sel && sel.def ? sel.def.color : sel && sel.color ? sel.color : "#6aa4e8";
    /* backdrop */
    ctx.fillStyle = "#0e0a06";
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w * 0.5, h * 0.42, 6, w * 0.5, h * 0.6, w * 0.72);
    g.addColorStop(0, rgba(col, 0.5));
    g.addColorStop(0.55, rgba(col, 0.16));
    g.addColorStop(1, "rgba(6,4,2,0.9)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    /* slow sheen */
    const shx = (Math.sin(t * 0.5) * 0.5 + 0.5) * w;
    const lg = ctx.createLinearGradient(shx - w * 0.4, 0, shx + w * 0.4, h);
    lg.addColorStop(0, "rgba(255,244,214,0)");
    lg.addColorStop(0.5, "rgba(255,244,214,0.05)");
    lg.addColorStop(1, "rgba(255,244,214,0)");
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, w, h);
    /* ground line */
    ctx.fillStyle = "rgba(10,6,2,0.5)";
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.78, w * 0.3, h * 0.06, 0, 0, TAU);
    ctx.fill();

    if (!sel) {
      /* keep crest */
      ctx.save();
      ctx.translate(w * 0.5, h * 0.52);
      const s = w / 78;
      ctx.scale(s, s);
      ctx.fillStyle = "#2c2416";
      ctx.beginPath();
      ctx.moveTo(-20, -22);
      ctx.lineTo(20, -22);
      ctx.lineTo(20, 6);
      ctx.quadraticCurveTo(20, 20, 0, 26);
      ctx.quadraticCurveTo(-20, 20, -20, 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#c8a020";
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.fillStyle = "#6c6352";
      ctx.fillRect(-11, -12, 22, 18);
      ctx.fillStyle = "#79705c";
      for (let k = 0; k < 3; k++) ctx.fillRect(-11 + k * 8.4, -16, 5, 5);
      ctx.fillStyle = "#241a10";
      ctx.beginPath();
      ctx.arc(0, 6, 4.4, Math.PI, 0);
      ctx.rect(-4.4, 6, 8.8, 0.1);
      ctx.fill();
      ctx.fillStyle = "#7e2020";
      ctx.beginPath();
      ctx.moveTo(-3, -22);
      ctx.lineTo(0, -30);
      ctx.lineTo(3, -22);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (sel.kind === "tower" && sel.def) {
      ctx.save();
      ctx.translate(w * 0.5, h * 0.62);
      const s = w / 82;
      ctx.scale(s, s);
      this._towerBody(ctx, sel.def, sel.tier || 1, t, 1.7, false);
      ctx.restore();
    } else if (sel.kind === "hero" && sel.def) {
      ctx.save();
      ctx.translate(w * 0.5, h * 0.72);
      const s = w / 46;
      ctx.scale(s, s);
      this._heroBody(ctx, sel, t, false);
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(w * 0.52, h * 0.68);
      const s = w / (sel.boss ? 62 : 52);
      ctx.scale(-s, s); /* face left like WC3 portraits */
      const fake = {
        name: sel.name, color: sel.color, flying: sel.flying,
        boss: sel.boss, dist: t * 18, id: sel.id || 1,
      };
      this._creepBody(ctx, speciesOf(fake), fake, t);
      ctx.restore();
    }
    /* frame bevel */
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.strokeStyle = "rgba(196,160,80,0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.fillStyle = "#c8a020";
    [[8, 8], [w - 8, 8], [8, h - 8], [w - 8, h - 8]].forEach(function (k) {
      ctx.beginPath();
      ctx.arc(k[0], k[1], 2.4, 0, TAU);
      ctx.fill();
    });
  };

  root.Renderer = Renderer;
})(typeof globalThis !== "undefined" ? globalThis : this);
