import { FACTIONS, HEROES, heroById } from "../data/heroes.js";
import { ARTIFACTS } from "../data/artifacts.js";
import { REALMS } from "../data/realms.js";
import { breakthroughChance } from "../progression/realm.js";
import { postKind, recommendKind, yieldBreakdown } from "../disciples/assign.js";
import { canTrain, discipleFlavor, professionTitle, trainCost, trainShortfall } from "../disciples/roster.js";
import { scriptureRate, xpNeeded } from "../disciples/train.js";
import { fmt } from "./hud.js";
import * as mansion from "./adapters.js";
import { SLOTS, artifactSource, dropProgress, equipPreview, scriptureRule, slotBoard } from "./rules.js";
import {
  RARITY_LABEL,
  RES_LABEL,
  SLOT_LABEL,
  affordable,
  bar,
  chip,
  costText,
  esc,
  etaText,
  pctOf,
  recruitCost,
  roleLabel,
} from "./util.js";

export const TABS = [
  ["mansion", "仙府"],
  ["disciples", "弟子"],
  ["cultivate", "修炼"],
  ["party", "阵容"],
  ["tower", "登天塔"],
  ["wave", "兽潮"],
  ["artifacts", "法器"],
];

const FACTION_TAGLINE = { mortal: "零氪稳", divine: "成型强", demon: "高爆发" };

export function gateView() {
  const cards = Object.values(FACTIONS)
    .map(
      (f) => `<button class="faction" data-act="pick-faction" data-faction="${f.id}">
        <div class="muted">${FACTION_TAGLINE[f.id] ?? "另辟蹊径"}</div>
        <h3>${esc(f.name)}</h3>
        <p>${esc(f.motto)}</p>
      </button>`,
    )
    .join("");
  return `<div class="gate"><div class="gate-card card">
    <div class="muted">沛炫味修仙经营 · 网页复刻</div>
    <h1>造化仙府</h1>
    <p>我辈修士，渡劫修仙。选一阵营开府：建洞府、开灵田、招仙友，御兽潮、登天塔。</p>
    <label>道号 <input id="dao-name" name="dao-name" maxlength="8" placeholder="无名仙尊" autocomplete="off"
      enterkeyhint="done" aria-describedby="dao-hint" /></label>
    <p id="dao-hint" class="gate-hint">留空则称「无名仙尊」。点选下方族牌，即刻开府。</p>
    <div class="factions">${cards}</div>
  </div></div>`;
}

/* ---------------------------------------------------------------- 仙府 */

function plotCell(state, grid, x, y, ui) {
  const b = grid[y]?.[x] ?? null;
  const sel = ui.selPlot && ui.selPlot.x === x && ui.selPlot.y === y;
  if (!b) {
    return `<div class="plot ${sel ? "sel" : ""}" data-act="plot" data-x="${x}" data-y="${y}"
      role="button" tabindex="0" aria-label="空地 ${x},${y}" title="空地 (${x},${y})"></div>`;
  }
  const def = mansion.buildingDef(b.type);
  const worker = state.disciples.find((d) => d.buildingId === b.id);
  const title = `${def?.name ?? b.type} Lv.${b.level} · ${worker ? `驻守 ${worker.name}` : "无人驻守"}`;
  return `<div class="plot filled ${worker ? "staffed" : ""} ${sel ? "sel" : ""}" data-act="plot" data-x="${x}" data-y="${y}"
    data-id="${b.id}" role="button" tabindex="0" aria-label="${esc(title)}" title="${esc(title)}">
    <span class="glyph">${esc(def?.glyph ?? "府")}</span><span>${esc(def?.name ?? b.type)}</span>
    <span class="lv">Lv.${b.level}</span>
  </div>`;
}

