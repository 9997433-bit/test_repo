import { ANCHORS, ANCHOR_MAP, DECORATIONS, THEME_NAMES, THEMES, anchorName, type DecorTheme } from "../data/decorations";
import { emit } from "../engine/events";
import type { GameState } from "../engine/state";
import { spendCoins } from "./economy";

const DECOR_MAP = new Map(DECORATIONS.map((d) => [d.id, d]));

/** 场景要画的一件陈设：已入园的 id 解析成图名与落款，旧存档的未知 id 也保留。 */
export interface PlacedDecor {
  id: string;
  name: string;
  glyph: string;
  /** 陈列牌文案：已知者「灯 纱灯」，未知者原样 id */
  label: string;
  known: boolean;
  /** 锚位 id；null 表示「在匣」，不入景。 */
  anchor: string | null;
  /** 锚位名号（「檐下」…），在匣者为「在匣」。 */
  anchorLabel: string;
}

export function resolvePlacedDecor(state: GameState): PlacedDecor[] {
  return state.placedDecor.map((id) => {
    const def = DECOR_MAP.get(id);
    const anchor = state.decorAnchors[id] ?? null;
    const base = { anchor, anchorLabel: anchorName(anchor) };
    if (!def) return { id, name: id, glyph: id.slice(0, 1), label: id, known: false, ...base };
    return { id, name: def.name, glyph: def.glyph, label: `${def.glyph} ${def.name}`, known: true, ...base };
  });
}

/** 该锚位上现驻的陈设 id（空锚位为 null）。 */
export function anchorOccupant(state: GameState, anchorId: string): string | null {
  for (const [decorId, a] of Object.entries(state.decorAnchors)) {
    if (a === anchorId) return decorId;
  }
  return null;
}

/** 第一个空锚位；园中已满为 null。 */
export function firstFreeAnchor(state: GameState): string | null {
  const used = new Set(Object.values(state.decorAnchors));
  return ANCHORS.find((a) => !used.has(a.id))?.id ?? null;
}

/**
 * 把已购陈设安到指定锚位（挪动零成本、可逆、不弹确认）。
 * 锚位若有原主，原物回匣（不退款，仍归玩家所有）。
 */
export function placeAt(state: GameState, decorId: string, anchorId: string): { ok: boolean; displaced: string | null } {
  if (!state.placedDecor.includes(decorId) || !ANCHOR_MAP[anchorId]) return { ok: false, displaced: null };
  const displaced = anchorOccupant(state, anchorId);
  if (displaced === decorId) return { ok: true, displaced: null };
  if (displaced) delete state.decorAnchors[displaced];
  state.decorAnchors[decorId] = anchorId;
  return { ok: true, displaced };
}

/** 收回匣中：不退款、不出园册，只是不入景。 */
export function unplace(state: GameState, decorId: string): void {
  delete state.decorAnchors[decorId];
}

/** 购入 / 挪动时的默认落位：第一个空锚位；园满则留在匣中。 */
export function autoPlace(state: GameState, decorId: string): string | null {
  if (!state.placedDecor.includes(decorId) || state.decorAnchors[decorId]) return state.decorAnchors[decorId] ?? null;
  const free = firstFreeAnchor(state);
  if (free) state.decorAnchors[decorId] = free;
  return free;
}

export function placeDecor(state: GameState, id: string): boolean {
  const def = DECORATIONS.find((d) => d.id === id);
  if (!def) return false;
  if (state.level < def.unlockLevel) {
    emit({ type: "toast", text: `${def.unlockLevel} 阶后可置此物`, tone: "warn" });
    return false;
  }
  if (state.placedDecor.includes(id)) {
    emit({ type: "toast", text: "匣中已有此物", tone: "warn" });
    return false;
  }
  const useFrag = state.fragments >= def.fragmentCost;
  if (useFrag) state.fragments -= def.fragmentCost;
  else if (!spendCoins(state, def.cost)) {
    emit({ type: "toast", text: "金币或碎片不足", tone: "warn" });
    return false;
  }
  state.placedDecor.push(id);
  const anchor = autoPlace(state, id);
  emit({
    type: "toast",
    text: anchor ? `安置 ${def.name} · ${anchorName(anchor)}` : `${def.name} 已购入匣 · 园中已满，可开「布置」腾位`,
    tone: "ok",
  });
  return true;
}

/**
 * 一键主题：补购主题件并保证全部入景；锚位不足时换下雅致（mood）最低的非主题陈设。
 * 记录 decorTheme 供 [data-theme] 全局主题层取用。
 */
export function applyTheme(state: GameState, theme: DecorTheme): void {
  const pack = THEMES.find((t) => t.id === theme);
  if (!pack) return;
  for (const id of pack.ids) {
    if (!state.placedDecor.includes(id)) placeDecor(state, id);
  }
  const boxed: string[] = [];
  for (const id of pack.ids) {
    if (!state.placedDecor.includes(id) || state.decorAnchors[id]) continue;
    if (autoPlace(state, id)) continue;
    // 园中已满：换下雅致最低的非主题陈设
    const evictee = Object.keys(state.decorAnchors)
      .filter((d) => !pack.ids.includes(d))
      .sort((a, b) => (DECOR_MAP.get(a)?.mood ?? 0) - (DECOR_MAP.get(b)?.mood ?? 0))[0];
    if (!evictee) continue;
    const anchor = state.decorAnchors[evictee];
    unplace(state, evictee);
    boxed.push(DECOR_MAP.get(evictee)?.name ?? evictee);
    if (anchor) placeAt(state, id, anchor);
  }
  state.decorTheme = theme;
  const suffix = boxed.length ? ` · ${boxed.join("、")}回匣` : "";
  emit({ type: "toast", text: `已套用「${THEME_NAMES[theme]}」主题${suffix}`, tone: "ok" });
}

export function removeDecor(state: GameState, id: string): void {
  state.placedDecor = state.placedDecor.filter((x) => x !== id);
  unplace(state, id);
}
