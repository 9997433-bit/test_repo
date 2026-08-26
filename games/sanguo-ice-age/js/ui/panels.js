/**
 * 弹出面板：建筑升级 / 火炉 / 招贤 / 讨伐 / 战报 / 太学。
 *
 * 面板渲染函数返回可选的 tick(state)，用于逐帧刷新「买得起 / 买不起」
 * 之类的轻量状态，避免整块重绘打断用户操作。
 */

import {
  RES_META, FACTION_META, QUALITY_META, TROOP_META, TROOP_ORDER, QUEST_STATUS_META,
  fmt, readArmy, readQuests, makeTroopMix,
} from "./hud.js";

const root = () => document.getElementById("modal-root");

const SIGIL = {
  furnace: "🔥", recruit: "🏮", expedition: "⚔️", academy: "📜", report: "📯", quests: "🎯",
};

/** 战报里可能出现的乘区键 → 中文名。 */
const COUNTER_LABELS = {
  troop: "兵种克制", troopAdvantage: "兵种克制",
  faction: "阵营克制", factionAdvantage: "阵营克制",
  morale: "民心", wall: "城墙守备", hero: "武将加成",
  same: "同阵营", terrain: "地利", tech: "典籍", skill: "技能",
  atkMul: "同阵营·攻", defMul: "同阵营·防", hpMul: "同阵营·兵力",
};

