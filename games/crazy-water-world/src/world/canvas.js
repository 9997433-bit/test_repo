import { WEATHERS } from "../data/weather.js";
import { BUILDINGS } from "../data/buildings.js";
import { RESOURCE_META } from "../data/resources.js";
import { mulberry32 } from "../core/rng.js";

const CELL = 56;
const MIN_CELL = 18;
export const FLOTSAM_RADIUS = 20;

const ROOF = {
  hq: "#ef476f",
  house: "#f4a259",
  fish_chair: "#4cc9f0",
  fish_plant: "#ffb4a2",
  farm: "#8bc34a",
  seed: "#c9d84a",
  still: "#7ec8e3",
  salvage: "#c9843a",
  dive_dock: "#7c6ff0",
  radio: "#ffd166",
  workshop: "#8a93a0",
  wall: "#a2703c",
};

function hex(color) {
  const s = color.replace("#", "");
  const n = parseInt(s.length === 3 ? s.replace(/./g, (c) => c + c) : s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function shade(color, amount) {
  const [r, g, b] = hex(color);
  const mix = (c) => Math.round(amount > 0 ? c + (255 - c) * amount : c * (1 + amount));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// 布局是画面与点击的唯一真相：paintSea 与 canvasToCell / pickFlotsam 共用，
// 所以木筏原点不跟着浪上下漂，点哪就是哪。
export function seaLayout(state, w, h) {
  const cell = Math.max(
    MIN_CELL,
    Math.min(CELL, Math.floor(Math.min((w * 0.86) / state.raft.width, (h * 0.62) / state.raft.height))),
  );
  const raftW = state.raft.width * cell;
  const raftH = state.raft.height * cell;
  return {
    cell,
    w,
    h,
    horizon: h * 0.42,
    ox: Math.round(w / 2 - raftW / 2),
    oy: Math.round(h * 0.52 - raftH / 2),
    raftW,
    raftH,
  };
}

// 漂浮物只待在木筏两侧的开阔水面：既不会被甲板盖住，点击半径也永远露在外面。
function flotsamPoint(f, layout, t) {
  const r = FLOTSAM_RADIUS * (f.rare ? 0.62 : 0.5);
  const pad = r + 10;
  const leftGap = Math.max(0, layout.ox - pad);
  const rightGap = Math.max(0, layout.w - (layout.ox + layout.raftW + pad));
  const u = (Math.max(-1, Math.min(1, f.x)) + 1) / 2;
  const total = leftGap + rightGap;
  const slide = u * total;
  const x = total <= 0 ? u * layout.w : slide < leftGap ? slide : layout.ox + layout.raftW + pad + (slide - leftGap);
  const lane = Math.max(40, layout.h - layout.horizon - 44);
  const y = layout.horizon + 22 + Math.min(1, Math.max(0, (f.y + 0.1) / 0.6)) * lane + Math.sin(t / 400 + f.x * 4) * 5;
  return { x: Math.max(r + 2, Math.min(layout.w - r - 2, x)), y: Math.min(layout.h - r - 4, y), r };
}

function drawSky(ctx, state, layout, t, reduce) {
  const { w, h, horizon } = layout;
  const weather = WEATHERS[state.world.weather] || WEATHERS.clear;
  const g = ctx.createLinearGradient(0, 0, 0, horizon);
  g.addColorStop(0, weather.sky[0]);
  g.addColorStop(1, shade(weather.sky[0], 0.25));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, horizon + 2);

  const day = Math.sin(state.world.timeOfDay * Math.PI * 2);
  const u = (state.world.timeOfDay % 0.5) / 0.5;
  const bx = w * (0.1 + u * 0.8);
  const by = horizon - Math.sin(u * Math.PI) * h * 0.3 - 10;
  ctx.fillStyle = day >= 0 ? "#ffe08a" : "#eef3f7";
  ctx.beginPath();
  ctx.arc(bx, by, day >= 0 ? 22 : 16, 0, Math.PI * 2);
  ctx.fill();
  if (day >= 0) {
    ctx.fillStyle = "rgba(255, 224, 138, 0.25)";
    ctx.beginPath();
    ctx.arc(bx, by, 34, 0, Math.PI * 2);
    ctx.fill();
  }

  const rng = mulberry32(state.world.seaSeed >>> 0);
  const drift = reduce ? 0 : t / 90;
  for (let i = 0; i < 5; i += 1) {
    const base = rng() * w;
    const cy = 24 + rng() * (horizon * 0.42);
    const scale = 0.7 + rng() * 0.7;
    const cx = ((base + drift * scale) % (w + 200)) - 100;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + rng() * 0.25})`;
    for (const [dx, dy, r] of [
      [0, 0, 18],
      [16, 4, 13],
      [-16, 5, 12],
      [6, -8, 12],
    ]) {
      ctx.beginPath();
      ctx.arc(cx + dx * scale, cy + dy * scale, r * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawSea(ctx, state, layout, t, reduce) {
  const { w, h, horizon } = layout;
  const weather = WEATHERS[state.world.weather] || WEATHERS.clear;
  const deep = weather.sky[1];
  const g = ctx.createLinearGradient(0, horizon, 0, h);
  g.addColorStop(0, shade(deep, 0.25));
  g.addColorStop(1, shade(deep, -0.35));
  ctx.fillStyle = g;
  ctx.fillRect(0, horizon, w, h - horizon);

  const rough = weather.damage > 0 ? 1.8 : 1;
  const bands = [
    { y: horizon, amp: 5 * rough, len: 46, speed: 520, color: shade(deep, 0.34), foam: true },
    { y: horizon + h * 0.11, amp: 7 * rough, len: 62, speed: 700, color: shade(deep, 0.12), foam: false },
    { y: horizon + h * 0.3, amp: 9 * rough, len: 88, speed: 900, color: shade(deep, -0.14), foam: false },
  ];
  for (const band of bands) {
    const amp = reduce ? 0 : band.amp;
    const phase = reduce ? 0 : t / band.speed;
    ctx.fillStyle = band.color;
    ctx.beginPath();
    ctx.moveTo(0, band.y);
    for (let x = 0; x <= w; x += 10) ctx.lineTo(x, band.y + Math.sin(x / band.len + phase) * amp);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    if (band.foam) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 10) {
        const y = band.y + Math.sin(x / band.len + phase) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
}

function drawRaft(ctx, state, layout, t, reduce) {
  const { cell, ox, oy } = layout;
  const bob = reduce ? 0 : Math.sin(t / 900) * 2;

  ctx.fillStyle = "rgba(6, 21, 27, 0.22)";
  roundRect(ctx, ox - 6, oy + layout.raftH - 6 + bob, layout.raftW + 12, 18, 9);
  ctx.fill();

  for (let y = 0; y < state.raft.height; y += 1) {
    for (let x = 0; x < state.raft.width; x += 1) {
      const px = ox + x * cell;
      const py = oy + y * cell + bob;
      ctx.fillStyle = (x + y) % 2 === 0 ? "#d59a4c" : "#c58637";
      roundRect(ctx, px + 1, py + 1, cell - 3, cell - 3, Math.max(3, cell * 0.12));
      ctx.fill();
      ctx.strokeStyle = "rgba(122, 74, 30, 0.75)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.strokeStyle = "rgba(122, 74, 30, 0.28)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 4, py + cell / 2);
      ctx.lineTo(px + cell - 6, py + cell / 2);
      ctx.stroke();
    }
  }

  ctx.fillStyle = "#8d6742";
  for (const [cx, cy] of [
    [ox, oy + bob],
    [ox + layout.raftW - 8, oy + bob],
    [ox, oy + layout.raftH - 8 + bob],
    [ox + layout.raftW - 8, oy + layout.raftH - 8 + bob],
  ]) {
    ctx.beginPath();
    ctx.arc(cx + 4, cy + 4, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  return bob;
}

function drawBuildings(ctx, state, layout, bob) {
  const { cell, ox, oy } = layout;
  for (const b of state.buildings) {
    const def = BUILDINGS[b.type];
    if (!def) continue;
    const turned = b.rot === 90;
    const bw = (turned ? def.h : def.w) * cell - 8;
    const bh = (turned ? def.w : def.h) * cell - 8;
    const px = ox + b.x * cell + 4;
    const py = oy + b.y * cell + 4 + bob;
    const tint = ROOF[b.type] || "#ffd166";

    ctx.fillStyle = "rgba(6, 21, 27, 0.18)";
    roundRect(ctx, px + 2, py + 4, bw, bh, 8);
    ctx.fill();

    ctx.fillStyle = "#fff7e8";
    roundRect(ctx, px, py, bw, bh, 8);
    ctx.fill();
    ctx.strokeStyle = "#16323c";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = tint;
    roundRect(ctx, px, py, bw, Math.max(8, bh * 0.34), 8);
    ctx.fill();

    if (cell >= 34) {
      ctx.fillStyle = "#16323c";
      ctx.font = `${Math.max(10, Math.round(cell * 0.2))}px 'Noto Sans SC', sans-serif`;
      ctx.fillText(def.name, px + 6, py + bh - 10);
      for (let i = 0; i < Math.min(b.level, 8); i += 1) {
        ctx.fillStyle = "#ffd166";
        ctx.beginPath();
        ctx.arc(px + 8 + i * 7, py + bh - 5, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (b.occupantHeroId) {
      ctx.fillStyle = "#ef476f";
      ctx.beginPath();
      ctx.arc(px + bw - 8, py + 8, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawFlotsam(ctx, state, layout, t) {
  for (const f of state.explore?.salvage?.flotsam || []) {
    const p = flotsamPoint(f, layout, t);
    ctx.fillStyle = "rgba(6, 21, 27, 0.18)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + p.r * 0.9, p.r, p.r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = RESOURCE_META[f.res]?.color || "#fff";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(22, 50, 60, 0.7)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.beginPath();
    ctx.arc(p.x - p.r * 0.3, p.y - p.r * 0.35, p.r * 0.25, 0, Math.PI * 2);
    ctx.fill();

    if (f.rare) {
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      for (const a of [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2]) {
        ctx.moveTo(p.x + Math.cos(a) * (p.r + 8), p.y + Math.sin(a) * (p.r + 8));
        ctx.lineTo(p.x + Math.cos(a) * (p.r + 12), p.y + Math.sin(a) * (p.r + 12));
      }
      ctx.stroke();
    }
  }
}

function drawWeatherOverlay(ctx, state, layout, t, reduce) {
  const { w, h } = layout;
  const id = state.world.weather;
  if (id === "haze") {
    ctx.fillStyle = "rgba(226, 235, 240, 0.22)";
    ctx.fillRect(0, 0, w, h);
  }
  if (id === "rain" || id === "storm" || id === "tsunami") {
    const rng = mulberry32((state.world.seaSeed ^ 0x9e3779b9) >>> 0);
    const drops = id === "rain" ? 60 : 110;
    ctx.strokeStyle = id === "rain" ? "rgba(220, 240, 255, 0.5)" : "rgba(210, 235, 255, 0.65)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < drops; i += 1) {
      const x0 = rng() * w;
      const y0 = rng() * h;
      const fall = reduce ? 0 : ((t / 2.2 + i * 37) % h);
      const y = (y0 + fall) % h;
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 - 4, y + 14);
    }
    ctx.stroke();
  }
  if (id === "storm" || id === "tsunami") {
    ctx.fillStyle = id === "tsunami" ? "rgba(58, 16, 32, 0.22)" : "rgba(6, 21, 27, 0.2)";
    ctx.fillRect(0, 0, w, h);
  }
  const day = Math.sin(state.world.timeOfDay * Math.PI * 2);
  if (day < -0.05) {
    ctx.fillStyle = `rgba(10, 26, 48, ${Math.min(0.58, (-day - 0.05) * 0.75).toFixed(3)})`;
    ctx.fillRect(0, 0, w, h);
  }
}

export function paintSea(canvas, state, t) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = Math.min(2, (typeof window !== "undefined" && window.devicePixelRatio) || 1);
  const w = canvas.clientWidth || canvas.width || 1;
  const h = canvas.clientHeight || canvas.height || 1;
  if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const reduce = !!state.settings?.reduceMotion;
  const time = reduce ? 0 : t;
  const layout = seaLayout(state, w, h);

  drawSky(ctx, state, layout, time, reduce);
  drawSea(ctx, state, layout, time, reduce);
  const bob = drawRaft(ctx, state, layout, time, reduce);
  drawBuildings(ctx, state, layout, bob);
  drawFlotsam(ctx, state, layout, time);
  drawWeatherOverlay(ctx, state, layout, time, reduce);
}

function canvasSize(canvas) {
  const rect = typeof canvas.getBoundingClientRect === "function" ? canvas.getBoundingClientRect() : null;
  return {
    left: rect?.left || 0,
    top: rect?.top || 0,
    w: rect?.width || canvas.clientWidth || canvas.width || 1,
    h: rect?.height || canvas.clientHeight || canvas.height || 1,
  };
}

export function canvasToCell(canvas, state, clientX, clientY) {
  const box = canvasSize(canvas);
  const layout = seaLayout(state, box.w, box.h);
  return {
    x: Math.floor((clientX - box.left - layout.ox) / layout.cell),
    y: Math.floor((clientY - box.top - layout.oy) / layout.cell),
  };
}

// 二维命中：以前只比横坐标，整条竖列都能捡。现在必须真的点到漂浮物那一小圈。
export function pickFlotsam(canvas, state, clientX, clientY, t = 0) {
  const box = canvasSize(canvas);
  const layout = seaLayout(state, box.w, box.h);
  const time = state.settings?.reduceMotion ? 0 : t;
  const px = clientX - box.left;
  const py = clientY - box.top;
  let best = null;
  let bestD = Infinity;
  for (const f of state.explore?.salvage?.flotsam || []) {
    const p = flotsamPoint(f, layout, time);
    const reach = p.r + 10;
    const d = Math.hypot(px - p.x, py - p.y);
    if (d <= reach && d < bestD) {
      best = f;
      bestD = d;
    }
  }
  return best;
}

export { flotsamPoint };
