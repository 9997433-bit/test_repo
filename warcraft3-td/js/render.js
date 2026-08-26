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
    this._pMax = 900;
    this._pOver = 0;
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
    const ps = this.particles;
    if (ps.length >= this._pMax) {
      /* rotate-overwrite the oldest slots instead of O(n) shifting */
      this._pOver = (this._pOver + 1) % this._pMax;
      ps[this._pOver] = p;
      return;
    }
    ps.push(p);
  };

  Renderer.prototype._hitBurst = function (x, y, color) {
    const n = 10;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + Math.random() * 0.5;
      const sp = 55 + Math.random() * 95;
      this._spawnP({
        kind: "spark", x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7 - 26,
        g: 130, vr: (Math.random() - 0.5) * 20,
        rot: a, life: 0.22 + Math.random() * 0.2, max: 0.42,
        size: 2.3 + Math.random() * 1.8, color: color,
      });
    }
    for (let k = 0; k < 5; k++) {
      const a = Math.random() * TAU;
      this._spawnP({
        kind: "chip", x: x, y: y,
        vx: Math.cos(a) * 44, vy: Math.sin(a) * 24 - 40,
        g: 150, vr: (Math.random() - 0.5) * 14,
        rot: a, life: 0.4, max: 0.4, size: 1.7, color: "#d8c8a0",
      });
    }
    this._spawnP({
      kind: "flash", x: x, y: y, vx: 0, vy: -6, g: 0,
      vr: 5, rot: Math.random() * TAU,
      life: 0.13, max: 0.13, size: 9, color: "#fff6d0",
    });
    this._spawnP({
      kind: "glow", x: x, y: y, vx: 0, vy: -10, g: 0,
      life: 0.18, max: 0.18, size: 19, color: color,
    });
    for (let k = 0; k < 2; k++) {
      this._spawnP({
        kind: "blood", x: x + (Math.random() - 0.5) * 5, y: y + 2,
        vx: (Math.random() - 0.5) * 30, vy: 4 + Math.random() * 10, g: 60,
        rot: Math.random(), life: 0.45, max: 0.45,
        size: 2 + Math.random(), color: "#7a1c1c",
      });
    }
  };

  /** big directional burst when a hero lands a strike */
  Renderer.prototype._swingBurst = function (x, y, h) {
    const face = h._face || 1;
    const col = h.def.color;
    for (let k = 0; k < 7; k++) {
      const a = -0.85 + (k / 6) * 1.7;
      const sp = 70 + Math.random() * 60;
      this._spawnP({
        kind: "spark", x: x + face * 8, y: y - 10,
        vx: Math.cos(a) * sp * face, vy: Math.sin(a) * sp * 0.6,
        g: 70, vr: (Math.random() - 0.5) * 16,
        rot: face > 0 ? a : Math.PI - a,
        life: 0.15 + Math.random() * 0.12, max: 0.27,
        size: 1.9 + Math.random() * 1.2, color: col,
      });
    }
    this._spawnP({
      kind: "flash", x: x + face * 10, y: y - 10, vx: face * 34, vy: 0, g: 0,
      vr: 7, rot: Math.random() * TAU,
      life: 0.15, max: 0.15, size: 8, color: "#fff6d0",
    });
    this._spawnP({
      kind: "glow", x: x + face * 9, y: y - 10, vx: face * 22, vy: 0, g: 0,
      life: 0.2, max: 0.2, size: 14, color: col,
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
        sp: speciesOf(c),
      };
    }
    const prev = this._seen;
    for (const id in prev) {
      if (cur[id]) continue;
      const o = prev[id];
      /* dust burst */
      const n = o.boss ? 16 : 9;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * TAU + Math.random() * 0.6;
        const sp = 24 + Math.random() * 34;
        this._spawnP({
          kind: "dust", x: o.x, y: o.y - 4,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.55 - 16,
          g: 40, life: 0.5 + Math.random() * 0.35, max: 0.85,
          size: o.boss ? 4.5 : 3,
        });
      }
      /* material debris: wood for machines, stone for constructs, else flesh */
      const woody = o.sp === "catapult" || o.sp === "ancient";
      const stony = o.sp === "gargoyle" || o.sp === "infernal";
      const chipCol = woody ? "#8a6236" : stony ? "#8fa4b0" : (o.color || "#c8b890");
      const chips = o.boss ? 12 : 7;
      for (let k = 0; k < chips; k++) {
        const a = Math.random() * TAU;
        const sp = 40 + Math.random() * 70;
        this._spawnP({
          kind: "chip", x: o.x, y: o.y - 6,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5 - 55,
          g: 190, vr: (Math.random() - 0.5) * 22,
          rot: a, life: 0.5 + Math.random() * 0.3, max: 0.8,
          size: 1.7 + Math.random() * 1.4, color: chipCol,
        });
      }
      if (!woody && !stony) {
        for (let k = 0; k < (o.boss ? 6 : 4); k++) {
          this._spawnP({
            kind: "blood", x: o.x + (Math.random() - 0.5) * 8, y: o.y - 4,
            vx: (Math.random() - 0.5) * 60, vy: -20 - Math.random() * 30, g: 160,
            rot: Math.random() * 3, life: 0.5, max: 0.5,
            size: 2 + Math.random() * 1.6, color: "#7a1c1c",
          });
        }
      }
      /* flash core + expanding shockwave ring */
      this._spawnP({
        kind: "flash", x: o.x, y: o.y - 6, vx: 0, vy: -8, g: 0,
        vr: 4, rot: Math.random() * TAU,
        life: 0.18, max: 0.18, size: o.boss ? 17 : 11, color: "#fff2c8",
      });
      this._spawnP({
        kind: "ringp", x: o.x, y: o.y - 4, vx: 0, vy: 0, g: 0,
        life: 0.32, max: 0.32, size: o.boss ? 34 : 20, color: o.color || "#e8e0c8",
      });
      this._spawnP({
        kind: "glow", x: o.x, y: o.y - 4, vx: 0, vy: -6, g: 0,
        life: 0.3, max: 0.3, size: o.boss ? 30 : 17, color: o.color || "#cfd8dc",
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
        ctx.globalCompositeOperation = "lighter";
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
      } else if (p.kind === "flash") {
        /* additive 4-point star that shrinks as it dies */
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot || 0);
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = a;
        const r = p.size * (0.45 + a * 0.9);
        const w2 = r * 0.2;
        ctx.fillStyle = p.color || "#fff6d0";
        ctx.beginPath();
        ctx.moveTo(r, 0); ctx.lineTo(w2, w2);
        ctx.lineTo(0, r); ctx.lineTo(-w2, w2);
        ctx.lineTo(-r, 0); ctx.lineTo(-w2, -w2);
        ctx.lineTo(0, -r); ctx.lineTo(w2, -w2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (p.kind === "ringp") {
        ctx.save();
        ctx.globalAlpha = a * 0.9;
        ctx.strokeStyle = p.color || "#ffffff";
        ctx.lineWidth = 0.8 + a * 2.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size * (1.25 - a)), 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = a * 0.35;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size * (1.25 - a) * 0.78), 0, TAU);
        ctx.stroke();
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

    const sp = speciesOf(c);
    const dt = this._dt;
    /* walk dust kicked up behind ground units (infernal trails fel embers) */
    if (dt > 0 && !c.flying && (Math.abs(c.x - c.px) + Math.abs(c.y - c.py)) > 0.05) {
      c._rDustT = (c._rDustT == null ? Math.random() * 0.3 : c._rDustT) - dt;
      if (c._rDustT <= 0) {
        c._rDustT = 0.24 + Math.random() * 0.22;
        if (sp === "infernal") {
          this._spawnP({
            kind: "glow", x: x - face * 5 + (Math.random() - 0.5) * 6, y: y + 2,
            vx: (Math.random() - 0.5) * 10, vy: -16 - Math.random() * 12, g: 0,
            life: 0.45, max: 0.45, size: 4.5 + Math.random() * 3, color: "#7bff5a",
          });
        } else {
          this._spawnP({
            kind: "dust", x: x - face * 5 + (Math.random() - 0.5) * 5, y: y + 5,
            vx: -face * (6 + Math.random() * 10), vy: -7 - Math.random() * 7, g: 12,
            life: 0.34 + Math.random() * 0.14, max: 0.48,
            size: 2.2 + Math.random() * 1.2 + (c.boss ? 1.4 : 0),
          });
        }
      }
    }
    /* status motes: ice shards while slowed, fel bubbles while poisoned */
    if (dt > 0 && (c.slow > 0 || c.poison > 0 || c.root > 0)) {
      c._rStatT = (c._rStatT == null ? Math.random() * 0.25 : c._rStatT) - dt;
      if (c._rStatT <= 0) {
        c._rStatT = 0.22 + Math.random() * 0.16;
        if (c.slow > 0) {
          this._spawnP({
            kind: "chip", x: x + (Math.random() - 0.5) * 14, y: y - 14 + flyAlt,
            vx: (Math.random() - 0.5) * 8, vy: 14 + Math.random() * 10, g: 8,
            vr: (Math.random() - 0.5) * 8, rot: Math.random() * TAU,
            life: 0.55, max: 0.55, size: 1.3, color: "#bfe6ff",
          });
          this._spawnP({
            kind: "glow", x: x + (Math.random() - 0.5) * 10, y: y - 10 + flyAlt,
            vx: 0, vy: 8, g: 0, life: 0.4, max: 0.4, size: 5, color: "#9fd8ff",
          });
        }
        if (c.poison > 0) {
          this._spawnP({
            kind: "glow", x: x + (Math.random() - 0.5) * 10, y: y - 6 + flyAlt,
            vx: (Math.random() - 0.5) * 6, vy: -18 - Math.random() * 10, g: 0,
            life: 0.5, max: 0.5, size: 4 + Math.random() * 2.4, color: "#6edc50",
          });
        }
        if (c.root > 0) {
          this._spawnP({
            kind: "chip", x: x + (Math.random() - 0.5) * 10, y: y + 4,
            vx: (Math.random() - 0.5) * 26, vy: -24 - Math.random() * 14, g: 130,
            vr: (Math.random() - 0.5) * 12, rot: Math.random() * TAU,
            life: 0.4, max: 0.4, size: 1.5, color: "#6a4a26",
          });
        }
      }
    }

    ctx.save();
    ctx.translate(x, y + flyAlt);
    ctx.scale(s * face * 1.18, s * 1.18);
    this._creepBody(ctx, sp, c, t);
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
        const jolt = Math.sin(roll * 2.6) * 0.5;
        /* timber chassis with grain + iron bracket */
        this._plate(ctx, -10, -8.6 + jolt, 20, 5.6, "#6b4f34", 1.6);
        ctx.strokeStyle = "rgba(30,18,6,0.5)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-8.4, -5.8 + jolt); ctx.lineTo(8.4, -5.8 + jolt);
        ctx.moveTo(-6, -8.6 + jolt); ctx.lineTo(-6, -3 + jolt);
        ctx.moveTo(5, -8.6 + jolt); ctx.lineTo(5, -3 + jolt);
        ctx.stroke();
        ctx.fillStyle = "#3c3a38";
        ctx.fillRect(-2.2, -10 + jolt, 3.6, 7);
        ctx.fillStyle = "#8a8886";
        ctx.fillRect(-2.2, -10 + jolt, 1.2, 7);
        /* iron-shod wheels with turning spokes and bright hubs */
        for (let k = -1; k <= 1; k += 2) {
          this._ball(ctx, k * 6.4, -0.6, 4.8, 4.8, "#2e241a", 0.14);
          this._rim(ctx, k * 6.4, -0.6, 4.8, 4.8, "#100c06");
          ctx.strokeStyle = "#7a6248";
          ctx.lineWidth = 1.2;
          for (let sK = 0; sK < 3; sK++) {
            const a = roll + (sK / 3) * Math.PI;
            ctx.beginPath();
            ctx.moveTo(k * 6.4 - Math.cos(a) * 3.7, -0.6 - Math.sin(a) * 3.7);
            ctx.lineTo(k * 6.4 + Math.cos(a) * 3.7, -0.6 + Math.sin(a) * 3.7);
            ctx.stroke();
          }
          this._ball(ctx, k * 6.4, -0.6, 1.6, 1.6, "#9aa4ac", 0.42);
          this._spec(ctx, k * 6.4 - 0.5, -1.1, 0.5);
        }
        /* throwing arm with lit edge + winch rope */
        ctx.lineCap = "round";
        ctx.strokeStyle = "#54381c";
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(-5, -8 + jolt);
        ctx.lineTo(5.6, -18.6 + jolt);
        ctx.stroke();
        ctx.strokeStyle = "#8a6a42";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-5, -8.7 + jolt);
        ctx.lineTo(5.3, -19.1 + jolt);
        ctx.stroke();
        ctx.strokeStyle = "#b8a070";
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(-5, -8 + jolt);
        ctx.lineTo(-8.6, -12.4 + jolt);
        ctx.stroke();
        /* sling cup + boulder with spec and smoldering coal */
        ctx.fillStyle = "#3a2c1a";
        ctx.beginPath();
        ctx.arc(6, -18 + jolt, 3.9, Math.PI * 0.15, Math.PI * 0.95);
        ctx.fill();
        this._ball(ctx, 6.2, -18.8 + jolt, 3, 3, "#78716a", 0.32);
        this._rim(ctx, 6.2, -18.8 + jolt, 3, 3, "#2c2824");
        this._spec(ctx, 5.2, -19.8 + jolt, 0.9);
        ctx.fillStyle = "rgba(255,150,60,0.9)";
        ctx.fillRect(6.8, -18.2 + jolt, 1.1, 1.1);
        break;
      }
      case "wyvern": {
        const flap = Math.sin(t * 11 + (c.id || 0)) * 0.85;
        /* far wing: dark membrane with bone fingers */
        ctx.fillStyle = shade(col, -0.38);
        ctx.beginPath();
        ctx.moveTo(-1.6, -9.6);
        ctx.quadraticCurveTo(-9 - flap * 2, -17 - flap * 5, -14, -11.4 - flap * 6.4);
        ctx.quadraticCurveTo(-8.4, -9.6, -3, -7.4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = shade(col, -0.58);
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(-2.4, -9.4); ctx.lineTo(-13.2, -11.6 - flap * 6.2);
        ctx.moveTo(-2.4, -9.4); ctx.lineTo(-9.8, -14.2 - flap * 5);
        ctx.stroke();
        /* whipping tail with pale barb */
        ctx.strokeStyle = shade(col, -0.2);
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";
        const tailY = Math.sin(t * 3 + (c.id || 0)) * 1.3;
        ctx.beginPath();
        ctx.moveTo(-5.4, -8);
        ctx.quadraticCurveTo(-11.4, -6, -13.6, -1 + tailY);
        ctx.stroke();
        ctx.fillStyle = "#e8e0c8";
        ctx.beginPath();
        ctx.moveTo(-14.7, 0.3 + tailY);
        ctx.lineTo(-12.6, -2.3 + tailY);
        ctx.lineTo(-11.5, 0.4 + tailY);
        ctx.closePath();
        ctx.fill();
        /* body with top-left light + belly scale ridges */
        this._ball(ctx, 0, -8.4, 7, 4.4, col, 0.32);
        this._rim(ctx, 0, -8.4, 7, 4.4, shade(col, -0.62));
        ctx.strokeStyle = shade(col, 0.44);
        ctx.lineWidth = 1;
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.arc(1 - k * 2.6, -7.2, 2.6, 0.4, Math.PI - 0.6);
          ctx.stroke();
        }
        /* dorsal spine ridges */
        ctx.fillStyle = shade(col, -0.46);
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.moveTo(-1.2 - k * 2.5, -11.9);
          ctx.lineTo(-0.2 - k * 2.5, -13.8);
          ctx.lineTo(0.8 - k * 2.5, -11.7);
          ctx.closePath();
          ctx.fill();
        }
        /* head: open jaw, fang, glossy eye */
        this._ball(ctx, 7.6, -10.6, 3.2, 2.8, shade(col, 0.1), 0.36);
        this._rim(ctx, 7.6, -10.6, 3.2, 2.8, shade(col, -0.62));
        ctx.fillStyle = shade(col, -0.25);
        ctx.beginPath();
        ctx.moveTo(9.6, -9.8); ctx.lineTo(12.4, -8.8); ctx.lineTo(9.6, -8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#f4f0dc";
        ctx.beginPath();
        ctx.moveTo(9.9, -9.7); ctx.lineTo(10.6, -8.4); ctx.lineTo(11, -9.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#1c140c";
        ctx.beginPath();
        ctx.arc(8.2, -11.2, 0.85, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillRect(7.9, -11.8, 0.7, 0.7);
        /* near wing: lit membrane with finger bone */
        ctx.fillStyle = shade(col, 0.34);
        ctx.beginPath();
        ctx.moveTo(1, -11.4);
        ctx.quadraticCurveTo(3 + flap, -19 - flap * 4, 8.4, -14 - flap * 5);
        ctx.quadraticCurveTo(5, -11.4, 2, -10.6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = shade(col, -0.3);
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(1.6, -11.4); ctx.lineTo(7.9, -14.2 - flap * 5);
        ctx.stroke();
        break;
      }
      case "gargoyle": {
        const flap = Math.sin(t * 9 + (c.id || 0)) * 0.9;
        const stone = "#78909c";
        /* far wing: shadowed stone membrane */
        ctx.fillStyle = shade(stone, -0.42);
        ctx.beginPath();
        ctx.moveTo(-1.6, -10);
        ctx.lineTo(-8, -15 - flap * 3.4);
        ctx.lineTo(-12.4, -10.4 - flap * 5);
        ctx.lineTo(-8, -8.6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = shade(stone, -0.62);
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(-2, -10); ctx.lineTo(-11.8, -10.6 - flap * 5);
        ctx.moveTo(-2, -10); ctx.lineTo(-7.7, -14.4 - flap * 3.4);
        ctx.stroke();
        /* dangling claw legs */
        ctx.strokeStyle = shade(stone, -0.3);
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-1.6, -5.4); ctx.lineTo(-2.1, -1.8);
        ctx.moveTo(1.8, -5.4); ctx.lineTo(2.4, -2);
        ctx.stroke();
        ctx.fillStyle = shade(stone, -0.5);
        ctx.beginPath();
        ctx.arc(-2.1, -1.4, 1, 0, TAU);
        ctx.arc(2.4, -1.6, 1, 0, TAU);
        ctx.fill();
        /* stone body with volume + weathering cracks */
        this._ball(ctx, 0, -9, 5.6, 4.6, stone, 0.34);
        this._rim(ctx, 0, -9, 5.6, 4.6, "#26323a");
        ctx.strokeStyle = "rgba(20,28,32,0.55)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-2.6, -10.8); ctx.lineTo(-0.8, -8.6); ctx.lineTo(-1.8, -6.6);
        ctx.moveTo(1.8, -7.2); ctx.lineTo(3.2, -8.8);
        ctx.stroke();
        /* head with horns, snarl, glowing eyes */
        this._ball(ctx, 4.6, -12.6, 3, 2.8, shade(stone, 0.15), 0.38);
        this._rim(ctx, 4.6, -12.6, 3, 2.8, "#26323a");
        ctx.fillStyle = shade(stone, -0.35);
        ctx.beginPath();
        ctx.moveTo(2.9, -14.8); ctx.lineTo(3.5, -17.4); ctx.lineTo(4.7, -15);
        ctx.closePath();
        ctx.moveTo(5.3, -14.7); ctx.lineTo(6.5, -17); ctx.lineTo(6.9, -14.3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = shade(stone, -0.18);
        ctx.beginPath();
        ctx.ellipse(6.6, -11.7, 1.7, 1.2, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#e8e4d8";
        ctx.fillRect(6.1, -11.3, 0.8, 1.3);
        ctx.fillRect(7.3, -11.3, 0.7, 1.1);
        this._drawGlow(ctx, 4.4, -13.2, 3.6, "#ff5040", 0.5);
        ctx.fillStyle = "#ff7a60";
        ctx.fillRect(3.6, -13.6, 1.1, 1);
        ctx.fillRect(5.2, -13.6, 1.1, 1);
        /* near wing: lit membrane */
        ctx.fillStyle = shade(stone, 0.22);
        ctx.beginPath();
        ctx.moveTo(1.6, -10.6);
        ctx.lineTo(8, -15.4 - flap * 4);
        ctx.lineTo(12.4, -11 - flap * 5.4);
        ctx.lineTo(8.4, -9.4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = shade(stone, -0.35);
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(2, -10.6); ctx.lineTo(11.9, -11.2 - flap * 5.4);
        ctx.moveTo(2, -10.6); ctx.lineTo(7.8, -14.9 - flap * 4);
        ctx.stroke();
        break;
      }
      case "acolyte": {
        /* layered robe: dark base with a lit front fold */
        ctx.fillStyle = "#332e40";
        ctx.beginPath();
        ctx.moveTo(-5.8, 0.5);
        ctx.quadraticCurveTo(-4.6, -8, -0.6, -13.4 + bob);
        ctx.quadraticCurveTo(4.4, -8.6, 5.8, 0.5);
        ctx.closePath();
        ctx.fill();
        const rg = ctx.createLinearGradient(-4, -12 + bob, 3, 0);
        rg.addColorStop(0, "#6e6688");
        rg.addColorStop(1, "#413a52");
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.moveTo(-4.6, 0.5);
        ctx.quadraticCurveTo(-4, -7.4, -0.8, -12.6 + bob);
        ctx.lineTo(0.8, -12 + bob);
        ctx.quadraticCurveTo(0.4, -6, 0.8, 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(16,12,24,0.55)";
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(-2.4, -1); ctx.quadraticCurveTo(-2.8, -6, -1.4, -10 + bob);
        ctx.moveTo(2.6, -1); ctx.quadraticCurveTo(3, -5.4, 2, -9 + bob);
        ctx.stroke();
        /* rope belt with a dangling sickle glinting */
        ctx.strokeStyle = "#a08a56";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(-3.6, -6.4 + bob);
        ctx.quadraticCurveTo(0, -5.2, 3.8, -6.6 + bob);
        ctx.stroke();
        ctx.strokeStyle = "#c8ccd8";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(-2.8, -3.6 + bob, 1.8, 0.4, 3);
        ctx.stroke();
        this._spec(ctx, -3.8, -4.6 + bob, 0.5);
        /* hood: shadowed face + fel eyes */
        ctx.fillStyle = "#16121e";
        ctx.beginPath();
        ctx.arc(0.6, -13.2 + bob, 2.7, 0, TAU);
        ctx.fill();
        this._drawGlow(ctx, 0.8, -13.2 + bob, 4.2, "#8de07a", 0.55);
        ctx.fillStyle = "#b0f59a";
        ctx.fillRect(-0.6, -13.9 + bob, 1.2, 1.1);
        ctx.fillRect(1.5, -13.9 + bob, 1.2, 1.1);
        ctx.fillStyle = "#4a4260";
        ctx.beginPath();
        ctx.arc(0.4, -13.8 + bob, 3.7, Math.PI * 0.8, Math.PI * 1.95);
        ctx.quadraticCurveTo(3.8, -12 + bob, 3.4, -11.4 + bob);
        ctx.quadraticCurveTo(1.4, -10.6 + bob, -2.4, -10.8 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = shade("#57506a", 0.4);
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(0.4, -13.8 + bob, 3.6, Math.PI * 0.85, Math.PI * 1.8);
        ctx.stroke();
        /* cupped sleeve carrying a pulsing ritual orb */
        ctx.fillStyle = "#443e56";
        ctx.beginPath();
        ctx.ellipse(3.9, -8 + bob, 2.3, 1.5, -0.4, 0, TAU);
        ctx.fill();
        ctx.fillStyle = shade("#443e56", 0.28);
        ctx.beginPath();
        ctx.ellipse(3.5, -8.5 + bob, 1.3, 0.8, -0.4, 0, TAU);
        ctx.fill();
        const orbP = 0.55 + 0.3 * Math.sin(t * 4 + (c.id || 0));
        this._drawGlow(ctx, 5.3, -9.8 + bob, 5.6, "#8de07a", orbP);
        ctx.fillStyle = "#dcffc8";
        ctx.beginPath();
        ctx.arc(5.3, -9.8 + bob, 1.4, 0, TAU);
        ctx.fill();
        break;
      }
      case "knight": {
        const rb = bob * 0.6;
        /* 4-beat horse legs with dark hooves */
        ctx.strokeStyle = "#6a7484";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        for (let k = 0; k < 4; k++) {
          const ph = walk + k * (Math.PI / 2);
          const lx = -6.4 + k * 4.2;
          const hx = lx + Math.sin(ph) * 2.8;
          ctx.beginPath();
          ctx.moveTo(lx, -6);
          ctx.lineTo(hx, 0.4);
          ctx.stroke();
          ctx.fillStyle = "#2c3038";
          ctx.beginPath();
          ctx.ellipse(hx, 0.8, 1.3, 0.8, 0, 0, TAU);
          ctx.fill();
        }
        /* swishing tail */
        ctx.strokeStyle = "#dce4ee";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-9, -9 + rb);
        ctx.quadraticCurveTo(-12, -7, -11.4 + Math.sin(t * 2.4) * 1.2, -2.4);
        ctx.stroke();
        /* barded horse body */
        this._ball(ctx, 0, -8.6 + rb, 9.4, 4.8, "#b9c4d4", 0.36);
        this._rim(ctx, 0, -8.6 + rb, 9.4, 4.8, "#46505e");
        /* caparison skirt in the enemy color with gold studs */
        ctx.fillStyle = shade(col, -0.08);
        ctx.beginPath();
        ctx.moveTo(-8.4, -8 + rb);
        ctx.lineTo(8.4, -8 + rb);
        ctx.lineTo(7, -4.2 + rb);
        ctx.lineTo(-7, -4.2 + rb);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = shade(col, 0.32);
        ctx.fillRect(-8.4, -8.4 + rb, 16.8, 1.2);
        ctx.fillStyle = "#e8c040";
        for (let k = 0; k < 4; k++) ctx.fillRect(-6.2 + k * 4, -5.6 + rb, 1.3, 1.3);
        /* armored neck with lit edge */
        ctx.fillStyle = "#aab6c8";
        ctx.beginPath();
        ctx.moveTo(7, -9.4 + rb);
        ctx.quadraticCurveTo(11, -14.4, 12.4, -17);
        ctx.lineTo(14.8, -14.6);
        ctx.quadraticCurveTo(11.4, -11, 9.4, -6.6 + rb);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = shade("#aab6c8", 0.3);
        ctx.beginPath();
        ctx.moveTo(7.4, -9.8 + rb);
        ctx.quadraticCurveTo(10.4, -13.8, 12.2, -16.6);
        ctx.lineTo(13, -15.6);
        ctx.quadraticCurveTo(10.4, -12, 8.7, -8.8 + rb);
        ctx.closePath();
        ctx.fill();
        /* chamfroned horse head, dark eye, pricked ears */
        this._ball(ctx, 13.6, -16, 2.5, 2.1, "#c8d2df", 0.42);
        ctx.fillStyle = "#8892a2";
        ctx.beginPath();
        ctx.moveTo(12.3, -17.8); ctx.lineTo(12.8, -19.7); ctx.lineTo(13.9, -17.9);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#1c2026";
        ctx.beginPath();
        ctx.arc(14.3, -16.4, 0.6, 0, TAU);
        ctx.fill();
        this._spec(ctx, 12.9, -16.9, 0.6);
        /* rider: plate torso, kite shield, plumed helm */
        this._plate(ctx, -2.8, -18.2 + rb, 5.6, 7.6, "#9caabc", 2);
        this._plate(ctx, -6.8, -15.6 + rb, 4.2, 5.6, col, 1.8);
        ctx.fillStyle = "#e8c040";
        ctx.beginPath();
        ctx.arc(-4.7, -12.9 + rb, 0.9, 0, TAU);
        ctx.fill();
        this._ball(ctx, 0, -20.6 + rb, 2.7, 2.7, "#d4dce8", 0.44);
        this._rim(ctx, 0, -20.6 + rb, 2.7, 2.7, "#5a6474");
        this._spec(ctx, -0.9, -21.6 + rb, 0.8);
        ctx.fillStyle = "#14161c";
        ctx.fillRect(0.2, -21.1 + rb, 2.3, 0.9);
        ctx.fillStyle = "#d43a2a";
        ctx.beginPath();
        ctx.moveTo(-0.4, -23 + rb);
        ctx.quadraticCurveTo(-3.6, -25.6, -5.8, -23.6 + Math.sin(t * 3) * 0.5 + rb);
        ctx.quadraticCurveTo(-3.2, -23, -1.4, -21.6 + rb);
        ctx.closePath();
        ctx.fill();
        /* couched lance with bright steel tip */
        ctx.strokeStyle = "#8a6236";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-0.4, -13.6 + rb);
        ctx.lineTo(13.4, -20.6 + rb);
        ctx.stroke();
        ctx.fillStyle = "#eef2f8";
        ctx.beginPath();
        ctx.moveTo(15.6, -21.8 + rb);
        ctx.lineTo(12.5, -21 + rb);
        ctx.lineTo(13.5, -19.4 + rb);
        ctx.closePath();
        ctx.fill();
        this._spec(ctx, 14.1, -20.9 + rb, 0.7);
        break;
      }
      case "ancient": {
        const stomp = Math.sin(walk * 0.6);
        const lean = Math.sin(walk * 0.3) * 0.045;
        ctx.save();
        ctx.rotate(lean);
        /* stomping root legs with toe clusters */
        ctx.strokeStyle = "#3a2812";
        ctx.lineWidth = 3.4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-4.4, -6);
        ctx.lineTo(-6.4 + stomp * 2, -1);
        ctx.moveTo(4.4, -6);
        ctx.lineTo(6.4 - stomp * 2, -1);
        ctx.stroke();
        ctx.fillStyle = "#33200e";
        ctx.beginPath();
        ctx.ellipse(-6.4 + stomp * 2, -0.4, 3.2, 1.6, 0, 0, TAU);
        ctx.ellipse(6.4 - stomp * 2, -0.4, 3.2, 1.6, 0, 0, TAU);
        ctx.fill();
        /* bark trunk with cross-light gradient */
        const bark = "#4a3016";
        const tg = ctx.createLinearGradient(-8, -18, 8, -2);
        tg.addColorStop(0, shade(bark, 0.3));
        tg.addColorStop(0.5, bark);
        tg.addColorStop(1, shade(bark, -0.36));
        ctx.fillStyle = tg;
        ctx.beginPath();
        ctx.moveTo(-8.6, -4);
        ctx.quadraticCurveTo(-7.4, -12, -5.4, -17 + stomp);
        ctx.lineTo(5.4, -17 + stomp);
        ctx.quadraticCurveTo(7.4, -12, 8.6, -4);
        ctx.quadraticCurveTo(0, -7, -8.6, -4);
        ctx.closePath();
        ctx.fill();
        /* grain lines + knothole */
        ctx.strokeStyle = "#241606";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(-2.6, -5); ctx.quadraticCurveTo(-3.4, -10, -2.4, -14 + stomp);
        ctx.moveTo(2.6, -5); ctx.quadraticCurveTo(3.4, -9, 2.6, -12 + stomp);
        ctx.moveTo(-6.4, -6); ctx.quadraticCurveTo(-6.8, -10, -5.4, -14 + stomp);
        ctx.stroke();
        ctx.fillStyle = "#241606";
        ctx.beginPath();
        ctx.ellipse(4.6, -7.6, 1.3, 1.8, 0.3, 0, TAU);
        ctx.fill();
        /* gnarled branch arms with lit tops */
        ctx.strokeStyle = bark;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(-6, -14 + stomp);
        ctx.quadraticCurveTo(-11, -16, -12.4, -20 + stomp * 1.4);
        ctx.moveTo(6, -14 + stomp);
        ctx.quadraticCurveTo(11, -17, 12, -19 - stomp * 1.2);
        ctx.stroke();
        ctx.strokeStyle = shade(bark, 0.32);
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(-6, -14.7 + stomp);
        ctx.quadraticCurveTo(-10.4, -16.4, -12, -19.6 + stomp * 1.4);
        ctx.moveTo(6, -14.7 + stomp);
        ctx.quadraticCurveTo(10.4, -17.4, 11.6, -18.8 - stomp * 1.2);
        ctx.stroke();
        /* burning amber gaze + mouth crack */
        this._drawGlow(ctx, 0, -12.4 + stomp, 5.4, "#ffb84a", 0.55);
        ctx.fillStyle = "#ffd27a";
        ctx.beginPath();
        ctx.moveTo(-4, -13.6 + stomp); ctx.lineTo(-1.2, -12.6 + stomp); ctx.lineTo(-4, -11.6 + stomp);
        ctx.closePath();
        ctx.moveTo(4, -13.6 + stomp); ctx.lineTo(1.2, -12.6 + stomp); ctx.lineTo(4, -11.6 + stomp);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#1c1206";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-2.4, -8.6 + stomp);
        ctx.lineTo(-1, -7.8 + stomp);
        ctx.lineTo(0.6, -8.8 + stomp);
        ctx.lineTo(2.2, -8 + stomp);
        ctx.stroke();
        /* three-tone swaying canopy with a hanging vine */
        const sway2 = Math.sin(t * 1.1 + (c.id || 0)) * 1.6;
        ctx.fillStyle = "#1d3a16";
        ctx.beginPath();
        ctx.arc(sway2 + 6, -22 + stomp, 6.4, 0, TAU);
        ctx.arc(sway2 - 7, -21 + stomp, 5.8, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#2f6127";
        ctx.beginPath();
        ctx.arc(sway2 - 1, -25 + stomp, 7, 0, TAU);
        ctx.arc(sway2 + 5, -24 + stomp, 5, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#4c9440";
        ctx.beginPath();
        ctx.arc(sway2 - 3.4, -27.4 + stomp, 3.6, 0, TAU);
        ctx.arc(sway2 + 1.4, -28 + stomp, 2.8, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = "#3f7a34";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sway2 + 9, -21 + stomp);
        ctx.quadraticCurveTo(sway2 + 10, -17, sway2 + 9 + Math.sin(t * 2) * 1, -14 + stomp);
        ctx.stroke();
        ctx.restore();
        break;
      }
      case "doom": {
        /* digitigrade legs ending in cloven hooves */
        ctx.strokeStyle = "#38152e";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-3, -6.4);
        ctx.lineTo(-4 + gait * 2.6, -3);
        ctx.lineTo(-3 + gait * 2.8, 0.4);
        ctx.moveTo(3, -6.4);
        ctx.lineTo(4 - gait * 2.6, -3);
        ctx.lineTo(3 - gait * 2.8, 0.4);
        ctx.stroke();
        ctx.fillStyle = "#1c0a16";
        ctx.beginPath();
        ctx.ellipse(-3 + gait * 2.8, 0.6, 1.8, 1, 0, 0, TAU);
        ctx.ellipse(3 - gait * 2.8, 0.6, 1.8, 1, 0, 0, TAU);
        ctx.fill();
        /* half-spread bat wings on both sides with rib veins */
        const wflap = Math.sin(t * 3 + (c.id || 0));
        for (let k = -1; k <= 1; k += 2) {
          ctx.fillStyle = k < 0 ? "#240b1e" : "#331129";
          ctx.beginPath();
          ctx.moveTo(k * 2.4, -13 + bob);
          ctx.quadraticCurveTo(k * 9, -19 - wflap, k * 11.4, -16.4 - wflap * 1.4 + bob);
          ctx.lineTo(k * 9.4, -12.4 + bob);
          ctx.lineTo(k * 10.4, -9 + bob);
          ctx.lineTo(k * 6.4, -8.4 + bob);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#4a1a3e";
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(k * 2.6, -12.4 + bob);
          ctx.lineTo(k * 10.8, -16 - wflap * 1.4 + bob);
          ctx.moveTo(k * 2.6, -12 + bob);
          ctx.lineTo(k * 9.8, -12.6 + bob);
          ctx.stroke();
        }
        /* muscled torso with pec highlights + ab shadow */
        this._ball(ctx, 0, -10 + bob, 6.6, 6, col, 0.32);
        this._rim(ctx, 0, -10 + bob, 6.6, 6, "#1c0a2c");
        ctx.fillStyle = shade(col, 0.36);
        ctx.beginPath();
        ctx.ellipse(-2, -12 + bob, 2.4, 1.7, 0.2, 0, TAU);
        ctx.ellipse(2.6, -11.8 + bob, 2.2, 1.6, -0.2, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = shade(col, -0.42);
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(0.2, -10 + bob);
        ctx.lineTo(0.2, -6 + bob);
        ctx.stroke();
        /* armored belt plate */
        this._plate(ctx, -5, -6.8 + bob, 10, 2.8, "#5a4a20", 1.2);
        /* horned head with burning eyes and bared fangs */
        this._ball(ctx, 2.4, -16 + bob, 3.4, 3.2, shade(col, 0.18), 0.36);
        this._rim(ctx, 2.4, -16 + bob, 3.4, 3.2, "#1c0a2c");
        ctx.strokeStyle = "#e0d4c0";
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.moveTo(0.4, -18.4 + bob);
        ctx.quadraticCurveTo(-1.6, -22.4, 0.8, -23.6 + bob);
        ctx.moveTo(4.4, -18.4 + bob);
        ctx.quadraticCurveTo(6.6, -22.4, 4.2, -23.6 + bob);
        ctx.stroke();
        ctx.fillStyle = "#f4ecd8";
        ctx.beginPath();
        ctx.arc(0.8, -23.6 + bob, 0.9, 0, TAU);
        ctx.arc(4.2, -23.6 + bob, 0.9, 0, TAU);
        ctx.fill();
        this._drawGlow(ctx, 3.2, -16.4 + bob, 4.6, "#ffb040", 0.6);
        ctx.fillStyle = "#ffc860";
        ctx.fillRect(1.5, -16.9 + bob, 1.4, 1.2);
        ctx.fillRect(3.9, -16.9 + bob, 1.4, 1.2);
        ctx.fillStyle = "#f4ecd8";
        ctx.fillRect(2.3, -14.3 + bob, 0.9, 1.4);
        ctx.fillRect(3.9, -14.3 + bob, 0.9, 1.4);
        /* flaming sword: dark grip, brass guard, living flame blade */
        ctx.save();
        ctx.translate(5.8, -8.4 + bob);
        ctx.rotate(Math.sin(t * 2.2 + (c.id || 0)) * 0.1 - 0.5);
        ctx.fillStyle = "#3a3038";
        ctx.fillRect(-0.8, 0, 1.7, 3.4);
        ctx.fillStyle = "#c8b060";
        ctx.fillRect(-2.2, -0.9, 4.6, 1.3);
        this._spec(ctx, -1.2, -0.4, 0.5);
        const fg = ctx.createLinearGradient(0, 0, 0, -13);
        fg.addColorStop(0, "#ffd070");
        fg.addColorStop(1, "#ff5a20");
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.moveTo(-1.3, -0.9);
        ctx.quadraticCurveTo(-2 + Math.sin(t * 9) * 0.8, -7, 0.1, -13);
        ctx.quadraticCurveTo(2 + Math.sin(t * 11) * 0.8, -7, 1.5, -0.9);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff2c0";
        ctx.beginPath();
        ctx.moveTo(-0.4, -1.1);
        ctx.quadraticCurveTo(-0.8, -5.4, 0.1, -9);
        ctx.quadraticCurveTo(0.9, -5.4, 0.6, -1.1);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        this._drawGlow(ctx, 6.2, -15 + bob, 8, "#ff8030", 0.4);
        break;
      }
      case "infernal": {
        const fl = Math.sin(t * 13 + (c.id || 0) * 3);
        const fl2 = Math.sin(t * 9.4 + (c.id || 0) * 5);
        this._drawGlow(ctx, 0, -10, 17, "#7bff5a", 0.55);
        /* outer fel-flame envelope */
        ctx.fillStyle = "rgba(90,220,70,0.5)";
        ctx.beginPath();
        ctx.moveTo(-8.4, -1);
        ctx.quadraticCurveTo(-10, -13 - fl * 2, -4, -18 - fl2 * 3);
        ctx.quadraticCurveTo(-1, -23 - fl * 3, 1.4, -19 - fl2 * 2);
        ctx.quadraticCurveTo(4.4, -22 - fl * 2, 5.4, -16.4 - fl * 3);
        ctx.quadraticCurveTo(9.4, -12 + fl2 * 2, 8.4, -1);
        ctx.closePath();
        ctx.fill();
        /* hotter inner flame */
        ctx.fillStyle = "rgba(150,255,120,0.75)";
        ctx.beginPath();
        ctx.moveTo(-6, -2);
        ctx.quadraticCurveTo(-7, -12 - fl2 * 2, -2.4, -15.4 - fl * 2.6);
        ctx.quadraticCurveTo(0, -19 - fl2 * 2, 2.6, -15 - fl * 2.4);
        ctx.quadraticCurveTo(6.4, -11 + fl * 1.4, 5.6, -2);
        ctx.closePath();
        ctx.fill();
        /* floating rock plates: lit top-left edges + glowing fel cracks */
        const rocks = [
          [-5.8, -12.4, 5, 4.6, 0.2],
          [1.6, -13.6, 5, 4.8, -0.15],
          [-2.4, -16.8, 4.8, 4, 0.1],
          [-3, -8, 5.6, 4.6, -0.1],
          [-8, -5.6 + fl * 0.6, 3.6, 3.2, 0.3],
          [4.6, -6.2 - fl * 0.6, 3.8, 3.4, -0.25],
        ];
        for (let k = 0; k < rocks.length; k++) {
          const r = rocks[k];
          ctx.save();
          ctx.translate(r[0] + r[2] / 2, r[1] + r[3] / 2);
          ctx.rotate(r[4]);
          ctx.fillStyle = "#20262a";
          ctx.fillRect(-r[2] / 2, -r[3] / 2, r[2], r[3]);
          ctx.fillStyle = "#39444a";
          ctx.fillRect(-r[2] / 2, -r[3] / 2, r[2], 1.4);
          ctx.fillStyle = "#2c343a";
          ctx.fillRect(-r[2] / 2, -r[3] / 2, 1.2, r[3]);
          ctx.strokeStyle = "rgba(120,255,90,0.55)";
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(-r[2] * 0.25, -r[3] * 0.3);
          ctx.lineTo(r[2] * 0.1, 0);
          ctx.lineTo(-r[2] * 0.15, r[3] * 0.3);
          ctx.stroke();
          ctx.restore();
        }
        /* white-hot eyes */
        this._drawGlow(ctx, 0, -15.4, 5.4, "#d8ffc0", 0.85);
        ctx.fillStyle = "#f4ffe8";
        ctx.fillRect(-1.8, -16.1, 1.5, 1.5);
        ctx.fillRect(0.9, -16.1, 1.5, 1.5);
        break;
      }
      default: {
        /* generic beast: shaded body, snouted head, horns, glossy eye */
        this._legs(ctx, gait, shade(col, -0.3), 2.4);
        this._ball(ctx, 0, -9 + bob, 6.6, 5.8, col, 0.32);
        this._rim(ctx, 0, -9 + bob, 6.6, 5.8, shade(col, -0.6));
        this._spec(ctx, -2.2, -11.6 + bob, 1.2);
        this._ball(ctx, 4.6, -13.6 + bob, 3.2, 3, shade(col, 0.16), 0.36);
        this._rim(ctx, 4.6, -13.6 + bob, 3.2, 3, shade(col, -0.6));
        ctx.fillStyle = "#e8e0c8";
        ctx.beginPath();
        ctx.moveTo(2.9, -15.9 + bob); ctx.lineTo(3.3, -18.2 + bob); ctx.lineTo(4.5, -16 + bob);
        ctx.closePath();
        ctx.moveTo(5.3, -15.8 + bob); ctx.lineTo(6.3, -17.8 + bob); ctx.lineTo(6.7, -15.4 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#1c140c";
        ctx.beginPath();
        ctx.arc(5.5, -13.9 + bob, 1, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillRect(5.6, -14.6 + bob, 0.7, 0.7);
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
    /* attack detection: cooldown jumping up means a strike just landed */
    if (h.attackCd > (h._rPrevCd == null ? 0 : h._rPrevCd) + 0.001) {
      h._rSwingT = t;
      this._swingBurst(x, y, h);
    }
    h._rPrevCd = h.attackCd;
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
    /* hp / mana bars (above the taller commander sprite) */
    const ratio = Math.max(0, h.hp / h.maxHp);
    ctx.fillStyle = "rgba(10,8,6,0.85)";
    ctx.fillRect(x - 13, y - 34, 26, 7);
    ctx.fillStyle = "#2ecc40";
    ctx.fillRect(x - 12, y - 33, 24 * ratio, 3);
    ctx.fillStyle = "#3b7dd8";
    ctx.fillRect(x - 12, y - 29.4, 24 * Math.max(0, h.mana / h.maxMana), 1.8);
  };

  /** layered cape hanging behind the hero, lit on the outer edge */
  Renderer.prototype._cape = function (ctx, hex, bob, wave) {
    ctx.fillStyle = shade(hex, -0.38);
    ctx.beginPath();
    ctx.moveTo(-1.4, -15.4 + bob);
    ctx.quadraticCurveTo(-8.4 - wave, -10, -7.4 - wave * 1.6, 0.6);
    ctx.lineTo(-3.4 - wave * 0.5, -0.4);
    ctx.lineTo(-0.6, -6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = hex;
    ctx.beginPath();
    ctx.moveTo(-1.4, -15.2 + bob);
    ctx.quadraticCurveTo(-6.4 - wave * 0.8, -9.4, -5.4 - wave * 1.2, 0.2);
    ctx.lineTo(-2.6, -1);
    ctx.lineTo(-0.6, -7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = shade(hex, 0.34);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-1.8, -14.8 + bob);
    ctx.quadraticCurveTo(-7.6 - wave, -9.4, -6.6 - wave * 1.5, 0);
    ctx.stroke();
    ctx.strokeStyle = shade(hex, -0.52);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-2.4, -12 + bob);
    ctx.quadraticCurveTo(-4.4 - wave * 0.6, -6, -4 - wave, -0.4);
    ctx.stroke();
  };

  /**
   * Hero body painter, feet at (0,0), facing +x. Shared with the portrait.
   * Reads renderer-stamped h._rSwingT for the attack-swing pose.
   */
  Renderer.prototype._heroBody = function (ctx, h, t, moving) {
    const id = h.def.id;
    const col = h.def.color;
    const gait = moving ? Math.sin(t * 12) : 0;
    const bob = moving ? Math.abs(gait) * -1.5 : Math.sin(t * 2.2) * 0.7;
    /* 1 right as a strike lands, easing back to 0 over ~0.26s */
    const sw = Math.max(0, 1 - (t - (h._rSwingT == null ? -9 : h._rSwingT)) / 0.26);
    const capeW = Math.sin(t * 4) * (moving ? 2.6 : 1);
    ctx.save();
    ctx.scale(1.18, 1.18);

    if (id === "paladin") {
      /* plate greaves + sabatons */
      ctx.strokeStyle = "#8a8ea0";
      ctx.lineWidth = 2.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-2.4, -6); ctx.lineTo(-2.6 + gait * 2.8, -0.6);
      ctx.moveTo(2.4, -6); ctx.lineTo(2.6 - gait * 2.8, -0.6);
      ctx.stroke();
      ctx.fillStyle = "#b8bdcc";
      ctx.beginPath();
      ctx.ellipse(-2.6 + gait * 2.8, 0, 2.2, 1.1, 0, 0, TAU);
      ctx.ellipse(2.6 - gait * 2.8, 0, 2.2, 1.1, 0, 0, TAU);
      ctx.fill();
      /* royal cape + silver breastplate with gold trim */
      this._cape(ctx, "#2c4a9e", bob, capeW);
      this._plate(ctx, -5.2, -15.4 + bob, 10.4, 10.8, "#d8dce8", 3);
      ctx.fillStyle = "#d4a017";
      ctx.fillRect(-5.2, -10 + bob, 10.4, 1.5);
      /* blue tabard with the holy diamond sigil */
      ctx.fillStyle = "#2c4a9e";
      ctx.fillRect(-2.6, -9.6 + bob, 5.2, 6.2);
      ctx.fillStyle = shade("#2c4a9e", 0.3);
      ctx.fillRect(-2.6, -9.6 + bob, 1.6, 6.2);
      ctx.fillStyle = "#ffd75e";
      ctx.beginPath();
      ctx.moveTo(0, -8.4 + bob); ctx.lineTo(1.5, -6.6 + bob);
      ctx.lineTo(0, -4.8 + bob); ctx.lineTo(-1.5, -6.6 + bob);
      ctx.closePath();
      ctx.fill();
      /* massive gold-rimmed pauldrons */
      this._ball(ctx, -4.9, -14.8 + bob, 3.4, 2.8, "#c8ccd8", 0.4);
      this._rim(ctx, -4.9, -14.8 + bob, 3.4, 2.8, "#5a6070");
      ctx.strokeStyle = "#d4a017";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(-4.9, -14.8 + bob, 3.4, 2.8, 0, Math.PI * 1.02, Math.PI * 1.98);
      ctx.stroke();
      this._ball(ctx, 4.9, -14.8 + bob, 3.1, 2.6, "#d4d8e4", 0.42);
      this._rim(ctx, 4.9, -14.8 + bob, 3.1, 2.6, "#5a6070");
      this._spec(ctx, -5.8, -15.9 + bob, 1);
      /* bearded face under a gold crown */
      this._head(ctx, 0.8, -18.8 + bob, 3, "#d8b090");
      ctx.fillStyle = "#e8e4da";
      ctx.beginPath();
      ctx.ellipse(1.5, -16.7 + bob, 2.2, 1.7, 0.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#d8d4ca";
      ctx.beginPath();
      ctx.ellipse(-1.6, -18.4 + bob, 1.1, 1.9, 0.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#d4a017";
      ctx.fillRect(-2.1, -21.9 + bob, 5.8, 1.6);
      ctx.fillStyle = "#ffd75e";
      ctx.beginPath();
      ctx.moveTo(-2.1, -21.9 + bob); ctx.lineTo(-1.3, -23.5 + bob); ctx.lineTo(-0.5, -21.9 + bob);
      ctx.moveTo(-0.1, -21.9 + bob); ctx.lineTo(0.8, -23.9 + bob); ctx.lineTo(1.7, -21.9 + bob);
      ctx.moveTo(2.1, -21.9 + bob); ctx.lineTo(2.9, -23.5 + bob); ctx.lineTo(3.7, -21.9 + bob);
      ctx.closePath();
      ctx.fill();
      /* warhammer arm: swings down through the target */
      ctx.save();
      ctx.translate(4.2, -11.4 + bob);
      ctx.rotate(-0.2 - sw * 1.6 + (moving ? gait * 0.06 : Math.sin(t * 2) * 0.08));
      ctx.strokeStyle = "#b8bdcc";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(3.2, -6);
      ctx.stroke();
      ctx.strokeStyle = "#7a5a30";
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.moveTo(3.2, -6); ctx.lineTo(5.8, -12);
      ctx.stroke();
      this._plate(ctx, 3.2, -16.2, 6.6, 4.4, "#e8e4d4", 1.6);
      ctx.fillStyle = "#d4a017";
      ctx.fillRect(3.2, -12.4, 6.6, 1);
      this._spec(ctx, 4.7, -15.2, 1);
      this._drawGlow(ctx, 6.5, -14, 8, "#ffe8a0", 0.5 + sw * 0.45);
      ctx.restore();
      this._drawGlow(ctx, 0, -14 + bob, 15, "#ffe8a0", 0.14 + sw * 0.3);

    } else if (id === "blademaster") {
      const skin = "#7a9a52";
      /* baggy crimson trousers + wrapped boots */
      ctx.strokeStyle = "#8a3020";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-2.2, -6); ctx.lineTo(-2.5 + gait * 2.8, -0.8);
      ctx.moveTo(2.2, -6); ctx.lineTo(2.5 - gait * 2.8, -0.8);
      ctx.stroke();
      ctx.fillStyle = "#3a2a1a";
      ctx.beginPath();
      ctx.ellipse(-2.5 + gait * 2.8, 0, 2, 1, 0, 0, TAU);
      ctx.ellipse(2.5 - gait * 2.8, 0, 2, 1, 0, 0, TAU);
      ctx.fill();
      /* sashimono war banner on the back */
      ctx.strokeStyle = "#54381c";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-3, -14 + bob);
      ctx.lineTo(-5.8, -27 + bob);
      ctx.stroke();
      const bw = Math.sin(t * 5) * 1.5;
      ctx.fillStyle = "#b03028";
      ctx.beginPath();
      ctx.moveTo(-5.8, -27 + bob);
      ctx.quadraticCurveTo(-11, -25 + bw, -12, -20.4 + bw + bob);
      ctx.lineTo(-6.6, -21 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = shade("#b03028", 0.35);
      ctx.beginPath();
      ctx.moveTo(-5.8, -27 + bob);
      ctx.quadraticCurveTo(-9, -25.6 + bw, -10.4, -23.4 + bw * 0.7 + bob);
      ctx.lineTo(-6.4, -23.6 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffd75e";
      ctx.beginPath();
      ctx.arc(-8.6, -23.2 + bw * 0.5 + bob, 1.2, 0, TAU);
      ctx.fill();
      /* bare muscled orc torso */
      this._ball(ctx, 0, -11.4 + bob, 5.2, 5.8, skin, 0.34);
      this._rim(ctx, 0, -11.4 + bob, 5.2, 5.8, "#33481c");
      ctx.fillStyle = shade(skin, 0.32);
      ctx.beginPath();
      ctx.ellipse(-1.6, -13 + bob, 2, 1.4, 0.15, 0, TAU);
      ctx.ellipse(2, -12.8 + bob, 1.9, 1.3, -0.15, 0, TAU);
      ctx.fill();
      /* shoulder strap + red waist sash */
      ctx.strokeStyle = "#3a2a14";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-4.4, -14.4 + bob);
      ctx.lineTo(4, -8 + bob);
      ctx.stroke();
      ctx.fillStyle = "#8a1c1c";
      ctx.fillRect(-4.8, -7.4 + bob, 9.6, 2.2);
      ctx.fillStyle = shade("#8a1c1c", 0.32);
      ctx.fillRect(-4.8, -7.4 + bob, 9.6, 0.8);
      /* spiked leather pauldron */
      this._ball(ctx, -4.4, -15.2 + bob, 2.8, 2.3, "#6a4a26", 0.32);
      this._rim(ctx, -4.4, -15.2 + bob, 2.8, 2.3, "#33200e");
      ctx.fillStyle = "#e8e0c8";
      ctx.beginPath();
      ctx.moveTo(-6.2, -16.4 + bob); ctx.lineTo(-7.4, -18.9 + bob); ctx.lineTo(-5.2, -17.2 + bob);
      ctx.closePath();
      ctx.fill();
      /* orc face: jaw, tusks, red bandana, whipping topknot */
      this._head(ctx, 0.8, -19 + bob, 3, skin);
      ctx.fillStyle = "#f4f0dc";
      ctx.fillRect(1.9, -17.3 + bob, 1, 1.9);
      ctx.fillRect(3.4, -17.5 + bob, 0.9, 1.6);
      ctx.fillStyle = "#a02020";
      ctx.beginPath();
      ctx.ellipse(0.8, -20.7 + bob, 3.1, 1.7, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#6a1414";
      ctx.fillRect(-2.3, -20.9 + bob, 6.2, 1);
      ctx.strokeStyle = "#1c1410";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0.4, -22.1 + bob);
      ctx.quadraticCurveTo(-2, -24.4, -4.4, -22.4 + Math.sin(t * 4) * 0.8 + bob);
      ctx.stroke();
      /* katana arm with a wide cutting arc */
      ctx.save();
      ctx.translate(4, -12 + bob);
      ctx.rotate(-0.55 - sw * 1.9 + (moving ? gait * 0.05 : Math.sin(t * 1.8) * 0.08));
      ctx.strokeStyle = skin;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(3, -2.4);
      ctx.stroke();
      ctx.strokeStyle = "#2c1c10";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(2.4, -1.6); ctx.lineTo(4.4, -3.4);
      ctx.stroke();
      ctx.strokeStyle = "#f4f7ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4.4, -3.4);
      ctx.quadraticCurveTo(10.4, -8.4, 14.4, -12.4);
      ctx.stroke();
      ctx.strokeStyle = "#98a4b8";
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(4.8, -4.4);
      ctx.quadraticCurveTo(10, -8.8, 13.8, -12.4);
      ctx.stroke();
      ctx.fillStyle = "#f4f7ff";
      ctx.beginPath();
      ctx.moveTo(14.8, -12.8); ctx.lineTo(12.6, -12.4); ctx.lineTo(13.9, -11);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      /* additive slash arc while the strike lands */
      if (sw > 0.05) {
        ctx.save();
        ctx.globalAlpha = sw * 0.8;
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = "#fff4d8";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(3, -11 + bob, 12, -2 + (1 - sw) * 1.5, -0.6 + (1 - sw) * 1.5);
        ctx.stroke();
        ctx.restore();
      }
      /* wind walk afterimage shimmer */
      if (h.frenzyUntil > t) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = "#cfe8f4";
        ctx.beginPath();
        ctx.ellipse(-6 - capeW, -10 + bob, 4, 7, 0.2, 0, TAU);
        ctx.fill();
        ctx.restore();
      }

    } else if (id === "demonhunter") {
      const meta = h.metaUntil > t;
      const skin = meta ? "#7a5090" : "#8a6aa8";
      const fel = meta ? "#b26aff" : "#4de07a";
      /* metamorphosis wings unfurl behind everything */
      if (meta) {
        const wf = Math.sin(t * 6) * 1.4;
        for (let k = -1; k <= 1; k += 2) {
          ctx.fillStyle = "rgba(44,16,60,0.85)";
          ctx.beginPath();
          ctx.moveTo(k * 1.6, -15 + bob);
          ctx.quadraticCurveTo(k * 10, -24 - wf, k * 14.4, -17.4 - wf * 1.5 + bob);
          ctx.lineTo(k * 11.4, -13.4 + bob);
          ctx.lineTo(k * 12.4, -9.4 + bob);
          ctx.lineTo(k * 5.4, -10 + bob);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "rgba(178,106,255,0.6)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(k * 2, -14.4 + bob);
          ctx.lineTo(k * 13.8, -17 - wf * 1.5 + bob);
          ctx.moveTo(k * 2, -14 + bob);
          ctx.lineTo(k * 11.6, -13.2 + bob);
          ctx.stroke();
        }
      }
      /* wrapped legs */
      ctx.strokeStyle = "#3a2846";
      ctx.lineWidth = 2.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-2.2, -6); ctx.lineTo(-2.5 + gait * 2.8, -0.6);
      ctx.moveTo(2.2, -6); ctx.lineTo(2.5 - gait * 2.8, -0.6);
      ctx.stroke();
      ctx.fillStyle = "#241c30";
      ctx.beginPath();
      ctx.ellipse(-2.5 + gait * 2.8, 0, 1.9, 1, 0, 0, TAU);
      ctx.ellipse(2.5 - gait * 2.8, 0, 1.9, 1, 0, 0, TAU);
      ctx.fill();
      /* bare torso with glowing fel tattoos */
      this._ball(ctx, 0, -11.4 + bob, 4.8, 5.6, skin, 0.32);
      this._rim(ctx, 0, -11.4 + bob, 4.8, 5.6, "#2c1c3c");
      ctx.strokeStyle = fel;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(-1, -12 + bob, 2.6, 0.6, 2.4);
      ctx.moveTo(2.6, -13.4 + bob);
      ctx.quadraticCurveTo(3.6, -11, 2.4, -8.4 + bob);
      ctx.stroke();
      ctx.fillStyle = "#3a2846";
      ctx.fillRect(-3.4, -7 + bob, 6.8, 2.4);
      ctx.fillStyle = shade("#3a2846", 0.3);
      ctx.fillRect(-3.4, -7 + bob, 6.8, 0.8);
      /* head: flowing hair, horns, blindfold leaking fel light */
      this._ball(ctx, 0.8, -19 + bob, 3, 3.1, skin, 0.34);
      this._rim(ctx, 0.8, -19 + bob, 3, 3.1, "#2c1c3c");
      ctx.fillStyle = "#241c30";
      ctx.beginPath();
      ctx.moveTo(-0.6, -22 + bob);
      ctx.quadraticCurveTo(-4.4, -21, -5.4, -15.4 + Math.sin(t * 3) * 0.8 + bob);
      ctx.quadraticCurveTo(-3, -16.4, -2.1, -18.4 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = shade("#241c30", 0.35);
      ctx.beginPath();
      ctx.ellipse(0.5, -21.2 + bob, 2.8, 1.4, 0, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = "#3a2a1a";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-1, -21.4 + bob);
      ctx.quadraticCurveTo(-3.4, -24.4, -2.6, -26 + bob);
      ctx.moveTo(2.8, -21.4 + bob);
      ctx.quadraticCurveTo(5, -24.4, 4.4, -26 + bob);
      ctx.stroke();
      ctx.fillStyle = "#f4ecd8";
      ctx.beginPath();
      ctx.arc(-2.6, -26 + bob, 0.7, 0, TAU);
      ctx.arc(4.4, -26 + bob, 0.7, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#181420";
      ctx.fillRect(-1.7, -19.9 + bob, 5, 1.7);
      this._drawGlow(ctx, 1, -19 + bob, 4.6, fel, 0.6);
      ctx.fillStyle = meta ? "#d0a8ff" : "#a8f090";
      ctx.fillRect(-0.9, -19.6 + bob, 1.3, 1.1);
      ctx.fillRect(1.8, -19.6 + bob, 1.3, 1.1);
      /* twin warglaives spinning outward on attack */
      for (let k = -1; k <= 1; k += 2) {
        ctx.save();
        ctx.translate(k * 5.2, -10.4 + bob);
        ctx.rotate(k * (0.2 + sw * 1.7) + (moving ? gait * 0.06 : Math.sin(t * 2.4 + k) * 0.1));
        ctx.strokeStyle = "#c8ccd8";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, 0, 5, -1.3, 1.5);
        ctx.stroke();
        ctx.strokeStyle = meta ? "#c89aff" : "#7ce8a8";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 6.2, -1.1, 1.3);
        ctx.stroke();
        ctx.fillStyle = "#3a2a1a";
        ctx.fillRect(-1.1, -1.1, 2.2, 2.2);
        this._spec(ctx, 2.9, -3.4, 0.8);
        ctx.restore();
      }
      this._drawGlow(ctx, 0, -12 + bob, 13, fel, 0.16 + sw * 0.3);

    } else { /* deathknight */
      /* dark saronite greaves */
      ctx.strokeStyle = "#3c4a62";
      ctx.lineWidth = 2.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-2.4, -6); ctx.lineTo(-2.6 + gait * 2.8, -0.6);
      ctx.moveTo(2.4, -6); ctx.lineTo(2.6 - gait * 2.8, -0.6);
      ctx.stroke();
      ctx.fillStyle = "#546480";
      ctx.beginPath();
      ctx.ellipse(-2.6 + gait * 2.8, 0, 2.2, 1.1, 0, 0, TAU);
      ctx.ellipse(2.6 - gait * 2.8, 0, 2.2, 1.1, 0, 0, TAU);
      ctx.fill();
      /* midnight cape + rune-etched breastplate */
      this._cape(ctx, "#1a2438", bob, capeW);
      this._plate(ctx, -5.2, -15.4 + bob, 10.4, 10.8, "#4a5a74", 3);
      ctx.strokeStyle = "rgba(126,200,255,0.75)";
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(-2.8, -13 + bob); ctx.lineTo(-0.8, -11 + bob); ctx.lineTo(-2.8, -9 + bob);
      ctx.moveTo(1.4, -13 + bob); ctx.lineTo(1.4, -9 + bob);
      ctx.moveTo(0.4, -12 + bob); ctx.lineTo(2.4, -10 + bob);
      ctx.stroke();
      /* skull belt buckle */
      ctx.fillStyle = "#2c3648";
      ctx.fillRect(-5.2, -6.6 + bob, 10.4, 1.9);
      ctx.fillStyle = "#d8d2bc";
      ctx.beginPath();
      ctx.arc(0, -5.9 + bob, 1.6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#141210";
      ctx.fillRect(-0.9, -6.3 + bob, 0.7, 0.8);
      ctx.fillRect(0.3, -6.3 + bob, 0.7, 0.8);
      /* spiked pauldrons */
      this._ball(ctx, -4.9, -15 + bob, 3.4, 2.8, "#5a6a84", 0.36);
      this._rim(ctx, -4.9, -15 + bob, 3.4, 2.8, "#242e40");
      ctx.fillStyle = "#8a9ab4";
      ctx.beginPath();
      ctx.moveTo(-6.2, -16.6 + bob); ctx.lineTo(-7.9, -20.2 + bob); ctx.lineTo(-4.6, -17.4 + bob);
      ctx.closePath();
      ctx.fill();
      this._ball(ctx, 4.9, -15 + bob, 3, 2.5, "#64748e", 0.38);
      this._rim(ctx, 4.9, -15 + bob, 3, 2.5, "#242e40");
      this._spec(ctx, -5.8, -16 + bob, 0.9);
      /* pale face framed by flowing white hair, icy gaze */
      this._head(ctx, 0.8, -18.8 + bob, 3, "#cbb8b0");
      ctx.fillStyle = "#e8ecf0";
      ctx.beginPath();
      ctx.moveTo(-0.4, -21.6 + bob);
      ctx.quadraticCurveTo(-4, -20.6, -4.8, -14.4 + Math.sin(t * 2.6) * 0.8 + bob);
      ctx.quadraticCurveTo(-2.6, -15.4, -2, -18.2 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = shade("#e8ecf0", -0.12);
      ctx.beginPath();
      ctx.ellipse(0.6, -21 + bob, 2.9, 1.5, 0, Math.PI, 0);
      ctx.fill();
      this._drawGlow(ctx, 1.6, -18.8 + bob, 3.6, "#7ec8ff", 0.5);
      /* Frostmourne: broad runeblade with skull crossguard */
      ctx.save();
      ctx.translate(4.4, -11.4 + bob);
      ctx.rotate(-0.25 - sw * 1.4 + (moving ? gait * 0.05 : Math.sin(t * 2) * 0.07));
      ctx.strokeStyle = "#8a9ab4";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(2.6, -3.4);
      ctx.stroke();
      ctx.fillStyle = "#9ab0c8";
      ctx.fillRect(0.7, -5.5, 4.6, 1.3);
      ctx.fillStyle = "#e8e4d4";
      ctx.beginPath();
      ctx.arc(3, -4.8, 1.1, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#101418";
      ctx.fillRect(2.4, -5.1, 0.5, 0.6);
      ctx.fillRect(3.3, -5.1, 0.5, 0.6);
      const bg = ctx.createLinearGradient(2, -5, 4.6, -17);
      bg.addColorStop(0, "#dce8f4");
      bg.addColorStop(1, "#8ab8e0");
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.moveTo(1.9, -5.5);
      ctx.lineTo(4, -17.6);
      ctx.lineTo(5.5, -5.5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#48607c";
      ctx.lineWidth = 0.7;
      ctx.stroke();
      ctx.strokeStyle = "rgba(126,200,255,0.9)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(3.4, -6.6);
      ctx.lineTo(3.9, -14.6);
      ctx.stroke();
      ctx.fillStyle = "#bfe6ff";
      for (let k = 0; k < 3; k++) ctx.fillRect(3.15, -8.2 - k * 2.6, 1.2, 1.1);
      this._spec(ctx, 2.8, -12, 0.8);
      this._drawGlow(ctx, 3.8, -12, 8, "#7ec8ff", 0.35 + sw * 0.45);
      ctx.restore();
      /* frost mist pooling at the feet */
      ctx.fillStyle = "rgba(126,200,255,0.13)";
      ctx.beginPath();
      ctx.ellipse(0, 0.5, 8.4, 2.6, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
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
          p._rtl = 0.03;
          this._spawnP({
            kind: "glow", x: p.x, y: p.y, vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10, g: 0, life: 0.3, max: 0.3,
            size: 5.5, color: col,
          });
          if (Math.random() < 0.4) {
            this._spawnP({
              kind: "spark", x: p.x, y: p.y,
              vx: (Math.random() - 0.5) * 26, vy: (Math.random() - 0.5) * 26,
              g: 0, vr: 8, rot: Math.random() * TAU,
              life: 0.22, max: 0.22, size: 1.4, color: col,
            });
          }
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
          p._rtl = 0.035;
          this._spawnP({
            kind: "smoke", x: p.x, y: p.y, vx: (Math.random() - 0.5) * 8,
            vy: -7, g: -5, life: 0.55, max: 0.55, size: 3.2,
          });
          this._spawnP({
            kind: "glow", x: p.x - Math.cos(ang) * 3, y: p.y - Math.sin(ang) * 3,
            vx: 0, vy: -4, g: 0, life: 0.16, max: 0.16, size: 5, color: "#ffa030",
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
        if (p._rtl <= 0) {
          p._rtl = 0.03;
          /* arrow wake: short streaks aligned with flight */
          this._spawnP({
            kind: "spark", x: p.x - Math.cos(ang) * 6, y: p.y - Math.sin(ang) * 6,
            vx: -Math.cos(ang) * 14, vy: -Math.sin(ang) * 14, g: 0,
            rot: ang, life: 0.16, max: 0.16, size: 2.2, color: rgba(col, 0.9),
          });
          if (Math.random() < 0.35) {
            this._spawnP({
              kind: "glow", x: p.x, y: p.y, vx: 0, vy: 0, g: 0,
              life: 0.14, max: 0.14, size: 5, color: col,
            });
          }
        }
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
        if (p._rtl <= 0) {
          p._rtl = 0.035;
          this._spawnP({
            kind: "spark", x: p.x - Math.cos(ang) * 5, y: p.y - Math.sin(ang) * 5,
            vx: -Math.cos(ang) * 10 + (Math.random() - 0.5) * 8,
            vy: -Math.sin(ang) * 10 + (Math.random() - 0.5) * 8, g: 20,
            rot: ang, life: 0.15, max: 0.15, size: 1.8, color: "#e8d8a8",
          });
          if (Math.random() < 0.3) {
            this._spawnP({
              kind: "dust", x: p.x, y: p.y, vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8, g: 0,
              life: 0.22, max: 0.22, size: 1.8,
            });
          }
        }
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
      this._drawGlow(ctx, w * 0.5, h * 0.45, w * 0.34, col, 0.3);
      ctx.save();
      ctx.translate(w * 0.5, h * 0.62);
      const s = w / 82;
      ctx.scale(s, s);
      this._towerBody(ctx, sel.def, sel.tier || 1, t, 1.7, false);
      ctx.restore();
    } else if (sel.kind === "hero" && sel.def) {
      /* rim light so the commander pops off the backdrop */
      this._drawGlow(ctx, w * 0.5, h * 0.42, w * 0.36, col, 0.35);
      ctx.save();
      ctx.translate(w * 0.5, h * 0.74);
      const s = w / 52;
      ctx.scale(s, s);
      this._heroBody(ctx, sel, t, false);
      ctx.restore();
    } else {
      this._drawGlow(ctx, w * 0.52, h * 0.45, w * 0.34, col, 0.3);
      ctx.save();
      ctx.translate(w * 0.52, h * 0.7);
      const s = w / (sel.boss ? 60 : 48);
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
