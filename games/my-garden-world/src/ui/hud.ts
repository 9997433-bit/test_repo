import type { GameState } from "../engine/state";
import { clockLabel, seasonLabel } from "../engine/time";
import { WATER_CAP, xpToLevel } from "../engine/state";
import { SPIRIT_ATTR, spiritById, spiritPortrait } from "../systems/spirits";

interface Field {
  key: string;
  label: (s: GameState) => string;
  aria: (s: GameState) => string;
  /** 可选印记：SVG 串，随 markKey 变化才重绘 */
  mark?: (s: GameState) => string;
  markKey?: (s: GameState) => string;
  /** 条件显示，隐藏时不占位 */
  show?: (s: GameState) => boolean;
}

const FIELDS: Field[] = [
  { key: "coins", label: (s) => `金 ${s.coins}`, aria: (s) => `金币 ${s.coins}` },
  { key: "water", label: (s) => `水 ${s.water}/${WATER_CAP}`, aria: (s) => `水滴 ${s.water}，上限 ${WATER_CAP}` },
  { key: "level", label: (s) => `${s.level} 阶 · ${s.exp}/${xpToLevel(s.level)}`, aria: (s) => `等级 ${s.level} 阶，经验 ${s.exp}` },
  { key: "rep", label: (s) => `口碑 ${s.reputation}`, aria: (s) => `口碑 ${s.reputation}` },
  { key: "clock", label: (s) => `${seasonLabel(s.season)} · ${clockLabel(s.dayMinute)}`, aria: (s) => `${seasonLabel(s.season)}季 ${clockLabel(s.dayMinute)}` },
  { key: "frag", label: (s) => `碎片 ${s.fragments}`, aria: (s) => `装饰碎片 ${s.fragments}` },
  {
    key: "spirit",
    label: (s) => spiritById(s.activeSpirit)?.name ?? "未请灵",
    aria: (s) => {
      const name = spiritById(s.activeSpirit)?.name;
      return name ? `随行花灵 ${name}` : `已唤醒 ${s.unlockedSpirits.length} 位花灵，暂未请灵`;
    },
    // 未请灵时不画空印，免得 HUD 上多一枚看不清的小章
    mark: (s) => (s.activeSpirit ? spiritPortrait(s.activeSpirit, { size: 18, motion: false }) : ""),
    markKey: (s) => s.activeSpirit ?? "none",
    show: (s) => s.unlockedSpirits.length > 0,
  },
];

export interface HudController {
  update(state: GameState): void;
}

interface Node {
  pill: HTMLElement;
  txt: HTMLElement;
  mark: HTMLElement | null;
  text: string;
  markKey: string;
  shown: boolean;
}

/** HUD 常驻节点，逐字段 diff 更新，避免每帧 innerHTML。 */
export function createHud(el: HTMLElement): HudController {
  el.innerHTML = `<div class="brand">我的花园世界</div><div class="pills" role="status" aria-label="资源栏"></div>`;
  const pills = el.querySelector(".pills")!;
  // 把随行花灵发布到根节点，CSS、场景与音景都能挂钩，不必再穿一层 props
  const root = el.closest<HTMLElement>(".app") ?? el.parentElement;
  const nodes = new Map<string, Node>();
  for (const f of FIELDS) {
    const pill = document.createElement("span");
    pill.className = `pill pill-${f.key}`;
    let mark: HTMLElement | null = null;
    if (f.mark) {
      mark = document.createElement("span");
      mark.className = "pill-mark";
      mark.setAttribute("aria-hidden", "true");
      mark.style.cssText = "display:inline-flex;align-items:center;margin-right:4px;vertical-align:-4px";
      pill.append(mark);
    }
    const txt = document.createElement("span");
    txt.className = "pill-txt";
    pill.append(txt);
    pills.append(pill);
    nodes.set(f.key, { pill, txt, mark, text: "", markKey: "", shown: true });
  }
  const update = (state: GameState): void => {
    for (const f of FIELDS) {
      const n = nodes.get(f.key)!;
      const shown = f.show ? f.show(state) : true;
      if (shown !== n.shown) {
        n.shown = shown;
        n.pill.hidden = !shown;
      }
      if (!shown) continue;
      const text = f.label(state);
      if (text !== n.text) {
        n.text = text;
        n.txt.textContent = text;
        n.pill.setAttribute("aria-label", f.aria(state));
      }
      if (f.mark && f.markKey && n.mark) {
        const key = f.markKey(state);
        if (key !== n.markKey) {
          n.markKey = key;
          n.mark.innerHTML = f.mark(state);
        }
      }
    }
    if (root) {
      const id = state.activeSpirit ?? "";
      if (root.getAttribute(SPIRIT_ATTR) !== id) root.setAttribute(SPIRIT_ATTR, id);
    }
  };
  return { update };
}
