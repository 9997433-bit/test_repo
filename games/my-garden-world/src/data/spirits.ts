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

// 定位：菊月＝纯加速；池光＝省水；虹蝶＝护花；雪衣＝护花+口碑；岁灯＝毕业全能。
// 后位花灵不在「加速」上反超菊月，改以功能与口碑取胜，避免前期灵一路用到底。
export const SPIRITS: SpiritDef[] = [
  { id: "juyue", name: "菊月", unlockLevel: 4, growMul: 1.6, autoWater: false, wiltGuard: false, reputationBonus: 0, line: "霜色催花，我来替你守一夜。" },
  { id: "chiguang", name: "池光", unlockLevel: 7, growMul: 1.25, autoWater: true, wiltGuard: false, reputationBonus: 2, line: "水声里，花不会口渴。" },
  { id: "rainbow", name: "虹蝶", unlockLevel: 10, growMul: 1.15, autoWater: false, wiltGuard: true, reputationBonus: 4, line: "虫豸退散，花开便好。" },
  { id: "xueyi", name: "雪衣", unlockLevel: 13, growMul: 1.2, autoWater: false, wiltGuard: true, reputationBonus: 6, line: "落雪为衣，替花挡住整个长夜。" },
  { id: "suideng", name: "岁灯", unlockLevel: 15, growMul: 1.45, autoWater: true, wiltGuard: true, reputationBonus: 8, line: "一盏岁灯长明，四季都肯为你留步。" },
];
