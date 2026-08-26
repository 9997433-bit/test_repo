/**
 * 英雄名册 / 流派 / 羁绊。
 *
 * `src/data/**` 归 Fable-3 所有，本文件只读取它并做「上游优先」合并：
 * 上游已经填好的字段覆盖本地兜底值，缺失的英雄用本地定义补齐，
 * 这样两边并行推进时不会互相覆盖。
 */
import { HEROES as UPSTREAM_HEROES } from "../data/index.js";

export const SCHOOLS = {
  combo: { id: "combo", name: "连击", color: "#ff6b9d", icon: "◈", desc: "短间隔命中叠连击层，层数提升暴击伤害" },
  brute: { id: "brute", name: "直殴", color: "#ff8a3d", icon: "◆", desc: "主蛋伤害更高，击退与破砖更稳" },
  elemental: { id: "elemental", name: "属性", color: "#8fd3ff", icon: "✳", desc: "火/冰/雷附着与元素反应" },
  collide: { id: "collide", name: "碰撞", color: "#3ee0c5", icon: "⬢", desc: "碰撞次数转化为额外伤害与分裂" },
  support: { id: "support", name: "辅助", color: "#c9a6ff", icon: "✿", desc: "护盾、治疗、减速等团队增益" },
};

export const ELEMENTS = {
  none: { id: "none", name: "物理", color: "#f6f0e6", icon: "●" },
  fire: { id: "fire", name: "火", color: "#ff8a3d", icon: "▲" },
  ice: { id: "ice", name: "冰", color: "#8fd3ff", icon: "❄" },
  thunder: { id: "thunder", name: "雷", color: "#ffe566", icon: "⚡" },
};

export const RACES = {
  duck: { id: "duck", name: "鸭" },
  chick: { id: "chick", name: "鸡" },
  goose: { id: "goose", name: "鹅" },
  bird: { id: "bird", name: "鸟" },
};

