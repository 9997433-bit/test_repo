/**
 * 三国 · 冰河时代 — 启动与装配。
 *
 * 数据流：
 *   engine/loop.js  ── tick ──►  bridge/actions.js  ── 写 ──►  state.js 的嵌套权威状态
 *                                      │                              │
 *                                      └── systems/{climate,city,economy,population,quests} ──┘
 *   每帧 bridge/view.js 把嵌套状态投影成扁平视图，喂给 render/canvas.js 与 ui/*。
 *
 * 所有外部模块都走「防御性动态 import」：
 *   · state.js + systems/city.js + bridge 齐备 → 交给 systems 推进（正常路径）
 *   · 任一缺失或抛错          → 回落到本文件末尾的极简内置内核，保证页面不白屏
 */

import { createCityRenderer, CITY_LAYOUT } from "./render/canvas.js";
import { createHud } from "./ui/hud.js";
import { createPanels } from "./ui/panels.js";
import { createTutorial } from "./ui/tutorial.js";

/* ============================================================
   0. 防御性动态 import
   ============================================================ */
async function tryImport(path) {
  try {
    const m = await import(path);
    return m && typeof m === "object" ? m : null;
  } catch (err) {
    console.warn(`[sanguo] 模块不可用：${path}`, err?.message || err);
    return null;
  }
}
function pickFn(mod, ...names) {
  if (!mod) return null;
  for (const n of names) if (typeof mod[n] === "function") return mod[n];
  return null;
}

const ext = {
  config: await tryImport("./config.js"),
  loop: await tryImport("./engine/loop.js"),
  save: await tryImport("./engine/save.js"),
  state: await tryImport("./state.js"),
  city: await tryImport("./systems/city.js"),
  economy: await tryImport("./systems/economy.js"),
  climate: await tryImport("./systems/climate.js"),
  population: await tryImport("./systems/population.js"),
  heroes: await tryImport("./systems/heroes.js"),
  quests: await tryImport("./systems/quests.js"),
  dataHeroes: await tryImport("./data/heroes.js"),
  dataBuildings: await tryImport("./data/buildings.js"),
  dataQuests: await tryImport("./data/quests.js"),
  view: await tryImport("./bridge/view.js"),
  actions: await tryImport("./bridge/actions.js"),
};

const CFG = ext.config || {};
const TICK_MS = CFG.TICK_MS ?? 250;
const TICKS_PER_DAY = CFG.TICKS_PER_DAY ?? 16;
const clamp = CFG.clamp ?? ((n, a, b) => Math.max(a, Math.min(b, n)));
const nowMs = () => (typeof performance?.now === "function" ? performance.now() : Date.now());

/* ============================================================
   1. 数据表
   ============================================================ */
function buildBuildingCatalog() {
  const base = ext.city?.DEFAULT_BUILDINGS ?? {};
  const extra = ext.dataBuildings?.BUILDINGS ?? ext.dataBuildings?.default;
  const merge = pickFn(ext.city, "mergeCatalog");
  if (merge && extra) {
    try {
      return merge(base, extra);
    } catch {
      /* 数据表结构异常时用内置目录 */
    }
  }
  return base;
}

/**
 * data/heroes.js 是完整名录，systems/heroes.js 的 FALLBACK 只是保底。
 * 两份的 id 写法不同（`liu_bei` vs `liubei`），直接拼接会让卡池里出现两个刘备，
 * 所以交给 bridge/view.js 的 dedupeHeroCatalog 按人物合并，保留资料更全的一条。
 */
function buildHeroCatalog() {
  const fallback = Array.isArray(ext.heroes?.FALLBACK_HEROES) ? ext.heroes.FALLBACK_HEROES : [];
  const table = ext.dataHeroes?.HEROES ?? ext.dataHeroes?.default;
  const list = Array.isArray(table) ? table.filter((h) => h && h.id && h.name) : [];
  const merged = [...list, ...fallback];
  const dedupe = ext.view?.dedupeHeroCatalog;
  const out = typeof dedupe === "function" ? dedupe(merged) : merged;
  return out.length ? out : fallback;
}

