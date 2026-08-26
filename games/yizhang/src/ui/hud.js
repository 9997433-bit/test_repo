// 局内 HUD。DOM 与类名严格按 docs/ART_DIRECTION.md §11.3 的 Fable-2 合同挂载：
// 顶带（刻度 / 计时 / 暂停）、右上播报、左下掌位坞、准星、受击去饱和、重组浮层、中央短讯。
// 这里不写样式，只按合同挂 class 和 CSS 变量（--meter / --cd / data-glove / .is-*）。

import { h, clear, formatClock } from "./dom.js";

const KILL_PIPS = 7;

function toggle(node, cls, on) {
  node.classList.toggle(cls, !!on);
}

/** 掌徽：识别色球面 + 冷却 conic 罩，选掌页和掌位坞共用。 */
export function gloveIcon() {
  const cd = h("i", { class: "yz-cd" });
  const swatch = h("i", { class: "yz-glove-swatch" }, [cd]);
  const el = h("span", { class: "yz-glove-icon" }, [swatch]);
  return { el, cd };
}

function gloveCard(keyHint) {
  const icon = gloveIcon();
  const name = h("span", { class: "yz-glove-name", text: "—" });
  const kbd = h("span", { class: "yz-kbd", text: keyHint });
  const el = h("div", { class: "yz-plate yz-glove-card" }, [icon.el, name, kbd]);
  return { el, icon, name };
}

