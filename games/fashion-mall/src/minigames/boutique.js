import { FASHION_CLIENTS } from "../data/copy.js";
import { setText } from "../ui/dom.js";
import { sfx } from "../core/audio.js";
import { payouts } from "./payouts.js";
import { createDisposer, grantReward, viewCtx } from "./runtime.js";
import { ensureStyles, panelShell, statBlock, setStat, floatText, shake, setBar } from "./ui.js";

const LOOKS = [
  { id: "suit", name: "玫瑰西装套装", tags: ["西装", "利落", "中性"] },
  { id: "sweet", name: "甜酷短裙闪片", tags: ["甜酷", "短裙", "闪"] },
  { id: "gown", name: "香槟高定礼服", tags: ["礼服", "香槟", "高定"] },
  { id: "forest", name: "森系针织长裙", tags: ["森系", "针织", "温柔"] },
];

const DECOYS = ["西装", "甜酷", "礼服", "闪", "香槟", "利落", "高定", "短裙", "中性", "森系", "针织", "温柔"];
const BOARD_SIZE = 8;
const GRADES = [
  { at: 0.95, grade: "S", line: "顾客当场拍照发了朋友圈" },
  { at: 0.75, grade: "A", line: "顾客对着镜子转了三圈" },
  { at: 0.5, grade: "B", line: "顾客点头，说还差一点点" },
  { at: 0, grade: "C", line: "顾客礼貌地说再看看" },
];

/** 结算：命中需求标签 + 成衣自带标签，全中另有满堂彩。纯函数，Node 可断言。 */
export function boutiqueScore({ need = [], picked = [], lookTags = [] }, table = payouts("boutique")) {
  const tagHits = need.filter((t) => picked.includes(t)).length;
  const lookHits = lookTags.filter((t) => need.includes(t)).length;
  const perfect = need.length > 0 && tagHits === need.length;
  const gold =
    table.base + tagHits * table.perTagHit + lookHits * table.perLookHit + (perfect ? table.perfectBonus : 0);
  const xp = table.xpBase + (tagHits + lookHits) * table.xpPerHit;
  const max =
    table.base + need.length * table.perTagHit + need.length * table.perLookHit + table.perfectBonus;
  const ratio = max > 0 ? gold / max : 0;
  const tier = GRADES.find((g) => ratio >= g.at) || GRADES[GRADES.length - 1];
  return { tagHits, lookHits, perfect, gold, xp, ratio, grade: tier.grade, line: tier.line };
}

/** 标签板：需求标签 + 干扰项打散，避免一次列全 12 个词变成找茬。 */
export function buildBoard(need, rand = Math.random, size = BOARD_SIZE) {
  const board = [...new Set(need)];
  const rest = DECOYS.filter((t) => !board.includes(t));
  while (board.length < size && rest.length) {
    board.push(rest.splice(Math.floor(rand() * rest.length), 1)[0]);
  }
  for (let i = board.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [board[i], board[j]] = [board[j], board[i]];
  }
  return board;
}

