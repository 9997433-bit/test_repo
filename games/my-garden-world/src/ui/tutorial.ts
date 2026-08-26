import { TUTORIAL, currentBeat, type TutorialGoal } from "../data/story";
import type { GameEvent } from "../engine/events";
import type { GameState } from "../engine/state";

const GOAL_EVENT: Record<TutorialGoal, GameEvent["type"]> = {
  plant: "planted",
  water: "watered",
  harvest: "harvest",
  order: "orderDone",
};

const CN_NUM = ["一", "二", "三", "四", "五", "六", "七", "八", "九"] as const;
function cn(n: number): string {
  return CN_NUM[n - 1] ?? String(n);
}

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

/** goal 折的开场折子只看一次（内存态；刷新后重看无妨）。 */
const introSeen = new Set<string>();

/** 仅最后一折（纯剧情尾声）允许按 Esc 收起教程；goal 折不可跳过。 */
let escBound = false;
let escTarget: { state: GameState; onNext: () => void } | null = null;

function bindEsc(state: GameState, onNext: () => void): void {
  escTarget = { state, onNext };
  if (escBound) return;
  escBound = true;
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !escTarget) return;
    const { state: s, onNext: next } = escTarget;
    if (s.tutorialDone || s.tutorialStep !== TUTORIAL.length - 1) return;
    if (currentBeat(s.tutorialStep)?.goal) return;
    escTarget = null;
    next();
  });
}

export function renderTutorial(host: HTMLElement, state: GameState, onNext: () => void): void {
  host.querySelector(".modal.tutorial")?.remove();
  host.querySelector(".coach")?.remove();
  if (state.tutorialDone) {
    escTarget = null;
    return;
  }
  const beat = currentBeat(state.tutorialStep);
  if (!beat) {
    state.tutorialDone = true;
    escTarget = null;
    return;
  }
  bindEsc(state, onNext);
  const stepLabel = `第${cn(state.tutorialStep + 1)}折 · 共${cn(TUTORIAL.length)}折`;
  const isLast = state.tutorialStep === TUTORIAL.length - 1;

  if (beat.goal && introSeen.has(beat.id)) {
    const coach = document.createElement("div");
    coach.className = "coach";
    coach.setAttribute("role", "status");
    coach.innerHTML = `<span class="coach-seal" aria-hidden="true">引</span><span class="coach-text">${beat.hint ?? beat.objective ?? beat.body}</span>`;
    host.append(coach);
    return;
  }

  const box = document.createElement("div");
  box.className = "modal tutorial";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-labelledby", "tutorial-title");
  box.innerHTML = `<div class="modal-card">
    <div class="muted step-label">${stepLabel}</div>
    <h2 id="tutorial-title">${beat.title}</h2>
    ${beat.objective ? `<p class="objective">◌ 目标 · ${beat.objective}</p>` : ""}
    <p>${beat.body}</p>
    <button type="button" class="cta">${beat.cta}</button>
    ${isLast ? `<div class="muted esc-hint">按 Esc 键亦可收起</div>` : ""}
  </div>`;
  const btn = box.querySelector("button");
  btn?.addEventListener("click", () => {
    if (beat.goal) {
      introSeen.add(beat.id);
      renderTutorial(host, state, onNext);
    } else {
      onNext();
    }
  });
  host.append(box);
  btn?.focus();
}
