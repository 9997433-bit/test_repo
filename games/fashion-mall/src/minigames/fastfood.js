import { grantGold, grantXp, persist } from "../core/state.js";
import { sfx } from "../core/audio.js";

const MENU = [
  { id: "burger", name: "星光堡", icon: "🍔" },
  { id: "fries", name: "金黄薯条", icon: "🍟" },
  { id: "drink", name: "蜜桃气泡", icon: "🥤" },
  { id: "tart", name: "焦糖蛋挞", icon: "🥧" },
];

function rollOrder() {
  const n = 2 + Math.floor(Math.random() * 3);
  return Array.from({ length: n }, () => MENU[Math.floor(Math.random() * MENU.length)]);
}

export function renderFastfood(root, state, back) {
  let order = rollOrder();
  let done = [];
  const draw = () => {
    root.innerHTML = `
      <section class="panel">
        <div class="row"><h2>星光快餐</h2><button class="btn ghost" id="back">返回商场</button></div>
        <p>按订单点击出餐。连击越稳，小费越高。</p>
        <div class="order">${order.map((i, idx) => `<span class="chip ${done[idx] ? "done" : ""}">${i.icon} ${i.name}</span>`).join("")}</div>
        <div class="line">${MENU.map((m) => `<button data-id="${m.id}">${m.icon}<div>${m.name}</div></button>`).join("")}</div>
      </section>`;
    root.querySelector("#back").onclick = back;
    root.querySelectorAll(".line button").forEach((btn) => {
      btn.onclick = () => {
        const need = order[done.length];
        if (btn.dataset.id === need.id) {
          done.push(true);
          sfx.tap();
          if (done.length === order.length) {
            const tip = 28 + done.length * 12;
            grantGold(state, tip);
            grantXp(state, 2);
            persist(state);
            sfx.win();
            state.toast = `出餐成功 +${tip}`;
            order = rollOrder();
            done = [];
          }
          draw();
        } else {
          sfx.beep?.(180, 0.08, "sawtooth", 0.03);
          state.toast = "不是这份，客人皱眉了";
        }
      };
    });
  };
  draw();
}
