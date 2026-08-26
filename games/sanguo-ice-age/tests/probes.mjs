/**
 * 平衡探针：node tests/probes.mjs
 * 用贪心机器人无头跑完 60 天，验证「会玩的玩家」能活下来且推进主线；
 * 同时验证「放置不管」会走向失败（游戏必须有压力）。
 */
import { TICKS_PER_DAY } from "../js/config.js";
import { createInitialState, popCap, storageCap } from "../js/sim/state.js";
import { tickGame } from "../js/sim/tick.js";
import { canUpgrade, upgrade, nextCost } from "../js/sim/buildings.js";
import {
  recruitOnce,
  buyToken,
  setTeamSlot,
  heroStats,
  levelUpHero,
  ownedHero,
  teamHeroes,
} from "../js/sim/heroes.js";
import { HEROES_BY_ID } from "../js/data/heroes.js";
import { QUALITY_RANK } from "../js/config.js";
import { train, maxTrainable } from "../js/sim/army.js";
import { runExpedition, teamPower, stagePower, expeditionUnits } from "../js/sim/battle.js";
import { STAGES } from "../js/data/enemies.js";
import { fuelNeedPerTick } from "../js/sim/climate.js";

let failures = 0;
function check(cond, msg) {
  if (cond) console.log(`  ✓ ${msg}`);
  else {
    failures++;
    console.error(`  ✗ ${msg}`);
  }
}

/**
 * 显式建造序列（真人开荒思路）：一次只追一个目标。
 * "camp" 占位符解析为与上阵武将兵种匹配的兵营。
 */
const GOALS = [
  ["hunter", 1], ["lumber", 1],
  ["furnace", 2],
  ["lumber", 2], ["house", 1], ["hunter", 2],
  ["coalMine", 1],
  ["furnace", 3],
  ["lumber", 3], ["recruitHall", 1], ["camp", 1], ["hunter", 3],
  ["ironMine", 1], ["house", 2], ["warehouse", 1],
  ["furnace", 4],
  ["lumber", 4], ["camp", 2], ["hunter", 4],
  ["kitchen", 1], ["house", 3], ["coalMine", 2], ["ironMine", 2],
  ["furnace", 5],
  ["lumber", 5], ["camp", 3], ["hunter", 5],
  ["clinic", 1], ["house", 4], ["warehouse", 2],
  ["coalMine", 3], ["ironMine", 3], ["camp", 4],
  ["furnace", 6],
  ["lumber", 6], ["hunter", 6],
  ["recruitHall", 2], ["hospital", 1], ["academy", 1], ["wall", 1],
  ["house", 5], ["camp", 5], ["coalMine", 4], ["ironMine", 4],
  ["furnace", 7],
  ["lumber", 7], ["hunter", 7], ["camp", 6], ["house", 6], ["warehouse", 3],
  ["furnace", 8],
];

function botAct(s) {
  // —— 火炉档位 ——
  if (s.blizzard.active || s.temperature < 0) s.fuel.mode = "high";
  else if (s.temperature > 12) s.fuel.mode = "low";
  else s.fuel.mode = "normal";

  const fuelBuffer = fuelNeedPerTick(s) * TICKS_PER_DAY * 2 + 10;
  const tryBuy = (id) => {
    const chk = canUpgrade(s, id);
    if (!chk.ok) return chk;
    const cost = nextCost(s, id) || {};
    const bootstrap = (id === "lumber" || id === "hunter") && s.buildings[id] === 0;
    if (!bootstrap && s.resources.wood - (cost.wood || 0) < fuelBuffer) {
      return { ok: false, reason: "留作燃料" };
    }
    const ok = upgrade(s, id).ok;
    if (ok && globalThis.__ledger) globalThis.__ledger.push(`${s.day}日 ${id} ${JSON.stringify(cost)}`);
    return { ok, reason: "" };
  };

  // —— 动态插队：保粮线 / 住房 ——
  const foodDays = s.resources.food / Math.max(1, s.population);
  if (foodDays < 6) tryBuy("hunter");
  if (s.population >= popCap(s) - 1) tryBuy("house");

  // —— 目标队列：结构性受阻跳过，缺资源就攒钱等待 ——
  const teamTroop = teamHeroes(s).map((h) => HEROES_BY_ID[h.id].troop)[0] || "infantry";
  const campId = { infantry: "infantryCamp", archer: "archerCamp", cavalry: "cavalryCamp" }[teamTroop];
  for (const [rawId, lvl] of GOALS) {
    const id = rawId === "camp" ? campId : rawId;
    if (s.buildings[id] >= lvl) continue;
    const r = tryBuy(id);
    if (r.ok) break;
    const structural = r.reason.includes("解锁") || r.reason.includes("火炉限制") || r.reason.includes("最高等级");
    if (!structural) break; // 缺资源/留燃料 → 攒钱
  }

  // —— 招贤与编队 ——
  if (s.buildings.recruitHall >= 1) {
    if (s.resources.food > 300 && s.resources.iron > 120) buyToken(s);
    while (s.tokens > 0) recruitOnce(s);
    const sorted = [...s.heroes].sort((a, b) => {
      const qa = QUALITY_RANK[HEROES_BY_ID[a.id].quality];
      const qb = QUALITY_RANK[HEROES_BY_ID[b.id].quality];
      return qb - qa || b.level - a.level;
    });
    sorted.slice(0, 3).forEach((h, i) => setTeamSlot(s, i, h.id));
    // 将魂养成：轮流升前两名
    for (const h of sorted.slice(0, 2)) {
      let guard = 0;
      while (guard++ < 20 && levelUpHero(s, h.id).ok) {
        /* 继续升 */
      }
    }
  }

  // —— 练兵：余粮超过 5 天就补兵，小批量避免粮荒 ——
  if (s.resources.food / Math.max(1, s.population) > 5) {
    for (const [type, camp] of [
      ["infantry", "infantryCamp"],
      ["archer", "archerCamp"],
      ["cavalry", "cavalryCamp"],
    ]) {
      if (s.buildings[camp] < 1) continue;
      const leadNeed = s.team
        .filter(Boolean)
        .map((id) => ownedHero(s, id))
        .filter((h) => h && HEROES_BY_ID[h.id].troop === type)
        .reduce((sum, h) => sum + heroStats(h).lead, 0);
      if (leadNeed <= 0) continue;
      // 练兵量对标下一关敌军规模（×1.2），但不超过统率
      const enemyScale =
        s.stage < STAGES.length
          ? STAGES[s.stage].units.reduce((sum, u) => sum + u.troops, 0) * 1.2
          : 0;
      const target = Math.ceil(Math.min(leadNeed, Math.max(enemyScale, 60)));
      const gap = Math.min(25, maxTrainable(s, type), Math.max(0, target - s.army[type]));
      if (gap > 0) train(s, type, gap);
    }
  }

  // —— 讨伐：战力占优且兵力比 ≥0.7 才攻新关；打不动就刷旧关补给 ——
  if (s.marches > 0 && s.stage < STAGES.length) {
    const myTroops = expeditionUnits(s).reduce((sum, u) => sum + u.troops, 0);
    const enemyTroops = (stage) => stage.units.reduce((sum, u) => sum + u.troops, 0);
    const next = STAGES[s.stage];
    const power = teamPower(s);
    if (power > stagePower(next) * 1.02 && myTroops >= enemyTroops(next) * 0.7) {
      runExpedition(s, s.stage + 1);
    } else if (
      s.stage >= 1 &&
      s.marches >= 3 &&
      power > stagePower(STAGES[s.stage - 1]) * 1.3 &&
      myTroops >= enemyTroops(STAGES[s.stage - 1])
    ) {
      runExpedition(s, s.stage);
    }
  }
}

