import { setText } from "../ui/dom.js";
import { sfx } from "../core/audio.js";
import { payouts } from "./payouts.js";
import { createDisposer, grantReward, viewCtx } from "./runtime.js";
import { ensureStyles, panelShell, statBlock, setStat, floatText, shake, setBar } from "./ui.js";

const MENU = [
  { id: "burger", name: "星光堡", icon: "🍔" },
  { id: "fries", name: "金黄薯条", icon: "🍟" },
  { id: "drink", name: "蜜桃气泡", icon: "🥤" },
  { id: "tart", name: "焦糖蛋挞", icon: "🥧" },
];

const NEXT_ORDER_MS = 420;
const RETRY_MS = 700;

export function rollOrder(rand = Math.random, table = payouts("fastfood")) {
  const span = Math.max(0, table.maxItems - table.minItems);
  const n = table.minItems + Math.floor(rand() * (span + 1));
  return Array.from({ length: n }, () => MENU[Math.floor(rand() * MENU.length)]);
}

/** 单笔小费：底价 × 连击加成 × 连胜加成 × 失误折损。纯函数，Node 可断言。 */
export function orderTip({ items, combo = 0, streak = 0, mistakes = 0 }, table = payouts("fastfood")) {
  const base = table.orderBase + Math.max(0, items) * table.perItem;
  const comboMul = 1 + Math.min(Math.max(0, combo) * table.comboBonus, table.comboBonusMax);
  const streakMul = 1 + Math.min(Math.max(0, streak) * table.streakBonus, table.streakBonusMax);
  const keep = Math.max(0, 1 - Math.max(0, mistakes) * table.mistakeTipRatio);
  const gold = Math.max(0, Math.round(base * comboMul * streakMul * keep));
  const xp = table.xpPerOrder + (streak >= table.streakNotice ? table.xpStreakBonus : 0);
  return { gold, xp, comboMul, streakMul, keep };
}

export function orderMs(items, table = payouts("fastfood")) {
  return Math.round((table.orderSeconds + Math.max(0, items) * table.perItemSeconds) * 1000);
}

