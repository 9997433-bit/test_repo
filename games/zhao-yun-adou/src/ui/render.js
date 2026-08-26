import { recruitCost, HAND_LIMIT } from "../data/units.js";
import { drawLane } from "./lane.js";

function hearts(n) {
  return "♥".repeat(Math.max(0, n)) + "♡".repeat(Math.max(0, 3 - n));
}

function unitClass(u) {
  if (!u) return "";
  if (u.kind === "hero") return "hero t5";
  if (u.kind === "glyph") return "glyph";
  return `t${u.level || 1}`;
}

export function render(root, api, ui) {
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
    <div class="hud">
      <div>波次 <strong>${s.wave}</strong>　时辰 ${(s.time | 0)}s</div>
      <div>馒头 <strong>${p.mantou}</strong>　征兵 ${cost}</div>
      <div>斩获 ${p.kills} / 对岸 ${a.kills}</div>
    </div>
    <div class="arena">
      <section class="half ai">
        <div class="adou">斗 <small>对岸阿斗 <span class="hearts">${hearts(a.hearts)}</span></small></div>
        <div class="field">
          <div class="lane"><canvas id="lane-ai"></canvas></div>
          <div class="grid" id="grid-ai">${a.cells
            .map(
              (c) =>
                `<div class="cell ${c.unlocked ? unitClass(c.unit) : "locked"}">${
                  c.unlocked && c.unit ? c.unit.glyph : c.unlocked ? "" : "锁"
                }</div>`,
            )
            .join("")}</div>
        </div>
      </section>
      <section class="half player ${ui.shake ? "shake" : ""}">
        <div class="field">
          <div class="lane"><canvas id="lane-player"></canvas></div>
          <div class="grid" id="grid-player">${p.cells
            .map(
              (c) =>
                `<div class="cell ${c.unlocked ? unitClass(c.unit) : "locked"} ${
                  ui.hover === c.index ? "drop" : ""
                }" data-cell="${c.index}">${
                  c.unlocked && c.unit ? c.unit.glyph : c.unlocked ? "" : "锁"
                }</div>`,
            )
            .join("")}</div>
        </div>
        <div class="adou">斗 <small>吾方阿斗 <span class="hearts">${hearts(p.hearts)}</span></small></div>
      </section>
    </div>
    <div class="hand-row">
      <div class="hand">${Array.from({ length: HAND_LIMIT }, (_, i) => {
        const card = p.hand[i];
        if (!card) return `<div class="card ghost">空</div>`;
        return `<div class="card ${ui.selected === i ? "selected" : ""} ${unitClass(card)}" data-hand="${i}">${card.glyph}</div>`;
      }).join("")}</div>
      <button class="ink" id="btn-recruit" ${canRecruit ? "" : "disabled"}>征兵</button>
    </div>
    <div class="toast">${ui.toast || "点征兵入手牌，拖到棋盘。同字同级可合并；赵+云等相邻即可觉醒。"}</div>
    ${
      s.phase === "menu"
        ? `<div class="overlay"><div class="panel">
            <span class="seal">单骑救主</span>
            <h1 class="title">赵云与阿斗</h1>
            <p class="tips">对岸与你同时守「斗」。馒头征兵，刀枪弓骑合并升级，拼出武将姓名释放水墨大招。铲子开地。阿斗三心先尽者败。</p>
            <p><button class="ink" id="btn-start">出征</button></p>
          </div></div>`
        : ""
    }
    ${
      s.phase === "over"
        ? `<div class="overlay"><div class="panel">
            <h1 class="title">${s.winner === "player" ? "救主成功" : "阿斗遇险"}</h1>
            <p class="tips">吾方斩获 ${p.kills}　对岸 ${a.kills}　余心 ${p.hearts} / ${a.hearts}</p>
            <p><button class="ink" id="btn-again">再战</button></p>
          </div></div>`
        : ""
    }
  `;

  const cai = root.querySelector("#lane-ai");
  const cpl = root.querySelector("#lane-player");
  if (cai) drawLane(cai, a.enemies, true);
  if (cpl) drawLane(cpl, p.enemies, false);
}
