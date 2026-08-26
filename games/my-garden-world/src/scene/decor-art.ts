// 庭院陈设的程序化国风 SVG 与落位表。
// 每件装饰有固定的构图席位（x=中心百分位，w=基准宽度，layer=远近层），
// 保证任意购买顺序下庭院都是一幅排好的画，而不是一排 chip。

export type DecorLayer = "back" | "mid" | "front";

export interface DecorSlot {
  /** 席位中心在庭院带上的水平百分位（0-100）。 */
  x: number;
  /** 基准宽度 px（移动端由 --decor-scale 统一缩放）。 */
  w: number;
  layer: DecorLayer;
}

export const DECOR_SLOTS: Record<string, DecorSlot> = {
  moongate: { x: 7, w: 86, layer: "back" },
  pavilion: { x: 90, w: 104, layer: "back" },
  bridge: { x: 30, w: 128, layer: "back" },
  screen: { x: 63, w: 84, layer: "back" },
  swing: { x: 46, w: 76, layer: "back" },
  pond: { x: 16, w: 112, layer: "mid" },
  path: { x: 50, w: 148, layer: "mid" },
  lantern: { x: 37, w: 42, layer: "front" },
  brazier: { x: 56, w: 40, layer: "front" },
  scarecrow: { x: 70, w: 50, layer: "front" },
  snowlion: { x: 80, w: 50, layer: "front" },
  chimes: { x: 96, w: 32, layer: "front" },
};

const INK = "#4c3e2d";
const WOOD = "#6b4a33";
const WOOD_DARK = "#4c3323";
const STONE = "#8b8378";
const STONE_DARK = "#6e675d";
const PAPER = "#f2e9d2";
const RED = "#b23a2c";
const RED_HI = "#d0503a";
const GOLD = "#c9a227";
const JADE = "#4f8068";
const WATER = "#7db3cc";
const WATER_DEEP = "#4a7fae";
const SNOW = "#edf2f6";
const STRAW = "#d8b46a";

function svg(viewBox: string, body: string): string {
  return `<svg viewBox="${viewBox}" aria-hidden="true" focusable="false">${body}</svg>`;
}

/** 纱灯：木杆挑起一盏朱纱灯，入夜自明（lamp-glow 由 CSS 点亮）。 */
function lantern(): string {
  return svg(
    "0 0 60 100",
    `<ellipse cx="30" cy="96" rx="14" ry="4" fill="rgba(0,0,0,0.15)"/>` +
      `<rect x="27" y="26" width="4.5" height="70" rx="2" fill="${WOOD_DARK}"/>` +
      `<path d="M29 28 Q29 12 46 13" stroke="${WOOD}" stroke-width="3.5" fill="none" stroke-linecap="round"/>` +
      `<g class="dangle">` +
      `<line x1="46" y1="13" x2="46" y2="23" stroke="${WOOD_DARK}" stroke-width="2"/>` +
      `<circle class="lamp-glow" cx="46" cy="37" r="17" fill="#ffd98a" opacity="0"/>` +
      `<rect x="40" y="21" width="12" height="4" rx="2" fill="${GOLD}"/>` +
      `<ellipse cx="46" cy="37" rx="10" ry="13" fill="${RED_HI}"/>` +
      `<ellipse cx="46" cy="37" rx="6" ry="13" fill="none" stroke="rgba(246,238,216,0.55)" stroke-width="1.2"/>` +
      `<ellipse cx="46" cy="37" rx="10" ry="7" fill="none" stroke="rgba(246,238,216,0.35)" stroke-width="1"/>` +
      `<rect x="41" y="49" width="10" height="3.5" rx="1.6" fill="${GOLD}"/>` +
      `<line x1="46" y1="53" x2="46" y2="61" stroke="${GOLD}" stroke-width="1.6"/>` +
      `<path d="M44 61 L48 61 L46 66 Z" fill="${RED}"/>` +
      `</g>`,
  );
}

