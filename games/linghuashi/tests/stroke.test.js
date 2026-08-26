import { describe, expect, it } from "vitest";
import { classifyStroke } from "../src/drawing/recognizer.js";
import { templatePoints } from "../src/drawing/templates.js";

function line() {
  return Array.from({ length: 40 }, (_, i) => ({ x: 10 + i * 6, y: 40 + i * 0.2, t: i * 16 }));
}
function circle() {
  return Array.from({ length: 80 }, (_, i) => {
    const a = (i / 79) * Math.PI * 2;
    return { x: 120 + Math.cos(a) * 50, y: 120 + Math.sin(a) * 50, t: i * 12 };
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
  it("recognizes a closed circle", () => {
    expect(classifyStroke(circle()).type).toBe("circle");
  });
  it("recognizes a zigzag", () => {
    const r = classifyStroke(zigzag());
    expect(["zigzag", "curve"]).toContain(r.type);
  });
  it("rejects tiny scribbles", () => {
    expect(classifyStroke([{ x: 1, y: 1, t: 0 }, { x: 3, y: 2, t: 10 }]).type).toBe("scribble");
  });
  it("recognizes a spiral", () => {
    expect(classifyStroke(templatePoints("spiral")).type).toBe("spiral");
  });
  it("recognizes a lobed cloud blob", () => {
    expect(classifyStroke(templatePoints("cloud")).type).toBe("cloud");
  });
  it("recognizes a smooth arc as curve", () => {
    expect(classifyStroke(templatePoints("curve")).type).toBe("curve");
  });
  it("does not mistake a hand-wobbly circle for a cloud", () => {
    // 椭圆式手抖圆：半径两瓣振荡，不构成云形多瓣
    const pts = Array.from({ length: 80 }, (_, i) => {
      const a = (i / 79) * Math.PI * 2;
      return { x: 150 + Math.cos(a) * 62, y: 150 + Math.sin(a) * 52, t: i * 12 };
    });
    expect(classifyStroke(pts).type).toBe("circle");
  });
  it("noisy jitter never yields high-precision big talismans", () => {
    let seed = 7;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (let k = 0; k < 20; k += 1) {
      const pts = Array.from({ length: 50 }, (_, i) => ({
        x: 100 + (rnd() - 0.5) * 180,
        y: 100 + (rnd() - 0.5) * 180,
        t: i * 12,
      }));
      const r = classifyStroke(pts);
      if (r.type === "spiral" || r.type === "cloud") {
        expect(r.precision).toBeLessThan(0.6);
      }
    }
  });
});
