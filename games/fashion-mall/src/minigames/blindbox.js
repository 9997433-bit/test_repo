import { setText } from "../ui/dom.js";
import { sfx } from "../core/audio.js";
import { payouts, pickWeighted, poolExpectation, chanceOf } from "./payouts.js";
import { createDisposer, chargeFee, grantReward, viewCtx } from "./runtime.js";
import { ensureStyles, panelShell, statBlock, setStat, floatText, setBar } from "./ui.js";

const REVEAL_MS = 620;
const KNOWN_TIERS = new Set(["sr", "ssr", "ur"]);

function isRare(item) {
  return (Number(item?.shard) || 0) > 0;
}

export function tierClass(item) {
  if (!item) return "";
  const id = String(item.id || "").toLowerCase();
  if (KNOWN_TIERS.has(id)) return `tier-${id}`;
  const shard = Number(item.shard) || 0;
  if (shard >= 5) return "tier-ur";
  if (shard >= 2) return "tier-ssr";
  if (shard >= 1) return "tier-sr";
  return "";
}

/** 单抽 + 保底：连续 pity 抽没出带碎片的档位就顶上最低稀有档。纯函数，Node 可断言。 */
export function drawBox(pity = 0, rand = Math.random, table = payouts("blindbox")) {
  const pool = table.pool;
  let item = pickWeighted(pool, rand);
  let forced = false;
  if (!isRare(item) && pity + 1 >= table.pity) {
    const floor = pool.find(isRare);
    if (floor) {
      item = floor;
      forced = true;
    }
  }
  return { item, forced, pity: isRare(item) ? 0 : pity + 1 };
}

export function drawRun(count, pity = 0, rand = Math.random, table = payouts("blindbox")) {
  const results = [];
  let carry = pity;
  let gold = 0;
  let shard = 0;
  for (let i = 0; i < count; i += 1) {
    const draw = drawBox(carry, rand, table);
    carry = draw.pity;
    gold += Number(draw.item.gold) || 0;
    shard += Number(draw.item.shard) || 0;
    results.push(draw);
  }
  return { results, pity: carry, gold, shard };
}

