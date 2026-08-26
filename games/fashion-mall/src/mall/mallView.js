import { SHOPS } from "../data/balance.js";
import { shopRate } from "../data/balance.js";
import { charmOf, shopBonusMap, formatGold } from "../core/economy.js";
import { grantGold, persist, syncUnlocks } from "../core/state.js";
import { sfx } from "../core/audio.js";

export function renderMall(root, state, openShop) {
  syncUnlocks(state);
  const charm = charmOf(state.outfit);
  const bonuses = shopBonusMap(state.partners, state.shops);
  const left = Math.max(0, state.goal.until - Date.now());
  const mins = Math.floor(left / 60000);
  root.innerHTML = `
    <section class="hero">
      <h1>${state.name} 的时尚百货城</h1>
      <p>主角 Lv.${state.level} · 把冷清店铺一座座爆改。限时目标 ${formatGold(state.goal.target)} ${state.goal.done ? "已完成" : `还剩 ${mins} 分`}</p>
    </section>
    <div class="mall-grid"></div>`;
  const grid = root.querySelector(".mall-grid");
  for (const shop of SHOPS) {
    const s = state.shops[shop.id];
    const rate = s.unlocked
      ? shopRate(shop, s.level, s.staff, bonuses[shop.id] || 0, charm)
      : 0;
    const card = document.createElement("button");
    card.className = `shop-card ${s.unlocked ? "" : "locked"}`;
    card.style.background = `linear-gradient(180deg, ${shop.color}, #fff)`;
    card.innerHTML = `
      <div class="emoji">${shop.emoji}</div>
      <h3>${shop.name}</h3>
      <small>${s.unlocked ? `Lv.${s.level} · ${formatGold(rate)}/秒` : `主角 Lv.${shop.unlockLevel} 解锁`}</small>
      <div>${s.auto ? "自动经营中" : s.unlocked ? "需照看" : "筹备中"}</div>`;
    card.onclick = () => {
      if (!s.unlocked) {
        state.toast = `主角升到 ${shop.unlockLevel} 级后收购${shop.name}`;
        return;
      }
      sfx.tap();
      openShop(shop.id);
    };
    grid.append(card);
  }

  const panel = document.createElement("section");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="row">
      <div>
        <strong>店铺升级</strong>
        <p style="margin:6px 0 0;color:var(--ink-soft);font-size:13px">用营收砸装修，员工满员即可自动经营</p>
      </div>
    </div>
    <div id="upgrades"></div>`;
  root.append(panel);
  const box = panel.querySelector("#upgrades");
  for (const shop of SHOPS.filter((x) => state.shops[x.id].unlocked)) {
    const s = state.shops[shop.id];
    const cost = Math.floor(80 * 1.45 ** (s.level - 1));
    const hire = Math.floor(50 * 1.5 ** s.staff);
    const row = document.createElement("div");
    row.className = "row";
    row.style.margin = "10px 0";
    row.innerHTML = `
      <div>${shop.emoji} ${shop.name} Lv.${s.level} 员工 ${s.staff}/${shop.staffSlots}</div>
      <div style="display:flex;gap:6px">
        <button class="btn ghost" data-up>升级 ${cost}</button>
        <button class="btn ghost" data-hire>招聘 ${hire}</button>
      </div>`;
    row.querySelector("[data-up]").onclick = () => {
      if (state.gold < cost) return (state.toast = "现金不够装修");
      state.gold -= cost;
      s.level += 1;
      sfx.coin();
      persist(state);
      renderMall(root, state, openShop);
    };
    row.querySelector("[data-hire]").onclick = () => {
      if (s.staff >= shop.staffSlots) return (state.toast = "工位已满");
      if (state.gold < hire) return (state.toast = "发不起工资");
      state.gold -= hire;
      s.staff += 1;
      if (s.staff >= shop.staffSlots) s.auto = true;
      sfx.coin();
      persist(state);
      renderMall(root, state, openShop);
    };
    box.append(row);
  }
}
