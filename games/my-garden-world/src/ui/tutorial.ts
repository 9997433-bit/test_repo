import { TUTORIAL, currentBeat, type TutorialGoal } from "../data/story";
import type { GameEvent } from "../engine/events";
import type { GameState } from "../engine/state";

const GOAL_EVENT: Record<TutorialGoal, GameEvent["type"]> = {
  plant: "planted",
  water: "watered",
  harvest: "harvest",
  order: "orderDone",
};

/** 当前 goal 步骤应被完成事件推进时返回 true（由 app 在事件总线上调用）。 */
export function tutorialEventAdvances(state: GameState, e: GameEvent): boolean {
  if (state.tutorialDone) return false;
  const beat = currentBeat(state.tutorialStep);
  return Boolean(beat?.goal && GOAL_EVENT[beat.goal] === e.type);
}

export function advanceTutorial(state: GameState): void {
  state.tutorialStep += 1;
  if (state.tutorialStep >= TUTORIAL.length) state.tutorialDone = true;
}

/** 引导横幅需要高亮的 dock 按钮 id。 */
export function coachTargetId(state: GameState): string | null {
  if (state.tutorialDone) return null;
  const beat = currentBeat(state.tutorialStep);
  return beat?.goal ? (beat.allow?.[0] ?? null) : null;
}

export function renderTutorial(host: HTMLElement, state: GameState, onNext: () => void): void {
  host.querySelector(".modal.tutorial")?.remove();
  host.querySelector(".coach")?.remove();
  if (state.tutorialDone) return;
  const beat = currentBeat(state.tutorialStep);
  if (!beat) {
    state.tutorialDone = true;
    return;
  }
  if (beat.goal) {
    const coach = document.createElement("div");
    coach.className = "coach";
    coach.setAttribute("role", "status");
    coach.innerHTML = `<span class="coach-seal" aria-hidden="true">引</span><span class="coach-text">${beat.hint ?? beat.body}</span>`;
    host.append(coach);
    return;
  }
  const box = document.createElement("div");
  box.className = "modal tutorial";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-labelledby", "tutorial-title");
  box.innerHTML = `<div class="modal-card">
    <h2 id="tutorial-title">${beat.title}</h2>
    <p>${beat.body}</p>
    <button type="button" class="cta">${beat.cta}</button>
  </div>`;
  const btn = box.querySelector("button");
  btn?.addEventListener("click", onNext);
  host.append(box);
  btn?.focus();
}
