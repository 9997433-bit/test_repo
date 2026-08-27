// 异掌 · 入口。职责：装配（模块探测 → 依赖注入 → 降级）、主循环、事件转音效/播报、存档。
// 这里不写玩法规则，也不碰 Three.js；规则在 src/sim + src/combat，画面在 src/render。
//
// 开局路线（Round 1 起）：装配完直接进**安全区**，相机就在走道里的角色身后。
// createMatch 缺省 `phase:'hub'`，这里不传 skipHub；2D 的 `.yz-home` 配掌板降为
// 暂停里翻得到的备选台（`shell` 的「配 掌 面 板」），不再是必经的第一屏。

import {
  loadSiblingModules,
  loadSiblingStyles,
  bindRenderer,
  wireSimDeps,
  wiringStatus,
} from "./core/modules.js";
import { createLoop } from "./core/loop.js";
import { hitFlashForEvents, hitStopForEvents } from "./core/juice.js";
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
import { feedLook, resolveLookMode, snapLook } from "./core/look.js";
import { ENTRY, resolveEntry } from "./core/entry.js";
import { normalizeSkinId, resolveSkins } from "./core/skins.js";
import { unlockedIdsFor } from "./core/hub-flow.js";
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
  // 皮肤表：data 给了就用真表，没给用 core/skins.js 的兜底表（默认 ash）。
  const skinTable = resolveSkins(dataModule);

  const isUnlocked = createUnlockChecker(dataModule, { gloves });

  const degraded = [];
  if (!mods.sim.ok) degraded.push({ text: `src/sim 未接入（${mods.sim.reason}）· 正在跑占位模拟`, tone: "warn" });
  if (!mods.render.ok) degraded.push({ text: `src/render 未接入（${mods.render.reason}）· 正在跑 Canvas2D 调试视图`, tone: "warn" });
  if (!mods.ai.ok) degraded.push({ text: `src/ai 未接入（${mods.ai.reason}）· 正在跑占位 Bot`, tone: "warn" });
  if (!mods.data.ok) degraded.push({ text: `src/data 未接入（${mods.data.reason}）· 正在用占位掌表`, tone: "warn" });
  if (mods.data.ok && !realWiring.usingRealData) degraded.push({ text: "sim 没吃到真实掌表 · 8 掌数值可能未进局", tone: "warn" });
  if (mods.combat.ok && !realWiring.usingRealCombat) degraded.push({ text: "sim 没吃到真实 combat · 技能可能未进局", tone: "warn" });
  if (styleCount === 0) degraded.push({ text: "src/styles 未接入 · 使用 shell 兜底暮蓝主题", tone: "warn" });
  if (skinTable.source !== "data") {
    degraded.push({
      text: `src/data 未导出 SKINS · 使用壳层兜底皮肤表（${skinTable.skins.length} 套，默认 ${skinTable.defaultId}）`,
      tone: "warn",
    });
  }

  let save = loadSave();
  const audio = createAudio({ muted: save.muted });

  // 视角模式开局取值链：URL `?look=locked|free`（冒烟/调试口）> 存档 > 缺省 locked。
  // URL 覆盖只影响本次会话；之后 V 键 / 设置面板的切换照常落存档。
  const initialLookMode = resolveLookMode({
    url: new URLSearchParams(window.location.search).get("look"),
    save,
  });

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
          // 真表（F3 SKINS）经壳层 resolveSkins 喂给渲染层；不喂则角色走兜底剪影
          skins: skinTable,
          data: dataModule,
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

  /**
   * 每帧的视角喂入（Round 1 遗留 4）。渲染器没有 setLook / setPitch 时整只 no-op，
   * O2 把 API 开出来的当帧就自动生效 —— 壳层不必再为一个 setter 走一遍装配。
   * 换算与字段形状都在 core/look.js，这里只负责「每帧调一次」。
   */
  function feedRendererLook() {
    return feedLook(renderer, input.getLook());
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
    lookMode: initialLookMode,
    onFirstGesture: () => audio.unlock(),
    onPause: () => togglePause(),
    // V 键切换：落存档 + HUD 镜像/一瞬反馈 + 设置面板同步灯。渲染器不用单独通知，
    // feedRendererLook 每帧的 payload.lookMode 下一帧就带到新模式。
    // 反馈只有 shell.setLookMode 里那一枚 .yz-look-flash（ART_DIRECTION §18.1）——
    // 中央短讯那块大字不再另开一份，模式提示不与战斗信息抢眼。
    // （V 只在 input enabled 时生效，而 enabled 要等 startMatch —— 彼时 shell 已装配好。）
    onLookModeChange: (mode) => {
      save = updateSave({ lookMode: mode });
      shell.setLookMode(mode);
    },
  });
  input.setEnabled(false);
  document.addEventListener("pointerdown", () => audio.unlock(), { once: true });

  // ---------- 外壳 ----------

  const shell = createShell({
    root: app,
    gloves,
    gloveById,
    skinTable,
    save,
    audio,
    input,
    // 设置面板的「视角」灯按运行值亮（URL 覆盖过存档时不许亮旧灯）
    lookMode: initialLookMode,
    matchConfig,
    isUnlocked,
    unlockTextOf: (glove) => unlockTextOf(glove, dataModule),
    callbacks: {
      onStart: (loadout) => startMatch(loadout),
      onResume: () => setPaused(false),
      // 「再来一局」进裂岛、「回安全区」进走道，两个按钮不是一件事（core/entry.js）
      onRestart: () => restartArena(),
      onReturnHub: () => returnToHub(),
      onQuit: () => quitToMenu(),
      onPauseRequest: () => togglePause(),
      onSettingsChange: (next) => applySettings(next),
      // 皮肤在大厅点一下就落盘，不必等到进局
      onSkinChange: (skinId) => {
        save = updateSave({ skinId: normalizeSkinId(skinId, skinTable) });
      },
    },
  });
  const bootNode = document.getElementById("yz-boot");
  if (bootNode) bootNode.remove();
  shell.setNotes(degraded);
  setSpectator(true);

  function applySettings(next) {
    // 视角模式：input 是运行时权威，先收敛再落盘（面板给了认不出的值就保持原样）
    input.setLookMode(next.lookMode);
    // 收敛后的那个值才是镜像与一瞬反馈的依据：设置板这条路与 V 键走同一枚反馈
    shell.setLookMode(input.getLookMode());
    save = updateSave({
      quality: next.quality,
      muted: next.muted,
      lookSensitivity: next.sensitivity,
      pointerLock: next.pointerLock,
      touch: next.touch,
      lookMode: input.getLookMode(),
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
    // 玩家还在安全区挑掌时不要让 Bot 在岛上互扇：那会把对局分数打完，
    // 传送过去正好碰上「已经有人先到 7 杀」。缺省零输入 = 原地待命。
    if (curView.phase === "hub") return inputs;
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
          // 挨打的是自己：再补一记短促的贴脸闷响，听感上分得清打人和被打
          if (e.targetId === SELF_ID) audio.play("hitTaken", { power: e.power });
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
        // ---- 安全区 ----
        case "hubFocus":
          audio.play("uiMove");
          break;
        case "hubEquip":
          if (e.changed === false) break;
          audio.play("switchGlove");
          if (e.playerId === SELF_ID || e.id === SELF_ID) {
            const name = (gloveById[e.gloveId] && gloveById[e.gloveId].name) || e.gloveId;
            shell.toast(e.slot === "main" ? `主 掌 · ${name}` : `副 掌 · ${name}`, 1400);
          }
          break;
        case "hubLocked": {
          audio.play("uiBack");
          const glove = gloveById[e.gloveId];
          shell.toast(`${(glove && glove.name) || e.gloveId} 还没解锁 · ${unlockTextOf(glove, dataModule)}`, 1800);
          break;
        }
        case "hubPortalNear":
          if (!e.ready) shell.toast("传送门认掌不认人 · 先挑一只主掌", 1600);
          break;
        case "enterArena":
          if (e.playerId === SELF_ID || e.id === SELF_ID) enterArenaFx();
          break;
        case "enterHub":
          if (e.playerId === SELF_ID || e.id === SELF_ID) enterHubFx();
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
    // 连段之间还有冷却兜着；画面反馈仍是 HUD 那层去饱和 + 轻压暗，不加红晕。
    const stop = hitStopForEvents(view.events, SELF_ID);
    if (stop > 0) loop.hold(stop);
    const flash = hitFlashForEvents(view.events, SELF_ID);
    if (flash) shell.flashHit(flash);
  }

  /**
   * 相机重新架到角色身后。传送会改写 yaw，不同步的话过门后镜头在脸前。
   * pitch 缺省**保持玩家当前俯仰**（过门不再硬塞 0.3）；对齐完立即喂一帧，
   * 并给渲染器发机位吸附信号（snap 口存在才调，不存在整只 no-op）——
   * hub 与裂岛错开 ~120m，不吸附就会看一段弹簧跟随的镜头飞跃。
   */
  function alignCameraToSelf(pitch) {
    const self = curView ? (curView.players || []).find((p) => p.id === SELF_ID) : null;
    input.setLook(simYawToCameraYaw(self ? self.yaw : 0), typeof pitch === "number" ? pitch : undefined);
    feedRendererLook();
    snapLook(renderer);
  }

  /** 走道里挑的掌落盘，下次「直接进裂岛」和结算板的「再来一局」都用它。 */
  function rememberHubLoadout() {
    const hub = curView && curView.hub;
    if (!hub || !hub.mainGloveId) return;
    const next = { main: hub.mainGloveId, off: hub.offGloveId || hub.mainGloveId };
    save = updateSave({ loadout: next });
    lastLoadout = { ...(lastLoadout || {}), ...next };
    shell.setSave(save);
  }

  /** 穿过传送门：门内短过渡（淡场 + 门光），不上加载条。 */
  function enterArenaFx() {
    rememberHubLoadout();
    syncPhase("arena");
    shell.warp(240);
    alignCameraToSelf();
    tracker.reset();
    resultShown = false;
    audio.play("matchStart");
    shell.toast("裂 岛", 1200, true);
  }

  function enterHubFx() {
    syncPhase("hub");
    shell.warp(200);
    alignCameraToSelf();
    shell.toast("安 全 区 · 走道两侧挑掌", 1800);
  }

  /** phase 变了就同步输入层与外壳（大厅不出招、HUD 换脸、触控换钮）。 */
  function syncPhase(next) {
    input.setPhase(next);
    shell.setPhase(next);
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

    // 「再来一局」到底沿用哪副掌，按钮下面那行小字要报出来 —— 用的就是按下去时
    // 那条取值链（core/entry.js），不另算一遍，免得写的和真进局的不是同一副。
    const restartEntry = entryFor(ENTRY.RESTART);

    shell.showResult({
      won,
      reasonText,
      unlocked,
      restartLoadout: { main: restartEntry.main, off: restartEntry.off },
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
    return adaptView(raw, { selfId: SELF_ID, roster, gloveById, skinTable });
  }

  function startMatch(loadout) {
    lastLoadout = loadout;
    const skinId = normalizeSkinId(loadout.skinId ?? save.skinId, skinTable);
    // 存档里 loadout 只装手套，皮肤是平级字段（旧档缺省兼容见 core/storage.js）
    save = updateSave({ loadout: { main: loadout.main, off: loadout.off }, skinId });
    rng = makeRng((Date.now() & 0xffff) ^ 0x5eed);
    tracker.reset();
    resultShown = false;

    // 缺省进安全区。只有 2D 备选台上的「直接进裂岛」才带 skipHub。
    const skipHub = loadout.skipHub === true;
    // 走道才是选掌的地方：进 hub 时**不**预填主副掌，让 `portalReady` 从 false 起步，
    // 传送门先提示「先挑一只主掌」，挑完才放行（GOAL §6）。直通裂岛才吃存档配装。
    // sim 还没吃 skinId 的那一版会直接忽略这两个字段，壳层的 roster 仍会补上皮肤。
    const matchOpts = {
      gloveId: skipHub ? loadout.main : null,
      offhandId: skipHub ? loadout.off : null,
      botCount: 3,
      skinId,
      skins: skinTable.skins,
      phase: skipHub ? "arena" : "hub",
      // 台座的可选中状态跟着存档走：没解锁的掌看得见、选不中、显示解锁条件。
      unlocked: unlockedIdsFor(gloves, isUnlocked, save),
    };

    try {
      state = sim.createMatch({ seed: (Date.now() & 0x7fffffff) >>> 0, ...matchOpts });
    } catch (err) {
      console.error("[yizhang] createMatch 失败，退回占位模拟", err);
      state = fallbackSim.createMatch({ seed: 1, ...matchOpts });
      shell.setNotes([...degraded, { text: "src/sim.createMatch 抛错 · 已退回占位模拟", tone: "warn" }]);
    }

    const rawView = sim.getView(state);
    roster = createRoster(rawView, { selfId: SELF_ID, personaById, skinTable, skinId });
    curView = adaptView(rawView, { selfId: SELF_ID, roster, gloveById, skinTable });
    prevView = curView;
    if (fallbackAi.resetBots) fallbackAi.resetBots();
    if (ai.resetBots) ai.resetBots();

    setSpectator(false);
    shell.showMatch();
    // 大厅与裂岛用同一套 HUD/触控，只换脸；phase 由 sim 说了算。
    syncPhase(curView.phase === "arena" ? "arena" : "hub");
    shell.updateHub(curView);
    input.setEnabled(true);
    // 出生朝走道尽头（或台心）：把 sim 的初始 yaw 换算回相机方位角，开局镜头在人背后。
    // 俯仰保持输入层当前值（开局是缺省 0.32，回程/再来一局保留玩家自己的俯仰）。
    alignCameraToSelf();
    loop.setPaused(false);
    audio.unlock();
    audio.play(skipHub ? "matchStart" : "uiSelect");
    applyResize();
    startProbe();
  }

  /** 两个回程入口共用的取值链：上一局 → 存档 → 2D 配掌板（core/entry.js）。 */
  function entryFor(kind) {
    return resolveEntry(kind, {
      lastLoadout,
      save,
      menuLoadout: shell.menu.getLoadout(),
    });
  }

  /**
   * 结算「再 来 一 局」：**同一副掌直接回裂岛**（skipHub），不再赶人走一遍走道。
   * 这是它和「回安全区换掌」唯一也是全部的区别（Round 1 遗留 6）。
   */
  function restartArena() {
    startMatch(entryFor(ENTRY.RESTART));
    // 两个回程入口都会把人瞬移到另一处出生点，相机是阻尼跟随的，中间那几百毫秒
    // 会看见镜头从上一局的位置飞过去。用穿门那道淡场盖住（同一套表现，仍然不上
    // 加载条）—— 走道→裂岛的 enterArenaFx 早就是这么做的。
    shell.warp(280);
  }

  /** 回程：重开一局并落在安全区。掌记在存档里，但走道上要重新挑，挑完门才放行。 */
  function returnToHub() {
    startMatch(entryFor(ENTRY.HUB));
    // 裂岛与走道横向错开 120 米，回程这一下镜头要飞过去：淡场盖住（同 restartArena）
    shell.warp(320);
    // 结算板上那行小字承诺的是「主副掌清空」：落地这一刻把同一句话再说一遍，
    // 免得玩家以为掌位是掉了 bug（存档里的配装还在，只是走道上要重新挑）。
    shell.toast("安 全 区 · 主副掌已解下，走道两侧重挑", 2000);
  }

  function quitToMenu() {
    loop.setPaused(true);
    input.setEnabled(false);
    input.releasePointerLock();
    setSpectator(true);
    state = null;
    curView = null;
    prevView = null;
    syncPhase("arena");
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
        if (curView.phase !== "hub") tracker.feed(curView.events, curView);
      }
      // 安全区里对局还没开始：倒计时归零 / Bot 互刷都不该弹结算板。
      // 传送时 enterArena 会把 match 重置，那之后 over 才算数。
      if (curView.over && curView.phase !== "hub") finishMatch();
    },
    draw(alpha, info) {
      if (probe && !info.paused) probe.feed(performance.now() / 1000);
      // 视角先喂再画：观战/主菜单也照喂，镜头不会在没有本地玩家时卡住上下视角。
      feedRendererLook();
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
        // 兜底：phase 万一没走事件就变了（回放 / 外部改 state），HUD 也别停在旧脸上
        if (shell.phase !== curView.phase) syncPhase(curView.phase);
        shell.updateHud(curView, SELF_ID);
        if (curView.phase === "hub") shell.updateHub(curView);
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

  // 开局直接落在安全区：不再先弹一块 2D 平面网格。存档里的配装带进走道当初始装，
  // 玩家可以沿走道换掉；`.yz-home` 从暂停面板的「配 掌 面 板」进得去。
  try {
    startMatch({ ...shell.menu.getLoadout(), skipHub: false });
  } catch (err) {
    console.error("[yizhang] 进入安全区失败，退回 2D 配掌台", err);
    shell.setNotes([...degraded, { text: `进入安全区失败：${err.message} · 已退回 2D 配掌台`, tone: "warn" }]);
    quitToMenu();
  }

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
    restartArena,
    returnToHub,
    quitToMenu,
    togglePause,
    /** 手测/探针用：读一帧视角，并看它喂到了渲染器的哪个 setter 上。 */
    feedLook: feedRendererLook,
    /** 手测/探针用：当前视角模式（locked = 固定人物视角）。 */
    get lookMode() {
      return input.getLookMode();
    },
    get phase() {
      return curView ? curView.phase : null;
    },
    get hub() {
      return curView ? curView.hub : null;
    },
  };
}

boot().catch((err) => fatal("引导阶段异常，请查看控制台。", err));
