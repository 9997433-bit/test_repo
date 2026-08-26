import { SPIRITS } from "../data/spirits";
import type { GameState } from "../engine/state";

// 花灵的场景形象：光晕 + 灵体 + 各自的信物。
// 纯函数生成 SVG，动效（漂移/浮沉/光晕呼吸）全部交给 CSS。

function face(cx: number, cy: number, ink = "#4c3e2d"): string {
  return (
    `<circle cx="${cx - 6}" cy="${cy}" r="1.9" fill="${ink}"/>` +
    `<circle cx="${cx + 6}" cy="${cy}" r="1.9" fill="${ink}"/>` +
    `<path d="M${cx - 3.5} ${cy + 5} Q${cx} ${cy + 7.5} ${cx + 3.5} ${cy + 5}" stroke="${ink}" stroke-width="1.6" fill="none" stroke-linecap="round"/>` +
    `<circle cx="${cx - 10}" cy="${cy + 4}" r="2.2" fill="#e8968c" opacity="0.55"/>` +
    `<circle cx="${cx + 10}" cy="${cy + 4}" r="2.2" fill="#e8968c" opacity="0.55"/>`
  );
}

function wisp(fill: string, stroke: string): string {
  return (
    `<path d="M50 22 C67 22 77 35 77 51 C77 67 67 73 62 86 C58 77 54 79 50 89 C46 79 42 77 38 86 C33 73 23 67 23 51 C23 35 33 22 50 22 Z"` +
    ` fill="${fill}" stroke="${stroke}" stroke-width="1.6"/>`
  );
}

/** 菊月：霜色菊灵，鬓边别一弯新月。 */
function juyue(): string {
  let petals = "";
  for (let i = 0; i < 10; i++) {
    const a = (360 / 10) * i;
    petals += `<ellipse cx="50" cy="9" rx="2.6" ry="7" fill="#f0d58c" transform="rotate(${a} 50 18)"/>`;
  }
  return (
    `<circle class="aura" cx="50" cy="52" r="41" fill="#f0d58c" opacity="0.32"/>` +
    petals +
    `<circle cx="50" cy="18" r="4.5" fill="#c9862a"/>` +
    wisp("#f9edc8", "#d9b96a") +
    `<path d="M70 26 A9 9 0 1 0 76 39 A7.5 7.5 0 1 1 70 26 Z" fill="#e9cf8a"/>` +
    face(50, 48)
  );
}

/** 池光：一滴不肯落地的水，头顶顶着莲苞。 */
function chiguang(): string {
  return (
    `<circle class="aura" cx="50" cy="52" r="41" fill="#8ecbe6" opacity="0.32"/>` +
    `<ellipse cx="50" cy="94" rx="22" ry="4" fill="none" stroke="#8ecbe6" stroke-width="1.6" opacity="0.7"/>` +
    `<ellipse cx="50" cy="94" rx="12" ry="2.2" fill="none" stroke="#8ecbe6" stroke-width="1.2" opacity="0.9"/>` +
    `<path d="M50 12 C54 20 58 24 58 30 L42 30 C42 24 46 20 50 12 Z" fill="#bfe0f0"/>` +
    wisp("#d6ecf6", "#8fc3dd") +
    `<ellipse cx="40" cy="38" rx="4" ry="7" fill="#ffffff" opacity="0.55" transform="rotate(-18 40 38)"/>` +
    `<ellipse cx="63" cy="21" rx="3.2" ry="5" fill="#f6d5e0" transform="rotate(14 63 21)"/>` +
    `<path d="M60 26 Q63 29 66 26" stroke="#5c8a58" stroke-width="1.4" fill="none"/>` +
    face(50, 48)
  );
}

/** 虹蝶：背驮两扇霞色蝶翼。 */
function rainbow(): string {
  return (
    `<circle class="aura" cx="50" cy="52" r="41" fill="#e4c1f9" opacity="0.32"/>` +
    `<path d="M36 44 C8 18 2 58 33 62 Z" fill="#f7cad0"/>` +
    `<path d="M36 48 C16 32 12 58 33 60 Z" fill="#aebfe9"/>` +
    `<path d="M64 44 C92 18 98 58 67 62 Z" fill="#f7cad0"/>` +
    `<path d="M64 48 C84 32 88 58 67 60 Z" fill="#f4e7b5"/>` +
    wisp("#ecd9fb", "#b48ad4") +
    `<path d="M44 20 Q40 10 34 8 M56 20 Q60 10 66 8" stroke="#8c5aa8" stroke-width="1.8" fill="none" stroke-linecap="round"/>` +
    `<circle cx="34" cy="8" r="2.2" fill="#8c5aa8"/><circle cx="66" cy="8" r="2.2" fill="#8c5aa8"/>` +
    face(50, 48)
  );
}

