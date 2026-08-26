import { describe, expect, it } from "vitest";
import { SPIRITS } from "../../src/data/spirits";
import { createInitialState } from "../../src/engine/state";
import { SPIRIT_ATTR, SPIRIT_VISUALS, spiritForToast, spiritPortrait, spiritPresence, spiritPresenceFor } from "../../src/systems/spirits";

const parse = (svg: string): SVGElement => {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  expect(doc.querySelector("parsererror")).toBeNull();
  return doc.documentElement as unknown as SVGElement;
};

describe("spiritPortrait", () => {
  it("draws well-formed svg for every spirit", () => {
    for (const s of SPIRITS) {
      const svg = spiritPortrait(s.id, { motion: false });
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg.endsWith("</svg>")).toBe(true);
      const root = parse(svg);
      expect(root.getAttribute("viewBox")).toBe("0 0 64 64");
      expect(root.getAttribute("aria-hidden")).toBe("true");
      expect(root.querySelectorAll("path,circle,ellipse,rect,text").length).toBeGreaterThan(4);
    }
  });

  it("every spirit has its own palette and motif, and paints with it", () => {
    const cores = new Set<string>();
    for (const s of SPIRITS) {
      const v = SPIRIT_VISUALS[s.id];
      expect(v, `${s.id} 缺少形象定义`).toBeDefined();
      expect(v!.motif.length).toBeGreaterThan(1);
      cores.add(v!.palette.core);
      expect(spiritPortrait(s.id, { motion: false })).toContain(v!.palette.core);
    }
    expect(cores.size).toBe(SPIRITS.length);
  });

  it("sealed spirits fall back to ink and gain a dashed seal, without animation", () => {
    const juyue = SPIRIT_VISUALS.juyue!;
    const locked = spiritPortrait("juyue", { locked: true, motion: true });
    expect(locked).not.toContain(juyue.palette.core);
    expect(locked).toContain("stroke-dasharray");
    expect(locked).toContain("is-sealed");
    expect(locked).not.toContain("<animate");
  });

  it("honours the motion switch", () => {
    expect(spiritPortrait("rainbow", { motion: true })).toContain("<animateTransform");
    expect(spiritPortrait("rainbow", { motion: false })).not.toContain("<animate");
  });

  it("renders an empty seal when nobody follows", () => {
    const svg = spiritPortrait(null, { motion: false });
    expect(svg).toContain("灵");
    expect(svg).toContain("stroke-dasharray");
    parse(svg);
  });

  it("sizes the glyph as asked", () => {
    expect(parse(spiritPortrait("xueyi", { size: 18, motion: false })).getAttribute("width")).toBe("18");
  });
});

describe("spiritForToast", () => {
  it("recognises spirit lines and awakening notices", () => {
    const s = SPIRITS[0]!;
    expect(spiritForToast(s.line)?.id).toBe(s.id);
    expect(spiritForToast(`花灵苏醒 · ${s.name}`)?.id).toBe(s.id);
    expect(spiritForToast("金币 +30")).toBeUndefined();
  });
});

describe("spiritPresence", () => {
  it("is null with nobody following", () => {
    const state = createInitialState(0);
    expect(spiritPresence(state)).toBeNull();
    expect(spiritPresenceFor(null)).toBeNull();
    expect(spiritPresenceFor("no-such-spirit")).toBeNull();
  });

  it("exports drawable data for the scene layer", () => {
    const state = createInitialState(0);
    state.unlockedSpirits.push("chiguang");
    state.activeSpirit = "chiguang";
    const p = spiritPresence(state)!;
    expect(p.id).toBe("chiguang");
    expect(p.name).toBe("池光");
    expect(p.motif).toBe("荷影池光");
    expect(p.palette.core).toBe(SPIRIT_VISUALS.chiguang!.palette.core);
    expect(p.orbit.periodMs).toBeGreaterThan(0);
    expect(p.orbit.radiusPct).toBeGreaterThan(0);
    parse(p.svg);
  });

  it("brightens the aura at night", () => {
    const day = spiritPresenceFor("suideng", false)!;
    const night = spiritPresenceFor("suideng", true)!;
    expect(night.auraOpacity).toBeGreaterThan(day.auraOpacity);
  });

  it("publishes the agreed root hook name", () => {
    expect(SPIRIT_ATTR).toBe("data-spirit");
  });
});