function buildingDetail(state, b, ui) {
  const def = mansion.buildingDef(b.type);
  const level = Math.max(1, b.level ?? 1);
  const mlevel = mansion.mansionLevel(state.buildings);
  const maxLevel = mansion.maxLevelFor(b.type, mlevel);
  const atMax = level >= maxLevel;
  const cost = mansion.upgradeCost(b.type, level + 1);
  const lack = mansion.costShortfall(state.resources, cost);
  const canPay = Object.keys(lack).length === 0;
  const worker = state.disciples.find((d) => d.buildingId === b.id) ?? null;
  const row = mansion.breakdownRows(state).find((r) => r.id === b.id) ?? null;

  const perSec = row
    ? Object.entries(row.perSec)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `${RES_LABEL[k] ?? k} <b>${fmt(v)}</b>/秒`)
        .join(" · ")
    : "不产资源，只长弟子修业";
  const factors = row
    ? [
        ["弟子", row.workerMul],
        ["等级", row.levelMul],
        ["邻接", row.adjacency],
        ["府邸", row.aura],
      ]
        .filter(([, v]) => Number.isFinite(v) && Math.abs(v - 1) > 0.001)
        .map(([label, v]) => `${label} ${pctOf(v)}`)
        .join(" · ")
    : "";

  const candidates = [...state.disciples]
    .map((d) => ({ d, mul: yieldBreakdown(d, b).total }))
    .sort((a, z) => z.mul - a.mul)
    .map(({ d, mul }) => {
      const here = d.buildingId === b.id;
      return `<button data-act="assign" data-did="${d.id}" data-bid="${b.id}" ${here ? "disabled" : ""}
        title="${esc(d.name)} 驻守此处产出 ${pctOf(mul)}">${here ? "驻守中 " : "派 "}${esc(d.name)} <span class="gold">${pctOf(mul)}</span></button>`;
    })
    .join("");

  return `<div class="card">
    <h3>${esc(def?.name ?? b.type)} · ${level} 级 <span class="muted">(${b.x},${b.y})</span></h3>
    <p class="muted">${esc(def?.desc ?? "")}</p>
    <p>产出：${perSec}${factors ? ` <span class="muted">（${factors}）</span>` : ""}</p>
    <p>驻守：${worker ? `<b>${esc(worker.name)}</b> <span class="gold">${pctOf(yieldBreakdown(worker, b).total)}</span>` : "<span class='muted'>无人</span>"}
      ${worker ? `<button data-act="assign" data-did="${worker.id}" data-bid="">撤守</button>` : ""}</p>
    ${
      atMax
        ? `<p class="muted">已达当前上限 Lv.${maxLevel}${b.type === "mansion" ? "" : "，先升洞府仙居"}。</p>`
        : `<button class="gold" data-act="upgrade" data-id="${b.id}" ${canPay ? "" : "disabled"}>
            升级 Lv.${level + 1}（${costText(cost, RES_LABEL)}）</button>
          ${canPay ? "" : `<span class="muted"> 尚缺 ${costText(lack, RES_LABEL)}</span>`}`
    }
    <h4 class="sub">派遣驻守</h4>
    <div class="build-list">${candidates || "<span class='muted'>府中无弟子</span>"}</div>
  </div>`;
}

function buildDetail(state, ui) {
  const mlevel = mansion.mansionLevel(state.buildings);
  const list = mansion
    .catalog(mlevel, { resources: state.resources, buildings: state.buildings })
    .map((c) => {
      const note = c.buildable ? costText(c.cost, RES_LABEL) : c.reason;
      return `<button data-act="build" data-type="${c.id}" ${c.buildable ? "" : "disabled"}
        title="${esc(c.desc ?? "")}">${esc(c.glyph)} ${esc(c.name)} <span class="muted">${esc(note)}</span></button>`;
    })
    .join("");
  return `<div class="card"><h3>营造 (${ui.selPlot.x},${ui.selPlot.y})</h3>
    <p class="muted">灵脉环绕灵田、聚灵阵挨着丹房锻造，邻接乘区会立刻反映在产量上。</p>
    <div class="build-list">${list}</div></div>`;
}

