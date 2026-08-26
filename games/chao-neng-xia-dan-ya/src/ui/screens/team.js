import { ACTIVE_SCHOOLS, HERO_CATALOG, SCHOOLS, computeBonds, getHero } from "../../core/catalog.js";
import {
  MAX_LEVEL,
  MAX_STAR,
  heroAtk,
  heroLevel,
  heroStar,
  levelCapForStar,
  levelUpCost,
  starGoldCost,
  starLevelRequirement,
  starUpCost,
  tryLevelUp,
  tryStarUp,
} from "../../core/progress.js";
import { button, clear, el, mount, stars } from "../dom.js";
import { bondList, elementTag, heroCanvas, heroCard, raceName, schoolTag, screenHeader } from "../widgets.js";

export const teamScreen = {
  id: "team",
  mount(app, root) {
    let selectedSlot = 0;
    let filter = "all";
    const body = el("div", { class: "scroll-body" });
    mount(root, screenHeader(app, "编队", "5 人上场 · 同流派激活羁绊"), body);

    function pickSlot(i) {
      selectedSlot = i;
      app.audio.play("ui");
      render();
    }

    function assign(heroId) {
      const save = app.save;
      if (!save.owned.includes(heroId)) {
        app.toast("该英雄尚未解锁，通关或抽碎片解锁", "warn");
        return;
      }
      const existing = save.roster.indexOf(heroId);
      if (existing >= 0) {
        const tmp = save.roster[selectedSlot];
        save.roster[selectedSlot] = heroId;
        save.roster[existing] = tmp;
      } else {
        save.roster[selectedSlot] = heroId;
      }
      app.persist();
      app.audio.play("charged");
      selectedSlot = (selectedSlot + 1) % 5;
      render();
    }

    function openDetail(hero) {
      app.audio.play("ui");
      app.modal((box, close) => {
        const draw = () => {
          const save = app.save;
          const lv = heroLevel(save, hero.id);
          const star = heroStar(save, hero.id);
          const shards = save.shards?.[hero.id] ?? 0;
          const cap = levelCapForStar(star);
          const atCap = lv >= cap;
          const nextPerk = hero.starPerks?.find((p) => p.star === star + 1) ?? null;
          mount(clear(box), 
            el("div", { class: "detail-head" }, [
              heroCanvas(hero, 96, "full"),
              el("div", {}, [
                el("h3", { text: hero.name }),
                el("div", { class: "hero-card-tags" }, [schoolTag(hero.school), elementTag(hero.element), el("span", { class: "tag", text: raceName(hero.race) })]),
                el("p", { class: "muted small", text: hero.lore ?? "" }),
              ]),
            ]),
            el("div", { class: "detail-stats" }, [
              el("div", {}, [el("span", { text: "等级" }), el("b", { text: `${lv}/${cap}`, class: atCap ? "capped" : "" })]),
              el("div", {}, [el("span", { text: "星级" }), stars(star, MAX_STAR)]),
              el("div", {}, [el("span", { text: "攻击" }), el("b", { text: heroAtk(save, hero.id).toFixed(1) })]),
              el("div", {}, [el("span", { text: "碎片" }), el("b", { text: String(shards) })]),
            ]),
            el("div", { class: "skill-box" }, [
              el("h4", { text: `被动 · ${hero.skillName ?? "招牌技"}` }),
              el("p", { text: hero.passive ?? "—" }),
              el("h4", { text: `大招 · ${hero.ult?.name ?? "—"}（${hero.ult?.cost ?? 100} 能量）` }),
              el("p", { text: hero.ult?.desc ?? "—" }),
              nextPerk ? el("h4", { text: `${star + 1} 星词条` }) : null,
              nextPerk ? el("p", { class: "muted", text: nextPerk.desc }) : null,
            ]),
            el("div", { class: "detail-actions" }, [
              button(atCap && star < MAX_STAR ? `等级已满 (需升星)` : `升级 (${levelUpCost(lv)} 金)`, () => {
                const r = tryLevelUp(app.save, hero.id);
                if (!r.ok) return app.toast(r.reason, "warn");
                app.persist();
                app.audio.play("charged");
                app.toast(`${hero.name} 升到 Lv.${r.level}`);
                draw();
                render();
              }, { variant: "primary", disabled: lv >= MAX_LEVEL || atCap }),
              button(`升星 (${starUpCost(star)} 碎片 + ${starGoldCost(star)} 金)`, () => {
                const r = tryStarUp(app.save, hero.id);
                if (!r.ok) return app.toast(r.reason, "warn");
                app.persist();
                app.audio.play("win");
                app.toast(`${hero.name} 升到 ${r.star} 星`);
                draw();
                render();
              }, { disabled: star >= MAX_STAR, title: `需 Lv.${starLevelRequirement(star + 1)}` }),
              button("上阵", () => {
                assign(hero.id);
                close();
              }),
              button("关闭", close, { variant: "ghost" }),
            ]),
          );
        };
        draw();
      });
    }

    function render() {
      const save = app.save;
      const { bonds } = computeBonds(save.roster);
      const slotRow = el("div", { class: "slot-row" },
        save.roster.map((id, i) => {
          const hero = getHero(id);
          return el(
            "button",
            { type: "button", class: `slot ${i === selectedSlot ? "active" : ""}`, onclick: () => pickSlot(i) },
            [
              hero ? heroCanvas(hero, 54) : el("span", { class: "slot-empty", text: "+" }),
              el("span", { class: "slot-name", text: hero ? hero.name : "空位" }),
              el("span", { class: "slot-index", text: String(i + 1) }),
            ],
          );
        }),
      );

      const filters = ["all", ...ACTIVE_SCHOOLS];
      const filterRow = el("div", { class: "filter-row" },
        filters.map((f) =>
          el("button", {
            type: "button",
            class: `chip ${filter === f ? "on" : ""}`,
            onclick: () => { filter = f; app.audio.play("ui"); render(); },
            text: f === "all" ? "全部" : SCHOOLS[f].name,
          }),
        ),
      );

      const list = HERO_CATALOG.filter((h) => filter === "all" || h.school === filter);
      const grid = el("div", { class: "hero-grid" },
        list.map((hero) =>
          heroCard(hero, save, {
            selected: save.roster.includes(hero.id),
            badge: save.roster.includes(hero.id) ? String(save.roster.indexOf(hero.id) + 1) : null,
            onClick: () => openDetail(hero),
          }),
        ),
      );

      mount(clear(body), 
        el("p", { class: "hint", text: `点上方槽位选择要替换的位置（当前第 ${selectedSlot + 1} 位），再点下方英雄查看详情并上阵。` }),
        slotRow,
        bondList(bonds),
        filterRow,
        grid,
        el("div", { class: "row-actions" }, [
          button("开始冒险", () => app.navigate("adventure"), { variant: "primary", icon: "🥚" }),
          button("返回", () => app.back(), { variant: "ghost" }),
        ]),
      );
    }

    render();
    return { onKey(e) { if (e.key === "Escape") app.back(); } };
  },
};