/** 本地兜底名册：20 只，覆盖 GDD 全部流派。 */
const LOCAL_HEROES = [
  // —— 连击 ——
  {
    id: "dash_duck", name: "冲鸭", race: "duck", school: "combo", element: "none",
    atk: 14, rarity: 3, palette: ["#ffd447", "#ff8a3d", "#2a2144"],
    passive: "首撞暴击：本回合第一次命中必定暴击（×2.0）",
    ult: { name: "冲鸭冲刺", cost: 100, desc: "下一发蛋伤害 ×2.2 并获得穿透" },
    lore: "起跑线在哪不重要，重要的是冲。",
  },
  {
    id: "ninja_goose", name: "手里剑鹅", race: "goose", school: "combo", element: "none",
    atk: 13, rarity: 4, palette: ["#e8f0ff", "#3ee0c5", "#1c2540"],
    passive: "分身之蛋：主蛋首次命中后追加 2 枚手里剑小蛋",
    ult: { name: "千蛋乱舞", cost: 100, desc: "扇形射出 6 枚高速小蛋" },
    lore: "鹅刀流第七代传人，从不承认自己是鹅。",
  },
  {
    id: "fallen_crow", name: "堕羽鸦", race: "bird", school: "combo", element: "none",
    atk: 15, rarity: 4, palette: ["#6b5b95", "#ff6b9d", "#141020"],
    passive: "羽刃：连击 ≥ 8 时伤害 +40%",
    ult: { name: "堕羽斩", cost: 100, desc: "对当前血量最高的敌人造成 6 倍攻击斩击" },
    lore: "掉毛不是衰老，是酷。",
  },
  {
    id: "dandy_pigeon", name: "小帅鸽", race: "bird", school: "combo", element: "none",
    atk: 11, rarity: 3, palette: ["#9fd6ff", "#ffd447", "#22304a"],
    passive: "自信光环：全队能量获取 +12%",
    ult: { name: "帅气加油", cost: 90, desc: "为其他英雄各回复 40 点能量" },
    lore: "镜子是它的第六根羽毛。",
  },
  {
    id: "lark", name: "云朵雀", race: "bird", school: "combo", element: "none",
    atk: 12, rarity: 5, palette: ["#ffffff", "#8fd3ff", "#2a2144"],
    passive: "云端余韵：连击衰减时间延长 2 秒",
    ult: { name: "云端凝滞", cost: 100, desc: "6 秒内连击不衰减，并回复 8% 生命" },
    lore: "隐藏款，云里来云里去。",
  },
  // —— 直殴 ——
  {
    id: "sun_bird", name: "日轮鸟", race: "bird", school: "brute", element: "fire",
    atk: 18, rarity: 4, palette: ["#ff8a3d", "#ffd447", "#3a1420"],
    passive: "日轮灼烧：主蛋伤害 +25%，命中附着灼烧",
    ult: { name: "日轮爆焰", cost: 100, desc: "全场火焰爆发并附着 3 层灼烧" },
    lore: "自带日出，自带日落。",
  },
  {
    id: "mech_goose", name: "齿轮鹅", race: "goose", school: "brute", element: "none",
    atk: 17, rarity: 3, palette: ["#b8c2cc", "#ffd447", "#232833"],
    passive: "重装蛋：蛋半径 +3、弹性略降，破砖后 +1 穿透",
    ult: { name: "重装碾压", cost: 100, desc: "下一发蛋变成巨型破城蛋，穿透一切" },
    lore: "上油以后每天都是新的一天。",
  },
  {
    id: "drum_chick", name: "战鼓鸡", race: "chick", school: "brute", element: "none",
    atk: 15, rarity: 3, palette: ["#ff4d6d", "#ffd447", "#2a1420"],
    passive: "战鼓光环：全队攻击 +12%",
    ult: { name: "战鼓齐鸣", cost: 100, desc: "2 回合内全队攻击 +40%" },
    lore: "咚。咚咚。咚咚咚。",
  },
  {
    id: "unlucky_duck", name: "倒霉鸭", race: "duck", school: "brute", element: "none",
    atk: 14, rarity: 3, palette: ["#7f8fa6", "#ffd447", "#20242e"],
    passive: "越挫越勇：本发蛋每次反弹伤害 +8%（上限 +80%）",
    ult: { name: "倒霉转运", cost: 100, desc: "随机 3 名敌人受到 4 倍攻击的霉运打击" },
    lore: "踩到香蕉皮也能踩出连击。",
  },
  {
    id: "pep_chick", name: "元气鸡", race: "chick", school: "brute", element: "none",
    atk: 12, rarity: 3, palette: ["#ffd447", "#ff6b9d", "#33240f"],
    passive: "元气加蛋：每回合额外发射 1 枚蛋",
    ult: { name: "元气爆发", cost: 90, desc: "下一发同时射出 3 枚蛋" },
    lore: "早睡早起，蛋多力量大。",
  },
  // —— 属性 ——
  {
    id: "thunder_chick", name: "雷神鸡", race: "chick", school: "elemental", element: "thunder",
    atk: 16, rarity: 4, palette: ["#ffe566", "#8fd3ff", "#2c2a10"],
    passive: "感电蛋：命中附着感电，弹跳轻微追踪敌人",
    ult: { name: "雷神审判", cost: 100, desc: "全场连锁闪电，对感电目标额外 50% 伤害" },
    lore: "自称雷神，其实是插座。",
  },
  {
    id: "hiphop_duck", name: "嘻哈鸭", race: "duck", school: "elemental", element: "thunder",
    atk: 14, rarity: 3, palette: ["#ffe566", "#ff6b9d", "#241d3a"],
    passive: "律动扩散：感电会扩散到最近 2 个目标",
    ult: { name: "感电律动", cost: 90, desc: "全场敌人附着 2 层感电" },
    lore: "Yo，蛋要押韵地下。",
  },
  {
    id: "bird_of_paradise", name: "天堂鸟", race: "bird", school: "elemental", element: "thunder",
    atk: 15, rarity: 4, palette: ["#3ee0c5", "#ffd447", "#132a2b"],
    passive: "余雷：回合结束对感电敌人补一次雷击",
    ult: { name: "天堂雷雨", cost: 100, desc: "对所有感电敌人造成 5 倍攻击雷暴" },
    lore: "羽毛比彩虹还多两种颜色。",
  },
  {
    id: "ice_phoenix", name: "冰凤", race: "bird", school: "elemental", element: "ice",
    atk: 16, rarity: 5, palette: ["#8fd3ff", "#e8f7ff", "#16243a"],
    passive: "霜羽蛋：命中附着冻结，冻结目标受伤 +20%",
    ult: { name: "冰凤暴雪", cost: 100, desc: "全场暴雪：冻结所有敌人并造成 3 倍攻击" },
    lore: "浴冰重生，重生完还是很冷。",
  },
  {
    id: "emperor_penguin", name: "帝企鹅", race: "bird", school: "elemental", element: "ice",
    atk: 15, rarity: 4, palette: ["#1b2b4a", "#ffd447", "#e8f7ff"],
    passive: "极地：冻结持续 +1 回合，场地生成冰面",
    ult: { name: "极地封锁", cost: 100, desc: "全体冻结 2 回合并破甲 6 点" },
    lore: "肚子是滑梯，不是餐桌。",
  },
  // —— 碰撞 ——
  {
    id: "shark_eagle", name: "鲨齿雕", race: "bird", school: "collide", element: "none",
    atk: 15, rarity: 4, palette: ["#4a6b8a", "#ffd447", "#101b28"],
    passive: "越撞越大：每次碰撞蛋半径 +1、伤害 +6%",
    ult: { name: "鲨齿撕咬", cost: 100, desc: "下一发蛋碰撞成长翻倍且不会被回收" },
    lore: "海里长大的鸟，牙口很好。",
  },
  {
    id: "deer_chick", name: "鹿角鸡", race: "chick", school: "collide", element: "none",
    atk: 13, rarity: 3, palette: ["#c98f5a", "#ffd447", "#2b1c12"],
    passive: "鹿角分裂：撞钉时有几率分裂出 1 枚子蛋",
    ult: { name: "鹿角风暴", cost: 90, desc: "下一发蛋首次命中分裂成 3 枚" },
    lore: "头上那对是天线，能收到蛋的频率。",
  },
  // —— 辅助 ——
  {
    id: "heal_duck", name: "治愈鸭", race: "duck", school: "support", element: "none",
    atk: 9, rarity: 3, palette: ["#a8f0c6", "#ffd447", "#173428"],
    passive: "回巢温暖：每回合蛋被回收时回复 4% 生命",
    ult: { name: "蛋黄治愈", cost: 90, desc: "立即回复 25% 生命" },
    lore: "治愈系，主治蛋碎。",
  },
  {
    id: "guard_duck", name: "守护鸭", race: "duck", school: "support", element: "none",
    atk: 10, rarity: 3, palette: ["#9fb8ff", "#ffd447", "#1a2140"],
    passive: "铁壳：开局获得 1 层护盾，可挡一次敌人攻击",
    ult: { name: "铁壳护盾", cost: 90, desc: "获得 2 层护盾" },
    lore: "壳硬，心软。",
  },
  {
    id: "grace_goose", name: "优雅鹅", race: "goose", school: "support", element: "ice",
    atk: 11, rarity: 4, palette: ["#f6f0e6", "#c9a6ff", "#2a2144"],
    passive: "优雅减速：敌人推进速度 -40%",
    ult: { name: "优雅谢幕", cost: 90, desc: "所有敌人跳过下次推进，并附着 1 层冻结" },
    lore: "走位比天鹅还天鹅。",
  },
];

