/**
 * 蚀核要塞 输入层 —— 唯一签名（Round 2 收敛，不再有第二种调用形态）。
 *
 *   createInput({ canvas, scene, pickSocket }) -> input
 *   input.read() -> { place?, overclockSocket?, selectedSocket?, pause?, towerId? }
 *
 * 参数只认一个选项对象；位置参数会抛 TypeError，好让误用当场暴露而不是静默半瘫。
 *   canvas     必给才有指针交互；缺席时键盘仍可用。
 *   scene      Babylon 场景，用来发射线。
 *   pickSocket world 的 `pickSocket(scene, pickInfo)`，返回插座号或 null。
 *   getView    可选：读当前 view 判断插座是否已有塔（有塔就只选中，不发注定被拒的建造）。
 *   doc / win  可选：测试注入。
 *
 * 键位：
 *   1..5      选塔 rail / prism / scatter / well / star（再按一次同一个键 = 解除武装）
 *   F         对当前选中插座过载
 *   Space     暂停 / 继续
 *   Esc       解除武装并取消选中
 *   点击插座   选中它；空插座且已武装则顺带下单建造
 *
 * 与 Babylon 相处的规矩：
 *   - 只在 canvas 上挂 passive 指针监听，不 preventDefault、不 stopPropagation，
 *     所以 ArcRotateCamera 的拖拽 / 滚轮照常工作；
 *   - 只有拖拽距离小于阈值才算「点」，避免转视角时误建造。
 *
 * read() 的语义（与 docs/API_CONTRACT.md §2.1 对齐）：
 *   pause / selectedSocket 是**绝对置位**，每帧都给（sim 每步都按 `!!cmd.pause` 取值，
 *   只在切换那一帧给 true 会导致下一帧立刻恢复运行）；
 *   place / overclockSocket 是沿边意图，读走即清空。
 *
 * 与 HUD 的联系走 DOM 事件，main.js 不需要额外接线：
 *   监听 'sh-ui'   （HUD 的点击：选塔 / 过载 / 暂停）
 *   派发 'sh-input'（选塔 / 暂停 / 选中插座 / 一句提示）
 */
import { TOWER_ORDER, towerIdByIndex } from "../ui/catalog.js";

const UI_EVENT = "sh-ui";
const INPUT_EVENT = "sh-input";

const TAP_MOVE_PX = 6;
const TAP_MS = 700;

const DIGIT_CODES = {
  Digit1: 0,
  Digit2: 1,
  Digit3: 2,
  Digit4: 3,
  Digit5: 4,
  Numpad1: 0,
  Numpad2: 1,
  Numpad3: 2,
  Numpad4: 3,
  Numpad5: 4,
};

function isOptionsBag(value) {
  return !!value && typeof value === "object" && typeof value.nodeType !== "number";
}

function isTypingTarget(node) {
  const tag = node?.tagName;
  if (!tag) return false;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable === true;
}

function canvasPoint(event, canvas) {
  if (Number.isFinite(event?.offsetX) && Number.isFinite(event?.offsetY)) {
    return { x: event.offsetX, y: event.offsetY };
  }
  const rect = canvas?.getBoundingClientRect?.();
  if (!rect) return { x: 0, y: 0 };
  return { x: (event?.clientX ?? 0) - rect.left, y: (event?.clientY ?? 0) - rect.top };
}

/**
 * @param {{canvas?: HTMLCanvasElement|null, scene?: object|null,
 *          pickSocket?: ((scene: object|null, pickInfo: object|null) => number|null)|null,
 *          getView?: (() => object)|null, towerId?: string|null,
 *          doc?: Document|null, win?: Window|null}} [options]
 */
