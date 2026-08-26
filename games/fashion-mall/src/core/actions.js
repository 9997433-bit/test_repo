import * as BALANCE from "../data/balance.js";
import { SHOPS, PARTNERS, FURNITURE, RESEARCH_NODES, OUTFITS } from "../data/balance.js";
import { grantGold, grantXp, syncUnlocks, tryLevelUp, fromSaveData } from "./state.js";
import { importSave } from "./save.js";
import { partnerInfo, partnersAt } from "./economy.js";
import {
  PARTNERS_PER_SHOP_MAX,
  PARTNER_LEVEL_MAX,
  SHOP_LEVEL_MAX,
  partnerLevel,
  shopLevel,
} from "./limits.js";

/**
 * 动作层：唯一允许写 state 的入口（settle/tick 管线除外）。
 * 每个动作返回 { ok, reason?, toast? }，不触 DOM、不播音效、不落盘——
 * 音效、重绘与持久化由调用方视图/组合根负责。
 */

const SHOP_BY_ID = new Map(SHOPS.map((s) => [s.id, s]));
const FURNITURE_BY_ID = new Map(FURNITURE.map((f) => [f.id, f]));
const RESEARCH_BY_ID = new Map(RESEARCH_NODES.map((n) => [n.id, n]));
const PARTNER_IDS = new Set(PARTNERS.map((p) => p.id));

function ok(toast) {
  return toast ? { ok: true, toast } : { ok: true };
}

function fail(reason, toast) {
  return { ok: false, reason, toast: toast || reason };
}

/** 数值曲线优先用 balance.js 的导出，未导出时用与基线一致的本地公式兜底。 */
function fromBalance(name, fallback, ...args) {
  const fn = BALANCE[name];
  if (typeof fn !== "function") return fallback;
  const value = Number(fn(...args));
  return Number.isFinite(value) ? value : fallback;
}

function shopOf(ref) {
  return typeof ref === "string" ? SHOP_BY_ID.get(ref) : ref || null;
}

/**
 * 成本一律走 balance 曲线（ECONOMY §5）：升级/招聘都 ∝ shop.base，
 * 因此签名带上店铺；等级先钳到帽内，成本不会随手改存档飞到 Infinity。
 */
export function shopUpgradeCost(shopRef, level) {
  const shop = shopOf(shopRef);
  const lv = shopLevel(level);
  const fallback = 80 * 1.45 ** (lv - 1);
  if (!shop) return Math.floor(fallback);
  return Math.floor(fromBalance("shopUpgradeCost", fallback, shop, lv));
}

export function shopHireCost(shopRef, staff) {
  const shop = shopOf(shopRef);
  const n = Math.max(0, Math.trunc(Number(staff) || 0));
  const fallback = 50 * 1.5 ** n;
  if (!shop) return Math.floor(fallback);
  return Math.floor(fromBalance("hireCost", fallback, shop, n));
}

export function furnitureCost(item) {
  return Math.round(fromBalance("furnitureCost", 200 / item.bonus, item));
}

export function partnerTrainCost(level) {
  const lv = partnerLevel(level);
  return Math.floor(fromBalance("partnerTrainCost", 40 * lv, lv));
}

export const PARTNER_SHARD_COST = 3;

function spend(state, cost, toast) {
  if (!Number.isFinite(cost) || cost < 0) return fail("bad-cost", "价格异常");
  if (!Number.isFinite(state.gold)) return fail("bad-balance", "账目异常，稍后再试");
  if (state.gold < cost) return fail("insufficient-gold", toast || "现金不够");
  state.gold -= cost;
  return null;
}

