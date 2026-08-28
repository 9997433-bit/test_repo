// Opus-2 世界 · view 归一化。
// 世界层不产生任何玩法数值，只把 sim 给出的 JSON 读成渲染需要的形状，
// 并且对字段缺失、别名、越界一律做防御，让渲染永远不会因为上游改字段而炸掉。
// view.shots 不在这里出现：弹道由 src/combat 独占，世界层连读都不读。

import { SOCKET_COUNT, TURRET_KINDS, ENEMY_SHAPES, LANE_Y } from "./constants.js";
import { laneIndex, laneHeight, normalizeAngle, worldToPolar, wrapSocket } from "./polar.js";

function num(value, fallback = 0) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function firstDefined(source, keys) {
  if (!source || typeof source !== "object") return undefined;
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function truthyFlag(value) {
  if (value === undefined || value === null || value === false) return false;
  if (value === true) return true;
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  if (typeof value === "string") return value !== "" && value !== "0" && value !== "false";
  return true;
}

/** 稳定的字符串散列，用于把未知 towerId 也映射到一种确定的剪影。 */
function hashString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const KIND_ALIASES = new Map([
  ["rail", "rail"], ["railgun", "rail"], ["gauss", "rail"], ["lance", "rail"], ["轨道炮", "rail"], ["轨", "rail"],
  ["prism", "prism"], ["laser", "prism"], ["beam", "prism"], ["crystal", "prism"], ["棱镜", "prism"], ["棱", "prism"],
  ["scatter", "scatter"], ["shotgun", "scatter"], ["flak", "scatter"], ["spread", "scatter"], ["散射", "scatter"], ["散", "scatter"],
  ["well", "well"], ["gravity", "well"], ["gravitywell", "well"], ["singularity", "well"], ["引力井", "well"], ["引", "well"],
  ["star", "star"], ["nova", "star"], ["burst", "star"], ["spire", "star"], ["星芒", "star"], ["星", "star"],
]);

/**
 * 把任意 towerId 归一成 rail / prism / scatter / well / star 之一。
 * 空值返回 null，代表该插座没有塔。
 * @param {*} towerId
 * @returns {string|null}
 */
export function resolveTurretKind(towerId) {
  if (towerId === undefined || towerId === null || towerId === false || towerId === "") return null;

  if (typeof towerId === "object") {
    const inner = firstDefined(towerId, ["kind", "type", "towerId", "id", "name"]);
    return inner === undefined ? TURRET_KINDS[0] : resolveTurretKind(inner);
  }

  if (typeof towerId === "number") {
    if (!Number.isFinite(towerId)) return null;
    const idx = Math.round(towerId);
    return TURRET_KINDS[((idx % TURRET_KINDS.length) + TURRET_KINDS.length) % TURRET_KINDS.length];
  }

  const raw = String(towerId).trim();
  if (raw === "" || raw === "none" || raw === "null" || raw === "empty") return null;

  const key = raw.toLowerCase().replace(/[\s_\-.]/g, "");
  if (KIND_ALIASES.has(key)) return KIND_ALIASES.get(key);
  for (const [alias, kind] of KIND_ALIASES) {
    if (key.includes(alias)) return kind;
  }
  if (/^-?\d+$/.test(key)) return resolveTurretKind(Number(key));
  return TURRET_KINDS[hashString(key) % TURRET_KINDS.length];
}

const SHAPE_ALIASES = new Map([
  ["drone", "drone"], ["scout", "drone"], ["swarm", "drone"], ["shard", "drone"],
  ["hulk", "hulk"], ["tank", "hulk"], ["brute", "hulk"], ["heavy", "hulk"], ["boss", "hulk"], ["elite", "hulk"],
  ["wisp", "wisp"], ["ghost", "wisp"], ["flyer", "wisp"], ["spike", "wisp"], ["runner", "wisp"],
]);

/** 敌人体型归一。未知类型按 lane 派发，保证同一波看上去有序。 */
export function resolveEnemyShape(kind, lane) {
  if (kind === undefined || kind === null || kind === "") return ENEMY_SHAPES[laneIndex(lane)];
  if (typeof kind === "number" && Number.isFinite(kind)) {
    const idx = Math.round(kind);
    return ENEMY_SHAPES[((idx % ENEMY_SHAPES.length) + ENEMY_SHAPES.length) % ENEMY_SHAPES.length];
  }
  const key = String(kind).toLowerCase().replace(/[\s_\-.]/g, "");
  if (SHAPE_ALIASES.has(key)) return SHAPE_ALIASES.get(key);
  for (const [alias, shape] of SHAPE_ALIASES) {
    if (key.includes(alias)) return shape;
  }
  return ENEMY_SHAPES[hashString(key) % ENEMY_SHAPES.length];
}

function readVec3(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    if (value.length < 3) return null;
    return { x: num(value[0]), y: num(value[1]), z: num(value[2]) };
  }
  if (typeof value !== "object") return null;
  if (value.x === undefined && value.y === undefined && value.z === undefined) return null;
  return { x: num(value.x), y: num(value.y), z: num(value.z) };
}

