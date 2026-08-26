import { TALISMANS } from "../data/talismans.js";
import { classById, COUNTER } from "../data/classes.js";
import { realmById } from "../data/realms.js";
import { reaction } from "./elements.js";
import { enemyIntent, ENEMY_ATTACK_INTERVAL_MS } from "./ai.js";

export const QI_REGEN_PER_MS = 0.008;

/**
 * createBattle 的可选外部加成。全部为纯数字，默认值即“无加成”，
 * 因此 progression / classes 里的数据文件不需要为战斗做任何改动。
 * 两种等价写法：
 *   扁平： { atkMult: talentMult(save, "atk"), crit: 0.08, shield: 12 }
 *   嵌套： { talent: { atk, def, sup }, beast: beastBonus(save) }
 * 其中 talent.* 直接吃 talentMult(save, tree) 的返回值，
 * beast 直接吃 beastBonus(save) 的 { crit, qiRegen, shield }。扁平键优先。
 */
export const DEFAULT_MODIFIERS = {
  atkMult: 1, // 天赋 atk 树：符咒伤害倍率
  defMult: 1, // 天赋 def 树：护盾生成倍率
  supMult: 1, // 天赋 sup 树：治疗量与控制时长倍率
  incomingMult: 1, // 受到伤害倍率
  crit: 0, // 灵兽 crit：暴击率 0~1
  critMult: 1.6, // 暴击伤害倍率
  qiRegen: 0, // 灵兽 qiRegen：每秒额外回气
  shield: 0, // 灵兽 shield：每次护盾符额外护盾
  comboWindowMs: 1200, // 连击窗口
  comboStep: 0.06, // 每层连击加伤
  comboMax: 5, // 连击层数上限
  enemyIntervalMs: ENEMY_ATTACK_INTERVAL_MS, // 敌人出手间隔
};

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// 后台标签页可能一次送来几分钟的 dt，单个 tick 最多补这么多刀，避免瞬间秒杀。
const MAX_CATCHUP_STRIKES = 64;

// 折线（破军刺）破甲：底噪压低、斜率抬高，让收益集中在高精度笔画上。
// 满精度仍是每层 0.16，叠加上限 0.35 不变。
const SHRED_BASE = 0.04;
const SHRED_PER_PRECISION = 0.12;
const SHRED_CAP = 0.35;

function shredGain(precision) {
  return SHRED_BASE + precision * SHRED_PER_PRECISION;
}

// 束缚（缠丝索）控制时长：底噪压低、斜率抬高，让精度真正拉开差距。
// 满精度仍是 1600ms，最低精度 0.2 从 880ms 降到 720ms，可控区间由 720ms 拉到 880ms。
const CONTROL_BASE_MS = 500;
const CONTROL_PER_PRECISION_MS = 1100;

export function controlDurationMs(precision, reactionControl = 0) {
  return CONTROL_BASE_MS + precision * CONTROL_PER_PRECISION_MS + reactionControl;
}

const TALENT_KEYS = { atk: "atkMult", def: "defMult", sup: "supMult" };
const BEAST_KEYS = { crit: "crit", qiRegen: "qiRegen", shield: "shield" };

function mapInto(out, source, mapping) {
  if (!source) return;
  for (const [from, to] of Object.entries(mapping)) {
    const v = source[from];
    if (typeof v === "number" && Number.isFinite(v)) out[to] = v;
  }
}

export function normalizeModifiers(input) {
  const out = { ...DEFAULT_MODIFIERS };
  mapInto(out, input?.talent, TALENT_KEYS);
  mapInto(out, input?.beast, BEAST_KEYS);
  for (const key of Object.keys(DEFAULT_MODIFIERS)) {
    const v = input?.[key];
    if (typeof v === "number" && Number.isFinite(v)) out[key] = v;
  }
  out.atkMult = Math.max(0, out.atkMult);
  out.defMult = Math.max(0, out.defMult);
  out.supMult = Math.max(0, out.supMult);
  out.incomingMult = Math.max(0, out.incomingMult);
  out.crit = clamp(out.crit, 0, 1);
  out.critMult = Math.max(1, out.critMult);
  out.qiRegen = Math.max(0, out.qiRegen);
  out.shield = Math.max(0, out.shield);
  out.comboWindowMs = Math.max(0, out.comboWindowMs);
  out.comboStep = Math.max(0, out.comboStep);
  out.comboMax = Math.max(0, Math.floor(out.comboMax));
  out.enemyIntervalMs = Math.max(1, out.enemyIntervalMs);
  return out;
}

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
    shield: 0,
    controlMs: 0,
    shred: 0,
    cooldownMs: 0,
    intent: "watch",
  };
}

