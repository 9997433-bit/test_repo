export const REALMS = [
  { id: "qi", name: "练气", layers: 9, exp: 80, atk: 12, hp: 180, def: 6 },
  { id: "foundation", name: "筑基", layers: 9, exp: 180, atk: 22, hp: 320, def: 12 },
  { id: "gold", name: "金丹", layers: 9, exp: 360, atk: 40, hp: 560, def: 22 },
  { id: "infant", name: "元婴", layers: 9, exp: 720, atk: 70, hp: 920, def: 38 },
  { id: "spirit", name: "化神", layers: 9, exp: 1400, atk: 120, hp: 1500, def: 62 },
  { id: "void", name: "炼虚", layers: 9, exp: 2600, atk: 200, hp: 2400, def: 100 },
  { id: "union", name: "合体", layers: 9, exp: 4800, atk: 330, hp: 3800, def: 160 },
  { id: "mahayana", name: "大乘", layers: 9, exp: 8600, atk: 520, hp: 6000, def: 250 },
  { id: "tribulation", name: "渡劫", layers: 9, exp: 15000, atk: 820, hp: 9400, def: 400 },
  { id: "ascend", name: "飞升", layers: 1, exp: 99999, atk: 1280, hp: 15000, def: 640 },
];

export function realmAt(index) {
  return REALMS[Math.max(0, Math.min(REALMS.length - 1, index))];
}

export function realmPower(index, layer) {
  const r = realmAt(index);
  const t = (layer - 1) / Math.max(1, r.layers);
  return {
    atk: Math.round(r.atk * (0.72 + t * 0.4)),
    hp: Math.round(r.hp * (0.72 + t * 0.4)),
    def: Math.round(r.def * (0.72 + t * 0.4)),
  };
}
