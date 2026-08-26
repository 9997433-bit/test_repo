export function createInkBrush(ctx) {
  return {
    stroke(points, { color = "#1a120b", pressure = 0.5 } = {}) {
      if (points.length < 2) return;
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = color;
      for (let i = 1; i < points.length; i += 1) {
        const a = points[i - 1];
        const b = points[i];
        const dt = Math.max(1, (b.t ?? i) - (a.t ?? i - 1));
        const speed = Math.hypot(b.x - a.x, b.y - a.y) / dt;
        const w = 2.2 + pressure * 7.5 * (1 / (1 + speed * 6));
        ctx.globalAlpha = 0.55 + pressure * 0.4;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.restore();
    },
    bloom(x, y, color, r = 28) {
      const g = ctx.createRadialGradient(x, y, 2, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
  };
}
