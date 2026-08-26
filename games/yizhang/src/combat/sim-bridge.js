// combat → sim 的接线适配器。
//
// `src/sim/deps.js` 现在**静态** import 本模块所在的 combat，`getDeps().combat` 默认就是
// 真实解算，换算由 sim 自己的 `combat-bridge.js` 负责（朝向 ±π、命中结构、事件形状、
// 碎地记账）。所以这里不再抢着 `installCombat`：抢了只会把那层换算换成一层没有换算的
// 转发，还会把 `getDeps().usingRealCombat` 翻成 false，让启动自检误报「未接线」。
//
// 留下来的价值是 `SIM_ADAPTER`。凡是**必须**显式注入 combat 的宿主
// （`src/core/modules.js` 的 `wireSimDeps`、`scripts/harness.mjs`、`src/render/smoke.js`），
// 都应该注入它，而不是注入 combat 的模块命名空间：命名空间里的函数按 combat 自己的
// 朝向约定读 `player.yaw`（yaw=0 面向 +Z），而 sim 冻结的是 yaw=0 面向 -Z，
// 直接塞进 sim 会让全场扇击、拉扯、反击的方向整体反 180°。

import { installCombat, installData, getDeps } from "../sim/deps.js";
import * as simCombatBridge from "../sim/combat-bridge.js";
import * as data from "../data/index.js";

/**
 * 可以直接 `sim.installCombat(SIM_ADAPTER)` 的适配器。
 * 转发到 sim 自己的换算层，而不是另写一套：两条路径永远同一套朝向与命中语义。
 * 用箭头转发（而不是直接引用绑定）是因为这里与 sim 是循环 import，
 * 模块求值期取到的可能是半初始化的绑定。
 */
export const SIM_ADAPTER = {
  resolveSlap: (state, attacker, glove, now) => simCombatBridge.resolveSlap(state, attacker, glove, now),
  resolveSkill: (state, attacker, glove, now) => simCombatBridge.resolveSkill(state, attacker, glove, now),
  tickStatuses: (state, dt) => simCombatBridge.tickStatuses(state, dt),
  applyAwaken: (attacker, glove) => simCombatBridge.applyAwaken(attacker, glove),
};

/**
 * 把 combat 装进 sim 的依赖表，返回是否真的注入了 combat。
 * sim 已经静态接好真实 data / combat 时什么都不做——重复注入只会绕开 sim 的换算层，
 * 并把 `usingRealData` / `usingRealCombat` 翻成 false。
 */
export function installIntoSim(force = false) {
  try {
    const deps = getDeps();
    if ((force || deps.usingRealData !== true) && Array.isArray(data.GLOVES) && data.GLOVES.length) {
      installData(data);
    }
    if (!force && deps.usingRealCombat === true) return false;
    installCombat(SIM_ADAPTER);
    return true;
  } catch {
    return false;
  }
}

export const installed = installIntoSim();
