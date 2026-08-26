(function (root) {
  "use strict";
  const TILE = 48;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function Renderer(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.w = 1152;
    this.h = 768;
    this.shake = 0;
    this.time = 0;
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

  Renderer.prototype.draw = function (game, alpha) {
    const ctx = this.ctx;
    this.time = game.time;
    if (this.w < 10) this.resize();
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.save();
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
      this.shake *= 0.86;
    }
    ctx.translate(this.w / 2, this.h / 2);
    ctx.scale(game.cam.z, game.cam.z);
    ctx.translate(-game.cam.x, -game.cam.y);

    this.drawTerrain(game);
    this.drawPath(game);
    this.drawDoodads(game);
    this.drawKeep(game);
    this.drawPortal(game);
    if (game.buildGhost) this.drawGhost(game);
    this.drawTowers(game);
    this.drawHero(game, alpha);
    this.drawCreeps(game, alpha);
    this.drawProjectiles(game);
    this.drawFx(game);
    this.drawNight(game);
    ctx.restore();
    this.drawVignette();
  };

  Renderer.prototype.drawTerrain = function (game) {
    const ctx = this.ctx;
    const night = 0.15 + 0.2 * Math.sin(game.time * 0.05 + game.waveIndex);
    for (let y = 0; y < game.mapH; y++) {
      for (let x = 0; x < game.mapW; x++) {
        const n = ((x * 17 + y * 31) ^ (x * y * 13)) & 7;
        const g = 68 + n * 6 - night * 20;
        ctx.fillStyle = "rgb(" + (42 + n) + "," + (g | 0) + "," + (28 + (n % 3)) + ")";
        ctx.fillRect(x * TILE, y * TILE, TILE + 1, TILE + 1);
        if (n === 0) {
          ctx.fillStyle = "rgba(20,50,16,0.25)";
          ctx.beginPath();
          ctx.ellipse(x * TILE + 24, y * TILE + 28, 10, 5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  };

  Renderer.prototype.drawPath = function (game) {
    const ctx = this.ctx;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = "#6b4b2a";
    ctx.lineWidth = 40;
    ctx.beginPath();
    game.path.forEach(function (p, i) {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    ctx.strokeStyle = "#8a6236";
    ctx.lineWidth = 28;
    ctx.stroke();
    ctx.strokeStyle = "rgba(40,24,10,0.25)";
    ctx.lineWidth = 6;
    ctx.setLineDash([8, 10]);
    ctx.stroke();
    ctx.setLineDash([]);
    game.path.forEach(function (p, i) {
      if (i % 2) {
        ctx.fillStyle = "rgba(90,70,40,0.4)";
        ctx.beginPath();
        ctx.arc(p.x + ((i * 13) % 7) - 3, p.y + ((i * 9) % 5) - 2, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  };

  Renderer.prototype.drawDoodads = function (game) {
    const ctx = this.ctx;
    game.doodads.forEach(function (d) {
      if (d.kind === "tree") {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath();
        ctx.ellipse(d.x, d.y + 10, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#5a3a1a";
        ctx.fillRect(d.x - 3, d.y - 4, 6, 14);
        ctx.fillStyle = d.tone || "#2e6b2a";
        ctx.beginPath();
        ctx.arc(d.x, d.y - 12, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#3f8a38";
        ctx.beginPath();
        ctx.arc(d.x - 6, d.y - 16, 9, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.kind === "rock") {
        ctx.fillStyle = "#5a5348";
        ctx.beginPath();
        ctx.moveTo(d.x - 10, d.y + 4);
        ctx.lineTo(d.x - 2, d.y - 8);
        ctx.lineTo(d.x + 10, d.y - 2);
        ctx.lineTo(d.x + 8, d.y + 6);
        ctx.closePath();
        ctx.fill();
      } else if (d.kind === "banner") {
        ctx.fillStyle = "#3a2a14";
        ctx.fillRect(d.x, d.y - 22, 3, 26);
        ctx.fillStyle = d.tone || "#8b1e1e";
        ctx.beginPath();
        ctx.moveTo(d.x + 3, d.y - 22);
        ctx.lineTo(d.x + 18, d.y - 16);
        ctx.lineTo(d.x + 3, d.y - 10);
        ctx.fill();
      }
    });
  };

  Renderer.prototype.drawPortal = function (game) {
    const p = game.path[0];
    const ctx = this.ctx;
    const t = game.time;
    ctx.save();
    ctx.translate(p.x - 18, p.y);
    for (let i = 5; i >= 0; i--) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(120,40,200," + (0.15 + i * 0.08) + ")";
      ctx.lineWidth = 3;
      ctx.ellipse(0, 0, 16 + i * 3, 22 + i * 2, t * 0.7 + i, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(40,0,60,0.85)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  Renderer.prototype.drawKeep = function (game) {
    const p = game.path[game.path.length - 1];
    const ctx = this.ctx;
    ctx.fillStyle = "#4a4034";
    ctx.fillRect(p.x - 10, p.y - 28, 46, 40);
    ctx.fillStyle = "#6a5a44";
    ctx.fillRect(p.x - 4, p.y - 40, 16, 16);
    ctx.fillRect(p.x + 18, p.y - 36, 12, 14);
    ctx.fillStyle = "#8b1e1e";
    ctx.beginPath();
    ctx.moveTo(p.x - 6, p.y - 40);
    ctx.lineTo(p.x + 4, p.y - 50);
    ctx.lineTo(p.x + 14, p.y - 40);
    ctx.fill();
    ctx.fillStyle = "#d4a017";
    ctx.fillRect(p.x + 8, p.y - 8, 10, 18);
  };

  Renderer.prototype.drawGhost = function (game) {
    const g = game.buildGhost;
    const ctx = this.ctx;
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = g.ok ? "#7cde6a" : "#e24a3b";
    ctx.beginPath();
    ctx.arc(g.x, g.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = g.ok ? "rgba(80,220,80,0.5)" : "rgba(220,60,60,0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (!g.ok) {
      ctx.strokeStyle = "#ff4444";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(g.x - 10, g.y - 10);
      ctx.lineTo(g.x + 10, g.y + 10);
      ctx.moveTo(g.x + 10, g.y - 10);
      ctx.lineTo(g.x - 10, g.y + 10);
      ctx.stroke();
    }
  };

  Renderer.prototype.drawTowers = function (game) {
    const ctx = this.ctx;
    const self = this;
    game.towers.forEach(function (t) {
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(t.x, t.y + 12, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3a3228";
      ctx.fillRect(t.x - 12, t.y - 6, 24, 16);
      ctx.fillStyle = t.def.color;
      ctx.fillRect(t.x - 9, t.y - 20, 18, 18);
      ctx.fillStyle = "#d4a017";
      for (let i = 0; i < t.tier; i++) ctx.fillRect(t.x - 8 + i * 6, t.y - 24, 4, 4);
      if (t.race === "human") {
        ctx.fillStyle = "#e8e0c8";
        ctx.fillRect(t.x - 3, t.y - 30, 6, 10);
      } else if (t.race === "orc") {
        ctx.fillStyle = "#5a2a10";
        ctx.beginPath();
        ctx.moveTo(t.x - 10, t.y - 20);
        ctx.lineTo(t.x, t.y - 34);
        ctx.lineTo(t.x + 10, t.y - 20);
        ctx.fill();
      } else if (t.race === "nightelf") {
        ctx.fillStyle = "#2e5a24";
        ctx.beginPath();
        ctx.arc(t.x, t.y - 22, 10, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "#4dd0e1";
        ctx.beginPath();
        ctx.moveTo(t.x, t.y - 34);
        ctx.lineTo(t.x + 8, t.y - 18);
        ctx.lineTo(t.x - 8, t.y - 18);
        ctx.fill();
      }
      if (game.selected === t || (game.settings.showRange && game.selected === t)) {
        ctx.strokeStyle = "rgba(80,220,120,0.35)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (game.selected === t) {
        ctx.strokeStyle = "#4cff4c";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(t.x, t.y + 10, 16, 7, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  };

  Renderer.prototype.drawCreeps = function (game, alpha) {
    const ctx = this.ctx;
    game.creeps.forEach(function (c) {
      if (c.hp <= 0) return;
      const x = c.px + (c.x - c.px) * alpha;
      const y = c.py + (c.y - c.py) * alpha;
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(x, y + 8, c.flying ? 8 : 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      const bob = c.flying ? Math.sin(game.time * 6 + c.id) * 4 - 10 : 0;
      ctx.fillStyle = c.color;
      ctx.beginPath();
      if (c.flying) {
        ctx.ellipse(x, y + bob, 9, 5, 0, 0, Math.PI * 2);
      } else if (c.boss) {
        ctx.arc(x, y - 4, 11, 0, Math.PI * 2);
      } else {
        ctx.arc(x, y, 7, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.beginPath();
      ctx.arc(x - 2, y - 2 + bob, 2, 0, Math.PI * 2);
      ctx.fill();
      const ratio = c.hp / c.maxHp;
      ctx.fillStyle = "#111";
      ctx.fillRect(x - 10, y - 16 + bob, 20, 3);
      ctx.fillStyle = ratio > 0.5 ? "#2ecc40" : ratio > 0.25 ? "#f1c40f" : "#e74c3c";
      ctx.fillRect(x - 10, y - 16 + bob, 20 * ratio, 3);
      if (game.selected === c) {
        ctx.strokeStyle = "#ff4444";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y + 8, 12, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  };

  Renderer.prototype.drawHero = function (game, alpha) {
    const h = game.hero;
    if (!h) return;
    const ctx = this.ctx;
    const x = h.px + (h.x - h.px) * alpha;
    const y = h.py + (h.y - h.py) * alpha;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = h.def.color;
    ctx.beginPath();
    ctx.arc(x, y - 2, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffe082";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - 2, 11, 0, Math.PI * 2);
    ctx.stroke();
    if (h.shield > 0) {
      ctx.strokeStyle = "rgba(255,230,120,0.7)";
      ctx.beginPath();
      ctx.arc(x, y - 2, 16, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (game.selected === h) {
      ctx.strokeStyle = "#4cff4c";
      ctx.beginPath();
      ctx.ellipse(x, y + 10, 14, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    const ratio = h.hp / h.maxHp;
    ctx.fillStyle = "#111";
    ctx.fillRect(x - 12, y - 20, 24, 3);
    ctx.fillStyle = "#2ecc40";
    ctx.fillRect(x - 12, y - 20, 24 * ratio, 3);
  };

  Renderer.prototype.drawProjectiles = function (game) {
    const ctx = this.ctx;
    game.projectiles.forEach(function (p) {
      ctx.fillStyle = p.color || "#fff3a0";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.splash ? 4 : 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,200,0.35)";
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
      ctx.stroke();
    });
  };

  Renderer.prototype.drawFx = function (game) {
    const ctx = this.ctx;
    game.fx.forEach(function (f) {
      ctx.globalAlpha = Math.max(0, f.life / f.max);
      if (f.kind === "text") {
        ctx.fillStyle = f.color || "#fff";
        ctx.font = "bold 12px Palatino, serif";
        ctx.fillText(f.text, f.x, f.y);
      } else if (f.kind === "spark") {
        ctx.fillStyle = f.color || "#ffe082";
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r || 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (f.kind === "ring") {
        ctx.strokeStyle = f.color || "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(f.x, f.y, (f.r || 8) * (1 - f.life / f.max + 0.3), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });
  };

  Renderer.prototype.drawNight = function (game) {
    const phase = (game.waveIndex / 4) % 2;
    if (phase < 1) return;
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(10,16,40," + (0.12 + 0.1 * Math.sin(game.time)) + ")";
    ctx.fillRect(-20, -20, game.mapW * TILE + 40, game.mapH * TILE + 40);
  };

  Renderer.prototype.drawVignette = function () {
    const ctx = this.ctx;
    const g = ctx.createRadialGradient(this.w / 2, this.h / 2, this.w * 0.3, this.w / 2, this.h / 2, this.w * 0.7);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);
  };

  Renderer.prototype.drawMinimap = function (canvas, game) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = "#163016";
    ctx.fillRect(0, 0, w, h);
    const sx = w / (game.mapW * TILE);
    const sy = h / (game.mapH * TILE);
    ctx.strokeStyle = "#8a6236";
    ctx.lineWidth = 2;
    ctx.beginPath();
    game.path.forEach(function (p, i) {
      if (i === 0) ctx.moveTo(p.x * sx, p.y * sy);
      else ctx.lineTo(p.x * sx, p.y * sy);
    });
    ctx.stroke();
    game.towers.forEach(function (t) {
      ctx.fillStyle = t.def.color;
      ctx.fillRect(t.x * sx - 1, t.y * sy - 1, 3, 3);
    });
    game.creeps.forEach(function (c) {
      if (c.hp <= 0) return;
      ctx.fillStyle = c.flying ? "#7ec8ff" : "#e24a3b";
      ctx.fillRect(c.x * sx - 1, c.y * sy - 1, 2, 2);
    });
    if (game.hero) {
      ctx.fillStyle = "#ffe082";
      ctx.fillRect(game.hero.x * sx - 2, game.hero.y * sy - 2, 4, 4);
    }
    ctx.strokeStyle = "rgba(255,255,200,0.6)";
    ctx.lineWidth = 1;
    const vw = this.w / game.cam.z;
    const vh = this.h / game.cam.z;
    ctx.strokeRect((game.cam.x - vw / 2) * sx, (game.cam.y - vh / 2) * sy, vw * sx, vh * sy);
  };

  Renderer.prototype.drawPortrait = function (canvas, sel) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = "#1a120a";
    ctx.fillRect(0, 0, w, h);
    const col = sel && sel.def ? sel.def.color : sel && sel.color ? sel.color : "#6aa4e8";
    const g = ctx.createRadialGradient(w * 0.4, h * 0.35, 8, w * 0.5, h * 0.55, w * 0.6);
    g.addColorStop(0, col);
    g.addColorStop(1, "#0a0806");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.52, Math.min(w, h) * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.arc(w * 0.4, h * 0.42, 8, 0, Math.PI * 2);
    ctx.fill();
  };

  root.Renderer = Renderer;
})(typeof globalThis !== "undefined" ? globalThis : this);
