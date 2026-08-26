/**
 * 规则探测：界面不复刻规则，直接拿一份假状态问 reducer。
 *
 * 法器佩戴与藏经楼晋阶都住在 core/**，由别的模块所有者演进。若把「顶掉最早一件」
 * 「藏经楼免费升专业」写死在文案里，核心一改，界面就开始骗人。这里在模块加载时
 * 各跑一次纯函数探测，把结论缓存下来，展示层照结论说话。
 */
import { ARTIFACTS, STARTER_ARTIFACTS, ARTIFACT_DROPS, artifactById } from "../data/artifacts.js";
import { defaultState, reduce } from "../core/store.js";
import { scriptureXp, xpNeeded } from "../disciples/train.js";
import { SLOT_LABEL } from "./util.js";

export const SLOTS = Object.keys(SLOT_LABEL);

const PROBE_ROUNDS = 8;

function slotIds(slot) {
  return ARTIFACTS.filter((a) => a.slot === slot).map((a) => a.id);
}

function probeBase(equipped = []) {
  return { ...defaultState(), ownedArtifacts: ARTIFACTS.map((a) => a.id), equipped };
}

function equipOnce(state, id) {
  if (!id) return state;
  try {
    const next = reduce(state, { type: "EQUIP_ARTIFACT", artifactId: id });
    return Array.isArray(next?.equipped) ? next : state;
  } catch {
    return state;
  }
}

function countSlot(equipped, slot) {
  return equipped.filter((id) => artifactById(id)?.slot === slot).length;
}

/** 一路只塞同一类法器，看这类最多能同时佩几件。 */
function probeCap(slot) {
  let state = probeBase();
  let best = 0;
  for (const id of slotIds(slot)) {
    state = equipOnce(state, id);
    best = Math.max(best, countSlot(state.equipped, slot));
  }
  return best;
}

/** 攻防通用轮流塞，最终佩戴总数即总容量。 */
function probeTotal() {
  let state = probeBase();
  const lists = SLOTS.map(slotIds);
  for (let i = 0; i < PROBE_ROUNDS; i++) {
    for (const list of lists) state = equipOnce(state, list[i]);
  }
  return state.equipped.length;
}

/**
 * 一类槽位塞满后再挂一件：
 * 挂同类看顶掉谁（最早还是最近），挂别类看旧件还在不在（在＝各槽独立）。
 */
function probeEviction(caps) {
  const slot = SLOTS[0];
  const cap = Math.max(1, caps[slot]);
  let state = probeBase();
  for (const id of slotIds(slot).slice(0, cap)) state = equipOnce(state, id);
  const filled = state.equipped;
  const sameAfter = equipOnce(state, slotIds(slot)[cap]).equipped;
  const crossAfter = equipOnce(state, slotIds(SLOTS[1])[0]).equipped;
  const sameGone = filled.findIndex((id) => !sameAfter.includes(id));
  return {
    shared: filled.some((id) => !crossAfter.includes(id)),
    evicted: sameGone < 0 ? null : sameGone === 0 ? "oldest" : "newest",
  };
}

let slotRuleCache = null;

/**
 * { shared, total, caps, evicted }
 * shared=true 表示各类法器共抢同一批槽位；false 表示每类各有独立槽位。
 */
export function slotRule() {
  if (slotRuleCache) return slotRuleCache;
  const caps = {};
  for (const slot of SLOTS) caps[slot] = probeCap(slot);
  const total = probeTotal() || Math.max(...Object.values(caps), 1);
  const { shared, evicted } = probeEviction(caps);
  slotRuleCache = {
    shared,
    evicted,
    total,
    caps: shared ? Object.fromEntries(SLOTS.map((s) => [s, Math.min(caps[s], total)])) : caps,
  };
  return slotRuleCache;
}

/** 当前槽位占用：每类已佩何物、还空几格。 */
export function slotBoard(state) {
  const rule = slotRule();
  const equipped = (state.equipped ?? []).map((id) => artifactById(id)).filter(Boolean);
  const groups = SLOTS.map((slot) => {
    const items = equipped.filter((a) => a.slot === slot);
    const cap = rule.shared ? rule.total : (rule.caps[slot] ?? 0);
    return { slot, label: SLOT_LABEL[slot], items, cap, free: Math.max(0, cap - items.length) };
  });
  const used = equipped.length;
  return { rule, groups, used, total: rule.total, free: Math.max(0, rule.total - used) };
}

