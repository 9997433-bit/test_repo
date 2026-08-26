import { describe, expect, it } from "vitest";

import { createMatch, getView, step } from "../sim/index.js";
import {
  SELF_ID,
  adaptView,
  cameraYawToSimYaw,
  createRoster,
  normalizeEvent,
  simYawToCameraYaw,
  toRenderView,
} from "./view.js";

const GLOVE_BY_ID = {
  cotton: { id: "cotton", name: "木棉", color: "#e2604a" },
  granite: { id: "granite", name: "磐石", color: "#cf8a3b" },
};

function freshView() {
  const state = createMatch({ seed: 7, gloveId: "cotton", offhandId: "granite", botCount: 3 });
  return { state, raw: getView(state) };
}

describe("SELF_ID", () => {
  it("与 sim.createMatch 造出来的人类玩家 id 一致", () => {
    const { raw } = freshView();
    const human = raw.players.filter((p) => p.kind === "human");
    expect(human).toHaveLength(1);
    expect(human[0].id).toBe(SELF_ID);
    expect(SELF_ID).toBe("p0");
  });
});

describe("adaptView", () => {
  it("把 sim 的 match/arena 展平成 UI 认得的字段", () => {
    const { raw } = freshView();
    const roster = createRoster(raw, { selfId: SELF_ID });
    const view = adaptView(raw, { selfId: SELF_ID, roster, gloveById: GLOVE_BY_ID });

    expect(view.timeLeft).toBe(raw.match.secondsLeft);
    expect(view.over).toBe(false);
    expect(view.arenaRadius).toBe(raw.arena.radius);
    expect(view.tiles).toBe(raw.arena.tiles);
    expect(view.localId).toBe(SELF_ID);
    // ai/bots.js 按这个提示决定 moveX/moveZ 的坐标系
    expect(view.moveSpace).toBe("world");
  });

  it("给每个玩家补上名字、识别色与主副掌", () => {
    const { raw } = freshView();
    const roster = createRoster(raw, { selfId: SELF_ID });
    const view = adaptView(raw, { selfId: SELF_ID, roster, gloveById: GLOVE_BY_ID });

    const self = view.players.find((p) => p.id === SELF_ID);
    expect(self.name).toBe("你");
    expect(self.isSelf).toBe(true);
    expect(self.mainId).toBe("cotton");
    expect(self.offhandId).toBe("granite");
    expect(self.color).toBe("#e2604a");

    for (const p of view.players) expect(p.name).toBeTruthy();
    expect(new Set(view.players.map((p) => p.name)).size).toBe(view.players.length);
  });

  it("bot 名字取 data 的人格名", () => {
    const { raw } = freshView();
    const roster = createRoster(raw, {
      selfId: SELF_ID,
      personaById: { brute: { name: "蛮古" }, fox: { name: "狸缘" }, bully: { name: "欺霸" } },
    });
    expect(roster.get("b0").name).toBe("蛮古");
  });
});

describe("normalizeEvent", () => {
  it("把 sim 的 ko 与 combat 的 kill 拉到同一形状", () => {
    expect(normalizeEvent({ type: "ko", id: "b1", by: "p0" })).toMatchObject({
      type: "ko",
      victimId: "b1",
      killerId: "p0",
    });
    expect(normalizeEvent({ type: "kill", victimId: "b1", killerId: "p0" })).toMatchObject({
      type: "ko",
      victimId: "b1",
      killerId: "p0",
    });
  });

  it("hit / dash 的发起者统一叫 playerId", () => {
    expect(normalizeEvent({ type: "hit", id: "p0", targetId: "b1" }).playerId).toBe("p0");
    expect(normalizeEvent({ type: "hit", attackerId: "p0", targetId: "b1" }).playerId).toBe("p0");
    expect(normalizeEvent({ type: "dash", id: "b2" }).playerId).toBe("b2");
  });

  it("真实 sim 跑起来后事件能被归一化", () => {
    const { state } = freshView();
    const seen = new Set();
    for (let i = 0; i < 120; i += 1) {
      step(state, { [SELF_ID]: { moveX: 1, slap: true, yaw: 0 } }, 1 / 60);
      const view = adaptView(getView(state), { selfId: SELF_ID, gloveById: GLOVE_BY_ID });
      for (const e of view.events) seen.add(e.type);
    }
    expect(seen.has("slap")).toBe(true);
  });
});

describe("yaw 空间换算", () => {
  it("相机方位角与 sim 朝向互为逆变换", () => {
    for (const a of [0, 0.7, -1.9, Math.PI / 2, 3.0]) {
      expect(simYawToCameraYaw(cameraYawToSimYaw(a))).toBeCloseTo(Math.atan2(Math.sin(a), Math.cos(a)), 6);
    }
  });

  it("相机朝 -Z（yaw=-π/2）对应 sim 的 yaw=0", () => {
    expect(cameraYawToSimYaw(-Math.PI / 2)).toBeCloseTo(0, 6);
  });

  it("换算后前进方向一致：sim forward = (-sin, -cos)", () => {
    const cam = 1.234;
    const sim = cameraYawToSimYaw(cam);
    expect(-Math.sin(sim)).toBeCloseTo(Math.cos(cam), 6);
    expect(-Math.cos(sim)).toBeCloseTo(Math.sin(cam), 6);
  });
});

describe("toRenderView", () => {
  it("给渲染快照补 π 朝向偏移，其余字段照传", () => {
    const view = { tiles: [], events: [], players: [{ id: "p0", yaw: 0.5, x: 1 }] };
    const out = toRenderView(view);
    expect(out.players[0].yaw).toBeCloseTo(0.5 + Math.PI, 9);
    expect(out.players[0].x).toBe(1);
    expect(view.players[0].yaw).toBe(0.5);
  });
});
