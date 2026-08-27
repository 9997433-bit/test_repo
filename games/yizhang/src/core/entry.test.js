// 进局入口的回归测试（Round 1 遗留 6）。
// 核心一条：结算板上「再来一局」与「回安全区换掌」**不能是同一件事**。

import { describe, expect, it } from "vitest";

import { ENTRY, entryCopy, resolveEntry, skipHubFor } from "./entry.js";

const CTX = {
  lastLoadout: { main: "granite", off: "willow", skinId: "nuo" },
  save: { loadout: { main: "cotton", off: "cotton" }, skinId: "drifter" },
  menuLoadout: { main: "cotton", off: "cotton", skinId: "drifter" },
};

describe("resolveEntry", () => {
  it("再来一局：同一副掌直接回裂岛（skipHub）", () => {
    const entry = resolveEntry(ENTRY.RESTART, CTX);
    expect(entry.skipHub).toBe(true);
    expect(entry.main).toBe("granite");
    expect(entry.off).toBe("willow");
    expect(entry.skinId).toBe("nuo");
  });

  it("回安全区：落走道重挑（不 skipHub）", () => {
    const entry = resolveEntry(ENTRY.HUB, CTX);
    expect(entry.skipHub).toBe(false);
  });

  it("两个按钮不是同一件事：去处相反，配装同源", () => {
    const restart = resolveEntry(ENTRY.RESTART, CTX);
    const hub = resolveEntry(ENTRY.HUB, CTX);
    expect(restart.skipHub).not.toBe(hub.skipHub);
    expect(restart.main).toBe(hub.main);
  });

  it("只有 restart 跳过走道，别的口令一律落大厅", () => {
    expect(skipHubFor(ENTRY.RESTART)).toBe(true);
    expect(skipHubFor(ENTRY.HUB)).toBe(false);
    expect(skipHubFor(undefined)).toBe(false);
    expect(skipHubFor("skipHub")).toBe(false);
  });
});

describe("entryCopy：两个入口在板上说的不是一件事", () => {
  it("标题 / 快捷键 / 去处三样都岔开", () => {
    const restart = entryCopy(ENTRY.RESTART);
    const hub = entryCopy(ENTRY.HUB);
    expect(restart.label).not.toBe(hub.label);
    expect(restart.key).not.toBe(hub.key);
    expect(restart.where).not.toBe(hub.where);
    expect(restart.hint).not.toBe(hub.hint);
    // 去处写死在文案里：一个进裂岛、一个回走道
    expect(restart.hint).toContain("裂岛");
    expect(hub.hint).toContain("走道");
    expect(restart.skipHub).toBe(true);
    expect(hub.skipHub).toBe(false);
  });

  it("「再来一局」把将要沿用的掌名报出来", () => {
    const copy = entryCopy(ENTRY.RESTART, { mainName: "木棉", offName: "磐石" });
    expect(copy.hint).toContain("沿用 木棉 / 磐石");
  });

  it("主副是同一只掌时不写两遍", () => {
    expect(entryCopy(ENTRY.RESTART, { mainName: "陨掌", offName: "陨掌" }).hint).toContain("沿用 陨掌");
    expect(entryCopy(ENTRY.RESTART, { mainName: "陨掌", offName: "陨掌" }).hint).not.toContain("/");
  });

  it("掌名给不出来（掌表里没有 / 空串）就退到不提名字的说法", () => {
    expect(entryCopy(ENTRY.RESTART, {}).hint).toContain("沿用这副掌");
    expect(entryCopy(ENTRY.RESTART, { mainName: "  ", offName: "磐石" }).hint).toContain("沿用这副掌");
  });

  it("「回安全区」说明里必须写清主副掌会清空 —— 那是它和再来一局的全部区别", () => {
    const copy = entryCopy(ENTRY.HUB);
    expect(copy.hint).toContain("主副掌清空");
    expect(copy.hint).toContain("传送门");
    expect(copy.hint).not.toContain("沿用");
  });

  it("暂停板上的同一入口要说明这一局作废，结算板上不说这句", () => {
    expect(entryCopy(ENTRY.HUB, { from: "pause" }).hint).toContain("弃掉这一局");
    expect(entryCopy(ENTRY.HUB, { from: "result" }).hint).not.toContain("弃掉这一局");
  });

  it("不认识的口令给 null，壳层照着这个决定要不要贴说明", () => {
    expect(entryCopy("skipHub")).toBeNull();
    expect(entryCopy(undefined)).toBeNull();
  });
});

describe("配装取值链：上一局 → 存档 → 2D 配掌板", () => {
  it("没有上一局就吃存档", () => {
    const entry = resolveEntry(ENTRY.RESTART, { ...CTX, lastLoadout: null });
    expect(entry.main).toBe("cotton");
    expect(entry.skinId).toBe("drifter");
  });

  it("存档也没有才落 2D 配掌板", () => {
    const entry = resolveEntry(ENTRY.RESTART, { menuLoadout: { main: "ember", off: "ember" } });
    expect(entry.main).toBe("ember");
    expect(entry.off).toBe("ember");
    expect(entry.skinId).toBeNull();
  });

  it("上一局只挑了主掌时副掌跟主掌走（sim 的 applyLoadout 同一口径）", () => {
    const entry = resolveEntry(ENTRY.RESTART, { lastLoadout: { main: "phantom" } });
    expect(entry.off).toBe("phantom");
  });

  it("空串 / 非字符串不算数，继续往下兜", () => {
    const entry = resolveEntry(ENTRY.HUB, {
      lastLoadout: { main: "   ", off: null },
      save: { loadout: { main: "granite", off: 7 } },
      menuLoadout: { main: "cotton", off: "cotton" },
    });
    expect(entry.main).toBe("granite");
    expect(entry.off).toBe("cotton");
  });

  it("一处配装都没有也不抛，交给 startMatch 兜底", () => {
    const entry = resolveEntry(ENTRY.HUB, {});
    expect(entry).toMatchObject({ skipHub: false, main: null, off: null, skinId: null });
  });
});