function buildQuestCatalog() {
  const table = ext.dataQuests?.QUESTS ?? ext.dataQuests?.default;
  return Array.isArray(table) && table.length ? table : null;
}

/* ============================================================
   2. 内核选择
   ============================================================ */
const bridgeReady = !!(
  pickFn(ext.state, "createInitialState") &&
  pickFn(ext.city, "tickCity") &&
  typeof ext.view?.projectView === "function" &&
  typeof ext.actions?.tickAll === "function"
);

/**
 * 只允许存在一个内核：systems 可用就交给它，装配阶段抛错才退回内置内核，
 * 两者的 tick 绝不会同时跑。
 */
function selectEngine() {
  if (!bridgeReady) return createFallbackEngine();
  try {
    return createSystemsEngine();
  } catch (err) {
    console.warn("[sanguo] systems 装配失败，退回内置内核", err?.message || err);
    return createFallbackEngine();
  }
}

const engine = selectEngine();

/**
 * 正常路径：systems 推进权威状态，bridge 负责投影与动作。
 */
function createSystemsEngine() {
  const V = ext.view;
  const A = ext.actions;
  const catalog = buildBuildingCatalog();
  const heroCatalog = buildHeroCatalog();
  const questCatalog = buildQuestCatalog();

  const saveGame = pickFn(ext.save, "saveGame");
  const loadGame = pickFn(ext.save, "loadGame");
  const clearSave = pickFn(ext.save, "clearSave");
  const exportSave = pickFn(ext.save, "exportSave");
  const importSave = pickFn(ext.save, "importSave");
  const adoptState = pickFn(ext.actions, "adoptState");

  let restored = null;
  try {
    restored = loadGame?.() ?? null;
  } catch (err) {
    console.warn("[sanguo] 读档失败，按新游戏处理", err?.message || err);
  }
  const fresh = () => ext.state.createInitialState(Date.now() % 2147483647);
  const ctx = A.createContext({
    state: restored ?? fresh(),
    catalog,
    heroCatalog,
    questCatalog,
    // 领赏入口已接（HUD 托盘 + 功业簿面板），任务停在 ready 等玩家自己点
    autoClaimQuests: false,
  });

  let paused = false;
  let speed = 1;
  let bannerUntil = 0;

  const canonical = (key) =>
    typeof V.canonicalBuildingId === "function" ? V.canonicalBuildingId(key, catalog) : key;

  return {
    kind: "systems",
    loaded: !!restored,
    note: "systems 接管：climate → city → economy → population → quests",
    get raw() {
      return ctx.state;
    },
    get speed() {
      return paused ? 0 : speed;
    },
    setSpeed(n) {
      paused = n === 0;
      if (n > 0) speed = n;
    },
    view() {
      return V.projectView(ctx.state, {
        catalog,
        heroCatalog,
        paused,
        speed,
        blizzardBanner: nowMs() < bannerUntil,
        quests: A.listQuests(ctx),
        troopCap: A.troopCap(ctx),
      });
    },
    tick() {
      const events = A.tickAll(ctx) || [];
      for (const e of events) if (e.kind === "blizzard") bannerUntil = nowMs() + 4200;
      return events;
    },
    layoutKeyOf: (key) => V.layoutKeyOf?.(canonical(key)) ?? null,
    buildingInfo: (key) => V.buildingInfo(ctx.state, key, catalog),
    upgrade: (key) => A.upgrade(ctx, key),
    addWorker: (key, delta) => A.addWorker(ctx, key, delta),
    setFuel: (mode) => A.setFuelMode(ctx, mode),
    ticketCost: () => A.ticketCost(),
    buyTicket: () => A.buyTicket(ctx),
    recruit: (n) => A.recruit(ctx, n),
    targets: () => A.targets(ctx),
    previewBattle: (t, h, n) => A.previewRaid(ctx, t, h, n),
    battle: (t, h, n) => A.raid(ctx, t, h, n),
    techList: () => A.techList(ctx),
    research: (id) => A.research(ctx, id),
    claimQuest: (id) => A.claimQuest(ctx, id),
    save() {
      try {
        saveGame?.(ctx.state);
      } catch (err) {
        console.warn("[sanguo] 存档失败", err?.message || err);
      }
    },
    canExport: !!exportSave,
    canImport: !!(importSave && adoptState),
    /** 导出为可下载的 JSON 文本（HUD 负责生成文件）。 */
    exportSave() {
      return exportSave(ctx.state);
    },
    /** 导入一份存档文本；结构不合法时保持当前局面不变。 */
    importSave(text) {
      const gated = pickFn(ext.actions, "importSave");
      if (gated) {
        const r = gated(ctx, text);
        if (r?.ok) {
          paused = false;
          bannerUntil = 0;
          try { saveGame?.(ctx.state); } catch (err) {
            console.warn("[sanguo] 导入后存档失败", err?.message || err);
          }
        }
        return r && typeof r === "object" ? r : { ok: false, reason: "导入失败" };
      }
      let next;
      try {
        next = importSave(text);
      } catch (err) {
        return { ok: false, reason: err?.message || "存档无法解析" };
      }
      adoptState(ctx, next);
      paused = false;
      bannerUntil = 0;
      try { saveGame?.(ctx.state); } catch (err) {
        console.warn("[sanguo] 导入后存档失败", err?.message || err);
      }
      return { ok: true };
    },
    restart() {
      try {
        clearSave?.();
      } catch {
        /* 隐私模式下忽略 */
      }
      A.restart(ctx, Date.now() % 2147483647);
      paused = false;
      bannerUntil = 0;
    },
  };
}

