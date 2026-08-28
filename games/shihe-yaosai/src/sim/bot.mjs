// 确定性自动指挥官：给冒烟/探针用的「会打的手」，不含任何渲染或浏览器依赖。
//
// 每次有钱就把「性价比最高的 (塔, 插座) 组合」摆下去，再定时过载。
// 评分是两项之和，都换算成「每点屑晶换回多少预期伤害」：
//   1) 眼前这批敌人的预期伤害（受射程停留时间、克制表、并发目标数、剩余血量约束）
//   2) 整环威胁图的预期伤害——出怪弧每波随机，所以先验假设 N 段弧 × 3 轨道都可能来人，
//      再按实际观测加权。没有这一项，bot 会拿霰星把第一段弧堆成刺猬，其余方向门户大开。
// 它因此会自己学会：先用长射程把环铺开，蜂群补霰星，力场补棱镜，甲壳补轨炮。
import { resolveCounters, resolveTowerLevels, resolveTowers } from "./config.js";
import { createRng, nextInt } from "./rng.js";

export const BOT_DT = 1 / 60;

// 这个模块只给冒烟/探针用，但它躺在 src/sim 里，别假设一定跑在 node 上。
const ENV = typeof process !== "undefined" && process.env ? process.env : {};

const TOWERS = resolveTowers();
const TOWER_LEVELS = resolveTowerLevels();
const TOWER_IDS = Object.keys(TOWERS);
const COUNTERS = resolveCounters();

const INTERCEPT_RADIUS = 34; // 威胁图里虚拟敌人的拦截半径
const HEAT_HALFLIFE_SEC = 20;
const HEAT_PRIOR = 0.4; // 每个 (轨道, 弧段, 护甲) 的先验威胁
const RING_BIAS = Number(ENV.SH_RING_BIAS || 0.5); // 整环威胁相对眼前敌人的权重
const ARMORS = ["shell", "shield", "swarm"];
const TYPICAL_SPEED = 2.6;

const MARGINAL_REF = Number(ENV.SH_MARGINAL_REF || 40); // 覆盖到这个量级后同一处再加塔收益减半
const VALUE_FLOOR = Number(ENV.SH_VALUE_FLOOR || 1.3); // 每点屑晶至少换回这么多预期伤害才下手，否则攒钱
const PLACE_GAP_SEC = 1; // 落塔后的观察间隔：先看效果再补第二座
const RETHINK_SEC = 0.25; // 没下手时的重算间隔，省得每 tick 扫 72 格威胁图

export { TOWERS as BOT_TOWERS, TOWER_IDS as BOT_TOWER_IDS, VALUE_FLOOR };

export function createBot(seed, view) {
  const bot = { rng: createRng(`bot:${seed}`), nextOverclock: 12, heat: [], nextPlaceT: 0 };
  const buckets = view.sockets.length;
  for (let lane = 0; lane < view.laneY.length; lane += 1) {
    for (let bucket = 0; bucket < buckets; bucket += 1) {
      const angle = (bucket / buckets) * Math.PI * 2;
      bot.heat.push({
        lane,
        bucket,
        x: Math.cos(angle) * INTERCEPT_RADIUS,
        y: view.laneY[lane],
        z: Math.sin(angle) * INTERCEPT_RADIUS,
        radius: view.spawnRadius,
        speed: TYPICAL_SPEED,
        armor: { shell: HEAT_PRIOR, shield: HEAT_PRIOR, swarm: HEAT_PRIOR },
        slack: { shell: 1, shield: 1, swarm: 1 },
      });
    }
  }
  return bot;
}

export function leakWeightOf(sizeClass) {
  if (sizeClass === "boss") return 20;
  if (sizeClass === "elite") return 8;
  if (sizeClass === "mid") return 3;
  return 1;
}

export function observeThreat(bot, view, dt) {
  const decay = Math.pow(0.5, dt / HEAT_HALFLIFE_SEC);
  const buckets = view.sockets.length;
  for (const cell of bot.heat) {
    for (const armor of ARMORS) {
      cell.armor[armor] = HEAT_PRIOR + (cell.armor[armor] - HEAT_PRIOR) * decay;
    }
  }
  for (const e of view.enemies) {
    const bucket = ((Math.round((e.theta / (Math.PI * 2)) * buckets) % buckets) + buckets) % buckets;
    const cell = bot.heat[e.lane * buckets + bucket];
    if (!cell || cell.armor[e.armor] === undefined) continue;
    cell.armor[e.armor] += leakWeightOf(e.sizeClass) * dt;
    cell.speed = e.speed > 0 ? e.speed : cell.speed;
  }
}

export function dpsAgainst(spec, armor) {
  const mul = COUNTERS[spec.id] ? COUNTERS[spec.id][armor] || 1 : 1;
  if (spec.kind === "beam" || spec.kind === "aura") return spec.dps * mul;
  return spec.damage * spec.rate * mul;
}

