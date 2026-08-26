/**
 * HUD 稳定视图（Opus-3 所有权）。
 *
 * HUD 只读这里的字段，不要再去摸运行时实例的内部结构（`turn` / `skillMods` / `def` 等）——
 * 那些是英雄层的实现细节，会随平衡改动而变。本文件导出的键集合 `HUD_HERO_FIELDS`
 * 与 `HUD_BOND_FIELDS` 视为对 UI 层的契约：只增不改名，数值口径一律来自 `src/data`。
 *
 * 典型用法：
 *   const view = squadHudView(loadout.squad);   // 每帧调用也很便宜，纯读
 *   view.heroes[i].energyPct                    // 能量环
 *   view.heroes[i].ultReady                     // 大招按钮亮/灰
 *   view.bonds                                  // 局内羁绊面板
 */
import * as DATA from "../data/index.js";
import { ultimateCost } from "./runtime.js";

/** 英雄视图字段清单（顺序即文档顺序）。 */
export const HUD_HERO_FIELDS = Object.freeze([
  "uid",
  "id",
  "name",
  "slot",
  "alive",
  "active",
  "race",
  "raceName",
  "school",
  "schoolName",
  "role",
  "rarity",
  "element",
  "level",
  "star",
  "atk",
  "hp",
  "critRate",
  "critMul",
  "eggs",
  "eggRadius",
  "energy",
  "energyMax",
  "energyPct",
  "energyGain",
  "ultId",
  "ultName",
  "ultDesc",
  "ultCost",
  "ultReady",
  "skillId",
  "skillName",
  "skillDesc",
  "cooldown",
]);

/** 羁绊视图字段清单。 */
export const HUD_BOND_FIELDS = Object.freeze([
  "school",
  "schoolName",
  "count",
  "tier",
  "tierName",
  "label",
  "desc",
  "atkBonus",
]);

function pct(value, max) {
  if (!Number.isFinite(max) || max <= 0) return 0;
  return Math.max(0, Math.min(1, value / max));
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

export function schoolName(school) {
  return DATA.SCHOOLS?.[school]?.name ?? DATA.BONDS?.schools?.[school]?.name ?? school ?? "";
}

export function raceName(race) {
  return DATA.RACES?.[race]?.name ?? race ?? "";
}

/**
 * 一名英雄的 HUD 快照。所有能量字段都已经是数据表口径：
 * `energyMax === ultCost`（除非该英雄没有大招），所以「能量条满 = 大招可放」恒成立。
 * @param {object} instance `createHeroInstance` 的运行时实例
 * @param {{active?: boolean}} [options]
 */
export function heroHudView(instance, { active = false } = {}) {
  if (!instance) return null;
  const stats = instance.stats ?? {};
  const cost = ultimateCost(instance);
  const hasUlt = Number.isFinite(cost);

  return {
    uid: instance.uid,
    id: instance.id,
    name: instance.name,
    slot: instance.slot ?? 0,
    alive: instance.alive !== false,
    active,

    race: instance.race ?? null,
    raceName: raceName(instance.race),
    school: instance.school ?? null,
    schoolName: schoolName(instance.school),
    role: instance.role ?? null,
    rarity: instance.rarity ?? null,
    element: instance.element ?? null,

    level: instance.level ?? 1,
    star: instance.star ?? 1,
    atk: stats.atk ?? instance.atk ?? 0,
    hp: stats.hp ?? 0,
    critRate: stats.critRate ?? 0,
    critMul: stats.critMul ?? 1,
    eggs: stats.eggs ?? 1,
    eggRadius: stats.eggRadius ?? 0,

    energy: round2(instance.energy ?? 0),
    energyMax: instance.energyMax ?? 0,
    energyPct: round2(pct(instance.energy ?? 0, instance.energyMax ?? 0)),
    energyGain: stats.energyGain ?? 0,

    ultId: instance.ultId ?? instance.ult?.id ?? null,
    ultName: instance.ult?.name ?? null,
    ultDesc: instance.ult?.desc ?? "",
    ultCost: hasUlt ? cost : null,
    ultReady: hasUlt && instance.alive !== false && (instance.energy ?? 0) >= cost,

    skillId: instance.skill?.id ?? null,
    skillName: instance.skill?.name ?? null,
    skillDesc: instance.skill?.desc ?? "",
    cooldown: instance.cooldown ?? 0,
  };
}

/** 激活中的羁绊列表（局内羁绊面板用）。 */
export function bondHudList(squad) {
  return (squad?.bonds?.active ?? []).map((bond) => ({
    school: bond.school,
    schoolName: bond.name ?? schoolName(bond.school),
    count: bond.count,
    tier: bond.tier ?? bond.count,
    tierName: bond.tierName ?? bond.name ?? schoolName(bond.school),
    label: bond.label,
    desc: bond.desc ?? "",
    atkBonus: bond.atk ?? 0,
  }));
}

/**
 * 整支小队的 HUD 快照：英雄坞 + 羁绊面板 + 队伍级汇总。
 * @param {object} squad `createSquad` 的返回值
 */
export function squadHudView(squad) {
  const members = squad?.members ?? [];
  const activeIndex = squad?.active ?? -1;
  const heroes = members.map((instance, index) =>
    heroHudView(instance, { active: index === activeIndex }),
  );

  return {
    mode: squad?.mode ?? "preview",
    activeIndex,
    heroes,
    bonds: bondHudList(squad),
    schoolCounts: squad?.bonds?.counts ?? {},
    atkBonus: squad?.bonds?.atkBonus ?? 0,
    ultReadyCount: heroes.filter((hero) => hero?.ultReady).length,
    warnings: squad?.warnings ?? [],
  };
}
