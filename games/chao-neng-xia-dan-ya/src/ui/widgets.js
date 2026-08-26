/** 复用型 UI 组件（英雄头像、卡片、羁绊条、模式卡）。 */
import { SCHOOLS, ELEMENTS, RACES } from "../core/catalog.js";
import { heroLevel, heroStar } from "../core/progress.js";
import { drawHero, drawHeroPortrait } from "./art.js";
import { bar, el, stars } from "./dom.js";

export function heroCanvas(hero, size = 64, mode = "portrait") {
  const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
  const canvas = document.createElement("canvas");
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  canvas.className = "hero-canvas";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  if (mode === "full") drawHero(ctx, hero, size / 2, size * 0.68, { size: size * 0.52 });
  else drawHeroPortrait(ctx, hero, size / 2, size / 2, size * 0.9);
  return canvas;
}

export function schoolTag(schoolId) {
  const s = SCHOOLS[schoolId] ?? { name: schoolId, color: "#ffd447", icon: "◈" };
  return el("span", { class: "tag", style: { color: s.color, borderColor: s.color } }, [`${s.icon} ${s.name}`]);
}

export function elementTag(elementId) {
  if (!elementId || elementId === "none") return null;
  const e = ELEMENTS[elementId];
  return el("span", { class: "tag", style: { color: e.color, borderColor: e.color } }, [`${e.icon} ${e.name}`]);
}

export function heroCard(hero, save, opts = {}) {
  const lv = heroLevel(save, hero.id);
  const star = heroStar(save, hero.id);
  const owned = save.owned.includes(hero.id);
  const card = el(
    "button",
    {
      type: "button",
      class: `hero-card ${opts.selected ? "selected" : ""} ${owned ? "" : "locked"} ${opts.class ?? ""}`.trim(),
      onclick: opts.onClick,
      dataset: { hero: hero.id },
    },
    [
      el("div", { class: "hero-card-art" }, [heroCanvas(hero, opts.size ?? 62, opts.art ?? "portrait")]),
      el("div", { class: "hero-card-info" }, [
        el("div", { class: "hero-card-name" }, [hero.name, owned ? null : el("span", { class: "lock", text: "未解锁" })]),
        el("div", { class: "hero-card-tags" }, [schoolTag(hero.school), elementTag(hero.element)]),
        owned ? el("div", { class: "hero-card-meta" }, [`Lv.${lv}`, stars(star, 5)]) : null,
      ]),
      opts.badge ? el("span", { class: "hero-card-badge", text: opts.badge }) : null,
    ],
  );
  return card;
}

export function bondList(bonds) {
  if (!bonds.length) return el("p", { class: "muted small", text: "未激活羁绊 · 同流派 2 人起效" });
  return el(
    "div",
    { class: "bond-list" },
    bonds.map((b) => {
      const s = SCHOOLS[b.school];
      return el("span", { class: "bond", style: { color: s.color, borderColor: s.color } }, [
        `${s.icon} ${b.name} ×${b.count} · ${b.label} 攻击 +${Math.round(b.atk * 100)}%`,
      ]);
    }),
  );
}

export function statRow(label, value, color) {
  return el("div", { class: "stat-row" }, [
    el("span", { class: "stat-label", text: label }),
    el("span", { class: "stat-value", style: color ? { color } : {}, text: String(value) }),
  ]);
}

export function hpBar(ratio, label) {
  const b = bar(ratio, { color: ratio > 0.35 ? "linear-gradient(90deg,#7ee08a,#3ee0c5)" : "linear-gradient(90deg,#ff4d6d,#ff8a3d)" });
  return el("div", { class: "hp-wrap" }, [b, el("span", { class: "hp-label", text: label })]);
}

export function raceName(id) {
  return RACES[id]?.name ?? id;
}

export function screenHeader(app, title, subtitle, onBack) {
  const gold = el("b", { text: String(Math.round(app.save.gold)) });
  // 金币在同屏内也会变动（扫荡、升级、钓鱼），订阅存档事件实时刷新；
  // 节点随屏幕卸载后自动退订。
  const off = app.bus.on("save", () => {
    if (!gold.isConnected) {
      off();
      return;
    }
    gold.textContent = String(Math.round(app.save.gold));
  });
  return el("header", { class: "screen-head" }, [
    onBack === false
      ? null
      : el("button", { class: "icon-btn", type: "button", onclick: onBack ?? (() => app.back()), text: "‹" }),
    el("div", { class: "screen-head-text" }, [
      el("h2", { text: title }),
      subtitle ? el("p", { class: "muted small", text: subtitle }) : null,
    ]),
    el("div", { class: "screen-head-gold" }, [el("span", { class: "coin", text: "🪙" }), gold]),
  ]);
}