/* ============================================================
   3. 装配
   ============================================================ */
const app = document.getElementById("app");
const canvas = document.getElementById("city-canvas");
const scene = document.getElementById("scene");
const tooltip = document.getElementById("scene-tooltip");

const renderer = createCityRenderer({ canvas });
renderer.resize();
renderer.recenter();

const hud = createHud({
  onSpeed: (n) => applySpeed(n),
  onOpen: (kind) => panels.open(kind),
  onHero: () => panels.open("recruit"),
  onRestart: () => restartGame(),
  onClaimQuest: (id) => claimQuest(id),
  // 内置内核没有权威存档，给 null 让 HUD 自己把导入导出按钮藏起来
  onExport: engine.canExport ? () => engine.exportSave() : null,
  onImport: engine.canImport ? (text) => importSaveText(text) : null,
});

let lastView = engine.view();

const game = {
  get state() {
    return lastView;
  },
  buildingInfo: (k) => engine.buildingInfo(k),
  upgrade: (k) => {
    const r = engine.upgrade(k);
    if (r.ok) renderer.pulse(engine.layoutKeyOf?.(k) ?? k);
    return r;
  },
  addWorker: (k, d) => engine.addWorker(k, d),
  setFuel: (m) => engine.setFuel(m),
  ticketCost: () => engine.ticketCost(),
  buyTicket: () => engine.buyTicket(),
  recruit: (n) => engine.recruit(n),
  targets: () => engine.targets(),
  previewBattle: (t, h, n) => engine.previewBattle(t, h, n),
  battle: (t, h, n) => engine.battle(t, h, n),
  techList: () => engine.techList(),
  research: (id) => engine.research(id),
  claimQuest: (id) => claimQuest(id),
};

const panels = createPanels({ game, hud, onClaimQuest: (id) => claimQuest(id) });

