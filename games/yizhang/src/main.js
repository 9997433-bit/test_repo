// 异掌 · 入口。职责：装配（模块探测 → 降级）、主循环、事件转音效/播报、存档。
// 这里不写玩法规则，也不碰 Three.js；规则在 src/sim + src/combat，画面在 src/render。

import { loadSiblingModules, loadSiblingStyles, bindRenderer } from "./core/modules.js";
import { createLoop } from "./core/loop.js";
import { lerpView } from "./core/interp.js";
import { createQualityProbe } from "./core/quality.js";
import { loadSave, updateSave, recordMatch, unlockGlove } from "./core/storage.js";
import { makeRng } from "./core/rng.js";
import * as fallbackSim from "./core/fallback/sim.js";
import * as fallbackAi from "./core/fallback/ai.js";
import { createRenderer as createFallbackRenderer } from "./core/fallback/render2d.js";
import { GLOVES as FALLBACK_GLOVES, MATCH as FALLBACK_MATCH } from "./core/fallback/data.js";
import { createInput } from "./input/index.js";
import { createAudio } from "./audio/index.js";
import { createShell } from "./ui/shell.js";

const SELF_ID = "p1";
const HUD_INTERVAL = 1 / 30;

const app = document.getElementById("app");
const canvasHost = document.body;

function fatal(message, err) {
  console.error("[yizhang]", message, err);
  document.documentElement.dataset.yizhang = "error";
  if (!app) return;
  app.innerHTML = "";
  const box = document.createElement("div");
  box.setAttribute(
    "style",
    "position:absolute;inset:0;display:grid;place-content:center;gap:12px;padding:24px;" +
      "text-align:center;font-family:Georgia,serif;color:#e7e1d4;background:#0b111b"
  );
  box.innerHTML =
    `<div style="font-size:1.6rem;letter-spacing:.4em">异掌 启动失败</div>` +
    `<div style="font-size:.8rem;color:#8b9ab0;max-width:52ch;line-height:1.8">${message}</div>` +
    `<pre style="font-size:.68rem;color:#c8702c;white-space:pre-wrap;max-width:70ch">${
      err ? String(err.stack || err) : ""
    }</pre>`;
  app.appendChild(box);
}

function freshCanvas() {
  const old = document.getElementById("gl");
  const next = document.createElement("canvas");
  next.id = "gl";
  if (old) old.replaceWith(next);
  else canvasHost.insertBefore(next, canvasHost.firstChild);
  return next;
}