export function upgradeShop(state, shopId) {
  const shop = SHOP_BY_ID.get(shopId);
  const slot = state.shops?.[shopId];
  if (!shop || !slot) return fail("unknown-shop", "没有这家店");
  if (!slot.unlocked) return fail("locked", `主角升到 ${shop.unlockLevel} 级后收购${shop.name}`);
  slot.level = shopLevel(slot.level);
  if (slot.level >= SHOP_LEVEL_MAX) {
    return fail("level-max", `${shop.name} 已是 Lv.${SHOP_LEVEL_MAX} 满级`);
  }
  const cost = shopUpgradeCost(shop, slot.level);
  const denied = spend(state, cost, "现金不够装修");
  if (denied) return denied;
  slot.level += 1;
  return ok(`${shop.name} 升到 Lv.${slot.level}`);
}

export function hireStaff(state, shopId) {
  const shop = SHOP_BY_ID.get(shopId);
  const slot = state.shops?.[shopId];
  if (!shop || !slot) return fail("unknown-shop", "没有这家店");
  if (!slot.unlocked) return fail("locked", `主角升到 ${shop.unlockLevel} 级后收购${shop.name}`);
  if (slot.staff >= shop.staffSlots) return fail("slots-full", "工位已满");
  const cost = shopHireCost(shop, slot.staff);
  const denied = spend(state, cost, "发不起工资");
  if (denied) return denied;
  slot.staff += 1;
  if (slot.staff >= shop.staffSlots) {
    slot.auto = true;
    return ok(`${shop.name} 满员，转为自动经营`);
  }
  return ok(`${shop.name} 招到第 ${slot.staff} 位店员`);
}

export function buyFurniture(state, furnitureId) {
  const item = FURNITURE_BY_ID.get(furnitureId);
  if (!item) return fail("unknown-furniture", "没有这件家具");
  if (state.furniture.includes(item.id)) return fail("owned", "已经摆上了");
  const cost = furnitureCost(item);
  const denied = spend(state, cost, "先去商场赚一笔再装修");
  if (denied) return denied;
  state.furniture.push(item.id);
  return ok(`${item.name} 已入宅，离线加成 +${Math.round(item.bonus * 100)}%`);
}

/**
 * 前置口径：节点自带 `requires` 时以它为准，否则按 RESEARCH_NODES 顺序取上一条。
 * 视图里的顺序提示只是提示，真正的门在这里——绕过 UI 也开不出后面的产线。
 */
export function researchPrereqs(node) {
  if (Array.isArray(node?.requires)) {
    return node.requires.map((id) => RESEARCH_BY_ID.get(id)).filter(Boolean);
  }
  const index = RESEARCH_NODES.indexOf(node);
  return index > 0 ? [RESEARCH_NODES[index - 1]] : [];
}

export function buyResearch(state, nodeId) {
  const node = RESEARCH_BY_ID.get(nodeId);
  if (!node) return fail("unknown-node", "没有这个研发项");
  if (state.researchDone.includes(node.id)) return fail("done", "已研发");
  const missing = researchPrereqs(node).filter((n) => !state.researchDone.includes(n.id));
  if (missing.length) {
    return fail("missing-prereq", `产线要按顺序上：先把《${missing[0].name}》投产`);
  }
  const denied = spend(state, node.cost, "研发预算不够");
  if (denied) return denied;
  state.researchDone.push(node.id);
  return ok(`${node.name} 投产，+${node.income}/秒`);
}

function findPartner(state, partnerId) {
  return (state.partners || []).find((p) => p?.id === partnerId) || null;
}

export function signPartner(state, partnerId) {
  if (!PARTNER_IDS.has(partnerId)) return fail("unknown-partner", "查无此人");
  const p = findPartner(state, partnerId);
  if (!p) return fail("unknown-partner", "查无此人");
  if (p.owned) return fail("owned", "已经在阵中了");
  if (state.shards < PARTNER_SHARD_COST) {
    return fail("insufficient-shards", "碎片不够，去盲盒或占卜转转");
  }
  state.shards -= PARTNER_SHARD_COST;
  p.owned = true;
  return ok(`${partnerInfo(p)?.name || "新伙伴"} 签约成功`);
}

