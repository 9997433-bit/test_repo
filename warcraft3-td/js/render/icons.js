/* Canvas-drawn command-card icons. Nothing is loaded from disk, so the game
 * still works from file:// and carries no third-party art. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});
  const TAU = Math.PI * 2;

  const BG = {
    human: ['#2b3d5c', '#101828'],
    orc: ['#4a2f1c', '#1c1108'],
    elf: ['#1e4438', '#0a1c16'],
    undead: ['#33254d', '#120b20'],
    action: ['#3a3527', '#15130c'],
    hero: ['#4a3a12', '#1b1508'],
    danger: ['#4d1f1a', '#1a0908']
  };

  function bg(ctx, s, palette) {
    const pal = BG[palette] || BG.action;
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  }

  function draw(ctx, kind, size, palette) {
    const s = size;
    ctx.save();
    bg(ctx, s, palette);
    ctx.translate(s / 2, s / 2);
    const u = s / 32; // design grid is 32px
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    switch (kind) {
      case 'arrow':
        ctx.strokeStyle = '#ffe9b0'; ctx.lineWidth = 2.4 * u;
        ctx.beginPath(); ctx.moveTo(-9 * u, 9 * u); ctx.lineTo(8 * u, -8 * u); ctx.stroke();
        ctx.fillStyle = '#fff6d0';
        ctx.beginPath(); ctx.moveTo(11 * u, -11 * u); ctx.lineTo(3 * u, -9 * u); ctx.lineTo(9 * u, -3 * u);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#c8a05a';
        ctx.beginPath(); ctx.moveTo(-11 * u, 4 * u); ctx.lineTo(-4 * u, 11 * u); ctx.stroke();
        break;
      case 'cannon':
        ctx.fillStyle = '#3b3b3b';
        ctx.save(); ctx.rotate(-0.6); ctx.fillRect(-4 * u, -3.4 * u, 17 * u, 7 * u); ctx.restore();
        ctx.fillStyle = '#5c5c5c';
        ctx.beginPath(); ctx.ellipse(-5 * u, 4 * u, 7 * u, 6 * u, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ffb648';
        ctx.beginPath(); ctx.ellipse(10 * u, -8 * u, 3.4 * u, 3.4 * u, 0, 0, TAU); ctx.fill();
        break;
      case 'arcane': {
        const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 12 * u);
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, '#9fd6ff'); g.addColorStop(1, '#20406e');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, -12 * u); ctx.lineTo(8 * u, 0); ctx.lineTo(0, 12 * u); ctx.lineTo(-8 * u, 0);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.2 * u; ctx.stroke();
        break;
      }
      case 'axe':
        ctx.strokeStyle = '#8a6540'; ctx.lineWidth = 3 * u;
        ctx.beginPath(); ctx.moveTo(-7 * u, 12 * u); ctx.lineTo(6 * u, -10 * u); ctx.stroke();
        ctx.fillStyle = '#c9ccd2';
        ctx.beginPath();
        ctx.moveTo(3 * u, -11 * u);
        ctx.quadraticCurveTo(14 * u, -6 * u, 8 * u, 3 * u);
        ctx.quadraticCurveTo(4 * u, -3 * u, -1 * u, -6 * u);
        ctx.closePath(); ctx.fill();
        break;
      case 'spear':
        ctx.strokeStyle = '#9ad06a'; ctx.lineWidth = 2.4 * u;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath(); ctx.moveTo(i * 6 * u, 12 * u); ctx.lineTo(i * 3 * u, -10 * u); ctx.stroke();
          ctx.fillStyle = '#e8f5cf';
          ctx.beginPath();
          ctx.moveTo(i * 3 * u, -13 * u); ctx.lineTo(i * 3 * u - 3 * u, -7 * u); ctx.lineTo(i * 3 * u + 3 * u, -7 * u);
          ctx.closePath(); ctx.fill();
        }
        break;
      case 'totem':
        ctx.fillStyle = '#6a4b2a'; ctx.fillRect(-4 * u, -6 * u, 8 * u, 18 * u);
        ctx.fillStyle = '#d7c07a';
        ctx.beginPath(); ctx.ellipse(0, -9 * u, 8 * u, 7 * u, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#2b2b2b';
        ctx.fillRect(-4 * u, -11 * u, 3 * u, 3 * u); ctx.fillRect(1 * u, -11 * u, 3 * u, 3 * u);
        ctx.strokeStyle = '#9ad8ff'; ctx.lineWidth = 1.6 * u;
        ctx.beginPath(); ctx.moveTo(-11 * u, 2 * u); ctx.lineTo(-5 * u, 5 * u); ctx.lineTo(-9 * u, 9 * u); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(11 * u, 2 * u); ctx.lineTo(5 * u, 5 * u); ctx.lineTo(9 * u, 9 * u); ctx.stroke();
        break;
      case 'tree':
        ctx.fillStyle = '#5a4026'; ctx.fillRect(-3 * u, 0, 6 * u, 13 * u);
        for (let i = 0; i < 3; i++) {
          const g2 = ctx.createRadialGradient(-3 * u, -6 * u - i * 4 * u, 1, 0, -4 * u - i * 4 * u, 11 * u - i * 2 * u);
          g2.addColorStop(0, '#8ec45a'); g2.addColorStop(1, '#25451d');
          ctx.fillStyle = g2;
          ctx.beginPath(); ctx.ellipse(0, -3 * u - i * 4 * u, 11 * u - i * 2.6 * u, 7 * u - i * 1.4 * u, 0, 0, TAU); ctx.fill();
        }
        break;
      case 'acid':
        ctx.fillStyle = '#8cf03c';
        ctx.beginPath();
        ctx.moveTo(0, -12 * u);
        ctx.quadraticCurveTo(9 * u, 0, 0, 12 * u);
        ctx.quadraticCurveTo(-9 * u, 0, 0, -12 * u);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath(); ctx.ellipse(-2.5 * u, -3 * u, 2.4 * u, 4 * u, 0, 0, TAU); ctx.fill();
        break;
      case 'moon': {
        const g3 = ctx.createRadialGradient(-3 * u, -3 * u, 1, 0, 0, 12 * u);
        g3.addColorStop(0, '#ffffff'); g3.addColorStop(1, '#5f8fd0');
        ctx.fillStyle = g3;
        ctx.beginPath(); ctx.arc(0, 0, 11 * u, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath(); ctx.arc(5 * u, -3 * u, 9 * u, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        break;
      }
      case 'ghost':
        ctx.fillStyle = '#dff7ee';
        ctx.beginPath();
        ctx.moveTo(-8 * u, 10 * u);
        ctx.quadraticCurveTo(-10 * u, -12 * u, 0, -12 * u);
        ctx.quadraticCurveTo(10 * u, -12 * u, 8 * u, 10 * u);
        ctx.quadraticCurveTo(4 * u, 6 * u, 0, 10 * u);
        ctx.quadraticCurveTo(-4 * u, 6 * u, -8 * u, 10 * u);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#2a4a55';
        ctx.beginPath(); ctx.ellipse(-3.4 * u, -4 * u, 2 * u, 2.6 * u, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(3.4 * u, -4 * u, 2 * u, 2.6 * u, 0, 0, TAU); ctx.fill();
        break;
      case 'web':
        ctx.strokeStyle = '#e6dfff'; ctx.lineWidth = 1.3 * u;
        for (let r = 3; r <= 12; r += 3) { ctx.beginPath(); ctx.arc(0, 0, r * u, 0, TAU); ctx.stroke(); }
        for (let a = 0; a < 8; a++) {
          const ang = (a / 8) * TAU;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang) * 12 * u, Math.sin(ang) * 12 * u); ctx.stroke();
        }
        break;
      case 'meat':
        ctx.strokeStyle = '#b0b4bb'; ctx.lineWidth = 2 * u;
        ctx.beginPath(); ctx.moveTo(0, -12 * u); ctx.lineTo(0, -2 * u);
        ctx.quadraticCurveTo(6 * u, 2 * u, 0, 5 * u); ctx.stroke();
        ctx.fillStyle = '#9c3b34';
        ctx.beginPath(); ctx.ellipse(0, 7 * u, 7 * u, 6 * u, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#d9736a';
        ctx.beginPath(); ctx.ellipse(-2 * u, 5.5 * u, 2.4 * u, 2 * u, 0, 0, TAU); ctx.fill();
        break;

      // ---- races ----
      case 'race_human':
        ctx.fillStyle = '#cfe0f5';
        ctx.beginPath();
        ctx.moveTo(0, -12 * u); ctx.lineTo(10 * u, -7 * u); ctx.lineTo(10 * u, 3 * u);
        ctx.quadraticCurveTo(10 * u, 11 * u, 0, 13 * u);
        ctx.quadraticCurveTo(-10 * u, 11 * u, -10 * u, 3 * u);
        ctx.lineTo(-10 * u, -7 * u); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#2f5da8';
        ctx.fillRect(-2 * u, -8 * u, 4 * u, 16 * u);
        ctx.fillRect(-8 * u, -2 * u, 16 * u, 4 * u);
        break;
      case 'race_orc':
        ctx.fillStyle = '#e0b070';
        ctx.beginPath();
        ctx.moveTo(-10 * u, -4 * u);
        ctx.quadraticCurveTo(0, -14 * u, 10 * u, -4 * u);
        ctx.quadraticCurveTo(8 * u, 10 * u, 0, 13 * u);
        ctx.quadraticCurveTo(-8 * u, 10 * u, -10 * u, -4 * u);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#5a2b18';
        ctx.beginPath(); ctx.ellipse(-4 * u, -1 * u, 2.6 * u, 2 * u, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(4 * u, -1 * u, 2.6 * u, 2 * u, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.moveTo(-5 * u, 4 * u); ctx.lineTo(-3 * u, 10 * u); ctx.lineTo(-1 * u, 4 * u); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(5 * u, 4 * u); ctx.lineTo(3 * u, 10 * u); ctx.lineTo(1 * u, 4 * u); ctx.closePath(); ctx.fill();
        break;
      case 'race_elf':
        ctx.strokeStyle = '#bff0dc'; ctx.lineWidth = 2.4 * u;
        ctx.beginPath(); ctx.arc(0, 0, 10 * u, Math.PI * 0.15, Math.PI * 1.85); ctx.stroke();
        ctx.fillStyle = '#e8fff5';
        ctx.beginPath(); ctx.ellipse(0, -1 * u, 3.4 * u, 5 * u, 0, 0, TAU); ctx.fill();
        break;
      case 'race_undead':
        ctx.fillStyle = '#e6e0f5';
        ctx.beginPath(); ctx.ellipse(0, -2 * u, 9 * u, 9 * u, 0, 0, TAU); ctx.fill();
        ctx.fillRect(-5 * u, 5 * u, 10 * u, 6 * u);
        ctx.fillStyle = '#2a1a3f';
        ctx.beginPath(); ctx.ellipse(-3.6 * u, -3 * u, 2.6 * u, 3.2 * u, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(3.6 * u, -3 * u, 2.6 * u, 3.2 * u, 0, 0, TAU); ctx.fill();
        ctx.fillRect(-1.4 * u, 1 * u, 2.8 * u, 3 * u);
        break;

      // ---- actions ----
      case 'upgrade':
        ctx.fillStyle = '#7ee08a';
        ctx.beginPath();
        ctx.moveTo(0, -12 * u); ctx.lineTo(11 * u, 0); ctx.lineTo(5 * u, 0);
        ctx.lineTo(5 * u, 11 * u); ctx.lineTo(-5 * u, 11 * u); ctx.lineTo(-5 * u, 0); ctx.lineTo(-11 * u, 0);
        ctx.closePath(); ctx.fill();
        break;
      case 'sell':
        ctx.fillStyle = '#ffd24a';
        ctx.beginPath(); ctx.arc(0, 0, 10 * u, 0, TAU); ctx.fill();
        ctx.fillStyle = '#7a5b12';
        ctx.font = 'bold ' + (16 * u) + 'px serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 1 * u);
        break;
      case 'cancel':
        ctx.strokeStyle = '#ff7a6a'; ctx.lineWidth = 3.4 * u;
        ctx.beginPath();
        ctx.moveTo(-8 * u, -8 * u); ctx.lineTo(8 * u, 8 * u);
        ctx.moveTo(8 * u, -8 * u); ctx.lineTo(-8 * u, 8 * u);
        ctx.stroke();
        break;
      case 'target':
        ctx.strokeStyle = '#ffe07a'; ctx.lineWidth = 2 * u;
        ctx.beginPath(); ctx.arc(0, 0, 9 * u, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 3.4 * u, 0, TAU); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-13 * u, 0); ctx.lineTo(-6 * u, 0);
        ctx.moveTo(13 * u, 0); ctx.lineTo(6 * u, 0);
        ctx.moveTo(0, -13 * u); ctx.lineTo(0, -6 * u);
        ctx.moveTo(0, 13 * u); ctx.lineTo(0, 6 * u);
        ctx.stroke();
        break;
      case 'wave':
        ctx.fillStyle = '#ffb648';
        ctx.beginPath();
        ctx.moveTo(-11 * u, -9 * u); ctx.lineTo(2 * u, 0); ctx.lineTo(-11 * u, 9 * u); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, -9 * u); ctx.lineTo(13 * u, 0); ctx.lineTo(0, 9 * u); ctx.closePath(); ctx.fill();
        break;
      case 'range':
        ctx.strokeStyle = '#9fd6ff'; ctx.lineWidth = 2 * u;
        ctx.beginPath(); ctx.ellipse(0, 2 * u, 12 * u, 6 * u, 0, 0, TAU); ctx.stroke();
        ctx.fillStyle = '#cfe9ff';
        ctx.fillRect(-2.4 * u, -10 * u, 5 * u, 10 * u);
        break;
      case 'pause':
        ctx.fillStyle = '#e8e2d0';
        ctx.fillRect(-7 * u, -9 * u, 5 * u, 18 * u);
        ctx.fillRect(2 * u, -9 * u, 5 * u, 18 * u);
        break;
      case 'speed':
        ctx.fillStyle = '#ffe07a';
        ctx.beginPath();
        ctx.moveTo(-12 * u, -8 * u); ctx.lineTo(-1 * u, 0); ctx.lineTo(-12 * u, 8 * u); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(1 * u, -8 * u); ctx.lineTo(12 * u, 0); ctx.lineTo(1 * u, 8 * u); ctx.closePath(); ctx.fill();
        break;
      case 'settings':
        ctx.strokeStyle = '#d8d2c0'; ctx.lineWidth = 3 * u;
        ctx.beginPath(); ctx.arc(0, 0, 6 * u, 0, TAU); ctx.stroke();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 8 * u, Math.sin(a) * 8 * u);
          ctx.lineTo(Math.cos(a) * 12 * u, Math.sin(a) * 12 * u);
          ctx.stroke();
        }
        break;
      case 'help':
        ctx.fillStyle = '#ffe07a';
        ctx.font = 'bold ' + (24 * u) + 'px serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('?', 0, 1 * u);
        break;
      case 'hero':
        ctx.fillStyle = '#ffe07a';
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * TAU - Math.PI / 2;
          const r = (i % 2 ? 5 : 12) * u;
          const px = Math.cos(a) * r, py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fill();
        break;
      case 'hammer':
        ctx.strokeStyle = '#a8783c'; ctx.lineWidth = 3 * u;
        ctx.beginPath(); ctx.moveTo(-6 * u, 12 * u); ctx.lineTo(4 * u, -4 * u); ctx.stroke();
        ctx.fillStyle = '#f2d98c';
        ctx.fillRect(-4 * u, -13 * u, 16 * u, 10 * u);
        break;
      case 'blade':
        ctx.fillStyle = '#e8e8f0';
        ctx.beginPath();
        ctx.moveTo(-9 * u, 11 * u); ctx.lineTo(9 * u, -11 * u); ctx.lineTo(12 * u, -8 * u); ctx.lineTo(-6 * u, 13 * u);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#d96b4a';
        ctx.fillRect(-12 * u, 8 * u, 8 * u, 5 * u);
        break;
      case 'glaive':
        ctx.strokeStyle = '#c6a4ff'; ctx.lineWidth = 3 * u;
        ctx.beginPath(); ctx.arc(0, 0, 10 * u, 0.4, 5.2); ctx.stroke();
        ctx.fillStyle = '#e0ccff';
        ctx.beginPath(); ctx.moveTo(9 * u, -6 * u); ctx.lineTo(14 * u, -1 * u); ctx.lineTo(7 * u, 2 * u); ctx.closePath(); ctx.fill();
        break;
      case 'skull':
        ctx.fillStyle = '#dff6ff';
        ctx.beginPath(); ctx.ellipse(0, -2 * u, 9 * u, 8 * u, 0, 0, TAU); ctx.fill();
        ctx.fillRect(-4.5 * u, 4 * u, 9 * u, 6 * u);
        ctx.fillStyle = '#123'; 
        ctx.beginPath(); ctx.ellipse(-3.6 * u, -3 * u, 2.6 * u, 3 * u, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(3.6 * u, -3 * u, 2.6 * u, 3 * u, 0, 0, TAU); ctx.fill();
        break;
      case 'autocast':
        ctx.strokeStyle = '#7ee08a'; ctx.lineWidth = 2.6 * u;
        ctx.beginPath(); ctx.arc(0, 0, 9 * u, 0.6, 5.4); ctx.stroke();
        ctx.fillStyle = '#7ee08a';
        ctx.beginPath(); ctx.moveTo(9 * u, -8 * u); ctx.lineTo(12 * u, 0); ctx.lineTo(4 * u, -1 * u); ctx.closePath(); ctx.fill();
        break;
      default:
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(-8 * u, -8 * u, 16 * u, 16 * u);
    }
    ctx.restore();

    // bevel
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, s - 1, s - 1);
    ctx.restore();
  }

  const cache = {};
  /** Returns a cached canvas holding the icon, ready to be used as CSS background. */
  function iconCanvas(kind, size, palette) {
    const key = kind + '|' + size + '|' + palette;
    if (cache[key]) return cache[key];
    const cv = root.document.createElement('canvas');
    cv.width = size; cv.height = size;
    draw(cv.getContext('2d'), kind, size, palette);
    cache[key] = cv;
    return cv;
  }

  function iconUrl(kind, size, palette) { return iconCanvas(kind, size, palette).toDataURL(); }

  NS.Icons = { draw, iconCanvas, iconUrl };
})(typeof globalThis !== 'undefined' ? globalThis : this);
