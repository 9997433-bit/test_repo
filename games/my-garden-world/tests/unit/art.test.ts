import { describe, expect, it } from "vitest";
import { FLOWER_MAP, STAGES } from "../../src/data/flowers";
import { plotArt } from "../../src/scene/flower-art";

describe("plotArt", () => {
  it("returns valid svg for every stage of every flower", () => {
    for (const def of Object.values(FLOWER_MAP)) {
      for (const stage of STAGES) {
        const svg = plotArt(def, stage);
        expect(svg.startsWith("<svg")).toBe(true);
        expect(svg.endsWith("</svg>")).toBe(true);
      }
    }
  });

  it("renders without a flower definition", () => {
    for (const stage of STAGES) {
      expect(plotArt(undefined, stage)).toContain("<svg");
    }
  });

  it("uses the flower colors at bloom", () => {
    const peony = FLOWER_MAP.peony!;
    const svg = plotArt(peony, "bloom");
    expect(svg).toContain(peony.color);
    expect(svg).toContain(peony.accent);
  });

  it("rare flowers get a glow ring, commons do not", () => {
    expect(plotArt(FLOWER_MAP["star-tulip"], "bloom")).toContain("glow");
    expect(plotArt(FLOWER_MAP.daisy, "bloom")).not.toContain("glow");
  });

  it("bloom art carries the sway group for CSS animation", () => {
    expect(plotArt(FLOWER_MAP.daisy, "bloom")).toContain('class="sway"');
    expect(plotArt(FLOWER_MAP.daisy, "wilt")).not.toContain('class="sway"');
  });
});
