// 胜负判定。`step` 与 `isMatchOver` 共用同一份判据，
// 保证「直接改 kills 后立刻问」和「跑到 step 里锁定」两条路给出同样的答案。

export function leaderOf(state) {
  let best = null;
  for (const p of state.players) {
    if (!best) {
      best = p;
      continue;
    }
    if (p.kills > best.kills) best = p;
    else if (p.kills === best.kills && p.deaths < best.deaths) best = p;
  }
  return best;
}

/**
 * 现算一次胜负，不写 state。
 * @returns {{winnerId: string|null, reason: "kills"|"time"}|null}
 */
export function decideMatch(state) {
  for (const p of state.players) {
    if (p.kills >= state.config.killsToWin) {
      return { winnerId: p.id, reason: "kills" };
    }
  }

  // 计时从 match.startTime 起算：从安全区传送进岛时会重置，挑掌不吃对局时长
  const elapsed = state.time - (state.match.startTime || 0);
  const timeUp = elapsed >= state.config.matchSeconds || state.match.secondsLeft <= 0;
  if (timeUp) {
    const best = leaderOf(state);
    return { winnerId: best ? best.id : null, reason: "time" };
  }

  return null;
}
