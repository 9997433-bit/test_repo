/*
 * The 4x3 Warcraft III command card: race pages, tower build pages, the
 * selected-tower page (upgrade / targeting / sell) and hero abilities.
 * Hotkeys follow the QWER / ASDF / ZXCV grid.
 */
(function (global) {
  'use strict';

  var I18N = global.WC3.I18N;
  var TowerData = global.WC3.TowerData;
  var Damage = global.WC3.Damage;
  var Sprites = global.WC3.Sprites;
  var Hero = global.WC3.Hero;

  var HOTKEYS = ['Q', 'W', 'E', 'R', 'A', 'S', 'D', 'F', 'Z', 'X', 'C', 'V'];
  var CODES = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyA', 'KeyS', 'KeyD', 'KeyF',
    'KeyZ', 'KeyX', 'KeyC', 'KeyV'];

  function t(k, p) { return I18N.t(k, p); }

  // ------------------------------------------------------------- icons

  function iconCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  function frame(ctx, w, h, c1, c2) {
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);
  }

  function drawTowerIcon(canvas, def) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    frame(ctx, w, h, Sprites.shade(def.raceColor, -105), '#12100c');
    var s = h / 78;
    Sprites.drawTower(ctx, {
      def: def, angle: -0.35, fireAnim: 0, buildAnim: 1
    }, w / 2, h * 0.93, s * 1.25, 0, 0.7);
  }

  function drawRaceIcon(canvas, race) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    frame(ctx, w, h, Sprites.shade(race.color, -100), '#100e0a');
    // Shield crest.
    ctx.fillStyle = race.color;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.14);
    ctx.lineTo(w * 0.82, h * 0.26);
    ctx.lineTo(w * 0.82, h * 0.6);
    ctx.quadraticCurveTo(w * 0.5, h * 0.95, w * 0.18, h * 0.6);
    ctx.lineTo(w * 0.18, h * 0.26);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = race.accent;
    Sprites.star(ctx, w * 0.5, h * 0.46, h * 0.17, race.accent);
  }

  function drawGlyph(canvas, kind, color) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    frame(ctx, w, h, '#3c3527', '#14120d');
    ctx.strokeStyle = color || '#f2d68c';
    ctx.fillStyle = color || '#f2d68c';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    var cx = w / 2;
    var cy = h / 2;
    switch (kind) {
      case 'upgrade':
        ctx.beginPath();
        ctx.moveTo(cx, cy - h * 0.26);
        ctx.lineTo(cx + w * 0.2, cy + h * 0.04);
        ctx.lineTo(cx + w * 0.08, cy + h * 0.04);
        ctx.lineTo(cx + w * 0.08, cy + h * 0.26);
        ctx.lineTo(cx - w * 0.08, cy + h * 0.26);
        ctx.lineTo(cx - w * 0.08, cy + h * 0.04);
        ctx.lineTo(cx - w * 0.2, cy + h * 0.04);
        ctx.closePath();
        ctx.fill();
        break;
      case 'sell':
        ctx.beginPath();
        ctx.arc(cx, cy, h * 0.24, 0, Math.PI * 2);
        ctx.fillStyle = '#e2b84a';
        ctx.fill();
        ctx.strokeStyle = '#8a6a1c';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#7a5c14';
        ctx.font = 'bold ' + Math.round(h * 0.3) + 'px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', cx, cy + 1);
        break;
      case 'target':
        ctx.beginPath();
        ctx.arc(cx, cy, h * 0.22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - h * 0.34, cy); ctx.lineTo(cx - h * 0.12, cy);
        ctx.moveTo(cx + h * 0.12, cy); ctx.lineTo(cx + h * 0.34, cy);
        ctx.moveTo(cx, cy - h * 0.34); ctx.lineTo(cx, cy - h * 0.12);
        ctx.moveTo(cx, cy + h * 0.12); ctx.lineTo(cx, cy + h * 0.34);
        ctx.stroke();
        break;
      case 'back':
        ctx.beginPath();
        ctx.moveTo(cx + w * 0.18, cy - h * 0.2);
        ctx.lineTo(cx - w * 0.16, cy);
        ctx.lineTo(cx + w * 0.18, cy + h * 0.2);
        ctx.stroke();
        break;
      case 'hero':
        ctx.beginPath();
        ctx.arc(cx, cy - h * 0.1, h * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx - h * 0.24, cy + h * 0.34);
        ctx.quadraticCurveTo(cx, cy + h * 0.02, cx + h * 0.24, cy + h * 0.34);
        ctx.fill();
        break;
      case 'nova':
        for (var i = 0; i < 8; i++) {
          var a = (i / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * h * 0.12, cy + Math.sin(a) * h * 0.12);
          ctx.lineTo(cx + Math.cos(a) * h * 0.34, cy + Math.sin(a) * h * 0.34);
          ctx.stroke();
        }
        break;
      case 'haste':
        ctx.beginPath();
        ctx.moveTo(cx + w * 0.06, cy - h * 0.3);
        ctx.lineTo(cx - w * 0.16, cy + h * 0.04);
        ctx.lineTo(cx - w * 0.02, cy + h * 0.04);
        ctx.lineTo(cx - w * 0.08, cy + h * 0.32);
        ctx.lineTo(cx + w * 0.18, cy - h * 0.04);
        ctx.lineTo(cx + w * 0.03, cy - h * 0.04);
        ctx.closePath();
        ctx.fill();
        break;
      default:
        break;
    }
  }

  // ---------------------------------------------------------- tooltips

  function multRow(attackType) {
    var html = '<table>';
    Damage.ARMOR_TYPES.forEach(function (arm) {
      var f = Damage.factor(attackType, arm);
      var cls = f > 1.001 ? 'mult-good' : (f < 0.999 ? 'mult-bad' : '');
      html += '<tr><td class="k">' + I18N.armor(arm) + '</td>' +
        '<td class="v ' + cls + '">×' + f.toFixed(2) + '</td></tr>';
    });
    return html + '</table>';
  }

  function effectText(effect) {
    if (!effect) return '';
    switch (effect.kind) {
      case 'slow':
        return t('effSlow') + ' ' + Math.round((1 - effect.factor) * 100) + '% / ' + effect.duration + 's';
      case 'poison':
        return t('effPoison') + ' ' + effect.dps + ' dps / ' + effect.duration + 's';
      case 'root':
        return t('effRoot') + ' ' + Math.round(effect.chance * 100) + '% / ' + effect.duration + 's';
      case 'chain':
        return t('effChain') + ' ×' + (effect.jumps + 1);
      default:
        return '';
    }
  }

  function towerTooltip(def, extra) {
    var dps = Math.round(def.dps);
    var html = '<h4>' + I18N.name(def) + ' <small>T' + def.tier + '</small></h4>';
    html += '<div class="cost-line">' + t('cost') + ': ' + def.gold + ' ' + t('gold');
    if (def.lumber) html += ' · ' + def.lumber + ' ' + t('lumber');
    html += '</div>';
    html += '<table>';
    html += '<tr><td class="k">' + t('damage') + '</td><td class="v">' + def.dmgMin + '–' + def.dmgMax + '</td></tr>';
    html += '<tr><td class="k">' + t('dps') + '</td><td class="v">' + dps + '</td></tr>';
    html += '<tr><td class="k">' + t('attackType') + '</td><td class="v">' + I18N.attack(def.attackType) + '</td></tr>';
    html += '<tr><td class="k">' + t('range') + '</td><td class="v">' + def.range + '</td></tr>';
    html += '<tr><td class="k">' + t('attackSpeed') + '</td><td class="v">' + def.cooldown.toFixed(2) + 's</td></tr>';
    html += '<tr><td class="k">' + t('flying') + '</td><td class="v ' + (def.targetsAir ? 'mult-good' : 'mult-bad') + '">' +
      (def.targetsAir ? '✓' : '✕') + '</td></tr>';
    if (def.splash) html += '<tr><td class="k">' + t('splash') + '</td><td class="v">' + def.splash.radius + '</td></tr>';
    if (def.effect) html += '<tr><td class="k">' + t('effect') + '</td><td class="v">' + effectText(def.effect) + '</td></tr>';
    html += '</table>';
    html += multRow(def.attackType);
    html += '<div class="hint">' + I18N.desc(def) + '</div>';
    if (extra) html += '<div class="hint">' + extra + '</div>';
    return html;
  }

  // -------------------------------------------------------- the widget

  function CommandCard(el, app) {
    this.el = el;
    this.app = app;
    this.page = 'races';
    this.raceId = null;
    this.slots = [];
    this.buttons = [];
    var self = this;

    for (var i = 0; i < 12; i++) {
      var b = document.createElement('button');
      b.className = 'cmd empty';
      var cv = iconCanvas(56, 48);
      b.appendChild(cv);
      var hk = document.createElement('span');
      hk.className = 'hk';
      hk.textContent = HOTKEYS[i];
      b.appendChild(hk);
      var cost = document.createElement('span');
      cost.className = 'cost';
      b.appendChild(cost);
      b.dataset.index = String(i);
      this.el.appendChild(b);
      this.buttons.push({ el: b, canvas: cv, hk: hk, cost: cost });

      /* eslint-disable no-loop-func */
      (function (idx) {
        b.addEventListener('click', function () { self.activate(idx); });
        b.addEventListener('pointerenter', function () {
          var slot = self.slots[idx];
          if (slot && slot.tooltip) app.tooltip.schedule(slot.tooltip(), b);
        });
        b.addEventListener('pointerleave', function () { app.tooltip.hide(); });
      })(i);
      /* eslint-enable no-loop-func */
    }
  }

  CommandCard.prototype.activate = function (idx) {
    var slot = this.slots[idx];
    if (!slot || slot.disabled) return;
    global.WC3.Audio.play('click');
    this.app.tooltip.hide();
    slot.action();
  };

  CommandCard.prototype.hotkey = function (code) {
    var i = CODES.indexOf(code);
    if (i < 0) return false;
    if (!this.slots[i]) return false;
    this.activate(i);
    return true;
  };

  CommandCard.prototype.setPage = function (page, raceId) {
    this.page = page;
    if (raceId) this.raceId = raceId;
    this.build();
  };

  CommandCard.prototype.build = function () {
    var app = this.app;
    var game = app.game;
    var self = this;
    this.slots = new Array(12);

    if (this.page === 'tower' && app.selected && app.selected.def && app.selected.def.tier) {
      var tw = app.selected;
      var next = tw.def.next ? TowerData.get(tw.def.next) : null;
      if (next) {
        this.slots[0] = {
          icon: function (cv) { drawTowerIcon(cv, next); },
          cost: next.gold,
          lumber: next.lumber,
          affordable: function () { return game.gold >= next.gold && game.lumber >= next.lumber; },
          tooltip: function () {
            return towerTooltip(next, t('upgrade') + ' — ' + t('hotkey') + ' Q');
          },
          action: function () { app.upgradeSelected(); }
        };
      }
      this.slots[1] = {
        icon: function (cv) { drawGlyph(cv, 'target'); },
        label: function () { return t('t' + cap(tw.mode)); },
        tooltip: function () {
          return '<h4>' + t('targetMode') + '</h4><div>' + t('t' + cap(tw.mode)) + '</div>' +
            '<div class="hint">' + t('hotkey') + ' W</div>';
        },
        action: function () { app.cycleTargetMode(); }
      };
      this.slots[8] = {
        icon: function (cv) { drawGlyph(cv, 'sell'); },
        gain: function () { return tw.sellValue(global.WC3.Config.SELL_RATE); },
        tooltip: function () {
          return '<h4>' + t('sell') + '</h4><div class="cost-line">+' +
            tw.sellValue(global.WC3.Config.SELL_RATE) + ' ' + t('gold') + '</div>' +
            '<div class="hint">' + t('hotkey') + ' Z</div>';
        },
        action: function () { app.sellSelected(); }
      };
      this.slots[11] = {
        icon: function (cv) { drawGlyph(cv, 'back'); },
        tooltip: function () { return '<h4>' + t('close') + '</h4>'; },
        action: function () { app.select(null); }
      };
    } else if (this.page === 'hero' && game.hero) {
      var hero = game.hero;
      this.slots[0] = {
        icon: function (cv) { drawGlyph(cv, 'nova', hero.def.color); },
        cost: null,
        tooltip: function () {
          return '<h4>' + t(hero.def.qKey) + '</h4><div class="cost-line">' +
            Hero.Q_COST + ' ' + t('mana') + '</div><div class="hint">' + t('hotkey') + ' Q</div>';
        },
        action: function () { app.castHero('q'); }
      };
      this.slots[1] = {
        icon: function (cv) { drawGlyph(cv, 'haste', hero.def.color); },
        tooltip: function () {
          return '<h4>' + t(hero.def.wKey) + '</h4><div class="cost-line">' +
            Hero.W_COST + ' ' + t('mana') + '</div><div class="hint">' + t('hotkey') + ' W</div>';
        },
        action: function () { app.castHero('w'); }
      };
      this.slots[11] = {
        icon: function (cv) { drawGlyph(cv, 'back'); },
        tooltip: function () { return '<h4>' + t('close') + '</h4>'; },
        action: function () { app.select(null); }
      };
    } else if (this.page === 'race') {
      var towers = TowerData.byRace(this.raceId);
      towers.forEach(function (def, i) {
        self.slots[i] = {
          icon: function (cv) { drawTowerIcon(cv, def); },
          cost: def.gold,
          lumber: def.lumber,
          affordable: function () { return game.gold >= def.gold && game.lumber >= def.lumber; },
          tooltip: function () { return towerTooltip(def, t('build') + ' — ' + t('hotkey') + ' ' + HOTKEYS[i]); },
          action: function () { app.startBuild(def); },
          isActive: function () { return app.buildDef === def; }
        };
      });
      this.slots[11] = {
        icon: function (cv) { drawGlyph(cv, 'back'); },
        tooltip: function () { return '<h4>' + t('cancel') + '</h4>'; },
        action: function () { app.cancelBuild(); self.setPage('races'); }
      };
    } else {
      TowerData.RACES.forEach(function (race, i) {
        self.slots[i] = {
          icon: function (cv) { drawRaceIcon(cv, race); },
          tooltip: function () {
            var list = TowerData.byRace(race.id).map(function (d) {
              return I18N.name(d) + ' (' + I18N.attack(d.attackType) + ')';
            }).join('<br>');
            return '<h4>' + I18N.name(race) + '</h4><div>' + list + '</div>' +
              '<div class="hint">' + t('hotkey') + ' ' + HOTKEYS[i] + '</div>';
          },
          action: function () { self.setPage('race', race.id); }
        };
      });
      if (game.hero) {
        this.slots[8] = {
          icon: function (cv) { drawGlyph(cv, 'hero', game.hero.def.color); },
          tooltip: function () {
            return '<h4>' + I18N.name(game.hero.def) + '</h4><div>' + t('heroDesc') + '</div>' +
              '<div class="hint">' + t('heroMove') + '</div>';
          },
          action: function () { app.select(game.hero); }
        };
      }
    }

    for (var i = 0; i < 12; i++) {
      var slot = this.slots[i];
      var btn = this.buttons[i];
      if (!slot) {
        btn.el.className = 'cmd empty';
        btn.cost.textContent = '';
        btn.canvas.getContext('2d').clearRect(0, 0, btn.canvas.width, btn.canvas.height);
        continue;
      }
      btn.el.className = 'cmd';
      slot.icon(btn.canvas);
    }
    this.refresh();
  };

  CommandCard.prototype.refresh = function () {
    var game = this.app.game;
    for (var i = 0; i < 12; i++) {
      var slot = this.slots[i];
      var btn = this.buttons[i];
      if (!slot) continue;
      var text = '';
      var poor = false;
      if (slot.cost !== undefined && slot.cost !== null) {
        text = String(slot.cost) + (slot.lumber ? '/' + slot.lumber + 'w' : '');
        poor = slot.affordable ? !slot.affordable() : false;
      } else if (slot.gain) {
        text = '+' + slot.gain();
      } else if (slot.label) {
        text = slot.label();
      }
      btn.cost.textContent = text;
      btn.cost.className = 'cost' + (poor ? ' no' : '');
      btn.el.classList.toggle('active', !!(slot.isActive && slot.isActive()));
      btn.el.disabled = !!(slot.disabled && slot.disabled());
      void game;
    }
  };

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  CommandCard.towerTooltip = towerTooltip;
  CommandCard.multRow = multRow;
  CommandCard.effectText = effectText;
  CommandCard.drawTowerIcon = drawTowerIcon;
  global.WC3.CommandCard = CommandCard;
})(typeof globalThis !== 'undefined' ? globalThis : this);
