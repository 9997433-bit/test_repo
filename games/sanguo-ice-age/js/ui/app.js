/**
 * DOM UI：顶栏、六页签面板、战报/招贤/终局弹窗、toast、日志栏。
 * 导入时不触碰 DOM；createApp(game) 由 main.js 在浏览器中调用。
 * game = { getState, setState, renderer, loop, bus, restart }
 */
import {
  RESOURCES,
  RESOURCE_NAMES,
  RESOURCE_ICONS,
  FUEL,
  TROOPS,
  TROOP_NAMES,
  TROOP_ICONS,
  FACTION_NAMES,
  SPEEDS,
  GACHA,
  ENVOY,
  CLIMATE,
  HERO,
  QUALITY_NAMES,
} from "../config.js";
import { BUILDINGS, BUILDING_ORDER } from "../data/buildings.js";
import { HEROES_BY_ID } from "../data/heroes.js";
import { STAGES } from "../data/enemies.js";
import { QUESTS } from "../data/quests.js";
import { storageCap, popCap, troopCap } from "../sim/state.js";
import { canUpgrade, upgrade, nextCost } from "../sim/buildings.js";
import { blizzardAtDay, tempBand } from "../sim/climate.js";
import { productionFactors } from "../sim/economy.js";
import {
  recruitOnce,
  buyToken,
  levelUpHero,
  levelUpCost,
  setTeamSlot,
  ownedHero,
  heroStats,
  gachaRates,
} from "../sim/heroes.js";
import { train, maxTrainable, trainCost } from "../sim/army.js";
import { runExpedition, teamPower, stagePower, expeditionUnits } from "../sim/battle.js";
import { currentQuest } from "../sim/quests.js";
import { trade } from "../sim/envoy.js";
import { saveGame, exportSave, importSave, clearSave } from "../engine/save.js";
import {
  fnum,
  fsign,
  costText,
  canPay,
  qualityClass,
  qualityName,
  factionName,
  troopName,
  rewardText,
  escapeHtml,
} from "./format.js";

const TABS = [
  { id: "city", name: "内政" },
  { id: "army", name: "军备" },
  { id: "heroes", name: "武将" },
  { id: "war", name: "讨伐" },
  { id: "quests", name: "任务" },
  { id: "sys", name: "系统" },
];

