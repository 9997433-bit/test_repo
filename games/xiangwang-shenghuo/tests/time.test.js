import { describe, expect, it } from "vitest";
import {
  advanceTime,
  createInitialState,
  DAYS_PER_SEASON,
  DAY_HOURS,
} from "../src/core/engine.js";

const elapsedHours = (state, hours) => state.meta.hourMs * hours;

describe("advanceTime", () => {
  it("keeps partial-day time within the same day", () => {
    const initial = createInitialState();
    const result = advanceTime(initial, elapsedHours(initial, 2.5));

    expect(result.state.meta).toMatchObject({
      day: 1,
      season: "spring",
      gameMinutes: 10.5 * 60,
    });
    expect(result.crossedDay).toBe(false);
    expect(result.crossedSeason).toBe(false);
  });

  it("rolls midnight into the next day", () => {
    const initial = createInitialState();
    const late = {
      ...initial,
      meta: { ...initial.meta, gameMinutes: DAY_HOURS * 60 - 30 },
    };
    const result = advanceTime(late, elapsedHours(late, 0.5));

    expect(result.state.meta).toMatchObject({
      day: 2,
      season: "spring",
      gameMinutes: 0,
    });
    expect(result.crossedDay).toBe(true);
    expect(result.crossedSeason).toBe(false);
  });

  it.each([
    [7, "spring", 8, "summer"],
    [14, "summer", 15, "autumn"],
    [21, "autumn", 22, "winter"],
    [28, "winter", 29, "spring"],
  ])(
    "advances day %i from %s to day %i in %s",
    (day, season, nextDay, nextSeason) => {
      const initial = createInitialState();
      const boundary = {
        ...initial,
        meta: {
          ...initial.meta,
          day,
          season,
          gameMinutes: DAY_HOURS * 60 - 60,
        },
      };
      const result = advanceTime(boundary, elapsedHours(boundary, 1));

      expect(DAYS_PER_SEASON).toBe(7);
      expect(result.state.meta).toMatchObject({
        day: nextDay,
        season: nextSeason,
        gameMinutes: 0,
      });
      expect(result.crossedDay).toBe(true);
      expect(result.crossedSeason).toBe(true);
    },
  );

  it("handles multiple day and season rollovers in one update", () => {
    const initial = createInitialState();
    const result = advanceTime(
      initial,
      elapsedHours(initial, DAY_HOURS * DAYS_PER_SEASON * 4),
    );

    expect(result.state.meta).toMatchObject({
      day: 29,
      season: "spring",
      gameMinutes: initial.meta.gameMinutes,
    });
    expect(result.crossedDay).toBe(true);
    expect(result.crossedSeason).toBe(true);
  });
});
