import { SHOPS, shopRate } from "../data/balance.js";
import { charmOf, shopBonusMap, formatGold } from "../core/economy.js";
import { persist, syncUnlocks } from "../core/state.js";
import { upgradeShop, hireStaff, shopUpgradeCost, shopHireCost } from "../core/actions.js";
import { esc, setText } from "../ui/dom.js";
import { sfx } from "../core/audio.js";

const COUNTDOWN_MS = 1000;

function goalLine(state, now = Date.now()) {
  const goal = state.goal;
  if (!goal) return "";
  const remain = Math.max(0, goal.until - now);
  const mins = Math.floor(remain / 60000);
  const secs = Math.floor((remain % 60000) / 1000);
  const left = Math.max(0, goal.target - state.goldEarned);
  return `第 ${goal.tier} 档目标 ${formatGold(goal.target)}（还差 ${formatGold(left)}）· 剩余 ${mins}:${String(secs).padStart(2, "0")} · 奖励 ${formatGold(goal.reward.gold)} 金`;
}

export function renderMall(root, state, ctx = {}) {
  root._cleanup?.();
  const openShop = typeof ctx === "function" ? ctx : ctx.openShop;
  const toast = (typeof ctx === "object" && ctx.toast) || ((msg) => (state.toast = msg));
  const repaint = () => renderMall(root, state, ctx);

  syncUnlocks(state);
  const charm = charmOf(state.outfit);
  const bonuses = shopBonusMap(state.partners);
  root.innerHTML = `
    <section class="hero">
      <h1>${esc(state.name)} 的时尚百货城</h1>
      <p id="hero-sub">主角 Lv.${state.level} · 把冷清店铺一座座爆改。</p>
      <p id="goal-line">${esc(goalLine(state))}</p>
    </section>
    <div class="mall-grid"></div>`;

  const grid = root.querySelector(".mall-grid");
  for (const shop of SHOPS) {
    const s = state.shops[shop.id];
    const rate = s.unlocked ? shopRate(shop, s.level, s.staff, bonuses[shop.id] || 0, charm) : 0;
    const card = document.createElement("button");
    card.className = `shop-card ${s.unlocked ? "" : "locked"}`;
    card.style.background = `linear-gradient(180deg, ${shop.color}, #fff)`;
    card.innerHTML = `
      <div class="emoji">${shop.emoji}</div>
      <h3>${shop.name}</h3>
      <small>${s.unlocked ? `Lv.${s.level} · ${formatGold(rate)}/秒` : `主角 Lv.${shop.unlockLevel} 解锁`}</small>
      <div>${s.auto ? "自动经营中" : s.unlocked ? "需照看" : "筹备中"}</div>`;
    card.onclick = () => {
      if (!s.unlocked) return toast(`主角升到 ${shop.unlockLevel} 级后收购${shop.name}`);
      sfx.tap();
      openShop?.(shop.id);
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
    const row = document.createElement("div");
    row.className = "row";
    row.style.margin = "10px 0";
    row.innerHTML = `
      <div>${shop.emoji} ${shop.name} Lv.${s.level} 员工 ${s.staff}/${shop.staffSlots}</div>
      <div style="display:flex;gap:6px">
        <button class="btn ghost" data-up>升级 ${formatGold(shopUpgradeCost(s.level))}</button>
        <button class="btn ghost" data-hire>招聘 ${formatGold(shopHireCost(s.staff))}</button>
      </div>`;
    row.querySelector("[data-up]").onclick = () => {
      const res = upgradeShop(state, shop.id);
      if (!res.ok) return toast(res.toast);
      sfx.coin();
      persist(state);
      toast(res.toast);
      repaint();
    };
    row.querySelector("[data-hire]").onclick = () => {
      const res = hireStaff(state, shop.id);
      if (!res.ok) return toast(res.toast);
      sfx.coin();
      persist(state);
      toast(res.toast);
      repaint();
    };
    box.append(row);
  }

  // 限时目标是活的：倒计时与等级每秒局部刷新，dispose 必须把这个计时器收掉。
  const line = root.querySelector("#goal-line");
  const sub = root.querySelector("#hero-sub");
  const timer = setInterval(() => {
    if (!line.isConnected) return clearInterval(timer);
    setText(line, goalLine(state));
    setText(sub, `主角 Lv.${state.level} · 把冷清店铺一座座爆改。`);
  }, COUNTDOWN_MS);
  root._cleanup = () => clearInterval(timer);
  return root._cleanup;
}
