// view 适配层：把 sim 的快照整形成 UI / AI / renderer 三边都认得的形状。
//
// 为什么需要它：sim（O1）、render（O2）、ai（O3）是三个代理并行写出来的，
// 字段名对不齐是常态 —— sim 给 `match.secondsLeft` 与 `arena.tiles`，
// render 读 `arenaRadius` 与 `tiles`，HUD 想要 `timeLeft` 和玩家名。
// 这里做一次转换，别让每个消费方各自兜底。

/** 本机玩家 id：与 src/sim/state.js 的 createMatch 一致，全工程唯一事实来源。 */
export const SELF_ID = "p0";

/**
 * 朝向桥接。全工程只有一套约定：yaw=0 面向 -Z。
 * sim 的 forward=(-sin yaw, -cos yaw)（src/sim/math.js FACE），
 * render 的 forwardFromYaw（src/render/view.js）与之逐字一致，
 * camera.js 又把机位架在 focus+(sin yaw, cos yaw)*dist，也就是前向的反面 —— 背后。
 *
 * 所以渲染快照**不需要**任何偏移。以前这里加 π，等于把机位挪到角色脸前：
 * 第三人称看见正脸，W 朝镜头走、A/D 左右镜像、鼠标右移镜头往身前甩。
 * 偏移保留为常量（值 0）只是为了留一处集中的开关，不是给人重新填 π 的。
 */
export const RENDER_YAW_OFFSET = 0;

import { assignSkins, normalizeSkinId, resolveSkins } from "./skins.js";

const DEFAULT_BOT_NAMES = ["蛮古", "狸缘", "欺霸"];
const NEUTRAL_COLOR = "#7f8c9e";

function num(v, d = 0) {
  return Number.isFinite(v) ? v : d;
}

/**
 * 玩家名/人格名/皮肤只在开局算一次，之后每帧复用。
 * @param {object} opts { selfId, personaById, skinTable, skinId }
 */
export function createRoster(view, opts = {}) {
  const selfId = opts.selfId || SELF_ID;
  const personaById = opts.personaById || null;
  const skinTable = opts.skinTable || resolveSkins(null);
  // 皮肤：sim 自报优先（Opus-1 落地后 getView 会带 skinId），否则壳层就地分配，
  // 保证 bot 不会全员同一胶囊。
  const skinById = assignSkins((view && view.players) || [], {
    selfId,
    selfSkinId: opts.skinId,
    table: skinTable,
    personaById,
  });
  const roster = new Map();
  let botIndex = 0;
  for (const p of (view && view.players) || []) {
    let name = p.name;
    if (!name) {
      if (p.id === selfId || p.kind === "human") {
        name = opts.selfName || "你";
      } else {
        const persona = personaById && p.persona ? personaById[p.persona] : null;
        name = (persona && persona.name) || DEFAULT_BOT_NAMES[botIndex % DEFAULT_BOT_NAMES.length];
        botIndex += 1;
      }
    }
    roster.set(p.id, {
      name,
      kind: p.kind || (p.id === selfId ? "human" : "bot"),
      skinId: skinById.get(p.id) || skinTable.defaultId,
    });
  }
  return roster;
}

function activeGloveIdOf(p) {
  if (p.activeGloveId) return p.activeGloveId;
  return num(p.activeSlot, 0) === 1 ? p.offhandId || p.gloveId : p.gloveId;
}

/**
 * 事件归一化。sim（step.js）用 `id` 指代动作发起者、`ko` 表示出局；
 * combat（combat/index.js）用 `attackerId` / `playerId` / `victimId`。
 * 统一成 { type, playerId, targetId, killerId, victimId, ... }。
 */
export function normalizeEvent(e) {
  if (!e || typeof e !== "object") return null;
  const type = String(e.type || e.kind || "");
  const playerId = e.playerId ?? e.attackerId ?? e.id ?? null;

  switch (type) {
    case "ko":
      return { ...e, type: "ko", victimId: e.id ?? e.victimId ?? null, killerId: e.by ?? e.killerId ?? null };
    case "kill":
      return { ...e, type: "ko", victimId: e.victimId ?? null, killerId: e.killerId ?? null };
    case "hit":
      return { ...e, type: "hit", playerId, targetId: e.targetId ?? e.target ?? null };
    case "respawn":
      return { ...e, type: "respawn", playerId };
    default:
      return { ...e, type, playerId };
  }
}