export function createBattle({ player, enemy, seed = 1, modifiers } = {}) {
  const mods = normalizeModifiers(modifiers);
  const state = {
    player: createActor(player),
    enemy: createActor(enemy),
    log: [],
    finished: null,
    t: 0,
    rng: mulberry(seed),
    modifiers: mods,
    combo: 0,
    comboMult: 1,
    lastCastAt: -Infinity,
  };
  state.enemy.cooldownMs = mods.enemyIntervalMs;

  function syncIntent() {
    state.enemy.intent = enemyIntent(state.t, state.enemy.controlMs, {
      cooldownMs: state.enemy.cooldownMs,
      intervalMs: mods.enemyIntervalMs,
    });
    return state.enemy.intent;
  }
  syncIntent();

  function push(msg, extra = {}) {
    state.log.unshift({ t: state.t, msg, ...extra });
    state.log = state.log.slice(0, 24);
  }

  function checkEnd() {
    if (state.finished) return state.finished;
    if (state.player.hp <= 0) state.finished = "lose";
    else if (state.enemy.hp <= 0) state.finished = "win";
    if (state.finished) {
      push(state.finished === "win" ? "笔落，敌散。" : "墨尽，人倒。", { kind: "end" });
    }
    return state.finished;
  }

  function deal(target, amount) {
    let left = amount;
    if (target.shield > 0) {
      const absorb = Math.min(target.shield, left);
      target.shield -= absorb;
      left -= absorb;
    }
    target.hp = Math.max(0, target.hp - left);
    return amount;
  }

  // 连击：与上一次成功施法的间隔在窗口内则叠层，超时清零。
  function bumpCombo() {
    const gap = state.t - state.lastCastAt;
    state.combo = gap <= mods.comboWindowMs ? Math.min(mods.comboMax, state.combo + 1) : 0;
    state.lastCastAt = state.t;
    state.comboMult = 1 + state.combo * mods.comboStep;
    return state.comboMult;
  }

  function decayCombo() {
    if (state.combo > 0 && state.t - state.lastCastAt > mods.comboWindowMs) {
      state.combo = 0;
      state.comboMult = 1;
    }
  }

  function cast(stroke, elementHint) {
    const events = [];
    if (state.finished || !stroke) return { events, state };
    const cls = classById(state.player.classId);
    const talisman = TALISMANS[stroke.type] ?? TALISMANS.scribble;
    const cost = talisman.qi;
    if (state.player.qi < cost) {
      push("灵气不足，笔锋散了。", { kind: "warn" });
      return { events, state };
    }
    state.player.qi -= cost;

    const comboMult = bumpCombo();
    const combo = state.combo;
    const bonus = cls?.bonus?.[stroke.type] ?? 0;
    const prec = Math.max(0.2, stroke.precision ?? 0.4);
    const press = stroke.pressure ?? 0.5;
    let dmg = state.player.atk * (0.65 + prec * 1.15) * (1 + bonus) * (0.85 + press * 0.3);
    dmg *= mods.atkMult;
    const react = reaction(elementHint || cls?.element, state.enemy.element);
    dmg *= react.damage;
    if (COUNTER[state.player.classId] === state.enemy.classId) dmg *= 1.18;
    if (COUNTER[state.enemy.classId] === state.player.classId) dmg *= 0.88;
    dmg *= 1 + (state.enemy.shred || 0);
    dmg *= comboMult;
    const critChance = mods.crit + (react.crit || 0);
    const crit = critChance > 0 && state.rng() < Math.min(1, critChance);
    if (crit) dmg *= mods.critMult;

    let hit = 0;
    if (stroke.type === "circle") {
      const shield = (18 + prec * 42 * (1 + bonus)) * mods.defMult + mods.shield;
      state.player.shield += shield;
      push(`${talisman.name} · 护盾 +${Math.round(shield)}`, { kind: "buff" });
    } else if (stroke.type === "cloud") {
      const heal = (16 + prec * 36 * (1 + bonus)) * mods.supMult;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + heal);
      push(`${talisman.name} · 回春 ${Math.round(heal)}`, { kind: "heal" });
    } else if (stroke.type === "curve") {
      state.enemy.controlMs += controlDurationMs(prec, react.control || 0) * mods.supMult;
      hit = deal(state.enemy, dmg * 0.55);
      push(`${talisman.name} · 束缚并伤 ${Math.round(hit)}`, { kind: "ctrl" });
    } else if (stroke.type === "zigzag") {
      state.enemy.shred = Math.min(SHRED_CAP, state.enemy.shred + shredGain(prec));
      hit = deal(state.enemy, dmg * 1.15);
      push(`${talisman.name} · 破甲穿刺 ${Math.round(hit)}`, { kind: "hit" });
    } else if (stroke.type === "spiral") {
      hit = deal(state.enemy, dmg * 1.25);
      push(`${talisman.name} · 阵法轰击 ${Math.round(hit)}`, { kind: "aoe" });
    } else {
      hit = deal(state.enemy, dmg);
      push(`${talisman.name} · ${Math.round(hit)}`, { kind: "hit" });
    }

    if (crit) push("暴击！墨溅三尺。", { kind: "crit" });
    if (combo > 0) push(`连击 x${combo + 1} · 伤害 +${Math.round((comboMult - 1) * 100)}%`, { kind: "combo" });
    if (react.label) push(react.label, { kind: "react" });
    events.push({ type: "cast", talisman, stroke, damage: hit, combo, comboMult, crit });
    checkEnd();
    syncIntent();
    return { events, state };
  }

  function enemyStrike() {
    const roll = state.rng();
    const raw = state.enemy.atk * (0.85 + roll * 0.4) * mods.incomingMult;
    const hit = deal(state.player, raw);
    push(`${state.enemy.name} 反噬 ${Math.round(hit)}`, { kind: "enemy" });
    checkEnd();
  }

  /**
   * 累计冷却推进：不再用 state.t % 间隔 < dtMs 猜边界。
   * 任意 dtMs（大、小、抖动、被浏览器节流）都只按“流逝了多少可行动时间”结算，
   * 冷却余量跨 tick 累计，多余时间会正确结转到下一次出手。
   */
  function tick(dtMs) {
    if (state.finished) return state;
    const step = Number.isFinite(dtMs) && dtMs > 0 ? dtMs : 0;
    state.t += step;

    const regen = QI_REGEN_PER_MS + mods.qiRegen / 1000;
    state.player.qi = Math.min(state.player.maxQi, state.player.qi + step * regen);
    decayCombo();

    // 被控期间冷却冻结，剩下的时间才算作敌人的可行动时间。
    const bound = Math.min(step, state.enemy.controlMs);
    state.enemy.controlMs = Math.max(0, state.enemy.controlMs - step);
    const active = step - bound;

    if (state.enemy.controlMs <= 0) {
      state.enemy.cooldownMs -= active;
      let strikes = 0;
      while (state.enemy.cooldownMs <= 0 && !state.finished && strikes < MAX_CATCHUP_STRIKES) {
        state.enemy.cooldownMs += mods.enemyIntervalMs;
        enemyStrike();
        strikes += 1;
      }
      if (state.enemy.cooldownMs <= 0) state.enemy.cooldownMs = mods.enemyIntervalMs;
    }

    syncIntent();
    return state;
  }

  return {
    cast,
    tick,
    getState: () => state,
    getModifiers: () => ({ ...mods }),
    intent: () => state.enemy.intent,
  };
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
