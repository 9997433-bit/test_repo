// @vitest-environment jsdom
//
// 把收敛后的三个出口串成 main.js 的那一圈：
//   input.read() -> sim.step() -> sim.getView() -> syncHud(view, extras)
// 这里用真的 `src/sim`，所以它同时也是「HUD 说的和模拟层算的是同一件事」的证据。

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMatch, getView, step } from "../sim/index.js";
import { createInput } from "../input/index.js";
import { mountHud, syncHud } from "./index.js";

const BACKEND = "webgl2";

let match;
let input;
let hud;
let canvas;
let picked;

function pointer(type, x, y) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 });
  Object.defineProperty(event, "offsetX", { value: x });
  Object.defineProperty(event, "offsetY", { value: y });
  event.pointerId = 1;
  return event;
}

function tapSocket(index) {
  picked = index;
  canvas.dispatchEvent(pointer("pointerdown", 20, 20));
  canvas.dispatchEvent(pointer("pointerup", 20, 20));
}

function pressKey(code, keyName) {
  window.dispatchEvent(new KeyboardEvent("keydown", { code, key: keyName, bubbles: true, cancelable: true }));
}

/** main.js 的一帧：读输入 → 推进模拟 → 覆写 backend → 刷 HUD。 */
function frame(dt = 1 / 60) {
  step(match, input.read(), dt);
  const view = getView(match);
  view.backend = BACKEND;
  syncHud(view, { backend: BACKEND, quality: "high" });
  return view;
}

function runUntil(predicate, { dt = 0.1, cap = 4000 } = {}) {
  for (let i = 0; i < cap; i += 1) {
    const view = frame(dt);
    if (predicate(view)) return view;
  }
  return null;
}

beforeEach(() => {
  document.body.innerHTML = '<canvas id="sh-canvas"></canvas><div class="sh-hud" id="sh-hud"></div>';
  canvas = document.getElementById("sh-canvas");
  picked = null;
  match = createMatch(0x5eed);
  input = createInput({
    canvas,
    scene: {},
    pickSocket: () => picked,
    getView: () => getView(match),
  });
  hud = mountHud(document.getElementById("sh-hud"));
});

afterEach(() => {
  input.dispose();
  hud.destroy();
  document.body.innerHTML = "";
});

describe("input → sim → hud", () => {
  it("builds the tower the dock armed, on the socket the pointer picked", () => {
    const before = getView(match).scrap;
    document.querySelector('[data-tower="scatter"]').click();
    tapSocket(9);
    const view = frame();

    expect(view.sockets[9].towerId).toBe("scatter");
    expect(view.scrap).toBeLessThan(before);
    expect(document.querySelector(".sh-scrap").textContent).toBe(`屑晶 ${view.scrap}`);
    expect(document.querySelector('[data-tower="scatter"]').getAttribute("data-count")).toBe("1");
  });

  it("only selects a socket that is already built, so no doomed order is sent", () => {
    tapSocket(4);
    expect(frame().sockets[4].towerId).toBe("rail");

    tapSocket(4);
    const view = frame();
    expect(view.selectedSocket).toBe(4);
    expect(document.querySelector(".sh-overclock").getAttribute("data-state")).toBe("ready");
    expect(document.querySelector(".sh-toast").textContent).toBe("");
  });

  it("keeps the sim frozen for as long as pause is held down", () => {
    runUntil(() => false, { dt: 0.1, cap: 20 });
    pressKey("Space", " ");
    const paused = frame(0.1);
    expect(paused.paused).toBe(true);
    expect(document.querySelector(".sh-hud").getAttribute("data-paused")).toBe("1");

    // 回归：pause 是绝对置位。沿边只发一帧的话，下面这 60 帧会把时间照常推走。
    const time = paused.time;
    for (let i = 0; i < 60; i += 1) frame(0.1);
    const stillPaused = getView(match);
    expect(stillPaused.time).toBe(time);
    expect(stillPaused.paused).toBe(true);

    pressKey("Space", " ");
    frame(0.1);
    frame(0.1);
    expect(getView(match).time).toBeGreaterThan(time);
    expect(document.querySelector(".sh-hud").hasAttribute("data-paused")).toBe(false);
  });

  it("overclocks the selected tower and shows the countdown, then the cooldown", () => {
    tapSocket(2);
    frame();
    pressKey("KeyF", "f");
    const view = frame();
    expect(view.sockets[2].overclockT).toBeGreaterThan(0);
    expect(document.querySelector(".sh-overclock").classList.contains("is-active")).toBe(true);

    const cooling = runUntil((v) => v.sockets[2].overheatT > 0, { dt: 0.1, cap: 200 });
    expect(cooling).not.toBeNull();
    expect(document.querySelector(".sh-overclock").classList.contains("is-cooldown")).toBe(true);
    expect(document.querySelector(".sh-toast").textContent).toContain("过热");
  });

  it("surfaces the sim's deny reason as a toast", () => {
    // 先解除武装，点插座就只是选中；6 号仍然是空的，过载它必被拒。
    pressKey("Escape", "Escape");
    tapSocket(6);
    expect(frame().sockets[6].towerId).toBeNull();
    pressKey("KeyF", "f");
    frame();
    expect(document.querySelector(".sh-toast").textContent).toBe("空插座 · 先造一座塔");
    expect(document.querySelector(".sh-toast").classList.contains("is-error")).toBe(true);
  });

  it("announces the wave, the leak and finally the loss with no towers built", () => {
    const wave = runUntil((v) => v.wave >= 1);
    expect(wave).not.toBeNull();
    expect(document.querySelector(".sh-wave").textContent).toContain("波次 1/");

    const before = getView(match).coreHp;
    const leaked = runUntil((v) => v.coreHp < before);
    expect(leaked).not.toBeNull();
    expect(document.querySelector(".sh-toast").textContent).toContain("漏敌 · 星核 -");
    expect(document.querySelector(".sh-core").textContent).toBe(`星核 ${leaked.coreHp}/${leaked.coreMax}`);

    const lost = runUntil((v) => v.over, { dt: 0.1, cap: 20000 });
    expect(lost).not.toBeNull();
    expect(lost.result).toBe("lose");
    expect(document.querySelector(".sh-hud").getAttribute("data-result")).toBe("lose");
    expect(document.querySelector(".sh-toast").textContent).toContain("星核崩解");
    expect(document.querySelector(".sh-core").textContent).toBe("星核 0/20");
    expect(document.querySelector(".sh-core").classList.contains("is-danger")).toBe(true);
  });

  it("keeps the backend label main.js wrote and only adds the style hook", () => {
    document.body.innerHTML = '<canvas id="sh-canvas"></canvas><div class="sh-hud" id="sh-hud"><div class="sh-backend">WebGL2 · high</div></div>';
    hud.destroy();
    hud = mountHud(document.getElementById("sh-hud"));
    frame();
    expect(document.querySelector(".sh-backend").textContent).toBe("WebGL2 · high");
    expect(document.querySelector(".sh-backend").classList.contains("is-webgl2")).toBe(true);
  });
});
