import { ANCHORS, DECORATIONS, anchorName } from "../data/decorations";
import { emit } from "../engine/events";
import type { GameState } from "../engine/state";
import { ANCHOR_SLOTS } from "../scene/decor-art";
import { anchorOccupant, placeAt, unplace } from "../systems/decorate";

const DECOR_MAP = new Map(DECORATIONS.map((d) => [d.id, d]));

export interface PlaceMode {
  /** 进入摆放模式；heldId 为手持陈设（布置栏「摆放/挪动」），null 表示空手调整布局。 */
  enter(heldId: string | null): void;
  exit(): void;
  isOpen(): boolean;
}

function decorName(id: string): string {
  return DECOR_MAP.get(id)?.name ?? id;
}

function decorGlyph(id: string): string {
  return DECOR_MAP.get(id)?.glyph ?? id.slice(0, 1);
}

/**
 * 锚位制摆放模式（docs/UX.md 七）：铺一层可点的锚位标记在舞台上，
 * tap-tap 落座 / 拿起 / 替换，全部可逆、不弹确认。退出即随主循环入档。
 */
export function createPlaceMode(stage: HTMLElement, root: HTMLElement, state: GameState, onChange: () => void): PlaceMode {
  let layer: HTMLElement | null = null;
  let held: string | null = null;
  let lastNudge = 0;

  const live = document.createElement("span");
  live.className = "sr-live";
  live.setAttribute("aria-live", "polite");
  root.append(live);

  const nudge = (text: string): void => {
    // 同文案 3 秒内不重复叨扰
    const t = Date.now();
    if (t - lastNudge < 3000) return;
    lastNudge = t;
    emit({ type: "toast", text, tone: "warn" });
  };

  const paint = (): void => {
    if (!layer) return;
    for (const btn of layer.querySelectorAll<HTMLButtonElement>(".anchor-spot")) {
      const anchorId = btn.dataset.anchor ?? "";
      const occupant = anchorOccupant(state, anchorId);
      btn.classList.toggle("is-empty", !occupant);
      btn.classList.toggle("is-occupied", Boolean(occupant));
      const glyph = btn.querySelector(".anchor-glyph")!;
      const text = occupant ? decorGlyph(occupant) : "";
      if (glyph.textContent !== text) glyph.textContent = text;
      btn.setAttribute(
        "aria-label",
        occupant
          ? `${anchorName(anchorId)}：${decorName(occupant)}，点按${held ? "替换" : "拿起"}`
          : `${anchorName(anchorId)}：空位${held ? "，点按安置" : ""}`,
      );
    }
    const holding = layer.querySelector<HTMLElement>(".place-holding")!;
    const stash = layer.querySelector<HTMLButtonElement>(".place-stash")!;
    holding.textContent = held ? `手持 · ${decorName(held)}` : "空手 · 点已摆的物件可拿起";
    stash.hidden = !held;
  };

  const onAnchorTap = (anchorId: string): void => {
    const occupant = anchorOccupant(state, anchorId);
    if (held) {
      const carried = held;
      const { ok, displaced } = placeAt(state, carried, anchorId);
      if (!ok) return;
      held = null;
      const msg = displaced
        ? `换下${decorName(displaced)}，${decorName(carried)}安在${anchorName(anchorId)}`
        : `${decorName(carried)}安在${anchorName(anchorId)}`;
      emit({ type: "toast", text: msg, tone: "ok" });
      live.textContent = msg;
      onChange();
    } else if (occupant) {
      unplace(state, occupant);
      held = occupant;
      live.textContent = `拿起${decorName(occupant)}`;
      onChange();
    } else {
      nudge("空锚位无物可拿，去「布置」栏手持一件");
    }
    paint();
  };

  const build = (): HTMLElement => {
    const el = document.createElement("div");
    el.className = "place-layer";
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", "摆放模式：点亮的锚位可安置陈设");

    const hint = document.createElement("div");
    hint.className = "place-hint";
    hint.innerHTML = `<span class="place-holding"></span>`;
    const stash = document.createElement("button");
    stash.type = "button";
    stash.className = "place-stash";
    stash.textContent = "回匣";
    stash.setAttribute("aria-label", "把手持的陈设收回匣中");
    stash.addEventListener("click", () => {
      if (!held) return;
      emit({ type: "toast", text: `${decorName(held)}收回匣中`, tone: "ok" });
      held = null;
      paint();
      onChange();
    });
    const done = document.createElement("button");
    done.type = "button";
    done.className = "place-done";
    done.textContent = "完成";
    done.setAttribute("aria-label", "退出摆放模式，布置即刻生效");
    done.addEventListener("click", () => api.exit());
    hint.append(stash, done);
    el.append(hint);

    for (const a of ANCHORS) {
      const slot = ANCHOR_SLOTS[a.id];
      if (!slot) continue;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "anchor-spot";
      btn.dataset.anchor = a.id;
      btn.style.left = `${slot.x}%`;
      btn.style.top = `${slot.y}%`;
      btn.innerHTML = `<span class="anchor-glyph" aria-hidden="true"></span><span class="anchor-name" aria-hidden="true">${a.name}</span>`;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        onAnchorTap(a.id);
      });
      el.append(btn);
    }

    // 点非锚位区域：轻提示，不误触花圃
    el.addEventListener("click", (e) => {
      if (e.target === el) nudge("点亮处才可安置");
    });
    return el;
  };

  const api: PlaceMode = {
    enter(heldId) {
      if (layer) {
        held = heldId ?? held;
        paint();
        return;
      }
      held = heldId;
      layer = build();
      stage.append(layer);
      root.dataset.mode = "place";
      live.textContent = "进入摆放模式";
      paint();
      onChange();
    },
    exit() {
      if (!layer) return;
      if (held) emit({ type: "toast", text: `${decorName(held)}暂回匣中`, tone: "ok" });
      held = null;
      layer.remove();
      layer = null;
      delete root.dataset.mode;
      live.textContent = "布置已保存";
      onChange();
    },
    isOpen() {
      return layer !== null;
    },
  };
  return api;
}
