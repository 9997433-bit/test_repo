// 皮肤真表契约测试（API_CONTRACT §3.2 / §14-17，ADR-26）。
// 文案与配色归 F3 可调；这里锁的是词表、形状与「灰度剪影可辨」的不变量。
import { describe, expect, it } from "vitest";
import { DEFAULT_SKIN_ID, SKINS, SKIN_BY_ID, resolveSkin } from "./skins.js";
import { BOT_PERSONAS } from "./bots.js";
import * as data from "./index.js";
import { normalizeSkinId, resolveSkins } from "../core/skins.js";

/** 契约 §3.2 皮肤表 v1：id 词表与表序都冻结（新皮肤先登记契约再进表） */
const SKIN_VOCAB = ["drifter", "mason", "crane", "reed", "nuo", "wildhorn"];
const BUILDS = ["slim", "stock", "broad"];
const HEADGEARS = ["hood", "bare", "topknot", "strawHat", "mask", "horns"];
const BACKS = ["panel", "banner", "pack"];
const PALETTE_KEYS = ["cloth", "clothDim", "leather", "accent", "skin"];
/** 壳层兜底表的原创 id：不得升格为真表默认（Round 2 简报红线） */
const SHELL_FALLBACK_IDS = ["ash", "kiln", "mica", "loam", "dusk", "brine"];

describe("SKINS 真表（契约 §3.2 形状）", () => {
  it("≥6 套、id 唯一、恰为词表 v1、顺序 = 契约表序（大厅选择器顺序）", () => {
    expect(SKINS.length).toBeGreaterThanOrEqual(6);
    expect(new Set(SKINS.map((s) => s.id)).size).toBe(SKINS.length);
    expect(SKINS.map((s) => s.id)).toEqual(SKIN_VOCAB);
    // Bot 引用的三套必须在表内（bots.js 已写死 wildhorn/crane/nuo）
    for (const id of ["wildhorn", "crane", "nuo"]) {
      expect(SKIN_BY_ID[id], id).toBeTruthy();
    }
  });

  it("字段齐全：build/headgear/back 枚举合法、palette 五段 hex、文案限长", () => {
    for (const s of SKINS) {
      expect(BUILDS, `${s.id}.build`).toContain(s.build);
      expect(HEADGEARS, `${s.id}.headgear`).toContain(s.headgear);
      expect(BACKS, `${s.id}.back`).toContain(s.back);
      expect(Object.keys(s.palette).sort()).toEqual([...PALETTE_KEYS].sort());
      for (const k of PALETTE_KEYS) {
        expect(s.palette[k], `${s.id}.palette.${k}`).toMatch(/^#[0-9a-f]{6}$/i);
      }
      // 中文名 ≤3 字（排版空格不计）、一句话说明 ≤18 字（契约 §3.2 注释）
      const bare = s.name.replace(/\s/g, "");
      expect(bare.length, `${s.id}.name`).toBeGreaterThanOrEqual(1);
      expect(bare.length, `${s.id}.name`).toBeLessThanOrEqual(3);
      expect(s.desc.length, `${s.id}.desc`).toBeGreaterThan(0);
      expect(s.desc.length, `${s.id}.desc`).toBeLessThanOrEqual(18);
    }
  });

  it("纯装饰（ADR-26）：只允许契约字段，无任何战斗数值键", () => {
    const allowed = ["id", "name", "desc", "build", "headgear", "back", "palette", "trim"];
    for (const s of SKINS) {
      for (const key of Object.keys(s)) {
        expect(allowed, `${s.id}.${key}`).toContain(key);
      }
      if (s.trim !== undefined) {
        for (const [k, v] of Object.entries(s.trim)) {
          expect(["number", "string"], `${s.id}.trim.${k}`).toContain(typeof v);
        }
      }
    }
  });

  it("灰度剪影可辨：headgear 六套互异，(build, headgear, back) 组合互异", () => {
    expect(new Set(SKINS.map((s) => s.headgear)).size).toBe(SKINS.length);
    const silhouettes = new Set(SKINS.map((s) => `${s.build}|${s.headgear}|${s.back}`));
    expect(silhouettes.size).toBe(SKINS.length);
  });

  it("DEFAULT_SKIN_ID = 'drifter'（契约）且在表内；resolveSkin 对象级兜底", () => {
    expect(DEFAULT_SKIN_ID).toBe("drifter");
    expect(SKIN_BY_ID[DEFAULT_SKIN_ID]).toBeTruthy();
    expect(SHELL_FALLBACK_IDS).not.toContain(DEFAULT_SKIN_ID);
    for (const s of SKINS) expect(SKIN_BY_ID[s.id]).toBe(s);
    // 未知 / null / 缺省 → 默认皮肤对象（契约 §14-17）
    expect(resolveSkin("查无此皮")).toBe(SKIN_BY_ID[DEFAULT_SKIN_ID]);
    expect(resolveSkin(null)).toBe(SKIN_BY_ID[DEFAULT_SKIN_ID]);
    expect(resolveSkin()).toBe(SKIN_BY_ID[DEFAULT_SKIN_ID]);
    expect(resolveSkin("crane")).toBe(SKIN_BY_ID.crane);
  });

  it("Bot 三人格 skinId 都在真表内、互异、≠ DEFAULT_SKIN_ID（§3.2 规则 3）", () => {
    const ids = BOT_PERSONAS.map((p) => p.skinId);
    expect(ids.length).toBeGreaterThanOrEqual(3);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(SKIN_BY_ID[id], id).toBeTruthy();
      expect(id).not.toBe(DEFAULT_SKIN_ID);
      expect(resolveSkin(id).id).toBe(id);
    }
  });

  it("壳层 resolveSkins 吃到 data 命名空间即翻 source:'data'，默认落 drifter", () => {
    const table = resolveSkins(data);
    expect(table.source).toBe("data");
    expect(table.defaultId).toBe(DEFAULT_SKIN_ID);
    expect(table.byId).toBe(SKIN_BY_ID);
    expect(table.skins.map((s) => s.id)).toEqual(SKIN_VOCAB);
    // id 级归一仍走壳层 normalizeSkinId：旧档 / 已删 id 落到数据默认皮肤
    expect(normalizeSkinId("wildhorn", table)).toBe("wildhorn");
    expect(normalizeSkinId("查无此皮", table)).toBe(DEFAULT_SKIN_ID);
    expect(normalizeSkinId(undefined, table)).toBe(DEFAULT_SKIN_ID);
  });

  it("JSON 纯净 + 深冻结：可序列化、可 structuredClone、改写抛错", () => {
    const roundTrip = JSON.parse(JSON.stringify(SKINS));
    expect(roundTrip).toEqual(SKINS);
    expect(() => structuredClone(SKINS)).not.toThrow();
    expect(() => {
      SKIN_BY_ID.drifter.name = "改";
    }).toThrow();
    expect(() => {
      SKINS[0].palette.cloth = "#000000";
    }).toThrow();
  });
});
