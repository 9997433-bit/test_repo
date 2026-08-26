const STYLE_ID = "fm-labs-style";

const CSS = `
.fm-lab-head h2 { margin: 0 0 4px; font-size: 19px; }
.fm-lab-sub { margin: 0; font-size: 12.5px; line-height: 1.6; color: var(--ink-soft); }
.fm-lab-sub b { color: var(--rose-deep); }

.fm-lab-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0 8px; }
.fm-lab-stat { padding: 9px 6px; border-radius: 15px; text-align: center; background: linear-gradient(180deg, #fff, #f2fbf7); box-shadow: 0 6px 14px rgba(47,174,144,.12); }
.fm-lab-stat b { display: block; font-size: 15px; font-variant-numeric: tabular-nums; }
.fm-lab-stat span { display: block; margin-top: 1px; font-size: 10.5px; color: var(--ink-soft); }

.fm-lab-bar { height: 9px; border-radius: 99px; background: #e7f3ee; overflow: hidden; }
.fm-lab-bar > i { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--mint-400), var(--gold)); transition: width .55s var(--ease); }
.fm-lab-tip { margin: 8px 0 0; font-size: 11.5px; line-height: 1.6; color: var(--ink-soft); }

.fm-track { list-style: none; margin: 0; padding: 0; }
.fm-step { position: relative; display: grid; grid-template-columns: 34px minmax(0, 1fr); column-gap: 10px; }
.fm-rail { position: relative; display: flex; flex-direction: column; align-items: center; padding-top: 22px; }
.fm-rail::before, .fm-rail::after {
  content: ""; position: absolute; left: 50%; width: 3px; margin-left: -1.5px; background: #ecd9e3; border-radius: 3px;
}
.fm-rail::before { top: 0; height: 22px; }
.fm-rail::after { top: 48px; bottom: 0; }
.fm-step:first-child .fm-rail::before { background: transparent; }
.fm-step:last-child .fm-rail::after { background: transparent; }
.fm-step.done .fm-rail::before, .fm-step.done .fm-rail::after,
.fm-step.next .fm-rail::before { background: linear-gradient(180deg, var(--mint-400), var(--mint-300)); }

.fm-dot {
  position: relative; z-index: 1; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center;
  font-size: 12px; font-weight: 700; color: var(--ink-soft); background: #fff; box-shadow: 0 0 0 3px #f7e7ee inset, 0 4px 10px rgba(58,36,51,.1);
}
.fm-step.done .fm-dot { color: #0f6b55; background: linear-gradient(180deg, #c8f6e6, #8fe6cd); box-shadow: 0 0 0 3px #e2fbf3 inset, 0 4px 10px rgba(47,174,144,.28); }
.fm-step.next .fm-dot { color: #fff; background: var(--grad-brand); box-shadow: 0 0 0 3px #ffe1ec inset, 0 6px 14px rgba(199,59,111,.3); animation: fmDotPulse 1.9s var(--ease-in-out, ease-in-out) infinite; }
@keyframes fmDotPulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.12) } }

.fm-node { position: relative; margin-top: 12px; overflow: hidden; }
.fm-step:first-child .fm-node { margin-top: 6px; }
.fm-step.locked .fm-node { opacity: .72; filter: saturate(.6); }
.fm-step.next .fm-node { box-shadow: 0 16px 34px rgba(199,59,111,.16), inset 0 1.5px 0 rgba(255,255,255,.9); border: 1.5px solid var(--rose-200); }
.fm-step.done .fm-node { border-left: 3px solid var(--mint-400); }

.fm-node-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.fm-node-name { font-size: 15px; font-weight: 700; }
.fm-node-order { display: block; margin-top: 2px; font-size: 10.5px; color: var(--ink-soft); letter-spacing: .04em; }
.fm-node-badge { flex: 0 0 auto; padding: 3px 9px; border-radius: 999px; font-size: 10.5px; white-space: nowrap; background: #f4eef1; color: var(--ink-soft); }
.fm-node-badge.done { background: linear-gradient(180deg, #d6fbee, #a9f0da); color: #0f6b55; font-weight: 600; }
.fm-node-badge.next { background: var(--grad-brand); color: #fff; font-weight: 600; }

.fm-node-desc { margin: 7px 0 0; font-size: 11.5px; line-height: 1.6; color: var(--ink-soft); }
.fm-node-facts { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 9px; }
.fm-fact { padding: 3px 9px; border-radius: 999px; font-size: 10.5px; background: #fff; box-shadow: 0 3px 8px rgba(58,36,51,.07); font-variant-numeric: tabular-nums; }
.fm-fact.income { background: linear-gradient(180deg, #e6fff6, #c7f5e6); color: #0f6b55; font-weight: 600; }
.fm-fact.cost { background: linear-gradient(180deg, #fff7e6, #ffeac6); color: #7a5714; font-weight: 600; }

.fm-node-buy { display: flex; align-items: center; gap: 10px; margin-top: 11px; }
.fm-node-buy .btn { flex: 0 0 auto; min-height: 42px; font-size: 12.5px; }
.fm-node-buy .btn[disabled] { background: var(--btn-disabled-bg); color: var(--btn-disabled-text); box-shadow: none; cursor: not-allowed; }
.fm-fund { flex: 1; min-width: 0; }
.fm-fund-bar { height: 7px; border-radius: 99px; background: #f0e2e9; overflow: hidden; }
.fm-fund-bar > i { display: block; height: 100%; border-radius: 99px; background: var(--grad-progress); transition: width .5s var(--ease); }
.fm-fund-txt { display: block; margin-top: 4px; font-size: 10.5px; color: var(--ink-soft); font-variant-numeric: tabular-nums; }

.fm-node-payoff { margin: 10px 0 0; padding: 9px 11px; border-radius: 13px; font-size: 11.5px; line-height: 1.6; background: #fff8fb; color: var(--ink-soft); }
.fm-step.done .fm-node-payoff { background: linear-gradient(180deg, #f0fff9, #e2fbf1); color: #24705c; }
.fm-node-payoff b { color: inherit; font-variant-numeric: tabular-nums; }

.fm-node :focus-visible, .fm-lab-head :focus-visible { outline: none; box-shadow: var(--ring-focus); }

@media (prefers-reduced-motion: reduce) {
  .fm-step.next .fm-dot { animation: none; }
  .fm-lab-bar > i, .fm-fund-bar > i { transition: none; }
}
`;

export function injectLabsStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.textContent = CSS;
  document.head.append(tag);
}
