/**
 * 无障碍文案（aria-label / 读屏播报 / 键盘提示）的唯一来源。
 *
 * 与 copy.js 的分工：copy.js 管「看得见的」文案，本文件管「读得出的」文案。
 * 纯数据 + 纯字符串模板函数，零 import（MODULE_CONTRACT §1 data 层规则）。
 * 使用规范与焦点/键盘设计见 docs/UX_NARRATIVE.md §5。
 *
 * 接线状态：intro 块已接线（ui/intro.js）；其余块为 app.js 与各视图挂
 * ARIA 属性时的预留位（RUBRIC D1–D3），键位勿改名。
 */
export const A11Y = {
  /** 根容器 aria-label。 */
  app: "时尚百货城，放置经营游戏",
  /** toast 容器（role=status）的 aria-label。 */
  toastRegion: "游戏通知",

  /** HUD 四枚 pill 的读屏播报；数值由调用方格式化后传入。 */
  hud: {
    region: "资源面板",
    gold: (v) => `营收 ${v}`,
    rate: (v) => `每秒收入 ${v}`,
    charm: (v) => `魅力 ${v}`,
    level: (v) => `主角等级 ${v}`,
  },

  /** 底部导航（nav 元素 + 各页签）的说明。 */
  nav: {
    region: "主导航",
    mall: "商场：查看与升级店铺",
    look: "换装：调整穿搭，提升魅力",
    home: "豪宅：购置家具，提高离线收益",
    team: "伙伴：签约、培训与派驻",
    more: "更多：研发与存档管理",
  },

  /** 突发事件弹窗（role=dialog aria-modal=true）。 */
  dialog: {
    label: "突发事件",
    escHint: "按 Esc 键关闭",
  },

  /** 开场三幕 —— 已接线：ui/intro.js。 */
  intro: {
    nameField: "主角名字，最多十二个字",
    lookGroup: "开局穿搭，两套可选",
    stepOf: (n, total) => `开场第 ${n} 幕，共 ${total} 幕`,
  },

  /** 小游戏键盘等效操作提示（RUBRIC D1：拔掉鼠标也能通关）。 */
  minigames: {
    fresh: "键盘玩法：左右方向键移动菜筐，接住掉落的货品",
    fastfood: "按订单顺序选择餐品：Tab 键切换，回车出餐",
    boutique: "Tab 键在风格与成衣之间切换，回车勾选",
    fortune: "回车启动星盘",
    blindbox: "回车拆盒",
  },

  /** 限时目标行与离线回执的读屏前缀。 */
  goal: (text) => `限时目标：${text}`,
  offline: (text) => `离线结算：${text}`,
};
