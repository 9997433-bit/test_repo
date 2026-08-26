export function enemyIntent(t, controlMs) {
  if (controlMs > 0) return "bound";
  return t % 1800 < 400 ? "strike" : "watch";
}
