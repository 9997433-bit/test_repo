import { RESEARCH_NODES } from "../data/balance.js";
import { persist } from "../core/state.js";
import { formatGold, researchIncome, totalOnlinePerSec } from "../core/economy.js";
import { buyResearch } from "../core/actions.js";
import { esc } from "../ui/dom.js";
import { sfx } from "../core/audio.js";
import { injectLabsStyles } from "./styles.js";

const REFRESH_MS = 1000;
const ORDINALS = "①②③④⑤⑥⑦⑧⑨";

/** 每条产线的一句话交代；按 id 取，缺文案时退回店铺式通用描述。 */
const NOTES = {
  "line-a": "统一出餐节奏，后厨不再靠人盯着锅。",
  "line-b": "生鲜从产地直连冷库，夜里也在分拣。",
  "line-c": "自家开模印刷，联名款不用排代工的队。",
  "line-d": "全城次日达，五家店共用一套运力。",
};

function ordinal(i) {
  return ORDINALS[i] || String(i + 1);
}

function span(sec) {
  const s = Math.max(1, Math.round(sec));
  if (s < 60) return `${s} 秒`;
  if (s < 3600) return `${Math.round(s / 60)} 分钟`;
  return `${(s / 3600).toFixed(1)} 小时`;
}

export function renderLabs(root, state, ctx = {}) {
  injectLabsStyles();
  const toast = (typeof ctx === "object" && ctx.toast) || ((msg) => (state.toast = msg));

  root.innerHTML = `
    <section class="panel fm-lab-head">
      <h2>关卡研发 · 工厂收购</h2>
      <p class="fm-lab-sub">
        ${RESEARCH_NODES.length} 条产线<b>按顺序</b>投产：上一条跑通，下一条才开工。
        产线收入不看客流、不用店员，<b>离线也照算</b>。
      </p>
      <div class="fm-lab-stats">
        <div class="fm-lab-stat"><b data-done>0/0</b><span>已投产</span></div>
        <div class="fm-lab-stat"><b data-income>+0</b><span>产线每秒</span></div>
        <div class="fm-lab-stat"><b data-share>0%</b><span>占全城收入</span></div>
      </div>
      <div class="fm-lab-bar"><i data-bar style="width:0%"></i></div>
      <p class="fm-lab-tip" data-tip></p>
    </section>
    <ol class="fm-track" data-track></ol>`;

  const head = root.querySelector(".fm-lab-head");
  const track = root.querySelector("[data-track]");
  const els = {
    done: head.querySelector("[data-done]"),
    income: head.querySelector("[data-income]"),
    share: head.querySelector("[data-share]"),
    bar: head.querySelector("[data-bar]"),
    tip: head.querySelector("[data-tip]"),
  };

  function doneCount() {
    return RESEARCH_NODES.filter((n) => state.researchDone.includes(n.id)).length;
  }

  function syncHead() {
    const done = doneCount();
    const income = researchIncome(state.researchDone);
    const total = totalOnlinePerSec(state);
    const share = total > 0 ? Math.round((income / total) * 100) : 0;
    els.done.textContent = `${done}/${RESEARCH_NODES.length}`;
    els.income.textContent = `+${formatGold(income)}/秒`;
    els.share.textContent = `${share}%`;
    els.bar.style.width = `${(done / RESEARCH_NODES.length) * 100}%`;
    const next = RESEARCH_NODES.find((n) => !state.researchDone.includes(n.id));
    els.tip.textContent = next
      ? `下一条是《${next.name}》，投入 ${formatGold(next.cost)} 金；产线是全城唯一不受店铺状态影响的收入。`
      : "四条产线全部投产，全城基础收入已经拉满，剩下的靠店铺升级和伙伴。";
  }

  function buy(node, index) {
    if (state.researchDone.includes(node.id)) return;
    const prev = RESEARCH_NODES[index - 1];
    if (prev && !state.researchDone.includes(prev.id)) {
      return toast(`产线要按顺序上：先把《${prev.name}》投产`);
    }
    const res = buyResearch(state, node.id);
    if (!res.ok) return toast(res.toast);
    persist(state);
    sfx.win();
    toast(res.toast);
    paintTrack(node.id);
    syncHead();
  }

  function paintTrack(flashId) {
    const doneIds = state.researchDone;
    const openIndex = RESEARCH_NODES.findIndex((n) => !doneIds.includes(n.id));
    const baseRate = totalOnlinePerSec(state);
    track.innerHTML = "";

    RESEARCH_NODES.forEach((node, i) => {
      const done = doneIds.includes(node.id);
      const isNext = !done && i === openIndex;
      const prev = RESEARCH_NODES[i - 1];
      const step = document.createElement("li");
      step.className = `fm-step ${done ? "done" : isNext ? "next" : "locked"}`;
      step.dataset.node = node.id;

      const share = baseRate > 0 ? Math.round((node.income / baseRate) * 100) : 0;
      const payoff = done
        ? `已投产：每秒稳定 <b>+${formatGold(node.income)}</b>，不看客流也不用店员；离线结算同样按这份收入折算。`
        : `投产后每秒 <b>+${formatGold(node.income)}</b>，全城收入 ${formatGold(baseRate)}/秒 → <b>${formatGold(baseRate + node.income)}/秒</b>（约 +${share}%），单靠这条产线约 ${span(node.cost / node.income)} 回本。`;

      step.innerHTML = `
        <div class="fm-rail"><span class="fm-dot">${done ? "✓" : ordinal(i)}</span></div>
        <section class="panel fm-node">
          <div class="fm-node-head">
            <div>
              <div class="fm-node-name">${esc(node.name)}</div>
              <span class="fm-node-order">第 ${i + 1} 条产线 · ${prev ? `前置《${esc(prev.name)}》` : "无需前置"}</span>
            </div>
            <span class="fm-node-badge ${done ? "done" : isNext ? "next" : ""}">${done ? "已投产" : isNext ? "可投产" : "待前置"}</span>
          </div>
          <p class="fm-node-desc">${esc(NOTES[node.id] || "一条能长期抬高基础收入的产线。")}</p>
          <div class="fm-node-facts">
            <span class="fm-fact cost">投入 ${formatGold(node.cost)} 金</span>
            <span class="fm-fact income">产出 +${formatGold(node.income)}/秒</span>
            <span class="fm-fact">回本约 ${span(node.cost / node.income)}</span>
          </div>
          ${done ? "" : '<div class="fm-node-buy" data-buy></div>'}
          <p class="fm-node-payoff">${payoff}</p>
        </section>`;

      const buyRow = step.querySelector("[data-buy]");
      if (buyRow) {
        const btn = document.createElement("button");
        btn.className = `btn ${isNext ? "" : "ghost"}`;
        btn.type = "button";
        btn.dataset.action = "buy";
        btn.textContent = isNext ? `投入 ${formatGold(node.cost)} 金` : "待前置完成";
        btn.onclick = () => buy(node, i);
        const fund = document.createElement("div");
        fund.className = "fm-fund";
        fund.innerHTML = `
          <div class="fm-fund-bar"><i data-fund style="width:0%"></i></div>
          <span class="fm-fund-txt" data-fundtxt></span>`;
        buyRow.append(btn, fund);
      }

      if (node.id === flashId) {
        const dot = step.querySelector(".fm-dot");
        dot.animate?.(
          [
            { transform: "scale(1)" },
            { transform: "scale(1.45)" },
            { transform: "scale(1)" },
          ],
          { duration: 620, easing: "cubic-bezier(0.22,1,0.36,1)" },
        );
      }
      track.append(step);
    });

    syncFunding();
  }

  /** 金币每 tick 都在涨，这里只刷新"还差多少"，不重建节点。 */
  function syncFunding() {
    const doneIds = state.researchDone;
    const openIndex = RESEARCH_NODES.findIndex((n) => !doneIds.includes(n.id));
    for (const step of track.querySelectorAll(".fm-step")) {
      const node = RESEARCH_NODES.find((n) => n.id === step.dataset.node);
      const i = RESEARCH_NODES.indexOf(node);
      const fund = step.querySelector("[data-fund]");
      if (!node || !fund) continue;
      const locked = i > openIndex;
      const ratio = Math.min(1, Math.max(0, state.gold / node.cost));
      const short = Math.max(0, node.cost - state.gold);
      fund.style.width = `${(ratio * 100).toFixed(1)}%`;
      step.querySelector("[data-fundtxt]").textContent = locked
        ? `先完成《${RESEARCH_NODES[i - 1].name}》才能开工`
        : short > 0
          ? `研发预算 ${formatGold(state.gold)} / ${formatGold(node.cost)} · 还差 ${formatGold(short)}`
          : `预算充足，随时开工`;
      const btn = step.querySelector('[data-action="buy"]');
      if (btn) btn.disabled = locked || short > 0;
    }
  }

  paintTrack(null);
  syncHead();

  const timer = setInterval(() => {
    if (!root.isConnected) return clearInterval(timer);
    syncFunding();
    syncHead();
  }, REFRESH_MS);

  root._cleanup = () => clearInterval(timer);
  return root._cleanup;
}
