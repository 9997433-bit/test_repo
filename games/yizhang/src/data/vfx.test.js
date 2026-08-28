// 每掌战斗 VFX 参数表契约测试（Round 2 遗留 3；纪律来自手册 §10 与
// ART_DIRECTION §7/§9）。粒子数与秒数归 F3 可调；这里锁的是「八掌各不相同、
// 有残留、识别色不漂移、加法混合只给真高温」这些不变量。
import { describe, expect, it } from "vitest";
import {
  GLOVE_VFX,
  GLOVE_VFX_BY_ID,
  GLOVE_VFX_BY_SKILL,
  resolveGloveVfx,
} from "./vfx.js";
import { GLOVES, GLOVE_BY_ID } from "./gloves.js";
import { SKILL_COMBAT_ALIASES } from "./skills.js";

/** 「纯色光球」词根：任何形状/残留关键词都不得撞上（拒收清单 §9-11） */
const BANNED_SHAPES = /^(sphere|orb|ball|glow|flash)$/i;

/** 深走一遍对象树，把所有 blend 取值连同宿主收集出来 */
function collectBlends(node, gloveId, path, out) {
  if (!node || typeof node !== "object") return out;
  for (const [k, v] of Object.entries(node)) {
    if (k === "blend") out.push({ gloveId, path, value: v, host: node });
    else collectBlends(v, gloveId, `${path}.${k}`, out);
  }
  return out;
}

