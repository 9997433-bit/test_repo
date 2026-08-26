export const INTRO = {
  title: "命运刮刮乐",
  lines: [
    "事业跌进谷底的那晚，你买下一张被雨打湿的刮刮乐。",
    "金属粉屑落下，露出一行字：整座时尚百货城，归你。",
    "冷清的快餐店灯还亮着。从这里开始，把整座城盘活。",
  ],
};

export const HUD = {
  gold: "营收",
  xp: "阅历",
  charm: "魅力",
  offline: "离线收益",
};

export const EVENTS = [
  { id: "lost", title: "失物招领", body: "一位客人把丝巾落在试衣间。帮她找回？", yes: "送还", no: "先收着", reward: { gold: 80, xp: 4, charm: 1 } },
  { id: "thief", title: "抓小偷", body: "潮玩区有人把隐藏款往包里塞。", yes: "拦截", no: "让保安去", reward: { gold: 140, xp: 6, charm: 0 } },
  { id: "ask", title: "顾客求助", body: "小女孩想给妈妈挑一条围巾，拿不定主意。", yes: "帮她搭配", no: "让她慢慢看", reward: { gold: 60, xp: 8, charm: 2 } },
];

export const FASHION_CLIENTS = [
  { need: "通勤利落", tags: ["西装", "中性", "利落"], hint: "她明早要见投资人。" },
  { need: "约会甜酷", tags: ["甜酷", "短裙", "闪"], hint: "第一次夜游江边。" },
  { need: "红毯高定", tags: ["礼服", "香槟", "高定"], hint: "镜头会先找到裙摆。" },
];
