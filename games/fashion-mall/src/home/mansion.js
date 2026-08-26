import { FURNITURE } from "../data/balance.js";
import { furnitureBonus } from "../core/economy.js";
import { persist } from "../core/state.js";
import { sfx } from "../core/audio.js";

const ROOMS = { living: "会客厅", studio: "造型间", spa: "空中SPA" };

export function renderMansion(root, state) {
  const bonus = furnitureBonus(state.furniture);
  root.innerHTML = `
    <section class="panel">
      <h2>超绝豪宅</h2>
      <p>家装离线加成 +${Math.round(bonus * 100)}%</p>
    </section>`;
  for (const [id, name] of Object.entries(ROOMS)) {
    const room = document.createElement("section");
    room.className = "panel";
    room.innerHTML = `<strong>${name}</strong><div class="room"></div>`;
    const box = room.querySelector(".room");
    FURNITURE.filter((f) => f.room === id).forEach((f) => {
      const owned = state.furniture.includes(f.id);
      const card = document.createElement("button");
      card.className = "furn";
      card.textContent = owned ? `${f.name} ✓` : `${f.name} · ${Math.round(f.bonus * 100)}% · 购置`;
      card.onclick = () => {
        if (owned) return;
        const cost = Math.round(200 / f.bonus);
        if (state.gold < cost) return (state.toast = "先去商场赚一笔再装修");
        state.gold -= cost;
        state.furniture.push(f.id);
        persist(state);
        sfx.coin();
        renderMansion(root, state);
      };
      box.append(card);
    });
    root.append(room);
  }
}
