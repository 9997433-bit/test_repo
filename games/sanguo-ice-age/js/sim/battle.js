/** 自动战斗：兵种克制（步克骑、骑克弓、弓克步）+ 阵营克制（吴>蜀>魏>吴）。 */
import {
  ARMY,
  BATTLE,
  FACTION_BEATS,
  FACTION_NAMES,
  TROOP_BEATS,
  TROOP_NAMES,
} from "../config.js";
import { STAGES } from "../data/enemies.js";
import { HEROES_BY_ID } from "../data/heroes.js";
import { heroStats, teamHeroes } from "./heroes.js";
import { nextRandom } from "../engine/rng.js";
import { storageCap, pushLog } from "./state.js";

const INITIATIVE = { archer: 3, cavalry: 2, infantry: 1 };

/** 队伍阵营协同（2 同阵营 1.08 / 3 同阵营 1.2）。 */
export function sideSynergy(units) {
  const count = {};
  for (const u of units) count[u.faction] = (count[u.faction] || 0) + 1;
  const max = Math.max(0, ...Object.values(count));
  if (units.length >= 3 && max >= 3) return BATTLE.synergy3;
  if (max >= 2) return BATTLE.synergy2;
  return 1;
}

export function makeHeroUnit(inst, troopsAssigned) {
  const proto = HEROES_BY_ID[inst.id];
  const stats = heroStats(inst);
  return {
    name: proto.name,
    faction: proto.faction,
    troop: proto.troop,
    heroAtk: stats.atk,
    heroDef: stats.def,
    skill: proto.skill,
    troops: troopsAssigned,
    initial: troopsAssigned,
    troopStats: ARMY.stats[proto.troop],
  };
}

export function makeEnemyUnit(spec) {
  return {
    name: spec.name,
    faction: spec.faction,
    troop: spec.troop,
    heroAtk: spec.atk,
    heroDef: spec.def,
    skill: null,
    troops: spec.troops,
    initial: spec.troops,
    troopStats: ARMY.stats[spec.troop],
  };
}

function alive(units) {
  return units.filter((u) => u.troops > 0);
}

export function attackOnce(attacker, defender, synergy, rng, log, round, sideName) {
  let mult = synergy;
  const tags = [];
  if (TROOP_BEATS[attacker.troop] === defender.troop) {
    mult *= BATTLE.counterBonus;
    tags.push("兵种克制");
  } else if (TROOP_BEATS[defender.troop] === attacker.troop) {
    mult *= BATTLE.counterPenalty;
  }
  if (FACTION_BEATS[attacker.faction] === defender.faction) {
    mult *= BATTLE.factionBonus;
    tags.push(`${FACTION_NAMES[attacker.faction]}克${FACTION_NAMES[defender.faction]}`);
  } else if (FACTION_BEATS[defender.faction] === attacker.faction) {
    mult *= BATTLE.factionPenalty;
  }
  let skillName = "";
  if (attacker.skill && rng() < BATTLE.skillChance) {
    mult *= attacker.skill.mult;
    skillName = attacker.skill.name;
  }
  const variance = 1 + (rng() * 2 - 1) * BATTLE.variance;
  const raw = (attacker.heroAtk * BATTLE.heroAtkWeight + attacker.troops * attacker.troopStats.atk) * mult * variance;
  const effDef = defender.heroDef * BATTLE.heroDefShield + defender.troopStats.def * 10;
  const damage = (raw * 100) / (100 + effDef);
  const losses = Math.min(defender.troops, damage / defender.troopStats.hp);
  defender.troops -= losses;

  const bits = [];
  if (skillName) bits.push(`发动【${skillName}】`);
  if (tags.length) bits.push(tags.join("，"));
  const suffix = bits.length ? `（${bits.join("；")}）` : "";
  log.push({
    round,
    side: sideName,
    text: `${attacker.name}（${TROOP_NAMES[attacker.troop]}）攻击 ${defender.name}，歼敌 ${Math.round(losses)}${suffix}${defender.troops <= 0 ? "——敌阵溃散！" : ""}`,
  });
}

/**
 * 纯函数自动战。返回 { winner: "attacker"|"defender", rounds, log, atkUnits, defUnits }。
 * rng: () => [0,1)。
 */
