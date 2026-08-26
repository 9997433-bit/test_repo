import { setText } from "../ui/dom.js";

/**
 * 小游戏共用外观层。样式所有权在 F2（`src/styles/**`），本轮不动那批文件，
 * 所以五店共用的新样式集中在这里、统一 `mg-` 前缀、按需一次性注入 <style>，
 * 与 main.css 的类名零重叠。F2 接手时整段搬走即可，视图侧不用改。
 */

const STYLE_ID = "mg-style";

const CSS = `
.mg-panel { position: relative; }
.mg-panel h2 { margin: 0; font-size: var(--text-lg); }
.mg-panel button:focus-visible { outline: none; box-shadow: var(--ring-focus); }
.mg-sub { margin: 8px 0 0; color: var(--text-soft); font-size: var(--text-sm); line-height: var(--leading-normal); }
.mg-note { margin: 8px 0 0; color: var(--text-soft); font-size: var(--text-xs); line-height: var(--leading-normal); }
.mg-note b { color: var(--text-body); }

.mg-hud { display: flex; gap: 6px; margin: 10px 0; }
.mg-stat { flex: 1 1 0; min-width: 0; padding: 6px 4px; text-align: center; border-radius: var(--radius-sm); background: var(--surface-veil); border: 1px solid var(--line-soft); }
.mg-stat b { display: block; font-size: var(--text-md); font-variant-numeric: tabular-nums; transition: color var(--dur-fast) var(--ease-out); }
.mg-stat small { display: block; margin-top: 2px; color: var(--text-soft); font-size: var(--text-2xs); }
.mg-stat.hot { background: var(--gold-100); border-color: var(--gold-300); }
.mg-stat.hot b { color: var(--text-gold); }
.mg-stat.cold b { color: var(--text-danger); }

.mg-bar { height: var(--progress-height); border-radius: var(--radius-pill); background: var(--progress-track); overflow: hidden; }
.mg-bar > i { display: block; height: 100%; width: 100%; border-radius: inherit; background: var(--progress-fill); transition: width var(--dur-fast) linear; }
.mg-bar.warn > i { background: linear-gradient(90deg, var(--danger), var(--gold-400)); }

.mg-banner { margin: 10px 0 0; padding: 8px 12px; border-radius: var(--radius-sm); text-align: center; font-size: var(--text-sm); font-weight: var(--weight-bold); color: var(--ink-900); background: var(--grad-gold); box-shadow: var(--shadow-1); animation: var(--anim-pop-in); }
.mg-banner.calm { background: var(--surface-veil); color: var(--text-soft); font-weight: var(--weight-regular); box-shadow: none; border: 1px dashed var(--line-strong); }
.mg-banner.bad { background: var(--danger-bg); color: var(--text-danger); }

.mg-fx { position: relative; height: 0; overflow: visible; }
.mg-float { position: absolute; top: -6px; transform: translateX(-50%); pointer-events: none; white-space: nowrap; font-weight: var(--weight-bold); font-size: var(--text-sm); text-shadow: 0 1px 2px rgba(255,255,255,0.8); animation: var(--anim-coin); z-index: var(--z-fx); }
.mg-float.good { color: var(--text-success); }
.mg-float.gold { color: var(--text-gold); }
.mg-float.bad { color: var(--text-danger); }
.mg-shake { animation: var(--anim-shake); }

.mg-actions { display: flex; gap: 8px; margin-top: 12px; }
.mg-actions .btn { flex: 1 1 0; min-height: var(--tap-target); }

.mg-line button { position: relative; min-height: var(--tap-target); transition: var(--transition-press); }
.mg-line button:active { transform: scale(0.94); box-shadow: var(--shadow-btn-press); }
.mg-line button.next { box-shadow: 0 0 0 2px var(--rose-300) inset, var(--shadow-2); }
.mg-line .key { position: absolute; top: 4px; right: 6px; font-size: var(--text-2xs); color: var(--text-faint); }
.mg-chip-wrap { display: flex; gap: 6px; flex-wrap: wrap; margin: 10px 0; min-height: 34px; }
.mg-chip { padding: 6px 10px; border-radius: var(--radius-pill); background: var(--chip-bg); border: var(--chip-border); font-size: var(--text-sm); transition: var(--transition-color); }
.mg-chip.done { background: var(--chip-done-bg); border: var(--chip-done-border); color: var(--text-success); }
.mg-chip.now { border-color: var(--rose-400); box-shadow: 0 0 0 2px var(--rose-100); }

.mg-stage { position: relative; height: 210px; margin: 10px 0; border-radius: var(--radius-md); overflow: hidden; background: linear-gradient(180deg, var(--mint-100) 0%, var(--cream-0) 100%); touch-action: none; }
.mg-stage:focus-visible { outline: none; box-shadow: var(--ring-focus); }
.mg-item { position: absolute; left: 0; top: 0; width: 34px; height: 34px; line-height: 34px; text-align: center; font-size: 26px; will-change: transform; }
.mg-basket { position: absolute; left: 0; bottom: 8px; width: 76px; height: 24px; will-change: transform; }
.mg-basket > i { display: block; width: 100%; height: 100%; border-radius: 10px 10px 14px 14px; background: var(--grad-brand); box-shadow: var(--shadow-2); transform-origin: 50% 100%; }
.mg-basket > i::before { content: ""; position: absolute; inset: 3px 6px auto; height: 4px; border-radius: var(--radius-pill); background: rgba(255,255,255,0.55); }
.mg-basket.catching > i { animation: mg-squash 180ms var(--ease-out); }
@keyframes mg-squash { 0% { transform: scaleY(0.72) scaleX(1.1); } 100% { transform: none; } }
.mg-over { position: absolute; inset: 0; display: grid; place-content: center; gap: 6px; padding: 14px; text-align: center; background: rgba(255,253,251,0.9); animation: var(--anim-pop-in); }
.mg-over strong { font-size: var(--text-2xl); color: var(--text-gold); font-variant-numeric: tabular-nums; }

.mg-box { text-align: center; font-size: 62px; line-height: 1.1; padding: 6px 0; }
.mg-box.rolling { animation: fm-shake 420ms var(--ease-in-out) 2; }
.mg-prize { margin-top: 10px; padding: 12px; border-radius: var(--radius-md); border: 2px solid var(--line-strong); background: var(--surface-solid); text-align: center; animation: var(--anim-pop-in); }
.mg-prize .name { display: block; margin: 6px 0 2px; font-weight: var(--weight-bold); }
.mg-prize .gain { color: var(--text-soft); font-size: var(--text-sm); }
.mg-prize.tier-sr { border-color: var(--mint-400); background: var(--mint-100); }
.mg-prize.tier-ssr { border-color: var(--lilac-400); background: var(--lilac-100); }
.mg-prize.tier-ur { border-color: var(--gold-500); background: var(--gold-100); box-shadow: var(--shadow-gold); }
.mg-tier { display: inline-block; padding: 2px 10px; border-radius: var(--radius-pill); font-size: var(--text-xs); font-weight: var(--weight-bold); color: var(--text-inverse); background: var(--ink-300); }
.mg-tier.tier-sr { background: var(--mint-500); }
.mg-tier.tier-ssr { background: var(--lilac-500); }
.mg-tier.tier-ur { background: var(--grad-gold); color: var(--ink-900); }

.mg-odds { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: var(--text-xs); }
.mg-odds th, .mg-odds td { padding: 5px 6px; text-align: left; border-bottom: 1px solid var(--line-soft); }
.mg-odds th { color: var(--text-soft); font-weight: var(--weight-regular); }
.mg-odds td.num { text-align: right; font-variant-numeric: tabular-nums; }
.mg-dots { display: flex; gap: 4px; flex-wrap: wrap; align-items: center; min-height: 12px; }
.mg-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--ink-200); }
.mg-dot.tier-sr { background: var(--mint-500); }
.mg-dot.tier-ssr { background: var(--lilac-500); }
.mg-dot.tier-ur { background: var(--gold-500); }

.mg-wheel { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 10px 0; }
.mg-slot { padding: 12px 4px; border-radius: var(--radius-md); text-align: center; background: var(--grad-lilac); box-shadow: var(--shadow-2); transition: var(--transition-color); }
.mg-slot .icon { display: block; font-size: 30px; line-height: 1.2; }
.mg-slot .name { font-size: var(--text-sm); font-weight: var(--weight-bold); }
.mg-slot.spinning { opacity: 0.7; }
.mg-slot.bless { background: var(--grad-gold); }
.mg-slot.plain { background: linear-gradient(160deg, var(--cream-100), var(--cream-300)); }

.mg-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.mg-tag { min-height: 40px; padding: 8px 14px; border-radius: var(--radius-pill); font-size: var(--text-sm); background: var(--surface-solid); border: 1px solid var(--line-strong); transition: var(--transition-color), transform var(--dur-instant) var(--ease-out); }
.mg-tag:active { transform: scale(0.95); }
.mg-tag[aria-pressed="true"] { background: var(--grad-brand); color: var(--text-on-brand); border-color: transparent; }
.mg-tag.hit { border-color: var(--mint-400); color: var(--text-success); }
.mg-tag.hit[aria-pressed="true"] { background: var(--grad-mint); color: var(--ink-900); }
.mg-tag.cold { border-style: dashed; color: var(--text-faint); text-decoration: line-through; }
.mg-tag[disabled] { opacity: 0.55; cursor: not-allowed; }

.mg-look { display: block; width: 100%; margin-top: 8px; padding: 10px 12px; text-align: left; border-radius: var(--radius-md); background: var(--surface-solid); border: 1px solid var(--line-soft); transition: var(--transition-color); }
.mg-look[aria-pressed="true"] { border-color: var(--rose-400); box-shadow: var(--shadow-2); }
.mg-look small { display: block; margin-top: 2px; color: var(--text-soft); font-size: var(--text-xs); }

.mg-list { margin: 10px 0 0; padding: 0; list-style: none; font-size: var(--text-sm); }
.mg-list li { display: flex; justify-content: space-between; gap: 8px; padding: 6px 0; border-bottom: 1px dashed var(--line-soft); }
.mg-list li:last-child { border-bottom: 0; }
.mg-list .ok { color: var(--text-success); }
.mg-list .no { color: var(--text-faint); }
.mg-list .num { font-variant-numeric: tabular-nums; }

.mg-grade { display: inline-block; min-width: 30px; padding: 2px 8px; border-radius: var(--radius-pill); font-weight: var(--weight-bold); background: var(--grad-gold); color: var(--ink-900); }

@media (prefers-reduced-motion: reduce) {
  .mg-shake, .mg-box.rolling, .mg-basket.catching > i { animation: none; }
  .mg-float { animation: none; opacity: 0; }
}
`;