/**
 * @param {object} raw   sim.getView() 的快照
 * @param {object} ctx   { selfId, roster, gloveById }
 */
export function adaptView(raw, ctx = {}) {
  if (!raw) return null;
  const selfId = ctx.selfId || SELF_ID;
  const roster = ctx.roster || null;
  const gloveById = ctx.gloveById || {};

  const arena = raw.arena || null;
  const match = raw.match || null;
  const skinTable = ctx.skinTable || resolveSkins(null);

  const players = ((raw.players && raw.players.length ? raw.players : []) || []).map((p) => {
    const entry = roster ? roster.get(p.id) : null;
    const activeId = activeGloveIdOf(p);
    const glove = gloveById[activeId] || null;
    // 皮肤：sim 给了就认 sim 的，没给用开局分配的那份，最后才落默认皮肤。
    const skinId = p.skinId || (entry && entry.skinId) || skinTable.defaultId;
    return {
      ...p,
      name: p.name || (entry && entry.name) || p.id,
      skinId: normalizeSkinId(skinId, skinTable),
      activeGloveId: activeId,
      mainId: p.gloveId,
      offhandId: p.offhandId ?? p.gloveId,
      color: (glove && glove.color) || p.color || p.gloveColor || NEUTRAL_COLOR,
      awakened: p.awakened ?? num(p.awakenedT) > 0,
      isSelf: p.id === selfId,
    };
  });

  const events = [];
  for (const e of Array.isArray(raw.events) ? raw.events : []) {
    const n = normalizeEvent(e);
    if (n) events.push(n);
  }

  return {
    ...raw,
    // AI（src/ai/bots.js）会读这个提示决定 moveX/moveZ 的坐标系；
    // sim 的 readMoveVector 默认按世界系解释，所以这里必须是 world。
    moveSpace: "world",
    localId: selfId,
    t: num(raw.t, num(raw.time)),
    timeLeft: num(raw.timeLeft, match ? num(match.secondsLeft) : 0),
    over: raw.over ?? (match ? !!match.over : false),
    winnerId: raw.winnerId ?? (match ? match.winnerId : null),
    reason: raw.reason ?? (match ? match.reason : null),
    arenaRadius: num(raw.arenaRadius, arena ? num(arena.radius, 20) : 20),
    // 引用透传，不逐帧复制两百块台面
    tiles: Array.isArray(raw.tiles) ? raw.tiles : arena && Array.isArray(arena.tiles) ? arena.tiles : [],
    players,
    events,
  };
}

/**
 * 交给 renderer 前的最后一道整形。sim 与 render 同一套朝向，
 * 这里只把 yaw 收成有限数（插值帧偶尔会给 undefined），不再做角度变换。
 */
export function toRenderView(view) {
  if (!view) return view;
  return {
    ...view,
    players: view.players.map((p) => ({ ...p, yaw: num(p.yaw) + RENDER_YAW_OFFSET })),
  };
}

/**
 * 相机偏航（世界方位角，forward = (cos, sin)）→ sim 偏航（yaw=0 面向 -Z）。
 * 两边都是「朝向」，只是零点与旋向不同，转换必须集中一处，别散落到各调用点。
 */
export function cameraYawToSimYaw(cameraYaw) {
  return Math.atan2(-Math.cos(cameraYaw), -Math.sin(cameraYaw));
}

/** 反向：给相机一个初始角，使玩家背对镜头朝向 sim 的 forward。 */
export function simYawToCameraYaw(simYaw) {
  return Math.atan2(-Math.cos(simYaw), -Math.sin(simYaw));
}

/**
 * 世界系方向矢量 → sim 偏航（`forwardX/forwardZ` 的逆）。
 *
 * 这**不是**第三个换算点：入参与出参同在 sim 空间，只是矢量换角（契约 §1-11）。
 * 与 `sim/math.js yawFromDir` 逐字同式；壳层（`src/input`）禁止 import sim，
 * 所以 sim 空间的角度工具在这一侧备一份同名实现，free 视角的「面朝走向」用它。
 */
export function yawFromDir(x, z) {
  return Math.atan2(-x, -z);
}
