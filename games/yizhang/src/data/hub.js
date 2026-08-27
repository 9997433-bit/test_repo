// 异掌 · 安全区大厅布局表（HUB-R1，ADR-30；API_CONTRACT §3.3）
//
// 这是**数据不是代码**：sim 经 deps 接管后快照进 `state.hub.layout`，render/ui 从
// `view.hub` 读，任何模块都不得再硬编码第二份坐标。纯数据红线（契约 §1-1）：
// 本文件禁止 import three / DOM / window / Math.random，全部字段 JSON 可序列化。
//
// 空间总览（与 sim/hub.js 的内置默认表逐字段对齐，坐标即 O1 的 DEFAULT_HUB_LAYOUT）
// ---------------------------------------------------------------------------
// 安全区与裂岛共用同一套世界坐标：裂岛 = 原点半径 20 的圆盘，走道整体挪到
// z ≈ -120。安全区最近点 (±7.5, -98)（zone 北缘）距原点 ≈ 98m，远大于
// 「裂岛半径 20 + 2m 缓冲」的 22m 红线（契约 §3.3 硬约束 3）——双场景同世界摆放
// 永不穿帮。走道沿 -Z 推进：出生在 +Z 端、门在 -Z 端，与 yaw=0 → -Z 同向，
// 开局镜头即面向走道纵深（ADR-17）。
//
//        z=-102 ┌───────────────┐  ← 走道近端（隐形墙）
//        z=-106 │       ⊙ spawn │  ← 出生点，yaw=0 面向门
//        z=-113 │ 木棉 · · 弹簧 │  ← 第 1 排（x = ∓4.2）
//        z=-119 │ 磐石 · · 分身 │
//        z=-125 │ 疾风 · · 磁掌 │
//        z=-131 │ 冰霜 · · 陨掌 │
//        z=-137 │   ▣ portal    │  ← 传送门（AABB 触发区）
//        z=-141 └───────────────┘  ← 走道远端
//               x=-7.5    x=+7.5
//
// 关键推导（改数前先过一遍，验收对照见 docs/GDD.md §12）：
//   · interactRadius 2.0 ∈ [1.6, 2.2]（契约区间取中偏上）：台座离走道中线
//     4.2m > 2.2，沿中线直走不误触发聚焦；向一侧跨 2~3 步（约 2.2m）进圈。
//   · 同排相邻台座间距 6m、对排间距 8.4m，均 > 2 × interactRadius = 4m，
//     聚焦无歧义（硬约束 2）。
//   · spawn → 门 31m，walkSpeed 6.2 约 5s 走完，途中 8 座全部入视。
//   · 门 AABB 最近角到最近台座（±4.2, -131）距离 ≈ 4.02m > 2.0，门区不与任何
//     台座的交互圈相交（硬约束 4）；spawn 到最近台座 ≈ 8.2m，出生不自动聚焦。

/** 走道中心的 z（裂岛半径 20，挪到 -120 保证两块空间互不误判） */
const HUB_Z = -120;

/** 大厅地面高度 */
const FLOOR_Y = 0;

/** 台座离走道中线的横向距离（左排 -X，右排 +X） */
const ROW_X = 4.2;

/** 四排台座的 z（由近到远，间距 6m > 2×interactRadius） */
const ROW_Z = [HUB_Z + 7, HUB_Z + 1, HUB_Z - 5, HUB_Z - 11];

/** 台座净高（座体顶面离地） */
const PEDESTAL_HEIGHT = 0.95;

/**
 * 展掌悬浮中心高度 = floorY + 台座高 0.95 + 悬浮余量 0.4（契约 §3.3：y 缺省
 * floorY + 台座高，终值归 F3——这里显式给出，O2 直接用作展掌几何中心）。
 */
const GLOVE_HOVER_Y = FLOOR_Y + PEDESTAL_HEIGHT + 0.4;

/**
 * 展掌朝向（ADR-17：forward(yaw) = (-sin yaw, -cos yaw)，禁止第四套约定）：
 * 左排面向 +X（走道中线）⇒ yaw = -π/2；右排面向 -X ⇒ yaw = +π/2。
 */
const FACE_POS_X = -Math.PI / 2;
const FACE_NEG_X = Math.PI / 2;

/**
 * 8 座台座。**数组顺序 = GLOVES 图鉴顺序**（契约 §3.3 硬约束 1，聚焦并列时
 * 取表序靠前者）；空间上左排由近到远 = 木棉/磐石/疾风/冰霜（默认掌离出生点
 * 最近，教学梯度即步行顺序），右排 = 弹簧/分身/磁掌/陨掌。
 * `row`/`index` 是 sim 兼容字段（O1 normalizeHubLayout 透传，render 可按排布光）。
 */
