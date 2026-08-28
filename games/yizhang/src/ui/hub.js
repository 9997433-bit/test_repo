// 安全区大厅的壳层 HUD：走道说明牌 + 当前配装 + 传送门提示 + 门内过渡。
//
// 结构（挂在 #hud 里，与战斗 HUD 同层，靠 #hud[data-phase] 互斥显示）：
//   .yz-hub-hud
//     ├── .yz-plate.yz-hub-title        区名带「安 全 区 · 选 掌 走 道」
//     ├── .yz-plate.yz-inspect          靠近展掌时的名称 / 说明 / 确认提示
//     ├── .yz-plate.yz-loadout-strip    当前主 / 副掌
//     └── .yz-plate.yz-portal-hint      传送门提示（未选掌 / 已就绪 / 门前）
//   .yz-warp                            门内过渡淡场（挂在 root 上，盖住整屏）
//
// 这里不判断规则，只把 core/hub-flow.js 算好的模型贴上去。

import "./hub.css";
import { h } from "./dom.js";
import { hubHudModel } from "../core/hub-flow.js";

const WARP_HOLD_MS = 220;

// 里程碑进度钩子（P2-F2 留口）：进度数（如「237/300」）握在 main 的 tracker /
// 存档手里，挑战推导又在 core/hub-flow —— 两边都不归 UI 管。所以这里只收一个
// 可缺席的 `unlockProgressOf(glove, view)`：给了且返回非空串，就把它缀在锁定
// 提示后面（「单局内命中 15 次扇击 · 237/300」）；不给则一切照旧。
export function createHubUi({ gloveById = {}, unlockTextOf = null, unlockProgressOf = null } = {}) {
  // ---- 区名带 ----
  const title = h("div", { class: "yz-plate yz-hub-title" }, [
    h("span", { text: "安 全 区" }),
    h("small", { text: "走道两侧八座展掌 · 靠近查看" }),
  ]);

  // ---- 说明牌 ----
  const nameNode = h("span", { class: "yz-inspect-name", text: "—" });
  const roleNode = h("span", { class: "yz-inspect-role", text: "" });
  const descNode = h("p", { class: "yz-inspect-desc", text: "" });
  // 不能用 .yz-kbd：那是「键位提示章」，F2 在 [data-touch="1"] 下把它整类隐藏了
  // （hud.css §键位提示章）。这枚章在触屏上要写「选」，得有自己的类。
  const ctaKey = h("span", { class: "yz-inspect-key", text: "E" });
  const ctaText = h("span", { class: "yz-inspect-cta-text", text: "" });
  const slotTag = h("span", { class: "yz-inspect-slot", text: "" });
  const inspect = h("div", { class: "yz-plate yz-inspect" }, [
    h("div", { class: "yz-inspect-head" }, [nameNode, roleNode]),
    descNode,
    h("div", { class: "yz-inspect-cta" }, [ctaKey, ctaText, slotTag]),
  ]);

  // ---- 配装条 ----
  function loadoutSlot(label) {
    const name = h("b", { text: "未 选" });
    const el = h("span", { class: "yz-loadout-slot" }, [h("i", { text: label }), name]);
    return { el, name };
  }
  const slotMain = loadoutSlot("主");
  const slotOff = loadoutSlot("副");
  const strip = h("div", { class: "yz-plate yz-loadout-strip" }, [
    slotMain.el,
    h("i", { class: "yz-loadout-sep" }),
    slotOff.el,
  ]);

  // ---- 传送门提示 ----
  const portal = h("div", { class: "yz-plate yz-portal-hint", text: "" });

  const el = h("div", { class: "yz-hub-hud" }, [title, inspect, strip, portal]);

  // ---- 门内过渡 ----
  const warp = h("div", { class: "yz-warp" });
  let warpTimer = 0;

  let touch = false;
  let lastFocusId = null;

  return {
    el,
    warp,
    /** 触控时确认键显示成「选」而不是「E」。 */
    setTouch(on) {
      touch = !!on;
    },
    /**
     * 贴一帧。返回本帧模型，方便调用方顺手拿 focus 做音效。
     * @param {object} view adaptView 后的快照
     */
    update(view) {
      const model = hubHudModel(view, { gloveById, unlockTextOf, touch });
      if (!model.visible) {
        inspect.classList.remove("is-on");
        lastFocusId = null;
        return model;
      }

      const focus = model.focus;
      if (focus) {
        el.dataset.glove = focus.gloveId || "";
        nameNode.textContent = focus.name;
        roleNode.textContent = focus.role || "";
        descNode.textContent = focus.desc || "";
        ctaKey.textContent = touch ? "选" : "E";
        ctaKey.hidden = !focus.unlocked;
        let hint = focus.unlocked ? focus.intent.text : focus.hint;
        if (!focus.unlocked && typeof unlockProgressOf === "function") {
          let progress = "";
          try {
            progress = unlockProgressOf(gloveById[focus.gloveId] || { id: focus.gloveId }, view) || "";
          } catch {
            progress = "";
          }
          if (progress) hint = `${hint} · ${progress}`;
        }
        ctaText.textContent = hint;
        slotTag.textContent =
          focus.slot === "main" ? "· 当前主掌" : focus.slot === "off" ? "· 当前副掌" : "";
        inspect.classList.toggle("is-locked", !focus.unlocked);
        inspect.classList.add("is-on");
      } else {
        inspect.classList.remove("is-on");
      }
      lastFocusId = focus ? focus.gloveId : null;

      slotMain.name.textContent = model.loadout.mainName;
      slotOff.name.textContent = model.loadout.offName;
      slotMain.el.classList.toggle("is-empty", !model.loadout.mainId);
      slotOff.el.classList.toggle("is-empty", !model.loadout.offId);
      strip.dataset.glove = model.loadout.mainId || "";

      portal.textContent = model.portal.text;
      portal.classList.toggle("is-ready", model.portal.ready && !model.portal.near);
      portal.classList.toggle("is-near", model.portal.near);

      return model;
    },
    focusGloveId: () => lastFocusId,
    /** 门内短过渡：先快闪到暖金门光，再慢慢淡回画面。不加载条、不糊屏。 */
    playWarp(holdMs = WARP_HOLD_MS) {
      warp.classList.add("is-on");
      clearTimeout(warpTimer);
      warpTimer = setTimeout(() => warp.classList.remove("is-on"), Math.max(60, holdMs));
    },
    reset() {
      inspect.classList.remove("is-on", "is-locked");
      portal.classList.remove("is-ready", "is-near");
      portal.textContent = "";
      lastFocusId = null;
      clearTimeout(warpTimer);
      warp.classList.remove("is-on");
    },
  };
}
