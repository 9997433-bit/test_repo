import { BATTLE_STATE, createBattle } from "../../core/battle.js";
import { LAUNCH_X, LAUNCH_Y, MAX_AIM_DEG, MAX_SPEED, MIN_SPEED } from "../../core/sim.js";
import { hasUlt } from "../../core/skills.js";
import {
  applyDraft,
  createRaidLevel,
  createRogueLevel,
  createTowerLevel,
  rollDraft,
  stageByIndex,
} from "../../modes/index.js";
import { button, clear, el, mount } from "../dom.js";
import { createRenderer } from "../render.js";
import { heroCanvas } from "../widgets.js";

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

function buildLevel(app, params) {
  switch (params.mode) {
    case "tower":
      return createTowerLevel(params.floor ?? app.save.towerFloor ?? 1);
    case "rogue":
      return createRogueLevel();
    case "raid":
      return createRaidLevel();
    case "adventure":
    default:
      return stageByIndex(params.stageIndex ?? app.save.adventureStage ?? 1);
  }
}

export const battleScreen = {
  id: "battle",
  mount(app, root, params = {}) {
    const mode = params.mode ?? "adventure";
    const level = buildLevel(app, params);
    const loadout = app.loadout(mode === "rogue" ? { flatLevel: 5 } : {});
    if (!loadout.heroes.length) {
      mount(root, el("p", { class: "hint", text: "队伍为空，请先编队。" }), button("去编队", () => app.navigate("team")));
      return {};
    }

    app.audio.setMood(level.boss || mode === "raid" ? "boss" : "battle");
    app.audio.startMusic(level.boss || mode === "raid" ? "boss" : "battle");

    const canvas = el("canvas", { class: "battle-canvas", width: 480, height: 800 });
    const renderer = createRenderer(canvas);
    const battle = createBattle({
      level,
      loadout,
      audio: app.audio,
      settings: app.save.settings,
      seed: `${mode}-${level.id}`,
      onEvent: (type, payload) => app.bus.emit(`battle:${type}`, payload),
    });

    // —— HUD ——
    const hpFill = el("i", { class: "bar-fill hp" });
    const hpText = el("span", { class: "hud-hp-text" });
    const comboBadge = el("div", { class: "combo-badge" });
    const turnText = el("span", { class: "hud-turn" });
    const timerText = el("span", { class: "hud-timer" });
    const shieldText = el("span", { class: "hud-shield" });

    const hudTop = el("div", { class: "hud-top" }, [
      el("button", { class: "icon-btn small", type: "button", onclick: () => openPause(), text: "❚❚" }),
      el("div", { class: "hud-center" }, [
        el("span", { class: "hud-title", text: level.name }),
        el("div", { class: "hud-bar" }, [hpFill]),
        hpText,
      ]),
      el("div", { class: "hud-right" }, [turnText, timerText, shieldText]),
    ]);

    const dock = el("div", { class: "hud-dock" });
    const ultBtn = el("button", { class: "ult-btn", type: "button", onclick: () => castUlt() }, [
      el("span", { class: "ult-icon", text: "✦" }),
      el("span", { class: "ult-label", text: "大招" }),
    ]);
    const hint = el("div", { class: "aim-hint", text: "按住画面拖拽瞄准，松手发射（空格也可发射）" });

    mount(root, canvas, hudTop, hint, dock, ultBtn);

    const heroButtons = battle.heroes.map((hero, i) => {
      const ring = el("i", { class: "energy-ring" });
      const node = el("button", { class: "hero-slot", type: "button", onclick: () => selectHero(i) }, [
        ring,
        heroCanvas(hero, 42),
        el("span", { class: "hero-slot-name", text: hero.name }),
        el("span", { class: "hero-slot-key", text: String(i + 1) }),
      ]);
      return { node, ring, hero };
    });
    mount(dock, ...heroButtons.map((h) => h.node));

    function selectHero(i) {
      if (battle.selectHero(i)) syncHud();
    }
    function castUlt() {
      if (!battle.castUlt()) app.toast("能量不足或此时不可释放", "warn");
      syncHud();
    }

    // —— 输入 ——
    let dragging = false;
    function toWorld(e) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * 480,
        y: ((e.clientY - rect.top) / rect.height) * 800,
      };
    }
    function aimAt(pt) {
      const dx = pt.x - LAUNCH_X;
      const dy = Math.max(6, pt.y - LAUNCH_Y);
      const angle = (Math.atan2(dx, dy) * 180) / Math.PI;
      const dist = Math.hypot(dx, dy);
      battle.setAim(clamp(angle, -MAX_AIM_DEG, MAX_AIM_DEG), clamp(dist / 460, 0.12, 1));
    }
    canvas.addEventListener("pointerdown", (e) => {
      app.audio.unlock();
      if (!battle.canFire()) return;
      dragging = true;
      canvas.setPointerCapture(e.pointerId);
      aimAt(toWorld(e));
      hint.classList.add("hidden");
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      aimAt(toWorld(e));
    });
    const release = (e) => {
      if (!dragging) return;
      dragging = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch { /* pointer 已释放 */ }
      battle.fire();
      syncHud();
    };
    canvas.addEventListener("pointerup", release);
    canvas.addEventListener("pointercancel", () => { dragging = false; });

    // —— 结算 / 弹窗 ——
    let ended = false;
    let endScheduled = false;
    function finish() {
      if (ended) return;
      ended = true;
      app.audio.setMood("menu");
      app.navigate("result", { mode, level, params, result: battle.result, battle }, { replace: true });
    }

    function openPause() {
      if (battle.state === BATTLE_STATE.WON || battle.state === BATTLE_STATE.LOST) return;
      battle.paused = true;
      app.audio.play("ui");
      app.modal((box, close) => {
        const resume = () => { battle.paused = false; close(); };
        mount(box, 
          el("h3", { text: "暂停" }),
          el("p", { class: "muted small", text: `${level.name} · 回合 ${battle.turn}` }),
          el("div", { class: "detail-actions" }, [
            button("继续", resume, { variant: "primary" }),
            button("重新开始", () => { close(); app.navigate("battle", params, { replace: true }); }),
            button("放弃并退出", () => {
              close();
              ended = true;
              app.audio.setMood("menu");
              app.navigate(mode === "adventure" ? "adventure" : "menu", {}, { replace: true });
            }, { variant: "ghost" }),
          ]),
        );
      });
    }

    function openDraft() {
      battle.paused = true;
      const options = rollDraft(battle, app.save.owned, level.id);
      app.audio.play("charged");
      app.modal((box, close) => {
        mount(box, 
          el("h3", { text: `第 ${battle.wave} 波 · 三选一` }),
          el("div", { class: "draft-row" },
            options.map((opt) =>
              el("button", { class: "draft-card", type: "button", onclick: () => {
                applyDraft(battle, opt, loadout);
                if (opt.kind === "hero") rebuildDock();
                battle.paused = false;
                battle.pendingDraft = false;
                close();
                syncHud();
              } }, [
                opt.kind === "hero"
                  ? heroCanvas(opt.hero, 64, "full")
                  : el("span", { class: "draft-icon", text: "✦" }),
                el("b", { text: opt.kind === "hero" ? opt.hero.name : opt.artifact.name }),
                el("span", { class: "muted small", text: opt.kind === "hero" ? opt.hero.passive : opt.artifact.desc }),
              ]),
            ),
          ),
        );
      });
    }

    function rebuildDock() {
      clear(dock);
      heroButtons.length = 0;
      battle.heroes.forEach((hero, i) => {
        const ring = el("i", { class: "energy-ring" });
        const node = el("button", { class: "hero-slot", type: "button", onclick: () => selectHero(i) }, [
          ring,
          heroCanvas(hero, 42),
          el("span", { class: "hero-slot-name", text: hero.name }),
          el("span", { class: "hero-slot-key", text: String(i + 1) }),
        ]);
        heroButtons.push({ node, ring, hero });
        dock.appendChild(node);
      });
    }

    // —— HUD 同步 ——
    let hudTimer = 0;
    function syncHud() {
      const ratio = battle.playerHp / battle.playerMaxHp;
      hpFill.style.width = `${Math.max(0, ratio) * 100}%`;
      hpFill.style.background = ratio > 0.35 ? "linear-gradient(90deg,#7ee08a,#3ee0c5)" : "linear-gradient(90deg,#ff4d6d,#ff8a3d)";
      hpText.textContent = `${Math.max(0, Math.round(battle.playerHp))}/${battle.playerMaxHp}`;
      turnText.textContent = battle.endless ? `第 ${battle.wave} 波` : `回合 ${battle.turn}`;
      timerText.textContent = battle.timeLimit ? `⏱ ${Math.max(0, battle.timeLimit - battle.elapsed).toFixed(1)}s` : `敌 ${battle.aliveEnemies().length}`;
      shieldText.textContent = battle.shields > 0 ? `🛡×${battle.shields}` : "";
      comboBadge.textContent = battle.combo > 1 ? `${battle.combo} COMBO` : "";
      comboBadge.className = `combo-badge ${battle.combo > 1 ? "on" : ""} ${battle.combo >= 10 ? "hot" : ""}`;

      const active = battle.activeHero();
      heroButtons.forEach(({ node, ring, hero }, i) => {
        const live = battle.heroes[i] ?? hero;
        const pct = Math.round((live.energy / live.maxEnergy) * 100);
        ring.style.background = `conic-gradient(var(--yolk) ${pct}%, rgba(255,255,255,0.12) ${pct}%)`;
        node.classList.toggle("active", i === battle.activeIndex);
        node.classList.toggle("ready", live.energy >= live.maxEnergy);
      });
      const ready = active && active.energy >= active.maxEnergy && hasUlt(active.id);
      ultBtn.classList.toggle("ready", !!ready);
      ultBtn.querySelector(".ult-label").textContent = active?.ult?.name ?? "大招";
    }

    if (!root.contains(comboBadge)) root.appendChild(comboBadge);
    syncHud();

    return {
      tick(dt) {
        battle.update(dt);
        renderer.draw(battle);
        hudTimer += dt;
        if (hudTimer > 0.06) {
          hudTimer = 0;
          syncHud();
        }
        if (battle.pendingDraft && !battle.paused && battle.state === BATTLE_STATE.AIM) openDraft();
        const over = battle.state === BATTLE_STATE.WON || battle.state === BATTLE_STATE.LOST;
        if (over && !endScheduled) {
          endScheduled = true;
          setTimeout(finish, 950);
        }
      },
      onKey(e) {
        if (e.key === "Escape") { openPause(); return; }
        if (battle.paused) return;
        if (e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          if (battle.canFire()) battle.fire();
          syncHud();
          return;
        }
        if (e.key.toLowerCase() === "q") { castUlt(); return; }
        if (e.key === "ArrowLeft") { battle.setAim(battle.aim.angle - 2.5, battle.aim.power); return; }
        if (e.key === "ArrowRight") { battle.setAim(battle.aim.angle + 2.5, battle.aim.power); return; }
        if (e.key === "ArrowUp") { battle.setAim(battle.aim.angle, battle.aim.power + 0.05); return; }
        if (e.key === "ArrowDown") { battle.setAim(battle.aim.angle, battle.aim.power - 0.05); return; }
        if (/^[1-5]$/.test(e.key)) selectHero(Number(e.key) - 1);
      },
      destroy() {
        app.audio.setMood("menu");
      },
    };
  },
};

export const BATTLE_AIM_LIMITS = { MIN_SPEED, MAX_SPEED, LAUNCH_X, LAUNCH_Y };
