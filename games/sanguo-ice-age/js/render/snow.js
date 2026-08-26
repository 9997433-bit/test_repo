/** 雪粒子系统：平时飘雪，寒潮时狂风大雪。导入时不触碰 DOM。 */
import { mulberry32 } from "../engine/rng.js";

const MAX_FLAKES = 900;

export function createSnow(seed = 20260) {
  const rng = mulberry32(seed);
  const flakes = [];
  for (let i = 0; i < MAX_FLAKES; i++) {
    flakes.push({
      x: rng(),
      y: rng(),
      depth: 0.35 + rng() * 0.65, // 远近：影响大小/速度/透明度
      sway: rng() * Math.PI * 2,
      swaySpeed: 0.6 + rng() * 1.4,
    });
  }
  return { flakes, rng };
}

/**
 * intensity: 0..1（活跃雪片比例），wind: 水平风力（屏宽/秒，寒潮时增大）。
 */
export function updateAndDrawSnow(snow, ctx, w, h, dt, time, intensity, wind) {
  const active = Math.floor(MAX_FLAKES * intensity);
  ctx.save();
  ctx.fillStyle = "#fff";
  for (let i = 0; i < active; i++) {
    const f = snow.flakes[i];
    const speed = (0.06 + f.depth * 0.12) * (1 + intensity * 1.2);
    f.y += speed * dt;
    f.x += (wind * f.depth + Math.sin(time * f.swaySpeed + f.sway) * 0.008) * dt;
    if (f.y > 1.02) {
      f.y = -0.02;
      f.x = snow.rng();
    }
    if (f.x > 1.02) f.x -= 1.04;
    if (f.x < -0.02) f.x += 1.04;
    const size = (0.8 + f.depth * 1.9) * (1 + intensity * 0.4);
    ctx.globalAlpha = 0.25 + f.depth * 0.55;
    ctx.beginPath();
    ctx.arc(f.x * w, f.y * h, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
