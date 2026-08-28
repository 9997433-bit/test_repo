// HUB 布局表契约测试（API_CONTRACT §3.3 硬约束 1–4 + sim 接管冒烟）。
// 数值本身归 F3 可调；这里锁的是形状与几何不变量——改坐标先过这份测试。
import { describe, expect, it, afterEach } from "vitest";
import { HUB } from "./hub.js";
import { GLOVES } from "./gloves.js";
import {
  createMatch,
  getView,
  step,
  getDeps,
  getHubLayout,
  installHubLayout,
  resetDeps,
  HUB_ZERO_INPUT,
} from "../sim/index.js";

/** 点到 AABB（xz 平面）的最短距离 */
function distToRect(x, z, rect) {
  const dx = Math.max(rect.minX - x, 0, x - rect.maxX);
  const dz = Math.max(rect.minZ - z, 0, z - rect.maxZ);
  return Math.hypot(dx, dz);
}

const R = HUB.interactRadius;

describe("HUB 布局表（契约 §3.3 形状）", () => {
  it("恰好 8 座，gloveId 唯一覆盖首发 8 掌，顺序 = GLOVES 图鉴前缀（硬约束 1）", () => {
    // P2 内容轮表尾追加了生涯 4 掌，但走道仍 8 座：新掌不上 3D 台座
    //（GDD §12 / §5.1），台座序 = GLOVES 前 8 的图鉴序。
    expect(HUB.pedestals.length).toBe(8);
    expect(HUB.pedestals.map((p) => p.gloveId)).toEqual(
      GLOVES.slice(0, 8).map((g) => g.id),
    );
  });

  it("字段齐全且 JSON 纯净（无 undefined / NaN / Infinity / 函数）", () => {
    for (const ped of HUB.pedestals) {
      for (const k of ["x", "y", "z", "yaw"]) expect(Number.isFinite(ped[k]), `${ped.gloveId}.${k}`).toBe(true);
    }
    for (const k of ["x", "z", "yaw"]) expect(Number.isFinite(HUB.spawn[k])).toBe(true);
    for (const k of ["x", "z", "yaw"]) expect(Number.isFinite(HUB.portal[k])).toBe(true);
    expect(Number.isFinite(HUB.floorY)).toBe(true);
    const roundTrip = JSON.parse(JSON.stringify(HUB));
    expect(roundTrip).toEqual(HUB);
    expect(() => structuredClone(HUB)).not.toThrow();
  });

  it("数据表只读：深冻结，直接改写抛错", () => {
    expect(() => {
      HUB.pedestals[0].x = 999;
    }).toThrow();
    expect(() => {
      HUB.interactRadius = 99;
    }).toThrow();
  });

  it("interactRadius ∈ [1.6, 2.2]；任意两座间距 > 2 × interactRadius（硬约束 2）", () => {
    expect(R).toBeGreaterThanOrEqual(1.6);
    expect(R).toBeLessThanOrEqual(2.2);
    const peds = HUB.pedestals;
    for (let i = 0; i < peds.length; i++) {
      for (let j = i + 1; j < peds.length; j++) {
        const d = Math.hypot(peds[i].x - peds[j].x, peds[i].z - peds[j].z);
        expect(d, `${peds[i].gloveId} ↔ ${peds[j].gloveId}`).toBeGreaterThan(2 * R);
      }
    }
  });

  it("大厅全部几何与裂岛圆盘（半径 20 + 2m 缓冲）不重叠（硬约束 3）", () => {
    const SAFE = 22;
    // AABB 离原点的最短距离 = 原点到矩形的距离
    expect(distToRect(0, 0, HUB.bounds)).toBeGreaterThan(SAFE);
    expect(distToRect(0, 0, HUB.portal.aabb)).toBeGreaterThan(SAFE);
    // sim 兼容超集里的 zone（判定体积）比 bounds 更宽，同样不许碰岛
    const zoneRect = {
      minX: HUB.origin.x - HUB.zone.halfWidth,
      maxX: HUB.origin.x + HUB.zone.halfWidth,
      minZ: HUB.zone.minZ,
      maxZ: HUB.zone.maxZ,
    };
    expect(distToRect(0, 0, zoneRect)).toBeGreaterThan(SAFE);
    for (const ped of HUB.pedestals) {
      expect(Math.hypot(ped.x, ped.z) - R, ped.gloveId).toBeGreaterThan(SAFE);
    }
  });

  it("spawn / 台座 / portal.aabb 都在 bounds 内；门区不碰任何台座交互圈（硬约束 4）", () => {
    const inBounds = (x, z) =>
      x >= HUB.bounds.minX && x <= HUB.bounds.maxX && z >= HUB.bounds.minZ && z <= HUB.bounds.maxZ;
    expect(inBounds(HUB.spawn.x, HUB.spawn.z)).toBe(true);
    for (const ped of HUB.pedestals) expect(inBounds(ped.x, ped.z), ped.gloveId).toBe(true);
    const a = HUB.portal.aabb;
    expect(inBounds(a.minX, a.minZ)).toBe(true);
    expect(inBounds(a.maxX, a.maxZ)).toBe(true);
    for (const ped of HUB.pedestals) {
      expect(distToRect(ped.x, ped.z, a), ped.gloveId).toBeGreaterThan(R);
    }
  });

  it("出生点面向传送门（yaw=0 → -Z，ADR-17），门在出生点前方", () => {
    // forward(yaw) = (-sin yaw, -cos yaw)
    const fx = -Math.sin(HUB.spawn.yaw);
    const fz = -Math.cos(HUB.spawn.yaw);
    const dx = HUB.portal.x - HUB.spawn.x;
    const dz = HUB.portal.z - HUB.spawn.z;
    expect(fx * dx + fz * dz).toBeGreaterThan(0);
    // 出生点不落在任何台座的交互圈里（开局不弹说明牌）
    for (const ped of HUB.pedestals) {
      expect(Math.hypot(ped.x - HUB.spawn.x, ped.z - HUB.spawn.z), ped.gloveId).toBeGreaterThan(R);
    }
  });

  it("展掌朝向走道中线：左排面 +X、右排面 -X（forward 指向中线）", () => {
    for (const ped of HUB.pedestals) {
      const fx = -Math.sin(ped.yaw);
      // x < 0（左排）应面向 +X，x > 0（右排）应面向 -X
      expect(fx * -Math.sign(ped.x), ped.gloveId).toBeGreaterThan(0.99);
    }
  });
});

