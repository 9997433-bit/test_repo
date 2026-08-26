/**
 * 平衡探针：node tests/probes.mjs
 * 用贪心机器人无头跑完 60 天，验证「会玩的玩家」能活下来且推进主线；
 * 同时验证「放置不管」会走向失败（游戏必须有压力）。
 */
import { TICKS_PER_DAY } from "../js/config.js";
import { createInitialState } from "../js/sim/state.js";
import { tickGame } from "../js/sim/tick.js";
import { teamPower, stagePower } from "../js/sim/battle.js";
import { STAGES } from "../js/data/enemies.js";
import { botAct } from "./bot.mjs";

let failures = 0;
function check(cond, msg) {
  if (cond) console.log(`  ✓ ${msg}`);
  else {
    failures++;
    console.error(`  ✗ ${msg}`);
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
