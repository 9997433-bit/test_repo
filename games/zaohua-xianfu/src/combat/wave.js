import { waveEnemy } from "../data/enemies.js";
import { simulate } from "./battle.js";

export function challengeWave(state, now = Date.now()) {
  const wave = state.wave?.wave ?? 1;
  const pack = waveEnemy(wave);
  const result = simulate({
    seed: (now ^ (wave * 7919)) >>> 0,
    heroIds: state.party,
    foes: pack.foes,
    state,
    equipped: state.equipped,
  });
  return { ...result, wave };
}

export function waveReward(wave, win, resources) {
  if (!win) {
    return {
      loseTax: {
        herb: (resources.herb ?? 0) * 0.3,
        wood: (resources.wood ?? 0) * 0.3,
        ore: (resources.ore ?? 0) * 0.3,
      },
    };
  }
  return {
    stone: 14 + wave * 3,
    qi: 20 + wave * 2,
    jade: wave % 5 === 0 ? 3 : 0,
    herb: 6 + wave,
  };
}
