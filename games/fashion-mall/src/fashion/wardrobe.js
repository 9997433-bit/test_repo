import { OUTFITS } from "../data/balance.js";
import { charmOf } from "../core/economy.js";
import { persist } from "../core/state.js";
import { sfx } from "../core/audio.js";

const COLORS = {
  bob: "#3a2433",
  long: "#6b3a2a",
  high: "#1d1a2b",
  tee: "#ffe1ec",
  blazer: "#c73b6f",
  gown: "#e8c37a",
  skirt: "#ffd6e5",
  slacks: "#d9c4b0",
  silk: "#c9b6ff",
  sneaker: "#fff",
  heel: "#3a2433",
  boot: "#6b4b5c",
};

export function renderWardrobe(root, state) {
  const charm = charmOf(state.outfit);
  root.innerHTML = `
    <section class="panel">
      <h2>百变衣橱</h2>
      <p>魅力 ${charm} · 每点魅力约 +0.2% 全店客流</p>
      <div class="doll">
        <div class="part hair" style="background:${COLORS[state.outfit.hair.id]}"></div>
        <div class="part face"></div>
        <div class="part top" style="background:${COLORS[state.outfit.top.id]}"></div>
        <div class="part bottom" style="background:${COLORS[state.outfit.bottom.id]}"></div>
        <div class="part shoes" style="background:${COLORS[state.outfit.shoes.id]}"></div>
      </div>
      <div id="slots"></div>
    </section>`;
  const slots = root.querySelector("#slots");
  for (const [slot, items] of Object.entries(OUTFITS)) {
    const wrap = document.createElement("div");
    wrap.innerHTML = `<strong>${{ hair: "发型", top: "上装", bottom: "下装", shoes: "鞋履", acc: "饰品" }[slot]}</strong>`;
    const row = document.createElement("div");
    row.className = "choices";
    items.forEach((item) => {
      const b = document.createElement("button");
      b.textContent = `${item.name} +${item.charm}`;
      if (state.outfit[slot]?.id === item.id) b.classList.add("on");
      b.onclick = () => {
        state.outfit[slot] = item;
        persist(state);
        sfx.tap();
        renderWardrobe(root, state);
      };
      row.append(b);
    });
    wrap.append(row);
    slots.append(wrap);
  }
}