const tutorial = createTutorial({
  getBuildingRect: (key) => {
    const r = renderer.rectOf(key);
    if (!r) return null;
    const box = canvas.getBoundingClientRect();
    return { x: box.left + r.x, y: box.top + r.y, width: r.width, height: r.height };
  },
  onDone: () => hud.toast("愿君守得住这一炉火。", "good", 3200),
});

/* ── 存档：统一走 engine/save.js 的 SAVE_KEY ───────────────── */
setInterval(() => engine.save(), 8000);
window.addEventListener("beforeunload", () => engine.save());

/* ── 事件：寒潮 / 任务 / 败亡 ─────────────────────────────── */
let gameOverShown = false;

function onEvent(e) {
  if (!e) return;
  switch (e.kind) {
    case "blizzard":
      hud.toast(e.text, "bad", 3400);
      break;
    case "clear":
      hud.toast(e.text, "good", 2400);
      break;
    case "quest":
      hud.toast(e.text, "good", 2800);
      break;
    case "gameover":
      enterGameOver(e.reason);
      break;
    default:
      break;
  }
}

/**
 * 败亡收尾。走状态而非单次事件：读档读进一局已经败亡的存档时，
 * 不会有 tick 事件通知，这里在每帧兜底检查（gameOverShown 保证只触发一次）。
 */
function enterGameOver(reason) {
  if (gameOverShown) return;
  gameOverShown = true;
  applySpeed(0);
  app.dataset.gameover = reason || "1";
  hud.toast(`${gameOverText(reason)} · 按 N 重开一局`, "bad", 12000);
}

function gameOverText(reason) {
  if (reason === "morale") return "民心尽失，流民四散，城池陷落";
  if (reason === "extinct") return "最后一名子民倒在雪中，城池湮没";
  return "拾薪城已不复存在";
}

function restartGame() {
  engine.restart();
  gameOverShown = false;
  delete app.dataset.gameover;
  refresh();
  hud.toast("重立拾薪城，再撑一个冬天。", "info", 3000);
}

/** 立刻重投影一帧：动作改了权威状态后，不必等下一帧才反映到 HUD / 面板。 */
function refresh() {
  lastView = engine.view();
  hud.update(lastView);
  panels.tick(lastView);
  return lastView;
}

/* ── 功业簿：托盘与面板的「领赏」都走这里 ─────────────────── */
function claimQuest(id) {
  const r = engine.claimQuest(id) || { ok: false, reason: "任务系统未接通" };
  if (!r.ok) return r;
  refresh();
  engine.save();
  return r;
}

/** 导入存档：失败时把原因交回 HUD 提示，成功则整局切到新状态。 */
function importSaveText(text) {
  const r = engine.importSave(text);
  if (!r.ok) return r;
  gameOverShown = false;
  delete app.dataset.gameover;
  panels.close();
  refresh();
  applySpeed(1);
  return r;
}

/* ── 输入：平移 / 缩放 / 选取 ─────────────────────────────── */
let dragging = false;
let dragMoved = 0;
let lastPt = null;

function localPt(e) {
  const box = canvas.getBoundingClientRect();
  return { x: e.clientX - box.left, y: e.clientY - box.top };
}

scene.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  // 场景内的浮层控件（回正视角等）不参与拖拽，否则指针捕获会吞掉它们的 click
  if (e.target instanceof Element && e.target.closest("button, a, input, select, [data-nodrag]")) return;
  dragging = true;
  dragMoved = 0;
  lastPt = localPt(e);
  scene.classList.add("is-panning");
  scene.setPointerCapture(e.pointerId);
});

scene.addEventListener("pointermove", (e) => {
  const p = localPt(e);
  if (dragging && lastPt) {
    const dx = p.x - lastPt.x;
    const dy = p.y - lastPt.y;
    dragMoved += Math.abs(dx) + Math.abs(dy);
    renderer.panBy(dx, dy);
    lastPt = p;
    tooltip.hidden = true;
    return;
  }
  const key = renderer.setHover(p.x, p.y);
  scene.classList.toggle("is-hot", !!key);
  updateTooltip(key);
});

