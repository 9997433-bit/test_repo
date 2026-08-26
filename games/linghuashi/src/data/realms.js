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
