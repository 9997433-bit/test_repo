// 触控层。Fable-2 合同（docs/ART_DIRECTION.md §11.4）：
//   .yz-touch > .yz-stick-zone > .yz-stick > .yz-stick-nub
//              > .yz-cluster   > .yz-tbtn.yz-tbtn--slap/--skill/--switch/--dash/--jump
// 尺寸由 touch.css 保证：扇击 88px（竖屏 76px，都 ≥72dp），其余 48dp，
// 全部锚在 env(safe-area-inset-*) 上。摇杆走 --x/--y（落点）与 --sx/--sy（推杆）。
// 所有 pointer 事件都 preventDefault：iOS 的边缘返回、下拉刷新、双指缩放不许抢手势。
//
// 安全区多一枚「选」确认钮 .yz-hub-confirm：它是 .yz-touch 的直接子节点，
// **不**进 .yz-cluster 的 grid-template-areas —— 塞进去会挤乱 F2 的栅格布点。
// 显隐靠 .yz-touch[data-phase="hub"]（见 ui/hub.css），大厅里同时收起扇/技/换三钮。
//
// 右上另有一枚「视」切视角钮 .yz-tbtn--look（V 的触屏等价物），同样是 .yz-touch
// 的直接子节点：它是相机/系统键不是战斗键，贴在 HUD 暂停钮左侧而不进右下簇。

import { h, bindHoldButton, capturePointer } from "./dom.js";

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
      capturePointer(zone, e.pointerId);
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

  const btnInteract = actionButton("interact", "选", "interact", false);
  btnInteract.classList.add("yz-hub-confirm");

  // 视角切换钮：V 的触屏等价物。**不走 setTouchButton**——它不是发给 sim 的动作，
  // 直连 input.toggleLookMode()（与 V 键同一条路径、同一道 enabled 闸：暂停 / 结算 /
  // 失焦时输入层自己不切，UI 不再拦第二道）。切换回执只有 HUD 那枚 0.9s 的
  // .yz-look-flash（onLookModeChange → shell.setLookMode 既有链路），本钮不加提示；
  // 音效也跟「真的切了」走 —— 闸把这一下吞了就不响，免得听着像切了其实没切。
  const btnLook = h(
    "button",
    { class: "yz-tbtn yz-tbtn--look", type: "button", "aria-label": "切换视角" },
    [h("span", { text: "视" })]
  );
  bindHoldButton(
    btnLook,
    () => {
      btnLook.classList.add("is-pressed");
      const before = input.getLookMode ? input.getLookMode() : null;
      const after = input.toggleLookMode();
      if (audio && after !== before) audio.play("uiMove");
    },
    () => {
      btnLook.classList.remove("is-pressed");
    }
  );

  const cluster = h("div", { class: "yz-cluster" }, [btnJump, btnSkill, btnDash, btnSwitch, btnSlap]);
  const el = h("div", { class: "yz-touch", dataset: { phase: "arena" } }, [zone, cluster, btnInteract, btnLook]);

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
    buttons: {
      slap: btnSlap,
      skill: btnSkill,
      switchGlove: btnSwitch,
      dash: btnDash,
      jump: btnJump,
      interact: btnInteract,
      look: btnLook,
    },
    /** @param {'hub'|'arena'} phase */
    setPhase(phase) {
      const next = phase === "hub" ? "hub" : "arena";
      if (el.dataset.phase === next) return next;
      el.dataset.phase = next;
      // 收起的钮如果正被按住，抬起事件就再也收不到了：切区时主动松开
      for (const [name, node] of Object.entries({ slap: btnSlap, skill: btnSkill, switchGlove: btnSwitch, interact: btnInteract })) {
        if (!node.dataset.pressed) continue;
        delete node.dataset.pressed;
        node.classList.remove("is-pressed");
        input.setTouchButton(name, false);
      }
      return next;
    },
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
