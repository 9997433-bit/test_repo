// Opus-1 · 辉光层归属测试。
// createRenderer 需要真 WebGL 上下文，node 里跑不动；辉光的建 / 拆 / 去重逻辑
// 单独放在 ./glow.js，这里用 NullEngine 直接验，浏览器验收另走 :4182 真机。

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import { Scene } from "@babylonjs/core/scene.js";
import { GlowLayer } from "@babylonjs/core/Layers/glowLayer.js";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder.js";

import { GLOW_LAYER_NAME, GLOW_TIERS, createGlowController, glowSpecFor } from "./glow.js";

let engine;
let scene;

function glowLayers() {
  return (scene.effectLayers ?? []).filter((layer) => layer instanceof GlowLayer);
}

beforeEach(() => {
  engine = new NullEngine();
  scene = new Scene(engine);
});

afterEach(() => {
  scene.dispose();
  engine.dispose();
  vi.restoreAllMocks();
});

describe("画质档 → 辉光参数", () => {
  it("high / mid 有辉光，low 全关", () => {
    expect(glowSpecFor("high").enabled).toBe(true);
    expect(glowSpecFor("mid").enabled).toBe(true);
    expect(glowSpecFor("low").enabled).toBe(false);
  });

  it("high 比 mid 更亮、更大核", () => {
    expect(GLOW_TIERS.high.intensity).toBeGreaterThan(GLOW_TIERS.mid.intensity);
    expect(GLOW_TIERS.high.blurKernelSize).toBeGreaterThan(GLOW_TIERS.mid.blurKernelSize);
    expect(GLOW_TIERS.high.textureSize).toBeGreaterThan(GLOW_TIERS.mid.textureSize);
  });

  it("未知档位落回 mid，不抛错", () => {
    for (const bogus of [undefined, null, "ultra", 3]) {
      expect(glowSpecFor(bogus)).toBe(GLOW_TIERS.mid);
    }
  });
});

describe("引擎持有唯一辉光层", () => {
  it("三档轮换后场景里最多只有引擎那一层", () => {
    const glow = createGlowController(scene);

    glow.apply(glowSpecFor("high"));
    expect(glowLayers().map((layer) => layer.name)).toEqual([GLOW_LAYER_NAME]);
    expect(glow.layer.intensity).toBeCloseTo(GLOW_TIERS.high.intensity, 6);

    glow.apply(glowSpecFor("mid"));
    expect(glowLayers()).toHaveLength(1);
    expect(glow.layer.intensity).toBeCloseTo(GLOW_TIERS.mid.intensity, 6);

    glow.apply(glowSpecFor("low"));
    expect(glowLayers()).toHaveLength(0);
    expect(glow.layer).toBeNull();

    glow.apply(glowSpecFor("high"));
    expect(glowLayers()).toHaveLength(1);
    expect(glow.layer.intensity).toBeCloseTo(GLOW_TIERS.high.intensity, 6);
  });

  it("换档不会把层数越堆越多", () => {
    const glow = createGlowController(scene);
    for (const tier of ["high", "mid", "low", "mid", "high", "high"]) {
      glow.apply(glowSpecFor(tier));
    }
    expect(glowLayers().length).toBeLessThanOrEqual(1);
  });

  it("dispose 之后场景里不留辉光层", () => {
    const glow = createGlowController(scene);
    glow.apply(glowSpecFor("high"));
    glow.dispose();
    expect(glowLayers()).toHaveLength(0);
    expect(glow.layer).toBeNull();
  });
});

describe("摘除别处建出来的辉光层", () => {
  it("world 自带的一层会被 reconcile 摘掉，引擎那层留下", () => {
    const glow = createGlowController(scene);
    glow.apply(glowSpecFor("high"));
    const engineLayer = glow.layer;

    // 世界层的老写法：buildWorld 默认 glow:true 时会多建这么一层。
    const foreign = new GlowLayer("world-glow", scene, { mainTextureFixedSize: 512, blurKernelSize: 56 });
    expect(glowLayers()).toHaveLength(2);

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(glow.reconcile()).toBe(1);
    expect(warn).toHaveBeenCalledTimes(1);

    expect(glowLayers()).toEqual([engineLayer]);
    expect(glow.layer).toBe(engineLayer);
    // 世界层随后自己再 dispose 一次也不能抛（disposeWorld 会做这件事）。
    expect(() => foreign.dispose()).not.toThrow();
    expect(glowLayers()).toEqual([engineLayer]);
  });

  it("换档时顺手摘：low 档不给任何一层留活口", () => {
    const glow = createGlowController(scene);
    vi.spyOn(console, "warn").mockImplementation(() => {});

    glow.apply(glowSpecFor("high"));
    new GlowLayer("world-glow", scene);
    glow.apply(glowSpecFor("low"));

    expect(glowLayers()).toHaveLength(0);
  });

  it("没有多余层时 reconcile 不动手也不刷屏", () => {
    const glow = createGlowController(scene);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    glow.apply(glowSpecFor("mid"));
    expect(glow.reconcile()).toBe(0);
    expect(glowLayers()).toHaveLength(1);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("排除网格", () => {
  it("登记过的网格换档后依然被排除", () => {
    const glow = createGlowController(scene);
    const dome = CreateBox("sky-dome", { size: 2 }, scene);
    const turret = CreateBox("turret", { size: 1 }, scene);

    glow.apply(glowSpecFor("high"));
    glow.exclude([dome]);
    expect(glow.layer.hasMesh(dome)).toBe(false);
    expect(glow.layer.hasMesh(turret)).toBe(true);

    glow.apply(glowSpecFor("mid"));
    expect(glow.layer.hasMesh(dome)).toBe(false);
    expect(glow.layer.hasMesh(turret)).toBe(true);
  });

  it("辉光层还没建时登记，建好后自动补上", () => {
    const glow = createGlowController(scene);
    const dome = CreateBox("sky-dome", { size: 2 }, scene);

    glow.apply(glowSpecFor("low"));
    glow.exclude(dome);
    expect(glow.layer).toBeNull();

    glow.apply(glowSpecFor("high"));
    expect(glow.layer.hasMesh(dome)).toBe(false);
  });

  it("空值与已销毁的网格都不会留在名单里", () => {
    const glow = createGlowController(scene);
    const dome = CreateBox("sky-dome", { size: 2 }, scene);

    glow.exclude(null);
    glow.exclude([undefined, false, dome]);
    expect(glow.excludedCount).toBe(1);

    dome.dispose();
    glow.apply(glowSpecFor("high"));
    expect(glow.excludedCount).toBe(0);
  });
});
