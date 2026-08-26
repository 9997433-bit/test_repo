// 派生倍率的唯一读表口径：天气五轴（prod/salvage/hunger/thirst/fishing/diveO2/stillBonus）
// 加上跟建筑相关的修正（潜水船坞邻接省氧）。sim 与 UI/探索都读这里，
// 谁都不用再在自己那边抄一份天气数值。
import { WEATHERS } from "../data/weather.js";
import { BUILDINGS } from "../data/buildings.js";
import { adjacencyIndex } from "./grid.js";

const DIVE_DOCK = "dive_dock";

function num(v, fallback) {
  return Number.isFinite(v) ? v : fallback;
}

export function weatherOf(state) {
  return WEATHERS[state?.world?.weather] || WEATHERS.clear;
}

// 指挥中心等级；没建就是 0 级（UNLOCK_HQ / WEATHER_SCHEDULE 的档位口径）。
export function hqLevel(state) {
  let best = 0;
  for (const b of state?.buildings || []) {
    if (b.type === "hq") best = Math.max(best, b.level || 1);
  }
  return best;
}

// 船坞挨着 adjacency.likes 里的建筑就省氧，省多少读 dive_dock.adjacency.bonus。
function diveGearMult(state, index) {
  const def = BUILDINGS[DIVE_DOCK];
  const bonus = num(def?.adjacency?.bonus, 0);
  const likes = def?.adjacency?.likes || [];
  if (!bonus || !likes.length) return 1;
  const idx = index || adjacencyIndex(state);
  for (const b of state?.buildings || []) {
    if (b.type !== DIVE_DOCK) continue;
    const near = idx.get(b.id);
    if (!near) continue;
    if (likes.includes("*") ? near.types.size > 0 : likes.some((t) => near.types.has(t))) {
      return 1 - bonus;
    }
  }
  return 1;
}

// 纯派生，不写 state。index 可选：调用方已经算过邻接就传进来，省一次扫描。
export function weatherMods(state, index = null) {
  const w = weatherOf(state);
  const fishing = num(w.fishing, 1);
  const diveO2 = num(w.diveO2, 1) * diveGearMult(state, index);
  return {
    weather: w.id,
    name: w.name,
    prod: num(w.prod, 1),
    salvage: num(w.salvage, 1),
    damage: num(w.damage, 0),
    hunger: num(w.hunger, 1),
    thirst: num(w.thirst, 1),
    fishing,
    diveO2,
    stillBonus: num(w.stillBonus, 1),
    warnSec: num(w.warnSec, 0),
    quip: w.quip || "",
    canFish: fishing > 0,
    canDive: diveO2 > 0,
  };
}
