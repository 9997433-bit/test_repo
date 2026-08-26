/** 庭院陈设：程序化 SVG 图形 + 舞台摆位（纯函数，无 DOM，可单测）。 */

import type { AnchorId } from "../systems/decorate";

export type DecorDepth = "far" | "near";

export interface DecorSlot {
  /** 舞台内百分比坐标，元素以自身中心对齐 */
  x: number;
  y: number;
  /** 宽度占舞台百分比 */
  w: number;
  /** 远景更淡更小，近景压在花圃前沿 */
  depth: DecorDepth;
}

const INK = "#3b2f24";
const WOOD = "#7a5a3a";
const WOOD_DARK = "#5c4028";
const TILE = "#4a5a63";
const TILE_DARK = "#33424a";
const STONE = "#9aa3a0";
const STONE_HI = "#bcc4c0";
const PAPER = "#efe6cf";
const SILK_RED = "#c1443b";
const SILK_HI = "#e0705f";
const GOLD = "#c9a227";
const BRONZE = "#a67c3a";
const WATER = "#8fc3d4";
const WATER_HI = "#cfe8ef";
const LEAF = "#5f8f57";
const STRAW = "#d3b169";
const SNOW = "#f2efe4";

/** 十二件陈设的固定摆位：远景沿两侧与天际，近景压在园前。 */
const SLOTS: Record<string, DecorSlot> = {
  lantern: { x: 8, y: 20, w: 8, depth: "near" },
  chimes: { x: 92, y: 13, w: 8, depth: "near" },
  path: { x: 44, y: 84, w: 38, depth: "far" },
  swing: { x: 82, y: 78, w: 16, depth: "near" },
  screen: { x: 70, y: 24, w: 17, depth: "far" },
  scarecrow: { x: 30, y: 22, w: 9, depth: "far" },
  pond: { x: 16, y: 86, w: 20, depth: "near" },
  snowlion: { x: 93, y: 55, w: 12, depth: "near" },
  brazier: { x: 7, y: 56, w: 11, depth: "near" },
  pavilion: { x: 15, y: 32, w: 24, depth: "far" },
  bridge: { x: 74, y: 92, w: 26, depth: "near" },
  moongate: { x: 88, y: 33, w: 15, depth: "far" },
};

/** 旧存档里的未知 id 也要有位置，按 id 散列落到备用位，避免叠在一起。 */
const FALLBACK_SLOTS: DecorSlot[] = [
  { x: 40, y: 16, w: 9, depth: "far" },
  { x: 60, y: 88, w: 9, depth: "near" },
  { x: 24, y: 68, w: 9, depth: "near" },
  { x: 76, y: 62, w: 9, depth: "near" },
  { x: 50, y: 30, w: 9, depth: "far" },
  { x: 34, y: 92, w: 9, depth: "near" },
];

/**
 * 八个锚位在舞台上的落点：全部贴着庭院四缘，绕开中央花圃网格与园心上空的驻园灵玉。
 * 锚位只定「在哪儿」与「远近」，每件陈设占多宽仍由自己的 `decorSlot(id).w` 决定。
 */
const ANCHOR_SLOTS: Record<AnchorId, Omit<DecorSlot, "w">> = {
  // 天际一带（花圃上沿之上）
  eave: { x: 8, y: 20, depth: "near" },
  "corner-north": { x: 30, y: 17, depth: "far" },
  gate: { x: 88, y: 27, depth: "far" },
  // 园前一带（花圃下沿之下）
  "path-west": { x: 8, y: 74, depth: "near" },
  pondside: { x: 20, y: 89, depth: "near" },
  heart: { x: 50, y: 93, depth: "near" },
  "path-east": { x: 78, y: 76, depth: "near" },
  "corner-south": { x: 94, y: 88, depth: "near" },
};

export function anchorSlot(anchor: AnchorId): Omit<DecorSlot, "w"> {
  return ANCHOR_SLOTS[anchor];
}

/** 某件陈设落在某锚位时的完整摆位：位置来自锚位，尺寸来自陈设本身。 */
export function placedSlot(id: string, anchor: AnchorId): DecorSlot {
  return { ...ANCHOR_SLOTS[anchor], w: decorSlot(id).w };
}

function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function decorSlot(id: string): DecorSlot {
  const slot = SLOTS[id];
  if (slot) return slot;
  const fallback = FALLBACK_SLOTS[hash(id) % FALLBACK_SLOTS.length];
  return fallback ?? { x: 50, y: 50, w: 9, depth: "far" };
}

export function hasDecorArt(id: string): boolean {
  return id in SLOTS;
}

