/**
 * 文案与展示常量 — 纯数据，无副作用，不含任何 DOM / window 引用。
 * UI 层只读这里的字符串，逻辑层只产出「码」（reason / kind），由此表翻译。
 */

export const GAME_TITLE = '兵器王者·炉火';
export const GAME_SUBTITLE = '炉火兵谱 · 寻器 · 造器 · 用器';
export const GAME_TAGLINE = '你是少年铁匠，在火、冰、雷三相炉火里，把自己打成一把兵器。';
export const HOMAGE_NOTE = '本作为原创致敬实现，与任何同名商业作品无关，未使用其素材与商标。';

/* ------------------------------ 品质 ------------------------------ */

export const QUALITY_NAME = Object.freeze({
  common: '凡铁',
  uncommon: '精钢',
  rare: '玄兵',
  epic: '紫霄',
  legendary: '传说',
  mythic: '神话',
});

export const QUALITY_COLOR = Object.freeze({
  common: '#9a958c',
  uncommon: '#5fa86a',
  rare: '#4f8fd6',
  epic: '#9b6bff',
  legendary: '#e4b84a',
  mythic: '#e2483a',
});

export const QUALITY_GLOW = Object.freeze({
  common: 'rgba(154,149,140,0.35)',
  uncommon: 'rgba(95,168,106,0.42)',
  rare: 'rgba(79,143,214,0.48)',
  epic: 'rgba(155,107,255,0.55)',
  legendary: 'rgba(228,184,74,0.62)',
  mythic: 'rgba(226,72,58,0.72)',
});

/* ------------------------------ 元素 ------------------------------ */

export const ELEMENT_NAME = Object.freeze({ fire: '火', ice: '冰', thunder: '雷', mixed: '无相' });
export const ELEMENT_FULL_NAME = Object.freeze({
  fire: '赤焰',
  ice: '玄冰',
  thunder: '紫雷',
  mixed: '无相',
});
export const ELEMENT_COLOR = Object.freeze({
  fire: '#c23a2b',
  ice: '#7ec8e3',
  thunder: '#9b6bff',
  mixed: '#e4b84a',
});
export const ELEMENT_ICON = Object.freeze({ fire: '炎', ice: '冰', thunder: '雷', mixed: '虚' });
export const ELEMENT_HINT = '火克冰，冰克雷，雷克火';

/* ------------------------------ 类型 ------------------------------ */

export const TYPE_NAME = Object.freeze({
  sword: '剑',
  saber: '刀',
  spear: '枪',
  halberd: '戟',
  bow: '弓',
  crossbow: '弩',
  axe: '斧',
  hammer: '锤',
  fan: '扇',
  flute: '笛',
  umbrella: '伞',
  blade: '刃',
});

export const TYPE_ROLE_HINT = Object.freeze({
  sword: '均衡：攻守都不落下风',
  saber: '连击：出手快，越打越顺',
  spear: '突进：单体高伤，直取要害',
  halberd: '横扫：群体压制，站得住',
  bow: '狙杀：专点最虚弱的人',
  crossbow: '连发：多段命中，破甲见长',
  axe: '爆发：一下比十下重',
  hammer: '镇守：血厚，替全队挨打',
  fan: '辅助：回气、净化、加成',
  flute: '增益：改速度与冷却',
  umbrella: '护盾：把伤害挡在外头',
  blade: '刺客：极快，吸血续航',
});

/* ------------------------------ 资源 ------------------------------ */

export const RESOURCE_NAME = Object.freeze({
  coin: '铜钱',
  iron: '精铁',
  silverOre: '秘银',
  goldOre: '赤金',
  fireCrystal: '赤焰晶',
  iceCrystal: '玄冰晶',
  thunderCrystal: '紫雷晶',
  luckyCharm: '幸运符',
  stamina: '体力',
  diamond: '玄晶',
  exp: '锻造心得',
  shardCommon: '凡铁碎片',
  shardUncommon: '精钢碎片',
  shardRare: '玄兵碎片',
  shardEpic: '紫霄碎片',
  shardLegendary: '传说碎片',
  shardMythic: '神话碎片',
});

