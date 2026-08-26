/* The 4×3 command card. Context switches between the build menus, a selected
 * tower and the commander's spellbook, exactly like the WC3 command panel. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});
  const doc = root.document;
  function T(k, v) { return NS.I18n.t(k, v); }

  const HOTKEYS = ['Q', 'W', 'E', 'R', 'A', 'S', 'D', 'F', 'Z', 'X', 'C', 'V'];

  function CommandCard(app) {
    this.app = app;
    this.root = doc.getElementById('commandcard');
    this.mode = 'root';
    this.raceId = null;
    this.buttons = [];
    const self = this;
    for (let i = 0; i < 12; i++) {
      const b = doc.createElement('button');
      b.className = 'cmd-btn empty';
      b.innerHTML = '<canvas width="44" height="44"></canvas><span class="hk">' + HOTKEYS[i] + '</span>' +
        '<span class="cost"></span>';
      b.addEventListener('click', function () { self.activate(i); });
      b.addEventListener('mouseenter', function () { app.tooltip.showSlot(b, self.slots[i]); });
      b.addEventListener('mouseleave', function () { app.tooltip.hide(); });
      this.root.appendChild(b);
      this.buttons.push(b);
    }
    this.slots = [];
    this.refresh();
  }

  CommandCard.prototype.setMode = function (mode, raceId) {
    this.mode = mode;
    this.raceId = raceId || null;
    this.refresh();
  };

  CommandCard.prototype.build = function () {
    const app = this.app, game = app.game;
    const slots = new Array(12).fill(null);
    const sel = app.selection;

    if (sel && sel.tileX !== undefined) {
      const next = sel.upgradeDef();
      slots[0] = next ? {
        icon: next.icon, palette: next.race, action: 'upgrade',
        label: T('upgrade') + ': ' + NS.I18n.name(next.name),
        cost: { gold: next.gold, lumber: next.lumber }, def: next,
        disabled: !game.canAfford(next)
      } : { icon: 'upgrade', palette: 'action', action: 'none', label: T('maxTier'), disabled: true };
      slots[1] = {
        icon: 'sell', palette: 'danger', action: 'sell',
        label: T('sell') + ' +' + sel.sellValue() + 'g',
        desc: T('sellFor') + ' ' + sel.sellValue()
      };
      slots[2] = {
        icon: 'target', palette: 'action', action: 'targetmode',
        label: T('targeting') + ': ' + T('target_' + sel.targetMode),
        desc: NS.Combat.TARGET_MODES.map((m) => T('target_' + m)).join(' · ')
      };
      slots[11] = { icon: 'cancel', palette: 'action', action: 'deselect', label: T('cancel') };
    } else if (sel && sel.def && sel.def.abilities) {
      sel.def.abilities.forEach(function (a, i) {
        slots[i] = {
          icon: abilityIcon(a, sel.def), palette: 'hero', action: 'ability', ability: a,
          label: NS.I18n.name(a.name), desc: NS.I18n.name(a.desc),
          cost: a.passive ? null : { mana: a.mana || 0 },
          cooldown: sel.cooldowns[a.id] || 0,
          disabled: a.passive || !sel.canCast(a)
        };
      });
      slots[4] = {
        icon: 'autocast', palette: 'action', action: 'autocast',
        label: T('autocast') + ': ' + (sel.autoCast ? 'ON' : 'OFF')
      };
      slots[11] = { icon: 'cancel', palette: 'action', action: 'deselect', label: T('cancel') };
    } else if (this.mode.indexOf('race:') === 0) {
      const raceId = this.mode.slice(5);
      const lines = NS.TowerData.linesOfRace(raceId);
      lines.forEach(function (line, i) {
        const def = NS.TowerData.get(line.tiers[0].id);
        slots[i] = {
          icon: line.icon, palette: raceId, action: 'build', def: def,
          label: NS.I18n.name(def.name), desc: NS.I18n.name(line.blurb),
          cost: { gold: def.gold, lumber: def.lumber },
          disabled: !game.canAfford(def)
        };
      });
      slots[11] = { icon: 'cancel', palette: 'action', action: 'back', label: T('back') };
    } else {
      NS.TowerData.RACES.forEach(function (race, i) {
        slots[i] = {
          icon: 'race_' + race.id, palette: race.id, action: 'race', raceId: race.id,
          label: T('raceMenu', { race: NS.I18n.name(race.name) }),
          desc: NS.TowerData.linesOfRace(race.id).map((l) => NS.I18n.name(l.name)).join(' · ')
        };
      });
      slots[4] = game.hero
        ? { icon: 'hero', palette: 'hero', action: 'hero', label: T('heroPanel') }
        : null;
      slots[5] = { icon: 'wave', palette: 'action', action: 'nextwave', label: T('nextWave') };
      slots[6] = {
        icon: 'range', palette: 'action', action: 'range',
        label: T('showRange') + ': ' + (app.renderer.showRange ? 'ON' : 'OFF')
      };
      slots[7] = { icon: 'speed', palette: 'action', action: 'speed', label: T('speed') + ' ' + app.speed + '×' };
      slots[8] = { icon: 'pause', palette: 'action', action: 'pause', label: app.paused ? T('resume') : T('pause') };
      slots[9] = { icon: 'settings', palette: 'action', action: 'settings', label: T('settings') };
      slots[10] = { icon: 'help', palette: 'action', action: 'help', label: T('help') };
    }
    return slots;
  };

  function abilityIcon(a, heroDef) {
    if (a.kind === 'nuke') return 'arcane';
    if (a.kind === 'storm') return 'blade';
    if (a.kind === 'heal') return 'moon';
    if (a.kind === 'aura') return 'hammer';
    if (a.kind === 'slowAura') return 'skull';
    if (a.kind === 'toggleAura') return 'acid';
    if (a.kind === 'selfbuff') return heroDef.icon;
    if (a.kind === 'passiveCrit') return 'blade';
    if (a.kind === 'passiveHaste') return 'glaive';
    return heroDef.icon;
  }

  CommandCard.prototype.refresh = function () {
    this.slots = this.build();
    for (let i = 0; i < 12; i++) {
      const s = this.slots[i], b = this.buttons[i];
      const cv = b.querySelector('canvas');
      const cost = b.querySelector('.cost');
      if (!s) {
        b.className = 'cmd-btn empty';
        cv.getContext('2d').clearRect(0, 0, 44, 44);
        cost.textContent = '';
        continue;
      }
      b.className = 'cmd-btn' + (s.disabled ? ' disabled' : '');
      NS.Icons.draw(cv.getContext('2d'), s.icon, 44, s.palette);
      let c = '';
      if (s.cost && s.cost.gold) c += '<i class="g">' + s.cost.gold + '</i>';
      if (s.cost && s.cost.lumber) c += '<i class="l">' + s.cost.lumber + '</i>';
      if (s.cost && s.cost.mana) c += '<i class="m">' + s.cost.mana + '</i>';
      cost.innerHTML = c;
    }
  };

  CommandCard.prototype.activate = function (i) {
    const s = this.slots[i];
    const app = this.app;
    if (!s) return;
    app.audio.click();
    switch (s.action) {
      case 'race': this.setMode('race:' + s.raceId); break;
      case 'back': this.setMode('root'); break;
      case 'build':
        if (s.disabled) { app.audio.deny(); app.flash(T('notEnoughGold')); return; }
        app.startBuild(s.def);
        break;
      case 'upgrade':
        if (s.disabled) { app.audio.deny(); app.flash(T('notEnoughGold')); return; }
        app.game.upgrade(app.selection);
        this.refresh();
        break;
      case 'sell': app.game.sell(app.selection); app.select(null); break;
      case 'targetmode': {
        const modes = NS.Combat.TARGET_MODES;
        const cur = modes.indexOf(app.selection.targetMode);
        app.selection.targetMode = modes[(cur + 1) % modes.length];
        this.refresh();
        break;
      }
      case 'ability':
        if (s.disabled) { app.audio.deny(); return; }
        app.game.hero.cast(s.ability.key);
        this.refresh();
        break;
      case 'autocast':
        app.game.hero.autoCast = !app.game.hero.autoCast;
        this.refresh();
        break;
      case 'hero': app.select(app.game.hero); app.cam.centerOn(app.game.hero.x, app.game.hero.y); break;
      case 'deselect': app.select(null); break;
      case 'nextwave': app.game.startWave(true); break;
      case 'range': app.renderer.showRange = !app.renderer.showRange; this.refresh(); break;
      case 'speed': app.cycleSpeed(); this.refresh(); break;
      case 'pause': app.togglePause(); this.refresh(); break;
      case 'settings': app.menus.open('settings'); break;
      case 'help': app.menus.open('help'); break;
      default: break;
    }
  };

  CommandCard.prototype.hotkey = function (key) {
    const i = HOTKEYS.indexOf(key.toUpperCase());
    if (i === -1) return false;
    if (!this.slots[i]) return false;
    this.activate(i);
    return true;
  };

  NS.CommandCard = CommandCard;
  NS.CommandCard.HOTKEYS = HOTKEYS;
})(typeof globalThis !== 'undefined' ? globalThis : this);
