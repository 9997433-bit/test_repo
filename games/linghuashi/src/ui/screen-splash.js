import { button, el } from "./dom.js";
import { muteToggle } from "./components.js";
import { CLASSES } from "../data/classes.js";
import { realmById } from "../data/realms.js";

export function renderSplash({ root, store, navigate }) {
  const save = store.get();
  const hasSave = Boolean(save.classId);
  const cls = CLASSES.find((c) => c.id === save.classId);

  const section = el("section", { class: "screen hero" }, [
    el("div", { class: "screen-tools splash-tools" }, [muteToggle(store)]),
    el("div", { class: "stamp", "aria-hidden": "true", text: "印" }),
    el("p", { class: "sub", text: "以笔为刃 · 以画通灵" }),
    el("h1", { class: "brand", tabindex: "-1", "data-autofocus": true, text: "灵画师" }),
    el("p", {
      class: "muted",
      text: "水墨秘境独立卷。绘直线穿云，圈圆护体，折线破军，螺旋布阵。",
    }),
    el("p", {
      class: "muted",
      text: "不便作画？战斗中按数字键 1 至 6，或点击符键条，一样可以出招。",
    }),
    el("div", { class: "actions" }, [
      button({ class: "primary", text: "开卷入世", onclick: () => navigate("class") }),
      button({
        text: "续写残卷",
        "aria-describedby": hasSave ? "splash-save" : null,
        onclick: () => navigate(hasSave ? "hub" : "class"),
      }),
    ]),
    el("p", {
      id: "splash-save",
      class: "muted splash-save",
      text: hasSave ? `残卷：${cls?.name ?? "未择业"} · ${realmById(save.realmId).name} · 修为 ${save.xp}` : "尚无残卷，先择一道途。",
    }),
  ]);

  root.appendChild(section);
  return null;
}
