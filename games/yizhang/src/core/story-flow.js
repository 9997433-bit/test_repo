// 掌语分派。数据表在 src/data/story.js（F1 只登记「哪一拍、说什么」），
// 「什么时候放、放过没有、从哪条通道上屏」归这里。
//
// 三条硬规矩：
//   1. 不阻塞。放掌语不开门、不拦按钮、不等回调 —— skipHub 直通裂岛与结算板的
//      「再来一局」都不该被一段旁白卡住，所以这里只排队上屏，从不回压调用方。
//   2. 只放一次。`once` 的拍子放过就记进存档 `story.seen[]`；**发起那一刻**就记，
//      不等三句念完 —— 中途刷新页面不该把同一拍再听一遍。
//   3. 通道降级要响。F2 把 `showLore` 开出来就走它（字条排队、可读性好），没有
//      就退到 HUD 中央短讯（低干扰通道，一句一条）。降级是明的：`channel` 报得出来。
//
// 本模块不碰 DOM、不 import ui、不读 localStorage —— 存档的读写由调用方注入
// （main.js 用 core/storage.js 的 updateSave 落 `story.seen`）。

/** 触发时机词。与 src/data/story.js 的 `trigger` 一一对应，拼错就静默不放。 */
export const STORY_TRIGGER = Object.freeze({
  HUB_FIRST_ENTER: "hub_first_enter",
  GLOVE_FIRST_PICKUP: "glove_first_pickup",
  PORTAL_FIRST_CROSS: "portal_first_cross",
  FIRST_KILL_OR_FALL: "first_kill_or_fall",
  MATCH_FIRST_WIN: "match_first_win",
});

/** 说话的只有一只掌（src/data/story.js 文件头）。 */
export const STORY_SPEAKER = "木棉";

/** 一句掌语在中央短讯上停多久（兜底通道；F2 的 showLore 自己定节奏）。 */
export const STORY_LINE_MS = 2400;
/** 两句之间的呼吸。太挤就糊成一片，太松就拖到下一场。 */
export const STORY_GAP_MS = 220;

/** 存档里放过的拍子 id。老档 / 坏档一律当「一拍没放过」，不清档。 */
export function seenIdsOf(save) {
  const list = save && save.story ? save.story.seen : null;
  if (!Array.isArray(list)) return [];
  return list.filter((id) => typeof id === "string" && id);
}

/** 落盘补丁：已经放过就回 null（调用方据此跳过一次写盘）。 */
export function markSeenPatch(save, id) {
  if (typeof id !== "string" || !id) return null;
  const seen = seenIdsOf(save);
  if (seen.includes(id)) return null;
  return { story: { ...(save && save.story), seen: [...seen, id] } };
}

/**
 * 这一时机该放哪一拍。`once` 的拍子放过就跳过；`once !== true` 的每次都给。
 * @param {Array} story 数据表（src/data/story.js 的 STORY）
 * @param {string} trigger 时机词
 * @param {string[]} seen 已放过的 id
 */
export function pickBeat(story, trigger, seen = []) {
  if (!Array.isArray(story) || !trigger) return null;
  const played = new Set(seen);
  for (const beat of story) {
    if (!beat || beat.trigger !== trigger) continue;
    if (beat.once === true && played.has(beat.id)) continue;
    if (!Array.isArray(beat.lines) || !beat.lines.length) continue;
    return beat;
  }
  return null;
}

function isSelfEvent(e, selfId) {
  return e.playerId === selfId || e.id === selfId;
}

/**
 * 归一化事件 → 掌语时机词。壳层的事件分派拿它当映射表，别在 switch 里散着写。
 *
 * 只认**本人**参与的那几件事；Bot 在走道另一头换掌、在岛那边互扇，不该惊动木棉。
 * 「初来」这一拍走的是 `enterHub` 事件；开局直接落在走道的那一次没有事件，
 * 由 main.js 的 startMatch 单独发一次（skipHub 直通裂岛则一句不放）。
 *
 * @param {object} e 归一化事件
 * @param {string} selfId 本地玩家 id
 * @returns {string|null} STORY_TRIGGER 里的时机词，没有就 null
 */
export function storyTriggerForEvent(e, selfId) {
  if (!e || typeof e.type !== "string") return null;
  switch (e.type) {
    case "hubEquip":
      // 「按了 E 但什么也没换」不算拾掌
      if (e.changed === false) return null;
      return isSelfEvent(e, selfId) ? STORY_TRIGGER.GLOVE_FIRST_PICKUP : null;
    case "enterArena":
      return isSelfEvent(e, selfId) ? STORY_TRIGGER.PORTAL_FIRST_CROSS : null;
    case "enterHub":
      return isSelfEvent(e, selfId) ? STORY_TRIGGER.HUB_FIRST_ENTER : null;
    case "ko":
      // 首杀与首坠共用一拍，先到先得
      return e.killerId === selfId || e.victimId === selfId
        ? STORY_TRIGGER.FIRST_KILL_OR_FALL
        : null;
    default:
      return null;
  }
}

