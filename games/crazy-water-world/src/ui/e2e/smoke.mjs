// UI 冒烟：真实浏览器跑一遍启航→拾荒→建造→钓鱼→潜水→英雄→关卡。
import { chromium } from "playwright-core";
import { seaLayout, flotsamPoint } from "../../world/canvas.js";
import { richSave } from "./seed.mjs";

const URL = process.env.CWW_URL || "http://localhost:4174/";
const OUT = process.env.OUT || "/tmp/cww-e2e/shots";
const save = richSave();

const results = [];
const check = (name, cond, extra = "") => {
  results.push({ name, pass: !!cond, extra });
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${extra ? ` — ${extra}` : ""}`);
};

async function flotsamXY(page, id) {
  const box = await page.$eval("#sea", (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, w: r.width, h: r.height };
  });
  const layout = seaLayout(save, box.w, box.h);
  const f = save.explore.salvage.flotsam.find((it) => it.id === id);
  const p = flotsamPoint(f, layout, 0);
  return { x: box.left + p.x, y: box.top + p.y };
}

async function cellXY(page, cx, cy) {
  const box = await page.$eval("#sea", (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, w: r.width, h: r.height };
  });
  const layout = seaLayout(save, box.w, box.h);
  return {
    x: box.left + layout.ox + cx * layout.cell + layout.cell / 2,
    y: box.top + layout.oy + cy * layout.cell + layout.cell / 2,
  };
}

const browser = await chromium.launch({
  executablePath: process.env.CHROME || "/usr/local/bin/google-chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 820 },
  deviceScaleFactor: 2,
  ...(process.env.VIDEO ? { recordVideo: { dir: process.env.VIDEO, size: { width: 1280, height: 820 } } } : {}),
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
await page.addInitScript((payload) => {
  localStorage.setItem("cww.save.v1", payload);
}, JSON.stringify(save));

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/01_title.png` });
check("标题页有存档摘要", (await page.textContent("#title-save")).includes("最佳"));

// ── 启航 ────────────────────────────────────────────────
await page.click("#resume");
await page.waitForTimeout(700);
check("进入游戏壳", await page.isVisible("#game"));
check("状态条有文字标签", (await page.textContent("#m-hunger")).includes("饱食"));
check("木筏面板可见", await page.isVisible("#raft-order"));
check("船坞高亮当前屏", (await page.getAttribute("#dock-raft", "class")).includes("active"));
check("天气钩子已落到 documentElement", !!(await page.getAttribute("html", "data-weather")));
check("昼夜钩子已落到 documentElement", !!(await page.getAttribute("html", "data-phase")));
await page.screenshot({ path: `${OUT}/02_raft.png` });

// ── 拾荒 ────────────────────────────────────────────────
const bagBefore = await page.textContent("#bag-blueprint");
const rare = await flotsamXY(page, "seed-2");
await page.mouse.click(rare.x, rare.y);
await page.waitForTimeout(400);
check("点稀有漂浮物有吐司", (await page.textContent("#toast")).includes("稀有"));
check("蓝图入袋", (await page.textContent("#bag-blueprint")) !== bagBefore, `${bagBefore} → ${await page.textContent("#bag-blueprint")}`);
await page.screenshot({ path: `${OUT}/03_salvage.png` });

// ── 建造预览 ────────────────────────────────────────────
await page.keyboard.press("b");
await page.waitForTimeout(300);
await page.click('[data-type="wall"]');
const free = await cellXY(page, 4, 3);
await page.mouse.move(free.x, free.y);
await page.waitForTimeout(200);
check("合法格显示绿色预览", (await page.$$(".cww-ghost-cell.ok")).length > 0);
await page.screenshot({ path: `${OUT}/04_build_ok.png` });

const busy = await cellXY(page, 0, 0);
await page.mouse.move(busy.x, busy.y);
await page.waitForTimeout(200);
check("占用格显示红色非法预览", (await page.$$(".cww-ghost-cell.bad")).length > 0);
check("非法预览带原因文案", (await page.textContent(".cww-ghost-label")).length > 0, await page.textContent(".cww-ghost-label"));
await page.screenshot({ path: `${OUT}/05_build_bad.png` });

await page.mouse.move(free.x, free.y);
await page.waitForTimeout(150);
await page.mouse.click(free.x, free.y);
await page.waitForTimeout(400);
check("点击落成建筑", (await page.textContent("#toast")).includes("落成"), await page.textContent("#toast"));

// ── 钓鱼节奏条 ──────────────────────────────────────────
await page.keyboard.press("f");
await page.waitForTimeout(300);
check("钓鱼屏可见", await page.isVisible("#fish-track"));
const beforeCast = await page.getAttribute("#fish-zone", "style");
await page.click("#fish-cast");
await page.waitForTimeout(120);
check("抛竿后出现窗口高亮区", (await page.getAttribute("#fish-zone", "style")) !== beforeCast);
check("面板不泄底窗口数字", !/\d+–\d+/.test(await page.textContent("#fish-hint")), await page.textContent("#fish-hint"));

// 指针必须在动：连采两帧位置
const p1 = await page.getAttribute("#fish-needle", "style");
await page.waitForTimeout(220);
const p2 = await page.getAttribute("#fish-needle", "style");
check("节奏条指针在扫动", p1 !== p2, `${p1} vs ${p2}`);

