// 视角喂入的回归测试（Round 1 遗留 4 + 视角轮 P0）。
// 钉四件事：payload 的水平角是 **sim 空间**（相机系角不再离开输入层）；
// lookMode 随帧透传且缺省 locked；渲染器没开 API 时链路整只 no-op、不抛；
// snap 信号存在才调、不存在不炸。

import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_LOOK_MODE,
  feedLook,
  lookPayload,
  normalizeLookMode,
  resolveLookMode,
  snapLook,
} from "./look.js";
import { bindRenderer } from "./modules.js";
import { cameraYawToSimYaw } from "./view.js";

describe("lookPayload", () => {
  it("水平角换算成 sim 空间：yaw 与 simYaw 是同一个值（渲染器读哪个都对）", () => {
    const out = lookPayload({ yaw: 0.8, pitch: -0.4 });
    const sim = cameraYawToSimYaw(0.8);
    expect(out.yaw).toBeCloseTo(sim, 12);
    expect(out.simYaw).toBeCloseTo(sim, 12);
    expect(out.yaw).toBe(out.simYaw);
    expect(out.pitch).toBe(-0.4);
  });

  it("相机系角不出输入层：payload 上没有第三套朝向字段", () => {
    const out = lookPayload({ yaw: 1.1, pitch: 0.2 });
    expect(Object.keys(out).sort()).toEqual(["lookMode", "pitch", "simYaw", "yaw"]);
  });

  it("lookMode 随帧透传，缺省 / 认不出的值收成 locked", () => {
    expect(lookPayload({ yaw: 0, pitch: 0, lookMode: "free" }).lookMode).toBe("free");
    expect(lookPayload({ yaw: 0, pitch: 0, lookMode: "locked" }).lookMode).toBe("locked");
    expect(lookPayload({ yaw: 0, pitch: 0 }).lookMode).toBe("locked");
    expect(lookPayload({ yaw: 0, pitch: 0, lookMode: "orbit" }).lookMode).toBe("locked");
    expect(lookPayload(null).lookMode).toBe("locked");
  });

  it("缺字段 / 非有限数一律收成有限数，不把 NaN 喂进渲染器", () => {
    const empty = lookPayload(null);
    expect(Number.isFinite(empty.yaw)).toBe(true);
    expect(empty.pitch).toBe(0);
    const bad = lookPayload({ yaw: Number.NaN, pitch: undefined });
    expect(Number.isFinite(bad.yaw)).toBe(true);
    expect(Number.isFinite(bad.simYaw)).toBe(true);
    expect(bad.pitch).toBe(0);
  });
});

describe("normalizeLookMode / resolveLookMode", () => {
  it("产品缺省是 locked（固定人物视角）", () => {
    expect(DEFAULT_LOOK_MODE).toBe("locked");
    expect(normalizeLookMode(undefined)).toBe("locked");
    expect(normalizeLookMode(null)).toBe("locked");
    expect(normalizeLookMode(42)).toBe("locked");
  });

  it("字符串宽松收敛：大小写与两端空白不挑食", () => {
    expect(normalizeLookMode(" FREE ")).toBe("free");
    expect(normalizeLookMode("Locked")).toBe("locked");
    expect(normalizeLookMode("orbit")).toBe("locked");
    expect(normalizeLookMode("orbit", "free")).toBe("free");
  });

  it("取值链：URL > 存档 > 缺省 locked", () => {
    expect(resolveLookMode({ url: "free", save: { lookMode: "locked" } })).toBe("free");
    expect(resolveLookMode({ url: "locked", save: { lookMode: "free" } })).toBe("locked");
    expect(resolveLookMode({ url: null, save: { lookMode: "free" } })).toBe("free");
    expect(resolveLookMode({ save: { lookMode: "free" } })).toBe("free");
    expect(resolveLookMode({})).toBe("locked");
    expect(resolveLookMode()).toBe("locked");
  });

  it("URL 填了认不出的值不算数：落到存档，不是直接落缺省", () => {
    expect(resolveLookMode({ url: "banana", save: { lookMode: "free" } })).toBe("free");
    expect(resolveLookMode({ url: "", save: { lookMode: "free" } })).toBe("free");
    expect(resolveLookMode({ url: "banana", save: null })).toBe("locked");
  });
});

