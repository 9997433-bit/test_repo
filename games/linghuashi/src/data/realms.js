/**
 * 境界表。字段：
 *   xp        本境界突破所需修为（breakthrough 消耗后进入下一境界；飞升为终点，取 Infinity）
 *   idlePerMin 挂机每分钟灵气丹产出（上限 8 小时，见 progression/idle.js）
 *   hp/atk/qi 该境界玩家的战斗三围（进入战斗时由 createActor 读取）
 *
 * 曲线锚点（详见 docs/GDD.md「境界曲线」）：
 *   xp 每境 ×1.8~2.0；hp/atk 每境约 +28%；qi 线性 +20~60（回气固定 8/秒，池子只决定爆发上限）。
 * 注意：练气的 xp=80 与 idlePerMin=4 被 tests/progression.test.js 锁定，改动需同步测试。
 */
export const REALMS = [
  { id: "qi_refining", name: "练气", xp: 80, idlePerMin: 4, hp: 120, atk: 16, qi: 80 },
  { id: "foundation", name: "筑基", xp: 180, idlePerMin: 8, hp: 170, atk: 22, qi: 100 },
  { id: "golden_core", name: "金丹", xp: 360, idlePerMin: 14, hp: 230, atk: 30, qi: 120 },
  { id: "nascent", name: "元婴", xp: 720, idlePerMin: 22, hp: 300, atk: 40, qi: 150 },
  { id: "spirit_severing", name: "化神", xp: 1400, idlePerMin: 34, hp: 390, atk: 52, qi: 180 },
  { id: "void", name: "炼虚", xp: 2600, idlePerMin: 48, hp: 500, atk: 66, qi: 210 },
  { id: "unity", name: "合体", xp: 4800, idlePerMin: 66, hp: 640, atk: 82, qi: 250 },
  { id: "mahayana", name: "大乘", xp: 8600, idlePerMin: 88, hp: 820, atk: 100, qi: 300 },
  { id: "ascension", name: "飞升", xp: Infinity, idlePerMin: 120, hp: 1040, atk: 124, qi: 360 },
];

export function realmById(id) {
  return REALMS.find((r) => r.id === id) ?? REALMS[0];
}

export function nextRealm(id) {
  const i = REALMS.findIndex((r) => r.id === id);
  return REALMS[Math.min(i + 1, REALMS.length - 1)];
}
