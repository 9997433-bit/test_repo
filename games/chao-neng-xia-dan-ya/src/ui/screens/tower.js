import { TOWER_FLOORS, sweepReward, towerTheme } from "../../modes/index.js";
import { button, clear, el, fmt, mount } from "../dom.js";
import { screenHeader } from "../widgets.js";

export const towerScreen = {
  id: "tower",
  mount(app, root) {
    const body = el("div", { class: "scroll-body" });
    mount(root, screenHeader(app, "试炼之塔", `当前 ${app.save.towerFloor} 层 / 共 ${TOWER_FLOORS} 层`), body);

    function sweep(floor) {
      const r = sweepReward(floor);
      app.addGold(r.gold);
      const target = app.save.roster[floor % app.save.roster.length];
      if (target) app.addShards(target, r.shards);
      app.persist();
      app.audio.play("charged");
      app.toast(`扫荡第 ${floor} 层：+${r.gold} 金币，+${r.shards} 碎片`);
      render();
    }

    function sweepAll() {
      const cleared = app.save.towerFloor - 1;
      if (cleared <= 0) return app.toast("还没有可扫荡的层", "warn");
      let gold = 0;
      let shards = 0;
      for (let f = 1; f <= cleared; f++) {
        const r = sweepReward(f);
        gold += r.gold;
        shards += r.shards;
      }
      app.addGold(gold);
      const target = app.save.roster[0];
      if (target) app.addShards(target, shards);
      app.persist();
      app.audio.play("win");
      app.toast(`一键扫荡 ${cleared} 层：+${fmt(gold)} 金币，+${shards} 碎片`);
      render();
    }

    function render() {
      const cur = app.save.towerFloor;
      const grid = el("div", { class: "tower-grid" },
        Array.from({ length: TOWER_FLOORS }, (_, i) => {
          const floor = i + 1;
          const cleared = floor < cur;
          const current = floor === cur;
          const locked = floor > cur;
          return el(
            "button",
            {
              type: "button",
              class: `tower-floor theme-${towerTheme(floor)} ${cleared ? "cleared" : ""} ${current ? "current" : ""} ${locked ? "locked" : ""}`,
              onclick: () => {
                if (locked) return app.toast("先打通下面的层", "warn");
                if (cleared) return sweep(floor);
                app.audio.play("ui");
                app.navigate("battle", { mode: "tower", floor });
              },
            },
            [
              el("b", { text: String(floor) }),
              el("span", { class: "small", text: floor % 10 === 0 ? "守层魔王" : cleared ? "扫荡" : current ? "挑战" : "🔒" }),
            ],
          );
        }),
      );

      mount(clear(body), 
        el("p", { class: "hint", text: "已通过的层可点击扫荡快速结算资源；当前层点击进入挑战。每 10 层是守层魔王。" }),
        grid,
        el("div", { class: "row-actions" }, [
          button(`挑战第 ${Math.min(cur, TOWER_FLOORS)} 层`, () => app.navigate("battle", { mode: "tower", floor: Math.min(cur, TOWER_FLOORS) }), { variant: "primary", icon: "🗼" }),
          button("一键扫荡", sweepAll, { icon: "⚡" }),
          button("返回", () => app.back(), { variant: "ghost" }),
        ]),
      );
    }

    render();
    return { onKey(e) { if (e.key === "Escape") app.back(); } };
  },
};
