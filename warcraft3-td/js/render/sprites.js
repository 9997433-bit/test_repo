/* Procedural sprite painters. Everything is drawn with canvas primitives —
 * no imported art, no Blizzard assets. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});

  const TAU = Math.PI * 2;

  function shade(ctx, x, y, rx, ry, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha === undefined ? 0.34 : alpha;
    ctx.fillStyle = '#0a1208';
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* Fill a path with an opaque base colour, then wash a translucent gradient
   * over it. Putting the alpha only in the wash keeps the block solid — a
   * gradient that ends on a transparent stop would make the wall see-through. */
  function face(ctx, path, base, gx0, gy0, gx1, gy1, from, to) {
    ctx.fillStyle = base;
    path(); ctx.fill();
    const g = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
    g.addColorStop(0, from); g.addColorStop(1, to);
    ctx.fillStyle = g;
    path(); ctx.fill();
  }

  function box(ctx, x, y, w, h, top, colTop, colLeft, colRight) {
    // isometric-ish block: left face, right face, top face
    face(ctx, () => {
      ctx.beginPath();
      ctx.moveTo(x - w, y); ctx.lineTo(x - w, y - h); ctx.lineTo(x, y - h + top); ctx.lineTo(x, y + top);
      ctx.closePath();
    }, colLeft, x - w, y - h, x, y, 'rgba(255,255,255,0.10)', 'rgba(0,0,0,0.45)');

    face(ctx, () => {
      ctx.beginPath();
      ctx.moveTo(x + w, y); ctx.lineTo(x + w, y - h); ctx.lineTo(x, y - h + top); ctx.lineTo(x, y + top);
      ctx.closePath();
    }, colRight, x, y - h, x + w, y, 'rgba(255,255,255,0.14)', 'rgba(0,0,0,0.30)');

    const topPath = () => {
      ctx.beginPath();
      ctx.moveTo(x, y - h + top); ctx.lineTo(x - w, y - h); ctx.lineTo(x, y - h - top); ctx.lineTo(x + w, y - h);
      ctx.closePath();
    };
    face(ctx, topPath, colTop, x - w, y - h - top, x + w, y - h + top,
         'rgba(255,255,255,0.20)', 'rgba(0,0,0,0.18)');

    ctx.strokeStyle = 'rgba(255,240,200,0.28)';
    ctx.lineWidth = 1;
    topPath(); ctx.stroke();
    // silhouette so the block reads against dark terrain
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.moveTo(x - w, y); ctx.lineTo(x - w, y - h); ctx.lineTo(x, y - h - top);
    ctx.lineTo(x + w, y - h); ctx.lineTo(x + w, y); ctx.lineTo(x, y + top);
    ctx.closePath(); ctx.stroke();
  }

  function platform(ctx, x, y, r, color, edge, depth) {
    const d = depth === undefined ? 5 : depth;
    // stone skirt, so the building sits on a pedestal instead of floating
    ctx.fillStyle = edge;
    ctx.beginPath();
    ctx.moveTo(x - r, y); ctx.lineTo(x, y + r * 0.5); ctx.lineTo(x + r, y);
    ctx.lineTo(x + r, y + d); ctx.lineTo(x, y + r * 0.5 + d); ctx.lineTo(x - r, y + d);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.5); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r * 0.5); ctx.lineTo(x - r, y);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = edge; ctx.lineWidth = 1.5; ctx.stroke();
  }

  function lighten(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, ((n >> 16) & 255) + k);
    const g = Math.min(255, ((n >> 8) & 255) + k);
    const b = Math.min(255, (n & 255) + k);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  function darken(hex, k) { return lighten(hex, -k); }

  const RACE_COLOR = { human: '#7d93b8', orc: '#8a6a45', elf: '#5f8f78', undead: '#6d5f84' };
  const RACE_TRIM = { human: '#d9e4f5', orc: '#e0b070', elf: '#bff0dc', undead: '#cfc0f0' };

  /* --------------------------------------------------------------- towers */

  function drawTower(ctx, x, y, tower, t) {
    const def = tower.def;
    const tier = def.tier;
    const base = RACE_COLOR[def.race] || '#888';
    const trim = RACE_TRIM[def.race] || '#eee';
    const h = 24 + tier * 11;
    const w = 16 + tier * 3;
    const grow = tower.buildAnim > 0 ? 1 - tower.buildAnim : 1;
    const scale = 0.35 + 0.65 * grow;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 1);
    shade(ctx, 4, 3, 25, 11, 0.4);
    platform(ctx, 0, 0, 27, '#5f574a', '#38332b');
    ctx.scale(scale, scale);

    const recoil = tower.recoil * 2;
    ctx.translate(-Math.cos(tower.angle) * recoil * 0.6, -Math.sin(tower.angle) * recoil * 0.3);

    box(ctx, 0, 0, w, h, 6, lighten(base, 26), darken(base, 30), base);

    // tier banding
    for (let i = 1; i < tier; i++) {
      const yy = -h * (i / tier);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(-w, yy, w * 2, 3);
    }

    switch (def.icon) {
      case 'arrow': roofTower(ctx, w, h, trim, base, tier); break;
      case 'cannon': cannonTop(ctx, w, h, tower.angle, tier); break;
      case 'arcane': crystalTop(ctx, w, h, def.projectile.color, t, tier); break;
      case 'axe': spikeTop(ctx, w, h, trim, tier); break;
      case 'spear': hutTop(ctx, w, h, trim, tier); break;
      case 'totem': totemTop(ctx, w, h, def.projectile.color, t, tier); break;
      case 'tree': treeTop(ctx, w, h, tier, t); break;
      case 'acid': nestTop(ctx, w, h, def.projectile.color, tier); break;
      case 'moon': wellTop(ctx, w, h, def.projectile.color, t, tier); break;
      case 'ghost': boneTop(ctx, w, h, def.projectile.color, t, tier); break;
      case 'web': webTop(ctx, w, h, def.projectile.color, tier); break;
      case 'meat': meatTop(ctx, w, h, tier); break;
      default: roofTower(ctx, w, h, trim, base, tier);
    }
    ctx.restore();
  }

  function roofTower(ctx, w, h, trim, base, tier) {
    ctx.fillStyle = darken(base, 40);
    for (let i = 0; i < 2; i++) ctx.fillRect(-4 + i * 6, -h + 10, 3, 8);
    ctx.fillStyle = '#8c3a2e';
    ctx.beginPath();
    ctx.moveTo(-w - 3, -h - 4); ctx.lineTo(0, -h - 16 - tier * 3); ctx.lineTo(w + 3, -h - 4);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6b2a20';
    ctx.beginPath();
    ctx.moveTo(0, -h - 16 - tier * 3); ctx.lineTo(w + 3, -h - 4); ctx.lineTo(0, -h + 1);
    ctx.closePath(); ctx.fill();
    if (tier > 1) {
      ctx.strokeStyle = trim; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(0, -h - 16 - tier * 3); ctx.lineTo(0, -h - 26 - tier * 4); ctx.stroke();
      ctx.fillStyle = '#e0c060';
      ctx.beginPath();
      ctx.moveTo(0, -h - 26 - tier * 4); ctx.lineTo(11, -h - 22 - tier * 4); ctx.lineTo(0, -h - 18 - tier * 4);
      ctx.closePath(); ctx.fill();
    }
  }

  function cannonTop(ctx, w, h, angle, tier) {
    ctx.fillStyle = '#4a4a4a';
    ctx.beginPath(); ctx.ellipse(0, -h - 2, w * 0.9, 5, 0, 0, TAU); ctx.fill();
    ctx.save();
    ctx.translate(0, -h - 6);
    ctx.rotate(Math.sin(angle) * 0.25 - 0.5);
    const len = 14 + tier * 4;
    ctx.fillStyle = '#2f2f2f';
    ctx.fillRect(-3, -3, len, 7);
    ctx.fillStyle = '#585858';
    ctx.fillRect(-3, -3, len, 2.5);
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.ellipse(len - 3, 0.5, 2, 4, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function crystalTop(ctx, w, h, color, t, tier) {
    const bob = Math.sin(t * 2) * 2;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.ellipse(0, -h - 12 + bob, 10 + tier * 2, 10 + tier * 2, 0, 0, TAU); ctx.fill();
    const g = ctx.createLinearGradient(0, -h - 22 + bob, 0, -h - 2 + bob);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, color); g.addColorStop(1, '#2c4a7a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -h - 20 - tier * 2 + bob);
    ctx.lineTo(6 + tier, -h - 10 + bob);
    ctx.lineTo(0, -h - 2 + bob);
    ctx.lineTo(-6 - tier, -h - 10 + bob);
    ctx.closePath(); ctx.fill();
  }

  function spikeTop(ctx, w, h, trim, tier) {
    ctx.fillStyle = '#6b4a2c';
    ctx.fillRect(-w - 2, -h - 5, (w + 2) * 2, 6);
    ctx.fillStyle = trim;
    for (let i = -tier; i <= tier; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 7 - 2, -h - 5); ctx.lineTo(i * 7, -h - 15); ctx.lineTo(i * 7 + 2, -h - 5);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#8c2f22';
    ctx.fillRect(w - 1, -h - 22, 10, 8);
  }

  function hutTop(ctx, w, h, trim, tier) {
    ctx.fillStyle = '#7a5a34';
    ctx.beginPath();
    ctx.moveTo(-w - 5, -h); ctx.lineTo(0, -h - 14 - tier * 2); ctx.lineTo(w + 5, -h);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = trim; ctx.lineWidth = 1.2;
    for (let i = 0; i < 3 + tier; i++) {
      const a = -0.9 + i * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -h - 8); ctx.lineTo(Math.cos(a) * 16, -h - 8 - Math.abs(Math.sin(a)) * 14);
      ctx.stroke();
    }
  }

  function totemTop(ctx, w, h, color, t, tier) {
    ctx.fillStyle = '#6a4b2a';
    ctx.fillRect(-5, -h - 16 - tier * 3, 10, 18 + tier * 3);
    ctx.fillStyle = '#d7c07a';
    ctx.beginPath(); ctx.ellipse(0, -h - 18 - tier * 3, 8, 7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(-4, -h - 20 - tier * 3, 3, 3); ctx.fillRect(1, -h - 20 - tier * 3, 3, 3);
    ctx.strokeStyle = color; ctx.lineWidth = 1.4;
    ctx.globalAlpha = 0.55 + Math.sin(t * 6) * 0.3;
    ctx.beginPath(); ctx.arc(0, -h - 18 - tier * 3, 12 + tier * 2, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function treeTop(ctx, w, h, tier, t) {
    const sway = Math.sin(t * 1.2) * 2;
    for (let i = 0; i < 3; i++) {
      const rr = 16 + tier * 3 - i * 4;
      const yy = -h - 6 - i * 9;
      const g = ctx.createRadialGradient(-rr * 0.3 + sway, yy - rr * 0.3, 2, sway, yy, rr);
      g.addColorStop(0, '#7fb050'); g.addColorStop(1, '#254a20');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(sway, yy, rr, rr * 0.72, 0, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#f2e08a';
    ctx.beginPath(); ctx.ellipse(-4, -h - 8, 2.4, 3, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, -h - 8, 2.4, 3, 0, 0, TAU); ctx.fill();
  }

  function nestTop(ctx, w, h, color, tier) {
    ctx.fillStyle = '#6a5a3a';
    ctx.beginPath(); ctx.ellipse(0, -h - 2, w + 5, 8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4c4028';
    ctx.beginPath(); ctx.ellipse(0, -h - 4, w + 1, 6, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 1 + tier; i++) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(-6 + i * 7, -h - 7, 4.5, 5.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.ellipse(-7 + i * 7, -h - 9, 1.6, 2, 0, 0, TAU); ctx.fill();
    }
  }

  function wellTop(ctx, w, h, color, t, tier) {
    ctx.fillStyle = '#cfd8e8';
    ctx.beginPath(); ctx.ellipse(0, -h - 2, w + 4, 9, 0, 0, TAU); ctx.fill();
    const g = ctx.createRadialGradient(0, -h - 3, 1, 0, -h - 3, w + 2);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, color); g.addColorStop(1, '#2a5680');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, -h - 3, w, 6.5, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(210,235,255,' + (0.5 + Math.sin(t * 3) * 0.25) + ')';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -h - 16 - tier * 3, 9 + tier * 2, Math.PI * 0.15, Math.PI * 0.85, true); ctx.stroke();
  }

  function boneTop(ctx, w, h, color, t, tier) {
    ctx.strokeStyle = '#d8d2c0'; ctx.lineWidth = 2.5;
    for (let i = -1; i <= 1; i += 2) {
      ctx.beginPath();
      ctx.moveTo(i * (w - 2), -h);
      ctx.quadraticCurveTo(i * (w + 6), -h - 12, i * 3, -h - 20 - tier * 2);
      ctx.stroke();
    }
    const bob = Math.sin(t * 2.4) * 2.5;
    ctx.fillStyle = '#efe9d8';
    ctx.beginPath(); ctx.ellipse(0, -h - 24 - tier * 2 + bob, 7, 6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(-2.6, -h - 25 - tier * 2 + bob, 1.8, 2, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(2.6, -h - 25 - tier * 2 + bob, 1.8, 2, 0, 0, TAU); ctx.fill();
  }

  function webTop(ctx, w, h, color, tier) {
    ctx.fillStyle = '#4a3f66';
    ctx.beginPath();
    ctx.moveTo(-w - 4, -h); ctx.lineTo(0, -h - 13 - tier * 2); ctx.lineTo(w + 4, -h);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    for (let r = 4; r <= 10 + tier * 2; r += 4) {
      ctx.beginPath(); ctx.arc(0, -h - 6, r, Math.PI, TAU); ctx.stroke();
    }
    for (let a = 0; a < 5; a++) {
      const ang = Math.PI + (a / 4) * Math.PI;
      ctx.beginPath(); ctx.moveTo(0, -h - 6);
      ctx.lineTo(Math.cos(ang) * (10 + tier * 2), -h - 6 + Math.sin(ang) * (10 + tier * 2));
      ctx.stroke();
    }
  }

  function meatTop(ctx, w, h, tier) {
    ctx.fillStyle = '#5a4436';
    ctx.fillRect(-w - 3, -h - 6, (w + 3) * 2, 7);
    ctx.strokeStyle = '#8d8d8d'; ctx.lineWidth = 1.6;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 9, -h - 6);
      ctx.lineTo(i * 9, -h - 15);
      ctx.stroke();
      ctx.fillStyle = '#8a3a34';
      ctx.beginPath(); ctx.ellipse(i * 9, -h - 3, 3.6, 5, 0, 0, TAU); ctx.fill();
    }
    if (tier > 1) {
      ctx.fillStyle = '#6b8f3a';
      ctx.beginPath(); ctx.ellipse(0, -h - 20, 6 + tier, 5, 0, 0, TAU); ctx.fill();
    }
  }

  /* --------------------------------------------------------------- creeps */

  function drawCreep(ctx, x, y, c, t) {
    const ty = c.type;
    const s = 1.35 + c.radius * 1.5;
    const dead = !c.alive;
    ctx.save();
    ctx.translate(x, y);
    if (dead) ctx.globalAlpha = Math.max(0, c.dying / 0.7);

    // ground shadow (dropped to z=0 for flyers)
    const shadowY = c.z * NS.Z_SCALE;
    shade(ctx, 2, shadowY, 10 * s, 4.6 * s, c.z > 0.5 ? 0.22 : 0.36);

    if (c.hitFlash > 0) { ctx.globalAlpha *= 1; }

    const body = c.hitFlash > 0 ? '#ffd9d0' : ty.body;
    const trim = ty.trim;

    if (ty.flying) drawFlyer(ctx, s, body, trim, t, c);
    else if (c.typeId === 'siege') drawWagon(ctx, s, body, trim, t);
    else if (c.typeId === 'treant' || c.typeId === 'boss_corrupted') drawTreant(ctx, s, body, trim, t);
    else drawHumanoid(ctx, s, body, trim, t, c);

    if (c.boss) {
      ctx.strokeStyle = 'rgba(255,214,110,0.85)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 2, 15 * s, 7 * s, 0, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }

  function drawHumanoid(ctx, s, body, trim, t, c) {
    const walk = Math.sin(c.anim * 9) * 2.4 * s;
    ctx.fillStyle = trim;
    ctx.fillRect(-4 * s, -6 * s, 3 * s, 7 * s + walk * 0.4);
    ctx.fillRect(1.5 * s, -6 * s, 3 * s, 7 * s - walk * 0.4);
    const g = ctx.createLinearGradient(-6 * s, -20 * s, 6 * s, 0);
    g.addColorStop(0, body); g.addColorStop(1, trim);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-6 * s, -6 * s); ctx.lineTo(-4.5 * s, -19 * s);
    ctx.lineTo(4.5 * s, -19 * s); ctx.lineTo(6 * s, -6 * s);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.ellipse(0, -23 * s, 4.6 * s, 4.4 * s, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = trim;
    ctx.fillRect(-6.5 * s, -18 * s + walk, 2.4 * s, 9 * s);
    ctx.fillRect(4.2 * s, -18 * s - walk, 2.4 * s, 9 * s);
    ctx.fillStyle = 'rgba(255,240,180,0.9)';
    ctx.fillRect(-2.4 * s, -24 * s, 1.6 * s, 1.6 * s);
    ctx.fillRect(0.9 * s, -24 * s, 1.6 * s, 1.6 * s);
  }

  function drawFlyer(ctx, s, body, trim, t, c) {
    const flap = Math.sin(c.anim * 11) * 0.5;
    ctx.save();
    ctx.translate(0, -c.z * NS.Z_SCALE);
    ctx.fillStyle = trim;
    for (let side = -1; side <= 1; side += 2) {
      ctx.save();
      ctx.scale(side, 1);
      ctx.rotate(-flap * 0.5);
      ctx.beginPath();
      ctx.moveTo(2 * s, -10 * s);
      ctx.quadraticCurveTo(16 * s, -18 * s - flap * 8 * s, 22 * s, -6 * s);
      ctx.quadraticCurveTo(14 * s, -8 * s, 2 * s, -5 * s);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    const g = ctx.createLinearGradient(0, -18 * s, 0, -2 * s);
    g.addColorStop(0, body); g.addColorStop(1, trim);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, -9 * s, 6 * s, 8.5 * s, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.ellipse(0, -19 * s, 4.2 * s, 3.8 * s, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffe38a';
    ctx.fillRect(-2.2 * s, -20 * s, 1.5 * s, 1.5 * s);
    ctx.fillRect(0.8 * s, -20 * s, 1.5 * s, 1.5 * s);
    ctx.strokeStyle = trim; ctx.lineWidth = 1.6 * s;
    ctx.beginPath(); ctx.moveTo(0, -2 * s); ctx.quadraticCurveTo(-6 * s, 3 * s, -11 * s, -1 * s); ctx.stroke();
    ctx.restore();
  }

  function drawWagon(ctx, s, body, trim, t) {
    ctx.fillStyle = '#2f2a22';
    for (let i = -1; i <= 1; i += 2) {
      ctx.beginPath(); ctx.ellipse(i * 7 * s, -3 * s, 4.5 * s, 4.5 * s, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#6a5a3a'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(i * 7 * s, -3 * s, 3 * s, 0, TAU); ctx.stroke();
    }
    ctx.fillStyle = body;
    ctx.fillRect(-10 * s, -13 * s, 20 * s, 9 * s);
    ctx.fillStyle = trim;
    ctx.fillRect(-10 * s, -13 * s, 20 * s, 2.6 * s);
    ctx.strokeStyle = '#4a3a24'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-4 * s, -13 * s); ctx.lineTo(6 * s, -24 * s); ctx.stroke();
    ctx.fillStyle = '#6f6f6f';
    ctx.beginPath(); ctx.ellipse(7 * s, -25 * s, 4 * s, 4 * s, 0, 0, TAU); ctx.fill();
  }

  function drawTreant(ctx, s, body, trim, t) {
    ctx.fillStyle = trim;
    ctx.fillRect(-6 * s, -14 * s, 4 * s, 14 * s);
    ctx.fillRect(2 * s, -14 * s, 4 * s, 14 * s);
    const g = ctx.createLinearGradient(-8 * s, -26 * s, 8 * s, -6 * s);
    g.addColorStop(0, body); g.addColorStop(1, trim);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-8 * s, -12 * s); ctx.lineTo(-6 * s, -26 * s);
    ctx.lineTo(6 * s, -26 * s); ctx.lineTo(8 * s, -12 * s);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4f7a32';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse((i - 1) * 8 * s, -30 * s - (i === 1 ? 5 * s : 0), 9 * s, 7 * s, 0, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd76a';
    ctx.fillRect(-3.4 * s, -22 * s, 2 * s, 2.6 * s);
    ctx.fillRect(1.4 * s, -22 * s, 2 * s, 2.6 * s);
  }

  /* ----------------------------------------------------------- status FX */

  function drawCreepStatus(ctx, x, y, c, now) {
    const s = 1.35 + c.radius * 1.5;
    const top = y - c.z * NS.Z_SCALE;
    if (now < c.slowUntil) {
      ctx.strokeStyle = 'rgba(140,205,255,0.75)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(x, top + 1, 12 * s, 5.5 * s, 0, 0, TAU); ctx.stroke();
    }
    if (c.poisons && c.poisons.size) {
      ctx.fillStyle = 'rgba(150,240,110,0.8)';
      for (let i = 0; i < 3; i++) {
        const a = now * 3 + i * 2.1;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * 8 * s, top - 12 * s + Math.sin(a * 1.6) * 5, 1.9, 2.4, 0, 0, TAU);
        ctx.fill();
      }
    }
    if (now < c.rootUntil) {
      ctx.strokeStyle = 'rgba(120,200,80,0.95)'; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * 11 * s, top + 2);
        ctx.quadraticCurveTo(x + Math.cos(a) * 6 * s, top - 8 * s, x, top - 3 * s);
        ctx.stroke();
      }
    }
    if (now < c.webUntil) {
      ctx.strokeStyle = 'rgba(230,225,255,0.9)'; ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        ctx.beginPath();
        ctx.moveTo(x, top - 10 * s);
        ctx.lineTo(x + Math.cos(a) * 13 * s, top - 10 * s + Math.sin(a) * 7 * s);
        ctx.stroke();
      }
    }
  }

  function drawHealthBar(ctx, x, y, c) {
    if (c.hp >= c.maxHp || !c.alive) return;
    const s = c.boss ? 1.7 : 1;
    const w = 26 * s, h = 4.2 * s;
    const top = y - c.z * NS.Z_SCALE - (c.boss ? 44 : 34);
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(x - w / 2 - 1, top - 1, w + 2, h + 2);
    const k = Math.max(0, c.hp / c.maxHp);
    ctx.fillStyle = k > 0.55 ? '#3fbf46' : (k > 0.25 ? '#e3c53c' : '#d24a3a');
    ctx.fillRect(x - w / 2, top, w * k, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 1;
    ctx.strokeRect(x - w / 2 - 0.5, top - 0.5, w + 1, h + 1);
  }

  /* ----------------------------------------------------------------- hero */

  function drawHero(ctx, x, y, hero, t) {
    const d = hero.def;
    ctx.save();
    ctx.translate(x, y);
    if (hero.dead) { ctx.globalAlpha = 0.25; }
    shade(ctx, 3, 2, 13, 6, 0.4);
    // hero glow ring
    ctx.strokeStyle = 'rgba(255,225,130,0.65)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 1, 14, 6.5, 0, 0, TAU); ctx.stroke();

    const walk = Math.sin(hero.anim * 8) * 2.2;
    ctx.fillStyle = '#3a3a44';
    ctx.fillRect(-4.5, -7, 3.4, 8 + walk * 0.3);
    ctx.fillRect(1.4, -7, 3.4, 8 - walk * 0.3);
    // cape
    ctx.fillStyle = darken(d.color, 60);
    ctx.beginPath();
    ctx.moveTo(-7, -22); ctx.quadraticCurveTo(-12, -8, -5, -4);
    ctx.lineTo(6, -4); ctx.quadraticCurveTo(11, -10, 7, -22);
    ctx.closePath(); ctx.fill();
    const g = ctx.createLinearGradient(-7, -24, 7, -6);
    g.addColorStop(0, lighten(d.color, 30)); g.addColorStop(1, d.color);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-6.5, -7); ctx.lineTo(-5, -22); ctx.lineTo(5, -22); ctx.lineTo(6.5, -7);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = d.accent;
    ctx.beginPath(); ctx.ellipse(0, -26, 5, 4.8, 0, 0, TAU); ctx.fill();
    // weapon
    ctx.strokeStyle = '#d8d8e0'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(7, -8); ctx.lineTo(13, -26); ctx.stroke();
    ctx.fillStyle = d.color;
    ctx.beginPath(); ctx.ellipse(13, -27, 3.4, 3.4, 0, 0, TAU); ctx.fill();

    if (hero.immolation) {
      ctx.strokeStyle = 'rgba(255,140,60,' + (0.5 + Math.sin(t * 9) * 0.25) + ')';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(0, -8, 20, 11, 0, 0, TAU); ctx.stroke();
    }
    if (hero.storm) {
      ctx.strokeStyle = 'rgba(255,240,190,0.6)'; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const a = t * 7 + i * 2.1;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * 16, -12 + Math.sin(a) * 7, 5, 3, a, 0, TAU);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /* -------------------------------------------------------- world objects */

  function drawPortal(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1.35, 1.35);
    shade(ctx, 0, 4, 34, 15, 0.45);
    for (let i = 3; i >= 0; i--) {
      const r = 14 + i * 7;
      ctx.strokeStyle = 'rgba(' + (140 - i * 20) + ',' + (90 + i * 25) + ',255,' + (0.5 - i * 0.08) + ')';
      ctx.lineWidth = 4 - i * 0.6;
      ctx.beginPath();
      ctx.ellipse(0, -18 - i * 2, r, r * 0.55, Math.sin(t * 0.7 + i) * 0.2, 0, TAU);
      ctx.stroke();
    }
    const g = ctx.createRadialGradient(0, -20, 2, 0, -20, 22);
    g.addColorStop(0, 'rgba(230,215,255,0.95)');
    g.addColorStop(0.5, 'rgba(130,80,220,0.8)');
    g.addColorStop(1, 'rgba(40,10,80,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, -20, 22, 13, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 8; i++) {
      const a = t * 2 + i * 0.785;
      ctx.fillStyle = 'rgba(200,170,255,' + (0.3 + 0.3 * Math.sin(a * 3)) + ')';
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 20, -20 + Math.sin(a) * 11, 2.4, 2.4, 0, 0, TAU);
      ctx.fill();
    }
    // stone arch
    ctx.fillStyle = '#4a4038';
    for (let side = -1; side <= 1; side += 2) {
      ctx.fillRect(side * 26 - 4, -46, 8, 46);
      ctx.fillStyle = '#5c5148';
      ctx.fillRect(side * 26 - 4, -46, 4, 46);
      ctx.fillStyle = '#4a4038';
    }
    ctx.restore();
  }

  function drawKeep(ctx, x, y, t, lives, maxLives) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1.3, 1.3);
    shade(ctx, 4, 6, 52, 24, 0.42);
    // curtain wall
    box(ctx, 0, 0, 44, 26, 12, '#8d8474', '#544d43', '#6f6759');
    // towers
    for (let side = -1; side <= 1; side += 2) {
      ctx.save();
      ctx.translate(side * 34, -6);
      box(ctx, 0, 0, 13, 52, 6, '#9a917f', '#5b5449', '#77705f');
      ctx.fillStyle = '#8c3a2e';
      ctx.beginPath();
      ctx.moveTo(-16, -52); ctx.lineTo(0, -74); ctx.lineTo(16, -52);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#6b2a20';
      ctx.beginPath(); ctx.moveTo(0, -74); ctx.lineTo(16, -52); ctx.lineTo(0, -48); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    // keep body
    box(ctx, 0, -18, 22, 58, 9, '#a79d89', '#635b4e', '#847b69');
    ctx.fillStyle = '#8c3a2e';
    ctx.beginPath(); ctx.moveTo(-26, -76); ctx.lineTo(0, -104); ctx.lineTo(26, -76); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6b2a20';
    ctx.beginPath(); ctx.moveTo(0, -104); ctx.lineTo(26, -76); ctx.lineTo(0, -72); ctx.closePath(); ctx.fill();
    // gate
    ctx.fillStyle = '#3a2c1e';
    ctx.beginPath();
    ctx.moveTo(-11, 0); ctx.lineTo(-11, -18); ctx.quadraticCurveTo(0, -30, 11, -18); ctx.lineTo(11, 0);
    ctx.closePath(); ctx.fill();
    // banner, colour reflects remaining lives
    const k = maxLives ? lives / maxLives : 1;
    const flag = k > 0.5 ? '#3f7fd0' : (k > 0.25 ? '#d0a53f' : '#c04030');
    ctx.strokeStyle = '#6a6258'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -104); ctx.lineTo(0, -124); ctx.stroke();
    ctx.fillStyle = flag;
    const wave = Math.sin(t * 2.4) * 3;
    ctx.beginPath();
    ctx.moveTo(0, -124); ctx.lineTo(22 + wave, -118); ctx.lineTo(0, -110);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* --------------------------------------------------------- projectiles */

  function drawProjectile(ctx, x, y, p) {
    const c = p.color;
    ctx.save();
    ctx.translate(x, y);
    switch (p.kind) {
      case 'arrow':
      case 'dart':
      case 'spear':
      case 'thorn':
        ctx.rotate(p.angle * 0.5);
        ctx.strokeStyle = c; ctx.lineWidth = p.kind === 'spear' ? 2.6 : 1.8;
        ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(5, 0); ctx.stroke();
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(3, -2.6); ctx.lineTo(3, 2.6); ctx.closePath(); ctx.fill();
        break;
      case 'ball':
      case 'corpse':
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.ellipse(0, 0, 4.6, 4.6, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath(); ctx.ellipse(-1.4, -1.6, 1.8, 1.8, 0, 0, TAU); ctx.fill();
        break;
      case 'acid':
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.ellipse(0, 0, 4.2, 5.4, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath(); ctx.ellipse(-1.2, -2, 1.4, 1.8, 0, 0, TAU); ctx.fill();
        break;
      case 'bolt':
        ctx.strokeStyle = c; ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-8, 0); ctx.lineTo(-2, -3); ctx.lineTo(1, 2); ctx.lineTo(7, -1);
        ctx.stroke();
        break;
      case 'web':
        ctx.strokeStyle = c; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.stroke();
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * TAU + p.angle;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 5, Math.sin(a) * 5); ctx.stroke();
        }
        break;
      case 'star':
        ctx.fillStyle = c;
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * TAU - Math.PI / 2;
          const r = i % 2 ? 2.2 : 6;
          const px = Math.cos(a) * r, py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fill();
        break;
      default: {
        const g = ctx.createRadialGradient(0, 0, 0.5, 0, 0, 6);
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, c); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(0, 0, 6, 6, 0, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }

  NS.Sprites = {
    drawTower, drawCreep, drawCreepStatus, drawHealthBar, drawHero,
    drawPortal, drawKeep, drawProjectile, shade, box, platform, lighten, darken,
    RACE_COLOR, RACE_TRIM
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
