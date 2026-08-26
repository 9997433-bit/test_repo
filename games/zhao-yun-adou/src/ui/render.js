import { recruitCost, HAND_LIMIT, UNIT_TABLE, MAX_LEVEL, unitAttack } from "../data/units.js";
import { HEROES, heroById } from "../data/heroes.js";
import * as waves from "../data/waves.js";
import { drawLane } from "./lane.js";

const MAX_WAVE = Number.isFinite(waves.MAX_WAVE) ? waves.MAX_WAVE : 12;

const ROLE_NAMES = { melee: "近战", ranged: "远射" };

/** 单字→武将，用来提示「还差哪个字」。 */
const GLYPH_HERO = new Map();
for (const hero of HEROES) {
  GLYPH_HERO.set(hero.glyphs[0], { hero, need: hero.glyphs[1] });
  GLYPH_HERO.set(hero.glyphs[1], { hero, need: hero.glyphs[0] });
}

const esc = (v) =>
  String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function hearts(n) {
  const alive = Math.max(0, Math.min(3, n | 0));
  return "♥".repeat(alive) + "♡".repeat(3 - alive);
}

function pips(level, max = MAX_LEVEL) {
  const on = Math.max(0, Math.min(max, level | 0));
  return "●".repeat(on) + "○".repeat(max - on);
}

function unitClass(u) {
  if (!u) return "";
  if (u.kind === "hero") return "hero t5";
  if (u.kind === "glyph") return "glyph";
  if (u.kind === "shovel") return "zy-shovel";
  if (u.kind === "token") return "zy-token";
  return `t${Math.min(MAX_LEVEL, u.level || 1)}`;
}

function unitDps(u) {
  if (!u) return 0;
  if (u.kind === "hero") {
    const hero = heroById(u.id);
    return hero ? hero.atk * hero.rate : 0;
  }
  const row = UNIT_TABLE[u.id];
  if (!row || u.kind !== "unit") return 0;
  return unitAttack(u.id, u.level) * row.rate;
}

/** 悬浮说明：每格都讲清楚「这是什么、打多疼、下一步能干嘛」。 */
function cellTitle(cell, mine) {
  const who = mine ? "" : "对岸 · ";
  if (!cell.unlocked) return `${who}未开垦 · 用「铲」开地`;
  const u = cell.unit;
  if (!u) return `${who}空地 · 选中手牌后落子`;
  if (u.kind === "hero") {
    const hero = heroById(u.id);
    if (!hero) return `${who}武将`;
    const ready = (u.cooldown || 0) <= 0;
    const skill = `${hero.skill.name}（${hero.skill.desc}，${hero.skill.cd}s）`;
    const state = ready ? "大招待发" : `大招 ${Math.ceil(u.cooldown)}s`;
    return `${who}${hero.name} · 觉醒武将 · 攻${hero.atk} · 射程${hero.range} · ${skill} · ${state}`;
  }
  if (u.kind === "glyph") {
    const pair = GLYPH_HERO.get(u.glyph);
    return pair
      ? `${who}「${u.glyph}」姓名残卷 · 与「${pair.need}」相邻即觉醒${pair.hero.name} · 沉睡不出手`
      : `${who}「${u.glyph}」姓名残卷 · 沉睡不出手`;
  }
  const row = UNIT_TABLE[u.id];
  if (!row) return `${who}${u.glyph}`;
  const cap = u.level >= MAX_LEVEL ? "已满阶" : "同字同级相邻可合并";
  return `${who}${row.glyph} Lv${u.level} · ${ROLE_NAMES[row.role] || row.role} · 攻${unitAttack(u.id, u.level)} · 攻速${row.rate}/s · 射程${row.range} · ${cap}`;
}

function cellFace(cell) {
  if (!cell.unlocked) return `<span class="zy-face">锁</span>`;
  const u = cell.unit;
  if (!u) return `<span class="zy-face"></span>`;
  const face = `<span class="zy-face">${esc(u.glyph)}</span>`;
  if (u.kind === "hero") {
    const ready = (u.cooldown || 0) <= 0;
    const tag = ready ? "技成" : `${Math.ceil(u.cooldown)}s`;
    return `${face}<i class="zy-tag ${ready ? "zy-ready" : ""}">${tag}</i><i class="zy-pips">${pips(MAX_LEVEL)}</i>`;
  }
  if (u.kind === "glyph") {
    const pair = GLYPH_HERO.get(u.glyph);
    return `${face}<i class="zy-tag">${pair ? `待${esc(pair.need)}` : "残卷"}</i>`;
  }
  return `${face}<i class="zy-pips">${pips(u.level)}</i>`;
}

