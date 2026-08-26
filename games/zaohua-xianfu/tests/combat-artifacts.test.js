import { describe, expect, it } from "vitest";
import { applyTriggers, artifactLoadout } from "../src/combat/artifacts.js";
import { simulate } from "../src/combat/battle.js";
import { towerEnemy } from "../src/data/enemies.js";

const WEAK = { realm: { index: 0, layer: 1 }, buildings: [] };
const STRONG = { realm: { index: 7, layer: 9 }, buildings: [] };

function logEntries(result, type) {
  return result.frames.flatMap((frame) => frame.log.filter((entry) => entry.t === type));
}

function fired(result, id) {
  return result.artifacts.find((row) => row.id === id) ?? null;
}

describe("combat artifacts", () => {
  it("revives once per battle, not once per ally", () => {
    const result = simulate({
      seed: 991,
      heroIds: ["mc-demon", "wukong", "bajie", "shen", "yumian", "niumo"],
      foes: towerEnemy(24).foes,
      state: WEAK,
      equipped: ["wanhun"],
      maxTicks: 240,
    });

    const last = result.frames.at(-1).units;
    const dead = last.filter((u) => u.side === "a" && !u.alive);

    expect(result.winner).toBe("b");
    expect(dead.length).toBeGreaterThan(1);
    expect(last.filter((u) => u.revived).map((u) => u.id)).toEqual(["wukong"]);
    expect(logEntries(result, "revive")).toEqual([{ t: "revive", target: "wukong", by: "wanhun" }]);
    expect(fired(result, "wanhun")).toEqual({ id: "wanhun", name: "万魂灯", kind: "revive", count: 1 });
  });

  it("honours an explicit reviveCharges field over the single-charge default", () => {
    expect(artifactLoadout(["wanhun"]).revive).toMatchObject({ id: "wanhun", hpPct: 0.33, charges: 1 });
    expect(artifactLoadout([]).revive).toBeNull();
  });

  it("keeps 七星灯 mitigation and 镇岳钟 execution on the wire", () => {
    const guarded = simulate({
      seed: 4242,
      heroIds: ["mc-mortal", "cihang", "houyi"],
      foes: towerEnemy(18).foes,
      state: WEAK,
      equipped: ["qixing"],
      maxTicks: 240,
    });
    expect(fired(guarded, "qixing")?.kind).toBe("guard");
    expect(fired(guarded, "qixing").count).toBeGreaterThan(0);

    const executed = simulate({
      seed: 7,
      heroIds: ["mc-mortal"],
      foes: [{ id: "boss", name: "残血章主", faction: "demon", role: "tank", atk: 1, hp: 300, def: 0, boss: true }],
      state: WEAK,
      equipped: ["zhenyue"],
      maxTicks: 240,
    });
    expect(executed.winner).toBe("a");
    expect(logEntries(executed, "execute")).toEqual([{ t: "execute", target: "boss", by: "zhenyue" }]);
  });

  it("reports only the artifact the loadout actually resolved for a contested slot", () => {
    const loadout = artifactLoadout(["qixing", "xuangui", "wanhun"]);

    expect(loadout.guard.id).toBe("qixing");
    expect(applyTriggers({ loadout }, { kind: "guard" }).map((note) => note.id)).toEqual(["qixing"]);
    expect(applyTriggers({ loadout }, { kind: "revive" }).map((note) => note.id)).toEqual(["wanhun"]);
    expect(applyTriggers({ loadout }, { kind: "burn" })).toEqual([]);
    expect(applyTriggers({ equipped: ["yaoguang", "dinghai"] }, { kind: "shield" }).map((n) => n.id)).toEqual([
      "yaoguang",
      "dinghai",
    ]);
  });

  it("summarises fired artifacts deterministically alongside the transcript", () => {
    const input = {
      seed: 20260826,
      heroIds: ["mc-divine", "nezha", "nvwa", "yangjian", "zhenwu", "xuannv"],
      foes: towerEnemy(37).foes,
      state: STRONG,
      equipped: ["qixing", "wanhun", "lundao", "zhuque"],
      maxTicks: 240,
    };

    const first = simulate(input);
    const casualties = first.frames.at(-1).units.filter((u) => u.side === "a" && !u.alive);

    expect(simulate(input)).toEqual(first);
    expect(first.artifacts.map((row) => `${row.id}:${row.kind}`)).toEqual([
      "lundao:passive",
      "zhuque:skillMul",
      "qixing:guard",
      "wanhun:revive",
    ]);
    expect(casualties.length).toBeGreaterThan(1);
    expect(fired(first, "wanhun").count).toBe(1);
    expect(fired(first, "qixing").count).toBeGreaterThan(1);
  });
});
