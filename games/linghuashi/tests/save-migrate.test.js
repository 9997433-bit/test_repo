import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createStore,
  defaultSave,
  migrate,
  SAVE_BACKUP_KEY,
  SAVE_KEY,
  SAVE_VERSION,
} from "../src/core/store.js";
import { CATCH_COST, RELEASE_REFUND, catchBeast, releaseBeast } from "../src/progression/beasts.js";
import { TALENT_COST, applyTalent } from "../src/classes/talents.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** 可读可写的 localStorage 替身；`map` 暴露出来便于断言盘上到底躺着什么。 */
function fakeStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    map,
    getItem: vi.fn((key) => (map.has(key) ? map.get(key) : null)),
    setItem: vi.fn((key, value) => map.set(key, String(value))),
    removeItem: vi.fn((key) => map.delete(key)),
  };
}

describe("migrate 迁移链", () => {
  it("史前档（无 version、画阁存字符串）升级后保住六式进度", () => {
    const next = migrate({
      playerName: "史前画徒",
      xp: 12,
      gallery: ["line", "curve", "circle", "zigzag", "spiral", "cloud"],
    });

    expect(next.version).toBe(SAVE_VERSION);
    expect(next.playerName).toBe("史前画徒");
    expect(next.gallery.map((g) => g.type)).toEqual(["line", "curve", "circle", "zigzag", "spiral", "cloud"]);
    expect(next.gallery[0]).toEqual({ type: "line", precision: 0, at: 0 });
  });

  it("给 v1 旧档的灵兽补 uid，补完就能放生", () => {
    const next = migrate({
      version: 1,
      beasts: [{ id: "ink_fox", name: "墨狐", passive: "crit", value: 0.08, star: 1 }],
    });

    expect(next.beasts).toHaveLength(1);
    expect(next.beasts[0].uid).toBe("ink_fox-v1-0");
    expect(releaseBeast(next, next.beasts[0].uid).beasts).toEqual([]);
  });

  it("读不懂的档一律返回 null，不冒充空档", () => {
    expect(migrate(null)).toBeNull();
    expect(migrate("坏档")).toBeNull();
    expect(migrate([])).toBeNull();
    expect(migrate({ version: SAVE_VERSION + 1, xp: 999 })).toBeNull();
  });

  it("会话字段不从盘上带回内存", () => {
    const next = migrate({
      version: 1,
      notice: "上一次的提示",
      idleClaim: { minutes: 3, pills: 1, buns: 1 },
      idleClaimed: true,
      inkJustUnlocked: true,
      battleId: "stage#7",
      settledBattleId: "stage#7",
    });

    for (const key of ["notice", "idleClaim", "idleClaimed", "inkJustUnlocked", "battleId", "settledBattleId"]) {
      expect(next).not.toHaveProperty(key);
    }
  });

  it("坏值一律夹回合法区间，坏灵兽条目丢弃", () => {
    const next = migrate({
      version: 1,
      playerName: 42,
      classId: "",
      realmId: null,
      xp: "abc",
      qiPills: -8,
      buns: 3.7,
      talents: { might: 2, ghost: -1, broken: "x" },
      strokeStats: { line: 2, curve: 0.5, junk: NaN },
      clearedStages: ["a", "a", 7, "b"],
      beasts: [
        { id: "ink_fox", uid: "fox-1", star: 0 },
        { id: "ink_fox", uid: "fox-1", star: 2 },
        { uid: "no-id" },
        { id: "paper_carp" },
        null,
      ],
      settings: "坏设置",
      lastSeenAt: "早上",
    });

    expect(next.playerName).toBe(defaultSave().playerName);
    expect(next.classId).toBeNull();
    expect(next.realmId).toBe(defaultSave().realmId);
    expect(next.xp).toBe(0);
    expect(next.qiPills).toBe(0);
    expect(next.buns).toBe(3);
    expect(next.talents).toEqual({ might: 2 });
    expect(next.strokeStats).toEqual({ line: 1, curve: 0.5 });
    expect(next.clearedStages).toEqual(["a", "b"]);
    // 无 id 与 uid 撞车的条目丢弃；缺 uid 的旧兽由迁移步补号救回。
    expect(next.beasts).toEqual([
      { id: "ink_fox", uid: "fox-1", star: 1 },
      { id: "paper_carp", uid: "paper_carp-v1-3", star: 1 },
    ]);
    expect(next.settings).toEqual({ mute: false, reducedMotion: false });
    expect(Number.isFinite(next.lastSeenAt)).toBe(true);
  });

  it("对已是当前版本的档幂等，且保留未登记字段", () => {
    const once = migrate({ ...defaultSave(), xp: 30, screen: "hub", lastResult: "win", futureField: 1 });
    const twice = migrate(once);

    expect(twice).toEqual(once);
    expect(once.screen).toBe("hub");
    expect(once.lastResult).toBe("win");
    expect(once.futureField).toBe(1);
  });

  it("不改入参", () => {
    const raw = { version: 1, xp: 5, beasts: [{ id: "ink_fox", name: "墨狐" }], gallery: [] };
    const before = structuredClone(raw);
    migrate(raw);
    expect(raw).toEqual(before);
  });
});

