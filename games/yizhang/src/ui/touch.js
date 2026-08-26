// 触控层。Fable-2 合同（docs/ART_DIRECTION.md §11.4）：
//   .yz-touch > .yz-stick-zone > .yz-stick > .yz-stick-nub
//              > .yz-cluster   > .yz-tbtn.yz-tbtn--slap/--skill/--switch/--dash/--jump
// 尺寸由 touch.css 保证：扇击 88px（竖屏 76px，都 ≥72dp），其余 48dp，
// 全部锚在 env(safe-area-inset-*) 上。摇杆走 --x/--y（落点）与 --sx/--sy（推杆）。
// 所有 pointer 事件都 preventDefault：iOS 的边缘返回、下拉刷新、双指缩放不许抢手势。

import { h, bindHoldButton } from "./dom.js";

const STICK_RADIUS = 52; // .yz-stick 半径 60px 减去杆帽余量

// 暂停钮在 HUD 顶带的 .yz-btn-pause，触控层不再另开一个，右上角不放两个按钮。
export function createTouchLayer({ input, audio }) {
  const nub = h("i", { class: "yz-stick-nub" });
  const stick = h("div", { class: "yz-stick" }, [nub]);
  const zone = h("div", { class: "yz-stick-zone" }, [stick]);

  let stickId = null;
  let originX = 0;
  let originY = 0;

  function resetStick() {
    stickId = null;
    stick.classList.remove("is-active");
    nub.style.setProperty("--sx", "0px");
    nub.style.setProperty("--sy", "0px");
    input.setStick(0, 0);
  }

  zone.addEventListener(
    "pointerdown",
    (e) => {
      if (stickId !== null) return;
      e.preventDefault();
      stickId = e.pointerId;
      zone.setPointerCapture?.(e.pointerId);
      const rect = zone.getBoundingClientRect();
      originX = e.clientX - rect.left;
      originY = e.clientY - rect.top;
      // 摸哪杆在哪：底盘落在触点上
      stick.style.setProperty("--x", `${originX}px`);
      stick.style.setProperty("--y", `${originY}px`);
      stick.classList.add("is-active");
      input.setStick(0, 0);
    },
    { passive: false }
  );

  zone.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerId !== stickId) return;
      e.preventDefault();
      const rect = zone.getBoundingClientRect();
      let dx = e.clientX - rect.left - originX;
      let dy = e.clientY - rect.top - originY;
      const len = Math.hypot(dx, dy);
      if (len > STICK_RADIUS) {
        dx = (dx / len) * STICK_RADIUS;
        dy = (dy / len) * STICK_RADIUS;
      }
      nub.style.setProperty("--sx", `${dx.toFixed(1)}px`);
      nub.style.setProperty("--sy", `${dy.toFixed(1)}px`);
      input.setStick(dx / STICK_RADIUS, dy / STICK_RADIUS);
    },
    { passive: false }
  );

  const endStick = (e) => {
    if (e.pointerId !== stickId) return;
    e.preventDefault();
    resetStick();
  };
  zone.addEventListener("pointerup", endStick, { passive: false });
  zone.addEventListener("pointercancel", endStick, { passive: false });
  zone.addEventListener("lostpointercapture", resetStick);

  function actionButton(name, glyph, variant, withCooldown) {
    const cd = withCooldown ? h("i", { class: "yz-cd" }) : null;
    const el = h(
      "button",
      { class: `yz-tbtn yz-tbtn--${variant}`, type: "button", "aria-label": name },
      [cd, h("span", { text: glyph })]
    );
    el.cdNode = cd;
    bindHoldButton(
      el,
      () => {
        el.classList.add("is-pressed");
        input.setTouchButton(name, true);
        if (audio) audio.play("uiMove");
      },
      () => {
        el.classList.remove("is-pressed");
        input.setTouchButton(name, false);
      }
    );
    return el;
  }

  const btnSlap = actionButton("slap", "扇", "slap", true);
  const btnSkill = actionButton("skill", "技", "skill", true);
  const btnSwitch = actionButton("switchGlove", "换", "switch", true);
  const btnDash = actionButton("dash", "冲", "dash", true);
  const btnJump = actionButton("jump", "跳", "jump", false);

  const cluster = h("div", { class: "yz-cluster" }, [btnJump, btnSkill, btnDash, btnSwitch, btnSlap]);
  const el = h("div", { class: "yz-touch" }, [zone, cluster]);

  function applyCooldown(node, remaining, max, disabled) {
    const cd = Math.max(0, remaining || 0);
    node.disabled = !!disabled;
    node.classList.toggle("is-disabled", !!disabled);
    if (!node.cdNode) return;
    const span = max > 0.001 ? max : 1;
    node.cdNode.style.setProperty("--cd", Math.min(1, cd / span).toFixed(3));
  }

  return {
    el,
    reset: resetStick,
    buttons: { slap: btnSlap, skill: btnSkill, switchGlove: btnSwitch, dash: btnDash, jump: btnJump },
    setCooldowns(self, glove, maxes = {}) {
      if (!self) return;
      const noSkill = !glove || !glove.skillId || glove.skillId === "none";
      applyCooldown(btnSlap, self.slapCd, maxes.slap, false);
      applyCooldown(btnSkill, self.skillCd, maxes.skill, noSkill);
      applyCooldown(btnDash, self.dashCd, maxes.dash, false);
      applyCooldown(btnSwitch, self.switchLockT, maxes.switchLock || 0.4, false);
    },
  };
}
