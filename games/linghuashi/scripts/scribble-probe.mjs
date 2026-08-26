import { pathToFileURL } from "node:url";

import { classifyStroke, synthesizeStroke } from "../src/drawing/recognizer.js";

export const SCRIBBLE_SAMPLES = 400;
export const HARD_FALSE_POSITIVE_LIMIT = 0.05;
export const HARD_FALSE_POSITIVE_TYPES = Object.freeze(["line", "circle", "spiral"]);

export function runScribbleProbe() {
  const random = createRandom(0x5c71bb1e);
  const recognizedCounts = {};
  const hardFalsePositiveCounts = Object.fromEntries(
    HARD_FALSE_POSITIVE_TYPES.map((type) => [type, 0]),
  );

  for (let sample = 0; sample < SCRIBBLE_SAMPLES; sample += 1) {
    const points = synthesizeStroke("scribble", {
      seed: Math.floor(random() * 0xffffffff),
      count: 24 + Math.floor(random() * 29),
      size: 90 + random() * 130,
      rotation: random() * Math.PI * 2,
      dt: 8 + Math.floor(random() * 13),
    });
    const { type } = classifyStroke(points);

    recognizedCounts[type] = (recognizedCounts[type] ?? 0) + 1;
    if (Object.hasOwn(hardFalsePositiveCounts, type)) {
      hardFalsePositiveCounts[type] += 1;
    }
  }

  const hardFalsePositives = Object.values(hardFalsePositiveCounts)
    .reduce((total, count) => total + count, 0);
  const hardFalsePositiveRate = hardFalsePositives / SCRIBBLE_SAMPLES;

  return {
    samples: SCRIBBLE_SAMPLES,
    hardFalsePositiveTypes: HARD_FALSE_POSITIVE_TYPES,
    hardFalsePositiveLimit: HARD_FALSE_POSITIVE_LIMIT,
    hardFalsePositives,
    hardFalsePositiveRate,
    hardFalsePositiveCounts,
    recognizedCounts,
    passed: hardFalsePositiveRate < HARD_FALSE_POSITIVE_LIMIT,
  };
}

export function scribbleFailureMessage(report) {
  return `${report.hardFalsePositives}/${report.samples} hard false positives `
    + `(${formatPercent(report.hardFalsePositiveRate)}) did not stay below `
    + `${formatPercent(report.hardFalsePositiveLimit)}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = runScribbleProbe();
  console.log(JSON.stringify(report, null, 2));

  if (!report.passed) {
    console.error(`scribble: ${scribbleFailureMessage(report)}`);
    process.exitCode = 2;
  } else {
    console.log("scribble ok");
  }
}

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function formatPercent(rate) {
  return `${(rate * 100).toFixed(2)}%`;
}
