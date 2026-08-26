import { announce, button, el, trapFocus } from "./dom.js";
import { strokeGlyph } from "./components.js";
import { STROKE_KEYS } from "./keycast.js";

export function shouldShowTutorial(save) {
  return !save?.tutorialDone;
}

/**
 * 入世第一课：首次进入战斗时铺开，讲清六种画法与两条施法通路。
 * 弹层打开期间战斗不走时钟，读完再落笔。
 */
export function openTutorial({ mount, store, onClose, markDone = true }) {
  const previousFocus = document.activeElement;
  let closed = false;

  const closeBtn = button({ class: "primary", text: "开卷落笔" });
  const panel = el(
    "div",
    {
      class: "tutorial-panel card",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "tutorial-title",
      "aria-describedby": "tutorial-intro",
    },
    [
      el("p", { class: "sub", text: "入世第一课" }),
      el("h2", { id: "tutorial-title", class: "brand tutorial-title", tabindex: "-1", text: "六种画法" }),
      el("p", {
        id: "tutorial-intro",
        class: "muted",
        text: "在纸上落笔即成符：形准则势强。也可以直接按数字键 1 至 6，或点击纸下的符键条施法。",
      }),
      el(
        "ul",
        { class: "tutorial-grid", "aria-label": "六种画法" },
        STROKE_KEYS.map((s) =>
          el("li", { class: "tutorial-item" }, [
            strokeGlyph(s.type),
            el("div", { class: "tutorial-copy" }, [
              el("strong", {}, [el("kbd", { text: s.key }), ` ${s.name} · ${s.talisman}`]),
              el("span", { class: "muted", text: `${s.effect} · 耗灵气 ${s.qi}` }),
            ]),
          ]),
        ),
      ),
      el("p", { class: "muted tutorial-foot", text: "灵气随时间回涨；圆结护盾、云纹回春，撑住便有反手之机。" }),
      el("div", { class: "actions" }, [closeBtn]),
    ],
  );

  const mask = el("div", { class: "tutorial-mask" }, [panel]);

  function close() {
    if (closed) return;
    closed = true;
    releaseTrap();
    document.removeEventListener("keydown", onKeydown, true);
    mask.remove();
    if (markDone && !store.get().tutorialDone) {
      store.set({ tutorialDone: true });
      store.persist();
    }
    if (previousFocus && typeof previousFocus.focus === "function" && document.contains(previousFocus)) {
      previousFocus.focus();
    }
    onClose?.();
  }

  function onKeydown(ev) {
    if (ev.key === "Escape") {
      ev.preventDefault();
      ev.stopPropagation();
      close();
    }
  }

  closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", onKeydown, true);
  const releaseTrap = trapFocus(mask);
  mount.appendChild(mask);
  closeBtn.focus();
  announce("入世第一课：六种画法。按 Esc 或开卷落笔关闭。");

  return close;
}
