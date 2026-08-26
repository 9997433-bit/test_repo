// 游戏外壳：主菜单 / 局内 HUD / 暂停 / 结算 / 触控层的装配与切换。
// 只认 view 快照和回调，不直接碰 sim、renderer 或 loop。

import "./shell.css";
import { h, clear } from "./dom.js";
import { createMenu } from "./menu.js";
import { createHud } from "./hud.js";
import { createKillFeed } from "./killfeed.js";
import { createTouchLayer } from "./touch.js";

const KEYMAP = [
  ["移动", "W A S D"],
  ["视角", "鼠标"],
  ["扇击", "左键 / F"],
  ["技能", "E"],
  ["换掌", "Q"],
  ["冲刺", "SHIFT"],
  ["跳跃", "SPACE"],
  ["暂停", "ESC"],
];

function detectTouch() {
  if (typeof navigator === "undefined") return false;
  if (navigator.maxTouchPoints > 0) return true;
  return typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
}

export function createShell(opts) {
  const {
    root,
    gloves,
    gloveById,
    save,
    audio,
    input,
    matchConfig = {},
    callbacks = {},
  } = opts;

  const el = h("div", { class: "yz" });
  const settings = {
    quality: save.quality || "auto",
    muted: !!save.muted,
    sensitivity: save.lookSensitivity ?? 1,
    pointerLock: save.pointerLock !== false,
    touch: save.touch || "auto",
  };

  function touchActive() {
    if (settings.touch === "on") return true;
    if (settings.touch === "off") return false;
    return detectTouch();
  }

  const hud = createHud();
  const feed = createKillFeed();
  hud.el.appendChild(feed.el);

  const touch = createTouchLayer({
    input,
    audio,
    onPause: () => callbacks.onPauseRequest && callbacks.onPauseRequest(),
  });

  const menu = createMenu({
    gloves,
    save,
    onStart: (loadout) => {
      audio.unlock();
      audio.play("uiSelect");
      callbacks.onStart && callbacks.onStart(loadout);
    },
    onPick: () => audio.play("uiMove"),
    onOpenSettings: () => openSheet("settings"),
  });

  const hudScreen = h("div", { class: "yz-screen" }, [hud.el, touch.el]);

  // ---------- 弹层（暂停 / 设置 / 结算）----------

  const sheetBody = h("div", { class: "yz-sheet yz-panel" });
  const sheet = h("div", { class: "yz-screen", "data-modal": true, hidden: true }, [sheetBody]);

  function segment(label, options, get, set) {
    const buttons = options.map(([value, text]) =>
      h("button", {
        type: "button",
        text,
        onclick: () => {
          set(value);
          audio.play("uiMove");
          buttons.forEach((b) => (b.dataset.value === String(get()) ? (b.dataset.on = "1") : delete b.dataset.on));
        },
        dataset: { value: String(value) },
      })
    );
    buttons.forEach((b) => {
      if (b.dataset.value === String(get())) b.dataset.on = "1";
    });
    return h("label", { class: "yz-set" }, [h("span", { text: label }), h("div", { class: "yz-seg" }, buttons)]);
  }

  function settingsBlock() {
    const slider = h("input", {
      type: "range",
      min: "0.3",
      max: "2.5",
      step: "0.1",
      value: String(settings.sensitivity),
    });
    const readout = h("span", { class: "yz-num", text: settings.sensitivity.toFixed(1) });
    slider.addEventListener("input", () => {
      settings.sensitivity = Number(slider.value);
      readout.textContent = settings.sensitivity.toFixed(1);
      emitSettings();
    });

    return h("div", { class: "yz-settings" }, [
      segment(
        "画质",
        [
          ["auto", "自动"],
          ["high", "高"],
          ["mid", "中"],
          ["low", "低"],
        ],
        () => settings.quality,
        (v) => {
          settings.quality = v;
          emitSettings();
        }
      ),
      segment(
        "音效",
        [
          [false, "开"],
          [true, "静音"],
        ],
        () => settings.muted,
        (v) => {
          settings.muted = v;
          emitSettings();
        }
      ),
      segment(
        "指针锁定",
        [
          [true, "开"],
          [false, "关"],
        ],
        () => settings.pointerLock,
        (v) => {
          settings.pointerLock = v;
          emitSettings();
        }
      ),
      segment(
        "触控层",
        [
          ["auto", "自动"],
          ["on", "常开"],
          ["off", "关"],
        ],
        () => settings.touch,
        (v) => {
          settings.touch = v;
          applyTouchMode();
          emitSettings();
        }
      ),
      h("label", { class: "yz-set" }, [h("span", { text: "视角灵敏度" }), slider, readout]),
    ]);
  }

  function keymapBlock() {
    return h(
      "div",
      { class: "yz-keys" },
      KEYMAP.map(([name, key]) => h("div", {}, [h("span", { text: name }), h("kbd", { text: key })]))
    );
  }

  function emitSettings() {
    callbacks.onSettingsChange && callbacks.onSettingsChange({ ...settings });
  }

  let sheetMode = null;

  function openSheet(mode, payload) {
    sheetMode = mode;
    clear(sheetBody);
    if (mode === "pause") renderPause();
    else if (mode === "settings") renderSettings();
    else if (mode === "result") renderResult(payload);
    sheet.hidden = false;
  }

  function closeSheet() {
    sheet.hidden = true;
    sheetMode = null;
  }

  function renderPause() {
    sheetBody.append(
      h("div", {}, [h("p", { class: "yz-kicker", text: "PAUSED" }), h("h2", { class: "yz-title", text: "暂 停" })]),
      settingsBlock(),
      keymapBlock(),
      h("div", { class: "yz-actions" }, [
        h("button", {
          class: "yz-btn",
          type: "button",
          "data-primary": true,
          text: "继 续",
          onclick: () => {
            audio.play("uiSelect");
            callbacks.onResume && callbacks.onResume();
          },
        }),
        h("button", {
          class: "yz-btn",
          type: "button",
          text: "重 开",
          onclick: () => {
            audio.play("uiSelect");
            callbacks.onRestart && callbacks.onRestart();
          },
        }),
        h("button", {
          class: "yz-btn",
          type: "button",
          "data-ghost": true,
          text: "回 主 菜 单",
          onclick: () => {
            audio.play("uiBack");
            callbacks.onQuit && callbacks.onQuit();
          },
        }),
      ])
    );
  }

  function renderSettings() {
    sheetBody.append(
      h("div", {}, [h("p", { class: "yz-kicker", text: "SETTINGS" }), h("h2", { class: "yz-title", text: "设 置" })]),
      settingsBlock(),
      keymapBlock(),
      h("div", { class: "yz-actions" }, [
        h("button", {
          class: "yz-btn",
          type: "button",
          "data-primary": true,
          text: "返 回",
          onclick: () => {
            audio.play("uiBack");
            closeSheet();
          },
        }),
      ])
    );
  }

  function renderResult(payload = {}) {
    const rows = (payload.rows || []).map((r, i) => {
      const row = h("div", { class: "yz-row" }, [
        h("i", {}),
        h("span", { class: "yz-rank yz-num", text: String(i + 1) }),
        h("span", { text: r.name }),
        h("small", { text: `${r.deaths} 次坠落` }),
        h("b", { class: "yz-num", text: `${r.kills}` }),
      ]);
      row.style.setProperty("--row-color", r.color || "#7f8c9e");
      if (r.self) row.dataset.self = "1";
      return row;
    });

    sheetBody.append(
      h("div", {}, [
        h("p", { class: "yz-kicker", text: payload.won ? "VICTORY" : "MATCH OVER" }),
        h("h2", { class: "yz-title", text: payload.won ? "掌 下 留 名" : "被 扇 下 岛" }),
        h("p", { class: "yz-hintline", text: payload.reasonText || "" }),
      ]),
      h("div", { class: "yz-rows" }, rows),
      payload.unlocked && payload.unlocked.length
        ? h("div", { class: "yz-note", "data-tone": "ok", text: `解锁：${payload.unlocked.join("、")}` })
        : null,
      h("div", { class: "yz-actions" }, [
        h("button", {
          class: "yz-btn",
          type: "button",
          "data-primary": true,
          text: "再 来 一 局",
          onclick: () => {
            audio.play("uiSelect");
            callbacks.onRestart && callbacks.onRestart();
          },
        }),
        h("button", {
          class: "yz-btn",
          type: "button",
          "data-ghost": true,
          text: "回 主 菜 单",
          onclick: () => {
            audio.play("uiBack");
            callbacks.onQuit && callbacks.onQuit();
          },
        }),
      ])
    );
  }

  // ---------- 降级提示 ----------

  const notes = h("div", { class: "yz-notes" });

  function setNotes(list) {
    clear(notes);
    for (const note of list) {
      notes.appendChild(h("div", { class: "yz-note", dataset: { tone: note.tone || "warn" }, text: note.text }));
    }
  }

  el.append(menu.el, hudScreen, sheet, notes);
  root.appendChild(el);

  function applyTouchMode() {
    el.dataset.touch = touchActive() ? "1" : "0";
    if (!touchActive()) touch.reset();
  }
  applyTouchMode();

  let screen = "menu";

  function setScreen(next) {
    screen = next;
    menu.el.hidden = next !== "menu";
    hudScreen.hidden = next === "menu";
    // 降级提示只在主菜单显示，局内靠渲染器自己的角标，别挡住战场。
    notes.hidden = next !== "menu";
    if (next === "menu") closeSheet();
  }

  setScreen("menu");

  return {
    el,
    get screen() {
      return screen;
    },
    get settings() {
      return { ...settings };
    },
    menu,
    hud,
    feed,
    touch,
    showMenu() {
      setScreen("menu");
      hud.reset();
      feed.clear();
      touch.reset();
      menu.render();
    },
    showMatch() {
      setScreen("match");
      hud.reset();
      feed.clear();
      closeSheet();
    },
    showPause() {
      openSheet("pause");
    },
    hideSheet: closeSheet,
    isSheetOpen: () => !sheet.hidden,
    sheetMode: () => sheetMode,
    showResult(payload) {
      openSheet("result", payload);
    },
    updateHud(view, selfId) {
      hud.update(view, selfId, { gloveById, killsToWin: matchConfig.killsToWin || 7 });
      if (touchActive()) {
        const self = (view.players || []).find((p) => p.id === selfId);
        touch.setCooldowns(self, self ? gloveById[self.gloveId] : null, {
          ...hud.maxSeen,
          switchLock: matchConfig.switchLock || 0.4,
        });
      }
    },
    pushKill(entry) {
      feed.push(entry);
    },
    toast(text, ms) {
      hud.setToast(text, ms);
    },
    setNotes,
    setUnlocked(list) {
      menu.setUnlocked(list);
    },
    refreshSettingsUi() {
      if (sheetMode === "pause" || sheetMode === "settings") openSheet(sheetMode);
    },
    destroy() {
      el.remove();
    },
  };
}
