// 文案层。全篇管玩家叫「老大」；失败一律自嘲，不训人。
import { RESOURCE_META } from "../data/resources.js";
import { WEATHERS } from "../data/weather.js";

export const SCREEN_LABEL = {
  raft: "木筏",
  build: "建造",
  fish: "钓鱼",
  dive: "潜水",
  heroes: "英雄",
  campaign: "关卡",
};

export const SCREEN_KEY = { raft: "Esc", build: "B", fish: "F", dive: "V", heroes: "H", campaign: "C" };

export const RARITY_LABEL = { junk: "杂物", common: "普通", rare: "稀有", epic: "史诗", legend: "传说" };

export const ROLE_LABEL = {
  tank: "前排",
  archer: "射手",
  support: "辅助",
  mage: "法师",
  carry: "输出",
  warrior: "战士",
  hook: "钩子",
};

const FAIL_QUIPS = [
  "老大，这一手有点飘。",
  "废海不吃这套，换个思路。",
  "……当我没看见，老大再来。",
  "手滑了吧？我也这么觉得。",
  "老大，全船就你识字，稳住。",
  "海风太大，锅归它。",
];

let quipCursor = 0;

export function quip() {
  const line = FAIL_QUIPS[quipCursor % FAIL_QUIPS.length];
  quipCursor += 1;
  return line;
}

// deny() 已经给了中文 message，这里只补一句自嘲，避免 UI 再造一套原因表。
export function failLine(check, fallback = "现在做不了") {
  return `${check?.message || fallback}。${quip()}`;
}

export function resName(key) {
  return RESOURCE_META[key]?.name || key;
}

export function resColor(key) {
  return RESOURCE_META[key]?.color || "#fff7e8";
}

export function num(n) {
  const v = Number(n) || 0;
  if (Math.abs(v - Math.round(v)) < 0.05) return String(Math.round(v));
  return v.toFixed(1);
}

export function costLine(cost) {
  const parts = Object.entries(cost || {}).map(([k, v]) => `${resName(k)}${num(v)}`);
  return parts.length ? parts.join(" · ") : "免费";
}

export function weatherName(id) {
  return WEATHERS[id]?.name || id;
}

// 昼夜三档：与 tokens.css 的 data-phase 钩子一一对应。
export function phaseOf(timeOfDay) {
  const s = Math.sin((Number(timeOfDay) || 0) * Math.PI * 2);
  if (s > 0.2) return { id: "day", label: "白天" };
  if (s > -0.05) return { id: "dusk", label: "黄昏" };
  return { id: "night", label: "夜里" };
}

export function clockOf(timeOfDay) {
  const total = Math.round(((Number(timeOfDay) || 0) % 1) * 1440);
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}
