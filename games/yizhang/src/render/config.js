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

/**
 * 8 只手套的识别色，键是 src/data/gloves.js 的 GLOVES[].id，值与那里的 color 一字不差。
 *
 * 渲染层不 import src/data（避免反向依赖），所以这张表是那份数值表的镜像：
 * 真实 view 里带 gloveColor 时以 view 为准，这张表只在 view 没给颜色时兜底。
 * 改数据表的颜色时这里要一起改，glove-tint 的单测会盯着两边对齐。
 */
export const GLOVE_TINT = {
  cotton: 0xe3c988,
  granite: 0x7d8a99,
  gale: 0x63c6b4,
  frost: 0x9fd8ef,
  spring: 0xc98f3f,
  afterimage: 0xb48ade,
  magnet: 0xc94f43,
  meteor: 0xe07840,
};

export const FALLBACK_TINT = 0x9aa2ad;

/**
 * 渲染层的两个自定义 layer。
 *
 * BLOOM —— 真正的自发光体的标记层（手册 §2-14）。
 * OCCLUDER —— 「挡得住辉光的实体」。辉光通道要知道谁挡在光前面，否则井底的光核
 *   会透过台面糊出来；但把整场重画一遍只为拿这份遮挡，价钱比主渲染还贵
 *   （见下面 QUALITY 的注释）。所以中档只重画自发光体 + 这一层：大块的岩体 /
 *   台面 / 走道 / 门柱 / 躯干。小配件对一张 1/4 分辨率再模糊两趟的遮罩没有可测量的贡献。
 */
export const BLOOM_LAYER = 1;
export const OCCLUDER_LAYER = 2;

/** 把一个网格登记成辉光通道的遮挡体。见 OCCLUDER_LAYER。 */
export function markOccluder(obj) {
  obj?.layers?.enable?.(OCCLUDER_LAYER);
  return obj;
}

/**
 * 画质档。三档不是「同一套东西调数字」，而是明确的取舍：
 *  high — 阴影 + 完整粒子 + 布料 sheen + 高分辨率程序化贴图
 *  mid  — 阴影降级、粒子减半、材质退回 MeshStandard、贴图减半
 *  low  — 无阴影、碎屑合批、粒子极简、无法线细节、**辉光整条链关掉**
 *
 * 关于 bloom（手册 §2-14 / SOTA R-03）：高中档保留的是「只吃自发光体」的选择性辉光，
 * 强度 0.8~0.9、阈值 0.85，裂缝芯与觉醒缝线之外的东西一律进不了辉光通道。
 *
 * 低档直接把 bloom 置 false，因为这条支链的价钱和它买到的东西完全不成比例。
 * 冒烟台上实测（破洞露出井底光核、也就是全场辉光最强的一帧）：
 *   高档一帧 508 drawcall = 主渲染 251 + 辉光支链 256 + 合成 1
 *   —— 自发光代理通道要把整场再画一遍，它自己就比主渲染还贵；
 *   而这 256 个 drawcall 只改变了全画面 0.41% 的像素，峰值 +8/255。
 *   低档同一帧 165 drawcall = 主渲染 164 + 合成 1，辉光支链归零。
 * 关掉之后画面不是「少了效果」，而是回到手册的默认立场：亮部靠曝光与材质，不靠泛光。
 *
 * 中档保留辉光，但自发光通道只画**自发光体 + 遮挡层**（bloomOccluders: 'tagged'，
 * 见 OCCLUDER_LAYER）：井底光核仍旧被台面挡住、门里的光仍旧被门柱与人挡住，
 * 可是不用为了这份遮挡把每一颗铆钉、每一条束带都再画一遍。
 * 高档维持整场重画，两档的取舍是明写的。
 *
 * propShadows 同理：中档的阴影贴图只有 1024，铆钉 / 漆环 / 冰棱投出来的影子
 * 落不到一个纹素上，却每样都要在阴影 pass 里各占一个 drawcall。高档留着。
 */
export const QUALITY = {
  high: {
    name: 'high',
    dprCap: 2,
    msaa: 4,
    shadows: true,
    shadowMapSize: 2048,
    softShadows: true,
    // 高档：小配件也投影，辉光通道也把整场当遮挡体重画一遍
    propShadows: true,
    bloomOccluders: 'all',
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
    // 后期：选择性辉光（只有自发光代理通道里的像素能进），克制强度
    bloom: true,
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
    // 中档：影子只留大件（躯干 / 四肢 / 台座 / 岩体），辉光遮挡只重画 OCCLUDER 层
    propShadows: false,
    bloomOccluders: 'tagged',
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
    bloom: true,
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
    propShadows: false,
    bloomOccluders: 'tagged',
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
    // 低档无辉光：自发光代理通道与两趟模糊整个不建、不跑，只留 ACES 合成
    bloom: false,
    bloomScale: 0.125,
    bloomIterations: 0,
    bloomStrength: 0,
  },
};

export const QUALITY_TIERS = ['high', 'mid', 'low'];

export function resolveTier(tier) {
  return QUALITY[tier] ? tier : 'mid';
}

/** 全局硬上限：DPR 封顶 2（DESIGN_SEED 要求），再按档位收紧。 */
export const GLOBAL_DPR_CAP = 2;
