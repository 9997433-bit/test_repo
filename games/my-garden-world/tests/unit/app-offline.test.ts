import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { boot } from "../../src/app";
import { FLOWERS } from "../../src/data/flowers";
import { SAVE_MAX_WAIT_MS } from "../../src/engine/save";
import { WATER_CAP } from "../../src/engine/state";

/**
 * app 层接线回归：加载旧档 → 迁移回填 → 离园补算 → 去抖落盘 → 隐藏刷盘。
 * 走的是真实 boot()，覆盖单测碰不到的那几行 wiring。
 */

const KEY = "my-garden-world:save:v1";
const T0 = 1_800_000_000_000;
const HOUR = 3_600_000;
const SAVED_NOW = 600_000;

function el<T extends HTMLElement>(sel: string): T {
  const node = document.querySelector<T>(sel);
  if (!node) throw new Error(`missing ${sel}`);
  return node;
}

function legacySave(awayMs: number): string {
  return JSON.stringify({
    schemaVersion: 2,
    startedAt: T0 - awayMs - SAVED_NOW,
    now: SAVED_NOW,
    lastSeenAt: T0 - awayMs,
    coins: 240,
    water: 0,
    waterAcc: 0,
    level: 6,
    tutorialStep: 99,
    tutorialDone: true,
    unlockedFlowers: ["daisy"],
    inventory: { daisy: 2 },
    orders: [
      {
        uid: "o1",
        templateId: "r-welcome",
        kind: "resident",
        title: "邻家小妹",
        hint: "",
        dueAt: SAVED_NOW + 120_000,
        coin: 20,
        exp: 8,
        waterReward: 2,
        flowerIds: ["daisy"],
        flowerCount: 1,
      },
    ],
    plots: [
      { id: 0, flowerId: "daisy", stage: "seeded", plantedAt: 590_000, watered: 1, fertilized: false, lastTick: SAVED_NOW },
      { id: 1, flowerId: "peach", stage: "bloom", plantedAt: 500_000, watered: 0, fertilized: false, lastTick: SAVED_NOW },
      { id: 2, flowerId: null, stage: "empty", plantedAt: 0, watered: 0, fertilized: false, lastTick: 0 },
    ],
  });
}

function stored(): Record<string, any> {
  return JSON.parse(localStorage.getItem(KEY) ?? "{}");
}

describe("app: resume from a stale save", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = `<div id="app"></div>`;
    vi.useFakeTimers({
      toFake: [
        "setTimeout",
        "clearTimeout",
        "setInterval",
        "clearInterval",
        "Date",
        "performance",
        "requestAnimationFrame",
        "cancelAnimationFrame",
      ],
      now: T0,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("backfills unlocks, settles a capped absence and greets the gardener", () => {
    localStorage.setItem(KEY, legacySave(3 * HOUR));
    boot(el("#app"));
    vi.advanceTimersByTime(50);

    expect(el(".toast").textContent).toContain("离园");
    // 首次落盘落在封顶等待处
    vi.advanceTimersByTime(SAVE_MAX_WAIT_MS);
    const save = stored();

    const eligible = FLOWERS.filter((f) => f.unlockLevel <= 6).map((f) => f.id);
    expect(new Set(save.unlockedFlowers)).toEqual(new Set(eligible));
    expect(save.water).toBe(WATER_CAP);
    expect(save.now - SAVED_NOW).toBeGreaterThanOrEqual(2 * HOUR);
    expect(save.now - SAVED_NOW).toBeLessThan(2 * HOUR + 60_000);
    expect(save.lastSeenAt).toBeGreaterThanOrEqual(T0);
    expect(save.plots[0].stage).toBe("sprout");
    // 盛放的花等着主人回来，不在离园期间凋零；订单也整体顺延
    expect(save.plots[1].stage).toBe("bloom");
    const kept = save.orders.find((o: { uid: string }) => o.uid === "o1");
    expect(kept?.dueAt).toBe(SAVED_NOW + 120_000 + 2 * HOUR);
  });

  it("writes far less often than the old fixed cadence and flushes when hidden", () => {
    localStorage.setItem(KEY, legacySave(30_000));
    boot(el("#app"));
    vi.advanceTimersByTime(50);

    const setItem = vi.spyOn(Storage.prototype, "setItem");
    vi.advanceTimersByTime(20_000);
    const debounced = setItem.mock.calls.length;
    expect(debounced).toBeGreaterThan(0);
    expect(debounced).toBeLessThanOrEqual(20_000 / SAVE_MAX_WAIT_MS + 1);

    setItem.mockClear();
    el<HTMLButtonElement>('.dock-btn[data-id="harvest"]').click();
    el<HTMLButtonElement>('.plot[data-plot-id="1"]').click();
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));

    // 不等去抖窗口，收获立刻落盘（jsdom 里前一用例的 document 监听器还在，只认本局那次写入）
    const flushes = setItem.mock.calls.filter(
      ([key, value]) => key === KEY && JSON.parse(String(value)).inventory?.peach === 1,
    );
    expect(flushes).toHaveLength(1);
    expect(stored().inventory.peach).toBe(1);
  });
});
