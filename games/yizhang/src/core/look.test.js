// 视角喂入的回归测试（Round 1 遗留 4）。
// 钉两件事：pitch 真的会离开输入层；渲染器还没开 API 时链路整只 no-op、不抛。

import { describe, expect, it, vi } from "vitest";

import { feedLook, lookPayload } from "./look.js";
import { bindRenderer } from "./modules.js";
import { cameraYawToSimYaw } from "./view.js";

describe("lookPayload", () => {
  it("给渲染器的 yaw 是 sim 那套，相机方位角另开 cameraYaw（不新造第三套）", () => {
    const out = lookPayload({ yaw: 0.8, pitch: -0.4 });
    expect(out.simYaw).toBeCloseTo(cameraYawToSimYaw(0.8), 12);
    // 渲染器把 yaw 当 sim yaw 用（cameraRig 的机位角），所以这里必须已经换算过
    expect(out.yaw).toBe(out.simYaw);
    expect(out.cameraYaw).toBe(0.8);
    expect(out.pitch).toBe(-0.4);
  });

  it("缺字段 / 非有限数一律收成 0，不把 NaN 喂进渲染器", () => {
    expect(lookPayload(null)).toMatchObject({ cameraYaw: 0, pitch: 0 });
    expect(lookPayload({ yaw: Number.NaN, pitch: undefined })).toMatchObject({
      cameraYaw: 0,
      pitch: 0,
    });
    expect(Number.isFinite(lookPayload({}).yaw)).toBe(true);
    expect(Number.isFinite(lookPayload({}).simYaw)).toBe(true);
  });
});

describe("feedLook", () => {
  it("setLook 在场就喂整份视角（pitch 随之进渲染器）", () => {
    const renderer = { setLook: vi.fn() };
    const out = feedLook(renderer, { yaw: 0.25, pitch: 0.5 });
    expect(out.fed).toBe("setLook");
    expect(renderer.setLook).toHaveBeenCalledTimes(1);
    expect(renderer.setLook.mock.calls[0][0]).toMatchObject({
      yaw: cameraYawToSimYaw(0.25),
      simYaw: cameraYawToSimYaw(0.25),
      cameraYaw: 0.25,
      pitch: 0.5,
    });
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
    expect(calls[0]).toMatchObject({ yaw: cameraYawToSimYaw(0.1), cameraYaw: 0.1, pitch: 0.9 });
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
    expect(feedLook(bound, { yaw: 0, pitch: 0 }).fed).toBe("none");
  });
});