export function createApp(game) {
  const $ = (sel) => document.querySelector(sel);
  const state = () => game.getState();
  let activeTab = "city";
  let dirty = true;
  let lastPanelRender = 0;
  let lastChipRender = 0;

  // ———— 顶栏 ————
  function renderChips() {
    const s = state();
    const cap = storageCap(s);
    const bz = blizzardAtDay(s.day);
    const band = tempBand(s.temperature);
    const tempCls = band === "freeze" ? "bad" : band === "cold" ? "warn" : "good";
    const moraleCls = s.morale < 30 ? "bad" : s.morale < 55 ? "warn" : "good";
    const bzText = bz.active
      ? `<span class="chip blizzard">❄ 寒潮中·剩 ${Math.max(0, bz.current.end - s.day) + 1} 天</span>`
      : `<span class="chip">❄ 寒潮 ${bz.next.start - s.day} 天后</span>`;
    const resChips = RESOURCES.map((r) => {
      const flowDay = s.flow ? s.flow[r] : 0;
      const cls = flowDay >= 0 ? "good" : "bad";
      return `<span class="chip" title="${RESOURCE_NAMES[r]}（每天 ${fsign(flowDay, 1)}）">${RESOURCE_ICONS[r]} ${fnum(s.resources[r])}<em>/${fnum(cap)}</em> <i class="${cls}">${fsign(flowDay, 0)}</i></span>`;
    }).join("");
    $("#chips").innerHTML = `
      <span class="chip">📅 第 ${s.day} 天</span>
      ${bzText}
      <span class="chip ${tempCls}">🌡 ${s.temperature.toFixed(1)}°</span>
      <span class="chip ${moraleCls}">❤ 民心 ${Math.round(s.morale)}</span>
      <span class="chip">👥 ${Math.floor(s.population)}<em>/${popCap(s)}</em></span>
      ${resChips}`;
  }

  function renderSpeeds() {
    const cur = game.loop.getSpeed();
    $("#speeds").innerHTML = SPEEDS.map((sp) => {
      const label = sp === 0 ? "⏸" : `${sp}×`;
      return `<button class="btn speed ${sp === cur ? "on" : ""}" data-act="speed" data-v="${sp}">${label}</button>`;
    }).join("");
  }

  // ———— 页签 ————
  function renderTabs() {
    $("#tabs").innerHTML = TABS.map(
      (t) => `<button class="tab ${t.id === activeTab ? "on" : ""}" data-act="tab" data-v="${t.id}">${t.name}</button>`,
    ).join("");
  }

  function renderPanel() {
    renderTabs();
    const body = $("#tab-body");
    const s = state();
    // 系统页重绘会重建导入/导出文本框，保留玩家已输入/导出的内容
    const keptIO = body.querySelector("#save-io")?.value;
    if (activeTab === "city") body.innerHTML = tabCity(s);
    else if (activeTab === "army") body.innerHTML = tabArmy(s);
    else if (activeTab === "heroes") body.innerHTML = tabHeroes(s);
    else if (activeTab === "war") body.innerHTML = tabWar(s);
    else if (activeTab === "quests") body.innerHTML = tabQuests(s);
    else body.innerHTML = tabSys(s);
    if (keptIO) {
      const ta = body.querySelector("#save-io");
      if (ta && !ta.value) ta.value = keptIO;
    }
  }

  // ———— 内政 ————
  function tabCity(s) {
    const f = productionFactors(s);
    const jobs = s.jobs || { filled: 0, total: 0 };
    const fuelModes = Object.entries(FUEL.modes)
      .map(([k, m]) => `<button class="btn seg ${s.fuel.mode === k ? "on" : ""}" data-act="fuel-mode" data-v="${k}">${m.name}</button>`)
      .join("");
    const fuelSources = FUEL.sources
      .map((k) => `<button class="btn seg ${s.fuel.source === k ? "on" : ""}" data-act="fuel-source" data-v="${k}">${FUEL.sourceNames[k]}</button>`)
      .join("");
    const fuelState = s.fuel.starved
      ? '<span class="bad">⚠ 燃料断供，火炉已熄！</span>'
      : `<span class="good">供热 +${(s.buildings.furnace * CLIMATE.furnaceHeatPerLevel * (FUEL.modes[s.fuel.mode]?.heat ?? 1)).toFixed(1)}°</span>`;
    const cards = BUILDING_ORDER.map((id) => buildingCard(s, id)).join("");
    const envoyTrades =
      s.buildings.envoy >= 1
        ? `<div class="card"><div class="card-head"><b>🕊 互市</b><span class="muted">与过境商队交易</span></div>
           <div class="row">${ENVOY.trades.map((t) => `<button class="btn small" data-act="trade" data-v="${t.id}">${t.name}<br/><em>${costText(t.give)} → ${costText(t.get)}</em></button>`).join("")}</div></div>`
        : "";
    return `
      <div class="card furnace-card">
        <div class="card-head"><b>🔥 火炉 Lv.${s.buildings.furnace}</b>${fuelState}</div>
        <div class="muted">火候：${fuelModes}</div>
        <div class="muted">燃料：${fuelSources}</div>
        <div class="muted small">耗料随火候与炉级增长；旺火 +35% 供热、1.9× 耗料。</div>
      </div>
      <div class="card">
        <div class="card-head"><b>🏭 生产效率 ×${f.total.toFixed(2)}</b><span class="muted">温度×${f.temp.toFixed(2)} 民心×${f.morale.toFixed(2)} 太学×${f.academy.toFixed(2)}</span></div>
        <div class="muted small">用工 ${jobs.filled}/${jobs.total}（按 猎屋→伐木→煤矿→铁矿 优先补岗）</div>
      </div>
      ${envoyTrades}
      <div class="section-title">营造（火炉等级限制其他建筑上限）</div>
      <div class="build-list">${cards}</div>`;
  }

  function buildingCard(s, id) {
    const def = BUILDINGS[id];
    const lv = s.buildings[id];
    const cost = nextCost(s, id);
    const chk = canUpgrade(s, id);
    const locked = id !== "furnace" && s.buildings.furnace < def.unlockFurnace;
    const btn = chk.ok
      ? `<button class="btn primary small" data-act="upgrade" data-v="${id}">升级 ${costText(cost)}</button>`
      : `<button class="btn small" disabled title="${escapeHtml(chk.reason)}">${lv >= def.maxLevel ? "已满级" : escapeHtml(chk.reason)}</button>`;
    return `
      <div class="card build ${locked ? "locked" : ""} ${game.renderer.getSelected() === id ? "selected" : ""}" data-act="select-building" data-v="${id}">
        <div class="card-head">
          <b>${def.icon} ${def.name} <span class="lv">Lv.${lv}</span></b>
          ${btn}
        </div>
        <div class="muted small">${def.desc}</div>
        <div class="small effect">${lv > 0 ? def.effectText(lv) : locked ? `需火炉 ${def.unlockFurnace} 级` : "尚未建造"}</div>
      </div>`;
  }

  // ———— 军备 ————
  function tabArmy(s) {
    const rows = TROOPS.map((t) => {
      const cap = troopCap(s, t);
      const max = maxTrainable(s, t);
      const beat = { infantry: "克骑兵", archer: "克步兵", cavalry: "克弓兵" }[t];
      const disabled = cap === 0 ? "disabled" : "";
      return `
        <div class="card">
          <div class="card-head"><b>${TROOP_ICONS[t]} ${TROOP_NAMES[t]} <span class="lv">${s.army[t]}/${cap}</span></b>
          <span class="muted small">${beat}｜每兵 ${costText(trainCost(t, 1))}</span></div>
          <div class="row">
            <button class="btn small" data-act="train" data-v="${t}:1" ${disabled}>+1</button>
            <button class="btn small" data-act="train" data-v="${t}:10" ${disabled}>+10</button>
            <button class="btn small primary" data-act="train" data-v="${t}:max" ${disabled}>+最多(${max})</button>
          </div>
        </div>`;
    }).join("");
    const total = TROOPS.reduce((sum, t) => sum + s.army[t], 0);
    return `
      <div class="card"><div class="card-head"><b>⚔ 军队总数 ${total}</b>
        <span class="muted small">军粮 ${(total * 0.06).toFixed(1)}/天</span></div>
        <div class="muted small">兵种三角：步克骑、骑克弓、弓克步。出征时由武将按统率领兵。</div>
      </div>
      ${rows}`;
  }

  // ———— 武将 ————
  function tabHeroes(s) {
    const hallLv = s.buildings.recruitHall;
    const rates = gachaRates(Math.max(1, hallLv));
    const teamSlots = s.team
      .map((id, i) => {
        if (!id) return `<div class="team-slot empty">空位 ${i + 1}</div>`;
        const proto = HEROES_BY_ID[id];
        const inst = ownedHero(s, id);
        return `<div class="team-slot ${qualityClass(proto.quality)}" data-act="team-remove" data-v="${i}" title="点击下阵">
          ${proto.name}<em>Lv.${inst ? inst.level : 1}·${TROOP_NAMES[proto.troop]}</em></div>`;
      })
      .join("");
    const sorted = [...s.heroes].sort((a, b) => {
      const qa = HEROES_BY_ID[a.id];
      const qb = HEROES_BY_ID[b.id];
      const rank = { red: 4, orange: 3, purple: 2, blue: 1 };
      return rank[qb.quality] - rank[qa.quality] || b.level - a.level;
    });
    const cards = sorted
      .map((inst) => {
        const proto = HEROES_BY_ID[inst.id];
        const st = heroStats(inst);
        const inTeam = s.team.includes(inst.id);
        const maxLv = HERO.maxLevel[proto.quality];
        const cost = levelUpCost(inst);
        const lvBtn =
          inst.level >= maxLv
            ? `<button class="btn small" disabled>满级</button>`
            : `<button class="btn small" data-act="hero-up" data-v="${inst.id}" ${s.souls < cost ? "disabled" : ""}>升级 ✨${cost}</button>`;
        return `
        <div class="card hero ${qualityClass(proto.quality)}">
          <div class="card-head">
            <b><span class="fac fac-${proto.faction}">${FACTION_NAMES[proto.faction]}</span> ${proto.name}
            <span class="lv">Lv.${inst.level}/${maxLv}</span></b>
            <span class="pill ${qualityClass(proto.quality)}">${qualityName(proto.quality)}</span>
          </div>
          <div class="muted small">${TROOP_ICONS[proto.troop]}${troopName(proto.troop)}｜攻 ${st.atk}｜防 ${st.def}｜统率 ${st.lead}｜技【${proto.skill.name}】×${proto.skill.mult}</div>
          <div class="row">
            <button class="btn small ${inTeam ? "" : "primary"}" data-act="team-toggle" data-v="${inst.id}">${inTeam ? "下阵" : "上阵"}</button>
            ${lvBtn}
          </div>
        </div>`;
      })
      .join("");
    const recruitBtns =
      hallLv >= 1
        ? `<button class="btn primary" data-act="recruit" ${s.tokens < 1 ? "disabled" : ""}>招贤 ×1（🏮1）</button>
           <button class="btn" data-act="recruit5" ${s.tokens < 5 ? "disabled" : ""}>招贤 ×5</button>
           <button class="btn" data-act="buy-token" title="肉食${GACHA.tokenTrade.food} + 铁料${GACHA.tokenTrade.iron} 兑 1 令">购令</button>`
        : `<span class="muted">需先建造招贤馆</span>`;
    return `
      <div class="card">
        <div class="card-head"><b>🏮 招贤令 ×${s.tokens}　✨ 将魂 ×${s.souls}</b></div>
        <div class="row">${recruitBtns}</div>
        <div class="muted small">概率：红 ${(rates.red * 100).toFixed(1)}%｜橙 ${(rates.orange * 100).toFixed(1)}%｜紫 ${(rates.purple * 100).toFixed(0)}%｜蓝 ${(rates.blue * 100).toFixed(0)}%（招贤馆升级提升）</div>
      </div>
      <div class="section-title">出阵编队（阵营协同：2 同 +8%，3 同 +20%）</div>
      <div class="team-row">${teamSlots}</div>
      <div class="section-title">将册（${s.heroes.length}/${Object.keys(HEROES_BY_ID).length}）</div>
      ${cards || '<div class="muted">尚无武将，快去招贤吧。</div>'}`;
  }

  // ———— 讨伐 ————
  function tabWar(s) {
    const units = expeditionUnits(s);
    const power = teamPower(s);
    const unitRows = units.length
      ? units
          .map(
            (u) =>
              `<span class="pill">${u.name}·${TROOP_NAMES[u.troop]}×${u.troops}</span>`,
          )
          .join(" ")
      : '<span class="muted">未编队（前往「武将」页上阵）</span>';
    const stages = STAGES.map((stage, i) => {
      const idx = i + 1;
      const cleared = s.stage >= idx;
      const available = idx <= s.stage + 1;
      const sp = stagePower(stage);
      const facs = [...new Set(stage.units.map((u) => FACTION_NAMES[u.faction]))].join("/");
      const troopsDesc = stage.units.map((u) => `${u.name}×${u.troops}`).join("、");
      const btn = available
        ? `<button class="btn primary small" data-act="battle" data-v="${idx}" ${s.marches < 1 ? "disabled" : ""}>${cleared ? "再讨" : "讨伐"}</button>`
        : `<button class="btn small" disabled>未解锁</button>`;
      return `
        <div class="card stage ${cleared ? "cleared" : ""} ${available ? "" : "locked"}">
          <div class="card-head"><b>${cleared ? "✅" : available ? "⚔" : "🔒"} 第${idx}关·${stage.name} <span class="muted small">[${facs}]</span></b>${btn}</div>
          <div class="muted small">${stage.desc}</div>
          <div class="small">敌军：${troopsDesc}｜战力 ~${fnum(sp)}｜掠获 ${rewardText(stage.rewards)}${s.stage < idx && stage.firstClear ? `｜首通 ${rewardText(stage.firstClear)}` : ""}</div>
        </div>`;
    }).join("");
    return `
      <div class="card">
        <div class="card-head"><b>🚩 行军令 ×${s.marches}/5</b><span class="muted small">每天恢复 1</span></div>
        <div class="small">我军战力 ~<b>${fnum(power)}</b></div>
        <div class="row wrap">${unitRows}</div>
        <div class="muted small">阵营克制：吴→蜀→魏→吴（+20%）；兵种克制 +35%。</div>
      </div>
      ${stages}`;
  }

  // ———— 任务 ————
  function tabQuests(s) {
    const items = QUESTS.map((q, i) => {
      const done = i < s.questIndex;
      const active = i === s.questIndex;
      return `
        <div class="card quest ${done ? "done" : ""} ${active ? "active" : ""}">
          <div class="card-head"><b>${done ? "✅" : active ? "🔸" : "🔒"} ${q.name}</b>
          <span class="small muted">${rewardText(q.reward)}</span></div>
          <div class="muted small">${q.desc}</div>
        </div>`;
    }).join("");
    const doneAll = s.questIndex >= QUESTS.length;
    return `
      <div class="card"><div class="card-head"><b>📜 主线：${doneAll ? "全部完成！冰原霸业已成 🎉" : `${s.questIndex}/${QUESTS.length}`}</b></div>
      <div class="muted small">条件达成自动完成并发放奖励。</div></div>
      ${items}`;
  }

  // ———— 系统 ————
  function tabSys(s) {
    return `
      <div class="card">
        <div class="card-head"><b>💾 存档</b><span class="muted small">每 20 秒自动保存</span></div>
        <div class="row">
          <button class="btn primary" data-act="save">立即保存</button>
          <button class="btn" data-act="export">导出存档</button>
          <button class="btn" data-act="import">导入存档</button>
          <button class="btn danger" data-act="reset">重开一局</button>
        </div>
        <textarea id="save-io" class="save-io" placeholder="导出的存档 JSON 会出现在这里；导入时请把 JSON 粘贴到此处再点「导入存档」"></textarea>
      </div>
      <div class="card">
        <div class="card-head"><b>⌨ 操作</b></div>
        <div class="muted small">空格：暂停/继续｜1/2/3：一倍/两倍/四倍速<br/>点击城镇中的建筑可在「内政」页定位。</div>
      </div>
      <div class="card">
        <div class="card-head"><b>📖 玩法要诀</b></div>
        <div class="muted small">
        ① 火炉等级 = 其他建筑等级上限，升火炉前先囤木/煤/铁。<br/>
        ② 每 7 天一次寒潮且逐次加深：提前囤燃料、升火候到「旺火」。<br/>
        ③ 民心 < 15 会引发出逃；断粮、冰冻都会掉民心。<br/>
        ④ 讨伐前编满 3 名武将并练满兵——同阵营协同与兵种克制是翻盘关键。</div>
      </div>
      <div class="card">
        <div class="card-head"><b>📊 本局统计</b></div>
        <div class="muted small">熬过寒潮 ${s.stats.blizzardsSurvived} 次｜讨伐 ${s.stats.battlesWon} 胜 ${s.stats.battlesLost} 败｜累计练兵 ${s.stats.trained}｜人口峰值 ${Math.floor(s.stats.popPeak)}｜流失 ${s.stats.popLost}</div>
      </div>`;
  }

  // ———— 弹窗 & toast ————
  function openModal(html, cls = "") {
    const root = $("#modal-root");
    root.className = `show ${cls}`;
    root.innerHTML = `<div class="modal">${html}</div>`;
  }

  function closeModal() {
    const root = $("#modal-root");
    root.className = "hidden";
    root.innerHTML = "";
  }

  function toast(text, kind = "info") {
    const el = document.createElement("div");
    el.className = `toast ${kind}`;
    el.textContent = text;
    $("#toasts").appendChild(el);
    setTimeout(() => el.classList.add("out"), 3400);
    setTimeout(() => el.remove(), 4000);
  }

  function openBattleModal(r) {
    const lines = r.log
      .slice(0, 40)
      .map(
        (l, i) =>
          `<div class="bl ${l.side}" style="animation-delay:${Math.min(i * 90, 2600)}ms">${l.round > 0 ? `<em>[回合${l.round}]</em> ` : ""}${escapeHtml(l.text)}</div>`,
      )
      .join("");
    const lossText = Object.entries(r.losses || {})
      .map(([t, n]) => `${TROOP_NAMES[t]} -${n}`)
      .join("，") || "无";
    const rescueText = Object.entries(r.rescued || {})
      .filter(([, n]) => n > 0)
      .map(([t, n]) => `${TROOP_NAMES[t]} +${n}`)
      .join("，");
    openModal(`
      <h2 class="${r.win ? "good" : "bad"}">${r.win ? "🎉 讨伐告捷" : "💀 讨伐失利"} — ${escapeHtml(r.stageName)}</h2>
      <div class="battle-log">${lines}</div>
      <div class="battle-sum">
        <div>战损：${lossText}${rescueText ? `（军医抢救 ${rescueText}）` : ""}</div>
        ${r.win && r.rewards ? `<div class="good">掠获：${rewardText(r.rewards)}</div>` : ""}
      </div>
      <div class="row center"><button class="btn primary" data-act="close-modal">收兵</button></div>`);
  }

  function openRecruitModal(results) {
    const cards = results
      .map((r, i) => {
        const proto = r.hero;
        return `<div class="gacha-card ${qualityClass(proto.quality)}" style="animation-delay:${i * 160}ms">
          <div class="g-quality">${qualityName(proto.quality)}</div>
          <div class="g-name">${proto.name}</div>
          <div class="g-meta">${FACTION_NAMES[proto.faction]}·${TROOP_NAMES[proto.troop]}</div>
          <div class="g-tag">${r.isNew ? '<span class="good">新将来投！</span>' : `<span class="muted">重逢 → ✨将魂×${r.souls}</span>`}</div>
        </div>`;
      })
      .join("");
    openModal(`
      <h2>🏮 招贤纳士</h2>
      <div class="gacha-row">${cards}</div>
      <div class="row center"><button class="btn primary" data-act="close-modal">好</button></div>`);
  }

  function openGameOverModal() {
    const s = state();
    openModal(
      `
      <h2 class="bad">❄ 城破人散</h2>
      <p class="muted">第 ${s.day} 天，最后一缕炊烟熄灭在暴雪中。<br/>
      你熬过了 ${s.stats.blizzardsSurvived} 次寒潮，讨伐 ${s.stats.battlesWon} 胜，人口峰值 ${Math.floor(s.stats.popPeak)}。</p>
      <div class="row center"><button class="btn primary" data-act="reset-now">重整旗鼓，再来一局</button></div>`,
      "sticky",
    );
  }

  // ———— 日志栏 & 寒潮横幅 ————
  function renderLog() {
    const s = state();
    const items = s.log.slice(-4).reverse();
    $("#logbar").innerHTML = items
      .map((l) => `<span class="logline ${l.kind}"><em>第${l.day}天</em> ${escapeHtml(l.text)}</span>`)
      .join("");
  }

  function updateBanner() {
    const s = state();
    const banner = $("#banner");
    if (s.blizzard.active) {
      banner.className = "show";
      banner.textContent = `❄ 第 ${s.blizzard.index} 次寒潮肆虐中 — 保持火炉旺盛！`;
    } else {
      const bz = blizzardAtDay(s.day);
      if (bz.next.start - s.day <= 1) {
        banner.className = "show warn";
        banner.textContent = `⚠ 寒潮将至（明日抵达，气温将骤降 ${Math.abs(bz.next.delta)}°），请囤好燃料`;
      } else {
        banner.className = "hidden";
      }
    }
  }

  // ———— 事件绑定 ————
  function markDirty() {
    dirty = true;
  }

  function bind() {
    document.body.addEventListener("click", (ev) => {
      const el = ev.target.closest("[data-act]");
      if (!el || el.disabled) return;
      const act = el.dataset.act;
      const v = el.dataset.v;
      const s = state();
      if (act === "tab") {
        activeTab = v;
        markDirty();
      } else if (act === "speed") {
        game.loop.setSpeed(Number(v));
        renderSpeeds();
      } else if (act === "upgrade") {
        const r = upgrade(s, v);
        if (!r.ok) toast(r.reason, "bad");
        else toast(`${BUILDINGS[v].name} 升至 ${r.level} 级`, "good");
        markDirty();
      } else if (act === "select-building") {
        game.renderer.setSelected(v);
        markDirty();
      } else if (act === "fuel-mode") {
        s.fuel.mode = v;
        markDirty();
      } else if (act === "fuel-source") {
        s.fuel.source = v;
        markDirty();
      } else if (act === "trade") {
        const r = trade(s, v);
        if (!r.ok) toast(r.reason, "bad");
        markDirty();
      } else if (act === "train") {
        const [type, n] = v.split(":");
        const count = n === "max" ? maxTrainable(s, type) : Number(n);
        if (count <= 0) {
          toast("资源或编制不足", "bad");
          return;
        }
        const r = train(s, type, count);
        if (!r.ok) toast(r.reason, "bad");
        markDirty();
      } else if (act === "recruit" || act === "recruit5") {
        const times = act === "recruit5" ? 5 : 1;
        const results = [];
        for (let i = 0; i < times; i++) {
          const r = recruitOnce(s);
          if (r.error) {
            toast(r.error, "bad");
            break;
          }
          results.push(r);
        }
        if (results.length) openRecruitModal(results);
        markDirty();
      } else if (act === "buy-token") {
        const r = buyToken(s);
        if (!r.ok) toast(r.reason, "bad");
        else toast("获得招贤令 ×1", "good");
        markDirty();
      } else if (act === "hero-up") {
        const r = levelUpHero(s, v);
        if (!r.ok) toast(r.reason, "bad");
        markDirty();
      } else if (act === "team-toggle") {
        if (s.team.includes(v)) {
          setTeamSlot(s, s.team.indexOf(v), null);
        } else {
          const slot = s.team.indexOf(null);
          if (slot === -1) {
            toast("编队已满，请先下阵一人", "bad");
            return;
          }
          setTeamSlot(s, slot, v);
        }
        markDirty();
      } else if (act === "team-remove") {
        setTeamSlot(s, Number(v), null);
        markDirty();
      } else if (act === "battle") {
        const r = runExpedition(s, Number(v));
        if (r.error) toast(r.error, "bad");
        else openBattleModal(r);
        markDirty();
      } else if (act === "save") {
        const ok = saveGame(s);
        toast(ok ? "已保存" : "保存失败", ok ? "good" : "bad");
      } else if (act === "export") {
        const ta = $("#save-io");
        if (ta) {
          ta.value = exportSave(s);
          ta.select();
          toast("存档 JSON 已导出到文本框", "good");
        }
      } else if (act === "import") {
        const ta = $("#save-io");
        try {
          const loaded = importSave(ta.value.trim());
          game.setState(loaded);
          toast("导入成功", "good");
        } catch (err) {
          toast(`导入失败：${err.message}`, "bad");
        }
        markDirty();
      } else if (act === "reset") {
        openModal(`
          <h2>重开一局？</h2><p class="muted">当前进度将被清空。</p>
          <div class="row center">
            <button class="btn danger" data-act="reset-now">确认重开</button>
            <button class="btn" data-act="close-modal">再想想</button>
          </div>`);
      } else if (act === "reset-now") {
        clearSave();
        game.restart();
        closeModal();
        markDirty();
      } else if (act === "close-modal") {
        closeModal();
      }
    });

    document.addEventListener("keydown", (ev) => {
      if (ev.target.tagName === "TEXTAREA" || ev.target.tagName === "INPUT") return;
      if (ev.code === "Space") {
        ev.preventDefault();
        game.loop.setSpeed(game.loop.getSpeed() === 0 ? 1 : 0);
        renderSpeeds();
      } else if (ev.key === "1") game.loop.setSpeed(1);
      else if (ev.key === "2") game.loop.setSpeed(2);
      else if (ev.key === "3") game.loop.setSpeed(4);
      if (["1", "2", "3"].includes(ev.key)) renderSpeeds();
    });

    const canvas = $("#game-canvas");
    canvas.addEventListener("click", (ev) => {
      const id = game.renderer.buildingAt(ev.clientX, ev.clientY);
      if (id) {
        game.renderer.setSelected(id);
        activeTab = "city";
        markDirty();
        renderPanel();
        const card = document.querySelector(`.build[data-v="${id}"]`);
        if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });

    // 模拟事件 → 提示
    game.bus.on("sim-events", (events) => {
      for (const e of events) {
        if (e.type === "blizzard-start") toast(`第 ${e.index} 次寒潮来袭！`, "bad");
        else if (e.type === "blizzard-end") toast("寒潮退去，全城幸存。", "good");
        else if (e.type === "fuel-out") toast("燃料告罄，火炉熄灭！", "bad");
        else if (e.type === "fuel-restored") toast("火炉重新燃起。", "good");
        else if (e.type === "starving") toast("存粮见底，饥荒蔓延！", "bad");
        else if (e.type === "quest-done") toast(`任务完成：${e.quest.name}`, "quest");
        else if (e.type === "game-over") openGameOverModal();
      }
      if (events.length) markDirty();
    });
  }

  // ———— 帧驱动 ————
  function uiFrame(now) {
    if (now - lastChipRender > 200) {
      lastChipRender = now;
      renderChips();
      renderLog();
      updateBanner();
    }
    if (dirty && now - lastPanelRender > 120) {
      lastPanelRender = now;
      dirty = false;
      renderPanel();
    }
  }

  bind();
  renderSpeeds();
  renderPanel();
  renderChips();
  renderLog();

  return { uiFrame, markDirty, toast, openGameOverModal };
}
