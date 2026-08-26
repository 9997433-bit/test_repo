import { OUTFITS } from "../data/balance.js";
import { charmOf, furnitureBonus, totalOnlinePerSec, formatGold } from "../core/economy.js";
import { persist } from "../core/state.js";
import { sfx } from "../core/audio.js";
import { injectWardrobeStyles } from "./styles.js";
import { backdropArt, bodyArt, layerArt, LAYER_ORDER, SLOT_LAYERS, SLOT_META } from "./dollArt.js";

const SLOTS = ["hair", "top", "bottom", "shoes", "acc"];

const PRESETS = [
  { id: "sweet", name: "甜心日常", pick: { hair: "bob", top: "tee", bottom: "skirt", shoes: "sneaker", acc: "pearl" } },
  { id: "city", name: "都市通勤", pick: { hair: "high", top: "blazer", bottom: "slacks", shoes: "boot", acc: "pearl" } },
  { id: "muse", name: "星夜女王", pick: { hair: "long", top: "gown", bottom: "silk", shoes: "heel", acc: "crown" } },
];

const TIERS = [
  [70, "殿堂缪斯"],
  [55, "秀场主角"],
  [40, "都市轻奢"],
  [0, "日常街拍"],
];

/** 各槽位闪光/浮字出现的纵向位置（相对舞台高度）。 */
const SPARK_Y = { hair: 0.13, top: 0.4, bottom: 0.6, shoes: 0.88, acc: 0.15 };

const CHARM_RANGE = (() => {
  let min = 0;
  let max = 0;
  for (const slot of SLOTS) {
    min += Math.min(...OUTFITS[slot].map((i) => i.charm));
    max += Math.max(...OUTFITS[slot].map((i) => i.charm));
  }
  return { min, max };
})();

const RING_R = 33;
const RING_C = 2 * Math.PI * RING_R;

function itemOf(state, slot) {
  const cur = state.outfit?.[slot];
  const list = OUTFITS[slot];
  return list.find((i) => i.id === cur?.id) || list[0];
}

function outfitTitle(state) {
  const ids = Object.fromEntries(SLOTS.map((s) => [s, itemOf(state, s).id]));
  const hit = PRESETS.find((p) => SLOTS.every((s) => p.pick[s] === ids[s]));
  if (hit) return hit.name;
  const charm = charmOf(state.outfit);
  return TIERS.find(([gate]) => charm >= gate)[1];
}

function thumbSvg(slot, itemId) {
  const art = layerArt(slot, itemId, `t${slot}${itemId}`);
  const meta = SLOT_META[slot];
  const front = LAYER_ORDER.filter((l) => l !== "body" && l !== "hairBack")
    .map((l) => art[l] || "")
    .join("");
  return `
    <svg class="fm-thumb" viewBox="${meta.view}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      ${art.hairBack || ""}
      <g opacity=".3">${bodyArt()}</g>
      ${front}
    </svg>`;
}

function dollSvg() {
  const layers = LAYER_ORDER.map((name) =>
    name === "body"
      ? `<g class="fm-body">${bodyArt()}</g>`
      : `<g class="fm-lyr" data-layer="${name}"></g>`,
  ).join("");
  return `
    <svg class="fm-doll" viewBox="0 0 200 320" role="img" aria-label="换装纸娃娃">
      ${backdropArt("d")}
      <g class="fm-scene">${layers}</g>
    </svg>`;
}

