import { test } from "node:test";
import assert from "node:assert/strict";
import {
  shopRate,
  offlineGold,
  partnerShopBonus,
  nextLevelReady,
  SHOPS,
} from "../src/data/balance.js";
import { charmOf, furnitureBonus, researchIncome, totalOnlinePerSec } from "../src/core/economy.js";
import { defaultState } from "../src/core/state.js";

test("shopRate grows with level and staff", () => {
  const shop = SHOPS[0];
  const a = shopRate(shop, 1, 0, 0, 0);
  const b = shopRate(shop, 3, 3, 0.6, 20);
  assert.ok(b > a * 2);
});

test("offline gold caps at 8 hours", () => {
  const eight = offlineGold(10, 8, 0);
  const twelve = offlineGold(10, 12, 0);
  assert.equal(eight, twelve);
  assert.ok(offlineGold(10, 1, 0.1) > offlineGold(10, 1, 0));
});

test("partner match beats mismatch", () => {
  assert.ok(partnerShopBonus("休闲", "休闲", 1) > partnerShopBonus("休闲", "丽人", 1));
});

test("level gate needs both gold and xp", () => {
  assert.equal(nextLevelReady(1, 800, 20), true);
  assert.equal(nextLevelReady(1, 799, 20), false);
  assert.equal(nextLevelReady(1, 800, 19), false);
});

test("charm sums outfit pieces", () => {
  assert.equal(charmOf({ hair: { charm: 8 }, top: { charm: 6 } }), 14);
});

test("default state online rate is positive", () => {
  const s = defaultState();
  s.shops.fastfood.auto = true;
  assert.ok(totalOnlinePerSec(s) > 0);
});

test("furniture and research helpers", () => {
  assert.ok(furnitureBonus(["sofa", "garden"]) > 0.15);
  assert.ok(researchIncome(["line-a"]) === 8);
});
