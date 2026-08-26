export const CLASSES = [
  {
    id: "jian",
    name: "剑修",
    motto: "以剑入道，一线破妄",
    bonus: { line: 0.28, zigzag: 0.12 },
    element: "metal",
    role: "burst",
  },
  {
    id: "ti",
    name: "体修",
    motto: "肉身成碑，圆盾不破",
    bonus: { circle: 0.35, line: 0.05 },
    element: "earth",
    role: "tank",
  },
  {
    id: "fa",
    name: "法修",
    motto: "符阵为骨，螺旋焚天",
    bonus: { spiral: 0.3, curve: 0.15 },
    element: "fire",
    role: "caster",
  },
  {
    id: "dao",
    name: "道修",
    motto: "一笔回春，云篆济世",
    bonus: { cloud: 0.32, circle: 0.1 },
    element: "wood",
    role: "healer",
  },
  {
    id: "yao",
    name: "妖修",
    motto: "画灵为伴，曲线夺魄",
    bonus: { curve: 0.26, scribble: 0.1 },
    element: "wood",
    role: "summoner",
  },
  {
    id: "qi",
    name: "气修",
    motto: "折线破防，雷走笔锋",
    bonus: { zigzag: 0.3, spiral: 0.1 },
    element: "thunder",
    role: "assassin",
  },
  {
    id: "mo",
    name: "墨客",
    motto: "点墨成境，改写战场",
    bonus: { spiral: 0.18, cloud: 0.18, circle: 0.1 },
    element: "water",
    role: "controller",
    hidden: true,
  },
];

export const COUNTER = {
  ti: "dao",
  dao: "mo",
  mo: "yao",
  yao: "qi",
  qi: "fa",
  fa: "ti",
  jian: "yao",
};

export function classById(id) {
  return CLASSES.find((c) => c.id === id) ?? null;
}