export const RESOURCE_ICON = Object.freeze({
  coin: '钱',
  iron: '铁',
  silverOre: '银',
  goldOre: '金',
  fireCrystal: '炎',
  iceCrystal: '冰',
  thunderCrystal: '雷',
  luckyCharm: '符',
  stamina: '力',
  diamond: '晶',
  exp: '悟',
  shardCommon: '屑',
  shardUncommon: '钢',
  shardRare: '玄',
  shardEpic: '霄',
  shardLegendary: '传',
  shardMythic: '神',
});

/* ------------------------------ 炉 ------------------------------ */

export const FORGE_STAGE_NAME = Object.freeze({ iron: '精铁炉', silver: '白银炉', gold: '黄金炉' });

export const FORGE_STAGE_DESC = Object.freeze({
  iron: '炉温最低，出货最快。凡铁与精钢的家。',
  silver: '秘银入炉，玄兵与紫霄从这里开始成形。',
  gold: '赤金封炉，传说与神话只在这里现身。',
});

/** 三锤演出的旁白：第 3 锤才揭示品质与词条。 */
export const HAMMER_LINES = Object.freeze([
  Object.freeze({ step: 1, text: '第一锤 — 定形。铁在砧上翻了个身。' }),
  Object.freeze({ step: 2, text: '第二锤 — 走火。火色顺着脊线爬上去了。' }),
  Object.freeze({ step: 3, text: '第三锤 — 见真。' }),
]);

export const HAMMER_HINT_BY_QUALITY = Object.freeze({
  common: '火色平平，是把老实家伙。',
  uncommon: '火色发青，比预想的硬。',
  rare: '火色转蓝，砧面开始发烫。',
  epic: '火色泛紫，炉门自己晃了一下。',
  legendary: '火色鎏金 —— 整间铺子都亮了。',
  mythic: '火色赤金，锤子停在半空落不下去。',
});

export const FORGE_RESULT_LINE = Object.freeze({
  common: '成了。虽然只是把凡铁，但握着不虚。',
  uncommon: '成了。钢口正，能用很久。',
  rare: '好器。这一把值得起名字。',
  epic: '紫霄现世 —— 今天这炉没白开。',
  legendary: '传说落砧。铺子外面有人在敲门。',
  mythic: '神兵自鸣。你听见它说了句什么，但没听清。',
});

/* ------------------------------ 词条 ------------------------------ */

export const STAT_NAME = Object.freeze({
  atk: '攻击',
  hp: '生命',
  speed: '速度',
  crit: '暴击',
  critDmg: '暴伤',
  elementDmg: '元素伤',
  lifesteal: '吸血',
  combo: '连击',
  mitigation: '减伤',
  reflect: '反伤',
  atkPct: '攻击强化',
  hpPct: '体魄',
  pierce: '破甲',
  firstStrike: '先声',
  execute: '断魂',
  cdDown: '冷却缩减',
});

export const AFFIX_TIER_NAME = Object.freeze({
  plain: '平',
  fine: '良',
  superb: '绝',
  perfect: '极',
});

/* ------------------------------ 界面 ------------------------------ */

export const TABS = Object.freeze([
  Object.freeze({ id: 'home', name: '炉火', icon: '炉', desc: '锻造、挂机、今日熔炉' }),
  Object.freeze({ id: 'campaign', name: '试炼', icon: '试', desc: '主线关卡与扫荡' }),
  Object.freeze({ id: 'lineup', name: '战阵', icon: '阵', desc: '上阵与羁绊' }),
  Object.freeze({ id: 'codex', name: '图鉴', icon: '谱', desc: '收集度与加成' }),
  Object.freeze({ id: 'arena', name: '竞技', icon: '斗', desc: '本地镜像对战' }),
  Object.freeze({ id: 'bag', name: '背包', icon: '囊', desc: '强化、分解' }),
]);

export const UI = Object.freeze({
  forge: '锻造',
  forgeOnce: '开炉一次',
  forgePreview: '开炉前瞻',
  enhance: '强化',
  dismantle: '分解',
  sweep: '扫荡',
  sweepFree: '今日免体力',
  sweepLocked: '三星后开放',
  collectIdle: '收取挂机',
  masterForge: '大师熔炉',
  masterForgeUsed: '今日已用',
  useLucky: '投入幸运符',
  elementBias: '元素偏向',
  noBias: '不指定',
  quality: '品质',
  element: '元素',
  type: '类型',
  level: '等级',
  affixes: '词条',
  skill: '技能',
  skillSlots: '技能槽',
  lore: '兵器志',
  power: '战力',
  recommendPower: '推荐战力',
  lockedSlot: '未解锁',
  cost: '消耗',
  refund: '返还',
  chance: '概率',
  pity: '保底',
  empty: '空',
  locked: '已锁定',
  inLineup: '已上阵',
  offlineGain: '离线收益',
  idleRate: '每分钟产出',
  codexProgress: '图鉴收集',
  codexBonus: '收集加成',
});

