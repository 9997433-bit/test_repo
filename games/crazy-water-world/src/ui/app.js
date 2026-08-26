// UI 主控。三条纪律：
// 1) DOM 只建一次，之后每帧只改文本 / style / class —— 不再每帧重写 innerHTML，
//    所以节奏条不会被重置、按压态不会丢、焦点不会被抢。
// 2) 规则一律问领域层（world/explore/heroes/combat 的 can* 与动词），UI 不复刻判定。
// 3) 天气 / 昼夜 / 减弱动态 只往 documentElement 落 data-* 钩子，样式归 styles/**。
import { paintSea, pickFlotsam } from "../world/index.js";
import { collectFlotsam } from "../explore/index.js";
import { recruit } from "../heroes/index.js";
import { RESOURCE_KEYS, RESOURCE_META } from "../data/resources.js";
import { defaultState, loadState } from "../core/store.js";
import { blip, setMuted, resumeAudio } from "../audio/sfx.js";
import { ensureSkin } from "./skin.js";
import { h, setText, setClass, setStyle, setAttr, setHidden, rebuildIf } from "./dom.js";
import { SCREEN_KEY, SCREEN_LABEL, clockOf, num, phaseOf, resName, weatherName } from "./copy.js";
import { raftScreen } from "./screens/raft.js";
import { buildScreen } from "./screens/build.js";
import { fishScreen } from "./screens/fish.js";
import { diveScreen } from "./screens/dive.js";
import { heroesScreen } from "./screens/heroes.js";
import { campaignScreen } from "./screens/campaign.js";

const SCREENS = [raftScreen, buildScreen, fishScreen, diveScreen, heroesScreen, campaignScreen];
const SCREEN_BY_ID = Object.fromEntries(SCREENS.map((s) => [s.id, s]));
const ORDER = SCREENS.map((s) => s.id);
const HOTKEY_SCREEN = { b: "build", f: "fish", v: "dive", h: "heroes", c: "campaign" };
const TOAST_SEC = 3.2;

let app = null;

// ---------------------------------------------------------------- 主线指引
function nextGoal(state) {
  const has = (type) => state.buildings.some((b) => b.type === type);
  if (!has("hq")) return { text: "把指挥中心放到木筏上，那是老大的办公桌。", screen: "build" };
  if (!has("fish_chair")) return { text: "搭一把钓鱼椅，摸鱼才有工位。", screen: "build" };
  if (state.player.hunger < 35) return { text: "肚子快空了，先吃点东西。", screen: "raft" };
  if (!state.heroes.length) return { text: "去呼救名单招第一位英雄，免费的。", screen: "heroes" };
  if (state.campaign.bestStage < 1) return { text: "带队去打第一关，拿沙漏和徽章。", screen: "campaign" };
  if (!has("still")) return { text: "淡水净化器，别渴死在海上。", screen: "build" };
  if (!has("radio")) return { text: "造广播站，才能继续招人。", screen: "heroes" };
  if (!has("dive_dock")) return { text: "潜水船坞开深海：蓝图和碎片都在下面。", screen: "build" };
  if (state.explore.salvage.flotsam.length > 6) return { text: "海面堆了不少货，去捞。", screen: "raft" };
  return { text: `继续推图：下一关是第 ${state.campaign.stage} 关。`, screen: "campaign" };
}

// ------------------------------------------------------- 减弱动态：显式开关
// settings.reduceMotion 是唯一事实（存档里），这里只解决「首次进游戏该给什么默认值」：
// 系统偏好 prefers-reduced-motion 只在老大还没自己按过开关时生效；
// 按过一次就把选择记在壳层，之后一律听他的。
const MOTION_CHOICE_KEY = "cww.ui.motionChoice";

