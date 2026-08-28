// @vitest-environment jsdom
//
// 里程碑进度钩子（P2-F2 任务 4）：进度数（如「237/300」）在 main 的 tracker /
// 存档手里，挑战推导在 core/hub-flow —— 都不归 UI。UI 只留口：createHubUi /
// createShell 接一个可缺席的 `unlockProgressOf(glove, view)`，返回非空串就
// 缀到锁定说明牌的解锁条件后面；不给、给空串、抛错，一律回到原样。

import { beforeEach, describe, expect, it } from "vitest";

import { createHubUi } from "./hub.js";

const GLOVE_BY_ID = {
  granite: { id: "granite", name: "磐石", unlock: "unlock_granite" },
  cotton: { id: "cotton", name: "木棉", unlock: "default" },
};

function hubView(ped) {
  return {
    phase: "hub",
    hub: {
      pedestals: [ped],
      focusGloveId: ped.gloveId,
      mainGloveId: null,
      offGloveId: null,
      portalReady: false,
      portalNear: false,
    },
  };
}

function lockedPed() {
  return {
    gloveId: "granite",
    unlocked: false,
    slot: null,
    focused: true,
    name: "磐石",
    role: "重击",
    desc: "",
  };
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("createHubUi · unlockProgressOf 钩子", () => {
  it("给了钩子：锁定提示后缀进度「237/300」", () => {
    const hub = createHubUi({
      gloveById: GLOVE_BY_ID,
      unlockTextOf: () => "单局内命中 15 次扇击",
      unlockProgressOf: (glove) => (glove.id === "granite" ? "237/300" : ""),
    });
    document.body.appendChild(hub.el);
    hub.update(hubView(lockedPed()));
    expect(hub.el.querySelector(".yz-inspect-cta-text").textContent).toBe(
      "单局内命中 15 次扇击 · 237/300"
    );
    expect(hub.el.querySelector(".yz-inspect").classList.contains("is-locked")).toBe(true);
  });

  it("不给钩子：一切照旧，只写解锁条件", () => {
    const hub = createHubUi({
      gloveById: GLOVE_BY_ID,
      unlockTextOf: () => "单局内命中 15 次扇击",
    });
    document.body.appendChild(hub.el);
    hub.update(hubView(lockedPed()));
    expect(hub.el.querySelector(".yz-inspect-cta-text").textContent).toBe("单局内命中 15 次扇击");
  });

  it("钩子返回空串 / 抛错：静默回退，不缀「 · 」尾巴也不炸帧", () => {
    const quiet = createHubUi({
      gloveById: GLOVE_BY_ID,
      unlockTextOf: () => "单局内命中 15 次扇击",
      unlockProgressOf: () => "",
    });
    document.body.appendChild(quiet.el);
    quiet.update(hubView(lockedPed()));
    expect(quiet.el.querySelector(".yz-inspect-cta-text").textContent).toBe("单局内命中 15 次扇击");

    const throwy = createHubUi({
      gloveById: GLOVE_BY_ID,
      unlockTextOf: () => "单局内命中 15 次扇击",
      unlockProgressOf: () => {
        throw new Error("进度表还没接");
      },
    });
    document.body.appendChild(throwy.el);
    expect(() => throwy.update(hubView(lockedPed()))).not.toThrow();
    expect(throwy.el.querySelector(".yz-inspect-cta-text").textContent).toBe("单局内命中 15 次扇击");
  });

  it("已解锁的台座不缀进度：CTA 写装备意图，进度只属于锁定态", () => {
    const hub = createHubUi({
      gloveById: GLOVE_BY_ID,
      unlockTextOf: () => "初始携带",
      unlockProgressOf: () => "237/300",
    });
    document.body.appendChild(hub.el);
    hub.update(
      hubView({ gloveId: "cotton", unlocked: true, slot: null, focused: true, name: "木棉" })
    );
    const cta = hub.el.querySelector(".yz-inspect-cta-text").textContent;
    expect(cta).not.toContain("237/300");
    expect(cta).toBe("装 为 主 掌");
  });
});