function mergeHero(local) {
  const up = UPSTREAM_HEROES?.[local.id];
  if (!up) return { ...local };
  return {
    ...local,
    ...up,
    element: up.element ?? local.element,
    palette: up.palette ?? local.palette,
    passive: up.passive ?? local.passive,
    ult: up.ult ?? local.ult,
    lore: up.lore ?? local.lore,
    rarity: up.rarity ?? local.rarity,
  };
}

const merged = LOCAL_HEROES.map(mergeHero);

// 上游若新增了本地没有的英雄，也一并纳入（给默认展示字段）。
for (const [id, up] of Object.entries(UPSTREAM_HEROES ?? {})) {
  if (merged.some((h) => h.id === id)) continue;
  merged.push({
    element: "none", rarity: 3, palette: ["#ffd447", "#ff8a3d", "#2a2144"],
    passive: "—", ult: { name: "未知绝技", cost: 100, desc: "—" }, lore: "",
    ...up,
  });
}

export const HERO_CATALOG = merged;
export const HERO_BY_ID = Object.fromEntries(merged.map((h) => [h.id, h]));
export const HERO_IDS = merged.map((h) => h.id);

export function getHero(id) {
  return HERO_BY_ID[id] ?? null;
}

export function heroesOfSchool(school) {
  return HERO_CATALOG.filter((h) => h.school === school);
}

/** 羁绊：同流派 2 / 3 / 4+ 递进。 */
export const BOND_TIERS = [
  { count: 2, label: "小羁绊", atk: 0.08, extra: 0 },
  { count: 3, label: "大羁绊", atk: 0.18, extra: 1 },
  { count: 4, label: "禽王光环", atk: 0.32, extra: 2 },
];

export function computeBonds(heroIds) {
  const counts = {};
  for (const id of heroIds) {
    const h = getHero(id);
    if (!h) continue;
    counts[h.school] = (counts[h.school] ?? 0) + 1;
  }
  const bonds = [];
  for (const [school, count] of Object.entries(counts)) {
    let tier = null;
    for (const t of BOND_TIERS) if (count >= t.count) tier = t;
    if (tier) bonds.push({ school, count, ...tier, name: SCHOOLS[school]?.name ?? school });
  }
  bonds.sort((a, b) => b.count - a.count);
  const atkBonus = bonds.reduce((sum, b) => sum + b.atk, 0);
  return { counts, bonds, atkBonus };
}

/** 种族联盟科技（图鉴收集简化版）。 */
export function computeRaceTech(dex) {
  const owned = Object.keys(dex ?? {}).filter((id) => dex[id]);
  const byRace = {};
  for (const id of owned) {
    const h = getHero(id);
    if (!h) continue;
    byRace[h.race] = (byRace[h.race] ?? 0) + 1;
  }
  const bonus = {};
  for (const [race, n] of Object.entries(byRace)) bonus[race] = Math.min(0.15, n * 0.02);
  return { byRace, bonus };
}