/** 檐下风铃：短檐一角，三管铜铃随风轻晃。 */
function chimes(): string {
  const tube = (x: number, h: number, cls: string): string =>
    `<g class="dangle ${cls}"><line x1="${x}" y1="24" x2="${x}" y2="${30 + 0}" stroke="${WOOD_DARK}" stroke-width="1.2"/>` +
    `<rect x="${x - 2}" y="30" width="4" height="${h}" rx="2" fill="${GOLD}"/>` +
    `<circle cx="${x}" cy="${34 + h}" r="1.6" fill="${RED}"/></g>`;
  return svg(
    "0 0 50 100",
    `<path d="M2 14 Q25 4 48 14 L44 20 Q25 12 6 20 Z" fill="${INK}"/>` +
      `<rect x="21" y="17" width="8" height="6" rx="2" fill="${WOOD}"/>` +
      `<circle cx="25" cy="26" r="5" fill="${GOLD}"/>` +
      tube(15, 22, "d1") +
      tube(25, 30, "d2") +
      tube(35, 25, "d3"),
  );
}

/** 青石径：五方卧石，缀一点苔色。 */
function path(): string {
  const stone = (x: number, y: number, rx: number, ry: number, tone: string): string =>
    `<ellipse cx="${x}" cy="${y + 1.6}" rx="${rx}" ry="${ry}" fill="rgba(0,0,0,0.14)"/>` +
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${tone}"/>`;
  return svg(
    "0 0 160 36",
    stone(18, 26, 14, 6, STONE) +
      stone(54, 20, 16, 7, STONE_DARK) +
      stone(90, 27, 13, 6, STONE) +
      stone(122, 21, 15, 6.5, STONE_DARK) +
      stone(148, 26, 10, 5, STONE) +
      `<circle cx="40" cy="30" r="2.2" fill="${JADE}" opacity="0.7"/>` +
      `<circle cx="106" cy="30" r="1.8" fill="${JADE}" opacity="0.6"/>`,
  );
}

/** 花架秋千：藤蔓木架，坐板悬空轻荡。 */
function swing(): string {
  return svg(
    "0 0 90 100",
    `<ellipse cx="45" cy="96" rx="34" ry="4" fill="rgba(0,0,0,0.14)"/>` +
      `<path d="M12 96 L22 20" stroke="${WOOD}" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="M78 96 L68 20" stroke="${WOOD}" stroke-width="5" stroke-linecap="round"/>` +
      `<rect x="10" y="16" width="70" height="6" rx="3" fill="${WOOD_DARK}"/>` +
      `<path d="M12 18 Q30 8 48 16 Q66 24 80 14" stroke="${JADE}" stroke-width="2.4" fill="none"/>` +
      `<circle cx="26" cy="12" r="3.4" fill="#f7cad0"/><circle cx="47" cy="14" r="3" fill="#e46a86"/><circle cx="66" cy="17" r="3.4" fill="#f7cad0"/>` +
      `<g class="dangle"><line x1="34" y1="22" x2="34" y2="62" stroke="${INK}" stroke-width="1.8"/>` +
      `<line x1="56" y1="22" x2="56" y2="62" stroke="${INK}" stroke-width="1.8"/>` +
      `<rect x="28" y="62" width="34" height="5" rx="2.5" fill="${WOOD_DARK}"/></g>`,
  );
}