/** 逻辑层 reason 码 → 人话。 */
export const REASON = Object.freeze({
  ok: '成功',
  invalid_state: '存档数据不完整，无法执行。',
  invalid_stage: '没有这座炉子。',
  invalid_element: '没有这种元素偏向。',
  invalid_weapon: '找不到这把兵器。',
  insufficient_resources: '材料不够，再去挂会儿机吧。',
  no_lucky_charm: '幸运符不够。',
  master_forge_exhausted: '大师熔炉今日已用完，明天再来。',
  bag_full: '兵器架满了，先分解几把。',
  level_capped: '已到该品质的强化上限，提升品质才能继续。',
  weapon_locked: '这把兵器已锁定，先解锁再操作。',
  weapon_in_lineup: '这把兵器还在阵上，先下阵。',
  nothing_to_collect: '炉子还没攒够东西，稍等一会儿。',
  no_rng: '缺少随机源，无法开炉。',
  unknown_stage: '没有这一关。',
  sweep_locked: '打到三星才能扫荡这一关。',
  insufficient_stamina: '体力不够，等一会儿再来。',
});

export const TIPS = Object.freeze([
  '火克冰、冰克雷、雷克火 —— 打不动的时候，先换元素再换装备。',
  '三锤只在第三锤揭示品质，前两锤的火色只是气氛。',
  '幸运符会把整条品质曲线往上抬，不是只加神话概率。',
  '大师熔炉每天一次，留给黄金炉最划算。',
  '分解返还 60% 材料，留着占位的凡铁不如回炉。',
  '同类型 2 把、同元素 3 把就有羁绊；神话 1 把就能唤醒兵魂。',
  '离线最多结算 8 小时，睡前记得把关卡推高一点。',
  '每 3 级解锁一个技能槽，最多 3 个。',
  '关卡打到三星就能扫荡：1 点体力换一次重复掉落，每日前两次还不收体力。',
]);

export const EMPTY_STATES = Object.freeze({
  bag: '兵器架空着。去炉边打一把？',
  lineup: '阵上无人。至少上阵一把兵器才能试炼。',
  codex: '图鉴还是空白的，第一把兵器会写下第一页。',
  arena: '竞技场今日名额已满，明日请早。',
  idle: '炉子刚清过，还没攒下东西。',
});

export const LOG_TEMPLATES = Object.freeze({
  forge: '{stage}开炉，得【{quality}·{name}】。',
  enhance: '【{name}】强化至 {level} 级。',
  enhanceSlot: '【{name}】解锁了第 {slot} 个技能槽。',
  dismantle: '分解【{name}】，回收 {refund}。',
  idle: '收取挂机产出：{gains}。',
  stageClear: '通过【{stage}】。',
  sweep: '扫荡【{stage}】×{times}，得 {gains}。',
});

export default Object.freeze({
  GAME_TITLE,
  GAME_SUBTITLE,
  GAME_TAGLINE,
  HOMAGE_NOTE,
  QUALITY_NAME,
  QUALITY_COLOR,
  QUALITY_GLOW,
  ELEMENT_NAME,
  ELEMENT_FULL_NAME,
  ELEMENT_COLOR,
  ELEMENT_ICON,
  ELEMENT_HINT,
  TYPE_NAME,
  TYPE_ROLE_HINT,
  RESOURCE_NAME,
  RESOURCE_ICON,
  FORGE_STAGE_NAME,
  FORGE_STAGE_DESC,
  HAMMER_LINES,
  HAMMER_HINT_BY_QUALITY,
  FORGE_RESULT_LINE,
  STAT_NAME,
  AFFIX_TIER_NAME,
  TABS,
  UI,
  REASON,
  TIPS,
  EMPTY_STATES,
  LOG_TEMPLATES,
});
