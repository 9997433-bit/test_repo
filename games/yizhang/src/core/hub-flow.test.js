// 安全区大厅的壳层流程。两层验证：
//   1. core/hub-flow.js 的纯推导（文案 / 槽位 / 传送门语气）
//   2. 键盘 E → input.sample → sim.step → view.hub → HUD 模型 的整条链路
//      —— 靠近、装主、再装副、走进传送门后 phase 变 arena。
//
// vitest 跑 node 环境，所以第 2 层自备最小 DOM 替身（与 input/index.test.js 同一套）。

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GLOVES, GLOVE_BY_ID } from "../data/gloves.js";
import { createMatch, getPlayer, getView, step } from "../sim/index.js";
import { createInput } from "../input/index.js";
import { createUnlockChecker } from "./unlocks.js";
import { EQUIP_CTA, PORTAL_TEXT, equipIntent, hubHudModel, unlockedIdsFor } from "./hub-flow.js";

const CTX = { gloveById: GLOVE_BY_ID, unlockTextOf: (g) => (g ? `解锁 ${g.id}` : "局内挑战") };

function ped(gloveId, extra = {}) {
  return { gloveId, unlocked: true, slot: null, focused: true, ...extra };
}

describe("unlockedIdsFor", () => {
  const isUnlocked = createUnlockChecker(null, { gloves: GLOVES });

  it("只放行存档里有的掌 + 默认携带的掌", () => {
    const ids = unlockedIdsFor(GLOVES, isUnlocked, { unlocked: ["frost"] });
    expect(ids).toContain("cotton"); // unlock === 'default'
    expect(ids).toContain("frost");
    expect(ids).not.toContain("meteor");
  });

  it("空存档也至少给一只掌，不让八座台全灰", () => {
    const ids = unlockedIdsFor(GLOVES, () => false, {});
    expect(ids).toHaveLength(1);
    expect(GLOVE_BY_ID[ids[0]]).toBeTruthy();
  });
});

describe("equipIntent · 先主后副", () => {
  it("主掌空 → 装主掌", () => {
    expect(equipIntent(ped("frost"), { mainGloveId: null, offGloveId: null }).text).toBe(EQUIP_CTA.main);
  });

  it("已是主掌 → 不再提示可按（避免空按一下什么都没发生）", () => {
    const intent = equipIntent(ped("frost", { slot: "main" }), { mainGloveId: "frost", offGloveId: null });
    expect(intent.text).toBe(EQUIP_CTA.isMain);
    expect(intent.actionable).toBe(false);
  });

  it("主掌已满、副掌空 → 装副掌", () => {
    expect(equipIntent(ped("gale"), { mainGloveId: "frost", offGloveId: null }).text).toBe(EQUIP_CTA.off);
  });

  it("站在副掌那座上再按 → 提为主掌", () => {
    const intent = equipIntent(ped("gale", { slot: "off" }), { mainGloveId: "frost", offGloveId: "gale" });
    expect(intent.text).toBe(EQUIP_CTA.promote);
  });

  it("两格都满 → 换掉副掌", () => {
    expect(equipIntent(ped("meteor"), { mainGloveId: "frost", offGloveId: "gale" }).text).toBe(EQUIP_CTA.swapOff);
  });

  it("未解锁 → 不可确认", () => {
    const intent = equipIntent(ped("meteor", { unlocked: false }), { mainGloveId: null, offGloveId: null });
    expect(intent.actionable).toBe(false);
    expect(intent.text).toBe(EQUIP_CTA.locked);
  });
});

