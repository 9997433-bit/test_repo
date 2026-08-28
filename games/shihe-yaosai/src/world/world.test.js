import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import { Scene } from "@babylonjs/core/scene.js";

import {
  buildWorld,
  syncWorld,
  pickSocket,
  socketWorldPos,
  polarToWorld,
  disposeWorld,
  getWorld,
  resolveTurretKind,
  normalizeView,
  WORLD_METRICS,
} from "./index.js";
import { LANE_Y, SOCKET_COUNT, SOCKET_RADIUS, TURRET_KINDS } from "./constants.js";
import { nearestSocket, worldToPolar } from "./polar.js";

const TAU = Math.PI * 2;

describe("polar 换算", () => {
  it("polarToWorld 走 x = cosθ·r / z = sinθ·r", () => {
    expect(polarToWorld(10, 0, 3)).toEqual({ x: 10, y: 3, z: 0 });
    const quarter = polarToWorld(10, Math.PI / 2, 0);
    expect(quarter.x).toBeCloseTo(0, 10);
    expect(quarter.z).toBeCloseTo(10, 10);
  });

  it("socketWorldPos 满足 θ = i/24·2π、r = 40、y = 1", () => {
    for (let i = 0; i < SOCKET_COUNT; i += 1) {
      const pos = socketWorldPos(i);
      const theta = (i / SOCKET_COUNT) * TAU;
      expect(pos.x).toBeCloseTo(Math.cos(theta) * SOCKET_RADIUS, 9);
      expect(pos.z).toBeCloseTo(Math.sin(theta) * SOCKET_RADIUS, 9);
      expect(pos.y).toBe(1);
      expect(Math.hypot(pos.x, pos.z)).toBeCloseTo(SOCKET_RADIUS, 9);
    }
  });

  it("插座绕圈均匀分布且能反算回下标", () => {
    for (let i = 0; i < SOCKET_COUNT; i += 1) {
      const pos = socketWorldPos(i);
      const polar = worldToPolar(pos.x, pos.y, pos.z);
      expect(nearestSocket(polar.theta)).toBe(i);
    }
  });

  it("非法输入不产生 NaN", () => {
    const pos = polarToWorld(undefined, "nope", null);
    expect(Number.isFinite(pos.x)).toBe(true);
    expect(Number.isFinite(pos.y)).toBe(true);
    expect(Number.isFinite(pos.z)).toBe(true);
  });
});

describe("towerId 归一", () => {
  it("空值代表没有塔", () => {
    for (const empty of [undefined, null, false, "", "none"]) {
      expect(resolveTurretKind(empty)).toBeNull();
    }
  });

  it("五种剪影都能被字符串命中", () => {
    for (const kind of TURRET_KINDS) {
      expect(resolveTurretKind(kind)).toBe(kind);
      expect(resolveTurretKind(kind.toUpperCase())).toBe(kind);
    }
    expect(resolveTurretKind("railgun")).toBe("rail");
    expect(resolveTurretKind("gravity-well")).toBe("well");
    expect(resolveTurretKind("tower_scatter_2")).toBe("scatter");
  });

  it("数字 / 未知字符串都会稳定落到五种之一", () => {
    expect(resolveTurretKind(0)).toBe("rail");
    expect(resolveTurretKind(4)).toBe("star");
    expect(resolveTurretKind(7)).toBe(TURRET_KINDS[2]);
    const unknown = resolveTurretKind("完全没见过的塔");
    expect(TURRET_KINDS).toContain(unknown);
    expect(resolveTurretKind("完全没见过的塔")).toBe(unknown);
  });
});

