/**
 * 任务系统 — 进度计算与领奖。
 *
 * require.type: furnaceLevel | buildingLevel | resource | battleWins | recruitCount
 * 纯逻辑，无 DOM；data/quests.js 未就绪时使用内置 FALLBACK_QUESTS。
 */
import { clamp } from "../config.js";
import { findHeroDef, grantHero } from "./heroes.js";

export const QUEST_STATUS = { LOCKED: "locked", ACTIVE: "active", READY: "ready", CLAIMED: "claimed" };
export const REQUIRE_TYPES = [
  "furnaceLevel",
  "buildingLevel",
  "resource",
  "battleWins",
  "recruitCount",
  "troopsTrained",
];

/** data/quests.js 用的简写，映射到上面的规范类型（train 为额外支持的第 6 类）。 */
export const REQUIRE_ALIASES = {
  build: "buildingLevel",
  building: "buildingLevel",
  furnace: "furnaceLevel",
  recruit: "recruitCount",
  battle: "battleWins",
  wins: "battleWins",
  res: "resource",
  train: "troopsTrained",
};

/** 这些 reward 键有专门语义，其余数值键一律按资源发放。 */
const RESERVED_REWARD_KEYS = new Set([
  "resources", "tickets", "recruitTickets", "heroXp", "xp", "heroId", "hero", "heroes",
]);

/** 8 条保底任务链；结构与 data/quests.js 一致。 */
export const FALLBACK_QUESTS = [
  {
    id: "q_furnace_2",
    name: "第一炉火",
    desc: "把火炉升到 2 级，压住第一波寒气。",
    require: { type: "furnaceLevel", value: 2 },
    rewards: { resources: { food: 120, wood: 150 } },
  },
  {
    id: "q_sawmill_3",
    name: "伐木不辍",
    desc: "伐木场升到 3 级。",
    require: { type: "buildingLevel", id: "sawmill", value: 3 },
    rewards: { resources: { wood: 220, coal: 60 } },
    unlockAfter: "q_furnace_2",
  },
  {
    id: "q_wood_800",
    name: "囤薪过冬",
    desc: "仓库中木材达到 800。",
    require: { type: "resource", id: "wood", value: 800 },
    rewards: { resources: { coal: 120 }, tickets: 1 },
    unlockAfter: "q_sawmill_3",
  },
  {
    id: "q_recruit_3",
    name: "招贤纳士",
    desc: "累计招募 3 名武将。",
    require: { type: "recruitCount", value: 3 },
    rewards: { resources: { food: 200 }, heroXp: 120 },
  },
  {
    id: "q_first_blood",
    name: "首战告捷",
    desc: "讨伐流寇取得 1 场胜利。",
    require: { type: "battleWins", value: 1 },
    rewards: { resources: { iron: 80, food: 150 }, heroXp: 100 },
  },
  {
    id: "q_coal_500",
    name: "薪火不熄",
    desc: "煤矿产出，储备煤炭 500。",
    require: { type: "resource", id: "coal", value: 500 },
    rewards: { resources: { iron: 120 }, tickets: 1 },
    unlockAfter: "q_wood_800",
  },
  {
    id: "q_wins_5",
    name: "扫清流寇",
    desc: "累计取得 5 场战斗胜利。",
    require: { type: "battleWins", value: 5 },
    rewards: { resources: { iron: 200, food: 300 }, heroXp: 300, tickets: 1 },
    unlockAfter: "q_first_blood",
  },
  {
    id: "q_furnace_5",
    name: "烈焰城心",
    desc: "火炉升到 5 级，并让军医所到 2 级。",
    requires: [
      { type: "furnaceLevel", value: 5 },
      { type: "buildingLevel", id: "clinic", value: 2 },
    ],
    rewards: { resources: { food: 500, wood: 500, coal: 300, iron: 200 }, tickets: 2, heroXp: 400 },
    unlockAfter: "q_furnace_2",
  },
];

/* ------------------------------------------------------------------ */
/* state 读取（对 state.js 的形状保持宽容）                            */
/* ------------------------------------------------------------------ */

function catalogOf(questsCatalog) {
  if (Array.isArray(questsCatalog) && questsCatalog.length) return questsCatalog;
  if (questsCatalog && typeof questsCatalog === "object" && Array.isArray(questsCatalog.quests)) {
    return questsCatalog.quests;
  }
  return FALLBACK_QUESTS;
}

