import { createStore } from "../src/core/store.js";
import { placeBuilding, expandRaft, canPlace } from "../src/world/build.js";
import { tickWorld } from "../src/world/sim.js";
import { BUILDINGS } from "../src/data/buildings.js";

let s = createStore().get();
s = { ...s, player: { ...s.player, level: 9 }, resources: Object.fromEntries(Object.keys(s.resources).map((k) => [k, 9999])) };
for (let i = 0; i < 20; i += 1) s = expandRaft(s, i % 2 ? "right" : "down");

let placed = 0;
for (const type of Object.keys(BUILDINGS)) {
  outer: for (let y = 0; y < s.raft.height; y += 1) {
    for (let x = 0; x < s.raft.width; x += 1) {
      if (canPlace(s, type, x, y, 0).ok) {
        s = placeBuilding(s, type, x, y, 0);
        placed += 1;
        break outer;
      }
    }
  }
}

for (let i = 0; i < 2000; i += 1) s = tickWorld(s, 0.25);
console.log(JSON.stringify({ placed, raft: [s.raft.width, s.raft.height], level: s.player.level, weather: s.world.weather, tickOk: s.player.hp > 0 }));
if (placed < 8 || s.player.hp <= 0) process.exit(1);
