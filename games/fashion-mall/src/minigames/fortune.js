import { grantGold, grantXp, persist } from "../core/state.js";
import { sfx } from "../core/audio.js";

const SLOTS = ["大吉", "桃花", "偏财", "平稳", "小凶", "奇遇"];

export function renderFortune(root, state, back) {
  let locked = false;
  root.innerHTML = `
    <section class="panel">
      <div class="row"><h2>星语占卜</h2><button class="btn ghost" id="back">返回</button></div>
      <p>转动星盘。全套吉兆可兑换招募碎片。</p>
      <div class="hero" id="wheel" style="text-align:center;font-size:40px">🔮</div>
      <button class="btn" id="spin">启盘</button>
    </section>`;
  root.querySelector("#back").onclick = back;
  root.querySelector("#spin").onclick = () => {
    if (locked) return;
    if (state.gold < 30) return (state.toast = "香火钱不够");
    locked = true;
    state.gold -= 30;
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      root.querySelector("#wheel").textContent = SLOTS[i % SLOTS.length];
      if (i > 14) {
        clearInterval(t);
        const hit = SLOTS[Math.floor(Math.random() * SLOTS.length)];
        root.querySelector("#wheel").textContent = hit;
        const good = ["大吉", "桃花", "偏财", "奇遇"].includes(hit);
        grantGold(state, good ? 90 : 20);
        grantXp(state, 2);
        if (hit === "大吉" || hit === "奇遇") state.shards += 1;
        persist(state);
        sfx.win();
        state.toast = `${hit} · ${good ? "客流上涨" : "今天宜修身"}`;
        locked = false;
      }
    }, 80);
  };
}
