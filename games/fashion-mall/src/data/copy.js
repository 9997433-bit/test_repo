/**
 * 玩家可见文案的唯一集散地（ARCHITECTURE §2.2：新增文案必须进本文件）。
 *
 * 规则：
 * 1. 纯数据 + 纯字符串模板函数；零 import、零 DOM、零数学（MODULE_CONTRACT §1）。
 *    金额/时长等数值一律由调用方 formatGold / toFixed 后以字符串传入。
 * 2. 口吻三原则（docs/UX_NARRATIVE.md §1）：短句收尾、动词开头、不卖惨。
 * 3. 每个导出块标注「接线状态」。已接线的块改文案立即生效；
 *    待接线的块是给组合根/视图的预留位，键位设计见 UX_NARRATIVE §7。
 * 4. 事件奖励数值暂随基线内联（60–140 金区间）；F3 导出 EVENT_REWARDS
 *    表后应改为查表（见 UX_NARRATIVE §7 接线清单）。
 */

/* ------------------------------------------------------------------ *
 * 开场三幕 —— 已接线：ui/intro.js
 * ------------------------------------------------------------------ */
export const INTRO = {
  title: "命运刮刮乐",
  lines: [
    "失业第 37 天。你把口袋里最后十块钱，换成一张被雨打湿的刮刮乐。",
    "涂层簌簌落下，只有一行字：时尚百货城，整座，归你。",
    "没有道贺，没有剪彩。只有一串钥匙，和一座等你点亮的城。",
  ],
  scratchHint: "指甲抵住涂层，刮。",
  scratchCta: "刮开",
  prizeTitle: "中奖了",
  nameLabel: "签收人",
  namePlaceholder: "写下你的名字",
  defaultName: "林小姐",
  acceptCta: "签字，收下这座城",
  dressTitle: "上任第一件事",
  dressLead: "翻身，从穿对衣服开始。",
  looks: ["玫瑰通勤", "香槟女强人"],
  goCta: "推开快餐店的门",
  step: (n, total) => `第 ${n} / ${total} 幕`,
};

/* ------------------------------------------------------------------ *
 * HUD 标签 —— 待接线：app.js#paintHud 目前硬编码 emoji+文本
 * ------------------------------------------------------------------ */
export const HUD = {
  gold: "营收",
  rate: "客流",
  xp: "阅历",
  charm: "魅力",
  level: "等级",
  offline: "离线入账",
  perSec: "/秒",
};

/* ------------------------------------------------------------------ *
 * 店铺文案 —— 待接线：卡片副文案/玩法提示/胜负反馈散落在各视图。
 * 键与 balance.js#SHOPS 的 id 一一对应；数值不进本表。
 * ------------------------------------------------------------------ */
export const SHOPS_COPY = {
  fastfood: {
    tagline: "热油与番茄酱，煎出第一桶金",
    howto: "照订单出餐。手稳，小费才稳。",
    win: "出餐利落，小费到手",
    fail: "不是这份。深呼吸，重来。",
  },
  fresh: {
    tagline: "接住当季，货架自己会唱歌",
    howto: "左右移筐接货。漏一件，亏一件。",
    win: "满筐上架，口碑飘香",
    fail: "摔了一地。下一筐补回来。",
  },
  boutique: {
    tagline: "把她脑中的灵感，缝成一件衣服",
    howto: "听清需求，勾对风格，一次改到点上。",
    win: "完美改造。她转身时，全店都在看。",
    fail: "差点意思。灵感这东西，多听一句就有。",
  },
  blindbox: {
    tagline: "隐藏款一出，整层楼开始排队",
    howto: "拆盒看手气，碎片攒人脉。",
    win: "手气正旺",
    fail: "普通款也能摆满一面墙。",
  },
  fortune: {
    tagline: "星盘不剧透结局，只抬客单价",
    howto: "转一次星盘，吉兆换碎片。",
    win: "星象站在你这边",
    fail: "今天宜修身，明天宜翻盘。",
  },
};

