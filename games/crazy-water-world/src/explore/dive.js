export function startDive(state, zone = "wreck") {
  if (!state.buildings.some((b) => b.type === "dive_dock")) {
    return { ok: false, reason: "先造潜水船坞。" };
  }
  return {
    ok: true,
    zone,
    oxygen: 100,
    x: 0,
    depth: 0,
    loot: [],
    alive: true,
    done: false,
    sharks: [
      { x: 40, y: 20, vx: -0.6 },
      { x: 80, y: 50, vx: 0.45 },
    ],
    nodes: [
      { id: "n1", x: 30, y: 35, res: "scrap", n: 4 },
      { id: "n2", x: 62, y: 55, res: "blueprint", n: 1 },
      { id: "n3", x: 78, y: 22, res: "stone", n: 3 },
    ],
  };
}

export function diveStep(session, input, dt) {
  if (!session?.ok || session.done) return session;
  const next = structuredClone(session);
  const spd = 18;
  next.x += (input.x || 0) * spd * dt;
  next.depth += (input.y || 0) * spd * dt;
  next.x = Math.max(0, Math.min(100, next.x));
  next.depth = Math.max(0, Math.min(90, next.depth));
  next.oxygen -= dt * (6 + next.depth * 0.04);
  for (const s of next.sharks) {
    s.x += s.vx * dt * 8;
    if (s.x < 0 || s.x > 100) s.vx *= -1;
    const dx = s.x - next.x;
    const dy = s.y - next.depth;
    if (Math.hypot(dx, dy) < 6) {
      next.alive = false;
      next.done = true;
    }
  }
  next.nodes = next.nodes.filter((n) => {
    if (Math.hypot(n.x - next.x, n.y - next.depth) < 5) {
      next.loot.push(n);
      return false;
    }
    return true;
  });
  if (next.oxygen <= 0) {
    next.done = true;
    next.alive = next.alive && next.depth < 8;
  }
  if (input.surface && next.depth < 8) next.done = true;
  return next;
}

export function finishDive(state, session) {
  if (!session) return state;
  const resources = { ...state.resources };
  if (session.alive) {
    for (const n of session.loot) resources[n.res] = (resources[n.res] || 0) + n.n;
  }
  return {
    ...state,
    resources,
    player: {
      ...state.player,
      hp: session.alive ? state.player.hp : Math.max(8, state.player.hp - 18),
      exp: state.player.exp + session.loot.length * 10,
    },
    explore: { ...state.explore, dive: null },
    log: [
      session.alive ? `上浮成功，捞到 ${session.loot.length} 件深海货。` : "差点喂鲨。老大，氧气管不是吸管。",
      ...state.log,
    ].slice(0, 24),
  };
}
