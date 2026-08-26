/**
 * 元素弹道（Canvas 2D，additive）。
 *
 * 三套弹道对应三相，形态刻意分开，玩家不看颜色也能认出打的是什么：
 *
 * | 元素 | 弹体            | 飞行         | 命中                     |
 * | ---- | --------------- | ------------ | ------------------------ |
 * | 火   | 火弹 + 拖尾余烬 | 抛物线，260ms| 爆散火星 + 冲击环        |
 * | 冰   | 棱形冰锥        | 直线自旋，300ms | 碎裂冰晶 + 霜环       |
 * | 雷   | 折线闪电        | 瞬发闪断，110ms | 放射电弧 + 白闪        |
 * | 无   | 银色刀气        | 直线快斩，180ms | 十字火星               |
 *
 * 群体技另有两套，形态与单体拉开，一眼能认出「这一下打的是一片」：
 *
 * | 形态 | 用于           | 画法                                                |
 * | ---- | -------------- | --------------------------------------------------- |
 * | 扇形 | 溅射 / 全体 AOE | 以施法者为心的扇面横扫，波前扫过谁谁才结算（340ms） |
 * | 连锁 | 跳跃 / 多段技   | 折线闪电逐跳生长，每跳落定再结算下一跳（每跳 90ms） |
 *
 * 约定：
 * - 坐标是相对 canvas 盒子的 CSS 像素；
 * - 只有存在活跃对象时才跑 rAF，空闲时零开销；
 * - `setTimeScale()` 供 KO 慢动作统一降速（弹道与粒子一起变慢）；
 * - `prefers-reduced-motion` 由调用方判断——降级时根本不该创建本模块。
 */

const ELEMENT_COLOR = {
  fire: [255, 138, 70],
  ice: [150, 226, 246],
  thunder: [176, 138, 255],
  none: [242, 232, 206]
};

const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const rand = (a, b) => a + Math.random() * (b - a);

function colorOf(element) {
  return ELEMENT_COLOR[element] || ELEMENT_COLOR.none;
}

/** 一条抖动折线（雷电 / 碎裂共用）。 */
function jaggedPath(x1, y1, x2, y2, segments, spread) {
  const pts = [{ x: x1, y: y1 }];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const nx = -dy;
  const ny = dx;
  const len = Math.hypot(nx, ny) || 1;
  for (let i = 1; i < segments; i += 1) {
    const t = i / segments;
    const off = (Math.random() - 0.5) * spread;
    pts.push({
      x: x1 + dx * t + (nx / len) * off,
      y: y1 + dy * t + (ny / len) * off
    });
  }
  pts.push({ x: x2, y: y2 });
  return pts;
}