scene.addEventListener("pointerup", (e) => {
  if (!dragging) return;
  dragging = false;
  scene.classList.remove("is-panning");
  try {
    scene.releasePointerCapture(e.pointerId);
  } catch {
    /* ignore */
  }
  if (dragMoved < 6) {
    const p = localPt(e);
    const key = renderer.pickAt(p.x, p.y);
    if (key) {
      renderer.pulse(key);
      panels.open("building", key);
    }
  }
});

scene.addEventListener("pointerleave", () => {
  renderer.setHover(null);
  scene.classList.remove("is-hot");
  tooltip.hidden = true;
});

scene.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const p = localPt(e);
    renderer.zoomAt(p.x, p.y, e.deltaY > 0 ? 0.9 : 1.11);
  },
  { passive: false },
);

document.getElementById("btn-recenter").addEventListener("click", (e) => {
  e.stopPropagation();
  renderer.recenter();
});

function updateTooltip(key) {
  if (!key) {
    tooltip.hidden = true;
    return;
  }
  const info = engine.buildingInfo(key);
  const anchor = renderer.anchorOf(key);
  if (!info || !anchor) {
    tooltip.hidden = true;
    return;
  }
  const state = info.constructing
    ? `营建中 ${Math.round(info.progress * 100)}%`
    : info.level > 0
      ? `${info.maxWorkers > 0 ? `工人 <b>${info.workers}/${info.maxWorkers}</b> · ` : ""}${info.mainOutput || info.tag}`
      : "尚未营建";
  tooltip.innerHTML = `
    <div><span class="tip__name">${info.icon} ${info.name}</span><span class="tip__lv">Lv ${info.level}</span></div>
    <div class="tip__row">${state}</div>
    <div class="tip__cta">点击查看与升级</div>`;
  tooltip.style.left = `${clamp(anchor.x, 90, scene.clientWidth - 90)}px`;
  tooltip.style.top = `${clamp(anchor.y, 60, scene.clientHeight - 20)}px`;
  tooltip.hidden = false;
}

/* ── 键盘 ─────────────────────────────────────────────────── */
window.addEventListener("keydown", (e) => {
  if (e.target instanceof HTMLInputElement) return;
  switch (e.key) {
    case " ":
      e.preventDefault();
      applySpeed(engine.speed === 0 ? 1 : 0);
      break;
    case "1": applySpeed(1); break;
    case "2": applySpeed(2); break;
    case "3": applySpeed(4); break;
    case "Escape": panels.close(); break;
    case "r": case "R": renderer.recenter(); break;
    case "h": case "H": tutorial.start(true); break;
    case "n": case "N": if (lastView.gameOver) restartGame(); break;
    default: return;
  }
});

/* ── 尺寸 ─────────────────────────────────────────────────── */
const ro = new ResizeObserver(() => renderer.resize());
ro.observe(scene);
window.addEventListener("orientationchange", () => setTimeout(() => renderer.resize(), 120));

/* ── 主循环 ───────────────────────────────────────────────── */
let hudAcc = 0;

function runTick() {
  const events = engine.tick();
  if (Array.isArray(events)) for (const e of events) onEvent(e);
}

/**
 * 画布仍按 CITY_LAYOUT 的旧 key 索引美术资源，
 * 这里把权威 id 换成 layoutKey，并只画已建成或已解锁的地块。
 */
function toRenderView(v) {
  const buildings = [];
  for (const b of v.buildings || []) {
    const key = b.layoutKey;
    if (!key || !CITY_LAYOUT[key] || b.visible === false) continue;
    buildings.push({ key, level: b.level, workers: b.workers, constructing: b.constructing });
  }
  return { ...v, buildings };
}