export function renderBoutique(root, state, back, ctx) {
  ensureStyles();
  const table = payouts("boutique");
  const view = viewCtx(state, back, ctx);
  const d = createDisposer();

  let client = FASHION_CLIENTS[Math.floor(Math.random() * FASHION_CLIENTS.length)];
  let board = [];
  let picked = [];
  let probes = 0;
  let look = LOOKS[0];
  let settled = false;

  root.innerHTML = `
    <section class="panel mg-panel">
      ${panelShell("缪斯服装 · 形象改造", "先勾风格试探顾客反应，再挑一套成衣提交。勾中会点头，勾错会摇头——试搭次数有限，取消勾选不退。", "返回")}
      <p class="mg-sub" data-brief></p>
      ${statBlock([
        { id: "picked", label: "已勾选", value: `0/${table.maxPicks}` },
        { id: "probe", label: "试搭余额", value: String(table.probeBudget) },
        { id: "hit", label: "确认命中", value: `0/3` },
        { id: "gold", label: "预估报酬", value: "0" },
      ])}
      <div class="mg-bar" data-fit aria-hidden="true"><i style="width:0%"></i></div>
      <div class="mg-fx" data-fx></div>
      <div class="mg-tags" data-tags style="margin-top:12px"></div>
      <p class="mg-note" data-feel></p>
      <div data-looks style="margin-top:12px"></div>
      <div class="mg-actions"><button class="btn" type="button" data-ok>提交搭配</button></div>
      <div data-result></div>
    </section>`;

  const brief = root.querySelector("[data-brief]");
  const tagsBox = root.querySelector("[data-tags]");
  const looksBox = root.querySelector("[data-looks]");
  const feel = root.querySelector("[data-feel]");
  const fit = root.querySelector("[data-fit]");
  const fx = root.querySelector("[data-fx]");
  const resultBox = root.querySelector("[data-result]");
  const okBtn = root.querySelector("[data-ok]");
  root.querySelector("[data-back]").onclick = () => view.back();

  const hitsFound = () => picked.filter((t) => client.tags.includes(t)).length;

  function paintHud() {
    const preview = boutiqueScore({ need: client.tags, picked, lookTags: look.tags }, table);
    setStat(root, "picked", `${picked.length}/${table.maxPicks}`);
    setStat(root, "probe", Math.max(0, table.probeBudget - probes), probes >= table.probeBudget ? "cold" : "");
    setStat(root, "hit", `${hitsFound()}/${client.tags.length}`, hitsFound() === client.tags.length ? "hot" : "");
    setStat(root, "gold", preview.gold);
    setBar(fit, preview.ratio, preview.ratio < 0.5);
  }

  function paintTags() {
    const budgetOut = probes >= table.probeBudget;
    for (const btn of tagsBox.children) {
      const tag = btn.dataset.tag;
      const on = picked.includes(tag);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.classList.toggle("hit", btn.dataset.known === "hit");
      btn.classList.toggle("cold", btn.dataset.known === "miss");
      const full = !on && picked.length >= table.maxPicks;
      const spent = !on && budgetOut && !btn.dataset.known;
      btn.disabled = settled || full || spent;
      const mark = btn.dataset.known === "hit" ? " ✓" : btn.dataset.known === "miss" ? " ✕" : "";
      setText(btn, `${tag}${mark}`);
    }
  }

  function paintLooks() {
    for (const btn of looksBox.children) {
      btn.setAttribute("aria-pressed", btn.dataset.id === look.id ? "true" : "false");
      btn.disabled = settled;
    }
  }

  function paintFeel(message) {
    setText(
      feel,
      message ||
        `需求 ${client.tags.length} 个风格词，勾中即时反馈；成衣自带的风格词也会计分（每个 +${table.perLookHit} 金）。`,
    );
  }

  function toggleTag(tag, btn) {
    if (settled) return;
    const idx = picked.indexOf(tag);
    if (idx >= 0) {
      picked.splice(idx, 1);
      paintTags();
      paintHud();
      paintFeel(`取消了「${tag}」，试搭次数不退。`);
      return;
    }
    if (picked.length >= table.maxPicks) return;
    const known = btn.dataset.known;
    if (!known) {
      if (probes >= table.probeBudget) return;
      probes += 1;
      const hit = client.tags.includes(tag);
      btn.dataset.known = hit ? "hit" : "miss";
      if (hit) {
        sfx.coin();
        floatText(fx, `「${tag}」正中要害`, "good", d, 50);
        paintFeel(`顾客眼睛一亮：「${tag}」正是她要的。`);
      } else {
        sfx.beep?.(190, 0.08, "sawtooth", 0.03);
        shake(btn, d);
        floatText(fx, `「${tag}」不对味`, "bad", d, 50);
        paintFeel(`顾客摇头：「${tag}」和她今天的场合不搭。`);
      }
    } else {
      sfx.tap();
    }
    picked.push(tag);
    paintTags();
    paintHud();
    if (hitsFound() === client.tags.length) {
      paintFeel("三个风格词全中，挑一套呼应的成衣就能满堂彩。");
      sfx.rare();
    }
  }

  function buildRound() {
    settled = false;
    picked = [];
    probes = 0;
    look = LOOKS[0];
    resultBox.innerHTML = "";
    okBtn.disabled = false;
    setText(okBtn, "提交搭配");
    setText(brief, `顾客想要「${client.need}」。${client.hint}`);

    board = buildBoard(client.tags);
    tagsBox.innerHTML = "";
    for (const tag of board) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mg-tag";
      btn.dataset.tag = tag;
      btn.setAttribute("aria-pressed", "false");
      btn.textContent = tag;
      btn.onclick = () => toggleTag(tag, btn);
      tagsBox.append(btn);
    }

    looksBox.innerHTML = "";
    for (const item of LOOKS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mg-look";
      btn.dataset.id = item.id;
      btn.innerHTML = `<b>${item.name}</b><small>自带风格：${item.tags.join(" · ")}</small>`;
      btn.onclick = () => {
        if (settled) return;
        look = item;
        sfx.tap();
        paintLooks();
        paintHud();
      };
      looksBox.append(btn);
    }

    paintTags();
    paintLooks();
    paintFeel();
    paintHud();
  }

  function submit() {
    if (settled) return;
    settled = true;
    const result = boutiqueScore({ need: client.tags, picked, lookTags: look.tags }, table);
    grantReward(state, { gold: result.gold, xp: result.xp });
    view.save();
    result.perfect ? sfx.rare() : sfx.win();
    view.toast(`${result.grade} 级改造 +${result.gold} 金`);

    okBtn.disabled = true;
    setText(okBtn, "已交付");
    paintTags();
    paintLooks();

    const rows = client.tags
      .map((tag) => {
        const byTag = picked.includes(tag);
        const byLook = look.tags.includes(tag);
        const how = byTag && byLook ? "勾选 + 成衣" : byTag ? "勾选命中" : byLook ? "成衣命中" : "没接住";
        return `<li><span class="${byTag || byLook ? "ok" : "no"}">${byTag || byLook ? "✓" : "✕"} ${tag}</span><span class="num">${how}</span></li>`;
      })
      .join("");

    resultBox.innerHTML = `
      <div class="mg-prize ${result.perfect ? "tier-ur" : "tier-sr"}">
        <span class="mg-grade">${result.grade}</span>
        <span class="name">${result.line}</span>
        <span class="gain">+${result.gold} 金 · 阅历 +${result.xp}${result.perfect ? " · 满堂彩加成" : ""}</span>
        <ul class="mg-list">
          ${rows}
          <li><span>成衣《${look.name}》呼应</span><span class="num">${result.lookHits} 个风格词 · +${result.lookHits * table.perLookHit} 金</span></li>
        </ul>
        <div class="mg-actions">
          <button class="btn" type="button" data-next>下一位顾客</button>
          <button class="btn ghost" type="button" data-leave>返回商场</button>
        </div>
      </div>`;
    resultBox.querySelector("[data-next]").onclick = () => {
      const others = FASHION_CLIENTS.filter((c) => c.need !== client.need);
      client = others.length ? others[Math.floor(Math.random() * others.length)] : client;
      buildRound();
      tagsBox.querySelector("button")?.focus({ preventScroll: true });
    };
    resultBox.querySelector("[data-leave]").onclick = () => view.back();
    resultBox.querySelector("[data-next]").focus({ preventScroll: true });
  }

  okBtn.onclick = submit;
  buildRound();

  root._cleanup = () => d.dispose();
  return root._cleanup;
}