describe("HUB 布局表（sim 接管冒烟）", () => {
  afterEach(() => resetDeps());

  it("installHubLayout(HUB) 后 deps 以 data 表为准，坐标逐字段透传", () => {
    installHubLayout(HUB);
    expect(getDeps().usingDataHub).toBe(true);
    const layout = getHubLayout();
    expect(layout.source).toBe("data");
    expect(layout.spawn.z).toBe(HUB.spawn.z);
    expect(layout.portal.z).toBe(HUB.portal.z);
    expect(layout.interactRadius).toBe(HUB.interactRadius);
    expect(layout.pedestals.map((p) => p.gloveId)).toEqual(HUB.pedestals.map((p) => p.gloveId));
    expect(layout.pedestals.map((p) => [p.x, p.z, p.yaw])).toEqual(
      HUB.pedestals.map((p) => [p.x, p.z, p.yaw]),
    );
  });

  it("createMatch 从数据表出生点开局，走近木棉台座即聚焦", () => {
    installHubLayout(HUB);
    const state = createMatch({ seed: 7, gloveId: "cotton", offhandId: "cotton" });
    expect(state.phase).toBe("hub");
    const p0 = state.players[0];
    expect(p0.z).toBe(HUB.spawn.z);
    expect(p0.x).toBe(HUB.spawn.x);

    // 把 p0 摆到木棉台座旁 1.5m（圈内 2.0、台座实体 1.3 之外），一步后聚焦
    const cotton = HUB.pedestals[0];
    p0.x = cotton.x + 1.5;
    p0.z = cotton.z;
    step(state, { p0: { ...HUB_ZERO_INPUT } }, 1 / 60);
    expect(getView(state).hub.focusGloveId).toBe("cotton");
  });
});
