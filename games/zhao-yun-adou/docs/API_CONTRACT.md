# API 契约（模块边界）

## `createGame(opts) → api`

```ts
type SideId = "player" | "ai";
type UnitKind = "dao" | "qiang" | "gong" | "qi" | "glyph" | "hero" | "shovel" | "token";

interface GameAPI {
  state: GameState;
  tick(dt: number): void;
  recruit(side?: SideId): RecruitResult | null;
  place(side: SideId, handIndex: number, cellIndex: number): boolean;
  merge(side: SideId, from: CellRef, to: CellRef): boolean;
  useShovel(side: SideId, handIndex: number, cellIndex: number): boolean;
  tryAwaken(side: SideId): Hero[] ;
  serialize(): object;
  load(snapshot: object): void;
}
```

规则必须纯函数化到 `src/board` / `src/combat`，便于单测。`Math.random` 禁止直接使用，一律走 `state.rng`。