describe("hubHudModel", () => {
  it("裂岛里整块大厅 HUD 不显示", () => {
    expect(hubHudModel({ phase: "arena", hub: { pedestals: [] } }, CTX).visible).toBe(false);
  });

  it("没靠近任何台座时没有说明牌", () => {
    const model = hubHudModel(
      { phase: "hub", hub: { pedestals: [ped("frost", { focused: false })], focusGloveId: null } },
      CTX
    );
    expect(model.visible).toBe(true);
    expect(model.focus).toBe(null);
  });

  it("靠近时给名称 / 说明 / 确认键；触控写「选」，键鼠写「E」", () => {
    const hub = {
      focusGloveId: "frost",
      mainGloveId: null,
      offGloveId: null,
      pedestals: [ped("frost", { name: "冰霜掌", desc: "一掌下去先冻脚", role: "控场" })],
    };
    const keyboard = hubHudModel({ phase: "hub", hub }, CTX);
    expect(keyboard.focus.name).toBe("冰霜掌");
    expect(keyboard.focus.desc).toBe("一掌下去先冻脚");
    expect(keyboard.focus.role).toBe("控场");
    expect(keyboard.focus.hint).toBe(`E · ${EQUIP_CTA.main}`);

    const touch = hubHudModel({ phase: "hub", hub }, { ...CTX, touch: true });
    expect(touch.focus.hint).toBe(`选 · ${EQUIP_CTA.main}`);
  });

  it("未解锁的台座显示解锁条件，而不是「按 E」", () => {
    const hub = {
      focusGloveId: "meteor",
      mainGloveId: null,
      offGloveId: null,
      pedestals: [ped("meteor", { unlocked: false, unlock: "meteor_challenge" })],
    };
    expect(hubHudModel({ phase: "hub", hub }, CTX).focus.hint).toBe("解锁 meteor");
  });

  it("传送门三段语气：先选掌 → 已就绪 → 门前", () => {
    const base = { pedestals: [], focusGloveId: null, mainGloveId: null, offGloveId: null };
    const pick = hubHudModel({ phase: "hub", hub: { ...base, portalReady: false } }, CTX);
    expect(pick.portal.tone).toBe("pick");
    expect(pick.portal.text).toBe(PORTAL_TEXT.pick);

    const ready = hubHudModel({ phase: "hub", hub: { ...base, mainGloveId: "frost", portalReady: true } }, CTX);
    expect(ready.portal.tone).toBe("ready");

    const near = hubHudModel(
      { phase: "hub", hub: { ...base, mainGloveId: "frost", portalReady: true, portalNear: true } },
      CTX
    );
    expect(near.portal.tone).toBe("near");
    expect(near.portal.text).toBe(PORTAL_TEXT.near);
  });

  it("副掌没挑时明说「同主掌」，不假装玩家配了两只", () => {
    const hub = { pedestals: [], focusGloveId: null, mainGloveId: "frost", offGloveId: null, portalReady: true };
    const model = hubHudModel({ phase: "hub", hub }, CTX);
    expect(model.loadout.complete).toBe(false);
    expect(model.loadout.offName).toContain("同主掌");
  });
});

// ------------------------------------------------------------------ 整链

function fakeNode() {
  const handlers = new Map();
  return {
    addEventListener(type, fn) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      handlers.get(type)?.delete(fn);
    },
    emit(type, event = {}) {
      for (const fn of handlers.get(type) || []) fn({ preventDefault() {}, ...event });
    },
  };
}

