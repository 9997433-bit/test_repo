import { TUTORIAL } from "../data/story";
import type { GameState } from "../engine/state";

export function renderTutorial(host: HTMLElement, state: GameState, onNext: () => void): void {
  host.querySelector(".modal")?.remove();
  if (state.tutorialDone) return;
  const beat = TUTORIAL[state.tutorialStep];
  if (!beat) {
    state.tutorialDone = true;
    return;
  }
  const box = document.createElement("div");
  box.className = "modal";
  box.innerHTML = `<h2 style="font-family:var(--font-display);margin:0">${beat.title}</h2>
    <p>${beat.body}</p>
    <button type="button">${beat.cta}</button>`;
  box.querySelector("button")?.addEventListener("click", onNext);
  host.append(box);
}

export function advanceTutorial(state: GameState): void {
  state.tutorialStep += 1;
  if (state.tutorialStep >= TUTORIAL.length) state.tutorialDone = true;
}