export function mansionView(state, ui = {}) {
  const grid = mansion.occupancy(state.buildings);
  const size = mansion.GRID_SIZE;
  const cells = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) cells.push(plotCell(state, grid, x, y, ui));
  }
  const mlevel = mansion.mansionLevel(state.buildings);
  const cap = mansion.mansionCap(mlevel);
  const rates = mansion.rates(state);
  const score = mansion.layoutScore(state.buildings);
  const selected = state.buildings.find((b) => b.id === ui.selBuilding) ?? null;
  const empty = ui.selPlot && !selected;

  const summary = `<div class="card panel-summary">
    <p class="muted">点选地块营造或升级。建筑上限 Lv.${cap.maxBuildingLevel} · 地块 ${state.buildings.length}/${cap.plots}${
      score === null ? "" : ` · 风水 ${score}/100`
    }</p>
    <p class="rate-line">每秒：灵气 <b>${fmt(rates.qi)}</b> · 灵草 <b>${fmt(rates.herb)}</b> · 灵木 <b>${fmt(rates.wood)}</b> · 灵矿 <b>${fmt(rates.ore)}</b> · 灵石 <b>${fmt(rates.stone)}</b></p>
  </div>`;
  const detail = selected ? buildingDetail(state, selected, ui) : empty ? buildDetail(state, ui) : "";

  return `<div class="grid-2">
    <div class="card"><h3>仙府沙盘</h3><div class="plot-grid">${cells.join("")}</div></div>
    <div class="side-stack">${summary}${detail}
      <div class="card"><h3>府报</h3><ul class="log-list" data-keep-scroll="log">${state.log
        .map((l) => `<li>${esc(l.text)}</li>`)
        .join("")}</ul></div>
    </div></div>`;
}

/* ---------------------------------------------------------------- 弟子 */

function postLine(state, d, rowById) {
  const b = state.buildings.find((x) => x.id === d.buildingId) ?? null;
  if (!b) {
    const rec = recommendKind(d);
    return `<div class="d-post idle"><span class="muted">闲云野鹤</span> · 建议 <b>${esc(rec.kind.name)}</b>
      <span class="muted">（${esc(rec.kind.types.map(mansion.buildingName).join("、"))}，看${esc(rec.kind.keyName)}）</span></div>`;
  }
  const def = mansion.buildingDef(b.type);
  const bd = yieldBreakdown(d, b);
  const parts = bd.parts
    .filter((p) => p.add > 0)
    .map((p) => `${p.label} ${pctOf(1 + p.add)}`)
    .join(" + ");
  const row = rowById.get(b.id);
  const out = row
    ? Object.entries(row.perSec)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `${RES_LABEL[k] ?? k} ${fmt(v)}/秒`)
        .join(" · ")
    : "只长修业";
  const gain = row
    ? Object.entries(row.perSec).reduce((s, [, v]) => s + v, 0) * (1 - 1 / (bd.total || 1))
    : 0;
  return `<div class="d-post"><span class="muted">驻守</span> <b>${esc(def?.name ?? b.type)} Lv.${b.level}</b>
    · 加成 <b class="gold">${pctOf(bd.total)}</b> <span class="muted">（${parts || "无"}）</span>
    <div class="muted">本岗 ${out}${gain > 0 ? ` · 其中此弟子贡献 ${fmt(gain)}/秒` : ""}</div></div>`;
}

function xpLine(state, d, rate) {
  const need = xpNeeded(d.profession);
  const xp = Math.min(need, d.xp ?? 0);
  const assigned = Boolean(d.buildingId);
  const eta = assigned && rate > 0 ? etaText((need - xp) / rate) : "";
  const auto = scriptureRule().autoPromote;
  const full = auto ? `约 ${eta}后自动晋阶，不耗丹药` : `约 ${eta}修业积满，晋阶仍需传功`;
  const note = !rate
    ? "府中无藏经楼，修业不长（洞府 Lv.3 解锁）"
    : !assigned
      ? "闲云弟子不积修业，派驻任一建筑即可"
      : `藏经楼 +${rate.toFixed(2)}/秒 · ${full}`;
  return `<div class="d-xp">${bar(xp / need, "thin")}
    <span class="muted">修业 ${fmt(xp)} / ${need} · ${esc(note)}</span></div>`;
}

function assignPanel(state, d) {
  const options = [...state.buildings]
    .map((b) => ({ b, mul: yieldBreakdown(d, b).total, worker: state.disciples.find((x) => x.buildingId === b.id) }))
    .sort((a, z) => Number(Boolean(a.worker)) - Number(Boolean(z.worker)) || z.mul - a.mul)
    .map(({ b, mul, worker }) => {
      const here = worker?.id === d.id;
      const def = mansion.buildingDef(b.type);
      const occupied = worker && !here ? ` <span class="muted">现驻 ${esc(worker.name)}</span>` : "";
      return `<button data-act="assign" data-did="${d.id}" data-bid="${b.id}" ${here ? "disabled" : ""}>
        ${esc(def?.name ?? b.type)} Lv.${b.level} <span class="gold">${pctOf(mul)}</span>${occupied}</button>`;
    })
    .join("");
  return `<div class="card assign-panel">
    <p class="muted">选择 ${esc(d.name)} 的驻地：百分比为该弟子在此建筑的产出加成，顶替他人会让对方变回闲云。</p>
    <div class="build-list">${options || "<span class='muted'>府中尚无建筑</span>"}</div>
    ${d.buildingId ? `<button data-act="assign" data-did="${d.id}" data-bid="">撤回府中</button>` : ""}
  </div>`;
}

