// 海盗袭击结算（events.js pirate_raid 的战斗侧消费入口）。
//
// 这一层只做「一次袭击怎么算账」，不做事件生命周期：world.event 的
// telegraph/active/清空由世界层写，本文件只读它拿事件 id，从不回写。
// 所有数值都从表里取（EVENTS.pirate_raid + stages.raidWave），战斗代码零改动。
//
// 依赖边说明：本文件是 combat 与 heroes 的唯一汇合点（selectLineup 决定谁上、
// applyBattleInjuries 决定谁挂彩），直接 import heroes 的叶子模块而不是门面，
// 因此不构成环（heroes/lineup.js、heroes/roster.js 都不 import combat）。
import { EVENTS } from "../data/events.js";
import { raidWave, STAGE_RULES } from "../data/stages.js";
import { RESOURCE_META } from "../data/resources.js";
import { REASON, allow, deny } from "../core/reasons.js";
import { hashSeed } from "../core/rng.js";
import { MAX_LINEUP, selectLineup } from "../heroes/lineup.js";
import { applyBattleInjuries, TICK_SECONDS, nowSeconds } from "../heroes/roster.js";
import { MAX_SIDE, simulateBattle } from "./battle.js";

export const RAID_EVENT_ID = "pirate_raid";
// 玩家能点的两个键；缺省（null/undefined/"auto"/"timeout"）走表里的 autoResolve。
export const RAID_CHOICES = ["fight", "hide"];
export const RAID_TEAM_CAP = Math.min(STAGE_RULES.teamCap, MAX_LINEUP, MAX_SIDE);
const AUTO_CHOICE = new Set(["", "auto", "timeout"]);
const LOG_LIMIT = 24;

function round1(n) {
  return Math.round(n * 10) / 10;
}

function pushLog(state, lines) {
  return [...lines, ...(state.log || [])].slice(0, LOG_LIMIT);
}

function resName(key) {
  return RESOURCE_META[key] ? RESOURCE_META[key].name : key;
}

/** 事件 id：显式参数 > state.world.event（字符串或 { id } 对象）> 默认海盗袭击。 */
function eventIdOf(state, wanted) {
  if (typeof wanted === "string" && wanted) return wanted;
  const ev = state && state.world ? state.world.event : null;
  if (typeof ev === "string" && ev) return ev;
  if (ev && typeof ev === "object" && typeof ev.id === "string" && ev.id) return ev.id;
  return RAID_EVENT_ID;
}

function optionsOf(opts) {
  // 第三参可以直接传 nowSec（世界层手边就是这个数），也可以传选项对象。
  if (Number.isFinite(opts)) return { nowSec: opts };
  return opts && typeof opts === "object" ? opts : {};
}

/**
 * 袭击战种子：袭击不属于任何关卡，attempts 那撮重试盐用不上，
 * 于是按 (存档种子, 事件 id, 量子序号) 另派一撮——同一量子内重复调用结果一致，
 * 换个量子就是另一场仗，且完全可复现。
 */
export function raidSeed(state, eventId = RAID_EVENT_ID, nowSec) {
  const worldSeed =
    state && state.meta && Number.isFinite(state.meta.seed) ? state.meta.seed >>> 0 : 0;
  const at = Number.isFinite(nowSec) ? nowSec : nowSeconds(state);
  const stamp = Math.round(at / TICK_SECONDS) >>> 0;
  return hashSeed(`cww-raid|${worldSeed}|${eventId}|${stamp}`);
}

/** 袭击波：以最高通关关卡为底 × 表里的 wavePowerMult，5 人，可直接喂 simulateBattle。 */
export function raidEnemies(state, powerMult, eventId = RAID_EVENT_ID) {
  const def = EVENTS[eventId];
  const tabled = def && def.effect ? def.effect.wavePowerMult : undefined;
  const mult = Number.isFinite(powerMult) ? powerMult : Number.isFinite(tabled) ? tabled : 1;
  const best = state && state.campaign ? state.campaign.bestStage : 0;
  return raidWave(best, mult);
}

/**
 * 掠夺账：lossPool 里每种资源各扣自己现存量的 pct
 * （= 总损失按现存量加权，仓库越满被抢得越多），仓库空就什么都不掉。
 */
