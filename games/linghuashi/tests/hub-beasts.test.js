import { afterEach, describe, expect, it, vi } from "vitest";
import { createStore, defaultSave } from "../src/core/store.js";
import { BEASTS } from "../src/data/beasts.js";
import * as progression from "../src/progression/beasts.js";
import { releaseFallback, releaseRefund, resolveReleaseBeast } from "../src/ui/beast-panel.js";
import { renderHub } from "../src/ui/screen-hub.js";

function beast(uid, id = "ink_fox", star = 1) {
  const base = BEASTS.find((b) => b.id === id);
  return { ...base, uid, star };
}

function mountHub(save) {
  const store = createStore({ ...defaultSave(), ...save });
  const root = document.createElement("div");
  document.body.appendChild(root);
  const navigate = vi.fn((screen) => {
    if (screen !== "hub") return;
    root.innerHTML = "";
    renderHub({ root, store, navigate });
  });
  renderHub({ root, store, navigate });
  return { store, root, navigate };
}

function byText(root, text) {
  return [...root.querySelectorAll("button")].find((b) => b.textContent.includes(text));
}

function picks(root) {
  return [...root.querySelectorAll(".beast-pick")];
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("放生调用养成层导出", () => {
  it("progression 导出 releaseBeast 时优先用它", () => {
    const spy = vi.fn();
    expect(resolveReleaseBeast({ releaseBeast: spy })).toBe(spy);
  });

  it("尚未导出时退回只腾栏位的兜底，不自己发资源", () => {
    const release = resolveReleaseBeast({});
    expect(release).toBe(releaseFallback);

    const save = { ...defaultSave(), buns: 7, qiPills: 3, beasts: [beast("fox-1"), beast("deer-1", "shan_deer")] };
    const next = release(save, "fox-1");

    expect(next.beasts.map((b) => b.uid)).toEqual(["deer-1"]);
    expect(next.buns).toBe(7);
    expect(next.qiPills).toBe(3);
    // 纯函数：入参不被改写。
    expect(save.beasts).toHaveLength(2);
  });

  it("兜底放生找不到 uid 时不动存档", () => {
    const save = { ...defaultSave(), beasts: [beast("fox-1")] };
    const next = releaseFallback(save, "ghost");
    expect(next.beasts).toEqual(save.beasts);
  });

  it("默认解析到当前模块的实现", () => {
    const expected = typeof progression.releaseBeast === "function" ? progression.releaseBeast : releaseFallback;
    expect(resolveReleaseBeast()).toBe(expected);
  });
});

describe("枢纽灵兽栏", () => {
  it("三栏异种时放生腾出栏位（两步确认）", () => {
    const { store, root } = mountHub({
      beasts: [beast("fox-1", "ink_fox"), beast("carp-1", "paper_carp"), beast("deer-1", "shan_deer")],
    });

    expect(picks(root)).toHaveLength(3);
    expect(byText(root, "收伏").getAttribute("aria-disabled")).toBe("true");

    picks(root)[1].click();
    const release = byText(root, "放生");
    release.click();

    // 第一次点只是求确认，兽还在。
    expect(store.get().beasts).toHaveLength(3);
    expect(byText(root, "确认放生").textContent).toContain("纸鲤");

    byText(root, "确认放生").click();

    expect(store.get().beasts.map((b) => b.uid)).toEqual(["fox-1", "deer-1"]);
    expect(picks(root)).toHaveLength(2);
    // 返还规则只认养成层：这里不复述数值，只核对 UI 没有自己加减。
    expect(store.get().buns).toBe(progression.RELEASE_REFUND ?? 0);
    // 栏位真的空出来了：收伏按钮不再是「已满」，只可能卡在付不起。
    expect(byText(root, "收伏").dataset.why).not.toContain("已满");
  });

  it("放生按钮把养成层的返还价照抄给玩家", () => {
    const { root } = mountHub({ beasts: [beast("fox-1")] });
    picks(root)[0].click();

    const label = byText(root, "放生").textContent;
    if (releaseRefund()) expect(label).toContain(String(releaseRefund()));
    else expect(label).toBe("放生");
  });

  it("选中同种同星两只即可合成升星", () => {
    const { store, root } = mountHub({
      qiPills: 60,
      beasts: [beast("fox-1"), beast("fox-2"), beast("deer-1", "shan_deer")],
    });

    picks(root)[0].click();
    picks(root)[1].click();
    const evolve = byText(root, "合成");
    expect(evolve.getAttribute("aria-disabled")).toBe("false");
    evolve.click();

    const owned = store.get().beasts;
    expect(owned).toHaveLength(2);
    expect(owned.find((b) => b.id === "ink_fox").star).toBe(2);
    expect(store.get().qiPills).toBe(60 - progression.evolveCost(1));
  });

  it("异种两只不给合成，并说明原因", () => {
    const { store, root } = mountHub({ qiPills: 60, beasts: [beast("fox-1"), beast("deer-1", "shan_deer")] });

    picks(root)[0].click();
    picks(root)[1].click();
    const evolve = byText(root, "合成");

    expect(evolve.getAttribute("aria-disabled")).toBe("true");
    expect(root.querySelector(".beast-hint").textContent).toContain("同种");

    evolve.click();
    expect(store.get().beasts).toHaveLength(2);
    expect(store.get().qiPills).toBe(60);
  });

  it("洗练换一种被动并扣丹", () => {
    const { store, root } = mountHub({ qiPills: 40, beasts: [beast("fox-1")] });

    picks(root)[0].click();
    byText(root, "洗练").click();

    const [only] = store.get().beasts;
    expect(only.passive).not.toBe("crit");
    expect(store.get().qiPills).toBe(40 - progression.REROLL_COST);
  });

  it("换选另一只会撤掉待确认的放生", () => {
    const { store, root } = mountHub({ beasts: [beast("fox-1"), beast("deer-1", "shan_deer")] });

    picks(root)[0].click();
    byText(root, "放生").click();
    expect(byText(root, "确认放生")).toBeTruthy();

    picks(root)[1].click();
    expect(byText(root, "确认放生")).toBeUndefined();

    byText(root, "放生").click();
    expect(store.get().beasts).toHaveLength(2);
  });

  it("栏位有空且付得起时才允许收伏", () => {
    const { store, root } = mountHub({ buns: progression.CATCH_COST.buns, beasts: [] });

    const catchBtn = byText(root, "收伏");
    expect(catchBtn.getAttribute("aria-disabled")).toBe("false");
    catchBtn.click();

    expect(store.get().beasts).toHaveLength(1);
    expect(store.get().buns).toBe(0);
    expect(byText(root, "收伏").getAttribute("aria-disabled")).toBe("true");
  });
});
