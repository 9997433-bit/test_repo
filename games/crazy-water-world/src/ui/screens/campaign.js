// 关卡屏：选关、5v5 出战阵容、逐行播放战报。
// 三条接线纪律（Round 2）：
//   1) 阵容取自 heroes/lineup.js 的 selectLineup / readyHeroes —— UI 不再自己 slice(0,5)，
//      也不复刻「保前排 / 排伤员 / 战力排序」的判定，勾选只是把候选名单交给同一个函数。
//   2) 战斗种子取自 combat 的 battleSeed（吃 campaign.attempts 这撮重试盐），
//      结算后一律过 applyBattleInjuries：阵亡的己方英雄当场挂彩离岗。
//   3) 首通奖励（含 Boss 关的升星碎片）战前就摊开写清楚，别让老大猜。
import { simulateBattle, battleSeed } from "../../combat/index.js";
import {
  selectLineup,
  readyHeroes,
  heroPower,
  injuryRemaining,
  applyBattleInjuries,
  MAX_LINEUP,
} from "../../heroes/index.js";
import { STAGES, STAGE_RULES } from "../../data/stages.js";
import { HEROES, RARITY_MULT } from "../../data/heroes.js";
import { h, setText, setClass, setDisabled, setHidden, rebuildIf, append } from "../dom.js";
import { num, quip, resName } from "../copy.js";

const LINE_SEC = 0.055;
const TEAM_CAP = Math.min(STAGE_RULES.teamCap, MAX_LINEUP);
const LANE_LABEL = { front: "前排", back: "后排" };

function stars(n) {
  return "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));
}

function laneOf(heroKey) {
  return HEROES[heroKey]?.lane === "back" ? "back" : "front";
}

/**
 * 出战名单。picked = null 表示交给 selectLineup 自动配队；
 * picked 是数组时先把候选缩到勾选集合，仍旧由 selectLineup 决定上场序与保前排规则。
 * 无论哪条路，伤员都由 readyHeroes 挡在门外。
 */
function lineupOf(state, picked) {
  if (!Array.isArray(picked)) return selectLineup(state, TEAM_CAP);
  if (!picked.length) return [];
  const chosen = new Set(picked);
  return selectLineup({ ...state, heroes: state.heroes.filter((x) => chosen.has(x.id)) }, TEAM_CAP);
}

