/**
 * 英雄展示层名册。
 *
 * 数据源是 `src/data/heroes.js`（Fable-3 所有权），本文件只做「表现归一化」：
 * 把静态表里的 palette 对象、race 别名、null 元素、字符串 ult id 等
 * 转成 Canvas 矢量绘制与 UI 组件直接可用的形状，并补上图鉴用的文案。
 * 不在这里改数值，也不覆盖静态表已有字段。
 */
import { HERO_LIST, RESERVED_HERO_IDS } from "../data/index.js";
import { FALLBACK_SKILL, resolveSkill } from "../heroes/skills.js";

export const SCHOOLS = {
  combo: { id: "combo", name: "连击", color: "#ff6b9d", icon: "◈", desc: "短间隔命中叠连击层，层数提升暴击伤害" },
  brute: { id: "brute", name: "直殴", color: "#ff8a3d", icon: "◆", desc: "主蛋伤害更高，击退与破砖更稳" },
  elemental: { id: "elemental", name: "属性", color: "#8fd3ff", icon: "✳", desc: "火/冰/雷附着与元素反应" },
  collide: { id: "collide", name: "碰撞", color: "#3ee0c5", icon: "⬢", desc: "碰撞次数转化为额外伤害、分裂与团队增益" },
  support: { id: "support", name: "辅助", color: "#c9a6ff", icon: "✿", desc: "护盾、治疗、减速等团队增益" },
};

export const ELEMENTS = {
  none: { id: "none", name: "物理", color: "#f6f0e6", icon: "●" },
  fire: { id: "fire", name: "火", color: "#ff8a3d", icon: "▲" },
  ice: { id: "ice", name: "冰", color: "#8fd3ff", icon: "❄" },
  thunder: { id: "thunder", name: "雷", color: "#ffe566", icon: "⚡" },
};

/** 键取 `src/data/heroes.js` 的权威写法（鸡族是 `chicken`，历史别名 `chick` 只在归一时接受）。 */
export const RACES = {
  duck: { id: "duck", name: "鸭" },
  chicken: { id: "chicken", name: "鸡" },
  goose: { id: "goose", name: "鹅" },
  bird: { id: "bird", name: "鸟" },
};

const RACE_ALIAS = { chicken: "chicken", chick: "chicken", duck: "duck", goose: "goose", bird: "bird" };
const RARITY_RANK = { r: 3, sr: 4, ssr: 5, n: 2 };

