import { BUILDING_TYPES, GRID_SIZE, upgradeCost, buildCost, mansionCap } from "../data/buildings.js";
import { FACTIONS, HEROES, heroById } from "../data/heroes.js";
import { ARTIFACTS, artifactById } from "../data/artifacts.js";
import { REALMS } from "../data/realms.js";
import { occupancy } from "../mansion/layout.js";
import { produce } from "../mansion/production.js";
import { breakthroughChance } from "../progression/realm.js";
import { fmt } from "./hud.js";

export const TABS = [
  ["mansion", "仙府"],
  ["disciples", "弟子"],
  ["cultivate", "修炼"],
  ["party", "阵容"],
  ["tower", "登天塔"],
  ["wave", "兽潮"],
  ["artifacts", "法器"],
];

export function gateView() {
  const cards = Object.values(FACTIONS)
    .map(
      (f) => `<button class="faction" data-act="pick-faction" data-faction="${f.id}">
        <div class="muted">${f.id === "mortal" ? "零氪稳" : f.id === "divine" ? "成型强" : "高爆发"}</div>
        <h3>${f.name}</h3>
        <p>${f.motto}</p>
      </button>`,
    )
    .join("");
  return `<div class="gate"><div class="gate-card card">
    <div class="muted">沛炫味修仙经营 · 网页复刻</div>
    <h1>造化仙府</h1>
    <p>我辈修士，渡劫修仙。选一阵营开府：建洞府、开灵田、招仙友，御兽潮、登天塔。</p>
    <label>道号 <input id="dao-name" maxlength="8" placeholder="无名仙尊" /></label>
    <div class="factions">${cards}</div>
  </div></div>`;
}

export function mansionView(state, ui) {
  const grid = occupancy(state.buildings);
  const cells = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const b = grid[y][x];
      const sel = ui.selPlot && ui.selPlot.x === x && ui.selPlot.y === y;
      if (b) {
        const def = BUILDING_TYPES[b.type];
        cells.push(`<div class="plot filled ${sel ? "sel" : ""}" data-act="plot" data-x="${x}" data-y="${y}" data-id="${b.id}">
          <span class="glyph">${def.glyph}</span><span>${def.name}</span><span class="lv">Lv.${b.level}</span>
        </div>`);
      } else {
        cells.push(`<div class="plot ${sel ? "sel" : ""}" data-act="plot" data-x="${x}" data-y="${y}"></div>`);
      }
    }
  }
  const cap = mansionCap(state.buildings.find((b) => b.type === "mansion")?.level ?? 1);
  const rates = produce(state, 1);
  const selected = state.buildings.find((b) => b.id === ui.selBuilding);
  const empty = ui.selPlot && !selected;
  let detail = `<p class="muted">点选地块营造或升级。洞府上限 Lv.${cap.maxBuildingLevel} · 地块 ${state.buildings.length}/${cap.plots}</p>
    <p>每秒：灵气 ${fmt(rates.qi)} · 灵草 ${fmt(rates.herb)} · 灵木 ${fmt(rates.wood)} · 灵矿 ${fmt(rates.ore)}</p>`;
  if (selected) {
    const def = BUILDING_TYPES[selected.type];
    const cost = upgradeCost(selected.type, selected.level + 1);
    const worker = state.disciples.find((d) => d.buildingId === selected.id);
    detail += `<div class="card"><h3>${def.name} · ${selected.level} 级</h3><p>${def.desc}</p>
      <p>驻守：${worker ? worker.name : "无人"}</p>
      <button class="gold" data-act="upgrade" data-id="${selected.id}">升级（木${cost.wood} 矿${cost.ore} 石${cost.stone}）</button>
      <div class="build-list">${state.disciples
        .map(
          (d) =>
            `<button data-act="assign" data-did="${d.id}" data-bid="${selected.id}">派 ${d.name}</button>`,
        )
        .join("")}</div></div>`;
  } else if (empty) {
    detail += `<div class="card"><h3>营造 (${ui.selPlot.x},${ui.selPlot.y})</h3><div class="build-list">${Object.values(BUILDING_TYPES)
      .map((t) => {
        const c = buildCost(t.id);
        return `<button data-act="build" data-type="${t.id}">${t.name} 木${c.wood}</button>`;
      })
      .join("")}</div></div>`;
  }
  return `<div class="grid-2"><div class="card"><h3>仙府沙盘</h3><div class="plot-grid">${cells.join("")}</div></div><div>${detail}
    <div class="card" style="margin-top:0.8rem"><h3>府报</h3><ul class="log-list">${state.log.map((l) => `<li>${l.text}</li>`).join("")}</ul></div></div></div>`;
}