export function createInput(...args) {
  const [options = {}] = args;
  if (args.length > 1 || !isOptionsBag(options)) {
    throw new TypeError("createInput 只接受一个选项对象：createInput({ canvas, scene, pickSocket })");
  }

  const canvas = options.canvas ?? null;
  const getView = typeof options.getView === "function" ? options.getView : null;
  const doc = options.doc ?? (typeof document !== "undefined" ? document : null);
  const win = options.win ?? (typeof window !== "undefined" ? window : null);

  let scene = options.scene ?? null;
  let pickSocket = typeof options.pickSocket === "function" ? options.pickSocket : null;

  const state = {
    towerId: TOWER_ORDER.includes(options.towerId) ? options.towerId : TOWER_ORDER[0],
    selectedSocket: null,
    paused: false,
    enabled: true,
  };

  /**
   * `scene.pick` 依赖 Babylon 的 Ray 副作用模块。没 import 过的话它不会报错，
   * 只会返回一个 ray 为空的 PickingInfo，插座就永远拾取不到。
   * 既然射线是本模块发起的，就由本模块负责把这个副作用拉进来（异步，不挡启动）。
   */
  let rayLoading = null;
  function ensurePickingRay() {
    if (rayLoading || !scene || typeof scene.pick !== "function") return;
    rayLoading = import("@babylonjs/core/Culling/ray.js").catch((err) => {
      console.warn("[shihe-yaosai] Ray 副作用模块加载失败，插座拾取可能不可用", err);
    });
  }

  /** 沿边意图，read() 取走即清空。 */
  const pending = { place: null, overclockSocket: null };

  const drag = { active: false, id: null, x0: 0, y0: 0, t0: 0, moved: false };

  const listeners = [];

  function on(target, type, handler, opts) {
    if (!target?.addEventListener) return;
    target.addEventListener(type, handler, opts);
    listeners.push([target, type, handler, opts]);
  }

  function emit(notice) {
    if (!doc?.dispatchEvent) return;
    doc.dispatchEvent(
      new CustomEvent(INPUT_EVENT, {
        detail: {
          towerId: state.towerId,
          selectedSocket: state.selectedSocket,
          paused: state.paused,
          ...(notice ? { notice } : null),
        },
      }),
    );
  }

  /* -------------------------------------------------------------- 意图 */

  /** `id === null` = 解除武装：之后点插座只选中、不建造。 */
  function selectTower(id, notify = true) {
    const next = id === null ? null : TOWER_ORDER.includes(id) ? id : undefined;
    if (next === undefined || state.towerId === next) return false;
    state.towerId = next;
    if (notify) emit();
    return true;
  }

  function selectSocket(index, notify = true) {
    const next = Number.isInteger(index) && index >= 0 ? index : null;
    if (state.selectedSocket === next) return false;
    state.selectedSocket = next;
    if (notify) emit();
    return true;
  }

  function requestPlace(socket, id = state.towerId) {
    if (!Number.isInteger(socket) || socket < 0 || !TOWER_ORDER.includes(id)) return false;
    pending.place = { socket, towerId: id };
    return true;
  }

  function requestOverclock(socket = state.selectedSocket) {
    if (!Number.isInteger(socket)) {
      emit({ text: "先选中一座塔再过载", kind: "warn" });
      return false;
    }
    pending.overclockSocket = socket;
    return true;
  }

  function setPaused(paused, notify = true) {
    const next = !!paused;
    if (state.paused === next) return state.paused;
    state.paused = next;
    if (notify) emit();
    return state.paused;
  }

  function togglePause() {
    return setPaused(!state.paused);
  }

  /* ------------------------------------------------------------ 键盘 */

  function digitIndex(event) {
    const byCode = DIGIT_CODES[event.code];
    if (byCode !== undefined) return byCode;
    if (typeof event.key === "string" && event.key.length === 1) {
      const n = Number(event.key);
      if (Number.isInteger(n) && n >= 1 && n <= TOWER_ORDER.length) return n - 1;
    }
    return undefined;
  }

  function onKeyDown(event) {
    if (!state.enabled || event.defaultPrevented) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (isTypingTarget(event.target)) return;

    const code = event.code;
    const key = typeof event.key === "string" ? event.key.toLowerCase() : "";

    const index = digitIndex(event);
    if (index !== undefined) {
      if (event.repeat) return;
      const id = towerIdByIndex(index);
      selectTower(state.towerId === id ? null : id);
      return;
    }

    if (code === "KeyF" || key === "f") {
      if (!event.repeat) requestOverclock();
      return;
    }

    if (code === "Space" || key === " " || key === "spacebar") {
      // 吞掉默认行为：既防止页面滚动，也防止焦点停在停靠栏按钮上时被空格「点击」。
      event.preventDefault();
      if (!event.repeat) togglePause();
      return;
    }

    if (code === "Escape" || key === "escape") {
      const changed = selectTower(null, false);
      if (!selectSocket(null) && changed) emit();
    }
  }

  /* ------------------------------------------------------------ 指针 */

  function pickAt(x, y) {
    if (!pickSocket) return null;
    let pickInfo = null;
    if (scene && typeof scene.pick === "function") {
      try {
        pickInfo = scene.pick(x, y);
      } catch {
        pickInfo = null;
      }
    }
    try {
      const index = pickSocket(scene, pickInfo);
      return Number.isInteger(index) && index >= 0 ? index : null;
    } catch {
      return null;
    }
  }

  /**
   * 点已经有塔的插座应该只是选中它（好接着过载），而不是发一条注定被拒的建造。
   * 拿不到 view 就照发，由模拟层去判 deny。
   */
  function socketOccupied(index) {
    if (!getView) return false;
    try {
      const sockets = getView()?.sockets;
      if (!Array.isArray(sockets)) return false;
      const socket = sockets.find((s) => s?.i === index) ?? sockets[index];
      return !!socket?.towerId;
    } catch {
      return false;
    }
  }

  function onPointerDown(event) {
    if (!state.enabled || event.button > 0) return;
    const p = canvasPoint(event, canvas);
    drag.active = true;
    drag.id = event.pointerId;
    drag.x0 = p.x;
    drag.y0 = p.y;
    drag.t0 = event.timeStamp || Date.now();
    drag.moved = false;
  }

  function onPointerMove(event) {
    if (!drag.active || event.pointerId !== drag.id) return;
    const p = canvasPoint(event, canvas);
    if (Math.abs(p.x - drag.x0) > TAP_MOVE_PX || Math.abs(p.y - drag.y0) > TAP_MOVE_PX) drag.moved = true;
  }

  function endDrag() {
    drag.active = false;
    drag.id = null;
  }

  function onPointerUp(event) {
    if (!drag.active || event.pointerId !== drag.id) return;
    const dt = (event.timeStamp || Date.now()) - drag.t0;
    const tap = !drag.moved && dt <= TAP_MS && (event.target === canvas || canvas?.contains?.(event.target));
    endDrag();
    if (!tap || !state.enabled) return;

    const p = canvasPoint(event, canvas);
    const socket = pickAt(p.x, p.y);
    if (socket === null) {
      selectSocket(null);
      return;
    }
    selectSocket(socket, false);
    if (state.towerId !== null && !socketOccupied(socket)) requestPlace(socket);
    emit();
  }

  /* ---------------------------------------------------------- HUD 回流 */

  function onUiEvent(event) {
    const detail = event?.detail;
    if (!detail || typeof detail !== "object") return;
    switch (detail.action) {
      case "tower":
        selectTower(detail.towerId ?? null, false);
        break;
      case "overclock":
        requestOverclock(Number.isInteger(detail.socket) ? detail.socket : state.selectedSocket);
        break;
      case "pause":
        togglePause();
        break;
      default:
        break;
    }
  }

  /* ------------------------------------------------------------ 装配 */

  on(win ?? doc, "keydown", onKeyDown);
  if (canvas) {
    on(canvas, "pointerdown", onPointerDown, { passive: true });
    on(canvas, "pointermove", onPointerMove, { passive: true });
    on(win ?? canvas, "pointerup", onPointerUp, { passive: true });
    on(win ?? canvas, "pointercancel", endDrag, { passive: true });
  }
  on(doc, UI_EVENT, onUiEvent);
  ensurePickingRay();

  /* ------------------------------------------------------------ 出口 */

  const input = {
    /**
     * 取走这一帧的输入。
     * pause / selectedSocket 是绝对置位，每帧都给；place / overclockSocket 读完即清空。
     * @returns {{place?: {socket: number, towerId: string}, overclockSocket?: number,
     *            selectedSocket?: number|null, pause?: boolean, towerId?: string}}
     */
    read() {
      const out = { selectedSocket: state.selectedSocket, pause: state.paused };
      if (state.towerId !== null) out.towerId = state.towerId;
      if (pending.place) {
        out.place = pending.place;
        pending.place = null;
      }
      if (pending.overclockSocket !== null) {
        out.overclockSocket = pending.overclockSocket;
        pending.overclockSocket = null;
      }
      return out;
    },

    /** 只看不取，给 HUD / main 显示用。 */
    peek() {
      return { towerId: state.towerId, selectedSocket: state.selectedSocket, paused: state.paused };
    },

    /** 引擎是异步起的，场景就绪后再补上射线拾取。 */
    setScene(nextScene, nextPickSocket) {
      scene = nextScene ?? null;
      if (typeof nextPickSocket === "function") pickSocket = nextPickSocket;
      ensurePickingRay();
      return input;
    },

    selectTower,
    selectSocket,
    requestPlace,
    requestOverclock,
    setPaused,
    togglePause,
    setEnabled(enabled) {
      state.enabled = !!enabled;
    },

    dispose() {
      for (const [target, type, handler, opts] of listeners) target.removeEventListener(type, handler, opts);
      listeners.length = 0;
      endDrag();
    },
  };

  return input;
}

export { TOWER_ORDER, INPUT_EVENT, UI_EVENT };