export function createHud() {
  // ---- 顶带 ----
  const pips = [];
  const killTrack = h("div", { class: "yz-kill-track" });
  for (let i = 0; i < KILL_PIPS; i += 1) {
    const pip = h("i", { class: "yz-kill-pip" });
    pips.push(pip);
    killTrack.appendChild(pip);
  }
  const killCount = h("span", { class: "yz-kill-count yz-num", text: "0 / 7" });
  killTrack.appendChild(killCount);

  const timer = h("div", { class: "yz-plate yz-timer yz-num", text: "4:00" });
  const pauseBtn = h("button", {
    class: "yz-btn-pause yz-tap",
    type: "button",
    "aria-label": "暂停",
  });
  const top = h("div", { class: "yz-hud-top" }, [killTrack, timer, pauseBtn]);

  // ---- 掌位坞 ----
  const meterFill = h("i", { class: "yz-meter-fill" });
  const meter = h("div", { class: "yz-meter" }, [meterFill]);
  const awakenTag = h("div", { class: "yz-awaken-tag", text: "掌 意 觉 醒" });
  const statusRow = h("div", { class: "yz-status-row" });
  const cardMain = gloveCard("1");
  const cardOff = gloveCard("2");
  const dockRow = h("div", { class: "yz-dock-row" }, [cardMain.el, cardOff.el]);
  const dock = h("div", { class: "yz-glove-dock" }, [meter, awakenTag, statusRow, dockRow]);

  // ---- 中央与全屏反馈 ----
  const reticle = h("div", { class: "yz-reticle" });
  const hitFlash = h("div", { class: "yz-hit-flash" });
  const respawnNum = h("div", { class: "yz-respawn-num yz-num", text: "0.0" });
  const respawn = h("div", { class: "yz-plate yz-respawn" }, [
    h("div", { class: "yz-respawn-title", text: "重 组 中" }),
    respawnNum,
    h("div", { class: "yz-respawn-sub", text: "台面还在，站回去" }),
  ]);
  const centerNote = h("div", { class: "yz-plate yz-center-note", hidden: true });

  const el = h("div", { id: "hud" }, [
    top,
    dock,
    reticle,
    hitFlash,
    respawn,
    centerNote,
  ]);

  const maxSeen = { slap: 0.5, skill: 6, dash: 2.4, switchLock: 0.4 };
  let lastGloveId = null;
  let noteTimer = 0;
  let flashTimer = 0;

  function setCard(card, glove, active, cd, cdMax) {
    card.el.dataset.glove = (glove && glove.id) || "";
    card.name.textContent = (glove && glove.name) || "—";
    toggle(card.el, "is-active", active);
    const span = cdMax > 0.001 ? cdMax : 1;
    const k = active ? Math.min(1, Math.max(0, cd || 0) / span) : 0;
    card.icon.cd.style.setProperty("--cd", k.toFixed(3));
  }

  function chip(text) {
    return h("span", { class: "yz-plate yz-status-chip", text });
  }

  function syncStatus(self, glove) {
    clear(statusRow);
    const skillCd = Math.max(0, self.skillCd || 0);
    const dashCd = Math.max(0, self.dashCd || 0);
    const hasSkill = !!glove && glove.skillId && glove.skillId !== "none";
    if (hasSkill) statusRow.appendChild(chip(skillCd > 0.05 ? `技 ${skillCd.toFixed(1)}s` : "技 就绪"));
    statusRow.appendChild(chip(dashCd > 0.05 ? `冲 ${dashCd.toFixed(1)}s` : "冲 就绪"));
    for (const s of self.statuses || []) {
      const label = STATUS_LABEL[s.id];
      if (label) statusRow.appendChild(chip(`${label} ${Math.max(0, s.t || 0).toFixed(1)}s`));
    }
  }

  const STATUS_LABEL = {
    slow: "减速",
    freeze: "冻结",
    stun: "硬直",
    root: "定身",
    invuln: "无敌",
    sticky: "黏附",
  };

  return {
    el,
    pauseButton: pauseBtn,
    /** killfeed 挂到 #hud 里，位置由 hud.css 的 .yz-feed 负责。 */
    mountFeed(node) {
      el.insertBefore(node, dock);
    },
    reset() {
      maxSeen.slap = 0.5;
      maxSeen.skill = 6;
      maxSeen.dash = 2.4;
      lastGloveId = null;
      el.classList.remove("is-dead", "is-awakened");
      clear(statusRow);
      centerNote.hidden = true;
      hitFlash.classList.remove("is-on");
      for (const pip of pips) pip.classList.remove("is-filled");
      killCount.textContent = `0 / ${KILL_PIPS}`;
    },
    /** 受击一瞬去饱和（替代满屏红晕）。 */
    flashHit(ms = 120) {
      hitFlash.classList.add("is-on");
      clearTimeout(flashTimer);
      flashTimer = setTimeout(() => hitFlash.classList.remove("is-on"), ms);
    },
    setToast(text, ms = 1600, gold = false) {
      centerNote.textContent = text;
      centerNote.hidden = false;
      toggle(centerNote, "is-gold", gold);
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => {
        centerNote.hidden = true;
      }, ms);
    },
    update(view, selfId, ctx = {}) {
      if (!view) return;
      const killsToWin = ctx.killsToWin || KILL_PIPS;
      const left = view.timeLeft ?? 0;
      timer.textContent = formatClock(left);
      toggle(timer, "is-low", left <= 30);

      const self = (view.players || []).find((p) => p.id === selfId);
      if (!self) return;

      const gloveById = ctx.gloveById || {};
      const mainG = gloveById[self.mainId ?? self.gloveId] || null;
      const offG = gloveById[self.offhandId ?? self.gloveId] || null;
      const activeId = self.activeGloveId ?? self.gloveId;
      const activeG = gloveById[activeId] || mainG;

      // 识别色跟着当前手套走：改 #hud 的 data-glove，整棵子树的 --yz-accent 一起换。
      el.dataset.glove = activeId || "";
      if (activeG && activeG.color) el.style.setProperty("--yz-accent", activeG.color);

      const kills = self.kills || 0;
      pips.forEach((pip, i) => toggle(pip, "is-filled", i < Math.min(kills, KILL_PIPS)));
      killCount.textContent = `${kills} / ${killsToWin}`;

      if (activeId !== lastGloveId) {
        lastGloveId = activeId;
        maxSeen.slap = Math.max(0.3, (activeG && activeG.slapCooldown) || 0.5);
        maxSeen.skill = Math.max(1, (activeG && activeG.skillCooldown) || 6);
      }
      maxSeen.slap = Math.max(maxSeen.slap, self.slapCd || 0);
      maxSeen.skill = Math.max(maxSeen.skill, self.skillCd || 0);
      maxSeen.dash = Math.max(maxSeen.dash, self.dashCd || 0);
      maxSeen.switchLock = Math.max(maxSeen.switchLock, self.switchLockT || 0, ctx.switchLock || 0);

      const onOff = (self.activeSlot ?? 0) === 1;
      setCard(cardMain, mainG, !onOff, self.slapCd, maxSeen.slap);
      setCard(cardOff, offG, onOff, self.slapCd, maxSeen.slap);

      const awake = (self.awakenedT || 0) > 0;
      toggle(el, "is-awakened", awake);
      const meterValue = awake ? 1 : Math.max(0, Math.min(1, self.meter || 0));
      meter.style.setProperty("--meter", meterValue.toFixed(3));
      meterFill.style.setProperty("--meter", meterValue.toFixed(3));

      syncStatus(self, activeG);

      const dead = self.alive === false;
      toggle(el, "is-dead", dead);
      if (dead) respawnNum.textContent = Math.max(0, self.respawnT || 0).toFixed(1);
    },
    maxSeen,
  };
}
