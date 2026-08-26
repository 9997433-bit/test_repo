import { setText } from "../ui/dom.js";
import { sfx } from "../core/audio.js";
import { payouts } from "./payouts.js";
import { createDisposer, createLoop, grantReward, viewCtx } from "./runtime.js";
import { ensureStyles, panelShell, statBlock, setStat, floatText, shake, setBar } from "./ui.js";

const GOOD = ["🍎", "🥦", "🐟", "🍓", "🧀", "🍇"];
const BAD = ["🪰", "🥀"];

const ITEM = 34;
const BASKET_W = 76;
const BASKET_H = 24;
const BASKET_BOTTOM = 8;
const HUD_MS = 0.1;

export function freshPayout({ good = 0, bestCombo = 0 }, table = payouts("fresh")) {
  const bonus = 1 + Math.min(Math.max(0, bestCombo) * table.comboBonus, table.comboBonusMax);
  const gold = Math.max(0, Math.round(good * table.goldPerGood * bonus));
  const xp = good > 0 ? Math.max(1, Math.round(good * table.xpPerGood)) : 0;
  return { gold, xp, bonus };
}

function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

export function renderFresh(root, state, back, ctx) {
  ensureStyles();
  const table = payouts("fresh");
  const view = viewCtx(state, back, ctx);
  const d = createDisposer();

  root.innerHTML = `
    <section class="panel mg-panel">
      ${panelShell("晨光生鲜 · 抢收", "拖动或按 ← → 移动竹筐接住当季货。漏接和接到变质品都掉口碑，口碑掉光当场收摊。", "返回")}
      ${statBlock([
        { id: "time", label: "剩余秒", value: String(table.roundSeconds) },
        { id: "good", label: "接到", value: "0" },
        { id: "combo", label: "连接", value: "0" },
        { id: "life", label: "口碑", value: "●".repeat(table.lives) },
      ])}
      <div class="mg-bar" data-clock aria-hidden="true"><i></i></div>
      <div class="mg-stage" data-stage tabindex="0" role="application" aria-label="接货台：左右方向键移动竹筐">
        <div class="mg-basket" data-basket><i></i></div>
      </div>
      <div class="mg-fx" data-fx></div>
      <p class="mg-note" data-note></p>
    </section>`;

  const stage = root.querySelector("[data-stage]");
  const basket = root.querySelector("[data-basket]");
  const clock = root.querySelector("[data-clock]");
  const fx = root.querySelector("[data-fx]");
  const note = root.querySelector("[data-note]");
  root.querySelector("[data-back]").onclick = () => view.back();

  let width = stage.clientWidth || 360;
  let height = stage.clientHeight || 210;
  let items = [];
  let bx = width / 2;
  let tx = width / 2;
  let timeLeft = table.roundSeconds;
  let spawnAcc = 0;
  let hudAcc = 0;
  let good = 0;
  let combo = 0;
  let bestCombo = 0;
  let rotten = 0;
  let missed = 0;
  let lives = table.lives;
  let over = true;

  const measure = () => {
    width = stage.clientWidth || width;
    height = stage.clientHeight || height;
  };
  d.on(window, "resize", measure);

  function paint() {
    const pay = freshPayout({ good, bestCombo }, table);
    setStat(root, "time", Math.ceil(Math.max(0, timeLeft)), timeLeft <= 5 ? "cold" : "");
    setStat(root, "good", good);
    setStat(root, "combo", combo, combo >= 5 ? "hot" : "");
    setStat(
      root,
      "life",
      `${"●".repeat(Math.max(0, lives))}${"○".repeat(Math.max(0, table.lives - lives))}`,
      lives <= 1 ? "cold" : "",
    );
    setText(
      note,
      `每件 ${table.goldPerGood} 金，连接越长收货价越高（当前 ×${pay.bonus.toFixed(2)}）· 变质 ${rotten} 次 · 漏接 ${missed} 次 · 现价 ${pay.gold} 金`,
    );
  }

  function moveTo(px) {
    tx = Math.max(BASKET_W / 2, Math.min(width - BASKET_W / 2, px));
  }

  function spawn() {
    const bad = Math.random() < table.rottenRate;
    const node = document.createElement("div");
    node.className = "mg-item";
    node.textContent = bad
      ? BAD[Math.floor(Math.random() * BAD.length)]
      : GOOD[Math.floor(Math.random() * GOOD.length)];
    stage.append(node);
    const progress = 1 - timeLeft / table.roundSeconds;
    items.push({
      node,
      bad,
      x: Math.random() * Math.max(0, width - ITEM),
      y: -ITEM,
      vy: lerp(table.fallStart, table.fallEnd, progress) * (0.9 + Math.random() * 0.25),
    });
  }

  function loseLife(reason, x) {
    lives -= 1;
    combo = 0;
    shake(stage, d);
    sfx.beep?.(170, 0.14, "sawtooth", 0.035);
    floatText(fx, reason, "bad", d, (x / Math.max(1, width)) * 100);
    if (lives <= 0) finish("口碑掉光，今天提前收摊");
  }

  function catchItem(item) {
    if (item.bad) {
      rotten += 1;
      loseLife("变质品！口碑 -1", item.x);
      return;
    }
    good += 1;
    combo += 1;
    bestCombo = Math.max(bestCombo, combo);
    sfx.tap();
    if (combo % 5 === 0) sfx.coin();
    floatText(fx, combo >= 5 ? `+1 连接 ${combo}` : "+1", "good", d, (item.x / Math.max(1, width)) * 100);
    basket.classList.remove("catching");
    void basket.offsetWidth;
    basket.classList.add("catching");
  }

  function step(dt) {
    if (over) return;
    timeLeft -= dt;
    spawnAcc += dt * 1000;
    hudAcc += dt;

    const progress = 1 - timeLeft / table.roundSeconds;
    const spawnEvery = lerp(table.spawnStartMs, table.spawnEndMs, progress);
    if (spawnAcc >= spawnEvery) {
      spawnAcc -= spawnEvery;
      spawn();
    }

    bx += (tx - bx) * Math.min(1, dt * table.basketSpeed);
    basket.style.transform = `translateX(${bx - BASKET_W / 2}px)`;

    const basketTop = height - BASKET_BOTTOM - BASKET_H;
    const kept = [];
    for (const item of items) {
      if (over) break;
      item.y += item.vy * dt;
      const cx = item.x + ITEM / 2;
      if (
        item.y + ITEM >= basketTop &&
        item.y <= height - BASKET_BOTTOM &&
        Math.abs(cx - bx) <= table.catchRadius
      ) {
        item.node.remove();
        catchItem(item);
        continue;
      }
      if (item.y > height) {
        item.node.remove();
        if (!item.bad) {
          missed += 1;
          loseLife("漏了一件", item.x);
        }
        continue;
      }
      item.node.style.transform = `translate3d(${item.x}px, ${item.y}px, 0)`;
      kept.push(item);
    }
    if (over) return;
    items = kept;

    setBar(clock, Math.max(0, timeLeft) / table.roundSeconds, timeLeft <= 5);
    if (hudAcc >= HUD_MS) {
      hudAcc = 0;
      paint();
    }
    if (timeLeft <= 0) finish("时间到，收摊上架");
  }

  const loop = createLoop(d, step);

  function clearItems() {
    for (const item of items) item.node.remove();
    items = [];
  }

  function finish(reason) {
    if (over) return;
    over = true;
    loop.stop();
    clearItems();
    setBar(clock, 0, true);
    paint();

    const pay = freshPayout({ good, bestCombo }, table);
    if (pay.gold || pay.xp) {
      grantReward(state, { gold: pay.gold, xp: pay.xp });
      view.save();
      sfx.coin();
    }
    view.toast(`${reason}：上架 ${good} 件，+${pay.gold} 金`);

    const sheet = document.createElement("div");
    sheet.className = "mg-over";
    sheet.innerHTML = `
      <div>${reason}</div>
      <strong>+${pay.gold} 金</strong>
      <div class="mg-note">接到 ${good} 件 · 最长连接 ${bestCombo}（收货价 ×${pay.bonus.toFixed(2)}）· 变质 ${rotten} · 漏接 ${missed} · 阅历 +${pay.xp}</div>
      <div class="mg-actions">
        <button class="btn" type="button" data-again>再抢一轮</button>
        <button class="btn ghost" type="button" data-leave>返回商场</button>
      </div>`;
    stage.append(sheet);
    sheet.querySelector("[data-again]").onclick = () => start();
    sheet.querySelector("[data-leave]").onclick = () => view.back();
    sheet.querySelector("[data-again]").focus({ preventScroll: true });
  }

  function start() {
    clearItems();
    stage.querySelector(".mg-over")?.remove();
    measure();
    timeLeft = table.roundSeconds;
    spawnAcc = 0;
    hudAcc = 0;
    good = 0;
    combo = 0;
    bestCombo = 0;
    rotten = 0;
    missed = 0;
    lives = table.lives;
    over = false;
    bx = width / 2;
    tx = width / 2;
    basket.style.transform = `translateX(${bx - BASKET_W / 2}px)`;
    setBar(clock, 1, false);
    paint();
    loop.start();
  }

  d.on(stage, "pointerdown", (e) => {
    stage.setPointerCapture?.(e.pointerId);
    moveTo(e.clientX - stage.getBoundingClientRect().left);
  });
  d.on(stage, "pointermove", (e) => {
    if (e.pointerType === "touch" && e.pressure === 0) return;
    moveTo(e.clientX - stage.getBoundingClientRect().left);
  });
  d.on(document, "keydown", (e) => {
    if (over) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    moveTo(tx + ((e.key === "ArrowLeft" ? -1 : 1) * width * table.keyStep) / 100);
  });

  start();
  root._cleanup = () => {
    loop.stop();
    clearItems();
    d.dispose();
  };
  return root._cleanup;
}
