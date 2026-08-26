// Round 3 契约走查录像（不做断言，断言在 contract-r3.mjs）：
// 图鉴 → 抛竿收杆（完美 + 首钓收录）→ 切屏提示线还在水里 → 海区选择与上锁理由 →
// 下潜 → 海啸把人拽上来、把竿子作废。
// 天气不是等来的：seed 由 tsunamiSave 现筛，海啸准点落在第 atTick 个量子。
import { chromium } from "playwright-core";
import { tsunamiSave } from "./seed.mjs";

const VIDEO = process.env.OUT || "/tmp/cww-e2e/video";
const AT_TICK = Number(process.env.AT_TICK) || 520;
const { save, tick } = tsunamiSave({ atTick: AT_TICK });
console.log(`seed ${save.meta.seed}：第 ${tick} 量子（约 ${(tick / 10).toFixed(0)} 秒）转海啸`);

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

/** 指针压进金条那一刻收杆：读的是 UI 每帧写的内联 style，和判定用的是同一个位置。 */
const hookOnPerfect = () =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        const t0 = Date.now();
        const pct = (el, prop) => parseFloat(el.style[prop]) || 0;
        const tick = () => {
          const zone = document.querySelector("#fish-zone");
          const core = document.querySelector("#fish-core");
          const needle = pct(document.querySelector("#fish-needle"), "left");
          const zl = pct(zone, "left");
          const zw = pct(zone, "width");
          const cl = zl + (pct(core, "left") / 100) * zw;
          const cw = (pct(core, "width") / 100) * zw;
          if (needle >= cl && needle <= cl + cw) {
            document.querySelector("#fish-hook").click();
            return resolve(true);
          }
          if (Date.now() - t0 > 9000) return resolve(false);
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );

await page.goto(process.env.CWW_URL || "http://localhost:4174/", { waitUntil: "networkidle" });
await wait(1000);
const t0 = Date.now();
await tap("#resume", 1200);
// 录像的节奏得对着模拟时钟走：海啸是第 tick 个量子准点到，早了氧气会先耗光。
const syncTo = async (sec) => {
  const left = t0 + sec * 1000 - Date.now();
  if (left > 0) await wait(left);
};

// 1. 钓鱼屏：开放海域、图鉴（全是问号）
await page.keyboard.press("f");
await wait(1400);
await tap("#fish-dex-btn", 2400);
await tap("#fish-dex-btn", 900);

// 2. 抛竿 → 指针进金条收杆 → 完美 + 首钓收录
await tap("#fish-cast", 600);
await hookOnPerfect();
await wait(2200);
await tap("#fish-dex-btn", 2600);
await tap("#fish-dex-btn", 800);

// 3. 再抛一竿，切屏：线不再被偷偷剪掉，左面板挂提示条
await tap("#fish-cast", 900);
await page.keyboard.press("h");
await wait(2600);
await tap('[data-act="fish-back"]', 2000);

// 4. 潜水屏：海区面板 —— 锁着的那片点一下就给理由
await page.keyboard.press("v");
await wait(1600);
await tap('[data-act="dive-zone"][data-zone="trench"]', 2200);
await tap('[data-act="dive-zone"][data-zone="wreck"]', 1400);

// 5. 下潜，游两下捡东西（留够氧气等海啸）
await syncTo((tick / 10) - 13);
await tap("#dive-start", 1200);
for (const [key, ms] of [
  ["ArrowDown", 900],
  ["ArrowRight", 700],
  ["ArrowDown", 600],
  ["ArrowLeft", 800],
]) {
  await page.keyboard.down(key);
  await wait(ms);
  await page.keyboard.up(key);
  await wait(250);
}

// 6. 海啸：潜水被强制捞上来，钓鱼提示条改口
await page.waitForSelector('html[data-weather="tsunami"]', { timeout: 30000 });
await wait(3000);

// 7. 回去收杆：走 hookCast 的强制分支 —— 不算空军
await tap('[data-act="fish-back"]', 1600);
await tap("#fish-hook", 3000);

await context.close();
await browser.close();
console.log("done");
