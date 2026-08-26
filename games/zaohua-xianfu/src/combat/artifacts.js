import { artifactById } from "../data/artifacts.js";

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
