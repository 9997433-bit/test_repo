/**
 * 城池渲染器 — Canvas 2D 斜视（2.5D）冬夜场景。
 *
 * 层次：夜空/极光 → 雪山 → 远雪原 → 结冰河面 → 雪原台地 → 城墙(后) →
 *       建筑 & 城民（按深度混排）→ 城墙(前) → 火星 → 近景雪 → 暖冷调色 → 霜雾
 *
 * 全部美术都是程序化几何，不依赖任何图片资源。
 */

import {
  createSnowField,
  createEmberField,
  drawFrostOverlay,
  drawGroundDrift,
  renderQuality,
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

/* ── 地块布局 ─────────────────────────────────────────────── */
/**
 * 17 个地块围着火炉排成内外两环：内环 6 个（民生与常用），
 * 外环 9 个（资源与后期解锁），深度 = gx+gy。
 *
 * 两条对角线是刻意空出来的：
 *   45°（正前方，屏幕正下）——城门到火炉的甬道；
 *   225°（正后方，屏幕正上）——火炉塔身在屏幕上正好压住这条线，
 *     内环放东西会被完全遮死（连点都点不到），所以只在外环远端放太学，
 *     让它的塔顶从炉子肩上探出来。
 */
const RING_IN = 3.6;
const RING_OUT = 5.5;
function ring(deg, r) {
  const a = (deg * Math.PI) / 180;
  return {
    gx: Math.round((CX + Math.cos(a) * r) * 100) / 100,
    gy: Math.round((CY + Math.sin(a) * r) * 100) / 100,
  };
}

/**
 * 城墙八边形：顶点在 22.5° + k·45°，正前方 45° 恰好是一条边的中点（城门位）。
 * 半径贴着台地轮廓（drawPlateau 的噪声圆最窄处约 8.7 格）走，
 * 让城墙压在崖沿上，而不是浮在雪原当中。
 */
const WALL_R = 8.3;
const WALL_SIDES = 8;
const GATE_R = WALL_R * Math.cos(Math.PI / WALL_SIDES);
const GATE = {
  gx: Math.round((CX + (GATE_R * Math.SQRT1_2)) * 100) / 100,
  gy: Math.round((CY + (GATE_R * Math.SQRT1_2)) * 100) / 100,
};

/**
 * 地块美术表，键是 data/buildings.js 的**权威 id**。
 *
 * roof:  gable | hip | pagoda | flat | shed | tent | none
 * props: drawProps 的分支名，决定地块旁的程序化摆件
 * role:  home / work —— 城民通勤节点的类型，缺省表示不派人
 * flag:  旗幡描述（招贤馆 / 书院），{ color, trim, dx, h, len }
 */
const TILES = {
  /* 中心 */
  furnace: {
    gx: CX, gy: CY, w: 2.9, d: 2.9, h: 14, roof: "none",
    base: "#6d818f", roofTone: "#2f4b59", special: "furnace", icon: "🔥",
  },

  /* 内环 r=3.6 —— 0° / 90° / 135° / 180° / 270° / 315° */
  hunter: {
    ...ring(0, RING_IN), w: 1.45, d: 1.4, h: 16, roof: "gable",
    base: "#84714f", roofTone: "#2f4b59", props: "racks", icon: "🏹",
    role: "work", yield: "food",
  },
  coal_mine: {
    ...ring(90, RING_IN), w: 1.6, d: 1.4, h: 15, roof: "flat",
    base: "#4a545d", roofTone: "#33424c", props: "coal", icon: "⛏",
    role: "work", yield: "coal",
  },
  barracks_inf: {
    ...ring(135, RING_IN), w: 1.9, d: 1.55, h: 21, roof: "gable",
    base: "#5f6a55", roofTone: "#2c4450", props: "spears", icon: "🛡",
    role: "work", stripe: true,
  },
  hospital: {
    ...ring(180, RING_IN), w: 1.75, d: 1.5, h: 11, roof: "tent",
    base: "#6f7b7a", roofTone: "#b9c6c0", props: "cots", icon: "⛑",
    role: "work",
  },
  tavern: {
    ...ring(270, RING_IN), w: 1.7, d: 1.6, h: 20, roof: "pagoda",
    base: "#8e453c", roofTone: "#33505f", props: "lanterns", icon: "🍶",
    role: "work", flag: { color: "#b23a30", trim: "#e8c878", dx: -32, h: 70, len: 44, seed: 2.3 },
  },
  kitchen: {
    ...ring(315, RING_IN), w: 1.5, d: 1.35, h: 16, roof: "gable",
    base: "#7d6142", roofTone: "#2f4b59", props: "kitchen", icon: "🍲",
    role: "work", yield: "food",
  },

  /* 外环 r=5.5 —— 关于 45°/225° 轴对称的 9 格 */
  lumber: {
    ...ring(22.5, RING_OUT), w: 1.75, d: 1.55, h: 18, roof: "gable",
    base: "#7d6142", roofTone: "#2f4b59", props: "logs", icon: "🪓",
    role: "work", yield: "wood",
  },
  house: {
    ...ring(67.5, RING_OUT), w: 1.7, d: 1.7, h: 19, roof: "gable",
    base: "#8a6a49", roofTone: "#2f4b59", props: "huts", icon: "🏠",
    role: "home",
  },
  warehouse: {
    ...ring(112.5, RING_OUT), w: 1.8, d: 1.55, h: 17, roof: "hip",
    base: "#7a6047", roofTone: "#2f4b59", props: "crates", icon: "📦",
    role: "work", yield: "food",
  },
  barracks_arch: {
    ...ring(157.5, RING_OUT), w: 1.8, d: 1.45, h: 18, roof: "shed",
    base: "#5a6a60", roofTone: "#2c4450", props: "butts", icon: "🏹",
    role: "work",
  },
  barracks_cav: {
    ...ring(190, RING_OUT), w: 1.95, d: 1.2, h: 12, roof: "shed",
    base: "#6b5a44", roofTone: "#41352a", props: "stable", icon: "🐎",
    role: "work",
  },
  /* 正后方：太学是全城第二高的剪影，塔顶与旗杆从火炉肩上露出来 */
  academy: {
    ...ring(225, RING_OUT), w: 1.85, d: 1.6, h: 26, roof: "pagoda",
    base: "#3f6b78", roofTone: "#33505f", props: "scrolls", icon: "📜",
    role: "work", flag: { color: "#2f6f86", trim: "#dbe9f2", dx: 32, h: 80, len: 48, seed: 0.7 },
  },
  embassy: {
    ...ring(260, RING_OUT), w: 1.9, d: 1.6, h: 18, roof: "hip",
    base: "#6a5a78", roofTone: "#33505f", props: "envoys", icon: "🤝",
    role: "work",
  },
  clinic: {
    ...ring(292.5, RING_OUT), w: 1.45, d: 1.3, h: 17, roof: "gable",
    base: "#4f7a68", roofTone: "#2f4b59", props: "herbs", icon: "🌿",
    role: "work",
  },
  iron_mine: {
    ...ring(337.5, RING_OUT), w: 1.6, d: 1.4, h: 15, roof: "flat",
    base: "#4d5865", roofTone: "#33424c", props: "iron", icon: "⚒",
    role: "work", yield: "iron",
  },

  /* 城垣：坐在台地边缘的八边形上，地块本身是正前方的城门楼 */
  wall: {
    gx: GATE.gx, gy: GATE.gy, w: 1.6, d: 1.6, h: 30, roof: "flat",
    base: "#5c6a74", roofTone: "#33505f", special: "wall", icon: "🧱",
  },
};

for (const [id, art] of Object.entries(TILES)) art.id = id;

/**
 * 旧渲染键 / 旧存档 id → 权威 id。
 * 同一地块可以同时挂多个键（别名与权威 id 指向**同一个**美术对象），
 * 所以 bridge 层无论送来 `coal` 还是 `coal_mine`，画出来都是同一格。
 */
export const LAYOUT_ALIASES = {
  coal: "coal_mine",
  coalmine: "coal_mine",
  coalMine: "coal_mine",
  iron: "iron_mine",
  ironmine: "iron_mine",
  ironMine: "iron_mine",
  storage: "warehouse",
  storehouse: "warehouse",
  barracks: "barracks_inf",
  barracksInf: "barracks_inf",
  barracksArch: "barracks_arch",
  barracksCav: "barracks_cav",
  recruit: "tavern",
  recruitHall: "tavern",
  infirmary: "hospital",
  lumberyard: "lumber",
  lumberCamp: "lumber",
  hunterHut: "hunter",
  warmhouse: "house",
};

/** 权威 id 与旧别名共用一张表；`CITY_LAYOUT.coal === CITY_LAYOUT.coal_mine`。 */
export const CITY_LAYOUT = (() => {
  const out = {};
  for (const [id, art] of Object.entries(TILES)) out[id] = art;
  for (const [alias, id] of Object.entries(LAYOUT_ALIASES)) {
    if (TILES[id] && !out[alias]) out[alias] = TILES[id];
  }
  return out;
})();

/** 任意键 → 权威地块 id（查不到时原样返回，便于调试）。 */
export function tileIdOf(key) {
  return CITY_LAYOUT[key]?.id ?? key;
}

/** 民居随等级长出的附屋位置；drawProps 与城民节点共用，保证人站在真房子前。 */
function hutSpots(art, level) {
  const n = Math.min(3, Math.floor((Math.max(1, level) - 1) / 2));
  const out = [];
  for (let i = 0; i < n; i++) {
    const ang = 1.1 + i * 1.5;
    out.push({
      gx: art.gx + Math.cos(ang) * 1.3,
      gy: art.gy + Math.sin(ang) * 1.15,
    });
  }
  return out;
}

/** 城民站位要让出屋檐，偏移量随地块大小走。 */
function apronOf(art) {
  return 0.6 + Math.max(art.w, art.d) * 0.4;
}

/**
 * 炉台禁行圈：石台阶是 3.1×3.1 的方台（角点在 ±1.55），
 * 取外接半径再留一点余量，城民无论走路还是站定都不许踏进来。
 */
const FURNACE_CORE_R = 2.24;

/**
 * 城民的取暖点：火炉正前方。围站半径以「取暖点」为心，
 * 但真正的禁区以「炉心」为心——两者差 1.6 格，只靠 r0 挡不住
 * （正北方向的采样点会正好落回炉子中央）。
 */
const HEARTH_NODE = {
  key: "hearth",
  gx: CX, gy: CY + 1.6,
  r0: 2.4, r1: 3.3,
  coreGx: CX, coreGy: CY, coreR: FURNACE_CORE_R,
};

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
/**
 * 明暗 + 冷暖混合。
 * 炉火只在近处压过夜色，混合量刻意压得比较低——否则屋顶会被烤成一片橘黄，
 * 十几座建筑的固有色就全糊在一起了。
 */
function shadeWarm(hex, light, warm, a = 1) {
  const [r, g, b] = rgbOf(hex);
  // 冷夜基调：整体压暗并偏青
  let R = r * light;
  let G = g * light * 1.02;
  let B = b * light * 1.16;
  if (warm > 0) {
    R = R + (255 - R) * warm * 0.44;
    G = G + (176 - G) * warm * 0.3;
    B = B + (96 - B) * warm * 0.18;
  }
  return css(Math.min(255, R), Math.min(255, G), Math.min(255, B), a);
}

/* ── 火势 ─────────────────────────────────────────────────── */
/** 熄火后炉膛并非全黑，留一点余烬的暗红 */
const EMBER_FLOOR = 0.06;
/** 火势低于这条线就只剩余烬，不再画火舌——一根一像素高的火苗比没有更假 */
const FLAME_MIN = 0.16;

/**
 * 当前火势 0~1：已经把「点没点着」（含熄火过渡）与跳动一起算进去了。
 * env 由 render() 组装；这里对缺字段的 env 也给得出结果，
 * 免得上游少送一个字段就整帧崩掉。
 */
function fireOf(env) {
  if (!env) return 0;
  if (Number.isFinite(env.fire)) return Math.max(0, Math.min(1, env.fire));
  const lit = env.furnaceLit === false ? 0 : 1;
  const flick = Number.isFinite(env.flicker) ? env.flicker : 1;
  return Math.max(0, Math.min(1, (EMBER_FLOOR + (1 - EMBER_FLOOR) * lit) * flick));
}

/** 宽松地把各种写法读成真假；读不出来返回 null，交给调用方兜底。 */
function boolish(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return Number.isFinite(v) ? v > 0 : null;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "on" || s === "lit" || s === "burning") return true;
    if (s === "false" || s === "0" || s === "off" || s === "out" || s === "cold") return false;
  }
  return null;
}