function discipleCard(state, d, ui, rate, rowById) {
  const h = heroById(d.heroId);
  const flavor = discipleFlavor(d);
  const cost = trainCost(d.profession);
  const can = canTrain(state.resources, d);
  const lack = trainShortfall(state.resources, d);
  const lackText = [lack.pills ? `丹药${Math.ceil(lack.pills)}` : "", lack.herb ? `灵草${Math.ceil(lack.herb)}` : ""]
    .filter(Boolean)
    .join(" ");
  const inParty = state.party.includes(d.heroId);
  const open = ui.selDisciple === d.id;
  const fac = FACTIONS[h?.faction];
  const profHint = scriptureRule().autoPromote
    ? "所有岗位通吃：传功即刻加一级，驻守藏经楼熬满修业也能免费晋阶"
    : "所有岗位通吃：由传功提升";

  return `<div class="hero-card disciple-card ${open ? "in" : ""}">
    <div class="d-main">
      <div class="d-head"><b>${esc(d.name)}</b>
        ${chip(roleLabel(h?.role))}
        ${chip(`${professionTitle(d.profession)} · 专业 ${d.profession}`, "gold")}
        ${inParty ? chip("已上阵", "cin") : ""}
        ${fac ? chip(fac.name) : ""}
      </div>
      <div class="muted d-flavor">${esc(flavor.root)} · ${esc(flavor.temper)}${h?.skill ? ` · 道法「${esc(h.skill)}」` : ""}</div>
      <div class="d-stats">
        <span title="灵田/木坊/石坊产量看勤勉">勤勉 <b>${d.diligent}</b></span>
        <span title="丹房/锻造房/聚灵阵产量看武力">武力 <b>${d.force}</b></span>
        <span title="${esc(profHint)}">专业 <b>${d.profession}</b></span>
        ${h ? `<span title="上阵时的战斗属性">攻 <b>${h.atk}</b> 生 <b>${h.hp}</b> 防 <b>${h.def}</b></span>` : ""}
      </div>
      ${h?.skillDesc ? `<div class="muted d-skill">${esc(h.skill)}：${esc(h.skillDesc)}</div>` : ""}
      ${postLine(state, d, rowById)}
      ${xpLine(state, d, rate)}
    </div>
    <div class="d-acts">
      <button class="gold" data-act="train" data-did="${d.id}" ${can ? "" : "disabled"}
        title="${esc(`即刻 +1 专业，专业每级提升所有岗位产量。${
          scriptureRule().autoPromote ? "不急则可让他驻守吃藏经楼修业，慢些但不花钱。" : ""
        }`)}">传功 <span class="cost">丹${cost.pills} 草${cost.herb}</span></button>
      ${can ? "" : `<span class="muted lack">缺 ${esc(lackText)}</span>`}
      <button data-act="sel-disciple" data-did="${d.id}" aria-expanded="${open}">${open ? "收起派遣" : "派遣"}</button>
      ${d.buildingId ? `<button data-act="assign" data-did="${d.id}" data-bid="">撤回</button>` : ""}
    </div>
  </div>${open ? assignPanel(state, d) : ""}`;
}

function vacancyLine(state) {
  const vacancies = state.buildings.filter(
    (b) => (mansion.buildingDef(b.type)?.staff ?? 1) > 0 && !state.disciples.some((d) => d.buildingId === b.id),
  );
  if (!vacancies.length) return `<p class="muted">各处皆有人驻守。</p>`;
  const names = vacancies.map((b) => `${mansion.buildingName(b.type)} Lv.${b.level}`).join("、");
  return `<p class="muted">空缺岗位：${esc(names)}</p>`;
}