/** 花鸟屏风：三扇绢面，中扇栖一只朱冠雀。 */
function screen(): string {
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${PAPER}" stroke="${WOOD}" stroke-width="2.4"/>`;
  return svg(
    "0 0 90 84",
    `<ellipse cx="45" cy="80" rx="38" ry="4" fill="rgba(0,0,0,0.14)"/>` +
      panel(4, 16, 25, 60) +
      panel(60, 16, 25, 60) +
      panel(31, 10, 27, 66) +
      `<path d="M36 62 Q44 44 40 28 M40 42 Q48 38 52 30" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/>` +
      `<circle cx="52" cy="27" r="4" fill="${INK}"/>` +
      `<circle cx="53.5" cy="25" r="1.4" fill="${RED}"/>` +
      `<path d="M48 28 Q44 31 45 34" stroke="${INK}" stroke-width="1.6" fill="none"/>` +
      `<circle cx="12" cy="34" r="2.6" fill="#e46a86" opacity="0.85"/><circle cx="74" cy="52" r="2.6" fill="#f4a261" opacity="0.85"/>`,
  );
}

/** 稻草翁：草帽布衣，替花圃望着雀儿。 */
function scarecrow(): string {
  return svg(
    "0 0 60 100",
    `<ellipse cx="30" cy="96" rx="12" ry="3.5" fill="rgba(0,0,0,0.15)"/>` +
      `<rect x="28" y="44" width="4" height="52" fill="${WOOD_DARK}"/>` +
      `<rect x="8" y="48" width="44" height="4" rx="2" fill="${WOOD}"/>` +
      `<path d="M18 52 L42 52 L38 88 Q30 92 22 88 Z" fill="${STRAW}"/>` +
      `<rect x="25" y="62" width="8" height="8" fill="${RED}" opacity="0.85" transform="rotate(6 29 66)"/>` +
      `<path d="M22 88 L20 95 M27 90 L26 97 M33 90 L34 97 M38 88 L40 95" stroke="${STRAW}" stroke-width="1.8" stroke-linecap="round"/>` +
      `<circle cx="30" cy="35" r="10" fill="#e8d9a0"/>` +
      `<circle cx="26.5" cy="34" r="1.3" fill="${INK}"/><circle cx="33.5" cy="34" r="1.3" fill="${INK}"/>` +
      `<path d="M27 39 Q30 41 33 39" stroke="${INK}" stroke-width="1.2" fill="none" stroke-linecap="round"/>` +
      `<path d="M14 28 L46 28 L30 12 Z" fill="#b3822e"/>` +
      `<ellipse cx="30" cy="28" rx="17" ry="3.5" fill="#8a5a2b"/>`,
  );
}

/** 锦鲤池：石沿一泓，两尾锦鲤慢游，浮一片莲叶。 */
function pond(): string {
  return svg(
    "0 0 120 62",
    `<ellipse cx="60" cy="40" rx="56" ry="19" fill="${STONE}"/>` +
      `<ellipse cx="60" cy="38" rx="56" ry="18" fill="${STONE_DARK}"/>` +
      `<ellipse cx="60" cy="38" rx="48" ry="14" fill="${WATER}"/>` +
      `<ellipse cx="60" cy="39" rx="34" ry="9" fill="${WATER_DEEP}" opacity="0.45"/>` +
      `<path d="M28 34 Q38 31 48 34" stroke="rgba(255,255,255,0.5)" stroke-width="1.4" fill="none"/>` +
      `<path d="M72 43 Q82 40 92 43" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" fill="none"/>` +
      `<g class="koi k1"><ellipse cx="48" cy="40" rx="8" ry="3.2" fill="#e07840"/>` +
      `<path d="M56 40 L62 37 L62 43 Z" fill="#e07840"/><circle cx="44" cy="39.4" r="0.9" fill="${INK}"/></g>` +
      `<g class="koi k2"><ellipse cx="76" cy="35" rx="6.5" ry="2.6" fill="${SNOW}"/>` +
      `<path d="M69.5 35 L64.5 32.6 L64.5 37.4 Z" fill="${SNOW}"/><circle cx="74" cy="34" r="1.4" fill="${RED}"/></g>` +
      `<circle cx="88" cy="33" r="6" fill="${JADE}"/>` +
      `<path d="M88 33 L95 30 L94 36 Z" fill="${WATER}"/>` +
      `<circle cx="93" cy="27" r="2.4" fill="#f6d5e0"/>`,
  );
}

