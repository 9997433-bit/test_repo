import { createInitialState, advanceTime } from "../src/core/engine.js";
import { CROPS, RECIPES, BUILDINGS } from "../src/data/index.js";

const s0 = createInitialState();
const { state, crossedDay } = advanceTime(s0, s0.meta.hourMs * 24);
const report = {
  crops: CROPS.length,
  recipes: RECIPES.length,
  buildings: BUILDINGS.length,
  startPlots: s0.plots.length,
  dayRollover: state.meta.day === s0.meta.day + 1 && !crossedDay === false,
  season: state.meta.season,
};
console.log(JSON.stringify(report, null, 2));
if (CROPS.length < 8 || RECIPES.length < 8) {
  console.error("probe: data tables look thin");
  process.exit(1);
}
