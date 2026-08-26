import { CHAPTERS, STAGES, stagesOfChapter } from "../../modes/index.js";
import { button, clear, el, mount, stars } from "../dom.js";
import { screenHeader } from "../widgets.js";

export const adventureScreen = {
  id: "adventure",
  mount(app, root, params = {}) {
    const save = app.save;
    let chapter = params.chapter ?? Math.min(CHAPTERS.length, Math.ceil(save.adventureStage / 4));
    const body = el("div", { class: "scroll-body" });
    mount(root, screenHeader(app, "冒险关卡", `进度 ${save.adventureStage - 1}/${STAGES.length}`), body);

    function render() {
      const tabs = el("div", { class: "chapter-tabs" },
        CHAPTERS.map((c) => {
          const unlocked = save.adventureStage > (c.id - 1) * 4;
          return el("button", {
            type: "button",
            class: `chip ${chapter === c.id ? "on" : ""} ${unlocked ? "" : "disabled"}`,
            onclick: () => {
              if (!unlocked) return app.toast("先通关上一章", "warn");
              chapter = c.id;
              app.audio.play("ui");
              render();
            },
            text: `${c.id}. ${c.name}`,
          });
        }),
      );

      const info = CHAPTERS.find((c) => c.id === chapter);
      const list = stagesOfChapter(chapter);
      const grid = el("div", { class: "stage-grid" },
        list.map((stage) => {
          const unlocked = save.adventureStage >= stage.index;
          const earned = save.stageStars?.[stage.id] ?? 0;
          return el(
            "button",
            {
              type: "button",
              class: `stage-card theme-${stage.theme} ${unlocked ? "" : "locked"} ${stage.boss ? "boss" : ""}`,
              onclick: () => {
                if (!unlocked) return app.toast("尚未解锁", "warn");
                app.audio.play("ui");
                app.navigate("battle", { mode: "adventure", stageIndex: stage.index });
              },
            },
            [
              el("span", { class: "stage-id", text: stage.id }),
              el("span", { class: "stage-name", text: stage.name }),
              stage.boss ? el("span", { class: "stage-boss", text: "BOSS" }) : null,
              unlocked ? stars(earned, 3) : el("span", { class: "lock", text: "🔒" }),
              el("span", { class: "stage-reward", text: `🪙${stage.rewards.gold} · 💠${stage.rewards.shards}` }),
            ],
          );
        }),
      );

      mount(clear(body), 
        tabs,
        el("div", { class: "chapter-info" }, [
          el("h3", { text: `第 ${info.id} 章 · ${info.name}` }),
          el("p", { class: "muted small", text: info.desc }),
        ]),
        grid,
        el("div", { class: "row-actions" }, [
          button("继续主线", () => {
            const next = Math.min(STAGES.length, save.adventureStage);
            app.navigate("battle", { mode: "adventure", stageIndex: next });
          }, { variant: "primary", icon: "▶" }),
          button("编队", () => app.navigate("team"), { icon: "🐤" }),
        ]),
      );
    }

    render();
    return { onKey(e) { if (e.key === "Escape") app.back(); } };
  },
};
