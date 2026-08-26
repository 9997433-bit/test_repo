/**
 * HUD logic: selection panel, command card, WC3-style tooltips,
 * allies/log side panel, localization of the DOM chrome.
 *
 * Owns no markup in index.html: every extra widget is created here at runtime
 * so the HUD stays usable even if the static markup is restyled.
 */
(function (root) {
  "use strict";
  const D = root.GameData;

  const ARMOR_KEYS = ["unarmored", "light", "medium", "heavy", "fortified", "hero"];

  const ATK_NAME = {
    zh: { normal: "普通", pierce: "穿刺", siege: "攻城", magic: "魔法", chaos: "混沌", hero: "英雄", spells: "法术" },
    en: { normal: "Normal", pierce: "Pierce", siege: "Siege", magic: "Magic", chaos: "Chaos", hero: "Hero", spells: "Spells" },
  };
  const ARM_NAME = {
    zh: { unarmored: "无甲", light: "轻甲", medium: "中甲", heavy: "重甲", fortified: "城甲", hero: "英雄甲", divine: "神圣甲" },
    en: { unarmored: "Unarmored", light: "Light", medium: "Medium", heavy: "Heavy", fortified: "Fortified", hero: "Hero", divine: "Divine" },
  };
  const RACE_COLOR = { human: "#6aa4e8", orc: "#c45a2a", nightelf: "#5d8a4a", undead: "#80deea" };

  /** Strings the shared data.js pack does not carry (data.js is owned elsewhere). */
  const EXTRA = {
    zh: {
      atk: "攻击", arm: "护甲", rng: "射程", spd: "攻速", dps: "DPS",
      close: "关闭", hotkey: "热键", cost: "花费", goldShort: "金",
      vsArmor: "护甲克制", vsWave: "对当前波次", perHit: "每击",
      cannotAir: "无法攻击空中单位", canAir: "可攻击空中", groundOnly: "仅对地",
      splash: "溅射", slowFx: "减速", poisonFx: "毒素", chainFx: "闪电链", rootFx: "定身",
      tier: "阶", maxTier: "已达最高阶", needGold: "黄金不足", refundText: "立即返还",
      upgradeTo: "升级至", stopBuild: "取消建造", nothing: "无",
      logTitle: "战斗日志", alliesTitle: "盟友", noLog: "尚无战报",
      keepName: "艾泽拉斯要塞（你）", commander: "指挥官", forces: "驻防部队",
      towersWord: "座", totalWord: "合计", waveWord: "波次", enemiesWord: "场上敌军",
      manaShort: "法力", cdWord: "冷却", readyWord: "就绪", castable: "可施放",
      immuneNote: "该波次魔法免疫", flyNote: "该波次为空中单位",
      panelHint: "F9 日志 · F11 盟友 · Esc 关闭",
      resumeHint: "Esc / F10 返回战场",
      noSelection: "选择一座塔或一名敌军，查看魔兽式攻击护甲克制。",
      sellTip: "出售该塔，立即返还已投入黄金的 75%。",
      cancelTip: "取消当前建造预览并取消选择。",
    },
    en: {
      atk: "Attack", arm: "Armor", rng: "Range", spd: "Speed", dps: "DPS",
      close: "Close", hotkey: "Hotkey", cost: "Cost", goldShort: "g",
      vsArmor: "Damage vs armor", vsWave: "Vs current wave", perHit: "per hit",
      cannotAir: "Cannot attack air", canAir: "Hits air", groundOnly: "Ground only",
      splash: "Splash", slowFx: "Slow", poisonFx: "Poison", chainFx: "Chain", rootFx: "Root",
      tier: "Tier", maxTier: "Max tier reached", needGold: "Not enough gold", refundText: "refunded instantly",
      upgradeTo: "Upgrade to", stopBuild: "Stop build", nothing: "none",
      logTitle: "Combat Log", alliesTitle: "Allies", noLog: "No reports yet",
      keepName: "Azeroth Keep (you)", commander: "Commander", forces: "Garrison",
      towersWord: "towers", totalWord: "Total", waveWord: "Wave", enemiesWord: "Enemies alive",
      manaShort: "Mana", cdWord: "Cooldown", readyWord: "ready", castable: "Castable",
      immuneNote: "This wave is spell immune", flyNote: "This wave is airborne",
      panelHint: "F9 log · F11 allies · Esc close",
      resumeHint: "Esc / F10 back to battle",
      noSelection: "Select a tower or an enemy to read the WC3 attack/armor counters.",
      sellTip: "Sell this tower and refund 75% of the gold invested.",
      cancelTip: "Clear the build preview and deselect.",
    },
  };

  const PANEL_CSS = [
    "#hud-panel{position:absolute;top:12px;right:12px;width:min(360px,44vw);max-height:min(460px,74%);",
    "display:flex;flex-direction:column;z-index:9;color:#f3e6c4;font-size:12px;",
    "background:linear-gradient(#2c2418,#16110c);border:3px solid #d7b056;",
    "box-shadow:0 14px 44px #000,inset 0 0 30px rgba(0,0,0,.45);}",
    "#hud-panel.hidden{display:none;}",
    "#hud-panel .hp-head{display:flex;gap:6px;align-items:center;padding:6px;",
    "border-bottom:2px solid #5a4a28;background:linear-gradient(#3a2f1e,#221a12);}",
    "#hud-panel .hp-head button{background:linear-gradient(#4a3c28,#2a2118);color:inherit;",
    "border:1px solid #a88422;border-radius:3px;padding:3px 10px;font:inherit;font-size:12px;cursor:pointer;}",
    "#hud-panel .hp-head button:hover{filter:brightness(1.18);border-color:#e4c04a;}",
    "#hud-panel .hp-head button.active{border-color:#e4c04a;background:linear-gradient(#6a5428,#3a2c14);color:#ffe08a;}",
    "#hud-panel .hp-head .sp{flex:1;}",
    "#hud-panel-body{overflow-y:auto;padding:8px 10px;line-height:1.5;}",
    "#hud-panel .hp-foot{padding:4px 10px 6px;color:#a88422;font-size:11px;border-top:1px solid rgba(168,132,34,.35);}",
    ".hud-row{display:flex;gap:8px;padding:3px 0;border-bottom:1px dashed rgba(168,132,34,.22);}",
    ".hud-row .t{color:#a88422;flex:0 0 46px;font-variant-numeric:tabular-nums;}",
    ".hud-row .m{flex:1;}",
    ".hud-row.fresh .m{color:#ffe08a;}",
    ".hud-ally{display:grid;grid-template-columns:12px 1fr auto;gap:8px;align-items:center;",
    "padding:4px 0;border-bottom:1px dashed rgba(168,132,34,.22);}",
    ".hud-ally i{width:10px;height:10px;border-radius:2px;display:block;}",
    ".hud-ally .v{color:#ffe08a;font-variant-numeric:tabular-nums;}",
    ".hud-head{color:#e4c04a;margin:8px 0 2px;letter-spacing:.5px;}",
    ".hud-head:first-child{margin-top:0;}",
    ".hud-dim{color:#b9a57a;}",
    ".cmd-btn.cmd-dim{opacity:.42;}",
    '.cmd-btn[data-deny="1"]{cursor:default;}',
    ".cmd-btn:empty{opacity:.28;cursor:default;box-shadow:none;}",
    ".cmd-btn:empty:hover{filter:none;border-color:#a88422;}",
    ".cmd-btn.kb-flash{box-shadow:0 0 0 2px #ffe08a,inset 0 0 12px rgba(255,224,138,.55);}",
    ".cmd-btn.kb-deny{box-shadow:0 0 0 2px #e24a3b;}",
    "#tooltip{max-width:330px;}",
    "#tooltip .tt-row{margin:2px 0;}",
    "#tooltip .tt-dim{color:#b9a57a;}",
    "#tooltip .tt-warn{color:#ef7a6d;}",
    "#tooltip .tt-good{color:#9ade8a;}",
    "#tooltip .tt-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px 8px;margin-top:5px;",
    "padding-top:5px;border-top:1px solid rgba(168,132,34,.4);}",
    "#tooltip .tt-grid span{font-size:11px;color:#b9a57a;}",
    "#tooltip .tt-grid b{font-variant-numeric:tabular-nums;margin-left:3px;}",
    "#tooltip .tt-grid .up b{color:#9ade8a;}",
    "#tooltip .tt-grid .down b{color:#ef7a6d;}",
    "#tooltip .tt-grid .flat b{color:#e8dab4;}",
    "#tooltip .tt-hk{margin-top:5px;color:#e4c04a;}",
  ].join("");

  function $(id) {
    return typeof document === "undefined" ? null : document.getElementById(id);
  }
  function qs(sel, ctx) {
    try {
      return (ctx || document).querySelector(sel);
    } catch (e) {
      return null;
    }
  }
  function qsa(sel, ctx) {
    try {
      return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
    } catch (e) {
      return [];
    }
  }
  function setText(el, value) {
    if (el && el.textContent !== value) el.textContent = value;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;";
    });
  }
  function num(v, digits) {
    const n = Number(v) || 0;
    return digits ? n.toFixed(digits) : String(Math.round(n));
  }
  function clock(seconds) {
    const s = Math.max(0, seconds | 0);
    return ((s / 60) | 0) + ":" + ("0" + (s % 60)).slice(-2);
  }
  function damageMultiplier(attackType, armorType) {
    const S = root.SimCore;
    if (S && typeof S.damageMultiplier === "function") return S.damageMultiplier(attackType, armorType);
    return 1;
  }
  function applyHit(base, attackType, armorType, armor, opts) {
    const S = root.SimCore;
    if (S && typeof S.applyHit === "function") return S.applyHit(base, attackType, armorType, armor, opts);
    return { damage: base, multiplier: 1, blocked: null };
  }

  function HUD(app) {
    this.app = app;
    this.tooltip = $("tooltip");
    this.slots = new Array(12).fill(null);
    this._cardIsBuild = true;
    this._tip = null;
    this._panelTab = "log";
    this._panelOpen = false;
    this._panelSig = "";
    this._chromeSig = "";
    this._ensureStyles();
    this._ensurePanel();
  }

  /* ------------------------------------------------------------------ i18n */

  HUD.prototype.lang = function () {
    const app = this.app || {};
    const l = (app.game && app.game.lang) || app.lang || "zh";
    return l === "en" ? "en" : "zh";
  };

  HUD.prototype.str = function (key) {
    const lang = this.lang();
    const pack = D && D.STR ? D.STR[lang] || D.STR.zh : null;
    if (pack && pack[key] != null) return pack[key];
    const extra = EXTRA[lang] || EXTRA.zh;
    if (extra[key] != null) return extra[key];
    return key;
  };

  HUD.prototype.atkName = function (type) {
    const pack = ATK_NAME[this.lang()] || ATK_NAME.zh;
    return pack[type] || type;
  };
  HUD.prototype.armName = function (type) {
    const pack = ARM_NAME[this.lang()] || ARM_NAME.zh;
    return pack[type] || type;
  };
  HUD.prototype.localName = function (obj) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    return obj[this.lang()] || obj.zh || obj.en || "";
  };

  /* --------------------------------------------------------- runtime chrome */

  HUD.prototype._ensureStyles = function () {
    if (typeof document === "undefined" || $("hud-runtime-style")) return;
    try {
      const style = document.createElement("style");
      style.id = "hud-runtime-style";
      style.textContent = PANEL_CSS;
      (document.head || document.documentElement).appendChild(style);
    } catch (e) { /* non-DOM host */ }
  };

  HUD.prototype._ensurePanel = function () {
    if (typeof document === "undefined") return;
    let panel = $("hud-panel");
    if (!panel) {
      const host = $("stage-wrap") || document.body;
      if (!host) return;
      panel = document.createElement("div");
      panel.id = "hud-panel";
      panel.className = "hidden";
      panel.innerHTML =
        '<div class="hp-head">' +
        '<button type="button" data-tab="allies"></button>' +
        '<button type="button" data-tab="log"></button>' +
        '<span class="sp"></span>' +
        '<button type="button" data-tab-close="1">✕</button>' +
        "</div>" +
        '<div id="hud-panel-body"></div>' +
        '<div class="hp-foot"></div>';
      host.appendChild(panel);
      const self = this;
      panel.addEventListener("click", function (e) {
        const btn = e.target && e.target.closest ? e.target.closest("button") : null;
        if (!btn) return;
        if (btn.getAttribute("data-tab-close")) {
          self.closePanel();
        } else if (btn.getAttribute("data-tab")) {
          self.openPanel(btn.getAttribute("data-tab"));
        }
        if (self.app && self.app.audio) self.app.audio.click();
      });
    }
    this.panel = panel;
    this.panelBody = $("hud-panel-body");
  };

  /* ------------------------------------------------------------ side panel */

  HUD.prototype.isPanelOpen = function () {
    return !!this._panelOpen;
  };

  HUD.prototype.openPanel = function (tab) {
    this._ensurePanel();
    if (!this.panel) return;
    this._panelTab = tab === "allies" ? "allies" : "log";
    this._panelOpen = true;
    this.panel.classList.remove("hidden");
    this._panelSig = "";
    this._syncPanelTabs();
    this.renderPanel(this.app ? this.app.game : null);
  };

  HUD.prototype.closePanel = function () {
    this._panelOpen = false;
    if (this.panel) this.panel.classList.add("hidden");
  };

  /** Click on Allies/Log: open that tab, or close when it is already showing. */
  HUD.prototype.togglePanel = function (tab) {
    if (this._panelOpen && this._panelTab === tab) this.closePanel();
    else this.openPanel(tab);
    return this._panelOpen;
  };

  HUD.prototype._syncPanelTabs = function () {
    if (!this.panel) return;
    const self = this;
    qsa(".hp-head button[data-tab]", this.panel).forEach(function (b) {
      const tab = b.getAttribute("data-tab");
      b.textContent = self.str(tab === "allies" ? "allies" : "log");
      b.classList.toggle("active", tab === self._panelTab);
    });
    const foot = qs(".hp-foot", this.panel);
    setText(foot, this.str("panelHint"));
  };

  HUD.prototype.renderPanel = function (game) {
    if (!this._panelOpen || !this.panelBody) return;
    const html = this._panelTab === "allies" ? this._alliesHtml(game) : this._logHtml(game);
    const sig = this._panelTab + "|" + this.lang() + "|" + html.length + "|" + html.charCodeAt(0);
    if (sig === this._panelSig && this.panelBody.innerHTML === html) return;
    this._panelSig = sig;
    this.panelBody.innerHTML = html;
  };

  HUD.prototype._logHtml = function (game) {
    const entries = game && game.log ? game.log : [];
    if (!entries.length) return '<div class="hud-dim">' + esc(this.str("noLog")) + "</div>";
    const out = ['<div class="hud-head">' + esc(this.str("logTitle")) + "</div>"];
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      out.push(
        '<div class="hud-row' + (i === 0 ? " fresh" : "") + '">' +
        '<span class="t">' + esc(clock(e.t)) + "</span>" +
        '<span class="m">' + esc(e.msg) + "</span></div>"
      );
    }
    return out.join("");
  };

  HUD.prototype._alliesHtml = function (game) {
    const self = this;
    const out = [];
    out.push('<div class="hud-head">' + esc(this.str("alliesTitle")) + "</div>");
    if (!game) {
      out.push('<div class="hud-dim">' + esc(this.str("noSelection")) + "</div>");
      return out.join("");
    }
    function row(color, name, value) {
      return '<div class="hud-ally"><i style="background:' + color + '"></i>' +
        '<span class="n">' + esc(name) + "</span>" +
        '<span class="v">' + esc(value) + "</span></div>";
    }
    out.push(row("#e4c04a", this.str("keepName"),
      this.str("gold") + " " + (game.gold | 0) + " · " +
      this.str("lumber") + " " + (game.lumber | 0) + " · " +
      this.str("food") + " " + (game.lives | 0)));

    const h = game.hero;
    if (h && h.def) {
      out.push(row(h.def.color || "#f5e6a8",
        this.str("commander") + " · " + this.localName(h.def.name) + " (" + this.localName(h.def.title) + ")",
        "HP " + Math.max(0, h.hp | 0) + "/" + h.maxHp + " · " + this.str("manaShort") + " " + (h.mana | 0) + "/" + h.maxMana));
    }

    out.push('<div class="hud-head">' + esc(this.str("forces")) + "</div>");
    const byRace = {};
    let totalDps = 0;
    (game.towers || []).forEach(function (t) {
      const key = t.race || (t.def && t.def.race) || "human";
      const dps = t.rate > 0 ? t.dmg / t.rate : 0;
      totalDps += dps;
      if (!byRace[key]) byRace[key] = { n: 0, dps: 0 };
      byRace[key].n += 1;
      byRace[key].dps += dps;
    });
    ["human", "orc", "nightelf", "undead"].forEach(function (race) {
      const info = byRace[race] || { n: 0, dps: 0 };
      out.push(row(RACE_COLOR[race], self.str(race),
        info.n + " " + self.str("towersWord") + " · " + self.str("dps") + " " + num(info.dps, 1)));
    });
    out.push(row("#cfd8dc", this.str("totalWord"),
      (game.towers ? game.towers.length : 0) + " " + this.str("towersWord") + " · " +
      this.str("dps") + " " + num(totalDps, 1)));

    const waveCount = game.waves ? game.waves.length : 30;
    out.push('<div class="hud-head">' + esc(this.str("waveWord")) + "</div>");
    out.push(row("#8d6e63", this.str("waveWord"),
      Math.min(game.waveIndex + 1, waveCount) + " / " + waveCount));
    out.push(row("#e24a3b", this.str("enemiesWord"), String(game.creeps ? game.creeps.length : 0)));
    return out.join("");
  };

  /* --------------------------------------------------------------- chrome  */

  HUD.prototype.refreshChrome = function () {
    const game = this.app ? this.app.game : null;
    setText($("btn-menu"), this.str("menu"));
    setText($("btn-allies"), this.str("allies"));
    setText($("btn-log"), this.str("log"));
    setText($("btn-settings"), this.str("settings"));
    setText($("btn-next"), this.str("nextWave") + " (N)");
    setText($("btn-pause"), (game && game.paused ? this.str("resume") : this.str("pause")) + " (Space)");
    setText($("btn-speed"), "×" + (game ? game.speed : 1));
    const tips = {
      "btn-next": this.str("nextWave") + "  [N]",
      "btn-pause": this.str("pause") + "  [Space / P]",
      "btn-speed": this.str("speed") + "  [+ / -]",
      "btn-menu": this.str("menu") + "  [F10 / Esc]",
      "btn-allies": this.str("allies") + "  [F11]",
      "btn-log": this.str("log") + "  [F9]",
      "btn-settings": this.str("settings"),
    };
    Object.keys(tips).forEach(function (id) {
      const el = $(id);
      if (!el) return;
      // Custom tooltip only: a native title would double up on hover.
      el.setAttribute("data-tip", tips[id]);
      if (el.hasAttribute("title")) el.removeAttribute("title");
    });
    this._syncPanelTabs();
    this._chromeSig = "";
  };

  HUD.prototype._chrome = function (game) {
    const sig = (game.paused ? "p" : "-") + game.speed + this.lang();
    if (sig === this._chromeSig) return;
    this._chromeSig = sig;
    setText($("btn-pause"), (game.paused ? this.str("resume") : this.str("pause")) + " (Space)");
    setText($("btn-speed"), "×" + game.speed);
  };

  /**
   * Re-label every static piece of chrome for the active language.
   * Elements carrying data-i18n win; the rest is matched structurally so the
   * markup can be restyled without breaking localization.
   */
  HUD.prototype.applyLanguage = function () {
    if (typeof document === "undefined") return;
    const self = this;
    const game = this.app ? this.app.game : null;

    qsa("[data-i18n]").forEach(function (el) {
      setText(el, self.str(el.getAttribute("data-i18n")));
    });

    setText($("menu-title"), this.str("title"));
    setText($("menu-sub"), this.str("subtitle"));
    setText($("btn-restart"), this.str("restart"));
    setText($("btn-close-settings"), this.str("close"));
    setText(qs("#settings-overlay .panel h1"), this.str("settings"));
    setText(qs("#start-overlay .howto"), this.str("howTo"));
    if (document.title !== undefined) document.title = this.str("title") + " · Azeroth Keep TD";

    const startBtn = $("btn-start");
    if (startBtn) {
      const resumable = !!(game && !game.ended && !this.app.pendingNewMatch);
      setText(startBtn, resumable ? this.str("resume") : this.str("start"));
    }

    qsa("[data-diff]").forEach(function (b) {
      setText(b, self.str(b.getAttribute("data-diff")));
    });
    qsa("[data-hero]").forEach(function (b) {
      setText(b, self.str(b.getAttribute("data-hero")));
    });

    this._rowLabel(qs("[data-diff]"), this.str("difficulty"));
    this._rowLabel(qs("[data-hero]"), this.str("hero"));
    this._rowLabel($("opt-lang"), this.str("lang"));
    this._rowLabel($("opt-vol"), this.str("volume"));
    this._inlineLabel($("opt-range"), this.str("showRange"));
    this._inlineLabel($("opt-dmg"), this.str("dmgNumbers"));

    [["stat-atk", "atk"], ["stat-arm", "arm"], ["stat-rng", "rng"], ["stat-spd", "spd"]].forEach(function (pair) {
      self._statLabel($(pair[0]), self.str(pair[1]));
    });

    if (!game) {
      setText($("sel-name"), this.str("title"));
      setText($("sel-flavor"), this.str("noSelection"));
    }
    this.refreshChrome();
    if (this._panelOpen) {
      this._panelSig = "";
      this.renderPanel(game);
    }
  };

  /** `<div class="row"><label>…</label><control/></div>` — relabel the row. */
  HUD.prototype._rowLabel = function (control, text) {
    if (!control) return;
    const row = control.closest ? control.closest(".row") : null;
    const label = row ? qs("label", row) : null;
    if (label && !label.contains(control)) setText(label, text);
  };

  /** `<label><input/> text</label>` — replace only the trailing text node. */
  HUD.prototype._inlineLabel = function (control, text) {
    if (!control || !control.parentNode) return;
    const label = control.closest ? control.closest("label") : control.parentNode;
    if (!label) return;
    let node = null;
    for (let i = label.childNodes.length - 1; i >= 0; i--) {
      if (label.childNodes[i].nodeType === 3) { node = label.childNodes[i]; break; }
    }
    const value = " " + text;
    if (node) { if (node.nodeValue !== value) node.nodeValue = value; }
    else label.appendChild(document.createTextNode(value));
  };

  /** `<div>攻击 <b id="stat-atk">…</b></div>` — replace the leading text node. */
  HUD.prototype._statLabel = function (valueEl, text) {
    if (!valueEl || !valueEl.parentNode) return;
    const holder = valueEl.parentNode;
    let node = null;
    for (let i = 0; i < holder.childNodes.length; i++) {
      if (holder.childNodes[i].nodeType === 3) { node = holder.childNodes[i]; break; }
    }
    const value = text + " ";
    if (node) { if (node.nodeValue !== value) node.nodeValue = value; }
    else holder.insertBefore(document.createTextNode(value), holder.firstChild);
  };

  /* ---------------------------------------------------------------- update */

  HUD.prototype.update = function (game) {
    if (!game) return;
    const waveCount = game.waves ? game.waves.length : 30;
    setText($("res-gold"), String(game.gold | 0));
    setText($("res-lumber"), String(game.lumber | 0));
    setText($("res-lives"), String(game.lives | 0));
    setText($("res-wave"), Math.min(game.waveIndex + 1, waveCount) + " / " + waveCount);
    setText($("res-time"), clock(game.time));
    const log = game.log && game.log[0];
    setText($("logline"), log ? log.msg : "");
    this._chrome(game);
    this._selection(game);
    this._commands(game);
    this.renderPanel(game);
    this.refreshTip();
  };

  HUD.prototype._selection = function (game) {
    const sel = game.selected;
    const hp = $("bar-hp");
    const mp = $("bar-mp");
    const sAtk = $("stat-atk");
    const sArm = $("stat-arm");
    const sRng = $("stat-rng");
    const sSpd = $("stat-spd");
    function bar(el, pct) {
      const v = Math.max(0, Math.min(100, pct)) + "%";
      if (el && el.style.width !== v) el.style.width = v;
    }
    if (!sel) {
      setText($("sel-name"), this.str("title"));
      setText($("sel-flavor"), this.str("noSelection"));
      bar(hp, 0);
      bar(mp, 0);
      setText($("hp-text"), "");
      setText($("mp-text"), "");
      setText(sAtk, "—");
      setText(sArm, "—");
      setText(sRng, "—");
      setText(sSpd, "—");
      this._portrait(null);
      return;
    }
    if (sel.kind === "tower") {
      setText($("sel-name"), this.localName(sel.def.name) + "  T" + sel.tier);
      setText($("sel-flavor"), this.localName(sel.def.desc) + "  " + this._counterLine(sel, game));
      bar(hp, 100);
      bar(mp, 0);
      setText($("hp-text"), "HP  ∞");
      setText($("mp-text"), "");
      setText(sAtk, sel.dmg + " " + this.atkName(sel.attackType) +
        " · " + this.str("dps") + " " + num(sel.rate > 0 ? sel.dmg / sel.rate : 0, 1));
      setText(sArm, sel.def.armor + " " + this.armName("fortified"));
      setText(sRng, String(sel.range | 0));
      setText(sSpd, sel.rate.toFixed(2) + "s");
      this._portrait(sel);
    } else if (sel.kind === "hero") {
      setText($("sel-name"), this.localName(sel.def.name) + " · " + this.localName(sel.def.title));
      setText($("sel-flavor"), this.lang() === "zh" ? "右键移动，Q/W/E 施法。" : "Right-click to move, Q/W/E to cast.");
      bar(hp, 100 * sel.hp / sel.maxHp);
      bar(mp, 100 * sel.mana / sel.maxMana);
      setText($("hp-text"), Math.max(0, sel.hp | 0) + " / " + sel.maxHp);
      setText($("mp-text"), (sel.mana | 0) + " / " + sel.maxMana);
      setText(sAtk, sel.def.dmg + " " + this.atkName("hero"));
      setText(sArm, "4 " + this.armName("hero"));
      setText(sRng, String(sel.def.range));
      setText(sSpd, sel.def.rate + "s");
      this._portrait(sel);
    } else {
      const n = this.localName(sel.name) || "Creep";
      setText($("sel-name"), n + (sel.boss ? " ★" : "") + (sel.flying ? " ✈" : ""));
      setText($("sel-flavor"), this.str("arm") + " " + this.armName(sel.armorType) + " " + sel.armor +
        (sel.spellImmune ? " · " + this.str("immuneNote") : "") +
        (sel.flying ? " · " + this.str("flyNote") : ""));
      bar(hp, 100 * sel.hp / sel.maxHp);
      bar(mp, 0);
      setText($("hp-text"), Math.max(0, sel.hp | 0) + " / " + sel.maxHp);
      setText($("mp-text"), "");
      setText(sAtk, "—");
      setText(sArm, sel.armor + " " + this.armName(sel.armorType));
      setText(sRng, "—");
      setText(sSpd, String(sel.speed | 0));
      this._portrait(sel);
    }
  };

  HUD.prototype._portrait = function (sel) {
    const canvas = $("portrait");
    const r = this.app ? this.app.renderer : null;
    if (canvas && r && typeof r.drawPortrait === "function") r.drawPortrait(canvas, sel);
  };

  /** "vs 骑士（重甲 5）×1.0 → 每击 21" for the selected tower. */
  HUD.prototype._counterLine = function (tower, game) {
    const wave = this.currentWave(game);
    if (!wave) return "[" + this.atkName(tower.attackType) + "]";
    const res = applyHit(tower.dmg, tower.attackType, wave.armorType, wave.armor, {
      flying: wave.flying,
      canHitFlying: tower.canHitFlying !== false,
      spellImmune: wave.spellImmune,
    });
    const head = this.str("vsWave") + " " + this.localName(wave.name) +
      "(" + this.armName(wave.armorType) + " " + wave.armor + ")";
    if (res.blocked === "flying") return head + " · " + this.str("cannotAir");
    if (res.blocked === "immune") return head + " · " + this.str("immuneNote");
    return head + " ×" + num(res.multiplier, 2) + " → " + this.str("perHit") + " " + num(res.damage);
  };

  HUD.prototype.currentWave = function (game) {
    if (!game || !game.waves || !game.waves.length) return null;
    const i = Math.min(game.waveIndex, game.waves.length - 1);
    return game.waves[i] || null;
  };

  /* --------------------------------------------------------- command card */

  HUD.prototype._commands = function (game) {
    const slots = this._cmdLabels(game);
    this.slots = slots;
    const grid = $("cmd");
    if (!grid) return;
    const buttons = qsa(".cmd-btn", grid);
    for (let i = 0; i < buttons.length; i++) {
      const b = buttons[i];
      const info = slots[i] || null;
      const sig = info
        ? [info.act, info.label, info.dim ? 1 : 0, info.ready ? 1 : 0, info.deny ? 1 : 0].join("|")
        : "";
      if (b.dataset.sig !== sig) {
        b.dataset.sig = sig;
        b.innerHTML = info ? '<span class="hk">' + info.hk + "</span>" + info.label : "";
        b.dataset.act = info ? info.act : "";
        b.classList.toggle("cmd-dim", !info || !!info.dim);
        b.classList.toggle("ready", !!(info && info.ready));
        b.setAttribute("aria-disabled", info ? String(!!info.deny) : "true");
        if (info && info.deny) b.dataset.deny = "1";
        else delete b.dataset.deny;
        // Native `disabled` swallows hover events, which would hide the
        // tooltip exactly when the player needs to know why an action is
        // unavailable, so availability is expressed with classes instead.
        if (b.disabled) b.disabled = false;
        if (b.title) b.removeAttribute("title");
      }
    }
  };

  HUD.prototype.slotAt = function (i) {
    return this.slots && this.slots[i] ? this.slots[i] : null;
  };

  HUD.prototype.buildSlots = function (game) {
    const towers = (D && D.TOWERS) || [];
    const slots = new Array(12).fill(null);
    const gold = game ? game.gold : 0;
    for (let i = 0; i < 12 && i < towers.length; i++) {
      const def = towers[i];
      const cost = def.cost[0];
      slots[i] = {
        hk: "QWERASDFZXCV".charAt(i),
        act: "build-" + def.id,
        label: this.localName(def.name) + "<br>" + cost,
        dim: gold < cost,
        deny: false,
        ready: !!(game && game.buildId === def.id),
        tip: "build",
        def: def,
      };
    }
    return slots;
  };

  HUD.prototype._cmdLabels = function (game) {
    const sel = game ? game.selected : null;
    if (sel && sel.kind === "tower") {
      this._cardIsBuild = false;
      return this._towerSlots(game, sel);
    }
    if (sel && sel.kind === "hero") {
      this._cardIsBuild = false;
      return this._heroSlots(game, sel);
    }
    this._cardIsBuild = true;
    return this.buildSlots(game);
  };

  HUD.prototype._towerSlots = function (game, t) {
    const L = this.lang();
    const slots = new Array(12).fill(null);
    const maxed = t.tier >= 3;
    const upCost = maxed ? 0 : t.def.cost[t.tier];
    const poor = !maxed && game.gold < upCost;
    slots[0] = {
      hk: "U", act: "upgrade",
      label: maxed
        ? (L === "zh" ? "已满级" : "Max")
        : this.str("upgrade") + "<br>" + upCost + this.str("goldShort"),
      dim: maxed || poor,
      deny: maxed || poor,
      ready: !maxed && !poor,
      tip: "upgrade",
      tower: t,
    };
    const refund = Math.floor(t.invested * 0.75);
    slots[1] = {
      hk: "S", act: "sell",
      label: this.str("sell") + "<br>" + refund + this.str("goldShort"),
      ready: true,
      tip: "sell",
      tower: t,
    };
    slots[11] = {
      hk: "Esc", act: "cancel-build",
      label: this.str("stopBuild"),
      tip: "cancel",
    };
    return slots;
  };

  HUD.prototype._heroSlots = function (game, h) {
    const slots = new Array(12).fill(null);
    const self = this;
    [["q", "Q"], ["w", "W"], ["e", "E"]].forEach(function (pair, i) {
      const ab = h.def[pair[0]];
      if (!ab) return;
      const cd = h.cd ? h.cd[pair[0]] || 0 : 0;
      const blocked = cd > 0 || h.mana < (ab.mana || 0);
      slots[i] = {
        hk: pair[1],
        act: "cast-" + pair[0],
        label: self.localName(ab) + (ab.mana ? "<br>" + ab.mana + "mp" : ""),
        dim: blocked,
        deny: blocked,
        ready: !blocked,
        tip: "ability",
        hero: h,
        slotKey: pair[0],
        ability: ab,
      };
    });
    slots[11] = { hk: "Esc", act: "cancel-build", label: this.str("stopBuild"), tip: "cancel" };
    return slots;
  };

  /** Hotkey → command. Falls back to the build card so towers stay reachable. */
  HUD.prototype.resolveHotkey = function (ch) {
    if (!ch) return null;
    const up = String(ch).toUpperCase();
    const slots = this.slots || [];
    for (let i = 0; i < slots.length; i++) {
      if (slots[i] && slots[i].hk === up) return { index: i, slot: slots[i], fallback: false };
    }
    if (!this._cardIsBuild) {
      const build = this.buildSlots(this.app ? this.app.game : null);
      for (let i = 0; i < build.length; i++) {
        if (build[i] && build[i].hk === up) return { index: -1, slot: build[i], fallback: true };
      }
    }
    return null;
  };

  HUD.prototype.flashSlot = function (index, denied) {
    const grid = $("cmd");
    if (!grid || index < 0) return;
    const b = qsa(".cmd-btn", grid)[index];
    if (!b) return;
    const cls = denied ? "kb-deny" : "kb-flash";
    b.classList.add(cls);
    if (typeof setTimeout === "function") {
      setTimeout(function () { b.classList.remove(cls); }, 160);
    }
  };

  /* -------------------------------------------------------------- tooltips */

  /** Raw tooltip, kept for API compatibility with earlier callers. */
  HUD.prototype.showTip = function (html, x, y) {
    this._tip = { kind: "html", html: html, x: x, y: y };
    this._paintTip(true);
  };

  /** Command-card button: tooltip stays live while the game state changes. */
  HUD.prototype.showCmdTip = function (index, x, y) {
    this._tip = { kind: "cmd", index: index, x: x, y: y };
    this._paintTip(true);
  };

  /** Unit under the cursor on the battlefield. */
  HUD.prototype.showEntityTip = function (ent, x, y) {
    if (!ent) { this.hideTip(); return; }
    this._tip = { kind: "entity", ent: ent, x: x, y: y };
    this._paintTip(true);
  };

  HUD.prototype.showTextTip = function (title, body, x, y) {
    this._tip = { kind: "text", title: title, body: body, x: x, y: y };
    this._paintTip(true);
  };

  HUD.prototype.moveTip = function (x, y) {
    if (!this._tip) return;
    this._tip.x = x;
    this._tip.y = y;
    this._paintTip(true);
  };

  HUD.prototype.hideTip = function () {
    this._tip = null;
    if (this.tooltip) this.tooltip.classList.remove("show");
  };

  HUD.prototype.refreshTip = function () {
    if (this._tip) this._paintTip(false);
  };

  HUD.prototype.tipKind = function () {
    return this._tip ? this._tip.kind : null;
  };
  HUD.prototype.tipEntity = function () {
    return this._tip && this._tip.kind === "entity" ? this._tip.ent : null;
  };

  HUD.prototype._paintTip = function (reposition) {
    const t = this._tip;
    if (!t) return;
    let html = "";
    if (t.kind === "cmd") html = this.cmdTipHtml(t.index);
    else if (t.kind === "entity") html = this.entityTipHtml(t.ent);
    else if (t.kind === "html") html = t.html;
    else html = "<h4>" + esc(t.title) + "</h4>" + (t.body ? '<div class="tt-row tt-dim">' + esc(t.body) + "</div>" : "");
    if (!html) { this.hideTip(); return; }
    const el = this.tooltip || (this.tooltip = $("tooltip"));
    if (!el) return;
    const changed = el.innerHTML !== html;
    if (changed) el.innerHTML = html;
    el.classList.add("show");
    if (!changed && !reposition) return;
    let left = t.x + 16;
    let top = t.y + 16;
    try {
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth || 1280;
      const vh = window.innerHeight || 720;
      if (left + r.width > vw - 8) left = Math.max(8, t.x - r.width - 16);
      if (top + r.height > vh - 8) top = Math.max(8, t.y - r.height - 16);
    } catch (e) { /* ignore */ }
    const l = left + "px";
    const tp = top + "px";
    if (el.style.left !== l) el.style.left = l;
    if (el.style.top !== tp) el.style.top = tp;
  };

  HUD.prototype.cmdTipHtml = function (index) {
    const slot = this.slotAt(index);
    const game = this.app ? this.app.game : null;
    if (!slot || !game) return "";
    if (slot.tip === "build") return this._tipBuild(slot, game);
    if (slot.tip === "upgrade") return this._tipUpgrade(slot, game);
    if (slot.tip === "sell") return this._tipSell(slot, game);
    if (slot.tip === "ability") return this._tipAbility(slot, game);
    if (slot.tip === "cancel") {
      return "<h4>" + esc(this.str("stopBuild")) + "</h4>" +
        '<div class="tt-row tt-dim">' + esc(this.str("cancelTip")) + "</div>" + this._tipHotkey(slot);
    }
    return "";
  };

  HUD.prototype._tipHotkey = function (slot) {
    return '<div class="tt-hk">' + esc(this.str("hotkey")) + " [" + esc(slot.hk) + "]</div>";
  };

  /** Attack-type × armor-type multiplier grid, WC3 counter table style. */
  HUD.prototype._multiplierGrid = function (attackType) {
    const self = this;
    const cells = ARMOR_KEYS.map(function (armor) {
      const m = damageMultiplier(attackType, armor);
      const cls = m > 1.001 ? "up" : m < 0.999 ? "down" : "flat";
      return '<span class="' + cls + '">' + esc(self.armName(armor)) + "<b>×" + num(m, 2) + "</b></span>";
    });
    return '<div class="tt-row tt-dim">' + esc(this.str("vsArmor")) + " · " + esc(this.atkName(attackType)) + "</div>" +
      '<div class="tt-grid">' + cells.join("") + "</div>";
  };

  HUD.prototype._waveLine = function (attackType, dmg, canHitFlying, game) {
    const wave = this.currentWave(game);
    if (!wave) return "";
    const res = applyHit(dmg, attackType, wave.armorType, wave.armor, {
      flying: wave.flying,
      canHitFlying: canHitFlying !== false,
      spellImmune: wave.spellImmune,
    });
    const head = esc(this.str("vsWave")) + " " + esc(this.localName(wave.name)) +
      " (" + esc(this.armName(wave.armorType)) + " " + wave.armor + ")";
    if (res.blocked === "flying") {
      return '<div class="tt-row tt-warn">' + head + " · " + esc(this.str("cannotAir")) + "</div>";
    }
    if (res.blocked === "immune") {
      return '<div class="tt-row tt-warn">' + head + " · " + esc(this.str("immuneNote")) + "</div>";
    }
    const cls = res.multiplier > 1.001 ? "tt-good" : res.multiplier < 0.999 ? "tt-warn" : "tt-dim";
    return '<div class="tt-row ' + cls + '">' + head + " ×" + num(res.multiplier, 2) +
      " → " + esc(this.str("perHit")) + " " + num(res.damage) + "</div>";
  };

  HUD.prototype._specials = function (def) {
    const tags = [];
    if (def.splash) tags.push(this.str("splash") + " " + def.splash);
    if (def.slow) tags.push(this.str("slowFx") + " " + Math.round(def.slow * 100) + "%");
    if (def.poison) tags.push(this.str("poisonFx") + " " + def.poison);
    if (def.chain) tags.push(this.str("chainFx") + " ×" + def.chain);
    if (def.root) tags.push(this.str("rootFx") + " " + def.root + "s");
    return tags;
  };

  HUD.prototype._tipBuild = function (slot, game) {
    const def = slot.def;
    const cost = def.cost[0];
    const dps = def.rate[0] > 0 ? def.dmg[0] / def.rate[0] : 0;
    const poor = game.gold < cost;
    const out = [];
    out.push("<h4>" + esc(this.localName(def.name)) + " · " + esc(this.str(def.race)) + "</h4>");
    out.push('<div class="tt-row ' + (poor ? "tt-warn" : "") + '"><span class="cost">' +
      esc(this.str("cost")) + " " + cost + " " + esc(this.str("gold")) + "</span>" +
      (poor ? " — " + esc(this.str("needGold")) : "") + "</div>");
    out.push('<div class="tt-row">' + esc(this.atkName(def.attackType)) + " · " +
      esc(this.str("atk")) + " " + def.dmg[0] + " · " +
      esc(this.str("spd")) + " " + def.rate[0].toFixed(2) + "s · " +
      esc(this.str("dps")) + " " + num(dps, 1) + "</div>");
    out.push('<div class="tt-row tt-dim">' + esc(this.str("rng")) + " " + def.range[0] + " · " +
      (def.canHitFlying ? esc(this.str("canAir")) : esc(this.str("groundOnly"))) + "</div>");
    const tags = this._specials(def);
    if (tags.length) out.push('<div class="tt-row tt-good">' + esc(tags.join(" · ")) + "</div>");
    out.push('<div class="tt-row tt-dim">' + esc(this.localName(def.desc)) + "</div>");
    out.push(this._multiplierGrid(def.attackType));
    out.push(this._waveLine(def.attackType, def.dmg[0], def.canHitFlying, game));
    out.push(this._tipHotkey(slot));
    return out.join("");
  };

  HUD.prototype._tipUpgrade = function (slot, game) {
    const t = slot.tower;
    const def = t.def;
    const out = [];
    if (t.tier >= 3) {
      out.push("<h4>" + esc(this.localName(def.name)) + " T3</h4>");
      out.push('<div class="tt-row tt-dim">' + esc(this.str("maxTier")) + "</div>");
      out.push(this._multiplierGrid(t.attackType));
      out.push(this._waveLine(t.attackType, t.dmg, t.canHitFlying, game));
      out.push(this._tipHotkey(slot));
      return out.join("");
    }
    const next = t.tier; // index of next tier stats
    const cost = def.cost[next];
    const poor = game.gold < cost;
    const dpsNow = t.rate > 0 ? t.dmg / t.rate : 0;
    const dpsNext = def.rate[next] > 0 ? def.dmg[next] / def.rate[next] : 0;
    out.push("<h4>" + esc(this.str("upgradeTo")) + " " + esc(this.localName(def.name)) + " T" + (t.tier + 1) + "</h4>");
    out.push('<div class="tt-row ' + (poor ? "tt-warn" : "") + '"><span class="cost">' +
      esc(this.str("cost")) + " " + cost + " " + esc(this.str("gold")) + "</span>" +
      (poor ? " — " + esc(this.str("needGold")) : "") + "</div>");
    out.push('<div class="tt-row">' + esc(this.str("atk")) + " " + t.dmg + " → <b>" + def.dmg[next] + "</b> · " +
      esc(this.str("spd")) + " " + t.rate.toFixed(2) + " → <b>" + def.rate[next].toFixed(2) + "</b>s</div>");
    out.push('<div class="tt-row">' + esc(this.str("rng")) + " " + (t.range | 0) + " → <b>" + def.range[next] + "</b> · " +
      esc(this.str("dps")) + " " + num(dpsNow, 1) + " → <b>" + num(dpsNext, 1) + "</b></div>");
    out.push(this._multiplierGrid(t.attackType));
    out.push(this._waveLine(t.attackType, def.dmg[next], t.canHitFlying, game));
    out.push(this._tipHotkey(slot));
    return out.join("");
  };

  HUD.prototype._tipSell = function (slot, game) {
    const t = slot.tower;
    const refund = Math.floor(t.invested * 0.75);
    const out = [];
    out.push("<h4>" + esc(this.str("sell")) + " · " + esc(this.localName(t.def.name)) + " T" + t.tier + "</h4>");
    out.push('<div class="tt-row"><span class="cost">+' + refund + " " + esc(this.str("gold")) +
      "</span> " + esc(this.str("refundText")) + "</div>");
    out.push('<div class="tt-row tt-dim">' + esc(this.str("sellTip")) + "</div>");
    out.push(this._multiplierGrid(t.attackType));
    out.push(this._waveLine(t.attackType, t.dmg, t.canHitFlying, game));
    out.push(this._tipHotkey(slot));
    return out.join("");
  };

  HUD.prototype._tipAbility = function (slot, game) {
    const ab = slot.ability;
    const h = slot.hero;
    const cd = h.cd ? h.cd[slot.slotKey] || 0 : 0;
    const out = [];
    out.push("<h4>" + esc(this.localName(ab)) + "</h4>");
    const bits = [];
    if (ab.mana) bits.push(this.str("manaShort") + " " + ab.mana);
    if (ab.cd) bits.push(this.str("cdWord") + " " + ab.cd + "s");
    out.push('<div class="tt-row">' + esc(bits.join(" · ")) + "</div>");
    if (ab.dmg) {
      out.push('<div class="tt-row">' + esc(this.atkName("spells")) + " " + ab.dmg + "</div>");
      out.push(this._waveLine("spells", ab.dmg, true, game));
    }
    if (ab.aura) out.push('<div class="tt-row tt-good">' + esc(this.str("arm")) + "/aura " + ab.aura + "</div>");
    if (ab.crit) out.push('<div class="tt-row tt-good">×' + ab.crit + "</div>");
    if (ab.dur) out.push('<div class="tt-row tt-dim">' + ab.dur + "s</div>");
    if (cd > 0) out.push('<div class="tt-row tt-warn">' + esc(this.str("cdWord")) + " " + num(cd, 1) + "s</div>");
    else if (h.mana < (ab.mana || 0)) out.push('<div class="tt-row tt-warn">' + esc(this.str("manaShort")) + " " + (h.mana | 0) + " / " + ab.mana + "</div>");
    else out.push('<div class="tt-row tt-good">' + esc(this.str("castable")) + "</div>");
    out.push(this._tipHotkey(slot));
    return out.join("");
  };

  /** Which attack types counter a given armor type (the WC3 table, read down). */
  HUD.prototype._counterGrid = function (armorType) {
    const self = this;
    const cells = ["normal", "pierce", "siege", "magic", "hero", "spells"].map(function (atk) {
      const m = damageMultiplier(atk, armorType);
      const cls = m > 1.001 ? "up" : m < 0.999 ? "down" : "flat";
      return '<span class="' + cls + '">' + esc(self.atkName(atk)) + "<b>×" + num(m, 2) + "</b></span>";
    });
    return '<div class="tt-row tt-dim">' + esc(this.str("vsArmor")) + " · " + esc(this.armName(armorType)) + "</div>" +
      '<div class="tt-grid">' + cells.join("") + "</div>";
  };

  HUD.prototype.entityTipHtml = function (ent) {
    const game = this.app ? this.app.game : null;
    if (!ent || !game) return "";
    if (ent._dead || (ent.kind !== "tower" && ent.hp <= 0)) return "";
    if (ent.kind === "tower" && game.towers.indexOf(ent) < 0) return "";
    if (ent.kind === "tower") {
      const dps = ent.rate > 0 ? ent.dmg / ent.rate : 0;
      return "<h4>" + esc(this.localName(ent.def.name)) + " T" + ent.tier + "</h4>" +
        '<div class="tt-row">' + esc(this.atkName(ent.attackType)) + " · " +
        esc(this.str("atk")) + " " + ent.dmg + " · " + esc(this.str("spd")) + " " + ent.rate.toFixed(2) + "s · " +
        esc(this.str("dps")) + " " + num(dps, 1) + "</div>" +
        '<div class="tt-row tt-dim">' + esc(this.str("rng")) + " " + (ent.range | 0) + " · " +
        (ent.canHitFlying ? esc(this.str("canAir")) : esc(this.str("groundOnly"))) + "</div>" +
        this._multiplierGrid(ent.attackType) +
        this._waveLine(ent.attackType, ent.dmg, ent.canHitFlying, game);
    }
    if (ent.kind === "hero") {
      return "<h4>" + esc(this.localName(ent.def.name)) + " · " + esc(this.localName(ent.def.title)) + "</h4>" +
        '<div class="tt-row">HP ' + Math.max(0, ent.hp | 0) + " / " + ent.maxHp + " · " +
        esc(this.str("manaShort")) + " " + (ent.mana | 0) + " / " + ent.maxMana + "</div>" +
        '<div class="tt-row tt-dim">' + esc(this.str("atk")) + " " + ent.def.dmg + " " +
        esc(this.atkName("hero")) + " · " + esc(this.str("rng")) + " " + ent.def.range + "</div>";
    }
    const tower = game.selected && game.selected.kind === "tower" ? game.selected : null;
    const out = [];
    out.push("<h4>" + esc(this.localName(ent.name) || "Creep") + (ent.boss ? " ★" : "") + (ent.flying ? " ✈" : "") + "</h4>");
    out.push('<div class="tt-row">HP ' + Math.max(0, ent.hp | 0) + " / " + ent.maxHp + " · " +
      esc(this.str("arm")) + " " + esc(this.armName(ent.armorType)) + " " + ent.armor + "</div>");
    const flags = [];
    if (ent.flying) flags.push(this.str("flyNote"));
    if (ent.spellImmune) flags.push(this.str("immuneNote"));
    if (flags.length) out.push('<div class="tt-row tt-warn">' + esc(flags.join(" · ")) + "</div>");
    if (tower) {
      const res = applyHit(tower.dmg, tower.attackType, ent.armorType, ent.armor, {
        flying: ent.flying,
        canHitFlying: tower.canHitFlying !== false,
        spellImmune: ent.spellImmune,
      });
      const head = esc(this.localName(tower.def.name)) + " " + esc(this.atkName(tower.attackType));
      if (res.blocked) {
        out.push('<div class="tt-row tt-warn">' + head + " · " +
          esc(this.str(res.blocked === "flying" ? "cannotAir" : "immuneNote")) + "</div>");
      } else {
        const cls = res.multiplier > 1.001 ? "tt-good" : res.multiplier < 0.999 ? "tt-warn" : "tt-dim";
        out.push('<div class="tt-row ' + cls + '">' + head + " ×" + num(res.multiplier, 2) +
          " → " + esc(this.str("perHit")) + " " + num(res.damage) + "</div>");
      }
    }
    out.push(this._counterGrid(ent.armorType));
    return out.join("");
  };

  root.HUD = HUD;
})(typeof globalThis !== "undefined" ? globalThis : this);
