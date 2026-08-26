import { FASHION_CLIENTS } from "../data/copy.js";
import { grantGold, grantXp, persist } from "../core/state.js";
import { sfx } from "../core/audio.js";

const LOOKS = [
  { name: "玫瑰西装套装", tags: ["西装", "利落", "中性"] },
  { name: "甜酷短裙闪片", tags: ["甜酷", "短裙", "闪"] },
  { name: "香槟高定礼服", tags: ["礼服", "香槟", "高定"] },
  { name: "森系针织长裙", tags: ["森系", "针织", "温柔"] },
];

export function renderBoutique(root, state, back) {
  const client = FASHION_CLIENTS[Math.floor(Math.random() * FASHION_CLIENTS.length)];
  root.innerHTML = `
    <section class="panel">
      <div class="row"><h2>缪斯服装 · 形象改造</h2><button class="btn ghost" id="back">返回</button></div>
      <p>顾客想要「${client.need}」。${client.hint}</p>
      <p>先勾风格，再提交成衣。</p>
      <div class="choices" id="tags"></div>
      <div class="choices" id="looks" style="margin-top:12px"></div>
      <button class="btn" id="ok">提交搭配</button>
    </section>`;
  root.querySelector("#back").onclick = back;
  const picked = new Set();
  for (const tag of ["西装", "甜酷", "礼服", "闪", "香槟", "利落", "高定", "短裙", "中性", "森系"]) {
    const b = document.createElement("button");
    b.textContent = tag;
    b.onclick = () => {
      picked.has(tag) ? picked.delete(tag) : picked.add(tag);
      b.classList.toggle("on");
    };
    root.querySelector("#tags").append(b);
  }
  let look = LOOKS[0];
  LOOKS.forEach((l, i) => {
    const b = document.createElement("button");
    b.textContent = l.name;
    if (i === 0) b.classList.add("on");
    b.onclick = () => {
      look = l;
      [...root.querySelector("#looks").children].forEach((c) => c.classList.remove("on"));
      b.classList.add("on");
    };
    root.querySelector("#looks").append(b);
  });
  root.querySelector("#ok").onclick = () => {
    const tagHit = client.tags.filter((t) => picked.has(t)).length;
    const lookHit = look.tags.filter((t) => client.tags.includes(t)).length;
    const score = tagHit + lookHit;
    const gold = 40 + score * 35;
    grantGold(state, gold);
    grantXp(state, 3 + score);
    persist(state);
    sfx.win();
    state.toast = score >= 3 ? `完美改造 +${gold}` : `勉强过关 +${gold}`;
    back();
  };
}
