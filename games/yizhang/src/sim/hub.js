// 安全区（Hub）：走道 + 两排台座 + 传送门。纯数据 + 纯函数，禁止 three / DOM。
//
// 空间约定
// --------
// 安全区与裂岛**共用同一套世界坐标**，水平错开：裂岛在原点半径 20 的圆盘上，
// 安全区整体挪到 z ≈ -120 的走道上。规则按「实体所处空间」生效，而不是全局开关：
//
//   - 站在安全区体积（`layout.zone`）里的人：走道是实心的、有隐形墙、不吃击退、不判掉落 KO。
//   - 体积之外的人：一律按裂岛规则结算，`phase` 是什么都一样。
//
// `state.phase` 只决定「新出生点在哪」「传送门通不通」，不改裂岛那套判定。老测试 / 老探针
// 直接把人摆到裂岛坐标就还是裂岛行为，不用先切 phase。
//
// 布局数据
// --------
// 布局表归 Fable-3 的 `src/data/hub.js`。那张表还没合入时用下面的 `DEFAULT_HUB_LAYOUT`
// （8 座、两排各 4 座）。data 侧一旦导出 `HUB`，`installData(mod)` / `installHubLayout(mod)`
// 就会接管，sim 不需要改代码（sim 也不会去 import 一个可能不存在的模块）。

import { PHYSICS } from "./constants.js";
import { clamp, len2, yawFromDir } from "./math.js";
import { pushEvent } from "./events.js";

/** 走道中心的 z。裂岛半径 20，挪到 -120 保证两块空间不会互相误判。 */
const HUB_Z = -120;

/** 两排台座的 z 偏移（相对走道中心），由近到远。 */
const ROW_Z = [7, 1, -5, -11];

/** 左排（-X）与右排（+X）的掌序：木棉/磐石/疾风/冰霜 · 弹簧/分身/磁掌/陨掌 */
const LEFT_ROW = ["cotton", "granite", "gale", "frost"];
const RIGHT_ROW = ["spring", "afterimage", "magnet", "meteor"];

const ROW_X = 4.2;

function defaultPedestals() {
  const out = [];
  for (let i = 0; i < ROW_Z.length; i++) {
    const z = HUB_Z + ROW_Z[i];
    // 台座朝走道中线：左排面向 +X，右排面向 -X（yaw 用 sim 的冻结约定算，不手写常数）
    out.push({ gloveId: LEFT_ROW[i], x: -ROW_X, y: 0, z, yaw: yawFromDir(1, 0), row: "left", index: i });
    out.push({ gloveId: RIGHT_ROW[i], x: ROW_X, y: 0, z, yaw: yawFromDir(-1, 0), row: "right", index: i });
  }
  return out;
}

/**
 * 内置布局（`src/data/hub.js` 缺席时生效）。
 * 长度单位米；`walkway` 是可走范围（隐形墙），`zone` 是「算不算在安全区里」的判定体积。
 */
export const DEFAULT_HUB_LAYOUT = Object.freeze({
  id: "hub-walkway-v1",
  source: "sim-default",
  origin: { x: 0, y: 0, z: HUB_Z },
  floorY: 0,
  // yaw = 0 面向 -Z：出生在走道近端，正对传送门
  spawn: { x: 0, y: 0, z: HUB_Z + 14, yaw: 0 },
  walkway: { halfWidth: 7.5, minZ: HUB_Z - 21, maxZ: HUB_Z + 18 },
  zone: { halfWidth: 11.5, minZ: HUB_Z - 25, maxZ: HUB_Z + 22, minY: -4, maxY: 26 },
  portal: { x: 0, y: 0, z: HUB_Z - 17, radius: 2.4 },
  interactRadius: 2.0,
  pedestalRadius: 0.6,
  pedestalHeight: 0.95,
  pedestals: Object.freeze(defaultPedestals().map((p) => Object.freeze(p))),
});

const num = (v, d) => (Number.isFinite(v) ? v : d);

/**
 * 数据表没写 `spawn.yaw` 时的出生朝向：面向传送门。
 * 契约 §3.3 的走道是「+Z 端出生、-Z 端是门」，内置布局按这条式子照样算出 0；
 * 门摆在别处的布局也不会背对着门出生（缺省常数会让人一进走道就得先转 180°）。
 */
function spawnYawTowardPortal(x, z, portal) {
  const dx = portal.x - x;
  const dz = portal.z - z;
  if (len2(dx, dz) < 1e-6) return DEFAULT_HUB_LAYOUT.spawn.yaw;
  const yaw = yawFromDir(dx, dz);
  return yaw === 0 ? 0 : yaw; // atan2 会吐 -0，布局是要序列化的数据，收成 +0
}

