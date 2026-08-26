import { createStore, addInv } from "./core/store.js";
import { createInitialState, createInitialUi, advanceTime, levelFor, TUTORIAL_TOTAL } from "./core/engine.js";
import { writeSave, readSave } from "./core/save.js";
import { tickPlots, till, plant, harvest, expandPlot } from "./systems/farm/index.js";
import { enqueueJob, collectJob, feedAnimal, unlockSlot, tickProduction } from "./systems/production/index.js";
import { deliverWish, inviteGuest, cook, build, petPlay, tickVillage, refreshWishes } from "./systems/village/index.js";
import { CROPS, RECIPES } from "./data/index.js";
import { render } from "./ui/screens.js";
import { chirp, fanfare, setMuted, resumeAudio } from "./audio/sfx.js";
import "./styles/tokens.css";
import "./styles/layout.css";

const TICK_MS = 100;
const AUTOSAVE_MS = 15_000;

let fxSeq = 0;

/* ---------- reducer 辅助 ---------- */

function withUi(state, patch) {
  return { ...state, ui: { ...createInitialUi(), ...(state.ui || {}), ...patch } };
}

function withFx(state, kind) {
  fxSeq += 1;
  return withUi(state, { fx: { kind, n: fxSeq } });
}

function toast(state, text, tone = "bad", fxKind) {
  fxSeq += 1;
  return withUi(state, {
    toast: { text, tone, at: Date.now() },
    fx: { kind: fxKind || (tone === "bad" ? "nope" : "ui"), n: fxSeq },
  });
}

/** 系统返回 { ok:false, reason } 时只飘字，不写进闲话本。 */
function applyResult(state, result, fxKind) {
  if (!result) return state;
  if (result.ok === false) return toast(state, result.reason || "这会儿做不了");
  return withFx(result.state || result, fxKind);
}

/** 引导只前进不后退，玩家跳步操作也算完成。 */
function advanceTutorial(state, minStep) {
  const step = state.meta.tutorialStep || 0;
  if (step >= minStep) return state;
  return { ...state, meta: { ...state.meta, tutorialStep: Math.min(minStep, TUTORIAL_TOTAL) } };
}

/**
 * production 的 collectJob 只认配方单，喂牲口生成的 job（kind:"livestock"）
 * 没有配方，会让它抛错。这里按 job 自己带的 productId/qty/xp 兜底收取；
 * 等 production 认了这种活，上面的 collectJob 就不会再抛，这段自然走不到。
 */
function collectLivestock(state, { buildingId, slot }) {
  const ofBuilding = (state.jobs || []).filter((j) => j.buildingId === buildingId);
  const job = typeof slot === "string" ? (state.jobs || []).find((j) => j.id === slot) : ofBuilding[slot];
  if (!job) return { ok: false, reason: "没有这单活", state };
  if (job.status !== "done") return { ok: false, reason: "还在忙", state };
  if (job.kind !== "livestock" || !job.productId) return { ok: false, reason: "这单活收不上来", state };
  let next = addInv(state, job.productId, job.qty || 1);
  next = {
    ...next,
    meta: { ...next.meta, xp: next.meta.xp + (job.xp || 0) },
    jobs: next.jobs.filter((j) => j.id !== job.id),
  };
  return { ok: true, state: next };
}

