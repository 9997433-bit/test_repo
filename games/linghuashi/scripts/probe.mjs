import { classifyStroke } from "../src/drawing/recognizer.js";
import { createBattle } from "../src/combat/battle.js";

const line = Array.from({ length: 36 }, (_, i) => ({ x: i * 8, y: 20, t: i * 10 }));
const r = classifyStroke(line);
if (r.type !== "line") {
  console.error("probe: expected line, got", r);
  process.exit(1);
}
const b = createBattle({
  player: { id: "p", name: "p", classId: "fa", element: "fire", hp: 100, atk: 20, qi: 80 },
  enemy: { id: "e", name: "e", classId: "ti", element: "earth", hp: 40, atk: 4 },
});
b.cast({ type: "spiral", precision: 0.8, pressure: 0.5 });
if (b.getState().enemy.hp >= 40) {
  console.error("probe: spiral did no damage");
  process.exit(1);
}
console.log("probe ok", { type: r.type, precision: r.precision.toFixed(2), enemyHp: b.getState().enemy.hp });
