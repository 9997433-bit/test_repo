/**
 * 粒子系统：雪、暴风雪横流、火星、炊烟、霜雾。
 *
 * 雪与横流在「屏幕空间」运行（不随镜头平移而穿帮）；
 * 火星与炊烟在「世界空间」运行（跟随建筑一起平移缩放）。
 */

const TAU = Math.PI * 2;

function rnd(a, b) {
  return a + Math.random() * (b - a);
}

/* ============================================================
   画质预算（全模块共享）
   ------------------------------------------------------------
   寒潮把雪量顶到上限时最容易掉帧。密度先被「画布面积」限死，
   再乘一个按实测帧耗时升降的系数：慢下来就抽稀，缓过来再放开。
   ============================================================ */

const QUALITY_MIN = 0.36;
/** 帧耗时超过它（约 48fps）开始降密度 */
const FRAME_BUDGET_MS = 21;
/**
 * 回到它以下才慢慢放开。必须**高于** 60Hz 垂直同步的 16.7ms：
 * 阈值压到 16.7 以下的话，跑满 60fps 也永远判不出「缓过来了」，
 * 开局加载那几帧一掉，密度就再也回不去。
 */
const FRAME_EASY_MS = 17.6;

const perf = { quality: 1, ema: 16.7, last: 0 };

const nowMs = () =>
  typeof performance === "object" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();

/**
 * 每帧调用一次（由雪场的 update 负责），返回 0.36~1 的画质系数。
 * 用自测的墙钟时间而不是外部传进来的 dt——渲染层的 dt 被倍速缩放过，
 * 拿它当帧耗时会在暂停/加速时误判。
 */
function tunePerf() {
  const t = nowMs();
  const prev = perf.last;
  perf.last = t;
  if (!prev) return perf.quality;
  const dt = t - prev;
  // 切走标签页再回来的那一帧不算数
  if (!(dt > 0) || dt > 400) return perf.quality;
  perf.ema += (dt - perf.ema) * 0.12;
  // 降得快、升得慢：掉帧要立刻止血，恢复则慢慢来，免得在阈值上来回抖
  if (perf.ema > FRAME_BUDGET_MS) {
    perf.quality = Math.max(QUALITY_MIN, perf.quality - 0.03);
  } else if (perf.ema < FRAME_EASY_MS) {
    perf.quality = Math.min(1, perf.quality + 0.008);
  }
  return perf.quality;
}

/** 当前画质系数（0.36~1），其他渲染模块可以按它抽稀自己的装饰。 */
export function renderQuality() {
  return perf.quality;
}

/* ============================================================
   雪场（屏幕空间）
   ============================================================ */

/** 池子上限；单帧实际参与更新/绘制的数量另有更严的动态上限。 */
export const SNOW_MAX = 1400;
/** 无风雪时的基础雪量 */
const SNOW_BASE = 340;
/** 每片雪花摊到的画布像素：越大越稀，用来给小窗口减负 */
const PX_PER_FLAKE = 1000;

