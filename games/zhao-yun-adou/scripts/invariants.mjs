import { HAND_LIMIT, START_HEARTS } from "../src/data/units.js";

function findInvalidNumbers(value, path, violations, seen) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      violations.push({
        type: Number.isNaN(value) ? "nan" : "non-finite-number",
        path,
        value: String(value),
      });
    }
    return;
  }
  if (!value || typeof value !== "object" || seen.has(value)) return;

  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      findInvalidNumbers(entry, `${path}[${index}]`, violations, seen),
    );
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    findInvalidNumbers(entry, path ? `${path}.${key}` : key, violations, seen);
  }
}

export function collectInvariantViolations(state) {
  const violations = [];

  for (const [sideId, side] of Object.entries(state.sides ?? {})) {
    if (side.hearts > START_HEARTS) {
      violations.push({
        type: "hearts-above-start",
        path: `sides.${sideId}.hearts`,
        value: side.hearts,
        limit: START_HEARTS,
      });
    }
    if (side.mantou < 0) {
      violations.push({
        type: "negative-mantou",
        path: `sides.${sideId}.mantou`,
        value: side.mantou,
        limit: 0,
      });
    }
    if ((side.hand?.length ?? 0) > HAND_LIMIT) {
      violations.push({
        type: "hand-above-limit",
        path: `sides.${sideId}.hand.length`,
        value: side.hand.length,
        limit: HAND_LIMIT,
      });
    }
  }

  findInvalidNumbers(state, "", violations, new WeakSet());
  return violations;
}

export function createInvariantTracker() {
  const violations = [];
  const seenViolations = new Set();
  const observed = {
    checks: 0,
    maxHearts: Number.NEGATIVE_INFINITY,
    minMantou: Number.POSITIVE_INFINITY,
    maxHand: 0,
  };

  return {
    observe(state, label) {
      observed.checks += 1;
      for (const side of Object.values(state.sides ?? {})) {
        observed.maxHearts = Math.max(observed.maxHearts, side.hearts);
        observed.minMantou = Math.min(observed.minMantou, side.mantou);
        observed.maxHand = Math.max(observed.maxHand, side.hand?.length ?? 0);
      }
      for (const violation of collectInvariantViolations(state)) {
        const item = { at: label, ...violation };
        const key = JSON.stringify(item);
        if (!seenViolations.has(key)) {
          seenViolations.add(key);
          violations.push(item);
        }
      }
    },
    report() {
      return {
        ...observed,
        violations,
        passed: violations.length === 0,
      };
    },
  };
}
