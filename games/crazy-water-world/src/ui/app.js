import { paintSea, canvasToCell } from "../world/canvas.js";
import { placeBuilding, upgradeBuilding, expandRaft, canPlace } from "../world/build.js";
import { collectFlotsam } from "../explore/salvage.js";
import { castLine, resolveHook } from "../explore/fishing.js";
import { startDive, diveStep, finishDive } from "../explore/dive.js";
import { recruit, assignHero, starUp } from "../heroes/roster.js";
import { simulateBattle } from "../combat/battle.js";
import { BUILDINGS, UNLOCK_LEVEL } from "../data/buildings.js";
import { HEROES } from "../data/heroes.js";
import { STAGES } from "../data/stages.js";
import { RESOURCE_META } from "../data/resources.js";
import { blip, setMuted } from "../audio/sfx.js";
import { loadState } from "../core/store.js";

let canvas;
let bind = false;
let fishCast = null;
let diveSess = null;
let diveInput = { x: 0, y: 0 };
let buildType = "house";
let lastPaint = 0;

function nearestFlotsam(state, clientX, clientY, canvasEl) {
  const rect = canvasEl.getBoundingClientRect();
  const px = (clientX - rect.left) / rect.width * 2 - 1;
  let best = null;
  let bestD = 0.12;
  for (const f of state.explore.salvage.flotsam) {
    const d = Math.abs(f.x - px);
    if (d < bestD) {
      best = f;
      bestD = d;
    }
  }
  return best;
}

function fulfillOrder(state) {
  const r = state.residents[0];
  if (!r?.order) return state;
  const need = r.order.qty;
  if ((state.resources[r.order.want] || 0) < need) return state;
  const resources = { ...state.resources, [r.order.want]: state.resources[r.order.want] - need };
  return {
    ...state,
    resources,
    player: { ...state.player, exp: state.player.exp + r.order.rewardExp },
    residents: state.residents.map((it, i) =>
      i === 0
        ? { ...it, mood: Math.min(100, it.mood + 15), hunger: 80, order: { want: "meal", qty: 1, rewardExp: 28 } }
        : it,
    ),
    log: ["阿强的订单搞定。他决定今天不摆烂。", ...state.log].slice(0, 24),
  };
}

function applyKey(store, e) {
  const k = e.key.toLowerCase();
  const map = { b: "build", f: "fish", d: "dive", h: "heroes", c: "campaign" };
  if (k === "escape") store.patch({ meta: { ...store.get().meta, screen: "raft" } });
  if (map[k]) store.patch({ meta: { ...store.get().meta, screen: map[k] } });
  if (k === "1" || k === "2" || k === "4") store.patch({ meta: { ...store.get().meta, speed: Number(k) } });
  if (k === "m") {
    const muted = !store.get().settings.muted;
    store.patch({ settings: { ...store.get().settings, muted } });
    setMuted(muted);
  }
  if (store.get().meta.screen === "dive" && diveSess) {
    if (k === "arrowleft" || k === "a") diveInput.x = -1;
    if (k === "arrowright" || k === "d") diveInput.x = 1;
    if (k === "arrowup" || k === "w") diveInput.y = -1;
    if (k === "arrowdown" || k === "s") diveInput.y = 1;
    if (k === " ") diveInput.surface = true;
  }
}