/** 敌人越近星核、漏了越疼，越该优先拦。 */
function threat(enemy, spawnRadius) {
  const progress = Math.max(0, Math.min(1, (spawnRadius - enemy.radius) / Math.max(1, spawnRadius)));
  return (1 + enemy.leakWeight) * (0.35 + progress);
}

/**
 * 敌人沿半径直冲星核，所以一座塔对它的价值 = 它还会在射程里待多久。
 * 解 |socket - enemy(r)|² ≤ range² 得到 r 的区间，与 [coreRadius, 当前半径] 求交。
 * 这一项让评分自动把「射程」算进性价比，而不是只看 dps/造价。
 */
export function exposureSeconds(socket, spec, target, view) {
  const ring = Math.hypot(socket.x, socket.z);
  const dTheta = Math.atan2(target.z, target.x) - Math.atan2(socket.z, socket.x);
  const sin = Math.sin(dTheta);
  const cos = Math.cos(dTheta);
  const dy = target.y - socket.y;
  const disc = spec.range * spec.range - dy * dy - ring * ring * sin * sin;
  if (disc <= 0) return 0;
  const half = Math.sqrt(disc);
  const lo = Math.max(view.coreRadius, ring * cos - half);
  const hi = Math.min(target.radius, ring * cos + half);
  if (hi <= lo) return 0;
  return (hi - lo) / Math.max(0.05, target.speed);
}

/** 某处已经被多少「预期伤害」覆盖：边际收益递减，逼着 bot 摊开而不是堆一坨。 */
function coverageAt(view, target, armor) {
  let total = 0;
  for (const socket of view.sockets) {
    const spec = specAt(socket);
    if (!spec) continue;
    total += dpsAgainst(spec, armor) * exposureSeconds(socket, spec, target, view);
  }
  return total;
}

/** 插座当前等级的数值；空座返回 null。 */
function specAt(socket) {
  if (!socket.towerId) return null;
  const levels = TOWER_LEVELS[socket.towerId];
  if (!levels) return null;
  return levels[Math.min(levels.length, Math.max(1, socket.level || 1)) - 1] || null;
}

function nextSpecAt(socket) {
  if (!socket.towerId) return null;
  const levels = TOWER_LEVELS[socket.towerId];
  const level = Math.max(1, socket.level || 1);
  if (!levels || level >= levels.length) return null;
  return levels[level];
}

/** 一座塔同时能压制几个目标。 */
function concurrency(spec, covered) {
  if (spec.kind === "aura") return covered;
  if (spec.kind === "burst") return Math.min(covered, spec.maxTargets);
  return 1;
}

/**
 * @param {object} bot
 * @param {object} view
 * @param {{towers?:string[], socket?:(i:number)=>boolean, budget?:number}} [limit]
 *   只在给定塔型/插座/预算里挑（战斗冒烟用来凑齐五种弹道，同时给下一座塔留钱）
 */
export function bestPlacement(bot, view, limit) {
  const allowTowers = limit && Array.isArray(limit.towers) ? limit.towers : TOWER_IDS;
  const allowSocket = limit && typeof limit.socket === "function" ? limit.socket : null;
  const budget = limit && Number.isFinite(limit.budget) ? Math.min(limit.budget, view.scrap) : view.scrap;

  const live = view.enemies.map((e) => ({
    x: e.x,
    y: e.y,
    z: e.z,
    armor: e.armor,
    radius: e.radius,
    speed: e.speed,
    hp: e.hp,
    leakWeight: leakWeightOf(e.sizeClass),
  }));

  // 开局那 180 屑晶只够两座塔，盲铺会有一半概率押错弧、首波零收入直接雪崩。
  // 所以第一只怪出现之前一律不动手：等入侵弧亮出来再落塔。
  if (live.length === 0 && view.stats.spawned === 0) return null;

  for (const e of live) e.slack = 1 / (1 + coverageAt(view, e, e.armor) / MARGINAL_REF);
  let ringTotal = 0;
  for (const cell of bot.heat) {
    for (const armor of ARMORS) {
      cell.slack[armor] = 1 / (1 + coverageAt(view, cell, armor) / MARGINAL_REF);
      ringTotal += cell.armor[armor] * cell.slack[armor];
    }
  }
  if (ringTotal <= 0) return null;

  // 「这座塔摆在这个插座上，预计能打出多少伤害」——量纲统一，建塔与升级可以直接比。
  const scoreOf = (spec, socket) => {
    let throughput = 0;
    let available = 0;
    let covered = 0;
    for (const e of live) {
      const exposure = exposureSeconds(socket, spec, e, view);
      if (exposure <= 0) continue;
      covered += 1;
      const weight = threat(e, view.spawnRadius) * e.slack;
      throughput += dpsAgainst(spec, e.armor) * exposure * weight;
      available += e.hp * weight;
    }
    // 单体塔一次只能打一个，霰星一发打 maxTargets 个，坠井全覆盖：按并发数折算；
    // 再怎么高的 DPS 也打不出超过对面血条的伤害，所以拿血量总量封顶。
    const liveScore = covered > 0 ? Math.min((throughput * concurrency(spec, covered)) / covered, available) : 0;

    // 整环项：权重归一到 1，量纲同样是「预期伤害」，可以直接跟眼前项相加。
    let ringScore = 0;
    for (const cell of bot.heat) {
      const exposure = exposureSeconds(socket, spec, cell, view);
      if (exposure <= 0) continue;
      for (const armor of ARMORS) {
        ringScore += dpsAgainst(spec, armor) * exposure * cell.armor[armor] * cell.slack[armor];
      }
    }
    return liveScore + (ringScore / ringTotal) * RING_BIAS;
  };

  let best = null;
  const consider = (value, pick) => {
    if (value > 0 && (best === null || value > best.value)) best = { value, ...pick };
  };

  for (const towerId of allowTowers) {
    const spec = TOWERS[towerId];
    if (!spec || spec.cost > budget) continue;
    for (const socket of view.sockets) {
      if (socket.towerId) continue;
      if (allowSocket && !allowSocket(socket.i)) continue;
      consider(scoreOf(spec, socket) / spec.cost, { socket: socket.i, towerId, upgrade: false });
    }
  }

  // 环插满之后钱就只能往已有的塔上砸：升级按「多打出来的伤害 / 升级价」计分，
  // 跟建新塔用同一把尺，所以同一个 VALUE_FLOOR 就能管住两种花法。
  if (!limit || limit.upgrades !== false) {
    for (const socket of view.sockets) {
      const spec = specAt(socket);
      const next = nextSpecAt(socket);
      if (!spec || !next || next.cost > budget) continue;
      if (allowSocket && !allowSocket(socket.i)) continue;
      const gain = scoreOf(next, socket) - scoreOf(spec, socket);
      consider(gain / next.cost, { socket: socket.i, towerId: socket.towerId, upgrade: true });
    }
  }
  return best;
}