/**
 * 火炉点没点着。
 *
 * 视图层现在给的是顶层的 `furnaceLit`，但这份投影换过好几版
 * （曾挂在 climate 下，也可能落到 furnace 那一行上），所以按优先级挨个试，
 * 全都没有就退回「有炉子就当它烧着」——少一个字段不该让整帧崩掉。
 */
function readFurnaceLit(st, furnaceB) {
  const src = st || {};
  const cands = [
    src.furnaceLit,
    src.env?.furnaceLit,
    src.climate?.furnaceLit,
    src.furnace?.lit,
    furnaceB?.furnaceLit,
    furnaceB?.lit,
  ];
  for (const v of cands) {
    const t = boolish(v);
    if (t !== null) return t && !(Number.isFinite(furnaceB?.level) && furnaceB.level <= 0);
  }
  // 连热量都没有就当熄了；字段整个缺席时维持旧行为（烧着）
  const heat = Number(src.furnaceHeat);
  if (Number.isFinite(heat)) return heat > 0;
  return !(Number.isFinite(furnaceB?.level) && furnaceB.level <= 0);
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
  const embers = createEmberField(420);
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
  let litMix = 1;      // 点火程度 0~1，熄火时平滑落到 0
  let hoverKey = null;
  let pointer = null;
  const pulses = new Map();

  // 台地轮廓（网格空间，带噪声的圆）
  const PLATEAU = [];
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * TAU;
    const r = 9.0 + fbm(i * 0.32, 11, 3) * 1.3 - 0.3;
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
    for (const art of Object.values(TILES)) {
      const w = isoPt(art.gx, art.gy);
      y0 = Math.min(y0, w.y - tileTop(art, 6) - 14);
    }
    // 台地近岸可以出血到画面外，城门楼不行——它是最靠镜头的一座建筑
    const gate = isoPt(GATE.gx, GATE.gy);
    return { x0, x1, y0, y1: y1 + BANK_DROP, safeY1: gate.y + 30 };
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
    const zoomW = (W * 0.96) / contentW;
    // 高度吃紧时允许近岸略微出血到画面下缘，宽屏才不会显得城池太小；
    // 但出血量不能大到把城门楼推出画面
    const zoomH = Math.min(
      (usableH / contentH) * 1.16,
      usableH / (FRAME.safeY1 - FRAME.y0),
    );
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
    const R = 4.2 + (env?.furnaceLevel ?? 1) * 0.14;
    const k = Math.exp(-(d * d) / (2 * R * R));
    return Math.min(1, k * fireOf(env));
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

  /** rectGrid 里朝镜头的两条边（B-C 右前、C-D 左前）。 */
  const FRONT_EDGES = [[1, 2], [2, 3]];

  /**
   * 把装饰贴到某个立面上：回调里用「局部坐标」画，
   * x ∈ [-len, len] 沿墙面横向，y 向上为负，坐标已经带好该面的斜切。
   */
  function onFace(g0, g1, lift, draw) {
    const p0 = isoPt(g0.gx, g0.gy);
    const p1 = isoPt(g1.gx, g1.gy);
    const ux = (p1.x - p0.x) / 2;
    const uy = (p1.y - p0.y) / 2;
    const len = Math.hypot(ux, uy) || 1;
    ctx.save();
    ctx.transform(ux / len, uy / len, 0, 1, (p0.x + p1.x) / 2, (p0.y + p1.y) / 2 - lift);
    draw(len, faceLight(g0, g1));
    ctx.restore();
  }

  /* ── 屋顶 ───────────────────────────────────────────────── */
  function scaleGrid(gpts, gx, gy, k) {
    return gpts.map((p) => ({ gx: gx + (p.gx - gx) * k, gy: gy + (p.gy - gy) * k }));
  }

  function drawGableRoof(gpts, gx, gy, lift, rh, env, tone) {
    const ex = scaleGrid(gpts, gx, gy, 1.1);
    const w = gridPolyToWorld(ex).map((p) => ({ x: p.x, y: p.y - lift }));
    const [A, B, C, D] = w;
    const R1 = { x: (A.x + D.x) / 2, y: (A.y + D.y) / 2 - rh };
    const R2 = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 - rh };
    const warm = warmthAt(gx, gy, env) * 0.5;

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

  function drawHipRoof(gpts, gx, gy, lift, rh, env, tone, overhang = 1.08) {
    const ex = scaleGrid(gpts, gx, gy, overhang);
    const w = gridPolyToWorld(ex).map((p) => ({ x: p.x, y: p.y - lift }));
    const c = isoPt(gx, gy);
    const apex = { x: c.x, y: c.y - lift - rh };
    const warm = warmthAt(gx, gy, env) * 0.5;
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
    // 双层飞檐：下檐宽而缓，上檐窄而陡，中间露出一段腰身
    const t1 = drawFlare(gpts, gx, gy, lift, rh * 0.46, 1.18, tone, env);
    const waist = scaleGrid(gpts, gx, gy, 0.66);
    drawPrism(waist, lift + rh * 0.3, rh * 0.3, "#6b5a4a", env, { topLight: 1.0, warmMul: 0.4 });
    const t2 = drawFlare(waist, gx, gy, lift + rh * 0.6, rh * 0.52, 1.24, tone, env);
    // 宝顶
    const c = isoPt(gx, gy);
    ctx.fillStyle = "#e0c07a";
    ctx.fillRect(c.x - 0.9, c.y - lift - rh * 1.12 - 6, 1.8, 8);
    ctx.beginPath();
    ctx.arc(c.x, c.y - lift - rh * 1.12 - 7, 2.8, 0, TAU);
    ctx.fill();
    return t2 || t1;
  }

  function drawFlare(gpts, gx, gy, lift, rh, overhang, tone, env) {
    const ex = scaleGrid(gpts, gx, gy, overhang);
    const w = gridPolyToWorld(ex).map((p) => ({ x: p.x, y: p.y - lift }));
    const c = isoPt(gx, gy);
    const apex = { x: c.x, y: c.y - lift - rh };
    const warm = warmthAt(gx, gy, env) * 0.5;
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

  /** 单坡顶：后高前低，露出椽头。弓兵营 / 骑兵营的敞棚就靠它区分。 */
  function drawShedRoof(gpts, gx, gy, lift, rh, env, tone) {
    const ex = scaleGrid(gpts, gx, gy, 1.1);
    const w = gridPolyToWorld(ex).map((p) => ({ x: p.x, y: p.y - lift }));
    const [A, B, C, D] = w;
    const hi = rh;
    const lo = rh * 0.22;
    const Ah = { x: A.x, y: A.y - hi };
    const Bh = { x: B.x, y: B.y - hi };
    const Cl = { x: C.x, y: C.y - lo };
    const Dl = { x: D.x, y: D.y - lo };
    const warm = warmthAt(gx, gy, env) * 0.5;

    // 两侧竖直填补（后侧先画）
    fillPoly([A, D, Dl, Ah], shadeWarm(tone, 0.7, warm * 0.4));
    fillPoly([B, C, Cl, Bh], shadeWarm(tone, 1.0, warm * 0.7));
    // 坡面
    fillPoly([Ah, Bh, Cl, Dl], shadeWarm(tone, 1.2, warm * 0.8));
    ctx.save();
    ctx.globalAlpha = 0.3;
    fillPoly([Ah, Bh, Cl, Dl], "rgba(224,246,255,0.62)");
    ctx.restore();
    // 铺板缝：单坡面积大，没有分缝就是一整片色块
    ctx.strokeStyle = "rgba(30,40,46,0.34)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      ctx.moveTo(Ah.x + (Bh.x - Ah.x) * t, Ah.y + (Bh.y - Ah.y) * t);
      ctx.lineTo(Dl.x + (Cl.x - Dl.x) * t, Dl.y + (Cl.y - Dl.y) * t);
    }
    ctx.stroke();
    // 脊压条
    ctx.strokeStyle = "rgba(232,248,255,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Ah.x, Ah.y);
    ctx.lineTo(Bh.x, Bh.y);
    ctx.stroke();
    // 椽头：沿前檐排一列短木
    ctx.strokeStyle = shadeWarm("#4a3c2c", 1.1, warm * 0.5);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= 5; i++) {
      const t = i / 5;
      const x = Dl.x + (Cl.x - Dl.x) * t;
      const y = Dl.y + (Cl.y - Dl.y) * t;
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 3.4);
    }
    ctx.stroke();
    snowLip([Dl, Cl], 0.3);
    return { peak: Math.min(Ah.y, Bh.y) };
  }

  /** 帐篷顶：帆布中部下垂、檐口起波，用于伤兵营的军帐。 */
  function drawTentRoof(gpts, gx, gy, lift, rh, env, tone) {
    const ex = scaleGrid(gpts, gx, gy, 1.14);
    const w = gridPolyToWorld(ex).map((p) => ({ x: p.x, y: p.y - lift }));
    const [A, B, C, D] = w;
    const R1 = { x: (A.x + D.x) / 2, y: (A.y + D.y) / 2 - rh };
    const R2 = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 - rh };
    const warm = warmthAt(gx, gy, env) * 0.5;

    const panel = (e0, e1, light, sag) => {
      ctx.beginPath();
      ctx.moveTo(R1.x, R1.y);
      ctx.lineTo(R2.x, R2.y);
      ctx.lineTo(e1.x, e1.y);
      ctx.quadraticCurveTo((e0.x + e1.x) / 2, (e0.y + e1.y) / 2 + sag, e0.x, e0.y);
      ctx.closePath();
      ctx.fillStyle = shadeWarm(tone, light, warm * 0.6);
      ctx.fill();
      // 帆布接缝
      ctx.strokeStyle = "rgba(90,110,120,0.34)";
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      for (let i = 1; i < 4; i++) {
        const t = i / 4;
        ctx.moveTo(R1.x + (R2.x - R1.x) * t, R1.y + (R2.y - R1.y) * t);
        ctx.lineTo(e0.x + (e1.x - e0.x) * t, e0.y + (e1.y - e0.y) * t + sag * 0.6);
      }
      ctx.stroke();
    };
    panel(A, B, 0.82, 3);      // 后坡
    panel(D, C, 1.26, 4.5);    // 前坡

    ctx.save();
    ctx.globalAlpha = 0.34;
    ctx.fillStyle = "rgba(228,246,255,0.6)";
    ctx.beginPath();
    ctx.moveTo(R1.x, R1.y);
    ctx.lineTo(R2.x, R2.y);
    ctx.lineTo(C.x, C.y);
    ctx.quadraticCurveTo((D.x + C.x) / 2, (D.y + C.y) / 2 + 4.5, D.x, D.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 帐脊与两端立杆
    ctx.strokeStyle = "rgba(236,250,255,0.62)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(R1.x, R1.y);
    ctx.lineTo(R2.x, R2.y);
    ctx.stroke();
    ctx.strokeStyle = shadeWarm("#4a4034", 1.1, warm * 0.4);
    ctx.lineWidth = 1.4;
    for (const [r, e] of [[R1, D], [R2, C]]) {
      ctx.beginPath();
      ctx.moveTo(r.x, r.y - 6);
      ctx.lineTo(r.x, r.y);
      ctx.stroke();
      // 绷绳
      ctx.strokeStyle = "rgba(198,220,232,0.4)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y - 5);
      ctx.lineTo(e.x + (e.x - r.x) * 0.35, e.y + 8);
      ctx.stroke();
      ctx.strokeStyle = shadeWarm("#4a4034", 1.1, warm * 0.4);
      ctx.lineWidth = 1.4;
    }
    snowLip([D, C], 0.3);
    return { peak: Math.min(R1.y, R2.y) };
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

  /* ── 通用小件 ───────────────────────────────────────────── */
  /** 竖挂的旗幡，杆顶带鎏金宝珠；招贤馆与书院靠它一眼可辨。 */
  function drawFlag(c, f, warm) {
    const bx = c.x + (f.dx ?? 26);
    const base = c.y + (f.dy ?? 8);
    const top = base - (f.h ?? 68);
    const seed = f.seed ?? 0;

    ctx.strokeStyle = shadeWarm("#453a2e", 1.1, warm * 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx, base);
    ctx.lineTo(bx, top);
    ctx.stroke();
    ctx.fillStyle = shadeWarm("#e0c07a", 1.15, warm * 0.6);
    ctx.beginPath();
    ctx.arc(bx, top - 4, 2.6, 0, TAU);
    ctx.fill();

    const len = f.len ?? 44;
    const wid = f.w ?? 11;
    const segs = 6;
    const sway = (t) => Math.sin(time * 2.1 + seed + t * 2.4) * (1.4 + t * 4.6);
    ctx.beginPath();
    ctx.moveTo(bx, top + 2);
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      ctx.lineTo(bx + sway(t), top + 2 + t * len);
    }
    for (let i = segs; i >= 0; i--) {
      const t = i / segs;
      ctx.lineTo(bx + sway(t) + wid * (1 - t * 0.18), top + 2 + t * len);
    }
    ctx.closePath();
    ctx.fillStyle = shadeWarm(f.color, 1.2, warm * 0.7);
    ctx.fill();
    // 幡边与横档
    ctx.strokeStyle = shadeWarm(f.trim || "#e8dcc0", 1.2, warm * 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 3; i++) {
      const t = i / 3;
      ctx.moveTo(bx + sway(t), top + 2 + t * len);
      ctx.lineTo(bx + sway(t) + wid * (1 - t * 0.18), top + 2 + t * len);
    }
    ctx.stroke();
  }

  /** 小三角旗（兵营 / 使馆用），bx/by 为杆脚。 */
  function drawPennant(bx, by, h, color, warm, seed) {
    ctx.strokeStyle = shadeWarm("#4a4034", 1.05, warm * 0.4);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx, by - h);
    ctx.stroke();
    const wave = Math.sin(time * 2.4 + seed) * 2.6;
    ctx.fillStyle = shadeWarm(color, 1.18, warm * 0.6);
    ctx.beginPath();
    ctx.moveTo(bx, by - h);
    ctx.quadraticCurveTo(bx + 8 + wave, by - h + 4, bx + 13, by - h + 10);
    ctx.lineTo(bx + 11 + wave, by - h + 19);
    ctx.quadraticCurveTo(bx + 6, by - h + 18, bx, by - h + 18);
    ctx.closePath();
    ctx.fill();
  }

  /** 一匹侧影小马（骑兵营）。 */
  function drawHorse(x, y, k, tone, warm, phase) {
    const bob = Math.sin(time * 1.3 + phase) * 0.7;
    const body = shadeWarm(tone, 1.0, warm * 0.5);
    const dark = shadeWarm(tone, 0.66, warm * 0.35);
    ctx.fillStyle = dark;
    ctx.fillRect(x - 5 * k, y - 5 * k, 1.5 * k, 5 * k);
    ctx.fillRect(x - 1.6 * k, y - 5 * k, 1.5 * k, 5 * k);
    ctx.fillRect(x + 2.2 * k, y - 5 * k, 1.5 * k, 5 * k);
    ctx.fillRect(x + 5.2 * k, y - 5 * k, 1.5 * k, 5 * k);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(x, y - 8 * k + bob, 6.6 * k, 3.2 * k, 0, 0, TAU);
    ctx.fill();
    // 颈与头
    ctx.beginPath();
    ctx.moveTo(x + 4.4 * k, y - 9.4 * k + bob);
    ctx.lineTo(x + 8.4 * k, y - 14.4 * k + bob);
    ctx.lineTo(x + 10.6 * k, y - 13.2 * k + bob);
    ctx.lineTo(x + 6.6 * k, y - 8.0 * k + bob);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 10.2 * k, y - 13.6 * k + bob, 2.3 * k, 1.4 * k, -0.35, 0, TAU);
    ctx.fill();
    // 鬃与尾
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.moveTo(x + 4.8 * k, y - 10.4 * k + bob);
    ctx.lineTo(x + 8.8 * k, y - 15.0 * k + bob);
    ctx.lineTo(x + 8.0 * k, y - 12.4 * k + bob);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 6.2 * k, y - 10.2 * k + bob);
    ctx.quadraticCurveTo(x - 9.4 * k, y - 8 * k + bob, x - 8.2 * k, y - 4.2 * k + bob);
    ctx.lineTo(x - 6.4 * k, y - 5.4 * k + bob);
    ctx.closePath();
    ctx.fill();
  }

  /* ── 建筑附件 ───────────────────────────────────────────── */
  function drawProps(kind, b, art, env) {
    const c = isoPt(art.gx, art.gy);
    const lv = Math.max(1, b.level || 1);
    const warm = warmthAt(art.gx, art.gy, env);
    ctx.save();
    switch (kind) {
      case "huts": {
        for (const s of hutSpots(art, lv)) {
          const fp = rectGrid(s.gx, s.gy, 0.72, 0.68);
          drawPrism(fp, 0, 10, "#7c5f42", env, { topLight: 1.1 });
          drawGableRoof(fp, s.gx, s.gy, 10, 8, env, "#33505f");
        }
        break;
      }
      case "logs": {
        for (let i = 0; i < 3 + Math.min(4, lv); i++) {
          const lx = c.x - 44 + (i % 4) * 13;
          const ly = c.y + 16 + Math.floor(i / 4) * 7;
          ctx.fillStyle = shadeWarm("#7a5c3c", 1.0, warm);
          ctx.fillRect(lx, ly - 5, 14, 5);
          ctx.fillStyle = shadeWarm("#c6a677", 1.1, warm);
          ctx.beginPath();
          ctx.ellipse(lx + 14, ly - 2.5, 1.8, 2.5, 0, 0, TAU);
          ctx.fill();
        }
        // 锯木架
        ctx.strokeStyle = shadeWarm("#6b5236", 1.15, warm);
        ctx.lineWidth = 1.8;
        const sx = c.x + 22;
        const sy = c.y + 15;
        ctx.beginPath();
        ctx.moveTo(sx - 7, sy); ctx.lineTo(sx + 3, sy - 11);
        ctx.moveTo(sx + 7, sy); ctx.lineTo(sx - 3, sy - 11);
        ctx.stroke();
        ctx.fillStyle = shadeWarm("#8a6a45", 1.05, warm);
        ctx.fillRect(sx - 11, sy - 13, 22, 4);
        ctx.strokeStyle = "rgba(214,236,248,0.7)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(sx - 9, sy - 16);
        ctx.lineTo(sx + 10, sy - 18);
        ctx.stroke();
        // 松树
        for (let i = 0; i < 3; i++) {
          drawPine(art.gx + 1.3 + i * 0.16, art.gy - 0.95 + i * 0.74, 1 + (i % 2) * 0.2, env);
        }
        break;
      }
      case "racks": {
        ctx.strokeStyle = shadeWarm("#6b5236", 1.1, warm);
        ctx.lineWidth = 1.6;
        for (let i = 0; i < 2; i++) {
          const bx = c.x - 28 + i * 46;
          ctx.beginPath();
          ctx.moveTo(bx, c.y + 12);
          ctx.lineTo(bx, c.y - 12);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(c.x - 28, c.y - 10);
        ctx.lineTo(c.x + 18, c.y - 10);
        ctx.stroke();
        // 晾着的兽皮
        for (let i = 0; i < 3; i++) {
          const px = c.x - 24 + i * 15;
          ctx.fillStyle = shadeWarm(i % 2 ? "#9c5a48" : "#7d6a4c", 1.05, warm);
          ctx.beginPath();
          ctx.moveTo(px, c.y - 10);
          ctx.lineTo(px + 7, c.y - 10);
          ctx.lineTo(px + 6, c.y - 1);
          ctx.lineTo(px + 1, c.y - 1);
          ctx.closePath();
          ctx.fill();
        }
        // 靠着的弓
        ctx.strokeStyle = shadeWarm("#8a6a45", 1.2, warm);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(c.x + 30, c.y + 2, 9, -1.1, 1.1);
        ctx.stroke();
        ctx.strokeStyle = "rgba(226,242,250,0.55)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(c.x + 34, c.y - 6);
        ctx.lineTo(c.x + 34, c.y + 10);
        ctx.stroke();
        break;
      }
      case "coal":
      case "iron": {
        const dark = kind === "coal" ? "#20262b" : "#4a5866";
        for (let i = 0; i < 3; i++) {
          const px = c.x - 36 + i * 22;
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
        if (kind === "coal") {
          // 井架：两根斜柱交叉，顶上一只天轮
          const hx = c.x + 28;
          const hy = c.y + 8;
          ctx.strokeStyle = shadeWarm("#5a4a38", 1.15, warm * 0.5);
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(hx - 11, hy); ctx.lineTo(hx + 5, hy - 30);
          ctx.moveTo(hx + 11, hy); ctx.lineTo(hx - 5, hy - 30);
          ctx.stroke();
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(hx - 7, hy - 11); ctx.lineTo(hx + 7, hy - 11);
          ctx.stroke();
          ctx.strokeStyle = shadeWarm("#8fa4b4", 1.15, warm * 0.4);
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(hx, hy - 31, 4.2, 0, TAU);
          ctx.stroke();
          ctx.strokeStyle = "rgba(190,214,228,0.5)";
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(hx, hy - 27);
          ctx.lineTo(hx, hy - 4 + Math.sin(time * 0.7) * 2);
          ctx.stroke();
          // 矿口
          ctx.fillStyle = "rgba(4,10,14,0.85)";
          ctx.beginPath();
          ctx.ellipse(hx, hy - 1, 7, 3.2, 0, 0, TAU);
          ctx.fill();
        } else {
          // 小炼炉：炉膛透红光，偶尔溅出火星
          const fx = c.x + 30;
          const fy = c.y + 10;
          drawPrismScreen(fx, fy, 15, 20, shadeWarm("#3f4a52", 1.0, warm * 0.5), shadeWarm("#5b6b76", 1.2, warm * 0.5));
          const f = 0.55 + 0.45 * Math.sin(time * 4.1 + 1.4);
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = 0.42 * f;
          ctx.drawImage(glowWarm, fx - 20, fy - 30, 40, 40);
          ctx.restore();
          ctx.fillStyle = `rgba(255,${140 + f * 70},${60 + f * 40},${0.8})`;
          ctx.beginPath();
          ctx.ellipse(fx, fy - 8, 3.4, 2.6, 0, 0, TAU);
          ctx.fill();
          if (Math.random() < 0.08) {
            embers.spawn("ember", fx, fy - 20, { spread: 3, vy: -26, hue: 34 });
          }
          // 铁砧
          ctx.fillStyle = shadeWarm("#39434c", 1.1, warm * 0.4);
          ctx.fillRect(c.x - 44, c.y + 4, 12, 4);
          ctx.fillRect(c.x - 40, c.y + 8, 4, 5);
        }
        break;
      }
      case "crates": {
        for (let i = 0; i < 4; i++) {
          const bx = c.x - 42 + (i % 2) * 17;
          const by = c.y + 15 + Math.floor(i / 2) * 8;
          const fp = [
            { x: bx, y: by }, { x: bx + 9, y: by + 4.5 },
            { x: bx, y: by + 9 }, { x: bx - 9, y: by + 4.5 },
          ];
          fillPoly([fp[1], fp[2], { x: fp[2].x, y: fp[2].y - 9 }, { x: fp[1].x, y: fp[1].y - 9 }], shadeWarm("#8a6a45", 0.8, warm));
          fillPoly([fp[3], fp[2], { x: fp[2].x, y: fp[2].y - 9 }, { x: fp[3].x, y: fp[3].y - 9 }], shadeWarm("#8a6a45", 0.62, warm));
          fillPoly(fp.map((p) => ({ x: p.x, y: p.y - 9 })), shadeWarm("#b18a5c", 1.1, warm));
        }
        // 圆囤：竹壁 + 草顶，仓库的招牌轮廓
        const gxp = c.x + 30;
        const gyp = c.y + 12;
        const gh = 20 + Math.min(3, lv) * 2;
        ctx.fillStyle = shadeWarm("#8e7448", 0.86, warm);
        ctx.beginPath();
        ctx.moveTo(gxp - 11, gyp);
        ctx.lineTo(gxp - 11, gyp - gh);
        ctx.lineTo(gxp + 11, gyp - gh);
        ctx.lineTo(gxp + 11, gyp);
        ctx.ellipse(gxp, gyp, 11, 4.4, 0, 0, Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = shadeWarm("#b0925e", 1.16, warm);
        ctx.beginPath();
        ctx.ellipse(gxp - 3, gyp - gh * 0.5, 4.6, gh * 0.42, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = "rgba(60,48,32,0.4)";
        ctx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
          ctx.beginPath();
          ctx.ellipse(gxp, gyp - (gh * i) / 3, 11, 3.6, 0, 0, Math.PI);
          ctx.stroke();
        }
        ctx.fillStyle = shadeWarm("#7d6a3f", 1.12, warm);
        ctx.beginPath();
        ctx.moveTo(gxp - 14, gyp - gh);
        ctx.lineTo(gxp, gyp - gh - 13);
        ctx.lineTo(gxp + 14, gyp - gh);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(230,248,255,0.5)";
        ctx.beginPath();
        ctx.moveTo(gxp - 9, gyp - gh - 4);
        ctx.lineTo(gxp, gyp - gh - 13);
        ctx.lineTo(gxp + 9, gyp - gh - 4);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case "spears": {
        // 枪架 + 靠墙的圆盾，配两面赤旗
        const rx = c.x - 34;
        const ry = c.y + 13;
        ctx.strokeStyle = shadeWarm("#5b4630", 1.1, warm);
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(rx - 12, ry); ctx.lineTo(rx - 12, ry - 13);
        ctx.moveTo(rx + 14, ry); ctx.lineTo(rx + 14, ry - 13);
        ctx.moveTo(rx - 13, ry - 12); ctx.lineTo(rx + 15, ry - 12);
        ctx.stroke();
        for (let i = 0; i < 5; i++) {
          const px = rx - 9 + i * 6;
          ctx.strokeStyle = shadeWarm("#7a5c3c", 1.15, warm);
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(px, ry);
          ctx.lineTo(px + 2, ry - 30);
          ctx.stroke();
          ctx.fillStyle = shadeWarm("#b8c8d4", 1.25, warm * 0.5);
          ctx.beginPath();
          ctx.moveTo(px + 2, ry - 35);
          ctx.lineTo(px + 4, ry - 29);
          ctx.lineTo(px, ry - 29);
          ctx.closePath();
          ctx.fill();
        }
        for (let i = 0; i < 3; i++) {
          const sx2 = c.x + 16 + i * 13;
          ctx.fillStyle = shadeWarm("#6e4a35", 1.05, warm);
          ctx.beginPath();
          ctx.ellipse(sx2, c.y + 6, 6.4, 7.6, 0.2, 0, TAU);
          ctx.fill();
          ctx.fillStyle = shadeWarm("#c2ac72", 1.2, warm * 0.6);
          ctx.beginPath();
          ctx.arc(sx2, c.y + 6, 2.1, 0, TAU);
          ctx.fill();
        }
        const n = 2 + Math.min(2, Math.floor(lv / 3));
        for (let i = 0; i < n; i++) drawPennant(c.x - 44 + i * 20, c.y + 10, 34, "#a8342c", warm, i * 1.7);
        break;
      }
      case "butts": {
        // 草垛箭靶 + 箭囊
        for (let i = 0; i < 2; i++) {
          const tx = c.x - 40 + i * 74;
          const ty = c.y + 12;
          ctx.strokeStyle = shadeWarm("#5b4630", 1.05, warm);
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(tx - 6, ty); ctx.lineTo(tx, ty - 10);
          ctx.moveTo(tx + 6, ty); ctx.lineTo(tx, ty - 10);
          ctx.stroke();
          const rings = [[9, "#c9b98c"], [6, "#b8452f"], [3, "#e8ddc0"]];
          for (const [r, col] of rings) {
            ctx.fillStyle = shadeWarm(col, 1.12, warm * 0.6);
            ctx.beginPath();
            ctx.ellipse(tx, ty - 18, r, r * 1.05, 0, 0, TAU);
            ctx.fill();
          }
          // 插着的箭
          ctx.strokeStyle = shadeWarm("#8a6a45", 1.2, warm * 0.6);
          ctx.lineWidth = 1;
          for (let k = 0; k < 3; k++) {
            const a = -0.6 + k * 0.5;
            ctx.beginPath();
            ctx.moveTo(tx + Math.cos(a) * 3, ty - 18 + Math.sin(a) * 3);
            ctx.lineTo(tx + Math.cos(a) * 3 + 9, ty - 18 + Math.sin(a) * 3 - 4);
            ctx.stroke();
          }
        }
        // 箭囊
        for (let i = 0; i < 2; i++) {
          const qx = c.x - 6 + i * 16;
          ctx.fillStyle = shadeWarm("#5d4632", 1.05, warm);
          ctx.fillRect(qx - 4, c.y + 4, 8, 11);
          ctx.strokeStyle = shadeWarm("#d8c89c", 1.2, warm * 0.6);
          ctx.lineWidth = 1;
          for (let k = 0; k < 4; k++) {
            ctx.beginPath();
            ctx.moveTo(qx - 3 + k * 2, c.y + 4);
            ctx.lineTo(qx - 4 + k * 2.4, c.y - 6);
            ctx.stroke();
          }
        }
        drawPennant(c.x + 30, c.y + 10, 32, "#3f7a6a", warm, 0.9);
        break;
      }
      case "stable": {
        // 拴马桩 + 两匹马 + 草料与水槽
        const rx = c.x - 46;
        ctx.strokeStyle = shadeWarm("#5b4630", 1.1, warm);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rx, c.y + 14); ctx.lineTo(rx, c.y - 4);
        ctx.moveTo(rx + 58, c.y + 18); ctx.lineTo(rx + 58, c.y);
        ctx.moveTo(rx, c.y - 2); ctx.lineTo(rx + 58, c.y + 2);
        ctx.stroke();
        drawHorse(c.x - 26, c.y + 16, 1.05, "#6b4f36", warm, 0);
        if (lv >= 2) drawHorse(c.x + 16, c.y + 21, 0.92, "#3f3a38", warm, 2.4);
        // 草料
        ctx.fillStyle = shadeWarm("#a8904e", 1.12, warm);
        ctx.beginPath();
        ctx.ellipse(c.x + 44, c.y + 16, 11, 5.4, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = shadeWarm("#c8b070", 1.2, warm);
        ctx.lineWidth = 0.9;
        for (let i = 0; i < 6; i++) {
          const a = -2.6 + i * 0.42;
          ctx.beginPath();
          ctx.moveTo(c.x + 44, c.y + 14);
          ctx.lineTo(c.x + 44 + Math.cos(a) * 12, c.y + 14 + Math.sin(a) * 7);
          ctx.stroke();
        }
        // 水槽（结了层冰）
        ctx.fillStyle = shadeWarm("#5b4630", 1.0, warm);
        ctx.fillRect(c.x - 6, c.y + 24, 22, 6);
        ctx.fillStyle = "rgba(178,224,246,0.6)";
        ctx.fillRect(c.x - 5, c.y + 24.5, 20, 2.4);
        break;
      }
      case "cots": {
        // 担架 + 火盆 + 熬药的小陶罐
        for (let i = 0; i < 2; i++) {
          const bx = c.x - 34 + i * 30;
          const by = c.y + 15 + i * 5;
          ctx.fillStyle = shadeWarm("#5b4630", 1.05, warm);
          ctx.fillRect(bx - 12, by, 24, 2.6);
          ctx.fillRect(bx - 11, by + 2.6, 2, 4);
          ctx.fillRect(bx + 9, by + 2.6, 2, 4);
          ctx.fillStyle = shadeWarm("#c8d4cf", 1.1, warm * 0.5);
          ctx.beginPath();
          ctx.moveTo(bx - 11, by);
          ctx.quadraticCurveTo(bx, by - 6.4, bx + 11, by);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "rgba(70,90,96,0.4)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(bx - 4, by - 3.2);
          ctx.lineTo(bx - 4, by);
          ctx.stroke();
        }
        // 火盆
        const px = c.x + 26;
        const py = c.y + 12;
        ctx.fillStyle = shadeWarm("#3d4b55", 1.05, warm * 0.5);
        ctx.beginPath();
        ctx.moveTo(px - 8, py - 8);
        ctx.lineTo(px + 8, py - 8);
        ctx.lineTo(px + 5, py);
        ctx.lineTo(px - 5, py);
        ctx.closePath();
        ctx.fill();
        const f = 0.5 + 0.5 * Math.sin(time * 5.2);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.4 * f;
        ctx.drawImage(glowWarm, px - 20, py - 28, 40, 40);
        ctx.fillStyle = "#ffca6e";
        ctx.beginPath();
        ctx.ellipse(px, py - 10, 3.4, 4.4 * f, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
        // 药罐蒸汽
        if (Math.random() < 0.16) {
          embers.spawn("smoke", px, py - 16, { spread: 2, size: 2.6, vy: -16 });
        }
        break;
      }
      case "kitchen": {
        // 大灶与铁锅，锅口冒热气
        const bx = c.x - 26;
        const by = c.y + 16;
        ctx.fillStyle = shadeWarm("#4b4238", 1.0, warm * 0.6);
        ctx.beginPath();
        ctx.moveTo(bx - 13, by);
        ctx.lineTo(bx + 13, by);
        ctx.lineTo(bx + 10, by - 9);
        ctx.lineTo(bx - 10, by - 9);
        ctx.closePath();
        ctx.fill();
        const f = 0.5 + 0.5 * Math.sin(time * 4.4 + 0.8);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.34 * f;
        ctx.drawImage(glowWarm, bx - 18, by - 20, 36, 26);
        ctx.restore();
        ctx.fillStyle = shadeWarm("#2f3a42", 1.05, warm * 0.6);
        ctx.beginPath();
        ctx.ellipse(bx, by - 11, 12, 5.4, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = shadeWarm("#c07a3e", 1.35, Math.min(1, warm + 0.28));
        ctx.beginPath();
        ctx.ellipse(bx, by - 12.4, 9, 3.6, 0, 0, TAU);
        ctx.fill();
        if (Math.random() < 0.4) {
          embers.spawn("smoke", bx, by - 18, { spread: 4, size: 3.4, vy: -22 });
        }
        // 挂着的干货
        ctx.strokeStyle = shadeWarm("#6b5236", 1.1, warm);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(c.x + 8, c.y - 22);
        ctx.lineTo(c.x + 34, c.y - 18);
        ctx.stroke();
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = shadeWarm(i % 2 ? "#a8452f" : "#9a7a3c", 1.1, warm);
          ctx.fillRect(c.x + 11 + i * 6, c.y - 21 + i * 0.9, 3, 8);
        }
        break;
      }
      case "herbs": {
        // 白幡 + 晾药 + 石臼
        const bx = c.x + 22;
        ctx.strokeStyle = "#4a4034";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(bx, c.y + 8);
        ctx.lineTo(bx, c.y - 44);
        ctx.stroke();
        const wave = Math.sin(time * 1.9) * 2;
        ctx.fillStyle = shadeWarm("#d9e6ce", 1.15, warm * 0.5);
        ctx.beginPath();
        ctx.moveTo(bx, c.y - 44);
        ctx.lineTo(bx + 11 + wave, c.y - 41);
        ctx.lineTo(bx + 10, c.y - 20);
        ctx.lineTo(bx, c.y - 22);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = shadeWarm("#3f6b58", 1.1, warm * 0.4);
        ctx.fillRect(bx + 3, c.y - 38, 4, 12);
        // 晾药绳
        ctx.strokeStyle = shadeWarm("#6b5236", 1.05, warm);
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(c.x - 34, c.y - 20);
        ctx.lineTo(c.x + 2, c.y - 16);
        ctx.stroke();
        for (let i = 0; i < 4; i++) {
          const hx = c.x - 30 + i * 9;
          const hy = c.y - 19 + i * 1;
          ctx.fillStyle = shadeWarm("#527f5c", 1.15, warm * 0.5);
          ctx.beginPath();
          ctx.moveTo(hx, hy);
          ctx.lineTo(hx + 3.4, hy + 9);
          ctx.lineTo(hx - 3.4, hy + 9);
          ctx.closePath();
          ctx.fill();
        }
        // 石臼
        ctx.fillStyle = shadeWarm("#5f6a72", 1.05, warm * 0.4);
        ctx.beginPath();
        ctx.ellipse(c.x - 26, c.y + 14, 7, 4.4, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = shadeWarm("#8a959c", 1.15, warm * 0.4);
        ctx.beginPath();
        ctx.ellipse(c.x - 26, c.y + 11.6, 5, 2.8, 0, 0, TAU);
        ctx.fill();
        break;
      }
      case "lanterns": {
        for (let i = 0; i < 2; i++) {
          const lx = c.x - 24 + i * 48;
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
        // 酒坛
        for (let i = 0; i < 3; i++) {
          const jx = c.x - 34 + i * 13;
          const jy = c.y + 16 + (i % 2) * 4;
          ctx.fillStyle = shadeWarm("#4d4038", 1.05, warm);
          ctx.beginPath();
          ctx.ellipse(jx, jy - 5, 5, 6.2, 0, 0, TAU);
          ctx.fill();
          ctx.fillStyle = shadeWarm("#7a6a58", 1.2, warm);
          ctx.fillRect(jx - 2.2, jy - 12, 4.4, 3);
          ctx.fillStyle = shadeWarm("#c9b487", 1.15, warm);
          ctx.fillRect(jx - 3, jy - 13, 6, 1.6);
        }
        break;
      }
      case "scrolls": {
        for (let i = 0; i < 2; i++) {
          const bx = c.x - 28 + i * 56;
          ctx.fillStyle = shadeWarm("#c9b487", 1.0, warm * 0.6);
          ctx.fillRect(bx - 2, c.y - 30, 4, 22);
          ctx.fillStyle = "#2b4653";
          ctx.fillRect(bx - 3, c.y - 32, 6, 3);
        }
        // 石碑
        const sx = c.x - 6;
        const sy = c.y + 18;
        ctx.fillStyle = shadeWarm("#4e5c66", 1.0, warm * 0.4);
        ctx.fillRect(sx - 9, sy - 4, 18, 4);
        ctx.fillStyle = shadeWarm("#68767f", 1.12, warm * 0.4);
        ctx.beginPath();
        ctx.moveTo(sx - 6, sy - 4);
        ctx.lineTo(sx - 6, sy - 26);
        ctx.quadraticCurveTo(sx, sy - 31, sx + 6, sy - 26);
        ctx.lineTo(sx + 6, sy - 4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(226,244,252,0.35)";
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(sx - 3, sy - 22 + i * 5);
          ctx.lineTo(sx + 3, sy - 22 + i * 5);
          ctx.stroke();
        }
        break;
      }
      case "envoys": {
        // 三面来使的旗色 + 一辆篷车
        const cols = ["#3b6ea8", "#a8342c", "#2f7a5c"];
        for (let i = 0; i < 3; i++) {
          drawPennant(c.x - 46 + i * 17, c.y + 12 + (i % 2) * 3, 30 + i * 4, cols[i], warm, i * 1.9);
        }
        const wx = c.x + 26;
        const wy = c.y + 16;
        ctx.fillStyle = shadeWarm("#6b5236", 1.0, warm);
        ctx.fillRect(wx - 15, wy - 11, 30, 7);
        ctx.fillStyle = shadeWarm("#a8b0b8", 1.15, warm * 0.5);
        ctx.beginPath();
        ctx.moveTo(wx - 14, wy - 11);
        ctx.quadraticCurveTo(wx, wy - 27, wx + 14, wy - 11);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(60,72,80,0.4)";
        ctx.lineWidth = 0.9;
        for (let i = 1; i < 4; i++) {
          const t = i / 4;
          ctx.beginPath();
          ctx.moveTo(wx - 14 + t * 28, wy - 11);
          ctx.lineTo(wx - 9 + t * 18, wy - 22 + Math.abs(t - 0.5) * 12);
          ctx.stroke();
        }
        ctx.strokeStyle = shadeWarm("#3d3229", 1.1, warm * 0.4);
        ctx.lineWidth = 2;
        for (let i = 0; i < 2; i++) {
          ctx.beginPath();
          ctx.arc(wx - 8 + i * 16, wy - 2, 4.4, 0, TAU);
          ctx.stroke();
        }
        break;
      }
    }
    ctx.restore();
  }

  /** 屏幕空间的小方块体（矿炉之类的摆件用，省得再走网格投影）。 */
  function drawPrismScreen(x, y, w, h, sideHex, topHex) {
    ctx.fillStyle = sideHex;
    ctx.fillRect(x - w / 2, y - h, w, h);
    ctx.fillStyle = topHex;
    ctx.beginPath();
    ctx.ellipse(x, y - h, w / 2, w / 5, 0, 0, TAU);
    ctx.fill();
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
    const lv = Math.max(1, b.level || 1);
    const inten = fireOf(env);
    const h1 = 21 + lv * 1.2;
    const h2 = 50 + lv * 3.2;

    // 融雪环
    ctx.save();
    const meltR = 108 + lv * 5;
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

    const warmC = warmthAt(art.gx, art.gy, env);

    // 石台阶（全城占地最大的一座）
    drawPrism(rectGrid(art.gx, art.gy, 3.1, 3.1), 0, 6.5, "#43535e", env, { topHex: "#6d8390", topLight: 1.16 });
    const plinth = rectGrid(art.gx, art.gy, 2.45, 2.45);
    drawPrism(plinth, 6.5, h1, "#4d5f6b", env, { topHex: "#78909d", topLight: 1.2, stripe: true });

    // 台基正面开火门：拱洞里透出炭火，这是「这是座炉子」最直接的读法
    for (const [i, j] of FRONT_EDGES) {
      onFace(plinth[i], plinth[j], 6.5, (len, light) => {
        const hw = Math.min(22, len * 0.34);
        const hh = h1 * 0.72;
        ctx.beginPath();
        ctx.moveTo(-hw, 0);
        ctx.lineTo(-hw, -hh + hw * 0.8);
        ctx.quadraticCurveTo(0, -hh - hw * 0.5, hw, -hh + hw * 0.8);
        ctx.lineTo(hw, 0);
        ctx.closePath();
        ctx.fillStyle = shadeWarm("#180e10", light * 0.6, 0);
        ctx.fill();
        if (inten > 0.02) {
          ctx.save();
          ctx.clip();
          ctx.globalCompositeOperation = "lighter";
          // 炭堆：门口一层白热，往上迅速转暗
          ctx.globalAlpha = inten;
          const g = ctx.createLinearGradient(0, 2, 0, -hh);
          g.addColorStop(0, "rgba(255,232,176,1)");
          g.addColorStop(0.22, "rgba(255,158,58,0.8)");
          g.addColorStop(0.6, "rgba(196,72,24,0.3)");
          g.addColorStop(1, "rgba(150,40,14,0)");
          ctx.fillStyle = g;
          ctx.fillRect(-hw, -hh - hw, hw * 2, hh + hw);
          // 跳动的炭块
          for (let m = 0; m < 4; m++) {
            const t = time * 2.6 + m * 1.9;
            ctx.globalAlpha = (0.34 + 0.24 * Math.sin(t)) * inten;
            ctx.fillStyle = "#ffd18a";
            ctx.beginPath();
            ctx.ellipse((m - 1.5) * hw * 0.42, -2 - Math.abs(Math.sin(t * 0.7)) * 3,
              hw * 0.2, 2.6, 0, 0, TAU);
            ctx.fill();
          }
          ctx.restore();
        }
        // 门楣与门槛石
        ctx.fillStyle = shadeWarm("#3a4a55", light * 1.15, warmC * 0.5);
        ctx.fillRect(-hw - 5, -hh - hw * 0.5 - 3.6, (hw + 5) * 2, 3.6);
        ctx.fillStyle = shadeWarm("#5a6d79", light * 1.2, warmC * 0.5);
        ctx.fillRect(-hw - 5, -2.2, (hw + 5) * 2, 3.2);
      });
    }

    // 炉身（收分）
    const shaft = rectGrid(art.gx, art.gy, 1.72, 1.72);
    drawPrism(shaft, 6.5 + h1, h2, "#55697a", env, { topHex: "#8aa4b2", topLight: 1.24 });

    // 铁箍与通风口：给光溜溜的塔身加水平分节，也让高度读得出来
    for (const [i, j] of FRONT_EDGES) {
      onFace(shaft[i], shaft[j], 6.5 + h1, (len, light) => {
        for (let k = 0; k < 3; k++) {
          const y = -h2 * (0.2 + k * 0.27);
          ctx.fillStyle = shadeWarm("#2c3a45", light * 1.05, warmC * 0.45);
          ctx.fillRect(-len, y, len * 2, 3.2);
          ctx.fillStyle = "rgba(226,246,255,.16)";
          ctx.fillRect(-len, y, len * 2, 1);
          // 箍上的铆钉
          ctx.fillStyle = shadeWarm("#8fa6b4", light * 1.1, warmC * 0.5);
          for (let m = -1; m <= 1; m++) ctx.fillRect(m * len * 0.5 - 1, y + 0.8, 2, 1.8);
        }
        // 风口：越靠近炉膛越亮
        for (let k = 0; k < 2; k++) {
          const y = -h2 * (0.62 + k * 0.16);
          ctx.fillStyle = shadeWarm("#141c22", light * 0.8, 0);
          ctx.fillRect(-len * 0.34, y, len * 0.68, 4);
          if (inten > 0.02) {
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = (0.42 - k * 0.12) * inten;
            ctx.fillStyle = "#ff9c3c";
            ctx.fillRect(-len * 0.34, y + 0.8, len * 0.68, 2.6);
            ctx.restore();
          }
        }
      });
    }

    // 炉口
    const rimY = c.y - 6.5 - h1 - h2;
    drawPrism(rectGrid(art.gx, art.gy, 2.1, 2.1), 6.5 + h1 + h2, 7.5, "#3f5260", env, { topHex: "#2a3740", topLight: 0.9 });

    // 炉膛与火焰
    const fireY = rimY - 5.5;
    if (inten > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      // 炉膛底光
      ctx.globalAlpha = 0.85 * inten;
      ctx.drawImage(glowWarm, c.x - 48, fireY - 32, 96, 64);

      if (inten > FLAME_MIN) {
        // 火舌条数：火小了自然少几条，掉帧时也跟着抽稀
        const flames = Math.max(3, Math.round(7 * Math.min(1, 0.45 + inten) * renderQuality()));
        for (let i = 0; i < flames; i++) {
          const t = time * 3.1 + i * 1.37;
          const sway = Math.sin(t) * 4.6 + Math.sin(t * 1.9 + i) * 2.8;
          const hgt = (44 + lv * 2.0) * inten * (0.62 + 0.38 * (0.5 + 0.5 * Math.sin(t * 1.6 + i))) - i * 2.6;
          const wid = 16 - i * 1.4;
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
        ctx.ellipse(c.x, fireY - 2, 7.6, 5, 0, 0, TAU);
        ctx.fill();
      } else {
        // 熄火：不留火舌，炉口只剩一小片暗红余烬。
        // 这里的透明度不跟着 inten 一路掉到 0——真按 0.05 画出来就是纯黑，
        // 炉子看着像被搬空了，而不是刚灭。
        ctx.globalAlpha = 0.16 + inten;
        ctx.fillStyle = "#8e2c0e";
        ctx.beginPath();
        ctx.ellipse(c.x, fireY + 1, 9.5, 3.6, 0, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 0.1 + inten * 0.8;
        ctx.fillStyle = "#c2521c";
        ctx.beginPath();
        ctx.ellipse(c.x + Math.sin(time * 0.9) * 1.6, fireY, 4.6, 1.9, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();

      // 火星只有旺火才溅得出来；熄了火还在喷火星，看着就不像灭了
      const spark = Math.max(0, (inten - 0.18) / 0.82);
      if (Math.random() < 0.7 * spark) {
        embers.spawn("ember", c.x, fireY - 6, { spread: 9, vy: -46 - Math.random() * 40 });
      }
      // 反过来，余烬会闷出更多白烟，所以这里给一个不随火势归零的底
      if (Math.random() < 0.06 + 0.16 * inten) {
        embers.spawn("smoke", c.x, fireY - 18, { spread: 8, size: 6 });
      }
    }

    return { top: fireY - 30 };
  }

  /** 火炉地面光池（在建筑之前绘制） */
  function drawHearthPool(env) {
    const c = isoPt(CX, CY);
    const inten = fireOf(env);
    if (inten <= 0.02) return;
    // 火弱下去时光池同时收窄，不然地上会剩一圈没来由的暖斑
    const R = (272 + env.furnaceLevel * 12) * (0.42 + 0.58 * inten);
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
    const inten = fireOf(env);
    if (inten <= 0.02) return;
    const R = (200 + env.furnaceLevel * 8) * (0.5 + 0.5 * inten);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.26 * inten;
    ctx.drawImage(glowWarm, c.x - R, c.y - 104 - R, R * 2, R * 2);
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
      const y = 470 + i * 82;
      ctx.globalAlpha = 0.05 + 0.03 * Math.sin(time * 0.4 + i);
      ctx.fillRect(-700, y - 9, 1400, 18);
    }
    ctx.globalAlpha = 1;
    // 火炉在冰面上的倒影
    const inten = fireOf(env);
    if (inten > 0.02) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.18 * inten;
      ctx.drawImage(glowWarm, -150, 440, 300, 300);
      ctx.globalAlpha = 0.1 * inten;
      ctx.drawImage(glowWarm, -70, 470, 140, 460);
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
    ctx.translate(0, BANK_DROP);
    ctx.fill();
    ctx.restore();
    ctx.restore();

    // 台面
    ctx.beginPath();
    ctx.moveTo(w[0].x, w[0].y);
    for (const p of w) ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.fillStyle = worldGradient("snowField", () => {
      const cg = ctx.createRadialGradient(0, 184, 40, 0, 184, 640);
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
      const r = hash1(i * 8.3) * 8.2;
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
    for (let i = -6; i <= 14; i++) {
      const a = isoPt(i, -6), b2 = isoPt(i, 14);
      ctx.moveTo(a.x, a.y); ctx.lineTo(b2.x, b2.y);
      const c1 = isoPt(-6, i), d1 = isoPt(14, i);
      ctx.moveTo(c1.x, c1.y); ctx.lineTo(d1.x, d1.y);
    }
    ctx.stroke();

    // 踏出的雪路：已建成的地块 → 火炉；工地不通路
    ctx.strokeStyle = "rgba(96,132,156,0.34)";
    ctx.lineCap = "round";
    const hc = isoPt(CX, CY);
    for (const art of builtTiles()) {
      const p = isoPt(art.gx, art.gy);
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(hc.x, hc.y);
      ctx.quadraticCurveTo((hc.x + p.x) / 2 + (p.y - hc.y) * 0.08, (hc.y + p.y) / 2, p.x, p.y);
      ctx.stroke();
    }
    // 城门到火炉的主道更宽
    const gp = isoPt(GATE.gx, GATE.gy);
    ctx.lineWidth = 15;
    ctx.strokeStyle = "rgba(96,132,156,0.4)";
    ctx.beginPath();
    ctx.moveTo(hc.x, hc.y);
    ctx.lineTo(gp.x, gp.y);
    ctx.stroke();

    // 冷色边缘渐暗
    ctx.fillStyle = worldGradient("plateauVignette", () => {
      const vg = ctx.createRadialGradient(0, 184, 220, 0, 184, 700);
      vg.addColorStop(0, "rgba(6,26,38,0)");
      vg.addColorStop(1, "rgba(6,26,38,0.6)");
      return vg;
    });
    ctx.fillRect(-900, -400, 1800, 1400);

    ctx.restore();
  }

  /* ── 城墙 ───────────────────────────────────────────────── */
  function wallRuns(level) {
    const built = level > 0;
    const h = built ? 15 + level * 2.2 : 4.2;
    const t = built ? 0.36 : 0.5;
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
      runs.push({ quad, depth: (a.gx + a.gy + b.gx + b.gy) / 2, h, a, b, i, built });
    }
    return runs;
  }

  function drawWallRun(run, env) {
    if (!run.built) {
      // 未营建：只有一道积雪的夯土矮垄和几根残木桩
      drawPrism(run.quad, 0, run.h, "#40525c", env, { topHex: "#9db4c0", topLight: 1.14, warmMul: 0.4 });
      for (let s = 0; s < 4; s++) {
        const t = (s + 0.5) / 4;
        const gx = run.a.gx + (run.b.gx - run.a.gx) * t;
        const gy = run.a.gy + (run.b.gy - run.a.gy) * t;
        const p = isoPt(gx, gy);
        const hh = 5 + ((s * 7) % 5);
        ctx.fillStyle = shadeWarm("#3a3026", 1.05, 0);
        ctx.fillRect(p.x - 1.4, p.y - run.h - hh, 2.8, hh);
        ctx.fillStyle = "rgba(232,248,255,0.5)";
        ctx.fillRect(p.x - 1.8, p.y - run.h - hh - 1.4, 3.6, 1.6);
      }
      return;
    }
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
    if (level <= 0) return;
    const h = 15 + level * 2.2;
    for (let i = 0; i < WALL_SIDES; i++) {
      const p = WALL_PTS[i];
      drawPrism(rectGrid(p.gx, p.gy, 0.62, 0.62), 0, h + 8, "#546471", env, { topHex: "#9db6c3", topLight: 1.22, warmMul: 0.5 });
    }
  }

  function drawGate(b, art, env) {
    const lv = Math.max(0, b.level || 0);
    const c = isoPt(art.gx, art.gy);
    if (lv <= 0) {
      // 未营建：两座石墩夹着一道踩实的雪路口
      for (let i = 0; i < 2; i++) {
        const gx = art.gx + (i ? 0.62 : -0.62);
        const gy = art.gy + (i ? -0.62 : 0.62);
        drawPrism(rectGrid(gx, gy, 0.56, 0.56), 0, 8, "#42525c", env, { topHex: "#8ea6b2", topLight: 1.12, warmMul: 0.3 });
      }
      ctx.fillStyle = "rgba(226,246,255,0.28)";
      ctx.beginPath();
      ctx.ellipse(c.x, c.y + 2, 22, 8, 0, 0, TAU);
      ctx.fill();
      return;
    }
    const h = 22 + lv * 2.2;
    drawPrism(rectGrid(art.gx, art.gy, 1.5, 1.5), 0, h, "#56666f", env, { topHex: "#93aebc", topLight: 1.18, stripe: true });
    drawPagodaRoof(rectGrid(art.gx, art.gy, 1.5, 1.5), art.gx, art.gy, h, 16, env, "#33505f");
    // 门洞
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
  /** 屋顶举高：斜视下坡面越平越像一张贴片，所以各式屋顶都给足高度。 */
  function roofRise(art, level) {
    const lv = Math.max(1, level || 1);
    switch (art.roof) {
      case "gable": return 15 + lv * 0.8;
      case "hip": return 21 + lv * 0.8;
      case "pagoda": return 32 + lv * 1.1;
      case "shed": return 17 + lv * 0.6;
      case "tent": return 17 + lv * 0.5;
      case "flat": return 1.5;
      default: return 0;
    }
  }

  /**
   * 未营建的地块：一圈齐膝的断墙围着夯土地基，盖着雪，旁边堆点石料木料。
   * 刻意不点窗火、不打光晕——远看就知道「这里还是空地」。
   */
  function drawSite(b, art, env) {
    const fp = rectGrid(art.gx, art.gy, art.w, art.d);
    const c = isoPt(art.gx, art.gy);
    const constructing = b.constructing === true;
    const prog = Math.max(0, Math.min(1, Number.isFinite(b.progress) ? b.progress : 0.45));
    const seed = art.gx * 3.7 + art.gy * 1.9;

    // 浅浅一层地面阴影
    ctx.save();
    ctx.globalAlpha = 0.22;
    fillPoly(gridPolyToWorld(scaleGrid(fp, art.gx, art.gy, 1.22)), "#062029", 4);
    ctx.restore();

    // 夯土地基
    const base = scaleGrid(fp, art.gx, art.gy, 1.08);
    drawPrism(base, 0, 2.6, "#2f414b", env, { topHex: "#526b78", topLight: 1.0, warmMul: 0.25 });
    const top = gridPolyToWorld(base).map((p) => ({ x: p.x, y: p.y - 2.6 }));
    ctx.save();
    ctx.globalAlpha = 0.4;
    fillPoly(top, "rgba(206,232,246,0.7)");
    ctx.restore();

    // 断墙：沿四边分段砌，随机缺口，段顶戴雪
    const gp = base;
    for (let e = 0; e < 4; e++) {
      const a = gp[e];
      const b2 = gp[(e + 1) % 4];
      const segs = 4;
      for (let s = 0; s < segs; s++) {
        if (hash1(seed + e * 13 + s * 5.1) < 0.28) continue;   // 缺口
        const t0 = s / segs + 0.04;
        const t1 = (s + 1) / segs - 0.04;
        const q = [
          { gx: a.gx + (b2.gx - a.gx) * t0, gy: a.gy + (b2.gy - a.gy) * t0 },
          { gx: a.gx + (b2.gx - a.gx) * t1, gy: a.gy + (b2.gy - a.gy) * t1 },
        ];
        const nx = (q[1].gy - q[0].gy) * 0.16;
        const ny = -(q[1].gx - q[0].gx) * 0.16;
        const quad = [
          { gx: q[0].gx + nx, gy: q[0].gy + ny },
          { gx: q[1].gx + nx, gy: q[1].gy + ny },
          { gx: q[1].gx - nx, gy: q[1].gy - ny },
          { gx: q[0].gx - nx, gy: q[0].gy - ny },
        ];
        const hh = 4 + hash1(seed + e * 7 + s * 2.3) * 5;
        drawPrism(quad, 2.6, hh, "#3d4d57", env, { topHex: "#c4dcea", topLight: 1.12, warmMul: 0.25 });
      }
    }

    // 散落的石料与半埋的木料
    for (let i = 0; i < 3; i++) {
      const sx = c.x - 26 + i * 19;
      const sy = c.y + 13 + (i % 2) * 5;
      ctx.fillStyle = shadeWarm("#485660", 1.0, 0);
      ctx.beginPath();
      ctx.ellipse(sx, sy, 7, 3.2, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(224,244,254,0.5)";
      ctx.beginPath();
      ctx.ellipse(sx - 1, sy - 1.8, 4.4, 1.8, 0, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = shadeWarm("#5e4a33", 1.0, 0);
    ctx.fillRect(c.x + 14, c.y + 13, 18, 3.2);
    ctx.fillRect(c.x + 17, c.y + 9.8, 18, 3.2);
    ctx.fillStyle = "rgba(224,244,254,0.42)";
    ctx.fillRect(c.x + 17, c.y + 9.2, 18, 1.4);

    if (constructing) {
      // 半截夯墙：顶面压暗并留一道夯层线，免得那块斜面被读成屋顶
      const wallH = 3 + art.h * 0.55 * prog;
      drawPrism(fp, 2.6, wallH, "#544a3e", env, { topHex: "#4a4034", topLight: 1.0, warmMul: 0.3 });
      for (const [i, j] of FRONT_EDGES) {
        onFace(fp[i], fp[j], 2.6, (len, light) => {
          ctx.fillStyle = shadeWarm("#3d352b", light, 0);
          for (let k = 1; k * 5 < wallH; k++) ctx.fillRect(-len, -k * 5, len * 2, 1.1);
        });
      }

      // 脚手架：四角立杆 + 两道围拦 + 前檐一层跳板与斜撑
      const g = scaleGrid(fp, art.gx, art.gy, 1.26);
      const w = gridPolyToWorld(g);
      const sh = art.h * 0.62 + 8;
      const deck = -2.6 - sh * 0.58;
      ctx.strokeStyle = "rgba(164,138,94,0.9)";
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      for (const p of w) {
        ctx.moveTo(p.x, p.y - 2.6);
        ctx.lineTo(p.x, p.y - 2.6 - sh);
      }
      for (let k = 1; k <= 2; k++) {
        const yy = -2.6 - (sh * k) / 3;
        ctx.moveTo(w[0].x, w[0].y + yy);
        for (let m = 1; m < 4; m++) ctx.lineTo(w[m].x, w[m].y + yy);
        ctx.lineTo(w[0].x, w[0].y + yy);
      }
      // 斜撑
      ctx.moveTo(w[1].x, w[1].y - 2.6);
      ctx.lineTo(w[2].x, w[2].y + deck);
      ctx.moveTo(w[3].x, w[3].y - 2.6);
      ctx.lineTo(w[2].x, w[2].y + deck);
      ctx.stroke();

      // 跳板：铺在前两条边上，比杆子亮一档
      ctx.fillStyle = "rgba(186,156,106,0.92)";
      for (const [i, j] of FRONT_EDGES) {
        const a = w[i], b3 = w[j];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y + deck);
        ctx.lineTo(b3.x, b3.y + deck);
        ctx.lineTo(b3.x, b3.y + deck + 2.6);
        ctx.lineTo(a.x, a.y + deck + 2.6);
        ctx.closePath();
        ctx.fill();
      }
      // 靠在跳板上的梯子
      const lad = w[2];
      ctx.strokeStyle = "rgba(150,124,84,0.95)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(lad.x - 4, lad.y + 4);
      ctx.lineTo(lad.x - 1, lad.y + deck);
      ctx.moveTo(lad.x + 4, lad.y + 4);
      ctx.lineTo(lad.x + 7, lad.y + deck);
      for (let k = 1; k <= 4; k++) {
        const t = k / 5;
        const y0 = 4 + (deck - 4) * t;
        ctx.moveTo(lad.x - 4 + 3 * t, lad.y + y0);
        ctx.lineTo(lad.x + 4 + 3 * t, lad.y + y0);
      }
      ctx.stroke();
    }
    return null;
  }

  function drawBuilding(b, env) {
    const art = CITY_LAYOUT[b.key];
    if (!art || art.special) return null;
    const lv = Math.max(0, Math.floor(b.level || 0));
    if (lv <= 0) return drawSite(b, art, env);

    const grow = 1 + Math.min(0.34, (lv - 1) * 0.035);
    const w = art.w * (1 + Math.min(0.18, (lv - 1) * 0.02));
    const d = art.d * (1 + Math.min(0.18, (lv - 1) * 0.02));
    const h = art.h * grow;
    const fp = rectGrid(art.gx, art.gy, w, d);
    const seed = art.id.length + art.gx;
    const c = isoPt(art.gx, art.gy);
    const warm = warmthAt(art.gx, art.gy, env);

    // 地面阴影
    const wpts = gridPolyToWorld(scaleGrid(fp, art.gx, art.gy, 1.22));
    ctx.save();
    ctx.globalAlpha = 0.34;
    fillPoly(wpts, "#062029", 5);
    ctx.restore();

    // 地基
    drawPrism(scaleGrid(fp, art.gx, art.gy, 1.1), 0, 3.4, "#3b5462", env, { topHex: "#7f9fb0", topLight: 1.12 });

    // 墙体
    drawPrism(fp, 3.4, h, art.base, env, { topHex: art.base, topLight: 1.05, stripe: art.stripe === true });

    // 屋顶
    const tone = art.roofTone || "#2f4b59";
    const rh = roofRise(art, lv);
    if (art.roof === "gable") drawGableRoof(fp, art.gx, art.gy, 3.4 + h, rh, env, tone);
    else if (art.roof === "hip") drawHipRoof(fp, art.gx, art.gy, 3.4 + h, rh, env, tone);
    else if (art.roof === "pagoda") drawPagodaRoof(fp, art.gx, art.gy, 3.4 + h, rh / 1.12, env, tone);
    else if (art.roof === "shed") drawShedRoof(fp, art.gx, art.gy, 3.4 + h, rh, env, tone);
    else if (art.roof === "tent") drawTentRoof(fp, art.gx, art.gy, 3.4 + h, rh, env, tone);
    else if (art.roof === "flat") {
      const top = gridPolyToWorld(scaleGrid(fp, art.gx, art.gy, 1.06)).map((p) => ({ x: p.x, y: p.y - 3.4 - h }));
      fillPoly(top, shadeWarm("#39505d", 1.1, warm * 0.4));
      ctx.save();
      ctx.globalAlpha = 0.42;
      fillPoly(top, "rgba(226,246,255,0.6)");
      ctx.restore();
      // 女儿墙，免得平顶看起来像一块贴纸
      ctx.strokeStyle = shadeWarm("#2c3c46", 1.15, 0);
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(top[3].x, top[3].y);
      ctx.lineTo(top[2].x, top[2].y);
      ctx.lineTo(top[1].x, top[1].y);
      ctx.stroke();
    }
    const apexY = c.y - 3.4 - h - rh;

    // 窗火：炉子灭了，各家的灯也跟着暗一半
    const workers = b.workers ?? 0;
    const cityGlow = 0.5 + 0.5 * (Number.isFinite(env.lit) ? env.lit : 1);
    const litK =
      Math.max(0.14, Math.min(1, 0.3 + workers * 0.22 + lv * 0.05)) *
      (0.55 + 0.45 * env.flicker) *
      cityGlow;
    drawWindows(fp, 3.4, h, env, seed, art.w > 1.6 ? 3 : 2, litK);

    // 烟囱与炊烟
    if (art.roof === "gable" || art.roof === "hip") {
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
    if (art.flag) drawFlag(c, art.flag, warm);

    // 升级中：外围搭一圈脚手架
    if (b.constructing === true) {
      const sc = gridPolyToWorld(scaleGrid(fp, art.gx, art.gy, 1.3));
      ctx.strokeStyle = "rgba(150,124,84,0.8)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (const p of sc) {
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y - h - 10);
      }
      for (let k = 1; k <= 2; k++) {
        const yy = -((h + 10) * k) / 3;
        ctx.moveTo(sc[3].x, sc[3].y + yy);
        ctx.lineTo(sc[2].x, sc[2].y + yy);
        ctx.lineTo(sc[1].x, sc[1].y + yy);
      }
      ctx.stroke();
    }

    return apexY;
  }

  /** 悬停虚线框与升级脉冲，工地与已建成一视同仁。 */
  function drawMarkers(b) {
    const art = CITY_LAYOUT[b.key];
    if (!art) return;
    const hot = hoverKey === art.id;
    const pulse = pulses.get(art.id);
    if (!hot && pulse === undefined) return;
    const lv = Math.max(1, b.level || 1);
    const grow = 1 + Math.min(0.18, (lv - 1) * 0.02);
    const fp = rectGrid(art.gx, art.gy, art.w * grow, art.d * grow);
    if (hot) {
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
    if (pulse !== undefined) {
      const ring = gridPolyToWorld(scaleGrid(fp, art.gx, art.gy, 1.2 + pulse * 1.5));
      ctx.save();
      ctx.globalAlpha = 1 - pulse;
      ctx.strokeStyle = "#ffd68f";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ring[0].x, ring[0].y);
      for (const p of ring) ctx.lineTo(p.x, p.y);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  }

  /* ── 城民节点 ───────────────────────────────────────────── */
  /** 已建成（level > 0）的地块，别名去重。 */
  function builtTiles() {
    const out = [];
    const seen = new Set();
    for (const b of lastBuildings) {
      const art = CITY_LAYOUT[b.key];
      if (!art || art.special || (b.level || 0) <= 0 || seen.has(art.id)) continue;
      seen.add(art.id);
      out.push(art);
    }
    return out;
  }

  /**
   * 城民的通勤节点：每个已建成的地块出一个「檐前空地」节点，
   * 民居随等级长出的附屋也各算一处住所，避免全城挤一间房。
   */
  function crowdNodes() {
    const list = [];
    const seen = new Set();
    for (const b of lastBuildings) {
      const art = CITY_LAYOUT[b.key];
      if (!art || art.special || !art.role || seen.has(art.id)) continue;
      const lv = Math.floor(b.level || 0);
      if (lv <= 0) continue;
      seen.add(art.id);
      const apron = apronOf(art);
      list.push({ key: art.id, gx: art.gx, gy: art.gy, role: art.role, yield: art.yield, apron });
      if (art.props === "huts") {
        hutSpots(art, lv).forEach((s, i) => {
          list.push({ key: `${art.id}#${i}`, gx: s.gx, gy: s.gy, role: "home", apron: 0.8 });
        });
      }
    }
    return list;
  }

  /* ── 命中测试 ───────────────────────────────────────────── */
  /** 该地块画出来有多高（世界单位，自地面算起）。 */
  function tileTop(art, level) {
    if (level <= 0) return 16;
    if (art.special === "furnace") return 6.5 + (21 + level * 1.2) + (50 + level * 3.2) + 12;
    if (art.special === "wall") return 24 + level * 2.2 + 18;
    const grow = 1 + Math.min(0.34, (level - 1) * 0.035);
    return 3.4 + art.h * grow + roofRise(art, level) + 4;
  }

  function hexHull(w, top) {
    // A' B' B C D D'
    return [
      { x: w[0].x, y: w[0].y - top },
      { x: w[1].x, y: w[1].y - top },
      { x: w[1].x, y: w[1].y },
      { x: w[2].x, y: w[2].y },
      { x: w[3].x, y: w[3].y },
      { x: w[3].x, y: w[3].y - top },
    ];
  }

  /** 屋顶外挑倍率，与各 drawXxxRoof 里的 scaleGrid 保持一致。 */
  const ROOF_OVERHANG = { gable: 1.1, hip: 1.08, pagoda: 1.18, shed: 1.1, tent: 1.14, flat: 1.06 };

  function convexHull(pts) {
    const p = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lower = [];
    for (const q of p) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
      lower.push(q);
    }
    const upper = [];
    for (let i = p.length - 1; i >= 0; i--) {
      const q = p[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
      upper.push(q);
    }
    lower.pop();
    upper.pop();
    return lower.concat(upper);
  }

  function silhouette(key, lv) {
    const art = CITY_LAYOUT[key];
    if (!art) return null;
    const level = Math.max(0, Math.floor(lv || 0));
    const top = tileTop(art, level);
    if (art.special === "furnace" && level > 0) {
      // 火炉是收分的塔：宽台基 + 窄炉身。用矩形包住会把身后一整排建筑都吃掉，
      // 所以命中框也照着收分做，肩膀两侧的点要能落到后排去。
      const platH = 6.5 + (21 + level * 1.2);
      const wide = gridPolyToWorld(rectGrid(art.gx, art.gy, 3.2, 3.2));
      const narrow = gridPolyToWorld(rectGrid(art.gx, art.gy, 2.2, 2.2));
      return [
        { x: narrow[3].x, y: narrow[3].y - top },
        { x: narrow[0].x, y: narrow[0].y - top },
        { x: narrow[1].x, y: narrow[1].y - top },
        { x: narrow[1].x, y: narrow[1].y - platH },
        { x: wide[1].x, y: wide[1].y - platH },
        { x: wide[1].x, y: wide[1].y },
        { x: wide[2].x, y: wide[2].y },
        { x: wide[3].x, y: wide[3].y },
        { x: wide[3].x, y: wide[3].y - platH },
        { x: narrow[3].x, y: narrow[3].y - platH },
      ];
    }
    if (art.special || level <= 0) {
      return hexHull(gridPolyToWorld(rectGrid(art.gx, art.gy, art.w * 1.16, art.d * 1.16)), top);
    }
    // 墙体盒 + 出檐屋顶 + 屋脊，取凸包。
    // 用「底面四角整体抬到屋顶高」的粗盒子会把身后一整排都圈进来，密排 17 格时必然误选。
    const grow = 1 + Math.min(0.34, (level - 1) * 0.035);
    const sw = art.w * (1 + Math.min(0.18, (level - 1) * 0.02));
    const sd = art.d * (1 + Math.min(0.18, (level - 1) * 0.02));
    const wallTop = 3.4 + art.h * grow;
    const oh = ROOF_OVERHANG[art.roof] ?? 1.1;
    const c = isoPt(art.gx, art.gy);
    const pts = [
      ...gridPolyToWorld(rectGrid(art.gx, art.gy, sw * 1.1, sd * 1.1)),
      ...gridPolyToWorld(rectGrid(art.gx, art.gy, sw * oh, sd * oh)).map((p) => ({ x: p.x, y: p.y - wallTop })),
      { x: c.x, y: c.y - wallTop - roofRise(art, level) },
    ];
    return convexHull(pts);
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
      if (poly && pointInPoly(poly, wp.x, wp.y)) return tileIdOf(b.key);
    }
    return null;
  }

  function depthOf(b) {
    const a = CITY_LAYOUT[b.key];
    return a ? a.gx + a.gy : 0;
  }

  /** 按任意写法的 key 找回投影里的那一行。 */
  function entryOf(key) {
    const id = tileIdOf(key);
    return lastBuildings.find((x) => tileIdOf(x.key) === id) || null;
  }

  /** 建筑在画布内的屏幕包围盒（供新手引导聚光） */
  function rectOf(key) {
    const b = entryOf(key);
    const poly = silhouette(key, b?.level ?? 1);
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
    const lv = Math.max(0, entryOf(key)?.level ?? 1);
    const p = isoPt(art.gx, art.gy);
    return toScreen(p.x, p.y - tileTop(art, lv) - (lv <= 0 ? 14 : 18));
  }

  function pulse(key) {
    pulses.set(tileIdOf(key), 0);
  }

  /* ── 主循环 ─────────────────────────────────────────────── */
  function render(dt, state) {
    if (!glowWarm) resize();
    time += dt;

    const st = state || {};
    const blizzard = Math.max(0, Math.min(1, st.blizzard ?? 0));
    lastBuildings = st.buildings || [];

    const furnaceB = entryOf("furnace");
    const furnaceLevel = Math.max(1, furnaceB?.level ?? 1);
    const furnaceLit = readFurnaceLit(st, furnaceB);

    // 火光闪烁
    const target =
      0.82 +
      0.18 * Math.sin(time * 7.3) * 0.5 +
      0.12 * Math.sin(time * 2.1) +
      0.06 * Math.sin(time * 17.7);
    flicker += (target - flicker) * Math.min(1, dt * 9);
    // 熄火/复燃都走一段过渡：火焰、光池、暖色调一起收，避免整城颜色突跳
    litMix += ((furnaceLit ? 1 : 0) - litMix) * Math.min(1, dt * 2.4);
    const fire = (EMBER_FLOOR + (1 - EMBER_FLOOR) * litMix) * flicker;
    const env = {
      furnaceLevel,
      furnaceLit,
      lit: litMix,
      fire,
      flicker,
      blizzard,
      temp: st.temp ?? 0,
    };

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

    // 城民同步（节点集只随「已建成的地块」变化，setNodes 内部按签名跳过重复计算）
    crowd.setNodes(crowdNodes(), HEARTH_NODE);
    crowd.setCount(st.villagerCount ?? 10);
    crowd.update(dt, { blizzard });

    const project = (gx, gy) => isoPt(gx, gy);
    const crowdEnv = { warmthAt: (gx, gy) => warmthAt(gx, gy, env) };

    // 城墙（后半）
    const wallB = entryOf("wall");
    const wallLv = Math.max(0, wallB?.level ?? 0);
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
      crowd.draw(ctx, project, crowdEnv, cursor, it.depth);
      cursor = it.depth;
      drawBuilding(it.b, env);
      drawMarkers(it.b);
    }
    // 火炉（中心深度）
    const fB = furnaceB || { key: "furnace", level: 1 };
    crowd.draw(ctx, project, crowdEnv, cursor, CX + CY);
    drawFurnace(fB, TILES.furnace, env);
    drawMarkers(fB);
    crowd.draw(ctx, project, crowdEnv, CX + CY, Infinity);
    crowd.drawPuffs(ctx, project);

    drawHearthHalo(env);

    // 城墙（前半）+ 城门
    for (const r of runs) if (r.depth >= CX + CY) drawWallRun(r, env);
    drawGate(wallB || { key: "wall", level: 0 }, TILES.wall, env);
    drawMarkers(wallB || { key: "wall", level: wallLv });

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
