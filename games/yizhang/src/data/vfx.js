// 异掌 · 每掌**战斗** VFX 参数表（HUB-R2，Fable-3；补 Round 1 遗留 3 —— 裂岛
// 扇击/技能特效仍是一套通用壳。大厅 idle 特效是另一张合同，归 O2 渲染，见
// ART_DIRECTION §13.4，这里不重复）。
//
// 消费方式（O2 渲染分派）：
//   · 扇击（slap 事件带 gloveId）→ `GLOVE_VFX_BY_ID[gloveId].slap`
//   · 技能（skill 事件线上的 skillId 是 §3.1 右列 handler id）→
//     `GLOVE_VFX_BY_SKILL[skillId]`（本表 skill.skillId 就登记为 handler id）
//   · 分身残影：O1 导出 `view.combat.ghosts`，视觉规格读 afterimage 的
//     `skill.ghosts`（数量/寿命/去饱和/边缘先散）。
//
// 职责边界：判定几何（slapRange / slapAngleDeg / 技能半径）的唯一事实源仍是
// `gloves.js` / combat——O2 按 gloveId 自取，本表**不复制一份战斗数字**，只带
// 视觉参数（形状关键词、粒子数、寿命秒、高度米、贴花种类）。识别色 `ident`
// 直接引用 `GLOVE_BY_ID[id].color`（同一对象字段，永不漂移出第三份色源）。
//
// 纪律（手册 §10 + ART_DIRECTION §7/§9，测试锁死）：
//   1. 禁纯色光球：八掌 burst.shape / trail.kind / residue.kind 三列各自互异，
//      不允许「同一团换个 hue」。
//   2. 识别色只做点缀：着色粒子占比 ≤ identMaxShare（0.2），整团染色拒收。
//   3. 加法混合只给真高温：全表 blend:"additive" 仅陨掌余烬，其余 Normal。
//   4. 事后残留必查：每掌 residue（尘/屑/霜/烬…）留在场上，打完不能像没发生。
//
// 纯数据红线（契约 §1-1）：禁 import three / DOM / Math.random，全字段 JSON
// 可序列化。设计意图逐掌见 docs/GDD.md §14。

import { GLOVE_BY_ID } from "./gloves.js";

/** 识别色点缀上限：着色粒子占总量比例（ART §13.4 的两成纪律，战斗同样适用） */
const IDENT_MAX_SHARE = 0.2;

function deepFreeze(obj) {
  for (const v of Object.values(obj)) {
    if (v && typeof v === "object" && !Object.isFrozen(v)) deepFreeze(v);
  }
  return Object.freeze(obj);
}