/** 雪狮：卷鬃石狮蹲于座上，颈系一铃。 */
function snowlion(): string {
  const curl = (x: number, y: number): string => `<circle cx="${x}" cy="${y}" r="4.2" fill="#dfe8ee"/>`;
  return svg(
    "0 0 60 84",
    `<rect x="8" y="70" width="44" height="10" rx="2.5" fill="${STONE}"/>` +
      `<rect x="8" y="70" width="44" height="3" fill="${STONE_DARK}"/>` +
      `<path d="M18 70 Q12 52 22 42 Q14 38 18 28 Q24 16 36 18 Q48 20 48 32 Q48 40 42 44 Q50 54 44 70 Z" fill="${SNOW}" stroke="#b9c4cc" stroke-width="1.6"/>` +
      curl(24, 24) + curl(32, 19) + curl(40, 23) + curl(44, 31) + curl(20, 31) +
      `<circle cx="29" cy="30" r="1.8" fill="${INK}"/><circle cx="38" cy="31" r="1.8" fill="${INK}"/>` +
      `<path d="M31 36 Q34 38.5 37 36.5" stroke="${INK}" stroke-width="1.5" fill="none" stroke-linecap="round"/>` +
      `<path d="M26 42 Q33 46 41 43" stroke="#b9c4cc" stroke-width="1.4" fill="none"/>` +
      `<circle cx="33" cy="44" r="2.2" fill="${RED}"/>` +
      `<rect x="20" y="58" width="6" height="12" rx="3" fill="${SNOW}" stroke="#b9c4cc" stroke-width="1.2"/>` +
      `<rect x="36" y="58" width="6" height="12" rx="3" fill="${SNOW}" stroke="#b9c4cc" stroke-width="1.2"/>` +
      `<path d="M46 56 Q56 50 50 42" stroke="#dfe8ee" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  );
}

/** 暖手铜炉：三足铜盆盛炭，冷夜有微光。 */
function brazier(): string {
  return svg(
    "0 0 50 66",
    `<ellipse cx="25" cy="62" rx="16" ry="3.5" fill="rgba(0,0,0,0.16)"/>` +
      `<line x1="14" y1="46" x2="10" y2="60" stroke="${WOOD_DARK}" stroke-width="3" stroke-linecap="round"/>` +
      `<line x1="36" y1="46" x2="40" y2="60" stroke="${WOOD_DARK}" stroke-width="3" stroke-linecap="round"/>` +
      `<line x1="25" y1="48" x2="25" y2="61" stroke="${WOOD_DARK}" stroke-width="3" stroke-linecap="round"/>` +
      `<circle class="lamp-glow" cx="25" cy="32" r="15" fill="#ffb37a" opacity="0"/>` +
      `<path d="M7 32 Q25 52 43 32 L43 36 Q25 54 7 36 Z" fill="#8a6a3a"/>` +
      `<path d="M7 32 Q25 50 43 32" fill="#a8834a"/>` +
      `<ellipse cx="25" cy="32" rx="18" ry="4.5" fill="#6f5433"/>` +
      `<circle cx="19" cy="31" r="3" fill="${RED_HI}"/><circle cx="27" cy="30" r="3.4" fill="#f4a261"/><circle cx="33" cy="31.5" r="2.6" fill="${RED}"/>` +
      `<path d="M5 30 Q2 26 6 24 M45 30 Q48 26 44 24" stroke="#8a6a3a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  );
}

/** 半亭：朱柱青瓦，檐下悬一盏小灯。 */
function pavilion(): string {
  return svg(
    "0 0 110 100",
    `<ellipse cx="55" cy="94" rx="46" ry="5" fill="rgba(0,0,0,0.15)"/>` +
      `<rect x="14" y="82" width="82" height="9" rx="2" fill="${STONE}"/>` +
      `<rect x="14" y="82" width="82" height="3" fill="${STONE_DARK}"/>` +
      `<rect x="24" y="42" width="5.5" height="40" fill="${RED}"/>` +
      `<rect x="80.5" y="42" width="5.5" height="40" fill="${RED}"/>` +
      `<rect x="24" y="64" width="62" height="3.5" fill="${WOOD}"/>` +
      `<line x1="38" y1="67" x2="38" y2="82" stroke="${WOOD_DARK}" stroke-width="2"/>` +
      `<line x1="55" y1="67" x2="55" y2="82" stroke="${WOOD_DARK}" stroke-width="2"/>` +
      `<line x1="72" y1="67" x2="72" y2="82" stroke="${WOOD_DARK}" stroke-width="2"/>` +
      `<g class="dangle"><line x1="55" y1="40" x2="55" y2="46" stroke="${WOOD_DARK}" stroke-width="1.6"/>` +
      `<circle class="lamp-glow" cx="55" cy="52" r="10" fill="#ffd98a" opacity="0"/>` +
      `<ellipse cx="55" cy="52" rx="5" ry="6" fill="${GOLD}"/></g>` +
      `<path d="M4 44 C22 16 88 16 106 44 C86 34 24 34 4 44 Z" fill="${INK}"/>` +
      `<path d="M4 44 Q2 38 8 34 M106 44 Q108 38 102 34" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>` +
      `<rect x="52" y="12" width="6" height="8" rx="2" fill="${GOLD}"/>`,
  );
}

/** 九曲小桥：石拱一道，栏影横斜。 */
function bridge(): string {
  const post = (x: number, y: number): string =>
    `<rect x="${x - 1.6}" y="${y}" width="3.2" height="12" rx="1.4" fill="${WOOD_DARK}"/>`;
  return svg(
    "0 0 130 58",
    `<path d="M2 56 Q65 6 128 56 L116 56 Q65 22 14 56 Z" fill="${STONE}"/>` +
      `<path d="M14 56 Q65 22 116 56" stroke="${STONE_DARK}" stroke-width="2.4" fill="none"/>` +
      post(22, 38) + post(43, 26.5) + post(65, 23) + post(87, 26.5) + post(108, 38) +
      `<path d="M22 38 Q65 10 108 38" stroke="${WOOD}" stroke-width="3" fill="none"/>`,
  );
}

/** 月洞门：粉墙开月，门里透着天光竹影。 */
function moongate(): string {
  return svg(
    "0 0 90 100",
    `<path d="M0 24 H90 V96 H0 Z M73 62 A28 28 0 1 1 17 62 A28 28 0 1 1 73 62 Z" fill="#ded4bc" fill-rule="evenodd"/>` +
      `<path d="M0 24 H90 V96 H0 Z M73 62 A28 28 0 1 1 17 62 A28 28 0 1 1 73 62 Z" fill="rgba(0,0,0,0.06)" fill-rule="evenodd"/>` +
      `<rect x="-2" y="16" width="94" height="9" rx="3" fill="${INK}"/>` +
      `<circle cx="45" cy="62" r="28" fill="none" stroke="${WOOD}" stroke-width="3"/>` +
      `<path d="M34 88 Q33 72 36 62 M40 88 Q40 76 43 68" stroke="${JADE}" stroke-width="1.8" fill="none" stroke-linecap="round"/>` +
      `<path d="M36 66 L30 62 M42 72 L37 69" stroke="${JADE}" stroke-width="1.4" stroke-linecap="round"/>`,
  );
}

const ART: Record<string, () => string> = {
  lantern,
  chimes,
  path,
  swing,
  screen,
  scarecrow,
  pond,
  snowlion,
  brazier,
  pavilion,
  bridge,
  moongate,
};

/** 按装饰 id 生成场景 SVG；未知 id 返回空串（老档中的脏数据直接跳过）。 */
export function decorArt(id: string): string {
  return ART[id]?.() ?? "";
}
