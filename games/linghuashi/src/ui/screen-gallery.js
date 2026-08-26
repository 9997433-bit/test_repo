import { button, el, meter } from "./dom.js";
import { pageHeader, strokeGlyph } from "./components.js";
import { MO_STROKE_TYPES, moProgress } from "../classes/unlock.js";
import { strokeKeyByType } from "./keycast.js";

export function renderGallery({ root, store, navigate }) {
  const save = store.get();
  const items = save.gallery || [];
  const mo = moProgress(save);
  const progress = meter("六式收集进度");
  progress.set(mo.have, mo.need, " 式");

  const section = el("section", { class: "screen" }, [
    pageHeader({ kicker: "墨迹留痕", title: "画阁" }),
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
    el("h3", { class: "gallery-sub", text: "近笔" }),
    items.length
      ? el(
          "ul",
          { class: "grid gallery-grid", "aria-label": "最近的墨迹" },
          [...items].reverse().map((g) =>
            el("li", { class: "card gallery-item" }, [
              el("span", { text: strokeKeyByType(g.type)?.name ?? g.type }),
              el("span", { class: "muted", text: `精度 ${Math.round((g.precision || 0) * 100)}%` }),
            ]),
          ),
        )
      : el("p", { class: "muted", text: "尚无墨迹。" }),
    el("div", { class: "actions" }, [button({ text: "返回枢纽", onclick: () => navigate("hub") })]),
  ]);

  root.appendChild(section);
  return null;
}