/** 布局字段补全：data 侧只给一半字段也不能把 sim 打成 NaN。 */
export function normalizeHubLayout(raw) {
  const base = DEFAULT_HUB_LAYOUT;
  if (!raw || typeof raw !== "object") return structuredClone(base);

  const origin = {
    x: num(raw.origin?.x, base.origin.x),
    y: num(raw.origin?.y, base.origin.y),
    z: num(raw.origin?.z, base.origin.z),
  };
  const floorY = num(raw.floorY, origin.y);
  const walkway = {
    halfWidth: Math.max(1, num(raw.walkway?.halfWidth, base.walkway.halfWidth)),
    minZ: num(raw.walkway?.minZ, origin.z + (base.walkway.minZ - base.origin.z)),
    maxZ: num(raw.walkway?.maxZ, origin.z + (base.walkway.maxZ - base.origin.z)),
  };
  const zone = {
    halfWidth: Math.max(walkway.halfWidth, num(raw.zone?.halfWidth, walkway.halfWidth + 4)),
    minZ: Math.min(walkway.minZ, num(raw.zone?.minZ, walkway.minZ - 4)),
    maxZ: Math.max(walkway.maxZ, num(raw.zone?.maxZ, walkway.maxZ + 4)),
    minY: num(raw.zone?.minY, floorY - 4),
    maxY: num(raw.zone?.maxY, floorY + 26),
  };

  const pedestals = (Array.isArray(raw.pedestals) ? raw.pedestals : base.pedestals).map((p, i) => ({
    gloveId: typeof p?.gloveId === "string" ? p.gloveId : null,
    x: num(p?.x, 0),
    y: num(p?.y, floorY),
    z: num(p?.z, origin.z),
    yaw: num(p?.yaw, 0),
    row: p?.row === "right" ? "right" : p?.row === "left" ? "left" : p?.x > origin.x ? "right" : "left",
    index: Number.isFinite(p?.index) ? p.index : Math.floor(i / 2),
  }));

  const portal = {
    x: num(raw.portal?.x, origin.x),
    y: num(raw.portal?.y, floorY),
    z: num(raw.portal?.z, origin.z + (base.portal.z - base.origin.z)),
    radius: Math.max(0.5, num(raw.portal?.radius, base.portal.radius)),
  };

  const spawnX = num(raw.spawn?.x, origin.x);
  const spawnZ = num(raw.spawn?.z, origin.z + (base.spawn.z - base.origin.z));

  return {
    id: typeof raw.id === "string" ? raw.id : base.id,
    source: typeof raw.source === "string" ? raw.source : "data",
    origin,
    floorY,
    spawn: {
      x: spawnX,
      y: num(raw.spawn?.y, floorY),
      z: spawnZ,
      yaw: num(raw.spawn?.yaw, spawnYawTowardPortal(spawnX, spawnZ, portal)),
    },
    walkway,
    zone,
    portal,
    interactRadius: Math.max(0.5, num(raw.interactRadius, base.interactRadius)),
    pedestalRadius: Math.max(0, num(raw.pedestalRadius, base.pedestalRadius)),
    pedestalHeight: Math.max(0, num(raw.pedestalHeight, base.pedestalHeight)),
    pedestals,
  };
}

// ------------------------------------------------------------------ 空间判定

/** 世界坐标在不在安全区体积里 */
export function inHubZone(layout, x, y, z) {
  const zone = layout.zone;
  const ox = layout.origin.x;
  if (x < ox - zone.halfWidth || x > ox + zone.halfWidth) return false;
  if (z < zone.minZ || z > zone.maxZ) return false;
  return y >= zone.minY && y <= zone.maxY;
}

/** 这个人此刻是不是「在安全区里」：phase 是 hub **且** 人确实站在安全区体积内 */
export function playerInHub(state, p) {
  return state.phase === "hub" && inHubZone(state.hub.layout, p.x, p.y, p.z);
}

export function hubSpawnFor(layout, index = 0) {
  const s = layout.spawn;
  // 多个真人时横向错开，避免叠在同一格
  const lateral = index === 0 ? 0 : ((index % 2 === 1 ? 1 : -1) * Math.ceil(index / 2) * 1.2);
  const halfW = layout.walkway.halfWidth - 0.8;
  return { x: clamp(s.x + lateral, s.x - halfW, s.x + halfW), y: layout.floorY, z: s.z, yaw: s.yaw };
}

