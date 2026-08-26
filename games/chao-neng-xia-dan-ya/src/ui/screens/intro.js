import { ARTIFACTS, RAID_SECONDS, RAID_TIERS } from "../../modes/index.js";
import { button, el, fmt, mount } from "../dom.js";
import { screenHeader } from "../widgets.js";

export const rogueIntroScreen = {
  id: "rogueIntro",
  mount(app, root) {
    mount(root, 
      screenHeader(app, "极限挑战", "肉鸽无尽波次 · 养成不生效"),
      el("div", { class: "scroll-body" }, [
        el("div", { class: "info-box" }, [
          el("h4", { text: "规则" }),
          el("ul", {}, [
            el("li", { text: "全队按统一 Lv.5 出战，等级、星级、图鉴加成全部不生效。" }),
            el("li", { text: "敌人一波接一波，越打越强；每 5 波出现精英魔王。" }),
            el("li", { text: "每 2 波弹出三选一：加入新英雄，或获得永久神器（本局有效）。" }),
            el("li", { text: "生命归零结束，记录最高波次。" }),
          ]),
        ]),
        el("div", { class: "info-box" }, [
          el("h4", { text: `神器池（${ARTIFACTS.length} 件）` }),
          el("div", { class: "artifact-list" },
            ARTIFACTS.map((a) => el("span", { class: "artifact-chip" }, [el("b", { text: a.name }), el("span", { class: "muted small", text: a.desc })])),
          ),
        ]),
        el("p", { class: "hint", text: `历史最高波次：${app.save.bestRogueWave ?? 0}` }),
        el("div", { class: "row-actions" }, [
          button("开始挑战", () => app.navigate("battle", { mode: "rogue" }), { variant: "primary", icon: "🎲" }),
          button("返回", () => app.back(), { variant: "ghost" }),
        ]),
      ]),
    );
    return { onKey(e) { if (e.key === "Escape") app.back(); } };
  },
};

export const raidIntroScreen = {
  id: "raidIntro",
  mount(app, root) {
    mount(root, 
      screenHeader(app, "讨伐魔王", `${RAID_SECONDS} 秒极限输出`),
      el("div", { class: "scroll-body" }, [
        el("div", { class: "info-box" }, [
          el("h4", { text: "规则" }),
          el("ul", {}, [
            el("li", { text: `限时 ${RAID_SECONDS} 秒，魔王被击倒后立刻以更强形态重生。` }),
            el("li", { text: "养成、羁绊、渔获 BUFF 全部生效，尽情堆伤害。" }),
            el("li", { text: "结算按累计总伤害发放档位奖励。" }),
          ]),
        ]),
        el("div", { class: "info-box" }, [
          el("h4", { text: "奖励档位" }),
          el("div", { class: "tier-list" },
            RAID_TIERS.map((t) =>
              el("div", { class: "tier-row" }, [
                el("b", { text: t.label }),
                el("span", { class: "muted small", text: `伤害 ≥ ${fmt(t.min)}` }),
                el("span", { text: `🪙${t.gold} 💠${t.shards}` }),
              ]),
            ),
          ),
        ]),
        el("p", { class: "hint", text: `历史最高伤害：${fmt(app.save.bestRaidDamage ?? 0)}` }),
        el("div", { class: "row-actions" }, [
          button("开始讨伐", () => app.navigate("battle", { mode: "raid" }), { variant: "primary", icon: "🔥" }),
          button("返回", () => app.back(), { variant: "ghost" }),
        ]),
      ]),
    );
    return { onKey(e) { if (e.key === "Escape") app.back(); } };
  },
};
