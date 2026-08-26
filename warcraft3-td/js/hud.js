(function (root) {
  "use strict";
  const D = root.GameData;

  function $(id) { return document.getElementById(id); }

  function HUD(app) {
    this.app = app;
    this.tooltip = $("tooltip");
  }

  HUD.prototype.str = function (key) {
    const lang = this.app.game ? this.app.game.lang : this.app.lang;
    return (D.STR[lang] || D.STR.zh)[key] || key;
  };

  HUD.prototype.refreshChrome = function () {
    $("btn-menu").textContent = this.str("menu");
    $("btn-allies").textContent = this.str("allies");
    $("btn-log").textContent = this.str("log");
    $("btn-settings").textContent = this.str("settings");
  };

  HUD.prototype.update = function (game) {
    if (!game) return;
    $("res-gold").textContent = game.gold | 0;
    $("res-lumber").textContent = game.lumber | 0;
    $("res-lives").textContent = game.lives | 0;
    $("res-wave").textContent = Math.min(game.waveIndex + (game.betweenWaves ? 1 : 1), 30) + " / 30";
    const secs = game.time | 0;
    $("res-time").textContent = ((secs / 60) | 0) + ":" + ("0" + (secs % 60)).slice(-2);
    const log = game.log[0];
    $("logline").textContent = log ? log.msg : "";
    this._selection(game);
    this._commands(game);
  };

  HUD.prototype._selection = function (game) {
    const sel = game.selected;
    const hp = $("bar-hp");
    const mp = $("bar-mp");
    const name = $("sel-name");
    const flavor = $("sel-flavor");
    const sAtk = $("stat-atk");
    const sArm = $("stat-arm");
    const sRng = $("stat-rng");
    const sSpd = $("stat-spd");
    if (!sel) {
      name.textContent = this.str("title");
      flavor.textContent = this.str("howTo");
      hp.style.width = "0%";
      mp.style.width = "0%";
      $("hp-text").textContent = "";
      $("mp-text").textContent = "";
      sAtk.textContent = "—";
      sArm.textContent = "—";
      sRng.textContent = "—";
      sSpd.textContent = "—";
      this.app.renderer.drawPortrait($("portrait"), null);
      return;
    }
    if (sel.kind === "tower") {
      const n = sel.def.name[game.lang];
      name.textContent = n + "  T" + sel.tier;
      flavor.textContent = sel.def.desc[game.lang] + "  [" + sel.attackType + "]";
      hp.style.width = "100%";
      mp.style.width = "0%";
      $("hp-text").textContent = "HP  ∞";
      $("mp-text").textContent = "";
      sAtk.textContent = sel.dmg + " " + sel.attackType;
      sArm.textContent = sel.def.armor + " fortified";
      sRng.textContent = sel.range | 0;
      sSpd.textContent = sel.rate.toFixed(2) + "s";
      this.app.renderer.drawPortrait($("portrait"), sel);
    } else if (sel.kind === "hero") {
      name.textContent = sel.def.name[game.lang] + " · " + sel.def.title[game.lang];
      flavor.textContent = game.lang === "zh" ? "右键移动，Q/W/E 施法。" : "Right-click move, Q/W/E cast.";
      hp.style.width = (100 * sel.hp / sel.maxHp) + "%";
      mp.style.width = (100 * sel.mana / sel.maxMana) + "%";
      $("hp-text").textContent = (sel.hp | 0) + " / " + sel.maxHp;
      $("mp-text").textContent = (sel.mana | 0) + " / " + sel.maxMana;
      sAtk.textContent = sel.def.dmg + " hero";
      sArm.textContent = "4 hero";
      sRng.textContent = sel.def.range;
      sSpd.textContent = sel.def.rate + "s";
      this.app.renderer.drawPortrait($("portrait"), sel);
    } else {
      const n = sel.name ? sel.name[game.lang] : "Creep";
      name.textContent = n + (sel.boss ? " ★" : "") + (sel.flying ? " ✈" : "");
      flavor.textContent = (game.lang === "zh" ? "护甲 " : "Armor ") + sel.armorType + " " + sel.armor +
        (sel.spellImmune ? (game.lang === "zh" ? " · 魔免" : " · spell immune") : "");
      hp.style.width = (100 * sel.hp / sel.maxHp) + "%";
      mp.style.width = "0%";
      $("hp-text").textContent = Math.max(0, sel.hp | 0) + " / " + sel.maxHp;
      $("mp-text").textContent = "";
      sAtk.textContent = "—";
      sArm.textContent = sel.armor + " " + sel.armorType;
      sRng.textContent = "—";
      sSpd.textContent = (sel.speed | 0);
      this.app.renderer.drawPortrait($("portrait"), sel);
    }
  };

  HUD.prototype._commands = function (game) {
    const grid = $("cmd");
    const labels = this._cmdLabels(game);
    const buttons = grid.querySelectorAll(".cmd-btn");
    for (let i = 0; i < buttons.length; i++) {
      const b = buttons[i];
      const info = labels[i];
      b.disabled = !info || info.disabled;
      b.classList.toggle("ready", !!(info && info.ready));
      b.dataset.act = info ? info.act : "";
      b.innerHTML = info
        ? '<span class="hk">' + info.hk + "</span>" + info.label
        : "";
      b.title = info ? info.tip || "" : "";
    }
  };

  HUD.prototype._cmdLabels = function (game) {
    const L = game.lang;
    const slots = new Array(12).fill(null);
    const towers = D.TOWERS;
    if (game.selected && game.selected.kind === "tower") {
      const t = game.selected;
      const upCost = t.tier < 3 ? t.def.cost[t.tier] : 0;
      slots[0] = {
        hk: "U", act: "upgrade",
        label: L === "zh" ? "升级<br>" + upCost + "金" : "Upgrade<br>" + upCost + "g",
        disabled: t.tier >= 3 || game.gold < upCost,
        ready: t.tier < 3 && game.gold >= upCost,
        tip: "Upgrade tower",
      };
      slots[1] = {
        hk: "S", act: "sell",
        label: L === "zh" ? "出售<br>" + Math.floor(t.invested * 0.75) + "金" : "Sell<br>" + Math.floor(t.invested * 0.75) + "g",
        ready: true,
      };
      slots[4] = { hk: "A", act: "cancel-build", label: L === "zh" ? "停止建造" : "Stop build" };
    } else if (game.selected && game.selected.kind === "hero") {
      const h = game.selected;
      [["q", "Q"], ["w", "W"], ["e", "E"]].forEach(function (pair, i) {
        const ab = h.def[pair[0]];
        slots[i] = {
          hk: pair[1],
          act: "cast-" + pair[0],
          label: ab[L] + (ab.mana ? "<br>" + ab.mana + "mp" : ""),
          disabled: h.cd[pair[0]] > 0 || h.mana < ab.mana,
          ready: h.cd[pair[0]] <= 0 && h.mana >= ab.mana,
        };
      });
    } else {
      for (let i = 0; i < 12 && i < towers.length; i++) {
        const def = towers[i];
        const cost = def.cost[0];
        slots[i] = {
          hk: "QWERASDFZXCV".charAt(i),
          act: "build-" + def.id,
          label: def.name[L] + "<br>" + cost,
          disabled: game.gold < cost,
          ready: game.gold >= cost && game.buildId === def.id,
          tip: def.desc[L],
        };
      }
    }
    return slots;
  };

  HUD.prototype.showTip = function (html, x, y) {
    const el = this.tooltip;
    el.innerHTML = html;
    el.style.left = x + 14 + "px";
    el.style.top = y + 14 + "px";
    el.classList.add("show");
  };
  HUD.prototype.hideTip = function () {
    this.tooltip.classList.remove("show");
  };

  root.HUD = HUD;
})(typeof globalThis !== "undefined" ? globalThis : this);
