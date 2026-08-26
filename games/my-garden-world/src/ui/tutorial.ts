import { TUTORIAL, type StoryBeat, type TutorialGate } from "../data/story";
import type { GameState } from "../engine/state";

/**
 * 教程门槛判定：只读 GameState，不做任何改动。
 * 玩家真正完成对应操作前，本折的「继续」按钮保持置灰。
 */
const GATE_CHECKS: Record<TutorialGate, (state: GameState) => boolean> = {
  sow: (s) => s.stats.planted >= 1,
  // 浇水计数在长到下一阶段或收获时会被清零，而没有水花长不动：
  // 有过收获、圃里有水、或任一株已长过播种期，都视作浇过水
  water: (s) =>
    s.stats.harvested >= 1 ||
    s.plots.some((p) => p.watered > 0 || (p.flowerId !== null && p.stage !== "empty" && p.stage !== "seeded")),
  harvest: (s) => s.stats.harvested >= 1,
  order: (s) => s.stats.ordersDone >= 1,
};

export function isGateMet(state: GameState, beat: StoryBeat): boolean {
  return !beat.gate || GATE_CHECKS[beat.gate](state);
}

const CN_NUM = ["一", "二", "三", "四", "五", "六", "七", "八", "九"] as const;

function cn(n: number): string {
  return CN_NUM[n - 1] ?? String(n);
}

/** 门槛未达成时的轮询间隔：外层可能只在换折时才重绘教程，需自行感知进度 */
const POLL_MS = 250;

let pollTimer: ReturnType<typeof setInterval> | null = null;

function stopPoll(): void {
  if (pollTimer !== null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function startPoll(box: HTMLElement, state: GameState, beat: StoryBeat): void {
  stopPoll();
  if (!beat.gate) return;
  pollTimer = setInterval(() => {
    if (!box.isConnected || state.tutorialDone) {
      stopPoll();
      return;
    }
    syncGate(box, state, beat);
  }, POLL_MS);
}

/** 只更新与门槛相关的文案与按钮态，不重建 DOM，点击才不会落空 */
function syncGate(box: HTMLElement, state: GameState, beat: StoryBeat): void {
  // 门槛一旦点亮便锁存，不因后续状态变化（如生长清零浇水计数）而回退
  const ready = box.dataset.ready === "1" || isGateMet(state, beat);
  const flag = ready ? "1" : "0";
  if (box.dataset.ready === flag) return;
  box.dataset.ready = flag;
  const btn = box.querySelector("button");
  if (btn) {
    btn.disabled = !ready;
    btn.textContent = ready ? beat.cta : (beat.waitCta ?? beat.cta);
    btn.style.opacity = ready ? "" : "0.55";
    btn.style.cursor = ready ? "" : "default";
  }
  const goal = box.querySelector<HTMLElement>("[data-goal]");
  if (goal && beat.goal) {
    goal.textContent = `${ready ? "✓ 已成" : "◌ 目标"} · ${beat.goal}`;
    goal.style.color = ready ? "var(--jade)" : "";
  }
}

interface EscTarget {
  state: GameState;
  onNext: () => void;
}

let escTarget: EscTarget | null = null;
let escBound = false;

/** 仅最后一折允许按 Esc 收起，前面的门槛折不可跳过 */
function onEscKey(e: KeyboardEvent): void {
  if (e.key !== "Escape" || !escTarget) return;
  const { state, onNext } = escTarget;
  if (state.tutorialDone || state.tutorialStep !== TUTORIAL.length - 1) return;
  const beat = TUTORIAL[state.tutorialStep];
  if (!beat || !isGateMet(state, beat)) return;
  escTarget = null;
  stopPoll();
  onNext();
}

function bindEsc(target: EscTarget): void {
  escTarget = target;
  if (escBound) return;
  escBound = true;
  document.addEventListener("keydown", onEscKey);
}

function buildModal(state: GameState, beat: StoryBeat, onNext: () => void): HTMLElement {
  const box = document.createElement("div");
  box.className = "modal";
  box.dataset.tutorial = "1";
  box.dataset.beat = beat.id;
  const gated = Boolean(beat.gate);
  const isLast = state.tutorialStep === TUTORIAL.length - 1;

  if (gated) {
    // 门槛折收成顶部横幅，让出整座花园供玩家操作
    Object.assign(box.style, {
      inset: "auto",
      top: "calc(env(safe-area-inset-top, 0px) + 52px)",
      left: "50%",
      transform: "translateX(-50%)",
      width: "min(92vw, 520px)",
      maxHeight: "42vh",
      overflowY: "auto",
      zIndex: "4",
    });
  }

  box.innerHTML = `
    <div class="muted" style="font-size:12px;letter-spacing:.14em">第${cn(state.tutorialStep + 1)}折 · 共${cn(TUTORIAL.length)}折</div>
    <h2 style="font-family:var(--font-display);margin:0;font-size:${gated ? "20px" : "26px"}">${beat.title}</h2>
    ${beat.goal ? `<p data-goal style="margin:0;font-weight:700"></p>` : ""}
    <p style="margin:0;line-height:1.7">${beat.body}</p>
    <button type="button" style="justify-self:start"></button>
    ${isLast ? `<div class="muted" style="font-size:12px">按 Esc 键亦可收起</div>` : ""}
  `;
  box.querySelector("button")?.addEventListener("click", () => {
    if (box.dataset.ready !== "1" && !isGateMet(state, beat)) return;
    stopPoll();
    onNext();
  });
  return box;
}

export function renderTutorial(host: HTMLElement, state: GameState, onNext: () => void): void {
  const existing = host.querySelector<HTMLElement>('.modal[data-tutorial="1"]');

  if (state.tutorialDone) {
    stopPoll();
    escTarget = null;
    existing?.remove();
    return;
  }
  const beat = TUTORIAL[state.tutorialStep];
  if (!beat) {
    state.tutorialDone = true;
    stopPoll();
    escTarget = null;
    existing?.remove();
    return;
  }

  bindEsc({ state, onNext });

  // 外层每帧重绘时保住既有 DOM，仅同步门槛状态
  if (existing && existing.dataset.beat === beat.id) {
    syncGate(existing, state, beat);
    return;
  }

  existing?.remove();
  const box = buildModal(state, beat, onNext);
  host.append(box);
  syncGate(box, state, beat);
  startPoll(box, state, beat);
}

export function advanceTutorial(state: GameState): void {
  state.tutorialStep += 1;
  if (state.tutorialStep >= TUTORIAL.length) state.tutorialDone = true;
}
