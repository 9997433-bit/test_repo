/*
 * Sprite painters. Every unit, tower, doodad, projectile and effect is drawn
 * from canvas primitives — no image assets, no third-party art.
 */
(function (global) {
  'use strict';

  var TAU = Math.PI * 2;
  var HURT_FLASH = global.WC3.Creep ? global.WC3.Creep.HURT_FLASH : 0.12;

  // When set, every filled primitive gets a dark contour. This is what makes
  // units readable against the painted terrain.
  var outline = 0;

  function setOutline(px) { outline = px; }

  function contour(ctx) {
    if (!outline) return;
    ctx.strokeStyle = 'rgba(14,12,9,0.62)';
    ctx.lineWidth = outline;
    ctx.stroke();
  }

  function ell(ctx, x, y, rx, ry, color, alpha) {
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    ctx.fill();
    contour(ctx);
    ctx.globalAlpha = 1;
  }

  function rr(ctx, x, y, w, h, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    var x0 = x - w / 2;
    ctx.moveTo(x0 + r, y);
    ctx.lineTo(x0 + w - r, y);
    ctx.quadraticCurveTo(x0 + w, y, x0 + w, y + r);
    ctx.lineTo(x0 + w, y + h - r);
    ctx.quadraticCurveTo(x0 + w, y + h, x0 + w - r, y + h);
    ctx.lineTo(x0 + r, y + h);
    ctx.quadraticCurveTo(x0, y + h, x0, y + h - r);
    ctx.lineTo(x0, y + r);
    ctx.quadraticCurveTo(x0, y, x0 + r, y);
    ctx.fill();
    contour(ctx);
  }

  function poly(ctx, pts, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fill();
    contour(ctx);
  }

  /** Accepts '#rrggbb', '#rgb' or 'rgb(r,g,b)' and returns [r, g, b]. */
  function parseColor(color) {
    if (color.charCodeAt(0) === 35) {
      var hex = color.slice(1);
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      var n = parseInt(hex, 16) | 0;
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    var open = color.indexOf('(');
    var parts = color.slice(open + 1, color.indexOf(')')).split(',');
    return [parseInt(parts[0], 10) | 0, parseInt(parts[1], 10) | 0, parseInt(parts[2], 10) | 0];
  }

  function clamp255(v) { return v < 0 ? 0 : (v > 255 ? 255 : Math.round(v)); }

  function shade(color, amount) {
    var c = parseColor(color);
    return 'rgb(' + clamp255(c[0] + amount) + ',' + clamp255(c[1] + amount) +
      ',' + clamp255(c[2] + amount) + ')';
  }

  /** Two dots. Cheap, but it is what turns a coloured blob into a creature. */
  function eyes(ctx, x, y, spread, size, color) {
    var keep = outline;
    outline = 0;
    ell(ctx, x - spread, y, size, size, color);
    ell(ctx, x + spread, y, size, size, color);
    outline = keep;
  }

  function statusRing(ctx, x, yGround, rx, ry, color, s) {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, 1.8 * s);
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(x, yGround, rx, ry, 0, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function shadow(ctx, x, yGround, r, tilt) {
    var keep = outline;
    outline = 0;
    ell(ctx, x, yGround, r, r * tilt * 0.9, '#000000', 0.2);
    outline = keep;
  }

  // ------------------------------------------------------------- doodads

  function drawDoodad(ctx, d, x, y, s, tilt) {
    setOutline(Math.max(0.8, s * 1.1));
    drawDoodadBody(ctx, d, x, y, s, tilt);
    setOutline(0);
  }

  function drawDoodadBody(ctx, d, x, y, s, tilt) {
    if (d.kind === 'rock') {
      shadow(ctx, x, y, 12 * s, tilt);
      poly(ctx, [
        [x - 13 * s, y], [x - 9 * s, y - 14 * s], [x + 2 * s, y - 18 * s],
        [x + 12 * s, y - 9 * s], [x + 11 * s, y]
      ], '#6d6e6a');
      poly(ctx, [
        [x - 9 * s, y - 14 * s], [x + 2 * s, y - 18 * s], [x + 1 * s, y - 9 * s]
      ], '#8b8c87');
      return;
    }
    if (d.kind === 'bush') {
      shadow(ctx, x, y, 11 * s, tilt);
      ell(ctx, x - 5 * s, y - 6 * s, 8 * s, 7 * s, '#2f4d23');
      ell(ctx, x + 5 * s, y - 6 * s, 8 * s, 7 * s, '#375a29');
      ell(ctx, x, y - 11 * s, 9 * s, 8 * s, '#416930');
      return;
    }
    // tree
    shadow(ctx, x, y, 14 * s, tilt);
    ctx.fillStyle = '#4a3520';
    ctx.fillRect(x - 3 * s, y - 22 * s, 6 * s, 22 * s);
    if (d.variant === 0) {
      poly(ctx, [[x, y - 62 * s], [x - 17 * s, y - 24 * s], [x + 17 * s, y - 24 * s]], '#254a1e');
      poly(ctx, [[x, y - 74 * s], [x - 14 * s, y - 40 * s], [x + 14 * s, y - 40 * s]], '#2e5a25');
      poly(ctx, [[x, y - 84 * s], [x - 10 * s, y - 56 * s], [x + 10 * s, y - 56 * s]], '#376a2b');
    } else {
      ell(ctx, x - 9 * s, y - 32 * s, 14 * s, 12 * s, '#264c1f');
      ell(ctx, x + 9 * s, y - 34 * s, 14 * s, 12 * s, '#2d5825');
      ell(ctx, x, y - 46 * s, 17 * s, 15 * s, '#38692c');
      ell(ctx, x - 4 * s, y - 52 * s, 10 * s, 9 * s, '#437a33');
    }
  }

  // -------------------------------------------------------------- portal

  function drawPortal(ctx, x, y, s, time, tilt) {
    ell(ctx, x, y, 34 * s, 34 * s * tilt, '#120a1c', 0.85);
    for (var i = 0; i < 4; i++) {
      var a = time * (1.1 + i * 0.35) + i * 1.7;
      ctx.strokeStyle = i % 2 ? 'rgba(168,102,255,0.75)' : 'rgba(96,214,255,0.6)';
      ctx.lineWidth = (3 - i * 0.5) * s;
      ctx.beginPath();
      ctx.ellipse(x, y, (30 - i * 6) * s, (30 - i * 6) * s * tilt, a, 0, TAU * 0.72);
      ctx.stroke();
    }
    ell(ctx, x, y, 12 * s + Math.sin(time * 3) * 2 * s, (12 * s + Math.sin(time * 3) * 2 * s) * tilt,
      '#c79bff', 0.55);
    // Stone arch behind the rift.
    ctx.strokeStyle = '#4a4256';
    ctx.lineWidth = 7 * s;
    ctx.beginPath();
    ctx.arc(x, y - 4 * s, 36 * s, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
  }

  // ---------------------------------------------------------------- keep

  function drawKeep(ctx, x, y, s, time, tilt) {
    setOutline(Math.max(1, s * 1.4));
    shadow(ctx, x, y, 44 * s, tilt);
    // Curtain wall
    rr(ctx, x, y - 46 * s, 78 * s, 46 * s, 4 * s, '#7a7468');
    rr(ctx, x, y - 46 * s, 78 * s, 10 * s, 3 * s, '#918a7c');
    for (var i = -3; i <= 3; i++) {
      ctx.fillStyle = '#8d8678';
      ctx.fillRect(x + i * 11 * s - 4 * s, y - 56 * s, 8 * s, 11 * s);
    }
    // Keep tower
    rr(ctx, x, y - 92 * s, 34 * s, 50 * s, 3 * s, '#8b8476');
    rr(ctx, x, y - 92 * s, 34 * s, 8 * s, 2 * s, '#9d9587');
    poly(ctx, [[x - 22 * s, y - 92 * s], [x + 22 * s, y - 92 * s], [x, y - 118 * s]], '#3f6f9c');
    // Gate
    ctx.fillStyle = '#3c2f22';
    ctx.beginPath();
    ctx.moveTo(x - 10 * s, y);
    ctx.lineTo(x - 10 * s, y - 16 * s);
    ctx.quadraticCurveTo(x, y - 28 * s, x + 10 * s, y - 16 * s);
    ctx.lineTo(x + 10 * s, y);
    ctx.closePath();
    ctx.fill();
    // Banner
    var sway = Math.sin(time * 2) * 2 * s;
    ctx.fillStyle = '#c8b26a';
    ctx.fillRect(x + 26 * s, y - 116 * s, 1.6 * s, 40 * s);
    poly(ctx, [
      [x + 27 * s, y - 116 * s], [x + 45 * s + sway, y - 112 * s],
      [x + 40 * s + sway, y - 100 * s], [x + 45 * s + sway, y - 90 * s],
      [x + 27 * s, y - 92 * s]
    ], '#2f5f96');
    setOutline(0);
  }

  // -------------------------------------------------------------- towers

  function towerBase(ctx, x, y, s, tilt, color) {
    shadow(ctx, x, y, 19 * s, tilt);
    ell(ctx, x, y, 19 * s, 19 * s * tilt, '#5b5347');
    ell(ctx, x, y - 2 * s, 16 * s, 16 * s * tilt, '#6f6757');
    ell(ctx, x, y - 3 * s, 12 * s, 12 * s * tilt, shade(color, -70));
  }

  function tierPips(ctx, x, y, s, tier, color) {
    for (var i = 0; i < tier; i++) {
      var px = x + (i - (tier - 1) / 2) * 7 * s;
      star(ctx, px, y, 3 * s, color);
    }
  }

  function star(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = (i / 10) * TAU - Math.PI / 2;
      var rad = i % 2 ? r * 0.45 : r;
      var px = x + Math.cos(a) * rad;
      var py = y + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawTower(ctx, tw, x, y, s, time, tilt) {
    setOutline(Math.max(1, s * 1.4));
    var def = tw.def;
    var c = def.raceColor;
    var a = def.raceAccent;
    var grow = tw.buildAnim;
    var h = (26 + def.tier * 11) * s * (0.4 + 0.6 * grow);
    var recoil = tw.fireAnim > 0 ? (tw.fireAnim / 0.14) * 3 * s : 0;

    towerBase(ctx, x, y, s, tilt, c);

    switch (def.icon) {
      case 'arrow':
        rr(ctx, x, y - h, 20 * s, h, 3 * s, '#6b5334');
        rr(ctx, x, y - h, 20 * s, 6 * s, 2 * s, '#846741');
        poly(ctx, [[x - 15 * s, y - h], [x + 15 * s, y - h], [x, y - h - 16 * s]], c);
        ctx.fillStyle = '#2b2118';
        ctx.fillRect(x - 3 * s, y - h + 12 * s, 6 * s, 10 * s);
        break;
      case 'cannon':
        rr(ctx, x, y - h, 26 * s, h, 4 * s, '#767065');
        rr(ctx, x, y - h, 26 * s, 7 * s, 3 * s, '#8d8779');
        ctx.save();
        ctx.translate(x, y - h - 3 * s);
        ctx.rotate(tw.angle * 0.32);
        rr(ctx, 0, -5 * s, (30 - recoil) * s, 10 * s, 4 * s, '#3d3a35');
        ell(ctx, 12 * s, 0, 5 * s, 5 * s, '#25231f');
        ctx.restore();
        break;
      case 'orb':
        poly(ctx, [[x - 12 * s, y], [x + 12 * s, y], [x + 7 * s, y - h], [x - 7 * s, y - h]], '#7f88b4');
        poly(ctx, [[x - 7 * s, y - h], [x + 7 * s, y - h], [x, y - h - 14 * s]], c);
        var pulse = 1 + Math.sin(time * 3) * 0.12;
        ell(ctx, x, y - h - 22 * s, 8 * s * pulse, 8 * s * pulse, a, 0.9);
        ell(ctx, x, y - h - 22 * s, 13 * s * pulse, 13 * s * pulse, a, 0.22);
        break;
      case 'spear':
        rr(ctx, x, y - h, 22 * s, h, 3 * s, '#6e4f33');
        for (var i = -1; i <= 1; i++) {
          ctx.strokeStyle = '#c7b48d';
          ctx.lineWidth = 2 * s;
          ctx.beginPath();
          ctx.moveTo(x + i * 8 * s, y - h);
          ctx.lineTo(x + i * 8 * s, y - h - 13 * s);
          ctx.stroke();
        }
        rr(ctx, x, y - h - 6 * s, 26 * s, 8 * s, 2 * s, c);
        break;
      case 'poison':
        ell(ctx, x, y - h * 0.55, 20 * s, h * 0.6, '#5c4a2e');
        rr(ctx, x, y - h, 16 * s, h * 0.5, 6 * s, '#4d3f27');
        ell(ctx, x, y - h - 2 * s, 11 * s, 6 * s, '#3f6b2c');
        for (i = 0; i < 3; i++) {
          var bob = ((time * 1.4 + i * 0.4) % 1);
          ell(ctx, x + (i - 1) * 4 * s, y - h - 4 * s - bob * 14 * s,
            2.4 * s, 2.4 * s, '#8fd463', 1 - bob);
        }
        break;
      case 'chain':
        rr(ctx, x, y - h, 15 * s, h, 3 * s, '#5b4a3a');
        ell(ctx, x, y - h, 12 * s, 9 * s, c);
        ctx.fillStyle = '#1d1913';
        ctx.fillRect(x - 5 * s, y - h - 3 * s, 3 * s, 4 * s);
        ctx.fillRect(x + 2 * s, y - h - 3 * s, 3 * s, 4 * s);
        ctx.strokeStyle = 'rgba(160,230,255,' + (0.4 + 0.35 * Math.sin(time * 7)) + ')';
        ctx.lineWidth = 1.6 * s;
        ctx.beginPath();
        ctx.arc(x, y - h - 6 * s, 12 * s, Math.PI, TAU);
        ctx.stroke();
        break;
      case 'root':
        rr(ctx, x, y - h, 24 * s, h, 9 * s, '#4d3a26');
        ell(ctx, x - 10 * s, y - h - 4 * s, 15 * s, 12 * s, '#2c5222');
        ell(ctx, x + 10 * s, y - h - 6 * s, 15 * s, 12 * s, '#356128');
        ell(ctx, x, y - h - 16 * s, 18 * s, 14 * s, '#3d7030');
        ctx.fillStyle = '#f0e0a0';
        ctx.fillRect(x - 6 * s, y - h + 8 * s, 3 * s, 4 * s);
        ctx.fillRect(x + 3 * s, y - h + 8 * s, 3 * s, 4 * s);
        break;
      case 'acid':
        poly(ctx, [[x - 16 * s, y], [x + 16 * s, y], [x + 10 * s, y - h], [x - 10 * s, y - h]], '#4f4433');
        ell(ctx, x, y - h, 12 * s, 7 * s, '#6f9b3a');
        ell(ctx, x, y - h - 1 * s, 8 * s + Math.sin(time * 4) * s, 4 * s, '#a6d95a', 0.85);
        poly(ctx, [[x - 14 * s, y - h + 3 * s], [x, y - h - 18 * s], [x + 14 * s, y - h + 3 * s]], c);
        break;
      case 'star':
        ell(ctx, x, y - 4 * s, 20 * s, 20 * s * tilt, '#3a5c74');
        ell(ctx, x, y - 5 * s, 15 * s, 15 * s * tilt, '#6fb7d8', 0.85);
        ctx.strokeStyle = c;
        ctx.lineWidth = 3 * s;
        ctx.beginPath();
        ctx.ellipse(x, y - 5 * s, 18 * s, 18 * s * tilt, 0, 0, TAU);
        ctx.stroke();
        star(ctx, x, y - h - 6 * s, 9 * s + Math.sin(time * 2.4) * 1.5 * s, a);
        break;
      case 'skull':
        poly(ctx, [[x - 12 * s, y], [x + 12 * s, y], [x + 6 * s, y - h], [x - 6 * s, y - h]], '#8f8a7a');
        ell(ctx, x, y - h - 8 * s, 10 * s, 9 * s, '#d8d2bd');
        ctx.fillStyle = '#221f1a';
        ell(ctx, x - 4 * s, y - h - 9 * s, 2.6 * s, 3 * s, '#221f1a');
        ell(ctx, x + 4 * s, y - h - 9 * s, 2.6 * s, 3 * s, '#221f1a');
        ell(ctx, x, y - h - 20 * s, 5 * s, 5 * s, a, 0.6 + 0.3 * Math.sin(time * 4));
        break;
      case 'web':
        for (i = 0; i < 3; i++) {
          var w = (26 - i * 6) * s;
          rr(ctx, x, y - (i + 1) * (h / 3.2), w, (h / 3.2) + 1, 1.5 * s,
            i % 2 ? '#6c5f7e' : '#7a6c8d');
        }
        ell(ctx, x, y - h - 4 * s, 7 * s, 7 * s, a, 0.75 + 0.2 * Math.sin(time * 3));
        break;
      case 'meat':
        rr(ctx, x, y - h * 0.7, 30 * s, h * 0.7, 3 * s, '#5c4b38');
        ell(ctx, x - 11 * s, y - 2 * s, 6 * s, 6 * s, '#3a2f24');
        ell(ctx, x + 11 * s, y - 2 * s, 6 * s, 6 * s, '#3a2f24');
        ctx.save();
        ctx.translate(x, y - h * 0.7);
        ctx.rotate(-0.9 + recoil * 0.12);
        rr(ctx, 0, -3 * s, 26 * s, 6 * s, 2 * s, '#6f5b41');
        ell(ctx, 13 * s, 0, 6 * s, 6 * s, c);
        ctx.restore();
        break;
      default:
        rr(ctx, x, y - h, 20 * s, h, 3 * s, c);
    }

    setOutline(0);
    tierPips(ctx, x, y - h - 30 * s, s, def.tier, a);

    if (tw.fireAnim > 0) {
      var f = tw.fireAnim / 0.14;
      ell(ctx, x + Math.cos(tw.angle) * 18 * s, y - h * 0.7 + Math.sin(tw.angle) * 6 * s,
        9 * s * f, 9 * s * f, '#ffe9a8', 0.7 * f);
    }
  }

  // -------------------------------------------------------------- creeps

  function drawCreep(ctx, c, x, y, s, time, tilt, opts) {
    var r = c.radius * s;
    setOutline(Math.max(1, s * 1.5));
    var groundY = y + (c.z * s);
    shadow(ctx, x, groundY, r * 0.85, tilt);

    // Status tints stay light: mixing a warm body colour far towards cyan or
    // green just desaturates it to grey. The ground markers below carry the
    // actual readability.
    var body = c.def.color;
    if (c.slowTimer > 0) body = mix(body, '#bfe9ff', 0.2);
    if (c.poisonTimer > 0) body = mix(body, '#a9ef78', 0.2);
    // Getting hit brightens the body and fades out. A fixed-strength tint (or
    // an overlay blob) just reads as "washed out" under sustained fire.
    if (c.hurtFlash > 0) body = mix(body, '#fff2d0', 0.55 * (c.hurtFlash / HURT_FLASH));

    ctx.save();
    var bob = Math.sin(time * 7 + c.id) * (c.flying ? 0 : r * 0.06);

    switch (c.def.shape) {
      case 'skeleton':
        ell(ctx, x, y - r * 1.1 + bob, r * 0.62, r * 0.72, body);
        ell(ctx, x, y - r * 2.0 + bob, r * 0.5, r * 0.52, '#efe9d8');
        ctx.fillStyle = '#2a2620';
        ctx.fillRect(x - r * 0.28, y - r * 2.1 + bob, r * 0.18, r * 0.2);
        ctx.fillRect(x + r * 0.1, y - r * 2.1 + bob, r * 0.18, r * 0.2);
        break;
      case 'soldier':
        rr(ctx, x, y - r * 1.7 + bob, r * 1.1, r * 1.2, r * 0.3, body);
        ell(ctx, x, y - r * 2.05 + bob, r * 0.46, r * 0.46, '#e8c9a0');
        eyes(ctx, x, y - r * 2.08 + bob, r * 0.17, r * 0.1, '#3a2c22');
        rr(ctx, x, y - r * 2.35 + bob, r * 1.0, r * 0.4, r * 0.2, shade(body, -30));
        ctx.strokeStyle = '#cfd6e0';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.6, y - r * 1.4 + bob);
        ctx.lineTo(x + r * 1.1, y - r * 2.4 + bob);
        ctx.stroke();
        break;
      case 'beast':
        ell(ctx, x, y - r * 0.85 + bob, r * 1.05, r * 0.68, body);
        ell(ctx, x + r * 0.85, y - r * 1.15 + bob, r * 0.46, r * 0.42, shade(body, 20));
        eyes(ctx, x + r * 0.85, y - r * 1.22 + bob, r * 0.16, r * 0.09, '#6d1c1c');
        ctx.fillStyle = '#7b2d2d';
        ctx.fillRect(x - r * 1.1, y - r * 0.9 + bob, r * 0.4, r * 0.16);
        break;
      case 'brute':
        ell(ctx, x, y - r * 1.15 + bob, r * 1.15, r * 1.0, body);
        ell(ctx, x - r * 1.2, y - r * 1.3 + bob, r * 0.42, r * 0.5, shade(body, -20));
        ell(ctx, x + r * 1.2, y - r * 1.3 + bob, r * 0.42, r * 0.5, shade(body, -20));
        ell(ctx, x, y - r * 2.15 + bob, r * 0.58, r * 0.55, shade(body, 24));
        eyes(ctx, x, y - r * 2.2 + bob, r * 0.22, r * 0.14, '#2a2018');
        // Tusks: reads as "big melee bruiser" even at minimum zoom.
        poly(ctx, [
          [x - r * 0.34, y - r * 1.95 + bob], [x - r * 0.14, y - r * 1.95 + bob],
          [x - r * 0.26, y - r * 1.62 + bob]
        ], '#efe6cf');
        poly(ctx, [
          [x + r * 0.34, y - r * 1.95 + bob], [x + r * 0.14, y - r * 1.95 + bob],
          [x + r * 0.26, y - r * 1.62 + bob]
        ], '#efe6cf');
        break;
      case 'rider':
        ell(ctx, x, y - r * 0.9 + bob, r * 1.25, r * 0.6, '#6b5a49');
        rr(ctx, x + r * 0.1, y - r * 2.0 + bob, r * 0.9, r * 1.0, r * 0.25, body);
        ell(ctx, x + r * 0.1, y - r * 2.3 + bob, r * 0.42, r * 0.42, '#d8dde6');
        ell(ctx, x - r * 1.15, y - r * 1.2 + bob, r * 0.35, r * 0.3, '#5a4a3b');
        break;
      case 'engine':
        rr(ctx, x, y - r * 1.5 + bob, r * 2.0, r * 1.2, r * 0.15, body);
        ell(ctx, x - r * 0.8, y - r * 0.3, r * 0.42, r * 0.42, '#4a3b2b');
        ell(ctx, x + r * 0.8, y - r * 0.3, r * 0.42, r * 0.42, '#4a3b2b');
        poly(ctx, [
          [x - r * 0.4, y - r * 1.5], [x + r * 0.9, y - r * 2.5], [x + r * 1.1, y - r * 2.2]
        ], '#7a6448');
        break;
      case 'treant':
        rr(ctx, x, y - r * 1.6 + bob, r * 0.9, r * 1.6, r * 0.25, '#5a4429');
        ell(ctx, x - r * 0.7, y - r * 1.9 + bob, r * 0.8, r * 0.65, body);
        ell(ctx, x + r * 0.7, y - r * 2.0 + bob, r * 0.8, r * 0.65, shade(body, 18));
        ell(ctx, x, y - r * 2.5 + bob, r * 0.95, r * 0.8, shade(body, 8));
        ctx.fillStyle = '#ffe08a';
        ctx.fillRect(x - r * 0.3, y - r * 1.5 + bob, r * 0.16, r * 0.2);
        ctx.fillRect(x + r * 0.14, y - r * 1.5 + bob, r * 0.16, r * 0.2);
        break;
      case 'demon':
        ell(ctx, x, y - r * 1.3 + bob, r * 1.0, r * 1.0, body);
        ell(ctx, x, y - r * 2.2 + bob, r * 0.52, r * 0.5, shade(body, 26));
        eyes(ctx, x, y - r * 2.25 + bob, r * 0.19, r * 0.11, '#ffe27a');
        poly(ctx, [[x - r * 0.55, y - r * 2.5], [x - r * 0.2, y - r * 2.5], [x - r * 0.75, y - r * 3.1]], '#3a1e1a');
        poly(ctx, [[x + r * 0.55, y - r * 2.5], [x + r * 0.2, y - r * 2.5], [x + r * 0.75, y - r * 3.1]], '#3a1e1a');
        ell(ctx, x, y - r * 1.3 + bob, r * 1.5, r * 1.5, '#ff7a4a', 0.14);
        break;
      case 'wing':
      default: {
        var flap = Math.sin(time * 9 + c.id) * 0.5;
        poly(ctx, [
          [x, y - r * 0.9], [x - r * 2.1, y - r * (1.5 + flap)], [x - r * 0.6, y - r * 0.4]
        ], shade(body, -22));
        poly(ctx, [
          [x, y - r * 0.9], [x + r * 2.1, y - r * (1.5 - flap)], [x + r * 0.6, y - r * 0.4]
        ], shade(body, -12));
        ell(ctx, x, y - r * 1.0, r * 0.75, r * 0.5, body);
        ell(ctx, x + r * 0.7, y - r * 1.25, r * 0.35, r * 0.3, shade(body, 22));
        break;
      }
    }

    if (c.boss) {
      // Crown marks the wave boss.
      ctx.fillStyle = '#ffd76a';
      var cy = y - r * 2.85;
      poly(ctx, [
        [x - r * 0.6, cy], [x + r * 0.6, cy], [x + r * 0.6, cy - r * 0.35],
        [x + r * 0.3, cy - r * 0.1], [x, cy - r * 0.45], [x - r * 0.3, cy - r * 0.1],
        [x - r * 0.6, cy - r * 0.35]
      ], '#ffd76a');
    }
    ctx.restore();
    setOutline(0);

    // Status markers: a ring on the ground per debuff, so several can stack
    // and still be told apart at low zoom.
    if (c.slowTimer > 0) statusRing(ctx, x, groundY, r * 1.15, r * 0.62, '#8fd8ff', s);
    if (c.rootTimer > 0) statusRing(ctx, x, groundY, r * 1.0, r * 0.54, '#7ad06a', s);
    if (c.poisonTimer > 0) {
      for (var pb = 0; pb < 3; pb++) {
        var pa = time * 1.6 + c.id + pb * 2.1;
        var lift = ((pa % 1.4) / 1.4);
        ell(ctx, x + Math.sin(pa * 3) * r * 0.5, y - r * 1.4 - lift * r * 1.6,
          r * 0.15 * (1 - lift * 0.5), r * 0.15 * (1 - lift * 0.5),
          '#9de86a', 0.75 * (1 - lift));
      }
    }

    // Health bar (WC3 style: black frame, green fill, red when hurt).
    if (opts && opts.showBars !== false) {
      var bw = Math.max(16, r * 2.2);
      var bh = Math.max(3, 3.2 * s);
      var by = y - r * (c.boss ? 3.7 : 2.9);
      var frac = Math.max(0, c.hp / c.hpMax);
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(x - bw / 2 - 1, by - 1, bw + 2, bh + 2);
      ctx.fillStyle = frac > 0.55 ? '#39c24a' : (frac > 0.25 ? '#d8c53a' : '#d84a3a');
      ctx.fillRect(x - bw / 2, by, bw * frac, bh);
    }
  }

  function mix(a, b, t) {
    var ca = parseColor(a);
    var cb = parseColor(b);
    return 'rgb(' + clamp255(ca[0] * (1 - t) + cb[0] * t) + ',' +
      clamp255(ca[1] * (1 - t) + cb[1] * t) + ',' +
      clamp255(ca[2] * (1 - t) + cb[2] * t) + ')';
  }

  // ---------------------------------------------------------------- hero

  function drawHero(ctx, hero, x, y, s, time, tilt) {
    setOutline(Math.max(1, s * 1.5));
    var r = 17 * s;
    shadow(ctx, x, y, r, tilt);
    // Selection-style gold circle marks the commander.
    ctx.strokeStyle = 'rgba(255,220,120,0.75)';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.25, r * 1.25 * tilt, 0, 0, TAU);
    ctx.stroke();

    var bob = Math.sin(time * 5) * r * 0.05;
    rr(ctx, x, y - r * 2.0 + bob, r * 1.15, r * 1.25, r * 0.3, hero.def.color);
    ell(ctx, x, y - r * 2.35 + bob, r * 0.48, r * 0.48, '#e7c9a3');
    poly(ctx, [
      [x - r * 0.6, y - r * 2.5 + bob], [x + r * 0.6, y - r * 2.5 + bob],
      [x, y - r * 2.95 + bob]
    ], shade(hero.def.color, -40));
    ctx.strokeStyle = '#e8eef6';
    ctx.lineWidth = 2.4 * s;
    ctx.beginPath();
    ctx.moveTo(x + r * 0.6, y - r * 1.5 + bob);
    ctx.lineTo(x + r * 0.6 + Math.cos(hero.angle) * r * 1.3,
      y - r * 2.4 + bob + Math.sin(hero.angle) * r * 0.4);
    ctx.stroke();
    setOutline(0);
    if (hero.hasteTimer > 0) {
      ell(ctx, x, y - r, r * 1.6, r * 1.7, '#ffe9a8', 0.15);
    }
  }

  // --------------------------------------------------------- projectiles

  function drawProjectile(ctx, p, x, y, s) {
    var col = p.color || '#ffe9a8';
    switch (p.kind) {
      case 'arrow':
      case 'dart':
      case 'spear':
      case 'thorn':
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.2 * s;
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(p.angle) * 9 * s, y - Math.sin(p.angle) * 4 * s);
        ctx.lineTo(x, y);
        ctx.stroke();
        break;
      case 'shell':
      case 'corpse':
      case 'acid':
        ell(ctx, x, y, 5 * s, 5 * s, col);
        ell(ctx, x, y, 8 * s, 8 * s, col, 0.22);
        break;
      case 'bolt':
        ctx.strokeStyle = '#bfe9ff';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(p.angle) * 12 * s, y - Math.sin(p.angle) * 5 * s);
        ctx.lineTo(x, y);
        ctx.stroke();
        break;
      case 'star':
        star(ctx, x, y, 6 * s, col);
        break;
      case 'web':
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.4 * s;
        ctx.beginPath();
        ctx.arc(x, y, 5 * s, 0, TAU);
        ctx.moveTo(x - 5 * s, y);
        ctx.lineTo(x + 5 * s, y);
        ctx.moveTo(x, y - 5 * s);
        ctx.lineTo(x, y + 5 * s);
        ctx.stroke();
        break;
      default:
        ell(ctx, x, y, 4.5 * s, 4.5 * s, col);
        ell(ctx, x, y, 9 * s, 9 * s, col, 0.2);
    }
  }

  // ------------------------------------------------------------------ fx

  function drawFx(ctx, f, x, y, s, cam) {
    var p = f.progress();
    switch (f.kind) {
      case 'dmgtext':
      case 'goldtext':
        ctx.font = 'bold ' + Math.round(f.size * s * 1.25) + 'px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 1 - p * p;
        ctx.lineWidth = 3 * s;
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.strokeText(f.text, x, y);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, x, y);
        ctx.globalAlpha = 1;
        break;
      case 'spark':
      case 'gib':
        ell(ctx, x, y, f.size * s * (1 - p * 0.5), f.size * s * (1 - p * 0.5), f.color, 1 - p);
        break;
      case 'puff':
        ell(ctx, x, y, f.size * s * (0.4 + p), f.size * s * (0.3 + p * 0.7), f.color, 0.5 * (1 - p));
        break;
      case 'ring':
        ctx.strokeStyle = f.color;
        ctx.globalAlpha = 1 - p;
        ctx.lineWidth = 3 * s;
        ctx.beginPath();
        ctx.ellipse(x, y, f.size * s * (0.3 + p), f.size * s * (0.3 + p) * cam.tilt, 0, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
        break;
      case 'blast':
        ell(ctx, x, y, f.size * s * (0.5 + p * 0.6), f.size * s * (0.5 + p * 0.6) * cam.tilt,
          f.color, 0.4 * (1 - p));
        ctx.strokeStyle = '#ffe1a8';
        ctx.globalAlpha = 0.7 * (1 - p);
        ctx.lineWidth = 2.5 * s;
        ctx.beginPath();
        ctx.ellipse(x, y, f.size * s * (0.4 + p * 0.7), f.size * s * (0.4 + p * 0.7) * cam.tilt, 0, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
        break;
      case 'leak':
        ctx.strokeStyle = '#ff5a4a';
        ctx.globalAlpha = 0.8 * (1 - p);
        ctx.lineWidth = 5 * s;
        ctx.beginPath();
        ctx.ellipse(x, y, f.size * s * (0.4 + p), f.size * s * (0.4 + p) * cam.tilt, 0, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
        break;
      case 'corpse':
        ell(ctx, x, y, f.size * s * 1.1, f.size * s * 0.5, f.color, 0.5 * (1 - p));
        ell(ctx, x, y, f.size * s * 0.6, f.size * s * 0.3, '#2c241c', 0.4 * (1 - p));
        break;
      default:
        break;
    }
  }

  function drawBolt(ctx, f, cam) {
    var a = cam.toScreen(f.ax, f.ay, 26);
    var b = cam.toScreen(f.bx, f.by, 26);
    var segs = 6;
    var seed = f.seed;
    ctx.strokeStyle = '#d6f2ff';
    ctx.globalAlpha = 1 - f.progress();
    ctx.lineWidth = 2.5 * cam.zoom;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    for (var i = 1; i < segs; i++) {
      var t = i / segs;
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      var jitter = ((seed % 1000) / 1000 - 0.5) * 18 * cam.zoom;
      ctx.lineTo(a.x + (b.x - a.x) * t + jitter, a.y + (b.y - a.y) * t + jitter * 0.5);
    }
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  global.WC3.Sprites = {
    setOutline: setOutline,
    drawDoodad: drawDoodad,
    drawPortal: drawPortal,
    drawKeep: drawKeep,
    drawTower: drawTower,
    drawCreep: drawCreep,
    drawHero: drawHero,
    drawProjectile: drawProjectile,
    drawFx: drawFx,
    drawBolt: drawBolt,
    star: star,
    ell: ell,
    rr: rr,
    shade: shade,
    mix: mix
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
