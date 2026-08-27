import { describe, expect, it } from "vitest";

import { adaptView, createRoster } from "./view.js";
import {
  DEFAULT_SKIN_ID,
  FALLBACK_SKINS,
  assignSkins,
  normalizeSkinId,
  resolveSkins,
} from "./skins.js";

const ROSTER_VIEW = {
  players: [
    { id: "p0", kind: "human" },
    { id: "b0", kind: "bot", persona: "brute" },
    { id: "b1", kind: "bot", persona: "fox" },
    { id: "b2", kind: "bot", persona: "bully" },
  ],
};

describe("皮肤表", () => {
  it("兜底表至少 6 套，且 id 唯一、默认皮肤在表里", () => {
    expect(FALLBACK_SKINS.length).toBeGreaterThanOrEqual(6);
    expect(new Set(FALLBACK_SKINS.map((s) => s.id)).size).toBe(FALLBACK_SKINS.length);
    expect(FALLBACK_SKINS.some((s) => s.id === DEFAULT_SKIN_ID)).toBe(true);
  });

  it("每套皮肤都有可辨认的剪影比例与配色（不是同一个胶囊）", () => {
    const signatures = new Set();
    for (const s of FALLBACK_SKINS) {
      expect(s.cloth).toMatch(/^#[0-9a-f]{6}$/i);
      expect(s.trim).toMatch(/^#[0-9a-f]{6}$/i);
      expect(s.accent).toMatch(/^#[0-9a-f]{6}$/i);
      signatures.add(`${s.build.height}|${s.build.mass}|${s.build.shoulder}|${s.cloth}|${s.accessory}`);
    }
    expect(signatures.size).toBe(FALLBACK_SKINS.length);
  });

  it("data 没给 SKINS 就用兜底表，给了就用真表", () => {
    const fallback = resolveSkins(null);
    expect(fallback.source).toBe("fallback");
    expect(fallback.defaultId).toBe(DEFAULT_SKIN_ID);

    const real = resolveSkins({
      SKINS: [{ id: "stone", name: "石" }, { id: "silk", name: "绢" }],
      DEFAULT_SKIN_ID: "silk",
    });
    expect(real.source).toBe("data");
    expect(real.defaultId).toBe("silk");
    expect(real.byId.stone.name).toBe("石");
  });

  it("认不出的 skinId 一律落回默认皮肤", () => {
    const table = resolveSkins(null);
    expect(normalizeSkinId("reed", table)).toBe("reed");
    expect(normalizeSkinId("不存在的皮肤", table)).toBe(DEFAULT_SKIN_ID);
    expect(normalizeSkinId(undefined, table)).toBe(DEFAULT_SKIN_ID);
    expect(normalizeSkinId("", table)).toBe(DEFAULT_SKIN_ID);
  });
});

describe("assignSkins", () => {
  it("本人用选的那套，bot 各不相同也不撞本人", () => {
    const table = resolveSkins(null);
    const map = assignSkins(ROSTER_VIEW.players, { selfId: "p0", selfSkinId: "mica", table });
    expect(map.get("p0")).toBe("mica");
    const bots = ["b0", "b1", "b2"].map((id) => map.get(id));
    expect(new Set(bots).size).toBe(3);
    expect(bots).not.toContain("mica");
  });

  it("同一份名单结果稳定（无随机）", () => {
    const table = resolveSkins(null);
    const a = assignSkins(ROSTER_VIEW.players, { selfId: "p0", selfSkinId: "ash", table });
    const b = assignSkins(ROSTER_VIEW.players, { selfId: "p0", selfSkinId: "ash", table });
    for (const id of ["p0", "b0", "b1", "b2"]) expect(a.get(id)).toBe(b.get(id));
  });

  it("persona / sim 已声明的皮肤优先", () => {
    const table = resolveSkins(null);
    const map = assignSkins(ROSTER_VIEW.players, {
      selfId: "p0",
      selfSkinId: "ash",
      table,
      personaById: { brute: { skinId: "kiln" } },
    });
    expect(map.get("b0")).toBe("kiln");

    const declared = assignSkins([{ id: "b9", kind: "bot", skinId: "dusk" }], { selfId: "p0", table });
    expect(declared.get("b9")).toBe("dusk");
  });

  it("皮肤比人少也不会漏人", () => {
    const table = resolveSkins({ SKINS: [{ id: "one" }, { id: "two" }], DEFAULT_SKIN_ID: "one" });
    const map = assignSkins(ROSTER_VIEW.players, { selfId: "p0", selfSkinId: "one", table });
    expect(map.size).toBe(4);
    for (const id of ["p0", "b0", "b1", "b2"]) expect(table.byId[map.get(id)]).toBeTruthy();
  });
});

describe("view 层接线", () => {
  it("roster 记住每个人的皮肤，adaptView 透出 player.skinId", () => {
    const table = resolveSkins(null);
    const roster = createRoster(ROSTER_VIEW, { selfId: "p0", skinTable: table, skinId: "reed" });
    expect(roster.get("p0").skinId).toBe("reed");

    const view = adaptView(ROSTER_VIEW, { selfId: "p0", roster, skinTable: table });
    const skins = view.players.map((p) => p.skinId);
    expect(skins[0]).toBe("reed");
    expect(new Set(skins).size).toBe(4);
    for (const id of skins) expect(table.byId[id]).toBeTruthy();
  });

  it("sim 自报的 skinId 说了算，壳层不覆盖", () => {
    const table = resolveSkins(null);
    const raw = { players: [{ id: "p0", kind: "human", skinId: "brine" }] };
    const roster = createRoster(raw, { selfId: "p0", skinTable: table, skinId: "ash" });
    const view = adaptView(raw, { selfId: "p0", roster, skinTable: table });
    expect(view.players[0].skinId).toBe("brine");
  });
});
