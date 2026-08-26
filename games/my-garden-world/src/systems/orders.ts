import { FLOWER_MAP } from "../data/flowers";
import { ORDER_TEMPLATES, STORY_CHAIN, nextStoryChapter, pickWeighted, type OrderTemplate } from "../data/orders";
import { currentBeat } from "../data/story";
import { emit } from "../engine/events";
import { WATER_CAP, type ActiveOrder, type Arrangement, type GameState } from "../engine/state";
import { addCoins, addExp, bumpQuest, moodBonus, takeItem, totalInventory } from "./economy";

function uid(): string {
  return `ord-${Math.random().toString(36).slice(2, 9)}`;
}

function instantiate(state: GameState, t: OrderTemplate, timeMul = 1): ActiveOrder {
  const bonus = moodBonus(state);
  return {
    uid: uid(),
    templateId: t.id,
    kind: t.kind,
    title: t.title,
    hint: t.hint,
    dueAt: state.now + Math.round(t.timeMs * timeMul),
    coin: Math.round(t.coin * bonus),
    exp: t.exp,
    waterReward: t.waterReward,
    requireScore: t.requireScore,
    flowerIds: t.flowerIds,
    flowerCount: t.flowerCount,
  };
}

/**
 * 补满订单栏。同一模板不会在列表里撞车；`avoidTemplateId` 用于挡住刚刚离场的那张，
 * 免得交付/超时之后原样又贴回来。模板数不够铺满时才退让允许重复。
 * 抽取按模板 `weight`：居民常客多、组团大单稀客，靠权重而非硬门槛拉开体感。
 */
export function spawnOrders(state: GameState, avoidTemplateId?: string): void {
  const cap = 3 + Math.min(2, Math.floor(state.level / 4));
  const story = nextStoryChapter(state.storyChapter ?? 0, state.level);
  const hasStory = Boolean(story && state.orders.some((o) => o.templateId === story.id));
  const reserve = story && !hasStory ? 1 : 0;
  const eligible = ORDER_TEMPLATES.filter((t) => t.minLevel <= state.level);
  if (eligible.length === 0) {
    ensureStoryOrder(state);
    return;
  }
  const taken = new Set(state.orders.map((o) => o.templateId));
  if (avoidTemplateId) taken.add(avoidTemplateId);
  while (state.orders.length < cap - reserve) {
    let pool = eligible.filter((t) => !taken.has(t.id));
    if (pool.length === 0) pool = eligible.filter((t) => t.id !== avoidTemplateId);
    if (pool.length === 0) pool = eligible;
    const t = pickWeighted(pool, Math.random());
    if (!t) break;
    taken.add(t.id);
    state.orders.push(instantiate(state, t));
  }
  ensureStoryOrder(state);
}

function ensureStoryOrder(state: GameState): void {
  const next = nextStoryChapter(state.storyChapter ?? 0, state.level);
  if (!next) return;
  if (state.orders.some((o) => o.templateId === next.id)) return;
  state.orders.unshift(instantiate(state, next, 1.4));
}

/** 教程"交单"步骤期间，保证列表里始终有一张雏菊订单，避免新手卡关。 */
export function ensureTutorialOrder(state: GameState): void {
  if (state.tutorialDone) return;
  if (currentBeat(state.tutorialStep)?.goal !== "order") return;
  if (state.orders.some((o) => o.flowerIds?.includes("daisy"))) return;
  const t = ORDER_TEMPLATES.find((x) => x.id === "r-welcome");
  if (t) state.orders.unshift(instantiate(state, t, 5));
}

/** 定制订单可用的合格作品，按分数升序（默认交"够用的最低分"以保护精品）。 */
export function qualifyingArrangements(state: GameState, order: ActiveOrder): Arrangement[] {
  if (!order.requireScore) return [];
  return state.arrangements
    .filter((a) => a.score >= (order.requireScore ?? 0))
    .sort((a, b) => a.score - b.score);
}

/**
 * 花材订单的构成：flowerIds 为点名花材（重复表示多枝）；
 * flowerCount 超出点名的缺口按「任意花材」补足。
 */