function rewardLine(def, first) {
  const once = Object.entries(def.firstClear || {}).map(([k, v]) =>
    k === "coins" ? `${v} 金币` : k === "diamonds" ? `${v} 钻石` : `${resName(k)}×${v}`,
  );
  const every = `${def.exp} 经验 · ${resName("hourglass")}×${def.hourglass}${def.reward?.coins ? ` · ${def.reward.coins} 金币` : ""}`;
  if (!first) return `已首通。重打只发 ${every} 的 ${STAGE_RULES.replayRewardMult} 倍，首通奖励不重发。`;
  return `通关发 ${every}；首通再加：${once.join(" · ") || "无"}。`;
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
    // 首通一次性奖励：Boss 关的 shard 是升星碎片的关卡来源，必须进账也必须写进手账。
    for (const [k, v] of Object.entries(def.firstClear || {})) {
      if (k === "coins") {
        player.coins += v;
        gains.push(`${v} 金币`);
      } else if (k === "diamonds") {
        player.diamonds += v;
        gains.push(`${v} 钻石`);
      } else {
        resources[k] = (resources[k] || 0) + v;
        gains.push(`${resName(k)}×${v}`);
      }
    }
  }
  return { resources, player, gains, shard: first ? def.firstClear?.shard || 0 : 0 };
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
      h("p", { class: "cww-hint", id: "camp-reward" }),
      h("div", { class: "cww-row" }, [
        h("b", { id: "camp-team-title", text: "出战阵容" }),
        h("span", { class: "cww-tag", id: "camp-team-count" }),
        h("span", { class: "cww-tag", id: "camp-seed" }),
      ]),
      h("p", { class: "cww-hint", id: "camp-team" }),
      // 主行动排在选人之前：面板是滚动容器，「出战」不能被阵容列表挤到看不见的地方。
      h("div", { class: "cww-row" }, [
        h("button", { "data-act": "fight", id: "camp-fight", text: "出战" }),
        h("button", { "data-act": "skip", id: "camp-skip", text: "跳过战报" }),
        h("button", { "data-act": "lineup-auto", id: "camp-auto", text: "自动配队" }),
        h("button", { "data-act": "lineup-clear", id: "camp-clear", text: "全部下场" }),
      ]),
      h("div", { id: "camp-lineup" }),
      h("div", { class: "cww-banner", id: "camp-banner", style: { display: "none" } }),
      h("div", { class: "cww-side", id: "camp-side" }),
      h("div", { class: "cww-report", id: "camp-report" }),
    ]);
    ctx.refs.campaign = {
      no: el.querySelector("#camp-no"),
      best: el.querySelector("#camp-best"),
      intro: el.querySelector("#camp-intro"),
      enemies: el.querySelector("#camp-enemies"),
      reward: el.querySelector("#camp-reward"),
      count: el.querySelector("#camp-team-count"),
      seed: el.querySelector("#camp-seed"),
      auto: el.querySelector("#camp-auto"),
      clear: el.querySelector("#camp-clear"),
      lineup: el.querySelector("#camp-lineup"),
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
      def
        ? `敌方 ${def.enemies.length} 人：${def.enemies.map((e) => `${e.name}(${e.hp}血/${e.atk}攻)`).join("、")}`
        : "",
    );
    const firstTime = !!def && def.id > s.campaign.bestStage;
    setText(r.reward, def ? rewardLine(def, firstTime) : "");
    setClass(r.reward, "good", firstTime && !!def?.firstClear?.shard);

    updateLineup(ctx, s, c, r, def);
    updateReport(ctx, c, r);
  },

  action(ctx, act, el) {
    const c = ctx.ui.campaign;
    if (act === "stage-prev") {
      c.stage = Math.max(1, (c.stage || 1) - 1);
      return true;
    }
    if (act === "stage-next") {
      c.stage = Math.min(STAGES.length, (c.stage || 1) + 1);
      return true;
    }
    if (act === "lineup-auto") {
      c.picked = null;
      ctx.sfx("tap");
      ctx.toast(`自动配队：战力前 ${TEAM_CAP} 人，缺前排就补一个。`);
      return true;
    }
    if (act === "lineup-clear") {
      c.picked = [];
      ctx.sfx("tap");
      return true;
    }
    if (act === "pick") {
      togglePick(ctx, c, el?.dataset?.id);
      return true;
    }
    if (act === "skip") {
      if (c.report) c.report.shown = c.report.result.log.length;
      return true;
    }
    if (act !== "fight") return false;
    return fight(ctx, c);
  },
};

// ------------------------------------------------------------------ 阵容
function togglePick(ctx, c, heroId) {
  const s = ctx.state;
  if (!heroId) return;
  const ready = readyHeroes(s);
  const hero = ready.find((x) => x.id === heroId);
  if (!hero) {
    ctx.toast("这位还在养伤，上不了场。", "bad");
    ctx.sfx("deny");
    return;
  }
  const picked = new Set(lineupOf(s, c.picked).map((u) => u.id));
  if (picked.has(heroId)) {
    picked.delete(heroId);
  } else if (picked.size >= TEAM_CAP) {
    ctx.toast(`最多 ${TEAM_CAP} 个人上船，先撤下一个。`, "bad");
    ctx.sfx("deny");
    return;
  } else {
    picked.add(heroId);
  }
  c.picked = [...picked];
  ctx.sfx("tap");
}

