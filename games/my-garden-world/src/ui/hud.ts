import type { GameState } from "../engine/state";
import { clockLabel, seasonLabel } from "../engine/time";
import { WATER_CAP, xpToLevel } from "../engine/state";

interface Field {
  key: string;
  label: (s: GameState) => string;
  aria: (s: GameState) => string;
}

const FIELDS: Field[] = [
  { key: "coins", label: (s) => `金 ${s.coins}`, aria: (s) => `金币 ${s.coins}` },
  { key: "water", label: (s) => `水 ${s.water}/${WATER_CAP}`, aria: (s) => `水滴 ${s.water}，上限 ${WATER_CAP}` },
  { key: "level", label: (s) => `${s.level} 阶 · ${s.exp}/${xpToLevel(s.level)}`, aria: (s) => `等级 ${s.level} 阶，经验 ${s.exp}` },
  { key: "rep", label: (s) => `口碑 ${s.reputation}`, aria: (s) => `口碑 ${s.reputation}` },
  { key: "clock", label: (s) => `${seasonLabel(s.season)} · ${clockLabel(s.dayMinute)}`, aria: (s) => `${seasonLabel(s.season)}季 ${clockLabel(s.dayMinute)}` },
  { key: "frag", label: (s) => `碎片 ${s.fragments}`, aria: (s) => `装饰碎片 ${s.fragments}` },
];

export interface HudController {
  update(state: GameState): void;
}

/** HUD 常驻节点，逐字段 diff 更新，避免每帧 innerHTML。 */
export function createHud(el: HTMLElement): HudController {
  el.innerHTML = `<div class="brand">我的花园世界</div><div class="pills" role="status" aria-label="资源栏"></div>`;
  const pills = el.querySelector(".pills")!;
  const nodes = new Map<string, { el: HTMLElement; text: string }>();
  for (const f of FIELDS) {
    const pill = document.createElement("span");
    pill.className = `pill pill-${f.key}`;
    pills.append(pill);
    nodes.set(f.key, { el: pill, text: "" });
  }
  const update = (state: GameState): void => {
    for (const f of FIELDS) {
      const n = nodes.get(f.key)!;
      const text = f.label(state);
      if (text !== n.text) {
        n.text = text;
        n.el.textContent = text;
        n.el.setAttribute("aria-label", f.aria(state));
      }
    }
  };
  return { update };
}
