import { createGame } from "../src/core/game.js";
import { stepAi } from "../src/ai/opponent.js";

const g = createGame({ seed: 99 });
g.start();
let ticks = 0;
while (g.state.phase === "playing" && ticks < 8000) {
  g.tick(0.05);
  stepAi(g, 0.05);
  if (ticks % 8 === 0) g.recruit("player");
  const p = g.state.sides.player;
  const card = p.hand[0];
  if (card) {
    const cell = p.cells.find((c) => c.unlocked && !c.unit) || p.cells.find((c) => c.unlocked);
    if (cell) {
      if (card.kind === "shovel") g.useShovel("player", 0, cell.index);
      else g.place("player", 0, cell.index);
    }
  }
  ticks += 1;
}

const report = {
  ticks,
  time: Number(g.state.time.toFixed(2)),
  phase: g.state.phase,
  winner: g.state.winner,
  wave: g.state.wave,
  player: {
    hearts: g.state.sides.player.hearts,
    kills: g.state.sides.player.kills,
    mantou: g.state.sides.player.mantou,
  },
  ai: { hearts: g.state.sides.ai.hearts, kills: g.state.sides.ai.kills },
};
console.log(JSON.stringify(report, null, 2));
if (g.state.phase !== "over") {
  console.error("probe: match did not settle");
  process.exit(1);
}
