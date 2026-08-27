// @vitest-environment jsdom
//
// 皮肤选择器吃 F3 真表的回归测试（Round 1 遗留 10）。
// 以前这里只会读兜底表的字段名，真表进来时六格会画成同一只灰胶囊，
// 而且 `trim`（真表里是数值对象）会被当颜色写进 fill，变成 "[object Object]"。

import { describe, expect, it, vi } from "vitest";

import { GLOVES, SKINS } from "../data/index.js";
import { FALLBACK_SKINS, resolveSkins } from "../core/skins.js";
import { createMenu, skinSilhouette } from "./menu.js";

const TABLE = resolveSkins({ SKINS, DEFAULT_SKIN_ID: "drifter" });

function makeMenu(overrides = {}) {
  const picks = [];
  const starts = [];
  const menu = createMenu({
    gloves: GLOVES,
    skinTable: TABLE,
    // 旧档：皮肤存的是兜底表的 ash，真表里没有这个 id
    save: { loadout: { main: "cotton", off: "cotton" }, skinId: "ash", unlocked: ["cotton"] },
    isUnlocked: () => true,
    unlockTextOf: () => "局内挑战",
    onStart: (loadout) => starts.push(loadout),
    onPickSkin: (id) => picks.push(id),
    ...overrides,
  });
  return { menu, picks, starts };
}

describe("皮肤剪影吃真表形状", () => {
  it("六套真表皮肤画出六种不同的剪影", () => {
    const markup = SKINS.map((s) => skinSilhouette(s).outerHTML);
    expect(new Set(markup).size).toBe(SKINS.length);
  });

  it("不会把真表的 trim（数值对象）当颜色写进 fill", () => {
    for (const s of SKINS) {
      const html = skinSilhouette(s).outerHTML;
      expect(html).not.toContain("[object Object]");
      expect(html).not.toContain("undefined");
      expect(html).not.toContain("NaN");
    }
  });

  it("剪影按 id / 部件挂 CSS 钩子", () => {
    const nuo = skinSilhouette(SKINS.find((s) => s.id === "nuo"));
    expect(nuo.getAttribute("data-skin")).toBe("nuo");
    expect(nuo.getAttribute("data-headgear")).toBe("mask");
    expect(nuo.getAttribute("data-build")).toBe("slim");
    expect(nuo.getAttribute("data-back")).toBe("banner");
  });

  it("兜底表形状照旧能画，两张表都不退化成一只胶囊", () => {
    const markup = FALLBACK_SKINS.map((s) => skinSilhouette(s).outerHTML);
    expect(new Set(markup).size).toBe(FALLBACK_SKINS.length);
    for (const html of markup) expect(html).not.toContain("[object Object]");
  });

  it("皮肤给的是空对象也画得出人形（不抛、不留空 svg）", () => {
    const el = skinSilhouette({});
    expect(el.tagName.toLowerCase()).toBe("svg");
    expect(el.childNodes.length).toBeGreaterThan(2);
  });
});

describe("选皮肤面板", () => {
  it("六格一格一套，格上写真表的名字", () => {
    const { menu } = makeMenu();
    const tiles = [...menu.el.querySelectorAll(".yz-skin-tile")];
    expect(tiles).toHaveLength(SKINS.length);
    expect(tiles.map((t) => t.dataset.skin)).toEqual(SKINS.map((s) => s.id));
    for (const [i, tile] of tiles.entries()) {
      expect(tile.querySelector(".yz-glove-name").textContent).toBe(SKINS[i].name);
      expect(tile.querySelector("svg")).toBeTruthy();
    }
  });

  it("旧档的 ash 归一到真表默认皮肤 drifter，并且高亮的是它", () => {
    const { menu } = makeMenu();
    expect(menu.getSkinId()).toBe("drifter");
    const on = [...menu.el.querySelectorAll(".yz-skin-tile.is-main")];
    expect(on).toHaveLength(1);
    expect(on[0].dataset.skin).toBe("drifter");
  });

  it("点一格就换皮肤，回调把 id 报出去（main 拿它落盘）", () => {
    const { menu, picks } = makeMenu();
    menu.el.querySelector('.yz-skin-tile[data-skin="crane"]').click();
    expect(picks).toEqual(["crane"]);
    expect(menu.getSkinId()).toBe("crane");
    expect(menu.el.querySelector(".yz-skin-tile.is-main").dataset.skin).toBe("crane");
  });

  it("setSkinId 认不出的 id 落回默认皮肤，不把面板打空", () => {
    const { menu } = makeMenu();
    expect(menu.setSkinId("kiln")).toBe("drifter");
    expect(menu.el.querySelector(".yz-skin-tile.is-main").dataset.skin).toBe("drifter");
  });
});

describe("2D 备选配掌台的两个按钮", () => {
  it("「进安全区」落走道，「直接进裂岛」才 skipHub", () => {
    const { menu, starts } = makeMenu();
    const buttons = [...menu.el.querySelectorAll(".yz-menu .yz-btn")];
    const hub = buttons.find((b) => b.textContent.includes("安 全 区"));
    const arena = buttons.find((b) => b.textContent.includes("裂 岛"));
    hub.click();
    arena.click();
    expect(starts[0]).toMatchObject({ skipHub: false, skinId: "drifter" });
    expect(starts[1]).toMatchObject({ skipHub: true, skinId: "drifter" });
    expect(starts[0].main).toBe(starts[1].main);
  });

  it("getLoadout 带上归一后的皮肤，进局不会把 ash 传下去", () => {
    const { menu } = makeMenu();
    expect(menu.getLoadout()).toMatchObject({ main: "cotton", off: "cotton", skinId: "drifter" });
  });
});

describe("皮肤表缺席时", () => {
  it("没给 skinTable 就退回壳层兜底表，面板照样有格子", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const menu = createMenu({
      gloves: GLOVES,
      save: { loadout: { main: "cotton", off: "cotton" } },
      isUnlocked: () => true,
      onStart: () => {},
    });
    expect(menu.el.querySelectorAll(".yz-skin-tile").length).toBe(FALLBACK_SKINS.length);
    spy.mockRestore();
  });
});
