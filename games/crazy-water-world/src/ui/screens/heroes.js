// 英雄屏：招募、升星、委任。委任是把英雄按到具体建筑上（world 的产出加成读它）。
import { recruit, assignHero, starUp } from "../../heroes/index.js";
import { HEROES } from "../../data/heroes.js";
import { BUILDINGS } from "../../data/buildings.js";
import { h, setText, rebuildIf } from "../dom.js";
import { RARITY_LABEL, ROLE_LABEL, failLine, quip } from "../copy.js";

function stars(n) {
  return "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));
}

function buildingLabel(state, b) {
  return `${BUILDINGS[b.type]?.name || b.type} Lv.${b.level}（${b.x + 1},${b.y + 1}）`;
}

export const heroesScreen = {
  id: "heroes",

  mount(ctx) {
    const el = h("section", {}, [
      h("h2", { text: "英雄" }),
      h("p", { class: "cww-hint", id: "hero-hint" }),
      h("div", { id: "hero-roster" }),
      h("h2", { text: "呼救名单" }),
      h("div", { id: "hero-pool" }),
    ]);
    ctx.refs.heroes = {
      hint: el.querySelector("#hero-hint"),
      roster: el.querySelector("#hero-roster"),
      pool: el.querySelector("#hero-pool"),
    };
    return el;
  },

  update(ctx) {
    const s = ctx.state;
    const r = ctx.refs.heroes;
    const hasRadio = s.buildings.some((b) => b.type === "radio");

    setText(
      r.hint,
      s.heroes.length
        ? `在船 ${s.heroes.length} 位。委任到建筑能加产出，出战按星级算战力。碎片 ${Math.floor(s.resources.shard || 0)} 片。`
        : "船上还没英雄。第一位免费上船，之后要广播站。",
    );

    const rosterSig = s.heroes
      .map((x) => `${x.id}:${x.star}:${x.assignedBuildingId || "-"}`)
      .concat(s.buildings.map((b) => `${b.id}:${b.level}`))
      .join("|");
    rebuildIf(r.roster, rosterSig || "empty", () => {
      if (!s.heroes.length) return [h("p", { class: "cww-empty", text: "名单空空，先去呼救。" })];
      return s.heroes.map((hero) => {
        const def = HEROES[hero.heroKey];
        const need = hero.star * 10;
        const assigned = s.buildings.find((b) => b.id === hero.assignedBuildingId);
        const select = h("select", { class: "cww-sel", "data-assign": hero.id }, [
          h("option", { value: "", text: "未委任", selected: !assigned }),
          ...s.buildings.map((b) =>
            h("option", { value: b.id, text: buildingLabel(s, b), selected: assigned?.id === b.id }),
          ),
        ]);
        return h("div", { class: "cww-card" }, [
          h("b", { text: `${def?.name || hero.heroKey} ` }),
          h("span", { class: "cww-star", text: stars(hero.star) }),
          h("span", { class: `cww-tag ${def?.rarity || ""}`, text: `${RARITY_LABEL[def?.rarity] || "?"} · ${ROLE_LABEL[def?.role] || def?.role || ""}` }),
          h("p", { text: `${def?.skill?.name || "无技能"}：${def?.skill?.desc || "—"}` }),
          h("div", { class: "cww-row" }, [
            h("button", {
              "data-act": "star",
              "data-id": hero.id,
              text: hero.star >= 5 ? "已满星" : `升星（碎片 ${need}）`,
              disabled: hero.star >= 5 || (s.resources.shard || 0) < need,
            }),
            select,
          ]),
          h("p", {
            class: "cww-hint",
            text: assigned
              ? `正在 ${buildingLabel(s, assigned)} 上班，产出 +${Math.round(hero.star * 12)}%${def?.assign?.likes === assigned.type ? "（对口岗位，加成翻倍）" : ""}`
              : `没岗位。擅长：${BUILDINGS[def?.assign?.likes]?.name || "都行"}`,
          }),
        ]);
      });
    });

    const poolSig = `${s.heroes.map((x) => x.heroKey).join(",")}|${hasRadio}`;
    rebuildIf(r.pool, poolSig, () =>
      Object.values(HEROES).map((def) => {
        const owned = s.heroes.some((x) => x.heroKey === def.key);
        const blocked = !owned && !hasRadio && s.heroes.length > 0;
        return h("div", { class: "cww-card" }, [
          h("b", { text: def.name }),
          h("span", { class: `cww-tag ${def.rarity}`, text: RARITY_LABEL[def.rarity] || def.rarity }),
          h("p", { text: def.blurb }),
          h("button", {
            "data-act": "recruit",
            "data-key": def.key,
            text: owned ? "已在船上" : blocked ? "需要广播站" : "招募",
            disabled: owned || blocked,
          }),
        ]);
      }),
    );
  },

  action(ctx, act, el) {
    if (act === "recruit") {
      const key = el.dataset.key;
      const before = ctx.state;
      const next = recruit(before, key);
      if (next === before) {
        ctx.toast(failLine({ message: "招不动这位" }), "bad");
        ctx.sfx("deny");
        return true;
      }
      ctx.store.replace(next);
      ctx.sfx("order");
      ctx.toast(`${HEROES[key]?.name} 上筏了。`, "good");
      return true;
    }
    if (act === "star") {
      const before = ctx.state;
      const next = starUp(before, el.dataset.id);
      if (next === before) {
        ctx.toast(`碎片不够或已满星。${quip()}`, "bad");
        ctx.sfx("deny");
        return true;
      }
      ctx.store.replace(next);
      ctx.sfx("order");
      ctx.toast("升星成功，战力肉眼可见。", "good");
      return true;
    }
    return false;
  },

  change(ctx, el) {
    if (!el.dataset.assign) return false;
    const heroId = el.dataset.assign;
    const buildingId = el.value || null;
    ctx.store.replace(assignHero(ctx.state, heroId, buildingId));
    ctx.sfx("order");
    ctx.toast(
      buildingId
        ? `委任完成：${HEROES[ctx.state.heroes.find((x) => x.id === heroId)?.heroKey]?.name || "英雄"} 去上班了。`
        : "卸任了，回去躺着。",
      "good",
    );
    return true;
  },
};
