/**
 * 城池渲染器 — Canvas 2D 斜视（2.5D）冬夜场景。
 *
 * 层次：夜空/极光 → 雪山 → 远雪原 → 结冰河面 → 雪原台地 → 城墙(后) →
 *       建筑 & 城民（按深度混排）→ 城墙(前) → 火星 → 近景雪 → 暖冷调色 → 霜雾
 */

import {
  createSnowField,
  createEmberField,
  drawFrostOverlay,
  drawGroundDrift,
} from "./particles.js";
import { createVillagerCrowd } from "./villagers.js";

/* ── 等距投影 ─────────────────────────────────────────────── */
const TW = 92;
const TH = 46;
const TW2 = TW / 2;
const TH2 = TH / 2;
const TAU = Math.PI * 2;

const CX = 4;   // 城池中心网格
const CY = 4;

/** 画面构图：地平线在屏幕 36% 处，其上是夜空与雪山，其下是冰面与雪原台地。 */
const HORIZON_FRAC = 0.36;
/** 台地下方岸壁的厚度（drawPlateau 里向下偏移的量） */
const BANK_DROP = 17;

export function isoPt(gx, gy) {
  return { x: (gx - gy) * TW2, y: (gx + gy) * TH2 };
}
function unIso(x, y) {
  return { gx: (x / TW2 + y / TH2) / 2, gy: (y / TH2 - x / TW2) / 2 };
}

/* ── 建筑美术表 ───────────────────────────────────────────── */
/** roof: gable | hip | pagoda | flat | none */
export const CITY_LAYOUT = {
  furnace:  { gx: 4.0, gy: 4.0, w: 2.3, d: 2.3, h: 12, roof: "none",   base: "#6d818f", special: "furnace", icon: "🔥" },
  house:    { gx: 0.7, gy: 3.6, w: 1.7, d: 1.7, h: 19, roof: "gable",  base: "#8a6a49", props: "huts",     icon: "🏠", role: "home" },
  lumber:   { gx: 7.5, gy: 4.3, w: 1.7, d: 1.5, h: 18, roof: "gable",  base: "#7d6142", props: "logs",     icon: "🪓", role: "work", yield: "wood" },
  hunter:   { gx: 7.0, gy: 6.0, w: 1.4, d: 1.4, h: 16, roof: "gable",  base: "#84714f", props: "racks",    icon: "🏹", role: "work", yield: "food" },
  coal:     { gx: 5.5, gy: 7.2, w: 1.6, d: 1.4, h: 15, roof: "flat",   base: "#4a545d", props: "coal",     icon: "⛏️", role: "work", yield: "coal" },
  storage:  { gx: 3.8, gy: 7.4, w: 1.7, d: 1.5, h: 17, roof: "hip",    base: "#7a6047", props: "crates",   icon: "📦", role: "work", yield: "food" },
  iron:     { gx: 2.0, gy: 7.0, w: 1.6, d: 1.4, h: 15, roof: "flat",   base: "#4d5865", props: "iron",     icon: "⚒️", role: "work", yield: "iron" },
  barracks: { gx: 0.9, gy: 5.4, w: 1.9, d: 1.6, h: 21, roof: "gable",  base: "#5f6a55", props: "banners",  icon: "🛡️", role: "work" },
  recruit:  { gx: 1.5, gy: 2.0, w: 1.6, d: 1.6, h: 20, roof: "pagoda", base: "#8e453c", props: "lanterns", icon: "🏮", role: "work" },
  kitchen:  { gx: 3.1, gy: 0.9, w: 1.4, d: 1.3, h: 16, roof: "gable",  base: "#7d6142", props: "steam",    icon: "🍲", role: "work", yield: "food" },
  clinic:   { gx: 4.7, gy: 0.7, w: 1.4, d: 1.3, h: 17, roof: "gable",  base: "#4f7a68", props: "banner",   icon: "🌿", role: "work" },
  academy:  { gx: 6.4, gy: 1.6, w: 1.8, d: 1.6, h: 23, roof: "pagoda", base: "#3f6b78", props: "scrolls",  icon: "📜", role: "work" },
  wall:     { gx: 8.6, gy: 8.6, w: 1.5, d: 1.5, h: 30, roof: "flat",   base: "#5c6a74", special: "wall",   icon: "🧱" },
};

const WALL_R = 6.3;
const WALL_SIDES = 8;

/** 城民的通勤节点：民居（含 props 里画出的附屋）为家，工坊为工位 */
const HEARTH_NODE = { key: "hearth", gx: CX, gy: CY + 1.5 };
const CROWD_NODES = (() => {
  const list = [];
  for (const [key, a] of Object.entries(CITY_LAYOUT)) {
    if (a.special || !a.role) continue;
    list.push({ key, gx: a.gx, gy: a.gy, role: a.role, yield: a.yield });
    // 民居旁的附屋（drawProps "huts" 会把它们画出来）也算住处，避免全城挤一间房
    if (a.props === "huts") {
      for (let i = 0; i < 3; i++) {
        const ang = 1.1 + i * 1.5;
        list.push({
          key: `${key}#${i}`,
          gx: a.gx + Math.cos(ang) * 1.25,
          gy: a.gy + Math.sin(ang) * 1.1,
          role: "home",
        });
      }
    }
  }
  return list;
})();

/* ── 颜色工具 ─────────────────────────────────────────────── */
const hexCache = new Map();
function rgbOf(hex) {
  let v = hexCache.get(hex);
  if (!v) {
    const h = hex.replace("#", "");
    v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    hexCache.set(hex, v);
  }
  return v;
}
function css(r, g, b, a = 1) {
  return a >= 1
    ? `rgb(${r | 0},${g | 0},${b | 0})`
    : `rgba(${r | 0},${g | 0},${b | 0},${a})`;
}
/** 明暗 + 冷暖混合 */
function shadeWarm(hex, light, warm, a = 1) {
  const [r, g, b] = rgbOf(hex);
  // 冷夜基调：整体压暗并偏青
  let R = r * light;
  let G = g * light * 1.02;
  let B = b * light * 1.16;
  if (warm > 0) {
    R = R + (255 - R) * warm * 0.62;
    G = G + (176 - G) * warm * 0.44;
    B = B + (96 - B) * warm * 0.3;
  }
  return css(Math.min(255, R), Math.min(255, G), Math.min(255, B), a);
}

/* ── 噪声 ─────────────────────────────────────────────────── */
function hash1(n) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x, seed) {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash1(i + seed * 57.3);
  const b = hash1(i + 1 + seed * 57.3);
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
}
function fbm(x, seed, oct = 4) {
  let s = 0, amp = 0.5, fr = 1;
  for (let i = 0; i < oct; i++) {
    s += vnoise(x * fr, seed + i * 3.1) * amp;
    amp *= 0.5;
    fr *= 2.07;
  }
  return s;
}

/* ── 光晕精灵（避免逐帧建渐变） ───────────────────────────── */
function makeGlowSprite(rgb, size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, `rgba(${rgb},1)`);
  grd.addColorStop(0.28, `rgba(${rgb},0.55)`);
  grd.addColorStop(0.62, `rgba(${rgb},0.16)`);
  grd.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return c;
}

/* ============================================================
   渲染器
   ============================================================ */