export function createSnowField() {
  const flakes = new Array(SNOW_MAX);
  let w = 1;
  let h = 1;
  let seeded = false;
  // update 定下的当帧数量，drawBack / drawFront 复用，避免两趟数量对不上
  let live = SNOW_BASE;

  for (let i = 0; i < SNOW_MAX; i++) {
    flakes[i] = {
      x: 0, y: 0,
      z: Math.random(),          // 0 远 / 1 近
      r: 0,
      vy: 0,
      swayAmp: 0,
      swayHz: 0,
      phase: Math.random() * TAU,
      spin: rnd(-1.4, 1.4),
      crystal: Math.random() < 0.1,
    };
  }

  function place(f, initial) {
    f.z = Math.random();
    f.r = 0.5 + f.z * f.z * 2.6;
    f.vy = 14 + f.z * 46;
    f.swayAmp = 4 + f.z * 16;
    f.swayHz = rnd(0.16, 0.55);
    f.phase = Math.random() * TAU;
    f.x = Math.random() * w;
    f.y = initial ? Math.random() * h : -8 - Math.random() * 40;
  }

  function resize(nw, nh) {
    w = Math.max(1, nw);
    h = Math.max(1, nh);
    if (!seeded) {
      for (const f of flakes) place(f, true);
      seeded = true;
    }
  }

  /** @param env {{ intensity:number, wind:number, dt:number }} */
  function update(dt, env) {
    tunePerf();
    const intensity = Math.max(0, Math.min(1, env?.intensity ?? 0)); // 0 = 微雪, 1 = 暴风雪
    const gust = env?.wind ?? 0;                // -1 .. 1
    const count = activeCount(intensity);
    live = count;
    const speedK = 1 + intensity * 2.35;
    const drift = gust * (26 + intensity * 210);

    for (let i = 0; i < count; i++) {
      const f = flakes[i];
      f.phase += dt * f.swayHz * TAU;
      const sway = Math.sin(f.phase) * f.swayAmp * (1 - intensity * 0.7);
      f.y += f.vy * speedK * dt;
      f.x += (sway * 0.06 + drift * (0.35 + f.z * 0.9)) * dt;

      if (f.y > h + 10) place(f, false);
      else if (f.x < -30) f.x += w + 60;
      else if (f.x > w + 30) f.x -= w + 60;
    }
  }

  /**
   * 寒潮下雪量随强度上升，但要先过两道闸：
   *   · 画布面积闸——小窗口里 1400 片纯属浪费；
   *   · 画质闸——真掉帧了就整体抽稀。
   *
   * 画质系数是**乘**在结果上的，不是又一条封顶线：封顶的写法在慢机器上
   * 会让寒潮和晴夜落一样多的雪，寒潮就白来了。乘法则保证无论快慢，
   * 寒潮永远比平时密一大截，只是绝对量跟着机器走。
   */
  function activeCount(intensity) {
    const k = Math.max(0, Math.min(1, intensity));
    const byArea = Math.round((w * h) / PX_PER_FLAKE);
    const cap = Math.max(240, Math.min(SNOW_MAX, byArea));
    const want = SNOW_BASE + k * (SNOW_MAX - SNOW_BASE);
    return Math.max(80, Math.min(SNOW_MAX, Math.round(Math.min(cap, want) * perf.quality)));
  }

  /** 远景层：细小、暗淡，画在城池之前 */
  function drawBack(ctx, env) {
    const count = live;
    ctx.save();
    ctx.fillStyle = "#cfeafa";
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const f = flakes[i];
      if (f.z > 0.45) continue;
      ctx.globalAlpha = 1;
      ctx.moveTo(f.x + f.r, f.y);
      ctx.arc(f.x, f.y, f.r, 0, TAU);
    }
    ctx.globalAlpha = 0.34 + env.intensity * 0.24;
    ctx.fill();
    ctx.restore();
  }

  /** 近景层：大颗粒 + 暴风雪横流 */
  function drawFront(ctx, env) {
    const count = live;
    const intensity = Math.max(0, Math.min(1, env?.intensity ?? 0));

    ctx.save();
    ctx.fillStyle = "#f2fbff";
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const f = flakes[i];
      if (f.z <= 0.45 || f.crystal) continue;
      ctx.moveTo(f.x + f.r, f.y);
      ctx.arc(f.x, f.y, f.r, 0, TAU);
    }
    ctx.globalAlpha = 0.62 + intensity * 0.3;
    ctx.fill();

    // 少量六角雪晶（近景点缀）
    ctx.globalAlpha = 0.5 + intensity * 0.3;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const f = flakes[i];
      if (!f.crystal || f.z < 0.7) continue;
      const s = f.r * 1.9;
      const a = f.phase * 0.4;
      for (let k = 0; k < 3; k++) {
        const ang = a + (k * Math.PI) / 3;
        ctx.moveTo(f.x - Math.cos(ang) * s, f.y - Math.sin(ang) * s);
        ctx.lineTo(f.x + Math.cos(ang) * s, f.y + Math.sin(ang) * s);
      }
    }
    ctx.stroke();

    // 暴风雪横流：条数同样受画质闸约束，且不会超过在场的雪花数
    if (intensity > 0.08) {
      const streaks = Math.min(count, Math.round(intensity * 88 * perf.quality));
      ctx.globalAlpha = 0.06 + intensity * 0.2;
      ctx.strokeStyle = "#e8f8ff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < streaks; i++) {
        const f = flakes[(i * 7 + 3) % count];
        const len = 40 + intensity * 190 * (0.3 + f.z);
        ctx.moveTo(f.x, f.y);
        ctx.lineTo(f.x - len * Math.sign(env.wind || 1), f.y + len * 0.14);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  return { resize, update, drawBack, drawFront };
}

/* ============================================================
   火星 / 炊烟（世界空间）
   ============================================================ */

