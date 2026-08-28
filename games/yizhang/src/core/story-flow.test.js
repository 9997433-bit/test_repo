import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORY, STORY_BY_ID } from "../data/story.js";
import {
  STORY_LINE_MS,
  STORY_TRIGGER,
  createStoryDirector,
  markSeenPatch,
  pickBeat,
  seenIdsOf,
  storyTextOf,
  storyTriggerForEvent,
} from "./story-flow.js";

const ME = "p0";

/** 手动时钟：掌语的节奏靠计时器，单测不许真等 2.4 秒。 */
function fakeClock() {
  let seq = 0;
  const jobs = new Map();
  return {
    setTimer(fn) {
      const id = ++seq;
      jobs.set(id, fn);
      return id;
    },
    clearTimer(id) {
      jobs.delete(id);
    },
    get size() {
      return jobs.size;
    },
    /** 把当前排着的定时器全部跑一遍（跑出来的新定时器留到下一次）。 */
    tick() {
      const batch = [...jobs.entries()];
      jobs.clear();
      for (const [, fn] of batch) fn();
      return batch.length;
    },
  };
}

function makeDirector(over = {}) {
  const clock = fakeClock();
  const toasts = [];
  let seen = over.seen ? [...over.seen] : [];
  const director = createStoryDirector({
    story: STORY,
    getSeen: () => seen,
    markSeen: (id) => {
      if (!seen.includes(id)) seen = [...seen, id];
    },
    toast: (text, ms) => toasts.push({ text, ms }),
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    ...over,
  });
  return { director, clock, toasts, get seen() { return seen; } };
}

describe("seenIdsOf / markSeenPatch", () => {
  it("老档没有 story 字段就当一拍没放过，不清档", () => {
    expect(seenIdsOf(undefined)).toEqual([]);
    expect(seenIdsOf({})).toEqual([]);
    expect(seenIdsOf({ story: {} })).toEqual([]);
    // 坏档（写成字符串 / 混进非字符串）也不许炸
    expect(seenIdsOf({ story: { seen: "arrive" } })).toEqual([]);
    expect(seenIdsOf({ story: { seen: ["arrive", 3, null, ""] } })).toEqual(["arrive"]);
  });

  it("补丁只碰 story.seen，别的存档字段原样", () => {
    const save = { unlocked: ["cotton"], story: { seen: ["arrive"] } };
    const patch = markSeenPatch(save, "portal");
    expect(patch).toEqual({ story: { seen: ["arrive", "portal"] } });
    expect(Object.keys(patch)).toEqual(["story"]);
    expect(save.story.seen).toEqual(["arrive"]); // 原对象不许被就地改
  });

  it("放过的拍子不再出补丁（省掉一次写盘）", () => {
    expect(markSeenPatch({ story: { seen: ["arrive"] } }, "arrive")).toBe(null);
    expect(markSeenPatch({}, "")).toBe(null);
  });
});

describe("pickBeat", () => {
  it("按 trigger 取拍，放过的 once 拍子不再给", () => {
    const beat = pickBeat(STORY, STORY_TRIGGER.HUB_FIRST_ENTER, []);
    expect(beat.id).toBe("arrive");
    expect(pickBeat(STORY, STORY_TRIGGER.HUB_FIRST_ENTER, ["arrive"])).toBe(null);
  });

  it("首杀与首坠共用一拍（先到先触发）", () => {
    const beat = pickBeat(STORY, STORY_TRIGGER.FIRST_KILL_OR_FALL, []);
    expect(beat.id).toBe("first_blood");
  });

  it("认不出的时机词 / 缺表一律静默不放", () => {
    expect(pickBeat(STORY, "no_such_trigger", [])).toBe(null);
    expect(pickBeat(null, STORY_TRIGGER.HUB_FIRST_ENTER, [])).toBe(null);
    expect(pickBeat(undefined, STORY_TRIGGER.HUB_FIRST_ENTER, [])).toBe(null);
  });

  it("once !== true 的拍子每次都给", () => {
    const table = [{ id: "chatter", trigger: "t", once: false, lines: ["再说一遍"] }];
    expect(pickBeat(table, "t", ["chatter"]).id).toBe("chatter");
  });
});

