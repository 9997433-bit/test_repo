// 手感（juice）里唯一进主循环的那一条：命中定格（hit-stop）。
//
// 规矩：
// 1. 只在**本人**参与的扇击命中上定格 —— 别人在远处互扇不该冻住我的镜头。
// 2. 极短：单次 ≤ 90ms，且两次定格之间留冷却，连段不会把画面剁成幻灯片。
// 3. 只停时间，不加画面层。受击去饱和已在 HUD（.yz-hit-flash），
//    不再叠满屏红晕，也不因为连击而反复重触发。

/** 定格时长表（秒）。数值取「能感觉到、但不影响回身」的下限。 */
export const HIT_STOP = {
  dealt: 0.05,
  taken: 0.045,
  heavyBonus: 0.02,
  heavyPower: 16,
  max: 0.09,
  cooldown: 0.14,
};

/** 定格只认扇击类命中：技能/延迟结算自带表现，不再叠时间停顿。 */
const SLAP_SOURCES = new Set(["slap", "offhand", "awaken", undefined, null, ""]);

/**
 * 一条命中事件该定格多久（秒）。与本人无关、或不是扇击命中，返回 0。
 * @param {object} event   已归一化的 view 事件（core/view.js normalizeEvent）
 * @param {string} selfId  本人 id
 */
export function hitStopFor(event, selfId) {
  if (!event || event.type !== "hit" || !selfId) return 0;
  if (!SLAP_SOURCES.has(event.source)) return 0;

  const dealt = event.playerId === selfId;
  const taken = event.targetId === selfId;
  if (!dealt && !taken) return 0;
  // 自己扇到自己不存在，真出现也只算一次。
  let seconds = dealt ? HIT_STOP.dealt : HIT_STOP.taken;
  if (Number.isFinite(event.power) && event.power >= HIT_STOP.heavyPower) {
    seconds += HIT_STOP.heavyBonus;
  }
  return Math.min(HIT_STOP.max, seconds);
}

/**
 * 一批事件合并成一次定格（同帧多段只取最长的一次）。
 * @returns {number} 秒
 */
export function hitStopForEvents(events, selfId) {
  let longest = 0;
  for (const e of events || []) {
    const seconds = hitStopFor(e, selfId);
    if (seconds > longest) longest = seconds;
  }
  return longest;
}

/**
 * 定格闸门：把「请求定格」翻译成一个截止时刻，并按冷却节流。
 * 时间基由调用方给（主循环用 performance.now()/1000），本身不读时钟，方便测。
 */
export function createHitStop(opts = {}) {
  const max = opts.max ?? HIT_STOP.max;
  const cooldown = opts.cooldown ?? HIT_STOP.cooldown;

  let until = 0;
  let lastAt = -Infinity;

  return {
    /**
     * @param {number} seconds 想定格多久
     * @param {number} now     当前时刻（秒）
     * @returns {boolean} 是否真的定格了（被冷却挡下时为 false）
     */
    request(seconds, now) {
      if (!(seconds > 0) || !Number.isFinite(now)) return false;
      if (now - lastAt < cooldown) return false;
      lastAt = now;
      until = now + Math.min(max, seconds);
      return true;
    },
    /** 剩余定格时长（秒），未定格为 0。 */
    remaining(now) {
      return Math.max(0, until - now);
    },
    held(now) {
      return until > now;
    },
    reset() {
      until = 0;
      lastAt = -Infinity;
    },
  };
}