function recruitCard(state, h) {
  const cost = recruitCost(h);
  const ok = affordable(state.resources, cost);
  return `<div class="hero-card recruit-card">
    <div class="d-main">
      <div class="d-head"><b>${esc(h.name)}</b>${chip(roleLabel(h.role))}${chip(esc(h.skill), "gold")}</div>
      <div class="muted d-skill">${esc(h.skillDesc)}</div>
      <div class="d-stats"><span>攻 <b>${h.atk}</b></span><span>生 <b>${h.hp}</b></span><span>防 <b>${h.def}</b></span></div>
    </div>
    <div class="d-acts">
      <button class="primary" data-act="recruit" data-hid="${h.id}" ${ok ? "" : "disabled"}>礼聘 <span class="cost">${costText(cost, RES_LABEL)}</span></button>
      ${ok ? "" : `<span class="muted lack">仙玉或灵石不足</span>`}
    </div>
  </div>`;
}

export function disciplesView(state, ui = {}) {
  const rate = scriptureRate(state);
  const rowById = new Map(mansion.breakdownRows(state).map((r) => [r.id, r]));
  const posted = state.disciples.filter((d) => state.buildings.some((b) => b.id === d.buildingId));
  const cards = state.disciples.map((d) => discipleCard(state, d, ui, rate, rowById)).join("");
  const locked = HEROES.filter((h) => h.faction === state.meta.faction && !state.unlockedHeroes.includes(h.id));
  const shop = locked.map((h) => recruitCard(state, h)).join("");

  return `<div class="grid-2">
    <div class="card">
      <h3>在府弟子 <span class="muted">${state.disciples.length} 人 · 驻守 ${posted.length} · 闲云 ${
        state.disciples.length - posted.length
      }</span></h3>
      ${vacancyLine(state)}
      ${cards || "<p class='muted'>尚无弟子</p>"}
    </div>
    <div class="side-stack">
      <div class="card"><h3>可邀仙友</h3>${shop || "<p class='muted'>本阵营仙友已齐。</p>"}</div>
      <div class="card"><h3>用人之道</h3>
        <ul class="tip-list">
          <li><b>${esc(postKind("field").name)}</b>（灵田/木坊/石坊）吃 <b>勤勉</b>：每点 +1.8%。</li>
          <li><b>${esc(postKind("alchemy").name)}</b>（丹房/锻造房/聚灵阵）吃 <b>武力</b>：每点 +1%。</li>
          <li><b>${esc(postKind("scripture").name)}</b>（藏经楼）吃 <b>专业</b>：每级 +8%。</li>
          <li><b>传功</b>：花丹药与灵草，点一下立刻 +1 专业，闲云弟子也能受。</li>
          ${
            scriptureRule().autoPromote
              ? `<li><b>藏经楼</b>：府中建起后（洞府 Lv.3），已驻守的弟子${
                  rate > 0 ? `按 ${rate.toFixed(2)}/秒` : "自行"
                }积修业，满则自行晋阶，一文不花——赶进度才用传功。</li>`
              : `<li><b>藏经楼</b>：已驻守的弟子会积修业，但晋阶仍要传功点化。</li>`
          }
          <li>一座建筑只容一名弟子；顶替时原驻守自动变回闲云。</li>
        </ul>
      </div>
    </div></div>`;
}

/* ---------------------------------------------------------------- 其余 */

