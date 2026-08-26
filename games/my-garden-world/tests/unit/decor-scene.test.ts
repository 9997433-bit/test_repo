import { afterEach, describe, expect, it, vi } from "vitest";
import { DECORATIONS } from "../../src/data/decorations";
import { createInitialState, type GameState } from "../../src/engine/state";
import { decorSlot, placedSlot } from "../../src/scene/decor-art";
import { createGardenView } from "../../src/scene/garden-view";
import { autoPlace, resolvePlacedDecor } from "../../src/systems/decorate";

afterEach(() => {
  vi.useRealTimers();
});

/** 与游戏语义一致：入册即按锚位序默认落座（购买即可见）。 */
function own(state: GameState, decor: string[]): void {
  state.placedDecor = decor;
  for (const id of decor) autoPlace(state, id);
}

function mount(decor: string[] = []) {
  const root = document.createElement("main");
  document.body.append(root);
  const picked: number[] = [];
  const view = createGardenView(root, (id) => picked.push(id));
  const state = createInitialState();
  own(state, decor);
  view.update(state, null, null);
  return { root, view, state, picked };
}

const chips = (root: HTMLElement): HTMLButtonElement[] => [
  ...root.querySelectorAll<HTMLButtonElement>(".decor-chip"),
];
const item = (root: HTMLElement, id: string): HTMLElement | null =>
  root.querySelector<HTMLElement>(`.decor-item[data-decor="${id}"]`);

