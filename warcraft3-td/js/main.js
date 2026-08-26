/* Boot + application controller: wires the simulation to the renderer and UI. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});
  const doc = root.document;
  function T(k, v) { return NS.I18n.t(k, v); }

  function App() {
    this.canvas = doc.getElementById('world');
    this.audio = new NS.Audio();
    this.cam = new NS.Camera();
    this.speed = 1;
    this.paused = false;
    this.menuPaused = false;
    this.selection = null;
    this.buildDef = null;
    this.hoverTile = null;
    this.flashTimer = 0;

    this.game = new NS.Game({ difficulty: 'normal', hero: 'paladin', audio: this.audio });
    this.renderer = new NS.Renderer(this.game, this.canvas, this.cam);
    this.tooltip = new NS.Tooltip(this);
    this.hud = new NS.Hud(this);
    this.card = new NS.CommandCard(this);
    this.minimap = new NS.Minimap(this);
    this.menus = new NS.Menus(this);
    this.input = new NS.Input(this);

    this.bindChrome();
    this.resize();
    const self = this;
    root.addEventListener('resize', function () { self.resize(); });

    this.loop = new NS.Loop(NS.Config.dt,
      function (dt) { self.update(dt); },
      function (dt) { self.render(dt); });

    this.wireGame();
    this.frameBoard();
    this.menus.open('main');
    this.loop.start();
  }

  App.prototype.bindChrome = function () {
    const self = this;
    doc.getElementById('btn-next-wave').addEventListener('click', function () {
      self.audio.resume(); self.audio.click();
      self.game.startWave(true);
    });
    doc.querySelectorAll('[data-speed]').forEach(function (b) {
      b.addEventListener('click', function () {
        self.audio.click();
        const v = b.dataset.speed;
        if (v === 'pause') self.togglePause();
        else { self.speed = Number(v); self.paused = false; }
        self.syncSpeedButtons();
      });
    });
    doc.querySelectorAll('[data-menu]').forEach(function (b) {
      b.addEventListener('click', function () {
        self.audio.resume(); self.audio.click();
        const which = b.dataset.menu;
        if (which === 'menu') self.menus.open('pause');
        else if (which === 'quests') self.menus.open('help');
        else if (which === 'log') doc.getElementById('logstrip').classList.toggle('expanded');
        else self.menus.open('settings');
      });
      b.addEventListener('mouseenter', function () {
        self.tooltip.showText(b, b.textContent, '');
      });
      b.addEventListener('mouseleave', function () { self.tooltip.hide(); });
    });
    NS.I18n.onChange(function () { self.applyStrings(); });
  };

  App.prototype.applyStrings = function () {
    doc.querySelectorAll('[data-i18n]').forEach(function (n) {
      n.textContent = T(n.dataset.i18n);
    });
    doc.documentElement.lang = NS.I18n.lang === 'zh' ? 'zh-CN' : 'en';
    this.card.refresh();
    this.hud.lastSel = undefined;
  };

  App.prototype.onLanguageChange = function () { this.applyStrings(); };

  /** Park the camera over the first third of the road so the portal is in shot. */
  App.prototype.frameBoard = function () {
    const p = this.game.path.positionAt(this.game.path.length * 0.32);
    this.cam.centerOn(p.x, p.y);
  };

  App.prototype.resize = function () {
    const wrap = doc.getElementById('viewport');
    const w = wrap.clientWidth, h = wrap.clientHeight;
    const dpr = Math.min(2, root.devicePixelRatio || 1);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.dpr = dpr;
    this.cam.resize(this.canvas.width, this.canvas.height);
  };

  App.prototype.wireGame = function () {
    const self = this;
    this.game.audio = this.audio;
    this.game.onLog = function (kind, data) {
      self.hud.onGameLog(kind, data);
      if (kind === 'victory' || kind === 'defeat') {
        setTimeout(function () { self.menus.showResult(); }, 900);
      }
    };
  };

  App.prototype.newGame = function (difficulty, heroId) {
    this.game = new NS.Game({ difficulty: difficulty, hero: heroId, audio: this.audio });
    this.renderer = new NS.Renderer(this.game, this.canvas, this.cam);
    this.minimap.app = this;
    this.minimap.bake();
    this.selection = null;
    this.buildDef = null;
    this.speed = 1;
    this.paused = false;
    this.menuPaused = false;
    this.card.setMode('root');
    this.hud.lastSel = undefined;
    this.wireGame();
    this.syncSpeedButtons();
    this.frameBoard();
    this.hud.pushLog(T('waveIncoming', { n: 1, types: NS.WaveData.preview(1).map(function (ty) {
      return NS.I18n.name(NS.CreepData.TYPES[ty].name);
    }).join(' / ') }), 'wave');
  };

  /* ------------------------------------------------------------- controls */

  App.prototype.togglePause = function () {
    this.paused = !this.paused;
    this.syncSpeedButtons();
    this.card.refresh();
  };
  App.prototype.setPaused = function (v, fromMenu) {
    if (fromMenu) this.menuPaused = v;
    else this.paused = v;
    this.syncSpeedButtons();
  };
  App.prototype.cycleSpeed = function () {
    const list = NS.Config.speeds;
    const i = list.indexOf(this.speed);
    this.speed = list[(i + 1) % list.length];
    this.paused = false;
    this.syncSpeedButtons();
  };
  App.prototype.syncSpeedButtons = function () {
    const self = this;
    doc.querySelectorAll('[data-speed]').forEach(function (b) {
      const v = b.dataset.speed;
      const on = v === 'pause' ? self.paused : (!self.paused && Number(v) === self.speed);
      b.classList.toggle('on', !!on);
    });
  };

  App.prototype.flash = function (msg) {
    const n = doc.getElementById('flash');
    n.textContent = msg;
    n.classList.add('show');
    clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(function () { n.classList.remove('show'); }, 1400);
  };

  App.prototype.select = function (obj) {
    this.selection = obj;
    this.renderer.selection = obj;
    this.buildDef = null;
    this.renderer.buildDef = null;
    if (obj && obj.tileX !== undefined) this.card.setMode('tower');
    else if (obj && obj.def && obj.def.abilities) this.card.setMode('hero');
    else this.card.setMode('root');
    this.hud.lastSel = undefined;
  };

  App.prototype.startBuild = function (def) {
    this.selection = null;
    this.renderer.selection = null;
    this.buildDef = def;
    this.renderer.buildDef = def;
  };

  App.prototype.cancelBuild = function () {
    this.buildDef = null;
    this.renderer.buildDef = null;
    this.card.setMode('root');
  };

  /* --------------------------------------------------------------- input */

  App.prototype.pointerTile = function (sx, sy) {
    const w = this.cam.toWorld(sx * this.dpr, sy * this.dpr);
    return { x: Math.floor(w.x), y: Math.floor(w.y), wx: w.x, wy: w.y };
  };

  App.prototype.onPointerMove = function (sx, sy) {
    this.tooltip.hide();
    const t = this.pointerTile(sx, sy);
    this.hoverTile = t;
    this.renderer.hover = t;
    this.canvas.style.cursor = this.buildDef
      ? (this.game.isBuildable(t.x, t.y) ? 'crosshair' : 'not-allowed')
      : 'default';
  };

  App.prototype.onPointerLeave = function () {
    this.hoverTile = null;
    this.renderer.hover = null;
  };

  App.prototype.pickAt = function (wx, wy) {
    const game = this.game;
    let best = null, bestD = 1.1;
    for (let i = 0; i < game.creeps.length; i++) {
      const c = game.creeps[i];
      if (!c.alive) continue;
      const d = Math.hypot(c.x - wx, c.y - wy);
      if (d < bestD) { bestD = d; best = c; }
    }
    if (game.hero && !game.hero.dead) {
      const d = Math.hypot(game.hero.x - wx, game.hero.y - wy);
      if (d < bestD) { bestD = d; best = game.hero; }
    }
    return best;
  };

  App.prototype.onLeftClick = function (sx, sy) {
    this.audio.resume();
    const t = this.pointerTile(sx, sy);
    if (this.buildDef) {
      const res = this.game.build(this.buildDef.id, t.x, t.y);
      if (!res.ok) {
        this.audio.deny();
        this.flash(res.reason === 'cost'
          ? (this.game.gold < this.buildDef.gold ? T('notEnoughGold') : T('notEnoughLumber'))
          : T('cannotBuildHere'));
      } else {
        this.card.refresh();
        if (!this.game.canAfford(this.buildDef)) this.cancelBuild();
      }
      return;
    }
    const tower = this.game.towerAt(t.x, t.y);
    if (tower) { this.select(tower); this.audio.click(); return; }
    const unit = this.pickAt(t.wx, t.wy);
    if (unit) { this.select(unit); this.audio.click(); return; }
    this.select(null);
  };

  App.prototype.onRightClick = function (sx, sy) {
    if (this.buildDef) { this.cancelBuild(); return; }
    const t = this.pointerTile(sx, sy);
    if (this.game.hero && !this.game.hero.dead) {
      this.game.hero.order(t.wx, t.wy);
      this.game.fx.ring(t.wx, t.wy, 0.05, 0.15, 0.7, '#7ee08a', 0.4);
      this.audio.click();
    }
  };

  App.prototype.onKey = function (e) {
    const k = e.key;
    if (k === 'Escape') {
      if (this.menus.isOpen()) { if (this.menus.current !== 'main' && this.menus.current !== 'over') this.menus.close(); }
      else if (this.buildDef) this.cancelBuild();
      else if (this.selection) this.select(null);
      else this.menus.open('pause');
      return true;
    }
    if (this.menus.isOpen()) return false;
    if (k === ' ') { this.togglePause(); return true; }
    if (k === '+' || k === '=') { this.cycleSpeed(); return true; }
    if (k === '-') {
      const list = NS.Config.speeds;
      this.speed = list[Math.max(0, list.indexOf(this.speed) - 1)];
      this.syncSpeedButtons();
      return true;
    }
    if (k >= '1' && k <= '4' && this.card.mode === 'root' && !this.selection) {
      this.card.setMode('race:' + NS.TowerData.RACES[Number(k) - 1].id);
      return true;
    }
    if (k === 'h' || k === 'H') {
      if (this.game.hero) { this.select(this.game.hero); this.cam.centerOn(this.game.hero.x, this.game.hero.y); }
      return true;
    }
    if (/^[a-zA-Z]$/.test(k)) {
      // camera keys are handled by Input.update; only claim keys the card owns
      const owned = NS.CommandCard.HOTKEYS.indexOf(k.toUpperCase()) !== -1;
      const cameraKey = 'wasd'.indexOf(k.toLowerCase()) !== -1;
      if (owned && !(cameraKey && !this.card.slots[NS.CommandCard.HOTKEYS.indexOf(k.toUpperCase())])) {
        return this.card.hotkey(k);
      }
    }
    return false;
  };

  /* ---------------------------------------------------------------- frame */

  App.prototype.update = function (dt) {
    if (this.paused || this.menuPaused) return;
    const scaled = dt * this.speed;
    // keep the fixed step honest by running extra sub-steps at higher speeds
    const steps = this.speed > 1 ? Math.ceil(this.speed) : 1;
    for (let i = 0; i < steps; i++) this.game.update(scaled / steps);
  };

  App.prototype.render = function (dt) {
    this.input.update(dt);
    this.renderer.selection = this.selection;
    this.renderer.buildDef = this.buildDef;
    this.renderer.draw();
    this.hud.update(dt);
    this.minimap.draw();
    this.uiTick = (this.uiTick || 0) + dt;
    if (this.uiTick > 0.25) { this.uiTick = 0; this.card.refresh(); }
    doc.getElementById('fps').textContent = this.loop.fps + ' FPS';
  };

  root.addEventListener('DOMContentLoaded', function () {
    NS.I18n.set('zh');
    const app = new App();
    NS.app = app;
    app.applyStrings();
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
