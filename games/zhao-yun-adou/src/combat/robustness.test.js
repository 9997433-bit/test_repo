import { describe, expect, it } from "vitest";
import { createGame } from "../core/game.js";
import { waveSpec } from "../data/waves.js";
import { applyDamage, applySlow, knockback } from "./damage.js";
import { coverageRatio, coverageWindows, hitFactorAt } from "./geometry.js";
import { pathLength, pointAt } from "./path.js";
import { sendPressure } from "./pressure.js";
import { castSkill } from "./skills.js";
import { checkWinner, enqueueWave, maybeAdvanceWave, spawnEnemy, tickSideCombat } from "./sim.js";
import { collect, makeArena, makeEnemy, makeSide, putUnit } from "./testkit.js";

/**
 * 坏档演练。
 *
 * game.js 的 load() 只保证 enemies / spawnQueue / cells 是数组，元素内容原样
 * 来自快照 —— 手改的 localStorage、旧版本存档、被截断的回放都会流到战斗层。
 * tick 跑在 requestAnimationFrame 里，抛一次就是整局静止，所以这里逐条钉住
 * 「坏数据只被跳过，不会中断结算」。
 */

const SPEC = waveSpec(1);

describe("tick survives malformed side state", () => {
  it("skips null entries in enemies, cells and the spawn queue", () => {
    const side = makeSide();
    putUnit(side, 9, { id: "dao" });
    const real = makeEnemy({ t: 0.35 });
    side.enemies.push(null, real, undefined);
    side.cells[3] = null;
    side.spawnQueue.push(null);

    expect(() => tickSideCombat(side, 0.05, collect())).not.toThrow();
    expect(side.enemies).toEqual([real]);
    expect(real.hp).toBeLessThan(100);
    expect(side.spawnQueue).toHaveLength(0);
  });

  it("treats a non-finite hp as dead instead of an immortal blocker", () => {
    const side = makeSide();
    side.enemies.push(makeEnemy({ hp: Number.NaN }));
    const emit = collect();
    tickSideCombat(side, 0.05, emit);
    expect(side.enemies).toHaveLength(0);
    expect(side.kills).toBe(1);
    expect(emit.of("leak")).toHaveLength(0);
  });

  it("rewinds a non-finite lane progress instead of scoring a phantom leak", () => {
    const side = makeSide();
    side.enemies.push(makeEnemy({ t: Number.NaN, speed: 0 }));
    tickSideCombat(side, 0.05, collect());
    expect(side.hearts).toBe(3);
    expect(side.enemies).toHaveLength(1);
    expect(side.enemies[0].t).toBe(0);
  });

  it("keeps the ledger numeric when rewards and totals arrive corrupted", () => {
    const side = makeSide("player", { mantou: Number.NaN, kills: undefined });
    side.enemies.push(makeEnemy({ hp: 0, reward: Number.NaN }));
    tickSideCombat(side, 0.05, collect());
    expect(side.mantou).toBe(0);
    expect(side.kills).toBe(1);
  });

  it("ignores a coarse or non-finite dt rather than teleporting the wave", () => {
    const side = makeSide();
    const e = makeEnemy({ t: 0.2, speed: 40 });
    side.enemies.push(e);
    tickSideCombat(side, Number.NaN, collect());
    tickSideCombat(side, Number.POSITIVE_INFINITY, collect());
    expect(e.t).toBe(0.2);
  });
});

