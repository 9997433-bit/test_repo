// 安全区里的动作闸门与换掌语义（Round 2 · O1）。
// 空挥闸：hub 内不启动扇击 / 主动技 / 冲刺；走、看、跳、interact、换掌照常。
// 换掌：hub 是主副槽交换（无 switchLock），arena 维持槽位切换 + 0.4s 收掌锁。

import { describe, expect, it } from "vitest";

import { createMatch, getPlayer, getView, playerInHub, step, HUB_ZERO_INPUT } from "./index.js";

const DT = 1 / 60;

function input(over = {}) {
  return { ...HUB_ZERO_INPUT, ...over };
}

function hold(state, keys, ticks) {
  for (let i = 0; i < ticks; i++) step(state, { p0: input(keys) }, DT);
}

/** 松一帧再按，制造上升沿 */
function tap(state, key) {
  step(state, { p0: input() }, DT);
  step(state, { p0: input({ [key]: true }) }, DT);
}

function hubMatch(opts = {}) {
  return createMatch({ seed: 0x4f31, botCount: 0, ...opts });
}

function arenaMatch(opts = {}) {
  return hubMatch({ phase: "arena", ...opts });
}

function eventTypes(state) {
  return state.events.map((e) => e.type);
}

describe("安全区空挥闸", () => {
  it("hub 内按住扇击：不发 slapStart / slap，stats.slaps 不动，attack 保持 idle", () => {
    const state = hubMatch();
    const p = getPlayer(state, "p0");
    expect(playerInHub(state, p)).toBe(true);

    const seen = [];
    for (let i = 0; i < 90; i++) {
      step(state, { p0: input({ slap: true }) }, DT);
      seen.push(...eventTypes(state));
    }

    expect(seen).not.toContain("slapStart");
    expect(seen).not.toContain("slap");
    expect(seen).not.toContain("hit");
    expect(state.stats.slaps).toBe(0);
    expect(p.attack.phase).toBe("idle");
    expect(p.attack.t).toBe(0);
    expect(p.slapCd).toBe(0);
    expect(getView(state).players[0].attackPhase).toBe("idle");
  });

  it("hub 内不放主动技：不发 skill 事件，skillCd 不进冷却", () => {
    const state = hubMatch({ gloveId: "granite", unlocked: "all" });
    const p = getPlayer(state, "p0");

    const seen = [];
    for (let i = 0; i < 8; i++) {
      tap(state, "skill");
      seen.push(...eventTypes(state));
    }

    expect(seen).not.toContain("skill");
    expect(p.skillCd).toBe(0);
    expect(state.stats.hits).toBe(0);
  });

  it("hub 内不冲刺：不发 dash 事件，dashT / dashCd 保持 0", () => {
    const state = hubMatch();
    const p = getPlayer(state, "p0");

    const seen = [];
    for (let i = 0; i < 8; i++) {
      tap(state, "dash");
      seen.push(...eventTypes(state));
    }

    expect(seen).not.toContain("dash");
    expect(p.dashT).toBe(0);
    expect(p.dashCd).toBe(0);
  });

  it("闸门只关战斗动作：走位、转向、跳跃照常", () => {
    const state = hubMatch();
    const p = getPlayer(state, "p0");
    const from = { x: p.x, z: p.z };

    hold(state, { moveX: 1, yaw: 1.25 }, 30);
    expect(p.yaw).toBeCloseTo(1.25, 6);
    expect(Math.hypot(p.x - from.x, p.z - from.z)).toBeGreaterThan(0.5);
    expect(playerInHub(state, p)).toBe(true);

    step(state, { p0: input({ jump: true }) }, DT);
    expect(eventTypes(state)).toContain("jump");
    expect(p.grounded).toBe(false);
    expect(p.vy).toBeGreaterThan(0);
  });

  it("闸门按空间生效，不是按 phase：phase=hub 时站在裂岛上的人照样出手", () => {
    const state = hubMatch({ botCount: 1 });
    const bot = getPlayer(state, "b0");
    expect(state.phase).toBe("hub");
    expect(playerInHub(state, bot)).toBe(false); // Bot 留在裂岛出生点

    const seen = [];
    for (let i = 0; i < 30; i++) {
      step(state, { b0: input({ slap: true }) }, DT);
      seen.push(...eventTypes(state));
    }

    expect(seen).toContain("slapStart");
    expect(state.stats.slaps).toBeGreaterThan(0);
  });

  it("进岛之后闸门自动打开：同一份按住的输入开始扇", () => {
    const state = hubMatch({ unlocked: "all", gloveId: "frost" });
    const p = getPlayer(state, "p0");

    hold(state, { slap: true }, 20);
    expect(state.stats.slaps).toBe(0);

    const portal = state.hub.layout.portal;
    p.x = portal.x;
    p.z = portal.z;
    step(state, { p0: input({ slap: true }) }, DT);
    expect(state.phase).toBe("arena");

    hold(state, { slap: true }, 20);
    expect(state.stats.slaps).toBeGreaterThan(0);
    expect(getView(state).players[0].skinId).toBe(null);
  });
});

