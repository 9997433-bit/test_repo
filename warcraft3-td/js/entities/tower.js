/* Tower entity: acquisition, firing, upgrading, selling. DOM-free. */
(function (root) {
  'use strict';
  const NS = (root.WC3TD = root.WC3TD || {});

  let NEXT_ID = 1;

  function Tower(game, defId, tileX, tileY) {
    this.id = NEXT_ID++;
    this.game = game;
    this.def = NS.TowerData.get(defId);
    this.tileX = tileX; this.tileY = tileY;
    this.x = tileX + 0.5; this.y = tileY + 0.5;
    this.cooldown = 0.35;
    this.targetMode = 'first';
    this.kills = 0;
    this.damageDealt = 0;
    this.shots = 0;
    this.angle = 0;
    this.buildAnim = 1;
    this.recoil = 0;
    this.investedGold = this.def.investedGold;
    this.investedLumber = this.def.investedLumber;
    this.auraDamageMul = 1;
  }

  Tower.prototype.range = function () { return this.def.range; };

  Tower.prototype.sellValue = function () {
    return Math.floor(this.investedGold * NS.Config.sellRatio);
  };

  Tower.prototype.canUpgrade = function () { return !!this.def.next; };

  Tower.prototype.upgradeDef = function () {
    return this.def.next ? NS.TowerData.get(this.def.next) : null;
  };

  Tower.prototype.upgrade = function () {
    const next = this.upgradeDef();
    if (!next) return false;
    this.def = next;
    this.investedGold = next.investedGold;
    this.investedLumber = next.investedLumber;
    this.buildAnim = 1;
    this.cooldown = Math.min(this.cooldown, next.cooldown);
    return true;
  };

  Tower.prototype.update = function (dt) {
    if (this.buildAnim > 0) this.buildAnim = Math.max(0, this.buildAnim - dt * 1.6);
    if (this.recoil > 0) this.recoil = Math.max(0, this.recoil - dt * 5);
    this.cooldown -= dt;
    if (this.cooldown > 0) return;

    const def = this.def;
    const pool = this.game.creepHash.query(this.x, this.y, def.range);
    const targets = NS.Combat.selectTargets(this, def, pool, def.multishot, this.targetMode);
    if (!targets.length) { this.cooldown = 0; return; }

    this.cooldown = def.cooldown;
    this.recoil = 1;
    this.shots++;
    this.angle = Math.atan2(targets[0].y - this.y, targets[0].x - this.x);
    for (let i = 0; i < targets.length; i++) this.fireAt(targets[i]);
    this.game.audio.shoot(def);
  };

  Tower.prototype.fireAt = function (creep) {
    const def = this.def;
    const game = this.game;
    const base = NS.Combat.rollDamage(def, game.rng) * (this.auraDamageMul || 1);
    let critMult = 1;
    if (def.crit && game.rng.chance(def.crit.chance)) critMult = def.crit.mult;

    const speed = def.projectile.speed;
    const lead = NS.Combat.leadTarget(this, creep, speed);
    game.spawnProjectile({
      tower: this, def: def, target: def.projectile.arc ? creep : creep,
      base: base, critMult: critMult, speed: speed,
      kind: def.projectile.kind, color: def.projectile.color, arc: def.projectile.arc || 0,
      x: this.x, y: this.y, z: 1.0,
      aimX: lead.x, aimY: lead.y, aimZ: creep.z
    });
    game.fx.muzzle(this.x, this.y, 1.0, this.angle, def.projectile.color);
  };

  /** Live DPS estimate against a specific creep, used by the stat panel. */
  Tower.prototype.dpsVersus = function (creep) {
    const def = this.def;
    if (!creep) return def.dps;
    const res = NS.DamageTable.resolve({
      base: def.avgDamage,
      attackType: def.attackType,
      armorType: creep.armorType,
      armorValue: creep.effectiveArmor(),
      bonusVsArmor: def.bonusVsArmor
    });
    const critBonus = def.crit ? (1 + def.crit.chance * (def.crit.mult - 1)) : 1;
    return res.amount / def.cooldown * critBonus * def.multishot;
  };

  NS.Tower = Tower;
})(typeof globalThis !== 'undefined' ? globalThis : this);
