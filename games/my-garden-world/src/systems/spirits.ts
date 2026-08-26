import { SPIRITS, type SpiritDef } from "../data/spirits";
import { emit } from "../engine/events";
import type { GameState } from "../engine/state";

export function refreshSpirits(state: GameState): void {
  for (const s of SPIRITS) {
    if (state.level >= s.unlockLevel && !state.unlockedSpirits.includes(s.id)) {
      state.unlockedSpirits.push(s.id);
      emit({ type: "toast", text: `花灵苏醒 · ${s.name}`, tone: "rare" });
    }
  }
}

export function setSpirit(state: GameState, id: string | null): void {
  if (id && !state.unlockedSpirits.includes(id)) return;
  state.activeSpirit = id;
  const s = SPIRITS.find((x) => x.id === id);
  if (s) emit({ type: "toast", text: s.line, tone: "rare" });
}

export function tickSpirits(state: GameState, _dt: number): void {
  refreshSpirits(state);
}

// ---------------------------------------------------------------------------
// 花灵形象：程序化 SVG（纯函数，可测试），面板 / HUD / 提示条 / 场景通用。
// 统一骨架＝光晕 + 冠饰 + 灵核 + 衣袂，冠饰区分五灵，保证一家眷属的辨识度。
// ---------------------------------------------------------------------------

export interface SpiritPalette {
  /** 主色：衣袂与冠饰 */
  core: string;
  /** 辉色：光晕与高光 */
  aura: string;
  /** 墨色：勾线与文字 */
  ink: string;
}

export interface SpiritVisual {
  id: string;
  /** 意象名，用于文案与无障碍描述 */
  motif: string;
  palette: SpiritPalette;
  /** 场景中随行时的建议参数，供场景层直接取用 */
  orbit: { radiusPct: number; periodMs: number; bobPx: number; scale: number };
}

/** 未请灵 / 未苏醒时的水墨底色 */
const INK_PALETTE: SpiritPalette = { core: "#b7b0a2", aura: "#e2dcd0", ink: "#6d675c" };

export const SPIRIT_VISUALS: Record<string, SpiritVisual> = {
  juyue: {
    id: "juyue",
    motif: "金菊承月",
    palette: { core: "#f0bc4c", aura: "#ffeab3", ink: "#8a6a22" },
    orbit: { radiusPct: 26, periodMs: 9200, bobPx: 7, scale: 1 },
  },
  chiguang: {
    id: "chiguang",
    motif: "荷影池光",
    palette: { core: "#68c3c0", aura: "#cff2ee", ink: "#2f6f6b" },
    orbit: { radiusPct: 32, periodMs: 7600, bobPx: 5, scale: 0.96 },
  },
  rainbow: {
    id: "rainbow",
    motif: "虹翅穿花",
    palette: { core: "#c493df", aura: "#ffd8ec", ink: "#6b4a86" },
    orbit: { radiusPct: 38, periodMs: 5400, bobPx: 10, scale: 0.9 },
  },
  xueyi: {
    id: "xueyi",
    motif: "雪衣覆枝",
    palette: { core: "#cfe0f2", aura: "#ffffff", ink: "#5d7591" },
    orbit: { radiusPct: 22, periodMs: 11_000, bobPx: 4, scale: 1.04 },
  },
  suideng: {
    id: "suideng",
    motif: "岁灯长明",
    palette: { core: "#dd5741", aura: "#ffd096", ink: "#8c2f22" },
    orbit: { radiusPct: 18, periodMs: 12_800, bobPx: 3, scale: 1.1 },
  },
};

/** 场景 / CSS / 音景共用的根节点挂钩：HUD 每帧把当前花灵写在这里。 */
export const SPIRIT_ATTR = "data-spirit";

export function spiritById(id: string | null | undefined): SpiritDef | undefined {
  return id ? SPIRITS.find((s) => s.id === id) : undefined;
}

