// 敌方意图：由蓄力槽比例与受控时间派生，供 UI 电报提示。
export function enemyIntent(gaugeRatio, controlMs) {
  if (controlMs > 0) return "bound";
  return gaugeRatio > 0.7 ? "strike" : "watch";
}
