import { SHOPS, partnerShopBonus } from "../data/balance.js";
import { persist } from "../core/state.js";
import { formatGold, totalOnlinePerSec } from "../core/economy.js";
import {
  PARTNER_SHARD_COST,
  assignPartner,
  partnerTrainCost,
  signPartner,
  trainPartner,
} from "../core/actions.js";
import { esc } from "../ui/dom.js";
import { sfx } from "../core/audio.js";
import { injectRosterStyles } from "./styles.js";

/** 特长 → 主题（颜色/图标）取自同特长的第一家店，视图不自造配色。 */
const THEME = (() => {
  const map = new Map();
  for (const shop of SHOPS) {
    if (!map.has(shop.specialty)) map.set(shop.specialty, { color: shop.color, emoji: shop.emoji });
  }
  return map;
})();

function themeOf(specialty) {
  return THEME.get(specialty) || { color: "#ffd6e5", emoji: "✨" };
}

function pct(n) {
  return `${Math.round(n * 100)}%`;
}

/** 只在真的变了才落笔：一次动作只改动到的那几个文本节点。 */
function paintText(node, text) {
  if (node && node.textContent !== text) node.textContent = text;
  return node;
}

function paintClass(node, className) {
  if (node && node.className !== className) node.className = className;
  return node;
}

function setDisabled(node, disabled) {
  if (node && node.disabled !== disabled) node.disabled = disabled;
}

/** `.fm-post` 是 display:block，光靠 hidden 属性藏不住，语义与显隐一起给。 */
function setShown(node, shown) {
  if (!node || node.hidden === !shown) return;
  node.hidden = !shown;
  node.style.display = shown ? "" : "none";
}

/** 派驻/培训的边际收益常常不到 1 金，formatGold 会抹平成 0，小数量级保留一位。 */
function signed(n) {
  const v = Math.abs(n) < 0.05 ? 0 : n;
  const mag = Math.abs(v);
  const text = mag < 10 ? mag.toFixed(1) : formatGold(mag);
  return `${v > 0 ? "+" : v < 0 ? "−" : "±"}${text}`;
}

/**
 * 只读试算：临时改写伙伴字段跑一遍真实收益管线再还原，
 * 这样"派驻/培训后多少钱"和结算用的是同一套公式，不靠视图复刻。
 */
function rateIf(state, partner, patch) {
  const snap = { owned: partner.owned, level: partner.level, assigned: partner.assigned };
  Object.assign(partner, patch);
  const rate = totalOnlinePerSec(state);
  Object.assign(partner, snap);
  return rate;
}

function rateWithoutTeam(state) {
  const list = state.partners || [];
  const snap = list.map((p) => p.assigned);
  list.forEach((p) => {
    p.assigned = null;
  });
  const rate = totalOnlinePerSec(state);
  list.forEach((p, i) => {
    p.assigned = snap[i];
  });
  return rate;
}

function matchingShops(specialty) {
  return SHOPS.filter((s) => s.specialty === specialty);
}

function avatarSvg(p) {
  const theme = themeOf(p.specialty);
  const gid = `fmAv-${p.id}`;
  const face = p.owned ? esc(p.name.slice(0, 1)) : "?";
  return `
    <svg viewBox="0 0 64 64" role="img" aria-label="${esc(p.name)}">
      <defs>
        <linearGradient id="${gid}" x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0" stop-color="#fffdfb"/>
          <stop offset="1" stop-color="${theme.color}"/>
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#${gid})"/>
      <path d="M9,64 C12,48 20,41 32,41 C44,41 52,48 55,64 Z" fill="rgba(255,255,255,.78)"/>
      <circle cx="32" cy="25" r="13" fill="rgba(255,255,255,.9)"/>
      <text x="32" y="30" text-anchor="middle" font-size="15" font-weight="700" fill="#3a2433">${face}</text>
      <text x="49" y="19" text-anchor="middle" font-size="15">${theme.emoji}</text>
    </svg>`;
}

