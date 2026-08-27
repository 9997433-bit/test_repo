// 存档兼容。skinId / lookMode 都是 v1 的新增字段：老档没有也要能读，不清档、不升版本。

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_SKIN_ID } from "./skins.js";
import { DEFAULT_LOOK_MODE } from "./look.js";

function fakeStorage(seed) {
  const map = new Map(seed ? [[
    "yizhang-save-v1",
    typeof seed === "string" ? seed : JSON.stringify(seed),
  ]] : []);
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    raw: map,
  };
}

async function freshStorageModule(seed) {
  globalThis.localStorage = fakeStorage(seed);
  vi.resetModules();
  return import("./storage.js");
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  delete globalThis.localStorage;
});

describe("loadSave", () => {
  it("空档给默认皮肤", async () => {
    const { loadSave } = await freshStorageModule(null);
    expect(loadSave().skinId).toBe(DEFAULT_SKIN_ID);
  });

  it("老档（v1 首发，没有 skinId）照读，补默认皮肤且不动其它字段", async () => {
    const legacy = {
      version: 1,
      unlocked: ["cotton", "granite"],
      loadout: { main: "granite", off: "cotton" },
      quality: "low",
      muted: true,
      stats: { matches: 3, kills: 9, deaths: 4, wins: 1, bestKills: 5 },
    };
    const { loadSave } = await freshStorageModule(legacy);
    const save = loadSave();
    expect(save.skinId).toBe(DEFAULT_SKIN_ID);
    expect(save.unlocked).toEqual(["cotton", "granite"]);
    expect(save.loadout).toEqual({ main: "granite", off: "cotton" });
    expect(save.quality).toBe("low");
    expect(save.stats.kills).toBe(9);
    expect(save.version).toBe(1);
  });

  it("存过皮肤的档原样读回来", async () => {
    const { loadSave } = await freshStorageModule({ version: 1, skinId: "dusk" });
    expect(loadSave().skinId).toBe("dusk");
  });

  it("skinId 被写坏（空串 / 非字符串）时落回默认", async () => {
    const { loadSave } = await freshStorageModule({ version: 1, skinId: "   " });
    expect(loadSave().skinId).toBe(DEFAULT_SKIN_ID);
  });
});

describe("loadSave 的 lookMode 向后兼容", () => {
  it("空档缺省 locked（固定人物视角是产品缺省）", async () => {
    const { loadSave } = await freshStorageModule(null);
    expect(DEFAULT_LOOK_MODE).toBe("locked");
    expect(loadSave().lookMode).toBe("locked");
  });

  it("老档（视角轮之前，没有 lookMode）照读，补 locked 且不动其它字段", async () => {
    const legacy = {
      version: 1,
      unlocked: ["cotton", "gale"],
      loadout: { main: "gale", off: "cotton" },
      skinId: "crane",
      lookSensitivity: 1.4,
    };
    const { loadSave } = await freshStorageModule(legacy);
    const save = loadSave();
    expect(save.lookMode).toBe("locked");
    expect(save.unlocked).toEqual(["cotton", "gale"]);
    expect(save.loadout).toEqual({ main: "gale", off: "cotton" });
    expect(save.skinId).toBe("crane");
    expect(save.lookSensitivity).toBe(1.4);
  });

  it("存过 free 的档原样读回来", async () => {
    const { loadSave } = await freshStorageModule({ version: 1, lookMode: "free" });
    expect(loadSave().lookMode).toBe("free");
  });

  it("lookMode 被写坏（未知词 / 非字符串）时落回 locked", async () => {
    const junk = await freshStorageModule({ version: 1, lookMode: "orbit" });
    expect(junk.loadSave().lookMode).toBe("locked");
    const numeric = await freshStorageModule({ version: 1, lookMode: 3 });
    expect(numeric.loadSave().lookMode).toBe("locked");
  });

  it("切到 free 会落盘，重读回来还是 free，且不碰 loadout", async () => {
    const { loadSave, updateSave } = await freshStorageModule({
      version: 1,
      loadout: { main: "frost", off: "spring" },
    });
    const next = updateSave({ lookMode: "free" });
    expect(next.lookMode).toBe("free");
    expect(next.loadout).toEqual({ main: "frost", off: "spring" });
    expect(JSON.parse(globalThis.localStorage.getItem("yizhang-save-v1")).lookMode).toBe("free");
    expect(loadSave().lookMode).toBe("free");
  });
});

describe("updateSave", () => {
  it("换皮肤会落盘，且不碰 loadout", async () => {
    const { loadSave, updateSave } = await freshStorageModule({
      version: 1,
      loadout: { main: "gale", off: "frost" },
    });
    const next = updateSave({ skinId: "kiln" });
    expect(next.skinId).toBe("kiln");
    expect(next.loadout).toEqual({ main: "gale", off: "frost" });
    expect(JSON.parse(globalThis.localStorage.getItem("yizhang-save-v1")).skinId).toBe("kiln");
    expect(loadSave().skinId).toBe("kiln");
  });
});