describe("createStoryDirector · 兜底 toast 通道", () => {
  it("一拍一句一句上屏，不是三句糊成一条", () => {
    const { director, clock, toasts } = makeDirector();
    const beat = director.fire(STORY_TRIGGER.HUB_FIRST_ENTER);
    expect(beat.id).toBe("arrive");
    expect(toasts.map((t) => t.text)).toEqual([beat.lines[0]]);
    expect(toasts[0].ms).toBe(STORY_LINE_MS);

    clock.tick();
    clock.tick();
    expect(toasts.map((t) => t.text)).toEqual(beat.lines);
    // 最后一句放完不再排新的定时器
    expect(clock.size).toBe(0);
  });

  it("放过就记进 seen，同一时机再来一次静默跳过", () => {
    const box = makeDirector();
    box.director.fire(STORY_TRIGGER.HUB_FIRST_ENTER);
    expect(box.seen).toEqual(["arrive"]);
    const again = box.director.fire(STORY_TRIGGER.HUB_FIRST_ENTER);
    expect(again).toBe(null);
    expect(box.toasts).toHaveLength(1);
  });

  it("**发起那一刻**就记名：三句还没念完，刷新页面也不会再听一遍", () => {
    const box = makeDirector();
    box.director.fire(STORY_TRIGGER.PORTAL_FIRST_CROSS);
    expect(box.seen).toEqual(["portal"]);
    expect(box.director.pending.length).toBeGreaterThan(0);
  });

  it("reset 把没念完的句子丢掉（再来一局不许拖着旧旁白）", () => {
    const { director, clock, toasts } = makeDirector();
    director.fire(STORY_TRIGGER.MATCH_FIRST_WIN);
    expect(director.pending.length).toBeGreaterThan(0);
    director.reset();
    expect(director.pending).toEqual([]);
    expect(clock.size).toBe(0);
    clock.tick();
    expect(toasts).toHaveLength(1);
  });

  it("reset 之后还能接着放下一拍", () => {
    const { director, clock, toasts } = makeDirector();
    director.fire(STORY_TRIGGER.HUB_FIRST_ENTER);
    director.reset();
    const beat = director.fire(STORY_TRIGGER.PORTAL_FIRST_CROSS);
    expect(toasts.at(-1).text).toBe(beat.lines[0]);
    clock.tick();
    expect(toasts.at(-1).text).toBe(beat.lines[1]);
  });
});

describe("createStoryDirector · 通道选择", () => {
  it("F2 开了 showLore 就走它，一拍一次调用，不再走 toast", () => {
    const showLore = vi.fn();
    const { director, toasts } = makeDirector({ showLore });
    expect(director.channel).toBe("lore");
    const beat = director.fire(STORY_TRIGGER.GLOVE_FIRST_PICKUP);
    expect(showLore).toHaveBeenCalledTimes(1);
    expect(showLore.mock.calls[0][0]).toMatchObject({ id: beat.id, speaker: "木棉" });
    expect(showLore.mock.calls[0][0].lines).toEqual(beat.lines);
    expect(toasts).toEqual([]);
  });

  it("showLore 抛错就退回中央短讯，不把事件分派带崩", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const showLore = vi.fn(() => {
      throw new Error("boom");
    });
    const { director, toasts } = makeDirector({ showLore });
    const beat = director.fire(STORY_TRIGGER.GLOVE_FIRST_PICKUP);
    expect(beat).not.toBe(null);
    expect(toasts.map((t) => t.text)).toEqual([beat.lines[0]]);
    warn.mockRestore();
  });

  it("showLore 明确回绝（返回 false）也退回中央短讯", () => {
    const { director, toasts } = makeDirector({ showLore: () => false });
    director.fire(STORY_TRIGGER.GLOVE_FIRST_PICKUP);
    expect(toasts).toHaveLength(1);
  });

  it("两条通道都没有：记名照记，整只 no-op，不抛", () => {
    let seen = [];
    const director = createStoryDirector({
      story: STORY,
      getSeen: () => seen,
      markSeen: (id) => seen.push(id),
      toast: null,
    });
    expect(director.channel).toBe("none");
    expect(() => director.fire(STORY_TRIGGER.HUB_FIRST_ENTER)).not.toThrow();
    expect(seen).toEqual(["arrive"]);
  });
});