export function createCityRenderer({ canvas }) {
  const ctx = canvas.getContext("2d", { alpha: false });
  const snow = createSnowField();
  const embers = createEmberField(300);
  const crowd = createVillagerCrowd();

  let dpr = 1;
  let W = 800;
  let H = 500;
  let backdrop = null;
  let backdropKey = "";
  let glowWarm = null;
  let glowCold = null;

  const cam = { x: 0, y: 40, zoom: 1, minZoom: 0.4, maxZoom: 2.4 };
  let fitZoom = 1;
  let fitCamY = 40;
  let fitCamX = 0;
  let camMoved = false;

  let time = 0;
  let flicker = 1;
  let hoverKey = null;
  let pointer = null;
  const pulses = new Map();

  // 台地轮廓（网格空间，带噪声的圆）
  const PLATEAU = [];
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * TAU;
    const r = 8.0 + fbm(i * 0.32, 11, 3) * 1.5 - 0.4;
    PLATEAU.push({ gx: CX + Math.cos(a) * r, gy: CY + Math.sin(a) * r });
  }

  // 台地在世界坐标里的包围盒（含岸壁与建筑天际线），用于自动取景
  const FRAME = (() => {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of PLATEAU) {
      const w = isoPt(p.gx, p.gy);
      x0 = Math.min(x0, w.x); x1 = Math.max(x1, w.x);
      y0 = Math.min(y0, w.y); y1 = Math.max(y1, w.y);
    }
    // 后排建筑的屋脊可能高过台地后缘
    for (const art of Object.values(CITY_LAYOUT)) {
      const w = isoPt(art.gx, art.gy);
      const top = art.special === "furnace" ? 110 : art.h * 1.34 + 40;
      y0 = Math.min(y0, w.y - top);
    }
    return { x0, x1, y0, y1: y1 + BANK_DROP };
  })();

  // 城墙八边形顶点
  const WALL_PTS = [];
  for (let i = 0; i < WALL_SIDES; i++) {
    const a = (i / WALL_SIDES) * TAU + Math.PI / WALL_SIDES;
    WALL_PTS.push({ gx: CX + Math.cos(a) * WALL_R, gy: CY + Math.sin(a) * WALL_R });
  }

  // 冰面裂纹（一次生成）
  const CRACKS = [];
  for (let i = 0; i < 22; i++) {
    const pts = [];
    let x = -900 + hash1(i * 3.3) * 1800;
    let y = 380 + hash1(i * 7.7) * 520;
    const n = 4 + ((i * 5) % 4);
    for (let k = 0; k < n; k++) {
      pts.push({ x, y });
      x += (hash1(i * 13 + k) - 0.5) * 260;
      y += (hash1(i * 19 + k) - 0.2) * 90;
    }
    CRACKS.push(pts);
  }

  /* ── 尺寸 ───────────────────────────────────────────────── */
  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(320, Math.round(rect.width));
    H = Math.max(240, Math.round(rect.height));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    snow.resize(W, H);

    // 取景：台地后缘正好落在地平线下方一点，上方留出夜空与雪山
    const usableH = H * (1 - HORIZON_FRAC) - 18;
    const contentW = FRAME.x1 - FRAME.x0;
    const contentH = FRAME.y1 - FRAME.y0;
    const zoomW = (W * 0.94) / contentW;
    // 高度吃紧时允许近岸略微出血到画面下缘，宽屏才不会显得城池太小
    const zoomH = (usableH / contentH) * 1.14;
    fitZoom = Math.max(0.32, Math.min(1.6, Math.min(zoomW, zoomH)));
    fitCamY = FRAME.y0 - (H * HORIZON_FRAC + 10 - H / 2) / fitZoom;
    fitCamX = (FRAME.x0 + FRAME.x1) / 2;

    cam.minZoom = fitZoom * 0.72;
    cam.maxZoom = fitZoom * 3.4;
    backdrop = null;
    if (!glowWarm) {
      glowWarm = makeGlowSprite("255,164,74", 160);
      glowCold = makeGlowSprite("150,214,240", 128);
    }
    // 玩家没有手动移动镜头时，尺寸变化后重新自动取景
    if (!camMoved) recenter();
    else cam.zoom = Math.max(cam.minZoom, Math.min(cam.maxZoom, cam.zoom || fitZoom));
  }

  function recenter() {
    cam.x = fitCamX;
    cam.y = fitCamY;
    cam.zoom = fitZoom;
    camMoved = false;
  }

  /** 地平线在世界坐标系里的 y（冰面从这里向下铺开） */
  function horizonWorldY() {
    return (H * HORIZON_FRAC - H / 2) / cam.zoom + cam.y;
  }

  function toScreen(wx, wy) {
    return { x: W / 2 + (wx - cam.x) * cam.zoom, y: H / 2 + (wy - cam.y) * cam.zoom };
  }
  function toWorld(sx, sy) {
    return { x: (sx - W / 2) / cam.zoom + cam.x, y: (sy - H / 2) / cam.zoom + cam.y };
  }
  function gridScreen(gx, gy) {
    const p = isoPt(gx, gy);
    return toScreen(p.x, p.y);
  }

  function panBy(dx, dy) {
    camMoved = true;
    cam.x -= dx / cam.zoom;
    cam.y -= dy / cam.zoom;
    cam.x = Math.max(fitCamX - 900, Math.min(fitCamX + 900, cam.x));
    cam.y = Math.max(fitCamY - 220, Math.min(fitCamY + 420, cam.y));
  }
  function zoomAt(sx, sy, factor) {
    camMoved = true;
    const before = toWorld(sx, sy);
    cam.zoom = Math.max(cam.minZoom, Math.min(cam.maxZoom, cam.zoom * factor));
    const after = toWorld(sx, sy);
    cam.x += before.x - after.x;
    cam.y += before.y - after.y;
  }

  /* ── 静态背景（夜空 / 雪山），按尺寸缓存 ─────────────────── */
  const BACKDROP_PAD = 90;

  function buildBackdrop() {
    const bw = W + BACKDROP_PAD * 2;
    const c = document.createElement("canvas");
    c.width = Math.round(bw * dpr);
    c.height = Math.round(H * dpr);
    const g = c.getContext("2d");
    g.scale(dpr, dpr);

    const BW = bw;                      // 背景比视口略宽，供视差平移
    const horizon = H * HORIZON_FRAC;

    // 夜空
    const sky = g.createLinearGradient(0, 0, 0, horizon + 30);
    sky.addColorStop(0, "#03101a");
    sky.addColorStop(0.42, "#062432");
    sky.addColorStop(0.78, "#0b3a4c");
    sky.addColorStop(1, "#11556a");
    g.fillStyle = sky;
    g.fillRect(0, 0, BW, horizon + 30);

    // 星
    for (let i = 0; i < 260; i++) {
      const x = hash1(i * 2.7) * BW;
      const y = hash1(i * 5.1) * horizon * 0.9;
      const a = 0.12 + hash1(i * 9.3) * 0.62 * (1 - y / horizon);
      const r = hash1(i * 11.7) < 0.9 ? 0.7 : 1.4;
      g.fillStyle = `rgba(226,246,255,${a})`;
      g.beginPath();
      g.arc(x, y, r, 0, TAU);
      g.fill();
    }

    // 冷月
    const mx = BW * 0.79;
    const my = horizon * 0.28;
    const halo = g.createRadialGradient(mx, my, 4, mx, my, 130);
    halo.addColorStop(0, "rgba(214,240,255,0.42)");
    halo.addColorStop(0.35, "rgba(170,214,238,0.12)");
    halo.addColorStop(1, "rgba(170,214,238,0)");
    g.fillStyle = halo;
    g.beginPath();
    g.arc(mx, my, 130, 0, TAU);
    g.fill();
    g.fillStyle = "#e6f6ff";
    g.beginPath();
    g.arc(mx, my, 17, 0, TAU);
    g.fill();
    g.fillStyle = "rgba(150,190,214,0.35)";
    g.beginPath();
    g.arc(mx - 5, my - 4, 3.4, 0, TAU);
    g.arc(mx + 6, my + 3, 2.4, 0, TAU);
    g.arc(mx + 1, my + 8, 1.8, 0, TAU);
    g.fill();

    // 三重雪山：山脚都压在地平线略下方，由冰面盖住接缝
    const amp = Math.max(78, horizon * 0.52);
    const ridges = [
      { base: horizon + 4, amp: amp * 1.32, seed: 3, top: "#4a889c", bot: "#255a6e", snow: 0.6, wave: 210 },
      { base: horizon + 8, amp: amp * 0.94, seed: 9, top: "#2d6577", bot: "#12404f", snow: 0.46, wave: 168 },
      { base: horizon + 12, amp: amp * 0.58, seed: 17, top: "#1a4759", bot: "#0a2b39", snow: 0.3, wave: 126 },
    ];
    for (const r of ridges) {
      const step = 5;
      const pts = [];
      for (let x = -12; x <= BW + 12; x += step) {
        const n = fbm(x / r.wave, r.seed, 5);
        const spike = Math.pow(Math.abs(Math.sin(x / (r.wave * 1.5) + r.seed)), 2.6);
        pts.push({ x, y: r.base - (n * 0.7 + spike * 0.52) * r.amp });
      }
      g.beginPath();
      g.moveTo(pts[0].x, H);
      for (const p of pts) g.lineTo(p.x, p.y);
      g.lineTo(BW + 12, H);
      g.closePath();
      const gr = g.createLinearGradient(0, r.base - r.amp, 0, r.base + 20);
      gr.addColorStop(0, r.top);
      gr.addColorStop(0.5, r.bot);
      gr.addColorStop(1, "#08202c");
      g.fillStyle = gr;
      g.fill();

      // 峰顶积雪
      g.save();
      g.clip();
      g.strokeStyle = `rgba(232,250,255,${r.snow})`;
      g.lineWidth = 2;
      g.beginPath();
      pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y + 1) : g.moveTo(p.x, p.y + 1)));
      g.stroke();
      g.strokeStyle = `rgba(206,236,250,${r.snow * 0.35})`;
      g.lineWidth = 9;
      g.stroke();
      g.restore();
    }

    // 山脚雾带：在地平线处浓到足以吃掉山脚，与冰面顶端的雾色对齐
    const fogTop = horizon - amp * 0.78;
    const fog = g.createLinearGradient(0, fogTop, 0, horizon);
    fog.addColorStop(0, "rgba(168,214,234,0)");
    fog.addColorStop(0.44, "rgba(168,214,234,0.14)");
    fog.addColorStop(0.78, "rgba(168,214,234,0.40)");
    fog.addColorStop(1, "rgba(168,214,234,0.72)");
    g.fillStyle = fog;
    g.fillRect(0, fogTop, BW, horizon - fogTop + 2);

    // 地平线以下留一层远雪原底色，冰面会覆盖大部分
    const plain = g.createLinearGradient(0, horizon, 0, H);
    plain.addColorStop(0, "#78a4b7");
    plain.addColorStop(0.24, "#2c6274");
    plain.addColorStop(1, "#061c27");
    g.fillStyle = plain;
    g.fillRect(0, horizon, BW, H - horizon);

    return c;
  }

  /* ── 极光（逐帧，轻量） ─────────────────────────────────── */
  function drawAurora(t, alpha) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let band = 0; band < 3; band++) {
      const yBase = H * (0.1 + band * 0.055);
      const grd = ctx.createLinearGradient(0, yBase - 60, 0, yBase + 110);
      const hue = 150 + band * 26;
      grd.addColorStop(0, `hsla(${hue},70%,60%,0)`);
      grd.addColorStop(0.45, `hsla(${hue},72%,62%,${0.09 * alpha})`);
      grd.addColorStop(1, `hsla(${hue + 30},70%,58%,0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(-20, yBase + 130);
      for (let x = -20; x <= W + 20; x += 24) {
        const y =
          yBase +
          Math.sin(x / 240 + t * 0.16 + band * 1.7) * 26 +
          Math.sin(x / 90 - t * 0.11 + band) * 12;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W + 20, yBase + 130);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /* ── 几何：多边形棱柱 ───────────────────────────────────── */
  function gridPolyToWorld(pts) {
    return pts.map((p) => isoPt(p.gx, p.gy));
  }

  function fillPoly(pts, style, dy = 0) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y + dy);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y + dy);
    ctx.closePath();
    ctx.fillStyle = style;
    ctx.fill();
  }

  /** 面朝向 → 光照系数 */
  function faceLight(g0, g1) {
    // 网格外法线（多边形按顺时针 CCW 给出）
    const dx = g1.gx - g0.gx;
    const dy = g1.gy - g0.gy;
    const n = { gx: dy, gy: -dx };
    const len = Math.hypot(n.gx, n.gy) || 1;
    const s = isoPt(n.gx / len, n.gy / len);
    const sl = Math.hypot(s.x, s.y) || 1;
    const nx = s.x / sl;
    const ny = s.y / sl;
    // 主光来自右下（冷月自右上给一点边缘光）
    const key = Math.max(0, nx * 0.72 + ny * 0.69);
    const rim = Math.max(0, nx * 0.6 - ny * 0.8);
    return 0.34 + key * 0.56 + rim * 0.14;
  }

  function warmthAt(gx, gy, env) {
    const d = Math.hypot(gx - CX, gy - CY);
    const R = 4.6 + (env?.furnaceLevel ?? 1) * 0.22;
    const k = Math.exp(-(d * d) / (2 * R * R));
    return Math.min(1, k * (env?.furnaceLit ? 1 : 0.15) * (env?.flicker ?? 1));
  }

  /** 通用棱柱：网格多边形 + 高度 */
  function drawPrism(gpts, baseLift, height, baseHex, env, opts = {}) {
    const wpts = gridPolyToWorld(gpts);
    const n = wpts.length;
    const faces = [];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      faces.push({
        i, j,
        depth: gpts[i].gx + gpts[i].gy + gpts[j].gx + gpts[j].gy,
      });
    }
    faces.sort((a, b) => a.depth - b.depth);

    for (const f of faces) {
      const p0 = wpts[f.i];
      const p1 = wpts[f.j];
      const mgx = (gpts[f.i].gx + gpts[f.j].gx) / 2;
      const mgy = (gpts[f.i].gy + gpts[f.j].gy) / 2;
      const light = faceLight(gpts[f.i], gpts[f.j]);
      const warm = warmthAt(mgx, mgy, env) * (opts.warmMul ?? 1);
      const quad = [
        { x: p0.x, y: p0.y - baseLift },
        { x: p1.x, y: p1.y - baseLift },
        { x: p1.x, y: p1.y - baseLift - height },
        { x: p0.x, y: p0.y - baseLift - height },
      ];
      fillPoly(quad, shadeWarm(baseHex, light, warm));
      if (opts.stripe) {
        fillPoly(
          [
            { x: p0.x, y: p0.y - baseLift - height * 0.42 },
            { x: p1.x, y: p1.y - baseLift - height * 0.42 },
            { x: p1.x, y: p1.y - baseLift - height * 0.52 },
            { x: p0.x, y: p0.y - baseLift - height * 0.52 },
          ],
          shadeWarm(baseHex, light * 0.72, warm * 0.6)
        );
      }
    }

    // 顶面
    const top = wpts.map((p) => ({ x: p.x, y: p.y - baseLift - height }));
    const cw = warmthAt(
      gpts.reduce((s, p) => s + p.gx, 0) / n,
      gpts.reduce((s, p) => s + p.gy, 0) / n,
      env
    );
    fillPoly(top, shadeWarm(opts.topHex || baseHex, opts.topLight ?? 1.12, cw * 0.7));
    return top;
  }

  function rectGrid(gx, gy, w, d) {
    const x0 = gx - w / 2, x1 = gx + w / 2;
    const y0 = gy - d / 2, y1 = gy + d / 2;
    // CCW（在网格坐标系中）：A(后) B(右) C(前) D(左)
    return [
      { gx: x0, gy: y0 },
      { gx: x1, gy: y0 },
      { gx: x1, gy: y1 },
      { gx: x0, gy: y1 },
    ];
  }

  /* ── 屋顶 ───────────────────────────────────────────────── */
  function scaleGrid(gpts, gx, gy, k) {
    return gpts.map((p) => ({ gx: gx + (p.gx - gx) * k, gy: gy + (p.gy - gy) * k }));
  }

  function drawGableRoof(gpts, gx, gy, lift, rh, env, tone) {
    const ex = scaleGrid(gpts, gx, gy, 1.16);
    const w = gridPolyToWorld(ex).map((p) => ({ x: p.x, y: p.y - lift }));
    const [A, B, C, D] = w;
    const R1 = { x: (A.x + D.x) / 2, y: (A.y + D.y) / 2 - rh };
    const R2 = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 - rh };
    const warm = warmthAt(gx, gy, env);

    fillPoly([A, B, R2, R1], shadeWarm(tone, 0.78, warm * 0.5));      // 后坡
    fillPoly([B, C, R2], shadeWarm(tone, 0.94, warm * 0.8));          // 右山墙
    fillPoly([D, C, R2, R1], shadeWarm(tone, 1.24, warm * 0.85));     // 前坡

    // 积雪
    ctx.save();
    ctx.globalAlpha = 0.5;
    fillPoly([A, B, R2, R1], "rgba(214,240,252,0.55)");
    ctx.globalAlpha = 0.34;
    fillPoly([D, C, R2, R1], "rgba(226,246,255,0.6)");
    ctx.restore();
    // 屋脊亮线
    ctx.strokeStyle = "rgba(232,248,255,0.6)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(R1.x, R1.y);
    ctx.lineTo(R2.x, R2.y);
    ctx.stroke();
    // 檐口挂雪
    snowLip([D, C], 0.34);
    snowLip([C, B], 0.28);
    return { peak: Math.min(R1.y, R2.y) };
  }

  function drawHipRoof(gpts, gx, gy, lift, rh, env, tone, overhang = 1.14) {
    const ex = scaleGrid(gpts, gx, gy, overhang);
    const w = gridPolyToWorld(ex).map((p) => ({ x: p.x, y: p.y - lift }));
    const c = isoPt(gx, gy);
    const apex = { x: c.x, y: c.y - lift - rh };
    const warm = warmthAt(gx, gy, env);
    const order = [0, 1, 2, 3].sort((a, b) => {
      const ga = (ex[a].gx + ex[a].gy + ex[(a + 1) % 4].gx + ex[(a + 1) % 4].gy) / 2;
      const gb = (ex[b].gx + ex[b].gy + ex[(b + 1) % 4].gx + ex[(b + 1) % 4].gy) / 2;
      return ga - gb;
    });
    for (const i of order) {
      const j = (i + 1) % 4;
      const light = 0.62 + faceLight(ex[i], ex[j]) * 0.6;
      fillPoly([w[i], w[j], apex], shadeWarm(tone, light, warm * 0.7));
      ctx.save();
      ctx.globalAlpha = 0.3 + light * 0.16;
      fillPoly([w[i], w[j], apex], "rgba(222,244,255,0.5)");
      ctx.restore();
    }
    snowLip([w[3], w[2]], 0.3);
    snowLip([w[2], w[1]], 0.26);
    return { apex };
  }

  function drawPagodaRoof(gpts, gx, gy, lift, rh, env, tone) {
    // 双层飞檐
    const t1 = drawFlare(gpts, gx, gy, lift, rh * 0.62, 1.34, tone, env);
    const t2 = drawFlare(scaleGrid(gpts, gx, gy, 0.62), gx, gy, lift + rh * 0.56, rh * 0.6, 1.3, tone, env);
    // 宝顶
    const c = isoPt(gx, gy);
    ctx.fillStyle = "#e0c07a";
    ctx.beginPath();
    ctx.arc(c.x, c.y - lift - rh * 1.2, 2.6, 0, TAU);
    ctx.fill();
    ctx.fillRect(c.x - 0.8, c.y - lift - rh * 1.2, 1.6, 6);
    return t2 || t1;
  }

  function drawFlare(gpts, gx, gy, lift, rh, overhang, tone, env) {
    const ex = scaleGrid(gpts, gx, gy, overhang);
    const w = gridPolyToWorld(ex).map((p) => ({ x: p.x, y: p.y - lift }));
    const c = isoPt(gx, gy);
    const apex = { x: c.x, y: c.y - lift - rh };
    const warm = warmthAt(gx, gy, env);
    const order = [0, 1, 2, 3].sort((a, b) => {
      const ga = ex[a].gx + ex[a].gy + ex[(a + 1) % 4].gx + ex[(a + 1) % 4].gy;
      const gb = ex[b].gx + ex[b].gy + ex[(b + 1) % 4].gx + ex[(b + 1) % 4].gy;
      return ga - gb;
    });
    for (const i of order) {
      const j = (i + 1) % 4;
      const p0 = { x: w[i].x, y: w[i].y - 4 };       // 翘角
      const p1 = { x: w[j].x, y: w[j].y - 4 };
      const mid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 + 8 };
      const light = 0.6 + faceLight(ex[i], ex[j]) * 0.62;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo(mid.x, mid.y, p1.x, p1.y);
      ctx.lineTo(apex.x, apex.y);
      ctx.closePath();
      ctx.fillStyle = shadeWarm(tone, light, warm * 0.7);
      ctx.fill();
      ctx.save();
      ctx.globalAlpha = 0.26 + light * 0.14;
      ctx.fillStyle = "rgba(224,246,255,0.55)";
      ctx.fill();
      ctx.restore();
      // 檐线
      ctx.strokeStyle = "rgba(240,250,255,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo(mid.x, mid.y, p1.x, p1.y);
      ctx.stroke();
    }
    return { apex };
  }

  function snowLip(seg, alpha) {
    const [p0, p1] = seg;
    const n = 7;
    ctx.save();
    ctx.fillStyle = `rgba(236,250,255,${alpha})`;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const x = p0.x + (p1.x - p0.x) * t;
      const y = p0.y + (p1.y - p0.y) * t;
      ctx.beginPath();
      ctx.arc(x, y, 1.6 + (i % 3) * 0.6, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ── 窗与灯 ─────────────────────────────────────────────── */
  function drawWindows(gpts, lift, height, env, seed, count, litK) {
    const w = gridPolyToWorld(gpts);
    // 仅前两面（C 为最前点：D-C 与 C-B）
    const faces = [[3, 2], [2, 1]];
    for (const [a, b] of faces) {
      const p0 = w[a];
      const p1 = w[b];
      for (let i = 0; i < count; i++) {
        const u = (i + 0.5) / count;
        const cxp = p0.x + (p1.x - p0.x) * u;
        const cyp = p0.y + (p1.y - p0.y) * u - lift - height * 0.58;
        const flick = 0.62 + 0.38 * Math.sin(time * 3.4 + seed * 4.1 + i * 2.3) * 0.5 + 0.19;
        const a2 = litK * flick;
        if (a2 <= 0.02) continue;
        ctx.fillStyle = `rgba(255,${172 + flick * 50},${86 + flick * 40},${0.9 * a2})`;
        ctx.fillRect(cxp - 2.2, cyp - 3.4, 4.4, 6.2);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.5 * a2;
        ctx.drawImage(glowWarm, cxp - 17, cyp - 17, 34, 34);
        ctx.restore();
      }
    }
  }

  /* ── 建筑附件 ───────────────────────────────────────────── */
  function drawProps(kind, b, art, env) {
    const c = isoPt(art.gx, art.gy);
    const lv = b.level || 1;
    const warm = warmthAt(art.gx, art.gy, env);
    ctx.save();
    switch (kind) {
      case "huts": {
        const extra = Math.min(3, Math.floor((lv - 1) / 2));
        for (let i = 0; i < extra; i++) {
          const ang = 1.1 + i * 1.5;
          const hx = art.gx + Math.cos(ang) * 1.25;
          const hy = art.gy + Math.sin(ang) * 1.1;
          const fp = rectGrid(hx, hy, 0.72, 0.68);
          drawPrism(fp, 0, 10, "#7c5f42", env, { topLight: 1.1 });
          drawGableRoof(fp, hx, hy, 10, 8, env, "#33505f");
        }
        break;
      }
      case "logs": {
        for (let i = 0; i < 3 + Math.min(4, lv); i++) {
          const lx = c.x - 42 + (i % 4) * 13;
          const ly = c.y + 16 + Math.floor(i / 4) * 7;
          ctx.fillStyle = shadeWarm("#7a5c3c", 1.0, warm);
          ctx.fillRect(lx, ly - 5, 14, 5);
          ctx.fillStyle = shadeWarm("#c6a677", 1.1, warm);
          ctx.beginPath();
          ctx.ellipse(lx + 14, ly - 2.5, 1.8, 2.5, 0, 0, TAU);
          ctx.fill();
        }
        // 松树
        for (let i = 0; i < 3; i++) {
          drawPine(art.gx + 1.25 + i * 0.16, art.gy - 0.9 + i * 0.72, 1 + (i % 2) * 0.2, env);
        }
        break;
      }
      case "racks": {
        ctx.strokeStyle = shadeWarm("#6b5236", 1.1, warm);
        ctx.lineWidth = 1.6;
        for (let i = 0; i < 2; i++) {
          const bx = c.x - 26 + i * 44;
          ctx.beginPath();
          ctx.moveTo(bx, c.y + 12);
          ctx.lineTo(bx, c.y - 12);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(c.x - 26, c.y - 10);
        ctx.lineTo(c.x + 18, c.y - 10);
        ctx.stroke();
        ctx.fillStyle = shadeWarm("#9c5a48", 1.05, warm);
        for (let i = 0; i < 3; i++) ctx.fillRect(c.x - 22 + i * 14, c.y - 10, 5, 8);
        break;
      }
      case "coal":
      case "iron": {
        const dark = kind === "coal" ? "#20262b" : "#4a5866";
        for (let i = 0; i < 3; i++) {
          const px = c.x - 34 + i * 22;
          const py = c.y + 14;
          ctx.fillStyle = shadeWarm(dark, 1, warm * 0.6);
          ctx.beginPath();
          ctx.ellipse(px, py, 11, 5.2, 0, 0, TAU);
          ctx.fill();
          ctx.fillStyle = shadeWarm(dark, 1.5, warm * 0.7);
          ctx.beginPath();
          ctx.ellipse(px - 2, py - 2, 5.4, 2.6, 0, 0, TAU);
          ctx.fill();
        }
        if (kind === "iron") {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = 0.35;
          ctx.fillStyle = "#9fd0e8";
          for (let i = 0; i < 5; i++) {
            ctx.fillRect(c.x - 30 + i * 13, c.y + 10 + (i % 2) * 4, 1.6, 1.6);
          }
          ctx.restore();
        }
        break;
      }
      case "crates": {
        for (let i = 0; i < 4; i++) {
          const bx = c.x - 40 + (i % 2) * 17;
          const by = c.y + 15 + Math.floor(i / 2) * 8;
          const fp = [
            { x: bx, y: by }, { x: bx + 9, y: by + 4.5 },
            { x: bx, y: by + 9 }, { x: bx - 9, y: by + 4.5 },
          ];
          ctx.fillStyle = shadeWarm("#8a6a45", 0.8, warm);
          fillPoly([fp[1], fp[2], { x: fp[2].x, y: fp[2].y - 9 }, { x: fp[1].x, y: fp[1].y - 9 }], shadeWarm("#8a6a45", 0.8, warm));
          fillPoly([fp[3], fp[2], { x: fp[2].x, y: fp[2].y - 9 }, { x: fp[3].x, y: fp[3].y - 9 }], shadeWarm("#8a6a45", 0.62, warm));
          fillPoly(fp.map((p) => ({ x: p.x, y: p.y - 9 })), shadeWarm("#b18a5c", 1.1, warm));
        }
        break;
      }
      case "banners": {
        const n = 2 + Math.min(3, Math.floor(lv / 2));
        for (let i = 0; i < n; i++) {
          const bx = c.x - 40 + i * 22;
          const by = c.y + 10;
          ctx.strokeStyle = "#4a4034";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx, by - 34);
          ctx.stroke();
          const wave = Math.sin(time * 2.4 + i) * 2.4;
          ctx.fillStyle = shadeWarm("#a8342c", 1.15, warm);
          ctx.beginPath();
          ctx.moveTo(bx, by - 34);
          ctx.quadraticCurveTo(bx + 8 + wave, by - 30, bx + 13, by - 24);
          ctx.lineTo(bx + 11 + wave, by - 15);
          ctx.quadraticCurveTo(bx + 6, by - 16, bx, by - 16);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }
      case "lanterns": {
        for (let i = 0; i < 2; i++) {
          const lx = c.x - 22 + i * 44;
          const ly = c.y - 26 - Math.sin(time * 1.6 + i * 2) * 1.6;
          ctx.strokeStyle = "#5b4630";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(lx, ly - 12);
          ctx.lineTo(lx, ly - 4);
          ctx.stroke();
          ctx.fillStyle = "#e0483a";
          ctx.beginPath();
          ctx.ellipse(lx, ly + 1, 4.6, 5.6, 0, 0, TAU);
          ctx.fill();
          ctx.fillStyle = "#ffd88f";
          ctx.beginPath();
          ctx.ellipse(lx, ly + 1, 2.2, 3.2, 0, 0, TAU);
          ctx.fill();
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = 0.42;
          ctx.drawImage(glowWarm, lx - 22, ly - 21, 44, 44);
          ctx.restore();
        }
        break;
      }
      case "steam": {
        if (Math.random() < 0.28) {
          embers.spawn("smoke", c.x + 8, c.y - art.h - 14, { spread: 4, size: 3.4, vy: -18 });
        }
        break;
      }
      case "banner": {
        const bx = c.x + 20;
        ctx.strokeStyle = "#4a4034";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(bx, c.y + 8);
        ctx.lineTo(bx, c.y - 40);
        ctx.stroke();
        const wave = Math.sin(time * 1.9) * 2;
        ctx.fillStyle = shadeWarm("#d9e6ce", 1.1, warm * 0.5);
        ctx.beginPath();
        ctx.moveTo(bx, c.y - 40);
        ctx.lineTo(bx + 10 + wave, c.y - 37);
        ctx.lineTo(bx + 9, c.y - 18);
        ctx.lineTo(bx, c.y - 20);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case "scrolls": {
        for (let i = 0; i < 2; i++) {
          const bx = c.x - 26 + i * 52;
          ctx.fillStyle = shadeWarm("#c9b487", 1.0, warm * 0.6);
          ctx.fillRect(bx - 2, c.y - 30, 4, 22);
          ctx.fillStyle = "#2b4653";
          ctx.fillRect(bx - 3, c.y - 32, 6, 3);
        }
        break;
      }
    }
    ctx.restore();
  }

  function drawPine(gx, gy, scale, env) {
    const p = isoPt(gx, gy);
    const warm = warmthAt(gx, gy, env) * 0.4;
    ctx.fillStyle = "rgba(4,20,28,.32)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 9 * scale, 4 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = shadeWarm("#4a3826", 0.9, warm);
    ctx.fillRect(p.x - 1.6 * scale, p.y - 10 * scale, 3.2 * scale, 10 * scale);
    for (let i = 0; i < 3; i++) {
      const yy = p.y - 8 * scale - i * 9 * scale;
      const ww = (16 - i * 4) * scale;
      ctx.fillStyle = shadeWarm("#1f4a44", 1 + i * 0.14, warm);
      ctx.beginPath();
      ctx.moveTo(p.x, yy - 14 * scale);
      ctx.lineTo(p.x + ww, yy);
      ctx.lineTo(p.x - ww, yy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(226,246,255,.42)";
      ctx.beginPath();
      ctx.moveTo(p.x, yy - 14 * scale);
      ctx.lineTo(p.x + ww * 0.52, yy - 6 * scale);
      ctx.lineTo(p.x - ww * 0.52, yy - 6 * scale);
      ctx.closePath();
      ctx.fill();
    }
  }

  /* ── 火炉 ───────────────────────────────────────────────── */
  function drawFurnace(b, art, env) {
    const c = isoPt(art.gx, art.gy);
    const lv = b.level || 1;
    const lit = env.furnaceLit;
    const inten = (lit ? 1 : 0.12) * env.flicker;
    const h1 = 19 + lv * 1.1;
    const h2 = 44 + lv * 3.0;

    // 融雪环
    ctx.save();
    const meltR = 96 + lv * 5;
    ctx.fillStyle = worldGradient(`melt${lv}`, () => {
      const mg = ctx.createRadialGradient(c.x, c.y, 10, c.x, c.y, meltR);
      mg.addColorStop(0, "rgba(58,44,34,0.55)");
      mg.addColorStop(0.6, "rgba(48,52,54,0.26)");
      mg.addColorStop(1, "rgba(48,52,54,0)");
      return mg;
    });
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(1, TH / TW);
    ctx.beginPath();
    ctx.arc(0, 0, meltR, 0, TAU);
    ctx.restore();
    ctx.fill();
    ctx.restore();

    // 石台阶
    drawPrism(rectGrid(art.gx, art.gy, 2.7, 2.7), 0, 6, "#43535e", env, { topHex: "#6d8390", topLight: 1.16 });
    drawPrism(rectGrid(art.gx, art.gy, 2.15, 2.15), 6, h1, "#4d5f6b", env, { topHex: "#78909d", topLight: 1.2, stripe: true });
    // 炉身（收分）
    drawPrism(rectGrid(art.gx, art.gy, 1.52, 1.52), 6 + h1, h2, "#55697a", env, { topHex: "#8aa4b2", topLight: 1.24 });
    // 炉口
    const rimY = c.y - 6 - h1 - h2;
    drawPrism(rectGrid(art.gx, art.gy, 1.88, 1.88), 6 + h1 + h2, 7, "#3f5260", env, { topHex: "#2a3740", topLight: 0.9 });

    // 炉膛与火焰
    const fireY = rimY - 5;
    if (inten > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      // 炉膛底光
      ctx.globalAlpha = 0.85 * inten;
      ctx.drawImage(glowWarm, c.x - 44, fireY - 30, 88, 60);

      const flames = 7;
      for (let i = 0; i < flames; i++) {
        const t = time * 3.1 + i * 1.37;
        const sway = Math.sin(t) * 4.6 + Math.sin(t * 1.9 + i) * 2.8;
        const hgt = (40 + lv * 1.8) * inten * (0.62 + 0.38 * (0.5 + 0.5 * Math.sin(t * 1.6 + i))) - i * 2.6;
        const wid = 15 - i * 1.35;
        if (hgt < 3) continue;
        const hue = 18 + i * 5 + Math.sin(t) * 6;
        const lightness = 52 + i * 5;
        ctx.globalAlpha = (0.42 - i * 0.035) * inten;
        ctx.fillStyle = `hsl(${hue},100%,${lightness}%)`;
        ctx.beginPath();
        const bx = c.x + sway * 0.3;
        ctx.moveTo(bx - wid, fireY);
        ctx.quadraticCurveTo(bx - wid * 0.8, fireY - hgt * 0.6, bx + sway, fireY - hgt);
        ctx.quadraticCurveTo(bx + wid * 0.8, fireY - hgt * 0.6, bx + wid, fireY);
        ctx.quadraticCurveTo(bx, fireY + 4, bx - wid, fireY);
        ctx.fill();
      }
      // 白热核心
      ctx.globalAlpha = 0.7 * inten;
      ctx.fillStyle = "#fff3d2";
      ctx.beginPath();
      ctx.ellipse(c.x, fireY - 2, 7, 4.6, 0, 0, TAU);
      ctx.fill();
      ctx.restore();

      if (Math.random() < 0.7) {
        embers.spawn("ember", c.x, fireY - 6, { spread: 9, vy: -46 - Math.random() * 40 });
      }
      if (Math.random() < 0.22) {
        embers.spawn("smoke", c.x, fireY - 18, { spread: 8, size: 6 });
      }
    }

    return { top: fireY - 30 };
  }

  /** 火炉地面光池（在建筑之前绘制） */
  function drawHearthPool(env) {
    const c = isoPt(CX, CY);
    const inten = (env.furnaceLit ? 1 : 0.12) * env.flicker;
    if (inten <= 0.02) return;
    const R = (250 + env.furnaceLevel * 12) * (0.9 + 0.1 * env.flicker);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.34 * inten;
    ctx.translate(c.x, c.y + 6);
    ctx.scale(1, TH / TW);
    ctx.drawImage(glowWarm, -R, -R, R * 2, R * 2);
    ctx.restore();
  }

  /** 火炉空气光晕（建筑之后） */
  function drawHearthHalo(env) {
    const c = isoPt(CX, CY);
    const inten = (env.furnaceLit ? 1 : 0.1) * env.flicker;
    if (inten <= 0.02) return;
    const R = 190 + env.furnaceLevel * 8;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.26 * inten;
    ctx.drawImage(glowWarm, c.x - R, c.y - 96 - R, R * 2, R * 2);
    ctx.restore();
  }

  /* ── 地形 ───────────────────────────────────────────────── */
  // 世界空间的渐变与镜头无关，建一次即可复用
  const grads = {};
  function worldGradient(name, make) {
    if (!grads[name]) grads[name] = make();
    return grads[name];
  }

  function drawIce(env) {
    const w0 = toWorld(0, 0);
    const w1 = toWorld(W, H);
    const hy = horizonWorldY();
    const left = w0.x - 40;
    const width = w1.x - w0.x + 80;

    ctx.save();
    // 冰面只铺在地平线以下，上方留给夜空与雪山
    ctx.beginPath();
    ctx.rect(left, hy, width, w1.y - hy + 80);
    ctx.clip();

    ctx.fillStyle = worldGradient("ice", () => {
      const g = ctx.createLinearGradient(0, 250, 0, 900);
      g.addColorStop(0, "#0b3244");
      g.addColorStop(0.4, "#0e4054");
      g.addColorStop(1, "#061e2a");
      return g;
    });
    ctx.fillRect(left, hy, width, w1.y - hy + 80);

    // 地平线处的冰雾，遮住冰面与雪山的接缝（雾色/浓度与背景山脚雾对齐）
    const fadeH = 150 / cam.zoom;
    const fade = ctx.createLinearGradient(0, hy, 0, hy + fadeH);
    fade.addColorStop(0, "rgba(168,214,234,0.72)");
    fade.addColorStop(0.18, "rgba(160,206,228,0.44)");
    fade.addColorStop(0.48, "rgba(140,190,214,0.18)");
    fade.addColorStop(1, "rgba(120,176,204,0)");
    ctx.fillStyle = fade;
    ctx.fillRect(left, hy, width, fadeH);

    // 冰纹
    ctx.strokeStyle = "rgba(178,224,246,0.16)";
    ctx.lineWidth = 1.1;
    for (const pts of CRACKS) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }
    // 镜面反光带（渐变复用，靠 globalAlpha 做呼吸）
    ctx.globalCompositeOperation = "screen";
    const band = worldGradient("iceBand", () => {
      const lg = ctx.createLinearGradient(-700, 0, 700, 0);
      lg.addColorStop(0, "rgba(190,232,250,0)");
      lg.addColorStop(0.5, "rgba(200,238,252,1)");
      lg.addColorStop(1, "rgba(190,232,250,0)");
      return lg;
    });
    ctx.fillStyle = band;
    for (let i = 0; i < 4; i++) {
      const y = 430 + i * 82;
      ctx.globalAlpha = 0.05 + 0.03 * Math.sin(time * 0.4 + i);
      ctx.fillRect(-700, y - 9, 1400, 18);
    }
    ctx.globalAlpha = 1;
    // 火炉在冰面上的倒影
    const inten = (env.furnaceLit ? 1 : 0.1) * env.flicker;
    if (inten > 0.02) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.18 * inten;
      ctx.drawImage(glowWarm, -150, 400, 300, 300);
      ctx.globalAlpha = 0.1 * inten;
      ctx.drawImage(glowWarm, -70, 430, 140, 460);
    }
    ctx.restore();
  }

  function drawPlateau(env) {
    const w = gridPolyToWorld(PLATEAU);

    // 岸壁
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(w[0].x, w[0].y);
    for (const p of w) ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.fillStyle = "#123444";
    ctx.save();
    ctx.translate(0, 17);
    ctx.fill();
    ctx.restore();
    ctx.restore();

    // 台面
    ctx.beginPath();
    ctx.moveTo(w[0].x, w[0].y);
    for (const p of w) ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.fillStyle = worldGradient("snowField", () => {
      const cg = ctx.createRadialGradient(0, 184, 40, 0, 184, 560);
      cg.addColorStop(0, "#dcecf5");
      cg.addColorStop(0.42, "#b9d4e2");
      cg.addColorStop(0.78, "#7fa7bd");
      cg.addColorStop(1, "#3f6c85");
      return cg;
    });
    ctx.fill();

    // 边缘积雪高光
    ctx.strokeStyle = "rgba(240,252,255,0.7)";
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.save();
    ctx.clip();

    // 雪面起伏
    for (let i = 0; i < 26; i++) {
      const a = hash1(i * 4.1) * TAU;
      const r = hash1(i * 8.3) * 7.4;
      const p = isoPt(CX + Math.cos(a) * r, CY + Math.sin(a) * r);
      const rr = 26 + hash1(i * 2.9) * 60;
      ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.16)" : "rgba(120,168,196,0.14)";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, rr, rr * 0.42, 0, 0, TAU);
      ctx.fill();
    }

    // 网格纹（极淡）
    ctx.strokeStyle = "rgba(120,178,204,0.09)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -4; i <= 12; i++) {
      const a = isoPt(i, -4), b2 = isoPt(i, 12);
      ctx.moveTo(a.x, a.y); ctx.lineTo(b2.x, b2.y);
      const c1 = isoPt(-4, i), d1 = isoPt(12, i);
      ctx.moveTo(c1.x, c1.y); ctx.lineTo(d1.x, d1.y);
    }
    ctx.stroke();

    // 踏出的雪路：各建筑 → 火炉
    ctx.strokeStyle = "rgba(96,132,156,0.34)";
    ctx.lineCap = "round";
    const hc = isoPt(CX, CY);
    for (const key of Object.keys(CITY_LAYOUT)) {
      const art = CITY_LAYOUT[key];
      if (art.special) continue;
      const p = isoPt(art.gx, art.gy);
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(hc.x, hc.y);
      ctx.quadraticCurveTo((hc.x + p.x) / 2 + (p.y - hc.y) * 0.08, (hc.y + p.y) / 2, p.x, p.y);
      ctx.stroke();
    }

    // 冷色边缘渐暗
    ctx.fillStyle = worldGradient("plateauVignette", () => {
      const vg = ctx.createRadialGradient(0, 184, 200, 0, 184, 620);
      vg.addColorStop(0, "rgba(6,26,38,0)");
      vg.addColorStop(1, "rgba(6,26,38,0.6)");
      return vg;
    });
    ctx.fillRect(-800, -300, 1600, 1200);

    ctx.restore();
  }

  /* ── 城墙 ───────────────────────────────────────────────── */
  function wallRuns(level) {
    const h = 15 + level * 2.2;
    const t = 0.36;
    const runs = [];
    for (let i = 0; i < WALL_SIDES; i++) {
      const a = WALL_PTS[i];
      const b = WALL_PTS[(i + 1) % WALL_SIDES];
      const dx = b.gx - a.gx, dy = b.gy - a.gy;
      const len = Math.hypot(dx, dy) || 1;
      const nx = (dy / len) * t / 2;
      const ny = (-dx / len) * t / 2;
      const quad = [
        { gx: a.gx + nx, gy: a.gy + ny },
        { gx: b.gx + nx, gy: b.gy + ny },
        { gx: b.gx - nx, gy: b.gy - ny },
        { gx: a.gx - nx, gy: a.gy - ny },
      ];
      runs.push({ quad, depth: (a.gx + a.gy + b.gx + b.gy) / 2, h, a, b, i });
    }
    return runs;
  }

  function drawWallRun(run, env) {
    drawPrism(run.quad, 0, run.h, "#4f5f6b", env, { topHex: "#93aebc", topLight: 1.2, warmMul: 0.6 });
    // 雉堞：只画朝向镜头的一面 + 顶面，省掉背面的无效填充
    const steps = 5;
    const dark = shadeWarm("#4a5a66", 0.9, 0);
    const light = shadeWarm("#a8c2ce", 1.18, 0);
    for (let s = 0; s < steps; s++) {
      const t = (s + 0.5) / steps;
      const gx = run.a.gx + (run.b.gx - run.a.gx) * t;
      const gy = run.a.gy + (run.b.gy - run.a.gy) * t;
      const q = gridPolyToWorld(rectGrid(gx, gy, 0.32, 0.32)).map((p) => ({ x: p.x, y: p.y - run.h }));
      fillPoly([q[3], q[2], { x: q[2].x, y: q[2].y - 5 }, { x: q[3].x, y: q[3].y - 5 }], dark);
      fillPoly([q[1], q[2], { x: q[2].x, y: q[2].y - 5 }, { x: q[1].x, y: q[1].y - 5 }], dark);
      fillPoly(q.map((p) => ({ x: p.x, y: p.y - 5 })), light);
    }
  }

  function drawWallTowers(level, env) {
    const h = 15 + level * 2.2;
    for (let i = 0; i < WALL_SIDES; i++) {
      const p = WALL_PTS[i];
      drawPrism(rectGrid(p.gx, p.gy, 0.62, 0.62), 0, h + 8, "#546471", env, { topHex: "#9db6c3", topLight: 1.22, warmMul: 0.5 });
    }
  }

  function drawGate(b, art, env) {
    const lv = b.level || 1;
    const h = 22 + lv * 2.2;
    drawPrism(rectGrid(art.gx, art.gy, 1.5, 1.5), 0, h, "#56666f", env, { topHex: "#93aebc", topLight: 1.18, stripe: true });
    drawPagodaRoof(rectGrid(art.gx, art.gy, 1.5, 1.5), art.gx, art.gy, h, 16, env, "#33505f");
    // 门洞
    const c = isoPt(art.gx, art.gy);
    ctx.fillStyle = "rgba(6,18,24,.88)";
    ctx.beginPath();
    ctx.moveTo(c.x - 8, c.y - 2);
    ctx.lineTo(c.x - 8, c.y - 16);
    ctx.quadraticCurveTo(c.x, c.y - 24, c.x + 8, c.y - 16);
    ctx.lineTo(c.x + 8, c.y - 2);
    ctx.closePath();
    ctx.fill();
    // 火盆
    for (let i = 0; i < 2; i++) {
      const bx = c.x - 30 + i * 60;
      const by = c.y + 4;
      ctx.fillStyle = "#3d4b55";
      ctx.fillRect(bx - 3, by - 8, 6, 8);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const f = 0.55 + 0.45 * Math.sin(time * 5 + i * 2.1);
      ctx.globalAlpha = 0.5 * f;
      ctx.drawImage(glowWarm, bx - 22, by - 30, 44, 44);
      ctx.fillStyle = "#ffca6e";
      ctx.beginPath();
      ctx.ellipse(bx, by - 10, 3, 4.6 * f, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  /* ── 建筑主绘制 ─────────────────────────────────────────── */
  function buildingTone(key) {
    return key === "recruit" || key === "academy" ? "#33505f" : "#2f4b59";
  }

  function drawBuilding(b, env) {
    const art = CITY_LAYOUT[b.key];
    if (!art || art.special) return;
    const lv = Math.max(1, b.level || 1);
    const grow = 1 + Math.min(0.34, (lv - 1) * 0.035);
    const w = art.w * (1 + Math.min(0.18, (lv - 1) * 0.02));
    const d = art.d * (1 + Math.min(0.18, (lv - 1) * 0.02));
    const h = art.h * grow;
    const fp = rectGrid(art.gx, art.gy, w, d);
    const seed = b.key.length + art.gx;

    // 地面阴影
    const wpts = gridPolyToWorld(scaleGrid(fp, art.gx, art.gy, 1.22));
    ctx.save();
    ctx.globalAlpha = 0.34;
    fillPoly(wpts, "#062029", 5);
    ctx.restore();

    // 地基
    drawPrism(scaleGrid(fp, art.gx, art.gy, 1.1), 0, 3.4, "#3b5462", env, { topHex: "#7f9fb0", topLight: 1.12 });

    // 墙体
    drawPrism(fp, 3.4, h, art.base, env, { topHex: art.base, topLight: 1.05, stripe: b.key === "barracks" });

    // 屋顶
    const tone = buildingTone(b.key);
    let apexY = null;
    if (art.roof === "gable") {
      drawGableRoof(fp, art.gx, art.gy, 3.4 + h, 12 + lv * 0.5, env, tone);
      apexY = isoPt(art.gx, art.gy).y - 3.4 - h - 12 - lv * 0.5;
    } else if (art.roof === "hip") {
      drawHipRoof(fp, art.gx, art.gy, 3.4 + h, 14, env, tone);
      apexY = isoPt(art.gx, art.gy).y - 3.4 - h - 14;
    } else if (art.roof === "pagoda") {
      drawPagodaRoof(fp, art.gx, art.gy, 3.4 + h, 18 + lv * 0.6, env, tone);
      apexY = isoPt(art.gx, art.gy).y - 3.4 - h - 22;
    } else if (art.roof === "flat") {
      const top = gridPolyToWorld(scaleGrid(fp, art.gx, art.gy, 1.06)).map((p) => ({ x: p.x, y: p.y - 3.4 - h }));
      fillPoly(top, shadeWarm("#39505d", 1.1, warmthAt(art.gx, art.gy, env) * 0.6));
      ctx.save();
      ctx.globalAlpha = 0.42;
      fillPoly(top, "rgba(226,246,255,0.6)");
      ctx.restore();
      apexY = isoPt(art.gx, art.gy).y - 3.4 - h;
    }

    // 窗火
    const workers = b.workers ?? 0;
    const litK = Math.max(0.14, Math.min(1, 0.3 + workers * 0.22 + lv * 0.05)) * (0.55 + 0.45 * env.flicker);
    drawWindows(fp, 3.4, h, env, seed, art.w > 1.6 ? 3 : 2, litK);

    // 烟囱与炊烟
    if (art.roof === "gable" || art.roof === "hip") {
      const c = isoPt(art.gx, art.gy);
      const chx = c.x + 12;
      const chy = c.y - 3.4 - h - 8;
      ctx.fillStyle = shadeWarm("#41525c", 1.0, 0);
      ctx.fillRect(chx - 2.6, chy - 9, 5.2, 11);
      ctx.fillStyle = "rgba(232,248,255,.6)";
      ctx.fillRect(chx - 3.2, chy - 10.4, 6.4, 2);
      if (workers > 0 && Math.random() < 0.1) {
        embers.spawn("smoke", chx, chy - 12, { spread: 2, size: 3, vy: -14 - Math.random() * 10 });
      }
    }

    if (art.props) drawProps(art.props, b, art, env);

    // 悬停 / 脉冲高亮
    if (hoverKey === b.key) {
      const ring = gridPolyToWorld(scaleGrid(fp, art.gx, art.gy, 1.3));
      ctx.save();
      ctx.strokeStyle = "rgba(255,178,96,0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      ctx.lineDashOffset = -time * 22;
      ctx.beginPath();
      ctx.moveTo(ring[0].x, ring[0].y);
      for (const p of ring) ctx.lineTo(p.x, p.y);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
    const pulse = pulses.get(b.key);
    if (pulse !== undefined) {
      const t = pulse;
      const k = 1.2 + t * 1.5;
      const ring = gridPolyToWorld(scaleGrid(fp, art.gx, art.gy, k));
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = "#ffd68f";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ring[0].x, ring[0].y);
      for (const p of ring) ctx.lineTo(p.x, p.y);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
    return apexY;
  }

  /* ── 命中测试 ───────────────────────────────────────────── */
  function silhouette(key, lv) {
    const art = CITY_LAYOUT[key];
    if (!art) return null;
    const grow = 1 + Math.min(0.34, ((lv || 1) - 1) * 0.035);
    const fp = rectGrid(art.gx, art.gy, art.w * 1.16, art.d * 1.16);
    const w = gridPolyToWorld(fp);
    const top = (art.special === "furnace" ? 82 + (lv || 1) * 4.2 : art.h * grow + 26);
    // 六边形轮廓：A' B' B C D D'
    return [
      { x: w[0].x, y: w[0].y - top },
      { x: w[1].x, y: w[1].y - top },
      { x: w[1].x, y: w[1].y },
      { x: w[2].x, y: w[2].y },
      { x: w[3].x, y: w[3].y },
      { x: w[3].x, y: w[3].y - top },
    ];
  }

  function pointInPoly(pts, x, y) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  let lastBuildings = [];

  function pickAt(sx, sy) {
    const wp = toWorld(sx, sy);
    const list = lastBuildings
      .filter((b) => CITY_LAYOUT[b.key])
      .slice()
      .sort((a, b) => depthOf(b) - depthOf(a)); // 前面的优先
    for (const b of list) {
      const poly = silhouette(b.key, b.level);
      if (poly && pointInPoly(poly, wp.x, wp.y)) return b.key;
    }
    return null;
  }

  function depthOf(b) {
    const a = CITY_LAYOUT[b.key];
    return a ? a.gx + a.gy : 0;
  }

  /** 建筑在画布内的屏幕包围盒（供新手引导聚光） */
  function rectOf(key) {
    const b = lastBuildings.find((x) => x.key === key) || { key, level: 1 };
    const poly = silhouette(key, b.level);
    if (!poly) return null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of poly) {
      const s = toScreen(p.x, p.y);
      x0 = Math.min(x0, s.x); y0 = Math.min(y0, s.y);
      x1 = Math.max(x1, s.x); y1 = Math.max(y1, s.y);
    }
    return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
  }

  function anchorOf(key) {
    const art = CITY_LAYOUT[key];
    if (!art) return null;
    const b = lastBuildings.find((x) => x.key === key);
    const lv = b?.level || 1;
    const top = art.special === "furnace" ? 96 + lv * 4.2 : art.h + 34;
    const p = isoPt(art.gx, art.gy);
    return toScreen(p.x, p.y - top);
  }

  function pulse(key) {
    pulses.set(key, 0);
  }

  /* ── 主循环 ─────────────────────────────────────────────── */
  function render(dt, state) {
    if (!glowWarm) resize();
    time += dt;

    const st = state || {};
    const blizzard = Math.max(0, Math.min(1, st.blizzard ?? 0));
    const furnaceB = (st.buildings || []).find((b) => b.key === "furnace");
    const furnaceLevel = furnaceB?.level ?? 1;
    const furnaceLit = st.furnaceLit !== false;

    // 火光闪烁
    const target =
      0.82 +
      0.18 * Math.sin(time * 7.3) * 0.5 +
      0.12 * Math.sin(time * 2.1) +
      0.06 * Math.sin(time * 17.7);
    flicker += (target - flicker) * Math.min(1, dt * 9);
    const env = {
      furnaceLevel,
      furnaceLit,
      flicker: furnaceLit ? flicker : 0.18,
      blizzard,
      temp: st.temp ?? 0,
    };

    lastBuildings = st.buildings || [];

    const wind = Math.sin(time * 0.31) * 0.42 + Math.sin(time * 0.11) * 0.3 + blizzard * 0.55;

    /* 背景 */
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const key = `${W}x${H}`;
    if (!backdrop || backdropKey !== key) {
      backdrop = buildBackdrop();
      backdropKey = key;
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    // 背景视差：远景只随镜头轻微位移
    const par = Math.max(-BACKDROP_PAD, Math.min(BACKDROP_PAD, -(cam.x - fitCamX) * 0.06));
    ctx.drawImage(backdrop, -BACKDROP_PAD + par, 0, W + BACKDROP_PAD * 2, H);
    drawAurora(time, (1 - blizzard) * 0.9);

    /* 远景雪 */
    snow.update(dt, { intensity: blizzard, wind });
    snow.drawBack(ctx, { intensity: blizzard });

    /* 世界 */
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);

    drawIce(env);
    drawPlateau(env);
    drawGroundDrift(
      ctx,
      { x0: FRAME.x0 * 0.86, x1: FRAME.x1 * 0.86, y0: FRAME.y1 * 0.1, y1: FRAME.y1 * 0.88 },
      time,
      blizzard * 0.9 + 0.12
    );
    drawHearthPool(env);

    // 城民同步（节点集是静态的，setNodes 内部会按签名跳过重复计算）
    crowd.setNodes(CROWD_NODES, HEARTH_NODE);
    crowd.setCount(st.villagerCount ?? 10);
    crowd.update(dt, { blizzard });

    const project = (gx, gy) => isoPt(gx, gy);

    // 城墙（后半）
    const wallB = lastBuildings.find((b) => b.key === "wall");
    const wallLv = wallB?.level ?? 1;
    const runs = wallRuns(wallLv).sort((a, b) => a.depth - b.depth);
    for (const r of runs) if (r.depth < CX + CY) drawWallRun(r, env);
    drawWallTowers(wallLv, env);

    // 建筑 + 城民 按深度混排
    const items = lastBuildings
      .filter((b) => CITY_LAYOUT[b.key] && !CITY_LAYOUT[b.key].special)
      .map((b) => ({ b, depth: depthOf(b) }))
      .sort((a, b) => a.depth - b.depth);

    let cursor = -Infinity;
    for (const it of items) {
      crowd.draw(ctx, project, { warmthAt: (gx, gy) => warmthAt(gx, gy, env) }, cursor, it.depth);
      cursor = it.depth;
      drawBuilding(it.b, env);
    }
    // 火炉（中心深度）
    const fB = furnaceB || { key: "furnace", level: 1 };
    crowd.draw(ctx, project, { warmthAt: (gx, gy) => warmthAt(gx, gy, env) }, cursor, CX + CY);
    drawFurnace(fB, CITY_LAYOUT.furnace, env);
    crowd.draw(ctx, project, { warmthAt: (gx, gy) => warmthAt(gx, gy, env) }, CX + CY, Infinity);
    crowd.drawPuffs(ctx, project);

    if (hoverKey === "furnace" || hoverKey === "wall") {
      const art = CITY_LAYOUT[hoverKey];
      const ring = gridPolyToWorld(scaleGrid(rectGrid(art.gx, art.gy, art.w, art.d), art.gx, art.gy, 1.3));
      ctx.save();
      ctx.strokeStyle = "rgba(255,178,96,0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      ctx.lineDashOffset = -time * 22;
      ctx.beginPath();
      ctx.moveTo(ring[0].x, ring[0].y);
      for (const p of ring) ctx.lineTo(p.x, p.y);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    drawHearthHalo(env);

    // 城墙（前半）+ 城门
    for (const r of runs) if (r.depth >= CX + CY) drawWallRun(r, env);
    drawGate(wallB || { level: 1 }, CITY_LAYOUT.wall, env);

    embers.update(dt, { wind });
    embers.draw(ctx);

    ctx.restore();

    /* 近景雪 */
    snow.drawFront(ctx, { intensity: blizzard, wind });

    /* 暖冷调色 */
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.1 + blizzard * 0.14;
    const cold = ctx.createLinearGradient(0, 0, 0, H);
    cold.addColorStop(0, "rgba(84,150,190,0.5)");
    cold.addColorStop(0.55, "rgba(40,96,130,0.12)");
    cold.addColorStop(1, "rgba(20,60,90,0.36)");
    ctx.fillStyle = cold;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    /* 寒潮霜雾 */
    drawFrostOverlay(ctx, W, H, time, blizzard);

    // 脉冲衰减
    for (const [k, v] of pulses) {
      const nv = v + dt * 1.5;
      if (nv >= 1) pulses.delete(k);
      else pulses.set(k, nv);
    }
  }

  function setHover(sx, sy) {
    if (sx == null) {
      hoverKey = null;
      pointer = null;
      return null;
    }
    pointer = { x: sx, y: sy };
    hoverKey = pickAt(sx, sy);
    return hoverKey;
  }

  return {
    resize,
    render,
    pickAt,
    setHover,
    recenter,
    panBy,
    zoomAt,
    anchorOf,
    rectOf,
    pulse,
    gridScreen,
    get hover() { return hoverKey; },
    get camera() { return cam; },
    /** 城民的屏幕坐标（调试 / 自动化检查用） */
    get villagers() {
      return crowd.roster.map((p) => {
        const w = isoPt(p.gx, p.gy);
        return { ...toScreen(w.x, w.y), state: p.state };
      });
    },
  };
}
