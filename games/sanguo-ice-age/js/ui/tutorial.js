/**
 * 新手引导：聚光环 + 说明卡，逐步介绍火炉、资源、温度、招贤、讨伐与流速。
 * 目标既可以是 DOM 选择器，也可以是场景里的建筑（由渲染器给出屏幕包围盒）。
 */

const DONE_KEY = "sanguo-ice-age-tutorial-v1";

const STEPS = [
  {
    building: "furnace",
    title: "火炉：全城命脉",
    text: "拾薪城靠这座火炉活着。它决定城中温度，也决定其余建筑的<b>等级上限</b>。点击场景里的任何建筑都能打开升级面板。",
  },
  {
    sel: "#res-bar",
    title: "四项物资",
    text: "🍖 肉食养人、🪵 木材建屋与烧火、🪨 石炭是寒潮时的救命燃料、⚙️ 铁料用于军备与典籍。数字下方为储量条，右侧为每日净增减。",
  },
  {
    sel: "#vital-temp",
    title: "温度与寒潮",
    text: "温度低于 0° 民心开始下滑，低于 −6° 会冻毙人口。每隔数日会有一场<b>冰河寒潮</b>，届时全屏结霜、气温骤降，务必提前囤足燃料。",
  },
  {
    building: "lumber",
    title: "派工与产出",
    text: "伐木场、猎人小屋、煤矿、铁矿需要<b>派驻工人</b>才会产出。闲置丁口可在建筑面板里增减，工人越多产量越高，但也吃得更多。",
  },
  {
    sel: '[data-open="recruit"]',
    title: "招贤纳士",
    text: "花费招募令延请魏蜀吴群武将。品质越高战力越强，<b>同阵营出征</b>还有额外加成。重复武将会自动转为等级提升。",
  },
  {
    sel: '[data-open="expedition"]',
    title: "出征讨伐",
    text: "点将、点兵、出征。步兵克骑兵、骑兵克弓兵、弓兵克步兵；吴克蜀、蜀克魏、魏克吴。得胜可缴获大量物资与招募令。",
  },
  {
    sel: "#speed-bar",
    title: "掌控时间",
    text: "暂停或以 1x / 2x / 4x 推进。快捷键：<b>空格</b> 暂停，<b>1 2 3</b> 切换流速，<b>Esc</b> 关闭面板。<br/>准备好了就点「开始治城」吧。",
  },
];

export function createTutorial({ getBuildingRect, onDone } = {}) {
  const host = document.getElementById("tutorial-root");
  let idx = 0;
  let active = false;
  let ring = null;
  let card = null;
  let raf = 0;

  function build() {
    host.innerHTML = `
      <div class="tut__ring"></div>
      <div class="tut__card">
        <div class="tut__step"></div>
        <h3 class="tut__title"></h3>
        <p class="tut__text"></p>
        <div class="tut__foot">
          <div class="tut__dots"></div>
          <button class="btn btn--sm btn--ghost" data-tut="skip">跳过</button>
          <button class="btn btn--sm btn--primary" data-tut="next">下一步</button>
        </div>
      </div>`;
    ring = host.querySelector(".tut__ring");
    card = host.querySelector(".tut__card");
    host.addEventListener("click", (e) => {
      const b = e.target.closest("[data-tut]");
      if (!b) return;
      if (b.dataset.tut === "skip") finish();
      else next();
    });
  }

  function targetRect(step) {
    if (step.sel) {
      const node = document.querySelector(step.sel);
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return { x: r.left - 8, y: r.top - 8, w: r.width + 16, h: r.height + 16 };
    }
    if (step.building && getBuildingRect) {
      const r = getBuildingRect(step.building);
      if (!r) return null;
      return { x: r.x - 12, y: r.y - 12, w: r.width + 24, h: r.height + 24 };
    }
    return null;
  }

  function place() {
    if (!active) return;
    const step = STEPS[idx];
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let r = targetRect(step);
    if (!r) r = { x: vw / 2 - 130, y: vh / 2 - 90, w: 260, h: 180 };

    r.x = Math.max(6, Math.min(vw - 6 - r.w, r.x));
    r.y = Math.max(6, Math.min(vh - 6 - r.h, r.y));

    ring.style.left = `${r.x}px`;
    ring.style.top = `${r.y}px`;
    ring.style.width = `${r.w}px`;
    ring.style.height = `${r.h}px`;

    const cw = card.offsetWidth || 320;
    const ch = card.offsetHeight || 160;
    let cx = r.x + r.w / 2 - cw / 2;
    let cy = r.y + r.h + 16;
    if (cy + ch > vh - 12) cy = r.y - ch - 16;
    if (cy < 12) cy = Math.min(vh - ch - 12, r.y + r.h + 16);
    cx = Math.max(12, Math.min(vw - cw - 12, cx));
    card.style.left = `${cx}px`;
    card.style.top = `${Math.max(12, cy)}px`;
  }

  function render() {
    const step = STEPS[idx];
    card.querySelector(".tut__step").textContent = `第 ${idx + 1} / ${STEPS.length} 步`;
    card.querySelector(".tut__title").textContent = step.title;
    card.querySelector(".tut__text").innerHTML = step.text;
    card.querySelector('[data-tut="next"]').textContent =
      idx === STEPS.length - 1 ? "开始治城" : "下一步";
    card.querySelector(".tut__dots").innerHTML = STEPS.map(
      (_, i) => `<i class="${i === idx ? "is-on" : ""}"></i>`
    ).join("");
    place();
  }

  function loop() {
    place();
    raf = requestAnimationFrame(loop);
  }

  function start(force) {
    if (!force && localStorage.getItem(DONE_KEY) === "1") return false;
    if (!ring) build();
    idx = 0;
    active = true;
    host.hidden = false;
    render();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
    return true;
  }

  function next() {
    if (idx >= STEPS.length - 1) return finish();
    idx++;
    render();
  }

  function finish() {
    active = false;
    host.hidden = true;
    cancelAnimationFrame(raf);
    try { localStorage.setItem(DONE_KEY, "1"); } catch { /* 隐私模式忽略 */ }
    onDone?.();
  }

  window.addEventListener("resize", place);

  return { start, next, finish, get active() { return active; } };
}
