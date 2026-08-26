import { FLOWER_MAP } from "../data/flowers";
import { ORDER_TEMPLATES } from "../data/orders";
import { emit } from "../engine/events";
import { WATER_CAP, type ActiveOrder, type GameState } from "../engine/state";
import {
  addCoins,
  addExp,
  bumpQuest,
  clamp,
  countItem,
  inventoryStems,
  moodBonus,
  pickCheapestStems,
  takeItems,
  toFinite,
  type StemDemand,
} from "./economy";

const ORDER_CAP_BASE = 3;
const ORDER_CAP_MAX = 5;
/** 订单存活时长的上下限，防止模板或存档里出现 0 / 负数 / 天文数字。 */
const MIN_ORDER_MS = 15_000;
const MAX_ORDER_MS = 10 * 60_000;
/**
 * 逾期超过这个时长就判定为「时钟跳变」（页面挂后台、读入旧档、系统改时间），
 * 此时静默清场，而不是把跳过去的每一分钟都算成客人流失。
 */
const CLOCK_JUMP_MS = 5 * 60_000;
const REPUTATION_MIN = 30;
const REPUTATION_MAX = 100;
const CANCEL_PENALTY = 4;

let uidSeq = 0;

function uid(): string {
  // 只靠 Math.random 时，固定随机源（测试 / 某些环境）会撞号，撞号的订单会互相顶掉。
  uidSeq = (uidSeq + 1) % 1_000_000;
  return `ord-${uidSeq.toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function ensureOrders(state: GameState): ActiveOrder[] {
  if (!Array.isArray(state.orders)) state.orders = [];
  return state.orders;
}

function ensureStats(state: GameState): GameState["stats"] {
  if (!state.stats || typeof state.stats !== "object") {
    state.stats = { harvested: 0, ordersDone: 0, cancelled: 0, planted: 0 };
  }
  return state.stats;
}

function normalizeNow(state: GameState): number {
  if (!Number.isFinite(state.now)) state.now = Date.now();
  return state.now;
}

function dropOrder(state: GameState, order: ActiveOrder): boolean {
  const orders = ensureOrders(state);
  const idx = orders.indexOf(order);
  if (idx < 0) return false;
  orders.splice(idx, 1);
  return true;
}

function applyCancelPenalty(state: GameState): void {
  state.reputation = clamp(toFinite(state.reputation, REPUTATION_MAX) - CANCEL_PENALTY, REPUTATION_MIN, REPUTATION_MAX);
  ensureStats(state).cancelled += 1;
}

export function spawnOrders(state: GameState): void {
  const orders = ensureOrders(state);
  const now = normalizeNow(state);
  const level = Math.max(1, Math.trunc(toFinite(state.level, 1)));
  const cap = Math.min(ORDER_CAP_MAX, ORDER_CAP_BASE + Math.min(2, Math.floor(level / 4)));
  const pool = ORDER_TEMPLATES.filter((t) => t.minLevel <= level);
  if (!pool.length) return;
  let guard = 0;
  while (orders.length < cap && guard++ < ORDER_CAP_MAX * 2) {
    const t = pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
    if (!t) break;
    const bonus = moodBonus(state);
    const life = clamp(Math.round(toFinite(t.timeMs, MIN_ORDER_MS)), MIN_ORDER_MS, MAX_ORDER_MS);
    orders.push({
      uid: uid(),
      templateId: t.id,
      kind: t.kind,
      title: t.title,
      hint: t.hint,
      // 到期时间永远落在未来：新单不会在生成它的这一帧就被判过期。
      dueAt: now + life,
      coin: Math.max(1, Math.round(toFinite(t.coin) * bonus)),
      exp: Math.max(0, Math.round(toFinite(t.exp))),
      waterReward: Math.max(0, Math.round(toFinite(t.waterReward))),
      requireScore: t.requireScore,
      // 拷贝模板数组，免得运行时改动污染 ORDER_TEMPLATES。
      flowerIds: t.flowerIds ? [...t.flowerIds] : undefined,
      flowerCount: t.flowerCount,
    });
  }
}

/** 定制单必须凭作品交付：模板漏配 requireScore 时也至少要一件成品，不能空手换钱。 */
function requiredScore(order: ActiveOrder): number {
  const raw = Math.max(0, Math.round(toFinite(order.requireScore)));
  return order.kind === "custom" ? Math.max(1, raw) : raw;
}

/**
 * 算出这张订单真正要扣掉的花材。
 * 点名的花材（flowerIds）逐一核对；flowerCount 超出点名部分的缺口才算「任意花材」。
 */
function orderDemands(state: GameState, order: ActiveOrder): StemDemand[] | null {
  const named = new Map<string, number>();
  for (const id of Array.isArray(order.flowerIds) ? order.flowerIds : []) {
    if (typeof id === "string" && id.length) named.set(id, (named.get(id) ?? 0) + 1);
  }
  for (const [flowerId, need] of named) {
    if (countItem(state, flowerId) >= need) continue;
    const name = FLOWER_MAP[flowerId]?.name ?? flowerId;
    emit({ type: "toast", text: `花材尚未备齐 · 还缺${name}`, tone: "warn" });
    return null;
  }

  const namedTotal = [...named.values()].reduce((sum, n) => sum + n, 0);
  const total = Math.max(namedTotal, Math.max(0, Math.trunc(toFinite(order.flowerCount))));
  const demands: StemDemand[] = [...named].map(([flowerId, count]) => ({ flowerId, count }));
  const extras = total - namedTotal;
  if (extras > 0) {
    // 绸缎行 / 花园盛会这类「任意花材」的缺口，只挑库存里最不值钱的几枝来补：
    // 旧写法直接拿 Object.keys 的前几个键，等于按插入顺序盲抓，
    // 常常把牡丹、星辰郁金香这种高价花材白送出去，还会数到 0 枝的空壳条目。
    const cheapest = pickCheapestStems(state, extras, named);
    if (!cheapest) {
      const short = extras - (inventoryStems(state) - namedTotal);
      emit({ type: "toast", text: `库存花材不足 · 还差 ${Math.max(1, short)} 枝`, tone: "warn" });
      return null;
    }
    demands.push(...cheapest);
  }
  if (!demands.length) {
    emit({ type: "toast", text: "这张单子没写明要什么花材", tone: "warn" });
    return null;
  }
  return demands;
}

export function fulfillOrder(state: GameState, uid: string, arrangementId?: string): boolean {
  const orders = ensureOrders(state);
  const order = orders.find((o) => o.uid === uid);
  if (!order) return false;

  const needScore = requiredScore(order);
  if (needScore > 0) {
    if (!Array.isArray(state.arrangements)) state.arrangements = [];
    const art = arrangementId ? state.arrangements.find((a) => a.id === arrangementId) : undefined;
    if (!art) {
      emit({ type: "toast", text: "定制单要凭作品交付，先去作坊插一瓶", tone: "warn" });
      return false;
    }
    if (toFinite(art.score) < needScore) {
      emit({ type: "toast", text: `这件作品还配不上定制 · 需 ${needScore} 分`, tone: "warn" });
      return false;
    }
    state.arrangements = state.arrangements.filter((a) => a.id !== art.id);
  } else {
    const demands = orderDemands(state, order);
    // orderDemands 已按缺口提示过，这里只需保证扣料是全有或全无。
    if (!demands || !takeItems(state, demands)) {
      if (demands) emit({ type: "toast", text: "花材尚未备齐", tone: "warn" });
      return false;
    }
  }

  const coin = Math.max(0, Math.round(toFinite(order.coin)));
  addCoins(state, coin);
  addExp(state, Math.max(0, Math.round(toFinite(order.exp))));
  state.water = clamp(toFinite(state.water) + Math.max(0, toFinite(order.waterReward)), 0, WATER_CAP);
  state.reputation = clamp(toFinite(state.reputation, REPUTATION_MAX) + 1, REPUTATION_MIN, REPUTATION_MAX);
  ensureStats(state).ordersDone += 1;
  dropOrder(state, order);
  bumpQuest(state, "order1");
  emit({ type: "orderDone", title: order.title });
  emit({ type: "toast", text: `交付成功 · +${coin}金`, tone: "ok" });
  spawnOrders(state);
  return true;
}

export function cancelOrder(state: GameState, uid: string): void {
  const order = ensureOrders(state).find((o) => o.uid === uid);
  if (!order || !dropOrder(state, order)) return;
  applyCancelPenalty(state);
  emit({ type: "toast", text: "客人离去，口碑微损", tone: "warn" });
  spawnOrders(state);
}

export function tickOrders(state: GameState): void {
  const orders = ensureOrders(state);
  const now = normalizeNow(state);
  // 先给这一帧的订单拍快照：补位生成的新单不参与本帧判定，
  // 否则 now 大跨步时会陷入「判过期 → 补位 → 再判过期」的循环。
  const snapshot = [...orders];
  let expired = 0;
  let stale = 0;
  for (const order of snapshot) {
    if (!Number.isFinite(order.dueAt)) {
      order.dueAt = now + MIN_ORDER_MS;
      continue;
    }
    if (order.dueAt - now > MAX_ORDER_MS) {
      // now 往回跳（读入更早的存档）时，订单会变成永不过期的钉子户。
      order.dueAt = now + MAX_ORDER_MS;
      continue;
    }
    if (order.dueAt > now) continue;
    const overdue = now - order.dueAt;
    if (!dropOrder(state, order)) continue;
    if (overdue > CLOCK_JUMP_MS) {
      stale += 1;
      continue;
    }
    expired += 1;
    applyCancelPenalty(state);
  }
  if (expired === 1) emit({ type: "toast", text: "客人久候不至，口碑微损", tone: "warn" });
  else if (expired > 1) emit({ type: "toast", text: `${expired} 位客人久候不至，口碑微损`, tone: "warn" });
  if (stale > 0) emit({ type: "toast", text: `离园太久 · ${stale} 张过期订单已撤下`, tone: "warn" });
  // 一帧只补一次位。
  spawnOrders(state);
}
