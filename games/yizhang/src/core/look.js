// 视角喂入：每帧把输入层的 look（相机方位角 + 俯仰）递给渲染器。
//
// Round 1 遗留 4：`input.getLook().pitch` 一直有值，渲染的 `cameraRig.update(dt,
// focus, yaw, vel)` 只吃 yaw —— 鼠标上下看等于没接线。开 setter 是 O2 的活
// （`src/render/renderer.js` 归 O2），壳层这边先把「每帧喂一次」的通路铺好：
// 渲染器没有 setLook / setPitch 时整只 no-op，O2 落地当帧自动生效，
// 不必再为了接一个 setter 走一遍装配层。
//
// yaw 空间仍然只有两套，这里一套都不新造：
//   yaw    —— 输入层维护的**相机方位角**（水平前向 = (cos yaw, sin yaw)），原样透出
//   simYaw —— `core/view.js cameraYawToSimYaw` 的产物（yaw=0 面向 -Z），
//             sim / render / camera 共用的那一套；换算实现仍只有那一处
// 两个字段一起给，渲染器读哪个都不用自己再转一次角度。
//
// invertY 在输入层就吃掉了（`applyLook` 按 `state.invertY` 定号），
// 这里拿到的 pitch 已经是玩家期望的方向，不要在链路上再翻一次。

import { cameraYawToSimYaw } from "./view.js";

function num(v) {
  return Number.isFinite(v) ? v : 0;
}

/**
 * 把 `input.getLook()` 整形成渲染器能直接吃的一帧视角。
 * @param {{yaw?:number, pitch?:number}|null} look
 * @returns {{yaw:number, pitch:number, simYaw:number}}
 */
export function lookPayload(look) {
  const yaw = num(look && look.yaw);
  return { yaw, pitch: num(look && look.pitch), simYaw: cameraYawToSimYaw(yaw) };
}

/**
 * 喂一帧。setLook 优先（它自带 pitch），只有 setPitch 的渲染器退而求其次，
 * 两个都没有就什么都不做 —— 缺 API 不是错误，不刷警告、不抛。
 *
 * @param {object|null} renderer  bindRenderer 的产物或渲染器实例
 * @param {{yaw?:number, pitch?:number}|null} look  input.getLook()
 * @returns {{fed:'setLook'|'setPitch'|'none'|'error', payload:{yaw:number,pitch:number,simYaw:number}}}
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
