import { artifactById } from "../data/artifacts.js";

const LOW_HP_TRIGGER = /^lowhp(\d+)$/;

function lowHpThreshold(trigger) {
  const matched = LOW_HP_TRIGGER.exec(trigger ?? "");
  return matched ? Number(matched[1]) / 100 : null;
}

export function collectPassives(equippedIds) {
  const out = { crit: 0.08, ultHaste: 0, basicMul: 1, skillMul: 1 };
  for (const id of equippedIds ?? []) {
    const a = artifactById(id);
    if (!a || a.trigger !== "passive") continue;
    if (a.effect.crit) out.crit += a.effect.crit;
    if (a.effect.ultHaste) out.ultHaste += a.effect.ultHaste;
    if (a.effect.basicMul) out.basicMul *= a.effect.basicMul;
    if (a.effect.skillMul) out.skillMul *= a.effect.skillMul;
  }
  return out;
}

/**
 * 把佩戴的法器解析成一份战斗只读配置：数值全部来自 data/artifacts.js 的 effect，
 * 战斗循环不再硬编码七星灯 0.65、镇岳钟 0.12 之类的常数。
 */
export function artifactLoadout(equippedIds) {
  const ids = (equippedIds ?? []).filter((id) => artifactById(id));
  const out = {
    ids,
    passives: collectPassives(ids),
    startShield: 0,
    guard: null,
    rescue: null,
    revive: null,
    gamble: null,
    burn: null,
    execute: null,
    skillMul: 1,
    stun: null,
  };
  for (const id of ids) {
    const art = artifactById(id);
    const e = art.effect ?? {};
    const threshold = lowHpThreshold(art.trigger);
    if (e.shieldPct) out.startShield += e.shieldPct;
    if (e.damageTakenMul != null && threshold != null) {
      if (!out.guard || e.damageTakenMul < out.guard.mul) out.guard = { threshold, mul: e.damageTakenMul };
    }
    if (e.healPct != null && threshold != null) {
      if (!out.rescue || threshold > out.rescue.threshold) out.rescue = { threshold, pct: e.healPct };
    }
    if (e.reviveHp != null) out.revive = { hpPct: e.reviveHp };
    if (Array.isArray(e.gamble)) out.gamble = { chance: e.gamble[0], high: e.gamble[1], low: e.gamble[2] };
    if (e.burnAtk != null) out.burn = { atkPct: e.burnAtk, after: e.after ?? 0 };
    if (e.execute != null) out.execute = { threshold: e.execute, bossOnly: Boolean(e.bossOnly) };
    if (e.skillMul != null && art.trigger === "skill") out.skillMul *= e.skillMul;
    if (e.stun != null) out.stun = { chance: e.chance ?? 1, seconds: e.stun };
  }
  return out;
}

export function applyTriggers(ctx, event) {
  const notes = [];
  for (const id of ctx.equipped ?? []) {
    const a = artifactById(id);
    if (!a || a.trigger !== event.type) continue;
    notes.push({ id, name: a.name, effect: a.effect, event });
  }
  return notes;
}

export function hasArtifact(equipped, id) {
  return (equipped ?? []).includes(id);
}