describe("整链：键盘 E 在走道里选掌，再走进传送门", () => {
  let input;
  let state;

  beforeEach(() => {
    globalThis.window = fakeNode();
    const doc = fakeNode();
    doc.hidden = false;
    doc.pointerLockElement = null;
    input = createInput(doc, fakeNode(), { pointerLock: false, phase: "hub" });
    // 与 main.js 的 startMatch 同一套 opts：进大厅不预填主副掌
    state = createMatch({
      seed: 11,
      gloveId: null,
      offhandId: null,
      botCount: 0,
      phase: "hub",
      unlocked: ["cotton", "granite", "gale", "frost"],
    });
  });

  afterEach(() => {
    input.dispose();
    delete globalThis.window;
  });

  const self = () => getPlayer(state, "p0");
  const view = () => getView(state);
  const model = () => hubHudModel({ ...view(), hub: view().hub }, CTX);

  /** 直接把人挪到目标点，省掉几百帧走路；走道判定不看速度。 */
  function teleport(x, z) {
    const p = self();
    p.x = x;
    p.z = z;
    p.vx = 0;
    p.vz = 0;
  }

  function tick(frames = 1, keyDown = false) {
    for (let i = 0; i < frames; i++) {
      const sample = input.sample(0);
      step(state, { p0: sample }, 1 / 60);
      if (keyDown) continue;
    }
  }

  function tapInteract() {
    globalThis.window.emit("keydown", { code: "KeyE" });
    tick(1);
    globalThis.window.emit("keyup", { code: "KeyE" });
    tick(1);
  }

  it("开局就在安全区，传送门先拦人", () => {
    expect(state.phase).toBe("hub");
    const m = model();
    expect(m.visible).toBe(true);
    expect(m.loadout.mainId).toBe(null);
    expect(m.portal.tone).toBe("pick");
  });

  it("靠近台座出说明牌，按 E 装主掌，再按另一座装副掌", () => {
    const pedestals = view().hub.pedestals;
    const first = pedestals[0];
    const second = pedestals.find((p) => p.gloveId !== first.gloveId && p.unlocked);

    teleport(first.x + 1.0, first.z);
    tick(2);
    let m = model();
    expect(m.focus).not.toBe(null);
    expect(m.focus.gloveId).toBe(first.gloveId);
    expect(m.focus.intent.text).toBe(EQUIP_CTA.main);

    tapInteract();
    m = model();
    expect(m.loadout.mainId).toBe(first.gloveId);
    expect(m.portal.tone).toBe("ready");
    expect(m.focus.intent.text).toBe(EQUIP_CTA.isMain);

    teleport(second.x + 1.0, second.z);
    tick(2);
    expect(model().focus.intent.text).toBe(EQUIP_CTA.off);
    tapInteract();
    m = model();
    expect(m.loadout.offId).toBe(second.gloveId);
    expect(m.loadout.complete).toBe(true);
    // 掌真的穿到玩家身上了，不只是 HUD 上的字
    expect(self().gloveId).toBe(first.gloveId);
    expect(self().offhandId).toBe(second.gloveId);
  });

  it("未解锁的台座按 E 装不上，只报解锁条件", () => {
    const locked = view().hub.pedestals.find((p) => !p.unlocked);
    expect(locked).toBeTruthy();
    teleport(locked.x + 1.0, locked.z);
    tick(2);
    expect(model().focus.unlocked).toBe(false);

    globalThis.window.emit("keydown", { code: "KeyE" });
    const sample = input.sample(0);
    step(state, { p0: sample }, 1 / 60);
    globalThis.window.emit("keyup", { code: "KeyE" });
    expect(state.events.some((e) => e.type === "hubLocked")).toBe(true);
    expect(state.phase).toBe("hub");
    expect(view().hub.mainGloveId).toBe(null);
  });

  it("没选主掌时走进传送门不放行；选完再走进去就切到裂岛", () => {
    const portal = view().hub.portal;
    teleport(portal.x, portal.z);
    tick(3);
    expect(state.phase).toBe("hub");
    expect(model().portal.near).toBe(true);
    expect(model().portal.tone).toBe("pick");

    const first = view().hub.pedestals[0];
    teleport(first.x + 1.0, first.z);
    tick(2);
    tapInteract();
    expect(view().hub.mainGloveId).toBe(first.gloveId);

    teleport(portal.x, portal.z);
    tick(3);
    expect(state.phase).toBe("arena");
    // 传送后配装不丢，且对局计时从进岛那一刻重新起算
    expect(self().gloveId).toBe(first.gloveId);
    expect(view().match.secondsLeft).toBeGreaterThan(state.config.matchSeconds - 0.5);
    expect(hubHudModel(view(), CTX).visible).toBe(false);
  });

  it("进裂岛后 E 回到技能位，不再发选掌", () => {
    input.setPhase("arena");
    globalThis.window.emit("keydown", { code: "KeyE" });
    const sample = input.sample(0);
    expect(sample.skill).toBe(true);
    globalThis.window.emit("keyup", { code: "KeyE" });
  });
});
