/**
 * 战斗控制器：回合状态机 + 伤害/元素/连击结算 + 特效队列。
 * 渲染层只读这里的状态，不反向改动。
 */
import { baseHit } from "./adapters.js";
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

const ELEMENT_TINT = { fire: "#ff8a3d", ice: "#8fd3ff", thunder: "#ffe566", none: "#ffd447" };

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
  battle.shake = (amt) => {
    if (config.settings?.shake === false || config.settings?.reduceMotion) return;
    battle.shakeAmt = Math.min(22, battle.shakeAmt + amt);
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
    battle.hitStop = Math.min(MAX_HIT_STOP, Math.max(battle.hitStop, stop * scale));
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

  // ——— 状态与反应 ———
  battle.applyStatus = (enemy, kind, stacks = 1) => {
    if (!enemy?.alive) return;
    const st = enemy.status;
    if (kind === "fire" || kind === "burn") {
      if (st.freeze > 0) {
        st.freeze = 0;
        battle.reaction(enemy, "蒸发", "#ffb36b");
        battle.rawDamage(enemy, Math.max(6, enemy.maxHp * 0.06), "#ffb36b");
      }
      st.burn = Math.min(6, st.burn + stacks);
    } else if (kind === "ice" || kind === "freeze") {
      st.freeze = Math.min(4, st.freeze + stacks + battle.freezeBonus);
    } else if (kind === "shock") {
      if (st.freeze > 0) {
        enemy.armor = Math.max(0, enemy.armor - 8);
        battle.reaction(enemy, "超导", "#8fd3ff");
      }
      if (st.burn > 0) {
        battle.reaction(enemy, "超载", "#ff6b9d");
        for (const n of battle.nearestEnemies(enemy, 3, 130)) {
          battle.rawDamage(n, Math.max(5, enemy.maxHp * 0.05), "#ff6b9d");
        }
        battle.burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#ff6b9d", 16, 220);
        battle.shake(6);
      }
      st.shock = Math.min(6, st.shock + stacks);
    }
  };
  battle.reaction = (enemy, name, color) => {
    battle.float(enemy.x + enemy.w / 2, enemy.y - 6, name, color, 18);
    battle.ripple(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, color, 44);
    audio.play("reaction");
  };
  battle.rawDamage = (enemy, amount, color = "#ffd447") => {
    if (!enemy?.alive) return 0;
    const dmg = Math.max(1, Math.round(amount));
    enemy.hp -= dmg;
    enemy.flash = 0.18;
    battle.damageDealt += dmg;
    battle.float(enemy.x + enemy.w / 2 + rng.range(-8, 8), enemy.y + 8, String(dmg), color, 17);
    if (enemy.hp <= 0) battle.killEnemy(enemy);
    return dmg;
  };

  battle.damageEnemy = (enemy, amount, opts = {}) => {
    if (!enemy?.alive) return 0;
    const element = opts.element ?? "none";
    let dmg = amount;
    dmg *= 1 - enemy.armor / (enemy.armor + 70);
    dmg *= 1 - (enemy.resist?.[element] ?? 0);
    if (enemy.status.freeze > 0) dmg *= 1.2;
    if (battle.teamAtkBuff) dmg *= battle.teamAtkBuff.mul;
    const crit = opts.crit || rng.chance(0.08 + battle.critBonus + battle.combo * 0.004);
    if (crit) dmg *= 1.6 + battle.combo * 0.06;
    const color = crit ? "#ff6b9d" : ELEMENT_TINT[element] ?? "#ffd447";
    const dealt = battle.rawDamage(enemy, dmg, color);
    if (crit) {
      battle.ripple(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#ff6b9d", 40);
      battle.shake(4);
    }
    if (element !== "none") battle.applyStatus(enemy, element, 1);
    return dealt;
  };

  battle.killEnemy = (enemy) => {
    if (!enemy.alive) return;
    enemy.alive = false;
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
      bumpCombo();

      let mul = egg.damageMul;
      mul *= 1 + (egg.bounceScaling ?? 0) * Math.min(10, egg.wallBounces);
      mul *= callHook(hero, "damageMul", egg, enemy, battle) ?? 1;
      const crit = egg.crit || (egg.firstHitCrit && egg.hitCount === 1);

      const scaled = baseHit(
        { ...egg, power: egg.power * mul },
        enemy,
        { combo: battle.combo, element: egg.element },
      );
      const dealt = battle.damageEnemy(enemy, scaled.damage, { element: egg.element, crit });

      battle.grantEnergy(hero, 6);
      battle.burst(egg.x, egg.y, ELEMENT_TINT[egg.element] ?? "#ffd447", 8, 180);
      // 这一下削掉了目标多少血 → 停顿多久、震多狠
      const lethal = clamp(dealt / Math.max(1, enemy.maxHp), 0, 1);
      battle.punch(3 + lethal * 12 + (crit ? 3 : 0), 0.03 + lethal * 0.08 + (crit ? 0.02 : 0));
      audio.play("hit", { rate: comboRate(battle.combo - 1) });
      if (battle.modifiers.shockOnHit) battle.applyStatus(enemy, "shock", 1);
      if (battle.modifiers.burnOnHit) battle.applyStatus(enemy, "burn", 1);
      callHook(hero, "onEnemyHit", egg, enemy, battle, scaled);

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

  function bumpCombo() {
    battle.combo++;
    battle.comboTimer = battle.comboWindow;
    battle.comboPeak = Math.max(battle.comboPeak, battle.combo);
    if (battle.combo > 0 && battle.combo % 5 === 0) {
      battle.float(LAUNCH_X, 150, `${battle.combo} 连击!`, "#ff6b9d", 24);
      audio.play("combo", { rate: comboRate(Math.floor(battle.combo / 5)) });
      battle.punch(2 + battle.combo * 0.2, 0.035);
    }
    if (battle.combo === 20) {
      battle.announce("爆蛋时刻！全场引爆");
      battle.punch(14, 0.14);
      for (const en of battle.aliveEnemies()) battle.damageEnemy(en, battle.activeHero().atk * 1.6, { element: "fire" });
    }
  }

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

    if (battle.comboFreeze > 0) battle.comboFreeze -= dt;
    else if (battle.combo > 0) {
      battle.comboTimer -= dt;
      if (battle.comboTimer <= 0) battle.combo = 0;
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
    for (const e of world.enemies) if (e.flash > 0) e.flash -= dt;
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
