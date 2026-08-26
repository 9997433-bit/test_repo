/* Main menu, pause, settings, help and the victory / defeat screens. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});
  const doc = root.document;
  function T(k, v) { return NS.I18n.t(k, v); }
  const STORE_KEY = 'emberholdTD.best';

  function Menus(app) {
    this.app = app;
    this.el = doc.getElementById('overlay');
    this.current = null;
    this.choice = { difficulty: 'normal', hero: 'paladin' };
    const self = this;
    this.el.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      self.onAction(btn.dataset.act, btn.dataset.val, btn);
    });
  }

  Menus.prototype.best = function () {
    try { return JSON.parse(root.localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { return null; }
  };
  Menus.prototype.saveBest = function (rec) {
    const cur = this.best();
    if (cur && (cur.wave > rec.wave || (cur.wave === rec.wave && cur.lives >= rec.lives))) return;
    try { root.localStorage.setItem(STORE_KEY, JSON.stringify(rec)); } catch (e) { /* private mode */ }
  };

  Menus.prototype.open = function (which) {
    this.current = which;
    this.el.className = 'show';
    this.el.innerHTML = this['render_' + which]();
    if (which !== 'main') this.app.setPaused(true, true);
  };

  Menus.prototype.close = function () {
    this.current = null;
    this.el.className = '';
    this.el.innerHTML = '';
    this.app.setPaused(false, true);
  };

  Menus.prototype.isOpen = function () { return !!this.current; };

  // ------------------------------------------------------------- screens
  Menus.prototype.render_main = function () {
    const b = this.best();
    const diffs = ['easy', 'normal', 'hard', 'insane'];
    const self = this;
    return '<div class="panel-frame menu main-menu">' +
      '<h1>' + T('title') + '</h1>' +
      '<p class="sub">' + T('subtitle') + '</p>' +
      '<div class="menu-section"><h2>' + T('difficulty') + '</h2><div class="chips">' +
      diffs.map(function (d) {
        return '<button class="chip-btn' + (self.choice.difficulty === d ? ' on' : '') +
          '" data-act="difficulty" data-val="' + d + '">' + T(d) + '</button>';
      }).join('') + '</div></div>' +
      '<div class="menu-section"><h2>' + T('chooseHero') + '</h2><div class="heroes">' +
      NS.HeroData.HEROES.map(function (h) {
        return '<button class="hero-btn' + (self.choice.hero === h.id ? ' on' : '') +
          '" data-act="hero" data-val="' + h.id + '">' +
          '<img src="' + NS.Icons.iconUrl(h.icon, 48, 'hero') + '" alt="">' +
          '<b>' + NS.I18n.name(h.name) + '</b><i>' + NS.I18n.name(h.title) + '</i></button>';
      }).join('') +
      '<button class="hero-btn' + (self.choice.hero === null ? ' on' : '') + '" data-act="hero" data-val="none">' +
      '<img src="' + NS.Icons.iconUrl('cancel', 48, 'action') + '" alt=""><b>' + T('noHero') + '</b><i>—</i></button>' +
      '</div></div>' +
      '<div class="menu-section row"><h2>' + T('language') + '</h2><div class="chips">' +
      '<button class="chip-btn' + (NS.I18n.lang === 'zh' ? ' on' : '') + '" data-act="lang" data-val="zh">中文</button>' +
      '<button class="chip-btn' + (NS.I18n.lang === 'en' ? ' on' : '') + '" data-act="lang" data-val="en">English</button>' +
      '</div></div>' +
      '<div class="best">' + T('highScore') + ': ' +
      (b ? T('record', { diff: T(b.difficulty), wave: b.wave, lives: b.lives }) : T('noRecord')) + '</div>' +
      '<button class="big-btn" data-act="start">' + T('start') + '</button>' +
      '<div class="menu-foot">' + T('hint1') + '<br>' + T('hint2') + '<br>' + T('hint3') + '</div>' +
      '</div>';
  };

  Menus.prototype.render_pause = function () {
    return '<div class="panel-frame menu">' +
      '<h1>' + T('pause') + '</h1>' +
      '<button class="big-btn" data-act="resume">' + T('resume') + '</button>' +
      '<button class="big-btn" data-act="settings">' + T('settings') + '</button>' +
      '<button class="big-btn" data-act="help">' + T('help') + '</button>' +
      '<button class="big-btn danger" data-act="restart">' + T('restart') + '</button>' +
      '<button class="big-btn danger" data-act="surrender">' + T('surrender') + '</button>' +
      '</div>';
  };

  Menus.prototype.render_settings = function () {
    const app = this.app;
    return '<div class="panel-frame menu">' +
      '<h1>' + T('settings') + '</h1>' +
      '<label class="opt"><span>' + T('volume') + '</span>' +
      '<input type="range" min="0" max="100" value="' + Math.round(app.audio.volume * 100) + '" data-act="vol"></label>' +
      '<label class="opt"><span>' + T('sfx') + '</span>' +
      '<input type="range" min="0" max="100" value="' + Math.round(app.audio.sfxVolume * 100) + '" data-act="sfx"></label>' +
      '<label class="opt"><span>' + T('showRange') + '</span>' +
      '<input type="checkbox" data-act="range"' + (app.renderer.showRange ? ' checked' : '') + '></label>' +
      '<label class="opt"><span>' + T('showDamage') + '</span>' +
      '<input type="checkbox" data-act="dmgnum"' + (app.game.showDamageNumbers !== false ? ' checked' : '') + '></label>' +
      '<label class="opt"><span>' + T('language') + '</span><span class="chips">' +
      '<button class="chip-btn' + (NS.I18n.lang === 'zh' ? ' on' : '') + '" data-act="lang" data-val="zh">中文</button>' +
      '<button class="chip-btn' + (NS.I18n.lang === 'en' ? ' on' : '') + '" data-act="lang" data-val="en">EN</button>' +
      '</span></label>' +
      '<button class="big-btn" data-act="close">' + T('close') + '</button>' +
      '</div>';
  };

  Menus.prototype.render_help = function () {
    const body = T('helpBody');
    return '<div class="panel-frame menu">' +
      '<h1>' + T('help') + '</h1>' +
      '<div class="help-body">' + (Array.isArray(body) ? body.join('<br>') : body) + '</div>' +
      '<div class="help-body dim">' + T('hint1') + '<br>' + T('hint2') + '<br>' + T('hint3') + '</div>' +
      '<button class="big-btn" data-act="close">' + T('close') + '</button>' +
      '</div>';
  };

  Menus.prototype.render_over = function () {
    const g = this.app.game;
    const win = g.status === 'victory';
    const s = g.stats;
    return '<div class="panel-frame menu ' + (win ? 'win' : 'lose') + '">' +
      '<h1>' + T(win ? 'victory' : 'defeat') + '</h1>' +
      '<p class="sub">' + T(win ? 'victoryText' : 'defeatText') + '</p>' +
      '<div class="report"><h2>' + T('statsTitle') + '</h2>' +
      '<div class="report-grid">' +
      '<span>' + T('statWaves') + '<b>' + s.wavesCleared + ' / ' + NS.WaveData.count + '</b></span>' +
      '<span>' + T('statKills') + '<b>' + s.kills + '</b></span>' +
      '<span>' + T('statLeaks') + '<b>' + s.leaks + '</b></span>' +
      '<span>' + T('statGold') + '<b>' + Math.round(s.goldEarned) + '</b></span>' +
      '<span>' + T('statDamage') + '<b>' + Math.round(s.damage).toLocaleString() + '</b></span>' +
      '<span>' + T('statBuilt') + '<b>' + s.built + '</b></span>' +
      '</div></div>' +
      '<button class="big-btn" data-act="again">' + T('playAgain') + '</button>' +
      '</div>';
  };

  // -------------------------------------------------------------- actions
  Menus.prototype.onAction = function (act, val, btn) {
    const app = this.app;
    app.audio.resume();
    app.audio.click();
    switch (act) {
      case 'difficulty': this.choice.difficulty = val; this.open('main'); break;
      case 'hero': this.choice.hero = val === 'none' ? null : val; this.open('main'); break;
      case 'lang':
        NS.I18n.set(val);
        if (this.current) this.open(this.current);
        app.onLanguageChange();
        break;
      case 'start':
        this.el.className = ''; this.el.innerHTML = ''; this.current = null;
        app.newGame(this.choice.difficulty, this.choice.hero);
        break;
      case 'resume': case 'close': this.close(); break;
      case 'settings': this.open('settings'); break;
      case 'help': this.open('help'); break;
      case 'restart':
        this.el.className = ''; this.current = null;
        app.newGame(app.game.diffKey, app.game.hero ? app.game.hero.def.id : null);
        break;
      case 'surrender': app.game.defeat(); this.open('over'); break;
      case 'again': this.open('main'); break;
      case 'vol': app.audio.setVolume(Number(btn.value) / 100); break;
      case 'sfx': app.audio.setSfx(Number(btn.value) / 100); break;
      case 'range': app.renderer.showRange = btn.checked; break;
      case 'dmgnum': app.game.showDamageNumbers = btn.checked; break;
      default: break;
    }
  };

  Menus.prototype.showResult = function () {
    const g = this.app.game;
    this.saveBest({ difficulty: g.diffKey, wave: g.stats.wavesCleared, lives: g.lives });
    this.current = 'over';
    this.el.className = 'show';
    this.el.innerHTML = this.render_over();
  };

  NS.Menus = Menus;
})(typeof globalThis !== 'undefined' ? globalThis : this);