describe("decor scene layer", () => {
  it("draws one positioned scene object per placement, behind the plots", () => {
    const { root } = mount(["pavilion", "pond"]);

    const scene = root.querySelector<HTMLElement>(".decor-scene");
    expect(scene).not.toBeNull();
    // 景物层排在花圃网格之前：绝对定位后绘于花圃之下，且整层不吃指针事件。
    expect(scene?.nextElementSibling?.className).toBe("garden");
    expect(scene?.getAttribute("aria-hidden")).toBe("true");
    expect(document.getElementById("decor-scene-style")?.textContent).toContain(
      "pointer-events: none",
    );

    const pavilion = item(root, "pavilion");
    const slot = placedSlot("pavilion", "eaves");
    expect(pavilion?.querySelector("svg")).not.toBeNull();
    // 首件入册落在首个锚位「檐下」，坐标随锚位、宽度仍按陈设本体
    expect(pavilion?.style.left).toBe(`${slot.x}%`);
    expect(pavilion?.style.top).toBe(`${slot.y}%`);
    expect(pavilion?.style.getPropertyValue("--dw")).toBe(`${decorSlot("pavilion").w}%`);
    expect(pavilion?.querySelector(".decor-tag")?.textContent).toBe("半亭");
  });

  it("keeps plot clicks working through the scene layer", () => {
    const { root, picked } = mount(["path", "bridge"]);

    root.querySelector<HTMLButtonElement>('.plot[data-plot-id="2"]')?.click();

    expect(picked).toEqual([2]);
  });

  it("focuses the matching scene object when a placement chip is clicked", () => {
    const { root } = mount(["lantern", "pond"]);
    const [lanternChip, pondChip] = chips(root);
    const scene = root.querySelector<HTMLElement>(".decor-scene");

    expect(scene?.classList.contains("has-focus")).toBe(false);
    expect(lanternChip?.getAttribute("aria-label")).toBe("在园中聚焦纱灯（檐下）");

    lanternChip?.click();
    expect(scene?.classList.contains("has-focus")).toBe(true);
    expect(item(root, "lantern")?.classList.contains("is-focus")).toBe(true);
    expect(item(root, "pond")?.classList.contains("is-focus")).toBe(false);
    expect(lanternChip?.getAttribute("aria-pressed")).toBe("true");

    pondChip?.click();
    expect(item(root, "lantern")?.classList.contains("is-focus")).toBe(false);
    expect(item(root, "pond")?.classList.contains("is-focus")).toBe(true);
    expect(lanternChip?.getAttribute("aria-pressed")).toBe("false");

    pondChip?.click();
    expect(scene?.classList.contains("has-focus")).toBe(false);
    expect(item(root, "pond")?.classList.contains("is-focus")).toBe(false);
    expect(pondChip?.getAttribute("aria-pressed")).toBe("false");
  });

  it("flashes a freshly placed object and settles back on its own", () => {
    vi.useFakeTimers();
    const { root, view, state } = mount(["lantern"]);
    expect(item(root, "lantern")?.classList.contains("is-focus")).toBe(false);

    state.placedDecor = [...state.placedDecor, "moongate"];
    autoPlace(state, "moongate");
    view.update(state, null, null);
    expect(item(root, "moongate")?.classList.contains("is-focus")).toBe(true);

    vi.advanceTimersByTime(2_600);
    expect(item(root, "moongate")?.classList.contains("is-focus")).toBe(false);
    expect(root.querySelector(".decor-scene")?.classList.contains("has-focus")).toBe(false);
  });

  it("reuses existing nodes when a placement is added and drops removed ones", () => {
    const { root, view, state } = mount(["lantern"]);
    const lanternItem = item(root, "lantern");
    const lanternChip = chips(root)[0];

    state.placedDecor = ["lantern", "swing"];
    autoPlace(state, "swing");
    view.update(state, null, null);
    expect(item(root, "lantern")).toBe(lanternItem);
    expect(chips(root)[0]).toBe(lanternChip);
    expect(chips(root).map((c) => c.textContent)).toEqual(["灯 纱灯", "架 花架秋千"]);

    state.placedDecor = ["swing"];
    delete state.decorAnchors.lantern;
    view.update(state, null, null);
    expect(item(root, "lantern")).toBeNull();
    expect(lanternChip?.isConnected).toBe(false);
    expect(root.querySelectorAll(".decor-item")).toHaveLength(1);
  });

  it("clears focus when the focused placement is removed", () => {
    const { root, view, state } = mount(["lantern", "pond"]);
    chips(root)[0]?.click();
    expect(root.querySelector(".decor-scene")?.classList.contains("has-focus")).toBe(true);

    state.placedDecor = ["pond"];
    delete state.decorAnchors.lantern;
    view.update(state, null, null);

    expect(root.querySelector(".decor-scene")?.classList.contains("has-focus")).toBe(false);
  });

  it("shows an empty-garden hint until something is placed", () => {
    const { root, view, state } = mount([]);
    expect(root.querySelector(".decor-empty")?.textContent).toContain("装扮");

    own(state, ["lantern"]);
    view.update(state, null, null);
    expect(root.querySelector(".decor-empty")).toBeNull();

    state.placedDecor = [];
    state.decorAnchors = {};
    view.update(state, null, null);
    expect(root.querySelector(".decor-empty")).not.toBeNull();
  });

  it("gives every catalog decoration its own slot", () => {
    const seen = new Set<string>();
    for (const d of DECORATIONS) {
      const slot = decorSlot(d.id);
      seen.add(`${slot.x},${slot.y}`);
    }
    expect(seen.size).toBe(DECORATIONS.length);
  });
});

describe("resolvePlacedDecor", () => {
  it("labels catalog decorations, carries anchors, and passes legacy ids through", () => {
    const state = createInitialState();
    state.placedDecor = ["pond", "legacy-statue"];
    state.decorAnchors = { pond: "pond-side" };

    expect(resolvePlacedDecor(state)).toEqual([
      { id: "pond", name: "锦鲤池", glyph: "池", label: "池 锦鲤池", known: true, anchor: "pond-side", anchorLabel: "池畔" },
      {
        id: "legacy-statue",
        name: "legacy-statue",
        glyph: "l",
        label: "legacy-statue",
        known: false,
        anchor: null,
        anchorLabel: "在匣",
      },
    ]);
  });
});
