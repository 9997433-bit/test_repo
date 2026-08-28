// 五拍旁白契约测试（P2 内容轮）。台词本身归 F1 可改；这里锁的是形状与纪律：
// 恰好 5 拍、触发词互异、全部 once、全线 ≤ 20 句、单句 ≤ 18 字（木棉的口气是短句）。
import { describe, expect, it } from "vitest";
import { STORY, STORY_BY_ID } from "./story.js";

const EXPECTED_TRIGGERS = [
  "hub_first_enter",
  "glove_first_pickup",
  "portal_first_cross",
  "first_kill_or_fall",
  "match_first_win",
];

describe("STORY 五拍旁白", () => {
  it("恰好 5 拍：初来/拾掌/过门/首杀或首坠/首胜，id 与 trigger 互异", () => {
    expect(STORY).toHaveLength(5);
    expect(new Set(STORY.map((b) => b.id)).size).toBe(5);
    expect(STORY.map((b) => b.trigger)).toEqual(EXPECTED_TRIGGERS);
    for (const beat of STORY) expect(STORY_BY_ID[beat.id]).toBe(beat);
  });

  it("每拍 id/trigger/lines/once 齐全，全部 once（每份存档只放一次）", () => {
    for (const beat of STORY) {
      expect(beat.id).toBeTypeOf("string");
      expect(beat.id.length).toBeGreaterThan(0);
      expect(beat.trigger).toBeTypeOf("string");
      expect(beat.once).toBe(true);
      expect(Array.isArray(beat.lines)).toBe(true);
      expect(beat.lines.length).toBeGreaterThan(0);
    }
  });

  it("木棉短句纪律：全线合计 ≤ 20 句，单句非空且 ≤ 18 字", () => {
    const all = STORY.flatMap((b) => b.lines);
    expect(all.length).toBeLessThanOrEqual(20);
    for (const line of all) {
      expect(line).toBeTypeOf("string");
      expect(line.trim().length).toBeGreaterThan(0);
      expect(line.length, line).toBeLessThanOrEqual(18);
    }
  });

  it("JSON 纯净 + 深冻结：可序列化、可 structuredClone、改写抛错", () => {
    const roundTrip = JSON.parse(JSON.stringify(STORY));
    expect(roundTrip).toEqual(STORY);
    expect(() => structuredClone(STORY)).not.toThrow();
    expect(() => {
      STORY[0].lines.push("多嘴一句");
    }).toThrow();
    expect(() => {
      STORY_BY_ID.arrive.once = false;
    }).toThrow();
  });
});
