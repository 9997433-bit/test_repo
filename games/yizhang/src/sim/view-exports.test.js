// getView 的两项 Round 2 导出：players[].skinId（ADR-26）与 combat.ghosts（ADR-27）。

import { describe, expect, it } from "vitest";

import { ghostsView } from "./combat-bridge.js";
import { createMatch, getPlayer, getView, step, ZERO_INPUT } from "./index.js";
import { FACE, wrapAngle } from "./math.js";

const DT = 1 / 60;

function input(over = {}) {
  return { ...ZERO_INPUT, ...over };
}

function viewOf(opts) {
  return getView(createMatch({ seed: 11, ...opts }));
}

function self(view) {
  return view.players.find((p) => p.id === "p0");
}

describe("players[].skinId", () => {
  it("createMatch 的 skinId 原样透传给 p0", () => {
    expect(self(viewOf({ skinId: "wildhorn" })).skinId).toBe("wildhorn");
  });

  it("不给就是 null，未知字符串也不校验（sim 视为不透明标签）", () => {
    expect(self(viewOf({})).skinId).toBe(null);
    expect(self(viewOf({ skinId: "not-in-any-table" })).skinId).toBe("not-in-any-table");
  });

  it("非字符串 / 空串收成 null，不把 view 打成脏值", () => {
    for (const bad of [42, "", null, {}, true, undefined]) {
      expect(self(viewOf({ skinId: bad })).skinId).toBe(null);
    }
  });

  it("botSkinIds 按 bot 序号对齐，缺位补 null", () => {
    const view = viewOf({ botCount: 3, botSkinIds: ["wildhorn", null, "nuo"] });
    const skinOf = (id) => view.players.find((p) => p.id === id).skinId;
    expect(skinOf("b0")).toBe("wildhorn");
    expect(skinOf("b1")).toBe(null);
    expect(skinOf("b2")).toBe("nuo");
  });

  it("skinId 跟着玩家状态走：step / 传送 / 克隆之后还在", () => {
    const state = createMatch({
      seed: 5,
      skinId: "crane",
      botCount: 0,
      gloveId: "cotton",
      unlocked: "all",
    });
    const p = getPlayer(state, "p0");
    const portal = state.hub.layout.portal;
    p.x = portal.x;
    p.z = portal.z;
    step(state, { p0: input() }, DT);

    expect(state.phase).toBe("arena");
    expect(self(getView(state)).skinId).toBe("crane");
    expect(self(getView(structuredClone(state))).skinId).toBe("crane");
  });
});

describe("view.combat.ghosts", () => {
  it("没有残影时是空数组，不是 undefined", () => {
    const view = viewOf({});
    expect(view.combat).toBeDefined();
    expect(view.combat.ghosts).toEqual([]);
  });

  it("把 state.combat.ghosts 翻成 render 能直接吃的快照，yaw 还原回 -Z 基", () => {
    const state = createMatch({ seed: 5, botCount: 0, phase: "arena" });
    // combat 在 inCombatFrame 里落笔，残影 yaw 是 +Z 基：这里 π 对应 sim 的 0
    state.combat.ghosts.push({
      id: "ghost#1",
      ownerId: "p0",
      x: 1.23456,
      y: 0.5,
      z: -2.5,
      yaw: Math.PI,
      ttl: 1.2,
      ttl0: 1.6,
      fake: true,
    });

    const [ghost] = getView(state).combat.ghosts;
    expect(ghost).toEqual({
      id: "ghost#1",
      ownerId: "p0",
      x: 1.2346,
      y: 0.5,
      z: -2.5,
      yaw: 0,
      ttl: 1.2,
      ttl0: 1.6,
      fake: true,
      gloveId: null,
    });
    expect(ghost.yaw).toBeCloseTo(wrapAngle(Math.PI - FACE.combatOffset), 6);
  });

  it("缺 ttl0 用 ttl 兜底；gloveId 在场就透传", () => {
    const state = createMatch({ seed: 5, botCount: 0, phase: "arena" });
    state.combat.ghosts.push({
      id: "ghost#2",
      ownerId: "b0",
      x: 0,
      y: 0,
      z: 0,
      yaw: 0,
      ttl: 0.8,
      gloveId: "afterimage",
    });

    const [ghost] = getView(state).combat.ghosts;
    expect(ghost.ttl0).toBe(0.8);
    expect(ghost.gloveId).toBe("afterimage");
    expect(ghost.fake).toBe(false);
  });

  it("脏字段不外泄：NaN / 缺字段收成有限数，快照是纯 JSON", () => {
    const state = createMatch({ seed: 5, botCount: 0, phase: "arena" });
    state.combat.ghosts.push({ id: 7, ttl: NaN, x: Infinity, yaw: undefined });

    const view = getView(state);
    expect(JSON.parse(JSON.stringify(view.combat))).toEqual(view.combat);
    for (const ghost of view.combat.ghosts) {
      for (const key of ["x", "y", "z", "yaw", "ttl", "ttl0"]) {
        expect(Number.isFinite(ghost[key])).toBe(true);
      }
      expect(ghost.ownerId).toBe(null);
    }
    expect(ghostsView({})).toEqual([]);
  });

  it("残影随 combat 倒计时消失，view 跟着空掉", () => {
    const state = createMatch({ seed: 5, botCount: 1, phase: "arena" });
    state.combat.ghosts.push({
      id: "ghost#3",
      ownerId: "p0",
      x: 0,
      y: 0,
      z: 0,
      yaw: 0,
      ttl: 0.2,
      ttl0: 0.2,
      fake: false,
    });

    expect(getView(state).combat.ghosts).toHaveLength(1);
    for (let i = 0; i < 20; i++) step(state, {}, DT);
    expect(getView(state).combat.ghosts).toEqual([]);
  });

  it("分身真的放技能时残影进 view：ownerId / ttl0 > 0 / yaw 是 -Z 基", () => {
    const state = createMatch({
      seed: 5,
      botCount: 1,
      phase: "arena",
      gloveId: "afterimage",
      unlocked: "all",
    });
    const p = getPlayer(state, "p0");
    const bot = getPlayer(state, "b0");
    p.x = 0;
    p.z = 0;
    p.yaw = 0;
    bot.x = 0;
    bot.z = -3; // 正前方（yaw = 0 面向 -Z）

    step(state, { p0: input({ skill: true }) }, DT);
    const ghosts = getView(state).combat.ghosts;

    expect(ghosts.length).toBeGreaterThan(0);
    expect(ghosts[0].ownerId).toBe("p0");
    expect(ghosts[0].ttl0).toBeGreaterThan(0);
    expect(Math.abs(ghosts[0].yaw)).toBeLessThanOrEqual(Math.PI);
    expect(ghosts[0].yaw).toBeCloseTo(0, 6);
  });
});