export function renderWardrobe(root, state) {
  injectWardrobeStyles();

  const charmMax = CHARM_RANGE.max;
  root.innerHTML = `
    <section class="panel fm-look">
      <div class="fm-look-head">
        <div>
          <h2>百变衣橱</h2>
          <p class="fm-sub">今日造型 <span class="fm-title" data-title>—</span><br/>每 1 点魅力为全店带来 +0.2% 客流</p>
        </div>
        <div class="fm-ring">
          <svg viewBox="0 0 78 78" aria-hidden="true">
            <defs>
              <linearGradient id="fmRingGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#ffb3d0"/><stop offset=".55" stop-color="#e85a8c"/><stop offset="1" stop-color="#e8c37a"/>
              </linearGradient>
            </defs>
            <circle class="fm-ring-bg" cx="39" cy="39" r="${RING_R}"/>
            <circle class="fm-ring-fg" data-ring cx="39" cy="39" r="${RING_R}" stroke="url(#fmRingGrad)"
              stroke-dasharray="${RING_C.toFixed(1)}" stroke-dashoffset="${RING_C.toFixed(1)}"/>
          </svg>
          <div class="fm-ring-txt"><b data-charm>0</b><span>魅力 / ${charmMax}</span></div>
        </div>
      </div>

      <div class="fm-stage">
        ${dollSvg()}
        <div class="fm-shine" data-shine></div>
        <div class="fm-sparks" data-sparks></div>
      </div>

      <div class="fm-controls">
        <div class="fm-stats">
          <div class="fm-stat"><b data-traffic>+0%</b><span>全店客流</span></div>
          <div class="fm-stat"><b data-rate>0/秒</b><span>当前收益</span></div>
          <div class="fm-stat"><b data-offline>+0%</b><span>离线加成</span></div>
        </div>
        <p class="fm-note" data-note></p>
        <div class="fm-presets" data-presets></div>
        <div data-slots></div>
      </div>
    </section>`;

  const panel = root.querySelector(".fm-look");
  const svg = panel.querySelector(".fm-doll");
  const sparks = panel.querySelector("[data-sparks]");
  const shine = panel.querySelector("[data-shine]");

  /* ---------------------------------------------------------- 图层过渡 */

  function setLayer(name, html, opts = {}) {
    const host = svg.querySelector(`[data-layer="${name}"]`);
    if (!host) return;
    const piece = document.createElementNS("http://www.w3.org/2000/svg", "g");
    piece.setAttribute("class", "fm-piece");
    piece.innerHTML = html;
    if (opts.dy) piece.style.setProperty("--dy", opts.dy);
    if (opts.delay) piece.style.setProperty("--delay", `${opts.delay}s`);
    if (opts.animate) {
      piece.classList.add("fm-in");
      host.querySelectorAll(".fm-piece").forEach((old) => {
        old.classList.remove("fm-in");
        old.classList.add("fm-out");
        setTimeout(() => old.remove(), 400);
      });
    } else {
      host.innerHTML = "";
    }
    host.append(piece);
  }

  function paintSlot(slot, animate, delay = 0) {
    const item = itemOf(state, slot);
    const art = layerArt(slot, item.id, "d");
    SLOT_LAYERS[slot].forEach((layer) => {
      setLayer(layer, art[layer] || "", { animate, delay, dy: SLOT_META[slot].dy });
    });
  }

  function burst(slot, delay = 0) {
    const y = SPARK_Y[slot] ?? 0.5;
    for (let i = 0; i < 6; i++) {
      const dot = document.createElement("i");
      dot.className = "fm-spark";
      dot.style.left = `${18 + Math.random() * 64}%`;
      dot.style.top = `${(y + (Math.random() - 0.5) * 0.16) * 100}%`;
      dot.style.animationDelay = `${delay + i * 0.05}s`;
      const size = 9 + Math.random() * 9;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.margin = `${-size / 2}px 0 0 ${-size / 2}px`;
      sparks.append(dot);
      setTimeout(() => dot.remove(), (delay + 1.2) * 1000);
    }
    shine.classList.remove("run");
    void shine.offsetWidth;
    shine.classList.add("run");
  }

  function floatDelta(diff) {
    if (!diff) return;
    const tag = document.createElement("div");
    tag.className = `fm-float${diff < 0 ? " down" : ""}`;
    tag.textContent = `${diff > 0 ? "+" : ""}${diff} 魅力`;
    sparks.append(tag);
    setTimeout(() => tag.remove(), 1200);
  }

  /* ------------------------------------------------------------ 数值区 */

  const els = {
    charm: panel.querySelector("[data-charm]"),
    ring: panel.querySelector("[data-ring]"),
    title: panel.querySelector("[data-title]"),
    traffic: panel.querySelector("[data-traffic]"),
    rate: panel.querySelector("[data-rate]"),
    offline: panel.querySelector("[data-offline]"),
    note: panel.querySelector("[data-note]"),
  };

  function bump(el) {
    el.classList.remove("fm-bump");
    void el.offsetWidth;
    el.classList.add("fm-bump");
  }

  function syncHud(charm, rate) {
    document.querySelectorAll(".topbar .pill").forEach((pill) => {
      if (pill.textContent.includes("魅力")) {
        pill.textContent = `✨ 魅力 ${charm}`;
        bump(pill);
      } else if (pill.textContent.includes("/秒")) {
        pill.textContent = `📈 ${formatGold(rate)}/秒`;
      }
    });
  }

  function syncStats(animate) {
    const charm = charmOf(state.outfit);
    const rate = totalOnlinePerSec(state);
    const offline = furnitureBonus(state.furniture);
    const pct = Math.min(1, Math.max(0, (charm - CHARM_RANGE.min) / (charmMax - CHARM_RANGE.min)));

    els.charm.textContent = charm;
    els.ring.style.strokeDashoffset = (RING_C * (1 - pct)).toFixed(1);
    els.title.textContent = outfitTitle(state);
    els.traffic.textContent = `+${(charm * 0.2).toFixed(1)}%`;
    els.rate.textContent = `${formatGold(rate)}/秒`;
    els.offline.textContent = `+${Math.round(offline * 100)}%`;
    els.note.textContent = `魅力 ${charm} 已折算进上方「当前收益」；豪宅家装再为离线收益额外叠加 +${Math.round(offline * 100)}%。`;
    if (animate) [els.charm, els.traffic, els.rate].forEach(bump);
    syncHud(charm, rate);
    return charm;
  }

  /* ------------------------------------------------------------ 选择区 */

  const presetBox = panel.querySelector("[data-presets]");
  const slotBox = panel.querySelector("[data-slots]");

  function refreshChoices() {
    const ids = Object.fromEntries(SLOTS.map((s) => [s, itemOf(state, s).id]));
    presetBox.querySelectorAll(".fm-preset[data-preset]").forEach((btn) => {
      const preset = PRESETS.find((p) => p.id === btn.dataset.preset);
      btn.classList.toggle("on", SLOTS.every((s) => preset.pick[s] === ids[s]));
    });
    slotBox.querySelectorAll(".fm-slot").forEach((group) => {
      const slot = group.dataset.slot;
      const cur = itemOf(state, slot);
      group.querySelector(".fm-slot-cur").textContent = `${cur.name} · 魅力 +${cur.charm}`;
      group.querySelectorAll(".fm-card").forEach((card) => {
        const item = OUTFITS[slot].find((i) => i.id === card.dataset.id);
        card.classList.toggle("on", item.id === cur.id);
        const diff = item.charm - cur.charm;
        const delta = card.querySelector(".fm-delta");
        delta.textContent = diff > 0 ? `↑${diff}` : diff < 0 ? `↓${diff}` : "";
        delta.classList.toggle("down", diff < 0);
        delta.style.display = diff === 0 ? "none" : "";
      });
    });
  }

  function wear(slot, itemId, delay = 0) {
    const item = OUTFITS[slot].find((i) => i.id === itemId);
    if (!item || itemOf(state, slot).id === itemId) return false;
    state.outfit[slot] = item;
    paintSlot(slot, true, delay);
    burst(slot, delay);
    return true;
  }

  function commit(before) {
    persist(state);
    sfx.tap();
    const after = syncStats(true);
    floatDelta(after - before);
    refreshChoices();
  }

  PRESETS.forEach((preset) => {
    const btn = document.createElement("button");
    btn.className = "fm-preset";
    btn.dataset.preset = preset.id;
    btn.textContent = preset.name;
    btn.onclick = () => {
      const before = charmOf(state.outfit);
      let i = 0;
      SLOTS.forEach((slot) => {
        if (wear(slot, preset.pick[slot], i * 0.07)) i += 1;
      });
      commit(before);
    };
    presetBox.append(btn);
  });

  const dice = document.createElement("button");
  dice.className = "fm-preset";
  dice.textContent = "🎲 随机搭配";
  dice.onclick = () => {
    const before = charmOf(state.outfit);
    let i = 0;
    SLOTS.forEach((slot) => {
      const pool = OUTFITS[slot];
      const pickId = pool[Math.floor(Math.random() * pool.length)].id;
      if (wear(slot, pickId, i * 0.07)) i += 1;
    });
    commit(before);
  };
  presetBox.append(dice);

  SLOTS.forEach((slot) => {
    const meta = SLOT_META[slot];
    const group = document.createElement("div");
    group.className = "fm-slot";
    group.dataset.slot = slot;
    group.innerHTML = `
      <div class="fm-slot-head">
        <span class="fm-slot-name">${meta.icon} ${meta.label}</span>
        <span class="fm-slot-cur"></span>
      </div>
      <div class="fm-cards"></div>`;
    const cards = group.querySelector(".fm-cards");
    OUTFITS[slot].forEach((item) => {
      const card = document.createElement("button");
      card.className = "fm-card";
      card.dataset.id = item.id;
      card.innerHTML = `
        <span class="fm-delta"></span>
        ${thumbSvg(slot, item.id)}
        <span class="fm-card-name">${item.name}</span>
        <span class="fm-card-charm">魅力 +${item.charm}</span>`;
      card.onclick = () => {
        const before = charmOf(state.outfit);
        if (!wear(slot, item.id)) return;
        commit(before);
      };
      cards.append(card);
    });
    slotBox.append(group);
  });

  SLOTS.forEach((slot) => paintSlot(slot, false));
  syncStats(false);
  refreshChoices();
}
