/** 主线任务：条件满足即自动完成并发奖。 */
import { QUESTS } from "../data/quests.js";
import { storageCap, pushLog } from "./state.js";

export function currentQuest(state) {
  return QUESTS[state.questIndex] || null;
}

export function grantReward(state, reward) {
  const cap = storageCap(state);
  for (const res of ["food", "wood", "coal", "iron"]) {
    if (reward[res]) state.resources[res] = Math.min(cap, state.resources[res] + reward[res]);
  }
  if (reward.tokens) state.tokens += reward.tokens;
  if (reward.souls) state.souls += reward.souls;
}

export function checkQuests(state, events) {
  let advanced = false;
  let guard = 0;
  while (guard++ < QUESTS.length) {
    const quest = currentQuest(state);
    if (!quest || !quest.check(state)) break;
    grantReward(state, quest.reward);
    state.questIndex += 1;
    advanced = true;
    pushLog(state, `任务完成：「${quest.name}」！`, "quest");
    events.push({ type: "quest-done", quest });
  }
  return advanced;
}
