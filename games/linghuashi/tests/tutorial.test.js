import { describe, expect, it } from "vitest";
import { TUTORIAL_STEPS, tutorialStart, tutorialAdvance } from "../src/ui/tutorial.js";

describe("tutorial state machine", () => {
  it("teaches all six stroke types in order", () => {
    expect(TUTORIAL_STEPS.map((s) => s.type)).toEqual(["line", "curve", "circle", "zigzag", "spiral", "cloud"]);
  });
  it("advances only on the requested type", () => {
    let st = tutorialStart();
    st = tutorialAdvance(st, { type: "circle", precision: 0.9 });
    expect(st.step).toBe(0);
    expect(st.feedback.ok).toBe(false);
    st = tutorialAdvance(st, { type: "line", precision: 0.9 });
    expect(st.step).toBe(1);
    expect(st.feedback.ok).toBe(true);
  });
  it("requires minimum precision", () => {
    let st = tutorialStart();
    st = tutorialAdvance(st, { type: "line", precision: 0.1 });
    expect(st.step).toBe(0);
    expect(st.feedback.ok).toBe(false);
  });
  it("completes after all six steps", () => {
    let st = tutorialStart();
    for (const step of TUTORIAL_STEPS) {
      st = tutorialAdvance(st, { type: step.type, precision: 0.95 });
    }
    expect(st.done).toBe(true);
    st = tutorialAdvance(st, { type: "line", precision: 0.95 });
    expect(st.done).toBe(true);
  });
});
