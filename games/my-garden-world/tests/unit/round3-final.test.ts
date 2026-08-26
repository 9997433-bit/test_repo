import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { THEMES } from "../../src/data/decorations";
import { SIDE_STORIES, TUTORIAL } from "../../src/data/story";
import { loadState, resetSaveScheduler, saveState } from "../../src/engine/save";
import { createInitialState, type GameState } from "../../src/engine/state";
import { decorSlot } from "../../src/scene/decor-art";
import { applyTheme, placeDecor } from "../../src/systems/decorate";
import { scoreBreakdown } from "../../src/systems/workshop";

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord {
  expect(value).not.toBeNull();
  expect(typeof value).toBe("object");
  return value as UnknownRecord;
}

function placedIds(state: GameState): string[] {
  return (state.placedDecor as unknown[]).flatMap((entry) => {
    if (typeof entry === "string") return [entry];
    const id = record(entry).id;
    return typeof id === "string" ? [id] : [];
  });
}

beforeEach(() => {
  resetSaveScheduler();
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  resetSaveScheduler();
  vi.resetModules();
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe("Round 3 optional feature contracts", () => {
  it("preserves the neighbor entry points until a social-state API is available", () => {
    const state = createInitialState(1_000);
    const social = record(state).social;

    if (social === undefined) {
      expect(TUTORIAL.find((beat) => beat.id === "open")?.allow).toContain("visit");
      expect(SIDE_STORIES.map((story) => story.trigger)).toEqual(
        expect.arrayContaining(["visit-first", "visit-pick-first"]),
      );
      return;
    }

    const data = record(social);
    expect(data.day).toEqual(expect.any(Number));
    expect(data.waterLeft).toEqual(expect.any(Number));
    expect(data.pickLeft).toEqual(expect.any(Number));
    expect(record(data.friendship)).toEqual(expect.any(Object));
    expect(data.marks).toEqual(expect.any(Array));

    expect(saveState(state)).toBe(true);
    expect(record(loadState()).social).toEqual(social);
  });

  it("persists legacy decor placement and validates anchors when that API is present", () => {
    const state = createInitialState(2_000);
    state.level = 20;
    state.fragments = 1_000;

    expect(placeDecor(state, "lantern")).toBe(true);
    expect(placeDecor(state, "lantern")).toBe(false);
    expect(placedIds(state)).toEqual(["lantern"]);

    const entry = (state.placedDecor as unknown[])[0];
    if (typeof entry === "string") {
      const slot = decorSlot(entry);
      expect(slot.x).toBeGreaterThanOrEqual(0);
      expect(slot.x).toBeLessThanOrEqual(100);
      expect(slot.y).toBeGreaterThanOrEqual(0);
      expect(slot.y).toBeLessThanOrEqual(100);
    } else {
      expect(record(entry)).toMatchObject({
        id: "lantern",
        anchor: expect.any(String),
      });
    }

    expect(saveState(state)).toBe(true);
    expect(placedIds(loadState())).toEqual(["lantern"]);
  });

  it("uses the hue palette curve once wired and records the legacy curve until then", () => {
    const palettes = [
      scoreBreakdown(["chrys", "osmanthus"], "clay", "autumn").palette,
      scoreBreakdown(["chrys", "maple"], "clay", "autumn").palette,
      scoreBreakdown(["chrys", "maple", "star-tulip"], "clay", "autumn").palette,
      scoreBreakdown(["chrys", "maple", "star-tulip", "snow-lotus"], "clay", "autumn").palette,
    ];

    if (palettes[0] === 8) {
      expect(palettes).toEqual([8, 12, 6, 2]);
    } else {
      // Round 2 fallback: every distinct hexadecimal color contributes 3.5.
      expect(palettes).toEqual([7, 7, 10.5, 14]);
    }
  });

  it("applies a theme once and persists its selected marker when supported", () => {
    const theme = THEMES.find((candidate) => candidate.id === "autumn");
    expect(theme).toBeDefined();
    if (!theme) return;

    const state = createInitialState(3_000);
    state.level = 20;
    state.fragments = 1_000;

    applyTheme(state, theme.id);
    expect(placedIds(state)).toEqual(expect.arrayContaining(theme.ids));
    expect(new Set(placedIds(state)).size).toBe(placedIds(state).length);

    const fragmentsAfterFirstApply = state.fragments;
    applyTheme(state, theme.id);
    expect(state.fragments).toBe(fragmentsAfterFirstApply);
    expect(new Set(placedIds(state)).size).toBe(placedIds(state).length);

    const supportsThemeMarker = Object.hasOwn(record(state), "decorTheme");
    if (supportsThemeMarker) expect(record(state).decorTheme).toBe(theme.id);

    expect(saveState(state)).toBe(true);
    const loaded = loadState();
    expect(placedIds(loaded)).toEqual(expect.arrayContaining(theme.ids));
    if (supportsThemeMarker) expect(record(loaded).decorTheme).toBe(theme.id);
  });

  it("roundtrips a mute field when present and otherwise keeps the toggle API safe", async () => {
    const state = createInitialState(4_000);
    const stateRecord = record(state);
    const muteField = ["muted", "audioMuted", "soundMuted"].find((key) =>
      Object.hasOwn(stateRecord, key),
    );

    if (muteField) {
      stateRecord[muteField] = true;
      expect(saveState(state)).toBe(true);
      expect(record(loadState())[muteField]).toBe(true);
    }

    const sound = await import("../../src/audio/soundscape");
    if (sound.isMuted()) sound.toggleMute();
    expect(sound.isMuted()).toBe(false);
    expect(sound.toggleMute()).toBe(true);
    expect(sound.isMuted()).toBe(true);

    const wrotePreference = localStorage.length > 0 || sessionStorage.length > 0;
    vi.resetModules();
    const reloaded = await import("../../src/audio/soundscape");
    expect(reloaded.isMuted()).toBe(wrotePreference);
  });
});