describe("view 归一", () => {
  it("空 view 也能得到 24 个插座", () => {
    const view = normalizeView(undefined);
    expect(view.sockets).toHaveLength(SOCKET_COUNT);
    expect(view.sockets.every((s) => s.kind === null)).toBe(true);
    expect(view.enemies).toEqual([]);
    expect(view.coreRatio).toBe(1);
  });

  it("敌人缺 y 时回落到轨道高度，lane 越界会被夹住", () => {
    const view = normalizeView({ enemies: [{ lane: 1, theta: 0.5, radius: 30 }, { lane: 99, theta: 1, r: 20 }] });
    expect(view.enemies[0].y).toBe(LANE_Y[1]);
    expect(view.enemies[1].lane).toBe(LANE_Y.length - 1);
    expect(view.enemies[1].radius).toBe(20);
  });

  it("敌人位置优先信 view 里的 theta，缺极坐标才从 x/z 反算", () => {
    const theta = 1.1;
    const view = normalizeView({
      enemies: [
        // theta 与 x/z 打架时以 theta 为准
        { id: 1, lane: 0, theta, radius: 30, x: 0, z: 0 },
        { id: 2, lane: 0, x: Math.cos(theta) * 26, z: Math.sin(theta) * 26 },
        { id: 3, lane: 0, theta, y: 4 },
      ],
    });
    expect(view.enemies[0].theta).toBeCloseTo(theta, 9);
    expect(view.enemies[0].radius).toBe(30);
    expect(view.enemies[1].theta).toBeCloseTo(theta, 9);
    expect(view.enemies[1].radius).toBeCloseTo(26, 9);
    // 只有 y 不是位置，别被当成原点上的一个点
    expect(view.enemies[2].theta).toBeCloseTo(theta, 9);
    expect(view.enemies[2].y).toBe(4);
  });

  it("过热可以来自布尔位，也可以来自 heat/heatMax", () => {
    const view = normalizeView({
      sockets: [{ towerId: "rail", overheated: true }, { towerId: "rail", heat: 10, heatMax: 10 }],
    });
    expect(view.sockets[0].overheat).toBe(true);
    expect(view.sockets[1].overheat).toBe(true);
    expect(view.sockets[2].overheat).toBe(false);
  });
});

