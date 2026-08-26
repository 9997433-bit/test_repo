/**
 * UI 兜底数据（mock）。
 *
 * 仅在 `js/data/**` 尚未注入时使用，用于让界面在没有逻辑层的情况下也能完整演示。
 * 一旦 opus-2 的 `data/weapons.js` / `data/stages.js` 接入，本文件的同名数据会被替换。
 * 结构刻意对齐 GDD §3.4 的兵器字段与 §3.7 的关卡定义。
 */

/* ============================ 技能 ============================ */

export const MOCK_SKILLS = {
  sk_flame_slash: { id: 'sk_flame_slash', name: '燎原斩', cd: 3, desc: '对单体造成 160% 火伤，附带灼烧。' },
  sk_frost_edge: { id: 'sk_frost_edge', name: '霜刃', cd: 3, desc: '对单体造成 150% 冰伤并降低其速度。' },
  sk_thunder_pierce: { id: 'sk_thunder_pierce', name: '贯雷', cd: 4, desc: '无视 20% 减伤，造成 175% 雷伤。' },
  sk_split_mountain: { id: 'sk_split_mountain', name: '开山', cd: 4, desc: '对全体造成 95% 伤害。' },
  sk_gale_volley: { id: 'sk_gale_volley', name: '疾风连射', cd: 3, desc: '连射三箭，每箭 62% 伤害。' },
  sk_wind_veil: { id: 'sk_wind_veil', name: '云遮', cd: 5, desc: '我方全体减伤 22%，持续 2 回合。' },
  sk_song_of_frost: { id: 'sk_song_of_frost', name: '寒声引', cd: 5, desc: '冻结敌方速度最高者 1 回合。' },
  sk_rain_shroud: { id: 'sk_rain_shroud', name: '冥雨', cd: 4, desc: '对全体造成 80% 雷伤并吸取 30% 为治疗。' },
  sk_sun_crow: { id: 'sk_sun_crow', name: '金乌坠日', cd: 6, desc: '造成 320% 火伤，若目标为冰属性伤害翻倍。' },
  sk_nine_heaven: { id: 'sk_nine_heaven', name: '九霄雷引', cd: 6, desc: '召九道雷，每道 70% 雷伤。' },
  sk_sunset_reap: { id: 'sk_sunset_reap', name: '残阳收', cd: 5, desc: '斩击全体 130%，击杀则重置冷却。' },
  sk_vajra_quake: { id: 'sk_vajra_quake', name: '金刚震', cd: 5, desc: '眩晕单体 1 回合并造成 200% 雷伤。' },
  sk_burn_heaven: { id: 'sk_burn_heaven', name: '焚天', cd: 7, desc: '全场燃烧，每回合造成己方攻击 45% 的火伤。' },
  sk_abyss_tide: { id: 'sk_abyss_tide', name: '沧溟怒潮', cd: 7, desc: '全体 210% 冰伤，命中冰弱者附加冻结。' },
  sk_awaken_thunder: { id: 'sk_awaken_thunder', name: '惊蛰', cd: 7, desc: '雷链弹射 5 次，每次 110% 雷伤。' },
  sk_no_edge: { id: 'sk_no_edge', name: '无锋', cd: 7, desc: '本回合免疫所有克制惩罚，攻击必定暴击。' },
  sk_basic: { id: 'sk_basic', name: '基础打法', cd: 0, desc: '无主动技能，稳定输出。' }
};

/* ============================ 词条池 ============================ */

export const MOCK_AFFIXES = [
  { id: 'af_element', name: '元素伤害', unit: '%', min: 4, max: 22 },
  { id: 'af_crit', name: '暴击率', unit: '%', min: 3, max: 18 },
  { id: 'af_lifesteal', name: '吸血', unit: '%', min: 3, max: 15 },
  { id: 'af_combo', name: '连击率', unit: '%', min: 3, max: 16 },
  { id: 'af_reduce', name: '减伤', unit: '%', min: 2, max: 12 },
  { id: 'af_speed', name: '速度', unit: '', min: 2, max: 14 },
  { id: 'af_reflect', name: '反伤', unit: '%', min: 3, max: 17 }
];

/* ============================ 兵器谱（32 把） ============================ */

