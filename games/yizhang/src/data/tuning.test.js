// CAMERA 机位对照登记表的双边同数测试（LOOK-R1，GDD §15）。
//
// 表是**登记不是权威**：距离 / 阻尼的实现权威在 render/camera.js（O2 域），
// snap 两阈值以契约 §7.1 为准。这里逐项对照——render 侧改值不回修 tuning.js
// 时本测先红；表内数字被人「另造一套」时同样先红。
// （测试文件 import render 只是对照校验；tuning.js 本体仍是纯数据，不 import three。）

import { describe, expect, it } from "vitest";
import { Vector3 } from "three";

import { CAMERA, MOVEMENT } from "./tuning.js";
import {
  BASE_PITCH,
  BEHIND_LIMIT,
  BEHIND_SHELL,
  CAMERA_SNAP_MAX_DIST,
  CAMERA_SNAP_TELEPORT,
  createCamera,
} from "../render/camera.js";

const DT = 1 / 60;

describe("CAMERA 表形状", () => {
  it("字段齐全、全部为有限正数、JSON 纯净", () => {
    const keys = [
      "dist",
      "restDist",
      "distSpeedGain",
      "distSpeedMax",
      "distAirGain",
      "basePitch",
      "yawDamping",
      "posDamping",
      "posDampingY",
      "lookDamping",
      "lookDampingY",
      "distDamping",
      "pitchDamping",
      "snapTeleport",
      "snapMaxDist",
      "behindLimit",
      "behindShell",
    ];
    expect(Object.keys(CAMERA).sort()).toEqual([...keys].sort());
    for (const k of keys) {
      expect(Number.isFinite(CAMERA[k]), `CAMERA.${k} 必须是有限数`).toBe(true);
      expect(CAMERA[k], `CAMERA.${k} 必须为正`).toBeGreaterThan(0);
    }
    expect(JSON.parse(JSON.stringify(CAMERA))).toEqual(CAMERA);
  });

  it("视点弹簧恒快于机位弹簧（先看后到），竖直不快于水平", () => {
    expect(CAMERA.lookDamping).toBeGreaterThan(CAMERA.posDamping);
    expect(CAMERA.lookDampingY).toBeGreaterThan(CAMERA.posDampingY);
    expect(CAMERA.posDampingY).toBeLessThanOrEqual(CAMERA.posDamping);
    expect(CAMERA.lookDampingY).toBeLessThanOrEqual(CAMERA.lookDamping);
  });
});

describe("CAMERA ↔ render/camera.js 对照（O2 实现同数）", () => {
  it("距离初值 7.4、snap 落位 = restDist 7.1、俯角基准 = BASE_PITCH", () => {
    const rig = createCamera({});
    expect(rig.state.dist).toBe(CAMERA.dist);
    expect(rig.state.pitch).toBe(CAMERA.basePitch);
    expect(BASE_PITCH).toBe(CAMERA.basePitch);

    rig.snap(new Vector3(0, 0, 0), 0);
    expect(rig.state.dist).toBe(CAMERA.restDist);
  });

  it("距离随速拉远：全速直走的稳态距离 = restDist + min(distSpeedMax, walkSpeed × distSpeedGain)", () => {
    const rig = createCamera({});
    const focus = new Vector3(0, 0, 0);
    const vel = new Vector3(MOVEMENT.walkSpeed, 0, 0);
    rig.snap(focus, 0);
    for (let i = 0; i < 900; i += 1) rig.update(DT, focus, 0, vel);
    const want =
      CAMERA.restDist +
      Math.min(CAMERA.distSpeedMax, MOVEMENT.walkSpeed * CAMERA.distSpeedGain);
    expect(rig.state.dist).toBeCloseTo(want, 3);
  });

  it("方位角 / 距离阻尼系数与实现同数（单步弹簧位移逐位对照）", () => {
    const rig = createCamera({});
    const focus = new Vector3(0, 0, 0);
    rig.snap(focus, 0);

    // yawDamping：snap 后 yaw = 0，朝目标 0.6 走一帧的量 = 0.6·(1 − e^(−λ·dt))
    rig.update(DT, focus, 0.6, new Vector3());
    expect(rig.state.yaw).toBeCloseTo(0.6 * (1 - Math.exp(-CAMERA.yawDamping * DT)), 10);

    // distDamping：带速目标距离 = restDist + Δ，一帧走掉 Δ·(1 − e^(−λ·dt))
    const rig2 = createCamera({});
    rig2.snap(focus, 0);
    const speed = 4;
    rig2.update(DT, focus, 0, new Vector3(speed, 0, 0));
    const wantDist =
      CAMERA.restDist + Math.min(CAMERA.distSpeedMax, speed * CAMERA.distSpeedGain);
    const expected =
      CAMERA.restDist +
      (wantDist - CAMERA.restDist) * (1 - Math.exp(-CAMERA.distDamping * DT));
    expect(rig2.state.dist).toBeCloseTo(expected, 10);
  });
});

describe("CAMERA snap 阈值（契约 §7.1 为准）", () => {
  it("snapTeleport = 60 / snapMaxDist = 20，且重生级瞬移（≤ 40m）落在必不触发区间", () => {
    expect(CAMERA.snapTeleport).toBe(60);
    expect(CAMERA.snapMaxDist).toBe(20);
    expect(CAMERA.snapTeleport).toBe(CAMERA_SNAP_TELEPORT);
    expect(CAMERA.snapMaxDist).toBe(CAMERA_SNAP_MAX_DIST);
    expect(CAMERA.behindLimit).toBe(BEHIND_LIMIT);
    expect(CAMERA.behindShell).toBe(BEHIND_SHELL);
    // 契约 §14-33：局内重生瞬移（≤ 2 × arenaRadius = 40m）不得触发自动 snap
    expect(CAMERA.snapTeleport).toBeGreaterThan(40);
    // hub ↔ arena 错开 ~120m 必须触发
    expect(CAMERA.snapTeleport).toBeLessThan(120);
  });

  it("snap 落位实测在 snapMaxDist 上界内，且不贴脸", () => {
    const rig = createCamera({});
    const focus = new Vector3(0, 0, -120); // 安全区量级的落点
    rig.snap(focus, 0);
    const d = rig.camera.position.distanceTo(focus);
    expect(d).toBeLessThanOrEqual(CAMERA.snapMaxDist);
    expect(d).toBeGreaterThan(3);
  });
});
