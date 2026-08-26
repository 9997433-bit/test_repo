/** Deterministic RNG (mulberry32). State lives in game state so saves stay reproducible. */

export function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Advance the rng embedded in game state, returning a float in [0,1). */
export function nextRandom(state) {
  state.rngState = (state.rngState + 0x6d2b79f5) | 0;
  let t = state.rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Wrap game state as a zero-arg rng function. */
export function stateRng(state) {
  return () => nextRandom(state);
}

/** Pick a random element. */
export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

/** Weighted pick from [{w, v}] entries. */
export function pickWeighted(rng, entries) {
  let total = 0;
  for (const e of entries) total += e.w;
  let r = rng() * total;
  for (const e of entries) {
    r -= e.w;
    if (r <= 0) return e.v;
  }
  return entries[entries.length - 1].v;
}
