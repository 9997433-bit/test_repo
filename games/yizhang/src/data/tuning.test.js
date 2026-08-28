// CAMERA 机位对照登记表的双边同数测试（LOOK-R1，GDD §15）。
//
// 表是**登记不是权威**：距离 / 阻尼的实现权威在 render/camera.js（O2 域），
// snap 两阈值以契约 §7.1 为准。这里逐项对照——render 侧改值不回修 tuning.js
// 时本测先红；表内数字被人「另造一套」时同样先红。
// （测试文件 import render 只是对照校验；tuning.js 本体仍是纯数据，不 import three。）

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";
import { Vector3 } from "../render/gfx.js";

import { CAMERA, CHARACTERS, MOVEMENT } from "./tuning.js";
import {
  BASE_PITCH,
  BEHIND_LIMIT,
  BEHIND_SHELL,
  CAMERA_SNAP_MAX_DIST,
  CAMERA_SNAP_TELEPORT,
  LOCKED_YAW_SPAN,
  createCamera,
  lockedHoldSlack,
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
      "lockedYawSpan",
      "lockedHoldRate",
      "lockedHoldMin",
      "lockedHoldMax",
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

describe("CAMERA 两道背后闸对照（R2 locked 硬顶 / R3 咬合闸，复盘 P1-6）", () => {
  it("lockedYawSpan = render LOCKED_YAW_SPAN，且 R2 上限严格大于 R3 BEHIND_LIMIT", () => {
    expect(CAMERA.lockedYawSpan).toBe(LOCKED_YAW_SPAN);
    expect(CAMERA.behindLimit).toBe(BEHIND_LIMIT);
    // 两闸并存的几何前提：R3 咬合闸（≈75°）在内先咬，R2 硬顶（≈84°）是更靠外的最后
    // 一道墙。若 behindLimit ≥ lockedYawSpan，咬合闸永远先夹住、硬顶形同虚设。
    expect(CAMERA.lockedYawSpan).toBeGreaterThan(CAMERA.behindLimit);
    // 硬顶必须仍在严格的背后半平面（π/2）之内：留出的 0.1rad 余量让「机位到角色
    // 前向的投影」恒为确定的负数（GDD §15.3）。
    expect(CAMERA.lockedYawSpan).toBeLessThan(Math.PI / 2);
  });

  it("lockedHold 带宽三常量与 render lockedHoldSlack(dt) 实现同数", () => {
    // 线性带内：slack = rate × dt
    expect(lockedHoldSlack(0.02)).toBeCloseTo(CAMERA.lockedHoldRate * 0.02, 12);
    // 下夹 / 上夹
    expect(lockedHoldSlack(1e-4)).toBe(CAMERA.lockedHoldMin);
    expect(lockedHoldSlack(10)).toBe(CAMERA.lockedHoldMax);
    // 60fps 的一帧落在带内、不贴任何一侧夹子（日常帧率下带宽真在起作用）
    const s = lockedHoldSlack(1 / 60);
    expect(s).toBeGreaterThan(CAMERA.lockedHoldMin);
    expect(s).toBeLessThan(CAMERA.lockedHoldMax);
    expect(CAMERA.lockedHoldMin).toBeLessThan(CAMERA.lockedHoldMax);
  });
});

describe("CHARACTERS 模型瞬移阈值（render/characters.js 对照，复盘 P0-3）", () => {
  it("teleportDistance = 16，与 render 源码同数（常量模块私有，读源对照）", () => {
    expect(CHARACTERS.teleportDistance).toBe(16);
    const src = readFileSync(
      new URL("../render/characters.js", import.meta.url),
      "utf8"
    );
    const m = src.match(/const TELEPORT_DISTANCE = ([\d.]+);/);
    expect(m, "render/characters.js 里必须有 TELEPORT_DISTANCE 常量").not.toBeNull();
    expect(Number(m[1])).toBe(CHARACTERS.teleportDistance);
  });

  it("16 管模型、60 管机位，故意不同数：重生 ≤ 40m 模型必须瞬移、机位不得 snap", () => {
    // 模型阈值必须低于重生级瞬移（≤ 2 × arenaRadius = 40m）：人直接出现在新位置，不滑步
    expect(CHARACTERS.teleportDistance).toBeLessThan(40);
    // 机位阈值必须高于同一条线（契约 §14-33，弹簧甩镜手感保留）——两阈值因此必然不同数
    expect(CAMERA.snapTeleport).toBeGreaterThan(40);
    expect(CHARACTERS.teleportDistance).toBeLessThan(CAMERA.snapTeleport);
    // 正常移动永远够不到：全速 + 冲刺的一帧位移（60Hz）连阈值的十分之一都不到
    const maxFrameStep = (MOVEMENT.walkSpeed + MOVEMENT.dashImpulse) / 60;
    expect(CHARACTERS.teleportDistance).toBeGreaterThan(maxFrameStep * 10);
  });

  it("CHARACTERS 表键集封闭、JSON 纯净", () => {
    expect(Object.keys(CHARACTERS)).toEqual(["teleportDistance"]);
    expect(Number.isFinite(CHARACTERS.teleportDistance)).toBe(true);
    expect(CHARACTERS.teleportDistance).toBeGreaterThan(0);
    expect(JSON.parse(JSON.stringify(CHARACTERS))).toEqual(CHARACTERS);
  });
});