function lossPlan(state, pct, pool) {
  const rate = Number.isFinite(pct) && pct > 0 ? pct : 0;
  const keys = Array.isArray(pool) ? pool : [];
  const bag = (state && state.resources) || {};
  const losses = [];
  if (!rate) return losses;
  for (const key of keys) {
    const have = Number.isFinite(bag[key]) ? bag[key] : 0;
    const lost = Math.min(have, round1(have * rate));
    if (lost > 0) losses.push({ key, amount: lost });
  }
  return losses;
}

/** 永远返回新对象：调用方接着往里记奖励，绝不能碰到入参那份 resources。 */
function applyLosses(state, losses) {
  const resources = { ...(state.resources || {}) };
  for (const { key, amount } of losses) {
    resources[key] = round1(Math.max(0, (Number.isFinite(resources[key]) ? resources[key] : 0) - amount));
  }
  return resources;
}

function lossText(losses) {
  return losses.map((l) => `${resName(l.key)}×${l.amount}`).join("、");
}

function gainText(gains) {
  return gains.map((g) => (g.key === "coins" ? `${g.amount} 金币` : `${resName(g.key)}×${g.amount}`)).join(" · ");
}

/**
 * 能不能这么结算。失败码沿用 core/reasons：
 *   E_UNKNOWN_TYPE  事件表里没有这个 id / 它不是袭击事件；
 *   E_INVALID_ARG   choice 不是 fight|hide（也不是缺省的 auto/timeout）；
 *   E_LOCKED        选了迎战但一个能上场的人都没有（全员养伤或还没招人）。
 * 成功时把结算计划一并带回（allies/enemies/seed/losses/gains），
 * previewRaid 与 runRaid 共用同一份，UI 看到的和真打出来的必然一致。
 */
export function canResolveRaid(state, choice, opts) {
  if (!state || typeof state !== "object") return deny(REASON.INVALID_ARG, { message: "没有存档可结算" });
  const o = optionsOf(opts);
  const eventId = eventIdOf(state, o.eventId);
  const def = EVENTS[eventId];
  if (!def || def.kind !== "raid" || !def.resolve) {
    return deny(REASON.UNKNOWN_TYPE, { eventId, message: "现在没有袭击要打" });
  }

  const auto = choice === null || choice === undefined || AUTO_CHOICE.has(choice);
  const picked = auto ? def.autoResolve : choice;
  if (typeof picked !== "string" || !def.resolve[picked]) {
    return deny(REASON.INVALID_ARG, {
      eventId,
      choice,
      allowed: RAID_CHOICES.filter((k) => def.resolve[k]),
      message: "只能迎战或者躲起来",
    });
  }

  const plan = def.resolve[picked];
  const onLose = def.effect && def.effect.onLose ? def.effect.onLose : {};
  const pool = plan.lossPool || onLose.lossPool || [];
  const fights = !plan.skipBattle;
  const allies = fights ? selectLineup(state, RAID_TEAM_CAP) : [];
  if (fights && !allies.length) {
    return deny(REASON.LOCKED, {
      eventId,
      choice: picked,
      message: "没人能上场，硬撑不如躲一手",
    });
  }

  return allow({
    eventId,
    def,
    plan,
    choice: picked,
    auto,
    fights,
    allies,
    enemies: fights ? raidEnemies(state, o.powerMult, eventId) : [],
    seed: fights ? (Number.isFinite(o.seed) ? o.seed >>> 0 : raidSeed(state, eventId, o.nowSec)) : 0,
    // 躲藏是固定损，迎战是打输了才损；两条都提前算好，preview 才能把代价摊开写。
    losses: lossPlan(state, plan.skipBattle ? plan.resourceLossPct : onLose.resourceLossPct, pool),
    gains: [
      ...(Number.isFinite(plan.rewardCoins) && plan.rewardCoins > 0
        ? [{ key: "coins", amount: plan.rewardCoins }]
        : []),
      ...(Number.isFinite(plan.rewardBadge) && plan.rewardBadge > 0
        ? [{ key: "badge", amount: plan.rewardBadge }]
        : []),
    ],
  });
}

/**
 * 只读预览：告诉 UI 这一手要押上什么——谁上场、对面几个人、赢了拿什么、输了赔什么。
 * 不掷战斗、不碰 state，失败时把 canResolveRaid 的 reason 原样带出来。
 */
