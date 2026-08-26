import { test } from "node:test";
import assert from "node:assert/strict";
import {
  shopRate,
  offlineGold,
  partnerShopBonus,
  nextLevelReady,
  SHOPS,
  MINIGAME_PAYOUTS,
  fastfoodTip,
  freshPayout,
  boutiquePayout,
  blindboxRoll,
  fortuneSpin,
  paidGameExpectation,
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

test("paid RNG games have negative gold expectation and carry shards", () => {
  for (const id of ["blindbox", "fortune"]) {
    const ev = paidGameExpectation(id);
    assert.ok(ev.gold < ev.cost * 0.85, `${id} RTP 必须 ≤ 85%，实际期望 ${ev.gold}/${ev.cost}`);
    assert.ok(ev.netGold < 0, `${id} 净期望必须为负`);
    assert.ok(ev.shard > 0, `${id} 必须产出碎片期望`);
  }
});

test("blindbox pool weights are complete and roll is deterministic on boundaries", () => {
  const { pool } = MINIGAME_PAYOUTS.blindbox;
  assert.equal(pool.reduce((s, p) => s + p.w, 0), 100);
  assert.equal(blindboxRoll(0).id, "common");
  assert.equal(blindboxRoll(0.5499).id, "common");
  assert.equal(blindboxRoll(0.55).id, "rare");
  assert.equal(blindboxRoll(0.85).id, "hidden");
  assert.equal(blindboxRoll(0.97).id, "sign");
  assert.equal(blindboxRoll(0.9999).id, "sign");
});

test("fortune spin maps rand to slot table uniformly", () => {
  const { slots } = MINIGAME_PAYOUTS.fortune;
  assert.equal(fortuneSpin(0).id, slots[0].id);
  assert.equal(fortuneSpin(0.9999).id, slots[slots.length - 1].id);
  const shardSlots = slots.filter((s) => s.shard > 0);
  assert.ok(shardSlots.length >= 1);
});

test("skill minigame payouts are positive and monotone in score", () => {
  assert.ok(fastfoodTip(4).gold > fastfoodTip(2).gold);
  assert.ok(fastfoodTip(2).xp > 0);
  assert.equal(freshPayout(0).gold, 0);
  assert.equal(freshPayout(0).xp, 0);
  assert.ok(freshPayout(9).gold > freshPayout(3).gold);
  assert.ok(boutiquePayout(6).gold > boutiquePayout(0).gold);
  assert.ok(boutiquePayout(6).xp > boutiquePayout(0).xp);
});