function readBuildingLevel(state, buildingId) {
  if (!state || !buildingId) return 0;
  const sources = [state.city?.buildings, state.buildings, state.city];
  for (const src of sources) {
    if (!src) continue;
    if (Array.isArray(src)) {
      const found = src.find((b) => b && (b.id === buildingId || b.key === buildingId));
      if (found) return Number(found.level) || 0;
      continue;
    }
    if (typeof src === "object") {
      const node = src[buildingId];
      if (typeof node === "number") return node;
      if (node && typeof node === "object") return Number(node.level) || 0;
    }
  }
  return 0;
}

function readFurnaceLevel(state) {
  const direct = state?.city?.furnaceLevel ?? state?.furnaceLevel;
  if (typeof direct === "number") return direct;
  return readBuildingLevel(state, "furnace");
}

function readResource(state, key) {
  if (!key) return 0;
  const bag = state?.resources ?? state?.city?.resources;
  if (!bag || typeof bag !== "object") return 0;
  const v = bag[key];
  if (typeof v === "number") return v;
  if (v && typeof v === "object") return Number(v.amount) || 0;
  return 0;
}

function readTotals(state, key) {
  const totals = state?.stats?.resourceTotals ?? state?.stats?.totals;
  if (totals && typeof totals === "object") return Number(totals[key]) || 0;
  return readResource(state, key);
}

function readBattleWins(state) {
  return Number(state?.stats?.battleWins ?? state?.war?.wins ?? 0) || 0;
}

function readRecruitCount(state) {
  return Number(state?.heroes?.recruitCount ?? state?.stats?.recruitCount ?? 0) || 0;
}

function readTroopsTrained(state) {
  const trained = state?.stats?.troopsTrained;
  if (typeof trained === "number") return trained;
  const troops = state?.army?.troops ?? state?.troops;
  if (!troops || typeof troops !== "object") return 0;
  return ["infantry", "cavalry", "archer"].reduce((sum, t) => sum + (Number(troops[t]) || 0), 0);
}

/** 单条 require 的当前进度值。 */
export function readRequirement(state, require) {
  if (!require || !require.type) return 0;
  const type = REQUIRE_ALIASES[require.type] ?? require.type;
  // data 里的 { type:"build", id:"furnace" } 与规范类型 furnaceLevel 等价。
  if (type === "buildingLevel" && (require.id ?? require.key) === "furnace") {
    return readFurnaceLevel(state);
  }
  switch (type) {
    case "furnaceLevel":
      return readFurnaceLevel(state);
    case "buildingLevel":
      return readBuildingLevel(state, require.id ?? require.key ?? require.building);
    case "resource":
      return require.cumulative
        ? readTotals(state, require.id ?? require.key ?? require.resource)
        : readResource(state, require.id ?? require.key ?? require.resource);
    case "battleWins":
      return readBattleWins(state);
    case "recruitCount":
      return readRecruitCount(state);
    case "troopsTrained":
      return readTroopsTrained(state);
    default:
      return 0;
  }
}

function requirementsOf(quest) {
  if (Array.isArray(quest?.requires) && quest.requires.length) return quest.requires;
  if (quest?.require) return [quest.require];
  return [];
}

function targetOf(quest) {
  return requirementsOf(quest).reduce((sum, r) => sum + (Number(r?.value) || 0), 0);
}

function rewardsOf(quest) {
  return quest?.rewards ?? quest?.reward ?? null;
}

/** data/quests.js 用 next 串主线；反推出"前置任务"表，与 unlockAfter 等价。 */
function predecessorMap(list) {
  const map = new Map();
  for (const quest of list) {
    if (!quest?.next) continue;
    const nexts = Array.isArray(quest.next) ? quest.next : [quest.next];
    for (const id of nexts) if (id && !map.has(id)) map.set(id, quest.id);
  }
  return map;
}

/** 任务当前进度：{ current, target, done, parts[] }。 */
export function questProgress(state, quest) {
  const reqs = requirementsOf(quest);
  const parts = reqs.map((r) => {
    const value = Math.max(0, Number(r?.value) || 0);
    const current = Math.max(0, Number(readRequirement(state, r)) || 0);
    return { type: r?.type, id: r?.id ?? r?.key ?? null, current, target: value, done: current >= value };
  });
  const current = parts.reduce((sum, p) => sum + Math.min(p.current, p.target), 0);
  const target = targetOf(quest);
  return {
    current,
    target,
    parts,
    done: parts.length > 0 && parts.every((p) => p.done),
    ratio: target > 0 ? clamp(current / target, 0, 1) : 0,
  };
}

