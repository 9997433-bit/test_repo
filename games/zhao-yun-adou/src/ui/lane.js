import { pathPoints, pointAt } from "../combat/path.js";

export function drawLane(canvas, enemies, flipY) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const pts = pathPoints(w, h, flipY);
  ctx.strokeStyle = "rgba(28,22,16,0.28)";
  ctx.lineWidth = 6;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y);
  ctx.stroke();
  ctx.strokeStyle = "rgba(178,58,47,0.15)";
  ctx.lineWidth = 2;
  ctx.stroke();

  for (const e of enemies) {
    const p = pointAt(pts, e.t);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = e.boss ? "#b23a2f" : "#1c1610";
    ctx.font = `${e.boss ? 22 : 16}px "Ma Shan Zheng", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(e.glyph, 0, 0);
    const ratio = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = "rgba(28,22,16,0.2)";
    ctx.fillRect(-12, 12, 24, 3);
    ctx.fillStyle = e.boss ? "#c9a24a" : "#b23a2f";
    ctx.fillRect(-12, 12, 24 * ratio, 3);
    ctx.restore();
  }
}
