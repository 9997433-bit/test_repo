import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { RENDER_YAW_OFFSET } from "../src/core/view.js";
import { COMBAT_VFX_KIND } from "../src/render/combat-vfx.js";
import { QUALITY } from "../src/render/config.js";
import * as simulation from "../src/sim/index.js";
import { createFourPlayerMatch } from "../scripts/harness.mjs";

const probeSource = readFileSync(
  new URL("../scripts/probe.mjs", import.meta.url),
  "utf8",
);

function frozenHexArray(source, name) {
  const declaration = source.match(
    new RegExp(
      `const\\s+${name}\\s*=\\s*Object\\.freeze\\s*\\(\\s*\\[([\\s\\S]*?)\\]\\s*\\)`,
    ),
  );

  expect(declaration, `${name} must remain a frozen source constant`).not.toBeNull();
  return declaration[1].match(/0x[0-9a-f]+/gi) ?? [];
}

describe("Round 3 probe contracts", () => {
  it("keeps exactly the three fixed default probe seeds", () => {
    expect(frozenHexArray(probeSource, "DEFAULT_PROBE_SEEDS")).toEqual([
      "0x1a2b3c4d",
      "0x5eed1234",
      "0xc0ffee42",
    ]);
  });

  it("takes MODEL_SLUG from the environment with a non-runner fallback", () => {
    const assignment = probeSource.match(
      /const\s+MODEL_SLUG\s*=\s*process\.env\.MODEL_SLUG\s*(?:\|\||\?\?)\s*(["'])([^"']+)\1\s*;/,
    );

    expect(assignment, "MODEL_SLUG must remain environment-overridable").not.toBeNull();
    expect(assignment[2]).toBe("yizhang-probe");
    expect(assignment[2]).not.toBe("gpt-5.6-sol-xhigh-fast");
  });

  it("keeps the four-player harness default in the arena", () => {
    const state = createFourPlayerMatch(simulation, { seed: 0x52334731 });

    expect(state.phase).toBe("arena");
    expect(simulation.getView(state).phase).toBe("arena");
  });

  it("makes the probe opt in to the hub phase explicitly", () => {
    const call = probeSource.match(
      /createFourPlayerMatch\s*\(\s*simulation\s*,\s*\{([\s\S]*?)\n\s*\}\s*\)/,
    );

    expect(call, "probe must construct its match through the harness").not.toBeNull();
    expect(
      [...call[1].matchAll(/\bphase\s*:\s*(["'])([^"']+)\1/g)].map(
        (match) => match[2],
      ),
    ).toEqual(["hub"]);
  });
});

describe("Round 3 product and render contracts", () => {
  it("keeps createMatch defaulting to the hub", () => {
    const state = simulation.createMatch({
      seed: 0x52334732,
      botCount: 0,
    });

    expect(state.phase).toBe("hub");
    expect(simulation.getView(state).phase).toBe("hub");
  });

  it("keeps render yaw unshifted and yaw zero facing negative Z", () => {
    expect(RENDER_YAW_OFFSET).toBe(0);
    expect(simulation.forwardX(0)).toBeCloseTo(0);
    expect(simulation.forwardZ(0)).toBe(-1);
  });

  it("maps all eight gloves to eight distinct combat VFX kinds", () => {
    const entries = Object.entries(COMBAT_VFX_KIND);

    expect(entries.map(([gloveId]) => gloveId)).toEqual([
      "cotton",
      "granite",
      "gale",
      "frost",
      "spring",
      "afterimage",
      "magnet",
      "meteor",
    ]);
    expect(entries.map(([, kind]) => kind)).toEqual([
      "fanwake",
      "slab",
      "gust",
      "rime",
      "recoil",
      "phase",
      "flux",
      "cinder",
    ]);
    expect(new Set(entries.map(([, kind]) => kind))).toHaveSize(8);
    expect(COMBAT_VFX_KIND.afterimage).not.toBe("mirror");
  });

  it("keeps bloom disabled for low quality", () => {
    expect(QUALITY.low.bloom).toBe(false);
  });
});
