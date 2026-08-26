import { FISH } from "../data/fish.js";
import { mulberry32, pickWeighted } from "../core/rng.js";

export function castLine(state) {
  const hasChair = state.buildings.some((b) => b.type === "fish_chair");
  if (!hasChair) return { ok: false, reason: "先搭钓鱼椅再摸鱼，老大。" };
  const sea = state.buildings.some((b) => b.type === "dive_dock") ? "deep" : "near";
  const pool = FISH.filter((f) => f.sea === "near" || f.sea === sea || (sea === "deep" && f.sea === "far"));
  const rng = mulberry32((state.meta.seed + state.meta.tick * 17) >>> 0);
  const fish = pickWeighted(
    rng,
    pool.map((f) => [f, f.weight]),
  );
  return {
    ok: true,
    id: `cast-${state.meta.tick}`,
    fish,
    window: fish.window,
    seed: state.meta.tick,
  };
}

export function resolveHook(state, cast, timing01) {
  if (!cast?.ok) return state;
  const [a, b] = cast.window;
  const hit = timing01 >= a && timing01 <= b;
  if (!hit) {
    return {
      ...state,
      explore: { ...state.explore, fishing: { lastCatch: { miss: true, name: cast.fish.name } } },
      log: [`${cast.fish.name}跑了。手生，再来。`, ...state.log].slice(0, 24),
    };
  }
  const resources = { ...state.resources };
  for (const [k, v] of Object.entries(cast.fish.value)) resources[k] = (resources[k] || 0) + v;
  return {
    ...state,
    resources,
    player: { ...state.player, exp: state.player.exp + 6 },
    explore: { ...state.explore, fishing: { lastCatch: { miss: false, name: cast.fish.name } } },
    log: [`钓上 ${cast.fish.name}！晚饭有着落了。`, ...state.log].slice(0, 24),
  };
}
