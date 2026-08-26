/* Hover tooltips with the 250ms WC3 delay, showing costs and the damage table. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});
  const doc = root.document;
  function T(k, v) { return NS.I18n.t(k, v); }

  function Tooltip(app) {
    this.app = app;
    this.el = doc.getElementById('tooltip');
    this.timer = null;
    this.anchor = null;
  }

  Tooltip.prototype.hide = function () {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    this.el.classList.remove('show');
  };

  Tooltip.prototype.showSlot = function (anchor, slot) {
    const self = this;
    this.hide();
    if (!slot) return;
    this.timer = setTimeout(function () { self.render(anchor, slot); }, NS.Config.ui.tooltipDelay);
  };

  Tooltip.prototype.render = function (anchor, slot) {
    const html = [];
    html.push('<div class="tt-title">' + slot.label + '</div>');
    if (slot.cost) {
      const bits = [];
      if (slot.cost.gold) bits.push('<span class="g">' + slot.cost.gold + ' ' + T('gold') + '</span>');
      if (slot.cost.lumber) bits.push('<span class="l">' + slot.cost.lumber + ' ' + T('lumber') + '</span>');
      if (slot.cost.mana) bits.push('<span class="m">' + slot.cost.mana + ' ' + T('mana') + '</span>');
      if (bits.length) html.push('<div class="tt-cost">' + bits.join(' ') + '</div>');
    }
    if (slot.desc) html.push('<div class="tt-desc">' + slot.desc + '</div>');

    const def = slot.def;
    if (def && def.attackType) {
      html.push('<div class="tt-stats">' +
        '<span>' + T('attack') + ': <b>' + Math.round(def.damage[0]) + '-' + Math.round(def.damage[1]) +
        '</b> ' + T('atk_' + def.attackType) + '</span>' +
        '<span>' + T('rate') + ': <b>' + def.cooldown.toFixed(2) + 's</b></span>' +
        '<span>' + T('range') + ': <b>' + def.range.toFixed(1) + '</b></span>' +
        '<span>' + T('dps') + ': <b>' + Math.round(def.dps) + '</b></span>' +
        '<span>' + (NS.TowerData.canTargetAir(def) ? T('antiAir') : T('groundOnly')) + '</span>' +
        '</div>');
      const DT = NS.DamageTable;
      html.push('<div class="tt-table">' + DT.ARMOR_TYPES.map(function (a) {
        const f = DT.factor(def.attackType, a);
        return '<span class="' + (f > 1 ? 'good' : (f < 1 ? 'bad' : '')) + '">' +
          T('armor_' + a) + '<b>×' + f.toFixed(2) + '</b></span>';
      }).join('') + '</div>');
    }
    if (slot.ability) {
      const a = slot.ability;
      const h = this.app.game.hero;
      const bits = [];
      if (a.cooldown) bits.push(T('rate') + ': ' + a.cooldown + 's');
      if (a.damage) bits.push(T('attack') + ': ' + Math.round(h.scaled(a, 'damage')));
      if (a.dps) bits.push(T('dps') + ': ' + Math.round(h.scaled(a, 'dps')));
      if (a.duration) bits.push(a.duration + 's');
      if (bits.length) html.push('<div class="tt-stats"><span>' + bits.join('</span><span>') + '</span></div>');
    }
    html.push('<div class="tt-hint">' + T('hotkey') + ': ' + (anchor.querySelector('.hk') || { textContent: '' }).textContent + '</div>');

    this.el.innerHTML = html.join('');
    this.el.classList.add('show');
    const r = anchor.getBoundingClientRect();
    const tr = this.el.getBoundingClientRect();
    let left = r.left + r.width / 2 - tr.width / 2;
    left = Math.max(8, Math.min(root.innerWidth - tr.width - 8, left));
    this.el.style.left = left + 'px';
    this.el.style.top = Math.max(8, r.top - tr.height - 10) + 'px';
  };

  /** Free-form tooltip used by the top bar buttons. */
  Tooltip.prototype.showText = function (anchor, title, desc) {
    this.showSlot(anchor, { label: title, desc: desc });
  };

  NS.Tooltip = Tooltip;
})(typeof globalThis !== 'undefined' ? globalThis : this);
