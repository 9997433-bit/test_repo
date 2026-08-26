import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FLOWER_MAP } from "../../src/data/flowers";
import { onGameEvent, type GameEvent } from "../../src/engine/events";
import {
  canPick,
  canWater,
  createNeighborView,
  fromSnapshot,
  generatePlots,
  type NeighborPlot,
  type NeighborView,
  type VisitSummary,
} from "../../src/scene/neighbor-view";

const SEEDS = ["sister@1", "sister@2", "teahouse@1", "hedge@7", 42, 1_000];

function host(): HTMLElement {
  const el = document.createElement("main");
  document.body.append(el);
  return el;
}

function cells(root: HTMLElement): HTMLButtonElement[] {
  return [...root.querySelectorAll<HTMLButtonElement>(".n-plot")];
}

function cell(root: HTMLElement, idx: number): HTMLButtonElement {
  return root.querySelector<HTMLButtonElement>(`.n-plot[data-plot-idx="${idx}"]`)!;
}

function act(root: HTMLElement, label: string): HTMLButtonElement {
  return [...root.querySelectorAll<HTMLButtonElement>(".n-act")].find((b) => b.textContent === label)!;
}

function toasts(run: () => void): string[] {
  const seen: string[] = [];
  const off = onGameEvent((e: GameEvent) => {
    if (e.type === "toast") seen.push(e.text);
  });
  run();
  off();
  return seen;
}

