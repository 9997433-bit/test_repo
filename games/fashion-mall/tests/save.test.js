import { test } from "node:test";
import assert from "node:assert/strict";
import { exportSave, importSave, migrate } from "../src/core/save.js";
import { defaultState, grantGold, tryLevelUp } from "../src/core/state.js";

test("export/import roundtrip", () => {
  const s = defaultState();
  s.name = "澄澄";
  const json = exportSave(s);
  const back = importSave(json);
  assert.equal(back.name, "澄澄");
});

test("reject bad save", () => {
  assert.throws(() => importSave("{}"));
});

test("migrate v1 envelope", () => {
  const data = migrate({ v: 1, data: { name: "A" } });
  assert.equal(data.name, "A");
  assert.equal(migrate({ v: 2 }), null);
});

test("level up consumes gates", () => {
  const s = defaultState();
  grantGold(s, 800);
  s.goldEarned = 800;
  s.xp = 20;
  assert.equal(tryLevelUp(s), true);
  assert.equal(s.level, 2);
  assert.equal(s.shops.fresh.unlocked, true);
});
