// 进局入口的回归测试（Round 1 遗留 6）。
// 核心一条：结算板上「再来一局」与「回安全区换掌」**不能是同一件事**。

import { describe, expect, it } from "vitest";

import { ENTRY, resolveEntry, skipHubFor } from "./entry.js";

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
