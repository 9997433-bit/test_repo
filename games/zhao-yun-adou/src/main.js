import "./styles/ink.css";
import { createGame } from "./core/game.js";
import { stepAi } from "./ai/opponent.js";
import { render } from "./ui/render.js";
import { sfx } from "./audio/sfx.js";

const root = document.querySelector("#app");
const api = createGame({ seed: 20260623 });
const ui = { selected: -1, hover: -1, toast: "", shake: false };

api.bus.on("recruit", () => sfx.recruit());
api.bus.on("merge", () => {
  sfx.merge();
  flash("合并升阶");
});
api.bus.on("hero-awaken", (p) => {
  sfx.awaken();
  flash(`${p.names.join("、")} 出阵`);
});
api.bus.on("leak", (p) => {
  if (p.side === "player") {
    sfx.leak();
    ui.shake = true;
    setTimeout(() => {
      ui.shake = false;
    }, 360);
  }
  flash(p.side === "player" ? "阿斗受伤，赐粮征兵" : "对岸阿斗受伤");
});
api.bus.on("skill", (p) => {
  sfx.skill();
  flash(`${p.hero} · ${p.skill}`);
});
api.bus.on("game-over", (p) => {
  p.winner === "player" ? sfx.win() : sfx.lose();
});
api.bus.on("wave", (p) => flash(`第 ${p.wave} 波来袭`));

function flash(text) {
  ui.toast = text;
}

function bind() {
  root.querySelector("#btn-start")?.addEventListener("click", () => {
    sfx.unlock();
    api.start();
  });
  root.querySelector("#btn-again")?.addEventListener("click", () => api.start());
  root.querySelector("#btn-recruit")?.addEventListener("click", () => {
    sfx.unlock();
    const r = api.recruit("player");
    if (r?.error === "hand-full") flash("兵营已满");
    if (r?.error === "no-mantou") flash("馒头不足");
  });

  root.querySelectorAll("[data-hand]").forEach((el) => {
    const i = Number(el.dataset.hand);
    el.addEventListener("click", () => {
      ui.selected = ui.selected === i ? -1 : i;
    });
    el.addEventListener("pointerdown", (ev) => {
      ui.selected = i;
      el.setPointerCapture(ev.pointerId);
    });
  });

  root.querySelectorAll("[data-cell]").forEach((el) => {
    const idx = Number(el.dataset.cell);
    el.addEventListener("pointerenter", () => {
      ui.hover = idx;
    });
    el.addEventListener("pointerleave", () => {
      if (ui.hover === idx) ui.hover = -1;
    });
    el.addEventListener("click", () => tryDrop(idx));
    el.addEventListener("pointerup", () => tryDrop(idx));
  });
}

function tryDrop(cellIndex) {
  if (ui.selected < 0) return;
  const card = api.state.sides.player.hand[ui.selected];
  if (!card) return;
  let ok = false;
  if (card.kind === "shovel") ok = api.useShovel("player", ui.selected, cellIndex);
  else ok = api.place("player", ui.selected, cellIndex);
  if (!ok) {
    const from = api.state.sides.player.cells.findIndex((c, i) => i !== cellIndex && c.unit);
    if (from >= 0 && api.state.sides.player.cells[cellIndex].unit) {
      ok = api.merge("player", from, cellIndex);
    }
  }
  if (ok) ui.selected = -1;
}

let last = performance.now();
let acc = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  api.tick(dt);
  stepAi(api, dt);
  acc += dt;
  if (acc >= 1 / 30) {
    acc = 0;
    render(root, api, ui);
    bind();
  }
  requestAnimationFrame(frame);
}

render(root, api, ui);
bind();
requestAnimationFrame(frame);
