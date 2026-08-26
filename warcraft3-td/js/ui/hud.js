/* Resource bar, message log, portrait frame and the WC3-style stat block. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});
  const doc = root.document;

  function el(id) { return doc.getElementById(id); }
  function T(k, v) { return NS.I18n.t(k, v); }

  function Hud(app) {
    this.app = app;
    this.logEl = el('logstrip');
    this.portrait = el('portrait-canvas');
    this.pctx = this.portrait.getContext('2d');
    this.lastSel = undefined;
    this.lastRefresh = 0;
    this.messages = [];
    this.portraitTime = 0;
  }

  Hud.prototype.pushLog = function (text, cls) {
    const line = doc.createElement('div');
    line.className = 'log-line ' + (cls || '');
    line.textContent = text;
    this.logEl.appendChild(line);
    while (this.logEl.children.length > 7) this.logEl.removeChild(this.logEl.firstChild);
    setTimeout(function () { line.classList.add('fade'); }, 6500);
    setTimeout(function () { if (line.parentNode) line.parentNode.removeChild(line); }, 8000);
  };

  Hud.prototype.onGameLog = function (kind, d) {
    const names = (d.types || []).map((ty) => NS.I18n.name(NS.CreepData.TYPES[ty].name)).join(' / ');
    switch (kind) {
      case 'wave_start':
        this.pushLog(T('waveIncoming', { n: d.wave, types: names }), d.boss ? 'boss' : 'wave');
        break;
      case 'wave_clear': this.pushLog(T('waveCleared', { n: d.wave, bonus: d.bonus }), 'good'); break;
      case 'leak': this.pushLog(T('leaked', { name: NS.I18n.name(d.name) }), 'bad'); break;
      case 'interest': this.pushLog(T('interestPaid', { n: d.gain }), 'gold'); break;
      case 'lumber': this.pushLog(T('lumberGained', { n: d.amount }), 'good'); break;
      case 'early': this.pushLog(T('earlyBonus', { n: d.bonus }), 'gold'); break;
      case 'hero_level': this.pushLog(T('heroLevel', { level: d.level }), 'good'); break;
      case 'hero_death': this.pushLog(T('heroDown'), 'bad'); break;
      case 'hero_revive': this.pushLog(T('heroRevive'), 'good'); break;
      default: break;
    }
  };

  Hud.prototype.update = function (dt) {
    const app = this.app, game = app.game;
    this.portraitTime += dt;

    el('res-gold').textContent = Math.floor(game.gold);
    el('res-lumber').textContent = game.lumber;
    el('res-lives').textContent = game.lives + '/' + game.maxLives;
    el('res-interest').textContent = Math.round(game.interestRate * 100) + '%';

    const mm = Math.floor(game.time / 60), ss = Math.floor(game.time % 60);
    el('res-time').textContent = mm + ':' + (ss < 10 ? '0' : '') + ss;
    el('wave-number').textContent = Math.max(1, game.wave) + ' / ' + NS.WaveData.count;

    const nextBtn = el('btn-next-wave');
    if (game.waveState === 'spawning') {
      nextBtn.disabled = true;
      nextBtn.textContent = T('nextWave');
    } else if (game.status === 'playing') {
      nextBtn.disabled = false;
      nextBtn.textContent = T('nextWave') + ' (' + Math.max(0, Math.ceil(game.waveTimer)) + 's)';
    } else {
      nextBtn.disabled = true;
    }

    const preview = NS.WaveData.preview(Math.min(NS.WaveData.count, game.wave + (game.waveState === 'spawning' ? 0 : 1)));
    el('wave-preview').innerHTML = preview.map(function (ty) {
      const t = NS.CreepData.TYPES[ty];
      return '<span class="cp' + (t.flying ? ' fly' : '') + (t.boss ? ' boss' : '') + '" style="--c:' + t.body + '">' +
        NS.I18n.name(t.name) + '</span>';
    }).join('');

    this.drawSelection();
  };

  Hud.prototype.drawSelection = function () {
    const app = this.app;
    const sel = app.selection;
    const box = el('statpanel');
    if (!sel) {
      if (this.lastSel !== null) {
        box.innerHTML = '<div class="hint">' + T('tutorial') + '</div>' +
          '<div class="hint dim">' + T('hint1') + '</div>' +
          '<div class="hint dim">' + T('hint2') + '</div>' +
          '<div class="hint dim">' + T('hint3') + '</div>';
        el('portrait-name').textContent = T('title');
        el('portrait-sub').textContent = '';
        this.lastSel = null;
      }
      this.drawPortrait(null);
      return;
    }
    this.lastSel = sel;
    this.drawPortrait(sel);
    if (sel.def && sel.def.attackType && sel.tileX !== undefined) this.towerStats(sel, box);
    else if (sel.maxHp !== undefined && sel.armorType) this.creepStats(sel, box);
    else this.heroStats(sel, box);
  };

  function bar(label, k, color, text) {
    return '<div class="bar-row"><span class="bar-label">' + label + '</span>' +
      '<span class="bar"><i style="width:' + Math.max(0, Math.min(100, k * 100)).toFixed(1) + '%;background:' + color + '"></i>' +
      '<b>' + text + '</b></span></div>';
  }

  function statRow(label, value, cls) {
    return '<div class="stat ' + (cls || '') + '"><span>' + label + '</span><b>' + value + '</b></div>';
  }

  /** The bit that makes the WC3 damage table legible: × versus every armour type. */
  function armorStrip(def) {
    const DT = NS.DamageTable;
    let html = '<div class="armor-strip">';
    DT.ARMOR_TYPES.forEach(function (a) {
      const f = DT.factor(def.attackType, a);
      const bonus = def.bonusVsArmor && def.bonusVsArmor[a] ? '+' + def.bonusVsArmor[a] : '';
      const cls = f > 1 ? 'good' : (f < 1 ? 'bad' : '');
      html += '<span class="chip ' + cls + '" title="' + T('armor_' + a) + '">' +
        '<em>' + T('armor_' + a) + '</em><b>×' + f.toFixed(2) + (bonus ? ' <u>' + bonus + '</u>' : '') + '</b></span>';
    });
    return html + '</div>';
  }

  Hud.prototype.towerStats = function (tw, box) {
    const def = tw.def;
    const app = this.app;
    el('portrait-name').textContent = NS.I18n.name(def.name);
    el('portrait-sub').innerHTML = '<span class="stars">' + '★'.repeat(def.tier) + '</span> ' +
      NS.I18n.name(NS.TowerData.LINE_BY_ID[def.line].name);

    const dps = def.dps;
    const target = app.game.creeps.filter(function (c) {
      return c.alive && NS.Combat.canHit(def, c) && NS.Combat.inRange(tw, c, def.range);
    })[0];
    let live = '';
    if (target) {
      const res = NS.DamageTable.resolve({
        base: def.avgDamage, attackType: def.attackType, armorType: target.armorType,
        armorValue: target.effectiveArmor(), bonusVsArmor: def.bonusVsArmor
      });
      live = statRow(T('dps') + ' ' + T('vs') + ' ' + NS.I18n.name(target.name),
        Math.round(tw.dpsVersus(target)) + ' <u>×' + res.typeFactor.toFixed(2) + '</u>', 'live');
    }

    let extras = '';
    if (def.splash) extras += '<span class="tag">' + T('splash') + ' ' + def.splash.outer.toFixed(1) + '</span>';
    if (def.chain) extras += '<span class="tag">' + T('chain') + ' ×' + (def.chain.bounces + 1) + '</span>';
    if (def.multishot > 1) extras += '<span class="tag">' + T('multishot') + ' ×' + def.multishot + '</span>';
    if (def.crit) extras += '<span class="tag">' + T('crit') + ' ' + Math.round(def.crit.chance * 100) + '% ×' + def.crit.mult + '</span>';
    def.effects.forEach(function (e) {
      if (e.type === 'poison') extras += '<span class="tag poison">' + T('poison') + ' ' + e.dps + '/s</span>';
      if (e.type === 'slow') extras += '<span class="tag slow">' + T('slow') + ' ' + Math.round(e.amount * 100) + '%</span>';
      if (e.type === 'root') extras += '<span class="tag root">' + T('root') + ' ' + Math.round(e.chance * 100) + '%</span>';
      if (e.type === 'web') extras += '<span class="tag web">' + T('web') + ' ' + Math.round(e.chance * 100) + '%</span>';
    });
    extras += '<span class="tag ' + (NS.TowerData.canTargetAir(def) ? 'air' : 'ground') + '">' +
      (NS.TowerData.canTargetAir(def) ? T('antiAir') : T('groundOnly')) + '</span>';

    box.innerHTML =
      '<div class="stat-grid">' +
      statRow(T('attack'), Math.round(def.damage[0]) + ' - ' + Math.round(def.damage[1]) +
        ' <u>' + T('atk_' + def.attackType) + '</u>') +
      statRow(T('rate'), def.cooldown.toFixed(2) + 's') +
      statRow(T('range'), def.range.toFixed(1)) +
      statRow(T('dps'), Math.round(dps)) +
      statRow(T('kills'), tw.kills) +
      statRow(T('damageDone'), Math.round(tw.damageDealt)) +
      statRow(T('invested'), tw.investedGold + 'g') +
      statRow(T('sellFor'), tw.sellValue() + 'g') +
      '</div>' +
      '<div class="tags">' + extras + '</div>' +
      armorStrip(def) +
      (live ? '<div class="stat-grid live-row">' + live + '</div>' : '') +
      '<div class="hint dim">' + T('targeting') + ': ' + T('target_' + tw.targetMode) + '</div>';
  };

  Hud.prototype.creepStats = function (c, box) {
    el('portrait-name').textContent = NS.I18n.name(c.name);
    el('portrait-sub').innerHTML = (c.boss ? '<span class="boss-tag">' + T('boss') + '</span> ' : '') +
      T('armor_' + c.armorType) + (c.flying ? ' · ' + T('flying') : '') +
      (c.spellImmune ? ' · ' + T('spellImmune') : '');
    const now = this.app.game.time;
    let status = '';
    if (now < c.slowUntil) status += '<span class="tag slow">' + T('slow') + ' ' + Math.round(c.slowAmount * 100) + '%</span>';
    if (c.poisons.size) status += '<span class="tag poison">' + T('poison') + '</span>';
    if (now < c.rootUntil) status += '<span class="tag root">' + T('root') + '</span>';
    if (now < c.webUntil) status += '<span class="tag web">' + T('web') + '</span>';
    box.innerHTML =
      bar(T('hp'), c.hp / c.maxHp, '#3fbf46', Math.max(0, Math.round(c.hp)) + ' / ' + c.maxHp) +
      '<div class="stat-grid">' +
      statRow(T('armor'), T('armor_' + c.armorType) + ' <u>' + c.effectiveArmor() + '</u>') +
      statRow(T('speed'), c.currentSpeed().toFixed(2)) +
      statRow(T('bounty'), c.bounty + 'g') +
      statRow(T('wave'), c.wave) +
      '</div>' +
      '<div class="tags">' + status + '</div>';
  };

  Hud.prototype.heroStats = function (h, box) {
    el('portrait-name').textContent = NS.I18n.name(h.def.name);
    el('portrait-sub').innerHTML = '<span class="stars">' + '★'.repeat(Math.min(5, h.level)) + '</span> ' +
      NS.I18n.name(h.def.title) + ' · ' + T('level') + ' ' + h.level;
    box.innerHTML =
      bar(T('hp'), h.hp / h.maxHp, '#3fbf46', Math.round(h.hp) + ' / ' + Math.round(h.maxHp)) +
      bar(T('mana'), h.mana / h.maxMana, '#4a7fe0', Math.round(h.mana) + ' / ' + Math.round(h.maxMana)) +
      '<div class="stat-grid">' +
      statRow(T('attack'), Math.round(h.atkDef.damage[0]) + ' - ' + Math.round(h.atkDef.damage[1]) +
        ' <u>' + T('atk_' + h.atkDef.attackType) + '</u>') +
      statRow(T('rate'), h.atkDef.cooldown.toFixed(2) + 's') +
      statRow(T('range'), h.atkDef.range.toFixed(1)) +
      statRow(T('dps'), Math.round(h.atkDef.dps)) +
      '</div>' + armorStrip(h.atkDef);
  };

  Hud.prototype.drawPortrait = function (sel) {
    const ctx = this.pctx, s = this.portrait.width, t = this.portraitTime;
    ctx.clearRect(0, 0, s, this.portrait.height);
    const g = ctx.createRadialGradient(s / 2, s * 0.4, 4, s / 2, s / 2, s * 0.8);
    g.addColorStop(0, '#243044'); g.addColorStop(1, '#080c12');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, this.portrait.height);

    ctx.save();
    ctx.translate(s / 2, this.portrait.height * 0.86);
    if (!sel) {
      ctx.scale(0.85, 0.85);
      NS.Sprites.drawKeep(ctx, 0, 0, t, this.app.game.lives, this.app.game.maxLives);
    } else if (sel.tileX !== undefined) {
      ctx.scale(1.0, 1.0);
      NS.Sprites.drawTower(ctx, 0, -4, { def: sel.def, x: 0, y: 0, angle: t * 0.6, recoil: 0, buildAnim: 0 }, t);
    } else if (sel.armorType) {
      ctx.scale(1.9, 1.9);
      const ghost = Object.create(sel);
      ghost.z = 0; ghost.anim = t * 1.2; ghost.hitFlash = 0; ghost.dying = 1; ghost.alive = true;
      NS.Sprites.drawCreep(ctx, 0, -6, ghost, t);
    } else {
      ctx.scale(1.7, 1.7);
      NS.Sprites.drawHero(ctx, 0, -6, sel, t);
    }
    ctx.restore();
  };

  NS.Hud = Hud;
})(typeof globalThis !== 'undefined' ? globalThis : this);