export function render(root, store) {
  const state = store.get();
  if (!root.dataset.ready) {
    root.dataset.ready = "1";
    root.innerHTML = `
      <div class="title-screen" id="title">
        <div>
          <p>海上拾荒，摸鱼不慌</p>
          <h1>疯狂水世界</h1>
          <p>老大，陆地没了。这叶破木筏是你的全部家当。</p>
          <button class="primary" id="start">启航</button>
          <button id="resume">继续漂流</button>
        </div>
      </div>
      <div class="shell hidden" id="game">
        <header class="topbar">
          <strong class="display">疯狂水世界</strong>
          <div class="meters" id="meters"></div>
        </header>
        <div class="sea-wrap">
          <canvas id="sea"></canvas>
          <div class="overlay">
            <aside class="panel" id="left"></aside>
            <aside class="panel" id="right"></aside>
          </div>
        </div>
        <nav class="dock" id="dock"></nav>
      </div>`;
  }

  const title = root.querySelector("#title");
  const game = root.querySelector("#game");
  if (!state.meta.started) {
    title.classList.remove("hidden");
    game.classList.add("hidden");
  } else {
    title.classList.add("hidden");
    game.classList.remove("hidden");
  }

  canvas = root.querySelector("#sea");
  if (canvas && state.meta.started) {
    lastPaint = performance.now();
    paintSea(canvas, state, lastPaint);
    if (state.meta.screen === "dive" && diveSess?.ok) {
      diveSess = diveStep(diveSess, diveInput, 0.032);
      diveInput = { x: 0, y: 0, surface: false };
      if (diveSess.done) {
        store.replace(finishDive(store.get(), diveSess));
        diveSess = null;
      }
    }
  }

  const meters = root.querySelector("#meters");
  if (meters) {
    meters.innerHTML = `
      <span>Lv.${state.player.level}</span>
      <span class="bar"><i style="width:${state.player.hunger}%"></i></span>
      <span class="bar thirst"><i style="width:${state.player.thirst}%"></i></span>
      <span class="bar hp"><i style="width:${state.player.hp}%"></i></span>
      <span>${WEATHER_NAME(state)} · ${speedLabel(state)}</span>
    `;
  }

  const left = root.querySelector("#left");
  const right = root.querySelector("#right");
  if (left) left.innerHTML = leftHtml(state);
  if (right) right.innerHTML = rightHtml(state);

  const dock = root.querySelector("#dock");
  if (dock) {
    dock.innerHTML = ["raft", "build", "fish", "dive", "heroes", "campaign"]
      .map((s) => `<button data-screen="${s}" class="${state.meta.screen === s ? "active" : ""}">${label(s)}</button>`)
      .join("");
  }

  if (!bind) {
    bind = true;
    root.addEventListener("click", (e) => onClick(e, store));
    window.addEventListener("keydown", (e) => applyKey(store, e));
    window.addEventListener("keyup", () => {
      diveInput = { x: 0, y: 0 };
    });
  }
}

function WEATHER_NAME(state) {
  return (
    { clear: "晴", haze: "雾", rain: "雨", storm: "风暴", tsunami: "海啸" }[state.world.weather] ||
    state.world.weather
  );
}

function speedLabel(state) {
  return `${state.meta.speed}x`;
}

function label(s) {
  return { raft: "木筏", build: "建造", fish: "钓鱼", dive: "潜水", heroes: "英雄", campaign: "关卡" }[s];
}

function bag(state) {
  return Object.entries(state.resources)
    .filter(([, n]) => n >= 0.05)
    .map(([k, n]) => `<div><b>${RESOURCE_META[k]?.name || k}</b>${n.toFixed(1)}</div>`)
    .join("");
}

function leftHtml(state) {
  if (state.meta.screen === "build") {
    return `<h2>建造</h2><p>点木筏空位放下。当前：${BUILDINGS[buildType].name}</p>
      ${Object.values(BUILDINGS)
        .map(
          (b) =>
            `<button data-build="${b.id}" class="${buildType === b.id ? "primary" : ""}">${b.name} · ${UNLOCK_LEVEL[b.id] || 1}级</button>`,
        )
        .join(" ")}
      <p><button data-act="expand-right">向右扩建</button> <button data-act="expand-down">向下扩建</button></p>`;
  }
  if (state.meta.screen === "fish") {
    return `<h2>钓鱼椅</h2><p>${fishCast ? `目标窗口 ${(fishCast.window[0] * 100) | 0}–${(fishCast.window[1] * 100) | 0}` : "抛竿，看准窗口收杆。"}</p>
      <button data-act="cast">抛竿</button>
      <input id="timing" type="range" min="0" max="100" value="50" />
      <button data-act="hook">收杆</button>
      <p>${state.explore.fishing.lastCatch ? (state.explore.fishing.lastCatch.miss ? "跑了" : state.explore.fishing.lastCatch.name) : ""}</p>`;
  }
  if (state.meta.screen === "dive") {
    return `<h2>深海</h2><p>WASD 移动，空格上浮。氧气与鲨鱼同在。</p>
      <button data-act="dive-start">下潜</button>
      <p>${diveSess ? `氧 ${diveSess.oxygen | 0} · 深度 ${diveSess.depth | 0} · 战利品 ${diveSess.loot.length}` : "尚未下潜"}</p>`;
  }
  if (state.meta.screen === "heroes") {
    return `<h2>英雄</h2>
      ${Object.values(HEROES)
        .map((h) => `<button data-recruit="${h.key}">招募 ${h.name}</button>`)
        .join(" ")}
      <ul>${state.heroes.map((h) => `<li>${HEROES[h.heroKey].name} ★${h.star} <button data-star="${h.id}">升星</button></li>`).join("")}</ul>`;
  }
  if (state.meta.screen === "campaign") {
    const st = STAGES[state.campaign.stage - 1];
    return `<h2>关卡 ${state.campaign.stage}</h2><p>${st?.name || "已通关"}</p>
      <button data-act="fight">出战</button>
      <p>最佳 ${state.campaign.bestStage}</p>`;
  }
  return `<h2>木筏</h2><p>点击海面闪光物拾荒。把熟食交给阿强换经验。</p>
    <button data-act="order">交付居民订单</button>
    <button data-act="eat">吃饭喝水</button>`;
}

