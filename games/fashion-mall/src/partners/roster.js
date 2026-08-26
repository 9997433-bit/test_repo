import { persist } from "../core/state.js";
import { SHOPS } from "../data/balance.js";
import { sfx } from "../core/audio.js";

export function renderRoster(root, state) {
  root.innerHTML = `
    <section class="panel">
      <h2>伙伴助手</h2>
      <p>招募碎片 ${state.shards} · 匹配特长可拿 +60% 店收入</p>
    </section>`;
  for (const p of state.partners) {
    const card = document.createElement("section");
    card.className = "panel";
    const shops = SHOPS.filter((s) => state.shops[s.id].unlocked);
    card.innerHTML = `
      <div class="row">
        <div>
          <strong>${p.name}</strong> · ${p.title}
          <div style="color:var(--ink-soft);font-size:13px">${p.specialty} · ${p.story}</div>
        </div>
        <div>Lv.${p.level}</div>
      </div>
      <div class="choices" style="margin-top:10px"></div>`;
    const row = card.querySelector(".choices");
    if (!p.owned) {
      const b = document.createElement("button");
      b.className = "btn";
      b.textContent = "消耗 3 碎片签约";
      b.onclick = () => {
        if (state.shards < 3) return (state.toast = "碎片不够，去盲盒或占卜转转");
        state.shards -= 3;
        p.owned = true;
        persist(state);
        sfx.rare();
        renderRoster(root, state);
      };
      row.append(b);
    } else {
      const up = document.createElement("button");
      up.textContent = `培训 ${40 * p.level} 金`;
      up.onclick = () => {
        const cost = 40 * p.level;
        if (state.gold < cost) return (state.toast = "培训费不足");
        state.gold -= cost;
        p.level += 1;
        persist(state);
        sfx.coin();
        renderRoster(root, state);
      };
      row.append(up);
      shops.forEach((shop) => {
        const b = document.createElement("button");
        b.textContent = `派驻${shop.name}`;
        if (p.assigned === shop.id) b.classList.add("on");
        b.onclick = () => {
          if (p.assigned && state.shops[p.assigned]) {
            state.shops[p.assigned].assignees = state.shops[p.assigned].assignees.filter((id) => id !== p.id);
          }
          p.assigned = shop.id;
          const list = state.shops[shop.id].assignees;
          if (!list.includes(p.id)) list.push(p.id);
          persist(state);
          sfx.tap();
          renderRoster(root, state);
        };
        row.append(b);
      });
    }
    root.append(card);
  }
}