/** 数组顺序 = GLOVES 图鉴顺序（与 hub 台座、选掌网格同序） */
export const GLOVE_VFX = deepFreeze([
  {
    gloveId: "cotton",
    ident: GLOVE_BY_ID.cotton.color,
    identMaxShare: IDENT_MAX_SHARE,
    slap: {
      // 掌风压出的贴地尘楔 + 布纤絮：轻掌打的是「空气」，不是光
      burst: { shape: "gustFan", height: 0.45, dustDensity: 0.6, lifeSeconds: 0.3 },
      trail: { kind: "fiberWisp", count: 6, sway: 0.3, lifeSeconds: 0.4 },
      residue: { kind: "fluff", count: 5, fall: "drift", lifeSeconds: 1.6 },
      // 觉醒 combo3 第三掌收尾：同形放大 + 多几枚棉絮，不换形不加光
      finisher: { scaleMul: 1.5, extraResidue: 4 },
    },
    // 木棉无主动技（skillId ""，§3.1 哨兵 none）：技能位留空，觉醒表现走 finisher
    skill: null,
  },
  {
    gloveId: "granite",
    ident: GLOVE_BY_ID.granite.color,
    identMaxShare: IDENT_MAX_SHARE,
    slap: {
      // 石屑抛物线楔 + 尘幕滞留；重掌的重量感来自「掀起了多少东西」
      burst: { shape: "stoneWedge", chipCount: 8, chipArc: "parabola", lifeSeconds: 0.5 },
      trail: { kind: "gritDrag", density: 0.5, lifeSeconds: 0.6 },
      residue: { kind: "grit", count: 10, bounce: 1, lifeSeconds: 2.5 },
      decal: { kind: "kintsugiCrack", sizeMul: 0.4, lifeSeconds: 6 },
    },
    skill: {
      skillId: "groundPound",
      shape: "slamShock",
      dustCurtain: { height: 1.2, lifeSeconds: 2.0 },
      chipCount: 14,
      residue: { kind: "grit", count: 16, bounce: 1, lifeSeconds: 3 },
      // 金缮裂纹自落点放射蔓延（与碎地系统同一美术语言）
      decal: { kind: "kintsugiCrackRadial", spokes: 5, lifeSeconds: 8 },
    },
  },
  {
    gloveId: "gale",
    ident: GLOVE_BY_ID.gale.color,
    identMaxShare: IDENT_MAX_SHARE,
    slap: {
      // 冲刺残迹是被扰动的尘与草屑，不是拖尾光带（ART §7 负面清单）
      burst: { shape: "windShear", chaffCount: 7, lifeSeconds: 0.35 },
      trail: { kind: "chaffWake", groundHug: true, lifeSeconds: 0.5 },
      residue: { kind: "chaff", count: 6, settle: "swirl", lifeSeconds: 1.4 },
    },
    skill: {
      skillId: "dashSlap",
      shape: "rushWake",
      dustLine: { lifeSeconds: 0.8 },
      streamerCount: 2,
      residue: { kind: "chaff", count: 8, settle: "swirl", lifeSeconds: 1.2 },
    },
  },
  {
    gloveId: "frost",
    ident: GLOVE_BY_ID.frost.color,
    identMaxShare: IDENT_MAX_SHARE,
    slap: {
      // 霜沿扇面闪结枝晶，冷雾贴地滚；事后湿痕说明「霜真的化了」
      burst: { shape: "rimeFan", dendriteFlash: true, lifeSeconds: 0.4 },
      trail: { kind: "coldFog", groundHug: true, lifeSeconds: 0.9 },
      residue: { kind: "frost", count: 8, melt: "wetMark", lifeSeconds: 3 },
      decal: { kind: "dendrite", growSeconds: 0.35, lifeSeconds: 4 },
    },
    skill: {
      skillId: "frostArc",
      shape: "dendriteWave",
      fog: { height: 0.4, lifeSeconds: 1.6 },
      residue: { kind: "frost", count: 12, melt: "wetMark", lifeSeconds: 3.5 },
      decal: { kind: "dendrite", growSeconds: 0.45, lifeSeconds: 5 },
      // 觉醒冻结：冰壳要有厚度（不是给人套蓝光），ART §7
      awakenShell: { kind: "iceShell", thickness: 0.08 },
    },
  },
  {
    gloveId: "spring",
    ident: GLOVE_BY_ID.spring.color,
    identMaxShare: IDENT_MAX_SHARE,
    slap: {
      // 金属簧圈形变 + 高光沿簧游走 + 一撮灰尘被弹起
      burst: { shape: "coilSnap", glintTravel: true, lifeSeconds: 0.3 },
      trail: { kind: "coilArc", turns: 3, lifeSeconds: 0.35 },
      residue: { kind: "dustPop", count: 5, lifeSeconds: 1.0 },
    },
    skill: {
      skillId: "parry",
      shape: "coilGuard",
      compressSeconds: 0.12,
      glintTravel: true,
      residue: { kind: "dustPop", count: 8, lifeSeconds: 1.2 },
    },
  },
  {
    gloveId: "afterimage",
    ident: GLOVE_BY_ID.afterimage.color,
    identMaxShare: IDENT_MAX_SHARE,
    slap: {
      // 挥击剥离一帧保留姿态的残影：边缘先散（动作历史，手册 §10.4），去饱和
      burst: { shape: "ghostCut", desaturate: 0.8, lifeSeconds: 0.35 },
      trail: {
        kind: "poseGhost",
        count: 1,
        keepPose: true,
        edgeDissolve: true,
        desaturate: 0.8,
        lifeSeconds: 0.45,
      },
      residue: { kind: "ashMotes", count: 6, lifeSeconds: 1.2 },
    },
    skill: {
      skillId: "blinkSwap",
      shape: "swapVeil",
      // 换位两端各留一具残影（O1 的 view.combat.ghosts 逐条对应）；
      // 禁蓝色光柱、禁 alpha 叠糊（ART §13.4 负面）
      ghosts: {
        count: 2,
        spawnIntervalSeconds: 0.12,
        keepPose: true,
        edgeDissolve: true,
        desaturate: 0.85,
        lifeSeconds: 0.7,
      },
      residue: { kind: "ashMotes", count: 10, lifeSeconds: 1.5 },
    },
  },
  {
    gloveId: "magnet",
    ident: GLOVE_BY_ID.magnet.color,
    identMaxShare: IDENT_MAX_SHARE,
    slap: {
      // 空中尘埃被吸成 2~3 条弧线场纹；被拉者脚下拖出擦痕
      burst: { shape: "fieldArcs", arcCount: 3, lifeSeconds: 0.4 },
      trail: { kind: "filingStream", lifeSeconds: 0.5 },
      residue: { kind: "filings", count: 9, quiver: true, lifeSeconds: 2.0 },
      decal: { kind: "dragScuff", lifeSeconds: 4 },
    },
    skill: {
      skillId: "magnetPull",
      shape: "pullField",
      arcCount: 3,
      // 短磁弧「嗒」跳过指间：一帧亮，禁持续电弧刷屏（ART §13.4 负面）
      snapFlash: { frames: 1 },
      residue: { kind: "filings", count: 12, quiver: true, lifeSeconds: 2.5 },
      decal: { kind: "dragScuff", lifeSeconds: 5 },
    },
  },
  {
    gloveId: "meteor",
    ident: GLOVE_BY_ID.meteor.color,
    identMaxShare: IDENT_MAX_SHARE,
    slap: {
      // 冲击环掀尘 + 余烬迸散；余烬是全表唯一 additive（它真的是高温）
      burst: { shape: "emberImpact", shockRing: true, lifeSeconds: 0.5 },
      trail: { kind: "emberStreak", lifeSeconds: 0.6 },
      residue: { kind: "embers", count: 7, breathe: true, blend: "additive", lifeSeconds: 2.8 },
      decal: { kind: "scorch", lifeSeconds: 6 },
    },
    skill: {
      skillId: "meteorSlam",
      shape: "craterFall",
      // 腾空遮蔽脚下光 → 落点冲击环 + 尘幕（与碎地表演联动，ART §7）
      leapShadow: true,
      shockRing: { lifeSeconds: 0.6 },
      dustCurtain: { height: 1.4, lifeSeconds: 2.2 },
      residue: { kind: "embers", count: 14, breathe: true, blend: "additive", lifeSeconds: 3.2 },
      decal: { kind: "scorchRing", lifeSeconds: 8 },
    },
  },
]);

export const GLOVE_VFX_BY_ID = Object.freeze(
  Object.fromEntries(GLOVE_VFX.map((v) => [v.gloveId, v])),
);

/**
 * 按技能 handler id（§3.1 右列，skill 事件线上的 skillId）索引——O2 消化
 * skill 事件时直查，不用先反查 gloveId。木棉无主动技，不在此表。
 */
export const GLOVE_VFX_BY_SKILL = Object.freeze(
  Object.fromEntries(
    GLOVE_VFX.filter((v) => v.skill).map((v) => [v.skill.skillId, v]),
  ),
);

/**
 * 兜底：未知/缺省 gloveId 落木棉（与 createMatch「非法 id 回落 cotton」同一约定）。
 * @param {string|null|undefined} [gloveId]
 * @returns {object} 永不返回 undefined
 */
export function resolveGloveVfx(gloveId) {
  if (typeof gloveId === "string" && GLOVE_VFX_BY_ID[gloveId]) {
    return GLOVE_VFX_BY_ID[gloveId];
  }
  return GLOVE_VFX_BY_ID.cotton;
}
