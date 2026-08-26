import { grantGold, grantXp, persist } from "../core/state.js";
import { sfx } from "../core/audio.js";

const POOL = [
  { name: "普通亚克力立牌", w: 55, gold: 20, shard: 0 },
  { name: "稀有闪卡", w: 30, gold: 80, shard: 1 },
  { name: "隐藏款手办", w: 12, gold: 260, shard: 2 },
  { name: "城主签名隐藏", w: 3, gold: 800, shard: 5 },
];

function roll() {
  const t = Math.random() * 100;
  let a = 0;
  for (const p of POOL) {
    a += p.w;
    if (t <= a) return p;
  }
  return POOL[0];
}

export function renderBlindbox(root, state, back) {
  root.innerHTML = `
    <section class="panel">
      <div class="row"><h2>盲盒潮玩</h2><button class="btn ghost" id="back">返回</button></div>
      <p>花 60 开一盒。隐藏款会掉招募碎片。</p>
      <div class="hero" id="box" style="text-align:center;font-size:72px">🎁</div>
      <button class="btn gold" id="open">拆盒</button>
    </section>`;
  root.querySelector("#back").onclick = back;
  root.querySelector("#open").onclick = () => {
    if (state.gold < 60) return (state.toast = "先去赚一盒的钱");
    state.gold -= 60;
    const got = roll();
    grantGold(state, got.gold);
    grantXp(state, 1);
    state.shards += got.shard;
    persist(state);
    root.querySelector("#box").textContent = got.name.includes("隐藏") ? "✨" : "🎀";
    state.toast = `${got.name} · 金币+${got.gold}${got.shard ? ` 碎片+${got.shard}` : ""}`;
    got.shard >= 2 ? sfx.rare() : sfx.coin();
  };
}
