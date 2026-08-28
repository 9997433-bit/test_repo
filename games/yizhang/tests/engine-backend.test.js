import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { COMBAT_VFX_KIND } from "../src/render/combat-vfx.js";
import { QUALITY } from "../src/render/config.js";
import { RENDER_YAW_OFFSET } from "../src/core/view.js";
import { HIT_STOP } from "../src/core/juice.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function walkJs(dir, acc = []) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    if (name.name === "node_modules" || name.name === "dist") continue;
    const p = join(dir, name.name);
    if (name.isDirectory()) walkJs(p, acc);
    else if (name.name.endsWith(".js") && !name.name.endsWith(".test.js")) acc.push(p);
  }
  return acc;
}

describe("Babylon.js 8 引擎后端", () => {
  it("运行时依赖是 @babylonjs/core 8.x，且没有 three", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
    expect(pkg.dependencies["@babylonjs/core"]).toMatch(/^8\./);
    expect(pkg.dependencies.three).toBeUndefined();
    expect(pkg.devDependencies?.three).toBeUndefined();
  });

  it("可玩路径源码不再 import three 包", () => {
    const files = walkJs(join(ROOT, "src"));
    expect(files.length).toBeGreaterThan(20);
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      expect(src, f).not.toMatch(/from\s+["']three["']/);
      expect(src, f).not.toMatch(/require\(["']three["']\)/);
    }
  });

  it("sim / combat / data / ai 不 import @babylonjs", () => {
    for (const layer of ["sim", "combat", "data", "ai"]) {
      for (const f of walkJs(join(ROOT, "src", layer))) {
        const src = readFileSync(f, "utf8");
        expect(src, f).not.toMatch(/@babylonjs/);
      }
    }
  });

  it("冻结项抽查：朝向偏移、低画质 bloom、hit-stop、12 掌 VFX", () => {
    expect(RENDER_YAW_OFFSET).toBe(0);
    expect(QUALITY.low.bloom).toBe(false);
    expect(HIT_STOP.max).toBe(0.12);
    expect(HIT_STOP.heavyPower).toBe(12);
    const kinds = Object.keys(COMBAT_VFX_KIND).sort();
    expect(kinds).toEqual(
      [
        "afterimage",
        "cocoon",
        "cotton",
        "frost",
        "gale",
        "granite",
        "magnet",
        "meteor",
        "raven",
        "spring",
        "tumbler",
        "victor",
      ].sort(),
    );
  });
});
