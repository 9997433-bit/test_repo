import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GALLERY_LIMIT,
  GALLERY_POINTS,
  createStore,
  defaultSave,
  pushGallery,
  sanitizeGallery,
  sanitizeGalleryEntry,
} from "../src/core/store.js";
import { fitToCanvas, normalizeForStorage } from "../src/drawing/replay.js";
import { templatePoints, TEMPLATE_TYPES } from "../src/drawing/templates.js";
import { classifyStroke } from "../src/drawing/recognizer.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** 复刻 screen-battle.js 写入画阁那一步，不牵扯 DOM。 */
function recordStroke(gallery, type, at = 1_700_000_000_000) {
  const stroke = classifyStroke(templatePoints(type));
  return pushGallery(gallery, {
    type: stroke.type,
    precision: stroke.precision,
    at,
    points: normalizeForStorage(stroke.raw, GALLERY_POINTS),
  });
}

describe("gallery entries carry the raw trace", () => {
  it.each(TEMPLATE_TYPES)("stores a replayable %s trace", (type) => {
    const [entry] = recordStroke([], type);
    expect(entry.type).toBe(type);
    expect(entry.points).toHaveLength(GALLERY_POINTS);
    for (const p of entry.points) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(1);
    }
  });

  it.each(TEMPLATE_TYPES)("still reads as %s after a save round-trip", (type) => {
    const gallery = JSON.parse(JSON.stringify(recordStroke([], type)));
    const restored = fitToCanvas(gallery[0].points, 168, 120);
    expect(classifyStroke(restored).type).toBe(type);
  });

  it("keeps the newest strokes within the gallery cap", () => {
    let gallery = [];
    for (let i = 0; i < GALLERY_LIMIT + 6; i += 1) gallery = recordStroke(gallery, "line", 1000 + i);
    expect(gallery).toHaveLength(GALLERY_LIMIT);
    expect(gallery[gallery.length - 1].at).toBe(1000 + GALLERY_LIMIT + 5);
  });

  it("stays inside the save size budget when full", () => {
    let gallery = [];
    for (let i = 0; i < GALLERY_LIMIT; i += 1) {
      gallery = recordStroke(gallery, TEMPLATE_TYPES[i % TEMPLATE_TYPES.length], 1000 + i);
    }
    const bytes = JSON.stringify({ ...defaultSave(), gallery }).length;
    expect(bytes).toBeLessThan(64 * 1024);
  });
});

describe("gallery sanitising", () => {
  it("keeps legacy entries that never had a trace", () => {
    const entry = sanitizeGalleryEntry({ type: "circle", precision: 0.8, at: 42 });
    expect(entry).toEqual({ type: "circle", precision: 0.8, at: 42 });
    expect(entry.points).toBeUndefined();
  });

  it("drops junk points, clamps stray coordinates and caps the count", () => {
    const points = [{ x: -3, y: 0.2 }, { x: 0.5, y: 9 }, { x: "a", y: 1 }, ...Array.from({ length: 60 }, () => ({ x: 0.4, y: 0.4 }))];
    const entry = sanitizeGalleryEntry({ type: "line", precision: 4, at: "nope", points });
    expect(entry.precision).toBe(1);
    expect(Number.isFinite(entry.at)).toBe(true);
    expect(entry.points).toHaveLength(GALLERY_POINTS);
    expect(entry.points[0]).toEqual({ x: 0, y: 0.2 });
    expect(entry.points[1]).toEqual({ x: 0.5, y: 1 });
  });

  it("rejects entries without a stroke type", () => {
    expect(sanitizeGalleryEntry({ precision: 1 })).toBeNull();
    expect(sanitizeGalleryEntry(null)).toBeNull();
    expect(pushGallery([{ type: "line", precision: 1, at: 1 }], null)).toHaveLength(1);
  });

  it("survives a corrupted gallery in the save file", () => {
    const raw = JSON.stringify({
      ...defaultSave(),
      gallery: [null, 7, { type: "line", precision: 0.9, at: 1, points: "nope" }, { type: "cloud", precision: 0.5, at: 2, points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] }],
    });
    vi.stubGlobal("localStorage", { getItem: () => raw });
    const store = createStore();
    const save = store.hydrate();

    expect(save.gallery).toHaveLength(2);
    expect(save.gallery[0].points).toBeUndefined();
    expect(save.gallery[1].points).toHaveLength(2);
    expect(sanitizeGallery("not an array")).toEqual([]);
  });
});
