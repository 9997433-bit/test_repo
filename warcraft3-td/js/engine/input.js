/*
 * Centralised keyboard / mouse / touch input.
 * Keeps a live "held" set for camera panning and dispatches discrete events
 * (click, rightclick, wheel, hotkey) to registered listeners.
 */
(function (global) {
  'use strict';

  function Input(target) {
    this.target = target;
    this.keys = Object.create(null);
    this.sx = 0;
    this.sy = 0;
    this.pointerInside = false;
    this.dragging = false;
    this.dragButton = -1;
    this.dragMoved = 0;
    this.listeners = Object.create(null);
    this._downSx = 0;
    this._downSy = 0;
    this.attach();
  }

  Input.prototype.on = function (evt, fn) {
    (this.listeners[evt] || (this.listeners[evt] = [])).push(fn);
    return this;
  };

  Input.prototype.emit = function (evt, payload) {
    var list = this.listeners[evt];
    if (!list) return;
    for (var i = 0; i < list.length; i++) list[i](payload);
  };

  Input.prototype.isDown = function (code) {
    return !!this.keys[code];
  };

  Input.prototype._localPos = function (e) {
    var rect = this.target.getBoundingClientRect();
    this.sx = e.clientX - rect.left;
    this.sy = e.clientY - rect.top;
  };

  Input.prototype.attach = function () {
    var self = this;
    var t = this.target;

    this._onKeyDown = function (e) {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      var repeat = !!self.keys[e.code];
      self.keys[e.code] = true;
      self.emit('keydown', { code: e.code, key: e.key, repeat: repeat, event: e,
        shift: e.shiftKey, ctrl: e.ctrlKey, alt: e.altKey });
      if (/^(Arrow|Space|Tab)/.test(e.code)) e.preventDefault();
    };
    this._onKeyUp = function (e) {
      self.keys[e.code] = false;
      self.emit('keyup', { code: e.code, key: e.key, event: e });
    };
    this._onBlur = function () {
      for (var k in self.keys) self.keys[k] = false;
      self.dragging = false;
      self.pointerInside = false;
      self.emit('blur', null);
    };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);

    t.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    t.addEventListener('pointerenter', function () { self.pointerInside = true; });
    t.addEventListener('pointerleave', function () {
      self.pointerInside = false;
      self.emit('pointerleave', null);
    });

    t.addEventListener('pointerdown', function (e) {
      self._localPos(e);
      self.pointerInside = true;
      self.dragging = true;
      self.dragButton = e.button;
      self.dragMoved = 0;
      self._downSx = self.sx;
      self._downSy = self.sy;
      if (t.setPointerCapture) { try { t.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } }
      self.emit('pointerdown', { sx: self.sx, sy: self.sy, button: e.button, event: e });
    });

    t.addEventListener('pointermove', function (e) {
      var px = self.sx;
      var py = self.sy;
      self._localPos(e);
      if (self.dragging) {
        self.dragMoved += Math.abs(self.sx - px) + Math.abs(self.sy - py);
      }
      self.emit('pointermove', {
        sx: self.sx, sy: self.sy,
        dx: self.sx - px, dy: self.sy - py,
        dragging: self.dragging, button: self.dragButton, event: e
      });
    });

    var endDrag = function (e) {
      self._localPos(e);
      var wasDragging = self.dragging;
      var button = self.dragButton;
      var moved = self.dragMoved;
      self.dragging = false;
      self.dragButton = -1;
      self.emit('pointerup', { sx: self.sx, sy: self.sy, button: button, event: e });
      if (wasDragging && moved < 6) {
        self.emit(button === 2 ? 'rightclick' : 'click',
          { sx: self.sx, sy: self.sy, button: button, event: e });
      }
    };
    t.addEventListener('pointerup', endDrag);
    t.addEventListener('pointercancel', function () {
      self.dragging = false;
      self.dragButton = -1;
    });

    t.addEventListener('wheel', function (e) {
      e.preventDefault();
      self._localPos(e);
      self.emit('wheel', { sx: self.sx, sy: self.sy, delta: e.deltaY, event: e });
    }, { passive: false });
  };

  Input.prototype.detach = function () {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('blur', this._onBlur);
  };

  global.WC3.Input = Input;
})(typeof globalThis !== 'undefined' ? globalThis : this);
