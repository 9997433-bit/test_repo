// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INPUT_EVENT, UI_EVENT, getHud, mountHud, syncHud } from "./index.js";

const FROZEN = [".sh-hud", ".sh-core", ".sh-scrap", ".sh-wave", ".sh-dock", ".sh-toast", ".sh-backend", ".sh-overclock"];

/** index.html 的 HUD 骨架（冻结 class + id），mountHud 必须原地接管而不是另起一套。 */
function skeleton() {
  document.body.innerHTML = `
    <canvas id="sh-canvas"></canvas>
    <div class="sh-hud" id="sh-hud">
      <div class="sh-core" id="sh-core">星核 —</div>
      <div class="sh-scrap" id="sh-scrap">屑晶 —</div>
      <div class="sh-wave" id="sh-wave">波次 —</div>
      <div class="sh-backend" id="sh-backend">boot</div>
      <div class="sh-toast" id="sh-toast" role="status" aria-live="polite"></div>
      <div class="sh-dock" id="sh-dock" role="group">
        <button type="button" data-tower="rail"><span class="sh-dock-name"></span><span class="sh-dock-cost"></span><span class="sh-dock-key"></span></button>
        <button type="button" data-tower="prism"><span class="sh-dock-name"></span><span class="sh-dock-cost"></span><span class="sh-dock-key"></span></button>
        <button type="button" data-tower="scatter"><span class="sh-dock-name"></span><span class="sh-dock-cost"></span><span class="sh-dock-key"></span></button>
        <button type="button" data-tower="well"><span class="sh-dock-name"></span><span class="sh-dock-cost"></span><span class="sh-dock-key"></span></button>
        <button type="button" data-tower="star"><span class="sh-dock-name"></span><span class="sh-dock-cost"></span><span class="sh-dock-key"></span></button>
        <button type="button" class="sh-pause" data-sh-action="pause">暂停 Space</button>
        <button type="button" class="sh-quality" data-sh-action="quality">画质 高</button>
      </div>
      <button type="button" class="sh-overclock" id="sh-overclock" data-sh-action="overclock">过载 F</button>
    </div>`;
  return document.getElementById("sh-hud");
}

function view(extra = {}) {
  return {
    backend: "sim",
    wave: 3,
    waveCount: 20,
    scrap: 120,
    coreHp: 18,
    coreMax: 20,
    paused: false,
    selectedSocket: null,
    sockets: Array.from({ length: 24 }, (_, i) => ({
      i,
      towerId: null,
      overclockT: 0,
      overheatT: 0,
      hp: 0,
    })),
    enemies: [],
    shots: [],
    events: [],
    ...extra,
  };
}

const toastEl = () => document.querySelector(".sh-toast");
const hudEl = () => document.querySelector(".sh-hud");

let hud;

beforeEach(() => {
  hud = mountHud(skeleton());
});

afterEach(() => {
  hud?.destroy();
  document.body.innerHTML = "";
  delete window.__SHIHE__;
});

