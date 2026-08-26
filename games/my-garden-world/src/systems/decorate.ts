import { DECORATIONS, THEMES, type DecorTheme } from "../data/decorations";
import { emit } from "../engine/events";
import type { GameState } from "../engine/state";
import { spendCoins } from "./economy";

const DECOR_MAP = new Map(DECORATIONS.map((d) => [d.id, d]));

/** 庭院四缘的八个锚位，顺序即「补位顺序」：偏好位被占时按此序找下一个空位。 */
export const ANCHOR_IDS = [
  "eave",
  "gate",
  "path-west",
  "path-east",
  "pondside",
  "corner-north",
  "corner-south",
  "heart",
] as const;

export type AnchorId = (typeof ANCHOR_IDS)[number];

export const ANCHOR_NAMES: Record<AnchorId, string> = {
  eave: "檐下",
  gate: "门前",
  "path-west": "径旁西",
  "path-east": "径旁东",
  pondside: "池畔",
  "corner-north": "墙角北",
  "corner-south": "墙角南",
  heart: "园心",
};

/** 落位表里的「收进匣中」：仍归玩家所有，只是不在园中露面。 */
export const IN_BOX = "box";

export type DecorSpot = AnchorId | typeof IN_BOX;

declare module "../engine/state" {
  interface GameState {
    /**
     * 陈设落位表：装饰 id → 锚位（或 "box" 收进匣中）。
     * 旧档没有这张表：缺项者按偏好锚位自动落座，无需迁移代码，玩家一挪即写实。
     */
    decorAnchors?: Record<string, DecorSpot>;
  }
}

/** 每件陈设的「本来该待的地方」；同位相争时先到先得，后到者顺位补空。 */
const PREFERRED: Record<string, AnchorId> = {
  lantern: "eave",
  chimes: "eave",
  path: "heart",
  swing: "path-east",
  screen: "corner-north",
  scarecrow: "corner-south",
  pond: "pondside",
  snowlion: "gate",
  brazier: "path-west",
  pavilion: "corner-north",
  bridge: "pondside",
  moongate: "gate",
};

function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function isAnchorId(value: unknown): value is AnchorId {
  return typeof value === "string" && (ANCHOR_IDS as readonly string[]).includes(value);
}

/** 旧存档的未知 id 也要有个偏好位，按 id 散列取，同一 id 每次一致。 */
export function preferredAnchor(id: string): AnchorId {
  return PREFERRED[id] ?? ANCHOR_IDS[hash(id) % ANCHOR_IDS.length] ?? "heart";
}

export function decorName(id: string): string {
  return DECOR_MAP.get(id)?.name ?? id;
}

export function anchorName(anchor: AnchorId): string {
  return ANCHOR_NAMES[anchor];
}

/** 一件陈设的落位：`anchor` 为 null 表示收在匣中（拥有但未入园）。 */
export interface DecorPlacement {
  id: string;
  anchor: AnchorId | null;
}

/** 场景要画的一件陈设：已入园的 id 解析成图名、落款与落位，旧存档的未知 id 也保留。 */
export interface PlacedDecor extends DecorPlacement {
  name: string;
  glyph: string;
  /** 陈列牌文案：已知者「灯 纱灯」，未知者原样 id */
  label: string;
  known: boolean;
}

/**
 * 把「拥有的陈设」摊到八个锚位上：显式落位优先，其次偏好位，再次顺位补空，
 * 多出八件的收进匣中。纯函数，不改 state——渲染层每帧都能安全调用。
 */
export function resolveAnchors(state: GameState): DecorPlacement[] {
  const overrides = state.decorAnchors ?? {};
  const taken = new Map<AnchorId, string>();
  const out: DecorPlacement[] = [];
  const index = new Map<string, number>();
  const pending: string[] = [];

  for (const id of state.placedDecor) {
    if (index.has(id)) continue; // 同款只占一个位
    index.set(id, out.length);
    const spot = overrides[id];
    if (spot === IN_BOX) {
      out.push({ id, anchor: null });
      continue;
    }
    if (isAnchorId(spot) && !taken.has(spot)) {
      taken.set(spot, id);
      out.push({ id, anchor: spot });
      continue;
    }
    out.push({ id, anchor: null });
    pending.push(id);
  }

  const seat = (id: string, anchor: AnchorId): void => {
    taken.set(anchor, id);
    const at = index.get(id);
    const entry = at === undefined ? undefined : out[at];
    if (entry) entry.anchor = anchor;
  };

  const leftover: string[] = [];
  for (const id of pending) {
    const pref = preferredAnchor(id);
    if (taken.has(pref)) leftover.push(id);
    else seat(id, pref);
  }
  for (const id of leftover) {
    const free = ANCHOR_IDS.find((a) => !taken.has(a));
    if (!free) break; // 锚位用尽，余下留在匣中
    seat(id, free);
  }
  return out;
}

