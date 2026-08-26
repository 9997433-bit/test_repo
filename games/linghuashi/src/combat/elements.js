export const ELEMENTS = ["metal", "wood", "water", "fire", "earth", "thunder"];

const WEAK = {
  metal: "wood",
  wood: "earth",
  earth: "water",
  water: "fire",
  fire: "metal",
  thunder: "metal",
};

export function reaction(src, dst) {
  if (src === "water" && dst === "fire") return { id: "evaporate", label: "水火蒸发", damage: 1.35, control: 0 };
  if (src === "water" && dst === "wood") return { id: "vine", label: "水木藤缚", damage: 1.05, control: 400 };
  if (src === "thunder" && dst === "metal") return { id: "conduct", label: "金雷引", damage: 1.12, crit: 0.15 };
  if (WEAK[src] === dst) return { id: "suppress", label: "五行压制", damage: 1.2, control: 0 };
  if (WEAK[dst] === src) return { id: "resist", label: "五行受制", damage: 0.82, control: 0 };
  return { id: "none", label: "", damage: 1, control: 0 };
}
