const STYLE_ID = "garden-plot-theme";

/**
 * 花圃的进阶样式。写在场景层而非 `src/styles/**`，是为了让花圃外观与
 * `garden-view` 的 DOM 结构同进同退：改结构时不会漏改样式。
 */
const PLOT_CSS = `
.garden .plot {
  appearance: none;
  -webkit-appearance: none;
  border: 0;
  padding: 0;
  overflow: hidden;
  isolation: isolate;
  --bloom: #cbb79a;
  --accent: #8a7350;
  --leaf: #7fae72;
  --tilt: 0deg;
  --phase: 0s;
  --damp: 0;
  --stem: 0%;
  --open: 0;
  --spread: 1;
  --reach: 0%;
  --leaf-op: 0;
}
.garden .plot.is-selected { outline-offset: 2px; }

.plot-soil {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  overflow: hidden;
  z-index: 0;
}
.plot-soil::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(130% 70% at 50% 118%, rgba(0, 0, 0, 0.5), transparent 62%),
    repeating-linear-gradient(94deg, rgba(255, 255, 255, 0.05) 0 2px, transparent 2px 9px);
}
.plot-damp {
  position: absolute;
  inset: 34% 0 0;
  opacity: var(--damp);
  background: linear-gradient(180deg, rgba(24, 44, 52, 0) 0%, rgba(22, 46, 56, 0.72) 100%);
  transition: opacity 0.4s ease;
}
.plot-crack {
  position: absolute;
  inset: 0;
  opacity: 0;
  background:
    linear-gradient(72deg, transparent 47.4%, rgba(30, 18, 8, 0.55) 47.4% 48.4%, transparent 48.4%),
    linear-gradient(-58deg, transparent 61%, rgba(30, 18, 8, 0.45) 61% 61.9%, transparent 61.9%),
    linear-gradient(16deg, transparent 33%, rgba(30, 18, 8, 0.35) 33% 33.7%, transparent 33.7%);
  transition: opacity 0.5s ease;
}
.garden .plot[data-thirsty="1"] .plot-soil { filter: brightness(1.14) saturate(0.82); }
.garden .plot[data-stage="wilt"] .plot-crack { opacity: 1; }

.plot-glow {
  position: absolute;
  inset: -12%;
  z-index: 1;
  opacity: 0;
  pointer-events: none;
  background: radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--bloom) 68%, transparent) 0%, transparent 62%);
  transition: opacity 0.45s ease;
}
.garden .plot[data-stage="bloom"] .plot-glow { animation: plot-glow 3.2s ease-in-out infinite; }
@keyframes plot-glow { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

.plot-plant {
  position: absolute;
  left: 0;
  right: 0;
  top: 12%;
  bottom: 34%;
  z-index: 2;
  transform-origin: 50% 100%;
  pointer-events: none;
}
.garden .plot[data-stage="sprout"] .plot-plant,
.garden .plot[data-stage="bud"] .plot-plant,
.garden .plot[data-stage="bloom"] .plot-plant {
  animation: plot-sway 5.4s ease-in-out infinite;
  animation-delay: calc(var(--phase) * -1);
}
@keyframes plot-sway { 0%, 100% { transform: rotate(-2.6deg); } 50% { transform: rotate(2.6deg); } }

.plot-stem {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 4px;
  margin-left: -2px;
  height: var(--stem);
  border-radius: 4px 4px 1px 1px;
  transform-origin: 50% 100%;
  background: linear-gradient(180deg, color-mix(in srgb, var(--leaf) 72%, #fff) 0%, var(--leaf) 52%, #35603a 100%);
  transition: height 0.4s ease;
}
.plot-leaf {
  position: absolute;
  bottom: calc(var(--stem) * 0.3);
  width: 25%;
  height: 11%;
  opacity: var(--leaf-op);
  background: linear-gradient(100deg, color-mix(in srgb, var(--leaf) 62%, #fff), var(--leaf));
  box-shadow: inset 0 -1px 2px rgba(0, 0, 0, 0.18);
  transition: opacity 0.4s ease, bottom 0.4s ease;
}
.plot-leaf.is-left {
  right: 50%;
  transform-origin: 100% 100%;
  transform: rotate(-17deg);
  border-radius: 100% 0 100% 0;
}
.plot-leaf.is-right {
  left: 50%;
  transform-origin: 0 100%;
  transform: rotate(17deg);
  border-radius: 0 100% 0 100%;
}

.plot-seed {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 15%;
  aspect-ratio: 1.3;
  margin-left: -7.5%;
  opacity: 0;
  border-radius: 52% 52% 44% 44%;
  background: radial-gradient(circle at 34% 28%, #b0854f, #4f3519);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.3);
  transition: opacity 0.3s ease;
}
.garden .plot[data-stage="seeded"] .plot-seed { opacity: 1; }

.plot-blossom {
  position: absolute;
  left: 50%;
  bottom: var(--stem);
  width: 66%;
  aspect-ratio: 1;
  transform-origin: 50% 50%;
  transform: translate(-50%, 50%) rotate(var(--tilt)) scale(var(--open));
  filter: drop-shadow(0 3px 3px rgba(0, 0, 0, 0.3));
  transition: transform 0.45s cubic-bezier(0.22, 1.1, 0.36, 1);
}
.plot-petal {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 38%;
  height: 50%;
  margin: -50% 0 0 -19%;
  transform-origin: 50% 100%;
  transform: rotate(calc(var(--a) * var(--spread))) translateY(var(--reach)) scale(var(--petal-scale, 1));
  border-radius: 52% 52% 42% 42% / 70% 70% 30% 30%;
  background:
    radial-gradient(110% 70% at 50% 100%, color-mix(in srgb, var(--accent) 58%, transparent) 0%, transparent 64%),
    linear-gradient(180deg, color-mix(in srgb, var(--bloom) 68%, #fff) 0%, var(--bloom) 58%, color-mix(in srgb, var(--bloom) 58%, var(--accent)) 100%);
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--accent) 30%, transparent),
    0 1px 2px rgba(0, 0, 0, 0.16);
  transition: transform 0.45s cubic-bezier(0.22, 1.1, 0.36, 1), border-radius 0.4s ease;
}
.plot-core {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 25%;
  height: 25%;
  margin: -12.5% 0 0 -12.5%;
  border-radius: 50%;
  background: radial-gradient(circle at 38% 32%, #fffdf0 0%, #ffdf8b 46%, color-mix(in srgb, var(--accent) 58%, #cf9a2c) 100%);
  box-shadow:
    0 0 8px color-mix(in srgb, var(--accent) 42%, transparent),
    inset 0 -1px 2px rgba(120, 82, 12, 0.35);
}
.plot-calyx {
  position: absolute;
  left: 50%;
  top: 62%;
  width: 34%;
  height: 26%;
  margin-left: -17%;
  opacity: 0;
  border-radius: 0 0 60% 60% / 0 0 100% 100%;
  background: linear-gradient(180deg, color-mix(in srgb, var(--leaf) 78%, #fff), var(--leaf));
  transition: opacity 0.35s ease;
}
.garden .plot[data-stage="bud"] .plot-calyx { opacity: 1; }

.garden .plot[data-stage="seeded"] { --stem: 0%; --open: 0; --leaf-op: 0; }
.garden .plot[data-stage="sprout"] { --stem: 24%; --open: 0; --leaf-op: 1; }
.garden .plot[data-stage="bud"] { --stem: 44%; --open: 0.5; --spread: 0.16; --reach: 0%; --leaf-op: 1; }
.garden .plot[data-stage="bloom"] { --stem: 56%; --open: 1; --spread: 1; --reach: -14%; --leaf-op: 1; }
.garden .plot[data-stage="wilt"] { --stem: 40%; --open: 0.78; --spread: 0.94; --reach: 4%; --leaf-op: 1; --petal-scale: 0.84; }

.garden .plot[data-stage="wilt"] .plot-plant {
  filter: grayscale(0.3) sepia(0.85) brightness(0.86) contrast(1.05);
  transform: rotate(9deg) translateY(6%);
  animation: none;
}
.garden .plot[data-stage="wilt"] .plot-stem { transform: rotate(7deg); }
.garden .plot[data-stage="wilt"] .plot-leaf { opacity: 0.55; transform: rotate(0deg) scaleY(0.7); }
.garden .plot[data-stage="wilt"] .plot-petal {
  border-radius: 44% 44% 66% 66% / 52% 52% 48% 48%;
  opacity: 0.82;
}
.garden .plot[data-stage="wilt"] .plot-core { filter: brightness(0.66) saturate(0.5); }

.plot.is-fresh .plot-blossom { animation: plot-pop 760ms cubic-bezier(0.22, 1.3, 0.36, 1); }
@keyframes plot-pop {
  0% { transform: translate(-50%, 50%) rotate(var(--tilt)) scale(0.16); }
  55% { transform: translate(-50%, 50%) rotate(var(--tilt)) scale(1.22); }
  100% { transform: translate(-50%, 50%) rotate(var(--tilt)) scale(var(--open)); }
}

.plot-pips {
  position: absolute;
  top: 7px;
  left: 8px;
  z-index: 3;
  display: flex;
  gap: 4px;
  transition: opacity 0.3s ease;
}
.plot-pip {
  width: 9px;
  height: 11px;
  border-radius: 52% 52% 46% 46% / 66% 66% 34% 34%;
  background: rgba(10, 24, 30, 0.42);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.24);
}
.plot-pip[data-wet="1"] {
  background: linear-gradient(180deg, #d3f0ff 0%, #6fc0e8 48%, #2f86bb 100%);
  box-shadow: 0 0 6px rgba(124, 208, 255, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.85);
}
.garden .plot[data-thirsty="1"] .plot-pip[data-wet="0"] { animation: plot-thirst 1.5s ease-in-out infinite; }
@keyframes plot-thirst { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
.garden .plot[data-stage="empty"] .plot-pips { opacity: 0; }
.garden .plot[data-stage="bloom"] .plot-pips,
.garden .plot[data-stage="wilt"] .plot-pips { opacity: 0.3; }

.plot-tags {
  position: absolute;
  top: 6px;
  right: 8px;
  z-index: 3;
  display: grid;
  gap: 3px;
  justify-items: end;
}
.plot-tag {
  font-size: 10px;
  line-height: 1.5;
  padding: 0 6px;
  border-radius: 999px;
  font-family: var(--font-body);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.25);
}
.plot-tag[data-kind="ready"] { background: #e7c56b; color: #3d2c06; animation: plot-thirst 1.6s ease-in-out infinite; }
.plot-tag[data-kind="dry"] { background: #8c5230; color: #ffe9d6; }
.plot-tag[data-kind="fert"] { background: #6b9a5e; color: #f1ffe8; }
.plot-tag[data-kind="wilt"] { background: #7b5c3c; color: #f4e5cf; }

.plot-empty-hint {
  position: absolute;
  left: 50%;
  top: 42%;
  z-index: 2;
  width: 46%;
  aspect-ratio: 1;
  margin: 0;
  transform: translate(-50%, -50%);
  display: grid;
  place-items: center;
  border: 2px dashed rgba(244, 230, 200, 0.26);
  border-radius: 50%;
  color: rgba(244, 230, 200, 0.55);
  font-family: var(--font-display);
  font-size: 15px;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.garden .plot[data-stage="empty"] .plot-empty-hint { opacity: 1; }

.garden .plot .meta {
  z-index: 4;
  display: grid;
  gap: 3px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.55);
}
.plot-caption { display: flex; justify-content: center; gap: 6px; align-items: baseline; }
.plot-name { font-family: var(--font-display); font-size: 14px; letter-spacing: 0.04em; }
.plot-stage { font-size: 10px; opacity: 0.82; }
.garden .plot .bar { background: rgba(18, 12, 6, 0.62); }
.garden .plot .bar > i { transition: width 0.25s linear; }
.garden .plot .bar > i[data-tone="fresh"] { background: linear-gradient(90deg, var(--bloom), var(--accent)); }
.garden .plot .bar > i[data-tone="dead"] { background: linear-gradient(90deg, #6d5b45, #4a3c2c); }

@media (prefers-reduced-motion: reduce) {
  .garden .plot .plot-plant,
  .garden .plot .plot-glow,
  .garden .plot .plot-blossom,
  .garden .plot .plot-pip,
  .garden .plot .plot-tag { animation: none !important; }
}
`;

/** 幂等注入；同一文档重复调用只会挂一份样式。 */
export function ensurePlotTheme(doc: Document = document): void {
  const head = doc.head ?? doc.documentElement;
  if (!head || doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = PLOT_CSS;
  head.append(style);
}
