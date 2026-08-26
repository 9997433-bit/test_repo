import { FURNITURE, offlineGold } from "../data/balance.js";
import { furnitureBonus, charmOf, totalOnlinePerSec, formatGold } from "../core/economy.js";
import { persist } from "../core/state.js";
import { sfx } from "../core/audio.js";
import { injectMansionStyles } from "./styles.js";
import { furnitureArt, roomBackdrop, PLACEMENT, ROOMS } from "./roomArt.js";

const OFFLINE_PREVIEW_HOURS = 8;

function costOf(f) {
  return Math.round(200 / f.bonus);
}

function roomItems(roomId) {
  return FURNITURE.filter((f) => PLACEMENT[f.id]?.room === roomId).sort(
    (a, b) => PLACEMENT[a.id].y - PLACEMENT[b.id].y,
  );
}

function ghostArt(f, owned) {
  const pl = PLACEMENT[f.id];
  const label = `${f.name} · ${formatGold(costOf(f))}`;
  return `
    <g class="fm-slotbox" data-buy="${f.id}" transform="translate(${pl.x},${pl.y}) scale(${pl.scale})">
      <rect class="fm-ghost-plate" x="${-pl.w / 2}" y="${-pl.h}" width="${pl.w}" height="${pl.h}" rx="11"
        fill="rgba(255,255,255,.34)" stroke="#ffffff" stroke-width="2" stroke-dasharray="7 6" opacity=".72"/>
      <g class="fm-ghost-art" opacity="${owned ? 0.34 : 0.18}">${furnitureArt(f.id)}</g>
      <g transform="translate(0,${-pl.h / 2 - 6})">
        <circle r="13" fill="rgba(255,255,255,.88)"/>
        <path d="M-5.5,0 H5.5 M0,-5.5 V5.5" stroke="#c73b6f" stroke-width="2.6" stroke-linecap="round"/>
      </g>
      <text x="0" y="${-pl.h / 2 + 22}" text-anchor="middle" font-size="9.5" fill="#3a2433" opacity=".8">${label}</text>
    </g>`;
}

function roomSvg(room, state, justPlaced) {
  let art = "";
  for (const f of roomItems(room.id)) {
    const pl = PLACEMENT[f.id];
    if (!state.furniture.includes(f.id)) {
      art += ghostArt(f, false);
      continue;
    }
    const fresh = justPlaced === f.id;
    art += `
      <g transform="translate(${pl.x},${pl.y}) scale(${pl.scale})">
        <g class="fm-placed${fresh ? " fm-drop" : ""}">${furnitureArt(f.id)}</g>
        ${fresh ? `<g class="fm-puff"><ellipse cx="0" cy="-2" rx="${pl.w * 0.42}" ry="7" fill="#fffaf5" opacity=".85"/></g>` : ""}
      </g>`;
  }
  return `<svg viewBox="0 0 320 190" role="img" aria-label="${room.name}">${roomBackdrop(room.id, room.id)}${art}</svg>`;
}

function itemIcon(id) {
  const pl = PLACEMENT[id];
  const s = 30 / Math.max(pl.w, pl.h);
  return `<svg viewBox="-18 -18 36 36" aria-hidden="true"><g transform="translate(0,${(pl.h * s) / 2}) scale(${s.toFixed(3)})">${furnitureArt(id)}</g></svg>`;
}

