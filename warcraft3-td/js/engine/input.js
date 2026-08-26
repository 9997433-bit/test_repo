/* Mouse + keyboard. Translates raw events into app intents. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});

  function Input(app) {
    this.app = app;
    this.canvas = app.canvas;
    this.keys = {};
    this.mouse = { x: 0, y: 0, inside: false, down: false };
    this.drag = null;
    this.edgeScroll = true;
    this.bind();
  }

  Input.prototype.bind = function () {
    const self = this, cv = this.canvas, app = this.app;

    cv.addEventListener('contextmenu', (e) => e.preventDefault());

    cv.addEventListener('mousemove', function (e) {
      const r = cv.getBoundingClientRect();
      self.mouse.x = e.clientX - r.left;
      self.mouse.y = e.clientY - r.top;
      self.mouse.inside = true;
      if (self.drag) {
        app.cam.pan((self.drag.x - self.mouse.x) / app.cam.zoom, (self.drag.y - self.mouse.y) / app.cam.zoom);
        self.drag.x = self.mouse.x; self.drag.y = self.mouse.y;
      }
      app.onPointerMove(self.mouse.x, self.mouse.y);
    });

    cv.addEventListener('mouseleave', function () { self.mouse.inside = false; app.onPointerLeave(); });

    cv.addEventListener('mousedown', function (e) {
      cv.focus();
      if (e.button === 1) { self.drag = { x: self.mouse.x, y: self.mouse.y }; e.preventDefault(); return; }
      if (e.button === 2) { app.onRightClick(self.mouse.x, self.mouse.y); return; }
      app.onLeftClick(self.mouse.x, self.mouse.y, e.shiftKey);
    });

    root.addEventListener('mouseup', function (e) { if (e.button === 1) self.drag = null; });

    cv.addEventListener('wheel', function (e) {
      e.preventDefault();
      const z = app.cam.zoom * (e.deltaY > 0 ? 0.9 : 1.1);
      app.cam.zoom = Math.max(0.6, Math.min(1.8, z));
      app.cam.clamp();
    }, { passive: false });

    // touch: tap to click, drag to pan
    let touchStart = null;
    cv.addEventListener('touchstart', function (e) {
      const r = cv.getBoundingClientRect();
      const t = e.touches[0];
      touchStart = { x: t.clientX - r.left, y: t.clientY - r.top, time: Date.now(), moved: false };
      self.mouse.x = touchStart.x; self.mouse.y = touchStart.y;
      app.onPointerMove(self.mouse.x, self.mouse.y);
    }, { passive: true });
    cv.addEventListener('touchmove', function (e) {
      if (!touchStart) return;
      const r = cv.getBoundingClientRect();
      const t = e.touches[0];
      const nx = t.clientX - r.left, ny = t.clientY - r.top;
      if (Math.hypot(nx - touchStart.x, ny - touchStart.y) > 10) {
        touchStart.moved = true;
        app.cam.pan((self.mouse.x - nx) / app.cam.zoom, (self.mouse.y - ny) / app.cam.zoom);
      }
      self.mouse.x = nx; self.mouse.y = ny;
      app.onPointerMove(nx, ny);
    }, { passive: true });
    cv.addEventListener('touchend', function () {
      if (touchStart && !touchStart.moved) app.onLeftClick(touchStart.x, touchStart.y, false);
      touchStart = null;
    });

    root.addEventListener('keydown', function (e) {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      self.keys[e.key.toLowerCase()] = true;
      if (app.onKey(e)) e.preventDefault();
    });
    root.addEventListener('keyup', function (e) { self.keys[e.key.toLowerCase()] = false; });
    root.addEventListener('blur', function () { self.keys = {}; self.drag = null; });
  };

  /** Called every rendered frame for held-key / edge scrolling. */
  Input.prototype.update = function (dt) {
    const k = this.keys, cam = this.app.cam;
    const speed = 900 * dt;
    let dx = 0, dy = 0;
    if (k.arrowleft || k.a) dx -= speed;
    if (k.arrowright || k.d) dx += speed;
    if (k.arrowup || k.w) dy -= speed;
    if (k.arrowdown || k.s) dy += speed;

    if (this.edgeScroll && this.mouse.inside && !this.drag) {
      const m = 26;
      if (this.mouse.x < m) dx -= speed;
      else if (this.mouse.x > this.canvas.width - m) dx += speed;
      if (this.mouse.y < m) dy -= speed;
      else if (this.mouse.y > this.canvas.height - m) dy += speed;
    }
    if (dx || dy) cam.pan(dx, dy);
  };

  NS.Input = Input;
})(typeof globalThis !== 'undefined' ? globalThis : this);
