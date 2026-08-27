// @vitest-environment jsdom
//
// 触控层的「视」切视角钮（LOOK-R4 · V 的触屏等价物）。
// 三条纪律在这里钉死：
//   1. 它不是战斗键 —— 不进 .yz-cluster 栅格、不走 setTouchButton（不给 sim 发动作），
//      按下直连 input.toggleLookMode()，与 V 键同一条路径、同一道 enabled 闸。
//   2. 一按只切一次 —— 按住不连发，抬起不再切（模式切换是边沿不是按住型）。
//   3. 反馈不撒谎 —— 音效跟「真的切了」走：输入禁用时闸吞掉这一下，钮就不响；
//      切换回执只有 HUD 的 .yz-look-flash 那一枚（onLookModeChange 链路），此钮不另加。

import { beforeEach, describe, expect, it } from "vitest";

import { createTouchLayer } from "./touch.js";

/** 只带触控层用得到的口子：toggleLookMode 的 enabled 闸行为照抄真输入层。 */
function mockInput() {
  const calls = { toggle: 0, touchButtons: [] };
  const api = {
    calls,
    enabled: true,
    mode: "locked",
    getLookMode: () => api.mode,
    toggleLookMode() {
      calls.toggle += 1;
      if (!api.enabled) return api.mode;
      api.mode = api.mode === "locked" ? "free" : "locked";
      return api.mode;
    },
    setStick() {},
    setTouchButton(name, down) {
      calls.touchButtons.push([name, down]);
    },
  };
  return api;
}

function mockAudio() {
  const played = [];
  return { played, play: (id) => played.push(id), unlock() {} };
}

function press(el) {
  el.dispatchEvent(new Event("pointerdown"));
}

function release(el) {
  el.dispatchEvent(new Event("pointerup"));
}

let input = null;
let audio = null;
let layer = null;

beforeEach(() => {
  document.body.innerHTML = "";
  input = mockInput();
  audio = mockAudio();
  layer = createTouchLayer({ input, audio });
  document.body.appendChild(layer.el);
});

describe("「视」钮的挂载位置", () => {
  it("是 .yz-touch 的直接子节点，不进 .yz-cluster 栅格", () => {
    const btn = layer.buttons.look;
    expect(btn.classList.contains("yz-tbtn--look")).toBe(true);
    expect(btn.parentElement).toBe(layer.el);
    expect(layer.el.querySelector(".yz-cluster .yz-tbtn--look")).toBeNull();
  });

  it("语义完整：button 元素 + aria-label「切换视角」（与键位表同词根）", () => {
    const btn = layer.buttons.look;
    expect(btn.tagName).toBe("BUTTON");
    expect(btn.getAttribute("aria-label")).toBe("切换视角");
    expect(btn.textContent).toBe("视");
  });
});

describe("「视」钮的行为", () => {
  it("按下直连 toggleLookMode，一按只切一次，抬起不再切", () => {
    const btn = layer.buttons.look;
    press(btn);
    expect(input.calls.toggle).toBe(1);
    expect(input.mode).toBe("free");
    expect(btn.classList.contains("is-pressed")).toBe(true);
    release(btn);
    expect(input.calls.toggle).toBe(1);
    expect(btn.classList.contains("is-pressed")).toBe(false);
    press(btn);
    release(btn);
    expect(input.calls.toggle).toBe(2);
    expect(input.mode).toBe("locked");
  });

  it("不给 sim 发动作：setTouchButton 一次都不挨", () => {
    press(layer.buttons.look);
    release(layer.buttons.look);
    expect(input.calls.touchButtons).toEqual([]);
  });

  it("音效跟「真的切了」走：正常切响一声，闸吞掉就不响", () => {
    press(layer.buttons.look);
    release(layer.buttons.look);
    expect(audio.played).toEqual(["uiMove"]);

    input.enabled = false;
    press(layer.buttons.look);
    release(layer.buttons.look);
    // 闸在输入层：toggle 被叫到了但没切，模式没变、也不响
    expect(input.calls.toggle).toBe(2);
    expect(input.mode).toBe("free");
    expect(audio.played).toEqual(["uiMove"]);
  });

  it("hub / arena 都在：切区不影响这枚钮，也不进强制松开名单", () => {
    press(layer.buttons.look);
    layer.setPhase("hub");
    // 切区只松战斗键；「视」钮没有按住态要清，pressed 视觉由自己的抬起收
    expect(layer.buttons.look.dataset.pressed).toBe("1");
    release(layer.buttons.look);
    press(layer.buttons.look);
    expect(input.calls.toggle).toBe(2);
    layer.setPhase("arena");
    release(layer.buttons.look);
    expect(input.calls.toggle).toBe(2);
  });
});
