/**
 * Hero pool. tweak = 个体偏科（atk/def/lead 乘数），skill = 战斗中概率触发的必杀。
 * quality: blue 良将 / purple 名将 / orange 传世 / red 绝世。
 */

export const HERO_POOL = [
  // ———— 魏 ————
  { id: "caocao", name: "曹操", faction: "wei", quality: "red", troop: "cavalry", tweak: { atk: 1.05, def: 1.05, lead: 1.1 }, skill: { name: "挟天子令", mult: 2.0 } },
  { id: "simayi", name: "司马懿", faction: "wei", quality: "red", troop: "archer", tweak: { atk: 1.1, def: 1.0, lead: 1.0 }, skill: { name: "鹰视狼顾", mult: 2.2 } },
  { id: "zhangliao", name: "张辽", faction: "wei", quality: "orange", troop: "cavalry", tweak: { atk: 1.15, def: 0.95, lead: 1.0 }, skill: { name: "威震逍遥津", mult: 2.1 } },
  { id: "xiahoudun", name: "夏侯惇", faction: "wei", quality: "orange", troop: "infantry", tweak: { atk: 1.0, def: 1.15, lead: 1.0 }, skill: { name: "拔矢啖睛", mult: 1.9 } },
  { id: "xuchu", name: "许褚", faction: "wei", quality: "orange", troop: "infantry", tweak: { atk: 1.1, def: 1.1, lead: 0.9 }, skill: { name: "裸衣恶战", mult: 2.0 } },
  { id: "guojia", name: "郭嘉", faction: "wei", quality: "orange", troop: "archer", tweak: { atk: 1.2, def: 0.85, lead: 0.95 }, skill: { name: "十胜十败", mult: 2.1 } },
  { id: "xuhuang", name: "徐晃", faction: "wei", quality: "purple", troop: "infantry", tweak: { atk: 1.05, def: 1.0, lead: 1.0 }, skill: { name: "长驱直入", mult: 1.8 } },
  { id: "caoren", name: "曹仁", faction: "wei", quality: "purple", troop: "infantry", tweak: { atk: 0.95, def: 1.2, lead: 1.0 }, skill: { name: "铁壁固守", mult: 1.7 } },
  { id: "lejin", name: "乐进", faction: "wei", quality: "purple", troop: "infantry", tweak: { atk: 1.1, def: 0.95, lead: 0.95 }, skill: { name: "先登陷阵", mult: 1.8 } },
  { id: "yujin", name: "于禁", faction: "wei", quality: "blue", troop: "infantry", tweak: { atk: 1.0, def: 1.05, lead: 1.0 }, skill: { name: "严整军令", mult: 1.6 } },
  { id: "lidian", name: "李典", faction: "wei", quality: "blue", troop: "archer", tweak: { atk: 1.0, def: 1.0, lead: 1.0 }, skill: { name: "深明大义", mult: 1.6 } },
  { id: "mancong", name: "满宠", faction: "wei", quality: "blue", troop: "archer", tweak: { atk: 0.95, def: 1.1, lead: 1.0 }, skill: { name: "火计守城", mult: 1.65 } },

  // ———— 蜀 ————
  { id: "liubei", name: "刘备", faction: "shu", quality: "red", troop: "infantry", tweak: { atk: 0.95, def: 1.1, lead: 1.2 }, skill: { name: "仁德昭烈", mult: 1.9 } },
  { id: "zhugeliang", name: "诸葛亮", faction: "shu", quality: "red", troop: "archer", tweak: { atk: 1.15, def: 0.95, lead: 1.05 }, skill: { name: "锦囊妙计", mult: 2.2 } },
  { id: "guanyu", name: "关羽", faction: "shu", quality: "red", troop: "infantry", tweak: { atk: 1.2, def: 1.0, lead: 1.0 }, skill: { name: "青龙偃月", mult: 2.2 } },
  { id: "zhangfei", name: "张飞", faction: "shu", quality: "orange", troop: "infantry", tweak: { atk: 1.15, def: 1.05, lead: 0.95 }, skill: { name: "当阳怒吼", mult: 2.1 } },
  { id: "zhaoyun", name: "赵云", faction: "shu", quality: "orange", troop: "cavalry", tweak: { atk: 1.1, def: 1.1, lead: 1.0 }, skill: { name: "七进七出", mult: 2.1 } },
  { id: "machao", name: "马超", faction: "shu", quality: "orange", troop: "cavalry", tweak: { atk: 1.2, def: 0.9, lead: 1.0 }, skill: { name: "西凉锦袍", mult: 2.0 } },
  { id: "huangzhong", name: "黄忠", faction: "shu", quality: "orange", troop: "archer", tweak: { atk: 1.2, def: 0.9, lead: 0.95 }, skill: { name: "百步穿杨", mult: 2.1 } },
  { id: "weiyan", name: "魏延", faction: "shu", quality: "purple", troop: "infantry", tweak: { atk: 1.1, def: 1.0, lead: 0.95 }, skill: { name: "子午奇谋", mult: 1.85 } },
  { id: "jiangwei", name: "姜维", faction: "shu", quality: "purple", troop: "archer", tweak: { atk: 1.05, def: 1.0, lead: 1.0 }, skill: { name: "九伐中原", mult: 1.8 } },
  { id: "pangtong", name: "庞统", faction: "shu", quality: "purple", troop: "archer", tweak: { atk: 1.15, def: 0.85, lead: 0.95 }, skill: { name: "连环妙策", mult: 1.9 } },
  { id: "guanping", name: "关平", faction: "shu", quality: "blue", troop: "infantry", tweak: { atk: 1.0, def: 1.05, lead: 1.0 }, skill: { name: "虎父之风", mult: 1.6 } },
  { id: "liaohua", name: "廖化", faction: "shu", quality: "blue", troop: "infantry", tweak: { atk: 1.0, def: 1.0, lead: 1.0 }, skill: { name: "先锋老将", mult: 1.6 } },
  { id: "madai", name: "马岱", faction: "shu", quality: "blue", troop: "cavalry", tweak: { atk: 1.05, def: 0.95, lead: 1.0 }, skill: { name: "阵斩虚影", mult: 1.65 } },

  // ———— 吴 ————
  { id: "sunquan", name: "孙权", faction: "wu", quality: "red", troop: "archer", tweak: { atk: 1.0, def: 1.1, lead: 1.15 }, skill: { name: "坐断东南", mult: 1.9 } },
  { id: "zhouyu", name: "周瑜", faction: "wu", quality: "red", troop: "archer", tweak: { atk: 1.2, def: 0.9, lead: 1.0 }, skill: { name: "赤壁纵火", mult: 2.3 } },
  { id: "luxun", name: "陆逊", faction: "wu", quality: "orange", troop: "archer", tweak: { atk: 1.15, def: 0.95, lead: 1.0 }, skill: { name: "火烧连营", mult: 2.2 } },
  { id: "taishici", name: "太史慈", faction: "wu", quality: "orange", troop: "archer", tweak: { atk: 1.15, def: 1.0, lead: 0.95 }, skill: { name: "神亭酣战", mult: 2.0 } },
  { id: "ganning", name: "甘宁", faction: "wu", quality: "orange", troop: "infantry", tweak: { atk: 1.2, def: 0.9, lead: 0.95 }, skill: { name: "百骑劫营", mult: 2.1 } },
  { id: "lvmeng", name: "吕蒙", faction: "wu", quality: "orange", troop: "infantry", tweak: { atk: 1.05, def: 1.1, lead: 1.0 }, skill: { name: "白衣渡江", mult: 2.0 } },
  { id: "huanggai", name: "黄盖", faction: "wu", quality: "purple", troop: "infantry", tweak: { atk: 1.05, def: 1.05, lead: 0.95 }, skill: { name: "苦肉献计", mult: 1.85 } },
  { id: "chengpu", name: "程普", faction: "wu", quality: "purple", troop: "cavalry", tweak: { atk: 1.0, def: 1.05, lead: 1.0 }, skill: { name: "三朝宿将", mult: 1.8 } },
  { id: "handang", name: "韩当", faction: "wu", quality: "blue", troop: "cavalry", tweak: { atk: 1.0, def: 1.0, lead: 1.0 }, skill: { name: "江表虎臣", mult: 1.6 } },
  { id: "dingfeng", name: "丁奉", faction: "wu", quality: "blue", troop: "infantry", tweak: { atk: 1.05, def: 1.0, lead: 0.95 }, skill: { name: "雪中奋短兵", mult: 1.7 } },
  { id: "xusheng", name: "徐盛", faction: "wu", quality: "blue", troop: "archer", tweak: { atk: 1.0, def: 1.05, lead: 1.0 }, skill: { name: "疑城之计", mult: 1.6 } },

  // ———— 群 ————
  { id: "lvbu", name: "吕布", faction: "qun", quality: "red", troop: "cavalry", tweak: { atk: 1.3, def: 0.95, lead: 0.95 }, skill: { name: "无双方天戟", mult: 2.4 } },
  { id: "dongzhuo", name: "董卓", faction: "qun", quality: "orange", troop: "infantry", tweak: { atk: 1.0, def: 1.2, lead: 1.05 }, skill: { name: "焚都乱政", mult: 1.9 } },
  { id: "yuanshao", name: "袁绍", faction: "qun", quality: "orange", troop: "archer", tweak: { atk: 1.0, def: 1.05, lead: 1.15 }, skill: { name: "四世三公", mult: 1.9 } },
  { id: "zhangjiao", name: "张角", faction: "qun", quality: "orange", troop: "archer", tweak: { atk: 1.2, def: 0.85, lead: 1.0 }, skill: { name: "黄天当立", mult: 2.1 } },
  { id: "huaxiong", name: "华雄", faction: "qun", quality: "purple", troop: "infantry", tweak: { atk: 1.15, def: 0.95, lead: 0.95 }, skill: { name: "汜水扬威", mult: 1.85 } },
  { id: "yanliang", name: "颜良", faction: "qun", quality: "purple", troop: "cavalry", tweak: { atk: 1.15, def: 0.9, lead: 0.95 }, skill: { name: "河北枪锋", mult: 1.85 } },
  { id: "wenchou", name: "文丑", faction: "qun", quality: "purple", troop: "cavalry", tweak: { atk: 1.15, def: 0.9, lead: 0.95 }, skill: { name: "延津突袭", mult: 1.85 } },
  { id: "diaochan", name: "貂蝉", faction: "qun", quality: "purple", troop: "archer", tweak: { atk: 1.1, def: 0.9, lead: 1.0 }, skill: { name: "闭月离间", mult: 1.9 } },
  { id: "zhangyan", name: "张燕", faction: "qun", quality: "blue", troop: "cavalry", tweak: { atk: 1.0, def: 1.0, lead: 1.0 }, skill: { name: "黑山飞掠", mult: 1.65 } },
  { id: "huatuo", name: "华佗", faction: "qun", quality: "blue", troop: "archer", tweak: { atk: 0.9, def: 1.15, lead: 1.05 }, skill: { name: "青囊回春", mult: 1.6 } },
];

export const HEROES_BY_ID = Object.fromEntries(HERO_POOL.map((h) => [h.id, h]));

export function heroesOfQuality(quality) {
  return HERO_POOL.filter((h) => h.quality === quality);
}