/* ------------------------------------------------------------------ */
/* 生命周期                                                            */
/* ------------------------------------------------------------------ */

/** 初始化 state.quests（幂等：已存在的进度/领取记录会保留）。 */
export function initQuests(state, questsCatalog) {
  if (!state || typeof state !== "object") throw new TypeError("quests: state required");
  const list = catalogOf(questsCatalog);
  const prev = state.quests && typeof state.quests === "object" ? state.quests : {};
  const prevEntries = prev.entries && typeof prev.entries === "object" ? prev.entries : {};
  const entries = {};
  const order = [];
  for (const quest of list) {
    if (!quest || !quest.id) continue;
    order.push(quest.id);
    const old = prevEntries[quest.id];
    entries[quest.id] = {
      id: quest.id,
      status: old?.status === QUEST_STATUS.CLAIMED ? QUEST_STATUS.CLAIMED : QUEST_STATUS.LOCKED,
      progress: Number(old?.progress) || 0,
      target: targetOf(quest),
      claimedAt: old?.claimedAt ?? null,
    };
  }
  state.quests = {
    entries,
    order,
    claimed: Array.isArray(prev.claimed) ? prev.claimed.filter((id) => entries[id]) : [],
    readyCount: 0,
  };
  tickQuests(state, list);
  return state.quests;
}

/** 刷新全部任务进度/解锁状态，返回本次新完成（可领取）的任务 id。 */
export function tickQuests(state, questsCatalog) {
  const list = catalogOf(questsCatalog);
  if (!state || typeof state !== "object") throw new TypeError("quests: state required");
  if (!state.quests || typeof state.quests !== "object" || !state.quests.entries) {
    state.quests = { entries: {}, order: [], claimed: [], readyCount: 0 };
  }
  const q = state.quests;
  if (!Array.isArray(q.order)) q.order = [];
  if (!Array.isArray(q.claimed)) q.claimed = [];
  const preds = predecessorMap(list);
  const completed = [];
  const ready = [];
  for (const quest of list) {
    if (!quest || !quest.id) continue;
    let entry = q.entries[quest.id];
    if (!entry) {
      entry = q.entries[quest.id] = {
        id: quest.id,
        status: QUEST_STATUS.LOCKED,
        progress: 0,
        target: targetOf(quest),
        claimedAt: null,
      };
      if (!q.order.includes(quest.id)) q.order.push(quest.id);
    }
    if (entry.status === QUEST_STATUS.CLAIMED) continue;

    const gate = quest.unlockAfter ?? preds.get(quest.id);
    const gateOk = !gate || q.entries[gate]?.status === QUEST_STATUS.CLAIMED;
    if (!gateOk) {
      entry.status = QUEST_STATUS.LOCKED;
      entry.progress = 0;
      entry.target = targetOf(quest);
      continue;
    }

    const prog = questProgress(state, quest);
    entry.progress = prog.current;
    entry.target = prog.target;
    const next = prog.done ? QUEST_STATUS.READY : QUEST_STATUS.ACTIVE;
    if (next === QUEST_STATUS.READY && entry.status !== QUEST_STATUS.READY) completed.push(quest.id);
    entry.status = next;
    if (next === QUEST_STATUS.READY) ready.push(quest.id);
  }
  q.readyCount = ready.length;
  return { completed, ready, readyCount: ready.length };
}

/**
 * 领取奖励；未完成 / 已领取 / 未解锁均返回 ok:false。
 * opts.heroCatalog 用于解析 reward.heroId；解析不到时记入 state.heroes.pendingHeroGrants。
 */