/** 渲染一帧：视觉时间与逻辑倍速解耦，暂停时仍保留微弱的雪与火焰动态。 */
function drawFrame(realDt) {
  const speed = engine.speed;
  lastView = engine.view();
  if (lastView.gameOver) enterGameOver(lastView.gameOverReason);
  const visDt = realDt * (speed === 0 ? 0.4 : Math.min(2.2, 0.8 + speed * 0.4));
  renderer.render(visDt, toRenderView(lastView));

  hudAcc += realDt;
  if (hudAcc >= 0.1) {
    hudAcc = 0;
    hud.update(lastView);
    panels.tick(lastView);
    if (renderer.hover) updateTooltip(renderer.hover);
  }
}

// 优先使用 engine/loop.js（定步长 + 倍速 + 追帧上限），否则退回内置 rAF 循环
const makeLoop = pickFn(ext.loop, "createLoop");
let engineLoop = null;
if (makeLoop) {
  try {
    const l = makeLoop({
      tickMs: TICK_MS,
      speed: engine.speed,
      onTick: () => runTick(),
      onFrame: (c) => drawFrame(Math.min(0.1, c?.dtSec ?? 0.016)),
      onError: (err, phase) => console.warn(`[sanguo] loop ${phase} 出错`, err),
    });
    if (l && typeof l.start === "function" && typeof l.setSpeed === "function") {
      l.start();
      engineLoop = l;
    }
  } catch (err) {
    console.warn("[sanguo] engine/loop.js 不可用，改用内置循环", err);
  }
}

