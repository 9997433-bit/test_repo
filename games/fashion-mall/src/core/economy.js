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

const PARTNER_BY_ID = new Map(PARTNERS.map((p) => [p.id, p]));

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

export function shopBonusMap(partners) {
  const map = {};
  for (const shop of SHOPS) map[shop.id] = 0;
  for (const raw of partners || []) {
    if (!raw?.owned || !raw.assigned || !(raw.assigned in map)) continue;
    const p = partnerInfo(raw);
    const shop = SHOPS.find((s) => s.id === raw.assigned);
    if (!p || !shop) continue;
    map[shop.id] += partnerShopBonus(p.specialty, shop.specialty, Math.max(1, p.level || 1));
  }
  return map;
}

export function totalOnlinePerSec(state) {
  const charm = charmOf(state.outfit);
  const bonuses = shopBonusMap(state.partners);
  let sum = researchIncome(state.researchDone);
  for (const shop of SHOPS) {
    const s = state.shops?.[shop.id];
    if (!s?.unlocked) continue;
    const staff = s.staff || 0;
    const autoMul = s.auto ? 1 : 0.35;
    sum += shopRate(shop, s.level, staff, bonuses[shop.id] || 0, charm) * autoMul;
  }
  return sum;
}

export function settleOffline(state, now = Date.now()) {
  const last = Number.isFinite(state.lastTick) ? state.lastTick : now;
  const hours = Math.max(0, (now - last) / 3600000);
  if (hours <= 0) return { gold: 0, hours: 0 };
  const gold = offlineGold(totalOnlinePerSec(state), hours, furnitureBonus(state.furniture));
  return { gold: Math.floor(gold), hours };
}

export function formatGold(n) {
  const v = Math.floor(Number(n) || 0);
  if (v >= 1e8) return `${(v / 1e8).toFixed(2)}亿`;
  if (v >= 1e4) return `${(v / 1e4).toFixed(2)}万`;
  return String(v);
}
