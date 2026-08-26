/**
 * 物理常量。全部为纯数值，无 DOM 依赖。
 * 坐标系：原点在左上角，x 向右，y 向下（与 Canvas 一致）。
 */

/** 逻辑世界宽度（px） */
export const WORLD_W = 480;
/** 逻辑世界高度（px） */
export const WORLD_H = 800;
/** 重力加速度（px/s²，向下为正） */
export const GRAVITY = 1680;
/** 固定积分步长（s） */
export const FIXED_DT = 1 / 120;

/** 蛋默认半径（GDD：10–14） */
export const EGG_RADIUS = 12;
/** 蛋默认弹性（GDD：0.78–0.92） */
export const EGG_RESTITUTION = 0.85;
/** 蛋默认切向摩擦（0 = 完全光滑） */
export const EGG_FRICTION = 0.06;
/** 空气阻力系数（每秒衰减比例，GDD 要求极低） */
export const EGG_DRAG = 0.02;

/** 速度上限，防止穿透与数值爆炸（px/s） */
export const MAX_SPEED = 2600;
/** 单个固定步内的最大子步数（连续碰撞近似） */
export const MAX_SUBSTEPS = 8;
/** 子步位移不得超过半径的该比例，超过则继续细分 */
export const SUBSTEP_TRAVEL_RATIO = 0.5;

/** 睡眠判定速度阈值（px/s，GDD：<8px/s） */
export const SLEEP_SPEED = 8;
/** 睡眠持续时间阈值（s，GDD：连续 0.6s） */
export const SLEEP_TIME = 0.6;
/** 刚发射的保护期，期间不做睡眠判定（s） */
export const SPAWN_GRACE = 0.2;

/** 底部出界余量：y > WORLD_H + OUT_MARGIN_BOTTOM 视为出界（GDD：y>820） */
export const OUT_MARGIN_BOTTOM = 20;
/** 左右出界余量 */
export const OUT_MARGIN_SIDE = 64;
/** 顶部出界余量（发射口上方允许一段飞行） */
export const OUT_MARGIN_TOP = 240;

/** 蛋的默认存活上限（s），避免永动球拖慢回合 */
export const EGG_LIFETIME = 24;

/** 法向速度低于该值时视为静止接触，直接吸附以消除抖动（px/s） */
export const RESTING_VELOCITY = 42;
/**
 * 低于该冲击强度的接触只做位置修正，不计反弹、不发事件（px/s）。
 * 需要高于「一个固定步内重力带来的法向增量」1680/120=14，
 * 否则躺在砖上的蛋每步都会刷一次撞击音效与连击。
 */
export const MIN_CONTACT_IMPACT = 24;
/** 位置修正的穿透松弛量（px），保留微小重叠可避免抖动 */
export const PENETRATION_SLOP = 0.01;

/** 分裂蛋继承的速度比例（GDD：0.7） */
export const SPLIT_SPEED_SCALE = 0.7;
/** 分裂蛋默认扇形张角（弧度） */
export const SPLIT_SPREAD = Math.PI / 3;

/** 传送门传送后的冷却（s），避免来回抖动 */
export const PORTAL_COOLDOWN = 0.12;

/** 宽相网格的单元边长（px） */
export const GRID_CELL = 48;

/** 事件缓冲上限，无人消费时丢弃最旧事件 */
export const MAX_EVENTS = 512;

/** 弹道预测默认最大反弹次数（GDD：最多 3 次反弹预览） */
export const PREDICT_MAX_BOUNCES = 3;
/** 弹道预测默认最大步数（3s @ 1/120） */
export const PREDICT_MAX_STEPS = 360;
/** 弹道预测默认采样间隔（每 N 步取一个点） */
export const PREDICT_SAMPLE_EVERY = 3;

/** 静态体材质预设 */
export const MATERIAL = {
  wall: { restitution: 1, friction: 0.02 },
  brick: { restitution: 0.86, friction: 0.12 },
  peg: { restitution: 1.06, friction: 0.02 },
  bumper: { restitution: 1.35, friction: 0 },
  ramp: { restitution: 0.9, friction: 0.08 },
  ice: { restitution: 0.94, friction: 0.005 },
  rubber: { restitution: 1.18, friction: 0.2 },
};