function osPrefersReduce() {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readMotionChoice() {
  try {
    return localStorage.getItem(MOTION_CHOICE_KEY);
  } catch {
    return null;
  }
}

function writeMotionChoice(reduce) {
  try {
    localStorage.setItem(MOTION_CHOICE_KEY, reduce ? "reduce" : "full");
  } catch {
    /* 隐私模式写不进去就算了，本轮内存里的开关照样好使 */
  }
}

function applyMotionDefault(store) {
  const choice = readMotionChoice();
  const want = choice === null ? osPrefersReduce() : choice === "reduce";
  const s = store.get();
  if (s.settings.reduceMotion === want) return;
  store.patch({ settings: { ...s.settings, reduceMotion: want } });
}

// ---------------------------------------------------------------- 外壳
function buildShell(root, ctx) {
  const save = loadState();
  const savedLine = save
    ? `上次存档：Lv.${save.player.level} · 建筑 ${save.buildings.length} 座 · 最佳第 ${save.campaign.bestStage} 关`
    : "还没有存档。第一次出海，紧张吗老大？";

  const title = h("div", { class: "title-screen", id: "title" }, [
    h("div", {}, [
      h("p", { text: "海上拾荒，摸鱼不慌" }),
      h("h1", { text: "疯狂水世界" }),
      h("p", { text: "老大，陆地没了。这叶破木筏是你的全部家当。" }),
      h("button", { class: save ? "" : "primary", id: "start", "data-act": "start", text: save ? "重新启航" : "启航" }),
      save ? h("button", { class: "primary", id: "resume", "data-act": "resume", text: "继续漂流" }) : null,
      h("p", { class: "cww-hint", id: "title-save", text: savedLine }),
    ]),
  ]);

  const meters = h("div", { class: "meters", id: "meters" }, [
    h("span", { id: "m-level", text: "Lv.1" }),
    bar("m-hunger", "", "饱食"),
    bar("m-thirst", "thirst", "口渴"),
    bar("m-hp", "hp", "生命"),
    h("span", { id: "m-world", text: "晴朗" }),
  ]);

  const tools = h("div", { class: "cww-tools" }, [
    h("button", { "data-act": "speed", "data-speed": "1", id: "sp-1", text: "1x", title: "正常速度（键 1）" }),
    h("button", { "data-act": "speed", "data-speed": "2", id: "sp-2", text: "2x", title: "两倍速（键 2）" }),
    h("button", { "data-act": "speed", "data-speed": "4", id: "sp-4", text: "4x", title: "四倍速（键 4）" }),
    h("button", { "data-act": "mute", id: "btn-mute", text: "🔊", title: "静音（键 M）" }),
    // 减弱动态是个两态开关：按钮上直接写当前状态，不靠高亮猜（键 R）。
    h("button", {
      "data-act": "motion",
      id: "btn-motion",
      text: "动效 全开",
      role: "switch",
      "aria-label": "减弱动态",
      "aria-pressed": "false",
      title: "减弱动态（键 R）",
    }),
  ]);

  const ghost = h("div", { class: "cww-ghost", id: "ghost" });
  const diveLayer = h("div", { class: "cww-dive", id: "dive-layer" });
  const toast = h("div", { class: "cww-toast", id: "toast", role: "status", "aria-live": "polite" });
  const left = h("aside", { class: "panel", id: "left" });
  const right = h("aside", { class: "panel", id: "right" }, [
    h("h2", { text: "仓库" }),
    h("div", { class: "bag", id: "bag" }),
    h("h2", { text: "手账" }),
    h("div", { class: "log", id: "log" }),
  ]);

  const game = h("div", { class: "shell hidden", id: "game" }, [
    h("header", { class: "topbar" }, [h("strong", { class: "display", text: "疯狂水世界" }), meters, tools]),
    h("div", { class: "sea-wrap" }, [
      h("canvas", { id: "sea" }),
      ghost,
      diveLayer,
      toast,
      h("div", { class: "overlay" }, [left, right]),
    ]),
    h("nav", { class: "dock", id: "dock" },
      ORDER.map((id) =>
        h("button", {
          "data-screen": id,
          id: `dock-${id}`,
          text: SCREEN_LABEL[id],
          title: `${SCREEN_LABEL[id]}（键 ${SCREEN_KEY[id]}）`,
        }),
      ),
    ),
  ]);

  root.append(title, game);

  // 指引 + 潜水警告钉在左面板顶部（sticky）：面板滚多远都看得见下一步该干嘛。
  const goal = h("div", { class: "cww-goal", id: "goal" }, [
    h("span", { id: "goal-text" }),
    h("button", { "data-act": "goal-jump", text: "带我去" }),
  ]);
  const diveAlert = h("div", { class: "cww-alert hidden", id: "dive-alert", role: "status" }, [
    h("span", { id: "dive-alert-text" }),
    h("button", { "data-act": "dive-back", text: "回水里" }),
  ]);
  const sticky = h("div", { class: "cww-sticky", id: "sticky" }, [diveAlert, goal]);
  left.append(sticky);

  ctx.refs = {
    title,
    game,
    hasSave: !!save,
    meters: {
      level: meters.querySelector("#m-level"),
      hunger: meters.querySelector("#m-hunger"),
      thirst: meters.querySelector("#m-thirst"),
      hp: meters.querySelector("#m-hp"),
      world: meters.querySelector("#m-world"),
    },
    tools: {
      speed: [1, 2, 4].map((n) => tools.querySelector(`#sp-${n}`)),
      mute: tools.querySelector("#btn-mute"),
      motion: tools.querySelector("#btn-motion"),
    },
    ghost,
    diveLayer,
    toast,
    left,
    right,
    bag: right.querySelector("#bag"),
    log: right.querySelector("#log"),
    sticky,
    goal,
    goalText: goal.querySelector("#goal-text"),
    diveAlert,
    diveAlertText: diveAlert.querySelector("#dive-alert-text"),
    dock: Object.fromEntries(ORDER.map((id) => [id, game.querySelector(`#dock-${id}`)])),
    panels: {},
    bagRows: {},
  };
  ctx.canvas = game.querySelector("#sea");

  for (const screen of SCREENS) {
    const node = screen.mount(ctx);
    node.classList.add("hidden");
    ctx.refs.panels[screen.id] = node;
    left.append(node);
  }
  diveScreen.mountStage(ctx, diveLayer);

  for (const key of RESOURCE_KEYS) {
    const row = h("div", { class: "hidden", id: `bag-${key}` }, [
      h("b", { text: RESOURCE_META[key]?.name || key }),
      h("span", { text: "0" }),
    ]);
    ctx.refs.bagRows[key] = { row, value: row.querySelector("span") };
    ctx.refs.bag.append(row);
  }
}

function bar(id, extra, label) {
  return h("span", { class: `bar ${extra}`.trim(), id, role: "meter", "aria-label": label }, [
    h("i"),
    h("em", { class: "cww-bar-label" }),
  ]);
}

// ---------------------------------------------------------------- 事件
function bindEvents(ctx) {
  const { root } = ctx;

  root.addEventListener("click", (ev) => {
    resumeAudio();
    const screenBtn = ev.target.closest?.("button[data-screen]");
    if (screenBtn) {
      ctx.setScreen(screenBtn.dataset.screen);
      ctx.sfx("tap");
      return;
    }
    const actBtn = ev.target.closest?.("[data-act]");
    if (!actBtn || actBtn.disabled) return;
    handleAction(ctx, actBtn.dataset.act, actBtn, ev);
  });

  root.addEventListener("change", (ev) => {
    const target = ev.target;
    if (target?.dataset?.assign) heroesScreen.change(ctx, target);
  });

  // 触控/鼠标长按方向键：按下加入 held，松开移除。潜水靠这套热区在手机上也能玩。
  const holdOn = (ev) => {
    const btn = ev.target.closest?.("[data-hold]");
    if (!btn) return;
    ev.preventDefault();
    ctx.held.add(btn.dataset.hold);
  };
  const holdOff = () => {
    for (const k of [...ctx.held]) if (k.startsWith("pad-")) ctx.held.delete(k);
  };
  root.addEventListener("pointerdown", holdOn);
  root.addEventListener("pointercancel", holdOff);
  window.addEventListener("pointerup", holdOff);

  const sea = (kind) => (ev) => {
    if (!ctx.state?.meta?.started) return;
    onSea(ctx, kind, ev);
  };
  ctx.canvas.addEventListener("pointermove", sea("move"));
  ctx.canvas.addEventListener("pointerdown", sea("down"));
  ctx.canvas.addEventListener("pointerleave", sea("leave"));

  window.addEventListener("keydown", (ev) => onKeyDown(ctx, ev));
  window.addEventListener("keyup", (ev) => ctx.held.delete(ev.key.toLowerCase()));
  window.addEventListener("blur", () => ctx.held.clear());
}

function onSea(ctx, kind, ev) {
  const screen = SCREEN_BY_ID[ctx.state.meta.screen];
  if (kind === "down") {
    // 拾荒优先：漂浮物在木筏两侧的空水面，点它永远是「捞」。
    const hit = pickFlotsam(ctx.canvas, ctx.state, ev.clientX, ev.clientY, ctx.now);
    if (hit) {
      ctx.store.replace(collectFlotsam(ctx.state, hit.id));
      ctx.sfx(hit.rare ? "rare" : "pickup");
      ctx.toast(`捞到 ${resName(hit.res)}×${hit.n}${hit.rare ? "，稀有闪光！" : "。"}`, hit.rare ? "good" : "");
      return;
    }
  }
  if (screen?.sea) screen.sea(ctx, kind, ev);
}

function onKeyDown(ctx, ev) {
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
  const tag = ev.target?.tagName;
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
  const k = ev.key.toLowerCase();
  ctx.held.add(k);
  resumeAudio();

  if (!ctx.state.meta.started) {
    if (k === "enter" || k === " ") {
      handleAction(ctx, ctx.refs.hasSave ? "resume" : "start", null, ev);
      ev.preventDefault();
    }
    return;
  }
  if (k === " " || k.startsWith("arrow")) ev.preventDefault();

  const screen = SCREEN_BY_ID[ctx.state.meta.screen];
  if (screen?.key && screen.key(ctx, k, ev)) return;

  if (k === "escape") {
    ctx.setScreen("raft");
    return;
  }
  if (HOTKEY_SCREEN[k]) {
    ctx.setScreen(HOTKEY_SCREEN[k]);
    ctx.sfx("tap");
    return;
  }
  if (k === "1" || k === "2" || k === "4") {
    handleAction(ctx, "speed", { dataset: { speed: k } }, ev);
    return;
  }
  if (k === "m") handleAction(ctx, "mute", null, ev);
  // R 在建造屏是旋转（screen.key 先吃掉），其他屏才轮到减弱动态。
  if (k === "r") handleAction(ctx, "motion", null, ev);
  if (k === "g") {
    const goal = nextGoal(ctx.state);
    ctx.setScreen(goal.screen);
  }
}

function handleAction(ctx, act, el, ev) {
  const s = ctx.state;
  if (act === "start") {
    if (ctx.refs.hasSave && !ctx.ui.confirmNew) {
      ctx.ui.confirmNew = true;
      ctx.toast("重开会把旧存档盖掉。真要重来就再点一次。", "bad");
      return;
    }
    const fresh = defaultState();
    ctx.store.replace(withFirstHero({ ...fresh, meta: { ...fresh.meta, started: true, screen: "raft" } }));
    // 整份 state 被换掉了，减弱动态的显式选择要重新盖回去。
    applyMotionDefault(ctx.store);
    ctx.ui.confirmNew = false;
    ctx.sfx("build");
    ctx.toast("启航。老大，浪不等人。", "good");
    return;
  }
  if (act === "resume") {
    const saved = loadState();
    const base = saved || s;
    // 存档里的 screen 可能停在 "title"（store 的合法值之一），进游戏得落到真屏幕上。
    const screen = SCREEN_BY_ID[base.meta.screen] ? base.meta.screen : "raft";
    ctx.store.replace(withFirstHero({ ...base, meta: { ...base.meta, started: true, screen } }));
    applyMotionDefault(ctx.store);
    ctx.sfx("build");
    ctx.toast(saved ? "接着漂。木筏还在，恭喜。" : "没找到存档，从头来。");
    return;
  }
  if (act === "speed") {
    const speed = Number(el?.dataset?.speed) || 1;
    ctx.store.patch({ meta: { ...s.meta, speed } });
    ctx.sfx("tap");
    return;
  }
  if (act === "mute") {
    const muted = !s.settings.muted;
    ctx.store.patch({ settings: { ...s.settings, muted } });
    setMuted(muted);
    if (!muted) blip("tap");
    ctx.toast(muted ? "静音了。世界清净。" : "声音回来了。");
    return;
  }
  if (act === "motion") {
    const reduceMotion = !s.settings.reduceMotion;
    ctx.store.patch({ settings: { ...s.settings, reduceMotion } });
    // 记下这是老大自己按的：下次进游戏就以他的选择为准，不再被系统偏好覆盖。
    writeMotionChoice(reduceMotion);
    ctx.sfx("tap");
    ctx.toast(
      reduceMotion
        ? "动效减弱：海面不晃、漂浮物不浮、过渡全掐掉。"
        : "动效全开：海面又开始晃了，晕的话再按一次。",
    );
    return;
  }
  if (act === "goal-jump") {
    ctx.setScreen(nextGoal(s).screen);
    return;
  }
  if (act === "dive-back") {
    ctx.setScreen("dive");
    return;
  }
  const screen = SCREEN_BY_ID[s.meta.screen];
  if (screen?.action && screen.action(ctx, act, el, ev)) return;
}

function withFirstHero(state) {
  return state.heroes.length ? state : recruit(state, "mia");
}

// ---------------------------------------------------------------- 每帧更新
function syncHooks(ctx, state) {
  const de = document.documentElement;
  const phase = phaseOf(state.world.timeOfDay);
  setAttr(de, "data-weather", state.world.weather);
  setAttr(de, "data-phase", phase.id);
  setAttr(de, "data-reduce-motion", state.settings.reduceMotion ? "on" : "off");
  // 钩子叫 data-view 而不是 data-screen：后者是船坞按钮的事件委托选择器，
  // 挂到 documentElement 上会被 closest() 一路捞到，点什么都变成切屏。
  setAttr(de, "data-view", state.meta.started ? state.meta.screen : "title");
  if (ctx.ui.muted !== state.settings.muted) {
    ctx.ui.muted = state.settings.muted;
    setMuted(state.settings.muted);
  }
  return phase;
}

function updateTopbar(ctx, state, phase) {
  const m = ctx.refs.meters;
  setText(m.level, `Lv.${state.player.level}`);
  meter(m.hunger, "饱食", state.player.hunger);
  meter(m.thirst, "口渴", state.player.thirst);
  meter(m.hp, "生命", state.player.hp);
  setText(
    m.world,
    `${weatherName(state.world.weather)} · ${phase.label} ${clockOf(state.world.timeOfDay)} · ${state.meta.speed}x`,
  );

  const t = ctx.refs.tools;
  t.speed.forEach((btn, i) => setClass(btn, "on", state.meta.speed === [1, 2, 4][i]));
  setText(t.mute, state.settings.muted ? "🔇" : "🔊");
  setClass(t.mute, "on", state.settings.muted);
  const reduce = state.settings.reduceMotion;
  setText(t.motion, reduce ? "动效 减弱" : "动效 全开");
  setAttr(t.motion, "aria-pressed", reduce ? "true" : "false");
  setAttr(t.motion, "title", reduce ? "当前：减弱动态。按一下恢复动效（键 R）" : "当前：动效全开。按一下减弱动态（键 R）");
  setClass(t.motion, "on", reduce);
}

function meter(el, label, value) {
  const v = Math.max(0, Math.min(100, value));
  setStyle(el.firstElementChild, "width", `${v.toFixed(1)}%`);
  const text = el.lastElementChild;
  setText(text, `${label} ${Math.round(v)}`);
  setClass(text, "low", v < 30);
  setAttr(el, "aria-valuenow", Math.round(v));
}

function updateRight(ctx, state) {
  for (const key of RESOURCE_KEYS) {
    const row = ctx.refs.bagRows[key];
    const n = state.resources[key] || 0;
    setHidden(row.row, n < 0.05);
    if (n >= 0.05) setText(row.value, num(n));
  }
  rebuildIf(ctx.refs.log, `${state.log.length}|${state.log[0] || ""}`, () =>
    state.log.map((line) => h("div", { text: line })),
  );
}

function updateToast(ctx) {
  const t = ctx.ui.toast;
  const show = t.until > ctx.now;
  setClass(ctx.refs.toast, "show", show);
  setClass(ctx.refs.toast, "good", show && t.kind === "good");
  setClass(ctx.refs.toast, "bad", show && t.kind === "bad");
  if (show) setText(ctx.refs.toast, t.text);
}

function updateScreens(ctx, state) {
  const wanted = SCREEN_BY_ID[state.meta.screen] ? state.meta.screen : "raft";
  if (wanted !== state.meta.screen) ctx.setScreen(wanted);
  if (ctx.ui.screen !== wanted) {
    const prev = SCREEN_BY_ID[ctx.ui.screen];
    if (prev?.leave) prev.leave(ctx);
    ctx.ui.screen = wanted;
    const next = SCREEN_BY_ID[wanted];
    if (next?.enter) next.enter(ctx);
  }
  for (const id of ORDER) {
    setHidden(ctx.refs.panels[id], id !== wanted);
    setClass(ctx.refs.dock[id], "active", id === wanted);
  }

  // 潜水会话不分屏：离开潜水屏氧气照扣（只是没人给方向），所以这里每帧都推一步，
  // 并在别的屏挂一条警告条 —— 不能让老大切走后忘了自己还泡在水里。
  const session = diveScreen.step(ctx, wanted === "dive");
  const under = !!session?.ok && !session.done;
  const alerting = under && wanted !== "dive";
  setHidden(ctx.refs.diveAlert, !alerting);
  if (alerting) {
    setText(
      ctx.refs.diveAlertText,
      `你还在水下：氧气 ${Math.ceil(Math.max(0, session.oxygen))}%、深度 ${Math.round(session.depth)} 米，氧气还在扣。`,
    );
  }

  const goal = nextGoal(ctx.state);
  setText(ctx.refs.goalText, `下一步：${goal.text}`);
  const goalHidden = goal.screen === wanted;
  setHidden(ctx.refs.goal, goalHidden);
  // 两条都没话说时整块 sticky 头一起收走，别在面板顶上留一条空白。
  setHidden(ctx.refs.sticky, goalHidden && !alerting);

  const screen = SCREEN_BY_ID[wanted];
  if (screen?.update) screen.update(ctx);
  // 潜水时把仓库/手账让出海面，舞台才看得清。
  setHidden(ctx.refs.right, wanted === "dive" && !!ctx.state.explore.dive?.ok);
}

// ---------------------------------------------------------------- 入口
function createApp(root, store) {
  ensureSkin(document);
  root.replaceChildren();
  const ctx = {
    root,
    store,
    canvas: null,
    refs: null,
    held: new Set(),
    now: 0,
    dt: 0,
    // 永远读当前 store，不留快照：点击发生在两帧之间时，别拿上一帧的 state 覆盖模拟。
    get state() {
      return store.get();
    },
    ui: {
      screen: null,
      muted: null,
      confirmNew: false,
      toast: { text: "", kind: "", until: 0 },
      build: { type: "hq", rot: 0, mode: "place", hover: null, moveId: null, armedId: null, pending: null },
      fish: { cast: null, elapsed: 0, sweep: 1.6, pos: 0, perfect: false, cooldown: 0 },
      // picked: null = 交给 selectLineup 自动配队；数组 = 老大自己勾的出战名单。
      campaign: { stage: 0, report: null, picked: null, tickers: [] },
    },
    toast(text, kind = "") {
      ctx.ui.toast = { text, kind, until: ctx.now + TOAST_SEC * 1000 };
    },
    setScreen(id) {
      if (!SCREEN_BY_ID[id]) return;
      ctx.store.patch({ meta: { ...ctx.store.get().meta, screen: id } });
    },
    sfx(kind) {
      blip(kind);
    },
  };
  buildShell(root, ctx);
  bindEvents(ctx);
  applyMotionDefault(store);
  setMuted(store.get().settings.muted);
  ctx.ui.muted = store.get().settings.muted;
  return { root, ctx, last: 0 };
}

export function render(root, store) {
  if (typeof document === "undefined" || !root) return;
  if (!app || app.root !== root) app = createApp(root, store);
  const ctx = app.ctx;
  const state = store.get();
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  ctx.dt = app.last ? Math.min(0.1, (now - app.last) / 1000) : 0;
  app.last = now;
  ctx.now = now;

  const phase = syncHooks(ctx, state);
  setHidden(ctx.refs.title, state.meta.started);
  setHidden(ctx.refs.game, !state.meta.started);
  if (!state.meta.started) return;

  paintSea(ctx.canvas, state, now);
  updateTopbar(ctx, state, phase);
  updateRight(ctx, state);
  updateScreens(ctx, state);
  updateToast(ctx);
}

// 附加导出（契约只冻结 render）：主线指引是纯函数，测试和探针可以直接断言。
export { nextGoal };
