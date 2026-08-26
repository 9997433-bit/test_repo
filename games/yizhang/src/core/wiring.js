// 接线真值判定。刻意不依赖 Vite（没有 import.meta.glob），
// 这样 scripts/ 下的探针与基准脚本可以在纯 Node 里直接 import。

/**
 * sim 的 deps 层**静态** import 真实 data/combat（ADR-19），
 * `getDeps().usingRealData / usingRealCombat` 只回答「当前有没有装替身」——
 * 装配层把真实模块装进去，这两个标志反而翻假，照着报就是假警报。
 *
 * 判定规则：静态 deps 本身算真；调用方亲手装进去的真实模块也算真；
 * 再核一遍生效对象确实有掌表和 resolveSlap，两条都不成立才是降级。
 *
 * @param {object} sim     模拟模块（需要 getDeps 才能读静态接线）
 * @param {{ data?: boolean, combat?: boolean }} wired  wireSimDeps 的返回值
 * @returns {{ usingRealData: boolean, usingRealCombat: boolean, source: string }}
 */
export function wiringStatus(sim, wired = {}) {
  const deps = typeof sim?.getDeps === "function" ? sim.getDeps() : null;
  if (!deps) {
    return {
      usingRealData: !!wired.data,
      usingRealCombat: !!wired.combat,
      source: "install",
    };
  }
  const hasCombatFns = typeof deps.combat?.resolveSlap === "function";
  const hasGloves = Array.isArray(deps.GLOVES) && deps.GLOVES.length > 0;
  return {
    usingRealData: (deps.usingRealData === true || !!wired.data) && hasGloves,
    usingRealCombat: (deps.usingRealCombat === true || !!wired.combat) && hasCombatFns,
    source: wired.data || wired.combat ? "install+static" : "static",
  };
}
