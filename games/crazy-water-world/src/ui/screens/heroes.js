// 英雄屏：招募、升星、委任。委任是把英雄按到具体建筑上（world 的产出加成读它）。
// 名单分两栏：「可招募」是还能上船的人，「已在船」只做点名不做按钮 —— 招募区
// 不再混着一排点不动的「已在船上」按钮。伤病也在这里露脸：养伤中的英雄不能委任。
import { recruit, assignHero, starUp, canRecruit, injuryRemaining, isInjured } from "../../heroes/index.js";
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
      h("p", { class: "cww-hint", id: "hero-pool-hint" }),
      h("h3", { class: "cww-sub", id: "hero-pool-title", text: "可招募" }),
      h("div", { id: "hero-pool" }),
      h("h3", { class: "cww-sub", id: "hero-aboard-title", text: "已在船" }),
      h("div", { id: "hero-aboard" }),
    ]);
    ctx.refs.heroes = {
      hint: el.querySelector("#hero-hint"),
      poolHint: el.querySelector("#hero-pool-hint"),
      poolTitle: el.querySelector("#hero-pool-title"),
      pool: el.querySelector("#hero-pool"),
      aboardTitle: el.querySelector("#hero-aboard-title"),
      aboard: el.querySelector("#hero-aboard"),
      roster: el.querySelector("#hero-roster"),
    };
    return el;
  },

  update(ctx) {
    const s = ctx.state;
    const r = ctx.refs.heroes;
    const hasRadio = s.buildings.some((b) => b.type === "radio");
    const hurt = s.heroes.filter((x) => isInjured(s, x));

    setText(
      r.hint,
      s.heroes.length
        ? `在船 ${s.heroes.length} 位${hurt.length ? `（${hurt.length} 位养伤中）` : ""}。委任到建筑能加产出，出战按星级算战力。碎片 ${Math.floor(s.resources.shard || 0)} 片。`
        : "船上还没英雄。第一位免费上船，之后要广播站。",
    );

    const rosterSig = s.heroes
      .map((x) => `${x.id}:${x.star}:${x.assignedBuildingId || "-"}:${isInjured(s, x) ? "hurt" : "ok"}`)
      .concat(s.buildings.map((b) => `${b.id}:${b.level}`))
      .join("|");
    rebuildIf(r.roster, rosterSig || "empty", () => {
      if (!s.heroes.length) return [h("p", { class: "cww-empty", text: "名单空空，先去呼救。" })];
      return s.heroes.map((hero) => {
        const def = HEROES[hero.heroKey];
        const need = hero.star * 10;
        const assigned = s.buildings.find((b) => b.id === hero.assignedBuildingId);
        const injured = isInjured(s, hero);
        const select = h("select", { class: "cww-sel", "data-assign": hero.id, disabled: injured }, [
          h("option", { value: "", text: "未委任", selected: !assigned }),
          ...s.buildings.map((b) =>
            h("option", { value: b.id, text: buildingLabel(s, b), selected: assigned?.id === b.id }),
          ),
        ]);
        return h("div", { class: `cww-card${injured ? " hurt" : ""}` }, [
          h("b", { text: `${def?.name || hero.heroKey} ` }),
          h("span", { class: "cww-star", text: stars(hero.star) }),
          h("span", {
            class: `cww-tag ${def?.rarity || ""}`,
            text: `${RARITY_LABEL[def?.rarity] || "?"} · ${ROLE_LABEL[def?.role] || def?.role || ""}`,
          }),
          injured ? h("span", { class: "cww-tag lock", id: `hero-hurt-${hero.id}`, text: "养伤中" }) : null,
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
            class: `cww-hint${injured ? " bad" : ""}`,
            id: `hero-note-${hero.id}`,
            text: injured
              ? "战场上挂了彩，抬回来养着，暂时不能上班也不能出战。"
              : assigned
                ? `正在 ${buildingLabel(s, assigned)} 上班，产出 +${Math.round(hero.star * 12)}%${def?.assign?.likes === assigned.type ? "（对口岗位，加成翻倍）" : ""}`
                : `没岗位。擅长：${BUILDINGS[def?.assign?.likes]?.name || "都行"}`,
          }),
        ]);
      });
    });

    // 养伤倒计时逐帧只改文本，不重建卡片。
    for (const hero of hurt) {
      setText(
        r.roster.querySelector(`#hero-note-${hero.id}`),
        `战场上挂了彩，还要养 ${Math.ceil(injuryRemaining(s, hero))} 秒才能上岗出战。`,
      );
    }

    // 呼救名单：可招募 / 已在船 两栏，不再让「已在船上」占着招募按钮的位置。
    const all = Object.values(HEROES);
    const aboard = all.filter((def) => s.heroes.some((x) => x.heroKey === def.key));
    const pool = all.filter((def) => !aboard.includes(def));
    setText(
      r.poolHint,
      hasRadio
        ? `广播站在线，${pool.length} 位还能呼过来。`
        : s.heroes.length
          ? `没有广播站，呼不到人。名单里还剩 ${pool.length} 位。`
          : "第一位免费上船，之后要广播站。",
    );
    setText(r.poolTitle, `可招募 ${pool.length}`);
    setText(r.aboardTitle, `已在船 ${aboard.length}`);

    const poolSig = `${pool.map((d) => d.key).join(",")}|${hasRadio}|${s.heroes.length}`;
    rebuildIf(r.pool, poolSig, () => {
      if (!pool.length) return [h("p", { class: "cww-empty", text: "名单见底了，全员都在船上。" })];
      return pool.map((def) => {
        const check = canRecruit(s, def.key);
        return h("div", { class: "cww-card" }, [
          h("b", { text: def.name }),
          h("span", { class: `cww-tag ${def.rarity}`, text: RARITY_LABEL[def.rarity] || def.rarity }),
          h("span", { class: "cww-tag", text: ROLE_LABEL[def.role] || def.role }),
          h("p", { text: def.blurb }),
          h("button", {
            "data-act": "recruit",
            "data-key": def.key,
            text: check.ok ? "招募" : "需要广播站",
            disabled: !check.ok,
          }),
          check.ok ? null : h("span", { class: "cww-hint bad", text: check.message || "现在招不动" }),
        ]);
      });
    });

    const aboardSig = aboard.map((d) => d.key).join(",") || "none";
    rebuildIf(r.aboard, aboardSig, () => {
      if (!aboard.length) return [h("p", { class: "cww-empty", text: "还没人上船。" })];
      return aboard.map((def) =>
        h("div", { class: "cww-card aboard" }, [
          h("b", { text: def.name }),
          h("span", { class: `cww-tag ${def.rarity}`, text: RARITY_LABEL[def.rarity] || def.rarity }),
          h("span", { class: "cww-tag", text: "已在船" }),
        ]),
      );
    });
  },

  action(ctx, act, el) {
    if (act === "recruit") {
      const key = el.dataset.key;
      const before = ctx.state;
      const check = canRecruit(before, key);
      const next = check.ok ? recruit(before, key) : before;
      if (next === before) {
        ctx.toast(failLine(check, "招不动这位"), "bad");
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
    const before = ctx.state;
    const next = assignHero(before, heroId, buildingId);
    if (next === before) {
      ctx.toast("委任没成：这位可能还在养伤。", "bad");
      ctx.sfx("deny");
      return true;
    }
    ctx.store.replace(next);
    ctx.sfx("order");
    ctx.toast(
      buildingId
        ? `委任完成：${HEROES[next.heroes.find((x) => x.id === heroId)?.heroKey]?.name || "英雄"} 去上班了。`
        : "卸任了，回去躺着。",
      "good",
    );
    return true;
  },
};
