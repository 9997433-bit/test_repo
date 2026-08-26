/**
 * 兵种数据表（fable-balance）
 *
 * 克制关系见 config.TROOP_BEATS：步克骑、骑克弓、弓克步；
 * vsBonus 为克制时的伤害加成（统一 0.25）。
 * - 步兵：便宜耐打，前期主力，吃铁少；
 * - 骑兵：攻高价贵训练慢，吃铁多，需火炉 5 级解锁骑兵营；
 * - 弓兵：输出/成本折中，吃木材（箭矢），训练居中。
 * trainCost 为单兵造价，trainTicks 为单兵训练 tick 数（4 tick = 1 秒）。
 */
export const TROOPS = {
  infantry: {
    id: "infantry",
    name: "枪盾兵",
    vsBonus: 0.25,
    trainCost: { food: 12, wood: 6, coal: 0, iron: 3 },
    trainTicks: 8,
    atk: 10,
    def: 14,
    hp: 130,
  },
  cavalry: {
    id: "cavalry",
    name: "玄铁骑",
    vsBonus: 0.25,
    trainCost: { food: 20, wood: 4, coal: 0, iron: 9 },
    trainTicks: 12,
    atk: 16,
    def: 9,
    hp: 105,
  },
  archer: {
    id: "archer",
    name: "强弩手",
    vsBonus: 0.25,
    trainCost: { food: 10, wood: 14, coal: 0, iron: 5 },
    trainTicks: 10,
    atk: 13,
    def: 7,
    hp: 85,
  },
};
