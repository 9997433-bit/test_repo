import { HERO_CATALOG, computeBonds } from "../../core/catalog.js";
import { MODES, TOTAL_STAGES } from "../../modes/index.js";
import { button, el } from "../dom.js";
import { bondList, heroCanvas } from "../widgets.js";

export const menuScreen = {
  id: "menu",
  mount(app, root) {
    const save = app.save;
    const { bonds } = computeBonds(save.roster);
    const dexOwned = Object.values(save.dex ?? {}).filter(Boolean).length;
    app.audio.setMood("menu");

    const logo = el("div", { class: "logo" }, [
      el("h1", { class: "logo-title", text: "超能下蛋鸭" }),
      el("p", { class: "logo-sub", text: "滑动瞄准 · 蓄力爆蛋 · 禽类天团" }),
    ]);

    const squad = el("div", { class: "squad-strip" },
      save.roster.map((id) => {
        const hero = HERO_CATALOG.find((h) => h.id === id);
        return hero ? el("div", { class: "squad-chip" }, [heroCanvas(hero, 46), el("span", { text: hero.name })]) : null;
      }),
    );

    const summary = el("div", { class: "menu-summary" }, [
      el("div", { class: "summary-item" }, [el("b", { text: String(Math.round(save.gold)) }), el("span", { text: "金币" })]),
      el("div", { class: "summary-item" }, [el("b", { text: `${save.adventureStage - 1}/${TOTAL_STAGES}` }), el("span", { text: "关卡" })]),
      el("div", { class: "summary-item" }, [el("b", { text: `${dexOwned}/${HERO_CATALOG.length}` }), el("span", { text: "图鉴" })]),
      el("div", { class: "summary-item" }, [el("b", { text: String(save.towerFloor) }), el("span", { text: "塔层" })]),
    ]);

    const modeGrid = el("div", { class: "mode-grid" },
      MODES.map((m) =>
        el("button", { class: `mode-card mode-${m.id}`, type: "button", onclick: () => go(m.id) }, [
          el("span", { class: "mode-icon", text: m.icon }),
          el("span", { class: "mode-name", text: m.name }),
          el("span", { class: "mode-desc", text: m.desc }),
        ]),
      ),
    );

    const buffNote = save.fishBuff
      ? el("p", { class: "buff-note", text: `🎣 渔获加持：${save.fishBuff.name}（剩余 ${save.fishBuff.battles} 场）` })
      : null;

    const footer = el("div", { class: "menu-footer" }, [
      button("编队", () => app.navigate("team"), { icon: "🐤" }),
      button("图鉴", () => app.navigate("codex"), { icon: "📖" }),
      button("设置", () => app.navigate("settings"), { icon: "⚙" }),
    ]);

    root.append(
      logo,
      squad,
      bondList(bonds),
      summary,
      buffNote,
      modeGrid,
      footer,
      el("p", { class: "caps-line", text: `模块状态 ${app.caps}` }),
    );

    function go(id) {
      app.audio.play("ui");
      if (id === "adventure") app.navigate("adventure");
      else if (id === "rogue") app.navigate("rogueIntro");
      else if (id === "tower") app.navigate("tower");
      else if (id === "raid") app.navigate("raidIntro");
      else if (id === "fishing") app.navigate("fishing");
    }

    return {
      onKey(e) {
        if (e.key === "Enter") go("adventure");
      },
    };
  },
};