function gridHtml(side, mine) {
  return side.cells
    .map((cell) => {
      const cls = cell.unlocked ? unitClass(cell.unit) : "locked";
      const hook = mine ? ` data-cell="${cell.index}"` : "";
      return `<div class="cell ${cls}"${hook} title="${esc(cellTitle(cell, mine))}">${cellFace(cell)}</div>`;
    })
    .join("");
}

/** 手牌上直接写清「刀 Lv1 / 铲 / 赵」。 */
function cardLabel(card) {
  if (card.kind === "unit") {
    const row = UNIT_TABLE[card.id];
    return {
      kind: `${row ? row.glyph : card.glyph} Lv${card.level}`,
      sub: row ? `${ROLE_NAMES[row.role] || row.role}·攻${unitAttack(card.id, card.level)}` : "兵种",
      title: row
        ? `${row.glyph} Lv${card.level} · ${ROLE_NAMES[row.role]} · 攻${unitAttack(card.id, card.level)} · 攻速${row.rate}/s · 落在同字同级上即合并`
        : `${card.glyph} Lv${card.level}`,
    };
  }
  if (card.kind === "shovel") {
    return { kind: "铲", sub: "开地", title: "铲 · 开垦一格锁住的棋格，只能点锁格" };
  }
  if (card.kind === "glyph") {
    const pair = GLYPH_HERO.get(card.glyph);
    return {
      kind: esc(card.glyph),
      sub: pair ? pair.hero.name : "姓名",
      title: pair
        ? `「${card.glyph}」姓名残卷 · 与「${pair.need}」相邻觉醒${pair.hero.name}（${pair.hero.skill.name}）· 落地后不会攻击`
        : `「${card.glyph}」姓名残卷`,
    };
  }
  if (card.kind === "token") {
    return { kind: "符", sub: "升阶", title: "神兵符 · 贴在未满阶的兵种上直接升一级" };
  }
  return { kind: esc(card.glyph || "?"), sub: "", title: "" };
}

function handHtml(side, ui) {
  return Array.from({ length: HAND_LIMIT }, (_, i) => {
    const card = side.hand[i];
    if (!card) {
      return `<div class="card ghost" title="空位 · 征兵后入营"><span class="zy-face">空</span><b class="zy-kind">${i + 1}</b></div>`;
    }
    const label = cardLabel(card);
    return `<div class="card ${unitClass(card)} ${ui.selected === i ? "selected" : ""}" data-hand="${i}" title="${esc(label.title)}">
      <em class="zy-key">${i + 1}</em>
      <span class="zy-face">${esc(card.glyph)}</span>
      <b class="zy-kind">${label.kind}</b>
      <em class="zy-sub">${esc(label.sub)}</em>
    </div>`;
  }).join("");
}

function boardSummary(side) {
  let fighters = 0;
  let sleepers = 0;
  let unlocked = 0;
  let power = 0;
  let best = null;
  for (const cell of side.cells) {
    if (!cell.unlocked) continue;
    unlocked += 1;
    const u = cell.unit;
    if (!u) continue;
    if (u.kind === "glyph") {
      sleepers += 1;
      continue;
    }
    fighters += 1;
    power += unitDps(u);
    if (!best || (u.level || 0) >= (best.level || 0)) best = u;
  }
  return { fighters, sleepers, unlocked, power: Math.round(power), best };
}

function incoming(side) {
  const queued = side.spawnQueue.reduce((n, q) => n + (q.remain || 0) + (q.bossLeft || 0), 0);
  return { alive: side.enemies.length, queued, boss: side.enemies.some((e) => e.boss) };
}

