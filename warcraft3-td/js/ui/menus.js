/*
 * Modal screens: campaign setup, pause, settings and the victory / defeat
 * cinematic panel. Also owns the localStorage high-score record.
 */
(function (global) {
  'use strict';

  var I18N = global.WC3.I18N;
  var Config = global.WC3.Config;
  var Hero = global.WC3.Hero;
  var Audio = global.WC3.Audio;

  function t(k, p) { return I18N.t(k, p); }

  var Storage = {
    load: function () {
      try {
        return JSON.parse(global.localStorage.getItem(Config.STORAGE_KEY) || '{}') || {};
      } catch (e) { return {}; }
    },
    save: function (data) {
      try { global.localStorage.setItem(Config.STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
    }
  };

  function Menus(app) {
    this.app = app;
    this.wrap = document.getElementById('modal');
    this.card = document.getElementById('modal-card');
    this.open = false;
  }

  Menus.prototype.hide = function () {
    this.open = false;
    this.wrap.classList.remove('show');
    this.card.innerHTML = '';
  };

  Menus.prototype.show = function (html, wire) {
    this.open = true;
    this.card.innerHTML = html;
    this.wrap.classList.add('show');
    if (wire) wire(this.card);
  };

  // ------------------------------------------------------------- start

  Menus.prototype.showStart = function () {
    var app = this.app;
    var self = this;
    var best = Storage.load().best;
    var diffs = ['easy', 'normal', 'hard', 'insane'];
    var heroes = ['paladin', 'blademaster', 'demonhunter', 'deathknight'];
    var heroKey = {
      paladin: 'heroPaladin', blademaster: 'heroBlademaster',
      demonhunter: 'heroDemonHunter', deathknight: 'heroDeathKnight'
    };

    var html = '<h1>' + t('title') + '</h1><p class="sub">' + t('subtitle') + '</p>';
    html += '<h2>' + t('difficulty') + '</h2><div class="opt-row" id="pick-diff">';
    diffs.forEach(function (d) {
      var cfg = Config.DIFFICULTY[d];
      html += '<button class="opt' + (d === app.settings.difficulty ? ' sel' : '') +
        '" data-v="' + d + '"><b>' + t(d) + '</b><small>' +
        cfg.gold + ' ' + t('gold') + ' · ' + cfg.lives + ' ' + t('lives') +
        ' · HP ×' + cfg.hp.toFixed(2) + '</small></button>';
    });
    html += '</div>';

    html += '<h2>' + t('pickHero') + '</h2><div class="opt-row" id="pick-hero">';
    heroes.forEach(function (h) {
      var def = Hero.HEROES[h];
      html += '<button class="opt' + (h === app.settings.hero ? ' sel' : '') +
        '" data-v="' + h + '"><b>' + t(heroKey[h]) + '</b><small>' +
        def.dmgMin + '–' + def.dmgMax + ' · ' + t('range') + ' ' + def.range + '</small></button>';
    });
    html += '<button class="opt' + (app.settings.hero === 'none' ? ' sel' : '') +
      '" data-v="none"><b>' + t('off') + '</b><small>' + t('hero') + ' ✕</small></button>';
    html += '</div>';

    html += '<h2>' + t('howto') + '</h2><p class="sub">' + t('howtoBody') + '</p>';
    if (best) {
      html += '<p class="sub">' + t('statsBest') + ': ' + t(best.difficulty) + ' · ' +
        t('statsWaves') + ' ' + best.waves + ' · ' + t('statsKills') + ' ' + best.kills + '</p>';
    }
    html += '<div class="modal-actions">' +
      '<button class="bigbtn ghost" id="lang-toggle">' + (I18N.lang === 'zh' ? 'English' : '中文') + '</button>' +
      '<button class="bigbtn" id="start-go">' + t('startGame') + '</button></div>';

    this.show(html, function (card) {
      wirePick(card.querySelector('#pick-diff'), function (v) { app.settings.difficulty = v; });
      wirePick(card.querySelector('#pick-hero'), function (v) { app.settings.hero = v; });
      card.querySelector('#lang-toggle').addEventListener('click', function () {
        I18N.setLang(I18N.lang === 'zh' ? 'en' : 'zh');
        app.onLanguageChange();
        self.showStart();
      });
      card.querySelector('#start-go').addEventListener('click', function () {
        Audio.unlock();
        Audio.play('click');
        self.hide();
        app.startRun();
      });
    });
  };

  function wirePick(container, onPick) {
    if (!container) return;
    container.addEventListener('click', function (ev) {
      var btn = ev.target.closest('button[data-v]');
      if (!btn) return;
      var sibs = container.querySelectorAll('button');
      for (var i = 0; i < sibs.length; i++) sibs[i].classList.remove('sel');
      btn.classList.add('sel');
      Audio.play('click');
      onPick(btn.dataset.v);
    });
  }

  // ------------------------------------------------------------- pause

  Menus.prototype.showPause = function () {
    var app = this.app;
    var self = this;
    var html = '<h1>' + t('menu') + '</h1>';
    html += '<div class="stat-lines">' +
      t('wave') + ': <b>' + app.game.waveIndex + '/' + app.game.totalWaves + '</b><br>' +
      t('lives') + ': <b>' + app.game.lives + '</b><br>' +
      t('statsKills') + ': <b>' + app.game.stats.kills + '</b><br>' +
      t('statsGold') + ': <b>' + Math.round(app.game.stats.goldEarned) + '</b></div>';
    html += '<div class="modal-actions">' +
      '<button class="bigbtn ghost" id="m-settings">' + t('settings') + '</button>' +
      '<button class="bigbtn ghost" id="m-restart">' + t('restart') + '</button>' +
      '<button class="bigbtn ghost" id="m-quit">' + t('quit') + '</button>' +
      '<button class="bigbtn" id="m-resume">' + t('resumeGame') + '</button></div>';
    this.show(html, function (card) {
      card.querySelector('#m-resume').addEventListener('click', function () {
        self.hide();
        app.setPaused(false);
      });
      card.querySelector('#m-settings').addEventListener('click', function () { self.showSettings(); });
      card.querySelector('#m-restart').addEventListener('click', function () {
        self.hide();
        app.startRun();
      });
      card.querySelector('#m-quit').addEventListener('click', function () { self.showStart(); });
    });
  };

  // ---------------------------------------------------------- settings

  Menus.prototype.showSettings = function () {
    var app = this.app;
    var self = this;
    var s = app.settings;
    var html = '<h1>' + t('settings') + '</h1><div class="settings-grid">';
    html += '<label>' + t('setLanguage') + '</label><div>' +
      '<button class="toggle' + (I18N.lang === 'zh' ? ' on' : '') + '" data-lang="zh">中文</button> ' +
      '<button class="toggle' + (I18N.lang === 'en' ? ' on' : '') + '" data-lang="en">English</button></div>';
    html += '<label>' + t('setMaster') + '</label>' +
      '<input type="range" id="s-master" min="0" max="100" value="' + Math.round(s.master * 100) + '">';
    html += '<label>' + t('setSfx') + '</label>' +
      '<input type="range" id="s-sfx" min="0" max="100" value="' + Math.round(s.sfx * 100) + '">';
    html += '<label>' + t('setDamageText') + '</label><div><button class="toggle' +
      (s.damageText ? ' on' : '') + '" id="s-dmg">' + (s.damageText ? t('on') : t('off')) + '</button></div>';
    html += '<label>' + t('setRange') + '</label><div><button class="toggle' +
      (s.showRanges ? ' on' : '') + '" id="s-range">' + (s.showRanges ? t('on') : t('off')) + '</button></div>';
    html += '<label>' + t('setFps') + '</label><div><button class="toggle' +
      (s.showFps ? ' on' : '') + '" id="s-fps">' + (s.showFps ? t('on') : t('off')) + '</button></div>';
    html += '</div><div class="modal-actions">' +
      '<button class="bigbtn" id="s-close">' + t('close') + '</button></div>';

    this.show(html, function (card) {
      card.addEventListener('click', function (ev) {
        var b = ev.target.closest('button[data-lang]');
        if (!b) return;
        I18N.setLang(b.dataset.lang);
        app.onLanguageChange();
        self.showSettings();
      });
      card.querySelector('#s-master').addEventListener('input', function () {
        s.master = this.value / 100;
        Audio.setMaster(s.master);
        app.saveSettings();
      });
      card.querySelector('#s-sfx').addEventListener('input', function () {
        s.sfx = this.value / 100;
        Audio.setSfx(s.sfx);
        app.saveSettings();
      });
      function toggle(id, key, after) {
        card.querySelector(id).addEventListener('click', function () {
          s[key] = !s[key];
          this.classList.toggle('on', s[key]);
          this.textContent = s[key] ? t('on') : t('off');
          app.saveSettings();
          if (after) after();
        });
      }
      toggle('#s-dmg', 'damageText', function () { app.applySettings(); });
      toggle('#s-range', 'showRanges', function () { app.applySettings(); });
      toggle('#s-fps', 'showFps', function () { app.applySettings(); });
      card.querySelector('#s-close').addEventListener('click', function () {
        if (app.game && app.started) self.showPause(); else self.showStart();
      });
    });
  };

  // ------------------------------------------------------------ ending

  Menus.prototype.showEnd = function (result) {
    var app = this.app;
    var self = this;
    var g = app.game;
    var win = result === 'victory';

    var record = Storage.load();
    var entry = {
      difficulty: app.settings.difficulty,
      waves: g.wavesCleared,
      kills: g.stats.kills,
      lives: g.lives,
      gold: Math.round(g.stats.goldEarned),
      win: win
    };
    if (!record.best || entry.waves > record.best.waves ||
      (entry.waves === record.best.waves && entry.lives > record.best.lives)) {
      record.best = entry;
    }
    record.last = entry;
    Storage.save(record);

    var html = '<h1>' + (win ? '★ ' + t('victory') : t('defeat')) + '</h1>';
    html += '<p class="sub">' + (win ? t('victoryBody') : t('defeatBody')) + '</p>';
    html += '<div class="stat-lines">' +
      t('statsWaves') + ': <b>' + g.wavesCleared + ' / ' + g.totalWaves + '</b><br>' +
      t('statsKills') + ': <b>' + g.stats.kills + '</b><br>' +
      t('statsLeaks') + ': <b>' + g.stats.leaks + '</b><br>' +
      t('statsGold') + ': <b>' + Math.round(g.stats.goldEarned) + '</b><br>' +
      t('lives') + ': <b>' + g.lives + ' / ' + g.maxLives + '</b><br>' +
      t('difficulty') + ': <b>' + t(app.settings.difficulty) + '</b></div>';
    if (record.best) {
      html += '<p class="sub">' + t('statsBest') + ': ' + t(record.best.difficulty) + ' · ' +
        record.best.waves + ' ' + t('statsWaves') + '</p>';
    }
    html += '<div class="modal-actions">' +
      '<button class="bigbtn ghost" id="e-menu">' + t('quit') + '</button>' +
      '<button class="bigbtn" id="e-again">' + t('playAgain') + '</button></div>';

    this.show(html, function (card) {
      card.querySelector('#e-again').addEventListener('click', function () {
        self.hide();
        app.startRun();
      });
      card.querySelector('#e-menu').addEventListener('click', function () { self.showStart(); });
    });
  };

  Menus.Storage = Storage;
  global.WC3.Menus = Menus;
})(typeof globalThis !== 'undefined' ? globalThis : this);
