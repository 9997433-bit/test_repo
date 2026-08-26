// 触控层。左半屏是动态原点摇杆，右下是材质化的动作钮；
// 扇击 72dp，其余 56dp，全部避开 safe-area。视角靠右侧空白拖拽（由 input 层直接监听画布）。

import { h, bindHoldButton } from "./dom.js";

const STICK_RADIUS = 58;

export function createTouchLayer({ input, onPause, audio }) {
  const knob = h("div", { class: "yz-stick-knob" });
  const stick = h("div", { class: "yz-stick" }, [knob]);
  const zone = h("div", { class: "yz-stickzone" }, [stick]);

  let stickId = null;
  let originX = 0;
  let originY = 0;

  function resetStick() {
    stickId = null;
    delete stick.dataset.on;
    knob.style.transform = "";
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
      stick.style.left = `${originX}px`;
      stick.style.top = `${originY}px`;
      stick.dataset.on = "1";
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
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
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

  function actionButton(name, glyph, keyHint, cls) {
    const cd = h("span", { class: "yz-tbtn-cd" });
    const el = h("button", { class: `yz-tbtn ${cls || ""}`, type: "button" }, [
      cd,
      h("b", { text: glyph }),
      h("small", { text: keyHint }),
    ]);
    el.cdNode = cd;
    if (name === "slap") el.dataset.slap = "1";
    bindHoldButton(
      el,
      () => {
        input.setTouchButton(name, true);
        if (audio) audio.play("uiMove");
      },
      () => input.setTouchButton(name, false)
    );
    return el;
  }

  const btnSlap = actionButton("slap", "扇", "SLAP");
  const btnSkill = actionButton("skill", "技", "E", "yz-pad-skill");
  const btnSwitch = actionButton("switchGlove", "换", "Q", "yz-pad-switch");
  const btnDash = actionButton("dash", "冲", "SHIFT", "yz-pad-dash");
  const btnJump = actionButton("jump", "跳", "SPACE", "yz-pad-jump");

  const pad = h("div", { class: "yz-pad" }, [btnSwitch, btnSkill, btnSlap, btnDash, btnJump]);

  const pauseBtn = h("button", { class: "yz-tpause", type: "button", text: "‖", "aria-label": "暂停" });
  pauseBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (onPause) onPause();
  });

  const el = h("div", { class: "yz-touch" }, [zone, pad, pauseBtn]);

  return {
    el,
    reset: resetStick,
    setCooldowns(self, glove, maxes = {}) {
      if (!self) return;
      const apply = (node, remaining, max, disabled) => {
        const cd = Math.max(0, remaining || 0);
        if (disabled) node.dataset.off = "1";
        else delete node.dataset.off;
        if (cd > 0.02) node.dataset.cool = "1";
        else delete node.dataset.cool;
        const span = max > 0.001 ? max : 1;
        node.cdNode.style.setProperty("--cd", String(Math.min(1, cd / span)));
        node.cdNode.style.setProperty("--cd-on", cd > 0.02 ? "1" : "0");
      };
      apply(btnSlap, self.slapCd, maxes.slap, false);
      apply(btnSkill, self.skillCd, maxes.skill, !!glove && glove.skillId === "none");
      apply(btnDash, self.dashCd, maxes.dash, false);
      apply(btnSwitch, self.switchLockT, maxes.switchLock || 0.4, false);
    },
  };
}