if (!engineLoop) {
  let acc = 0;
  let lastTs = nowMs();
  const frame = (now) => {
    const realDt = Math.min(0.1, (now - lastTs) / 1000);
    lastTs = now;
    acc += realDt * 1000 * engine.speed;
    let guard = 0;
    while (acc >= TICK_MS && guard++ < 24) {
      acc -= TICK_MS;
      runTick();
    }
    drawFrame(realDt);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/** 统一的流速入口：内核记录状态，外部 loop 负责实际时间缩放。 */
function applySpeed(n) {
  engine.setSpeed(n);
  engineLoop?.setSpeed(engine.speed);
  hud.update(engine.view());
}

/* ── 启动收尾 ─────────────────────────────────────────────── */
try {
  hud.update(lastView);
} catch (err) {
  // 首帧刷 HUD 失败也要撤掉启动遮罩，否则玩家只看得到「正在点燃火炉…」
  console.warn("[sanguo] 首帧 HUD 刷新失败", err?.message || err);
}
app.dataset.boot = "ready";

if (engine.loaded) {
  hud.toast(`读取存档 · 第 ${lastView.day} 日`, "info", 2600);
} else {
  setTimeout(() => tutorial.start(false), 700);
}

console.info(
  `[三国·冰河时代] ${engine.note}；` +
    `建筑表 ${Object.keys(buildBuildingCatalog()).length} 项 · 武将名录 ${buildHeroCatalog().length} 人 · ` +
    `主循环：${engineLoop ? "engine/loop.js" : "内置 rAF"}`,
);

// 供手工测试与调试
window.__sanguo = {
  engine,
  renderer,
  hud,
  panels,
  tutorial,
  game,
  CITY_LAYOUT,
  applySpeed,
  restart: restartGame,
  claimQuest,
  exportSave: () => (engine.canExport ? engine.exportSave() : null),
  importSave: importSaveText,
  get view() {
    return lastView;
  },
  get raw() {
    return engine.raw;
  },
};

/* ============================================================
   4. 内置内核（仅在 state.js / systems/city.js / bridge 缺失时启用）
   ------------------------------------------------------------
   只负责「不白屏」：能看城、能派工、能升级，玩法深度交给 systems。
   ============================================================ */
function createFallbackEngine() {
  const ORDER = Object.keys(CITY_LAYOUT);
  const PER = {
    lumber: { wood: 4.2 }, hunter: { food: 3.9 }, coal: { coal: 2.6 }, iron: { iron: 1.9 },
    kitchen: { food: 2.1 },
  };
  const SLOTS = { lumber: 3, hunter: 3, coal: 2, iron: 2, kitchen: 2, barracks: 2, storage: 1, clinic: 2, academy: 2, recruit: 1 };
  const NAMES = {
    furnace: "火炉", house: "民居", lumber: "伐木场", hunter: "猎人小屋", coal: "煤矿",
    storage: "仓库", iron: "铁矿", barracks: "兵营", recruit: "招贤馆", kitchen: "厨房",
    clinic: "医馆", academy: "太学院", wall: "城墙",
  };
  const missing = { ok: false, reason: "核心模块缺失，该功能暂不可用" };

  let S = null;
  let paused = false;
  let speed = 1;
  let logSeq = 0;

  function reset() {
    S = {
      day: 1,
      tickInDay: 0,
      resources: { food: 320, wood: 420, coal: 140, iron: 60 },
      buildings: ORDER.map((key) => ({ key, level: key === "furnace" ? 1 : 0, workers: 0 })),
      pop: 12,
      morale: 70,
      log: [],
    };
    push("核心模块未就绪，当前为最小可玩内核。", "warn");
  }
  function push(text, kind = "info") {
    S.log.push({ id: logSeq++, day: S.day, text, kind });
    if (S.log.length > 60) S.log.shift();
  }
  const at = (key) => S.buildings.find((b) => b.key === key) || { key, level: 0, workers: 0 };
  const assigned = () => S.buildings.reduce((s, b) => s + b.workers, 0);
  const capacity = () => {
    const c = 450 + at("storage").level * 500;
    return { food: c, wood: c, coal: c, iron: c };
  };
  const temp = () => 4 - Math.min(6, S.day * 0.04) + at("furnace").level * 3.2;
  function rates() {
    const out = { food: 0, wood: 0, coal: 0, iron: 0 };
    for (const b of S.buildings) {
      const per = PER[b.key];
      if (!per || b.level <= 0) continue;
      for (const [k, v] of Object.entries(per)) out[k] += v * b.level * (0.4 + 0.6 * (b.workers / Math.max(1, SLOTS[b.key] || 1)));
    }
    out.food -= S.pop * 0.29;
    out.wood -= at("furnace").level * 1.28;
    return out;
  }
  function cost(key) {
    const lv = at(key).level;
    const base = key === "furnace" ? 90 : 45;
    return { wood: Math.ceil(base * Math.pow(1.55, lv)), food: Math.ceil(base * 0.5 * Math.pow(1.5, lv)) };
  }

  reset();

  return {
    kind: "fallback",
    loaded: false,
    note: "state.js / systems 缺失，暂由内置最小内核推进",
    get raw() {
      return S;
    },
    get speed() {
      return paused ? 0 : speed;
    },
    setSpeed(n) {
      paused = n === 0;
      if (n > 0) speed = n;
    },
    tick() {
      const dt = 1 / TICKS_PER_DAY;
      const cap = capacity();
      const r = rates();
      for (const k of Object.keys(S.resources)) {
        S.resources[k] = clamp(S.resources[k] + r[k] * dt, 0, cap[k]);
      }
      S.morale = clamp(S.morale + (temp() > 0 ? 0.02 : -0.15) * dt * 16, 0, 100);
      S.tickInDay += 1;
      if (S.tickInDay >= TICKS_PER_DAY) {
        S.tickInDay = 0;
        S.day += 1;
      }
      return [];
    },
    view() {
      const t = temp();
      return {
        day: S.day,
        dayProgress: S.tickInDay / TICKS_PER_DAY,
        paused,
        speed,
        cityName: "拾薪城",
        lord: CFG.DEFAULT_LORD ?? { name: "流民县令" },
        resources: { ...S.resources },
        capacity: capacity(),
        rates: rates(),
        temp: t,
        outsideTemp: t - at("furnace").level * 3.2,
        furnaceLit: true,
        furnaceHeat: at("furnace").level * 3.2,
        furnaceHeatNext: (at("furnace").level + 1) * 3.2,
        fuelDays: S.resources.wood / Math.max(0.01, at("furnace").level * 1.28),
        fuelMode: "auto",
        morale: S.morale,
        population: { current: S.pop, cap: 24, sick: 0, hungry: 0, total: S.pop, idle: S.pop - assigned(), assigned: assigned(), housing: 24 },
        blizzard: 0,
        blizzardDaysLeft: 0,
        blizzardIn: null,
        blizzardBanner: false,
        blizzardBannerSub: "",
        buildings: S.buildings.map((b) => ({ ...b, id: b.key, layoutKey: b.key, visible: true, maxWorkers: SLOTS[b.key] || 0, constructing: false, progress: 0 })),
        heroes: [],
        troops: 0,
        troopCap: 0,
        army: { infantry: 0, cavalry: 0, archer: 0, wounded: 0 },
        recruitTickets: 0,
        quests: [],
        log: S.log.slice(),
        tech: {},
        stats: {},
        gameOver: false,
        gameOverReason: "",
        villagerCount: 10,
      };
    },
    layoutKeyOf: (key) => key,
    buildingInfo(key) {
      if (!CITY_LAYOUT[key]) return null;
      const b = at(key);
      const art = CITY_LAYOUT[key];
      const maxLevel = key === "furnace" ? 20 : Math.max(1, at("furnace").level);
      const c = cost(key);
      const afford = Object.entries(c).every(([k, v]) => S.resources[k] >= v);
      return {
        key, id: key, layoutKey: key,
        name: NAMES[key] || key, icon: art.icon || "🏚", tag: "城中设施", desc: "核心模块缺失，仅提供最小信息。",
        level: b.level, maxLevel, workers: b.workers, maxWorkers: SLOTS[key] || 0,
        constructing: false, progress: 0,
        cost: c, production: {}, nextProduction: {}, extraGains: [],
        mainOutput: "—", heatUse: 0,
        canUpgrade: b.level < maxLevel && afford,
        blockedReason: b.level >= maxLevel ? "已达上限" : afford ? "" : "物资不足",
        capReason: "升级火炉可解锁更高等级。",
      };
    },
    upgrade(key) {
      const info = this.buildingInfo(key);
      if (!info) return { ok: false, reason: "无此建筑" };
      if (!info.canUpgrade) return { ok: false, reason: info.blockedReason || "无法升级" };
      for (const [k, v] of Object.entries(info.cost)) S.resources[k] -= v;
      at(key).level += 1;
      push(`${info.name} 升至 ${at(key).level} 级`, "good");
      return { ok: true, name: info.name, level: at(key).level };
    },
    addWorker(key, delta) {
      const b = at(key);
      const max = SLOTS[key] || 0;
      if (max <= 0) return { ok: false, reason: "此建筑无需派工" };
      const next = b.workers + Math.trunc(delta);
      if (next < 0) return { ok: false, reason: "已无工人" };
      if (next > max) return { ok: false, reason: "工位已满" };
      if (delta > 0 && assigned() >= S.pop) return { ok: false, reason: "已无闲置丁口" };
      b.workers = next;
      return { ok: true };
    },
    setFuel: () => ({ ok: true }),
    ticketCost: () => ({ food: 120, iron: 60 }),
    buyTicket: () => missing,
    recruit: () => missing,
    targets: () => [],
    previewBattle: () => missing,
    battle: () => missing,
    techList: () => [],
    research: () => missing,
    claimQuest: () => missing,
    // 内置内核的状态不是权威结构，导出的档 systems 内核读不回来，索性不给入口
    canExport: false,
    canImport: false,
    exportSave: () => null,
    importSave: () => missing,
    save() {},
    restart() {
      reset();
    },
  };
}
