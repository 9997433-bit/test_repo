import { beforeEach, describe, expect, it, vi } from "vitest";
import { neighborGarden } from "../../src/engine/neighbors";
import { createInitialState, type GameState } from "../../src/engine/state";
import type { PanelHandlers, PanelSelection } from "../../src/ui/panels";

/**
 * 访邻面板（ui/panels.ts）与 HUD 入口（ui/hud.ts）的 UI 契约。
 * 玩法规则本身归 engine/neighbors.ts，这里只验渲染、点按与番外折的接线。
 */

type Panels = typeof import("../../src/ui/panels");
type Hud = typeof import("../../src/ui/hud");

/** 每例都换一套新模块：面板与番外折都有「本次会话只弹一次」的内存态。 */
async function freshUi(): Promise<{ panels: Panels; hud: Hud }> {
  vi.resetModules();
  const panels = await import("../../src/ui/panels");
  const hud = await import("../../src/ui/hud");
  return { panels, hud };
}

const noop = (): void => {};
const handlers = (over: Partial<PanelHandlers> = {}): PanelHandlers => ({
  selectSeed: noop,
  fulfill: noop,
  cancel: noop,
  addPick: noop,
  removePick: noop,
  craft: noop,
  pickArt: noop,
  place: noop,
  theme: noop,
  spirit: noop,
  close: noop,
  ...over,
});

const selection = (): PanelSelection => ({ workshopPick: [], orderPick: new Map(), pendingSeed: null });

function openedState(level = 5): GameState {
  const state = createInitialState(0);
  state.level = level;
  state.tutorialDone = true;
  state.tutorialStep = 9;
  return state;
}

/** 造一座最小的 .app：访邻浮层与番外折都挂在它上面。 */
function appRoot(): { root: HTMLElement; header: HTMLElement } {
  const root = document.createElement("div");
  root.className = "app";
  const header = document.createElement("header");
  const sheets = document.createElement("div");
  sheets.className = "sheets";
  root.append(header, sheets);
  document.body.append(root);
  return { root, header };
}

function plotBtn(host: ParentNode, idx: number): HTMLButtonElement {
  const el = host.querySelector<HTMLButtonElement>(`.visit-plot[data-plot-idx="${idx}"]`);
  if (!el) throw new Error(`missing neighbor plot ${idx}`);
  return el;
}

beforeEach(() => {
  document.body.innerHTML = "";
  localStorage.clear();
});

describe("访邻名录", () => {
  it("列出三位邻居，未到阶的留剪影卡", async () => {
    const { panels } = await freshUi();
    const host = document.createElement("div");

    panels.renderPanel(host, panels.VISIT_PANEL, openedState(1), selection(), handlers());

    const cards = [...host.querySelectorAll<HTMLButtonElement>(".neighbor-card")];
    expect(cards).toHaveLength(3);
    expect(host.querySelector("#visit-title")?.textContent).toBe("邻家花园");
    const sister = cards.find((c) => c.dataset.neighbor === "sister")!;
    const teahouse = cards.find((c) => c.dataset.neighbor === "teahouse")!;
    expect(sister.disabled).toBe(false);
    expect(sister.textContent).toContain("邻家阿姊");
    expect(teahouse.disabled).toBe(true);
    expect(teahouse.textContent).toContain("3 阶后来往");
  });

  it("串门进园：横幅、动作条与邻家花圃都在，首次弹一折番外", async () => {
    const { panels } = await freshUi();
    const { root } = appRoot();
    const state = openedState();
    const sheet = panels.openVisitSheet(root, state);

    sheet.querySelector<HTMLButtonElement>('.neighbor-card[data-neighbor="sister"]')!.click();

    expect(sheet.querySelector(".visit-banner")?.textContent).toContain("邻家阿姊的园子");
    expect(sheet.querySelectorAll(".visit-tool")).toHaveLength(2);
    const plots = neighborGarden(state, "sister")!.plots;
    expect(sheet.querySelectorAll(".visit-plot")).toHaveLength(plots.length);
    // 番外「篱外人家」只在首次串门弹一次
    expect(root.querySelector(".modal.side-story")?.textContent).toContain("篱外人家");
  });
});

