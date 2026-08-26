import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { THEMES } from "../../src/data/decorations";
import { SIDE_STORIES, TUTORIAL } from "../../src/data/story";
import {
  generateNeighborPlots,
  helpWater,
  neighborGarden,
  pickNeighborFlower,
} from "../../src/engine/neighbors";
import { loadState, resetSaveScheduler, saveState } from "../../src/engine/save";
import { createInitialState, type GameState } from "../../src/engine/state";
import { decorSlot } from "../../src/scene/decor-art";
import {
  anchorOf,
  applyTheme,
  placeAt,
  placeDecor,
  stowDecor,
} from "../../src/systems/decorate";
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

function storageSnapshot(storage: Storage): string {
  return Array.from({ length: storage.length }, (_, index) => storage.key(index))
    .filter((key): key is string => key !== null)
    .sort()
    .map((key) => `${key}=${storage.getItem(key)}`)
    .join("\n");
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
  it("preserves the neighbor entry points and persists social state when available", () => {
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

  it("generates a deterministic useful neighbor garden and persists daily interactions", () => {
    const first = generateNeighborPlots("sister", 7);
    const repeated = generateNeighborPlots("sister", 7);
    expect(repeated).toEqual(first);
    expect(first.length).toBeGreaterThanOrEqual(4);
    expect(first.length).toBeLessThanOrEqual(8);
    expect(first.some((plot) => plot.stage === "bloom")).toBe(true);
    expect(first.some((plot) => plot.thirsty)).toBe(true);

    const state = createInitialState(10_000);
    state.level = 5;
    const garden = neighborGarden(state, "sister");
    expect(garden).not.toBeNull();
    if (!garden) return;

    const thirsty = garden.plots.find((plot) => plot.thirsty);
    const blooming = garden.plots.find((plot) => plot.stage === "bloom");
    expect(thirsty).toBeDefined();
    expect(blooming).toBeDefined();
    if (!thirsty || !blooming) return;

    const homeWater = state.water;
    const exp = state.exp;
    expect(helpWater(state, "sister", thirsty.idx)).toBe(true);
    expect(state.water).toBe(homeWater);
    expect(state.exp).toBe(exp + 2);
    expect(state.social.friendship.sister).toBe(1);
    expect(helpWater(state, "sister", thirsty.idx)).toBe(false);
    expect(neighborGarden(state, "sister")?.plots[thirsty.idx]).toMatchObject({
      watered: true,
      thirsty: false,
    });

    const picked = pickNeighborFlower(state, "sister", blooming.idx);
    expect(picked).toBe(blooming.flowerId);
    expect(picked ? state.inventory[picked] : undefined).toBe(1);
    expect(pickNeighborFlower(state, "sister", blooming.idx)).toBeNull();

    expect(saveState(state)).toBe(true);
    expect(loadState().social).toEqual(state.social);
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

  it("swaps, stows, and restores anchor placements without losing ownership", () => {
    const state = createInitialState(2_500);
    state.level = 20;
    state.fragments = 1_000;
    expect(placeDecor(state, "lantern")).toBe(true);
    expect(placeDecor(state, "chimes")).toBe(true);

    const lanternStart = anchorOf(state, "lantern");
    const chimesStart = anchorOf(state, "chimes");
    expect(lanternStart).not.toBeNull();
    expect(chimesStart).not.toBeNull();
    expect(chimesStart).not.toBe(lanternStart);
    if (!lanternStart || !chimesStart) return;

    expect(placeAt(state, "chimes", lanternStart)).toBe(true);
    expect(anchorOf(state, "chimes")).toBe(lanternStart);
    expect(anchorOf(state, "lantern")).toBe(chimesStart);
    expect(stowDecor(state, "lantern")).toBe(true);
    expect(anchorOf(state, "lantern")).toBeNull();
    expect(placedIds(state)).toEqual(["lantern", "chimes"]);

    expect(saveState(state)).toBe(true);
    const loaded = loadState();
    expect(anchorOf(loaded, "chimes")).toBe(lanternStart);
    expect(anchorOf(loaded, "lantern")).toBeNull();
    expect(placedIds(loaded)).toEqual(["lantern", "chimes"]);
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
    const beforeToggle = `${storageSnapshot(localStorage)}\n${storageSnapshot(sessionStorage)}`;
    expect(sound.toggleMute()).toBe(true);
    expect(sound.isMuted()).toBe(true);

    const afterToggle = `${storageSnapshot(localStorage)}\n${storageSnapshot(sessionStorage)}`;
    const wrotePreference = afterToggle !== beforeToggle;
    vi.resetModules();
    const reloaded = await import("../../src/audio/soundscape");
    expect(reloaded.isMuted()).toBe(wrotePreference);
  });
});