function updateLineup(ctx, s, c, r, def) {
  const ready = readyHeroes(s);
  const readyIds = new Set(ready.map((x) => x.id));
  const units = lineupOf(s, c.picked);
  const order = new Map(units.map((u, i) => [u.id, i + 1]));
  const auto = !Array.isArray(c.picked);
  const front = units.filter((u) => laneOf(u.heroKey) === "front").length;

  setText(r.count, `${units.length}/${TEAM_CAP} 人 · 前排 ${front} / 后排 ${units.length - front}`);
  setClass(r.count, "lock", !units.length);
  setClass(r.auto, "on", auto);

  const seed = def ? battleSeed(s, def.id) : 0;
  const tries = s.campaign.attempts || 0;
  setText(r.seed, def ? `${tries ? `第 ${tries + 1} 次尝试` : "首次挑战"} · 种子 ${seed}` : "");

  // 候选名单：能上场的按战力排序（readyHeroes 的序），伤员单独垫底并写倒计时。
  const injured = s.heroes.filter((x) => !readyIds.has(x.id) && HEROES[x.heroKey]);
  const sig = [
    ready.map((x) => `${x.id}:${x.star}:${order.get(x.id) || 0}`).join(","),
    injured.map((x) => x.id).join(","),
    auto ? "auto" : "manual",
  ].join("|");

  c.tickers = c.tickers || [];
  rebuildIf(r.lineup, sig, () => {
    c.tickers = [];
    if (!ready.length && !injured.length) {
      return [h("p", { class: "cww-empty", text: "一个英雄都没有。先去英雄屏呼救。" })];
    }
    const lanes = ["front", "back"].map((lane) => {
      const members = ready.filter((x) => laneOf(x.heroKey) === lane);
      return h("div", { class: "cww-lane" }, [
        h("span", { class: "cww-lane-tag", text: `${LANE_LABEL[lane]} · ${lane === "front" ? "先挨打" : "躲后面"}` }),
        ...(members.length
          ? members.map((hero) => heroChip(hero, order.get(hero.id), auto))
          : [h("span", { class: "cww-empty", text: "这一排没人" })]),
      ]);
    });
    if (!injured.length) return lanes;
    return [
      ...lanes,
      h("div", { class: "cww-lane hurt" }, [
        h("span", { class: "cww-lane-tag", text: "养伤中 · 不可出战" }),
        ...injured.map((hero) => {
          const tick = h("i", { text: "" });
          c.tickers.push({ id: hero.id, el: tick });
          return h("button", { class: "cww-pickhero hurt", "data-act": "pick", "data-id": hero.id, disabled: true }, [
            h("b", { text: `${HEROES[hero.heroKey].name} ${stars(hero.star)}` }),
            tick,
          ]);
        }),
      ]),
    ];
  });

  // 养伤倒计时每帧只改文本，不重建节点。
  for (const t of c.tickers) {
    const hero = s.heroes.find((x) => x.id === t.id);
    setText(t.el, hero ? `还要养 ${Math.ceil(injuryRemaining(s, hero))} 秒` : "");
  }

  setText(
    r.team,
    units.length
      ? `上场顺序：${units.map((u, i) => `${i + 1}.${HEROES[u.heroKey]?.name || u.heroKey}★${u.star}`).join(" ")}${auto ? "（自动配队，点名字可以自己挑）" : ""}`
      : ready.length
        ? "一个人都没选，光靠嘴打不赢。点上面的名字派人。"
        : injured.length
          ? "全员挂彩，等他们养好再来。"
          : "队伍是空的。先去英雄屏招人。",
  );
  setClass(r.team, "bad", !units.length);
  setDisabled(r.fight, !def || !units.length);
  setDisabled(r.clear, !units.length);
}

function heroChip(hero, slot, auto) {
  const def = HEROES[hero.heroKey];
  const on = !!slot;
  return h(
    "button",
    {
      class: `cww-pickhero${on ? " on" : ""}`,
      "data-act": "pick",
      "data-id": hero.id,
      "aria-pressed": on ? "true" : "false",
      title: `${def.skill?.name || "无技能"}：${def.skill?.desc || "—"}`,
    },
    [
      // 勾选态不只靠底色：名字前面直接写「✓序号」，灰度截图里也分得出谁上场。
      h("b", { text: `${on ? `✓${slot} ` : "＋ "}${def.name} ${stars(hero.star)}` }),
      h("span", {
        text: `${LANE_LABEL[laneOf(hero.heroKey)]} · 战力 ${Math.round(heroPower(hero.heroKey, hero.star))}${on && auto ? " · 自动" : ""}`,
      }),
    ],
  );
}

