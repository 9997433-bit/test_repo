/**
 * 仙府产出总账。全府只有两条产出通道，别处不要再自算：
 *
 * 1. 资源通道（`produce`）：`baseYield × levelScale(等级) × 驻守弟子 × 邻接 × 府邸光环`，
 *    再加一份与建筑无关的天地灵气；`opts.efficiency` 只在离线折算时不为 1。
 * 2. 修业通道（`scriptureXpPerSec` / `scriptureXpAward`）：藏经楼一类建筑每秒产
 *    「修业」，按楼级线性，不吃邻接与府邸光环，也永不写进资源表。
 *
 * 修业与专业的边界（AD-17 仙府侧口径）：本层只产修业，从不产 `profession`。
 * 修业条满仅代表「可晋阶」，晋阶的丹药灵草仍由 `TRAIN` 支付，藏经楼不发免费晋阶。
 * 谁领修业也在本层写死：只有驻在该藏经楼的那名弟子领（`def.staff = 1`），
 * 闲云与他岗弟子一律为 0，见 `scriptureXpFor`。
 */
import { buildingDef, effectiveLevel, levelScale, normalizeLevel, xpAt, yieldAt } from "./buildings.js";
import { adjacencyOnGrid, adjacencyDetailOnGrid, mansionLevel, occupancy } from "./layout.js";
import { yieldMultiplier } from "../disciples/assign.js";

export const RESOURCE_KEYS = ["qi", "herb", "wood", "ore", "stone", "pills", "jade"];

/** 洞府仙居每高一级，全府产出 +3%；Lv.1 为 1.0。 */
export const MANSION_AURA_PER_LEVEL = 0.03;

/** 挂机结算效率：底 50%，每级聚灵阵 +6%，封顶 90%。 */
export const OFFLINE_BASE = 0.5;
export const OFFLINE_PER_ARRAY_LEVEL = 0.06;
export const OFFLINE_CAP = 0.9;

/** 抬高离线效率的建筑类型；换建筑只改这里。 */
export const OFFLINE_ARRAY_TYPE = "array";

function emptyLedger() {
  const out = {};
  for (const k of RESOURCE_KEYS) out[k] = 0;
  return out;
}

/** 允许传整个 state，也允许直接传建筑数组；坏档一律退化成空府而不是抛错。 */
function buildingsOf(input) {
  if (Array.isArray(input)) return input.filter(Boolean);
  const list = input?.buildings;
  return Array.isArray(list) ? list.filter(Boolean) : [];
}

/**
 * 时长归一：NaN、Infinity 与时钟回拨（负数）都收敛到 0。
 * 全层只有这一个 dt 入口，`produce` / `produceBreakdown` / `scriptureXpAward` /
 * `offlineReport` 都先过它，故仙府层永不会结算出负产出或 NaN 产出。
 */
