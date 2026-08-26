// UI 组件自己的皮肤。src/styles/** 是美术（Fable-2）的地盘，本层一个字都不改，
// 只把「UI 这一轮新造的部件」样式随模块注入，颜色全部取 tokens.css 的变量。
// 类名统一 cww- 前缀，避免和结构层/皮肤层撞车。

export const UI_CSS = `
/* 夜幕：canvas.js 自己也画一层暗色，CSS 这层按半量走，免得夜里黑成一块煤。 */
[data-phase="dusk"] { --night-alpha: 0.06; }
[data-phase="night"] { --night-alpha: 0.15; }

/* ---------- 顶栏工具位：倍速 / 静音 / 减弱动态 ---------- */
.cww-tools { display: flex; align-items: center; gap: 6px; }
.cww-tools button {
  min-width: 38px; padding: 6px 10px;
  font-size: var(--fs-small); font-weight: 700; color: var(--ink);
  background: linear-gradient(var(--paper), #f6e7c8);
  border: 1.5px solid var(--wood-dark); border-radius: var(--radius-pill);
  box-shadow: 0 2px 0 var(--wood-dark), inset 0 1.5px 0 rgba(255,255,255,.7);
}
.cww-tools button:active { transform: translateY(2px); box-shadow: 0 0 0 var(--wood-dark); }
.cww-tools button.on {
  background: linear-gradient(#ffe08a, var(--sun) 55%, var(--sun-deep));
  border-color: var(--ink); box-shadow: 0 2px 0 var(--ink);
}

/* ---------- 状态条文字标签：不只靠颜色和长度 ---------- */
.meters .bar { min-width: 92px; height: 16px; }
.cww-bar-label {
  position: absolute; inset: 0; z-index: 2;
  display: flex; align-items: center; justify-content: center;
  padding-left: 12px;
  font-size: 10px; font-style: normal; font-weight: 700;
  font-variant-numeric: tabular-nums; color: var(--ink);
  text-shadow: 0 0 3px rgba(255,255,255,.95), 0 0 2px rgba(255,255,255,.95);
}
.cww-bar-label.low { color: #7a0b1c; }

/* ---------- 通用小件 ---------- */
.cww-hint { margin: 6px 0 8px; font-size: var(--fs-small); line-height: 1.5; color: var(--ink-soft); }
.cww-hint.bad { color: #9c1f2e; font-weight: 600; }
.cww-hint.good { color: var(--kelp-deep); font-weight: 600; }
.cww-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 6px 0; }
.cww-key {
  display: inline-block; min-width: 18px; padding: 1px 5px; margin: 0 2px;
  font-size: var(--fs-tiny); font-weight: 700; text-align: center; color: var(--ink);
  background: var(--paper); border: 1.5px solid var(--ink);
  border-radius: 5px; box-shadow: 0 1.5px 0 var(--ink);
}
.cww-tag {
  display: inline-block; padding: 1px 8px; font-size: var(--fs-tiny); font-weight: 700;
  color: var(--ink); background: rgba(22,50,60,.08);
  border: 1.5px solid rgba(22,50,60,.3); border-radius: var(--radius-pill);
}
.cww-tag.lock { background: rgba(22,50,60,.14); color: var(--ink-soft); }
.cww-tag.rare { background: rgba(124,111,240,.18); border-color: #7c6ff0; }
.cww-tag.epic { background: rgba(239,71,111,.16); border-color: var(--buoy); }
.cww-tag.legend { background: rgba(255,209,102,.32); border-color: var(--sun-deep); }
.cww-tag.boss { background: rgba(239,71,111,.22); border-color: var(--buoy); }
.panel button:disabled { filter: grayscale(.75) brightness(.94); opacity: .6; cursor: not-allowed; }
.panel button:disabled:hover { transform: none; }

/* 目标指引 + 潜水警告：钉死在左面板顶部（面板自己是滚动容器），滚多远都看得见。
   面板内边距 14/16px，用负 margin 把 sticky 头顶到边，底下再补一条分隔阴影。 */
.cww-sticky {
  position: sticky; top: -14px; z-index: 4;
  margin: -14px -16px 8px; padding: 14px 16px 6px;
  background: linear-gradient(var(--card-solid) 82%, rgba(255,247,232,0));
}
.cww-goal {
  display: flex; align-items: center; gap: 8px; margin: 0; padding: 7px 10px;
  font-size: var(--fs-small); font-weight: 600; color: var(--ink);
  background: rgba(255,209,102,.34);
  border: 1.5px dashed var(--sun-deep); border-radius: var(--radius-m);
}
.cww-goal button { margin: 0 0 0 auto; padding: 4px 12px; font-size: var(--fs-tiny); }

/* 潜水中切屏的常驻警告：氧气不会因为你换了个屏就不扣 */
/* .soft 是钓鱼那条：线还在水里，但没到「命要紧」的程度，用琥珀色降一档 */
.cww-alert {
  display: flex; align-items: center; gap: 8px; margin: 0 0 6px; padding: 7px 10px;
  font-size: var(--fs-small); font-weight: 700; color: #7a0b1c;
  background: linear-gradient(#ffdede, #ffc0c0);
  border: 1.5px solid #9c1f2e; border-radius: var(--radius-m);
}
.cww-alert button { margin: 0 0 0 auto; padding: 4px 12px; font-size: var(--fs-tiny); }
.cww-alert.soft {
  color: #7a4a1e;
  background: linear-gradient(#ffeec4, #ffd98a);
  border-color: var(--sun-deep);
}

/* ---------- 吐司：动作反馈都从这里出 ---------- */
.cww-toast {
  position: absolute; left: 50%; top: 6px; z-index: 5;
  max-width: min(560px, 88%); padding: 8px 18px;
  font-size: var(--fs-body); font-weight: 600; color: var(--ink); text-align: center;
  background: var(--card-solid); border: var(--line) solid var(--ink);
  border-radius: var(--radius-pill); box-shadow: var(--shadow-pop);
  transform: translate(-50%, -8px); opacity: 0; pointer-events: none;
  transition: opacity var(--dur-quick) var(--ease-out), transform var(--dur-quick) var(--ease-out);
}
.cww-toast.show { opacity: 1; transform: translate(-50%, 0); }
.cww-toast.bad { background: linear-gradient(#ffdede, #ffb4b4); }
.cww-toast.good { background: linear-gradient(#dcf7e7, #a8ecc8); }

/* ---------- 建造预览：合法绿格 / 非法红格 ---------- */
.cww-ghost { position: absolute; inset: 0; z-index: 2; pointer-events: none; }
.cww-ghost-cell {
  position: absolute; box-sizing: border-box;
  border: 2.5px dashed transparent; border-radius: 9px;
}
.cww-ghost-cell.ok { border-color: #157a4c; background: rgba(61,204,138,.4); }
.cww-ghost-cell.bad { border-color: #8f1425; background: rgba(255,107,107,.46); }
.cww-ghost-cell.pick { border-color: var(--sun-deep); background: rgba(255,209,102,.34); }
.cww-ghost-cell.bad::after {
  content: "✕"; position: absolute; inset: 0;
  display: grid; place-items: center;
  font-size: 18px; font-weight: 900; color: #fff;
  text-shadow: 0 1px 3px rgba(0,0,0,.55);
}
.cww-ghost-label {
  position: absolute; padding: 3px 10px; transform: translate(-50%, -130%);
  font-size: var(--fs-tiny); font-weight: 700; color: var(--ink); white-space: nowrap;
  background: var(--card-solid); border: 1.5px solid var(--ink);
  border-radius: var(--radius-pill); box-shadow: 0 2px 0 rgba(22,50,60,.4);
}
.cww-ghost-label.bad { background: #ffd0d0; }

/* ---------- 建筑图鉴格 ---------- */
.cww-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(122px, 1fr)); gap: 6px; margin: 8px 0; }
.cww-pick {
  display: block; width: 100%; margin: 0 !important; padding: 7px 9px !important;
  text-align: left; color: var(--ink) !important; text-shadow: none !important;
  background: linear-gradient(var(--paper), #f7e9cd) !important;
  border: 1.5px solid rgba(22,50,60,.4) !important; border-radius: var(--radius-s) !important;
  box-shadow: 0 2px 0 rgba(22,50,60,.22) !important;
}
.cww-pick.on {
  background: linear-gradient(#ffe9ae, var(--sun)) !important;
  border-color: var(--ink) !important; box-shadow: 0 3px 0 var(--ink) !important;
}
.cww-pick.poor { opacity: .62; }
.cww-pick b { display: block; font-size: var(--fs-body); font-weight: 700; }
.cww-pick span { display: block; font-size: var(--fs-tiny); font-weight: 500; color: var(--ink-soft); }

/* ---------- 钓鱼节奏条：窗口只画不写数字 ---------- */
.cww-rhythm { margin: 10px 0 6px; }
.cww-track {
  position: relative; height: 30px; overflow: hidden;
  background: linear-gradient(90deg, var(--sea-glint), var(--sea) 55%, var(--sea-deep));
  border: var(--line) solid var(--ink); border-radius: var(--radius-pill);
  box-shadow: inset 0 3px 5px rgba(6,53,68,.45);
}
.cww-track.idle { filter: grayscale(.55) brightness(.9); }
.cww-zone {
  position: absolute; top: 0; bottom: 0; background: rgba(61,204,138,.55);
  border-left: 2px solid #157a4c; border-right: 2px solid #157a4c;
}
.cww-zone-core { position: absolute; top: 0; bottom: 0; background: rgba(255,209,102,.8); }
.cww-needle {
  position: absolute; top: -3px; bottom: -3px; width: 6px; margin-left: -3px;
  background: linear-gradient(var(--buoy) 0 48%, #fff 48%);
  border: 2px solid var(--ink); border-radius: 4px; box-shadow: 0 0 6px rgba(255,255,255,.7);
}
.cww-track.idle .cww-needle { opacity: .35; }
/* 指针进窗口 / 进完美区时自己变色：gradeCast 判什么，屏幕上就亮什么，
   老大不用靠像素对齐去猜自己有没有压中。 */
.cww-needle.good { background: linear-gradient(#3dcc8a 0 48%, #fff 48%); }
.cww-needle.perfect {
  background: linear-gradient(var(--sun) 0 48%, #fff 48%);
  box-shadow: 0 0 12px rgba(255,209,102,.95);
}
.cww-catch { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: var(--fs-body); font-weight: 700; }
.cww-catch.hit { color: var(--kelp-deep); }
.cww-catch.miss { color: #9c1f2e; }

/* ---------- 鱼类图鉴：没钓上来的只给轮廓，钓上来才给名字与俏皮话 ---------- */
.cww-dex {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(136px, 1fr)); gap: 6px;
  max-height: 280px; margin: 6px 0; padding: 2px; overflow: auto; overscroll-behavior: contain;
}
.cww-dex-cell {
  padding: 6px 8px;
  background: linear-gradient(var(--paper), #f7e9cd);
  border: 1.5px solid rgba(22,50,60,.32); border-radius: var(--radius-s);
  box-shadow: 0 2px 0 rgba(22,50,60,.16);
}
.cww-dex-cell.unknown { background: rgba(22,50,60,.07); border-style: dashed; box-shadow: none; }
.cww-dex-cell.here { border-color: var(--kelp-deep); box-shadow: 0 2px 0 rgba(21,122,76,.3); }
.cww-dex-cell b { display: block; font-size: var(--fs-small); font-weight: 700; }
.cww-dex-cell.unknown b { color: var(--ink-soft); letter-spacing: 2px; }
.cww-dex-cell span { display: block; font-size: var(--fs-tiny); color: var(--ink-soft); }
.cww-dex-cell i {
  display: block; margin-top: 3px; font-size: var(--fs-tiny); font-style: italic; color: var(--ink-soft);
}

/* ---------- 潜水 HUD ---------- */
.cww-dive { position: absolute; inset: 0; z-index: 2; display: none; pointer-events: none; }
.cww-dive.on { display: block; background: rgba(3,24,33,.82); }
.cww-arena {
  position: absolute; inset: 0; margin: auto; overflow: hidden;
  width: min(96%, 640px); aspect-ratio: 100 / 90; max-height: 96%;
  background: linear-gradient(180deg, #157c8c, #0a4356 45%, #04202c);
  border: var(--line) solid rgba(216,246,244,.55); border-radius: var(--radius-m);
  box-shadow: inset 0 0 60px rgba(2,18,26,.75), 0 12px 40px rgba(2,18,26,.5);
}
.cww-arena::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: repeating-linear-gradient(0deg, transparent 0 33px, rgba(216,246,244,.09) 33px 35px);
}
.cww-diver {
  position: absolute; width: 26px; height: 26px; margin: -13px 0 0 -13px;
  background: radial-gradient(circle at 34% 30%, #fff, var(--sun) 55%, var(--sun-deep));
  border: 2.5px solid var(--ink); border-radius: 50%;
  box-shadow: 0 0 14px rgba(255,209,102,.6);
}
.cww-diver::after {
  content: ""; position: absolute; left: 4px; top: 7px; width: 15px; height: 7px;
  background: rgba(76,201,240,.95); border: 1.5px solid var(--ink); border-radius: 4px;
}
.cww-danger {
  position: absolute; width: 12%; aspect-ratio: 1; margin: -6% 0 0 -6%;
  border: 2px dashed rgba(239,71,111,.85); border-radius: 50%;
  background: radial-gradient(circle, rgba(239,71,111,.22), transparent 70%);
}
.cww-shark {
  position: absolute; width: 52px; height: 22px; margin: -11px 0 0 -26px;
  background: linear-gradient(#b6c2cb, #4e5e6a 60%, #33424c);
  border: 2px solid #0d1b23; border-radius: 62% 26% 26% 62% / 50%;
  box-shadow: 0 3px 8px rgba(2,18,26,.6);
}
.cww-shark::before {
  content: ""; position: absolute; right: -12px; top: 1px;
  border: 8px solid transparent; border-left-color: #3c4b56;
}
.cww-shark::after {
  content: ""; position: absolute; left: 11px; top: -9px;
  border: 7px solid transparent; border-bottom-color: #7c8a95;
}
.cww-shark.flip { transform: scaleX(-1); }
.cww-node {
  position: absolute; width: 20px; height: 20px; margin: -10px 0 0 -10px;
  border: 2px solid var(--ink); border-radius: 6px; transform: rotate(45deg);
  box-shadow: 0 0 10px rgba(255,255,255,.45);
}
.cww-node.rare { box-shadow: 0 0 0 4px rgba(255,209,102,.45), 0 0 16px rgba(255,209,102,.8); }
.cww-node.wreck { width: 26px; height: 26px; margin: -13px 0 0 -13px; border-width: 3px; }
/* 补氧气泡：会话里一直有，之前没人画 */
.cww-bubble {
  position: absolute; width: 18px; height: 18px; margin: -9px 0 0 -9px;
  background: radial-gradient(circle at 34% 30%, #fff, rgba(76,201,240,.9) 60%, rgba(20,120,160,.85));
  border: 2px solid rgba(216,246,244,.9); border-radius: 50%;
  box-shadow: 0 0 10px rgba(76,201,240,.7);
}
.cww-shark.aggro { filter: brightness(1.15) saturate(1.3); }
.cww-surface {
  position: absolute; left: 0; right: 0; top: 0; height: 8.8%;
  background: repeating-linear-gradient(90deg, rgba(216,246,244,.34) 0 14px, rgba(216,246,244,.15) 14px 28px);
  border-bottom: 2px dashed rgba(216,246,244,.75);
}
.cww-surface span {
  position: absolute; right: 8px; top: 50%; translate: 0 -50%;
  font-size: var(--fs-tiny); font-weight: 700; color: #06353f;
}
.cww-meter {
  position: relative; height: 18px; margin: 6px 0; overflow: hidden;
  background: rgba(22,50,60,.18); border: 1.5px solid rgba(22,50,60,.55);
  border-radius: var(--radius-pill); box-shadow: inset 0 2px 3px rgba(6,53,68,.28);
}
.cww-meter > i { display: block; height: 100%; background: linear-gradient(var(--sea-glint), var(--info)); }
.cww-meter.low > i { background: linear-gradient(#ff9a9a, var(--coral)); }
.cww-meter > em {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-style: normal; font-weight: 700; font-variant-numeric: tabular-nums;
  color: var(--ink); text-shadow: 0 0 3px rgba(255,255,255,.95);
}
.cww-dpad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; width: 168px; margin: 8px 0; }
.cww-dpad button {
  margin: 0 !important; min-height: 44px; padding: 0 !important;
  font-size: 16px; font-weight: 900; border-radius: var(--radius-s) !important;
}
.cww-dpad button.wide { grid-column: 1 / -1; font-size: var(--fs-small); }
.cww-dpad .spacer { visibility: hidden; }

/* ---------- 出战阵容：前后排两栏 + 勾选 ---------- */
.cww-sub {
  margin: 12px 0 4px; font-family: var(--font-display); font-size: var(--fs-body); color: var(--ink);
}
.cww-lane {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 4px;
  margin: 4px 0; padding: 5px 7px;
  background: rgba(22,50,60,.05);
  border: 1.5px dashed rgba(22,50,60,.3); border-radius: var(--radius-m);
}
.cww-lane.hurt { background: rgba(239,71,111,.08); border-color: rgba(156,31,46,.45); }
.cww-lane-tag {
  grid-column: 1 / -1; font-size: var(--fs-tiny); font-weight: 700; color: var(--ink-soft);
}
.cww-pickhero {
  margin: 0 !important; padding: 4px 8px !important; min-height: 0; text-align: left;
  color: var(--ink) !important; text-shadow: none !important;
  background: linear-gradient(var(--paper), #f7e9cd) !important;
  border: 1.5px solid rgba(22,50,60,.4) !important; border-radius: var(--radius-s) !important;
  box-shadow: 0 2px 0 rgba(22,50,60,.22) !important;
}
.cww-pickhero.on {
  background: linear-gradient(#ffe9ae, var(--sun)) !important;
  border-color: var(--ink) !important; box-shadow: 0 3px 0 var(--ink) !important;
}
.cww-pickhero.hurt { opacity: .7; }
.cww-pickhero b { display: block; font-size: var(--fs-small); font-weight: 700; line-height: 1.35; }
.cww-pickhero span, .cww-pickhero i {
  display: block; font-size: var(--fs-tiny); font-style: normal; font-weight: 500; color: var(--ink-soft);
}
.cww-pickhero.hurt i { color: #9c1f2e; font-weight: 700; }

/* ---------- 英雄 ---------- */
.cww-card.hurt { border-color: rgba(156,31,46,.5); background: #fff1f1; }
.cww-card.aboard { padding: 5px 10px; opacity: .85; }
.cww-card {
  margin: 6px 0; padding: 8px 10px;
  background: var(--paper); border: 1.5px solid rgba(22,50,60,.32);
  border-radius: var(--radius-m); box-shadow: 0 2px 0 rgba(22,50,60,.14);
}
.cww-card.on { border-color: var(--ink); box-shadow: 0 3px 0 var(--ink); background: #fff9ea; }
.cww-card b { font-size: var(--fs-body); }
.cww-card p { margin: 4px 0 6px !important; font-size: var(--fs-tiny) !important; }
.cww-card button { margin: 2px 4px 2px 0 !important; padding: 5px 12px !important; font-size: var(--fs-tiny) !important; }
.cww-star { color: var(--sun-deep); font-weight: 900; letter-spacing: 1px; }
.cww-sel {
  max-width: 100%; padding: 5px 10px; font-size: var(--fs-tiny); color: var(--ink);
  background: var(--paper); border: 1.5px solid var(--ink); border-radius: var(--radius-pill);
}

/* ---------- 关卡战报 ---------- */
.cww-banner {
  margin: 8px 0; padding: 8px 12px; font-family: var(--font-display); font-size: 18px; text-align: center;
  border: var(--line) solid var(--ink); border-radius: var(--radius-m); box-shadow: 0 3px 0 rgba(22,50,60,.3);
}
.cww-banner.win { background: linear-gradient(#ffe9ae, var(--sun)); }
.cww-banner.lose { background: linear-gradient(#ffd3d3, #ff9d9d); }
.cww-banner.draw { background: linear-gradient(#e5eef2, #c3d3da); }
.cww-report {
  max-height: 168px; overflow: auto; overscroll-behavior: contain; padding: 6px 8px;
  font-size: var(--fs-tiny); line-height: 1.7; font-variant-numeric: tabular-nums;
  background: rgba(22,50,60,.06); border: 1.5px solid rgba(22,50,60,.24); border-radius: var(--radius-s);
}
.cww-report div { padding: 1px 0; border-bottom: 1px dotted rgba(22,50,60,.14); }
.cww-report div.skill { font-weight: 700; color: #7a4a1e; }
.cww-side { display: grid; grid-template-columns: 1fr; gap: 3px; margin: 6px 0; }
.cww-hp { display: flex; align-items: center; gap: 6px; font-size: var(--fs-tiny); }
.cww-hp i {
  flex: 1; height: 8px; overflow: hidden; background: rgba(22,50,60,.16);
  border: 1px solid rgba(22,50,60,.4); border-radius: var(--radius-pill);
}
.cww-hp i b { display: block; height: 100%; background: var(--kelp); }
.cww-hp.enemy i b { background: var(--coral); }
.cww-hp.dead { opacity: .45; text-decoration: line-through; }

/* ---------- 仓库格：数字与名字分离，便于按需只改数字 ---------- */
.bag div span { font-variant-numeric: tabular-nums; }
.cww-empty { font-size: var(--fs-small); color: var(--ink-soft); }

/* 宽屏时左面板压着海面，海底舞台让开它的宽度，别让老大被自己的 HUD 挡住 */
@media (min-width: 761px) {
  .cww-arena { inset: 0 0 0 min(46vw, 448px); }
}

@media (max-width: 760px) {
  .cww-grid { grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); }
  .cww-arena { width: 96%; }
}
`;

let injected = false;

export function ensureSkin(doc) {
  if (injected || !doc) return;
  injected = true;
  const style = doc.createElement("style");
  style.id = "cww-ui-skin";
  style.textContent = UI_CSS;
  doc.head.append(style);
}
