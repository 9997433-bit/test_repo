export type DecorTheme = "spring" | "summer" | "autumn" | "winter" | "ink";

export interface DecorDef {
  id: string;
  name: string;
  theme: DecorTheme;
  cost: number;
  fragmentCost: number;
  unlockLevel: number;
  mood: number;
  glyph: string;
}

export const DECORATIONS: DecorDef[] = [
  { id: "lantern", name: "纱灯", theme: "spring", cost: 40, fragmentCost: 4, unlockLevel: 1, mood: 2, glyph: "灯" },
  { id: "path", name: "青石径", theme: "ink", cost: 55, fragmentCost: 6, unlockLevel: 2, mood: 3, glyph: "径" },
  { id: "pond", name: "锦鲤池", theme: "summer", cost: 120, fragmentCost: 10, unlockLevel: 4, mood: 6, glyph: "池" },
  { id: "pavilion", name: "半亭", theme: "ink", cost: 180, fragmentCost: 14, unlockLevel: 6, mood: 8, glyph: "亭" },
  { id: "screen", name: "花鸟屏风", theme: "autumn", cost: 90, fragmentCost: 8, unlockLevel: 3, mood: 4, glyph: "屏" },
  { id: "snowlion", name: "雪狮", theme: "winter", cost: 150, fragmentCost: 12, unlockLevel: 5, mood: 7, glyph: "狮" },
];

export const THEMES: { id: DecorTheme; name: string; ids: string[] }[] = [
  { id: "spring", name: "春晓", ids: ["lantern", "path"] },
  { id: "summer", name: "盛夏", ids: ["pond", "lantern"] },
  { id: "autumn", name: "秋宴", ids: ["screen", "path"] },
  { id: "winter", name: "冬雪", ids: ["snowlion", "lantern"] },
  { id: "ink", name: "墨雅", ids: ["pavilion", "path", "screen"] },
];