export function resolvePlacedDecor(state: GameState): PlacedDecor[] {
  return resolveAnchors(state).map(({ id, anchor }) => {
    const def = DECOR_MAP.get(id);
    if (!def) return { id, anchor, name: id, glyph: id.slice(0, 1), label: id, known: false };
    return { id, anchor, name: def.name, glyph: def.glyph, label: `${def.glyph} ${def.name}`, known: true };
  });
}

export function anchorOf(state: GameState, id: string): AnchorId | null {
  return resolveAnchors(state).find((p) => p.id === id)?.anchor ?? null;
}

export function decorAt(state: GameState, anchor: AnchorId): string | null {
  return resolveAnchors(state).find((p) => p.anchor === anchor)?.id ?? null;
}

export function freeAnchors(state: GameState): AnchorId[] {
  const used = new Set(resolveAnchors(state).map((p) => p.anchor));
  return ANCHOR_IDS.filter((a) => !used.has(a));
}

/**
 * 把当前（含隐式默认的）落位写实到存档里。
 * 玩家一动手就固化全表，之后挪动某一件不会连累别人的位置。
 */
function materialize(state: GameState): Record<string, DecorSpot> {
  const map: Record<string, DecorSpot> = {};
  for (const p of resolveAnchors(state)) map[p.id] = p.anchor ?? IN_BOX;
  state.decorAnchors = map;
  return map;
}

/**
 * 点位摆放：把 id 安在 anchor 上。
 * 该位有物则交换（手上的原本在园中）或换下（手上的原本在匣中），换下者回匣不退款。
 */
export function placeAt(state: GameState, id: string, anchor: AnchorId): boolean {
  if (!state.placedDecor.includes(id) || !isAnchorId(anchor)) return false;
  const map = materialize(state);
  const from = map[id];
  if (from === anchor) return false;
  const occupant = Object.keys(map).find((key) => map[key] === anchor) ?? null;
  map[id] = anchor;
  if (occupant && occupant !== id) {
    map[occupant] = isAnchorId(from) ? from : IN_BOX;
    emit({
      type: "toast",
      text: isAnchorId(from)
        ? `${decorName(id)}与${decorName(occupant)}换了位置`
        : `换下${decorName(occupant)}，收回匣中`,
      tone: "ok",
    });
  } else {
    emit({ type: "toast", text: `${decorName(id)}安在${ANCHOR_NAMES[anchor]}`, tone: "ok" });
  }
  return true;
}

/** 收回匣中：仍归玩家所有，园中不再露面，锚位空出。 */
export function stowDecor(state: GameState, id: string): boolean {
  if (!state.placedDecor.includes(id)) return false;
  const map = materialize(state);
  if (map[id] === IN_BOX) return false;
  map[id] = IN_BOX;
  emit({ type: "toast", text: `收${decorName(id)}回匣中`, tone: "ok" });
  return true;
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
  const anchor = anchorOf(state, id);
  emit({
    type: "toast",
    text: anchor ? `${def.name}安在${ANCHOR_NAMES[anchor]}` : `园中锚位已满，${def.name}先收进匣中`,
    tone: anchor ? "ok" : "warn",
  });
  return true;
}

export function applyTheme(state: GameState, theme: DecorTheme): void {
  const pack = THEMES.find((t) => t.id === theme);
  if (!pack) return;
  // 记下最后套用的主题：app 每帧据此写根节点 [data-theme]，主题令牌才真正生效
  state.decorTheme = pack.id;
  for (const id of pack.ids) {
    if (!state.placedDecor.includes(id)) placeDecor(state, id);
  }
}

export function removeDecor(state: GameState, id: string): void {
  state.placedDecor = state.placedDecor.filter((x) => x !== id);
  if (state.decorAnchors) delete state.decorAnchors[id];
}