describe("hub 内换掌 = 主副交换", () => {
  it("交换主副槽、activeSlot 归 0、无 switchLock 代价，发 switch 事件", () => {
    const state = hubMatch({ gloveId: "cotton", offhandId: "granite", unlocked: "all" });
    const p = getPlayer(state, "p0");
    expect(state.hub.mainGloveId).toBe("cotton");
    expect(state.hub.offGloveId).toBe("granite");

    step(state, { p0: input({ switchGlove: true }) }, DT);

    expect(p.gloveId).toBe("granite");
    expect(p.offhandId).toBe("cotton");
    expect(p.activeSlot).toBe(0);
    expect(p.switchLockT).toBe(0);
    expect(p.slapCd).toBe(0);
    expect(state.events).toContainEqual(
      expect.objectContaining({ type: "switch", id: "p0", slot: 0, gloveId: "granite" }),
    );

    // 「挑过」的位与台座标记随行，传送门不会因为交换失效
    const view = getView(state);
    expect(view.hub.mainGloveId).toBe("granite");
    expect(view.hub.offGloveId).toBe("cotton");
    expect(view.hub.portalReady).toBe(true);
    expect(view.hub.pedestals.find((ped) => ped.gloveId === "granite").slot).toBe("main");
    expect(view.hub.pedestals.find((ped) => ped.gloveId === "cotton").slot).toBe("off");
    expect(view.players[0].activeGloveId).toBe("granite");
  });

  it("没有收掌锁：连着两次上升沿都生效，换回原配装", () => {
    const state = hubMatch({ gloveId: "cotton", offhandId: "granite", unlocked: "all" });
    const p = getPlayer(state, "p0");

    step(state, { p0: input({ switchGlove: true }) }, DT);
    expect(p.gloveId).toBe("granite");

    tap(state, "switchGlove"); // 距上一次远不到 0.4s
    expect(p.gloveId).toBe("cotton");
    expect(p.offhandId).toBe("granite");
    expect(p.switchLockT).toBe(0);
  });

  it("长按不连发：按住不放只交换一次", () => {
    const state = hubMatch({ gloveId: "cotton", offhandId: "granite", unlocked: "all" });
    const p = getPlayer(state, "p0");

    hold(state, { switchGlove: true }, 60);
    expect(p.gloveId).toBe("granite");
    expect(p.offhandId).toBe("cotton");
  });

  it("走道里选完主副掌再交换：新主掌就是刚才的副掌", () => {
    const state = hubMatch({ unlocked: ["cotton", "frost", "magnet"] });
    const p = getPlayer(state, "p0");
    const stand = (gloveId) => {
      const ped = state.hub.pedestals.find((item) => item.gloveId === gloveId);
      p.x = ped.x + (ped.x < 0 ? 1.4 : -1.4);
      p.z = ped.z;
    };

    stand("frost");
    tap(state, "interact");
    stand("magnet");
    tap(state, "interact");
    expect(p.gloveId).toBe("frost");
    expect(p.offhandId).toBe("magnet");

    tap(state, "switchGlove");
    expect(p.gloveId).toBe("magnet");
    expect(p.offhandId).toBe("frost");
    expect(state.hub.mainGloveId).toBe("magnet");
    expect(state.hub.offGloveId).toBe("frost");
  });

  it("arena 维持旧语义：切 activeSlot + 0.4s 收掌锁，主副槽不动", () => {
    const state = arenaMatch({ gloveId: "cotton", offhandId: "granite" });
    const p = getPlayer(state, "p0");

    step(state, { p0: input({ switchGlove: true }) }, DT);
    expect(p.activeSlot).toBe(1);
    expect(p.gloveId).toBe("cotton");
    expect(p.offhandId).toBe("granite");
    expect(p.switchLockT).toBeCloseTo(state.config.switchLock, 5);
    expect(getView(state).players[0].activeGloveId).toBe("granite");

    // 锁内再按无效
    tap(state, "switchGlove");
    expect(p.activeSlot).toBe(1);
  });
});
