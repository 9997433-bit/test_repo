import { describe, expect, it } from "vitest";

import { forwardFromYaw } from "../render/view.js";
import { forwardX, forwardZ, yawFromDir as simYawFromDir } from "../sim/math.js";
import { createMatch, getView, step } from "../sim/index.js";
import {
  RENDER_YAW_OFFSET,
  SELF_ID,
  adaptView,
  cameraYawToSimYaw,
  createRoster,
  normalizeEvent,
  simYawToCameraYaw,
  toRenderView,
  yawFromDir,
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
    // 扇击事件只在裂岛发：安全区里按住鼠标不启动扇击（sim 的空挥闸）
    const state = createMatch({ seed: 7, gloveId: "cotton", offhandId: "granite", phase: "arena" });
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

describe("yawFromDir（壳层这份）", () => {
  const DIRS = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [0.6, -0.8],
    [-3, 2],
  ];

  it("与 sim/math.js 的同名函数逐位相同：壳层不能 import sim，但值必须一模一样", () => {
    for (const [x, z] of DIRS) {
      expect(yawFromDir(x, z)).toBe(simYawFromDir(x, z));
    }
  });

  it("是 forwardX/forwardZ 的逆：求出来的角，前向就是那个方向", () => {
    for (const [x, z] of DIRS) {
      const len = Math.hypot(x, z);
      const yaw = yawFromDir(x, z);
      expect(forwardX(yaw)).toBeCloseTo(x / len, 12);
      expect(forwardZ(yaw)).toBeCloseTo(z / len, 12);
    }
  });

  it("+X 方向对应 yaw = -π/2（free 下按 D 就该是这个角）", () => {
    expect(yawFromDir(1, 0)).toBeCloseTo(-Math.PI / 2, 12);
  });
});

describe("toRenderView", () => {
  it("不再补偏移：sim 与 render 共用同一个 yaw", () => {
    expect(RENDER_YAW_OFFSET).toBe(0);
    const view = { tiles: [], events: [], players: [{ id: "p0", yaw: 0.5, x: 1 }] };
    const out = toRenderView(view);
    expect(out.players[0].yaw).toBeCloseTo(0.5, 9);
    expect(out.players[0].x).toBe(1);
    expect(view.players[0].yaw).toBe(0.5);
  });

  it("yaw 缺席时收成 0，原快照不被改写", () => {
    const view = { tiles: [], events: [], players: [{ id: "p0", x: 2 }] };
    expect(toRenderView(view).players[0].yaw).toBe(0);
    expect(view.players[0].yaw).toBeUndefined();
  });
});

describe("朝向不变量：sim / render / camera 同一套", () => {
  const ANGLES = [0, 0.7, -1.9, Math.PI / 2, 3.0, -2.4];

  it("渲染快照的前向与 sim 的前向逐字一致", () => {
    for (const yaw of ANGLES) {
      const rendered = toRenderView({
        tiles: [],
        events: [],
        players: [{ id: "p0", yaw }],
      }).players[0].yaw;
      const f = forwardFromYaw(rendered);
      expect(f.x).toBeCloseTo(forwardX(yaw), 9);
      expect(f.z).toBeCloseTo(forwardZ(yaw), 9);
    }
  });

  it("机位在角色背后：camera.js 的 focus+(sin,cos)*dist 与前向反号", () => {
    for (const yaw of ANGLES) {
      // src/render/camera.js update()：desired = focus + (sin yaw, cos yaw) * dist
      const rig = { x: Math.sin(yaw), z: Math.cos(yaw) };
      const f = forwardFromYaw(yaw);
      expect(rig.x * f.x + rig.z * f.z).toBeCloseTo(-1, 9);
    }
  });

  it("相机方位角 → sim yaw 后，sim 前向就是相机水平前向", () => {
    for (const cam of ANGLES) {
      const simYaw = cameraYawToSimYaw(cam);
      expect(forwardX(simYaw)).toBeCloseTo(Math.cos(cam), 9);
      expect(forwardZ(simYaw)).toBeCloseTo(Math.sin(cam), 9);
    }
  });

  it("鼠标右移（相机方位角变大）让 sim 朝向向右转", () => {
    const cam = 0.4;
    const before = cameraYawToSimYaw(cam);
    const after = cameraYawToSimYaw(cam + 0.05);
    // FACE 约定 yaw=0 面向 -Z、right=+X，右转 = yaw 减小
    expect(after).toBeLessThan(before);
    // 转后的前向落在转前「右手边」那一侧：right(yaw) = (cos yaw, -sin yaw)
    const rightX = Math.cos(before);
    const rightZ = -Math.sin(before);
    expect(forwardX(after) * rightX + forwardZ(after) * rightZ).toBeGreaterThan(0);
  });

  it("开局镜头在人背后：simYawToCameraYaw 的往返不搬动前向", () => {
    for (const simYaw of ANGLES) {
      const cam = simYawToCameraYaw(simYaw);
      expect(Math.cos(cam)).toBeCloseTo(forwardX(simYaw), 9);
      expect(Math.sin(cam)).toBeCloseTo(forwardZ(simYaw), 9);
    }
  });
});
