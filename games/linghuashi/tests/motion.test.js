import { afterEach, describe, expect, it, vi } from "vitest";
import { createStore, defaultSave } from "../src/core/store.js";
import { motionToggle } from "../src/ui/components.js";
import { REDUCED_MOTION_ATTR, bindMotionSettings, motionReduced, prefersReducedMotion } from "../src/ui/motion-bridge.js";

function stubMedia(matches) {
  vi.stubGlobal("matchMedia", () => ({ matches, media: "(prefers-reduced-motion: reduce)", addEventListener() {}, removeEventListener() {} }));
}

let unbind = null;

afterEach(() => {
  unbind?.();
  unbind = null;
  document.documentElement.removeAttribute(REDUCED_MOTION_ATTR);
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

describe("减动效偏好", () => {
  it("存档设置与系统偏好任意一边为真都算减动效", () => {
    stubMedia(false);
    expect(prefersReducedMotion(defaultSave())).toBe(false);
    expect(prefersReducedMotion({ settings: { reducedMotion: true } })).toBe(true);

    stubMedia(true);
    expect(prefersReducedMotion(defaultSave())).toBe(true);
  });

  it("接线后把存档设置写到 <html>，解绑再清掉", () => {
    stubMedia(false);
    const store = createStore({ ...defaultSave(), settings: { mute: false, reducedMotion: true } });

    unbind = bindMotionSettings(store);
    expect(document.documentElement.getAttribute(REDUCED_MOTION_ATTR)).toBe("true");
    expect(motionReduced()).toBe(true);

    store.set({ settings: { mute: false, reducedMotion: false } });
    expect(document.documentElement.hasAttribute(REDUCED_MOTION_ATTR)).toBe(false);
    expect(motionReduced()).toBe(false);

    store.set({ settings: { mute: false, reducedMotion: true } });
    expect(document.documentElement.getAttribute(REDUCED_MOTION_ATTR)).toBe("true");

    unbind();
    unbind = null;
    expect(document.documentElement.hasAttribute(REDUCED_MOTION_ATTR)).toBe(false);
  });
});

describe("减动效开关", () => {
  it("按下即改存档、落盘并同步 <html>", () => {
    stubMedia(false);
    const store = createStore(defaultSave());
    const persist = vi.spyOn(store, "persist");
    unbind = bindMotionSettings(store);

    const toggle = motionToggle(store);
    document.body.appendChild(toggle);
    expect(toggle.getAttribute("aria-pressed")).toBe("false");

    toggle.click();

    expect(store.get().settings.reducedMotion).toBe(true);
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(persist).toHaveBeenCalled();
    expect(document.documentElement.getAttribute(REDUCED_MOTION_ATTR)).toBe("true");
    expect(motionReduced()).toBe(true);

    toggle.click();

    expect(store.get().settings.reducedMotion).toBe(false);
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(document.documentElement.hasAttribute(REDUCED_MOTION_ATTR)).toBe(false);
  });

  it("不动静音等其它设置", () => {
    stubMedia(false);
    const store = createStore({ ...defaultSave(), settings: { mute: true, reducedMotion: false } });

    motionToggle(store).click();

    expect(store.get().settings).toEqual({ mute: true, reducedMotion: true });
  });

  it("改动后回调调用方，便于就地重绘回放", () => {
    stubMedia(false);
    const store = createStore(defaultSave());
    const onChange = vi.fn();

    motionToggle(store, { onChange }).click();

    expect(onChange).toHaveBeenCalledWith(true);
  });
});