/** 提示条用：认出「花灵苏醒 · X」与花灵台词，好配上形象与专属音色。 */
export function spiritForToast(text: string): SpiritDef | undefined {
  return SPIRITS.find((s) => s.line === text || text.includes(`花灵苏醒 · ${s.name}`));
}

export function motionAllowed(): boolean {
  if (typeof matchMedia !== "function") return true;
  return !matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function anim(attr: string, values: string, dur: string): string {
  return `<animate attributeName="${attr}" values="${values}" dur="${dur}" repeatCount="indefinite"/>`;
}

function halo(key: string, p: SpiritPalette, motion: boolean): string {
  return (
    `<defs><radialGradient id="halo-${key}" cx="50%" cy="44%" r="54%">` +
    `<stop offset="0%" stop-color="${p.aura}" stop-opacity="0.92"/>` +
    `<stop offset="58%" stop-color="${p.core}" stop-opacity="0.34"/>` +
    `<stop offset="100%" stop-color="${p.core}" stop-opacity="0"/>` +
    `</radialGradient></defs>` +
    `<circle cx="32" cy="29" r="25" fill="url(#halo-${key})">${motion ? anim("opacity", "0.72;1;0.72", "4.6s") : ""}</circle>`
  );
}

function robe(p: SpiritPalette, motion: boolean): string {
  const sway = motion
    ? `<animateTransform attributeName="transform" type="rotate" values="-2.4 32 34;2.4 32 34;-2.4 32 34" dur="5.6s" repeatCount="indefinite"/>`
    : "";
  return (
    `<g>${sway}` +
    `<path d="M32 33 C23 38 19 47 18 56 C25 58.4 39 58.4 46 56 C45 47 41 38 32 33Z" fill="${p.core}" opacity="0.88"/>` +
    `<path d="M32 34 C29.4 42 29.2 50 30 56.6 L34 56.6 C34.8 50 34.6 42 32 34Z" fill="${p.aura}" opacity="0.48"/>` +
    `<path d="M21 40 C13.5 44 11.5 50 12.5 55.5" stroke="${p.aura}" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.78"/>` +
    `<path d="M43 40 C50.5 44 52.5 50 51.5 55.5" stroke="${p.aura}" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.78"/>` +
    `</g>`
  );
}

function spiritCore(p: SpiritPalette): string {
  return (
    `<circle cx="32" cy="27" r="6.4" fill="#fffaf0" opacity="0.94"/>` +
    `<circle cx="32" cy="27" r="6.4" fill="${p.core}" opacity="0.32"/>` +
    `<circle cx="29.8" cy="24.8" r="1.7" fill="#fffdf5" opacity="0.9"/>`
  );
}

function petalRing(cx: number, cy: number, rx: number, ry: number, fill: string, count: number, offsetDeg: number, opacity: number): string {
  let out = "";
  for (let i = 0; i < count; i++) {
    const a = offsetDeg + (360 / count) * i;
    out += `<ellipse cx="${cx}" cy="${cy - ry}" rx="${rx}" ry="${ry}" fill="${fill}" opacity="${opacity}" transform="rotate(${a} ${cx} ${cy})"/>`;
  }
  return out;
}

/** 冠饰：五灵各一式，接在灵核之后绘制的部分放在 front。 */
function crown(id: string, p: SpiritPalette, motion: boolean): { back: string; front: string } {
  switch (id) {
    case "juyue":
      return {
        back:
          `<path d="M46 8 A12 12 0 1 0 55 27 A9.6 9.6 0 1 1 46 8Z" fill="${p.aura}" opacity="0.7"/>` +
          petalRing(32, 27, 2.6, 10.5, p.core, 12, 0, 0.85) +
          petalRing(32, 27, 2.2, 7.6, p.aura, 12, 15, 0.9),
        front: `<circle cx="32" cy="27" r="3" fill="${p.ink}" opacity="0.35"/>`,
      };
    case "chiguang":
      return {
        back:
          `<path d="M12 22 A20 20 0 0 1 52 22 A20 9 0 0 1 12 22Z" fill="${p.core}" opacity="0.75"/>` +
          `<path d="M32 13 L32 26 M20 17 L32 22 M44 17 L32 22" stroke="${p.aura}" stroke-width="1.2" opacity="0.8"/>`,
        front:
          `<path d="M13 50 q9 -4 19 0 t19 0" stroke="${p.aura}" stroke-width="1.6" fill="none" opacity="0.65" stroke-linecap="round">` +
          (motion ? anim("opacity", "0.25;0.8;0.25", "3.4s") : "") +
          `</path>` +
          `<path d="M15 55 q8.5 -3.6 17 0 t17 0" stroke="${p.aura}" stroke-width="1.4" fill="none" opacity="0.5" stroke-linecap="round"/>`,
      };
    case "rainbow": {
      // 振翅：绕 x=32 缩放，故用 translate 夹住一层专门承载动画的 g
      const flap = motion
        ? `<animateTransform attributeName="transform" type="scale" values="1 1;0.86 1;1 1" dur="1.9s" repeatCount="indefinite"/>`
        : "";
      return {
        back:
          `<g transform="translate(32 0)"><g transform="scale(1 1)">${flap}<g transform="translate(-32 0)">` +
          `<path d="M31 28 C22 12 8 12 7 24 C6 34 20 34 31 30Z" fill="${p.core}" opacity="0.82"/>` +
          `<path d="M33 28 C42 12 56 12 57 24 C58 34 44 34 33 30Z" fill="${p.core}" opacity="0.82"/>` +
          `<path d="M31 30 C24 40 12 42 12 34 C12 29 23 28 31 30Z" fill="${p.aura}" opacity="0.75"/>` +
          `<path d="M33 30 C40 40 52 42 52 34 C52 29 41 28 33 30Z" fill="${p.aura}" opacity="0.75"/>` +
          `</g></g></g>`,
        front:
          `<path d="M30 21 C27 15 24 13 21.5 12.5 M34 21 C37 15 40 13 42.5 12.5" stroke="${p.ink}" stroke-width="1.1" fill="none" stroke-linecap="round" opacity="0.6"/>`,
      };
    }
    case "xueyi": {
      let arms = "";
      for (let i = 0; i < 6; i++) {
        arms += `<g transform="rotate(${i * 60} 32 26)"><path d="M32 26 L32 9" stroke="${p.aura}" stroke-width="1.8" stroke-linecap="round"/><path d="M32 14 L28.4 10.6 M32 14 L35.6 10.6" stroke="${p.aura}" stroke-width="1.4" stroke-linecap="round"/></g>`;
      }
      return {
        back: `<g opacity="0.9">${motion ? `<animateTransform attributeName="transform" type="rotate" values="0 32 26;360 32 26" dur="46s" repeatCount="indefinite"/>` : ""}${arms}</g>`,
        front:
          `<circle cx="17" cy="41" r="1.5" fill="${p.aura}" opacity="0.85"/>` +
          `<circle cx="47" cy="37" r="1.2" fill="${p.aura}" opacity="0.75"/>` +
          `<circle cx="41" cy="49" r="1" fill="${p.aura}" opacity="0.6"/>`,
      };
    }
    case "suideng":
      return {
        back:
          `<path d="M32 4 L32 10" stroke="${p.ink}" stroke-width="1.4" stroke-linecap="round"/>` +
          `<rect x="24" y="9.5" width="16" height="2.6" rx="1.2" fill="${p.ink}" opacity="0.8"/>` +
          `<path d="M32 12 C42 12 46 18 46 24 C46 30 42 36 32 36 C22 36 18 30 18 24 C18 18 22 12 32 12Z" fill="${p.core}" opacity="0.9"/>` +
          `<path d="M26 13.6 C23 18 23 30 26 34.4 M38 13.6 C41 18 41 30 38 34.4" stroke="${p.aura}" stroke-width="1.1" fill="none" opacity="0.6"/>` +
          `<ellipse cx="32" cy="24" rx="6.5" ry="8" fill="${p.aura}" opacity="0.55">${motion ? anim("opacity", "0.35;0.75;0.35", "3.2s") : ""}</ellipse>`,
        front:
          `<rect x="27" y="35" width="10" height="2.4" rx="1.1" fill="${p.ink}" opacity="0.8"/>` +
          `<path d="M30 37.6 L29 44 M32 37.6 L32 45 M34 37.6 L35 44" stroke="${p.ink}" stroke-width="1.1" stroke-linecap="round" opacity="0.7"/>`,
      };
    default:
      return { back: "", front: "" };
  }
}

/** 未请灵：一枚空印，留白待人。 */
function emptySeal(p: SpiritPalette): string {
  return (
    `<circle cx="32" cy="32" r="23" fill="none" stroke="${p.ink}" stroke-width="1.6" stroke-dasharray="4 5" opacity="0.55"/>` +
    `<text x="32" y="40" text-anchor="middle" font-size="22" fill="${p.ink}" opacity="0.6">灵</text>`
  );
}

export interface PortraitOptions {
  /** 像素边长，默认 44 */
  size?: number;
  /** 未苏醒：转为水墨剪影并加封印虚线 */
  locked?: boolean;
  /** 默认跟随系统的减弱动效设置 */
  motion?: boolean;
}

/**
 * 花灵形象 SVG。传 null 得到「未请灵」空印。
 * 动效走 SMIL 内联，不依赖任何 CSS，面板、HUD、提示条、场景都能直接注入。
 */
export function spiritPortrait(id: string | null, opts: PortraitOptions = {}): string {
  const size = opts.size ?? 44;
  const locked = opts.locked ?? false;
  const motion = (opts.motion ?? motionAllowed()) && !locked;
  const visual = id ? SPIRIT_VISUALS[id] : undefined;
  const palette = locked || !visual ? INK_PALETTE : visual.palette;
  const key = `${visual?.id ?? "none"}-${locked ? "lk" : "on"}`;

  let body: string;
  if (!visual) {
    body = emptySeal(palette);
  } else {
    const c = crown(visual.id, palette, motion);
    body = halo(key, palette, motion) + c.back + robe(palette, motion) + spiritCore(palette) + c.front;
    if (locked) {
      body += `<circle cx="32" cy="32" r="27" fill="none" stroke="${palette.ink}" stroke-width="1.4" stroke-dasharray="3 5" opacity="0.5"/>`;
    }
  }
  return (
    `<svg class="spirit-glyph${locked ? " is-sealed" : ""}" viewBox="0 0 64 64" width="${size}" height="${size}" ` +
    `aria-hidden="true" focusable="false">${body}</svg>`
  );
}

// ---------------------------------------------------------------------------
// 随行数据：场景层可据此在园中放一只跟着走的花灵，无需知道花灵系统的内部结构。
// ---------------------------------------------------------------------------

export interface SpiritPresence {
  id: string;
  name: string;
  motif: string;
  palette: SpiritPalette;
  /** 建议的绕行参数：半径按格宽百分比、周期毫秒、上下浮动像素、整体缩放 */
  orbit: { radiusPct: number; periodMs: number; bobPx: number; scale: number };
  /** 光晕不透明度，夜里更亮 */
  auraOpacity: number;
  /** 可直接注入的形象（viewBox 0 0 64 64） */
  svg: string;
}

export function spiritPresenceFor(id: string | null, night = false, size = 56): SpiritPresence | null {
  const def = spiritById(id);
  const visual = id ? SPIRIT_VISUALS[id] : undefined;
  if (!def || !visual) return null;
  return {
    id: def.id,
    name: def.name,
    motif: visual.motif,
    palette: visual.palette,
    orbit: visual.orbit,
    auraOpacity: night ? 0.82 : 0.5,
    svg: spiritPortrait(def.id, { size }),
  };
}

/** 当前随行花灵；无则 null。场景层每帧取一次即可，返回值可直接比对 id 做增量。 */
export function spiritPresence(state: GameState, night = false): SpiritPresence | null {
  return spiritPresenceFor(state.activeSpirit, night);
}
