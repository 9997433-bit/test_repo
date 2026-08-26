import { test } from "node:test";
import assert from "node:assert/strict";
import { FURNITURE, SHOPS, furnitureCost as balanceFurnitureCost } from "../src/data/balance.js";
import { HUD, FAIL } from "../src/data/copy.js";
import { defaultState } from "../src/core/state.js";
import * as actions from "../src/core/actions.js";

test("furniture purchases use the shared furnitureCost curve", () => {
  for (const item of FURNITURE) {
    const cost = balanceFurnitureCost(item);
    assert.equal(actions.furnitureCost(item), cost, `${item.id} 的动作层价格必须来自 balance`);

    const short = defaultState();
    short.gold = cost - 1;
    assert.equal(actions.buyFurniture(short, item.id).reason, "insufficient-gold");
    assert.equal(short.gold, cost - 1, `${item.id} 差一金时不得扣款`);
    assert.deepEqual(short.furniture, [], `${item.id} 差一金时不得入库`);

    const exact = defaultState();
    exact.gold = cost;
    assert.equal(actions.buyFurniture(exact, item.id).ok, true);
    assert.equal(exact.gold, 0, `${item.id} 应按共享曲线精确扣款`);
    assert.deepEqual(exact.furniture, [item.id]);
  }
});

test("SHOPS and minigame view exports stay one-to-one", async () => {
  const aggregate = await import("../src/minigames/index.js");
  const registered = [];

  for (const shop of SHOPS) {
    const view = await import(`../src/minigames/${shop.id}.js`);
    const renderNames = Object.keys(view).filter(
      (name) => name.startsWith("render") && typeof view[name] === "function",
    );
    assert.equal(renderNames.length, 1, `${shop.id}.js 必须且只能导出一个 render 视图`);

    const [renderName] = renderNames;
    registered.push(renderName);
    assert.equal(aggregate[renderName], view[renderName], `${shop.id} 视图必须由 minigames/index.js 原样导出`);
  }

  const aggregateViews = Object.keys(aggregate).filter(
    (name) => name.startsWith("render") && typeof aggregate[name] === "function",
  );
  assert.deepEqual(aggregateViews.sort(), registered.sort(), "聚合出口不得漏店或带入无对应店铺的视图");
});

test("copy registries expose the required HUD and failure keys", () => {
  const required = {
    HUD: ["gold", "rate", "xp", "charm", "level", "offline", "perSec"],
    FAIL: [
      "insufficient-gold",
      "insufficient-shards",
      "slots-full",
      "locked",
      "owned",
      "not-owned",
      "empty-name",
      "invalid-save",
      "bad-cost",
    ],
  };

  for (const [registryName, keys] of Object.entries(required)) {
    const registry = registryName === "HUD" ? HUD : FAIL;
    for (const key of keys) {
      assert.equal(typeof registry[key], "string", `${registryName}.${key} 必须存在且为字符串`);
      assert.ok(registry[key].trim(), `${registryName}.${key} 不得为空`);
    }
  }
});