function readSocket(raw, index) {
  const socket = raw && typeof raw === "object" ? raw : {};
  const towerId = firstDefined(socket, ["towerId", "tower", "turretId", "turret", "kind", "type"]);
  const kind = resolveTurretKind(towerId);

  const heat = num(firstDefined(socket, ["heat", "heatValue"]), 0);
  const heatMax = num(firstDefined(socket, ["heatMax", "maxHeat"]), 0);
  const overheat =
    truthyFlag(firstDefined(socket, ["overheated", "overheat", "isOverheated", "cooling"])) ||
    (heatMax > 0 && heat >= heatMax);
  const overclock = truthyFlag(firstDefined(socket, ["overclock", "overclocked", "isOverclocked", "boost"]));

  const aimRaw = firstDefined(socket, ["aim", "aimTheta", "facing", "angle", "heading"]);
  const aim = aimRaw === undefined ? null : normalizeAngle(num(aimRaw, 0));

  const tier = Math.max(1, Math.round(num(firstDefined(socket, ["tier", "level", "rank"]), 1)));

  return {
    index,
    towerId: towerId === undefined ? null : towerId,
    kind,
    tier,
    overclock,
    overheat,
    heat: heatMax > 0 ? Math.min(1, Math.max(0, heat / heatMax)) : 0,
    aim,
  };
}

/**
 * 环向位置。契约里 theta 必备，所以它永远优先；
 * 只有上游整段没给极坐标时，才从笛卡尔位置反算，免得敌人全堆在原点。
 */
function readEnemyPolar(raw) {
  const thetaRaw = firstDefined(raw, ["theta", "angle", "a", "phi"]);
  const radiusRaw = firstDefined(raw, ["radius", "r", "dist", "distance"]);
  if (thetaRaw !== undefined && radiusRaw !== undefined) {
    return { theta: normalizeAngle(num(thetaRaw, 0)), radius: Math.max(0, num(radiusRaw, 0)) };
  }

  const point = readVec3(firstDefined(raw, ["pos", "position", "p"])) ?? readPlanarPoint(raw);
  if (thetaRaw === undefined && radiusRaw === undefined && !point) return null;

  const polar = point ? worldToPolar(point.x, point.y, point.z) : null;
  return {
    theta: thetaRaw !== undefined ? normalizeAngle(num(thetaRaw, 0)) : polar ? polar.theta : 0,
    radius: radiusRaw !== undefined ? Math.max(0, num(radiusRaw, 0)) : polar ? polar.radius : 0,
  };
}

/** 只有 x 与 z 都在时才当成一个平面点；单独的 y 是高度，不是位置。 */
function readPlanarPoint(raw) {
  if (raw.x === undefined || raw.z === undefined) return null;
  return { x: num(raw.x), y: num(raw.y), z: num(raw.z) };
}

function readEnemy(raw, order) {
  if (!raw || typeof raw !== "object") return null;

  const lane = laneIndex(firstDefined(raw, ["lane", "laneIndex", "ring", "track"]));
  const polar = readEnemyPolar(raw);
  if (!polar) return null;

  const { theta, radius } = polar;
  const yRaw = firstDefined(raw, ["y", "height"]);
  const y = yRaw === undefined ? laneHeight(lane) : num(yRaw, laneHeight(lane));

  const hp = num(firstDefined(raw, ["hp", "health"]), 1);
  const hpMax = Math.max(1e-6, num(firstDefined(raw, ["hpMax", "maxHp", "hpTotal"]), hp || 1));
  const shape = resolveEnemyShape(firstDefined(raw, ["kind", "type", "archetype", "shape"]), lane);
  const elite = truthyFlag(firstDefined(raw, ["elite", "isElite", "boss"]));

  const idRaw = firstDefined(raw, ["id", "uid", "eid"]);
  const id = idRaw === undefined ? order : idRaw;
  const seed = typeof id === "number" ? Math.abs(Math.round(id)) : hashString(String(id));

  const scale = Math.max(0.25, num(firstDefined(raw, ["scale", "size"]), elite ? 1.7 : 1));

  return {
    id,
    seed,
    lane,
    theta,
    radius,
    y,
    shape,
    elite,
    scale,
    hpRatio: Math.min(1, Math.max(0, hp / hpMax)),
  };
}

/**
 * 把 getView() 的任意形状读成渲染层的稳定结构。
 * 输出里没有 shots：曳光归 src/combat，世界层画了就会和它重影。
 * @param {*} view
 */
export function normalizeView(view) {
  const src = view && typeof view === "object" ? view : {};
  const coreMax = Math.max(1e-6, num(firstDefined(src, ["coreMax", "coreHpMax", "coreMaxHp"]), 1));
  const coreHpRaw = firstDefined(src, ["coreHp", "core", "hp"]);
  const coreHp = coreHpRaw === undefined ? coreMax : num(coreHpRaw, coreMax);

  const socketsSrc = Array.isArray(src.sockets) ? src.sockets : [];
  const sockets = new Array(SOCKET_COUNT);
  for (let i = 0; i < SOCKET_COUNT; i += 1) sockets[i] = readSocket(socketsSrc[i], i);

  const enemiesSrc = Array.isArray(src.enemies) ? src.enemies : [];
  const enemies = [];
  for (let i = 0; i < enemiesSrc.length; i += 1) {
    const enemy = readEnemy(enemiesSrc[i], i);
    if (enemy) enemies.push(enemy);
  }

  const hoverRaw = firstDefined(src, ["hoverSocket", "hoveredSocket", "hover"]);
  const selectedRaw = firstDefined(src, ["selectedSocket", "selection", "activeSocket"]);

  return {
    coreHp,
    coreMax,
    coreRatio: Math.min(1, Math.max(0, coreHp / coreMax)),
    wave: Math.max(0, Math.round(num(src.wave, 0))),
    paused: truthyFlag(src.paused),
    sockets,
    enemies,
    hoverSocket: hoverRaw === undefined ? null : wrapSocket(num(hoverRaw, 0)),
    selectedSocket: selectedRaw === undefined ? null : wrapSocket(num(selectedRaw, 0)),
    laneY: LANE_Y,
  };
}
