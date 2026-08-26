/*
 * The RTS console: resource bar, wave preview, quest log strip,
 * portrait frame and the unit statistics panel.
 */
(function (global) {
  'use strict';

  var I18N = global.WC3.I18N;
  var Config = global.WC3.Config;
  var Sprites = global.WC3.Sprites;
  var Damage = global.WC3.Damage;
  var CommandCard = global.WC3.CommandCard;

  function $(id) { return document.getElementById(id); }
  function t(k, p) { return I18N.t(k, p); }

  function Hud(app) {
    this.app = app;
    this.el = {
      gold: $('val-gold'), lumber: $('val-lumber'), lives: $('val-lives'), time: $('val-time'),
      resGold: $('res-gold'), resLumber: $('res-lumber'), resLives: $('res-lives'),
      waveNow: $('wave-now'), waveMax: $('wave-max'), waveNext: $('wave-next'),
      call: $('btn-call'), callTimer: $('call-timer'),
      log: $('logstrip'), fps: $('fpsbox'),
      portrait: $('portrait'), selName: $('sel-name'), selSub: $('sel-sub'),
      selHp: $('sel-hp'), selHpText: $('sel-hp-text'),
      manaWrap: $('sel-mana-wrap'), selMana: $('sel-mana'), selManaText: $('sel-mana-text'),
      statGrid: $('stat-grid'), statDesc: $('stat-desc')
    };
    this.pctx = this.el.portrait.getContext('2d');
    this.last = {};
    this.portraitTime = 0;
    this.el.waveMax.textContent = String(global.WC3.WaveData.TOTAL_WAVES);
    this.applyStaticStrings();
  }

  Hud.prototype.applyStaticStrings = function () {
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute('data-i18n'));
    }
  };

  Hud.prototype.flash = function (el) {
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  };

  Hud.prototype.update = function (dtReal) {
    var game = this.app.game;
    this.portraitTime += dtReal;

    var gold = Math.floor(game.gold);
    if (gold !== this.last.gold) {
      this.el.gold.textContent = String(gold);
      if (this.last.gold !== undefined && gold > this.last.gold) this.flash(this.el.resGold);
      this.last.gold = gold;
    }
    if (game.lumber !== this.last.lumber) {
      this.el.lumber.textContent = String(game.lumber);
      if (this.last.lumber !== undefined) this.flash(this.el.resLumber);
      this.last.lumber = game.lumber;
    }
    if (game.lives !== this.last.lives) {
      this.el.lives.textContent = game.lives + '/' + game.maxLives;
      if (this.last.lives !== undefined) this.flash(this.el.resLives);
      this.last.lives = game.lives;
    }
    var secs = Math.floor(game.time);
    if (secs !== this.last.time) {
      this.el.time.textContent = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
      this.last.time = secs;
    }
    if (game.waveIndex !== this.last.wave) {
      this.el.waveNow.textContent = String(game.waveIndex);
      this.last.wave = game.waveIndex;
      this.renderWavePreview();
    }

    var callable = game.canCallWave();
    this.el.call.disabled = !callable;
    if (game.waveState === 'prep' && game.state === 'playing') {
      this.el.callTimer.textContent = '(' + Math.max(0, Math.ceil(game.autoTimer)) + 's)';
    } else {
      this.el.callTimer.textContent = '';
    }

    this.drainLog();
    this.renderSelection();
  };

  Hud.prototype.renderWavePreview = function () {
    var game = this.app.game;
    var wave = game.nextWavePreview();
    if (!wave) { this.el.waveNext.textContent = ''; return; }
    var parts = wave.entries.map(function (e) {
      var tags = [];
      tags.push(I18N.armor(e.def.armor));
      if (e.def.flying) tags.push(t('flying'));
      if (e.def.spellImmune) tags.push(t('spellImmune'));
      return e.count + '× ' + I18N.name(e.def) + ' [' + tags.join('/') + ']';
    });
    this.el.waveNext.textContent = (wave.boss ? '⚔ ' : '') + parts.join(' · ');
    this.el.waveNext.title = this.el.waveNext.textContent;
  };

  Hud.prototype.drainLog = function () {
    var entries = this.app.game.drainLog();
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      var div = document.createElement('div');
      div.textContent = t(e.key, e.params);
      if (e.key === 'logBoss') div.className = 'boss';
      else if (e.key === 'logLeak' || e.key === 'logDefeat') div.className = 'bad';
      else if (e.key === 'logInterest' || e.key === 'logLumber' ||
        e.key === 'logVictory' || e.key === 'logEarly') div.className = 'good';
      this.el.log.appendChild(div);
      setTimeout(function (node) {
        return function () { if (node.parentNode) node.parentNode.removeChild(node); };
      }(div), 12000);
    }
    while (this.el.log.childNodes.length > 8) {
      this.el.log.removeChild(this.el.log.firstChild);
    }
  };

  Hud.prototype.showError = function (key) {
    this.showMessage(t(key), 2600);
  };

  /** Put a literal (already-localised) line on the log strip. */
  Hud.prototype.showMessage = function (text, ttl) {
    var div = document.createElement('div');
    div.className = 'bad';
    div.textContent = text;
    this.el.log.appendChild(div);
    setTimeout(function () { if (div.parentNode) div.parentNode.removeChild(div); }, ttl || 2600);
  };

  // ------------------------------------------------------------ selection

  Hud.prototype.renderSelection = function () {
    var sel = this.app.selected;
    var game = this.app.game;
    if (sel && !sel.alive) { this.app.select(null); sel = null; }

    if (!sel) {
      this.el.selName.textContent = t('title');
      this.el.selSub.textContent = t('wave') + ' ' + game.waveIndex + '/' + game.totalWaves;
      this.setBar(this.el.selHp, this.el.selHpText, game.lives, game.maxLives, t('lives'));
      this.el.manaWrap.classList.add('hidden');
      this.renderKeepStats();
      this.drawPortrait(null);
      return;
    }

    if (sel.def && sel.def.tier) return this.renderTower(sel);
    if (sel.def && sel.def.armor !== undefined) return this.renderCreep(sel);
    return this.renderHero(sel);
  };

  Hud.prototype.setBar = function (bar, text, value, max, label) {
    var pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
    bar.style.width = (pct * 100).toFixed(1) + '%';
    text.textContent = (label ? label + '  ' : '') + Math.ceil(value) + ' / ' + Math.ceil(max);
  };

  Hud.prototype.rows = function (list) {
    var html = '';
    for (var i = 0; i < list.length; i++) {
      html += '<div class="row"><span class="k">' + list[i][0] + '</span><span class="v ' +
        (list[i][2] || '') + '">' + list[i][1] + '</span></div>';
    }
    this.el.statGrid.innerHTML = html;
  };

  Hud.prototype.renderKeepStats = function () {
    var game = this.app.game;
    this.rows([
      [t('kills'), game.stats.kills],
      [t('statsLeaks'), game.stats.leaks],
      [t('statsGold'), Math.round(game.stats.goldEarned)],
      [t('towersBuilt'), game.towers.length],
      [t('creeps'), game.creeps.length],
      ['Interest', Math.round(game.interestRate() * 100) + '%']
    ]);
    this.el.statDesc.textContent = t('howtoBody');
  };

  Hud.prototype.renderTower = function (tw) {
    var def = tw.def;
    this.el.selName.textContent = I18N.name(def);
    this.el.selSub.textContent = t('level') + ' ' + def.tier + ' · ' + I18N.name(
      global.WC3.TowerData.RACES.filter(function (r) { return r.id === def.race; })[0]);
    this.setBar(this.el.selHp, this.el.selHpText, 1, 1, '');
    this.el.selHp.style.width = '100%';
    this.el.selHpText.textContent = t('kills') + ' ' + tw.kills;
    this.el.manaWrap.classList.add('hidden');
    this.rows([
      [t('damage'), def.dmgMin + '–' + def.dmgMax],
      [t('dps'), Math.round(def.dps)],
      [t('attackType'), I18N.attack(def.attackType)],
      [t('range'), def.range],
      [t('attackSpeed'), def.cooldown.toFixed(2) + 's'],
      [t('flying'), def.targetsAir ? '✓' : '✕', def.targetsAir ? 'pos' : 'neg'],
      [t('kills'), tw.kills],
      [t('invested'), Math.round(tw.investedGold)],
      [t('sellFor'), tw.sellValue(Config.SELL_RATE)],
      [t('targetMode'), t('t' + tw.mode.charAt(0).toUpperCase() + tw.mode.slice(1))]
    ]);
    var eff = CommandCard.effectText(def.effect);
    this.el.statDesc.innerHTML = I18N.desc(def) + (eff ? ' <b>' + eff + '</b>' : '');
    this.drawPortrait(tw);
  };

  Hud.prototype.renderCreep = function (c) {
    this.el.selName.textContent = I18N.name(c.def) + (c.boss ? ' ★' : '');
    this.el.selSub.textContent = t('wave') + ' ' + c.wave + ' · ' + I18N.armor(c.armorType);
    this.setBar(this.el.selHp, this.el.selHpText, c.hp, c.hpMax, '');
    this.el.manaWrap.classList.add('hidden');
    var rows = [
      [t('hp'), Math.ceil(c.hp) + ' / ' + c.hpMax],
      [t('armorType'), I18N.armor(c.armorType)],
      [t('armor'), c.armorValue],
      [t('speed'), Math.round(c.currentSpeed()), c.slowFactor < 1 ? 'neg' : ''],
      [t('bounty'), c.bounty],
      [t('flying'), c.flying ? '✓' : '✕'],
      [t('spellImmune'), c.spellImmune ? '✓' : '✕'],
      ['Progress', Math.round(c.progress() * 100) + '%']
    ];
    this.rows(rows);
    var html = '<b>' + t('armorType') + ': ' + I18N.armor(c.armorType) + '</b> — ';
    html += Damage.ATTACK_TYPES.slice(0, 5).map(function (atk) {
      var f = Damage.factor(atk, c.armorType);
      var cls = f > 1.001 ? 'mult-good' : (f < 0.999 ? 'mult-bad' : '');
      return '<span class="' + cls + '">' + I18N.attack(atk) + ' ×' + f.toFixed(2) + '</span>';
    }).join(' · ');
    this.el.statDesc.innerHTML = html;
    this.drawPortrait(c);
  };

  Hud.prototype.renderHero = function (h) {
    var st = h.stats();
    this.el.selName.textContent = I18N.name(h.def);
    this.el.selSub.textContent = t('level') + ' ' + h.level + ' · ' + t('hero');
    this.el.selHp.style.width = '100%';
    this.el.selHpText.textContent = t('kills') + ' ' + h.kills + ' · XP ' + h.xp + '/' + h.xpNext;
    this.el.manaWrap.classList.remove('hidden');
    this.setBar(this.el.selMana, this.el.selManaText, h.mana, h.manaMax, t('mana'));
    this.rows([
      [t('level'), h.level],
      [t('damage'), Math.round(st.dmgMin) + '–' + Math.round(st.dmgMax)],
      [t('attackType'), I18N.attack(h.def.attackType)],
      [t('range'), st.range],
      [t('attackSpeed'), st.cooldown.toFixed(2) + 's'],
      [t('speed'), st.speed],
      [t('kills'), h.kills],
      ['DMG', Math.round(h.damageDealt)]
    ]);
    this.el.statDesc.textContent = t('heroMove') + ' — Q/W ' + t('effect');
    this.drawPortrait(h);
  };

  Hud.prototype.drawPortrait = function (sel) {
    var ctx = this.pctx;
    var w = this.el.portrait.width;
    var h = this.el.portrait.height;
    ctx.clearRect(0, 0, w, h);
    var g = ctx.createRadialGradient(w / 2, h * 0.3, 4, w / 2, h * 0.5, h * 0.8);
    g.addColorStop(0, '#3c4a56');
    g.addColorStop(1, '#0e120e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    var time = this.portraitTime;
    if (!sel) {
      Sprites.drawKeep(ctx, w / 2, h * 0.95, 0.62, time, 0.75);
      return;
    }
    if (sel.def && sel.def.tier) {
      Sprites.drawTower(ctx, sel, w / 2, h * 0.95, 1.05, time, 0.75);
    } else if (sel.def && sel.def.armor !== undefined) {
      Sprites.drawCreep(ctx, sel, w / 2, h * 0.82, 2.1, time, 0.75, { showBars: false });
    } else {
      Sprites.drawHero(ctx, sel, w / 2, h * 0.9, 1.5, time, 0.75);
    }
  };

  Hud.prototype.setFps = function (text) {
    this.el.fps.textContent = text;
  };

  global.WC3.Hud = Hud;
})(typeof globalThis !== 'undefined' ? globalThis : this);
