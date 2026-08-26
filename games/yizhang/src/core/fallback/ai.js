// 占位 Bot。src/ai/bots.js（Opus-3）缺席时顶上，签名一致：think(view, botId, rng) -> Input。
// 三种性格：brute 硬冲、fox 绕边、bully 挑软柿子/绕背。都不会自动瞄准，只会朝目标方向转。

const memory = new Map();

const ZERO = {
  moveX: 0,
  moveZ: 0,
  yaw: 0,
  slap: false,
  skill: false,
  switchGlove: false,
  dash: false,
  jump: false,
};

function mem(botId) {
  let m = memory.get(botId);
  if (!m) {
    m = { orbit: 1, nextJitter: 0, jx: 0, jz: 0, lastSlap: -99, lastSwitch: -99 };
    memory.set(botId, m);
  }
  return m;
}

export function resetBots() {
  memory.clear();
}

function pickTarget(self, others, persona) {
  let best = null;
  let bestScore = -Infinity;
  for (const o of others) {
    if (!o.alive || o.id === self.id) continue;
    const d = Math.hypot(o.x - self.x, o.z - self.z);
    let score = -d;
    if (persona === "bully") {
      score += o.stagger * 22;
      score += (o.invulnT > 0 ? -30 : 0);
      const rEdge = Math.hypot(o.x, o.z);
      score += rEdge * 0.8;
    }
    if (persona === "fox") score += Math.hypot(o.x, o.z) * 0.4;
    if (score > bestScore) {
      bestScore = score;
      best = o;
    }
  }
  return best;
}

export function think(view, botId, rng) {
  const random = typeof rng === "function" ? rng : Math.random;
  const players = Array.isArray(view?.players) ? view.players : [];
  const self = players.find((p) => p.id === botId);
  if (!self || !self.alive) return { ...ZERO };

  const m = mem(botId);
  const radius = view.arena?.radius ?? 20;
  const core = view.arena?.coreRadius ?? 6;
  const persona = self.persona || "brute";
  const target = pickTarget(self, players, persona);
  const out = { ...ZERO, yaw: self.yaw };

  if (view.t > m.nextJitter) {
    m.nextJitter = view.t + 0.35 + random() * 0.7;
    m.jx = (random() - 0.5) * 0.5;
    m.jz = (random() - 0.5) * 0.5;
    if (random() < 0.25) m.orbit *= -1;
  }

  let dirX = 0;
  let dirZ = 0;

  if (target) {
    const dx = target.x - self.x;
    const dz = target.z - self.z;
    const dist = Math.hypot(dx, dz) || 1;
    out.yaw = Math.atan2(dz, dx);

    const nx = dx / dist;
    const nz = dz / dist;
    const desired = persona === "fox" ? 4.4 : 2.0;

    if (dist > desired) {
      dirX = nx;
      dirZ = nz;
    } else if (dist < desired * 0.6) {
      dirX = -nx * 0.6;
      dirZ = -nz * 0.6;
    }
    if (persona !== "brute") {
      dirX += -nz * m.orbit * (persona === "fox" ? 0.9 : 0.5);
      dirZ += nx * m.orbit * (persona === "fox" ? 0.9 : 0.5);
    }

    const glove = self.gloveId;
    const inRange = dist < (persona === "brute" ? 2.9 : 2.5);
    if (inRange && self.slapCd <= 0 && view.t - m.lastSlap > 0.12) {
      out.slap = true;
      m.lastSlap = view.t;
    }
    if (self.skillCd <= 0 && dist < 7 && random() < 0.05) out.skill = true;
    if (self.dashCd <= 0 && dist > 5.5 && dist < 12 && random() < 0.06) out.dash = true;
    if (persona === "brute" && dist > 8 && self.dashCd <= 0 && random() < 0.12) out.dash = true;
    if (glove && self.mainId !== self.offhandId && self.skillCd > 2 && view.t - m.lastSwitch > 6) {
      if (random() < 0.01) {
        out.switchGlove = true;
        m.lastSwitch = view.t;
      }
    }
    if (!self.grounded && random() < 0.02) out.jump = true;
  } else {
    dirX = -self.x;
    dirZ = -self.z;
  }

  dirX += m.jx;
  dirZ += m.jz;

  // 自保：靠近边缘或脚下没台就往中心拉。
  const r = Math.hypot(self.x, self.z);
  if (r > radius - 3.2) {
    const pullX = -self.x / (r || 1);
    const pullZ = -self.z / (r || 1);
    const urgency = Math.min(2.4, (r - (radius - 3.2)) / 1.4);
    dirX += pullX * urgency;
    dirZ += pullZ * urgency;
  }
  if (!self.grounded && self.y < -0.6 && r > core) {
    dirX += (-self.x / (r || 1)) * 2;
    dirZ += (-self.z / (r || 1)) * 2;
    if (self.dashCd <= 0) out.dash = true;
  }

  const len = Math.hypot(dirX, dirZ);
  if (len > 1e-4) {
    out.moveX = dirX / Math.max(1, len);
    out.moveZ = dirZ / Math.max(1, len);
  }
  return out;
}
