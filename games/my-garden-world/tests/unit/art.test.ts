import { describe, expect, it } from "vitest";
import { DECORATIONS } from "../../src/data/decorations";
import { FLOWER_MAP, STAGES } from "../../src/data/flowers";
import { SPIRITS } from "../../src/data/spirits";
import { DECOR_SLOTS, decorArt } from "../../src/scene/decor-art";
import { plotArt } from "../../src/scene/flower-art";
import { spiritArt } from "../../src/scene/spirit-art";

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

describe("decorArt", () => {
  it("every decoration has scene art and a valid courtyard slot", () => {
    for (const d of DECORATIONS) {
      const svg = decorArt(d.id);
      expect(svg.startsWith("<svg"), d.id).toBe(true);
      expect(svg.endsWith("</svg>"), d.id).toBe(true);
      const slot = DECOR_SLOTS[d.id];
      expect(slot, d.id).toBeDefined();
      expect(slot!.x).toBeGreaterThanOrEqual(0);
      expect(slot!.x).toBeLessThanOrEqual(100);
      expect(slot!.w).toBeGreaterThan(20);
      expect(["back", "mid", "front"]).toContain(slot!.layer);
    }
  });

  it("unknown decor ids render nothing (dirty save data is skipped)", () => {
    expect(decorArt("no-such-decor")).toBe("");
  });

  it("lamps carry a glow layer that CSS lights at night", () => {
    expect(decorArt("lantern")).toContain("lamp-glow");
    expect(decorArt("brazier")).toContain("lamp-glow");
    expect(decorArt("pavilion")).toContain("lamp-glow");
    expect(decorArt("pond")).not.toContain("lamp-glow");
  });
});

describe("spiritArt", () => {
  it("every spirit has a scene figure with an aura", () => {
    for (const s of SPIRITS) {
      const svg = spiritArt(s.id);
      expect(svg.startsWith("<svg"), s.id).toBe(true);
      expect(svg, s.id).toContain('class="aura"');
    }
  });

  it("unknown spirit ids render nothing", () => {
    expect(spiritArt("no-such-spirit")).toBe("");
  });
});
