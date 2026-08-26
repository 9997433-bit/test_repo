/**
 * 关卡内道具静态表（GDD：炸弹、冰锥、多重蛋、磁铁、时间减缓、钉板刷新）。
 * 金币购买带入关卡，战斗中点击使用；掉落见 ITEM_RULES。
 */
export const BATTLE_ITEMS = [
  { id: "bomb", name: "炸弹", price: 40, icon: "bomb", desc: "指定点爆炸：半径 90 内造成 60 点真实伤害（无视护甲与抗性）。", effect: { type: "explode", dmg: 60, radius: 90 } },
  { id: "ice_cone", name: "冰锥", price: 45, icon: "ice", desc: "全场冻结 1 秒并附加 1 层冰附着。", effect: { type: "freezeAll", freezeSec: 1, iceStacks: 1 } },
  { id: "multi_egg", name: "多重蛋", price: 50, icon: "eggs", desc: "下一次发射变为 3 枚扇形蛋（各 60% 伤害）。", effect: { type: "multiShot", count: 3, dmgPct: 0.6, spreadDeg: 14 } },
  { id: "magnet", name: "磁铁", price: 35, icon: "magnet", desc: "5 秒内蛋受到朝向最近敌人的吸力（强度 0.3）。", effect: { type: "magnet", strength: 0.3, durationSec: 5 } },
  { id: "slow_time", name: "时间减缓", price: 30, icon: "hourglass", desc: "4 秒内时间流速 ×0.5，方便观察弹道。", effect: { type: "timescale", scale: 0.5, durationSec: 4 } },
  { id: "peg_refresh", name: "钉板刷新", price: 25, icon: "refresh", desc: "重新排布场上钉子，并重置本回合碰撞加成计数。", effect: { type: "pegReroll", resetBounceBonus: true } },
];

export const ITEM_RULES = {
  maxCarryPerStage: 3,     // 每关最多携带 3 件（同种可叠）
  brickDropChance: 0.08,   // 砖块击碎掉落随机道具概率
  shopUnlockStage: "1-3",  // 通过 1-3 后解锁道具商店
};
