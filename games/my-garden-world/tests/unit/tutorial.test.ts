import { describe, expect, it } from "vitest";
import { createInitialState } from "../../src/engine/state";
import { TUTORIAL, tutorialAllows } from "../../src/data/story";
import { advanceTutorial, coachTargetId, tutorialEventAdvances } from "../../src/ui/tutorial";

describe("tutorial gating", () => {
  it("unlocks dock buttons progressively and cumulatively", () => {
    expect(tutorialAllows(0, false, "seed")).toBe(false);
    expect(tutorialAllows(1, false, "seed")).toBe(true);
    expect(tutorialAllows(1, false, "water")).toBe(false);
    expect(tutorialAllows(2, false, "seed")).toBe(true);
    expect(tutorialAllows(2, false, "water")).toBe(true);
    expect(tutorialAllows(2, false, "workshop")).toBe(false);
    expect(tutorialAllows(0, true, "workshop")).toBe(true);
  });

  it("always allows mute and reset", () => {
    expect(tutorialAllows(0, false, "mute")).toBe(true);
    expect(tutorialAllows(0, false, "reset")).toBe(true);
  });

  it("advances only on the matching gameplay event", () => {
    const s = createInitialState();
    s.tutorialStep = TUTORIAL.findIndex((b) => b.goal === "plant");
    expect(tutorialEventAdvances(s, { type: "watered", plotId: 0 })).toBe(false);
    expect(tutorialEventAdvances(s, { type: "planted", flowerId: "daisy", plotId: 0 })).toBe(true);
  });

  it("story beats do not advance from gameplay events", () => {
    const s = createInitialState();
    s.tutorialStep = 0;
    expect(tutorialEventAdvances(s, { type: "planted", flowerId: "daisy", plotId: 0 })).toBe(false);
  });

  it("finishes after the last beat", () => {
    const s = createInitialState();
    s.tutorialStep = TUTORIAL.length - 1;
    advanceTutorial(s);
    expect(s.tutorialDone).toBe(true);
  });

  it("points the coach at the dock button for the active goal", () => {
    const s = createInitialState();
    s.tutorialStep = TUTORIAL.findIndex((b) => b.goal === "water");
    expect(coachTargetId(s)).toBe("water");
    s.tutorialStep = 0;
    expect(coachTargetId(s)).toBe(null);
    s.tutorialDone = true;
    expect(coachTargetId(s)).toBe(null);
  });
});
