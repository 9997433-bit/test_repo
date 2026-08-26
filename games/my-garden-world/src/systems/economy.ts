import { FLOWERS, FLOWER_MAP } from "../data/flowers";
import { emit } from "../engine/events";
import { xpToLevel, type GameState } from "../engine/state";

/** 单次 addExp 允许连升的层数：脏存档里的巨额经验不该把主循环卡住。 */
const MAX_LEVEL_UPS_PER_CALL = 20;
const QUEST_GOALS: Record<string, number> = { plant3: 3, harvest3: 3, order1: 1 };
const DEFAULT_QUEST_GOAL = 3;

/** 一次结算里要扣掉的花材：flowerId 枝数 count。 */
export interface StemDemand {
  flowerId: string;
  count: number;
}

export function toFinite(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function clamp(value: number, min: number, max: number): number {
  const n = toFinite(value, min);
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function whole(value: unknown, fallback = 0): number {
  return Math.trunc(toFinite(value, fallback));
}

function ensureInventory(state: GameState): Record<string, number> {
  if (!state.inventory || typeof state.inventory !== "object") state.inventory = {};
  return state.inventory;
}

export function addCoins(state: GameState, n: number): void {
  state.coins = Math.max(0, Math.round(toFinite(state.coins) + toFinite(n)));
}

export function spendCoins(state: GameState, n: number): boolean {
  // 负数开销会变成白送金币，先夹到非负整数再比较。
  const cost = Math.max(0, Math.round(toFinite(n)));
  const purse = Math.max(0, Math.round(toFinite(state.coins)));
  if (purse < cost) return false;
  state.coins = purse - cost;
  return true;
}

export function addExp(state: GameState, n: number): void {
  if (!Array.isArray(state.unlockedFlowers)) state.unlockedFlowers = [];
  state.level = Math.max(1, whole(state.level, 1));
  state.exp = Math.max(0, Math.round(toFinite(state.exp))) + Math.max(0, Math.round(toFinite(n)));
  let guard = 0;
  while (state.exp >= xpToLevel(state.level) && guard++ < MAX_LEVEL_UPS_PER_CALL) {
    state.exp -= xpToLevel(state.level);
    state.level += 1;
    emit({ type: "levelup", level: state.level });
    emit({ type: "toast", text: `花园擢升至 ${state.level} 阶`, tone: "rare" });
    for (const f of FLOWERS) {
      // 用 <= 而不是 ===：读档时若漏了低阶花种，升级时一并补齐。
      if (f.unlockLevel <= state.level && !state.unlockedFlowers.includes(f.id)) {
        state.unlockedFlowers.push(f.id);
        emit({ type: "toast", text: `解锁花种 · ${f.name}`, tone: "ok" });
      }
    }
  }
}

/**
 * 库存中某种花材的实际枝数。
 * 脏数据（负数 / 小数 / NaN）与 0 枝的空壳条目一律按 0 计——
 * 收枯花时 addItem(id, 0) 会留下这种条目，任何「有没有货」的判断都必须走这里，
 * 不能拿 Object.keys 的数量当库存。
 */
export function countItem(state: GameState, flowerId: string): number {
  const have = whole(ensureInventory(state)[flowerId]);
  return have > 0 ? have : 0;
}

export function inventoryStems(state: GameState): number {
  const inv = ensureInventory(state);
  let total = 0;
  for (const id of Object.keys(inv)) total += countItem(state, id);
  return total;
}

export function addItem(state: GameState, flowerId: string, n = 1): void {
  const gain = whole(n);
  // 负数不能借 addItem 来扣库存，那是 takeItem 的活；0 枝仍按原样落条目（收枯花会这么调）。
  if (!flowerId || gain < 0) return;
  ensureInventory(state)[flowerId] = countItem(state, flowerId) + gain;
}

function mergeDemands(demands: readonly StemDemand[]): Map<string, number> | null {
  if (!Array.isArray(demands) || demands.length === 0) return null;
  const merged = new Map<string, number>();
  for (const demand of demands) {
    const need = whole(demand?.count);
    if (!demand?.flowerId || need <= 0) return null;
    merged.set(demand.flowerId, (merged.get(demand.flowerId) ?? 0) + need);
  }
  return merged.size ? merged : null;
}

export function canTakeItems(state: GameState, demands: readonly StemDemand[]): boolean {
  const merged = mergeDemands(demands);
  if (!merged) return false;
  for (const [flowerId, need] of merged) {
    if (countItem(state, flowerId) < need) return false;
  }
  return true;
}

/** 全有或全无地扣料：先整单核对，避免扣到一半才发现缺料而白吃前几枝。 */
export function takeItems(state: GameState, demands: readonly StemDemand[]): boolean {
  const merged = mergeDemands(demands);
  if (!merged) return false;
  for (const [flowerId, need] of merged) {
    if (countItem(state, flowerId) < need) return false;
  }
  const inv = ensureInventory(state);
  for (const [flowerId, need] of merged) {
    const left = countItem(state, flowerId) - need;
    if (left > 0) inv[flowerId] = left;
    else delete inv[flowerId];
  }
  return true;
}

export function takeItem(state: GameState, flowerId: string, n = 1): boolean {
  return takeItems(state, [{ flowerId, count: n }]);
}

/** 花材身价：数值越低越该先被消耗。未知花材（脏存档残留）视作最廉价。 */
export function stemValue(flowerId: string): number {
  const def = FLOWER_MAP[flowerId];
  if (!def) return -1;
  return def.harvestCoin + def.rarity * 12 + def.seedCost * 0.5;
}

/**
 * 从库存里挑出 count 枝最便宜的花材，凑不齐返回 null。
 * reserved 记录同一笔结算中已被点名占用的枝数，避免同一枝花被算两次。
 */
export function pickCheapestStems(
  state: GameState,
  count: number,
  reserved: Iterable<readonly [string, number]> = [],
): StemDemand[] | null {
  const want = whole(count);
  if (want <= 0) return [];
  const used = new Map<string, number>();
  for (const [flowerId, n] of reserved) {
    used.set(flowerId, (used.get(flowerId) ?? 0) + Math.max(0, whole(n)));
  }
  const pool = Object.keys(ensureInventory(state))
    .map((flowerId) => ({ flowerId, spare: countItem(state, flowerId) - (used.get(flowerId) ?? 0) }))
    .filter((entry) => entry.spare > 0)
    .sort((a, b) => stemValue(a.flowerId) - stemValue(b.flowerId) || a.flowerId.localeCompare(b.flowerId));

  const picked: StemDemand[] = [];
  let left = want;
  for (const entry of pool) {
    if (left <= 0) break;
    const take = Math.min(entry.spare, left);
    picked.push({ flowerId: entry.flowerId, count: take });
    left -= take;
  }
  return left > 0 ? null : picked;
}

export function bumpQuest(state: GameState, id: string, by = 1): void {
  if (!Array.isArray(state.quests)) return;
  const step = Math.max(0, whole(by));
  if (step <= 0) return;
  const q = state.quests.find((x) => x.id === id);
  if (!q || q.done) return;
  q.progress = Math.max(0, whole(q.progress)) + step;
  const need = QUEST_GOALS[id] ?? DEFAULT_QUEST_GOAL;
  if (q.progress >= need) {
    q.done = true;
    addCoins(state, 18);
    addExp(state, 10);
    state.fragments = Math.max(0, whole(state.fragments)) + 1;
    emit({ type: "toast", text: "日常已成 · 获得装饰碎片", tone: "ok" });
  }
}

export function moodBonus(state: GameState): number {
  const decorCount = Array.isArray(state.placedDecor) ? state.placedDecor.length : 0;
  const decor = Math.min(0.35, Math.max(0, decorCount) * 0.04);
  const rep = (clamp(toFinite(state.reputation, 70), 0, 100) - 70) / 400;
  // 夹住上下限：口碑或装饰被脏存档写坏时，订单赏金也不至于变成 0 或天价。
  return clamp(1 + decor + rep, 0.8, 1.5);
}