function applyAction(state, action) {
  const { type, payload = {} } = action;

  if (type === "meta/tick") {
    let s = advanceTime(state, payload.dt).state;
    s = tickPlots(s, payload.dt);
    s = tickProduction(s, payload.dt);
    s = tickVillage(s);
    const level = levelFor(s.meta.xp);
    if (level > s.meta.level) {
      fxSeq += 1;
      s = {
        ...s,
        meta: { ...s.meta, level },
        log: [`小镇升到 Lv.${level}，图纸本上又亮了几张。`, ...s.log].slice(0, 40),
        ui: { ...createInitialUi(), ...(s.ui || {}), fx: { kind: "level", n: fxSeq } },
      };
    } else if (level !== s.meta.level) {
      s = { ...s, meta: { ...s.meta, level } };
    }
    return s;
  }

  if (type === "farm/till") {
    const plot = state.plots.find((p) => p.id === payload.plotId);
    if (!plot) return state;
    if (plot.status !== "untilled" && plot.status !== "wilted") return toast(state, "这块地不用再翻了");
    return advanceTutorial(applyResult(state, { ok: true, state: till(state, payload) }, "till"), 1);
  }
  if (type === "farm/plant") {
    const res = plant(state, payload);
    return res.ok ? advanceTutorial(applyResult(state, res, "plant"), 2) : applyResult(state, res);
  }
  if (type === "farm/harvest") {
    const res = harvest(state, payload);
    return res.ok ? advanceTutorial(applyResult(state, res, "harvest"), 3) : applyResult(state, res);
  }
  if (type === "farm/expand") return applyResult(state, expandPlot(state), "build");

  if (type === "prod/enqueue") return applyResult(state, enqueueJob(state, payload), "build");
  if (type === "prod/collect") {
    let result;
    try {
      result = collectJob(state, payload);
    } catch {
      result = collectLivestock(state, payload);
    }
    return applyResult(state, result, "collect");
  }
  if (type === "prod/feed") return applyResult(state, feedAnimal(state, payload), "plant");
  if (type === "prod/unlock") return applyResult(state, unlockSlot(state, payload), "build");

  if (type === "village/deliver") return applyResult(state, deliverWish(state, payload), "wish");
  if (type === "village/invite") return applyResult(state, inviteGuest(state, payload), "ui");
  if (type === "village/cook") return applyResult(state, cook(state, payload), "cook");
  if (type === "village/build") return applyResult(state, build(state, payload), "build");
  if (type === "village/pet") return applyResult(state, petPlay(state, payload), "pet");

  // 换心愿：撕掉单子，立刻请 refreshWishes 补一张，不给任何奖励。
  // refreshWishes 只按 meta.day 取模选池子，同一天连换会一直拿到同一张，
  // 所以这里临时把日子往后推 rerolls 天来换个抽签位，补完再把日子放回去。
  if (type === "village/skip") {
    const wishes = (state.wishes || []).filter((w) => w.wishId !== payload.wishId);
    if (wishes.length === (state.wishes || []).length) return state;
    const rerolls = (state.ui?.rerolls || 0) + 1;
    const rolled = refreshWishes({ ...state, wishes, meta: { ...state.meta, day: state.meta.day + rerolls } });
    const next = { ...rolled, meta: { ...rolled.meta, day: state.meta.day } };
    return withFx(withUi(next, { rerolls }), "ui");
  }

  if (type === "meta/mute") {
    const muted = !state.meta.muted;
    const next = { ...state, meta: { ...state.meta, muted } };
    return muted ? next : withFx(next, "ui");
  }
  if (type === "meta/seed") return withFx(withUi(state, { seed: payload.cropId }), "ui");
  if (type === "meta/select") {
    const next = withFx(withUi(state, { selected: payload.id || "wish" }), "ui");
    // 只有走到「串门」这一步，进屋才算完成引导；否则乱点不该把教程吞掉。
    return (state.meta.tutorialStep || 0) === TUTORIAL_TOTAL - 1 ? advanceTutorial(next, TUTORIAL_TOTAL) : next;
  }
  if (type === "meta/tutorial") return { ...state, meta: { ...state.meta, tutorialStep: TUTORIAL_TOTAL } };
  if (type === "meta/toast") return toast(state, payload.text, payload.tone || "good", payload.fx);

  return state;
}

/** 单个动作出错不该让整个村子停摆：记一次日志，飘个字，继续过日子。 */
const reported = new Set();
function reducer(state, action) {
  try {
    return applyAction(state, action);
  } catch (err) {
    if (!reported.has(action.type)) {
      reported.add(action.type);
      console.error(`[蘑菇屋] ${action.type} 出错：`, err);
    }
    if (action.type === "meta/tick") return state;
    return toast(state, "刚才那下没成，先干点别的。");
  }
}

/* ---------- 启动 ---------- */

const loaded = readSave();
const store = createStore(loaded?.state || createInitialState(), reducer);
store.dispatch({ type: "meta/tick", payload: { dt: 0 } });
if (loaded) {
  store.dispatch({ type: "meta/toast", payload: { text: "接着上次的日子过。" } });
}

const root = document.querySelector("#app");
const seedOf = () => store.getState().ui?.seed || "rice";

