import { INTRO } from "../data/copy.js";
import { persist } from "../core/state.js";
import { sfx } from "../core/audio.js";
import { OUTFITS } from "../data/balance.js";

export function renderIntro(root, state, onDone) {
  let step = 0;
  const draw = () => {
    if (step === 0) {
      root.innerHTML = `
        <section class="panel">
          <h2>${INTRO.title}</h2>
          <p>${INTRO.lines[0]}</p>
          <div class="hero" style="text-align:center">
            <div style="font-size:64px">🎫</div>
            <p>刮开金属涂层</p>
          </div>
          <button class="btn" id="scratch">刮开</button>
        </section>`;
      root.querySelector("#scratch").onclick = () => {
        sfx.rare();
        step = 1;
        draw();
      };
      return;
    }
    if (step === 1) {
      root.innerHTML = `
        <section class="panel">
          <h2>中奖了</h2>
          ${INTRO.lines.slice(1).map((l) => `<p>${l}</p>`).join("")}
          <label>你的名字
            <input id="name" value="${state.name === "未命名老板" ? "林小姐" : state.name}" maxlength="8" style="width:100%;margin:8px 0;padding:10px;border-radius:12px;border:1px solid #f0d4de" />
          </label>
          <button class="btn" id="next">收下这座城</button>
        </section>`;
      root.querySelector("#next").onclick = () => {
        state.name = root.querySelector("#name").value.trim() || "林小姐";
        step = 2;
        draw();
      };
      return;
    }
    root.innerHTML = `
      <section class="panel">
        <h2>出门见第一位客人前</h2>
        <p>先换一身能撑住场面的衣服。</p>
        <div class="choices" id="looks"></div>
        <button class="btn" id="go">走进快餐店</button>
      </section>`;
    const looks = [
      { hair: 1, top: 1, bottom: 1, shoes: 1, acc: 1, label: "玫瑰通勤" },
      { hair: 2, top: 2, bottom: 2, shoes: 1, acc: 2, label: "香槟女强人" },
    ];
    const box = root.querySelector("#looks");
    looks.forEach((look, i) => {
      const b = document.createElement("button");
      b.textContent = look.label;
      b.onclick = () => {
        state.outfit.hair = OUTFITS.hair[look.hair];
        state.outfit.top = OUTFITS.top[look.top];
        state.outfit.bottom = OUTFITS.bottom[look.bottom];
        state.outfit.shoes = OUTFITS.shoes[look.shoes];
        state.outfit.acc = OUTFITS.acc[look.acc];
        [...box.children].forEach((c) => c.classList.remove("on"));
        b.classList.add("on");
        sfx.tap();
      };
      if (i === 0) b.click();
      box.append(b);
    });
    root.querySelector("#go").onclick = () => {
      state.introDone = true;
      persist(state);
      sfx.win();
      onDone();
    };
  };
  draw();
}