export function placeAtHubSpawn(state, player, index = 0) {
  const spot = hubSpawnFor(state.hub.layout, index);
  player.x = spot.x;
  player.y = spot.y;
  player.z = spot.z;
  player.yaw = spot.yaw;
  player.vx = 0;
  player.vy = 0;
  player.vz = 0;
  player.grounded = true;
  player.coyoteT = 0;
}

// ------------------------------------------------------------------ 状态构造

function resolveUnlocked(opts, deps) {
  const ids = new Set();
  const known = deps.GLOVE_BY_ID;
  const add = (id) => {
    if (typeof id === "string" && known[id]) ids.add(id);
  };

  const raw = opts.unlocked ?? opts.unlockedGloves ?? null;
  if (raw === "all") {
    for (const g of deps.GLOVES) ids.add(g.id);
    return [...ids];
  }
  if (Array.isArray(raw)) raw.forEach(add);
  else if (raw instanceof Set) raw.forEach(add);
  else if (raw && typeof raw === "object") {
    for (const [id, on] of Object.entries(raw)) if (on) add(id);
  }

  if (!raw) {
    // 缺省：只有 unlock === "default" 的掌 + 调用方已经明确带进来的两只掌
    for (const g of deps.GLOVES) if (g.unlock === "default") ids.add(g.id);
    add(opts.gloveId);
    add(opts.offhandId);
  }
  if (ids.size === 0 && deps.GLOVES.length) ids.add(deps.GLOVES[0].id);
  return [...ids];
}

/**
 * 台座列表：按布局的槽位铺开，掌 id 不在当前掌表里就退到同序号的掌，还找不到就丢掉这一座。
 * （测试会用只有一两只掌的替身表 installData，那时台座自然变少。）
 */
function buildPedestals(layout, deps, unlocked) {
  const out = [];
  const used = new Set();
  layout.pedestals.forEach((slot, i) => {
    let gloveId = slot.gloveId && deps.GLOVE_BY_ID[slot.gloveId] ? slot.gloveId : null;
    if (!gloveId) gloveId = deps.GLOVES[i] ? deps.GLOVES[i].id : null;
    if (!gloveId || used.has(gloveId)) return;
    used.add(gloveId);
    const glove = deps.GLOVE_BY_ID[gloveId];
    out.push({
      gloveId,
      x: slot.x,
      y: slot.y,
      z: slot.z,
      yaw: slot.yaw,
      row: slot.row,
      index: slot.index,
      unlock: glove.unlock ?? "default",
      unlocked: unlocked.includes(gloveId),
      selected: null, // 'main' | 'off' | null
    });
  });
  return out;
}

/**
 * `state.hub`。纯数据，可 structuredClone / JSON 序列化。
 * `mainGloveId` / `offGloveId` 是「在大厅里挑过的」，null 表示还没挑；
 * 玩家身上的 `gloveId` / `offhandId` 始终是有效值（战斗层不接受空掌）。
 */
export function createHubState(opts, deps, layout) {
  const unlocked = resolveUnlocked(opts, deps);
  const picked = deps.GLOVE_BY_ID[opts.gloveId] ? opts.gloveId : null;
  const pickedOff = picked && deps.GLOVE_BY_ID[opts.offhandId] ? opts.offhandId : null;

  const hub = {
    layout,
    unlocked,
    pedestals: buildPedestals(layout, deps, unlocked),
    mainGloveId: picked,
    offGloveId: pickedOff === picked ? null : pickedOff,
    focusGloveId: null,
    portalReady: !!picked,
    portalNear: false,
    enteredArenaAt: null,
  };
  syncSelection(hub);
  return hub;
}

function syncSelection(hub) {
  for (const ped of hub.pedestals) {
    ped.selected =
      ped.gloveId === hub.mainGloveId ? "main" : ped.gloveId === hub.offGloveId ? "off" : null;
  }
  hub.portalReady = !!hub.mainGloveId;
}

/** 刷新已解锁列表（存档变了 / 局内解锁时由壳层调用） */
export function setHubUnlocked(state, ids) {
  const list = Array.isArray(ids) ? ids : ids instanceof Set ? [...ids] : [];
  state.hub.unlocked = list.filter((id) => typeof id === "string");
  for (const ped of state.hub.pedestals) ped.unlocked = state.hub.unlocked.includes(ped.gloveId);
  return state.hub.unlocked;
}

// ------------------------------------------------------------------ 靠近 / 装备 / 传送