const handlers = {
  setSeed(id) {
    store.dispatch({ type: "meta/seed", payload: { cropId: id } });
  },
  onPlot(plotId) {
    const plot = store.getState().plots.find((p) => p.id === plotId);
    if (!plot) return;
    if (plot.status === "untilled" || plot.status === "wilted") {
      store.dispatch({ type: "farm/till", payload: { plotId } });
    } else if (plot.status === "empty") {
      store.dispatch({ type: "farm/plant", payload: { plotId, cropId: seedOf() } });
    } else if (plot.status === "ready") {
      store.dispatch({ type: "farm/harvest", payload: { plotId } });
    } else {
      store.dispatch({ type: "meta/toast", payload: { text: "还在长，别催它。", tone: "bad" } });
    }
  },
  expand() {
    store.dispatch({ type: "farm/expand", payload: {} });
  },
  select(id) {
    store.dispatch({ type: "meta/select", payload: { id } });
  },
  deliver(wishId) {
    store.dispatch({ type: "village/deliver", payload: { wishId } });
  },
  skipWish(wishId) {
    store.dispatch({ type: "village/skip", payload: { wishId } });
  },
  invite(guestId) {
    store.dispatch({ type: "village/invite", payload: { guestId } });
  },
  build(buildingId) {
    store.dispatch({ type: "village/build", payload: { buildingId } });
  },
  enqueue(buildingId, recipeId) {
    store.dispatch({ type: "prod/enqueue", payload: { buildingId, recipeId } });
  },
  collect(buildingId) {
    const done = store.getState().jobs.filter((j) => j.buildingId === buildingId && j.status === "done");
    if (!done.length) {
      store.dispatch({ type: "meta/toast", payload: { text: "还没有做好的东西。", tone: "bad" } });
      return;
    }
    done.forEach((j) => store.dispatch({ type: "prod/collect", payload: { buildingId, slot: j.id } }));
  },
  collectAll() {
    const done = store.getState().jobs.filter((j) => j.status === "done");
    if (!done.length) {
      store.dispatch({ type: "meta/toast", payload: { text: "各处炉子都空着。", tone: "bad" } });
      return;
    }
    done.forEach((j) => store.dispatch({ type: "prod/collect", payload: { buildingId: j.buildingId, slot: j.id } }));
  },
  unlock(buildingId) {
    store.dispatch({ type: "prod/unlock", payload: { buildingId } });
  },
  feed(buildingId) {
    store.dispatch({ type: "prod/feed", payload: { buildingId, slot: 0 } });
  },
  cook(recipeId = "bread") {
    const state = store.getState();
    const recipe = RECIPES.find((r) => r.id === recipeId);
    const guest = (state.guests || [])[0];
    store.dispatch({ type: "village/cook", payload: { recipeId: recipe?.id || recipeId, guestId: guest?.id } });
  },
  pet(petId) {
    const state = store.getState();
    const pet =
      (petId && state.pets.find((p) => p.id === petId)) ||
      state.pets.find((p) => !p.readyAt || p.readyAt <= Date.now()) ||
      state.pets[0];
    if (!pet) return;
    store.dispatch({ type: "village/pet", payload: { petId: pet.id } });
  },
  toggleMute() {
    store.dispatch({ type: "meta/mute", payload: {} });
  },
  save() {
    const okSave = writeSave(store.getState());
    store.dispatch({
      type: "meta/toast",
      payload: okSave ? { text: "记下了这一天。", fx: "save" } : { text: "这台浏览器不让存档。", tone: "bad" },
    });
  },
  skipTutorial() {
    store.dispatch({ type: "meta/tutorial", payload: {} });
  },
};

/* ---------- 渲染循环 ---------- */

let lastFx = 0;
function playFx(state) {
  const fx = state.ui?.fx;
  if (!fx || fx.n === lastFx) return;
  lastFx = fx.n;
  if (fx.kind === "level") fanfare();
  else chirp(fx.kind);
}

function paint() {
  const state = store.getState();
  setMuted(!!state.meta.muted);
  playFx(state);
  render(root, state, handlers);
}

let dirty = true;
store.subscribe(() => {
  dirty = true;
});
paint();

let last = performance.now();
let acc = 0;
function loop(now) {
  const dt = Math.min(500, now - last);
  last = now;
  acc += dt;
  if (acc >= TICK_MS) {
    store.dispatch({ type: "meta/tick", payload: { dt: acc } });
    acc = 0;
  }
  if (dirty) {
    dirty = false;
    paint();
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ---------- 键盘 / 存档 / 声音 ---------- */

window.addEventListener("keydown", (ev) => {
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
  const t = ev.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
  const key = ev.key;
  if (key >= "1" && key <= "6") {
    const crop = CROPS[Number(key) - 1];
    if (crop) {
      handlers.setSeed(crop.id);
      ev.preventDefault();
    }
    return;
  }
  const lower = key.toLowerCase();
  if (lower === "s") {
    handlers.save();
    ev.preventDefault();
  } else if (lower === "m") {
    handlers.toggleMute();
    ev.preventDefault();
  } else if (key === "Escape") {
    handlers.select("wish");
    ev.preventDefault();
  }
});

const wake = () => resumeAudio();
window.addEventListener("pointerdown", wake, { once: true });
window.addEventListener("keydown", wake, { once: true });

setInterval(() => writeSave(store.getState()), AUTOSAVE_MS);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") writeSave(store.getState());
});
window.addEventListener("pagehide", () => writeSave(store.getState()));