/** 锁定店铺的点击提示；levelText 由调用方传入。 */
export const SHOP_LOCKED_HINT = (levelText, shopName) =>
  `升到 ${levelText} 级，把「${shopName}」也盘下来`;

/* ------------------------------------------------------------------ *
 * 突发事件 —— 已接线：events/randomEvents.js 按表随机抽取。
 * 形状冻结为 { id, title, body, yes, no, reward }；
 * resolve / decline 是给事件微交互升级预留的收尾文案（待接线，
 * 当前 renderEventModal 的完成 toast 仍为硬编码）。
 * ------------------------------------------------------------------ */
export const EVENTS = [
  {
    id: "lost",
    title: "失物招领",
    body: "试衣间捡到一条真丝丝巾。客人刚走，还追得上。",
    yes: "追出去还她",
    no: "先收进柜台",
    reward: { gold: 80, xp: 4, charm: 1 },
    resolve: "她回头看了三次招牌。明天，她会带朋友来。",
    decline: "丝巾进了失物柜。缘分，改天再续。",
  },
  {
    id: "thief",
    title: "抓小偷",
    body: "潮玩区，有人把隐藏款塞进了外套内袋。",
    yes: "当场拦下",
    no: "交给保安",
    reward: { gold: 140, xp: 6, charm: 0 },
    resolve: "全场安静三秒，然后是掌声。这是你的城。",
    decline: "保安处理了。下次，亲自来。",
  },
  {
    id: "ask",
    title: "顾客求助",
    body: "小女孩想给妈妈挑条围巾，攥着零花钱，不敢开口。",
    yes: "蹲下来帮她挑",
    no: "让她慢慢看",
    reward: { gold: 60, xp: 8, charm: 2 },
    resolve: "她踮起脚说：姐姐，你真好看。",
    decline: "她最后挑了最便宜的那条。也很好看。",
  },
  {
    id: "reporter",
    title: "探店镜头",
    body: "本地穿搭博主举着相机进门：老板娘，出个镜？",
    yes: "补个口红，上镜",
    no: "婉拒，先忙",
    reward: { gold: 100, xp: 6, charm: 2 },
    resolve: "视频半夜破万赞。评论区都在问地址。",
    decline: "镜头拍了橱窗。橱窗替你说话。",
  },
  {
    id: "rival",
    title: "同行踩点",
    body: "对面商场的经理，第三次「路过」你的收银台。",
    yes: "请他喝杯咖啡",
    no: "当作没看见",
    reward: { gold: 90, xp: 7, charm: 1 },
    resolve: "他临走只说两个字：佩服。你笑而不语。",
    decline: "他抄走了价签，抄不走人气。",
  },
  {
    id: "blackout",
    title: "晚高峰跳闸",
    body: "整层楼突然黑了。人群里有孩子开始哭。",
    yes: "举起手电，稳住全场",
    no: "等物业来修",
    reward: { gold: 120, xp: 8, charm: 1 },
    resolve: "灯亮那刻，掌声比灯光先到。",
    decline: "十分钟后来电。少赚的，是人心。",
  },
];

/* ------------------------------------------------------------------ *
 * 服装店客人 —— 已接线：minigames/boutique.js 随机抽取。
 * tags 必须能与视图内风格 chip / 成衣 LOOKS 命中（可通关性有脚本验证）。
 * ------------------------------------------------------------------ */
export const FASHION_CLIENTS = [
  { need: "通勤利落", tags: ["西装", "中性", "利落"], hint: "明早九点，她坐进投资人对面。" },
  { need: "约会甜酷", tags: ["甜酷", "短裙", "闪"], hint: "第一次夜游江边。风大，气场不能输。" },
  { need: "红毯高定", tags: ["礼服", "香槟", "高定"], hint: "镜头会先找裙摆，再找脸。" },
  { need: "周末松弛", tags: ["森系", "针织", "温柔"], hint: "她想穿得像一封没写完的情书。" },
];

