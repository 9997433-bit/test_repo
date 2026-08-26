// probe/bench 的取样轨迹 —— src/drawing/synth.js 的取景层，不自造几何。
// 形状只此一源；这里只负责按 variant 平移落笔点、改采样节拍，好让基准跑出不同的取样。
import { synthesizeStroke, SYNTH_TYPES } from "../src/drawing/synth.js";

export const TRAJECTORY_TYPES = Object.freeze(SYNTH_TYPES.filter((type) => type !== "scribble"));

const ORIGIN_X = 120;
const ORIGIN_Y = 120;
const SIZE = 220;

// synth 的调形旋钮：只改形不改类，其余型走默认。
const SHAPE = {
  zigzag: { teeth: 6 },
  spiral: { turns: 2.6 },
  cloud: { lobes: 6 },
};

export function generateTrajectory(type, variant = 0) {
  if (!TRAJECTORY_TYPES.includes(type)) throw new Error(`Unknown trajectory type: ${type}`);

  const normalizedVariant = Number.isFinite(variant) ? Math.trunc(variant) : 0;
  const offsetX = positiveModulo(normalizedVariant * 17, 13) - 6;
  const offsetY = positiveModulo(normalizedVariant * 23, 11) - 5;
  const timeStep = 10 + positiveModulo(normalizedVariant, 5);

  return synthesizeStroke(type, {
    cx: ORIGIN_X + offsetX,
    cy: ORIGIN_Y + offsetY,
    size: SIZE,
    dt: timeStep,
    ...SHAPE[type],
  });
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}
