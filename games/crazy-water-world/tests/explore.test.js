import { describe, expect, it } from "vitest";
import { createStore } from "../src/core/store.js";
import { placeBuilding } from "../src/world/build.js";
import { collectFlotsam, spawnFlotsam } from "../src/explore/salvage.js";
import { castLine, gradeCast, GRADES, resolveHook } from "../src/explore/fishing.js";
import { startDive, diveStep, finishDive } from "../src/explore/dive.js";
import { mulberry32 } from "../src/core/rng.js";
import { flotsamPoint, pickFlotsam, seaLayout } from "../src/world/canvas.js";

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

  it("grades Perfect, Good, and Miss while preserving failed-cast state", () => {
    let s = createStore().get();
    const failedCast = castLine(s);
    expect(failedCast).toMatchObject({ ok: false, code: "E_REQUIRES_BUILDING" });
    expect(resolveHook(s, failedCast, 0.5)).toBe(s);

    s = placeBuilding(s, "fish_chair", 2, 2, 0);
    const cast = castLine(s);
    const perfectTiming = (cast.perfect[0] + cast.perfect[1]) / 2;
    const goodTiming = (cast.window[0] + cast.perfect[0]) / 2;
    const missTiming = cast.window[0] > 0 ? cast.window[0] / 2 : (cast.window[1] + 1) / 2;

    expect(gradeCast(cast, perfectTiming).grade).toBe(GRADES.PERFECT);
    expect(gradeCast(cast, goodTiming).grade).toBe(GRADES.GOOD);
    expect(gradeCast(cast, missTiming).grade).toBe(GRADES.MISS);
    expect(resolveHook(s, cast, perfectTiming).explore.fishing.lastCatch.grade).toBe(GRADES.PERFECT);
    expect(resolveHook(s, cast, goodTiming).explore.fishing.lastCatch.grade).toBe(GRADES.GOOD);
    expect(resolveHook(s, cast, missTiming).explore.fishing.lastCatch.grade).toBe(GRADES.MISS);
  });

  it("does not throw or replace state for a rejected dive session", () => {
    const s = createStore().get();

    expect(() => finishDive(s, { ok: false })).not.toThrow();
    expect(finishDive(s, { ok: false })).toBe(s);
  });

  it("requires a two-dimensional hit to pick flotsam", () => {
    const flotsam = { id: "target", res: "wood", n: 1, rare: false, x: -0.8, y: 0.2, vx: 0, ttl: 9 };
    const s = createStore().get();
    s.explore.salvage.flotsam = [flotsam];
    const canvas = {
      getBoundingClientRect: () => ({ left: 20, top: 30, width: 800, height: 600 }),
    };
    const point = flotsamPoint(flotsam, seaLayout(s, 800, 600), 0);
    const clientX = 20 + point.x;
    const clientY = 30 + point.y;

    expect(pickFlotsam(canvas, s, clientX, clientY, 0)).toBe(flotsam);
    expect(pickFlotsam(canvas, s, clientX, clientY + 80, 0)).toBeNull();
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
