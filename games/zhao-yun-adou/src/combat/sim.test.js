import { describe, expect, it } from "vitest";
import { cellDistToPath } from "../board/grid.js";
import { waveSpec } from "../data/waves.js";
import {
  checkWinner,
  enqueueWave,
  maybeAdvanceWave,
  spawnEnemy,
  tickSideCombat,
} from "./sim.js";
import { collect, makeArena, makeEnemy, makeSide, putUnit } from "./testkit.js";

describe("range vs lane progress", () => {
  it("only hits enemies whose path progress is inside the cell's cover", () => {
    const mid = makeSide();
    putUnit(mid, 9, { id: "dao" });
    const far = makeEnemy({ t: 0.75 });
    mid.enemies.push(far);
    tickSideCombat(mid, 0.05, collect());
    expect(far.hp).toBe(100);

    const tail = makeSide();
    putUnit(tail, 5, { id: "dao" });
    const same = makeEnemy({ t: 0.75 });
    tail.enemies.push(same);
    tickSideCombat(tail, 0.05, collect());
    expect(same.hp).toBeLessThan(100);

    // 两格的旧「边缘距离」完全相同，说明差异来自路线进度而非边距。
    expect(cellDistToPath(9)).toBe(cellDistToPath(5));
  });

  it("lets the same cell reach an enemy once it walks into cover", () => {
    const side = makeSide();
    putUnit(side, 9, { id: "gong" });
    const e = makeEnemy({ t: 0.8 });
    side.enemies.push(e);
    tickSideCombat(side, 0.05, collect());
    expect(e.hp).toBe(100);
    e.t = 0.35;
    tickSideCombat(side, 0.05, collect());
    expect(e.hp).toBeLessThan(100);
  });

  it("longer range covers strictly more of the lane than melee", () => {
    const positions = [0.05, 0.25, 0.45, 0.65, 0.85];
    const hitsFor = (id) =>
      positions.filter((t) => {
        const side = makeSide();
        putUnit(side, 9, { id });
        const e = makeEnemy({ t });
        side.enemies.push(e);
        tickSideCombat(side, 0.05, collect());
        return e.hp < 100;
      }).length;
    expect(hitsFor("gong")).toBeGreaterThan(hitsFor("dao"));
  });

  it("pierce still splashes, but only inside cover", () => {
    const side = makeSide();
    putUnit(side, 9, { id: "qiang" });
    const a = makeEnemy({ t: 0.3 });
    const b = makeEnemy({ t: 0.4 });
    const outside = makeEnemy({ t: 0.9 });
    side.enemies.push(a, b, outside);
    tickSideCombat(side, 0.05, collect());
    expect(a.hp).toBeLessThan(100);
    expect(b.hp).toBeLessThan(100);
    expect(outside.hp).toBe(100);
  });
});

describe("towers and heroes", () => {
  it("ticks hero skill cooldown even with nothing in range", () => {
    const side = makeSide();
    const hero = putUnit(side, 9, { kind: "hero", id: "zhaoyun", cooldown: 5 });
    side.enemies.push(makeEnemy({ t: 0.9 }));
    tickSideCombat(side, 1, collect());
    expect(hero.cooldown).toBeCloseTo(4, 5);
  });

  it("emits a skill event carrying the juice contract", () => {
    const side = makeSide();
    putUnit(side, 9, { kind: "hero", id: "huangzhong", cooldown: 0 });
    side.enemies.push(makeEnemy({ t: 0.35, hp: 500, maxHp: 500 }));
    const emit = collect();
    tickSideCombat(side, 0.05, emit);
    const [evt] = emit.of("skill");
    expect(evt.payload.hero).toBe("黄忠");
    expect(evt.payload.skill).toBe("百步穿杨");
    expect(evt.payload.fx).toBe("arrow-rain");
    expect(evt.payload.juice.shape).toBe("rain");
    expect(evt.payload.targets.length).toBe(1);
    expect(evt.payload.cellIndex).toBe(9);
  });

  it("does not bank unlimited attacks while idle", () => {
    const side = makeSide();
    const unit = putUnit(side, 9, { id: "dao" });
    tickSideCombat(side, 30, collect());
    expect(unit.cd).toBeGreaterThanOrEqual(-0.5);
  });
});

