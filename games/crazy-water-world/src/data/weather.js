export const WEATHERS = {
  clear: { id: "clear", name: "晴朗", salvage: 1, prod: 1, damage: 0, sky: ["#7ec8e3", "#0e7c8a"] },
  haze: { id: "haze", name: "薄雾", salvage: 0.85, prod: 0.95, damage: 0, sky: ["#9bb7c4", "#3d6d78"] },
  rain: { id: "rain", name: "暴雨", salvage: 0.7, prod: 0.8, damage: 0, sky: ["#4a6270", "#16323c"] },
  storm: { id: "storm", name: "风暴", salvage: 0.4, prod: 0.55, damage: 0.8, sky: ["#1b2a33", "#06151b"] },
  tsunami: { id: "tsunami", name: "海啸预警", salvage: 0.2, prod: 0.35, damage: 2.2, sky: ["#14243a", "#3a1020"] },
};

export const WEATHER_WEIGHTS = [
  ["clear", 48],
  ["haze", 18],
  ["rain", 18],
  ["storm", 12],
  ["tsunami", 4],
];
