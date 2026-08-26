import { announce, button, el, meter, srOnly } from "./dom.js";
import { muteToggle, pageHeader, strokeGlyph } from "./components.js";
import { MO_STROKE_TYPES, moProgress } from "../classes/unlock.js";
import { strokeKeyByType } from "./keycast.js";
import { replayOnCanvas } from "../drawing/replay.js";
import { playStroke } from "../audio/index.js";

const CANVAS_W = 168;
const CANVAS_H = 120;
const CARD_PRESSURE = 0.42;

/** 逐笔错开一点起手，一屏墨迹像依次落纸，而不是同时炸开。 */
const STAGGER_MS = 90;

export function renderGallery({ root, store, navigate }) {
  const save = store.get();
  const items = save.gallery || [];
  const mo = moProgress(save);
  const progress = meter("六式收集进度");
  progress.set(mo.have, mo.need, " 式");

  const reduced = prefersReducedMotion(save);
  const cards = [];
  const timers = new Set();

  const shown = [...items].reverse();
  const replayable = shown.filter((g) => hasTrace(g)).length;

  const replayAllBtn = button({
    text: "重放全部",
    disabled: replayable ? null : true,
    onclick: () => replayAll(),
  });

  const section = el("section", { class: "screen" }, [
    pageHeader({ kicker: "墨迹留痕", title: "画阁", tools: [muteToggle(store)] }),
    el("div", { class: "card" }, [
      el("p", { text: `近 ${items.length} 笔，已通 ${mo.have} / ${mo.need} 式。` }),
      progress.node,
      el("p", {
        class: "muted",
        text: mo.unlocked ? "六式齐备，隐线「墨客」已现。" : "集齐六式可感召墨客隐线。",
      }),
      el(
        "ul",
        { class: "mastery-list", "aria-label": "六式收集情况" },
        MO_STROKE_TYPES.map((type) => {
          const done = mo.types.includes(type);
          const meta = strokeKeyByType(type);
          return el("li", { class: `mastery-item ${done ? "done" : ""}`.trim() }, [
            strokeGlyph(type, { width: 56, height: 42 }),
            el("span", { text: `${meta?.name ?? type}` }),
            el("span", { class: "muted", text: done ? "已通" : "未通" }),
          ]);
        }),
      ),
    ]),
    el("div", { class: "gallery-head" }, [
      el("h3", { class: "gallery-sub", text: "近笔" }),
      replayAllBtn,
    ]),
    el("p", {
      class: "muted gallery-tip",
      text: replayable
        ? `其中 ${replayable} 笔留有笔路，点卡片可重看当时的落笔。`
        : "早期留痕只记了笔法，下一场战斗起会连笔路一并入藏。",
    }),
    shown.length
      ? el(
          "ul",
          { class: "grid gallery-grid", "aria-label": "最近的墨迹" },
          shown.map((g, i) => galleryCard(g, i)),
        )
      : el("p", { class: "muted", text: "尚无墨迹。" }),
    el("div", { class: "actions" }, [button({ text: "返回枢纽", onclick: () => navigate("hub") })]),
  ]);

  root.appendChild(section);
  // canvas 要量到真实尺寸才铺得准，等它进了文档再落笔。
  scheduleReplayAll({ silent: true });

  return function dispose() {
    for (const timer of timers) window.clearTimeout(timer);
    timers.clear();
    for (const card of cards) card.stop();
  };

  function galleryCard(item, index) {
    const meta = strokeKeyByType(item.type);
    const name = meta?.name ?? item.type;
    const precision = Math.round((item.precision || 0) * 100);
    const traced = hasTrace(item);

    const caption = el("span", { class: "gallery-name", text: name });
    const grade = el("span", { class: "muted", text: `精度 ${precision}%` });

    if (!traced) {
      // 旧档没有笔路，用标准字形占位，别给一块空白的纸。
      const li = el("li", { class: "gallery-cell" }, [
        el("div", { class: "card gallery-item is-static" }, [
          el("span", { class: "gallery-paper" }, [strokeGlyph(item.type, { width: CANVAS_W, height: CANVAS_H })]),
          el("span", { class: "gallery-meta" }, [caption, grade, el("span", { class: "muted gallery-flag", text: "无笔路" })]),
        ]),
      ]);
      cards.push({ node: li, stop() {}, replay() {}, traced: false });
      return li;
    }

    const canvas = el("canvas", { class: "gallery-canvas", width: CANVAS_W, height: CANVAS_H, "aria-hidden": "true" });
    let stop = null;

    const play = ({ silent = false } = {}) => {
      stop?.();
      // 卡片只有巴掌大，笔压收一点，免得一笔就把整张纸吃满。
      stop = replayOnCanvas(canvas, item.points, { reducedMotion: reduced, pressure: CARD_PRESSURE, seed: index + 1 });
      if (!silent) playStroke(item.type);
    };

    const trigger = button(
      {
        class: "gallery-item card gallery-replay",
        "aria-label": `重放第 ${index + 1} 笔 ${name}，精度 ${precision}%`,
        onclick: () => {
          play();
          announce(`重放 ${name}`);
        },
      },
      [
        el("span", { class: "gallery-paper" }, [canvas]),
        el("span", { class: "gallery-meta" }, [caption, grade]),
        srOnly(`${when(item.at)}落笔`),
      ],
    );

    const li = el("li", { class: "gallery-cell" }, [trigger]);
    cards.push({
      node: li,
      traced: true,
      replay: play,
      stop() {
        stop?.();
        stop = null;
      },
    });
    return li;
  }

  function scheduleReplayAll({ silent = false } = {}) {
    let slot = 0;
    for (const card of cards) {
      if (!card.traced) continue;
      const delay = reduced ? 0 : slot * STAGGER_MS;
      slot += 1;
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        card.replay({ silent });
      }, delay);
      timers.add(timer);
    }
  }

  function replayAll() {
    for (const timer of timers) window.clearTimeout(timer);
    timers.clear();
    // 一次只出一声，二十几笔齐鸣会很吵。
    const first = shown.find(hasTrace);
    if (first) playStroke(first.type);
    scheduleReplayAll({ silent: true });
    announce("重放全部墨迹");
  }
}

function hasTrace(item) {
  return Array.isArray(item?.points) && item.points.length >= 2;
}

function prefersReducedMotion(save) {
  if (save?.settings?.reducedMotion) return true;
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}

function when(at) {
  const t = Number(at);
  if (!Number.isFinite(t)) return "";
  try {
    return new Date(t).toLocaleString("zh-CN", { hour12: false });
  } catch {
    return "";
  }
}