function svg(vw: number, vh: number, body: string): string {
  return `<svg viewBox="0 0 ${vw} ${vh}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">${body}</svg>`;
}

function shadow(cx: number, cy: number, rx: number, ry = rx * 0.26): string {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="rgba(28,18,10,0.2)"/>`;
}

function lantern(): string {
  return svg(
    60,
    100,
    shadow(12, 95, 9) +
      `<rect x="9" y="14" width="6" height="80" rx="3" fill="${WOOD}"/>` +
      `<path d="M12 20 Q28 12 40 22" stroke="${WOOD_DARK}" stroke-width="3.4" fill="none" stroke-linecap="round"/>` +
      `<g class="d-sway d-hang">` +
      `<circle class="d-glow" cx="40" cy="50" r="26" fill="#f6c26b"/>` +
      `<path d="M40 22 V31" stroke="${WOOD_DARK}" stroke-width="1.6"/>` +
      `<rect x="31" y="30" width="18" height="5" rx="2.5" fill="${WOOD_DARK}"/>` +
      `<ellipse cx="40" cy="50" rx="14" ry="15" fill="${SILK_RED}"/>` +
      `<path d="M40 35 Q31 50 40 65" stroke="${SILK_HI}" stroke-width="1.4" fill="none" opacity="0.8"/>` +
      `<path d="M40 35 Q49 50 40 65" stroke="${SILK_HI}" stroke-width="1.4" fill="none" opacity="0.8"/>` +
      `<rect x="33" y="63" width="14" height="4" rx="2" fill="${WOOD_DARK}"/>` +
      `<path d="M40 67 V78" stroke="${GOLD}" stroke-width="1.8"/>` +
      `<path d="M36 78 L40 88 L44 78 Z" fill="${GOLD}"/>` +
      `</g>`,
  );
}

function chimes(): string {
  return svg(
    60,
    100,
    `<path d="M0 12 H56 L50 2 H6 Z" fill="${TILE}"/>` +
      `<rect x="4" y="12" width="46" height="7" rx="2" fill="${WOOD_DARK}"/>` +
      `<path d="M34 19 V28" stroke="${INK}" stroke-width="1.2"/>` +
      `<g class="d-sway d-hang">` +
      `<path d="M27 46 Q28 31 34 28 Q40 31 41 46 Z" fill="${BRONZE}"/>` +
      `<ellipse cx="34" cy="46" rx="7.2" ry="2.4" fill="#c79a4d"/>` +
      `<path d="M34 46 V54" stroke="${INK}" stroke-width="1"/>` +
      `<rect x="30" y="54" width="8" height="16" rx="2" fill="${PAPER}" stroke="${WOOD}" stroke-width="1"/>` +
      `<path d="M34 70 V82" stroke="${SILK_RED}" stroke-width="1.6"/>` +
      `<path d="M31 82 L34 90 L37 82 Z" fill="${SILK_RED}"/>` +
      `</g>`,
  );
}

function path(): string {
  let stones = "";
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const cx = 20 + t * 160;
    const cy = 46 - Math.sin(t * Math.PI) * 12;
    const rx = 15 - t * 4;
    stones +=
      `<ellipse cx="${cx.toFixed(1)}" cy="${(cy + 3).toFixed(1)}" rx="${rx.toFixed(1)}" ry="${(rx * 0.36).toFixed(1)}" fill="rgba(28,18,10,0.16)"/>` +
      `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${(rx * 0.36).toFixed(1)}" fill="${STONE}"/>` +
      `<ellipse cx="${(cx - rx * 0.2).toFixed(1)}" cy="${(cy - 1.4).toFixed(1)}" rx="${(rx * 0.6).toFixed(1)}" ry="${(rx * 0.16).toFixed(1)}" fill="${STONE_HI}" opacity="0.7"/>`;
  }
  let tufts = "";
  for (let i = 0; i < 5; i++) {
    const x = 30 + i * 34;
    tufts += `<path d="M${x} 56 q3 -8 6 0" stroke="${LEAF}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  }
  return svg(200, 60, stones + tufts);
}

function swing(): string {
  return svg(
    100,
    100,
    shadow(50, 94, 34, 6) +
      `<path d="M14 92 L32 30" stroke="${WOOD}" stroke-width="6" stroke-linecap="round"/>` +
      `<path d="M86 92 L68 30" stroke="${WOOD}" stroke-width="6" stroke-linecap="round"/>` +
      `<rect x="20" y="24" width="60" height="8" rx="4" fill="${WOOD_DARK}"/>` +
      `<path d="M22 32 Q36 40 50 32 Q64 40 78 32" stroke="${LEAF}" stroke-width="2.4" fill="none"/>` +
      `<circle cx="30" cy="37" r="3.4" fill="#f2a7bb"/><circle cx="50" cy="35" r="3" fill="#f7cad0"/><circle cx="70" cy="37" r="3.4" fill="#f2a7bb"/>` +
      `<g class="d-swing">` +
      `<path d="M36 32 V66" stroke="${INK}" stroke-width="1.6"/>` +
      `<path d="M64 32 V66" stroke="${INK}" stroke-width="1.6"/>` +
      `<rect x="30" y="66" width="40" height="7" rx="2.5" fill="${WOOD}"/>` +
      `</g>`,
  );
}

function screen(): string {
  const panel = (x: number, w: number, art: string): string =>
    `<rect x="${x}" y="10" width="${w}" height="58" rx="3" fill="${PAPER}" stroke="${WOOD}" stroke-width="3"/>${art}`;
  return svg(
    120,
    80,
    shadow(60, 72, 48, 5) +
      panel(
        6,
        32,
        `<path d="M12 56 Q20 38 32 28" stroke="${WOOD_DARK}" stroke-width="1.8" fill="none"/>` +
          `<circle cx="26" cy="34" r="2.6" fill="#f2a7bb"/><circle cx="18" cy="44" r="2.2" fill="#f7cad0"/>`,
      ) +
      panel(
        44,
        32,
        `<path d="M50 58 Q60 40 70 24" stroke="${WOOD_DARK}" stroke-width="1.8" fill="none"/>` +
          `<path d="M58 40 q6 -5 10 -1 q-5 1 -10 1Z" fill="${INK}"/>` +
          `<circle cx="64" cy="30" r="2.6" fill="${SILK_RED}"/>`,
      ) +
      panel(
        82,
        32,
        `<path d="M88 58 Q96 42 108 34" stroke="${WOOD_DARK}" stroke-width="1.8" fill="none"/>` +
          `<circle cx="100" cy="40" r="2.4" fill="#f2a7bb"/><circle cx="94" cy="50" r="2" fill="#f7cad0"/>`,
      ) +
      `<rect x="4" y="66" width="112" height="5" rx="2.5" fill="${WOOD_DARK}"/>`,
  );
}

function scarecrow(): string {
  let straw = "";
  for (let i = 0; i < 5; i++) {
    straw += `<path d="M35 74 L${26 + i * 4.5} 92" stroke="${STRAW}" stroke-width="2" stroke-linecap="round"/>`;
  }
  return svg(
    70,
    100,
    shadow(35, 94, 16, 4) +
      `<rect x="32" y="30" width="6" height="62" rx="2" fill="${WOOD}"/>` +
      `<rect x="12" y="44" width="46" height="5" rx="2.5" fill="${WOOD}"/>` +
      `<path d="M12 49 l-4 10" stroke="${STRAW}" stroke-width="2.2" stroke-linecap="round"/>` +
      `<path d="M58 49 l4 10" stroke="${STRAW}" stroke-width="2.2" stroke-linecap="round"/>` +
      `<path d="M22 54 H48 L44 74 H26 Z" fill="${SILK_RED}" opacity="0.85"/>` +
      straw +
      `<circle cx="35" cy="28" r="11" fill="${STRAW}"/>` +
      `<circle cx="31" cy="27" r="1.5" fill="${INK}"/><circle cx="39" cy="27" r="1.5" fill="${INK}"/>` +
      `<path d="M31 32 q4 3 8 0" stroke="${INK}" stroke-width="1.2" fill="none" stroke-linecap="round"/>` +
      `<path d="M21 22 Q35 2 49 22 Z" fill="#b98f4e"/>` +
      `<ellipse cx="35" cy="22" rx="17" ry="3.6" fill="#c99e58"/>`,
  );
}

function pond(): string {
  // 外层只承载 CSS 游动动画，内层保留定位 transform，二者互不覆盖。
  const koi = (x: number, y: number, flip: boolean, cls: string): string =>
    `<g class="${cls}"><g transform="translate(${x} ${y})${flip ? " scale(-1 1)" : ""}">` +
    `<ellipse cx="0" cy="0" rx="9" ry="3.6" fill="#e08a4a"/>` +
    `<path d="M8 0 L15 -4 L15 4 Z" fill="#e8a468"/>` +
    `<circle cx="-4" cy="-1" r="1.8" fill="#fff3e0" opacity="0.85"/>` +
    `</g></g>`;
  return svg(
    160,
    80,
    `<ellipse cx="80" cy="46" rx="72" ry="30" fill="${STONE}"/>` +
      `<ellipse cx="80" cy="45" rx="64" ry="25" fill="${WATER}"/>` +
      `<ellipse cx="66" cy="38" rx="34" ry="10" fill="${WATER_HI}" opacity="0.45"/>` +
      koi(58, 48, false, "d-koi") +
      koi(104, 40, true, "d-koi d-koi-b") +
      `<ellipse class="d-ripple" cx="96" cy="52" rx="12" ry="4.4" fill="none" stroke="${WATER_HI}" stroke-width="1.6"/>` +
      `<ellipse class="d-ripple d-ripple-b" cx="52" cy="36" rx="10" ry="3.6" fill="none" stroke="${WATER_HI}" stroke-width="1.4"/>` +
      `<ellipse cx="34" cy="50" rx="14" ry="5.4" fill="${LEAF}"/>` +
      `<path d="M34 50 L46 47" stroke="${WATER}" stroke-width="2"/>` +
      `<circle cx="40" cy="42" r="4.2" fill="#f7cad0"/><circle cx="40" cy="42" r="1.6" fill="${GOLD}"/>` +
      `<ellipse cx="122" cy="56" rx="10" ry="4" fill="${LEAF}" opacity="0.9"/>`,
  );
}

function snowlion(): string {
  let mane = "";
  for (let i = 0; i < 9; i++) {
    const a = (Math.PI * 2 * i) / 9;
    mane += `<circle cx="${(60 + Math.cos(a) * 16).toFixed(1)}" cy="${(34 + Math.sin(a) * 16).toFixed(1)}" r="5.4" fill="#dcd7c4"/>`;
  }
  return svg(
    90,
    80,
    shadow(46, 74, 32, 5) +
      `<ellipse cx="38" cy="54" rx="24" ry="17" fill="${SNOW}"/>` +
      `<path d="M18 66 q6 6 14 5" stroke="#d8d2be" stroke-width="3" fill="none" stroke-linecap="round"/>` +
      mane +
      `<circle cx="50" cy="22" r="4.6" fill="#e2ddca"/><circle cx="70" cy="22" r="4.6" fill="#e2ddca"/>` +
      `<circle cx="60" cy="34" r="15" fill="${SNOW}"/>` +
      `<circle cx="55" cy="31" r="1.9" fill="${INK}"/><circle cx="66" cy="31" r="1.9" fill="${INK}"/>` +
      `<path d="M57 38 q4 4 8 0" stroke="${INK}" stroke-width="1.4" fill="none" stroke-linecap="round"/>` +
      `<circle cx="61" cy="35" r="2.2" fill="#c98d84"/>` +
      `<path d="M50 22 Q62 12 74 24 Q62 18 50 22Z" fill="#ffffff"/>` +
      `<circle cx="74" cy="62" r="9" fill="#e6e1d0"/>` +
      `<path d="M67 60 q7 5 14 0" stroke="${GOLD}" stroke-width="1.6" fill="none"/>`,
  );
}

function brazier(): string {
  return svg(
    80,
    70,
    shadow(40, 64, 22, 4) +
      `<path d="M22 44 L16 64" stroke="${WOOD_DARK}" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M58 44 L64 64" stroke="${WOOD_DARK}" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M14 32 H66 L58 50 H22 Z" fill="${BRONZE}"/>` +
      `<ellipse cx="40" cy="32" rx="26" ry="6.5" fill="#c79a4d"/>` +
      `<ellipse cx="40" cy="32" rx="18" ry="4.2" fill="#8c4a20"/>` +
      `<circle class="d-glow" cx="40" cy="26" r="20" fill="#f6a13c"/>` +
      `<g class="d-flicker">` +
      `<path d="M40 30 Q31 18 40 4 Q49 18 40 30Z" fill="#f2913c"/>` +
      `<path d="M40 28 Q35 19 40 11 Q45 19 40 28Z" fill="#ffe0a0"/>` +
      `</g>` +
      `<path d="M18 38 H62" stroke="#8a6427" stroke-width="1.4" opacity="0.7"/>`,
  );
}

function pavilion(): string {
  return svg(
    160,
    110,
    shadow(80, 101, 58, 7) +
      `<rect x="30" y="92" width="100" height="8" rx="3" fill="${STONE}"/>` +
      `<rect x="36" y="88" width="88" height="5" rx="2" fill="${STONE_HI}"/>` +
      `<path d="M50 64 H110 V90 H50 Z" fill="rgba(52,70,80,0.16)"/>` +
      `<rect x="43" y="62" width="8" height="28" rx="3" fill="${WOOD_DARK}"/>` +
      `<rect x="109" y="62" width="8" height="28" rx="3" fill="${WOOD_DARK}"/>` +
      `<rect x="43" y="74" width="74" height="4" rx="2" fill="${WOOD}"/>` +
      `<path d="M56 78 V89 M68 78 V89 M80 78 V89 M92 78 V89 M104 78 V89" stroke="${WOOD}" stroke-width="2.2"/>` +
      `<path d="M46 30 H114 L142 58 H18 Z" fill="${TILE}"/>` +
      `<path d="M60 34 L50 58 M80 34 V58 M100 34 L110 58" stroke="${TILE_DARK}" stroke-width="1.6" opacity="0.55"/>` +
      `<path d="M18 58 Q8 50 2 53 Q12 60 16 64 Z" fill="${TILE}"/>` +
      `<path d="M142 58 Q152 50 158 53 Q148 60 144 64 Z" fill="${TILE}"/>` +
      `<path d="M16 58 H144 L140 65 H20 Z" fill="${TILE_DARK}"/>` +
      `<path d="M44 30 H116 L120 36 H40 Z" fill="${TILE_DARK}"/>` +
      `<path d="M80 30 V21" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>` +
      `<circle cx="80" cy="18" r="3.6" fill="${GOLD}"/>`,
  );
}

function bridge(): string {
  let posts = "";
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const x = 24 + t * 152;
    const yDeck = 66 - Math.sin(t * Math.PI) * 26;
    posts += `<path d="M${x.toFixed(1)} ${yDeck.toFixed(1)} V${(yDeck - 13).toFixed(1)}" stroke="${WOOD}" stroke-width="2.4" stroke-linecap="round"/>`;
  }
  return svg(
    200,
    80,
    `<path d="M4 72 q22 -5 44 0 q22 5 44 0 q22 -5 44 0 q22 5 44 0" stroke="${WATER}" stroke-width="2.4" fill="none" opacity="0.75"/>` +
      `<path d="M10 70 Q100 8 190 70 L190 76 Q100 18 10 76 Z" fill="${STONE}"/>` +
      `<path d="M14 68 Q100 12 186 68" stroke="${STONE_HI}" stroke-width="2" fill="none"/>` +
      posts +
      `<path d="M24 53 Q100 -1 176 53" stroke="${WOOD_DARK}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  );
}

