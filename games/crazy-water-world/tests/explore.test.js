import { describe, expect, it } from "vitest";
import { createStore } from "../src/core/store.js";
import { placeBuilding } from "../src/world/build.js";
import { collectFlotsam, spawnFlotsam } from "../src/explore/salvage.js";
import { castLine, resolveHook } from "../src/explore/fishing.js";
import { startDive, diveStep, finishDive } from "../src/explore/dive.js";
import { mulberry32 } from "../src/core/rng.js";

describe("explore", () => {
  it("collects flotsam into the bag", () => {
    let s = createStore().get();
    s.explore.salvage.flotsam = [{ id: "a", res: "wood", n: 3, rare: false, x: 0, y: 0, vx: 0, ttl: 9 }];
    s = collectFlotsam(s, "a");
    expect(s.resources.wood).toBeGreaterThanOrEqual(27);
    expect(s.explore.salvage.flotsam).toHaveLength(0);
  });

  it("fishing requires a chair and can hit the window", () => {
    let s = createStore().get();
    expect(castLine(s).ok).toBe(false);
    s = placeBuilding(s, "fish_chair", 2, 2, 0);
    const cast = castLine(s);
    expect(cast.ok).toBe(true);
    const mid = (cast.window[0] + cast.window[1]) / 2;
    const hit = resolveHook(s, cast, mid);
    expect(hit.explore.fishing.lastCatch.miss).toBe(false);
  });

  it("dive ends when surfacing", () => {
    let s = createStore().get();
    s = {
      ...s,
      player: { ...s.player, level: 5 },
      resources: { ...s.resources, wood: 40, scrap: 20, plastic: 20 },
    };
    s = placeBuilding(s, "dive_dock", 0, 0, 0);
    let sess = startDive(s, "wreck");
    expect(sess.ok).toBe(true);
    sess = diveStep(sess, { surface: true }, 0.2);
    expect(sess.done).toBe(true);
    s = finishDive(s, sess);
    expect(s.explore.dive).toBeNull();
  });

  it("spawnFlotsam stays bounded", () => {
    const rng = mulberry32(1);
    let s = createStore().get();
    for (let i = 0; i < 80; i += 1) {
      s = { ...s, meta: { ...s.meta, tick: i }, explore: { ...s.explore, salvage: { flotsam: spawnFlotsam(s, rng) } } };
    }
    expect(s.explore.salvage.flotsam.length).toBeLessThanOrEqual(14);
  });
});
