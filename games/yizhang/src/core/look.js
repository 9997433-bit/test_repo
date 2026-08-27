// 视角喂入：每帧把输入层的 look（方位角 + 俯仰 + 视角模式）递给渲染器。
//
// Round 1（视角轮）主修的就是这里的 yaw 空间：以前 payload.yaw 原样透出
// **相机方位角**，而 `YizhangRenderer.setLook` 把 `o.yaw` 存进 lookYaw、
// sync 里当 **sim 角** 用 —— 相机系角被塞进 sim 系，视角就「拧巴」了。
// 现在 payload 的 `yaw` 就是 `simYaw`（同一个值给两个名字），渲染器读哪个
// 字段都拿到 sim 空间的角；相机系角不再离开输入层。
//
// yaw 空间仍然只有两套，这里一套都不新造：
//   相机方位角 —— 输入层内部维护（水平前向 = (cos yaw, sin yaw)），不出这层
//   simYaw     —— `core/view.js cameraYawToSimYaw` 的产物（yaw=0 面向 -Z），
//                 sim / render / camera 共用的那一套；换算实现仍只有那一处
//
// lookMode（视角模式，GOAL 冻结面）：
//   locked —— 固定人物视角：镜头钉身后，人物水平面向 ≡ 相机水平前向（产品缺省）
//   free   —— 自由视角：鼠标看与移动相对相机
// 模式的运行时权威在输入层（input.getLook().lookMode），这里只负责随帧透传，
// 渲染器按它决定机位策略（O2 的活），壳层按它写存档 / 出 HUD 提示。
//
// invertY 在输入层就吃掉了（`applyLook` 按 `state.invertY` 定号），
// 这里拿到的 pitch 已经是玩家期望的方向，不要在链路上再翻一次。

import { cameraYawToSimYaw } from "./view.js";

/** 产品缺省：固定人物视角。老档缺字段 / URL 乱填 / 输入层没报都落到它。 */
export const DEFAULT_LOOK_MODE = "locked";

function num(v) {
  return Number.isFinite(v) ? v : 0;
}

/**
 * 把任意来源的视角模式收成 `'locked' | 'free'`。
 * 字符串宽松处理（大小写 / 两端空白），其余一律回落 fallback。
 * @param {unknown} value
 * @param {'locked'|'free'} [fallback]
 * @returns {'locked'|'free'}
 */
export function normalizeLookMode(value, fallback = DEFAULT_LOOK_MODE) {
  if (value === "locked" || value === "free") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "locked" || v === "free") return v;
  }
  return fallback;
}

/**
 * 开局的视角模式取值链：URL `?look=locked|free` > 存档 `lookMode` > 缺省 locked。
 * URL 填了认不出的值不算数（落到存档，不是直接落缺省）。
 * @param {{url?: string|null, save?: {lookMode?: unknown}|null}} [ctx]
 * @returns {'locked'|'free'}
 */
export function resolveLookMode(ctx = {}) {
  if (typeof ctx.url === "string") {
    const v = ctx.url.trim().toLowerCase();
    if (v === "locked" || v === "free") return v;
  }
  return normalizeLookMode(ctx.save ? ctx.save.lookMode : undefined);
}

/**
 * 把 `input.getLook()` 整形成渲染器能直接吃的一帧视角。
 * `yaw` 与 `simYaw` 是**同一个 sim 空间的值**：渲染器旧口读 `yaw`、新口读
 * `simYaw` 都不会再把相机系角当 sim 角用。相机系 yaw 不出这层。
 * @param {{yaw?:number, pitch?:number, lookMode?:string}|null} look
 * @returns {{yaw:number, pitch:number, simYaw:number, lookMode:'locked'|'free'}}
 */
export function lookPayload(look) {
  const simYaw = cameraYawToSimYaw(num(look && look.yaw));
  return {
    yaw: simYaw,
    pitch: num(look && look.pitch),
    simYaw,
    lookMode: normalizeLookMode(look && look.lookMode),
  };
}

/**
 * 喂一帧。setLook 优先（它自带 pitch），只有 setPitch 的渲染器退而求其次，
 * 两个都没有就什么都不做 —— 缺 API 不是错误，不刷警告、不抛。
 *
 * @param {object|null} renderer  bindRenderer 的产物或渲染器实例
 * @param {{yaw?:number, pitch?:number, lookMode?:string}|null} look  input.getLook()
 * @returns {{fed:'setLook'|'setPitch'|'none'|'error', payload:{yaw:number,pitch:number,simYaw:number,lookMode:'locked'|'free'}}}
 */
export function feedLook(renderer, look) {
  const payload = lookPayload(look);
  const hasLook = !!renderer && typeof renderer.setLook === "function";
  const hasPitch = !!renderer && typeof renderer.setPitch === "function";
  if (!hasLook && !hasPitch) return { fed: "none", payload };
  try {
    if (hasLook) {
      renderer.setLook(payload);
      return { fed: "setLook", payload };
    }
    renderer.setPitch(payload.pitch);
    return { fed: "setPitch", payload };
  } catch (err) {
    // 渲染器自己抛错不该把主循环带走：一帧视角没喂进去，画面继续。
    console.warn("[yizhang] renderer.setLook/setPitch 抛错", err);
    return { fed: "error", payload };
  }
}

/** snapLook 认得的渲染器吸附口，按序探测，命中第一个就停。 */
const SNAP_NAMES = ["snapCamera", "resetCamera", "snap"];

/**
 * 过门 / 开局的「机位吸附」信号：渲染器开了 snap 口就调一下，让阻尼跟随
 * 立即收敛到新机位（hub 与裂岛错开 ~120m，不吸附就会看一段镜头飞跃）。
 * 渲染器还没开口（O2 未落地 / 2D 兜底旧版）时整只 no-op —— 缺 API 不是错误。
 *
 * @param {object|null} renderer  bindRenderer 的产物或渲染器实例
 * @returns {{snapped:'snapCamera'|'resetCamera'|'snap'|'none'|'error'}}
 */
export function snapLook(renderer) {
  if (!renderer) return { snapped: "none" };
  for (const name of SNAP_NAMES) {
    const fn = renderer[name];
    if (typeof fn !== "function") continue;
    try {
      fn.call(renderer);
      return { snapped: name };
    } catch (err) {
      console.warn(`[yizhang] renderer.${name} 抛错`, err);
      return { snapped: "error" };
    }
  }
  return { snapped: "none" };
}
