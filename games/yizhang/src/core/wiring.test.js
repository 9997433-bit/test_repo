// 装配层的回归测试：Round 1 的两个致命缺陷（人类 id 分裂、sim 没拿到 data/combat）
// 都在这里钉死。

import { afterEach, describe, expect, it } from "vitest";

import * as combat from "../combat/index.js";
import * as data from "../data/index.js";
import * as sim from "../sim/index.js";
import { alignSkillIds, wireSimDeps, wiringStatus } from "./modules.js";
import { SELF_ID, adaptView, cameraYawToSimYaw } from "./view.js";

afterEach(() => {
  sim.resetDeps();
});

describe("wireSimDeps", () => {
  it("把真实 data 装进 sim：生效掌表就是 8 掌真实数值", () => {
    sim.resetDeps();
    const before = sim.getGloves().find((g) => g.id === "granite");
    const out = wireSimDeps(sim, data, combat);

    expect(out).toMatchObject({ data: true, combat: true, supported: true });
    expect(out.remappedSkills.length).toBeGreaterThan(0);
    const after = sim.getGloves().find((g) => g.id === "granite");
    expect(after.slapCooldown).toBe(1.15); // src/data/gloves.js 的磐石
    // sim 静态 import 的就是这张表，装配前后都得是真数值（Round 2 起不再有兜底棉掌）。
    expect(before.slapCooldown).toBe(1.15);
    expect(sim.getGloves()).toHaveLength(data.GLOVES.length);
    // 装配的额外收益是技能别名落地：data 的 quake_slam 进局变成 combat 认得的 groundPound。
    expect(sim.getGloves().find((g) => g.id === "granite").skillId).toBe("groundPound");
  });

  it("接线真值：静态 deps 也算真 combat，装了真模块不该被报成降级", () => {
    // sim 静态 import 真实 combat，此时没有任何替身。
    sim.resetDeps();
    expect(wiringStatus(sim, {})).toMatchObject({
      usingRealData: true,
      usingRealCombat: true,
      source: "static",
    });

    // 装配层把真实模块装进去后，deps 的 usingReal* 只表示「装了东西」而翻假，
    // 但进局的仍是真 combat —— wiringStatus 必须报真，否则 main 会亮假降级横幅。
    const out = wireSimDeps(sim, data, combat);
    expect(sim.getDeps().usingRealCombat).toBe(false);
    expect(wiringStatus(sim, out)).toMatchObject({
      usingRealData: true,
      usingRealCombat: true,
      source: "install+static",
    });
    expect(typeof sim.getDeps().combat.resolveSlap).toBe("function");
  });

  it("没有 getDeps 的模拟只能靠 install 结果表态", () => {
    expect(wiringStatus({}, { data: true, combat: false })).toEqual({
      usingRealData: true,
      usingRealCombat: false,
      source: "install",
    });
  });

  it("sim 没有 install* 钩子时安静返回，不抛错", () => {
    const quiet = { data: false, combat: false, supported: false, remappedSkills: [] };
    expect(wireSimDeps({}, data, combat)).toEqual(quiet);
    expect(wireSimDeps(null, data, combat)).toEqual(quiet);
  });
});

describe("输入打到 p0", () => {
  it("SELF_ID 就是 sim 里唯一的人类，按 p0 送输入他会动", () => {
    wireSimDeps(sim, data, combat);
    const state = sim.createMatch({ seed: 3, gloveId: "cotton", offhandId: "granite", botCount: 3 });
    const self = sim.getPlayer(state, SELF_ID);
    expect(self).toBeTruthy();
    expect(self.kind).toBe("human");

    const from = { x: self.x, z: self.z };
    // 相机朝 -Z 时（yaw=-π/2）换算出的 sim 朝向，配上世界系 moveZ = -1
    const yaw = cameraYawToSimYaw(-Math.PI / 2);
    for (let i = 0; i < 60; i += 1) {
      sim.step(state, { [SELF_ID]: { moveX: 0, moveZ: -1, yaw } }, 1 / 60);
    }
    const moved = Math.hypot(self.x - from.x, self.z - from.z);
    expect(moved).toBeGreaterThan(1);
  });

  it("打到 p1 这个不存在的 id 上，人不会动（Round 1 的表现）", () => {
    const state = sim.createMatch({ seed: 3, gloveId: "cotton", offhandId: "granite", botCount: 3 });
    const self = sim.getPlayer(state, SELF_ID);
    const from = { x: self.x, z: self.z };
    for (let i = 0; i < 60; i += 1) {
      sim.step(state, { p1: { moveX: 1, moveZ: 0, yaw: 0 } }, 1 / 60);
    }
    expect(Math.hypot(self.x - from.x, self.z - from.z)).toBeLessThan(0.05);
  });
});

describe("alignSkillIds", () => {
  it("data 的技能 id 被翻译到 combat 的注册表里", () => {
    const { module, remapped } = alignSkillIds(data, combat);
    const byId = module.GLOVE_BY_ID;
    expect(byId.granite.skillId).toBe("groundPound");
    expect(byId.magnet.skillId).toBe("magnetPull");
    expect(byId.meteor.skillId).toBe("meteorSlam");
    // 木棉没有主动技，data 侧正式写法就是字符串 "none"：原样保留，不许被翻译。
    expect(byId.cotton.skillId).toBe("none");
    expect(remapped).toHaveLength(7);
    // 原模块不能被就地改写
    expect(data.GLOVE_BY_ID.granite.skillId).toBe("quake_slam");
  });

  it("combat 已经认得的 id 原样放行", () => {
    const already = { GLOVES: [{ id: "granite", skillId: "groundPound" }] };
    const { module, remapped } = alignSkillIds(already, combat);
    expect(module).toBe(already);
    expect(remapped).toEqual([]);
  });

  it('"none" 是无主动技的正式写法，不进别名表也不被改写', () => {
    const noSkill = { GLOVES: [{ id: "cotton", skillId: "none" }] };
    const { module, remapped } = alignSkillIds(noSkill, combat);
    expect(module).toBe(noSkill);
    expect(module.GLOVES[0].skillId).toBe("none");
    expect(remapped).toEqual([]);
  });
});

describe("接线后 8 掌技能能进局", () => {
  it("装了 combat 之后按 E 能打出 skill 事件", () => {
    wireSimDeps(sim, data, combat);
    const state = sim.createMatch({ seed: 11, gloveId: "granite", offhandId: "meteor", botCount: 3 });

    let sawSkill = false;
    for (let i = 0; i < 90 && !sawSkill; i += 1) {
      // 边沿触发：一帧按下一帧松开
      sim.step(state, { [SELF_ID]: { skill: i % 2 === 0, yaw: 0 } }, 1 / 60);
      const view = adaptView(sim.getView(state), { selfId: SELF_ID });
      sawSkill = view.events.some((e) => e.type === "skill" && e.playerId === SELF_ID);
    }
    expect(sawSkill).toBe(true);
  });
});
