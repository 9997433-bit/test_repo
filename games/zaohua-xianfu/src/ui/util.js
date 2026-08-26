const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** 道号等玩家输入一律经此入模板。 */
export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/** 1.38 → "+38%" */
export function pctOf(mul) {
  const v = Math.round(((mul ?? 1) - 1) * 100);
  return `${v >= 0 ? "+" : ""}${v}%`;
}

export function clampPct(ratio) {
  return Math.max(0, Math.min(100, (ratio ?? 0) * 100));
}

export function bar(ratio, cls = "") {
  return `<div class="hpbar ${cls}"><i style="width:${clampPct(ratio).toFixed(1)}%"></i></div>`;
}

export function chip(text, cls = "", attrs = "") {
  return `<span class="d-chip ${cls}"${attrs ? ` ${attrs}` : ""}>${text}</span>`;
}

/** 风水评签档位，阈值与 styles/mansion.css 的 .fengshui[data-tier] 三色对齐。 */
export const FENGSHUI_TIERS = [
  { min: 70, tier: "good", label: "上吉" },
  { min: 35, tier: "fair", label: "中平" },
  { min: -Infinity, tier: "poor", label: "下乘" },
];

export function fengshuiTier(score) {
  if (!Number.isFinite(score)) return null;
  return FENGSHUI_TIERS.find((t) => score >= t.min) ?? FENGSHUI_TIERS.at(-1);
}

export const ROLE_LABEL = {
  flex: "全能",
  heal: "医修",
  dps: "输出",
  aoe: "法修",
  support: "辅修",
  tank: "前排",
};

export function roleLabel(role) {
  return ROLE_LABEL[role] ?? "散修";
}

/** 与 store 的 RECRUIT 同一口径，面板需先行展示。 */
export function recruitCost(hero) {
  return { jade: 6 + (hero?.role === "dps" ? 2 : 0), stone: 40 };
}

export function affordable(resources, cost) {
  return Object.entries(cost).every(([k, v]) => (resources?.[k] ?? 0) >= v);
}

export function costText(cost, labels) {
  return Object.entries(cost)
    .map(([k, v]) => `${labels[k] ?? k}${Math.ceil(v)}`)
    .join(" ");
}

export const RES_LABEL = {
  qi: "灵气",
  stone: "灵石",
  herb: "灵草",
  wood: "灵木",
  ore: "灵矿",
  pills: "丹药",
  jade: "仙玉",
};

export const SLOT_LABEL = { attack: "攻击", defend: "防御", util: "通用" };
export const RARITY_LABEL = { gold: "金品", red: "红品", purple: "紫品", blue: "蓝品" };

/** 秒数 → "1分12秒" */
export function etaText(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return "";
  if (sec < 60) return `${Math.ceil(sec)} 秒`;
  if (sec < 3600) return `${Math.floor(sec / 60)} 分 ${Math.ceil(sec % 60)} 秒`;
  return `${(sec / 3600).toFixed(1)} 时`;
}
