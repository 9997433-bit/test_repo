/**
 * 锻造火花粒子场（Canvas 2D，additive）。
 *
 * 设计要点：
 * - 只有存在活跃粒子时才跑 rAF，静止时零开销；
 * - DPR 自适应，避免高分屏糊；
 * - `prefers-reduced-motion` 下不产生任何粒子与循环，改为一次性静态余烬，
 *   保证"有反馈"但不产生持续动态。
 */

import { reducedMotion } from '../motion.js';

const HOT = [
  [255, 250, 232],
  [255, 226, 150],
  [247, 176, 66],
  [225, 104, 44],
  [180, 52, 30]
];

function lerpColor(t) {
  const x = Math.min(0.999, Math.max(0, t)) * (HOT.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a = HOT[i];
  const b = HOT[Math.min(HOT.length - 1, i + 1)];
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f)
  ];
}

export function createSparkField(canvas) {
  const ctx = canvas.getContext('2d', { alpha: true });
  let particles = [];
  let embers = [];
  let raf = 0;
  let last = 0;
  let w = 0;
  let h = 0;
  let dpr = 1;
  let ambient = false;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  ro?.observe(canvas);
  resize();

  function spawn(x, y, count, power) {
    for (let i = 0; i < count; i += 1) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5;
      const speed = (48 + Math.random() * 210) * power;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed * (0.6 + Math.random() * 0.9),
        vy: Math.sin(angle) * speed,
        life: 0,
        ttl: 0.34 + Math.random() * 0.62,
        size: 0.7 + Math.random() * 1.9,
        drag: 0.86 + Math.random() * 0.08,
        trail: Math.random() < 0.34
      });
    }
  }

  /**
   * 迸发一簇火花。
   * @param {object} opts x/y 为 0–1 归一化坐标
   */
  function burst({ x = 0.5, y = 0.72, count = 90, power = 1 } = {}) {
    if (!w || !h) resize();
    const px = x * w;
    const py = y * h;

    if (reducedMotion()) {
      drawStaticEmber(px, py, power);
      return;
    }
    spawn(px, py, count, power);
    start();
  }

  /** 降级：画一圈静态余烬后淡出，无循环动画。 */
  function drawStaticEmber(px, py, power) {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const r = 34 * power;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    grad.addColorStop(0, 'rgba(255,248,226,0.85)');
    grad.addColorStop(0.4, 'rgba(247,176,66,0.45)');
    grad.addColorStop(1, 'rgba(180,52,30,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * Math.PI * 2;
      const d = r * (0.55 + (i % 3) * 0.18);
      ctx.fillStyle = 'rgba(255,214,138,0.7)';
      ctx.beginPath();
      ctx.arc(px + Math.cos(a) * d, py + Math.sin(a) * d * 0.6, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    setTimeout(() => ctx.clearRect(0, 0, w, h), 420);
  }

  /** 炉口常驻上升余烬（可关） */
  function setAmbient(on) {
    ambient = on && !reducedMotion();
    if (ambient) start();
    else embers = [];
  }

  function stepEmbers(dt) {
    if (ambient && embers.length < 14 && Math.random() < dt * 8) {
      embers.push({
        x: w * (0.34 + Math.random() * 0.32),
        y: h * (0.82 + Math.random() * 0.1),
        vx: (Math.random() - 0.5) * 10,
        vy: -(10 + Math.random() * 22),
        life: 0,
        ttl: 1.6 + Math.random() * 1.8,
        size: 0.6 + Math.random() * 1.2
      });
    }
    embers = embers.filter((p) => {
      p.life += dt;
      p.x += (p.vx + Math.sin(p.life * 2.2) * 6) * dt;
      p.y += p.vy * dt;
      return p.life < p.ttl;
    });
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    particles = particles.filter((p) => {
      p.life += dt;
      if (p.life >= p.ttl) return false;
      const prevX = p.x;
      const prevY = p.y;
      p.vy += 620 * dt;
      p.vx *= Math.pow(p.drag, dt * 60);
      p.vy *= Math.pow(0.985, dt * 60);
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      const t = p.life / p.ttl;
      const [r, g, b] = lerpColor(t);
      const alpha = (1 - t) * (1 - t);

      if (p.trail) {
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.55})`;
        ctx.lineWidth = p.size * 0.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - t * 0.4), 0, Math.PI * 2);
      ctx.fill();
      return p.y < h + 12;
    });

    stepEmbers(dt);
    embers.forEach((p) => {
      const t = p.life / p.ttl;
      const alpha = Math.sin(Math.PI * t) * 0.55;
      ctx.fillStyle = `rgba(255,196,116,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalCompositeOperation = 'source-over';

    if (particles.length || embers.length) {
      raf = requestAnimationFrame(frame);
    } else {
      raf = 0;
      ctx.clearRect(0, 0, w, h);
    }
  }

  function start() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function destroy() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    particles = [];
    embers = [];
    ro?.disconnect();
  }

  return { burst, setAmbient, resize, destroy, get active() { return particles.length; } };
}