export function disciplesView(state) {
  const locked = HEROES.filter((h) => h.faction === state.meta.faction && !state.unlockedHeroes.includes(h.id));
  const cards = state.disciples
    .map((d) => {
      const h = heroById(d.heroId);
      const b = state.buildings.find((x) => x.id === d.buildingId);
      return `<div class="hero-card"><div><b>${d.name}</b> · ${h?.role ?? ""}
        <div class="muted">勤勉 ${d.diligent} · 武力 ${d.force} · 专业 ${d.profession}</div>
        <div class="muted">派遣：${b ? BUILDING_TYPES[b.type].name : "闲云"}</div></div>
        <button data-act="train" data-did="${d.id}">传功</button></div>`;
    })
    .join("");
  const shop = locked
    .map(
      (h) =>
        `<div class="hero-card"><div><b>${h.name}</b> · ${h.skill}<div class="muted">${h.skillDesc}</div></div>
        <button class="primary" data-act="recruit" data-hid="${h.id}">礼聘 6仙玉</button></div>`,
    )
    .join("");
  return `<div class="grid-2"><div class="card"><h3>在府弟子</h3>${cards || "<p class='muted'>尚无弟子</p>"}</div>
    <div class="card"><h3>可邀仙友</h3>${shop || "<p class='muted'>本阵营仙友已齐。</p>"}</div></div>`;
}

export function cultivateView(state) {
  const r = REALMS[state.realm.index];
  const pct = Math.min(100, ((state.realm.exp ?? 0) / r.exp) * 100);
  const chance = breakthroughChance(state);
  return `<div class="card"><h3>${r.name} · 第 ${state.realm.layer} 层</h3>
    <div class="hpbar"><i style="width:${pct}%"></i></div>
    <p>修为 ${fmt(state.realm.exp)} / ${r.exp} · 心魔 ${state.realm.heartDemon ?? 0} · 破境率 ${(chance * 100).toFixed(0)}%</p>
    <button class="gold" data-act="cultivate">吐纳（-4 灵气）</button>
    <button class="primary" data-act="breakthrough">破境</button>
    <p class="muted">失败不掉境，丹药折损，心魔使下次更稳。</p></div>`;
}

export function partyView(state) {
  const list = state.unlockedHeroes
    .map((id) => {
      const h = heroById(id);
      const on = state.party.includes(id);
      return `<div class="hero-card ${on ? "in" : ""}"><div><b>${h.name}</b> · ${h.role}
        <div class="muted">${h.skill}：${h.skillDesc}</div></div>
        <button data-act="toggle-party" data-hid="${id}">${on ? "撤下" : "上阵"}</button></div>`;
    })
    .join("");
  return `<div class="card"><h3>阵容 ${state.party.length}/6（主角不可缺）</h3>${list}</div>`;
}

function combatPanel(state) {
  const c = state.combat;
  if (!c) return "";
  const last = c.result.frames.at(-1);
  const a = last.units.filter((u) => u.side === "a");
  const b = last.units.filter((u) => u.side === "b");
  const col = (arr) =>
    arr
      .map(
        (u) => `<div class="fighter ${u.alive ? "" : "dead"}"><b>${u.name}</b>
        <div class="hpbar"><i style="width:${Math.max(0, (u.hp / u.maxHp) * 100)}%"></i></div>
        <span class="muted">${fmt(u.hp)} / ${fmt(u.maxHp)}</span></div>`,
      )
      .join("");
  return `<div class="card battlefield" style="margin-top:0.8rem">
    <div class="side-col"><h4>仙府</h4>${col(a)}</div>
    <div class="vs">${c.result.winner === "a" ? "胜" : "败"}</div>
    <div class="side-col"><h4>敌阵</h4>${col(b)}</div>
    <div style="grid-column:1/-1"><button class="gold" data-act="resolve">领取战报</button></div>
  </div>`;
}

export function towerView(state) {
  return `<div class="card"><h3>登天塔 · 第 ${state.tower.floor} 层</h3>
    <p class="muted">每章 10 层，第 5 / 10 层首领。镇岳钟只斩首领残血。历史最高 ${state.tower.best}</p>
    <button class="primary" data-act="tower">挑战本层</button></div>${combatPanel(state)}`;
}

export function waveView(state) {
  return `<div class="card"><h3>兽潮 · 第 ${state.wave.wave} 波</h3>
    <p class="muted">失败将散失三成灵草/灵木/灵矿。最高 ${state.wave.best}</p>
    <button class="primary" data-act="wave">开府门御敌</button></div>${combatPanel(state)}`;
}

export function artifactsView(state) {
  const cards = ARTIFACTS.map((a) => {
    const own = state.ownedArtifacts.includes(a.id);
    const eq = state.equipped.includes(a.id);
    return `<div class="art-card"><div><b>${a.name}</b> · ${a.slot} · ${a.rarity}
      <div class="muted">${a.desc}</div></div>
      <button ${own ? "" : "disabled"} data-act="equip" data-aid="${a.id}">${eq ? "已佩" : own ? "佩戴" : "未获"}</button></div>`;
  }).join("");
  const names = state.equipped.map((id) => artifactById(id)?.name).join("、");
  return `<div class="card"><h3>法器四槽</h3><p>当前：${names || "无"}</p>${cards}</div>`;
}

export function screen(tab, state, ui) {
  switch (tab) {
    case "disciples":
      return disciplesView(state);
    case "cultivate":
      return cultivateView(state);
    case "party":
      return partyView(state);
    case "tower":
      return towerView(state);
    case "wave":
      return waveView(state);
    case "artifacts":
      return artifactsView(state);
    default:
      return mansionView(state, ui);
  }
}