const W = (
  id, name, title, type, element, quality, baseAtk, baseHp, speed, skillId, forgeStage, lore, tags
) => ({ id, name, title, type, element, quality, baseAtk, baseHp, speed, skillId, forgeStage, lore, tags });

export const MOCK_WEAPONS = [
  // —— 凡铁 ——
  W('w_tiegu_jian', '铁骨剑', '初火淬骨', '剑', 'fire', 'common', 18, 72, 22, 'sk_basic', 'iron',
    '村口老铁匠打的第一把剑，刃口粗粝，却记得每一次锤声。', ['入门', '锻造']),
  W('w_duanchai_dao', '断柴刀', '樵歌未歇', '刀', 'ice', 'common', 20, 64, 25, 'sk_basic', 'iron',
    '本是砍柴的家什，磨了三年，竟也照得见人影。', ['入门']),
  W('w_bailazhu_qiang', '白蜡枪', '风里学枪', '枪', 'thunder', 'common', 17, 78, 24, 'sk_basic', 'iron',
    '白蜡杆柔韧，少年握着它在雨里站了整整一夜。', ['入门']),
  W('w_qiaofu_fu', '樵夫斧', '一斧半山', '斧', 'fire', 'common', 22, 60, 18, 'sk_basic', 'iron',
    '斧背有一道旧凹痕，据说是砸开过一块陨铁。', ['入门']),

  // —— 精钢 ——
  W('w_qingfeng_jian', '青锋剑', '霜色三尺', '剑', 'ice', 'uncommon', 30, 118, 26, 'sk_frost_edge', 'iron',
    '出鞘时有薄霜自刃上散去，故名青锋。', ['轻灵']),
  W('w_liefeng_gong', '猎风弓', '弦断风止', '弓', 'thunder', 'uncommon', 32, 96, 30, 'sk_gale_volley', 'iron',
    '猎户的弓，箭走风路，从不空回。', ['远程']),
  W('w_lianzhu_nu', '连珠弩', '一息七矢', '弩', 'fire', 'uncommon', 28, 108, 27, 'sk_gale_volley', 'iron',
    '匠人拆过七次又装回去，只为让它再快半息。', ['远程', '机巧']),
  W('w_shixin_chui', '石心锤', '重则不摧', '锤', 'thunder', 'uncommon', 34, 132, 16, 'sk_basic', 'iron',
    '锤心嵌一枚山石，落下时地面会闷响一声。', ['重装']),
  W('w_liuyun_shan', '流云扇', '摇落半城', '扇', 'ice', 'uncommon', 26, 104, 32, 'sk_wind_veil', 'iron',
    '扇骨十六根，展开是云，收拢是刃。', ['辅助']),
  W('w_zhezhi_san', '折枝伞', '雨中借道', '伞', 'ice', 'uncommon', 27, 126, 23, 'sk_wind_veil', 'iron',
    '伞面绘折枝红梅，撑开能挡三箭。', ['防御']),

  // —— 玄兵 ——
  W('w_hanshuang_dao', '寒霜刀', '刀过成冰', '刀', 'ice', 'rare', 52, 178, 28, 'sk_frost_edge', 'silver',
    '雪夜出刀，血未落地已冻成红珠。', ['爆发']),
  W('w_poyun_qiang', '破云枪', '一点破云', '枪', 'thunder', 'rare', 50, 190, 27, 'sk_thunder_pierce', 'silver',
    '枪尖点处云开一线，雷从那一线里下来。', ['穿透']),
  W('w_xuanwu_ji', '玄武戟', '负甲不退', '戟', 'ice', 'rare', 46, 226, 20, 'sk_wind_veil', 'silver',
    '戟身刻玄武纹，持之者退无可退，便不退。', ['防御', '守阵']),
  W('w_luoyan_gong', '落雁弓', '弦响雁沉', '弓', 'ice', 'rare', 55, 162, 31, 'sk_gale_volley', 'silver',
    '据说拉满时天上的雁会自己落下来。', ['远程', '精准']),
  W('w_poyue_nu', '破月弩', '月缺一角', '弩', 'thunder', 'rare', 54, 168, 29, 'sk_thunder_pierce', 'silver',
    '弩臂上有一道月牙形缺口，是被自己的箭崩的。', ['远程']),
  W('w_kaishan_fu', '开山斧', '力可裂谷', '斧', 'fire', 'rare', 58, 200, 17, 'sk_split_mountain', 'silver',
    '开山不是比喻，那道峡谷至今还叫斧口。', ['群攻']),
  W('w_fenghuo_shan', '烽火扇', '一扇燃城', '扇', 'fire', 'rare', 48, 172, 33, 'sk_flame_slash', 'silver',
    '扇面题「烽火连三月」，展开时字会烧起来。', ['灼烧']),
  W('w_mingyu_san', '冥雨伞', '雨落无声', '伞', 'thunder', 'rare', 47, 214, 24, 'sk_rain_shroud', 'silver',
    '撑伞人走过的地方，雨是紫色的。', ['吸血']),

  // —— 紫霄 ——
  W('w_chengying_jian', '承影剑', '影先于形', '剑', 'thunder', 'epic', 84, 296, 34, 'sk_thunder_pierce', 'silver',
    '看得见影子，看不见剑；等看见剑，人已经倒了。', ['极速', '暗影']),
  W('w_fenyuan_dao', '焚原刀', '一刀燎野', '刀', 'fire', 'epic', 90, 272, 30, 'sk_flame_slash', 'gold',
    '出鞘三寸，草原烧了三天。', ['灼烧', '爆发']),
  W('w_suiyue_ji', '岁月戟', '岁不我与', '戟', 'thunder', 'epic', 78, 340, 22, 'sk_vajra_quake', 'gold',
    '戟上有四十道刻痕，一年一道，最后一道未刻完。', ['控制']),
  W('w_zhenyue_chui', '镇岳锤', '锤定山河', '锤', 'fire', 'epic', 92, 318, 15, 'sk_split_mountain', 'gold',
    '传说曾把一座活火山按了回去。', ['群攻', '重装']),
  W('w_yuluo_di', '玉落笛', '声寒彻骨', '笛', 'ice', 'epic', 74, 288, 36, 'sk_song_of_frost', 'gold',
    '吹到第七个音，湖面结冰。', ['控制', '辅助']),
  W('w_shuangyue_jiren', '霜月戟刃', '月照千兵', '戟刃', 'ice', 'epic', 86, 302, 28, 'sk_frost_edge', 'gold',
    '刃如新月，照过的兵器都会生霜。', ['群攻']),

  // —— 传说 ——
  W('w_jinwu_gong', '金乌弓', '射日之余', '弓', 'fire', 'legendary', 142, 452, 35, 'sk_sun_crow', 'gold',
    '后羿射日剩下的那一张弓，弓弦是日光搓成的。', ['神射', '克冰']),
  W('w_jiuxiao_di', '九霄笛', '一曲引雷', '笛', 'thunder', 'legendary', 128, 486, 38, 'sk_nine_heaven', 'gold',
    '笛声起时，九霄之上有回音，那不是回音。', ['群攻', '雷引']),
  W('w_canyang_jiren', '残阳戟刃', '血照西山', '戟刃', 'fire', 'legendary', 150, 424, 26, 'sk_sunset_reap', 'gold',
    '握它的人从不看日落，因为刃上一直有一轮。', ['收割']),
  W('w_jingang_fu', '金刚斧', '不坏之身', '斧', 'thunder', 'legendary', 136, 520, 19, 'sk_vajra_quake', 'gold',
    '斧身千锤不损，只在锤过神铁那次崩了一个角。', ['坚韧', '控制']),

  // —— 神话 ——
  W('w_chixiao', '赤霄·焚天', '天问其一', '剑', 'fire', 'mythic', 228, 742, 40, 'sk_burn_heaven', 'gold',
    '铸剑者投身炉中，第三日剑成，炉底只余一枚赤色的骨。', ['神话', '兵魂']),
  W('w_cangming', '沧溟·玄冥', '天问其二', '枪', 'ice', 'mythic', 208, 826, 33, 'sk_abyss_tide', 'gold',
    '枪尖朝海一点，浪停了半刻，然后倒着涌回去。', ['神话', '兵魂']),
  W('w_jiulei', '惊蛰·九雷', '天问其三', '锤', 'thunder', 'mythic', 240, 688, 31, 'sk_awaken_thunder', 'gold',
    '春分那日，它自己在铁砧上响了九下。', ['神话', '兵魂']),
  W('w_wufeng', '无锋·天工', '天问其四', '刀', 'ice', 'mythic', 196, 804, 44, 'sk_no_edge', 'mythic',
    '通体无刃。老匠说：兵之至者，不以锋伤人。', ['神话', '兵魂', '至简'])
];

