// 游戏外壳：主菜单 / 局内 HUD / 触控 / 暂停 / 设置 / 结算的装配与切换。
// 只认 view 快照和回调，不直接碰 sim、renderer 或 loop。
// 类名一律走 Fable-2 合同（docs/ART_DIRECTION.md §11）；shell.css 只在
// src/styles 缺席时（html[data-yz-fallback]）兜底，见该文件顶部说明。

import "./shell.css";
import { ENTRY, entryCopy } from "../core/entry.js";
import { normalizeLookMode } from "../core/look.js";
import { h, clear } from "./dom.js";
import { createMenu } from "./menu.js";
import { createHud } from "./hud.js";
import { createHubUi } from "./hub.js";
import { createKillFeed } from "./killfeed.js";
import { createTouchLayer } from "./touch.js";

const KEYMAP = [
  ["移动", "W A S D"],
  ["视角", "鼠标"],
  ["切换视角", "V"],
  ["扇击", "左键 / F"],
  ["技能 / 选掌", "E"],
  ["换掌", "Q"],
  ["冲刺", "SHIFT"],
  ["跳跃", "SPACE"],
  ["暂停", "ESC"],
];

// 「配掌面板」不是第三条回程：它退到 2D 备选配装台（GOAL《与 2D 菜单的关系》），
// 既不进走道也不进裂岛。形状与 core/entry.js 的 entryCopy 一致，好走同一条渲染路。
const MENU_COPY = Object.freeze({
  kind: "menu",
  label: "配 掌 面 板",
  key: null,
  where: "2D 备 选 台",
  hint: "退到 2D 配掌台 · 一次看全八掌、换皮肤，不进走道",
});

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
    skinTable,
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
    invertY: !!save.invertY,
    pointerLock: save.pointerLock !== false,
    touch: save.touch || "auto",
    // 视角模式：开局值由 main 收敛（URL > 存档 > locked）后经 opts 传入，
    // 免得 URL 覆盖了运行值、设置面板却还照存档亮灯。
    lookMode: normalizeLookMode(opts.lookMode ?? save.lookMode),
  };
  let currentSave = save;

  function touchActive() {
    if (settings.touch === "on") return true;
    if (settings.touch === "off") return false;
    return detectTouch();
  }

  const hud = createHud();
  // 开局就把 #hud[data-look] 贴上（§18.2 的装饰镜像），但不放一瞬反馈：
  // 那是「切换回执」，进游戏第一帧没人切过任何东西。
  hud.setLookMode(settings.lookMode);
  const feed = createKillFeed();
  hud.mountFeed(feed.el);
  // 大厅 HUD 与战斗 HUD 同住 #hud，靠 #hud[data-phase] 互斥显示（见 ui/hub.css）
  const hubUi = createHubUi({ gloveById, unlockTextOf });
  hud.el.appendChild(hubUi.el);
  hud.pauseButton.addEventListener("click", () => {
    audio.play("uiBack");
    if (callbacks.onPauseRequest) callbacks.onPauseRequest();
  });

  const touch = createTouchLayer({ input, audio });

  const menu = createMenu({
    gloves,
    skinTable,
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
    onPickSkin: (id) => {
      audio.play("uiSelect");
      if (callbacks.onSkinChange) callbacks.onSkinChange(id);
    },
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
      // 视角模式（§18.3）：与画质分段器完全同一套 .yz-seg 玻璃钢框，不新增组件
      settingRow(
        "视角模式",
        segment(
          [
            ["locked", "固定视角"],
            ["free", "自由视角"],
          ],
          () => settings.lookMode,
          (v) => {
            settings.lookMode = v;
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
      // Y 轴反转：input.setInvertY / applyLook / 存档字段早就位（storage.js 缺省 false），
      // 缺的只是这行开关。setInvertY 是既有公共 API，UI 直接调即时生效（与触控层调
      // toggleLookMode 同一种「壳层只接线」姿势）；emitSettings 照发，落盘归 main。
      settingRow(
        "Y 轴反转",
        segment(
          [
            [false, "关"],
            [true, "开"],
          ],
          () => settings.invertY,
          (v) => {
            settings.invertY = v;
            input.setInvertY(v);
            emitSettings();
          }
        )
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
  // 结算板的两个入口，供快捷键按名取用（键鼠与触控最终走同一条 click 路径）
  let resultEntries = null;

  function openSheet(mode, payload) {
    sheetMode = mode;
    resultEntries = null;
    clear(sheetBody);
    if (mode === "pause") renderPause();
    else if (mode === "settings") renderSettings();
    else if (mode === "result") renderResult(payload);
    sheet.hidden = false;
    syncTouchVisibility();
    // 键盘可达：板一开就把主入口交给焦点，Enter / 空格直接生效，Tab 顺着往下走。
    if (resultEntries && resultEntries.restart) resultEntries.restart.focus();
  }

  function closeSheet() {
    sheet.hidden = true;
    sheetMode = null;
    resultEntries = null;
    syncTouchVisibility();
  }

  function actions(list) {
    // .yz-menu 是壳层兜底那份的竖排容器，.yz-btn-stack 是 F2 同义类（styles/menus.css）：
    // 两个名字一起挂，两套 CSS 谁在场都能把入口摞成一列。
    return h("div", { class: "yz-menu yz-btn-stack" }, list);
  }

  function button(text, variant, onclick) {
    const btn = h("button", { class: `yz-btn${variant ? ` yz-btn--${variant}` : ""}`, type: "button", text });
    btn.addEventListener("click", onclick);
    return btn;
  }

  /**
   * 一个入口 = 一颗按钮 + 紧跟其后的一行去处说明。
   *
   * 「再来一局」和「回安全区换掌」只看四五个字的标题分不出去处（Round 1 遗留 6 的
   * UX 尾巴）：说明这一行才写清楚一个带着掌回裂岛、一个空手回走道。文案统一在
   * core/entry.js，这里只负责贴。类名全走 F2 合同（.yz-hintline / .yz-kbd），
   * 排版胶水走内联样式，不新增 CSS。
   */
  function entryChoice({ copy, label, key, variant, onSelect }) {
    const shortcut = key === undefined ? copy.key : key;
    // 一颗入口只吃第一次点击：触屏的双击 / 幽灵点击不该开出两局。
    // 回调自己抛了就把闸放回去，别把板锁死在一颗点不动的按钮上。
    let taken = false;
    const btn = button(label || copy.label, variant, () => {
      if (taken) return;
      taken = true;
      try {
        onSelect();
      } catch (err) {
        taken = false;
        throw err;
      }
      btn.disabled = true;
    });
    btn.dataset.entry = copy.kind;
    btn.title = copy.hint;
    if (shortcut) btn.setAttribute("aria-keyshortcuts", shortcut);

    // 键位章走 .yz-kbd：F2 在 [data-touch="1"] 下把这一类整类收起，
    // 触屏上只剩说明文字，键鼠与触控共用同一行提示、同一颗按钮。
    const hint = h(
      "p",
      {
        class: "yz-hintline",
        style: { display: "flex", alignItems: "baseline", justifyContent: "center", gap: "6px" },
      },
      [shortcut ? h("span", { class: "yz-kbd", text: shortcut }) : null, h("span", { text: copy.hint })]
    );
    hint.dataset.entry = copy.kind;

    const el = h(
      "div",
      { dataset: { entry: copy.kind }, style: { display: "flex", flexDirection: "column", gap: "4px" } },
      [btn, hint]
    );
    return { el, btn };
  }

  function renderPause() {
    // 暂停里的「回安全区」是**重开一局落走道**，正在打的这一局就此作废 —— 说明这
    // 一行把这句话写出来，别让人以为是「原地回大厅、回头还能接着打」。
    // 快捷键只给结算板：暂停板上还摆着滑块和分段器，一个手滑的 H 不该弃局。
    const hubCopy = entryCopy(ENTRY.HUB, { from: "pause" });
    const hub = entryChoice({
      copy: hubCopy,
      label: "回 安 全 区",
      key: null,
      onSelect: () => {
        audio.play("uiSelect");
        if (callbacks.onReturnHub) callbacks.onReturnHub();
      },
    });
    // 3D 走道是主路径，2D 配掌板退居这里：想一次看全八掌 / 改皮肤还是走它。
    const menuEntry = entryChoice({
      copy: MENU_COPY,
      key: null,
      onSelect: () => {
        audio.play("uiSelect");
        if (callbacks.onQuit) callbacks.onQuit();
      },
    });

    sheetBody.append(
      h("h2", { class: "yz-title", text: "暂 停" }),
      settingsBlock(),
      keymapBlock(),
      actions([
        button("继 续", "primary", () => {
          audio.play("uiSelect");
          if (callbacks.onResume) callbacks.onResume();
        }),
        hub.el,
        menuEntry.el,
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

  function nameOfGlove(id) {
    const glove = id && gloveById ? gloveById[id] : null;
    return (glove && glove.name) || "";
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

    // 两个回程入口。文案 core/entry.js 说了算；「再来一局」那句会把**将要沿用的
    // 那副掌**报出来（main 用同一条 resolveEntry 链算出来传进来），玩家不用先猜
    // 「同一副掌」是哪一副。去处相反的两颗按钮到这里才真的分得清（Round 1 遗留 6）。
    const gear = payload.restartLoadout || {};
    const restart = entryChoice({
      copy: entryCopy(ENTRY.RESTART, {
        mainName: nameOfGlove(gear.main),
        offName: nameOfGlove(gear.off),
      }),
      variant: "primary",
      onSelect: () => {
        audio.play("uiSelect");
        if (callbacks.onRestart) callbacks.onRestart();
      },
    });
    // GOAL §7 回程：打完不该逼玩家刷新页面才能重挑掌。这条走的是 ENTRY.HUB，
    // 与上面那颗按钮去处相反 —— 两颗按钮不许再是同一件事。
    const hub = entryChoice({
      copy: entryCopy(ENTRY.HUB, { from: "result" }),
      onSelect: () => {
        audio.play("uiSelect");
        if (callbacks.onReturnHub) callbacks.onReturnHub();
      },
    });
    const menuEntry = entryChoice({
      copy: MENU_COPY,
      variant: "ghost",
      onSelect: () => {
        audio.play("uiBack");
        if (callbacks.onQuit) callbacks.onQuit();
      },
    });
    resultEntries = { restart: restart.btn, hub: hub.btn, menu: menuEntry.btn };

    // 掌语（可选）：木棉在结算这一刻有话说才有这一行 —— 中央短讯那条通道这时被
    // 结算板压着，看不见，所以这一拍直接贴在板上。没有就整行不出现。
    const storyText = Array.isArray(payload.storyText)
      ? payload.storyText.filter(Boolean).join("　")
      : typeof payload.storyText === "string"
        ? payload.storyText.trim()
        : "";
    const story = storyText
      ? h("p", { class: "yz-hintline", dataset: { story: "1" }, text: storyText })
      : null;

    // append 会把 null 变成字面量 "null" 贴到板上（没解锁新掌的那一局就中招），
    // 条件块必须先滤掉再进 DOM。
    const nodes = [
      title,
      h("p", { class: "yz-subtitle", text: payload.reasonText || "" }),
      h("div", {}, [resultRow(["选手", "杀", "坠", "连"], { head: true }), ...rows]),
      payload.unlocked && payload.unlocked.length
        ? h("p", { class: "yz-heading", text: `解锁：${payload.unlocked.join("、")}` })
        : null,
      story,
      actions([restart.el, hub.el, menuEntry.el]),
    ];
    sheetBody.append(...nodes.filter(Boolean));
  }

  // ---------- 装配 ----------

  root.appendChild(menu.el);
  root.appendChild(hud.el);
  root.appendChild(touch.el);
  root.appendChild(sheet);
  root.appendChild(hubUi.warp);

  function applyTouchMode() {
    const on = touchActive();
    // 合同要求把开关挂在 html/body 上：.yz-touch 与 .yz-kbd 的显隐都靠它。
    if (on) document.documentElement.dataset.touch = "1";
    else delete document.documentElement.dataset.touch;
    hubUi.setTouch(on);
    if (!on) touch.reset();
  }
  applyTouchMode();

  let screen = "menu";
  let phase = "arena";

  /**
   * 暂停 / 结算板压在屏幕上时收起触控层：摇杆和扇击钮就在结算板按钮底下，
   * 半透明板上摸一把很容易先摸到它们。板一关就按当前页面还原，触屏与键鼠
   * 看到的是同一块板、同一组入口。
   */
  function syncTouchVisibility() {
    const hide = screen === "menu" || !sheet.hidden;
    if (hide && !touch.el.hidden) touch.reset();
    touch.el.hidden = hide;
  }

  function setScreen(next) {
    screen = next;
    menu.el.hidden = next !== "menu";
    hud.el.hidden = next === "menu";
    syncTouchVisibility();
    if (next === "menu") closeSheet();
  }

  /** 安全区 / 裂岛：同一套 HUD 换一张脸，别再开第二个全屏层。 */
  function setPhase(next) {
    const value = next === "hub" ? "hub" : "arena";
    if (phase === value) return value;
    phase = value;
    hud.el.dataset.phase = value;
    touch.setPhase(value);
    if (value === "arena") hubUi.reset();
    return value;
  }

  /**
   * 结算板的键鼠快捷键：R 回裂岛、H 回走道，Enter 落在主入口上。
   * 一律走按钮自己的 click —— 触控点按、鼠标点击、键盘敲键最终是同一条路径，
   * 「只生效一次」的闸也就只有一处（entryChoice 的 once）。
   * 暂停板不给快捷键：那上面还摆着滑块与分段器，手滑一个 H 不该弃掉这一局。
   */
  function onSheetKey(e) {
    if (sheet.hidden || sheetMode !== "result" || !resultEntries) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;

    const key = e.key === "Enter" ? "Enter" : String(e.key || "").toLowerCase();
    let btn = null;
    if (key === "r") btn = resultEntries.restart;
    else if (key === "h") btn = resultEntries.hub;
    // 焦点已经在板上某颗按钮时，Enter 归它自己（原生行为），别抢过来跳回主入口
    else if (key === "Enter" && !sheetBody.contains(document.activeElement)) btn = resultEntries.restart;
    if (!btn || btn.disabled) return;
    e.preventDefault();
    btn.click();
  }
  document.addEventListener("keydown", onSheetKey);

  setScreen("menu");
  hud.el.dataset.phase = phase;

  return {
    el: root,
    get screen() {
      return screen;
    },
    get settings() {
      return { ...settings };
    },
    get phase() {
      return phase;
    },
    menu,
    hud,
    hubUi,
    feed,
    touch,
    setPhase,
    /** 大厅一帧：说明牌 / 配装 / 传送门提示。返回本帧模型给 main 做音效判断。 */
    updateHub(view) {
      return hubUi.update(view);
    },
    /** 门内短过渡（穿过传送门时放一次）。 */
    warp(ms) {
      hubUi.playWarp(ms);
    },
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
    /** @param {{strength?:number, ms?:number}} [opts] 见 core/juice.js hitFlashFor */
    flashHit(opts) {
      hud.flashHit(opts);
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
    /**
     * 视角模式的回写口（V 键与设置板两条切换路共用，契约 §13.2）：
     * `#hud[data-look]` 跟上、放一瞬反馈、设置面板正开着也不许亮旧灯。
     * 模式的权威在 input —— 这里收到的永远是 `input.getLookMode()` 的结果，
     * 壳层只做镜像与反馈，不自己决定模式。
     *
     * @param {'locked'|'free'|string} mode
     * @param {{flash?: boolean}} [opts] flash=false 用于初始化这类「没人切过」的同步
     */
    setLookMode(mode, opts = {}) {
      const next = normalizeLookMode(mode, settings.lookMode);
      // 换没换以 HUD 上贴着的那份镜像为准：设置板那条路是先改 settings 再回喂，
      // 拿 settings 比会把自己比没了，一瞬反馈就只剩 V 键那一条路有。
      const changed = hud.setLookMode(next);
      if (changed && opts.flash !== false) hud.flashLook(next);
      if (next !== settings.lookMode) {
        settings.lookMode = next;
        if (sheetMode === "pause" || sheetMode === "settings") openSheet(sheetMode);
      }
      return settings.lookMode;
    },
    refreshSettingsUi() {
      if (sheetMode === "pause" || sheetMode === "settings") openSheet(sheetMode);
    },
    destroy() {
      document.removeEventListener("keydown", onSheetKey);
      menu.el.remove();
      hud.el.remove();
      touch.el.remove();
      sheet.remove();
      hubUi.warp.remove();
    },
  };
}
