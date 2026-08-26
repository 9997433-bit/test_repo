// 解锁判定。data 层（Fable-3）如果导出了 isGloveUnlocked 就以它为准，
// 否则用这里的等价实现兜底：默认掌永远开，挑战掌看存档的 unlocked 名单。
//
// 存档 key 是 `yizhang-save-v1`（src/core/storage.js），进度只记在本地。

/** 单局进度累积器。字段就是挑战表里 `event` 的可判定投影。 */
export function createMatchProgress() {
  return {
    slapHits: 0,
    kills: 0,
    deaths: 0,
    awakens: 0,
    dashes: 0,
    behindKills: 0,
    rimKills: 0,
    dashKills: 0,
    revengeKills: 0,
    chainKills: 0,
    won: false,
  };
}

function unlockSpecOf(glove, dataModule) {
  const raw = glove && glove.unlock;
  if (raw && typeof raw === "object") return raw; // 兜底掌表：{ type, text, req }
  if (typeof raw !== "string" || raw === "default") return null;
  const table = dataModule && dataModule.UNLOCK_BY_ID;
  return (table && table[raw]) || null;
}

/** 挑战文案：给主菜单的 `.yz-lock-note` 用。 */
export function unlockTextOf(glove, dataModule) {
  if (!glove) return "";
  if (glove.unlock === "default") return "初始携带";
  const byGlove = dataModule && dataModule.UNLOCK_BY_GLOVE && dataModule.UNLOCK_BY_GLOVE[glove.id];
  const spec = byGlove || unlockSpecOf(glove, dataModule);
  if (!spec) return "局内挑战";
  return spec.desc || spec.text || spec.name || "局内挑战";
}

/** 默认携带（不需要任何挑战）。 */
export function isDefaultGlove(glove) {
  if (!glove) return false;
  if (glove.unlock === "default") return true;
  if (glove.unlock && typeof glove.unlock === "object") {
    if (glove.unlock.type === "default") return true;
    const req = glove.unlock.req;
    if (req && Object.keys(req).length === 0) return true;
  }
  return false;
}

/**
 * 造一个 isGloveUnlocked(gloveId, save) —— 优先复用 data 的同名导出。
 * @param {object|null} dataModule
 * @param {{ gloves: Array }} ctx
 */
export function createUnlockChecker(dataModule, ctx = {}) {
  if (dataModule && typeof dataModule.isGloveUnlocked === "function") {
    const fromData = dataModule.isGloveUnlocked;
    const checker = (gloveId, save) => {
      try {
        return !!fromData(gloveId, save || {});
      } catch (err) {
        console.warn("[yizhang] data.isGloveUnlocked 抛错，退回本地判定", err);
        return localCheck(gloveId, save);
      }
    };
    checker.source = "data";
    return checker;
  }

  const checker = (gloveId, save) => localCheck(gloveId, save);
  checker.source = "core";
  return checker;

  function localCheck(gloveId, save) {
    const gloves = ctx.gloves || [];
    const glove = gloves.find((g) => g.id === gloveId);
    if (isDefaultGlove(glove)) return true;
    const list = (save && save.unlocked) || [];
    return list.includes(gloveId);
  }
}

/** 单局进度是否满足某只掌的挑战。 */
export function progressMeets(glove, progress, dataModule) {
  if (!glove || !progress) return false;
  const spec = unlockSpecOf(glove, dataModule);
  if (!spec) return false;

  // 兜底掌表的 { req: {...} } 写法
  if (spec.req) {
    const req = spec.req;
    if (req.kills != null && progress.kills < req.kills) return false;
    if (req.dashes != null && progress.dashes < req.dashes) return false;
    if (req.behindKills != null && progress.behindKills < req.behindKills) return false;
    if (req.noDeaths && progress.deaths > 0) return false;
    return true;
  }

  // data/unlocks.js 的 { event, count, params } 写法
  const count = Number.isFinite(spec.count) ? spec.count : 1;
  const params = spec.params || {};
  switch (spec.event) {
    case "slap_hit":
      return progress.slapHits >= count;
    case "awaken":
      return progress.awakens >= count;
    case "match_win":
      if (!progress.won) return false;
      if (params.maxDeaths != null && progress.deaths > params.maxDeaths) return false;
      return true;
    case "kill":
      if (params.afterDashSeconds != null) return progress.dashKills >= count;
      if (params.withinSecondsOfTakenHit != null) return progress.revengeKills >= count;
      if (params.chainWindowSeconds != null) return progress.chainKills >= count;
      if (params.victimRimDistanceMax != null) return progress.rimKills >= count;
      return progress.kills >= count;
    default:
      return false;
  }
}

/** 本局刚刚达成的解锁（已解锁的不重复报）。 */
export function newlyUnlocked(gloves, progress, save, dataModule) {
  const out = [];
  const owned = new Set((save && save.unlocked) || []);
  for (const g of gloves) {
    if (owned.has(g.id) || isDefaultGlove(g)) continue;
    if (progressMeets(g, progress, dataModule)) out.push(g);
  }
  return out;
}
