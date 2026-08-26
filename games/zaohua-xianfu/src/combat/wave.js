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

/**
 * 潮胜入账；潮败不在这里收税。败仗按 AD-12 定案只没收「未收取产出」，
 * 由 core/store.js#waveLossTax 结算，库存分毫不动，故此处败战返回空账。
 */
export function waveReward(wave, win) {
  if (!win) return {};
  return {
    stone: 14 + wave * 3,
    qi: 20 + wave * 2,
    jade: wave % 5 === 0 ? 3 : 0,
    herb: 6 + wave,
  };
}
