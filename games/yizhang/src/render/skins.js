// 皮肤 → 剪影。
//
// 「不是所有人都是同一根胶囊」这件事只能靠**形**来兑现：灰度化、去掉识别色之后，
// 站在 8 米外仍然要认得出谁是谁。所以这一层只产出两样东西：
//
//   build     —— 身高 / 体量 / 肩宽三个比例（缩放低面数几何体，不是换贴图）
//   accessory —— 一件配件的形制（兜帽 / 肩胄 / 斗篷 / 缠布 / 兽角 / 面具 / 护臂…）
//
// 皮肤表由壳层的 `src/core/skins.js` 给。调用方把 data 命名空间（或已经
// `resolveSkins` 过的表）喂进来，真表就上场；不喂则用兜底表（ash/kiln…）。
//
// 真表是契约枚举（build 'slim'|'stock'|'broad' · headgear · back · palette），
// 兜底表是比例数值（build{height,mass,shoulder} · accessory · cloth）。两种
// 形状一律先过 `skinAppearance()` 再映射成这一层的「比例 + 一件配件」。
// 表里没有的 id 走两条兜底：
//   1. EXTRA_LOOKS —— Bot 人格在真表缺席时的剪影（wildhorn/crane/nuo）
//   2. 字符串散列 —— 任何别的 id，按 id 算出一组稳定的比例与配件
// 两条兜底都是纯函数：同一个 id 每次结果一致，回放与截图对得上。
//
// 禁贴图包、禁版权素材：区分度全部来自比例与配件几何。

import { resolveSkins, skinAppearance } from '../core/skins.js';

/** 配件形制。每一种都是一段可读的轮廓，不是一张贴片。 */
export const ACCESSORIES = Object.freeze([
  'wrap', // 缠布：小臂与腰间的旧布条，最素的一档
  'bracer', // 护臂：厚实的皮革臂甲，把小臂加粗
  'pauldron', // 肩胄：肩上错层的片状薄甲
  'cloak', // 斗篷：从领口垂到膝弯的一整片
  'hood', // 兜帽：压得很低的深兜帽
  'turban', // 头巾：绕头一圈加一条垂下来的尾巾
  'sash', // 束带：斜过胸口的宽带 + 垂在胯侧的带尾
  'horns', // 兽角：头两侧向后翻的角
  'mask', // 面具：脸前一整块面板，眉骨突出
  'banner', // 背旗：背后一根杆挑起的窄长旗
]);

const ACCESSORY_SET = new Set(ACCESSORIES);

/**
 * 表里查不到、但已经有明确剪影描述的 id。
 *
 * 这三个来自 `src/data/bots.js` 的人格（荒角 / 鹤羽 / 傩面），那里连「宽肩 + 兽角」
 * 「瘦高背旗」「面具客」都写清楚了。真表一旦带上同名皮肤，`resolveSkins()` 查得到，
 * 这张表就自动让位。
 */
export const EXTRA_LOOKS = Object.freeze({
  wildhorn: {
    id: 'wildhorn',
    build: { height: 1.05, mass: 1.32, shoulder: 1.36 },
    accessory: 'horns',
    cloth: '#5c4632',
    trim: '#241a12',
    accent: '#d7b078',
  },
  crane: {
    id: 'crane',
    build: { height: 1.15, mass: 0.76, shoulder: 0.86 },
    accessory: 'banner',
    cloth: '#41576c',
    trim: '#1c2733',
    accent: '#dde6ee',
  },
  nuo: {
    id: 'nuo',
    build: { height: 0.96, mass: 1.02, shoulder: 1.04 },
    accessory: 'mask',
    cloth: '#5f333b',
    trim: '#26161a',
    accent: '#e7d6b2',
  },
});

const DEFAULT_LOOK = Object.freeze({
  id: null,
  build: Object.freeze({ height: 1, mass: 1, shoulder: 1 }),
  accessory: 'wrap',
  cloth: '#6d7280',
  trim: '#3d4450',
  accent: '#d9cfba',
});