describe("场景搭建", () => {
  let engine;
  let scene;

  beforeAll(() => {
    engine = new NullEngine();
    scene = new Scene(engine);
    buildWorld(scene, undefined, { glow: false });
  });

  afterAll(() => {
    disposeWorld(scene);
    scene.dispose();
    engine.dispose();
  });

  it("24 个插座网格命名为 socket-0 .. socket-23，带 metadata.socket", () => {
    for (let i = 0; i < SOCKET_COUNT; i += 1) {
      const mesh = scene.getMeshByName(`socket-${i}`);
      expect(mesh, `socket-${i}`).toBeTruthy();
      expect(mesh.isPickable).toBe(true);
      expect(mesh.metadata).toEqual({ socket: i });
      const pos = socketWorldPos(i);
      expect(mesh.position.x).toBeCloseTo(pos.x, 6);
      expect(mesh.position.y).toBeCloseTo(pos.y, 6);
      expect(mesh.position.z).toBeCloseTo(pos.z, 6);
    }
    expect(scene.getMeshByName(`socket-${SOCKET_COUNT}`)).toBeNull();
  });

  it("星核、甲板与三条轨道环都在场上", () => {
    expect(scene.getMeshByName("core-inner")).toBeTruthy();
    expect(scene.getMeshByName("core-shell")).toBeTruthy();
    expect(scene.getMeshByName("deck-hex")).toBeTruthy();
    LANE_Y.forEach((y, lane) => {
      const ring = scene.getMeshByName(`lane-ring-${lane}`);
      expect(ring, `lane-ring-${lane}`).toBeTruthy();
      expect(ring.position.y).toBeCloseTo(y, 6);
    });
  });

  it("方向光、半球光与雾都已配置", () => {
    expect(scene.getLightByName("world-sun")).toBeTruthy();
    expect(scene.getLightByName("world-hemi")).toBeTruthy();
    expect(scene.fogMode).toBe(Scene.FOGMODE_EXP2);
    expect(scene.fogDensity).toBeGreaterThan(0);
  });

  it("towerId 落地后长出对应剪影，清空后收回", () => {
    const sockets = [];
    TURRET_KINDS.forEach((kind, i) => {
      sockets[i * 3] = { towerId: kind };
    });
    syncWorld(scene, { coreHp: 10, coreMax: 10, sockets, enemies: [] });

    TURRET_KINDS.forEach((kind, i) => {
      const index = i * 3;
      const body = scene.getMeshByName(`socket-${index}-turret-body`);
      expect(body, `${kind} @ socket-${index}`).toBeTruthy();
      expect(body.metadata.socket).toBe(index);
      expect(scene.getMeshByName(`socket-${index}-turret-glow`)).toBeTruthy();
    });

    syncWorld(scene, { coreHp: 10, coreMax: 10, sockets: [], enemies: [] });
    expect(scene.getMeshByName("socket-0-turret-body")).toBeNull();
  });

  it("过载更亮、过热压暗成橙色", () => {
    syncWorld(scene, { coreHp: 10, coreMax: 10, sockets: [{ towerId: "rail" }] });
    const glowMat = getWorld(scene).sockets.list[0].turret.glowMat;
    const calm = glowMat.emissiveIntensity;

    syncWorld(scene, { coreHp: 10, coreMax: 10, sockets: [{ towerId: "rail", overclock: true }] });
    expect(glowMat.emissiveIntensity).toBeGreaterThan(calm * 1.5);

    syncWorld(scene, { coreHp: 10, coreMax: 10, sockets: [{ towerId: "rail", overheated: true }] });
    expect(glowMat.emissiveIntensity).toBeLessThan(calm);
    expect(glowMat.emissiveColor.r).toBeGreaterThan(glowMat.emissiveColor.b * 3);

    syncWorld(scene, { coreHp: 10, coreMax: 10, sockets: [] });
  });

  it("星核随 coreHp 下降变冷变暗", () => {
    syncWorld(scene, { coreHp: 20, coreMax: 20 });
    const core = getWorld(scene).core;
    const hot = { r: core.innerMat.emissiveColor.r, b: core.innerMat.emissiveColor.b, i: core.innerMat.emissiveIntensity };

    syncWorld(scene, { coreHp: 2, coreMax: 20 });
    const cold = { r: core.innerMat.emissiveColor.r, b: core.innerMat.emissiveColor.b, i: core.innerMat.emissiveIntensity };

    expect(cold.b).toBeGreaterThan(hot.b);
    expect(cold.r).toBeLessThan(hot.r);
    expect(cold.i).toBeLessThan(hot.i);
  });

  it("敌人按极坐标铺成 thin instance", () => {
    const enemies = [];
    for (let i = 0; i < 40; i += 1) {
      enemies.push({ id: i, lane: i % 3, theta: (i / 40) * TAU, radius: 30 + (i % 7), hp: 5, hpMax: 5 });
    }
    syncWorld(scene, { coreHp: 10, coreMax: 10, enemies });

    const pools = [...getWorld(scene).enemies.pools.values()];
    const total = pools.reduce((sum, pool) => sum + pool.count, 0);
    expect(total).toBe(40);
    expect(pools.filter((pool) => pool.count > 0).every((pool) => pool.mesh.isEnabled())).toBe(true);

    const active = pools.find((pool) => pool.count > 0);
    const tx = active.data[12];
    const tz = active.data[14];
    expect(Math.hypot(tx, tz)).toBeGreaterThan(25);

    syncWorld(scene, { coreHp: 10, coreMax: 10, enemies: [] });
    expect(pools.every((pool) => pool.count === 0)).toBe(true);
  });

  it("容量不够时会自动扩容而不是丢帧", () => {
    const enemies = Array.from({ length: 400 }, (_, i) => ({
      id: i,
      lane: 0,
      theta: (i / 400) * TAU,
      radius: 44,
      hp: 1,
      hpMax: 1,
    }));
    syncWorld(scene, { coreHp: 10, coreMax: 10, enemies });
    const pool = getWorld(scene).enemies.pools.get("drone:0");
    expect(pool.count).toBe(400);
    expect(pool.capacity).toBeGreaterThanOrEqual(400);
    syncWorld(scene, { coreHp: 10, coreMax: 10, enemies: [] });
  });

  it("pickSocket 能从插座、炮塔零件与 PointerInfo 里读出下标", () => {
    syncWorld(scene, { coreHp: 10, coreMax: 10, sockets: [{ towerId: "star" }] });

    const pedestal = scene.getMeshByName("socket-7");
    expect(pickSocket(scene, { hit: true, pickedMesh: pedestal })).toBe(7);
    expect(pickSocket(scene, { pickInfo: { hit: true, pickedMesh: pedestal } })).toBe(7);

    const turretGlow = scene.getMeshByName("socket-0-turret-glow");
    expect(pickSocket(scene, { hit: true, pickedMesh: turretGlow })).toBe(0);

    const rim = scene.getMeshByName("socket-3-rim");
    expect(pickSocket(scene, { hit: true, pickedMesh: rim })).toBe(3);

    expect(pickSocket(scene, { hit: true, pickedMesh: scene.getMeshByName("deck-hex") })).toBeNull();
    expect(pickSocket(scene, { hit: false, pickedMesh: pedestal })).toBeNull();
    expect(pickSocket(scene, null)).toBeNull();
    expect(pickSocket(null, null)).toBeNull();

    syncWorld(scene, { coreHp: 10, coreMax: 10, sockets: [] });
  });

  it("世界层不画弹道：view.shots 既不建网格也不进归一化结果", () => {
    expect(scene.getMeshByName("shot-tracers")).toBeNull();

    const before = scene.meshes.length;
    const normalized = syncWorld(scene, {
      coreHp: 10,
      coreMax: 10,
      enemies: [{ id: 1, lane: 0, theta: 0.4, radius: 30, hp: 3, hpMax: 3 }],
      shots: [{ socket: 5, to: { x: 0, y: 4, z: 0 } }, { from: { x: 1, y: 1, z: 1 }, to: { x: 9, y: 4, z: 3 } }],
    });

    expect(normalized.shots).toBeUndefined();
    expect(scene.meshes.length).toBe(before);
    expect(scene.meshes.some((mesh) => /shot|tracer/i.test(mesh.name))).toBe(false);
    // 弹道被忽略不代表这一帧被丢掉：敌人照常上场。
    expect([...getWorld(scene).enemies.pools.values()].reduce((sum, pool) => sum + pool.count, 0)).toBe(1);

    syncWorld(scene, { coreHp: 10, coreMax: 10, enemies: [] });
  });

  it("对残缺 view 保持沉默而不是抛错", () => {
    expect(() => syncWorld(scene, null)).not.toThrow();
    expect(() => syncWorld(scene, { sockets: "nope", enemies: 42 })).not.toThrow();
    expect(() => syncWorld(scene, { enemies: [null, {}, { lane: 1 }] })).not.toThrow();
  });

  it("对外暴露统一的尺寸口径", () => {
    expect(WORLD_METRICS.socketCount).toBe(24);
    expect(WORLD_METRICS.socketRadius).toBe(40);
    expect(WORLD_METRICS.laneY).toEqual([0, 4, 9]);
    expect(WORLD_METRICS.turretKinds).toEqual(["rail", "prism", "scatter", "well", "star"]);
  });
});

