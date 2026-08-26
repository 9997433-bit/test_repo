// 关卡屏：选关、5v5 出战、逐行播放战报。
// 战斗本身是纯函数 simulateBattle(seed, allies, enemies)，UI 只负责给种子、发奖、放战报。
import { simulateBattle } from "../../combat/index.js";
import { STAGES, STAGE_RULES } from "../../data/stages.js";
import { HEROES, RARITY_MULT } from "../../data/heroes.js";
import { hashSeed } from "../../core/rng.js";
import { h, setText, setClass, setDisabled, setHidden, rebuildIf, append } from "../dom.js";
import { num, quip, resName } from "../copy.js";

const LINE_SEC = 0.055;

function teamOf(state) {
  return state.heroes.slice(0, STAGE_RULES.teamCap);
}

// 契约 §8.7：重试要能换结果，回放要能复现 —— 种子吃 (seed, stage, attempts)。
function battleSeed(state, stage) {
  return hashSeed(`${state.meta.seed}:${stage}:${state.campaign.attempts || 0}`);
}

function grant(state, stage, def, first) {
  const mult = first ? 1 : STAGE_RULES.replayRewardMult;
  const resources = { ...state.resources };
  const player = { ...state.player };
  const gains = [];

  const exp = Math.round(def.exp * mult);
  player.exp += exp;
  gains.push(`${exp} 经验`);

  const hourglass = Math.round(def.hourglass * mult);
  if (hourglass > 0) {
    resources.hourglass = (resources.hourglass || 0) + hourglass;
    gains.push(`${resName("hourglass")}×${hourglass}`);
  }
  const coins = Math.round((def.reward?.coins || 0) * mult);
  if (coins > 0) {
    player.coins += coins;
    gains.push(`${coins} 金币`);
  }
  if (first) {
    for (const [k, v] of Object.entries(def.firstClear || {})) {
      if (k === "coins") player.coins += v;
      else if (k === "diamonds") player.diamonds += v;
      else {
        resources[k] = (resources[k] || 0) + v;
        gains.push(`${resName(k)}×${v}`);
      }
    }
  }
  return { resources, player, gains };
}

