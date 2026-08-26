import { RESEARCH_NODES } from "../data/balance.js";
import { persist } from "../core/state.js";
import { sfx } from "../core/audio.js";

export function renderLabs(root, state) {
  root.innerHTML = `
    <section class="panel">
      <h2>关卡研发 · 工厂收购</h2>
      <p>用现金砸流水线，完成后永久抬高基础收入。</p>
    </section>`;
  for (const node of RESEARCH_NODES) {
    const done = state.researchDone.includes(node.id);
    const card = document.createElement("section");
    card.className = "panel";
    card.innerHTML = `
      <div class="row">
        <div>
          <strong>${node.name}</strong>
          <div style="color:var(--ink-soft);font-size:13px">完成后 +${node.income}/秒</div>
        </div>
        <button class="btn ${done ? "ghost" : ""}">${done ? "已研发" : `投入 ${node.cost}`}</button>
      </div>`;
    card.querySelector("button").onclick = () => {
      if (done) return;
      if (state.gold < node.cost) return (state.toast = "研发预算不够");
      state.gold -= node.cost;
      state.researchDone.push(node.id);
      persist(state);
      sfx.win();
      renderLabs(root, state);
    };
    root.append(card);
  }
}
