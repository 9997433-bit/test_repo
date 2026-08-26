// 游戏外壳：主菜单 / 局内 HUD / 触控 / 暂停 / 设置 / 结算的装配与切换。
// 只认 view 快照和回调，不直接碰 sim、renderer 或 loop。
// 类名一律走 Fable-2 合同（docs/ART_DIRECTION.md §11）；shell.css 只在
// src/styles 缺席时（html[data-yz-fallback]）兜底，见该文件顶部说明。

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

/** 设置面板的行布局不在 Fable-2 合同里，纯排版胶水走内联样式，不新增 CSS 文件。 */
function settingRow(label, control) {
  return h(
    "div",
    { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" } },
    [h("span", { class: "yz-glove-role", text: label }), control]
  );
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
    isUnlocked,
    unlockTextOf,
    callbacks = {},
  } = opts;

  const settings = {
    quality: save.quality || "auto",
    muted: !!save.muted,
    sensitivity: save.lookSensitivity ?? 1,
    pointerLock: save.pointerLock !== false,
    touch: save.touch || "auto",
  };
  let currentSave = save;

  function touchActive() {
    if (settings.touch === "on") return true;
    if (settings.touch === "off") return false;
    return detectTouch();
  }

  const hud = createHud();
  const feed = createKillFeed();
  hud.mountFeed(feed.el);
  hud.pauseButton.addEventListener("click", () => {
    audio.play("uiBack");
    if (callbacks.onPauseRequest) callbacks.onPauseRequest();
  });

  const touch = createTouchLayer({ input, audio });

  const menu = createMenu({
    gloves,
    save,
    switchLock: matchConfig.switchLock || 0.4,
    isUnlocked,
    unlockTextOf,
    onStart: (loadout) => {
      audio.unlock();
      audio.play("uiSelect");
      if (callbacks.onStart) callbacks.onStart(loadout);
    },
    onPick: () => audio.play("uiMove"),
    onOpenSettings: () => openSheet("settings"),
  });

  // ---------- 弹层（暂停 / 设置 / 结算）----------

  const sheetBody = h("div", { class: "yz-plate yz-panel" });
  const sheet = h("div", { class: "yz-screen yz-screen--frost", hidden: true }, [sheetBody]);

  function segment(options, get, set) {
    const seg = h("div", { class: "yz-seg" });
    const buttons = options.map(([value, text]) => {
      const btn = h("button", { class: "yz-seg-opt", type: "button", text });
      btn.dataset.value = String(value);
      btn.addEventListener("click", () => {
        set(value);
        audio.play("uiMove");
        for (const b of buttons) b.classList.toggle("is-on", b.dataset.value === String(get()));
      });
      return btn;
    });
    for (const b of buttons) b.classList.toggle("is-on", b.dataset.value === String(get()));
    seg.append(...buttons);
    return seg;
  }

  function settingsBlock() {
    const slider = h("input", {
      type: "range",
      min: "0.3",
      max: "2.5",
      step: "0.1",
      value: String(settings.sensitivity),
      style: { flex: "1 1 auto", maxWidth: "180px", accentColor: "var(--yz-accent)" },
    });
    const readout = h("span", { class: "yz-num", text: settings.sensitivity.toFixed(1) });
    slider.addEventListener("input", () => {
      settings.sensitivity = Number(slider.value);
      readout.textContent = settings.sensitivity.toFixed(1);
      emitSettings();
    });

    return h("div", { style: { display: "flex", flexDirection: "column", gap: "8px" } }, [
      settingRow(
        "画质",
        segment(
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
        )
      ),
      settingRow(
        "音效",
        segment(
          [
            [false, "开"],
            [true, "静音"],
          ],
          () => settings.muted,
          (v) => {
            settings.muted = v;
            emitSettings();
          }
        )
      ),
      settingRow(
        "指针锁定",
        segment(
          [
            [true, "开"],
            [false, "关"],
          ],
          () => settings.pointerLock,
          (v) => {
            settings.pointerLock = v;
            emitSettings();
          }
        )
      ),
      settingRow(
        "触控层",
        segment(
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
        )
      ),
      settingRow(
        "视角灵敏度",
        h("span", { style: { display: "flex", alignItems: "center", gap: "8px" } }, [slider, readout])
      ),
    ]);
  }

  function keymapBlock() {
    return h(
      "div",
      { style: { display: "flex", flexWrap: "wrap", gap: "8px" } },
      KEYMAP.map(([name, key]) =>
        h("span", { style: { display: "inline-flex", alignItems: "center", gap: "4px" } }, [
          h("span", { class: "yz-glove-role", text: name }),
          h("span", { class: "yz-kbd", text: key }),
        ])
      )
    );
  }

  function emitSettings() {
    if (callbacks.onSettingsChange) callbacks.onSettingsChange({ ...settings });
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

  function actions(list) {
    return h("div", { class: "yz-menu" }, list);
  }

  function button(text, variant, onclick) {
    const btn = h("button", { class: `yz-btn${variant ? ` yz-btn--${variant}` : ""}`, type: "button", text });
    btn.addEventListener("click", onclick);
    return btn;
  }

  function renderPause() {
    sheetBody.append(
      h("h2", { class: "yz-title", text: "暂 停" }),
      settingsBlock(),
      keymapBlock(),
      actions([
        button("继 续", "primary", () => {
          audio.play("uiSelect");
          if (callbacks.onResume) callbacks.onResume();
        }),
        button("重 开", null, () => {
          audio.play("uiSelect");
          if (callbacks.onRestart) callbacks.onRestart();
        }),
        button("回 主 菜 单", "ghost", () => {
          audio.play("uiBack");
          if (callbacks.onQuit) callbacks.onQuit();
        }),
      ])
    );
  }

  function renderSettings() {
    sheetBody.append(
      h("h2", { class: "yz-title", text: "设 置" }),
      settingsBlock(),
      keymapBlock(),
      actions([
        button("返 回", "primary", () => {
          audio.play("uiBack");
          closeSheet();
        }),
      ])
    );
  }

  function resultRow(cells, mods = {}) {
    const row = h("div", { class: "yz-results-row" }, [
      h("span", { class: "yz-results-name", text: cells[0] }),
      h("span", { class: "yz-num", text: cells[1] }),
      h("span", { class: "yz-num", text: cells[2] }),
      h("span", { class: "yz-num", text: cells[3] }),
    ]);
    if (mods.head) row.classList.add("is-head");
    if (mods.winner) row.classList.add("is-winner");
    if (mods.me) row.classList.add("is-me");
    if (mods.glove) row.dataset.glove = mods.glove;
    return row;
  }

  function renderResult(payload = {}) {
    const title = h("h2", {
      class: "yz-results-title",
      text: payload.won ? "掌 下 留 名" : "被 扇 下 岛",
    });
    if (payload.won) title.classList.add("is-win");

    const rows = (payload.rows || []).map((r, i) =>
      resultRow([r.name, String(r.kills), String(r.deaths), String(r.streak ?? 0)], {
        winner: i === 0,
        me: r.self,
        glove: r.gloveId,
      })
    );

    sheetBody.append(
      title,
      h("p", { class: "yz-subtitle", text: payload.reasonText || "" }),
      h("div", {}, [resultRow(["选手", "杀", "坠", "连"], { head: true }), ...rows]),
      payload.unlocked && payload.unlocked.length
        ? h("p", { class: "yz-heading", text: `解锁：${payload.unlocked.join("、")}` })
        : null,
      actions([
        button("再 来 一 局", "primary", () => {
          audio.play("uiSelect");
          if (callbacks.onRestart) callbacks.onRestart();
        }),
        button("回 主 菜 单", "ghost", () => {
          audio.play("uiBack");
          if (callbacks.onQuit) callbacks.onQuit();
        }),
      ])
    );
  }

  // ---------- 装配 ----------

  root.appendChild(menu.el);
  root.appendChild(hud.el);
  root.appendChild(touch.el);
  root.appendChild(sheet);

  function applyTouchMode() {
    const on = touchActive();
    // 合同要求把开关挂在 html/body 上：.yz-touch 与 .yz-kbd 的显隐都靠它。
    if (on) document.documentElement.dataset.touch = "1";
    else delete document.documentElement.dataset.touch;
    if (!on) touch.reset();
  }
  applyTouchMode();

  let screen = "menu";

  function setScreen(next) {
    screen = next;
    menu.el.hidden = next !== "menu";
    hud.el.hidden = next === "menu";
    touch.el.hidden = next === "menu";
    if (next === "menu") closeSheet();
  }

  setScreen("menu");

  return {
    el: root,
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
      hud.update(view, selfId, {
        gloveById,
        killsToWin: matchConfig.killsToWin || 7,
        switchLock: matchConfig.switchLock || 0.4,
      });
      if (touchActive()) {
        const self = (view.players || []).find((p) => p.id === selfId);
        touch.setCooldowns(self, self ? gloveById[self.activeGloveId ?? self.gloveId] : null, hud.maxSeen);
      }
    },
    pushKill(entry) {
      feed.push(entry);
    },
    flashHit() {
      hud.flashHit();
    },
    toast(text, ms, gold) {
      hud.setToast(text, ms, gold);
    },
    /** 降级提示落在主菜单页脚 .yz-foot，不挡战场。 */
    setNotes(list) {
      menu.setFoot(
        list.map((note) =>
          h("span", {
            text: note.text,
            style: {
              marginRight: "12px",
              color: note.tone === "warn" ? "var(--yz-gold-300)" : "var(--yz-text-mute)",
            },
          })
        )
      );
    },
    setSave(next) {
      currentSave = next;
      menu.setSave(next);
    },
    getSave: () => currentSave,
    refreshSettingsUi() {
      if (sheetMode === "pause" || sheetMode === "settings") openSheet(sheetMode);
    },
    destroy() {
      menu.el.remove();
      hud.el.remove();
      touch.el.remove();
      sheet.remove();
    },
  };
}