/** 一拍摊平成一行 —— 结算板那种只有一行位置的地方用（payload.storyText）。 */
export function storyTextOf(beat) {
  if (!beat || !Array.isArray(beat.lines)) return "";
  return beat.lines.filter((line) => typeof line === "string" && line).join("　");
}

/**
 * 掌语分派器。
 *
 * @param {object} opts
 * @param {Array}    opts.story     数据表；缺表整只 no-op（不报错、不挡流程）
 * @param {Function} opts.getSeen   () => string[]，读存档里放过的 id
 * @param {Function} opts.markSeen  (id) => void，落盘（同步即可，不看返回值）
 * @param {Function} [opts.showLore] F2 的掌语通道 (beat) => any；抛错或返回 false 就降级
 * @param {Function} [opts.toast]   兜底通道 (text, ms) => void
 * @param {number}   [opts.lineMs]  一句停留时长
 * @param {number}   [opts.gapMs]   两句之间的间隔
 * @param {Function} [opts.setTimer]/[opts.clearTimer] 计时器注入口（单测用假表）
 */
export function createStoryDirector(opts = {}) {
  const story = Array.isArray(opts.story) ? opts.story : [];
  const getSeen = typeof opts.getSeen === "function" ? opts.getSeen : () => [];
  const markSeen = typeof opts.markSeen === "function" ? opts.markSeen : () => {};
  const showLore = typeof opts.showLore === "function" ? opts.showLore : null;
  const toast = typeof opts.toast === "function" ? opts.toast : null;
  const lineMs = Number.isFinite(opts.lineMs) ? opts.lineMs : STORY_LINE_MS;
  const gapMs = Number.isFinite(opts.gapMs) ? opts.gapMs : STORY_GAP_MS;
  const setTimer = typeof opts.setTimer === "function" ? opts.setTimer : (fn, ms) => setTimeout(fn, ms);
  const clearTimer = typeof opts.clearTimer === "function" ? opts.clearTimer : (t) => clearTimeout(t);

  /** @type {string[]} */
  let queue = [];
  let timer = null;

  function pump() {
    timer = null;
    const line = queue.shift();
    if (line === undefined) return;
    try {
      toast(line, lineMs);
    } catch (err) {
      console.warn("[yizhang] 掌语上屏失败", err);
      queue = [];
      return;
    }
    if (queue.length) timer = setTimer(pump, lineMs + gapMs);
  }

  function enqueue(lines) {
    if (!toast) return false;
    const fresh = lines.filter((line) => typeof line === "string" && line);
    if (!fresh.length) return false;
    queue.push(...fresh);
    if (timer === null) pump();
    return true;
  }

  /** 记名 + 出表。放不放得出去是下一步的事，记名这一步不能漏。 */
  function claim(trigger) {
    const beat = pickBeat(story, trigger, getSeen());
    if (!beat) return null;
    if (beat.once === true) {
      try {
        markSeen(beat.id);
      } catch (err) {
        // 存档写不进去（隐私模式 / 配额满）不该把这一拍也吞掉：照放，下次再放一遍
        console.warn("[yizhang] 掌语存档写入失败", err);
      }
    }
    return beat;
  }

  /** 把一拍摆上屏。F2 的通道优先，抛错或明确回绝就退到中央短讯。 */
  function present(beat) {
    if (!beat) return null;
    if (showLore) {
      try {
        if (showLore({ id: beat.id, speaker: STORY_SPEAKER, lines: beat.lines.slice() }) !== false) {
          return "lore";
        }
      } catch (err) {
        console.warn("[yizhang] showLore 抛错，退回中央短讯", err);
      }
    }
    return enqueue(beat.lines) ? "toast" : null;
  }

  return {
    /** 这一时机放一拍（放过就静默跳过）。返回放出去的那一拍，没放回 null。 */
    fire(trigger) {
      const beat = claim(trigger);
      if (!beat) return null;
      present(beat);
      return beat;
    },
    /**
     * 领一拍但**不上屏** —— 结算板这种自己有位置贴的地方用（payload.storyText）。
     * 记名照记：领过就不会再从别的通道放第二遍。
     */
    take(trigger) {
      return claim(trigger);
    },
    /** 换局 / 退菜单：把还没念完的句子丢掉，不许漏到下一场。 */
    reset() {
      if (timer !== null) clearTimer(timer);
      timer = null;
      queue = [];
    },
    /** 当前走的哪条通道（降级看得见，不静默）。 */
    get channel() {
      if (showLore) return "lore";
      return toast ? "toast" : "none";
    },
    /** 排队待放的句子（单测/手测用）。 */
    get pending() {
      return queue.slice();
    },
  };
}