/** 图鉴文案与本地大招表现（静态表只给技能 id，这里补玩家可读的描述）。 */
const FLAVOR = {
  dash_duck: { passive: "首撞暴击：本回合第一次命中必定暴击", ult: { name: "冲鸭冲刺", desc: "下一发蛋伤害 ×2.2 并获得穿透" } },
  ninja_goose: { passive: "分身之蛋：主蛋首次命中后追加 2 枚手里剑小蛋", ult: { name: "千蛋乱舞", desc: "扇形射出 6 枚高速小蛋" } },
  fallen_crow: { passive: "羽刃：连击 ≥ 8 时伤害 +40%", ult: { name: "堕羽斩", desc: "对血量最高的敌人造成 6 倍攻击斩击" } },
  dandy_pigeon: { passive: "自信光环：全队能量获取 +12%", ult: { name: "帅气加油", desc: "为其他英雄各回复 40 点能量" } },
  lark: { passive: "云端余韵：连击衰减时间延长 2 秒", ult: { name: "云端凝滞", desc: "6 秒内连击不衰减，并回复 8% 生命" } },
  sun_bird: { passive: "日轮灼烧：主蛋伤害 +25%，命中附着灼烧", ult: { name: "日轮爆焰", desc: "全场火焰爆发并附着 3 层灼烧" } },
  mech_goose: { passive: "重装蛋：蛋半径 +3、弹性略降，破砖后 +1 穿透", ult: { name: "重装碾压", desc: "下一发蛋变成巨型破城蛋，穿透一切" } },
  drum_chick: { passive: "战鼓光环：全队攻击 +12%", ult: { name: "战鼓齐鸣", desc: "2 回合内全队攻击 +40%" } },
  unlucky_duck: { passive: "越挫越勇：本发蛋每次反弹伤害 +8%", ult: { name: "倒霉转运", desc: "随机 3 名敌人受到 4 倍攻击打击" } },
  pep_chick: { passive: "元气加蛋：每回合额外发射 1 枚蛋", ult: { name: "元气爆发", desc: "下一发同时射出 3 枚蛋" } },
  thunder_chick: { passive: "感电蛋：命中附着感电，弹跳轻微追踪敌人", ult: { name: "雷神审判", desc: "全场连锁闪电，对感电目标额外伤害" } },
  hiphop_duck: { passive: "律动扩散：感电会扩散到最近 2 个目标", ult: { name: "感电律动", desc: "全场敌人附着 2 层感电" } },
  bird_of_paradise: { passive: "余雷：回合结束对感电敌人补一次雷击", ult: { name: "天堂雷雨", desc: "对所有感电敌人造成 5 倍攻击雷暴" } },
  ice_phoenix: { passive: "霜羽蛋：命中附着冻结，冻结目标受伤 +20%", ult: { name: "冰凤暴雪", desc: "冻结所有敌人并造成 3 倍攻击" } },
  emperor_penguin: { passive: "极地：冻结持续 +1 回合，场地生成冰面", ult: { name: "极地封锁", desc: "全体冻结 2 回合并破甲 6 点" } },
  shark_eagle: { passive: "越撞越大：每次碰撞蛋半径 +1、伤害递增", ult: { name: "鲨齿撕咬", desc: "下一发蛋碰撞成长翻倍" } },
  deer_chick: { passive: "鹿角分裂：撞钉时有几率分裂出 1 枚子蛋", ult: { name: "鹿角风暴", desc: "下一发蛋首次命中分裂成 3 枚" } },
  heal_duck: { passive: "回巢温暖：每回合蛋被回收时回复 4% 生命", ult: { name: "蛋黄治愈", desc: "立即回复 25% 生命" } },
  guard_duck: { passive: "铁壳：开局获得 1 层护盾，可挡一次敌人攻击", ult: { name: "铁壳护盾", desc: "获得 2 层护盾" } },
  grace_goose: { passive: "优雅减速：敌人推进速度 -40%", ult: { name: "优雅谢幕", desc: "所有敌人跳过下次推进，并附着 1 层冻结" } },
};

const FALLBACK_PALETTE = ["#ffd447", "#ff8a3d", "#2a2144"];

function toPalette(raw) {
  if (Array.isArray(raw) && raw.length >= 2) return raw.slice(0, 3);
  if (raw && typeof raw === "object") {
    return [raw.primary ?? FALLBACK_PALETTE[0], raw.secondary ?? FALLBACK_PALETTE[1], raw.accent ?? FALLBACK_PALETTE[2]];
  }
  return FALLBACK_PALETTE;
}