export function renderFastfood(root, state, back, ctx) {
  ensureStyles();
  const table = payouts("fastfood");
  const view = viewCtx(state, back, ctx);
  const d = createDisposer();

  root.innerHTML = `
    <section class="panel mg-panel">
      ${panelShell("星光快餐 · 出餐台", "按订单顺序出餐。连击抬小费，点错扣小费，连胜再加一层。键盘 1–4 同样能出餐。")}
      <div class="mg-banner calm" data-banner>连胜 ${table.streakNotice} 单开始有额外提成</div>
      ${statBlock([
        { id: "combo", label: "连击", value: "0" },
        { id: "streak", label: "连胜", value: "0" },
        { id: "mul", label: "小费倍率", value: "×1.00" },
        { id: "earned", label: "本班收入", value: "0" },
      ])}
      <div class="mg-bar" data-clock aria-hidden="true"><i></i></div>
      <div class="mg-chip-wrap" data-order></div>
      <div class="mg-fx" data-fx></div>
      <div class="line mg-line" data-line></div>
      <p class="mg-note" data-note></p>
    </section>`;

  const banner = root.querySelector("[data-banner]");
  const clock = root.querySelector("[data-clock]");
  const orderBox = root.querySelector("[data-order]");
  const fx = root.querySelector("[data-fx]");
  const note = root.querySelector("[data-note]");
  const line = root.querySelector("[data-line]");
  root.querySelector("[data-back]").onclick = () => view.back();

  let order = [];
  let filled = 0;
  let combo = 0;
  let bestCombo = 0;
  let streak = 0;
  let mistakes = 0;
  let served = 0;
  let lost = 0;
  let earned = 0;
  let duration = 0;
  let endsAt = 0;

  const buttons = MENU.map((item, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.id = item.id;
    btn.innerHTML = `<span class="key">${i + 1}</span>${item.icon}<div>${item.name}</div>`;
    btn.onclick = () => serve(item.id, btn);
    line.append(btn);
    return btn;
  });

  const setBanner = (text, tone) => {
    banner.className = `mg-banner ${tone}`;
    setText(banner, text);
  };

  function paintHud() {
    const tip = orderTip({ items: order.length || table.minItems, combo, streak, mistakes }, table);
    setStat(root, "combo", combo, combo >= 3 ? "hot" : "");
    setStat(root, "streak", streak, streak >= table.streakNotice ? "hot" : "");
    setStat(root, "mul", `×${(tip.comboMul * tip.streakMul * tip.keep).toFixed(2)}`, mistakes ? "cold" : "");
    setStat(root, "earned", earned);
  }

  function paintNote() {
    const left = Math.max(0, table.mistakeAllowance - mistakes);
    const patience = `${"●".repeat(left)}${"○".repeat(table.mistakeAllowance - left)}`;
    setText(
      note,
      `客人耐心 ${patience} · 每次点错小费 -${Math.round(table.mistakeTipRatio * 100)}%，点满 ${table.mistakeAllowance} 次退单 · 已完成 ${served} 单 / 丢单 ${lost} 单 · 最高连击 ${bestCombo}`,
    );
  }

  function paintOrder() {
    orderBox.innerHTML = "";
    if (!order.length) {
      const chip = document.createElement("span");
      chip.className = "mg-chip";
      chip.textContent = "备餐中…";
      orderBox.append(chip);
      for (const btn of buttons) btn.classList.remove("next");
      return;
    }
    order.forEach((item, idx) => {
      const chip = document.createElement("span");
      chip.className = `mg-chip ${idx < filled ? "done" : ""} ${idx === filled ? "now" : ""}`.trim();
      chip.textContent = `${item.icon} ${item.name}`;
      orderBox.append(chip);
    });
    const need = order[filled];
    for (const btn of buttons) btn.classList.toggle("next", !!need && btn.dataset.id === need.id);
  }

  function startOrder() {
    order = rollOrder(Math.random, table);
    filled = 0;
    mistakes = 0;
    duration = orderMs(order.length, table);
    endsAt = Date.now() + duration;
    paintOrder();
    paintHud();
    paintNote();
  }

  function completeOrder() {
    const tip = orderTip({ items: order.length, combo, streak, mistakes }, table);
    grantReward(state, { gold: tip.gold, xp: tip.xp });
    view.save();
    earned += tip.gold;
    served += 1;
    streak += 1;
    mistakes = 0;
    order = [];
    endsAt = 0;
    setBar(clock, 1, false);
    floatText(fx, `+${tip.gold}`, "gold", d, 50);
    sfx.win();
    if (streak >= table.streakNotice) {
      const next = orderTip({ items: table.maxItems, combo, streak, mistakes: 0 }, table);
      setBanner(`连胜 ${streak} 单！小费 ×${next.streakMul.toFixed(2)}，别断`, "");
      if (streak === table.streakNotice) sfx.rare();
    } else {
      setBanner(`出餐成功 +${tip.gold} · 再连 ${table.streakNotice - streak} 单开提成`, "calm");
    }
    view.toast(`出餐成功 +${tip.gold} 金（连击 ${combo} · 连胜 ${streak}）`);
    paintOrder();
    paintHud();
    paintNote();
    d.timeout(startOrder, NEXT_ORDER_MS);
  }

  function failOrder(reason) {
    const hadStreak = streak;
    order = [];
    endsAt = 0;
    lost += 1;
    streak = 0;
    combo = 0;
    setBar(clock, 0, true);
    shake(orderBox, d);
    sfx.beep?.(140, 0.22, "sawtooth", 0.04);
    setBanner(hadStreak ? `${reason} · ${hadStreak} 连胜断了` : reason, "bad");
    view.toast(reason);
    paintOrder();
    paintHud();
    paintNote();
    d.timeout(startOrder, RETRY_MS);
  }

  function serve(id, btn) {
    if (!order.length) return;
    const need = order[filled];
    if (id === need.id) {
      filled += 1;
      combo += 1;
      bestCombo = Math.max(bestCombo, combo);
      sfx.tap();
      const slot = buttons.findIndex((b) => b.dataset.id === id);
      floatText(fx, `连击 ${combo}`, "good", d, 12 + slot * 25);
      paintOrder();
      paintHud();
      if (filled === order.length) completeOrder();
      return;
    }
    mistakes += 1;
    combo = 0;
    sfx.beep?.(180, 0.08, "sawtooth", 0.03);
    shake(btn, d);
    floatText(fx, `点错 -${Math.round(table.mistakeTipRatio * 100)}%`, "bad", d, 50);
    paintHud();
    paintNote();
    if (mistakes >= table.mistakeAllowance) failOrder("耐心耗尽，客人退单了");
  }

  d.interval(() => {
    if (!endsAt) return;
    const left = endsAt - Date.now();
    if (left <= 0) return failOrder("客人等太久，转身走了");
    setBar(clock, left / duration, left / duration < 0.34);
  }, 100);

  d.on(document, "keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const idx = ["1", "2", "3", "4"].indexOf(e.key);
    if (idx < 0 || idx >= buttons.length) return;
    e.preventDefault();
    serve(MENU[idx].id, buttons[idx]);
  });

  startOrder();
  root._cleanup = () => d.dispose();
  return root._cleanup;
}
