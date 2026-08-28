/**
 * 蚀核要塞 HUD —— 唯一签名（Round 2 收敛，不再有第二种调用形态）。
 *
 *   mountHud(el) -> hud
 *   syncHud(view, extras = { backend, toast, quality }) -> hud | null
 *
 * `el` 是 HUD 的宿主（一般是 index.html 的 `#sh-hud`）；缺省挂到 `document.body`。
 * 已有节点直接接管，缺的补齐，所以脱离 index.html 也能挂载。
 * `extras` 三个键都可省：backend 只影响 `.sh-backend` 的样式钩子，toast 是主循环想插播的一句话，
 * quality 是渲染器实际生效的画质档。其余状态（血量 / 屑晶 / 波次 / 暂停 / 选中 / 终局）全部读 view，
 * 武装中的塔读 `src/input` 派发的 'sh-input'，HUD 自己不猜。
 *
 * 冻结 class（与 `src/styles` 共用，不要改名）：
 *   .sh-hud .sh-core .sh-scrap .sh-wave .sh-dock .sh-toast .sh-backend .sh-overclock
 *
 * 状态钩子（HUD 只写文本 / class / 属性 / CSS 变量，不写内联样式）：
 *   .sh-core.is-danger              [data-low]
 *   .sh-backend.is-webgpu/.is-webgl2 [data-backend]
 *   .sh-toast.is-error              [data-show][data-kind="info|warn|bad|good"]
 *   .sh-dock button.is-selected     [aria-pressed][disabled][data-tower][data-count]
 *   .sh-overclock.is-active/.is-cooldown [data-state="idle|ready|active|cooling"]
 *   .sh-hud[data-paused][data-result="win|lose"][data-quality]
 *          style: --sh-core-frac --sh-scrap --sh-wave
 *
 * 事件通道（HUD → 其它模块，冒泡到 document）：
 *   'sh-ui'  detail: { action: 'tower'|'overclock'|'pause'|'quality', towerId?, socket?, quality? }
 * HUD 反过来监听 'sh-input'（由 `src/input` 派发）来同步武装高亮与提示，
 * 因此 main.js 只要 mountHud + createInput，两边就自动对上。
 * 画质按钮直接落到 `window.__SHIHE__.setQuality`（`src/main.js` 挂的那个句柄）。
 */
import { TOWER_ORDER, getMeta, getTowerCatalog } from "./catalog.js";

export const UI_EVENT = "sh-ui";
export const INPUT_EVENT = "sh-input";
export const QUALITY_TIERS = Object.freeze(["high", "mid", "low"]);

const QUALITY_LABEL = { high: "高", mid: "中", low: "低" };
const BACKEND_LABEL = { webgpu: "WebGPU", webgl2: "WebGL2", webgl: "WebGL", cpu: "CPU", sim: "SIM" };

const TOAST_TTL = 2200;
const TOAST_DEDUPE_MS = 1600;

/** `.sh-backend` 的初始占位。文本不在这个集合里，说明 main.js 想自己写后端标签，HUD 就让位。 */
const BACKEND_PLACEHOLDERS = new Set(["", "boot", "—", "-"]);

/** 建造 / 过载被拒的理由码 → 文案。sim 与 docs/API_CONTRACT.md 两套写法都收。 */
const DENY_TEXT = {
  scrap: "屑晶不足",
  noScrap: "屑晶不足",
  cost: "屑晶不足",
  occupied: "插座已被占用",
  empty: "空插座 · 先造一座塔",
  noTower: "空插座 · 先造一座塔",
  overheat: "停火冷却中",
  busy: "已经在过载了",
  cooling: "过载冷却中",
  badSocket: "插座号无效",
  unknownTower: "没有这种塔",
  badTower: "没有这种塔",
  over: "对局已结束",
  ended: "对局已结束",
};

