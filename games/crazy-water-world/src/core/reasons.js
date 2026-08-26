// 失败原因：reason 是稳定 ASCII 码（测试断言这个），message 是中文人话（UI 展示，可随文案改）。
export const REASON = {
  OK: "",
  UNKNOWN_TYPE: "E_UNKNOWN_TYPE",
  LOCKED: "E_LOCKED",
  BOUNDS: "E_BOUNDS",
  OCCUPIED: "E_OCCUPIED",
  UNIQUE: "E_UNIQUE",
  COST: "E_COST",
  NOT_FOUND: "E_NOT_FOUND",
  REQUIRES_BUILDING: "E_REQUIRES_BUILDING",
  DUPLICATE: "E_DUPLICATE",
  MAX_STAR: "E_MAX_STAR",
  MAX_LEVEL: "E_MAX_LEVEL",
  INVALID_ARG: "E_INVALID_ARG",
};

export const REASON_MESSAGE = {
  E_UNKNOWN_TYPE: "图纸上没有这玩意儿",
  E_LOCKED: "指挥等级不够，先升级再说",
  E_BOUNDS: "超出木筏范围",
  E_OCCUPIED: "这格已经有东西了",
  E_UNIQUE: "只能有一座指挥中心",
  E_COST: "材料不够，去海上捞点",
  E_NOT_FOUND: "找不到这个目标",
  E_REQUIRES_BUILDING: "缺少前置建筑",
  E_DUPLICATE: "这位已经在船上了",
  E_MAX_STAR: "已经满星了",
  E_MAX_LEVEL: "已经满级了",
  E_INVALID_ARG: "参数不合法",
};

export function allow(extra = {}) {
  return { ok: true, reason: REASON.OK, ...extra };
}

export function deny(code, extra = {}) {
  return { ok: false, reason: code, message: REASON_MESSAGE[code] || "现在做不了", ...extra };
}