function seconds(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** 结算效率：缺省即在线满效率 1；给了就取值，负数与 NaN 收敛到 0。 */
function efficiencyOf(opts) {
  const n = Number(opts?.efficiency);
  return Number.isFinite(n) ? Math.max(0, n) : 1;
}

/** 当前府级：产量、修业、邻接三条链共用同一个府级快照，免得同一 tick 内取到两个值。 */
function homeLevel(buildings) {
  return mansionLevel(buildingsOf(buildings));
}

/** 乘区与产出的兜底：坏档弟子（profession: NaN）不该把整张账污染成 NaN。 */
function positive(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function mansionAura(buildings) {
  return 1 + MANSION_AURA_PER_LEVEL * (normalizeLevel(mansionLevel(buildingsOf(buildings))) - 1);
}

/** 天地自生灵气：与建筑无关的境界底产。 */
export function ambientQi(state) {
  const realmIndex = Number(state?.realm?.index);
  return 0.15 + (Number.isFinite(realmIndex) && realmIndex > 0 ? realmIndex : 0) * 0.08;
}

/**
 * 逐座建筑算产量：弟子 × 等级 × 邻接 × 府邸光环。
 * 占位表只建一次，邻接查询在同一张表上完成。
 * 等级一律取 `effectiveLevel`：超出洞府上限的建筑（篡改档）按上限结算而不是按档里的数，
 * 读档侧的收敛另有其人，仙府层先保证自己这张账干净。
 */
function productionRows(state) {
  const buildings = buildingsOf(state);
  const disciples = Array.isArray(state?.disciples) ? state.disciples : [];
  const grid = occupancy(buildings);
  const aura = mansionAura(buildings);
  const home = homeLevel(buildings);
  const rows = [];
  for (const b of buildings) {
    const def = buildingDef(b.type);
    if (!def || !Object.keys(def.baseYield).length) continue;
    const level = effectiveLevel(b, home);
    const worker = disciples.find((d) => d?.buildingId === b.id) ?? null;
    const workerMul = positive(yieldMultiplier(worker, b), 1);
    const levelMul = levelScale(level);
    const adjacency = positive(adjacencyOnGrid(grid, b.x, b.y, b.type), 1);
    const bonus = workerMul * adjacency * aura;
    const perSec = {};
    for (const [k, v] of Object.entries(yieldAt(b.type, level))) perSec[k] = positive(v * bonus, 0);
    rows.push({
      id: b.id,
      type: b.type,
      name: def.name,
      level,
      levelCapped: level < normalizeLevel(b.level),
      x: b.x,
      y: b.y,
      worker: worker?.name ?? null,
      workerMul,
      levelMul,
      adjacency,
      aura,
      multiplier: levelMul * bonus,
      perSec,
    });
  }
  return rows;
}

/**
 * 全府产出结算。返回资源增量，输入不被修改。
 * `opts.efficiency` 用于离线折算，默认 1（在线满效率）。
 */
export function produce(state, dtSec, opts = {}) {
  const dt = seconds(dtSec);
  const efficiency = efficiencyOf(opts);
  const add = emptyLedger();
  for (const row of productionRows(state)) {
    for (const [k, v] of Object.entries(row.perSec)) {
      add[k] = (add[k] ?? 0) + v * dt * efficiency;
    }
  }
  add.qi += ambientQi(state) * dt * efficiency;
  return add;
}

/** 每秒速率，给 HUD 与府报直接用。 */
export function productionRates(state) {
  return produce(state, 1);
}

/**
 * 产量明细：每座建筑的乘区拆解与本段时间的实际产出，外加天地灵气一行。
 * `rows` 只列资源建筑；藏经楼一类只出修业的建筑单独走 `xp` 段，
 * 免得界面把「没有资源产出」误读成「这座楼没在干活」。
 */
export function produceBreakdown(state, dtSec = 1, opts = {}) {
  const dt = seconds(dtSec);
  const efficiency = efficiencyOf(opts);
  const grid = occupancy(buildingsOf(state));
  const rows = productionRows(state).map((row) => {
    const out = {};
    for (const [k, v] of Object.entries(row.perSec)) out[k] = v * dt * efficiency;
    return { ...row, out, sources: adjacencyDetailOnGrid(grid, row.x, row.y, row.type).sources };
  });
  const ambient = ambientQi(state) * dt * efficiency;
  const xpRows = scriptureXpRows(state).map((row) => ({ ...row, out: row.perSec * dt }));
  return {
    dtSec: dt,
    efficiency,
    rows,
    ambient: { qi: ambient },
    // 修业不折算离线效率：离线是否补发修业由 disciples 层定，仙府层只报速率。
    // perSec 是府级口径（只按楼级），awarded 是真正落到弟子头上的量（空置的楼不计）。
    xp: {
      perSec: xpRows.reduce((sum, row) => sum + row.base, 0),
      awarded: xpRows.reduce((sum, row) => sum + (row.workerId ? row.perSec : 0), 0),
      rows: xpRows,
    },
    total: produce(state, dt, { efficiency }),
  };
}

/* ------------------------------------------------------------------ 修业 */

/** 产修业的建筑（当前只有藏经楼），坏档条目已滤掉。 */
export function xpBuildings(state) {
  return buildingsOf(state).filter((b) => (buildingDef(b.type)?.xpPerSec ?? 0) > 0);
}

/**
 * 逐座藏经楼的修业账：
 * - `base` 只看楼级（`xpAt`），即府级面板展示的口径；
 * - `perSec` 再乘驻守弟子的专业加成（`yieldMultiplier`，藏经研习每级专业 +8%），
 *   空置的楼 `workerId` 为 null、`perSec` 等于 `base`，但没有领取人。
 */
export function scriptureXpRows(state) {
  const disciples = Array.isArray(state?.disciples) ? state.disciples : [];
  const home = homeLevel(state);
  return xpBuildings(state).map((b) => {
    const level = effectiveLevel(b, home);
    const base = positive(xpAt(b.type, level), 0);
    const worker = disciples.find((d) => d?.buildingId === b.id) ?? null;
    const workerMul = positive(yieldMultiplier(worker, b), 1);
    return {
      id: b.id,
      type: b.type,
      name: buildingDef(b.type)?.name ?? b.type,
      level,
      levelCapped: level < normalizeLevel(b.level),
      base,
      workerId: typeof worker?.id === "string" && worker.id ? worker.id : null,
      worker: worker?.name ?? null,
      workerMul,
      perSec: positive(worker ? base * workerMul : base, 0),
    };
  });
}

/** 府级修业速率（Σ 楼级基准），与 `disciples/train.js#scriptureRate` 同口径。 */
export function scriptureXpPerSec(state) {
  return scriptureXpRows(state).reduce((sum, row) => sum + row.base, 0);
}

/**
 * 这名弟子每秒实得的修业。不驻藏经楼即为 0 —— 藏经楼的产出发给楼里的人，
 * 不再普发给「任意已派遣弟子」（AD-17）。
 */
export function scriptureXpFor(state, disciple) {
  const buildingId = disciple?.buildingId;
  if (!buildingId) return 0;
  const hall = xpBuildings(state).find((b) => b.id === buildingId);
  if (!hall) return 0;
  const level = effectiveLevel(hall, homeLevel(state));
  return positive(xpAt(hall.type, level) * positive(yieldMultiplier(disciple, hall), 1), 0);
}

/**
 * dt 秒内应发的修业，键为弟子 id；`disciples` 层照单发放即可。
 * 只出「修业」这一种数值，晋阶与其代价不在本层。
 *
 * 调用方契约（TICK / 离线补发都按这份签名接线，本函数不再变形）：
 * - 入参 `dtSec` 为秒。NaN、Infinity、负数（时钟回拨）一律当 0 处理，返回 `{}`；
 * - 返回值是新建的普通对象，键为弟子 id、值恒为有限正数，永不含 0 与负数；
 * - 空府、坏档、无人驻楼都返回 `{}`，不抛错；
 * - 只发修业。修业条满仅代表「可晋阶」，免费晋阶不在此发生（AD-17）。
 */
export function scriptureXpAward(state, dtSec) {
  const dt = seconds(dtSec);
  const out = {};
  if (dt <= 0) return out;
  for (const row of scriptureXpRows(state)) {
    if (!row.workerId) continue;
    const gain = positive(row.perSec * dt, 0);
    if (gain <= 0) continue;
    out[row.workerId] = (out[row.workerId] ?? 0) + gain;
  }
  return out;
}

/* ------------------------------------------------------- 离线结算效率 */

/**
 * 离线效率的唯一出处：BOOT / RESUME / 挂机匣都读这里，别在别处复算百分比。
 *
 * 调用方契约（`core/offline.js` 的能力探测按这份签名接线，本函数不再变形）：
 * - 入参可以是 state，也可以直接是建筑数组，还可以是 null / undefined / 坏档；
 * - 返回值恒为 [OFFLINE_BASE, OFFLINE_CAP] 内的有限数，空府与缺字段都是底 50%；
 * - 聚灵阵等级按 `effectiveLevel` 取，篡改档堆不出超过 90% 的效率；
 * - 永不抛错，故上游的「契约缺席退满效率」分支只会在真的没有本导出时触发。
 */
export function offlineEfficiency(input) {
  return offlineEfficiencyDetail(input).efficiency;
}

/** 效率拆解：挂机匣要展示「聚灵阵 N 级 → 结算 74%」时用这份。 */
export function offlineEfficiencyDetail(input) {
  const buildings = buildingsOf(input);
  const home = mansionLevel(buildings);
  const arrays = buildings.filter((b) => b.type === OFFLINE_ARRAY_TYPE);
  const levels = arrays.reduce((sum, b) => sum + effectiveLevel(b, home), 0);
  const raw = OFFLINE_BASE + OFFLINE_PER_ARRAY_LEVEL * levels;
  const efficiency = Math.min(OFFLINE_CAP, Math.max(OFFLINE_BASE, raw));
  const next = Math.min(OFFLINE_CAP, Math.max(OFFLINE_BASE, raw + OFFLINE_PER_ARRAY_LEVEL));
  return {
    efficiency,
    percent: Math.round(efficiency * 100),
    base: OFFLINE_BASE,
    perLevel: OFFLINE_PER_ARRAY_LEVEL,
    cap: OFFLINE_CAP,
    arrays: arrays.length,
    levels,
    capped: raw >= OFFLINE_CAP,
    nextLevelGain: Math.max(0, next - efficiency),
  };
}

/**
 * 离线这段时间的实收产出：等于在线产出 × `offlineEfficiency`。
 * 显式传入的 `opts.efficiency` 会被夹到 [0, 1]：挂机再肥也不该超过在线满效率。
 */
export function offlineProduce(state, elapsedSec, opts = {}) {
  const efficiency =
    opts.efficiency === undefined ? offlineEfficiency(state) : Math.min(1, efficiencyOf(opts));
  return produce(state, elapsedSec, { efficiency });
}

/**
 * 一次离线结算的完整口供：实收、满效率对照、被效率吃掉的那部分。
 * 给 BOOT 落账与挂机匣文案共用，保证两处说的是同一个数。
 */
export function offlineReport(state, elapsedSec) {
  const sec = seconds(elapsedSec);
  const detail = offlineEfficiencyDetail(state);
  const gain = produce(state, sec, { efficiency: detail.efficiency });
  const online = produce(state, sec);
  const forgone = {};
  for (const k of RESOURCE_KEYS) forgone[k] = (online[k] ?? 0) - (gain[k] ?? 0);
  return { seconds: sec, efficiency: detail.efficiency, detail, gain, online, forgone };
}

/** 把产出增量并入资源表，返回新对象；非有限数值直接跳过。 */
export function applyYield(resources, add) {
  const next = { ...resources };
  for (const [k, v] of Object.entries(add ?? {})) {
    if (!Number.isFinite(v)) continue;
    next[k] = (next[k] ?? 0) + v;
  }
  return next;
}

/**
 * 建筑给全队的战力加成：丹房 +4 攻/级，锻造房 +3 攻/级，取自建筑定义。
 */
export function combatBuildingBonus(buildings) {
  const list = buildingsOf(buildings);
  const home = mansionLevel(list);
  const total = { atk: 0 };
  for (const b of list) {
    const bonus = buildingDef(b.type)?.combatBonus;
    if (!bonus) continue;
    const level = effectiveLevel(b, home);
    for (const [k, v] of Object.entries(bonus)) total[k] = (total[k] ?? 0) + positive(v * level, 0);
  }
  return total;
}

/** 战力加成的来源清单，战报与仙府面板可逐条列出。 */
export function combatBonusSources(buildings) {
  const list = buildingsOf(buildings);
  const home = mansionLevel(list);
  const rows = [];
  for (const b of list) {
    const def = buildingDef(b.type);
    if (!def?.combatBonus) continue;
    const level = effectiveLevel(b, home);
    const gain = {};
    for (const [k, v] of Object.entries(def.combatBonus)) gain[k] = positive(v * level, 0);
    rows.push({ id: b.id, type: b.type, name: def.name, level, gain });
  }
  return rows;
}