describe("hydrate 与备份", () => {
  it("persist → hydrate 往返得到同一份存档", () => {
    const storage = fakeStorage();
    vi.stubGlobal("localStorage", storage);

    const saved = migrate({
      ...defaultSave(),
      playerName: "往返画徒",
      classId: "jian",
      xp: 61,
      qiPills: 24,
      buns: 9,
      talents: { might: 3, ward: 1 },
      beasts: [{ id: "shan_deer", uid: "deer-1", name: "山海鹿", passive: "shield", value: 12, star: 2 }],
      gallery: [{ type: "spiral", precision: 0.72, at: 1000 }],
      clearedStages: ["tutorial"],
      battleSeq: 4,
      settings: { mute: true, reducedMotion: true },
      tutorialDone: true,
      inkUnlocked: true,
    });

    const store = createStore(saved);
    store.persist();

    expect(createStore().hydrate()).toEqual(saved);
  });

  it("当前版本的档不反复覆盖备份", () => {
    const raw = JSON.stringify({ ...defaultSave(), xp: 3 });
    const storage = fakeStorage({ [SAVE_KEY]: raw });
    vi.stubGlobal("localStorage", storage);

    createStore().hydrate();

    expect(storage.map.has(SAVE_BACKUP_KEY)).toBe(false);
  });

  it("更高版本的档保留内存态，但原始串抄进备份", () => {
    const raw = JSON.stringify({ version: SAVE_VERSION + 9, playerName: "未来画徒" });
    const storage = fakeStorage({ [SAVE_KEY]: raw });
    vi.stubGlobal("localStorage", storage);

    const initial = { ...defaultSave(), playerName: "当前画徒" };
    expect(createStore(initial).hydrate()).toEqual(initial);
    expect(storage.map.get(SAVE_BACKUP_KEY)).toBe(raw);
  });

  it("坏 JSON 也留备份，且备份写失败不影响读档", () => {
    const storage = fakeStorage({ [SAVE_KEY]: "{坏档" });
    vi.stubGlobal("localStorage", storage);
    expect(createStore().hydrate().version).toBe(SAVE_VERSION);
    expect(storage.map.get(SAVE_BACKUP_KEY)).toBe("{坏档");

    vi.stubGlobal("localStorage", {
      getItem: () => "{坏档",
      setItem: () => {
        throw new Error("quota");
      },
    });
    const initial = { ...defaultSave(), xp: 5 };
    expect(createStore(initial).hydrate()).toEqual(initial);
  });
});

describe("灵兽放生", () => {
  const fox = { uid: "fox-1", id: "ink_fox", name: "墨狐", passive: "crit", value: 0.08, star: 1 };

  it("认不出的 uid 不返还包子", () => {
    const save = { ...defaultSave(), buns: 5, beasts: [fox] };
    expect(releaseBeast(save, "不存在")).toMatchObject({ buns: 5, beasts: [fox] });
    expect(releaseBeast(save, "").buns).toBe(5);
    expect(releaseBeast(save, undefined).beasts).toEqual([fox]);
  });

  it("放生腾出的栏位可以再收兽", () => {
    const full = {
      ...defaultSave(),
      buns: CATCH_COST.buns,
      beasts: [fox, { ...fox, uid: "fox-2" }, { ...fox, uid: "fox-3" }],
    };
    expect(catchBeast(full, () => 0, 1).beasts).toHaveLength(3);

    const released = releaseBeast(full, "fox-2");
    expect(released.buns).toBe(CATCH_COST.buns + RELEASE_REFUND);

    const caught = catchBeast(released, () => 0, 1);
    expect(caught.beasts).toHaveLength(3);
    expect(caught.buns).toBe(RELEASE_REFUND);
  });

  it("返还价严格低于收兽价，收放循环不能刷包子", () => {
    expect(RELEASE_REFUND).toBeLessThan(CATCH_COST.buns);
  });
});

describe("天赋定价", () => {
  it("灵气丹不足时带提示且不扣资源", () => {
    const save = { ...defaultSave(), qiPills: TALENT_COST - 1 };
    const next = applyTalent(save, "might");

    expect(next.qiPills).toBe(TALENT_COST - 1);
    expect(next.talents).toEqual({});
    expect(next.notice).toContain(String(TALENT_COST));
  });

  it("满级后不再扣灵气丹", () => {
    const save = { ...defaultSave(), qiPills: 100, talents: { might: 5 } };
    const next = applyTalent(save, "might");

    expect(next.qiPills).toBe(100);
    expect(next.talents.might).toBe(5);
    expect(next.notice).toContain("满级");
  });
});
