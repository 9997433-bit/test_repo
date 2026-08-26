export const STAGES = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1;
  const shark = n % 5 === 0;
  return {
    id: n,
    name: shark ? `海域霸主 · ${n}` : `废海航线 ${n}`,
    exp: 30,
    hourglass: 6,
    enemies: [
      { key: "raider", name: "海盗杂兵", hp: 90 + n * 18, atk: 12 + n * 2, def: 4, spd: 90, lane: "front" },
      { key: "raider", name: "海盗杂兵", hp: 80 + n * 16, atk: 11 + n * 2, def: 3, spd: 92, lane: "front" },
      { key: "gunner", name: "甲板火枪", hp: 70 + n * 14, atk: 16 + n * 3, def: 2, spd: 100, lane: "back" },
      shark
        ? { key: "shark", name: "巨齿鲨", hp: 220 + n * 24, atk: 22 + n * 3, def: 8, spd: 86, lane: "front" }
        : { key: "gunner", name: "甲板火枪", hp: 70 + n * 14, atk: 16 + n * 3, def: 2, spd: 98, lane: "back" },
    ],
  };
});
