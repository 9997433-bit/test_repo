/** UI 格式化工具（无 DOM 依赖）。 */
import { RESOURCE_NAMES, RESOURCE_ICONS, QUALITY_NAMES, FACTION_NAMES, TROOP_NAMES } from "../config.js";

export function fnum(n) {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.floor(n));
}

export function fsign(n, digits = 0) {
  const v = n.toFixed(digits);
  return n >= 0 ? `+${v}` : v;
}

export function costText(cost) {
  if (!cost) return "—";
  return Object.entries(cost)
    .map(([res, n]) => `${RESOURCE_ICONS[res]}${fnum(n)}`)
    .join(" ");
}

export function costTextLong(cost) {
  if (!cost) return "—";
  return Object.entries(cost)
    .map(([res, n]) => `${RESOURCE_NAMES[res]} ${fnum(n)}`)
    .join("、");
}

export function canPay(state, cost) {
  if (!cost) return false;
  return Object.entries(cost).every(([res, n]) => state.resources[res] >= n);
}

export function qualityClass(q) {
  return `q-${q}`;
}

export function qualityName(q) {
  return QUALITY_NAMES[q];
}

export function factionName(f) {
  return FACTION_NAMES[f];
}

export function troopName(t) {
  return TROOP_NAMES[t];
}

export function rewardText(reward) {
  if (!reward) return "";
  const parts = [];
  for (const [res, icon] of Object.entries(RESOURCE_ICONS)) {
    if (reward[res]) parts.push(`${icon}${fnum(reward[res])}`);
  }
  if (reward.tokens) parts.push(`🏮令×${reward.tokens}`);
  if (reward.souls) parts.push(`✨魂×${reward.souls}`);
  return parts.join(" ");
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
