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

// 定价基准：cost ≈ mood × 20~24；fragmentCost ≈ cost / 12。
export const DECORATIONS: DecorDef[] = [
  { id: "lantern", name: "纱灯", theme: "spring", cost: 40, fragmentCost: 4, unlockLevel: 1, mood: 2, glyph: "灯" },
  { id: "chimes", name: "檐下风铃", theme: "summer", cost: 45, fragmentCost: 4, unlockLevel: 1, mood: 2, glyph: "铃" },
  { id: "path", name: "青石径", theme: "ink", cost: 55, fragmentCost: 6, unlockLevel: 2, mood: 3, glyph: "径" },
  { id: "swing", name: "花架秋千", theme: "spring", cost: 70, fragmentCost: 6, unlockLevel: 2, mood: 3, glyph: "架" },
  { id: "screen", name: "花鸟屏风", theme: "autumn", cost: 90, fragmentCost: 8, unlockLevel: 3, mood: 4, glyph: "屏" },
  { id: "scarecrow", name: "稻草翁", theme: "autumn", cost: 60, fragmentCost: 5, unlockLevel: 3, mood: 3, glyph: "翁" },
  { id: "pond", name: "锦鲤池", theme: "summer", cost: 120, fragmentCost: 10, unlockLevel: 4, mood: 6, glyph: "池" },
  { id: "snowlion", name: "雪狮", theme: "winter", cost: 150, fragmentCost: 12, unlockLevel: 5, mood: 7, glyph: "狮" },
  { id: "brazier", name: "暖手铜炉", theme: "winter", cost: 110, fragmentCost: 9, unlockLevel: 5, mood: 5, glyph: "炉" },
  { id: "pavilion", name: "半亭", theme: "ink", cost: 180, fragmentCost: 14, unlockLevel: 6, mood: 8, glyph: "亭" },
  { id: "bridge", name: "九曲小桥", theme: "summer", cost: 200, fragmentCost: 16, unlockLevel: 7, mood: 9, glyph: "桥" },
  { id: "moongate", name: "月洞门", theme: "ink", cost: 240, fragmentCost: 18, unlockLevel: 8, mood: 10, glyph: "门" },
];

export const THEMES: { id: DecorTheme; name: string; ids: string[] }[] = [
  { id: "spring", name: "春晓", ids: ["lantern", "swing", "path"] },
  { id: "summer", name: "盛夏", ids: ["pond", "chimes", "bridge"] },
  { id: "autumn", name: "秋宴", ids: ["screen", "scarecrow", "path"] },
  { id: "winter", name: "冬雪", ids: ["snowlion", "brazier", "lantern"] },
  { id: "ink", name: "墨雅", ids: ["pavilion", "moongate", "path", "screen"] },
];

export const THEME_NAMES: Record<DecorTheme, string> = Object.fromEntries(
  THEMES.map((t) => [t.id, t.name]),
) as Record<DecorTheme, string>;

// ---------------------------------------------------------------------------
// 锚位制摆放（见 docs/UX.md 七）：庭院四缘 8 个锚位，每锚至多一件陈设。
// 锚位只有 id 与名号属于数据层；舞台坐标归 scene/decor-art.ts。
// ---------------------------------------------------------------------------

export interface AnchorDef {
  id: string;
  name: string;
}

export const ANCHORS: AnchorDef[] = [
  { id: "eaves", name: "檐下" },
  { id: "gate", name: "门前" },
  { id: "wall-north", name: "墙角北" },
  { id: "heart", name: "园心" },
  { id: "path-west", name: "径旁西" },
  { id: "path-east", name: "径旁东" },
  { id: "pond-side", name: "池畔" },
  { id: "wall-south", name: "墙角南" },
];

export const ANCHOR_MAP = Object.fromEntries(ANCHORS.map((a) => [a.id, a])) as Record<string, AnchorDef>;

export function anchorName(id: string | null | undefined): string {
  return (id && ANCHOR_MAP[id]?.name) || "在匣";
}