function moongate(): string {
  return svg(
    100,
    110,
    shadow(50, 104, 44, 5) +
      `<path d="M6 26 H94 V102 H6 Z" fill="#e8ddc4"/>` +
      `<path d="M0 26 H100 L92 16 H8 Z" fill="${TILE}"/>` +
      `<circle cx="50" cy="64" r="31" fill="#cfe0cb"/>` +
      `<path d="M22 74 q12 -14 26 -6 q10 -12 22 2 q-24 10 -48 4Z" fill="#a9c3a2"/>` +
      `<circle cx="50" cy="64" r="31" fill="none" stroke="#cbbfa4" stroke-width="3.4"/>` +
      `<path d="M40 92 q4 -12 10 -14 q6 2 10 14Z" fill="${LEAF}" opacity="0.9"/>` +
      `<circle cx="44" cy="84" r="2.6" fill="#f2a7bb"/><circle cx="56" cy="86" r="2.2" fill="#f7cad0"/>` +
      `<path d="M6 102 H94" stroke="${STONE}" stroke-width="4"/>`,
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

/** 未知 id（旧存档/自定义）退化为纸牌立牌，仍能看见落位。 */
function placard(glyph: string): string {
  return svg(
    80,
    80,
    shadow(40, 74, 18, 4) +
      `<path d="M38 56 H42 V74 H38 Z" fill="${WOOD_DARK}"/>` +
      `<rect x="10" y="8" width="60" height="48" rx="6" fill="${PAPER}" stroke="${WOOD}" stroke-width="3" stroke-dasharray="6 4"/>` +
      `<text x="40" y="41" text-anchor="middle" font-size="28" font-family="serif" fill="${INK}">${glyph}</text>`,
  );
}

/**
 * 取一件陈设的场景图形。已知 id 用专属 SVG；未知 id 用 glyph 立牌兜底。
 * glyph 由调用方给出（通常是首字），确保纯函数不依赖数据表之外的状态。
 */
export function decorArt(id: string, glyph: string): string {
  const draw = ART[id];
  return draw ? draw() : placard(glyph.slice(0, 1) || "饰");
}