export function cultivateView(state, ui = {}) {
  const r = REALMS[Math.max(0, Math.min(REALMS.length - 1, state.realm.index))];
  const exp = state.realm.exp ?? 0;
  const ratio = exp / r.exp;
  const chance = breakthroughChance(state);
  const ready = chance > 0;
  const qi = state.resources.qi ?? 0;
  const gain = 6 + state.realm.index;
  const need = Math.max(0, Math.ceil((r.exp - exp) / gain));
  const qiRate = mansion.rates(state).qi ?? 0;
  const affordableNow = Math.min(need, Math.floor(qi / 4));
  const waitSec = need > affordableNow && qiRate > 0 ? ((need - affordableNow) * 4 - (qi % 4)) / qiRate : 0;
  const auto = Boolean(ui.autoCultivate);
  return `<div class="card"><h3>${esc(r.name)} · 第 ${state.realm.layer}/${r.layers} 层</h3>
    ${bar(ratio)}
    <p>修为 ${fmt(exp)} / ${r.exp} · 心魔 ${state.realm.heartDemon ?? 0} · 破境率 ${(chance * 100).toFixed(0)}%</p>
    <p class="muted">每次吐纳 -4 灵气 / +${gain} 修为${
      ready ? "" : ` · 尚需 ${need} 次，当前灵气够 ${affordableNow} 次${waitSec > 0 ? `，攒满约 ${etaText(waitSec)}` : ""}`
    }</p>
    <div class="build-list">
      <button class="gold" data-act="cultivate" ${qi >= 4 ? "" : "disabled"}>吐纳</button>
      <button data-act="cultivate-x" data-n="10" ${qi >= 4 ? "" : "disabled"}>吐纳 ×10</button>
      <button data-act="auto-cultivate" aria-pressed="${auto}">自动吐纳：${auto ? "开" : "关"}</button>
      <button class="primary" data-act="breakthrough" ${ready ? "" : "disabled"}>破境</button>
    </div>
    <p class="muted">${
      ready ? "修为已满，可试破境。" : "修为未满，先行吐纳。"
    }失败不掉境，丹药折损，心魔使下次更稳。自动吐纳只在本次开着的页面生效，灵气见底即停。</p></div>`;
}

export function partyView(state) {
  const list = state.unlockedHeroes
    .map((id) => {
      const h = heroById(id);
      if (!h) return "";
      const on = state.party.includes(id);
      const isMc = id.startsWith("mc-");
      return `<div class="hero-card ${on ? "in" : ""}">
        <div class="d-main">
          <div class="d-head"><b>${esc(h.name)}</b>${chip(roleLabel(h.role))}${isMc ? chip("主角", "cin") : ""}</div>
          <div class="muted d-skill">${esc(h.skill)}：${esc(h.skillDesc)}</div>
          <div class="d-stats"><span>攻 <b>${h.atk}</b></span><span>生 <b>${h.hp}</b></span><span>防 <b>${h.def}</b></span></div>
        </div>
        <div class="d-acts">
          <button data-act="toggle-party" data-hid="${id}" ${isMc && on ? "disabled" : ""}>${on ? "撤下" : "上阵"}</button>
        </div>
      </div>`;
    })
    .join("");
  return `<div class="card"><h3>阵容 ${state.party.length}/6 <span class="muted">主角常驻，不可撤下</span></h3>${list}</div>`;
}