export function ensureStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.textContent = CSS;
  document.head.append(tag);
}

/** 面板骨架：标题 + 返回 + 一句玩法说明，五店统一。 */
export function panelShell(title, subtitle, backLabel = "返回商场") {
  return `
    <div class="row"><h2>${title}</h2><button class="btn ghost" data-back type="button">${backLabel}</button></div>
    <p class="mg-sub">${subtitle}</p>`;
}

export function statBlock(items) {
  return `<div class="mg-hud">${items
    .map((it) => `<span class="mg-stat" data-stat="${it.id}"><b>${it.value}</b><small>${it.label}</small></span>`)
    .join("")}</div>`;
}

export function setStat(root, id, value, tone = "") {
  const box = root.querySelector(`[data-stat="${id}"]`);
  if (!box) return;
  setText(box.querySelector("b"), value);
  box.classList.toggle("hot", tone === "hot");
  box.classList.toggle("cold", tone === "cold");
}

/** 飘字：x 为宿主宽度百分比。宿主需要是 .mg-fx / position:relative 的层。 */
export function floatText(host, text, tone = "good", disposer, x = 50) {
  if (!host) return;
  const node = document.createElement("div");
  node.className = `mg-float ${tone}`;
  node.textContent = text;
  node.style.left = `${Math.max(6, Math.min(94, x))}%`;
  host.append(node);
  const remove = () => node.remove();
  if (disposer) disposer.timeout(remove, 700);
  else setTimeout(remove, 700);
}

/** 重复触发也要能重新播放，所以先摘 class 再强制回流。 */
export function shake(node, disposer) {
  if (!node) return;
  node.classList.remove("mg-shake");
  void node.offsetWidth;
  node.classList.add("mg-shake");
  const clean = () => node.classList.remove("mg-shake");
  if (disposer) disposer.timeout(clean, 460);
  else setTimeout(clean, 460);
}

export function setBar(node, ratio, warn = false) {
  if (!node) return;
  const fill = node.querySelector("i");
  if (fill) fill.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
  node.classList.toggle("warn", warn);
}
