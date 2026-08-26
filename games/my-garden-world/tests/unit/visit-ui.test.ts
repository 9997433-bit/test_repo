import { beforeEach, describe, expect, it, vi } from "vitest";
import { neighborGarden } from "../../src/engine/neighbors";
import { createInitialState, type GameState } from "../../src/engine/state";
import type { PanelHandlers, PanelSelection } from "../../src/ui/panels";

/**
 * 访邻面板（ui/panels.ts）的 UI 契约：入口是 dock「访邻」印章，
 * 走的仍是 app.ts 那条 renderPanel 通路。
 * 玩法规则本身归 engine/neighbors.ts，这里只验渲染、点按与番外折的接线。
 */

type Panels = typeof import("../../src/ui/panels");

/** 每例都换一套新模块：面板与番外折都有「本次会话只弹一次」的内存态。 */
async function freshUi(): Promise<Panels> {
  vi.resetModules();
  return await import("../../src/ui/panels");
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

/**
 * 造一座最小的 .app（番外折挂在它上面），并照 app.ts 的样子把访邻花笺
 * 渲进 `.sheets`：收起就是清空容器，与真的 `panel = null` 同一效果。
 */
function openVisit(panels: Panels, state: GameState): { root: HTMLElement; host: HTMLElement; sheet: HTMLElement } {
  const root = document.createElement("div");
  root.className = "app";
  const host = document.createElement("div");
  host.className = "sheets";
  root.append(host);
  document.body.append(root);
  const close = (): void => panels.renderPanel(host, null, state, selection(), handlers());
  panels.renderPanel(host, panels.VISIT_PANEL, state, selection(), handlers({ close }));
  return { root, host, sheet: host.querySelector<HTMLElement>(".sheet")! };
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
    const panels = await freshUi();
    const { host } = openVisit(panels, openedState(1));

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
    const panels = await freshUi();
    const state = openedState();
    const { root, sheet } = openVisit(panels, state);

    sheet.querySelector<HTMLButtonElement>('.neighbor-card[data-neighbor="sister"]')!.click();

    expect(sheet.querySelector("#visit-title")?.textContent).toBe("邻家阿姊的园子");
    expect(sheet.querySelector(".visit-banner")?.textContent).toContain("邻家阿姊");
    expect(sheet.querySelectorAll(".visit-tool")).toHaveLength(2);
    const plots = neighborGarden(state, "sister")!.plots;
    expect(sheet.querySelectorAll(".visit-plot")).toHaveLength(plots.length);
    // 番外「篱外人家」只在首次串门弹一次
    expect(root.querySelector(".modal.side-story")?.textContent).toContain("篱外人家");
  });
});

describe("邻家园中的活计", () => {
  it("帮浇水记在存档里，圃面换成已浇且不可再点", async () => {
    const panels = await freshUi();
    const state = openedState();
    const { sheet } = openVisit(panels, state);
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
    const panels = await freshUi();
    const state = openedState();
    const { root, sheet } = openVisit(panels, state);
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
    const panels = await freshUi();
    const state = openedState();
    const { sheet } = openVisit(panels, state);
    sheet.querySelector<HTMLButtonElement>('.neighbor-card[data-neighbor="sister"]')!.click();

    sheet.querySelector<HTMLButtonElement>('.visit-tool[data-tool="pick"]')!.click();
    const bloom = neighborGarden(state, "sister")!.plots.find((p) => p.stage === "bloom")!;
    plotBtn(sheet, bloom.idx).click();

    const pickTool = sheet.querySelector<HTMLButtonElement>('.visit-tool[data-tool="pick"]')!;
    expect(pickTool.disabled).toBe(true);
    expect(sheet.querySelector(".visit-note")?.textContent).toContain("改日再摘");
  });

  it("回自家园退回名录，并报一句串门小记", async () => {
    const panels = await freshUi();
    const { onGameEvent } = await import("../../src/engine/events");
    const state = openedState();
    const { sheet } = openVisit(panels, state);
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

describe("访邻花笺的开合", () => {
  it("Esc 先从邻家退回名录，再收起花笺", async () => {
    const panels = await freshUi();
    const { host, sheet } = openVisit(panels, openedState());
    sheet.querySelector<HTMLButtonElement>('.neighbor-card[data-neighbor="sister"]')!.click();
    expect(sheet.querySelector(".visit-banner")).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(sheet.querySelector(".visit-banner")).toBeNull();
    expect(sheet.querySelectorAll(".neighbor-card")).toHaveLength(3);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(host.querySelector(".sheet")).toBeNull();
  });

  it("收起后再开从名录进，不落在上回那家院里", async () => {
    const panels = await freshUi();
    const state = openedState();
    const { host } = openVisit(panels, state);
    host.querySelector<HTMLButtonElement>('.neighbor-card[data-neighbor="sister"]')!.click();
    expect(host.querySelector(".visit-banner")).not.toBeNull();

    // 换去别的 dock 面板，再回来
    panels.renderPanel(host, "bag", state, selection(), handlers());
    panels.renderPanel(host, panels.VISIT_PANEL, state, selection(), handlers());

    expect(host.querySelector(".visit-banner")).toBeNull();
    expect(host.querySelectorAll(".neighbor-card")).toHaveLength(3);
  });

  it("花笺带 visit-sheet 印记，供 CSS 按当前动作换圃色", async () => {
    const panels = await freshUi();
    const { sheet } = openVisit(panels, openedState());

    expect(sheet.classList.contains("visit-sheet")).toBe(true);
  });
});
