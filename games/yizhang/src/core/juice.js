// 手感（juice）里唯一进主循环的那一条：命中定格（hit-stop）与受击画面反馈。
//
// 规矩：
// 1. 只在**本人**参与的扇击命中上定格 —— 别人在远处互扇不该冻住我的镜头。
// 2. 极短：单次 ≤ 120ms（验收线上限），两次定格之间留冷却，
//    最坏情况下的冻结占空比（max / cooldown）压在一半以下，连段不会剁成幻灯片。
// 3. 只停时间，不加红。受击反馈是 HUD 那层的一瞬去饱和 + 轻压暗（.yz-hit-flash），
//    强度按这一记的分量给，从来不是满屏红晕。

/**
 * 定格时长表（秒）。数值取「一掌下去手上有东西」的量，同时守住 ≤120ms。
 * 原来的 50ms 在 60fps 下只有三帧，掌掌都像扇在空气上，所以整体上调。
 *
 * `heavyPower` 是「这一掌算不算重」的门槛，与 `data/tuning.js` 的
 * `KNOCKBACK.heavyPowerThreshold` / `combat/constants.js` 的 `HIT.heavyPowerThreshold`
 * 同为 12：碎地、命中记录的 `heavy` 标记、这里的重击定格档共用一条线，
 * 不再出现「碎地算重击、定格却还在基础档」的 12..16 灰区。改它要三处一起改。
 * `max = 0.12` 是验收线上限，不随门槛动——收门槛只改「谁进重击档」，不改档位本身
 * （最重一档仍是 0.08 + 0.035 = 0.115）。
 */
export const HIT_STOP = {
  dealt: 0.08,
  taken: 0.065,
  heavyBonus: 0.035,
  heavyPower: 12,
  max: 0.12,
  cooldown: 0.22,
};

/**
 * 受击画面反馈（去饱和 + 轻压暗）的强度与时长。
 * strength 是 0..1 的系数，交给 HUD 折算成滤镜量；没有任何红色通道。
 */
export const HIT_FLASH = {
  base: 0.45,
  perPower: 0.03,
  maxStrength: 1,
  minMs: 90,
  maxMs: 190,
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
 * 一条事件该给多强的受击反馈。只认**本人挨打**（打中别人不糊自己的屏）。
 * @returns {{ strength: number, ms: number } | null}
 */
export function hitFlashFor(event, selfId) {
  if (!event || event.type !== "hit" || !selfId) return null;
  if (event.targetId !== selfId) return null;
  const power = Number.isFinite(event.power) ? Math.max(0, event.power) : 0;
  const strength = Math.min(HIT_FLASH.maxStrength, HIT_FLASH.base + power * HIT_FLASH.perPower);
  const ms = Math.round(
    HIT_FLASH.minMs + (HIT_FLASH.maxMs - HIT_FLASH.minMs) * (strength / HIT_FLASH.maxStrength)
  );
  return { strength, ms };
}

/** 一批事件合并成一次受击反馈（同帧多段只取最重的一记）。 */
export function hitFlashForEvents(events, selfId) {
  let best = null;
  for (const e of events || []) {
    const flash = hitFlashFor(e, selfId);
    if (flash && (!best || flash.strength > best.strength)) best = flash;
  }
  return best;
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
