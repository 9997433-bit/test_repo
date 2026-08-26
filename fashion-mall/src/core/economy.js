import * as BALANCE from "../data/balance.js";
import {
  SHOPS,
  PARTNERS,
  OUTFITS,
  FURNITURE,
  RESEARCH_NODES,
  shopRate,
  offlineGold,
  partnerShopBonus,
} from "../data/balance.js";
import {
  OFFLINE_CAP_HOURS,
  PARTNERS_PER_SHOP_MAX,
  finiteOr,
  partnerLevel,
  shopLevel,
} from "./limits.js";

const PARTNER_BY_ID = new Map(PARTNERS.map((p) => [p.id, p]));
const SHOP_BY_ID = new Map(SHOPS.map((s) => [s.id, s]));

/** 槽位取值既可能是 id 字符串（存档形态），也可能是整对象（运行时形态）。 */
export function outfitItem(slot, value) {
  const list = OUTFITS[slot];
  if (!list) return null;
  if (typeof value === "string") return list.find((i) => i.id === value) || null;
  if (value && typeof value === "object") {
    return list.find((i) => i.id === value.id) || (Number.isFinite(value.charm) ? value : null);
  }
  return null;
}

export function charmOf(outfit) {
  if (!outfit || typeof outfit !== "object") return 0;
  let sum = 0;
  for (const [slot, value] of Object.entries(outfit)) {
    sum += outfitItem(slot, value)?.charm || 0;
  }
  return sum;
}

/** 伙伴的静态部分永远查 PARTNERS，老档只带 id 也能拿到最新文案与特长。 */
export function partnerInfo(partner) {
  const id = typeof partner === "string" ? partner : partner?.id;
  const def = PARTNER_BY_ID.get(id);
  if (!def) return typeof partner === "object" ? partner : null;
  return typeof partner === "object" ? { ...def, ...partner } : { ...def };
}

/** 驻店查询的唯一依据是 partner.assigned，shops[].assignees 只是派生缓存。 */
export function partnersAt(state, shopId) {
  return (state?.partners || [])
    .filter((p) => p?.owned && p.assigned === shopId)
    .map((p) => partnerInfo(p))
    .filter(Boolean);
}

export function furnitureBonus(ownedIds) {
  if (!Array.isArray(ownedIds)) return 0;
  return FURNITURE.filter((f) => ownedIds.includes(f.id)).reduce((s, f) => s + f.bonus, 0);
}

export function researchIncome(doneIds) {
  if (!Array.isArray(doneIds)) return 0;
  return RESEARCH_NODES.filter((n) => doneIds.includes(n.id)).reduce((s, n) => s + n.income, 0);
}

/** 同店多伙伴按 balance#combinePartnerBonuses 衰减合并，未导出时退化为求和。 */
export function combineBonuses(list) {
  const values = [...list];
  if (typeof BALANCE.combinePartnerBonuses === "function") {
    const combined = Number(BALANCE.combinePartnerBonuses(values));
    if (Number.isFinite(combined)) return combined;
  }
  return values.reduce((sum, b) => sum + b, 0);
}

/**
 * 驻店加成：同店取加成最高的前 PARTNERS_PER_SHOP_MAX 位再衰减合并。
 * 人数帽在动作层与读档处都会拦，这里再取一次前 N 是给手改存档兜底。
 */
export function shopBonusMap(partners) {
  const buckets = {};
  for (const shop of SHOPS) buckets[shop.id] = [];
  for (const raw of partners || []) {
    if (!raw?.owned || !raw.assigned || !(raw.assigned in buckets)) continue;
    const p = partnerInfo(raw);
    const shop = SHOP_BY_ID.get(raw.assigned);
    if (!p || !shop) continue;
    buckets[shop.id].push(
      finiteOr(partnerShopBonus(p.specialty, shop.specialty, partnerLevel(p.level)), 0),
    );
  }
  const map = {};
  for (const [shopId, list] of Object.entries(buckets)) {
    const top = list.sort((a, b) => b - a).slice(0, PARTNERS_PER_SHOP_MAX);
    map[shopId] = finiteOr(combineBonuses(top), 0);
  }
  return map;
}

export function totalOnlinePerSec(state) {
  const charm = finiteOr(charmOf(state.outfit), 0);
  const bonuses = shopBonusMap(state.partners);
  let sum = finiteOr(researchIncome(state.researchDone), 0);
  for (const shop of SHOPS) {
    const s = state.shops?.[shop.id];
    if (!s?.unlocked) continue;
    const staff = Math.min(shop.staffSlots, Math.max(0, finiteOr(s.staff, 0)));
    const autoMul = s.auto ? 1 : 0.35;
    // 等级在这里钳到帽内：手改存档写 Lv.9007199254740991 也只能吃到满级产出。
    const rate = shopRate(shop, shopLevel(s.level), staff, bonuses[shop.id] || 0, charm);
    sum += finiteOr(rate, 0) * autoMul;
  }
  return finiteOr(sum, 0);
}

/** 返回的 hours 是真实离开时长（供文案），cappedHours 才是计酬时长。 */
export function settleOffline(state, now = Date.now()) {
  if (!Number.isFinite(now)) return { gold: 0, hours: 0, cappedHours: 0 };
  const last = Number.isFinite(state.lastTick) ? state.lastTick : now;
  const hours = Math.max(0, (now - last) / 3600000);
  const cappedHours = Math.min(hours, OFFLINE_CAP_HOURS);
  if (hours <= 0) return { gold: 0, hours: 0, cappedHours: 0 };
  const gold = offlineGold(totalOnlinePerSec(state), hours, furnitureBonus(state.furniture));
  return { gold: Math.floor(finiteOr(gold, 0)), hours, cappedHours };
}

export function formatGold(n) {
  const v = Math.floor(finiteOr(n, 0));
  if (v >= 1e8) return `${(v / 1e8).toFixed(2)}亿`;
  if (v >= 1e4) return `${(v / 1e4).toFixed(2)}万`;
  return String(v);
}
