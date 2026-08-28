// P2-F2 外观合同的反查（node 环境读文件，与 hub-css.test.js 同一姿势）：
// hud-impact.test.js / lore.test.js 钉的 JS 钩子，两套 CSS 都得认识 ——
// F2 正装（src/styles/hud.css）与壳层兜底（ui/shell.css）谁在场都不能瞎。

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const F2 = readFileSync(new URL("../styles/hud.css", import.meta.url), "utf8");
const FALLBACK = readFileSync(new URL("./shell.css", import.meta.url), "utf8");

describe("外观合同反查：两套 CSS 都认识 P2-F2 的新钩子", () => {
  it("styles/hud.css：击退刻度 / 命中脉冲 / 掌语字条", () => {
    for (const sel of [
      ".yz-knock",
      ".yz-knock-fill",
      ".yz-knock-ticks",
      ".yz-knock.is-hot",
      ".yz-knock.is-bump",
      ".yz-reticle.is-hit",
      ".yz-lore",
      ".yz-lore-item.is-on",
    ]) {
      expect(F2, sel).toContain(sel);
    }
  });

  it("ui/shell.css 兜底：同一套类名不掉队", () => {
    for (const sel of [".yz-knock", ".yz-knock-fill", ".yz-reticle.is-hit", ".yz-lore-item.is-on"]) {
      expect(FALLBACK, sel).toContain(sel);
    }
  });

  it("命中脉冲是一瞬状态：填充钩子 --knock 与 --meter 两条各自成立", () => {
    expect(F2).toContain("var(--knock, 0)");
    expect(FALLBACK).toContain("var(--knock, 0)");
    // 击退刻度不改掌意条那份 --meter 合同
    expect(F2).toContain("var(--meter, 0)");
  });
});
