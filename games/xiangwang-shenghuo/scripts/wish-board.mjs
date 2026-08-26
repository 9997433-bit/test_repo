import { createInitialState } from "../src/core/engine.js";
import { WISH_POOL } from "../src/data/wishes.js";

const village = await import("../src/systems/village/index.js");
const REFRESHES = 20;
const LEVEL = 1;

if (typeof village.refreshWishes !== "function") {
  console.log(
    JSON.stringify(
      {
        ok: true,
        skipped: true,
        reason: "optional export village.refreshWishes is unavailable",
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const definitions = new Map(WISH_POOL.map((wish) => [wish.id, wish]));
const seenIds = new Set();
let slotsSeen = 0;
let state = createInitialState();

for (let index = 0; index < REFRESHES; index += 1) {
  state = {
    ...state,
    meta: { ...state.meta, day: index + 1, level: LEVEL },
    wishes: [],
  };
  state = village.refreshWishes(state, index + 1);
  for (const wish of state.wishes || []) {
    slotsSeen += 1;
    seenIds.add(wish.id);
  }
}

const uniqueIds = [...seenIds];
const unaffordableIds = uniqueIds.filter(
  (id) => (definitions.get(id)?.minLevel ?? LEVEL) > LEVEL,
);

console.log(
  JSON.stringify(
    {
      ok: true,
      skipped: false,
      level: LEVEL,
      refreshes: REFRESHES,
      slotsSeen,
      uniqueIdCount: uniqueIds.length,
      uniqueIds,
      unaffordableAtLv1Appear: unaffordableIds.length > 0,
      unaffordableAtLv1Count: unaffordableIds.length,
      unaffordableAtLv1Ids: unaffordableIds,
    },
    null,
    2,
  ),
);