/* ------------------------------------------------------------------ *
 * 离线回执 —— 待接线：core/state.js#hydrate 与 app.js#applySettle
 * 目前用硬编码 toast。目标形态是回执面板（RUBRIC A7），键位如下。
 * ------------------------------------------------------------------ */
export const OFFLINE = {
  title: "离店报告",
  /** 主行；hoursText/goldText 已格式化。 */
  summary: (hoursText, goldText) => `你离开 ${hoursText} 小时，店员们替你守住 ${goldText}。`,
  /** 倍率说明；percentText 如 "65%"。 */
  rateNote: (percentText) => `离线按 ${percentText} 客流结算，回店即恢复满速。`,
  /** 触发 8 小时封顶时追加。 */
  cappedNote: (capHoursText) => `超过 ${capHoursText} 小时按封顶入账——这座城，需要你回来。`,
  sourcesLabel: "入账来源",
  cta: "收下，开工",
  /** 离开极短（分钟级）时的轻量 toast 变体。 */
  short: "刚转身就想你。账，已入袋。",
};

/* ------------------------------------------------------------------ *
 * 限时目标 —— 待接线：core/state.js#advanceGoal 与 mall/mallView.js#goalLine
 * 目前用硬编码字符串。续期规则见 UX_NARRATIVE §6。
 * ------------------------------------------------------------------ */
export const GOALS = {
  label: "限时冲刺",
  /** 商场页目标行；所有数值已格式化。 */
  line: ({ tier, targetText, leftText, timeText, rewardText }) =>
    `第 ${tier} 档 · 冲 ${targetText}（还差 ${leftText}）· 剩 ${timeText} · 赏 ${rewardText}`,
  /** 达标即时反馈。 */
  done: (rewardGoldText, xp) => `达标。赏金 ${rewardGoldText}，阅历 +${xp}。下一档，加码。`,
  /** 升档续期播报。 */
  renewUp: (tier) => `第 ${tier} 档已挂牌。更大的数字，配得上现在的你。`,
  /** 超时降档：先说事实，再给台阶，最后给下一步。 */
  miss: "这一档没赶上。降档重开——数字会等你，时间不会。",
  renewDown: (tier) => `回到第 ${tier} 档。站稳，再冲。`,
};

/* ------------------------------------------------------------------ *
 * 失败反馈 —— 待接线：键 = core/actions.js 返回的 reason 码。
 * 视图未来可用 FAIL[res.reason] ?? res.toast 优先取本表。
 * 三段式规范（说事实 → 保尊严 → 给下一步）见 UX_NARRATIVE §4。
 * ------------------------------------------------------------------ */
export const FAIL = {
  "insufficient-gold": "现金不够。回商场做两单，马上回来。",
  "insufficient-shards": "碎片还差几片。盲盒和星盘里都藏着。",
  "slots-full": "工位满了。人手齐，是好事。",
  locked: "这家店还在等你升级。",
  owned: "已经是你的了。",
  "not-owned": "先签约，再谈培养。",
  "empty-name": "总得留个名字，让这座城记住你。",
  "invalid-save": "这份存档读不懂。原文没动，检查后再试。",
  "bad-cost": "价格异常，先不出手。",
};

/* ------------------------------------------------------------------ *
 * 系统文案 —— 待接线：app.js#renderMore 与 actions.js 目前各自硬编码。
 * ------------------------------------------------------------------ */
export const SYSTEM = {
  exportDone: "存档已导出到文本框",
  importDone: "存档已导入，欢迎回城",
  muteOn: "已静音",
  muteOff: "音效已恢复",
  /** timeText 为格式化后的备份时间。 */
  corruptKept: (timeText) => `发现一份读不懂的旧档（${timeText}），已备份保留，未删除。`,
  wipeConfirm: "清空存档？这座城会忘了你。",
};
