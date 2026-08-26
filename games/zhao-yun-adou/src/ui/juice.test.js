import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createBus } from "../core/events.js";
import {
  attachJuice,
  detachJuice,
  fxProgress,
  juiceStats,
  noteEnemies,
  resetJuice,
  takeLaneEffects,
} from "./juice.js";

/** 手动走时钟：特效寿命是按秒算的，测试不能真的等。 */
let clock = 0;
const now = () => clock;

function stage() {
  const bus = createBus();
  const api = { bus, state: {} };
  attachJuice(api, { clock: now });
  return { api, bus };
}

const SKILL_JUICE = {
  shake: 0.45,
  color: "#c9a24a",
  sfx: "sweep",
  duration: 0.55,
  focusT: 0.62,
  shape: "sweep",
  text: "七进七出",
};

beforeEach(() => {
  clock = 0;
});

afterEach(() => {
  detachJuice();
});

describe("juice 事件接线", () => {
  it("kill 落墨在敌人上一帧的路线位置", () => {
    const { bus } = stage();
    noteEnemies("player", [{ id: 7, t: 0.42 }]);
    bus.emit("kill", { side: "player", id: 7, reward: 5, boss: false });
    const [fx] = takeLaneEffects("player");
    expect(fx.kind).toBe("splat");
    expect(fx.t).toBeCloseTo(0.42, 5);
    expect(fx.text).toBe("+5");
    expect(takeLaneEffects("ai")).toHaveLength(0);
  });

  it("没见过的敌人不乱落墨", () => {
    const { bus } = stage();
    noteEnemies("player", [{ id: 1, t: 0.2 }]);
    bus.emit("kill", { side: "player", id: 999, reward: 3, boss: false });
    expect(takeLaneEffects("player")).toHaveLength(0);
  });

  it("斩将是更重的一笔，寿命也更长", () => {
    const { bus } = stage();
    noteEnemies("ai", [{ id: 2, t: 0.9 }]);
    bus.emit("kill", { side: "ai", id: 2, reward: 12, boss: true });
    const [fx] = takeLaneEffects("ai");
    expect(fx.text).toBe("斩");
    expect(fx.scale).toBeGreaterThan(1.5);
    expect(fx.life).toBeGreaterThan(1);
  });

  it("leak 把破阵溅在路线终点", () => {
    const { bus } = stage();
    bus.emit("leak", { side: "player", hearts: 2, boss: false });
    const [fx] = takeLaneEffects("player");
    expect(fx.kind).toBe("leak");
    expect(fx.t).toBe(1);
  });

  it("skill 照搬技能返回的 juice 契约", () => {
    const { bus } = stage();
    bus.emit("skill", {
      side: "ai",
      hero: "赵云",
      skill: "七进七出",
      cellIndex: 6,
      hits: 4,
      kills: 2,
      juice: SKILL_JUICE,
    });
    const [fx] = takeLaneEffects("ai");
    expect(fx.kind).toBe("skill");
    expect(fx.shape).toBe("sweep");
    expect(fx.t).toBeCloseTo(0.62, 5);
    expect(fx.color).toBe("#c9a24a");
    expect(fx.text).toBe("七进七出");
    expect(fx.life).toBeCloseTo(0.55, 5);
  });

  it("全屏技（focusT 为 null）不伪造焦点", () => {
    const { bus } = stage();
    bus.emit("skill", {
      side: "player",
      skill: "仁德",
      cellIndex: 8,
      juice: { ...SKILL_JUICE, shape: "aura", focusT: null, duration: 1.2 },
    });
    const [fx] = takeLaneEffects("player");
    expect(fx.t).toBeNull();
    expect(fx.shape).toBe("aura");
  });

  it("merge 在无 DOM 的环境里也不会炸", () => {
    const { bus } = stage();
    expect(() => bus.emit("merge", { side: "player", cellIndex: 6, level: 3 })).not.toThrow();
  });
});

describe("juice 生命周期", () => {
  it("特效按寿命过期后被回收", () => {
    const { bus } = stage();
    noteEnemies("player", [{ id: 3, t: 0.5 }]);
    bus.emit("kill", { side: "player", id: 3, reward: 4, boss: false });
    const [fx] = takeLaneEffects("player");
    expect(fxProgress(fx, clock)).toBe(0);
    clock += fx.life * 0.5;
    expect(fxProgress(fx, clock)).toBeCloseTo(0.5, 5);
    clock += fx.life;
    expect(takeLaneEffects("player")).toHaveLength(0);
  });

  it("同侧特效有上限，清线爆发不会无限堆积", () => {
    const { bus } = stage();
    const mob = Array.from({ length: 80 }, (_, i) => ({ id: i, t: i / 100 }));
    noteEnemies("player", mob);
    for (const e of mob) bus.emit("kill", { side: "player", id: e.id, reward: 1, boss: false });
    expect(takeLaneEffects("player").length).toBeLessThanOrEqual(24);
  });

  it("开新局清场", () => {
    const { bus } = stage();
    noteEnemies("player", [{ id: 5, t: 0.3 }]);
    bus.emit("kill", { side: "player", id: 5, reward: 2, boss: false });
    expect(juiceStats().lane.player).toBe(1);
    bus.emit("start", { seed: 1 });
    expect(juiceStats().lane.player).toBe(0);
  });

  it("重复 attach 同一个 api 不会重复订阅", () => {
    const { api, bus } = stage();
    attachJuice(api, { clock: now });
    attachJuice(api, { clock: now });
    noteEnemies("player", [{ id: 9, t: 0.1 }]);
    bus.emit("kill", { side: "player", id: 9, reward: 1, boss: false });
    expect(takeLaneEffects("player")).toHaveLength(1);
  });

  it("detach 之后总线事件不再产生特效", () => {
    const { bus } = stage();
    noteEnemies("player", [{ id: 4, t: 0.6 }]);
    detachJuice();
    bus.emit("kill", { side: "player", id: 4, reward: 9, boss: false });
    expect(juiceStats().attached).toBe(false);
    expect(takeLaneEffects("player")).toHaveLength(0);
  });

  it("未知阵营与脏数据一律无视", () => {
    const { bus } = stage();
    expect(() => noteEnemies("nobody", [{ id: 1, t: 0.5 }])).not.toThrow();
    expect(() => noteEnemies("player", null)).not.toThrow();
    bus.emit("kill", { side: "nobody", id: 1, reward: 1 });
    bus.emit("leak", {});
    expect(takeLaneEffects("nobody")).toHaveLength(0);
    resetJuice();
  });
});