describe("createStoryDirector · 不许卡住流程", () => {
  it("缺表整只 no-op（fire 不抛、不放、不记）", () => {
    const director = createStoryDirector({});
    expect(director.fire(STORY_TRIGGER.HUB_FIRST_ENTER)).toBe(null);
    expect(director.take(STORY_TRIGGER.MATCH_FIRST_WIN)).toBe(null);
    expect(() => director.reset()).not.toThrow();
  });

  it("存档写不进去（隐私模式）照样放，也不抛", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { director, toasts } = makeDirector({
      markSeen: () => {
        throw new Error("localStorage 满了");
      },
    });
    expect(() => director.fire(STORY_TRIGGER.HUB_FIRST_ENTER)).not.toThrow();
    expect(toasts).toHaveLength(1);
    warn.mockRestore();
  });

  it("toast 抛错只丢掉这一拍，队列清空、不留死定时器", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const clock = fakeClock();
    const director = createStoryDirector({
      story: STORY,
      getSeen: () => [],
      markSeen: () => {},
      toast: () => {
        throw new Error("HUD 没了");
      },
      setTimer: clock.setTimer,
      clearTimer: clock.clearTimer,
    });
    expect(() => director.fire(STORY_TRIGGER.HUB_FIRST_ENTER)).not.toThrow();
    expect(director.pending).toEqual([]);
    expect(clock.size).toBe(0);
    warn.mockRestore();
  });
});

describe("take（结算板那条路）", () => {
  it("领一拍但不上屏，记名照记", () => {
    const box = makeDirector();
    const beat = box.director.take(STORY_TRIGGER.MATCH_FIRST_WIN);
    expect(beat.id).toBe("first_win");
    expect(box.toasts).toEqual([]);
    expect(box.seen).toEqual(["first_win"]);
    // 领过就不会再从中央短讯放第二遍
    expect(box.director.fire(STORY_TRIGGER.MATCH_FIRST_WIN)).toBe(null);
  });
});

describe("storyTextOf", () => {
  it("摊平成一行给结算板用", () => {
    const beat = pickBeat(STORY, STORY_TRIGGER.MATCH_FIRST_WIN, []);
    const text = storyTextOf(beat);
    for (const line of beat.lines) expect(text).toContain(line);
  });

  it("没这一拍就是空串（结算板据此整行不出现）", () => {
    expect(storyTextOf(null)).toBe("");
    expect(storyTextOf({})).toBe("");
  });
});