export function previewRaid(state, choice, opts) {
  const check = canResolveRaid(state, choice, opts);
  if (!check.ok) {
    return { ok: false, reason: check.reason, message: check.message, choice: check.choice ?? choice };
  }
  return {
    ok: true,
    reason: REASON.OK,
    eventId: check.eventId,
    name: check.def.name,
    choice: check.choice,
    auto: check.auto,
    fights: check.fights,
    seed: check.seed,
    allies: check.allies,
    enemies: check.enemies,
    gains: check.gains,
    losses: check.losses,
    lossText: lossText(check.losses),
    gainText: gainText(check.gains),
  };
}

/**
 * 结算一次袭击并把战报带回来（UI 要逐行播战报，世界 tick 只要新 state）。
 *
 * fight：selectLineup 取己方 → raidWave 取对面 → raidSeed + simulateBattle →
 *        赢按 resolve.fight 发 coins/徽章，没赢（含 24 回合平局）按 effect.onLose
 *        从 lossPool 扣 → applyBattleInjuries 让阵亡的人挂彩离岗。
 * hide： 不打，固定按 resolve.hide.resourceLossPct 扣一笔浮财。
 *
 * 返回 { ok, reason, state, ... }；失败时 state 就是入参原引用。
 */
export function runRaid(state, choice, opts) {
  const check = canResolveRaid(state, choice, opts);
  if (!check.ok) {
    return {
      ok: false,
      reason: check.reason,
      message: check.message,
      state,
      choice: check.choice ?? choice,
      result: null,
      won: false,
      gains: [],
      losses: [],
      lines: [],
    };
  }

  const o = optionsOf(opts);
  const { def, plan, eventId } = check;
  const result = check.fights ? simulateBattle(check.seed, check.allies, check.enemies) : null;
  const won = !!result && result.winner === "ally";
  // 平局也算没打退：海盗照样上船翻仓库。
  const gains = won ? check.gains : [];
  const losses = check.fights ? (won ? [] : check.losses) : check.losses;

  const lines = [];
  if (!check.fights) {
    lines.push(
      `${plan.log || `${def.name}：躲过去了。`}${losses.length ? `（少了 ${lossText(losses)}）` : "（这回连浮财都没被摸走）"}`,
    );
  } else if (won) {
    lines.push(`${plan.log || `${def.name}：打赢了。`}${gains.length ? `（${gainText(gains)}）` : ""}`);
  } else {
    const tail = losses.length ? `（少了 ${lossText(losses)}）` : "（仓库空得他们骂骂咧咧地走了）";
    lines.push(
      `${def.name}：${result.winner === "draw" ? "缠斗到天黑，没能把黑帆赶走" : "木筏被踩了一遍"}。${tail}`,
    );
  }

  const player = { ...(state.player || {}) };
  const resources = applyLosses(state, losses);
  for (const g of gains) {
    if (g.key === "coins") player.coins = (Number.isFinite(player.coins) ? player.coins : 0) + g.amount;
    else if (g.key === "diamonds")
      player.diamonds = (Number.isFinite(player.diamonds) ? player.diamonds : 0) + g.amount;
    else resources[g.key] = round1((Number.isFinite(resources[g.key]) ? resources[g.key] : 0) + g.amount);
  }

  let next = { ...state, player, resources, log: pushLog(state, lines) };
  // 伤病收口仍在 heroes 层：阵亡的人挂养伤计时并自动离岗，tick 走过就自己归队。
  if (result) next = applyBattleInjuries(next, result, o.injurySeconds);

  return {
    ok: true,
    reason: REASON.OK,
    state: next,
    eventId,
    choice: check.choice,
    auto: check.auto,
    fights: check.fights,
    seed: check.seed,
    allies: check.allies,
    enemies: check.enemies,
    result,
    won,
    gains,
    losses,
    lines,
  };
}

/**
 * 世界 tick / UI 的一行式入口：结算海盗袭击，返回新 state。
 *
 * @param {object} state  完整 GameState。
 * @param {"fight"|"hide"|"auto"|null} [choice]  缺省走表里的 autoResolve（海盗 = hide）。
 * @param {number|object} [opts]  nowSec，或 { nowSec, eventId, powerMult, seed, injurySeconds }。
 * @returns {object} 新 state；结算不成立（见 canResolveRaid 的失败码）时返回入参原引用。
 */
export function resolveRaid(state, choice, opts) {
  return runRaid(state, choice, opts).state;
}
