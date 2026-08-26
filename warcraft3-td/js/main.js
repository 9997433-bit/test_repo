(function () {
  "use strict";

  const app = {
    game: null,
    renderer: null,
    hud: null,
    audio: null,
    lang: "zh",
    difficulty: "normal",
    heroId: "paladin",
    last: 0,
    acc: 0,
    step: 1 / 60,
    panning: false,
    panX: 0,
    panY: 0,
  };

  function $(id) { return document.getElementById(id); }

  function boot() {
    app.audio = new AudioBus();
    app.renderer = new Renderer($("stage"));
    app.hud = new HUD(app);
    app.renderer.resize();
    window.addEventListener("resize", function () { app.renderer.resize(); });
    bindMenu();
    bindGameInput();
    requestAnimationFrame(frame);
  }

  function bindMenu() {
    document.querySelectorAll("[data-diff]").forEach(function (b) {
      b.addEventListener("click", function () {
        app.difficulty = b.getAttribute("data-diff");
        document.querySelectorAll("[data-diff]").forEach(function (x) { x.classList.toggle("active", x === b); });
        app.audio.click();
      });
    });
    document.querySelectorAll("[data-hero]").forEach(function (b) {
      b.addEventListener("click", function () {
        app.heroId = b.getAttribute("data-hero");
        document.querySelectorAll("[data-hero]").forEach(function (x) { x.classList.toggle("active", x === b); });
        app.audio.click();
      });
    });
    $("btn-start").addEventListener("click", function () {
      startMatch();
    });
    $("btn-restart").addEventListener("click", function () {
      $("end-overlay").classList.add("hidden");
      $("start-overlay").classList.remove("hidden");
    });
    $("btn-settings").addEventListener("click", function () {
      $("settings-overlay").classList.toggle("hidden");
    });
    $("btn-menu").addEventListener("click", function () {
      if (app.game) app.game.paused = !app.game.paused;
      $("start-overlay").classList.toggle("hidden");
    });
    $("opt-lang").addEventListener("change", function () {
      app.lang = $("opt-lang").value;
      if (app.game) app.game.lang = app.lang;
      app.hud.refreshChrome();
      $("menu-title").textContent = app.hud.str("title");
      $("menu-sub").textContent = app.hud.str("subtitle");
      $("btn-start").textContent = app.hud.str("start");
    });
    $("opt-range").addEventListener("change", function () {
      if (app.game) app.game.settings.showRange = $("opt-range").checked;
    });
    $("opt-dmg").addEventListener("change", function () {
      if (app.game) app.game.settings.dmgNumbers = $("opt-dmg").checked;
    });
    $("opt-vol").addEventListener("input", function () {
      app.audio.master = Number($("opt-vol").value);
      if (app.game) app.game.settings.volume = app.audio.master;
    });
    $("btn-close-settings").addEventListener("click", function () {
      $("settings-overlay").classList.add("hidden");
    });
    $("btn-next").addEventListener("click", function () {
      if (app.game) app.game.startNextWave();
    });
    $("btn-pause").addEventListener("click", function () {
      if (!app.game) return;
      app.game.paused = !app.game.paused;
    });
    $("btn-speed").addEventListener("click", function () {
      if (!app.game) return;
      const order = [1, 1.5, 2];
      const i = order.indexOf(app.game.speed);
      app.game.speed = order[(i + 1) % order.length];
      $("btn-speed").textContent = "×" + app.game.speed;
    });
  }

  function startMatch() {
    app.game = new Game({
      difficulty: app.difficulty,
      heroId: app.heroId,
      lang: app.lang,
      audio: app.audio,
      seed: 20260826,
    });
    app.game.settings.showRange = $("opt-range").checked;
    app.game.settings.dmgNumbers = $("opt-dmg").checked;
    $("start-overlay").classList.add("hidden");
    $("end-overlay").classList.add("hidden");
    app.audio.wave();
    app.game.startNextWave();
  }

  function bindGameInput() {
    const canvas = $("stage");
    canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    canvas.addEventListener("mousedown", function (e) {
      if (!app.game) return;
      const w = toWorld(e);
      if (e.button === 1 || e.button === 2 && e.shiftKey) {
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
    window.addEventListener("mouseup", function () { app.panning = false; });
    canvas.addEventListener("mousemove", function (e) {
      if (!app.game) return;
      const w = toWorld(e);
      if (app.panning) {
        app.game.cam.x -= (e.clientX - app.panX) / app.game.cam.z;
        app.game.cam.y -= (e.clientY - app.panY) / app.game.cam.z;
        app.panX = e.clientX;
        app.panY = e.clientY;
      }
      if (app.game.buildId) {
        const def = GameData.towerById(app.game.buildId);
        const t = app.game.tileAt(w.x, w.y);
        const x = t.tx * app.game.tile + app.game.tile / 2;
        const y = t.ty * app.game.tile + app.game.tile / 2;
        app.game.buildGhost = {
          x: x, y: y,
          ok: app.game.canBuildAt(w.x, w.y) && app.game.gold >= def.cost[0],
          range: def.range[0],
        };
      }
    });
    canvas.addEventListener("wheel", function (e) {
      if (!app.game) return;
      e.preventDefault();
      app.game.cam.z = SimCore.clamp(app.game.cam.z * (e.deltaY > 0 ? 0.92 : 1.08), 0.65, 1.8);
    }, { passive: false });

    $("cmd").addEventListener("click", function (e) {
      const btn = e.target.closest(".cmd-btn");
      if (!btn || !app.game || btn.disabled) return;
      handleAction(btn.dataset.act);
    });
    $("cmd").addEventListener("mouseover", function (e) {
      const btn = e.target.closest(".cmd-btn");
      if (!btn || !btn.title) return;
      app.hud.showTip("<h4>" + btn.innerText.replace(/\n/g, " ") + "</h4><div>" + btn.title + "</div>", e.clientX, e.clientY);
    });
    $("cmd").addEventListener("mouseout", function () { app.hud.hideTip(); });

    window.addEventListener("keydown", function (e) {
      if (!app.game) return;
      if (e.code === "Space") {
        e.preventDefault();
        app.game.paused = !app.game.paused;
      }
      if (e.key === "n" || e.key === "N") app.game.startNextWave();
      if (e.key === "u" || e.key === "U") app.game.upgradeSelected();
      if (e.key === "s" || e.key === "S") {
        if (app.game.selected && app.game.selected.kind === "tower") app.game.sellSelected();
      }
      if (e.key === "q" || e.key === "Q") {
        if (app.game.selected && app.game.selected.kind === "hero") app.game.cast("q");
        else pickBuildByIndex(0);
      }
      if (e.key === "w" || e.key === "W") {
        if (app.game.selected && app.game.selected.kind === "hero") app.game.cast("w");
        else pickBuildByIndex(1);
      }
      if (e.key === "e" || e.key === "E") {
        if (app.game.selected && app.game.selected.kind === "hero") app.game.cast("e");
        else pickBuildByIndex(2);
      }
      const map = { r: 3, a: 4, d: 5, f: 6, z: 8, x: 9, c: 10, v: 11 };
      const k = e.key.toLowerCase();
      if (map[k] != null && !(app.game.selected && app.game.selected.kind === "hero")) pickBuildByIndex(map[k]);
      if (e.key === "Escape") {
        app.game.buildId = null;
        app.game.buildGhost = null;
        app.game.selected = null;
      }
    });
  }

  function pickBuildByIndex(i) {
    const def = GameData.TOWERS[i];
    if (!def || !app.game) return;
    app.game.selected = null;
    app.game.buildId = def.id;
    app.audio.click();
  }

  function handleAction(act) {
    if (!act || !app.game) return;
    if (act === "upgrade") app.game.upgradeSelected();
    else if (act === "sell") app.game.sellSelected();
    else if (act === "cancel-build") { app.game.buildId = null; app.game.buildGhost = null; }
    else if (act.indexOf("cast-") === 0) app.game.cast(act.slice(5));
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
    let dt = Math.min(0.05, (ts - app.last) / 1000);
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
    $("end-overlay").classList.remove("hidden");
    $("end-title").textContent = game.ended === "victory" ? game.t("victory") : game.t("defeat");
    $("end-detail").textContent = (game.lang === "zh" ? "波次 " : "Wave ") + game.waveIndex +
      " · " + (game.lang === "zh" ? "生命 " : "Lives ") + game.lives +
      " · " + (game.lang === "zh" ? "累计黄金 " : "Gold earned ") + game.goldEarned;
  }

  window.AzerothApp = app;
  window.addEventListener("load", boot);
})();
