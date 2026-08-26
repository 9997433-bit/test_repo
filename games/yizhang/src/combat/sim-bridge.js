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

// ---------------------------------------------------------------- 过渡期保险丝
//
// 现状：`src/core/modules.js` 的 `wireSimDeps`、`scripts/harness.mjs`、
// `src/render/smoke.js`、`tests/skills.test.js` 四处宿主都把 combat 的**模块命名空间**
// 直接 `sim.installCombat(...)`，绕开了上面说的换算层。结果是全场扇击 / 拉扯 / 反击
// 一律反 180°，而且没有任何报错——真机上表现为「对着人扇却打不到」。
//
// 正解是宿主改注入 `SIM_ADAPTER`（或按 ADR-19 干脆别注入，sim 已经静态接好）。
// 在那之前，combat 自己兜住：只要发现 sim 手里拿的就是本模块的裸导出，
// 就在入口把 sim 约定的 yaw 转成 combat 约定，出口还原。
//
// 判据是「sim 到底接了谁」而不是猜状态：接的是 sim 自己的 combat-bridge 或 SIM_ADAPTER
// 时，yaw 已经被那一层转过，这里必须**不能**再转。等四处宿主都改完，
// `needsSimYawShim` 会恒为 false，整段可以删掉。

const YAW_OFFSET = Math.PI;
const TAU = Math.PI * 2;

function wrapAngle(a) {
  let x = (a + Math.PI) % TAU;
  if (x < 0) x += TAU;
  return x - Math.PI;
}

/** 这个 state 是 `src/sim` 的对局吗（testkit 的最小 state 没有 tick / config）。 */
function isSimState(state) {
  return !!(
    state &&
    Array.isArray(state.players) &&
    state.arena &&
    Number.isFinite(state.tick) &&
    state.config &&
    Number.isFinite(state.config.arenaRadius)
  );
}

/** sim 手里拿的就是 combat 的裸导出吗（说明没人替它做朝向换算）。 */
export function needsSimYawShim(state, bareResolveSlap) {
  if (!isSimState(state)) return false;
  try {
    const wired = getDeps().combat;
    return !!wired && wired.resolveSlap === bareResolveSlap;
  } catch {
    return false;
  }
}

/** 在 combat 的朝向语境里跑一段逻辑：进去 +π，出来还原。 */
export function inSimYawFrame(state, fn) {
  const players = state.players;
  const before = players.map((p) => p.yaw);
  for (const p of players) p.yaw += YAW_OFFSET;
  try {
    return fn();
  } finally {
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      const shifted = before[i] + YAW_OFFSET;
      // combat 没动过的原样写回，避免每帧 wrap 累积浮点漂移
      p.yaw = p.yaw === shifted ? before[i] : wrapAngle(p.yaw - YAW_OFFSET);
    }
  }
}

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
