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

  function syncHead() {
    const partners = state.partners || [];
    const owned = partners.filter((p) => p.owned);
    const total = totalOnlinePerSec(state);
    const lift = total - rateWithoutTeam(state);
    const share = total > 0 ? Math.round((lift / total) * 100) : 0;
    const idle = owned.filter((p) => !p.assigned).length;
    els.shards.textContent = state.shards;
    els.signed.textContent = `${owned.length}/${partners.length}`;
    els.lift.textContent = `${signed(lift)}/秒`;
    els.note.textContent = idle
      ? `还有 ${idle} 位伙伴闲着，派出去就是白拿的钱。团队目前贡献了全城收入的 ${share}%。`
      : `团队目前贡献了全城收入的 ${share}%，把人换到匹配的店还能再抬一截。`;
  }

  /** 动作成功后的统一收尾：落盘 → 音效 → toast → 重绘。 */
  function commit(res, sound, flashId) {
    if (!res.ok) {
      toast(res.toast);
      return false;
    }
    persist(state);
    sound?.();
    toast(res.toast);
    paintList(flashId);
    syncHead();
    return true;
  }

  function postButton(p, shop, base) {
    const bonus = partnerShopBonus(p.specialty, shop.specialty, Math.max(1, p.level));
    const match = p.specialty === shop.specialty;
    const here = p.assigned === shop.id;
    const btn = document.createElement("button");
    btn.className = `fm-post${match ? " match" : ""}${here ? " on" : ""}`;
    btn.type = "button";
    if (here) btn.setAttribute("aria-current", "true");
    const delta = here
      ? base - rateIf(state, p, { assigned: null })
      : rateIf(state, p, { assigned: shop.id }) - base;
    btn.innerHTML = `
      <b>${shop.emoji} ${esc(shop.name)} +${pct(bonus)}</b>
      <small>${here ? `当前贡献 ${signed(delta)}/秒` : `换过来 ${signed(delta)}/秒`}</small>`;
    btn.onclick = () => {
      if (here) return toast(`${p.name} 已经在${shop.name}了`);
      commit(assignPartner(state, p.id, shop.id), sfx.tap, p.id);
    };
    return btn;
  }

  function ownedCard(card, p, base) {
    const shops = SHOPS.filter((s) => state.shops?.[s.id]?.unlocked);
    const post = shops.find((s) => s.id === p.assigned);
    const cost = partnerTrainCost(p.level);
    const trainLift = rateIf(state, p, { level: p.level + 1 }) - base;

    const tags = card.querySelector("[data-tags]");
    tags.insertAdjacentHTML(
      "beforeend",
      post
        ? `<span class="fm-tag post${post.specialty === p.specialty ? " match" : ""}">驻 ${post.emoji} ${esc(post.name)} +${pct(partnerShopBonus(p.specialty, post.specialty, p.level))}</span>`
        : `<span class="fm-tag idle">待岗中</span>`,
    );

    const actions = card.querySelector("[data-actions]");
    const train = document.createElement("button");
    train.className = "btn ghost";
    train.type = "button";
    train.disabled = state.gold < cost;
    train.innerHTML = `培训 ${formatGold(cost)} 金 → Lv.${p.level + 1}${trainLift > 0 ? ` · ${signed(trainLift)}/秒` : ""}`;
    train.onclick = () => commit(trainPartner(state, p.id), sfx.coin, p.id);
    actions.append(train);

    card.querySelector("[data-posts-head]").innerHTML = `
      <span>派驻到哪家店</span>
      <small>${p.specialty}特长 · 匹配店满额加成</small>`;

    const posts = card.querySelector("[data-posts]");
    for (const shop of shops) posts.append(postButton(p, shop, base));
    if (p.assigned) {
      const off = document.createElement("button");
      off.className = "fm-post recall";
      off.type = "button";
      off.textContent = "撤回驻店（先空着，等更合适的店开门）";
      off.onclick = () => commit(assignPartner(state, p.id, null), sfx.tap, p.id);
      posts.append(off);
    }

    const locked = SHOPS.length - shops.length;
    const note = card.querySelector("[data-note]");
    if (!post) {
      note.classList.add("warn");
      note.textContent = "待岗的伙伴一分钱都不产，先随便派一家也比空着强。";
    } else if (post.specialty !== p.specialty) {
      const best = matchingShops(p.specialty)
        .map((s) => s.name)
        .join(" / ");
      note.textContent = `现在是跨行支援，只拿零头；换到${best}才吃满${p.specialty}特长。`;
    } else {
      note.textContent = `特长对口，${post.name}的基础收入按 +${pct(partnerShopBonus(p.specialty, post.specialty, p.level))} 放大；再培训一级还能多 ${signed(trainLift)}/秒。`;
    }
    if (locked > 0) note.textContent += `（还有 ${locked} 家店没解锁，升级主角后可改派。）`;
  }

  function newCard(card, p, base) {
    const need = Math.max(0, PARTNER_SHARD_COST - state.shards);
    const tags = card.querySelector("[data-tags]");
    tags.insertAdjacentHTML(
      "beforeend",
      `<span class="fm-tag locked">未签约 · ${PARTNER_SHARD_COST} 碎片</span>`,
    );

    const shard = document.createElement("div");
    shard.className = "fm-shard";
    const filled = Math.min(1, state.shards / PARTNER_SHARD_COST);
    shard.innerHTML = `
      <div class="fm-shard-bar"><i style="width:${(filled * 100).toFixed(0)}%"></i></div>
      <span class="fm-shard-txt">招募碎片 <b>${state.shards} / ${PARTNER_SHARD_COST}</b>${need ? ` · 还差 ${need} 枚，去盲盒或占卜转转` : " · 可以签了"}</span>`;
    card.querySelector("[data-body]").append(shard);

    const actions = card.querySelector("[data-actions]");
    const sign = document.createElement("button");
    sign.className = "btn";
    sign.type = "button";
    sign.disabled = need > 0;
    sign.textContent = need > 0 ? `还差 ${need} 枚碎片` : `消耗 ${PARTNER_SHARD_COST} 碎片签约`;
    sign.onclick = () => commit(signPartner(state, p.id), sfx.rare, p.id);
    actions.append(sign);

    const unlockedMatch = matchingShops(p.specialty).filter((s) => state.shops?.[s.id]?.unlocked);
    const preview = unlockedMatch[0];
    const note = card.querySelector("[data-note]");
    if (preview) {
      const lift = rateIf(state, p, { owned: true, assigned: preview.id }) - base;
      note.innerHTML = `签下后派驻 ${preview.emoji} ${esc(preview.name)} 即刻 <b>${signed(lift)}/秒</b>（${p.specialty}特长匹配）。`;
    } else {
      note.textContent = `${p.specialty}特长的店还没开门，签下也只能先跨行支援。`;
    }
  }

  function paintList(flashId) {
    const base = totalOnlinePerSec(state);
    list.innerHTML = "";
    const ordered = [...(state.partners || [])].sort(
      (a, b) => Number(b.owned) - Number(a.owned) || Number(b.level) - Number(a.level),
    );
    for (const p of ordered) {
      const card = document.createElement("section");
      card.className = `panel fm-p-card ${p.owned ? "owned" : "new"}`;
      card.dataset.partner = p.id;
      card.innerHTML = `
        <div class="fm-p-top">
          <div class="fm-p-avatar">${avatarSvg(p)}</div>
          <div class="fm-p-id" data-body>
            <div class="fm-p-name"><b>${esc(p.name)}</b><span class="fm-p-title">${esc(p.title)}</span></div>
            <div class="fm-p-tags" data-tags>
              <span class="fm-tag spec">${themeOf(p.specialty).emoji} ${esc(p.specialty)}特长</span>
              ${p.owned ? `<span class="fm-tag lv">Lv.${p.level}</span>` : ""}
            </div>
            <p class="fm-p-story">${esc(p.story)}</p>
          </div>
        </div>
        <div class="fm-p-actions" data-actions></div>
        ${p.owned ? '<div class="fm-posts-head" data-posts-head></div><div class="fm-posts" data-posts></div>' : ""}
        <p class="fm-p-note" data-note></p>`;

      if (p.owned) ownedCard(card, p, base);
      else newCard(card, p, base);

      if (p.id === flashId) {
        card.classList.add("signing");
        later(() => card.classList.remove("signing"), 700);
      }
      list.append(card);
    }
  }

  paintList(null);
  syncHead();

  root._cleanup = () => {
    for (const t of timers) clearTimeout(t);
    timers.clear();
  };
  return root._cleanup;
}
