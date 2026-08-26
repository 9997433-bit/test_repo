const KINDS = [
  { res: "wood", w: 36, n: [1, 3] },
  { res: "plastic", w: 22, n: [1, 2] },
  { res: "scrap", w: 12, n: [1, 2] },
  { res: "rope", w: 10, n: [1, 1] },
  { res: "stone", w: 8, n: [1, 2] },
  { res: "blueprint", w: 2, n: [1, 1], rare: true },
];

function pick(rng) {
  const total = KINDS.reduce((s, k) => s + k.w, 0);
  let r = rng() * total;
  for (const k of KINDS) {
    r -= k.w;
    if (r <= 0) return k;
  }
  return KINDS[0];
}

export function spawnFlotsam(state, rng) {
  const cap = 10 + state.buildings.filter((b) => b.type === "salvage").length * 2;
  let list = state.explore.salvage.flotsam.filter((f) => f.ttl > 0).map((f) => ({ ...f, ttl: f.ttl - 0.1, x: f.x + f.vx }));
  const weatherMul = state.world.weather === "storm" || state.world.weather === "tsunami" ? 0.35 : 1;
  if (list.length < cap && rng() < 0.08 * weatherMul) {
    const k = pick(rng);
    list.push({
      id: `f-${state.meta.tick}-${list.length}`,
      res: k.res,
      n: k.n[0] + Math.floor(rng() * (k.n[1] - k.n[0] + 1)),
      rare: !!k.rare,
      x: rng() * 2 - 1,
      y: rng() * 0.6 - 0.1,
      vx: (rng() - 0.5) * 0.004,
      ttl: 18,
    });
  }
  return list.slice(-cap);
}

export function collectFlotsam(state, id) {
  const item = state.explore.salvage.flotsam.find((f) => f.id === id);
  if (!item) return state;
  const resources = { ...state.resources, [item.res]: (state.resources[item.res] || 0) + item.n };
  return {
    ...state,
    resources,
    player: { ...state.player, exp: state.player.exp + (item.rare ? 8 : 2) },
    explore: {
      ...state.explore,
      salvage: { flotsam: state.explore.salvage.flotsam.filter((f) => f.id !== id) },
    },
    log: [`捞到 ${item.n} ${item.res}${item.rare ? "（稀有闪光！）" : ""}`, ...state.log].slice(0, 24),
  };
}
