import { TALISMANS } from "../data/talismans.js";
import { classById, COUNTER } from "../data/classes.js";
import { realmById } from "../data/realms.js";
import { reaction } from "./elements.js";
import { defaultMods } from "./mods.js";

const COMBO_WINDOW_MS = 3000;
const BASE_QI_REGEN_PER_SEC = 8;
const SHIELD_DECAY_PER_SEC = 3;

export function createActor(spec, realmId) {
  const realm = realmById(realmId || spec.realmId || "qi_refining");
  const hp = spec.hp ?? realm.hp;
  return {
    id: spec.id,
    name: spec.name,
    classId: spec.classId,
    element: spec.element,
    maxHp: hp,
    hp,
    maxQi: spec.qi ?? realm.qi,
    qi: spec.qi ?? realm.qi,
    atk: spec.atk ?? realm.atk,
    atkMs: spec.atkMs ?? 2000,
    traits: spec.traits ?? [],
    shield: 0,
    controlMs: 0,
    shred: 0,
  };
}

export function createBattle({ player, enemy, seed = 1, mods = defaultMods() }) {
  const state = {
    player: createActor(player),
    enemy: createActor(enemy),
    log: [],
    finished: null,
    t: 0,
    rng: mulberry(seed),
    mods,
    enemyGauge: 0,
    lastCastAt: -Infinity,
    combo: 0,
    stats: { casts: 0, crits: 0, dodges: 0, damageDealt: 0, healingDone: 0, shieldGained: 0, maxCombo: 0, durationMs: 0 },
  };

  if (mods.openingShield > 0) {
    state.player.shield += mods.openingShield;
    push(`灵兽庇护 · 开局护盾 ${Math.round(mods.openingShield)}`, { kind: "buff" });
  }
  if (state.enemy.traits.includes("armored")) {
    state.enemy.shield = Math.round(state.enemy.maxHp * 0.2);
    push(`${state.enemy.name} 覆有甲壳（折线破甲可双倍削盾）`, { kind: "warn" });
  }

  function push(msg, extra = {}) {
    state.log.unshift({ t: state.t, msg, ...extra });
    state.log = state.log.slice(0, 30);
  }

  function checkEnd() {
    if (state.player.hp <= 0) state.finished = "lose";
    else if (state.enemy.hp <= 0) state.finished = "win";
    if (state.finished) state.stats.durationMs = state.t;
    return state.finished;
  }

  // 破甲类打击对护盾造成双倍削减
  function deal(target, amount, { shieldBreak = false } = {}) {
    let left = amount;
    if (target.shield > 0 && left > 0) {
      const power = shieldBreak ? 2 : 1;
      const absorb = Math.min(target.shield, left * power);
      target.shield -= absorb;
      left = Math.max(0, left - absorb / power);
    }
    target.hp = Math.max(0, target.hp - left);
    return amount;
  }

  function enemyAtkPeriod() {
    let ms = state.enemy.atkMs || 2000;
    if (state.enemy.traits.includes("swift")) ms *= 0.75;
    return ms;
  }

  function enemyStrike() {
    if (state.rng() < state.mods.dodgeChance) {
      state.stats.dodges += 1;
      push(`${state.enemy.name} 出手落空 · 身法闪避`, { kind: "dodge" });
      return;
    }
    const roll = state.rng();
    let raw = state.enemy.atk * (0.85 + roll * 0.4);
    if (state.enemy.traits.includes("enrage") && state.enemy.hp < state.enemy.maxHp * 0.45) {
      raw *= 1.35;
      push(`${state.enemy.name} 目赤如朱，攻势暴涨！`, { kind: "warn" });
    }
    const hit = deal(state.player, raw);
    push(`${state.enemy.name} 反噬 ${Math.round(hit)}`, { kind: "enemy" });
    checkEnd();
  }

  function cast(stroke, elementHint) {
    if (state.finished) return { events: [], state };
    const events = [];
    const cls = classById(state.player.classId);
    const talisman = TALISMANS[stroke.type] ?? TALISMANS.scribble;
    const cost = talisman.qi;
    if (state.player.qi < cost) {
      push("灵气不足，笔锋散了。", { kind: "warn" });
      return { events, state };
    }
    state.player.qi -= cost;
    state.stats.casts += 1;

    // 连击：三秒内连续成符提升倍率
    if (stroke.type !== "scribble") {
      state.combo = state.t - state.lastCastAt <= COMBO_WINDOW_MS ? state.combo + 1 : 1;
      state.lastCastAt = state.t;
      state.stats.maxCombo = Math.max(state.stats.maxCombo, state.combo);
    }
    const comboMult = 1 + Math.min(0.3, Math.max(0, state.combo - 1) * 0.04);

    const bonus = cls?.bonus?.[stroke.type] ?? 0;
    const prec = Math.max(0.2, stroke.precision ?? 0.4);
    const press = stroke.pressure ?? 0.5;
    let dmg = state.player.atk * (0.65 + prec * 1.15) * (1 + bonus) * (0.85 + press * 0.3);
    dmg *= state.mods.dmgMult * comboMult;
    const react = reaction(elementHint || cls?.element, state.enemy.element);
    dmg *= react.damage;
    if (COUNTER[state.player.classId] === state.enemy.classId) dmg *= 1.18;
    if (COUNTER[state.enemy.classId] === state.player.classId) dmg *= 0.88;
    dmg *= 1 + (state.enemy.shred || 0);

    let crit = false;
    if (state.rng() < state.mods.critChance + (react.crit || 0)) {
      crit = true;
      dmg *= 1.6;
      state.stats.crits += 1;
    }
    const mark = crit ? " · 暴击!" : "";
    let dealt = 0;

    if (stroke.type === "circle") {
      const shield = (18 + prec * 42 * (1 + bonus)) * state.mods.shieldMult;
      state.player.shield += shield;
      state.stats.shieldGained += shield;
      push(`${talisman.name} · 护盾 +${Math.round(shield)}`, { kind: "buff" });
    } else if (stroke.type === "cloud") {
      const heal = (16 + prec * 36 * (1 + bonus)) * state.mods.healMult * (crit ? 1.3 : 1);
      const before = state.player.hp;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + heal);
      state.stats.healingDone += state.player.hp - before;
      push(`${talisman.name} · 回春 ${Math.round(heal)}${crit ? " · 妙笔!" : ""}`, { kind: "heal" });
    } else if (stroke.type === "curve") {
      const bind = (700 + prec * 900 + (react.control || 0)) * state.mods.controlMult;
      state.enemy.controlMs += bind;
      dealt = deal(state.enemy, dmg * 0.55);
      push(`${talisman.name} · 束缚 ${(bind / 1000).toFixed(1)}s 并伤 ${Math.round(dealt)}${mark}`, { kind: "ctrl" });
    } else if (stroke.type === "zigzag") {
      state.enemy.shred = Math.min(0.35, (state.enemy.shred || 0) + 0.08 + prec * 0.08);
      dealt = deal(state.enemy, dmg * 1.15, { shieldBreak: true });
      push(`${talisman.name} · 破甲穿刺 ${Math.round(dealt)}${mark}`, { kind: "hit" });
    } else if (stroke.type === "spiral") {
      dealt = deal(state.enemy, dmg * 1.25);
      push(`${talisman.name} · 阵法轰击 ${Math.round(dealt)}${mark}`, { kind: "aoe" });
    } else {
      dealt = deal(state.enemy, dmg);
      push(`${talisman.name} · ${Math.round(dealt)}${mark}`, { kind: "hit" });
    }
    state.stats.damageDealt += dealt;

    // 镜潭反噬：反弹部分笔伤
    if (dealt > 0 && state.enemy.traits.includes("spiky") && state.enemy.hp > 0) {
      const thorn = dealt * 0.1;
      deal(state.player, thorn);
      push(`${state.enemy.name} 回响反噬 ${Math.round(thorn)}`, { kind: "enemy" });
    }

    if (react.label) push(react.label, { kind: "react" });
    events.push({ type: "cast", talisman, stroke, crit, dealt, combo: state.combo });
    checkEnd();
    return { events, state };
  }

  // 累加器驱动：无论 dt 大小（掉帧、后台标签页恢复），敌方出手次数守恒
  function tick(dtMs) {
    if (state.finished) return state;
    state.t += dtMs;
    const regen = BASE_QI_REGEN_PER_SEC + state.mods.qiRegenPerSec;
    state.player.qi = Math.min(state.player.maxQi, state.player.qi + (dtMs * regen) / 1000);
    state.player.shield = Math.max(0, state.player.shield - (dtMs * SHIELD_DECAY_PER_SEC) / 1000);
    if (state.t - state.lastCastAt > COMBO_WINDOW_MS) state.combo = 0;

    const controlled = state.enemy.controlMs > 0;
    state.enemy.controlMs = Math.max(0, state.enemy.controlMs - dtMs);

    if (!controlled && state.enemy.traits.includes("regen") && state.enemy.hp > 0) {
      state.enemy.hp = Math.min(state.enemy.maxHp, state.enemy.hp + (state.enemy.maxHp * 0.008 * dtMs) / 1000);
    }

    if (controlled) return state;
    state.enemyGauge += dtMs;
    const period = enemyAtkPeriod();
    while (state.enemyGauge >= period && !state.finished) {
      state.enemyGauge -= period;
      enemyStrike();
    }
    return state;
  }

  function getIntent() {
    if (state.finished) return { id: "done", label: "尘埃落定", ratio: 0 };
    if (state.enemy.controlMs > 0) {
      return { id: "bound", label: `受缚 ${(state.enemy.controlMs / 1000).toFixed(1)}s`, ratio: 0 };
    }
    const ratio = Math.min(1, state.enemyGauge / enemyAtkPeriod());
    return ratio > 0.7
      ? { id: "strike", label: "蓄势欲袭！", ratio }
      : { id: "gather", label: "游走观势", ratio };
  }

  return { cast, tick, getState: () => state, getIntent };
}

function mulberry(seed) {
  let s = seed | 0 || 1;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
