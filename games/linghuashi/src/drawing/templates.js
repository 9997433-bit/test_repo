// 六式符箓的理想轨迹模板 —— synth.js 的取景层，不自造几何。
// 用途：键盘施法（合成笔迹走同一识别管线）、教程引导虚线、识别器回归测试。
// 形状只此一源（drawing/synth.js）；这里只把画幅 {w,h} 折算成 synthesizeStroke 的参数。
import { synthesizeStroke, SYNTH_TYPES } from "./synth.js";

export const TEMPLATE_TYPES = SYNTH_TYPES.filter((type) => type !== "scribble");

// 旧模板的采样节拍，压感与回放时长照旧。
const SAMPLE_MS = 12;

// 取景：wide/high 分别是笔迹尺寸相对画幅两轴的上限，取小的那个——
// 开放笔法（直线、曲线、折线）沿长边铺开，闭合笔法按短边取圆，
// 两轴同时设限，极端长宽比下也不会顶出画幅。
// 余下字段是 synth 的调形旋钮：只改形不改类。
const FRAME = {
  // 略微上扬，免得和界面里的横线糊成一片。
  line: { wide: 0.84, high: 4, rotation: -0.12 },
  curve: { wide: 0.76, high: 1.8 },
  circle: { wide: 0.64, high: 0.64 },
  zigzag: { wide: 0.8, high: 2.8, teeth: 6, amplitude: 0.17 },
  spiral: { wide: 0.69, high: 0.69, turns: 2.6 },
  // 六瓣鼓包：云朵的“多瓣半径振荡”特征。
  cloud: { wide: 0.72, high: 0.72, lobes: 6 },
};

export function templatePoints(type, { w = 480, h = 320 } = {}) {
  const frame = FRAME[type];
  if (!frame) {
    const cx = w / 2;
    const cy = h / 2;
    return [
      { x: cx - 10, y: cy, t: 0 },
      { x: cx + 10, y: cy, t: SAMPLE_MS },
    ];
  }

  const { wide, high, ...knobs } = frame;
  return synthesizeStroke(type, {
    cx: w / 2,
    cy: h / 2,
    size: Math.min(w * wide, h * high),
    dt: SAMPLE_MS,
    ...knobs,
  });
}
