import * as actions from "../core/actions.js";
import { grantGold, grantXp, tryLevelUp, persist } from "../core/state.js";

/**
 * 小游戏共用运行时：计时器登记、动作层转发、ctx 归一。
 *
 * 视图契约要求切页必须收干净副作用（MODULE_CONTRACT §2）。所有小游戏一律用
 * `createDisposer()` 申请 interval / timeout / rAF / 事件监听，dispose 时统一撤销，
 * 视图里不允许出现裸 setInterval。
 */

const hasRaf = () => typeof requestAnimationFrame === "function";

export function createDisposer() {
  const intervals = new Set();
  const timeouts = new Set();
  const frames = new Set();
  const listeners = [];
  const extras = [];
  let disposed = false;

  const api = {
    get disposed() {
      return disposed;
    },
    interval(fn, ms) {
      if (disposed) return null;
      const id = setInterval(fn, ms);
      intervals.add(id);
      return id;
    },
    timeout(fn, ms) {
      if (disposed) return null;
      const id = setTimeout(() => {
        timeouts.delete(id);
        fn();
      }, ms);
      timeouts.add(id);
      return id;
    },
    frame(fn) {
      if (disposed) return null;
      if (!hasRaf()) return api.timeout(() => fn(Date.now()), 16);
      const id = requestAnimationFrame((t) => {
        frames.delete(id);
        fn(t);
      });
      frames.add(id);
      return id;
    },
    clearTimer(id) {
      if (id === null || id === undefined) return;
      if (intervals.delete(id)) clearInterval(id);
      if (timeouts.delete(id)) clearTimeout(id);
    },
    on(target, type, fn, options) {
      if (disposed || !target?.addEventListener) return;
      target.addEventListener(type, fn, options);
      listeners.push([target, type, fn, options]);
    },
    add(fn) {
      if (typeof fn === "function") extras.push(fn);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const id of intervals) clearInterval(id);
      for (const id of timeouts) clearTimeout(id);
      if (hasRaf()) for (const id of frames) cancelAnimationFrame(id);
      for (const [target, type, fn, options] of listeners) {
        target.removeEventListener(type, fn, options);
      }
      intervals.clear();
      timeouts.clear();
      frames.clear();
      listeners.length = 0;
      for (const fn of extras.splice(0)) {
        try {
          fn();
        } catch {
          /* 单个清理失败不应吃掉后面的清理 */
        }
      }
    },
  };
  return api;
}

/** 帧循环：dt 上限 50ms，切后台回来不会让掉落物瞬移穿过筐子。 */
export function createLoop(disposer, step) {
  let running = false;
  let last = 0;
  const tick = (now) => {
    if (!running || disposer.disposed) return;
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    step(dt);
    if (running && !disposer.disposed) disposer.frame(tick);
  };
  disposer.add(() => {
    running = false;
  });
  return {
    start() {
      if (running || disposer.disposed) return;
      running = true;
      last = 0;
      disposer.frame(tick);
    },
    stop() {
      running = false;
    },
    get running() {
      return running;
    },
  };
}

/** 发奖统一走动作层；动作层缺席时退回 state 原语，保证视图行为不变。 */
export function grantReward(state, payload = {}) {
  if (typeof actions.reward === "function") return actions.reward(state, payload);
  const { gold = 0, xp = 0, shards = 0, toast } = payload;
  if (gold) grantGold(state, gold);
  if (xp) grantXp(state, xp);
  if (shards) state.shards = Math.max(0, state.shards + shards);
  tryLevelUp(state);
  return { ok: true, toast };
}

/** 入场消费同理：只经动作层扣钱，视图不再直接写 state.gold。 */
export function chargeFee(state, cost, toast) {
  if (typeof actions.payFee === "function") return actions.payFee(state, cost, toast);
  if (!Number.isFinite(cost) || cost < 0) return { ok: false, reason: "bad-cost", toast: "价格异常" };
  if (state.gold < cost) return { ok: false, reason: "insufficient-gold", toast: toast || "现金不够" };
  state.gold -= cost;
  return { ok: true };
}

/** app.js 传的是 (root, state, back, ctx)，老调用只有 back，这里统一成一个门面。 */
export function viewCtx(state, back, ctx) {
  const bag = ctx && typeof ctx === "object" ? ctx : {};
  const goBack = typeof back === "function" ? back : bag.back;
  return {
    back: typeof goBack === "function" ? goBack : () => {},
    toast(message) {
      if (!message) return;
      if (typeof bag.toast === "function") bag.toast(message);
      else state.toast = message;
    },
    save() {
      if (typeof bag.persist === "function") bag.persist();
      else persist(state);
    },
  };
}
