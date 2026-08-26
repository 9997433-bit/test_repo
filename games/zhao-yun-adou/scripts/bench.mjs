import { createGame } from "../src/core/game.js";
import { stepAi } from "../src/ai/opponent.js";

const N = 20;
const t0 = performance.now();
let overs = 0;
let playerWins = 0;
for (let i = 0; i < N; i++) {
  const g = createGame({ seed: 1000 + i * 17 });
  g.start();
  for (let k = 0; k < 6000 && g.state.phase === "playing"; k++) {
    g.tick(0.05);
    stepAi(g, 0.05);
    if (k % 10 === 0) g.recruit("player");
    const p = g.state.sides.player;
    if (p.hand[0]) {
      const cell = p.cells.find((c) => c.unlocked && !c.unit);
      if (cell) g.place("player", 0, cell.index);
    }
  }
  if (g.state.phase === "over") {
    overs += 1;
    if (g.state.winner === "player") playerWins += 1;
  }
}
const ms = performance.now() - t0;
const report = {
  matches: N,
  settled: overs,
  playerWins,
  ms: Number(ms.toFixed(1)),
  perMatchMs: Number((ms / N).toFixed(2)),
};
console.log(JSON.stringify(report, null, 2));
if (overs < N * 0.8) {
  console.error("bench: too many unfinished matches");
  process.exit(1);
}
