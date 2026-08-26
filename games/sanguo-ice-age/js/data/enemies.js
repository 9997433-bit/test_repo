/**
 * 讨伐关卡。unit: { name, faction, troop, atk, def, troops }
 * rewards 首通额外 firstClear（招贤令/将魂），复战只有资源。
 */

export const STAGES = [
  {
    id: 1,
    name: "黄巾残寇",
    desc: "苍天已死的余党在雪原上劫掠流民。",
    units: [
      { name: "黄巾力士", faction: "qun", troop: "infantry", atk: 30, def: 16, troops: 70 },
    ],
    rewards: { food: 60, wood: 60 },
    firstClear: { tokens: 1, souls: 30 },
  },
  {
    id: 2,
    name: "雪原马贼",
    desc: "马贼借着风雪打劫商队。",
    units: [
      { name: "马贼游骑", faction: "qun", troop: "cavalry", atk: 38, def: 18, troops: 85 },
    ],
    rewards: { food: 80, wood: 80, coal: 20 },
    firstClear: { tokens: 1, souls: 40 },
  },
  {
    id: 3,
    name: "白波军垒",
    desc: "白波旧部据垒自守，扼住运煤山道。",
    units: [
      { name: "白波刀盾", faction: "qun", troop: "infantry", atk: 42, def: 24, troops: 95 },
      { name: "白波弓手", faction: "qun", troop: "archer", atk: 50, def: 14, troops: 70 },
    ],
    rewards: { food: 100, wood: 100, coal: 40 },
    firstClear: { tokens: 1, souls: 60 },
  },
  {
    id: 4,
    name: "冰封坞堡",
    desc: "魏军细作盘踞的坞堡，囤着铁料。",
    units: [
      { name: "魏军戍卒", faction: "wei", troop: "infantry", atk: 52, def: 30, troops: 115 },
      { name: "魏军弩手", faction: "wei", troop: "archer", atk: 62, def: 18, troops: 90 },
    ],
    rewards: { food: 120, coal: 50, iron: 40 },
    firstClear: { tokens: 2, souls: 80 },
  },
  {
    id: 5,
    name: "乌桓游骑",
    desc: "北疆铁蹄踏雪而来，来去如风。",
    units: [
      { name: "乌桓突骑", faction: "qun", troop: "cavalry", atk: 72, def: 26, troops: 140 },
      { name: "乌桓射雕手", faction: "qun", troop: "archer", atk: 66, def: 18, troops: 95 },
    ],
    rewards: { food: 150, wood: 120, iron: 50 },
    firstClear: { tokens: 2, souls: 100 },
  },
  {
    id: 6,
    name: "魏军前哨",
    desc: "曹军前哨立营冰河北岸，窥伺城池。",
    units: [
      { name: "魏武卒", faction: "wei", troop: "infantry", atk: 82, def: 40, troops: 170 },
      { name: "魏军虎骑", faction: "wei", troop: "cavalry", atk: 88, def: 30, troops: 130 },
    ],
    rewards: { food: 180, coal: 80, iron: 70 },
    firstClear: { tokens: 2, souls: 130 },
  },
  {
    id: 7,
    name: "蜀道栈营",
    desc: "蜀军沿栈道设营，弩阵森严。",
    units: [
      { name: "蜀军藤甲", faction: "shu", troop: "infantry", atk: 92, def: 52, troops: 180 },
      { name: "蜀军连弩", faction: "shu", troop: "archer", atk: 108, def: 24, troops: 155 },
    ],
    rewards: { food: 220, wood: 180, iron: 90 },
    firstClear: { tokens: 2, souls: 160 },
  },
  {
    id: 8,
    name: "江东水寨",
    desc: "吴军战船冻在江心，水兵结寨过冬。",
    units: [
      { name: "吴军解烦兵", faction: "wu", troop: "infantry", atk: 102, def: 50, troops: 190 },
      { name: "吴军楼船弓", faction: "wu", troop: "archer", atk: 120, def: 28, troops: 170 },
    ],
    rewards: { food: 260, coal: 120, iron: 110 },
    firstClear: { tokens: 3, souls: 200 },
  },
  {
    id: 9,
    name: "西凉铁骑",
    desc: "西凉狼骑纵横雪原，锋锐无匹。",
    units: [
      { name: "西凉狼骑", faction: "qun", troop: "cavalry", atk: 132, def: 40, troops: 230 },
      { name: "羌胡射手", faction: "qun", troop: "archer", atk: 118, def: 26, troops: 180 },
    ],
    rewards: { food: 320, wood: 240, iron: 140 },
    firstClear: { tokens: 3, souls: 260 },
  },
  {
    id: 10,
    name: "虎豹骑营",
    desc: "天下骁锐，虎豹骑营。魏军精锐尽出。",
    units: [
      { name: "虎豹骑", faction: "wei", troop: "cavalry", atk: 158, def: 52, troops: 250 },
      { name: "魏军先登", faction: "wei", troop: "infantry", atk: 138, def: 66, troops: 230 },
      { name: "魏军强弩", faction: "wei", troop: "archer", atk: 150, def: 32, troops: 190 },
    ],
    rewards: { food: 400, coal: 180, iron: 180 },
    firstClear: { tokens: 3, souls: 340 },
  },
  {
    id: 11,
    name: "无当飞军",
    desc: "蜀中劲旅翻山越岭而来，箭如飞蝗。",
    units: [
      { name: "无当飞军", faction: "shu", troop: "archer", atk: 178, def: 40, troops: 270 },
      { name: "白毦精兵", faction: "shu", troop: "infantry", atk: 162, def: 74, troops: 250 },
      { name: "蜀军铁骑", faction: "shu", troop: "cavalry", atk: 170, def: 50, troops: 215 },
    ],
    rewards: { food: 480, wood: 320, iron: 220 },
    firstClear: { tokens: 4, souls: 420 },
  },
  {
    id: 12,
    name: "冰河王庭",
    desc: "冰原霸主的王帐军团——终局之战。",
    units: [
      { name: "王庭亲卫", faction: "qun", troop: "infantry", atk: 200, def: 90, troops: 310 },
      { name: "王庭铁鹞", faction: "qun", troop: "cavalry", atk: 220, def: 64, troops: 290 },
      { name: "王庭神射", faction: "qun", troop: "archer", atk: 210, def: 46, troops: 250 },
    ],
    rewards: { food: 700, wood: 500, coal: 300, iron: 300 },
    firstClear: { tokens: 6, souls: 800 },
  },
];