export function createBallisticField(canvas) {
  const ctx = canvas.getContext('2d', { alpha: true });
  let shots = [];
  let sweeps = [];
  let chains = [];
  let particles = [];
  let rings = [];
  let raf = 0;
  let last = 0;
  let timeScale = 1;
  let w = 0;
  let h = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  ro?.observe(canvas);
  resize();

  /* ------------------------------- 粒子 ------------------------------- */

  function spawnParticles(x, y, element, count, power, spread = Math.PI * 2) {
    const color = colorOf(element);
    for (let i = 0; i < count; i += 1) {
      const angle = rand(-spread / 2, spread / 2) + (spread >= Math.PI * 2 ? 0 : -Math.PI / 2);
      const speed = rand(40, 200) * power;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: element === 'fire' ? 280 : element === 'ice' ? 420 : 60,
        life: 0,
        ttl: rand(0.24, 0.62),
        size: rand(0.8, 2.4) * (element === 'ice' ? 1.3 : 1),
        shard: element === 'ice',
        spin: rand(-8, 8),
        rot: rand(0, Math.PI),
        color
      });
    }
  }

  function spawnRing(x, y, element, power, kind = 'ring') {
    rings.push({
      x,
      y,
      life: 0,
      ttl: kind === 'flash' ? 0.16 : 0.34,
      r0: kind === 'flash' ? 4 : 3,
      r1: (kind === 'flash' ? 44 : 34) * power,
      width: kind === 'flash' ? 8 : 2.4,
      color: colorOf(element),
      kind
    });
  }

  /* ------------------------------- 弹道 ------------------------------- */

  const SHOT_DURATION = { fire: 0.26, ice: 0.3, thunder: 0.11, none: 0.18 };

  /**
   * 发射一发。
   * @param {{from:{x:number,y:number}, to:{x:number,y:number}, element?:string,
   *          crit?:boolean, power?:number, onImpact?:Function}} opts
   * @returns {number} 命中所需毫秒（调用方可据此对齐 DOM 反馈）
   */
  function fire(opts) {
    const element = opts.element && ELEMENT_COLOR[opts.element] ? opts.element : 'none';
    const power = (opts.power || 1) * (opts.crit ? 1.45 : 1);
    const ttl = SHOT_DURATION[element];
    const from = opts.from;
    const to = opts.to;
    // 抛物线控制点：横向距离越远，抬得越高。
    const lift = element === 'fire' ? 0.32 : element === 'none' ? 0.12 : 0.18;
    shots.push({
      element,
      power,
      crit: Boolean(opts.crit),
      x: from.x,
      y: from.y,
      x0: from.x,
      y0: from.y,
      x1: to.x,
      y1: to.y,
      cx: (from.x + to.x) / 2,
      cy: Math.min(from.y, to.y) - Math.abs(to.x - from.x) * lift - 12,
      life: 0,
      ttl,
      bolt: element === 'thunder' ? jaggedPath(from.x, from.y, to.x, to.y, 7, 26) : null,
      onImpact: opts.onImpact
    });
    start();
    return ttl * 1000;
  }

  /* ----------------------- 群体：扇形横扫 ----------------------- */

  const FAN_DURATION = 0.34;

  /**
   * 扇形横扫：以施法者为圆心张开一片波面，波前扫到谁谁才结算。
   * 和单体弹道的区别是**没有弹体**——打的是一片地，不是一个点。
   *
   * @param {{from:{x:number,y:number}, targets:Array<{x:number,y:number}>,
   *          element?:string, power?:number, onImpact?:(i:number)=>void}} opts
   * @returns {number} 最后一个目标被扫到的毫秒数
   */
  function fan(opts) {
    const targets = (opts.targets || []).filter(Boolean);
    if (targets.length === 0) return 0;
    const element = opts.element && ELEMENT_COLOR[opts.element] ? opts.element : 'none';
    const power = opts.power || 1;
    const from = opts.from;

    const marks = targets.map((t, i) => ({
      x: t.x,
      y: t.y,
      dist: Math.hypot(t.x - from.x, t.y - from.y),
      angle: Math.atan2(t.y - from.y, t.x - from.x),
      index: i,
      hit: false
    }));
    // 两排单位牌都在圆心的同一侧，角度不会跨 ±π，直接取极值即可。
    const angles = marks.map((m) => m.angle);
    const pad = 0.26;
    let a0 = Math.min(...angles) - pad;
    let a1 = Math.max(...angles) + pad;
    if (a1 - a0 < 0.62) {
      const mid = (a0 + a1) / 2;
      a0 = mid - 0.31;
      a1 = mid + 0.31;
    }
    const reach = Math.max(48, ...marks.map((m) => m.dist)) * 1.08;

    sweeps.push({
      element,
      power,
      x: from.x,
      y: from.y,
      a0,
      a1,
      reach,
      marks,
      life: 0,
      ttl: FAN_DURATION,
      onImpact: opts.onImpact
    });
    start();
    return FAN_DURATION * 1000;
  }

  /* ----------------------- 群体：连锁跳跃 ----------------------- */

  const CHAIN_HOP = 0.09;

  /**
   * 连锁：折线闪电按 施法者 → 甲 → 乙 → 丙 逐跳生长，每跳落定才结算下一跳。
   *
   * @param {{from:{x:number,y:number}, targets:Array<{x:number,y:number}>,
   *          element?:string, crit?:boolean, power?:number,
   *          onImpact?:(i:number)=>void}} opts
   * @returns {number} 最后一跳落定的毫秒数
   */
  function chain(opts) {
    const targets = (opts.targets || []).filter(Boolean);
    if (targets.length === 0) return 0;
    const element = opts.element && ELEMENT_COLOR[opts.element] ? opts.element : 'thunder';
    const power = (opts.power || 1) * (opts.crit ? 1.35 : 1);

    let prev = opts.from;
    const legs = targets.map((t, i) => {
      const leg = {
        index: i,
        to: t,
        // 后面的跳幅度更野，看得出能量在衰减前的挣扎
        bolt: jaggedPath(prev.x, prev.y, t.x, t.y, 6, 14 + i * 6),
        hit: false
      };
      prev = t;
      return leg;
    });

    chains.push({
      element,
      power,
      legs,
      life: 0,
      hop: CHAIN_HOP,
      ttl: CHAIN_HOP * legs.length + 0.14,
      onImpact: opts.onImpact
    });
    start();
    return CHAIN_HOP * legs.length * 1000;
  }

  /** 无弹道的纯命中特效（持续伤害、反伤等）。 */
  function impact(x, y, element = 'none', power = 1) {
    spawnParticles(x, y, element, Math.round(14 * power), power);
    spawnRing(x, y, element, power);
    start();
  }

  function detonate(shot) {
    const { x1: x, y1: y, element, power } = shot;
    spawnParticles(x, y, element, Math.round((element === 'thunder' ? 16 : 22) * power), power);
    spawnRing(x, y, element, power, element === 'thunder' ? 'flash' : 'ring');
    if (shot.crit) spawnRing(x, y, element, power * 1.4);
    shot.onImpact?.();
  }

  /* ------------------------------- 绘制 ------------------------------- */

  function drawShot(s) {
    const t = s.life / s.ttl;
    const color = colorOf(s.element);

    if (s.element === 'thunder') {
      // 闪电是一次性的整条折线，靠透明度闪断，不做位移。
      const alpha = Math.sin(Math.PI * Math.min(1, t * 1.2));
      ctx.strokeStyle = rgba([255, 255, 255], alpha * 0.9);
      ctx.lineWidth = 2.6 * s.power;
      ctx.beginPath();
      s.bolt.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
      ctx.strokeStyle = rgba(color, alpha * 0.7);
      ctx.lineWidth = 6 * s.power;
      ctx.stroke();
      return;
    }

    // 二次贝塞尔取点
    const u = 1 - t;
    const px = u * u * s.x0 + 2 * u * t * s.cx + t * t * s.x1;
    const py = u * u * s.y0 + 2 * u * t * s.cy + t * t * s.y1;
    const angle = Math.atan2(py - s.y, px - s.x);
    s.x = px;
    s.y = py;

    if (s.element === 'ice') {
      const r = 7 * s.power;
      const spin = t * 12;
      ctx.fillStyle = rgba(color, 0.92);
      ctx.strokeStyle = rgba([255, 255, 255], 0.75);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 4; i += 1) {
        const a = spin + (i / 4) * Math.PI * 2;
        const rr = i % 2 === 0 ? r : r * 0.42;
        const vx = px + Math.cos(a) * rr;
        const vy = py + Math.sin(a) * rr * 1.2;
        i ? ctx.lineTo(vx, vy) : ctx.moveTo(vx, vy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (Math.random() < 0.7) {
        particles.push({
          x: px,
          y: py,
          vx: rand(-14, 14),
          vy: rand(-6, 26),
          gravity: 120,
          life: 0,
          ttl: rand(0.16, 0.34),
          size: rand(0.6, 1.5),
          shard: true,
          spin: rand(-6, 6),
          rot: 0,
          color
        });
      }
      return;
    }

    // 火弹 / 刀气：一条带头部辉光的拖尾
    const tailLen = s.element === 'fire' ? 26 : 34;
    const tx = px - Math.cos(angle) * tailLen;
    const ty = py - Math.sin(angle) * tailLen;
    const grad = ctx.createLinearGradient(tx, ty, px, py);
    grad.addColorStop(0, rgba(color, 0));
    grad.addColorStop(1, rgba(color, 0.95));
    ctx.strokeStyle = grad;
    ctx.lineWidth = (s.element === 'fire' ? 5 : 2.6) * s.power;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(px, py);
    ctx.stroke();

    ctx.fillStyle = rgba([255, 252, 240], 0.95);
    ctx.beginPath();
    ctx.arc(px, py, (s.element === 'fire' ? 3.4 : 2) * s.power, 0, Math.PI * 2);
    ctx.fill();

    if (s.element === 'fire' && Math.random() < 0.85) {
      particles.push({
        x: px,
        y: py,
        vx: rand(-18, 18),
        vy: rand(-30, 6),
        gravity: -60,
        life: 0,
        ttl: rand(0.2, 0.5),
        size: rand(0.7, 1.8),
        shard: false,
        spin: 0,
        rot: 0,
        color
      });
    }
  }

  /** 扇面：径向渐变的楔形 + 一道亮的波前弧。 */
  function drawSweep(s) {
    const t = s.life / s.ttl;
    const color = colorOf(s.element);
    const r = Math.max(2, s.reach * (1 - (1 - t) * (1 - t)));
    const fade = 1 - t;

    const grad = ctx.createRadialGradient(s.x, s.y, Math.max(1, r * 0.32), s.x, s.y, r);
    grad.addColorStop(0, rgba(color, 0));
    grad.addColorStop(0.72, rgba(color, 0.1 * fade * s.power));
    grad.addColorStop(1, rgba(color, 0.44 * fade * s.power));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.arc(s.x, s.y, r, s.a0, s.a1);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = rgba([255, 250, 235], 0.8 * fade);
    ctx.lineWidth = 2.4 * s.power;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, s.a0, s.a1);
    ctx.stroke();

    // 波前边缘甩出的碎屑，让扇面有厚度
    if (Math.random() < 0.9) {
      const a = rand(s.a0, s.a1);
      particles.push({
        x: s.x + Math.cos(a) * r,
        y: s.y + Math.sin(a) * r,
        vx: Math.cos(a) * rand(20, 90),
        vy: Math.sin(a) * rand(20, 90),
        gravity: s.element === 'ice' ? 260 : 40,
        life: 0,
        ttl: rand(0.16, 0.36),
        size: rand(0.7, 1.8),
        shard: s.element === 'ice',
        spin: rand(-6, 6),
        rot: 0,
        color
      });
    }
  }

  /** 折线上按比例取一段（连锁生长用）。 */
  function strokePartial(pts, ratio) {
    const total = Math.max(1, pts.length - 1);
    const end = ratio * total;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i += 1) {
      if (end >= i) {
        ctx.lineTo(pts[i].x, pts[i].y);
        continue;
      }
      const k = end - (i - 1);
      if (k > 0) {
        ctx.lineTo(pts[i - 1].x + (pts[i].x - pts[i - 1].x) * k, pts[i - 1].y + (pts[i].y - pts[i - 1].y) * k);
      }
      break;
    }
    ctx.stroke();
  }

  function drawChain(c) {
    const color = colorOf(c.element);
    c.legs.forEach((leg) => {
      const local = (c.life - leg.index * c.hop) / c.hop;
      if (local <= 0) return;
      const alpha = local < 1 ? 1 : Math.max(0, 1 - (local - 1) * 1.5);
      if (alpha <= 0) return;
      const ratio = Math.min(1, local);
      ctx.strokeStyle = rgba(color, alpha * 0.75);
      ctx.lineWidth = 6 * c.power;
      strokePartial(leg.bolt, ratio);
      ctx.strokeStyle = rgba([255, 255, 255], alpha * 0.92);
      ctx.lineWidth = 2.2 * c.power;
      strokePartial(leg.bolt, ratio);
    });
  }

  function frame(now) {
    const raw = Math.min(0.05, (now - last) / 1000 || 0.016);
    const dt = raw * timeScale;
    last = now;

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    shots = shots.filter((s) => {
      s.life += dt;
      if (s.life >= s.ttl) {
        detonate(s);
        return false;
      }
      drawShot(s);
      return true;
    });

    sweeps = sweeps.filter((s) => {
      s.life += dt;
      const t = Math.min(1, s.life / s.ttl);
      const r = s.reach * (1 - (1 - t) * (1 - t));
      for (const m of s.marks) {
        if (m.hit || r < m.dist) continue;
        m.hit = true;
        spawnParticles(m.x, m.y, s.element, Math.round(14 * s.power), s.power);
        spawnRing(m.x, m.y, s.element, s.power);
        s.onImpact?.(m.index);
      }
      if (s.life >= s.ttl) {
        // 兜底：扇面收了还有没扫到的（缩放后目标跑到 reach 外），一并结算
        for (const m of s.marks) {
          if (m.hit) continue;
          m.hit = true;
          s.onImpact?.(m.index);
        }
        return false;
      }
      drawSweep(s);
      return true;
    });

    chains = chains.filter((c) => {
      c.life += dt;
      for (const leg of c.legs) {
        if (leg.hit || c.life < (leg.index + 1) * c.hop) continue;
        leg.hit = true;
        spawnParticles(leg.to.x, leg.to.y, c.element, Math.round(12 * c.power), c.power);
        spawnRing(leg.to.x, leg.to.y, c.element, c.power, 'flash');
        c.onImpact?.(leg.index);
      }
      if (c.life >= c.ttl) {
        for (const leg of c.legs) {
          if (leg.hit) continue;
          leg.hit = true;
          c.onImpact?.(leg.index);
        }
        return false;
      }
      drawChain(c);
      return true;
    });

    rings = rings.filter((r) => {
      r.life += dt;
      const t = r.life / r.ttl;
      if (t >= 1) return false;
      const radius = r.r0 + (r.r1 - r.r0) * (1 - (1 - t) * (1 - t));
      const alpha = (1 - t) * (r.kind === 'flash' ? 0.85 : 0.6);
      ctx.strokeStyle = rgba(r.color, alpha);
      ctx.lineWidth = r.width * (1 - t * 0.6);
      ctx.beginPath();
      ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      return true;
    });

    particles = particles.filter((p) => {
      p.life += dt;
      if (p.life >= p.ttl) return false;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
      const t = p.life / p.ttl;
      const alpha = (1 - t) * (1 - t);
      ctx.fillStyle = rgba(p.color, alpha);
      if (p.shard) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size, -p.size * 2, p.size * 2, p.size * 4);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - t * 0.35), 0, Math.PI * 2);
        ctx.fill();
      }
      return true;
    });

    ctx.globalCompositeOperation = 'source-over';

    if (shots.length || sweeps.length || chains.length || particles.length || rings.length) {
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

  function clear() {
    shots = [];
    sweeps = [];
    chains = [];
    particles = [];
    rings = [];
    ctx.clearRect(0, 0, w, h);
  }

  function destroy() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    clear();
    ro?.disconnect();
  }

  return {
    fire,
    fan,
    chain,
    impact,
    resize,
    clear,
    destroy,
    setTimeScale: (k) => {
      timeScale = Math.max(0.05, Math.min(4, k || 1));
    },
    get busy() {
      return shots.length + sweeps.length + chains.length > 0;
    }
  };
}

export default createBallisticField;