/** 半径内最近的台座；同距离取列表靠前的那座，保证同 seed 稳定 */
export function nearestPedestal(hub, x, z, radius) {
  const r = Number.isFinite(radius) ? radius : hub.layout.interactRadius;
  let best = null;
  let bd = r * r;
  for (const ped of hub.pedestals) {
    const dx = ped.x - x;
    const dz = ped.z - z;
    const d = dx * dx + dz * dz;
    if (d < bd) {
      bd = d;
      best = ped;
    }
  }
  return best;
}

/** 主副掌写回玩家。副掌没挑就跟主掌一致，别让玩家白捡一只没选过的掌。 */
function applyLoadout(hub, p) {
  if (hub.mainGloveId) p.gloveId = hub.mainGloveId;
  if (hub.offGloveId) p.offhandId = hub.offGloveId;
  else if (hub.mainGloveId) p.offhandId = hub.mainGloveId;
  p.activeSlot = 0;
}

/**
 * 装备一只掌。默认「先主后副」：
 *   主掌空       -> 装主掌
 *   已是主掌     -> 不动
 *   已是副掌     -> 提为主掌，原主掌退到副掌
 *   副掌空       -> 装副掌
 *   两格都满     -> 换掉副掌
 * `slot` 传 'main' / 'off' 可以直接指定（触控 UI 的两个槽位按钮）。
 */
export function equipFromPedestal(state, p, ped, slot = null) {
  const hub = state.hub;
  if (!ped) return null;
  if (!ped.unlocked) {
    pushEvent(state, { type: "hubLocked", id: p.id, gloveId: ped.gloveId, unlock: ped.unlock });
    return null;
  }

  const gloveId = ped.gloveId;
  let target = slot === "main" || slot === "off" ? slot : null;
  if (!target) {
    if (!hub.mainGloveId) target = "main";
    else if (gloveId === hub.mainGloveId) target = "main";
    else if (gloveId === hub.offGloveId) target = "main"; // 副掌再按一次 = 提为主掌
    else if (!hub.offGloveId) target = "off";
    else target = "off";
  }

  if (target === "main") {
    if (hub.mainGloveId === gloveId) {
      pushEvent(state, { type: "hubEquip", id: p.id, gloveId, slot: "main", changed: false });
      return "main";
    }
    // 提为主掌时原主掌顺位退到副掌；本来在副掌的那只不会重复占两格
    const previousMain = hub.mainGloveId;
    hub.mainGloveId = gloveId;
    if (hub.offGloveId === gloveId) hub.offGloveId = previousMain;
  } else {
    if (hub.offGloveId === gloveId) {
      pushEvent(state, { type: "hubEquip", id: p.id, gloveId, slot: "off", changed: false });
      return "off";
    }
    if (hub.mainGloveId === gloveId) return null; // 同一只掌不占两格
    hub.offGloveId = gloveId;
  }

  syncSelection(hub);
  applyLoadout(hub, p);
  pushEvent(state, {
    type: "hubEquip",
    id: p.id,
    gloveId,
    slot: target,
    mainGloveId: hub.mainGloveId,
    offGloveId: hub.offGloveId,
    changed: true,
  });
  return target;
}

/**
 * 安全区里的换掌（契约 §4.4）：**主副槽交换**，不是 arena 的 activeSlot 切换。
 * 无 switchLock 代价，`activeSlot` 归 0，复用既有 `switch` 事件（`slot: 0`、
 * `gloveId` = 交换后的主掌）。要换主掌：新掌先落副槽，再按一次换掌。
 *
 * 「挑过」的位（`mainGloveId` / `offGloveId`）只在两格都挑过时随行——只挑了主掌就
 * 对调的话主掌会变成 null，传送门跟着失效。那种情况下副掌本来就跟主掌同值，
 * 交换本身是恒等的。
 */
export function swapHubLoadout(state, p) {
  const hub = state.hub;
  const previousMain = p.gloveId;
  p.gloveId = p.offhandId;
  p.offhandId = previousMain;
  p.activeSlot = 0;

  if (hub && hub.mainGloveId && hub.offGloveId) {
    const chosenMain = hub.mainGloveId;
    hub.mainGloveId = hub.offGloveId;
    hub.offGloveId = chosenMain;
    syncSelection(hub);
  }

  pushEvent(state, { type: "switch", id: p.id, slot: 0, gloveId: p.gloveId });
  return p.gloveId;
}

export function nearPortal(hub, x, z) {
  const portal = hub.layout.portal;
  return len2(portal.x - x, portal.z - z) <= portal.radius;
}

