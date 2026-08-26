/**
 * 顶栏 / 侧栏 / 底栏 HUD。
 * 只做「读状态 → 刷 DOM」，所有玩法动作通过回调抛给 main.js。
 */

export const RES_META = {
  food: { icon: "🍖", name: "肉", full: "肉食" },
  wood: { icon: "🪵", name: "木", full: "木材" },
  coal: { icon: "🪨", name: "煤", full: "石炭" },
  iron: { icon: "⚙️", name: "铁", full: "铁料" },
};

export const FACTION_META = {
  wei: { name: "魏", color: "var(--wei)" },
  shu: { name: "蜀", color: "var(--shu)" },
  wu: { name: "吴", color: "var(--wu)" },
  qun: { name: "群", color: "var(--qun)" },
};

export const QUALITY_META = {
  blue: { name: "精锐", color: "var(--q-blue)", stars: 2 },
  purple: { name: "史诗", color: "var(--q-purple)", stars: 3 },
  orange: { name: "传奇", color: "var(--q-orange)", stars: 4 },
  red: { name: "绝世", color: "var(--q-red)", stars: 5 },
};

export const TROOP_META = {
  infantry: { name: "步兵", short: "步", icon: "🛡" },
  cavalry: { name: "骑兵", short: "骑", icon: "🐎" },
  archer: { name: "弓兵", short: "弓", icon: "🏹" },
};

export const TROOP_ORDER = ["infantry", "cavalry", "archer"];

export const QUEST_STATUS_META = {
  ready: { name: "可领取", cls: "is-ready" },
  active: { name: "进行中", cls: "is-active" },
  locked: { name: "未解锁", cls: "is-locked" },
  claimed: { name: "已领取", cls: "is-claimed" },
};