beforeEach(() => {
  document.body.replaceChildren();
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("generatePlots：邻家园子的程序化生成", () => {
  it("同一颗种子长出同一座园子，不同种子各不相同", () => {
    for (const seed of SEEDS) {
      expect(generatePlots(seed)).toEqual(generatePlots(seed));
    }
    const shapes = new Set(SEEDS.map((seed) => JSON.stringify(generatePlots(seed))));
    expect(shapes.size).toBeGreaterThan(1);
  });

  it("四到八块圃，花种与阶段都取自真数据", () => {
    for (const seed of SEEDS) {
      const plots = generatePlots(seed);
      expect(plots.length).toBeGreaterThanOrEqual(4);
      expect(plots.length).toBeLessThanOrEqual(8);
      plots.forEach((plot, idx) => {
        expect(plot.idx).toBe(idx);
        expect(plot.helped).toBe(false);
        expect(plot.borrowed).toBe(false);
        if (!plot.flowerId) {
          expect(plot.stage).toBe("empty");
          return;
        }
        const def = FLOWER_MAP[plot.flowerId];
        expect(def).toBeDefined();
        expect(plot.waterNeed).toBe(def!.waterNeed);
        expect(plot.watered).toBeLessThanOrEqual(plot.waterNeed);
        // 只读快照不长也不凋
        expect(["seeded", "sprout", "bud", "bloom"]).toContain(plot.stage);
      });
    }
  });

  it("保底：串门必有事可做——两块有花、一块可摘、一块缺水", () => {
    for (let i = 0; i < 200; i++) {
      const plots = generatePlots(`neighbor-${i}`);
      expect(plots.filter((p) => p.flowerId).length).toBeGreaterThanOrEqual(2);
      expect(plots.filter(canPick).length).toBeGreaterThanOrEqual(1);
      expect(plots.filter(canWater).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("外部快照也能摊成场景花圃：水滴按花种补齐，痕迹原样带过来", () => {
    const plots = fromSnapshot([
      { idx: 0, flowerId: "peony", stage: "growing", thirsty: true },
      { idx: 1, flowerId: "chrys", stage: "growing", watered: true },
      { idx: 2, flowerId: "daisy", stage: "bloom", picked: true },
      { idx: 3, flowerId: "daisy", stage: "empty" },
    ]);

    expect(plots[0]).toEqual({
      idx: 0,
      flowerId: "peony",
      stage: "bud",
      waterNeed: FLOWER_MAP.peony!.waterNeed,
      watered: 0,
      helped: false,
      borrowed: false,
    });
    expect(canWater(plots[0]!)).toBe(true);
    expect(canWater(plots[1]!)).toBe(false);
    expect(plots[1]!.helped).toBe(true);
    expect(canPick(plots[2]!)).toBe(false);
    expect(plots[2]!.borrowed).toBe(true);
    expect(plots[3]).toMatchObject({ flowerId: null, stage: "empty", waterNeed: 0 });
  });

  it("按给定花种池生成，池子空了退回默认池", () => {
    const pool = ["peony", "chrys"];
    for (const plot of generatePlots("pool", pool)) {
      if (plot.flowerId) expect(pool).toContain(plot.flowerId);
    }
    expect(generatePlots("pool", [])).toEqual(generatePlots("pool"));
  });
});

describe("邻家庭院：可玩的一次串门", () => {
  function visit(overrides: Partial<Parameters<typeof createNeighborView>[1]> = {}): {
    root: HTMLElement;
    view: NeighborView;
    left: VisitSummary[];
  } {
    const root = host();
    const left: VisitSummary[] = [];
    const view = createNeighborView(root, {
      name: "阿姊",
      seed: "sister@1",
      onLeave: (s) => left.push(s),
      ...overrides,
    });
    return { root, view, left };
  }

  it("摆出横幅、花圃与访客动作条，每块圃都念得出中文状态", () => {
    const { root, view } = visit();

    expect(root.querySelector(".neighbor-banner strong")?.textContent).toBe("阿姊家的园子");
    expect(cells(root)).toHaveLength(view.plots.length);
    const bloom = view.plots.find(canPick)!;
    expect(cell(root, bloom.idx).getAttribute("aria-label")).toMatch(
      new RegExp(`^阿姊家花圃${bloom.idx + 1}：.+，盛放，可摘$`),
    );
    expect(act(root, "帮浇水").getAttribute("aria-pressed")).toBe("true");
  });

  it("帮浇水：缺水的圃泛绿可点，浇完补满水滴并记一笔友谊", () => {
    const { root, view } = visit();
    const thirsty = view.plots.find(canWater)!;

    expect(cell(root, thirsty.idx).classList.contains("can-act")).toBe(true);
    cell(root, thirsty.idx).click();

    expect(thirsty.watered).toBe(thirsty.waterNeed);
    expect(thirsty.helped).toBe(true);
    expect(view.summary()).toMatchObject({ watered: 1, friendship: 1, picked: [] });
    expect(cell(root, thirsty.idx).querySelector(".n-note")?.textContent).toBe("已浇");
    expect(root.querySelector(".n-tally")?.textContent).toBe("浇了 1 瓢 · 借得 0 枝");
  });

  it("摘花：只摘得下盛放的花，摘完留一张借花笺，且一家只借一枝", () => {
    const { root, view } = visit();
    act(root, "摘花").click();
    const bloom = view.plots.find(canPick)!;
    const flowerId = bloom.flowerId;

    cell(root, bloom.idx).click();

    expect(view.summary().picked).toEqual([flowerId]);
    expect(bloom.borrowed).toBe(true);
    expect(bloom.stage).toBe("empty");
    expect(cell(root, bloom.idx).querySelector(".n-note")?.textContent).toBe("借花笺");

    const another = view.plots.find(canPick);
    if (another) {
      act(root, "摘花").click();
      const denied = toasts(() => cell(root, another.idx).click());
      expect(denied).toEqual(["一家只借一枝，去别家看看"]);
      expect(view.summary().picked).toEqual([flowerId]);
    }
  });

  it("受阻必有回声：摘未开的花、给不缺水的圃浇水都给一声提示", () => {
    const { root, view } = visit();
    const thirsty = view.plots.find(canWater)!;

    act(root, "摘花").click();
    expect(toasts(() => cell(root, thirsty.idx).click())).toEqual(["花未开，摘不得"]);

    act(root, "帮浇水").click();
    cell(root, thirsty.idx).click();
    expect(toasts(() => cell(root, thirsty.idx).click())).toEqual(["这圃不缺水"]);
  });

  it("上层可以否掉一次互动（日限用尽），快照就不动", () => {
    const root = host();
    const view = createNeighborView(root, { name: "阿姊", seed: "sister@1", onWater: () => false });
    const thirsty = view.plots.find(canWater)!;
    const before = thirsty.watered;

    cell(root, thirsty.idx).click();

    expect(thirsty.watered).toBe(before);
    expect(view.summary().watered).toBe(0);
  });

  it("余量耗尽后动作置灰，文案说明缘由", () => {
    const root = host();
    const view = createNeighborView(root, { name: "阿姊", seed: "sister@1", waterLeft: 1, pickLeft: 0 });
    expect(act(root, "摘花").disabled).toBe(true);
    expect(act(root, "摘花").getAttribute("aria-label")).toBe("摘花，今日还可摘 0 枝");

    for (const plot of view.plots.filter(canWater)) cell(root, plot.idx).click();

    expect(view.summary().watered).toBe(1);
    expect(act(root, "帮浇水").disabled).toBe(true);
  });

  it("回家：小结一句，场景摘下，Esc 与横幅按钮同效且只结算一次", () => {
    const { root, view, left } = visit();
    const thirsty = view.plots.find(canWater)!;
    cell(root, thirsty.idx).click();

    const said = toasts(() => act(root, "回家").click());

    expect(said).toEqual(["串门小记：浇了 1 瓢水，借得 0 枝，友谊 +1"]);
    expect(root.querySelector(".neighbor")).toBeNull();
    expect(left).toHaveLength(1);
    expect(left[0]).toMatchObject({ neighbor: "阿姊", watered: 1, friendship: 1 });

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(left).toHaveLength(1);
  });

  it("只看不动也成立：什么都没做就回家，说一句明日再来", () => {
    visit();
    const said = toasts(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
    expect(said).toEqual(["阿姊家坐了坐，明日再来帮衬"]);
  });

  it("给定快照就照着画，不再重新生成", () => {
    const plots: NeighborPlot[] = [
      { idx: 0, flowerId: "peony", stage: "bloom", watered: 3, waterNeed: 3, helped: false, borrowed: false },
      { idx: 1, flowerId: null, stage: "empty", watered: 0, waterNeed: 0, helped: false, borrowed: false },
    ];
    const root = host();
    const view = createNeighborView(root, { name: "东篱客", seed: "unused", plots });

    expect(view.plots).toBe(plots);
    expect(cells(root)).toHaveLength(2);
    expect(cell(root, 1).disabled).toBe(true);
    expect(cell(root, 1).getAttribute("aria-label")).toBe("东篱客家花圃2：空圃");
    expect(act(root, "帮浇水").disabled).toBe(true);
    expect(act(root, "帮浇水").getAttribute("aria-label")).toBe("东篱客园里今日水足");
  });
});
