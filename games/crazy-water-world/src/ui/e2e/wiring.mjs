// Round 2 接线走查：把「已实现但玩家看不见」的四条线逐条按到 DOM 上验。
//   1) 出战阵容 = heroes/lineup.js 的 selectLineup（不是 heroes.slice(0,5)），可勾选、分前后排
//   2) 结算走 combat 的 battleSeed（重试盐）+ heroes 的 applyBattleInjuries（伤员不可出战）
//   3) 关卡首通奖励里的升星碎片真进仓库
//   4) 减弱动态显式开关 / 指引横幅 sticky / 战报播完收起「跳过」/ 潜水切屏警告
//   5) 呼救名单拆「可招募 / 已在船」
import { chromium } from "playwright-core";
import { veteranSave } from "./seed.mjs";
import { selectLineup } from "../../heroes/index.js";
import { battleSeed } from "../../combat/index.js";
import { HEROES } from "../../data/heroes.js";

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
  await page.waitForTimeout(700);
  await page.click("#resume");
  await page.waitForTimeout(600);
  return { context, page, errors };
}

const names = (units) => units.map((u) => HEROES[u.heroKey].name);

/* ══════════════════ 一、六人队：阵容取舍 / 重试盐 / 伤病 ══════════════════ */
const weak = veteranSave({ bestStage: 19, stars: 1 });
const autoLineup = selectLineup(weak, 5);
const rosterFive = weak.heroes.slice(0, 5).map((x) => HEROES[x.heroKey].name);
let { context, page, errors } = await openWith(weak);

await page.keyboard.press("c");
await page.waitForTimeout(400);

const teamText = await page.textContent("#camp-team");
const domOrder = [...teamText.matchAll(/\d+\.([^\s★]+)★/g)].map((m) => m[1]);
check("出战阵容与 selectLineup 逐位一致", domOrder.join(",") === names(autoLineup).join(","), `${domOrder.join(",")} vs ${names(autoLineup).join(",")}`);
check(
  "不是 heroes.slice(0,5)：战力最低的米娅被留在板凳上",
  rosterFive.includes("米娅") && !domOrder.includes("米娅"),
  `名单前五=${rosterFive.join(",")} 出战=${domOrder.join(",")}`,
);
check("阵容计数写清前后排", /5\/5 人 · 前排 3 \/ 后排 2/.test(await page.textContent("#camp-team-count")), await page.textContent("#camp-team-count"));
const laneTags = await page.$$eval(".cww-lane-tag", (els) => els.map((e) => e.textContent));
check("前后排分栏可见", laneTags.some((t) => t.includes("前排")) && laneTags.some((t) => t.includes("后排")), laneTags.join(" | "));
check("入选的人有勾选态", (await page.getAttribute('[data-act="pick"][data-id="h-rambo"]', "aria-pressed")) === "true");
check("板凳上的人未勾选", (await page.getAttribute('[data-act="pick"][data-id="h-mia"]', "aria-pressed")) === "false");
await page.screenshot({ path: `${OUT}/20_lineup_auto.png` });

// 勾选：下一个人 → 补一个人 → 超编被拦
await page.click('[data-act="pick"][data-id="h-yilong"]');
await page.waitForTimeout(250);
check("点掉一位就下场", (await page.textContent("#camp-team-count")).startsWith("4/5") && !(await page.textContent("#camp-team")).includes("一龙"), await page.textContent("#camp-team-count"));
await page.click('[data-act="pick"][data-id="h-mia"]');
await page.waitForTimeout(250);
check("点板凳上的人能顶上来", (await page.textContent("#camp-team-count")).startsWith("5/5") && (await page.textContent("#camp-team")).includes("米娅"), await page.textContent("#camp-team"));
await page.click('[data-act="pick"][data-id="h-yilong"]');
await page.waitForTimeout(250);
check("超过 5 人被拦下并给话", (await page.textContent("#toast")).includes("最多 5 个人"), await page.textContent("#toast"));
await page.screenshot({ path: `${OUT}/21_lineup_manual.png` });

