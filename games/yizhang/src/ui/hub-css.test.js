// `src/ui/hub.css` 的边界测试（Round 1 遗留 9：双 CSS 生效来源）。
//
// 分工：外观归 F2 的 `src/styles/hub.css`，壳层这份只留结构兜底。
// 这条测试就是那把尺子 —— 谁再往 ui/hub.css 里写颜色/字体/材质，这里先红。
// （不读 src/styles：那是 F2 的文件，本席只读不改，也不替它断言。）

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const CSS = readFileSync(new URL("./hub.css", import.meta.url), "utf8");

/** 去掉注释再看声明：注释里出现「颜色」两个字不算犯规。 */
const BODY = CSS.replace(/\/\*[\s\S]*?\*\//g, "");

const APPEARANCE_PROPS = [
  "color",
  "background",
  "background-color",
  "background-image",
  "border",
  "border-color",
  "border-radius",
  "box-shadow",
  "text-shadow",
  "font",
  "font-family",
  "font-size",
  "font-weight",
  "letter-spacing",
  "text-indent",
  "animation",
  "transition",
  "filter",
  "backdrop-filter",
];

/** O4 的 JS（ui/hub.js / ui/touch.js / ui/shell.js）按名挂 DOM，这些选择器不许消失。 */
const REQUIRED = [
  ".yz-hub-hud",
  '#hud[data-phase="hub"]',
  ".yz-hub-title",
  ".yz-inspect",
  ".yz-inspect.is-on",
  ".yz-inspect-head",
  ".yz-inspect-desc",
  ".yz-inspect-cta",
  ".yz-inspect-key",
  ".yz-inspect-cta-text",
  ".yz-inspect-slot",
  ".yz-loadout-strip",
  ".yz-loadout-slot",
  ".yz-loadout-sep",
  ".yz-portal-hint",
  ".yz-hub-confirm",
  '.yz-touch[data-phase="hub"] .yz-hub-confirm',
  ".yz-warp",
  ".yz-warp.is-on",
];

describe("ui/hub.css 是结构兜底", () => {
  for (const prop of APPEARANCE_PROPS) {
    it(`不写外观属性：${prop}`, () => {
      const re = new RegExp(`(^|[;{\\s])${prop}\\s*:`, "i");
      expect(re.test(BODY), `${prop} 属于 F2 的 styles/hub.css`).toBe(false);
    });
  }

  it("不自带动画关键帧与渐变", () => {
    expect(BODY).not.toContain("@keyframes");
    expect(BODY).not.toContain("gradient(");
  });

  it("结构属性还在：摆放 / 排布 / 显隐门", () => {
    for (const prop of ["position", "display", "pointer-events", "flex-direction", "visibility"]) {
      expect(BODY, prop).toContain(`${prop}:`);
    }
  });

  it("O4 JS 依赖的类名一个都没少", () => {
    for (const sel of REQUIRED) expect(CSS, sel).toContain(sel);
  });

  it("phase 显隐门仍在这边：hub 里战斗件让位，arena 里大厅 HUD 收起", () => {
    expect(BODY).toMatch(/\.yz-hub-hud\s*\{[^}]*display:\s*none/);
    expect(BODY).toMatch(/#hud\[data-phase="hub"\]\s*\.yz-hub-hud\s*\{[^}]*display:\s*block/);
    expect(BODY).toMatch(/#hud\[data-phase="hub"\][\s\S]*?\.yz-glove-dock\s*\{[^}]*display:\s*none/);
    expect(BODY).toMatch(/\.yz-touch\[data-phase="hub"\]\s*\.yz-hub-confirm\s*\{[^}]*display:\s*grid/);
  });

  it("收缩后确实比 F2 那份薄一大截（外观没有留在两边）", () => {
    const declarations = (BODY.match(/[a-z-]+\s*:/g) || []).length;
    expect(declarations).toBeLessThan(90);
  });
});