// 掐点收杆：轮询到指针进窗口再按（这正是玩家要做的事）
const hit = await page.evaluate(async () => {
  const zone = document.querySelector("#fish-zone");
  const needle = document.querySelector("#fish-needle");
  const a = parseFloat(zone.style.left);
  const w = parseFloat(zone.style.width);
  for (let i = 0; i < 600; i += 1) {
    const pos = parseFloat(needle.style.left);
    if (pos >= a + w * 0.35 && pos <= a + w * 0.65) {
      document.querySelector("#fish-hook").click();
      return pos;
    }
    await new Promise((r) => requestAnimationFrame(r));
  }
  return -1;
});
await page.waitForTimeout(350);
check("窗口内收杆命中", (await page.textContent("#fish-catch")).length > 0 && !(await page.textContent("#fish-catch")).includes("跑了"), `needle=${hit} catch=${await page.textContent("#fish-catch")}`);
await page.screenshot({ path: `${OUT}/06_fishing.png` });

// 滑杆不被重置：抛竿后等 1 秒，节奏条依然在跑（旧实现每帧重建会归零）
await page.click("#fish-cast");
await page.waitForTimeout(1000);
const still = await page.getAttribute("#fish-needle", "style");
await page.waitForTimeout(200);
check("一秒后指针仍在跑（面板没被重建）", still !== (await page.getAttribute("#fish-needle", "style")));
await page.click("#fish-hook");

// 面板重建审计：抛竿状态下空闲 2 秒，左面板不该有节点级重建（旧实现每帧重写 innerHTML）
await page.click("#fish-cast");
const churn = await page.evaluate(async () => {
  let count = 0;
  const obs = new MutationObserver((recs) => { count += recs.length; });
  obs.observe(document.querySelector("#left"), { childList: true, subtree: true });
  await new Promise((r) => setTimeout(r, 2000));
  obs.disconnect();
  return count;
});
check("空闲 2 秒左面板节点级重建 < 20 次", churn < 20, `${churn} 次 childList 变更（每帧重建量级应为数千）`);
await page.click("#fish-hook");
await page.waitForTimeout(200);

// ── 潜水 HUD ────────────────────────────────────────────
await page.keyboard.press("v");
await page.waitForTimeout(250);
await page.click("#dive-start");
await page.waitForTimeout(400);
check("潜水舞台出现", await page.isVisible("#dive-arena"));
check("氧气 HUD 有读数", (await page.textContent("#dive-o2 em")).includes("氧气"), await page.textContent("#dive-o2 em"));
const o2a = await page.textContent("#dive-o2 em");
// 用触控热区往下游一段，验证方向键热区 + 深度变化
await page.hover('[data-hold="pad-down"]');
await page.mouse.down();
await page.waitForTimeout(900);
await page.mouse.up();
await page.waitForTimeout(200);
const stat = await page.textContent("#dive-stat");
check("方向热区能下潜", /深度 ([1-9]\d*) 米/.test(stat), stat);
check("氧气在消耗", (await page.textContent("#dive-o2 em")) !== o2a, `${o2a} → ${await page.textContent("#dive-o2 em")}`);
await page.screenshot({ path: `${OUT}/07_dive.png` });
await page.hover('[data-hold="pad-up"]');
await page.mouse.down();
await page.waitForTimeout(1200);
await page.mouse.up();
await page.click("#dive-up");
await page.waitForTimeout(300);

// ── 英雄委任 ────────────────────────────────────────────
await page.keyboard.press("h");
await page.waitForTimeout(300);
check("默认英雄在船上", (await page.textContent("#hero-roster")).includes("米娅"));
await page.selectOption("[data-assign]", { index: 1 });
await page.waitForTimeout(350);
check("委任写回 state", (await page.textContent("#hero-roster")).includes("上班"), await page.$eval("#hero-roster", (e) => e.textContent.slice(0, 160)));
await page.click('[data-act="recruit"][data-key="sam"]');
await page.waitForTimeout(300);
check("广播站在场可招募第二人", (await page.textContent("#hero-roster")).includes("大嘴山姆"));
await page.click('[data-act="star"]');
await page.waitForTimeout(300);
check("升星消耗碎片", (await page.textContent("#toast")).includes("升星"), await page.textContent("#toast"));
await page.screenshot({ path: `${OUT}/08_heroes.png` });

// ── 关卡战报 ────────────────────────────────────────────
await page.keyboard.press("c");
await page.waitForTimeout(300);
await page.click("#camp-fight");
await page.waitForTimeout(600);
check("战报有内容", (await page.textContent("#camp-report")).length > 10);
check("战报横幅有结论", (await page.textContent("#camp-banner")).length > 0, await page.textContent("#camp-banner"));
if (await page.isEnabled("#camp-skip")) await page.click("#camp-skip");
await page.waitForTimeout(300);
check("残血名单出现", (await page.$$(".cww-hp")).length > 0);
await page.screenshot({ path: `${OUT}/09_campaign.png` });

// ── 全局 ────────────────────────────────────────────────
await page.keyboard.press("2");
await page.waitForTimeout(200);
check("键盘倍速生效", (await page.textContent("#m-world")).includes("2x"), await page.textContent("#m-world"));
await page.keyboard.press("m");
await page.waitForTimeout(200);
check("静音切换", (await page.textContent("#btn-mute")) === "🔇");
await page.keyboard.press("m");
await page.click('[data-act="motion"]');
await page.waitForTimeout(200);
check("减弱动态钩子", (await page.getAttribute("html", "data-reduce-motion")) === "on");
await page.click('[data-act="motion"]');
await page.keyboard.press("Escape");
await page.waitForTimeout(250);
check("Esc 回木筏", (await page.getAttribute("html", "data-view")) === "raft");

check("无 JS 报错", errors.length === 0, errors.slice(0, 3).join(" | "));

await page.waitForTimeout(400);
await context.close();
await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
if (failed.length) process.exit(1);
