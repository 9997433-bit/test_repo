import { describe, expect, it } from "vitest";
import { tickIdle } from "../src/progression/idle.js";
import { breakthrough } from "../src/progression/realm.js";
import { catchBeast, releaseBeast, beastBonus, BEAST_COST } from "../src/progression/beasts.js";
import { checkInkUnlock, masteredTypes, recordStroke, INK_TYPES } from "../src/progression/unlock.js";
import { isStageUnlocked, nextStage, STAGES } from "../src/data/stages.js";
import { defaultSave, migrateSave, SAVE_VERSION } from "../src/core/store.js";

describe("idle", () => {
  it("caps long offline time", () => {
    const save = { ...defaultSave(), idleUntil: Date.now() - 20 * 60 * 60 * 1000 };
    const next = tickIdle(save, Date.now());
    expect(next.qiPills).toBeGreaterThan(0);
    expect(next.idleClaim.minutes).toBeLessThanOrEqual(8 * 60);
  });
});

describe("realm", () => {
  it("blocks breakthrough without xp", () => {
    const next = breakthrough({ ...defaultSave(), xp: 0 });
    expect(next.realmId).toBe("qi_refining");
  });
  it("promotes when xp is enough", () => {
    const next = breakthrough({ ...defaultSave(), xp: 80 });
    expect(next.realmId).toBe("foundation");
  });
});

describe("beasts", () => {
  it("costs qi pills to catch", () => {
    const poor = catchBeast({ ...defaultSave(), qiPills: BEAST_COST - 1 }, () => 0);
    expect(poor.beasts.length).toBe(0);
    const rich = catchBeast({ ...defaultSave(), qiPills: BEAST_COST }, () => 0);
    expect(rich.beasts.length).toBe(1);
    expect(rich.qiPills).toBe(0);
  });
  it("caps at three slots and can release", () => {
    let save = { ...defaultSave(), qiPills: 999 };
    for (let i = 0; i < 4; i += 1) save = catchBeast(save, () => 0.5);
    expect(save.beasts.length).toBe(3);
    save = releaseBeast(save, save.beasts[0].uid);
    expect(save.beasts.length).toBe(2);
  });
  it("stacks passives", () => {
    const save = {
      ...defaultSave(),
      beasts: [
        { passive: "crit", value: 0.08 },
        { passive: "crit", value: 0.08 },
      ],
    };
    expect(beastBonus(save).crit).toBeCloseTo(0.16);
  });
});

describe("ink master (墨客) unlock", () => {
  it("requires all six stroke types above threshold", () => {
    let save = defaultSave();
    for (const t of INK_TYPES.slice(0, 5)) {
      save = recordStroke(save, { type: t, precision: 0.8 });
    }
    expect(masteredTypes(save.strokeStats).length).toBe(5);
    expect(checkInkUnlock(save)).toBe(false);
    save = recordStroke(save, { type: "cloud", precision: 0.61 });
    expect(checkInkUnlock(save)).toBe(true);
  });
  it("low precision strokes do not count", () => {
    let save = defaultSave();
    for (const t of INK_TYPES) save = recordStroke(save, { type: t, precision: 0.3 });
    expect(checkInkUnlock(save)).toBe(false);
  });
  it("keeps only the best precision per type and ignores scribble", () => {
    let save = defaultSave();
    save = recordStroke(save, { type: "line", precision: 0.9 });
    save = recordStroke(save, { type: "line", precision: 0.4 });
    save = recordStroke(save, { type: "scribble", precision: 1 });
    expect(save.strokeStats.line).toBe(0.9);
    expect(save.strokeStats.scribble).toBeUndefined();
  });
});

describe("stage unlocking", () => {
  it("only the first stage is open at start", () => {
    const save = defaultSave();
    expect(isStageUnlocked(save, STAGES[0].id)).toBe(true);
    expect(isStageUnlocked(save, STAGES[1].id)).toBe(false);
  });
  it("clearing a stage unlocks the next", () => {
    const save = { ...defaultSave(), cleared: [STAGES[0].id] };
    expect(isStageUnlocked(save, STAGES[1].id)).toBe(true);
    expect(isStageUnlocked(save, STAGES[2].id)).toBe(false);
  });
  it("nextStage walks the campaign in order", () => {
    expect(nextStage(STAGES[0].id).id).toBe(STAGES[1].id);
    expect(nextStage(STAGES[STAGES.length - 1].id)).toBeNull();
  });
});

describe("save migration", () => {
  it("migrates v1 saves and derives strokeStats from gallery", () => {
    const v1 = {
      version: 1,
      classId: "fa",
      realmId: "golden_core",
      xp: 120,
      qiPills: 33,
      gallery: [
        { type: "line", precision: 0.82, at: 1 },
        { type: "line", precision: 0.5, at: 2 },
        { type: "circle", precision: 0.7, at: 3 },
      ],
      settings: { mute: true },
    };
    const out = migrateSave(v1);
    expect(out.version).toBe(SAVE_VERSION);
    expect(out.classId).toBe("fa");
    expect(out.realmId).toBe("golden_core");
    expect(out.cleared).toEqual([]);
    expect(out.strokeStats.line).toBeCloseTo(0.82);
    expect(out.strokeStats.circle).toBeCloseTo(0.7);
    expect(out.settings.mute).toBe(true);
    expect(out.settings.showHints).toBe(true);
  });
  it("rejects unknown versions", () => {
    expect(migrateSave({ version: 99 })).toBeNull();
    expect(migrateSave(null)).toBeNull();
  });
  it("passes through current-version saves", () => {
    const cur = { ...defaultSave(), qiPills: 55 };
    expect(migrateSave(cur).qiPills).toBe(55);
  });
});
