// 教程状态机（纯函数，可单测）：
// 六步依次教六式，识别到目标笔迹（或按对应热键）即进入下一步。
export const TUTORIAL_STEPS = [
  { type: "line", title: "第一式 · 穿云剑", text: "沿虚线横画一条直线，越直伤害越高。也可按【1】施放。", minPrecision: 0.4 },
  { type: "curve", title: "第二式 · 缚灵丝", text: "画一道舒展的弧线，束缚敌人几息。也可按【2】。", minPrecision: 0.35 },
  { type: "circle", title: "第三式 · 护体罡", text: "闭合画圆结成护盾，敌方反噬将被挡下。也可按【3】。", minPrecision: 0.4 },
  { type: "zigzag", title: "第四式 · 破军刺", text: "折线急转破其甲壳，对护盾双倍削减。也可按【4】。", minPrecision: 0.35 },
  { type: "spiral", title: "第五式 · 五行阵", text: "由内向外旋出螺旋，阵法轰击倍率最高。也可按【5】。", minPrecision: 0.35 },
  { type: "cloud", title: "第六式 · 回春笔", text: "画一朵鼓包云回复生命，道修尤擅此式。也可按【6】。", minPrecision: 0.35 },
];

export function tutorialStart() {
  return { step: 0, done: false };
}

export function tutorialAdvance(state, stroke) {
  if (state.done) return { ...state, feedback: null };
  const cur = TUTORIAL_STEPS[state.step];
  if (!cur) return { step: state.step, done: true, feedback: null };
  if (stroke.type !== cur.type) {
    return { ...state, feedback: { ok: false, msg: `识别为「${labelOf(stroke.type)}」，试试${cur.title.slice(6)}的笔意。` } };
  }
  if ((stroke.precision ?? 0) < cur.minPrecision) {
    return { ...state, feedback: { ok: false, msg: "笔意对了，但还欠火候，再画工整些。" } };
  }
  const next = state.step + 1;
  const done = next >= TUTORIAL_STEPS.length;
  return {
    step: done ? state.step : next,
    done,
    feedback: { ok: true, msg: done ? "六式已成！放手施为，收了这个画靶。" : "妙笔！下一式——" },
  };
}

function labelOf(type) {
  const map = { line: "直线", curve: "曲线", circle: "圆", zigzag: "折线", spiral: "螺旋", cloud: "云形", scribble: "余墨" };
  return map[type] || type;
}
