/*
 * Boot + application glue: owns the loop, input routing, selection state,
 * build mode and the wiring between the simulation and every UI widget.
 */
(function (global) {
  'use strict';

  var WC3 = global.WC3;
  var Config = WC3.Config;
  var I18N = WC3.I18N;
  var Audio = WC3.Audio;

  var SETTINGS_KEY = Config.STORAGE_KEY + '.settings';

  function App() {
    this.canvas = document.getElementById('game');
    this.settings = this.loadSettings();
    I18N.setLang(this.settings.lang);

    this.camera = new WC3.Camera(Config.WORLD_W, Config.WORLD_H);
    this.renderer = new WC3.Renderer(this.canvas, this.camera);
    this.input = new WC3.Input(this.canvas);
    this.tooltip = new WC3.Tooltip(document.getElementById('tooltip'));
    this.menus = new WC3.Menus(this);

    this.game = new WC3.Game({ difficulty: this.settings.difficulty, seed: Config.seed });
    this.selected = null;
    this.buildDef = null;
    this.hoverTile = null;
    this.hoverTower = null;
    this.orderFlash = { x: 0, y: 0, t: 0 };
    this.started = false;

    this.hud = new WC3.Hud(this);
    this.card = new WC3.CommandCard(document.getElementById('command-card'), this);
    this.minimap = new WC3.Minimap(document.getElementById('minimap'), this.game, this.camera);

    var self = this;
    this.loop = new WC3.Loop({
      update: function (dt) { self.update(dt); },
      render: function (alpha, dtReal) { self.render(alpha, dtReal); },
      onStats: function (loop) { self.onStats(loop); },
      onError: function (err, loop) { self.onLoopError(err, loop); }
    });

    this.bindInput();
    this.bindChrome();
    this.resize();
    global.addEventListener('resize', function () { self.resize(); });

    this.applySettings();
    this.newGame();
    this.loop.start();
    this.loop.setPaused(true);
    this.menus.showStart();
  }

  // ------------------------------------------------------------ settings

  App.prototype.loadSettings = function () {
    var d = {
      lang: 'zh', difficulty: 'normal', hero: 'warden',
      master: 0.6, sfx: 0.8, damageText: true, showRanges: false, showFps: false
    };
    try {
      var raw = JSON.parse(global.localStorage.getItem(SETTINGS_KEY) || '{}');
      for (var k in d) if (raw[k] !== undefined) d[k] = raw[k];
    } catch (e) { /* defaults */ }
    return d;
  };

  App.prototype.saveSettings = function () {
    try { global.localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)); } catch (e) { /* ignore */ }
  };

  App.prototype.applySettings = function () {
    this.settings.lang = I18N.lang;
    Audio.setMaster(this.settings.master);
    Audio.setSfx(this.settings.sfx);
    this.renderer.showDamageText = this.settings.damageText;
    this.renderer.showAllRanges = this.settings.showRanges;
    document.getElementById('fpsbox').classList.toggle('hidden', !this.settings.showFps);
    this.saveSettings();
  };

  App.prototype.onLanguageChange = function () {
    this.settings.lang = I18N.lang;
    this.saveSettings();
    this.hud.applyStaticStrings();
    this.hud.renderWavePreview();
    this.card.build();
  };

  // ----------------------------------------------------------- lifecycle

  App.prototype.newGame = function () {
    var heroId = this.settings.hero === 'none' ? null : this.settings.hero;
    this.game = new WC3.Game({
      difficulty: this.settings.difficulty,
      seed: (Date.now() ^ 0x5eed) >>> 0,
      hero: heroId
    });
    this.selected = null;
    this.buildDef = null;
    this.hoverTower = null;
    this.renderer.setGame(this.game);
    this.minimap.setGame(this.game);
    this.minimap.setTerrain(this.renderer.terrain);
    this.frameMap();
    this.hud.last = {};
    this.hud.renderWavePreview();
    this.card.setPage('races');
    document.getElementById('logstrip').innerHTML = '';
    this.setSpeed(1);
  };

  App.prototype.startRun = function () {
    this.newGame();
    this.started = true;
    this.menus.hide();
    this.setPaused(false);
    Audio.unlock();
  };

  App.prototype.setPaused = function (p) {
    this.loop.setPaused(p);
    document.getElementById('btn-pause').classList.toggle('active', p);
  };

  App.prototype.setSpeed = function (s) {
    this.loop.setSpeed(s);
    this.loop.setPaused(false);
    var btns = document.querySelectorAll('.sbtn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', btns[i].dataset.speed === String(s));
    }
  };

  App.prototype.resize = function () {
    var w = global.innerWidth;
    var h = global.innerHeight;
    var top = document.getElementById('topbar');
    var bottom = document.getElementById('bottombar');
    this.camera.setInsets(
      top ? top.getBoundingClientRect().height : 0,
      bottom ? bottom.getBoundingClientRect().height : 0
    );
    this.renderer.resize(w, h);
    if (!this.started) this.frameMap();
  };

  /** Pull back far enough that the whole battlefield is on screen. */
  App.prototype.frameMap = function () {
    if (!this.game) return;
    this.camera.setZoom(this.camera.fitZoom());
    this.camera.centerOn(this.game.worldW / 2, this.game.worldH / 2);
  };

  // --------------------------------------------------------------- input

  App.prototype.bindChrome = function () {
    var self = this;
    document.getElementById('btn-menu').addEventListener('click', function () {
      self.openMenu();
    });
    document.getElementById('btn-pause').addEventListener('click', function () {
      self.setPaused(!self.loop.paused);
    });
    var sbtns = document.querySelectorAll('.sbtn[data-speed]');
    for (var i = 0; i < sbtns.length; i++) {
      (function (btn) {
        if (btn.dataset.speed === 'pause') return;
        btn.addEventListener('click', function () { self.setSpeed(parseFloat(btn.dataset.speed)); });
      })(sbtns[i]);
    }
    document.getElementById('btn-call').addEventListener('click', function () {
      if (self.game.callWave()) Audio.play('click');
    });
  };

  App.prototype.openMenu = function () {
    this.setPaused(true);
    this.menus.showPause();
  };

  App.prototype.bindInput = function () {
    var self = this;
    var input = this.input;

    input.on('wheel', function (e) {
      var factor = e.delta < 0 ? Config.CAMERA.zoomStep : 1 / Config.CAMERA.zoomStep;
      self.camera.zoomBy(factor, e.sx, e.sy);
    });

    input.on('pointermove', function (e) {
      var w = self.camera.toWorld(e.sx, e.sy);
      var tile = self.game.worldToTile(w.x, w.y);
      self.hoverTile = tile;
      self.hoverTower = self.buildDef ? null : self.pickTowerAt(e.sx, e.sy);
      if (e.dragging && e.button === 1) {
        self.camera.moveBy(-e.dx / self.camera.zoom, -e.dy / (self.camera.zoom * self.camera.tilt));
      }
    });

    input.on('pointerleave', function () { self.hoverTile = null; self.hoverTower = null; });

    input.on('click', function (e) {
      Audio.unlock();
      if (self.buildDef) {
        self.tryBuild(e);
        return;
      }
      self.selectAt(e.sx, e.sy);
    });

    input.on('rightclick', function (e) {
      if (self.buildDef) { self.cancelBuild(); return; }
      var w = self.camera.toWorld(e.sx, e.sy);
      if (self.game.hero) {
        self.game.hero.order(w.x, w.y);
        self.orderFlash.x = w.x;
        self.orderFlash.y = w.y;
        self.orderFlash.t = 1;
        Audio.play('click');
      }
    });

    input.on('keydown', function (e) {
      if (e.repeat) return;
      if (self.menus.open) {
        if (e.code === 'Escape') {
          if (self.started) { self.menus.hide(); self.setPaused(false); }
        }
        return;
      }
      switch (e.code) {
        case 'Escape':
          if (self.buildDef) self.cancelBuild();
          else if (self.selected) self.select(null);
          else self.openMenu();
          return;
        case 'Space':
          self.setPaused(!self.loop.paused);
          return;
        case 'Digit1': self.setSpeed(1); return;
        case 'Digit2': self.setSpeed(1.5); return;
        case 'Digit3': self.setSpeed(2); return;
        case 'F10': self.openMenu(); return;
        case 'KeyN': if (self.game.callWave()) Audio.play('click'); return;
        case 'KeyG': self.settings.showRanges = !self.settings.showRanges; self.applySettings(); return;
        default: break;
      }
      self.card.hotkey(e.code);
    });
  };

  // ----------------------------------------------------------- selection

  App.prototype.pickTowerAt = function (sx, sy) {
    var w = this.camera.toWorld(sx, sy);
    var tile = this.game.worldToTile(w.x, w.y);
    return this.game.towerAt(tile.tx, tile.ty);
  };

  App.prototype.selectAt = function (sx, sy) {
    var game = this.game;
    var cam = this.camera;
    var best = null;
    var bestD = Infinity;
    var i;

    for (i = 0; i < game.creeps.length; i++) {
      var c = game.creeps[i];
      var px = cam.toScreenX(c.x);
      var py = cam.toScreenY(c.y, c.z + c.radius * 0.8);
      var d = Math.hypot(px - sx, py - sy);
      if (d < c.radius * 1.9 * cam.zoom && d < bestD) { bestD = d; best = c; }
    }
    if (game.hero) {
      var hx = cam.toScreenX(game.hero.x);
      var hy = cam.toScreenY(game.hero.y, 20);
      var hd = Math.hypot(hx - sx, hy - sy);
      if (hd < 26 * cam.zoom && hd < bestD) { bestD = hd; best = game.hero; }
    }
    if (!best) best = this.pickTowerAt(sx, sy);
    this.select(best);
  };

  App.prototype.select = function (ent) {
    this.selected = ent || null;
    if (!ent) {
      this.card.setPage(this.card.raceId && this.card.page === 'race' ? 'race' : 'races');
      return;
    }
    if (ent.def && ent.def.tier) this.card.setPage('tower');
    else if (ent.def && ent.def.armor !== undefined) this.card.setPage(this.card.page === 'tower' ? 'races' : this.card.page);
    else this.card.setPage('hero');
  };

  // --------------------------------------------------------------- build

  App.prototype.startBuild = function (def) {
    this.buildDef = def;
    this.selected = null;
    this.canvas.classList.add('build-mode');
    this.card.refresh();
    this.card.build();
  };

  App.prototype.cancelBuild = function () {
    this.buildDef = null;
    this.canvas.classList.remove('build-mode');
    this.card.build();
  };

  App.prototype.tryBuild = function (e) {
    var w = this.camera.toWorld(e.sx, e.sy);
    var tile = this.game.worldToTile(w.x, w.y);
    var res = this.game.build(this.buildDef.id, tile.tx, tile.ty);
    if (typeof res === 'string') {
      this.hud.showError(res);
      Audio.play('click');
      return;
    }
    this.camera.addShake(1.6);
    if (!(e.event && e.event.shiftKey)) this.cancelBuild();
    this.card.refresh();
  };

  App.prototype.upgradeSelected = function () {
    var tw = this.selected;
    if (!tw || !tw.def || !tw.def.tier) return;
    var res = this.game.upgrade(tw);
    if (typeof res === 'string') this.hud.showError(res);
    this.card.build();
  };

  App.prototype.sellSelected = function () {
    var tw = this.selected;
    if (!tw || !tw.def || !tw.def.tier) return;
    this.game.sell(tw);
    this.select(null);
  };

  App.prototype.cycleTargetMode = function () {
    var tw = this.selected;
    if (!tw || !tw.cycleMode) return;
    tw.cycleMode(1);
    this.card.refresh();
  };

  App.prototype.castHero = function (which) {
    var hero = this.game.hero;
    if (!hero) return;
    var ok = which === 'q' ? hero.castQ(this.game) : hero.castW(this.game);
    if (!ok) Audio.play('click');
  };

  // ---------------------------------------------------------- loop hooks

  App.prototype.update = function (dt) {
    this.game.tick(dt);
    if (this.orderFlash.t > 0) this.orderFlash.t -= dt * 1.6;
  };

  App.prototype.render = function (alpha, dtReal) {
    var game = this.game;
    this.camera.update(dtReal, this.input);

    this.renderer.render(game, alpha, dtReal, {
      selected: this.selected,
      hoverTower: this.hoverTower,
      hoverTile: this.hoverTile,
      buildDef: this.buildDef,
      orderFlash: this.orderFlash
    });

    var sfx = game.drainSfx();
    for (var i = 0; i < sfx.length; i++) Audio.play(sfx[i]);

    var events = game.drainEvents();
    for (i = 0; i < events.length; i++) {
      var ev = events[i];
      if (ev.kind === 'leak') this.camera.addShake(4);
      if (ev.kind === 'wave' && ev.data.boss) this.camera.addShake(3);
      if (ev.kind === 'victory' || ev.kind === 'defeat') this.onRunEnd(ev.kind);
    }

    this.hud.update(dtReal);
    this.card.refresh();
    this.minimap.draw();
  };

  App.prototype.onRunEnd = function (result) {
    var self = this;
    setTimeout(function () {
      self.setPaused(true);
      self.menus.showEnd(result);
    }, 900);
  };

  /**
   * The loop swallows the throw so the game keeps running; surface it once so
   * a broken frame is visible instead of silently degrading the run.
   */
  App.prototype.onLoopError = function (err, loop) {
    if (typeof console !== 'undefined') console.error('loop error:', err);
    if (this._reportedError) return;
    this._reportedError = true;
    this.hud.showMessage('⚠ ' + (err && err.message ? err.message : String(err)), 9000);
    if (!loop.running) this.setPaused(true);
  };

  App.prototype.onStats = function (loop) {
    if (!this.settings.showFps) return;
    this.hud.setFps(
      'FPS ' + loop.fps.toFixed(0) +
      '  TPS ' + loop.tps.toFixed(0) +
      '  PEAK ' + loop.worstFrameMs.toFixed(0) + 'ms' +
      '\n' + I18N.t('creeps') + ' ' + this.game.creeps.length +
      '  ' + I18N.t('towersBuilt') + ' ' + this.game.towers.length +
      '\nFX ' + this.game.fx.length + '  PROJ ' + this.game.projectiles.length
    );
  };

  function boot() {
    global.WC3.app = new App();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
