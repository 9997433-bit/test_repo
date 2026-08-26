import { HERO_CATALOG, RACES, SCHOOLS, computeRaceTech } from "../../core/catalog.js";
import { ENEMY_LIST } from "../../core/bestiary.js";
import { dexBonus } from "../../core/progress.js";
import { button, clear, el } from "../dom.js";
import { elementTag, heroCanvas, raceName, schoolTag, screenHeader } from "../widgets.js";

export const codexScreen = {
  id: "codex",
  mount(app, root) {
    let tab = "heroes";
    const body = el("div", { class: "scroll-body" });
    const owned = () => Object.values(app.save.dex ?? {}).filter(Boolean).length;
    root.append(screenHeader(app, "图鉴", "收集度提供全局攻击加成（上限 +15%）"), body);

    function heroesTab() {
      const bonus = dexBonus(app.save, HERO_CATALOG.length);
      const tech = computeRaceTech(app.save.dex);
      return [
        el("div", { class: "codex-summary" }, [
          el("div", {}, [el("b", { text: `${owned()}/${HERO_CATALOG.length}` }), el("span", { text: "已收集" })]),
          el("div", {}, [el("b", { text: `+${(bonus * 100).toFixed(1)}%` }), el("span", { text: "全局攻击" })]),
          ...Object.keys(RACES).map((r) =>
            el("div", {}, [el("b", { text: `+${Math.round((tech.bonus[r] ?? 0) * 100)}%` }), el("span", { text: `${raceName(r)}族` })]),
          ),
        ]),
        el("div", { class: "codex-grid" },
          HERO_CATALOG.map((hero) => {
            const has = !!app.save.dex?.[hero.id];
            return el("button", { type: "button", class: `codex-card ${has ? "" : "locked"}`, onclick: () => show(hero, has) }, [
              heroCanvas(hero, 58, "full"),
              el("b", { text: has ? hero.name : "？？？" }),
              el("span", { class: "muted small", text: has ? SCHOOLS[hero.school]?.name ?? "" : "未收集" }),
            ]);
          }),
        ),
      ];
    }

    function enemiesTab() {
      return [
        el("p", { class: "hint", text: "已登场敌人的属性与抗性。负数抗性代表该元素克制它。" }),
        el("div", { class: "codex-list" },
          ENEMY_LIST.map((e) =>
            el("div", { class: "codex-row" }, [
              el("span", { class: "dot", style: { background: e.color } }),
              el("div", {}, [
                el("b", { text: e.name }),
                el("span", { class: "muted small", text: `HP ${e.hp} · 护甲 ${e.armor ?? 0} · 接触伤害 ${e.touch ?? 0}` }),
                el("span", { class: "muted small", text: `抗性 火${Math.round((e.resist?.fire ?? 0) * 100)}% 冰${Math.round((e.resist?.ice ?? 0) * 100)}% 雷${Math.round((e.resist?.thunder ?? 0) * 100)}%` }),
              ]),
              e.boss ? el("span", { class: "tag", text: "BOSS" }) : e.elite ? el("span", { class: "tag", text: "精英" }) : null,
            ]),
          ),
        ),
      ];
    }

    function show(hero, has) {
      app.audio.play("ui");
      app.modal((box, close) => {
        box.append(
          el("div", { class: "detail-head" }, [
            heroCanvas(hero, 96, "full"),
            el("div", {}, [
              el("h3", { text: has ? hero.name : "未收集" }),
              el("div", { class: "hero-card-tags" }, [schoolTag(hero.school), elementTag(hero.element), el("span", { class: "tag", text: raceName(hero.race) })]),
              el("p", { class: "muted small", text: has ? hero.lore ?? "" : "通关或抽取碎片解锁" }),
            ]),
          ]),
          el("div", { class: "skill-box" }, [
            el("h4", { text: "被动" }),
            el("p", { text: has ? hero.passive : "？？？" }),
            el("h4", { text: `大招 · ${has ? hero.ult?.name : "？？？"}` }),
            el("p", { text: has ? hero.ult?.desc : "？？？" }),
          ]),
          el("div", { class: "detail-actions" }, [button("关闭", close, { variant: "ghost" })]),
        );
      });
    }

    function render() {
      clear(body).append(
        el("div", { class: "filter-row" }, [
          el("button", { type: "button", class: `chip ${tab === "heroes" ? "on" : ""}`, onclick: () => { tab = "heroes"; render(); }, text: "英雄" }),
          el("button", { type: "button", class: `chip ${tab === "enemies" ? "on" : ""}`, onclick: () => { tab = "enemies"; render(); }, text: "敌人" }),
        ]),
        ...(tab === "heroes" ? heroesTab() : enemiesTab()),
        el("div", { class: "row-actions" }, [button("返回", () => app.back(), { variant: "ghost" })]),
      );
    }

    render();
    return { onKey(e) { if (e.key === "Escape") app.back(); } };
  },
};
