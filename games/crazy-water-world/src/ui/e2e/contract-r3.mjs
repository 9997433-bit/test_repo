// Round 3 契约走查：把「UI 自己攒了一套」的三处逐条按到 DOM 上验。
//   1) 钓鱼这一竿的真源是 state.explore.fishing.cast —— 走 beginCast / hookCast，
//      不是 UI 里的模块变量（切屏回来竿子还在、自动存档里能看见这一竿）
//   2) 潜水海区面板 = diveZones（解锁与拒绝原因都来自领域层），开潜走 beginDive
//   3) 鱼类图鉴 = fishCodex；首钓那一刻收录 +1
//   4) 天气翻脸：进行中的钓/潜在别的屏也有话说，收杆走 hookCast 的强制分支
import { chromium } from "playwright-core";
import { richSave, diveSave, tsunamiSave } from "./seed.mjs";
import { canDive, fishCodex, fishingPool } from "../../explore/index.js";
import { DIVE_ZONES } from "../../data/dive.js";
import { FISH } from "../../data/fish.js";

const URL = process.env.CWW_URL || "http://localhost:4174/";
const OUT = process.env.OUT || "/tmp/cww-e2e/shots";

const results = [];
const check = (name, cond, extra = "") => {
  results.push({ name, pass: !!cond });
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${extra ? ` — ${extra}` : ""}`);
};

const browser = await chromium.launch({
  executablePath: process.env.CHROME || "/usr/local/bin/google-chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
});

async function openWith(save) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 820 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.addInitScript((p) => localStorage.setItem("cww.save.v1", p), JSON.stringify(save));
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.click("#resume");
  await page.waitForTimeout(500);
  return { context, page, errors };
}

/** 页面里现读一竿：绿区 / 金条 / 指针的位置全从内联 style 上取（UI 每帧只改 style）。 */
const readBar = (page) =>
  page.evaluate(() => {
    const pct = (el, prop) => parseFloat(el.style[prop]) || 0;
    const zone = document.querySelector("#fish-zone");
    const core = document.querySelector("#fish-core");
    return {
      shown: zone.style.display === "block",
      needle: pct(document.querySelector("#fish-needle"), "left"),
      zone: [pct(zone, "left"), pct(zone, "left") + pct(zone, "width")],
      corePct: [pct(core, "left"), pct(core, "left") + pct(core, "width")],
    };
  });

/* ══════════════ 一、钓鱼：竿子活在 state 上，图鉴走 fishCodex ══════════════ */
const rich = richSave();
const pool = fishingPool(rich);
let { context, page, errors } = await openWith(rich);

await page.keyboard.press("f");
await page.waitForTimeout(300);
check("图鉴按钮起手 0 收录", (await page.textContent("#fish-dex-btn")) === `图鉴 0/${FISH.length}`, await page.textContent("#fish-dex-btn"));
const seaLine = await page.textContent("#fish-sea");
check(
  "开放海域来自 fishingPool（近海+远洋+深海，深渊仍关着）",
  pool.seas.every((id) => seaLine.includes(id === "near" ? "近海" : id === "far" ? "远洋" : "深海")) && !seaLine.includes("深渊"),
  seaLine,
);

await page.click("#fish-cast");
await page.waitForTimeout(200);
let bar = await readBar(page);
check("抛竿后节奏条画出窗口", bar.shown && bar.zone[1] > bar.zone[0], JSON.stringify(bar.zone));
check("抛竿按钮锁上、收杆按钮解锁", (await page.isDisabled("#fish-cast")) && !(await page.isDisabled("#fish-hook")));

// 自动存档 4s 一次：存档里能看见这一竿，就说明它真的写进了 state（beginCast），
// 而不是躺在 UI 的模块变量里。
await page.waitForTimeout(4400);
const saved = JSON.parse(await page.evaluate(() => localStorage.getItem("cww.save.v1")));
const savedCast = saved.explore?.fishing?.cast || null;
check("这一竿写进了 state.explore.fishing.cast", savedCast?.ok === true, JSON.stringify(savedCast?.fish?.id || null));
bar = await readBar(page);
check(
  "屏幕上的绿区就是 state 里那一竿的 window",
  Math.abs(savedCast.window[0] * 100 - bar.zone[0]) < 0.2 && Math.abs(savedCast.window[1] * 100 - bar.zone[1]) < 0.2,
  `state ${JSON.stringify(savedCast.window)} vs DOM ${JSON.stringify(bar.zone)}`,
);
check("窗口没被写成数字泄底", !(await page.textContent("#left")).includes(String(Math.round(savedCast.window[0] * 100))));

// 切屏：线不再被偷偷剪掉，改成挂一条提示
await page.keyboard.press("h");
await page.waitForTimeout(400);
const fishAlert = await page.textContent("#fish-alert");
check("切屏后挂出钓鱼提示条", await page.isVisible("#fish-alert"), fishAlert);
check("提示条明说天气会强制收杆", fishAlert.includes("强制收杆"), fishAlert);
await page.screenshot({ path: `${OUT}/30_fish_alert.png` });
await page.click('[data-act="fish-back"]');
await page.waitForTimeout(400);
check("「回竿边」跳回钓鱼屏", (await page.getAttribute("html", "data-view")) === "fish");
check("切一圈回来竿子还在（不再偷偷剪线）", !(await page.isDisabled("#fish-hook")) && (await readBar(page)).shown);

// 指针进金条那一刻收杆：判定与画面用的是同一个 gradeCast
const hit = await page.evaluate(
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
          resolve({ needle, core: [cl, cl + cw] });
          return;
        }
        if (Date.now() - t0 > 9000) return resolve(null);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }),
);
await page.waitForTimeout(300);
check("指针压在金条上时收杆", !!hit, JSON.stringify(hit));
const caught = await page.textContent("#fish-catch");
check("完美判定与画面一致（收杆即完美）", caught.includes("完美！"), caught);
check("收完一竿图鉴 +1", (await page.textContent("#fish-dex-btn")) === `图鉴 1/${FISH.length}`, await page.textContent("#fish-dex-btn"));
check("首钓奖励播报到吐司", (await page.textContent("#toast")).includes("图鉴 +1"), await page.textContent("#toast"));

await page.click("#fish-dex-btn");
await page.waitForTimeout(300);
const cells = await page.$$eval(".cww-dex-cell", (els) =>
  els.map((e) => ({ name: e.querySelector("b").textContent, unknown: e.classList.contains("unknown"), here: e.classList.contains("here") })),
);
check("图鉴列全了 FISH 表", cells.length === FISH.length, `${cells.length} 格`);
check("没钓上来的只给轮廓", cells.filter((c) => c.unknown).length === FISH.length - 1 && cells.every((c) => !c.unknown || c.name === "？？？"));
check(
  "当前可钓的鱼有在池标记",
  cells.filter((c) => c.here).length === fishCodex(rich).entries.filter((e) => e.available).length,
  `${cells.filter((c) => c.here).length} 种在池`,
);
await page.screenshot({ path: `${OUT}/31_fish_codex.png` });
check("第一段无 JS 报错", errors.length === 0, errors.slice(0, 3).join(" | "));
await context.close();

/* ══════════════ 二、潜水海区：解锁与拒绝原因都来自 diveZones ══════════════ */
const diver = diveSave({ dockLevel: 2, bestStage: 19 });
({ context, page, errors } = await openWith(diver));
await page.keyboard.press("v");
await page.waitForTimeout(400);

const zoneBtns = await page.$$eval("#dive-zones button", (els) =>
  els.map((e) => ({
    zone: e.dataset.zone,
    name: e.querySelector("b").textContent,
    line: e.querySelector("span").textContent,
    on: e.getAttribute("aria-pressed") === "true",
    poor: e.classList.contains("poor"),
  })),
);
check("海区面板列全 DIVE_ZONES", zoneBtns.map((z) => z.zone).join(",") === Object.keys(DIVE_ZONES).join(","), zoneBtns.map((z) => z.name).join(","));
check("2 级船坞：沉船与沉没都市开着", zoneBtns.filter((z) => !z.poor).map((z) => z.zone).join(",") === "wreck,city");
check(
  "深渊海沟按 canDive 的原因上锁",
  zoneBtns.find((z) => z.zone === "trench")?.line === canDive(diver, "trench").reason,
  zoneBtns.find((z) => z.zone === "trench")?.line,
);
await page.click('[data-act="dive-zone"][data-zone="trench"]');
await page.waitForTimeout(300);
check("点锁着的海区会把理由说出来", (await page.textContent("#toast")).includes(canDive(diver, "trench").reason), await page.textContent("#toast"));

await page.click('[data-act="dive-zone"][data-zone="city"]');
await page.waitForTimeout(300);
check("选中的海区有勾选态", (await page.getAttribute('[data-act="dive-zone"][data-zone="city"]', "aria-pressed")) === "true");
check("海区文案换成沉没都市", (await page.textContent("#dive-hint")).includes(DIVE_ZONES.city.flavor), await page.textContent("#dive-hint"));
await page.screenshot({ path: `${OUT}/32_dive_zones.png` });

await page.click("#dive-start");
await page.waitForTimeout(500);
check("正在潜的海区就是选的那片", (await page.textContent("#dive-zone-note")).includes("正在潜：沉没都市"), await page.textContent("#dive-zone-note"));
// 沉没都市氧气 90 + 船坞每级 +12 → 2 级船坞 102：会话按海区表生成，不是写死的 100。
const o2 = await page.textContent("#dive-o2 em");
check("氧气上限按海区表 + 船坞等级算", o2.endsWith("/ 102"), o2);
check("海区按钮在潜水期间锁住", await page.isDisabled('[data-act="dive-zone"][data-zone="wreck"]'));
await page.screenshot({ path: `${OUT}/33_dive_city.png` });
check("第二段无 JS 报错", errors.length === 0, errors.slice(0, 3).join(" | "));
await context.close();

/* ══════════════ 三、海啸：进行中的钓与潜，天气说了算 ══════════════ */
const { save: storm, tick: stormTick } = tsunamiSave({ atTick: 80 });
({ context, page, errors } = await openWith(storm));
await page.keyboard.press("f");
await page.waitForTimeout(250);
await page.click("#fish-cast");
await page.waitForTimeout(200);
check("海啸场：先在晴天抛一竿", (await readBar(page)).shown);
await page.keyboard.press("v");
await page.waitForTimeout(250);
await page.click("#dive-start");
await page.waitForTimeout(300);
check("海啸场：再下一次潜", (await page.textContent("#dive-o2 em")).startsWith("氧气 "), await page.textContent("#dive-o2 em"));

// 天气由 (seed, tick) 决定，seed 已经筛过：第 stormTick 个量子准点转海啸。
await page.waitForSelector('html[data-weather="tsunami"]', { timeout: 20000 });
await page.waitForTimeout(400);
check(`第 ${stormTick} 量子如期转海啸`, (await page.getAttribute("html", "data-weather")) === "tsunami");
const surfaceToast = await page.textContent("#toast");
check("潜水被天气拽上来（advanceDive 的强制分支）", surfaceToast.includes("紧急上浮"), surfaceToast);
check("会话真的结束了", (await page.textContent("#dive-o2 em")) === "氧气 —— 未下潜", await page.textContent("#dive-o2 em"));
const stormAlert = await page.textContent("#fish-alert");
check("钓鱼提示条改口：这杆钓不成了", stormAlert.includes("钓不成了"), stormAlert);
await page.screenshot({ path: `${OUT}/34_tsunami_forced.png` });

await page.click('[data-act="fish-back"]');
await page.waitForTimeout(400);
check("海啸下钓鱼屏的提示是红的", (await page.getAttribute("#fish-hint", "class")).includes("bad"), await page.textContent("#fish-hint"));
await page.click("#fish-hook");
await page.waitForTimeout(300);
check("收杆走 hookCast 的强制分支", (await page.textContent("#fish-catch")).includes("天气强制收杆，不算空军"), await page.textContent("#fish-catch"));
check("强制收杆不算空军也不记图鉴", (await page.textContent("#fish-dex-btn")) === `图鉴 0/${FISH.length}`, await page.textContent("#fish-dex-btn"));
check("海啸期间抛不了新竿", await page.isDisabled("#fish-cast"));
check("按钮旁边写清为什么抛不了", (await page.textContent("#fish-hint")).includes("没鱼咬钩"), await page.textContent("#fish-hint"));
await page.screenshot({ path: `${OUT}/35_tsunami_reel.png` });
check("第三段无 JS 报错", errors.length === 0, errors.slice(0, 3).join(" | "));
await context.close();

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
if (failed.length) process.exit(1);