export function renderRoster(root, state, ctx = {}) {
  injectRosterStyles();
  const toast = (typeof ctx === "object" && ctx.toast) || ((msg) => (state.toast = msg));
  const timers = new Set();
  const later = (fn, ms) => {
    const t = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
  };

  root.innerHTML = `
    <section class="panel fm-team-head">
      <h2>伙伴助手</h2>
      <p class="fm-team-sub">
        每位伙伴只能驻一家店。<b>特长匹配</b>拿满额加成，跨行只有零头，等级每升一级再叠一点。
      </p>
      <div class="fm-team-stats">
        <div class="fm-team-stat"><b data-shards>0</b><span>招募碎片</span></div>
        <div class="fm-team-stat"><b data-signed>0/0</b><span>已签约</span></div>
        <div class="fm-team-stat"><b data-lift>+0</b><span>伙伴带来的每秒</span></div>
      </div>
      <div class="fm-legend">
        <span class="match">✦ 金框 = 特长匹配</span>
        <span>玫瑰框 = 当前驻店</span>
        <span>灰卡 = 尚未签约</span>
      </div>
      <p class="fm-p-note" data-headnote></p>
    </section>
    <div data-list></div>`;

  const head = root.querySelector(".fm-team-head");
  const list = root.querySelector("[data-list]");
  const els = {
    shards: head.querySelector("[data-shards]"),
    signed: head.querySelector("[data-signed]"),
    lift: head.querySelector("[data-lift]"),
    note: head.querySelector("[data-headnote]"),
  };

  /** 每张卡建一次，之后只改文本/类名/禁用态；结构变化只有"签约"和"新店开门"两种。 */
  const cards = new Map();

  function unlockedShops() {
    return SHOPS.filter((s) => state.shops?.[s.id]?.unlocked);
  }

  function shopSig() {
    return unlockedShops()
      .map((s) => s.id)
      .join(",");
  }

  function syncHead() {
    const partners = state.partners || [];
    const owned = partners.filter((p) => p.owned);
    const total = totalOnlinePerSec(state);
    const lift = total - rateWithoutTeam(state);
    const share = total > 0 ? Math.round((lift / total) * 100) : 0;
    const idle = owned.filter((p) => !p.assigned).length;
    paintText(els.shards, String(state.shards));
    paintText(els.signed, `${owned.length}/${partners.length}`);
    paintText(els.lift, `${signed(lift)}/秒`);
    paintText(
      els.note,
      idle
        ? `还有 ${idle} 位伙伴闲着，派出去就是白拿的钱。团队目前贡献了全城收入的 ${share}%。`
        : `团队目前贡献了全城收入的 ${share}%，把人换到匹配的店还能再抬一截。`,
    );
  }

  function wireOwned(card, p) {
    const shops = unlockedShops();
    const lv = card.querySelector("[data-lv]");
    const stateTag = card.querySelector("[data-state]");
    const note = card.querySelector("[data-note]");

    card.querySelector("[data-posts-head]").innerHTML = `
      <span>派驻到哪家店</span>
      <small>${esc(p.specialty)}特长 · 匹配店满额加成</small>`;

    const train = document.createElement("button");
    train.className = "btn ghost";
    train.type = "button";
    train.dataset.act = "train";
    train.onclick = () => commit(trainPartner(state, p.id), sfx.coin, p.id, "train");
    card.querySelector("[data-actions]").append(train);

    const posts = card.querySelector("[data-posts]");
    const slots = shops.map((shop) => {
      const btn = document.createElement("button");
      btn.className = "fm-post";
      btn.type = "button";
      btn.dataset.act = `post:${shop.id}`;
      btn.innerHTML = "<b></b><small></small>";
      btn.onclick = () => {
        if (p.assigned === shop.id) return toast(`${p.name} 已经在${shop.name}了`);
        commit(assignPartner(state, p.id, shop.id), sfx.tap, p.id, `post:${shop.id}`);
      };
      posts.append(btn);
      return { shop, btn, label: btn.querySelector("b"), hint: btn.querySelector("small") };
    });

    // 撤回按钮常驻，只切显隐——待岗/驻店来回切时列表结构不动，焦点也就不会掉。
    const off = document.createElement("button");
    off.className = "fm-post recall";
    off.type = "button";
    off.dataset.act = "recall";
    off.textContent = "撤回驻店（先空着，等更合适的店开门）";
    off.onclick = () => {
      // 撤回后这个按钮自己就藏了，焦点接给刚撤出来的那家店——顺手就能改派。
      const from = p.assigned;
      commit(assignPartner(state, p.id, null), sfx.tap, p.id, ["recall", `post:${from}`]);
    };
    posts.append(off);

    const locked = SHOPS.length - shops.length;

    return function paint(base) {
      const post = shops.find((s) => s.id === p.assigned);
      const cost = partnerTrainCost(p.level);
      const trainLift = rateIf(state, p, { level: p.level + 1 }) - base;

      paintText(lv, `Lv.${p.level}`);
      paintClass(
        stateTag,
        post ? `fm-tag post${post.specialty === p.specialty ? " match" : ""}` : "fm-tag idle",
      );
      paintText(
        stateTag,
        post
          ? `驻 ${post.emoji} ${post.name} +${pct(partnerShopBonus(p.specialty, post.specialty, p.level))}`
          : "待岗中",
      );

      setDisabled(train, state.gold < cost);
      paintText(
        train,
        `培训 ${formatGold(cost)} 金 → Lv.${p.level + 1}${trainLift > 0 ? ` · ${signed(trainLift)}/秒` : ""}`,
      );

      for (const slot of slots) {
        const bonus = partnerShopBonus(p.specialty, slot.shop.specialty, Math.max(1, p.level));
        const match = p.specialty === slot.shop.specialty;
        const here = p.assigned === slot.shop.id;
        paintClass(slot.btn, `fm-post${match ? " match" : ""}${here ? " on" : ""}`);
        if (!here) slot.btn.removeAttribute("aria-current");
        else if (slot.btn.getAttribute("aria-current") !== "true") {
          slot.btn.setAttribute("aria-current", "true");
        }
        const delta = here
          ? base - rateIf(state, p, { assigned: null })
          : rateIf(state, p, { assigned: slot.shop.id }) - base;
        paintText(slot.label, `${slot.shop.emoji} ${slot.shop.name} +${pct(bonus)}`);
        paintText(slot.hint, here ? `当前贡献 ${signed(delta)}/秒` : `换过来 ${signed(delta)}/秒`);
      }
      setShown(off, !!p.assigned);

      let text;
      if (!post) {
        text = "待岗的伙伴一分钱都不产，先随便派一家也比空着强。";
      } else if (post.specialty !== p.specialty) {
        const best = matchingShops(p.specialty)
          .map((s) => s.name)
          .join(" / ");
        text = `现在是跨行支援，只拿零头；换到${best}才吃满${p.specialty}特长。`;
      } else {
        text = `特长对口，${post.name}的基础收入按 +${pct(partnerShopBonus(p.specialty, post.specialty, p.level))} 放大；再培训一级还能多 ${signed(trainLift)}/秒。`;
      }
      if (locked > 0) text += `（还有 ${locked} 家店没解锁，升级主角后可改派。）`;
      note.classList.toggle("warn", !post);
      paintText(note, text);
    };
  }

  function wireNew(card, p) {
    const stateTag = card.querySelector("[data-state]");
    const note = card.querySelector("[data-note]");

    const shard = document.createElement("div");
    shard.className = "fm-shard";
    shard.innerHTML = `
      <div class="fm-shard-bar"><i></i></div>
      <span class="fm-shard-txt">招募碎片 <b data-count></b><span data-hint></span></span>`;
    card.querySelector("[data-body]").append(shard);
    const fill = shard.querySelector("i");
    const count = shard.querySelector("[data-count]");
    const hint = shard.querySelector("[data-hint]");

    const sign = document.createElement("button");
    sign.className = "btn";
    sign.type = "button";
    sign.dataset.act = "sign";
    sign.onclick = () => commit(signPartner(state, p.id), sfx.rare, p.id, "sign");
    card.querySelector("[data-actions]").append(sign);

    return function paint(base) {
      const need = Math.max(0, PARTNER_SHARD_COST - state.shards);
      paintClass(stateTag, "fm-tag locked");
      paintText(stateTag, `未签约 · ${PARTNER_SHARD_COST} 碎片`);

      const width = `${(Math.min(1, state.shards / PARTNER_SHARD_COST) * 100).toFixed(0)}%`;
      if (fill.style.width !== width) fill.style.width = width;
      paintText(count, `${state.shards} / ${PARTNER_SHARD_COST}`);
      paintText(hint, need ? ` · 还差 ${need} 枚，去盲盒或占卜转转` : " · 可以签了");

      setDisabled(sign, need > 0);
      paintText(sign, need > 0 ? `还差 ${need} 枚碎片` : `消耗 ${PARTNER_SHARD_COST} 碎片签约`);

      const preview = matchingShops(p.specialty).filter((s) => state.shops?.[s.id]?.unlocked)[0];
      if (preview) {
        const lift = rateIf(state, p, { owned: true, assigned: preview.id }) - base;
        const html = `签下后派驻 ${preview.emoji} ${esc(preview.name)} 即刻 <b>${signed(lift)}/秒</b>（${esc(p.specialty)}特长匹配）。`;
        if (note.innerHTML !== html) note.innerHTML = html;
      } else {
        paintText(note, `${p.specialty}特长的店还没开门，签下也只能先跨行支援。`);
      }
    };
  }

  function buildCard(p) {
    const card = document.createElement("section");
    card.className = `panel fm-p-card ${p.owned ? "owned" : "new"}`;
    card.dataset.partner = p.id;
    // 结构真的换了（签约）时，焦点退到卡片本身，读屏能听见"这张卡现在是什么样"。
    card.tabIndex = -1;
    card.innerHTML = `
      <div class="fm-p-top">
        <div class="fm-p-avatar">${avatarSvg(p)}</div>
        <div class="fm-p-id" data-body>
          <div class="fm-p-name"><b>${esc(p.name)}</b><span class="fm-p-title">${esc(p.title)}</span></div>
          <div class="fm-p-tags">
            <span class="fm-tag spec">${themeOf(p.specialty).emoji} ${esc(p.specialty)}特长</span>
            ${p.owned ? '<span class="fm-tag lv" data-lv></span>' : ""}
            <span class="fm-tag" data-state></span>
          </div>
          <p class="fm-p-story">${esc(p.story)}</p>
        </div>
      </div>
      <div class="fm-p-actions" data-actions></div>
      ${p.owned ? '<div class="fm-posts-head" data-posts-head></div><div class="fm-posts" data-posts></div>' : ""}
      <p class="fm-p-note" data-note></p>`;
    return {
      node: card,
      owned: !!p.owned,
      shopSig: shopSig(),
      paint: p.owned ? wireOwned(card, p) : wireNew(card, p),
    };
  }

  function ordered() {
    return [...(state.partners || [])].sort(
      (a, b) => Number(b.owned) - Number(a.owned) || Number(b.level) - Number(a.level),
    );
  }

  function reorder() {
    const want = ordered()
      .map((p) => cards.get(p.id)?.node)
      .filter(Boolean);
    const have = [...list.children];
    if (want.length === have.length && want.every((node, i) => node === have[i])) return;
    for (const node of want) list.append(node);
  }

  function flash(partnerId) {
    const node = cards.get(partnerId)?.node;
    if (!node) return;
    node.classList.remove("signing");
    void node.offsetWidth;
    node.classList.add("signing");
    later(() => node.classList.remove("signing"), 700);
  }

  /** 签约会把"未签约卡"整张换成"已签约卡"，新店开门会多几个派驻位；其余一律原地改。 */
  function refresh(flashId) {
    const sig = shopSig();
    for (const p of state.partners || []) {
      const entry = cards.get(p.id);
      if (!entry) continue;
      if (entry.owned === !!p.owned && entry.shopSig === sig) continue;
      const next = buildCard(p);
      entry.node.replaceWith(next.node);
      cards.set(p.id, next);
    }
    reorder();
    const base = totalOnlinePerSec(state);
    for (const entry of cards.values()) entry.paint(base);
    if (flashId) flash(flashId);
  }

  const usable = (btn) => !!btn && !btn.disabled && !btn.hidden;

  /**
   * 按"伙伴 + 动作"这把钥匙把焦点还给刚点的按钮。按钮没了（签约换卡、撤回后自藏）
   * 或变灰（钱不够再培训）就顺着候选键往下找，最后才退到卡片本身。
   */
  function restoreFocus(partnerId, acts) {
    const node = cards.get(partnerId)?.node;
    if (!node) return;
    for (const act of acts) {
      const btn = node.querySelector(`[data-act="${act}"]`);
      if (usable(btn)) return btn.focus({ preventScroll: true });
    }
    const next = [...node.querySelectorAll("[data-act]")].find(usable);
    (next || node).focus({ preventScroll: true });
  }

  /** 动作成功后的统一收尾：落盘 → 音效 → toast → 局部刷新 → 焦点归位。 */
  function commit(res, sound, flashId, acts) {
    if (!res.ok) {
      toast(res.toast);
      return false;
    }
    persist(state);
    sound?.();
    toast(res.toast);
    refresh(flashId);
    restoreFocus(flashId, [].concat(acts || []));
    syncHead();
    return true;
  }

  for (const p of ordered()) {
    const entry = buildCard(p);
    cards.set(p.id, entry);
    list.append(entry.node);
  }
  const base = totalOnlinePerSec(state);
  for (const entry of cards.values()) entry.paint(base);
  syncHead();

  root._cleanup = () => {
    for (const t of timers) clearTimeout(t);
    timers.clear();
  };
  return root._cleanup;
}