await page.click('[data-act="lineup-auto"]');
await page.waitForTimeout(250);
check("自动配队按钮回到 selectLineup 结果", [...(await page.textContent("#camp-team")).matchAll(/\d+\.([^\s★]+)★/g)].map((m) => m[1]).join(",") === names(autoLineup).join(","));

// 重试盐：出战前后的战斗种子必须变，且等于 combat.battleSeed 的算法
const seedBefore = await page.textContent("#camp-seed");
check("战斗种子来自 combat.battleSeed", seedBefore.includes(String(battleSeed(weak, 20))) && seedBefore.includes("首次挑战"), seedBefore);

await page.click("#camp-fight");
await page.waitForTimeout(900);
check("战报横幅报了败仗", (await page.textContent("#camp-banner")).includes("失守"), await page.textContent("#camp-banner"));
const seedAfter = await page.textContent("#camp-seed");
const expectRetry = battleSeed({ ...weak, campaign: { ...weak.campaign, attempts: 1 } }, 20);
check("重试盐生效：第 2 次尝试换了种子", seedAfter.includes("第 2 次尝试") && seedAfter.includes(String(expectRetry)) && seedAfter !== seedBefore, `${seedBefore} → ${seedAfter}`);

const hurtTags = await page.$$(".cww-lane.hurt .cww-pickhero");
check("阵亡的人进了「养伤中」分栏", hurtTags.length === 5, `${hurtTags.length} 人`);
check("伤员按钮点不动", await page.isDisabled(".cww-lane.hurt .cww-pickhero"));
check("伤员有养伤倒计时", /还要养 \d+ 秒/.test(await page.textContent(".cww-lane.hurt .cww-pickhero i")), await page.textContent(".cww-lane.hurt .cww-pickhero i"));
check("阵容只剩没上场的米娅", (await page.textContent("#camp-team-count")).startsWith("1/5"), await page.textContent("#camp-team-count"));
await page.screenshot({ path: `${OUT}/22_injuries.png` });

if (await page.isVisible("#camp-skip")) await page.click("#camp-skip");
await page.waitForTimeout(300);
check("战报播完「跳过」自己收起来", !(await page.isVisible("#camp-skip")));

