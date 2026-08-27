// 皮肤目录（壳层视角）。
//
// 真表由 Fable-3 的 `src/data/skins.js` 提供（导出 SKINS / SKIN_BY_ID / DEFAULT_SKIN_ID），
// Round 2 已合入：`resolveSkins(dataModule)` 现在返回 `source:'data'`、默认 `drifter`。
// 下面这张兜底表只在 data 缺席 / 形状不对时上场（大厅、存档、roster 照样能选皮肤）。
//
// **场上两种形状**，壳层两种都得认（契约 §3.2 冻结的是前者）：
//   真表（枚举组合）   build 'slim'|'stock'|'broad' · headgear 六选一 · back 三选一 ·
//                     palette{cloth,clothDim,leather,accent,skin} · trim 微调参
//   兜底表（比例数值） build{height,mass,shoulder} · cloth/trim/accent · accessory
// 消费端（大厅剪影）不该分头写两套读法：一律先过 `skinAppearance()` 归一成
// 同一份外观模型 —— 真表来了照样画得出六套可辨剪影，兜底表也不退化成灰胶囊。
// 禁止贴图包与版权素材：区分度全部来自剪影比例 + 部件 + 配色。

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

// ---------------- 外观归一 ----------------

/** 契约 §3.2 的体型档 → 剪影比例。数值只服务于「一眼分得出」，不进任何战斗计算。 */
export const BUILD_SCALE = Object.freeze({
  slim: Object.freeze({ height: 1.08, mass: 0.84, shoulder: 0.9 }),
  stock: Object.freeze({ height: 1, mass: 1.02, shoulder: 1.02 }),
  broad: Object.freeze({ height: 0.96, mass: 1.24, shoulder: 1.28 }),
});

export const HEADGEARS = Object.freeze(["hood", "bare", "topknot", "strawHat", "mask", "horns"]);
export const BACKS = Object.freeze(["panel", "banner", "pack"]);

const HEX = /^#[0-9a-f]{6}$/i;
const NEUTRAL = Object.freeze({
  cloth: "#6d7280",
  clothDim: "#3d4450",
  leather: "#5b4a3a",
  accent: "#d9cfba",
  skin: "#c9a184",
});

function hex(v, fallback) {
  return typeof v === "string" && HEX.test(v.trim()) ? v.trim() : fallback;
}

function scale(v, lo, hi, fallback) {
  return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : fallback;
}

function trimNumbers(trim) {
  if (!trim || typeof trim !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(trim)) {
    if (Number.isFinite(v)) out[k] = v;
  }
  return out;
}

/**
 * 皮肤 → 外观模型。真表（枚举组合）与兜底表（比例数值）都吃，输出一份形状：
 *
 *   buildTier  'slim'|'stock'|'broad'|null   真表的体型档，兜底表没有
 *   build      { height, mass, shoulder }    剪影比例（真表由 BUILD_SCALE 翻译而来）
 *   headgear   契约六选一，认不出落 'bare'
 *   back       'panel'|'banner'|'pack'|null  兜底表没有背件就是 null
 *   accessory  兜底表的配件形制（hood/bracer/sash…），真表为 null
 *   palette    五段 hex，缺一段就补同族中性色（绝不返回 undefined 当颜色用）
 *   trim       只留有限数的微调参，其余丢掉
 *
 * 只读不改：入参对象（真表是 deepFreeze 的）一个字段都不会被写回。
 *
 * @param {object|null} skin
 * @returns {{id:string|null, name:string, desc:string, buildTier:string|null,
 *            build:{height:number,mass:number,shoulder:number},
 *            headgear:string, back:string|null, accessory:string|null,
 *            palette:{cloth:string,clothDim:string,leather:string,accent:string,skin:string},
 *            trim:Record<string,number>}}
 */
export function skinAppearance(skin) {
  const s = skin && typeof skin === "object" ? skin : {};
  const tier = typeof s.build === "string" && BUILD_SCALE[s.build] ? s.build : null;
  const legacyBuild = s.build && typeof s.build === "object" ? s.build : {};
  const base = tier ? BUILD_SCALE[tier] : null;

  const build = {
    height: scale(base ? base.height : legacyBuild.height, 0.85, 1.2, 1),
    mass: scale(base ? base.mass : legacyBuild.mass, 0.75, 1.35, 1),
    shoulder: scale(base ? base.shoulder : legacyBuild.shoulder, 0.8, 1.35, 1),
  };

  const p = s.palette && typeof s.palette === "object" ? s.palette : null;
  const palette = p
    ? {
        cloth: hex(p.cloth, NEUTRAL.cloth),
        clothDim: hex(p.clothDim, NEUTRAL.clothDim),
        leather: hex(p.leather, NEUTRAL.leather),
        accent: hex(p.accent, NEUTRAL.accent),
        skin: hex(p.skin, NEUTRAL.skin),
      }
    : {
        // 兜底表：cloth 是衣料、trim 是束带（同时充当暗部）、accent 是识别件
        cloth: hex(s.cloth, NEUTRAL.cloth),
        clothDim: hex(s.trim, NEUTRAL.clothDim),
        leather: hex(s.trim, NEUTRAL.leather),
        accent: hex(s.accent, NEUTRAL.accent),
        skin: NEUTRAL.skin,
      };

  return {
    id: nonEmptyString(s.id) ? s.id : null,
    name: nonEmptyString(s.name) ? s.name : nonEmptyString(s.id) ? s.id : "—",
    desc: typeof s.desc === "string" ? s.desc : "",
    buildTier: tier,
    build,
    headgear: HEADGEARS.includes(s.headgear) ? s.headgear : "bare",
    back: BACKS.includes(s.back) ? s.back : null,
    accessory: nonEmptyString(s.accessory) ? s.accessory : null,
    palette,
    // 真表的 trim 是数值微调参（hoodDepth/hornSpread…）；兜底表的 trim 是颜色，
    // 上面已经当颜色吃过了，这里的过滤会把它整条丢掉，不会混进几何。
    trim: trimNumbers(s.trim),
  };
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
