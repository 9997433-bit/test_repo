// 异掌 · 入口。职责：装配（模块探测 → 依赖注入 → 降级）、主循环、事件转音效/播报、存档。
// 这里不写玩法规则，也不碰 Three.js；规则在 src/sim + src/combat，画面在 src/render。

import {
  loadSiblingModules,
  loadSiblingStyles,
  bindRenderer,
  wireSimDeps,
  wiringStatus,
} from "./core/modules.js";
import { createLoop } from "./core/loop.js";
import { hitStopForEvents } from "./core/juice.js";
import { lerpView } from "./core/interp.js";
import { createQualityProbe } from "./core/quality.js";
import { loadSave, updateSave, recordMatch, unlockGlove, SAVE_KEY } from "./core/storage.js";
import { makeRng } from "./core/rng.js";
import {
  SELF_ID,
  adaptView,
  createRoster,
  simYawToCameraYaw,
  toRenderView,
} from "./core/view.js";
import { createUnlockChecker, newlyUnlocked, unlockTextOf } from "./core/unlocks.js";
import { createProgressTracker } from "./core/progress.js";
import * as fallbackSim from "./core/fallback/sim.js";
import * as fallbackAi from "./core/fallback/ai.js";
import { createRenderer as createFallbackRenderer } from "./core/fallback/render2d.js";
import { GLOVES as FALLBACK_GLOVES, MATCH as FALLBACK_MATCH } from "./core/fallback/data.js";
import { createInput } from "./input/index.js";
import { createAudio } from "./audio/index.js";
import { createShell } from "./ui/shell.js";

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
  // src/styles 缺席才让 ui/shell.css 生效，两套 CSS 永远不同时上场。
  if (styleCount === 0) document.documentElement.dataset.yzFallback = "1";

  const mods = await loadSiblingModules();

  const sim = mods.sim.ok ? mods.sim.module : fallbackSim;
  const ai = mods.ai.ok ? mods.ai.module : fallbackAi;
  const dataModule = mods.data.ok ? mods.data.module : null;
  const combatModule = mods.combat.ok ? mods.combat.module : null;

  // Round 1 的头号缺陷：sim 从来没拿到真实 data / combat，运行时一直跑内置兜底棉掌。
  const wired = wireSimDeps(sim, dataModule, combatModule);
  // sim 现在静态 import 真实 data/combat；deps 的 usingReal* 只表示「没装替身」，
  // 别拿它当降级信号。真值统一走 wiringStatus（见 core/modules.js）。
  const realWiring = wiringStatus(sim, wired);

  const gloves =
    dataModule && Array.isArray(dataModule.GLOVES) && dataModule.GLOVES.length
      ? dataModule.GLOVES
      : FALLBACK_GLOVES;
  const gloveById =
    (dataModule && dataModule.GLOVE_BY_ID) || Object.fromEntries(gloves.map((g) => [g.id, g]));
  const matchConfig = {
    ...FALLBACK_MATCH,
    ...((dataModule && dataModule.MATCH) || {}),
    ...(typeof sim.getMatchConfig === "function" ? sim.getMatchConfig() : {}),
  };
  const personaById = (dataModule && dataModule.BOT_PERSONA_BY_ID) || null;

  const isUnlocked = createUnlockChecker(dataModule, { gloves });

  const degraded = [];
  if (!mods.sim.ok) degraded.push({ text: `src/sim 未接入（${mods.sim.reason}）· 正在跑占位模拟`, tone: "warn" });
  if (!mods.render.ok) degraded.push({ text: `src/render 未接入（${mods.render.reason}）· 正在跑 Canvas2D 调试视图`, tone: "warn" });
  if (!mods.ai.ok) degraded.push({ text: `src/ai 未接入（${mods.ai.reason}）· 正在跑占位 Bot`, tone: "warn" });
  if (!mods.data.ok) degraded.push({ text: `src/data 未接入（${mods.data.reason}）· 正在用占位掌表`, tone: "warn" });
  if (mods.data.ok && !realWiring.usingRealData) degraded.push({ text: "sim 没吃到真实掌表 · 8 掌数值可能未进局", tone: "warn" });
  if (mods.combat.ok && !realWiring.usingRealCombat) degraded.push({ text: "sim 没吃到真实 combat · 技能可能未进局", tone: "warn" });
  if (styleCount === 0) degraded.push({ text: "src/styles 未接入 · 使用 shell 兜底暮蓝主题", tone: "warn" });

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
          localId: SELF_ID,
          arenaRadius: matchConfig.arenaRadius,
          quality: save.quality && save.quality !== "auto" ? save.quality : "mid",
          mobile: (navigator.maxTouchPoints || 0) > 0,
          pixelRatio: Math.min(2, window.devicePixelRatio || 1),
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

  function setSpectator(on) {
    if (renderer.setSpectator) renderer.setSpectator(on);
  }

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
    isUnlocked,
    unlockTextOf: (glove) => unlockTextOf(glove, dataModule),
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
  setSpectator(true);

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
    // 探针的唯一作用就是这一行：档位必须真的落到渲染器上。
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
  let roster = null;
  let lastLoadout = null;
  let rng = makeRng(1);
  let hudAcc = 0;
  let resultShown = false;
  const tracker = createProgressTracker({ selfId: SELF_ID });

  function nameOf(id) {
    if (!curView) return id;
    const p = (curView.players || []).find((q) => q.id === id);
    return (p && p.name) || id;
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

  function handleEvents(view) {
    for (const e of view.events) {
      switch (e.type) {
        case "slap":
          if (!e.hits) audio.play("slapWhiff");
          else audio.play("slap", { velocity: e.awakened ? 1.2 : 1 });
          break;
        case "slapWhiff":
          audio.play("slapWhiff");
          break;
        case "hit":
          audio.play("hit", { power: e.power });
          if (e.targetId === SELF_ID) shell.flashHit();
          break;
        case "skill":
          audio.play("skill");
          break;
        case "awaken":
          audio.play("awaken");
          if (e.playerId === SELF_ID) shell.toast("掌 意 觉 醒", 1800, true);
          break;
        case "dash":
          audio.play("dash");
          break;
        case "jump":
          audio.play("jump");
          break;
        case "switch":
          audio.play("switchGlove");
          break;
        case "tileCrack":
          audio.play("crack");
          break;
        case "tileBreak":
          audio.play("collapse");
          if (e.playerId === SELF_ID || e.by === SELF_ID) shell.toast("台面塌了一块", 1400);
          break;
        case "respawn":
          if (e.playerId === SELF_ID) audio.play("respawn");
          break;
        case "ko": {
          const mine = e.killerId === SELF_ID || e.victimId === SELF_ID;
          shell.pushKill({
            killer: e.killerId ? nameOf(e.killerId) : null,
            victim: nameOf(e.victimId),
            method: e.killerId ? "扇 出 岛" : "自 己 掉 下 去",
            mine,
          });
          if (e.killerId === SELF_ID) audio.play("kill");
          else if (e.victimId === SELF_ID) audio.play("death");
          else audio.play("ringout");
          break;
        }
        default:
          break;
      }
    }

    // 手感：本人参与的扇击命中给一记极短定格。同帧多段只停一次，
    // 连段之间还有冷却兜着；画面反馈仍是 HUD 那层去饱和，不加红晕。
    const stop = hitStopForEvents(view.events, SELF_ID);
    if (stop > 0) loop.hold(stop);
  }

  function evaluateUnlocks(won) {
    tracker.finish(won);
    save = loadSave();
    const fresh = newlyUnlocked(gloves, tracker.progress, save, dataModule);
    for (const g of fresh) save = unlockGlove(g.id);
    if (fresh.length) shell.setSave(save);
    return fresh.map((g) => g.name);
  }

  function finishMatch() {
    if (resultShown) return;
    resultShown = true;
    loop.setPaused(true);
    input.setEnabled(false);
    input.releasePointerLock();
    setSpectator(true);
    audio.play("matchEnd");

    const players = (curView.players || [])
      .slice()
      .sort((a, b) => (b.kills || 0) - (a.kills || 0) || (a.deaths || 0) - (b.deaths || 0));
    const self = players.find((p) => p.id === SELF_ID);
    const won = players.length > 0 && players[0].id === SELF_ID;
    const over =
      typeof sim.isMatchOver === "function" ? sim.isMatchOver(state) : { reason: curView.reason };
    const reasonText =
      over.reason === "kills"
        ? `${nameOf(over.winnerId || players[0].id)} 先到 ${matchConfig.killsToWin} 杀`
        : "四分钟到，按击杀数结算";

    recordMatch({ kills: (self && self.kills) || 0, deaths: (self && self.deaths) || 0, won });
    const unlocked = evaluateUnlocks(won);

    shell.showResult({
      won,
      reasonText,
      unlocked,
      rows: players.map((p) => ({
        name: p.name || p.id,
        kills: p.kills || 0,
        deaths: p.deaths || 0,
        streak: p.streak || 0,
        gloveId: p.activeGloveId || p.gloveId,
        self: p.id === SELF_ID,
      })),
    });
  }

  function refreshView() {
    const raw = sim.getView(state);
    return adaptView(raw, { selfId: SELF_ID, roster, gloveById });
  }

  function startMatch(loadout) {
    lastLoadout = loadout;
    save = updateSave({ loadout });
    rng = makeRng((Date.now() & 0xffff) ^ 0x5eed);
    tracker.reset();
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

    const rawView = sim.getView(state);
    roster = createRoster(rawView, { selfId: SELF_ID, personaById });
    curView = adaptView(rawView, { selfId: SELF_ID, roster, gloveById });
    prevView = curView;
    if (fallbackAi.resetBots) fallbackAi.resetBots();
    if (ai.resetBots) ai.resetBots();

    const self = (curView.players || []).find((p) => p.id === SELF_ID);
    setSpectator(false);
    shell.showMatch();
    input.setEnabled(true);
    // 出生朝台心：把 sim 的初始 yaw 换算回相机方位角，开局镜头在人背后。
    input.setLook(simYawToCameraYaw(self ? self.yaw : 0), 0.3);
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
    setSpectator(true);
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
        curView = refreshView();
      } catch (err) {
        console.error("[yizhang] sim.step 抛错，暂停对局", err);
        shell.setNotes([...degraded, { text: `sim.step 抛错：${err.message}`, tone: "warn" }]);
        loop.setPaused(true);
        return;
      }
      if (curView.events.length) {
        handleEvents(curView);
        tracker.feed(curView.events, curView);
      }
      if (curView.over) finishMatch();
    },
    draw(alpha, info) {
      if (probe && !info.paused) probe.feed(performance.now() / 1000);
      if (!curView) {
        if (renderer.sync) renderer.sync({ players: [], tiles: [], events: [] });
        return;
      }
      const view = info.paused ? curView : lerpView(prevView, curView, alpha);
      try {
        // 朝向桥接只对 three 渲染器成立；Canvas2D 调试视图用的是屏幕系角度。
        if (renderer.sync) renderer.sync(rendererIsFallback ? view : toRenderView(view));
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
    SELF_ID,
    SAVE_KEY,
    get state() {
      return state;
    },
    get view() {
      return curView;
    },
    get modules() {
      return mods;
    },
    get wiring() {
      // usingReal* 报的是「进局的是不是真模块」，不是「有没有调过 install」：
      // sim 静态 import 的 data/combat 同样算真（core/modules.js wiringStatus）。
      return {
        ...wired,
        ...wiringStatus(sim, wired),
        unlockSource: isUnlocked.source,
        styleCount,
        renderer: rendererIsFallback ? "fallback" : "three",
      };
    },
    get progress() {
      return tracker.progress;
    },
    get quality() {
      return qualityTier;
    },
    get rendererFallback() {
      return rendererIsFallback;
    },
    renderer,
    shell,
    input,
    audio,
    loop,
    startMatch,
    togglePause,
  };
}

boot().catch((err) => fatal("引导阶段异常，请查看控制台。", err));
