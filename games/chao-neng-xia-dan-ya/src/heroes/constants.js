/** 英雄运行时常量与词汇表（Opus-3 所有权）。 */
import { BASE_ENERGY_MAX, BASE_HIT_ENERGY } from "./energy.js";

/** 上场位固定 5 人（GDD：主菜单组 5 人禽类小队）。 */
export const FIELD_SIZE = 5;

/** 能量口径全部来自 `energy.js`（即 `src/data`），这里只做转出。 */
export { BASE_ENERGY_MAX };

/** 缺字段英雄的兜底基础属性；`src/data` 补全后以数据表为准。 */
export const DEFAULT_BASE_STATS = {
  atk: 12,
  hp: 100,
  eggRadius: 11,
  eggPower: 1,
  eggs: 1,
  energyMax: BASE_ENERGY_MAX,
  energyGain: BASE_HIT_ENERGY,
  critRate: 0.05,
  critMul: 1.6,
};

/** 技能触发时机。战斗层按这些名字派发事件。 */
export const TRIGGERS = {
  BATTLE_START: "onBattleStart",
  LAUNCH: "onLaunch",
  HIT: "onHit",
  BRICK_BREAK: "onBrickBreak",
  PEG_HIT: "onPegHit",
  KILL: "onKill",
  COMBO: "onCombo",
  EGG_RECYCLED: "onEggRecycled",
  TURN_END: "onTurnEnd",
  ULTIMATE: "onUltimate",
  AURA: "aura",
};

export const TRIGGER_LIST = Object.values(TRIGGERS);

/** 技能产出的效果种类。战斗 / 物理 / 模式层按 kind 消费，英雄层不自己执行。 */
export const EFFECTS = {
  SPAWN_EGG: "spawn_egg",
  DAMAGE: "damage",
  HEAL: "heal",
  SHIELD: "shield",
  BUFF: "buff",
  STATUS: "status",
  ENERGY: "energy",
  FIELD: "field",
  MODIFIER: "modifier",
};

/* 流派清单不在这里硬编码：见 `squad.js` 的 SCHOOLS，跟随 `src/data/synergies.js`。 */
