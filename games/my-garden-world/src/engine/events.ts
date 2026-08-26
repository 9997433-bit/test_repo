export type GameEvent =
  | { type: "toast"; text: string; tone?: "ok" | "warn" | "rare" }
  | { type: "levelup"; level: number }
  | { type: "harvest"; flowerId: string; plotId: number }
  | { type: "bloom"; plotId: number }
  | { type: "orderDone"; title: string }
  | { type: "particles"; kind: "water" | "petal" | "gold" | "ink"; x: number; y: number };

type Listener = (e: GameEvent) => void;

const listeners = new Set<Listener>();

export function onGameEvent(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emit(e: GameEvent): void {
  for (const fn of listeners) fn(e);
}
