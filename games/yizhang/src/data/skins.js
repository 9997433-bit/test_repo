// 异掌 · 皮肤真表（HUB-R2，Fable-3；API_CONTRACT §3.2，ADR-26）
//
// 这是壳层 `core/skins.js` 头注预告的那份「真表」：SKINS / SKIN_BY_ID /
// DEFAULT_SKIN_ID 三件套齐，`core/skins.js resolveSkins(dataModule)` 拿到本模块
// （或 `src/data/index.js` 命名空间）即自动翻到 source:"data"，兜底表退役，壳层零改动。
//
// 形状取**契约 §3.2 的冻结 SkinDef**（build/headgear/back/palette 枚举组合），
// 不是壳层兜底表的比例数值形状（build{height,mass,shoulder}/accessory）——两套
// 只能活一套，取舍理由与消费方式见 docs/GDD.md §13.1。字段语义：
//   id / name / desc   —— 标识与大厅文案（name ≤3 字主标题、desc ≤18 字副标题）
//   build              —— 体型档 'slim'|'stock'|'broad'（O2 映射躯干/四肢比例与肩宽）
//   headgear           —— 头部剪影件 'hood'|'bare'|'topknot'|'strawHat'|'mask'|'horns'
//   back               —— 背部识别色载体形状 'panel'|'banner'|'pack'（§3.2 规则 1：
//                         必须承载**当前激活掌识别色**，皮肤只换载体形状，不能取消它）
//   palette            —— 衣料底色五段（hex）。全部压饱和：全屏唯一饱和峰值
//                         永远是当前掌识别色（ART_DIRECTION §1.2），皮肤不抢
//   trim               —— 可选剪影微调参（F3/O2 协商词表，登记在 GDD §13.3；O2 可忽略）
//
// 纪律（ADR-26）：skinId 纯装饰，本表**不含任何战斗数值**；禁贴图包 / 版权素材，
// 区分度全部来自剪影（build × headgear × back）+ 配色 —— 灰度剪影测试下六套
// headgear 各不相同，蒙掉颜色也认得出人。纯数据红线（契约 §1-1）：禁 import
// three / DOM / Math.random，全字段 JSON 可序列化。
//
// id 词表 v1 冻结于契约 §3.2（drifter/mason/crane/reed/nuo/wildhorn）：新皮肤先在
// 契约登记再进表。Bot 三人格 brute/fox/bully → wildhorn/crane/nuo（bots.js），
// 三者互异且都 ≠ DEFAULT_SKIN_ID —— Bot 不得全员同一造型（§3.2 规则 3）。

export const DEFAULT_SKIN_ID = "drifter";

function deepFreeze(obj) {
  for (const v of Object.values(obj)) {
    if (v && typeof v === "object" && !Object.isFrozen(v)) deepFreeze(v);
  }
  return Object.freeze(obj);
}

/** 数组顺序 = 契约 §3.2 皮肤表 v1 顺序 = 大厅选择器顺序（勿重排） */
export const SKINS = deepFreeze([
  {
    id: "drifter",
    name: "行 脚",
    desc: "走遍裂岛的行脚客，兜帽压着风尘。",
    build: "stock",
    headgear: "hood",
    back: "panel",
    // 尘灰蓝布衣：缺省造型，中间灰阶，谁都不抢
    palette: {
      cloth: "#5d6572",
      clothDim: "#3a404b",
      leather: "#6b5340",
      accent: "#cdc3ac",
      skin: "#c9a184",
    },
    trim: { hoodDepth: 0.55 },
  },
  {
    id: "mason",
    name: "石 契",
    desc: "凿石为契的匠人，行囊里全是石粉。",
    build: "broad",
    headgear: "bare",
    back: "pack",
    // 赭土工装：亮暖中高灰阶，光头 + 宽肩 + 鼓行囊
    palette: {
      cloth: "#8a6f4d",
      clothDim: "#4f3f2b",
      leather: "#59422f",
      accent: "#d9b36c",
      skin: "#b98a66",
    },
    trim: { packBulk: 1.2 },
  },
  {
    id: "crane",
    name: "鹤 羽",
    desc: "瘦高的白衣客，背旗随步一摆一摆。",
    build: "slim",
    headgear: "topknot",
    back: "banner",
    // 鹤羽灰白：全表最高灰阶；丹色只做发髻绳一点
    palette: {
      cloth: "#b9bfc2",
      clothDim: "#6d7478",
      leather: "#4a4a52",
      accent: "#d96a4e",
      skin: "#d8b394",
    },
    trim: { bannerHeight: 1.25 },
  },
  {
    id: "reed",
    name: "苇 笠",
    desc: "斗笠蓑衣，苇荡里来的摆渡人。",
    build: "stock",
    headgear: "strawHat",
    back: "panel",
    // 苇绿蓑衣：中低灰阶；宽笠檐是剪影关键
    palette: {
      cloth: "#4c6248",
      clothDim: "#2c3a2b",
      leather: "#7a5c38",
      accent: "#c7b25a",
      skin: "#b48c68",
    },
    trim: { hatRadius: 0.42 },
  },
  {
    id: "nuo",
    name: "傩 面",
    desc: "傩戏面客，面具后从不说话。",
    build: "slim",
    headgear: "mask",
    back: "banner",
    // 夜漆青黑：全表最暗；漆红只在面具纹一线（原创民俗剪影，无版权素材）
    palette: {
      cloth: "#2f2b3a",
      clothDim: "#1c1a24",
      leather: "#503a33",
      accent: "#b23a2e",
      skin: "#a98670",
    },
    trim: { bannerHeight: 0.95 },
  },
  {
    id: "wildhorn",
    name: "荒 角",
    desc: "披兽皮戴荒角，肩比门框还宽。",
    build: "broad",
    headgear: "horns",
    back: "pack",
    // 生革锈褐：暗暖灰阶；骨色荒角外张，宽肩剪影一眼认出
    palette: {
      cloth: "#6e4a33",
      clothDim: "#402a1d",
      leather: "#8a6b4a",
      accent: "#d6c7a5",
      skin: "#b07a55",
    },
    trim: { hornSpread: 0.5 },
  },
]);

export const SKIN_BY_ID = Object.freeze(
  Object.fromEntries(SKINS.map((s) => [s.id, s])),
);

/**
 * 皮肤对象级兜底（契约 §3.2 规则 2 / §14-17）：未知 id、null、缺省一律落
 * `SKIN_BY_ID[DEFAULT_SKIN_ID]`。id 级归一（存档/分配场景）仍走壳层
 * `core/skins.js normalizeSkinId(id, resolveSkins(data))`——两个层面各管各的，
 * 消费端建外观直接调这里即可：`resolveSkin(p.skinId ?? persona?.skinId)`。
 *
 * @param {string|null|undefined} [id]
 * @returns {object} 永不返回 undefined
 */
export function resolveSkin(id) {
  if (typeof id === "string" && SKIN_BY_ID[id]) return SKIN_BY_ID[id];
  return SKIN_BY_ID[DEFAULT_SKIN_ID];
}
