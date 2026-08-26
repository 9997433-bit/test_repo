/**
 * Boot, menus, settings and input for Azeroth Keep TD.
 * The command card is the single source of truth for hotkeys: every key press
 * resolves to the slot the player can see, so card and keyboard cannot drift.
 */
(function () {
  "use strict";

  const SETTINGS_KEY = "azeroth-keep-td-settings";
  const SPEEDS = [1, 1.5, 2];

  const app = {
    game: null,
    renderer: null,
    hud: null,
    audio: null,
    lang: "zh",
    difficulty: "normal",
    heroId: "paladin",
    settings: {
      lang: "zh",
      showRange: true,
      dmgNumbers: true,
      volume: 0.55,
    },
    pendingNewMatch: false,
    endShownFor: null,
    last: 0,
    acc: 0,
    step: 1 / 60,
    panning: false,
    panX: 0,
    panY: 0,
  };

  function $(id) { return document.getElementById(id); }
  function qsa(sel) {
    try { return Array.prototype.slice.call(document.querySelectorAll(sel)); } catch (e) { return []; }
  }
  function setText(el, value) {
    if (el && el.textContent !== value) el.textContent = value;
  }
  function on(el, type, fn, opts) {
    if (el && el.addEventListener) el.addEventListener(type, fn, opts);
  }
  function hidden(id) {
    const el = $(id);
    return !el || el.classList.contains("hidden");
  }
  function show(id, visible) {
    const el = $(id);
    if (el) el.classList.toggle("hidden", !visible);
  }
  function clamp01(v) {
    return Math.max(0, Math.min(1, Number(v) || 0));
  }

  function boot() {
    app.audio = new AudioBus();
    app.renderer = new Renderer($("stage"));
    app.hud = new HUD(app);
    app.renderer.resize();
    on(window, "resize", function () { app.renderer.resize(); });
    try {
      loadSettings();
      bindMenu();
      bindGameInput();
      app.hud.applyLanguage();
    } catch (err) {
      // Never let HUD wiring stop the render loop from starting.
      if (typeof console !== "undefined") console.error("HUD init failed", err);
    }
    requestAnimationFrame(frame);
  }

  /* -------------------------------------------------------------- settings */

  function loadSettings() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null"); } catch (e) { saved = null; }
    if (saved && typeof saved === "object") {
      if (saved.lang === "en" || saved.lang === "zh") app.settings.lang = saved.lang;
      if (typeof saved.showRange === "boolean") app.settings.showRange = saved.showRange;
      if (typeof saved.dmgNumbers === "boolean") app.settings.dmgNumbers = saved.dmgNumbers;
      if (typeof saved.volume === "number") app.settings.volume = clamp01(saved.volume);
      if (typeof saved.difficulty === "string") app.difficulty = saved.difficulty;
      if (typeof saved.heroId === "string") app.heroId = saved.heroId;
    }
    app.lang = app.settings.lang;
    const lang = $("opt-lang");
    if (lang) lang.value = app.settings.lang;
    const range = $("opt-range");
    if (range) range.checked = app.settings.showRange;
    const dmg = $("opt-dmg");
    if (dmg) dmg.checked = app.settings.dmgNumbers;
    const vol = $("opt-vol");
    if (vol) vol.value = String(app.settings.volume);
    markChoice("[data-diff]", app.difficulty);
    markChoice("[data-hero]", app.heroId);
    applySettings(false);
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        lang: app.settings.lang,
        showRange: app.settings.showRange,
        dmgNumbers: app.settings.dmgNumbers,
        volume: app.settings.volume,
        difficulty: app.difficulty,
        heroId: app.heroId,
      }));
    } catch (e) { /* storage disabled */ }
  }

  /** Push the current settings into the live audio bus and running match. */
  function applySettings(persist) {
    app.lang = app.settings.lang;
    if (app.audio) {
      app.audio.master = app.settings.volume;
      // A zero master gain makes the WebAudio ramps throw, so mute instead.
      app.audio.enabled = app.settings.volume > 0.001;
    }
    if (app.game) {
      app.game.settings.showRange = app.settings.showRange;
      app.game.settings.dmgNumbers = app.settings.dmgNumbers;
      app.game.settings.volume = app.settings.volume;
      app.game.lang = app.settings.lang;
    }
    if (persist !== false) saveSettings();
  }

  function markChoice(selector, value) {
    const attr = selector.indexOf("data-diff") >= 0 ? "data-diff" : "data-hero";
    qsa(selector).forEach(function (b) {
      b.classList.toggle("active", b.getAttribute(attr) === value);
    });
  }

  /* ----------------------------------------------------------------- menus */

  function canResume() {
    return !!(app.game && !app.game.ended);
  }

  function refreshStartLabel() {
    setText($("btn-start"), canResume() && !app.pendingNewMatch ? app.hud.str("resume") : app.hud.str("start"));
  }

  function openMenu() {
    if (app.game && !app.game.ended) app.game.paused = true;
    show("start-overlay", true);
    refreshStartLabel();
  }

  function closeMenu() {
    show("start-overlay", false);
    if (canResume()) app.game.paused = false;
  }

  function toggleMenu() {
    if (hidden("start-overlay")) openMenu();
    else closeMenu();
  }

  function bindMenu() {
    qsa("[data-diff]").forEach(function (b) {
      on(b, "click", function () {
        app.difficulty = b.getAttribute("data-diff");
        markChoice("[data-diff]", app.difficulty);
        app.pendingNewMatch = true;
        refreshStartLabel();
        saveSettings();
        app.audio.click();
      });
    });
    qsa("[data-hero]").forEach(function (b) {
      on(b, "click", function () {
        app.heroId = b.getAttribute("data-hero");
        markChoice("[data-hero]", app.heroId);
        app.pendingNewMatch = true;
        refreshStartLabel();
        saveSettings();
        app.audio.click();
      });
    });

    on($("btn-start"), "click", function () {
      if (canResume() && !app.pendingNewMatch) closeMenu();
      else startMatch();
    });
    on($("btn-restart"), "click", function () {
      show("end-overlay", false);
      app.pendingNewMatch = true;
      openMenu();
    });
    on($("btn-settings"), "click", function () {
      const opening = hidden("settings-overlay");
      show("settings-overlay", opening);
      if (opening) app.hud.applyLanguage();
      app.audio.click();
    });
    on($("btn-close-settings"), "click", function () {
      show("settings-overlay", false);
      app.audio.click();
    });
    on($("btn-menu"), "click", function () {
      toggleMenu();
      app.audio.click();
    });
    on($("btn-allies"), "click", function () {
      app.hud.togglePanel("allies");
      app.audio.click();
    });
    on($("btn-log"), "click", function () {
      app.hud.togglePanel("log");
      app.audio.click();
    });

    on($("opt-lang"), "change", function () {
      app.settings.lang = $("opt-lang").value === "en" ? "en" : "zh";
      applySettings(true);
      app.hud.applyLanguage();
      refreshStartLabel();
    });
    on($("opt-range"), "change", function () {
      app.settings.showRange = !!$("opt-range").checked;
      applySettings(true);
    });
    on($("opt-dmg"), "change", function () {
      app.settings.dmgNumbers = !!$("opt-dmg").checked;
      applySettings(true);
    });
    on($("opt-vol"), "input", function () {
      app.settings.volume = clamp01($("opt-vol").value);
      applySettings(true);
    });
    on($("opt-vol"), "change", function () { app.audio.click(); });

    on($("btn-next"), "click", function () {
      if (app.game) app.game.startNextWave();
    });
    on($("btn-pause"), "click", togglePause);
    on($("btn-speed"), "click", function () { cycleSpeed(1); });

    // Keep Space/Enter from re-firing the last clicked HUD button.
    qsa(".top-actions button").forEach(function (b) {
      on(b, "click", function () { b.blur(); });
    });
  }

  function startMatch() {
    app.game = new Game({
      difficulty: app.difficulty,
      heroId: app.heroId,
      lang: app.settings.lang,
      audio: app.audio,
      seed: 20260826,
    });
    app.pendingNewMatch = false;
    applySettings(false);
    show("start-overlay", false);
    show("end-overlay", false);
    app.hud.refreshChrome();
    app.audio.wave();
    app.game.startNextWave();
  }

  function togglePause() {
    if (!app.game || app.game.ended) return;
    app.game.paused = !app.game.paused;
    app.hud.refreshChrome();
  }

  function cycleSpeed(dir) {
    if (!app.game) return;
    const i = SPEEDS.indexOf(app.game.speed);
    const next = (i < 0 ? 0 : i + dir + SPEEDS.length) % SPEEDS.length;
    app.game.speed = SPEEDS[next];
    app.hud.refreshChrome();
  }

  function selectHero() {
    if (!app.game || !app.game.hero) return;
    app.game.selected = app.game.hero;
    app.game.buildId = null;
    app.game.buildGhost = null;
    app.game.cam.x = app.game.hero.x;
    app.game.cam.y = app.game.hero.y;
  }

  /* ----------------------------------------------------------------- input */

  function overlayOpen() {
    return !hidden("start-overlay") || !hidden("settings-overlay") || !hidden("end-overlay");
  }

  function typingTarget(el) {
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toUpperCase();
    return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || el.isContentEditable === true;
  }

  /** Physical key letter, so hotkeys survive non-QWERTY / non-Latin layouts. */
  function letterOf(e) {
    const code = e.code || "";
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    const k = e.key || "";
    if (k.length === 1 && /[a-zA-Z]/.test(k)) return k.toUpperCase();
    return null;
  }

  function bindGameInput() {
    const canvas = $("stage");
    on(canvas, "contextmenu", function (e) { e.preventDefault(); });
    on(canvas, "mousedown", function (e) {
      if (!app.game) return;
      const w = toWorld(e);
      if (e.button === 1 || (e.button === 2 && e.shiftKey)) {
        app.panning = true;
        app.panX = e.clientX;
        app.panY = e.clientY;
        return;
      }
      if (e.button === 2) {
        if (app.game.selected && app.game.selected.kind === "hero") {
          app.game.commandHero(w.x, w.y);
        } else {
          app.game.buildId = null;
          app.game.buildGhost = null;
        }
        return;
      }
      if (app.game.buildId) {
        const ok = app.game.tryBuild(app.game.buildId, w.x, w.y);
        if (!ok) app.audio.click();
        return;
      }
      app.game.selected = app.game.pickAt(w.x, w.y);
    });
    on(window, "mouseup", function () { app.panning = false; });
    on(canvas, "mousemove", function (e) {
      if (!app.game) return;
      const w = toWorld(e);
      if (app.panning) {
        app.game.cam.x -= (e.clientX - app.panX) / app.game.cam.z;
        app.game.cam.y -= (e.clientY - app.panY) / app.game.cam.z;
        app.panX = e.clientX;
        app.panY = e.clientY;
        app.hud.hideTip();
        return;
      }
      if (app.game.buildId) {
        const def = GameData.towerById(app.game.buildId);
        const t = app.game.tileAt(w.x, w.y);
        app.game.buildGhost = {
          x: t.tx * app.game.tile + app.game.tile / 2,
          y: t.ty * app.game.tile + app.game.tile / 2,
          ok: app.game.canBuildAt(w.x, w.y) && app.game.gold >= def.cost[0],
          range: def.range[0],
        };
        app.hud.hideTip();
        return;
      }
      const hovered = app.game.pickAt(w.x, w.y);
      if (hovered) app.hud.showEntityTip(hovered, e.clientX, e.clientY);
      else if (app.hud.tipKind() === "entity") app.hud.hideTip();
    });
    on(canvas, "mouseleave", function () {
      if (app.hud.tipKind() === "entity") app.hud.hideTip();
    });
    on(canvas, "wheel", function (e) {
      if (!app.game) return;
      e.preventDefault();
      app.game.cam.z = SimCore.clamp(app.game.cam.z * (e.deltaY > 0 ? 0.92 : 1.08), 0.65, 1.8);
    }, { passive: false });

    const cmd = $("cmd");
    on(cmd, "click", function (e) {
      const btn = e.target.closest ? e.target.closest(".cmd-btn") : null;
      if (!btn || !app.game) return;
      const index = cmdIndex(btn);
      if (btn.dataset.deny === "1" || !btn.dataset.act) {
        app.audio.click();
        app.hud.flashSlot(index, true);
        return;
      }
      app.hud.flashSlot(index, false);
      handleAction(btn.dataset.act);
      btn.blur();
    });
    on(cmd, "mouseover", function (e) {
      const btn = e.target.closest ? e.target.closest(".cmd-btn") : null;
      if (!btn) return;
      app.hud.showCmdTip(cmdIndex(btn), e.clientX, e.clientY);
    });
    on(cmd, "mousemove", function (e) {
      if (app.hud.tipKind() === "cmd") app.hud.moveTip(e.clientX, e.clientY);
    });
    on(cmd, "mouseout", function (e) {
      const to = e.relatedTarget;
      if (to && cmd.contains(to)) return;
      app.hud.hideTip();
    });

    const top = document.querySelector(".top-actions");
    on(top, "mouseover", function (e) {
      const btn = e.target.closest ? e.target.closest("button") : null;
      const tip = btn ? btn.getAttribute("data-tip") : null;
      if (!tip) return;
      app.hud.showTextTip(tip, "", e.clientX, e.clientY);
    });
    on(top, "mouseout", function () { app.hud.hideTip(); });

    on(window, "keydown", onKeyDown);
    on(window, "blur", function () { app.panning = false; });
  }

  function cmdIndex(btn) {
    const grid = $("cmd");
    if (!grid) return -1;
    return Array.prototype.indexOf.call(grid.querySelectorAll(".cmd-btn"), btn);
  }

  function onKeyDown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const code = e.code || "";
    const key = e.key || "";
    if (code === "Space") e.preventDefault();
    if (typingTarget(e.target) && key !== "Escape") return;
    if (e.repeat) return;

    if (key === "Escape") { e.preventDefault(); onEscape(); return; }
    if (code === "F9") { e.preventDefault(); app.hud.togglePanel("log"); return; }
    if (code === "F11") { e.preventDefault(); app.hud.togglePanel("allies"); return; }
    if (code === "F10") { e.preventDefault(); toggleMenu(); return; }
    if (!app.game || overlayOpen()) return;

    if (code === "Space" || code === "KeyP") { blurActive(); togglePause(); return; }
    if (code === "KeyN") { app.game.startNextWave(); return; }
    if (code === "F1") { e.preventDefault(); selectHero(); return; }
    if (code === "Equal" || code === "NumpadAdd" || key === "+") { cycleSpeed(1); return; }
    if (code === "Minus" || code === "NumpadSubtract" || key === "-") { cycleSpeed(-1); return; }

    const letter = letterOf(e);
    if (!letter) return;
    const hit = app.hud.resolveHotkey(letter);
    if (!hit) return;
    e.preventDefault();
    if (hit.slot.deny) {
      app.audio.click();
      app.hud.flashSlot(hit.index, true);
      return;
    }
    app.hud.flashSlot(hit.index, false);
    handleAction(hit.slot.act);
  }

  function blurActive() {
    const el = document.activeElement;
    if (el && el !== document.body && typeof el.blur === "function") el.blur();
  }

  function onEscape() {
    if (!hidden("settings-overlay")) { show("settings-overlay", false); return; }
    if (!hidden("end-overlay")) return;
    if (!hidden("start-overlay")) {
      if (canResume() && !app.pendingNewMatch) closeMenu();
      return;
    }
    if (app.hud.isPanelOpen()) { app.hud.closePanel(); return; }
    if (!app.game) return;
    if (app.game.buildId) {
      app.game.buildId = null;
      app.game.buildGhost = null;
      return;
    }
    if (app.game.selected) {
      app.game.selected = null;
      return;
    }
    openMenu();
  }

  function handleAction(act) {
    if (!act || !app.game) return;
    if (act === "upgrade") app.game.upgradeSelected();
    else if (act === "sell") app.game.sellSelected();
    else if (act === "cancel-build") {
      app.game.buildId = null;
      app.game.buildGhost = null;
      app.game.selected = null;
    } else if (act.indexOf("cast-") === 0) app.game.cast(act.slice(5));
    else if (act.indexOf("build-") === 0) {
      app.game.selected = null;
      app.game.buildId = act.slice(6);
      app.audio.click();
    }
  }

  function toWorld(e) {
    const r = $("stage").getBoundingClientRect();
    const sx = e.clientX - r.left;
    const sy = e.clientY - r.top;
    const g = app.game;
    return {
      x: (sx - r.width / 2) / g.cam.z + g.cam.x,
      y: (sy - r.height / 2) / g.cam.z + g.cam.y,
    };
  }

  function frame(ts) {
    if (!app.last) app.last = ts;
    const dt = Math.min(0.05, (ts - app.last) / 1000);
    app.last = ts;
    if (app.game) {
      app.acc += dt;
      while (app.acc >= app.step) {
        app.game.update(app.step);
        app.acc -= app.step;
      }
      const alpha = app.acc / app.step;
      app.renderer.draw(app.game, alpha);
      app.renderer.drawMinimap($("minimap"), app.game);
      app.hud.update(app.game);
      if (app.game.ended) showEnd(app.game);
    } else {
      const ctx = $("stage").getContext("2d");
      ctx.fillStyle = "#08140a";
      ctx.fillRect(0, 0, $("stage").width, $("stage").height);
    }
    requestAnimationFrame(frame);
  }

  function showEnd(game) {
    if (app.endShownFor === game) return;
    app.endShownFor = game;
    show("end-overlay", true);
    setText($("end-title"), game.ended === "victory" ? game.t("victory") : game.t("defeat"));
    const zh = app.settings.lang === "zh";
    setText($("end-detail"), (zh ? "波次 " : "Wave ") + game.waveIndex +
      " · " + (zh ? "生命 " : "Lives ") + game.lives +
      " · " + (zh ? "累计黄金 " : "Gold earned ") + game.goldEarned);
    setText($("btn-restart"), app.hud.str("restart"));
  }

  window.AzerothApp = app;
  window.addEventListener("load", boot);
})();
