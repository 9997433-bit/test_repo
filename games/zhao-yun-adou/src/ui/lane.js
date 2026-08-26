import { pathPoints, pointAt } from "../combat/path.js";

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
  // 走得越靠前画得越晚，领头的兵压在最上层。
  const ordered = list.length > 1 ? [...list].sort((a, b) => (a.t || 0) - (b.t || 0)) : list;
  for (const e of ordered) {
    if (!e || e.hp <= 0) continue;
    drawEnemy(ctx, e, pointAt(pts, e.t));
  }
}
