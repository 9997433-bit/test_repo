import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createInitialState, type GameState } from "../../src/engine/state";
import { anchorSlot } from "../../src/scene/decor-art";
import { createGardenView, type GardenView } from "../../src/scene/garden-view";
import { ANCHOR_IDS, anchorOf, type AnchorId } from "../../src/systems/decorate";

interface Mounted {
  root: HTMLElement;
  view: GardenView;
  state: GameState;
  picked: number[];
}

function mount(decor: string[]): Mounted {
  const root = document.createElement("main");
  document.body.append(root);
  const picked: number[] = [];
  const view = createGardenView(root, (id) => picked.push(id));
  const state = createInitialState();
  state.placedDecor = decor;
  view.update(state, null, null);
  return { root, view, state, picked };
}

const anchorEl = (root: HTMLElement, anchor: AnchorId): HTMLButtonElement =>
  root.querySelector<HTMLButtonElement>(`.decor-anchor[data-anchor="${anchor}"]`)!;
const chip = (root: HTMLElement, id: string): HTMLButtonElement =>
  root.querySelector<HTMLButtonElement>(`.decor-chip[data-decor="${id}"]`)!;
const toggle = (root: HTMLElement): HTMLButtonElement =>
  root.querySelector<HTMLButtonElement>(".decor-place:not(.decor-stow)")!;
const stow = (root: HTMLElement): HTMLButtonElement =>
  root.querySelector<HTMLButtonElement>(".decor-stow")!;
const item = (root: HTMLElement, id: string): HTMLElement | null =>
  root.querySelector<HTMLElement>(`.decor-item[data-decor="${id}"]`);

