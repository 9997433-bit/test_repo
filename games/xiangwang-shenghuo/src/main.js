import { createStore } from "./core/store.js";
import { createInitialState, advanceTime } from "./core/engine.js";
import { writeSave, readSave } from "./core/save.js";
import { tickPlots, till, plant, harvest, expandPlot } from "./systems/farm/index.js";
import { enqueueJob, collectJob, feedAnimal, unlockSlot, tickProduction } from "./systems/production/index.js";
import { deliverWish, inviteGuest, cook, build, petPlay, tickVillage } from "./systems/village/index.js";
import { render } from "./ui/screens.js";
import { chirp, setMuted } from "./audio/sfx.js";
import "./styles/tokens.css";
import "./styles/layout.css";

const LEVELS = [0, 40, 100, 180, 280, 420, 600, 820, 1100, 1450];

function levelFor(xp) {
  let lv = 1;
  for (let i = 0; i < LEVELS.length; i += 1) if (xp >= LEVELS[i]) lv = i + 1;
  return lv;
}

function applyResult(state, result) {
  if (!result) return state;
  if (result.ok === false) {
    return { ...state, log: [result.reason, ...state.log].slice(0, 40) };
  }
  return result.state || result;
}

function reducer(state, action) {
  const { type, payload } = action;
  if (type === "meta/tick") {
    let { state: s } = advanceTime(state, payload.dt);
    s = tickPlots(s, payload.dt);
    s = tickProduction(s, payload.dt);
    s = tickVillage(s);
    s = { ...s, meta: { ...s.meta, level: levelFor(s.meta.xp) } };
    return s;
  }
  if (type === "farm/till") return applyResult(state, { ok: true, state: till(state, payload) });
  if (type === "farm/plant") return applyResult(state, plant(state, payload));
  if (type === "farm/harvest") return applyResult(state, harvest(state, payload));
  if (type === "farm/expand") return applyResult(state, expandPlot(state));
  if (type === "prod/enqueue") return applyResult(state, enqueueJob(state, payload));
  if (type === "prod/collect") return applyResult(state, collectJob(state, payload));
  if (type === "prod/feed") return applyResult(state, feedAnimal(state, payload));
  if (type === "prod/unlock") return applyResult(state, unlockSlot(state, payload));
  if (type === "village/deliver") return applyResult(state, deliverWish(state, payload));
  if (type === "village/invite") return applyResult(state, inviteGuest(state, payload));
  if (type === "village/cook") return applyResult(state, cook(state, payload));
  if (type === "village/build") return applyResult(state, build(state, payload));
  if (type === "village/pet") return applyResult(state, petPlay(state, payload));
  if (type === "meta/mute") return { ...state, meta: { ...state.meta, muted: !state.meta.muted } };
  if (type === "meta/seed") return { ...state, ui: { ...(state.ui || {}), seed: payload.cropId } };
  return state;
}

const loaded = typeof localStorage !== "undefined" ? readSave() : null;
const store = createStore(loaded?.state || createInitialState(), reducer);
store.dispatch({ type: "meta/tick", payload: { dt: 0 } });

let seed = "rice";
const root = document.querySelector("#app");

function paint() {
  const state = store.getState();
  setMuted(state.meta.muted);
  render(root, state, {
    setSeed(id) {
      seed = id;
      store.dispatch({ type: "meta/seed", payload: { cropId: id } });
    },
    onPlot(plotId) {
      const plot = store.getState().plots.find((p) => p.id === plotId);
      if (!plot) return;
      if (plot.status === "untilled" || plot.status === "wilted") {
        store.dispatch({ type: "farm/till", payload: { plotId } });
        chirp("plant");
      } else if (plot.status === "empty") {
        store.dispatch({ type: "farm/plant", payload: { plotId, cropId: seed } });
        chirp("plant");
      } else if (plot.status === "ready") {
        store.dispatch({ type: "farm/harvest", payload: { plotId } });
        chirp("harvest");
      }
    },
    expand() { store.dispatch({ type: "farm/expand", payload: {} }); },
    deliver(wishId) { store.dispatch({ type: "village/deliver", payload: { wishId } }); chirp("wish"); },
    invite(guestId) { store.dispatch({ type: "village/invite", payload: { guestId } }); },
    build(buildingId) { store.dispatch({ type: "village/build", payload: { buildingId } }); },
    enqueue(buildingId, recipeId) { store.dispatch({ type: "prod/enqueue", payload: { buildingId, recipeId } }); },
    collect(buildingId) {
      const jobs = store.getState().jobs.filter((j) => j.buildingId === buildingId && j.status === "done");
      jobs.forEach((j) => store.dispatch({ type: "prod/collect", payload: { buildingId, slot: j.id } }));
      chirp("harvest");
    },
    unlock(buildingId) { store.dispatch({ type: "prod/unlock", payload: { buildingId } }); },
    feed(buildingId) { store.dispatch({ type: "prod/feed", payload: { buildingId, slot: 0 } }); },
    cook() { store.dispatch({ type: "village/cook", payload: { recipeId: "bread", guestId: store.getState().guests[0]?.id } }); chirp("cook"); },
    pet() {
      const pet = store.getState().pets.find((p) => !p.readyAt || p.readyAt <= Date.now()) || store.getState().pets[0];
      store.dispatch({ type: "village/pet", payload: { petId: pet.id } });
    },
    toggleMute() { store.dispatch({ type: "meta/mute", payload: {} }); },
    save() { writeSave(store.getState()); store.dispatch({ type: "meta/tick", payload: { dt: 0 } }); },
  });
}

store.subscribe(paint);
paint();

let last = performance.now();
function loop(now) {
  const dt = Math.min(200, now - last);
  last = now;
  store.dispatch({ type: "meta/tick", payload: { dt } });
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

setInterval(() => writeSave(store.getState()), 15_000);
