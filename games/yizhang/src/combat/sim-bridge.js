// combat → sim 的一次性接线。
//
// `src/sim/deps.js` 默认跑自带的兜底解算，真实战斗要靠 installCombat 注入。
// 谁 import 了 combat（main.js 的模块探测、跨模块测试），谁就应该拿到真实解算，
// 不该再要求每个调用方记得手动注入一次——所以这里在模块求值时自己装上去。
//
// 注意两点：
//  * 传的是转发适配器而不是命名空间，circular import 时也不会读到半初始化的绑定；
//  * sim 有朝一日改成静态 import combat，这段就会撞上初始化中的 deps 模块，
//    try/catch 让它安静地退化成 no-op（那时 sim 已经自己装好了）。

import { installCombat, installData } from "../sim/deps.js";
import * as data from "../data/index.js";
import * as combat from "./index.js";

const ADAPTER = {
  resolveSlap: (state, attacker, glove, now) => combat.resolveSlap(state, attacker, glove, now),
  resolveSkill: (state, attacker, glove, now) => combat.resolveSkill(state, attacker, glove, now),
  tickStatuses: (state, dt) => combat.tickStatuses(state, dt),
  applyAwaken: (attacker, glove) => combat.applyAwaken(attacker, glove),
};

/**
 * 把本模块装进 sim 的依赖表。返回是否装上（sim 缺席时为 false）。
 * 顺带把 `src/data` 的手套表也装上：解算按 data 的数值写的，sim 若还拿兜底数值
 * 发牌，攻击距离 / 冷却两边对不齐。data 缺席时 sim 自己会退回兜底。
 */
export function installIntoSim() {
  try {
    if (Array.isArray(data.GLOVES) && data.GLOVES.length) installData(data);
    installCombat(ADAPTER);
    return true;
  } catch {
    return false;
  }
}

export const installed = installIntoSim();