function hudHtml(state, p, a, cost, canRecruit) {
  const mine = boardSummary(p);
  const foe = boardSummary(a);
  const rush = incoming(p);
  const nextBoss = ((state.wave + 3) & ~3) || 4;
  const phaseChip =
    state.phase === "paused"
      ? `<span class="zy-chip">暂停</span>`
      : rush.boss
        ? `<span class="zy-chip zy-hot">将至</span>`
        : "";
  return `
    <div class="zy-stat" title="共 ${MAX_WAVE} 波，每 4 波压上一名敌将；两侧同时进兵">
      <span class="zy-k">波次</span><strong>${state.wave}<em class="zy-sub">/${MAX_WAVE}</em></strong>
      <em class="zy-sub">${state.time | 0}s${state.wave < MAX_WAVE ? ` · 第${nextBoss}波敌将` : " · 末波"}</em>
      ${phaseChip}
    </div>
    <div class="zy-stat" title="斩敌得馒头；征兵越征越贵（10+4×已征次数）${canRecruit ? "" : "。现在征不动了"}">
      <span class="zy-k">馒头</span><strong>${p.mantou}</strong>
      <em class="zy-sub">征兵 ${cost}${canRecruit ? "" : " · 不足"}</em>
    </div>
    <div class="zy-stat" title="战力＝场上每秒伤害估算；沉睡的姓名字不出手">
      <span class="zy-k">战力</span><strong>${mine.power}</strong>
      <em class="zy-sub">兵 ${mine.fighters}/${mine.unlocked} 格${mine.sleepers ? ` · 眠${mine.sleepers}` : ""}</em>
    </div>
    <div class="zy-stat" title="本半区在途敌军 / 尚未出场的敌军">
      <span class="zy-k">来敌</span><strong>${rush.alive}</strong>
      <em class="zy-sub">待出 ${rush.queued}</em>
    </div>
    <div class="zy-stat" title="双方斩获对比，平局时按斩获判胜">
      <span class="zy-k">斩获</span><strong>${p.kills}</strong>
      <em class="zy-sub">对岸 ${a.kills} · 敌战力 ${foe.power}</em>
    </div>
    <div class="zy-stat" title="阿斗三心，漏一个兵扣一心；先破对岸阿斗者胜">
      <span class="zy-k">阿斗</span><strong class="hearts">${hearts(p.hearts)}</strong>
      <em class="zy-sub">对岸 <span class="hearts">${hearts(a.hearts)}</span></em>
    </div>`;
}

/** 开局三步走：按当前局面点亮对应那一步。 */
function coachHtml(state, p, ui) {
  if (state.phase !== "playing") return "";
  const mine = boardSummary(p);
  if (state.wave > 2 || mine.fighters >= 3) return "";
  let step = 3;
  let text = "拖到棋格落子：同字同级相邻可合并，「赵」「云」相邻即觉醒武将。";
  if (!p.hand.length) {
    step = 1;
    text = "先点「征兵」（或按 E）花馒头抽一张兵牌。";
  } else if (ui.selected < 0) {
    step = 2;
    text = "点一张手牌选中（或按 1-5），准备布阵。";
  }
  const dots = [1, 2, 3].map((i) => (i === step ? "●" : "○")).join("");
  return `<div class="zy-coach"><b>${"①②③"[step - 1]}</b><span>${text}</span><span class="zy-dots">${dots}</span></div>`;
}

function menuPanel() {
  return `<div class="overlay"><div class="panel">
    <span class="seal">单骑救主</span>
    <h1 class="title">赵云与阿斗</h1>
    <p class="tips">上下半区各守一个「斗」。糜夫人托孤，长坂坡上单骑救主——谁先把对岸的阿斗打空三颗心，谁就赢。</p>
    <ol class="zy-tutor">
      <li><b>①</b><div>
        <strong>征兵入营</strong>
        <span>点「征兵」花馒头抽牌：刀 / 枪 / 弓 / 骑，偶尔出武将单字、铲子与神兵符。手牌上限五张，越征越贵。</span>
      </div></li>
      <li><b>②</b><div>
        <strong>布阵开地</strong>
        <span>把手牌拖到棋格上：近战守外圈挡路，弓手居内圈输出。抽到「铲」点锁住的格子，多开一格就多一份战力。</span>
      </div></li>
      <li><b>③</b><div>
        <strong>合并觉醒</strong>
        <span>同字同级相邻即可合并，一路升到五阶（橙）。凑齐姓名二字相邻——如「赵」＋「云」——立刻觉醒武将放大招。</span>
      </div></li>
    </ol>
    <p class="zy-keys">空格 暂停 · 1-5 选牌 · E 征兵 · R 重开</p>
    <p><button class="ink" id="btn-start">出征</button></p>
  </div></div>`;
}