export const MOCK_WEAPON_BY_ID = Object.fromEntries(MOCK_WEAPONS.map((w) => [w.id, w]));

/* ============================ 试炼 40 关 ============================ */

const REGIONS = [
  { id: 'r1', name: '铁匠村外', element: 'fire', from: 1, to: 8 },
  { id: 'r2', name: '断刃荒原', element: 'thunder', from: 9, to: 16 },
  { id: 'r3', name: '焚风峡', element: 'fire', from: 17, to: 24 },
  { id: 'r4', name: '玄冰渊', element: 'ice', from: 25, to: 32 },
  { id: 'r5', name: '雷泽天阙', element: 'thunder', from: 33, to: 40 }
];

const STAGE_NAMES = [
  '晨钟渡', '断柴道', '野狼坡', '锈甲堆', '火种祭', '铁匠棚', '碎石涧', '旧窑口',
  '折戟丘', '荒原风', '白骨栈', '沙盗营', '残旗坡', '无名冢', '拾荒者', '断刃碑',
  '焚风口', '熔岩桥', '赤鳞窟', '炽心炉', '火兽巢', '炎脊道', '灼骨崖', '焚天门',
  '初雪岭', '冰棱林', '霜语湖', '玄冰阶', '寒鸦渡', '冻河底', '万年窟', '沧溟殿',
  '雷泽畔', '电蛇涧', '惊蛰台', '云锻场', '九霄梯', '天阙门', '雷心殿', '兵器王座'
];