describe("spawn queue cannot wedge a lane", () => {
  it("drops a queue entry that lost its wave spec", () => {
    const side = makeSide();
    side.spawnQueue.push({ remain: 3, acc: 0, bossLeft: 0 });
    tickSideCombat(side, 0.5, collect());
    expect(side.spawnQueue).toHaveLength(0);
    expect(side.enemies).toHaveLength(0);
  });

  it("clears a queue whose remaining count is not a number", () => {
    const side = makeSide();
    side.spawnQueue.push({ remain: Number.NaN, acc: 0, spec: SPEC, bossLeft: 0 });
    tickSideCombat(side, 0.5, collect());
    expect(side.spawnQueue).toHaveLength(0);
  });

  it("falls back to the minimum cadence when the interval is zero or negative", () => {
    const paced = (interval) => {
      const side = makeSide();
      side.spawnQueue.push({ remain: 30, acc: 0, spec: { ...SPEC, interval }, bossLeft: 0 });
      tickSideCombat(side, 0.1, collect());
      return side.enemies.length;
    };
    // 0.1s / 0.05s 下限 = 2 只。没有下限的话这一帧会一路撞到追帧上限。
    expect(paced(0)).toBe(2);
    expect(paced(-1)).toBe(2);
  });

  it("lets waves advance again once the broken entry is gone", () => {
    const state = makeArena();
    state.sides.player.spawnQueue.push(null);
    tickSideCombat(state.sides.player, 0.5, collect());
    maybeAdvanceWave(state, collect());
    expect(state.wave).toBe(2);
  });

  it("degrades a boss spawn to a footman when the spec has no boss row", () => {
    const side = makeSide();
    const enemy = spawnEnemy(side, { ...SPEC, boss: null }, true);
    expect(enemy).not.toBeNull();
    expect(enemy.boss).toBe(false);
    expect(enemy.hp).toBeGreaterThan(0);
  });

  it("refuses to spawn without a usable side or spec", () => {
    expect(spawnEnemy(null, SPEC, false)).toBeNull();
    expect(spawnEnemy({ enemies: "nope" }, SPEC, false)).toBeNull();
    expect(spawnEnemy(makeSide(), null, false)).toBeNull();
    expect(() => enqueueWave({}, 1)).not.toThrow();
    expect(() => enqueueWave(makeSide(), Number.NaN)).not.toThrow();
  });
});

describe("board lookups stay on the unit table", () => {
  it("does not fire for a unit id that only exists on Object.prototype", () => {
    const side = makeSide();
    putUnit(side, 9, { id: "toString" });
    const e = makeEnemy({ t: 0.35 });
    side.enemies.push(e);
    expect(() => tickSideCombat(side, 0.05, collect())).not.toThrow();
    expect(e.hp).toBe(100);
  });

  it("keeps firing when a unit revives with a corrupted level or cooldown", () => {
    const side = makeSide();
    const unit = putUnit(side, 9, { id: "dao", level: Number.NaN, cd: Number.NaN });
    const e = makeEnemy({ t: 0.35 });
    side.enemies.push(e);
    tickSideCombat(side, 0.05, collect());
    expect(e.hp).toBeLessThan(100);
    expect(Number.isFinite(unit.cd)).toBe(true);
  });
});

describe("damage helpers reject non-finite inputs", () => {
  it("never lands damage on a NaN health pool", () => {
    const e = makeEnemy({ hp: Number.NaN });
    expect(applyDamage(e, 50)).toMatchObject({ dealt: 0, killed: false });
  });

  it("falls back to no slow rather than poisoning speed with NaN", () => {
    const e = makeEnemy();
    applySlow(e, Number.NaN, 2);
    expect(e.slowMul).toBe(1);
    applySlow(e, 0.5, 2);
    expect(e.slowMul).toBe(0.5);
  });

  it("knocks back from the start when progress is unreadable", () => {
    const e = makeEnemy({ t: undefined });
    expect(knockback(e, 0.1)).toBe(0);
    expect(e.t).toBe(0);
  });
});

