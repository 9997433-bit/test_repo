const STYLE_ID = "fm-event-style";

/* dialog.modal 的选择器权重高于 main.css 的 .modal，遮罩交给 ::backdrop；
   不支持 showModal 的浏览器走 .fm-ev-fallback，自己画遮罩。 */
const CSS = `
dialog.fm-ev {
  position: fixed; inset: 0; width: 100%; height: 100%; max-width: none; max-height: none;
  margin: 0; padding: 20px; border: 0; background: transparent; color: var(--ink);
  display: grid; place-items: center; overflow: auto;
}
dialog.fm-ev:not([open]) { display: none; }
dialog.fm-ev::backdrop { background: var(--modal-scrim, rgba(58,36,51,.45)); backdrop-filter: blur(2px); }
dialog.fm-ev.fm-ev-fallback { background: var(--modal-scrim, rgba(58,36,51,.45)); z-index: var(--z-modal, 20); }

.fm-ev-sheet {
  position: relative; width: min(380px, 100%); padding: 18px 18px 14px; border-radius: 24px;
  background: linear-gradient(180deg, var(--cream), #fff);
  box-shadow: var(--shadow-4, 0 24px 64px rgba(139,31,74,.22));
  animation: fmEvIn .34s var(--ease) both;
}
@keyframes fmEvIn { from { opacity: 0; transform: translateY(18px) scale(.96) } to { opacity: 1; transform: none } }
.fm-ev-sheet.nudge { animation: fmEvNudge .38s ease; }
@keyframes fmEvNudge { 0%,100% { transform: none } 30% { transform: translateX(-6px) } 65% { transform: translateX(5px) } }

.fm-ev-clock { height: 5px; border-radius: 99px; background: #f0e2e9; overflow: hidden; }
.fm-ev-clock > i { display: block; height: 100%; width: 100%; border-radius: 99px; background: var(--grad-progress); }

.fm-ev-tag { display: inline-block; margin: 12px 0 0; padding: 2px 10px; border-radius: 999px; font-size: 10.5px; letter-spacing: .06em; background: linear-gradient(180deg, #ffe9f1, #ffd7e5); color: var(--rose-deep); }
.fm-ev-sheet h3 { margin: 7px 0 0; font-size: 19px; }
.fm-ev-body { margin: 7px 0 0; font-size: 13px; line-height: 1.65; color: var(--ink-soft); }

.fm-ev-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 11px; }
.fm-ev-chip { padding: 3px 10px; border-radius: 999px; font-size: 11px; font-variant-numeric: tabular-nums; background: #fff; box-shadow: 0 3px 8px rgba(58,36,51,.08); }
.fm-ev-chip.gold { background: linear-gradient(180deg, #fff6e2, #ffe8bf); color: #7a5714; font-weight: 600; }
.fm-ev-chip.xp { background: linear-gradient(180deg, #efe8ff, #ded1ff); color: #5a41a0; font-weight: 600; }

.fm-ev-actions { display: flex; gap: 8px; margin-top: 14px; }
.fm-ev-actions .btn { flex: 1; min-height: 44px; font-size: 13.5px; }
.fm-ev-actions .btn:focus-visible { outline: none; box-shadow: var(--ring-focus); }

.fm-ev-foot { margin: 10px 0 0; font-size: 10.5px; line-height: 1.5; color: var(--ink-soft); text-align: center; }
.fm-ev-foot b { font-variant-numeric: tabular-nums; color: var(--rose-deep); }

@media (prefers-reduced-motion: reduce) {
  .fm-ev-sheet, .fm-ev-sheet.nudge { animation: none; }
}
`;

export function injectEventStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.textContent = CSS;
  document.head.append(tag);
}