describe("邻家园中的活计", () => {
  it("帮浇水记在存档里，圃面换成已浇且不可再点", async () => {
    const { panels } = await freshUi();
    const { root } = appRoot();
    const state = openedState();
    const sheet = panels.openVisitSheet(root, state);
    sheet.querySelector<HTMLButtonElement>('.neighbor-card[data-neighbor="sister"]')!.click();

    const thirsty = neighborGarden(state, "sister")!.plots.find((p) => p.thirsty)!;
    const before = { water: state.social.waterLeft, exp: state.exp };
    expect(plotBtn(sheet, thirsty.idx).disabled).toBe(false);

    plotBtn(sheet, thirsty.idx).click();

    expect(state.social.waterLeft).toBe(before.water - 1);
    expect(state.exp).toBeGreaterThan(before.exp);
    expect(state.social.marks).toContainEqual({ neighborId: "sister", plotIdx: thirsty.idx, kind: "water" });
    expect(plotBtn(sheet, thirsty.idx).textContent).toContain("已浇");
    expect(plotBtn(sheet, thirsty.idx).disabled).toBe(true);
  });

  it("摘花入自家花匣，圃面挂借花笺，并弹「借花一枝」番外", async () => {
    const { panels } = await freshUi();
    const { root } = appRoot();
    const state = openedState();
    const sheet = panels.openVisitSheet(root, state);
    sheet.querySelector<HTMLButtonElement>('.neighbor-card[data-neighbor="sister"]')!.click();
    // 先收起「篱外人家」，同屏只允许一折番外
    root.querySelector<HTMLButtonElement>(".modal.side-story .cta")!.click();

    sheet.querySelector<HTMLButtonElement>('.visit-tool[data-tool="pick"]')!.click();
    const bloom = neighborGarden(state, "sister")!.plots.find((p) => p.stage === "bloom")!;
    plotBtn(sheet, bloom.idx).click();

    expect(state.inventory[bloom.flowerId!]).toBe(1);
    expect(state.social.pickLeft).toBe(1);
    expect(plotBtn(sheet, bloom.idx).textContent).toContain("借花笺");
    expect(root.querySelector(".modal.side-story")?.textContent).toContain("借花一枝");
  });

  it("一家只借一枝：摘过之后摘花动作条置灰并给出缘由", async () => {
    const { panels } = await freshUi();
    const { root } = appRoot();
    const state = openedState();
    const sheet = panels.openVisitSheet(root, state);
    sheet.querySelector<HTMLButtonElement>('.neighbor-card[data-neighbor="sister"]')!.click();

    sheet.querySelector<HTMLButtonElement>('.visit-tool[data-tool="pick"]')!.click();
    const bloom = neighborGarden(state, "sister")!.plots.find((p) => p.stage === "bloom")!;
    plotBtn(sheet, bloom.idx).click();

    const pickTool = sheet.querySelector<HTMLButtonElement>('.visit-tool[data-tool="pick"]')!;
    expect(pickTool.disabled).toBe(true);
    expect(sheet.querySelector(".visit-note")?.textContent).toContain("改日再摘");
  });

  it("回自家园退回名录，并报一句串门小记", async () => {
    const { panels } = await freshUi();
    const { onGameEvent } = await import("../../src/engine/events");
    const { root } = appRoot();
    const state = openedState();
    const sheet = panels.openVisitSheet(root, state);
    sheet.querySelector<HTMLButtonElement>('.neighbor-card[data-neighbor="sister"]')!.click();
    const thirsty = neighborGarden(state, "sister")!.plots.find((p) => p.thirsty)!;
    plotBtn(sheet, thirsty.idx).click();

    const said: string[] = [];
    const off = onGameEvent((e) => {
      if (e.type === "toast") said.push(e.text);
    });
    sheet.querySelector<HTMLButtonElement>(".visit-home")!.click();
    off();

    expect(sheet.querySelectorAll(".neighbor-card")).toHaveLength(3);
    expect(sheet.querySelector(".visit-banner")).toBeNull();
    expect(said.at(-1)).toContain("串门小记");
  });
});

describe("HUD 访邻入口", () => {
  it("开园前不露出，开园后点开与收起访邻花笺", async () => {
    const { panels, hud } = await freshUi();
    const { root, header } = appRoot();
    const view = hud.createHud(header);
    const state = openedState();
    state.tutorialDone = false;

    view.update(state);
    const btn = root.querySelector<HTMLButtonElement>(".pill-visit")!;
    expect(btn.hidden).toBe(true);

    state.tutorialDone = true;
    view.update(state);
    expect(btn.hidden).toBe(false);

    btn.click();
    expect(panels.visitSheetEl(root)).not.toBeNull();
    btn.click();
    expect(panels.visitSheetEl(root)).toBeNull();
  });

  it("Esc 先从邻家退回名录，再退出串门", async () => {
    const { panels } = await freshUi();
    const { root } = appRoot();
    const sheet = panels.openVisitSheet(root, openedState());
    sheet.querySelector<HTMLButtonElement>('.neighbor-card[data-neighbor="sister"]')!.click();
    expect(sheet.querySelector(".visit-banner")).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(sheet.querySelector(".visit-banner")).toBeNull();
    expect(sheet.querySelectorAll(".neighbor-card")).toHaveLength(3);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(panels.visitSheetEl(root)).toBeNull();
  });

  it("去点 dock 就当回自家园，两张花笺不叠着", async () => {
    const { panels } = await freshUi();
    const { root } = appRoot();
    const dock = document.createElement("nav");
    dock.className = "dock";
    const dockBtn = document.createElement("button");
    dock.append(dockBtn);
    root.append(dock);
    panels.openVisitSheet(root, openedState());

    dockBtn.dispatchEvent(new Event("pointerdown", { bubbles: true }));

    expect(panels.visitSheetEl(root)).toBeNull();
  });
});
