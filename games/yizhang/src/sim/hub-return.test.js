// Round 3 边角哨兵：计时域（挑掌不吃对局时长）与 enterHub 原局回程。
//
// 计时锚是 `match.startTime`（ADR-20 / 契约 §4.1）：createMatch 时 0，`enterArena`
// 重置成当时的 `time`。「逛大厅不吃对局时间」靠**传送重置**保证，任何动
// `match.startTime` / `hub.enteredArenaAt` 的改动都得让这一组断言与 tests/hub-flow
// 的传送条同时绿（SOTA §11.6 哨兵 10）。

import { describe, expect, it } from "vitest";

import {
  createMatch,
  enterArena,
  enterHub,
  getPlayer,
  getView,
  isMatchOver,
  playerInHub,
  step,
  HUB_ZERO_INPUT,
} from "./index.js";

const DT = 1 / 60;

function input(over = {}) {
  return { ...HUB_ZERO_INPUT, ...over };
}

function hold(state, keys, ticks) {
  const seen = [];
  for (let i = 0; i < ticks; i++) {
    step(state, { p0: input(keys) }, DT);
    seen.push(...state.events.map((e) => e.type));
  }
  return seen;
}

function hubMatch(opts = {}) {
  return createMatch({ seed: 0x52334f31, botCount: 0, ...opts });
}

/** 把人挪到门口，再走一帧完成传送 */
function walkThroughPortal(state, p) {
  const portal = state.hub.layout.portal;
  p.x = portal.x;
  p.z = portal.z;
  step(state, { p0: input() }, DT);
}

describe("计时域：挑掌不吃对局时长", () => {
  it("缺省落 hub：计时锚 0、时长满、逛一圈 isMatchOver 始终 over:false", () => {
    const state = hubMatch({ gloveId: "frost", unlocked: "all" });
    expect(state.phase).toBe("hub");
    expect(state.match.startTime).toBe(0);
    expect(state.match.secondsLeft).toBe(state.config.matchSeconds);
    expect(state.hub.enteredArenaAt).toBe(null);

    for (let i = 0; i < 60 * 10; i++) {
      step(state, { p0: input({ moveX: Math.sin(i * 0.05) }) }, DT);
      expect(isMatchOver(state).over).toBe(false);
    }
    expect(state.match.over).toBe(false);
    expect(state.time).toBeGreaterThan(9.9);
  });

  it("穿门那一刻计时从进岛起算：startTime / enteredArenaAt 都落在当时的 time", () => {
    const state = hubMatch({ gloveId: "frost", unlocked: "all" });
    const p = getPlayer(state, "p0");

    hold(state, {}, 60 * 3); // 在走道上磨蹭三秒
    expect(state.phase).toBe("hub");

    walkThroughPortal(state, p);
    expect(state.phase).toBe("arena");
    expect(state.match.startTime).toBe(state.time);
    expect(state.hub.enteredArenaAt).toBe(state.time);
    expect(state.match.secondsLeft).toBe(state.config.matchSeconds);
    expect(getView(state).match.secondsLeft).toBeCloseTo(state.config.matchSeconds, 3);
    expect(isMatchOver(state)).toMatchObject({ over: false });

    // 进岛之后才开始走表
    hold(state, {}, 60);
    expect(state.match.secondsLeft).toBeCloseTo(state.config.matchSeconds - 1, 2);
  });

  it("在走道上耗掉整场时长也不算数：穿门后满时长重开，胜负清空", () => {
    const state = hubMatch({
      gloveId: "frost",
      unlocked: "all",
      config: { matchSeconds: 2 },
    });
    const p = getPlayer(state, "p0");

    hold(state, {}, 60 * 3); // 比 matchSeconds 还长
    walkThroughPortal(state, p);

    expect(state.phase).toBe("arena");
    expect(state.match.over).toBe(false);
    expect(state.match.winnerId).toBe(null);
    expect(state.match.reason).toBe(null);
    expect(state.match.secondsLeft).toBe(2);
    expect(state.match.startTime).toBeCloseTo(state.time, 6);
    expect(isMatchOver(state)).toMatchObject({ over: false });
  });

  it("enterArena 只动计时域与位置，配装与皮肤原样", () => {
    const state = hubMatch({
      gloveId: "frost",
      offhandId: "magnet",
      skinId: "crane",
      unlocked: "all",
    });
    const p = getPlayer(state, "p0");

    hold(state, {}, 30);
    state.match.over = true;
    state.match.winnerId = "p0";
    state.match.reason = "kills";

    enterArena(state);
    expect(state.match).toMatchObject({ over: false, winnerId: null, reason: null });
    expect(state.match.startTime).toBe(state.time);
    expect(p.gloveId).toBe("frost");
    expect(p.offhandId).toBe("magnet");
    expect(getView(state).players[0].skinId).toBe("crane");
  });
});

