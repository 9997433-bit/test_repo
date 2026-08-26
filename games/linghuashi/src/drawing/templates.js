// 六式符箓的理想轨迹模板。
// 用途：键盘施法（合成笔迹走同一识别管线）、教程引导虚线、识别器回归测试。
export const TEMPLATE_TYPES = ["line", "curve", "circle", "zigzag", "spiral", "cloud"];

export function templatePoints(type, { w = 480, h = 320 } = {}) {
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.32;
  const pts = [];
  const push = (x, y) => pts.push({ x, y, t: pts.length * 12 });

  if (type === "line") {
    for (let i = 0; i <= 47; i += 1) {
      const k = i / 47;
      push(w * 0.08 + (w * 0.84) * k, h * 0.56 - h * 0.12 * k);
    }
  } else if (type === "curve") {
    // 二次贝塞尔弧：总转角约 1.5 rad，落在“曲线”判定带内
    const p0 = { x: w * 0.12, y: h * 0.7 };
    const p1 = { x: w * 0.5, y: h * 0.08 };
    const p2 = { x: w * 0.88, y: h * 0.7 };
    for (let i = 0; i <= 63; i += 1) {
      const k = i / 63;
      const a = 1 - k;
      push(a * a * p0.x + 2 * a * k * p1.x + k * k * p2.x, a * a * p0.y + 2 * a * k * p1.y + k * k * p2.y);
    }
  } else if (type === "circle") {
    for (let i = 0; i <= 63; i += 1) {
      const a = (i / 63) * Math.PI * 2 - Math.PI / 2;
      push(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    }
  } else if (type === "zigzag") {
    const peaks = 6;
    for (let seg = 0; seg <= peaks; seg += 1) {
      const x = w * 0.1 + (w * 0.8 * seg) / peaks;
      const y = seg % 2 ? h * 0.3 : h * 0.7;
      if (seg === 0) push(x, y);
      else {
        const prev = pts[pts.length - 1];
        for (let i = 1; i <= 7; i += 1) {
          const k = i / 7;
          push(prev.x + (x - prev.x) * k, prev.y + (y - prev.y) * k);
        }
      }
    }
  } else if (type === "spiral") {
    const turns = 2.6;
    for (let i = 0; i <= 89; i += 1) {
      const k = i / 89;
      const a = k * Math.PI * 2 * turns;
      const r = 5 + (R * 1.08 - 5) * k;
      push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
  } else if (type === "cloud") {
    // 六瓣鼓包闭合团：云朵的“多瓣半径振荡”特征
    for (let i = 0; i <= 95; i += 1) {
      const a = (i / 95) * Math.PI * 2;
      const r = R * (1 + 0.24 * Math.sin(a * 6));
      push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
  } else {
    push(cx - 10, cy);
    push(cx + 10, cy);
  }
  return pts;
}
