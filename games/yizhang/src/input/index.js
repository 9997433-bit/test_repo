// 键鼠 + 触屏输入。契约：createInput(dom, canvas) / sample(cameraYaw) / setEnabled(bool)
//
// 三条纪律：
// 1. 没有锁敌、没有自动瞄准，转向永远来自玩家的鼠标或右侧拖拽。
// 2. 动作分「按住型」和「边沿型」：扇击/技能按住可连发（由冷却兜底），
//    跳/冲/换掌是边沿触发，按住不会每 0.4 秒自己切一次掌。
// 3. 触屏区域在画布上 preventDefault，避免 iOS 边缘返回、下拉刷新、双指缩放抢走手势。

const KEY_MOVE = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};

const LOOK_SCALE = 0.0026;
const TOUCH_LOOK_SCALE = 0.0055;
const PITCH_LIMIT = Math.PI / 2.6;
const STICK_DEADZONE = 0.16;

let current = null;

function emptyInput() {
  return {
    moveX: 0,
    moveZ: 0,
    yaw: 0,
    slap: false,
    skill: false,
    switchGlove: false,
    dash: false,
    jump: false,
  };
}

export function createInput(dom, canvas, opts = {}) {
  const doc = dom || document;
  const target = canvas || doc.getElementById("gl");

  const state = {
    enabled: true,
    yaw: opts.yaw ?? -Math.PI / 2,
    pitch: opts.pitch ?? 0.32,
    sensitivity: opts.sensitivity ?? 1,
    invertY: !!opts.invertY,
    pointerLockWanted: opts.pointerLock !== false,
    keys: new Set(),
    hold: { slap: false, skill: false },
    edge: { jump: false, dash: false, switchGlove: false, slap: false, skill: false },
    stick: { x: 0, z: 0, active: false },
    touchButtons: new Set(),
    lookTouchId: null,
    lookLast: { x: 0, y: 0 },
    dragging: false,
    lastSource: "keyboard",
  };

  const listeners = [];
  const onPause = opts.onPause || null;
  const onFirstGesture = opts.onFirstGesture || null;
  let gestureFired = false;

  function bind(node, type, fn, options) {
    node.addEventListener(type, fn, options);
    listeners.push(() => node.removeEventListener(type, fn, options));
  }

  function fireGesture() {
    if (gestureFired) return;
    gestureFired = true;
    if (onFirstGesture) onFirstGesture();
  }

  function pressEdge(name) {
    state.edge[name] = true;
  }

  function onKeyDown(e) {
    fireGesture();
    if (e.code === "Escape") {
      if (onPause) onPause();
      return;
    }
    if (!state.enabled) return;
    if (e.repeat) {
      if (KEY_MOVE[e.code]) e.preventDefault();
      return;
    }
    state.lastSource = "keyboard";
    if (KEY_MOVE[e.code] || e.code === "Space") e.preventDefault();
    state.keys.add(e.code);
    switch (e.code) {
      case "Space":
        pressEdge("jump");
        break;
      case "ShiftLeft":
      case "ShiftRight":
        pressEdge("dash");
        break;
      case "KeyQ":
        pressEdge("switchGlove");
        break;
      case "KeyE":
        state.hold.skill = true;
        pressEdge("skill");
        break;
      case "KeyF":
        state.hold.slap = true;
        pressEdge("slap");
        break;
      default:
        break;
    }
  }

  function onKeyUp(e) {
    state.keys.delete(e.code);
    if (e.code === "KeyE") state.hold.skill = false;
    if (e.code === "KeyF") state.hold.slap = false;
  }

  function clearKeys() {
    state.keys.clear();
    state.hold.slap = false;
    state.hold.skill = false;
    state.dragging = false;
    state.lookTouchId = null;
    state.stick.x = 0;
    state.stick.z = 0;
    state.stick.active = false;
    state.touchButtons.clear();
  }

  function locked() {
    return doc.pointerLockElement === target;
  }

  function onMouseDown(e) {
    fireGesture();
    if (!state.enabled) return;
    state.lastSource = "mouse";
    if (e.button === 0) {
      state.hold.slap = true;
      pressEdge("slap");
      if (state.pointerLockWanted && !locked() && target && target.requestPointerLock) {
        const req = target.requestPointerLock();
        if (req && typeof req.catch === "function") req.catch(() => {});
      } else {
        state.dragging = true;
      }
    } else if (e.button === 2) {
      state.dragging = true;
    }
  }

  function onMouseUp(e) {
    if (e.button === 0) state.hold.slap = false;
    if (e.button === 0 || e.button === 2) state.dragging = false;
  }

  function applyLook(dx, dy, scale) {
    state.yaw += dx * scale * state.sensitivity;
    const dir = state.invertY ? -1 : 1;
    state.pitch = Math.max(
      -PITCH_LIMIT,
      Math.min(PITCH_LIMIT, state.pitch + dy * scale * state.sensitivity * dir * 0.7)
    );
  }

  function onMouseMove(e) {
    if (!state.enabled) return;
    if (locked()) {
      applyLook(e.movementX || 0, e.movementY || 0, LOOK_SCALE);
    } else if (state.dragging) {
      applyLook(e.movementX || 0, e.movementY || 0, LOOK_SCALE);
    }
  }

  function onContextMenu(e) {
    e.preventDefault();
  }

  function onTouchStart(e) {
    fireGesture();
    if (!state.enabled) return;
    state.lastSource = "touch";
    // 画布上的触摸只用来转视角；一律吃掉默认行为，防止系统边缘手势/下拉刷新介入。
    e.preventDefault();
    if (state.lookTouchId === null && e.changedTouches.length) {
      const t = e.changedTouches[0];
      state.lookTouchId = t.identifier;
      state.lookLast.x = t.clientX;
      state.lookLast.y = t.clientY;
    }
  }

  function onTouchMove(e) {
    if (!state.enabled) return;
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier !== state.lookTouchId) continue;
      applyLook(t.clientX - state.lookLast.x, t.clientY - state.lookLast.y, TOUCH_LOOK_SCALE);
      state.lookLast.x = t.clientX;
      state.lookLast.y = t.clientY;
    }
  }

  function onTouchEnd(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === state.lookTouchId) state.lookTouchId = null;
    }
  }

  function onGesture(e) {
    e.preventDefault();
  }

  if (target) {
    bind(target, "mousedown", onMouseDown);
    bind(target, "contextmenu", onContextMenu);
    bind(target, "touchstart", onTouchStart, { passive: false });
    bind(target, "touchmove", onTouchMove, { passive: false });
    bind(target, "touchend", onTouchEnd, { passive: false });
    bind(target, "touchcancel", onTouchEnd, { passive: false });
  }
  bind(window, "keydown", onKeyDown);
  bind(window, "keyup", onKeyUp);
  bind(window, "mouseup", onMouseUp);
  bind(window, "mousemove", onMouseMove);
  bind(window, "blur", clearKeys);
  bind(doc, "visibilitychange", () => {
    if (doc.hidden) clearKeys();
  });
  // Safari 的双指缩放走 gesture* 事件，touch-action 拦不住。
  bind(doc, "gesturestart", onGesture, { passive: false });
  bind(doc, "gesturechange", onGesture, { passive: false });
  bind(doc, "gestureend", onGesture, { passive: false });

  const api = {
    /** 摇杆归一化输入，由 UI 触控层推进来。x 右为正，z 前为负（与 WASD 一致）。 */
    setStick(x, z) {
      const mag = Math.hypot(x, z);
      if (mag < STICK_DEADZONE) {
        state.stick.x = 0;
        state.stick.z = 0;
        state.stick.active = false;
        return;
      }
      const k = Math.min(1, (mag - STICK_DEADZONE) / (1 - STICK_DEADZONE)) / mag;
      state.stick.x = x * k;
      state.stick.z = z * k;
      state.stick.active = true;
      state.lastSource = "touch";
    },
    /** 触控按钮：down=true 时按住型置位并补一次边沿。 */
    setTouchButton(name, down) {
      state.lastSource = "touch";
      if (down) {
        fireGesture();
        state.touchButtons.add(name);
        if (name === "slap" || name === "skill") state.hold[name] = true;
        pressEdge(name);
      } else {
        state.touchButtons.delete(name);
        if (name === "slap" || name === "skill") state.hold[name] = false;
      }
    },
    /** 采样一帧输入。cameraYaw 缺省时用输入层自己维护的偏航。 */
    sample(cameraYaw) {
      const out = emptyInput();
      const yaw = typeof cameraYaw === "number" ? cameraYaw : state.yaw;
      out.yaw = yaw;
      if (!state.enabled) {
        state.edge.jump = false;
        state.edge.dash = false;
        state.edge.switchGlove = false;
        state.edge.slap = false;
        state.edge.skill = false;
        return out;
      }

      let ix = 0;
      let iz = 0;
      for (const code of state.keys) {
        const v = KEY_MOVE[code];
        if (v) {
          ix += v[0];
          iz += v[1];
        }
      }
      if (state.stick.active) {
        ix += state.stick.x;
        iz += state.stick.z;
      }
      const mag = Math.hypot(ix, iz);
      if (mag > 1) {
        ix /= mag;
        iz /= mag;
      }

      // 相机相对 → 世界坐标：forward = (cos yaw, sin yaw)，right 是它在 xz 平面顺时针 90°。
      const fx = Math.cos(yaw);
      const fz = Math.sin(yaw);
      out.moveX = -fx * iz - fz * ix;
      out.moveZ = -fz * iz + fx * ix;

      out.slap = state.hold.slap || state.edge.slap;
      out.skill = state.hold.skill || state.edge.skill;
      out.jump = state.edge.jump;
      out.dash = state.edge.dash;
      out.switchGlove = state.edge.switchGlove;

      state.edge.jump = false;
      state.edge.dash = false;
      state.edge.switchGlove = false;
      state.edge.slap = false;
      state.edge.skill = false;
      return out;
    },
    setEnabled(next) {
      state.enabled = !!next;
      if (!state.enabled) clearKeys();
    },
    isEnabled: () => state.enabled,
    getLook: () => ({ yaw: state.yaw, pitch: state.pitch }),
    setLook(yaw, pitch) {
      if (typeof yaw === "number") state.yaw = yaw;
      if (typeof pitch === "number") state.pitch = pitch;
    },
    setSensitivity(v) {
      state.sensitivity = Math.max(0.2, Math.min(3, v));
    },
    setInvertY(v) {
      state.invertY = !!v;
    },
    setPointerLock(v) {
      state.pointerLockWanted = !!v;
      if (!v && doc.exitPointerLock && locked()) doc.exitPointerLock();
    },
    wantsPointerLock: () => state.pointerLockWanted,
    isPointerLocked: locked,
    releasePointerLock() {
      if (doc.exitPointerLock && locked()) doc.exitPointerLock();
    },
    lastSource: () => state.lastSource,
    dispose() {
      for (const off of listeners.splice(0)) off();
      if (current === api) current = null;
    },
  };

  current = api;
  return api;
}

export function sample(cameraYaw) {
  return current ? current.sample(cameraYaw) : emptyInput();
}

export function setEnabled(next) {
  if (current) current.setEnabled(next);
}

export function getInput() {
  return current;
}
