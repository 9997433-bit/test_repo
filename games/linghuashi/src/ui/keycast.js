import { classifyStroke } from "../drawing/recognizer.js";
import { synthesizeStroke } from "../drawing/synth.js";
import { TALISMANS } from "../data/talismans.js";

/**
 * 键盘 / 点击施法。
 *
 * 手绘之外的第二条入口：按 1-6 或点击符键条，用 drawing/synth.js 的标准轨迹
 * 内联生成一段点列，走同一个 classifyStroke 取得压感与画幅，再交给 battle.cast。
 * 识别结果只用来核对模板是否仍被判回本型；笔法以按键意图为准、精度固定，
 * 保证键盘路径可预期，也不会强过手绘的满精度。
 */

export const KEYBOARD_PRECISION = 0.7;
export const KEYBOARD_PRESSURE = 0.6;
const MISMATCH_PENALTY = 0.8;
const SAMPLE_MS = 14;

export const STROKE_KEYS = [
  { key: "1", type: "line", name: "直线", effect: "穿透直伤" },
  { key: "2", type: "curve", name: "曲线", effect: "束缚并伤" },
  { key: "3", type: "circle", name: "圆", effect: "生成护盾" },
  { key: "4", type: "zigzag", name: "折线", effect: "破甲穿刺" },
  { key: "5", type: "spiral", name: "螺旋", effect: "阵法轰击" },
  { key: "6", type: "cloud", name: "云纹", effect: "回春治疗" },
].map((entry) => ({
  ...entry,
  talisman: TALISMANS[entry.type]?.name ?? "余墨",
  qi: TALISMANS[entry.type]?.qi ?? 0,
}));

export function strokeKeyByKey(key) {
  return STROKE_KEYS.find((s) => s.key === key) ?? null;
}

export function strokeKeyByType(type) {
  return STROKE_KEYS.find((s) => s.type === type) ?? null;
}

// 只调形不改类：这些参数下六个模板在各种画幅上都仍被识别器判回本型（见 keycast 说明）。
const SHAPE = {
  // 直线转一点角度，免得和符键条上的横线糊成一片。
  line: { rotation: -0.5 },
  // 少一分尖、多一分圆，看着更像云纹而不是四角星。
  cloud: { lobes: 5, amplitude: 0.24 },
};

/** 某种笔法的标准点列，铺满给定画幅；教程示意图与键盘施法共用。 */
export function strokePoints(type, { width = 320, height = 240, fill = 0.72 } = {}) {
  if (!STROKE_KEYS.some((s) => s.type === type)) return [];
  return synthesizeStroke(type, {
    cx: width / 2,
    cy: height / 2,
    size: Math.min(width, height) * fill,
    dt: SAMPLE_MS,
    ...SHAPE[type],
  });
}

/** 合成一笔交给 battle.cast，结构与 classifyStroke 的返回值一致。 */
export function keyboardStroke(type, box = {}) {
  const points = strokePoints(type, box);
  if (!points.length) return null;
  const scored = classifyStroke(points);
  const matched = scored.type === type;
  return {
    ...scored,
    type,
    precision: matched ? KEYBOARD_PRECISION : KEYBOARD_PRECISION * MISMATCH_PENALTY,
    pressure: KEYBOARD_PRESSURE,
    raw: points,
    source: "keyboard",
    matched,
  };
}
