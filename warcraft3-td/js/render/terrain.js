/*
 * Procedurally painted terrain, baked once into an offscreen canvas.
 * Nothing here is an imported asset: grass, dirt road, cliff rim and the
 * water-mark tile grid are all drawn with canvas primitives from a seeded RNG,
 * so the map looks hand-painted but ships as pure code.
 */
(function (global) {
  'use strict';

  var Config = global.WC3.Config;
  var RNG = global.WC3.RNG;

  var GRASS = ['#4a7238', '#54803f', '#5d8c46', '#41652f', '#63954c'];
  var GRASS_DARK = '#35532a';
  var DIRT = ['#9a7a4c', '#a48455', '#8b6c41', '#b09262'];

  function blob(ctx, x, y, r, color, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function makeCanvas(w, h) {
    if (typeof OffscreenCanvas === 'function') {
      try { return new OffscreenCanvas(w, h); } catch (e) { /* fall through */ }
    }
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  /**
   * @param {WC3.Game} game
   * @returns {{canvas:HTMLCanvasElement, width:number, height:number}}
   */
  function bake(game) {
    var W = game.worldW;
    var H = game.worldH;
    var canvas = makeCanvas(W, H);
    var ctx = canvas.getContext('2d');
    var rng = new RNG(RNG.hashString('terrain') ^ game.seedValue);

    // --- base grass ---------------------------------------------------
    ctx.fillStyle = GRASS[0];
    ctx.fillRect(0, 0, W, H);

    var i, x, y;
    for (i = 0; i < 2600; i++) {
      x = rng.range(0, W);
      y = rng.range(0, H);
      blob(ctx, x, y, rng.range(24, 96), GRASS[rng.int(0, GRASS.length - 1)], rng.range(0.05, 0.18));
    }
    // Fine speckle gives the painted-canvas grain.
    ctx.globalAlpha = 1;
    for (i = 0; i < 14000; i++) {
      x = rng.range(0, W);
      y = rng.range(0, H);
      ctx.fillStyle = rng.next() < 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.05)';
      ctx.fillRect(x, y, rng.range(1, 3), rng.range(1, 2));
    }

    // --- tile weave ---------------------------------------------------
    ctx.globalAlpha = 0.055;
    ctx.strokeStyle = '#0d1a0a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (x = 0; x <= W; x += game.tile) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (y = 0; y <= H; y += game.tile) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // --- road ---------------------------------------------------------
    var pts = game.path.points;
    function stroke(width, color, alpha) {
      ctx.globalAlpha = alpha === undefined ? 1 : alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
      ctx.stroke();
    }

    var roadW = Config.ROAD_WIDTH * 1.5;
    stroke(roadW + 16, GRASS_DARK, 0.55);        // trampled grass shoulder
    stroke(roadW, DIRT[2], 1);
    stroke(roadW - 10, DIRT[0], 1);
    stroke(roadW * 0.55, DIRT[1], 0.75);
    stroke(roadW * 0.22, DIRT[3], 0.4);
    ctx.globalAlpha = 1;

    // Ruts, stones and dust patches along the road.
    var d = 0;
    while (d < game.path.length) {
      var p = game.path.pointAt(d);
      var nx = -Math.sin(p.angle);
      var ny = Math.cos(p.angle);
      var off = rng.range(-roadW * 0.42, roadW * 0.42);
      blob(ctx, p.x + nx * off, p.y + ny * off, rng.range(5, 16),
        DIRT[rng.int(0, DIRT.length - 1)], rng.range(0.15, 0.4));
      if (rng.next() < 0.22) {
        off = rng.range(-roadW * 0.38, roadW * 0.38);
        blob(ctx, p.x + nx * off, p.y + ny * off, rng.range(2.5, 5.5), '#5f5044', 0.7);
      }
      d += rng.range(6, 16);
    }
    ctx.globalAlpha = 1;

    // --- cliff rim + vignette ------------------------------------------
    var rim = ctx.createLinearGradient(0, 0, 0, H);
    rim.addColorStop(0, 'rgba(12,20,10,0.42)');
    rim.addColorStop(0.07, 'rgba(12,20,10,0)');
    rim.addColorStop(0.93, 'rgba(12,20,10,0)');
    rim.addColorStop(1, 'rgba(12,20,10,0.42)');
    ctx.fillStyle = rim;
    ctx.fillRect(0, 0, W, H);
    var rim2 = ctx.createLinearGradient(0, 0, W, 0);
    rim2.addColorStop(0, 'rgba(12,20,10,0.38)');
    rim2.addColorStop(0.06, 'rgba(12,20,10,0)');
    rim2.addColorStop(0.94, 'rgba(12,20,10,0)');
    rim2.addColorStop(1, 'rgba(12,20,10,0.38)');
    ctx.fillStyle = rim2;
    ctx.fillRect(0, 0, W, H);

    return { canvas: canvas, width: W, height: H };
  }

  /** Small pre-scaled copy used by the minimap. */
  function thumbnail(baked, w, h) {
    var c = makeCanvas(w, h);
    var ctx = c.getContext('2d');
    ctx.drawImage(baked.canvas, 0, 0, w, h);
    return c;
  }

  global.WC3.Terrain = { bake: bake, thumbnail: thumbnail, makeCanvas: makeCanvas };
})(typeof globalThis !== 'undefined' ? globalThis : this);
