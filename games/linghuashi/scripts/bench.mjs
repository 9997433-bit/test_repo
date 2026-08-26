import { classifyStroke } from "../src/drawing/recognizer.js";

const samples = [];
for (let k = 0; k < 400; k += 1) {
  samples.push(Array.from({ length: 64 }, (_, i) => ({
    x: i * 3 + Math.sin(i / 3) * (k % 7),
    y: 40 + Math.cos(i / 5) * (k % 11),
    t: i * 8,
  })));
}
const t0 = performance.now();
for (const s of samples) classifyStroke(s);
const dt = performance.now() - t0;
const per = dt / samples.length;
console.log(JSON.stringify({ strokes: samples.length, ms: +dt.toFixed(2), perStrokeMs: +per.toFixed(3) }));
if (per > 4) process.exit(2);
