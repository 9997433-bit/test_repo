/* Hover tooltip with the classic RTS 250ms delay. */
(function (global) {
  'use strict';

  var DELAY = 250;

  function Tooltip(el) {
    this.el = el;
    this.timer = 0;
    this.visible = false;
    this.anchor = null;
  }

  Tooltip.prototype.schedule = function (html, anchorEl) {
    var self = this;
    this.cancel();
    this.anchor = anchorEl;
    this.timer = setTimeout(function () { self.show(html, anchorEl); }, DELAY);
  };

  Tooltip.prototype.show = function (html, anchorEl) {
    this.el.innerHTML = html;
    this.el.classList.remove('hidden');
    this.visible = true;
    this.place(anchorEl);
  };

  Tooltip.prototype.place = function (anchorEl) {
    if (!anchorEl) return;
    var r = anchorEl.getBoundingClientRect();
    var t = this.el.getBoundingClientRect();
    var x = r.left + r.width / 2 - t.width / 2;
    var y = r.top - t.height - 10;
    if (y < 8) y = r.bottom + 10;
    x = Math.max(8, Math.min(window.innerWidth - t.width - 8, x));
    this.el.style.left = Math.round(x) + 'px';
    this.el.style.top = Math.round(y) + 'px';
  };

  Tooltip.prototype.showAt = function (html, sx, sy) {
    this.cancel();
    this.el.innerHTML = html;
    this.el.classList.remove('hidden');
    this.visible = true;
    var t = this.el.getBoundingClientRect();
    var x = Math.min(window.innerWidth - t.width - 8, sx + 18);
    var y = Math.max(8, sy - t.height - 14);
    this.el.style.left = Math.round(x) + 'px';
    this.el.style.top = Math.round(y) + 'px';
  };

  Tooltip.prototype.cancel = function () {
    if (this.timer) { clearTimeout(this.timer); this.timer = 0; }
  };

  Tooltip.prototype.hide = function () {
    this.cancel();
    if (!this.visible) return;
    this.visible = false;
    this.anchor = null;
    this.el.classList.add('hidden');
  };

  global.WC3.Tooltip = Tooltip;
})(typeof globalThis !== 'undefined' ? globalThis : this);