function rightHtml(state) {
  return `<h2>仓库</h2><div class="bag">${bag(state)}</div>
    <h2>手账</h2><div class="log">${state.log.map((l) => `<div>${l}</div>`).join("")}</div>`;
}

function onClick(e, store) {
  const t = e.target;
  if (t.id === "start") {
    store.patch({ meta: { ...store.get().meta, started: true, screen: "raft" } });
    if (!store.get().heroes.length) store.replace(recruit(store.get(), "mia"));
    blip("build");
    return;
  }
  if (t.id === "resume") {
    const saved = loadState();
    if (saved) store.replace({ ...saved, meta: { ...saved.meta, started: true } });
    else store.patch({ meta: { ...store.get().meta, started: true, screen: "raft" } });
    return;
  }
  if (t.dataset.screen) {
    store.patch({ meta: { ...store.get().meta, screen: t.dataset.screen } });
    return;
  }
  if (t.dataset.build) {
    buildType = t.dataset.build;
    return;
  }
  if (t.dataset.recruit) {
    store.replace(recruit(store.get(), t.dataset.recruit));
    return;
  }
  if (t.dataset.star) {
    store.replace(starUp(store.get(), t.dataset.star));
    return;
  }
  if (t.dataset.act === "expand-right") store.replace(expandRaft(store.get(), "right"));
  if (t.dataset.act === "expand-down") store.replace(expandRaft(store.get(), "down"));
  if (t.dataset.act === "cast") fishCast = castLine(store.get());
  if (t.dataset.act === "hook") {
    const timing = Number(document.querySelector("#timing")?.value || 50) / 100;
    store.replace(resolveHook(store.get(), fishCast, timing));
    fishCast = null;
  }
  if (t.dataset.act === "dive-start") diveSess = startDive(store.get(), "wreck");
  if (t.dataset.act === "order") store.replace(fulfillOrder(store.get()));
  if (t.dataset.act === "eat") {
    const s = store.get();
    if (s.resources.meal >= 1 || s.resources.fillet >= 1) {
      const res = { ...s.resources };
      if (res.meal >= 1) res.meal -= 1;
      else res.fillet -= 1;
      if (res.freshWater >= 1) res.freshWater -= 1;
      store.replace({
        ...s,
        resources: res,
        player: { ...s.player, hunger: 100, thirst: Math.min(100, s.player.thirst + 40), hp: Math.min(100, s.player.hp + 8) },
      });
    }
  }
  if (t.dataset.act === "fight") {
    const s = store.get();
    const stage = STAGES[s.campaign.stage - 1];
    if (!stage) return;
    const allies = s.heroes.length ? s.heroes : [{ heroKey: "mia", id: "tmp", star: 1 }];
    const result = simulateBattle(s.meta.seed + s.campaign.stage * 99, allies, stage.enemies);
    if (result.winner === "ally") {
      store.replace({
        ...s,
        player: { ...s.player, exp: s.player.exp + stage.exp },
        resources: { ...s.resources, hourglass: s.resources.hourglass + stage.hourglass, badge: s.resources.badge + 1 },
        campaign: { ...s.campaign, stage: s.campaign.stage + 1, bestStage: Math.max(s.campaign.bestStage, s.campaign.stage) },
        log: [`${stage.name}通关。${result.log.slice(-1)[0]}`, ...s.log].slice(0, 24),
      });
    } else {
      store.replace({ ...s, log: [`惜败 ${stage.name}。调整阵容再来。`, ...s.log].slice(0, 24) });
    }
  }

  if (e.target.id === "sea" || e.target.tagName === "CANVAS") {
    const s = store.get();
    const f = nearestFlotsam(s, e.clientX, e.clientY, canvas);
    if (f) {
      store.replace(collectFlotsam(s, f.id));
      blip("pickup");
      return;
    }
    if (s.meta.screen === "build") {
      const cell = canvasToCell(canvas, s, e.clientX, e.clientY);
      const check = canPlace(s, buildType, cell.x, cell.y, 0);
      if (check.ok) {
        store.replace(placeBuilding(s, buildType, cell.x, cell.y, 0));
        blip("build");
      }
    } else {
      const cell = canvasToCell(canvas, s, e.clientX, e.clientY);
      const tile = s.raft.tiles[cell.y]?.[cell.x];
      if (tile && e.shiftKey) store.replace(upgradeBuilding(s, tile.buildingId));
      if (tile && s.heroes[0] && e.altKey) store.replace(assignHero(s, s.heroes[0].id, tile.buildingId));
    }
  }
}