export function orderParts(order: ActiveOrder): { named: [string, number][]; filler: number } {
  const need = new Map<string, number>();
  for (const id of order.flowerIds ?? []) need.set(id, (need.get(id) ?? 0) + 1);
  const namedTotal = [...need.values()].reduce((s, n) => s + n, 0);
  const filler = Math.max(0, (order.flowerCount ?? (namedTotal || 1)) - namedTotal);
  return { named: [...need.entries()], filler };
}

/** 交付前的只读预检：不动库存，UI 用它来禁用交付按钮。 */
export function orderReady(state: GameState, order: ActiveOrder): boolean {
  if (order.requireScore) return qualifyingArrangements(state, order).length > 0;
  const { named, filler } = orderParts(order);
  let namedTotal = 0;
  for (const [id, n] of named) {
    if ((state.inventory[id] ?? 0) < n) return false;
    namedTotal += n;
  }
  return totalInventory(state) >= namedTotal + filler;
}

/** "任意 N 枝"订单按最廉价花材扣除，保护稀有库存。 */
function takeCheapest(state: GameState, count: number): boolean {
  if (totalInventory(state) < count) return false;
  const byPrice = Object.keys(state.inventory).sort(
    (a, b) => (FLOWER_MAP[a]?.harvestCoin ?? 0) - (FLOWER_MAP[b]?.harvestCoin ?? 0),
  );
  let left = count;
  for (const id of byPrice) {
    while (left > 0 && takeItem(state, id, 1)) left -= 1;
    if (left === 0) return true;
  }
  return left === 0;
}

export function fulfillOrder(state: GameState, uid: string, arrangementId?: string): boolean {
  const idx = state.orders.findIndex((o) => o.uid === uid);
  const order = state.orders[idx];
  if (!order) return false;
  if (!orderReady(state, order)) {
    emit({ type: "toast", text: order.requireScore ? "还没有够格的作品" : "花材尚未备齐", tone: "warn" });
    return false;
  }
  if (order.requireScore) {
    const pool = qualifyingArrangements(state, order);
    const art = pool.find((a) => a.id === arrangementId) ?? pool[0];
    if (!art) {
      emit({ type: "toast", text: "这件作品还配不上定制", tone: "warn" });
      return false;
    }
    state.arrangements = state.arrangements.filter((a) => a.id !== art.id);
  } else {
    const { named, filler } = orderParts(order);
    for (const [id, n] of named) takeItem(state, id, n);
    if (filler > 0 && !takeCheapest(state, filler)) {
      emit({ type: "toast", text: "库存花材不足", tone: "warn" });
      return false;
    }
  }
  addCoins(state, order.coin);
  addExp(state, order.exp);
  state.water = Math.min(WATER_CAP, state.water + order.waterReward);
  state.reputation = Math.min(100, state.reputation + 1);
  state.stats.ordersDone += 1;
  state.orders.splice(idx, 1);
  if (STORY_CHAIN.some((t) => t.id === order.templateId)) {
    state.storyChapter = Math.min(5, (state.storyChapter ?? 0) + 1);
  }
  bumpQuest(state, "order1");
  emit({ type: "orderDone", title: order.title });
  emit({ type: "toast", text: `交付成功 · +${order.coin}金`, tone: "ok" });
  spawnOrders(state, order.templateId);
  return true;
}

export function cancelOrder(state: GameState, uid: string, expired = false): void {
  const idx = state.orders.findIndex((o) => o.uid === uid);
  const order = state.orders[idx];
  if (idx < 0 || !order) return;
  state.orders.splice(idx, 1);
  if (STORY_CHAIN.some((t) => t.id === order.templateId)) {
    emit({ type: "toast", text: "盛会之约暂且顺延，客人并未离去", tone: "ok" });
    spawnOrders(state);
    return;
  }
  state.reputation = Math.max(30, state.reputation - 4);
  state.stats.cancelled += 1;
  emit({ type: "toast", text: expired ? "订单超时，客人失望离去" : "客人离去，口碑微损", tone: "warn" });
  spawnOrders(state, order.templateId);
}

export function tickOrders(state: GameState): void {
  spawnOrders(state);
  ensureTutorialOrder(state);
  const due = state.orders.filter((o) => o.dueAt <= state.now);
  for (const o of due) cancelOrder(state, o.uid, true);
}
