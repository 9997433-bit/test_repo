/**
 * 战斗控制器：回合状态机 + 特效队列 + 效果指令执行。
 *
 * 伤害 / 元素反应 / 连击 / 爆蛋时刻**不在这里实现**：全部由
 * `combat.resolveHit(egg, target, ctx)` 结算，本文件只负责
 *   1. 把战场实体翻译成契约要求的蛋 / 目标 / 上下文；
 *   2. 消费返回的 `damage` / `comboDelta` / `effects`。
 * 因此爆蛋时刻、元素反应、暴击各只有一套实现，全部在 `src/combat`。
 *
 * 渲染层只读这里的状态，不反向改动。
 */
import {
  BURST_BUFF_ID,
  COMBO,
  EFFECT,
  ELEMENT,
  ELEMENTS,
  STATUS,
  burstThreshold,
  expandAreaEffects,
  isBurstActive,
} from "../combat/index.js";
import { resolveStrike } from "./adapters.js";
import { makeEnemy } from "./bestiary.js";
import { createRng, hashSeed } from "./rng.js";
import { callHook, hasUlt } from "./skills.js";
import {
  LAUNCH_X,
  LAUNCH_Y,
  MAX_AIM_DEG,
  MAX_SPEED,
  MIN_SPEED,
  NEST_Y,
  aimVector,
  createWorld,
  makeEgg,
  nextId,
  predictTrajectory,
  stepWorld,
} from "./sim.js";

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/** 命中停顿上限（秒）。再长就从「有力」变成「卡顿」了。 */
const MAX_HIT_STOP = 0.16;
/**
 * 连击音高阶梯（半音）：小调五声音阶上行两个八度后封顶。
 * 直接把 rate 线性拉高会滑出刺耳的半音，走音阶才像在打节奏。
 */
const COMBO_SCALE = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24];
const comboRate = (n) => 2 ** (COMBO_SCALE[clamp(n, 0, COMBO_SCALE.length - 1)] / 12);

export const BATTLE_STATE = {
  AIM: "aim",
  FIRE: "fire",
  RESOLVE: "resolve",
  WON: "won",
  LOST: "lost",
};

const ELEMENT_TINT = { fire: "#ff8a3d", ice: "#8fd3ff", thunder: "#ffe566", none: "#ffd447", physical: "#ffd447" };

/** 游戏侧元素写法 ↔ combat 契约写法（契约用 physical 表示「无附着」）。 */
const COMBAT_ELEMENT = {
  none: ELEMENT.PHYSICAL,
  physical: ELEMENT.PHYSICAL,
  fire: ELEMENT.FIRE,
  ice: ELEMENT.ICE,
  thunder: ELEMENT.THUNDER,
};

/** 飘字 tone → 颜色。tone 可能是元素、反应名、crit 或 burst。 */
const TONE_COLOR = {
  crit: "#ff6b9d",
  burst: "#ffd447",
  vaporize: "#ffb36b",
  superconduct: "#8fd3ff",
  overload: "#ff6b9d",
  fire: "#ff8a3d",
  ice: "#8fd3ff",
  thunder: "#ffe566",
  physical: "#ffd447",
  none: "#ffd447",
};

const toneColor = (tone) => TONE_COLOR[tone] ?? "#ffd447";
const tintOf = (element) => ELEMENT_TINT[element] ?? "#ffd447";

