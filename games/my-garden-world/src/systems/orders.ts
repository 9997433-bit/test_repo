import { ORDER_TEMPLATES } from "../data/orders";
import { emit } from "../engine/events";
import type { GameState } from "../engine/state";
import { addCoins, addExp, bumpQuest, moodBonus, takeItem } from "./economy";

function uid(): string {
  return `ord-${Math.random().toString(36).slice(2, 9)}`;
}

export function spawnOrders(state: GameState): void {
  const cap = 3 + Math.min(2, Math.floor(state.level / 4));
  while (state.orders.length < cap) {
    const pool = ORDER_TEMPLATES.filter((t) => t.minLevel <= state.level);
    const t = pool[Math.floor(Math.random() * pool.length)];
    if (!t) break;
    const bonus = moodBonus(state);
    state.orders.push({
      uid: uid(),
      templateId: t.id,
      kind: t.kind,
      title: t.title,
      hint: t.hint,
      dueAt: state.now + t.timeMs,
      coin: Math.round(t.coin * bonus),
      exp: t.exp,
      waterReward: t.waterReward,
      requireScore: t.requireScore,
      flowerIds: t.flowerIds,
      flowerCount: t.flowerCount,
    });
  }
}

export function fulfillOrder(state: GameState, uid: string, arrangementId?: string): boolean {
  const idx = state.orders.findIndex((o) => o.uid === uid);
  const order = state.orders[idx];
  if (!order) return false;
  if (order.requireScore) {
    const art = state.arrangements.find((a) => a.id === arrangementId);
    if (!art || art.score < order.requireScore) {
      emit({ type: "toast", text: "这件作品还配不上定制", tone: "warn" });
      return false;
    }
    state.arrangements = state.arrangements.filter((a) => a.id !== art.id);
  } else {
    const needIds = order.flowerIds ?? [];
    const count = order.flowerCount ?? 1;
    if (needIds.length) {
      for (const id of needIds) {
        if (!takeItem(state, id, 1)) {
          emit({ type: "toast", text: "花材尚未备齐", tone: "warn" });
          return false;
        }
      }
    } else {
      const keys = Object.keys(state.inventory);
      if (keys.length < count) {
        emit({ type: "toast", text: "库存花材不足", tone: "warn" });
        return false;
      }
      for (let i = 0; i < count; i++) {
        const k = keys[i];
        if (k) takeItem(state, k, 1);
      }
    }
  }
  addCoins(state, order.coin);
  addExp(state, order.exp);
  state.water = Math.min(40, state.water + order.waterReward);
  state.reputation = Math.min(100, state.reputation + 1);
  state.stats.ordersDone += 1;
  state.orders.splice(idx, 1);
  bumpQuest(state, "order1");
  emit({ type: "orderDone", title: order.title });
  emit({ type: "toast", text: `交付成功 · +${order.coin}金`, tone: "ok" });
  spawnOrders(state);
  return true;
}

export function cancelOrder(state: GameState, uid: string): void {
  const idx = state.orders.findIndex((o) => o.uid === uid);
  if (idx < 0) return;
  state.orders.splice(idx, 1);
  state.reputation = Math.max(30, state.reputation - 4);
  state.stats.cancelled += 1;
  emit({ type: "toast", text: "客人离去，口碑微损", tone: "warn" });
  spawnOrders(state);
}

export function tickOrders(state: GameState): void {
  spawnOrders(state);
  const due = state.orders.filter((o) => o.dueAt <= state.now);
  for (const o of due) cancelOrder(state, o.uid);
}
