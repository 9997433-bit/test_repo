import { setText } from "../ui/dom.js";
import { sfx } from "../core/audio.js";
import { payouts } from "./payouts.js";
import { createDisposer, chargeFee, grantReward, viewCtx } from "./runtime.js";
import { ensureStyles, panelShell, statBlock, setStat, floatText } from "./ui.js";

const OMENS = [
  { id: "daji", name: "大吉", icon: "🌟", bless: true },
  { id: "taohua", name: "桃花", icon: "🌸", bless: true },
  { id: "piancai", name: "偏财", icon: "🪙", bless: true },
  { id: "qiyu", name: "奇遇", icon: "🗝️", bless: true },
  { id: "pingwen", name: "平稳", icon: "☁️", bless: false },
  { id: "xiaoxiong", name: "小凶", icon: "🌧️", bless: false },
];

const READINGS = [
  "三格皆浊，星语说今天宜守不宜攻",
  "一线吉光，客流小涨",
  "双吉临门，橱窗前开始排队",
  "三吉齐现，整层楼的人都往这边走",
];

export { OMENS };

export function spinOmens(rand = Math.random, omens = OMENS) {
  return [0, 1, 2].map(() => omens[Math.floor(rand() * omens.length)]);
}

/** 结果与碎片规则：金币看吉兆数量，碎片只来自「三格全吉」与「三格同象」。 */
export function fortuneResult(picks, table = payouts("fortune")) {
  const bless = picks.filter((o) => o.bless).length;
  const triple = picks.length > 0 && picks.every((o) => o.id === picks[0].id);
  const allBless = bless === picks.length;
  const gold = Number(table.goldByBless[bless]) || 0;
  const shards = (allBless ? table.shardAllBless : 0) + (triple ? table.shardTriple : 0);
  return {
    bless,
    triple,
    allBless,
    gold,
    shards,
    xp: table.xp,
    reading: READINGS[Math.min(bless, READINGS.length - 1)],
  };
}

/** 枚举 6³ 全空间算期望，供 UI 公示与期望值自检（必须低于香火钱）。 */
export function expectedSpin(table = payouts("fortune"), omens = OMENS) {
  let gold = 0;
  let shards = 0;
  let count = 0;
  for (const a of omens) {
    for (const b of omens) {
      for (const c of omens) {
        const r = fortuneResult([a, b, c], table);
        gold += r.gold;
        shards += r.shards;
        count += 1;
      }
    }
  }
  return { gold: gold / count, shards: shards / count };
}