export function createBattle(config) {
  const rng = createRng(hashSeed(config.seed ?? config.level?.id ?? "cnyd"));
  const level = config.level;
  const loadout = config.loadout;
  const audio = config.audio ?? { play() {} };

  const world = createWorld({ nestY: NEST_Y });
  const battle = {
    config,
    level,
    rng,
    world,
    audio,
    heroes: loadout.heroes.map((h) => ({ ...h, energy: h.energy ?? 0 })),
    bonds: loadout.bonds ?? [],
    activeIndex: 0,
    state: BATTLE_STATE.AIM,
    paused: false,

    playerMaxHp: level.playerHp ?? 100,
    playerHp: level.playerHp ?? 100,
    shields: 0,

    combo: 0,
    comboTimer: 0,
    comboWindow: 1.6,
    comboFreeze: 0,
    comboPeak: 0,
    /** 引爆门槛，HUD 用来判断「快到爆蛋时刻了」。数值来自 combat 契约。 */
    comboThreshold: burstThreshold(),
    bursts: 0,
    /** 爆蛋窗口结束时间（秒，与 battle.elapsed 同一时钟）。 */
    burstUntil: 0,
    /** 元素附着：targetId → { element, stacks, power, expiresAt }，喂给 resolveHit 的 ctx.auras。 */
    auras: {},
    /** 限时增益（爆蛋窗口等），由 buff 指令写入，resolveHit 直接读。 */
    buffs: [],

    turn: 1,
    eggsFired: 0,
    damageDealt: 0,
    goldEarned: 0,
    startedAt: 0,
    elapsed: 0,
    timeLimit: level.timeLimit ?? 0,

    energyGainMul: 1,
    freezeBonus: 0,
    descendMul: 1,
    skipDescend: false,
    teamAtkBuff: null,
    nextShot: null,
    critBonus: loadout.critBonus ?? 0,
    bonusEggs: loadout.extraEggs ?? 0,
    modifiers: { restitution: 0, shockOnHit: false, burnOnHit: false },
    takenArtifacts: [],
    pendingDraft: false,

    aim: { angle: 0, power: 0.62, speed: MIN_SPEED + (MAX_SPEED - MIN_SPEED) * 0.62, dragging: false },
    prediction: { points: [], bounces: 0, hitsEnemy: false, impact: null, target: null },

    floats: [],
    particles: [],
    ripples: [],
    beams: [],
    /**
     * 表现层指令队列（震屏 / 停顿 / 连击）。
     * UI 每帧取空并翻译成 fx.css 的 juice 类，战斗层不碰 DOM。
     */
    fx: [],
    shakeAmt: 0,
    hitStop: 0,
    banner: null,
    log: [],
    result: null,
    onEvent: config.onEvent ?? (() => {}),
    endless: !!level.endless,
    wave: 1,
  };

  // ——— 查询 ———
  battle.aliveEnemies = () => world.enemies.filter((e) => e.alive);
  battle.activeHero = () => battle.heroes[battle.activeIndex] ?? battle.heroes[0];
  battle.strongestEnemy = () => {
    let best = null;
    for (const e of battle.aliveEnemies()) if (!best || e.hp > best.hp) best = e;
    return best;
  };
  battle.nearestEnemies = (from, count, radius) => {
    const cx = from.x + from.w / 2;
    const cy = from.y + from.h / 2;
    return battle
      .aliveEnemies()
      .filter((e) => e !== from)
      .map((e) => ({ e, d: Math.hypot(e.x + e.w / 2 - cx, e.y + e.h / 2 - cy) }))
      .filter((o) => o.d <= radius)
      .sort((a, b) => a.d - b.d)
      .slice(0, count)
      .map((o) => o.e);
  };

  // ——— 表现层队列 ———
  battle.announce = (text) => {
    battle.banner = { text, life: 1.6 };
    battle.log.push(text);
    if (battle.log.length > 40) battle.log.shift();
  };
  /** 表现层指令入队。队列有上限，UI 掉帧也不会把内存堆爆。 */
  function pushFx(entry) {
    battle.fx.push(entry);
    if (battle.fx.length > 32) battle.fx.shift();
  }
  /** UI 每帧调用：取走并清空表现层队列。 */
  battle.takeFx = () => {
    if (!battle.fx.length) return [];
    const out = battle.fx;
    battle.fx = [];
    return out;
  };
  /**
   * 震屏。`intensity` 是 combat 反馈事件的口径（<0.8 小 / <1.2 中 / ≥1.2 大），
   * 指令自带强度时原样透传，避免「像素量 → 强度」来回换算掉档。
   */
  battle.shake = (amt, intensity = amt / 10) => {
    if (amt <= 0) return;
    if (config.settings?.shake === false || config.settings?.reduceMotion) return;
    battle.shakeAmt = Math.min(22, battle.shakeAmt + amt);
    pushFx({ kind: "shake", intensity });
  };
  /**
   * 命中反馈：震屏与命中停顿一起给。
   * 停顿是「打到肉」的主要来源，所以按这一下的致命程度分级，
   * 而不是所有命中都用同一个固定值。
   */
  battle.punch = (amt, stop = 0) => {
    battle.shake(amt);
    if (stop <= 0) return;
    const scale = config.settings?.reduceMotion ? 0.45 : 1;
    const duration = Math.min(MAX_HIT_STOP, stop * scale);
    battle.hitStop = Math.max(battle.hitStop, duration);
    pushFx({ kind: "hitstop", duration });
  };
  battle.float = (x, y, text, color, size = 18) => {
    battle.floats.push({ x, y, text, color, size, life: 0.9, vy: -46 });
    if (battle.floats.length > 60) battle.floats.shift();
  };
  battle.burst = (x, y, color, count = 10, speed = 160) => {
    if (config.settings?.reduceMotion) count = Math.min(count, 4);
    for (let i = 0; i < count; i++) {
      const a = rng.range(0, Math.PI * 2);
      const s = rng.range(speed * 0.35, speed);
      battle.particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40,
        r: rng.range(2, 5.5), color, life: rng.range(0.3, 0.75), maxLife: 0.75,
      });
    }
    if (battle.particles.length > 320) battle.particles.splice(0, battle.particles.length - 320);
  };
  battle.ripple = (x, y, color, r = 30) => {
    battle.ripples.push({ x, y, color, r: 4, max: r, life: 0.4 });
  };
  battle.chain = (enemy, index) => {
    const next = battle.nearestEnemies(enemy, 1, 240)[0];
    if (!next) return;
    battle.beams.push({
      x1: enemy.x + enemy.w / 2, y1: enemy.y + enemy.h / 2,
      x2: next.x + next.w / 2, y2: next.y + next.h / 2,
      color: "#ffe566", life: 0.28,
    });
  };

  // ——— 生命 / 能量 ———
  battle.healPlayer = (pct) => {
    const amount = Math.round(battle.playerMaxHp * pct);
    if (amount <= 0) return;
    battle.playerHp = Math.min(battle.playerMaxHp, battle.playerHp + amount);
    battle.float(LAUNCH_X, NEST_Y - 20, `+${amount}`, "#7ee08a", 20);
    audio.play("heal");
  };
  battle.damagePlayer = (amount) => {
    if (battle.shields > 0) {
      battle.shields--;
      battle.float(LAUNCH_X, NEST_Y - 24, "护盾抵挡", "#9fb8ff", 18);
      audio.play("shield");
      return;
    }
    battle.playerHp = Math.max(0, battle.playerHp - amount);
    battle.float(LAUNCH_X, NEST_Y - 24, `-${amount}`, "#ff4d6d", 22);
    battle.punch(9, 0.07);
    audio.play("hurt");
  };
  battle.grantEnergy = (hero, amount) => {
    if (!hero) return;
    const before = hero.energy;
    hero.energy = clamp(hero.energy + amount * battle.energyGainMul, 0, hero.maxEnergy);
    if (before < hero.maxEnergy && hero.energy >= hero.maxEnergy) audio.play("charged");
  };

  // ——— combat 契约桥接 ———
  const enemyById = (id) => (id == null ? null : world.enemies.find((e) => e.id === id) ?? null);

  /**
   * 敌人 → 契约要求的目标视图（只读）。
   * 坐标取中心点（爆炸半径判定按中心算），冻结转成契约的 vulnerable 语义，
   * 护甲 / 抗性直接交给 `computeDamage`，控制器自己不再算一遍减伤。
   */
  function targetView(enemy) {
    const st = enemy.status ?? {};
    const statuses = {};
    if (st.freeze > 0) statuses[STATUS.FREEZE] = { potency: ELEMENTS.FREEZE.damageTakenMult, stacks: 1 };
    return {
      id: enemy.id,
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      armor: enemy.armor,
      resist: enemy.resist,
      x: enemy.x + enemy.w / 2,
      y: enemy.y + enemy.h / 2,
      statuses,
    };
  }

  const targetViews = () => battle.aliveEnemies().map(targetView);

  /**
   * 结算上下文。连击、爆蛋窗口、附着、限时增益都从战斗状态取，
   * 所以「这一击算多少」永远只有一个真源。
   */
  function hitContext(hero, extra = {}) {
    return {
      now: battle.elapsed,
      combo: battle.combo,
      burstUntil: battle.burstUntil,
      auras: battle.auras,
      buffs: battle.buffs,
      hero: hero ? { id: hero.id, atk: hero.atk, school: hero.school } : null,
      // 弹球手感需要比契约默认 5% 更高的暴击底噪
      critChance: 0.08,
      mods: {
        atkMult: battle.teamAtkBuff ? battle.teamAtkBuff.mul : 1,
        critChance: battle.critBonus,
      },
      rng: rng.next,
      ...extra,
    };
  }

  /** 已结算伤害落到敌人身上：不再叠护甲 / 抗性 / 暴击，飘字由 feedback 指令负责。 */
  battle.applyDamage = (enemy, amount) => {
    if (!enemy?.alive) return 0;
    const dmg = Math.max(0, Math.round(amount));
    if (dmg <= 0) return 0;
    enemy.hp -= dmg;
    enemy.flash = 0.18;
    battle.damageDealt += dmg;
    if (enemy.hp <= 0) battle.killEnemy(enemy);
    return dmg;
  };

  /** 无飘字来源的伤害（持续伤害 / 范围指令）自带一个数字。 */
  battle.rawDamage = (enemy, amount, color = "#ffd447") => {
    if (!enemy?.alive) return 0;
    const dmg = Math.max(1, Math.round(amount));
    battle.float(enemy.x + enemy.w / 2 + rng.range(-8, 8), enemy.y + 8, String(dmg), color, 17);
    return battle.applyDamage(enemy, dmg);
  };

  function beamBetween(fromId, enemy) {
    const from = enemyById(fromId);
    if (!from) return;
    battle.beams.push({
      x1: from.x + from.w / 2, y1: from.y + from.h / 2,
      x2: enemy.x + enemy.w / 2, y2: enemy.y + enemy.h / 2,
      color: "#ffe566", life: 0.28,
    });
  }

  /** 连击只从 `resolveHit().comboDelta` 推进，控制器不自己数层数、也不自己判引爆。 */
  function advanceCombo(result) {
    const delta = Number.isFinite(result.comboDelta) ? result.comboDelta : 0;
    if (delta === 0) return;
    const before = battle.combo;
    battle.combo = Math.max(0, before + delta);
    battle.comboTimer = battle.comboWindow;
    battle.comboPeak = Math.max(battle.comboPeak, result.burst ? (result.comboBefore ?? before) + 1 : battle.combo);
    if (delta > 0 && battle.combo > 0 && battle.combo % 5 === 0) {
      battle.float(LAUNCH_X, 150, `${battle.combo} 连击!`, "#ff6b9d", 24);
      audio.play("combo", { rate: comboRate(Math.floor(battle.combo / 5)) });
      battle.punch(2 + battle.combo * 0.2, 0.035);
      pushFx({ kind: "combo-flash" });
    }
    pushFx({ kind: "combo", value: battle.combo, burst: !!result.burst });
  }

  function applyStatusEffect(fx) {
    const enemy = enemyById(fx.targetId);
    if (!enemy?.alive) return;
    const st = enemy.status;
    const stacks = Math.max(1, Math.round(fx.stacks ?? 1));
    if (fx.status === STATUS.BURN) st.burn = Math.min(6, st.burn + stacks);
    else if (fx.status === STATUS.FREEZE) st.freeze = Math.min(4, st.freeze + stacks + battle.freezeBonus);
    else if (fx.status === STATUS.SHOCK) st.shock = Math.min(6, st.shock + stacks);
    else if (fx.status === STATUS.ARMOR_BREAK) {
      const shred = Math.min(0.95, Math.max(0, fx.potency ?? ELEMENTS.SUPERCONDUCT.armorShred));
      enemy.armor = Math.max(0, Math.round(enemy.armor * (1 - shred)));
    }
  }

  function applyComboEffect(fx) {
    if (fx.op === "burst") {
      // 爆蛋时刻唯一入口：层数、窗口、爆炸伤害全部由 combat 的 burstEffects 指定
      battle.combo = Math.max(0, Math.round(fx.value ?? 0));
      battle.comboTimer = battle.comboWindow;
      battle.burstUntil = Math.max(battle.burstUntil, battle.elapsed + (fx.duration ?? COMBO.BURST_DURATION));
      battle.bursts++;
      battle.announce("爆蛋时刻！全场引爆");
      audio.play("boom");
      battle.onEvent("combo-burst", { wave: battle.wave, at: battle.elapsed });
      pushFx({ kind: "combo", value: battle.combo, burst: true });
      pushFx({ kind: "combo-flash" });
      return;
    }
    if (fx.op === "add") battle.combo = Math.max(0, battle.combo + (fx.value ?? 0));
    else if (fx.op === "set") battle.combo = Math.max(0, Math.round(fx.value ?? 0));
    else if (fx.op === "reset") battle.combo = 0;
  }

  function applyFeedback(fx) {
    const at = fx.at ?? { x: LAUNCH_X, y: 200 };
    if (fx.kind === "floater") {
      const size = fx.tone === "crit" ? 23 : (fx.intensity ?? 1) >= 1.2 ? 24 : 17;
      battle.float(at.x + rng.range(-8, 8), at.y, String(fx.text ?? ""), toneColor(fx.tone), size);
      if (fx.tone === "vaporize" || fx.tone === "superconduct" || fx.tone === "overload") {
        battle.ripple(at.x, at.y, toneColor(fx.tone), 44);
        audio.play("reaction");
      }
      return;
    }
    if (fx.kind === "hitstop") {
      battle.punch(0, fx.duration ?? 0.03);
      return;
    }
    if (fx.kind === "shake") {
      const intensity = fx.intensity ?? 1;
      battle.shake(intensity * 8, intensity);
      return;
    }
    if (fx.kind === "element-burst") {
      battle.burst(at.x, at.y, toneColor(fx.tone), 12, 200);
    }
  }

  function dispatchEffect(fx) {
    switch (fx?.type) {
      case EFFECT.DAMAGE: {
        const enemy = enemyById(fx.targetId);
        if (!enemy?.alive) return;
        if (fx.kind === "chain") beamBetween(fx.source, enemy);
        battle.rawDamage(enemy, fx.amount, tintOf(fx.element));
        return;
      }
      case EFFECT.STATUS:
        applyStatusEffect(fx);
        return;
      case EFFECT.CLEAR_STATUS: {
        const enemy = enemyById(fx.targetId);
        if (!enemy?.status) return;
        if (fx.status === STATUS.FREEZE) enemy.status.freeze = 0;
        else if (fx.status === STATUS.BURN) enemy.status.burn = 0;
        else if (fx.status === STATUS.SHOCK) enemy.status.shock = 0;
        return;
      }
      case EFFECT.AURA: {
        const enemy = enemyById(fx.targetId);
        if (!fx.element || !(fx.stacks > 0)) {
          delete battle.auras[fx.targetId];
          if (enemy) enemy.aura = null;
          return;
        }
        const aura = { element: fx.element, stacks: fx.stacks, power: fx.power, expiresAt: fx.expiresAt };
        battle.auras[fx.targetId] = aura;
        if (enemy) enemy.aura = aura;
        return;
      }
      case EFFECT.BUFF: {
        const expiresAt = battle.elapsed + (fx.duration ?? 0);
        battle.buffs = battle.buffs.filter((b) => b.id !== fx.id);
        battle.buffs.push({ id: fx.id, mods: fx.mods, stacks: fx.stacks ?? 1, expiresAt });
        if (fx.id === BURST_BUFF_ID) battle.burstUntil = Math.max(battle.burstUntil, expiresAt);
        return;
      }
      case EFFECT.COMBO:
        applyComboEffect(fx);
        return;
      case EFFECT.ENERGY: {
        if (fx.scope === "team") for (const h of battle.heroes) battle.grantEnergy(h, fx.amount ?? 0);
        else battle.grantEnergy(battle.activeHero(), fx.amount ?? 0);
        return;
      }
      case EFFECT.HEAL: {
        const ratio = fx.ratio > 0 ? fx.ratio : (fx.amount ?? 0) / Math.max(1, battle.playerMaxHp);
        if (ratio > 0) battle.healPlayer(ratio);
        return;
      }
      case EFFECT.SHIELD:
        battle.shields += Math.max(1, Math.round(fx.blocks || 1));
        return;
      case EFFECT.FEEDBACK:
        applyFeedback(fx);
        return;
      default:
    }
  }

  /**
   * 消费一批效果指令。这是战斗层唯一的效果执行口：
   * 爆炸 / 链击先按当前存活敌人展开成已结算的直接伤害，其余按域分派。
   */
  battle.consumeEffects = (effects) => {
    if (!effects?.length) return;
    for (const fx of effects) {
      if (fx?.type !== EFFECT.EXPLOSION) continue;
      const big = fx.kind === "combo_burst";
      battle.ripple(fx.x, fx.y, tintOf(fx.element), fx.radius ?? 60);
      battle.burst(fx.x, fx.y, tintOf(fx.element), big ? 36 : 12, big ? 320 : 200);
    }
    const { effects: flat } = expandAreaEffects(effects, targetViews(), { now: battle.elapsed });
    for (const fx of flat) dispatchEffect(fx);
  };

  /**
   * 直接施加状态（技能 / 神器 / 关卡修饰用）。
   * 元素反应只有一套实现（`combat/elements.js`），这里不判蒸发 / 超导 / 超载。
   */
  battle.applyStatus = (enemy, kind, stacks = 1) => {
    if (!enemy?.alive) return;
    const st = enemy.status;
    if (kind === "fire" || kind === "burn") st.burn = Math.min(6, st.burn + stacks);
    else if (kind === "ice" || kind === "freeze") st.freeze = Math.min(4, st.freeze + stacks + battle.freezeBonus);
    else if (kind === "thunder" || kind === "shock") st.shock = Math.min(6, st.shock + stacks);
  };

  /**
   * 技能 / 大招 / 场地机关的直接伤害，同样走 `resolveHit`——全局只有一套伤害权威。
   * 技能不叠连击（`comboGain: 0`），但会吃当前连击层数与爆蛋窗口的加成。
   */
  battle.damageEnemy = (enemy, amount, opts = {}) => {
    if (!enemy?.alive) return 0;
    const hero = opts.hero ?? battle.activeHero();
    const strike = {
      id: opts.source ?? "skill",
      power: amount,
      element: COMBAT_ELEMENT[opts.element ?? "none"] ?? ELEMENT.PHYSICAL,
      isMain: false,
      noCombo: true,
      ownerId: hero?.id ?? null,
      ...(opts.crit ? { forceCrit: true } : {}),
    };
    // hero: null —— 技能伤害不吃流派主蛋倍率，那是发射出去的蛋才有的身份加成
    const result = resolveStrike(strike, targetView(enemy), hitContext(hero, { hero: null, comboGain: 0 }));
    const dealt = battle.applyDamage(enemy, result.damage);
    battle.consumeEffects(result.effects);
    if (result.crit) battle.ripple(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#ff6b9d", 40);
    return dealt;
  };

  battle.killEnemy = (enemy) => {
    if (!enemy.alive) return;
    enemy.alive = false;
    enemy.aura = null;
    delete battle.auras[enemy.id];
    battle.burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, enemy.color, enemy.boss ? 40 : 16, enemy.boss ? 300 : 200);
    battle.goldEarned += enemy.boss ? 60 : enemy.elite ? 24 : 6;
    audio.play(enemy.boss ? "bossDown" : "pop");
    battle.punch(
      enemy.boss ? 18 : enemy.elite ? 9 : 4,
      enemy.boss ? 0.16 : enemy.elite ? 0.09 : 0.05,
    );
    battle.onEvent("enemy-killed", enemy);
    if (battle.endless && level.respawnBoss && enemy.boss) battle.respawnRaidBoss();
  };

  // ——— 蛋 ———
  function heroEgg(hero, index, overrides = {}) {
    const atkBuff = battle.teamAtkBuff ? battle.teamAtkBuff.mul : 1;
    const egg = makeEgg({
      x: LAUNCH_X,
      y: LAUNCH_Y,
      r: 12,
      power: hero.atk * atkBuff,
      element: hero.element ?? "none",
      owner: hero.id,
      ownerName: hero.name,
      palette: hero.palette,
      isMain: index === 0,
      ...overrides,
    });
    callHook(hero, "modifyEgg", egg, battle, index);
    egg.restitution = Math.min(0.97, egg.restitution + battle.modifiers.restitution);
    const buff = battle.nextShot;
    if (buff) {
      if (buff.damageMul) egg.damageMul *= buff.damageMul;
      if (buff.pierce) egg.pierce = Math.max(egg.pierce, buff.pierce);
      if (buff.radius) egg.r = buff.radius;
      if (buff.growth) egg.growth = buff.growth;
      if (buff.splitOnHit) egg.splitOnHit = buff.splitOnHit;
    }
    return egg;
  }

  battle.spawnShards = (parent, count, opts = {}) => {
    for (let i = 0; i < count; i++) {
      const a = rng.range(-Math.PI, Math.PI);
      const speed = opts.speed ?? 380;
      const egg = makeEgg({
        x: parent.x, y: parent.y,
        vx: Math.cos(a) * speed * rng.range(0.6, 1),
        vy: Math.sin(a) * speed * rng.range(0.6, 1) - 60,
        r: opts.r ?? 7,
        power: parent.power * (opts.damageMul ?? 0.5),
        element: parent.element,
        owner: parent.owner,
        ownerName: parent.ownerName,
        palette: parent.palette,
        restitution: 0.8,
      });
      world.eggs.push(egg);
    }
    audio.play("split");
  };

  battle.spawnFan = (count, opts = {}) => {
    const hero = battle.activeHero();
    const spread = ((opts.spreadDeg ?? 50) * Math.PI) / 180;
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const a = -spread / 2 + spread * t;
      const speed = opts.speed ?? 600;
      const egg = heroEgg(hero, i + 1, {
        vx: Math.sin(a) * speed,
        vy: Math.cos(a) * speed,
        r: opts.r ?? 8,
      });
      egg.damageMul *= opts.damageMul ?? 0.7;
      world.eggs.push(egg);
    }
    battle.state = BATTLE_STATE.FIRE;
    audio.play("shoot");
  };

  battle.buffNextShot = (buff) => {
    battle.nextShot = { ...(battle.nextShot ?? {}), ...buff };
  };

  battle.addIcePatch = () => {
    world.ice.push({ x: 40, y: 560, w: 400, h: 14 });
  };

  // ——— 命中钩子 ———
  const hooks = {
    onWall(egg) {
      audio.play("wall", { rate: 1 + Math.min(0.5, egg.wallBounces * 0.05) });
      battle.ripple(egg.x, egg.y, "#5a4a7a", 18);
    },
    onSlope(egg) {
      audio.play("wall", { rate: 1.1 });
    },
    onPeg(egg, peg) {
      peg.hitFlash = 0.3;
      if (!peg.lit) {
        peg.lit = true;
        battle.grantEnergy(battle.activeHero(), 3);
      }
      battle.burst(peg.x, peg.y, "#3ee0c5", 5, 120);
      // 钉板也走音阶：一路弹下来会是一段上行的琶音
      audio.play("peg", { rate: comboRate(Math.min(6, egg.collisions)) });
      const hero = battle.heroes.find((h) => h.id === egg.owner);
      if (hero) callHook(hero, "onPegHit", egg, peg, battle);
      if (peg.type === "bomb" && !peg.spent) {
        peg.spent = true;
        peg.alive = false;
        battle.burst(peg.x, peg.y, "#ff8a3d", 26, 280);
        battle.shake(10);
        audio.play("boom");
        for (const en of battle.aliveEnemies()) {
          const d = Math.hypot(en.x + en.w / 2 - peg.x, en.y + en.h / 2 - peg.y);
          if (d < 130) battle.damageEnemy(en, egg.power * 2.2 * (1 - d / 160), { element: "fire" });
        }
      }
    },
    onBrick(egg, brick) {
      brick.flash = 0.2;
      if (brick.kind === "steel") {
        audio.play("clank");
        return;
      }
      const dmg = Math.max(1, Math.round(egg.power * egg.damageMul * 0.9));
      brick.hp -= dmg;
      audio.play("brick");
      battle.burst(egg.x, egg.y, brick.color ?? "#c9b8d6", 6, 140);
      if (brick.hp <= 0) {
        brick.alive = false;
        battle.goldEarned += 1;
        battle.burst(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.color ?? "#c9b8d6", 12, 200);
        if (brick.kind === "bomb") {
          battle.shake(12);
          audio.play("boom");
          for (const en of battle.aliveEnemies()) {
            const d = Math.hypot(en.x + en.w / 2 - brick.x, en.y + en.h / 2 - brick.y);
            if (d < 150) battle.damageEnemy(en, egg.power * 2.6 * (1 - d / 180), { element: "fire" });
          }
        }
        const hero = battle.heroes.find((h) => h.id === egg.owner);
        if (hero?.id === "mech_goose") egg.pierce = Math.min(3, egg.pierce + 1);
      }
    },
    onEnemy(egg, enemy) {
      egg.hitCount++;
      const hero = battle.heroes.find((h) => h.id === egg.owner) ?? battle.activeHero();

      let mul = egg.damageMul;
      mul *= 1 + (egg.bounceScaling ?? 0) * Math.min(10, egg.wallBounces);
      mul *= callHook(hero, "damageMul", egg, enemy, battle) ?? 1;
      const forceCrit = egg.crit || (egg.firstHitCrit && egg.hitCount === 1);

      // 蛋 → 契约视图：威力、倍率、元素、流派身份、碰撞次数都由 combat 消化
      const strike = {
        id: egg.id,
        power: egg.power,
        damageMult: mul,
        element: COMBAT_ELEMENT[egg.element] ?? ELEMENT.PHYSICAL,
        isMain: egg.isMain,
        collisions: egg.collisions,
        ownerId: hero?.id ?? null,
        ...(forceCrit ? { forceCrit: true } : {}),
      };
      const result = resolveStrike(
        strike,
        targetView(enemy),
        hitContext(hero, { hitIndex: egg.hitCount, hitPoint: { x: egg.x, y: egg.y } }),
      );

      // 唯一伤害权威：护甲 / 抗性 / 暴击 / 连击 / 爆蛋窗口都已经在 resolveHit 里算过
      const dealt = battle.applyDamage(enemy, result.damage);
      advanceCombo(result);
      battle.consumeEffects(result.effects);

      battle.grantEnergy(hero, 6);
      battle.burst(egg.x, egg.y, tintOf(result.element), 8, 180);
      // 这一下削掉了目标多少血 → 停顿多久、震多狠
      const lethal = clamp(dealt / Math.max(1, enemy.maxHp), 0, 1);
      battle.punch(3 + lethal * 12 + (result.crit ? 3 : 0), 0.03 + lethal * 0.08);
      audio.play("hit", { rate: comboRate(Math.max(0, battle.combo - 1)) });
      if (battle.modifiers.shockOnHit) battle.applyStatus(enemy, "shock", 1);
      if (battle.modifiers.burnOnHit) battle.applyStatus(enemy, "burn", 1);
      callHook(hero, "onEnemyHit", egg, enemy, battle, result);

      if (egg.splitOnHit > 0) {
        const n = egg.splitOnHit;
        egg.splitOnHit = 0;
        battle.spawnShards(egg, n, { r: 8, damageMul: 0.55, speed: 420 });
      }
    },
    onRecycle(egg) {
      const hero = battle.heroes.find((h) => h.id === egg.owner);
      if (hero) callHook(hero, "onRecycle", egg, battle);
      battle.ripple(egg.x, world.h - 20, "#ffd447", 24);
    },
  };

  // ——— 发射 ———
  battle.setAim = (angle, power) => {
    battle.aim.angle = clamp(angle, -MAX_AIM_DEG, MAX_AIM_DEG);
    battle.aim.power = clamp(power, 0.08, 1);
    battle.aim.speed = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * battle.aim.power;
    battle.refreshPrediction();
  };

  battle.refreshPrediction = () => {
    if (battle.state !== BATTLE_STATE.AIM) return;
    const v = aimVector(battle.aim.angle, battle.aim.speed);
    // 用「这一发真的会射出去的蛋」去预测：半径 / 弹性 / 穿透 / 追踪全部取实弹参数。
    // heroEgg 只写 egg 不改战斗状态，所以可以安全地当作探针。
    const hero = battle.activeHero();
    const probe = hero ? heroEgg(hero, 0) : null;
    battle.prediction = predictTrajectory(
      { x: LAUNCH_X, y: LAUNCH_Y },
      { x: v.vx, y: v.vy },
      world,
      {
        maxBounces: config.settings?.aimAssist === false ? 1 : 3,
        r: probe?.r,
        restitution: probe?.restitution,
        pierce: probe?.pierce,
        homing: probe?.homing,
      },
    );
  };

  battle.selectHero = (index) => {
    if (battle.state !== BATTLE_STATE.AIM) return false;
    if (index < 0 || index >= battle.heroes.length) return false;
    battle.activeIndex = index;
    audio.play("ui");
    return true;
  };

  battle.canFire = () => battle.state === BATTLE_STATE.AIM && !battle.paused;

  battle.fire = () => {
    if (!battle.canFire()) return false;
    const hero = battle.activeHero();
    const v = aimVector(battle.aim.angle, battle.aim.speed);
    const extra =
      (callHook(hero, "extraEggs", battle) ?? 0) +
      (battle.nextShot?.extraEggs ?? 0) +
      battle.bonusEggs;
    const total = 1 + Math.max(0, Math.round(extra));

    for (let i = 0; i < total; i++) {
      const jitter = i === 0 ? 0 : ((i % 2 === 0 ? 1 : -1) * Math.ceil(i / 2) * 7 * Math.PI) / 180;
      const speed = i === 0 ? battle.aim.speed : battle.aim.speed * 0.94;
      const dir = (battle.aim.angle * Math.PI) / 180 + jitter;
      const egg = heroEgg(hero, i, {
        vx: Math.sin(dir) * speed,
        vy: Math.cos(dir) * speed,
        x: LAUNCH_X + (i === 0 ? 0 : (i % 2 === 0 ? 1 : -1) * 10),
      });
      if (i > 0) egg.damageMul *= 0.7;
      world.eggs.push(egg);
    }

    battle.nextShot = null;
    battle.eggsFired += total;
    battle.state = BATTLE_STATE.FIRE;
    battle.prediction = { points: [], bounces: 0, hitsEnemy: false, impact: null, target: null };
    audio.play("shoot", { rate: 0.9 + battle.aim.power * 0.4 });
    battle.onEvent("fired", { hero, total });
    return true;
  };

  battle.castUlt = () => {
    const hero = battle.activeHero();
    if (!hero || !hasUlt(hero.id)) return false;
    if (hero.energy < hero.maxEnergy) return false;
    if (battle.state !== BATTLE_STATE.AIM && battle.state !== BATTLE_STATE.FIRE) return false;
    hero.energy = 0;
    audio.play("ult");
    battle.shake(8);
    battle.ripple(LAUNCH_X, LAUNCH_Y + 30, "#ffd447", 90);
    callHook(hero, "ult", battle);
    battle.onEvent("ult", hero);
    battle.checkEnd();
    return true;
  };

  // ——— 回合结算 ———
  function endTurn() {
    battle.state = BATTLE_STATE.RESOLVE;

    for (const en of battle.aliveEnemies()) {
      if (en.status.burn > 0) {
        battle.rawDamage(en, Math.max(3, en.maxHp * 0.035 * en.status.burn), "#ff8a3d");
        en.status.burn--;
      }
      if (en.status.shock > 0) en.status.shock--;
    }
    for (const hero of battle.heroes) callHook(hero, "onTurnEnd", battle);

    for (const en of battle.aliveEnemies()) {
      if (en.heals) {
        for (const other of battle.aliveEnemies()) {
          if (other === en || other.hp >= other.maxHp) continue;
          other.hp = Math.min(other.maxHp, other.hp + en.heals);
          battle.float(other.x + other.w / 2, other.y, `+${en.heals}`, "#7ee08a", 15);
        }
      }
    }

    const descend = (level.descend ?? 22) * battle.descendMul;
    if (!battle.skipDescend && descend > 0) {
      for (const en of battle.aliveEnemies()) {
        if (en.status.freeze > 0) {
          en.status.freeze--;
          battle.float(en.x + en.w / 2, en.y - 4, "冻结", "#8fd3ff", 14);
          continue;
        }
        if (en.boss) continue;
        en.y += descend;
      }
    }
    battle.skipDescend = false;

    for (const en of battle.aliveEnemies()) {
      if (en.boss) {
        en.bossTimer = (en.bossTimer ?? 0) + 1;
        if (en.bossTimer % 3 === 0) {
          battle.announce(`${en.name} 发动攻击！`);
          battle.damagePlayer(en.touch);
        }
        if (en.spawns && en.bossTimer % 4 === 0) {
          world.enemies.push(makeEnemy(en.spawns, rng.range(60, 380), 200, level.scale ?? 1));
          battle.announce("孵化器产出了小怪");
        }
        continue;
      }
      if (en.y + en.h >= world.nestY) {
        battle.damagePlayer(en.touch);
        en.alive = false;
        battle.burst(en.x + en.w / 2, en.y + en.h / 2, "#ff4d6d", 14, 200);
      }
    }

    if (battle.teamAtkBuff) {
      battle.teamAtkBuff.turns--;
      if (battle.teamAtkBuff.turns <= 0) battle.teamAtkBuff = null;
    }
    for (const p of world.pegs) p.lit = false;

    battle.turn++;
    battle.activeIndex = (battle.activeIndex + 1) % battle.heroes.length;
    battle.onEvent("turn-end", battle.turn);

    if (!battle.checkEnd()) {
      battle.state = BATTLE_STATE.AIM;
      battle.refreshPrediction();
    }
  }

  battle.checkEnd = () => {
    if (battle.state === BATTLE_STATE.WON || battle.state === BATTLE_STATE.LOST) return true;
    if (battle.playerHp <= 0) {
      battle.state = BATTLE_STATE.LOST;
      battle.result = summarize(false);
      audio.play("lose");
      battle.onEvent("battle-end", battle.result);
      return true;
    }
    if (!battle.endless && battle.aliveEnemies().length === 0) {
      battle.state = BATTLE_STATE.WON;
      battle.result = summarize(true);
      audio.play("win");
      battle.onEvent("battle-end", battle.result);
      return true;
    }
    if (battle.endless && battle.aliveEnemies().length === 0 && typeof level.nextWave === "function") {
      battle.wave++;
      level.nextWave(battle, battle.wave);
      battle.announce(`第 ${battle.wave} 波`);
      audio.play("wave");
    }
    return false;
  };

  function summarize(victory) {
    const hpRatio = battle.playerHp / battle.playerMaxHp;
    let stars = 1;
    if (victory) {
      stars = 1;
      if (hpRatio >= 0.6) stars++;
      if (battle.comboPeak >= 12 || battle.turn <= 6) stars++;
    } else stars = 0;
    return {
      victory,
      stars,
      turns: battle.turn,
      eggs: battle.eggsFired,
      damage: Math.round(battle.damageDealt),
      comboPeak: battle.comboPeak,
      hpRatio,
      gold: Math.round(battle.goldEarned * (victory ? 1 : 0.35)),
      elapsed: battle.elapsed,
      wave: battle.wave,
    };
  }
  battle.summarize = summarize;

  battle.forceEnd = (victory) => {
    battle.state = victory ? BATTLE_STATE.WON : BATTLE_STATE.LOST;
    battle.result = summarize(victory);
    battle.onEvent("battle-end", battle.result);
  };

  // ——— 主更新 ———
  battle.update = (dtRaw) => {
    if (battle.paused) return;
    const dt = Math.min(0.05, dtRaw);
    if (battle.state === BATTLE_STATE.WON || battle.state === BATTLE_STATE.LOST) {
      decay(dt);
      return;
    }
    battle.elapsed += dt;

    if (battle.hitStop > 0) {
      battle.hitStop -= dt;
      // 特效也跟着放慢，整帧才读得出「顿了一下」而不是「世界停了、粒子还在飞」
      decay(dt * 0.25);
      return;
    }

    if (battle.state === BATTLE_STATE.FIRE) {
      stepWorld(world, dt, hooks);
      for (const en of world.enemies) {
        if (en.alive && en.drift) {
          en.driftPhase += dt * 1.6;
          en.x = clamp(en.baseX + Math.sin(en.driftPhase) * en.drift, 4, world.w - en.w - 4);
        }
      }
      if (world.eggs.length === 0) endTurn();
    }

    if (battle.timeLimit > 0 && battle.elapsed >= battle.timeLimit) {
      battle.forceEnd(level.timeoutWin ?? false);
      return;
    }

    if (battle.buffs.length) battle.buffs = battle.buffs.filter((b) => b.expiresAt > battle.elapsed);

    // 爆蛋窗口内连击不衰减（契约里同一条规则写成 comboDecayMult: 0）
    if (battle.comboFreeze > 0) battle.comboFreeze -= dt;
    else if (battle.combo > 0 && !isBurstActive({ burstUntil: battle.burstUntil }, battle.elapsed)) {
      battle.comboTimer -= dt;
      if (battle.comboTimer <= 0) {
        battle.combo = 0;
        pushFx({ kind: "combo", value: 0 });
      }
    }
    decay(dt);
  };

  function decay(dt) {
    battle.shakeAmt *= Math.max(0, 1 - dt * 6);
    if (battle.banner) {
      battle.banner.life -= dt;
      if (battle.banner.life <= 0) battle.banner = null;
    }
    for (let i = battle.floats.length - 1; i >= 0; i--) {
      const f = battle.floats[i];
      f.life -= dt;
      f.y += f.vy * dt;
      f.vy += 40 * dt;
      if (f.life <= 0) battle.floats.splice(i, 1);
    }
    for (let i = battle.particles.length - 1; i >= 0; i--) {
      const p = battle.particles[i];
      p.life -= dt;
      p.vy += 620 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) battle.particles.splice(i, 1);
    }
    for (let i = battle.ripples.length - 1; i >= 0; i--) {
      const r = battle.ripples[i];
      r.life -= dt;
      r.r += (r.max - r.r) * dt * 9;
      if (r.life <= 0) battle.ripples.splice(i, 1);
    }
    for (let i = battle.beams.length - 1; i >= 0; i--) {
      battle.beams[i].life -= dt;
      if (battle.beams[i].life <= 0) battle.beams.splice(i, 1);
    }
    for (const p of world.pegs) if (p.hitFlash > 0) p.hitFlash -= dt;
    for (const b of world.bricks) if (b.flash > 0) b.flash -= dt;
    for (const e of world.enemies) {
      if (e.flash > 0) e.flash -= dt;
      // 附着过期：contract 侧 readAura 已按 expiresAt 过滤，这里同步清掉渲染用的镜像
      if (e.aura && typeof e.aura.expiresAt === "number" && e.aura.expiresAt <= battle.elapsed) {
        e.aura = null;
        delete battle.auras[e.id];
      }
    }
  }

  battle.respawnRaidBoss = () => {
    const growth = 1 + battle.wave * 0.45;
    battle.wave++;
    const boss = makeEnemy(level.bossType ?? "boss_pot", 182, 200, (level.scale ?? 1) * growth);
    boss.baseX = boss.x;
    world.enemies.push(boss);
    battle.announce(`魔王重生 · 第 ${battle.wave} 形态`);
    audio.play("wave");
  };

  // ——— 场景装配 ———
  buildStage(battle, level, rng);
  if (typeof level.onStart === "function") level.onStart(battle, 1);
  for (const hero of battle.heroes) callHook(hero, "onBattleStart", battle);
  battle.refreshPrediction();
  battle.announce(level.intro ?? level.name ?? "开战！");

  return battle;
}