/** 失败结局文案：key 为 reason 里出现的关键词。 */
const DEFEAT_META = {
  morale: {
    title: "民心崩溃",
    desc: "怨声载道，百姓四散奔逃。空城之中，再无人替火炉添一根薪柴。",
  },
  city: {
    title: "灭城",
    desc: "最后一名丁口倒在雪里。风雪掩去屋脊，拾薪城自此从舆图上抹去。",
  },
  freeze: {
    title: "炉火熄灭",
    desc: "燃料告罄，火炉在长夜里熄成一堆冷灰，全城冻毙。",
  },
  default: {
    title: "城池陷落",
    desc: "冰河吞没了这座小城。史书上只留下一行：其冬大寒，城废。",
  },
};

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function clamp01(n) {
  return Math.max(0, Math.min(1, num(n)));
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

export function fmt(n) {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(1)}万`;
  if (Math.abs(v) >= 1000) return String(Math.round(v));
  return String(Math.round(v));
}
export function fmtRate(n) {
  const v = Number(n) || 0;
  const s = Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1);
  return (v > 0 ? "+" : "") + s;
}

const $ = (id) => document.getElementById(id);

/* ============================================================
   状态读取：对上游三种结构一律宽容
   ------------------------------------------------------------
   兵力可能是 state.army.troops{}、state.troops{} 或旧的标量 state.troops；
   任务可能是数组、{entries,order} 或 {list}。UI 只读，读不到就退回旧形态。
   ============================================================ */

/**
 * 读三兵种编成。兼容三种写法：
 *   bridge/view.js  state.army = { infantry, cavalry, archer, wounded: 数 }
 *   systems/combat  state.army = { troops: {…}, wounded: {…} }
 *   旧内核          state.troops = 数（此时返回 null，调用方沿用标量兵力）
 * @returns {{troops:object, wounded:object, cap:object|null, total:number,
 *            woundedTotal:number, woundedByType:boolean}|null}
 */
export function readArmy(state) {
  const army = state?.army && typeof state.army === "object" ? state.army : null;
  const flat = army && TROOP_ORDER.some((t) => typeof army[t] === "number") ? army : null;
  const src =
    (army?.troops && typeof army.troops === "object" ? army.troops : null) ??
    flat ??
    (state?.troops && typeof state.troops === "object" ? state.troops : null);
  if (!src) return null;

  const troops = {};
  let total = 0;
  for (const t of TROOP_ORDER) {
    troops[t] = Math.max(0, Math.floor(num(src[t])));
    total += troops[t];
  }

  const wraw = army?.wounded ?? state?.wounded ?? null;
  const wounded = { infantry: 0, cavalry: 0, archer: 0 };
  let woundedTotal = 0;
  let woundedByType = false;
  if (wraw && typeof wraw === "object") {
    woundedByType = true;
    for (const t of TROOP_ORDER) {
      wounded[t] = Math.max(0, Math.floor(num(wraw[t])));
      woundedTotal += wounded[t];
    }
  } else if (typeof wraw === "number") {
    woundedTotal = Math.max(0, Math.floor(wraw));
  }

  const capSrc = army?.cap ?? army?.troopCaps ?? state?.troopCaps ?? null;
  let cap = null;
  if (capSrc && typeof capSrc === "object") {
    cap = {};
    for (const t of TROOP_ORDER) cap[t] = Math.max(0, Math.floor(num(capSrc[t])));
  }
  return { troops, wounded, cap, total, woundedTotal, woundedByType };
}

/**
 * 出征编成：带三兵种明细，同时 Number(mix) === 合计兵力。
 * 只认标量兵力的旧接口（bridge/actions.js 的 previewRaid/raid）拿到的是总数，
 * 认分兵的接口可以直接读 infantry / cavalry / archer。
 */
export function makeTroopMix(counts) {
  const out = {};
  let total = 0;
  for (const t of TROOP_ORDER) {
    out[t] = Math.max(0, Math.floor(num(counts?.[t])));
    total += out[t];
  }
  Object.defineProperty(out, "valueOf", { value: () => total, enumerable: false });
  Object.defineProperty(out, "total", { value: total, enumerable: false });
  return out;
}

/** 「步12 骑8 弓6」 */
export function troopsSummary(army) {
  if (!army) return "";
  return TROOP_ORDER.map((t) => `${TROOP_META[t].short}${fmt(army.troops[t])}`).join(" ");
}

/** 奖励归一化：兼容 {resources:{},tickets,heroXp} 与扁平 {food:80,recruitTickets:1,heroId}。 */
export function normalizeRewards(rewards) {
  const out = [];
  if (!rewards || typeof rewards !== "object") return out;
  const push = (icon, label, value) => {
    if (!value) return;
    out.push({ icon, label, value });
  };
  const bag = rewards.resources && typeof rewards.resources === "object" ? rewards.resources : null;
  const seen = new Set();
  const addRes = (k, v) => {
    const amount = Math.round(num(v));
    if (!amount || seen.has(k)) return;
    seen.add(k);
    const meta = RES_META[k] || { icon: "◆", name: k };
    push(meta.icon, meta.name, fmt(amount));
  };
  if (bag) for (const k of Object.keys(bag)) addRes(k, bag[k]);
  for (const k of Object.keys(rewards)) {
    if (k in RES_META && typeof rewards[k] === "number") addRes(k, rewards[k]);
  }
  const tickets = Math.round(num(rewards.tickets ?? rewards.recruitTickets));
  push("🏮", "招募令", tickets || 0);
  const xp = Math.round(num(rewards.heroXp ?? rewards.xp));
  push("⭑", "武将经验", xp || 0);
  const heroes = [rewards.heroId, rewards.hero, ...(Array.isArray(rewards.heroes) ? rewards.heroes : [])]
    .filter((h) => typeof h === "string" && h);
  if (heroes.length) push("⚑", "武将", heroes.length > 1 ? `×${heroes.length}` : "入帐");
  return out;
}

function questCatalogIndex(state) {
  const raw = state?.questCatalog ?? state?.quests?.catalog ?? state?.questDefs;
  const map = new Map();
  if (Array.isArray(raw)) {
    for (const q of raw) if (q && q.id) map.set(q.id, q);
  }
  return map;
}

function questSource(state) {
  const q = state?.quests;
  if (Array.isArray(state?.questList)) return state.questList;
  if (Array.isArray(q)) return q;
  if (q && typeof q === "object") {
    if (Array.isArray(q.list)) return q.list;
    if (q.entries && typeof q.entries === "object") {
      const order = Array.isArray(q.order) && q.order.length ? q.order : Object.keys(q.entries);
      return order.map((id) => q.entries[id]).filter(Boolean);
    }
  }
  return [];
}

function normalizeQuest(raw, catalog) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id ?? raw.key;
  if (!id) return null;
  const def = catalog.get(id) || {};
  const prog = raw.progress && typeof raw.progress === "object" ? raw.progress : null;
  const target = Math.max(0, num(raw.target ?? prog?.target ?? def.target ?? def.require?.value));
  const current = Math.max(0, num(prog ? prog.current : raw.progress ?? raw.current));
  const statusRaw = String(raw.status ?? "").toLowerCase();
  let status = QUEST_STATUS_META[statusRaw] ? statusRaw : null;
  if (!status) {
    if (raw.claimed) status = "claimed";
    else if (raw.done || raw.completed || raw.ready) status = "ready";
    else if (raw.locked) status = "locked";
    else status = "active";
  }
  const ratio = raw.ratio != null
    ? clamp01(raw.ratio)
    : target > 0
      ? clamp01(current / target)
      : status === "ready" || status === "claimed" ? 1 : 0;
  return {
    id,
    name: raw.name ?? raw.title ?? def.name ?? def.title ?? id,
    desc: raw.desc ?? raw.text ?? def.desc ?? "",
    status,
    current: Math.min(current, target || current),
    target,
    ratio,
    rewards: normalizeRewards(raw.rewards ?? raw.reward ?? def.rewards ?? def.reward),
  };
}

/** UI 视角的任务列表；无任务数据时返回空数组（托盘随之隐藏）。 */
export function readQuests(state) {
  const catalog = questCatalogIndex(state);
  return questSource(state)
    .map((raw) => normalizeQuest(raw, catalog))
    .filter(Boolean);
}

/** 失败结局：读 gameOver / flags.gameOver，解析出中文标题与说明。 */
export function readDefeat(state) {
  const flag = state?.gameOver ?? state?.flags?.gameOver ?? null;
  if (!flag) return null;
  const reason = String(
    state?.gameOverReason ?? state?.flags?.gameOverReason ?? (typeof flag === "string" ? flag : flag?.reason ?? "")
  ).toLowerCase();
  let meta = DEFEAT_META.default;
  if (/moral|民心|despair/.test(reason)) meta = DEFEAT_META.morale;
  else if (/pop|people|extinct|city|灭城|丁口/.test(reason)) meta = DEFEAT_META.city;
  else if (/freeze|frozen|cold|fuel|炉|冻/.test(reason)) meta = DEFEAT_META.freeze;
  return { reason, title: meta.title, desc: meta.desc };
}

export function createHud({ onSpeed, onOpen, onHero, onRestart, onClaimQuest, onExport, onImport } = {}) {
  const resBar = $("res-bar");
  const speedBar = $("speed-bar");
  const dock = $("dock");
  const heroStrip = $("hero-strip");
  const logList = $("log-list");
  const toastRoot = $("toast-root");
  const questTray = $("quest-tray");
  const questList = $("quest-tray-list");
  const questCount = $("quest-tray-count");
  const tools = $("hud-tools");
  const fileInput = $("save-file-input");
  const overRoot = $("gameover-root");

  const resNodes = {};
  for (const key of Object.keys(RES_META)) {
    const meta = RES_META[key];
    const el = document.createElement("div");
    el.className = "res";
    el.dataset.res = key;
    el.title = meta.full;
    el.innerHTML = `
      <span class="res__icon">${meta.icon}</span>
      <span class="res__body">
        <span class="res__top">
          <span class="res__name">${meta.name}</span>
          <span class="res__val">0</span>
          <span class="res__cap">/0</span>
          <span class="res__rate">+0</span>
        </span>
        <span class="res__meter"><i></i></span>
      </span>`;
    resBar.appendChild(el);
    resNodes[key] = {
      root: el,
      val: el.querySelector(".res__val"),
      cap: el.querySelector(".res__cap"),
      rate: el.querySelector(".res__rate"),
      meter: el.querySelector(".res__meter i"),
    };
  }

  speedBar.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-speed]");
    if (!btn) return;
    onSpeed?.(Number(btn.dataset.speed));
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-open]");
    if (!btn) return;
    onOpen?.(btn.dataset.open);
  });

  heroStrip.addEventListener("click", (e) => {
    const row = e.target.closest("[data-hero]");
    if (row) onHero?.(row.dataset.hero);
  });

  /* ── 任务托盘 ─────────────────────────────────────────────── */
  let trayOpen = true;
  questTray?.addEventListener("click", (e) => {
    const toggle = e.target.closest("#quest-tray-toggle");
    if (toggle) {
      trayOpen = !trayOpen;
      questTray.classList.toggle("is-collapsed", !trayOpen);
      toggle.setAttribute("aria-expanded", String(trayOpen));
      return;
    }
    const claim = e.target.closest("[data-claim]");
    if (claim) {
      claimQuest(claim.dataset.claim, claim.dataset.questName || "");
    }
  });

  function claimQuest(id, name) {
    if (!onClaimQuest) return toast("任务奖励尚未接通", "warn");
    let r;
    try {
      r = onClaimQuest(id);
    } catch (err) {
      console.warn("[sanguo] 领取任务出错", err);
      return toast("领取失败", "bad");
    }
    if (r && r.ok === false) return toast(r.reason || "尚不可领取", "warn");
    toast(`功业已录：${name || id}`, "good");
    return r;
  }

  /* ── 存档导出 / 导入 ──────────────────────────────────────── */
  const btnExport = $("btn-export");
  const btnImport = $("btn-import");
  if (btnExport) btnExport.hidden = !onExport;
  if (btnImport) btnImport.hidden = !onImport;
  if (tools) tools.hidden = !onExport && !onImport;

  function doExport() {
    if (!onExport) return;
    let payload;
    try {
      payload = onExport();
    } catch (err) {
      console.warn("[sanguo] 导出存档出错", err);
      return toast("导出失败", "bad");
    }
    if (payload == null) return; // 回调自行处理了下载
    const text = typeof payload === "string" ? payload : JSON.stringify(payload);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `sanguo-ice-age-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast("存档已导出为文件", "good");
  }

  btnExport?.addEventListener("click", doExport);
  $("btn-gameover-export")?.addEventListener("click", doExport);
  btnImport?.addEventListener("click", () => fileInput?.click());
  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    fileInput.value = "";
    if (!file || !onImport) return;
    let text;
    try {
      text = await file.text();
    } catch {
      return toast("读取文件失败", "bad");
    }
    let r;
    try {
      r = onImport(text);
    } catch (err) {
      console.warn("[sanguo] 导入存档出错", err);
      return toast("存档无法解析", "bad");
    }
    if (r && r.ok === false) return toast(r.reason || "存档无法解析", "bad");
    toast("存档已载入", "good");
  });

  /* ── 失败幕 ───────────────────────────────────────────────── */
  $("btn-restart")?.addEventListener("click", () => {
    if (!onRestart) return toast("重开尚未接通", "warn");
    hideDefeat();
    onRestart();
  });

  let lastLogId = -1;
  let lastHeroSig = null;
  let lastQuestSig = null;
  let lastDefeatKey = null;

  function update(state) {
    /* 资源 */
    for (const key of Object.keys(RES_META)) {
      const n = resNodes[key];
      const amt = state.resources?.[key] ?? 0;
      const cap = state.capacity?.[key] ?? 0;
      const rate = state.rates?.[key] ?? 0;
      n.val.textContent = fmt(amt);
      n.cap.textContent = cap ? `/${fmt(cap)}` : "";
      n.rate.textContent = `${fmtRate(rate)}/日`;
      n.rate.className = `res__rate ${rate > 0.05 ? "" : rate < -0.05 ? "is-neg" : "is-zero"}`;
      const pct = cap ? Math.min(100, (amt / cap) * 100) : 0;
      n.meter.style.width = `${pct}%`;
      n.root.classList.toggle("is-full", cap > 0 && amt >= cap * 0.985);
      n.root.classList.toggle("is-low", amt < cap * 0.06 && rate < 0);
    }

    /* 主题：温度带 / 危机态写到 <html> 上，tokens.css 据此换色 */
    applyClimateTheme(state);

    /* 温度 */
    const temp = state.temp ?? 0;
    const tv = $("temp-value");
    tv.textContent = `${temp > 0 ? "+" : ""}${temp.toFixed(1)}°`;
    const pct = Math.max(2, Math.min(100, ((temp + 34) / 54) * 100));
    $("thermo-fill").style.height = `${pct}%`;
    const tw = $("vital-temp");
    tw.classList.toggle("is-freeze", temp <= -6);
    tw.classList.toggle("is-warm", temp >= 8);
    $("temp-note").textContent =
      temp <= -14 ? "极寒" : temp <= -6 ? "冰封" : temp <= 0 ? "严寒" : temp < 8 ? "微寒" : "温暖";

    /* 日 / 时段 */
    $("day-value").textContent = state.day ?? 1;
    const p = state.dayProgress ?? 0;
    $("phase-value").textContent = p < 0.25 ? "拂晓" : p < 0.55 ? "白昼" : p < 0.78 ? "黄昏" : "长夜";

    /* 民心 */
    const morale = Math.round(state.morale ?? 0);
    $("morale-value").textContent = morale;
    $("morale-fill").style.width = `${Math.max(0, Math.min(100, morale))}%`;
    $("vital-morale").classList.toggle("is-bad", morale < 35);

    /* 人口 */
    const pop = state.population || {};
    $("pop-value").textContent = `${Math.floor(pop.total ?? 0)}`;
    $("pop-note").textContent = `闲置 ${Math.max(0, Math.floor(pop.idle ?? 0))}`;

    /* 君主 */
    $("brand-sub").textContent = `${state.lord?.name ?? "流民县令"} · ${state.cityName ?? "拾薪城"}`;

    /* 速度 */
    const spd = state.paused ? 0 : state.speed ?? 1;
    for (const b of speedBar.querySelectorAll("[data-speed]")) {
      b.classList.toggle("is-on", Number(b.dataset.speed) === spd);
    }

    /* 天气条 */
    const chip = $("weather-chip");
    const blizz = (state.blizzard ?? 0) > 0.05;
    chip.classList.toggle("is-blizzard", blizz);
    $("weather-text").textContent = blizz
      ? `寒潮 · 余 ${Math.max(1, Math.ceil(state.blizzardDaysLeft ?? 1))} 日`
      : state.blizzardIn != null
        ? `霜夜 · ${state.blizzardIn} 日后寒潮`
        : "霜夜";
    $("scene-frost").classList.toggle("is-on", blizz);
    const banner = $("blizzard-banner");
    const showBanner = !!state.blizzardBanner;
    if (banner.hidden === showBanner) banner.hidden = !showBanner;
    if (showBanner) $("blizzard-sub").textContent = state.blizzardBannerSub || "气温骤降，速添薪火";

    /* 底栏提示 */
    const furnace = (state.buildings || []).find((b) => b.key === "furnace");
    const fuelDays = state.fuelDays;
    const fuelText =
      fuelDays == null ? "—" : fuelDays >= 30 ? "充裕" : fuelDays < 0.1 ? "已断" : `${fuelDays.toFixed(1)} 日`;
    $("dock-furnace-note").textContent = furnace ? `${furnace.level} 级 · 燃料${fuelText}` : "尚未点燃";
    $("dock-recruit-note").textContent = `招募令 ${state.recruitTickets ?? 0}`;
    const army = readArmy(state);
    $("dock-war-note").textContent = army
      ? `${troopsSummary(army)}${army.woundedTotal ? ` · 伤${fmt(army.woundedTotal)}` : ""}`
      : state.heroes?.length
        ? `武将 ${state.heroes.length} · 兵 ${fmt(state.troops ?? 0)}`
        : "尚无武将";
    $("dock-tech-note").textContent = state.tech
      ? `已研 ${Object.values(state.tech).filter(Boolean).length} 项`
      : "典籍待启";

    setBadge("recruit", state.recruitTickets > 0 ? state.recruitTickets : 0);
    dock.querySelector('[data-open="furnace"]')?.classList.toggle("is-pulse", (fuelDays ?? 9) < 2);

    /* 武将条 */
    const heroes = state.heroes || [];
    const sig = heroes.map((h) => `${h.id}:${h.level}:${h.power}`).join("|");
    if (sig !== lastHeroSig) {
      lastHeroSig = sig;
      renderHeroes(heroes);
    }

    /* 任务托盘 */
    renderQuests(readQuests(state));

    /* 失败幕 */
    const defeat = readDefeat(state);
    if (defeat) showDefeat(defeat, state);
    else hideDefeat();

    /* 邸报 */
    renderLog(state.log || []);
  }

  function applyClimateTheme(state) {
    const el = document.documentElement;
    const t = num(state.temp);
    const band = t >= 8 ? "comfort" : t >= 0 ? "mild" : t > -6 ? "cold" : "freeze";
    if (el.dataset.temp !== band) el.dataset.temp = band;

    const morale = num(state.morale);
    const crisis = state.gameOver || state.flags?.gameOver || morale <= 15
      ? "collapse"
      : num(state.blizzard) > 0.05
        ? "blizzard"
        : "";
    if (crisis) {
      if (el.dataset.crisis !== crisis) el.dataset.crisis = crisis;
    } else if (el.dataset.crisis != null) {
      delete el.dataset.crisis;
    }
  }

  /* ── 任务托盘渲染 ─────────────────────────────────────────── */
  function renderQuests(quests) {
    if (!questTray || !questList) return;
    const shown = quests.filter((q) => q.status === "ready" || q.status === "active");
    shown.sort((a, b) => {
      if (a.status !== b.status) return a.status === "ready" ? -1 : 1;
      return b.ratio - a.ratio;
    });
    const claimed = quests.filter((q) => q.status === "claimed").length;
    const sig = `${claimed}|${shown
      .map((q) => `${q.id}:${q.status}:${q.current}/${q.target}`)
      .join("|")}`;
    if (sig === lastQuestSig) return;
    lastQuestSig = sig;

    if (!quests.length) {
      questTray.hidden = true;
      questList.innerHTML = "";
      return;
    }
    questTray.hidden = false;

    const readyCount = shown.filter((q) => q.status === "ready").length;
    questCount.textContent = readyCount ? `${readyCount} 待领` : `${shown.length} 在办`;
    questCount.classList.toggle("is-ready", readyCount > 0);
    questTray.classList.toggle("has-ready", readyCount > 0);

    if (!shown.length) {
      questList.innerHTML = `<li class="quest-tray__empty">功业簿已尽，${claimed} 条皆成。</li>`;
      return;
    }

    questList.innerHTML = shown
      .slice(0, 6)
      .map((q) => {
        const meta = QUEST_STATUS_META[q.status];
        const pct = Math.round(q.ratio * 100);
        const rewards = q.rewards.length
          ? `<div class="quest__rewards">${q.rewards
              .map((r) => `<span class="quest__reward">${r.icon} ${esc(r.label)} ${esc(r.value)}</span>`)
              .join("")}</div>`
          : "";
        const ready = q.status === "ready";
        return `<li class="quest ${meta.cls}">
          <div class="quest__top">
            <span class="quest__name" title="${esc(q.desc)}">${esc(q.name)}</span>
            <span class="quest__tag">${meta.name}</span>
          </div>
          <div class="quest__bar"><i style="width:${pct}%"></i></div>
          <div class="quest__foot">
            <span class="quest__num">${q.target > 0 ? `${fmt(q.current)} / ${fmt(q.target)}` : `${pct}%`}</span>
            <button class="btn btn--sm ${ready ? "btn--primary" : ""}" data-claim="${esc(q.id)}"
              data-quest-name="${esc(q.name)}" ${ready ? "" : "disabled"}>领赏</button>
          </div>
          ${rewards}
        </li>`;
      })
      .join("");
  }

  /* ── 失败幕 ───────────────────────────────────────────────── */
  function showDefeat(defeat, state) {
    if (!overRoot) return;
    const key = `${defeat.title}|${Math.floor(num(state.day))}`;
    if (lastDefeatKey === key && !overRoot.hidden) return;
    lastDefeatKey = key;
    $("gameover-title").textContent = "拾薪城陷";
    $("gameover-reason").textContent = defeat.title;
    $("gameover-desc").textContent = defeat.desc;
    const stats = [
      ["坚守", `${Math.floor(num(state.day))} 日`],
      ["民心", `${Math.round(num(state.morale))}`],
      ["丁口", `${Math.floor(num(state.population?.total))}`],
      ["战绩", `${num(state.stats?.wins ?? state.stats?.battleWins)}胜/${num(state.stats?.battles)}战`],
    ];
    $("gameover-stats").innerHTML = stats
      .map(([k, v]) => `<div class="gameover__stat"><span>${k}</span><b>${esc(v)}</b></div>`)
      .join("");
    const exportBtn = $("btn-gameover-export");
    if (exportBtn) exportBtn.hidden = !onExport;
    overRoot.hidden = false;
  }

  function hideDefeat() {
    if (!overRoot || overRoot.hidden) return;
    overRoot.hidden = true;
    lastDefeatKey = null;
  }

  function setBadge(openKey, n) {
    const btn = dock.querySelector(`[data-open="${openKey}"]`);
    if (!btn) return;
    let badge = btn.querySelector(".badge");
    if (!n) {
      badge?.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "badge";
      btn.appendChild(badge);
    }
    badge.textContent = n > 99 ? "99+" : n;
  }

  function renderHeroes(heroes) {
    if (!heroes.length) {
      heroStrip.innerHTML =
        '<div class="hero-strip__empty">帐下无人。<br/>前往 <b>招贤</b> 张榜求贤。</div>';
      return;
    }
    heroStrip.innerHTML = heroes
      .slice()
      .sort((a, b) => (b.power || 0) - (a.power || 0))
      .map((h) => {
        const f = FACTION_META[h.faction] || FACTION_META.qun;
        const q = QUALITY_META[h.quality] || QUALITY_META.blue;
        return `<div class="hero-mini" data-hero="${h.id}" style="--f-color:${f.color}" title="${h.name} · ${q.name}">
          <span class="hero-mini__av">${h.name[0]}</span>
          <span>
            <span class="hero-mini__name">${h.name}</span>
            <span class="hero-mini__meta">${f.name}军 · ${q.name} · ${TROOP_META[h.troop]?.name ?? "步兵"} · Lv${h.level ?? 1}</span>
          </span>
          <span class="hero-mini__pow">${fmt(h.power ?? 0)}</span>
        </div>`;
      })
      .join("");
  }

  function renderLog(log) {
    const latest = log.length ? log[log.length - 1].id : -1;
    if (latest === lastLogId) return;
    lastLogId = latest;
    const items = log.slice(-40).reverse();
    logList.innerHTML = items
      .map(
        (e) => `<li class="log-item is-${e.kind || "info"}">
        <span class="log-item__day">D${e.day}</span>
        <span class="log-item__text">${e.text}</span>
      </li>`
      )
      .join("");
    $("log-count").textContent = log.length;
  }

  const TOAST_ICON = { good: "✦", warn: "⚠", bad: "✖", info: "❄" };
  function toast(text, kind = "info", ms = 2600) {
    const el = document.createElement("div");
    el.className = `toast ${kind}`;
    el.innerHTML = `<span class="toast__ico">${TOAST_ICON[kind] || "❄"}</span><span>${text}</span>`;
    toastRoot.appendChild(el);
    setTimeout(() => {
      el.classList.add("is-out");
      setTimeout(() => el.remove(), 400);
    }, ms);
    while (toastRoot.children.length > 4) toastRoot.firstElementChild.remove();
  }

  // render 是 update 的别名：主题写入与整屏刷新是同一次调用。
  return { update, render: update, toast, setBadge, showDefeat, hideDefeat, claimQuest };
}