export function renderMansion(root, state) {
  injectMansionStyles();

  root.innerHTML = `
    <section class="panel fm-home-head">
      <h2>超绝豪宅</h2>
      <p class="fm-home-sub">三间主题房，每件家具都会真的摆进去；家装越满，离线收益越猛。</p>
      <div class="fm-home-stats">
        <div class="fm-home-stat"><b data-bonus>+0%</b><span>离线加成</span></div>
        <div class="fm-home-stat"><b data-idle>0</b><span>${OFFLINE_PREVIEW_HOURS} 小时离线预估</span></div>
        <div class="fm-home-stat"><b data-charm>0</b><span>当前魅力</span></div>
      </div>
      <div class="fm-home-bar"><i data-bar style="width:0%"></i></div>
      <p class="fm-home-tip" data-tip></p>
    </section>`;

  const head = root.querySelector(".fm-home-head");
  const els = {
    bonus: head.querySelector("[data-bonus]"),
    idle: head.querySelector("[data-idle]"),
    charm: head.querySelector("[data-charm]"),
    bar: head.querySelector("[data-bar]"),
    tip: head.querySelector("[data-tip]"),
  };

  function pop(el) {
    el.classList.remove("fm-pop");
    void el.offsetWidth;
    el.classList.add("fm-pop");
  }

  function syncHud() {
    document.querySelectorAll(".topbar .pill").forEach((pill) => {
      if (pill.textContent.startsWith("💰")) pill.textContent = `💰 ${formatGold(state.gold)}`;
    });
  }

  function syncStats(animate) {
    const bonus = furnitureBonus(state.furniture);
    const idle = offlineGold(totalOnlinePerSec(state), OFFLINE_PREVIEW_HOURS, bonus);
    const owned = state.furniture.filter((id) => PLACEMENT[id]).length;
    els.bonus.textContent = `+${Math.round(bonus * 100)}%`;
    els.idle.textContent = formatGold(idle);
    els.charm.textContent = charmOf(state.outfit);
    els.bar.style.width = `${(owned / FURNITURE.length) * 100}%`;
    els.tip.textContent = `已摆放 ${owned}/${FURNITURE.length} 件 · 离线最多结算 8 小时，家装把这笔钱再抬高 ${Math.round(bonus * 100)}%。`;
    if (animate) [els.bonus, els.idle].forEach(pop);
    syncHud();
  }

  ROOMS.forEach((room) => {
    const items = roomItems(room.id);
    const section = document.createElement("section");
    section.className = "panel fm-room";
    section.dataset.room = room.id;
    section.innerHTML = `
      <div class="fm-room-head">
        <span class="fm-room-dot" style="background:${room.accent}"></span>
        <span class="fm-room-name">${room.name}</span>
        <span class="fm-room-tag">${room.tagline}</span>
        <span class="fm-room-badge" data-badge></span>
      </div>
      <div class="fm-room-stage" data-stage></div>
      <div class="fm-shop" data-shop></div>
      <p class="fm-hint" data-hint></p>`;

    const stage = section.querySelector("[data-stage]");
    const shop = section.querySelector("[data-shop]");
    const badge = section.querySelector("[data-badge]");
    const hint = section.querySelector("[data-hint]");

    function say(text) {
      hint.textContent = text;
      hint.classList.remove("shake");
      void hint.offsetWidth;
      hint.classList.add("shake");
    }

    function gain(text) {
      const tag = document.createElement("div");
      tag.className = "fm-gain";
      tag.textContent = text;
      tag.style.left = "50%";
      tag.style.top = "42%";
      stage.append(tag);
      setTimeout(() => tag.remove(), 1200);
    }

    function buy(f) {
      if (state.furniture.includes(f.id)) return;
      const cost = costOf(f);
      if (state.gold < cost) {
        say(`还差 ${formatGold(cost - state.gold)}，先回商场跑一轮营业额`);
        return;
      }
      state.gold -= cost;
      state.furniture.push(f.id);
      persist(state);
      sfx.coin();
      paintRoom(f.id);
      syncStats(true);
      gain(`${f.name} 已就位 · 离线 +${Math.round(f.bonus * 100)}%`);
      hint.textContent = "";
    }

    function paintShop() {
      shop.innerHTML = "";
      items.forEach((f) => {
        const owned = state.furniture.includes(f.id);
        const cost = costOf(f);
        const btn = document.createElement("button");
        btn.className = `fm-item${owned ? " owned" : state.gold < cost ? " poor" : ""}`;
        btn.innerHTML = `
          ${itemIcon(f.id)}
          <span class="fm-item-txt">
            <b>${f.name}</b>
            <small>${owned ? `离线 +${Math.round(f.bonus * 100)}%` : `${formatGold(cost)} 金 · 离线 +${Math.round(f.bonus * 100)}%`}</small>
          </span>
          ${owned ? '<span class="fm-own-tag">已摆放</span>' : ""}`;
        btn.onclick = () => (owned ? say(`${f.name} 已经在${room.name}里了`) : buy(f));
        shop.append(btn);
      });
    }

    function paintRoom(justPlaced) {
      stage.innerHTML = roomSvg(room, state, justPlaced);
      stage.querySelectorAll("[data-buy]").forEach((node) => {
        node.addEventListener("click", () => {
          const f = FURNITURE.find((x) => x.id === node.dataset.buy);
          if (f) buy(f);
        });
      });
      const owned = items.filter((f) => state.furniture.includes(f.id)).length;
      badge.textContent = owned === items.length ? "装修完成" : `${owned}/${items.length} 已摆放`;
      badge.classList.toggle("done", owned === items.length);
      paintShop();
    }

    paintRoom(null);
    root.append(section);
  });

  syncStats(false);
}
