/**
 * 英雄被动与大招。
 *
 * 每个条目是一组可选钩子，战斗控制器在对应时机调用；
 * 未定义的钩子直接跳过，因此新增英雄只需补自己关心的那几个。
 *
 * 钩子签名：
 *   onBattleStart(hero, battle)
 *   extraEggs(hero, battle) -> number
 *   modifyEgg(hero, egg, battle, index)
 *   damageMul(hero, egg, enemy, battle) -> number
 *   onEnemyHit(hero, egg, enemy, battle, info)
 *   onPegHit(hero, egg, peg, battle)
 *   onRecycle(hero, egg, battle)
 *   onTurnEnd(hero, battle)
 *   ult(hero, battle)
 */

const SKILLS = {
  // —— 连击 ——
  dash_duck: {
    modifyEgg(hero, egg) {
      if (egg.isMain) egg.firstHitCrit = true;
    },
    ult(hero, battle) {
      battle.buffNextShot({ damageMul: 2.2, pierce: 1, label: "冲鸭冲刺" });
      battle.announce("冲鸭冲刺！下一发穿透爆伤");
    },
  },
  ninja_goose: {
    onEnemyHit(hero, egg, enemy, battle) {
      if (!egg.isMain || egg.hitCount !== 1) return;
      battle.spawnShards(egg, 2, { r: 7, damageMul: 0.45, speed: 420, spread: 1.5 });
    },
    ult(hero, battle) {
      battle.spawnFan(6, { r: 8, damageMul: 0.7, speed: 640, spreadDeg: 58 });
      battle.announce("千蛋乱舞！");
    },
  },
  fallen_crow: {
    damageMul(hero, egg, enemy, battle) {
      return battle.combo >= 8 ? 1.4 : 1;
    },
    ult(hero, battle) {
      const target = battle.strongestEnemy();
      if (target) {
        battle.damageEnemy(target, hero.atk * 6, { element: "none", source: "ult", crit: true });
        battle.announce("堕羽斩！");
      } else battle.announce("没有目标可斩");
    },
  },
  dandy_pigeon: {
    onBattleStart(hero, battle) {
      battle.energyGainMul += 0.12;
    },
    ult(hero, battle) {
      for (const h of battle.heroes) {
        if (h.id === hero.id) continue;
        battle.grantEnergy(h, 40);
      }
      battle.announce("帅气加油：全队充能 +40");
    },
  },
  lark: {
    onBattleStart(hero, battle) {
      battle.comboWindow += 2;
    },
    ult(hero, battle) {
      battle.comboFreeze = 6;
      battle.healPlayer(0.08);
      battle.announce("云端凝滞：连击 6 秒不衰减");
    },
  },
  // —— 直殴 ——
  sun_bird: {
    modifyEgg(hero, egg) {
      egg.damageMul *= 1.25;
      egg.element = "fire";
    },
    onEnemyHit(hero, egg, enemy, battle) {
      battle.applyStatus(enemy, "burn", 2);
    },
    ult(hero, battle) {
      for (const en of battle.aliveEnemies()) {
        battle.damageEnemy(en, hero.atk * 2.4, { element: "fire", source: "ult" });
        battle.applyStatus(en, "burn", 3);
      }
      battle.shake(10);
      battle.announce("日轮爆焰！");
    },
  },
  mech_goose: {
    modifyEgg(hero, egg) {
      egg.r += 3;
      egg.restitution *= 0.92;
      egg.damageMul *= 1.1;
    },
    ult(hero, battle) {
      battle.buffNextShot({ radius: 16, pierce: 99, damageMul: 1.8, label: "重装碾压" });
      battle.announce("重装碾压：下一发破城蛋");
    },
  },
  drum_chick: {
    ult(hero, battle) {
      battle.teamAtkBuff = { mul: 1.4, turns: 2 };
      battle.announce("战鼓齐鸣：全队攻击 +40%（2 回合）");
    },
  },
  unlucky_duck: {
    modifyEgg(hero, egg) {
      egg.bounceScaling = 0.08;
    },
    ult(hero, battle) {
      const targets = battle.rng.shuffle(battle.aliveEnemies()).slice(0, 3);
      for (const en of targets) battle.damageEnemy(en, hero.atk * 4, { source: "ult" });
      battle.announce(`倒霉转运：${targets.length} 名倒霉蛋`);
    },
  },
  pep_chick: {
    extraEggs() {
      return 1;
    },
    ult(hero, battle) {
      battle.buffNextShot({ extraEggs: 2, label: "元气爆发" });
      battle.announce("元气爆发：下一发 3 连蛋");
    },
  },
  // —— 属性 ——
  thunder_chick: {
    modifyEgg(hero, egg) {
      egg.element = "thunder";
      egg.homing = 0.35;
    },
    onEnemyHit(hero, egg, enemy, battle) {
      battle.applyStatus(enemy, "shock", 2);
    },
    ult(hero, battle) {
      const list = battle.aliveEnemies();
      list.forEach((en, i) => {
        const mul = en.status.shock > 0 ? 1.5 : 1;
        battle.damageEnemy(en, hero.atk * 2.2 * mul, { element: "thunder", source: "ult" });
        battle.chain(en, i);
      });
      battle.announce("雷神审判！");
    },
  },
  hiphop_duck: {
    modifyEgg(hero, egg) {
      egg.element = "thunder";
    },
    onEnemyHit(hero, egg, enemy, battle) {
      battle.applyStatus(enemy, "shock", 1);
      const near = battle.nearestEnemies(enemy, 2, 190);
      for (const n of near) battle.applyStatus(n, "shock", 1);
    },
    ult(hero, battle) {
      for (const en of battle.aliveEnemies()) battle.applyStatus(en, "shock", 2);
      battle.announce("感电律动：全场带电");
    },
  },
  bird_of_paradise: {
    modifyEgg(hero, egg) {
      egg.element = "thunder";
    },
    onTurnEnd(hero, battle) {
      for (const en of battle.aliveEnemies()) {
        if (en.status.shock > 0) battle.damageEnemy(en, hero.atk * 0.8, { element: "thunder", source: "passive" });
      }
    },
    ult(hero, battle) {
      const shocked = battle.aliveEnemies().filter((e) => e.status.shock > 0);
      const targets = shocked.length ? shocked : battle.aliveEnemies();
      for (const en of targets) battle.damageEnemy(en, hero.atk * 5, { element: "thunder", source: "ult" });
      battle.shake(12);
      battle.announce("天堂雷雨！");
    },
  },
  ice_phoenix: {
    modifyEgg(hero, egg) {
      egg.element = "ice";
    },
    onEnemyHit(hero, egg, enemy, battle) {
      battle.applyStatus(enemy, "freeze", 1);
    },
    ult(hero, battle) {
      for (const en of battle.aliveEnemies()) {
        battle.damageEnemy(en, hero.atk * 3, { element: "ice", source: "ult" });
        battle.applyStatus(en, "freeze", 2);
      }
      battle.announce("冰凤暴雪！");
    },
  },
  emperor_penguin: {
    onBattleStart(hero, battle) {
      battle.freezeBonus += 1;
      battle.addIcePatch();
    },
    modifyEgg(hero, egg) {
      egg.element = "ice";
    },
    ult(hero, battle) {
      for (const en of battle.aliveEnemies()) {
        battle.applyStatus(en, "freeze", 2);
        en.armor = Math.max(0, en.armor - 6);
      }
      battle.announce("极地封锁：全体冻结破甲");
    },
  },
  // —— 碰撞 ——
  shark_eagle: {
    modifyEgg(hero, egg) {
      egg.growth = 1;
    },
    ult(hero, battle) {
      battle.buffNextShot({ growth: 2, damageMul: 1.2, label: "鲨齿撕咬" });
      battle.announce("鲨齿撕咬：越撞越大");
    },
  },
  deer_chick: {
    modifyEgg(hero, egg) {
      egg.splitBudget = 2;
    },
    onPegHit(hero, egg, peg, battle) {
      if (egg.splitBudget > 0 && battle.rng.chance(0.34)) {
        egg.splitBudget--;
        battle.spawnShards(egg, 1, { r: 8, damageMul: 0.5, speed: 360, spread: 2.2 });
      }
    },
    ult(hero, battle) {
      battle.buffNextShot({ splitOnHit: 3, label: "鹿角风暴" });
      battle.announce("鹿角风暴：命中三分裂");
    },
  },
  // —— 辅助 ——
  heal_duck: {
    onRecycle(hero, egg, battle) {
      if (egg.isMain) battle.healPlayer(0.04);
    },
    ult(hero, battle) {
      battle.healPlayer(0.25);
      battle.announce("蛋黄治愈：回复 25% 生命");
    },
  },
  guard_duck: {
    onBattleStart(hero, battle) {
      battle.shields += 1;
    },
    ult(hero, battle) {
      battle.shields += 2;
      battle.announce("铁壳护盾 +2");
    },
  },
  grace_goose: {
    onBattleStart(hero, battle) {
      battle.descendMul *= 0.6;
    },
    ult(hero, battle) {
      battle.skipDescend = true;
      for (const en of battle.aliveEnemies()) battle.applyStatus(en, "freeze", 1);
      battle.announce("优雅谢幕：敌人停步");
    },
  },
};

export function skillFor(id) {
  return SKILLS[id] ?? {};
}

export function hasUlt(id) {
  return typeof SKILLS[id]?.ult === "function";
}

export function callHook(hero, name, ...args) {
  const fn = SKILLS[hero?.id]?.[name];
  if (typeof fn !== "function") return undefined;
  try {
    return fn(hero, ...args);
  } catch (err) {
    console.warn(`[skills] ${hero?.id}.${name} 失败`, err);
    return undefined;
  }
}
