import { INTRO } from "../data/copy.js";
import { A11Y } from "../data/a11y.js";
import { persist } from "../core/state.js";
import { setName, finishIntro } from "../core/actions.js";
import { sfx } from "../core/audio.js";
import { esc } from "./dom.js";
import { OUTFITS } from "../data/balance.js";

const TOTAL_STEPS = 3;

/** 两套开局战袍：只存 OUTFITS 各槽位下标，标签文案在 copy.js#INTRO.looks。 */
const LOOK_PRESETS = [
  { hair: 1, top: 1, bottom: 1, shoes: 1, acc: 1 },
  { hair: 2, top: 2, bottom: 2, shoes: 1, acc: 2 },
];

export function renderIntro(root, state, onDone) {
  let step = 0;

  /** 步进后把焦点交给新一幕的标题，读屏立即播报进度（UX_NARRATIVE §5）。 */
  const focusHeading = () => root.querySelector("h2")?.focus();

  const stepMeta = (n) => `
    <p aria-label="${esc(A11Y.intro.stepOf(n, TOTAL_STEPS))}"
       style="margin:0 0 4px;color:var(--text-soft,#6b4b5c);font-size:12px;letter-spacing:.08em">
      ${esc(INTRO.step(n, TOTAL_STEPS))}
    </p>`;

  const draw = () => {
    if (step === 0) {
      root.innerHTML = `
        <section class="panel">
          ${stepMeta(1)}
          <h2 tabindex="-1">${INTRO.title}</h2>
          <p>${INTRO.lines[0]}</p>
          <div class="hero" style="text-align:center">
            <div style="font-size:64px" aria-hidden="true">🎫</div>
            <p>${INTRO.scratchHint}</p>
          </div>
          <button class="btn" id="scratch">${INTRO.scratchCta}</button>
        </section>`;
      root.querySelector("#scratch").onclick = () => {
        sfx.rare();
        step = 1;
        draw();
        focusHeading();
      };
      return;
    }
    if (step === 1) {
      root.innerHTML = `
        <section class="panel">
          ${stepMeta(2)}
          <h2 tabindex="-1">${INTRO.prizeTitle}</h2>
          ${INTRO.lines.slice(1).map((l) => `<p>${l}</p>`).join("")}
          <label>${INTRO.nameLabel}
            <input id="name"
              value="${esc(state.name === "未命名老板" ? INTRO.defaultName : state.name)}"
              maxlength="12" autocomplete="off" enterkeyhint="done"
              placeholder="${esc(INTRO.namePlaceholder)}"
              aria-label="${esc(A11Y.intro.nameField)}"
              style="width:100%;margin:8px 0;padding:10px;border-radius:12px;border:1px solid #f0d4de" />
          </label>
          <button class="btn" id="next">${INTRO.acceptCta}</button>
        </section>`;
      const input = root.querySelector("#name");
      const commit = () => {
        if (!setName(state, input.value).ok) setName(state, INTRO.defaultName);
        step = 2;
        draw();
        focusHeading();
      };
      root.querySelector("#next").onclick = commit;
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") commit();
      });
      return;
    }
    root.innerHTML = `
      <section class="panel">
        ${stepMeta(3)}
        <h2 tabindex="-1">${INTRO.dressTitle}</h2>
        <p>${INTRO.dressLead}</p>
        <div class="choices" id="looks" role="group" aria-label="${esc(A11Y.intro.lookGroup)}"></div>
        <button class="btn" id="go">${INTRO.goCta}</button>
      </section>`;
    const box = root.querySelector("#looks");
    const buttons = [];
    const wear = (idx, silent = false) => {
      const preset = LOOK_PRESETS[idx];
      for (const slot of Object.keys(preset)) state.outfit[slot] = OUTFITS[slot][preset[slot]];
      buttons.forEach((b, i) => {
        b.classList.toggle("on", i === idx);
        b.setAttribute("aria-pressed", String(i === idx));
      });
      if (!silent) sfx.tap();
    };
    LOOK_PRESETS.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = INTRO.looks[i];
      b.setAttribute("aria-pressed", "false");
      b.onclick = () => wear(i);
      buttons.push(b);
      box.append(b);
    });
    wear(0, true);
    root.querySelector("#go").onclick = () => {
      finishIntro(state);
      persist(state);
      sfx.win();
      onDone();
    };
  };
  draw();
}
