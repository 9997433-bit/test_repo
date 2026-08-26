const STYLE_ID = "fm-wardrobe-style";

const CSS = `
.fm-look { position: relative; overflow: hidden; }
.fm-look::before {
  content: ""; position: absolute; left: -20%; right: -20%; top: -120px; height: 260px;
  background: radial-gradient(50% 55% at 50% 100%, rgba(255,205,226,.75), rgba(255,205,226,0) 72%);
  pointer-events: none;
}
.fm-look > * { position: relative; }

.fm-look-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.fm-look-head h2 { margin: 0 0 4px; font-size: 19px; }
.fm-sub { margin: 0; font-size: 12.5px; line-height: 1.6; color: var(--ink-soft); }
.fm-title { font-weight: 700; color: var(--rose-deep); }

.fm-ring { position: relative; flex: 0 0 78px; width: 78px; height: 78px; }
.fm-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.fm-ring-bg { fill: none; stroke: #f7dfe8; stroke-width: 8; }
.fm-ring-fg { fill: none; stroke-width: 8; stroke-linecap: round; transition: stroke-dashoffset .55s var(--ease); }
.fm-ring-txt { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; line-height: 1.1; }
.fm-ring-txt b { font-size: 21px; font-variant-numeric: tabular-nums; }
.fm-ring-txt span { font-size: 10px; color: var(--ink-soft); letter-spacing: .06em; }

.fm-stage { position: relative; width: 100%; max-width: 250px; margin: 4px auto 0; aspect-ratio: 200 / 320; }
.fm-doll { display: block; width: 100%; height: 100%; overflow: visible; }
.fm-scene { transform-box: fill-box; transform-origin: 50% 100%; animation: fmBreathe 5s ease-in-out infinite; }
@keyframes fmBreathe { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-2.5px) } }
.fm-dust { transform-box: fill-box; transform-origin: 50% 50%; animation: fmDust 5.5s ease-in-out infinite; animation-delay: calc(var(--i) * -0.85s); }
@keyframes fmDust { 0%, 100% { opacity: .25; transform: translateY(4px) scale(.7) } 50% { opacity: .95; transform: translateY(-6px) scale(1.15) } }

.fm-piece { transform-box: fill-box; transform-origin: 50% 55%; }
.fm-piece.fm-in { animation: fmPieceIn .5s var(--ease) both; animation-delay: var(--delay, 0s); }
.fm-piece.fm-out { animation: fmPieceOut .34s ease-in both; pointer-events: none; }
@keyframes fmPieceIn {
  0% { opacity: 0; transform: translateY(var(--dy, -14px)) scale(.86) rotate(-3deg); }
  55% { opacity: 1; }
  100% { opacity: 1; transform: none; }
}
@keyframes fmPieceOut {
  0% { opacity: 1; }
  100% { opacity: 0; transform: translateY(calc(var(--dy, -14px) * -.55)) scale(1.1); }
}

.fm-shine { position: absolute; inset: 0; pointer-events: none; opacity: 0; border-radius: 22px; overflow: hidden; }
.fm-shine::after {
  content: ""; position: absolute; inset: -20% -60%;
  background: linear-gradient(102deg, transparent 40%, rgba(255,255,255,.9) 50%, transparent 60%);
}
.fm-shine.run { animation: fmShineHost .8s linear; }
.fm-shine.run::after { animation: fmShineSweep .8s ease-out; }
@keyframes fmShineHost { 0%, 100% { opacity: 0 } 18%, 72% { opacity: 1 } }
@keyframes fmShineSweep { 0% { transform: translateX(-55%) } 100% { transform: translateX(55%) } }

.fm-sparks { position: absolute; inset: 0; pointer-events: none; }
.fm-spark {
  position: absolute; width: 15px; height: 15px; margin: -7.5px 0 0 -7.5px; background: #ffd9ea;
  clip-path: polygon(50% 0%, 57% 43%, 100% 50%, 57% 57%, 50% 100%, 43% 57%, 0% 50%, 43% 43%);
  animation: fmSpark .85s var(--ease) forwards;
}
@keyframes fmSpark {
  0% { opacity: 0; transform: scale(.15) rotate(0) }
  35% { opacity: 1; transform: scale(1.15) rotate(70deg) }
  100% { opacity: 0; transform: scale(.35) translateY(-30px) rotate(150deg) }
}

.fm-float {
  position: absolute; left: 50%; top: 14%; white-space: nowrap; pointer-events: none;
  font-size: 14px; font-weight: 700; color: var(--rose-deep); text-shadow: 0 2px 8px rgba(255,255,255,.95);
  animation: fmFloat 1.1s var(--ease) forwards;
}
.fm-float.down { color: #b8446a; }
@keyframes fmFloat {
  0% { opacity: 0; transform: translate(-50%, 12px) scale(.8) }
  25% { opacity: 1; transform: translate(-50%, 0) scale(1) }
  100% { opacity: 0; transform: translate(-50%, -36px) scale(1) }
}

.fm-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0 2px; }
.fm-stat { padding: 9px 6px; border-radius: 15px; text-align: center; background: linear-gradient(180deg, #fff, #fff3f8); box-shadow: 0 6px 14px rgba(199,59,111,.09); }
.fm-stat b { display: block; font-size: 15px; font-variant-numeric: tabular-nums; }
.fm-stat span { display: block; margin-top: 1px; font-size: 10.5px; color: var(--ink-soft); }
.fm-bump { animation: fmBump .65s var(--ease); }
@keyframes fmBump { 0% { transform: scale(1) } 32% { transform: scale(1.22); color: var(--rose-deep) } 100% { transform: scale(1) } }

.fm-note { margin: 10px 0 0; font-size: 11.5px; line-height: 1.6; color: var(--ink-soft); }

.fm-presets { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.fm-preset { padding: 7px 12px; border-radius: 999px; font-size: 12px; color: var(--ink-soft); background: #fff; border: 1px solid #f2d6e0; transition: transform .2s var(--ease); }
.fm-preset:hover { transform: translateY(-2px); }
.fm-preset.on { background: linear-gradient(180deg, var(--rose), var(--rose-deep)); color: #fff; border-color: transparent; }

.fm-slot { margin-top: 14px; }
.fm-slot-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
.fm-slot-name { font-size: 13.5px; font-weight: 700; }
.fm-slot-cur { font-size: 11.5px; color: var(--ink-soft); }
.fm-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.fm-card {
  position: relative; padding: 6px 6px 9px; border-radius: 16px; background: #fff; border: 1.5px solid transparent;
  box-shadow: 0 6px 14px rgba(58,36,51,.07); transition: transform .22s var(--ease), box-shadow .22s var(--ease), border-color .2s;
}
.fm-card:hover { transform: translateY(-3px); box-shadow: 0 12px 22px rgba(58,36,51,.12); }
.fm-card.on { border-color: var(--rose); background: linear-gradient(180deg, #fff, #ffeaf2); box-shadow: 0 12px 24px rgba(232,90,140,.24); }
.fm-card.on::after {
  content: "✓"; position: absolute; top: 5px; right: 6px; width: 17px; height: 17px; border-radius: 50%;
  background: var(--rose); color: #fff; font-size: 11px; line-height: 17px; text-align: center;
}
.fm-thumb { display: block; width: 100%; height: 60px; }
.fm-card-name { display: block; font-size: 11px; color: var(--ink); }
.fm-card-charm { display: block; margin-top: 1px; font-size: 10.5px; font-weight: 700; color: var(--rose-deep); }
.fm-delta { position: absolute; top: 5px; left: 6px; padding: 1px 5px; border-radius: 999px; font-size: 9.5px; background: #e6f7ef; color: #2c7f60; }
.fm-delta.down { background: #fdecf1; color: #b8446a; }

.pill.fm-bump { display: inline-block; }

@media (min-width: 960px) {
  .fm-look { display: grid; grid-template-columns: 320px minmax(0, 1fr); column-gap: 22px; align-items: start; }
  .fm-look-head { grid-column: 1 / -1; }
  .fm-stage { grid-column: 1; max-width: 320px; margin-top: 0; }
  .fm-controls { grid-column: 2; }
  .fm-stats { margin-top: 0; }
  .fm-cards { grid-template-columns: repeat(3, minmax(0, 152px)); }
}

@media (prefers-reduced-motion: reduce) {
  .fm-scene, .fm-dust, .fm-shine, .fm-spark { animation: none !important; }
  .fm-piece.fm-in, .fm-piece.fm-out { animation-duration: .01s !important; }
}
`;

export function injectWardrobeStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.textContent = CSS;
  document.head.append(tag);
}
