import {
  SHOPS,
  FURNITURE,
  RESEARCH_NODES,
  shopRate,
  offlineGold,
  partnerShopBonus,
} from "../data/balance.js";

export function charmOf(outfit) {
  return Object.values(outfit).reduce((sum, item) => sum + (item?.charm || 0), 0);
}

export function furnitureBonus(ownedIds) {
  return FURNITURE.filter((f) => ownedIds.includes(f.id)).reduce((s, f) => s + f.bonus, 0);
}

export function researchIncome(doneIds) {
  return RESEARCH_NODES.filter((n) => doneIds.includes(n.id)).reduce((s, n) => s + n.income, 0);
}

export function shopBonusMap(partners, shopsState) {
  const map = {};
  for (const shop of SHOPS) {
    const assigned = Object.entries(shopsState).flatMap(([shopId, shopData]) =>
      (shopData.assignees || [])
        .map((pid) => partners.find((p) => p.id === pid))
        .filter(Boolean)
        .filter(() => shopId === shop.id),
    );
    map[shop.id] = assigned.reduce(
      (s, p) => s + partnerShopBonus(p.specialty, shop.specialty, p.level),
      0,
    );
  }
  return map;
}

export function totalOnlinePerSec(state) {
  const charm = charmOf(state.outfit);
  const bonuses = shopBonusMap(state.partners, state.shops);
  let sum = researchIncome(state.researchDone);
  for (const shop of SHOPS) {
    const s = state.shops[shop.id];
    if (!s?.unlocked) continue;
    const staff = s.staff || 0;
    const autoMul = s.auto ? 1 : 0.35;
    sum += shopRate(shop, s.level, staff, bonuses[shop.id] || 0, charm) * autoMul;
  }
  return sum;
}

export function settleOffline(state, now = Date.now()) {
  const last = state.lastTick || now;
  const hours = (now - last) / 3600000;
  if (hours < 1 / 60) return { gold: 0, hours: 0 };
  const gold = offlineGold(totalOnlinePerSec(state), hours, furnitureBonus(state.furniture));
  return { gold: Math.floor(gold), hours };
}

export function formatGold(n) {
  const v = Math.floor(n);
  if (v >= 1e8) return `${(v / 1e8).toFixed(2)}亿`;
  if (v >= 1e4) return `${(v / 1e4).toFixed(2)}万`;
  return String(v);
}