export function trainPartner(state, partnerId) {
  const p = findPartner(state, partnerId);
  if (!p) return fail("unknown-partner", "查无此人");
  if (!p.owned) return fail("not-owned", "先签约再培训");
  p.level = partnerLevel(p.level);
  if (p.level >= PARTNER_LEVEL_MAX) {
    return fail("level-max", `${partnerInfo(p)?.name || "伙伴"} 已是 Lv.${PARTNER_LEVEL_MAX} 满级`);
  }
  const cost = partnerTrainCost(p.level);
  const denied = spend(state, cost, "培训费不足");
  if (denied) return denied;
  p.level += 1;
  syncUnlocks(state);
  return ok(`${partnerInfo(p)?.name || "伙伴"} 升到 Lv.${p.level}`);
}

export function assignPartner(state, partnerId, shopId) {
  const p = findPartner(state, partnerId);
  if (!p) return fail("unknown-partner", "查无此人");
  if (!p.owned) return fail("not-owned", "先签约再派驻");
  if (shopId !== null && !state.shops?.[shopId]) return fail("unknown-shop", "没有这家店");
  if (shopId !== null && !state.shops[shopId].unlocked) return fail("locked", "这家店还没开");
  // 一店最多 N 位：没有人数帽时最优解永远是「全员堆同一家店」，其他店成摆设。
  if (shopId !== null && p.assigned !== shopId) {
    const here = partnersAt(state, shopId).filter((x) => x.id !== p.id);
    if (here.length >= PARTNERS_PER_SHOP_MAX) {
      const shopName = SHOP_BY_ID.get(shopId)?.name || "这家店";
      return fail("shop-crowded", `${shopName}最多驻 ${PARTNERS_PER_SHOP_MAX} 位伙伴，先撤回一位`);
    }
  }
  p.assigned = shopId;
  syncUnlocks(state);
  const shop = SHOP_BY_ID.get(shopId);
  return ok(shop ? `派驻${shop.name}` : "已撤回驻店");
}

export function wearOutfit(state, slot, itemId) {
  const list = OUTFITS[slot];
  if (!list) return fail("unknown-slot", "没有这个槽位");
  const item = list.find((i) => i.id === itemId);
  if (!item) return fail("unknown-item", "没有这件单品");
  state.outfit[slot] = item;
  return ok();
}

export function setName(state, raw) {
  const name = String(raw ?? "").trim().slice(0, 12);
  if (!name) return fail("empty-name", "总得有个名字");
  state.name = name;
  return ok();
}

export function finishIntro(state) {
  if (state.introDone) return fail("done");
  state.introDone = true;
  return ok();
}

export function toggleMute(state, next) {
  state.muted = typeof next === "boolean" ? next : !state.muted;
  return ok(state.muted ? "已静音" : "已恢复音效");
}

/** 小游戏/事件结算统一入口：赏金数值由调用方查表得出，这里只负责写账。 */
export function reward(state, { gold = 0, xp = 0, shards = 0, toast } = {}) {
  if (gold) grantGold(state, gold);
  if (xp) grantXp(state, xp);
  if (shards) state.shards = Math.max(0, state.shards + shards);
  tryLevelUp(state);
  return ok(toast);
}

/** 小游戏入场消费（盲盒 60、占卜 30 等），失败时不扣钱。 */
export function payFee(state, cost, toast) {
  const denied = spend(state, cost, toast);
  if (denied) return denied;
  return ok();
}

/**
 * 导入存档：与加载共用 migrate + deepFill 管线，因此旧版本导出档也能吃。
 * 原地替换 state 内容，保持外部持有的引用有效。
 */
export function importState(state, json, now = Date.now()) {
  let next;
  try {
    next = fromSaveData(importSave(json), now);
  } catch {
    return fail("invalid-save", "存档无法识别");
  }
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, next);
  return ok("存档已导入");
}
