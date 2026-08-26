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
  infantry: { name: "步兵", icon: "🛡" },
  cavalry: { name: "骑兵", icon: "🐎" },
  archer: { name: "弓兵", icon: "🏹" },
};

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

export function createHud({ onSpeed, onOpen, onHero } = {}) {
  const resBar = $("res-bar");
  const speedBar = $("speed-bar");
  const dock = $("dock");
  const heroStrip = $("hero-strip");
  const logList = $("log-list");
  const toastRoot = $("toast-root");

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

  let lastLogId = -1;
  let lastHeroSig = null;

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
    $("dock-war-note").textContent = state.heroes?.length
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

    /* 邸报 */
    renderLog(state.log || []);
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

  return { update, toast, setBadge };
}
