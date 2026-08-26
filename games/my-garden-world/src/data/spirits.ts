export interface SpiritDef {
  id: string;
  name: string;
  unlockLevel: number;
  growMul: number;
  autoWater: boolean;
  wiltGuard: boolean;
  reputationBonus: number;
  line: string;
}

export const SPIRITS: SpiritDef[] = [
  { id: "juyue", name: "菊月", unlockLevel: 4, growMul: 2, autoWater: false, wiltGuard: false, reputationBonus: 0, line: "霜色催花，我来替你守一夜。" },
  { id: "chiguang", name: "池光", unlockLevel: 7, growMul: 1.25, autoWater: true, wiltGuard: false, reputationBonus: 2, line: "水声里，花不会口渴。" },
  { id: "rainbow", name: "虹蝶", unlockLevel: 10, growMul: 1.15, autoWater: false, wiltGuard: true, reputationBonus: 4, line: "虫豸退散，花开便好。" },
];