const BOSS_NAMES = {
  5: '火种守夜人', 10: '荒原独眼狼王', 15: '拾荒老匠', 20: '炽心炉灵',
  25: '雪隐白猿', 30: '冻河沉尸将', 35: '惊蛰雷童', 40: '兵器王·无名'
};

export const MOCK_REGIONS = REGIONS;

export const MOCK_STAGES = STAGE_NAMES.map((name, i) => {
  const index = i + 1;
  const region = REGIONS.find((r) => index >= r.from && index <= r.to);
  const isElite = index % 5 === 0;
  const element = isElite
    ? region.element
    : ['fire', 'ice', 'thunder'][(index * 7) % 3];
  const power = Math.round(48 * Math.pow(1.235, index - 1) * (isElite ? 1.32 : 1));
  return {
    id: `stage_${String(index).padStart(2, '0')}`,
    index,
    name,
    regionId: region.id,
    regionName: region.name,
    element,
    isElite,
    bossName: BOSS_NAMES[index] || null,
    staminaCost: isElite ? 8 : 5,
    powerReq: power,
    waves: isElite ? 3 : Math.min(3, 1 + Math.floor(index / 14)),
    rewards: {
      coin: Math.round(60 * Math.pow(1.16, index - 1)),
      iron: isElite ? 0 : Math.round(6 + index * 1.4),
      silverOre: index >= 9 ? Math.round(1 + index * 0.35) : 0,
      goldOre: index >= 21 ? Math.round(1 + (index - 20) * 0.4) : 0,
      [`${element}Crystal`]: isElite ? 3 : 1
    }
  };
});

/* ============================ 竞技对手 ============================ */

export const MOCK_FOE_NAMES = [
  '铁面客', '断刃生', '雪衣侯', '拾火人', '青囊叟', '折戟郎', '听雷者', '无名匠',
  '赤瞳', '寒山客', '槊影', '九斤半', '柳三更', '独臂翁', '碎瓷', '云中鹤',
  '烬', '白骨书生', '燧', '兵谱第一'
];

export const MOCK_FOE_TITLES = [
  '不问出处', '刃口向内', '一夜白头', '炉边守岁', '医兵两全', '折而不弯', '听雷辨位', '铸而不名',
  '见血封喉', '寒石为伴', '槊长丈八', '力压铁砧', '三更磨刀', '一臂敌千', '碎而后立', '云外来客',
  '灰里取火', '骨为笔墨', '燧火不熄', '谱上无名'
];
