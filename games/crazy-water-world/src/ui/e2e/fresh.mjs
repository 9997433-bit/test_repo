// 新手路径：没有存档 → 启航 → 空木筏 → 主线指引 → 建指挥中心 → 拾荒。
import { chromium } from "playwright-core";
import { defaultState } from "../../core/store.js";
import { seaLayout } from "../../world/canvas.js";

const OUT = process.env.OUT || "/tmp/cww-e2e/shots";
const results = [];
const check = (name, cond, extra = "") => {
  results.push({ name, pass: !!cond });
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${extra ? ` — ${extra}` : ""}`);
};

const browser = await chromium.launch({ executablePath: process.env.CHROME || "/usr/local/bin/google-chrome", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 820 }, deviceScaleFactor: 2 });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(process.env.CWW_URL || "http://localhost:4174/", { waitUntil: "networkidle" });
await page.waitForTimeout(700);

check("无存档时只有启航", !(await page.$("#resume")));
check("标题提示无存档", (await page.textContent("#title-save")).includes("第一次出海"));
await page.click("#start");
await page.waitForTimeout(600);
check("启航进游戏", await page.isVisible("#game"));
check("主线指引指向指挥中心", (await page.textContent("#goal-text")).includes("指挥中心"), await page.textContent("#goal-text"));

await page.click('[data-act="goal-jump"]');
await page.waitForTimeout(400);
check("带我去跳到建造屏", await page.isVisible("#build-grid"));
check("默认选中指挥中心", (await page.getAttribute('[data-type="hq"]', "class")).includes("on"));

const state = defaultState();
const box = await page.$eval("#sea", (el) => {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, w: r.width, h: r.height };
});
const layout = seaLayout(state, box.w, box.h);
const at = (cx, cy) => ({
  x: box.left + layout.ox + cx * layout.cell + layout.cell / 2,
  y: box.top + layout.oy + cy * layout.cell + layout.cell / 2,
});

const spot = at(2, 1);
await page.mouse.move(spot.x, spot.y);
await page.waitForTimeout(250);
check("空木筏上预览是 2×2 绿格", (await page.$$(".cww-ghost-cell.ok")).length === 4);
await page.screenshot({ path: `${OUT}/10_fresh_preview.png` });

await page.mouse.click(spot.x, spot.y);
await page.waitForTimeout(400);
check("指挥中心落成", (await page.textContent("#toast")).includes("指挥中心"), await page.textContent("#toast"));
check("指引推进到下一步", (await page.textContent("#goal-text")).includes("钓鱼椅"), await page.textContent("#goal-text"));

// 资源不够时必须给红格 + 中文原因（连点几次直到材料见底）
await page.click('[data-type="dive_dock"]');
await page.waitForTimeout(200);
await page.mouse.move(at(4, 3).x, at(4, 3).y);
await page.waitForTimeout(250);
const label = await page.textContent(".cww-ghost-label");
check("未解锁建筑给出等级原因", label.includes("等级") || label.includes("材料"), label);
await page.screenshot({ path: `${OUT}/11_fresh_locked.png` });

check("无 JS 报错", errors.length === 0, errors.slice(0, 2).join(" | "));
await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
if (failed.length) process.exit(1);