/** 事件类型 → 提示条。deny / leak / win / lose 是必须出的，其余是顺手的反馈。 */
const EVENT_TOASTS = {
  deny: (e) => ({ text: DENY_TEXT[e?.reason] ?? "无法执行", kind: "warn", ttl: 1800 }),
  leak: (e) => ({ text: leakText(e), kind: "bad", ttl: 2000 }),
  win: (e) => ({ text: winText(e), kind: "good", ttl: 0 }),
  lose: (e) => ({ text: loseText(e), kind: "bad", ttl: 0 }),
  overheat: (e) => ({ text: `插座 ${e?.socket ?? "—"} 过热 · 停火冷却`, kind: "warn", ttl: 1400 }),
  wave: (e) => waveToast(e),
  waveStart: (e) => waveToast(e),
  waveClear: (e) => ({
    text: isNum(e?.bonus) && e.bonus > 0 ? `第 ${e.wave} 波已清 · +${e.bonus} 屑晶` : `第 ${e?.wave ?? "—"} 波已清`,
    kind: "good",
    ttl: 1800,
  }),
};

const EMPTY_VIEW = Object.freeze({});

let activeHud = null;

/* ------------------------------------------------------------------ 小工具 */

function isNum(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function setText(el, text) {
  if (el && el.textContent !== text) el.textContent = text;
}

function setAttr(el, name, value) {
  if (!el) return;
  if (value === null || value === undefined || value === false) {
    if (el.hasAttribute(name)) el.removeAttribute(name);
  } else if (el.getAttribute(name) !== String(value)) {
    el.setAttribute(name, String(value));
  }
}

function setVar(el, name, value) {
  if (el && el.style.getPropertyValue(name) !== value) el.style.setProperty(name, value);
}

function setDisabled(el, disabled) {
  if (el && el.disabled !== disabled) el.disabled = disabled;
}

function setClass(el, className, on) {
  if (el && el.classList.contains(className) !== on) el.classList.toggle(className, on);
}

function leakText(event) {
  const dmg = event?.damage ?? event?.dmg ?? event?.amount;
  return isNum(dmg) ? `漏敌 · 星核 -${dmg}` : "漏敌 · 星核受损";
}

function winText(event) {
  return isNum(event?.coreHp) ? `要塞守住了 · 蚀主伏诛 · 星核 ${event.coreHp}` : "要塞守住了 · 蚀主伏诛";
}

function loseText(event) {
  return isNum(event?.wave) ? `星核崩解 · 第 ${event.wave} 波失守` : "星核崩解 · 要塞失守";
}

function waveToast(event) {
  const wave = event?.wave;
  if (event?.boss) return { text: `第 ${wave} 波 · 蚀主降临`, kind: "warn", ttl: 2400 };
  return { text: isNum(wave) ? `第 ${wave} 波来袭` : "新一波来袭", kind: "info", ttl: 1600 };
}

function backendLabel(backend) {
  if (typeof backend !== "string" || backend === "") return "—";
  return BACKEND_LABEL[backend.toLowerCase()] ?? backend;
}

/* -------------------------------------------------------------- DOM 骨架 */

function el(tag, className, attrs) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (attrs) for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function ensure(parent, selector, make) {
  let node = parent.querySelector(selector);
  if (!node) {
    node = make();
    parent.appendChild(node);
  }
  return node;
}

/** 传进来的宿主可能是元素，也可能是整个 document；统一取到一个能塞节点的元素。 */
function hostOf(target) {
  if (!target) return typeof document === "undefined" ? null : document.body;
  if (target.nodeType === 9) return target.body ?? target.documentElement;
  return target;
}

function ensureSkeleton(host) {
  const hud = host.classList?.contains("sh-hud")
    ? host
    : ensure(host, ".sh-hud", () => el("div", "sh-hud", { id: "sh-hud" }));

  const refs = {
    hud,
    backend: ensure(hud, ".sh-backend", () => el("div", "sh-backend", { id: "sh-backend" })),
    core: ensure(hud, ".sh-core", () => el("div", "sh-core", { id: "sh-core" })),
    scrap: ensure(hud, ".sh-scrap", () => el("div", "sh-scrap", { id: "sh-scrap" })),
    wave: ensure(hud, ".sh-wave", () => el("div", "sh-wave", { id: "sh-wave" })),
    toast: ensure(hud, ".sh-toast", () =>
      el("div", "sh-toast", { id: "sh-toast", role: "status", "aria-live": "polite" }),
    ),
    dock: ensure(hud, ".sh-dock", () => el("div", "sh-dock", { id: "sh-dock", role: "group", "aria-label": "建造栏" })),
    overclock: ensure(hud, ".sh-overclock", () =>
      el("button", "sh-overclock", { id: "sh-overclock", type: "button", "data-sh-action": "overclock" }),
    ),
    towers: new Map(),
  };

  for (const tower of getTowerCatalog()) {
    const btn = ensure(refs.dock, `[data-tower="${tower.id}"]`, () => {
      const node = el("button", "", { type: "button", "data-tower": tower.id });
      node.append(el("span", "sh-dock-name"), el("span", "sh-dock-cost"), el("span", "sh-dock-key"));
      return node;
    });
    setAttr(btn, "type", "button");
    refs.towers.set(tower.id, {
      btn,
      name: ensure(btn, ".sh-dock-name", () => el("span", "sh-dock-name")),
      cost: ensure(btn, ".sh-dock-cost", () => el("span", "sh-dock-cost")),
      key: ensure(btn, ".sh-dock-key", () => el("span", "sh-dock-key")),
    });
  }

  refs.pause = ensure(refs.dock, '[data-sh-action="pause"]', () =>
    el("button", "sh-pause", { type: "button", "data-sh-action": "pause" }),
  );
  refs.quality = ensure(refs.dock, '[data-sh-action="quality"]', () =>
    el("button", "sh-quality", { type: "button", "data-sh-action": "quality" }),
  );
  setAttr(refs.overclock, "type", "button");
  setAttr(refs.overclock, "data-sh-action", "overclock");

  return refs;
}

/* ------------------------------------------------------------------ HUD */

function createHud(host) {
  const refs = ensureSkeleton(host);
  const catalog = getTowerCatalog();
  const meta = getMeta();
  const doc = refs.hud.ownerDocument ?? document;
  const win = doc.defaultView ?? (typeof window !== "undefined" ? window : null);

  const state = {
    towerId: TOWER_ORDER[0],
    quality: "high",
    paused: false,
    result: null,
    selectedSocket: null,
    scrap: null,
    explicitToastKey: null,
    seenEvents: new WeakSet(),
    toast: null,
    // main.js 在 mountHud 之前就会往 .sh-backend 写「后端 · 画质」，那之后 HUD 只管样式钩子。
    backendOwned: BACKEND_PLACEHOLDERS.has((refs.backend.textContent ?? "").trim()),
    compact: false,
  };

  // 窄屏上四个顶栏芯片会把 HUD 的 grid 撑出视口，所以窄屏时省掉波次后面的「剩 n」。
  // 数值仍旧挂在 .sh-wave[data-alive] 上，样式层想显示随时能取。
  let compactMq = null;
  try {
    compactMq = win?.matchMedia?.("(max-width: 640px)") ?? null;
  } catch {
    compactMq = null;
  }
  state.compact = !!compactMq?.matches;
  const onCompactChange = (event) => {
    state.compact = !!event.matches;
  };
  compactMq?.addEventListener?.("change", onCompactChange);

  const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

  /* -- 提示条 ------------------------------------------------------------ */

  function pushToast(text, kind = "info", ttl = TOAST_TTL) {
    if (!text) return;
    const t = now();
    const current = state.toast;
    if (current && current.text === text && current.kind === kind && t - current.born < TOAST_DEDUPE_MS) {
      current.count += 1;
      current.until = ttl > 0 ? t + ttl : Infinity;
      current.born = t;
    } else {
      state.toast = { text, kind, count: 1, born: t, until: ttl > 0 ? t + ttl : Infinity };
    }
    renderToast(t);
  }

  function clearToast() {
    state.toast = null;
    renderToast(now());
  }

  function renderToast(t) {
    const toast = state.toast;
    if (toast && t >= toast.until) state.toast = null;
    if (!state.toast) {
      setText(refs.toast, "");
      setAttr(refs.toast, "data-show", null);
      setAttr(refs.toast, "data-kind", null);
      setClass(refs.toast, "is-error", false);
      return;
    }
    const { text, kind, count } = state.toast;
    setText(refs.toast, count > 1 ? `${text} ×${count}` : text);
    setAttr(refs.toast, "data-kind", kind);
    setAttr(refs.toast, "data-show", "1");
    setClass(refs.toast, "is-error", kind === "bad" || kind === "warn");
  }

  /* -- 对外事件 ---------------------------------------------------------- */

  function emit(detail) {
    refs.hud.dispatchEvent(new CustomEvent(UI_EVENT, { detail, bubbles: true, composed: true }));
  }

  /** `towerId === null` = 解除武装，坞站全部取消高亮。 */
  function setSelectedTower(towerId, notify) {
    const next = towerId === null ? null : TOWER_ORDER.includes(towerId) ? towerId : undefined;
    if (next === undefined) return;
    const changed = state.towerId !== next;
    state.towerId = next;
    for (const [id, parts] of refs.towers) {
      setAttr(parts.btn, "aria-pressed", id === next ? "true" : "false");
      setClass(parts.btn, "is-selected", id === next);
    }
    if (notify && changed) emit({ action: "tower", towerId: next });
  }

  function paintQuality(tier) {
    state.quality = tier;
    setAttr(refs.hud, "data-quality", tier);
    setText(refs.quality, `画质 ${QUALITY_LABEL[tier]}`);
    setAttr(refs.quality, "title", "循环切换画质：高 / 中 / 低");
  }

  /**
   * 画质是渲染器的事，HUD 只负责派发意图并把实际生效的档位画出来。
   * `window.__SHIHE__` 由 `src/main.js` 挂载；没有它（预览页 / 测试）就只发事件。
   */
  function requestQuality(tier) {
    if (!QUALITY_TIERS.includes(tier) || tier === state.quality) return;
    paintQuality(tier);
    emit({ action: "quality", quality: tier });
    let applied = tier;
    try {
      const result = win?.__SHIHE__?.setQuality?.(tier);
      if (typeof result === "string" && QUALITY_TIERS.includes(result)) applied = result;
    } catch (err) {
      console.warn("[shihe-yaosai] setQuality 失败", err);
    }
    if (applied !== tier) paintQuality(applied);
    pushToast(`画质 ${QUALITY_LABEL[applied]}`, "info", 1200);
  }

  function cycleQuality() {
    requestQuality(QUALITY_TIERS[(QUALITY_TIERS.indexOf(state.quality) + 1) % QUALITY_TIERS.length]);
  }

  function setPaused(paused) {
    state.paused = !!paused;
    setAttr(refs.hud, "data-paused", state.paused ? "1" : null);
    setText(refs.pause, state.paused ? "继续 Space" : "暂停 Space");
    setAttr(refs.pause, "aria-pressed", state.paused ? "true" : "false");
  }

  function setResult(result) {
    const next = result === "win" || result === "lose" ? result : null;
    if (state.result === next) return;
    state.result = next;
    setAttr(refs.hud, "data-result", next);
  }

  /* -- 交互 -------------------------------------------------------------- */

  function onClick(event) {
    const button = event.target?.closest?.("[data-tower],[data-sh-action]");
    if (!button || button.disabled || !refs.hud.contains(button)) return;
    event.preventDefault();
    const towerId = button.getAttribute("data-tower");
    if (towerId) {
      // 再点一次已选中的塔 = 解除武装，避免手滑乱造。
      setSelectedTower(state.towerId === towerId ? null : towerId, true);
      return;
    }
    switch (button.getAttribute("data-sh-action")) {
      case "overclock":
        emit({ action: "overclock", socket: state.selectedSocket });
        break;
      case "pause":
        emit({ action: "pause" });
        break;
      case "quality":
        cycleQuality();
        break;
      default:
        break;
    }
  }

  /** `src/input` 的状态回流：键盘选塔、暂停、选中插座、以及输入层想说的一句话。 */
  function onInputEvent(event) {
    const detail = event?.detail;
    if (!detail || typeof detail !== "object") return;
    if (typeof detail.towerId === "string" || detail.towerId === null) setSelectedTower(detail.towerId, false);
    if (typeof detail.paused === "boolean") setPaused(detail.paused);
    if (detail.selectedSocket === null || isNum(detail.selectedSocket)) state.selectedSocket = detail.selectedSocket;
    const notice = detail.notice;
    if (notice) pushToast(notice.text ?? String(notice), notice.kind ?? "warn", notice.ttl ?? 1400);
  }

  refs.hud.addEventListener("click", onClick);
  doc.addEventListener(INPUT_EVENT, onInputEvent);

  /* -- 每帧同步 ---------------------------------------------------------- */

  function ingestEvents(events) {
    if (!Array.isArray(events)) return;
    for (const event of events) {
      if (!event || typeof event !== "object" || state.seenEvents.has(event)) continue;
      state.seenEvents.add(event);
      if (event.type === "win" || event.type === "lose") setResult(event.type);
      const make = EVENT_TOASTS[event.type];
      if (!make) continue;
      const toast = make(event);
      if (toast) pushToast(toast.text, toast.kind, toast.ttl);
    }
  }

  /** `extras.toast`：主循环插播的一句话。同一条只弹一次，置 null / '' 收起。 */
  function applyExplicitToast(toast) {
    const usable =
      toast === null || toast === undefined || typeof toast === "string" || (typeof toast === "object" && "text" in toast);
    if (!usable) return;
    const key =
      toast === null || toast === undefined || toast === ""
        ? "∅"
        : typeof toast === "string"
          ? toast
          : `${toast.id ?? ""}|${toast.text ?? ""}|${toast.kind ?? ""}`;
    if (key === state.explicitToastKey) return;
    state.explicitToastKey = key;
    if (key === "∅") {
      clearToast();
      return;
    }
    if (typeof toast === "string") pushToast(toast, "info", TOAST_TTL);
    else pushToast(toast.text, toast.kind ?? "info", toast.ttl ?? TOAST_TTL);
  }

  function syncDock(view) {
    const scrap = isNum(view.scrap) ? view.scrap : null;
    const sockets = Array.isArray(view.sockets) ? view.sockets : null;
    const counts = new Map();
    if (sockets) {
      for (const socket of sockets) {
        if (socket?.towerId) counts.set(socket.towerId, (counts.get(socket.towerId) ?? 0) + 1);
      }
    }
    for (const tower of catalog) {
      const parts = refs.towers.get(tower.id);
      if (!parts) continue;
      const owned = counts.get(tower.id) ?? 0;
      const affordable = tower.cost === null || scrap === null || scrap >= tower.cost;
      setText(parts.key, tower.key);
      setText(parts.name, tower.name);
      setText(parts.cost, tower.cost === null ? "" : String(tower.cost));
      // 已建座数不占布局，只做样式钩子（角标由 src/styles 决定要不要画）。
      setAttr(parts.btn, "data-count", sockets && owned > 0 ? String(owned) : null);
      setAttr(parts.btn, "data-affordable", affordable ? "1" : "0");
      setAttr(
        parts.btn,
        "aria-label",
        `${tower.name}（快捷键 ${tower.key}${tower.cost === null ? "" : `，${tower.cost} 屑晶`}${
          owned > 0 ? `，已建 ${owned} 座` : ""
        }）`,
      );
      setAttr(parts.btn, "title", `${tower.name} · ${tower.tip}${tower.cost === null ? "" : ` · ${tower.cost} 屑晶`}`);
      setDisabled(parts.btn, !affordable);
    }
  }

  function syncBackend(backend) {
    const id = typeof backend === "string" && backend ? backend.toLowerCase() : null;
    setAttr(refs.backend, "data-backend", id);
    setClass(refs.backend, "is-webgpu", id === "webgpu");
    setClass(refs.backend, "is-webgl2", id === "webgl2" || id === "webgl");
    if (!state.backendOwned || !id) return;
    setText(refs.backend, backendLabel(backend));
    setAttr(refs.backend, "title", "渲染后端");
  }

  function syncOverclock(view) {
    const sockets = Array.isArray(view.sockets) ? view.sockets : null;
    const index = state.selectedSocket;
    const socket = sockets && isNum(index) ? (sockets.find((s) => s?.i === index) ?? sockets[index]) : null;
    const active = isNum(socket?.overclockT) && socket.overclockT > 0;
    const cooling = isNum(socket?.overheatT) && socket.overheatT > 0;
    const ready = !!socket?.towerId && !active && !cooling;

    let label = "过载 F";
    let mode = "idle";
    if (active) {
      label = `过载 ${socket.overclockT.toFixed(1)}s`;
      mode = "active";
    } else if (cooling) {
      label = `冷却 ${socket.overheatT.toFixed(1)}s`;
      mode = "cooling";
    } else if (ready) {
      label = `过载 F · 插座 ${index}`;
      mode = "ready";
    }
    setText(refs.overclock, label);
    setAttr(refs.overclock, "data-state", mode);
    setClass(refs.overclock, "is-active", active);
    setClass(refs.overclock, "is-cooldown", cooling);
    setAttr(refs.overclock, "title", "选中一座塔后按 F 过载：伤害翻倍数秒，随后停火冷却");
    setDisabled(refs.overclock, !!sockets && !ready && !active);
  }

  /**
   * @param {object|null} view  `sim.getView()` 的快照
   * @param {{backend?: string, toast?: string|object|null, quality?: string, events?: object[]}} [extras]
   */
  function sync(view, extras) {
    const v = view && typeof view === "object" ? view : EMPTY_VIEW;
    const ex = extras && typeof extras === "object" ? extras : EMPTY_VIEW;

    if (typeof ex.quality === "string" && QUALITY_TIERS.includes(ex.quality) && ex.quality !== state.quality) {
      paintQuality(ex.quality);
    }
    syncBackend(ex.backend ?? v.backend);

    // 选中插座与暂停以 sim 的 view 为准，view 没给（引导期 / sim 掉线）才留用 'sh-input' 的值。
    if (isNum(v.selectedSocket) || v.selectedSocket === null) state.selectedSocket = v.selectedSocket;
    if (typeof v.paused === "boolean") setPaused(v.paused);
    if (typeof v.result === "string") setResult(v.result);

    const coreMax = isNum(v.coreMax) && v.coreMax > 0 ? v.coreMax : meta.coreMax;
    const coreHp = isNum(v.coreHp) ? Math.max(0, v.coreHp) : null;
    setText(refs.core, coreHp === null ? "星核 —" : `星核 ${coreHp}/${coreMax}`);
    const frac = coreHp === null ? 1 : Math.max(0, Math.min(1, coreHp / coreMax));
    setVar(refs.hud, "--sh-core-frac", frac.toFixed(3));
    const danger = coreHp !== null && frac <= 0.34;
    setAttr(refs.core, "data-low", danger ? "1" : null);
    setClass(refs.core, "is-danger", danger);

    const scrap = isNum(v.scrap) ? v.scrap : null;
    setText(refs.scrap, scrap === null ? "屑晶 —" : `屑晶 ${scrap}`);
    setVar(refs.hud, "--sh-scrap", scrap === null ? "0" : String(scrap));
    if (scrap !== null && state.scrap !== null && scrap !== state.scrap) {
      setAttr(refs.scrap, "data-delta", scrap > state.scrap ? "up" : "down");
    }
    state.scrap = scrap;

    const wave = isNum(v.wave) ? v.wave : null;
    // main.js 的空视图里 waveTotal 是 0，那种时候宁可用数据表的总波数，别写出「波次 0/0」。
    const waveTotal =
      isNum(v.waveTotal) && v.waveTotal > 0 ? v.waveTotal : isNum(v.waveCount) && v.waveCount > 0 ? v.waveCount : meta.waveTotal;
    const alive = Array.isArray(v.enemies) ? v.enemies.length : null;
    let waveText = wave === null ? "波次 —" : `波次 ${wave}/${waveTotal}`;
    if (wave !== null && alive && !state.compact) waveText += ` · 剩 ${alive}`;
    setText(refs.wave, waveText);
    setAttr(refs.wave, "data-alive", alive === null ? null : String(alive));
    setVar(refs.hud, "--sh-wave", wave === null ? "0" : String(wave));

    syncDock(v);
    syncOverclock(v);
    ingestEvents(v.events);
    if (ex.events !== v.events) ingestEvents(ex.events);
    if ("toast" in ex) applyExplicitToast(ex.toast);
    renderToast(now());
  }

  /* -- 初始状态 ---------------------------------------------------------- */

  setSelectedTower(state.towerId, false);
  paintQuality(state.quality);
  setPaused(false);
  setAttr(refs.hud, "data-mounted", "1");
  sync(null, null);

  const hud = {
    el: refs.hud,
    refs,
    towers: catalog,
    sync,
    toast: pushToast,
    clearToast,
    getSelectedTower: () => state.towerId,
    getSelectedSocket: () => state.selectedSocket,
    getQuality: () => state.quality,
    isPaused: () => state.paused,
    getResult: () => state.result,
    destroy() {
      refs.hud.removeEventListener("click", onClick);
      doc.removeEventListener(INPUT_EVENT, onInputEvent);
      compactMq?.removeEventListener?.("change", onCompactChange);
      setAttr(refs.hud, "data-mounted", null);
      delete refs.hud.__shHud;
      if (activeHud === hud) activeHud = null;
    },
  };

  refs.hud.__shHud = hud;
  return hud;
}

/* ------------------------------------------------------------------ 出口 */

/**
 * 挂载 HUD。会接管 index.html 里已有的节点，也能在空容器里自建整套骨架。
 * 同一个宿主重复调用返回同一个句柄。
 * @param {HTMLElement|Document|null} [el] 宿主，缺省 `document.body`
 * @returns {object|null} HUD 句柄（对 main.js 不透明）
 */
export function mountHud(el) {
  if (typeof document === "undefined") return null;
  const host = hostOf(el);
  if (!host) return null;
  const existing = host.__shHud ?? host.querySelector?.(".sh-hud")?.__shHud;
  activeHud = existing ?? createHud(host);
  return activeHud;
}

/**
 * 每帧刷新 HUD。唯一签名：`syncHud(view, extras)`。
 * @param {object|null} view `sim.getView()` 的快照
 * @param {{backend?: string, toast?: string|object|null, quality?: string, events?: object[]}} [extras]
 * @returns {object|null} 当前 HUD 句柄；没挂载过返回 null
 */
export function syncHud(view, extras = {}) {
  if (!activeHud) return null;
  activeHud.sync(view, extras);
  return activeHud;
}

/** 当前 HUD 句柄（没挂载则 null）。 */
export function getHud() {
  return activeHud;
}

/** 主动弹一条提示，供 main.js 报告引擎 / 加载类信息。 */
export function toast(text, kind = "info", ttl = TOAST_TTL) {
  activeHud?.toast(text, kind, ttl);
}