export function simulateBattle(atkUnits, defUnits, rng) {
  const log = [];
  const atkSyn = sideSynergy(atkUnits);
  const defSyn = sideSynergy(defUnits);
  if (atkSyn > 1) log.push({ round: 0, side: "attacker", text: `我军同阵营协同，攻势 +${Math.round((atkSyn - 1) * 100)}%。` });

  let round = 0;
  while (round < BATTLE.maxRounds) {
    round++;
    const actors = [
      ...alive(atkUnits).map((u) => ({ u, side: "attacker", syn: atkSyn })),
      ...alive(defUnits).map((u) => ({ u, side: "defender", syn: defSyn })),
    ].sort((a, b) => {
      const d = INITIATIVE[b.u.troop] - INITIATIVE[a.u.troop];
      if (d !== 0) return d;
      return a.side === "attacker" ? -1 : 1;
    });

    for (const actor of actors) {
      if (actor.u.troops <= 0) continue;
      const enemies = actor.side === "attacker" ? alive(defUnits) : alive(atkUnits);
      if (enemies.length === 0) break;
      attackOnce(actor.u, enemies[0], actor.syn, rng, log, round, actor.side);
    }

    if (alive(defUnits).length === 0) {
      return { winner: "attacker", rounds: round, log, atkUnits, defUnits };
    }
    if (alive(atkUnits).length === 0) {
      return { winner: "defender", rounds: round, log, atkUnits, defUnits };
    }
  }
  log.push({ round, side: "defender", text: "相持不下，我军粮尽退兵。" });
  return { winner: "defender", rounds: round, log, atkUnits, defUnits };
}

/** 出阵配置：按上阵顺序给同兵种武将分配兵力池。 */
export function expeditionUnits(state) {
  const pool = { ...state.army };
  const units = [];
  for (const inst of teamHeroes(state)) {
    const proto = HEROES_BY_ID[inst.id];
    const stats = heroStats(inst);
    const take = Math.min(stats.lead, Math.floor(pool[proto.troop]));
    pool[proto.troop] -= take;
    units.push(makeHeroUnit(inst, take));
  }
  return units;
}

export function teamPower(state) {
  let power = 0;
  for (const u of expeditionUnits(state)) {
    power += u.heroAtk * BATTLE.heroAtkWeight + u.troops * u.troopStats.atk;
  }
  return Math.round(power);
}

export function stagePower(stage) {
  let power = 0;
  for (const spec of stage.units) {
    power += spec.atk * BATTLE.heroAtkWeight + spec.troops * ARMY.stats[spec.troop].atk;
  }
  return Math.round(power);
}

export function hospitalRescueRate(state) {
  return Math.min(BATTLE.hospitalRescueMax, state.buildings.hospital * BATTLE.hospitalRescuePerLevel);
}

/**
 * 讨伐第 stageIdx 关（1 基）。消耗 1 行军令；胜利得资源/招贤令/将魂。
 */
export function runExpedition(state, stageIdx) {
  const stage = STAGES[stageIdx - 1];
  if (!stage) return { error: "关卡不存在" };
  if (stageIdx > state.stage + 1) return { error: "需先通关前一关" };
  if (state.marches < 1) return { error: "行军令不足（每天恢复 1）" };
  if (state.gameOver) return { error: "城已破，无力出征" };

  const atkUnits = expeditionUnits(state);
  if (atkUnits.length === 0) return { error: "请先在「武将」页编成出阵队伍" };
  const totalTroopsAssigned = atkUnits.reduce((sum, u) => sum + u.troops, 0);
  if (totalTroopsAssigned <= 0) return { error: "没有可用兵力，请先练兵" };

  state.marches -= 1;
  const defUnits = stage.units.map(makeEnemyUnit);
  const rng = () => nextRandom(state);
  const result = simulateBattle(atkUnits, defUnits, rng);

  // —— 结算战损（军医所抢救） ——
  const rescueRate = hospitalRescueRate(state);
  const losses = {};
  const rescued = {};
  for (const u of atkUnits) {
    const lost = Math.round(u.initial - Math.max(0, u.troops));
    if (lost <= 0) continue;
    const saved = Math.floor(lost * rescueRate);
    losses[u.troop] = (losses[u.troop] || 0) + (lost - saved);
    rescued[u.troop] = (rescued[u.troop] || 0) + saved;
  }
  for (const [type, n] of Object.entries(losses)) {
    state.army[type] = Math.max(0, state.army[type] - n);
  }

  const win = result.winner === "attacker";
  let rewards = null;
  if (win) {
    const firstClear = stageIdx > state.stage;
    rewards = { ...stage.rewards };
    if (firstClear && stage.firstClear) {
      if (stage.firstClear.tokens) rewards.tokens = stage.firstClear.tokens;
      if (stage.firstClear.souls) rewards.souls = stage.firstClear.souls;
    }
    const cap = storageCap(state);
    for (const res of ["food", "wood", "coal", "iron"]) {
      if (rewards[res]) state.resources[res] = Math.min(cap, state.resources[res] + rewards[res]);
    }
    if (rewards.tokens) state.tokens += rewards.tokens;
    if (rewards.souls) state.souls += rewards.souls;
    state.stage = Math.max(state.stage, stageIdx);
    state.stats.battlesWon++;
    pushLog(state, `讨伐「${stage.name}」告捷！${firstClear ? "（首通）" : ""}`, "battle");
  } else {
    state.stats.battlesLost++;
    pushLog(state, `讨伐「${stage.name}」失利，残部撤回城中。`, "danger");
  }

  const battle = {
    stageIdx,
    stageName: stage.name,
    win,
    rounds: result.rounds,
    log: result.log,
    losses,
    rescued,
    rewards,
  };
  state.lastBattle = battle;
  return battle;
}
