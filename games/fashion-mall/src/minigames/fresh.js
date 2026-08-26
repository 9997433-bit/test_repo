import { grantGold, grantXp, persist } from "../core/state.js";
import { sfx } from "../core/audio.js";

const GOODS = ["🍎", "🥦", "🐟", "🍓", "🧀"];

export function renderFresh(root, state, back) {
  let score = 0;
  let x = 40;
  root.innerHTML = `
    <section class="panel">
      <div class="row"><h2>晨光生鲜 · 进货</h2><button class="btn ghost" id="back">返回</button></div>
      <p>左右移动筐子接住掉下来的货。漏接会砸到口碑。</p>
      <div class="catch" id="stage"><div class="basket" id="basket"></div></div>
      <div class="row"><span>接到 <b id="sc">0</b></span><button class="btn" id="sell">上架结算</button></div>
    </section>`;
  const stage = root.querySelector("#stage");
  const basket = root.querySelector("#basket");
  const sc = root.querySelector("#sc");
  const move = (nx) => {
    x = Math.max(0, Math.min(100, nx));
    basket.style.left = `calc(${x}% - 36px)`;
  };
  move(40);
  stage.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    move(((e.clientX - r.left) / r.width) * 100);
  });
  root.querySelector("#back").onclick = back;
  const spawn = () => {
    const item = document.createElement("div");
    item.className = "item";
    item.textContent = GOODS[Math.floor(Math.random() * GOODS.length)];
    item.style.left = `${10 + Math.random() * 80}%`;
    stage.append(item);
    setTimeout(() => {
      const bx = x;
      const ix = parseFloat(item.style.left);
      if (Math.abs(bx - ix) < 14) {
        score += 1;
        sc.textContent = score;
        sfx.tap();
      }
      item.remove();
    }, 2400);
  };
  const timer = setInterval(spawn, 700);
  spawn();
  root.querySelector("#sell").onclick = () => {
    clearInterval(timer);
    const gold = 18 * score;
    grantGold(state, gold);
    grantXp(state, Math.ceil(score / 3));
    persist(state);
    sfx.coin();
    state.toast = `上架 ${score} 件，+${gold}`;
    back();
  };
  root._cleanup = () => clearInterval(timer);
}
