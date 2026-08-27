// 键鼠 + 触屏输入。契约：createInput(dom, canvas) / sample(cameraYaw) / setEnabled(bool)
//
// 三条纪律：
// 1. 没有锁敌、没有自动瞄准，转向永远来自玩家的鼠标或右侧拖拽。
// 2. 动作分「按住型」和「边沿型」：扇击/技能按住可连发（由冷却兜底），
//    跳/冲/换掌是边沿触发，按住不会每 0.4 秒自己切一次掌。
// 3. 触屏区域在画布上 preventDefault，避免 iOS 边缘返回、下拉刷新、双指缩放抢走手势。
//
// 两个角度空间不要混：本模块内部维护的是**相机方位角**（forward = (cos, sin)），
// sample() 返回给 sim 的 `yaw` 已经换算成 **sim 约定**（yaw=0 面向 -Z）。
// 位移向量 moveX/moveZ 一律是世界系，sim 的 readMoveVector 默认就这么读。
//
// 阶段（phase）：安全区与裂岛共用这一套采样，只有两处差别 ——
// hub 里 E / 触控「选」输出 `interact`（sim 自己做边沿），且扇击与技能一律不输出，
// 免得在安全区里对着展掌开技能。切到 arena 后 E 回到技能位，interact 仍照发（sim 会忽略）。

import { cameraYawToSimYaw } from "../core/view.js";

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

/**
 * 相机相对输入 → 世界位移。**WASD、方向键、触屏摇杆共用这一处换算**，
 * 不存在第二套映射（朝向换算本身只有 core/view.js 的 cameraYawToSimYaw 一处）。
 *
 * 入参用的是「相机方位角」：水平前向 forward = (cos yaw, sin yaw)。
 * 屏幕右手边 right = cross(forward, up) = (-sin yaw, cos yaw)。
 * ix 右为正、iz 前为负（与 KEY_MOVE 同号），于是
 *   world = forward * (-iz) + right * ix
 * 即 W（iz=-1）沿相机水平前向走向屏幕深处，D（ix=1）走屏幕右侧。
 *
 * @returns {{x:number, z:number}} 世界系位移方向
 */
export function moveFromCameraYaw(ix, iz, cameraYaw) {
  const fx = Math.cos(cameraYaw);
  const fz = Math.sin(cameraYaw);
  return { x: -fx * iz - fz * ix, z: -fz * iz + fx * ix };
}

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
    // 安全区可选键。sim 的 ZERO_INPUT 故意没并进它们（Bot 的键集断言以 ZERO_INPUT 为准），
    // 但 step 里的 readInput 是展开合并，多带两个字段不会打乱 Bot。
    interact: false,
    interactSlot: null,
  };
}

export function createInput(dom, canvas, opts = {}) {
  const doc = dom || document;
  const target = canvas || doc.getElementById("gl");

  const state = {
    enabled: true,
    phase: opts.phase === "hub" ? "hub" : "arena",
    yaw: opts.yaw ?? -Math.PI / 2,
    pitch: opts.pitch ?? 0.32,
    sensitivity: opts.sensitivity ?? 1,
    invertY: !!opts.invertY,
    pointerLockWanted: opts.pointerLock !== false,
    keys: new Set(),
    hold: { slap: false, skill: false, interact: false },
    edge: { jump: false, dash: false, switchGlove: false, slap: false, skill: false, interact: false },
    interactSlot: null,
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
      // E 一键两用：裂岛是主动技，安全区是「选/确认」。两边都置位，
      // 由 sample() 按当前 phase 决定往外发哪一个，键位表里不必写两行。
      case "KeyE":
        state.hold.skill = true;
        state.hold.interact = true;
        pressEdge("skill");
        pressEdge("interact");
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
    if (e.code === "KeyE") {
      state.hold.skill = false;
      state.hold.interact = false;
    }
    if (e.code === "KeyF") state.hold.slap = false;
  }

  function clearKeys() {
    state.keys.clear();
    state.hold.slap = false;
    state.hold.skill = false;
    state.hold.interact = false;
    state.interactSlot = null;
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
    /**
     * 触控按钮：down=true 时按住型置位并补一次边沿。
     * @param {string} name slap | skill | switchGlove | dash | jump | interact
     * @param {boolean} down
     * @param {{slot?: 'main'|'off'}} [opts] 只有 interact 认：直接指定要装的槽位
     */
    setTouchButton(name, down, opts = {}) {
      state.lastSource = "touch";
      if (down) {
        fireGesture();
        state.touchButtons.add(name);
        if (name === "slap" || name === "skill" || name === "interact") state.hold[name] = true;
        if (name === "interact" && (opts.slot === "main" || opts.slot === "off")) {
          state.interactSlot = opts.slot;
        }
        pressEdge(name);
      } else {
        state.touchButtons.delete(name);
        if (name === "slap" || name === "skill" || name === "interact") state.hold[name] = false;
      }
    },
    /** 采样一帧输入。cameraYaw 缺省时用输入层自己维护的偏航。 */
    sample(cameraYaw) {
      const out = emptyInput();
      const yaw = typeof cameraYaw === "number" ? cameraYaw : state.yaw;
      out.yaw = cameraYawToSimYaw(yaw);
      if (!state.enabled) {
        state.edge.jump = false;
        state.edge.dash = false;
        state.edge.switchGlove = false;
        state.edge.slap = false;
        state.edge.skill = false;
        state.edge.interact = false;
        state.interactSlot = null;
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

      const move = moveFromCameraYaw(ix, iz, yaw);
      out.moveX = move.x;
      out.moveZ = move.z;

      const inHub = state.phase === "hub";
      // 安全区不出招：E 归「选/确认」，左键只用来抓指针锁定。
      out.slap = inHub ? false : state.hold.slap || state.edge.slap;
      out.skill = inHub ? false : state.hold.skill || state.edge.skill;
      // interact 按「按住」发给 sim，边沿由 sim 的 p.prev.interact 判；
      // 补上 edge 是为了同一帧内按下又抬起的短点触不会漏。
      out.interact = state.hold.interact || state.edge.interact;
      out.interactSlot = out.interact ? state.interactSlot : null;
      out.jump = state.edge.jump;
      out.dash = state.edge.dash;
      out.switchGlove = state.edge.switchGlove;

      state.edge.jump = false;
      state.edge.dash = false;
      state.edge.switchGlove = false;
      state.edge.slap = false;
      state.edge.skill = false;
      state.edge.interact = false;
      if (!state.hold.interact) state.interactSlot = null;
      return out;
    },
    setEnabled(next) {
      state.enabled = !!next;
      if (!state.enabled) clearKeys();
    },
    isEnabled: () => state.enabled,
    /**
     * 当前所处空间。'hub' 时屏蔽扇击/技能，E 与触控「选」走 interact。
     * @param {'hub'|'arena'} next
     */
    setPhase(next) {
      const phase = next === "hub" ? "hub" : "arena";
      if (phase === state.phase) return state.phase;
      state.phase = phase;
      // 跨区时把按住态清干净：在大厅按着 E 走进传送门，不该在裂岛里立刻放技能
      state.hold.slap = false;
      state.hold.skill = false;
      state.hold.interact = false;
      state.edge.slap = false;
      state.edge.skill = false;
      state.edge.interact = false;
      state.interactSlot = null;
      return state.phase;
    },
    getPhase: () => state.phase,
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
