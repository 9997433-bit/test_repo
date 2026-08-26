import { beforeEach, describe, expect, it } from "vitest";
import { SPIRITS } from "../../src/data/spirits";
import { createInitialState, type GameState } from "../../src/engine/state";
import { emit } from "../../src/engine/events";
import { createHud } from "../../src/ui/hud";
import { renderPanel, type PanelHandlers, type PanelSelection } from "../../src/ui/panels";
import { mountToasts } from "../../src/ui/toast";

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
  arrange: noop,
  visit: noop,
  spirit: noop,
  close: noop,
  ...over,
});

const selection = (): PanelSelection => ({ workshopPick: [], orderPick: new Map(), pendingSeed: null });

function stateWith(unlocked: string[], active: string | null = null): GameState {
  const s = createInitialState(0);
  s.unlockedSpirits = [...unlocked];
  s.activeSpirit = active;
  return s;
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("花灵面板", () => {
  it("每位花灵都有形象，未苏醒的作封印剪影", () => {
    const host = document.createElement("div");
    renderPanel(host, "spirit", stateWith(["juyue"]), selection(), handlers());

    const cards = [...host.querySelectorAll<HTMLElement>(".spirit-card")];
    // 「暂不请灵」+ 五位花灵
    expect(cards).toHaveLength(SPIRITS.length + 1);
    for (const card of cards) {
      expect(card.querySelector("svg.spirit-glyph")).not.toBeNull();
    }

    const juyue = cards.find((c) => c.textContent?.includes("菊月"))!;
    const xueyi = cards.find((c) => c.textContent?.includes("雪衣"))!;
    expect(juyue.querySelector("svg")!.classList.contains("is-sealed")).toBe(false);
    expect(xueyi.querySelector("svg")!.classList.contains("is-sealed")).toBe(true);
    expect((xueyi as HTMLButtonElement).disabled).toBe(true);
    expect(juyue.getAttribute("aria-label")).toContain("金菊承月");
  });

  it("顶栏点出谁在随行，并可切回不请灵", () => {
    const host = document.createElement("div");
    const picks: (string | null)[] = [];
    renderPanel(host, "spirit", stateWith(["juyue", "chiguang"], "chiguang"), selection(), handlers({ spirit: (id) => picks.push(id) }));

    const banner = host.querySelector<HTMLElement>(".spirit-banner")!;
    expect(banner.textContent).toContain("池光 随行");
    expect(banner.textContent).toContain("水声里");
    expect(banner.querySelector("svg.spirit-glyph")).not.toBeNull();

    const active = host.querySelector<HTMLElement>(".spirit-card.is-on")!;
    expect(active.textContent).toContain("池光");
    host.querySelectorAll<HTMLButtonElement>(".spirit-card")[0]!.click();
    expect(picks).toEqual([null]);
  });

  it("没有花灵随行时给出留白空印", () => {
    const host = document.createElement("div");
    renderPanel(host, "spirit", stateWith([]), selection(), handlers());
    const banner = host.querySelector<HTMLElement>(".spirit-banner")!;
    expect(banner.textContent).toContain("尚未请灵");
    expect(banner.querySelector("text")!.textContent).toBe("灵");
  });
});

describe("HUD 花灵印", () => {
  function mount(): { root: HTMLElement; hud: ReturnType<typeof createHud> } {
    const root = document.createElement("div");
    root.className = "app";
    const header = document.createElement("header");
    root.append(header);
    document.body.append(root);
    return { root, hud: createHud(header) };
  }

  it("一位花灵都没唤醒时不占位", () => {
    const { root, hud } = mount();
    hud.update(stateWith([]));
    expect(root.querySelector<HTMLElement>(".pill-spirit")!.hidden).toBe(true);
    expect(root.getAttribute("data-spirit")).toBe("");
  });

  it("唤醒后现身，随行时写出名字与形象，并把 id 发布到根节点", () => {
    const { root, hud } = mount();
    hud.update(stateWith(["juyue"]));
    const pill = root.querySelector<HTMLElement>(".pill-spirit")!;
    expect(pill.hidden).toBe(false);
    expect(pill.textContent).toBe("未请灵");
    expect(root.getAttribute("data-spirit")).toBe("");

    hud.update(stateWith(["juyue"], "juyue"));
    expect(pill.textContent).toBe("菊月");
    expect(pill.getAttribute("aria-label")).toContain("随行花灵 菊月");
    expect(pill.querySelector("svg.spirit-glyph")).not.toBeNull();
    expect(root.getAttribute("data-spirit")).toBe("juyue");
  });

  it("形象只在换灵时重绘，其余帧不动 DOM", () => {
    const { root, hud } = mount();
    const state = stateWith(["juyue", "chiguang"], "juyue");
    hud.update(state);
    const mark = root.querySelector<HTMLElement>(".pill-spirit .pill-mark")!;
    const svg = mark.firstElementChild;
    state.coins += 10;
    hud.update(state);
    expect(mark.firstElementChild).toBe(svg);
    state.activeSpirit = "chiguang";
    hud.update(state);
    expect(mark.firstElementChild).not.toBe(svg);
    expect(root.getAttribute("data-spirit")).toBe("chiguang");
  });

  it("其余资源字段照旧", () => {
    const { root, hud } = mount();
    const state = stateWith([]);
    state.coins = 123;
    hud.update(state);
    const coins = root.querySelector<HTMLElement>(".pill-coins")!;
    expect(coins.textContent).toBe("金 123");
    expect(coins.getAttribute("aria-label")).toBe("金币 123");
  });
});

describe("提示条", () => {
  it("花灵开口时带上形象，寻常提示保持纯文本", () => {
    const root = document.createElement("div");
    document.body.append(root);
    mountToasts(root);

    emit({ type: "toast", text: SPIRITS[0]!.line, tone: "rare" });
    const spiritToast = root.querySelector<HTMLElement>(".toast.spirit")!;
    expect(spiritToast.textContent).toBe(SPIRITS[0]!.line);
    expect(spiritToast.querySelector("svg.spirit-glyph")).not.toBeNull();

    emit({ type: "toast", text: "金币 +30", tone: "ok" });
    const plain = [...root.querySelectorAll<HTMLElement>(".toast")].at(-1)!;
    expect(plain.classList.contains("spirit")).toBe(false);
    expect(plain.querySelector("svg")).toBeNull();
  });
});
