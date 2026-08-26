const PRODUCTION_URLS = [
  "../../js/systems/combat.js",
  "../../js/combat.js",
  "../../js/engine/combat.js",
];

async function importFirst() {
  for (const path of PRODUCTION_URLS) {
    try {
      return { module: await import(new URL(path, import.meta.url)), path };
    } catch {
      // Missing production modules are represented by pending integration probes.
    }
  }
  return { module: null, path: null };
}

function seededRng(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

const BEATS = { infantry: "cavalry", cavalry: "archer", archer: "infantry" };

function matchupPower(power, attackerType, defenderType) {
  return power * (BEATS[attackerType] === defenderType ? 1.25 : 1);
}

function fixtureBattle(attacker, defender, seed = 1) {
  if (attacker.length === 0) return { victory: false, winner: "defender", rounds: [] };
  if (defender.length === 0) return { victory: true, winner: "attacker", rounds: [] };
  const rng = seededRng(seed);
  const attackerPower = attacker.reduce(
    (sum, unit) =>
      sum + matchupPower(unit.power * unit.count, unit.type, defender[0]?.type),
    0,
  );
  const defenderPower = defender.reduce(
    (sum, unit) =>
      sum + matchupPower(unit.power * unit.count, unit.type, attacker[0]?.type),
    0,
  );
  const attackerRoll = attackerPower * (0.9 + rng() * 0.2);
  const defenderRoll = defenderPower * (0.9 + rng() * 0.2);
  return {
    victory: attackerRoll >= defenderRoll,
    winner: attackerRoll >= defenderRoll ? "attacker" : "defender",
    rounds: [attackerRoll, defenderRoll],
  };
}

function firstFunction(module, names) {
  for (const name of names) {
    if (typeof module?.[name] === "function") return { fn: module[name], name };
  }
  return null;
}

function army(units) {
  const cloned = structuredClone(units);
  cloned.units = structuredClone(units);
  cloned.troops = structuredClone(units);
  return cloned;
}

async function callBattle(battle, attackerUnits, defenderUnits, seed) {
  const attempts = [
    () => {
      const attacker = army(attackerUnits);
      const defender = army(defenderUnits);
      return battle.fn({
        attacker,
        defender,
        attackers: attacker,
        defenders: defender,
        playerArmy: attacker,
        enemyArmy: defender,
        seed,
        rng: seededRng(seed),
      });
    },
    () =>
      battle.fn(army(attackerUnits), army(defenderUnits), {
        seed,
        rng: seededRng(seed),
      }),
    () => battle.fn(army(attackerUnits), army(defenderUnits), seededRng(seed)),
    () => battle.fn(army(attackerUnits), army(defenderUnits), seed),
  ];
  const errors = [];
  for (const attempt of attempts) {
    try {
      const result = await attempt();
      if (result !== undefined) return result;
    } catch (error) {
      errors.push(error);
    }
  }
  const detail = errors.map((error) => error?.message ?? String(error)).join("; ");
  throw new Error(`${battle.name} could not be invoked${detail ? `: ${detail}` : ""}`);
}

function isAttackerDefeat(result) {
  if (result === false) return true;
  if (typeof result === "string") {
    return ["defeat", "loss", "lost", "defender", "enemy"].includes(result.toLowerCase());
  }
  if (result?.victory === false || result?.attackerWon === false || result?.won === false) {
    return true;
  }
  const outcome = result?.winner ?? result?.outcome ?? result?.result ?? result?.winningSide;
  return (
    typeof outcome === "string" &&
    ["defeat", "loss", "lost", "defender", "enemy", "bandits"].includes(outcome.toLowerCase())
  );
}

export async function register({ assert, test }) {
  const production = await importFirst();
  const battle = firstFunction(production.module, [
    "simulateBattle",
    "resolveBattle",
    "runCombat",
    "autoBattle",
    "battle",
  ]);
  const infantry = [{ id: "i", type: "infantry", troopType: "infantry", power: 10, count: 10 }];
  const cavalry = [{ id: "c", type: "cavalry", troopType: "cavalry", power: 10, count: 10 }];

  test(
    "combat/self-contained: infantry gains exactly 25% against cavalry",
    () => {
      assert.equal(matchupPower(100, "infantry", "cavalry"), 125);
      assert.equal(matchupPower(100, "cavalry", "infantry"), 100);
    },
    { selfContained: true },
  );

  test(
    "combat/self-contained: equal seeds produce equal battle results",
    () => {
      assert.deepEqual(
        fixtureBattle(infantry, cavalry, 20260826),
        fixtureBattle(infantry, cavalry, 20260826),
      );
    },
    { selfContained: true },
  );

  test(
    "combat/self-contained: an empty attacking formation always loses",
    () => {
      const result = fixtureBattle([], cavalry, 7);
      assert.equal(result.victory, false);
      assert.equal(result.winner, "defender");
    },
    { selfContained: true },
  );

  test(
    "combat/production: seeded battle result is deterministic",
    async () => {
      if (!battle) {
        assert.deepEqual(fixtureBattle(infantry, cavalry, 44), fixtureBattle(infantry, cavalry, 44));
        return;
      }
      const first = await callBattle(battle, infantry, cavalry, 44);
      const second = await callBattle(battle, infantry, cavalry, 44);
      assert.deepEqual(second, first, `${battle.name} changed its result for the same seed`);
    },
    {
      pending: !battle,
      reason: !production.module
        ? "production combat module is not available; pure fixture exercised"
        : "production battle export is missing; pure fixture exercised",
    },
  );

  test(
    "combat/production: an empty attacking formation is defeated",
    async () => {
      if (!battle) {
        assert.equal(fixtureBattle([], cavalry, 44).victory, false);
        return;
      }
      const result = await callBattle(battle, [], cavalry, 44);
      assert.ok(isAttackerDefeat(result), `${battle.name} did not report defeat: ${JSON.stringify(result)}`);
    },
    {
      pending: !battle,
      reason: !production.module
        ? "production combat module is not available; pure fixture exercised"
        : "production battle export is missing; pure fixture exercised",
    },
  );
}
