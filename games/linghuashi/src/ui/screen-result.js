import { announce, button, el } from "./dom.js";
import { STAGES } from "../data/stages.js";
import { playCue } from "../audio/index.js";

export function renderResult({ root, store, navigate }) {
  const save = store.get();
  const win = save.lastResult === "win";
  const stage = STAGES.find((s) => s.id === save.lastStage);
  const reward = save.lastReward;
  const unlocked = Boolean(save.inkJustUnlocked);

  const section = el("section", { class: "screen hero" }, [
    el("div", { class: "stamp", "aria-hidden": "true", text: win ? "胜" : "败" }),
    el("p", { class: "sub", text: stage?.name ?? "秘境" }),
    el("h2", { class: "brand", tabindex: "-1", "data-autofocus": true, text: win ? "墨痕已定" : "纸尽锋折" }),
    el("p", { text: win ? "秘境留下灵气丹与残页。" : "再绘一次，笔锋会更准。" }),
    reward ? el("p", { class: "card reward-card", text: `所得：修为 ${reward.xp} · 灵气丹 ${reward.qiPills}` }) : null,
    unlocked ? el("p", { class: "card notice", role: "status", text: "画阁六式齐备，隐线「墨客」已可在选职处点选。" }) : null,
    el("div", { class: "actions" }, [
      button({ class: "primary", text: "回枢纽", onclick: () => navigate("hub") }),
      button({ text: "再战", onclick: () => navigate("battle") }),
      button({ text: "画阁", onclick: () => navigate("gallery") }),
    ]),
  ]);

  root.appendChild(section);
  announce(win ? "此战得胜。" : "此战落败。", { assertive: true });
  playCue(unlocked ? "unlock" : win ? "win" : "lose");
  if (unlocked) store.set({ inkJustUnlocked: false });
  return null;
}