describe("GLOVE_VFX 战斗特效表", () => {
  it("覆盖首发 8 掌，数组顺序 = GLOVES 图鉴前缀，BY_ID 同一对象", () => {
    // P2 表尾追加的生涯 4 掌暂无专属条目（归 O2，GDD §14）：出场走
    // resolveGloveVfx 兜底木棉，见下面的专项断言。
    expect(GLOVE_VFX).toHaveLength(8);
    expect(GLOVE_VFX.map((v) => v.gloveId)).toEqual(
      GLOVES.slice(0, GLOVE_VFX.length).map((g) => g.id),
    );
    for (const v of GLOVE_VFX) expect(GLOVE_VFX_BY_ID[v.gloveId]).toBe(v);
  });

  it("P2 追加掌暂缺专属条目：resolve 必须兜底木棉，不许返回 undefined", () => {
    const appended = GLOVES.slice(GLOVE_VFX.length);
    expect(appended.length).toBeGreaterThan(0);
    for (const g of appended) {
      expect(GLOVE_VFX_BY_ID[g.id], g.id).toBeUndefined();
      expect(resolveGloveVfx(g.id), g.id).toBe(GLOVE_VFX_BY_ID.cotton);
    }
  });

  it("识别色直引 gloves.color（不许出现第三份色源）；点缀占比 ∈ (0, 0.2]", () => {
    for (const v of GLOVE_VFX) {
      expect(v.ident, v.gloveId).toBe(GLOVE_BY_ID[v.gloveId].color);
      expect(v.identMaxShare, v.gloveId).toBeGreaterThan(0);
      expect(v.identMaxShare, v.gloveId).toBeLessThanOrEqual(0.2);
    }
  });

  it("禁纯色光球：burst 形 / trail 痕 / residue 残留三列各自互异且非光球词根", () => {
    const shapes = GLOVE_VFX.map((v) => v.slap.burst.shape);
    const trails = GLOVE_VFX.map((v) => v.slap.trail.kind);
    const residues = GLOVE_VFX.map((v) => v.slap.residue.kind);
    for (const words of [shapes, trails, residues]) {
      expect(new Set(words).size).toBe(GLOVE_VFX.length);
      for (const w of words) {
        expect(typeof w).toBe("string");
        expect(w.length).toBeGreaterThan(0);
        expect(w, w).not.toMatch(BANNED_SHAPES);
      }
    }
  });

  it("事后残留必查：每掌扇击 residue 有种类、有数量、有寿命（打完不能像没发生）", () => {
    for (const v of GLOVE_VFX) {
      const r = v.slap.residue;
      expect(r.kind, v.gloveId).toBeTruthy();
      expect(r.count, v.gloveId).toBeGreaterThanOrEqual(1);
      expect(r.lifeSeconds, v.gloveId).toBeGreaterThan(0);
      expect(v.slap.burst.lifeSeconds, v.gloveId).toBeGreaterThan(0);
      expect(v.slap.trail.lifeSeconds, v.gloveId).toBeGreaterThan(0);
    }
  });

  it("技能分派：skill.skillId = §3.1 右列 handler id；木棉无主动技留空", () => {
    // 只对照有专属条目的首发 8 掌；追加掌复用同一批 skillId，命中同一条 BY_SKILL。
    for (const g of GLOVES.filter((glove) => GLOVE_VFX_BY_ID[glove.id])) {
      const v = GLOVE_VFX_BY_ID[g.id];
      if (g.id === "cotton") {
        expect(v.skill).toBeNull();
        // 觉醒 combo3 第三掌的收尾表现走 slap.finisher，不占技能位
        expect(v.slap.finisher.scaleMul).toBeGreaterThan(1);
        continue;
      }
      const handlerId = SKILL_COMBAT_ALIASES[g.skillId];
      expect(handlerId, g.id).toBeTruthy();
      expect(v.skill.skillId, g.id).toBe(handlerId);
      expect(v.skill.shape, g.id).toBeTruthy();
      expect(v.skill.residue.kind, g.id).toBeTruthy();
      expect(GLOVE_VFX_BY_SKILL[handlerId]).toBe(v);
    }
    expect(Object.keys(GLOVE_VFX_BY_SKILL)).toHaveLength(GLOVE_VFX.length - 1);
  });

  it("分身必须描述残影：保留姿态、边缘先散、去饱和、有寿命（禁蓝色光柱）", () => {
    const v = GLOVE_VFX_BY_ID.afterimage;
    // 扇击剥离的单帧残影
    expect(v.slap.trail.kind).toBe("poseGhost");
    expect(v.slap.trail.keepPose).toBe(true);
    expect(v.slap.trail.edgeDissolve).toBe(true);
    // blinkSwap 换位两端的残影规格（O2 画 view.combat.ghosts 的依据）
    const ghosts = v.skill.ghosts;
    expect(ghosts.count).toBeGreaterThanOrEqual(1);
    expect(ghosts.keepPose).toBe(true);
    expect(ghosts.edgeDissolve).toBe(true);
    expect(ghosts.desaturate).toBeGreaterThan(0);
    expect(ghosts.desaturate).toBeLessThanOrEqual(1);
    expect(ghosts.lifeSeconds).toBeGreaterThan(0);
  });

  it("加法混合只给真高温：全表 blend:'additive' 仅出现在陨掌余烬上", () => {
    const blends = [];
    for (const v of GLOVE_VFX) collectBlends(v, v.gloveId, v.gloveId, blends);
    const additive = blends.filter((b) => b.value === "additive");
    expect(additive.length).toBeGreaterThan(0);
    for (const b of additive) {
      expect(b.gloveId, b.path).toBe("meteor");
      expect(b.host.kind, b.path).toBe("embers");
    }
    for (const b of blends) expect(["normal", "additive"]).toContain(b.value);
  });

  it("resolveGloveVfx：未知 / 缺省回落木棉（与 createMatch 同一约定）", () => {
    expect(resolveGloveVfx("granite")).toBe(GLOVE_VFX_BY_ID.granite);
    expect(resolveGloveVfx("查无此掌")).toBe(GLOVE_VFX_BY_ID.cotton);
    expect(resolveGloveVfx(null)).toBe(GLOVE_VFX_BY_ID.cotton);
    expect(resolveGloveVfx()).toBe(GLOVE_VFX_BY_ID.cotton);
  });

  it("JSON 纯净 + 深冻结：可序列化、可 structuredClone、改写抛错", () => {
    const roundTrip = JSON.parse(JSON.stringify(GLOVE_VFX));
    expect(roundTrip).toEqual(GLOVE_VFX);
    expect(() => structuredClone(GLOVE_VFX)).not.toThrow();
    expect(() => {
      GLOVE_VFX_BY_ID.meteor.slap.residue.count = 99;
    }).toThrow();
    expect(() => {
      GLOVE_VFX[0].ident = "#ffffff";
    }).toThrow();
  });
});
