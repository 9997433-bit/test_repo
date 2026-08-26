import { describe, expect, it } from "vitest";
import { templatePoints, TEMPLATE_TYPES } from "../src/drawing/templates.js";
import { classifyStroke } from "../src/drawing/recognizer.js";
import { normalizeForStorage, fitToCanvas } from "../src/drawing/replay.js";

describe("keyboard casting templates", () => {
  it.each(TEMPLATE_TYPES)("template %s classifies as itself", (type) => {
    const r = classifyStroke(templatePoints(type));
    expect(r.type).toBe(type);
    expect(r.precision).toBeGreaterThanOrEqual(0.5);
  });

  it("templates scale with canvas size and still classify", () => {
    for (const type of TEMPLATE_TYPES) {
      const r = classifyStroke(templatePoints(type, { w: 900, h: 500 }));
      expect(r.type).toBe(type);
    }
  });

  it("keyboard mastery can unlock all six types (precision >= 0.6)", () => {
    for (const type of TEMPLATE_TYPES) {
      const r = classifyStroke(templatePoints(type));
      expect(r.precision).toBeGreaterThanOrEqual(0.6);
    }
  });
});

describe("gallery replay storage", () => {
  it("normalizes strokes into unit space", () => {
    const norm = normalizeForStorage(templatePoints("circle"), 32);
    expect(norm.length).toBe(32);
    for (const p of norm) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(1);
    }
  });

  it("fits normalized points back into any canvas", () => {
    const norm = normalizeForStorage(templatePoints("spiral"), 32);
    const pts = fitToCanvas(norm, 150, 100);
    expect(pts.length).toBe(32);
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(150);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(100);
    }
  });

  it("keeps handmade stroke identity after storage round-trip", () => {
    const raw = templatePoints("zigzag");
    const norm = normalizeForStorage(raw, 32);
    const restored = fitToCanvas(norm, 480, 320).map((p, i) => ({ ...p, t: i * 12 }));
    expect(classifyStroke(restored).type).toBe("zigzag");
  });
});