/** 走道里的实心地板 + 隐形墙 + 台座柱体，安全区不掉人 */
export function resolveHubGround(state, p, dt) {
  const layout = state.hub.layout;
  const w = layout.walkway;
  const ox = layout.origin.x;

  const minX = ox - w.halfWidth;
  const maxX = ox + w.halfWidth;
  if (p.x < minX) {
    p.x = minX;
    if (p.vx < 0) p.vx = 0;
  } else if (p.x > maxX) {
    p.x = maxX;
    if (p.vx > 0) p.vx = 0;
  }
  if (p.z < w.minZ) {
    p.z = w.minZ;
    if (p.vz < 0) p.vz = 0;
  } else if (p.z > w.maxZ) {
    p.z = w.maxZ;
    if (p.vz > 0) p.vz = 0;
  }

  // 台座是实体，走不过去
  const pr = layout.pedestalRadius + state.config.playerRadius;
  if (pr > 0) {
    for (const ped of state.hub.pedestals) {
      const dx = p.x - ped.x;
      const dz = p.z - ped.z;
      const d = len2(dx, dz);
      if (d >= pr) continue;
      const nx = d > 1e-5 ? dx / d : 1;
      const nz = d > 1e-5 ? dz / d : 0;
      p.x = ped.x + nx * pr;
      p.z = ped.z + nz * pr;
      const radial = p.vx * nx + p.vz * nz;
      if (radial < 0) {
        p.vx -= radial * nx;
        p.vz -= radial * nz;
      }
    }
  }

  const floorY = layout.floorY;
  if (p.y <= floorY && p.vy <= 0) {
    p.y = floorY;
    p.vy = 0;
    p.grounded = true;
    p.coyoteT = PHYSICS.coyoteTime;
  } else {
    p.grounded = false;
    p.coyoteT = Math.max(0, p.coyoteT - dt);
  }
}

/**
 * 每帧的大厅逻辑：焦点台座、interact 装备、传送门。
 * `frame` 是 step 里那份 `{ p, input }` 列表，站在裂岛上的人只更新按键边沿。
 */
export function stepHub(state, frame, onEnterArena) {
  const hub = state.hub;
  let focus = null;
  let anyNearPortal = false;

  for (const entry of frame) {
    const p = entry.p;
    const input = entry.input;
    const pressed = !!input.interact;
    const edge = pressed && !p.prev.interact;
    p.prev.interact = pressed;

    if (state.phase !== "hub" || !playerInHub(state, p)) continue;

    const ped = nearestPedestal(hub, p.x, p.z);
    if (p.kind === "human" && focus === null) focus = ped ? ped.gloveId : null;
    if (edge && ped) equipFromPedestal(state, p, ped, input.interactSlot ?? null);

    if (nearPortal(hub, p.x, p.z)) {
      anyNearPortal = true;
      if (!hub.portalNear) {
        pushEvent(state, { type: "hubPortalNear", id: p.id, ready: hub.portalReady });
      }
      // 选完主掌就是「穿过门」进岛，不必再确认一次；按 interact 同样算
      if (hub.portalReady && onEnterArena) onEnterArena(p);
    }
  }

  if (state.phase === "hub") {
    if (hub.focusGloveId !== focus) {
      hub.focusGloveId = focus;
      if (focus) pushEvent(state, { type: "hubFocus", gloveId: focus });
    }
    hub.portalNear = anyNearPortal;
  }
}

export function hubView(state) {
  const hub = state.hub;
  const layout = hub.layout;
  return {
    layoutId: layout.id,
    source: layout.source,
    origin: { ...layout.origin },
    floorY: layout.floorY,
    spawn: { ...layout.spawn },
    walkway: { ...layout.walkway },
    zone: { ...layout.zone },
    portal: { ...layout.portal, ready: hub.portalReady, near: hub.portalNear },
    interactRadius: layout.interactRadius,
    pedestalRadius: layout.pedestalRadius,
    pedestalHeight: layout.pedestalHeight,
    focusGloveId: hub.focusGloveId,
    portalReady: hub.portalReady,
    portalNear: hub.portalNear,
    mainGloveId: hub.mainGloveId,
    offGloveId: hub.offGloveId,
    unlocked: [...hub.unlocked],
    pedestals: hub.pedestals.map((ped) => ({
      gloveId: ped.gloveId,
      x: ped.x,
      y: ped.y,
      z: ped.z,
      yaw: ped.yaw,
      row: ped.row,
      index: ped.index,
      height: layout.pedestalHeight,
      radius: layout.interactRadius,
      unlock: ped.unlock,
      unlocked: ped.unlocked,
      selected: ped.selected !== null,
      slot: ped.selected,
      focused: ped.gloveId === hub.focusGloveId,
    })),
  };
}
