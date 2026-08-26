import { describe, expect, it } from "vitest";
import { classifyStroke } from "../src/drawing/recognizer.js";

function line() {
  return Array.from({ length: 40 }, (_, i) => ({ x: 10 + i * 6, y: 40 + i * 0.2, t: i * 16 }));
}
function circle() {
  return Array.from({ length: 80 }, (_, i) => {
    const a = (i / 79) * Math.PI * 2;
    return { x: 120 + Math.cos(a) * 50, y: 120 + Math.sin(a) * 50, t: i * 12 };
  });
}
function noisyCircle() {
  return Array.from({ length: 80 }, (_, i) => {
    const a = (i / 79) * Math.PI * 2;
    const noise = ((i % 7) - 3) * 0.8;
    return {
      x: 120 + Math.cos(a) * (50 + noise),
      y: 120 + Math.sin(a) * (50 - noise),
      t: i * 12,
    };
  });
}
function zigzag() {
  return Array.from({ length: 40 }, (_, i) => ({ x: 20 + i * 5, y: 80 + (i % 2 ? 40 : -40), t: i * 14 }));
}

describe("classifyStroke", () => {
  it("recognizes a straight line", () => {
    expect(classifyStroke(line()).type).toBe("line");
  });
  it("recognizes a perfectly horizontal line", () => {
    const pts = Array.from({ length: 36 }, (_, i) => ({ x: i * 8, y: 20, t: i * 10 }));
    expect(classifyStroke(pts).type).toBe("line");
  });
  it("recognizes a perfectly vertical line", () => {
    const pts = Array.from({ length: 36 }, (_, i) => ({ x: 20, y: i * 8, t: i * 10 }));
    expect(classifyStroke(pts).type).toBe("line");
  });
  it("recognizes a closed circle", () => {
    expect(classifyStroke(circle()).type).toBe("circle");
  });
  it("recognizes a closed circle with deterministic input noise", () => {
    expect(classifyStroke(noisyCircle()).type).toBe("circle");
  });
  it("recognizes a zigzag", () => {
    const r = classifyStroke(zigzag());
    expect(["zigzag", "curve"]).toContain(r.type);
  });
  it("rejects tiny scribbles", () => {
    expect(classifyStroke([{ x: 1, y: 1, t: 0 }, { x: 3, y: 2, t: 10 }]).type).toBe("scribble");
  });
  it("rejects strokes with enough samples but too little length", () => {
    const pts = Array.from({ length: 8 }, (_, i) => ({ x: i * 3, y: (i % 2) * 2, t: i * 10 }));
    const result = classifyStroke(pts);

    expect(result.length).toBeLessThan(28);
    expect(result.type).toBe("scribble");
  });
});