function combatPanel(state) {
  const c = state.combat;
  if (!c) return "";
  const last = c.result.frames?.at(-1);
  if (!last) return "";
  const a = last.units.filter((u) => u.side === "a");
  const b = last.units.filter((u) => u.side === "b");
  const col = (arr) =>
    arr
      .map(
        (u) => `<div class="fighter ${u.alive ? "" : "dead"}"><b>${esc(u.name)}</b>
        ${bar(u.hp / u.maxHp)}
        <span class="muted">${fmt(u.hp)} / ${fmt(u.maxHp)}</span></div>`,
      )
      .join("");
  const win = c.result.winner === "a";
  return `<div class="card battlefield" style="margin-top:0.8rem">
    <div class="side-col"><h4>仙府</h4>${col(a)}</div>
    <div class="vs">${win ? "胜" : "败"}</div>
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

function artifactCard(state, a) {
  const preview = equipPreview(state, a);
  const eq = preview.kind === "equipped";
  const own = preview.kind !== "locked";
  const src = artifactSource(a);
  const label =
    preview.kind === "equipped" ? "卸下" : preview.kind === "swap" ? "换上" : preview.kind === "free" ? "佩戴" : "未获";
  const hint = !own
    ? `<div class="muted art-src">${src.ready ? `出自 ${esc(src.text)}` : esc(src.text)}</div>`
    : preview.kind === "swap"
      ? `<div class="muted art-src">槽位已满：换上将顶下 <b>${esc(preview.dropped.join("、"))}</b></div>`
      : "";
  return `<div class="art-card ${eq ? "in" : ""}">
    <div class="d-main">
      <div class="d-head"><b>${esc(a.name)}</b>${chip(esc(SLOT_LABEL[a.slot] ?? a.slot))}${chip(
        esc(RARITY_LABEL[a.rarity] ?? a.rarity),
        a.rarity === "red" ? "cin" : "gold",
      )}${eq ? chip("已入槽", "cin") : own ? "" : chip("未获")}</div>
      <div class="muted d-skill">${esc(a.desc)}</div>
      ${hint}
    </div>
    <div class="d-acts">
      <button class="${own && !eq ? "gold" : ""}" ${own ? "" : "disabled"} data-act="equip" data-aid="${a.id}"
        title="${esc(preview.kind === "swap" ? `槽位已满，会顶下 ${preview.dropped.join("、")}` : a.desc)}">${esc(label)}</button>
    </div></div>`;
}

function slotCells(group, shared) {
  const filled = group.items
    .map(
      (a) => `<span class="slot-cell filled" title="${esc(`${a.name} · ${a.desc}`)}">${esc(a.name)}</span>`,
    )
    .join("");
  if (shared) return filled || `<span class="slot-cell none">未佩</span>`;
  const free = Array.from({ length: group.free }, () => `<span class="slot-cell">空</span>`).join("");
  return `${filled}${free}` || `<span class="slot-cell none">无槽</span>`;
}

function slotBoardHtml(board) {
  const shared = board.rule.shared;
  const rows = board.groups
    .map(
      (g) => `<div class="slot-row">
        <span class="slot-name">${g.label} <b>${g.items.length}</b>${shared ? "" : `/${g.cap}`}</span>
        <div class="slot-cells">${slotCells(g, shared)}</div>
      </div>`,
    )
    .join("");
  const spare = shared
    ? `<div class="slot-row">
        <span class="slot-name">空槽 <b>${board.free}</b></span>
        <div class="slot-cells">${
          board.free
            ? Array.from({ length: board.free }, () => `<span class="slot-cell">空</span>`).join("")
            : `<span class="slot-cell none">已满</span>`
        }</div>
      </div>`
    : "";
  return `<div class="slot-board">${rows}${spare}</div>`;
}

function slotRuleNote(rule) {
  const order = rule.evicted === "newest" ? "最近佩上的" : "最早佩上的";
  if (rule.shared) {
    return `${rule.total} 格通槽由攻击／防御／通用共用：佩满后再佩戴，会顶掉${order}一件（按钮上会写明顶下谁）。`;
  }
  const caps = SLOTS.map((s) => `${SLOT_LABEL[s]} ${rule.caps[s]}`).join(" · ");
  const deep = SLOTS.some((s) => (rule.caps[s] ?? 0) > 1);
  return `各槽独立：${caps}，共 ${rule.total} 格。同槽佩满后再佩戴，会顶掉该槽${
    deep ? order : "原有的"
  }一件，别的槽位不受牵连（按钮上会写明顶下谁）。`;
}

export function artifactsView(state) {
  const board = slotBoard(state);
  const groups = SLOTS.map((slot) => {
    const list = ARTIFACTS.filter((a) => a.slot === slot);
    if (!list.length) return "";
    const owned = list.filter((a) => state.ownedArtifacts.includes(a.id)).length;
    const on = board.groups.find((g) => g.slot === slot);
    return `<h4 class="sub">${SLOT_LABEL[slot]} <span class="muted">已得 ${owned}/${list.length} · 入槽 ${
      on?.items.length ?? 0
    }</span></h4>
      ${list.map((a) => artifactCard(state, a)).join("")}`;
  }).join("");
  const rest = ARTIFACTS.filter((a) => !SLOT_LABEL[a.slot])
    .map((a) => artifactCard(state, a))
    .join("");
  const drops = dropProgress(state);
  const next = drops.find((d) => !d.done);
  const dropLine = next
    ? `<p class="muted">下一件到手：<b>${esc(next.name)}</b> — ${
        next.via === "tower" ? `登天塔第 ${next.at} 层` : `兽潮第 ${next.at} 波`
      }（现最高 ${next.best}）。</p>`
    : `<p class="muted">已实装的掉落节点均已通关。</p>`;

  return `<div class="card"><h3>法器槽 <span class="muted">${board.used}/${board.total}</span></h3>
    ${slotBoardHtml(board)}
    <p class="muted">${esc(slotRuleNote(board.rule))}</p>
    ${dropLine}${groups}${rest}</div>`;
}

export function screen(tab, state, ui) {
  switch (tab) {
    case "disciples":
      return disciplesView(state, ui);
    case "cultivate":
      return cultivateView(state, ui);
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