function normalizeHero(def) {
  const flavor = FLAVOR[def.id] ?? {};
  // 技能文案以 `heroes/skills.js` 的登记为准，这样编队详情、图鉴与战斗 HUD 说的是同一件事；
  // 只有落到 FALLBACK_SKILL（技能未登记）时才退回本地文案。
  const skill = resolveSkill(def);
  const registered = skill !== FALLBACK_SKILL;
  const skillUlt = registered ? skill.ult : null;
  const cost = Number(skillUlt?.cost);
  return {
    ...def,
    race: RACE_ALIAS[def.race] ?? "bird",
    school: SCHOOLS[def.school] ? def.school : "collide",
    element: def.element ?? "none",
    palette: toPalette(def.palette),
    rarity: typeof def.rarity === "number" ? def.rarity : RARITY_RANK[def.rarity] ?? 3,
    rarityCode: typeof def.rarity === "string" ? def.rarity : null,
    ultId: typeof def.ult === "string" ? def.ult : def.ult?.id ?? null,
    ult: {
      name: skillUlt?.name ?? flavor.ult?.name ?? "金蛋重击",
      cost: Number.isFinite(cost) && cost > 0 ? cost : (def.energy ?? 100),
      desc: skillUlt?.desc ?? flavor.ult?.desc ?? "释放招牌绝技。",
    },
    skillName: registered ? skill.name : null,
    passive: (registered ? skill.desc : null) ?? flavor.passive ?? def.desc ?? "—",
    starPerks: Array.isArray(def.starPerks) ? def.starPerks : [],
    lore: def.desc ?? "",
  };
}

const reserved = new Set(RESERVED_HERO_IDS ?? []);

export const HERO_CATALOG = HERO_LIST.filter((h) => h?.id && !reserved.has(h.id)).map(normalizeHero);
export const HERO_BY_ID = Object.fromEntries(HERO_CATALOG.map((h) => [h.id, h]));
export const HERO_IDS = HERO_CATALOG.map((h) => h.id);
/** 名册中真实出现过的流派，用于过滤器等 UI，避免显示空分类。 */
export const ACTIVE_SCHOOLS = Object.keys(SCHOOLS).filter((s) => HERO_CATALOG.some((h) => h.school === s));

export function getHero(id) {
  return HERO_BY_ID[id] ?? null;
}

export function heroesOfSchool(school) {
  return HERO_CATALOG.filter((h) => h.school === school);
}

/**
 * 把上游 `progression.buildLoadout` 给出的运行时成员补上表现字段，
 * 让渲染层拿到稳定的 palette 数组、元素字符串与可读大招名。
 */
export function decorateMember(member, slot = 0) {
  const display = getHero(member.id) ?? normalizeHero(member);
  // HUD 的读法是「能量条满 = 可放大招」，所以能量上限直接对齐大招消耗，
  // 而不是数据表里的通用 energyMax，否则条满了却放不出招。
  const maxEnergy = display.ult.cost ?? member.maxEnergy ?? member.energyMax ?? 100;
  return {
    ...display,
    ...member,
    slot: member.slot ?? slot,
    race: display.race,
    school: display.school,
    element: display.element,
    palette: display.palette,
    passive: display.passive,
    skillName: display.skillName,
    lore: display.lore,
    rarity: display.rarity,
    ult: { ...display.ult, cost: maxEnergy },
    atk: Number.isFinite(member.atk) ? member.atk : display.atk,
    energy: Math.min(maxEnergy, member.energy ?? 0),
    energyMax: maxEnergy,
    maxEnergy,
  };
}

/** 羁绊：同流派 2 / 3 / 4+ 递进（编队预览用，实战数值由 progression 层给出）。 */
export const BOND_TIERS = [
  { count: 2, label: "小羁绊", atk: 0.08 },
  { count: 3, label: "大羁绊", atk: 0.18 },
  { count: 4, label: "禽王光环", atk: 0.32 },
];

export function computeBonds(heroIds) {
  const counts = {};
  for (const id of heroIds ?? []) {
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
  return { counts, bonds, atkBonus: bonds.reduce((sum, b) => sum + b.atk, 0) };
}

/** 种族联盟科技（图鉴收集简化版）。 */
export function computeRaceTech(dex) {
  const byRace = {};
  for (const [id, owned] of Object.entries(dex ?? {})) {
    if (!owned) continue;
    const h = getHero(id);
    if (!h) continue;
    byRace[h.race] = (byRace[h.race] ?? 0) + 1;
  }
  const bonus = {};
  for (const [race, n] of Object.entries(byRace)) bonus[race] = Math.min(0.15, n * 0.02);
  return { byRace, bonus };
}