/** 敌群质心所在的插座下标；场上没怪时返回 null。 */
export function crowdSocket(view) {
  if (view.enemies.length === 0) return null;
  let sx = 0;
  let sz = 0;
  for (const e of view.enemies) {
    const w = 1 + (60 - e.radius) * 0.05; // 越靠近星核越要紧
    sx += Math.cos(e.theta) * w;
    sz += Math.sin(e.theta) * w;
  }
  if (sx === 0 && sz === 0) return null;
  const theta = Math.atan2(sz, sx);
  const count = view.sockets.length;
  return ((Math.round((theta / (Math.PI * 2)) * count) % count) + count) % count;
}

/** 从 center 向两侧螺旋找一个空插座；全满返回 null。 */
export function freeSocketNear(view, center) {
  const count = view.sockets.length;
  for (let d = 0; d < count; d += 1) {
    for (const idx of d === 0 ? [center] : [center + d, center - d]) {
      const i = ((idx % count) + count) % count;
      if (!view.sockets[i].towerId) return i;
    }
  }
  return null;
}

/**
 * 一帧的指令。每帧只能调用一次：它会推进威胁图与内部计时。
 * @param {{limit?:object, valueFloor?:number, fallbackLimit?:object, skipPlace?:boolean}} [options]
 *   limit 透传给 bestPlacement；valueFloor 放宽门槛（战斗冒烟要凑齐五种弹道）；
 *   fallbackLimit = limit 买不动时的第二套限制；skipPlace = 这一帧只攒钱不落塔。
 */
export function botInput(bot, view, options) {
  const opts = options || {};
  const limited = Number.isFinite(opts.valueFloor) ? opts.valueFloor : VALUE_FLOOR;
  const input = {};
  observeThreat(bot, view, BOT_DT);
  if (!opts.skipPlace && view.time >= bot.nextPlaceT) {
    let pick = bestPlacement(bot, view, opts.limit);
    let floor = opts.limit ? limited : VALUE_FLOOR;
    if (opts.limit && opts.fallbackLimit && (!pick || pick.value < floor)) {
      pick = bestPlacement(bot, view, opts.fallbackLimit);
      floor = VALUE_FLOOR;
    }
    if (pick && pick.value >= floor) {
      if (pick.upgrade) input.upgradeSocket = pick.socket;
      else input.place = { socket: pick.socket, towerId: pick.towerId };
      bot.nextPlaceT = view.time + PLACE_GAP_SEC;
    } else {
      bot.nextPlaceT = view.time + RETHINK_SEC;
    }
  }
  if (view.time >= bot.nextOverclock) {
    const armed = view.sockets.filter((s) => s.towerId && s.overclockT === 0 && s.overheatT === 0);
    if (armed.length > 0) {
      input.overclockSocket = armed[nextInt(bot.rng, armed.length)].i;
      bot.nextOverclock = view.time + 9;
    } else {
      bot.nextOverclock = view.time + 2;
    }
  }
  return input;
}
