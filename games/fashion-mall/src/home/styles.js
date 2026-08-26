const STYLE_ID = "fm-mansion-style";

const CSS = `
.fm-home-head { position: relative; overflow: hidden; }
.fm-home-head h2 { margin: 0 0 4px; font-size: 19px; }
.fm-home-head .fm-home-sub { margin: 0; font-size: 12.5px; line-height: 1.6; color: var(--ink-soft); }

.fm-home-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0 8px; }
.fm-home-stat { padding: 9px 6px; border-radius: 15px; text-align: center; background: linear-gradient(180deg, #fff, #fff3f8); box-shadow: 0 6px 14px rgba(199,59,111,.09); }
.fm-home-stat b { display: block; font-size: 15px; font-variant-numeric: tabular-nums; }
.fm-home-stat span { display: block; margin-top: 1px; font-size: 10.5px; color: var(--ink-soft); }
.fm-pop { animation: fmHomePop .65s var(--ease); }
@keyframes fmHomePop { 0% { transform: scale(1) } 32% { transform: scale(1.22); color: var(--rose-deep) } 100% { transform: scale(1) } }

.fm-home-bar { height: 9px; border-radius: 99px; background: #f3dde6; overflow: hidden; }
.fm-home-bar > i { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--rose), var(--gold)); transition: width .55s var(--ease); }
.fm-home-tip { margin: 8px 0 0; font-size: 11.5px; line-height: 1.6; color: var(--ink-soft); }

.fm-room { position: relative; overflow: hidden; }
.fm-room-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.fm-room-dot { width: 10px; height: 10px; border-radius: 50%; flex: 0 0 10px; }
.fm-room-name { font-size: 15px; font-weight: 700; }
.fm-room-tag { flex: 1; font-size: 11px; color: var(--ink-soft); }
.fm-room-badge { padding: 3px 9px; border-radius: 999px; font-size: 10.5px; background: #fff0f5; color: var(--rose-deep); white-space: nowrap; }
.fm-room-badge.done { background: linear-gradient(180deg, var(--gold), var(--gold-deep)); color: #4a3413; }

.fm-room-stage { position: relative; border-radius: 16px; overflow: hidden; box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.7), 0 10px 22px rgba(58,36,51,.12); }
.fm-room-stage svg { display: block; width: 100%; height: auto; }
.fm-room-stage::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(70% 55% at 50% 12%, rgba(255,255,255,.32), transparent 62%), linear-gradient(180deg, transparent 60%, rgba(58,36,51,.1));
}

.fm-bulb { transform-box: fill-box; transform-origin: 50% 50%; animation: fmBulb 2.6s ease-in-out infinite; animation-delay: calc(var(--i) * -.34s); }
@keyframes fmBulb { 0%, 100% { opacity: .6 } 50% { opacity: 1 } }

.fm-slotbox { cursor: pointer; }
.fm-slotbox .fm-ghost-plate { transition: opacity .2s var(--ease); }
.fm-slotbox:hover .fm-ghost-plate { opacity: 1; }
.fm-slotbox:hover .fm-ghost-art { opacity: .34; }
.fm-ghost-art { transition: opacity .2s var(--ease); }

.fm-placed { transform-box: fill-box; transform-origin: 50% 100%; }
.fm-placed.fm-drop { animation: fmDrop .62s cubic-bezier(.3,1.5,.5,1) both; }
@keyframes fmDrop {
  0% { opacity: 0; transform: translateY(-34px) scale(.9) }
  60% { opacity: 1 }
  100% { opacity: 1; transform: none }
}
.fm-puff { transform-box: fill-box; transform-origin: 50% 50%; animation: fmPuff .7s ease-out both; }
@keyframes fmPuff { 0% { opacity: 0; transform: scale(.2) } 30% { opacity: .85 } 100% { opacity: 0; transform: scale(1.9) } }

.fm-shop { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
.fm-item {
  position: relative; display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 14px; text-align: left;
  background: #fff; border: 1.5px solid transparent; box-shadow: 0 6px 14px rgba(58,36,51,.07);
  transition: transform .2s var(--ease), box-shadow .2s var(--ease), border-color .2s;
}
.fm-item:hover { transform: translateY(-2px); box-shadow: 0 12px 20px rgba(58,36,51,.12); }
.fm-item.owned { border-color: var(--gold); background: linear-gradient(180deg, #fffaf0, #fff3e0); }
.fm-item.poor { opacity: .62; }
.fm-item svg { flex: 0 0 34px; width: 34px; height: 34px; }
.fm-item .fm-item-txt { min-width: 0; }
.fm-item b { display: block; font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fm-item small { display: block; font-size: 10.5px; color: var(--ink-soft); }
.fm-item .fm-own-tag { position: absolute; top: 5px; right: 6px; font-size: 10px; color: var(--gold-deep); }

.fm-hint { margin: 8px 0 0; min-height: 16px; font-size: 11.5px; color: var(--rose-deep); }
.fm-hint.shake { animation: fmShake .4s ease; }
@keyframes fmShake { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-5px) } 75% { transform: translateX(5px) } }

.fm-gain { position: absolute; pointer-events: none; font-size: 13px; font-weight: 700; color: #fffaf0; text-shadow: 0 2px 8px rgba(58,36,51,.55); animation: fmGain 1.15s var(--ease) forwards; }
@keyframes fmGain {
  0% { opacity: 0; transform: translate(-50%, 8px) scale(.85) }
  25% { opacity: 1; transform: translate(-50%, 0) scale(1) }
  100% { opacity: 0; transform: translate(-50%, -34px) scale(1) }
}

@media (min-width: 960px) {
  .fm-shop { grid-template-columns: repeat(4, 1fr); }
}

@media (prefers-reduced-motion: reduce) {
  .fm-bulb, .fm-placed.fm-drop, .fm-puff, .fm-gain { animation: none !important; }
}
`;

export function injectMansionStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.textContent = CSS;
  document.head.append(tag);
}