beforeEach(() => {
  document.body.replaceChildren();
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("摆放模式：八锚位 tap-tap", () => {
  it("模式关着时园中不见锚位，开了才浮现八个", () => {
    const { root, view } = mount(["lantern", "pond"]);
    expect(root.querySelectorAll(".decor-anchor")).toHaveLength(ANCHOR_IDS.length);
    expect(root.querySelector(".decor-scene")?.classList.contains("is-placing")).toBe(false);

    toggle(root).click();

    expect(view.isPlaceMode()).toBe(true);
    expect(root.querySelector(".decor-scene")?.classList.contains("is-placing")).toBe(true);
    expect(toggle(root).textContent).toBe("完成");
    // 空位与占位一眼可分：空位泛绿呼吸，占位挂着自己的印章
    expect(anchorEl(root, "eave").dataset.filled).toBe("1");
    expect(anchorEl(root, "eave").querySelector(".a-glyph")?.textContent).toBe("灯");
    expect(anchorEl(root, "heart").dataset.filled).toBe("0");
    expect(anchorEl(root, "heart").getAttribute("aria-label")).toBe("园心：空位，先择一件陈设");
  });

  it("点挂牌拿起、点空锚位安置，景物随即挪到新落点并入档", () => {
    const { root, view, state } = mount(["lantern", "pond"]);
    view.setPlaceMode(true);

    chip(root, "lantern").click();
    expect(chip(root, "lantern").classList.contains("is-held")).toBe(true);
    expect(anchorEl(root, "heart").getAttribute("aria-label")).toBe("园心：空位，点按安置");

    anchorEl(root, "heart").click();

    expect(anchorOf(state, "lantern")).toBe("heart");
    expect(item(root, "lantern")?.style.left).toBe(`${anchorSlot("heart").x}%`);
    expect(item(root, "lantern")?.style.top).toBe(`${anchorSlot("heart").y}%`);
    expect(anchorEl(root, "heart").dataset.filled).toBe("1");
    expect(anchorEl(root, "eave").dataset.filled).toBe("0");
    // 落定即松手，可以接着摆下一件
    expect(chip(root, "lantern").classList.contains("is-held")).toBe(false);
  });

  it("手持一件点占位锚位就是两件对调", () => {
    const { root, view, state } = mount(["lantern", "pond"]);
    view.setPlaceMode(true);

    chip(root, "lantern").click();
    anchorEl(root, "pondside").click();

    expect(anchorOf(state, "lantern")).toBe("pondside");
    expect(anchorOf(state, "pond")).toBe("eave");
    expect(anchorEl(root, "pondside").querySelector(".a-glyph")?.textContent).toBe("灯");
    expect(anchorEl(root, "eave").querySelector(".a-glyph")?.textContent).toBe("池");
  });

  it("空手点占位锚位是拿起，再点同一处是放下", () => {
    const { root, view, state } = mount(["lantern"]);
    view.setPlaceMode(true);

    anchorEl(root, "eave").click();
    expect(chip(root, "lantern").classList.contains("is-held")).toBe(true);

    anchorEl(root, "eave").click();
    expect(chip(root, "lantern").classList.contains("is-held")).toBe(false);
    expect(anchorOf(state, "lantern")).toBe("eave");
  });

  it("回匣与再入园：收起的陈设仍挂着牌，点它就能重新落座", () => {
    const { root, view, state } = mount(["lantern", "pond"]);
    view.setPlaceMode(true);
    expect(stow(root).hidden).toBe(true);

    chip(root, "lantern").click();
    expect(stow(root).hidden).toBe(false);
    stow(root).click();

    expect(anchorOf(state, "lantern")).toBeNull();
    expect(item(root, "lantern")).toBeNull();
    expect(chip(root, "lantern").dataset.boxed).toBe("1");
    expect(stow(root).hidden).toBe(true);

    chip(root, "lantern").click();
    anchorEl(root, "gate").click();
    expect(anchorOf(state, "lantern")).toBe("gate");
    expect(item(root, "lantern")?.isConnected).toBe(true);
    expect(chip(root, "lantern").dataset.boxed).toBe("0");
  });

  it("空手点空锚位不生效，只轻晃一下提示先择一件", () => {
    const { root, view, state } = mount(["lantern"]);
    view.setPlaceMode(true);

    anchorEl(root, "heart").click();

    expect(anchorOf(state, "lantern")).toBe("eave");
    expect(anchorEl(root, "heart").classList.contains("is-nudge")).toBe(true);
    expect(root.querySelector(".decor-status")?.textContent).toContain("先在挂牌上择一件");
  });

  it("摆放模式里挂牌不再聚焦；按 Esc 或「完成」退出后聚焦照旧", () => {
    const { root, view } = mount(["lantern", "pond"]);
    view.setPlaceMode(true);

    chip(root, "lantern").click();
    expect(root.querySelector(".decor-scene")?.classList.contains("has-focus")).toBe(false);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(view.isPlaceMode()).toBe(false);
    expect(root.querySelector(".decor-status")?.textContent).toBe("布置已保存");

    chip(root, "lantern").click();
    expect(item(root, "lantern")?.classList.contains("is-focus")).toBe(true);
  });

  it("锚位只吃自己那一点指针事件，花圃照点不误", () => {
    const { root, view, picked } = mount(["lantern"]);
    view.setPlaceMode(true);

    root.querySelector<HTMLButtonElement>('.plot[data-plot-id="3"]')?.click();

    expect(picked).toEqual([3]);
    expect(document.getElementById("decor-scene-style")?.textContent).toContain(
      ".anchor-layer { position: absolute; inset: 0; display: none;",
    );
  });

  it("庭中无一物时不给摆放入口，置了物才出现", () => {
    const { root, view, state } = mount([]);
    expect(toggle(root).hidden).toBe(true);

    state.placedDecor = ["lantern"];
    view.update(state, null, null);
    expect(toggle(root).hidden).toBe(false);
  });

  it("外层直接改落位（如面板一键主题），下一帧场景跟着挪", () => {
    const { root, view, state } = mount(["lantern"]);
    expect(item(root, "lantern")?.style.left).toBe(`${anchorSlot("eave").x}%`);

    state.decorAnchors = { lantern: "corner-south" };
    view.update(state, null, null);

    expect(item(root, "lantern")?.style.left).toBe(`${anchorSlot("corner-south").x}%`);
  });
});
