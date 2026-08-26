// 局内 HUD。规矩：全部贴边、走 8px 网格、屏幕中间 70% 不放任何东西。
// 数字用等宽衬线，冷却用环而不是进度条，掌意条只有一条且只在满时变色。

import { h, svg, formatClock } from "./dom.js";

const RING_R = 24;
const RING_C = 2 * Math.PI * RING_R;

function makeRing(label, key) {
  const arc = svg("circle", {
    class: "yz-ring-arc",
    cx: 27,
    cy: 27,
    r: RING_R,
    "stroke-dasharray": RING_C,
    "stroke-dashoffset": 0,
  });
  const node = h("div", { class: "yz-ring", dataset: { key, ready: "1" } }, [
    svg("svg", { viewBox: "0 0 54 54", width: 54, height: 54 }, [
      svg("circle", { class: "yz-ring-bg", cx: 27, cy: 27, r: RING_R }),
      arc,
    ]),
    h("div", { class: "yz-ring-face" }, [
      h("b", { text: label.glyph }),
      h("span", { text: label.key }),
    ]),
  ]);
  return { node, arc, face: node.querySelector("b"), max: 0 };
}

export function createHud() {
  const clockValue = h("b", { class: "yz-num", text: "4:00" });
  const clockNote = h("span", { text: "先到 7 杀" });
  const clock = h("div", { class: "yz-clock" }, [clockValue, clockNote]);

  const score = h("div", { class: "yz-score" });
  const scoreRows = new Map();

  const handMain = h("div", { class: "yz-hand" }, [
    h("span", { text: "主 1" }),
    h("b", { text: "—" }),
  ]);
  const handOff = h("div", { class: "yz-hand" }, [
    h("span", { text: "副 2" }),
    h("b", { text: "—" }),
  ]);
  const meterFill = h("div", { class: "yz-meter-fill" });
  const meterTrack = h("div", { class: "yz-meter-track" }, [meterFill]);
  const meterRight = h("span", { class: "yz-num", text: "0%" });
  const glovebox = h("div", { class: "yz-glovebox" }, [
    h("div", { class: "yz-hands" }, [handMain, handOff]),
    h("div", { class: "yz-meter" }, [
      h("div", { class: "yz-meter-label" }, [h("span", { text: "掌 意" }), meterRight]),
      meterTrack,
    ]),
  ]);

  const rings = {
    slap: makeRing({ glyph: "扇", key: "LMB" }, "slap"),
    skill: makeRing({ glyph: "技", key: "E" }, "skill"),
    dash: makeRing({ glyph: "冲", key: "SHIFT" }, "dash"),
  };
  const ringBar = h("div", { class: "yz-rings" }, [
    rings.slap.node,
    rings.skill.node,
    rings.dash.node,
  ]);

  const centerTitle = h("b", { text: "" });
  const centerSub = h("span", { text: "" });
  const center = h("div", { class: "yz-center", hidden: true }, [centerTitle, centerSub]);

  const toast = h("div", { class: "yz-toast" });
  let toastTimer = 0;

  const el = h("div", { class: "yz-hud" }, [clock, score, glovebox, ringBar, center, toast]);

  const maxSeen = { slap: 0, skill: 0, dash: 2.4 };
  let lastGloveId = null;

  function setRing(ring, remaining, max, disabled) {
    const cd = Math.max(0, remaining || 0);
    const span = max > 0.001 ? max : 1;
    const k = Math.min(1, cd / span);
    ring.arc.setAttribute("stroke-dashoffset", String(RING_C * (1 - k)));
    ring.node.dataset.ready = cd <= 0.001 && !disabled ? "1" : "0";
    ring.node.dataset.disabled = disabled ? "1" : "0";
    if (disabled) ring.face.textContent = ring.face.dataset.glyph || ring.face.textContent;
  }

  function syncScore(view, selfId) {
    const players = (view.players || []).slice().sort((a, b) => b.kills - a.kills);
    const seen = new Set();
    players.forEach((p, index) => {
      seen.add(p.id);
      let row = scoreRows.get(p.id);
      if (!row) {
        row = {
          node: h("div", { class: "yz-score-row" }, [
            h("i", {}),
            h("span", { text: p.name || p.id }),
            h("b", { class: "yz-num", text: "0" }),
          ]),
        };
        row.name = row.node.querySelector("span");
        row.kills = row.node.querySelector("b");
        scoreRows.set(p.id, row);
      }
      row.node.style.setProperty("--row-color", p.color || "#7f8c9e");
      row.name.textContent = p.name || p.id;
      row.kills.textContent = String(p.kills ?? 0);
      if (p.id === selfId) row.node.dataset.self = "1";
      else delete row.node.dataset.self;
      if (p.alive === false) row.node.dataset.dead = "1";
      else delete row.node.dataset.dead;
      if (score.children[index] !== row.node) score.insertBefore(row.node, score.children[index] || null);
    });
    for (const [id, row] of scoreRows) {
      if (!seen.has(id)) {
        row.node.remove();
        scoreRows.delete(id);
      }
    }
  }

  return {
    el,
    reset() {
      maxSeen.slap = 0;
      maxSeen.skill = 0;
      lastGloveId = null;
      center.hidden = true;
      for (const row of scoreRows.values()) row.node.remove();
      scoreRows.clear();
    },
    setToast(text, ms = 1600) {
      toast.textContent = text;
      toast.dataset.on = "1";
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => delete toast.dataset.on, ms);
    },
    update(view, selfId, ctx = {}) {
      if (!view) return;
      const killsToWin = ctx.killsToWin || 7;
      clockValue.textContent = formatClock(view.timeLeft ?? 0);
      if ((view.timeLeft ?? 999) <= 30) clock.dataset.urgent = "1";
      else delete clock.dataset.urgent;
      clockNote.textContent = `先到 ${killsToWin} 杀`;

      syncScore(view, selfId);

      const self = (view.players || []).find((p) => p.id === selfId);
      if (!self) return;

      const gloveById = ctx.gloveById || {};
      const mainG = gloveById[self.mainId ?? self.gloveId] || {};
      const offG = gloveById[self.offhandId ?? self.gloveId] || {};
      const activeId = self.gloveId;
      const activeG = gloveById[activeId] || mainG;

      handMain.querySelector("b").textContent = mainG.name || "—";
      handOff.querySelector("b").textContent = offG.name || "—";
      handMain.style.setProperty("--hand-color", mainG.color || "#7f8c9e");
      handOff.style.setProperty("--hand-color", offG.color || "#7f8c9e");
      if (self.activeSlot === 1) {
        handOff.dataset.active = "1";
        delete handMain.dataset.active;
      } else {
        handMain.dataset.active = "1";
        delete handOff.dataset.active;
      }
      el.style.setProperty("--yz-accent", activeG.color || "#cbb9a0");

      if (activeId !== lastGloveId) {
        lastGloveId = activeId;
        maxSeen.slap = 0;
        maxSeen.skill = 0;
      }

      const awake = (self.awakenedT || 0) > 0;
      const meter = awake ? 1 : Math.max(0, Math.min(1, self.meter || 0));
      meterFill.style.width = `${(meter * 100).toFixed(1)}%`;
      if (awake) {
        meterTrack.dataset.awake = "1";
        meterRight.textContent = `觉醒 ${self.awakenedT.toFixed(1)}s`;
      } else {
        delete meterTrack.dataset.awake;
        meterRight.textContent = `${Math.round(meter * 100)}%`;
      }

      maxSeen.slap = Math.max(maxSeen.slap, self.slapCd || 0);
      maxSeen.skill = Math.max(maxSeen.skill, self.skillCd || 0, activeG.skillCooldown || 0);
      maxSeen.dash = Math.max(maxSeen.dash, self.dashCd || 0);
      setRing(rings.slap, self.slapCd, maxSeen.slap, false);
      setRing(rings.skill, self.skillCd, maxSeen.skill, activeG.skillId === "none");
      setRing(rings.dash, self.dashCd, maxSeen.dash, false);
      rings.skill.node.dataset.none = activeG.skillId === "none" ? "1" : "0";

      if (self.alive === false) {
        center.hidden = false;
        delete center.dataset.awake;
        centerTitle.textContent = "重 组 中";
        centerSub.textContent = `${Math.max(0, self.respawnT || 0).toFixed(1)} 秒后回台`;
      } else if (awake) {
        center.hidden = false;
        center.dataset.awake = "1";
        centerTitle.textContent = `${activeG.name || ""} 觉 醒`;
        centerSub.textContent = activeG.awakenDesc || "";
      } else {
        center.hidden = true;
      }
    },
    ringNodes: rings,
    maxSeen,
  };
}