function overPanel(state, p, a) {
  const win = state.winner === "player";
  return `<div class="overlay"><div class="panel">
    <span class="seal">${win ? "单骑救主" : "长坂遗恨"}</span>
    <h1 class="title">${win ? "救主成功" : "阿斗遇险"}</h1>
    <p class="tips">${
      win
        ? "怀抱幼主杀出重围，血染征袍透甲红。"
        : "乱军之中失了阿斗，且回营再整旗鼓。"
    }</p>
    <div class="zy-score">
      <div><span class="zy-k">吾方斩获</span><strong>${p.kills}</strong></div>
      <div><span class="zy-k">对岸斩获</span><strong>${a.kills}</strong></div>
      <div><span class="zy-k">吾方余心</span><strong class="hearts">${hearts(p.hearts)}</strong></div>
      <div><span class="zy-k">对岸余心</span><strong class="hearts">${hearts(a.hearts)}</strong></div>
      <div><span class="zy-k">推进波次</span><strong>${state.wave}/${MAX_WAVE}</strong></div>
      <div><span class="zy-k">鏖战时辰</span><strong>${state.time | 0}s</strong></div>
    </div>
    <p><button class="ink" id="btn-again">再战</button></p>
  </div></div>`;
}

const EXTRA_CSS = `
#app .hud { gap: 8px 14px; }
#app .hud .zy-stat { display: flex; align-items: baseline; gap: 6px; font-size: 14px; }
#app .zy-k { font-size: 11px; letter-spacing: 0.2em; opacity: 0.62; }
#app .zy-sub { font-style: normal; font-size: 11px; opacity: 0.62; }
#app .zy-chip { border: 1px solid currentColor; color: var(--cinnabar, #b23a2f); font-size: 10px; letter-spacing: 0.2em; padding: 0 5px; }
#app .zy-chip.zy-hot { color: var(--gold, #c9a24a); }
#app .cell { position: relative; overflow: hidden; }
#app .cell .zy-face { line-height: 1; pointer-events: none; }
#app .cell.hero .zy-face { font-size: 21px; letter-spacing: -1px; }
#app .zy-pips { position: absolute; left: 0; right: 0; bottom: 2px; text-align: center; font-size: 8px; letter-spacing: 2px; font-style: normal; opacity: 0.8; pointer-events: none; }
#app .zy-tag { position: absolute; top: 2px; right: 4px; font-size: 10px; font-style: normal; opacity: 0.72; font-family: "Noto Serif SC", serif; pointer-events: none; }
#app #btn-recruit { display: flex; align-items: baseline; gap: 6px; justify-content: center; }
#app #btn-recruit .zy-sub { opacity: 0.75; letter-spacing: 0; }
#app .zy-tag.zy-ready { color: var(--gold, #c9a24a); opacity: 1; }
#app .card { position: relative; gap: 1px; }
#app .card .zy-face { font-size: 27px; line-height: 1.05; pointer-events: none; }
#app .card .zy-kind { font-family: "Noto Serif SC", serif; font-size: 11px; font-weight: 600; letter-spacing: 0.04em; opacity: 0.85; pointer-events: none; }
#app .card .zy-sub { pointer-events: none; }
#app .card .zy-key { position: absolute; top: 3px; left: 5px; font-size: 9px; font-style: normal; opacity: 0.4; font-family: "Noto Serif SC", serif; pointer-events: none; }
#app .card.ghost .zy-kind { opacity: 0.5; }
#app .card.zy-shovel .zy-face { color: var(--moss, #6b7a6a); }
#app .card.zy-token .zy-face { color: var(--gold, #c9a24a); }
#app .zy-coach { display: flex; align-items: center; gap: 8px; margin-top: 4px; font-size: 12px; color: var(--ink-soft, #3a3126); }
#app .zy-coach b { font-family: "Ma Shan Zheng", cursive; font-size: 17px; color: var(--cinnabar, #b23a2f); line-height: 1; }
#app .zy-coach .zy-dots { margin-left: auto; letter-spacing: 3px; opacity: 0.45; }
#app .zy-tutor { list-style: none; margin: 16px 0; padding: 0; display: grid; gap: 12px; }
#app .zy-tutor li { display: grid; grid-template-columns: 22px 1fr; gap: 10px; align-items: start; border-left: 2px solid rgba(178, 58, 47, 0.3); padding-left: 10px; }
#app .zy-tutor b { font-family: "Ma Shan Zheng", cursive; font-size: 20px; color: var(--cinnabar, #b23a2f); line-height: 1; }
#app .zy-tutor strong { display: block; font-size: 14px; margin-bottom: 2px; }
#app .zy-tutor span { display: block; font-size: 12px; line-height: 1.7; color: var(--ink-soft, #3a3126); }
#app .zy-keys { font-size: 11px; letter-spacing: 0.08em; opacity: 0.55; margin: 0 0 14px; }
#app .zy-score { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 12px; margin: 14px 0 18px; }
#app .zy-score div { display: grid; gap: 2px; }
#app .zy-score strong { font-size: 16px; font-weight: 600; }
@media (max-width: 520px) {
  #app .zy-score { grid-template-columns: repeat(2, 1fr); }
  #app .card .zy-sub { display: none; }
}`;

