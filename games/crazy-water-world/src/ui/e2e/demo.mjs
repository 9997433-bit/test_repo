// 走查录像：启航 → 拾荒 → 建造预览/红格 → 钓鱼节奏条 → 潜水 HUD → 英雄委任 → 关卡战报。
import { chromium } from "playwright-core";
import { seaLayout, flotsamPoint } from "../../world/canvas.js";
import { richSave } from "./seed.mjs";

const save = richSave();
const VIDEO = process.env.OUT || "/tmp/cww-e2e/video";

const browser = await chromium.launch({ executablePath: process.env.CHROME || "/usr/local/bin/google-chrome", args: ["--no-sandbox"] });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: VIDEO, size: { width: 1280, height: 800 } },
});
const page = await context.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", String(e).slice(0, 200)));
await page.addInitScript((p) => localStorage.setItem("cww.save.v1", p), JSON.stringify(save));

const box = async () =>
  page.$eval("#sea", (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, w: r.width, h: r.height };
  });

const wait = (ms) => page.waitForTimeout(ms);

await page.goto(process.env.CWW_URL || "http://localhost:4174/", { waitUntil: "networkidle" });
await wait(1800);

// 1. 启航
await page.click("#resume");
await wait(1600);

// 2. 拾荒：稀有蓝图 + 普通浮木
const b = await box();
const layout = seaLayout(save, b.w, b.h);
for (const id of ["seed-2", "seed-1", "seed-3"]) {
  const f = save.explore.salvage.flotsam.find((it) => it.id === id);
  const p = flotsamPoint(f, layout, 0);
  await page.mouse.move(b.left + p.x, b.top + p.y, { steps: 12 });
  await wait(320);
  await page.mouse.click(b.left + p.x, b.top + p.y);
  await wait(900);
}

// 3. 交居民订单
await page.click('[data-act="order"]').catch(() => {});
await wait(1400);

// 4. 建造：非法红格 → 合法绿格 → 落成 → 升级模式升 HQ
const cell = (cx, cy) => ({
  x: b.left + layout.ox + cx * layout.cell + layout.cell / 2,
  y: b.top + layout.oy + cy * layout.cell + layout.cell / 2,
});
await page.keyboard.press("b");
await wait(900);
await page.click('[data-type="fish_plant"]');
await wait(600);
const bad = cell(0, 0);
await page.mouse.move(bad.x, bad.y, { steps: 18 });
await wait(1500);
const bad2 = cell(5, 4);
await page.mouse.move(bad2.x, bad2.y, { steps: 14 });
await wait(1500);
const good = cell(3, 3);
await page.mouse.move(good.x, good.y, { steps: 14 });
await wait(1200);
await page.mouse.click(good.x, good.y);
await wait(1300);

await page.click('[data-mode="upgrade"]');
await wait(600);
const hq = cell(0, 0);
await page.mouse.move(hq.x, hq.y, { steps: 14 });
await wait(1100);
await page.mouse.click(hq.x, hq.y);
await wait(1400);

// 5. 钓鱼：抛竿 → 掐点收杆
await page.keyboard.press("f");
await wait(900);
await page.click("#fish-cast");
await wait(1700);
await page.evaluate(async () => {
  const zone = document.querySelector("#fish-zone");
  const needle = document.querySelector("#fish-needle");
  const a = parseFloat(zone.style.left);
  const w = parseFloat(zone.style.width);
  for (let i = 0; i < 600; i += 1) {
    const pos = parseFloat(needle.style.left);
    if (pos >= a + w * 0.4 && pos <= a + w * 0.6) {
      document.querySelector("#fish-hook").click();
      return;
    }
    await new Promise((r) => requestAnimationFrame(r));
  }
});
await wait(1800);

// 6. 潜水：下潜 → 触控方向热区游到资源点 → 上浮
await page.keyboard.press("v");
await wait(800);
await page.click("#dive-start");
await wait(1200);
const hold = async (sel, ms) => {
  await page.hover(sel);
  await page.mouse.down();
  await wait(ms);
  await page.mouse.up();
  await wait(200);
};
await hold('[data-hold="pad-right"]', 1700);
await hold('[data-hold="pad-down"]', 2000);
await wait(600);
await hold('[data-hold="pad-up"]', 2100);
await wait(400);
await page.click("#dive-up");
await wait(1800);

// 7. 英雄：招募 → 委任 → 升星
await page.keyboard.press("h");
await wait(900);
await page.click('[data-act="recruit"][data-key="sam"]');
await wait(1300);
await page.selectOption("[data-assign]", { index: 1 });
await wait(1400);
await page.click('[data-act="star"]');
await wait(1400);

// 8. 关卡：出战 + 战报播放
await page.keyboard.press("c");
await wait(900);
await page.click("#camp-fight");
await wait(3200);
await page.click('[data-act="stage-next"]').catch(() => {});
await wait(700);
await page.click("#camp-fight");
await wait(3600);

// 9. 倍速 + 回木筏
await page.keyboard.press("4");
await wait(1200);
await page.keyboard.press("Escape");
await wait(2000);

await context.close();
await browser.close();
console.log("done");