async function boot() {
  const styleCount = await loadSiblingStyles();
  const mods = await loadSiblingModules();

  const gloves =
    mods.data.ok && Array.isArray(mods.data.module.GLOVES) && mods.data.module.GLOVES.length
      ? mods.data.module.GLOVES
      : FALLBACK_GLOVES;
  const gloveById =
    (mods.data.ok && mods.data.module.GLOVE_BY_ID) ||
    Object.fromEntries(gloves.map((g) => [g.id, g]));
  const matchConfig = { ...FALLBACK_MATCH, ...((mods.data.ok && mods.data.module.MATCH) || {}) };

  const sim = mods.sim.ok ? mods.sim.module : fallbackSim;
  const ai = mods.ai.ok ? mods.ai.module : fallbackAi;

  const degraded = [];
  if (!mods.sim.ok) degraded.push({ text: `src/sim 未接入（${mods.sim.reason}）· 正在跑占位模拟`, tone: "warn" });
  if (!mods.render.ok) degraded.push({ text: `src/render 未接入（${mods.render.reason}）· 正在跑 Canvas2D 调试视图`, tone: "warn" });
  if (!mods.ai.ok) degraded.push({ text: `src/ai 未接入（${mods.ai.reason}）· 正在跑占位 Bot`, tone: "warn" });
  if (!mods.data.ok) degraded.push({ text: `src/data 未接入（${mods.data.reason}）· 正在用占位掌表`, tone: "warn" });
  if (styleCount === 0) degraded.push({ text: "src/styles 未接入 · 使用 shell 自带暮蓝主题", tone: "warn" });
  else degraded.push({ text: `已加载 src/styles ${styleCount} 份样式`, tone: "ok" });

  let save = loadSave();
  const audio = createAudio({ muted: save.muted });

  // ---------- 渲染器 ----------

  let canvas = document.getElementById("gl") || freshCanvas();
  let renderer = null;
  let rendererIsFallback = false;

  function makeRenderer() {
    if (mods.render.ok) {
      try {
        const instance = mods.render.module.createRenderer(canvas, {
          followId: SELF_ID,
          gloves,
          maxDpr: 2,
        });
        const bound = bindRenderer(mods.render.module, instance);
        if (bound.sync) return { api: bound, fallback: false };
        console.warn("[yizhang] render 模块没有 sync，退回占位渲染");
      } catch (err) {
        console.warn("[yizhang] render 模块初始化失败，退回占位渲染", err);
        degraded.push({ text: "src/render 初始化抛错 · 已退回 Canvas2D 调试视图", tone: "warn" });
      }
      canvas = freshCanvas();
    }
    const inst = createFallbackRenderer(canvas, { followId: SELF_ID });
    return { api: inst, fallback: true };
  }

  const made = makeRenderer();
  renderer = made.api;
  rendererIsFallback = made.fallback;

  function applyResize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    if (renderer.resize) renderer.resize(w, h, dpr);
  }
  window.addEventListener("resize", applyResize);
  window.addEventListener("orientationchange", () => setTimeout(applyResize, 120));

  // ---------- 输入 ----------

  const input = createInput(document, canvas, {
    sensitivity: save.lookSensitivity,
    invertY: save.invertY,
    pointerLock: save.pointerLock !== false,
    onFirstGesture: () => audio.unlock(),
    onPause: () => togglePause(),
  });
  input.setEnabled(false);
  document.addEventListener("pointerdown", () => audio.unlock(), { once: true });

  // ---------- 外壳 ----------

  const shell = createShell({
    root: app,
    gloves,
    gloveById,
    save,
    audio,
    input,
    matchConfig,
    callbacks: {
      onStart: (loadout) => startMatch(loadout),
      onResume: () => setPaused(false),
      onRestart: () => startMatch(lastLoadout || shell.menu.getLoadout()),
      onQuit: () => quitToMenu(),
      onPauseRequest: () => togglePause(),
      onSettingsChange: (next) => applySettings(next),
    },
  });
  const bootNode = document.getElementById("yz-boot");
  if (bootNode) bootNode.remove();
  shell.setNotes(degraded);

  function applySettings(next) {
    save = updateSave({
      quality: next.quality,
      muted: next.muted,
      lookSensitivity: next.sensitivity,
      pointerLock: next.pointerLock,
      touch: next.touch,
    });
    audio.setMuted(next.muted);
    input.setSensitivity(next.sensitivity);
    input.setPointerLock(next.pointerLock);
    if (next.quality === "auto") {
      if (!probe || probe.done) startProbe();
    } else {
      if (probe) probe.cancel();
      setQuality(next.quality, "手动");
    }
  }

  // ---------- 画质 ----------

  let probe = null;
  let qualityTier = "mid";

  function setQuality(tier, why) {
    qualityTier = tier;
    if (renderer.setQuality) renderer.setQuality(tier);
    if (why) shell.toast(`画质 ${tier.toUpperCase()} · ${why}`, 1500);
  }

  function startProbe() {
    if (shell.settings.quality !== "auto") return;
    probe = createQualityProbe(
      (tier, info) => setQuality(tier, `自动 ${info.fps.toFixed(0)}fps`),
      { windowSeconds: 2, dpr: Math.min(2, window.devicePixelRatio || 1) }
    );
  }

  // ---------- 对局 ----------

  let state = null;
  let curView = null;
  let prevView = null;
  let lastLoadout = null;
  let rng = makeRng(1);
  let hudAcc = 0;
  let matchStats = null;
  let resultShown = false;

  function nameOf(id) {
    if (!curView) return id;
    const p = (curView.players || []).find((q) => q.id === id);
    return (p && p.name) || id;
  }

  function colorOf(id) {
    if (!curView) return null;
    const p = (curView.players || []).find((q) => q.id === id);
    return p && p.color;
  }

  function collectInputs() {
    const inputs = {};
    const look = input.getLook();
    inputs[SELF_ID] = input.sample(look.yaw);
    if (!curView) return inputs;
    for (const p of curView.players || []) {
      if (p.id === SELF_ID || p.kind === "human") continue;
      try {
        inputs[p.id] = ai.think(curView, p.id, rng);
      } catch (err) {
        console.warn("[yizhang] bot think 抛错", err);
        inputs[p.id] = {};
      }
    }
    return inputs;
  }

  const behindLastHit = new Map();

  function handleEvents(view) {
    const events = Array.isArray(view.events) ? view.events : [];
    for (const e of events) {
      switch (e.type) {
        case "slap":
          if (!e.hit) audio.play("slapWhiff");
          else audio.play("slap", { velocity: e.awakened ? 1.2 : 1 });
          break;
        case "hit":
          audio.play("hit", { power: e.power });
          if (e.targetId) behindLastHit.set(e.targetId, !!e.behind);
          if (e.playerId === SELF_ID) matchStats.hits += 1;
          break;
        case "parry":
          audio.play("heavy");
          break;
        case "skill":
          audio.play("skill");
          break;
        case "awaken":
          audio.play("awaken");
          if (e.playerId === SELF_ID) shell.toast("掌意觉醒", 1800);
          break;
        case "dash":
          audio.play("dash");
          if (e.playerId === SELF_ID) matchStats.dashes += 1;
          break;
        case "jump":
          audio.play("jump");
          break;
        case "land":
          audio.play("land", { impact: e.impact || 0 });
          break;
        case "switch":
          audio.play("switchGlove");
          break;
        case "chunkCrack":
          audio.play("crack");
          break;
        case "chunkBreak":
          audio.play("collapse");
          shell.toast("台面塌了一块", 1400);
          break;
        case "meteorLand":
          audio.play("heavy");
          break;
        case "ringout":
          audio.play("ringout");
          break;
        case "respawn":
          if (e.playerId === SELF_ID) audio.play("respawn");
          break;
        case "kill": {
          const behind = behindLastHit.get(e.victimId);
          behindLastHit.delete(e.victimId);
          shell.pushKill({
            killer: e.killerId ? nameOf(e.killerId) : null,
            victim: nameOf(e.victimId),
            method: e.killerId ? (behind ? "背身扇落" : "扇 出 岛") : "自 己 掉 下 去",
            color: e.killerId ? colorOf(e.killerId) : "#6c7787",
          });
          if (e.killerId === SELF_ID) {
            audio.play("kill");
            matchStats.kills += 1;
            if (behind) matchStats.behindKills += 1;
          } else if (e.victimId === SELF_ID) {
            audio.play("death");
            matchStats.deaths += 1;
          }
          break;
        }
        default:
          break;
      }
    }
  }

  // sim 不发事件时的兜底：靠 deaths 计数差分补击杀播报。
  const lastDeaths = new Map();
  function diffKills(view) {
    for (const p of view.players || []) {
      const before = lastDeaths.get(p.id);
      lastDeaths.set(p.id, p.deaths || 0);
      if (before === undefined || (p.deaths || 0) <= before) continue;
      audio.play("ringout");
      shell.pushKill({ killer: null, victim: p.name || p.id, method: "坠 岛", color: p.color });
      if (p.id === SELF_ID) matchStats.deaths += 1;
    }
  }

  function evaluateUnlocks() {
    const newly = [];
    save = loadSave();
    for (const g of gloves) {
      if (save.unlocked.includes(g.id)) continue;
      const req = g.unlock && g.unlock.req;
      let pass = false;
      if (req) {
        pass = true;
        if (req.kills != null && matchStats.kills < req.kills) pass = false;
        if (req.dashes != null && matchStats.dashes < req.dashes) pass = false;
        if (req.behindKills != null && matchStats.behindKills < req.behindKills) pass = false;
        if (req.noDeaths && matchStats.deaths > 0) pass = false;
      }
      if (pass) {
        save = unlockGlove(g.id);
        newly.push(g.name);
      }
    }
    if (newly.length) shell.setUnlocked(save.unlocked);
    return newly;
  }

  function finishMatch() {
    if (resultShown) return;
    resultShown = true;
    loop.setPaused(true);
    input.setEnabled(false);
    input.releasePointerLock();
    audio.play("matchEnd");

    const players = (curView.players || []).slice().sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
    const self = players.find((p) => p.id === SELF_ID);
    const won = players.length > 0 && players[0].id === SELF_ID;
    const over = typeof sim.isMatchOver === "function" ? sim.isMatchOver(state) : { reason: curView.reason };
    const reasonText =
      over.reason === "kills"
        ? `${nameOf(over.winnerId || players[0].id)} 先到 ${matchConfig.killsToWin} 杀`
        : "四分钟到，按击杀数结算";

    // 战绩以最终计分板为准；事件计数只用于 view 里没有的维度（冲刺次数、背身击杀）。
    if (self) {
      matchStats.kills = self.kills || 0;
      matchStats.deaths = self.deaths || 0;
    }
    recordMatch({ kills: matchStats.kills, deaths: matchStats.deaths, won });
    const unlocked = evaluateUnlocks();

    shell.showResult({
      won,
      reasonText,
      unlocked,
      rows: players.map((p) => ({
        name: p.name || p.id,
        kills: p.kills || 0,
        deaths: p.deaths || 0,
        color: p.color,
        self: p.id === SELF_ID,
      })),
    });
  }

  function startMatch(loadout) {
    lastLoadout = loadout;
    save = updateSave({ loadout });
    rng = makeRng((Date.now() & 0xffff) ^ 0x5eed);
    matchStats = { kills: 0, deaths: 0, hits: 0, dashes: 0, behindKills: 0 };
    behindLastHit.clear();
    lastDeaths.clear();
    resultShown = false;

    try {
      state = sim.createMatch({
        seed: (Date.now() & 0x7fffffff) >>> 0,
        gloveId: loadout.main,
        offhandId: loadout.off,
        botCount: 3,
      });
    } catch (err) {
      console.error("[yizhang] createMatch 失败，退回占位模拟", err);
      state = fallbackSim.createMatch({
        seed: 1,
        gloveId: loadout.main,
        offhandId: loadout.off,
        botCount: 3,
      });
      shell.setNotes([...degraded, { text: "src/sim.createMatch 抛错 · 已退回占位模拟", tone: "warn" }]);
    }

    curView = sim.getView(state);
    prevView = curView;
    if (fallbackAi.resetBots) fallbackAi.resetBots();
    if (renderer.setFollow) renderer.setFollow(SELF_ID);

    shell.showMatch();
    input.setEnabled(true);
    input.setLook(-Math.PI / 2, 0.3);
    loop.setPaused(false);
    audio.unlock();
    audio.play("matchStart");
    applyResize();
    startProbe();
  }

  function quitToMenu() {
    loop.setPaused(true);
    input.setEnabled(false);
    input.releasePointerLock();
    state = null;
    curView = null;
    prevView = null;
    shell.showMenu();
    shell.setNotes(degraded);
  }

  function setPaused(next) {
    if (!state || resultShown) return;
    loop.setPaused(next);
    input.setEnabled(!next);
    if (next) {
      input.releasePointerLock();
      shell.showPause();
    } else {
      shell.hideSheet();
    }
  }

  function togglePause() {
    if (shell.screen === "menu") return;
    if (resultShown) return;
    setPaused(!loop.isPaused());
  }

  // ---------- 循环 ----------

  const loop = createLoop({
    dt: matchConfig.dt || 1 / 60,
    step(dt) {
      if (!state) return;
      prevView = curView;
      let inputs;
      try {
        inputs = collectInputs();
      } catch (err) {
        console.warn("[yizhang] 输入采样失败", err);
        inputs = {};
      }
      try {
        sim.step(state, inputs, dt);
        curView = sim.getView(state);
      } catch (err) {
        console.error("[yizhang] sim.step 抛错，暂停对局", err);
        shell.setNotes([...degraded, { text: `sim.step 抛错：${err.message}`, tone: "warn" }]);
        loop.setPaused(true);
        return;
      }
      if (Array.isArray(curView.events) && curView.events.length) handleEvents(curView);
      else if (!Array.isArray(curView.events)) diffKills(curView);

      const over =
        typeof sim.isMatchOver === "function" ? sim.isMatchOver(state) : { over: !!curView.over };
      if (over && over.over) finishMatch();
    },
    draw(alpha, info) {
      if (probe && !info.paused) probe.feed(performance.now() / 1000);
      if (!curView) return;
      const view = info.paused ? curView : lerpView(prevView, curView, alpha);
      try {
        if (renderer.sync) renderer.sync(view);
        if (renderer.render) renderer.render(view, alpha);
      } catch (err) {
        console.warn("[yizhang] renderer.sync 抛错", err);
      }
      hudAcc += 1 / 60;
      if (hudAcc >= HUD_INTERVAL) {
        hudAcc = 0;
        shell.updateHud(curView, SELF_ID);
      }
    },
    onPauseChange(isPaused, why) {
      if (why === "hidden" && isPaused && state && !resultShown && !shell.isSheetOpen()) {
        input.setEnabled(false);
        shell.showPause();
      }
      if (why === "visible" && state && !resultShown) {
        // 回到前台后保持在暂停面板，等玩家自己点继续，避免瞬间挨打。
        loop.setPaused(true);
        input.setEnabled(false);
      }
    },
  });

  loop.start();
  loop.setPaused(true);
  applyResize();
  setQuality(shell.settings.quality === "auto" ? "mid" : shell.settings.quality, null);
  document.documentElement.dataset.yizhang = "ready";

  // 调试钩子：探针脚本和手测都用得上，不参与游戏逻辑。
  window.__yizhang = {
    get state() {
      return state;
    },
    get view() {
      return curView;
    },
    get modules() {
      return mods;
    },
    get quality() {
      return qualityTier;
    },
    get rendererFallback() {
      return rendererIsFallback;
    },
    shell,
    input,
    audio,
    loop,
    startMatch,
    togglePause,
  };
}

boot().catch((err) => fatal("引导阶段异常，请查看控制台。", err));
