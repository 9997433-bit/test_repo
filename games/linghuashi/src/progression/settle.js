import { STAGES } from "../data/stages.js";
import { unlockMo } from "../classes/unlock.js";

/** 结算既接受关卡对象，也接受关卡 id；关卡表里查不到时退回入参自带的 reward。 */
export function resolveStage(stage) {
  if (!stage) return null;
  const id = typeof stage === "string" ? stage : stage.id;
  const known = STAGES.find((s) => s.id === id);
  if (known) return known;
  return typeof stage === "object" && stage.reward ? stage : null;
}

/** 本场应发的奖励；败北与未知关卡都是 null（UI 据此决定是否画奖励卡）。 */
export function battleReward(stage, result) {
  const s = resolveStage(stage);
  if (result !== "win" || !s?.reward) return null;
  return { xp: s.reward.xp || 0, qiPills: s.reward.qiPills || 0 };
}

/**
 * 纯函数：开战前登记一场战斗，给它一个递增的 battleId 并清掉上一场的结算痕迹。
 * 有了 battleId，settleBattle 才能做到「同一场只发一次奖励、换一场又能照发」。
 * 不读 Date.now / Math.random，序号只由存档自身推进，便于单测。
 */
export function beginBattle(save, stage, battleId) {
  if (!save) return save;
  const s = resolveStage(stage);
  const seq = (save.battleSeq || 0) + 1;
  return {
    ...save,
    stageId: s?.id ?? save.stageId ?? null,
    battleSeq: seq,
    battleId: battleId ?? `${s?.id ?? "stage"}#${seq}`,
    settledBattleId: null,
    lastResult: null,
    lastStage: null,
    lastReward: null,
  };
}

/**
 * 纯函数：一场战斗的全部结算。
 *
 * - 胜：xp / 灵气丹按关卡 reward 各加一次，并记入 clearedStages；败：只记会话字段，不加不扣。
 * - 恰好一次：同一 battleId（显式传入，或由 beginBattle 写进存档）重复结算时原样返回，
 *   胜利后停在结算屏、战斗时钟多跳几拍都不会二次发奖；换一场（新 battleId）照常发。
 *   两者都缺省时不做去重，退化为一次性的纯变换，由调用方保证只调一次。
 * - 顺带走一次 unlockMo：墨客解锁只此一条规则，不在结算里另起判定。
 */
export function settleBattle(save, { result, stage, battleId } = {}) {
  if (!save) return save;
  if (result !== "win" && result !== "lose") return save;

  const token = battleId ?? save.battleId ?? null;
  if (token && save.settledBattleId === token) return save;

  const s = resolveStage(stage ?? save.stageId);
  const reward = battleReward(s, result);
  const next = {
    ...save,
    lastResult: result,
    lastStage: s?.id ?? save.lastStage ?? null,
    lastReward: reward,
  };
  if (token) next.settledBattleId = token;
  if (reward) {
    next.xp = (save.xp || 0) + reward.xp;
    next.qiPills = (save.qiPills || 0) + reward.qiPills;
    next.clearedStages = [...new Set([...(save.clearedStages || []), s.id])];
  }

  const unlocked = unlockMo(next);
  return unlocked === next ? next : { ...unlocked, inkJustUnlocked: true };
}