let stylesInjected = false;

/** 渲染层自带的补充样式，不动 `src/styles/ink.css`。 */
function ensureStyles() {
  if (stylesInjected || typeof document === "undefined" || !document.head) return;
  stylesInjected = true;
  let style = document.getElementById("zy-ui-ext");
  if (!style) {
    style = document.createElement("style");
    style.id = "zy-ui-ext";
    document.head.appendChild(style);
  }
  style.textContent = EXTRA_CSS;
}

export function render(root, api, ui) {
  ensureStyles();
  const s = api.state;
  const p = s.sides.player;
  const a = s.sides.ai;
  const cost = recruitCost(p.recruitCount);
  const canRecruit = s.phase === "playing" && p.hand.length < HAND_LIMIT && p.mantou >= cost;

  root.innerHTML = `
    <header>
      <span class="seal">长坂坡</span>
      <h1 class="title">赵云与阿斗</h1>
      <p class="subtitle">汉字合成 · 水墨塔防 · 先破阿斗者胜</p>
    </header>
    <div class="hud">${hudHtml(s, p, a, cost, canRecruit)}</div>
    <div class="arena">
      <section class="half ai">
        <div class="adou" title="对岸阿斗：还剩 ${a.hearts} 心">斗 <small>对岸阿斗 <span class="hearts">${hearts(a.hearts)}</span></small></div>
        <div class="field">
          <div class="lane"><canvas id="lane-ai"></canvas></div>
          <div class="grid" id="grid-ai">${gridHtml(a, false)}</div>
        </div>
      </section>
      <section class="half player ${ui.shake ? "shake" : ""}">
        <div class="field">
          <div class="lane"><canvas id="lane-player"></canvas></div>
          <div class="grid" id="grid-player">${gridHtml(p, true)}</div>
        </div>
        <div class="adou" title="吾方阿斗：还剩 ${p.hearts} 心，漏怪即扣心">斗 <small>吾方阿斗 <span class="hearts">${hearts(p.hearts)}</span></small></div>
      </section>
    </div>
    <div class="hand-row">
      <div class="hand">${handHtml(p, ui)}</div>
      <button class="ink" id="btn-recruit" title="花 ${cost} 馒头抽一张（快捷键 E）" ${canRecruit ? "" : "disabled"}>征兵<em class="zy-sub">${cost}</em></button>
    </div>
    <div class="toast">${esc(ui.toast || "点征兵入手牌，拖到棋盘。同字同级可合并；赵+云等相邻即可觉醒。")}</div>
    ${coachHtml(s, p, ui)}
    ${s.phase === "menu" ? menuPanel() : ""}
    ${s.phase === "over" ? overPanel(s, p, a) : ""}
  `;

  // 主循环把界面渲染到离屏容器再做 diff，只有真正挂到页面上的画布才值得画。
  const cai = root.querySelector("#lane-ai");
  const cpl = root.querySelector("#lane-player");
  if (cai?.isConnected && cai.clientWidth > 0) drawLane(cai, a.enemies, true);
  if (cpl?.isConnected && cpl.clientWidth > 0) drawLane(cpl, p.enemies, false);
}