// ------------------------------------------------------------------ 战报
function updateReport(ctx, c, r) {
  const rep = c.report;
  const done = !rep || rep.shown >= rep.result.log.length;
  setHidden(r.side, !rep);
  // 播完就把「跳过」收起来：没得跳的按钮留在那儿只会骗点击。
  setHidden(r.skip, done);
  setDisabled(r.skip, done);
  if (!rep) {
    if (r.banner.style.display !== "none") r.banner.style.display = "none";
    rebuildIf(r.report, "empty", () => [
      h("div", { class: "cww-empty", text: "还没打过。出战后这里放战报。" }),
    ]);
    return;
  }

  r.banner.style.display = "block";
  // 新战报第一次露面时把面板滚到横幅上：战报排在阵容下面，不滚就得让老大自己找。
  if (rep.scrollPending) {
    rep.scrollPending = false;
    const panel = ctx.refs.left;
    if (panel) {
      panel.scrollTop +=
        r.banner.getBoundingClientRect().top - panel.getBoundingClientRect().top - 44;
    }
  }
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
      slice.map((line) => h("div", { class: /→/.test(line) ? "" : "skill", text: line })),
    );
    rep.rendered = want;
    r.report.scrollTop = r.report.scrollHeight;
  }

  rebuildIf(r.side, `${rep.key}:side`, () =>
    rep.result.leftover.map((u) =>
      h("div", { class: `cww-hp ${u.side === "enemy" ? "enemy" : ""} ${u.hp <= 0 ? "dead" : ""}` }, [
        h("span", { text: `${u.side === "ally" ? "我" : "敌"} ${u.name}` }),
        h("i", {}, [
          h("b", { style: { width: `${Math.min(100, (u.hp / (rep.maxHp[u.id] || u.hp || 1)) * 100)}%` } }),
        ]),
        h("span", { text: num(u.hp) }),
      ]),
    ),
  );
}

// ------------------------------------------------------------------ 出战
function fight(ctx, c) {
  const s = ctx.state;
  const def = STAGES[c.stage - 1];
  if (!def) return true;

  const allies = lineupOf(s, c.picked);
  if (!allies.length) {
    ctx.toast("先选出战的人，老大。空手上去只有挨打的份。", "bad");
    ctx.sfx("deny");
    return true;
  }

  // 种子归 combat 层：hash(存档种子, 关卡, 重试次数) —— 重试能换结果，回放能复现。
  const seed = battleSeed(s, def.id);
  const result = simulateBattle(seed, allies, def.enemies);
  const first = def.id > s.campaign.bestStage;
  const won = result.winner === "ally";
  const fallen = result.leftover.filter((u) => u.side === "ally" && u.hp <= 0);

  let next;
  if (won) {
    const { resources, player, gains, shard } = grant(s, def.id, def, first);
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
      log: [
        `${def.name} 通关（${result.duration} 回合）：${gains.join(" · ")}。${shard ? `碎片 +${shard}，够升星了。` : ""}`,
        ...s.log,
      ].slice(0, 24),
    };
    c.stage = Math.min(STAGES.length, def.id + 1);
    ctx.sfx("win");
  } else {
    next = {
      ...s,
      campaign: { ...s.campaign, attempts: (s.campaign.attempts || 0) + 1 },
      log: [
        `${def.name} 没打过（${result.winner === "draw" ? "拖成平局" : "全军覆没"}）。${quip()}`,
        ...s.log,
      ].slice(0, 24),
    };
    ctx.sfx("hit");
  }
  // 伤病收口在 heroes 层：阵亡的己方英雄挂养伤计时并自动离岗，tick 走过就自己归队。
  next = applyBattleInjuries(next, result);
  ctx.store.replace(next);

  const hurtLine = fallen.length ? `${fallen.length} 人抬去养伤。` : "";
  c.report = {
    key: `${seed}-${next.meta.tick}-${next.campaign.attempts}`,
    result,
    headline: won
      ? `拿下 ${def.name}！${result.duration} 回合`
      : result.winner === "draw"
        ? `24 回合平局。输出不够，老大。`
        : `${def.name} 失守。第 ${next.campaign.attempts} 次尝试`,
    shown: 0,
    rendered: 0,
    scrollPending: true,
    maxHp: hpTable(def, allies, result),
  };
  ctx.toast(
    won ? `${def.name} 通关！${next.log[0]}` : `打输了。${hurtLine}换个阵容或者先升星，${quip()}`,
    won ? "good" : "bad",
  );
  return true;
}

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
    if (!hero) continue;
    const growth = Number.isFinite(hero.growth) ? hero.growth : 0.18;
    table[a.id] = hero.base.hp * RARITY_MULT[hero.rarity] * (1 + (a.star - 1) * growth);
  }
  return table;
}
