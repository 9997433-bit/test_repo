import { artifactById } from "../data/artifacts.js";

const LOW_HP_TRIGGER = /^lowhp(\d+)$/;

function lowHpThreshold(trigger) {
  const matched = LOW_HP_TRIGGER.exec(trigger ?? "");
  return matched ? Number(matched[1]) / 100 : null;
}

/**
 * 一条已解析的法器效果。既是战斗读取的数值，也是战报的署名：
 * `kind` 是战斗侧的效果名，`id`/`name`/`trigger` 指回 data/artifacts.js 的原条目。
 */
function resolved(art, kind, values) {
  return { id: art.id, name: art.name, trigger: art.trigger, effect: art.effect, kind, ...values };
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
 *
 * 每个效果槽都是 `resolved()` 注记，`sources` 汇总全部生效项，
 * `applyTriggers` 只按 kind 过滤这一张表，触发条件不会在两处各写一份。
 * 复活次数按 `effect.reviveCharges` 取，缺省 1：与万魂灯「阵亡时复活一次」
 * 的文案同口径——整场一次，而不是每个我方单位各一次。
 */
export function artifactLoadout(equippedIds) {
  const ids = (equippedIds ?? []).filter((id) => artifactById(id));
  const out = {
    ids,
    passives: collectPassives(ids),
    shield: { pct: 0, sources: [] },
    guard: null,
    rescue: null,
    revive: null,
    gamble: null,
    burn: null,
    execute: null,
    skillMul: 1,
    skillSources: [],
    passiveSources: [],
    stun: null,
    sources: [],
  };
  for (const id of ids) {
    const art = artifactById(id);
    const e = art.effect ?? {};
    const threshold = lowHpThreshold(art.trigger);
    if (art.trigger === "passive") out.passiveSources.push(resolved(art, "passive", {}));
    if (e.shieldPct) {
      out.shield.pct += e.shieldPct;
      out.shield.sources.push(resolved(art, "shield", { pct: e.shieldPct }));
    }
    if (e.damageTakenMul != null && threshold != null) {
      if (!out.guard || e.damageTakenMul < out.guard.mul) {
        out.guard = resolved(art, "guard", { threshold, mul: e.damageTakenMul });
      }
    }
    if (e.healPct != null && threshold != null) {
      if (!out.rescue || threshold > out.rescue.threshold) {
        out.rescue = resolved(art, "rescue", { threshold, pct: e.healPct });
      }
    }
    if (e.reviveHp != null) out.revive = resolved(art, "revive", { hpPct: e.reviveHp, charges: e.reviveCharges ?? 1 });
    if (Array.isArray(e.gamble)) {
      out.gamble = resolved(art, "gamble", { chance: e.gamble[0], high: e.gamble[1], low: e.gamble[2] });
    }
    if (e.burnAtk != null) out.burn = resolved(art, "burn", { atkPct: e.burnAtk, after: e.after ?? 0 });
    if (e.execute != null) out.execute = resolved(art, "execute", { threshold: e.execute, bossOnly: Boolean(e.bossOnly) });
    if (e.skillMul != null && art.trigger === "skill") {
      out.skillMul *= e.skillMul;
      out.skillSources.push(resolved(art, "skillMul", { mul: e.skillMul }));
    }
    if (e.stun != null) out.stun = resolved(art, "stun", { chance: e.chance ?? 1, seconds: e.stun });
  }
  out.sources = [
    ...out.passiveSources,
    ...out.shield.sources,
    ...out.skillSources,
    out.guard,
    out.rescue,
    out.revive,
    out.gamble,
    out.burn,
    out.execute,
    out.stun,
  ].filter(Boolean);
  return out;
}

/**
 * 战斗事件 → 生效法器注记。`event.kind` 就是 loadout 的效果名
 * （passive / shield / guard / rescue / revive / gamble / burn / execute / skillMul / stun），
 * 返回的是「这一刻真正在起作用的那几件」，同类互斥的法器不会重复上报。
 * `ctx` 给 loadout 优先，只有 equipped 时现解析一份。
 */
export function applyTriggers(ctx, event) {
  const loadout = ctx?.loadout ?? artifactLoadout(ctx?.equipped);
  const kind = event?.kind;
  const notes = [];
  for (const source of loadout.sources) {
    if (source.kind !== kind) continue;
    notes.push({ ...source, event });
  }
  return notes;
}

export function hasArtifact(equipped, id) {
  return (equipped ?? []).includes(id);
}
