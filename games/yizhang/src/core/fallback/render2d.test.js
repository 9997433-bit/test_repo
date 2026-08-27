// 2D 兜底渲染的视角口（视角轮）。钉三件事：
// 兜底渲染同样「认」lookMode（收下、透出，切换在降级画面上不是坏的）；
// feedLook 对它走的是与 three 渲染器同一条 setLook 链路（yaw 已是 sim 空间）；
// snapCamera 在场 —— 过门吸附信号在兜底画面上也有人接。

import { describe, expect, it } from "vitest";

import { feedLook, lookPayload, snapLook } from "../look.js";
import { createRenderer } from "./render2d.js";

/** 这些测试只碰视角口，不调 sync：构造期够用的最小画布替身。 */
function fakeCanvas() {
  return {
    clientWidth: 320,
    clientHeight: 180,
    style: {},
    getContext: () => ({}),
  };
}

function make() {
  return createRenderer(fakeCanvas(), { followId: "p0" });
}

describe("render2d 的 setLook / getLook", () => {
  it("吃 feedLook 的 payload：pitch / simYaw / lookMode 全收下并可回读", () => {
    const r = make();
    const payload = lookPayload({ yaw: 0.8, pitch: -0.25, lookMode: "free" });
    r.setLook(payload);
    const look = r.getLook();
    expect(look.pitch).toBe(-0.25);
    expect(look.simYaw).toBeCloseTo(payload.simYaw, 12);
    expect(look.lookMode).toBe("free");
  });

  it("缺省 locked；认不出的 lookMode 不动既有值", () => {
    const r = make();
    expect(r.getLook().lookMode).toBe("locked");
    r.setLook({ lookMode: "free" });
    r.setLook({ lookMode: "orbit" });
    expect(r.getLook().lookMode).toBe("free");
  });

  it("simYaw 优先于 yaw；单值写法（数字 = pitch）也认", () => {
    const r = make();
    r.setLook({ yaw: 1.0, simYaw: 2.0 });
    expect(r.getLook().simYaw).toBe(2.0);
    r.setLook({ yaw: 0.5 });
    expect(r.getLook().simYaw).toBe(0.5);
    r.setLook(0.4);
    expect(r.getLook().pitch).toBe(0.4);
  });

  it("feedLook 对兜底渲染走的也是 setLook 链路，不再整只 no-op", () => {
    const r = make();
    const out = feedLook(r, { yaw: 0.3, pitch: 0.1, lookMode: "locked" });
    expect(out.fed).toBe("setLook");
    expect(r.getLook().simYaw).toBeCloseTo(out.payload.simYaw, 12);
    expect(r.getLook().lookMode).toBe("locked");
  });
});

describe("render2d 的机位吸附口", () => {
  it("snapCamera 在场：snapLook 能命中，过门信号在兜底画面上也有人接", () => {
    const r = make();
    expect(typeof r.snapCamera).toBe("function");
    expect(snapLook(r).snapped).toBe("snapCamera");
  });
});