export function renderFortune(root, state, back, ctx) {
  ensureStyles();
  const table = payouts("fortune");
  const view = viewCtx(state, back, ctx);
  const d = createDisposer();
  const ev = expectedSpin(table);

  let spinning = false;
  let ticker = null;
  let spins = 0;
  let spent = 0;
  let backGold = 0;
  let shards = 0;

  const goldRule = table.goldByBless
    .map((gold, i) => `<tr><td>${i} 个吉兆</td><td class="num">${gold} 金</td></tr>`)
    .join("");

  root.innerHTML = `
    <section class="panel mg-panel">
      ${panelShell("星语占卜 · 三星盘", `一次香火钱 ${table.cost} 金。三格星象定吉凶，碎片只认两条硬规则。`, "返回")}
      ${statBlock([
        { id: "spins", label: "本次起盘", value: "0" },
        { id: "bless", label: "上次吉兆", value: "—" },
        { id: "shard", label: "到手碎片", value: "0" },
        { id: "net", label: "金币收支", value: "0" },
      ])}
      <div class="mg-wheel" data-wheel role="img" aria-label="三格星盘">
        ${[0, 1, 2]
          .map(
            (i) =>
              `<div class="mg-slot plain" data-slot="${i}"><span class="icon">🔮</span><span class="name">待起盘</span></div>`,
          )
          .join("")}
      </div>
      <div class="mg-fx" data-fx></div>
      <div class="mg-banner calm" data-reading>吉兆：${OMENS.filter((o) => o.bless).map((o) => o.icon + o.name).join(" ")} ／ 非吉兆：${OMENS.filter((o) => !o.bless).map((o) => o.icon + o.name).join(" ")}</div>
      <div class="mg-actions"><button class="btn" type="button" data-spin>起盘 · ${table.cost} 金</button></div>
      <table class="mg-odds">
        <thead><tr><th>金币结算</th><th class="num">回礼</th></tr></thead>
        <tbody>${goldRule}</tbody>
      </table>
      <p class="mg-note">
        <b>碎片规则</b>：三格全是吉兆 → 碎片 +${table.shardAllBless}；三格同一星象 → 再 +${table.shardTriple}（两条可叠加，最高 ${table.shardAllBless + table.shardTriple} 片）。其余情况没有碎片。
      </p>
      <p class="mg-note" data-ev></p>
      <p class="mg-note" data-detail></p>
    </section>`;

  const slots = [...root.querySelectorAll("[data-slot]")];
  const reading = root.querySelector("[data-reading]");
  const detail = root.querySelector("[data-detail]");
  const fx = root.querySelector("[data-fx]");
  const spinBtn = root.querySelector("[data-spin]");
  root.querySelector("[data-back]").onclick = () => view.back();

  setText(
    root.querySelector("[data-ev]"),
    `期望公示：每次起盘平均回礼 ${ev.gold.toFixed(1)} 金（低于 ${table.cost} 金香火）+ ${ev.shards.toFixed(2)} 碎片。占卜是碎片来源，不是金币来源。`,
  );
  setText(detail, "碎片来源会在每次结果里逐条列出。");

  function paintSlot(i, omen, mode) {
    const node = slots[i];
    node.className = `mg-slot ${mode === "spin" ? "spinning" : omen.bless ? "bless" : "plain"}`;
    setText(node.querySelector(".icon"), omen.icon);
    setText(node.querySelector(".name"), omen.name);
  }

  function paintHud(result) {
    setStat(root, "spins", spins);
    setStat(root, "bless", result ? `${result.bless}/3` : "—", result && result.allBless ? "hot" : "");
    setStat(root, "shard", shards, shards > 0 ? "hot" : "");
    const net = backGold - spent;
    setStat(root, "net", net > 0 ? `+${net}` : String(net), net < 0 ? "cold" : "");
  }

  function settle(picks) {
    d.clearTimer(ticker);
    ticker = null;
    const result = fortuneResult(picks, table);
    spins += 1;
    backGold += result.gold;
    shards += result.shards;
    grantReward(state, { gold: result.gold, xp: result.xp, shards: result.shards });
    view.save();

    picks.forEach((omen, i) => paintSlot(i, omen, "stop"));
    reading.className = `mg-banner ${result.shards ? "" : "calm"}`;
    setText(
      reading,
      `${picks.map((o) => o.name).join(" · ")} — ${result.reading}${result.triple ? "（三同象！）" : ""}`,
    );

    const sources = [];
    if (result.allBless) sources.push(`三格全吉 +${table.shardAllBless} 碎片`);
    if (result.triple) sources.push(`三格同象 +${table.shardTriple} 碎片`);
    setText(
      detail,
      `本次：${result.bless} 个吉兆 → 回礼 ${result.gold} 金 · 阅历 +${result.xp} · ${
        sources.length ? `碎片 ${sources.join(" ＋ ")}` : "碎片 0（需三格全吉或三格同象）"
      }`,
    );

    if (result.shards) {
      sfx.rare();
      floatText(fx, `碎片 +${result.shards}`, "good", d, 50);
    } else {
      sfx.win();
      floatText(fx, `+${result.gold} 金`, "gold", d, 50);
    }
    view.toast(
      `${picks.map((o) => o.name).join("·")} → ${result.gold} 金${result.shards ? ` · 碎片 +${result.shards}` : ""}`,
    );
    paintHud(result);
    spinning = false;
    spinBtn.disabled = false;
    setText(spinBtn, `再起一盘 · ${table.cost} 金`);
  }

  function spin() {
    if (spinning) return;
    const paid = chargeFee(state, table.cost, "香火钱不够，先去店里转两圈");
    if (!paid.ok) {
      sfx.beep?.(160, 0.12, "sawtooth", 0.03);
      view.toast(paid.toast);
      return;
    }
    spinning = true;
    spent += table.cost;
    spinBtn.disabled = true;
    setText(spinBtn, "星盘转动中…");
    setText(detail, "星盘转动中，三格会依次定住。");
    reading.className = "mg-banner calm";
    setText(reading, "星语正在排布三格…");

    const picks = spinOmens();
    const stopped = [false, false, false];
    let frame = 0;

    ticker = d.interval(() => {
      frame += 1;
      slots.forEach((_, i) => {
        if (stopped[i]) return;
        paintSlot(i, OMENS[(frame + i * 2) % OMENS.length], "spin");
      });
    }, table.tickMs);

    table.stopMs.forEach((ms, i) => {
      d.timeout(() => {
        stopped[i] = true;
        paintSlot(i, picks[i], "stop");
        sfx.tap();
        if (i === slots.length - 1) settle(picks);
      }, ms);
    });
  }

  spinBtn.onclick = spin;
  paintHud(null);

  root._cleanup = () => d.dispose();
  return root._cleanup;
}
