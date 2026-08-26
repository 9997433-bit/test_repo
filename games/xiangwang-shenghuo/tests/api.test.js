import { describe, expect, it } from "vitest";
import * as farm from "../src/systems/farm/index.js";
import * as production from "../src/systems/production/index.js";
import * as village from "../src/systems/village/index.js";

const publicApis = [
  [
    "farm",
    farm,
    ["till", "plant", "harvest", "expandPlot", "tickPlots", "seasonFactor"],
  ],
  [
    "production",
    production,
    [
      "enqueueJob",
      "collectJob",
      "feedAnimal",
      "unlockSlot",
      "tickProduction",
      "canCraft",
    ],
  ],
  [
    "village",
    village,
    [
      "acceptWish",
      "deliverWish",
      "refreshWishes",
      "inviteGuest",
      "cook",
      "build",
      "petPlay",
      "stallSell",
      "tickVillage",
    ],
  ],
];

describe.each(publicApis)("%s public API", (_systemName, api, functionNames) => {
  it.each(functionNames)("exports %s as a function", (functionName) => {
    expect(api[functionName], `${functionName} must remain publicly exported`).toBeTypeOf(
      "function",
    );
  });
});