describe("spawning", () => {
  it("keeps the spawn cadence under coarse time steps", () => {
    const side = makeSide();
    enqueueWave(side, 1);
    tickSideCombat(side, 3, collect());
    expect(side.enemies.length).toBeGreaterThan(1);
    expect(side.enemies.length).toBeLessThanOrEqual(waveSpec(1).count);
  });

  it("records the wave on the side so splits and refunds scale", () => {
    const side = makeSide();
    enqueueWave(side, 7);
    expect(side.wave).toBe(7);
  });

  it("caps the number of live enemies", () => {
    const side = makeSide();
    const spec = waveSpec(1);
    for (let i = 0; i < 200; i++) spawnEnemy(side, spec, false);
    expect(side.enemies.length).toBeLessThanOrEqual(120);
  });
});

describe("leaks", () => {
  it("clamps hearts at zero and counts the leak", () => {
    const side = makeSide("player", { hearts: 1 });
    side.enemies.push(makeEnemy({ t: 1.2 }), makeEnemy({ t: 1.4 }));
    const emit = collect();
    tickSideCombat(side, 0.05, emit);
    expect(side.hearts).toBe(0);
    expect(side.leaks).toBe(2);
    expect(emit.of("leak")).toHaveLength(2);
    expect(side.enemies).toHaveLength(0);
  });

  it("pays leak compensation for the current wave", () => {
    const side = makeSide("player", { wave: 5, mantou: 0 });
    side.enemies.push(makeEnemy({ t: 1.1 }));
    tickSideCombat(side, 0.05, collect());
    expect(side.mantou).toBe(18);
  });

  it("counts a kill instead of a leak when both land on the same frame", () => {
    const side = makeSide();
    side.enemies.push(makeEnemy({ t: 1.5, hp: 0 }));
    const emit = collect();
    tickSideCombat(side, 0.05, emit);
    expect(side.hearts).toBe(3);
    expect(side.kills).toBe(1);
    expect(emit.of("leak")).toHaveLength(0);
  });
});

describe("win order", () => {
  it("ends on hearts before anything else", () => {
    const state = makeArena();
    state.sides.ai.hearts = 0;
    const emit = collect();
    checkWinner(state, emit);
    expect(state.phase).toBe("over");
    expect(state.winner).toBe("player");
    expect(state.reason).toBe("hearts");
  });

  it("breaks a double knockout by kills, then leaks, then mantou", () => {
    const byKills = makeArena();
    byKills.sides.player.hearts = 0;
    byKills.sides.ai.hearts = 0;
    byKills.sides.ai.kills = 9;
    checkWinner(byKills, collect());
    expect(byKills.winner).toBe("ai");
    expect(byKills.tie).toBe(false);

    const byLeaks = makeArena();
    byLeaks.sides.player.hearts = 0;
    byLeaks.sides.ai.hearts = 0;
    byLeaks.sides.player.leaks = 6;
    byLeaks.sides.ai.leaks = 3;
    checkWinner(byLeaks, collect());
    expect(byLeaks.winner).toBe("ai");

    const byMantou = makeArena();
    byMantou.sides.player.hearts = 0;
    byMantou.sides.ai.hearts = 0;
    byMantou.sides.ai.mantou = 40;
    checkWinner(byMantou, collect());
    expect(byMantou.winner).toBe("ai");
  });

  it("marks a true dead heat instead of silently favouring the player", () => {
    const state = makeArena();
    state.sides.player.hearts = 0;
    state.sides.ai.hearts = 0;
    const emit = collect();
    checkWinner(state, emit);
    expect(state.winner).toBe("player");
    expect(state.tie).toBe(true);
    expect(emit.of("game-over")[0].payload.tie).toBe(true);
  });

  it("never re-decides a finished match", () => {
    const state = makeArena();
    state.sides.ai.hearts = 0;
    checkWinner(state, collect());
    state.sides.player.hearts = 0;
    const emit = collect();
    checkWinner(state, emit);
    expect(emit.of("game-over")).toHaveLength(0);
    expect(state.winner).toBe("player");
  });

  it("stops advancing waves once the match is over", () => {
    const state = makeArena();
    state.phase = "over";
    maybeAdvanceWave(state, collect());
    expect(state.wave).toBe(1);
    expect(state.sides.player.spawnQueue).toHaveLength(0);
  });

  it("advances only when both lanes are clear", () => {
    const state = makeArena();
    state.sides.player.enemies.push(makeEnemy({ t: 0.2 }));
    maybeAdvanceWave(state, collect());
    expect(state.wave).toBe(1);
    state.sides.player.enemies.length = 0;
    const emit = collect();
    maybeAdvanceWave(state, emit);
    expect(state.wave).toBe(2);
    expect(state.sides.ai.wave).toBe(2);
    expect(emit.of("wave")).toHaveLength(1);
  });
});
