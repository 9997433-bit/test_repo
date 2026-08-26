import { HERO_CATALOG, getHero } from "../../core/catalog.js";
import { STAGES, TOWER_FLOORS, raidTier } from "../../modes/index.js";
import { button, el, fmt, stars } from "../dom.js";
import { heroCanvas, statRow } from "../widgets.js";

function pickUnlock(save) {
  const locked = HERO_CATALOG.filter((h) => !save.owned.includes(h.id));
  return locked.length ? locked[0] : null;
}

function applyRewards(app, mode, level, result, battleParams) {
  const save = app.save;
  const gained = { gold: 0, shards: [], unlock: null, notes: [] };
  save.stats.battles++;
  if (result.victory) save.stats.wins++;
  save.stats.eggs += result.eggs;
  save.stats.bestCombo = Math.max(save.stats.bestCombo ?? 0, result.comboPeak);

  if (save.fishBuff) {
    save.fishBuff.battles--;
    if (save.fishBuff.battles <= 0) {
      gained.notes.push(`渔获 BUFF「${save.fishBuff.name}」已耗尽`);
      save.fishBuff = null;
    }
  }

  if (mode === "adventure") {
    const base = level.rewards ?? { gold: 80, shards: 6 };
    gained.gold = result.victory ? base.gold + result.gold : Math.round(result.gold);
    if (result.victory) {
      const per = Math.max(1, Math.round(base.shards / Math.max(1, save.roster.length)));
      for (const id of save.roster) {
        app.addShards(id, per);
        gained.shards.push({ id, n: per });
      }
      const prev = save.stageStars[level.id] ?? 0;
      save.stageStars[level.id] = Math.max(prev, result.stars);
      const stageIndex = battleParams.stageIndex ?? save.adventureStage;
      if (stageIndex >= save.adventureStage && save.adventureStage <= STAGES.length) {
        save.adventureStage = Math.min(STAGES.length + 1, stageIndex + 1);
      }
      if (level.boss) {
        const hero = pickUnlock(save);
        if (hero) {
          app.unlockHero(hero.id);
          gained.unlock = hero;
        }
      }
    }
  } else if (mode === "tower") {
    const base = level.rewards ?? { gold: 90, shards: 6 };
    gained.gold = result.victory ? base.gold : Math.round(result.gold);
    if (result.victory) {
      const floor = battleParams.floor ?? save.towerFloor;
      if (floor >= save.towerFloor) save.towerFloor = Math.min(TOWER_FLOORS + 1, floor + 1);
      const per = Math.max(1, Math.round(base.shards / Math.max(1, save.roster.length)));
      for (const id of save.roster) {
        app.addShards(id, per);
        gained.shards.push({ id, n: per });
      }
    }
  } else if (mode === "rogue") {
    save.bestRogueWave = Math.max(save.bestRogueWave ?? 0, result.wave);
    gained.gold = 40 + result.wave * 26;
    gained.notes.push(`最高波次 ${save.bestRogueWave}`);
  } else if (mode === "raid") {
    const tier = raidTier(result.damage);
    save.bestRaidDamage = Math.max(save.bestRaidDamage ?? 0, result.damage);
    gained.gold = tier.gold;
    gained.notes.push(`档位：${tier.label}`);
    const target = save.roster[0];
    if (target) {
      app.addShards(target, tier.shards);
      gained.shards.push({ id: target, n: tier.shards });
    }
  }

  app.addGold(gained.gold);
  app.persist();
  return gained;
}

export const resultScreen = {
  id: "result",
  mount(app, root, params = {}) {
    const { mode = "adventure", level, result, params: battleParams = {} } = params;
    if (!result || !level) {
      root.append(el("p", { class: "hint", text: "没有结算数据" }), button("返回主菜单", () => app.navigate("menu")));
      return {};
    }
    const gained = applyRewards(app, mode, level, result, battleParams);
    app.audio.setMood("menu");

    const victory = result.victory;
    const title = mode === "raid" ? "讨伐结束" : victory ? "通关！" : "失败";

    const rewardRow = el("div", { class: "reward-row" }, [
      el("div", { class: "reward" }, [el("span", { text: "🪙" }), el("b", { text: `+${fmt(gained.gold)}` })]),
      ...gained.shards.slice(0, 5).map((s) => {
        const hero = getHero(s.id);
        return hero ? el("div", { class: "reward" }, [heroCanvas(hero, 30), el("b", { text: `+${s.n}💠` })]) : null;
      }),
    ]);

    const unlockBox = gained.unlock
      ? el("div", { class: "unlock-box" }, [
          heroCanvas(gained.unlock, 84, "full"),
          el("div", {}, [el("h4", { text: `解锁新英雄：${gained.unlock.name}` }), el("p", { class: "muted small", text: gained.unlock.passive })]),
        ])
      : null;

    const nextIndex = (battleParams.stageIndex ?? 0) + 1;
    const hasNext = mode === "adventure" && victory && nextIndex <= STAGES.length;

    root.append(
      el("div", { class: `result-card ${victory ? "win" : "lose"}` }, [
        el("h2", { class: "result-title", text: title }),
        el("p", { class: "muted", text: level.name }),
        mode === "adventure" || mode === "tower" ? stars(result.stars, 3) : null,
        el("div", { class: "result-stats" }, [
          statRow("总伤害", fmt(result.damage), "#ff8a3d"),
          statRow("最高连击", result.comboPeak, "#ff6b9d"),
          statRow(mode === "rogue" ? "到达波次" : "回合数", mode === "rogue" ? result.wave : result.turns),
          statRow("发射蛋数", result.eggs),
          statRow("剩余生命", `${Math.round(result.hpRatio * 100)}%`, "#7ee08a"),
          result.elapsed ? statRow("用时", `${result.elapsed.toFixed(1)}s`) : null,
        ].filter(Boolean)),
        rewardRow,
        unlockBox,
        ...gained.notes.map((n) => el("p", { class: "muted small", text: n })),
        el("div", { class: "detail-actions" }, [
          hasNext
            ? button("下一关", () => app.navigate("battle", { mode: "adventure", stageIndex: nextIndex }, { replace: true }), { variant: "primary", icon: "▶" })
            : null,
          button("再来一次", () => app.navigate("battle", { mode, ...battleParams }, { replace: true }), { icon: "↻" }),
          mode === "adventure" ? button("选关", () => app.navigate("adventure", {}, { replace: true })) : null,
          button("主菜单", () => app.navigate("menu", {}, { replace: true }), { variant: "ghost" }),
        ].filter(Boolean)),
      ]),
    );

    app.audio.play(victory ? "win" : "lose");
    return {
      onKey(e) {
        if (e.key === "Enter" && hasNext) app.navigate("battle", { mode: "adventure", stageIndex: nextIndex }, { replace: true });
        if (e.key === "Escape") app.navigate("menu", {}, { replace: true });
      },
    };
  },
};
