// 视觉合同：色板、画质档、手套识别色。
// 依据 games/yizhang/docs/VISUAL_HANDBOOK.md 底座 B（风格化精品），不混 A/C。
//
// 色彩纪律（手册 §5.11）：全场只有 4~6 个色相，饱和度峰值只给「本地玩家当前手套」，
// 其余角色的识别色统一降饱和，避免每个元素都抢眼。

/** 暮蓝天空 + 暖黄裂纹。以 sRGB 十六进制书写，交给 three 的 ColorManagement 转线性。 */
export const PALETTE = {
  // 天空：天顶暮蓝 → 中天灰蓝 → 太阳方位的一小片暖霾
  skyZenith: 0x1a2740,
  skyMid: 0x3b4a63,
  skyHorizon: 0x6d7285,
  skyWarm: 0xb98a63,
  sunDisc: 0xffd7a8,

  // 光
  keyLight: 0xffc98f, // 暖主光，落日方向，唯一投影光源
  fillSky: 0x8fb0dd, // 冷天空补光（半球光上半）
  fillBounce: 0x6d5340, // 岩面反弹到暗部的暖褐（半球光下半），暗部因此不死黑
  rimLight: 0xa9c3e6, // 冷边缘光，替代发光描边
  crackLight: 0xff9c46, // 裂缝里透出的暖光，是 emissive 的「光源依据」

  // 岩石：三层，越往下越冷越脏
  rockTop: 0x6a6055, // 台面被踩亮的暖灰
  rockBody: 0x4b4a4e,
  rockDeep: 0x2f3138,
  rockFresh: 0x8b8378, // 崩口露出的新鲜断面，比风化面亮
  grime: 0x241f1c, // 重力方向的水渍与积灰

  // 裂纹（全场唯一允许 emissive 的地方）
  crackCore: 0xffc46b,
  crackDeep: 0xd8541c,

  // 大气
  fog: 0x33405a,
  cloudLit: 0x9e8b76,
  cloudShadow: 0x46506a,

  // 角色材质基色（皮革 / 金属 / 布，粗糙度各不相同）
  leather: 0x453529,
  leatherWorn: 0x634c39,
  metal: 0x8d8f93,
  metalWarm: 0xb08b5e,
  cloth: 0x474d59,
  clothDim: 0x2e333c,
  skin: 0x8a5f47,
};

/** 8 只手套的识别色。渲染层不 import src/data，避免反向依赖，视图里带 color 时优先用视图的。 */
export const GLOVE_TINT = {
  cotton: 0xa8875c,
  granite: 0x8a8578,
  gale: 0x7fc4b4,
  frost: 0x9fc6e8,
  spring: 0xd0a24a,
  afterimage: 0x9a86c4,
  magnet: 0xc06a5a,
  meteor: 0xd2713a,
};

export const FALLBACK_TINT = 0x9aa2ad;

/**
 * 画质档。三档不是「同一套东西调数字」，而是明确的取舍：
 *  high — 阴影 + 完整粒子 + 布料 sheen + 高分辨率程序化贴图
 *  mid  — 阴影降级、粒子减半、材质退回 MeshStandard、贴图减半
 *  low  — 无阴影、碎屑合批、粒子极简、无法线细节
 */
export const QUALITY = {
  high: {
    name: 'high',
    dprCap: 2,
    msaa: 4,
    shadows: true,
    shadowMapSize: 2048,
    softShadows: true,
    rimLight: true,
    crackFillLight: true,
    // 程序化贴图
    texRock: 512,
    texDetail: 256,
    normalMaps: true,
    sheenCloth: true,
    envSize: 256,
    // 几何细分
    islandRadialSegments: 128,
    islandProfileSegments: 26,
    plateBevel: true,
    plateCurveSegments: 10,
    capsuleSegments: 12,
    rockChunks: 7,
    cloudLayers: 3,
    // VFX
    dustBudget: 900,
    emberBudget: 220,
    debrisPerBurst: 7,
    debrisBudget: 120,
    mergedDebris: false,
    decalBudget: 24,
    shockRings: 2,
    footDust: true,
    // 后期
    bloomScale: 0.5,
    bloomIterations: 3,
    bloomStrength: 0.9,
  },
  mid: {
    name: 'mid',
    dprCap: 1.5,
    msaa: 2,
    shadows: true,
    shadowMapSize: 1024,
    softShadows: false,
    rimLight: true,
    crackFillLight: true,
    texRock: 256,
    texDetail: 128,
    normalMaps: true,
    sheenCloth: false,
    envSize: 128,
    islandRadialSegments: 80,
    islandProfileSegments: 18,
    plateBevel: true,
    plateCurveSegments: 6,
    capsuleSegments: 8,
    rockChunks: 4,
    cloudLayers: 2,
    dustBudget: 380,
    emberBudget: 96,
    debrisPerBurst: 4,
    debrisBudget: 56,
    mergedDebris: false,
    decalBudget: 12,
    shockRings: 1,
    footDust: true,
    bloomScale: 0.25,
    bloomIterations: 2,
    bloomStrength: 0.8,
  },
  low: {
    name: 'low',
    dprCap: 1.25,
    msaa: 0,
    shadows: false,
    shadowMapSize: 512,
    softShadows: false,
    rimLight: true,
    // 点光很便宜，而关掉它裂缝井就是一个纯黑的洞 —— 低配可以少粒子少阴影，
    // 但不能把场景的叙事光源整个拿掉。
    crackFillLight: true,
    texRock: 128,
    texDetail: 64,
    normalMaps: false,
    sheenCloth: false,
    envSize: 64,
    islandRadialSegments: 44,
    islandProfileSegments: 12,
    plateBevel: false,
    plateCurveSegments: 3,
    capsuleSegments: 6,
    rockChunks: 2,
    cloudLayers: 1,
    dustBudget: 140,
    emberBudget: 32,
    debrisPerBurst: 2,
    debrisBudget: 20,
    mergedDebris: true,
    decalBudget: 4,
    shockRings: 1,
    footDust: false,
    bloomScale: 0.125,
    bloomIterations: 1,
    bloomStrength: 0.7,
  },
};

export const QUALITY_TIERS = ['high', 'mid', 'low'];

export function resolveTier(tier) {
  return QUALITY[tier] ? tier : 'mid';
}

/** 全局硬上限：DPR 封顶 2（DESIGN_SEED 要求），再按档位收紧。 */
export const GLOBAL_DPR_CAP = 2;