describe("feedLook", () => {
  it("setLook 在场就喂整份视角：水平角已是 sim 空间，pitch / lookMode 随行", () => {
    const renderer = { setLook: vi.fn() };
    const out = feedLook(renderer, { yaw: 0.25, pitch: 0.5, lookMode: "free" });
    expect(out.fed).toBe("setLook");
    expect(renderer.setLook).toHaveBeenCalledTimes(1);
    const got = renderer.setLook.mock.calls[0][0];
    expect(got.yaw).toBeCloseTo(cameraYawToSimYaw(0.25), 12);
    expect(got.simYaw).toBe(got.yaw);
    expect(got.pitch).toBe(0.5);
    expect(got.lookMode).toBe("free");
  });

  it("只有 setPitch 的渲染器退而求其次，只喂俯仰", () => {
    const renderer = { setPitch: vi.fn() };
    expect(feedLook(renderer, { yaw: 1, pitch: -0.3 }).fed).toBe("setPitch");
    expect(renderer.setPitch).toHaveBeenCalledWith(-0.3);
  });

  it("setLook 优先于 setPitch，同一帧不喂两次", () => {
    const renderer = { setLook: vi.fn(), setPitch: vi.fn() };
    feedLook(renderer, { yaw: 0, pitch: 0.2 });
    expect(renderer.setLook).toHaveBeenCalledTimes(1);
    expect(renderer.setPitch).not.toHaveBeenCalled();
  });

  it("O2 还没开 API（两个方法都没有）：整只 no-op，不抛也不假装喂进去了", () => {
    expect(feedLook({ sync() {} }, { yaw: 1, pitch: 1 }).fed).toBe("none");
    expect(feedLook(null, { yaw: 1, pitch: 1 }).fed).toBe("none");
    // bindRenderer 给的是 null 而不是函数，也算没有
    expect(feedLook({ setLook: null, setPitch: null }, { yaw: 1, pitch: 1 }).fed).toBe("none");
  });

  it("渲染器自己抛错不带走主循环", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const renderer = {
      setLook() {
        throw new Error("boom");
      },
    };
    expect(() => feedLook(renderer, { yaw: 0, pitch: 0 })).not.toThrow();
    expect(feedLook(renderer, { yaw: 0, pitch: 0 }).fed).toBe("error");
    warn.mockRestore();
  });
});

describe("snapLook（过门机位吸附信号）", () => {
  it("渲染器开了 snapCamera 就调一下（过门不看 120m 飞跃）", () => {
    const renderer = { snapCamera: vi.fn() };
    expect(snapLook(renderer).snapped).toBe("snapCamera");
    expect(renderer.snapCamera).toHaveBeenCalledTimes(1);
  });

  it("没有 snapCamera 时认 resetCamera / snap，按序探测", () => {
    const reset = { resetCamera: vi.fn() };
    expect(snapLook(reset).snapped).toBe("resetCamera");
    expect(reset.resetCamera).toHaveBeenCalledTimes(1);
    const bare = { snap: vi.fn() };
    expect(snapLook(bare).snapped).toBe("snap");
    // snapCamera 优先：三个都开时只调第一个
    const all = { snapCamera: vi.fn(), resetCamera: vi.fn(), snap: vi.fn() };
    snapLook(all);
    expect(all.snapCamera).toHaveBeenCalledTimes(1);
    expect(all.resetCamera).not.toHaveBeenCalled();
    expect(all.snap).not.toHaveBeenCalled();
  });

  it("渲染器没开口 / 给的是 null：整只 no-op，不抛（bindRenderer 的 null 也算没有）", () => {
    expect(snapLook({ sync() {} }).snapped).toBe("none");
    expect(snapLook(null).snapped).toBe("none");
    expect(snapLook({ snapCamera: null, resetCamera: null }).snapped).toBe("none");
  });

  it("snap 口抛错不带走主循环", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(
      snapLook({
        snapCamera() {
          throw new Error("boom");
        },
      }).snapped
    ).toBe("error");
    warn.mockRestore();
  });
});

describe("bindRenderer 的视角口", () => {
  it("实例上有 setLook / setPitch 就绑上去，喂入立刻生效", () => {
    const calls = [];
    const instance = {
      sync() {},
      setLook(look) {
        calls.push(look);
      },
      setPitch(p) {
        calls.push(p);
      },
    };
    const bound = bindRenderer({}, instance);
    expect(typeof bound.setLook).toBe("function");
    expect(typeof bound.setPitch).toBe("function");
    expect(feedLook(bound, { yaw: 0.1, pitch: 0.9 }).fed).toBe("setLook");
    expect(calls[0].yaw).toBeCloseTo(cameraYawToSimYaw(0.1), 12);
    expect(calls[0].pitch).toBe(0.9);
  });

  it("实例上有 snapCamera / resetCamera 也绑上去，snap 信号一路通", () => {
    const instance = { sync() {}, snapCamera: vi.fn() };
    const bound = bindRenderer({}, instance);
    expect(typeof bound.snapCamera).toBe("function");
    expect(snapLook(bound).snapped).toBe("snapCamera");
    expect(instance.snapCamera).toHaveBeenCalledTimes(1);
  });

  it("模块级导出同样接得住（契约允许两种姿势）", () => {
    const mod = { setPitch: vi.fn() };
    const bound = bindRenderer(mod, { sync() {} });
    expect(feedLook(bound, { yaw: 0, pitch: 0.6 }).fed).toBe("setPitch");
    expect(mod.setPitch).toHaveBeenCalledWith(0.6);
  });

  it("渲染器没导出这两个方法时 pick 给 null，不是 undefined 也不是抛错", () => {
    const bound = bindRenderer({}, { sync() {} });
    expect(bound.setLook).toBeNull();
    expect(bound.setPitch).toBeNull();
    expect(bound.snapCamera).toBeNull();
    expect(bound.resetCamera).toBeNull();
    expect(feedLook(bound, { yaw: 0, pitch: 0 }).fed).toBe("none");
    expect(snapLook(bound).snapped).toBe("none");
  });
});