export function claimQuest(state, questId, questsCatalog, opts = {}) {
  const list = catalogOf(questsCatalog);
  if (!state.quests || !state.quests.entries) initQuests(state, list);
  const q = state.quests;
  const quest = list.find((item) => item && item.id === questId);
  if (!quest) return { ok: false, reason: "unknown-quest", questId };
  const entry = q.entries[questId];
  if (!entry) return { ok: false, reason: "unknown-quest", questId };
  if (entry.status === QUEST_STATUS.CLAIMED) return { ok: false, reason: "already-claimed", questId };
  if (entry.status === QUEST_STATUS.LOCKED) return { ok: false, reason: "locked", questId };

  const prog = questProgress(state, quest);
  entry.progress = prog.current;
  entry.target = prog.target;
  if (!prog.done) {
    entry.status = QUEST_STATUS.ACTIVE;
    return { ok: false, reason: "incomplete", questId, progress: prog };
  }

  const granted = grantRewards(state, rewardsOf(quest), opts);
  entry.status = QUEST_STATUS.CLAIMED;
  entry.claimedAt = Number(state.day) || 0;
  if (!q.claimed.includes(questId)) q.claimed.push(questId);
  tickQuests(state, list);
  return { ok: true, questId, quest, rewards: granted };
}

/**
 * 支持两种奖励写法：
 *   { resources: { food: 80 }, tickets: 1, heroXp: 100 }   规范form
 *   { food: 80, wood: 120, recruitTickets: 1, heroId: "x" } data/quests.js 的扁平写法
 */
function grantRewards(state, rewards, opts = {}) {
  const applied = { resources: {}, tickets: 0, heroXp: 0, heroes: [] };
  if (!rewards || typeof rewards !== "object") return applied;

  const addResource = (key, raw) => {
    const v = Math.max(0, Math.round(Number(raw) || 0));
    if (!v) return;
    if (!state.resources || typeof state.resources !== "object") state.resources = {};
    state.resources[key] = (Number(state.resources[key]) || 0) + v;
    applied.resources[key] = (applied.resources[key] || 0) + v;
  };

  const bag = rewards.resources && typeof rewards.resources === "object" ? rewards.resources : null;
  if (bag) for (const key of Object.keys(bag)) addResource(key, bag[key]);
  for (const key of Object.keys(rewards)) {
    if (RESERVED_REWARD_KEYS.has(key)) continue;
    if (typeof rewards[key] === "number") addResource(key, rewards[key]);
  }

  const tickets = Math.max(0, Math.round(Number(rewards.tickets ?? rewards.recruitTickets) || 0));
  if (tickets) {
    if (!state.heroes || typeof state.heroes !== "object") state.heroes = {};
    state.heroes.tickets = (Number(state.heroes.tickets) || 0) + tickets;
    applied.tickets = tickets;
  }

  const heroXp = Math.max(0, Math.round(Number(rewards.heroXp ?? rewards.xp) || 0));
  if (heroXp) {
    const roster = Array.isArray(state.heroes?.roster) ? state.heroes.roster : [];
    const deployed = Array.isArray(state.heroes?.deployed) ? state.heroes.deployed : [];
    const targets = deployed.length ? roster.filter((e) => e && deployed.includes(e.id)) : roster;
    for (const e of targets) e.xp = (Number(e.xp) || 0) + heroXp;
    applied.heroXp = heroXp;
  }

  const heroIds = [rewards.heroId, rewards.hero, ...(Array.isArray(rewards.heroes) ? rewards.heroes : [])];
  for (const heroId of heroIds) {
    if (typeof heroId !== "string" || !heroId) continue;
    const def = findHeroDef(heroId, opts.heroCatalog);
    if (def) {
      grantHero(state, def);
    } else {
      // data 里的武将 id 不在保底名册中；记下来由上层用完整名册补发。
      if (!state.heroes || typeof state.heroes !== "object") state.heroes = {};
      if (!Array.isArray(state.heroes.pendingHeroGrants)) state.heroes.pendingHeroGrants = [];
      state.heroes.pendingHeroGrants.push(heroId);
    }
    applied.heroes.push(heroId);
  }

  return applied;
}

/** UI 便捷视图：按 order 输出任务 + 进度。 */
export function listQuests(state, questsCatalog) {
  const list = catalogOf(questsCatalog);
  if (!state.quests || !state.quests.entries) initQuests(state, list);
  return list
    .filter((quest) => quest && quest.id && state.quests.entries[quest.id])
    .map((quest) => {
      const entry = state.quests.entries[quest.id];
      return {
        id: quest.id,
        name: quest.name ?? quest.title ?? quest.id,
        desc: quest.desc ?? "",
        status: entry.status,
        progress: entry.progress,
        target: entry.target,
        ratio: entry.target > 0 ? clamp(entry.progress / entry.target, 0, 1) : 0,
        rewards: rewardsOf(quest),
      };
    });
}