export function renderBlindbox(root, state, back, ctx) {
  ensureStyles();
  const table = payouts("blindbox");
  const view = viewCtx(state, back, ctx);
  const d = createDisposer();
  const ev = poolExpectation(table.pool);

  let pity = 0;
  let opened = 0;
  let spent = 0;
  let backGold = 0;
  let backShard = 0;
  let history = [];
  let busy = false;

  const odds = table.pool
    .map(
      (item) => `
      <tr>
        <td><span class="mg-tier ${tierClass(item)}">${item.tier}</span></td>
        <td>${item.icon || "🎁"} ${item.name}</td>
        <td class="num">${chanceOf(table.pool, item).toFixed(1)}%</td>
        <td class="num">${item.gold} 金${item.shard ? ` · 碎片 ${item.shard}` : ""}</td>
      </tr>`,
    )
    .join("");

  root.innerHTML = `
    <section class="panel mg-panel">
      ${panelShell("盲盒潮玩 · 拆盒台", `一盒 ${table.cost} 金。稀有度越高碎片越多，${table.pity} 盒内必出 SR 以上。`, "返回")}
      ${statBlock([
        { id: "opened", label: "本次拆盒", value: "0" },
        { id: "pity", label: "距保底", value: String(table.pity) },
        { id: "shard", label: "到手碎片", value: "0" },
        { id: "net", label: "金币收支", value: "0" },
      ])}
      <div class="mg-bar" data-pity aria-hidden="true"><i style="width:0%"></i></div>
      <div class="mg-fx" data-fx></div>
      <div class="mg-box" data-box>🎁</div>
      <div data-prize></div>
      <div class="mg-actions">
        <button class="btn gold" type="button" data-one>拆 1 盒 · ${table.cost} 金</button>
        <button class="btn ghost" type="button" data-bulk>连开 ${table.bulk} 盒 · ${table.cost * table.bulk} 金</button>
      </div>
      <p class="mg-note">最近手气：<span class="mg-dots" data-dots></span></p>
      <table class="mg-odds">
        <thead><tr><th>稀有度</th><th>内容</th><th class="num">概率</th><th class="num">产出</th></tr></thead>
        <tbody>${odds}</tbody>
      </table>
      <p class="mg-note" data-ev></p>
    </section>`;

  const box = root.querySelector("[data-box]");
  const prize = root.querySelector("[data-prize]");
  const fx = root.querySelector("[data-fx]");
  const dots = root.querySelector("[data-dots]");
  const pityBar = root.querySelector("[data-pity]");
  const oneBtn = root.querySelector("[data-one]");
  const bulkBtn = root.querySelector("[data-bulk]");
  root.querySelector("[data-back]").onclick = () => view.back();

  setText(
    root.querySelector("[data-ev]"),
    `期望回本：每盒平均回收 ${ev.gold.toFixed(1)} 金（低于 ${table.cost} 金票价）+ ${ev.shard.toFixed(2)} 碎片。盲盒不是提款机，碎片才是本体——招募一位伙伴要 3 片。`,
  );

  function paintHud() {
    setStat(root, "opened", opened);
    setStat(root, "pity", Math.max(0, table.pity - pity), table.pity - pity <= 3 ? "hot" : "");
    setStat(root, "shard", backShard, backShard > 0 ? "hot" : "");
    const net = backGold - spent;
    setStat(root, "net", net > 0 ? `+${net}` : String(net), net < 0 ? "cold" : "");
    setBar(pityBar, table.pity ? pity / table.pity : 0);
  }

  function paintHistory() {
    dots.innerHTML = history
      .slice(-12)
      .map((item) => `<span class="mg-dot ${tierClass(item)}" title="${item.tier} ${item.name}"></span>`)
      .join("");
  }

  function paintPrize(list) {
    const best = list.reduce((a, b) => ((b.item.shard || 0) >= (a.item.shard || 0) ? b : a));
    const lines = list
      .map(
        ({ item, forced }) =>
          `<li><span><span class="mg-tier ${tierClass(item)}">${item.tier}</span> ${item.icon || "🎁"} ${item.name}${forced ? "（保底）" : ""}</span><span class="num">+${item.gold} 金${item.shard ? ` · 碎片 ${item.shard}` : ""}</span></li>`,
      )
      .join("");
    const gold = list.reduce((s, r) => s + (Number(r.item.gold) || 0), 0);
    const shard = list.reduce((s, r) => s + (Number(r.item.shard) || 0), 0);
    prize.innerHTML = `
      <div class="mg-prize ${tierClass(best.item)}">
        <span class="mg-tier ${tierClass(best.item)}">最佳 ${best.item.tier}</span>
        <span class="name">${best.item.icon || "🎁"} ${best.item.name}</span>
        <span class="gain">本轮合计 +${gold} 金${shard ? ` · 碎片 +${shard}` : " · 没有碎片"}</span>
        ${list.length > 1 ? `<ul class="mg-list">${lines}</ul>` : ""}
      </div>`;
    setText(box, best.item.icon || (isRare(best.item) ? "✨" : "🎀"));
  }

  function open(count) {
    if (busy) return;
    const cost = table.cost * count;
    const paid = chargeFee(state, cost, `先去赚够 ${cost} 金再来拆`);
    if (!paid.ok) {
      sfx.beep?.(160, 0.12, "sawtooth", 0.03);
      view.toast(paid.toast);
      return;
    }
    busy = true;
    oneBtn.disabled = true;
    bulkBtn.disabled = true;
    spent += cost;
    prize.innerHTML = "";
    setText(box, "🎁");
    box.classList.remove("rolling");
    void box.offsetWidth;
    box.classList.add("rolling");
    sfx.tap();

    d.timeout(() => {
      const run = drawRun(count, pity, Math.random, table);
      pity = run.pity;
      opened += count;
      backGold += run.gold;
      backShard += run.shard;
      history = history.concat(run.results.map((r) => r.item));
      grantReward(state, { gold: run.gold, xp: table.xp * count, shards: run.shard });
      view.save();

      box.classList.remove("rolling");
      paintPrize(run.results);
      paintHud();
      paintHistory();
      const best = run.results.reduce((a, b) => ((b.item.shard || 0) >= (a.item.shard || 0) ? b : a));
      if ((best.item.shard || 0) >= 2) sfx.rare();
      else sfx.coin();
      floatText(fx, run.shard ? `碎片 +${run.shard}` : `+${run.gold} 金`, run.shard ? "good" : "gold", d, 50);
      view.toast(
        `${best.item.tier} ${best.item.name}${best.forced ? "（保底触发）" : ""} · 金币 +${run.gold}${run.shard ? ` · 碎片 +${run.shard}` : ""}`,
      );
      busy = false;
      oneBtn.disabled = false;
      bulkBtn.disabled = false;
    }, REVEAL_MS);
  }

  oneBtn.onclick = () => open(1);
  bulkBtn.onclick = () => open(table.bulk);

  paintHud();
  paintHistory();
  root._cleanup = () => d.dispose();
  return root._cleanup;
}
