// 皮肤目录（壳层视角）。
//
// 真表由 Fable-3 的 `src/data/skins.js` 提供（导出 SKINS / SKIN_BY_ID / DEFAULT_SKIN_ID）。
// 那份数据这一轮还没合入，所以这里带一张同形状的兜底表：大厅、存档、roster
// 现在就能选皮肤，data 落地后 resolveSkins() 自动改吃真表，壳层不用再动。
//
// 字段是纯数据，渲染层按需读：
//   id / name / desc          — 标识与文案
//   build { height, mass, shoulder } — 剪影比例（低面数几何体的缩放，不是贴图）
//   cloth / trim / accent     — 三段配色（衣料 / 束带 / 识别件）
//   accessory                 — 配件形制（hood 兜帽、pauldron 肩胄、wrap 缠布…）
// 禁止贴图包与版权素材：区分度全部来自剪影比例 + 配色 + 配件。

export const DEFAULT_SKIN_ID = "ash";

export const FALLBACK_SKINS = Object.freeze([
  {
    id: "ash",
    name: "灰 烬",
    desc: "最寻常的挑战者。粗布短打，手上缠着旧布条。",
    build: { height: 1, mass: 1, shoulder: 1 },
    cloth: "#6d7280",
    trim: "#3d4450",
    accent: "#d9cfba",
    accessory: "wrap",
  },
  {
    id: "kiln",
    name: "窑 衣",
    desc: "陶窑里出来的人，厚护臂上一层洗不掉的窑灰。",
    build: { height: 0.97, mass: 1.18, shoulder: 1.14 },
    cloth: "#7a4a32",
    trim: "#2f2019",
    accent: "#e0a35a",
    accessory: "bracer",
  },
  {
    id: "reed",
    name: "苇 影",
    desc: "瘦长一条，斗篷下摆被岛风扯成苇叶。",
    build: { height: 1.08, mass: 0.86, shoulder: 0.92 },
    cloth: "#2f5b52",
    trim: "#17302c",
    accent: "#9fd8b8",
    accessory: "cloak",
  },
  {
    id: "mica",
    name: "云 母",
    desc: "肩上压着片状薄甲，走动时一层层错开。",
    build: { height: 1.02, mass: 1.1, shoulder: 1.26 },
    cloth: "#4a5675",
    trim: "#232b3f",
    accent: "#b9c7e6",
    accessory: "pauldron",
  },
  {
    id: "loam",
    name: "泥 行",
    desc: "矮壮、包头巾，脚踝上还带着台面下的泥。",
    build: { height: 0.92, mass: 1.24, shoulder: 1.06 },
    cloth: "#5c5230",
    trim: "#2b2716",
    accent: "#cbb872",
    accessory: "turban",
  },
  {
    id: "dusk",
    name: "暮 鸦",
    desc: "兜帽压得很低，只在转身时露出半张脸。",
    build: { height: 1.05, mass: 0.94, shoulder: 0.98 },
    cloth: "#3a3348",
    trim: "#1b1826",
    accent: "#8a6ec2",
    accessory: "hood",
  },
  {
    id: "brine",
    name: "咸 手",
    desc: "海边讨生活的，缠带发白，袖口全是盐渍。",
    build: { height: 1, mass: 1.04, shoulder: 1.08 },
    cloth: "#2c6377",
    trim: "#15303a",
    accent: "#e6e1cf",
    accessory: "sash",
  },
]);

function nonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function usableSkin(s) {
  return !!s && typeof s === "object" && nonEmptyString(s.id);
}

/**
 * 取皮肤表。data 模块给了就用真表，没给（或形状不对）就用兜底表。
 * @param {object|null} dataModule  src/data 的命名空间导入
 * @returns {{ skins: object[], byId: Record<string, object>, defaultId: string, source: "data"|"fallback" }}
 */
export function resolveSkins(dataModule) {
  const raw = dataModule && Array.isArray(dataModule.SKINS) ? dataModule.SKINS.filter(usableSkin) : [];
  const fromData = raw.length > 0;
  const skins = fromData ? raw : FALLBACK_SKINS;
  const byId =
    (fromData && dataModule.SKIN_BY_ID) || Object.fromEntries(skins.map((s) => [s.id, s]));
  const wanted = fromData && nonEmptyString(dataModule.DEFAULT_SKIN_ID) ? dataModule.DEFAULT_SKIN_ID : DEFAULT_SKIN_ID;
  const defaultId = byId[wanted] ? wanted : skins[0].id;
  return { skins, byId, defaultId, source: fromData ? "data" : "fallback" };
}

/**
 * 把任意来路的 skinId 收成表里真实存在的一个。
 * 旧档没有 skinId、或存了一个已被删掉的皮肤，都落到默认皮肤。
 */
export function normalizeSkinId(id, table) {
  const t = table || resolveSkins(null);
  if (nonEmptyString(id) && t.byId[id]) return id;
  return t.defaultId;
}

/**
 * 给整局分配皮肤：本人用玩家选的，bot 按人格 / 名次错开，避免全员同一胶囊。
 * 纯函数、无随机，同一份名单每次结果一致（回放与截图才对得上）。
 *
 * @param {Array<{id:string, kind?:string, persona?:string, skinId?:string}>} players
 * @param {{ selfId:string, selfSkinId?:string, table?:object, personaById?:object }} opts
 * @returns {Map<string, string>} playerId → skinId
 */
export function assignSkins(players, opts = {}) {
  const table = opts.table || resolveSkins(null);
  const selfId = opts.selfId || "p0";
  const selfSkin = normalizeSkinId(opts.selfSkinId, table);
  const personaById = opts.personaById || null;

  const out = new Map();
  const taken = new Set([selfSkin]);
  // 本人先占位，bot 从下一格开始轮，同一局里尽量不撞脸
  let cursor = Math.max(0, table.skins.findIndex((s) => s.id === selfSkin));

  for (const p of players || []) {
    if (!p || p.id == null) continue;
    if (p.id === selfId || p.kind === "human") {
      out.set(p.id, selfSkin);
      continue;
    }
    // sim / data 已经指定过就照办（persona.skinId 是 Opus-3 的接口）
    const persona = personaById && p.persona ? personaById[p.persona] : null;
    const declared = nonEmptyString(p.skinId) ? p.skinId : persona && persona.skinId;
    if (nonEmptyString(declared) && table.byId[declared]) {
      out.set(p.id, declared);
      taken.add(declared);
      continue;
    }
    let pick = null;
    for (let i = 1; i <= table.skins.length; i += 1) {
      const candidate = table.skins[(cursor + i) % table.skins.length];
      if (!taken.has(candidate.id)) {
        pick = candidate.id;
        cursor = (cursor + i) % table.skins.length;
        break;
      }
    }
    // 皮肤比人少才会走到这里：允许重复，但仍然错开一格
    if (!pick) {
      cursor = (cursor + 1) % table.skins.length;
      pick = table.skins[cursor].id;
    }
    taken.add(pick);
    out.set(p.id, pick);
  }
  return out;
}
