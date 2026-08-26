// Round 2 接线走查录像（不做断言，断言在 wiring.mjs）：
// 自动配队 → 手动改阵容 → 超编拦截 → 出战与伤病 → 名单两栏 → 潜水切屏警告 → 动效开关。
import { chromium } from "playwright-core";
import { veteranSave } from "./seed.mjs";

const VIDEO = process.env.OUT || "/tmp/cww-e2e/video";
const save = veteranSave({ bestStage: 19, stars: 1 });

const browser = await chromium.launch({
  executablePath: process.env.CHROME || "/usr/local/bin/google-chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: VIDEO, size: { width: 1280, height: 800 } },
});
const page = await context.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", String(e).slice(0, 200)));
await page.addInitScript((p) => localStorage.setItem("cww.save.v1", p), JSON.stringify(save));

const wait = (ms) => page.waitForTimeout(ms);
const tap = async (sel, ms = 900) => {
  await page.hover(sel);
  await wait(220);
  await page.click(sel);
  await wait(ms);
};

await page.goto(process.env.CWW_URL || "http://localhost:4174/", { waitUntil: "networkidle" });
await wait(1200);
await tap("#resume", 1400);

// 1. 关卡屏：自动配队就是 selectLineup 的结果（六人队只上五个，米娅被留在板凳上）
await page.keyboard.press("c");
await wait(1600);
await page.hover("#camp-team");
await wait(1600);

// 2. 手动改阵容：换下一龙 → 换上米娅 → 再点一龙触发超编拦截
await tap('[data-act="pick"][data-id="h-yilong"]', 1200);
await tap('[data-act="pick"][data-id="h-mia"]', 1400);
await tap('[data-act="pick"][data-id="h-yilong"]', 1600);
await tap('[data-act="lineup-auto"]', 1400);

// 3. 出战：种子带重试盐，战报播放，播完「跳过」自己收起
await tap("#camp-fight", 2600);
await tap("#camp-skip", 1800);
await wait(1400);

// 4. 伤员分栏：阵亡五人全部养伤，阵容只剩没上场的米娅
await page.evaluate(() => {
  document.querySelector("#left").scrollTop = 0;
});
await wait(2200);

// 5. 英雄屏：可招募 / 已在船两栏 + 养伤卡片
await page.keyboard.press("h");
await wait(2400);
await page.evaluate(() => {
  document.querySelector("#left").scrollTop = 520;
});
await wait(2000);
await page.evaluate(() => {
  document.querySelector("#left").scrollTop = 1400;
});
await wait(2200);

// 6. 潜水：下潜 → 切屏 → 红色警告条上的氧气继续掉 → 回水里
await page.keyboard.press("v");
await wait(1000);
await tap("#dive-start", 1600);
await page.keyboard.press("h");
await wait(3000);
await tap('[data-act="dive-back"]', 1600);
await tap("#dive-up", 1600).catch(() => {});

// 7. 减弱动态：按钮上直接写状态
await tap("#btn-motion", 1800);
await tap("#btn-motion", 1400);

await context.close();
await browser.close();
console.log("done");