function escText(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function costChips(cost, res) {
  return Object.entries(cost || {})
    .map(([k, v]) => {
      const meta = RES_META[k] || { icon: "◆", name: k };
      const short = (res?.[k] ?? 0) < v;
      return `<span class="cost ${short ? "is-short" : ""}" data-cost="${k}" data-need="${v}">
        ${meta.icon} ${fmt(v)}<em>${meta.name}</em></span>`;
    })
    .join("");
}

function refreshCostChips(scope, res) {
  for (const chip of scope.querySelectorAll("[data-cost]")) {
    const k = chip.dataset.cost;
    const need = Number(chip.dataset.need);
    chip.classList.toggle("is-short", (res?.[k] ?? 0) < need);
  }
}

function stars(n) {
  return "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));
}

export function createPanels({ game, hud, onClaimQuest } = {}) {
  let current = null;      // { kind, tick }
  let onCloseCb = null;

  const host = root();
  host.addEventListener("click", (e) => {
    if (e.target === host) close();
  });

  function close() {
    host.hidden = true;
    host.innerHTML = "";
    current = null;
    onCloseCb?.();
  }

  function isOpen() {
    return !host.hidden;
  }

  function shell({ kind, title, sub, sigil, wide, narrow, body, foot }) {
    host.hidden = false;
    host.innerHTML = "";
    const panel = el(`
      <div class="panel ${wide ? "panel--wide" : ""} ${narrow ? "panel--narrow" : ""}" role="dialog" aria-modal="true">
        <header class="panel__head">
          <div class="panel__sigil">${sigil || "❄"}</div>
          <div class="panel__titles">
            <h2 class="panel__title">${title}</h2>
            <p class="panel__sub">${sub || ""}</p>
          </div>
          <button class="panel__close" aria-label="关闭">✕</button>
        </header>
        <div class="panel__body"></div>
        <footer class="panel__foot"></footer>
      </div>`);
    panel.querySelector(".panel__close").addEventListener("click", close);
    const bodyEl = panel.querySelector(".panel__body");
    const footEl = panel.querySelector(".panel__foot");
    if (typeof body === "string") bodyEl.innerHTML = body;
    else if (body) bodyEl.appendChild(body);
    if (typeof foot === "string") footEl.innerHTML = foot;
    else if (foot) footEl.appendChild(foot);
    host.appendChild(panel);
    current = { kind, tick: null, panel, bodyEl, footEl };
    return current;
  }

  /* ============================================================
     建筑 / 火炉
     ============================================================ */
  function openBuilding(key) {
    const info = game.buildingInfo(key);
    if (!info) return;
    if (key === "furnace") return openFurnace();

    const st = game.state;
    const ctxObj = shell({
      kind: `building:${key}`,
      title: info.name,
      sub: `${info.tag || "城中设施"} · ${info.level} / ${info.maxLevel} 级`,
      sigil: info.icon,
      body: buildingBody(info, st),
      foot: `
        <span class="foot-note" data-note>${info.blockedReason || "消耗资源提升等级"}</span>
        <button class="btn btn--ghost" data-act="close">关闭</button>
        <button class="btn btn--primary" data-act="upgrade">升 ${info.level + 1} 级</button>`,
    });
    wireBuilding(ctxObj, key);
  }

  function buildingBody(info, st) {
    const prod = info.production || {};
    const nextProd = info.nextProduction || {};
    const gains = Object.keys({ ...prod, ...nextProd });
    return `
      <div class="bp">
        <div>
          <div class="bp__art" style="--tint:${info.tint || "#6fc0dc"}">
            <div style="position:absolute;inset:0;background:
              radial-gradient(70% 90% at 50% 118%, rgba(255,154,60,.34), rgba(255,154,60,0) 62%),
              radial-gradient(60% 70% at 22% 12%, rgba(140,214,236,.2), rgba(140,214,236,0) 66%);"></div>
            <div style="position:absolute;inset:0;display:grid;place-items:center;font-size:74px;filter:drop-shadow(0 12px 22px rgba(0,0,0,.65))">${info.icon}</div>
            <span class="bp__lvchip">${info.level} 级 / 上限 ${info.maxLevel}</span>
          </div>
          <p class="bp__desc">${info.desc}</p>
        </div>
        <div>
          <div class="section-title">当前效能</div>
          <div class="stat-grid">
            <div class="stat"><div class="stat__k">等级</div><div class="stat__v">${info.level}<small>/ ${info.maxLevel}</small></div></div>
            <div class="stat"><div class="stat__k">在岗工人</div><div class="stat__v">${info.workers}<small>/ ${info.maxWorkers}</small></div></div>
            <div class="stat"><div class="stat__k">主要产出</div><div class="stat__v">${info.mainOutput || "—"}</div></div>
            <div class="stat"><div class="stat__k">保温耗热</div><div class="stat__v">${info.heatUse ?? 0}<small>热</small></div></div>
          </div>

          ${info.maxWorkers > 0 ? `
          <div class="section-title">派工</div>
          <div class="workers">
            <div class="workers__stepper">
              <button class="step-btn" data-worker="-1" ${info.workers <= 0 ? "disabled" : ""}>−</button>
              <span class="workers__count">${info.workers}<small> / ${info.maxWorkers}</small></span>
              <button class="step-btn" data-worker="1" ${info.workers >= info.maxWorkers || (st.population?.idle ?? 0) < 1 ? "disabled" : ""}>＋</button>
            </div>
            <div class="workers__pips">
              ${Array.from({ length: info.maxWorkers }, (_, i) => `<i class="pip ${i < info.workers ? "is-on" : ""}"></i>`).join("")}
            </div>
          </div>` : ""}

          <div class="section-title">升级</div>
          ${info.level >= info.maxLevel
            ? `<div class="notice notice--ice"><span>❄</span><span>${info.capReason || "已达当前上限，升级火炉可解锁更高等级。"}</span></div>`
            : `<div class="costs">${costChips(info.cost, st.resources)}</div>
               <div class="gain-list" style="margin-top:10px">
                 ${gains.map((k) => {
                   const meta = RES_META[k] || { icon: "◆", full: k };
                   return `<div class="gain-row">
                     <span>${meta.icon} ${meta.full} 产出</span>
                     <span class="now">${(prod[k] ?? 0).toFixed(1)}</span>
                     <span class="arw">→</span>
                     <span class="next">${(nextProd[k] ?? 0).toFixed(1)}</span>
                   </div>`;
                 }).join("")}
                 ${info.extraGains ? info.extraGains.map((g) => `<div class="gain-row"><span>${g.label}</span><span class="now">${g.now}</span><span class="arw">→</span><span class="next">${g.next}</span></div>`).join("") : ""}
               </div>
               ${info.blockedReason ? `<div class="notice" style="margin-top:10px"><span>⚠</span><span>${info.blockedReason}</span></div>` : ""}`}
        </div>
      </div>`;
  }

  function wireBuilding(c, key) {
    c.panel.addEventListener("click", (e) => {
      const w = e.target.closest("[data-worker]");
      if (w) {
        const r = game.addWorker(key, Number(w.dataset.worker));
        if (!r.ok) hud.toast(r.reason, "warn");
        return openBuilding(key);
      }
      const a = e.target.closest("[data-act]");
      if (!a) return;
      if (a.dataset.act === "close") return close();
      if (a.dataset.act === "upgrade") {
        const r = game.upgrade(key);
        if (!r.ok) return hud.toast(r.reason, "warn");
        hud.toast(`${r.name} 升至 ${r.level} 级`, "good");
        openBuilding(key);
      }
    });
    c.tick = (st) => {
      refreshCostChips(c.panel, st.resources);
      const btn = c.panel.querySelector('[data-act="upgrade"]');
      if (btn) {
        const info = game.buildingInfo(key);
        btn.disabled = !info.canUpgrade;
        const note = c.panel.querySelector("[data-note]");
        if (note) note.textContent = info.blockedReason || "消耗资源提升等级";
      }
    };
  }

  function openFurnace() {
    const info = game.buildingInfo("furnace");
    const st = game.state;
    const fuel = st.fuelMode || "auto";
    const others = (st.buildings || []).filter((b) => b.key !== "furnace");

    const c = shell({
      kind: "furnace",
      title: "火炉",
      sub: `全城命脉 · ${info.level} / ${info.maxLevel} 级 · 决定其他建筑等级上限`,
      sigil: SIGIL.furnace,
      wide: true,
      body: `
        <div class="bp">
          <div>
            <div class="bp__art">
              <div style="position:absolute;inset:0;background:
                radial-gradient(62% 78% at 50% 108%, rgba(255,140,40,.55), rgba(255,140,40,0) 66%),
                radial-gradient(70% 60% at 50% 6%, rgba(120,200,235,.16), rgba(120,200,235,0) 70%);"></div>
              <div style="position:absolute;inset:0;display:grid;place-items:center;font-size:84px;animation:bootFlicker 1.4s ease-in-out infinite;filter:drop-shadow(0 14px 26px rgba(0,0,0,.7))">🔥</div>
              <span class="bp__lvchip">${info.level} 级 · 供热 ${(st.furnaceHeat ?? 0).toFixed(1)}</span>
            </div>
            <p class="bp__desc">火炉是拾薪城唯一的热源。等级越高，覆盖半径与供热越强，同时决定其余建筑的等级上限。燃料耗尽则全城冻毙。</p>

            <div class="section-title">燃料</div>
            <div class="fuel-toggle">
              <button class="fuel-opt ${fuel === "wood" ? "is-on" : ""}" data-fuel="wood"><b>木柴</b><span>易得 · 热值低</span></button>
              <button class="fuel-opt ${fuel === "coal" ? "is-on" : ""}" data-fuel="coal"><b>石炭</b><span>稀缺 · 热值高</span></button>
              <button class="fuel-opt ${fuel === "auto" ? "is-on" : ""}" data-fuel="auto"><b>自动</b><span>寒潮时改烧炭</span></button>
            </div>
          </div>

          <div>
            <div class="section-title">城中热况</div>
            <div class="stat-grid">
              <div class="stat"><div class="stat__k">当前温度</div><div class="stat__v">${(st.temp ?? 0).toFixed(1)}<small>°</small></div></div>
              <div class="stat"><div class="stat__k">室外基温</div><div class="stat__v">${(st.outsideTemp ?? 0).toFixed(1)}<small>°</small></div></div>
              <div class="stat"><div class="stat__k">燃料可支</div><div class="stat__v">${st.fuelDays == null ? "—" : st.fuelDays >= 99 ? "充裕" : st.fuelDays.toFixed(1)}${st.fuelDays < 99 ? "<small>日</small>" : ""}</div></div>
              <div class="stat"><div class="stat__k">民心</div><div class="stat__v">${Math.round(st.morale ?? 0)}</div></div>
            </div>

            <div class="section-title">升级火炉</div>
            ${info.level >= info.maxLevel
              ? `<div class="notice notice--ice"><span>❄</span><span>火炉已达当前极限。</span></div>`
              : `<div class="costs">${costChips(info.cost, st.resources)}</div>
                 <div class="gain-list" style="margin-top:10px">
                   <div class="gain-row"><span>🔥 供热</span><span class="now">${(st.furnaceHeat ?? 0).toFixed(1)}</span><span class="arw">→</span><span class="next">${(st.furnaceHeatNext ?? 0).toFixed(1)}</span></div>
                   <div class="gain-row"><span>🏗 建筑等级上限</span><span class="now">${info.level}</span><span class="arw">→</span><span class="next">${info.level + 1}</span></div>
                   <div class="gain-row"><span>🔆 暖光半径</span><span class="now">${(4.6 + info.level * 0.22).toFixed(1)}</span><span class="arw">→</span><span class="next">${(4.6 + (info.level + 1) * 0.22).toFixed(1)}</span></div>
                 </div>`}

            <div class="section-title">城中建筑</div>
            <div class="blist">
              ${others.map((b) => {
                const bi = game.buildingInfo(b.key);
                return `<button class="blist-row ${bi.level >= bi.maxLevel ? "is-max" : ""}" data-goto="${b.key}">
                  <span class="blist-row__ico">${bi.icon}</span>
                  <span class="blist-row__b">
                    <span class="blist-row__n">${bi.name}</span>
                    <span class="blist-row__s">${bi.mainOutput || bi.tag || "—"}</span>
                  </span>
                  <span class="blist-row__lv">${bi.level}</span>
                </button>`;
              }).join("")}
            </div>
          </div>
        </div>`,
      foot: `
        <span class="foot-note" data-note>火炉等级 = 其余建筑等级上限</span>
        <button class="btn btn--ghost" data-act="close">关闭</button>
        <button class="btn btn--primary" data-act="upgrade">升 ${info.level + 1} 级</button>`,
    });

    c.panel.addEventListener("click", (e) => {
      const f = e.target.closest("[data-fuel]");
      if (f) {
        game.setFuel(f.dataset.fuel);
        return openFurnace();
      }
      const g = e.target.closest("[data-goto]");
      if (g) return openBuilding(g.dataset.goto);
      const a = e.target.closest("[data-act]");
      if (!a) return;
      if (a.dataset.act === "close") return close();
      if (a.dataset.act === "upgrade") {
        const r = game.upgrade("furnace");
        if (!r.ok) return hud.toast(r.reason, "warn");
        hud.toast(`火炉升至 ${r.level} 级，全城建筑上限提升`, "good");
        openFurnace();
      }
    });
    c.tick = (st2) => {
      refreshCostChips(c.panel, st2.resources);
      const btn = c.panel.querySelector('[data-act="upgrade"]');
      if (btn) btn.disabled = !game.buildingInfo("furnace").canUpgrade;
    };
  }

  /* ============================================================
     招贤
     ============================================================ */
  function openRecruit(results) {
    const st = game.state;
    const roster = st.heroes || [];
    const c = shell({
      kind: "recruit",
      title: "招贤馆",
      sub: "张榜求贤 · 魏蜀吴群齐聚拾薪城",
      sigil: SIGIL.recruit,
      wide: true,
      body: `
        <div class="recruit-hero">
          <div class="recruit-hero__lantern">🏮</div>
          <div class="recruit-hero__txt">
            <h3>广纳英豪</h3>
            <p>消耗招募令延请武将。品质分 <b style="color:var(--q-blue)">精锐</b> / <b style="color:var(--q-purple)">史诗</b> / <b style="color:var(--q-orange)">传奇</b> / <b style="color:var(--q-red)">绝世</b>；同阵营出征可得士气加成。<br/>十连招贤必出史诗及以上。</p>
          </div>
          <div class="ticket-count" data-tickets>${st.recruitTickets ?? 0}<small>招募令</small></div>
        </div>

        <div class="recruit-actions">
          <button class="btn btn--primary" data-draw="1">招贤一次 <em style="font-style:normal;opacity:.75">1 令</em></button>
          <button class="btn btn--ice" data-draw="10">十连招贤 <em style="font-style:normal;opacity:.75">10 令</em></button>
          <button class="btn" data-buy="1">以资换令 ${costChips(game.ticketCost(), st.resources)}</button>
        </div>

        <div class="section-title" style="margin-top:16px">招贤结果</div>
        <div class="draw-stage" data-stage>${results ? renderDraw(results) : '<div class="empty" style="grid-column:1/-1"><span class="empty__ico">🎐</span>尚未张榜。点击上方按钮招募武将。</div>'}</div>

        <div class="section-title">帐下名录 <span style="font-family:var(--font-num);font-size:11px;color:var(--text-faint);letter-spacing:.1em">${roster.length}</span></div>
        <div class="roster">${roster.length ? roster.map(rosterRow).join("") : '<div class="empty" style="grid-column:1/-1">帐下无人</div>'}</div>`,
      foot: `<span class="foot-note">同阵营 2 人 +8% 战力，3 人 +18%</span>
        <button class="btn btn--ghost" data-act="close">关闭</button>`,
    });

    c.panel.addEventListener("click", (e) => {
      if (e.target.closest('[data-act="close"]')) return close();
      const d = e.target.closest("[data-draw]");
      if (d) {
        const r = game.recruit(Number(d.dataset.draw));
        if (!r.ok) return hud.toast(r.reason, "warn");
        const best = r.results.reduce((a, b) => (QUALITY_META[b.hero.quality].stars > QUALITY_META[a.hero.quality].stars ? b : a));
        hud.toast(`招得 ${r.results.length} 人，最佳：${best.hero.name}（${QUALITY_META[best.hero.quality].name}）`, "good");
        return openRecruit(r.results);
      }
      const b = e.target.closest("[data-buy]");
      if (b) {
        const r = game.buyTicket();
        if (!r.ok) return hud.toast(r.reason, "warn");
        hud.toast("换得招募令 1 张", "good");
        return openRecruit(results);
      }
    });
    c.tick = (st2) => {
      refreshCostChips(c.panel, st2.resources);
      const t = c.panel.querySelector("[data-tickets]");
      if (t) t.firstChild.textContent = st2.recruitTickets ?? 0;
      for (const btn of c.panel.querySelectorAll("[data-draw]")) {
        btn.disabled = (st2.recruitTickets ?? 0) < Number(btn.dataset.draw);
      }
    };
  }

  function renderDraw(results) {
    return results
      .map((r, i) => {
        const h = r.hero;
        const f = FACTION_META[h.faction] || FACTION_META.qun;
        const q = QUALITY_META[h.quality] || QUALITY_META.blue;
        return `<div class="hero-card ${r.dupe ? "is-dupe" : ""}" style="--q-color:${q.color};--f-color:${f.color};animation-delay:${i * 70}ms"
             title="${h.title ? `${h.title} · ` : ""}${h.skillDesc || ""}">
          <span class="hero-card__q">${q.name}</span>
          <div class="hero-card__av">${h.name[0]}</div>
          <div class="hero-card__name">${h.name}</div>
          <div class="hero-card__faction">${f.name} · ${TROOP_META[h.troop]?.name ?? "步兵"}</div>
          <div class="hero-card__stars">${stars(q.stars)}</div>
          <div class="hero-card__line">${r.dupe ? `重复 → 升至 Lv${h.level}` : `战力 ${fmt(h.power)}`}</div>
          ${h.skill ? `<div class="hero-card__line" style="color:var(--ice-300)">${h.skill}</div>` : ""}
        </div>`;
      })
      .join("");
  }

  function rosterRow(h) {
    const f = FACTION_META[h.faction] || FACTION_META.qun;
    const q = QUALITY_META[h.quality] || QUALITY_META.blue;
    return `<div class="roster-row" style="--f-color:${f.color};--q-color:${q.color}"
         title="${h.title ? `${h.title}｜` : ""}${h.skill ? `${h.skill}：${h.skillDesc || ""}` : ""}">
      <span class="roster-row__av">${h.name[0]}</span>
      <span>
        <span class="roster-row__name">${h.name}${h.title ? `<span style="font-size:10px;color:var(--text-faint);margin-left:5px;letter-spacing:.06em">${h.title}</span>` : ""}</span>
        <span class="roster-row__meta"><i class="q-dot"></i>${q.name} · ${f.name}军 · ${TROOP_META[h.troop]?.name ?? "步兵"} · Lv${h.level}</span>
      </span>
      <span class="roster-row__pow">${fmt(h.power)}<small>战力</small></span>
    </div>`;
  }

  /* ============================================================
     讨伐
     ============================================================ */
  const warPick = { targetId: null, heroIds: [], troops: null, mix: null };

  /** 伤兵格：分兵种已知时写在滑条右侧，只有总数时留给下方的整条提示。 */
  function woundCell(army, t) {
    if (!army.woundedByType || !army.wounded[t]) return "";
    return `<em class="troop-slider__hurt">伤 ${fmt(army.wounded[t])}</em>`;
  }

  /** 三兵种编成的 HTML；只有 state.army 存在时才走这条分支。 */
  function troopMixBody(army) {
    const rows = TROOP_ORDER.map((t) => {
      const meta = TROOP_META[t];
      const avail = army.troops[t];
      const val = warPick.mix[t];
      return `<div class="troop-slider">
        <span class="troop-slider__k">${meta.icon} ${meta.name}</span>
        <input type="range" min="0" max="${Math.max(1, avail)}" step="1" value="${val}"
          data-mix="${t}" aria-label="${meta.name}出征人数" ${avail > 0 ? "" : "disabled"} />
        <span class="troop-slider__v" data-mixnum="${t}">${fmt(val)}<small> / ${fmt(avail)}</small>${woundCell(army, t)}</span>
      </div>`;
    }).join("");
    const breakdown = army.woundedByType
      ? `（${TROOP_ORDER.filter((t) => army.wounded[t]).map((t) => `${TROOP_META[t].name} ${fmt(army.wounded[t])}`).join(" · ")}）`
      : "";
    return `<div class="troop-mix">
      ${rows}
      <div class="troop-mix__foot">
        <span class="troop-mix__total" data-mixtotal>${fmt(warPick.troops)}<small> 合计出征</small></span>
        <button class="btn btn--sm" data-mixpreset="all">全征</button>
        <button class="btn btn--sm" data-mixpreset="half">减半</button>
        <button class="btn btn--sm" data-mixpreset="none">清零</button>
      </div>
    </div>
    ${army.woundedTotal
      ? `<div class="wound-note"><span>🩹 伤兵 <b>${fmt(army.woundedTotal)}</b> 人${breakdown}正在医馆将养，痊愈后自动归队，不计入出征兵力。</span></div>`
      : ""}`;
  }

  function openExpedition() {
    const st = game.state;
    const targets = game.targets();
    const heroes = st.heroes || [];
    const army = readArmy(st);
    const maxTroops = army ? army.total : Math.floor(st.troops ?? 0);

    if (!targets.some((t) => t.id === warPick.targetId)) {
      warPick.targetId = targets.find((t) => !t.cleared)?.id ?? targets[0]?.id ?? null;
    }
    warPick.heroIds = warPick.heroIds.filter((id) => heroes.some((h) => h.id === id));
    if (army) {
      const mix = warPick.mix || {};
      warPick.mix = {};
      for (const t of TROOP_ORDER) {
        const avail = army.troops[t];
        const prev = mix[t];
        warPick.mix[t] = prev == null
          ? Math.round(avail * 0.6)
          : Math.max(0, Math.min(avail, Math.round(prev)));
      }
      warPick.troops = TROOP_ORDER.reduce((s, t) => s + warPick.mix[t], 0);
    } else {
      warPick.mix = null;
      if (warPick.troops == null || warPick.troops > maxTroops) {
        warPick.troops = Math.max(0, Math.min(maxTroops, Math.round(maxTroops * 0.6)));
      }
    }

    const target = targets.find((t) => t.id === warPick.targetId);

    const c = shell({
      kind: "expedition",
      title: "讨伐",
      sub: "择将、点兵、出征，扫平四野流寇",
      sigil: SIGIL.expedition,
      wide: true,
      body: `
        <div class="war">
          <div>
            <div class="section-title">征讨目标</div>
            <div class="target-list">
              ${targets.length ? targets.map((t) => `
                <button class="target diff-${t.difficulty} ${t.id === warPick.targetId ? "is-on" : ""}" data-target="${t.id}">
                  <span class="target__tag">${["", "易", "中", "难"][t.difficulty] || "中"}</span>
                  <span class="target__top">
                    <span class="target__name">${t.name}</span>
                    <span class="target__pow">${fmt(t.power)}</span>
                  </span>
                  <div class="target__desc">${t.desc}${t.cleared ? " · <b style=\"color:var(--good)\">已平定（可再劫掠）</b>" : ""}</div>
                  <div class="target__loot">${Object.entries(t.loot).map(([k, v]) => `<span class="loot-chip">${(RES_META[k] || { icon: "🎖" }).icon} ${fmt(v)}</span>`).join("")}${t.ticket ? `<span class="loot-chip">🏮 招募令 ${t.ticket}</span>` : ""}</div>
                </button>`).join("") : '<div class="empty">四野暂无流寇</div>'}
            </div>
          </div>

          <div>
            <div class="section-title">点将（至多 3 人）</div>
            <div class="pick-grid">
              ${heroes.length ? heroes.map((h) => {
                const f = FACTION_META[h.faction] || FACTION_META.qun;
                return `<button class="pick ${warPick.heroIds.includes(h.id) ? "is-on" : ""}" data-pick="${h.id}" style="--f-color:${f.color}">
                  <div class="pick__name">${h.name}</div>
                  <div class="pick__meta">${f.name}军 · ${TROOP_META[h.troop]?.name ?? "步兵"} · Lv${h.level}</div>
                  <div class="pick__pow">战力 ${fmt(h.power)}</div>
                </button>`;
              }).join("") : '<div class="empty" style="grid-column:1/-1">帐下无将，先去招贤</div>'}
            </div>

            <div class="section-title">点兵</div>
            ${army ? troopMixBody(army) : `
            <div class="troop-row">
              <input type="range" min="0" max="${Math.max(1, maxTroops)}" step="1" value="${warPick.troops}" data-troops />
              <span class="troop-num" data-troopnum>${fmt(warPick.troops)}<small> / ${fmt(maxTroops)} 兵</small></span>
            </div>`}
            <div class="notice notice--ice" style="margin-top:10px">
              <span>⚔</span>
              <span>兵种克制：步兵克骑兵 · 骑兵克弓兵 · 弓兵克步兵。阵营克制：吴克蜀 · 蜀克魏 · 魏克吴。伤亡的兵员需在兵营重新征募。</span>
            </div>

            <div class="odds">
              <span class="odds__k">胜算</span>
              <span class="odds__gauge"><i data-oddsbar style="width:0%"></i></span>
              <span class="odds__v" data-oddsval>—</span>
            </div>
          </div>
        </div>`,
      foot: `
        <span class="foot-note" data-note>${target ? `目标：${target.name}` : "请选择目标"}</span>
        <button class="btn btn--ghost" data-act="close">关闭</button>
        <button class="btn btn--primary" data-act="march">出征</button>`,
    });

    const slider = c.panel.querySelector("[data-troops]");
    const troopNum = c.panel.querySelector("[data-troopnum]");
    slider?.addEventListener("input", () => {
      warPick.troops = Number(slider.value);
      troopNum.innerHTML = `${fmt(warPick.troops)}<small> / ${fmt(maxTroops)} 兵</small>`;
      updateOdds();
    });

    /** 三兵种滑条：只改数字与胜算，不整块重绘，避免打断拖动。 */
    function syncMix() {
      if (!army) return;
      warPick.troops = TROOP_ORDER.reduce((s, t) => s + warPick.mix[t], 0);
      for (const t of TROOP_ORDER) {
        const cell = c.panel.querySelector(`[data-mixnum="${t}"]`);
        if (!cell) continue;
        cell.innerHTML = `${fmt(warPick.mix[t])}<small> / ${fmt(army.troops[t])}</small>${woundCell(army, t)}`;
      }
      const total = c.panel.querySelector("[data-mixtotal]");
      if (total) total.innerHTML = `${fmt(warPick.troops)}<small> 合计出征</small>`;
      updateOdds();
    }

    for (const input of c.panel.querySelectorAll("[data-mix]")) {
      input.addEventListener("input", () => {
        warPick.mix[input.dataset.mix] = Number(input.value) || 0;
        syncMix();
      });
    }

    c.panel.addEventListener("click", (e) => {
      const preset = e.target.closest("[data-mixpreset]");
      if (preset && army) {
        const mode = preset.dataset.mixpreset;
        for (const t of TROOP_ORDER) {
          const avail = army.troops[t];
          warPick.mix[t] = mode === "all" ? avail : mode === "half" ? Math.floor(avail / 2) : 0;
          const input = c.panel.querySelector(`[data-mix="${t}"]`);
          if (input) input.value = String(warPick.mix[t]);
        }
        return syncMix();
      }
      const t = e.target.closest("[data-target]");
      if (t) {
        warPick.targetId = t.dataset.target;
        return openExpedition();
      }
      const p = e.target.closest("[data-pick]");
      if (p) {
        const id = p.dataset.pick;
        const i = warPick.heroIds.indexOf(id);
        if (i >= 0) warPick.heroIds.splice(i, 1);
        else if (warPick.heroIds.length >= 3) hud.toast("至多点将 3 人", "warn");
        else warPick.heroIds.push(id);
        return openExpedition();
      }
      const a = e.target.closest("[data-act]");
      if (!a) return;
      if (a.dataset.act === "close") return close();
      if (a.dataset.act === "march") {
        const r = game.battle(warPick.targetId, warPick.heroIds, marchTroops());
        if (!r.ok) return hud.toast(r.reason, "warn");
        // 战报只有摘要，克制乘区藏在 combat 的原始 result 里，一并带上。
        openReport(r.report ? { result: r.result, ...r.report } : r);
      }
    });

    /** 有分兵结构时交出编成对象（Number() 仍等于合计），否则沿用旧的标量兵力。 */
    function marchTroops() {
      return army ? makeTroopMix(warPick.mix) : warPick.troops;
    }

    function updateOdds() {
      let pv;
      try {
        pv = game.previewBattle(warPick.targetId, warPick.heroIds, marchTroops());
      } catch (err) {
        console.warn("[sanguo] 胜算预览失败", err);
        pv = { ok: false, reason: "胜算暂不可算" };
      }
      if (!pv || typeof pv !== "object") pv = { ok: false, reason: "胜算暂不可算" };
      const bar = c.panel.querySelector("[data-oddsbar]");
      const val = c.panel.querySelector("[data-oddsval]");
      const btn = c.panel.querySelector('[data-act="march"]');
      if (!pv.ok) {
        bar.style.width = "0%";
        val.textContent = "—";
        val.style.color = "var(--text-faint)";
        if (btn) btn.disabled = true;
        const note = c.panel.querySelector("[data-note]");
        if (note) note.textContent = pv.reason;
        return;
      }
      const pct = Math.round(pv.odds * 100);
      bar.style.width = `${pct}%`;
      val.textContent = `${pct}%`;
      val.style.color = pct >= 65 ? "var(--good)" : pct >= 40 ? "var(--warn)" : "var(--bad)";
      if (btn) btn.disabled = false;
      const note = c.panel.querySelector("[data-note]");
      if (note) {
        note.textContent = `我军 ${fmt(pv.atk)} vs 敌军 ${fmt(pv.def)}${pv.bonusText ? ` · ${pv.bonusText}` : ""}`;
      }
    }
    updateOdds();
    c.tick = () => {};
  }

  /* ============================================================
     战报
     ============================================================ */
  /** 战报里的乘区：优先读 result 自带的，读不到再从常见字段里拼。 */
  function readCounters(rep) {
    const out = [];
    const push = (label, mul, note) => {
      const v = Number(mul);
      if (!label || !Number.isFinite(v) || v <= 0) return;
      out.push({ label: String(label), mul: v, note: note || "" });
    };
    // report 与 combat 的原始 result 都可能带乘区，两处都扫。
    const scopes = [rep, rep?.result].filter((s) => s && typeof s === "object");
    for (const scope of scopes) {
      const src = scope.counters ?? scope.multipliers ?? scope.mul ?? null;
      if (Array.isArray(src)) {
        for (const item of src) {
          push(item?.label ?? COUNTER_LABELS[item?.key] ?? item?.key, item?.mul ?? item?.value ?? item?.multiplier, item?.note);
        }
      } else if (src && typeof src === "object") {
        for (const [k, v] of Object.entries(src)) push(COUNTER_LABELS[k] || k, v);
      }
    }
    if (!out.length) {
      for (const scope of scopes) {
        push("兵种克制", scope.troopAdvantage ?? scope.troopMul);
        push("阵营克制", scope.factionAdvantage ?? scope.factionMul);
        const fb = scope.attacker?.factionBonus ?? scope.factionBonus;
        if (fb && typeof fb === "object") {
          push(COUNTER_LABELS.atkMul, fb.atkMul);
          push(COUNTER_LABELS.defMul, fb.defMul);
          push(COUNTER_LABELS.hpMul, fb.hpMul);
        }
      }
    }
    const seen = new Set();
    return out.filter((c) => {
      if (Math.abs(c.mul - 1) <= 0.0005) return false;
      const key = `${c.label}|${c.mul}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function counterSection(rep) {
    const list = readCounters(rep);
    if (!list.length) return "";
    return `<div class="section-title">克制乘区</div>
      <div class="counters">
        ${list.map((c) => `<span class="counter ${c.mul > 1 ? "is-up" : "is-down"}" title="${escText(c.note)}">
          ${escText(c.label)} <b>×${c.mul.toFixed(2)}</b></span>`).join("")}
      </div>`;
  }

  /** 回合流水：字符串（内置内核）与结构化日志（systems/combat.js）都能显示。 */
  function roundLines(rep) {
    const raw = Array.isArray(rep?.rounds) ? rep.rounds : Array.isArray(rep?.log) ? rep.log : [];
    return raw
      .map((r) => {
        if (typeof r === "string") return r;
        if (!r || typeof r !== "object") return "";
        const parts = [];
        if (r.attackerDamage) parts.push(`我军斩敌 <span class="dmg">${fmt(r.attackerDamage)}</span>`);
        if (r.defenderDamage) parts.push(`我军折损 <span class="dis">${fmt(r.defenderDamage)}</span>`);
        if (Array.isArray(r.events) && r.events.length) {
          parts.push(`<span class="adv">${r.events.map((e) => escText(e?.skill || e?.type || "")).filter(Boolean).join(" · ")}</span>`);
        }
        if (r.note) parts.push(escText(r.note));
        return parts.join("，") || "两军对峙";
      })
      .filter(Boolean);
  }

  function openReport(rep) {
    const wounded = Number(rep?.woundedTotal ?? rep?.wounded?.total ?? 0) ||
      (rep?.wounded && typeof rep.wounded === "object"
        ? TROOP_ORDER.reduce((s, t) => s + (Number(rep.wounded[t]) || 0), 0)
        : 0);
    const losses = Number(rep?.lossesTotal ?? 0) ||
      (rep?.losses && typeof rep.losses === "object"
        ? TROOP_ORDER.reduce((s, t) => s + (Number(rep.losses[t]) || 0), 0)
        : Number(rep?.losses) || 0);
    const c = shell({
      kind: "report",
      title: rep.win ? "凯旋" : "败绩",
      sub: `讨伐 ${escText(rep.targetName ?? rep.target?.name ?? "流寇")} · 第 ${rep.day ?? "—"} 日`,
      sigil: SIGIL.report,
      body: `
        <div class="report__banner ${rep.win ? "win" : "lose"}">
          <div class="report__verdict">${rep.win ? "大 捷" : "失 利"}</div>
          <div class="report__line">${rep.summary ?? `鏖战 ${rep.rounds?.length ?? rep.rounds ?? 0} 合`}</div>
        </div>

        ${counterSection(rep)}

        <div class="section-title">战况</div>
        <div class="rounds">
          ${roundLines(rep).map((r, i) => `<div class="round" style="animation-delay:${i * 60}ms">
            <span class="round__n">第${i + 1}合</span>
            <span class="round__txt">${r}</span>
          </div>`).join("")}
        </div>

        <div class="section-title">${rep.win ? "缴获" : "损失"}</div>
        <div class="spoils">
          ${Object.entries(rep.loot || rep.rewards?.resources || {}).map(([k, v]) => `<span class="spoil">${(RES_META[k] || { icon: "🎖" }).icon} ${fmt(v)}</span>`).join("")}
          ${rep.ticket ? `<span class="spoil">🏮 招募令 ${rep.ticket}</span>` : ""}
          <span class="spoil" style="color:var(--bad);border-color:rgba(255,122,107,.3);background:rgba(255,122,107,.08)">☠ 阵亡 ${fmt(losses)} 兵</span>
          ${wounded ? `<span class="spoil" style="color:var(--warn);border-color:rgba(255,203,92,.32);background:rgba(255,203,92,.08)">🩹 伤兵 ${fmt(wounded)} 兵</span>` : ""}
          ${rep.exp ? `<span class="spoil">⭑ 武将经验 +${rep.exp}</span>` : ""}
        </div>`,
      foot: `
        <span class="foot-note">兵营可补充兵员</span>
        <button class="btn btn--ghost" data-act="again">再战</button>
        <button class="btn btn--primary" data-act="close">回城</button>`,
      narrow: false,
    });
    c.panel.addEventListener("click", (e) => {
      const a = e.target.closest("[data-act]");
      if (!a) return;
      if (a.dataset.act === "close") close();
      if (a.dataset.act === "again") openExpedition();
    });
  }

  /* ============================================================
     太学
     ============================================================ */
  function openAcademy() {
    const st = game.state;
    const list = game.techList();
    const c = shell({
      kind: "academy",
      title: "太学院",
      sub: "典籍治世 · 研习增益（本作为科技占位框架，可持续扩充）",
      sigil: SIGIL.academy,
      wide: true,
      body: `
        <div class="notice notice--ice" style="margin-bottom:14px">
          <span>📖</span>
          <span>太学院消耗 <b>铁料</b> 与 <b>木材</b> 研习典籍，效果永久生效。研习需要太学院达到对应等级；后续版本将扩展为多分支科技树（民政 / 军略 / 匠作）。</span>
        </div>
        <div class="tech-grid">
          ${list.map((t) => `
            <button class="tech is-${t.state}" data-tech="${t.id}" ${t.state === "lock" ? "disabled" : ""}>
              <div class="tech__icon">${t.icon}</div>
              <div class="tech__name">${t.name}</div>
              <div class="tech__desc">${t.desc}</div>
              <div class="tech__foot">
                <span class="tech__cost">${t.state === "done" ? "已研习" : Object.entries(t.cost).map(([k, v]) => `${(RES_META[k] || { icon: "◆" }).icon}${fmt(v)}`).join(" ")}</span>
                <span class="tech__state">${t.state === "done" ? "已成" : t.state === "open" ? "可研" : `需太学 ${t.reqLevel} 级`}</span>
              </div>
              <div class="tech__bar"><i style="width:${t.state === "done" ? 100 : 0}%"></i></div>
            </button>`).join("")}
        </div>`,
      foot: `<span class="foot-note">太学院等级：${game.buildingInfo("academy").level}</span>
        <button class="btn btn--ghost" data-act="close">关闭</button>
        <button class="btn" data-goto="academy">升级太学院</button>`,
    });
    c.panel.addEventListener("click", (e) => {
      if (e.target.closest('[data-act="close"]')) return close();
      const g = e.target.closest("[data-goto]");
      if (g) return openBuilding(g.dataset.goto);
      const t = e.target.closest("[data-tech]");
      if (t) {
        const r = game.research(t.dataset.tech);
        if (!r.ok) return hud.toast(r.reason, "warn");
        hud.toast(`研习告成：${r.name}`, "good");
        openAcademy();
      }
    });
    c.tick = (st2) => refreshCostChips(c.panel, st2.resources);
  }

  /* ============================================================
     功业簿（任务）
     ============================================================ */
  function claim(id, name) {
    const fn = onClaimQuest || (typeof game.claimQuest === "function" ? (qid) => game.claimQuest(qid) : null);
    if (!fn) {
      hud.toast("任务奖励尚未接通", "warn");
      return false;
    }
    let r;
    try {
      r = fn(id);
    } catch (err) {
      console.warn("[sanguo] 领取任务出错", err);
      hud.toast("领取失败", "bad");
      return false;
    }
    if (r && r.ok === false) {
      hud.toast(r.reason || "尚不可领取", "warn");
      return false;
    }
    hud.toast(`功业已录：${name || id}`, "good");
    return true;
  }

  function questCard(q) {
    const meta = QUEST_STATUS_META[q.status];
    const pct = Math.round(q.ratio * 100);
    const ready = q.status === "ready";
    return `<li class="quest ${meta.cls}">
      <div class="quest__top">
        <span class="quest__name">${escText(q.name)}</span>
        <span class="quest__tag">${meta.name}</span>
      </div>
      ${q.desc ? `<p class="quest__desc">${escText(q.desc)}</p>` : ""}
      <div class="quest__bar"><i style="width:${pct}%"></i></div>
      <div class="quest__foot">
        <span class="quest__num">${q.target > 0 ? `${fmt(q.current)} / ${fmt(q.target)}` : `${pct}%`}</span>
        ${q.status === "claimed"
          ? '<span class="quest__tag">✓ 已录</span>'
          : `<button class="btn btn--sm ${ready ? "btn--primary" : ""}" data-claim="${escText(q.id)}"
               data-quest-name="${escText(q.name)}" ${ready ? "" : "disabled"}>领赏</button>`}
      </div>
      ${q.rewards.length
        ? `<div class="quest__rewards">${q.rewards.map((r) => `<span class="quest__reward">${r.icon} ${escText(r.label)} ${escText(r.value)}</span>`).join("")}</div>`
        : ""}
    </li>`;
  }

  function openQuests() {
    const quests = readQuests(game.state);
    const order = { ready: 0, active: 1, locked: 2, claimed: 3 };
    const sorted = quests.slice().sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || b.ratio - a.ratio);
    const readyCount = quests.filter((q) => q.status === "ready").length;
    const doneCount = quests.filter((q) => q.status === "claimed").length;

    const c = shell({
      kind: "quests",
      title: "功业簿",
      sub: "开荒有序 · 完成即领，奖励直入府库",
      sigil: SIGIL.quests,
      wide: true,
      body: quests.length
        ? `<div class="notice notice--ice" style="margin-bottom:14px">
             <span>🎯</span>
             <span>共 <b>${quests.length}</b> 条功业，<b>${doneCount}</b> 条已录，<b>${readyCount}</b> 条待领。
             达成条件后按钮亮起，点「领赏」入账。</span>
           </div>
           <ol class="quest-grid" style="list-style:none;margin:0;padding:0">${sorted.map(questCard).join("")}</ol>`
        : '<div class="empty"><span class="empty__ico">🎐</span>功业簿尚未开卷。<br/>任务系统接通后，此处会列出开荒指引。</div>',
      foot: `<span class="foot-note">奖励含物资 / 招募令 / 武将经验</span>
        <button class="btn btn--ghost" data-act="close">关闭</button>`,
    });

    c.panel.addEventListener("click", (e) => {
      if (e.target.closest('[data-act="close"]')) return close();
      const btn = e.target.closest("[data-claim]");
      if (btn && claim(btn.dataset.claim, btn.dataset.questName)) openQuests();
    });
  }

  /* ============================================================
     出口
     ============================================================ */
  function open(kind, payload) {
    switch (kind) {
      case "furnace": return openFurnace();
      case "recruit": return openRecruit();
      case "expedition": return openExpedition();
      case "academy": return openAcademy();
      case "quests": return openQuests();
      case "building": return openBuilding(payload);
      case "report": return openReport(payload);
      default: return openBuilding(kind);
    }
  }

  function tick(state) {
    current?.tick?.(state);
  }

  return { open, close, isOpen, tick, onClose: (fn) => (onCloseCb = fn) };
}
