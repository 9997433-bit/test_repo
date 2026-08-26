import { pathPoints, pointAt } from "../combat/path.js";
import { fxProgress, noteEnemies, takeLaneEffects } from "./juice.js";

const INK = "rgba(28,22,16,";
const CINNABAR = "#b23a2f";
const GOLD = "#c9a24a";

function resize(canvas) {
  const dpr = Math.min(2, (typeof window !== "undefined" && window.devicePixelRatio) || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return null;
  const pw = Math.floor(w * dpr);
  const ph = Math.floor(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  return { w, h, dpr };
}

function strokePath(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
}

/** 起点写「营」、终点写「斗」，一眼看懂敌军往哪走。 */
function drawMarkers(ctx, pts) {
  const from = pts[0];
  const to = pts[pts.length - 1];
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '11px "Noto Serif SC", serif';
  ctx.fillStyle = `${INK}0.35)`;
  ctx.fillText("营", from.x, from.y - 10);
  ctx.font = '15px "Ma Shan Zheng", serif';
  ctx.fillStyle = "rgba(178,58,47,0.45)";
  ctx.fillText("斗", to.x, to.y + 12);
}

function drawEnemy(ctx, e, p) {
  ctx.save();
  ctx.translate(p.x, p.y);

  if (e.boss) {
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(201,162,74,0.18)";
    ctx.fill();
  }
  if (e.shield > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(58,95,138,0.55)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.fillStyle = e.boss ? CINNABAR : `${INK}1)`;
  ctx.font = `${e.boss ? 22 : 16}px "Ma Shan Zheng", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(e.glyph, 0, 0);

  if (e.stun > 0) {
    ctx.font = '9px "Noto Serif SC", serif';
    ctx.fillStyle = GOLD;
    ctx.fillText("眩", 0, -14);
  }

  const ratio = Math.max(0, Math.min(1, e.maxHp ? e.hp / e.maxHp : 0));
  const half = e.boss ? 16 : 12;
  ctx.fillStyle = `${INK}0.2)`;
  ctx.fillRect(-half, 12, half * 2, 3);
  ctx.fillStyle = e.boss ? GOLD : CINNABAR;
  ctx.fillRect(-half, 12, half * 2 * ratio, 3);
  if (e.shield > 0 && e.maxHp) {
    const shieldRatio = Math.max(0, Math.min(1, e.shield / e.maxHp));
    ctx.fillStyle = "rgba(58,95,138,0.7)";
    ctx.fillRect(-half, 9, half * 2 * shieldRatio, 2);
  }
  ctx.restore();
}

/* ------------------------------------------------------------ juice 绘制 */

/**
 * 特效用的定数抖动：同一发特效每帧必须溅在同一处，
 * 所以不能用 Math.random，改用 (id, i) 的散列。
 */
function hash01(a, b) {
  let x = Math.imul((a | 0) ^ Math.imul(b | 0, 0x9e3779b1), 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

/** 沿路线取一段折线上的采样点，用于扫击 / 冲锋的拖影。 */
function sampleRange(pts, from, to, steps = 10) {
  const a = Math.max(0, Math.min(1, from));
  const b = Math.max(0, Math.min(1, to));
  const out = [];
  for (let i = 0; i <= steps; i++) out.push(pointAt(pts, a + ((b - a) * i) / steps));
  return out;
}

function riseText(ctx, text, x, y, k, color, size, weight = 400) {
  if (!text) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, 2.4 - 2.4 * k));
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Ma Shan Zheng", "Noto Serif SC", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(251,245,230,0.85)";
  ctx.strokeText(text, x, y - 18 * k);
  ctx.fillText(text, x, y - 18 * k);
  ctx.restore();
}

/** 墨溅：一团主墨 + 一圈飞白，先炸开再洇散。 */
function drawSplat(ctx, p, fx, k) {
  const grow = 1 - (1 - k) ** 3;
  const fade = (1 - k) ** 0.7;
  const base = (4 + 10 * grow) * fx.scale;
  ctx.save();
  ctx.fillStyle = fx.color;
  ctx.globalAlpha = 0.5 * fade;
  ctx.beginPath();
  ctx.arc(p.x, p.y, base * 0.46, 0, Math.PI * 2);
  ctx.fill();
  const drops = fx.scale > 1.5 ? 10 : 6;
  for (let i = 0; i < drops; i++) {
    const ang = hash01(fx.id, i) * Math.PI * 2;
    const dist = (0.45 + hash01(fx.id, i + 41) * 0.95) * base;
    const r = (0.8 + hash01(fx.id, i + 83) * 1.9) * fx.scale;
    ctx.globalAlpha = 0.4 * fade;
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(ang) * dist * grow, p.y + Math.sin(ang) * dist * grow, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  riseText(ctx, fx.text, p.x, p.y - base * 0.7, k, fx.textColor, fx.scale > 1.5 ? 19 : 12, 700);
}

/** 破阵：终点一记重墨 + 朱砂扩散圈。 */
function drawLeak(ctx, p, fx, k) {
  const grow = 1 - (1 - k) ** 2;
  const fade = (1 - k) ** 0.8;
  ctx.save();
  ctx.strokeStyle = fx.color;
  ctx.globalAlpha = 0.7 * fade;
  ctx.lineWidth = 3 * (1 - k) + 0.6;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 6 + 34 * grow * fx.scale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.35 * fade;
  ctx.fillStyle = fx.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, (8 + 12 * grow) * fx.scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  riseText(ctx, fx.text, p.x, p.y - 16, k, fx.color, 16, 700);
}

/** 赵云·七进七出：一道亮笔顺着整条路扫过去。 */
function drawSweep(ctx, pts, fx, k) {
  const head = k * 1.15;
  const seg = sampleRange(pts, head - 0.3, head, 14);
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = fx.color;
  ctx.globalAlpha = 0.5 * (1 - k * 0.6);
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(seg[0].x, seg[0].y);
  for (const q of seg) ctx.lineTo(q.x, q.y);
  ctx.stroke();
  ctx.globalAlpha = 0.85 * (1 - k * 0.5);
  ctx.lineWidth = 2.5;
  ctx.stroke();
  const tip = seg[seg.length - 1];
  ctx.globalAlpha = 0.8 * (1 - k);
  ctx.fillStyle = fx.color;
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, 6 - 3 * k, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** 黄忠·百步穿杨：斜插的箭雨，落点定数分布。 */
function drawRain(ctx, fx, k, w, h) {
  const arrows = 16;
  ctx.save();
  ctx.strokeStyle = fx.color;
  ctx.lineCap = "round";
  for (let i = 0; i < arrows; i++) {
    const lead = hash01(fx.id, i) * 0.45;
    const local = (k - lead) / 0.55;
    if (local <= 0 || local >= 1) continue;
    const x = (hash01(fx.id, i + 17) * 0.94 + 0.03) * w;
    const y = -12 + (h + 24) * local;
    ctx.globalAlpha = 0.75 * (1 - local * 0.6);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 13);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.globalAlpha = 0.5 * (1 - local);
    ctx.beginPath();
    ctx.arc(x, y, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = fx.color;
    ctx.fill();
  }
  ctx.restore();
}

/** 张飞·当阳爆喝：双环冲击波。 */
function drawRing(ctx, p, fx, k) {
  ctx.save();
  ctx.strokeStyle = fx.color;
  for (let i = 0; i < 2; i++) {
    const local = Math.max(0, k - i * 0.18) / (1 - i * 0.18);
    if (local <= 0) continue;
    ctx.globalAlpha = 0.65 * (1 - local) * (1 - i * 0.35);
    ctx.lineWidth = (4 - i * 1.6) * (1 - local) + 0.6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8 + (54 + i * 16) * local * fx.scale * 0.6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/** 关羽·温酒斩：一记横扫的刀弧。 */
function drawArc(ctx, p, fx, k) {
  const spin = -Math.PI * 0.75 + Math.PI * 1.5 * k;
  const radius = 16 + 26 * (1 - (1 - k) ** 2);
  ctx.save();
  ctx.strokeStyle = fx.color;
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.7 * (1 - k);
  ctx.lineWidth = 7 * (1 - k) + 1;
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, spin - 0.95, spin + 0.35);
  ctx.stroke();
  ctx.globalAlpha = 0.9 * (1 - k);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, spin - 0.95, spin + 0.35);
  ctx.stroke();
  ctx.restore();
}

/** 刘备·仁德：一层金晕漫过整条行军道。 */
function drawAura(ctx, fx, k, w, h) {
  const pulse = Math.sin(Math.PI * k);
  ctx.save();
  ctx.globalAlpha = 0.3 * pulse;
  const grad = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, Math.max(w, h) * 0.62);
  grad.addColorStop(0, fx.color);
  grad.addColorStop(1, "rgba(201,162,74,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 0.4 * pulse;
  ctx.strokeStyle = fx.color;
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, w - 4, h - 4);
  ctx.restore();
}

/** 马超·西凉铁骑：贴着路线的一记冲撞，带速度线。 */
function drawDash(ctx, pts, fx, k, focus) {
  const head = focus + 0.06 * k;
  const seg = sampleRange(pts, head - 0.16, head, 8);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = fx.color;
  ctx.globalAlpha = 0.55 * (1 - k);
  ctx.lineWidth = 13 * (1 - k * 0.5);
  ctx.beginPath();
  ctx.moveTo(seg[0].x, seg[0].y);
  for (const q of seg) ctx.lineTo(q.x, q.y);
  ctx.stroke();
  ctx.globalAlpha = 0.85 * (1 - k);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawSkill(ctx, pts, fx, k, w, h) {
  const focus = typeof fx.t === "number" ? fx.t : 0.5;
  const p = pointAt(pts, focus);
  switch (fx.shape) {
    case "sweep":
      drawSweep(ctx, pts, fx, k);
      break;
    case "rain":
      drawRain(ctx, fx, k, w, h);
      break;
    case "arc":
      drawArc(ctx, p, fx, k);
      break;
    case "aura":
      drawAura(ctx, fx, k, w, h);
      break;
    case "dash":
      drawDash(ctx, pts, fx, k, focus);
      break;
    default:
      drawRing(ctx, p, fx, k);
  }
  // 招式名跟着焦点走；全屏技（focusT 为 null）就挂在画面正中。
  const anchor = typeof fx.t === "number" ? p : { x: w / 2, y: h * 0.34 };
  riseText(ctx, fx.text, anchor.x, anchor.y - 22, k, fx.textColor, 15, 700);
}

function drawFx(ctx, pts, fx, w, h) {
  const k = fxProgress(fx);
  if (k >= 1) return;
  if (fx.kind === "splat") drawSplat(ctx, pointAt(pts, fx.t), fx, k);
  else if (fx.kind === "leak") drawLeak(ctx, pointAt(pts, fx.t), fx, k);
  else if (fx.kind === "skill") drawSkill(ctx, pts, fx, k, w, h);
}

/**
 * 画一侧的行军路线与敌军。签名由主循环调用，勿改。
 * `flipY` 为真时画对岸（路线上下翻转）。
 */
export function drawLane(canvas, enemies, flipY) {
  if (!canvas || typeof canvas.getContext !== "function") return;
  const box = resize(canvas);
  if (!box) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { w, h, dpr } = box;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const pts = pathPoints(w, h, flipY);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = `${INK}0.28)`;
  ctx.lineWidth = 6;
  strokePath(ctx, pts);
  ctx.strokeStyle = "rgba(178,58,47,0.15)";
  ctx.lineWidth = 2;
  strokePath(ctx, pts);
  drawMarkers(ctx, pts);

  const list = Array.isArray(enemies) ? enemies : [];
  const side = flipY ? "ai" : "player";
  // 击杀事件只带 id：先把这一帧的位置记下来，下一帧落墨才有坐标。
  noteEnemies(side, list);
  // 走得越靠前画得越晚，领头的兵压在最上层。
  const ordered = list.length > 1 ? [...list].sort((a, b) => (a.t || 0) - (b.t || 0)) : list;
  for (const e of ordered) {
    if (!e || e.hp <= 0) continue;
    drawEnemy(ctx, e, pointAt(pts, e.t));
  }

  for (const fx of takeLaneEffects(side)) drawFx(ctx, pts, fx, w, h);
}