describe("lane geometry tolerates degenerate input", () => {
  it("measures an empty or broken polyline as zero length", () => {
    expect(pathLength([])).toBe(0);
    expect(pathLength(null)).toBe(0);
    expect(pointAt([], 0.5)).toEqual({ x: 0, y: 0 });
    expect(pointAt([{ x: Number.NaN, y: 0 }, { x: 2, y: 3 }], 0.5)).toEqual({ x: 2, y: 3 });
  });

  it("clamps the coverage sample count instead of dividing by zero", () => {
    // 12 号格罩着路线终点，samples=0 时 0/0 会把这段窗口写成 NaN。
    const windows = coverageWindows(12, 1, 0);
    expect(windows.length).toBeGreaterThan(0);
    for (const w of windows) {
      expect(Number.isFinite(w.from)).toBe(true);
      expect(Number.isFinite(w.to)).toBe(true);
    }
    expect(Number.isFinite(coverageRatio(12, 1, 0))).toBe(true);
  });

  it("scores an unmeasurable distance as a miss, not a free full hit", () => {
    expect(hitFactorAt(Number.NaN, 1)).toBe(0);
  });
});

describe("skills and pressure keep their contracts", () => {
  it("returns a blank result for an unknown hero and a non-array enemy list", () => {
    const side = makeSide();
    const blank = castSkill(side, { kind: "hero", id: "nobody" }, []);
    expect(blank).toMatchObject({ hits: 0, damage: 0, targets: [] });
    const unit = putUnit(side, 9, { kind: "hero", id: "zhaoyun", cooldown: 0 });
    expect(() => castSkill(side, unit, "not-a-list")).not.toThrow();
    expect(unit.cooldown).toBeGreaterThan(0);
  });

  it("rebuilds a pressure ledger that came back as a primitive", () => {
    const from = makeSide("player");
    const to = makeSide("ai", { pressure: 7 });
    expect(sendPressure(from, to)).not.toBeNull();
    expect(to.pressure).toMatchObject({ received: 1 });
    expect(to.spawnQueue).toHaveLength(1);
  });
});

describe("verdicts stay meaningful on a corrupted state", () => {
  it("calls a dead heat instead of handing the win to whoever compares first", () => {
    const state = makeArena();
    state.sides.player.hearts = Number.NaN;
    state.sides.ai.hearts = Number.NaN;
    checkWinner(state, collect());
    expect(state.phase).toBe("over");
    expect(state.tie).toBe(true);
  });

  it("leaves a state with no sides alone rather than throwing", () => {
    const orphan = { phase: "playing", wave: 1, sides: {} };
    expect(() => checkWinner(orphan, collect())).not.toThrow();
    expect(() => maybeAdvanceWave(orphan, collect())).not.toThrow();
    expect(orphan.phase).toBe("playing");
  });
});

describe("a hand-corrupted save still plays", () => {
  it("loads, ticks and keeps advancing after the garbage is swept out", () => {
    const live = createGame({ seed: 4242, fixedStep: 1 / 60 });
    live.start();
    for (let i = 0; i < 240; i++) live.tick(1 / 60);

    const snapshot = live.serialize({ rng: true });
    const lane = snapshot.sides.player;
    lane.enemies.push(null, { hp: Number.NaN, t: 0.5 }, { hp: 20, t: Number.NaN });
    lane.spawnQueue.push({ remain: 4, acc: 0 });
    lane.cells[0] = null;
    lane.mantou = Number.NaN;

    const revived = createGame({ seed: 1, fixedStep: 1 / 60 });
    expect(revived.load(snapshot)).toBe(true);
    expect(() => {
      for (let i = 0; i < 600; i++) revived.tick(1 / 60);
    }).not.toThrow();

    const after = revived.state.sides.player;
    expect(after.enemies.length).toBeGreaterThan(0);
    expect(after.enemies.every((e) => e && Number.isFinite(e.hp) && Number.isFinite(e.t))).toBe(true);
    expect(after.spawnQueue.every((q) => q && q.spec)).toBe(true);
    expect(Number.isFinite(after.mantou)).toBe(true);
    // 扫掉坏数据之后这条线照常推进，而不是停在读档那一帧。
    expect(Math.max(...after.enemies.map((e) => e.t))).toBeGreaterThan(0);
    expect(revived.state.time).toBeGreaterThan(snapshot.time);
  });
});