const PEDESTALS = [
  { gloveId: "cotton",     x: -ROW_X, y: GLOVE_HOVER_Y, z: ROW_Z[0], yaw: FACE_POS_X, row: "left",  index: 0 },
  { gloveId: "granite",    x: -ROW_X, y: GLOVE_HOVER_Y, z: ROW_Z[1], yaw: FACE_POS_X, row: "left",  index: 1 },
  { gloveId: "gale",       x: -ROW_X, y: GLOVE_HOVER_Y, z: ROW_Z[2], yaw: FACE_POS_X, row: "left",  index: 2 },
  { gloveId: "frost",      x: -ROW_X, y: GLOVE_HOVER_Y, z: ROW_Z[3], yaw: FACE_POS_X, row: "left",  index: 3 },
  { gloveId: "spring",     x: ROW_X,  y: GLOVE_HOVER_Y, z: ROW_Z[0], yaw: FACE_NEG_X, row: "right", index: 0 },
  { gloveId: "afterimage", x: ROW_X,  y: GLOVE_HOVER_Y, z: ROW_Z[1], yaw: FACE_NEG_X, row: "right", index: 1 },
  { gloveId: "magnet",     x: ROW_X,  y: GLOVE_HOVER_Y, z: ROW_Z[2], yaw: FACE_NEG_X, row: "right", index: 2 },
  { gloveId: "meteor",     x: ROW_X,  y: GLOVE_HOVER_Y, z: ROW_Z[3], yaw: FACE_NEG_X, row: "right", index: 3 },
];

/** 传送门中心（走道 -Z 尽头）与触发半径；AABB 是圆的外切矩形沿走道轴压扁的版本 */
const PORTAL_X = 0;
const PORTAL_Z = HUB_Z - 17;
const PORTAL_RADIUS = 2.4;

function deepFreeze(obj) {
  for (const v of Object.values(obj)) {
    if (v && typeof v === "object" && !Object.isFrozen(v)) deepFreeze(v);
  }
  return Object.freeze(obj);
}

/**
 * 安全区大厅布局（契约 §3.3 的 HubLayout + sim 兼容超集）。
 *
 * 契约字段：floorY / spawn / bounds / interactRadius / portal(x,z,yaw,aabb) /
 * pedestals（恰好 8 条，gloveId 唯一覆盖 8 掌）。
 *
 * 超集字段是 O1 `sim/hub.js normalizeHubLayout` 的既有消费面（缺省时 sim 用
 * 内置默认值补全，这里显式给出让数据表成为唯一事实源）：
 *   · id/source     —— 布局来源标记；source:"data" ⇒ deps.usingDataHub === true
 *   · origin        —— 安全区参考原点（走道中心）
 *   · walkway       —— 可走范围（与 bounds 同一矩形的 halfWidth 写法）
 *   · zone          —— 「算不算在安全区里」的判定体积（比走道宽一圈 + 竖直范围）
 *   · portal.radius —— 圆形触发半径（与 aabb 等价的另一种写法，sim 现用它）
 *   · pedestalRadius/pedestalHeight —— 台座实体碰撞半径与座体净高
 */
export const HUB = deepFreeze({
  id: "hub-walkway-v1",
  source: "data",

  // ---- 契约 §3.3 冻结形状 ----
  floorY: FLOOR_Y,
  // 出生在走道 +Z 近端，yaw=0 面向 -Z（正对传送门，ADR-17）
  spawn: { x: 0, y: FLOOR_Y, z: HUB_Z + 14, yaw: 0 },
  // 可走范围 AABB（sim 硬钳制：安全区走不出去、掉不下去）
  bounds: { minX: -7.5, maxX: 7.5, minZ: HUB_Z - 21, maxZ: HUB_Z + 18 },
  interactRadius: 2.0,
  portal: {
    x: PORTAL_X,
    y: FLOOR_Y,
    z: PORTAL_Z,
    // 门面朝 +Z（迎着从出生点走来的玩家；说明牌/门框渲染朝向）
    yaw: Math.PI,
    radius: PORTAL_RADIUS,
    // 传送触发区：触发半径 2.4 的外切正方形（4.8 × 4.8m 门洞带），
    // 北缘距最近一排台座 z=-131 尚有 3.6m，加横向 1.8m 后与交互圈净距 ≈ 2.0m
    aabb: {
      minX: PORTAL_X - PORTAL_RADIUS,
      maxX: PORTAL_X + PORTAL_RADIUS,
      minZ: PORTAL_Z - PORTAL_RADIUS,
      maxZ: PORTAL_Z + PORTAL_RADIUS,
    },
  },
  pedestals: PEDESTALS,

  // ---- sim 兼容超集（O1 normalizeHubLayout 消费） ----
  origin: { x: 0, y: FLOOR_Y, z: HUB_Z },
  walkway: { halfWidth: 7.5, minZ: HUB_Z - 21, maxZ: HUB_Z + 18 },
  zone: { halfWidth: 11.5, minZ: HUB_Z - 25, maxZ: HUB_Z + 22, minY: -4, maxY: 26 },
  pedestalRadius: 0.6,
  pedestalHeight: PEDESTAL_HEIGHT,
});
