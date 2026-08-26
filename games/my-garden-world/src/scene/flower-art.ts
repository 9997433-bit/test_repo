import type { FlowerDef, GrowthStage } from "../data/flowers";

const LEAF = "#5f8f57";
const LEAF_DARK = "#47713f";
const STEM = "#4c7a48";
const SOIL_DARK = "#3c2a16";
const WILT = "#a08b6c";

function petals(cx: number, cy: number, rx: number, ry: number, fill: string, count: number, offsetDeg = 0, opacity = 1): string {
  let out = "";
  for (let i = 0; i < count; i++) {
    const a = offsetDeg + (360 / count) * i;
    out += `<ellipse cx="${cx}" cy="${cy - ry}" rx="${rx}" ry="${ry}" fill="${fill}" opacity="${opacity}" transform="rotate(${a} ${cx} ${cy})"/>`;
  }
  return out;
}

function leaves(y: number): string {
  return (
    `<path d="M50 ${y} C41 ${y - 2} 37 ${y - 9} 39 ${y - 15} C46 ${y - 12} 50 ${y - 7} 50 ${y}Z" fill="${LEAF}"/>` +
    `<path d="M50 ${y + 4} C59 ${y + 2} 63 ${y - 5} 61 ${y - 11} C54 ${y - 8} 50 ${y - 3} 50 ${y + 4}Z" fill="${LEAF_DARK}"/>`
  );
}

/** 程序化国风花卉：按花色与生长阶段生成 SVG（纯函数，可测试）。 */
export function plotArt(def: FlowerDef | undefined, stage: GrowthStage): string {
  const color = def?.color ?? "#e8d9a0";
  const accent = def?.accent ?? "#c9a227";
  const rare = (def?.rarity ?? 1) >= 4;
  let body = "";
  switch (stage) {
    case "empty":
      body =
        `<ellipse cx="50" cy="86" rx="26" ry="7" fill="rgba(0,0,0,0.16)"/>` +
        `<path d="M31 84 q3 -9 6 0" stroke="#7d9c6b" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
        `<path d="M66 85 q3 -8 6 0" stroke="#8aa878" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
        `<circle cx="52" cy="84" r="2.6" fill="#8a6f4d"/><circle cx="44" cy="87" r="1.8" fill="#75603f"/>`;
      break;
    case "seeded":
      body =
        `<ellipse cx="50" cy="84" rx="19" ry="6.5" fill="${SOIL_DARK}"/>` +
        `<circle cx="44" cy="83" r="2.4" fill="${color}"/>` +
        `<circle cx="52" cy="85.5" r="2.4" fill="${color}"/>` +
        `<circle cx="58" cy="82.5" r="2.4" fill="${color}"/>`;
      break;
    case "sprout":
      body =
        `<ellipse cx="50" cy="86" rx="16" ry="5" fill="rgba(0,0,0,0.15)"/>` +
        `<g class="sway"><path d="M50 86 C50 78 50 70 50 63" stroke="${STEM}" stroke-width="3" fill="none" stroke-linecap="round"/>` +
        `<path d="M50 72 C42 70 38 64 40 57 C47 60 50 65 50 72Z" fill="${LEAF}"/>` +
        `<path d="M50 74 C58 72 62 66 60 59 C53 62 50 67 50 74Z" fill="${LEAF_DARK}"/></g>`;
      break;
    case "bud":
      body =
        `<ellipse cx="50" cy="86" rx="17" ry="5" fill="rgba(0,0,0,0.15)"/>` +
        `<g class="sway"><path d="M50 86 C50 72 49 60 50 50" stroke="${STEM}" stroke-width="3.4" fill="none" stroke-linecap="round"/>` +
        leaves(72) +
        `<ellipse cx="50" cy="43" rx="7.5" ry="11" fill="${accent}"/>` +
        `<path d="M43.5 49 Q50 57 56.5 49 Q50 52.5 43.5 49Z" fill="${STEM}"/></g>`;
      break;
    case "bloom":
      body =
        `<ellipse cx="50" cy="86" rx="18" ry="5.5" fill="rgba(0,0,0,0.16)"/>` +
        `<g class="sway">` +
        `<path d="M50 86 C50 74 49 62 50 50" stroke="${STEM}" stroke-width="3.4" fill="none" stroke-linecap="round"/>` +
        leaves(74) +
        (rare ? `<circle class="glow" cx="50" cy="36" r="21" fill="${accent}" opacity="0.18"/>` : "") +
        petals(50, 36, 8, 13.5, color, 6) +
        (rare ? petals(50, 36, 5.5, 9.5, accent, 6, 30, 0.85) : "") +
        `<circle cx="50" cy="36" r="6.5" fill="${accent}"/>` +
        `<circle cx="48" cy="34" r="1.8" fill="#fff6dd" opacity="0.9"/>` +
        `</g>`;
      break;
    case "wilt":
      body =
        `<ellipse cx="50" cy="86" rx="17" ry="5" fill="rgba(0,0,0,0.14)"/>` +
        `<path d="M50 86 C50 72 58 66 63 59" stroke="#7c6a4c" stroke-width="3" fill="none" stroke-linecap="round"/>` +
        `<path d="M50 76 C43 74 40 69 41 64 C47 66 50 70 50 76Z" fill="#8f7f5c"/>` +
        petals(63, 61, 5.5, 9, WILT, 5, 20, 0.9) +
        `<circle cx="63" cy="59" r="4.5" fill="#6f5c3e"/>`;
      break;
  }
  return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">${body}</svg>`;
}