export function createEmberField(max = 260) {
  const pool = [];
  for (let i = 0; i < max; i++) pool.push({ alive: false });
  let cursor = 0;

  function spawn(kind, x, y, opts = {}) {
    // 掉帧时按画质系数抽稀：火星本来就是散点，少几粒看不出来
    if (perf.quality < 0.85 && Math.random() > perf.quality) return;
    const p = pool[cursor];
    cursor = (cursor + 1) % max;
    p.alive = true;
    p.kind = kind;
    p.x = x + rnd(-(opts.spread ?? 6), opts.spread ?? 6);
    p.y = y + rnd(-3, 3);
    p.life = 0;
    p.max = opts.life ?? (kind === "smoke" ? rnd(2.4, 4.2) : rnd(0.9, 2.1));
    p.vx = opts.vx ?? rnd(-7, 7);
    p.vy = opts.vy ?? (kind === "smoke" ? rnd(-16, -28) : rnd(-30, -62));
    p.size = opts.size ?? (kind === "smoke" ? rnd(4, 9) : rnd(0.9, 2.1));
    p.hue = opts.hue ?? rnd(20, 44);
    p.wob = Math.random() * TAU;
  }

  function update(dt, env) {
    const wind = (env?.wind ?? 0) * 34;
    for (const p of pool) {
      if (!p.alive) continue;
      p.life += dt;
      if (p.life >= p.max) { p.alive = false; continue; }
      p.wob += dt * 2.4;
      p.vy += (p.kind === "smoke" ? -3 : -12) * dt;
      p.x += (p.vx + wind + Math.sin(p.wob) * 9) * dt;
      p.y += p.vy * dt;
    }
  }

  function draw(ctx) {
    ctx.save();
    // 炊烟
    ctx.globalCompositeOperation = "source-over";
    for (const p of pool) {
      if (!p.alive || p.kind !== "smoke") continue;
      const t = p.life / p.max;
      const r = p.size * (1 + t * 2.4);
      ctx.globalAlpha = (1 - t) * 0.16;
      ctx.fillStyle = "#b9d6e2";
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, TAU);
      ctx.fill();
    }
    // 火星
    ctx.globalCompositeOperation = "lighter";
    for (const p of pool) {
      if (!p.alive || p.kind === "smoke") continue;
      const t = p.life / p.max;
      const a = (1 - t) * (1 - t);
      ctx.globalAlpha = a;
      ctx.fillStyle = `hsl(${p.hue}, 100%, ${58 + a * 30}%)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - t * 0.45), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  return { spawn, update, draw };
}

/* ============================================================
   霜雾 / 寒潮全屏叠加（屏幕空间）
   ============================================================ */

/** 全屏霜晕的径向渐变按尺寸 + 强度档缓存，免得逐帧重建。 */
const frostGrads = new Map();
function frostGradient(ctx, w, h, k) {
  const step = Math.round(k * 12);              // 强度分 12 档，肉眼看不出跳变
  const key = `${w}x${h}@${step}`;
  let g = frostGrads.get(key);
  if (!g) {
    const a = step / 12;
    g = ctx.createRadialGradient(
      w * 0.5, h * 0.52, Math.min(w, h) * 0.22,
      w * 0.5, h * 0.5, Math.max(w, h) * 0.78,
    );
    g.addColorStop(0, "rgba(214,242,255,0)");
    g.addColorStop(0.62, `rgba(200,236,255,${0.06 * a})`);
    g.addColorStop(1, `rgba(224,246,255,${0.4 * a})`);
    if (frostGrads.size > 24) frostGrads.clear();
    frostGrads.set(key, g);
  }
  return g;
}

export function drawFrostOverlay(ctx, w, h, time, intensity) {
  if (intensity <= 0.01) return;
  ctx.save();

  // 边缘结霜
  const k = Math.min(1, intensity);
  ctx.fillStyle = frostGradient(ctx, w, h, k);
  ctx.fillRect(0, 0, w, h);

  // 霜针（角落生长）：根数随强度长，但压在画质闸下
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = `rgba(230,248,255,${0.16 * k})`;
  ctx.lineWidth = 1;
  const spikes = Math.max(5, Math.round(16 * k * perf.quality));
  const corners = [[0, 0, 1, 1], [w, 0, -1, 1], [0, h, 1, -1], [w, h, -1, -1]];
  for (let c = 0; c < corners.length; c++) {
    const [ox, oy, sx, sy] = corners[c];
    ctx.beginPath();
    for (let i = 0; i < spikes; i++) {
      const seed = c * 17 + i * 3.7;
      const grow = (0.5 + 0.5 * Math.sin(time * 0.4 + seed)) * k;
      const len = (52 + ((seed * 37) % 110)) * grow;
      const ang = (0.16 + ((seed * 13) % 100) / 100 * 1.24);
      const ex = ox + sx * Math.cos(ang) * len;
      const ey = oy + sy * Math.sin(ang) * len;
      ctx.moveTo(ox + sx * ((seed * 7) % 60), oy + sy * ((seed * 11) % 60));
      ctx.lineTo(ex, ey);
      // 分枝
      ctx.moveTo((ox + ex) / 2, (oy + ey) / 2);
      ctx.lineTo((ox + ex) / 2 + sx * 12 * grow, (oy + ey) / 2 - sy * 9 * grow);
    }
    ctx.stroke();
  }

  // 白化
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = `rgba(196,232,248,${0.1 * k})`;
  ctx.fillRect(0, 0, w, h);

  ctx.restore();
}

/** 冷冽的地面吹雪（世界空间，贴地流动的薄雾带） */
export function drawGroundDrift(ctx, bounds, time, intensity) {
  if (intensity <= 0.02) return;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const bands = Math.max(2, Math.round(5 * perf.quality));
  for (let i = 0; i < bands; i++) {
    const t = (time * (0.05 + i * 0.022) + i * 0.31) % 1;
    const y = bounds.y0 + (bounds.y1 - bounds.y0) * t;
    const a = intensity * 0.11 * Math.sin(Math.PI * t);
    if (a <= 0.002) continue;
    const g = ctx.createLinearGradient(bounds.x0, y, bounds.x1, y);
    g.addColorStop(0, "rgba(220,244,255,0)");
    g.addColorStop(0.5, `rgba(226,246,255,${a})`);
    g.addColorStop(1, "rgba(220,244,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(bounds.x0, y - 12 - i * 3, bounds.x1 - bounds.x0, 24 + i * 6);
  }
  ctx.restore();
}