function buildStage(battle, level, rng) {
  const world = battle.world;
  const scale = level.scale ?? 1;
  for (const e of level.enemies ?? []) {
    const en = makeEnemy(e.type, e.x, e.y, e.scale ?? scale, e.extra);
    en.baseX = en.x;
    world.enemies.push(en);
  }
  for (const p of level.pegs ?? []) {
    world.pegs.push({ id: nextId(), x: p.x, y: p.y, r: p.r ?? 9, type: p.type ?? "peg", alive: true, lit: false, hitFlash: 0 });
  }
  for (const b of level.bricks ?? []) {
    const hp = Math.round((b.hp ?? 30) * scale);
    world.bricks.push({
      id: nextId(), x: b.x, y: b.y, w: b.w ?? 40, h: b.h ?? 20,
      hp, maxHp: hp, kind: b.kind ?? "brick", color: b.color ?? "#7a6aa0", alive: true, flash: 0,
    });
  }
  for (const s of level.slopes ?? []) world.slopes.push({ ...s });
  for (const f of level.fans ?? []) world.fans.push({ ...f });
  for (const i of level.ice ?? []) world.ice.push({ ...i });
  for (const p of level.portals ?? []) world.portals.push({ ...p, alive: true });
  if (typeof level.decorate === "function") level.decorate(world, rng);
}