describe("mountHud(el)", () => {
  it("takes over the frozen skeleton in place and stays idempotent", () => {
    for (const selector of FROZEN) expect(document.querySelectorAll(selector)).toHaveLength(1);
    expect(hudEl().getAttribute("data-mounted")).toBe("1");
    expect(mountHud(document.getElementById("sh-hud"))).toBe(hud);
    expect(getHud()).toBe(hud);
    expect(document.querySelectorAll(".sh-dock button[data-tower]")).toHaveLength(5);
  });

  it("builds the whole frozen skeleton inside a bare host", () => {
    hud.destroy();
    document.body.innerHTML = '<div id="bare"></div>';
    hud = mountHud(document.getElementById("bare"));
    for (const selector of FROZEN) expect(document.querySelectorAll(selector)).toHaveLength(1);
    expect([...document.querySelectorAll(".sh-dock button[data-tower]")].map((b) => b.dataset.tower)).toEqual([
      "rail",
      "prism",
      "scatter",
      "well",
      "star",
    ]);
  });

  it("labels the dock from the data tables", () => {
    syncHud(view());
    const rail = document.querySelector('[data-tower="rail"]');
    expect(rail.querySelector(".sh-dock-name").textContent).not.toBe("");
    expect(rail.querySelector(".sh-dock-key").textContent).toBe("1");
    expect(rail.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("syncHud(view, extras)", () => {
  it("is null safe before the sim exists", () => {
    expect(() => syncHud(null)).not.toThrow();
    expect(() => syncHud(undefined, undefined)).not.toThrow();
    expect(() => syncHud({}, {})).not.toThrow();
    expect(document.querySelector(".sh-core").textContent).toBe("星核 —");
  });

  it("paints core / scrap / wave and the danger hook", () => {
    syncHud(view({ enemies: [{ id: 1 }, { id: 2 }] }));
    expect(document.querySelector(".sh-core").textContent).toBe("星核 18/20");
    expect(document.querySelector(".sh-scrap").textContent).toBe("屑晶 120");
    expect(document.querySelector(".sh-wave").textContent).toBe("波次 3/20 · 剩 2");
    expect(hudEl().style.getPropertyValue("--sh-core-frac")).toBe("0.900");
    expect(document.querySelector(".sh-core").classList.contains("is-danger")).toBe(false);

    syncHud(view({ coreHp: 4 }));
    expect(document.querySelector(".sh-core").classList.contains("is-danger")).toBe(true);
    expect(document.querySelector(".sh-core").getAttribute("data-low")).toBe("1");
  });

  it("reads backend and quality out of extras", () => {
    syncHud(view(), { backend: "webgpu", quality: "mid" });
    const backend = document.querySelector(".sh-backend");
    expect(backend.getAttribute("data-backend")).toBe("webgpu");
    expect(backend.classList.contains("is-webgpu")).toBe(true);
    expect(hudEl().getAttribute("data-quality")).toBe("mid");
    expect(document.querySelector(".sh-quality").textContent).toBe("画质 中");
  });

  it("leaves .sh-backend text to main.js once main has written it", () => {
    // index.html 的占位是 'boot'，但 main.js 在 mountHud 之前就写了自己的标签。
    hud.destroy();
    const root = skeleton();
    document.getElementById("sh-backend").textContent = "WebGL2 · mid";
    hud = mountHud(root);
    syncHud(view(), { backend: "webgl2" });
    expect(document.querySelector(".sh-backend").textContent).toBe("WebGL2 · mid");
    expect(document.querySelector(".sh-backend").classList.contains("is-webgl2")).toBe(true);
  });

  it("mirrors paused straight from the view", () => {
    syncHud(view({ paused: true }));
    expect(hudEl().getAttribute("data-paused")).toBe("1");
    expect(document.querySelector(".sh-pause").textContent).toBe("继续 Space");
    syncHud(view({ paused: false }));
    expect(hudEl().hasAttribute("data-paused")).toBe(false);
  });

  it("disables towers that are out of reach and counts the built ones", () => {
    const sockets = view().sockets;
    sockets[0].towerId = "rail";
    sockets[5].towerId = "rail";
    syncHud(view({ sockets, scrap: 0 }));
    const rail = document.querySelector('[data-tower="rail"]');
    expect(rail.getAttribute("data-count")).toBe("2");
    expect(rail.disabled).toBe(true);
    expect(rail.getAttribute("data-affordable")).toBe("0");
  });

  it("tracks the selected socket through the overclock button", () => {
    const sockets = view().sockets;
    sockets[7].towerId = "prism";
    syncHud(view({ sockets, selectedSocket: 7 }));
    const button = document.querySelector(".sh-overclock");
    expect(button.getAttribute("data-state")).toBe("ready");
    expect(button.textContent).toBe("过载 F · 插座 7");
    expect(button.disabled).toBe(false);

    sockets[7].overclockT = 3.5;
    syncHud(view({ sockets, selectedSocket: 7 }));
    expect(button.classList.contains("is-active")).toBe(true);
    expect(button.getAttribute("data-state")).toBe("active");

    sockets[7].overclockT = 0;
    sockets[7].overheatT = 2.5;
    syncHud(view({ sockets, selectedSocket: 7 }));
    expect(button.classList.contains("is-cooldown")).toBe(true);
    expect(button.getAttribute("data-state")).toBe("cooling");
  });
});

describe("toasts", () => {
  it("shows a reason for every deny code the sim can emit", () => {
    const cases = [
      ["scrap", "屑晶不足"],
      ["noScrap", "屑晶不足"],
      ["occupied", "插座已被占用"],
      ["empty", "空插座 · 先造一座塔"],
      ["overheat", "停火冷却中"],
      ["busy", "已经在过载了"],
      ["badSocket", "插座号无效"],
      ["unknownTower", "没有这种塔"],
      ["over", "对局已结束"],
    ];
    for (const [reason, text] of cases) {
      syncHud(view({ events: [{ type: "deny", reason, socket: 1 }] }));
      // 相同文案连着弹会被折叠成「… ×n」，所以这里只断言文案主体。
      expect(toastEl().textContent, reason).toContain(text);
      expect(toastEl().getAttribute("data-kind")).toBe("warn");
      expect(toastEl().classList.contains("is-error")).toBe(true);
    }
  });

  it("shows a leak toast carrying the core damage", () => {
    syncHud(view({ coreHp: 17, events: [{ type: "leak", id: 3, kind: "mite", damage: 3, coreHp: 17 }] }));
    expect(toastEl().textContent).toBe("漏敌 · 星核 -3");
    expect(toastEl().getAttribute("data-kind")).toBe("bad");
  });

  it("marks the win and keeps the banner up", () => {
    syncHud(view({ events: [{ type: "win", wave: 20, coreHp: 12 }] }));
    expect(hudEl().getAttribute("data-result")).toBe("win");
    expect(toastEl().textContent).toContain("蚀主伏诛");
    expect(toastEl().getAttribute("data-kind")).toBe("good");
    // 长驻：再刷一帧不会被 TTL 收走
    syncHud(view());
    expect(toastEl().textContent).toContain("蚀主伏诛");
  });

  it("marks the loss", () => {
    syncHud(view({ coreHp: 0, events: [{ type: "lose", wave: 6 }] }));
    expect(hudEl().getAttribute("data-result")).toBe("lose");
    expect(toastEl().textContent).toBe("星核崩解 · 第 6 波失守");
    expect(toastEl().classList.contains("is-error")).toBe(true);
  });

  it("never replays an event it has already shown", () => {
    const events = [{ type: "leak", id: 1, kind: "mite", damage: 1, coreHp: 19 }];
    const frame = view({ events });
    syncHud(frame);
    expect(toastEl().textContent).toBe("漏敌 · 星核 -1");
    syncHud(frame);
    syncHud(frame);
    expect(toastEl().textContent).toBe("漏敌 · 星核 -1");
  });

  it("collapses a burst of identical leaks into a counter", () => {
    syncHud(view({ events: [{ type: "leak", damage: 1 }] }));
    syncHud(view({ events: [{ type: "leak", damage: 1 }] }));
    expect(toastEl().textContent).toBe("漏敌 · 星核 -1 ×2");
  });

  it("relays an explicit toast from extras once", () => {
    syncHud(view(), { toast: { text: "world 模块未就绪", kind: "warn" } });
    expect(toastEl().textContent).toBe("world 模块未就绪");
    syncHud(view(), { toast: null });
    expect(toastEl().textContent).toBe("");
    expect(toastEl().hasAttribute("data-show")).toBe(false);
  });

  it("ignores unknown event types", () => {
    expect(() => syncHud(view({ events: [{ type: "somethingNew", x: 1 }, null, 7] }))).not.toThrow();
    expect(toastEl().textContent).toBe("");
  });
});

describe("dock interaction", () => {
  it("emits sh-ui when arming and disarming a tower", () => {
    const seen = [];
    document.addEventListener(UI_EVENT, (e) => seen.push(e.detail));
    document.querySelector('[data-tower="scatter"]').click();
    document.querySelector('[data-tower="scatter"]').click();
    expect(seen).toEqual([
      { action: "tower", towerId: "scatter" },
      { action: "tower", towerId: null },
    ]);
  });

  it("emits sh-ui for pause and overclock", () => {
    const seen = [];
    document.addEventListener(UI_EVENT, (e) => seen.push(e.detail));
    document.querySelector(".sh-pause").click();
    document.querySelector(".sh-overclock").click();
    expect(seen).toEqual([{ action: "pause" }, { action: "overclock", socket: null }]);
  });

  it("cycles quality through window.__SHIHE__.setQuality", () => {
    const setQuality = vi.fn((tier) => tier);
    window.__SHIHE__ = { setQuality };
    document.querySelector(".sh-quality").click();
    expect(setQuality).toHaveBeenCalledWith("mid");
    expect(hudEl().getAttribute("data-quality")).toBe("mid");
    document.querySelector(".sh-quality").click();
    expect(setQuality).toHaveBeenLastCalledWith("low");
    expect(document.querySelector(".sh-quality").textContent).toBe("画质 低");
  });

  it("shows the tier the renderer actually applied", () => {
    window.__SHIHE__ = { setQuality: () => "low" };
    document.querySelector(".sh-quality").click();
    expect(hudEl().getAttribute("data-quality")).toBe("low");
  });

  it("survives a missing renderer handle", () => {
    expect(() => document.querySelector(".sh-quality").click()).not.toThrow();
    expect(hudEl().getAttribute("data-quality")).toBe("mid");
  });
});

describe("sh-input feedback", () => {
  it("mirrors the armed tower and the input layer notice", () => {
    document.dispatchEvent(
      new CustomEvent(INPUT_EVENT, {
        detail: { towerId: "well", selectedSocket: 4, paused: false, notice: { text: "先选中一座塔再过载", kind: "warn" } },
      }),
    );
    expect(document.querySelector('[data-tower="well"]').getAttribute("aria-pressed")).toBe("true");
    expect(document.querySelector('[data-tower="rail"]').getAttribute("aria-pressed")).toBe("false");
    expect(hud.getSelectedSocket()).toBe(4);
    expect(toastEl().textContent).toBe("先选中一座塔再过载");
  });
});