describe("enterHub 原局回程", () => {
  it("人回走道、配装与挑过的掌全留着，门仍就绪", () => {
    const state = hubMatch({ gloveId: "frost", offhandId: "magnet", unlocked: "all" });
    const p = getPlayer(state, "p0");
    enterArena(state);
    p.statuses.push({ kind: "slow", t: 3, mag: 0.4 });
    p.kbT = 0.5;
    p.knockScale = 1.6;
    p.alive = false;
    p.respawnT = 0.9;

    enterHub(state);

    expect(state.phase).toBe("hub");
    expect(playerInHub(state, p)).toBe(true);
    expect(p.alive).toBe(true);
    expect(p.respawnT).toBe(0);
    expect(p.statuses).toEqual([]);
    expect(p.attack.phase).toBe("idle");
    expect(p.knockScale).toBe(1);
    expect(p.kbT).toBe(0);
    expect(Math.hypot(p.vx, p.vy, p.vz)).toBe(0);
    expect(p.grounded).toBe(true);

    // 装备保留（契约 §4.4）：回程不是重开一局
    expect(p.gloveId).toBe("frost");
    expect(p.offhandId).toBe("magnet");
    expect(state.hub.mainGloveId).toBe("frost");
    expect(state.hub.offGloveId).toBe("magnet");
    expect(getView(state).hub.portalReady).toBe(true);
    expect(state.hub.focusGloveId).toBe(null);
    expect(state.hub.portalNear).toBe(false);
    expect(state.events).toContainEqual(
      expect.objectContaining({ type: "enterHub", id: "p0", x: p.x, y: p.y, z: p.z }),
    );
  });

  it("不把 arena 的冲刺与收掌锁带回走道：落地不滑行，手回主槽", () => {
    const state = hubMatch({ gloveId: "frost", offhandId: "magnet", unlocked: "all", phase: "arena" });
    const p = getPlayer(state, "p0");

    step(state, { p0: input({ dash: true, moveX: 1 }) }, DT);
    step(state, { p0: input({ switchGlove: true }) }, DT);
    expect(p.dashT).toBeGreaterThan(0);
    expect(p.switchLockT).toBeGreaterThan(0);
    expect(p.activeSlot).toBe(1);

    enterHub(state);
    const landed = { x: p.x, z: p.z };
    expect(p.dashT).toBe(0);
    expect(p.switchLockT).toBe(0);
    expect(p.activeSlot).toBe(0);
    expect(getView(state).players[0].activeGloveId).toBe("frost");

    hold(state, {}, 20);
    expect(Math.hypot(p.x - landed.x, p.z - landed.z)).toBeLessThan(0.05);
  });

  it("回程后空挥闸重新生效：按住扇击不出手", () => {
    const state = hubMatch({ gloveId: "frost", unlocked: "all" });
    const p = getPlayer(state, "p0");
    enterArena(state);
    hold(state, { slap: true }, 20);
    expect(state.stats.slaps).toBeGreaterThan(0);

    enterHub(state);
    const slapsBefore = state.stats.slaps;
    const seen = hold(state, { slap: true }, 60);

    expect(seen).not.toContain("slapStart");
    expect(seen).not.toContain("slap");
    expect(state.stats.slaps).toBe(slapsBefore);
    expect(p.attack.phase).toBe("idle");
  });

  it("回程后换掌还是主副交换、无收掌锁", () => {
    const state = hubMatch({ gloveId: "frost", offhandId: "magnet", unlocked: "all" });
    const p = getPlayer(state, "p0");
    enterArena(state);
    step(state, { p0: input({ switchGlove: true }) }, DT);
    enterHub(state);

    // 回程不清按键记忆：一直按着的那次不会在走道上再触发一遍
    step(state, { p0: input({ switchGlove: true }) }, DT);
    expect(p.gloveId).toBe("frost");

    step(state, { p0: input() }, DT);
    step(state, { p0: input({ switchGlove: true }) }, DT);
    expect(p.gloveId).toBe("magnet");
    expect(p.offhandId).toBe("frost");
    expect(p.activeSlot).toBe(0);
    expect(p.switchLockT).toBe(0);
    expect(state.hub.mainGloveId).toBe("magnet");
    expect(state.hub.offGloveId).toBe("frost");
  });

  it("sim 不合并壳层两条入口：回程带着掌，重开一局的 hub 才是空手", () => {
    const returned = hubMatch({ gloveId: "frost", unlocked: "all" });
    enterArena(returned);
    enterHub(returned);
    expect(returned.hub.mainGloveId).toBe("frost");
    expect(getView(returned).hub.portalReady).toBe(true);

    // 壳层「回安全区换掌」= 重开一局且不预填主副掌（core/entry.js ENTRY.HUB）
    const restarted = hubMatch({ unlocked: "all" });
    expect(restarted.phase).toBe("hub");
    expect(restarted.hub.mainGloveId).toBe(null);
    expect(restarted.hub.offGloveId).toBe(null);
    expect(getView(restarted).hub.portalReady).toBe(false);
    // 掌位空的只是「挑过没有」，玩家身上始终是有效掌，战斗层不接受空掌
    expect(getPlayer(restarted, "p0").gloveId).toBe("cotton");
  });
});

describe("空挥闸是 playerInHub 空间闸", () => {
  it("phase=hub 但站在裂岛坐标上：照常出手，且不吃安全区地板", () => {
    const state = hubMatch({ gloveId: "frost", unlocked: "all" });
    const p = getPlayer(state, "p0");
    p.x = 0;
    p.y = 0;
    p.z = 0; // 裂岛圆心

    expect(state.phase).toBe("hub");
    expect(playerInHub(state, p)).toBe(false);
    expect(hold(state, { slap: true }, 30)).toContain("slapStart");
    expect(state.stats.slaps).toBeGreaterThan(0);
  });

  it("phase=arena 时走道体积不再护人：闸门跟着 phase ∧ 体积一起走", () => {
    const state = hubMatch({ gloveId: "frost", unlocked: "all" });
    const p = getPlayer(state, "p0");
    const home = { x: p.x, y: p.y, z: p.z };
    expect(playerInHub(state, p)).toBe(true);

    state.phase = "arena";
    p.x = home.x;
    p.y = home.y;
    p.z = home.z;
    expect(playerInHub(state, p)).toBe(false);
    expect(hold(state, { slap: true }, 30)).toContain("slapStart");
  });
});
