// 居民订单：交单 + 轮换。
// 旧实现交完一单后永远发同一张 meal×1（验收红 9）。现在按 data/orders.js 的
// ORDER_POOL / ORDER_RULES 抽下一单：档位跟指挥中心等级走，不连抽同一单，
// 数量随 HQ 放大。随机只来自 (meta.seed, meta.tick, 居民 id) 派生流，保持可复现。
import { ORDER_POOL, ORDER_RULES } from "../data/orders.js";
import { hashSeed, mulberry32 } from "../core/rng.js";
import { num, resName } from "./copy.js";

function hqLevel(state) {
  const hq = state.buildings.find((b) => b.type === "hq");
  return hq ? hq.level : 0;
}

function tierCap(state) {
  const lv = hqLevel(state);
  if (lv >= 6) return 3;
  if (lv >= 3) return 2;
  return 1;
}

function rewardLineOf(reward) {
  const parts = [];
  for (const [k, v] of Object.entries(reward || {})) {
    parts.push(k === "coins" ? `${v} 金币` : k === "diamonds" ? `${v} 钻石` : `${resName(k)}×${num(v)}`);
  }
  return parts.join(" · ");
}

// 当前挂着的单（取第一个有 order 的居民）。UI 只展示一张，免得面板变成表格。
export function orderOf(state) {
  const idx = state.residents.findIndex((r) => r && r.order);
  if (idx < 0) return null;
  const r = state.residents[idx];
  return {
    index: idx,
    residentId: r.id,
    residentName: r.name,
    want: r.order.want,
    qty: r.order.qty,
    rewardExp: r.order.rewardExp,
    reward: r.order.reward || null,
    rewardLine: rewardLineOf(r.order.reward),
  };
}

export function rollOrder(state, resident, avoidWant) {
  const cap = tierCap(state);
  const pool = ORDER_POOL.filter((o) => o.tier <= cap && o.want !== avoidWant);
  const use = pool.length ? pool : ORDER_POOL.filter((o) => o.tier <= cap);
  if (!use.length) return null;
  const rng = mulberry32(hashSeed(`${state.meta.seed}:${state.meta.tick}:${resident.id}:order`));
  const def = use[Math.floor(rng() * use.length)] || use[0];
  const [lo, hi] = def.qty;
  const raw = lo + Math.floor(rng() * (hi - lo + 1));
  const scale = 1 + ORDER_RULES.qtyScalePerHq * Math.max(0, hqLevel(state) - 1);
  return {
    want: def.want,
    qty: Math.max(1, Math.round(raw * scale)),
    rewardExp: def.rewardExp,
    reward: def.reward || null,
    flavor: def.flavor,
  };
}

// 失败（无订单 / 货不够）返回入参原引用，与领域层的失败语义一致。
export function fulfillOrder(state) {
  const cur = orderOf(state);
  if (!cur) return state;
  const have = state.resources[cur.want] || 0;
  if (have < cur.qty) return state;

  const resident = state.residents[cur.index];
  const next = rollOrder(state, resident, cur.want);
  const resources = { ...state.resources, [cur.want]: have - cur.qty };
  let coins = state.player.coins;
  let diamonds = state.player.diamonds;
  for (const [k, v] of Object.entries(cur.reward || {})) {
    if (k === "coins") coins += v;
    else if (k === "diamonds") diamonds += v;
    else resources[k] = (resources[k] || 0) + v;
  }

  return {
    ...state,
    resources,
    player: { ...state.player, coins, diamonds, exp: state.player.exp + cur.rewardExp },
    residents: state.residents.map((it, i) =>
      i === cur.index
        ? {
            ...it,
            mood: Math.min(100, it.mood + ORDER_RULES.moodReward),
            hunger: Math.max(it.hunger, ORDER_RULES.hungerReset),
            order: next,
          }
        : it,
    ),
    log: [
      `${cur.residentName}的单交了：${resName(cur.want)}×${cur.qty}${cur.rewardLine ? `，回礼 ${cur.rewardLine}` : ""}。`,
      ...state.log,
    ].slice(0, 24),
  };
}