describe("storyTriggerForEvent · 事件分派映射表", () => {
  it("拾掌：本人在台座换到掌才算", () => {
    expect(storyTriggerForEvent({ type: "hubEquip", playerId: ME, gloveId: "cotton" }, ME)).toBe(
      STORY_TRIGGER.GLOVE_FIRST_PICKUP,
    );
    // sim 有的版本发的是 id 不是 playerId
    expect(storyTriggerForEvent({ type: "hubEquip", id: ME }, ME)).toBe(
      STORY_TRIGGER.GLOVE_FIRST_PICKUP,
    );
  });

  it("按了 E 但什么也没换（changed:false）不算拾掌", () => {
    expect(storyTriggerForEvent({ type: "hubEquip", playerId: ME, changed: false }, ME)).toBe(null);
  });

  it("过门与回走道各自一拍", () => {
    expect(storyTriggerForEvent({ type: "enterArena", playerId: ME }, ME)).toBe(
      STORY_TRIGGER.PORTAL_FIRST_CROSS,
    );
    expect(storyTriggerForEvent({ type: "enterHub", id: ME }, ME)).toBe(
      STORY_TRIGGER.HUB_FIRST_ENTER,
    );
  });

  it("首杀与首坠共用一拍：扇死人和被扇下岛都算", () => {
    expect(storyTriggerForEvent({ type: "ko", killerId: ME, victimId: "b1" }, ME)).toBe(
      STORY_TRIGGER.FIRST_KILL_OR_FALL,
    );
    expect(storyTriggerForEvent({ type: "ko", killerId: "b1", victimId: ME }, ME)).toBe(
      STORY_TRIGGER.FIRST_KILL_OR_FALL,
    );
    // 自己掉下去（没有 killer）也算
    expect(storyTriggerForEvent({ type: "ko", killerId: null, victimId: ME }, ME)).toBe(
      STORY_TRIGGER.FIRST_KILL_OR_FALL,
    );
  });

  it("Bot 在别处换掌 / 互扇不惊动木棉", () => {
    expect(storyTriggerForEvent({ type: "hubEquip", playerId: "b1" }, ME)).toBe(null);
    expect(storyTriggerForEvent({ type: "enterArena", playerId: "b1" }, ME)).toBe(null);
    expect(storyTriggerForEvent({ type: "ko", killerId: "b1", victimId: "b2" }, ME)).toBe(null);
  });

  it("不相干的事件（打击 / 觉醒 / 塌台）一律 null，坏事件也不抛", () => {
    for (const type of ["hit", "slap", "awaken", "dash", "tileBreak", "respawn", "hubFocus"]) {
      expect(storyTriggerForEvent({ type, playerId: ME }, ME), type).toBe(null);
    }
    expect(storyTriggerForEvent(null, ME)).toBe(null);
    expect(storyTriggerForEvent({}, ME)).toBe(null);
    expect(storyTriggerForEvent({ type: 7 }, ME)).toBe(null);
  });

  it("映射表吐出来的时机词，数据表里都有对应的一拍", () => {
    const events = [
      { type: "hubEquip", playerId: ME },
      { type: "enterArena", playerId: ME },
      { type: "enterHub", playerId: ME },
      { type: "ko", killerId: ME, victimId: "b1" },
    ];
    for (const e of events) {
      const trigger = storyTriggerForEvent(e, ME);
      expect(pickBeat(STORY, trigger, []), `${e.type} 没接到掌语`).not.toBe(null);
    }
  });

  it("一串事件走一遍：每一拍只放一次，重复事件静默", () => {
    const { director, toasts } = makeDirector();
    const stream = [
      { type: "hubEquip", playerId: ME },
      { type: "hit", playerId: ME, targetId: "b1" },
      { type: "hubEquip", playerId: ME }, // 又换了一只 —— 拾掌那拍不再放
      { type: "enterArena", playerId: ME },
      { type: "ko", killerId: ME, victimId: "b1" },
      { type: "ko", killerId: "b1", victimId: ME }, // 首坠 —— 与首杀共用一拍，不重放
    ];
    const fired = [];
    for (const e of stream) {
      const trigger = storyTriggerForEvent(e, ME);
      if (!trigger) continue;
      const beat = director.fire(trigger);
      if (beat) fired.push(beat.id);
    }
    expect(fired).toEqual(["first_glove", "portal", "first_blood"]);
    // 同一场里连着来三拍：句子按次序排队，后一拍不许把前一拍从屏上挤掉
    expect(toasts.map((t) => t.text)).toEqual([STORY_BY_ID.first_glove.lines[0]]);
    expect(director.pending).toEqual([
      ...STORY_BY_ID.first_glove.lines.slice(1),
      ...STORY_BY_ID.portal.lines,
      ...STORY_BY_ID.first_blood.lines,
    ]);
  });
});

describe("五拍全接线", () => {
  let box;
  beforeEach(() => {
    box = makeDirector();
  });

  it("每个时机词都取得到一拍，且五拍互不重复", () => {
    const ids = Object.values(STORY_TRIGGER).map((t) => {
      const beat = box.director.fire(t);
      expect(beat, `时机 ${t} 没接到掌语`).not.toBe(null);
      return beat.id;
    });
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(STORY.length);
  });

  it("时机词表与数据表的 trigger 一一对得上", () => {
    const fromData = new Set(STORY.map((b) => b.trigger));
    const fromCore = new Set(Object.values(STORY_TRIGGER));
    expect([...fromCore].sort()).toEqual([...fromData].sort());
  });
});