/** 雪衣：兜着雪斗篷，身侧结一枚冰花。 */
function xueyi(): string {
  const flake =
    `<g stroke="#7fa8c9" stroke-width="1.6" stroke-linecap="round">` +
    `<line x1="72" y1="14" x2="72" y2="30"/><line x1="65" y1="18" x2="79" y2="26"/><line x1="79" y1="18" x2="65" y2="26"/>` +
    `</g><circle cx="72" cy="22" r="2" fill="#a9c6de"/>`;
  return (
    `<circle class="aura" cx="50" cy="52" r="41" fill="#bcd4e8" opacity="0.34"/>` +
    wisp("#f2f7fa", "#b8cede") +
    `<path d="M24 44 C24 24 36 15 50 15 C64 15 76 24 76 44 C70 32 60 27 50 27 C40 27 30 32 24 44 Z" fill="#dbe8f2" stroke="#a9c6de" stroke-width="1.4"/>` +
    flake +
    `<circle cx="30" cy="66" r="1.6" fill="#a9c6de"/><circle cx="68" cy="70" r="1.4" fill="#a9c6de"/>` +
    face(50, 48)
  );
}

/** 岁灯：掌上托一盏长明小灯。 */
function suideng(): string {
  return (
    `<circle class="aura" cx="50" cy="52" r="41" fill="#f4d35e" opacity="0.36"/>` +
    wisp("#ffe9c4", "#dfae62") +
    `<path d="M50 14 L54 21 L50 24 L46 21 Z" fill="#f4d35e"/>` +
    `<g class="dangle">` +
    `<circle cx="73" cy="55" r="10" fill="#f4d35e" opacity="0.5"/>` +
    `<rect x="69" y="46" width="8" height="3" rx="1.4" fill="#c9a227"/>` +
    `<ellipse cx="73" cy="55" rx="6" ry="7.5" fill="#e63946"/>` +
    `<ellipse cx="73" cy="55" rx="3.4" ry="7.5" fill="none" stroke="rgba(255,240,214,0.6)" stroke-width="1"/>` +
    `<rect x="70" y="62" width="6" height="2.4" rx="1.2" fill="#c9a227"/>` +
    `<line x1="73" y1="64" x2="73" y2="69" stroke="#c9a227" stroke-width="1.4"/>` +
    `</g>` +
    face(48, 48)
  );
}

const ART: Record<string, () => string> = { juyue, chiguang, rainbow, xueyi, suideng };

/** 按花灵 id 生成形象 SVG；未知 id 返回空串。 */
export function spiritArt(id: string): string {
  const body = ART[id]?.();
  return body ? `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">${body}</svg>` : "";
}

export interface SpiritView {
  update(state: GameState): void;
}

/** 场景内的花灵：请灵后在花园上空缓缓巡游，换灵/收灵有淡入淡出。 */
export function mountSpiritView(host: HTMLElement): SpiritView {
  const layer = document.createElement("div");
  layer.className = "spirit-layer";
  layer.setAttribute("aria-hidden", "true");
  const fig = document.createElement("div");
  fig.className = "spirit-fig";
  const body = document.createElement("div");
  body.className = "spirit-body";
  const name = document.createElement("span");
  name.className = "spirit-name";
  fig.append(body, name);
  layer.append(fig);
  host.append(layer);

  let key: string | null = "";
  const update = (state: GameState): void => {
    if (state.activeSpirit === key) return;
    key = state.activeSpirit;
    const def = SPIRITS.find((s) => s.id === key);
    if (!def) {
      layer.classList.remove("is-here");
      return;
    }
    body.innerHTML = spiritArt(def.id);
    name.textContent = def.name;
    layer.classList.add("is-here");
    fig.classList.remove("arrive");
    void fig.offsetWidth;
    fig.classList.add("arrive");
  };
  return { update };
}