/**
 * 佩戴这件会发生什么：kind 为 locked / equipped / free / swap / blocked，
 * swap 时 dropped 是会被顶下来的法器名。结论同样来自 reducer 试算。
 */
export function equipPreview(state, artifact) {
  const id = artifact?.id;
  if (!id) return { kind: "blocked", dropped: [] };
  if (!(state.ownedArtifacts ?? []).includes(id)) return { kind: "locked", dropped: [] };
  if ((state.equipped ?? []).includes(id)) return { kind: "equipped", dropped: [] };
  const next = equipOnce(state, id);
  const after = next.equipped ?? [];
  if (!after.includes(id)) return { kind: "blocked", dropped: [] };
  const dropped = (state.equipped ?? [])
    .filter((x) => !after.includes(x))
    .map((x) => artifactById(x)?.name)
    .filter(Boolean);
  return { kind: dropped.length ? "swap" : "free", dropped };
}

const DROP_VIA = { tower: "登天塔", wave: "兽潮" };
const DROP_VERB = { tower: "层首通", wave: "波首破" };

/** 获取途径只认已实装的发放节点，data 里标「规划」的条目不谎报可得。 */
export function artifactSource(artifact) {
  if (STARTER_ARTIFACTS.includes(artifact.id)) return { ready: true, text: "开局所赠" };
  const drop = ARTIFACT_DROPS.find((d) => d.id === artifact.id);
  if (drop) return { ready: true, text: `${DROP_VIA[drop.via] ?? drop.via}第 ${drop.at} ${DROP_VERB[drop.via] ?? "关"}` };
  return { ready: false, text: "获取途径尚未开放" };
}

/** 已实装的掉落进度：best 为历史最高层/波。 */
export function dropProgress(state) {
  return ARTIFACT_DROPS.map((d) => {
    const best = d.via === "tower" ? (state.tower?.best ?? 0) : (state.wave?.best ?? 0);
    return { ...d, best, done: best >= d.at, name: artifactById(d.id)?.name ?? d.id };
  });
}

/* ---------------------------------------------------------------- 藏经楼 */

function probeDisciple(id, buildingId, xp) {
  return {
    id,
    heroId: "mc-mortal",
    name: id,
    diligent: 10,
    force: 10,
    profession: 1,
    xp,
    buildingId,
    unlocked: true,
  };
}

/**
 * 一府之内摆齐四种处境，一次 TICK 问清全部修业规则：
 * 满条的驻楼弟子（会不会白升专业）、空条的驻楼弟子（修业到底涨不涨）、
 * 驻灵田的弟子与闲云弟子（修业是不是只发给藏经楼里的人）。
 */
function scriptureProbeState() {
  const base = defaultState();
  return {
    ...base,
    meta: { ...base.meta, faction: "mortal", startedAt: 0, lastTick: 0 },
    buildings: [
      { id: "b-mansion", type: "mansion", level: 3, x: 2, y: 2 },
      { id: "b-hall-full", type: "scripture", level: 3, x: 3, y: 2 },
      { id: "b-hall-fresh", type: "scripture", level: 3, x: 4, y: 2 },
      { id: "b-field", type: "field", level: 1, x: 2, y: 3 },
    ],
    disciples: [
      probeDisciple("full", "b-hall-full", xpNeeded(1)),
      probeDisciple("fresh", "b-hall-fresh", 0),
      probeDisciple("field", "b-field", 0),
      probeDisciple("idle", null, 0),
    ],
  };
}

let scriptureRuleCache = null;

/**
 * { autoPromote, accrues, hallOnly }
 * autoPromote=true 表示修业积满会白送一级专业；hallOnly=true 表示只有驻藏经楼者积修业。
 */
export function scriptureRule() {
  if (scriptureRuleCache) return scriptureRuleCache;
  const state = scriptureProbeState();
  let after = null;
  try {
    after = reduce(state, { type: "TICK", dt: 1, now: 1000 })?.disciples ?? null;
  } catch {
    after = null;
  }
  if (!Array.isArray(after) || !after.length) {
    // 核心层没走通就退一步问弟子层自己，至少不会把没有的规则说成有。
    try {
      after = scriptureXp(state, 1) ?? [];
    } catch {
      after = [];
    }
  }
  const at = (id) => after.find((d) => d?.id === id) ?? null;
  const grew = (id) => (at(id)?.xp ?? 0) > 0;
  scriptureRuleCache = {
    autoPromote: (at("full")?.profession ?? 1) > 1,
    accrues: grew("fresh"),
    hallOnly: !grew("field") && !grew("idle"),
  };
  return scriptureRuleCache;
}
