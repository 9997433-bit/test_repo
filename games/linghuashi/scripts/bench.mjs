// 性能基准：笔迹识别与战斗 tick 必须足够便宜（60fps 预算内）。
import { classifyStroke } from "../src/drawing/recognizer.js";
import { templatePoints, TEMPLATE_TYPES } from "../src/drawing/templates.js";
import { createBattle } from "../src/combat/battle.js";

const samples = [];
for (let k = 0; k < 400; k += 1) {
  samples.push(Array.from({ length: 64 }, (_, i) => ({
    x: i * 3 + Math.sin(i / 3) * (k % 7),
    y: 40 + Math.cos(i / 5) * (k % 11),
    t: i * 8,
  })));
}
for (let k = 0; k < 200; k += 1) {
  samples.push(templatePoints(TEMPLATE_TYPES[k % TEMPLATE_TYPES.length]));
}

const t0 = performance.now();
for (const s of samples) classifyStroke(s);
const dt = performance.now() - t0;
const per = dt / samples.length;

// 战斗 tick 成本
const b = createBattle({
  player: { id: "p", name: "p", classId: "fa", element: "fire", hp: 1e9, atk: 20, qi: 1e9 },
  enemy: { id: "e", name: "e", classId: "ti", element: "earth", hp: 1e9, atk: 1, atkMs: 1000 },
});
const t1 = performance.now();
for (let i = 0; i < 50000; i += 1) b.tick(16);
const tickMs = (performance.now() - t1) / 50000;

console.log(JSON.stringify({
  strokes: samples.length,
  ms: +dt.toFixed(2),
  perStrokeMs: +per.toFixed(3),
  perTickMs: +tickMs.toFixed(5),
}));
if (per > 4) process.exit(2);
if (tickMs > 0.05) process.exit(3);