export const campaignScreen = {
  id: "campaign",

  mount(ctx) {
    const el = h("section", {}, [
      h("h2", { text: "关卡" }),
      h("div", { class: "cww-row" }, [
        h("button", { "data-act": "stage-prev", text: "◀" }),
        h("span", { class: "cww-tag", id: "camp-no" }),
        h("button", { "data-act": "stage-next", text: "▶" }),
        h("span", { class: "cww-tag", id: "camp-best" }),
      ]),
      h("p", { class: "cww-hint", id: "camp-intro" }),
      h("p", { class: "cww-hint", id: "camp-enemies" }),
      h("p", { class: "cww-hint", id: "camp-team" }),
      h("div", { class: "cww-row" }, [
        h("button", { "data-act": "fight", id: "camp-fight", text: "出战" }),
        h("button", { "data-act": "skip", id: "camp-skip", text: "跳过战报" }),
      ]),
      h("div", { class: "cww-banner", id: "camp-banner", style: { display: "none" } }),
      h("div", { class: "cww-side", id: "camp-side" }),
      h("div", { class: "cww-report", id: "camp-report" }),
    ]);
    ctx.refs.campaign = {
      no: el.querySelector("#camp-no"),
      best: el.querySelector("#camp-best"),
      intro: el.querySelector("#camp-intro"),
      enemies: el.querySelector("#camp-enemies"),
      team: el.querySelector("#camp-team"),
      fight: el.querySelector("#camp-fight"),
      skip: el.querySelector("#camp-skip"),
      banner: el.querySelector("#camp-banner"),
      side: el.querySelector("#camp-side"),
      report: el.querySelector("#camp-report"),
    };
    return el;
  },

  enter(ctx) {
    const c = ctx.ui.campaign;
    if (!c.stage) c.stage = ctx.state.campaign.stage;
  },

  update(ctx) {
    const s = ctx.state;
    const c = ctx.ui.campaign;
    const r = ctx.refs.campaign;
    const maxStage = Math.min(STAGES.length, Math.max(1, s.campaign.bestStage + 1));
    c.stage = Math.min(Math.max(1, c.stage || s.campaign.stage), maxStage);
    const def = STAGES[c.stage - 1];

    setText(r.no, def ? `第 ${def.id} 关 · ${def.name}` : "全通关了");
    setClass(r.no, "boss", !!def?.boss);
    setText(r.best, `最佳 ${s.campaign.bestStage} / ${STAGES.length}`);
    setText(r.intro, def ? def.intro : "废海尽头没有别的船了，老大。");
    setText(
      r.enemies,
      def ? `敌方 ${def.enemies.length} 人：${def.enemies.map((e) => `${e.name}(${e.hp}血/${e.atk}攻)`).join("、")}` : "",
    );

    const team = teamOf(s);
    setText(
      r.team,
      team.length
        ? `我方 ${team.length}/${STAGE_RULES.teamCap}：${team.map((x) => `${HEROES[x.heroKey]?.name || x.heroKey}★${x.star}`).join("、")}`
        : "队伍是空的。没人出战就只能派条咸鱼上去。",
    );
    setDisabled(r.fight, !def);

    // 战报逐行播放，播完自动停。跳过按钮把剩下的一次性倒出来。
    const rep = c.report;
    setHidden(r.side, !rep);
    setDisabled(r.skip, !rep || rep.shown >= rep.result.log.length);
    if (!rep) {
      if (r.banner.style.display !== "none") r.banner.style.display = "none";
      rebuildIf(r.report, "empty", () => [h("div", { class: "cww-empty", text: "还没打过。出战后这里放战报。" })]);
      return;
    }

    r.banner.style.display = "block";
    setClass(r.banner, "win", rep.result.winner === "ally");
    setClass(r.banner, "lose", rep.result.winner === "enemy");
    setClass(r.banner, "draw", rep.result.winner === "draw");
    setText(r.banner, rep.headline);

    rep.shown = Math.min(rep.result.log.length, rep.shown + ctx.dt / LINE_SEC);
    const want = Math.floor(rep.shown);
    if (r.report.__sig !== rep.key) {
      r.report.__sig = rep.key;
      r.report.replaceChildren();
      rep.rendered = 0;
    }
    if (rep.rendered < want) {
      const slice = rep.result.log.slice(rep.rendered, want);
      append(
        r.report,
        slice.map((line) =>
          h("div", { class: /→/.test(line) ? "" : "skill", text: line }),
        ),
      );
      rep.rendered = want;
      r.report.scrollTop = r.report.scrollHeight;
    }

    rebuildIf(r.side, `${rep.key}:side`, () =>
      rep.result.leftover.map((u) =>
        h("div", { class: `cww-hp ${u.side === "enemy" ? "enemy" : ""} ${u.hp <= 0 ? "dead" : ""}` }, [
          h("span", { text: `${u.side === "ally" ? "我" : "敌"} ${u.name}` }),
          h("i", {}, [h("b", { style: { width: `${Math.min(100, (u.hp / (rep.maxHp[u.id] || u.hp || 1)) * 100)}%` } })]),
          h("span", { text: num(u.hp) }),
        ]),
      ),
    );
  },

  action(ctx, act) {
    const c = ctx.ui.campaign;
    if (act === "stage-prev") {
      c.stage = Math.max(1, (c.stage || 1) - 1);
      return true;
    }
    if (act === "stage-next") {
      c.stage = Math.min(STAGES.length, (c.stage || 1) + 1);
      return true;
    }
    if (act === "skip") {
      if (c.report) c.report.shown = c.report.result.log.length;
      return true;
    }
    if (act !== "fight") return false;

    const s = ctx.state;
    const def = STAGES[c.stage - 1];
    if (!def) return true;
    const team = teamOf(s);
    const allies = team.length ? team : [{ id: "tmp-mia", heroKey: "mia", star: 1 }];
    const seed = battleSeed(s, def.id);
    const result = simulateBattle(seed, allies, def.enemies);
    const first = def.id > s.campaign.bestStage;
    const won = result.winner === "ally";

    let next;
    if (won) {
      const { resources, player, gains } = grant(s, def.id, def, first);
      next = {
        ...s,
        resources,
        player,
        campaign: {
          ...s.campaign,
          stage: def.id >= s.campaign.stage ? Math.min(STAGES.length, def.id + 1) : s.campaign.stage,
          bestStage: Math.max(s.campaign.bestStage, def.id),
          attempts: 0,
        },
        log: [`${def.name} 通关（${result.duration} 回合）：${gains.join(" · ")}。`, ...s.log].slice(0, 24),
      };
      c.stage = Math.min(STAGES.length, def.id + 1);
      ctx.sfx("win");
    } else {
      next = {
        ...s,
        campaign: { ...s.campaign, attempts: (s.campaign.attempts || 0) + 1 },
        log: [`${def.name} 没打过（${result.winner === "draw" ? "拖成平局" : "全军覆没"}）。${quip()}`, ...s.log].slice(0, 24),
      };
      ctx.sfx("hit");
    }
    ctx.store.replace(next);

    c.report = {
      key: `${seed}-${Date.now()}`,
      result,
      headline: won
        ? `拿下 ${def.name}！${result.duration} 回合`
        : result.winner === "draw"
          ? `24 回合平局。输出不够，老大。`
          : `${def.name} 失守。第 ${next.campaign.attempts} 次尝试`,
      shown: 0,
      rendered: 0,
      maxHp: hpTable(def, allies, result),
    };
    ctx.toast(
      won
        ? `${def.name} 通关！${next.log[0]}`
        : `打输了。换个阵容或者先升星，${quip()}`,
      won ? "good" : "bad",
    );
    return true;
  },
};

// 战报血条要一个分母：敌人取关卡表原始血量，我方按 battle.js 的同一口径重算满血。
function hpTable(def, allies, result) {
  const table = {};
  for (const u of result.leftover) table[u.id] = Math.max(u.hp, 1);
  for (const e of def.enemies) {
    const u = result.leftover.find((it) => it.side === "enemy" && it.id.startsWith(`${e.key}-${e.name}-`));
    if (u) table[u.id] = e.hp;
  }
  for (const a of allies) {
    const hero = HEROES[a.heroKey];
    if (hero) table[a.id] = hero.base.hp * RARITY_MULT[hero.rarity] * (1 + (a.star - 1) * 0.18);
  }
  return table;
}