describe("生命周期", () => {
  it("重复 buildWorld 不会留下重复插座，dispose 后场景干净", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);

    buildWorld(scene, undefined, { glow: false });
    buildWorld(scene, undefined, { glow: false });
    const sockets = scene.meshes.filter((mesh) => /^socket-\d+$/.test(mesh.name));
    expect(sockets).toHaveLength(SOCKET_COUNT);

    disposeWorld(scene);
    expect(scene.meshes.filter((mesh) => /^socket-\d+$/.test(mesh.name))).toHaveLength(0);
    expect(getWorld(scene)).toBeNull();
    expect(syncWorld(scene, {})).toBeNull();

    scene.dispose();
    engine.dispose();
  });

  it("传入 getView 时每帧自动同步", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    let calls = 0;
    buildWorld(
      scene,
      () => {
        calls += 1;
        return { coreHp: 5, coreMax: 20, sockets: [{ towerId: "prism" }], enemies: [] };
      },
      { glow: false }
    );

    scene.render();
    expect(calls).toBeGreaterThan(0);
    expect(scene.getMeshByName("socket-0-turret-body")).toBeTruthy();
    expect(getWorld(scene).clock).toBeGreaterThan(0);

    disposeWorld(scene);
    scene.dispose();
    engine.dispose();
  });
});