function num(v, d) {
  return Number.isFinite(v) ? v : d;
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/** FNV-1a。要的只是「同一个字符串永远同一个数」，不是密码学强度。 */
export function hashSkinId(id) {
  let h = 0x811c9dc5;
  const s = String(id ?? '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * 认不出的皮肤 id 也要长得不一样。
 * 比例取离散档（差值够大，灰度剪影里读得出），配件按散列轮转。
 */
export function synthesizeLook(skinId) {
  const h = hashSkinId(skinId);
  return {
    id: skinId,
    build: {
      height: 0.9 + ((h >>> 3) % 9) * 0.03, // 0.90 … 1.14
      mass: 0.8 + ((h >>> 9) % 10) * 0.05, // 0.80 … 1.25
      shoulder: 0.86 + ((h >>> 15) % 10) * 0.055, // 0.86 … 1.36
    },
    accessory: ACCESSORIES[h % ACCESSORIES.length],
    cloth: DEFAULT_LOOK.cloth,
    trim: DEFAULT_LOOK.trim,
    accent: DEFAULT_LOOK.accent,
  };
}

function normalizeBuild(build, fallback) {
  const b = build && typeof build === 'object' ? build : {};
  return {
    // 上下限不是美术偏好，是碰撞与镜头的底线：sim 的角色高度是常量，
    // 剪影可以差很多，但不能差到「头在镜头外」或者「矮成一块砖」
    height: clamp(num(b.height, fallback.height), 0.82, 1.22),
    mass: clamp(num(b.mass, fallback.mass), 0.72, 1.38),
    shoulder: clamp(num(b.shoulder, fallback.shoulder), 0.8, 1.45),
  };
}

/**
 * 契约枚举 → 渲染层那一件配件。头上的剪影件优先（一眼能认出），
 * 背旗 / 行囊只在头是光头、发髻或斗笠时上场，避免鹤羽丢掉背旗、石契丢掉行囊。
 *
 *   hood / horns / mask  → 同名配件
 *   back banner          → banner（鹤羽）
 *   back pack            → sash（石契行囊用斜带+垂尾顶包袱轮廓）
 *   topknot / strawHat   → turban（发髻绳 / 斗笠用头巾几何顶）
 *   其余                 → 散列补齐，绝不退回统一缠布
 */
export function accessoryFromAppearance(app, seeded) {
  if (app && ACCESSORY_SET.has(app.accessory)) return app.accessory;
  const hg = app && app.headgear;
  if (hg === 'hood' || hg === 'horns' || hg === 'mask') return hg;
  const back = app && app.back;
  if (back === 'banner') return 'banner';
  if (back === 'pack') return 'sash';
  if (hg === 'topknot' || hg === 'strawHat') return 'turban';
  const fallback = seeded && seeded.accessory;
  return ACCESSORY_SET.has(fallback) ? fallback : 'wrap';
}

function fromTableEntry(entry, skinId) {
  // 真表（枚举）和兜底表（比例）都先归一。缺的比例与配件按 id 散列补齐，
  // 于是「表里新加一只皮肤但还没填 build」也不会退回统一胶囊。
  const app = skinAppearance(entry);
  const seeded = synthesizeLook(app.id ?? skinId);
  const palette = app.palette || {};
  return {
    id: app.id ?? skinId,
    build: normalizeBuild(app.build, seeded.build),
    accessory: accessoryFromAppearance(app, seeded),
    cloth: typeof palette.cloth === 'string' ? palette.cloth : DEFAULT_LOOK.cloth,
    trim: typeof palette.clothDim === 'string' ? palette.clothDim : DEFAULT_LOOK.trim,
    accent: typeof palette.accent === 'string' ? palette.accent : DEFAULT_LOOK.accent,
  };
}

/**
 * 取一份皮肤表。渲染层不 import `src/data`（避免反向依赖），
 * 调用方（冒烟台 / 壳层）想喂真表就把 data 命名空间传进来。
 * @param {object|null} [dataModule]
 */
export function skinTable(dataModule = null) {
  return resolveSkins(dataModule);
}

/**
 * skinId → 剪影。
 *
 * @param {string|null|undefined} skinId  sim 的 `view.players[].skinId`，不透明字符串
 * @param {object} [table]  `skinTable()` 的返回；不给就现取一份（兜底表）
 * @returns {{id:string|null, build:{height:number,mass:number,shoulder:number},
 *           accessory:string, cloth:string, trim:string, accent:string, source:string}}
 */
export function resolveSkinLook(skinId, table) {
  const t = table || skinTable(null);
  const id = typeof skinId === 'string' && skinId.trim().length > 0 ? skinId : null;

  if (id && t.byId && t.byId[id]) {
    return { ...fromTableEntry(t.byId[id], id), source: t.source ?? 'fallback' };
  }
  if (id && EXTRA_LOOKS[id]) {
    return { ...fromTableEntry(EXTRA_LOOKS[id], id), source: 'extra' };
  }
  if (id) {
    return { ...synthesizeLook(id), source: 'synth' };
  }
  // 连 id 都没有：用表的默认皮肤，至少全场默认脸只有一张
  const fallbackId = t.defaultId ?? null;
  if (fallbackId && t.byId && t.byId[fallbackId]) {
    return { ...fromTableEntry(t.byId[fallbackId], fallbackId), source: 'default' };
  }
  return { ...DEFAULT_LOOK, build: { ...DEFAULT_LOOK.build }, source: 'default' };
}

/**
 * 两份剪影是不是「同一个人」。reconcile 用它决定要不要重建角色：
 * 只有形真的变了才拆重建，换识别色不走这条路。
 */
export function sameLook(a, b) {
  if (!a || !b) return a === b;
  return (
    a.id === b.id &&
    a.accessory === b.accessory &&
    a.build.height === b.build.height &&
    a.build.mass === b.build.mass &&
    a.build.shoulder === b.build.shoulder
  );
}