// 英雄屏：名单拆两栏 + 伤病写在卡片上
await page.keyboard.press("h");
await page.waitForTimeout(400);
check("呼救名单标题写「可招募 N」", (await page.textContent("#hero-pool-title")).startsWith("可招募"), await page.textContent("#hero-pool-title"));
check("已在船单独一栏且人数对得上", (await page.textContent("#hero-aboard-title")) === "已在船 6", await page.textContent("#hero-aboard-title"));
check("可招募区里不再混「已在船上」按钮", !(await page.textContent("#hero-pool")).includes("已在船上"));
check("可招募人数 = 名单总数 − 在船", (await page.$$("#hero-pool [data-act=\"recruit\"]")).length === Object.keys(HEROES).length - 6);
check("英雄卡上挂了养伤标记", (await page.textContent("#hero-roster")).includes("养伤"), (await page.textContent("#hero-roster")).slice(0, 60));
check("养伤的人不能委任", await page.isDisabled('[data-assign="h-rambo"]'));
await page.evaluate(() => {
  const left = document.querySelector("#left");
  const title = document.querySelector("#hero-aboard-title");
  left.scrollTop += title.getBoundingClientRect().top - left.getBoundingClientRect().top - 210;
});
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/23_recruit_split.png` });

// 指引横幅 sticky：把左面板滚下去，横幅还钉在顶上
const stickyProbe = await page.evaluate(async () => {
  const left = document.querySelector("#left");
  const goal = document.querySelector("#goal");
  const before = goal.getBoundingClientRect().top;
  left.scrollTop = 400;
  await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => requestAnimationFrame(r));
  return {
    scrolled: left.scrollTop,
    before,
    after: goal.getBoundingClientRect().top,
    position: getComputedStyle(document.querySelector("#sticky")).position,
    panelTop: left.getBoundingClientRect().top,
  };
});
check("指引横幅是 sticky", stickyProbe.position === "sticky", stickyProbe.position);
check("左面板滚动后指引横幅仍钉在顶部", stickyProbe.scrolled > 100 && Math.abs(stickyProbe.after - stickyProbe.before) < 4, JSON.stringify(stickyProbe));
await page.screenshot({ path: `${OUT}/24_sticky_goal.png` });

// 减弱动态：按钮上直接写状态，刷新后还认这个选择
check("动效开关默认写着「全开」", (await page.textContent("#btn-motion")) === "动效 全开", await page.textContent("#btn-motion"));
await page.click("#btn-motion");
await page.waitForTimeout(250);
check("按一下变「减弱」并落 aria-pressed", (await page.textContent("#btn-motion")) === "动效 减弱" && (await page.getAttribute("#btn-motion", "aria-pressed")) === "true");
check("减弱动态钩子落到 html", (await page.getAttribute("html", "data-reduce-motion")) === "on");
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.click("#resume");
await page.waitForTimeout(500);
check("刷新后仍记得老大按过的开关", (await page.textContent("#btn-motion")) === "动效 减弱", await page.textContent("#btn-motion"));
await page.click("#btn-motion");
await page.waitForTimeout(200);

// 潜水切屏：氧气继续扣，别的屏挂警告条
await page.keyboard.press("v");
await page.waitForTimeout(300);
await page.click("#dive-start");
await page.waitForTimeout(500);
const o2Dive = Number((await page.textContent("#dive-o2 em")).match(/(\d+)/)[1]);
await page.keyboard.press("h");
await page.waitForTimeout(1400);
const alertText = await page.textContent("#dive-alert");
check("切屏后挂出潜水警告条", await page.isVisible("#dive-alert"), alertText);
check("警告条明说氧气还在扣", alertText.includes("氧气还在扣"), alertText);
const o2Away = Number(alertText.match(/氧气 (\d+)%/)[1]);
check("离开潜水屏氧气确实还在掉", o2Away < o2Dive, `${o2Dive}% → ${o2Away}%`);
await page.screenshot({ path: `${OUT}/25_dive_alert.png` });
await page.click('[data-act="dive-back"]');
await page.waitForTimeout(400);
check("「回水里」跳回潜水屏", (await page.getAttribute("html", "data-view")) === "dive");
check("回来后警告条收起", !(await page.isVisible("#dive-alert")));
check("第一段无 JS 报错", errors.length === 0, errors.slice(0, 3).join(" | "));
await context.close();

/* ══════════════════ 二、Boss 首通：碎片真进仓库 ══════════════════ */
const strong = veteranSave({ bestStage: 4, stars: 5 });
({ context, page, errors } = await openWith(strong));
await page.keyboard.press("c");
await page.waitForTimeout(400);
const reward = await page.textContent("#camp-reward");
check("战前摊开首通奖励含升星碎片", reward.includes("碎片×10"), reward);
const shardBefore = Number((await page.textContent("#bag-shard")).match(/(\d+)/)[1]);
await page.screenshot({ path: `${OUT}/26_boss_reward.png` });

await page.click("#camp-fight");
await page.waitForTimeout(1200);
check("Boss 关拿下", (await page.textContent("#camp-banner")).includes("拿下"), await page.textContent("#camp-banner"));
const shardAfter = Number((await page.textContent("#bag-shard")).match(/(\d+)/)[1]);
check("首通碎片进了仓库", shardAfter === shardBefore + 10, `${shardBefore} → ${shardAfter}`);
check("手账写明碎片到账", (await page.textContent(".log")).includes("碎片×10"), (await page.textContent(".log")).slice(0, 80));
await page.screenshot({ path: `${OUT}/27_boss_shard.png` });
check("第二段无 JS 报错", errors.length === 0, errors.slice(0, 3).join(" | "));
await context.close();

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
if (failed.length) process.exit(1);