// ————————————————————————————————————————
console.log("探针 1：贪心机器人 60 天自动局");
{
  const s = createInitialState(2026);
  globalThis.__ledger = [];
  const DAYS = 60;
  console.log("  日 | 温度  | 人口 | 民心 | 肉    | 木    | 煤   | 铁   | 炉 | 关卡 | 任务");
  for (let t = 0; t < TICKS_PER_DAY * DAYS && !s.gameOver; t++) {
    tickGame(s);
    if (t % 4 === 0) botAct(s);
    if (process.env.DEBUG_WAR && t % (TICKS_PER_DAY * 5) === TICKS_PER_DAY * 5 - 1) {
      const tp = teamPower(s);
      const sp = s.stage < STAGES.length ? stagePower(STAGES[s.stage]) : 0;
      console.log(`  [war] day ${s.day} army=${JSON.stringify(s.army)} trained=${s.stats.trained} won=${s.stats.battlesWon} lost=${s.stats.battlesLost} marches=${s.marches} power=${tp} need ${(sp * 1.02).toFixed(0)} camps=${s.buildings.infantryCamp}/${s.buildings.archerCamp}/${s.buildings.cavalryCamp}`);
    }
    if (t % (TICKS_PER_DAY * 5) === TICKS_PER_DAY * 5 - 1) {
      const r = s.resources;
      console.log(
        `  ${String(s.day).padStart(2)} | ${s.temperature.toFixed(1).padStart(5)} | ${String(Math.floor(s.population)).padStart(4)} | ${s.morale.toFixed(0).padStart(4)} | ${r.food.toFixed(0).padStart(5)} | ${r.wood.toFixed(0).padStart(5)} | ${r.coal.toFixed(0).padStart(4)} | ${r.iron.toFixed(0).padStart(4)} | ${s.buildings.furnace}  | ${String(s.stage).padStart(4)} | ${s.questIndex}/15`,
      );
    }
  }
  check(!s.gameOver, `60 天存活（人口 ${Math.floor(s.population)}）`);
  check(s.stats.blizzardsSurvived >= 7, `熬过 ≥7 次寒潮（实际 ${s.stats.blizzardsSurvived}）`);
  check(s.buildings.furnace >= 5, `火炉 ≥5 级（实际 ${s.buildings.furnace}）`);
  check(s.population >= 25, `人口 ≥25（实际 ${Math.floor(s.population)}）`);
  check(s.stage >= 3, `讨伐 ≥3 关（实际 ${s.stage}）`);
  check(s.questIndex >= 9, `主线 ≥9 个任务（实际 ${s.questIndex}）`);
  check(s.morale >= 40, `民心 ≥40（实际 ${s.morale.toFixed(0)}）`);
  if (process.env.DEBUG_LEDGER) console.log("购买记录:\n  " + globalThis.__ledger.join("\n  "));
}

// ————————————————————————————————————————
console.log("\n探针 2：放置不管（必须走向失败，证明有生存压力）");
{
  const s = createInitialState(2027);
  for (let t = 0; t < TICKS_PER_DAY * 30 && !s.gameOver; t++) tickGame(s);
  check(s.fuel.starved || s.gameOver, "30 天不管：燃料耗尽或灭亡");
  check(s.morale < 40, `民心恶化（实际 ${s.morale.toFixed(0)}）`);
  check(s.population < 12, `人口流失（实际 ${Math.floor(s.population)}）`);
}

console.log("");
if (failures) {
  console.error(`探针失败：${failures} 项未达标`);
  process.exit(1);
}
console.log("全部探针达标。");
